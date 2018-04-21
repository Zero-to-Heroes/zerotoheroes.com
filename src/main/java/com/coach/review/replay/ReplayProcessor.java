package com.coach.review.replay;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.stereotype.Component;

import com.coach.core.notification.SlackNotifier;
import com.coach.plugin.Plugin;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.coach.sport.SportManager;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class ReplayProcessor {

	@Autowired
	SportManager sportManager;

	@Autowired
	AutowireCapableBeanFactory beanFactory;

	@Autowired
	SlackNotifier slackNotifier;

	@Autowired
	ReviewRepository repo;

	public boolean processReplayFile(final Review review, String phase) {
		com.coach.sport.Sport sportEntity = sportManager.findById(review.getSport().getKey());
		boolean updated = false;
		for (String pluginClass : sportEntity.getPlugins()) {
			try {
				Plugin plugin = (Plugin) Class.forName(pluginClass).newInstance();

				if (plugin instanceof ReplayPlugin) {
					beanFactory.autowireBean(plugin);
					ReplayPlugin replayPlugin = (ReplayPlugin) plugin;
					// Keep backward compatibility for when there was no
					// media type attached to a review
					// log.debug("Trying to apply player plugin " + plugin);
					boolean isCorrectType = replayPlugin.getMediaTypes().contains(review.getMediaType());

					boolean isCorrectPhase =
							replayPlugin.getPhase().equals("all")
							|| replayPlugin.getPhase().equals(phase);

					if (isCorrectType && isCorrectPhase) {
						log.debug("Applying plugin " + plugin);
						updated |= replayPlugin.transformReplayFile(review);
						log.debug("Plugin applied");
					}
				}
			}
			catch (Exception e) {
				log.error("Incorrect plugin execution " + pluginClass, e);
				slackNotifier.notifyError(e, "Exception during plugin execution", pluginClass, review);
			}
		}
		return updated;
	}
}
