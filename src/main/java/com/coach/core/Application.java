package com.coach.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.web.SpringBootServletInitializer;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableAutoConfiguration
@EnableScheduling
@ComponentScan
// @EnableSpringDataWebSupport
public class Application extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(Application.class);
	}

	// Used for deployment. Simply run as Java application, it will run the
	// embedded Tomcat
	public static void main(String... args) {
		System.setProperty("spring.profiles.default", System.getProperty("spring.profiles.default", "dev"));
		SpringApplication.run(Application.class, args);
	}
}