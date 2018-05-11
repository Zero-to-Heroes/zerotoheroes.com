package com.coach.plugin.hearthstone.deck;

import com.coach.plugin.hearthstone.GameParserProvider;
import org.assertj.core.api.WithAssertions;
import org.junit.Test;

public class DeckstringParserTest implements WithAssertions {

	 @Test
	 public void deck_is_converted() throws Exception {
	     GameParserProvider gameParserProvider = new GameParserProvider();
	     String deckString = "AAECAR8G+LEChwTmwgKhwgLZwgK7BQzquwKJwwKOwwKTwwK5tAK1A/4MqALsuwLrB86uAu0JAA==";
	     BlizzardDeckstring blizzardDeckstring = new BlizzardDeckstring(gameParserProvider);

		 Deck deck = blizzardDeckstring.parseDeck(deckString);

		 assertThat(deck).isNotNull();
	 }
}
