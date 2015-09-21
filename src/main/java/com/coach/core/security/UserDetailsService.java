package com.coach.core.security;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AccountStatusUserDetailsChecker;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.amazonaws.util.StringUtils;
import com.coach.user.UserRepository;

@Service
@Slf4j
public class UserDetailsService implements org.springframework.security.core.userdetails.UserDetailsService {

	@Autowired
	private UserRepository userRepository;

	private final AccountStatusUserDetailsChecker detailsChecker = new AccountStatusUserDetailsChecker();

	@Override
	public final User loadUserByUsername(String identifier) throws UsernameNotFoundException {
		log.debug("Loading user from name " + identifier);

		if (StringUtils.isNullOrEmpty(identifier)) throw new UsernameNotFoundException("user not found");

		User user = null;
		if (identifier.contains("@")) {
			user = userRepository.findByEmail(identifier);
		}
		else {
			user = userRepository.findByUsername(identifier);
		}

		log.debug("Loaded user " + user);
		if (user == null) { throw new UsernameNotFoundException("user not found"); }
		detailsChecker.check(user);
		return user;
	}
}
