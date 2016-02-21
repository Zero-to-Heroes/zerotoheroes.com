package com.coach.coaches;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.coach.core.security.User;

public interface CoachRepository extends MongoRepository<User, String> {

	//@formatter:off
	@Query(	value =
		"{ coachInformation.sport : ?0, }",
			fields =
				"{"
			+ 		"'username' : 1,"
			+ 		"'coachInformation' : 1"
			+ 	"}"
	)
	//@formatter:on
	Page<User> listCoaches(String sport, Pageable pageable);

}
