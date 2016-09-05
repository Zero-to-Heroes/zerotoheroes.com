package com.coach.plugin.hearthstone;

import org.springframework.stereotype.Component;

import com.zerotoheroes.hsgameparser.xmlparser.GameParser;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@Getter
public class GameParserProvider {

	private GameParser gameParser;

	public GameParserProvider() {
		try {
			log.debug("building cards list");
			gameParser = new GameParser();
			log.debug("built cards list");
		}
		catch (Exception e) {
			log.error("Could not instanciate game parser", e);
		}
	}
}
