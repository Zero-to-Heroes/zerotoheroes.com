package com.zerotoheroes.reviewsubscriptions;

import java.io.IOException;

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
import com.coach.profile.Profile;
import com.coach.profile.ProfileService;
import com.coach.review.ReviewSearchCriteria;
import com.coach.subscription.SavedSearchSubscription;
import com.coach.subscription.SavedSearchSubscriptionService;
import com.coach.tag.Tag;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/suggestions")
@Slf4j
public class SuggestionsApiHandler {

	@Autowired
	SlackNotifier slackNotifier;

	@Autowired
	ProfileService profileService;

	@Autowired
	SavedSearchSubscriptionService subService;

	@RequestMapping(value = "/{topic}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> acceptSuggestion(@PathVariable("topic") final String topic)
			throws IOException {

		ReviewSearchCriteria criteria = new ReviewSearchCriteria();

		if ("arena-game".equals(topic)) {
			criteria.setGameMode("arena-game");
		}
		else {
			criteria.getWantedTags().add(new Tag(topic));
		}
		log.debug("Adding saved search from topic: " + topic);
		return addSub("suggested sub: " + topic, criteria);
	}

	@RequestMapping(value = "/{topic}", method = RequestMethod.DELETE)
	public @ResponseBody ResponseEntity<String> noSuggestionForTopic(@PathVariable("topic") final String topic)
			throws IOException {

		String response = null;

		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<String>(response, HttpStatus.FORBIDDEN); }

		if (topic == null) {
			profile.getPreferences().setNeverAskAboutSavedSearch(true);
		}
		else {
			profile.getPreferences().getDontAskAgainForTheseTags().add(topic);
		}
		profileService.save(profile);

		return new ResponseEntity<String>("will stop asking for " + topic, HttpStatus.OK);
	}

	@RequestMapping(method = RequestMethod.DELETE)
	public @ResponseBody ResponseEntity<String> noSuggestion()
			throws IOException {
		return noSuggestionForTopic(null);
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
}
