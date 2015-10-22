package com.coach.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

//@RepositoryRestResource(collectionResourceRel = "reviews", path = "reviews")
public interface ReviewRepository extends MongoRepository<Review, String> {

	Review findById(String id);

	// Sport is case-insensitive
	@Query("{ $and :" + "    [{" + "       $and: " + "        ["
			+ "         {$or : [ { $where: '?0 == null' } , { author : ?0 }]}, "
			+ "         {$or : [ { $where: '?1 == null' } , { sport : {$regex : '^?1$', $options: 'i'} }]}"
			+ "        ]" + "    }]" + "}")
	Page<Review> findAll(String author, String sport, Pageable pageable);

	// Sport is case-insensitive
	// Key exists, cf
	// http://stackoverflow.com/questions/4057196/how-do-you-query-this-in-mongo-is-not-null
	@Query("{ $and :" + "  [" + "    {" + "      $and: " + "        ["
			+ "          {$or : [ { $where: '?0 == null' } , { author : ?0 }]}, "
			+ "          {$or : [ { $where: '?1 == null' } , { sport : {$regex : '^?1$', $options: 'i'} }]}"
			+ "        ]" + "    }," + "    {key: {$exists : true}}" + "  ]" + "}")
	Page<Review> findAllWithKey(String userName, String sport, Pageable pageable);

}
