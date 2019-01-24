package com.coach.plugin.hearthstone;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.assertj.core.util.Arrays;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.coach.core.notification.SlackNotifier;
import com.coach.core.storage.S3Utils;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.HasText;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class HSArenaDraft implements ReplayPlugin {

	@Autowired
	S3Utils s3utils;

	@Autowired
	ReviewRepository repo;

	@Autowired
	SlackNotifier slackNotifier;

	@Override
	public String execute(String currentUser, Map<String, String> pluginData, HasText textHolder) throws Exception {
		return textHolder.getText();
	}

	@Override
	public String getName() {
		return "hsarenadraft";
	}

	@Override
	public String getPhase() {
		return "all";
	}

	@Override
	public boolean transformReplayFile(Review review) throws Exception {
		log.debug("Processing arena draft file for review " + review);

		String replayJson = null;

		// Try to parse the .json file
		if (!StringUtils.isEmpty(review.getKey())) {
			replayJson = s3utils.readFromS3Output(review.getKey());
		}
		else if ("arenatracker".equals(review.getFileType()) && !StringUtils.isEmpty(review.getTemporaryReplay())) {
			log.debug("Converting arena tracker file");
			String atFile = review.getTemporaryReplay();
			replayJson = convertToJson(atFile);
		}
		else if ("arenatracker".equals(review.getFileType())) {
			log.debug("Converting arena tracker file");
			String atFile = s3utils.readFromS3(review.getTemporaryKey());
			replayJson = convertToJson(atFile);
		}
		else if (!StringUtils.isEmpty(review.getTemporaryReplay())) {
			replayJson = review.getTemporaryReplay();
		}
		// Default
		else {
			replayJson = s3utils.readFromS3(review.getTemporaryKey());
			log.debug("Default json file, keeping it as is");
		}
		// Store the new file to S3 and update the review with the correct
		// key
		if (StringUtils.isEmpty(review.getKey())) {
			String key = review.buildKey(UUID.randomUUID().toString(), "hearthstone/draft");
			review.setKey(key);
			s3utils.putToS3(replayJson, review.getKey(), "application/json");
		}

		review.setTemporaryReplay(replayJson);
		addMetaData(review);
		review.setTemporaryReplay(null);

		log.debug("Review updated with proper key " + review);
		// review.setTemporaryKey(null);
		review.setTranscodingDone(true);
		return true;
	}

	public void addMetaData(Review review) throws IOException {
		// String draft = getDraft(review);
		HearthstoneMetaData metaData = new HearthstoneMetaData();
		if (review.getParticipantDetails() != null) {
			metaData.setPlayerName(review.getParticipantDetails().getPlayerName());
			metaData.setPlayerClass(review.getParticipantDetails().getPlayerCategory());
		}
		metaData.setGameMode("arena-draft");

		String jsonDraft = getDraft(review);
		Draft draft = new ObjectMapper().readValue(jsonDraft, Draft.class);
		if (Arrays.isNullOrEmpty(draft.detectedcards) || Arrays.isNullOrEmpty(draft.pickedcards)) {
			review.setInvalidGame(true);
		}
		else {
			if (!StringUtils.isEmpty(draft.pickedhero)) {
				metaData.setPlayerClass(draft.pickedhero.toLowerCase());
			}
		}

		review.setMetaData(metaData);
	}

	private String getDraft(Review review) throws IOException {
		String replay = review.getTemporaryReplay();
		if (replay == null) {
			replay = s3utils.readFromS3Output(review.getKey());
		}
		return replay;
	}

	public String convertToJson(String atFile) throws Exception {
		Pattern heroPickRegex = Pattern.compile("(.*) - GameWatcher\\(\\d+\\): New arena\\. Heroe: (\\d+).*");
		Pattern heroPickRegex2 = Pattern.compile("(.*) - DraftHandler: Begin draft. Heroe: (\\d+).*");
		Pattern choiceRegex = Pattern.compile("(.*) - DraftHandler: \\(\\d+\\) (\\w+)\\/(\\w+)\\/(\\w+).*");
		Pattern pickRegexOld = Pattern.compile("(.*) - GameWatcher\\(\\d+\\): Pick card: (\\w+).*");
		Pattern pickRegex = Pattern.compile("(.*) - DraftHandler: Pick card: (\\w+).*");

		String draftJson = null;

		if (atFile != null) {

			String[] lines = atFile.split("\n");
			if (lines != null) {
				Draft draft = new Draft();
				int pickIndex = 0;
				LocalTime lastTime = null;
				for (String line : lines) {
					if (pickIndex > 30) {
						// Issue with original draft
						slackNotifier.sendMessage("Invalid Arena Draft", atFile);
						continue;
					}
					line = line.replaceAll("\\r", "").replaceAll("\\n", "");
					// log.debug("Parsing line " + line);
					Matcher matcher = choiceRegex.matcher(line);
					if (matcher.matches()) {
						lastTime = LocalTime.parse(matcher.group(1));
						Pick pick = new Pick(matcher.group(2), matcher.group(3), matcher.group(4));
						draft.detectedcards[pickIndex] = pick;
					}

					matcher = pickRegexOld.matcher(line);
					if (!matcher.matches()) {
						matcher = pickRegex.matcher(line);
					}
					if (matcher.matches()) {
						LocalTime time = LocalTime.parse(matcher.group(1));
						String cardId = matcher.group(2);
						// HS sometimes loos duplicate at a close interval, this
						// is an attempt to work around it
						if (pickIndex == 0 ||
								!cardId.equals(draft.pickedcards[pickIndex - 1]) ||
								Duration.between(time, lastTime).abs().getSeconds() > 2) {

							draft.pickedcards[pickIndex++] = cardId;
						}
						lastTime = time;
					}

					matcher = heroPickRegex.matcher(line);
					if (!matcher.matches()) {
						matcher = heroPickRegex2.matcher(line);
					}

					if (matcher.matches()) {
						String heroCode = matcher.group(2);
						String hero = null;
						switch (heroCode) {
							case "01":
								hero = "Warrior";
								break;
							case "02":
								hero = "Shaman";
								break;
							case "03":
								hero = "Rogue";
								break;
							case "04":
								hero = "Paladin";
								break;
							case "05":
								hero = "Hunter";
								break;
							case "06":
								hero = "Druid";
								break;
							case "07":
								hero = "Warlock";
								break;
							case "08":
								hero = "Mage";
								break;
							case "09":
								hero = "Priest";
								break;
							default:
								break;
						}
						draft.pickedhero = hero;
					}
				}
				log.debug("Built draft " + draft);
				draftJson = new ObjectMapper().writeValueAsString(draft);
				log.debug("Converted json " + draftJson);
			}
		}

		return draftJson;
	}

	@Override
	public List<String> getMediaTypes() {
		return Collections.singletonList("arena-draft");
	}

	@Data
	@JsonIgnoreProperties(ignoreUnknown = true)
	private static class Draft {
		private String[] detectedheroes = new String[3];
		private String pickedhero;
		private Pick[] detectedcards = new Pick[30];
		private String[] pickedcards = new String[30];
	}

	@NoArgsConstructor
	@Setter
	private static class Pick {
		@JsonProperty("Item1")
		private String Item1;

		@JsonProperty("Item2")
		private String Item2;

		@JsonProperty("Item3")
		private String Item3;

		@JsonCreator
		public Pick(@JsonProperty("Item1") String item1, @JsonProperty("Item2") String item2,
				@JsonProperty("Item3") String item3) {
			super();
			Item1 = item1;
			Item2 = item2;
			Item3 = item3;
		}

	}
}
