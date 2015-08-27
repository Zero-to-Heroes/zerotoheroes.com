package com.coach.review.access;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.coach.review.Review;

//@RepositoryRestResource(collectionResourceRel = "reviews", path = "reviews")
public interface ReviewRepository extends MongoRepository<Review, String> {

	Review findById(String id);

	List<Review> findByTreatmentCompletion(double treatmentCompletion, Sort sort);

	List<Review> findByAuthorAndTreatmentCompletion(String author, double treatmentCompletion, Sort sort);

	// @Override
	// Page<Review> findAll(Pageable pageable);

}
