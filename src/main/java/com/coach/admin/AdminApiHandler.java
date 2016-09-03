package com.coach.admin;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.core.security.User;
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

	private final String environment;

	@Autowired
	public AdminApiHandler(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	@RequestMapping(value = "/updateAllReviews", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> updateAllReviews() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		User author = userRepository.findByUsername("OfMurlocsAndMen");
		if (author == null) {
			log.warn("User doesnt exist");
		}

		log.debug("loading reviews");
		List<Review> reviews = reviewRepository.findAll();
		log.debug("loaded all reviews " + reviews.size());

		Set<Review> modified = new HashSet<>();
		for (Review review : reviews) {
			if ("TheFruitBat".equals(review.getAuthor())) {
				// log.debug("found! " + review);
				review.setAuthor(author.getUsername());
				review.setAuthorId(author.getId());
				modified.add(review);
			}
			for (Comment comment : review.getAllComments()) {
				if ("TheFruitBat".equals(comment.getAuthor())) {
					// log.debug("found! " + review);
					comment.setAuthor(author.getUsername());
					comment.setAuthorId(author.getId());
					modified.add(review);
				}
			}
		}
		log.debug("saving modified reviews " + modified.size());
		reviewRepository.save(modified);
		log.debug("job's done!");

		return new ResponseEntity<String>((String) null, HttpStatus.OK);
	}
}
