package com.coach.review;

import org.junit.Before;
import org.junit.Test;

import com.coach.common.BaseIntegrationTest;

public class ReviewsIT extends BaseIntegrationTest {

	private Review review;

	@Before
	public void beforeTest() {
		review = new Review();
		review.setTitle("fakeTitle");
	}

	@Test
	public void testCreateReview() throws Exception {
		// String jsonReview = new ObjectMapper().writeValueAsString(review);
		//
		// // Create the review
		// String createResponse = doAnonymousExchange(HttpMethod.POST,
		// "api/reviews", jsonReview);
		// JSONObject createdReview = new JSONObject(createResponse);
		// assertNotNull("Review should have been created", createdReview);
		// String reviewId = createdReview.getString("id");
		// assertNotNull("Review ID should not be null", reviewId);
	}
}
