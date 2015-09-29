package com.coach.reputation;

import java.util.List;

import org.springframework.stereotype.Component;

import com.coach.review.Review;

/**
 *
 * @author Thibaud responsible of all interactions with Reputation objects in
 *         element
 */
@Component
public class ReputationUpdater {

	/**
	 * update reputation after an action by the current user
	 *
	 * @param reputation
	 *            , reputation object, can be linked to comment or review
	 * @param action
	 *            , action executed by the user (for now only votes:up or down)
	 * @param userId
	 *            , id of the current user
	 */
	public void updateReputationAfterAction(Reputation reputation, ReputationAction action, String userId) {
		boolean isCurrentlyUpvoted = reputation.getUserIds().get(ReputationAction.Upvote).contains(userId);
		boolean isCurrentlyDownvoted = reputation.getUserIds().get(ReputationAction.Downvote).contains(userId);
		// similar reddit/youtube way, though an upvote on a downvoted element
		// reinit all to 0, same for a downvote on an upvote element
		if (action.equals(ReputationAction.Upvote)) {
			if (isCurrentlyUpvoted) {
				reputation.removeVote(ReputationAction.Upvote, userId);
			}
			else if (isCurrentlyDownvoted) {
				reputation.removeVote(ReputationAction.Downvote, userId);
			}
			else {
				reputation.addVote(action, userId);
			}
		}
		if (action.equals(ReputationAction.Downvote)) {
			if (isCurrentlyDownvoted) {
				reputation.removeVote(ReputationAction.Downvote, userId);
			}
			else if (isCurrentlyUpvoted) {
				reputation.removeVote(ReputationAction.Upvote, userId);
			}
			else {
				reputation.addVote(action, userId);
			}
		}
	}

	/**
	 * prepare list of reviews for UI with missing info about reputation linked
	 * to the current user
	 *
	 * @param review
	 *            , taken from DB, can't be null
	 * @param userId
	 *            , id of the current user, "" if unlogged
	 */
	public void modifyReviewsAccordingToUser(List<Review> reviews, String userId) {
		for (Review review : reviews) {
			review.prepareForDisplay(userId);
		}
	}
}
