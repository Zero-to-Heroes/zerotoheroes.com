package com.coach.subscription;

import org.springframework.data.annotation.Id;

import com.coach.review.ReviewSearchCriteria;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class SavedSearchSubscription {

	@Id
	private String id;
	private String userId;
	private ReviewSearchCriteria criteria;
	private String name;
}
