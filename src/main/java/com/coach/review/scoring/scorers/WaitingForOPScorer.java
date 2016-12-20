package com.coach.review.scoring.scorers;

import java.util.Date;

import org.springframework.stereotype.Component;

import com.coach.review.Review;

@Component
public class WaitingForOPScorer {

	public static final int SEPARATE_SESSION_THRESHOLD = 600;

	public float scoreOPVisit(Review review) {
		float score = 0;

		if (review.getAuthorId() == null) { return score; }

		// If the OP has not seen new comments
		Date lastOPVisit = review.getVisitDates().get(review.getAuthorId());
		// Find all comments added after last OP's visit
		long commentsAfterLastVisit = review.getAllComments().stream()
				.filter(c -> !review.getAuthorId().equals(c.getAuthorId()))
				.filter(c -> lastOPVisit == null || c.getCreationDate().after(lastOPVisit)).count();
		score -= Math.log10(1 + commentsAfterLastVisit);

		return score;
	}

	// public float scoreOPActions(Review review) {
	// float score = 0;
	//
	// if (review.getAuthorId() == null) { return score; }
	//
	// Date lastOPVisit = review.getVisitDates().get(review.getAuthorId());
	//
	// // Is it possible to do something when the OP has seen stuff but hasn't
	// // answered / commented?
	// long commentsBeforeLastVisit = review.getAllComments().stream()
	// .filter(c -> !review.getAuthorId().equals(c.getAuthorId()))
	// .filter(c -> lastOPVisit != null &&
	// c.getCreationDate().before(lastOPVisit)).count();
	// // Now count the total actions - upvotes / downvotes and comments by the
	// // OP
	// long opComments = review.getAllComments().stream().filter(c ->
	// review.getAuthorId().equals(c.getAuthorId()))
	// .count();
	// long opActions = review.getAllComments().stream().filter(c ->
	// !review.getAuthorId().equals(c.getAuthorId()))
	// .filter(c ->
	// c.getReputation().getAllUserIds().contains(review.getAuthorId())).count();
	//
	// if (commentsBeforeLastVisit > opComments + opActions) {
	// score -= Math.log10(1 + commentsBeforeLastVisit - opComments -
	// opActions);
	// }
	//
	// return score;
	// }

	public float scoreOPActions(Review review) {
		float score = 0;

		if (review.getAuthorId() == null) { return score; }

		long opComments = review.getAllComments().stream().filter(c -> review.getAuthorId().equals(c.getAuthorId()))
				.count();
		long opActions = review.getAllComments().stream().filter(c -> !review.getAuthorId().equals(c.getAuthorId()))
				.filter(c -> c.getReputation().getAllUserIds().contains(review.getAuthorId())).count();
		long opHelpful = review.getAllComments().stream().filter(c -> !review.getAuthorId().equals(c.getAuthorId()))
				.filter(c -> c.isHelpful()).count();

		return (float) Math.log(1 + opComments + opActions + opHelpful);
	}

}
