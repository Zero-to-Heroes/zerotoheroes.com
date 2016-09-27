package com.coach.admin;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.profile.ProfileService;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.review.journal.ArchiveJournal;
import com.coach.review.journal.ArchiveJournalRepository;
import com.coach.review.journal.CommentJournal;
import com.coach.review.journal.Journal;
import com.coach.review.journal.ReputationJournal;
import com.coach.review.journal.ReviewJournal;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/admin")
@Slf4j
public class AdminApiHandler {

	@Autowired
	UserRepository userRepository;

	@Autowired
	ProfileService profileService;

	@Autowired
	ReviewRepository reviewRepository;

	@Autowired
	ArchiveJournalRepository journalRepository;

	private final String environment;

	@Autowired
	public AdminApiHandler(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	@RequestMapping(value = "/updateAllReviews", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> updateAllReviews() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		log.debug("loading journal entries");
		List<ArchiveJournal> journals = journalRepository.findAll();
		log.debug("loaded " + journals.size() + " entries");

		Set<String> recentReviews = new HashSet<>();

		for (ArchiveJournal archiveJournal : journals) {
			Journal journal = archiveJournal.getJournal();
			if (journal instanceof ReviewJournal) {
				recentReviews.add(((ReviewJournal) journal).getReviewId());
			}
			if (journal instanceof CommentJournal) {
				recentReviews.add(((CommentJournal) journal).getReviewId());
			}
			if (journal instanceof ReputationJournal) {
				recentReviews.add(((ReputationJournal) journal).getReviewId());
			}
		}

		log.debug("loading " + recentReviews.size() + " reviews");
		Iterable<Review> reviews = reviewRepository.findAll(recentReviews);
		log.debug("loaded reviews");
		for (Review review : reviews) {
			review.buildAllAuthors();
		}
		log.debug("updating review");
		reviewRepository.save(reviews);
		log.debug("updated reviews");

		return new ResponseEntity<String>((String) null, HttpStatus.OK);
	}
}
