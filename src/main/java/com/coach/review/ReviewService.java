package com.coach.review;

import com.coach.core.notification.ExecutorProvider;
import com.coach.plugin.hearthstone.HearthstoneMetaData;
import com.coach.profile.ProfileRepository;
import com.coach.review.journal.CommentJournalRepository;
import com.coach.review.journal.ReputationJournalRepository;
import com.coach.review.journal.ReviewJournalRepository;
import com.coach.user.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ReviewService {

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	UserRepository userRepo;

	@Autowired
	ProfileRepository profileRepo;
//
//	@Autowired
//	SlackNotifier slackNotifier;

	@Autowired
	ReviewJournalRepository reviewJournalRepo;

	@Autowired
	CommentJournalRepository commentJournalRepo;

	@Autowired
	ReputationJournalRepository reputationJournalRepo;

	@Autowired
	private ExecutorProvider executorProvider;

	public void updateAsync(Review review) {
		Runnable runnable = new UpdateExecutor(review);
		executorProvider.getExecutor().submit(runnable);
	}

	@AllArgsConstructor
	private class UpdateExecutor implements Runnable {
		private final Review review;

		@Override
		public void run() {
			try {
//				review.updateFullTextSearch();
//				review.updateCommentsCount();
//				denormalizeReputations(review);
				if (review.getMetaData() == null) {
					review.setMetaData(new HearthstoneMetaData());
				}
				review.getMetaData().extractSkillLevel(review.getParticipantDetails().getSkillLevel());
				// log.debug("updating review");
				reviewRepo.save(review);
				log.debug("updated refiew" + review);
			}
			catch (Exception e) {
				log.warn("Exception updating the review, retrying", e);
				try {
					reviewRepo.save(review);
					log.debug("Updated review " + review);
				}
				catch (Exception e2) {
					log.error("Exception updating the review", e2);
					throw e;
				}
			}
		}
	}

	public Review loadReview(String reviewId) {
		return reviewRepo.findById(reviewId);
	}
}
