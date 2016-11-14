package com.coach.api;

import lombok.Data;

@Data
public class HearthstoneDraftInputParameters {

	private String cardId;
	private int currentPickNumber = 1;
}
