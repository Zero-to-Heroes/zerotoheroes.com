package com.coach.plugin.hearthstone;

import java.util.Scanner;

import org.junit.Test;

public class TestHSArenaDraft {

	@Test
	public void testATConversion() throws Exception {
		String atFile = new Scanner(getClass().getResourceAsStream("at-draft.arenatracker"), "UTF-8")
				.useDelimiter("\\A").next();
		// InputStream stream = new
		// ByteArrayInputStream(atFile.getBytes(StandardCharsets.UTF_8));
		// System.out.println(atFile);

		HSArenaDraft converter = new HSArenaDraft();
		String json = converter.convertToJson(atFile);
		System.out.println(json);
	}
}
