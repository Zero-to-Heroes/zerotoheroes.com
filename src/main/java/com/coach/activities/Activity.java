package com.coach.activities;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document
public class Activity {

	@Id
	private String id;

	@Indexed
	private String userId;

	@Indexed
	private Date creationDate;

	@Indexed
	private String sport;

	private ActivityData data;
}
