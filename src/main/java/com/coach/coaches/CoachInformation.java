package com.coach.coaches;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;
import lombok.Setter;
import lombok.Singular;
import lombok.ToString;

@Getter
@Setter
@ToString
public class CoachInformation {

	private String id;
	private String sport;
	private String name;
	@JsonIgnore
	private String email;
	@Singular("languageSpoken")
	private List<String> languagesSpoken;
	private String level;
	private String description;
	private String picture;
	private List<String> tariff = new ArrayList<>();
	private List<String> tariffDescription = new ArrayList<>();
	private boolean verified;
}
