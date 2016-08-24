package com.coach.profile.profileinfo;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.annotation.Transient;

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

	public void populateForSport(String sport) {
		// Setting the flair to display (depends on the current sport)
		Sport sportObj = Sport.load(sport);
		populateForSport(sportObj);
	}

	public void populateForSport(Sport sport) {
		String flair = fetchFlair(sport, "unframed");
		setFlair(flair);

		// Setting the game identifier (eg BTag)
		String gameIdentifier = fetchGameIdentifier(sport);
		setGameIdentifier(gameIdentifier);
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
