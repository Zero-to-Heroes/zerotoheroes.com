package com.coach.sport;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface SportRepository extends MongoRepository<Sport, String> {

	Sport findById(String id);

}
