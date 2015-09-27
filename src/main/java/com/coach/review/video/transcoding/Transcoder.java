package com.coach.review.video.transcoding;

import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.elastictranscoder.AmazonElasticTranscoder;
import com.amazonaws.services.elastictranscoder.AmazonElasticTranscoderClient;
import com.amazonaws.services.elastictranscoder.model.Clip;
import com.amazonaws.services.elastictranscoder.model.CreateJobOutput;
import com.amazonaws.services.elastictranscoder.model.CreateJobRequest;
import com.amazonaws.services.elastictranscoder.model.Job;
import com.amazonaws.services.elastictranscoder.model.JobInput;
import com.amazonaws.services.elastictranscoder.model.TimeSpan;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;

@Slf4j
@Component
public class Transcoder {

	// http://docs.aws.amazon.com/elastictranscoder/latest/developerguide/system-presets.html
	private static final String GENERIC_480p_16_9_PRESET_ID = "1351620000001-000020";
	// https://console.aws.amazon.com/elastictranscoder/home?region=us-west-2#preset-details:1441828521339-vj8xaf
	private static final String CUSTOM_480p_16_9_NO_AUDIO_PRESET_ID = "1441828521339-vj8xaf";

	private static final String SUFFIX = "/";
	private static final String VIDEO_FOLDER_NAME = "videos";
	private static final String THUMBNAIL_FOLDER_NAME = "thumbnails";

	@Autowired
	ReviewRepository repo;

	@Autowired
	MongoTemplate mongoTemplate;

	@Autowired
	TranscodingStatusNotification notification;

	private final String username, password;
	private final String pipelineId;
	private final String endpoint;

	// private String reviewId;

	@Autowired
	public Transcoder(@Value("${s3.username}") String username, @Value("${s3.password}") String password,
			@Value("${transcoding.pipeline.id}") String pipelineId, @Value("${transcoding.endpoint}") String endpoint) {
		super();
		this.username = username;
		this.password = password;
		this.pipelineId = pipelineId;
		this.endpoint = endpoint;
	}

	public void transcode(String reviewId) {
		log.debug("Starting transcoding for review id " + reviewId);
		// First retrieve the video we want to transcode
		Review review = repo.findById(reviewId);
		if (review.isTranscodingDone()) {
			log.debug("Transcoding already done, aborting");
			return;
		}

		UUID randomUUID = UUID.randomUUID();
		String keyName = VIDEO_FOLDER_NAME + SUFFIX + randomUUID + ".mp4";
		log.debug("Assigning final key: " + keyName);
		review.setKey(keyName);
		review.setFileType("video/mp4");
		String thumbnailKey = THUMBNAIL_FOLDER_NAME + SUFFIX + randomUUID + "_";
		String thumbnailName = thumbnailKey + "00001.png";
		review.setThumbnail(thumbnailName);
		mongoTemplate.save(review);
		log.debug("Updated review " + review);

		// Setup the job input using the provided input key.
		JobInput input = new JobInput().withKey(review.getTemporaryKey());
		log.debug("Created input: " + input);
		log.debug("Detected input properties are " + input.getDetectedProperties());

		// Output configuration
		CreateJobOutput output = new CreateJobOutput().withKey(keyName).withPresetId(GENERIC_480p_16_9_PRESET_ID)
				.withThumbnailPattern(thumbnailKey + "{count}");

		// Hotfix for unsupported formats that you can't play when uploading
		log.debug("Review ending is " + review.getEnding());
		if (review.getEnding() > 0) {
			int beginning = review.getBeginning();
			int intDuration = review.getEnding() - beginning;
			String startTime = formatTime(beginning);
			if (review.getVideoFramerateRatio() == 2) {
				startTime = formatTime(beginning / 2);
				log.debug("doubling frame rate");
				input.withFrameRate("60");

				intDuration = intDuration / 2;
				output.withPresetId(CUSTOM_480p_16_9_NO_AUDIO_PRESET_ID);
			}
			String duration = formatTime(intDuration);
			TimeSpan timeSpan = new TimeSpan().withStartTime(startTime).withDuration(duration);
			Clip composition = new Clip().withTimeSpan(timeSpan);
			output.withComposition(composition);
		}

		log.debug("Created output: " + output);

		BasicAWSCredentials credentials = new BasicAWSCredentials(username, password);
		AmazonElasticTranscoder amazonElasticTranscoder = new AmazonElasticTranscoderClient(credentials);
		amazonElasticTranscoder.setEndpoint(endpoint);
		log.debug("Logged in to AWS Elastic Transcoder");

		CreateJobRequest createJobRequest = new CreateJobRequest().withPipelineId(pipelineId).withInput(input)
				.withOutput(output);
		log.debug("Created job request: " + createJobRequest);
		Job job = amazonElasticTranscoder.createJob(createJobRequest).getJob();
		log.debug("Created job");
		notification.listen(job.getId(), reviewId);
	}

	private String formatTime(int beginning) {
		return beginning / 1000 + "." + beginning % 1000;
	}

	// public void setReviewId(String reviewId) {
	// this.reviewId = reviewId;
	// notification.setReviewId(reviewId);
	// }
}
