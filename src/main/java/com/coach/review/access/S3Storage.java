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

import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.event.ProgressEvent;
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
public class S3Storage implements IFileStorage {

	private static final String SUFFIX = "/";
	private static final String FOLDER_NAME = "videos";

	private final String username, password;
	private final String bucketName;

	@Autowired
	public S3Storage(@Value("${videos.bucket.name}") String bucketName, @Value("${s3.username}") String username,
			@Value("${s3.password}") String password) {
		super();
		this.bucketName = bucketName;
		this.username = username;
		this.password = password;
		log.debug("Initializing storage with bucket: " + bucketName + ", username " + username);
	}

	public String storeFile(final File file, long fileSize, final IUploadProgress callback) {

		// Initialize the folders. Should be done only once, and not at each
		// call
		BasicAWSCredentials credentials = new BasicAWSCredentials(username, password);
		// AWSCredentials credentials = new
		// ProfileCredentialsProvider().getCredentials();
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
		TransferManager transferManager = new TransferManager(credentials);
		log.debug("Instanciated transferManager");

		// cf
		// http://docs.aws.amazon.com/AmazonS3/latest/dev/HLuploadFileJava.html
		PutObjectRequest request = new PutObjectRequest(bucketName, keyName, file);
		final Upload upload = transferManager.upload(request.withCannedAcl(CannedAccessControlList.PublicRead));
		log.debug("Sent upload request");
		upload.addProgressListener(new ProgressListener() {

			@Override
			public void progressChanged(ProgressEvent progressEvent) {
				callback.onUploadProgress(upload.getProgress().getPercentTransferred());
			}
		});
		upload.addProgressListener(new ProgressListener() {

			@Override
			public void progressChanged(ProgressEvent progressEvent) {
				if (upload.getProgress().getPercentTransferred() >= 100 && file != null) {
					try {
						log.info("Deleting temporary file");
						file.delete();
					}
					catch (Exception e) {
						log.error("Could not delete file", e);
					}
				}
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
		String extension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
		log.debug("extension is " + extension);
		File convFile = new File(file.getOriginalFilename() + new Date().getTime() + extension);
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
			log.error("Could not convert file to multipart", e);
		}
		return convFile;
	}

}
