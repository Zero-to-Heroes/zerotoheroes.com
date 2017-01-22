package com.coach.review.events;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.aws.messaging.core.NotificationMessagingTemplate;
import org.springframework.stereotype.Component;

import com.amazonaws.services.sns.AmazonSNS;
import com.coach.review.Review;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
// http://forecastcloudy.net/2011/07/12/using-amazons-simple-notification-service-sns-and-simple-queue-service-sqs-for-a-reliable-push-processing-of-queues/
// http://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.html#SendMessageToHttp.subscribe
public class ReviewEmitter {

	@Value("${review.update.sns.topic}")
	private String snsTopic;

	private final NotificationMessagingTemplate notificationMessagingTemplate;

	@Autowired
	public ReviewEmitter(AmazonSNS amazonSns) {
		notificationMessagingTemplate = new NotificationMessagingTemplate(amazonSns);
	}

	public void emitReviewUpdate(Review review) {
		log.debug("Emitting new review created message " + review.getId());
		notificationMessagingTemplate.sendNotification(snsTopic, review.getId(), review.getId());
	}

}
