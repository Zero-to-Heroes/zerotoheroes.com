var parseDecks = {

	decksRegex: /\[?(http:\/\/www\.hearthpwn\.com\/decks\/)([\d\-a-zA-Z]+)\]?/gm,
	hearthpwnTempDeckRegex: /\[?(http:\/\/www\.hearthpwn\.com\/deckbuilder\/)([\d\-a-zA-Z#\:\;]+)\]?/gm,
	hsDecksDecksRegex: /\[?(http:\/\/www\.hearthstone-decks\.com\/deck\/voir\/)([\d\-a-zA-Z]+)\]?/gm,
	zthDecksRegex: /\[?(http:\/\/www\.zerotoheroes\.com\/r\/hearthstone\/)([\da-zA-Z]+)\/?.*\]?/gm,
	// zthDecksRegex: /\[?(http:\/.*localhost.*\/r\/hearthstone\/)([\da-zA-Z]+)\/?.*\]?/gm,
	hearthArenaDecksRegex: /\[?(http:\/\/www\.heartharena\.com\/arena-run\/)([\da-zA-Z]+)\]?/gm,
	arenaDraftsDecksRegex: /\[?(http:\/\/(www\.)?arenadrafts\.com\/Arena\/View\/)([\da-zA-Z\-]+)\]?/gm,
	hsTopDecksDecksRegex: /\[?(http:\/\/www\.hearthstonetopdecks\.com\/decks\/)([\da-zA-Z\-]+)\]?/gm,
	icyVeinsDecksRegex: /\[?(http:\/\/www\.icy-veins\.com\/hearthstone\/)([\da-zA-Z\-]+)\]?/gm,
	manaCrystalsDecksRegex: /\[?(https:\/\/manacrystals\.com\/deck_guides\/)([\da-zA-Z\-]+)\]?/gm,
	
	decks: {},

	execute: function (review, text) {
		var result = text;

		result = parseDecks.parse(review, result, text, parseDecks.decksRegex)
		result = parseDecks.parse(review, result, text, parseDecks.hearthpwnTempDeckRegex)
		result = parseDecks.parse(review, result, text, parseDecks.hsDecksDecksRegex)
		result = parseDecks.parse(review, result, text, parseDecks.zthDecksRegex)
		result = parseDecks.parse(review, result, text, parseDecks.hearthArenaDecksRegex)
		result = parseDecks.parse(review, result, text, parseDecks.arenaDraftsDecksRegex, 3)
		result = parseDecks.parse(review, result, text, parseDecks.hsTopDecksDecksRegex)
		result = parseDecks.parse(review, result, text, parseDecks.icyVeinsDecksRegex)
		result = parseDecks.parse(review, result, text, parseDecks.manaCrystalsDecksRegex)
		result = parseDecks.parse(review, result, text, parseDecks.manaCrystalsDecksRegex)

		// result = parseDecks.parseTemporaryDeck(review, result, text, parseDecks.hearthpwnTempDeckRegex)

		return result;
	},

	// parseTemporaryDeck: function(review, result, text, regex, groupIndex) {
	// 	var match = regex.exec(text)
	// 	while (match) {
	// 		result = parseDecks.handleMatchTemporary(review, result, match, groupIndex)
	// 		match = regex.exec(text)
	// 	}
	// 	return result
	// },

	parse: function(review, result, text, regex, groupIndex) {
		regex = new RegExp('(?!.*\\))' + regex.source, 'gm')
		// console.log('matching', text, regex)
		var match = regex.exec(text)
		while (match) {
			result = parseDecks.handleMatch(review, result, match, groupIndex)
			match = regex.exec(text)
		}
		return result
	},

	handleMatch: function(review, result, match, groupIndex) {
		groupIndex = groupIndex || 2
		// console.log('match', match, result);
		var deckName = match[groupIndex]
		var deckUrl = match[1] + deckName
		// console.log('deck name', deckName, deckUrl)

		var plugins = review.plugins.hearthstone;
		// console.log('plugins', plugins)
		if (plugins && plugins.parseDecks && plugins.parseDecks[deckName]) {
			var strDeck = plugins.parseDecks[deckName];
			// console.log('strDeck', strDeck)
			var deck = JSON.parse(strDeck)
			// console.log('jsDeck', deck)
			var htmlDeck = parseDecks.formatToHtml(deck, deckUrl);
			// parseDecks.deck = htmlDeck;
			// console.log('html deck is ', htmlDeck);
			var deckNameForDisplay = deck.title.replace(/'/g, '')
			parseDecks.decks[deckNameForDisplay] = htmlDeck;

			result = result.replace(match[0], '<a class="deck-link" onmouseup="parseDecks.toggleDeck(\'' + deckUrl + '\', \'' + deckNameForDisplay + '\', event)" data-template-url="plugins/parseDecks/template.html" data-title="' + htmlDeck + '" data-container="body" data-placement="auto left" bs-tooltip>' + deck.title + '</a>');
		}

		return result
	},

	handleMatchTemporary: function(review, result, match, groupIndex) {
		groupIndex = groupIndex || 2
		// console.log('match', match, result);
		var deckName = 'Deck link'

		result = result.replace(match[0], '<a class="deck-link" href="' + match[0] + '" target="_blank">' +deckName + '</a>');

		return result
	},

	toggleDeck: function (deckUrl, deckNameForDisplay, event) {
		// console.log('toggle deck', deckUrl, deckNameForDisplay, event)
		// Middle click
		if (event.button == 1 && deckUrl) {
			event.preventDefault()
			// console.log('opening deck in new window', deckUrl)
			var win = window.open(deckUrl, '_blank')
			return
		}

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
		  			// console.log('title', $(this));
		  			var image = $(this).attr('data-title');
		  			return '<img src=\'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/' + image + '\'>';
		  		}
		  	});
		})
	},

	formatToHtml: function (deck, deckUrl) {

		// First make sure all cards are well placed in class vs neutral
		var realClassCards = []
		deck.classCards.forEach(function(card) {
			var dbCard = parseCardsText.getCard(card.name)
			if (!dbCard) {
				console.log('error parsing card', dbCard, card, deck, deckUrl)
			}
			else if (!dbCard.playerClass) {
				deck.neutralCards.push(card)
			}
			else {
				realClassCards.push(card)
			}
		})
		deck.classCards = realClassCards
		deck.title = deck.title || 'Unnamed draft'

		// Sort cards by cost
		deck.neutralCards = _.sortBy(deck.neutralCards, function(card) {
			var cardObject = parseCardsText.getCard(card.name)
			return cardObject.cost
		})
		deck.classCards = _.sortBy(deck.classCards, function(card) {
			var cardObject = parseCardsText.getCard(card.name)
			return cardObject.cost
		})

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