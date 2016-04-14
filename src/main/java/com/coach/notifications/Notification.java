package com.coach.notifications;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Notification {

	private int notifId;
	private Date creationDate;
	private Date readDate;
	private String type;
	private String sport;
	// URL of the comment / review,
	private List<String> objects = new ArrayList<>();
	private String title, from, textKey, textDetail;
	private String aggregator;

	public void addObject(String object) {
		objects.add(object);
	}
}
