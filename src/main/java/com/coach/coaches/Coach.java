package com.coach.coaches;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import org.springframework.data.annotation.Id;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class Coach {

	@Id
	private String id;
	private String name;
	private String email;
	private String sport;
	private String tariff;
	private String level;
	private String description;
}
