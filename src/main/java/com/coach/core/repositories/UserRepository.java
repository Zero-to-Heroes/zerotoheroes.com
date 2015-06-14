package com.coach.core.repositories;

import org.springframework.data.repository.CrudRepository;

import com.coach.core.domain.User;

public interface UserRepository extends CrudRepository<User, String> {

	/**
	 * Additional custom finder method.
	 */
	// User findByUsername(Query query);

}
