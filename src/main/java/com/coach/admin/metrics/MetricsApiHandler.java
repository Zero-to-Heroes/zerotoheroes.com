package com.coach.admin.metrics;

import java.util.Date;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.core.security.User;
import com.coach.review.Comment;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.sport.Sport;
import com.coach.sport.SportRepository;
import com.coach.user.ResetPasswordRepository;
import com.coach.user.UserRepository;

@RestController
@RequestMapping(value = "/api/admin/metrics")
@Slf4j
public class MetricsApiHandler {

	@Autowired
	UserRepository userRepository;

	@Autowired
	ReviewRepository reviewRepository;

	@Autowired
	ResetPasswordRepository resetPasswordRepository;
	
	@Autowired
	SportRepository sportRepository;

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Metrics> getMetrics() {
		Metrics metrics = new Metrics();
		
		List<User> users = userRepository.findAll();
		for (User user : users) {
			Date creationDate = user.getCreationDate();
			if (creationDate != null) {
				metrics.get(creationDate).incrementUsers();
			}
		}
		
		List<Review> reviews = reviewRepository.findAll();
		for (Review review : reviews) {
			Date creationDate = review.getCreationDate();
			if (creationDate != null) {
				metrics.get(creationDate).incrementReviews(review.getSport());
			}
			for (Comment comment : review.getAllComments()) {
				Date commCreation= comment.getCreationDate();
				if (commCreation != null) {
					metrics.get(commCreation).incrementComments(review.getSport());
				}
			}
		}
		
		String csvMetrics = toCsv(metrics);
		metrics.setCsv(csvMetrics);
		
		
		return new ResponseEntity<Metrics>(metrics, HttpStatus.OK);
	}

	private String toCsv(Metrics metrics) {
		String result = "";
		List<Sport> sports = sportRepository.findAll();
		
		String header = "Date,Users,Reviews,Comments";
		for (Sport sport : sports) {
			header += ",ReviewsFor" + sport.getId() + ",CommentsFor" + sport.getId();
		}
		result += header + "|";
		
		for (Metric metric : metrics.getMetrics().values()) {
			result += metric.getDate() + "," + metric.getUsers() + "," + metric.getReviews() + "," + metric.getComments();
			for (Sport sport : sports) {
				result += "," + metric.getReviewsPerSport().get(Review.Sport.load(sport.getId()));
				result += "," + metric.getCommentsPerSport().get(Review.Sport.load(sport.getId()));
			}
			result += "|";
		}
		return result;
	}
}
