package com.coach.notifications;

import java.util.Date;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = "textDetail")
@Document
public class Notification {

	@Id
	private String id;

	@Indexed
	private NotificationData data;

	@Indexed
	private String userId;

	@Indexed
	private Date readDate;

	@Indexed
	@CreatedDate
	private Date creationDate;

	@Indexed
	private String sport;

	// Used to easily get the notifications we need to send grouped by email
	@Indexed
	private boolean bundled;

	private String title, from, textDetail;

	// Like saved search
	// private String aggregator;

	// private int notifId;
	// private String type;
	// private String linkId;
}
