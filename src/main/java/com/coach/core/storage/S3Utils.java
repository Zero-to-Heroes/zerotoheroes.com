package com.coach.core.storage;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.AccessControlList;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.GroupGrantee;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.Permission;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;

@Component
public class S3Utils {

	private final AmazonS3 s3;
	private final String inputBucket, outputBucket;

	@Autowired
	public S3Utils(@Value("${s3.username}") String username, @Value("${s3.password}") String password,
			@Value("${videos.bucket.input.name}") String bucketName,
			@Value("${videos.bucket.output.name}") String outputBucket) {
		super();
		inputBucket = bucketName;
		this.outputBucket = outputBucket;
		s3 = new AmazonS3Client(new BasicAWSCredentials(username, password));
	}

	public String readFromS3(String key) throws IOException {
		S3Object s3object = s3.getObject(new GetObjectRequest(inputBucket, key));
		String fileContents = "";

		BufferedReader reader = new BufferedReader(new InputStreamReader(s3object.getObjectContent()));
		String line;
		while ((line = reader.readLine()) != null) {
			fileContents += line + System.lineSeparator();
		}

		return fileContents;
	}

	public void putToS3(String text, String fileName, String type) throws IOException {

		byte[] textAsBytes = text.getBytes("UTF-8");
		InputStream contentAsStream = new ByteArrayInputStream(textAsBytes);

		ObjectMetadata metaData = new ObjectMetadata();
		metaData.setContentLength(textAsBytes.length);
		metaData.setContentType(type);

		AccessControlList acl = new AccessControlList();
		acl.grantPermission(GroupGrantee.AllUsers, Permission.Read);

		s3.putObject(new PutObjectRequest(outputBucket, fileName, contentAsStream, metaData)
				.withCannedAcl(CannedAccessControlList.PublicRead));
	}
}
