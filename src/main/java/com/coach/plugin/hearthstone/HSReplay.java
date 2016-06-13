package com.coach.plugin.hearthstone;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.core.storage.S3Utils;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.HasText;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;

import info.hearthsim.hsreplay.ReplaySerializer;
import lombok.extern.slf4j.Slf4j;
import net.lingala.zip4j.core.ZipFile;

@Slf4j
@Component
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
		if (review.getTemporaryReplay() != null) {
			if ("text/plain".equals(review.getFileType())) {
				xml = new ReplaySerializer().xmlFromLogs(review.getTemporaryReplay());

			}
			// Simply store the temporary XML to the final destination
			else if ("text/xml".equals(review.getFileType())) {
				xml = review.getTemporaryReplay();
			}
		}
		else if ("hdtreplay".equals(review.getFileType())) {
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
			xml = new ReplaySerializer().xmlFromLogs(logFile);
			// log.debug("XML file " + xml);

			// Delete temp file
			tempFile.delete();
			FileUtils.deleteDirectory(new File(destination));
		}
		else if ("text/plain".equals(review.getFileType()) || "arenatracker".equals(review.getFileType())) {
			// Need to process the file
			log.debug("Retrieving log file " + review.getTemporaryKey());
			String logFile = s3utils.readFromS3(review.getTemporaryKey());
			log.debug("Retrieved log file ");
			xml = new ReplaySerializer().xmlFromLogs(logFile);

		}
		// Simply store the temporary XML to the final destination
		else if ("text/xml".equals(review.getFileType())) {
			xml = s3utils.readFromS3(review.getTemporaryKey());
		}
		log.debug("XML created");

		// Store the new file to S3 and update the review with the correct key
		review.setKey(review.getTemporaryKey() == null ? UUID.randomUUID().toString() : review.getTemporaryKey());
		review.setReplay(String.valueOf(true));
		s3utils.putToS3(xml, review.getKey(), "text/xml");

		log.debug("Review updated with proper key " + review);
		// review.setTemporaryKey(null);
		review.setTranscodingDone(true);
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

	public List<String> extractGames(String key, String fileType) throws IOException {
		log.debug("Extracting games with " + key + ", " + fileType);
		List<String> games = new ArrayList<>();

		BufferedReader reader = s3utils.readerFromS3(key);
		StringBuilder currentGame = new StringBuilder();
		if ("text/plain".equals(fileType)) {
			log.debug("processing file");
			String line;
			while ((line = reader.readLine()) != null) {
				if (line.contains("GameState.DebugPrintPower() - CREATE_GAME")) {
					if (currentGame.length() > 10000) {
						log.debug("Added a new game");
						games.add(currentGame.toString());
					}
					currentGame.setLength(0);
				}
				// log.debug("\treading line " + line);
				currentGame.append(line);
				currentGame.append(System.lineSeparator());
			}
			if (currentGame.length() > 0) {
				log.debug("Added a new game");
				games.add(currentGame.toString());
			}
		}

		return games;

	}
}
