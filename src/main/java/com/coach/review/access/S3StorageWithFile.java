package com.coach.review.access;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Date;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.event.ProgressListener;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.transfer.TransferManager;
import com.amazonaws.services.s3.transfer.Upload;
import com.coach.review.IUploadProgress;

@Slf4j
@Component
public class S3StorageWithFile implements IFileStorage {

	private static final String SUFFIX = "/";
	private static final String FOLDER_NAME = "videos";

	private final String bucketName;

	@Autowired
	public S3StorageWithFile(@Value("${videos.bucket.name}") String bucketName) {
		super();
		this.bucketName = bucketName;
	}

	public String storeFile(File file, long fileSize, IUploadProgress callback) {

		// Initialize the folders. Should be done only once, and not at each
		// call
		AWSCredentials credentials = new ProfileCredentialsProvider().getCredentials();
		AmazonS3 s3client = new AmazonS3Client(credentials);
		log.info("created client");

		s3client.createBucket(bucketName);
		log.info("created bucket");

		createFolder(bucketName, FOLDER_NAME, s3client);
		log.info("created folder");

		// Build the random key name
		String keyName = FOLDER_NAME + SUFFIX + UUID.randomUUID();

		// Get the transfer manager to allow upload from an input stream. And,
		// the upload is asynchronous (could be an issue if something goes
		// wrong, we'll have to look at that later)
		TransferManager transferManager = new TransferManager(new ProfileCredentialsProvider());

		// cf
		// http://docs.aws.amazon.com/AmazonS3/latest/dev/HLuploadFileJava.html
		PutObjectRequest request = new PutObjectRequest(bucketName, keyName, file);
		Upload upload = transferManager.upload(request.withCannedAcl(CannedAccessControlList.PublicRead));
		upload.addProgressListener((ProgressListener) progressEvent -> callback.onUploadProgress(upload.getProgress()
				.getPercentTransferred()));
		upload.addProgressListener((ProgressListener) progressEvent -> {
			if (upload.getProgress().getPercentTransferred() >= 100) {
				file.delete();
			}
		});

		return keyName;
	}

	@Override
	public String storeFile(MultipartFile multipart, IUploadProgress callback) {
		String key = null;
		File file = convert(multipart);
		key = storeFile(file, multipart.getSize(), callback);
		// And delete the file
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

	public File convert(MultipartFile file) {
		File convFile = new File(file.getOriginalFilename() + new Date().getTime());
		try {
			long time = new Date().getTime();
			log.info("Converting multipart file to standard file");
			convFile.createNewFile();
			FileOutputStream fos = new FileOutputStream(convFile);
			fos.write(file.getBytes());
			fos.close();
			log.info("Conversion done in " + (new Date().getTime() - time));
		}
		catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return convFile;
	}

}
