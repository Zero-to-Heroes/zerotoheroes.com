package com.coach.subscription;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

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
import com.coach.user.UserService;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
// TODO: make it asynchronous and use threads
public class SubscriptionManager {

	@Autowired
	UserRepository userRepo;

	@Autowired
	UserService userService;

	@Autowired
	SportManager sportManager;

	@Autowired
	UserNotifier userNotifier;

	@Autowired
	SavedSearchSubscriptionService subService;

	// TODO make all this async

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

	public void notifyNewMultiComment(Review review, Collection<Comment> comments) {
		Iterable<User> subscribers = userRepo.findAll(review.getSubscribers());
		if (!comments.isEmpty()) {
			String authorId = comments.iterator().next().getAuthorId();
			for (User subscriber : subscribers) {
				if (!subscriber.getId().equals(authorId)) {
					// log.debug("Notifying " + subscriber.getUsername() + " of a
					// new comment");
					userNotifier.notifyNewMultiComment(subscriber, review, comments);
				}
			}
		}
	}

	public void notifyNewReview(Review.Sport sportInput, Review review) {
		// TODO: change mechanism. Store, for each review, who has been notified
		// already
		// Then, when a review is updated, find all subscription matches, and
		// send to everyone who has not been notified yet
		Sport sport = sportManager.findById(sportInput.getKey());
		Set<String> usersToNotify = buildUsersToNotify(sport, review);
		Set<String> alreadyNotifiedUsers = review.getNotifiedUsers();
		Set<String> newUsersToNotify = buildNewUsersToNotify(alreadyNotifiedUsers, usersToNotify);
		notifyNewUsers(newUsersToNotify, review);
		review.addNotifiedUsers(newUsersToNotify);
	}

	private Set<String> buildNewUsersToNotify(Set<String> alreadyNotifiedUsers, Set<String> usersToNotify) {
		Set<String> result = new HashSet<>();
		for (String userId : usersToNotify) {
			if (!alreadyNotifiedUsers.contains(userId)) {
				result.add(userId);
			}
		}
		return result;
	}

	private void notifyNewUsers(Set<String> usersToNotify, Review review) {
		for (String userId : usersToNotify) {
			String email = userService.findEmailFromUserId(userId);
			if (email != null) {
				userNotifier.notifyNewReview(userId, email, review);
			}
		}
	}

	private Set<String> buildUsersToNotify(Sport sport, Review review) {
		Set<String> usersToNotify = new HashSet<>();
		usersToNotify.addAll(sport.getSubscribers());
		usersToNotify.addAll(buildSavedSearchSubscribers(review));
		usersToNotify.remove(review.getAuthorId());
		return usersToNotify;
	}

	private Set<String> buildSavedSearchSubscribers(Review review) {
		Set<String> usersToNofidy = new HashSet<>();
		Iterable<SavedSearchSubscription> savedSearches = subService.findSearches(review);
		log.debug("All saved searches subs: " + savedSearches);
		for (SavedSearchSubscription sub : savedSearches) {
			if (!sub.getUserId().equals(review.getAuthorId())) {
				usersToNofidy.add(sub.getUserId());
			}
		}
		return usersToNofidy;
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
