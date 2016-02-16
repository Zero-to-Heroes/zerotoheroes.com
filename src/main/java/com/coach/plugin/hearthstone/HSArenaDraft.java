package com.coach.plugin.hearthstone;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;

import com.coach.core.storage.S3Utils;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.HasText;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class HSArenaDraft implements ReplayPlugin {

	@Autowired
	S3Utils s3utils;

	@Autowired
	ReviewRepository repo;

	@Override
	public String execute(String currentUser, Map<String, String> pluginData, HasText textHolder) throws Exception {
		return textHolder.getText();
	}

	@Override
	public String getName() {
		return "hsarenadraft";
	}

	@Override
	public void transformReplayFile(Review review) throws Exception {
		log.debug("Processing arena draft file for review " + review);

		String replayJson = null;
		// TODO: checks that the file is correct - could be even done on UI
		// side?
		replayJson = s3utils.readFromS3(review.getTemporaryKey());
		log.debug("XML created");

		// Store the new file to S3 and update the review with the correct key
		review.setKey(review.getTemporaryKey());
		// review.setReplay(String.valueOf(true));
		s3utils.putToS3(replayJson, review.getKey(), "application/json");

		log.debug("Review updated with proper key " + review);
		review.setTemporaryKey(null);
		review.setTranscodingDone(true);
		repo.save(review);
	}

	@Override
	public String getMediaType() {
		return "arena-draft";
	}
}
