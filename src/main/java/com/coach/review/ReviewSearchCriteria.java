package com.coach.review;

import java.util.ArrayList;
import java.util.List;

import com.coach.tag.Tag;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Slf4j
public class ReviewSearchCriteria {
	private String sport;
	private Integer pageNumber;
	private String title;
	private String reviewType;
	private List<Tag> wantedTags;
	private List<Tag> unwantedTags;
	private Boolean ownVideos;
	private Boolean onlyHelpful, noHelpful;
	private ParticipantDetails participantDetails;

	public List<Tag> getWantedTags() {
		return wantedTags == null ? new ArrayList<Tag>() : wantedTags;
	}

	public List<Tag> getUnwantedTags() {
		return unwantedTags == null ? new ArrayList<Tag>() : unwantedTags;
	}

	public String getText() {
		if (title == null || title.isEmpty()) { return null; }

		String text = "";
		for (String word : title.split(" ")) {
			text += "\"" + word + "\" ";
		}
		return text;
	}

	public ParticipantDetails getParticipantDetails() {
		if (participantDetails == null) {
			participantDetails = new ParticipantDetails();
		}
		return participantDetails;
	}
}
