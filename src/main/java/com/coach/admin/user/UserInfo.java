package com.coach.admin.user;

import java.util.HashSet;
import java.util.Set;

import org.joda.time.DateTime;

import com.coach.review.Review;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class UserInfo {

	private String name, email;
	private DateTime lastParticipationDate, registrationDate;
	private int reputation;
	private int numberOfReviews, numberOfComments;

	private Set<String> reviews = new HashSet<>();
	private Set<String> comments = new HashSet<>();

	public void addReview(Review review) {
		if (lastParticipationDate == null || lastParticipationDate.isBefore(new DateTime(review.getCreationDate()))) {
			lastParticipationDate = new DateTime(review.getCreationDate());
		}

		numberOfReviews++;
		reviews.add(review.getUrl());
	}

	public void addComment(Review review) {
		if (lastParticipationDate == null || lastParticipationDate.isBefore(new DateTime(review.getCreationDate()))) {
			lastParticipationDate = new DateTime(review.getCreationDate());
		}

		numberOfComments++;
		comments.add(review.getUrl());
	}
}
