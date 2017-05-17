package com.coach.plugin.hearthstone.deck;

import java.util.Map;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class AbstractDeckParser {

	protected void saveDeck(Map<String, String> pluginData, String deckId, Deck deck) throws JsonProcessingException {

		// Don't save empty decks
		if (CollectionUtils.isEmpty(deck.getClassCards()) && CollectionUtils.isEmpty(deck.getNeutralCards())) { return; }

		// Post-process deck
		if (StringUtils.isNotEmpty(deck.getTitle())) {
			deck.setTitle(deck.getTitle().replaceAll("\"", ""));
		}

		String jsonDeck = new ObjectMapper().writeValueAsString(deck);
		pluginData.put(deckId, jsonDeck);
	}
}
