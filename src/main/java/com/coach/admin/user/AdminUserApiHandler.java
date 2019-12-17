package com.coach.admin.user;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;
import static org.springframework.data.mongodb.core.query.Update.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Field;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.core.security.User;
import com.coach.notifications.NotificationDao;
import com.coach.profile.Profile;
import com.coach.profile.ProfileRepository;
import com.coach.profile.ProfileService;
import com.coach.review.ReviewRepository;
import com.coach.sport.SportRepository;
import com.coach.user.ResetPasswordRepository;
import com.coach.user.UserRepository;
import com.mongodb.WriteResult;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/admin")
@Slf4j
public class AdminUserApiHandler {

	private static final List<String> UNSUBSCRIBED_EMAILS = Arrays.asList();

	@Autowired
	UserRepository userRepository;

	@Autowired
	ProfileService profileService;
	@Autowired
	ProfileRepository profileRepository;

	@Autowired
	ReviewRepository reviewRepository;

	@Autowired
	ResetPasswordRepository resetPasswordRepository;

	@Autowired
	SportRepository sportRepository;

	@Autowired
	NotificationDao notificationDao;

	@Autowired
	MongoTemplate mongoTemplate;

	private final String environment;

	@Autowired
	public AdminUserApiHandler(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	@RequestMapping(value = "/userInfo", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getUserInfo() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		log.debug("Retrieving user info");

		// List<Review> reviews = reviewRepository.findAll();
		List<User> users = userRepository.findAll();
		List<Profile> profiles = profileRepository.findAll();

		Map<String, UserInfo> infos = new HashMap<>();
		Map<String, Profile> profileMap = new HashMap<>();

		for (Profile profile : profiles) {
			profileMap.put(profile.getUserId(), profile);
		}

		for (User user : users) {
			// log.debug("adding user " + user);
			UserInfo info = new UserInfo();
			Profile profile = profileMap.get(user.getId());
			if (profile == null) {
				profile = new Profile();
			}
			info.setName(user.getUsername());
			info.setEmail(user.getEmail());
			if (user.getCreationDate() == null) {
				log.info("No creation date for " + user);
				user.setCreationDate(DateTimeFormat.forPattern("yyyy-MM-dd").parseDateTime("2015-09-01").toDate());
			}
			info.setRegistrationDate(new DateTime(user.getCreationDate()));
			info.setReputation(user.getReputation());
			info.setLastParticipationDate(new DateTime(user.getCreationDate()));
			info.setCanContact(profile.getPreferences().isEmailContact());
			infos.put(user.getId(), info);
		}

		// for (Review review : reviews) {
		// if (!review.isPublished()) {
		// continue;
		// }
		// // log.debug("adding review " + review);
		// if (review.getAuthorId() != null) {
		// infos.get(review.getAuthorId()).addReview(review);
		// }
		// if (review.getComments() != null) {
		// for (Comment comment : review.getAllComments()) {
		// if (comment.getAuthorId() != null) {
		// infos.get(comment.getAuthorId()).addComment(review);
		// }
		// }
		// }
		// }
		log.debug("Built user info: " + infos.size());

		List<UserInfo> result = new ArrayList<>();
		result.addAll(infos.values());
		Collections.sort(result, new Comparator<UserInfo>() {
			@Override
			public int compare(UserInfo o1, UserInfo o2) {
				return o1.getRegistrationDate().compareTo(o2.getRegistrationDate());
			}
		});

		String ret = toCsv(result);

		log.debug("Built result " + ret);

		return new ResponseEntity<String>(ret, HttpStatus.OK);
	}


	@RequestMapping(value = "/mailinglist", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getMailListEmails() {
		if ("prod".equalsIgnoreCase(environment)) { 
			return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); 
		}		
		
		List<String> toRemoveEmails = UNSUBSCRIBED_EMAILS;
		
		log.debug("Building mailing list");
		List<User> users = userRepository.findAll();
		List<Profile> profiles = profileRepository.findAll();

		List<String> emails = new ArrayList<>();
		Map<String, Profile> profileMap = new HashMap<>();

		for (Profile profile : profiles) {
			profileMap.put(profile.getUserId(), profile);
		}

		for (User user : users) {
			Profile profile = profileMap.get(user.getId());
			if (profile == null || profile.getPreferences() == null || profile.getPreferences().isEmailContact()) {
				if (toRemoveEmails.contains(user.getEmail())) {
					log.warn("Warn: " + user.getEmail());
				}
				else if (user.getRegisterLocation() != null 
						&& (user.getRegisterLocation().contains("overwolf") || user.getRegisterLocation().contains("hearthstone"))) {
					emails.add(user.getEmail());					
				}
			}
		}
		log.debug("Built mailing list: " + emails.size());

		String result = emails.stream().collect(Collectors.joining("\n"));
		log.info(result);

		return new ResponseEntity<String>(result, HttpStatus.OK);
	}

	private String toCsv(List<UserInfo> list) {
		String result = "";

		String header = "Name,Email,Can contact,Registration date,Reputation,Last participation,Reviews,Comments,List reviews,List comments";
		result += header + "\r\n";

		for (UserInfo info : list) {
			log.debug("Parsing info " + info);
			result += info.getName() + "," + info.getEmail() + "," + info.isCanContact() + ","
					+ info.getRegistrationDate().toString("dd/MM/yyyy") + "," + info.getReputation() + ","
					+ info.getLastParticipationDate().toString("dd/MM/yyyy") + "," + info.getNumberOfReviews() + ","
					+ info.getNumberOfComments() + "," + info.getReviews().toString().replaceAll(",", ";") + ","
					+ info.getComments().toString().replaceAll(",", ";") + ",";
			result += "\r\n";
		}

		return result;
	}

	@RequestMapping(value = "/updateAllUsersContactPref", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> updateContactPrefs() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		// TODO: rerun
		List<String> emails = UNSUBSCRIBED_EMAILS;

		Criteria crit = where("email").in(emails);
		Query query = query(crit);
		Field fields = query.fields();
		fields.include("id");

		List<String> ids = mongoTemplate.find(query, User.class).stream()
				.map(u -> u.getId())
				.collect(Collectors.toList());
		log.debug("Update IDs " + ids.size());
		
		// Update the preference for all these users
		Criteria uCrit = where("userId").in(ids);
		Query uQuery = query(uCrit);
		Update update = update("preferences.emailContact", false);
		WriteResult result = mongoTemplate.updateMulti(uQuery, update, Profile.class);

//		List<String> profileIds = mongoTemplate.find(uQuery, Profile.class).stream()
//				.map(u -> u.getId())
//				.collect(Collectors.toList());
//		log.debug("profileIds IDs " + profileIds.size());

		return new ResponseEntity<String>("updated " + result.getN(), HttpStatus.OK);
	}
}
