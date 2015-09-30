package com.coach.news;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.joda.time.DateTime;

public class NewsRepository {

	private static final List<News> NEWS = buildNews();

	public static List<News> getNewsAfter(Date date) {
		List<News> news = new ArrayList<>();

		for (News candidate : NEWS) {
			if (candidate.getDate().after(date)) {
				news.add(candidate);
			}
		}
		return news;
	}

	private static List<News> buildNews() {
		List<News> news = new ArrayList<>();

		news.add(new News(new DateTime("2015-10-01").toDate(),
				"You can now see the new features we've added since the last time you've visited"));

		return news;
	}

}
