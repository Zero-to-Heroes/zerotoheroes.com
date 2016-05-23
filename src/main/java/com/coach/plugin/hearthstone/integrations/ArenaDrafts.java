package com.coach.plugin.hearthstone.integrations;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;

import com.amazonaws.event.ProgressEvent;
import com.amazonaws.event.ProgressEventType;
import com.amazonaws.event.ProgressListener;
import com.coach.core.storage.S3Utils;
import com.coach.plugin.IntegrationPlugin;
import com.coach.review.HasText;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ArenaDrafts implements IntegrationPlugin {

	private static final String URL_PATTERN = "\\[?(http:\\/\\/(www\\.)?arenadrafts\\.com\\/Arena\\/View\\/)([\\d\\-a-zA-Z\\-]+)\\]?";
	private static final String URL = "http://arenadrafts.com/Arena/View/";

	@Autowired
	ReviewRepository repo;

	@Autowired
	S3Utils s3utils;

	@Override
	public String getName() {
		return "hs-integration-arenadrafts";
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
	public void integrateRemoteData(String draftUrl, final Review review) throws Exception {
		// First - create a file that contains the draft info to upload to s3
		String stringDraft = buildDraft(draftUrl);
		Draft result = buildDraftObject(review, stringDraft);
		String strResult = new ObjectMapper().writeValueAsString(result);
		// Flag the review to show that we are handling it
		review.setMediaType("arena-draft");
		review.setText("Imported from " + draftUrl);
		log.debug("strResult " + strResult);

		// Then upload the file
		final String guid = UUID.randomUUID().toString();
		ProgressListener listener = new ProgressListener() {

			@Override
			public void progressChanged(ProgressEvent progressEvent) {
				log.debug("progress2 " + progressEvent.getEventType());
				if (progressEvent.getEventType().equals(ProgressEventType.TRANSFER_COMPLETED_EVENT)) {
					// And finally update the review with all the necessary data
					review.setKey(guid);
					review.setFileType("json");
					review.setMediaType("arena-draft");
					review.setReviewType("arena-draft");
					review.setTranscodingDone(true);
					repo.save(review);
					log.debug("review " + review);
				}
			}
		};
		s3utils.putToS3(strResult, guid, "text/json", listener);

	}

	private Draft buildDraftObject(Review review, String stringDraft) {
		JSONObject draft = new JSONArray(stringDraft).getJSONObject(0);

		int numberOfWins = 0;
		JSONArray matches = draft.getJSONArray("Matches");
		for (int i = 0; i < matches.length(); i++) {
			if (matches.getJSONObject(i).getBoolean("Win")) {
				numberOfWins++;
			}
		}
		review.setTitle("ArenaDrafts - " + draft.getString("Hero") + " - " + numberOfWins + " wins");

		Draft result = new Draft();
		result.pickedhero = draft.getString("Hero");

		JSONArray pickedCards = draft.getJSONArray("Picks");
		for (int i = 0; i < pickedCards.length(); i++) {
			JSONObject cardObj = pickedCards.getJSONObject(i);

			Pick pick = new Pick();
			pick.Item1 = cardObj.getJSONObject("Card1Info").getString("Id");
			pick.Item2 = cardObj.getJSONObject("Card2Info").getString("Id");
			pick.Item3 = cardObj.getJSONObject("Card3Info").getString("Id");
			result.detectedcards.add(pick);

			int cardPickIndex = cardObj.getInt("CardPicked");
			String pickedCard = cardObj.getJSONObject("Card" + cardPickIndex + "Info").getString("Id");
			result.pickedcards.add(pickedCard);
		}
		return result;
	}

	private String buildDraft(String draftUrl) throws MalformedURLException, IOException, ProtocolException {
		StringBuilder result = new StringBuilder();
		URL url = new URL(draftUrl + "?format=JSON");
		HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		conn.setRequestMethod("GET");
		BufferedReader rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
		String line;
		while ((line = rd.readLine()) != null) {
			result.append(line);
		}
		rd.close();
		String stringDraft = result.toString();
		return stringDraft;
	}

	@Data
	private class Draft {
		String pickedhero;
		List<String> detectedheroes = new ArrayList<>();
		List<Pick> detectedcards = new ArrayList<>();
		List<String> pickedcards = new ArrayList<>();
	}

	@AllArgsConstructor
	@NoArgsConstructor
	@Setter
	private class Pick {
		@JsonProperty("Item1")
		private String Item1;

		@JsonProperty("Item2")
		private String Item2;

		@JsonProperty("Item3")
		private String Item3;
	}
}
