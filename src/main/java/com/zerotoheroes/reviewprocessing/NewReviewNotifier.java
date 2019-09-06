package com.zerotoheroes.reviewprocessing;

import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.aws.messaging.core.NotificationMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.amazonaws.services.sns.AmazonSNS;
import com.coach.plugin.hearthstone.HearthstoneMetaData;
import com.coach.review.Review;

import java.text.SimpleDateFormat;

@Component
@Slf4j
public class NewReviewNotifier {
	
	private final NotificationMessagingTemplate notificationMessagingTemplate;
	
	@Value("${review.published.sns.topic}")
	private String snsTopic;

	@Autowired
	public NewReviewNotifier(AmazonSNS amazonSns) {
		this.notificationMessagingTemplate = new NotificationMessagingTemplate(amazonSns);
	}

	public void notifyNewPublishedReview(Review publishedReview) {
		this.notificationMessagingTemplate.sendNotification(
				snsTopic, 
				message(publishedReview), 
				"New published review");
		log.debug("New review notified");
	}

	private String message(Review review) {
		HearthstoneMetaData metaData = (HearthstoneMetaData) review.getMetaData();
		JSONObject json = new JSONObject();
		json.put("reviewId", review.getId());
		json.put("userId", review.getAuthorId());
		// So that we have a way to identify and query the reviews created by third-party apps
		json.put("uploaderToken", review.getUploaderApplicationKey() + "-" + review.getUploaderToken());
		json.put("playerName", metaData.getPlayerName());
		json.put("playerClass", metaData.getPlayerClass());
		json.put("playerCardId", metaData.getPlayerCardId());
		json.put("playerRank", metaData.getSkillLevel());
		json.put("opponentName", metaData.getOpponentName());
		json.put("opponentClass", metaData.getOpponentClass());
		json.put("opponentCardId", metaData.getOpponentCardId());
		json.put("opponentRank", metaData.getOpponentSkillLevel());
		json.put("result", metaData.getWinStatus());
		json.put("coinPlay", metaData.getPlayCoin());
		json.put("gameMode", metaData.getGameMode());
		json.put("gameFormat", metaData.getGameFormat());
		json.put("creationDate", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS").format(review.getCreationDate()));

		String deck = review.getPluginData("hearthstone", "parseDecks").get("reviewDeck");
		if (!StringUtils.isEmpty(deck) && deck.length() > 3) {
			deck = deck.substring(1, deck.length() - 1);
            json.put("playerDecklist", deck);
        }
        log.debug("Publishing new review created message: " + json.toString());

		return json.toString();
	}

}
