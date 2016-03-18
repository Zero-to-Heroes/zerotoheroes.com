package com.coach.announcements;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface AnnouncementsRepository extends MongoRepository<Announcements, String> {
}
