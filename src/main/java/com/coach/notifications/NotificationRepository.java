package com.coach.notifications;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface NotificationRepository extends MongoRepository<Notification, String> {

	Page<Notification> findPageableByUserIdAndReadDateNull(String userId, Pageable pageable);

	Page<Notification> findPageableByUserId(String userId, Pageable pageable);

	List<Notification> findByUserIdAndReadDateNull(String userId);

	//@formatter:off
	@Query(	value =
		"{ userId : ?0, "
			+ "readDate: {$eq: null},"
			+ "data.reviewId: ?1"
		+ "}"
	)
	//@formatter:on
	List<Notification> findByUserIdAndReviewIdAndReadDateNull(String userId, String reviewId);

	List<Notification> findByBundledTrue();

}
