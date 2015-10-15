package com.coach.review;

import com.coach.reputation.Reputation;

public interface HasReputation {

	void setAuthor(String author);

	void setAuthorId(String authorId);

	Reputation getReputation();

	String getAuthorId();

	void setAuthorReputation(int i);

}
