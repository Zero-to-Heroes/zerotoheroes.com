package com.coach.review.journal;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ArchiveJournalRepository extends MongoRepository<ArchiveJournal, String> {

}
