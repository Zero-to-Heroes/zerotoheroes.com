package com.coach.sport;

import com.coach.activities.Activity;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@ToString
public class Sport {

	private static final int MAX_ACTIVITIES_IN_MEMORY = 15;

	private String id;

	private Set<String> subscribers = new HashSet<>();
	private Set<String> plugins = new HashSet<>();
	private List<Activity> activities = new ArrayList<>();

	public Set<String> getSubscribers() {
		if (subscribers == null) {
			subscribers = new HashSet<>();
		}
		return subscribers;
	}

//	@Override
//	public void addSubscriber(String subscriberId) {
//		if (StringUtils.isNullOrEmpty(subscriberId)) { return; }
//		getSubscribers().add(subscriberId);
//	}

//	@Override
	public String getTitle() {
		return id;
	}

//	@Override
//	public void removeSubscriber(String subscriberId) {
//		if (StringUtils.isNullOrEmpty(subscriberId)) { return; }
//		getSubscribers().remove(subscriberId);
//	}

	// public void addActivity(Activity activity) {
	// while (activities.size() > MAX_ACTIVITIES_IN_MEMORY - 1) {
	// activities.remove(MAX_ACTIVITIES_IN_MEMORY - 1);
	// }
	// activities.add(activity);
	// Collections.sort(activities, new Comparator<Activity>() {
	// @Override
	// public int compare(Activity o1, Activity o2) {
	// return o2.getDate().compareTo(o1.getDate());
	// }
	// });
	// }

	// public List<Activity> getLatestActivities(int howMany) {
	// List<Activity> result = new ArrayList<>();
	// for (int i = 0; i < howMany; i++) {
	// if (activities.size() > i) {
	// result.add(activities.get(i));
	// }
	// }
	// return result;
	// }
}
