package com.coach.review.journal;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface CommentJournalRepository extends MongoRepository<CommentJournal, String> {

}
