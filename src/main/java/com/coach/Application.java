package com.coach;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.web.SpringBootServletInitializer;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.ImportResource;
import org.springframework.context.annotation.PropertySource;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

import lombok.extern.slf4j.Slf4j;

@SpringBootApplication
@EnableAutoConfiguration
@EnableMongoAuditing
@ComponentScan(basePackages = { "com.coach", "com.zerotoheroes" })
@PropertySource("classpath:/application.properties")
@ImportResource("classpath:/config/spring-aws-cloud.xml")
@Slf4j
// @EnableSpringDataWebSupport
public class Application extends SpringBootServletInitializer {

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(Application.class);
	}

	// Used for deployment. Simply run as Java application, it will run the
	// embedded Tomcat
	public static void main(String... args) {
		log.debug("application start!!!!!!!!");
		System.setProperty("spring.profiles.default", System.getProperty("spring.profiles.default", "dev"));
		SpringApplication.run(Application.class, args);
	}
}