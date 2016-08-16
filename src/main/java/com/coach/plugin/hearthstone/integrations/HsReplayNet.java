package com.coach.plugin.hearthstone.integrations;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.net.URLConnection;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.JSONObject;
import org.jsoup.Jsoup;
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

	private static final String URL_PATTERN = "(http(?:s)?:\\/\\/(?:www\\.)?hsreplay\\.net\\/replay\\/)([\\d\\-a-zA-Z]+)";
	private static final String URL = "https://hsreplay.net/api/v1/replay/";

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
		gameUrl = gameUrl.replaceAll("https", "http");
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

		String gameId = matcher.group(2);

		String apiUrl = "http://hsreplay.net/api/v1/games/" + gameId + "/";
		String resultString = restGetCall(apiUrl);

		JSONObject api = new JSONObject(resultString);
		String downloadLink = api.getString("replay_xml");

		String stringXml = Jsoup.connect(downloadLink).userAgent("Mozilla").get().select("hsreplay").toString();
		downloadLink = downloadLink.replace("https", "http");

		// Capitalize what needs to be capitalize
		stringXml = stringXml.replaceAll("<(/)?hsreplay", "<$1HSReplay").replaceAll("<(/)?gameentity", "<$1GameEntity")
				.replaceAll("<(/)?game", "<$1Game").replaceAll("<(/)?tagchange", "<$1TagChange")
				.replaceAll("<(/)?tag", "<$1Tag").replaceAll("<(/)?player", "<$1Player")
				.replaceAll("accounthi", "accountHi").replaceAll("accountlo", "accountLo")
				.replaceAll("playerid", "playerID").replaceAll("cardid", "cardID").replaceAll("<(/)?deck", "<$1Deck")
				.replaceAll("<(/)?card", "<$1Card").replaceAll("<(/)?fullentity", "<$1FullEntity")
				.replaceAll("<(/)?action", "<$1Action").replaceAll("<(/)?block", "<$1Block")
				.replaceAll("<(/)?showentity", "<$1ShowEntity").replaceAll("<(/)?chosenentities", "<$1ChosenEntities")
				.replaceAll("<(/)?choice", "<$1Choice").replaceAll("<(/)?option", "<$1Option")
				.replaceAll("<(/)?hideentity", "<$1HideEntity").replaceAll("<(/)?metadata", "<$1MetaData")
				.replaceAll("<(/)?info", "<$1Info");
		// log.debug("Build xml\n " + stringXml);
		return stringXml;
	}

	private String restGetCall(String apiUrl) throws MalformedURLException, IOException {
		URL url = new URL(apiUrl);
		URLConnection connection = url.openConnection();
		connection.setDoOutput(true);
		connection.setConnectTimeout(5000);
		connection.setReadTimeout(5000);
		connection.setRequestProperty("User-Agent",
				"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.95 Safari/537.11");
		connection.setRequestProperty("Content-Type", "application/json");
		connection.setRequestProperty("Accept", "*/*");
		BufferedReader rd = new BufferedReader(new InputStreamReader(connection.getInputStream()));
		String line;
		StringBuilder result = new StringBuilder();
		while ((line = rd.readLine()) != null) {
			result.append(line);
		}
		rd.close();
		String resultString = result.toString();
		return resultString;
	}
}
