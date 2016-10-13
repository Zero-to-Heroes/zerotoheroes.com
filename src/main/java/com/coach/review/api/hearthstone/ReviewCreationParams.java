package com.coach.review.api.hearthstone;

import lombok.Data;

@Data
public class ReviewCreationParams {

	private String gameMode;
	private int legendRank;
	private int rank;

	private String uploaderApplicationKey, uploaderToken;
}
