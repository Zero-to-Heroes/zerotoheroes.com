package com.coach.review.video.storage;

import org.springframework.web.multipart.MultipartFile;

public interface IFileStorage {

	String storeFile(MultipartFile file, String reviewId);

	// void setReviewId(String id);

}
