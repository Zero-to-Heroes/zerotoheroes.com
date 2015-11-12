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

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import org.springframework.data.annotation.Transient;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.reputation.Reputation;
import com.coach.review.Review.Sport;

@Getter
@Setter
@ToString(exclude = { "comments", "tempCanvas" })
public class Comment implements HasText, HasReputation {

	private String id;
	private String author, authorId, text;
	private int authorReputation;
	private String authorFrame;
	private Date creationDate;
	private boolean helpful;
	private List<Comment> comments;
	private Reputation reputation;

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
		if (comments == null)
			comments = new ArrayList<>();
		comments.add(reply);
		sortComments();
	}

	public void sortComments() {
		// For now, simply sort them by date
		if (comments == null)
			return;

		Collections.sort(comments, new Comparator<Comment>() {
			@Override
			public int compare(Comment o1, Comment o2) {
				if (o1.getReputation().getScore() != o2.getReputation()
						.getScore()) {
					return (int) (1000 * (o2.getReputation().getScore() - o1
							.getReputation().getScore()));
				} else if (o2.getCreationDate() == null) {
					return 1;
				} else {
					return o2.getCreationDate().compareTo(o1.getCreationDate());
				}
			}
		});

		for (Comment comment : comments) {
			comment.sortComments();
		}
	}

	public Comment getComment(int commentId) {
		if (comments == null)
			return null;

		for (Comment comment : comments) {
			if (comment.getId() != null
					&& comment.getId().equals(String.valueOf(commentId))) {
				return comment;
			}
			Comment found = comment.getComment(commentId);
			if (found != null)
				return found;

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

	public void getAllAuthors(List<String> allAuthors) {
		if (!StringUtils.isNullOrEmpty(authorId)
				&& !allAuthors.contains(authorId)) {
			allAuthors.add(authorId);
		}

		if (comments != null) {
			for (Comment comment : comments) {
				comment.getAllAuthors(allAuthors);
			}
		}
	}

	public void normalizeUsers(Sport sport, Map<String, User> userMap) {
		User author = userMap.get(authorId);
		if (author != null) {
			authorReputation = author.getReputation(sport);
			authorFrame = author.getFrame();
		}

		if (comments != null) {
			for (Comment comment : comments) {
				comment.normalizeUsers(sport, userMap);
			}
		}
	}

	public Collection<? extends String> getAuthorIds() {
		Set<String> authorIds = new HashSet<>();
		if (!StringUtils.isNullOrEmpty(authorId))
			authorIds.add(authorId);
		for (Comment comment : getComments()) {
			authorIds.addAll(comment.getAuthorIds());
		}
		return authorIds;
	}

	public List<Comment> getComments() {
		if (comments == null)
			comments = new ArrayList<>();
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
		String fullText = text;
		for (Comment comment : getComments()) {
			fullText += " " + comment.getFullText();
		}
		return fullText;
	}
}
