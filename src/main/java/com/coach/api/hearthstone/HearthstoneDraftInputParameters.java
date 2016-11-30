package com.coach.api.hearthstone;

import lombok.Data;

@Data
public class HearthstoneDraftInputParameters {

	private String cardId;
	private int currentPickNumber = 1;
}
