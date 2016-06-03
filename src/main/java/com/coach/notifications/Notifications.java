package com.coach.notifications;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.joda.time.DateTime;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Notifications {

	private static final int MAX_DURATION_FOR_NOTIFICATIONS = 28;

	private List<Notification> notifications = new ArrayList<>();
	private int notificationId = 0;

	public void addNotification(Notification notification) {
		notification.setNotifId(notificationId++);
		notifications.add(notification);

		DateTime earliestDate = new DateTime().minusDays(MAX_DURATION_FOR_NOTIFICATIONS);

		for (Iterator<Notification> iterator = notifications.iterator(); iterator.hasNext();) {
			Notification notif = iterator.next();
			if (new DateTime(notif.getCreationDate()).isBefore(earliestDate) && notif.getReadDate() != null) {
				iterator.remove();
			}

		}
	}

	public List<Notification> filter(String type) {
		if ("all".equals(type)) {
			return notifications;
		}
		else if ("unread".equals(type)) {
			List<Notification> unreadNotifs = new ArrayList<>();
			for (Notification notif : notifications) {
				if (notif.getReadDate() == null) {
					unreadNotifs.add(notif);
				}
			}
			return unreadNotifs;
		}
		return null;
	}

	public Notification getNotification(int messageId) {
		for (Notification notification : notifications) {
			if (notification.getNotifId() == messageId) { return notification; }
		}
		return null;
	}

}
