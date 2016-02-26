package com.coach.user;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.amazonaws.util.StringUtils;
import com.coach.core.notification.SlackNotifier;
import com.coach.core.security.User;
import com.coach.core.security.UserRole;
import com.coach.review.EmailNotifier;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/users")
@Slf4j
public class UserApiHandler {

	@Autowired
	UserRepository userRepository;

	@Autowired
	EmailNotifier emailNotifier;

	@Autowired
	SlackNotifier slackNotifier;

	@Autowired
	ResetPasswordRepository resetPasswordRepository;

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<User> getLoggedInUser() {
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		// log.debug("Retrieving user by " + currentUser);

		User user = null;
		if (StringUtils.isNullOrEmpty(currentUser)) {
			// log.debug("No identifier provided, returning 406");
			return new ResponseEntity<User>(user, HttpStatus.NOT_ACCEPTABLE);
		}
		if (currentUser.contains("@")) {
			user = userRepository.findByEmail(currentUser);
		}
		else {
			user = userRepository.findByUsername(currentUser);
		}
		// log.debug("Loaded user " + user);

		if (user == null) {
			// log.debug("Returning 404");
			return new ResponseEntity<User>(user, HttpStatus.NOT_FOUND);
		}

		return new ResponseEntity<User>(user, HttpStatus.OK);
	}

	@RequestMapping(value = "/{identifier}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<User> getUserByIdentifier(@PathVariable("identifier") String identifier) {
		// log.debug("Retrieving user by " + identifier);

		User user = null;
		if (StringUtils.isNullOrEmpty(identifier)) {
			log.debug("No identifier provided, returning 406");
			return new ResponseEntity<User>(user, HttpStatus.NOT_ACCEPTABLE);
		}
		if (identifier.contains("@")) {
			user = userRepository.findByEmail(identifier);
		}
		else {
			user = userRepository.findByUsername(identifier);
		}
		// log.debug("Loaded user " + user);

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

		// emailNotifier.notifyNewUser(user);
		slackNotifier.notifyNewUser(user);
		emailNotifier.notifyNewUser(user);

		return new ResponseEntity<String>(HttpStatus.OK);
	}

	@RequestMapping(value = "/{identifier}", method = RequestMethod.POST)
	public ResponseEntity<User> updateUser(@PathVariable("identifier") String identifier,
			@RequestBody final User userInput) {
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		log.debug("Retrieving user by " + identifier);

		User user = null;
		if (StringUtils.isNullOrEmpty(identifier)) {
			log.debug("No identifier provided, returning 406");
			return new ResponseEntity<User>(user, HttpStatus.NOT_ACCEPTABLE);
		}
		if (currentUser.contains("@")) {
			user = userRepository.findByEmail(identifier);
		}
		else {
			user = userRepository.findByUsername(identifier);
		}
		log.debug("Loaded user " + user);

		// Make sure you're authorized
		if (!currentUser.equals(user.getUsername())
				&& !user.canEdit()) { return new ResponseEntity<User>((User) null, HttpStatus.UNAUTHORIZED); }

		if (userInput.getPreferredLanguage() != null) {
			user.setPreferredLanguage(userInput.getPreferredLanguage());
		}
		if (userInput.getCoachInformation() != null) {
			user.setCoachInformation(userInput.getCoachInformation());
		}

		userRepository.save(user);
		log.debug("Updated user: " + user);

		return new ResponseEntity<User>(user, HttpStatus.OK);
	}

	@RequestMapping(value = "/password", method = RequestMethod.POST)
	public ResponseEntity<String> resetPassword(@RequestBody User newUser) {
		String identifier = newUser.getUsername();
		log.debug("resetting password for " + newUser.getUsername());

		User user = null;
		if (StringUtils.isNullOrEmpty(identifier)) {
			log.debug("No identifier provided, returning 406");
			return new ResponseEntity<String>((String) null, HttpStatus.NOT_ACCEPTABLE);
		}
		if (identifier.contains("@")) {
			user = userRepository.findByEmail(identifier);
		}
		else {
			user = userRepository.findByUsername(identifier);
		}
		log.debug("Loaded user " + user);

		if (user == null) {
			log.debug("Returning 404");
			return new ResponseEntity<String>((String) null, HttpStatus.NOT_FOUND);
		}

		// Creating reset password link
		String uniqueId = UUID.randomUUID().toString();
		// Associate the unique ID with the user
		final BCryptPasswordEncoder pwEncoder = new BCryptPasswordEncoder();
		String newPassword = pwEncoder.encode(newUser.getPassword());
		ResetPassword reset = new ResetPassword(uniqueId, user.getId(), newPassword);
		resetPasswordRepository.save(reset);
		log.debug("Saved new password reset " + reset);

		// Build the link to send
		String url = "http://www.zerotoheroes.com" + newUser.getRegisterLocation() + "?resetpassword="
				+ reset.getUniqueId();
		emailNotifier.sendResetPasswordLink(user, url);
		slackNotifier.notifyResetPassword(user);

		return new ResponseEntity<String>((String) null, HttpStatus.OK);
	}

	@RequestMapping(value = "/password/{uniqueKey}", method = RequestMethod.POST)
	public ResponseEntity<String> resetPassword(@PathVariable("uniqueKey") String uniqueKey) {
		log.debug("Validating reset password for unique key " + uniqueKey);

		ResetPassword resetPassword = resetPasswordRepository.findOne(uniqueKey);

		if (resetPassword != null) {
			log.debug("Loaded reset password " + resetPassword);

			User user = userRepository.findById(resetPassword.getUserId());
			user.setPassword(resetPassword.getNewPassword());
			userRepository.save(user);
			resetPasswordRepository.delete(uniqueKey);
			return new ResponseEntity<String>((String) null, HttpStatus.OK);
		}
		else {
			return new ResponseEntity<String>((String) null, HttpStatus.UNPROCESSABLE_ENTITY);
		}
	}
}
