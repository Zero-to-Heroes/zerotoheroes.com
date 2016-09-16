package com.coach.review.replay;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.stereotype.Component;

import com.coach.core.notification.ExecutorProvider;
import com.coach.core.notification.SlackNotifier;
import com.coach.plugin.Plugin;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.Review;
import com.coach.sport.SportManager;

import lombok.AllArgsConstructor;
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
	private ExecutorProvider executorProvider;

	public void processReplayFile(final Review review) {
		Runnable runnable = new ReplayProcessorRunnable(review, slackNotifier);
		executorProvider.getExecutor().submit(runnable);
	}

	@AllArgsConstructor
	private class ReplayProcessorRunnable implements Runnable {

		private final Review review;
		private final SlackNotifier slackNotifier;

		@Override
		public void run() {
			com.coach.sport.Sport sportEntity = sportManager.findById(review.getSport().getKey());
			for (String pluginClass : sportEntity.getPlugins()) {
				try {
					Plugin plugin = (Plugin) Class.forName(pluginClass).newInstance();

					if (plugin instanceof ReplayPlugin) {
						beanFactory.autowireBean(plugin);
						ReplayPlugin replayPlugin = (ReplayPlugin) plugin;
						// Keep backward compatibility for when there was no
						// media type attached to a review
						// log.debug("Trying to apply player plugin " + plugin);
						if (review.getMediaType() == null && replayPlugin.getMediaType() == null
								|| review.getMediaType() != null
										&& review.getMediaType().equals(replayPlugin.getMediaType())) {
							log.debug("Applying plugin " + plugin);
							replayPlugin.transformReplayFile(review);
							log.debug("Plugin applied");
						}
					}
				}
				catch (Exception e) {
					log.warn("Incorrect plugin execution " + pluginClass, e);
					slackNotifier.notifyError(e, "Exception during plugin execution", pluginClass, review);
				}
			}
		};

	}

}
