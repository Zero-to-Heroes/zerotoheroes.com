package com.coach.review.scoring;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.review.Review;
import com.coach.review.scoring.scorers.DateScorer;
import com.coach.review.scoring.scorers.FieldsScorer;
import com.coach.review.scoring.scorers.HelpReceivedScorer;
import com.coach.review.scoring.scorers.OpenReviewScorer;
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
	private OpenReviewScorer openReviewScorer;

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

	public ReviewScore score(Review review, Integer openReviews) {

		if (review.getClosedDate() != null) { return new ReviewScore(); }

		ReviewScore score = new ReviewScore();
		score.setDateScore(weights.getDateScoreWeight() * dateScorer.score(review.getPublicationDate()));
		score.setPreReviewScore(weights.getPreReviewScoreWeight() * preReviewScorer.score(review));
		score.setFieldsScore(weights.getFieldsScoreWeight() * fieldsScorer.score(review));
		score.setWinLossScore(weights.getWinLossScoreWeight() * winLossScorer.score(review));

		score.setHelpReceivedContributorsScore(
				weights.getHelpReceivedScoreWeight() * helpReceivedScorer.scoreContributors(review));
		score.setHelpReceivedCommentsScore(
				weights.getHelpReceivedNumberCommentsScoreWeight() * helpReceivedScorer.scoreComments(review));
		score.setHelpReceivedUpvotedCommentsScore(
				weights.getHelpReceivedUpvotedCommentsScoreWeight() * helpReceivedScorer.scoreUpvotes(review));

		// Too complex for now
		// score.setWaitingForOPVisitScore(
		// weights.getWaitingForOPVisitScoreWeight() *
		// waitingForOPScorer.scoreOPVisit(review));
		// score.setWaitingForOPActionScore(
		// weights.getWaitingForOPActionScoreWeight() *
		// waitingForOPScorer.scoreOPActions(review));

		// We want the first reputation points to count more than the last one
		// TODO: more weight for logged in users
		score.setAuthorReputationScore(
				(float) (weights.getAuthorReputationScoreWeight() * Math.log10(1 + review.getAuthorReputation())));

		if (openReviews != null && openReviews > 0) {
			score.setOpenReviewScore(weights.getOpenReviewsWeight() * openReviewScorer.score(review, openReviews));
		}

		return score;
	}
}
