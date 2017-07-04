package com.coach.plugin.hearthstone;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

import org.junit.Before;
import org.junit.Test;
import org.springframework.data.util.Pair;

import com.zerotoheroes.hsgameparser.db.Card;
import com.zerotoheroes.hsgameparser.db.CardsList;

public class DeckstringParserTest {

	// private int offset;
	// private byte[] bytes;
	// private CardsList cardsList;

	// @Before
	// public void setup() throws Exception {
	// 	cardsList = CardsList.create();
	// }

	// @Test
	// public void hopTest() throws UnsupportedEncodingException {
	// 	String deckString = "AAECAR8G+LEChwTmwgKhwgLZwgK7BQzquwKJwwKOwwKTwwK5tAK1A/4MqALsuwLrB86uAu0JAA==";

	// 	deck = new Deck();

	// 	// Zero byte
	// 	offset++;

	// 	// Version - currently unused, always 1
	// 	read();

	// 	// Format - determined dynamically
	// 	read();

	// 	// Num Heroes - always 1
	// 	read();

	// 	long heroId = read();
	// 	Card heroCard = GameParser.getCardsList().fromDbfId((int) heroId);
	// 	deck.setTitle(heroCard.getPlayerClass() + " deck");

	// 	int numSingleCards = (int) read();
	// 	for (int i = 0; i < numSingleCards; i++) {
	// 		addCard(1);
	// 	}

	// 	int numDoubleCards = (int) read();
	// 	for (int i = 0; i < numDoubleCards; i++) {
	// 		addCard(2);
	// 	}

	// 	int numMultiCards = (int) read();
	// 	for (int i = 0; i < numMultiCards; i++)
	// 	{
	// 		int dbfId = (int) read();
	// 		int count = (int) read();
	// 		addCard(dbfId, count);
	// 	}

	// 	return deck;
	// }

	// private long read() {
	// 	if (offset > bytes.length) { throw new IllegalArgumentException("Input is not a valid deck string."); }

	// 	Pair<Long, Integer> result = VarInt.readNext(Arrays.copyOfRange(bytes, offset, bytes.length));
	// 	offset += result.getSecond();
	// 	return result.getFirst();
	// }

	// private void addCard(int count)
	// {
	// 	int dbfId = (int) read();
	// 	addCard(dbfId, count);
	// }

	// private void addCard(int dbfId, int count)
	// {
	// 	Card card = GameParser.getCardsList().fromDbfId(dbfId);
	// 	deck.addCard(card.getId(), count);
	// }

	// public static class VarInt
	// {
	// 	public static byte[] getBytes(long value)
	// 	{
	// 		List<Byte> bytes = new ArrayList<>();

	// 		while (value != 0)
	// 		{
	// 			byte b = (byte) (value & 0x7f);
	// 			value >>= 7;
	// 		if (value != 0) {
	// 			b |= 0x80;
	// 		}
	// 		bytes.add(b);
	// 		}
	// 		byte[] byteArray = new byte[bytes.size()];
	// 		for (int i = 0; i < bytes.size(); i++) {
	// 			byteArray[i] = bytes.get(i);
	// 		}
	// 		return byteArray;

	// 	}

	// 	public static Pair<Long, Integer> readNext(byte[] bytes)
	// 	{
	// 		int length = 0;
	// 		long result = 0;
	// 		for (byte b : bytes) {
	// 			long value = b & 0x7f;
	// 			result |= value << length * 7;
	// 			if ((b & 0x80) != 0x80) {
	// 				break;
	// 			}
	// 			length++;
	// 		}
	// 		length++;
	// 		return Pair.of(result, length);
	// 	}
	// }
}
