package com.coach.review.api.hearthstone;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

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
	HSReplay hsReplay;

	@RequestMapping(value = "/upload", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file)
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

		// log.debug("current user " +
		// SecurityContextHolder.getContext().getAuthentication().getName());
		// log.debug("Received file " + file);
		// log.debug("" + file.isEmpty());
		// log.debug(file.getContentType());
		// log.debug(file.getOriginalFilename());
		// log.debug("" + file.getSize());

		List<Review> reviews = new ArrayList<>();

		// Are there several games in the single file?
		BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
		List<String> games = hsReplay.extractGames(null, "text/plain", reader);
		// log.debug("\tbuilt " + games.size() + " games");

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
			// log.debug("Created review " + review);
		}

		response = new FileUploadResponse(ids, null);
		return new ResponseEntity<FileUploadResponse>(response, HttpStatus.OK);
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
}
