package com.coach.reputation;

import org.springframework.http.HttpStatus;

import com.coach.review.Comment;
import com.coach.review.Review;

public class ReputationManager {

	
	public void process(Reputation reputation, ReputationAction action, String userId) {
		// arf I don't like this code I'm writing
		boolean isCurrentlyUpvoted = reputation.getUserIds().get(ReputationAction.Upvote).contains(userId);
		boolean isCurrentlyDownvoted = reputation.getUserIds().get(ReputationAction.Downvote).contains(userId);
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
	
	public void modifyReviewAccordingToUser(Review review, String userId) {
		// for old videos without reputation
		if (review.getReputation() == null) {
			review.setReputation(new Reputation());
			if (review.getComments() != null) {
				for (Comment comment : review.getComments()) {
					comment.setReputation(new Reputation());
				}
			}
		}
		review.getReputation().modifyAccordingToUser(userId);
		if (review.getComments() != null) {
			for(Comment comment : review.getComments()) {
				comment.getReputation().modifyAccordingToUser(userId);
			}
		}
	}
}
