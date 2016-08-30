package com.coach.review.journal;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Document
@Data
public class ReviewJournal extends Journal {

	@Id
	private String id;
	private final String reviewId, authorId, sport;
	private final Date gameCreationDate;
}
