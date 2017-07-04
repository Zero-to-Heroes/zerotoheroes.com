package com.coach.admin.metrics;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;

import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

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

import com.coach.review.ParticipantDetails;
import com.coach.review.Review;
import com.coach.tag.Tag;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/admin/metrics")
@Slf4j
public class MetricsApiHandler {

	@Autowired
	MongoTemplate mongoTemplate;

	private final String environment;

	@Autowired
	public MetricsApiHandler(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getNewMetrics() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		Metrics metrics = new Metrics();

		// Select recent entries only
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.DAY_OF_MONTH, -350);

		Criteria crit = where("strSport").is("hearthstone");
		crit.and("key").ne(null);

		Query query = query(crit);

		Field fields = query.fields();
		fields.include("creationDate");
		fields.include("visibility");
		fields.include("participantDetails");
		fields.include("metaData");
		fields.include("totalComments");
		fields.include("totalHelpfulComments");
		fields.include("viewCount");
		fields.include("tags");
		fields.include("text");
		fields.include("description");
		fields.include("uploaderApplicationKey");
		fields.include("allAuthors");

		List<Review> reviews = mongoTemplate.find(query, Review.class);

		// int totalVideoViews = 0;
		log.debug("Going through all reviews " + reviews.size());
		for (Review review : reviews) {
			Date creationDate = review.getCreationDate();
			if (creationDate == null) {
				continue;
			}

			Metric metric = metrics.get(creationDate);
			metric.incrementReviews();
			if ("private".equalsIgnoreCase(review.getVisibility()) || "restricted".equalsIgnoreCase(review.getVisibility())) {
				metric.incrementPrivateReviews();
			}
			else {
				metric.incrementPublicReviews();
			}

			ParticipantDetails details = review.getParticipantDetails();
			if (details != null) {
				List<Tag> skillLevel = details.getSkillLevel();
				if (skillLevel != null && !skillLevel.isEmpty()) {
					Tag skill = skillLevel.get(0);
					if (skill != null && skill.getText() != null) {
						if (skill.getText().toLowerCase().contains("arena")) {
							metric.incrementArena();
						}
						else if (skill.getText().toLowerCase().contains("rank") || skill.getText().toLowerCase().contains("legend")) {
							metric.incrementRanked();
						}
						else if (skill.getText().toLowerCase().replaceAll(" ",  "").contains("tavernbrawl")) {
							metric.incrementTB();
						}
						else if (skill.getText().toLowerCase().contains("casual")) {
							metric.incrementCasual();
						}
						else if (skill.getText().toLowerCase().contains("friendly")) {
							metric.incrementFriendly();
						}
						else if (skill.getText().toLowerCase().contains("tournament")) {
							metric.incrementTournament();
						}
						else {
							log.debug("Other mode: " + skill.getText().toLowerCase());
						}
					}
					else {
//						log.debug("skill text is empty");
					}
				}
				else {
//					log.debug("SkillLevel is empty");
				}
			}
			else {
				log.debug("details is null");
			}

			metric.addComments(review.getTotalComments());

			String key = review.getUploaderApplicationKey();
			if (key != null && key.toLowerCase().contains("overwolf")) {
				metric.incrementOverwolf();
			}
			else if (key != null && key.toLowerCase().contains("hdt")) {
				metric.incrementHdt();
			}
			else if (key != null && key.toLowerCase().contains("arenatracker")) {
				metric.incrementArenaTracker();
			}
			else if (key != null && key.toLowerCase().contains("arenadrafts")) {
				metric.incrementArenaDrafts();
			}
			else if (key != null) {
				log.debug("Not tracking key: " + key);
			}
			else if (review.getText() != null && review.getText().toLowerCase().contains("hsreplay")) {
				metric.incrementHsReplay();
			}
		}

		log.debug("Finalizing");
		// Sort from oldest to newest - useful both for result presentation and
		// to compute returning users
		Collections.sort(metrics.getMetrics(), new Comparator<Metric>() {
			@Override
			public int compare(Metric o1, Metric o2) {
				return o1.getStartDate().compareTo(o2.getStartDate());
			}
		});

		log.debug("Formatting for CSV ");
		String csvMetrics = toCsv(metrics);
		metrics.setCsv(csvMetrics);

		log.debug(csvMetrics);

		return null;
	}


	private String toCsv(Metrics metrics) {

		String result = "Day,Reviews,Public,Private,Arena,Ranked,TavernBrawl,Friendly,Casual,Tournament,"
				+ "Overwolf,HDT,ArenaTracker,ArenaDrafts,HsReplay,Comments\n";

		for (Metric metric : metrics.getMetrics()) {
			result += metric.getStartDate().toString("yyyy/MM/dd") + ","
					+ metric.getReviews() + ","
					+ metric.getPublicReviews() + ","
					+ metric.getPrivateReviews() + ","
					+ metric.getArena() + ","
					+ metric.getRanked() + ","
					+ metric.getTavernBrawl() + ","
					+ metric.getFriendly() + ","
					+ metric.getCasual() + ","
					+ metric.getTournament() + ","
					+ metric.getOverwolf() + ","
					+ metric.getHdt() + ","
					+ metric.getArenatracker() + ","
					+ metric.getArenadrafts() + ","
					+ metric.getHsreplay() + ","
					+ metric.getComments()
					+ "\n";
		}
		return result;
	}
}
