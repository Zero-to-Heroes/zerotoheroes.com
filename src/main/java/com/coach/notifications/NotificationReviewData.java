package com.coach.notifications;

import org.springframework.data.mongodb.core.index.Indexed;

import lombok.Data;

@Data
public class NotificationReviewData extends NotificationData {

	@Indexed
	private String reviewId;
	private String reviewUrl;

	public NotificationReviewData() {
		textKey = "newReview";
	}
}
