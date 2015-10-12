package com.coach.reputation;

import java.util.HashMap;
import java.util.Map;

import com.coach.review.Review;
import com.coach.review.Review.Sport;

public class UserReputation {

	private Map<Review.Sport, Integer> reputationPerSport;

	public void modifyReputation(Sport sport, int amount) {
		if (reputationPerSport == null) reputationPerSport = new HashMap<>();
		if (reputationPerSport.get(sport) == null) reputationPerSport.put(sport, 0);

		Integer reputation = reputationPerSport.get(sport);
		reputation = reputation + amount;
		reputationPerSport.put(sport, reputation);
	}
}
