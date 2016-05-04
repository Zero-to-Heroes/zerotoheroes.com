package com.coach.plugin;

import com.coach.review.Review;

public interface IntegrationPlugin extends Plugin {

	boolean isApplicable(String url);

	void integrateRemoteData(String url, Review review) throws Exception;

}
