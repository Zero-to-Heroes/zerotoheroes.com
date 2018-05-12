package com.coach.admin.metrics;

import com.coach.review.ParticipantDetails;
import com.coach.review.Review;
import com.coach.tag.Tag;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Field;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.fields;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.group;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.match;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.project;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@RestController
@RequestMapping(value = "/api/admin/metrics")
@Slf4j
public class MetricsApiHandler {
	
	public static class TimeMetric {
		String day, month, year, hour, minute;
		int reviewsPerMinute;		
	}
	
	@AllArgsConstructor
	@Getter
	public static class ShortMetric {
		String date;
		int reviewsPerMinute;
	}

	@Autowired
	MongoTemplate mongoTemplate;

	private final String environment;

	@Autowired
	public MetricsApiHandler(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}
	
	@RequestMapping(method = RequestMethod.GET, value="/minute")
	public @ResponseBody ResponseEntity<String> getNewMetricsMinute() {
		
		if ("prod".equals(environment)) {
//			return ResponseEntity.unprocessableEntity().body("Not allowed in prod");
		}

		log.debug("Starting metrics init");
		
		Calendar calendar = Calendar.getInstance();
		calendar.set(2018, 3, 9, 0, 0, 0);
		
		Aggregation agg = newAggregation(
				match(where("creationDate").exists(true)),
				match(where("creationDate").gte(calendar.getTime())),
			    project()       
			        .andExpression("year(creationDate)").as("year")
			        .andExpression("month(creationDate)").as("month")
			        .andExpression("dayOfMonth(creationDate)").as("day")
			        .andExpression("hour(creationDate)").as("hour")
			        .andExpression("minute(creationDate)").as("minute"),
			    group(fields().and("year").and("month").and("day").and("hour").and("minute"))     
			        .count().as("reviewsPerMinute"));
		
		AggregationResults<TimeMetric> result = 
			    mongoTemplate.aggregate(agg, "review", TimeMetric.class);
		List<TimeMetric> resultList = result.getMappedResults();
		
		String join = resultList.stream()
			.map(m -> new ShortMetric(
					m.year + "/" 
							+ String.format("%02d", Integer.valueOf(m.month)) + "/" 
							+ String.format("%02d", Integer.valueOf(m.day)) + " " 
							+ String.format("%02d", Integer.valueOf(m.hour)) + ":" 
							+ String.format("%02d", Integer.valueOf(m.minute)) + ":00", 
					m.reviewsPerMinute))
			.sorted(Comparator.comparing(ShortMetric::getDate))
			.map(m -> m.date + "," + m.reviewsPerMinute)
			.collect(Collectors.joining("\n"));
		System.out.println(join);
		

		return ResponseEntity.ok("");
	}
	
	@RequestMapping(method = RequestMethod.GET, value="/day")
	public @ResponseBody ResponseEntity<String> getNewMetricsDay() {
		
		if ("prod".equals(environment)) {
			return ResponseEntity.unprocessableEntity().body("Not allowed in prod");
		}

		log.debug("Starting metrics init");
		
		Calendar calendar = Calendar.getInstance();
		calendar.set(2018, 3, 6, 0, 0, 0);
		
		Aggregation agg = newAggregation(
				match(where("creationDate").exists(true)),
//				match(where("creationDate").gte(calendar.getTime())),
			    project()       
			        .andExpression("year(creationDate)").as("year")
			        .andExpression("month(creationDate)").as("month")
			        .andExpression("dayOfMonth(creationDate)").as("day"),
			    group(fields().and("year").and("month").and("day"))     
			        .count().as("reviewsPerMinute"));
		
		AggregationResults<TimeMetric> result = 
			    mongoTemplate.aggregate(agg, "review", TimeMetric.class);
		List<TimeMetric> resultList = result.getMappedResults();
		
		String join = resultList.stream()
			.map(m -> new ShortMetric(
					m.year + "/" 
							+ String.format("%02d", Integer.valueOf(m.month)) + "/" 
							+ String.format("%02d", Integer.valueOf(m.day)), 
					m.reviewsPerMinute))
			.sorted(Comparator.comparing(ShortMetric::getDate))
			.map(m -> m.date + "," + m.reviewsPerMinute)
			.collect(Collectors.joining("\n"));
		System.out.println(join);
		

		return ResponseEntity.ok("");
	}

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getNewMetrics() {
		
		if ("prod".equals(environment)) {
			return ResponseEntity.unprocessableEntity().body("Not allowed in prod");
		}

		log.debug("Starting metrics init");

		Metrics metrics = new Metrics();

		Criteria crit = where("strSport").is("hearthstone")
			.and("key").ne(null)
			.and("creationDate").gte(LocalDateTime.of(2018, 3, 1, 0, 0));

		Query query = query(crit);

		Field fields = query.fields();
		fields.include("creationDate");
		fields.include("visibility");
		fields.include("participantDetails");
		fields.include("metaData");
		fields.include("totalComments");
		fields.include("viewCount");
		fields.include("tags");
		fields.include("uploaderApplicationKey");

		List<Review> reviews = mongoTemplate.find(query, Review.class);
		
		List<String> unparsedReviewIds = new ArrayList<>();

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
			
			if (StringUtils.isEmpty(review.getParticipantDetails().getPlayerName())) {
				metric.incrementUnparsableReplay();
				unparsedReviewIds.add(review.getId());
			}
		}
		
		log.debug("Unparsed review Ids: " + unparsedReviewIds);

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

		return ResponseEntity.ok(csvMetrics);
	}


	private String toCsv(Metrics metrics) {

		String result = "Day,Reviews,Public,Private,Arena,Ranked,TavernBrawl,Friendly,Casual,Tournament,"
				+ "Overwolf,HDT,ArenaTracker,ArenaDrafts,HsReplay,UnparsableReplays,Comments\n";

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
					+ metric.getUnparsableReplays() + ","
					+ metric.getComments()
					+ "\n";
		}
		return result;
	}
}
