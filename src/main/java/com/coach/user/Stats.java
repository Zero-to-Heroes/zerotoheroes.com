package com.coach.user;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Stats {

	private int numberOfTimestamps;

	public void incrementTimestamps() {
		numberOfTimestamps++;
	}
}
