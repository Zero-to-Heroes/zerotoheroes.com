package com.coach.review;

import java.io.IOException;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.coach.review.video.storage.IFileStorage;
import com.fasterxml.jackson.databind.ObjectMapper;

@RepositoryRestController
@RequestMapping(value = "/api/reviews")
@Slf4j
public class ReviewApiHandler {

	@Autowired
	ReviewRepository repo;

	@Autowired
	MongoTemplate mongoTemplate;

	@Autowired
	IFileStorage fileStorage;

	public ReviewApiHandler() {
		log.debug("Initializing Review Api Handler");
	}

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<List<Review>> listAllReviews(
			@RequestParam(value = "userName", required = false) String userName) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		log.debug("Retrieving all reviews");

		List<Review> reviews = null;
		log.debug("userName param is " + userName);

		Sort newestFirst = new Sort(Sort.Direction.DESC, Arrays.asList("sortingDate", "creationDate",
				"lastModifiedDate"));
		if (!StringUtils.isEmpty(userName))
			reviews = repo.findByAuthorAndTreatmentCompletion(userName, 100, newestFirst);
		else
			reviews = repo.findByTreatmentCompletion(100, newestFirst);

		return new ResponseEntity<List<Review>>(reviews, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Review> getReviewById(@PathVariable("reviewId") final String id) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		Review review = repo.findById(id);

		// Sort the comments. We'll probably need this for a rather long time,
		// as our sorting algorithm will evolve
		review.sortComments();

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> createReview(@RequestParam("file") MultipartFile file,
			@RequestParam("review") String strReview) throws IOException {

		// TOOD: checks

		// Store the file on S3
		// Create a review entry with the appropriate link to the S3 file
		final Review review = new ObjectMapper().readValue(strReview, Review.class);
		log.debug("Review as string: " + review);

		// Create the entry on the database
		review.setCreationDate(new Date());

		// Store that entry in DB
		mongoTemplate.save(review);
		log.debug("Saved review with ID: " + review.getId());

		// fileStorage.setReviewId(review.getId());
		String key = fileStorage.storeFile(file, review.getId());
		log.debug("Stored file " + file.getName() + " as " + key);
		review.setTemporaryKey(key);
		mongoTemplate.save(review);
		log.debug("Saved again review with ID: " + review.getId());

		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		// log.info("Request review creation: " + newReview);
		// mongoTemplate.save(newReview);

		return new ResponseEntity<String>(review.getId(), HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> addComment(@PathVariable("reviewId") final String id,
			@RequestBody Comment comment) throws IOException {

		log.debug("Adding comment " + comment + " to review " + id);

		Review review = repo.findById(id);

		comment.setCreationDate(new Date());
		review.addComment(comment);
		review.setLastModifiedDate(new Date());
		review.sortComments();
		mongoTemplate.save(review);

		log.debug("Created comment " + comment + " with id " + comment.getId());

		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/{commentId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Comment> updateComment(@PathVariable("reviewId") final String reviewId,
			@PathVariable("commentId") final int commentId, @RequestBody Comment newComment) throws IOException {

		log.debug("Updating comment " + commentId + " to review " + reviewId);

		Review review = repo.findById(reviewId);
		Comment comment = review.getComment(commentId);
		comment.setText(newComment.getText());

		review.setLastModifiedDate(new Date());
		mongoTemplate.save(review);

		return new ResponseEntity<Comment>(comment, HttpStatus.OK);
	}
}