package com.coach.review.video.storage;

public interface IUploadProgress {

	void onUploadProgress(double progress);

	void setReviewId(String id);
}
