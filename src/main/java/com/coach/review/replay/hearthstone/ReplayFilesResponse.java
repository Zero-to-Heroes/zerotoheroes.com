package com.coach.review.replay.hearthstone;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReplayFilesResponse {

	private List<Replay> replays = new ArrayList<>();

}
