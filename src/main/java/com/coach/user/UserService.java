package com.coach.user;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.amazonaws.util.StringUtils;
import com.coach.core.notification.ExecutorProvider;
import com.coach.core.security.User;
import com.coach.core.security.UserAuthority;

import lombok.AllArgsConstructor;

@Component
public class UserService {

	@Autowired
	UserRepository userRepo;

	@Autowired
	private ExecutorProvider executorProvider;

	public void updateAsync(User user) {
		Runnable runnable = new UpdateExecutor(user);
		executorProvider.getExecutor().submit(runnable);
	}

	public User getLoggedInUser() {
		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
				.getAuthorities();
		if (StringUtils.isNullOrEmpty(currentUser) || UserAuthority.isAnonymous(authorities)) { return null; }

		User user = userRepo.findByUsername(currentUser);
		return user;
	}

	@AllArgsConstructor
	private class UpdateExecutor implements Runnable {
		private final User user;

		@Override
		public void run() {
			userRepo.save(user);
		}
	}
}
