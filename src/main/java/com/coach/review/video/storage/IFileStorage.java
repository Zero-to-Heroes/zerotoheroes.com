package com.coach.review.video.storage;

import org.springframework.web.multipart.MultipartFile;

public interface IFileStorage {

	String storeFile(MultipartFile file);

	void setReviewId(String id);

}
