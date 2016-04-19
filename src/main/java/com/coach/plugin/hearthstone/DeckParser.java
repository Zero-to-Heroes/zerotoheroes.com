package com.coach.plugin.hearthstone;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang.StringUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import com.coach.plugin.Plugin;
import com.coach.review.HasText;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class DeckParser implements Plugin {

	private static final String HPWN_DECK_ID_REGEX = "\\[?(http:\\/\\/www\\.hearthpwn\\.com\\/decks\\/)([\\d\\-a-zA-Z]+)\\]?";
	private static final String HPNW_DECK_HOST_URL = "http://www.hearthpwn.com/decks/";

	private static final String HSDECKS_DECK_ID_REGEX = "\\[?(http:\\/\\/www\\.hearthstone-decks\\.com\\/deck\\/voir/)([\\d\\-a-zA-Z]+)\\]?";
	private static final String HSDECKS_DECK_HOST_URL = "http://www.hearthstone-decks.com/deck/voir/";

	@Override
	public String getName() {
		return "parseDecks";
	}

	@Override
	public String execute(String currentUser, Map<String, String> pluginData, HasText textHolder) throws IOException {
		log.debug("Executing deckparser plugin");

		// First look at whether there is a deck attached to the review
		String reviewDeck = pluginData.get("reviewDeck");
		if (StringUtils.isNotEmpty(reviewDeck)) {
			parseHearthpwnDeck(pluginData, reviewDeck);
			parseHearthstoneDecksDeck(pluginData, reviewDeck);
		}

		String initialText = textHolder.getText();

		parseHearthpwnDeck(pluginData, initialText);
		parseHearthstoneDecksDeck(pluginData, initialText);
		return initialText;
	}

	private void parseHearthstoneDecksDeck(Map<String, String> pluginData, String initialText)
			throws IOException, JsonProcessingException {
		Pattern pattern = Pattern.compile(HSDECKS_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			String deckId = matcher.group(2);

			// Don't override existing decks
			if (pluginData.get(deckId) != null) {
				continue;
			}

			String deckUrl = HSDECKS_DECK_HOST_URL + deckId;
			log.debug("Trying to scrape deck data for deck " + deckUrl);

			Document doc = Jsoup.connect(deckUrl).userAgent("Mozilla").get();

			Deck deck = new Deck();
			deck.title = doc.select(".deck h1").text();

			Elements classCards = doc.select("#liste_cartes #cartes_classe tbody tr");
			Elements neutralCards = doc.select("#liste_cartes #cartes_neutre tbody tr");

			for (Element element : classCards) {
				// log.debug("Parsing class card " + element);
				Elements qtyElement = element.select(".quantite");
				// log.debug("\tQty " + qtyElement);
				Elements cardElement = element.select(".zecha-popover a");
				// log.debug("\tCard " + cardElement);
				Card card = new Card(cardElement.attr("real_id"), qtyElement.text().trim());
				// log.debug("\tBuilt card " + card);
				deck.classCards.add(card);
			}

			for (Element element : neutralCards) {
				// log.debug("Parsing class card " + element);
				Elements qtyElement = element.select(".quantite");
				// log.debug("\tQty " + qtyElement);
				Elements cardElement = element.select(".zecha-popover a");
				// log.debug("\tCard " + cardElement);
				Card card = new Card(cardElement.attr("real_id"), qtyElement.text().trim());
				// log.debug("\tBuilt card " + card);
				deck.neutralCards.add(card);
			}

			String jsonDeck = new ObjectMapper().writeValueAsString(deck);

			log.debug("jsonDeck" + jsonDeck);
			pluginData.put(deckId, jsonDeck);
		}
	}

	private void parseHearthpwnDeck(Map<String, String> pluginData, String initialText)
			throws IOException, JsonProcessingException {
		Pattern pattern = Pattern.compile(HPWN_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			String deckId = matcher.group(2);

			// Don't override existing decks
			if (pluginData.get(deckId) != null) {
				continue;
			}

			String deckUrl = HPNW_DECK_HOST_URL + deckId;
			// log.debug("Trying to scrape deck data for deck " + deckUrl);

			Document doc = Jsoup.connect(deckUrl).userAgent("Mozilla").get();

			Deck deck = new Deck();
			deck.title = doc.select(".deck-title").text();

			Elements classCards = doc.select(".t-deck-details-card-list.class-listing td");
			Elements neutralCards = doc.select(".t-deck-details-card-list.neutral-listing td");

			for (Element element : classCards) {
				String cardString = element.text();
				if (cardString.contains("×")) {
					Card card = new Card(cardString.split("×")[0].trim(), cardString.split("×")[1].trim());
					deck.classCards.add(card);
				}

			}
			for (Element element : neutralCards) {
				String cardString = element.text();
				if (cardString.contains("×")) {
					Card card = new Card(cardString.split("×")[0].trim(), cardString.split("×")[1].trim());
					deck.neutralCards.add(card);
				}
			}

			String jsonDeck = new ObjectMapper().writeValueAsString(deck);

			log.debug("jsonDeck" + jsonDeck);
			pluginData.put(deckId, jsonDeck);
		}
	}

	@Data
	private static class Deck {
		private String title;
		private final List<Card> classCards = new ArrayList<>();
		private final List<Card> neutralCards = new ArrayList<>();
	}

	@AllArgsConstructor
	@Data
	private static class Card {
		String name;
		String amount;
	}
}
