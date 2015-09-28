package com.coach.review;

import java.util.Date;

import com.coach.reputation.Reputation;
import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Comment {

	private String id;
	private String author, authorId, text;
	private Date creationDate;
	private Reputation reputation;
}
