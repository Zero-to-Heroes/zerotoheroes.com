package com.coach.plugin.hearthstone.deck;

import com.coach.plugin.hearthstone.GameParserProvider;
import com.zerotoheroes.hsgameparser.db.Card;
import com.zerotoheroes.hsgameparser.metadata.GameParser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;


@Slf4j
@Component
public class BlizzardDeckstring extends AbstractDeckParser {

	private GameParser gameParser;

	@Autowired
	public BlizzardDeckstring(GameParserProvider gameParserProvider) {
		this.gameParser = gameParserProvider.getGameParser();
	}

	private static final String REGEX = "\\[(\\S*)\\]";

	public void parseDeck(Map<String, String> pluginData, String initialText) {
//		Pattern pattern = Pattern.compile(REGEX, Pattern.MULTILINE);
//		Matcher matcher = pattern.matcher(initialText);
//		while (matcher.find()) {
//			String deckString = matcher.group(1);
//
//			try {
//				Deck deck = new Parser().parse(deckString);
//				deck.setDeckString(deckString);
//				if (deck.getTitle().length() > 0) {
//					saveDeck(pluginData, String.valueOf(deckString.hashCode()), deck);
//				}
//			}
//			catch (Exception e) {
//				// Do nothing, it just means that this was not a blizzard deck
//			}
//		}
	}

	private class Parser {
		private int offset;
		private byte[] bytes;
		private Deck deck;

		public Deck parse(String deckString) throws Exception {
			bytes = Base64.getDecoder().decode(deckString);

			deck = new Deck();

			// Zero byte
			offset++;

			// Version - currently unused, always 1
			read();

			// Format - determined dynamically
			read();

			// Num Heroes - always 1
			read();

			long heroId = read();
			Card heroCard = gameParser.getCardsList().fromDbfId((int) heroId);
			deck.setTitle(heroCard.getPlayerClass() + " deck");

			int numSingleCards = (int) read();
			for (int i = 0; i < numSingleCards; i++) {
				addCard(1);
			}

			int numDoubleCards = (int) read();
			for (int i = 0; i < numDoubleCards; i++) {
				addCard(2);
			}

			int numMultiCards = (int) read();
			for (int i = 0; i < numMultiCards; i++)
			{
				int dbfId = (int) read();
				int count = (int) read();
				addCard(dbfId, count);
			}

			return deck;
		}

		private long read() {
			if (offset > bytes.length) { throw new IllegalArgumentException("Input is not a valid deck string."); }

			Pair<Long, Integer> result = VarInt.readNext(Arrays.copyOfRange(bytes, offset, bytes.length));
			offset += result.getSecond();
			return result.getFirst();
		}

		private void addCard(int count)
		{
			int dbfId = (int) read();
			addCard(dbfId, count);
		}

		private void addCard(int dbfId, int count)
		{
			Card card = gameParser.getCardsList().fromDbfId(dbfId);
			deck.addCard(card.getId(), count);
		}
	}

	public static class VarInt
	{
		public static byte[] getBytes(long value)
		{
			List<Byte> bytes = new ArrayList<>();

			while (value != 0)
			{
				byte b = (byte) (value & 0x7f);
				value >>= 7;
			if (value != 0) {
				b |= 0x80;
			}
			bytes.add(b);
			}
			byte[] byteArray = new byte[bytes.size()];
			for (int i = 0; i < bytes.size(); i++) {
				byteArray[i] = bytes.get(i);
			}
			return byteArray;

		}

		public static Pair<Long, Integer> readNext(byte[] bytes)
		{
			int length = 0;
			long result = 0;
			for (byte b : bytes) {
				long value = b & 0x7f;
				result |= value << length * 7;
				if ((b & 0x80) != 0x80) {
					break;
				}
				length++;
			}
			length++;
			return Pair.of(result, length);
		}
	}
}
