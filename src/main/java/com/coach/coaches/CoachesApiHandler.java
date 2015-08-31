package com.coach.coaches;

import java.util.ArrayList;
import java.util.List;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.amazonaws.util.StringUtils;
import com.coach.review.Review;
import com.coach.review.access.ReviewRepository;

@RepositoryRestController
@RequestMapping(value = "/api/coaches")
@Slf4j
public class CoachesApiHandler {

	@Autowired
	ReviewRepository reviewRepo;

	@RequestMapping(value = "/{reviewId}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<List<Coach>> getReviewById(@PathVariable("reviewId") final String id) {
		log.debug("Retrieving coaches");
		Review review = reviewRepo.findById(id);
		log.debug("For review id: " + id);
		String sport = review.getSport();
		log.debug("And sport " + sport + ".");
		List<Coach> coaches = getAllCoachesForSport(sport);
		log.debug("Giving full list of coaches " + coaches);
		return new ResponseEntity<List<Coach>>(coaches, HttpStatus.OK);
	}

	private List<Coach> getAllCoachesForSport(String sport) {
		sport = StringUtils.trim(sport);
		log.debug("Initial list of coaches: " + CoachRepository.allCoaches);
		List<Coach> ret = new ArrayList<Coach>();
		for (Coach coach : CoachRepository.allCoaches) {
			if (coach.getSport().toString().equals(sport)) {
				ret.add(coach);
			}
		}
		return ret;
	}
}
