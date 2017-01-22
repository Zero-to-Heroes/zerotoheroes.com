package com.coach.preferences;

import java.util.Set;

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

	@RequestMapping(value = "/sharing/{username}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Preferences> getSharingPreferences(
			@PathVariable("username") final String username) {

		Preferences response = null;

		Profile profile = profileService.getProfileByUsername(username);
		if (profile == null) { return new ResponseEntity<Preferences>(response, HttpStatus.FORBIDDEN); }

		String pref = profile.getPreferences().getSharingPreference();
		response = new Preferences();
		response.setSharingPreference(pref);

		return new ResponseEntity<Preferences>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/sharing", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Preferences> toggleSharingPreferences() {

		Preferences response = null;

		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<Preferences>(response, HttpStatus.FORBIDDEN); }

		String current = profile.getPreferences().getSharingPreference();
		String newPref = null;
		if ("publicOnly".equals(current)) {
			newPref = "unlisted";
		}
		else {
			newPref = "publicOnly";
		}
		profile.getPreferences().setSharingPreference(newPref);
		profileRepo.save(profile);

		response = new Preferences();
		response.setSharingPreference(newPref);

		return new ResponseEntity<Preferences>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/tagSuggestionBlacklist/{tag}", method = RequestMethod.DELETE)
	public @ResponseBody ResponseEntity<Preferences> removeTagFromSuggestionBlacklist(@PathVariable("tag") String tag) {

		Preferences response = null;

		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<Preferences>(response, HttpStatus.FORBIDDEN); }

		Set<String> current = profile.getPreferences().getDontAskAgainForTheseTags();
		current.remove(tag);
		profileRepo.save(profile);

		response = new Preferences();
		response.setDontAskAgainForTheseTags(current);

		return new ResponseEntity<Preferences>(response, HttpStatus.OK);
	}

	@RequestMapping(method = RequestMethod.PATCH)
	public @ResponseBody ResponseEntity<Preferences> updatePartialPreferences(@RequestBody Preferences inputPrefs) {

		log.debug("Updating prefs " + inputPrefs);
		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<Preferences>((Preferences) null, HttpStatus.FORBIDDEN); }

		if (inputPrefs.getDisplayMode() != null) {
			profile.getPreferences().setDisplayMode(inputPrefs.getDisplayMode());
		}
		profileRepo.save(profile);

		return new ResponseEntity<Preferences>(profile.getPreferences(), HttpStatus.OK);
	}
}
