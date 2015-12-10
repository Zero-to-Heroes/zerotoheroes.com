package com.coach.plugin.hearthstone;

import java.util.Map;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;

import com.coach.core.storage.S3Utils;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.HasText;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.hearthsim.hsreplay.ReplaySerializer;

@Slf4j
public class HSReplay implements ReplayPlugin {

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
		return "hsreplay";
	}

	@Override
	public void transformReplayFile(Review review) throws Exception {
		log.debug("Processing replay file for review " + review);

		String xml = null;
		if ("text/plain".equals(review.getFileType())) {
			// Need to process the file
			String logFile = s3utils.readFromS3(review.getTemporaryKey());
			log.debug("Retrieved log file ");
			xml = new ReplaySerializer().xmlFromLogs(logFile);

		}
		else if ("text/xml".equals(review.getFileType())) {
			// Simply store the temporary XML to the final destination
			xml = s3utils.readFromS3(review.getTemporaryKey());
		}
		log.debug("XML created");

		// Store the new file to S3 and update the review with the correct key
		review.setKey(review.getTemporaryKey());
		review.setReplay(String.valueOf(true));
		s3utils.putToS3(xml, review.getKey(), "text/xml");

		log.debug("Review updated with proper key " + review);
		review.setTemporaryKey(null);
		review.setTranscodingDone(true);
		repo.save(review);
	}
}
