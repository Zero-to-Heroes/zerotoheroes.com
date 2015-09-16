package com.coach.review;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "comments")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Review {

	@JsonFormat(shape = JsonFormat.Shape.OBJECT)
	public enum Sport {
		Badminton("Badminton"), Squash("Squash"), LeagueOfLegends("League of Legends"), HearthStone("HearthStone"), HeroesOfTheStorm(
				"Heroes of the Storm");

		@Getter
		private String value;

		private Sport(String value) {
			this.value = value;
		}
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
	private String title, description;
	private String author, lastModifiedBy;
	private int beginning, ending;
	private List<Comment> comments;
	// private double treatmentCompletion;
	private boolean transcodingDone;
	private float videoFramerateRatio;

	private int totalInsertedComments;

	public void addComment(Comment comment) {
		if (comments == null) comments = new ArrayList<>();
		comment.setId(String.valueOf(++totalInsertedComments));
		comments.add(comment);
		sortComments();
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
		}
		return null;
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
}
