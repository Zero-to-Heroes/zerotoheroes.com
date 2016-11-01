package com.coach.admin.cron;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;
import static org.springframework.data.mongodb.core.query.Update.*;

import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Field;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.plugin.hearthstone.HSArenaDraft;
import com.coach.plugin.hearthstone.HSGameParser;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.mongodb.WriteResult;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/cron/review")
@Slf4j
public class ReviewCleanupHandler {

	@Autowired
	ReviewRepository reviewRepository;

	@Autowired
	MongoTemplate mongoTemplate;

	@Autowired
	HSGameParser gameParser;

	@Autowired
	HSArenaDraft draftParser;

	@Value("${environment}")
	String environment;

	@Value("${videos.bucket.output.name}")
	String outputBucket;

	@RequestMapping(value = "/cleanUp", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> processGames() {

		long totalReviews = reviewRepository.count();

		// We delete all reviews that are at least one week old and that:
		// - Don't have a "key"
		// - Have a key referring to a non-existent item in s3
		// - Have a replay we can't parse that has been flagged as invalid

		// Select old reviews only
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.DAY_OF_MONTH, -7);

		Criteria noKey = where("key").is(null);
		Criteria invalidReplay = where("invalidGame").is(true);
		Criteria unpublished = where("published").is(false);

		Criteria crit = where("creationDate").lt(calendar.getTime());
		crit.orOperator(noKey, invalidReplay, unpublished);

		Query query = query(crit);

		PageRequest pageRequest = new PageRequest(0, 200);

		query.with(pageRequest);

		Field fields = query.fields();
		fields.include("id");
		fields.include("key");

		WriteResult result = mongoTemplate.remove(query, Review.class);
		int removedReviews = result.getN();

		log.debug("Removed " + removedReviews + " out of " + totalReviews + " reviews");

		return new ResponseEntity<String>("Removed " + removedReviews + " out of " + totalReviews + " reviews",
				HttpStatus.OK);
	}

	@RequestMapping(value = "/reinit", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> reinit() {

		log.debug("bucket " + outputBucket);

		long totalReviews = reviewRepository.count();

		Criteria crit = where("published").is(true);
		Query query = query(crit);

		Update update = update("lastMetaDataParsingDate", null).set("invalidGame", false);
		WriteResult result = mongoTemplate.updateMulti(query, update, Review.class);
		int removedReviews = result.getN();

		log.debug("Updated " + removedReviews + " out of " + totalReviews + " reviews");

		return new ResponseEntity<String>("Updated " + removedReviews + " out of " + totalReviews + " reviews",
				HttpStatus.OK);
	}

	@RequestMapping(value = "/parseMetaData", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> parseMetaData() {

		// Re-parse all reviews meta data
		// Don't risk parsing a review that is being created
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.HOUR, -2);

		Criteria crit = where("lastMetaDataParsingDate").is(null).and("creationDate").lt(calendar.getTime());
		// Criteria crit = where("creationDate").lt(calendar.getTime());
		Query query = query(crit);

		PageRequest pageRequest = new PageRequest(0, 50);

		query.with(pageRequest);

		List<Review> find = mongoTemplate.find(query, Review.class);
		log.debug("Parsing " + find.size() + " reviews to add meta data");

		for (Review review : find) {
			try {
				if ("arena-draft".equals(review.getReviewType())) {
					draftParser.addMetaData(review);
				}
				else if ("game-replay".equals(review.getReviewType()) && !"video/mp4".equals(review.getFileType())) {
					gameParser.addMetaData(review);
				}
				else {
					log.warn("Can't define metadata type for " + review.getId() + " with " + review.getReviewType());
				}
			}
			catch (Exception e) {
				log.info("Could not parse meta data for " + review.getId(), e);
				review.setInvalidGame(true);
			}
			review.buildAllAuthors();
			review.setLastMetaDataParsingDate(new Date());
		}
		reviewRepository.save(find);

		return new ResponseEntity<String>("processed " + find.size() + " reviews", HttpStatus.OK);
	}
}
