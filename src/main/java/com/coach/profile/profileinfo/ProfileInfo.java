package com.coach.profile.profileinfo;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.annotation.Transient;

import com.coach.core.security.User;
import com.coach.review.Review.Sport;
import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ProfileInfo {

	// Mao of <Sport, SportProfileInfo>
	@JsonIgnore
	private Map<String, SportProfileInfo> sportInfos = new HashMap<>();

	// The data that is computed based on current sport, not saved in DB
	@Transient
	private String flair;

	@Transient
	private String gameIdentifier;

	@Transient
	private Map<Long, Integer> dailyPlays = new HashMap<>();

	@Transient
	private Map<Long, Integer> dailyComments = new HashMap<>();

	@Transient
	private Map<Long, Integer> dailyReputationChanges = new HashMap<>();

	@Transient
	private int reputation;

	public void populateForSport(User user, String sport) {
		// Setting the flair to display (depends on the current sport)
		Sport sportObj = Sport.load(sport);
		populateForSport(user, sportObj);
	}

	public void populateForSport(User user, Sport sport) {
		flair = fetchFlair(sport, "unframed");
		gameIdentifier = fetchGameIdentifier(sport);
		dailyPlays = fetchDailyPlays(sport);
		dailyComments = fetchDailyComments(sport);
		dailyReputationChanges = fetchDailyReputationChanges(sport);
		reputation = user.getReputation(sport);
	}

	private Map<Long, Integer> fetchDailyPlays(Sport sport) {
		if (sport == null) { return null; }

		SportProfileInfo sportInfo = sportInfos.get(sport.getKey().toLowerCase());
		if (sportInfo == null) { return null; }

		return sportInfo.getDailyPlays();
	}

	private Map<Long, Integer> fetchDailyComments(Sport sport) {
		if (sport == null) { return null; }

		SportProfileInfo sportInfo = sportInfos.get(sport.getKey().toLowerCase());
		if (sportInfo == null) { return null; }

		return sportInfo.getDailyComments();
	}

	private Map<Long, Integer> fetchDailyReputationChanges(Sport sport) {
		if (sport == null) { return null; }

		SportProfileInfo sportInfo = sportInfos.get(sport.getKey().toLowerCase());
		if (sportInfo == null) { return null; }

		return sportInfo.getDailyReputationChanges();
	}

	public String fetchFlair(Sport sport, String frame) {
		if (sport == null) { return frame; }

		SportProfileInfo sportInfo = sportInfos.get(sport.getKey().toLowerCase());
		if (sportInfo == null) { return frame; }

		if (sportInfo.getRankings("ranked") == null) { return frame; }

		return sportInfo.getRankings("ranked").getKey();
	}

	public String fetchGameIdentifier(Sport sport) {
		if (sport == null) { return null; }

		SportProfileInfo sportInfo = sportInfos.get(sport.getKey().toLowerCase());
		if (sportInfo == null) { return null; }

		return sportInfo.getGameIdentifier();
	}

	public SportProfileInfo getSportInfo(String sport) {
		SportProfileInfo sportProfileInfo = sportInfos.get(sport);
		if (sportProfileInfo == null) {
			sportProfileInfo = new SportProfileInfo();
			sportInfos.put(sport, sportProfileInfo);
		}
		return sportProfileInfo;
	}

}
