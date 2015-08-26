package com.coach.review;

import java.io.IOException;
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

import com.coach.review.access.IFileStorage;
import com.coach.review.access.ReviewRepository;
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

	@Autowired
	IUploadProgress progressCallback;

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<List<Review>> listAllReviews(
			@RequestParam(value = "userName", required = false) String userName) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		log.debug("Retrieving all reviews");

		List<Review> reviews = null;
		// log.debug("userName param is " + userName);

		Sort newestFirst = new Sort(new Sort.Order(Sort.Direction.DESC, "creationDate"));
		if (!StringUtils.isEmpty(userName))
			reviews = repo.findByAuthor(userName, newestFirst);
		else
			reviews = repo.findAll(newestFirst);

		return new ResponseEntity<List<Review>>(reviews, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Review> getReviewById(@PathVariable("reviewId") final String id) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		Review review = repo.findById(id);
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
		String key = fileStorage.storeFile(file, progressCallback);
		log.debug("Stored file " + file.getName() + " as " + key);

		// Create the entry on the database
		review.setKey(key);
		review.setCreationDate(new Date());

		// Store that entry in DB
		mongoTemplate.save(review);
		progressCallback.setReviewId(review.getId());
		log.debug("Saved review with ID: " + review.getId());

		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		// log.info("Request review creation: " + newReview);
		// mongoTemplate.save(newReview);

		return new ResponseEntity<String>(review.getId(), HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Comment> addComment(@PathVariable("reviewId") final String id,
			@RequestBody Comment comment) throws IOException {

		log.debug("Adding comment " + comment + " to review " + id);

		Review review = repo.findById(id);

		comment.setCreationDate(new Date());
		review.addComment(comment);
		mongoTemplate.save(review);

		return new ResponseEntity<Comment>(comment, HttpStatus.OK);
	}
}
