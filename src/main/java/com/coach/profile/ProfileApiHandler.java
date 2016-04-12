package com.coach.profile;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/profile")
@Slf4j
public class ProfileApiHandler {

	@Autowired
	UserRepository userRepo;

	@Autowired
	ProfileService profileService;

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Profile> getProfile() {

		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<Profile>(profile, HttpStatus.FORBIDDEN); }

		return new ResponseEntity<Profile>(profile, HttpStatus.OK);
	}
}
