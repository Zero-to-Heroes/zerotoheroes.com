package com.coach.plugin.hearthstone;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.amazonaws.services.s3.model.S3Object;
import com.coach.core.storage.S3Utils;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.HasText;
import com.coach.review.MetaData;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.zerotoheroes.hsgameconverter.ReplayConverter;
import com.zerotoheroes.hsgameentities.replaydata.HearthstoneReplay;
import com.zerotoheroes.hsgameparser.metadata.GameMetaData;

import lombok.extern.slf4j.Slf4j;
import net.lingala.zip4j.core.ZipFile;
import net.lingala.zip4j.exception.ZipException;

@Slf4j
@Component
public class HSReplay implements ReplayPlugin {

	@Autowired
	S3Utils s3utils;

	@Autowired
	ReviewRepository repo;

	@Autowired
	GameParserProvider gameParser;

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
		else if ("hdtreplay".equals(review.getFileType())) {
			log.debug("hdtreplay replay");
			// Creating temp file to use the zip API
			File tempFile = File.createTempFile("" + new Date().getTime(), ".hdtreplay");
			// log.debug("Created temp file " + tempFile);
			s3utils.readFromS3ToFile(review.getTemporaryKey(), tempFile);
			// log.debug("Populated temp file from s3 " + tempFile);
			// log.debug("tmp file size " + tempFile.length());

			// Unzipping
			ZipFile zipFile = new ZipFile(tempFile);
			// log.debug("Created zip file " + zipFile);
			String tempDir = System.getProperty("java.io.tmpdir");
			// log.debug("tempFile system property: " + tempDir);
			String destination = tempDir + "/" + new Date().getTime() + "-" + review.getSlugifiedTitle();
			zipFile.extractFile("output_log.txt", destination);
			// log.debug("Extracted to destination " + new File(destination));
			// log.debug("Output extraction " + new File(destination +
			// "/output_log.txt"));
			// log.debug("Output extraction length " + new File(destination +
			// "/output_log.txt").length());

			// Retrieving the unzipped file
			String logFile = readFile(destination + "/output_log.txt");
			// All logs are correct at that point
			// log.debug("Reading logs " + logFile);
			xml = new ReplayConverter().xmlFromLogs(logFile);
			// log.debug("XML file " + xml);

			// Delete temp file
			tempFile.delete();
			FileUtils.deleteDirectory(new File(destination));
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
		addMetaData(review);
		s3utils.putToS3(xml, review.getKey(), "text/xml");

		log.debug("Review updated with proper key " + review);
		// review.setTemporaryKey(null);
		review.setTranscodingDone(true);
		review.setTemporaryReplay(null);
		repo.save(review);
	}

	static String readFile(String path) throws IOException {
		File file = new File(path);
		StringBuilder fileContents = new StringBuilder();

		BufferedReader reader = new BufferedReader(new FileReader(file));
		try {
			String line;
			while ((line = reader.readLine()) != null) {
				fileContents.append(line + System.lineSeparator());
			}
		}
		finally {
			reader.close();
		}

		return fileContents.toString();
	}

	@Override
	public String getMediaType() {
		return null;
	}

	private void addMetaData(Review review) {
		if (gameParser == null || gameParser.getGameParser() == null) {
			log.error("Game parser not initialized properly");
			return;
		}

		try {
			log.debug("Adding meta data to " + review);
			String replay = review.getTemporaryReplay();
			log.debug("temp replay is ");
			HearthstoneReplay game = new ReplayConverter()
					.replayFromXml(new ByteArrayInputStream(replay.getBytes(StandardCharsets.UTF_8)));
			log.debug("game is ");

			GameMetaData meta = gameParser.getGameParser().getMetaData(game);
			log.debug("built meta data " + meta);
			review.getParticipantDetails().setPlayerName(meta.getPlayerName());
			review.getParticipantDetails().setOpponentName(meta.getOpponentName());
			review.getParticipantDetails().setPlayerCategory(meta.getPlayerClass());
			review.getParticipantDetails().setOpponentCategory(meta.getOpponentClass());

			MetaData metaData = review.getMetaData();
			if (metaData == null || !(metaData instanceof HearthstoneMetaData)) {
				metaData = new HearthstoneMetaData();
				review.setMetaData(metaData);
			}
			HearthstoneMetaData hsMeta = (HearthstoneMetaData) metaData;
			hsMeta.setDurationInSeconds(meta.getDurationInSeconds());
			hsMeta.setNumberOfTurns(meta.getNumberOfTurns());
			hsMeta.setWinStatus(meta.getWinStatus());

			log.debug("adding title?");
			if (StringUtils.isEmpty(review.getTitle())) {
				String title = new SimpleDateFormat("yyyy-MM-dd").format(new Date()) + " - "
						+ review.getParticipantDetails().getPlayerName() + "("
						+ review.getParticipantDetails().getPlayerCategory() + ") vs "
						+ review.getParticipantDetails().getOpponentName() + "("
						+ review.getParticipantDetails().getOpponentCategory() + ")";
				title += " - " + hsMeta.getWinStatus();
				review.setTitle(title);
			}

			log.debug("done adding meta " + review);
		}
		catch (Throwable e) {
			log.info("Could not add metata to review " + review);
			log.error("", e);
			log.error("Could not add metata to review " + review, e);
		}
	}

	public List<String> extractGames(String key, String fileType) throws IOException, ZipException {
		log.debug("Extracting games with " + key + ", " + fileType);
		List<String> games = new ArrayList<>();

		S3Object s3object = s3utils.readerFromS3(key);
		try {
			BufferedReader reader = new BufferedReader(new InputStreamReader(s3object.getObjectContent()));
			games = extractGames(key, fileType, reader);
		}
		finally {
			s3object.close();
		}

		return games;

	}

	public List<String> extractGames(String key, String fileType, BufferedReader reader)
			throws IOException, ZipException {
		List<String> games = new ArrayList<>();
		StringBuilder currentGame = null;
		if (StringUtils.isEmpty(fileType)) { return games; }

		if (fileType.startsWith("text/plain")) {
			log.debug("processing file");
			String line;
			while ((line = reader.readLine()) != null) {
				log.debug("Processing log line " + line);
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
		else if ("hdtreplay".equals(fileType)) {
			File tempFile = File.createTempFile("" + new Date().getTime(), ".hdtreplay");
			s3utils.readFromS3ToFile(key, tempFile);

			// Unzipping
			ZipFile zipFile = new ZipFile(tempFile);
			String tempDir = System.getProperty("java.io.tmpdir");
			String destination = tempDir + "/" + new Date().getTime() + "-" + key;
			zipFile.extractFile("output_log.txt", destination);

			// Retrieving the unzipped file
			String logFile = readFile(destination + "/output_log.txt");
			games.add(logFile);

			// Delete temp file
			tempFile.delete();
			FileUtils.deleteDirectory(new File(destination));
		}
		return games;
	}
}
