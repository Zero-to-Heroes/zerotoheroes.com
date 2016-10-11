package com.coach.core;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class MongoConfig {

	@Autowired
	private MongoMappingContext mongoMappingContext;

	@Autowired
	private MappingMongoConverter mongoConverter;

	// @Autowired
	// private MongoDbFactory mongoFactory;

	// @Bean
	// public MappingMongoConverter mongoConverter(MongoDbFactory mongoFactory)
	// throws Exception {
	// log.debug("configuring mongo mapping");
	// DbRefResolver dbRefResolver = new DefaultDbRefResolver(mongoFactory);
	// MappingMongoConverter mongoConverter = new
	// MappingMongoConverter(dbRefResolver, mongoMappingContext);
	// // this is my customization
	// mongoConverter.setMapKeyDotReplacement("___");
	// log.debug("mongo mapping configured");
	// return mongoConverter;
	// }

	@PostConstruct
	public void setUpMongoEscapeCharacterConversion() {
		if (mongoConverter != null) {
			log.debug("configuring mongo mapping");
			mongoConverter.setMapKeyDotReplacement("___");
			log.debug("mongo mapping configured");
		}
	}
}
