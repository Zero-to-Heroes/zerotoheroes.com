package com.coach.activities;

import lombok.Data;

@Data
public class NewReviewData extends ActivityData {

	private String reviewId;
	private String reviewTitle;

	public NewReviewData() {
		type = "new-review";
	}
}
