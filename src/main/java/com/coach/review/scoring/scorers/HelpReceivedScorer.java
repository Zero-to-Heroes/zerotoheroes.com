package com.coach.review.scoring.scorers;

import org.springframework.stereotype.Component;

import com.coach.review.Review;

@Component
public class HelpReceivedScorer {

	public static final float COMMENTS_WEIGHT = 0.1f;

	public float score(Review review) {

		if (review.getAuthor() == null) { return 0; }

		int contributors = review.getAllAuthors().size();
		long otherComments = review.getAllComments().stream().filter(c -> !review.getAuthor().equals(c.getAuthor()))
				.count();

		float score = -1.0f * (contributors + COMMENTS_WEIGHT * otherComments);

		return score;
	}

}
