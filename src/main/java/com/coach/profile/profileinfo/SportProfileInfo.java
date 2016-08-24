package com.coach.profile.profileinfo;

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

	public Rank getRankings(String key) {
		return rankings.get(key);
	}

	public void setRanking(String key, String flair) {
		Rank rank = new Rank();
		rank.setKey(flair);
		rankings.put(key, rank);
	}
}
