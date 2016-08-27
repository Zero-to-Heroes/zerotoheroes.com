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
		registry.addResourceHandler("/scripts/**", "/styles/**", "/templates/**", "/views/**")
				.addResourceLocations("/scripts/", "/styles/", "/templates/", "/views/");
		registry.addResourceHandler("/fonts/**", "/images/**").addResourceLocations("/fonts/", "/images/")
				.setCachePeriod(3600 * 24 * 28);
		registry.addResourceHandler("/plugins/**").addResourceLocations("/plugins/").setCachePeriod(3600 * 24 * 28);
	}

}
