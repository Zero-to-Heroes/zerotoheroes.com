package com.coach.plugin.hearthstone;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.coach.core.storage.S3Utils;
import com.coach.plugin.ReplayPlugin;
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
@Component
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
	public String getPhase() {
		return "init";
	}

	@Override
	public boolean transformReplayFile(Review review) throws Exception {
		log.debug("Processing arena draft file for review " + review);

		String replayJson = null;

		// Try to parse the .json file
		if ("arenatracker".equals(review.getFileType())) {
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
		String key = review.buildKey(UUID.randomUUID().toString(), "hearthstone/draft");
		review.setKey(key);
		s3utils.putToS3(replayJson, review.getKey(), "application/json");

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

		review.setMetaData(metaData);
	}

	private String getDraft(Review review) throws IOException {
		String replay = review.getTemporaryReplay();
		if (replay == null) {
			replay = s3utils.readFromS3Output(review.getKey());
		}
		return replay;
	}

	private String convertToJson(String atFile) throws Exception {
		Pattern heroPickRegex = Pattern.compile(".* - GameWatcher\\(\\d+\\): New arena\\. Heroe: (\\d+).*");
		Pattern heroPickRegex2 = Pattern.compile(".* - DraftHandler: Begin draft. Heroe: (\\d+).*");
		Pattern choiceRegex = Pattern.compile(".* - DraftHandler: \\(\\d+\\) (\\w+)\\/(\\w+)\\/(\\w+).*");
		Pattern pickRegex = Pattern.compile(".* - GameWatcher\\(\\d+\\): Pick card: (\\w+).*");

		String draftJson = null;

		if (atFile != null) {
			String[] lines = atFile.split(System.lineSeparator());
			if (lines != null) {
				Draft draft = new Draft();
				int pickIndex = 0;
				for (String line : lines) {
					// log.debug("Parsing line " + line);
					Matcher matcher = choiceRegex.matcher(line);
					if (matcher.matches()) {
						Pick pick = new Pick(matcher.group(1), matcher.group(2), matcher.group(3));
						draft.detectedcards[pickIndex] = pick;
					}

					matcher = pickRegex.matcher(line);
					if (matcher.matches()) {
						draft.pickedcards[pickIndex++] = matcher.group(1);
					}

					matcher = heroPickRegex.matcher(line);
					if (!matcher.matches()) {
						matcher = heroPickRegex2.matcher(line);
					}

					if (matcher.matches()) {
						String heroCode = matcher.group(1);
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
	public String getMediaType() {
		return "arena-draft";
	}

	@Data
	private class Draft {
		private String[] detectedheroes = new String[3];
		private String pickedhero;
		private Pick[] detectedcards = new Pick[30];
		private String[] pickedcards = new String[30];
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
