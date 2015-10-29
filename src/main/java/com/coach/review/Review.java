package com.coach.review;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.reputation.Reputation;
import com.coach.subscription.HasSubscribers;
import com.coach.tag.Tag;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = { "comments", "canvas" })
@JsonIgnoreProperties(ignoreUnknown = true)
public class Review implements HasText, HasReputation, HasSubscribers {

	@JsonFormat(shape = JsonFormat.Shape.OBJECT)
	@AllArgsConstructor
	public enum Sport {
		Badminton("Badminton", "Badminton"), Squash("Squash", "Squash"), LeagueOfLegends("LeagueOfLegends",
				"League of Legends"), HearthStone("HearthStone", "HearthStone"), HeroesOfTheStorm("HeroesOfTheStorm",
				"Heroes of the Storm"), Meta("Meta", "Meta"), Other("Other", "Other");

		@Getter
		private String key, value;
	}

	@Id
	private String id;
	@CreatedDate
	private Date creationDate;
	private Date lastModifiedDate;
	private Date sortingDate;
	// The key of the associated video / file
	private String key, temporaryKey;
	private String thumbnail;
	private String fileType;
	private Sport sport;
	private String title;
	private String description = "", text = "";
	private String author, lastModifiedBy;
	private String authorId, lastModifiedById;
	private int authorReputation;
	private int beginning, ending;
	private List<Comment> comments;
	private boolean transcodingDone;
	private float videoFramerateRatio;
	private Map<String, String> reviewVideoMap = new HashMap<>();
	private Reputation reputation;
	private int viewCount;
	private List<Tag> tags;
	private Map<String, String> canvas = new HashMap<>();

	private int totalInsertedComments;
	private int canvasId;

	// Users who will be notified when something is posted on this review
	private Set<String> subscribers = new HashSet<>();

	public void addComment(Comment comment) {
		if (comments == null) comments = new ArrayList<>();
		comment.setId(String.valueOf(++totalInsertedComments));
		comments.add(comment);
		sortComments();
	}

	@Override
	public Reputation getReputation() {
		if (reputation == null) {
			reputation = new Reputation();
		}
		return reputation;
	}

	public void addComment(Comment comment, Comment reply) {
		reply.setId(String.valueOf(++totalInsertedComments));
		comment.addComment(reply);
	}

	public void setSport(Sport sport) {
		this.sport = sport; // StringUtils.trim(sport);
	}

	public void setCreationDate(Date creationDate) {
		this.creationDate = creationDate;
		setSortingDate(this.creationDate);
	}

	public void setLastModifiedDate(Date modifiedDate) {
		lastModifiedDate = modifiedDate;
		setSortingDate(lastModifiedDate);
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

	public void sortComments() {
		// For now, simply sort them by date
		if (comments == null) return;

		Collections.sort(comments, new Comparator<Comment>() {
			@Override
			public int compare(Comment o1, Comment o2) {
				if (o1.getReputation().getScore() != o2.getReputation().getScore()) {
					return o2.getReputation().getScore() - o1.getReputation().getScore();
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

	public void addExternalLink(String reviewId, String videoKey) {
		if (reviewVideoMap == null) reviewVideoMap = new HashMap<>();

		reviewVideoMap.put(reviewId, videoKey);
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

	public void incrementViewCount() {
		viewCount++;
	}

	public List<String> getAllAuthors() {
		List<String> allAuthors = new ArrayList<>();
		if (!StringUtils.isNullOrEmpty(authorId)) allAuthors.add(authorId);

		if (comments != null) {
			for (Comment comment : comments) {
				comment.getAllAuthors(allAuthors);
			}
		}

		return allAuthors;
	}

	public void normalizeUsers(Map<String, User> userMap) {
		User author = userMap.get(authorId);
		if (author != null) {
			authorReputation = author.getReputation(sport);
		}

		if (comments != null) {
			for (Comment comment : comments) {
				comment.normalizeUsers(sport, userMap);
			}
		}
	}

	public void addCanvas(String key, String newCanvas) {
		if (canvas == null) canvas = new HashMap<>();
		canvas.put(key, newCanvas);
		canvasId++;
	}

	public void removeCanvas(String canvasKey) {
		if (canvas == null) canvas = new HashMap<>();
		canvas.remove(canvasKey);
	}

	@Override
	public String getText() {
		text = description;
		return text;
	}

	@Override
	public void setText(String newText) {
		description = newText;
		text = newText;
	}

	private String getDescription() {
		return description;
	}

	private void setDescription(String description) {
		this.description = description;
	}

	public void resetCanvas() {
		canvas = new HashMap<>();
	}

	public Set<String> getSubscribers() {
		if (subscribers == null) {
			subscribers = new HashSet<>();
			addSubscriber(authorId);
			for (Comment comment : getComments()) {
				subscribers.addAll(comment.getAuthorIds());
			}
		}
		return subscribers;
	}

	public List<Comment> getComments() {
		if (comments == null) comments = new ArrayList<>();
		return comments;
	}

	@Override
	public void addSubscriber(String subscriberId) {
		if (!StringUtils.isNullOrEmpty(subscriberId)) getSubscribers().add(subscriberId);
	}

	@Override
	public void removeSubscriber(String subscriberId) {
		if (!StringUtils.isNullOrEmpty(subscriberId)) getSubscribers().remove(subscriberId);
	}

	public String getUrl() {
		return "http://www.zerotoheroes.com/r/" + getSport().getKey() + "/" + getId() + "/" + getTitle();
	}

}
