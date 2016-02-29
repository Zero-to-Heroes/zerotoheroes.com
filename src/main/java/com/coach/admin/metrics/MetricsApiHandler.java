package com.coach.admin.metrics;

import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

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
import com.coach.sport.SportRepository;
import com.coach.user.ResetPasswordRepository;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/admin/metrics")
@Slf4j
public class MetricsApiHandler {

	private static List<String> excludedUserNames = Arrays
			.asList(new String[] { "Seb", "2StepsFr0mHell", "Tom", "Daedin" });

	@Autowired
	UserRepository userRepository;

	@Autowired
	ReviewRepository reviewRepository;

	@Autowired
	ResetPasswordRepository resetPasswordRepository;

	@Autowired
	SportRepository sportRepository;

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getMetrics() {

		Metrics metrics = new Metrics();

		List<Review> reviews = reviewRepository.findAll();
		int totalVideoViews = 0;
		log.debug("Going through all reviews");
		for (Review review : reviews) {
			totalVideoViews += review.getViewCount();
			Date creationDate = review.getCreationDate();
			if (creationDate != null && excludedUserNames.indexOf(review.getAuthor()) == -1) {
				metrics.get(creationDate).incrementReviews();
				metrics.get(creationDate).addUniqueContentCreator(review.getAuthor());
			}
			for (Comment comment : review.getAllComments()) {
				Date commCreation = comment.getCreationDate();
				if (commCreation != null && excludedUserNames.indexOf(comment.getAuthor()) == -1) {
					metrics.get(commCreation).incrementComments();
					metrics.get(creationDate).addUniqueContentCreator(comment.getAuthor());
				}
			}
		}

		int totalReputation = 0;
		log.debug("Counting reputation");
		List<User> users = userRepository.findAll();
		for (User user : users) {
			totalReputation += user.getReputation();
		}

		log.debug("Finalizing");
		metrics.setTotalReputation(totalReputation);
		metrics.setTotalVideoViews(totalVideoViews);

		log.debug("Formatting for CSV");
		String csvMetrics = toCsv(metrics);
		metrics.setCsv(csvMetrics);

		return new ResponseEntity<String>(csvMetrics, HttpStatus.OK);
	}

	private String toCsv(Metrics metrics) {

		Collections.sort(metrics.getMetrics(), new Comparator<Metric>() {

			@Override
			public int compare(Metric o1, Metric o2) {
				return o1.getStartDate().compareTo(o2.getStartDate());
			}
		});

		String result = "";

		String header = "Week,Unique content creators,Total interactions,Total reputation,Total video views";
		result += header + "\r\n";

		for (Metric metric : metrics.getMetrics()) {
			result += metric.getStartDate().toString("yyyy/MM/dd") + "," + metric.getUniqueContentCreators().size()
					+ "," + (metric.getComments() + metric.getReviews()) + "," + metrics.getTotalReputation() + ","
					+ metrics.getTotalVideoViews();
			result += "\r\n";
		}
		return result;
	}
}
