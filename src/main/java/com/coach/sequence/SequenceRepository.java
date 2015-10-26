package com.coach.sequence;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface SequenceRepository extends MongoRepository<Sequence, String> {

	Sequence findById(String id);

	// Sport is case-insensitive
	//@formatter:off
	@Query("{ $and :"
			+ "    [{"
			+ "       $and: "
			+ "        ["
			+ "         {$or : [ { $where: '?0 == null' } , { sport : {$regex : '^?0$', $options: 'i'} }]}"
			+ "        ]"
			+ "    }]"
			+ "}")
	//@formatter:on
	List<Sequence> findBySportIgnoreCase(String sport, Sort sort); // , Pageable
																	// pageable);

}
