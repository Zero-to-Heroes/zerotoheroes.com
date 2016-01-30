package com.coach.news;

import java.util.Date;
import java.util.List;

import org.joda.time.DateTime;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.amazonaws.util.StringUtils;
import com.coach.news.News.Type;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/news")
@Slf4j
public class NewsApiHandler {

	private static final int PAST_DAYS_FOR_UNLOGGED = 60;

	@RequestMapping(value = "/features", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<List<News>> getLatestFeatures(
			@RequestParam(value = "dateFrom", required = false) String dateFrom) {

		// log.debug("Retrieving all latest features from " + dateFrom);
		News.Type type = News.Type.Feature;

		List<News> news = getNews(dateFrom, type);
		// log.debug("Retrieved news " + news);
		// log.debug("Giving full list of coaches " + coaches);
		return new ResponseEntity<List<News>>(news, HttpStatus.OK);
	}

	@RequestMapping(value = "/bugfixes", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<List<News>> getLatestBugFixes(
			@RequestParam(value = "dateFrom", required = false) String dateFrom) {

		// log.debug("Retrieving all latest bugfixes from " + dateFrom);
		News.Type type = News.Type.Bug;

		List<News> news = getNews(dateFrom, type);
		// log.debug("Retrieved bugs " + news);
		// log.debug("Giving full list of coaches " + coaches);
		return new ResponseEntity<List<News>>(news, HttpStatus.OK);
	}

	private List<News> getNews(String dateFrom, Type type) {
		Date date;
		if (StringUtils.isNullOrEmpty(dateFrom)) {
			// log.debug("Input date is empty, fallbacking to default date");
			DateTime dt = new DateTime();
			DateTime fetchDate = dt.minusDays(PAST_DAYS_FOR_UNLOGGED);
			date = fetchDate.toDate();
		}
		else {
			DateTime dt = new DateTime(Long.parseLong(dateFrom));
			// Display a bit more than strictly necessary
			DateTime fetchDate = dt.minusDays(1);
			date = fetchDate.toDate();
		}
		return NewsRepository.getNewsAfter(date, type);
	}
}
