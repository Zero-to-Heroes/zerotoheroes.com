package com.coach.subscription;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.notifications.UserNotifier;
import com.coach.review.Comment;
import com.coach.review.Review;
import com.coach.sport.Sport;
import com.coach.sport.SportManager;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
// TODO: make it asynchronous and use threads
public class SubscriptionManager {

	@Autowired
	UserRepository userRepo;

	@Autowired
	SportManager sportManager;

	@Autowired
	UserNotifier userNotifier;

	@Autowired
	SavedSearchSubscriptionService subService;

	public void notifyNewComment(Comment comment, Review review) {
		Iterable<User> subscribers = userRepo.findAll(review.getSubscribers());
		for (User subscriber : subscribers) {
			if (!subscriber.getId().equals(comment.getAuthorId())) {
				// log.debug("Notifying " + subscriber.getUsername() + " of a
				// new comment");
				userNotifier.notifyNewComment(subscriber, comment, review);
			}
		}
	}

	public void notifyNewReview(Review.Sport sportInput, Review review) {
		Sport sport = sportManager.findById(sportInput.getKey());
		log.debug("Notifying new review for " + sportInput);

		// Notify everyone who has subscribed to a sport
		Iterable<User> subscribers = userRepo.findAll(sport.getSubscribers());
		// log.debug("Subscribers list is " + subscribers);
		for (User subscriber : subscribers) {
			// log.debug("going to " + subscriber);
			if (!subscriber.getId().equals(review.getAuthorId())) {
				// log.debug("Notifying " + subscriber.getUsername() + " of a
				// new review");
				userNotifier.notifyNewReview(subscriber, review, null);
			}
		}

		// Notify everyone who has subscribed to a saved search that match the
		// review
		Iterable<SavedSearchSubscription> savedSearches = subService.findSearches(review);
		log.debug("All saved searches subs: " + savedSearches);
		for (SavedSearchSubscription sub : savedSearches) {
			if (!sub.getUserId().equals(review.getAuthorId())) {
				User subscriber = userRepo.findById(sub.getUserId());
				userNotifier.notifyNewReview(subscriber, review, sub.getName());
			}
		}
	}

	public void subscribe(HasSubscribers item, String subscriberId) {
		if (!StringUtils.isNullOrEmpty(subscriberId)) {
			item.addSubscriber(subscriberId);
		}
	}

	public void unsubscribe(HasSubscribers item, String subscriberId) {
		if (!StringUtils.isNullOrEmpty(subscriberId)) {
			item.removeSubscriber(subscriberId);
		}
	}

	public void subscribe(com.coach.review.Review.Sport sportInput, String authorId) {
		Sport sport = sportManager.findById(sportInput.getKey());
		// log.debug("Notifying new review for " + sportInput + " meaning " +
		// sport);
		subscribe(sport, authorId);
	}

}
