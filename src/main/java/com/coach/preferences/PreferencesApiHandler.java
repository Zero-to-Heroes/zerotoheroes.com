package com.coach.preferences;

import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/preferences")
@Slf4j
public class PreferencesApiHandler {

	@Autowired
	UserRepository userRepo;

	@Autowired
	ProfileService profileService;

	@Autowired
	ProfileRepository profileRepo;

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Preferences> getPreferences() {

		Preferences response = null;

		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<Preferences>(response, HttpStatus.FORBIDDEN); }

		response = profile.getPreferences();

		return new ResponseEntity<Preferences>(response, HttpStatus.OK);
	}

	@RequestMapping(method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Preferences> updatePreferences(@RequestBody Preferences inputPrefs) {

		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<Preferences>((Preferences) null, HttpStatus.FORBIDDEN); }

		if (StringUtils.isEmpty(inputPrefs.getLanguage())) {
			inputPrefs.setLanguage("en");
		}

		User user = userRepo.findById(profile.getUserId());
		user.setPreferredLanguage(inputPrefs.getLanguage());
		userRepo.save(user);

		if (inputPrefs.getEmailNotificationsType() == null) {
			inputPrefs.setEmailNotifications(false);
		}
		profile.setPreferences(inputPrefs);
		profileRepo.save(profile);

		return new ResponseEntity<Preferences>(inputPrefs, HttpStatus.OK);
	}
}
