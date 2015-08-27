package com.coach.review.access;

import org.springframework.web.multipart.MultipartFile;

import com.coach.review.IUploadProgress;

public interface IFileStorage {

	String storeFile(MultipartFile file, IUploadProgress callback);

}
