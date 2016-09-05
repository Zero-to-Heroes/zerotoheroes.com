package com.coach.admin.cron;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.activities.Activity;
import com.coach.activities.ActivityRepository;
import com.coach.activities.NewCommentData;
import com.coach.activities.NewReviewData;
import com.coach.activities.ReputationChangeData;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.review.journal.CommentJournal;
import com.coach.review.journal.ReputationJournal;
import com.coach.review.journal.ReviewJournal;

@Component
public class ActivityHandler {

	@Autowired
	ActivityRepository activityReposistory;

	@Autowired
	ReviewRepository reviewRepository;

	public void handleNewGame(ReviewJournal log) {
		Activity activity = new Activity();
		activity.setCreationDate(new Date());
		activity.setUserId(log.getAuthorId());

		Review review = reviewRepository.findById(log.getReviewId());
		activity.setSport(review.getSport().getKey().toLowerCase());

		NewReviewData data = new NewReviewData();
		data.setReviewId(log.getReviewId());
		data.setReviewTitle(review.getTitle());
		activity.setData(data);

		activityReposistory.save(activity);
	}

	public void handleNewComment(CommentJournal log) {
		Activity activity = new Activity();
		activity.setCreationDate(new Date());
		activity.setUserId(log.getAuthorId());

		Review review = reviewRepository.findById(log.getReviewId());
		activity.setSport(review.getSport().getKey().toLowerCase());

		NewCommentData data = new NewCommentData();
		data.setReviewId(log.getReviewId());
		data.setReviewTitle(review.getTitle());
		activity.setData(data);

		activityReposistory.save(activity);
	}

	public void handleNewVote(ReputationJournal log) {
		Activity activity = new Activity();
		activity.setCreationDate(new Date());
		activity.setUserId(log.getUserId());

		Review review = reviewRepository.findById(log.getReviewId());
		activity.setSport(review.getSport().getKey().toLowerCase());

		ReputationChangeData data = new ReputationChangeData();
		data.setReviewId(log.getReviewId());
		data.setReviewTitle(review.getTitle());
		data.setAmount(log.getChangeValue());
		data.setReason(log.getChangeReason());
		activity.setData(data);

		activityReposistory.save(activity);
	}

}
