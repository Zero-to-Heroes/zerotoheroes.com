package com.coach; 

import java.io.IOException;

import javax.xml.bind.DatatypeConverter;

import org.junit.Test;

import com.coach.plugin.hearthstone.DeckParser;
import com.coach.review.Comment;
 
public class TestDeckParserPlugin {

	@Test
	public void test() throws IOException {
		String binary = DatatypeConverter.printBase64Binary("devsecrettoken".getBytes());
		System.out.println(binary);
		byte[] decoded = DatatypeConverter.parseBase64Binary(binary);
		System.out.println(new String(decoded));
		 
//		Comment comment = new Comment();
//		comment.setText("[http://www.hearthstone-decks.com/deck/voir/freeze-mage-ii-6361]");
//		new DeckParser().execute("", null, comment);
	}
}
