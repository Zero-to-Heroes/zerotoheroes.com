package com.coach.review.replay;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.stereotype.Component;

import com.coach.plugin.Plugin;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.Review;
import com.coach.sport.SportManager;

@Slf4j
@Component
public class ReplayProcessor {

	@Autowired
	SportManager sportManager;

	@Autowired
	AutowireCapableBeanFactory beanFactory;

	public void processReplayFile(Review review) {
		com.coach.sport.Sport sportEntity = sportManager.findById(review.getSport().getKey());
		for (String pluginClass : sportEntity.getPlugins()) {
			try {
				Plugin plugin = (Plugin) Class.forName(pluginClass).newInstance();

				if (plugin instanceof ReplayPlugin) {
					beanFactory.autowireBean(plugin);
					((ReplayPlugin) plugin).transformReplayFile(review);
				}
			}
			catch (Exception e) {
				log.warn("Incorrect plugin execution " + pluginClass, e);
			}
		}
	}

}
