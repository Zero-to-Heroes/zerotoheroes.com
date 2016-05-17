package com.coach.review;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.profile.Profile;
import com.coach.reputation.Reputation;
import com.coach.subscription.HasSubscribers;
import com.coach.tag.Tag;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.github.slugify.Slugify;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;

@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = { "comments", "canvas" })
@JsonIgnoreProperties(ignoreUnknown = true)
@Slf4j
public class Review implements HasText, HasReputation, HasSubscribers {

	@JsonFormat(shape = JsonFormat.Shape.OBJECT)
	@AllArgsConstructor
	public enum Sport {
		Badminton("Badminton", "Badminton"), Squash("Squash", "Squash"), LeagueOfLegends("LeagueOfLegends",
				"League of Legends"), HearthStone("HearthStone", "HearthStone"), HeroesOfTheStorm("HeroesOfTheStorm",
						"Heroes of the Storm"), Meta("Meta",
								"Meta"), Duelyst("Duelyst", "Duelyst"), Other("Other", "Other");

		@Getter
		private String key, value;

		public static Sport load(String sport) {
			for (Sport temp : Review.Sport.values()) {
				if (temp.getKey().equalsIgnoreCase(sport)) { return temp; }
			}
			return null;
		}
	}

	@Id
	private String id;
	// Various dates for review lifecycle
	@CreatedDate
	private Date creationDate;
	private Date lastModifiedDate;
	private Date sortingDate;
	// Main information
	private String title;
	private String description = "", text = "";
	// The sport - also includes the key as string for serialization purposes
	// TOOD: not clean
	private Sport sport;
	private String strSport;
	// The key of the associated video / file
	private String key, temporaryKey;
	// The replay file content (or key to where it is stored?)
	private String replay;
	// The image to display (if any)
	private String thumbnail;
	// The type of media that is linked to the video
	private String fileType, mediaType, reviewType;
	private String language = "en";
	// Participant details
	private ParticipantDetails participantDetails = new ParticipantDetails();
	private String author, lastModifiedBy;
	private String authorId, lastModifiedById;
	private int authorReputation;
	private String authorFrame;
	private int beginning, ending;
	private List<Comment> comments;
	private int totalComments, totalHelpfulComments;
	private boolean transcodingDone;
	@Indexed
	private boolean published;
	private float videoFramerateRatio;
	private Map<String, String> reviewVideoMap = new HashMap<>();
	private Reputation reputation;
	private int viewCount;
	private List<Tag> tags;
	private Map<String, String> canvas = new HashMap<>();

	// Search-specific stuff
	@JsonIgnore
	@TextIndexed
	private String fullTextSearchField;
	@JsonIgnore
	private List<Tag> allTags = new ArrayList<>();

	private int totalInsertedComments;
	private int canvasId;

	// The plugin data for this review
	private Map<String, Map<String, Map<String, String>>> plugins = new HashMap<>();

	// Users who will be notified when something is posted on this review
	private Set<String> subscribers = new HashSet<>();

	public void addComment(Comment comment) {
		if (comments == null) {
			comments = new ArrayList<>();
		}
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
		strSport = sport == null ? null : sport.getKey().toLowerCase();
	}

	public void setCreationDate(Date creationDate) {
		this.creationDate = creationDate;
		setSortingDate(this.creationDate);
	}

	public void setLastModifiedDate(Date modifiedDate) {
		lastModifiedDate = modifiedDate;
		setSortingDate(lastModifiedDate);
	}

	public void setLanguage(String code) {
		if (code != null && !code.isEmpty()) {
			language = code;
		}
		else {
			language = "en";
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

	public void addExternalLink(String reviewId, String videoKey) {
		if (reviewVideoMap == null) {
			reviewVideoMap = new HashMap<>();
		}

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

	public Set<String> getAllAuthors() {
		Set<String> allAuthors = new HashSet<>();
		if (!StringUtils.isNullOrEmpty(authorId)) {
			allAuthors.add(authorId);
		}

		if (comments != null) {
			for (Comment comment : comments) {
				comment.getAllAuthors(allAuthors);
			}
		}

		return allAuthors;
	}

	public void normalizeUsers(Map<String, User> userMap, Map<String, Profile> profileMap) {
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

	public void addCanvas(String key, String newCanvas) {
		if (canvas == null) {
			canvas = new HashMap<>();
		}
		canvas.put(key, newCanvas);
		canvasId++;
	}

	public void removeCanvas(String canvasKey) {
		if (canvas == null) {
			canvas = new HashMap<>();
		}
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

	@Override
	public void addSubscriber(String subscriberId) {
		if (!StringUtils.isNullOrEmpty(subscriberId)) {
			getSubscribers().add(subscriberId);
		}
	}

	@Override
	public void removeSubscriber(String subscriberId) {
		if (!StringUtils.isNullOrEmpty(subscriberId)) {
			getSubscribers().remove(subscriberId);
		}
	}

	public String getUrl() {
		return "http://www.zerotoheroes.com/r/" + getSport().getKey().toLowerCase() + "/" + getId() + "/"
				+ getSlugifiedTitle();
	}

	public String getSlugifiedTitle() {
		try {
			return new Slugify().slugify(getTitle());
		}
		catch (IOException e) {
			log.warn("Couldn't slugify title " + getTitle() + ", " + title, e);
			return getTitle();
		}
	}

	public Map<String, String> getPluginData(String sport, String plugin) {
		Map<String, Map<String, String>> pluginsForSport = plugins.get(sport);
		if (pluginsForSport == null) {
			pluginsForSport = new HashMap<>();
			plugins.put(sport, pluginsForSport);
		}

		Map<String, String> pluginData = pluginsForSport.get(plugin);
		if (pluginData == null) {
			pluginData = new HashMap<>();
			pluginsForSport.put(plugin, pluginData);
		}

		return pluginData;
	}

	public void updateFullTextSearch() {
		fullTextSearchField = title == null ? "" : title.toLowerCase() + " ";
		fullTextSearchField += description == null ? "" : " " + description.toLowerCase();
		fullTextSearchField += author == null ? "" : " author:" + author.toLowerCase();
		if (participantDetails != null) {
			fullTextSearchField += " " + participantDetails.getPlayerName();
			fullTextSearchField += " " + participantDetails.getPlayerCategory();
			fullTextSearchField += " " + participantDetails.getOpponentName();
			fullTextSearchField += " " + participantDetails.getOpponentName();

			if (participantDetails.getSkillLevel() != null) {
				for (Tag tag : participantDetails.getSkillLevel()) {
					fullTextSearchField += " " + tag.getText();
				}
			}
		}

		for (Comment comment : getComments()) {
			fullTextSearchField += " " + comment.getFullText();
		}

		// And update the tags for proper search
		allTags = new ArrayList<>();
		if (tags != null) {
			allTags.addAll(tags);
		}
		if (participantDetails != null) {
			allTags.addAll(participantDetails.getSkillLevel());
		}

	}

	public boolean isSequence() {
		if (tags == null || tags.isEmpty()) { return false; }

		for (Tag tag : tags) {
			if (tag.getText().equals("Sequence")) { return true; }
		}

		return false;
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

	public Sport getSport() {
		if (sport == null) {
			sport = Review.Sport.load(strSport);
		}
		return sport;
	}

	public void highlightNoticeableVotes(Map<String, User> userMap, Map<String, Profile> profileMap) {
		for (Comment comment : getComments()) {
			comment.highlightNoticeableVotes(sport, userMap, profileMap);
		}
	}
}
