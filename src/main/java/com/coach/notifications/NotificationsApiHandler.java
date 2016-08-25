package com.coach.notifications;

import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.profile.Profile;
import com.coach.profile.ProfileRepository;
import com.coach.profile.ProfileService;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/notifications")
@Slf4j
public class NotificationsApiHandler {

	private static final int PAGE_SIZE = 20;

	@Autowired
	UserRepository userRepo;

	@Autowired
	ProfileService profileService;

	@Autowired
	ProfileRepository profileRepo;

	@RequestMapping(value = "/{type}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<ListNotificationsResponse> getNotificationsByType(
			@PathVariable("type") final String type) {

		ListNotificationsResponse response = null;

		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<ListNotificationsResponse>(response, HttpStatus.FORBIDDEN); }

		List<Notification> notifs = profile.getNotifications().filter(type);
		Collections.sort(notifs, new Comparator<Notification>() {
			@Override
			public int compare(Notification o1, Notification o2) {
				return o2.getCreationDate().compareTo(o1.getCreationDate());
			}
		});

		response = new ListNotificationsResponse(notifs);

		return new ResponseEntity<ListNotificationsResponse>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/read", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Notification> markRead(@RequestBody int messageId) {
		// log.debug("Marking notif as read", messageId);
		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<Notification>((Notification) null, HttpStatus.FORBIDDEN); }

		Notification notif = profile.getNotifications().getNotification(messageId);
		if (notif == null) { return new ResponseEntity<Notification>((Notification) null, HttpStatus.NOT_FOUND); }

		notif.setReadDate(new Date());

		profileRepo.save(profile);

		return new ResponseEntity<Notification>(notif, HttpStatus.OK);
	}

	@RequestMapping(value = "/unread", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Notification> markUnread(@RequestBody int messageId) {

		Profile profile = profileService.getLoggedInProfile();
		if (profile == null) { return new ResponseEntity<Notification>((Notification) null, HttpStatus.FORBIDDEN); }

		Notification notif = profile.getNotifications().getNotification(messageId);
		if (notif == null) { return new ResponseEntity<Notification>((Notification) null, HttpStatus.NOT_FOUND); }

		notif.setReadDate(null);

		profileRepo.save(profile);

		return new ResponseEntity<Notification>(notif, HttpStatus.OK);
	}
}
