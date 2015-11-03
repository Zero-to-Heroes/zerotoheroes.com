package com.coach.review;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import com.coach.tag.Tag;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class ReviewSearchCriteria {
	private String sport;
	private Integer pageNumber;
	private String title;
	private List<Tag> wantedTags;
	private List<Tag> unwantedTags;

	public List<Tag> getWantedTags() {
		return wantedTags == null ? new ArrayList<Tag>() : wantedTags;
	}

	public List<Tag> getUnwantedTags() {
		return unwantedTags == null ? new ArrayList<Tag>() : unwantedTags;
	}
}
