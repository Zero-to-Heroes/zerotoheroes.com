package com.coach.sport;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.amazonaws.util.StringUtils;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;

@Component
public class SportManager {

	@Autowired
	SportRepository sportRepo;

	@Autowired
	ReviewRepository reviewRepo;

	public Sport findById(String sportId) {
		if (StringUtils.isNullOrEmpty(sportId)) { return null; }

		sportId = sportId.toLowerCase();

		Sport sport = sportRepo.findById(sportId);
		if (sport == null) {
			sport = new Sport();
			sport.setId(sportId);
			sportRepo.save(sport);
		}

		if (sport.getSubscribers() == null || sport.getSubscribers().isEmpty()) {

			List<Review> all = reviewRepo.findBySport(sportId);
			for (Review review : all) {
				sport.addSubscriber(review.getAuthorId());
			}
			sportRepo.save(sport);
		}
		return sport;
	}

	// public void addNewReviewActivity(Review review) {
	// Activity activity = new Activity(new Date(), Activity.Type.NEW_REVIEW,
	// review.getAuthor(), review.getUrl(),
	// review.getTitle());
	// addActivity(review, activity);
	// }
	//
	// public void addNewCommentActivity(Review review, Comment comment) {
	// Activity activity = new Activity(new Date(), Activity.Type.NEW_COMMENT,
	// comment.getAuthor(), review.getUrl(),
	// review.getTitle());
	// addActivity(review, activity);
	// }
	//
	// public void addReviewUpdatedActivity(User user, Review review) {
	// Activity activity = new Activity(new Date(), Activity.Type.UPDATE_REVIEW,
	// user.getUsername(), review.getUrl(),
	// review.getTitle());
	// addActivity(review, activity);
	// }
	//
	// public void addCommentUpdatedActivity(User user, Review review, Comment
	// comment) {
	// Activity activity = new Activity(new Date(),
	// Activity.Type.UPDATE_COMMENT, user.getUsername(), review.getUrl(),
	// review.getTitle());
	// addActivity(review, activity);
	// }
	//
	// public void addMarkedCommentHelpfulActivity(User user, Review review,
	// Comment comment) {
	// Activity activity = new Activity(new Date(),
	// Activity.Type.HELPFUL_COMMENT, user.getUsername(),
	// review.getUrl(), review.getTitle());
	// addActivity(review, activity);
	// }
	//
	// private void addActivity(Review review, Activity activity) {
	// Sport sport = findById(review.getSport().getKey());
	// sport.addActivity(activity);
	// sportRepo.save(sport);
	// }

}
