package com.coach.news;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.ToString;

@AllArgsConstructor
@Getter
@ToString
public class News {

	public enum Type {
		Feature, Bug
	}

	private final Date date;
	private final String description;
	private final Type type;
}
