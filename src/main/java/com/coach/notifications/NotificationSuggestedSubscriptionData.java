package com.coach.notifications;

import org.springframework.data.mongodb.core.index.Indexed;

import lombok.Data;

@Data
public class NotificationSuggestedSubscriptionData extends NotificationData {

	@Indexed
	private String topic;

	public NotificationSuggestedSubscriptionData() {
		textKey = "suggestedSubscription";
	}
}
