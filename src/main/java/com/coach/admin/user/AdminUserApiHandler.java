package com.coach.admin.user;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joda.time.DateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.core.security.User;
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

		Map<String, UserInfo> infos = new HashMap<>();

		for (User user : users) {
			log.debug("adding user " + user);
			UserInfo info = new UserInfo();
			info.setName(user.getUsername());
			info.setEmail(user.getEmail());
			info.setRegistrationDate(new DateTime(user.getCreationDate()));
			info.setReputation(user.getReputation());
			info.setLastParticipationDate(new DateTime(user.getCreationDate()));
			infos.put(user.getId(), info);
		}

		for (Review review : reviews) {
			log.debug("adding review " + review);
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
		log.debug("Built user info");

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

		String header = "Name,Email,Registration date,Reputation,Last participation,Reviews,Comments,List reviews,List comments";
		result += header + "\r\n";

		for (UserInfo info : list) {
			log.debug("Parsing info " + info);
			result += info.getName() + "," + info.getEmail() + "," + info.getRegistrationDate().toString("yyyy/MM/dd")
					+ "," + info.getReputation() + "," + info.getLastParticipationDate().toString("yyyy/MM/dd") + ","
					+ info.getNumberOfReviews() + "," + info.getNumberOfComments() + ","
					+ info.getReviews().toString().replaceAll(",", ";") + ","
					+ info.getComments().toString().replaceAll(",", ";") + ",";
			result += "\r\n";
		}

		return result;
	}
}
