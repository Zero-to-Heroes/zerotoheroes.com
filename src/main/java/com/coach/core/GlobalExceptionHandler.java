package com.coach.core;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.coach.core.notification.SlackNotifier;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	@Autowired
	SlackNotifier slackNotifier;

	@ExceptionHandler(Exception.class)
	protected final ResponseEntity<Object> handleControllerException(Exception ex, WebRequest request) {
		log.warn("Handling exception", ex);
		slackNotifier.notifyException(request, ex);
		return super.handleException(ex, request);
	}
}
