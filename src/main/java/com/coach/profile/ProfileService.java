package com.coach.profile;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.amazonaws.util.StringUtils;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthority;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ProfileService {

	@Autowired
	ProfileRepository profileRepository;
	@Autowired
	UserRepository userRepo;

	public Profile getProfile(String userId) {
		Profile profile = profileRepository.findByUserId(userId);
		if (profile == null) {
			profile = new Profile();
			profile.setUserId(userId);
			profileRepository.save(profile);
		}
		// log.debug("retrieved profile " + profile);
		return profile;
	}

	public Profile getLoggedInProfile() {
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) { return null; }

		return getProfileByUsername(currentUser);
	}

	public void save(Profile profile) {
		// log.debug("saving profile " + profile);
		profileRepository.save(profile);
	}

	public Profile getProfileByUsername(String username) {
		User user = userRepo.findByUsername(username);
		Profile profile = getProfile(user.getId());
		return profile;
	}
}
