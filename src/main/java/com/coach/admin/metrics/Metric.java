package com.coach.admin.metrics;

import java.util.HashMap;
import java.util.Map;

import lombok.Data;

import com.coach.review.Review.Sport;

@Data
public class Metric {

	private String date;
	private int users;
	private int reviews;
	private int comments;
	private Map<Sport, Integer> reviewsPerSport = new HashMap<>();
	private Map<Sport, Integer> commentsPerSport = new HashMap<>();

	public void incrementUsers() {
		users++;
	}

	public void incrementReviews(Sport sport) {
		reviews++;
		Integer sportReviews = reviewsPerSport.get(sport);
		if (sportReviews == null) {
			sportReviews = 0;
		}
		reviewsPerSport.put(sport, sportReviews + 1);
	}

	public void incrementComments(Sport sport) {
		comments++;
		Integer sportReviews = commentsPerSport.get(sport);
		if (sportReviews == null) {
			sportReviews = 0;
		}
		commentsPerSport.put(sport, sportReviews + 1);		
	}

}
