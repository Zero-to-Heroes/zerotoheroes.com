package com.coach.review;

import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.coach.reputation.Reputation;
import com.coach.review.Review.Sport;
import com.coach.tag.Tag;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ListReviewResponse {

	private int totalPages;
	private long queryDuration;

	private List<ResponseReview> reviews;

	public ListReviewResponse(List<Review> reviews) {
		super();
		if (reviews != null) {
			this.reviews = reviews.stream().map(r -> ResponseReview.from(r)).collect(Collectors.toList());
		}
	}

	@Data
	public static class ResponseReview {

		private String id;
		private Date creationDate, lastModifiedDate;
		private String title;
		private Sport sport;
		private ParticipantDetails participantDetails;
		private MetaData metaData;
		private String author;
		private int totalComments, totalHelpfulComments;
		private Reputation reputation;
		private int viewCount;
		private List<Tag> tags;
		private String visibility;
		// Needed to display either the "draft" or the "game" participants
		private String mediaType;
		private Set<String> allAuthors;

		public static ResponseReview from(Review review) {
			if (review == null) { return null; }

			// Would love to use MapStructs, but it's a pain to make it work
			// with Lombok
			ResponseReview result = new ResponseReview();
			result.id = review.getId();
			result.creationDate = review.getCreationDate();
			result.lastModifiedDate = review.getLastModifiedDate();
			result.title = review.getTitle();
			result.participantDetails = review.getParticipantDetails();
			result.metaData = review.getMetaData();
			result.author = review.getAuthor();
			result.totalComments = review.getTotalComments();
			result.totalHelpfulComments = review.getTotalHelpfulComments();
			result.reputation = review.getReputation();
			result.viewCount = review.getViewCount();
			result.tags = review.getTags();
			result.sport = review.getSport();
			result.visibility = review.getVisibility();
			result.mediaType = review.getMediaType();
			result.allAuthors = review.getAllAuthors();
			return result;
		}
	}
}
