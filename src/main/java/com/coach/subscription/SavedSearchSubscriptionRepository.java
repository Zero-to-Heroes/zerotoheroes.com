package com.coach.subscription;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface SavedSearchSubscriptionRepository extends MongoRepository<SavedSearchSubscription, String> {

}
