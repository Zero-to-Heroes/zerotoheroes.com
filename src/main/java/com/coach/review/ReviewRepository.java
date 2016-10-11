package com.coach.review;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReviewRepository extends MongoRepository<Review, String> {

	Review findById(String id);

	List<Review> findBySport(String sport);

}
