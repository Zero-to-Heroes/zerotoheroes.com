package com.coach.admin;

import static java.util.Comparator.*;
import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

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

import com.coach.profile.ProfileService;
import com.coach.review.Comment;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.review.journal.ArchiveJournalRepository;
import com.coach.review.scoring.scorers.WaitingForOPScorer;
import com.coach.tag.Tag;
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

		System.out.println("Reason, Pub date, First comment date, Url, Author, AuthorId, Total comments");
		WaitingForOPScorer scorer = new WaitingForOPScorer();
		for (Review review : find) {
			// Ecluse reviews where no one but OP contributed
			if (review.getAllAuthorIds().size() <= 1) {
				continue;
			}

			if (!CollectionUtils.isEmpty(review.getTags())) {
				for (Tag tag : review.getTags()) {
					if ("Entertainment".equalsIgnoreCase(tag.getText())) {
						continue;
					}
				}
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
				System.out.println("NOT_ACK, " + new SimpleDateFormat("yyy/MM/dd").format(review.getPublicationDate())
						+ ", " + new SimpleDateFormat("yyy/MM/dd").format(firstCommentDate) + ", " + review.getUrl()
						+ ", " + review.getAuthor() + ", " + review.getAuthorId() + ", "
						+ review.getAllComments().size());
			}
		}

		return new ResponseEntity<String>((String) null, HttpStatus.OK);
	}
}
