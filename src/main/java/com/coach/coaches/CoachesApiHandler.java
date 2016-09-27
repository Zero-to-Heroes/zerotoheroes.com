package com.coach.coaches;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.coach.core.notification.SlackNotifier;
import com.coach.core.security.User;
import com.coach.review.Review.Sport;
import com.coach.review.ReviewRepository;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/coaches")
@Slf4j
public class CoachesApiHandler {

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	SlackNotifier slackNotifier;

	@Autowired
	CoachRepositoryDao dao;

	@RequestMapping(value = "/{identifier}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<CoachInformation> getCoachesInfo(
			@PathVariable("identifier") final String identifier) {

		CoachInformation coach = dao.findByIdentifier(identifier);

		return new ResponseEntity<CoachInformation>(coach, HttpStatus.OK);
	}

	@RequestMapping(value = "/{sport}/all", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<List<CoachInformation>> getCoachesForSport(
			@PathVariable("sport") final String sport) {
		// log.debug("Retrieving coaches");
		if (sport == null) { return new ResponseEntity<List<CoachInformation>>((List<CoachInformation>) null,
				HttpStatus.NOT_FOUND); }

		List<CoachInformation> coaches = getAllCoachesForSport(Sport.load(sport));
		return new ResponseEntity<List<CoachInformation>>(coaches, HttpStatus.OK);
	}

	private List<CoachInformation> getAllCoachesForSport(Sport sport) {
		// log.debug("loading all coaches for " + sport);
		// sport = StringUtils.trim(sport);
		// log.debug("Initial list of coaches: " + CoachRepository.allCoaches);
		List<CoachInformation> ret = new ArrayList<>();
		// for (Coach coach : CoachRepositoryDao.allCoaches) {
		// if (coach.getSport().equals(sport)) {
		// CoachInformation coachInformation = coach.toCoachInformation();
		// ret.add(coachInformation);
		// }
		// }
		for (User user : dao.getAllCoaches(sport)) {
			CoachInformation coachInformation = user.getCoachInformation();
			if (coachInformation.getName() == null) {
				coachInformation.setName(user.getUsername());
			}
			if (coachInformation.getEmail() == null) {
				coachInformation.setEmail(user.getEmail());
			}
			coachInformation.setReputation(user.getReputation(sport));
			coachInformation.setUsername(user.getUsername());
			coachInformation.setId(user.getId());
			ret.add(coachInformation);
		}
		return ret;
	}
}
