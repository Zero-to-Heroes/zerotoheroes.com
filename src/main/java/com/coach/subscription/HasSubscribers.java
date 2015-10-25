package com.coach.subscription;

public interface HasSubscribers {

	void addSubscriber(String id);

	String getTitle();

	void removeSubscriber(String subscriberId);

}
