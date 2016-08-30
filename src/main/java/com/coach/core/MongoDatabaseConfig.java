package com.coach.core;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoConfiguration;

import com.mongodb.Mongo;
import com.mongodb.MongoClient;
import com.mongodb.MongoCredential;
import com.mongodb.ServerAddress;

@Configuration
public class MongoDatabaseConfig extends AbstractMongoConfiguration {

	@Value("${mongodb.username}")
	private String username;

	@Value("${mongodb.password}")
	private String password;

	@Value("${mongodb.database}")
	private String database;

	@Value("${mongodb.host}")
	private String host;

	@Value("${mongodb.port}")
	private int port;

	@Override
	public String getDatabaseName() {
		return database;
	}

	@Override
	@Bean
	public Mongo mongo() throws Exception {
		return new MongoClient(Arrays.asList(new ServerAddress(host, port)),
				Arrays.asList(MongoCredential.createCredential(username, database, password.toCharArray())));
	}
}
