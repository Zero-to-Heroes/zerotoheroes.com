package com.coach.review.scoring.scorers;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.coach.plugin.hearthstone.HearthstoneMetaData;
import com.coach.review.Review;
import com.coach.tag.Tag;

@Component
public class FieldsScorer {

	public float score(Review review) {
		float score = 0;
		if (!CollectionUtils.isEmpty(review.getTags())) {
			score += 1;

			for (Tag tag : review.getTags()) {
				if ("Entertainment".equalsIgnoreCase(tag.getText())) {
					// Entertainment games don't need comments
					score -= 10000;
				}
			}
		}
		else if (review.getMetaData() != null && review.getMetaData() instanceof HearthstoneMetaData
				&& ("arena-game".equals(((HearthstoneMetaData) review.getMetaData()).getGameMode())
						|| "arena-draft".equals(((HearthstoneMetaData) review.getMetaData()).getGameMode()))) {
			score += 1;
		}

		if ("hearthstone".equals(review.getStrSport())
				&& !StringUtils.isEmpty(review.getPluginData("hearthstone", "parseDecks").get("reviewDeck"))) {
			score += 1;
		}
		return score;
	}

}
