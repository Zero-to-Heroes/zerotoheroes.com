package com.coach.preferences;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Preferences {

	private boolean siteNotifications = true;
	private String emailNotificationsType;
	@Deprecated
	private boolean emailNotifications = false;
	private int emailRecapFrequency = 24;
	private boolean emailContact = true;
	private String language;

}
