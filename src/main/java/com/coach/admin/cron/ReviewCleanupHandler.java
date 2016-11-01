package com.coach.admin.cron;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;

import java.util.Arrays;
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

		List<String> ids = Arrays.asList(new String[] { "577ac9f5e4b0124be22ff41b", "577b1190e4b0b1f28472f331",
				"577b1190e4b0b1f28472f332", "577b1ffce4b01865a9af04ee", "577b1ffce4b01865a9af04ef",
				"577b1ffde4b01865a9af04f0", "577b1ffde4b01865a9af04f1", "577b1ffde4b01865a9af04f2",
				"57801514e4b0e63406bd086b", "57801514e4b0e63406bd086c", "57801515e4b0e63406bd086d",
				"57801516e4b0e63406bd086e", "57801516e4b0e63406bd086f", "57801516e4b0e63406bd0870",
				"5780ff3ae4b0e63406bd0880", "5780ff3ae4b0e63406bd0881", "5782bf8fe4b0e63406bd08a2",
				"57847e0ee4b0e63406bd08c0", "57847e0ee4b0e63406bd08c1", "5786796de4b078e92325f588",
				"5786796ee4b078e92325f589", "5786a6cee4b078e92325f58c", "5786a739e4b078e92325f58d",
				"5786a739e4b078e92325f58f", "578711c1e4b078e92325f593", "578711c1e4b078e92325f594",
				"578711c1e4b078e92325f595", "578711c2e4b078e92325f596", "578711c2e4b078e92325f597",
				"578711c2e4b078e92325f598", "578711c2e4b078e92325f599", "578711c3e4b078e92325f59a",
				"57893178e4b0d8b2af9f7d86", "57893178e4b0d8b2af9f7d87", "57893178e4b0d8b2af9f7d88",
				"57893178e4b0d8b2af9f7d89", "57893179e4b0d8b2af9f7d8a", "57893179e4b0d8b2af9f7d8b",
				"57893179e4b0d8b2af9f7d8c", "578d7de1e4b0d8b2af9f7dbe", "578d7de1e4b0d8b2af9f7dbf",
				"578d7de1e4b0d8b2af9f7dc0", "578d7de1e4b0d8b2af9f7dc1", "578d7de1e4b0d8b2af9f7dc2",
				"578e2cf7e4b0d8b2af9f7dca", "578e2cf8e4b0d8b2af9f7dcb", "578f87dfe4b00e76c0453e93",
				"578f87e0e4b00e76c0453e94", "5790cfb2e4b00e76c0453e9f", "5790cfb2e4b00e76c0453ea0",
				"579236c0e4b00e76c0453ea5", "579236c0e4b00e76c0453ea6", "579236c1e4b00e76c0453ea7",
				"579236c1e4b00e76c0453ea8", "579236c1e4b00e76c0453ea9", "57938dbee4b00e76c0453eb8",
				"57938dbfe4b00e76c0453eb9", "57938dbfe4b00e76c0453eba", "579456a9e4b00e76c0453ec1",
				"579456a9e4b00e76c0453ec2", "5794e13fe4b00e76c0453ecf", "5794e13fe4b00e76c0453ed0",
				"5794e13fe4b00e76c0453ed1", "5794e141e4b00e76c0453ed2", "5794e142e4b00e76c0453ed3",
				"5794ea58e4b00e76c0453ed4", "57957f38e4b00e76c0453ee5", "57957f38e4b00e76c0453ee6",
				"57957f39e4b00e76c0453ee7", "57957f39e4b00e76c0453ee8", "5795801be4b00e76c0453ee9",
				"5795801be4b00e76c0453eea", "5795801be4b00e76c0453eeb", "5795801be4b00e76c0453eec",
				"57973684e4b00e76c0453ef7", "5797d50fe4b00e76c0453efe", "5797d50fe4b00e76c0453eff",
				"5797d50fe4b00e76c0453f00", "5797d510e4b00e76c0453f01", "5799e49fe4b00e76c0453f05",
				"5799e49fe4b00e76c0453f06", "579d1ff1e4b00e76c0453f2e", "579d1ff1e4b00e76c0453f2f",
				"579d1ff1e4b00e76c0453f30", "579ed3efe4b00e76c0453f4a", "579ed3efe4b00e76c0453f4b",
				"579ed3efe4b00e76c0453f4c", "579ed3efe4b00e76c0453f4d", "579f73dae4b00e76c0453f68",
				"579f73dae4b00e76c0453f69", "579f73dae4b00e76c0453f6a", "579fa70ce4b00e76c0453f75",
				"579fa70ce4b00e76c0453f76", "579fa70ce4b00e76c0453f77", "579fa9dbe4b00e76c0453f7a",
				"579fa9dbe4b00e76c0453f7b", "579fa9dbe4b00e76c0453f7c", "57a06d87e4b00e76c0453f90",
				"57a06d87e4b00e76c0453f91", "57a06d87e4b00e76c0453f92" });

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

	@RequestMapping(value = "/parseMetaData", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> parseMetaData() {

		// Re-parse all reviews meta data
		// Don't risk parsing a review that is being created
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.HOUR, -2);

		Criteria crit = where("lastMetaDataParsingDate").is(null).and("creationDate").lt(calendar.getTime());
		// Criteria crit = where("creationDate").lt(calendar.getTime());
		Query query = query(crit);

		PageRequest pageRequest = new PageRequest(0, 20);

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
