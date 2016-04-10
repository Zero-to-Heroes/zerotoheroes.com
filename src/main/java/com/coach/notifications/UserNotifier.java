package com.coach.notifications;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.core.security.User;
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
	NotificationsRepository notificationRepo;

	public void notifyNewComment(User subscriber, Comment comment, Review review) {
		Notification notification = new Notification();
		notification.setCreationDate(new Date());
		notification.setSport(review.getSport().getKey().toLowerCase());
		notification.setTextKey("newComment");
		notification.setType("new-comment");
		notification.addObject(review.getUrl());
		notification.setTextDetail(comment.getText());

		Notifications notifications = loadNotifications(subscriber);
		notifications.addNotification(notification);
		updateNotifications(notifications);

		emailNotifier.notifyNewComment(subscriber, comment, review);
	}

	public void notifyNewReview(User subscriber, Review review) {
		Notification notification = new Notification();
		notification.setCreationDate(new Date());
		notification.setSport(review.getSport().getKey().toLowerCase());
		notification.setTextKey("newReview");
		notification.setType("new-review");
		notification.addObject(review.getUrl());
		notification.setTextDetail(review.getText());

		Notifications notifications = loadNotifications(subscriber);
		notifications.addNotification(notification);
		updateNotifications(notifications);

		emailNotifier.notifyNewReview(subscriber, review);
	}

	private Notifications loadNotifications(User subscriber) {
		Notifications notifications = notificationRepo.findByUserId(subscriber.getId());
		if (notifications == null) {
			notifications = new Notifications();
			notifications.setUserId(subscriber.getId());
		}
		return notifications;
	}

	private void updateNotifications(Notifications notifications) {
		notificationRepo.save(notifications);
	}

}
