package com.zerotoheroes.reviewprocessing;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.aws.messaging.core.NotificationMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.amazonaws.services.sns.AmazonSNS;
import com.coach.plugin.hearthstone.HearthstoneMetaData;
import com.coach.review.Review;

@Component
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
	}

	private String message(Review review) {
		HearthstoneMetaData metaData = (HearthstoneMetaData) review.getMetaData();
		JSONObject json = new JSONObject();
		json.put("reviewId", review.getId());
		json.put("userId", review.getAuthorId());
		json.put("playerName", metaData.getPlayerName());
		json.put("playerClass", metaData.getPlayerClass());
		json.put("playerRank", metaData.getSkillLevel());
		json.put("opponentName", metaData.getOpponentName());
		json.put("opponentClass", metaData.getOpponentClass());
		json.put("opponentRank", metaData.getOpponentSkillLevel());
		json.put("result", metaData.getWinStatus());
		json.put("coinPlay", metaData.getPlayCoin());
		json.put("gameMode", metaData.getGameMode());
		
		String deck = review.getPluginData("hearthstone", "parseDecks").get("reviewDeck");
		if (!StringUtils.isEmpty(deck) && deck.length() > 3) {
			deck = deck.substring(1, deck.length() - 1);
		}
		json.put("playerDecklist", deck);
		
		return json.toString();
	}

}
