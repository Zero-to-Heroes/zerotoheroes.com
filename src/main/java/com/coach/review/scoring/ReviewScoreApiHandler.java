package com.coach.review.scoring;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.coach.core.security.User;
import com.coach.review.Review;
import com.coach.review.ReviewDao;
import com.coach.review.ReviewRepository;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/reviewscore")
@Slf4j
public class ReviewScoreApiHandler {

	@Autowired
	ReviewDao reviewDao;

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	UserRepository userRepo;

	@RequestMapping(value = "/close/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> closeReview(@PathVariable("reviewId") String reviewId)
			throws Exception {

		Review review = reviewRepo.findById(reviewId);
		if (review == null) {
			new ResponseEntity<String>("No review to close", HttpStatus.FORBIDDEN);
		}

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		if (currentUser == null) {
			new ResponseEntity<String>("You need to be logged in to close a review", HttpStatus.FORBIDDEN);
		}
		User user = userRepo.findByUsername(currentUser);
		if (user == null) {
			new ResponseEntity<String>("No account found for " + currentUser, HttpStatus.FORBIDDEN);
		}

		if (review.getAuthorId() == null || !review.getAuthorId().equals(user.getId())) {
			new ResponseEntity<String>("You can't close a review not opened by you", HttpStatus.FORBIDDEN);
		}

		reviewDao.closeReview(review);

		return new ResponseEntity<String>("Review closed", HttpStatus.OK);
	}

	@RequestMapping(value = "/reopen/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> reopen(@PathVariable("reviewId") String reviewId) throws Exception {

		Review review = reviewRepo.findById(reviewId);
		if (review == null) {
			new ResponseEntity<String>("No review to reopen", HttpStatus.FORBIDDEN);
		}

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		if (currentUser == null) {
			new ResponseEntity<String>("You need to be logged in to reopen a review", HttpStatus.FORBIDDEN);
		}
		User user = userRepo.findByUsername(currentUser);
		if (user == null) {
			new ResponseEntity<String>("No account found for " + currentUser, HttpStatus.FORBIDDEN);
		}

		if (review.getAuthorId() == null || !review.getAuthorId().equals(user.getId())) {
			new ResponseEntity<String>("You can't reopen a review not opened by you", HttpStatus.FORBIDDEN);
		}

		reviewDao.reopenReview(review);

		return new ResponseEntity<String>("Review reopened", HttpStatus.OK);
	}
}
