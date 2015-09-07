package com.coach.review.video.storage;

public interface IUploadProgress {

	double onUploadProgress(String reviewId, double progress, double previousUpdate);

	// void setReviewId(String id);
}
