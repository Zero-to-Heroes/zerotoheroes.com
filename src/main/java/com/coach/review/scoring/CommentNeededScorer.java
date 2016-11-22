package com.coach.review.scoring;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.review.Review;
import com.coach.review.scoring.scorers.DateScorer;
import com.coach.review.scoring.scorers.FieldsScorer;
import com.coach.review.scoring.scorers.HelpReceivedScorer;
import com.coach.review.scoring.scorers.PreReviewScorer;
import com.coach.review.scoring.scorers.WaitingForOPScorer;
import com.coach.review.scoring.scorers.WinLossScorer;

import lombok.Setter;

@Component
public class CommentNeededScorer {

	@Setter
	private ScoreWeights weights;

	@Autowired
	private DateScorer dateScorer;

	@Autowired
	private PreReviewScorer preReviewScorer;

	@Autowired
	private FieldsScorer fieldsScorer;

	@Autowired
	private WinLossScorer winLossScorer;

	@Autowired
	private HelpReceivedScorer helpReceivedScorer;

	@Autowired
	private WaitingForOPScorer waitingForOPScorer;

	public ReviewScore score(Review review) {

		if (review.isClosed()) { return new ReviewScore(); }

		ReviewScore score = new ReviewScore();
		score.setDateScore(weights.getDateScoreWeight() * dateScorer.score(review.getPublicationDate()));
		score.setPreReviewScore(weights.getPreReviewScoreWeight() * preReviewScorer.score(review));
		score.setFieldsScore(weights.getFieldsScoreWeight() * fieldsScorer.score(review));
		score.setWinLossScore(weights.getWinLossScoreWeight() * winLossScorer.score(review));
		score.setHelpReceivedScore(weights.getHelpReceivedScoreWeight() * helpReceivedScorer.score(review));
		score.setWaitingForOPVisitScore(
				weights.getWaitingForOPVisitScoreWeight() * waitingForOPScorer.scoreOPVisit(review));
		score.setWaitingForOPActionScore(
				weights.getWaitingForOPActionScoreWeight() * waitingForOPScorer.scoreOPVisit(review));
		score.setAuthorReputationScore(weights.getAuthorReputationScoreWeight() * review.getAuthorReputation());

		return score;
	}
}
