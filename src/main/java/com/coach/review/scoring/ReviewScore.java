package com.coach.review.scoring;

import lombok.Data;

// https://github.com/Zero-to-Heroes/zerotoheroes.com/issues/20
@Data
public class ReviewScore {

	private float dateScore, preReviewScore, fieldsScore, winLossScore, helpReceivedContributorsScore,
			helpReceivedCommentsScore, helpReceivedUpvotedCommentsScore, authorReputationScore, openReviewScore;
	// private float waitingForOPVisitScore, waitingForOPActionScore;

	public float totalScore() {
		return dateScore + preReviewScore + fieldsScore + winLossScore + helpReceivedContributorsScore
				+ helpReceivedCommentsScore + helpReceivedUpvotedCommentsScore + authorReputationScore
				+ openReviewScore;
	}
}
