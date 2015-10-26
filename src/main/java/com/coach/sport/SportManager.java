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
		if (StringUtils.isNullOrEmpty(sportId)) return null;

		sportId = sportId.toLowerCase();

		Sport sport = sportRepo.findById(sportId);
		if (sport == null) {
			sport = new Sport();
			sport.setId(sportId);
			sportRepo.save(sport);
		}

		if (sport.getSubscribers() == null || sport.getSubscribers().isEmpty()) {

			List<Review> all = reviewRepo.findAll(null, sportId);
			for (Review review : all) {
				sport.addSubscriber(review.getAuthorId());
			}
			sportRepo.save(sport);
		}
		return sport;
	}

}
