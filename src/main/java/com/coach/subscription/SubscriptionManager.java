package com.coach.subscription;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.review.Comment;
import com.coach.review.EmailNotifier;
import com.coach.review.Review;
import com.coach.sport.Sport;
import com.coach.sport.SportManager;
import com.coach.user.UserRepository;

@Component
@Slf4j
public class SubscriptionManager {

	@Autowired
	UserRepository userRepo;

	@Autowired
	SportManager sportManager;

	@Autowired
	EmailNotifier emailNotifier;

	public void notifyNewComment(Comment comment, Review review) {
		Iterable<User> subscribers = userRepo.findAll(review.getSubscribers());
		for (User subscriber : subscribers) {
			if (!subscriber.getId().equals(comment.getAuthorId())) {
				log.debug("Notifying " + subscriber.getUsername() + " of a new comment");
				emailNotifier.notifyNewComment(subscriber, comment, review);
			}
		}
	}

	public void notifyNewReview(Review.Sport sportInput, Review review) {
		Sport sport = sportManager.findById(sportInput.getKey());
		log.debug("Notifying new review for " + sportInput + " meaning " + sport);

		Iterable<User> subscribers = userRepo.findAll(sport.getSubscribers());
		log.debug("Subscribers list is " + subscribers);
		for (User subscriber : subscribers) {
			log.debug("going to " + subscriber);
			if (!subscriber.getId().equals(review.getAuthorId())) {
				log.debug("Notifying " + subscriber.getUsername() + " of a new review");
				emailNotifier.notifyNewReview(subscriber, review);
			}
		}
	}

	public void subscribe(HasSubscribers item, String subscriberId) {
		if (!StringUtils.isNullOrEmpty(subscriberId)) item.addSubscriber(subscriberId);
	}

	public void unsubscribe(HasSubscribers item, String subscriberId) {
		if (!StringUtils.isNullOrEmpty(subscriberId)) item.removeSubscriber(subscriberId);
	}

	public void subscribe(com.coach.review.Review.Sport sportInput, String authorId) {
		Sport sport = sportManager.findById(sportInput.getKey());
		log.debug("Notifying new review for " + sportInput + " meaning " + sport);
		subscribe(sport, authorId);
	}

}
