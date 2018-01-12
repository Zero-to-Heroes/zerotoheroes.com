package com.zerotoheroes.reviewprocessing;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.coach.core.notification.SlackNotifier;

import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class TempExceptionHandler extends ResponseEntityExceptionHandler {

	@Autowired
	SlackNotifier slackNotifier;

	@ExceptionHandler(value = Exception.class)
	protected final ResponseEntity<Object> handleControllerException(Exception ex, WebRequest request) {
		log.warn("Handling exception in temporary controller advice", ex);
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
		slackNotifier.notifyException(request, ex, "Temp Controller Advice");
		return super.handleException(ex, request);
	}
}
