package com.coach.admin;

import java.util.List;

import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.profile.ProfileService;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.sport.SportRepository;
import com.coach.user.ResetPasswordRepository;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/admin")
@Slf4j
public class AdminApiHandler {

	@Autowired
	UserRepository userRepository;

	@Autowired
	ProfileService profileService;

	@Autowired
	ReviewRepository reviewRepository;

	@Autowired
	ResetPasswordRepository resetPasswordRepository;

	@Autowired
	SportRepository sportRepository;

	@RequestMapping(value = "/updateAllReviews", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Review> updateAllReviews() {
		List<Review> reviews = reviewRepository.findAll();

		for (Review review : reviews) {
			// if (review.isPublished() &&
			// StringUtils.isEmpty(review.getVisibility())) {
			// review.setVisibility("public");
			// }
			if (StringUtils.isEmpty(review.getReviewType())) {
				review.setReviewType(review.getMediaType());
			}
		}
		reviewRepository.save(reviews);
		log.debug("Reviews updated");

		return new ResponseEntity<Review>((Review) null, HttpStatus.OK);
	}
}
