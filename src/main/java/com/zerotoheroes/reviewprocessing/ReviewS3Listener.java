
package com.zerotoheroes.reviewprocessing;

import com.amazonaws.AmazonClientException;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.event.S3EventNotification;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.util.json.Jackson;
import com.coach.core.notification.SlackNotifier;
import com.coach.plugin.hearthstone.HearthstoneMetaData;
import com.coach.review.ParticipantDetails;
import com.coach.review.Review;
import com.coach.review.Review.Sport;
import com.coach.review.ReviewApiHandler;
import com.coach.review.ReviewService;
import com.coach.tag.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.aws.messaging.listener.Acknowledgment;
import org.springframework.cloud.aws.messaging.listener.SqsMessageDeletionPolicy;
import org.springframework.cloud.aws.messaging.listener.annotation.SqsListener;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Date;
import java.util.Map;

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

	@Autowired
	private SlackNotifier slackNotifier;

	// https://github.com/spring-cloud/spring-cloud-aws/issues/100
	// FIXME: properly handle exceptions - resend the failed uploads to a
	// specific queue, so that they could be reprocessed later on?
	@SqsListener(value = "${replay.uploaded.queue.name}", deletionPolicy = SqsMessageDeletionPolicy.NEVER)
	public void queueListener(String message, Acknowledgment acknowledgment) throws Exception {
		String messageAsString = Jackson.jsonNodeOf(message).get("Message").toString().replaceAll("\\\\\"", "\"");
		S3EventNotification s3event = S3EventNotification
				.parseJson(messageAsString.substring(1, messageAsString.length() - 1));
		S3EventNotification.S3Entity s3Entity = s3event.getRecords().get(0).getS3();

		String bucketName = s3Entity.getBucket().getName();
		String key = s3Entity.getObject().getKey();
		String reviewId = null;
		ObjectMetadata metadata = null;
		try {
			metadata = s3.getObjectMetadata(bucketName, key);
			reviewId = metadata.getUserMetaDataOf("review-id");
			log.debug("Received message to process reviewId " + reviewId);
			log.debug("metadat is " + metadata);
		}
		catch (AmazonClientException e) {
			String errorMessage = String.format("Could not retrieve metadata from s3 from bucket %s and key %s", bucketName, key);
			log.error(errorMessage);
			acknowledgment.acknowledge().get();
			throw new ProcessingException(errorMessage, e);
		}

		Review review = reviewService.loadReview(reviewId);
		if (review == null) {
			log.debug("Review shell with id " + reviewId + " doesn't exist, aborting");
			acknowledgment.acknowledge().get();
			return;
		}

		// The message can be received several times
		if (review.isPublished()) { 
			acknowledgment.acknowledge().get();
			return; 
		}
		log.debug("review " + reviewId + " not yet processed, continuing");

		review.setSport(Sport.HearthStone);
		review.setUploaderApplicationKey(metadata.getUserMetaDataOf("application-key"));
		review.setUploaderToken(metadata.getUserMetaDataOf("user-key"));
		review.setAuthorId(metadata.getUserMetaDataOf("user-id"));
		review.setFileType(metadata.getUserMetaDataOf("file-type"));
		review.setText(metadata.getUserMetaDataOf("review-text"));
		review.setMediaType(metadata.getUserMetaDataOf("game-type"));
		HearthstoneMetaData hsMetaData = (HearthstoneMetaData) review.getMetaData();
		hsMetaData.setDeckstring(undefinedAsNull(metadata.getUserMetaDataOf("deckstring")));
		hsMetaData.setDeckName(undefinedAsNull(metadata.getUserMetaDataOf("deck-name")));
		hsMetaData.setScenarioId(undefinedAsNull(metadata.getUserMetaDataOf("scenario-id")));
		hsMetaData.setBuildNumber(undefinedAsNull(metadata.getUserMetaDataOf("build-number")));
		hsMetaData.setPlayerRank(undefinedAsNull(metadata.getUserMetaDataOf("player-rank")));
		hsMetaData.setOpponentRank(undefinedAsNull(metadata.getUserMetaDataOf("opponent-rank")));
		review.setPublished(true);
		review.setPublicationDate(new Date());
		review.setVisibility("restricted");
		review.setClaimableAccount(true);

		log.debug("preparing to parse game mode and rank");
		parseGameModeAndRank(metadata, review);
		log.debug("preparing to parse deck");
		parseDeck(metadata, review);
		log.debug("deck parsed");

		// FIXME: hack to easily reuse existing methods
		String outputKey = review.buildKey(key, "hearthstone/replay");
		log.debug("Copying to temporary key " + outputKey);
		s3.copyObject(bucketName, key, inputBucket, outputKey);
		review.setTemporaryKey(outputKey);

		log.debug("Done, creating review " + review);
		reviewApiHandler.createReview(review);
		
		// Manual acknowledgement to keep the message in the queue until the process is done and no exceptions 
		// were raised
		acknowledgment.acknowledge().get();
	}

	private String undefinedAsNull(String str) {
		return "undefined".equals(str) ? null : str;
	}

	private void parseGameModeAndRank(ObjectMetadata metadata, Review review) {
		String reviewId = review.getId();
		HearthstoneMetaData hsMetaData = (HearthstoneMetaData) review.getMetaData();
		ParticipantDetails participantDetails = review.getParticipantDetails();
		
		if ("TavernBrawl".equalsIgnoreCase(metadata.getUserMetaDataOf("game-mode"))
				|| "tavern-brawl".equalsIgnoreCase(metadata.getUserMetaDataOf("game-mode"))
				|| "Brawl".equalsIgnoreCase(metadata.getUserMetaDataOf("game-mode"))) {
			participantDetails.setSkillLevel(Arrays.asList(new Tag("tavernbrawl")));
			hsMetaData.setGameMode("tavern-brawl");
		}
		// We don't want to add the Wild tag to tavern brawls
		else {
			if ("Casual".equalsIgnoreCase(metadata.getUserMetaDataOf("game-mode"))) {
				participantDetails.setSkillLevel(Arrays.asList(new Tag("casual")));
				hsMetaData.setGameMode("casual");
			}
			else if ("Practice".equalsIgnoreCase(metadata.getUserMetaDataOf("game-mode"))) {
				participantDetails.setSkillLevel(Arrays.asList(new Tag("practice")));
				hsMetaData.setGameMode("practice");
			}
			else if ("Friendly".equalsIgnoreCase(metadata.getUserMetaDataOf("game-mode"))) {
				participantDetails.setSkillLevel(Arrays.asList(new Tag("friendly")));
				hsMetaData.setGameMode("friendly");
			}
			else {
				Integer rank = StringUtils.isEmpty(metadata.getUserMetaDataOf("player-rank"))
								|| metadata.getUserMetaDataOf("player-rank").contains("legend")
						? null 
						: Integer.valueOf(metadata.getUserMetaDataOf("player-rank"));
				Integer legendRank = !StringUtils.isEmpty(metadata.getUserMetaDataOf("player-rank"))
								&& metadata.getUserMetaDataOf("player-rank").contains("legend")
						? Integer.parseInt(metadata.getUserMetaDataOf("player-rank").split("-")[1])
						: null;
				Integer opponentRank = StringUtils.isEmpty(metadata.getUserMetaDataOf("opponent-rank"))
								|| metadata.getUserMetaDataOf("opponent-rank").contains("legend")
						? null 
						: Integer.valueOf(metadata.getUserMetaDataOf("opponent-rank"));
				Integer opponentLegendRank = !StringUtils.isEmpty(metadata.getUserMetaDataOf("opponent-rank"))
								&& metadata.getUserMetaDataOf("opponent-rank").contains("legend")
						? Integer.parseInt(metadata.getUserMetaDataOf("opponent-rank").split("-")[1])
						: null;
				
				if ("Ranked".equalsIgnoreCase(metadata.getUserMetaDataOf("game-mode"))) {
					hsMetaData.setGameMode("ranked");
					try {
						log.debug("Parsing metadata for " + reviewId);
						if (rank != null) {
							Tag rankTag = new Tag("Rank " + rank);
							participantDetails.setSkillLevel(Arrays.asList(rankTag));
							hsMetaData.setSkillLevel(rank.floatValue());
							hsMetaData.setOpponentSkillLevel(opponentRank != null ? opponentRank.floatValue() : null);
						}
						else if (legendRank != null) {
							participantDetails.setSkillLevel(Arrays.asList(new Tag("Legend")));
							hsMetaData.setSkillLevel(-legendRank.floatValue());
							hsMetaData.setOpponentSkillLevel(opponentLegendRank != null ? -opponentLegendRank.floatValue() : null);
						}
					}
					catch (Exception e) {
					    log.error("Could not parse ranked metadata", e);
						slackNotifier.notifyError(e, "Error while setting game rank " + metadata);
					}
				}
				else if ("Arena".equalsIgnoreCase(metadata.getUserMetaDataOf("game-mode"))) {
					hsMetaData.setGameMode("arena");
					// TODO: later on, extract that on a sports-specific class parser
					try {
						if (rank != null) {
							Tag rankTag = new Tag("arena" + rank + "wins");
							participantDetails.setSkillLevel(Arrays.asList(rankTag));
							hsMetaData.setSkillLevel(rank.floatValue());
							hsMetaData.setOpponentSkillLevel(rank.floatValue());
						}
					}
					catch (Exception e) {
                        log.error("Could not parse arena metadata", e);
						slackNotifier.notifyError(e, "Error while setting game rank " + metadata);
					}
				}
			}

			if ("wild".equalsIgnoreCase(metadata.getUserMetaDataOf("game-format"))) {
				review.getTags().add(new Tag("Wild"));
				hsMetaData.setGameFormat("wild");
			}
			else {
				hsMetaData.setGameFormat("standard");
			}
		}
		log.debug("Updated meta data: " + hsMetaData);
	}

	private void parseDeck(ObjectMetadata metadata, Review review) {
		String deckstring = undefinedAsNull(metadata.getUserMetaDataOf("deckstring"));
		if (!StringUtils.isEmpty(deckstring)) {
			Map<String, String> deckPluginData = review.getPluginData("hearthstone", "parseDecks");
			deckPluginData.put("reviewDeck", "[" + deckstring + "]");
		}
	}
}
