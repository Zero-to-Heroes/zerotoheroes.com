package com.coach.core;

import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;

import org.springframework.boot.context.embedded.FilterRegistrationBean;
import org.springframework.boot.context.embedded.ServletContextInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.coach.core.prerender.PreRenderSEOFilter;

import io.sentry.jul.SentryHandler;
import io.sentry.spring.SentryServletContextInitializer;
import lombok.extern.slf4j.Slf4j;

//@Component
@Slf4j
@Configuration
public class WebConfigInitializer implements ServletContextInitializer {

	@Override
	public void onStartup(ServletContext servletContext) throws ServletException {
		// We have to do that because I haven't found how to set Sentry's log level properly using conf
		// see https://stackoverflow.com/questions/46293943/sentry-io-tomcat-jul-all-logs-are-sent-to-sentry
		log.debug("Configuring log timestamp");
		 System.setProperty("java.util.logging.SimpleFormatter.format",
                 "%1$tY-%1$tm-%1$td %1$tH:%1$tM:%1$tS %4$-8s --- %2$-100s : %5$s%6$s%n");

		log.debug("Configuring SentryHandler");
		SentryHandler sentryHandler = new SentryHandler();
		sentryHandler.setLevel(Level.WARNING);
		Logger.getLogger("").addHandler(sentryHandler);
		log.debug("SentryHandler configured");
	}

	@Bean
	public FilterRegistrationBean preRenderSEOFilterRegistration() {
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
	public org.springframework.boot.web.servlet.ServletContextInitializer sentryServletContextInitializer() {
		log.debug("registering sentry servlet context initializer");
		return new SentryServletContextInitializer();
	}
}
