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
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
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
	ReviewJournalRepository journalRepo;

	private final String environment;

	@Autowired
	public DailyContributionsCronHandler(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	@RequestMapping(value = "/games", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> update() {

		// Load all the unprocessed reviews
		List<ReviewJournal> logs = journalRepo.findAll();
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
		journalRepo.delete(processed);

		return new ResponseEntity<String>("processed " + processed.size() + " logs", HttpStatus.OK);
	}

	@RequestMapping(value = "/initGames", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> init() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		// don't process the journal entries twice (once during init, once
		// during journal cron)
		journalRepo.deleteAll();

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

		// Load all the reviews
		log.debug("loading reviews");
		List<Review> reviews = reviewRepository.findAll();
		log.debug("reviews loaded");

		Set<Profile> modified = new HashSet<>(profiles);

		// Process each review to add the info to the user's profile
		for (Review review : reviews) {
			// Interested only in game creation for now
			if (review.getAuthorId() == null) {
				continue;
			}

			if (review.getSport() == null) {
				continue;
			}

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
		log.debug("modified " + modified.size() + " profiles");

		profileRepository.save(modified);

		return new ResponseEntity<String>("ok", HttpStatus.OK);
	}
}
