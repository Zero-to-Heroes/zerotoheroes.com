package com.coach.user;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Stats {

	private int numberOfTimestamps;

	@JsonIgnore
	private Map<String, Set<String>> watchedUniqueReviews = new HashMap<>();
	@JsonIgnore
	private Map<String, Integer> numberOfWatchedReviews = new HashMap<>();
	@JsonIgnore
	private Map<String, Set<String>> postedReviews = new HashMap<>();
	@JsonIgnore
	private Map<String, Integer> numberOfPostedReviews = new HashMap<>();
	@JsonIgnore
	private Map<String, Set<String>> postedComments = new HashMap<>();
	@JsonIgnore
	private Map<String, Integer> numberOfPostedComments = new HashMap<>();

	public void incrementTimestamps() {
		numberOfTimestamps++;
	}

	public void addWatchedReview(String sport, String reviewId) {
		Set<String> uniqueReplays = watchedUniqueReviews.get(sport);
		if (uniqueReplays == null) {
			uniqueReplays = new HashSet<>();
			watchedUniqueReviews.put(sport, uniqueReplays);
		}
		uniqueReplays.add(reviewId);

		Integer numberOfWatched = numberOfWatchedReviews.get(sport);
		if (numberOfWatched == null) {
			numberOfWatched = 0;
		}
		numberOfWatchedReviews.put(sport, ++numberOfWatched);
	}

	public void addPostedReview(String sport, String reviewId) {
		Set<String> uniqueReplays = postedReviews.get(sport);
		if (uniqueReplays == null) {
			uniqueReplays = new HashSet<>();
			postedReviews.put(sport, uniqueReplays);
		}
		uniqueReplays.add(reviewId);

		Integer numberOfWatched = numberOfPostedReviews.get(sport);
		if (numberOfWatched == null) {
			numberOfWatched = 0;
		}
		numberOfPostedReviews.put(sport, ++numberOfWatched);
	}

	public void addPostedComment(String sport, String reviewId) {
		Set<String> uniqueReplays = postedComments.get(sport);
		if (uniqueReplays == null) {
			uniqueReplays = new HashSet<>();
			postedComments.put(sport, uniqueReplays);
		}
		uniqueReplays.add(reviewId);

		Integer numberOfWatched = numberOfPostedComments.get(sport);
		if (numberOfWatched == null) {
			numberOfWatched = 0;
		}
		numberOfPostedComments.put(sport, ++numberOfWatched);
	}
}
