package com.coach.plugin.hearthstone;

import com.amazonaws.services.s3.model.S3Object;
import com.coach.core.notification.SlackNotifier;
import com.coach.core.storage.S3Utils;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.HasText;
import com.coach.review.Review;
import com.zerotoheroes.hsgameconverter.ReplayConverter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipInputStream;

@Slf4j
@Component
public class HSReplay implements ReplayPlugin {

	@Autowired
	private S3Utils s3utils;

	@Autowired
	private HSGameParser hsParser;

	@Autowired
	private SlackNotifier slackNotifier;

	@Override
	public String execute(String currentUser, Map<String, String> pluginData, HasText textHolder) {
		return textHolder.getText();
	}

	@Override
	public String getName() {
		return "hsreplay";
	}

	@Override
	public String getPhase() {
		return "init";
	}

	@Override
	public boolean transformReplayFile(Review review) throws Exception {
		log.debug("Processing replay file for review " + review);

		String xml = null;
		if (review.getTemporaryReplay() != null) {
			log.debug("temporary replay");
			// Simply store the temporary XML to the final destination
			if ("text/xml".equals(review.getFileType())) {
				xml = review.getTemporaryReplay();
			}
			else {
				log.debug("to xml");
				// log.debug(review.getTemporaryReplay());
				xml = new ReplayConverter().xmlFromLogs(review.getTemporaryReplay());
			}
		}
		else if ("hszip".equals(review.getFileType())) {
			log.debug("zip file");
			xml = readZippedReplayFile(review);
		}
		else if (!StringUtils.isEmpty(review.getFileType())
				&& (review.getFileType().startsWith("text/plain") || "log".equals(review.getFileType()))
				|| "arenatracker".equals(review.getFileType())) {
			log.debug("plaintext replay");
			// Need to process the file
			log.debug("Retrieving log file " + review.getTemporaryKey());
			String logFile = s3utils.readFromS3(review.getTemporaryKey());
			log.debug("Retrieved log file ");
			xml = new ReplayConverter().xmlFromLogs(logFile);

		}
		// Simply store the temporary XML to the final destination
		else if ("text/xml".equals(review.getFileType())) {
			log.debug("hdtxmlreplay replay");
			xml = s3utils.readFromS3(review.getTemporaryKey());
		}
		log.debug("XML created");
		// log.debug(xml);

		// Store the new file to S3 and update the review with the correct key
		String key = review.buildKey(UUID.randomUUID().toString(), "hearthstone/replay");
		log.debug("created key " + key);
		review.setKey(key);
		review.setReplay(String.valueOf(true));
		review.setMediaType("game-replay");
		review.setReviewType("game-replay");
		review.setTemporaryReplay(xml);
		try {
			hsParser.addMetaData(review);
		}
		catch (Exception e) {
			log.error("Could not parse metadata for review " + review, e);
			slackNotifier.notifyError(e, "Could not parse metadata", review);
		}
		s3utils.putToS3(xml, review.getKey(), "text/xml");

		log.debug("Review updated with proper key " + review);
		// review.setTemporaryKey(null);
		review.setTranscodingDone(true);
		review.setTemporaryReplay(null);
		return true;
	}

	private String readZippedReplayFile(Review review) throws Exception {
		S3Object s3Object = s3utils.readerFromS3(review.getTemporaryKey());
		ZipInputStream zis = new ZipInputStream(s3Object.getObjectContent());
		zis.getNextEntry();
		String xmlReplay = IOUtils.toString(zis, StandardCharsets.UTF_8);
		zis.close();
		return xmlReplay;
	}

	@Override
	public List<String> getMediaTypes() {
		return Arrays.asList(null, "game-replay");
	}

	public List<String> extractGames(String key, String fileType) throws IOException {
		log.debug("Extracting games with " + key + ", " + fileType);
		List<String> games;
		try (S3Object s3object = s3utils.readerFromS3(key)) {
			BufferedReader reader = new BufferedReader(new InputStreamReader(s3object.getObjectContent()));
			games = extractGames(fileType, reader);
		}
		return games;
	}

	public List<String> extractGames(String fileType, BufferedReader reader) throws IOException {
		List<String> games = new ArrayList<>();
		StringBuilder currentGame = null;
		if (StringUtils.isEmpty(fileType)) { return games; }

		if (fileType.startsWith("text/plain")) {
			log.debug("processing file");
			String line;
			while ((line = reader.readLine()) != null) {
				// log.debug("Processing log line " + line);
				if (line.contains("GameState.DebugPrintPower() - CREATE_GAME")) {
					if (currentGame != null) {
						log.debug("Added a new game, " + line);
						// log.debug(currentGame.toString());
						games.add(currentGame.toString());
						currentGame.setLength(0);
					}
					else {
						currentGame = new StringBuilder();
					}
				}
				// log.debug("\treading line " + line);
				if (currentGame != null) {
					currentGame.append(line);
					currentGame.append(System.lineSeparator());
				}
			}
			if (currentGame != null && currentGame.length() > 0) {
				log.debug("Added a new game");
				// log.debug(currentGame.toString());
				games.add(currentGame.toString());
			}
		}
		else if (fileType.startsWith("text/xml")) {
			log.debug("processing xml file");
			currentGame = new StringBuilder();
			String line;
			while ((line = reader.readLine()) != null) {
				currentGame.append(line);
				currentGame.append(System.lineSeparator());
			}
			if (currentGame.length() > 0) {
				log.debug("Added a new game");
				// log.debug(currentGame.toString());
				games.add(currentGame.toString());
			}
		}
		return games;
	}
}
