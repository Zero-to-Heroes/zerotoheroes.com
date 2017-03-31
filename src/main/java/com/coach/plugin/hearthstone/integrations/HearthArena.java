package com.coach.plugin.hearthstone.integrations;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
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
public class HearthArena implements IntegrationPlugin {

	private static final String URL_PATTERN = "\\[?(?:http:\\/\\/)?(www\\.heartharena\\.com\\/arena-run\\/)([\\d\\-a-zA-Z\\-]+)\\]?";
	// private static final String URL =
	// "http://www.heartharena.com/arena-run/";

	@Autowired
	ReviewRepository repo;

	@Autowired
	S3Utils s3utils;

	@Override
	public String getName() {
		return "hs-integration-heartharena";
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
		Pattern pattern = Pattern.compile(URL_PATTERN, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(draftUrl);
		while (matcher.find()) {
			draftUrl = "http://" + matcher.group(1) + matcher.group(2);
			// First - create a file that contains the draft info to upload to
			// s3
			Draft result = buildDraftObject(review, draftUrl);
			String strResult = new ObjectMapper().writeValueAsString(result);
			// Flag the review to show that we are handling it
			review.setMediaType("arena-draft");
			review.setText("Imported from " + draftUrl);
			// log.debug("strResult " + strResult);

			// Then upload the file
			final String key = review.buildKey(UUID.randomUUID().toString(), "hearthstone/draft");
			ProgressListener listener = new ProgressListener() {

				@Override
				public void progressChanged(ProgressEvent progressEvent) {
					log.debug("progress2 " + progressEvent.getEventType());
					if (progressEvent.getEventType().equals(ProgressEventType.TRANSFER_COMPLETED_EVENT)) {
						// And finally update the review with all the necessary
						// data
						review.setKey(key);
						review.setFileType("json");
						review.setMediaType("arena-draft");
						review.setReviewType("arena-draft");
						review.setTranscodingDone(true);
						repo.save(review);
						log.debug("review saved " + review);
					}
				}
			};
			s3utils.putToS3(strResult, key, "text/json", listener);
		}
	}

	private Draft buildDraftObject(Review review, String draftUrl) throws IOException {

		Document doc = Jsoup.connect(draftUrl).userAgent("Mozilla").get();

		String hero = doc.select("#basics .deck-archetype header i").attr("class");
		review.setTitle("HearthArena - " + hero);

		Draft result = new Draft();
		result.pickedhero = hero;

		Elements picks = doc.select("#choices .choiceList li[data-pick]");
		for (Element pickEl : picks) {
			// log.debug("picked el " + pickEl);
			// log.debug("picked el li " + pickEl.select("ul li"));
			Pick pick = new Pick();
			pick.Item1 = pickEl.select("ul li").get(0).select(".card .name").text();
			pick.Item2 = pickEl.select("ul li").get(1).select(".card .name").text();
			pick.Item3 = pickEl.select("ul li").get(2).select(".card .name").text();
			result.detectedcards.add(pick);

			String pickedCard = pickEl.select(".picked .card .name").text();
			result.pickedcards.add(pickedCard);
		}

		return result;
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
