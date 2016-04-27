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

import com.coach.core.security.User;
import com.coach.profile.Profile;
import com.coach.profile.ProfileService;
import com.coach.review.Comment;
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
			if (StringUtils.isNotEmpty(review.getAuthorId())) {
				Profile profile = profileService.getProfile(review.getAuthorId());
				User user = userRepository.findById(review.getAuthorId());
				review.setAuthorFrame(profile.getFlair(review.getSport(), user.getFrame()));
			}

			for (Comment comment : review.getComments()) {
				if (StringUtils.isNotEmpty(comment.getAuthorId())) {
					Profile profile = profileService.getProfile(comment.getAuthorId());
					User user = userRepository.findById(comment.getAuthorId());
					comment.setAuthorFrame(profile.getFlair(review.getSport(), user.getFrame()));
				}
			}
		}
		reviewRepository.save(reviews);
		log.debug("Reviews updated");

		return new ResponseEntity<Review>((Review) null, HttpStatus.OK);
	}
}
