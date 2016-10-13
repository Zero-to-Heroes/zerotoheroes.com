package com.coach.preferences;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Preferences {

	private boolean siteNotifications = true;
	private boolean emailNotifications = false;
	private boolean useEmailRecap = false;
	private boolean emailRecapSplit = false;
	private int emailRecapFrequency = 24;
	private boolean emailContact = true;
	private String language;

}
