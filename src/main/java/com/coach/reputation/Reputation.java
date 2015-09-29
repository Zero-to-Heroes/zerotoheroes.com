package com.coach.reputation;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import org.springframework.data.annotation.Transient;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
	}

	public void removeVote(ReputationAction action, String userId) {
		userIds.get(action).remove(userId);
		nbVotes.put(action, userIds.get(action).size());
		hasCurrentUserVoted.put(action, false);
	}

	public void modifyAccordingToUser(String userId) {
		nbVotes.put(ReputationAction.Downvote, userIds.get(ReputationAction.Downvote).size());
		nbVotes.put(ReputationAction.Upvote, userIds.get(ReputationAction.Upvote).size());
		hasCurrentUserVoted.put(ReputationAction.Downvote, userIds.get(ReputationAction.Downvote).contains(userId));
		hasCurrentUserVoted.put(ReputationAction.Upvote, userIds.get(ReputationAction.Upvote).contains(userId));
	}
}
