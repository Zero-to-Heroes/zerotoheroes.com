package com.coach.reputation;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.annotation.Transient;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Reputation {

	@JsonIgnore
	private Map<ReputationAction, List<String>> userIds;

	@Transient
	private Map<ReputationAction, Integer> nbVotes;

	@Transient
	private Map<ReputationAction, Boolean> hasCurrentUserVoted;

	private boolean helpful;

	private float score = -1;

	public Reputation() {
		userIds = new HashMap<ReputationAction, List<String>>();
		userIds.put(ReputationAction.Downvote, new ArrayList<String>());
		userIds.put(ReputationAction.Upvote, new ArrayList<String>());
		nbVotes = new HashMap<ReputationAction, Integer>();
		nbVotes.put(ReputationAction.Downvote, 0);
		nbVotes.put(ReputationAction.Upvote, 0);
		hasCurrentUserVoted = new HashMap<ReputationAction, Boolean>();
		hasCurrentUserVoted.put(ReputationAction.Downvote, false);
		hasCurrentUserVoted.put(ReputationAction.Upvote, false);
	}

	public void addVote(ReputationAction action, String userId) {
		userIds.get(action).add(userId);
		nbVotes.put(action, userIds.get(action).size());
		hasCurrentUserVoted.put(action, true);
		updateScore();
	}

	public void removeVote(ReputationAction action, String userId) {
		userIds.get(action).remove(userId);
		nbVotes.put(action, userIds.get(action).size());
		hasCurrentUserVoted.put(action, false);
		updateScore();
	}

	public void modifyAccordingToUser(String userId) {
		nbVotes.put(ReputationAction.Downvote, userIds.get(ReputationAction.Downvote).size());
		nbVotes.put(ReputationAction.Upvote, userIds.get(ReputationAction.Upvote).size());
		hasCurrentUserVoted.put(ReputationAction.Downvote, userIds.get(ReputationAction.Downvote).contains(userId));
		hasCurrentUserVoted.put(ReputationAction.Upvote, userIds.get(ReputationAction.Upvote).contains(userId));
	}

	// https://possiblywrong.wordpress.com/2011/06/05/reddits-comment-ranking-algorithm/
	// Original from http://amix.dk/blog/post/19588
	private void updateScore() {
		score = computeScore();
	}

	private float computeScore() {
		int ups = userIds.get(ReputationAction.Upvote) != null ? userIds.get(ReputationAction.Upvote).size() : 0;
		int downs = userIds.get(ReputationAction.Downvote) != null ? userIds.get(ReputationAction.Downvote).size() : 0;

		if (helpful) {
			ups += 3;
		}

		if (ups == 0) { return -downs; }

		int n = ups + downs;

		float z = 1.64485f; // 1.0 = 85%, 1.6 = 95%
		float phat = Float.valueOf(ups) / n;

		float bottomEstimate = (float) ((phat + z * z / (2 * n)
				- z * Math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n)) / (1 + z * z / n));
		return bottomEstimate;
	}

	public float getScore() {
		if (score == -1) {
			updateScore();
		}
		return score;
	}

	public void setHelpful(boolean helpful) {
		this.helpful = helpful;
		updateScore();
	}

	public Set<String> getAllUserIds() {
		Set<String> allIds = new HashSet<>();
		for (List<String> ids : userIds.values()) {
			allIds.addAll(ids);
		}
		return allIds;
	}
}
