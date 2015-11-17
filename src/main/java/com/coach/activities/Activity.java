package com.coach.activities;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class Activity {

	public enum Type {
		NEW_REVIEW, NEW_COMMENT, UPDATE_REVIEW, UPDATE_COMMENT, HELPFUL_COMMENT

	}

	private Date date;
	private Type type;
	private String userName;
	private String reviewUrl;
	private String reviewTitle;
}
