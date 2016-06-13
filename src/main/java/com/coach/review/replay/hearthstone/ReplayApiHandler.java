package com.coach.review.replay.hearthstone;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.coach.plugin.hearthstone.HSReplay;
import com.coach.review.ListReviewResponse;
import com.coach.review.Review;
import com.coach.review.ReviewApiHandler;
import com.coach.review.ReviewRepository;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/replays")
@Slf4j
public class ReplayApiHandler {

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	ReviewApiHandler reviewApi;

	@Autowired
	HSReplay hsReplay;

	@RequestMapping(method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<ListReviewResponse> init(@RequestBody ReplayFilesRequest request)
			throws IOException {

		log.debug("Handling replay file " + request);
		List<String> originalFileKeys = request.getKeys();

		List<Review> reviews = new ArrayList<>();

		for (int i = 0; i < originalFileKeys.size(); i++) {
			String key = originalFileKeys.get(i);
			log.debug("\tprocessing key " + key);

			// Are there several games in the single file?
			List<String> games = hsReplay.extractGames(key, request.getFileTypes().get(i));
			log.debug("\tbuilt " + games.size() + " games");

			// Process file
			for (String game : games) {
				Review review = new Review();
				review.setFileType(request.getFileTypes().get(i));
				review.setSport(Review.Sport.load(request.getSport()));
				review.setTemporaryReplay(game);
				review.setReplay("true");
				// review.setTemporaryKey(tempKey);

				reviewApi.createReview(review);
				reviews.add(review);
				log.debug("Created review " + review);
			}
		}

		ListReviewResponse response = new ListReviewResponse(reviews);
		return new ResponseEntity<ListReviewResponse>(response, HttpStatus.OK);
	}
}
