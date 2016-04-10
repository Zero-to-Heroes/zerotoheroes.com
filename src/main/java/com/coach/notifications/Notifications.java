package com.coach.notifications;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Notifications {

	@Id
	private String id;
	@Indexed
	private String userId;
	private List<Notification> notifications = new ArrayList<>();

	public void addNotification(Notification notification) {
		notifications.add(notification);
	}

}
