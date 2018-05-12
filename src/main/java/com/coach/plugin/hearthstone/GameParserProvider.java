package com.coach.plugin.hearthstone;

import org.springframework.stereotype.Component;

import com.zerotoheroes.hsgameparser.db.CardsList;
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
			log.error("!!!!!!!!!!!!!!!!!!! INIT !!!!!!!!!!!!!!!!");
			log.debug("building cards list");
			CardsList cardsList = CardsList.create();
			log.debug("Created cards list with " + cardsList.getDbCards().size() + " cards. ");
			try {
			    log.debug("find card by id: " + cardsList.findDbCard("ICC_215"));
				log.debug("Text card is " + cardsList.dbCardFromDbfId(31));
			}
			catch (Exception e) {
				log.error("Could not call fromDbfId");
				e.printStackTrace();
			}

			gameParser = new GameParser(cardsList);
			log.debug("built cards list");
		}
		catch (Exception e) {
			log.error("Could not instanciate game parser", e);
		}
	}
}
