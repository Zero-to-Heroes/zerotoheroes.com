package com.coach.plugin.hearthstone.deck;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class Deck {
	private String title, url;
	private String deckString;
	private final List<Card> classCards = new ArrayList<>();
	private final List<Card> neutralCards = new ArrayList<>();

	public void addCard(String card) {
		for (Card existing : classCards) {
			if (existing.getName().equals(card)) {
				existing.setAmount("" + (Integer.parseInt(existing.getAmount()) + 1));
				return;
			}
		}

		Card newCard = new Card(card, "" + 1);
		classCards.add(newCard);
	}

	public void addCard(String card, int amount) {
		Card newCard = new Card(card, "" + amount);
		classCards.add(newCard);
	}

	public void addClassCard(Card newCard) {
		classCards.add(newCard);
	}

	public void addNeutralCard(Card newCard) {
		neutralCards.add(newCard);
	}
}
