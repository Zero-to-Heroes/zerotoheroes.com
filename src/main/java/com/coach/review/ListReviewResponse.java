package com.coach.review;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ListReviewResponse {

	private List<Review> reviews;
	private int totalPages;

	public ListReviewResponse(List<Review> reviews) {
		super();
		this.reviews = reviews;
	}

}
