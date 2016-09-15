package com.coach.plugin.hearthstone;

import org.springframework.data.mongodb.core.mapping.Document;

import com.coach.review.MetaData;

import lombok.Data;

@Data
@Document
public class HearthstoneMetaData extends MetaData {

	private int durationInSeconds;
	private int numberOfTurns;
	private String winStatus;
}
