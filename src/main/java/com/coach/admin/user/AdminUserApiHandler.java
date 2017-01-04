package com.coach.admin.user;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;
import static org.springframework.data.mongodb.core.query.Update.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
import com.coach.notifications.Notification;
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

		List<String> emails = Arrays.asList("wouter.89@gmail.com", "jeromehebert@ymail.com",
				"terry.pritchard@gmail.com", "rishabh.bajpai@outlook.com", "jamaldieter7@hotmail.com",
				"thibaud@zerotoheroes.com", "sparksterzero@gmail.com", "nfaivret@hotmail.com",
				"jeremie.corbier@gmail.com", "thibaud.jobert@gmail.com", "debon.julien@gmail.com", "tmayeur@gmail.com",
				"guillaume.dosser@gmail.com", "james_terry@me.com", "ninja523@wp.pl", "tizzle1298@gmail.com",
				"dobotronut@yahoo.com", "keymaker_21@hotmail.com", "gruzja@o2.pl", "wrace12@gmail.com",
				"steph.bonnat@free.fr", "james.green@gmail.com", "smg7d@virginia.edu", "pharaon51100@yahoo.com",
				"bruno.pinheiro@hotmail.fr", "simspok@yahoo.fr", "bchapman01@gmail.com", "vincent.rampal@gmail.com",
				"ayreon1001@hotmail.es", "echan01@gmail.com", "gharmuth96@hotmail.com", "seb@zerotoheroes.com",
				"thibaud.jobert@facebook.com", "rlin81@gmail.com", "dataphreak2@gmail.com", "joey.sheff@gmail.com",
				"kelkadiri@hotenet.com", "niuwang@live.com", "jonas.per.fromell@gmail.com", "davemacvicar@gmail.com",
				"Ben104mad@gmail.com", "alex.mullex@yahoo.fr", "christophenegro@gmail.com",
				"sebastien.tromp+test@gmail.com", "nico.grosjean@free.fr", "guillaumetromp@gmail.com",
				"guillaume.jobert@gmail.com", "christophe.vallet@gmail.com", "pvennegues@gmail.com",
				"pmarx@saulnes-badminton.com", "jeanflouret@yahoo.fr", "damian_leszek@yahoo.com",
				"thibault.cambuzat@gmail.com", "shawnbjf@gmail.com", "saladirgaming@gmail.com",
				"enidnama1301@hotmail.fr", "carole_f_fr@yahoo.fr", "phihag@phihag.de", "frederic.pierre.info@gmail.com",
				"mail4.essence@gmail.com", "roger.martaud@gmail.com", "asad16@gmail.com", "delorme.renaud@gmail.com",
				"sebastien.tromp+test15@gmail.com", "sebastien.tromp+test16@gmail.com", "denisulmer@gmail.com",
				"simon.mair@gmx.de", "Sirkrispee@gmail.com", "rwix94@gmail.com", "sebastien.tromp@gmail.com",
				"a24648@trbvn.com", "sebastien.tromp+daedin@gmail.com", "shrenik.shah@nextgenclearing.com",
				"youwtipsolforge@gmail.com", "wesley124@gmail.com", "victor.history@hotmail.com",
				"jake.godfrey99@gmail.com", "ivanof76@gmail.com", "alex200295@hotmail.fr", "superbenj@gmail.com",
				"c2149670@trbvn.com", "mcrawford@gmail.com", "evg.veretennikov@gmail.com", "jimvandriel@upcmail.nl",
				"peter.nastke@gmx.de", "outohuupio@hotmail.com", "tiberium1337@gmx.de", "tatu@alapta.org",
				"19kamin@gamil.com", "kai.starkk@live.com", "24erre@gmaiil.com", "h2560524@mvrht.com");

		Criteria crit = where("email").in(emails);
		Query query = query(crit);
		Field fields = query.fields();
		fields.include("id");

		List<String> ids = mongoTemplate.find(query, User.class).stream().map(u -> u.getId())
				.collect(Collectors.toList());
		log.debug("Update IDs " + ids.size());
		log.debug("" + ids);

		// Update the preference for all these users
		Criteria uCrit = where("userId").in(ids);
		Query uQuery = query(uCrit);

		Update update = update("preferences.emailContact", false);
		WriteResult result = mongoTemplate.updateMulti(uQuery, update, Profile.class);

		return new ResponseEntity<String>("updated " + result.getN(), HttpStatus.OK);
	}

	@RequestMapping(value = "/updateAllUsers", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> updateAllUsers() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		log.debug("Retrieving users");
		List<User> users = userRepository.findAll();
		log.debug("Retrieving profiles");
		List<Profile> profiles = profileRepository.findAll();

		log.debug("Building map");
		Map<String, UserInfo> infos = new HashMap<>();
		Map<String, Profile> profileMap = new HashMap<>();

		for (Profile profile : profiles) {
			profileMap.put(profile.getUserId(), profile);
		}

		log.debug("Clearing existing notifs");
		notificationDao.clearAll();

		List<Notification> newNotifs = new ArrayList<>();
		Set<Profile> modifiedProfiles = new HashSet<>();

		for (User user : users) {
			log.debug("\tProcessing user " + user.getUsername());

			Profile profile = profileMap.get(user.getId());
			profile.getNotifications().setUnreadNotifs(0);

			modifiedProfiles.add(profile);
		}

		log.debug("Saving " + newNotifs.size() + " new notifs");
		notificationDao.save(newNotifs);
		log.debug("Saving " + modifiedProfiles.size() + " modified profiles");
		profileRepository.save(modifiedProfiles);
		log.debug("Job's done!");

		return new ResponseEntity<String>("ok", HttpStatus.OK);
	}
}
