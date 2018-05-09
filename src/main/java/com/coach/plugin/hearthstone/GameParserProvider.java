package com.coach.plugin.hearthstone;

import com.zerotoheroes.hsgameparser.db.CardsList;
import org.springframework.stereotype.Component;

import com.zerotoheroes.hsgameparser.metadata.GameParser;

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
			CardsList cardsList = CardsList.create();
			log.debug("Created cards list with " + cardsList.getCards().size() + " cards. ");
//			try {
//				log.debug("Text card is " + cardsList.fromDbfId(31));
//			}
//			catch (Exception e) {
//				log.error("Could not call fromDbfId");
//				e.printStackTrace();
//			}

			gameParser = new GameParser(cardsList);
			log.debug("built cards list");
		}
		catch (Exception e) {
			log.error("Could not instanciate game parser", e);
		}
	}
}
