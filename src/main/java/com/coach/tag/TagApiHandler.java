package com.coach.tag;

import java.util.List;

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
@RequestMapping(value = "/api/tags")
@Slf4j
public class TagApiHandler {

	@Autowired
	TagRepository reviewRepo;

	@RequestMapping(value = "/{sport}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<List<Tag>> getTagsForSport(@PathVariable("sport") final String sport) {
		log.debug("Retrieving all tags for sport " + sport);

		List<Tag> tags = TagRepository.getAllTagsForSport(sport);
		log.debug("Retrieved tags: " + tags);

		return new ResponseEntity<List<Tag>>(tags, HttpStatus.OK);
	}
}
