package com.coach.profile;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;

import com.coach.notifications.Notifications;
import com.coach.preferences.Preferences;

import lombok.Getter;
import lombok.Setter;

// Should have done this from the start, but distinguishing now
// between the User (security) and the Profile (business data)
@Setter
@Getter
public class Profile {

	@Id
	private String id;
	@Indexed
	private String userId;

	private Notifications notifications = new Notifications();
	private Preferences preferences = new Preferences();
}
