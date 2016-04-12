package com.coach.notifications;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ListNotificationsResponse {

	private List<Notification> notifications;
	private int totalPages;

	public ListNotificationsResponse(List<Notification> reviews) {
		super();
		notifications = reviews;
	}
}
