package com.coach.review;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.core.notification.ExecutorProvider;
import com.coach.core.security.User;
import com.coach.profile.Profile;
import com.coach.profile.ProfileRepository;
import com.coach.user.UserRepository;

import lombok.AllArgsConstructor;

@Component
public class ReviewService {

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	UserRepository userRepo;

	@Autowired
	ProfileRepository profileRepo;

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
			review.updateFullTextSearch();
			review.updateCommentsCount();
			denormalizeReputations(review);
			reviewRepo.save(review);
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
}