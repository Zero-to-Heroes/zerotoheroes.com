package com.coach.admin.metrics;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;


import lombok.Data;

@Data
public class Metrics {

	private Map<String, Metric> metrics = new HashMap<>();
	private String csv;

	public Metric get(Date creationDate) {
		String key = new SimpleDateFormat("yyyy/MM/dd").format(creationDate);
		Metric metric = metrics.get(key);
		if (metric == null) {
			metric = new Metric();
			metric.setDate(key);
			metrics.put(key, metric);
		}
		return metric;
	}
}
