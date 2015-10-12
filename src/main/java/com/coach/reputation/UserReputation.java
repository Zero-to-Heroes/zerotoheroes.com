package com.coach.reputation;

import java.util.HashMap;
import java.util.Map;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import com.coach.review.Review;
import com.coach.review.Review.Sport;

@ToString
@Getter
@Setter
public class UserReputation {

	private Map<Review.Sport, Integer> reputationPerSport;

	/**
	 * Always prefer calling user.modifyReputation() so that global reputation
	 * score is also updated
	 */
	public void modifyReputation(Sport sport, int amount) {
		if (reputationPerSport == null) reputationPerSport = new HashMap<>();
		if (reputationPerSport.get(sport) == null) reputationPerSport.put(sport, 0);

		Integer reputation = reputationPerSport.get(sport);
		reputation = reputation + amount;
		reputationPerSport.put(sport, reputation);
	}

	public int getReputation(Sport sport) {
		if (reputationPerSport == null) reputationPerSport = new HashMap<>();
		if (reputationPerSport.get(sport) == null) reputationPerSport.put(sport, 0);

		return reputationPerSport.get(sport);
	}
}
