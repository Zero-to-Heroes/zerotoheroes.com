package com.coach.review;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

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
	private Date creationDate;
	// The key of the associated video / file
	private String key, temporaryKey;
	private String fileType;
	private String sport;
	private String title, description;
	private String author;
	private int beginning, ending;
	private List<Comment> comments;
	private double treatmentCompletion;

	public void addComment(Comment comment) {
		if (comments == null) comments = new ArrayList<>();
		comments.add(comment);
	}

	public void setSport(String sport) {
		this.sport = StringUtils.trim(sport);
	}
}
