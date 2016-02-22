var parseDecks = {

	decksRegex: /\[(http:\/\/www\.hearthpwn\.com\/decks\/).+?\]/gm,
	hsDecksDecksRegex: /\[(http:\/\/www\.hearthstone-decks\.com\/deck\/voir\/).+?\]/gm,
	
	decks: {},

	execute: function (review, text) {
		var matches = text.match(parseDecks.decksRegex);
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
					var htmlDeck = parseDecks.formatToHtml(deck);
					// parseDecks.deck = htmlDeck;
					//console.log('html deck is ', htmlDeck);
					var deckNameForDisplay = deck.title;
					parseDecks.decks[deckNameForDisplay] = htmlDeck;

					result = result.replace(match, '<a class="deck-link" onclick="parseDecks.toggleDeck(\'' + deckNameForDisplay + '\')" data-template-url="plugins/parseDecks/template.html" data-title="' + htmlDeck + '" data-container="body" data-placement="auto left" bs-tooltip>' + deckNameForDisplay + '</a>');
				}
			})
		}

		matches = text.match(parseDecks.hsDecksDecksRegex);
		//console.log('matches', matches);
		if (matches) {
			matches.forEach(function(match) {
				//console.log('match', match);
				var deckUrl = match.substring(1, match.length - 1);
				var deckName = match.substring(44, match.length - 1);
				//console.log('deck name', deckName);

				var plugins = review.plugins.hearthstone;
				if (plugins && plugins.parseDecks && plugins.parseDecks[deckName]) {
					var strDeck = plugins.parseDecks[deckName];
					var deck = JSON.parse(strDeck);
					var htmlDeck = parseDecks.formatToHtml(deck);
					// parseDecks.deck = htmlDeck;
					//console.log('html deck is ', htmlDeck);
					var deckNameForDisplay = deck.title;
					parseDecks.decks[deckNameForDisplay] = htmlDeck;

					result = result.replace(match, '<a class="deck-link" onclick="parseDecks.toggleDeck(\'' + deckNameForDisplay + '\')" data-template-url="plugins/parseDecks/template.html" data-title="' + htmlDeck + '" data-container="body" data-placement="auto left" bs-tooltip>' + deckNameForDisplay + '</a>');
				}
			})
		}
		return result;
	},

	toggleDeck: function (deckNameForDisplay) {
		$(".contextual-information .content").addClass('deck');
		$(".contextual-information .content").html(parseDecks.decks[deckNameForDisplay]);
		$(".contextual-information").show();
		$(function () {
		  	$('body').tooltip({
		  		selector: '[data-toggle="tooltip-deck"]',
		  		template: '<div class="tooltip parse-cards-text"><div class="tooltip-inner"></div></div>',
		  		html: true,
		  		container: 'body',
		  		placement: 'auto left',
		  		animation: false,
		  		title: function(element) {
		  			console.log('title', $(this));
		  			var image = $(this).attr('data-title');
		  			return '<img src=\'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/' + image + '\'>';
		  		}
		  	});
		})
	},

	formatToHtml: function (deck, deckUrl) {
	var htmlDeck = '<h3 class=\'deck-header\'><a href=\'' + deckUrl + '\' target=\'_blank\'>' + deck.title + '</a></h3>';
		htmlDeck += '<div class=\'deck-body row\'>';
			htmlDeck += '<div class=\'class-cards col-md-6\'>';
				htmlDeck += '<h4 class=\'card-type-title\'>Class cards</h4>';
				htmlDeck += '<table>';
					htmlDeck += '<tbody>';
						deck.classCards.forEach(function(card) {
							var cssClass = 'card';
							var cardObject = parseCardsText.getCard(card.name);
							//console.log('cardObject', cardObject);
							if (cardObject) {
								cssClass += ' ' + (cardObject.rarity ? cardObject.rarity.toLowerCase() : 'common');
								var image = parseCardsText.localizeImage(cardObject);
								htmlDeck += '<tr>' + 
												'<td class=\'card-cost\'><img src=\'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/mana/' + cardObject.cost + '.png\'></td>' +
												'<td class=\'card-name ' + cssClass + '\' data-title=\'' + image + '\' data-toggle=\'tooltip-deck\'>' + parseCardsText.localizeName(cardObject)  + '</td>' +
												'<td class=\'card-amount\'>x' + card.amount  + '</td>' +
											'</tr>';
							}
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
							var cardObject = parseCardsText.getCard(card.name);
							cssClass += ' ' + (cardObject.rarity ? cardObject.rarity.toLowerCase() : 'common');
							var image = parseCardsText.localizeImage(cardObject);
							htmlDeck += '<tr>' + 
										'<td class=\'card-cost\'><img src=\'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/mana/' + cardObject.cost + '.png\'></td>' +
										'<td class=\'card-name ' + cssClass + '\' data-title=\'' + image + '\' data-toggle=\'tooltip-deck\'>' + parseCardsText.localizeName(cardObject)  + '</td>' +
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
}