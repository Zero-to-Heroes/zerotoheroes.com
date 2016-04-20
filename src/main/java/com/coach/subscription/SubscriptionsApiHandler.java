package com.coach.subscription;

import java.io.IOException;
import java.util.Collection;
import java.util.Iterator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.amazonaws.util.StringUtils;
import com.coach.core.notification.SlackNotifier;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthority;
import com.coach.profile.Profile;
import com.coach.profile.ProfileService;
import com.coach.review.ReviewRepository;
import com.coach.review.ReviewSearchCriteria;
import com.coach.sport.SportManager;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api")
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

	@Autowired
	ProfileService profileService;

	@Autowired
	SavedSearchSubscriptionService subService;

	@RequestMapping(value = "/savedSearch/{name}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> subscribeToSavedSearch(@PathVariable("name") final String name,
			@RequestBody ReviewSearchCriteria searchCriteria) throws IOException {

		return addSub(name, searchCriteria);
	}

	@RequestMapping(value = "/savedSearch", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> subscribeToSavedSearch(@RequestBody ReviewSearchCriteria searchCriteria)
			throws IOException {
		return addSub(null, searchCriteria);
	}

	@RequestMapping(value = "/savedSearch", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<ListSubscriptionsResponse> retrieveSubscriptions() throws IOException {
		ListSubscriptionsResponse response = null;

		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<ListSubscriptionsResponse>(response, HttpStatus.FORBIDDEN); }

		response = new ListSubscriptionsResponse();
		response.setSubscriptions(profile.getSubscriptions().getSubscriptions());

		return new ResponseEntity<ListSubscriptionsResponse>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/savedSearch/{name}", method = RequestMethod.DELETE)
	public @ResponseBody ResponseEntity<String> deleteSubscription(@PathVariable("name") final String subscriptionId)
			throws IOException {

		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<String>("not logged in", HttpStatus.FORBIDDEN); }

		if (profile.getSubscriptions() == null || profile.getSubscriptions().getSubscriptions() == null
				|| profile.getSubscriptions().getSubscriptions().isEmpty()) { return new ResponseEntity<String>(
						"subscription doesn't exist, can't unsub", HttpStatus.NOT_FOUND); }

		for (Iterator<SavedSearchSubscription> it = profile.getSubscriptions().getSubscriptions().iterator(); it
				.hasNext();) {
			SavedSearchSubscription sub = it.next();
			if (sub.getId().equals(subscriptionId)) {
				it.remove();
				subService.delete(subscriptionId);
				profileService.save(profile);
				slackNotifier.notifyNewSavedSearchUnsubscriber(sub,
						SecurityContextHolder.getContext().getAuthentication().getName());
				return new ResponseEntity<String>("unsubbed", HttpStatus.OK);
			}
		}

		return new ResponseEntity<String>("subscription doesn't exist, can't unsub", HttpStatus.NOT_FOUND);
	}

	private ResponseEntity<String> addSub(final String name, ReviewSearchCriteria searchCriteria) {
		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<String>("not logged in", HttpStatus.FORBIDDEN); }

		SavedSearchSubscription sub = new SavedSearchSubscription();
		sub.setCriteria(searchCriteria);
		sub.setUserId(profile.getUserId());
		sub.setName(name);
		profile.getSubscriptions().addSubscription(sub);

		subService.save(sub);
		profileService.save(profile);

		slackNotifier.notifyNewSavedSearchSubscriber(searchCriteria,
				SecurityContextHolder.getContext().getAuthentication().getName());

		return new ResponseEntity<String>("sub added", HttpStatus.OK);
	}

	@RequestMapping(value = "/subscriptions/{itemId}", method = RequestMethod.POST)
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

	@RequestMapping(value = "/subscriptions/{itemId}", method = RequestMethod.DELETE)
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
		slackNotifier.notifyNewUnsubscriber(item, user);

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
