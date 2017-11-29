package com.coach.thirdprtyintegration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.coach.core.notification.SlackNotifier;
import com.coach.core.security.User;
import com.coach.review.Review;
import com.coach.review.ReviewDao;
import com.coach.review.ReviewRepository;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/claimAccount")
@Slf4j
public class ClaimAccountApiHandler {

	@Autowired
	SlackNotifier slackNotifier;

	@Autowired
	ExternalApplicationAuthenticationService service;

	@Autowired
	ReviewDao reviewDao;

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	UserRepository userRepo;

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> claimAccount(@PathVariable("reviewId") String reviewId)
			throws Exception {

		Review review = reviewRepo.findById(reviewId);
		if (review == null) {
			return new ResponseEntity<String>("No review to claim an account for", HttpStatus.FORBIDDEN);
		}
		if (!review.isReallyClaimable()) {
			return new ResponseEntity<String>("Review " + review.getId() + " can't be claimed", HttpStatus.FORBIDDEN);
		}

		String applicationKey = review.getUploaderApplicationKey();
		String userToken = review.getUploaderToken();

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		log.debug("claiming account for " + currentUser + " and keys " + applicationKey + "/" + userToken);

		if (currentUser == null) {
			new ResponseEntity<String>("You need to be logged in to claim an account", HttpStatus.FORBIDDEN);
		}
		User user = userRepo.findByUsername(currentUser);
		if (user == null) {
			return new ResponseEntity<String>("No account found for " + currentUser, HttpStatus.FORBIDDEN);
		}

		User linkedUser = service.loadUser(applicationKey, userToken);
		if (linkedUser != null) {
			return new ResponseEntity<String>("This account has already been claimed", HttpStatus.FORBIDDEN);
		}

		log.debug("Storing link for user: " + user.getId());
		service.storeLink(user.getId(), applicationKey, userToken);

		// http://docs.spring.io/spring-data/mongodb/docs/current/reference/html/#mongo-template.save-update-remove
		log.debug("Claiming account");
		reviewDao.claimAccount(user, applicationKey, userToken);

		return new ResponseEntity<String>("account claimed by " + user.getUsername(), HttpStatus.OK);
	}

	@RequestMapping(value = "/{applicationKey}/{userKey}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> claimAccount(
			@PathVariable("applicationKey") String applicationKey,
			@PathVariable("userKey") String userKey)
			throws Exception {

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		if (currentUser == null) {
			new ResponseEntity<String>("You need to be logged in to claim an account", HttpStatus.FORBIDDEN);
		}

		User user = userRepo.findByUsername(currentUser);
		if (user == null) {
			return new ResponseEntity<String>("No account found for " + currentUser, HttpStatus.FORBIDDEN);
		}

		log.debug("claiming account for " + currentUser + " and keys " + applicationKey + "/" + userKey);
		User linkedUser = service.loadUser(applicationKey, userKey);
		if (linkedUser != null) {
			return new ResponseEntity<String>(
					"This account has already been claimed: " + applicationKey + "/" + userKey,
					HttpStatus.CONFLICT);
		}

		log.debug("Storing link for user: " + user.getId());
		service.storeLink(user.getId(), applicationKey, userKey);

		// http://docs.spring.io/spring-data/mongodb/docs/current/reference/html/#mongo-template.save-update-remove
		log.debug("Claiming account");
		reviewDao.claimAccount(user, applicationKey, userKey);

		return new ResponseEntity<String>("account claimed by " + user.getUsername(), HttpStatus.OK);
	}

	@RequestMapping(value = "/account/{applicationKey}/{userToken}", method = RequestMethod.GET)
	@Deprecated
	public @ResponseBody ResponseEntity<String> getSiteAccount(@PathVariable("applicationKey") String applicationKey,
			@PathVariable("userToken") String userToken) throws Exception {
		return getRealSiteAccount(applicationKey, userToken);
	}

	@RequestMapping(value = "/{applicationKey}/{userToken}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getRealSiteAccount(@PathVariable("applicationKey") String applicationKey,
			@PathVariable("userToken") String userToken) throws Exception {

		User linkedUser = service.loadUser(applicationKey, userToken);
		if (linkedUser == null) {
			long linkedReviews = reviewDao.countLinkedReviews(applicationKey, userToken);
			if (linkedReviews == 0) {
				return new ResponseEntity<String>("No reviews linked to this account", HttpStatus.NOT_ACCEPTABLE);
			}
			log.debug("no account match " + applicationKey + "/" + userToken);
			return new ResponseEntity<String>("No account match", HttpStatus.NOT_FOUND);
		}

		log.debug("match " + applicationKey + "/" + userToken + ": " + linkedUser.getUsername());

		return new ResponseEntity<String>(linkedUser.getUsername(), HttpStatus.OK);
	}
}
