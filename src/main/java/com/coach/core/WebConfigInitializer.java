package com.coach.core;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;

import lombok.extern.slf4j.Slf4j;

import org.springframework.boot.context.embedded.FilterRegistrationBean;
import org.springframework.boot.context.embedded.ServletContextInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.coach.core.prerender.PreRenderSEOFilter;

//@Component
@Slf4j
@Configuration
public class WebConfigInitializer implements ServletContextInitializer {

	@Override
	public void onStartup(ServletContext servletContext) throws ServletException {
		/*
		 * log.debug("Initializing SEO filter"); FilterRegistration filter =
		 * servletContext.getFilterRegistration("prerender");
		 * filter.setInitParameter("prerenderToken", "Pyd6EO6IRaMKowTwFGCQ");
		 * filter.setInitParameter("prerenderServiceUrl",
		 * "http://localhost:3000");
		 * filter.setInitParameter("crawlerUserAgents", "YahooSeeker");
		 * filter.addMappingForUrlPatterns(null, true, "/*");
		 */
	}

	@Bean
	public FilterRegistrationBean preRenderSEOFilterRegistration() {
		log.debug("Registering SEO filter");
		FilterRegistrationBean registration = new FilterRegistrationBean();
		registration.setFilter(preRenderSEOFilter());
		registration.addUrlPatterns("/*");
		registration.addInitParameter("prerenderToken", "Pyd6EO6IRaMKowTwFGCQ");
		// registration.addInitParameter("prerenderServiceUrl",
		// "http://localhost:3000");
		// registration.addInitParameter("crawlerUserAgents", "YahooSeeker");
		registration.setName("prerender");
		return registration;
	}

	@Bean(name = "prerender")
	public PreRenderSEOFilter preRenderSEOFilter() {
		return new PreRenderSEOFilter();
	}

}
