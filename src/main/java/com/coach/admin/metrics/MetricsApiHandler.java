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
import org.springframework.beans.factory.annotation.Value;
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

	private final String environment;

	@Autowired
	public MetricsApiHandler(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getMetrics() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		Metrics metrics = new Metrics();

		List<Review> reviews = reviewRepository.findAll();
		// DateTime now = DateTime.now();
		// log.debug("now is " + now);
		// DateTime fromSearch = now.minusWeeks(6);
		// log.debug("Loading reviews from " + fromSearch);
		// List<Review> reviews =
		// reviewRepository.findByCreationDateGreaterThan(fromSearch.toDate());
		int totalVideoViews = 0;
		log.debug("Going through all reviews " + reviews.size());
		for (Review review : reviews) {
			if (!review.isPublished()) {
				continue;
			}

			Date creationDate = review.getCreationDate();
			if (creationDate == null || review.getAuthor() == null
					|| excludedUserNames.indexOf(review.getAuthor()) != -1) {
				continue;
			}

			if ("private".equalsIgnoreCase(review.getVisibility())
					|| "restricted".equalsIgnoreCase(review.getVisibility())) {
				metrics.get(creationDate).incrementPrivateReviews();
				metrics.get(creationDate).addUniqueContentCreator(review.getAuthor());
				continue;
			}

			totalVideoViews += review.getViewCount();
			metrics.get(creationDate).incrementReviews();
			metrics.get(creationDate).addUniqueContentCreator(review.getAuthor());

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

		// Returning users
		log.debug("handling contributors");
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

		// Churn - how many people contributed in the past 3 months and didn't
		// do anything in the past 3 weeks
		// log.debug("handling churn");
		// for (int i = 1; i < metrics.getMetrics().size(); i++) {
		// // Build the list of unique content creators in the past 8 weeks
		// // We don't want to pick a too long period, otherwise the same user
		// // will count for churn over too many weeks.
		// Set<String> onceActive = new HashSet<>();
		// for (int j = Math.max(0, i - 8); j < i; j++) {
		// onceActive.addAll(metrics.getMetrics().get(j).getUniqueContentCreators());
		// }
		//
		// // Build the list of unique content creators in the past 3 weeks
		// Set<String> recentlyActive = new HashSet<>();
		// for (int j = Math.max(0, i - 3); j < i; j++) {
		// recentlyActive.addAll(metrics.getMetrics().get(j).getUniqueContentCreators());
		// }
		//
		// // Build the list of people who have been active in the past but not
		// // recently
		// Set<String> churn = new HashSet<>();
		// for (String user : onceActive) {
		// if (!recentlyActive.contains(user)) {
		// churn.add(user);
		// }
		// }
		//
		// metrics.getMetrics().get(i).setChurn(churn);
		// }

		log.debug("Formatting for CSV");
		String csvMetrics = toCsv(metrics);
		metrics.setCsv(csvMetrics);

		// log.debug("Detailing churn");
		// String churnInfo = detailChurn(metrics);
		// csvMetrics += "<br/><br/>" + churnInfo;

		log.debug("result");
		log.debug(csvMetrics);

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
		result += header + "<br/>";

		SimpleDateFormat format = new SimpleDateFormat("yyyy/MM/dd");

		for (User user : users.values()) {
			result += user.getCreationDate() != null ? format.format(user.getCreationDate())
					: null + "," + user.getId() + "," + user.getUsername() + "," + user.getEmail();
			result += "<br/>";
		}

		return new ResponseEntity<String>(result, HttpStatus.OK);
	}

	private String toCsv(Metrics metrics) {

		String result = "";

		String header = "Week,Unique content creators,Returning contributors,Total reviews,Total comments,"
				+ "Total interactions,Total private review,Total reputation,Total video views";
		result += header + "<br/>";

		for (Metric metric : metrics.getMetrics()) {
			log.debug("\tformatting metric " + metric);
			result += metric.getStartDate().toString("yyyy/MM/dd") + "," + metric.getUniqueContentCreators().size()
					+ "," + metric.getReturningContributors() + "," + +metric.getReviews() + "," + metric.getComments()
					+ "," + (metric.getComments() + metric.getReviews()) + "," + metric.getPrivateReviews() + ","
					+ metrics.getTotalReputation() + "," + metrics.getTotalVideoViews();
			// + "," + metric.getUniqueContentCreators() + "," +
			// metric.getChurn();
			result += "<br/>";
		}
		log.debug("all metrics formatted");
		return result;
	}

	// private String detailChurn(Metrics metrics) {
	// Metric metric = metrics.getMetrics().get(metrics.getMetrics().size() -
	// 1);
	//
	// String result = "";
	//
	// String header = "User,Reviews,Comments,Average comments on own
	// review,Reputation";
	// result += header + "<br/>";
	//
	// List<Review> reviews = reviewRepository.findAll();
	//
	// for (String username : metric.getChurn()) {
	// // log.debug("Processing userId " + username);
	// User user = userRepository.findByUsername(username);
	// // log.debug("loaded user " + user);
	// if (user == null || username.equalsIgnoreCase("anon")) {
	// continue;
	// }
	//
	// String userId = user.getId();
	// int nbReviews = 0;
	// int nbComments = 0;
	// int totalCommentsOnOwnReviews = 0;
	// int averageCommentsOnOwnReview = 0;
	// for (Review review : reviews) {
	// if (userId.equals(review.getAuthorId())) {
	// nbReviews++;
	// }
	// for (Comment comment : review.getComments()) {
	// if (userId.equals(comment.getAuthorId())) {
	// nbComments++;
	// }
	// if (userId.equals(review.getAuthorId()) &&
	// !userId.equals(comment.getAuthorId())) {
	// totalCommentsOnOwnReviews++;
	// }
	// }
	// }
	// if (nbReviews > 0) {
	// averageCommentsOnOwnReview = totalCommentsOnOwnReviews / nbReviews;
	// }
	// result += username + "," + nbReviews + "," + nbComments + "," +
	// averageCommentsOnOwnReview + ","
	// + user.getReputation();
	// result += "<br/>";
	// }
	//
	// return result;
	// }
}
