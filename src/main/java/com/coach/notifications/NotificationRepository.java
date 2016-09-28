package com.coach.notifications;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationRepository extends MongoRepository<Notification, String> {

	Page<Notification> findPageableByUserIdAndReadDateNull(String userId, Pageable pageable);

	Page<Notification> findPageableByUserId(String userId, Pageable pageable);

	List<Notification> findByUserIdAndReadDateNull(String userId);

}
