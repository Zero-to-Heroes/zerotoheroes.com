package com.coach.news;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.joda.time.DateTime;

import com.coach.news.News.Type;

public class NewsRepository {

	private static final List<News> NEWS = buildNews();

	public static List<News> getNewsAfter(Date date, Type type) {
		List<News> news = new ArrayList<>();

		for (News candidate : NEWS) {
			if (candidate.getDate().after(date) && type.equals(candidate.getType())) {
				news.add(candidate);
			}
		}
		return news;
	}

	private static List<News> buildNews() {
		List<News> news = new ArrayList<>();

		// Features
		news.add(new News(new DateTime("2015-10-01").toDate(),
				"You can now see the new features we've added since the last time you've visited", News.Type.Feature));

		// Bug fixes
		news.add(new News(new DateTime("2015-10-01").toDate(),
				"Controls don't appear on fullscreen video", News.Type.Bug));
		news.add(new News(new DateTime("2015-10-01").toDate(),
				"Notification email contains the incorrect commentator name on nested comments", News.Type.Bug));

		return news;
	}

}
