package com.coach.user;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthentication;
import com.coach.core.security.UserRole;

@RestController
@RequestMapping(value = "/api/users")
@Slf4j
public class UserApiHandler {

	@Autowired
	UserRepository userRepository;

	@RequestMapping(method = RequestMethod.GET)
	public User getCurrent() {
		final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication instanceof UserAuthentication) { return ((UserAuthentication) authentication).getDetails(); }
		return new User(authentication.getName()); // anonymous user support
	}

	@RequestMapping(value = "/{identifier}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<User> getUser(@PathVariable("identifier") String identifier) {
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		log.debug("Retrieving user by " + identifier);

		User user = null;
		if (StringUtils.isNullOrEmpty(identifier)) return new ResponseEntity<User>(user, HttpStatus.NOT_ACCEPTABLE);
		if (identifier.contains("@")) {
			user = userRepository.findByEmail(identifier);
		}
		else {
			user = userRepository.findByUsername(identifier);
		}

		if (user == null) return new ResponseEntity<User>(user, HttpStatus.NOT_FOUND);

		return new ResponseEntity<User>(user, HttpStatus.OK);
	}

	@RequestMapping(method = RequestMethod.POST)
	public ResponseEntity<String> register(@RequestBody final User user) {
		log.debug("Registering user: " + user);
		boolean exists = userRepository.findByUsername(user.getUsername()) != null;
		if (exists) { return new ResponseEntity<String>(
				"{\"msg\": \"This username is already in use by someone else, please choose another one\"}",
				HttpStatus.UNPROCESSABLE_ENTITY); }
		exists = userRepository.findByEmail(user.getEmail()) != null;
		if (exists) { return new ResponseEntity<String>(
				"{\"msg\": \"This email address is already in use by someone else, please choose another one\"}",
				HttpStatus.UNPROCESSABLE_ENTITY); }

		// Perform checks on password
		String password = user.getPassword();
		// if (password == null || password.length() < 4) { return new
		// ResponseEntity<String>("new password to short",
		// HttpStatus.UNPROCESSABLE_ENTITY); }

		final BCryptPasswordEncoder pwEncoder = new BCryptPasswordEncoder();
		user.setPassword(pwEncoder.encode(password));

		// Grant basic role
		user.grantRole(UserRole.USER);

		userRepository.save(user);
		log.debug("Registered user: " + user);

		return new ResponseEntity<String>(HttpStatus.OK);
	}

	// @RequestMapping(method = RequestMethod.PATCH)
	// public ResponseEntity<String> changePassword(@RequestBody final User
	// user) {
	// final Authentication authentication =
	// SecurityContextHolder.getContext().getAuthentication();
	// final User currentUser =
	// userRepository.findOne(authentication.getName());
	// if (currentUser == null) { return new
	// ResponseEntity<String>("invalid user", HttpStatus.FORBIDDEN); }
	//
	// if (user.getNewPassword() == null || user.getNewPassword().length() < 4)
	// { return new ResponseEntity<String>(
	// "new password to short", HttpStatus.UNPROCESSABLE_ENTITY); }
	//
	// final BCryptPasswordEncoder pwEncoder = new BCryptPasswordEncoder();
	// if (!pwEncoder.matches(user.getPassword(), currentUser.getPassword())) {
	// return new ResponseEntity<String>(
	// "old password mismatch", HttpStatus.UNPROCESSABLE_ENTITY); }
	//
	// currentUser.setPassword(pwEncoder.encode(user.getNewPassword()));
	// userRepository.save(currentUser);
	// return new ResponseEntity<String>("password changed", HttpStatus.OK);
	// }

}
