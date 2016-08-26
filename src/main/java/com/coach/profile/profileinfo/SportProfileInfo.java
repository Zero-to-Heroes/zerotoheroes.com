package com.coach.profile.profileinfo;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import com.coach.rankings.Rank;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@ToString
// The info for a specific sport
public class SportProfileInfo {

	private Map<String, Rank> rankings = new HashMap<>();
	private String gameIdentifier;

	private Map<Long, Integer> dailyPlays = new HashMap<>();
	private Map<Long, Integer> dailyComments = new HashMap<>();
	private Map<Long, Integer> dailyReputationChanges = new HashMap<>();

	public Rank getRankings(String key) {
		return rankings.get(key);
	}

	public void setRanking(String key, String flair) {
		Rank rank = new Rank();
		rank.setKey(flair);
		rankings.put(key, rank);
	}

	public void addDailyGame(Date creationDate) {
		Long timestamp = creationDate.getTime() / (1000 * 60 * 60 * 24);
		timestamp = timestamp * 60 * 60 * 24;
		Integer plays = dailyPlays.get(timestamp);
		if (plays == null) {
			plays = 0;
		}
		dailyPlays.put(timestamp, plays + 1);
	}

	public void addDailyComment(Date creationDate) {
		Long timestamp = creationDate.getTime() / (1000 * 60 * 60 * 24);
		timestamp = timestamp * 60 * 60 * 24;
		Integer plays = dailyComments.get(timestamp);
		if (plays == null) {
			plays = 0;
		}
		dailyComments.put(timestamp, plays + 1);
	}

	public void addDailyReputationChange(Date creationDate, int changeValue) {
		Long timestamp = creationDate.getTime() / (1000 * 60 * 60 * 24);
		timestamp = timestamp * 60 * 60 * 24;
		Integer plays = dailyReputationChanges.get(timestamp);
		if (plays == null) {
			plays = 0;
		}
		dailyReputationChanges.put(timestamp, plays + changeValue);
	}
}
