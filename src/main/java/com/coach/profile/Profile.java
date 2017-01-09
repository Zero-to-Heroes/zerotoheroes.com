package com.coach.profile;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.coach.preferences.Preferences;
import com.coach.profile.profileinfo.ProfileInfo;
import com.coach.review.Review.Sport;
import com.coach.subscription.Subscriptions;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

// Should have done this from the start, but distinguishing now
// between the User (security) and the Profile (business data)
@Setter
@Getter
@ToString
@Document
@EqualsAndHashCode(of = "id")
public class Profile {

	@Id
	private String id;
	@Indexed
	private String userId;

	private Notifications notifications = new Notifications();
	private Preferences preferences = new Preferences();
	private Subscriptions subscriptions = new Subscriptions();
	// private Rankings rankings = new Rankings();
	private ProfileInfo profileInfo = new ProfileInfo();
	private ActivitiesStats activitiesStats = new ActivitiesStats();

	private Date lastEmailRecapDate;
	private int openReviews;

	public ProfileInfo getProfileInfo() {
		if (profileInfo == null) {
			profileInfo = new ProfileInfo();
		}
		return profileInfo;
	}

	public Preferences getPreferences() {
		// Legacy purpose
		if (preferences.isEmailNotifications() && preferences.getEmailNotificationsType() == null) {
			preferences.setEmailNotificationsType("gamerecap");
		}
		return preferences;
	}

	// @Deprecated
	// public Rankings getRankings() {
	// if (rankings == null) {
	// rankings = new Rankings();
	// }
	// return rankings;
	// }

	// Some hard-coding for now, later on will be easier when user will be able
	// to set their own flair
	@Deprecated
	public String getFlair(Sport sport, String frame) {
		return profileInfo.fetchFlair(sport, frame);
		// if (sport == null) { return frame; }
		//
		// if (rankings.getRankings().get(sport.getKey().toLowerCase()) == null)
		// { return frame; }
		//
		// if
		// (rankings.getRankings().get(sport.getKey().toLowerCase()).get("ranked")
		// == null) { return frame; }
		//
		// return
		// rankings.getRankings().get(sport.getKey().toLowerCase()).get("ranked").getKey();
	}
}
