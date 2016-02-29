package com.coach.admin.metrics;

import lombok.Data;

import java.util.HashSet;
import java.util.Set;

import org.joda.time.DateTime;

@Data
public class Metric {

	private DateTime startDate, endDate;
	private int reviews;
	private int comments;
	private Set<String> uniqueContentCreators = new HashSet<>();

	public void incrementReviews() {
		reviews++;
	}

	public void incrementComments() {
		comments++;
	}

	public void addUniqueContentCreator(String author) {
		uniqueContentCreators.add(author);
	}

}
