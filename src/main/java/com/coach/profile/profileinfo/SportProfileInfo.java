package com.coach.profile.profileinfo;

import java.text.SimpleDateFormat;
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

	private static final SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");

	private Map<String, Rank> rankings = new HashMap<>();
	private String gameIdentifier;
	private Map<Long, Integer> dailyPlays = new HashMap<>();

	public Rank getRankings(String key) {
		return rankings.get(key);
	}

	public void setRanking(String key, String flair) {
		Rank rank = new Rank();
		rank.setKey(flair);
		rankings.put(key, rank);
	}

	public void addDailyGame(Date creationDate) {
		// String date = formatter.format(creationDate);
		Long timestamp = creationDate.getTime() / (1000 * 60 * 60 * 24);
		timestamp = timestamp * 60 * 60 * 24;
		Integer plays = dailyPlays.get(timestamp);
		if (plays == null) {
			plays = 0;
		}
		dailyPlays.put(timestamp, plays + 1);
	}
}
