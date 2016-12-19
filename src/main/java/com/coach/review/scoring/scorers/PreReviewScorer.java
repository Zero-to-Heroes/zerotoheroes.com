package com.coach.review.scoring.scorers;

import org.springframework.stereotype.Component;

import com.coach.review.Comment;
import com.coach.review.Review;

@Component
public class PreReviewScorer {

	public static final float MAX_SCORE = 3;

	public float score(Review review) {
		float score = 0;
		// Give points per top-level comment done by the author
		int totalComments = 0;
		for (Comment comment : review.getComments()) {
			if (comment.getAuthor() != null && comment.getAuthor().equals(review.getAuthor())) {
				totalComments++;
				// score = Math.min(MAX_SCORE, score + 1);
			}
		}
		score = (float) Math.log10(1 + totalComments);
		return score;
	}

}
