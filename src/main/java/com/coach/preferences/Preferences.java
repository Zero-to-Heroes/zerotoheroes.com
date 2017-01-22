package com.coach.preferences;

import java.util.HashSet;
import java.util.Set;

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
	private String displayMode = "grid";
	private String sharingPreference = "publicOnly";

	private Set<String> dontAskAgainForTheseTags = new HashSet<>();
	private boolean neverAskAboutSavedSearch = false;

}
