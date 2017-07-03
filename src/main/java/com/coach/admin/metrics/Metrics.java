package com.coach.admin.metrics;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.joda.time.DateTime;

import lombok.Data;

@Data
public class Metrics {

	private static final DateTime beginningOfTime = new DateTime(2015, 8, 31, 0, 0);
	private static final int durationLength = 1;

	private int totalVideoViews, totalReputation;
	private List<Metric> metrics = new ArrayList<>();
	private String csv;

	public Metric get(Date creationDate) {

		// Find the appropriate metric
		for (Metric met : metrics) {
			if (met.getStartDate().isBefore(creationDate.getTime()) && met.getEndDate().isAfter(creationDate.getTime())) {
				return met;
			}
		}

		Metric metric = new Metric();
		// Find the proper start date
		DateTime start = beginningOfTime;
		DateTime end = start.plusDays(durationLength);

		while (end.isBefore(creationDate.getTime())) {
			start = end;
			end = start.plusDays(durationLength);
		}

		metric.setStartDate(start);
		metric.setEndDate(end);
		metrics.add(metric);

		return metric;
	}
}
