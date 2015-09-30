package com.coach.news;

import java.util.Date;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

import org.joda.time.DateTime;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.amazonaws.util.StringUtils;

@RepositoryRestController
@RequestMapping(value = "/api/news")
@Slf4j
public class NewsApiHandler {

	private static final int PAST_DAYS_FOR_UNLOGGED = 60;

	@RequestMapping(value = "/features", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<List<News>> getLatestFeatures(
			@RequestParam(value = "dateFrom", required = false) String dateFrom) {

		log.debug("Retrieving all news from " + dateFrom);
		Date date;
		if (StringUtils.isNullOrEmpty(dateFrom)) {
			log.debug("Input date is empty, fallbacking to default date");
			DateTime dt = new DateTime();
			DateTime fetchDate = dt.minusDays(PAST_DAYS_FOR_UNLOGGED);
			date = fetchDate.toDate();
		}
		else {
			date = new Date(Long.parseLong(dateFrom));
		}

		List<News> news = NewsRepository.getNewsAfter(date);
		log.debug("Retrieved news " + news);
		// log.debug("Giving full list of coaches " + coaches);
		return new ResponseEntity<List<News>>(news, HttpStatus.OK);
	}
}
