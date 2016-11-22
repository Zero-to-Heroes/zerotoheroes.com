package com.coach.admin.cron;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;
import static org.springframework.data.mongodb.core.query.Update.*;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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

import com.coach.review.Review;
import com.coach.review.scoring.CommentNeededScorer;
import com.coach.review.scoring.ReviewScore;
import com.coach.review.scoring.ScoreWeights;
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

	@RequestMapping(value = "/helpNeeded", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> computeHelpNeededScore() {

		ScoreWeights weights = buildWeights();
		return computeHelpNeededScore(weights);
	}

	@RequestMapping(value = "/helpNeeded/debug", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> computeHelpNeededScore(@RequestBody ScoreWeights weights) {

		// Select only reviews that aren't closed
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.HOUR_OF_DAY, -1);

		Criteria crit = where("visibility").is("public");
		// crit.orOperator(where("lastScoreUpdate").lte(calendar.getTime()),
		// where("lastScoreUpdate").is(null));
		// crit.and("closed").is(null);

		Query reviewQuery = query(crit);

		Field fields = reviewQuery.fields();
		fields.exclude("text");
		fields.exclude("comments.text");

		List<Review> reviews = mongoTemplate.find(reviewQuery, Review.class);
		log.debug("updating score for " + reviews.size() + " reviews");

		commentNeededScorer.setWeights(buildWeights());

		for (Review review : reviews) {
			try {
				ReviewScore score = commentNeededScorer.score(review);

				Criteria updateCrit = where("id").is(review.getId());
				Query query = query(updateCrit);

				Update update = update("debugScore", score);
				update.set("helpScore", score.totalScore());
				update.set("lastScoreUpdate", new Date());

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

	private ScoreWeights buildWeights() {
		ScoreWeights weights = new ScoreWeights();

		weights.setDateScoreWeight(1.0f / 1000000);
		weights.setAuthorReputationScoreWeight(0.1f);

		return weights;
	}
}
