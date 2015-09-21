package com.coach.core.email;

import java.util.Set;

import lombok.Getter;
import lombok.Singular;
import lombok.experimental.Builder;

@Builder
@Getter
public class EmailMessage {

	private final String from, subject, content, type;
	@Singular("to")
	private final Set<String> recipients;
}
