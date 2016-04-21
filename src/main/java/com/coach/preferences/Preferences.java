package com.coach.preferences;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Preferences {

	private boolean siteNotifications = true;
	private boolean emailNotifications = true;
	private boolean emailContact = true;
	private String language;

}
