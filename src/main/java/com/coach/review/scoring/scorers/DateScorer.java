package com.coach.review.scoring.scorers;

import java.util.Date;

import org.springframework.stereotype.Component;

@Component
public class DateScorer {

	public static final long TIME_UNTIL_DECREASE = 3600 * 24 * 2;

	public float score(Date publicationDate) {
		if (publicationDate == null) { return -10000; }

		float score = 0;

		Date now = new Date();
		long elapsedSeconds = (now.getTime() - publicationDate.getTime()) / 1000;
		if (elapsedSeconds < TIME_UNTIL_DECREASE) {
			score = elapsedSeconds;
		}
		else {
			score = 2 * TIME_UNTIL_DECREASE - elapsedSeconds;
		}
		score = score / 100000f;

		return score;
	}

}
