package com.coach.user;

import java.time.LocalDate;

import org.springframework.data.annotation.Id;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@RequiredArgsConstructor
@ToString
public class ResetPassword {

	@Id
	private final String uniqueId;
	private final String userId;
	private final LocalDate creationDate;
}
