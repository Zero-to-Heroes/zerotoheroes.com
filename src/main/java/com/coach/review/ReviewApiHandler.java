package com.coach.review;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;

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
import com.coach.core.email.EmailMessage;
import com.coach.core.email.EmailSender;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthority;
import com.coach.review.Review.Sport;
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
	EmailSender emailSender;

	@Autowired
	CommentParser commentParser;

	@Autowired
	Transcoder transcoder;

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
		Sort newestFirst = new Sort(Sort.Direction.DESC, Arrays.asList("sortingDate", "creationDate",
				"lastModifiedDate"));

		reviews = reviewRepo.findAll(userName, sport, newestFirst);

		return new ResponseEntity<List<Review>>(reviews, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Review> getReviewById(@PathVariable("reviewId") final String id) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		Review review = reviewRepo.findById(id);

		// Sort the comments. We'll probably need this for a rather long time,
		// as our sorting algorithm will evolve
		review.sortComments();
		log.debug("Returning review " + review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> createReview(@RequestBody Review review) throws IOException {

		// TOOD: checks
		// Add current logged in user as the author of the review
		String currentUser =
				SecurityContextHolder.getContext().getAuthentication().getName();
		log.info("Current user is " + currentUser);
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		log.info("authorities are " + authorities);

		if (!StringUtils.isNullOrEmpty(currentUser) && !UserAuthority.isAnonymous(authorities)) {
			log.debug("Setting current user as review author " + currentUser);
			review.setAuthor(currentUser);
			// Add the ID of the author in addition to the name (we still keep
			// the nmae
			User user = userRepo.findByUsername(currentUser);
			review.setAuthorId(user.getId());
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

		// Store the file on S3
		// Create a review entry with the appropriate link to the S3 file
		// final Review review = new ObjectMapper().readValue(strReview,
		// Review.class);
		log.debug("Review request creation: " + review);

		// Create the entry on the database
		review.setCreationDate(new Date());
		review.setLastModifiedBy(review.getAuthor());

		// Store that entry in DB
		mongoTemplate.save(review);
		log.debug("Saved review with ID: " + review.getId());

		// Start transcoding
		log.debug("Transcoding video");
		transcoder.transcode(review.getId());

		// fileStorage.setReviewId(review.getId());
		// String key = fileStorage.storeFile(file, review.getId());
		// log.debug("Stored file " + file.getName() + " as " + key);
		// review.setTemporaryKey(key);
		// mongoTemplate.save(review);
		// log.debug("Saved again review with ID: " + review.getId());

		// log.info("Request review creation: " + newReview);
		// mongoTemplate.save(newReview);
		log.debug("Transcoding started, returning with created review: " + review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> addComment(@PathVariable("reviewId") final String id,
			@RequestBody Comment comment) throws IOException {

		String currentUser =
				SecurityContextHolder.getContext().getAuthentication().getName();
		log.info("Current user is " + currentUser);
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		log.info("authorities are " + authorities);

		// Security
		// Add current logged in user as the author of the review
		if (!StringUtils.isNullOrEmpty(currentUser) && !UserAuthority.isAnonymous(authorities)) {
			log.debug("Setting current user as review author " + currentUser);
			comment.setAuthor(currentUser);
			// Add the ID of the author in addition to the name (we still keep
			// the nmae
			User user = userRepo.findByUsername(currentUser);
			comment.setAuthorId(user.getId());
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

		// Adding the comment
		log.debug("Adding comment " + comment + " to review " + id);

		Review review = reviewRepo.findById(id);

		comment.setCreationDate(new Date());
		review.addComment(comment);
		review.sortComments();
		review.setLastModifiedDate(new Date());
		review.setLastModifiedBy(comment.getAuthor());

		// See if there are external references to videos in the comment
		commentParser.parseComment(review, comment);
		mongoTemplate.save(review);

		// Notifying the user who submitted the review (if he is registered)
		if (review.getAuthorId() != null) {
			User author = userRepo.findById(review.getAuthorId());
			String recipient = author.getEmail();

			EmailMessage message = EmailMessage
					.builder()
					.from("seb@zerotoheroes.com")
					.to(recipient)
					.subject("New comment on your review " + review.getTitle() + " at ZeroToHeroes")
					.content(
							"Hey there!<br/>"
									+
									comment.getAuthor()
									+ " has just added a comment on your review. Click <a href=\"http://www.zerotoheroes.com/#/r/"
									+ review.getId() + "\">here</a> to see what they said.").type(
							"text/html").build();
			emailSender.send(message);
		}

		log.debug("Created comment " + comment + " with id " + comment.getId());

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/information", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> updateInformation(@PathVariable("reviewId") final String id,
			@RequestBody Review inputReview) throws IOException {

		Review review = reviewRepo.findById(id);

		// Security
		String currentUser =
				SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		// Disallow anonymous edits
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
		}
		// Disable edits when you're not the author
		else if (!currentUser.equals(review.getAuthor())) { return new ResponseEntity<Review>((Review) null,
				HttpStatus.UNAUTHORIZED); }

		log.debug("Upading review with " + inputReview);
		String description = inputReview.getDescription();
		Sport sport = inputReview.getSport();
		String title = inputReview.getTitle();

		review.setDescription(description);
		review.setSport(sport);
		review.setTitle(title);
		mongoTemplate.save(review);

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/{commentId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Comment> updateComment(@PathVariable("reviewId") final String reviewId,
			@PathVariable("commentId") final int commentId, @RequestBody Comment newComment) throws IOException {

		log.debug("Updating comment " + commentId + " to review " + reviewId);

		Review review = reviewRepo.findById(reviewId);
		Comment comment = review.getComment(commentId);

		// Security
		String currentUser =
				SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		// Disallow anonymous edits
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			return new ResponseEntity<Comment>((Comment) null, HttpStatus.UNAUTHORIZED);
		}
		// Disable edits when you're not the author
		else if (!currentUser.equals(comment.getAuthor())) { return new ResponseEntity<Comment>((Comment) null,
				HttpStatus.UNAUTHORIZED); }

		comment.setText(newComment.getText());

		review.setLastModifiedDate(new Date());
		review.setLastModifiedBy(comment.getAuthor());

		// See if there are external references to videos in the comment
		commentParser.parseComment(review, comment);
		mongoTemplate.save(review);

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
		mongoTemplate.save(review);

		// Notifying the user who submitted the review (if he is registered)
		if (review.getAuthorId() != null) {
			User author = userRepo.findById(review.getAuthorId());
			String recipient = author.getEmail();

			EmailMessage message = EmailMessage
					.builder()
					.from("seb@zerotoheroes.com")
					.to(recipient)
					.subject("New comment on your review " + review.getTitle() + " at ZeroToHeroes")
					.content(
							"Hey there!<br/>"
									+
									comment.getAuthor()
									+ " has just added a comment on your review. Click <a href=\"http://www.zerotoheroes.com/#/r/"
									+ review.getId() + "\">here</a> to see what they said.").type(
							"text/html").build();
			emailSender.send(message);
		}

		log.debug("Created reply " + reply + " with id " + reply.getId());

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}
}
