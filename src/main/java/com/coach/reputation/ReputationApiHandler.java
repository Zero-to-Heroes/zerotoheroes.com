package com.coach.reputation;

import java.io.IOException;
import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthority;
import com.coach.review.Comment;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/reputation")
@Slf4j
public class ReputationApiHandler {
	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	UserRepository userRepo;

	@Autowired
	MongoTemplate mongoTemplate;
/*
	@RequestMapping(value = "/{reviewId}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<ReviewReputation> getReviewReputation(
			@PathVariable("reviewId") final String reviewId) throws IOException {
		Review review = reviewRepo.findById(reviewId);
		log.debug("getting all reputation markers for review " + reviewId);
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		User user = userRepo.findByUsername(currentUser);
		ReputationConverter converter = new ReputationConverter();
		String userId = "";
		if (user != null) {
			userId = user.getId();
		}
		if (review.getReputation() == null) {
			review.setReputation(new Reputation());
			if (review.getComments() != null) {
				for (Comment comment : review.getComments()) {
					comment.setReputation(new Reputation());
				}
			}
			mongoTemplate.save(review);
		}
		ReviewReputation reputation = converter.convert(review, userId);
		return new ResponseEntity<ReviewReputation>(reputation, HttpStatus.OK);
	}*/

	@RequestMapping(value = "/{reviewId}/{commentId}/{action}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Comment> updateCommentReputation(
			@PathVariable("reviewId") final String reviewId, @PathVariable("commentId") final int commentId,
			@PathVariable("action") final ReputationAction action) throws IOException {
		Review review = reviewRepo.findById(reviewId);
		Comment comment = review.getComment(commentId);
		log.debug("Updating reputation for comment " + commentId + " to review " + reviewId);

		// Security
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			return new ResponseEntity<Comment>((Comment) null, HttpStatus.UNAUTHORIZED);
		}
		User user = userRepo.findByUsername(currentUser);
		
		ReputationManager reputationManager = new ReputationManager();
		reputationManager.process(comment.getReputation(), action, user.getId());
		// might be nice to update only the reputation, I think I read this is doable
		mongoTemplate.save(review);
		return new ResponseEntity<Comment>(comment, HttpStatus.OK);
	}

	@RequestMapping(value = "/{reviewId}/{action}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> updateReviewReputation(@PathVariable("reviewId") final String reviewId,
			@PathVariable("action") final ReputationAction action) throws IOException {
		Review review = reviewRepo.findById(reviewId);
		log.debug("Updating reputation for review " + reviewId);

		// Security
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		// need to be logged
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			return new ResponseEntity<Review>((Review) null, HttpStatus.UNAUTHORIZED);
		}
		User user = userRepo.findByUsername(currentUser);
		ReputationManager reputationManager = new ReputationManager();
		reputationManager.process(review.getReputation(), action, user.getId());
		// might be nice to update only the reputation, I think I read this is doable
		mongoTemplate.save(review);
		return new ResponseEntity<Review>(review, HttpStatus.OK);
	}
}
