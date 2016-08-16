package com.coach.plugin.hearthstone;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;

import com.coach.core.notification.SlackNotifier;
import com.coach.core.storage.S3Utils;
import com.coach.plugin.Plugin;
import com.coach.review.HasText;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class DeckParser implements Plugin {

	private static final String HPWN_DECK_ID_REGEX = "\\[?(http:\\/\\/www\\.hearthpwn\\.com\\/decks\\/)([\\d\\-a-zA-Z]+)\\]?";
	private static final String HPNW_DECK_HOST_URL = "http://www.hearthpwn.com/decks/";

	private static final String HPWN_TEMP_DECK_ID_REGEX = "\\[?(http:\\/\\/www\\.hearthpwn\\.com\\/deckbuilder\\/)([a-zA-Z]+)#([\\d\\-a-zA-Z\\:\\;]+)\\]?";
	// private static final String HPNW_TEMP_DECK_HOST_URL =
	// "http://www.hearthpwn.com/deckbuilder/";

	private static final String HSDECKS_DECK_ID_REGEX = "\\[?(http:\\/\\/www\\.hearthstone-decks\\.com\\/deck\\/voir\\/)([\\d\\-a-zA-Z]+)\\]?";
	private static final String HSDECKS_DECK_HOST_URL = "http://www.hearthstone-decks.com/deck/voir/";

	private static final String ZTH_DECK_ID_REGEX = "\\[(http:\\/\\/www\\.zerotoheroes\\.com\\/r\\/hearthstone\\/)([\\da-zA-Z]+)\\/.*\\]";
	// private static final String ZTH_DECK_ID_REGEX =
	// "\\[?(http:\\/.*localhost.*\\/r\\/hearthstone\\/)([\\da-zA-Z]+)\\/.*\\]?";

	private static final String HEARTHARENA_DECK_ID_REGEX = "\\[?(http:\\/\\/www\\.heartharena\\.com\\/arena-run\\/)([\\d\\-a-zA-Z]+)\\]?";
	private static final String HEARTHARENA_DECK_HOST_URL = "http://www.heartharena.com/arena-run/";

	private static final String ARENADRAFTS_DECK_ID_REGEX = "\\[?(http:\\/\\/(www\\.)?arenadrafts\\.com\\/Arena\\/View\\/)([\\d\\-a-zA-Z\\-]+)\\]?";
	private static final String ARENADRAFTS_DECK_HOST_URL = "http://arenadrafts.com/Arena/View/";

	private static final String HSTOPDECKS_DECK_ID_REGEX = "\\[?(http:\\/\\/www\\.hearthstonetopdecks\\.com\\/decks\\/)([\\d\\-a-zA-Z\\-]+)\\]?";
	private static final String HSTOPDECKS_DECK_HOST_URL = "http://www.hearthstonetopdecks.com/decks/";

	private static final String ICYVEINS_DECK_ID_REGEX = "\\[?(http:\\/\\/www\\.icy-veins\\.com\\/hearthstone\\/)([\\d\\-a-zA-Z\\-]+)\\]?";
	private static final String ICYVEINS_DECK_HOST_URL = "http://www.icy-veins.com/hearthstone/";

	private static final String MANACRYSTALS_DECK_ID_REGEX = "\\[?(https:\\/\\/manacrystals\\.com\\/deck_guides\\/)([\\d\\-a-zA-Z\\-]+)\\]?";
	private static final String MANACRYSTALS_DECK_HOST_URL = "https://manacrystals.com/deck_guides/";

	// https://regex101.com/r/kW4oW3/1
	private static final String HEARTHSTATS_DECK_ID_REGEX = "\\[?(http:\\/\\/(?:hss|hearthstats)\\.(?:io|net)\\/d(?:ecks)?\\/)([\\d\\w\\-]+)(\\??\\S*)\\]?";
	private static final String HEARTHSTATS_DECK_HOST_URL = "http://hearthstats.net/decks/";

	private static final String HEARTHHEAD_DECK_ID_REGEX = "\\[?(http:\\/\\/www\\.hearthhead\\.com\\/deck=)([\\d\\w\\-]+)\\/?([\\d\\w\\-]+)?\\]?";
	private static final String HEARTHHEAD_DECK_HOST_URL = "http://www.hearthhead.com/deck=";

	@Autowired
	ReviewRepository repo;

	@Autowired
	S3Utils s3utils;

	@Autowired
	SlackNotifier slackNotifier;

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
			parseDecks(pluginData, reviewDeck);
		}

		String initialText = textHolder.getText();
		parseDecks(pluginData, initialText);

		return initialText;
	}

	private void parseDecks(Map<String, String> pluginData, String initialText) throws IOException {
		parseHearthpwnDeck(pluginData, initialText);
		parseHearthpwnTempDeck(pluginData, initialText);
		parseHearthstoneDecksDeck(pluginData, initialText);
		parseZeroToHeroesDeck(pluginData, initialText);
		parseHearthArenaDeck(pluginData, initialText);
		parseArenaDraftsDeck(pluginData, initialText);
		parseHsTopDecksDeck(pluginData, initialText);
		parseIcyVeinsDeck(pluginData, initialText);
		parseManaCrystalsDeck(pluginData, initialText);
		parseHearthStatsDeck(pluginData, initialText);
		// parseHearthStatsDeckFull(pluginData, initialText);
		parseHearthHeadDeck(pluginData, initialText);
	}

	private void parseHearthHeadDeck(Map<String, String> pluginData, String initialText) throws IOException {
		Pattern pattern = Pattern.compile(HEARTHHEAD_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			String deckId = matcher.group(2) + matcher.group(3);

			// Don't override existing decks (performance)
			if (pluginData.get(deckId) != null) {
				continue;
			}

			String deckUrl = HEARTHHEAD_DECK_HOST_URL + deckId;
			// log.debug("Trying to scrape deck data for deck " + deckUrl);

			Document doc = Jsoup.parse(new URL(deckUrl).openStream(), "UTF-8", HEARTHHEAD_DECK_HOST_URL);

			Deck deck = new Deck();
			deck.title = doc.select("#deckguide-name").text();
			deck.url = deckUrl;

			Elements cards = doc.select(".main .deckguide-cards .deckguide-cards-type li");

			for (Element element : cards) {
				// log.debug("Parsing class card " + element);
				// Elements qtyElement = element.text();
				String cardName = element.select("a.card").text();
				String quantityText = element.text().split(cardName).length == 0 ? ""
						: element.text().split(cardName)[1];
				String quantity = "1";
				if (StringUtils.isNotEmpty(quantityText)) {
					quantity = quantityText.split("x")[1];
				}
				Card card = new Card(cardName, quantity);
				// log.debug("\tBuilt card " + card);
				deck.classCards.add(card);
			}

			saveDeck(pluginData, deckId, deck);
		}
	}

	private void parseHearthStatsDeck(Map<String, String> pluginData, String initialText) throws IOException {
		Pattern pattern = Pattern.compile(HEARTHSTATS_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			String deckId = matcher.group(2) + matcher.group(3);

			// Don't override existing decks (performance)
			if (pluginData.get(deckId) != null) {
				continue;
			}

			String deckUrl = HEARTHSTATS_DECK_HOST_URL + deckId;
			// log.debug("Trying to scrape deck data for deck " + deckUrl);

			Document doc = Jsoup.connect(deckUrl).userAgent("Mozilla").get();

			Deck deck = new Deck();
			deck.title = doc.select(".page-title").text();
			deck.url = deckUrl;

			Elements classCards = doc.select(".deckBuilderCardsWrapper .card");

			for (Element element : classCards) {
				// log.debug("Parsing class card " + element);
				// Elements qtyElement = element.text();
				String qty = element.select(".qty").text().trim();
				// log.debug("\tQty " + qty);
				String name = element.select(".name").text().trim();
				// log.debug("\tCard " + cardElement);
				Card card = new Card(name, qty);
				// log.debug("\tBuilt card " + card);
				deck.classCards.add(card);
			}

			saveDeck(pluginData, deckId, deck);
		}
	}

	private void parseManaCrystalsDeck(Map<String, String> pluginData, String initialText) throws IOException {
		Pattern pattern = Pattern.compile(MANACRYSTALS_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			String deckId = matcher.group(2);

			// Don't override existing decks (performance)
			if (pluginData.get(deckId) != null) {
				continue;
			}

			String deckUrl = MANACRYSTALS_DECK_HOST_URL + deckId;
			// log.debug("Trying to scrape deck data for deck " + deckUrl);

			Document doc = Jsoup.parse(new URL(deckUrl).openStream(), "UTF-8", MANACRYSTALS_DECK_HOST_URL);

			Deck deck = new Deck();
			deck.title = doc.select(".guide article .decklist-meta-data").get(0).select("h2 a").text();

			Elements classCards = doc.select(".guide article .decklist-meta-data").get(0).select(".cards").get(0)
					.select("li");
			Elements neutralCards = doc.select(".guide article .decklist-meta-data").get(0).select(".cards").get(1)
					.select("li");

			for (Element element : classCards) {
				// log.debug("Parsing class card " + element);
				// Elements qtyElement = element.text();
				Elements qty = element.select(".quantity");
				// log.debug("\tQty " + qty);
				Elements cardElement = element.select(".card-name");
				// log.debug("\tCard " + cardElement);
				Card card = new Card(cardElement.text().trim(), qty.text().trim());
				// log.debug("\tBuilt card " + card);
				deck.classCards.add(card);
			}

			for (Element element : neutralCards) {
				// log.debug("Parsing class card " + element);
				// Elements qtyElement = element.text();
				Elements qty = element.select(".quantity");
				// log.debug("\tQty " + qty);
				Elements cardElement = element.select(".card-name");
				// log.debug("\tCard " + cardElement);
				Card card = new Card(cardElement.text().trim(), qty.text().trim());
				// log.debug("\tBuilt card " + card);
				deck.neutralCards.add(card);
			}

			saveDeck(pluginData, deckId, deck);
		}
	}

	private void parseIcyVeinsDeck(Map<String, String> pluginData, String initialText) throws IOException {
		Pattern pattern = Pattern.compile(ICYVEINS_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			String deckId = matcher.group(2);

			// Don't override existing decks (performance)
			if (pluginData.get(deckId) != null) {
				continue;
			}

			String deckUrl = ICYVEINS_DECK_HOST_URL + deckId;
			// log.debug("Trying to scrape deck data for deck " + deckUrl);

			Document doc = Jsoup.parse(new URL(deckUrl).openStream(), "UTF-8", ICYVEINS_DECK_HOST_URL);

			Deck deck = new Deck();
			deck.title = doc.select(".page_title .header").text();

			Elements cards = doc.select(".deck_card_list");

			Elements classCards = cards.select("tbody tr").get(1).select("td").get(0).select("li");
			Elements neutralCards = cards.select("tbody tr").get(1).select("td").get(1).select("li");

			for (Element element : classCards) {
				// log.debug("Parsing class card " + element);
				// Elements qtyElement = element.text();
				String qty = element.text().split("x ")[0];
				// log.debug("\tQty " + qty);
				Elements cardElement = element.select("a");
				// log.debug("\tCard " + cardElement);
				Card card = new Card(cardElement.text().trim(), qty.trim());
				// log.debug("\tBuilt card " + card);
				deck.classCards.add(card);
			}

			for (Element element : neutralCards) {
				// log.debug("Parsing class card " + element);
				// Elements qtyElement = element.text();
				String qty = element.text().split("x ")[0];
				// log.debug("\tQty " + qty);
				Elements cardElement = element.select("a");
				// log.debug("\tCard " + cardElement);
				Card card = new Card(cardElement.text().trim(), qty.trim());
				// log.debug("\tBuilt card " + card);
				deck.neutralCards.add(card);
			}

			saveDeck(pluginData, deckId, deck);
		}
	}

	private void parseHsTopDecksDeck(Map<String, String> pluginData, String initialText) throws IOException {
		Pattern pattern = Pattern.compile(HSTOPDECKS_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			String deckId = matcher.group(2);

			// Don't override existing decks (performance)
			if (pluginData.get(deckId) != null) {
				continue;
			}

			String deckUrl = HSTOPDECKS_DECK_HOST_URL + deckId;
			// log.debug("Trying to scrape deck data for deck " + deckUrl);

			Document doc = Jsoup.connect(deckUrl).userAgent("Mozilla").get();

			Deck deck = new Deck();
			deck.title = doc.select("header h1").text();

			Elements cards = doc.select("ul.deck-class");

			Elements classCards = cards.get(0).select("li");
			Elements neutralCards = cards.get(1).select("li");

			for (Element element : classCards) {
				// log.debug("Parsing class card " + element);
				Elements qtyElement = element.select(".card-count");
				// log.debug("\tQty " + qtyElement);
				Elements cardElement = element.select(".card-name");
				// log.debug("\tCard " + cardElement);
				Card card = new Card(cardElement.text().trim(), qtyElement.text().trim());
				// log.debug("\tBuilt card " + card);
				deck.classCards.add(card);
			}

			for (Element element : neutralCards) {
				// log.debug("Parsing class card " + element);
				Elements qtyElement = element.select(".card-count");
				// log.debug("\tQty " + qtyElement);
				Elements cardElement = element.select(".card-name");
				// log.debug("\tCard " + cardElement);
				Card card = new Card(cardElement.text().trim(), qtyElement.text().trim());
				// log.debug("\tBuilt card " + card);
				deck.neutralCards.add(card);
			}

			saveDeck(pluginData, deckId, deck);
		}
	}

	private void parseArenaDraftsDeck(Map<String, String> pluginData, String initialText) throws IOException {
		Pattern pattern = Pattern.compile(ARENADRAFTS_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			String deckId = matcher.group(3);
			// log.debug("matcher " + matcher);
			// log.debug("deck id " + deckId);

			// Don't override existing decks
			if (pluginData.get(deckId) != null) {
				continue;
			}

			String deckUrl = ARENADRAFTS_DECK_HOST_URL + deckId + "?format=JSON";
			// log.debug("Trying to scrape deck data for deck " + deckUrl);

			StringBuilder result = new StringBuilder();
			URL url = new URL(deckUrl);
			HttpURLConnection conn = (HttpURLConnection) url.openConnection();
			conn.setRequestMethod("GET");
			BufferedReader rd = new BufferedReader(new InputStreamReader(conn.getInputStream()));
			String line;
			while ((line = rd.readLine()) != null) {
				result.append(line);
			}
			rd.close();
			String stringDraft = result.toString();

			JSONObject draft = new JSONArray(stringDraft).getJSONObject(0);
			// log.debug("json draft " + draft);

			int numberOfWins = 0;
			JSONArray matches = draft.getJSONArray("Matches");
			for (int i = 0; i < matches.length(); i++) {
				if (matches.getJSONObject(i).getBoolean("Win")) {
					numberOfWins++;
				}
			}

			Deck deck = new Deck();
			deck.title = "ArenaDrafts - " + draft.getString("Hero") + " - " + numberOfWins + " wins";
			JSONArray pickedCards = draft.getJSONArray("Picks");

			for (int i = 0; i < pickedCards.length(); i++) {
				JSONObject cardObj = pickedCards.getJSONObject(i);
				int cardPickIndex = cardObj.getInt("CardPicked");
				String cardId = cardObj.getJSONObject("Card" + cardPickIndex + "Info").getString("Id");
				Card card = null;
				for (Card c : deck.classCards) {
					if (c.getName().equals(cardId)) {
						card = c;
						card.amount = "" + (Integer.parseInt(card.amount) + 1);
						break;
					}
				}
				if (card == null) {
					card = new Card(cardId, "1");
					deck.classCards.add(card);
				}
			}

			saveDeck(pluginData, deckId, deck);
		}
	}

	private void parseZeroToHeroesDeck(Map<String, String> pluginData, String initialText) throws IOException {
		Pattern pattern = Pattern.compile(ZTH_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			String deckId = matcher.group(2);

			// Don't override existing decks (performance)
			if (pluginData.get(deckId) != null) {
				continue;
			}

			// log.debug("Loading ztoh deck " + deckId);
			Review review = repo.findById(deckId);
			// log.debug("loaded review " + review);
			try {
				String stringDraft = s3utils.readFromS3(review.getKey());
				// log.debug("String draft " + stringDraft);
				JSONObject draft = new JSONObject(stringDraft);
				// log.debug("json draft " + draft);

				Deck deck = new Deck();
				deck.title = review.getTitle();
				JSONArray pickedCards = draft.getJSONArray("pickedcards");

				for (int i = 0; i < pickedCards.length(); i++) {
					String cardId = pickedCards.getString(i);
					Card card = null;
					for (Card c : deck.classCards) {
						if (c.getName().equals(cardId)) {
							card = c;
							card.amount = "" + (Integer.parseInt(card.amount) + 1);
							break;
						}
					}
					if (card == null) {
						card = new Card(cardId, "1");
						deck.classCards.add(card);
					}
				}

				saveDeck(pluginData, deckId, deck);
			}
			catch (IOException e) {
				slackNotifier.notifyException(null, null, e, review.getId(), review.getKey(), review);
			}
		}
	}

	private void parseHearthArenaDeck(Map<String, String> pluginData, String initialText) throws IOException {
		Pattern pattern = Pattern.compile(HEARTHARENA_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			String deckId = matcher.group(2);

			// Don't override existing decks
			if (pluginData.get(deckId) != null) {
				continue;
			}

			String deckUrl = HEARTHARENA_DECK_HOST_URL + deckId;
			// log.debug("Trying to scrape deck data for deck " + deckUrl);

			Document doc = Jsoup.connect(deckUrl).userAgent("Mozilla").get();

			Deck deck = new Deck();

			// Build the deck title
			deck.title = "HearthArena - " + doc.select("#arenaDeck main h1 > span").text();

			// Build the deck itself
			Elements decklist = doc.select("#basics #deck-list .decklist");

			Elements cards = decklist.select("li");

			for (Element element : cards) {
				// log.debug("Parsing class card " + element);
				Elements qtyElement = element.select(".quantity");
				// log.debug("\tCard " + cardElement);
				Card card = new Card(element.attr("data-name"), qtyElement.text().trim());
				// log.debug("\tBuilt card " + card);
				deck.classCards.add(card);
			}

			saveDeck(pluginData, deckId, deck);
		}
	}

	private void parseHearthstoneDecksDeck(Map<String, String> pluginData, String initialText)
			throws IOException, JsonProcessingException {
		Pattern pattern = Pattern.compile(HSDECKS_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			String deckId = matcher.group(2);

			// Don't override existing decks (performance)
			if (pluginData.get(deckId) != null) {
				continue;
			}

			String deckUrl = HSDECKS_DECK_HOST_URL + deckId;
			// log.debug("Trying to scrape deck data for deck " + deckUrl);

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

			saveDeck(pluginData, deckId, deck);
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
			deck.title = doc.select(".deck-title").first().text();

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

			saveDeck(pluginData, deckId, deck);
		}
	}

	private void parseHearthpwnTempDeck(Map<String, String> pluginData, String initialText)
			throws IOException, JsonProcessingException {
		Pattern pattern = Pattern.compile(HPWN_TEMP_DECK_ID_REGEX, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(initialText);
		while (matcher.find()) {
			// log.debug("Matching regex");
			String cardList = matcher.group(3);
			String deckId = matcher.group(2) + "#" + cardList;

			// Don't override existing decks
			if (pluginData.get(deckId) != null) {
				continue;
			}

			// String deckUrl = HPNW_TEMP_DECK_HOST_URL + deckId;
			// log.debug("Trying to scrape deck data for deck " + deckUrl);

			// Document doc = Jsoup.connect(deckUrl).userAgent("Mozilla").get();

			Deck deck = new Deck();
			deck.title = matcher.group(2) + " Hearthpwn Temp Deck";

			// Retrieve cards
			Map<String, String> cardsMap = new HashMap<>();

			String cardsLink = "http://www.hearthpwn.com/cards?display=1&filter-premium=1&page=";
			int pageNumber = 1;
			Document doc = Jsoup.connect(cardsLink + pageNumber).userAgent("Mozilla").get();
			int numberOfPages = Integer
					.valueOf(doc.select(".b-pagination-list .dots").first().nextElementSibling().text());

			for (; pageNumber <= numberOfPages; pageNumber++) {
				if (pageNumber != 1) {
					// log.debug("Connecting to " + cardsLink + pageNumber);
					doc = Jsoup.connect(cardsLink + pageNumber).userAgent("curl/7.47.1").get();
				}

				// Select all the cells with a card name on them
				Elements cardNames = doc.select(".listing-body tbody tr td a.manual-data-link");

				for (Element element : cardNames) {
					String cardName = element.text();
					String cardId = element.attr("href").split("/cards/")[1].split("-")[0];
					cardsMap.put(cardId, cardName);
				}
			}

			// log.debug("parsed " + cardsMap.size() + " cards");

			String[] cards = cardList.split(";");
			for (String card : cards) {
				// log.debug("processing card " + card);
				if (card.length() == 0) {
					continue;
				}

				String cardId = card.split(":")[0];
				String quantity = card.split(":")[1];

				// Now retrieve the card name
				String cardName = cardsMap.get(cardId);

				Card cardObj = new Card(cardName, quantity);
				// log.debug("adding card " + cardObj);
				deck.classCards.add(cardObj);
			}

			saveDeck(pluginData, deckId, deck);
		}
	}

	private void saveDeck(Map<String, String> pluginData, String deckId, Deck deck) throws JsonProcessingException {
		// Post-process deck
		if (StringUtils.isNotEmpty(deck.title)) {
			deck.title = deck.title.replaceAll("\"", "");
		}

		String jsonDeck = new ObjectMapper().writeValueAsString(deck);
		pluginData.put(deckId, jsonDeck);
	}

	@Data
	private static class Deck {
		private String title, url;
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
