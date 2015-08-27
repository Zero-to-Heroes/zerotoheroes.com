package com.coach.review;

import java.util.Date;

import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import com.coach.review.access.ReviewRepository;

@Slf4j
@Component
public class UploadProgressCallback implements IUploadProgress {

	private static final double UPDATE_DELAY = 1000;

	@Autowired
	ReviewRepository repo;

	@Autowired
	MongoTemplate mongoTemplate;

	@Setter
	private String reviewId;

	private double lastUpdate;

	@Override
	public void onUploadProgress(double progress) {
		log.debug("In callback head of method, progress is " + progress);
		log.debug("review id is " + reviewId);
		log.debug("Current time is " + new Date().getTime());
		log.debug("next update tick is at " + (lastUpdate + UPDATE_DELAY));
		if (progress >= 100 || new Date().getTime() > lastUpdate + UPDATE_DELAY) {
			Review tempReview = repo.findById(reviewId);
			log.debug("temp review is " + tempReview);
			// log.debug("current time is " + new Date().getTime() +
			// " and last update is " + lastUpdate);
			if (tempReview != null) {
				log.debug("In callback, progress is " + progress);
				lastUpdate = new Date().getTime();
				// log.debug("Loaded review " + tempReview);
				tempReview.setTreatmentCompletion(progress);
				mongoTemplate.save(tempReview);
				// log.debug("Updated review");
			}
		}
	}

}
