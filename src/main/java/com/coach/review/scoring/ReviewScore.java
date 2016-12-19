package com.coach.review.scoring;

import lombok.Data;

// https://github.com/Zero-to-Heroes/zerotoheroes.com/issues/20
@Data
public class ReviewScore {

	private float dateScore, preReviewScore, fieldsScore, winLossScore, helpReceivedContributorsScore,
			helpReceivedCommentsScore, waitingForOPVisitScore, waitingForOPActionScore, authorReputationScore,
			openReviewScore;

	public float totalScore() {
		return dateScore + preReviewScore + fieldsScore + winLossScore + helpReceivedContributorsScore
				+ helpReceivedCommentsScore + waitingForOPVisitScore + waitingForOPActionScore + authorReputationScore
				+ openReviewScore;
	}
}
