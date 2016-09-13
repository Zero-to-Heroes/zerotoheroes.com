package com.coach.profile;

import java.util.Date;

import lombok.Data;

@Data
public class ActivitiesStats {

	private Date lastActivitiesConsultationDate;

	private int unreadNotifs;

	public void incrementUnread() {
		unreadNotifs = unreadNotifs + 1;
	}

}
