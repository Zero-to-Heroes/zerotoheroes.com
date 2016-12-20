package com.coach.review.scoring.scorers;

import org.springframework.stereotype.Component;

import com.coach.review.Review;

@Component
public class HelpReceivedScorer {

	public float scoreContributors(Review review) {

		if (review.getAuthor() == null) { return -1; }

		int contributors = review.getAllAuthors().size() - 1;

		float score = (float) (-1.0f * Math.log10(1 + contributors));
		return score;
	}

	public float scoreComments(Review review) {

		if (review.getAuthor() == null) { return -1; }

		long otherComments = review.getAllComments().stream().filter(c -> !review.getAuthor().equals(c.getAuthor()))
				.count();

		float score = (float) (-1.0f * Math.log10(1 + otherComments));

		return score;
	}

	public float scoreUpvotes(Review review) {
		if (review.getAuthor() == null) { return -1; }

		double totalScore = review.getAllComments().stream().map(c -> c.getReputation()).mapToDouble(r -> r.getScore())
				.sum();

		float score = (float) (-1.0f * Math.log10(Math.max(1, totalScore)));

		return score;
	}

}
