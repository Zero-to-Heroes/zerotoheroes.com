package com.coach.user;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.coach.core.security.User;

//@RepositoryRestResource(collectionResourceRel = "users", path = "users")
public interface UserRepository extends MongoRepository<User, String> {

	User findById(String id);

	User findByUsername(String username);

	User findByEmail(String email);
}
