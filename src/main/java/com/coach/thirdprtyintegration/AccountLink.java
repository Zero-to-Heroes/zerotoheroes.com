package com.coach.thirdprtyintegration;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
@Document
public class AccountLink {

	@Id
	private String id;

	@Indexed
	private final String userId;

	@Indexed
	private final String applicationKey;

	@Indexed
	private final String token;
}
