package com.coach.review.scoring;

import lombok.Data;

@Data
public class ScoreWeights {

	private float dateScoreWeight = 0.4f;
	private float preReviewScoreWeight = 1f;
	private float fieldsScoreWeight = .25f;
	private float winLossScoreWeight = 1f;
	private float helpReceivedScoreWeight = 2f;
	private float helpReceivedNumberCommentsScoreWeight = 2f;
	private float waitingForOPVisitScoreWeight = 1f;
	private float waitingForOPActionScoreWeight = 1f;
	private float authorReputationScoreWeight = 1f;
	private float openReviewsWeight = 1f;
}
