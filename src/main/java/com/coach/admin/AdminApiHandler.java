package com.coach.admin;

import static java.util.Comparator.comparing;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Field;
import org.springframework.data.mongodb.core.query.Query;
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
import com.coach.review.journal.ArchiveJournalRepository;
import com.coach.review.scoring.scorers.WaitingForOPScorer;
import com.coach.tag.Tag;
import com.coach.user.UserRepository;

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
	ArchiveJournalRepository journalRepository;

	@Autowired
	MongoTemplate mongoTemplate;

	private final String environment;

	@Autowired
	public AdminApiHandler(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	@RequestMapping(value = "/findUntaggedReviews", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> doAdmin() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		Criteria crit = where("tags").size(0);
		crit.and("sport").is("HearthStone");
		crit.and("published").is(true);
		crit.and("visibility").is("public");
		crit.and("metaData.gameMode").nin("arena-game", "arena-draft", "tavern-brawl", "casual", "friendly");

		Query query = query(crit);

		Field fields = query.fields();
		fields.include("id");
		fields.include("tags");

		List<Review> find = mongoTemplate.find(query, Review.class);

		log.debug("count is " + find.stream().map(r -> r.getId()).collect(Collectors.toList()));
		log.debug("" + find);

		return new ResponseEntity<String>("count is " + find.size(), HttpStatus.OK);
	}

	@RequestMapping(value = "/findPotentialPings", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> findWhoToPing() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.DAY_OF_YEAR, -90);

		Criteria crit = where("publicationDate").gte(calendar.getTime());
		crit.and("published").is(true);
		crit.and("visibility").is("public");
		crit.and("authorId").ne(null);
		crit.and("metaData.gameMode").is("ranked");
		// crit.and("metaData.gameMode").is("arena-game");

		Query query = query(crit);

		Field fields = query.fields();
		fields.include("tags");
		fields.include("author");
		fields.include("sport");
		fields.include("id");
		fields.include("authorId");
		fields.include("title");

		// Find all the latest reviews
		List<Review> reviews = mongoTemplate.find(query, Review.class);

		log.debug("Found " + reviews.size() + " reviews");

		// Get all users for posted reviews
		Set<String> authorIds = reviews.parallelStream().map(r -> r.getAuthorId()).collect(Collectors.toSet());
		log.debug("By " + authorIds.size() + " different authors: " + authorIds);
		Iterable<User> users = userRepository.findAll(authorIds);

		Map<String, String> userEmails = new HashMap<>();
		for (User user : users) {
			userEmails.put(user.getUsername(), user.getEmail());
		}

		// Get number of reviews posted by author under a single tag
		Map<String, Map<String, List<String>>> recentReviewAsked = new HashMap<>();
		for (Review review : reviews) {
			if (CollectionUtils.isEmpty(review.getTags())) {
				// log.debug("No tag: " + review.getUrl() + ": " +
				// review.getTags());
				continue;
			}

			Map<String, List<String>> authorInfo = recentReviewAsked.get(review.getAuthor());
			if (authorInfo == null) {
				authorInfo = new HashMap<>();
				recentReviewAsked.put(review.getAuthor(), authorInfo);
			}

			// for (Tag tag : review.getTags()) {
			Tag tag = review.getTags().get(0);
			List<String> reviewsForTag = authorInfo.get(tag.getText());
			if (reviewsForTag == null) {
				reviewsForTag = new ArrayList<>();
				authorInfo.put(tag.getText(), reviewsForTag);
			}
			reviewsForTag.add(review.getUrl());
			// }
		}

		// For each tag
		System.out.println("User, Email, Tag, #Reviews, Reviews");
		for (String author : recentReviewAsked.keySet()) {
			for (String tag : recentReviewAsked.get(author).keySet()) {
				System.out.println(author + ", " + userEmails.get(author) + ", " + tag + ", "
						+ recentReviewAsked.get(author).get(tag).size() + ", "
						+ recentReviewAsked.get(author).get(tag));
			}
		}

		return new ResponseEntity<String>("Done", HttpStatus.OK);
	}

	@RequestMapping(value = "/findUnansweredComments", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> getUnansweredReviews() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		Criteria crit = where("authorId").ne(null);
		crit.and("visibility").is("public");
		crit.and("totalComments").gt(0);
		Query query = query(crit);

		Field fields = query.fields();
		fields.exclude("text");
		fields.exclude("description");
		fields.exclude("plugins");

		Pageable pageRequest = new PageRequest(0, 100000,
				new Sort(Sort.Direction.ASC, Arrays.asList("publicationDate")));
		query.with(pageRequest);

		List<Review> find = mongoTemplate.find(query, Review.class);
		log.debug("Found " + find.size() + " reviews");

		Query userQuery = query(where("email").ne(null));
		Field userField = userQuery.fields();
		userField.include("id");
		userField.include("email");

		List<User> userFind = mongoTemplate.find(userQuery, User.class);

		System.out.println("Reason, Pub date, First comment date, Url, Author, Email, Total comments");
		WaitingForOPScorer scorer = new WaitingForOPScorer();
		for (Review review : find) {
			// Ecluse reviews where no one but OP contributed
			if (review.getAllAuthorIds().size() <= 1) {
				continue;
			}

			if (isEntertainment(review)) {
				continue;
			}

			// float opVisit = scorer.scoreOPVisit(review);
			float opActions = scorer.scoreOPActions(review);
			// if (opVisit < 0) {
			// System.out.println("NOT_SEEN, " + review.getPublicationDate() +
			// ", " + review.getUrl() + ", "
			// + review.getAuthor() + ", " + review.getAuthorId() + ", " +
			// opVisit + ", " + opActions);
			// }
			// else
			if (opActions <= 0) {
				Date firstCommentDate = review.getAllComments().stream().sorted(comparing(Comment::getCreationDate))
						.findFirst().get().getCreationDate();
				System.out
						.println(
						"NOT_ACK, "
								+ new SimpleDateFormat("yyy/MM/dd")
										.format(review.getPublicationDate())
								+ ", " + new SimpleDateFormat("yyy/MM/dd").format(firstCommentDate) + ", "
								+ review.getUrl() + ", " + review.getAuthor() + ", "
								+ userFind.stream().filter(u -> u.getId().equals(review.getAuthorId()))
										.map(u -> u.getEmail()).findFirst().get()
								+ ", " + review.getAllComments().size());
			}
		}

		return new ResponseEntity<String>((String) null, HttpStatus.OK);
	}

	private boolean isEntertainment(Review review) {
		if (!CollectionUtils.isEmpty(review.getTags())) {
			for (Tag tag : review.getTags()) {
				if ("Entertainment".equalsIgnoreCase(tag.getText())) { return true; }
			}
		}
		return false;
	}
}
