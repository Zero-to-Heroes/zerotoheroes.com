package com.coach.activities;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;

public interface ActivityRepository extends PagingAndSortingRepository<Activity, String> {

	Page<Activity> findPageableBySportAndUserId(String sport, String userId, Pageable pageRequest);

	Page<Activity> findPageableByUserId(String userId, Pageable pageRequest);

	Page<Activity> findByUserId(String userId, Pageable pageRequest);
}
