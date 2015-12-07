package com.coach.plugin;

import com.coach.review.Review;

public interface ReplayPlugin extends Plugin {

	void transformReplayFile(Review review) throws Exception;

}
