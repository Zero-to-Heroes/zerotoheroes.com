package com.coach.review.scoring;

import lombok.Data;

@Data
public class ScoreWeights {

	private float dateScoreWeight = 4f;
	private float preReviewScoreWeight = 6f;
	private float fieldsScoreWeight = .25f;
	private float winLossScoreWeight = 2f;
	private float helpReceivedScoreWeight = 2f;
	private float helpReceivedNumberCommentsScoreWeight = 8f;
	private float helpReceivedUpvotedCommentsScoreWeight = 1f;
	private float waitingForOPVisitScoreWeight = 1f;
	private float waitingForOPActionScoreWeight = 1f;
	private float authorReputationScoreWeight = 1f;
	private float openReviewsWeight = 2f;
}
