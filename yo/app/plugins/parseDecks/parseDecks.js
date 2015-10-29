var decksRegex = /\[hearthpwnDeck=.+?\]/gm;

function parseDecks(review, text) {
	var matches = text.match(decksRegex);
	if (!matches) return text;

	var result = text;
	//console.log('matches', matches);
	if (matches) {
		matches.forEach(function(match) {
			//console.log('match', match);
			var deckName = match.substring(15, match.length - 1);
			console.log('deck name', deckName);

			var plugins = review.plugins.hearthstone;
			if (plugins && plugins.parseDecks && plugins.parseDecks[deckName]) {
				var strDeck = plugins.parseDecks[deckName];
				var htmlDeck = formatToHtml(strDeck);
				console.log('html deck is ', htmlDeck);

				result = result.replace(match, '<a class="deck" data-template-url="plugins/parseDecks/template.html" data-title="' + htmlDeck + '" data-container="body" data-placement="top-right" bs-tooltip>' + deckName + '</a>');
			}
		})
	}
	return result;
}

function formatToHtml(strDeck) {
	var deck = JSON.parse(strDeck);

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
							console.log('cardObject', cardObject);
							cssClass += ' ' + (cardObject.rarity ? cardObject.rarity.toLowerCase() : 'common');
						}
						htmlDeck += '<tr>' + 
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