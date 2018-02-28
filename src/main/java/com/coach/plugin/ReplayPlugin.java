package com.coach.plugin;

import java.util.List;

import com.coach.review.Review;

public interface ReplayPlugin extends Plugin {

	boolean transformReplayFile(Review review) throws Exception;

	List<String> getMediaTypes();

	String getPhase();

}
