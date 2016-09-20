package com.coach.plugin;

import com.coach.review.Review;

public interface ReplayPlugin extends Plugin {

	boolean transformReplayFile(Review review) throws Exception;

	String getMediaType();

	String getPhase();

}
