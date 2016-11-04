package com.coach.subscription;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.review.Review;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class SavedSearchSubscriptionService {

	@Autowired
	SavedSearchSubscriptionRepository subrepo;

	public Iterable<SavedSearchSubscription> findSearches(Review review) {
		List<SavedSearchSubscription> result = new ArrayList<>();

		List<SavedSearchSubscription> subs = subrepo.findAll();

		// log.debug("Loaded all subs: " + subs);
		for (SavedSearchSubscription sub : subs) {
			// log.debug("matches? " + sub.getCriteria().matches(review));
			if (sub.getCriteria().matches(review)) {
				result.add(sub);
			}
		}

		return result;
	}

	public void save(SavedSearchSubscription sub) {
		subrepo.save(sub);
	}

	public void delete(String subscriptionId) {
		subrepo.delete(subscriptionId);
	}

}
