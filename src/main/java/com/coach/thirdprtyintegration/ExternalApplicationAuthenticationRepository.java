package com.coach.thirdprtyintegration;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ExternalApplicationAuthenticationRepository extends MongoRepository<AccountLink, String> {

	AccountLink findByApplicationKeyAndToken(String applicationKey, String token);

}
