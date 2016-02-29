package com.coach.core;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class AllResources extends WebMvcConfigurerAdapter {

	// http://stackoverflow.com/a/23938850/548701
	@Override
	public void configurePathMatch(PathMatchConfigurer matcher) {
		matcher.setUseRegisteredSuffixPatternMatch(true);
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/fonts/**", "/images/**", "/scripts/**", "/styles/**")
				.addResourceLocations("/fonts/", "/images/", "/scripts/", "/styles/").setCachePeriod(31556926);

		registry.addResourceHandler("/templates/**", "/views/**").addResourceLocations("/templates/", "/views/");
	}

}
