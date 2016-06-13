package com.coach.review.replay.hearthstone;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;

import com.coach.review.Review;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReplayProcessTracker {

	@Id
	private String id;

	private List<String> initialKeys = new ArrayList<>();
	private int expectedNumberOfOutputFiles;

	private List<Review> replays = new ArrayList<>();
}
