package com.coach.sport;

import java.util.HashSet;
import java.util.Set;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import com.amazonaws.util.StringUtils;
import com.coach.subscription.HasSubscribers;

@Getter
@Setter
@ToString
public class Sport implements HasSubscribers {

	private String id;

	private Set<String> subscribers = new HashSet<>();
	private Set<String> plugins = new HashSet<>();

	public Set<String> getSubscribers() {
		if (subscribers == null) subscribers = new HashSet<>();
		return subscribers;
	}

	@Override
	public void addSubscriber(String subscriberId) {
		if (StringUtils.isNullOrEmpty(subscriberId)) return;
		getSubscribers().add(subscriberId);
	}

	@Override
	public String getTitle() {
		return id;
	}

	@Override
	public void removeSubscriber(String subscriberId) {
		if (StringUtils.isNullOrEmpty(subscriberId)) return;
		getSubscribers().remove(subscriberId);
	}
}
