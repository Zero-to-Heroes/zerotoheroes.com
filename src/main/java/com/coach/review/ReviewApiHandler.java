package com.coach.review;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoOperations;
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
import com.coach.core.notification.DiscordNotifier;
import com.coach.core.notification.SlackNotifier;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthority;
import com.coach.notifications.Notification;
import com.coach.notifications.NotificationDao;
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

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/reviews")
@Slf4j
public class ReviewApiHandler {

	private static final int PAGE_SIZE = 100;

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	ReviewService reviewService;

	@Autowired
	ReviewDao reviewDao;

	@Autowired
	UserRepository userRepo;

	@Autowired
	UserService userService;

	@Autowired
	ProfileRepository profileRepo;

	@Autowired
	NotificationDao notificationDao;

	// @Autowired
	// MongoTemplate mongoTemplate;

	@Autowired
	CommentParser commentParser;

	@Autowired
	Transcoder transcoder;

	@Autowired
	ReplayProcessor replayProcessor;

	@Autowired
	ReputationUpdater reputationUpdater;

	@Autowired
	SlackNotifier slackNotifier;

	@Autowired
	DiscordNotifier discordNotifier;

	@Autowired
	SubscriptionManager subscriptionManager;

	@Autowired
	SportManager sportManager;

	@Autowired
	MongoOperations mongoOperations;

	@Autowired
	AutowireCapableBeanFactory beanFactory;

	@RequestMapping(value = "/query", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<ListReviewResponse> searchAllReviews(
			@RequestBody ReviewSearchCriteria criteria) {
		// log.debug("Retrieving all reviews with criteria " + criteria);

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		User user = userRepo.findByUsername(currentUser);

		int pageNumber = criteria.getPageNumber() != null && criteria.getPageNumber() > 0 ? criteria.getPageNumber() - 1
				: 0;
		String sport = criteria.getSport();

		if (StringUtils.isNullOrEmpty(sport)) { return new ResponseEntity<ListReviewResponse>((ListReviewResponse) null,
				HttpStatus.BAD_REQUEST); }

		Sport sportObj = Sport.load(sport);
		// The case when input query contains invalid data, should not arrive
		// during normal site usage
		if (sportObj == null) { return new ResponseEntity<ListReviewResponse>((ListReviewResponse) null,
				HttpStatus.BAD_REQUEST); }

		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		// log.info("authorities are " + authorities);

		// If user is anonymous, can only show public videos
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			if (criteria.getOwnVideos() != null
					&& criteria.getOwnVideos()) { return new ResponseEntity<ListReviewResponse>(
							(ListReviewResponse) null, HttpStatus.FORBIDDEN); }
			criteria.setVisibility("public");
		}

		// Sorting in ascending order of creation date first
		Sort sort = new Sort(Sort.Direction.DESC, Arrays.asList("creationDate"));
		if ("updateDate".equals(criteria.getSort())) {
			sort = new Sort(Sort.Direction.DESC, Arrays.asList("sortingDate", "creationDate", "lastModifiedDate"));
		}

		// Start pageing at 1 like normal people, not at 0 like nerds
		PageRequest pageRequest = new PageRequest(pageNumber, PAGE_SIZE, sort);
		String author = criteria.getOwnVideos() != null && criteria.getOwnVideos() && user != null ? user.getId()
				: null;

		long queryStart = System.currentTimeMillis();
		List<Review> reviews = reviewDao.search(criteria, author, pageRequest);

		ListReviewResponse response = new ListReviewResponse(reviews);
		response.setQueryDuration(System.currentTimeMillis() - queryStart);
		String userId = user != null ? user.getId() : "";
		// tweak info about reputation
		reputationUpdater.modifyReviewsAccordingToUser(reviews, userId);

		return new ResponseEntity<ListReviewResponse>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Review> getReviewById(@PathVariable("reviewId") final String id) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		Review review = reviewRepo.findById(id);

		if (review == null) { return new ResponseEntity<Review>(review, HttpStatus.NOT_FOUND); }

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		User user = userRepo.findByUsername(currentUser);
		// Check that access is allowed - DEPRECATED: now all reviews can be
		// accessed
		// if ("private".equalsIgnoreCase(review.getVisibility()) &&
		// review.getAuthorId() != null
		// && (user == null || !review.getAuthorId().equals(user.getId()))) {
		// return new ResponseEntity<Review>(
		// review, HttpStatus.FORBIDDEN); }

		// Increase the view count
		if (review.isTranscodingDone() || Sport.Meta.equals(review.getSport())) {
			review.incrementViewCount();
		}

		// Fix bogus review/mediaType (legacy)
		if ("game".equals(review.getReviewType())) {
			review.setReviewType("game-replay");
		}
		if ("game".equals(review.getMediaType())) {
			review.setMediaType("game-replay");
		}
		if (review.getMediaType() == null) {
			review.setMediaType(review.getReviewType());
		}
		if (review.getReviewType() == null) {
			review.setReviewType(review.getMediaType());
		}

		reviewService.updateAsync(review);

		// Now load all the unread notifs for this user and this review
		String userId = user != null ? user.getId() : null;
		if (userId != null) {
			List<Notification> unreadNotifs = notificationDao.findAllUnread(userId, review.getId());
			review.highlightUnreadNotifs(unreadNotifs);
		}

		review.prepareForDisplay(userId);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/multi", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<ListReviewResponse> getReviews(
			@RequestParam(value = "reviewIds") final List<String> ids) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		Iterable<Review> reviews = reviewRepo.findAll(ids);

		List<Review> results = new ArrayList<>();

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		User user = userRepo.findByUsername(currentUser);
		String userId = user != null ? user.getId() : "";
		// Check that access is allowed - DEPRECATED: now all reviews can be
		// accessed
		for (Review review : reviews) {
			// if ("private".equalsIgnoreCase(review.getVisibility()) &&
			// review.getAuthorId() != null
			// && !review.getAuthorId().equals(user.getId())) {
			// continue;
			// }
			review.prepareForDisplay(userId);
			results.add(review);
		}

		ListReviewResponse response = null;

		if (results.isEmpty()) { return new ResponseEntity<ListReviewResponse>(response, HttpStatus.NOT_FOUND); }

		response = new ListReviewResponse(results);

		return new ResponseEntity<ListReviewResponse>(response, HttpStatus.OK);
	}

	@RequestMapping(method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> createReview(@RequestBody Review review) throws IOException {

		// TOOD: checks
		// Add current logged in user as the author of the review
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		// log.info("Current user is " + currentUser);
		// log.info("Input review is " + review);
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		// log.info("authorities are " + authorities);
		if (!StringUtils.isNullOrEmpty(currentUser) && !UserAuthority.isAnonymous(authorities)) {
			// log.debug("Setting current user as review author " +
			// currentUser);
			User user = userRepo.findByUsername(currentUser);
			review.setAuthorId(user.getId());
			review.setAuthor(currentUser);
		}
		// If anonymous, make sure the user doesn't use someone else's name
		else if (review.getAuthor() != null) {
			// log.debug("Validating that the name used to created the review is
			// allowed");
			User user = userRepo.findByUsername(review.getAuthor());
			if (user != null) {
				log.debug("Name not allowed: " + review.getAuthor() + ". Found user " + user);
				return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
			}
		}

		log.debug("Review request creation: " + review);
		Map<String, String> inputCanvas = review.getCanvas();
		review.resetCanvas();
		consolidateCanvas(currentUser, review, review, inputCanvas);
		activatePlugins(currentUser, review, review);

		// Create the entry on the database
		review.setCreationDate(new Date());
		review.setLastModifiedBy(review.getAuthor());

		subscriptionManager.subscribe(review, review.getAuthorId());
		// subscriptionManager.subscribe(review.getSport(),
		// review.getAuthorId());
		// sportManager.addNewReviewActivity(review);

		// Setup v2 comments for game replays only (not drafts nor videos)
		if ("game-replay".equalsIgnoreCase(review.getReviewType())
				|| "game-replay".equalsIgnoreCase(review.getMediaType())) {
			review.setUseV2comments(true);
		}

		// We need to save here so that the transcoding process can retrieve it
		reviewRepo.save(review);

		// User user = userRepo.findByUsername(currentUser);
		// if (user != null) {
		// user.addPostedReview(review.getSport().getKey().toLowerCase(),
		// review.getId());
		// userService.updateAsync(user);
		// }

		// Start transcoding
		if (!StringUtils.isNullOrEmpty(review.getTemporaryKey())
				|| !StringUtils.isNullOrEmpty(review.getTemporaryReplay())) {
			if (!StringUtils.isNullOrEmpty(review.getReplay())) {
				log.debug("Proessing replay");
				replayProcessor.processReplayFile(review, "init");
			}
			// More generic approach to handle videos
			else if (review.getMediaType() != null && !review.getMediaType().equals("video")) {
				log.debug("Proessing secondary media type " + review);
				replayProcessor.processReplayFile(review, "init");
			}
			else {
				log.debug("Transcoding video");
				transcoder.transcode(review.getId());
			}
		}
		else {
			log.debug("No media attached");
			review.setPublished(true);
			reviewRepo.save(review);
		}

		log.debug("Transcoding started, returning with created review: " + review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> addComment(@PathVariable("reviewId") final String id,
			@RequestBody Comment comment) throws IOException {

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();

		// Adding the comment
		// log.debug("Adding comment " + comment + " to review " + id);

		Review review = reviewRepo.findById(id);

		// Security
		// Add current logged in user as the author of the review
		if (!StringUtils.isNullOrEmpty(currentUser) && !UserAuthority.isAnonymous(authorities)) {
			// log.debug("Setting current user as review author " +
			// currentUser);
			addAuthorInformation(review.getSport(), comment, currentUser);
			User user = userRepo.findByUsername(currentUser);

			// Updating user stats
			// if (commentParser.hasTimestamp(comment.getText())) {
			// user.getStats().incrementTimestamps();
			// userRepo.save(user);
			// }

			// Add information on whether the comment has been made by a coach
			if (user.getCoachInformation() != null) {
				comment.setAuthorStatus("coach");
			}
		}
		// If anonymous, make sure the user doesn't use someone else's name
		else {
			User user = userRepo.findByUsername(comment.getAuthor());
			if (user != null) { return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED); }
		}

		comment.setCreationDate(new Date());

		review.addComment(comment);
		review.sortComments();
		review.setLastModifiedDate(new Date());
		review.setLastModifiedBy(comment.getAuthor());

		consolidateCanvas(currentUser, review, comment, comment.getTempCanvas());
		activatePlugins(currentUser, review, comment);

		// See if there are external references to videos in the comment
		commentParser.parseComment(review, comment);

		subscriptionManager.notifyNewComment(comment, review);
		subscriptionManager.subscribe(review, comment.getAuthorId());
		reviewService.updateAsync(review);

		User user = userRepo.findByUsername(currentUser);
		String userId = user != null ? user.getId() : "";
		review.prepareForDisplay(userId);

		// if (user != null) {
		// user.addPostedComment(review.getSport().getKey().toLowerCase(),
		// review.getId());
		// userService.updateAsync(user);
		// }

		reviewService.triggerCommentCreationJobs(review, comment);

		// Notifying the user who submitted the review (if he is registered)
		slackNotifier.notifyNewComment(review, comment);
		// sportManager.addNewCommentActivity(review, comment);

		// log.debug("Created comment " + comment + " with id " +
		// comment.getId());
		// log.debug("Updated review " + review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/multi/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> addMultiComment(@PathVariable("reviewId") final String id,
			@RequestBody Map<String, Comment> multiComment) throws IOException {

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();

		Review review = reviewRepo.findById(id);
		User user = userRepo.findByUsername(currentUser);

		List<Comment> orderedComments = new ArrayList<>();
		for (String turn : multiComment.keySet()) {
			Comment comment = multiComment.get(turn);

			if (StringUtils.isNullOrEmpty(comment.getText())) {
				continue;
			}
			// TODO: unhardcode this - we want the timestamps to be easily
			// sortable
			if ("mulligan".equalsIgnoreCase(turn)) {
				comment.setTimestamp("00" + turn);
			}
			else if ("endgame".equalsIgnoreCase(turn)) {
				comment.setTimestamp("ZZ" + turn);
			}
			else {
				comment.setTimestamp(turn);
			}

			log.debug("\tadding comment " + multiComment);

			if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
				user = userRepo.findByUsername(comment.getAuthor());
				if (user != null) { return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED); }
			}

			orderedComments.add(comment);
			addCommentToReview(review, comment, user, currentUser);
		}

		subscriptionManager.notifyNewMultiComment(review, orderedComments);
		slackNotifier.notifyNewMultiComment(review, orderedComments);
		review.sortComments();

		reviewService.updateAsync(review);

		String userId = user != null ? user.getId() : "";
		review.prepareForDisplay(userId);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	private void addCommentToReview(Review review, Comment comment, User user, String currentUser) {
		if (StringUtils.isNullOrEmpty(comment.getText())) { return; }
		if (user == null) {
			user = new User();
			user.setUsername(currentUser);
		}

		addAuthorInformation(review.getSport(), comment, user.getUsername());

		if (user.getCoachInformation() != null) {
			comment.setAuthorStatus("coach");
		}

		comment.setCreationDate(new Date());
		review.addComment(comment);

		review.setLastModifiedDate(new Date());
		review.setLastModifiedBy(comment.getAuthor());

		consolidateCanvas(user.getUsername(), review, comment, comment.getTempCanvas());
		activatePlugins(user.getUsername(), review, comment);

		// See if there are external references to videos in the comment
		commentParser.parseComment(review, comment);

		subscriptionManager.subscribe(review, comment.getAuthorId());
		reviewService.triggerCommentCreationJobs(review, comment);
	}

	@RequestMapping(value = "/{reviewId}/information", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> updateInformation(@PathVariable("reviewId") final String id,
			@RequestBody Review inputReview) throws IOException {

		Review review = reviewRepo.findById(id);

		// Security
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		User user = userRepo.findByUsername(currentUser);

		// Disallow anonymous edits
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
		}
		else if (!currentUser.equals(review.getAuthor())
				&& !user.canEdit()) { return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED); }

		// log.debug("Upading review with " + inputReview);

		review.setText(inputReview.getText());
		review.setPlugins(inputReview.getPlugins());
		consolidateCanvas(currentUser, review, review, inputReview.getCanvas());
		activatePlugins(currentUser, review, review);
		// log.debug("updated text is " + review.getText());

		review.setSport(inputReview.getSport());
		review.setTitle(inputReview.getTitle());
		review.setTags(inputReview.getTags());
		if (inputReview.getParticipantDetails() != null) {
			review.setParticipantDetails(inputReview.getParticipantDetails());
		}

		// review.setLastModifiedDate(new Date());
		// review.setLastModifiedBy(currentUser);
		review.setLanguage(inputReview.getLanguage());
		if ("public".equalsIgnoreCase(inputReview.getVisibility())
				&& !"public".equalsIgnoreCase(review.getVisibility())) {
			review.setVisibility(inputReview.getVisibility());
			subscriptionManager.notifyNewReview(review.getSport(), review);
			slackNotifier.notifyNewReview(review);
			// discordNotifier.notifyNewReview(review);
		}
		review.setVisibility(inputReview.getVisibility());

		log.debug("Triggering plugins? " + review);
		replayProcessor.processReplayFile(review, "update");

		reviewService.updateAsync(review);

		// Updating user stats
		// if (commentParser.hasTimestamp(review.getText())) {
		// user.getStats().incrementTimestamps();
		// userService.updateAsync(user);
		// }

		// slackNotifier.notifyReviewUpdatet(review);
		// sportManager.addReviewUpdatedActivity(user, review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	public @ResponseBody ResponseEntity<Review> updateAndKeepNullInfo(@PathVariable("reviewId") final String id,
			@RequestBody Review inputReview) throws IOException {

		Review review = reviewRepo.findById(id);

		// Security
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		User user = userRepo.findByUsername(currentUser);

		// Disallow anonymous edits
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
		}
		else if (!currentUser.equals(review.getAuthor())
				&& !user.canEdit()) { return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED); }

		// log.debug("Upading review with " + inputReview);

		if (inputReview.getText() != null) {
			review.setText(inputReview.getText());
		}

		activatePlugins(currentUser, review, review);
		// log.debug("updated text is " + review.getText());

		if (inputReview.getSport() != null) {
			review.setSport(inputReview.getSport());
		}

		if (inputReview.getTitle() != null) {
			review.setTitle(inputReview.getTitle());
		}

		if (inputReview.getTags() != null) {
			review.setTags(inputReview.getTags());
		}

		if (inputReview.getParticipantDetails() != null) {
			review.setParticipantDetails(inputReview.getParticipantDetails());
		}

		if (inputReview.getVisibility() != null) {
			review.setVisibility(inputReview.getVisibility());
		}

		reviewService.updateAsync(review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/publish", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> publish(@PathVariable("reviewId") final String id,
			@RequestBody Review inputReview) throws IOException {

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();

		Review review = reviewRepo.findById(id);

		log.debug("Publishing review " + inputReview);
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

		if (review.getAuthorId() == null) {
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
		if (review.getParticipantDetails().getSkillLevel().isEmpty()) {
			review.getParticipantDetails().setSkillLevel(inputReview.getParticipantDetails().getSkillLevel());
		}

		review.setLastModifiedDate(new Date());
		review.setLastModifiedBy(currentUser);
		review.setLanguage(inputReview.getLanguage());
		review.setPublished(true);
		review.setVisibility(inputReview.getVisibility());

		// Setup v2 comments for game replays only (not drafts nor videos)
		if ("game-replay".equalsIgnoreCase(review.getReviewType())) {
			review.setUseV2comments(true);
		}

		reviewService.updateAsync(review);
		reviewService.triggerReviewCreationJobs(review);

		// Send notifications only if it's a real new video and
		// not a video response
		if (!review.isSequence()) {
			subscriptionManager.notifyNewReview(review.getSport(), review);
			slackNotifier.notifyNewReview(review);
			// discordNotifier.notifyNewReview(review);
		}
		log.debug("Published review is " + review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/multi", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> publish(@RequestBody MultiReviewRequest reviews) throws IOException {

		log.debug("publishing reviews " + reviews);

		for (Review review : reviews.getReviews()) {
			publish(review.getId(), review);
		}

		return new ResponseEntity<Review>((Review) null, HttpStatus.OK);
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
		else if (!currentUser.equals(comment.getAuthor())
				&& !user.canEdit()) { return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED); }

		consolidateCanvas(currentUser, review, newComment, newComment.getTempCanvas());
		activatePlugins(currentUser, review, newComment);
		comment.setText(newComment.getText());

		// review.setLastModifiedDate(new Date());
		// review.setLastModifiedBy(currentUser);

		// See if there are external references to videos in the comment
		commentParser.parseComment(review, comment);
		review.sortComments();
		reviewService.updateAsync(review);

		// Updating user stats
		// if (commentParser.hasTimestamp(comment.getText())) {
		// user.getStats().incrementTimestamps();
		// userService.saveAsync(user);
		// }

		comment.setTempCanvas(review.getCanvas());
		// slackNotifier.notifyCommentUpdate(review, comment);
		// sportManager.addCommentUpdatedActivity(user, review, comment);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/{commentId}/reply", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> reply(@PathVariable("reviewId") final String reviewId,
			@PathVariable("commentId") final String commentId, @RequestBody Comment reply) throws IOException {

		Review review = reviewRepo.findById(reviewId);
		Comment comment = review.getComment(Integer.parseInt(commentId));

		// Security
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		// Add current logged in user as the author of the review
		if (!StringUtils.isNullOrEmpty(currentUser) && !UserAuthority.isAnonymous(authorities)) {
			// log.debug("Setting current user as review author " +
			// currentUser);
			addAuthorInformation(review.getSport(), reply, currentUser);
			User user = userRepo.findByUsername(currentUser);

			if (user.getCoachInformation() != null) {
				reply.setAuthorStatus("coach");
			}

			// Updating user stats
			// if (commentParser.hasTimestamp(reply.getText())) {
			// user.getStats().incrementTimestamps();
			// userRepo.save(user);
			// }
		}
		// If anonymous, make sure the user doesn't use someone else's name
		else {
			// log.debug("Validating that the name used to created the review is
			// allowed");
			User user = userRepo.findByUsername(reply.getAuthor());
			if (user != null) {
				// reply.getAuthor());
				return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
			}
		}

		// Adding the comment
		// log.debug("Adding reply " + reply + " to review " + review +
		// " and comment " + comment);

		consolidateCanvas(currentUser, review, reply, reply.getTempCanvas());
		activatePlugins(currentUser, review, reply);
		// log.debug("modified text is " + reply.getText());

		reply.setCreationDate(new Date());
		subscriptionManager.subscribe(review, reply.getAuthorId());

		review.addComment(comment, reply);
		review.setLastModifiedDate(new Date());
		review.setLastModifiedBy(reply.getAuthor());

		// See if there are external references to videos in the comment
		commentParser.parseComment(review, reply);
		review.sortComments();
		reviewService.updateAsync(review);

		User user = userRepo.findByUsername(currentUser);
		String userId = user != null ? user.getId() : "";
		review.prepareForDisplay(userId);

		reviewService.triggerCommentCreationJobs(review, comment);

		// Notifying the user who submitted the review (if he is registered)
		subscriptionManager.notifyNewComment(reply, review);
		slackNotifier.notifyNewComment(review, reply);
		// sportManager.addNewCommentActivity(review, reply);

		log.debug("Created reply " + reply + " with id " + reply.getId());

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/{commentId}/validate", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Comment> toggleHelpful(@PathVariable("reviewId") final String reviewId,
			@PathVariable("commentId") final String commentId) throws IOException {

		Review review = reviewRepo.findById(reviewId);
		Comment comment = review.getComment(Integer.parseInt(commentId));

		// Security
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();

		// No anonymous access
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(
				authorities)) { return new ResponseEntity<Comment>((Comment) null, HttpStatus.UNAUTHORIZED); }

		// log.debug("Validating that the logged in user is the review author");
		User user = userRepo.findByUsername(currentUser);
		if (!user.getId().equals(
				review.getAuthorId())) { return new ResponseEntity<Comment>((Comment) null, HttpStatus.UNAUTHORIZED); }

		comment.setHelpful(!comment.isHelpful());

		// Update the reputation only if the review author and comment author
		// are different to avoid self-boosting
		if (!StringUtils.isNullOrEmpty(comment.getAuthorId()) && !comment.getAuthorId().equals(review.getAuthorId())) {
			ReputationAction action = comment.isHelpful() ? ReputationAction.Helpful : ReputationAction.LostHelpful;
			int changeAmount = reputationUpdater.updateReputation(review.getSport(), action, comment.getAuthorId());
			reviewService.triggerReputationChangeJobs(review, comment, changeAmount,
					changeAmount > 0 ? ReputationAction.Helpful : ReputationAction.LostHelpful);
		}

		reviewService.updateAsync(review);
		// if (comment.isHelpful()) {
		// slackNotifier.notifyHelpfulComment(review, comment);
		// }
		// else {
		// slackNotifier.notifyUnhelpfulComment(review, comment);
		// }

		return new ResponseEntity<Comment>(comment, HttpStatus.OK);
	}

	// @RequestMapping(value = "/suggestion/comment/{sport}", method =
	// RequestMethod.GET)
	// public @ResponseBody ResponseEntity<Review>
	// getRecommendedReviewForComment(
	// @PathVariable("sport") final String sport) {
	//
	// String currentUser =
	// SecurityContextHolder.getContext().getAuthentication().getName();
	//
	// List<Review> reviews = null;
	// // log.debug("Retrieving recommended review for " + sport);
	//
	// // Sorting in ascending order
	// Sort oldestFirst = new Sort(Sort.Direction.ASC,
	// Arrays.asList("sortingDate", "creationDate", "lastModifiedDate"));
	//
	// PageRequest pageRequest = new PageRequest(0, PAGE_SIZE, oldestFirst);
	// Review recommended = null;
	// if (!"meta".equalsIgnoreCase(sport)) {
	// reviews = reviewRepo.findPageableBySport(sport,
	// pageRequest).getContent();
	// // log.debug("All reviews " + reviews);
	//
	// // TODO: do that in the DB directly?
	// List<Review> result = new ArrayList<>();
	// for (Review review : reviews) {
	// if (review.getAuthor() != null && !review.getAuthor().equals(currentUser)
	// && (review.getComments() == null || review.getComments().isEmpty())) {
	// result.add(review);
	// }
	// }
	//
	// // Take a random video
	// if (!result.isEmpty()) {
	// int index = new Random().nextInt(result.size());
	// recommended = result.get(index);
	// }
	// }
	// // log.debug("Recommended " + recommended);
	//
	// return new ResponseEntity<Review>(recommended, HttpStatus.OK);
	// }

	// @RequestMapping(value = "/suggestion/comment", method =
	// RequestMethod.GET)
	// public @ResponseBody ResponseEntity<Review>
	// getRecommendedReviewForComment() {
	//
	// return new ResponseEntity<Review>((Review) null, HttpStatus.OK);
	// }

	// private void updateReview(Review review) {
	//
	// }

	private void consolidateCanvas(String prefix, Review review, HasText textHolder, Map<String, String> tempCanvas) {
		String text = textHolder.getText();
		// log.debug("Initial text is " + text);
		String normalizedPrefix = prefix.replaceAll(" ", "");
		// log.debug("Normalized prefix is " + normalizedPrefix);

		// log.debug("Temp canvas is " + tempCanvas);
		for (String canvasKey : tempCanvas.keySet()) {
			if (review.getCanvas().containsKey(canvasKey)) {
				review.getCanvas().put(canvasKey, tempCanvas.get(canvasKey));
			}
			else {
				String newKey = normalizedPrefix + review.getCanvasId();
				// review.removeCanvas(canvasKey);
				review.addCanvas(newKey, tempCanvas.get(canvasKey));
				// log.debug("Replacing " + canvasKey + " with " + newKey);
				text = text.replaceAll(canvasKey, newKey);
			}
		}
		textHolder.setText(text);
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
				slackNotifier.notifyError(e, "Exception during plugin execution", pluginClass, review);
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
