package com.coach;

import java.io.IOException;

import org.junit.Test;

import com.coach.plugin.hearthstone.DeckParser;
import com.coach.review.Comment;

public class TestDeckParserPlugin {

	@Test
	public void test() throws IOException {
		Comment comment = new Comment();
		comment.setText("[http://www.hearthstone-decks.com/deck/voir/freeze-mage-ii-6361]");
		new DeckParser().execute("", null, comment);
	}
}
