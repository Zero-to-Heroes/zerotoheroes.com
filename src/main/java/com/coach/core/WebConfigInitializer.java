package com.coach.core;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.embedded.FilterRegistrationBean;
import org.springframework.boot.context.embedded.ServletContextInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerExceptionResolver;

import com.coach.core.prerender.PreRenderSEOFilter;

import io.sentry.spring.SentryExceptionResolver;
import io.sentry.spring.SentryServletContextInitializer;
import lombok.extern.slf4j.Slf4j;

//@Component
@Slf4j
@Configuration
public class WebConfigInitializer implements ServletContextInitializer {

	@Value("${videos.bucket.output.name}")
	String outputBucket;

	@Autowired
	public WebConfigInitializer(@Value("${videos.bucket.output.name}") String outputBucket,
			@Value("${transcoding.sqs.queue.url}") String queue, @Value("${mongodb.host}") String dbHost) {
		super();
		this.outputBucket = outputBucket;
		log.debug("!!" + outputBucket);
		log.debug("!!" + queue);
		log.debug("!!" + dbHost);
	}

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
		log.debug("!!" + outputBucket);
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

	@Bean
	public HandlerExceptionResolver sentryExceptionResolver() {
		log.debug("registering sentry exception resolver");
	    return new SentryExceptionResolver();
	}

	@Bean
	public  org.springframework.boot.web.servlet.ServletContextInitializer sentryServletContextInitializer() {
		log.debug("registering sentry servlet context initializer");
	    return new SentryServletContextInitializer();
	}
}
