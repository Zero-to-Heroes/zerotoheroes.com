var parseDecks = {

	decksRegex: /\[?(http:\/\/www\.hearthpwn\.com\/decks\/)([\d\-a-zA-Z]+)\]?/gm,
	hearthpwnTempDeckRegex: /\[?(http:\/\/www\.hearthpwn\.com\/deckbuilder\/)([\d\-a-zA-Z#\:\;]+)\]?/gm,
	hsDecksDecksRegex: /\[?(http:\/\/www\.hearthstone-decks\.com\/deck\/voir\/)([\d\-a-zA-Z]+)\]?/gm,
	zthDecksRegex: /\[(http:\/\/www\.zerotoheroes\.com\/r\/hearthstone\/)([\da-zA-Z]+)\/?.*\]/gm,
	// zthDecksRegex: /\[?(http:\/.*localhost.*\/r\/hearthstone\/)([\da-zA-Z]+)\/?.*\]?/gm,
	hearthArenaDecksRegex: /\[?(http:\/\/www\.heartharena\.com\/arena-run\/)([\da-zA-Z]+)\]?/gm,
	arenaDraftsDecksRegex: /\[?(http:\/\/(?:www\.)?arenadrafts\.com\/Arena\/View\/)([\da-zA-Z\-]+)\]?/gm,
	hsTopDecksDecksRegex: /\[?(http:\/\/www\.hearthstonetopdecks\.com\/decks\/)([\da-zA-Z\-]+)\]?/gm,
	icyVeinsDecksRegex: /\[?(http:\/\/www\.icy-veins\.com\/hearthstone\/)([\da-zA-Z\-]+)\]?/gm,
	manaCrystalsDecksRegex: /\[?(https:\/\/manacrystals\.com\/deck_guides\/)([\da-zA-Z\-]+)\]?/gm,
	// https://regex101.com/r/kW4oW3/1
	hearthstatsDecksRegex: /\[?(http(?:s)?:\/\/(?:hss|hearthstats)\.(?:io|net)\/d(?:ecks)?\/)([\d\w\-]+)(\??\S*)\]?/gm,
	// hearthstatsFullDecksRegex: /\[?(http:\/\/hearthstats\.net\/d\/)([\d\w\-]+)\]?/gm,
	hearthheadDecksRegex: /\[?(http:\/\/www\.hearthhead\.com\/deck=)([\d\w\-]+)\/?([\d\w\-]+)?\]?/gm,
	
	decks: {},

	execute: function (review, text) {
		// console.log('executing parseDecks plugin', text)
		// var result = text;

		text = parseDecks.parse(review, text, parseDecks.decksRegex)
		text = parseDecks.parse(review, text, parseDecks.hearthpwnTempDeckRegex)
		text = parseDecks.parse(review, text, parseDecks.hsDecksDecksRegex)
		text = parseDecks.parse(review, text, parseDecks.zthDecksRegex)
		text = parseDecks.parse(review, text, parseDecks.hearthArenaDecksRegex)
		text = parseDecks.parse(review, text, parseDecks.arenaDraftsDecksRegex)
		text = parseDecks.parse(review, text, parseDecks.hsTopDecksDecksRegex)
		text = parseDecks.parse(review, text, parseDecks.icyVeinsDecksRegex)
		text = parseDecks.parse(review, text, parseDecks.manaCrystalsDecksRegex)
		text = parseDecks.parse(review, text, parseDecks.hearthstatsDecksRegex)
		// text = parseDecks.parse(review, text, parseDecks.hearthstatsFullDecksRegex)
		text = parseDecks.parse(review, text, parseDecks.hearthheadDecksRegex)

		// result = parseDecks.parseTemporaryDeck(review, result, text, parseDecks.hearthpwnTempDeckRegex)

		return text;
	},

	// parseTemporaryDeck: function(review, result, text, regex, groupIndex) {
	// 	var match = regex.exec(text)
	// 	while (match) {
	// 		result = parseDecks.handleMatchTemporary(review, result, match, groupIndex)
	// 		match = regex.exec(text)
	// 	}
	// 	return result
	// },

	parse: function(review, text, regex, groupIndex) {
		// Lookbehind - http://www.regular-expressions.info/lookaround.html
		// https://regex101.com/r/qT1vF8/9 for a pure regex-based solution
		// regex = new RegExp('(.{0,2})' + regex.source, 'gm')
		// console.log('matching', text, regex)
		var match = regex.exec(text)
		while (match) {
			// console.log('considering match', match.index, regex.lastIndex, match, regex)
			// if (match.index === regex.lastIndex) {
   //   			regex.lastIndex++
			// }

			// if (match[1] != '](' && match[1] != '=\'' && match[1] != '(\'') {
				// console.log('\tmatched!!!', match[1], match)
				// console.log('replaced substring', text.substring(match.index, match.index + match[0].length))
				text = parseDecks.handleMatch(review, text, match, groupIndex, regex)
				// console.log('new text', text)
			// }
			match = regex.exec(text)
		}
		// console.log('parsed regex', regex)
		return text
	},

	handleMatch: function(review, text, match, groupIndex, regex) {
		groupIndex = groupIndex || 2
		// console.log('\tmatch', match, review.plugins.hearthstone.parseDecks);
		var deckName = match[groupIndex]
		if (match.length > 3)
			deckName += match[3]
		var deckUrl = match[1] + deckName
		// console.log('\tdeck name', deckName, deckUrl)

		var plugins = review.plugins.hearthstone;
		// console.log('\tplugins', plugins)
		if (plugins && plugins.parseDecks && plugins.parseDecks[deckName]) {
			var strDeck = plugins.parseDecks[deckName];
			// console.log('\tstrDeck', strDeck)
			var deck = JSON.parse(strDeck)
			deckUrl = deck.url || deckUrl
			// console.log('\tjsDeck', deck)
			var htmlDeck = parseDecks.formatToHtml(deck, deckUrl);
			// parseDecks.deck = htmlDeck;
			// console.log('\thtml deck is ', htmlDeck);
			var deckNameForDisplay = deck.title.replace(/'/g, '').replace(/\[/g, '').replace(/\]/g, '').replace(/\\/g, '')
			parseDecks.decks[deckNameForDisplay] = htmlDeck;

			// var toMatch = match[0].replace(match[1], '')
			// console.log('\ttoMatch', toMatch, match[0])

			var replaceString = '<a class="deck-link" onmouseup="parseDecks.toggleDeck(\'' + deckUrl + '\', \'' + deckNameForDisplay + '\', event)" data-template-url="plugins/parseDecks/template.html" data-title="' + htmlDeck + '" data-container="body" data-placement="auto left" bs-tooltip>' + deck.title + '</a>'

			// console.log('keeping starting string', match[1], text.substring(0, match.index + match[1].length), match[1].length)
			var newText = text.substring(0, match.index) + replaceString + text.substring(match.index + match[0].length)
			text = newText			

			// regex.lastIndex += replaceString.length - 1
			// Offset to make sure we don't process the same URL twice. It's a magic number, works with this value and 
			// it's not so big to skip the next one completely
			regex.lastIndex += 399
		}

		return text
	},

	// handleMatchTemporary: function(review, result, match, groupIndex) {
	// 	groupIndex = groupIndex || 2
	// 	// console.log('match', match, result);
	// 	var deckName = 'Deck link'

	// 	result = result.replace(match[0], '<a class="deck-link" href="' + match[0] + '" target="_blank">' +deckName + '</a>');

	// 	return result
	// },

	toggleDeck: function (deckUrl, deckNameForDisplay, event) {
		// console.log('toggle deck', deckUrl, deckNameForDisplay, event)
		// console.log('full deck', parseDecks, parseDecks.decks[deckNameForDisplay])
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
			// console.log('parsing card', dbCard)
			if (!dbCard) {
				console.log('error parsing card', dbCard, card, deck, deckUrl)
			}
			else if (!dbCard.playerClass || dbCard.playerClass == 'Neutral') {
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