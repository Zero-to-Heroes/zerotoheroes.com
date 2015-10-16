package com.coach.core.notification;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.stereotype.Component;

@Component
public class ExecutorProvider {

	private final ExecutorService executor = Executors.newFixedThreadPool(5);

	public ExecutorService getExecutor() {
		return executor;
	}
}
