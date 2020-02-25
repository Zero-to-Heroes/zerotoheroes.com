package com.coach.review.replay;

import com.coach.plugin.ReplayPlugin;
import com.coach.plugin.hearthstone.HSReplay;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.sport.SportManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ReplayProcessor {

	@Autowired
	SportManager sportManager;

	@Autowired
	AutowireCapableBeanFactory beanFactory;

//	@Autowired
//	SlackNotifier slackNotifier;

	@Autowired
	ReviewRepository repo;

	public boolean processReplayFile(final Review review, String phase) throws Exception {
		com.coach.sport.Sport sportEntity = sportManager.findById("hearthstone");
		boolean updated = false;
		ReplayPlugin replayPlugin = new HSReplay();
		beanFactory.autowireBean(replayPlugin);
		boolean isCorrectType = replayPlugin.getMediaTypes().contains(review.getMediaType());
		boolean isCorrectPhase =
				replayPlugin.getPhase().equals("all")
				|| replayPlugin.getPhase().equals(phase);

		if (isCorrectType && isCorrectPhase) {
			log.debug("Applying plugin " + replayPlugin);
			updated |= replayPlugin.transformReplayFile(review);
			log.debug("Plugin applied");
		}
		return updated;
	}
}
