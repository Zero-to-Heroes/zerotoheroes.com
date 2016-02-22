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
		news.add(new News(new DateTime("2016-02-22").toDate(), "hsdecks_support", News.Type.Feature));
		news.add(new News(new DateTime("2016-02-17").toDate(), "own_video_1", News.Type.Feature));
		news.add(new News(new DateTime("2016-02-17").toDate(), "hs_arena_1", News.Type.Feature));
		news.add(new News(new DateTime("2016-02-05").toDate(), "hsplayer_ui_1", News.Type.Feature));
		news.add(new News(new DateTime("2016-01-07").toDate(), "videowidemode", News.Type.Feature));
		news.add(new News(new DateTime("2016-01-07").toDate(), "news7", News.Type.Feature));
		news.add(new News(new DateTime("2015-12-16").toDate(), "news6", News.Type.Feature));
		news.add(new News(new DateTime("2015-11-26").toDate(), "news5", News.Type.Feature));
		news.add(new News(new DateTime("2015-11-26").toDate(), "news4", News.Type.Feature));
		news.add(new News(new DateTime("2015-11-21").toDate(), "news3", News.Type.Feature));
		news.add(new News(new DateTime("2015-11-20").toDate(), "news2", News.Type.Feature));
		news.add(new News(new DateTime("2015-11-19").toDate(), "news1", News.Type.Feature));

		// Bug fixes

		return news;
	}

}
