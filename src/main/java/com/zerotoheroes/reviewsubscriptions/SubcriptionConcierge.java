package com.zerotoheroes.reviewsubscriptions;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.aws.messaging.config.annotation.NotificationMessage;
import org.springframework.cloud.aws.messaging.listener.SqsMessageDeletionPolicy;
import org.springframework.cloud.aws.messaging.listener.annotation.SqsListener;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.coach.notifications.NotificationService;
import com.coach.plugin.hearthstone.HearthstoneMetaData;
import com.coach.profile.Profile;
import com.coach.profile.ProfileService;
import com.coach.review.MetaData;
import com.coach.review.Review;
import com.coach.review.ReviewService;
import com.coach.subscription.SavedSearchSubscription;
import com.coach.tag.Tag;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/endpoint/review")
@Slf4j
// http://forecastcloudy.net/2011/07/12/using-amazons-simple-notification-service-sns-and-simple-queue-service-sqs-for-a-reliable-push-processing-of-queues/
// http://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.html#SendMessageToHttp.subscribe
public class SubcriptionConcierge {

	@Autowired
	ProfileService profileService;

	@Autowired
	ReviewService reviewService;

	@Autowired
	NotificationService notificationService;

	@Autowired
	SubscriptionSuggestor suggestor;

	@SqsListener(value = "${suggest.subscribe.queue.name}", deletionPolicy = SqsMessageDeletionPolicy.ON_SUCCESS)
	public void queueListener(@NotificationMessage String reviewId) {
		log.debug("Received notification that a new review has been updated: " + reviewId);
		Review review = reviewService.loadReview(reviewId);

		if (review == null) {
			log.error("Should never receive a non-existing review in subscription handler " + reviewId);
			return;
		}

		if (StringUtils.isEmpty(review.getAuthorId())) {
			log.debug("Not proposing anything to non-registered users");
			return;
		}

		// Don't send suggestion request if there is one already open
		if (notificationService.hasRecentOpenSuggestions(review.getAuthorId())) {
			log.debug("Won't suggest anything with open suggestions");
			return;
		}

		Profile profile = profileService.getProfile(review.getAuthorId());
		if (profile.getPreferences().isNeverAskAboutSavedSearch()) {
			log.debug(review.getAuthorId() + " has asked to never be suggested a saved search");
			return;
		}

		// Extract the meaningful info (ie info that we can listen to)
		// For now it's very crude, and consists of the first tag, and arena
		// games in case it's an arena game
		List<String> topicsOfInterest = extractTopicsOfInterest(review);
		log.debug("Possible topics of interest for " + review.getAuthorId() + " are " + topicsOfInterest);

		// For each one, check if the user:
		for (String topic : topicsOfInterest) {
			// - is subscribed to it (bascially any saved search that has the
			// criteria)
			boolean isSubscribed = isSubscribed(profile, topic);

			// - has asked not to be asked about this anymore
			boolean doesntWantToBeAsked = hasAskedNotToBeBothered(profile, topic);

			if (isSubscribed || doesntWantToBeAsked) {
				continue;
			}

			// We propose him to subscribe, ie add a message
			log.debug("Suggesting the user to subscribe to " + topic);
			suggestor.suggestNewSubscription(profile, review, topic);
			return;
		}

	}

	private boolean hasAskedNotToBeBothered(Profile profile, String topic) {
		return profile.getPreferences().getDontAskAgainForTheseTags().contains(topic);
	}

	private boolean isSubscribed(Profile profile, String topic) {
		if (profile.getSubscriptions() == null
				|| CollectionUtils.isEmpty(profile.getSubscriptions().getSubscriptions())) { return false; }

		List<SavedSearchSubscription> subs = profile.getSubscriptions().getSubscriptions();
		for (SavedSearchSubscription sub : subs) {
			if (topic.equals(sub.getCriteria().getGameMode())) { return true; }
			if (sub.getCriteria().getPlayerCategory() != null
					&& sub.getCriteria().getPlayerCategory().contains(topic)) { return true; }
		}

		return false;
	}

	private List<String> extractTopicsOfInterest(Review review) {
		List<String> topics = new ArrayList<>();
		MetaData metaData = review.getMetaData();
		if (metaData != null && metaData instanceof HearthstoneMetaData &&
				"arena-game".equals(((HearthstoneMetaData) metaData).getGameMode())) {
			topics.add("arena-game");
		}

		if (!CollectionUtils.isEmpty(review.getTags())) {
			Tag tag = review.getTags().get(0);
			topics.add(tag.getText());
		}

		return topics;
	}

}
