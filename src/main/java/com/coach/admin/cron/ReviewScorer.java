package com.coach.admin.cron;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;
import static org.springframework.data.mongodb.core.query.Update.*;

import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Field;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.profile.Profile;
import com.coach.review.Review;
import com.coach.review.scoring.CommentNeededScorer;
import com.coach.review.scoring.ReviewScore;
import com.coach.review.scoring.ScoreWeights;
import com.coach.tag.Tag;
import com.mongodb.WriteResult;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/cron/scoreReviews")
@Slf4j
public class ReviewScorer {

	@Autowired
	MongoTemplate mongoTemplate;

	@Autowired
	CommentNeededScorer commentNeededScorer;

	@Value("${environment}")
	private String environment;

	@RequestMapping(value = "/helpNeeded", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> computeHelpNeededScore() {

		ScoreWeights weights = buildWeights();
		return computeHelpNeededScore(weights);
	}

	@RequestMapping(value = "/helpNeeded/debug", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> computeHelpNeededScore(@RequestBody ScoreWeights weights) {

		// Select only reviews that aren't closed
		// Calendar calendar = Calendar.getInstance();
		// calendar.add(Calendar.HOUR_OF_DAY, -1);

		Criteria crit = where("visibility").is("public");
		crit.and("closedDate").is(null);
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.DAY_OF_YEAR, -20);
		crit.and("publicationDate").gte(calendar.getTime());

		// Debug
		// calendar.add(Calendar.DAY_OF_YEAR, -15);
		// crit.and("creationDate").gte(calendar.getTime());

		// crit.orOperator(where("lastScoreUpdate").lte(calendar.getTime()),
		// where("lastScoreUpdate").is(null));
		// crit.and("closed").is(null);

		Query reviewQuery = query(crit);

		Field fields = reviewQuery.fields();
		fields.exclude("text");
		fields.exclude("comments.text");

		List<Review> reviews = mongoTemplate.find(reviewQuery, Review.class);
		log.debug("updating score for " + reviews.size() + " reviews");

		commentNeededScorer.setWeights(weights);

		Map<String, Integer> openReviews = new HashMap<>();
		for (Review review : reviews) {
			if (review.getAuthorId() != null && !isEntertainment(review)) {
				Integer existingReviews = openReviews.get(review.getAuthorId());
				if (existingReviews == null) {
					existingReviews = 0;
				}
				openReviews.put(review.getAuthorId(), ++existingReviews);
			}
		}

		// Now update the author's scores
		resetAllUserOpenReviews();
		log.debug("Reset all open reviews");
		updateUserOpenReviews(openReviews);

		for (Review review : reviews) {
			try {
				Integer nbOpenReviews = openReviews.get(review.getAuthorId());
				ReviewScore score = commentNeededScorer.score(review, nbOpenReviews == null ? 0 : nbOpenReviews);

				Criteria updateCrit = where("id").is(review.getId());
				Query query = query(updateCrit);

				Update update = update("debugScore", score);
				update.set("helpScore", score.totalScore());
				update.set("lastScoreUpdate", new Date());
				update.set("scoreDebug", score);

				WriteResult result = mongoTemplate.updateMulti(query, update, Review.class);
				// log.debug("Updated " + result.getN() + " review");
			}
			catch (Exception e) {
				log.error("Could not score review " + review);
				throw e;
			}
		}

		return new ResponseEntity<String>("processed " + reviews.size() + " reviews", HttpStatus.OK);
	}

	private void updateUserOpenReviews(Map<String, Integer> openReviews) {
		int total = 0;
		for (String userId : openReviews.keySet()) {
			Criteria updateCrit = where("userId").is(userId);
			Query query = query(updateCrit);
			Update update = update("openReviews", openReviews.get(userId));

			WriteResult result = mongoTemplate.updateMulti(query, update, Profile.class);
			total += result.getN();
		}
		log.debug("Set " + total + " openReviews counters");
	}

	private void resetAllUserOpenReviews() {
		Criteria updateCrit = where("userId").ne(null);
		Query query = query(updateCrit);
		Update update = update("openReviews", 0);

		WriteResult result = mongoTemplate.updateMulti(query, update, Profile.class);
		log.debug("Reset " + result.getN() + " openReviews counters");
	}

	private boolean isEntertainment(Review review) {
		if (review.getTags() == null) { return false; }
		for (Tag tag : review.getTags()) {
			if ("Entertainment".equalsIgnoreCase(tag.getText())) { return true; }
		}
		return false;
	}

	@RequestMapping(value = "/autoclose", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> closeAll() {
		return null;

		// Calendar calendar = Calendar.getInstance();
		// calendar.add(Calendar.DAY_OF_YEAR, -10);
		// log.debug("Aucoclosing reviews older than " + calendar.getTime());
		//
		// Criteria updateCrit = where("creationDate").lte(calendar.getTime());
		// updateCrit.and("visibility").is("public");
		// updateCrit.orOperator(where("closedDate").is(null),
		// where("closedDate").exists(false));
		//
		// Query query = query(updateCrit);
		// // Later on we need to parse the data to add a "user karma" and look
		// for
		// // reviews that have been close at earliest 10 days after their
		// creation
		// // date to find the autocloses
		// Update update = update("closedDate", new Date());
		// update.set("helpScore", -10000);
		// WriteResult result = mongoTemplate.updateMulti(query, update,
		// Review.class);
		//
		// return new ResponseEntity<String>("closed " + result.getN() + "
		// reviews", HttpStatus.OK);
	}

	private ScoreWeights buildWeights() {
		ScoreWeights weights = new ScoreWeights();

		return weights;
	}
}
