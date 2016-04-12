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

@Component
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
		return profile;
	}

	public Profile getLoggedInProfile() {
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		Profile profile = null;
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) { return null; }

		User user = userRepo.findByUsername(currentUser);
		profile = getProfile(user.getId());
		return profile;
	}
}
