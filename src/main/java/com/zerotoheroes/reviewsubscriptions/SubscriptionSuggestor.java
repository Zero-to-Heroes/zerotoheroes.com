package com.zerotoheroes.reviewsubscriptions;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.notifications.Notification;
import com.coach.notifications.NotificationDao;
import com.coach.notifications.NotificationSuggestedSubscriptionData;
import com.coach.profile.Profile;
import com.coach.review.Review;

@Component
public class SubscriptionSuggestor {

	@Autowired
	NotificationDao notificationDao;

	public void suggestNewSubscription(Profile profile, Review review, String topic) {
		Notification notification = new Notification();
		notification.setUserId(profile.getUserId());
		notification.setSport(review.getSport().getKey().toLowerCase());
		notification.setTitle("new-subscription-suggestion-title");
		notification.setTextDetail("new-subscription-suggestion-text");
		notification.setFrom("Zero to Heroes");

		NotificationSuggestedSubscriptionData data = new NotificationSuggestedSubscriptionData();
		data.setTopic(topic);
		notification.setData(data);

		notificationDao.save(notification);
	}
}
