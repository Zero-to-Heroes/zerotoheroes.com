package com.coach.admin.cron;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;

import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Field;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
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
		// Criteria invalidReplay = where("invalidGame").is(true);
		Criteria unpublished = where("published").is(false);

		Criteria crit = where("creationDate").lt(calendar.getTime());
		crit.orOperator(noKey, unpublished);

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

	@RequestMapping(value = "/rebuild", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> rebuild() {

		// Retrieve all the keys
		Criteria crit = where("publicationDate").is(null);
		crit.and("visibility").is("public");
		Query query = new Query(crit);
		Field fields = query.fields();
		fields.include("id");
		fields.include("creationDate");
		fields.include("visibility");

		List<Review> reviews = mongoTemplate.find(query, Review.class);

		log.debug("Will rebuild " + reviews.size() + " reviews");

		// for (Review review : reviews) {
		//
		// Criteria updateCrit = where("id").is(review.getId());
		// Query updateQ = query(updateCrit);
		//
		// if (review.getCreationDate() == null ||
		// !"public".equalsIgnoreCase(review.getVisibility()) ||
		// review.getPublicationDate() != null) {
		// throw new NullPointerException("Incorrect review " + review);
		// }
		//
		// Update update = update("publicationDate", review.getCreationDate());
		// WriteResult result = mongoTemplate.updateMulti(updateQ, update,
		// Review.class);
		// }

		return new ResponseEntity<String>("Done", HttpStatus.OK);
	}

	@RequestMapping(value = "/parseMetaData", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> parseMetaData() {

		// Re-parse all reviews meta data
		// Don't risk parsing a review that is being created
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.HOUR, -2);

		// Criteria crit = where("id").is("580d12cb0ca136653db61a64");

		Criteria crit = where("creationDate").lt(calendar.getTime());
		Criteria invalid = where("invalidGame").is(true);
		Criteria unprocessed = where("invalidGame").exists(false);
		Criteria emptyGameMode = where("metaData.gameMode").is(null);
		crit.orOperator(invalid, unprocessed, emptyGameMode);

		Query query = query(crit);

		PageRequest pageRequest = new PageRequest(0, 20);

		query.with(pageRequest);

		List<Review> find = mongoTemplate.find(query, Review.class);
		log.debug("Parsing " + find.size() + " reviews to add meta data");

		for (Review review : find) {
			review.setInvalidGame(false);
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

	@RequestMapping(value = "/parseMetaData/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> parseMetaData(@PathVariable("reviewId") final String id) {

		Criteria crit = where("id").is(id);
		Query query = query(crit);

		List<Review> find = mongoTemplate.find(query, Review.class);
		log.debug("Parsing " + find.size() + " reviews to add meta data");

		for (Review review : find) {
			review.setInvalidGame(false);
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

	@RequestMapping(value = "/reinit", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> reinit() {

		List<String> ids = Arrays.asList(new String[] { "579236c1e4b00e76c0453ea8", "579236c1e4b00e76c0453ea9",
				"57938dbee4b00e76c0453eb8", "57938dbfe4b00e76c0453eb9", "57938dbfe4b00e76c0453eba",
				"579456a9e4b00e76c0453ec1", "579456a9e4b00e76c0453ec2", "5794e13fe4b00e76c0453ecf",
				"5794e13fe4b00e76c0453ed0", "5794e13fe4b00e76c0453ed1", "5794e141e4b00e76c0453ed2",
				"5794e142e4b00e76c0453ed3", "5794ea58e4b00e76c0453ed4", "57957f38e4b00e76c0453ee5",
				"57957f38e4b00e76c0453ee6", "57957f39e4b00e76c0453ee7", "57957f39e4b00e76c0453ee8",
				"5795801be4b00e76c0453ee9", "5795801be4b00e76c0453eea", "5795801be4b00e76c0453eeb",
				"5795801be4b00e76c0453eec", "57973684e4b00e76c0453ef7", "5797d50fe4b00e76c0453efe",
				"5797d50fe4b00e76c0453eff", "5797d50fe4b00e76c0453f00", "5797d510e4b00e76c0453f01",
				"5799e49fe4b00e76c0453f05", "5799e49fe4b00e76c0453f06", "579d1ff1e4b00e76c0453f2e",
				"579d1ff1e4b00e76c0453f2f", "579d1ff1e4b00e76c0453f30", "579ed3efe4b00e76c0453f4a",
				"579ed3efe4b00e76c0453f4b", "579ed3efe4b00e76c0453f4c", "579ed3efe4b00e76c0453f4d",
				"579f73dae4b00e76c0453f68", "579f73dae4b00e76c0453f69", "579f73dae4b00e76c0453f6a",
				"579fa70ce4b00e76c0453f75", "579fa70ce4b00e76c0453f76", "579fa70ce4b00e76c0453f77",
				"579fa9dbe4b00e76c0453f7a", "579fa9dbe4b00e76c0453f7b", "579fa9dbe4b00e76c0453f7c",
				"57a06d87e4b00e76c0453f90", "57a06d87e4b00e76c0453f91", "57a06d87e4b00e76c0453f92" });

		// Iterable<Review> reviews = reviewRepository.findAll(ids);

		for (String id : ids) {
			Review review = reviewRepository.findById(id);
			log.debug("processing review " + id);
			review.setInvalidGame(false);
			review.setLastMetaDataParsingDate(null);
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

			reviewRepository.save(review);
		}

		return new ResponseEntity<String>("Updated ", HttpStatus.OK);
	}
}
