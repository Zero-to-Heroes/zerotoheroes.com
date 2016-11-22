package com.coach.review.scoring;

import lombok.Data;

@Data
public class ScoreWeights {

	private float dateScoreWeight = 1f;
	private float preReviewScoreWeight = 1f;
	private float fieldsScoreWeight = 1f;
	private float winLossScoreWeight = 1f;
	private float helpReceivedScoreWeight = 1f;
	private float waitingForOPVisitScoreWeight = 1f;
	private float waitingForOPActionScoreWeight = 1f;
	private float authorReputationScoreWeight = 1f;
}
