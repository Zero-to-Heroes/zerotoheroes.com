package com.coach.review.scoring.scorers;

import org.springframework.stereotype.Component;

import com.coach.plugin.hearthstone.HearthstoneMetaData;
import com.coach.review.Review;

@Component
public class WinLossScorer {

	public float score(Review review) {
		float score = 0;
		if (review.getMetaData() != null && review.getMetaData() instanceof HearthstoneMetaData
				&& "lost".equals(((HearthstoneMetaData) review.getMetaData()).getWinStatus())) {
			score += 1;
		}
		return score;
	}

}
