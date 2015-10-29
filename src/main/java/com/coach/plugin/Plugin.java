package com.coach.plugin;

import java.util.Map;

import com.coach.review.HasText;

public interface Plugin {

	String execute(String currentUser, Map<String, String> pluginData, HasText textHolder) throws Exception;

	String getName();

}
