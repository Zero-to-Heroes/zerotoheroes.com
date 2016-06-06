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
	private String sort;
	private ParticipantDetails participantDetails;
	private Integer minComments, maxComments;
	private String visibility;

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

	public boolean matches(Review review) {
		boolean matches = true;

		matches &= sport == null || sport.equalsIgnoreCase(review.getSport().getKey());
		matches &= title == null || review.getFullTextSearchField().contains(title);
		matches &= reviewType == null || reviewType.equalsIgnoreCase(review.getReviewType());

		if (wantedTags != null && !wantedTags.isEmpty()) {
			for (Tag tag : wantedTags) {
				matches &= review.getTags() != null && review.getTags().contains(tag);
			}
		}
		if (unwantedTags != null && !unwantedTags.isEmpty()) {
			for (Tag tag : unwantedTags) {
				matches &= review.getTags() == null || !review.getTags().contains(tag);
			}
		}

		matches &= onlyHelpful == null || !onlyHelpful || review.getTotalHelpfulComments() > 0;
		matches &= noHelpful == null || !noHelpful || review.getTotalHelpfulComments() == 0;

		if (participantDetails != null) {
			matches &= participantDetails.getPlayerCategory() == null
					|| participantDetails.getPlayerCategory().equals(review.getParticipantDetails().getPlayerCategory())
					|| participantDetails.getPlayerCategory()
							.equals(review.getParticipantDetails().getOpponentCategory());
			matches &= participantDetails.getOpponentCategory() == null
					|| participantDetails.getOpponentCategory()
							.equals(review.getParticipantDetails().getPlayerCategory())
					|| participantDetails.getOpponentCategory()
							.equals(review.getParticipantDetails().getOpponentCategory());
			matches &= participantDetails.getSkillLevel() == null || participantDetails.getSkillLevel().isEmpty()
					|| review.getParticipantDetails().getSkillLevel() != null && review.getParticipantDetails()
							.getSkillLevel().contains(participantDetails.getSkillLevel().get(0));
		}

		return matches;
	}
}
