package com.coach.sport;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.amazonaws.util.StringUtils;

@Component
public class SportManager {

	@Autowired
	SportRepository sportRepo;

	public Sport findById(String sportId) {
		if (StringUtils.isNullOrEmpty(sportId)) return null;

		sportId = sportId.toLowerCase();

		Sport sport = sportRepo.findById(sportId);
		if (sport == null) {
			sport = new Sport();
			sport.setId(sportId);
			sportRepo.save(sport);
		}
		return sport;
	}

}
