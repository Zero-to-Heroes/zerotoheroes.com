package com.coach.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.core.notification.ExecutorProvider;
import com.coach.core.security.User;

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

	@AllArgsConstructor
	private class UpdateExecutor implements Runnable {
		private final User user;

		@Override
		public void run() {
			userRepo.save(user);
		}
	}
}
