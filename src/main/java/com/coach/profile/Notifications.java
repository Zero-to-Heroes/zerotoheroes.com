package com.coach.profile;

import org.springframework.data.annotation.Transient;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Notifications {

	private int notificationId = 0;

	@Transient
	private int unreadNotifs;

	// public void incrementUnread() {
	// unreadNotifs = unreadNotifs + 1;
	// }
	//
	// public void decrementUnread() {
	// unreadNotifs = unreadNotifs - 1;
	// }
}
