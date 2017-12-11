package com.coach.thirdprtyintegration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.core.security.User;
import com.coach.user.UserRepository;

@Component
public class ExternalApplicationAuthenticationService {

	@Autowired
	ExternalApplicationAuthenticationRepository externalApplicationAuthenticationRepository;

	@Autowired
	UserRepository userRepository;

	public User loadUser(String uploaderApplicationKey, String uploaderToken) {
		AccountLink link = externalApplicationAuthenticationRepository
				.findByApplicationKeyAndToken(uploaderApplicationKey, uploaderToken);
		User user = null;
		if (link != null) {
			user = userRepository.findById(link.getUserId());
		}
		return user;
	}

	public void storeLink(String id, String applicationKey, String userToken) {
		AccountLink link = new AccountLink(id, applicationKey, userToken);
		externalApplicationAuthenticationRepository.save(link);
	}

	public void removeLink(String applicationKey, String userToken) {
		externalApplicationAuthenticationRepository.deleteByApplicationKeyAndToken(applicationKey, userToken);
	}
}
