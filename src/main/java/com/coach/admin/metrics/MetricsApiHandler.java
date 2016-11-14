package com.coach.admin.metrics;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;
import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;

import java.util.Arrays;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Field;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.core.security.User;
import com.coach.review.Comment;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.review.journal.ArchiveJournal;
import com.coach.review.journal.CommentJournal;
import com.coach.review.journal.ReviewJournal;
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
	private static List<String> excludedIds = Arrays.asList(new String[] { "570cae78e4b038c7bb0fa808" });

	@Autowired
	UserRepository userRepository;

	@Autowired
	ReviewRepository reviewRepository;

	@Autowired
	ResetPasswordRepository resetPasswordRepository;

	@Autowired
	SportRepository sportRepository;

	@Autowired
	MongoTemplate mongoTemplate;

	private final String environment;

	@Autowired
	public MetricsApiHandler(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	@RequestMapping(value = "/new", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getNewMetrics() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		Metrics metrics = new Metrics();

		// Select recent entries only
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.DAY_OF_MONTH, -350);

		Query reviewQuery = query(where("journal.gameCreationDate").gte(calendar.getTime()));
		List<ArchiveJournal> reviewLogs = mongoTemplate.find(reviewQuery, ArchiveJournal.class);

		List<String> reviewIds = reviewLogs.stream().map(j -> ((ReviewJournal) j.getJournal()).getReviewId())
				.collect(Collectors.toList());
		// log.debug("Review IDs " + reviewIds);

		Criteria reviewsCriteria = where("id").in(reviewIds);
		Query reviewsQuery = new Query(reviewsCriteria);

		Field fields = reviewsQuery.fields();
		fields.include("author");
		fields.include("authorId");
		fields.include("creationDate");
		fields.include("visibility");

		List<Review> reviews = mongoTemplate.find(reviewsQuery, Review.class);

		// int totalVideoViews = 0;
		log.debug("Going through all reviews " + reviews.size());
		for (Review review : reviews) {

			String authentifier = review.getAuthorId() == null ? review.getAuthor() : review.getAuthorId();

			Date creationDate = review.getCreationDate();
			if (creationDate == null || authentifier == null || excludedIds.indexOf(authentifier) != -1) {
				log.debug("continuing on " + review);
				continue;
			}

			if ("private".equalsIgnoreCase(review.getVisibility())
					|| "restricted".equalsIgnoreCase(review.getVisibility())) {
				metrics.get(creationDate).incrementPrivateReviews();
				metrics.get(creationDate).addUniqueContentCreator(authentifier);
				continue;
			}

			metrics.get(creationDate).incrementReviews();
			metrics.get(creationDate).addReview(review.getId());
			metrics.get(creationDate).addUniqueContentCreator(authentifier);
		}

		Query commentQuery = query(where("journal.commentCreationDate").gte(calendar.getTime()));
		List<ArchiveJournal> commentLogs = mongoTemplate.find(commentQuery, ArchiveJournal.class);
		log.debug("Handling " + commentLogs.size() + " comments");

		for (ArchiveJournal journal : commentLogs) {
			CommentJournal comment = (CommentJournal) journal.getJournal();
			Date commCreation = comment.getCommentCreationDate();
			if (commCreation != null && comment.getAuthorId() != null
					&& excludedIds.indexOf(comment.getAuthorId()) == -1) {
				metrics.get(commCreation).incrementComments();
				metrics.get(commCreation).addUniqueContentCreator(comment.getAuthorId());
			}
		}

		log.debug("Counting reputation");
		Aggregation agg = newAggregation(match(where("reputation").gt(0)), group().sum("reputation").as("reputation"));
		AggregationResults<User> aggResult = mongoTemplate.aggregate(agg, User.class, User.class);
		List<User> mappedResult = aggResult.getMappedResults();
		metrics.setTotalReputation(mappedResult.get(0).getReputation());

		log.debug("Counting video views");
		Aggregation agg2 = newAggregation(match(where("viewCount").gt(0)), group().sum("viewCount").as("viewCount"));
		AggregationResults<Review> aggResult2 = mongoTemplate.aggregate(agg2, Review.class, Review.class);
		List<Review> mappedResult2 = aggResult2.getMappedResults();
		metrics.setTotalVideoViews(mappedResult2.get(0).getViewCount());
		// metrics.setTotalVideoViews(totalVideoViews);

		log.debug("Finalizing");
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

		log.debug("Formatting for CSV " + metrics);
		String csvMetrics = toCsv(metrics);
		metrics.setCsv(csvMetrics);

		// log.debug("Detailing churn");
		// String churnInfo = detailChurn(metrics);
		// csvMetrics += "<br/><br/>" + churnInfo;

		log.debug("result");
		log.debug(csvMetrics);

		return new ResponseEntity<String>(csvMetrics, HttpStatus.OK);
	}

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getMetrics() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		Metrics metrics = new Metrics();

		log.debug("Loading reviews");
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
			if (!review.isPublished() || StringUtils.isEmpty(review.getKey())) {
				log.debug("continuing on " + review);
				continue;
			}

			Date creationDate = review.getCreationDate();
			if (creationDate == null || review.getAuthor() == null
					|| excludedUserNames.indexOf(review.getAuthor()) != -1) {
				// log.debug("continuing on " + review);
				continue;
			}

			if ("private".equalsIgnoreCase(review.getVisibility())
					|| "restricted".equalsIgnoreCase(review.getVisibility())) {
				metrics.get(creationDate).incrementPrivateReviews();
				metrics.get(creationDate).addUniqueContentCreator(review.getAuthor());
				log.debug("private review " + review);
				continue;
			}

			log.debug("handling " + review);
			totalVideoViews += review.getViewCount();
			metrics.get(creationDate).incrementReviews();
			metrics.get(creationDate).addReview(review.getId());
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

		log.debug("Formatting for CSV " + metrics);
		String csvMetrics = toCsv(metrics);
		metrics.setCsv(csvMetrics);

		// log.debug("Detailing churn");
		// String churnInfo = detailChurn(metrics);
		// csvMetrics += "<br/><br/>" + churnInfo;

		log.debug("result");
		log.debug(csvMetrics);

		return new ResponseEntity<String>(csvMetrics, HttpStatus.OK);
	}

	// @RequestMapping(value = "/nocontrib", method = RequestMethod.GET)
	// public @ResponseBody ResponseEntity<String> getNoContributions() {
	//
	// List<User> findAll = userRepository.findAll();
	// Map<String, User> users = new HashMap<>();
	// for (User user : findAll) {
	// users.put(user.getId(), user);
	// }
	// List<Review> reviews = reviewRepository.findAll();
	// for (Review review : reviews) {
	// if (users.containsKey(review.getAuthorId())) {
	// users.remove(review.getAuthorId());
	// }
	// for (Comment comment : review.getComments()) {
	// if (users.containsKey(comment.getAuthorId())) {
	// users.remove(comment.getAuthorId());
	// }
	// }
	// }
	//
	// String result = "";
	//
	// String header = "registration date,id,username,email";
	// result += header + "<br/>";
	//
	// SimpleDateFormat format = new SimpleDateFormat("yyyy/MM/dd");
	//
	// for (User user : users.values()) {
	// result += user.getCreationDate() != null ?
	// format.format(user.getCreationDate())
	// : null + "," + user.getId() + "," + user.getUsername() + "," +
	// user.getEmail();
	// result += "<br/>";
	// }
	//
	// return new ResponseEntity<String>(result, HttpStatus.OK);
	// }

	private String toCsv(Metrics metrics) {

		String result = "";

		String header = "Week,Unique content creators,Returning contributors,Total reviews,Total comments,"
				+ "Total interactions,Total private review,Total reputation,Total video views";
		result += header + "<br/>";

		for (Metric metric : metrics.getMetrics()) {
			log.debug("\tformatting metric " + metric);
			result += metric.getStartDate().toString("yyyy/MM/dd") + "," + metric.getUniqueContentCreators().size()
					+ "," + metric.getReturningContributors() + "," + metric.getReviews() + "," + metric.getComments()
					+ "," + (metric.getComments() + metric.getReviews()) + "," + metric.getPrivateReviews() + ","
					+ metrics.getTotalReputation() + "," + metrics.getTotalVideoViews() + ","
					+ metric.getUniqueReviews() + "," + metric.getUniqueContentCreators();
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
