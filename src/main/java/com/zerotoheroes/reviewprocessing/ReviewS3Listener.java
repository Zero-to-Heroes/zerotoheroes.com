package com.zerotoheroes.reviewprocessing;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.aws.messaging.listener.Acknowledgment;
import org.springframework.cloud.aws.messaging.listener.SqsMessageDeletionPolicy;
import org.springframework.cloud.aws.messaging.listener.annotation.SqsListener;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.event.S3EventNotification;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.util.json.Jackson;
import com.coach.review.Review;
import com.coach.review.ReviewApiHandler;
import com.coach.review.ReviewService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/endpoint/reviewS3listener")
@Slf4j
// http://forecastcloudy.net/2011/07/12/using-amazons-simple-notification-service-sns-and-simple-queue-service-sqs-for-a-reliable-push-processing-of-queues/
// http://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.html#SendMessageToHttp.subscribe
public class ReviewS3Listener {

	@Value("${videos.bucket.input.name}")
	private String inputBucket;

	@Autowired
	private ReviewService reviewService;

	@Autowired
	private ReviewApiHandler reviewApiHandler;

	@Autowired
	private AmazonS3 s3;

	// https://github.com/spring-cloud/spring-cloud-aws/issues/100
	// FIXME: properly handle exceptions - resend the failed uploads to a
	// specific queue, so that they could be reprocessed later on?
	@SqsListener(value = "${replay.uploaded.queue.name}", deletionPolicy = SqsMessageDeletionPolicy.NEVER)
	public void queueListener(String message, Acknowledgment acknowledgment) throws Exception {
		// Manual acknowledgement to avoid waiting for process completion. It
		// will also allow us to have finer control later on
		acknowledgment.acknowledge().get();
		String messageAsString = Jackson.jsonNodeOf(message).get("Message").toString().replaceAll("\\\\\"", "\"");
		S3EventNotification s3event = S3EventNotification.parseJson(messageAsString.substring(1, messageAsString.length() - 1));
		S3EventNotification.S3Entity s3Entity = s3event.getRecords().get(0).getS3();

		String bucketName = s3Entity.getBucket().getName();
		String key = s3Entity.getObject().getKey();
		ObjectMetadata metadata = s3.getObjectMetadata(bucketName, key);
		Review review = reviewService.loadReview(metadata.getUserMetaDataOf("review-id"));

		// The message can be received several times
		if (review.isPublished()) { return; }

		review.setUploaderApplicationKey(metadata.getUserMetaDataOf("application-key"));
		review.setUploaderToken(metadata.getUserMetaDataOf("user-key"));
		review.setFileType(metadata.getUserMetaDataOf("file-type"));
		review.setText(metadata.getUserMetaDataOf("review-text"));
		review.setPublished(true);
		review.setPublicationDate(new Date());
		review.setVisibility("restricted");
		review.setClaimableAccount(true);

		// FIXME: hack to easily reuse existing methods
		String outputKey = review.buildKey(key, "hearthstone/replay");
		s3.copyObject(bucketName, key, inputBucket, outputKey);
		review.setTemporaryKey(outputKey);

		reviewApiHandler.createReview(review);
	}
}
