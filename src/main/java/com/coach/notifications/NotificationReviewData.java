package com.coach.notifications;

import org.springframework.data.mongodb.core.index.Indexed;

import lombok.Data;

@Data
public class NotificationReviewData extends NotificationData implements ILinkedToReview {

	@Indexed
	private String reviewId;
	private String reviewUrl;

	public NotificationReviewData() {
		textKey = "newReview";
	}
}
