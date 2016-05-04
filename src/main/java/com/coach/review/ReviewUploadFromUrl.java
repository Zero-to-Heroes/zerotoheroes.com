package com.coach.review;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.amazonaws.util.StringUtils;
import com.coach.core.notification.SlackNotifier;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthority;
import com.coach.plugin.Plugin;
import com.coach.profile.ProfileRepository;
import com.coach.reputation.ReputationAction;
import com.coach.reputation.ReputationUpdater;
import com.coach.review.Review.Sport;
import com.coach.review.replay.ReplayProcessor;
import com.coach.review.video.transcoding.Transcoder;
import com.coach.sport.SportManager;
import com.coach.subscription.SubscriptionManager;
import com.coach.user.UserRepository;
import com.coach.user.UserService;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/fromurl")
@Slf4j
public class ReviewUploadFromUrl {
	
	private static final String ARENADRAFTS_DECK_ID_REGEX = "\\[?(http:\\/\\/(www\\.)?arenadrafts\\.com\\/Arena\\/View\\/)([\\d\\-a-zA-Z\\-]+)\\]?";

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	ReviewService reviewService;

	@Autowired
	UserRepository userRepo;

	@Autowired
	UserService userService;

	@Autowired
	ProfileRepository profileRepo;

	@RequestMapping(value = "/{sport}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> importFromUrl(@PathVariable("reviewId") final String sport,
			@RequestBody String url) throws IOException {

		String authorId = null;
		String author = null;

		// Add current logged in user as the author of the review
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		// log.info("authorities are " + authorities);
		if (!StringUtils.isNullOrEmpty(currentUser) && !UserAuthority.isAnonymous(authorities)) {
			// log.debug("Setting current user as review author " +
			// currentUser);
			User user = userRepo.findByUsername(currentUser);
			authorId = user.getId();
			author = currentUser;
		}

		Review review = new Review();
		review.setSport(Review.Sport.load(sport));

		// Switch depending on the url integration
		

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/publish", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> publish(@PathVariable("reviewId") final String id,
			@RequestBody Review inputReview) throws IOException {

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();

		Review review = reviewRepo.findById(id);

		// log.debug("Publishing review " + inputReview);
		// log.debug("Exisint draft in the system is " + review);

		// Updating author information
		if (!StringUtils.isNullOrEmpty(currentUser) && !UserAuthority.isAnonymous(authorities)) {
			addAuthorInformation(inputReview.getSport(), review, currentUser);
		}
		else {
			User user = userRepo.findByUsername(inputReview.getAuthor());
			if (user != null) {
				log.debug("Name not authorized: " + inputReview.getAuthor() + ". Found user: " + user);
				return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
			}
			review.setAuthor(inputReview.getAuthor());
		}

		review.setText(inputReview.getText());
		review.setPlugins(inputReview.getPlugins());
		consolidateCanvas(currentUser, review, review, inputReview.getCanvas());
		activatePlugins(currentUser, review, review);
		// log.debug("updated text is " + review.getText());

		review.setSport(inputReview.getSport());
		review.setTitle(inputReview.getTitle());
		review.setTags(inputReview.getTags());
		review.setParticipantDetails(inputReview.getParticipantDetails());

		review.setLastModifiedDate(new Date());
		review.setLastModifiedBy(currentUser);
		review.setLanguage(inputReview.getLanguage());
		review.setPublished(true);

		reviewService.updateAsync(review);

		// Send notifications only if it's a real new video and
		// not a video response
		if (!review.isSequence()) {
			subscriptionManager.notifyNewReview(review.getSport(), review);
			slackNotifier.notifyNewReview(review);
		}
		log.debug("Published review is " + review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/{commentId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> updateComment(@PathVariable("reviewId") final String reviewId,
			@PathVariable("commentId") final int commentId, @RequestBody Comment newComment) throws IOException {

		Review review = reviewRepo.findById(reviewId);
		Comment comment = review.getComment(commentId);

		// Security
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		User user = userRepo.findByUsername(currentUser);
		// Disallow anonymous edits
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
		}
		else if (!currentUser.equals(comment.getAuthor()) && !user.canEdit()) { return new ResponseEntity<Review>(
				(Review) null, HttpStatus.UNAUTHORIZED); }

		consolidateCanvas(currentUser, review, newComment, newComment.getTempCanvas());
		activatePlugins(currentUser, review, newComment);
		comment.setText(newComment.getText());

		review.setLastModifiedDate(new Date());
		review.setLastModifiedBy(currentUser);

		// See if there are external references to videos in the comment
		commentParser.parseComment(review, comment);
		review.sortComments();
		reviewService.updateAsync(review);

		comment.setTempCanvas(review.getCanvas());
		// slackNotifier.notifyCommentUpdate(review, comment);
		// sportManager.addCommentUpdatedActivity(user, review, comment);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	private void activatePlugins(String currentUser, Review review, HasText textHolder) {
		com.coach.sport.Sport sportEntity = sportManager.findById(review.getSport().getKey());
		for (String pluginClass : sportEntity.getPlugins()) {
			try {
				Plugin plugin = (Plugin) Class.forName(pluginClass).newInstance();
				beanFactory.autowireBean(plugin);
				String newText = plugin.execute(currentUser,
						review.getPluginData(sportEntity.getId(), plugin.getName()), textHolder);
				// log.debug("Plugin data " + review.getPlugins());
				textHolder.setText(newText);
			}
			catch (Exception e) {
				log.warn("Incorrect plugin execution " + pluginClass, e);
			}
		}
	}

	private void addAuthorInformation(Sport sport, HasReputation entity, String currentUser) {
		entity.setAuthor(currentUser);
		// Add the ID of the author in addition to the name (we still keep
		// the name
		User user = userRepo.findByUsername(currentUser);
		entity.setAuthorId(user.getId());
		// by default a poster likes his post
		reputationUpdater.updateReputationAfterAction(sport, entity.getReputation(), ReputationAction.Upvote,
				entity.getAuthorId(), user);
		entity.setAuthorReputation(user.getReputation(sport));
	}
}
