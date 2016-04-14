package com.coach.subscription;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ListSubscriptionsResponse {

	private List<SavedSearchSubscription> subscriptions = new ArrayList<>();
}
