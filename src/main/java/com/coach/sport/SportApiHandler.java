package com.coach.sport;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@RepositoryRestController
@RequestMapping(value = "/api/sports")
@Slf4j
public class SportApiHandler {

	@Autowired
	SportManager sportManager;

	@RequestMapping(value = "/{sport}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Sport> getSport(@PathVariable("sport") final String sport) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		Sport result = sportManager.findById(sport);

		return new ResponseEntity<Sport>(result, HttpStatus.OK);
	}
}
