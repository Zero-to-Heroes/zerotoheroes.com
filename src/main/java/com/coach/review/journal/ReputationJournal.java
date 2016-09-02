package com.coach.review.journal;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document
public class ReputationJournal extends Journal {

	@Id
	private String id;
	private final String reviewId, subjectId, userId, sport;
	private final Date reputationChangeDate;
	private final int changeValue;
}
