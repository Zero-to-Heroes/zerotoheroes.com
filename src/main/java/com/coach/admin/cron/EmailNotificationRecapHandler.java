package com.coach.admin.cron;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.notifications.Notification;
import com.coach.notifications.NotificationRepository;
import com.coach.profile.Profile;
import com.coach.profile.ProfileRepository;
import com.coach.profile.ProfileService;
import com.coach.review.EmailNotifier;
import com.coach.user.UserRepository;
import com.coach.user.UserService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/cron/emailNotificationRecap")
@Slf4j
public class EmailNotificationRecapHandler {

	@Autowired
	UserRepository userRepository;

	@Autowired
	UserService userService;

	@Autowired
	ProfileService profileService;

	@Autowired
	ProfileRepository profileRepository;

	@Autowired
	NotificationRepository notificationRepository;

	@Autowired
	EmailNotifier emailNotifier;

	@RequestMapping(method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> processNotifs() {

		log.debug("Procesing notifs to send bulk recap");

		// Load all the notifications that need to be processed by email
		List<Notification> notifications = notificationRepository.findByBundledTrue();

		log.debug("Handling " + notifications.size() + " notifs");

		// Load all the profiles that match these notifs
		List<String> userIds = notifications.stream().map(n -> n.getUserId()).collect(Collectors.toList());

		log.debug("For " + userIds.size() + " users");
		List<Profile> profiles = profileRepository.findAllByUserId(userIds);
		log.debug("Profiles loaded");

		// The notifications to update
		List<Notification> notifsToUpdate = new ArrayList<>();
		List<Profile> profilesToUpdate = new ArrayList<>();

		// Then for each profile, check if we should process the notifs
		for (Profile profile : profiles) {

			boolean shouldNotif = profile.getPreferences().isUseEmailRecap()
					&& profile.getPreferences().getEmailRecapFrequency() > 0;

			Calendar calendar = Calendar.getInstance();
			calendar.add(Calendar.HOUR, -profile.getPreferences().getEmailRecapFrequency());
			shouldNotif &= profile.getLastEmailRecapDate() == null
					|| profile.getLastEmailRecapDate().before(calendar.getTime());

			if (shouldNotif) {
				// Get all the notifs
				List<Notification> notifs = notifications.stream()
						.filter(n -> profile.getUserId().equals(n.getUserId())).collect(Collectors.toList());

				// Send an email that recaps all the notifs
				emailNotifier.sendNotificationRecap(notifs, profile, userRepository.findById(profile.getUserId()));

				// Mark all notifs as handled
				profile.setLastEmailRecapDate(new Date());
				notifsToUpdate.addAll(notifs);
				profilesToUpdate.add(profile);
			}
		}
		log.debug("Processed notifs, emails are on their way");

		// Update everything
		for (Notification notif : notifsToUpdate) {
			notif.setBundled(false);
		}
		profileRepository.save(profilesToUpdate);
		log.debug("Saved " + profilesToUpdate + " profiles");
		notificationRepository.save(notifsToUpdate);
		log.debug("Saved " + notifsToUpdate + " notifs");

		return new ResponseEntity<String>(
				"processed " + notifsToUpdate.size() + " notifs for " + profilesToUpdate.size() + " profiles",
				HttpStatus.OK);
	}
}
