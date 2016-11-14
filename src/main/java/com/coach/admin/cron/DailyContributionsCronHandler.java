package com.coach.admin.cron;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.core.notification.SlackNotifier;
import com.coach.profile.Profile;
import com.coach.profile.ProfileRepository;
import com.coach.profile.ProfileService;
import com.coach.review.ReviewRepository;
import com.coach.review.journal.ArchiveJournal;
import com.coach.review.journal.ArchiveJournalRepository;
import com.coach.review.journal.CommentJournal;
import com.coach.review.journal.CommentJournalRepository;
import com.coach.review.journal.ReputationJournal;
import com.coach.review.journal.ReputationJournalRepository;
import com.coach.review.journal.ReviewJournal;
import com.coach.review.journal.ReviewJournalRepository;
import com.coach.user.UserRepository;
import com.coach.user.UserService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/cron/updateDailyContributions")
@Slf4j
public class DailyContributionsCronHandler {

	@Autowired
	UserRepository userRepository;

	@Autowired
	UserService userService;

	@Autowired
	ProfileService profileService;

	@Autowired
	ProfileRepository profileRepository;

	@Autowired
	ReviewRepository reviewRepository;

	@Autowired
	ReviewJournalRepository reviewJournalRepo;

	@Autowired
	CommentJournalRepository commentJournalRepo;

	@Autowired
	ReputationJournalRepository reputationJournalRepo;

	@Autowired
	ArchiveJournalRepository archiveJournalRepo;

	@Autowired
	SlackNotifier slackNotifier;

	@Autowired
	ActivityHandler activityHandler;

	private final String environment;

	@Autowired
	public DailyContributionsCronHandler(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	@RequestMapping(value = "/game", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> processGames() {

		// Load all the unprocessed reviews
		List<ReviewJournal> logs = reviewJournalRepo.findAll();
		// log.debug("loaded " + logs.size() + " logs");

		List<ReviewJournal> processed = new ArrayList<>();
		List<ArchiveJournal> archives = new ArrayList<>();
		Set<Profile> modified = new HashSet<>();
		Map<String, Profile> profileMap = new HashMap<>();

		for (ReviewJournal log : logs) {
			Date creationDate = log.getGameCreationDate();
			String authorId = log.getAuthorId();
			String sport = log.getSport();

			Profile profile = profileMap.get(authorId);
			if (profile == null) {

				// Anonymous user?
				if (userRepository.findById(authorId) == null) {
					continue;
				}

				profile = profileService.getProfile(authorId);
				profileMap.put(authorId, profile);
			}
			profile.getProfileInfo().getSportInfo(sport).addDailyGame(creationDate);

			activityHandler.handleNewGame(log, profile);

			modified.add(profile);
			processed.add(log);

			// Add archives (for future processing)
			ArchiveJournal archive = new ArchiveJournal(log);
			archives.add(archive);
		}

		// log.debug("processed " + processed.size() + " logs");
		// log.debug("modified " + modified.size() + " profiles");

		profileRepository.save(modified);
		archiveJournalRepo.save(archives);
		reviewJournalRepo.delete(processed);

		return new ResponseEntity<String>("processed " + processed.size() + " game logs", HttpStatus.OK);
	}

	@RequestMapping(value = "/comment", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> processComments() {

		// Load all the unprocessed reviews
		List<CommentJournal> logs = commentJournalRepo.findAll();
		// log.debug("loaded " + logs.size() + " logs");

		List<CommentJournal> processed = new ArrayList<>();
		List<ArchiveJournal> archives = new ArrayList<>();
		Set<Profile> modified = new HashSet<>();
		Map<String, Profile> profileMap = new HashMap<>();

		for (CommentJournal log : logs) {
			Date creationDate = log.getCommentCreationDate();
			String authorId = log.getAuthorId();
			String sport = log.getSport();

			if (creationDate == null || authorId == null || sport == null) {
				slackNotifier.notifyError(new NullPointerException("missing parameter when processing comment"),
						creationDate, authorId, sport, log);
				continue;
			}

			Profile profile = profileMap.get(authorId);
			if (profile == null) {

				// Anonymous user?
				if (userRepository.findById(authorId) == null) {
					continue;
				}

				profile = profileService.getProfile(authorId);
				// profile = profileRepository.findByUserId(authorId);
				profileMap.put(authorId, profile);
			}
			profile.getProfileInfo().getSportInfo(sport).addDailyComment(creationDate);

			activityHandler.handleNewComment(log, profile);

			modified.add(profile);
			processed.add(log);

			// Add archives (for future processing)
			ArchiveJournal archive = new ArchiveJournal(log);
			archives.add(archive);
		}

		// log.debug("processed " + processed.size() + " logs");
		// log.debug("modified " + modified.size() + " profiles");

		profileRepository.save(modified);
		archiveJournalRepo.save(archives);
		commentJournalRepo.delete(processed);

		return new ResponseEntity<String>("processed " + processed.size() + " comment logs", HttpStatus.OK);
	}

	@RequestMapping(value = "/reputation", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> processReputation() {

		// Load all the unprocessed reviews
		List<ReputationJournal> logs = reputationJournalRepo.findAll();
		// log.debug("loaded " + logs.size() + " logs");

		List<ReputationJournal> processed = new ArrayList<>();
		List<ArchiveJournal> archives = new ArrayList<>();
		Set<Profile> modified = new HashSet<>();
		Map<String, Profile> profileMap = new HashMap<>();

		for (ReputationJournal log : logs) {
			Date creationDate = log.getReputationChangeDate();
			String authorId = log.getUserId();
			String sport = log.getSport();
			int changeValue = log.getChangeValue();

			Profile profile = profileMap.get(authorId);
			if (profile == null) {

				// Anonymous user?
				if (userRepository.findById(authorId) == null) {
					continue;
				}

				profile = profileService.getProfile(authorId);
				profileMap.put(authorId, profile);
			}
			profile.getProfileInfo().getSportInfo(sport).addDailyReputationChange(creationDate, changeValue);

			activityHandler.handleNewVote(log, profile);

			modified.add(profile);
			processed.add(log);

			// Add archives (for future processing)
			ArchiveJournal archive = new ArchiveJournal(log);
			archives.add(archive);
		}

		// log.debug("processed " + processed.size() + " logs");
		// log.debug("modified " + modified.size() + " profiles");

		profileRepository.save(modified);
		archiveJournalRepo.save(archives);
		reputationJournalRepo.delete(processed);

		return new ResponseEntity<String>("processed " + processed.size() + " reputation logs", HttpStatus.OK);
	}

}
