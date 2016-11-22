package com.coach.review.scoring.scorers;

import org.springframework.stereotype.Component;

import com.coach.review.Comment;
import com.coach.review.Review;

@Component
public class PreReviewScorer {

	public static final float MAX_SCORE = 3;

	public float score(Review review) {
		float score = 0;
		// Give one point per top-level comment done by the author, max 3
		for (Comment comment : review.getComments()) {
			if (comment.getAuthor() != null && comment.getAuthor().equals(review.getAuthor())) {
				score = Math.min(MAX_SCORE, score + 1);
			}
		}
		return score;
	}

}
