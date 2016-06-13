package com.coach.review.replay.hearthstone;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ReplayFilesRequest {

	private String sport;
	private List<String> keys = new ArrayList<>();
	private List<String> fileTypes = new ArrayList<>();

}
