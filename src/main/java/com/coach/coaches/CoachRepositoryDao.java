package com.coach.coaches;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import com.coach.core.security.User;
import com.coach.review.Review.Sport;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class CoachRepositoryDao {

	@Autowired
	CoachRepository repo;

	public CoachInformation findById(String coachId) {
		User coach = repo.findOne(coachId);
		CoachInformation ret = null;
		if (coach != null) {
			ret = populateCoachInfo(coach);
		}
		return ret;
	}

	public CoachInformation findByIdentifier(String identifier) {
		User coach = repo.findOne(identifier);
		if (coach == null) {
			coach = repo.findByUsername(identifier);
		}
		CoachInformation ret = null;
		if (coach != null) {
			ret = populateCoachInfo(coach);
		}
		return ret;
	}

	public List<User> getAllCoaches(Sport sport) {
		if (sport == null) { return new ArrayList<User>(); }

		PageRequest pageRequest = new PageRequest(0, 50);
		Page<User> coaches = repo.listCoaches(sport.getKey().toLowerCase(), pageRequest);

		return coaches.getContent();
	}

	private CoachInformation populateCoachInfo(User user) {
		CoachInformation ret = user.getCoachInformation();
		if (ret.getName() == null) {
			ret.setName(user.getUsername());
		}
		if (ret.getEmail() == null) {
			ret.setEmail(user.getEmail());
		}
		ret.setId(user.getId());
		ret.setUsername(user.getUsername());
		return ret;
	}
}
