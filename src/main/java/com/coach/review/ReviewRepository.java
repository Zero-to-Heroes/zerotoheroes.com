package com.coach.review;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

//@RepositoryRestResource(collectionResourceRel = "reviews", path = "reviews")
public interface ReviewRepository extends MongoRepository<Review, String> {

	Review findById(String id);

	List<Review> findByAuthor(String author, Sort sort);

	// Sport is case-insensitive
	@Query("{ $and :" +
			"    [{" +
			"       $and: " +
			"        [" +
			"         {$or : [ { $where: '?0 == null' } , { author : ?0 }]}, " +
			"         {$or : [ { $where: '?1 == null' } , { sport : {$regex : '^?1$', $options: 'i'} }]}" +
			"        ]" +
			"    }]" +
			"}")
	List<Review> findAll(String author, String sport, Sort sort);

}
