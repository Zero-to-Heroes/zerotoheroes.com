package com.coach.review.access;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

import org.springframework.web.multipart.MultipartFile;

import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.event.ProgressListener;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.AbortMultipartUploadRequest;
import com.amazonaws.services.s3.model.CompleteMultipartUploadRequest;
import com.amazonaws.services.s3.model.InitiateMultipartUploadRequest;
import com.amazonaws.services.s3.model.InitiateMultipartUploadResult;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PartETag;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.UploadPartRequest;
import com.coach.review.IUploadProgress;

@Slf4j
// @Component
public class S3StorageLowLevel implements IFileStorage {

	private static final String SUFFIX = "/";
	private static final String BUCKET_NAME = "com.zerotoheroes";
	private static final String FOLDER_NAME = "videos";
	private static final int RETRY_COUNT_LIMIT = 10;

	public String storeFile(InputStream input, long fileSize, IUploadProgress callback) {

		AmazonS3 s3Client = new AmazonS3Client(new ProfileCredentialsProvider());

		// Create a list of UploadPartResponse objects. You get one of these for
		// each part upload.
		List<PartETag> partETags = new ArrayList<PartETag>();

		// Build the random key name
		String keyName = FOLDER_NAME + SUFFIX + UUID.randomUUID();

		// Step 1: Initialize.
		InitiateMultipartUploadRequest initRequest = new InitiateMultipartUploadRequest(BUCKET_NAME, keyName);
		InitiateMultipartUploadResult initResponse = s3Client.initiateMultipartUpload(initRequest);

		long contentLength = fileSize;
		long partSize = 5 * 1024 * 1024; // Set part size to 5 MB.

		try {
			// Step 2: Upload parts.
			long filePosition = 0;
			for (int i = 1; filePosition < contentLength; i++) {
				// Last part can be less than 5 MB. Adjust part size.
				partSize = Math.min(partSize, contentLength - filePosition);

				// Create request to upload a part.
				UploadPartRequest uploadRequest = new UploadPartRequest().withBucketName(BUCKET_NAME).withKey(keyName)
						.withUploadId(initResponse.getUploadId()).withPartNumber(i).withInputStream(input)
						.withPartSize(partSize);
				uploadRequest.setGeneralProgressListener((ProgressListener) progressEvent -> callback
						.onUploadProgress(progressEvent.getBytesTransferred()));

				// repeat the upload until it succeeds.
				boolean anotherPass;
				int retryCount = 0;
				do {
					anotherPass = false; // assume everythings ok
					try {
						log.debug("Uploading part " + i);
						// Upload part and add response to our list.
						PartETag partETag = s3Client.uploadPart(uploadRequest).getPartETag();
						partETags.add(partETag);
					}
					catch (Exception e) {
						log.warn("Upload failed, retrying " + ++retryCount, e);
						anotherPass = true; // repeat
					}
				}
				while (anotherPass && retryCount < RETRY_COUNT_LIMIT);

				filePosition += partSize;
			}

			// Step 3: complete.
			CompleteMultipartUploadRequest compRequest = new CompleteMultipartUploadRequest(BUCKET_NAME, keyName,
					initResponse.getUploadId(), partETags);

			s3Client.completeMultipartUpload(compRequest);
		}
		catch (Exception e) {
			log.error("Exception while uploading file", e);
			s3Client.abortMultipartUpload(new AbortMultipartUploadRequest(BUCKET_NAME, keyName, initResponse
					.getUploadId()));
		}

		return keyName;
	}

	@Override
	public String storeFile(MultipartFile multipart, IUploadProgress callback) {
		String key = null;
		try {
			key = storeFile(multipart.getInputStream(), multipart.getSize(), callback);
		}
		catch (IOException e) {
			log.error("Could not get input stream from multipart file " + multipart);
		}
		return key;
	}

	public void createFolder(String bucketName, String folderName, AmazonS3 client) {
		// create meta-data for your folder and set content-length to 0
		ObjectMetadata metadata = new ObjectMetadata();
		metadata.setContentLength(0);
		// create empty content
		InputStream emptyContent = new ByteArrayInputStream(new byte[0]);
		// create a PutObjectRequest passing the folder name suffixed by /
		PutObjectRequest putObjectRequest = new PutObjectRequest(bucketName, folderName + SUFFIX, emptyContent,
				metadata);
		// send request to S3 to create folder
		client.putObject(putObjectRequest);
	}

}
