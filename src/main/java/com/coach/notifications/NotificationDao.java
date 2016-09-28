package com.coach.notifications;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

@Component
public class NotificationDao {

	@Autowired
	NotificationRepository notificationRepository;

	public void save(Notification notification) {
		notificationRepository.save(notification);
	}

	public List<Notification> findAllUnread(String userId, PageRequest pageRequest) {
		Page<Notification> notifs = notificationRepository.findPageableByUserIdAndReadDateNull(userId, pageRequest);
		return notifs.getContent();
	}

	public List<Notification> findAllUnread(String userId) {
		return notificationRepository.findByUserIdAndReadDateNull(userId);
	}

	public List<Notification> findAll(String userId, PageRequest pageRequest) {
		Page<Notification> notifs = notificationRepository.findPageableByUserId(userId, pageRequest);
		return notifs.getContent();
	}

	public List<Notification> findAllUnread(String userId, String reviewId) {
		return notificationRepository.findByUserIdAndReviewIdAndReadDateNull(userId, reviewId);
	}

	public Notification findById(String messageId) {
		return notificationRepository.findOne(messageId);
	}

	public void save(List<Notification> notifs) {
		notificationRepository.save(notifs);
	}

	public void clearAll() {
		notificationRepository.deleteAll();
	}

}
