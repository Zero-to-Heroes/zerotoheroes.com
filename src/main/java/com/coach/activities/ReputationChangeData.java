package com.coach.activities;

import lombok.Data;

@Data
public class ReputationChangeData extends ActivityData {

	private String reviewId;
	private String reviewTitle;
	private int amount;
	private String reason;

	public ReputationChangeData() {
		type = "reputation-change";
	}

}
