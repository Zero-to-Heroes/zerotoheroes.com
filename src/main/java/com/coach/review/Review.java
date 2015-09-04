package com.coach.review;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;

import com.amazonaws.util.StringUtils;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = "comments")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Review {

	@Id
	private String id;
	@CreatedDate
	private Date creationDate;
	private Date lastModifiedDate;
	private Date sortingDate;
	// The key of the associated video / file
	private String key, temporaryKey;
	private String fileType;
	private String sport;
	private String title, description;
	private String author;
	private int beginning, ending;
	private List<Comment> comments;
	private double treatmentCompletion;
	private boolean transcodingDone;

	private int totalInsertedComments;

	public void addComment(Comment comment) {
		if (comments == null) comments = new ArrayList<>();
		comment.setId(String.valueOf(++totalInsertedComments));
		comments.add(comment);
	}

	public void setSport(String sport) {
		this.sport = StringUtils.trim(sport);
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
}
