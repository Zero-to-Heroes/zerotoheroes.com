package com.coach.notifications;

import java.util.Arrays;
import java.util.Collection;

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
	NotificationDao notificationDao;

	@Autowired
	ProfileService profileService;

	public void notifyNewComment(User subscriber, Comment comment, Review review) {
		// if ("private".equalsIgnoreCase(review.getVisibility())) { return; }

		Profile profile = profileService.getProfile(subscriber.getId());
		boolean isBundled = Arrays.asList("gamerecap", "globalrecap")
				.indexOf(profile.getPreferences().getEmailNotificationsType()) > 0;

		if (profile.getPreferences().isSiteNotifications()) {
			Notification notification = new Notification();
			// notification.setCreationDate(new Date());
			notification.setSport(review.getSport().getKey().toLowerCase());
			notification.setTitle(review.getTitle());
			notification.setTextDetail(comment.getText());
			notification.setFrom(comment.getAuthor());
			notification.setUserId(subscriber.getId());
			notification.setBundled(isBundled);

			NotificationCommentData data = new NotificationCommentData();
			data.setLinkId(comment.getId());
			data.setReviewId(review.getId());
			data.setReviewUrl(review.getUrl());
			notification.setData(data);

			addNotification(profile, notification);
		}

		if ("onebyone".equals(profile.getPreferences().getEmailNotificationsType())) {
			emailNotifier.notifyNewComment(subscriber, comment, review);
		}
	}

	public void notifyNewMultiComment(User subscriber, Review review, Collection<Comment> comments) {
		Profile profile = profileService.getProfile(subscriber.getId());
		boolean isBundled = Arrays.asList("gamerecap", "globalrecap")
				.indexOf(profile.getPreferences().getEmailNotificationsType()) > 0;

		if (profile.getPreferences().isSiteNotifications()) {
			for (Comment comment : comments) {
				Notification notification = new Notification();
				// notification.setCreationDate(new Date());
				notification.setSport(review.getSport().getKey().toLowerCase());
				notification.setTitle(review.getTitle());
				notification.setTextDetail(comment.getText());
				notification.setFrom(comment.getAuthor());
				notification.setUserId(subscriber.getId());
				notification.setBundled(isBundled);

				NotificationCommentData data = new NotificationCommentData();
				data.setLinkId(comment.getId());
				data.setReviewId(review.getId());
				data.setReviewUrl(review.getUrl());
				notification.setData(data);

				addNotification(profile, notification);
			}
		}

		if ("onebyone".equals(profile.getPreferences().getEmailNotificationsType())) {
			emailNotifier.notifyNewMultiComment(subscriber, comments, review);
		}
	}

	public void notifyNewReview(User subscriber, Review review, String aggregator) {
		if ("private".equalsIgnoreCase(review.getVisibility())) { return; }
		if ("restricted".equalsIgnoreCase(review.getVisibility())) { return; }

		Profile profile = profileService.getProfile(subscriber.getId());
		boolean isBundled = Arrays.asList("gamerecap", "globalrecap")
				.indexOf(profile.getPreferences().getEmailNotificationsType()) > 0;

		if (profile.getPreferences().isSiteNotifications()) {
			Notification notification = new Notification();
			// notification.setCreationDate(new Date());
			notification.setSport(review.getSport().getKey().toLowerCase());
			notification.setTitle(review.getTitle());
			notification.setTextDetail(review.getText());
			notification.setFrom(review.getAuthor());
			notification.setAggregator(aggregator);
			notification.setUserId(subscriber.getId());
			notification.setBundled(isBundled);

			NotificationReviewData data = new NotificationReviewData();
			data.setReviewId(review.getId());
			data.setReviewUrl(review.getUrl());
			notification.setData(data);

			addNotification(profile, notification);
		}

		if ("onebyone".equals(profile.getPreferences().getEmailNotificationsType())) {
			emailNotifier.notifyNewReview(subscriber, review);
		}
	}

	private void addNotification(Profile profile, Notification notification) {
		// Notifications notifications = profile.getNotifications();
		// if (notifications == null) {
		// notifications = new Notifications();
		// profile.setNotifications(notifications);
		// }
		// notifications.incrementUnread();
		// profileRepository.save(profile);

		notificationDao.save(notification);
		// return notifications;
	}
}
