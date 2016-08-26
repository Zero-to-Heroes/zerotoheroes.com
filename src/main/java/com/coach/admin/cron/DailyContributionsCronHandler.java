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

import com.coach.core.security.User;
import com.coach.profile.Profile;
import com.coach.profile.ProfileRepository;
import com.coach.profile.ProfileService;
import com.coach.profile.profileinfo.SportProfileInfo;
import com.coach.review.Comment;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
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
		log.debug("loaded " + logs.size() + " logs");

		List<ReviewJournal> processed = new ArrayList<>();
		Set<Profile> modified = new HashSet<>();
		Map<String, Profile> profileMap = new HashMap<>();

		for (ReviewJournal log : logs) {
			Date creationDate = log.getGameCreationDate();
			String authorId = log.getAuthorId();
			String sport = log.getSport();

			Profile profile = profileMap.get(authorId);
			if (profile == null) {
				profile = profileRepository.findByUserId(authorId);
				profileMap.put(authorId, profile);
			}
			profile.getProfileInfo().getSportInfo(sport).addDailyGame(creationDate);
			modified.add(profile);
			processed.add(log);
		}

		log.debug("processed " + processed.size() + " logs");
		log.debug("modified " + modified.size() + " profiles");

		profileRepository.save(modified);
		reviewJournalRepo.delete(processed);

		return new ResponseEntity<String>("processed " + processed.size() + " game logs", HttpStatus.OK);
	}

	@RequestMapping(value = "/comment", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> processComments() {

		// Load all the unprocessed reviews
		List<CommentJournal> logs = commentJournalRepo.findAll();
		log.debug("loaded " + logs.size() + " logs");

		List<CommentJournal> processed = new ArrayList<>();
		Set<Profile> modified = new HashSet<>();
		Map<String, Profile> profileMap = new HashMap<>();

		for (CommentJournal log : logs) {
			Date creationDate = log.getCommentCreationDate();
			String authorId = log.getAuthorId();
			String sport = log.getSport();

			Profile profile = profileMap.get(authorId);
			if (profile == null) {
				profile = profileRepository.findByUserId(authorId);
				profileMap.put(authorId, profile);
			}
			profile.getProfileInfo().getSportInfo(sport).addDailyComment(creationDate);
			modified.add(profile);
			processed.add(log);
		}

		log.debug("processed " + processed.size() + " logs");
		log.debug("modified " + modified.size() + " profiles");

		profileRepository.save(modified);
		commentJournalRepo.delete(processed);

		return new ResponseEntity<String>("processed " + processed.size() + " comment logs", HttpStatus.OK);
	}

	@RequestMapping(value = "/reputation", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> processReputation() {

		// Load all the unprocessed reviews
		List<ReputationJournal> logs = reputationJournalRepo.findAll();
		log.debug("loaded " + logs.size() + " logs");

		List<ReputationJournal> processed = new ArrayList<>();
		Set<Profile> modified = new HashSet<>();
		Map<String, Profile> profileMap = new HashMap<>();

		for (ReputationJournal log : logs) {
			Date creationDate = log.getReputationChangeDate();
			String authorId = log.getUserId();
			String sport = log.getSport();
			int changeValue = log.getChangeValue();

			Profile profile = profileMap.get(authorId);
			if (profile == null) {
				profile = profileRepository.findByUserId(authorId);
				profileMap.put(authorId, profile);
			}
			profile.getProfileInfo().getSportInfo(sport).addDailyReputationChange(creationDate, changeValue);
			modified.add(profile);
			processed.add(log);
		}

		log.debug("processed " + processed.size() + " logs");
		log.debug("modified " + modified.size() + " profiles");

		profileRepository.save(modified);
		reputationJournalRepo.delete(processed);

		return new ResponseEntity<String>("processed " + processed.size() + " reputation logs", HttpStatus.OK);
	}

	@RequestMapping(value = "/init", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> init() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		// Build the map of users
		log.debug("Retrieving user info");
		List<User> users = userRepository.findAll();
		Map<String, User> userMap = new HashMap<>();
		for (User user : users) {
			userMap.put(user.getId(), user);
		}

		// Build the map of profiles
		List<Profile> profiles = profileRepository.findAll();
		Map<String, Profile> profileMap = new HashMap<>();
		for (Profile profile : profiles) {
			for (SportProfileInfo sportInfo : profile.getProfileInfo().getSportInfos().values()) {
				sportInfo.getDailyPlays().clear();
			}
			profileMap.put(profile.getUserId(), profile);
		}

		// don't process the journal entries twice (once during init, once
		// during journal cron)
		reviewJournalRepo.deleteAll();

		// Load all the reviews
		log.debug("loading reviews");
		List<Review> reviews = reviewRepository.findAll();
		log.debug("reviews loaded");

		Set<Profile> modified = new HashSet<>(profiles);

		// Process each review to add the info to the user's profile
		for (Review review : reviews) {

			if (review.getSport() == null) {
				continue;
			}

			if (review.getAuthorId() != null) {
				Profile profile = profileMap.get(review.getAuthorId());
				if (profile == null) {
					profile = new Profile();
					profile.setUserId(review.getAuthorId());
				}

				SportProfileInfo sportInfo = profile.getProfileInfo()
						.getSportInfo(review.getSport().getKey().toLowerCase());
				sportInfo.addDailyGame(review.getCreationDate());
				modified.add(profile);
			}

			if (review.getAllComments() != null && !review.getAllComments().isEmpty()) {
				for (Comment comment : review.getAllComments()) {
					if (comment.getAuthorId() == null) {
						continue;
					}

					Profile profile = profileMap.get(comment.getAuthorId());
					if (profile == null) {
						profile = new Profile();
						profile.setUserId(comment.getAuthorId());
					}

					SportProfileInfo sportInfo = profile.getProfileInfo()
							.getSportInfo(review.getSport().getKey().toLowerCase());
					sportInfo.addDailyComment(comment.getCreationDate());
					modified.add(profile);
				}
			}

		}
		log.debug("modified " + modified.size() + " profiles");

		profileRepository.save(modified);

		return new ResponseEntity<String>("ok", HttpStatus.OK);
	}
}
