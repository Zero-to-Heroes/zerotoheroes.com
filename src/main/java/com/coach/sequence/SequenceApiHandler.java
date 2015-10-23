package com.coach.sequence;

import java.io.IOException;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.coach.core.notification.SlackNotifier;

@RepositoryRestController
@RequestMapping(value = "/api/sequences")
@Slf4j
public class SequenceApiHandler {

	@Autowired
	SequenceRepository sequenceRepo;

	@Autowired
	SlackNotifier slackNotifier;

	@RequestMapping(method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Sequence> createSequence(@RequestBody Sequence sequence) throws IOException {

		log.debug("Creating sequence " + sequence);

		sequence.setCreationDate(new Date());
		sequenceRepo.save(sequence);

		slackNotifier.notifyNewSequence(sequence);

		return new ResponseEntity<Sequence>(sequence, HttpStatus.OK);
	}

	@RequestMapping(value = "/{sport}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<ListSequenceResponse> listAllSequences(@PathVariable("sport") final String sport) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		log.debug("Retrieving all sequences for " + sport);

		// Sorting in ascending order
		Sort newestFirst = new Sort(Sort.Direction.DESC, Arrays.asList("creationDate"));

		List<Sequence> sequences = sequenceRepo.findBySportIgnoreCase(sport, newestFirst);
		ListSequenceResponse response = new ListSequenceResponse(sequences);

		return new ResponseEntity<ListSequenceResponse>(response, HttpStatus.OK);
	}
}
