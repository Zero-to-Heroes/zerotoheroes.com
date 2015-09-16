package com.coach.coaches;

import java.util.List;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.Singular;
import lombok.ToString;

import org.springframework.data.annotation.Id;

import com.coach.review.Review.Sport;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Getter
@Setter
@ToString
@Builder
public class Coach {

	@JsonFormat(shape = JsonFormat.Shape.OBJECT)
	public enum Language {
		French("fr"), English("en");

		@Getter
		private String code;

		private Language(String code) {
			this.code = code;
		}
	}

	@Id
	private String id;
	private String name;
	private Sport sport;
	@JsonIgnore
	private String email;
	@Singular("languageSpoken")
	private List<Language> languagesSpoken;
	private String level;
	private String description;
	private String picture;
	private String tariff;
	private String tariffDescription;
	private boolean verified;

}
