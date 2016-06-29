package com.coach.plugin.hearthstone.integrations;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;

import com.amazonaws.event.ProgressEvent;
import com.amazonaws.event.ProgressEventType;
import com.amazonaws.event.ProgressListener;
import com.coach.core.storage.S3Utils;
import com.coach.plugin.IntegrationPlugin;
import com.coach.review.HasText;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class HsReplayNet implements IntegrationPlugin {

	private static final String URL_PATTERN = "(http:\\/\\/(www\\.)?hsreplay\\.net\\/games\\/replay\\/)([\\d\\-a-zA-Z]+)";
	private static final String URL = "http://hsreplay.net/api/v1/replay/";

	@Autowired
	ReviewRepository repo;

	@Autowired
	S3Utils s3utils;

	@Override
	public String getName() {
		return "hs-integration-hsreplaynet";
	}

	@Override
	public String execute(String currentUser, Map<String, String> pluginData, HasText textHolder) throws IOException {
		return textHolder.getText();
	}

	@Override
	public boolean isApplicable(String url) {
		Pattern pattern = Pattern.compile(URL_PATTERN, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(url);
		return matcher.matches();
	}

	@Override
	public void integrateRemoteData(String gameUrl, final Review review) throws Exception {
		// First - create a file that contains the draft info to upload to s3
		String stringXml = buildReplay(gameUrl);
		// Flag the review to show that we are handling it
		review.setMediaType("game-replay");
		review.setText("Imported from " + gameUrl);
		log.debug("strResult " + stringXml);

		// Then upload the file
		final String key = review.buildKey(UUID.randomUUID().toString(), "hearthstone/replay");
		ProgressListener listener = new ProgressListener() {

			@Override
			public void progressChanged(ProgressEvent progressEvent) {
				log.debug("progress2 " + progressEvent.getEventType());
				if (progressEvent.getEventType().equals(ProgressEventType.TRANSFER_COMPLETED_EVENT)) {
					// And finally update the review with all the necessary data
					review.setKey(key);
					review.setFileType("json");
					review.setMediaType("game-replay");
					review.setReviewType("game-replay");
					review.setTranscodingDone(true);
					repo.save(review);
					log.debug("review " + review);
				}
			}
		};
		s3utils.putToS3(stringXml, key, "text/xml", listener);

	}

	private String buildReplay(String gameUrl) throws MalformedURLException, IOException, ProtocolException {
		Pattern pattern = Pattern.compile(URL_PATTERN, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(gameUrl);
		log.debug(matcher.toString());
		matcher.matches();
		String replayId = matcher.group(3);

		StringBuilder result = new StringBuilder();
		URL url = new URL(URL + replayId);
		HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		conn.setRequestMethod("GET");
		BufferedReader rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
		String line;
		while ((line = rd.readLine()) != null) {
			result.append(line);
		}
		rd.close();
		String stringXml = result.toString();
		log.debug("Build xml\n " + stringXml);
		return stringXml;
	}
}
