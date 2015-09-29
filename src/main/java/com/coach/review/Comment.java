package com.coach.review;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import com.coach.reputation.Reputation;

@Getter
@Setter
@ToString
public class Comment {

	private String id;
	private String author, authorId, text;
	private Date creationDate;
	private List<Comment> comments;
	private Reputation reputation;

	public Reputation getReputation() {
		if (reputation == null) {
			reputation = new Reputation();
		}
		return reputation;
	}

	public void addComment(Comment reply) {
		if (comments == null) comments = new ArrayList<>();
		comments.add(reply);
		sortComments();
	}

	public void sortComments() {
		// For now, simply sort them by date
		if (comments == null) return;

		Collections.sort(comments, new Comparator<Comment>() {
			@Override
			public int compare(Comment o1, Comment o2) {
				if (o2.getCreationDate() == null) return 1;
				return o2.getCreationDate().compareTo(o1.getCreationDate());
			}
		});
	}

	public Comment getComment(int commentId) {
		if (comments == null) return null;

		for (Comment comment : comments) {
			if (comment.getId() != null && comment.getId().equals(String.valueOf(commentId))) { return comment; }
			Comment found = comment.getComment(commentId);
			if (found != null) return found;

		}
		return null;
	}
}
