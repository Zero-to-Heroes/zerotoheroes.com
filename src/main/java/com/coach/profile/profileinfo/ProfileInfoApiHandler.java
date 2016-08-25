package com.coach.profile.profileinfo;

import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.core.security.User;
import com.coach.profile.Profile;
import com.coach.profile.ProfileRepository;
import com.coach.profile.ProfileService;
import com.coach.user.UserRepository;
import com.coach.user.UserService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/profileinfo")
@Slf4j
public class ProfileInfoApiHandler {

	@Autowired
	UserRepository userRepo;

	@Autowired
	UserService userService;

	@Autowired
	ProfileService profileService;

	@Autowired
	ProfileRepository profileRepo;

	@RequestMapping(value = "/{user}/{sport}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<ProfileInfo> getPreferences(@PathVariable("user") final String user,
			@PathVariable(value = "sport") String sport) {

		ProfileInfo response = null;

		Profile profile = null;
		User userObj = null;
		if (StringUtils.isEmpty(user)) {
			userObj = userService.getLoggedInUser();
			profile = profileService.getLoggedInProfile();
		}
		else {
			userObj = userRepo.findByUsername(user);
			if (userObj != null) {
				profile = profileService.getProfile(userObj.getId());
			}
		}

		if (profile == null) { return new ResponseEntity<ProfileInfo>(response, HttpStatus.NOT_FOUND); }

		response = profile.getProfileInfo();
		response.populateForSport(userObj, sport);

		return new ResponseEntity<ProfileInfo>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/{user}/{sport}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<ProfileInfo> updatePreferences(@PathVariable("user") final String userInput,
			@PathVariable("sport") final String sport, @RequestBody ProfileInfo input) {

		log.debug("updating profile info " + sport + " for user " + userInput);
		// Maybe enforced by Spring already
		if (sport == null || userInput == null) { return new ResponseEntity<ProfileInfo>((ProfileInfo) null,
				HttpStatus.BAD_REQUEST); }

		User user = userService.getLoggedInUser();
		if (user == null || !userInput.equalsIgnoreCase(user.getUsername())) { return new ResponseEntity<ProfileInfo>(
				(ProfileInfo) null, HttpStatus.FORBIDDEN); }

		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<ProfileInfo>((ProfileInfo) null, HttpStatus.FORBIDDEN); }

		ProfileInfo profileInfo = profile.getProfileInfo();

		SportProfileInfo sportInfo = profileInfo.getSportInfo(sport);
		sportInfo.setGameIdentifier(input.getGameIdentifier());
		String flair = input.getFlair() != null && !input.getFlair().equalsIgnoreCase("hidden") ? input.getFlair()
				: null;
		sportInfo.setRanking("ranked", flair);

		profileInfo.populateForSport(user, sport);
		profileRepo.save(profile);

		return new ResponseEntity<ProfileInfo>(profileInfo, HttpStatus.OK);
	}
}
