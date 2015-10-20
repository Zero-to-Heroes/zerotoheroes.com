package com.coach.review;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CommentParser {

	private static final String TIMESTAMP_REGEX = "\\d?\\d:\\d?\\d(:\\d\\d\\d)?(\\|\\d?\\d:\\d?\\d(:\\d\\d\\d)?(\\([a-z0-9]+\\))?r?)?(\\+)?(p)?(s(\\d?\\.?\\d?\\d?)?)?(L(\\d?\\.?\\d?\\d?)?)?";
	private static final String TIMESTAMP_ONLY_REGEX = "\\d?\\d:\\d?\\d(:\\d\\d\\d)?";

	@Autowired
	ReviewRepository reviewRepo;

	public void parseComment(Review review, Comment comment) {
		Pattern pattern = Pattern.compile(TIMESTAMP_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(comment.getText());
		while (matcher.find()) {
			String group = matcher.group();
			log.debug("Found matching pattern: " + group);
			String reviewId = extractReviewId(group);
			if (reviewId != null) {
				Review refReview = reviewRepo.findById(reviewId);
				if (refReview != null) review.addExternalLink(reviewId, refReview.getKey());
			}
		}
	}

	private String extractReviewId(String group) {
		if (group.indexOf('(') != -1) {
			String reviewId = group.substring(group.indexOf('(') + 1, group.indexOf(')'));
			log.debug("Extracted review ID is " + reviewId);
			return reviewId;
		}
		return null;
	}

	public boolean hasTimestamp(String text) {
		Pattern pattern = Pattern.compile(TIMESTAMP_ONLY_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(text);
		return matcher.find();
	}

}
