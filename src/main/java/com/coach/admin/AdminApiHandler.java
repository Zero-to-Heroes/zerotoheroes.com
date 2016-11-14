package com.coach.admin;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.review.journal.ArchiveJournalRepository;
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

	@RequestMapping(value = "/findtags", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> updateAllReviews() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		Tag tag = new Tag("Palamurloc");
		Query reviewQuery = query(where("tags").in(tag));
		List<Review> find = mongoTemplate.find(reviewQuery, Review.class);
		log.debug("Found " + find.size() + " reviews tagged");
		for (Review review : find) {
			review.getTags().remove(tag);
			review.getTags().add(new Tag("Murloc Paladin"));
		}
		reviewRepository.save(find);

		return new ResponseEntity<String>((String) null, HttpStatus.OK);
	}
}
