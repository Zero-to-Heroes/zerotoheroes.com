package com.coach.admin.cron;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.activities.Activity;
import com.coach.activities.ActivityRepository;
import com.coach.activities.NewCommentData;
import com.coach.activities.NewReviewData;
import com.coach.activities.ReputationChangeData;
import com.coach.profile.Profile;
import com.coach.profile.ProfileService;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.review.journal.CommentJournal;
import com.coach.review.journal.ReputationJournal;
import com.coach.review.journal.ReviewJournal;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ActivityHandler {

	@Autowired
	ActivityRepository activityReposistory;

	@Autowired
	ReviewRepository reviewRepository;

	@Autowired
	ProfileService profileService;

	public void handleNewGame(ReviewJournal log, Profile profile) {
		Activity activity = new Activity();
		activity.setCreationDate(new Date());
		activity.setUserId(log.getAuthorId());
		// updateUnreadNotifsCount(log.getAuthorId());

		Review review = reviewRepository.findById(log.getReviewId());
		activity.setSport(review.getSport().getKey().toLowerCase());

		NewReviewData data = new NewReviewData();
		data.setReviewId(log.getReviewId());
		data.setReviewTitle(review.getTitle());
		activity.setData(data);

		activityReposistory.save(activity);
	}

	public void handleNewComment(CommentJournal log, Profile profile) {
		Activity activity = new Activity();
		activity.setCreationDate(new Date());
		activity.setUserId(log.getAuthorId());
		// updateUnreadNotifsCount(profile);

		Review review = reviewRepository.findById(log.getReviewId());
		activity.setSport(review.getSport().getKey().toLowerCase());

		NewCommentData data = new NewCommentData();
		data.setReviewId(log.getReviewId());
		data.setReviewTitle(review.getTitle());
		activity.setData(data);

		activityReposistory.save(activity);
	}

	public void handleNewVote(ReputationJournal log, Profile profile) {
		Activity activity = new Activity();
		activity.setCreationDate(new Date());
		activity.setUserId(log.getUserId());
		updateUnreadNotifsCount(profile);

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

	private void updateUnreadNotifsCount(Profile profile) {
		profile.getActivitiesStats().incrementUnread();
	}

}
