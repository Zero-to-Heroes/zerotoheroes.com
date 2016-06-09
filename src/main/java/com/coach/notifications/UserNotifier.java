package com.coach.notifications;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.core.security.User;
import com.coach.profile.Profile;
import com.coach.profile.ProfileRepository;
import com.coach.profile.ProfileService;
import com.coach.review.Comment;
import com.coach.review.EmailNotifier;
import com.coach.review.Review;
import com.coach.user.UserRepository;

@Component
public class UserNotifier {

	@Autowired
	EmailNotifier emailNotifier;

	@Autowired
	UserRepository userRepo;

	@Autowired
	ProfileRepository profileRepository;

	@Autowired
	ProfileService profileService;

	public void notifyNewComment(User subscriber, Comment comment, Review review) {
		if ("private".equalsIgnoreCase(review.getVisibility())) { return; }

		Profile profile = profileService.getProfile(subscriber.getId());

		if (profile.getPreferences().isSiteNotifications()) {
			Notification notification = new Notification();
			notification.setCreationDate(new Date());
			notification.setSport(review.getSport().getKey().toLowerCase());
			notification.setTextKey("newComment");
			notification.setType("new-comment");
			notification.setTitle(review.getTitle());
			notification.addObject(review.getUrl());
			notification.setTextDetail(comment.getText());
			notification.setFrom(comment.getAuthor());
			addNotification(profile, notification);
		}

		if (profile.getPreferences().isEmailNotifications()) {
			emailNotifier.notifyNewComment(subscriber, comment, review);
		}
	}

	public void notifyNewReview(User subscriber, Review review, String aggregator) {
		if ("private".equalsIgnoreCase(review.getVisibility())) { return; }
		if ("restricted".equalsIgnoreCase(review.getVisibility())) { return; }

		Profile profile = profileService.getProfile(subscriber.getId());

		if (profile.getPreferences().isSiteNotifications()) {
			Notification notification = new Notification();
			notification.setCreationDate(new Date());
			notification.setSport(review.getSport().getKey().toLowerCase());
			notification.setTextKey("newReview");
			notification.setTitle(review.getTitle());
			notification.setType("new-review");
			notification.addObject(review.getUrl());
			notification.setTextDetail(review.getText());
			notification.setFrom(review.getAuthor());
			notification.setAggregator(aggregator);
			addNotification(profile, notification);
		}

		if (profile.getPreferences().isEmailNotifications()) {
			emailNotifier.notifyNewReview(subscriber, review);
		}
	}

	private Notifications addNotification(Profile profile, Notification notification) {
		Notifications notifications = profile.getNotifications();
		if (notifications == null) {
			notifications = new Notifications();
		}
		notifications.addNotification(notification);
		profileRepository.save(profile);
		return notifications;
	}
}
