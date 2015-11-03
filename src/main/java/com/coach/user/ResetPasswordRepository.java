package com.coach.user;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ResetPasswordRepository extends MongoRepository<ResetPassword, String> {
}
