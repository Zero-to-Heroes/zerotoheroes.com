package com.coach.rankings;

import java.util.HashMap;
import java.util.Map;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class Rankings {

	// Map of sport / Map for sport internal
	private Map<String, Map<String, Rank>> rankings = new HashMap<>();
}
