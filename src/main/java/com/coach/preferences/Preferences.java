package com.coach.preferences;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Preferences {

	private boolean siteNotifications = true;
	private boolean emailNotifications = true;
	private String language;

}
