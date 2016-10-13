package com.coach.review.api.hearthstone;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.zip.GZIPInputStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.coach.core.security.User;
import com.coach.core.storage.S3Utils;
import com.coach.plugin.hearthstone.HSReplay;
import com.coach.plugin.hearthstone.HearthstoneMetaData;
import com.coach.review.Review;
import com.coach.review.ReviewApiHandler;
import com.coach.review.ReviewRepository;
import com.coach.review.ReviewService;
import com.coach.tag.Tag;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;
import net.lingala.zip4j.exception.ZipException;

@RepositoryRestController
@RequestMapping(value = "/api/hearthstone")
@Slf4j
public class ReviewPublicApi {

	@Autowired
	S3Utils s3utils;

	@Autowired
	UserRepository userRepo;

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	ReviewApiHandler reviewApi;

	@Autowired
	ReviewService reviewService;

	@Autowired
	HSReplay hsReplay;

	@RequestMapping(value = "/progressive/init", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<FileUploadResponse> initReview(@RequestBody ReviewCreationParams data)
			throws Exception {
		log.debug("creating review with params " + data);
		FileUploadResponse response = null;
		Review review = new Review();
		review.setFileType("text/plain");
		review.setSport(Review.Sport.load("hearthstone"));
		review.setReplay("true");
		review.setVisibility("restricted");
		review.setTemporaryReplay("");
		review.setReviewType("game-replay");
		review.setUseV2comments(true);
		review.setUploaderApplicationKey(data.getUploaderApplicationKey());
		review.setUploaderToken(data.getUploaderToken());

		addMetaData(data, review);

		reviewRepo.save(review);
		List<String> ids = new ArrayList<>();
		ids.add(review.getId());
		log.debug("Created review " + review);

		response = new FileUploadResponse(ids, null);
		return new ResponseEntity<FileUploadResponse>(response, HttpStatus.OK);
	}

	private void addMetaData(ReviewCreationParams data, Review review) {
		HearthstoneMetaData meta = new HearthstoneMetaData();
		meta.setGameMode(data.getGameMode());
		review.setMetaData(meta);

		String rank = null;
		if (data.getRank() != 0) {
			rank = "Rank " + data.getRank();
		}
		else if (data.getLegendRank() != 0) {
			rank = "Legend";
		}
		if (rank != null) {
			review.getParticipantDetails().setSkillLevel(Arrays.asList(new Tag(rank)));
			// review.setTemporaryKey(tempKey);
		}
	}

	@RequestMapping(value = "/progressive/append/gzip/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<FileUploadResponse> appendGameLog(@PathVariable("reviewId") final String id,
			@RequestParam("data") MultipartFile data) throws Exception {
		log.debug("Appending to " + id);
		FileUploadResponse response = null;

		// Are there several games in the single file?
		byte[] logInfo = getGzipLogInfo(data);
		String logToAppend = new String(logInfo, "UTF-8");
		// log.debug(logToAppend);
		log.debug("appending " + logToAppend.split("\n").length + " lines");

		Review review = reviewRepo.findById(id);
		String newOngoingReplay = review.getTemporaryReplay();
		review.setTemporaryReplay(newOngoingReplay + logToAppend + "\n");

		reviewRepo.save(review);

		return new ResponseEntity<FileUploadResponse>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/progressive/finalize/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<FileUploadResponse> finalize(@PathVariable("reviewId") final String id,
			@RequestBody ReviewCreationParams data) throws Exception {
		log.debug("Finalizing " + id);
		FileUploadResponse response = null;

		Review review = reviewRepo.findById(id);
		review.setPublished(true);
		review.setUploaderApplicationKey(data.getUploaderApplicationKey());
		review.setUploaderToken(data.getUploaderToken());

		addMetaData(data, review);

		reviewApi.createReview(review);

		reviewService.triggerReviewCreationJobs(review);

		List<String> ids = new ArrayList<>();
		ids.add(review.getId());
		log.debug("Finalized review " + review);
		// log.debug(review.getTemporaryReplay());

		response = new FileUploadResponse(ids, null);

		return new ResponseEntity<FileUploadResponse>(response, HttpStatus.OK);
	}

	// End progressive

	@RequestMapping(value = "/upload/draft", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<FileUploadResponse> uploadDraft(@RequestParam("data") MultipartFile data)
			throws Exception {
		return uploadDraftWithToken(data, null, null);
	}

	@RequestMapping(value = "/upload/draft/{applicationKey}/{userToken}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<FileUploadResponse> uploadDraftWithToken(
			@RequestParam("data") MultipartFile data, @PathVariable(value = "applicationKey") String applicationKey,
			@PathVariable(value = "userToken") String userToken) throws Exception {
		FileUploadResponse response = null;

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		log.debug("Starting draft upload for " + currentUser + " " + applicationKey + " " + userToken);
		User user = userRepo.findByUsername(currentUser);

		// Are there several games in the single file?
		byte[] logInfo = data.getBytes();
		BufferedReader reader = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(logInfo)));

		StringBuilder draft = new StringBuilder();
		String line;
		while ((line = reader.readLine()) != null) {
			draft.append(line);
		}
		log.debug("\tbuilt draft");

		// Process file
		Review review = new Review();
		review.setMediaType("arena-draft");
		review.setReviewType("arena-draft");
		review.setFileType("json");
		review.setSport(Review.Sport.load("hearthstone"));
		review.setTemporaryReplay(draft.toString());
		review.setReplay("true");
		review.setUploaderApplicationKey(applicationKey);
		review.setUploaderToken(userToken);

		if (user != null) {
			review.setAuthorId(user.getId());
			review.setAuthor(user.getUsername());
		}
		review.setVisibility("restricted");
		review.setPublished(true);

		reviewApi.createReview(review);
		reviewService.triggerReviewCreationJobs(review);
		log.debug("Created review " + review);

		List<String> ids = new ArrayList<>();
		ids.add(review.getId());
		response = new FileUploadResponse(ids, null);
		return new ResponseEntity<FileUploadResponse>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/upload/review", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("data") MultipartFile data)
			throws Exception {
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		User user = userRepo.findByUsername(currentUser);

		List<Review> reviews = new ArrayList<>();

		// Are there several games in the single file?
		byte[] logInfo = data.getBytes();
		return processReviewLogs(user, reviews, logInfo);
	}

	private ResponseEntity<FileUploadResponse> processReviewLogs(User user, List<Review> reviews, byte[] logInfo)
			throws IOException, ZipException {
		FileUploadResponse response;
		BufferedReader reader = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(logInfo)));
		List<String> games = hsReplay.extractGames(null, "text/plain", reader);
		log.debug("\tbuilt " + games.size() + " games");

		// Process file
		List<String> ids = new ArrayList<>();
		for (String game : games) {
			Review review = new Review();
			review.setFileType("text/plain");
			review.setSport(Review.Sport.load("hearthstone"));
			review.setTemporaryReplay(game);
			review.setReplay("true");
			if (user != null) {
				review.setAuthorId(user.getId());
				review.setAuthor(user.getUsername());
			}
			review.setVisibility("restricted");
			// review.setTemporaryKey(tempKey);

			reviewApi.createReview(review);
			reviews.add(review);
			ids.add(review.getId());
			log.debug("Created review " + review);
		}

		response = new FileUploadResponse(ids, null);
		return new ResponseEntity<FileUploadResponse>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/upload/review/gzip", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<FileUploadResponse> uploadGzipFile(@RequestParam("data") MultipartFile data)
			throws Exception {

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		User user = userRepo.findByUsername(currentUser);
		List<Review> reviews = new ArrayList<>();

		// Are there several games in the single file?
		byte[] logInfo = getGzipLogInfo(data);
		return processReviewLogs(user, reviews, logInfo);
	}

	@RequestMapping(value = "/review/publish/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> publishReview2(@PathVariable("reviewId") final String id)
			throws IOException {
		return publishReview(id);
	}

	@RequestMapping(value = "/review/{reviewId}", method = RequestMethod.PUT)
	public @ResponseBody ResponseEntity<Review> updateReview(@PathVariable("reviewId") final String id,
			@RequestBody Review inputReview) throws IOException {
		log.debug("Updating info for " + id + " with " + inputReview);
		return reviewApi.updateAndKeepNullInfo(id, inputReview);
	}

	@RequestMapping(value = "/review/{reviewId}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Review> getReview(@PathVariable("reviewId") final String id)
			throws IOException {
		return reviewApi.getReviewById(id);
	}

	@RequestMapping(value = "/review/{reviewId}/publish", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<Review> publishReview(@PathVariable("reviewId") final String id)
			throws IOException {
		log.debug("Publishing " + id);
		Review review = reviewRepo.findById(id);
		return reviewApi.publish(id, review);
	}

	private byte[] getGzipLogInfo(MultipartFile data) throws Exception {
		byte[] bytes = data.getBytes();

		ByteArrayInputStream bytein = new ByteArrayInputStream(bytes);
		GZIPInputStream gzin = new GZIPInputStream(bytein);
		ByteArrayOutputStream byteout = new ByteArrayOutputStream();

		int res = 0;
		byte buf[] = new byte[1024];
		while (res >= 0) {
			res = gzin.read(buf, 0, buf.length);
			if (res > 0) {
				byteout.write(buf, 0, res);
			}
		}
		byte uncompressed[] = byteout.toByteArray();
		return uncompressed;
	}
}
