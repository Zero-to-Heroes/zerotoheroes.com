package com.coach.review;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthority;
import com.coach.reputation.ReputationAction;
import com.coach.reputation.ReputationUpdater;
import com.coach.review.video.transcoding.Transcoder;
import com.coach.user.UserRepository;

@RepositoryRestController
@RequestMapping(value = "/api/reviews")
@Slf4j
public class ReviewApiHandler {

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	UserRepository userRepo;

	@Autowired
	MongoTemplate mongoTemplate;

	@Autowired
	EmailNotifier emailNotifier;

	@Autowired
	CommentParser commentParser;

	@Autowired
	Transcoder transcoder;

	@Autowired
	ReputationUpdater reputationUpdater;

	public ReviewApiHandler() {
		log.debug("Initializing Review Api Handler");
	}

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<List<Review>> listAllReviews(
			@RequestParam(value = "userName", required = false) String userName,
			@RequestParam(value = "sport", required = false) String sport) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		log.debug("Retrieving all reviews");

		List<Review> reviews = null;
		log.debug("userName param is " + userName);
		log.debug("sport param is " + sport);

		// Sorting in ascending order
		Sort newestFirst = new Sort(Sort.Direction.DESC,
				Arrays.asList("sortingDate", "creationDate", "lastModifiedDate"));

		if ("meta".equalsIgnoreCase(sport)) {
			reviews = reviewRepo.findAll(userName, sport, newestFirst);
		}
		else {
			reviews = reviewRepo.findAllWithKey(userName, sport, newestFirst);
		}

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		User user = userRepo.findByUsername(currentUser);
		String userId = user != null ? user.getId() : "";
		// tweak info about reputation
		reputationUpdater.modifyReviewsAccordingToUser(reviews, userId);

		return new ResponseEntity<List<Review>>(reviews, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Review> getReviewById(@PathVariable("reviewId") final String id) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		Review review = reviewRepo.findById(id);

		// Increase the view count
		if (review.isTranscodingDone()) {
			review.incrementViewCount();
		}

		// Sort the comments. We'll probably need this for a rather long time,
		// as our sorting algorithm will evolve
		review.sortComments();

		denormalizeReputations(review);

		updateReview(review);

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		User user = userRepo.findByUsername(currentUser);
		String userId = user != null ? user.getId() : "";
		review.prepareForDisplay(userId);
		log.debug("Returning review " + review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> createReview(@RequestBody Review review) throws IOException {

		// TOOD: checks
		// Add current logged in user as the author of the review
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		log.info("Current user is " + currentUser);
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		log.info("authorities are " + authorities);

		if (!StringUtils.isNullOrEmpty(currentUser) && !UserAuthority.isAnonymous(authorities)) {
			log.debug("Setting current user as review author " + currentUser);
			review.setAuthor(currentUser);
			// Add the ID of the author in addition to the name (we still keep
			// the name
			User user = userRepo.findByUsername(currentUser);
			review.setAuthorId(user.getId());
			// by default a poster likes his post
			reputationUpdater.updateReputationAfterAction(review.getSport(), review.getReputation(),
					ReputationAction.Upvote,
					review.getAuthorId(), user);
			review.setAuthorReputation(user.getReputation(review.getSport()) + 1);
		}
		// If anonymous, make sure the user doesn't use someone else's name
		else {
			log.debug("Validating that the name used to created the review is allowed");
			User user = userRepo.findByUsername(review.getAuthor());
			if (user != null) {
				log.debug("Name not allowed: " + review.getAuthor());
				return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
			}
		}

		log.debug("Review request creation: " + review);

		// Create the entry on the database
		review.setCreationDate(new Date());
		review.setLastModifiedBy(review.getAuthor());

		updateReview(review);
		log.debug("Saved review with ID: " + review.getId());

		// Start transcoding
		if (!StringUtils.isNullOrEmpty(review.getTemporaryKey())) {
			log.debug("Transcoding video");
			transcoder.transcode(review.getId());
		}

		log.debug("Transcoding started, returning with created review: " + review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> addComment(@PathVariable("reviewId") final String id,
			@RequestBody Comment comment) throws IOException {

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		log.info("Current user is " + currentUser);
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		log.info("authorities are " + authorities);

		// Adding the comment
		log.debug("Adding comment " + comment + " to review " + id);

		Review review = reviewRepo.findById(id);

		// Security
		// Add current logged in user as the author of the review
		if (!StringUtils.isNullOrEmpty(currentUser) && !UserAuthority.isAnonymous(authorities)) {
			log.debug("Setting current user as review author " + currentUser);
			comment.setAuthor(currentUser);
			// Add the ID of the author in addition to the name (we still keep
			// the nmae
			User user = userRepo.findByUsername(currentUser);
			comment.setAuthorId(user.getId());
			reputationUpdater.updateReputationAfterAction(review.getSport(), comment.getReputation(),
					ReputationAction.Upvote,
					comment.getAuthorId(), user);
			comment.setAuthorReputation(user.getReputation(review.getSport()) + 1);
		}
		// If anonymous, make sure the user doesn't use someone else's name
		else {
			log.debug("Validating that the name used to created the review is allowed");
			User user = userRepo.findByUsername(comment.getAuthor());
			if (user != null) {
				log.debug("Name not allowed: " + comment.getAuthor());
				return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
			}
		}

		comment.setCreationDate(new Date());
		review.addComment(comment);
		review.sortComments();
		review.setLastModifiedDate(new Date());
		review.setLastModifiedBy(comment.getAuthor());

		// See if there are external references to videos in the comment
		commentParser.parseComment(review, comment);
		updateReview(review);

		User user = userRepo.findByUsername(currentUser);
		String userId = user != null ? user.getId() : "";
		review.prepareForDisplay(userId);

		// Notifying the user who submitted the review (if he is registered)
		emailNotifier.notifyNewComment(comment, review);

		log.debug("Created comment " + comment + " with id " + comment.getId());

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/information", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> updateInformation(@PathVariable("reviewId") final String id,
			@RequestBody Review inputReview) throws IOException {

		Review review = reviewRepo.findById(id);

		// Security
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		// Disallow anonymous edits
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
		}
		// Disable edits when you're not the author
		else if (!currentUser.equals(
				review.getAuthor())) { return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED); }

		log.debug("Upading review with " + inputReview);

		review.setDescription(inputReview.getDescription());
		review.setSport(inputReview.getSport());
		review.setTitle(inputReview.getTitle());
		review.setTags(inputReview.getTags());
		updateReview(review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/{commentId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Comment> updateComment(@PathVariable("reviewId") final String reviewId,
			@PathVariable("commentId") final int commentId, @RequestBody Comment newComment) throws IOException {

		Review review = reviewRepo.findById(reviewId);
		Comment comment = review.getComment(commentId);

		// Security
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		// Disallow anonymous edits
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			return new ResponseEntity<Comment>((Comment) null, HttpStatus.UNAUTHORIZED);
		}
		// Disable edits when you're not the author
		else if (!currentUser.equals(
				comment.getAuthor())) { return new ResponseEntity<Comment>((Comment) null, HttpStatus.UNAUTHORIZED); }

		comment.setText(newComment.getText());

		review.setLastModifiedDate(new Date());
		review.setLastModifiedBy(comment.getAuthor());

		// See if there are external references to videos in the comment
		commentParser.parseComment(review, comment);
		updateReview(review);

		return new ResponseEntity<Comment>(comment, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/{commentId}/reply", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> reply(@PathVariable("reviewId") final String reviewId,
			@PathVariable("commentId") final String commentId,
			@RequestBody Comment reply) throws IOException {

		Review review = reviewRepo.findById(reviewId);
		Comment comment = review.getComment(Integer.parseInt(commentId));

		// Security
		String currentUser =
				SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		// Add current logged in user as the author of the review
		if (!StringUtils.isNullOrEmpty(currentUser) && !UserAuthority.isAnonymous(authorities)) {
			log.debug("Setting current user as review author " + currentUser);
			reply.setAuthor(currentUser);
			// Add the ID of the author in addition to the name (we still keep
			// the nmae
			User user = userRepo.findByUsername(currentUser);
			reply.setAuthorId(user.getId());
			reputationUpdater.updateReputationAfterAction(review.getSport(), reply.getReputation(),
					ReputationAction.Upvote,
					reply.getAuthorId(), user);
			reply.setAuthorReputation(user.getReputation(review.getSport()) + 1);
		}
		// If anonymous, make sure the user doesn't use someone else's name
		else {
			log.debug("Validating that the name used to created the review is allowed");
			User user = userRepo.findByUsername(reply.getAuthor());
			if (user != null) {
				log.debug("Name not allowed: " + reply.getAuthor());
				return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
			}
		}

		// Adding the comment
		log.debug("Adding reply " + reply + " to review " + review + " and comment " + comment);

		reply.setCreationDate(new Date());
		review.addComment(comment, reply);
		review.setLastModifiedDate(new Date());
		review.setLastModifiedBy(reply.getAuthor());

		// See if there are external references to videos in the comment
		commentParser.parseComment(review, reply);
		updateReview(review);

		User user = userRepo.findByUsername(currentUser);
		String userId = user != null ? user.getId() : "";
		review.prepareForDisplay(userId);

		// Notifying the user who submitted the review (if he is registered)
		emailNotifier.notifyNewComment(reply, review);

		log.debug("Created reply " + reply + " with id " + reply.getId());

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/{commentId}/validate", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Comment> toggleHelpful(@PathVariable("reviewId") final String reviewId,
			@PathVariable("commentId") final String commentId) throws IOException {

		Review review = reviewRepo.findById(reviewId);
		Comment comment = review.getComment(Integer.parseInt(commentId));

		// Security
		String currentUser =
				SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();

		// No anonymous access
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) { return new ResponseEntity<Comment>(
				(Comment) null, HttpStatus.UNAUTHORIZED); }

		log.debug("Validating that the logged in user is the review author");
		User user = userRepo.findByUsername(currentUser);
		if (!user.getId().equals(review.getAuthorId())) { return new ResponseEntity<Comment>((Comment) null,
				HttpStatus.UNAUTHORIZED); }

		comment.setHelpful(!comment.isHelpful());

		// Update the reputation only if the review author and comment author
		// are different to avoid self-boosting
		if (!StringUtils.isNullOrEmpty(comment.getAuthorId()) && !comment.getAuthorId().equals(review.getAuthorId())) {
			ReputationAction action = comment.isHelpful() ? ReputationAction.Helpful : ReputationAction.LostHelpful;
			reputationUpdater.updateReputation(review.getSport(), action, comment.getAuthorId());
		}

		updateReview(review);

		return new ResponseEntity<Comment>(comment, HttpStatus.OK);
	}

	@RequestMapping(value = "/suggestion/comment/{sport}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Review> getRecommendedReviewForComment(@PathVariable("sport") final String sport) {

		String currentUser =
				SecurityContextHolder.getContext().getAuthentication().getName();

		List<Review> reviews = null;
		log.debug("Retrieving recommended review for " + sport);

		// Sorting in ascending order
		Sort newestFirst = new Sort(Sort.Direction.DESC,
				Arrays.asList("sortingDate", "creationDate", "lastModifiedDate"));

		Review recommended = null;
		if (!"meta".equalsIgnoreCase(sport)) {
			reviews = reviewRepo.findAllWithKey(null, sport, newestFirst);
			log.debug("All reviews " + reviews);

			// TODO: do that in the DB directly?
			List<Review> result = new ArrayList<>();
			for (Review review : reviews) {
				if (review.getAuthor() != null && !review.getAuthor().equals(currentUser)
						&& (review.getComments() == null || review.getComments().isEmpty())) {
					result.add(review);
				}
			}
			log.debug("Filtered reviews " + result);

			// Take a random video
			if (!result.isEmpty()) {
				int index = new Random().nextInt(result.size());
				recommended = result.get(index);
			}
		}
		log.debug("Recommended " + recommended);

		return new ResponseEntity<Review>(recommended, HttpStatus.OK);
	}

	@RequestMapping(value = "/suggestion/comment", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Review> getRecommendedReviewForComment() {

		return new ResponseEntity<Review>((Review) null, HttpStatus.OK);
	}

	private void updateReview(Review review) {
		mongoTemplate.save(review);
	}

	private void denormalizeReputations(Review review) {
		List<String> userIds = review.getAllAuthors();
		Iterable<User> users = userRepo.findAll(userIds);

		Map<String, User> userMap = new HashMap<>();
		for (User user : users) {
			userMap.put(user.getId(), user);
		}
		review.normalizeUsers(userMap);
	}
}
