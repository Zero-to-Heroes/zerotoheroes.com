package com.coach.plugin.hearthstone;

import java.util.Scanner;

import org.junit.Test;

public class TestArenaTracker {

	@SuppressWarnings("resource")
	@Test
	public void convert_as_much_as_possible_from_a_messy_file() throws Exception {
		String atFile = new Scanner(getClass().getResourceAsStream("incomplete_file.arenatracker"), "UTF-8")
				.useDelimiter("\\A").next();
		// InputStream stream = new
		// ByteArrayInputStream(atFile.getBytes(StandardCharsets.UTF_8));
		// System.out.println(atFile);

		HSArenaDraft converter = new HSArenaDraft();
		String json = converter.convertToJson(atFile);
		System.out.println(json);
	}
}
