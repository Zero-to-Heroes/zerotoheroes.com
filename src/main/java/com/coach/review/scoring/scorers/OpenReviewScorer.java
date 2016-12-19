package com.coach.review.scoring.scorers;

import org.springframework.stereotype.Component;

import com.coach.review.Review;

@Component
public class OpenReviewScorer {

	public float score(Review review, int openReviews) {

		// Only one review actually gives a bonus
		float score = -1.0f * (openReviews - 2);

		return score;
	}

}
