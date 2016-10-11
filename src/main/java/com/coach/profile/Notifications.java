package com.coach.profile;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Notifications {

	private int notificationId = 0;
	private int unreadNotifs;

	public void incrementUnread() {
		unreadNotifs = unreadNotifs + 1;
	}

	public void decrementUnread() {
		unreadNotifs = unreadNotifs - 1;
	}
}
