package com.coach.notifications;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationsRepository extends MongoRepository<Notifications, String> {

	Notifications findByUserId(String userId);

}
