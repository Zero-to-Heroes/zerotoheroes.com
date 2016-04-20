package com.coach.rankings;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Rank {

	private String key;
	// the lower the stronger
	private int priorityOrder;
}
