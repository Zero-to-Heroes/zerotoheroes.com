package com.coach.admin.metrics;

import lombok.Data;

import org.joda.time.DateTime;

@Data
public class Metric {

	private DateTime startDate, endDate;
	private int reviews;
	private int comments;

	public void incrementReviews() {
		reviews++;
	}

	public void incrementComments() {
		comments++;
	}

}
