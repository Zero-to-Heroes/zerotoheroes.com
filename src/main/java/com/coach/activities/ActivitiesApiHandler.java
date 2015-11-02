package com.coach.activities;

import java.util.List;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.coach.sport.Sport;
import com.coach.sport.SportManager;

@RepositoryRestController
@RequestMapping(value = "/api/activities")
@Slf4j
public class ActivitiesApiHandler {

	@Autowired
	SportManager sportManager;

	@RequestMapping(value = "/{sport}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<List<Activity>> getLatestActivities(@PathVariable("sport") final String sport,
			@RequestParam(value = "quantity", required = false) Integer quantity) {

		log.debug("Retrieving latest activities for " + sport);

		Sport sportObject = sportManager.findById(sport);
		int howMany = quantity == null ? 4 : quantity;
		List<Activity> activities = sportObject.getLatestActivities(howMany);
		log.debug("Latest activities " + activities);

		return new ResponseEntity<List<Activity>>(activities, HttpStatus.OK);
	}
}
