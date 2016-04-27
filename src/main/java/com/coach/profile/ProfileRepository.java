package com.coach.profile;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface ProfileRepository extends MongoRepository<Profile, String> {

	Profile findByUserId(String userId);

	//@formatter:off
	@Query(value = "{ userId: { $in: ?0 } }")
	//@formatter:on
	List<Profile> findAllByUserId(Iterable<String> userIds);
}
