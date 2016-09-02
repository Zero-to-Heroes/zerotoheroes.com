package com.coach.review;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.core.notification.ExecutorProvider;
import com.coach.core.security.User;
import com.coach.profile.Profile;
import com.coach.profile.ProfileRepository;
import com.coach.review.journal.CommentJournal;
import com.coach.review.journal.CommentJournalRepository;
import com.coach.review.journal.ReputationJournal;
import com.coach.review.journal.ReputationJournalRepository;
import com.coach.review.journal.ReviewJournal;
import com.coach.review.journal.ReviewJournalRepository;
import com.coach.user.UserRepository;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ReviewService {

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	UserRepository userRepo;

	@Autowired
	ProfileRepository profileRepo;

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
				review.updateFullTextSearch();
				review.updateCommentsCount();
				denormalizeReputations(review);
				// log.debug("updating review");
				reviewRepo.save(review);
				// log.debug("updated refiew", review);
			}
			catch (Exception e) {
				log.error("Exception updating the review", e);
				throw e;
			}
		}
	}

	protected void denormalizeReputations(Review review) {
		Iterable<String> userIds = review.getAllAuthors();
		Iterable<User> users = userRepo.findAll(userIds);

		Map<String, User> userMap = new HashMap<>();
		for (User user : users) {
			userMap.put(user.getId(), user);
		}

		Iterable<Profile> profiles = profileRepo.findAllByUserId(userIds);
		Map<String, Profile> profileMap = new HashMap<>();
		for (Profile profile : profiles) {
			profileMap.put(profile.getUserId(), profile);
		}
		review.normalizeUsers(userMap, profileMap);
		review.highlightNoticeableVotes(userMap, profileMap);
	}

	public void triggerReviewCreationJobs(Review review) {
		if (review.getAuthorId() != null && review.getSport() != null) {
			ReviewJournal journal = new ReviewJournal(review.getId(), review.getAuthorId(),
					review.getSport().getKey().toLowerCase(), review.getCreationDate());
			reviewJournalRepo.save(journal);
		}
	}

	public void triggerCommentCreationJobs(Review review, Comment comment) {
		if (comment.getAuthorId() != null && review.getSport() != null) {
			CommentJournal journal = new CommentJournal(review.getId(), comment.getAuthorId(),
					review.getSport().getKey().toLowerCase(), comment.getCreationDate());
			commentJournalRepo.save(journal);
		}
	}

	public void triggerReputationChangeJobs(Review review, HasReputation item, int changeValue) {
		if (item.getAuthorId() != null && review.getSport() != null) {
			ReputationJournal journal = new ReputationJournal(review.getId(), item.getId(), item.getAuthorId(),
					review.getSport().getKey().toLowerCase(), new Date(), changeValue);
			reputationJournalRepo.save(journal);
		}
	}
}
