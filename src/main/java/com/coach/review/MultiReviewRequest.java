package com.coach.review;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class MultiReviewRequest {
	private List<Review> reviews = new ArrayList<>();

}
