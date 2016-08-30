package com.coach.review.journal;

import org.springframework.data.annotation.Id;

import lombok.Data;

@Data
public class ArchiveJournal {

	@Id
	private String id;
	private final Journal journal;
}
