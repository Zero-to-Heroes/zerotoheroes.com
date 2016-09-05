package com.coach.activities;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthority;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/activities")
@Slf4j
public class ActivitiesApiHandler {

	private static final int PAGE_SIZE = 40;

	@Autowired
	UserRepository userRepo;

	@Autowired
	ActivityRepository activityRepo;

	@RequestMapping(value = "/{sport}", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<ListActivityResponse> getLatestActivities(
			@PathVariable("sport") final String sport) {

		log.debug("Retrieving activities for " + sport);

		// No sport in input
		if (StringUtils
				.isNullOrEmpty(sport)) { return new ResponseEntity<ListActivityResponse>((ListActivityResponse) null,
						HttpStatus.BAD_REQUEST); }

		// Anonymous user
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		User user = userRepo.findByUsername(currentUser);

		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		if (StringUtils.isNullOrEmpty(currentUser)
				|| UserAuthority.isAnonymous(authorities)) { return new ResponseEntity<ListActivityResponse>(
						(ListActivityResponse) null, HttpStatus.NOT_FOUND); }

		// Newest at the top
		Sort sort = new Sort(Sort.Direction.DESC, Arrays.asList("creationDate"));

		int pageNumber = 0;
		PageRequest pageRequest = new PageRequest(pageNumber, PAGE_SIZE, sort);

		String userId = user.getId();

		Page<Activity> page = activityRepo.findPageableBySportAndUserId(sport, userId, pageRequest);

		List<Activity> activities = page.getContent();
		ListActivityResponse response = new ListActivityResponse(activities);
		response.setTotalPages(page.getTotalPages());

		return new ResponseEntity<ListActivityResponse>(response, HttpStatus.OK);
	}
}
