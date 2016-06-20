package com.coach.admin.metrics;

import java.util.HashSet;
import java.util.Set;

import org.joda.time.DateTime;

import lombok.Data;

@Data
public class Metric {

	private DateTime startDate, endDate;
	private int reviews, privateReviews;
	private int comments;
	private Set<String> uniqueContentCreators = new HashSet<>();
	private Set<String> churn = new HashSet<>();
	private int returningContributors;

	public void incrementReviews() {
		reviews++;
	}

	public void incrementPrivateReviews() {
		privateReviews++;
	}

	public void incrementComments() {
		comments++;
	}

	public void addUniqueContentCreator(String author) {
		uniqueContentCreators.add(author);
	}

}
