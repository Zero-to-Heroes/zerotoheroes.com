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

	private static final String SUFFIX = "/";
	private static final String FOLDER_NAME = "videos";

	@Autowired
	ReviewRepository repo;

	@Autowired
	MongoTemplate mongoTemplate;

	@Autowired
	TranscodingStatusNotification notification;

	private final String username, password;
	private final String inputBucketName, outputBucketName;
	private final String pipelineId;
	private final String endpoint;

	private String reviewId;

	@Autowired
	public Transcoder(@Value("${videos.bucket.input.name}") String inputBucketName,
			@Value("${videos.bucket.output.name}") String outputBucketName, @Value("${s3.username}") String username,
			@Value("${s3.password}") String password, @Value("${transcoding.pipeline.id}") String pipelineId,
			@Value("${transcoding.endpoint}") String endpoint) {
		super();
		this.username = username;
		this.password = password;
		this.inputBucketName = inputBucketName;
		this.outputBucketName = outputBucketName;
		this.pipelineId = pipelineId;
		this.endpoint = endpoint;
		log.debug("Initializing transcoder with buckets: " + inputBucketName + ", " + outputBucketName + ", "
				+ username);
	}

	public void transcode() {
		log.debug("Starting transcoding for review id " + reviewId);
		// First retrieve the video we want to transcode
		Review review = repo.findById(reviewId);
		if (review.getTreatmentCompletion() == 100) {
			log.debug("Transcoding already done, aborting");
		}

		String keyName = FOLDER_NAME + SUFFIX + UUID.randomUUID();
		// log.debug("Assigning final key: " + keyName);
		review.setKey(keyName);
		mongoTemplate.save(review);
		// log.debug("Updated review " + review);

		// Setup the job input using the provided input key.
		JobInput input = new JobInput().withKey(review.getTemporaryKey());
		if (review.getVideoFramerateRatio() == 2) {
			input.withFrameRate("60");
		}
		// log.debug("Created input: " + input);

		// Output configuration
		String startTime = formatTime(review.getBeginning());
		String duration = formatTime((review.getEnding() - review.getBeginning()) / 2);
		TimeSpan timeSpan = new TimeSpan().withStartTime(startTime).withDuration(duration);
		Clip composition = new Clip().withTimeSpan(timeSpan);
		CreateJobOutput output = new CreateJobOutput().withKey(keyName).withPresetId(GENERIC_480p_16_9_PRESET_ID)
				.withComposition(composition);
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
		notification.listen(job.getId());
	}

	private String formatTime(int beginning) {
		return beginning / 1000 + "." + beginning % 1000;
	}

	public void setReviewId(String reviewId) {
		this.reviewId = reviewId;
		notification.setReviewId(reviewId);
	}
}
