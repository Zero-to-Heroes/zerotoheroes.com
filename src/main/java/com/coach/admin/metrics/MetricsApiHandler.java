package com.coach.admin.metrics;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
			.asList(new String[] { "Seb", "2StepsFr0mHell", "Tom", "Daedin", "Erwin", "Thibaud" });

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
			if (!review.isPublished()) {
				continue;
			}
			totalVideoViews += review.getViewCount();
			Date creationDate = review.getCreationDate();
			if (creationDate != null && review.getAuthor() != null
					&& excludedUserNames.indexOf(review.getAuthor()) == -1) {
				metrics.get(creationDate).incrementReviews();
				metrics.get(creationDate).addUniqueContentCreator(review.getAuthor());
			}
			for (Comment comment : review.getAllComments()) {
				Date commCreation = comment.getCreationDate();
				if (commCreation != null && comment.getAuthor() != null
						&& excludedUserNames.indexOf(comment.getAuthor()) == -1) {
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

		// Sort from oldest to newest - useful both for result presentation and
		// to compute returning users
		Collections.sort(metrics.getMetrics(), new Comparator<Metric>() {
			@Override
			public int compare(Metric o1, Metric o2) {
				return o1.getStartDate().compareTo(o2.getStartDate());
			}
		});

		for (int i = 1; i < metrics.getMetrics().size(); i++) {
			// Build the list of unique content creators in the past 3 weeks
			Set<String> contributors = new HashSet<>();
			for (int j = Math.max(0, i - 3); j < i; j++) {
				contributors.addAll(metrics.getMetrics().get(j).getUniqueContentCreators());
			}

			// And look how many of this week's contributors are returning users
			int returning = 0;
			for (String user : metrics.getMetrics().get(i).getUniqueContentCreators()) {
				if (contributors.contains(user)) {
					returning++;
				}
			}

			metrics.getMetrics().get(i).setReturningContributors(returning);
		}

		log.debug("Formatting for CSV");
		String csvMetrics = toCsv(metrics);
		metrics.setCsv(csvMetrics);

		return new ResponseEntity<String>(csvMetrics, HttpStatus.OK);
	}

	@RequestMapping(value = "/nocontrib", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getNoContributions() {

		List<User> findAll = userRepository.findAll();
		Map<String, User> users = new HashMap<>();
		for (User user : findAll) {
			users.put(user.getId(), user);
		}
		List<Review> reviews = reviewRepository.findAll();
		for (Review review : reviews) {
			if (users.containsKey(review.getAuthorId())) {
				users.remove(review.getAuthorId());
			}
			for (Comment comment : review.getComments()) {
				if (users.containsKey(comment.getAuthorId())) {
					users.remove(comment.getAuthorId());
				}
			}
		}

		String result = "";

		String header = "registration date,id,username,email";
		result += header + "\r\n";

		SimpleDateFormat format = new SimpleDateFormat("yyyy/MM/dd");

		for (User user : users.values()) {
			result += user.getCreationDate() != null ? format.format(user.getCreationDate())
					: null + "," + user.getId() + "," + user.getUsername() + "," + user.getEmail();
			result += "\r\n";
		}

		return new ResponseEntity<String>(result, HttpStatus.OK);
	}

	private String toCsv(Metrics metrics) {

		String result = "";

		String header = "Week,Unique content creators,Returning contributors,Total reviews,Total comments,Total interactions,Total reputation,Total video views,User details";
		result += header + "\r\n";

		for (Metric metric : metrics.getMetrics()) {
			result += metric.getStartDate().toString("yyyy/MM/dd") + "," + metric.getUniqueContentCreators().size()
					+ "," + metric.getReturningContributors() + "," + metric.getReviews() + "," + metric.getComments()
					+ "," + (metric.getComments() + metric.getReviews()) + "," + metrics.getTotalReputation() + ","
					+ metrics.getTotalVideoViews() + "," + metric.getUniqueContentCreators();
			result += "\r\n";
		}
		return result;
	}
}
