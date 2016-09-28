package com.coach.notifications;

import org.springframework.data.mongodb.core.index.Indexed;

import lombok.Data;

@Data
public class NotificationCommentData extends NotificationData {

	@Indexed
	private String reviewId;
	private String reviewUrl;
	private String linkId;

	public NotificationCommentData() {
		textKey = "newComment";
	}

}
