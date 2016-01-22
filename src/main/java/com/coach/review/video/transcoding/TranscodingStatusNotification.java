package com.coach.review.video.transcoding;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.sqs.AmazonSQS;
import com.amazonaws.services.sqs.AmazonSQSClient;
import com.coach.core.notification.SlackNotifier;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.subscription.SubscriptionManager;

@Slf4j
@Component
public class TranscodingStatusNotification {

	@Autowired
	ReviewRepository repo;

	@Autowired
	SlackNotifier slackNotifier;

	@Autowired
	SubscriptionManager subscriptionManager;

	@Autowired
	MongoTemplate mongoTemplate;

	private final String username, password;
	private final String sqsQueueUrl;

	@Autowired
	public TranscodingStatusNotification(@Value("${s3.username}") String username,
			@Value("${s3.password}") String password, @Value("${transcoding.sqs.queue.url}") String sqsQueueUrl) {
		super();
		this.username = username;
		this.password = password;
		this.sqsQueueUrl = sqsQueueUrl;
	}

	public void listen(final String jobId, final String reviewId) {
		log.debug("Listing for job id: " + jobId);
		BasicAWSCredentials credentials = new BasicAWSCredentials(username, password);
		AmazonSQS amazonSqs = new AmazonSQSClient(credentials);
		log.debug("Acquired amazonSQS client");

		log.debug("Setting up notification worker for queue " + sqsQueueUrl);
		final SqsQueueNotificationWorker sqsQueueNotificationWorker = new SqsQueueNotificationWorker(amazonSqs,
				sqsQueueUrl);
		Thread notificationThread = new Thread(sqsQueueNotificationWorker);
		notificationThread.start();
		log.debug("Starting notification thread");

		// Create a handler that will wait for this specific job to complete.
		JobStatusNotificationHandler handler = new JobStatusNotificationHandler() {
			@Override
			public void handle(JobStatusNotification jobStatusNotification) {
				if (jobStatusNotification.getJobId().equals(jobId)) {
					log.debug("Processing job status: " + jobStatusNotification);

					if (jobStatusNotification.getState().isTerminalState()) {
						log.debug("Completing transcoding for review id " + reviewId);
						Review review = repo.findById(reviewId);
						if (review.isTranscodingDone()) {
							log.warn("Video already transcoded, should not come back here");
							return;
						}
						log.debug("Loaded review " + review);
						review.setTranscodingDone(true);
						mongoTemplate.save(review);
						log.debug("Updated review: " + review);

						sqsQueueNotificationWorker.shutdown();
						log.debug("Job completed, shutting down");
					}
				}
				else {
					log.debug("Job ids don't match " + jobId + " " + jobStatusNotification.getJobId());
					log.debug("" + jobStatusNotification);
				}
			}
		};
		sqsQueueNotificationWorker.addHandler(handler);
	}

}
