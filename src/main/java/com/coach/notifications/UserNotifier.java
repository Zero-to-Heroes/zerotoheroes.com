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
		Notification notification = new Notification();
		notification.setCreationDate(new Date());
		notification.setSport(review.getSport().getKey().toLowerCase());
		notification.setTextKey("newComment");
		notification.setType("new-comment");
		notification.setTitle(review.getTitle());
		notification.addObject(review.getUrl());
		notification.setTextDetail(comment.getText());
		notification.setFrom(comment.getAuthor());

		addNotification(subscriber, notification);

		emailNotifier.notifyNewComment(subscriber, comment, review);
	}

	public void notifyNewReview(User subscriber, Review review) {
		Notification notification = new Notification();
		notification.setCreationDate(new Date());
		notification.setSport(review.getSport().getKey().toLowerCase());
		notification.setTextKey("newReview");
		notification.setTitle(review.getTitle());
		notification.setType("new-review");
		notification.addObject(review.getUrl());
		notification.setTextDetail(review.getText());
		notification.setFrom(review.getAuthor());

		addNotification(subscriber, notification);

		emailNotifier.notifyNewReview(subscriber, review);
	}

	private Notifications addNotification(User subscriber, Notification notification) {
		Profile profile = profileService.getProfile(subscriber.getId());
		Notifications notifications = profile.getNotifications();
		if (notifications == null) {
			notifications = new Notifications();
		}
		notifications.addNotification(notification);
		profileRepository.save(profile);
		return notifications;
	}
}
