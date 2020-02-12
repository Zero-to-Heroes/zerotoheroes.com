package com.coach.core;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@ControllerAdvice(basePackages = { "com.coach", "com.zerotoheroes" })
@Slf4j
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

//	@Autowired
//	SlackNotifier slackNotifier;

	@ExceptionHandler(value = Exception.class)
	protected final ResponseEntity<Object> handleControllerException(Exception ex, WebRequest request) {
		log.warn("Handling exception", ex);
		// String currentUser =
		// SecurityContextHolder.getContext().getAuthentication().getName();
//		slackNotifier.notifyException(request, ex);
		return super.handleException(ex, request);
	}
}
