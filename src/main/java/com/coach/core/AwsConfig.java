package com.coach.core;

import java.util.Collections;

import org.springframework.cloud.aws.messaging.config.QueueMessageHandlerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.handler.annotation.support.PayloadArgumentResolver;
import org.springframework.messaging.handler.invocation.HandlerMethodArgumentResolver;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class AwsConfig {

	@Bean
	public QueueMessageHandlerFactory queueMessageHandlerFactory() {
		log.debug("Configuring AWS");
		QueueMessageHandlerFactory factory = new QueueMessageHandlerFactory();
		MappingJackson2MessageConverter messageConverter = new MappingJackson2MessageConverter();

		// set strict content type match to false
		messageConverter.setStrictContentTypeMatch(false);
		factory.setArgumentResolvers(Collections
				.<HandlerMethodArgumentResolver> singletonList(new PayloadArgumentResolver(messageConverter)));
		return factory;
	}
}
