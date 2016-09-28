package com.coach.profile;

import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import org.joda.time.DateTime;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Notifications {

	private static final int MAX_DURATION_FOR_NOTIFICATIONS = 28;

	private List<Notification> notifications = new ArrayList<>();
	private int notificationId = 0;

	private int unreadNotifs;

	public void incrementUnread() {
		unreadNotifs = unreadNotifs + 1;
	}

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

	@Data
	public static class Notification {
		private int notifId;
		private Date creationDate;
		private Date readDate;
		private String type;
		private String sport;
		// URL of the comment / review,
		private List<String> objects = new ArrayList<>();
		private String linkId;
		private String title, from, textKey, textDetail;
		private String aggregator;

		public void addObject(String object) {
			objects.add(object);
		}
	}

}
