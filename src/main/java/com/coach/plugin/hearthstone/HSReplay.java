package com.coach.plugin.hearthstone;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Date;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;

import com.coach.core.storage.S3Utils;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.HasText;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;

import info.hearthsim.hsreplay.ReplaySerializer;
import lombok.extern.slf4j.Slf4j;
import net.lingala.zip4j.core.ZipFile;

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
		if ("hdtreplay".equals(review.getFileType())) {
			// Creating temp file to use the zip API
			File tempFile = File.createTempFile("" + new Date().getTime(), ".hdtreplay");
			log.debug("Created temp file " + tempFile);
			s3utils.readFromS3ToFile(review.getTemporaryKey(), tempFile);
			log.debug("Populated temp file from s3 " + tempFile);
			log.debug("tmp file size " + tempFile.length());

			// Unzipping
			ZipFile zipFile = new ZipFile(tempFile);
			log.debug("Created zip file " + zipFile);
			String tempDir = System.getProperty("java.io.tmpdir");
			log.debug("tempFile system property: " + tempDir);
			String destination = tempDir + "/" + new Date().getTime() + "-" + review.getSlugifiedTitle();
			zipFile.extractFile("output_log.txt", destination);
			log.debug("Extracted to destination " + new File(destination));
			log.debug("Output extraction " + new File(destination + "/output_log.txt"));
			log.debug("Output extraction length " + new File(destination + "/output_log.txt").length());

			// Retrieving the unzipped file
			String logFile = readFile(destination + "/output_log.txt", StandardCharsets.UTF_8);
			log.debug("Reading logs " + logFile);
			xml = new ReplaySerializer().xmlFromLogs(logFile);

			// Delete temp file
			tempFile.delete();
			FileUtils.deleteDirectory(new File(destination));
		}
		else if ("text/plain".equals(review.getFileType())) {
			// Need to process the file
			String logFile = s3utils.readFromS3(review.getTemporaryKey());
			log.debug("Retrieved log file ");
			xml = new ReplaySerializer().xmlFromLogs(logFile);

		}
		// Simply store the temporary XML to the final destination
		else if ("text/xml".equals(review.getFileType())) xml = s3utils.readFromS3(review.getTemporaryKey());
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

	static String readFile(String path, Charset encoding) throws IOException {
		byte[] encoded = Files.readAllBytes(Paths.get(path));
		return new String(encoded, encoding);
	}
}
