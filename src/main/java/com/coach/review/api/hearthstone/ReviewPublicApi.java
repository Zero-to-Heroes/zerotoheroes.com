package com.coach.review.api.hearthstone;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.zip.GZIPInputStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
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
import com.coach.review.Review;
import com.coach.review.ReviewApiHandler;
import com.coach.review.ReviewRepository;
import com.coach.review.ReviewService;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

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
	public @ResponseBody ResponseEntity<FileUploadResponse> initReview() throws Exception {
		FileUploadResponse response = null;
		Review review = new Review();
		review.setFileType("text/plain");
		review.setSport(Review.Sport.load("hearthstone"));
		review.setReplay("true");
		review.setVisibility("restricted");
		review.setTemporaryReplay("");
		review.setReviewType("game-replay");
		review.setUseV2comments(true);
		// review.setTemporaryKey(tempKey);

		reviewRepo.save(review);
		List<String> ids = new ArrayList<>();
		ids.add(review.getId());
		log.debug("Created review " + review);

		response = new FileUploadResponse(ids, null);
		return new ResponseEntity<FileUploadResponse>(response, HttpStatus.OK);
	}

	@RequestMapping(value = "/progressive/append/gzip/{reviewId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<FileUploadResponse> appendGameLog(@PathVariable("reviewId") final String id,
			@RequestParam("data") MultipartFile data) throws Exception {
		log.debug("Appending to " + id);
		FileUploadResponse response = null;

		// Are there several games in the single file?
		byte[] logInfo = getLogInfo(data);
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
	public @ResponseBody ResponseEntity<FileUploadResponse> finalize(@PathVariable("reviewId") final String id)
			throws Exception {
		log.debug("Finalizing " + id);
		FileUploadResponse response = null;

		Review review = reviewRepo.findById(id);
		review.setPublished(true);
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

	@RequestMapping(value = "/upload/gzip", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("data") MultipartFile data)
			throws Exception {
		FileUploadResponse response = null;

		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();

		// Disallow anonymous access for now
		// if (StringUtils.isNullOrEmpty(currentUser) ||
		// UserAuthority.isAnonymous(authorities)) {
		// response = new FileUploadResponse(null,
		// "Anonymous access is not yet supported. You need to create an account
		// (on the site itself for now), "
		// + "then first login in with a request to /api/login with your
		// credentials (doc to come), then pass the X-Auth-Token you'll receive"
		// + "in the header of the request");
		// return new ResponseEntity<FileUploadResponse>(response,
		// HttpStatus.FORBIDDEN);
		// }
		//
		User user = userRepo.findByUsername(currentUser);
		// if (user == null) {
		// response = new FileUploadResponse(null,
		// "No user has been found that match the token you sent in input.
		// Please relogin and try again");
		// return new ResponseEntity<FileUploadResponse>(response,
		// HttpStatus.NOT_FOUND);
		// }

		List<Review> reviews = new ArrayList<>();

		// Are there several games in the single file?
		byte[] logInfo = getLogInfo(data);
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

	private byte[] getLogInfo(MultipartFile data) throws Exception {
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
