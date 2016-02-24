package com.coach.reputation;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import com.coach.core.security.User;
import com.coach.review.Review;
import com.coach.review.Review.Sport;
import com.coach.user.UserRepository;

/**
 *
 * @author Thibaud responsible of all interactions with Reputation objects in
 *         element
 */
@Component
public class ReputationUpdater {

	@Autowired
	UserRepository userRepo;

	@Autowired
	MongoTemplate mongoTemplate;

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
	public void updateReputationAfterAction(Sport sport, Reputation reputation, ReputationAction action,
			String authorId, User user) {
		String userId = user.getId();
		boolean isCurrentlyUpvoted = reputation.getUserIds().get(ReputationAction.Upvote).contains(userId);
		boolean isCurrentlyDownvoted = reputation.getUserIds().get(ReputationAction.Downvote).contains(userId);
		// similar reddit/youtube way, though an upvote on a downvoted element
		// reinit all to 0, same for a downvote on an upvote element
		if (action.equals(ReputationAction.Upvote)) {
			if (isCurrentlyUpvoted) {
				reputation.removeVote(ReputationAction.Upvote, userId);
				changeAuthorReputation(sport, authorId, userId, -1);
			}
			else if (isCurrentlyDownvoted) {
				reputation.removeVote(ReputationAction.Downvote, userId);
				changeAuthorReputation(sport, authorId, userId, 1);
			}
			else {
				reputation.addVote(action, userId);
				changeAuthorReputation(sport, authorId, userId, 1);
			}
		}
		else if (action.equals(ReputationAction.Downvote)) {
			if (isCurrentlyDownvoted) {
				reputation.removeVote(ReputationAction.Downvote, userId);
				changeAuthorReputation(sport, authorId, userId, 1);
			}
			else if (isCurrentlyUpvoted) {
				reputation.removeVote(ReputationAction.Upvote, userId);
				changeAuthorReputation(sport, authorId, userId, -1);
			}
			else {
				reputation.addVote(action, userId);
				changeAuthorReputation(sport, authorId, userId, -1);
			}
		}
	}

	private void changeAuthorReputation(Sport sport, String authorId, String actionDoerId, int amount) {
		if (!authorId.equals(actionDoerId)) {
			User author = userRepo.findById(authorId);
			if (author != null) {
				author.modifyReputation(sport, amount);
				mongoTemplate.save(author);
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

	/**
	 * Update reputation when a review author marks a comment as "helpful"
	 */
	public void updateReputation(Sport sport, ReputationAction action, String authorId) {
		if (ReputationAction.Helpful.equals(action)) {
			User author = userRepo.findById(authorId);
			author.modifyReputation(sport, 3);
			mongoTemplate.save(author);
		}
		else if (ReputationAction.LostHelpful.equals(action)) {
			User author = userRepo.findById(authorId);
			author.modifyReputation(sport, -3);
			mongoTemplate.save(author);
		}
	}
}
