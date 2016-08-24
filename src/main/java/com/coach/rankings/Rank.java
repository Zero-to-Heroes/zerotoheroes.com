package com.coach.rankings;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Rank {

	private static final String RANK_REGEX = "\\D*(\\d+).*";

	private String key;
	// the lower the stronger
	private int priorityOrder;

	public void setKey(String key) {
		this.key = key;
		if (key != null) {
			Pattern pattern = Pattern.compile(RANK_REGEX);
			Matcher matcher = pattern.matcher(key);
			if (matcher.matches()) {
				priorityOrder = Integer.parseInt(matcher.group(1));
			}
			else {
				priorityOrder = -1;
			}
		}
		else {
			priorityOrder = 50;
		}
	}
}
