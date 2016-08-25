package com.coach.review.journal;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReviewJournalRepository extends MongoRepository<ReviewJournal, String> {

}
