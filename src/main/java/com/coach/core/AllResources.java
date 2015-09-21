package com.coach.core;

import lombok.extern.slf4j.Slf4j;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

@Configuration
@Slf4j
public class AllResources extends WebMvcConfigurerAdapter {

	// http://stackoverflow.com/a/23938850/548701
	@Override
	public void configurePathMatch(PathMatchConfigurer matcher) {
		log.debug("Init configuration");
		matcher.setUseRegisteredSuffixPatternMatch(true);
	}

}
