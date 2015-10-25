package com.coach.subscription;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.review.Comment;
import com.coach.review.EmailNotifier;
import com.coach.review.Review;
import com.coach.review.Review.Sport;
import com.coach.user.UserRepository;

@Component
@Slf4j
public class SubscriptionManager {

	@Autowired
	UserRepository userRepo;

	@Autowired
	EmailNotifier emailNotifier;

	public void notifyNewComment(Comment comment, Review review) {

		Iterable<User> subscribers = userRepo.findAll(review.getSubscribers());
		for (User subscriber : subscribers) {
			if (!subscriber.getId().equals(comment.getAuthorId()))
				log.debug("Notifying " + subscriber.getUsername() + " of a new comment");
			emailNotifier.notifyNewComment(subscriber, comment, review);
		}

	}

	public void notifyNewReview(Sport sport) {
		// log.debug("Notifying " + review.getSubscribers() +
		// " of a new comment");
	}

	public void subscribe(HasSubscribers item, String subscriberId) {
		if (!StringUtils.isNullOrEmpty(subscriberId)) item.addSubscriber(subscriberId);
	}

	public void unsubscribe(HasSubscribers item, String subscriberId) {
		if (!StringUtils.isNullOrEmpty(subscriberId)) item.removeSubscriber(subscriberId);
	}

}
