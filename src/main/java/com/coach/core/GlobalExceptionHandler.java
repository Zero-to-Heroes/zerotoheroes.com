package com.coach.core;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.coach.core.notification.SlackNotifier;

import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	@Autowired
	SlackNotifier slackNotifier;

	@ExceptionHandler(Exception.class)
	protected final ResponseEntity<Object> handleControllerException(Exception ex, WebRequest request) {
		log.warn("Handling exception", ex);
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		slackNotifier.notifyException(currentUser, request, ex);
		return super.handleException(ex, request);
	}
}
