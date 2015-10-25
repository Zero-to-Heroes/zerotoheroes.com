package com.coach.subscription;

import java.io.IOException;
import java.util.Collection;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.amazonaws.util.StringUtils;
import com.coach.core.notification.SlackNotifier;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthority;
import com.coach.review.ReviewRepository;
import com.coach.sport.SportManager;
import com.coach.user.UserRepository;

@RepositoryRestController
@RequestMapping(value = "/api/subscriptions")
@Slf4j
public class SubscriptionsApiHandler {

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	SportManager sportManager;

	@Autowired
	UserRepository userRepo;

	@Autowired
	MongoTemplate mongoTemplate;

	@Autowired
	SlackNotifier slackNotifier;

	@Autowired
	SubscriptionManager subscriptionManager;

	@RequestMapping(value = "/{itemId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<HasSubscribers> subscribe(@PathVariable("itemId") final String itemId)
			throws IOException {

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();

		// Security
		// Add current logged in user as the author of the review
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			log.debug("Unregistered users can't subscribe");
			return new ResponseEntity<HasSubscribers>((HasSubscribers) null, HttpStatus.UNAUTHORIZED);
		}

		User user = userRepo.findByUsername(currentUser);

		// Subscribing to sport or review?
		HasSubscribers item = getItem(itemId);

		if (item == null) { return new ResponseEntity<HasSubscribers>((HasSubscribers) null,
				HttpStatus.UNPROCESSABLE_ENTITY); }

		subscriptionManager.subscribe(item, user.getId());

		mongoTemplate.save(item);
		slackNotifier.notifyNewSubscriber(item, user);

		log.debug("Subscribed user " + user + " to " + item);

		return new ResponseEntity<HasSubscribers>(item, HttpStatus.OK);
	}

	@RequestMapping(value = "/{itemId}", method = RequestMethod.DELETE)
	public @ResponseBody ResponseEntity<HasSubscribers> unsubscribe(@PathVariable("itemId") final String itemId)
			throws IOException {

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();

		// Security
		// Add current logged in user as the author of the review
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) {
			log.debug("Unregistered users can't unsubscribe");
			return new ResponseEntity<HasSubscribers>((HasSubscribers) null, HttpStatus.UNAUTHORIZED);
		}

		User user = userRepo.findByUsername(currentUser);

		// Subscribing to sport or review?
		HasSubscribers item = getItem(itemId);

		if (item == null) { return new ResponseEntity<HasSubscribers>((HasSubscribers) null,
				HttpStatus.UNPROCESSABLE_ENTITY); }

		subscriptionManager.unsubscribe(item, user.getId());

		mongoTemplate.save(item);
		slackNotifier.notifyNewSubscriber(item, user);

		log.debug("Unsubscribed user " + user + " to " + item);

		return new ResponseEntity<HasSubscribers>(item, HttpStatus.OK);
	}

	private HasSubscribers getItem(String itemId) {
		HasSubscribers item = reviewRepo.findById(itemId);
		if (item == null) {
			item = sportManager.findById(itemId);
		}
		return item;
	}
}
