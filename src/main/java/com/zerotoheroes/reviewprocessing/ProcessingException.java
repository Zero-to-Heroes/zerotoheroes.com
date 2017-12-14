package com.zerotoheroes.reviewprocessing;

public class ProcessingException extends Exception {

	private static final long serialVersionUID = 1L;

	public ProcessingException(String message, Throwable originalException) {
		super(message, originalException);
	}

}
