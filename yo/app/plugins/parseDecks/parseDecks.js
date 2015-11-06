var decksRegex = /\[(http:\/\/www\.hearthpwn\.com\/decks\/).+?\]/gm;
//var decksRegex = /\[(hearthpwnDeck=.+?\]/gm;

function parseDecks(review, text) {
	var matches = text.match(decksRegex);
	if (!matches) return text;
	//console.log('parsing for decks', text);

	var result = text;
	//console.log('matches', matches);
	if (matches) {
		matches.forEach(function(match) {
			//console.log('match', match);
			var deckUrl = match.substring(1, match.length - 1);
			var deckName = match.substring(32, match.length - 1);
			//console.log('deck name', deckName);

			var plugins = review.plugins.hearthstone;
			if (plugins && plugins.parseDecks && plugins.parseDecks[deckName]) {
				var strDeck = plugins.parseDecks[deckName];
				var deck = JSON.parse(strDeck);
				var htmlDeck = formatToHtml(deck);
				//console.log('html deck is ', htmlDeck);

				var deckNameForDisplay = deck.title;

				result = result.replace(match, '<a class="deck-link" href="' + deckUrl + '" target="_blank" data-template-url="plugins/parseDecks/template.html" data-title="' + htmlDeck + '" data-container="body" data-placement="top-right" bs-tooltip>' + deckNameForDisplay + '</a>');
			}
		})
	}
	return result;
}

function formatToHtml(deck) {
	var htmlDeck = '<h3 class=\'deck-header\'>' + deck.title + '</h3>';
	htmlDeck += '<div class=\'deck-body row\'>';
		htmlDeck += '<div class=\'class-cards col-md-6\'>';
			htmlDeck += '<h4 class=\'card-type-title\'>Class cards</h4>';
			htmlDeck += '<table>';
				htmlDeck += '<tbody>';
					deck.classCards.forEach(function(card) {
						var cssClass = 'card';
						if (getCard) {
							var cardObject = getCard(card.name);
							//console.log('cardObject', cardObject);
							cssClass += ' ' + (cardObject.rarity ? cardObject.rarity.toLowerCase() : 'common');
						}
						htmlDeck += '<tr>' + 
										'<td class=\'card-cost\'><img src=\'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/mana/' + cardObject.cost + '.png\'></td>' +
										'<td class=\'card-name ' + cssClass + '\'>' + card.name  + '</td>' +
										'<td class=\'card-amount\'>x' + card.amount  + '</td>' +
									'</tr>';
					})
				htmlDeck += '</tbody>';
			htmlDeck += '</table>';
		htmlDeck += '</div>';
		htmlDeck += '<div class=\'neutral-cards col-md-6\'>';
			htmlDeck += '<h4 class=\'card-type-title\'>Neutral cards</h4>';
			htmlDeck += '<table>';
				htmlDeck += '<tbody>';
					deck.neutralCards.forEach(function(card) {
						var cssClass = 'card';
						if (getCard) {
							var cardObject = getCard(card.name);
							cssClass += ' ' + (cardObject.rarity ? cardObject.rarity.toLowerCase() : 'common');
						}
						htmlDeck += '<tr>' + 
										'<td class=\'card-cost\'><img src=\'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/mana/' + cardObject.cost + '.png\'></td>' +
										'<td class=\'card-name ' + cssClass + '\'>' + card.name  + '</td>' +
										'<td class=\'card-amount\'>x' + card.amount  + '</td>' +
									'</tr>';
					})
				htmlDeck += '</tbody>';
			htmlDeck += '</table>';
		htmlDeck += '</div>';
	htmlDeck += '</div>';
	htmlDeck += '<div class=\'deck-footer\'></div>';

	return htmlDeck;
}