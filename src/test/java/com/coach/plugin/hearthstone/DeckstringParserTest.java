package com.coach.plugin.hearthstone;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

import org.junit.Test;
import org.springframework.data.util.Pair;

public class DeckstringParserTest {

	private int offset;
	private byte[] bytes;

	@Test
	public void hopTest() throws UnsupportedEncodingException {
		String deckString = "AAECAR8G+LEChwTmwgKhwgLZwgK7BQzquwKJwwKOwwKTwwK5tAK1A/4MqALsuwLrB86uAu0JAA==";

		bytes = Base64.getDecoder().decode(deckString);
		System.out.println(Arrays.toString(bytes));

		// Zero byte
		offset++;

		// Version - currently unused, always 1
		Read();

		// Format - determined dynamically
		Read();

		// Num Heroes - always 1
		Read();

		long heroId = Read();
		System.out.println(heroId);

		int numSingleCards = (int) Read();
		for (int i = 0; i < numSingleCards; i++) {
			AddCard(1);
		}

		int numDoubleCards = (int) Read();
		for (int i = 0; i < numDoubleCards; i++) {
			AddCard(2);
		}

		int numMultiCards = (int) Read();
		for (int i = 0; i < numMultiCards; i++)
		{
			int dbfId = (int) Read();
			int count = (int) Read();
			AddCard(dbfId, count);
		}

		System.out.println(new String(bytes));
	}

	private long Read() {
		if (offset > bytes.length) { throw new IllegalArgumentException("Input is not a valid deck string."); }

		Pair<Long, Integer> result = VarInt.ReadNext(Arrays.copyOfRange(bytes, offset, bytes.length));
		offset += result.getSecond();
		return result.getFirst();
	}

	private void AddCard(int count)
	{
		int dbfId = (int) Read();
		AddCard(dbfId, count);
	}

	private void AddCard(int dbfId, int count)
	{
		System.out.println("Adding card: " + count + "x " + dbfId);
	}

	public static class VarInt
	{
		public static byte[] GetBytes(long value)
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

		public static Pair<Long, Integer> ReadNext(byte[] bytes)
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
