package com.coach.admin.user;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
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
import com.coach.review.Comment;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.sport.SportRepository;
import com.coach.user.ResetPasswordRepository;
import com.coach.user.UserRepository;

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

		List<Review> reviews = reviewRepository.findAll();
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
				log.error("No creation date for " + user);
				user.setCreationDate(DateTimeFormat.forPattern("yyyy-MM-dd").parseDateTime("2015-09-01").toDate());
			}
			info.setRegistrationDate(new DateTime(user.getCreationDate()));
			info.setReputation(user.getReputation());
			info.setLastParticipationDate(new DateTime(user.getCreationDate()));
			info.setCanContact(profile.getPreferences().isEmailContact());
			infos.put(user.getId(), info);
		}

		for (Review review : reviews) {
			if (!review.isPublished()) {
				continue;
			}
			// log.debug("adding review " + review);
			if (review.getAuthorId() != null) {
				infos.get(review.getAuthorId()).addReview(review);
			}
			if (review.getComments() != null) {
				for (Comment comment : review.getAllComments()) {
					if (comment.getAuthorId() != null) {
						infos.get(comment.getAuthorId()).addComment(review);
					}
				}
			}
		}
		// log.debug("Built user info");

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

	@SuppressWarnings("deprecation")
	@RequestMapping(value = "/updateAllUsers", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> updateAllUsers() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		log.debug("Retrieving user info");
		List<User> users = userRepository.findAll();
		List<Profile> profiles = profileRepository.findAll();

		Map<String, Profile> profileMap = new HashMap<>();

		for (Profile profile : profiles) {
			profileMap.put(profile.getUserId(), profile);
		}

		List<Profile> modified = new ArrayList<>();

		for (User user : users) {
			log.debug("handling user " + user);
			Profile profile = profileMap.get(user.getId());
			if (profile == null) {
				profile = new Profile();
			}
			// if (profile.getRankings() == null ||
			// profile.getRankings().getRankings().isEmpty()) {
			// continue;
			// }
			//
			// boolean dirty = false;
			//
			// for (String sport : profile.getRankings().getRankings().keySet())
			// {
			// Map<String, Rank> ranking =
			// profile.getRankings().getRankings().get(sport);
			// SportProfileInfo sportProfileInfo =
			// profile.getProfileInfo().getSportInfo(sport);
			// if (sportProfileInfo.getRankings() == null ||
			// sportProfileInfo.getRankings().isEmpty()) {
			// sportProfileInfo.setRankings(ranking);
			// dirty = true;
			// }
			// }

			// if (dirty) {
			// modified.add(profile);
			// }
		}

		log.debug("saving " + modified.size() + " users");
		profileRepository.save(modified);
		log.debug("done");

		return new ResponseEntity<String>("ok", HttpStatus.OK);
	}
}
