package com.coach.review;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.annotation.Transient;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.profile.Profile;
import com.coach.rankings.Rank;
import com.coach.reputation.Reputation;
import com.coach.reputation.ReputationAction;
import com.coach.review.Review.Sport;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;

@Getter
@Setter
@ToString(exclude = { "comments", "tempCanvas" })
@Slf4j
public class Comment implements HasText, HasReputation {

	private String id;
	private String author, authorId, text;
	private int authorReputation;
	private String authorFrame, authorStatus;
	private Date creationDate;
	private boolean helpful;
	private List<Comment> comments = new ArrayList<>();
	private int totalComments, totalHelpfulComments;
	private Reputation reputation;
	private List<Voter> noticeableVotes = new ArrayList<>();

	// The canvas that have been drawn for this comment, and that need to be
	// added to the review
	@Transient
	private Map<String, String> tempCanvas = new HashMap<>();

	@Override
	public Reputation getReputation() {
		if (reputation == null) {
			reputation = new Reputation();
		}
		return reputation;
	}

	public void addComment(Comment reply) {
		if (comments == null) {
			comments = new ArrayList<>();
		}
		comments.add(reply);
		sortComments();
	}

	public void sortComments() {
		// For now, simply sort them by date
		if (comments == null) { return; }

		Collections.sort(comments, new Comparator<Comment>() {
			@Override
			public int compare(Comment o1, Comment o2) {
				if (o1.getReputation().getScore() != o2.getReputation().getScore()) {
					return (int) (1000 * (o2.getReputation().getScore() - o1.getReputation().getScore()));
				}
				else if (o2.getCreationDate() == null) {
					return 1;
				}
				else {
					return o2.getCreationDate().compareTo(o1.getCreationDate());
				}
			}
		});

		for (Comment comment : comments) {
			comment.sortComments();
		}
	}

	public Comment getComment(int commentId) {
		if (comments == null) { return null; }

		for (Comment comment : comments) {
			if (comment.getId() != null && comment.getId().equals(String.valueOf(commentId))) { return comment; }
			Comment found = comment.getComment(commentId);
			if (found != null) { return found; }

		}
		return null;
	}

	public void prepareForDisplay(String userId) {
		getReputation().modifyAccordingToUser(userId);
		// comments
		if (comments != null) {
			for (Comment comment : comments) {
				comment.prepareForDisplay(userId);
			}
		}
	}

	public void getAllAuthors(Set<String> allAuthors) {
		if (!StringUtils.isNullOrEmpty(authorId) && !allAuthors.contains(authorId)) {
			allAuthors.add(authorId);
		}
		if (getReputation() != null) {
			for (ReputationAction action : getReputation().getUserIds().keySet()) {
				allAuthors.addAll(getReputation().getUserIds().get(action));
			}
		}

		if (comments != null) {
			for (Comment comment : comments) {
				comment.getAllAuthors(allAuthors);
			}
		}
	}

	public void normalizeUsers(Sport sport, Map<String, User> userMap, Map<String, Profile> profileMap) {
		User author = userMap.get(authorId);
		if (author != null) {
			authorReputation = author.getReputation(sport);
			// authorFrame = author.getFrame();
		}

		Profile authorProfile = profileMap.get(authorId);
		if (authorProfile != null) {
			authorFrame = authorProfile.getFlair(sport, author.getFrame());
		}

		if (comments != null) {
			for (Comment comment : comments) {
				comment.normalizeUsers(sport, userMap, profileMap);
			}
		}
	}

	public Collection<? extends String> getAuthorIds() {
		Set<String> authorIds = new HashSet<>();
		if (!StringUtils.isNullOrEmpty(authorId)) {
			authorIds.add(authorId);
		}
		for (Comment comment : getComments()) {
			authorIds.addAll(comment.getAuthorIds());
		}
		return authorIds;
	}

	public List<Comment> getComments() {
		if (comments == null) {
			comments = new ArrayList<>();
		}
		return comments;
	}

	public List<Comment> getAllComments() {
		List<Comment> allComments = new ArrayList<>();
		for (Comment comment : getComments()) {
			allComments.add(comment);
			allComments.addAll(comment.getAllComments());
		}
		return allComments;
	}

	public String getFullText() {
		String fullText = text == null ? "" : text.toLowerCase();
		fullText += author == null ? "" : " author:" + author.toLowerCase();
		for (Comment comment : getComments()) {
			fullText += " " + comment.getFullText();
		}
		return fullText;
	}

	public void updateCommentsCount() {
		totalComments = 0;
		totalHelpfulComments = 0;
		if (comments == null || comments.isEmpty()) { return; }

		for (Comment comment : comments) {
			totalComments++;
			if (comment.isHelpful()) {
				totalHelpfulComments++;
			}

			comment.updateCommentsCount();
			totalComments += comment.getTotalComments();
			totalHelpfulComments += comment.getTotalHelpfulComments();

		}
	}

	public void setHelpful(boolean helpful) {
		this.helpful = helpful;
		if (reputation == null) {
			reputation = new Reputation();
		}
		reputation.setHelpful(helpful);
	}

	public void highlightNoticeableVotes(final Sport sport, final Map<String, User> userMap,
			final Map<String, Profile> profileMap) {
		noticeableVotes = new ArrayList<>();

		List<String> upvotes = reputation.getUserIds().get(ReputationAction.Upvote);
		// log.debug("upvotes for " + text + ": " + upvotes);

		if (upvotes == null || upvotes.isEmpty()) { return; }

		// log.debug("profilemap " + profileMap);
		// Create a list with all the users who voted
		List<Voter> upvoters = new ArrayList<>();
		for (String userId : upvotes) {
			if (!userId.equals(authorId)) {
				Voter voter = new Voter();
				voter.username = userMap.get(userId).getUsername();
				voter.userId = userId;
				voter.score = buildScore(sport, voter, userMap.get(voter.userId), profileMap.get(voter.userId));
				upvoters.add(voter);
			}
		}
		// log.debug("\tupvoters " + upvoters);

		// Order the list based on rank + reputation
		Collections.sort(upvoters, new Comparator<Voter>() {
			@Override
			public int compare(Voter o1, Voter o2) {
				return (int) Math.signum(o2.score - o1.score);

			}
		});
		// log.debug("\tsorted " + upvoters);

		for (int i = 0; i < Math.min(upvoters.size(), 2); i++) {
			noticeableVotes.add(upvoters.get(i));
		}
		// log.debug("\tnoticeable " + noticeableVotes);

		if (comments != null) {
			for (Comment comment : comments) {
				comment.highlightNoticeableVotes(sport, userMap, profileMap);
			}
		}
	}

	private float buildScore(Sport sport, Voter o1, User u1, Profile p1) {
		float score = 0;

		if (p1 == null || sport == null) { return score; }

		Rank rank = p1.getProfileInfo().getSportInfo(sport.getKey().toLowerCase()).getRankings("ranked");
		if (rank != null) {
			// log.debug("Computing score for " + p1);
			o1.rank = rank.getKey();
			score += (25 - rank.getPriorityOrder()) * 20;
		}
		score += u1.getReputation(sport);
		o1.reputation = u1.getReputation(sport);

		return score;
	}

	@Data
	public static class Voter {
		String userId, username, rank;
		int reputation;
		float score;
	}
}
