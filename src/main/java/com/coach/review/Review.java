package com.coach.review;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.notifications.Notification;
import com.coach.profile.Profile;
import com.coach.reputation.Reputation;
import com.coach.review.scoring.ReviewScore;
import com.coach.subscription.HasSubscribers;
import com.coach.tag.Tag;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.github.slugify.Slugify;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@Slf4j
@Document
@EqualsAndHashCode(of = "id")
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

	@Indexed
	@CreatedDate
	private Date creationDate;

	@Indexed
	private Date lastModifiedDate;

	// The date at which the review has first been set to public
	@Indexed
	private Date publicationDate;

	private String title;

	private String text = "";

	// The sport - also includes the key as string for serialization purposes
	@Indexed
	private Sport sport;
	private String strSport;

	// The key of the associated video / file
	private String key, temporaryKey;

	// The replay file content (or key to where it is stored?) TODO: we can
	// probably remove this, it's covered by temporaryReplay and reviewType
	private String replay;

	// The type of media that is linked to the video. TODO: simplify that, both
	// server the same purpose, maybe even with reviewType
	private String fileType, mediaType;

	@Indexed
	private String reviewType;

	// Participant details
	// TODO: move everything to MetaData
	@Indexed
	private ParticipantDetails participantDetails = new ParticipantDetails();
	@Indexed
	private MetaData metaData;

	private String author, lastModifiedBy;

	@Indexed
	private String authorId;

	private String lastModifiedById;

	private int authorReputation;

	private String authorFrame;

	private List<Comment> comments;

	@Indexed
	private int totalComments, totalHelpfulComments;

	private boolean transcodingDone;

	@Indexed
	private boolean published;

	@Indexed
	private String visibility;

	private Reputation reputation;

	private int viewCount;

	private List<Tag> tags;

	private int totalInsertedComments;

	// The plugin data for this review
	private Map<String, Map<String, Map<String, String>>> plugins = new HashMap<>();

	// Users who will be notified when something is posted on this review
	private Set<String> subscribers = new HashSet<>();

	private Set<String> notifiedUsers = new HashSet<>();

	private boolean useV2comments = true;

	// The date at which the review was flagged as "case closed", or when
	// auto-closed
	private Date closedDate;

	@Indexed
	private float helpScore;
	private ReviewScore debugScore;
	private Date lastScoreUpdate;

	// =================
	// Deprecated fields (mainly legacy from the video time)
	// =================
	@Deprecated
	private String description = "";
	@Deprecated
	private String language = "en";
	@Deprecated
	private String thumbnail;
	@Deprecated
	private int beginning, ending;
	@Deprecated
	private float videoFramerateRatio;
	@Deprecated
	private Map<String, String> reviewVideoMap = new HashMap<>();
	@Deprecated
	private Map<String, String> canvas = new HashMap<>();
	@Deprecated
	private int canvasId;

	// =================
	// Data that is for internal processing only, not seen by the UI
	// =================
	// Search-specific stuff
	@JsonIgnore
	@TextIndexed
	private String fullTextSearchField = "";

	@Indexed
	@JsonIgnore
	private List<Tag> allTags = new ArrayList<>();

	// A way to allow anonymous uploads
	@JsonIgnore
	@Indexed
	private String uploaderApplicationKey, uploaderToken;

	@Indexed
	@JsonIgnore
	private Set<String> allAuthors = new HashSet<>(), allAuthorIds = new HashSet<>();

	@Indexed
	@JsonIgnore
	private int authorCount = 0;

	// Don't send the info to the UI, it doesn't need it
	@JsonIgnore
	private String temporaryReplay;

	@JsonIgnore
	private Map<String, Date> visitDates = new HashMap<>();

	// Used to flag games that are corrupt
	@JsonIgnore
	private boolean invalidGame;

	// The last time we tried to parse the review for meta data
	@JsonIgnore
	private Date lastMetaDataParsingDate;

	// =================
	// Transient fields, that are simply used to send data to the UI
	// =================
	@Transient
	private boolean claimableAccount;

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
		lastModifiedDate = creationDate;
		// setSortingDate(this.creationDate);
	}

	public void setLastModifiedDate(Date modifiedDate) {
		lastModifiedDate = modifiedDate;
		// setSortingDate(lastModifiedDate);
	}

	public void setLanguage(String code) {
		if (code != null && !code.isEmpty()) {
			language = code;
		}
		else {
			language = "en";
		}
	}

	@JsonIgnore
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
				// if (o1.getReputation().getScore() !=
				// o2.getReputation().getScore()) {
				// return (int) (1000 * (o2.getReputation().getScore() -
				// o1.getReputation().getScore()));
				// }
				// else
				if (o2.getCreationDate() == null) {
					return -1;
				}
				else {
					return -o2.getCreationDate().compareTo(o1.getCreationDate());
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
		sortComments();

		claimableAccount = isReallyClaimable();
	}

	public boolean isReallyClaimable() {
		return StringUtils.isNullOrEmpty(authorId) && !StringUtils.isNullOrEmpty(uploaderApplicationKey)
				&& !StringUtils.isNullOrEmpty(uploaderToken) && !"overwolf".equals(uploaderApplicationKey);
	}

	// We want to use isReallyClaimable instead
	@SuppressWarnings("unused")
	private boolean isClaimableAccount() {
		return claimableAccount;
	}

	public void registerVisit(String userId) {
		if (userId != null) {
			visitDates.put(userId, new Date());
		}
	}

	public void incrementViewCount() {
		viewCount++;
	}

	public void buildAllAuthors() {
		allAuthors = new HashSet<>();
		allAuthorIds = new HashSet<>();
		if (!StringUtils.isNullOrEmpty(author)) {
			allAuthors.add(author);
		}
		if (!StringUtils.isNullOrEmpty(authorId)) {
			allAuthorIds.add(authorId);
		}

		if (comments != null) {
			for (Comment comment : comments) {
				comment.addAllAuthors(allAuthors, allAuthorIds);
			}
		}

		authorCount = allAuthors.size();
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

	@JsonIgnore
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
			fullTextSearchField += " player:" + participantDetails.getPlayerName();
			fullTextSearchField += " " + participantDetails.getPlayerCategory();
			fullTextSearchField += " player:" + participantDetails.getOpponentName();
			fullTextSearchField += " " + participantDetails.getOpponentName();

			if (participantDetails.getSkillLevel() != null) {
				for (Tag tag : participantDetails.getSkillLevel()) {
					fullTextSearchField += " " + tag.getText();
				}
			}
		}

		List<Comment> comments2 = getComments();
		for (Comment comment : comments2) {
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

	public void setVisibility(String visibility) {
		if ("public".equals(visibility) && publicationDate == null) {
			publicationDate = new Date();
		}

		if (StringUtils.isNullOrEmpty(visibility)) {
			this.visibility = "restricted";
		}
		else {
			this.visibility = visibility;
		}
	}

	public String buildKey(String name, String type) {
		Calendar calendar = Calendar.getInstance();
		String prefix = "";
		if (!StringUtils.isNullOrEmpty(type)) {
			prefix = type + "/";
		}
		String newKey = prefix + calendar.get(Calendar.YEAR) + "/" + (calendar.get(Calendar.MONTH) + 1) + "/"
				+ calendar.get(Calendar.DATE) + "/" + name;
		return newKey;
	}

	public void highlightUnreadNotifs(List<Notification> unreadNotifs) {
		for (Comment comment : getComments()) {
			comment.highlightUnreadNotifs(unreadNotifs);
		}
	}

	public void deleteComment(int commentId) {
		log.debug("Befpre removal: " + getAllComments().size());
		Comment comment = getComment(commentId);
		if (comment == null) { return; }

		if (!CollectionUtils.isEmpty(comment.getComments())) {
			comment.setText("[deleted]");
		}
		else {
			boolean removed = comments.remove(comment);
			for (int i = 0; i < getComments().size() && !removed; i++) {
				removed = getComments().get(i).removeComment(commentId);
			}
			log.debug("Remvoed comment? " + removed);
			log.debug("After: " + getAllComments().size());
		}
	}

	public void addNotifiedUsers(Set<String> newNotifiedUsers) {
		notifiedUsers.addAll(newNotifiedUsers);
	}

	@Override
	public String toString() {
		return "Review [id=" + id + ", title=" + title
				+ "\n, author=" + author + ", authorId=" + authorId
				+ "\n, uploaderApplicationKey=" + uploaderApplicationKey + ", uploaderToken=" + uploaderToken
				+ "\n, key=" + key + ", temporaryKey=" + temporaryKey + ", replay=" + replay
				+ "\n, temporaryReplay=" + !StringUtils.isNullOrEmpty(temporaryReplay)
				+ "\n, fileType=" + fileType + ", mediaType=" + mediaType + ", reviewType=" + reviewType
				+ "\n, participantDetails=" + participantDetails + ", metaData=" + metaData
				+ "\n, transcodingDone=" + transcodingDone
				+ "\n, published=" + published + ", visibility=" + visibility + ", closedDate=" + closedDate
				+ ", helpScore=" + helpScore + ", debugScore=" + debugScore
				+ ", invalidGame=" + invalidGame + ", lastMetaDataParsingDate="
				+ lastMetaDataParsingDate + ", claimableAccount=" + claimableAccount + "]";
	}


}
