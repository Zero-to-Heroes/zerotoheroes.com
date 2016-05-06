package com.coach.review;

import java.io.IOException;
import java.util.Collection;
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.amazonaws.util.StringUtils;
import com.coach.core.notification.SlackNotifier;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthority;
import com.coach.plugin.IntegrationPlugin;
import com.coach.plugin.Plugin;
import com.coach.profile.ProfileRepository;
import com.coach.sport.SportManager;
import com.coach.subscription.SubscriptionManager;
import com.coach.user.UserRepository;
import com.coach.user.UserService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/fromurl")
@Slf4j
public class ReviewUploadFromUrl {

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

	@Autowired
	SportManager sportManager;

	@Autowired
	AutowireCapableBeanFactory beanFactory;

	@Autowired
	SubscriptionManager subscriptionManager;

	@Autowired
	SlackNotifier slackNotifier;

	@RequestMapping(value = "/{sport}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> importFromUrl(@PathVariable("sport") final String sport,
			@RequestBody UrlInput url) throws IOException {

		log.debug("Yeah yeah " + url);
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
		review.setAuthor(author);
		review.setAuthorId(authorId);
		review.setCreationDate(new Date());
		review.setLastModifiedBy(review.getAuthor());
		reviewRepo.save(review);

		// Switch depending on the url integration
		parseIntegrations(review, url.getUrl());

		if (review.getMediaType() == null) {
			slackNotifier.notifyUnsupportedUrlImport(url, userRepo.findByUsername(currentUser));
		}
		else {
			subscriptionManager.subscribe(review, review.getAuthorId());
			subscriptionManager.subscribe(review.getSport(), review.getAuthorId());
		}

		log.debug("Returning review " + review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	private void parseIntegrations(Review review, String url) {
		com.coach.sport.Sport sportEntity = sportManager.findById(review.getSport().getKey());
		for (String pluginClass : sportEntity.getPlugins()) {
			try {
				Plugin plugin = (Plugin) Class.forName(pluginClass).newInstance();
				if (plugin instanceof IntegrationPlugin) {
					beanFactory.autowireBean(plugin);
					IntegrationPlugin integrationPlugin = (IntegrationPlugin) plugin;
					if (integrationPlugin.isApplicable(url)) {
						log.debug("Applying plugin " + plugin);
						integrationPlugin.integrateRemoteData(url, review);
					}
				}
			}
			catch (Exception e) {
				log.warn("Incorrect plugin execution " + pluginClass, e);
			}
		}
	}

	// @RequestMapping(value = "/{reviewId}/publish", method =
	// RequestMethod.POST)
	// public @ResponseBody ResponseEntity<Review>
	// publish(@PathVariable("reviewId") final String id,
	// @RequestBody Review inputReview) throws IOException {
	//
	// String currentUser =
	// SecurityContextHolder.getContext().getAuthentication().getName();
	// Collection<? extends GrantedAuthority> authorities =
	// SecurityContextHolder.getContext().getAuthentication()
	// .getAuthorities();
	//
	// Review review = reviewRepo.findById(id);
	//
	// // log.debug("Publishing review " + inputReview);
	// // log.debug("Exisint draft in the system is " + review);
	//
	// // Updating author information
	// if (!StringUtils.isNullOrEmpty(currentUser) &&
	// !UserAuthority.isAnonymous(authorities)) {
	// addAuthorInformation(inputReview.getSport(), review, currentUser);
	// }
	// else {
	// User user = userRepo.findByUsername(inputReview.getAuthor());
	// if (user != null) {
	// log.debug("Name not authorized: " + inputReview.getAuthor() + ". Found
	// user: " + user);
	// return new ResponseEntity<Review>((Review) null,
	// HttpStatus.UNAUTHORIZED);
	// }
	// review.setAuthor(inputReview.getAuthor());
	// }
	//
	// review.setText(inputReview.getText());
	// review.setPlugins(inputReview.getPlugins());
	// consolidateCanvas(currentUser, review, review, inputReview.getCanvas());
	// activatePlugins(currentUser, review, review);
	// // log.debug("updated text is " + review.getText());
	//
	// review.setSport(inputReview.getSport());
	// review.setTitle(inputReview.getTitle());
	// review.setTags(inputReview.getTags());
	// review.setParticipantDetails(inputReview.getParticipantDetails());
	//
	// review.setLastModifiedDate(new Date());
	// review.setLastModifiedBy(currentUser);
	// review.setLanguage(inputReview.getLanguage());
	// review.setPublished(true);
	//
	// reviewService.updateAsync(review);
	//
	// // Send notifications only if it's a real new video and
	// // not a video response
	// if (!review.isSequence()) {
	// subscriptionManager.notifyNewReview(review.getSport(), review);
	// slackNotifier.notifyNewReview(review);
	// }
	// log.debug("Published review is " + review);
	//
	// return new ResponseEntity<Review>(review, HttpStatus.OK);
	// }

}
