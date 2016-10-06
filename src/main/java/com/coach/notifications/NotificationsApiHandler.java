package com.coach.notifications;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.core.security.User;
import com.coach.profile.Profile;
import com.coach.profile.ProfileRepository;
import com.coach.profile.ProfileService;
import com.coach.user.UserRepository;
import com.coach.user.UserService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/notifications")
@Slf4j
public class NotificationsApiHandler {

	private static final int PAGE_SIZE = 100;

	@Autowired
	UserRepository userRepo;

	@Autowired
	UserService userService;

	@Autowired
	ProfileService profileService;

	@Autowired
	ProfileRepository profileRepo;

	@Autowired
	NotificationDao notificationDao;

	@RequestMapping(value = "/{type}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<ListNotificationsResponse> getNotificationsByType(
			@PathVariable("type") final String type) {

		ListNotificationsResponse response = null;

		User user = userService.getLoggedInUser();
		if (user == null) { return new ResponseEntity<ListNotificationsResponse>((ListNotificationsResponse) null,
				HttpStatus.FORBIDDEN); }

		Sort sort = new Sort(Sort.Direction.DESC, Arrays.asList("creationDate"));
		PageRequest pageRequest = new PageRequest(0, PAGE_SIZE, sort);

		List<Notification> notifs = new ArrayList<>();
		if ("unread".equals(type)) {
			notifs = notificationDao.findAllUnread(user.getId(), pageRequest);
		}
		else {
			notifs = notificationDao.findAll(user.getId(), pageRequest);
		}

		response = new ListNotificationsResponse(notifs);

		return new ResponseEntity<ListNotificationsResponse>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/read", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Notification> markRead(@RequestBody List<String> messageIds) {

		log.debug("Marking as read " + messageIds);
		User user = userService.getLoggedInUser();
		if (user == null) { return new ResponseEntity<Notification>((Notification) null, HttpStatus.FORBIDDEN); }

		Profile profile = profileService.getLoggedInProfile();

		for (String messageId : messageIds) {
			if (!StringUtils.isEmpty(messageId)) {
				log.debug("handling message " + messageId);
				Notification notif = notificationDao.findById(messageId);
				notif.setReadDate(new Date());
				notificationDao.save(notif);
				profile.getNotifications().decrementUnread();
			}
		}

		profileService.save(profile);

		return new ResponseEntity<Notification>((Notification) null, HttpStatus.OK);
	}

	@RequestMapping(value = "/allread", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Notification> markAllRead() {

		User user = userService.getLoggedInUser();
		if (user == null) { return new ResponseEntity<Notification>((Notification) null, HttpStatus.FORBIDDEN); }

		List<Notification> notifs = notificationDao.findAllUnread(user.getId());

		if (notifs != null && notifs.size() > 0) {
			for (Notification notif : notifs) {
				notif.setReadDate(new Date());
			}
			notificationDao.save(notifs);
		}

		Profile profile = profileService.getLoggedInProfile();
		profile.getNotifications().setUnreadNotifs(0);
		profileService.save(profile);

		return new ResponseEntity<Notification>((Notification) null, HttpStatus.OK);
	}

	@RequestMapping(value = "/unread", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Notification> markUnread(@RequestBody String messageId) {

		// log.debug("Marking as unread " + messageId);
		User user = userService.getLoggedInUser();
		if (user == null) { return new ResponseEntity<Notification>((Notification) null, HttpStatus.FORBIDDEN); }

		Notification notif = notificationDao.findById(messageId);
		if (notif == null) { return new ResponseEntity<Notification>((Notification) null, HttpStatus.NOT_FOUND); }

		notif.setReadDate(null);

		Profile profile = profileService.getLoggedInProfile();
		profile.getNotifications().incrementUnread();
		profileService.save(profile);

		notificationDao.save(notif);

		return new ResponseEntity<Notification>(notif, HttpStatus.OK);
	}
}
