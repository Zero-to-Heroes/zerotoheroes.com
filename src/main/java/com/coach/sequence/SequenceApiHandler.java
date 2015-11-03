package com.coach.sequence;

import java.io.IOException;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.coach.core.notification.SlackNotifier;
import com.coach.review.Review.Sport;
import com.coach.review.ReviewSearchCriteria;

@RepositoryRestController
@RequestMapping(value = "/api/sequences")
@Slf4j
public class SequenceApiHandler {

	private static final int PAGE_SIZE = 25;

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

	@RequestMapping(value = "/query", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<ListSequenceResponse> listAllSequences(
			@RequestBody ReviewSearchCriteria criteria) {

		int pageNumber = criteria.getPageNumber() != null && criteria.getPageNumber() > 0 ? criteria.getPageNumber() - 1
				: 0;
		String sport = criteria.getSport();

		// Sorting in ascending order
		Sort newestFirst = new Sort(Sort.Direction.DESC, Arrays.asList("creationDate"));

		PageRequest pageRequest = new PageRequest(pageNumber, PAGE_SIZE, newestFirst);
		String sportCriteria = Sport.load(sport).getKey();
		Page<Sequence> page = sequenceRepo.listSequences(criteria.getTitle(), sportCriteria, criteria.getWantedTags(),
				criteria.getUnwantedTags(), pageRequest);

		List<Sequence> sequences = page.getContent();
		ListSequenceResponse response = new ListSequenceResponse(sequences);
		response.setTotalPages(page.getTotalPages());

		return new ResponseEntity<ListSequenceResponse>(response, HttpStatus.OK);
	}
}
