package com.coach.admin.metrics;

import java.util.HashSet;
import java.util.Set;

import org.joda.time.DateTime;

import lombok.Data;

@Data
public class Metric {

	private DateTime startDate, endDate;
	private int reviews, privateReviews, publicReviews;
	private int comments;
	private int arena, ranked, tavernBrawl, casual, friendly;
	private Set<String> uniqueReviews = new HashSet<>();

	public void incrementReviews() {
		reviews++;
	}

	public void incrementPrivateReviews() {
		privateReviews++;
	}

	public void incrementComments() {
		comments++;
	}

	public void incrementArena() {
		arena++;
	}

	public void incrementRanked() {
		ranked++;
	}

	public void addComments(int totalComments) {
		comments += totalComments;
	}

	public void incrementPublicReviews() {
		publicReviews++;
	}

	public void incrementTB() {
		tavernBrawl++;
	}

	public void incrementCasual() {
		casual++;
	}

	public void incrementFriendly() {
		friendly++;
	}

}
