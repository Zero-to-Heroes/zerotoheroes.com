package com.coach.activities;

import lombok.Data;

@Data
public class NewCommentData extends ActivityData {

	private String reviewId, reviewTitle;
	private String commentExtract;

	public NewCommentData() {
		type = "new-comment";
	}
}
