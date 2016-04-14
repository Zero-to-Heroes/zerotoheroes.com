package com.coach.subscription;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class Subscriptions {

	private List<SavedSearchSubscription> subscriptions = new ArrayList<>();

	public void addSubscription(SavedSearchSubscription sub) {
		subscriptions.add(sub);
	}

}
