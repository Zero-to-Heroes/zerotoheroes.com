package com.coach.reputation;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import com.coach.core.security.User;
import com.coach.review.Review;
import com.coach.review.Review.Sport;
import com.coach.review.ReviewService;
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

	@Autowired
	ReviewService reviewService;

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
	public int updateReputationAfterAction(Sport sport, Reputation reputation, ReputationAction action, String authorId,
			User user) {
		String userId = user.getId();
		boolean isCurrentlyUpvoted = reputation.getUserIds().get(ReputationAction.Upvote).contains(userId);
		boolean isCurrentlyDownvoted = reputation.getUserIds().get(ReputationAction.Downvote).contains(userId);
		int changeAmount = 0;
		// similar reddit/youtube way, though an upvote on a downvoted element
		// reinit all to 0, same for a downvote on an upvote element
		if (action.equals(ReputationAction.Upvote)) {
			if (isCurrentlyUpvoted) {
				reputation.removeVote(ReputationAction.Upvote, userId);
				changeAmount = -1;
				changeAmount = changeAuthorReputation(sport, authorId, userId, changeAmount);
			}
			else if (isCurrentlyDownvoted) {
				reputation.removeVote(ReputationAction.Downvote, userId);
				changeAmount = 1;
				changeAmount = changeAuthorReputation(sport, authorId, userId, changeAmount);
			}
			else {
				reputation.addVote(action, userId);
				changeAmount = 1;
				changeAmount = changeAuthorReputation(sport, authorId, userId, changeAmount);
			}
		}
		else if (action.equals(ReputationAction.Downvote)) {
			if (isCurrentlyDownvoted) {
				reputation.removeVote(ReputationAction.Downvote, userId);
				changeAmount = 1;
				changeAmount = changeAuthorReputation(sport, authorId, userId, changeAmount);
			}
			else if (isCurrentlyUpvoted) {
				reputation.removeVote(ReputationAction.Upvote, userId);
				changeAmount = -1;
				changeAmount = changeAuthorReputation(sport, authorId, userId, changeAmount);
			}
			else {
				reputation.addVote(action, userId);
				changeAmount = -1;
				changeAmount = changeAuthorReputation(sport, authorId, userId, changeAmount);
			}
		}
		return changeAmount;
	}

	private int changeAuthorReputation(Sport sport, String authorId, String actionDoerId, int amount) {
		if (authorId != null && !authorId.equals(actionDoerId)) {
			User author = userRepo.findById(authorId);
			if (author != null) {
				author.modifyReputation(sport, amount);
				mongoTemplate.save(author);
				return amount;
			}
		}
		return 0;
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
	public int updateReputation(Sport sport, ReputationAction action, String authorId) {
		int changeAmount = 0;
		if (ReputationAction.Helpful.equals(action)) {
			User author = userRepo.findById(authorId);
			changeAmount = author.modifyReputation(sport, 3);
			mongoTemplate.save(author);
		}
		else if (ReputationAction.LostHelpful.equals(action)) {
			User author = userRepo.findById(authorId);
			changeAmount = author.modifyReputation(sport, -3);
			mongoTemplate.save(author);
		}
		return changeAmount;
	}
}
