var parseCardsText = {
	cardRegex: /\[\[.+?\]\]/gm,
	manaRegex: /\d-mana/gm,
	isUpdatePending: false,

	execute: function (review, text) {
		var matches = text.match(parseCardsText.cardRegex);
		var result = text;
		var lang;
		try {
			lang = window.localStorage.language;
		}
		catch (e) {
			lang = 'en';
		}
		// Parsing card names
		if (matches) {
			// console.log('parsing cards', text);
			matches.forEach(function(match) {
				var cardName = match.substring(2, match.length - 2);
				var card = parseCardsText.getCard(cardName);
				if (card) {
					var link = parseCardsText.buildCardLink(card, lang);
					result = result.replace(match, link);
				}
			})
		}

		// Parsing mana costs
		matches = text.match(parseCardsText.manaRegex);
		if (matches) {
			matches.forEach(function(match) {
				var cost = match.substring(0, match.indexOf('-'));
				result = result.replace(match, '<img src="https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/mana/' + cost + '.png" class="parse-cards-text mana-cost">');
			})
		}

		return result;
	},

	buildCardLink: function(card, lang) {
		if (!card) return ''

		lang = lang || parseCardsText.getLang();
		var localizedName = parseCardsText.localizeName(card, lang);
		var cssClass = card.rarity ? parseCardsText.getRarity(card).toLowerCase() : 'common';

		var localizedImage = parseCardsText.localizeImage(card, lang);
		var tooltipTemplate = '<div class=\'tooltip parse-cards-text\'><div class=\'tooltip-inner\'></div></div>';
		var title = '<img src=\'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/' + localizedImage + '\'>';
		var link = '<span class="autocomplete card ' + cssClass + '" data-toggle="tooltip" data-template="' + tooltipTemplate + '" data-title="' + title + '"data-placement="auto left" data-html="true" data-container="body" data-animation="false">' + localizedName + '</span>';

		if (!parseCardsText.isUpdatePending) {
			parseCardsText.isUpdatePending = true
			setTimeout(function() {
				$('[data-toggle="tooltip"]').tooltip()
				parseCardsText.isUpdatePending = false
			}, 300)
		}

		return link;
	},

	refreshTooltips: function() {
		if (!parseCardsText.isUpdatePending) {
			parseCardsText.isUpdatePending = true
			setTimeout(function() {
				$('[data-toggle="tooltip"]').tooltip()
				parseCardsText.isUpdatePending = false
			}, 300)
		}
	},

	buildFullCardImageUrl: function(card, lang) {
		if (!card) return ''

		lang = lang || parseCardsText.getLang()
		var localizedImage = parseCardsText.localizeImage(card, lang)
		return 'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/' + localizedImage
	},

	getLang: function() {
		var lang;
		try {
			lang = window.localStorage.language;
		}
		catch (e) {
			lang = 'en';
		}
		return lang;
	},

	localizeName: function(card, lang) {
		if (!card) return ''
			
		lang = lang || parseCardsText.getLang();
		if (!lang) return card.name;
		if (!card[lang]) return card.name;
		return card[lang].name;
	},

	localizeImage: function(card) {
		var lang;
		try {
			lang = window.localStorage.language;
		}
		catch (e) {
			lang = 'en';
		}
		if (!lang) return card.cardImage;
		if (!card[lang]) return card.cardImage;
		// console.log('localized image', lang + '/' + card.cardImage);
		return lang + '/' + card.cardImage;
	},

	attach: function(element) {
		// console.log('attaching to element', element);
		element.textcomplete([{
			match: /\[\[[a-zA-Z\-\s0-9\.\:\']{3,}$/,
			search: function (term, callback, match) {
				var cards = $.map(parseCardsText.jsonDatabase, function(card) {
					var localizeName = parseCardsText.localizeName(card);
					var res = S(localizeName.toLowerCase()).latinise().s.indexOf(S(term).latinise().s.substring(2).toLowerCase()) === 0;
					// add search on english term
					res = res || card.name.toLowerCase().indexOf(term.substring(2).toLowerCase()) === 0;
					// Keep only valid cards
					res = res && card.cardImage && card.type != 'Hero' && card.type != 'Enchantment' 
					res = res && card.set != 'Hero_skins'
					res = res ? card : null
					// if (debug) console.log('res4', term, localizeName, res);
					return res;
				})
				// Remove duplicates
				var uniqueCards = parseCardsText.removeDuplicates(cards)
				callback(uniqueCards)
				$(function () {
					$('.tooltip.parse-cards-text').hide();
				})
				$(function () {
					$('[data-toggle="tooltip"]').tooltip()
				})
			},
			replace: function(card) {
				return '[[' + card.name + ']]';
			},
			index: 0,
			template: function(card, term) {
				var tooltipTemplate = '<div class=\'tooltip parse-cards-text\'><div class=\'tooltip-inner\'></div></div>';
				var title = '<img src=\'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/' + parseCardsText.localizeImage(card) + '\'>';
				var cssClass = card.rarity ? parseCardsText.getRarity(card).toLowerCase() : 'common';
				return '<span class="autocomplete card ' + cssClass + '" data-toggle="tooltip" data-template="' + tooltipTemplate + '" data-title="' + title + '"data-placement="auto left" data-html="true" data-container="body" data-animation="false">' + parseCardsText.localizeName(card) + '</span>';
			},
			context: function (text) { 
				return text.toLowerCase(); 
			}
		}],
		{
			noResultMessage: function() {
				console.log('unloading');
				$(function () {
					// console.log('unloading tooltips', $('[data-toggle="tooltip"]'));
					$('[data-toggle="tooltip"]').tooltip('hide')
				})
			}
		});
	},

	removeDuplicates: function(list) {
		var tempObj = {}
		list.forEach(function(item) {
			if (!tempObj[item.name]) {
				tempObj[item.name] = item
			}
			else {
				if (!tempObj[item.name].collectible && item.collectible) {
					tempObj[item.name] = item
				}
			}
		})
		var result = []
		var i = 0
		for (var item in tempObj) {
			result[i++] = tempObj[item]
		}
		return result
	},

	detach: function(element) {
		//console.log('detaching from element', element);
		element.textcomplete('destroy');
	},

	getRarity: function(card) {
		if (card.set == 'Basic') {
			card.rarity = 'Free';
		}
		return card.rarity;
	},

	getCard: function(cardName) {
		// console.log('GO!! parsing card', cardName)
		if (!cardName) {
			// console.log('no cardName', cardName)
			return null
		}
		cardName = cardName.replace(new RegExp('’', 'g'), '\'')
		
		var result;
		var possibleResult;

		// cf http://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break
		// console.log('preparing', cardName)
		parseCardsText.jsonDatabase.some(function(card) {
			// Seems like variations (the non-standard version) of the card has a lowercase letter in the name
			if (card.id == cardName) {
				result = card;
				return true;
			}
			else if (card.name.toLowerCase() == cardName.toLowerCase()) {
				// console.log('getting card', cardName, card)
				if (card.set == 'Basic') {
					card.rarity = 'Free';
				}
				// Keep only valid cards
				var res = card.type != 'Hero' && card.type != 'Enchantment' 
				res = res && card.set != 'Hero_skins'
				if (res) {
					possibleResult = card
				}
				res = res && (card.id.toLowerCase() == card.id || card.id.toUpperCase() == card.id) && card.id.match(/.*\d$/)
				// console.log('card id matches regex?', card.id, card.id.match(/.*\d$/));
				// console.log('card type', card.type)
				if (res) {
					// console.log('\tconsidering', card)
					result = card;
					if (result.cardImage) {
						// console.log('returning card', result);
						return true;
					}
				}
			}
		});
		return result || possibleResult;
	},

	jsonDatabase: [
		{
			"artist": "Eric Browning",
			"attack": 1,
			"cardImage": "FP1_003.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Limon résonnant"
			},
			"health": 2,
			"id": "FP1_003",
			"name": "Echoing Ooze",
			"rarity": "Epic",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Brandon Kitkouski",
			"cardImage": "EX1_610.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Piège explosif"
			},
			"id": "EX1_610",
			"name": "Explosive Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "LOE_115a.png",
			"cost": 0,
			"fr": {
				"name": "Idole corbeau"
			},
			"id": "LOE_115a",
			"name": "Raven Idol",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA17_2.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "BRMA17_2",
			"name": "Nefarian",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 0,
			"cardImage": "LOEA06_02th.png",
			"cost": 1,
			"fr": {
				"name": "Statue de terrestre"
			},
			"health": 5,
			"id": "LOEA06_02th",
			"name": "Earthen Statue",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 3,
			"cardImage": "AT_089.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Lieutenant de la garde d’os"
			},
			"health": 2,
			"id": "AT_089",
			"name": "Boneguard Lieutenant",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "GAME_006.png",
			"cost": 2,
			"fr": {
				"name": "NOOOOOOOOOOOON !"
			},
			"id": "GAME_006",
			"name": "NOOOOOOOOOOOO",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "AT_056.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Tir puissant"
			},
			"id": "AT_056",
			"name": "Powershot",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "NEW1_008b.png",
			"cost": 0,
			"fr": {
				"name": "Secrets anciens"
			},
			"id": "NEW1_008b",
			"name": "Ancient Secrets",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_278.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Kriss"
			},
			"id": "EX1_278",
			"name": "Shiv",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_049.png",
			"cost": 0,
			"fr": {
				"name": "Destroy all Mana"
			},
			"id": "XXX_049",
			"name": "Destroy all Mana",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "TB_KTRAF_12.png",
			"cost": 8,
			"fr": {
				"name": "Le Recousu"
			},
			"health": 8,
			"id": "TB_KTRAF_12",
			"name": "Patchwerk",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 2,
			"cardImage": "CS2_173.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Guerrier branchie-bleue"
			},
			"health": 1,
			"id": "CS2_173",
			"name": "Bluegill Warrior",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_508o.png",
			"fr": {
				"name": "Mlarggragllabl !"
			},
			"id": "EX1_508o",
			"name": "Mlarggragllabl!",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "AT_029.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Boucanier"
			},
			"health": 1,
			"id": "AT_029",
			"name": "Buccaneer",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Ruan Jia",
			"attack": 8,
			"cardImage": "BRM_030.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Nefarian"
			},
			"health": 8,
			"id": "BRM_030",
			"name": "Nefarian",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_9.png",
			"cost": 0,
			"fr": {
				"name": "Bonus : Râle d’agonie"
			},
			"id": "TB_PickYourFate_9",
			"name": "Deathrattle Bonus",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA01_4.png",
			"cost": 3,
			"fr": {
				"name": "Chopez-les !"
			},
			"id": "BRMA01_4",
			"name": "Get 'em!",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "OG_319.png",
			"cost": 7,
			"fr": {
				"name": "Empereur jumeau Vek’nilash"
			},
			"health": 6,
			"id": "OG_319",
			"name": "Twin Emperor Vek'nilash",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Dan Brereton",
			"attack": 1,
			"cardImage": "FP1_011.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Tisseuse"
			},
			"health": 1,
			"id": "FP1_011",
			"name": "Webspinner",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_7_EnchMinion.png",
			"fr": {
				"name": "Destin"
			},
			"id": "TB_PickYourFate_7_EnchMinion",
			"name": "Fate",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX12_02e.png",
			"fr": {
				"name": "Décimer"
			},
			"id": "NAX12_02e",
			"name": "Decimate",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_046e.png",
			"fr": {
				"name": "Acier trempé"
			},
			"id": "EX1_046e",
			"name": "Tempered",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "TU4a_006.png",
			"fr": {
				"name": "Jaina Portvaillant"
			},
			"health": 27,
			"id": "TU4a_006",
			"name": "Jaina Proudmoore",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"attack": 1,
			"cardImage": "LOEA09_4.png",
			"cost": 1,
			"durability": 2,
			"fr": {
				"name": "Lance rare"
			},
			"id": "LOEA09_4",
			"name": "Rare Spear",
			"set": "Loe",
			"type": "Weapon"
		},
		{
			"cardImage": "XXX_060.png",
			"cost": 0,
			"fr": {
				"name": "Damage All"
			},
			"id": "XXX_060",
			"name": "Damage All",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_011a.png",
			"fr": {
				"name": "Rayon réducteur"
			},
			"id": "GVG_011a",
			"name": "Shrink Ray",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_BlingBrawl_Blade2e.png",
			"fr": {
				"name": "Lame de Bling-o-tron HEROÏQUE"
			},
			"id": "TB_BlingBrawl_Blade2e",
			"name": "Blingtron's Blade HERO",
			"rarity": "Unknown_6",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Gonzalo Ordonez",
			"attack": 5,
			"cardImage": "AT_102.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Jormungar capturé"
			},
			"health": 9,
			"id": "AT_102",
			"name": "Captured Jormungar",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Dan Brereton",
			"attack": 3,
			"cardImage": "CS2_172.png",
			"collectible": true,
			"cost": 2,
			"faction": "HORDE",
			"fr": {
				"name": "Raptor Rougefange"
			},
			"health": 2,
			"id": "CS2_172",
			"name": "Bloodfen Raptor",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "AT_132_ROGUE.png",
			"cost": 2,
			"fr": {
				"name": "Dagues empoisonnées"
			},
			"id": "AT_132_ROGUE",
			"name": "Poisoned Daggers",
			"playerClass": "Rogue",
			"set": "Tgt",
			"type": "Hero_power"
		},
		{
			"cardImage": "TBA01_1.png",
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 60,
			"id": "TBA01_1",
			"name": "Ragnaros the Firelord",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"artist": "Doug Alexander",
			"attack": 2,
			"cardImage": "EX1_362.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Protecteur d’Argent"
			},
			"health": 2,
			"id": "EX1_362",
			"name": "Argent Protector",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Scott Altmann",
			"cardImage": "EX1_581.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Assommer"
			},
			"id": "EX1_581",
			"name": "Sap",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_625.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Forme d’Ombre"
			},
			"id": "EX1_625",
			"name": "Shadowform",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "NAX8_02.png",
			"cost": 2,
			"fr": {
				"name": "Moisson"
			},
			"id": "NAX8_02",
			"name": "Harvest",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "Scott Altmann",
			"attack": 0,
			"cardImage": "EX1_575.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Totem de vague de mana"
			},
			"health": 3,
			"id": "EX1_575",
			"name": "Mana Tide Totem",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 4,
			"cardImage": "EX1_595.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Maître de culte"
			},
			"health": 2,
			"id": "EX1_595",
			"name": "Cult Master",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_033o.png",
			"fr": {
				"name": "Œil céleste"
			},
			"id": "NEW1_033o",
			"name": "Eye In The Sky",
			"playerClass": "Hunter",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_RMC_001.png",
			"fr": {
				"name": "TB_EnchRandomManaCost"
			},
			"id": "TB_RMC_001",
			"name": "TB_EnchRandomManaCost",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_BlingBrawl_Hero1p.png",
			"cost": 2,
			"fr": {
				"name": "Affûtage"
			},
			"id": "TB_BlingBrawl_Hero1p",
			"name": "Sharpen",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "AT_123.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Frissegueule"
			},
			"health": 6,
			"id": "AT_123",
			"name": "Chillmaw",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Chris Seaman",
			"cardImage": "GVG_056t.png",
			"cost": 0,
			"fr": {
				"name": "Mine enfouie"
			},
			"id": "GVG_056t",
			"name": "Burrowing Mine",
			"playerClass": "Warrior",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "GAME_005e.png",
			"fr": {
				"name": "La pièce"
			},
			"id": "GAME_005e",
			"name": "The Coin",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_573b.png",
			"cost": 0,
			"fr": {
				"name": "Leçon de Shan’do"
			},
			"id": "EX1_573b",
			"name": "Shan'do's Lesson",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Brian Despain",
			"attack": 2,
			"cardImage": "EX1_556.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Golem des moissons"
			},
			"health": 3,
			"id": "EX1_556",
			"name": "Harvest Golem",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX1_05.png",
			"cost": 7,
			"fr": {
				"name": "Nuée de sauterelles"
			},
			"id": "NAX1_05",
			"name": "Locust Swarm",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA07_2_2c_TB.png",
			"cost": 0,
			"fr": {
				"name": "MOI TOUT CASSER"
			},
			"id": "BRMA07_2_2c_TB",
			"name": "ME SMASH",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Samwise",
			"attack": 3,
			"cardImage": "NEW1_023.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Dragon féerique"
			},
			"health": 2,
			"id": "NEW1_023",
			"name": "Faerie Dragon",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "NAX7_02.png",
			"cost": 2,
			"fr": {
				"name": "Doublure"
			},
			"health": 7,
			"id": "NAX7_02",
			"name": "Understudy",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Court Jones",
			"attack": 2,
			"cardImage": "CS2_147.png",
			"collectible": true,
			"cost": 4,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Inventrice gnome"
			},
			"health": 4,
			"id": "CS2_147",
			"name": "Gnomish Inventor",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_181e.png",
			"fr": {
				"name": "En pleine forme"
			},
			"id": "CS2_181e",
			"name": "Full Strength",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Malcolm Davis",
			"attack": 1,
			"cardImage": "DS1_175.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Loup des bois"
			},
			"health": 1,
			"id": "DS1_175",
			"name": "Timber Wolf",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "NEW1_020.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Pyromancien sauvage"
			},
			"health": 2,
			"id": "NEW1_020",
			"name": "Wild Pyromancer",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_625t.png",
			"cost": 2,
			"fr": {
				"name": "Pointe mentale"
			},
			"id": "EX1_625t",
			"name": "Mind Spike",
			"playerClass": "Priest",
			"set": "Expert1",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_017.png",
			"cost": 0,
			"fr": {
				"name": "Draw 3 Cards"
			},
			"id": "XXX_017",
			"name": "Draw 3 Cards",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "CRED_02.png",
			"cost": 6,
			"fr": {
				"name": "Eric Dodds"
			},
			"health": 5,
			"id": "CRED_02",
			"name": "Eric Dodds",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"cardImage": "OG_094.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Mot de pouvoir : Tentacules"
			},
			"id": "OG_094",
			"name": "Power Word: Tentacles",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_12.png",
			"cost": 0,
			"fr": {
				"name": "Médaillon de Medivh"
			},
			"id": "LOEA16_12",
			"name": "Medivh's Locket",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_055e.png",
			"fr": {
				"name": "Ferraille tordue"
			},
			"id": "GVG_055e",
			"name": "Screwy Jank",
			"playerClass": "Warrior",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"attack": 7,
			"cardImage": "DREAM_03.png",
			"cost": 4,
			"fr": {
				"name": "Drake émeraude"
			},
			"health": 6,
			"id": "DREAM_03",
			"name": "Emerald Drake",
			"playerClass": "Dream",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA01_01.png",
			"fr": {
				"name": "Écumeur du soleil Phaerix"
			},
			"health": 30,
			"id": "LOEA01_01",
			"name": "Sun Raider Phaerix",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "L. Lullabi & S. Srisuwan",
			"cardImage": "OG_202a.png",
			"cost": 0,
			"fr": {
				"name": "Force d’Y’Shaarj"
			},
			"id": "OG_202a",
			"name": "Y'Shaarj's Strength",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_01e.png",
			"fr": {
				"name": "Enchantement de fuite du temple"
			},
			"id": "LOEA04_01e",
			"name": "Temple Escape Enchant",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Daren Bader",
			"attack": 6,
			"cardImage": "EX1_623.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Massacreur du temple"
			},
			"health": 6,
			"id": "EX1_623",
			"name": "Temple Enforcer",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA07_03h.png",
			"cost": 0,
			"fr": {
				"name": "Fuir la mine !"
			},
			"id": "LOEA07_03h",
			"name": "Flee the Mine!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_291e.png",
			"fr": {
				"name": "Ténèbres vacillantes"
			},
			"id": "OG_291e",
			"name": "Flickering Darkness",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA17_8.png",
			"cost": 0,
			"fr": {
				"name": "Frappe de Nefarian"
			},
			"id": "BRMA17_8",
			"name": "Nefarian Strikes!",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Terese Nielsen",
			"cardImage": "EX1_164.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Nourrir"
			},
			"id": "EX1_164",
			"name": "Nourish",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "EX1_130a.png",
			"cost": 1,
			"fr": {
				"name": "Défenseur"
			},
			"health": 1,
			"id": "EX1_130a",
			"name": "Defender",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 4,
			"cardImage": "DS1_055.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Soigneuse sombrécaille"
			},
			"health": 5,
			"id": "DS1_055",
			"name": "Darkscale Healer",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Jason Chan",
			"cardImage": "EX1_287.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Contresort"
			},
			"id": "EX1_287",
			"name": "Counterspell",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Steve Prescott",
			"attack": 0,
			"cardImage": "EX1_557.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Nat Pagle"
			},
			"health": 4,
			"id": "EX1_557",
			"name": "Nat Pagle",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"attack": 1,
			"cardImage": "NEW1_016.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Perroquet du capitaine"
			},
			"health": 1,
			"id": "NEW1_016",
			"name": "Captain's Parrot",
			"rarity": "Epic",
			"set": "Reward",
			"type": "Minion"
		},
		{
			"cardImage": "NAX14_01.png",
			"fr": {
				"name": "Saphiron"
			},
			"health": 30,
			"id": "NAX14_01",
			"name": "Sapphiron",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "EX1_355.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Bénédiction du champion"
			},
			"id": "EX1_355",
			"name": "Blessed Champion",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_073e2.png",
			"fr": {
				"name": "Sang froid"
			},
			"id": "CS2_073e2",
			"name": "Cold Blood",
			"playerClass": "Rogue",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_034_H2_AT_132.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu rang 2"
			},
			"id": "CS2_034_H2_AT_132",
			"name": "Fireblast Rank 2",
			"playerClass": "Mage",
			"set": "Hero_skins",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOEA09_3d.png",
			"cost": 0,
			"fr": {
				"name": "Faim"
			},
			"id": "LOEA09_3d",
			"name": "Getting Hungry",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "TB_SPT_Minions.png",
			"fr": {
				"name": "Compteur de serviteurs tués pendant l’épreuve"
			},
			"health": 1,
			"id": "TB_SPT_Minions",
			"name": "Trial Minions Killed Tracker",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 4,
			"cardImage": "AT_117.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maîtresse de cérémonie"
			},
			"health": 2,
			"id": "AT_117",
			"name": "Master of Ceremonies",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Kan Lui",
			"attack": 2,
			"cardImage": "OG_325.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Larve putride"
			},
			"health": 5,
			"id": "OG_325",
			"name": "Carrion Grub",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_3e.png",
			"fr": {
				"name": "Lanterne de puissance"
			},
			"id": "LOEA16_3e",
			"name": "Lantern of Power",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 2,
			"cardImage": "GVG_095.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Sapeur gobelin"
			},
			"health": 4,
			"id": "GVG_095",
			"name": "Goblin Sapper",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Erik Ko",
			"attack": 1,
			"cardImage": "EX1_001.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Gardelumière"
			},
			"health": 2,
			"id": "EX1_001",
			"name": "Lightwarden",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Bernie Kang",
			"attack": 2,
			"cardImage": "LOE_010.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Serpent de la fosse"
			},
			"health": 1,
			"id": "LOE_010",
			"name": "Pit Snake",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "AT_028e.png",
			"fr": {
				"name": "Lance de chi"
			},
			"id": "AT_028e",
			"name": "Chi Lance",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Ariel Olivetti",
			"cardImage": "EX1_124.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Éviscération"
			},
			"id": "EX1_124",
			"name": "Eviscerate",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Andrew Hou",
			"attack": 1,
			"cardImage": "OG_006a.png",
			"cost": 1,
			"fr": {
				"name": "Murloc de la Main d’argent"
			},
			"health": 1,
			"id": "OG_006a",
			"name": "Silver Hand Murloc",
			"playerClass": "Paladin",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "EX1_583.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Prêtresse d’Élune"
			},
			"health": 4,
			"id": "EX1_583",
			"name": "Priestess of Elune",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "AT_035t.png",
			"cost": 0,
			"fr": {
				"name": "Embuscade !"
			},
			"id": "AT_035t",
			"name": "Ambush!",
			"playerClass": "Rogue",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_048e.png",
			"fr": {
				"name": "Dents de métal"
			},
			"id": "GVG_048e",
			"name": "Metal Teeth",
			"playerClass": "Hunter",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "OG_311.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Lumière dans les ténèbres"
			},
			"id": "OG_311",
			"name": "A Light in the Darkness",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 1,
			"cardImage": "AT_133.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Jouteuse de Gadgetzan"
			},
			"health": 2,
			"id": "AT_133",
			"name": "Gadgetzan Jouster",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "OG_080de.png",
			"fr": {
				"name": "Pâlerette"
			},
			"id": "OG_080de",
			"name": "Fadeleaf",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_611e.png",
			"fr": {
				"name": "Pris au piège"
			},
			"id": "EX1_611e",
			"name": "Trapped",
			"playerClass": "Hunter",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Efrem Palacios",
			"cardImage": "OG_048.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Marque d’Y’Shaarj"
			},
			"id": "OG_048",
			"name": "Mark of Y'Shaarj",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "TU4a_004.png",
			"cost": 3,
			"fr": {
				"name": "Lardeur TOUT CASSER !"
			},
			"id": "TU4a_004",
			"name": "Hogger SMASH!",
			"rarity": "Common",
			"set": "Missions",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_549o.png",
			"fr": {
				"name": "Courroux bestial"
			},
			"id": "EX1_549o",
			"name": "Bestial Wrath",
			"playerClass": "Hunter",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Vance Kovacs",
			"attack": 2,
			"cardImage": "EX1_004.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Jeune prêtresse"
			},
			"health": 1,
			"id": "EX1_004",
			"name": "Young Priestess",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_106e.png",
			"fr": {
				"name": "Bricolé à fond"
			},
			"id": "GVG_106e",
			"name": "Junked Up",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "LOE_020.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Dromadaire du désert"
			},
			"health": 4,
			"id": "LOE_020",
			"name": "Desert Camel",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_044e.png",
			"fr": {
				"name": "Gain de niveau !"
			},
			"id": "EX1_044e",
			"name": "Level Up!",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"cardImage": "AT_061.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Prêt à tirer"
			},
			"id": "AT_061",
			"name": "Lock and Load",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA05_3He.png",
			"fr": {
				"name": "Bombe vivante"
			},
			"id": "BRMA05_3He",
			"name": "Living Bomb",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA12_4.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : vert"
			},
			"id": "BRMA12_4",
			"name": "Brood Affliction: Green",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "CRED_39.png",
			"cost": 2,
			"fr": {
				"name": "Ryan Chew"
			},
			"health": 3,
			"id": "CRED_39",
			"name": "Ryan Chew",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "LOE_111.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Mal déterré"
			},
			"id": "LOE_111",
			"name": "Excavated Evil",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_9_Ench.png",
			"fr": {
				"name": "Fate 9 Ench. Deathrattle bonus"
			},
			"id": "TB_PickYourFate_9_Ench",
			"name": "Fate 9 Ench. Deathrattle bonus",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Steve Prescott",
			"attack": 1,
			"cardImage": "LOE_006.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Conservateur du musée"
			},
			"health": 2,
			"id": "LOE_006",
			"name": "Museum Curator",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "AT_005t.png",
			"cost": 3,
			"fr": {
				"name": "Sanglier"
			},
			"health": 2,
			"id": "AT_005t",
			"name": "Boar",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "GVG_047.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Sabotage"
			},
			"id": "GVG_047",
			"name": "Sabotage",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA06_2H.png",
			"cost": 2,
			"fr": {
				"name": "Le chambellan"
			},
			"id": "BRMA06_2H",
			"name": "The Majordomo",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX9_01.png",
			"fr": {
				"name": "Baron Vaillefendre"
			},
			"health": 7,
			"id": "NAX9_01",
			"name": "Baron Rivendare",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "CS2_045e.png",
			"fr": {
				"name": "Arme croque-roc"
			},
			"id": "CS2_045e",
			"name": "Rockbiter Weapon",
			"playerClass": "Shaman",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX15_02H.png",
			"cost": 0,
			"fr": {
				"name": "Trait de givre"
			},
			"id": "NAX15_02H",
			"name": "Frost Blast",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"attack": 3,
			"cardImage": "BRMA06_4H.png",
			"cost": 2,
			"fr": {
				"name": "Acolyte attise-flammes"
			},
			"health": 3,
			"id": "BRMA06_4H",
			"name": "Flamewaker Acolyte",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "BRM_007.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Recrutement"
			},
			"id": "BRM_007",
			"name": "Gang Up",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Ben Zhang",
			"attack": 5,
			"cardImage": "BRM_010t.png",
			"cost": 3,
			"fr": {
				"name": "Druidesse de la Flamme"
			},
			"health": 2,
			"id": "BRM_010t",
			"name": "Druid of the Flame",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_158e.png",
			"fr": {
				"name": "Âme de la forêt"
			},
			"id": "EX1_158e",
			"name": "Soul of the Forest",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Brereton",
			"attack": 2,
			"cardImage": "CS2_146.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Matelot des mers du Sud"
			},
			"health": 1,
			"id": "CS2_146",
			"name": "Southsea Deckhand",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Greg Hildebrandt",
			"attack": 1,
			"cardImage": "EX1_402.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Fabricante d’armures"
			},
			"health": 4,
			"id": "EX1_402",
			"name": "Armorsmith",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Robb Shoberg",
			"attack": 3,
			"cardImage": "FP1_022.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Implorateur du Vide"
			},
			"health": 4,
			"id": "FP1_022",
			"name": "Voidcaller",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Evgeniy Zagumennyy",
			"attack": 2,
			"cardImage": "AT_071.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Championne d’Alexstrasza"
			},
			"health": 3,
			"id": "AT_071",
			"name": "Alexstrasza's Champion",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA01_11he.png",
			"fr": {
				"name": "Mode héroïque"
			},
			"id": "LOEA01_11he",
			"name": "Heroic Mode",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX4_04.png",
			"cost": 0,
			"fr": {
				"name": "Réanimation morbide"
			},
			"id": "NAX4_04",
			"name": "Raise Dead",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_292e.png",
			"fr": {
				"name": "Dévotion de la nuit"
			},
			"id": "OG_292e",
			"name": "Night's Devotion",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 6,
			"cardImage": "AT_041.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Chevalier des étendues sauvages"
			},
			"health": 6,
			"id": "AT_041",
			"name": "Knight of the Wild",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA17_8H.png",
			"cost": 0,
			"fr": {
				"name": "Frappe de Nefarian"
			},
			"id": "BRMA17_8H",
			"name": "Nefarian Strikes!",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX12_01H.png",
			"fr": {
				"name": "Gluth"
			},
			"health": 45,
			"id": "NAX12_01H",
			"name": "Gluth",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_101.png",
			"cost": 0,
			"fr": {
				"name": "Set health to full"
			},
			"id": "XXX_101",
			"name": "Set health to full",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "NAX3_01H.png",
			"fr": {
				"name": "Maexxna"
			},
			"health": 45,
			"id": "NAX3_01H",
			"name": "Maexxna",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_058.png",
			"cost": 0,
			"fr": {
				"name": "Weapon Nerf"
			},
			"id": "XXX_058",
			"name": "Weapon Nerf",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "AT_132_SHAMANa.png",
			"cost": 0,
			"fr": {
				"name": "Totem de soins"
			},
			"health": 2,
			"id": "AT_132_SHAMANa",
			"name": "Healing Totem",
			"playerClass": "Shaman",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Ryan Metcalf",
			"cardImage": "LOE_026.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Tous les murlocs de ta vie"
			},
			"id": "LOE_026",
			"name": "Anyfin Can Happen",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Leo Che",
			"cardImage": "EX1_275.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Cône de froid"
			},
			"id": "EX1_275",
			"name": "Cone of Cold",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "TU4a_002.png",
			"cost": 1,
			"fr": {
				"name": "Gnoll rivepatte"
			},
			"health": 1,
			"id": "TU4a_002",
			"name": "Riverpaw Gnoll",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 10,
			"cardImage": "OG_141.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Béhémoth sans-visage"
			},
			"health": 10,
			"id": "OG_141",
			"name": "Faceless Behemoth",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_392.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Rage du combat"
			},
			"id": "EX1_392",
			"name": "Battle Rage",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "AT_077e.png",
			"fr": {
				"name": "Pique supplémentaire"
			},
			"id": "AT_077e",
			"name": "Extra Poke",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA16_14.png",
			"cost": 0,
			"fr": {
				"name": "Pipe de Khadgar"
			},
			"id": "LOEA16_14",
			"name": "Khadgar's Pipe",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "AT_037a.png",
			"cost": 0,
			"fr": {
				"name": "Racines vivantes"
			},
			"id": "AT_037a",
			"name": "Living Roots",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Matt Gaser",
			"attack": 3,
			"cardImage": "GVG_020.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gangrecanon"
			},
			"health": 5,
			"id": "GVG_020",
			"name": "Fel Cannon",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Ben Thompson",
			"attack": 3,
			"cardImage": "AT_131.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Eydis Plaie-sombre"
			},
			"health": 4,
			"id": "AT_131",
			"name": "Eydis Darkbane",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Zolton Boros",
			"attack": 3,
			"cardImage": "GVG_023.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Robot barbier gobelin"
			},
			"health": 2,
			"id": "GVG_023",
			"name": "Goblin Auto-Barber",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Bernie Kang",
			"attack": 3,
			"cardImage": "CS2_237.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Busard affamé"
			},
			"health": 2,
			"id": "CS2_237",
			"name": "Starving Buzzard",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 7,
			"cardImage": "CS2_161.png",
			"collectible": true,
			"cost": 7,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Assassin de Ravenholdt"
			},
			"health": 5,
			"id": "CS2_161",
			"name": "Ravenholdt Assassin",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX1_01.png",
			"fr": {
				"name": "Anub’Rekhan"
			},
			"health": 30,
			"id": "NAX1_01",
			"name": "Anub'Rekhan",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"attack": 10,
			"cardImage": "LOEA04_23h.png",
			"cost": 7,
			"fr": {
				"name": "Insecte géant"
			},
			"health": 6,
			"id": "LOEA04_23h",
			"name": "Giant Insect",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "GVG_014.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Vol’jin"
			},
			"health": 2,
			"id": "GVG_014",
			"name": "Vol'jin",
			"playerClass": "Priest",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "EX1_160t.png",
			"cost": 2,
			"fr": {
				"name": "Panthère"
			},
			"health": 2,
			"id": "EX1_160t",
			"name": "Panther",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Vance Kovacs",
			"cardImage": "CS2_093.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Consécration"
			},
			"id": "CS2_093",
			"name": "Consecration",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Wei Wang",
			"cardImage": "NEW1_031.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Compagnon animal"
			},
			"id": "NEW1_031",
			"name": "Animal Companion",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "TU4c_006.png",
			"cost": 1,
			"fr": {
				"name": "Banane"
			},
			"id": "TU4c_006",
			"name": "Bananas",
			"rarity": "Common",
			"set": "Missions",
			"type": "Spell"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_384.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Courroux vengeur"
			},
			"id": "EX1_384",
			"name": "Avenging Wrath",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 2,
			"cardImage": "EX1_010.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Infiltrateur worgen"
			},
			"health": 1,
			"id": "EX1_010",
			"name": "Worgen Infiltrator",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX7_05.png",
			"cost": 1,
			"fr": {
				"name": "Cristal de contrôle mental"
			},
			"id": "NAX7_05",
			"name": "Mind Control Crystal",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"cardImage": "NEW1_007a.png",
			"cost": 0,
			"fr": {
				"name": "Météores"
			},
			"id": "NEW1_007a",
			"name": "Starfall",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 1,
			"cardImage": "NEW1_017.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Crabe affamé"
			},
			"health": 2,
			"id": "NEW1_017",
			"name": "Hungry Crab",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_008.png",
			"cost": 0,
			"fr": {
				"name": "Freeze"
			},
			"id": "XXX_008",
			"name": "Freeze",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "FP1_005e.png",
			"fr": {
				"name": "Consumer"
			},
			"id": "FP1_005e",
			"name": "Consume",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "EX1_243.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Diable de poussière"
			},
			"health": 1,
			"id": "EX1_243",
			"name": "Dust Devil",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"cardImage": "CS2_005.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Griffe"
			},
			"id": "CS2_005",
			"name": "Claw",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_030.png",
			"cost": 0,
			"fr": {
				"name": "Opponent Disconnect"
			},
			"id": "XXX_030",
			"name": "Opponent Disconnect",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Lucas Graciano",
			"cardImage": "EX1_126.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Trahison"
			},
			"id": "EX1_126",
			"name": "Betrayal",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "OG_113e.png",
			"fr": {
				"name": "Puissance du peuple"
			},
			"id": "OG_113e",
			"name": "Power of the People",
			"playerClass": "Warlock",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "TB_KTRAF_6m.png",
			"cost": 1,
			"fr": {
				"name": "Gelée polluée"
			},
			"health": 2,
			"id": "TB_KTRAF_6m",
			"name": "Fallout Slime",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 3,
			"cardImage": "FP1_016.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Âme gémissante"
			},
			"health": 5,
			"id": "FP1_016",
			"name": "Wailing Soul",
			"rarity": "Rare",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_014a.png",
			"fr": {
				"name": "Dissimulé"
			},
			"id": "GVG_014a",
			"name": "Shadowed",
			"playerClass": "Priest",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_FactionWar_Boss_Rag_0.png",
			"cost": 2,
			"fr": {
				"name": "Tapette à mouches"
			},
			"id": "TB_FactionWar_Boss_Rag_0",
			"name": "Swat Fly",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"artist": "Dave Allsop",
			"attack": 5,
			"cardImage": "NEW1_005.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Kidnappeur"
			},
			"health": 3,
			"id": "NEW1_005",
			"name": "Kidnapper",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KTRAF_10e.png",
			"fr": {
				"name": "Sombre puissance"
			},
			"id": "TB_KTRAF_10e",
			"name": "Dark Power",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "TU4f_002.png",
			"cost": 1,
			"fr": {
				"name": "Éclaireur pandaren"
			},
			"health": 1,
			"id": "TU4f_002",
			"name": "Pandaren Scout",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_27H.png",
			"cost": 10,
			"fr": {
				"name": "La sentinelle d’acier"
			},
			"health": 10,
			"id": "LOEA16_27H",
			"name": "The Steel Sentinel",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 3,
			"cardImage": "OG_202.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gardien du bourbier"
			},
			"health": 3,
			"id": "OG_202",
			"name": "Mire Keeper",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Dan Brereton",
			"cardImage": "AT_037.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Racines vivantes"
			},
			"id": "AT_037",
			"name": "Living Roots",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_011o.png",
			"fr": {
				"name": "Rugissement sauvage"
			},
			"id": "CS2_011o",
			"name": "Savage Roar",
			"playerClass": "Druid",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_080ee.png",
			"fr": {
				"name": "Églantine"
			},
			"id": "OG_080ee",
			"name": "Briarthorn",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Luke Mancini",
			"attack": 4,
			"cardImage": "EX1_033.png",
			"collectible": true,
			"cost": 6,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Harpie Furie-des-vents"
			},
			"health": 5,
			"id": "EX1_033",
			"name": "Windfury Harpy",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "FP1_023e.png",
			"fr": {
				"name": "Puissance de la ziggourat"
			},
			"id": "FP1_023e",
			"name": "Power of the Ziggurat",
			"playerClass": "Priest",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"attack": 3,
			"cardImage": "TB_KTRAF_8.png",
			"cost": 8,
			"fr": {
				"name": "Instructeur Razuvious"
			},
			"health": 3,
			"id": "TB_KTRAF_8",
			"name": "Instructor Razuvious",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_5.png",
			"cost": 10,
			"fr": {
				"name": "Miroir du destin"
			},
			"id": "LOEA16_5",
			"name": "Mirror of Doom",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA09_3b.png",
			"cost": 0,
			"fr": {
				"name": "Faim"
			},
			"id": "LOEA09_3b",
			"name": "Getting Hungry",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Warren Mahy",
			"attack": 3,
			"cardImage": "AT_014.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Ombrefiel"
			},
			"health": 3,
			"id": "AT_014",
			"name": "Shadowfiend",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "OG_200e.png",
			"fr": {
				"name": "Destin funeste évité"
			},
			"id": "OG_200e",
			"name": "Doom Free",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "EX1_345t.png",
			"cost": 0,
			"fr": {
				"name": "Ombre du néant"
			},
			"health": 1,
			"id": "EX1_345t",
			"name": "Shadow of Nothing",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX1h_01.png",
			"fr": {
				"name": "Anub’Rekhan"
			},
			"health": 45,
			"id": "NAX1h_01",
			"name": "Anub'Rekhan",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_105.png",
			"cost": 0,
			"fr": {
				"name": "Add 8 to Health."
			},
			"id": "XXX_105",
			"name": "Add 8 to Health.",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_164a.png",
			"cost": 0,
			"fr": {
				"name": "Nourrir"
			},
			"id": "EX1_164a",
			"name": "Nourish",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_8te.png",
			"fr": {
				"name": "Lignée draconique"
			},
			"id": "BRMA12_8te",
			"name": "Draconic Lineage",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"cardImage": "FP1_028e.png",
			"fr": {
				"name": "Appel des ténèbres"
			},
			"id": "FP1_028e",
			"name": "Darkness Calls",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_24H.png",
			"cost": 10,
			"fr": {
				"name": "Aileron-Géant"
			},
			"health": 10,
			"id": "LOEA16_24H",
			"name": "Giantfin",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "OG_027.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Évolution"
			},
			"id": "OG_027",
			"name": "Evolve",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Og",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "TBST_005.png",
			"cost": 3,
			"fr": {
				"name": "Voleur JcJ"
			},
			"health": 6,
			"id": "TBST_005",
			"name": "OLDPvP Rogue",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "OG_290e.png",
			"fr": {
				"name": "Dévotion de l’implorateur"
			},
			"id": "OG_290e",
			"name": "Caller Devotion",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_23.png",
			"cost": 5,
			"fr": {
				"name": "Seigneur Ondulance"
			},
			"health": 5,
			"id": "LOEA16_23",
			"name": "Lord Slitherspear",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_101e.png",
			"fr": {
				"name": "Pur"
			},
			"id": "GVG_101e",
			"name": "Pure",
			"playerClass": "Paladin",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "EX1_tk29.png",
			"cost": 5,
			"fr": {
				"name": "Diablosaure"
			},
			"health": 5,
			"id": "EX1_tk29",
			"name": "Devilsaur",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "LOEA01_11.png",
			"cost": 0,
			"fr": {
				"name": "Baguette du Soleil"
			},
			"health": 5,
			"id": "LOEA01_11",
			"name": "Rod of the Sun",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_11b.png",
			"cost": 0,
			"fr": {
				"name": "Bonus : murloc"
			},
			"id": "TB_PickYourFate_11b",
			"name": "Murloc Bonus",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_570e.png",
			"fr": {
				"name": "Morsure"
			},
			"id": "EX1_570e",
			"name": "Bite",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "James Zhang",
			"cardImage": "EX1_137.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Casse-tête"
			},
			"id": "EX1_137",
			"name": "Headcrack",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "FP1_019t.png",
			"cost": 1,
			"fr": {
				"name": "Tréant"
			},
			"health": 2,
			"id": "FP1_019t",
			"name": "Treant",
			"playerClass": "Druid",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "OG_239.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "MALÉDICTION !"
			},
			"id": "OG_239",
			"name": "DOOM!",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Eric Braddock",
			"attack": 1,
			"cardImage": "OG_284.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Géomancienne du Crépuscule"
			},
			"health": 4,
			"id": "OG_284",
			"name": "Twilight Geomancer",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "TB_SPT_Length.png",
			"cost": 0,
			"fr": {
				"name": "Durée de l’épreuve"
			},
			"health": 1,
			"id": "TB_SPT_Length",
			"name": "Trial Length",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 2,
			"cardImage": "BRM_022t.png",
			"cost": 1,
			"fr": {
				"name": "Dragonnet noir"
			},
			"health": 1,
			"id": "BRM_022t",
			"name": "Black Whelp",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "GVG_011.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Réducteur fou"
			},
			"health": 2,
			"id": "GVG_011",
			"name": "Shrinkmeister",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 1,
			"cardImage": "EX1_582.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Mage de Dalaran"
			},
			"health": 4,
			"id": "EX1_582",
			"name": "Dalaran Mage",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA14_6H.png",
			"cost": 4,
			"fr": {
				"name": "Activer Électron"
			},
			"id": "BRMA14_6H",
			"name": "Activate Electron",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "GVG_032b.png",
			"cost": 0,
			"fr": {
				"name": "Don de carte"
			},
			"id": "GVG_032b",
			"name": "Gift of Cards",
			"playerClass": "Druid",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_067a.png",
			"fr": {
				"name": "Magie métabolisée"
			},
			"id": "GVG_067a",
			"name": "Metabolized Magic",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_CoOpBossSpell_1.png",
			"cost": 0,
			"fr": {
				"name": "Fixer des priorités"
			},
			"id": "TB_CoOpBossSpell_1",
			"name": "Prioritize",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpBossSpell_4.png",
			"cost": 0,
			"fr": {
				"name": "Suralimenter"
			},
			"id": "TB_CoOpBossSpell_4",
			"name": "Overclock",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"attack": 5,
			"cardImage": "GVG_083.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Robot réparateur amélioré"
			},
			"health": 5,
			"id": "GVG_083",
			"name": "Upgraded Repair Bot",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "TB_GiftExchange_Snowball.png",
			"cost": 0,
			"fr": {
				"name": "Boules de neige durcie"
			},
			"id": "TB_GiftExchange_Snowball",
			"name": "Hardpacked Snowballs",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "AT_132_ROGUEt.png",
			"cost": 1,
			"durability": 2,
			"fr": {
				"name": "Dague empoisonnée"
			},
			"id": "AT_132_ROGUEt",
			"name": "Poisoned Dagger",
			"playerClass": "Rogue",
			"set": "Tgt",
			"type": "Weapon"
		},
		{
			"artist": "Stefan Kopinski",
			"attack": 5,
			"cardImage": "CS2_112.png",
			"collectible": true,
			"cost": 5,
			"durability": 2,
			"fr": {
				"name": "Faucheuse en arcanite"
			},
			"id": "CS2_112",
			"name": "Arcanite Reaper",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Core",
			"type": "Weapon"
		},
		{
			"cardImage": "LOEA02_01h.png",
			"fr": {
				"name": "Zinaar (héroïque)"
			},
			"health": 30,
			"id": "LOEA02_01h",
			"name": "Heroic Zinaar",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA13_1.png",
			"fr": {
				"name": "Squeletosaurus Hex"
			},
			"health": 30,
			"id": "LOEA13_1",
			"name": "Skelesaurus Hex",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Andrea Uderzo",
			"attack": 4,
			"cardImage": "EX1_032.png",
			"collectible": true,
			"cost": 6,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Marche-soleil"
			},
			"health": 5,
			"id": "EX1_032",
			"name": "Sunwalker",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "XXX_100.png",
			"cost": 0,
			"fr": {
				"name": "Yogg-Saron Test (Manual)"
			},
			"health": 5,
			"id": "XXX_100",
			"name": "Yogg-Saron Test (Manual)",
			"rarity": "Legendary",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_160be.png",
			"fr": {
				"name": "Chef de la meute"
			},
			"id": "EX1_160be",
			"name": "Leader of the Pack",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_010.png",
			"fr": {
				"name": "Enchantement de création de deck"
			},
			"id": "TB_010",
			"name": "Deckbuilding Enchant",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Evgeniy Zagumennyy",
			"attack": 2,
			"cardImage": "AT_087.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Cavalier d’Argent"
			},
			"health": 1,
			"id": "AT_087",
			"name": "Argent Horserider",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "CRED_20.png",
			"cost": 3,
			"fr": {
				"name": "Brian Birmingham"
			},
			"health": 2,
			"id": "CRED_20",
			"name": "Brian Birmingham",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "LOE_119.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Armure animée"
			},
			"health": 4,
			"id": "LOE_119",
			"name": "Animated Armor",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "CRED_34.png",
			"cost": 3,
			"fr": {
				"name": "Max Ma"
			},
			"health": 3,
			"id": "CRED_34",
			"name": "Max Ma",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "TBST_006.png",
			"fr": {
				"name": "Forcer une carte commune"
			},
			"id": "TBST_006",
			"name": "OLDTBST Push Common Card",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_032e.png",
			"fr": {
				"name": "Marché douteux"
			},
			"id": "AT_032e",
			"name": "Shady Deals",
			"playerClass": "Rogue",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_19.png",
			"cost": 5,
			"fr": {
				"name": "Écumeur du soleil Phaerix"
			},
			"health": 5,
			"id": "LOEA16_19",
			"name": "Sun Raider Phaerix",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "OG_312e.png",
			"fr": {
				"name": "Amélioration"
			},
			"id": "OG_312e",
			"name": "Upgraded",
			"playerClass": "Warrior",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_155b.png",
			"cost": 0,
			"fr": {
				"name": "Marque de la nature"
			},
			"id": "EX1_155b",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_005.png",
			"cost": 0,
			"fr": {
				"name": "Destroy"
			},
			"id": "XXX_005",
			"name": "Destroy",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Mike Nicholson",
			"attack": 1,
			"cardImage": "FP1_024.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Goule instable"
			},
			"health": 3,
			"id": "FP1_024",
			"name": "Unstable Ghoul",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "AT_051.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Destruction élémentaire"
			},
			"id": "AT_051",
			"name": "Elemental Destruction",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "TBA01_6.png",
			"cost": 2,
			"fr": {
				"name": "Rage du magma"
			},
			"id": "TBA01_6",
			"name": "Molten Rage",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "AT_114.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Provocateur maléfique"
			},
			"health": 4,
			"id": "AT_114",
			"name": "Evil Heckler",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_19H.png",
			"cost": 10,
			"fr": {
				"name": "Écumeur du soleil Phaerix"
			},
			"health": 10,
			"id": "LOEA16_19H",
			"name": "Sun Raider Phaerix",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "BRMA10_5.png",
			"cost": 4,
			"fr": {
				"name": "Drake chromatique"
			},
			"health": 3,
			"id": "BRMA10_5",
			"name": "Chromatic Drake",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "NEW1_003.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Pacte sacrificiel"
			},
			"id": "NEW1_003",
			"name": "Sacrificial Pact",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Alex Konstad",
			"attack": 2,
			"cardImage": "OG_033.png",
			"collectible": true,
			"cost": 5,
			"durability": 2,
			"fr": {
				"name": "Tentacules brachiaux"
			},
			"id": "OG_033",
			"name": "Tentacles for Arms",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Og",
			"type": "Weapon"
		},
		{
			"attack": 6,
			"cardImage": "CRED_23.png",
			"cost": 4,
			"fr": {
				"name": "Christopher Yim"
			},
			"health": 5,
			"id": "CRED_23",
			"name": "Christopher Yim",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "AT_011e.png",
			"fr": {
				"name": "Bénédiction par la Lumière"
			},
			"id": "AT_011e",
			"name": "Light's Blessing",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA09_1H.png",
			"fr": {
				"name": "Ondulance (héroïque)"
			},
			"health": 30,
			"id": "LOEA09_1H",
			"name": "Heroic Slitherspear",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA08_3.png",
			"cost": 1,
			"fr": {
				"name": "Ordres de Drakkisath"
			},
			"id": "BRMA08_3",
			"name": "Drakkisath's Command",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "AT_132_SHAMANc.png",
			"cost": 0,
			"fr": {
				"name": "Totem de griffes de pierre"
			},
			"health": 2,
			"id": "AT_132_SHAMANc",
			"name": "Stoneclaw Totem",
			"playerClass": "Shaman",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 8,
			"cardImage": "AT_088.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Champion de Mogor"
			},
			"health": 5,
			"id": "AT_088",
			"name": "Mogor's Champion",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Jaime Jones",
			"cardImage": "BRM_001.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Veille solennelle"
			},
			"id": "BRM_001",
			"name": "Solemn Vigil",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "AT_089e.png",
			"fr": {
				"name": "Garde d’os"
			},
			"id": "AT_089e",
			"name": "Boneguarded",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_5.png",
			"cost": 0,
			"fr": {
				"name": "Destin : sorts"
			},
			"id": "TB_PickYourFate_5",
			"name": "Fate: Spells",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "TU4f_006.png",
			"cost": 1,
			"fr": {
				"name": "Transcendance"
			},
			"id": "TU4f_006",
			"name": "Transcendence",
			"rarity": "Common",
			"set": "Missions",
			"type": "Spell"
		},
		{
			"cardImage": "TB_SPT_Minion1e.png",
			"fr": {
				"name": "Volonté de Hurlevent"
			},
			"id": "TB_SPT_Minion1e",
			"name": "Will of Stormwind",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "CS2_052.png",
			"cost": 1,
			"fr": {
				"name": "Totem de courroux de l’air"
			},
			"health": 2,
			"id": "CS2_052",
			"name": "Wrath of Air Totem",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Eric Braddock",
			"attack": 4,
			"cardImage": "BRM_008.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Furtif sombrefer"
			},
			"health": 3,
			"id": "BRM_008",
			"name": "Dark Iron Skulker",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Tooth",
			"attack": 7,
			"cardImage": "OG_134.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Yogg-Saron, la fin de l’espoir"
			},
			"health": 5,
			"id": "OG_134",
			"name": "Yogg-Saron, Hope's End",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 5,
			"cardImage": "AT_096.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Chevalier mécanique"
			},
			"health": 5,
			"id": "AT_096",
			"name": "Clockwork Knight",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_019e.png",
			"fr": {
				"name": "Bénédiction du clerc"
			},
			"id": "EX1_019e",
			"name": "Cleric's Blessing",
			"playerClass": "Priest",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA16_20.png",
			"cost": 1,
			"fr": {
				"name": "Bénédiction du soleil"
			},
			"id": "LOEA16_20",
			"name": "Blessing of the Sun",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 7,
			"cardImage": "BRMA10_5H.png",
			"cost": 4,
			"fr": {
				"name": "Drake chromatique"
			},
			"health": 7,
			"id": "BRMA10_5H",
			"name": "Chromatic Drake",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_13.png",
			"cost": 0,
			"fr": {
				"name": "Œil d’Orsis"
			},
			"id": "LOEA16_13",
			"name": "Eye of Orsis",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_289.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Barrière de glace"
			},
			"id": "EX1_289",
			"name": "Ice Barrier",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_009e.png",
			"fr": {
				"name": "Empty Enchant"
			},
			"id": "XXX_009e",
			"name": "Empty Enchant",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Enchantment"
		},
		{
			"artist": "Josh Harris",
			"attack": 9,
			"cardImage": "GVG_077.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Golem d’anima"
			},
			"health": 9,
			"id": "GVG_077",
			"name": "Anima Golem",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_5.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : bleu"
			},
			"id": "BRMA12_5",
			"name": "Brood Affliction: Blue",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "L. Lullabi & A. Bozonnet",
			"attack": 1,
			"cardImage": "OG_241a.png",
			"cost": 1,
			"fr": {
				"name": "Ombrebête"
			},
			"health": 1,
			"id": "OG_241a",
			"name": "Shadowbeast",
			"playerClass": "Warlock",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "OG_311e.png",
			"fr": {
				"name": "Signal d’espoir"
			},
			"id": "OG_311e",
			"name": "Beacon of Hope",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "NAX9_05H.png",
			"cost": 3,
			"durability": 3,
			"fr": {
				"name": "Lame runique"
			},
			"id": "NAX9_05H",
			"name": "Runeblade",
			"set": "Naxx",
			"type": "Weapon"
		},
		{
			"artist": "Mauro Cascioli",
			"attack": 4,
			"cardImage": "CS2_182.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Yéti noroît"
			},
			"health": 5,
			"id": "CS2_182",
			"name": "Chillwind Yeti",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "E. M. Gist",
			"attack": 7,
			"cardImage": "OG_024.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Sans-visage nimbé de flammes"
			},
			"health": 7,
			"id": "OG_024",
			"name": "Flamewreathed Faceless",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Scott Hampton",
			"attack": 4,
			"cardImage": "EX1_046.png",
			"collectible": true,
			"cost": 4,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Nain sombrefer"
			},
			"health": 4,
			"id": "EX1_046",
			"name": "Dark Iron Dwarf",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_041e.png",
			"fr": {
				"name": "Infusion ancestrale"
			},
			"id": "CS2_041e",
			"name": "Ancestral Infusion",
			"playerClass": "Shaman",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "Kev Walker",
			"attack": 4,
			"cardImage": "CS2_150.png",
			"collectible": true,
			"cost": 5,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Commando foudrepique"
			},
			"health": 2,
			"id": "CS2_150",
			"name": "Stormpike Commando",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "NAX5_02.png",
			"cost": 1,
			"fr": {
				"name": "Éruption"
			},
			"id": "NAX5_02",
			"name": "Eruption",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_284e.png",
			"fr": {
				"name": "Géomancie"
			},
			"id": "OG_284e",
			"name": "Geomancy",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA09_2H.png",
			"cost": 2,
			"fr": {
				"name": "Enragé !"
			},
			"id": "LOEA09_2H",
			"name": "Enraged!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_382e.png",
			"fr": {
				"name": "Du calme !"
			},
			"id": "EX1_382e",
			"name": "Stand Down!",
			"playerClass": "Paladin",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA16_5e.png",
			"fr": {
				"name": "Je vous entends…"
			},
			"id": "BRMA16_5e",
			"name": "I hear you...",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "CS2_105.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Frappe héroïque"
			},
			"id": "CS2_105",
			"name": "Heroic Strike",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Kan Lui",
			"attack": 8,
			"cardImage": "OG_120.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Anomalus"
			},
			"health": 6,
			"id": "OG_120",
			"name": "Anomalus",
			"playerClass": "Mage",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "NAX7_01.png",
			"fr": {
				"name": "Instructeur Razuvious"
			},
			"health": 40,
			"id": "NAX7_01",
			"name": "Instructor Razuvious",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "James Ryman",
			"attack": 7,
			"cardImage": "OG_121.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Cho’gall"
			},
			"health": 7,
			"id": "OG_121",
			"name": "Cho'gall",
			"playerClass": "Warlock",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Mishi McCaig",
			"cardImage": "AT_068.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Renforcement"
			},
			"id": "AT_068",
			"name": "Bolster",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "OG_131.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Empereur jumeau Vek’lor"
			},
			"health": 6,
			"id": "OG_131",
			"name": "Twin Emperor Vek'lor",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA06_03h.png",
			"cost": 2,
			"fr": {
				"name": "Terrestre animé"
			},
			"id": "LOEA06_03h",
			"name": "Animate Earthen",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "XXX_044.png",
			"cost": 0,
			"fr": {
				"name": "Hand Swapper Minion"
			},
			"health": 5,
			"id": "XXX_044",
			"name": "Hand Swapper Minion",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"cardImage": "NAX9_06.png",
			"cost": 5,
			"fr": {
				"name": "Ombre impie"
			},
			"id": "NAX9_06",
			"name": "Unholy Shadow",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "Jomaro Kindred",
			"attack": 6,
			"cardImage": "AT_132.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Justicière Cœur-Vrai"
			},
			"health": 3,
			"id": "AT_132",
			"name": "Justicar Trueheart",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "NAX2_01H.png",
			"fr": {
				"name": "Grande veuve Faerlina"
			},
			"health": 45,
			"id": "NAX2_01H",
			"name": "Grand Widow Faerlina",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "CS2_008.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Éclat lunaire"
			},
			"id": "CS2_008",
			"name": "Moonfire",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "AT_042b.png",
			"cost": 0,
			"fr": {
				"name": "Forme de panthère"
			},
			"id": "AT_042b",
			"name": "Panther Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Matt Cavotta",
			"attack": 5,
			"cardImage": "CS2_187.png",
			"collectible": true,
			"cost": 5,
			"faction": "HORDE",
			"fr": {
				"name": "Garde de Baie-du-Butin"
			},
			"health": 4,
			"id": "CS2_187",
			"name": "Booty Bay Bodyguard",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "LOEA09_5.png",
			"cost": 1,
			"fr": {
				"name": "Naga affamé"
			},
			"health": 1,
			"id": "LOEA09_5",
			"name": "Hungry Naga",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Tyson Murphy",
			"attack": 4,
			"cardImage": "AT_057.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maître des écuries"
			},
			"health": 2,
			"id": "AT_057",
			"name": "Stablemaster",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "AT_042a.png",
			"cost": 0,
			"fr": {
				"name": "Forme de lion"
			},
			"id": "AT_042a",
			"name": "Lion Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 3,
			"cardImage": "AT_124.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Bolf Bélier-Frondeur"
			},
			"health": 9,
			"id": "AT_124",
			"name": "Bolf Ramshield",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_065.png",
			"cost": 0,
			"fr": {
				"name": "Remove All Immune"
			},
			"id": "XXX_065",
			"name": "Remove All Immune",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA10_5H.png",
			"cost": 3,
			"fr": {
				"name": "Mrgl mrgl niah niah !"
			},
			"id": "LOEA10_5H",
			"name": "Mrgl Mrgl Nyah Nyah",
			"rarity": "Common",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA10_3.png",
			"cost": 1,
			"fr": {
				"name": "La colonie"
			},
			"id": "BRMA10_3",
			"name": "The Rookery",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_029.png",
			"cost": 0,
			"fr": {
				"name": "Opponent Concede"
			},
			"id": "XXX_029",
			"name": "Opponent Concede",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"attack": 10,
			"cardImage": "LOEA04_27.png",
			"cost": 1,
			"fr": {
				"name": "Statue animée"
			},
			"health": 10,
			"id": "LOEA04_27",
			"name": "Animated Statue",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA08_01.png",
			"fr": {
				"name": "Archaedas"
			},
			"health": 30,
			"id": "LOEA08_01",
			"name": "Archaedas",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "NAX8_01.png",
			"fr": {
				"name": "Gothik le Moissonneur"
			},
			"health": 30,
			"id": "NAX8_01",
			"name": "Gothik the Harvester",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA09_9.png",
			"cost": 1,
			"fr": {
				"name": "Répulsif à nagas"
			},
			"id": "LOEA09_9",
			"name": "Naga Repellent",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "NAX12_03e.png",
			"fr": {
				"name": "Double rangée de dents"
			},
			"id": "NAX12_03e",
			"name": "Extra Teeth",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"artist": "Jesper Esjing",
			"attack": 6,
			"cardImage": "OG_147.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Robot de soins corrompu"
			},
			"health": 6,
			"id": "OG_147",
			"name": "Corrupted Healbot",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Richard Wright",
			"attack": 1,
			"cardImage": "GVG_024.png",
			"collectible": true,
			"cost": 3,
			"durability": 3,
			"fr": {
				"name": "Clé de maître des rouages"
			},
			"id": "GVG_024",
			"name": "Cogmaster's Wrench",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX15_01e.png",
			"fr": {
				"name": "Intrus !"
			},
			"id": "NAX15_01e",
			"name": "Interloper!",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"artist": "Mike Franchina",
			"cardImage": "OG_198.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Guérison interdite"
			},
			"id": "OG_198",
			"name": "Forbidden Healing",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "NAX6_03.png",
			"cost": 4,
			"fr": {
				"name": "Mortelle floraison"
			},
			"id": "NAX6_03",
			"name": "Deathbloom",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_030ae.png",
			"fr": {
				"name": "Mode Attaque"
			},
			"id": "GVG_030ae",
			"name": "Attack Mode",
			"playerClass": "Druid",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 1,
			"cardImage": "OG_312.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Second de N’Zoth"
			},
			"health": 1,
			"id": "OG_312",
			"name": "N'Zoth's First Mate",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Jon Neimeister",
			"attack": 2,
			"cardImage": "OG_330.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Colporteur de Fossoyeuse"
			},
			"health": 2,
			"id": "OG_330",
			"name": "Undercity Huckster",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Lucas Graciano",
			"attack": 6,
			"cardImage": "BRM_025.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Drake volcanique"
			},
			"health": 4,
			"id": "BRM_025",
			"name": "Volcanic Drake",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "CS2_051.png",
			"cost": 1,
			"fr": {
				"name": "Totem de griffes de pierre"
			},
			"health": 2,
			"id": "CS2_051",
			"name": "Stoneclaw Totem",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "AT_048.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Vague de soins"
			},
			"id": "AT_048",
			"name": "Healing Wave",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "AT_066e.png",
			"fr": {
				"name": "Forges d’Orgrimmar"
			},
			"id": "AT_066e",
			"name": "Forges of Orgrimmar",
			"playerClass": "Warrior",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_154.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Colère"
			},
			"id": "EX1_154",
			"name": "Wrath",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 7,
			"cardImage": "EX1_614.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Illidan Hurlorage"
			},
			"health": 5,
			"id": "EX1_614",
			"name": "Illidan Stormrage",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "TU4e_003.png",
			"cost": 1,
			"fr": {
				"name": "Myrmidon naga"
			},
			"health": 1,
			"id": "TU4e_003",
			"name": "Naga Myrmidon",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA09_1.png",
			"fr": {
				"name": "Seigneur Ondulance"
			},
			"health": 30,
			"id": "LOEA09_1",
			"name": "Lord Slitherspear",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "CRED_07.png",
			"cost": 2,
			"fr": {
				"name": "Zwick"
			},
			"health": 2,
			"id": "CRED_07",
			"name": "Zwick",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "XXX_096.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - Damage Own Hero 5"
			},
			"health": 1,
			"id": "XXX_096",
			"name": "AI Buddy - Damage Own Hero 5",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"cardImage": "CS1_129e.png",
			"fr": {
				"name": "Feu intérieur"
			},
			"id": "CS1_129e",
			"name": "Inner Fire",
			"playerClass": "Priest",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "AT_110.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Régisseur du Colisée"
			},
			"health": 5,
			"id": "AT_110",
			"name": "Coliseum Manager",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_28b.png",
			"cost": 0,
			"fr": {
				"name": "Traverser à pied"
			},
			"id": "LOEA04_28b",
			"name": "Wade Through",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_85.png",
			"cost": 4,
			"fr": {
				"name": "Lucifron"
			},
			"health": 7,
			"id": "BRMC_85",
			"name": "Lucifron",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "TB_ClassRandom_PickSecondClass.png",
			"fr": {
				"name": "Choisissez votre deuxième classe"
			},
			"id": "TB_ClassRandom_PickSecondClass",
			"name": "Pick your second class",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_GiftExchange_Enchantment.png",
			"fr": {
				"name": "Cadeau nul"
			},
			"id": "TB_GiftExchange_Enchantment",
			"name": "Cheap Gift",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_047e.png",
			"fr": {
				"name": "Aiguillons"
			},
			"id": "OG_047e",
			"name": "Spines",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Tom Baxa",
			"cardImage": "EX1_316.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Puissance accablante"
			},
			"id": "EX1_316",
			"name": "Power Overwhelming",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Gonzalo Ordonez",
			"attack": 3,
			"cardImage": "OG_321.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Adorateur fanatisé"
			},
			"health": 6,
			"id": "OG_321",
			"name": "Crazed Worshipper",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "BRMC_97e.png",
			"fr": {
				"name": "Montée d’adrénaline"
			},
			"id": "BRMC_97e",
			"name": "Burning Adrenaline",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Stanley Lau",
			"attack": 2,
			"cardImage": "BRM_010.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Druidesse de la Flamme"
			},
			"health": 2,
			"id": "BRM_010",
			"name": "Druid of the Flame",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA05_03.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester sorts !"
			},
			"id": "LOEA05_03",
			"name": "Trogg Hate Spells!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_612o.png",
			"fr": {
				"name": "Puissance du Kirin Tor"
			},
			"id": "EX1_612o",
			"name": "Power of the Kirin Tor",
			"playerClass": "Mage",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA13_8.png",
			"cost": 0,
			"fr": {
				"name": "MEURS, INSECTE !"
			},
			"id": "BRMA13_8",
			"name": "DIE, INSECT!",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_8.png",
			"cost": 0,
			"fr": {
				"name": "Bonus : sorts"
			},
			"id": "TB_PickYourFate_8",
			"name": "Spell Bonus",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA09_3H.png",
			"cost": 0,
			"fr": {
				"name": "Faim sans fin"
			},
			"id": "LOEA09_3H",
			"name": "Endless Hunger",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_001.png",
			"cost": 0,
			"fr": {
				"name": "Damage 1"
			},
			"id": "XXX_001",
			"name": "Damage 1",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Sam Nielson",
			"attack": 2,
			"cardImage": "BRM_004.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Dragonnet du Crépuscule"
			},
			"health": 1,
			"id": "BRM_004",
			"name": "Twilight Whelp",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "skele11.png",
			"cost": 1,
			"fr": {
				"name": "Squelette"
			},
			"health": 1,
			"id": "skele11",
			"name": "Skeleton",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA08_2H.png",
			"cost": 0,
			"fr": {
				"name": "Regard intense"
			},
			"id": "BRMA08_2H",
			"name": "Intense Gaze",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Lucas Graciano",
			"attack": 5,
			"cardImage": "EX1_310.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Garde funeste"
			},
			"health": 7,
			"id": "EX1_310",
			"name": "Doomguard",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Seamus Gallagher",
			"attack": 2,
			"cardImage": "GVG_046.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Roi des bêtes"
			},
			"health": 6,
			"id": "GVG_046",
			"name": "King of Beasts",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA01_01h.png",
			"fr": {
				"name": "Phaerix (héroïque)"
			},
			"health": 30,
			"id": "LOEA01_01h",
			"name": "Heroic Phaerix",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_059.png",
			"cost": 0,
			"fr": {
				"name": "Destroy Hero's Stuff"
			},
			"id": "XXX_059",
			"name": "Destroy Hero's Stuff",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Dany Orizio",
			"cardImage": "CS2_108.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Exécution"
			},
			"id": "CS2_108",
			"name": "Execute",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Mark Abadier",
			"attack": 5,
			"cardImage": "OG_207.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Invocateur sans-visage"
			},
			"health": 5,
			"id": "OG_207",
			"name": "Faceless Summoner",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA06_3H.png",
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 30,
			"id": "BRMA06_3H",
			"name": "Ragnaros the Firelord",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Jonboy Meyers",
			"attack": 1,
			"cardImage": "FP1_028.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Fossoyeur"
			},
			"health": 2,
			"id": "FP1_028",
			"name": "Undertaker",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Eva Widermann",
			"attack": 2,
			"cardImage": "AT_059.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Brave archère"
			},
			"health": 1,
			"id": "AT_059",
			"name": "Brave Archer",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 8,
			"cardImage": "EX1_543.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Roi Krush"
			},
			"health": 8,
			"id": "EX1_543",
			"name": "King Krush",
			"playerClass": "Hunter",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "AT_082e.png",
			"fr": {
				"name": "Entraînement"
			},
			"id": "AT_082e",
			"name": "Training",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX13_03e.png",
			"fr": {
				"name": "État de supercharge"
			},
			"id": "NAX13_03e",
			"name": "Supercharged",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"attack": 6,
			"cardImage": "CRED_45.png",
			"cost": 6,
			"fr": {
				"name": "Jonas Laster"
			},
			"health": 6,
			"id": "CRED_45",
			"name": "Jonas Laster",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Raven Mimura",
			"cardImage": "EX1_294.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Entité miroir"
			},
			"id": "EX1_294",
			"name": "Mirror Entity",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "TU4c_002.png",
			"cost": 1,
			"fr": {
				"name": "Lancer de tonneau"
			},
			"id": "TU4c_002",
			"name": "Barrel Toss",
			"rarity": "Common",
			"set": "Missions",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_7.png",
			"cost": 0,
			"fr": {
				"name": "Esquille de bénédiction"
			},
			"id": "LOEA16_7",
			"name": "Benediction Splinter",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Matt Gaser",
			"cardImage": "EX1_302.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Voile de mort"
			},
			"id": "EX1_302",
			"name": "Mortal Coil",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_258e.png",
			"fr": {
				"name": "Surcharge"
			},
			"id": "EX1_258e",
			"name": "Overloading",
			"playerClass": "Shaman",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRM_018e.png",
			"fr": {
				"name": "Libéré !"
			},
			"id": "BRM_018e",
			"name": "Unchained!",
			"playerClass": "Paladin",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 4,
			"cardImage": "EX1_572.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Ysera"
			},
			"health": 12,
			"id": "EX1_572",
			"name": "Ysera",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Patrik Hjelm",
			"attack": 5,
			"cardImage": "NEW1_008.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Ancien du savoir"
			},
			"health": 5,
			"id": "NEW1_008",
			"name": "Ancient of Lore",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 4,
			"cardImage": "EX1_414.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Grommash Hurlenfer"
			},
			"health": 9,
			"id": "EX1_414",
			"name": "Grommash Hellscream",
			"playerClass": "Warrior",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_013.png",
			"cost": 0,
			"fr": {
				"name": "Discard"
			},
			"id": "XXX_013",
			"name": "Discard",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA14_10.png",
			"cost": 4,
			"fr": {
				"name": "Activation !"
			},
			"id": "BRMA14_10",
			"name": "Activate!",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA17_5_TB.png",
			"cost": 2,
			"fr": {
				"name": "Séides des os"
			},
			"id": "BRMA17_5_TB",
			"name": "Bone Minions",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_584e.png",
			"fr": {
				"name": "Enseignements du Kirin Tor"
			},
			"id": "EX1_584e",
			"name": "Teachings of the Kirin Tor",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "LOE_089t2.png",
			"cost": 2,
			"fr": {
				"name": "Avorton rusé"
			},
			"health": 2,
			"id": "LOE_089t2",
			"name": "Wily Runt",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "OG_044b.png",
			"cost": 3,
			"fr": {
				"name": "Druide de la Flamme"
			},
			"health": 5,
			"id": "OG_044b",
			"name": "Druid of the Flame",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "NAX7_03H.png",
			"cost": 1,
			"fr": {
				"name": "Frappe déséquilibrante"
			},
			"id": "NAX7_03H",
			"name": "Unbalancing Strike",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRM_012e.png",
			"fr": {
				"name": "En feu !"
			},
			"id": "BRM_012e",
			"name": "On Fire!",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"attack": 3,
			"cardImage": "LOEA16_5t.png",
			"cost": 3,
			"fr": {
				"name": "Momie zombie"
			},
			"health": 3,
			"id": "LOEA16_5t",
			"name": "Mummy Zombie",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA01_2.png",
			"cost": 0,
			"fr": {
				"name": "Jeu forcé !"
			},
			"id": "BRMA01_2",
			"name": "Pile On!",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"attack": 3,
			"cardImage": "CRED_04.png",
			"cost": 1,
			"fr": {
				"name": "Steven Gabriel"
			},
			"health": 3,
			"id": "CRED_04",
			"name": "Steven Gabriel",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_1H.png",
			"fr": {
				"name": "Rafaam (héroïque)"
			},
			"health": 30,
			"id": "LOEA16_1H",
			"name": "Heroic Rafaam",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA06_03eh.png",
			"fr": {
				"name": "Animé"
			},
			"id": "LOEA06_03eh",
			"name": "Animated",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Efrem Palacios",
			"attack": 2,
			"cardImage": "BRM_016.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Lanceur de hache"
			},
			"health": 5,
			"id": "BRM_016",
			"name": "Axe Flinger",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA13_4_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Magie sauvage"
			},
			"id": "BRMA13_4_2_TB",
			"name": "Wild Magic",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "EX1_002.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Le Chevalier noir"
			},
			"health": 5,
			"id": "EX1_002",
			"name": "The Black Knight",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Howard Lyon",
			"cardImage": "CS2_025.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Explosion des Arcanes"
			},
			"id": "CS2_025",
			"name": "Arcane Explosion",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA10_3H.png",
			"cost": 0,
			"fr": {
				"name": "La colonie"
			},
			"id": "BRMA10_3H",
			"name": "The Rookery",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "GVG_097.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Mini exorciste"
			},
			"health": 3,
			"id": "GVG_097",
			"name": "Lil' Exorcist",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "BRMA09_4Ht.png",
			"cost": 1,
			"fr": {
				"name": "Draconien"
			},
			"health": 4,
			"id": "BRMA09_4Ht",
			"name": "Dragonkin",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Jason Kang",
			"attack": 0,
			"cardImage": "LOE_086.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Pierre d’invocation"
			},
			"health": 6,
			"id": "LOE_086",
			"name": "Summoning Stone",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMA17_6H.png",
			"cost": 1,
			"fr": {
				"name": "Assemblage d’os"
			},
			"health": 2,
			"id": "BRMA17_6H",
			"name": "Bone Construct",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA13_1h.png",
			"fr": {
				"name": "Squeletosaurus Hex (héroïque)"
			},
			"health": 30,
			"id": "LOEA13_1h",
			"name": "Heroic Skelesaurus",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Christopher Moeller",
			"cardImage": "AT_043.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Communion astrale"
			},
			"id": "AT_043",
			"name": "Astral Communion",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_009.png",
			"cost": 0,
			"fr": {
				"name": "Enchant"
			},
			"id": "XXX_009",
			"name": "Enchant",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "AT_060.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Piège à ours"
			},
			"id": "AT_060",
			"name": "Bear Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 2,
			"cardImage": "GVG_055.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Cliquetteur perce-vrille"
			},
			"health": 5,
			"id": "GVG_055",
			"name": "Screwjank Clunker",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "BRMC_94.png",
			"cost": 2,
			"durability": 6,
			"fr": {
				"name": "Sulfuras"
			},
			"id": "BRMC_94",
			"name": "Sulfuras",
			"set": "Tb",
			"type": "Weapon"
		},
		{
			"cardImage": "BRMA09_5H.png",
			"cost": 4,
			"fr": {
				"name": "Pied à terre"
			},
			"id": "BRMA09_5H",
			"name": "Dismount",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOEA07_01.png",
			"fr": {
				"name": "Chariot de mine"
			},
			"health": 30,
			"id": "LOEA07_01",
			"name": "Mine Cart",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "DS1h_292.png",
			"cost": 2,
			"fr": {
				"name": "Tir assuré"
			},
			"id": "DS1h_292",
			"name": "Steady Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOEA05_01.png",
			"fr": {
				"name": "Chef Scarvash"
			},
			"health": 30,
			"id": "LOEA05_01",
			"name": "Chieftain Scarvash",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA06_02h.png",
			"cost": 1,
			"fr": {
				"name": "Sculpture sur pierre"
			},
			"id": "LOEA06_02h",
			"name": "Stonesculpting",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Cole Eastburn",
			"attack": 2,
			"cardImage": "LOE_016.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Élémentaire grondant"
			},
			"health": 6,
			"id": "LOE_016",
			"name": "Rumbling Elemental",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 8,
			"cardImage": "EX1_562.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Onyxia"
			},
			"health": 8,
			"id": "EX1_562",
			"name": "Onyxia",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_594.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Vaporisation"
			},
			"id": "EX1_594",
			"name": "Vaporize",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Peerasak Senalai",
			"cardImage": "PART_003.png",
			"cost": 1,
			"fr": {
				"name": "Klaxon rouillé"
			},
			"id": "PART_003",
			"name": "Rusty Horn",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "Samwise",
			"attack": 5,
			"cardImage": "FP1_030.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Horreb"
			},
			"health": 5,
			"id": "FP1_030",
			"name": "Loatheb",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "AT_116e.png",
			"fr": {
				"name": "Venez vous battre !"
			},
			"id": "AT_116e",
			"name": "Bring it on!",
			"playerClass": "Priest",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_625t2.png",
			"cost": 2,
			"fr": {
				"name": "Briser l’esprit"
			},
			"id": "EX1_625t2",
			"name": "Mind Shatter",
			"playerClass": "Priest",
			"set": "Expert1",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_293f.png",
			"fr": {
				"name": "Sombre gardien"
			},
			"id": "OG_293f",
			"name": "Dark Guardian",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Bernie Kang",
			"cardImage": "EX1_554.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Piège à serpents"
			},
			"id": "EX1_554",
			"name": "Snake Trap",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "E. Guiton & Nutchapol ",
			"attack": 6,
			"cardImage": "OG_220.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Malkorok"
			},
			"health": 5,
			"id": "OG_220",
			"name": "Malkorok",
			"playerClass": "Warrior",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA14_1.png",
			"fr": {
				"name": "Système de défense Omnitron"
			},
			"health": 30,
			"id": "BRMA14_1",
			"name": "Omnotron Defense System",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "GAME_003e.png",
			"fr": {
				"name": "Vengeance de la pièce"
			},
			"id": "GAME_003e",
			"name": "Coin's Vengence",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA09_4H.png",
			"cost": 1,
			"fr": {
				"name": "Aile noire"
			},
			"id": "BRMA09_4H",
			"name": "Blackwing",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX2_03H.png",
			"cost": 1,
			"fr": {
				"name": "Pluie de feu"
			},
			"id": "NAX2_03H",
			"name": "Rain of Fire",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "CRED_11.png",
			"cost": 4,
			"fr": {
				"name": "Jay Baxter"
			},
			"health": 4,
			"id": "CRED_11",
			"name": "Jay Baxter",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Michal Ivan",
			"attack": 7,
			"cardImage": "GVG_112.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Mogor l’ogre"
			},
			"health": 6,
			"id": "GVG_112",
			"name": "Mogor the Ogre",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "TB_MechWar_Boss2.png",
			"fr": {
				"name": "Ro’Boum"
			},
			"health": 30,
			"id": "TB_MechWar_Boss2",
			"name": "Boom Bot",
			"rarity": "Free",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"attack": 1,
			"cardImage": "BRMA03_3.png",
			"cost": 2,
			"fr": {
				"name": "Moira Barbe-de-Bronze"
			},
			"health": 3,
			"id": "BRMA03_3",
			"name": "Moira Bronzebeard",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_100e.png",
			"fr": {
				"name": "Sourcils froncés"
			},
			"id": "GVG_100e",
			"name": "Brow Furrow",
			"playerClass": "Warlock",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Justin Sweet",
			"cardImage": "CS2_039.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Furie des vents"
			},
			"id": "CS2_039",
			"name": "Windfury",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Jeff Easley",
			"attack": 1,
			"cardImage": "AT_116.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Agent du Repos du ver"
			},
			"health": 4,
			"id": "AT_116",
			"name": "Wyrmrest Agent",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Lars Grant-West",
			"cardImage": "CS2_053.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Double vue"
			},
			"id": "CS2_053",
			"name": "Far Sight",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Greg Hildebrandt",
			"attack": 1,
			"cardImage": "CS2_169.png",
			"collectible": true,
			"cost": 1,
			"faction": "HORDE",
			"fr": {
				"name": "Jeune faucon-dragon"
			},
			"health": 1,
			"id": "CS2_169",
			"name": "Young Dragonhawk",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Michael Phillippi",
			"attack": 6,
			"cardImage": "GVG_105.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Golem céleste piloté"
			},
			"health": 4,
			"id": "GVG_105",
			"name": "Piloted Sky Golem",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "BRMC_91.png",
			"cost": 3,
			"fr": {
				"name": "Fils de la Flamme"
			},
			"health": 3,
			"id": "BRMC_91",
			"name": "Son of the Flame",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Ben Zhang",
			"attack": 7,
			"cardImage": "OG_255.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Implorateur funeste"
			},
			"health": 9,
			"id": "OG_255",
			"name": "Doomcaller",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "NAX11_02H_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Nuage empoisonné"
			},
			"id": "NAX11_02H_2_TB",
			"name": "Poison Cloud",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"attack": 2,
			"cardImage": "NAX9_04H.png",
			"cost": 3,
			"fr": {
				"name": "Sire Zeliek"
			},
			"health": 7,
			"id": "NAX9_04H",
			"name": "Sir Zeliek",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 4,
			"cardImage": "OG_295.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Apothicaire du culte"
			},
			"health": 4,
			"id": "OG_295",
			"name": "Cult Apothecary",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA16_1H.png",
			"fr": {
				"name": "Atramédès"
			},
			"health": 30,
			"id": "BRMA16_1H",
			"name": "Atramedes",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 1,
			"cardImage": "LOE_009t.png",
			"cost": 1,
			"fr": {
				"name": "Scarabée"
			},
			"health": 1,
			"id": "LOE_009t",
			"name": "Scarab",
			"playerClass": "Warrior",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "NAX7_04H.png",
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Lame runique massive"
			},
			"id": "NAX7_04H",
			"name": "Massive Runeblade",
			"set": "Naxx",
			"type": "Weapon"
		},
		{
			"cardImage": "LOEA02_04.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : vaillance"
			},
			"id": "LOEA02_04",
			"name": "Wish for Valor",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "TB_GiftExchange_Treasure_Spell.png",
			"cost": 1,
			"fr": {
				"name": "Cadeau du Voile d’hiver volé"
			},
			"id": "TB_GiftExchange_Treasure_Spell",
			"name": "Stolen Winter's Veil Gift",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Brian Despain",
			"cardImage": "FP1_019.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Graines de poison"
			},
			"id": "FP1_019",
			"name": "Poison Seeds",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"cardImage": "OG_195e.png",
			"fr": {
				"name": "Furieux"
			},
			"id": "OG_195e",
			"name": "Enormous",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Sean O’Daniels",
			"attack": 5,
			"cardImage": "EX1_178.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Ancien de la guerre"
			},
			"health": 5,
			"id": "EX1_178",
			"name": "Ancient of War",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CS2_082.png",
			"cost": 1,
			"durability": 2,
			"fr": {
				"name": "Lame pernicieuse"
			},
			"id": "CS2_082",
			"name": "Wicked Knife",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"type": "Weapon"
		},
		{
			"attack": 5,
			"cardImage": "CRED_31.png",
			"cost": 4,
			"fr": {
				"name": "Jeremy Cranford"
			},
			"health": 4,
			"id": "CRED_31",
			"name": "Jeremy Cranford",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_080o.png",
			"fr": {
				"name": "Garde des secrets"
			},
			"id": "EX1_080o",
			"name": "Keeping Secrets",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA06_1H.png",
			"fr": {
				"name": "Chambellan Executus"
			},
			"health": 30,
			"id": "BRMA06_1H",
			"name": "Majordomo Executus",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 1,
			"cardImage": "XXX_094.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - Blank Slate"
			},
			"health": 1,
			"id": "XXX_094",
			"name": "AI Buddy - Blank Slate",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_5_Ench.png",
			"fr": {
				"name": "Choisissez votre destin : enchantement 5"
			},
			"id": "TB_PickYourFate_5_Ench",
			"name": "Pick Your Fate 5 Ench",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_009e.png",
			"fr": {
				"name": "Enragé"
			},
			"id": "EX1_009e",
			"name": "Enraged",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOE_017e.png",
			"fr": {
				"name": "Observé"
			},
			"id": "LOE_017e",
			"name": "Watched",
			"playerClass": "Paladin",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Ladronn",
			"attack": 2,
			"cardImage": "CS2_131.png",
			"collectible": true,
			"cost": 4,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Chevalier de Hurlevent"
			},
			"health": 5,
			"id": "CS2_131",
			"name": "Stormwind Knight",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "CS2_065.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Marcheur du Vide"
			},
			"health": 3,
			"id": "CS2_065",
			"name": "Voidwalker",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": " James Ryman",
			"attack": 3,
			"cardImage": "AT_081.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Eadric le Pur"
			},
			"health": 7,
			"id": "AT_081",
			"name": "Eadric the Pure",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley",
			"attack": 8,
			"cardImage": "BRM_029.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Rend Main-Noire"
			},
			"health": 4,
			"id": "BRM_029",
			"name": "Rend Blackhand",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_11rand.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : murlocs"
			},
			"id": "TB_PickYourFate_11rand",
			"name": "Dire Fate: Murlocs",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "BRMA06_4.png",
			"cost": 2,
			"fr": {
				"name": "Acolyte attise-flammes"
			},
			"health": 3,
			"id": "BRMA06_4",
			"name": "Flamewaker Acolyte",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_561e.png",
			"fr": {
				"name": "Feu d’Alexstrasza"
			},
			"id": "EX1_561e",
			"name": "Alexstrasza's Fire",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Wei Wang",
			"attack": 3,
			"cardImage": "EX1_049.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Jeune maître brasseur"
			},
			"health": 2,
			"id": "EX1_049",
			"name": "Youthful Brewmaster",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 6,
			"cardImage": "CS2_064.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Infernal de l’effroi"
			},
			"health": 6,
			"id": "CS2_064",
			"name": "Dread Infernal",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Anton Kagounkin",
			"attack": 2,
			"cardImage": "OG_202c.png",
			"cost": 1,
			"fr": {
				"name": "Gelée"
			},
			"health": 2,
			"id": "OG_202c",
			"name": "Slime",
			"playerClass": "Druid",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_9_EnchMinion.png",
			"fr": {
				"name": "Bonus"
			},
			"id": "TB_PickYourFate_9_EnchMinion",
			"name": "Bonus",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Cyril Van Der Haegen",
			"cardImage": "CS2_007.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Toucher guérisseur"
			},
			"id": "CS2_007",
			"name": "Healing Touch",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_004e.png",
			"fr": {
				"name": "Endurance du Crépuscule"
			},
			"id": "BRM_004e",
			"name": "Twilight Endurance",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"artist": "Sean O’Daniels",
			"attack": 0,
			"cardImage": "EX1_006.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Robot d’alarme"
			},
			"health": 3,
			"id": "EX1_006",
			"name": "Alarm-o-Bot",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "RK Post",
			"attack": 4,
			"cardImage": "AT_047.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Grave-totem draeneï"
			},
			"health": 4,
			"id": "AT_047",
			"name": "Draenei Totemcarver",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "GVG_026.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Feindre la mort"
			},
			"id": "GVG_026",
			"name": "Feign Death",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "TBA01_5.png",
			"cost": 2,
			"fr": {
				"name": "Magie sauvage"
			},
			"id": "TBA01_5",
			"name": "Wild Magic",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA09_3H.png",
			"cost": 2,
			"fr": {
				"name": "Ancienne Horde"
			},
			"id": "BRMA09_3H",
			"name": "Old Horde",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Kevin Chin",
			"cardImage": "EX1_245.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Horion de terre"
			},
			"id": "EX1_245",
			"name": "Earth Shock",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA09_2H.png",
			"cost": 2,
			"fr": {
				"name": "Ouvrir les portes"
			},
			"id": "BRMA09_2H",
			"name": "Open the Gates",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"attack": 0,
			"cardImage": "BRMA10_4H.png",
			"cost": 1,
			"fr": {
				"name": "Œuf corrompu"
			},
			"health": 3,
			"id": "BRMA10_4H",
			"name": "Corrupted Egg",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_058e.png",
			"fr": {
				"name": "Weapon Nerf Enchant"
			},
			"id": "XXX_058e",
			"name": "Weapon Nerf Enchant",
			"set": "Cheat",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_BlingBrawl_Hero1e.png",
			"fr": {
				"name": "Affûtée"
			},
			"id": "TB_BlingBrawl_Hero1e",
			"name": "Sharpened",
			"playerClass": "Rogue",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 12,
			"cardImage": "OG_317.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Seigneur Aile de mort"
			},
			"health": 12,
			"id": "OG_317",
			"name": "Deathwing, Dragonlord",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 4,
			"cardImage": "GVG_096.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Déchiqueteur piloté"
			},
			"health": 3,
			"id": "GVG_096",
			"name": "Piloted Shredder",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_15.png",
			"cost": 0,
			"fr": {
				"name": "Larme d’Ysera"
			},
			"id": "LOEA16_15",
			"name": "Ysera's Tear",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "BRMA04_3.png",
			"cost": 0,
			"fr": {
				"name": "Lige du feu"
			},
			"health": 5,
			"id": "BRMA04_3",
			"name": "Firesworn",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA05_2H.png",
			"cost": 0,
			"fr": {
				"name": "Mana enflammé"
			},
			"id": "BRMA05_2H",
			"name": "Ignite Mana",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Doug Alexander",
			"attack": 3,
			"cardImage": "EX1_019.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Clerc du Soleil brisé"
			},
			"health": 2,
			"id": "EX1_019",
			"name": "Shattered Sun Cleric",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 7,
			"cardImage": "EX1_250.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Élémentaire de terre"
			},
			"health": 8,
			"id": "EX1_250",
			"name": "Earth Elemental",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TU4c_006e.png",
			"fr": {
				"name": "Banane"
			},
			"id": "TU4c_006e",
			"name": "Bananas",
			"set": "Missions",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 8,
			"cardImage": "EX1_561.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Alexstrasza"
			},
			"health": 8,
			"id": "EX1_561",
			"name": "Alexstrasza",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "AT_078.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Entrée dans le Colisée"
			},
			"id": "AT_078",
			"name": "Enter the Coliseum",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "CRED_38.png",
			"cost": 4,
			"fr": {
				"name": "Robin Fredericksen"
			},
			"health": 4,
			"id": "CRED_38",
			"name": "Robin Fredericksen",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "TB_SPT_BossWeapon.png",
			"cost": 1,
			"durability": 1,
			"fr": {
				"name": "Armurerie"
			},
			"id": "TB_SPT_BossWeapon",
			"name": "Armory",
			"set": "Tb",
			"type": "Weapon"
		},
		{
			"artist": "Seamus Gallagher",
			"attack": 2,
			"cardImage": "GVG_081.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Traqueur gloubelin"
			},
			"health": 3,
			"id": "GVG_081",
			"name": "Gilblin Stalker",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "NAX14_02.png",
			"cost": 0,
			"fr": {
				"name": "Souffle de givre"
			},
			"id": "NAX14_02",
			"name": "Frost Breath",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "Trent Kaniuga",
			"cardImage": "GVG_041.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Sombres feux follets"
			},
			"id": "GVG_041",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "Jomaro Kindred",
			"attack": 3,
			"cardImage": "GVG_119.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Bling-o-tron 3000"
			},
			"health": 4,
			"id": "GVG_119",
			"name": "Blingtron 3000",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA09_9H.png",
			"cost": 1,
			"fr": {
				"name": "Répulsif à nagas"
			},
			"id": "LOEA09_9H",
			"name": "Naga Repellent",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "AT_036t.png",
			"cost": 3,
			"fr": {
				"name": "Nérubien"
			},
			"health": 4,
			"id": "AT_036t",
			"name": "Nerubian",
			"playerClass": "Rogue",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_017.png",
			"cost": 2,
			"fr": {
				"name": "Changeforme"
			},
			"id": "CS2_017",
			"name": "Shapeshift",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero_power"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 2,
			"cardImage": "AT_105.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Kvaldir blessé"
			},
			"health": 4,
			"id": "AT_105",
			"name": "Injured Kvaldir",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA10_2H.png",
			"cost": 0,
			"fr": {
				"name": "Mrglmrgl MRGL !"
			},
			"id": "LOEA10_2H",
			"name": "Mrglmrgl MRGL!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Daarken",
			"cardImage": "EX1_238.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Éclair"
			},
			"id": "EX1_238",
			"name": "Lightning Bolt",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_154a.png",
			"cost": 0,
			"fr": {
				"name": "Colère"
			},
			"id": "EX1_154a",
			"name": "Wrath",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA01_02h.png",
			"cost": 0,
			"fr": {
				"name": "Bénédictions du soleil"
			},
			"id": "LOEA01_02h",
			"name": "Blessings of the Sun",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"attack": 2,
			"cardImage": "TB_CoOp_Mechazod.png",
			"cost": 10,
			"fr": {
				"name": "Maître des rouages Mécazod"
			},
			"health": 95,
			"id": "TB_CoOp_Mechazod",
			"name": "Gearmaster Mechazod",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 7,
			"cardImage": "GVG_070.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Mataf"
			},
			"health": 4,
			"id": "GVG_070",
			"name": "Salty Dog",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"attack": 1,
			"cardImage": "OG_216a.png",
			"cost": 1,
			"fr": {
				"name": "Araignée"
			},
			"health": 1,
			"id": "OG_216a",
			"name": "Spider",
			"playerClass": "Hunter",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 4,
			"cardImage": "LOE_061.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Sentinelle Anubisath"
			},
			"health": 4,
			"id": "LOE_061",
			"name": "Anubisath Sentinel",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "HERO_04.png",
			"collectible": true,
			"fr": {
				"name": "Uther le Porteur de Lumière"
			},
			"health": 30,
			"id": "HERO_04",
			"name": "Uther Lightbringer",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero"
		},
		{
			"attack": 6,
			"cardImage": "LOEA04_24h.png",
			"cost": 8,
			"fr": {
				"name": "Garde du temple anubisath"
			},
			"health": 15,
			"id": "LOEA04_24h",
			"name": "Anubisath Temple Guard",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "AT_121e.png",
			"fr": {
				"name": "Ego énorme"
			},
			"id": "AT_121e",
			"name": "Huge Ego",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_052.png",
			"cost": 0,
			"fr": {
				"name": "Grant Mega-Windfury"
			},
			"id": "XXX_052",
			"name": "Grant Mega-Windfury",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_061.png",
			"cost": 0,
			"fr": {
				"name": "Armor 1"
			},
			"id": "XXX_061",
			"name": "Armor 1",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Tooth",
			"attack": 2,
			"cardImage": "CS2_141.png",
			"collectible": true,
			"cost": 3,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Fusilier de Forgefer"
			},
			"health": 2,
			"id": "CS2_141",
			"name": "Ironforge Rifleman",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Ben Olson",
			"cardImage": "BRM_015.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Revanche"
			},
			"id": "BRM_015",
			"name": "Revenge",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Eva Widermann",
			"attack": 3,
			"cardImage": "AT_046.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Rohart totémique"
			},
			"health": 2,
			"id": "AT_046",
			"name": "Tuskarr Totemic",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "TB_KTRAF_4m.png",
			"cost": 3,
			"fr": {
				"name": "Gothik spectral"
			},
			"health": 3,
			"id": "TB_KTRAF_4m",
			"name": "Spectral Gothik",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_8_EnchRand.png",
			"fr": {
				"name": "Destin aléatoire 8 : +2 Armure à chaque tour"
			},
			"id": "TB_PickYourFate_8_EnchRand",
			"name": "Fate 8 Rand 2 armor each turn",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_101.png",
			"cost": 2,
			"fr": {
				"name": "Renfort"
			},
			"id": "CS2_101",
			"name": "Reinforce",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero_power"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "GVG_082.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Gnome mécanique"
			},
			"health": 1,
			"id": "GVG_082",
			"name": "Clockwork Gnome",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "EX1_544.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Fusée éclairante"
			},
			"id": "EX1_544",
			"name": "Flare",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Phroi Gardner",
			"attack": 3,
			"cardImage": "OG_102.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Sombre orateur"
			},
			"health": 6,
			"id": "OG_102",
			"name": "Darkspeaker",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "CRED_13.png",
			"cost": 10,
			"fr": {
				"name": "Brian Schwab"
			},
			"health": 10,
			"id": "CRED_13",
			"name": "Brian Schwab",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "DREAM_04.png",
			"cost": 0,
			"fr": {
				"name": "Rêve"
			},
			"id": "DREAM_04",
			"name": "Dream",
			"playerClass": "Dream",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "TB_ClassRandom_Rogue.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : voleur"
			},
			"id": "TB_ClassRandom_Rogue",
			"name": "Second Class: Rogue",
			"playerClass": "Rogue",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_345.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Jeux d’esprit"
			},
			"id": "EX1_345",
			"name": "Mindgames",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Warren Mahy",
			"cardImage": "EX1_277.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Projectiles des Arcanes"
			},
			"id": "EX1_277",
			"name": "Arcane Missiles",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Skan Srisuwan",
			"cardImage": "OG_195a.png",
			"cost": 0,
			"fr": {
				"name": "Feux follets à foison"
			},
			"id": "OG_195a",
			"name": "Many Wisps",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 2,
			"cardImage": "GVG_058.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Mini-robot blindé"
			},
			"health": 2,
			"id": "GVG_058",
			"name": "Shielded Minibot",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 1,
			"cardImage": "OG_195c.png",
			"cost": 0,
			"fr": {
				"name": "Feu follet"
			},
			"health": 1,
			"id": "OG_195c",
			"name": "Wisp",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "LOE_007.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Malédiction de Rafaam"
			},
			"id": "LOE_007",
			"name": "Curse of Rafaam",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Terese Nielsen",
			"attack": 1,
			"cardImage": "CS2_235.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Clerc de Comté-du-Nord"
			},
			"health": 3,
			"id": "CS2_235",
			"name": "Northshire Cleric",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "NAX11_02.png",
			"cost": 2,
			"fr": {
				"name": "Nuage empoisonné"
			},
			"id": "NAX11_02",
			"name": "Poison Cloud",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 5,
			"cardImage": "OG_087.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Serviteur de Yogg-Saron"
			},
			"health": 4,
			"id": "OG_087",
			"name": "Servant of Yogg-Saron",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 3,
			"cardImage": "LOE_046.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Crapaud énorme"
			},
			"health": 2,
			"id": "LOE_046",
			"name": "Huge Toad",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Sean O’Daniels",
			"cardImage": "CS2_012.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Balayage"
			},
			"id": "CS2_012",
			"name": "Swipe",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "Mekka3e.png",
			"fr": {
				"name": "Encouragé !"
			},
			"id": "Mekka3e",
			"name": "Emboldened!",
			"set": "Promo",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "NAX13_04H.png",
			"cost": 5,
			"fr": {
				"name": "Feugen"
			},
			"health": 7,
			"id": "NAX13_04H",
			"name": "Feugen",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "OG_080b.png",
			"cost": 1,
			"fr": {
				"name": "Toxine de sang-royal"
			},
			"id": "OG_080b",
			"name": "Kingsblood Toxin",
			"playerClass": "Rogue",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_573ae.png",
			"fr": {
				"name": "Faveur du demi-dieu"
			},
			"id": "EX1_573ae",
			"name": "Demigod's Favor",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "EX1_317t.png",
			"cost": 1,
			"fr": {
				"name": "Diablotin sans valeur"
			},
			"health": 1,
			"id": "EX1_317t",
			"name": "Worthless Imp",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_051.png",
			"cost": 0,
			"fr": {
				"name": "Make Immune"
			},
			"id": "XXX_051",
			"name": "Make Immune",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "CRED_28.png",
			"cost": 4,
			"fr": {
				"name": "He-Rim Woo"
			},
			"health": 3,
			"id": "CRED_28",
			"name": "He-Rim Woo",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Edouard Guiton & Tony Washington",
			"attack": 5,
			"cardImage": "AT_108.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Cheval de guerre cuirassé"
			},
			"health": 3,
			"id": "AT_108",
			"name": "Armored Warhorse",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_10.png",
			"cost": 0,
			"fr": {
				"name": "Bonus : Cri de guerre"
			},
			"id": "TB_PickYourFate_10",
			"name": "Battlecry Bonus",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Peet Cooper",
			"attack": 2,
			"cardImage": "AT_050.png",
			"collectible": true,
			"cost": 4,
			"durability": 4,
			"fr": {
				"name": "Marteau chargé"
			},
			"id": "AT_050",
			"name": "Charged Hammer",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Weapon"
		},
		{
			"artist": "Dave Allsop",
			"attack": 5,
			"cardImage": "OG_302.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Passeuse d’âmes"
			},
			"health": 6,
			"id": "OG_302",
			"name": "Usher of Souls",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CS2_152.png",
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Écuyer"
			},
			"health": 2,
			"id": "CS2_152",
			"name": "Squire",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"cardImage": "OG_080c.png",
			"cost": 1,
			"fr": {
				"name": "Toxine de chardon sanglant"
			},
			"id": "OG_080c",
			"name": "Bloodthistle Toxin",
			"playerClass": "Rogue",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Chippy",
			"cardImage": "CS2_062.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Flammes infernales"
			},
			"id": "CS2_062",
			"name": "Hellfire",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_154b.png",
			"cost": 0,
			"fr": {
				"name": "Colère"
			},
			"id": "EX1_154b",
			"name": "Wrath",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Ruan Jia",
			"attack": 7,
			"cardImage": "GVG_042.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Neptulon"
			},
			"health": 7,
			"id": "GVG_042",
			"name": "Neptulon",
			"playerClass": "Shaman",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_536e.png",
			"fr": {
				"name": "Amélioration"
			},
			"id": "EX1_536e",
			"name": "Upgraded",
			"playerClass": "Hunter",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "EX1_110t.png",
			"cost": 4,
			"fr": {
				"name": "Baine Sabot-de-Sang"
			},
			"health": 5,
			"id": "EX1_110t",
			"name": "Baine Bloodhoof",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Howard Lyon",
			"cardImage": "GVG_073.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Tir du cobra"
			},
			"id": "GVG_073",
			"name": "Cobra Shot",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_102_H1_AT_132.png",
			"cost": 2,
			"fr": {
				"name": "Défense stoïque"
			},
			"id": "CS2_102_H1_AT_132",
			"name": "Tank Up!",
			"playerClass": "Warrior",
			"set": "Hero_skins",
			"type": "Hero_power"
		},
		{
			"artist": "Jessica Jung",
			"cardImage": "CS2_004.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Mot de pouvoir : Bouclier"
			},
			"id": "CS2_004",
			"name": "Power Word: Shield",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_037.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Horion de givre"
			},
			"id": "CS2_037",
			"name": "Frost Shock",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_039.png",
			"cost": 0,
			"fr": {
				"name": "Become Hogger"
			},
			"id": "XXX_039",
			"name": "Become Hogger",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "HERO_02.png",
			"collectible": true,
			"fr": {
				"name": "Thrall"
			},
			"health": 30,
			"id": "HERO_02",
			"name": "Thrall",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero"
		},
		{
			"cardImage": "TB_RandCardCost.png",
			"fr": {
				"name": "TBRandomCardCost"
			},
			"id": "TB_RandCardCost",
			"name": "TBRandomCardCost",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_165b.png",
			"cost": 0,
			"fr": {
				"name": "Forme d’ours"
			},
			"id": "EX1_165b",
			"name": "Bear Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "LOEA02_10a.png",
			"cost": 0,
			"fr": {
				"name": "Leokk"
			},
			"health": 4,
			"id": "LOEA02_10a",
			"name": "Leokk",
			"playerClass": "Hunter",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_103e2.png",
			"fr": {
				"name": "Charge"
			},
			"id": "CS2_103e2",
			"name": "Charge",
			"playerClass": "Warrior",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA17_3H.png",
			"fr": {
				"name": "Onyxia"
			},
			"health": 30,
			"id": "BRMA17_3H",
			"name": "Onyxia",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "PRO_001a.png",
			"cost": 4,
			"fr": {
				"name": "Je suis murloc"
			},
			"id": "PRO_001a",
			"name": "I Am Murloc",
			"set": "Promo",
			"type": "Spell"
		},
		{
			"cardImage": "AT_132_HUNTER.png",
			"cost": 2,
			"fr": {
				"name": "Tir de baliste"
			},
			"id": "AT_132_HUNTER",
			"name": "Ballista Shot",
			"playerClass": "Hunter",
			"set": "Tgt",
			"type": "Hero_power"
		},
		{
			"attack": 6,
			"cardImage": "PlaceholderCard.png",
			"cost": 9,
			"fr": {
				"name": "Placeholder Card"
			},
			"health": 8,
			"id": "PlaceholderCard",
			"name": "Placeholder Card",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "None",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_363e2.png",
			"fr": {
				"name": "Bénédiction de sagesse"
			},
			"id": "EX1_363e2",
			"name": "Blessing of Wisdom",
			"playerClass": "Paladin",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Karl Richardson",
			"attack": 2,
			"cardImage": "EX1_011.png",
			"collectible": true,
			"cost": 1,
			"faction": "HORDE",
			"fr": {
				"name": "Docteur vaudou"
			},
			"health": 1,
			"id": "EX1_011",
			"name": "Voodoo Doctor",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 4,
			"cardImage": "FP1_015.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Feugen"
			},
			"health": 7,
			"id": "FP1_015",
			"name": "Feugen",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "TBST_001.png",
			"cost": 1,
			"fr": {
				"name": "Tank débutant"
			},
			"health": 2,
			"id": "TBST_001",
			"name": "OLDN3wb Tank",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "NAX9_07e.png",
			"fr": {
				"name": "Marque des cavaliers"
			},
			"id": "NAX9_07e",
			"name": "Mark of the Horsemen",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"cardImage": "NEW1_018e.png",
			"fr": {
				"name": "Obnubilé par les trésors"
			},
			"id": "NEW1_018e",
			"name": "Treasure Crazed",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Andrew Hou",
			"attack": 2,
			"cardImage": "OG_313.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Grizzly perturbé"
			},
			"health": 2,
			"id": "OG_313",
			"name": "Addled Grizzly",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "NAX10_01H.png",
			"fr": {
				"name": "Le Recousu"
			},
			"health": 45,
			"id": "NAX10_01H",
			"name": "Patchwerk",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA09_6.png",
			"cost": 1,
			"fr": {
				"name": "Véritable chef de guerre"
			},
			"id": "BRMA09_6",
			"name": "The True Warchief",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Glenn Rane",
			"attack": 1,
			"cardImage": "CS2_091.png",
			"collectible": true,
			"cost": 1,
			"durability": 4,
			"fr": {
				"name": "Justice de la Lumière"
			},
			"id": "CS2_091",
			"name": "Light's Justice",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"type": "Weapon"
		},
		{
			"cardImage": "TB_KTRAF_H_2.png",
			"fr": {
				"name": "Rafaam"
			},
			"health": 60,
			"id": "TB_KTRAF_H_2",
			"name": "Rafaam",
			"rarity": "Free",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"artist": "Mike Sass",
			"attack": 6,
			"cardImage": "OG_142.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Horreur indicible"
			},
			"health": 10,
			"id": "OG_142",
			"name": "Eldritch Horror",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_30a.png",
			"cost": 0,
			"fr": {
				"name": "Prendre le raccourci"
			},
			"id": "LOEA04_30a",
			"name": "Take the Shortcut",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "EX1_tk9.png",
			"cost": 1,
			"fr": {
				"name": "Tréant"
			},
			"health": 2,
			"id": "EX1_tk9",
			"name": "Treant",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TB_001.png",
			"fr": {
				"name": "Échanger les PV des boss"
			},
			"id": "TB_001",
			"name": "Boss HP Swapper",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "BRM_011.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Horion de lave"
			},
			"id": "BRM_011",
			"name": "Lava Shock",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "AT_027e.png",
			"fr": {
				"name": "Maître invocateur"
			},
			"id": "AT_027e",
			"name": "Master Summoner",
			"playerClass": "Warlock",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Wei Wang",
			"attack": 7,
			"cardImage": "EX1_350.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Prophète Velen"
			},
			"health": 7,
			"id": "EX1_350",
			"name": "Prophet Velen",
			"playerClass": "Priest",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA14_2.png",
			"cost": 0,
			"fr": {
				"name": "Armure de plates"
			},
			"id": "LOEA14_2",
			"name": "Platemail Armor",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 3,
			"cardImage": "LOE_019.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Raptor déterré"
			},
			"health": 4,
			"id": "LOE_019",
			"name": "Unearthed Raptor",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA05_02a.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester serviteurs !"
			},
			"id": "LOEA05_02a",
			"name": "Trogg Hate Minions!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Efrem Palacios",
			"cardImage": "GVG_031.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Recyclage"
			},
			"id": "GVG_031",
			"name": "Recycle",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "AT_119e.png",
			"fr": {
				"name": "Exalté"
			},
			"id": "AT_119e",
			"name": "Inspired",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Tooth",
			"attack": 4,
			"cardImage": "AT_027.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Wilfred Flopboum"
			},
			"health": 4,
			"id": "AT_027",
			"name": "Wilfred Fizzlebang",
			"playerClass": "Warlock",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_009e.png",
			"fr": {
				"name": "Marque du fauve"
			},
			"id": "CS2_009e",
			"name": "Mark of the Wild",
			"playerClass": "Druid",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_303e.png",
			"fr": {
				"name": "Dévotion de l’ensorceleur"
			},
			"id": "OG_303e",
			"name": "Sorcerous Devotion",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_CoOpBossSpell_5.png",
			"cost": 0,
			"fr": {
				"name": "Double zap"
			},
			"id": "TB_CoOpBossSpell_5",
			"name": "Double Zap",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA06_03.png",
			"cost": 2,
			"fr": {
				"name": "Terrestre animé"
			},
			"id": "LOEA06_03",
			"name": "Animate Earthen",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_20e.png",
			"fr": {
				"name": "Béni"
			},
			"id": "LOEA16_20e",
			"name": "Blessed",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Andrew Hou",
			"attack": 1,
			"cardImage": "LOE_018.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Trogg des tunnels"
			},
			"health": 3,
			"id": "LOE_018",
			"name": "Tunnel Trogg",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "NAX4_03.png",
			"cost": 1,
			"fr": {
				"name": "Squelette"
			},
			"health": 1,
			"id": "NAX4_03",
			"name": "Skeleton",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "HERO_06.png",
			"collectible": true,
			"fr": {
				"name": "Malfurion Hurlorage"
			},
			"health": 30,
			"id": "HERO_06",
			"name": "Malfurion Stormrage",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero"
		},
		{
			"artist": "Jim Nelson",
			"attack": 4,
			"cardImage": "FP1_021.png",
			"collectible": true,
			"cost": 4,
			"durability": 2,
			"fr": {
				"name": "Morsure de la mort"
			},
			"id": "FP1_021",
			"name": "Death's Bite",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Weapon"
		},
		{
			"artist": "Sean O'Daniels",
			"cardImage": "EX1_626.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Dissipation de masse"
			},
			"id": "EX1_626",
			"name": "Mass Dispel",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 6,
			"cardImage": "LOEA07_14.png",
			"cost": 6,
			"fr": {
				"name": "Golem chancelant"
			},
			"health": 6,
			"id": "LOEA07_14",
			"name": "Lumbering Golem",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "TB_ClassRandom_Warrior.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : guerrier"
			},
			"id": "TB_ClassRandom_Warrior",
			"name": "Second Class: Warrior",
			"playerClass": "Warrior",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_8.png",
			"cost": 0,
			"fr": {
				"name": "Fiole de Putrescin"
			},
			"id": "LOEA16_8",
			"name": "Putress' Vial",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "AT_017e.png",
			"fr": {
				"name": "Étreinte du Crépuscule"
			},
			"id": "AT_017e",
			"name": "Twilight's Embrace",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_063.png",
			"cost": 0,
			"fr": {
				"name": "Destroy ALL Secrets"
			},
			"id": "XXX_063",
			"name": "Destroy ALL Secrets",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Clint Langley",
			"attack": 2,
			"cardImage": "GVG_040.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Marche-esprit aileron vaseux"
			},
			"health": 5,
			"id": "GVG_040",
			"name": "Siltfin Spiritwalker",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Laurel Austin",
			"attack": 2,
			"cardImage": "AT_038.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Aspirante de Darnassus"
			},
			"health": 3,
			"id": "AT_038",
			"name": "Darnassus Aspirant",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CS2_tk1.png",
			"cost": 0,
			"fr": {
				"name": "Mouton"
			},
			"health": 1,
			"id": "CS2_tk1",
			"name": "Sheep",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Ryan Sook",
			"attack": 4,
			"cardImage": "CS2_097.png",
			"collectible": true,
			"cost": 4,
			"durability": 2,
			"fr": {
				"name": "Championne en vrai-argent"
			},
			"id": "CS2_097",
			"name": "Truesilver Champion",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Core",
			"type": "Weapon"
		},
		{
			"cardImage": "BRMA14_6.png",
			"cost": 6,
			"fr": {
				"name": "Activer Électron"
			},
			"id": "BRMA14_6",
			"name": "Activate Electron",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_004.png",
			"cost": 0,
			"fr": {
				"name": "Restore 5"
			},
			"id": "XXX_004",
			"name": "Restore 5",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFateRandom.png",
			"fr": {
				"name": "Choisissez votre destin - Aléatoire"
			},
			"id": "TB_PickYourFateRandom",
			"name": "Pick Your Fate Random",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA02_2_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Foule moqueuse"
			},
			"id": "BRMA02_2_2_TB",
			"name": "Jeering Crowd",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_202ae.png",
			"fr": {
				"name": "Force d’Y’Shaarj"
			},
			"id": "OG_202ae",
			"name": "Y'Shaarj's Strength",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_ClassRandom_Druid.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : druide"
			},
			"id": "TB_ClassRandom_Druid",
			"name": "Second Class: Druid",
			"playerClass": "Druid",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Ben Zhang",
			"attack": 5,
			"cardImage": "LOE_038.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Sorcière des mers naga"
			},
			"health": 5,
			"id": "LOE_038",
			"name": "Naga Sea Witch",
			"rarity": "Epic",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Phroi Gardner",
			"attack": 3,
			"cardImage": "OG_310.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Régisseuse de Sombre-Comté"
			},
			"health": 3,
			"id": "OG_310",
			"name": "Steward of Darkshire",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_103e.png",
			"fr": {
				"name": "Mrghlglhal"
			},
			"id": "EX1_103e",
			"name": "Mrghlglhal",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Penny Arcade",
			"attack": 5,
			"cardImage": "AT_112.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Maître jouteur"
			},
			"health": 6,
			"id": "AT_112",
			"name": "Master Jouster",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "EX1_312.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Néant distordu"
			},
			"id": "EX1_312",
			"name": "Twisting Nether",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Chippy",
			"attack": 4,
			"cardImage": "EX1_091.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Prêtresse de la Cabale"
			},
			"health": 5,
			"id": "EX1_091",
			"name": "Cabal Shadow Priest",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX4_01H.png",
			"fr": {
				"name": "Noth le Porte-Peste"
			},
			"health": 45,
			"id": "NAX4_01H",
			"name": "Noth the Plaguebringer",
			"playerClass": "Mage",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"attack": 1,
			"cardImage": "BRMA17_7.png",
			"cost": 2,
			"fr": {
				"name": "Prototype chromatique"
			},
			"health": 4,
			"id": "BRMA17_7",
			"name": "Chromatic Prototype",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA11_1H.png",
			"fr": {
				"name": "Vaelastrasz le Corrompu"
			},
			"health": 30,
			"id": "BRMA11_1H",
			"name": "Vaelastrasz the Corrupt",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Jakub Kasber",
			"attack": 1,
			"cardImage": "OG_070.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Sectateur de la Lame"
			},
			"health": 2,
			"id": "OG_070",
			"name": "Bladed Cultist",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA09_3aH.png",
			"fr": {
				"name": "Mort de faim"
			},
			"id": "LOEA09_3aH",
			"name": "Famished",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "LOEA01_11h.png",
			"cost": 0,
			"fr": {
				"name": "Baguette du Soleil"
			},
			"health": 5,
			"id": "LOEA01_11h",
			"name": "Rod of the Sun",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA10_1.png",
			"fr": {
				"name": "Aileron-Géant"
			},
			"health": 30,
			"id": "LOEA10_1",
			"name": "Giantfin",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA05_02.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester serviteurs !"
			},
			"id": "LOEA05_02",
			"name": "Trogg Hate Minions!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_007e.png",
			"fr": {
				"name": "Inversion déviante"
			},
			"id": "TB_007e",
			"name": "Deviate Switch",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Paul Mafayon",
			"cardImage": "AT_025.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Sombre marché"
			},
			"id": "AT_025",
			"name": "Dark Bargain",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Raven Mimura",
			"cardImage": "EX1_317.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Détection des démons"
			},
			"id": "EX1_317",
			"name": "Sense Demons",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "HERO_05.png",
			"collectible": true,
			"fr": {
				"name": "Rexxar"
			},
			"health": 30,
			"id": "HERO_05",
			"name": "Rexxar",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero"
		},
		{
			"cardImage": "CS2_022e.png",
			"fr": {
				"name": "Métamorphose"
			},
			"id": "CS2_022e",
			"name": "Polymorph",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "John Polidora",
			"attack": 2,
			"cardImage": "EX1_567.png",
			"collectible": true,
			"cost": 5,
			"durability": 8,
			"fr": {
				"name": "Marteau-du-Destin"
			},
			"id": "EX1_567",
			"name": "Doomhammer",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Weapon"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "AT_019.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Destrier de l’effroi"
			},
			"health": 1,
			"id": "AT_019",
			"name": "Dreadsteed",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_173.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Feu stellaire"
			},
			"id": "EX1_173",
			"name": "Starfire",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "TB_Superfriends001.png",
			"cost": 0,
			"fr": {
				"name": "Jeu offensif"
			},
			"id": "TB_Superfriends001",
			"name": "Offensive Play",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Matthew O'Connor",
			"cardImage": "OG_073.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Thé de chardon"
			},
			"id": "OG_073",
			"name": "Thistle Tea",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Og",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_25.png",
			"cost": 5,
			"fr": {
				"name": "Dame Naz’jar"
			},
			"health": 5,
			"id": "LOEA16_25",
			"name": "Lady Naz'jar",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "OG_188e.png",
			"fr": {
				"name": "Carapace d’ambre"
			},
			"id": "OG_188e",
			"name": "Amber Carapace",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Michael Komarck",
			"attack": 4,
			"cardImage": "EX1_563.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Malygos"
			},
			"health": 12,
			"id": "EX1_563",
			"name": "Malygos",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "FP1_012t.png",
			"cost": 1,
			"fr": {
				"name": "Gelée"
			},
			"health": 2,
			"id": "FP1_012t",
			"name": "Slime",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 1,
			"cardImage": "CS2_189.png",
			"collectible": true,
			"cost": 1,
			"faction": "HORDE",
			"fr": {
				"name": "Archère elfe"
			},
			"health": 1,
			"id": "CS2_189",
			"name": "Elven Archer",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA02_05.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : gloire"
			},
			"id": "LOEA02_05",
			"name": "Wish for Glory",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Glenn Rane",
			"attack": 5,
			"cardImage": "GVG_004.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Explomage gobelin"
			},
			"health": 4,
			"id": "GVG_004",
			"name": "Goblin Blastmage",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA07_26.png",
			"cost": 1,
			"fr": {
				"name": "Consulter Brann"
			},
			"id": "LOEA07_26",
			"name": "Consult Brann",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA13_3.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "BRMA13_3",
			"name": "Nefarian",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 5,
			"cardImage": "CRED_43.png",
			"cost": 5,
			"fr": {
				"name": "Jon Bankard"
			},
			"health": 5,
			"id": "CRED_43",
			"name": "Jon Bankard",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 5,
			"cardImage": "AT_113.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Recruteur"
			},
			"health": 4,
			"id": "AT_113",
			"name": "Recruiter",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "CRED_33.png",
			"cost": 6,
			"fr": {
				"name": "Jomaro Kindred"
			},
			"health": 6,
			"id": "CRED_33",
			"name": "Jomaro Kindred",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_041b.png",
			"cost": 0,
			"fr": {
				"name": "Sombres feux follets"
			},
			"id": "GVG_041b",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "DS1h_292_H1_AT_132.png",
			"cost": 2,
			"fr": {
				"name": "Tir de baliste"
			},
			"id": "DS1h_292_H1_AT_132",
			"name": "Ballista Shot",
			"playerClass": "Hunter",
			"set": "Hero_skins",
			"type": "Hero_power"
		},
		{
			"artist": "Hideaki Takamura",
			"attack": 1,
			"cardImage": "EX1_055.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Accro au mana"
			},
			"health": 3,
			"id": "EX1_055",
			"name": "Mana Addict",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_027.png",
			"cost": 0,
			"fr": {
				"name": "Server Crash"
			},
			"id": "XXX_027",
			"name": "Server Crash",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_043e.png",
			"fr": {
				"name": "Heure du Crépuscule"
			},
			"id": "EX1_043e",
			"name": "Hour of Twilight",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Brian Despain",
			"attack": 2,
			"cardImage": "GVG_027.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Senseï de fer"
			},
			"health": 2,
			"id": "GVG_027",
			"name": "Iron Sensei",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"cardImage": "CS2_076.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Assassiner"
			},
			"id": "CS2_076",
			"name": "Assassinate",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "OG_271e.png",
			"fr": {
				"name": "Visage terrifiant"
			},
			"id": "OG_271e",
			"name": "Terrifying Visage",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "LOEA06_02t.png",
			"cost": 1,
			"fr": {
				"name": "Statue de terrestre"
			},
			"health": 2,
			"id": "LOEA06_02t",
			"name": "Earthen Statue",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_178be.png",
			"fr": {
				"name": "Déraciné"
			},
			"id": "EX1_178be",
			"name": "Uprooted",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA09_2eH.png",
			"fr": {
				"name": "Enragé"
			},
			"id": "LOEA09_2eH",
			"name": "Enraged",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "EX1_165t1.png",
			"cost": 5,
			"fr": {
				"name": "Druide de la Griffe"
			},
			"health": 4,
			"id": "EX1_165t1",
			"name": "Druid of the Claw",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA06_3.png",
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 8,
			"id": "BRMA06_3",
			"name": "Ragnaros the Firelord",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_003.png",
			"cost": 0,
			"fr": {
				"name": "Restore 1"
			},
			"id": "XXX_003",
			"name": "Restore 1",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "CRED_08.png",
			"cost": 3,
			"fr": {
				"name": "Ben Brode"
			},
			"health": 1,
			"id": "CRED_08",
			"name": "Ben Brode",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Doug Alexander",
			"attack": 3,
			"cardImage": "EX1_591.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Prêtresse auchenaï"
			},
			"health": 5,
			"id": "EX1_591",
			"name": "Auchenai Soulpriest",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA15_1H.png",
			"fr": {
				"name": "Rafaam (héroïque)"
			},
			"health": 30,
			"id": "LOEA15_1H",
			"name": "Heroic Rafaam",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "EX1_246e.png",
			"fr": {
				"name": "Maléficié"
			},
			"id": "EX1_246e",
			"name": "Hexxed",
			"playerClass": "Shaman",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "Malcolm Davis",
			"attack": 1,
			"cardImage": "CS2_231.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Feu follet"
			},
			"health": 1,
			"id": "CS2_231",
			"name": "Wisp",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_12.png",
			"cost": 0,
			"fr": {
				"name": "Destin : confusion"
			},
			"id": "TB_PickYourFate_12",
			"name": "Fate: Confusion",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "GVG_029.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Appel des ancêtres"
			},
			"id": "GVG_029",
			"name": "Ancestor's Call",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "TU4f_003.png",
			"cost": 2,
			"fr": {
				"name": "Moine pandashan"
			},
			"health": 2,
			"id": "TU4f_003",
			"name": "Shado-Pan Monk",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"cardImage": "TB_ClassRandom_Mage.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : mage"
			},
			"id": "TB_ClassRandom_Mage",
			"name": "Second Class: Mage",
			"playerClass": "Mage",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "NAX9_02H.png",
			"cost": 3,
			"fr": {
				"name": "Dame Blaumeux"
			},
			"health": 7,
			"id": "NAX9_02H",
			"name": "Lady Blaumeux",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Evgeniy Zagumennyy",
			"cardImage": "OG_114.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Rituel interdit"
			},
			"id": "OG_114",
			"name": "Forbidden Ritual",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "HERO_04a.png",
			"collectible": true,
			"fr": {
				"name": "Dame Liadrin"
			},
			"health": 30,
			"id": "HERO_04a",
			"name": "Lady Liadrin",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Hero_skins",
			"type": "Hero"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "OG_118.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Parjurer les ténèbres"
			},
			"id": "OG_118",
			"name": "Renounce Darkness",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_130.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Noble sacrifice"
			},
			"id": "EX1_130",
			"name": "Noble Sacrifice",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_4.png",
			"cost": 10,
			"fr": {
				"name": "Horloge de l’horreur"
			},
			"id": "LOEA16_4",
			"name": "Timepiece of Horror",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 6,
			"cardImage": "BRM_024.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Écraseur drakônide"
			},
			"health": 6,
			"id": "BRM_024",
			"name": "Drakonid Crusher",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "TU4e_002.png",
			"cost": 2,
			"fr": {
				"name": "Flammes d’Azzinoth"
			},
			"id": "TU4e_002",
			"name": "Flames of Azzinoth",
			"set": "Missions",
			"type": "Hero_power"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "AT_069.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Partenaire d’entraînement"
			},
			"health": 2,
			"id": "AT_069",
			"name": "Sparring Partner",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_062.png",
			"cost": 0,
			"fr": {
				"name": "Armor 5"
			},
			"id": "XXX_062",
			"name": "Armor 5",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_323.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Seigneur Jaraxxus"
			},
			"health": 15,
			"id": "EX1_323",
			"name": "Lord Jaraxxus",
			"playerClass": "Warlock",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "EX1_097.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Abomination"
			},
			"health": 4,
			"id": "EX1_097",
			"name": "Abomination",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 1,
			"cardImage": "EX1_009.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Poulet furieux"
			},
			"health": 1,
			"id": "EX1_009",
			"name": "Angry Chicken",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 6,
			"cardImage": "CS2_042.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Élémentaire de feu"
			},
			"health": 5,
			"id": "CS2_042",
			"name": "Fire Elemental",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_055o.png",
			"fr": {
				"name": "Surpuissant"
			},
			"id": "EX1_055o",
			"name": "Empowered",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 7,
			"cardImage": "CRED_01.png",
			"cost": 6,
			"fr": {
				"name": "Jason Chayes"
			},
			"health": 6,
			"id": "CRED_01",
			"name": "Jason Chayes",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "NAX8_02H.png",
			"cost": 1,
			"fr": {
				"name": "Moisson"
			},
			"id": "NAX8_02H",
			"name": "Harvest",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"attack": 5,
			"cardImage": "NAX7_04.png",
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Lame runique massive"
			},
			"id": "NAX7_04",
			"name": "Massive Runeblade",
			"set": "Naxx",
			"type": "Weapon"
		},
		{
			"artist": "Andrea Uderzo",
			"attack": 4,
			"cardImage": "AT_106.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Champion de la Lumière"
			},
			"health": 3,
			"id": "AT_106",
			"name": "Light's Champion",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_007.png",
			"cost": 0,
			"fr": {
				"name": "Enable for Attack"
			},
			"id": "XXX_007",
			"name": "Enable for Attack",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "NAX8_04.png",
			"cost": 3,
			"fr": {
				"name": "Guerrier tenace"
			},
			"health": 4,
			"id": "NAX8_04",
			"name": "Unrelenting Warrior",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_050.png",
			"cost": 0,
			"fr": {
				"name": "Destroy a Mana Crystal"
			},
			"id": "XXX_050",
			"name": "Destroy a Mana Crystal",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "TB_ClassRandom_Paladin.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : paladin"
			},
			"id": "TB_ClassRandom_Paladin",
			"name": "Second Class: Paladin",
			"playerClass": "Paladin",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_84.png",
			"cost": 5,
			"fr": {
				"name": "Lanceur de sorts draconien"
			},
			"health": 6,
			"id": "BRMC_84",
			"name": "Dragonkin Spellcaster",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "NAX8_05.png",
			"cost": 6,
			"fr": {
				"name": "Cavalier tenace"
			},
			"health": 6,
			"id": "NAX8_05",
			"name": "Unrelenting Rider",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Nate Bowden",
			"attack": 2,
			"cardImage": "EX1_247.png",
			"collectible": true,
			"cost": 2,
			"durability": 3,
			"fr": {
				"name": "Hache de Forge-foudre"
			},
			"id": "EX1_247",
			"name": "Stormforged Axe",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Weapon"
		},
		{
			"attack": 2,
			"cardImage": "TB_KTRAF_10.png",
			"cost": 7,
			"fr": {
				"name": "Noth le Porte-Peste"
			},
			"health": 5,
			"id": "TB_KTRAF_10",
			"name": "Noth the Plaguebringer",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_96.png",
			"cost": 3,
			"fr": {
				"name": "Juge Supérieur Mornepierre"
			},
			"health": 5,
			"id": "BRMC_96",
			"name": "High Justice Grimstone",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"cardImage": "OG_195b.png",
			"cost": 0,
			"fr": {
				"name": "Feux follets furieux"
			},
			"id": "OG_195b",
			"name": "Big Wisps",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "TB_KTRAF_11.png",
			"cost": 5,
			"fr": {
				"name": "Saphiron"
			},
			"health": 6,
			"id": "TB_KTRAF_11",
			"name": "Sapphiron",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_030a.png",
			"cost": 0,
			"fr": {
				"name": "Mode Attaque"
			},
			"id": "GVG_030a",
			"name": "Attack Mode",
			"playerClass": "Druid",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"attack": 7,
			"cardImage": "XXX_110.png",
			"cost": 0,
			"fr": {
				"name": "Yogg-Saron Test (Auto)"
			},
			"health": 5,
			"id": "XXX_110",
			"name": "Yogg-Saron Test (Auto)",
			"rarity": "Legendary",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CS2_050.png",
			"cost": 1,
			"fr": {
				"name": "Totem incendiaire"
			},
			"health": 1,
			"id": "CS2_050",
			"name": "Searing Totem",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 9,
			"cardImage": "BRM_027.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Chambellan Executus"
			},
			"health": 7,
			"id": "BRM_027",
			"name": "Majordomo Executus",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "HERO_05a.png",
			"collectible": true,
			"fr": {
				"name": "Alleria Coursevent"
			},
			"health": 30,
			"id": "HERO_05a",
			"name": "Alleria Windrunner",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Hero_skins",
			"type": "Hero"
		},
		{
			"artist": "Garrett Hanna",
			"attack": 1,
			"cardImage": "OG_113.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Conseiller de Sombre-Comté"
			},
			"health": 5,
			"id": "OG_113",
			"name": "Darkshire Councilman",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "BRMC_86e.png",
			"fr": {
				"name": "Je vous entends…"
			},
			"id": "BRMC_86e",
			"name": "I Hear You...",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMC_83.png",
			"cost": 8,
			"fr": {
				"name": "Ouvrir les portes"
			},
			"id": "BRMC_83",
			"name": "Open the Gates",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "NEW1_007.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Météores"
			},
			"id": "NEW1_007",
			"name": "Starfall",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "EX1_062.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Vieux Troublœil"
			},
			"health": 4,
			"id": "EX1_062",
			"name": "Old Murk-Eye",
			"rarity": "Legendary",
			"set": "Reward",
			"type": "Minion"
		},
		{
			"artist": "Efrem Palacios",
			"attack": 1,
			"cardImage": "EX1_366.png",
			"collectible": true,
			"cost": 3,
			"durability": 5,
			"fr": {
				"name": "Épée de justice"
			},
			"id": "EX1_366",
			"name": "Sword of Justice",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Weapon"
		},
		{
			"cardImage": "NEW1_037e.png",
			"fr": {
				"name": "Équipé"
			},
			"id": "NEW1_037e",
			"name": "Equipped",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Daria Tuzova",
			"attack": 1,
			"cardImage": "OG_123.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Déphaseur Zerus"
			},
			"health": 1,
			"id": "OG_123",
			"name": "Shifter Zerus",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA02_02.png",
			"cost": 0,
			"fr": {
				"name": "Intuition de djinn"
			},
			"id": "LOEA02_02",
			"name": "Djinn’s Intuition",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Arthur Gimaldinov",
			"attack": 2,
			"cardImage": "EX1_103.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Voyant froide-lumière"
			},
			"health": 3,
			"id": "EX1_103",
			"name": "Coldlight Seer",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA06_02.png",
			"cost": 1,
			"fr": {
				"name": "Sculpture sur pierre"
			},
			"id": "LOEA06_02",
			"name": "Stonesculpting",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "J. Meyers & T. Washington",
			"attack": 1,
			"cardImage": "OG_151.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Tentacule de N’Zoth"
			},
			"health": 1,
			"id": "OG_151",
			"name": "Tentacle of N'Zoth",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "TB_KTRAF_6.png",
			"cost": 5,
			"fr": {
				"name": "Grobbulus"
			},
			"health": 7,
			"id": "TB_KTRAF_6",
			"name": "Grobbulus",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_27.png",
			"cost": 5,
			"fr": {
				"name": "La sentinelle d’acier"
			},
			"health": 5,
			"id": "LOEA16_27",
			"name": "The Steel Sentinel",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "BRMA09_3t.png",
			"cost": 1,
			"fr": {
				"name": "Orc de l’ancienne Horde"
			},
			"health": 1,
			"id": "BRMA09_3t",
			"name": "Old Horde Orc",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "OG_080ae.png",
			"fr": {
				"name": "Chardon sanglant"
			},
			"id": "OG_080ae",
			"name": "Bloodthistle",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Ken Steacy",
			"attack": 3,
			"cardImage": "NEW1_027.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Capitaine des mers du Sud"
			},
			"health": 3,
			"id": "NEW1_027",
			"name": "Southsea Captain",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_015.png",
			"cost": 0,
			"fr": {
				"name": "Crash"
			},
			"id": "XXX_015",
			"name": "Crash",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Alex Konstad",
			"cardImage": "LOE_104.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Ensevelir"
			},
			"id": "LOE_104",
			"name": "Entomb",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Wei Wang",
			"attack": 30,
			"cardImage": "OG_173a.png",
			"cost": 9,
			"fr": {
				"name": "L’Ancien"
			},
			"health": 30,
			"id": "OG_173a",
			"name": "The Ancient One",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Greg Staples",
			"attack": 2,
			"cardImage": "OG_318t.png",
			"cost": 2,
			"fr": {
				"name": "Gnoll"
			},
			"health": 2,
			"id": "OG_318t",
			"name": "Gnoll",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_007b.png",
			"cost": 0,
			"fr": {
				"name": "Météores"
			},
			"id": "NEW1_007b",
			"name": "Starfall",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_027e.png",
			"fr": {
				"name": "Bien armé"
			},
			"id": "GVG_027e",
			"name": "Ironed Out",
			"playerClass": "Rogue",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Nate Bowden",
			"attack": 5,
			"cardImage": "FP1_026.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Embusqué anub’ar"
			},
			"health": 5,
			"id": "FP1_026",
			"name": "Anub'ar Ambusher",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Peter C. Lee",
			"attack": 5,
			"cardImage": "DS1_188.png",
			"collectible": true,
			"cost": 7,
			"durability": 2,
			"fr": {
				"name": "Arc long du gladiateur"
			},
			"id": "DS1_188",
			"name": "Gladiator's Longbow",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Weapon"
		},
		{
			"artist": "Ralph Horsley",
			"cardImage": "CS2_029.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Boule de feu"
			},
			"id": "CS2_029",
			"name": "Fireball",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA06_2.png",
			"cost": 2,
			"fr": {
				"name": "Le chambellan"
			},
			"id": "BRMA06_2",
			"name": "The Majordomo",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"attack": 0,
			"cardImage": "LOE_016t.png",
			"cost": 1,
			"fr": {
				"name": "Rocher"
			},
			"health": 6,
			"id": "LOE_016t",
			"name": "Rock",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Nutthapon Petchthai",
			"cardImage": "AT_001.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Lance de flammes"
			},
			"id": "AT_001",
			"name": "Flame Lance",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA14_4H.png",
			"cost": 2,
			"fr": {
				"name": "Activer Toxitron"
			},
			"id": "BRMA14_4H",
			"name": "Activate Toxitron",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Andrew Hou",
			"attack": 2,
			"cardImage": "OG_179.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Chauve-souris embrasée"
			},
			"health": 1,
			"id": "OG_179",
			"name": "Fiery Bat",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "TBST_002.png",
			"cost": 1,
			"fr": {
				"name": "Mage débutant"
			},
			"health": 1,
			"id": "TBST_002",
			"name": "OLDN3wb Mage",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "NAX10_01.png",
			"fr": {
				"name": "Le Recousu"
			},
			"health": 30,
			"id": "NAX10_01",
			"name": "Patchwerk",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA17_5.png",
			"cost": 2,
			"fr": {
				"name": "Séides des os"
			},
			"id": "BRMA17_5",
			"name": "Bone Minions",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 1,
			"cardImage": "EX1_509.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Mande-flots murloc"
			},
			"health": 2,
			"id": "EX1_509",
			"name": "Murloc Tidecaller",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "OG_051e.png",
			"fr": {
				"name": "Pouvoir interdit"
			},
			"id": "OG_051e",
			"name": "Forbidden Power",
			"playerClass": "Druid",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Brandon Kitkouski",
			"attack": 4,
			"cardImage": "GVG_080.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Druide du Croc"
			},
			"health": 4,
			"id": "GVG_080",
			"name": "Druid of the Fang",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_17.png",
			"cost": 10,
			"fr": {
				"name": "Statue animée"
			},
			"health": 10,
			"id": "LOEA16_17",
			"name": "Animated Statue",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Nutthapon Petchthai",
			"attack": 1,
			"cardImage": "AT_034.png",
			"collectible": true,
			"cost": 4,
			"durability": 3,
			"fr": {
				"name": "Lame empoisonnée"
			},
			"id": "AT_034",
			"name": "Poisoned Blade",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Weapon"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "EX1_533.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Détournement"
			},
			"id": "EX1_533",
			"name": "Misdirection",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_29a.png",
			"cost": 0,
			"fr": {
				"name": "Toucher"
			},
			"id": "LOEA04_29a",
			"name": "Touch It",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Brian Despain",
			"attack": 6,
			"cardImage": "CS2_200.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Ogre rochepoing"
			},
			"health": 7,
			"id": "CS2_200",
			"name": "Boulderfist Ogre",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "tt_004.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Goule mangeuse de chair"
			},
			"health": 3,
			"id": "tt_004",
			"name": "Flesheating Ghoul",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_613e.png",
			"fr": {
				"name": "Vengeance de VanCleef"
			},
			"id": "EX1_613e",
			"name": "VanCleef's Vengeance",
			"playerClass": "Rogue",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "TU4e_004.png",
			"cost": 2,
			"durability": 2,
			"fr": {
				"name": "Glaive de guerre d’Azzinoth"
			},
			"id": "TU4e_004",
			"name": "Warglaive of Azzinoth",
			"rarity": "Common",
			"set": "Missions",
			"type": "Weapon"
		},
		{
			"attack": 1,
			"cardImage": "NAX9_02.png",
			"cost": 3,
			"fr": {
				"name": "Dame Blaumeux"
			},
			"health": 7,
			"id": "NAX9_02",
			"name": "Lady Blaumeux",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 4,
			"cardImage": "AT_119.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Écumeur kvaldir"
			},
			"health": 4,
			"id": "AT_119",
			"name": "Kvaldir Raider",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_059o.png",
			"fr": {
				"name": "Pacte de sang"
			},
			"id": "CS2_059o",
			"name": "Blood Pact",
			"playerClass": "Warlock",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 5,
			"cardImage": "AT_104.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Jouteur rohart"
			},
			"health": 5,
			"id": "AT_104",
			"name": "Tuskarr Jouster",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Chris Rahn",
			"attack": 5,
			"cardImage": "AT_018.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Confesseur d’argent Paletress"
			},
			"health": 4,
			"id": "AT_018",
			"name": "Confessor Paletress",
			"playerClass": "Priest",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"cardImage": "CS1_129.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Feu intérieur"
			},
			"id": "CS1_129",
			"name": "Inner Fire",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Luke Mancini",
			"attack": 3,
			"cardImage": "LOE_079.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Élise Cherchétoile"
			},
			"health": 5,
			"id": "LOE_079",
			"name": "Elise Starseeker",
			"rarity": "Legendary",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_025.png",
			"cost": 0,
			"fr": {
				"name": "Do Nothing"
			},
			"id": "XXX_025",
			"name": "Do Nothing",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "AT_132_DRUIDe.png",
			"fr": {
				"name": "Griffes sinistres"
			},
			"id": "AT_132_DRUIDe",
			"name": "Dire Claws",
			"playerClass": "Druid",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Lars Grant-West",
			"attack": 2,
			"cardImage": "EX1_170.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Cobra empereur"
			},
			"health": 3,
			"id": "EX1_170",
			"name": "Emperor Cobra",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX6_02.png",
			"cost": 2,
			"fr": {
				"name": "Aura nécrotique"
			},
			"id": "NAX6_02",
			"name": "Necrotic Aura",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_008.png",
			"cost": 1,
			"fr": {
				"name": "Banane pourrie"
			},
			"id": "TB_008",
			"name": "Rotten Banana",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "NAX7_03.png",
			"cost": 2,
			"fr": {
				"name": "Frappe déséquilibrante"
			},
			"id": "NAX7_03",
			"name": "Unbalancing Strike",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "OG_276.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Guerriers de sang"
			},
			"id": "OG_276",
			"name": "Blood Warriors",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_010b.png",
			"cost": 0,
			"fr": {
				"name": "Forme de faucon-de-feu"
			},
			"id": "BRM_010b",
			"name": "Fire Hawk Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"attack": 6,
			"cardImage": "AT_130.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Saccageur des mers"
			},
			"health": 7,
			"id": "AT_130",
			"name": "Sea Reaver",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Ben Olson",
			"attack": 1,
			"cardImage": "EX1_522.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Assassin patient"
			},
			"health": 1,
			"id": "EX1_522",
			"name": "Patient Assassin",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "E. M. Gist",
			"attack": 2,
			"cardImage": "FP1_001.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Croq’zombie"
			},
			"health": 3,
			"id": "FP1_001",
			"name": "Zombie Chow",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 4,
			"cardImage": "AT_063t.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Écaille-d’effroi"
			},
			"health": 2,
			"id": "AT_063t",
			"name": "Dreadscale",
			"playerClass": "Hunter",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Nutthapon Petthai",
			"cardImage": "PART_002.png",
			"cost": 1,
			"fr": {
				"name": "Remontoir"
			},
			"id": "PART_002",
			"name": "Time Rewinder",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "CS1h_001.png",
			"cost": 2,
			"fr": {
				"name": "Soins inférieurs"
			},
			"id": "CS1h_001",
			"name": "Lesser Heal",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero_power"
		},
		{
			"artist": "Mark Gibbons",
			"attack": 1,
			"cardImage": "EX1_597.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maître des diablotins"
			},
			"health": 5,
			"id": "EX1_597",
			"name": "Imp Master",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_021.png",
			"cost": 0,
			"fr": {
				"name": "Restore All Health"
			},
			"id": "XXX_021",
			"name": "Restore All Health",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Joe Wilson",
			"attack": 2,
			"cardImage": "AT_077.png",
			"collectible": true,
			"cost": 2,
			"durability": 2,
			"fr": {
				"name": "Lance d’Argent"
			},
			"id": "AT_077",
			"name": "Argent Lance",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Weapon"
		},
		{
			"artist": "Massive Black",
			"attack": 7,
			"cardImage": "GVG_080t.png",
			"cost": 5,
			"fr": {
				"name": "Druide du Croc"
			},
			"health": 7,
			"id": "GVG_080t",
			"name": "Druid of the Fang",
			"playerClass": "Druid",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "GVG_085.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Ennuy-o-tron"
			},
			"health": 2,
			"id": "GVG_085",
			"name": "Annoy-o-Tron",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Tim McBurnie",
			"attack": 3,
			"cardImage": "EX1_507.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chef de guerre murloc"
			},
			"health": 3,
			"id": "EX1_507",
			"name": "Murloc Warleader",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "EX1_309.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Siphonner l’âme"
			},
			"id": "EX1_309",
			"name": "Siphon Soul",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA17_3.png",
			"fr": {
				"name": "Onyxia"
			},
			"health": 15,
			"id": "BRMA17_3",
			"name": "Onyxia",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "AT_067.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Magnataure alpha"
			},
			"health": 3,
			"id": "AT_067",
			"name": "Magnataur Alpha",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_060e.png",
			"fr": {
				"name": "Bien équipé"
			},
			"id": "GVG_060e",
			"name": "Well Equipped",
			"playerClass": "Paladin",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "OG_061.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "En chasse"
			},
			"id": "OG_061",
			"name": "On the Hunt",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA06_04.png",
			"cost": 2,
			"fr": {
				"name": "Pulsion destructrice"
			},
			"id": "LOEA06_04",
			"name": "Shattering Spree",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA14_4.png",
			"cost": 4,
			"fr": {
				"name": "Activer Toxitron"
			},
			"id": "BRMA14_4",
			"name": "Activate Toxitron",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX11_01H.png",
			"fr": {
				"name": "Grobbulus"
			},
			"health": 45,
			"id": "NAX11_01H",
			"name": "Grobbulus",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_107.png",
			"cost": 0,
			"fr": {
				"name": "Set Health to 1"
			},
			"id": "XXX_107",
			"name": "Set Health to 1",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "NEW1_029t.png",
			"fr": {
				"name": "Tuez Millhouse !"
			},
			"id": "NEW1_029t",
			"name": "Kill Millhouse!",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "EX1_093.png",
			"collectible": true,
			"cost": 4,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Défenseur d’Argus"
			},
			"health": 3,
			"id": "EX1_093",
			"name": "Defender of Argus",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Brian Huang",
			"attack": 3,
			"cardImage": "CS2_080.png",
			"collectible": true,
			"cost": 5,
			"durability": 4,
			"fr": {
				"name": "Lame d’assassin"
			},
			"id": "CS2_080",
			"name": "Assassin's Blade",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Core",
			"type": "Weapon"
		},
		{
			"cardImage": "AT_115e.png",
			"fr": {
				"name": "Entraînement à l’escrime"
			},
			"id": "AT_115e",
			"name": "Fencing Practice",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX13_02.png",
			"cost": 0,
			"fr": {
				"name": "Changement de polarité"
			},
			"id": "NAX13_02",
			"name": "Polarity Shift",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX12_02H_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Décimer"
			},
			"id": "NAX12_02H_2_TB",
			"name": "Decimate",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "NEW1_024o.png",
			"fr": {
				"name": "Ordres de Vertepeau"
			},
			"id": "NEW1_024o",
			"name": "Greenskin's Command",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "Mekka3.png",
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Encourageur 3000"
			},
			"health": 4,
			"id": "Mekka3",
			"name": "Emboldener 3000",
			"rarity": "Common",
			"set": "Promo",
			"type": "Minion"
		},
		{
			"cardImage": "OG_267e.png",
			"fr": {
				"name": "Éclat d’huile de poulpe"
			},
			"id": "OG_267e",
			"name": "Squid Oil Sheen",
			"playerClass": "Rogue",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "E.M. Gist",
			"cardImage": "GVG_017.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Appel du familier"
			},
			"id": "GVG_017",
			"name": "Call Pet",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 4,
			"cardImage": "GVG_101.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Purificateur écarlate"
			},
			"health": 3,
			"id": "GVG_101",
			"name": "Scarlet Purifier",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Greg Staples",
			"attack": 8,
			"cardImage": "EX1_298.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 8,
			"id": "EX1_298",
			"name": "Ragnaros the Firelord",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_020e.png",
			"fr": {
				"name": "Puissance draconique"
			},
			"id": "BRM_020e",
			"name": "Draconic Power",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"artist": "Todd Lockwood",
			"attack": 4,
			"cardImage": "GVG_100.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Guetteur flottant"
			},
			"health": 4,
			"id": "GVG_100",
			"name": "Floating Watcher",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Chris Rahn",
			"attack": 4,
			"cardImage": "FP1_008.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Chevalier spectral"
			},
			"health": 6,
			"id": "FP1_008",
			"name": "Spectral Knight",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "HERO_09.png",
			"collectible": true,
			"fr": {
				"name": "Anduin Wrynn"
			},
			"health": 30,
			"id": "HERO_09",
			"name": "Anduin Wrynn",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA07_18.png",
			"cost": 1,
			"fr": {
				"name": "Dynamite"
			},
			"id": "LOEA07_18",
			"name": "Dynamite",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA10_1H.png",
			"fr": {
				"name": "Aileron-Géant (héroïque)"
			},
			"health": 30,
			"id": "LOEA10_1H",
			"name": "Heroic Giantfin",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "EX1_096.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Amasseur de butin"
			},
			"health": 1,
			"id": "EX1_096",
			"name": "Loot Hoarder",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 2,
			"cardImage": "CS2_142.png",
			"collectible": true,
			"cost": 2,
			"faction": "HORDE",
			"fr": {
				"name": "Géomancien kobold"
			},
			"health": 2,
			"id": "CS2_142",
			"name": "Kobold Geomancer",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Bobby Chiu",
			"attack": 3,
			"cardImage": "BRM_019.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Client sinistre"
			},
			"health": 3,
			"id": "BRM_019",
			"name": "Grim Patron",
			"rarity": "Rare",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "NAXM_001.png",
			"cost": 4,
			"fr": {
				"name": "Nécro-chevalier"
			},
			"health": 6,
			"id": "NAXM_001",
			"name": "Necroknight",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Dave Kendall",
			"attack": 7,
			"cardImage": "CS2_186.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Golem de guerre"
			},
			"health": 7,
			"id": "CS2_186",
			"name": "War Golem",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_018.png",
			"cost": 0,
			"fr": {
				"name": "Destroy All Minions"
			},
			"id": "XXX_018",
			"name": "Destroy All Minions",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "LOEA07_12.png",
			"cost": 5,
			"fr": {
				"name": "Poursuivant terrestre"
			},
			"health": 6,
			"id": "LOEA07_12",
			"name": "Earthen Pursuer",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_003e.png",
			"fr": {
				"name": "Puissance du dragon"
			},
			"id": "BRM_003e",
			"name": "Dragon's Might",
			"playerClass": "Mage",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_339e.png",
			"fr": {
				"name": "Soumission du vassal"
			},
			"id": "OG_339e",
			"name": "Vassal's Subservience",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Peter Stapleton",
			"attack": 3,
			"cardImage": "LOE_022.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Singe féroce"
			},
			"health": 4,
			"id": "LOE_022",
			"name": "Fierce Monkey",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_165a.png",
			"cost": 0,
			"fr": {
				"name": "Forme de félin"
			},
			"id": "EX1_165a",
			"name": "Cat Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Glenn Rane",
			"attack": 9,
			"cardImage": "EX1_577.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "La Bête"
			},
			"health": 7,
			"id": "EX1_577",
			"name": "The Beast",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "AT_053.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Savoir ancestral"
			},
			"id": "AT_053",
			"name": "Ancestral Knowledge",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_101_H1.png",
			"cost": 2,
			"fr": {
				"name": "Renfort"
			},
			"id": "CS2_101_H1",
			"name": "Reinforce",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Hero_skins",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX3_03.png",
			"cost": 2,
			"fr": {
				"name": "Poison nécrotique"
			},
			"id": "NAX3_03",
			"name": "Necrotic Poison",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "EX1_360.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Humilité"
			},
			"id": "EX1_360",
			"name": "Humility",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Todd Lockwood",
			"attack": 1,
			"cardImage": "OG_320.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Drake de minuit"
			},
			"health": 4,
			"id": "OG_320",
			"name": "Midnight Drake",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Seamus Gallagher",
			"attack": 9,
			"cardImage": "AT_103.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Kraken de la mer Boréale"
			},
			"health": 7,
			"id": "AT_103",
			"name": "North Sea Kraken",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA04_1H.png",
			"fr": {
				"name": "Garr"
			},
			"health": 45,
			"id": "BRMA04_1H",
			"name": "Garr",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Andrew Robinson",
			"cardImage": "EX1_129.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Éventail de couteaux"
			},
			"id": "EX1_129",
			"name": "Fan of Knives",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_31b.png",
			"cost": 0,
			"fr": {
				"name": "Pas question !"
			},
			"id": "LOEA04_31b",
			"name": "No Way!",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "BRMA12_8t.png",
			"cost": 2,
			"fr": {
				"name": "Draconien chromatique"
			},
			"health": 3,
			"id": "BRMA12_8t",
			"name": "Chromatic Dragonkin",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 8,
			"cardImage": "EX1_560.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Nozdormu"
			},
			"health": 8,
			"id": "EX1_560",
			"name": "Nozdormu",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "NAX6_03t.png",
			"cost": 0,
			"fr": {
				"name": "Spore"
			},
			"health": 1,
			"id": "NAX6_03t",
			"name": "Spore",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "BRMA17_9.png",
			"cost": 2,
			"durability": 6,
			"fr": {
				"name": "Onyxigriffe"
			},
			"id": "BRMA17_9",
			"name": "Onyxiclaw",
			"set": "Brm",
			"type": "Weapon"
		},
		{
			"cardImage": "BRMA_01.png",
			"cost": 3,
			"fr": {
				"name": "Cœur-de-flammes"
			},
			"id": "BRMA_01",
			"name": "Flameheart",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Wei Wang",
			"attack": 7,
			"cardImage": "AT_072.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Varian Wrynn"
			},
			"health": 7,
			"id": "AT_072",
			"name": "Varian Wrynn",
			"playerClass": "Warrior",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA16_2.png",
			"cost": 1,
			"fr": {
				"name": "Écholocation"
			},
			"id": "BRMA16_2",
			"name": "Echolocate",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 4,
			"cardImage": "EX1_593.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Lamenuit"
			},
			"health": 4,
			"id": "EX1_593",
			"name": "Nightblade",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 2,
			"cardImage": "BRM_006.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chef du gang des diablotins"
			},
			"health": 4,
			"id": "BRM_006",
			"name": "Imp Gang Boss",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "LOE_019e.png",
			"fr": {
				"name": "Raptor déterré"
			},
			"id": "LOE_019e",
			"name": "Unearthed Raptor",
			"playerClass": "Rogue",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Garner",
			"attack": 6,
			"cardImage": "OG_096.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Soigneuse du Crépuscule"
			},
			"health": 5,
			"id": "OG_096",
			"name": "Twilight Darkmender",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "EX1_573.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Cénarius"
			},
			"health": 8,
			"id": "EX1_573",
			"name": "Cenarius",
			"playerClass": "Druid",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_22.png",
			"cost": 3,
			"fr": {
				"name": "Cameron Chrisman"
			},
			"health": 3,
			"id": "CRED_22",
			"name": "Cameron Chrisman",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_999_Crash.png",
			"cost": 0,
			"fr": {
				"name": "Crash the server"
			},
			"id": "XXX_999_Crash",
			"name": "Crash the server",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Milivoj Ceran",
			"attack": 6,
			"cardImage": "EX1_534.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Grande crinière des savanes"
			},
			"health": 5,
			"id": "EX1_534",
			"name": "Savannah Highmane",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Guangjian Huang",
			"attack": 0,
			"cardImage": "GVG_039.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Totem de vitalité"
			},
			"health": 3,
			"id": "GVG_039",
			"name": "Vitality Totem",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Jonathan Ryder",
			"attack": 0,
			"cardImage": "EX1_565.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Totem Langue de feu"
			},
			"health": 3,
			"id": "EX1_565",
			"name": "Flametongue Totem",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_051e.png",
			"fr": {
				"name": "Enragé"
			},
			"id": "GVG_051e",
			"name": "Enraged",
			"playerClass": "Warrior",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 1,
			"cardImage": "GVG_103.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Micro-machine"
			},
			"health": 2,
			"id": "GVG_103",
			"name": "Micro Machine",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA07_28.png",
			"cost": 1,
			"fr": {
				"name": "Réparations"
			},
			"id": "LOEA07_28",
			"name": "Repairs",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "AT_132_SHAMANb.png",
			"cost": 0,
			"fr": {
				"name": "Totem incendiaire"
			},
			"health": 1,
			"id": "AT_132_SHAMANb",
			"name": "Searing Totem",
			"playerClass": "Shaman",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Peet Cooper",
			"attack": 2,
			"cardImage": "GVG_067.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Trogg brisepierre"
			},
			"health": 3,
			"id": "GVG_067",
			"name": "Stonesplinter Trogg",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "OG_150.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Berserker aberrant"
			},
			"health": 5,
			"id": "OG_150",
			"name": "Aberrant Berserker",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "NAX8_01H.png",
			"fr": {
				"name": "Gothik le Moissonneur"
			},
			"health": 45,
			"id": "NAX8_01H",
			"name": "Gothik the Harvester",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "TU4d_003.png",
			"cost": 2,
			"fr": {
				"name": "Coup de fusil"
			},
			"id": "TU4d_003",
			"name": "Shotgun Blast",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Missions",
			"type": "Hero_power"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 0,
			"cardImage": "BRM_022.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Œuf de dragon"
			},
			"health": 2,
			"id": "BRM_022",
			"name": "Dragon Egg",
			"rarity": "Rare",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Efrem Palacios",
			"attack": 2,
			"cardImage": "EX1_613.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Edwin VanCleef"
			},
			"health": 2,
			"id": "EX1_613",
			"name": "Edwin VanCleef",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX6_01.png",
			"fr": {
				"name": "Horreb"
			},
			"health": 75,
			"id": "NAX6_01",
			"name": "Loatheb",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Glenn Rane",
			"attack": 8,
			"cardImage": "EX1_620.png",
			"collectible": true,
			"cost": 25,
			"fr": {
				"name": "Géant de lave"
			},
			"health": 8,
			"id": "EX1_620",
			"name": "Molten Giant",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX8_02H_TB.png",
			"cost": 2,
			"fr": {
				"name": "Moisson"
			},
			"id": "NAX8_02H_TB",
			"name": "Harvest",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"artist": "Phil Saunders",
			"attack": 1,
			"cardImage": "EX1_508.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Oracle sinistrécaille"
			},
			"health": 1,
			"id": "EX1_508",
			"name": "Grimscale Oracle",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA16_3.png",
			"cost": 4,
			"fr": {
				"name": "Souffle sonique"
			},
			"id": "BRMA16_3",
			"name": "Sonic Breath",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "OG_315e.png",
			"fr": {
				"name": "Reforgé"
			},
			"id": "OG_315e",
			"name": "Reforged",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_218e.png",
			"fr": {
				"name": "Enragé"
			},
			"id": "OG_218e",
			"name": "Enraged",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Michael Komarck",
			"cardImage": "EX1_606.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maîtrise du blocage"
			},
			"id": "EX1_606",
			"name": "Shield Block",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA07_02.png",
			"fr": {
				"name": "Puits de mine"
			},
			"health": 80,
			"id": "LOEA07_02",
			"name": "Mine Shaft",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"attack": 0,
			"cardImage": "TB_SPT_Minion2.png",
			"cost": 2,
			"fr": {
				"name": "Étendard de bataille"
			},
			"health": 2,
			"id": "TB_SPT_Minion2",
			"name": "Standard",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "TB_KTRAF_2s.png",
			"cost": 4,
			"fr": {
				"name": "Sire Zeliek"
			},
			"health": 5,
			"id": "TB_KTRAF_2s",
			"name": "Sir Zeliek",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Luke Mancini",
			"attack": 5,
			"cardImage": "OG_316.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Héraut Volazj"
			},
			"health": 5,
			"id": "OG_316",
			"name": "Herald Volazj",
			"playerClass": "Priest",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMA14_5H.png",
			"cost": 1,
			"fr": {
				"name": "Toxitron"
			},
			"health": 4,
			"id": "BRMA14_5H",
			"name": "Toxitron",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Ben Olson",
			"attack": 3,
			"cardImage": "GVG_108.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Recombobulateur"
			},
			"health": 2,
			"id": "GVG_108",
			"name": "Recombobulator",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA12_1.png",
			"fr": {
				"name": "Dame Naz’jar"
			},
			"health": 30,
			"id": "LOEA12_1",
			"name": "Lady Naz'jar",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Andrew Hou",
			"attack": 4,
			"cardImage": "AT_090.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Champion de Mukla"
			},
			"health": 3,
			"id": "AT_090",
			"name": "Mukla's Champion",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 2,
			"cardImage": "AT_080.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Commandant du fief"
			},
			"health": 3,
			"id": "AT_080",
			"name": "Garrison Commander",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"cardImage": "EX1_251.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Fourche d’éclairs"
			},
			"id": "EX1_251",
			"name": "Forked Lightning",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "GAME_005.png",
			"cost": 0,
			"fr": {
				"name": "La pièce"
			},
			"id": "GAME_005",
			"name": "The Coin",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Chris Rahn",
			"attack": 2,
			"cardImage": "GVG_032.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Sylvenier du Bosquet"
			},
			"health": 4,
			"id": "GVG_032",
			"name": "Grove Tender",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 3,
			"cardImage": "GVG_092.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Expérimentateur gnome"
			},
			"health": 2,
			"id": "GVG_092",
			"name": "Gnomish Experimenter",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"attack": 2,
			"cardImage": "CS2_120.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Crocilisque des rivières"
			},
			"health": 3,
			"id": "CS2_120",
			"name": "River Crocolisk",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_06b.png",
			"cost": 0,
			"fr": {
				"name": "Traverser avec précaution"
			},
			"id": "LOEA04_06b",
			"name": "Walk Across Gingerly",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Michal Ivan",
			"cardImage": "EX1_619.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Égalité"
			},
			"id": "EX1_619",
			"name": "Equality",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_316e.png",
			"fr": {
				"name": "Puissance accablante"
			},
			"id": "EX1_316e",
			"name": "Power Overwhelming",
			"playerClass": "Warlock",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA05_02h.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester serviteurs !"
			},
			"id": "LOEA05_02h",
			"name": "Trogg Hate Minions!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "TB_MechWar_Minion1.png",
			"cost": 2,
			"fr": {
				"name": "Fan de méca"
			},
			"health": 1,
			"id": "TB_MechWar_Minion1",
			"name": "Mech Fan",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_102.png",
			"cost": 2,
			"fr": {
				"name": "Gain d’armure !"
			},
			"id": "CS2_102",
			"name": "Armor Up!",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_103.png",
			"cost": 0,
			"fr": {
				"name": "Add 2 to Health"
			},
			"id": "XXX_103",
			"name": "Add 2 to Health",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Trent Kaniuga",
			"cardImage": "EX1_244.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Puissance totémique"
			},
			"id": "EX1_244",
			"name": "Totemic Might",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_18.png",
			"cost": 5,
			"fr": {
				"name": "Zinaar"
			},
			"health": 5,
			"id": "LOEA16_18",
			"name": "Zinaar",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "John Polidora",
			"attack": 5,
			"cardImage": "CS2_213.png",
			"collectible": true,
			"cost": 6,
			"faction": "HORDE",
			"fr": {
				"name": "Missilière téméraire"
			},
			"health": 2,
			"id": "CS2_213",
			"name": "Reckless Rocketeer",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_053.png",
			"cost": 0,
			"fr": {
				"name": "Armor 100"
			},
			"id": "XXX_053",
			"name": "Armor 100",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_084e.png",
			"fr": {
				"name": "Charge"
			},
			"id": "EX1_084e",
			"name": "Charge",
			"playerClass": "Warrior",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "Gonzalo Ordonez",
			"cardImage": "tt_010.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Courbe-sort"
			},
			"id": "tt_010",
			"name": "Spellbender",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Luca Zontini",
			"attack": 2,
			"cardImage": "EX1_616.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Âme en peine de mana"
			},
			"health": 2,
			"id": "EX1_616",
			"name": "Mana Wraith",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 2,
			"cardImage": "OG_249.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Tauren contaminé"
			},
			"health": 3,
			"id": "OG_249",
			"name": "Infested Tauren",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Miguel Coimbra",
			"cardImage": "EX1_624.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Flammes sacrées"
			},
			"id": "EX1_624",
			"name": "Holy Fire",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "NEW1_011.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Soldat d’élite kor’kron"
			},
			"health": 3,
			"id": "NEW1_011",
			"name": "Kor'kron Elite",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA17_5H.png",
			"cost": 2,
			"fr": {
				"name": "Séides des os"
			},
			"id": "BRMA17_5H",
			"name": "Bone Minions",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Matt Dixon",
			"attack": 0,
			"cardImage": "GVG_093.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Cible leurre"
			},
			"health": 2,
			"id": "GVG_093",
			"name": "Target Dummy",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_244e.png",
			"fr": {
				"name": "Puissance totémique"
			},
			"id": "EX1_244e",
			"name": "Totemic Might",
			"playerClass": "Shaman",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "Sean O’Daniels",
			"cardImage": "NEW1_004.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Disparition"
			},
			"id": "NEW1_004",
			"name": "Vanish",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Ian Ameling",
			"attack": 7,
			"cardImage": "EX1_249.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Baron Geddon"
			},
			"health": 5,
			"id": "EX1_249",
			"name": "Baron Geddon",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "HERO_08a.png",
			"collectible": true,
			"fr": {
				"name": "Medivh"
			},
			"health": 30,
			"id": "HERO_08a",
			"name": "Medivh",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Hero_skins",
			"type": "Hero"
		},
		{
			"cardImage": "TB_FactionWar_BoomBot.png",
			"fr": {
				"name": "TBFactionWarBoomBot"
			},
			"id": "TB_FactionWar_BoomBot",
			"name": "TBFactionWarBoomBot",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA05_3H.png",
			"cost": 3,
			"fr": {
				"name": "Bombe vivante"
			},
			"id": "BRMA05_3H",
			"name": "Living Bomb",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Dany Orizio",
			"attack": 2,
			"cardImage": "EX1_131.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Meneur défias"
			},
			"health": 2,
			"id": "EX1_131",
			"name": "Defias Ringleader",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 4,
			"cardImage": "GVG_111.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Tête de Mimiron"
			},
			"health": 5,
			"id": "GVG_111",
			"name": "Mimiron's Head",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "OG_123e.png",
			"fr": {
				"name": "Déphasé"
			},
			"id": "OG_123e",
			"name": "Shifting",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "HERO_08.png",
			"collectible": true,
			"fr": {
				"name": "Jaina Portvaillant"
			},
			"health": 30,
			"id": "HERO_08",
			"name": "Jaina Proudmoore",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero"
		},
		{
			"attack": 6,
			"cardImage": "BRMA14_7H.png",
			"cost": 3,
			"fr": {
				"name": "Électron"
			},
			"health": 6,
			"id": "BRMA14_7H",
			"name": "Electron",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "BRMA09_4t.png",
			"cost": 1,
			"fr": {
				"name": "Draconien"
			},
			"health": 1,
			"id": "BRMA09_4t",
			"name": "Dragonkin",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "XXX_097.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - Destroy Minions"
			},
			"health": 1,
			"id": "XXX_097",
			"name": "AI Buddy - Destroy Minions",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"attack": 1,
			"cardImage": "CS2_127.png",
			"collectible": true,
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Patriarche dos-argenté"
			},
			"health": 4,
			"id": "CS2_127",
			"name": "Silverback Patriarch",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "ds1_whelptoken.png",
			"cost": 1,
			"fr": {
				"name": "Dragonnet"
			},
			"health": 1,
			"id": "ds1_whelptoken",
			"name": "Whelp",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_022e.png",
			"fr": {
				"name": "Free Cards"
			},
			"id": "XXX_022e",
			"name": "Free Cards",
			"set": "Cheat",
			"type": "Enchantment"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 3,
			"cardImage": "BRM_012.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Destructeur garde du feu"
			},
			"health": 6,
			"id": "BRM_012",
			"name": "Fireguard Destroyer",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Matt Gaser",
			"cardImage": "EX1_611.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Piège givrant"
			},
			"id": "EX1_611",
			"name": "Freezing Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "DS1_178e.png",
			"fr": {
				"name": "Charge"
			},
			"id": "DS1_178e",
			"name": "Charge",
			"playerClass": "Hunter",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_005o.png",
			"fr": {
				"name": "Griffe"
			},
			"id": "CS2_005o",
			"name": "Claw",
			"playerClass": "Druid",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_223e.png",
			"fr": {
				"name": "Optimisme"
			},
			"id": "OG_223e",
			"name": "Optimism",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "E. Guiton & A. Bozonnet",
			"attack": 3,
			"cardImage": "OG_216.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Loup contaminé"
			},
			"health": 3,
			"id": "OG_216",
			"name": "Infested Wolf",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_2_Ench.png",
			"fr": {
				"name": "Pick Your Fate 2 Ench"
			},
			"id": "TB_PickYourFate_2_Ench",
			"name": "Pick Your Fate 2 Ench",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA10_3e.png",
			"fr": {
				"name": "Incubation"
			},
			"id": "BRMA10_3e",
			"name": "Incubation",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "EX1_025t.png",
			"cost": 1,
			"fr": {
				"name": "Petit dragon mécanique"
			},
			"health": 1,
			"id": "EX1_025t",
			"name": "Mechanical Dragonling",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "EX1_554t.png",
			"cost": 0,
			"fr": {
				"name": "Serpent"
			},
			"health": 1,
			"id": "EX1_554t",
			"name": "Snake",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Todd Lockwood",
			"attack": 5,
			"cardImage": "AT_118.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Grande croisée"
			},
			"health": 5,
			"id": "AT_118",
			"name": "Grand Crusader",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Sam Nielson",
			"attack": 3,
			"cardImage": "AT_076.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Chevalier murloc"
			},
			"health": 4,
			"id": "AT_076",
			"name": "Murloc Knight",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Arthur Bozonnet",
			"attack": 3,
			"cardImage": "AT_003.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Héros défunt"
			},
			"health": 2,
			"id": "AT_003",
			"name": "Fallen Hero",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "AT_071e.png",
			"fr": {
				"name": "Aubaine d’Alexstrasza"
			},
			"id": "AT_071e",
			"name": "Alexstrasza's Boon",
			"playerClass": "Warrior",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "BRM_003.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Souffle du dragon"
			},
			"id": "BRM_003",
			"name": "Dragon's Breath",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Marcelo Vignali",
			"cardImage": "AT_055.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Soins rapides"
			},
			"id": "AT_055",
			"name": "Flash Heal",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "John Polidora",
			"attack": 10,
			"cardImage": "AT_125.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Glace-Hurlante"
			},
			"health": 10,
			"id": "AT_125",
			"name": "Icehowl",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Blizzard Entertainment",
			"attack": 0,
			"cardImage": "EX1_341.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Puits de lumière"
			},
			"health": 5,
			"id": "EX1_341",
			"name": "Lightwell",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TP_Bling_HP2.png",
			"cost": 2,
			"fr": {
				"name": "Encaissement"
			},
			"id": "TP_Bling_HP2",
			"name": "Cash In",
			"playerClass": "Rogue",
			"rarity": "Unknown_6",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA09_1H.png",
			"fr": {
				"name": "Rend Main-Noire"
			},
			"health": 30,
			"id": "BRMA09_1H",
			"name": "Rend Blackhand",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "TB_PickYourFate_4.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : carte"
			},
			"id": "TB_PickYourFate_4",
			"name": "Dire Fate: Card",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "OG_104e.png",
			"fr": {
				"name": "Ombre étreinte"
			},
			"id": "OG_104e",
			"name": "Embracing the Shadow",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_023t.png",
			"fr": {
				"name": "Fusion primordiale"
			},
			"id": "OG_023t",
			"name": "Primally Infused",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Chris Seaman",
			"attack": 4,
			"cardImage": "EX1_005.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Chasseur de gros gibier"
			},
			"health": 2,
			"id": "EX1_005",
			"name": "Big Game Hunter",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_030t.png",
			"cost": 4,
			"fr": {
				"name": "Balayage de queue"
			},
			"id": "BRM_030t",
			"name": "Tail Swipe",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "TU4e_002t.png",
			"cost": 1,
			"fr": {
				"name": "Flamme d’Azzinoth"
			},
			"health": 1,
			"id": "TU4e_002t",
			"name": "Flame of Azzinoth",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"cardImage": "AT_081e.png",
			"fr": {
				"name": "Purifié"
			},
			"id": "AT_081e",
			"name": "Purified",
			"playerClass": "Paladin",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_222o.png",
			"fr": {
				"name": "Puissance de Hurlevent"
			},
			"id": "CS2_222o",
			"name": "Might of Stormwind",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "LOE_076.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Sir Finley Mrrgglton"
			},
			"health": 3,
			"id": "LOE_076",
			"name": "Sir Finley Mrrgglton",
			"rarity": "Legendary",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_084e.png",
			"fr": {
				"name": "Marque du chasseur"
			},
			"id": "CS2_084e",
			"name": "Hunter's Mark",
			"playerClass": "Hunter",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "NAX12_03.png",
			"cost": 1,
			"durability": 5,
			"fr": {
				"name": "Mâchoires"
			},
			"id": "NAX12_03",
			"name": "Jaws",
			"set": "Naxx",
			"type": "Weapon"
		},
		{
			"attack": 3,
			"cardImage": "CRED_44.png",
			"cost": 4,
			"fr": {
				"name": "Walter Kong"
			},
			"health": 2,
			"id": "CRED_44",
			"name": "Walter Kong",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Ron Spears",
			"attack": 3,
			"cardImage": "AT_111.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Vendeur de rafraîchissements"
			},
			"health": 5,
			"id": "AT_111",
			"name": "Refreshment Vendor",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "GVG_094.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Jeeves"
			},
			"health": 4,
			"id": "GVG_094",
			"name": "Jeeves",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "TB_ClassRandom_Hunter.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : chasseur"
			},
			"id": "TB_ClassRandom_Hunter",
			"name": "Second Class: Hunter",
			"playerClass": "Hunter",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_8a.png",
			"fr": {
				"name": "Putréfié"
			},
			"id": "LOEA16_8a",
			"name": "Putressed",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Cyril Van Der Haegen",
			"attack": 3,
			"cardImage": "EX1_536.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Arc cornedaigle"
			},
			"id": "EX1_536",
			"name": "Eaglehorn Bow",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Weapon"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "GVG_049.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Gahz’rilla"
			},
			"health": 9,
			"id": "GVG_049",
			"name": "Gahz'rilla",
			"playerClass": "Hunter",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "EX1_165t2.png",
			"cost": 5,
			"fr": {
				"name": "Druide de la Griffe"
			},
			"health": 6,
			"id": "EX1_165t2",
			"name": "Druid of the Claw",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"cardImage": "OG_195.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Feux follets funestes"
			},
			"id": "OG_195",
			"name": "Wisps of the Old Gods",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "CS2_057.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Trait de l’ombre"
			},
			"id": "CS2_057",
			"name": "Shadow Bolt",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "NAX15_01.png",
			"fr": {
				"name": "Kel’Thuzad"
			},
			"health": 30,
			"id": "NAX15_01",
			"name": "Kel'Thuzad",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Michael Komarck",
			"cardImage": "CS2_003.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Vision télépathique"
			},
			"id": "CS2_003",
			"name": "Mind Vision",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"attack": 3,
			"cardImage": "AT_006.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Aspirant de Dalaran"
			},
			"health": 5,
			"id": "AT_006",
			"name": "Dalaran Aspirant",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Alex Alexandrov",
			"attack": 1,
			"cardImage": "OG_174.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Traînard sans-visage"
			},
			"health": 1,
			"id": "OG_174",
			"name": "Faceless Shambler",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 3,
			"cardImage": "OG_044.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Fandral Forteramure"
			},
			"health": 5,
			"id": "OG_044",
			"name": "Fandral Staghelm",
			"playerClass": "Druid",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Greg Staples",
			"attack": 4,
			"cardImage": "AT_086.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Saboteur"
			},
			"health": 3,
			"id": "AT_086",
			"name": "Saboteur",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Dan Orizio",
			"attack": 0,
			"cardImage": "OG_200.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Auspice funeste confirmé"
			},
			"health": 7,
			"id": "OG_200",
			"name": "Validated Doomsayer",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Chippy",
			"cardImage": "EX1_363.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Bénédiction de sagesse"
			},
			"id": "EX1_363",
			"name": "Blessing of Wisdom",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Nutthapon Petthai",
			"cardImage": "PART_006.png",
			"cost": 1,
			"fr": {
				"name": "Inverseur"
			},
			"id": "PART_006",
			"name": "Reversing Switch",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_1.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : Provocation, Charge"
			},
			"id": "TB_PickYourFate_1",
			"name": "Dire Fate: Taunt and Charge",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Warren Mahy",
			"cardImage": "GVG_038.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Crépitement"
			},
			"id": "GVG_038",
			"name": "Crackle",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "NAX15_01He.png",
			"fr": {
				"name": "Intrus !"
			},
			"id": "NAX15_01He",
			"name": "Interloper!",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA04_1.png",
			"fr": {
				"name": "Garr"
			},
			"health": 30,
			"id": "BRMA04_1",
			"name": "Garr",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "TU4f_004.png",
			"cost": 3,
			"fr": {
				"name": "Héritage de l’Empereur"
			},
			"id": "TU4f_004",
			"name": "Legacy of the Emperor",
			"rarity": "Common",
			"set": "Missions",
			"type": "Spell"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 2,
			"cardImage": "GVG_002.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Souffle-neige"
			},
			"health": 3,
			"id": "GVG_002",
			"name": "Snowchugger",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_010b.png",
			"fr": {
				"name": "Choix de Velen"
			},
			"id": "GVG_010b",
			"name": "Velen's Chosen",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 5,
			"cardImage": "OG_028.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Chose venue d’en bas"
			},
			"health": 5,
			"id": "OG_028",
			"name": "Thing from Below",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Alex Garner",
			"attack": 3,
			"cardImage": "AT_011.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Championne sacrée"
			},
			"health": 5,
			"id": "AT_011",
			"name": "Holy Champion",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Samwise",
			"attack": 3,
			"cardImage": "EX1_398.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Fabricante d’armes"
			},
			"health": 3,
			"id": "EX1_398",
			"name": "Arathi Weaponsmith",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 2,
			"cardImage": "OG_218.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Brave Sabot-de-Sang"
			},
			"health": 6,
			"id": "OG_218",
			"name": "Bloodhoof Brave",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "NEW1_034.png",
			"cost": 3,
			"fr": {
				"name": "Souffleur"
			},
			"health": 2,
			"id": "NEW1_034",
			"name": "Huffer",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "GVG_056.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Mastodonte de fer"
			},
			"health": 5,
			"id": "GVG_056",
			"name": "Iron Juggernaut",
			"playerClass": "Warrior",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Hideaki Takamura",
			"cardImage": "OG_086.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Flamme interdite"
			},
			"id": "OG_086",
			"name": "Forbidden Flame",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "NAX6_04.png",
			"cost": 1,
			"fr": {
				"name": "Explosion de spores"
			},
			"id": "NAX6_04",
			"name": "Sporeburst",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"cardImage": "TU4b_001.png",
			"fr": {
				"name": "Millhouse Tempête-de-Mana"
			},
			"health": 20,
			"id": "TU4b_001",
			"name": "Millhouse Manastorm",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"attack": 1,
			"cardImage": "LOEA09_11.png",
			"cost": 3,
			"fr": {
				"name": "Naga affamé"
			},
			"health": 1,
			"id": "LOEA09_11",
			"name": "Hungry Naga",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_057a.png",
			"fr": {
				"name": "Sceau de Lumière"
			},
			"id": "GVG_057a",
			"name": "Seal of Light",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Jaemin Kim",
			"cardImage": "GVG_045.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Éruption de diablotins"
			},
			"id": "GVG_045",
			"name": "Imp-losion",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_069a.png",
			"fr": {
				"name": "Réparations !"
			},
			"id": "GVG_069a",
			"name": "Repairs!",
			"playerClass": "Priest",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "EX1_158t.png",
			"cost": 1,
			"fr": {
				"name": "Tréant"
			},
			"health": 2,
			"id": "EX1_158t",
			"name": "Treant",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Josh Harris",
			"attack": 5,
			"cardImage": "OG_272t.png",
			"cost": 4,
			"fr": {
				"name": "Destructeur sans-visage"
			},
			"health": 5,
			"id": "OG_272t",
			"name": "Faceless Destroyer",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMA13_7.png",
			"cost": 0,
			"fr": {
				"name": "Cendres tourbillonnantes"
			},
			"health": 5,
			"id": "BRMA13_7",
			"name": "Whirling Ash",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_18.png",
			"cost": 2,
			"fr": {
				"name": "Becca Abel"
			},
			"health": 2,
			"id": "CRED_18",
			"name": "Becca Abel",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Matt Cavotta",
			"attack": 2,
			"cardImage": "NEW1_019.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Jongleur de couteaux"
			},
			"health": 2,
			"id": "NEW1_019",
			"name": "Knife Juggler",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "TU4e_007.png",
			"cost": 6,
			"durability": 2,
			"fr": {
				"name": "Glaives de guerre doubles"
			},
			"id": "TU4e_007",
			"name": "Dual Warglaives",
			"rarity": "Common",
			"set": "Missions",
			"type": "Weapon"
		},
		{
			"artist": "Howard Lyon",
			"attack": 1,
			"cardImage": "CS2_171.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Sanglier brocheroc"
			},
			"health": 1,
			"id": "CS2_171",
			"name": "Stonetusk Boar",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Brom",
			"attack": 6,
			"cardImage": "EX1_383.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Tirion Fordring"
			},
			"health": 6,
			"id": "EX1_383",
			"name": "Tirion Fordring",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_549.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Courroux bestial"
			},
			"id": "EX1_549",
			"name": "Bestial Wrath",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA11_3.png",
			"cost": 0,
			"fr": {
				"name": "Montée d’adrénaline"
			},
			"id": "BRMA11_3",
			"name": "Burning Adrenaline",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Glenn Rane",
			"attack": 1,
			"cardImage": "EX1_029.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Gnome lépreux"
			},
			"health": 1,
			"id": "EX1_029",
			"name": "Leper Gnome",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX6_03te.png",
			"fr": {
				"name": "Croissance fongique"
			},
			"id": "NAX6_03te",
			"name": "Fungal Growth",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA05_02ha.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester serviteurs !"
			},
			"id": "LOEA05_02ha",
			"name": "Trogg Hate Minions!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_155a.png",
			"cost": 0,
			"fr": {
				"name": "Marque de la nature"
			},
			"id": "EX1_155a",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 6,
			"cardImage": "CRED_29.png",
			"cost": 5,
			"fr": {
				"name": "Jason MacAllister"
			},
			"health": 5,
			"id": "CRED_29",
			"name": "Jason MacAllister",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "BRMC_86.png",
			"cost": 4,
			"fr": {
				"name": "Atramédès"
			},
			"health": 8,
			"id": "BRMC_86",
			"name": "Atramedes",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "CRED_36.png",
			"cost": 6,
			"fr": {
				"name": "Mike Donais"
			},
			"health": 8,
			"id": "CRED_36",
			"name": "Mike Donais",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "EX1_028.png",
			"collectible": true,
			"cost": 5,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Tigre de Strangleronce"
			},
			"health": 5,
			"id": "EX1_028",
			"name": "Stranglethorn Tiger",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 4,
			"cardImage": "AT_121.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Favori de la foule"
			},
			"health": 4,
			"id": "AT_121",
			"name": "Crowd Favorite",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Gonzalo Ordonez",
			"attack": 3,
			"cardImage": "EX1_020.png",
			"collectible": true,
			"cost": 3,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Croisée écarlate"
			},
			"health": 1,
			"id": "EX1_020",
			"name": "Scarlet Crusader",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 1,
			"cardImage": "OG_061t.png",
			"cost": 1,
			"fr": {
				"name": "Mastiff"
			},
			"health": 1,
			"id": "OG_061t",
			"name": "Mastiff",
			"playerClass": "Hunter",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "CRED_24.png",
			"cost": 7,
			"fr": {
				"name": "Dean Ayala"
			},
			"health": 5,
			"id": "CRED_24",
			"name": "Dean Ayala",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "DREAM_02.png",
			"cost": 2,
			"fr": {
				"name": "Réveil d’Ysera"
			},
			"id": "DREAM_02",
			"name": "Ysera Awakens",
			"playerClass": "Dream",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_29.png",
			"cost": 0,
			"fr": {
				"name": "L’Œil"
			},
			"id": "LOEA04_29",
			"name": "The Eye",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Cole Eastburn",
			"attack": 1,
			"cardImage": "EX1_396.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gardien mogu’shan"
			},
			"health": 7,
			"id": "EX1_396",
			"name": "Mogu'shan Warden",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 4,
			"cardImage": "NEW1_029.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Millhouse Tempête-de-Mana"
			},
			"health": 4,
			"id": "NEW1_029",
			"name": "Millhouse Manastorm",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA01_1.png",
			"fr": {
				"name": "Coren Navrebière"
			},
			"health": 30,
			"id": "BRMA01_1",
			"name": "Coren Direbrew",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Anton Zemskov",
			"cardImage": "OG_045.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Infester"
			},
			"id": "OG_045",
			"name": "Infest",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Ben Zhang",
			"attack": 6,
			"cardImage": "LOE_003.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Adjurateur éthérien"
			},
			"health": 3,
			"id": "LOE_003",
			"name": "Ethereal Conjurer",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_410.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Heurt de bouclier"
			},
			"id": "EX1_410",
			"name": "Shield Slam",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Eva Wilderman",
			"attack": 2,
			"cardImage": "OG_281.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Annonciatrice du mal"
			},
			"health": 3,
			"id": "OG_281",
			"name": "Beckoner of Evil",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "AT_045e.png",
			"fr": {
				"name": "Brume surpuissante"
			},
			"id": "AT_045e",
			"name": "Empowering Mist",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX13_03.png",
			"cost": 2,
			"fr": {
				"name": "Supercharge"
			},
			"id": "NAX13_03",
			"name": "Supercharge",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"artist": "Andrew Hou",
			"attack": 4,
			"cardImage": "AT_063.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Gueule-d’acide"
			},
			"health": 2,
			"id": "AT_063",
			"name": "Acidmaw",
			"playerClass": "Hunter",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "NAX12_03H.png",
			"cost": 1,
			"durability": 5,
			"fr": {
				"name": "Mâchoires"
			},
			"id": "NAX12_03H",
			"name": "Jaws",
			"set": "Naxx",
			"type": "Weapon"
		},
		{
			"cardImage": "LOEA_01H.png",
			"cost": 3,
			"fr": {
				"name": "Présence menaçante"
			},
			"id": "LOEA_01H",
			"name": "Looming Presence",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "LOE_027.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Épreuve sacrée"
			},
			"id": "LOE_027",
			"name": "Sacred Trial",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_068a.png",
			"fr": {
				"name": "Magie métabolisée"
			},
			"id": "GVG_068a",
			"name": "Metabolized Magic",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Richard Wright",
			"attack": 4,
			"cardImage": "EX1_045.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Guetteur ancien"
			},
			"health": 5,
			"id": "EX1_045",
			"name": "Ancient Watcher",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "BRMC_97.png",
			"cost": 6,
			"fr": {
				"name": "Vaelastrasz"
			},
			"health": 7,
			"id": "BRMC_97",
			"name": "Vaelastrasz",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "LOEA09_6H.png",
			"cost": 2,
			"fr": {
				"name": "Archer ondulant"
			},
			"health": 2,
			"id": "LOEA09_6H",
			"name": "Slithering Archer",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "AT_016e.png",
			"fr": {
				"name": "Confus"
			},
			"id": "AT_016e",
			"name": "Confused",
			"playerClass": "Priest",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Paul Warzecha",
			"attack": 2,
			"cardImage": "EX1_390.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Guerrier tauren"
			},
			"health": 3,
			"id": "EX1_390",
			"name": "Tauren Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "EX1_283.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Élémentaire de givre"
			},
			"health": 5,
			"id": "EX1_283",
			"name": "Frost Elemental",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_057.png",
			"cost": 0,
			"fr": {
				"name": "Destroy Target Secrets"
			},
			"id": "XXX_057",
			"name": "Destroy Target Secrets",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Dave Kendall",
			"attack": 1,
			"cardImage": "EX1_007.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Acolyte de la souffrance"
			},
			"health": 3,
			"id": "EX1_007",
			"name": "Acolyte of Pain",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TU4d_001.png",
			"fr": {
				"name": "Hemet Nesingwary"
			},
			"health": 20,
			"id": "TU4d_001",
			"name": "Hemet Nesingwary",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"cardImage": "CS2_074e.png",
			"fr": {
				"name": "Poison mortel"
			},
			"id": "CS2_074e",
			"name": "Deadly Poison",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "LOEA09_7H.png",
			"cost": 0,
			"fr": {
				"name": "Chaudron"
			},
			"health": 10,
			"id": "LOEA09_7H",
			"name": "Cauldron",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Ben Olson",
			"attack": 4,
			"cardImage": "GVG_109.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mini-mage"
			},
			"health": 1,
			"id": "GVG_109",
			"name": "Mini-Mage",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "L. Lullabi & S. Srisuwan",
			"cardImage": "OG_202b.png",
			"cost": 0,
			"fr": {
				"name": "Magie de Yogg-Saron"
			},
			"id": "OG_202b",
			"name": "Yogg-Saron's Magic",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "LOE_002.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Torche oubliée"
			},
			"id": "LOE_002",
			"name": "Forgotten Torch",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "CS2_089.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Lumière sacrée"
			},
			"id": "CS2_089",
			"name": "Holy Light",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Steve Prescott",
			"attack": 3,
			"cardImage": "AT_052.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Golem totémique"
			},
			"health": 4,
			"id": "AT_052",
			"name": "Totem Golem",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "NEW1_018.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Mousse de la Voile sanglante"
			},
			"health": 3,
			"id": "NEW1_018",
			"name": "Bloodsail Raider",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA08_1H.png",
			"fr": {
				"name": "Général Drakkisath"
			},
			"health": 50,
			"id": "BRMA08_1H",
			"name": "General Drakkisath",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA16_16.png",
			"cost": 0,
			"fr": {
				"name": "Fouilles"
			},
			"id": "LOEA16_16",
			"name": "Rummage",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "GAME_003.png",
			"fr": {
				"name": "Vengeance de la pièce"
			},
			"id": "GAME_003",
			"name": "Coin's Vengeance",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "Tooth",
			"cardImage": "AT_002.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Effigie"
			},
			"id": "AT_002",
			"name": "Effigy",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "GAME_001.png",
			"fr": {
				"name": "Chance de la pièce"
			},
			"id": "GAME_001",
			"name": "Luck of the Coin",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "Michael Komarck",
			"attack": 3,
			"cardImage": "EX1_274.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Arcaniste éthérien"
			},
			"health": 3,
			"id": "EX1_274",
			"name": "Ethereal Arcanist",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA09_4.png",
			"cost": 1,
			"fr": {
				"name": "Aile noire"
			},
			"id": "BRMA09_4",
			"name": "Blackwing",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Luke Mancini",
			"attack": 2,
			"cardImage": "OG_271.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Cauchemar écailleux"
			},
			"health": 8,
			"id": "OG_271",
			"name": "Scaled Nightmare",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 1,
			"cardImage": "GVG_106.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Brik-à-bot"
			},
			"health": 5,
			"id": "GVG_106",
			"name": "Junkbot",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "TB_GP_01e_copy1.png",
			"fr": {
				"name": "Tour des Ombres donne Camouflage à mes serviteurs."
			},
			"id": "TB_GP_01e_copy1",
			"name": "Shadow Tower Give My minions Stealth",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_042.png",
			"cost": 0,
			"fr": {
				"name": "Hand to Deck"
			},
			"id": "XXX_042",
			"name": "Hand to Deck",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 5,
			"cardImage": "EX1_559.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Archimage Antonidas"
			},
			"health": 7,
			"id": "EX1_559",
			"name": "Archmage Antonidas",
			"playerClass": "Mage",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "TB_SPT_Damage.png",
			"cost": 0,
			"fr": {
				"name": "Dégâts infligés pendant l’épreuve"
			},
			"health": 1,
			"id": "TB_SPT_Damage",
			"name": "Trial Damage Dealt",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_01eh.png",
			"fr": {
				"name": "Enchantement de fuite du temple"
			},
			"id": "LOEA04_01eh",
			"name": "Temple Escape Enchant",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX3_01.png",
			"fr": {
				"name": "Maexxna"
			},
			"health": 30,
			"id": "NAX3_01",
			"name": "Maexxna",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_046.png",
			"cost": 0,
			"fr": {
				"name": "Force AI to Use Hero Power"
			},
			"id": "XXX_046",
			"name": "Force AI to Use Hero Power",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "AT_096e.png",
			"fr": {
				"name": "Remonté"
			},
			"id": "AT_096e",
			"name": "Wound Up",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Eric Braddock",
			"attack": 8,
			"cardImage": "AT_036.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Anub’arak"
			},
			"health": 4,
			"id": "AT_036",
			"name": "Anub'arak",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Vinod Rams",
			"attack": 4,
			"cardImage": "GVG_065.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Brute ogre"
			},
			"health": 4,
			"id": "GVG_065",
			"name": "Ogre Brute",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "NAX12_04e.png",
			"fr": {
				"name": "Accès de rage"
			},
			"id": "NAX12_04e",
			"name": "Enrage",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_603e.png",
			"fr": {
				"name": "Coup de fouet motivant"
			},
			"id": "EX1_603e",
			"name": "Whipped Into Shape",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA07_02h.png",
			"fr": {
				"name": "Puits de mine (héroïque)"
			},
			"health": 80,
			"id": "LOEA07_02h",
			"name": "Heroic Mine Shaft",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"attack": 1,
			"cardImage": "TU4d_002.png",
			"cost": 1,
			"fr": {
				"name": "Chasseur fou"
			},
			"health": 1,
			"id": "TU4d_002",
			"name": "Crazed Hunter",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate.png",
			"fr": {
				"name": "Choisissez votre destin - Construction"
			},
			"id": "TB_PickYourFate",
			"name": "Pick Your Fate Build Around",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Gaser",
			"attack": 5,
			"cardImage": "CS2_118.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Enragé du magma"
			},
			"health": 1,
			"id": "CS2_118",
			"name": "Magma Rager",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "TB_013_PickOnCurve.png",
			"fr": {
				"name": "Player Choice Enchant On Curve"
			},
			"id": "TB_013_PickOnCurve",
			"name": "Player Choice Enchant On Curve",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_MechWar_Boss1.png",
			"fr": {
				"name": "Ennuy-o-tron"
			},
			"health": 30,
			"id": "TB_MechWar_Boss1",
			"name": "Annoy-o-Tron",
			"rarity": "Free",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"cardImage": "EX1_604o.png",
			"fr": {
				"name": "Berserk"
			},
			"id": "EX1_604o",
			"name": "Berserk",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA04_02.png",
			"cost": 0,
			"fr": {
				"name": "Fuyez !"
			},
			"id": "LOEA04_02",
			"name": "Escape!",
			"rarity": "Free",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"attack": 3,
			"cardImage": "EX1_finkle.png",
			"cost": 2,
			"fr": {
				"name": "Finkle Einhorn"
			},
			"health": 3,
			"id": "EX1_finkle",
			"name": "Finkle Einhorn",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Alex Pascenko",
			"attack": 5,
			"cardImage": "AT_039.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Combattant sauvage"
			},
			"health": 4,
			"id": "AT_039",
			"name": "Savage Combatant",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_045.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Arme croque-roc"
			},
			"id": "CS2_045",
			"name": "Rockbiter Weapon",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 1,
			"cardImage": "EX1_008.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Écuyère d’Argent"
			},
			"health": 1,
			"id": "EX1_008",
			"name": "Argent Squire",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "TU4c_007.png",
			"cost": 6,
			"fr": {
				"name": "Grand frère de Mukla"
			},
			"health": 10,
			"id": "TU4c_007",
			"name": "Mukla's Big Brother",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "TBST_003.png",
			"cost": 1,
			"fr": {
				"name": "Soigneur débutant"
			},
			"health": 1,
			"id": "TBST_003",
			"name": "OLDN3wb Healer",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 2,
			"cardImage": "EX1_166.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gardien du bosquet"
			},
			"health": 2,
			"id": "EX1_166",
			"name": "Keeper of the Grove",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Tom Baxa",
			"cardImage": "EX1_537.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Tir explosif"
			},
			"id": "EX1_537",
			"name": "Explosive Shot",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "LOEA09_7.png",
			"cost": 0,
			"fr": {
				"name": "Chaudron"
			},
			"health": 5,
			"id": "LOEA09_7",
			"name": "Cauldron",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "TB_MechWar_CommonCards.png",
			"fr": {
				"name": "TBMechWarCommonCards"
			},
			"id": "TB_MechWar_CommonCards",
			"name": "TBMechWarCommonCards",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Samwise Didier",
			"attack": 5,
			"cardImage": "PRO_001.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Elite Tauren Chieftain"
			},
			"health": 5,
			"id": "PRO_001",
			"name": "Elite Tauren Chieftain",
			"rarity": "Legendary",
			"set": "Promo",
			"type": "Minion"
		},
		{
			"cardImage": "OG_070e.png",
			"fr": {
				"name": "Lames assoiffées"
			},
			"id": "OG_070e",
			"name": "Thirsty Blades",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "CRED_26.png",
			"cost": 3,
			"fr": {
				"name": "Eric Del Priore"
			},
			"health": 6,
			"id": "CRED_26",
			"name": "Eric Del Priore",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "NAX13_02e.png",
			"fr": {
				"name": "Polarité"
			},
			"id": "NAX13_02e",
			"name": "Polarity",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"attack": 8,
			"cardImage": "BRMA14_9H.png",
			"cost": 5,
			"fr": {
				"name": "Magmatron"
			},
			"health": 8,
			"id": "BRMA14_9H",
			"name": "Magmatron",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Simon Bisley",
			"attack": 2,
			"cardImage": "EX1_604.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Berserker écumant"
			},
			"health": 4,
			"id": "EX1_604",
			"name": "Frothing Berserker",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA13_2H.png",
			"cost": 1,
			"fr": {
				"name": "Forme véritable"
			},
			"id": "BRMA13_2H",
			"name": "True Form",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_PickYourFate_3.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : Furie des vents"
			},
			"id": "TB_PickYourFate_3",
			"name": "Dire Fate: Windfury",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_4H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : vert"
			},
			"id": "BRMA12_4H",
			"name": "Brood Affliction: Green",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA08_2.png",
			"cost": 0,
			"fr": {
				"name": "Regard intense"
			},
			"id": "BRMA08_2",
			"name": "Intense Gaze",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_248.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Esprit farouche"
			},
			"id": "EX1_248",
			"name": "Feral Spirit",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpBossSpell_3.png",
			"cost": 0,
			"fr": {
				"name": "Liquide de refroidissement"
			},
			"id": "TB_CoOpBossSpell_3",
			"name": "Release Coolant",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "LOEA07_25.png",
			"cost": 1,
			"fr": {
				"name": "Perroquet mécanique"
			},
			"health": 6,
			"id": "LOEA07_25",
			"name": "Mechanical Parrot",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "EX1_323w.png",
			"cost": 3,
			"durability": 8,
			"fr": {
				"name": "Fureur sanguinaire"
			},
			"id": "EX1_323w",
			"name": "Blood Fury",
			"playerClass": "Warlock",
			"set": "Expert1",
			"type": "Weapon"
		},
		{
			"artist": "Chris Seaman",
			"attack": 4,
			"cardImage": "GVG_078.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Yéti mécanique"
			},
			"health": 5,
			"id": "GVG_078",
			"name": "Mechanical Yeti",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "NAX11_02H.png",
			"cost": 0,
			"fr": {
				"name": "Nuage empoisonné"
			},
			"id": "NAX11_02H",
			"name": "Poison Cloud",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "CS2_038.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Esprit ancestral"
			},
			"id": "CS2_038",
			"name": "Ancestral Spirit",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "FP1_006.png",
			"cost": 1,
			"fr": {
				"name": "Destrier de la mort"
			},
			"health": 3,
			"id": "FP1_006",
			"name": "Deathcharger",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Maurico Herrera",
			"cardImage": "OG_206.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Coup de tonnerre"
			},
			"id": "OG_206",
			"name": "Stormcrack",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "LOE_115b.png",
			"cost": 0,
			"fr": {
				"name": "Idole corbeau"
			},
			"id": "LOE_115b",
			"name": "Raven Idol",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Sean O'Daniels",
			"cardImage": "GVG_003.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Portail instable"
			},
			"id": "GVG_003",
			"name": "Unstable Portal",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "DS1_188e.png",
			"fr": {
				"name": "Enchantement d’Arc long du gladiateur"
			},
			"id": "DS1_188e",
			"name": "Gladiator's Longbow enchantment",
			"playerClass": "Hunter",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_069e.png",
			"fr": {
				"name": "Entraînement terminé"
			},
			"id": "AT_069e",
			"name": "Training Complete",
			"playerClass": "Warrior",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_010.png",
			"cost": 0,
			"fr": {
				"name": "Silence - debug"
			},
			"id": "XXX_010",
			"name": "Silence - debug",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "EX1_279.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Explosion pyrotechnique"
			},
			"id": "EX1_279",
			"name": "Pyroblast",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_2H.png",
			"cost": 0,
			"fr": {
				"name": "Bâton de l’Origine"
			},
			"id": "LOEA16_2H",
			"name": "Staff of Origination",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Michael Sutfin",
			"cardImage": "CS2_072.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Attaque sournoise"
			},
			"id": "CS2_072",
			"name": "Backstab",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Slawomir Maniak",
			"cardImage": "LOE_110t.png",
			"cost": 0,
			"fr": {
				"name": "Malédiction ancestrale"
			},
			"id": "LOE_110t",
			"name": "Ancient Curse",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "CS2_046.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Furie sanguinaire"
			},
			"id": "CS2_046",
			"name": "Bloodlust",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA05_3.png",
			"cost": 4,
			"fr": {
				"name": "Bombe vivante"
			},
			"id": "BRMA05_3",
			"name": "Living Bomb",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "NAX2_05.png",
			"cost": 3,
			"fr": {
				"name": "Adorateur"
			},
			"health": 4,
			"id": "NAX2_05",
			"name": "Worshipper",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA07_03.png",
			"cost": 0,
			"fr": {
				"name": "Fuir la mine !"
			},
			"id": "LOEA07_03",
			"name": "Flee the Mine!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX9_01H.png",
			"fr": {
				"name": "Baron Vaillefendre"
			},
			"health": 14,
			"id": "NAX9_01H",
			"name": "Baron Rivendare",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "CS2_102_H1.png",
			"cost": 2,
			"fr": {
				"name": "Gain d’armure !"
			},
			"id": "CS2_102_H1",
			"name": "Armor Up!",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Hero_skins",
			"type": "Hero_power"
		},
		{
			"artist": "Todd Lockwood",
			"attack": 6,
			"cardImage": "BRM_031.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Chromaggus"
			},
			"health": 8,
			"id": "BRM_031",
			"name": "Chromaggus",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Lucas Graciano",
			"cardImage": "EX1_349.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Faveur divine"
			},
			"id": "EX1_349",
			"name": "Divine Favor",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "LOE_008.png",
			"cost": 1,
			"fr": {
				"name": "Œil d’Hakkar"
			},
			"id": "LOE_008",
			"name": "Eye of Hakkar",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "EX1_116t.png",
			"cost": 1,
			"fr": {
				"name": "Dragonnet"
			},
			"health": 1,
			"id": "EX1_116t",
			"name": "Whelp",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "LOEA09_4H.png",
			"cost": 1,
			"durability": 2,
			"fr": {
				"name": "Lance rare"
			},
			"id": "LOEA09_4H",
			"name": "Rare Spear",
			"set": "Loe",
			"type": "Weapon"
		},
		{
			"artist": "Warren Mahy",
			"attack": 2,
			"cardImage": "GVG_075.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Canon du navire"
			},
			"health": 3,
			"id": "GVG_075",
			"name": "Ship's Cannon",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "NAX1_04.png",
			"cost": 2,
			"fr": {
				"name": "Grouillement"
			},
			"id": "NAX1_04",
			"name": "Skitter",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA02_1.png",
			"fr": {
				"name": "Juge Supérieur Mornepierre"
			},
			"health": 30,
			"id": "BRMA02_1",
			"name": "High Justice Grimstone",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "GVG_005.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Écho de Medivh"
			},
			"id": "GVG_005",
			"name": "Echo of Medivh",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "CS2_101t.png",
			"cost": 1,
			"fr": {
				"name": "Recrue de la Main d’argent"
			},
			"health": 1,
			"id": "CS2_101t",
			"name": "Silver Hand Recruit",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "BRMC_98e.png",
			"fr": {
				"name": "Soif de dragon"
			},
			"id": "BRMC_98e",
			"name": "Dragonlust",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "NAXM_002.png",
			"cost": 3,
			"fr": {
				"name": "Forgeron squelettique"
			},
			"health": 3,
			"id": "NAXM_002",
			"name": "Skeletal Smith",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_22.png",
			"cost": 5,
			"fr": {
				"name": "Archaedas"
			},
			"health": 5,
			"id": "LOEA16_22",
			"name": "Archaedas",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "GVG_037.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Zap-o-matic tournoyant"
			},
			"health": 2,
			"id": "GVG_037",
			"name": "Whirling Zap-o-matic",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_28a.png",
			"cost": 0,
			"fr": {
				"name": "Boire à grands traits"
			},
			"id": "LOEA04_28a",
			"name": "Drink Deeply",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_059e.png",
			"fr": {
				"name": "Des expériences !"
			},
			"id": "EX1_059e",
			"name": "Experiments!",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 6,
			"cardImage": "EX1_tk34.png",
			"cost": 6,
			"fr": {
				"name": "Infernal"
			},
			"health": 6,
			"id": "EX1_tk34",
			"name": "Infernal",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "NAX4_03H.png",
			"cost": 5,
			"fr": {
				"name": "Squelette"
			},
			"health": 5,
			"id": "NAX4_03H",
			"name": "Skeleton",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA02_06.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : plus de Vœux"
			},
			"id": "LOEA02_06",
			"name": "Wish for More Wishes",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "AT_074.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Sceau des champions"
			},
			"id": "AT_074",
			"name": "Seal of Champions",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_10_Ench.png",
			"fr": {
				"name": "Destin"
			},
			"id": "TB_PickYourFate_10_Ench",
			"name": "Fate",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_021e.png",
			"fr": {
				"name": "Étreinte de Mal’Ganis"
			},
			"id": "GVG_021e",
			"name": "Grasp of Mal'Ganis",
			"playerClass": "Warlock",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA09_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Ouvrir les portes"
			},
			"id": "BRMA09_2_TB",
			"name": "Open the Gates",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_304e.png",
			"fr": {
				"name": "Consumer"
			},
			"id": "EX1_304e",
			"name": "Consume",
			"playerClass": "Warlock",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 6,
			"cardImage": "OG_318.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Lardeur, Perte d’Elwynn"
			},
			"health": 6,
			"id": "OG_318",
			"name": "Hogger, Doom of Elwynn",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"cardImage": "AT_033.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Larcin"
			},
			"id": "AT_033",
			"name": "Burgle",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 5,
			"cardImage": "GVG_115.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Toshley"
			},
			"health": 7,
			"id": "GVG_115",
			"name": "Toshley",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "AT_075e.png",
			"fr": {
				"name": "Puissance du valet d’écurie"
			},
			"id": "AT_075e",
			"name": "Might of the Hostler",
			"playerClass": "Paladin",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "George Davis",
			"attack": 2,
			"cardImage": "LOE_023.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Sinistre colporteur"
			},
			"health": 2,
			"id": "LOE_023",
			"name": "Dark Peddler",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Ittoku",
			"cardImage": "EX1_136.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Rédemption"
			},
			"id": "EX1_136",
			"name": "Redemption",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Wei Wang",
			"attack": 2,
			"cardImage": "EX1_084.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Officier chanteguerre"
			},
			"health": 3,
			"id": "EX1_084",
			"name": "Warsong Commander",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA12_2.png",
			"cost": 0,
			"fr": {
				"name": "Perle des marées"
			},
			"id": "LOEA12_2",
			"name": "Pearl of the Tides",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Froilan Gardner",
			"attack": 2,
			"cardImage": "AT_085.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Damoiselle du Lac"
			},
			"health": 6,
			"id": "AT_085",
			"name": "Maiden of the Lake",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Samwise",
			"attack": 8,
			"cardImage": "EX1_105.png",
			"collectible": true,
			"cost": 12,
			"fr": {
				"name": "Géant des montagnes"
			},
			"health": 8,
			"id": "EX1_105",
			"name": "Mountain Giant",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Ron Spears",
			"attack": 2,
			"cardImage": "EX1_076.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Minuscule invocatrice"
			},
			"health": 2,
			"id": "EX1_076",
			"name": "Pint-Sized Summoner",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA14_1.png",
			"fr": {
				"name": "La sentinelle d’acier"
			},
			"health": 30,
			"id": "LOEA14_1",
			"name": "The Steel Sentinel",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Laurel D. Austin",
			"attack": 2,
			"cardImage": "GVG_104.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Hobgobelin"
			},
			"health": 3,
			"id": "GVG_104",
			"name": "Hobgoblin",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_031.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Javelot de glace"
			},
			"id": "CS2_031",
			"name": "Ice Lance",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "LOEA09_6.png",
			"cost": 2,
			"fr": {
				"name": "Archer ondulant"
			},
			"health": 2,
			"id": "LOEA09_6",
			"name": "Slithering Archer",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_017o.png",
			"fr": {
				"name": "Griffes"
			},
			"id": "CS2_017o",
			"name": "Claws",
			"playerClass": "Druid",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "EX1_614t.png",
			"cost": 1,
			"fr": {
				"name": "Flamme d’Azzinoth"
			},
			"health": 1,
			"id": "EX1_614t",
			"name": "Flame of Azzinoth",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 4,
			"cardImage": "LOE_053.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Djinn des zéphirs"
			},
			"health": 6,
			"id": "LOE_053",
			"name": "Djinni of Zephyrs",
			"rarity": "Epic",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "BRM_033.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Technicienne de l’Aile noire"
			},
			"health": 4,
			"id": "BRM_033",
			"name": "Blackwing Technician",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "OG_118f.png",
			"fr": {
				"name": "Nouvelle vocation"
			},
			"id": "OG_118f",
			"name": "New Calling",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA11_2.png",
			"cost": 0,
			"fr": {
				"name": "Essence des Rouges"
			},
			"id": "BRMA11_2",
			"name": "Essence of the Red",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"attack": 3,
			"cardImage": "BRMA03_3H.png",
			"cost": 2,
			"fr": {
				"name": "Moira Barbe-de-Bronze"
			},
			"health": 1,
			"id": "BRMA03_3H",
			"name": "Moira Bronzebeard",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"cardImage": "AT_022.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Poing de Jaraxxus"
			},
			"id": "AT_022",
			"name": "Fist of Jaraxxus",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Attila Adorjany",
			"attack": 2,
			"cardImage": "EX1_044.png",
			"collectible": true,
			"cost": 3,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Aventurier en pleine quête"
			},
			"health": 2,
			"id": "EX1_044",
			"name": "Questing Adventurer",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA02_2.png",
			"cost": 1,
			"fr": {
				"name": "Foule moqueuse"
			},
			"id": "BRMA02_2",
			"name": "Jeering Crowd",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA01_2H_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Pioche forcée !"
			},
			"id": "BRMA01_2H_2_TB",
			"name": "Pile On!!!",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "AT_101.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Combattante de la fosse"
			},
			"health": 6,
			"id": "AT_101",
			"name": "Pit Fighter",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Trevor Jacobs",
			"attack": 2,
			"cardImage": "CS2_203.png",
			"collectible": true,
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Chouette bec-de-fer"
			},
			"health": 1,
			"id": "CS2_203",
			"name": "Ironbeak Owl",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Benjamin Zhang",
			"cardImage": "DS1_183.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Flèches multiples"
			},
			"id": "DS1_183",
			"name": "Multi-Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"attack": 4,
			"cardImage": "OG_328.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Maître de l’évolution"
			},
			"health": 5,
			"id": "OG_328",
			"name": "Master of Evolution",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "OG_321e.png",
			"fr": {
				"name": "Puissance de la foi"
			},
			"id": "OG_321e",
			"name": "Power of Faith",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_619e.png",
			"fr": {
				"name": "Égalité"
			},
			"id": "EX1_619e",
			"name": "Equality",
			"playerClass": "Paladin",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA15_2H.png",
			"cost": 0,
			"fr": {
				"name": "L’alchimiste"
			},
			"id": "BRMA15_2H",
			"name": "The Alchemist",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "AT_065e.png",
			"fr": {
				"name": "Défenseur du roi"
			},
			"id": "AT_065e",
			"name": "King's Defender",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Markus Erdt",
			"cardImage": "EX1_158.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Âme de la forêt"
			},
			"id": "EX1_158",
			"name": "Soul of the Forest",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_509e.png",
			"fr": {
				"name": "Blarghghl"
			},
			"id": "EX1_509e",
			"name": "Blarghghl",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Svetlin Velinov",
			"attack": 8,
			"cardImage": "EX1_586.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Géant des mers"
			},
			"health": 8,
			"id": "EX1_586",
			"name": "Sea Giant",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA06_1.png",
			"fr": {
				"name": "Chambellan Executus"
			},
			"health": 30,
			"id": "BRMA06_1",
			"name": "Majordomo Executus",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Tooth",
			"attack": 1,
			"cardImage": "GVG_063.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Bolvar Fordragon"
			},
			"health": 7,
			"id": "GVG_063",
			"name": "Bolvar Fordragon",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA07_20.png",
			"cost": 1,
			"fr": {
				"name": "Boum !"
			},
			"id": "LOEA07_20",
			"name": "Boom!",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Carl Frank",
			"cardImage": "EX1_295.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Bloc de glace"
			},
			"id": "EX1_295",
			"name": "Ice Block",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "J. Meyers & T. Washington",
			"attack": 3,
			"cardImage": "OG_303.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Ensorceleuse du culte"
			},
			"health": 2,
			"id": "OG_303",
			"name": "Cult Sorcerer",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "GVG_089.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Illuminatrice"
			},
			"health": 4,
			"id": "GVG_089",
			"name": "Illuminator",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "XXX_098.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - No Deck/Hand"
			},
			"health": 1,
			"id": "XXX_098",
			"name": "AI Buddy - No Deck/Hand",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"artist": "A. J. Nazzaro",
			"attack": 4,
			"cardImage": "OG_031a.png",
			"cost": 3,
			"fr": {
				"name": "Élémentaire du Crépuscule"
			},
			"health": 2,
			"id": "OG_031a",
			"name": "Twilight Elemental",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_049.png",
			"cost": 2,
			"fr": {
				"name": "Appel totémique"
			},
			"id": "CS2_049",
			"name": "Totemic Call",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero_power"
		},
		{
			"artist": "Jim Nelson",
			"attack": 5,
			"cardImage": "OG_152.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Faucon-dragon difforme"
			},
			"health": 5,
			"id": "OG_152",
			"name": "Grotesque Dragonhawk",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 3,
			"cardImage": "GVG_107.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mécano-amplificateur"
			},
			"health": 2,
			"id": "GVG_107",
			"name": "Enhance-o Mechano",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "Mekka2.png",
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Robot réparateur"
			},
			"health": 3,
			"id": "Mekka2",
			"name": "Repair Bot",
			"rarity": "Common",
			"set": "Promo",
			"type": "Minion"
		},
		{
			"cardImage": "NAX4_05.png",
			"cost": 6,
			"fr": {
				"name": "Peste"
			},
			"id": "NAX4_05",
			"name": "Plague",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"cardImage": "TB_FactionWar_Hero_Annoy.png",
			"fr": {
				"name": "Ennuy-o-tron premier"
			},
			"health": 30,
			"id": "TB_FactionWar_Hero_Annoy",
			"name": "Annoy-o-Tron Prime",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"artist": "Michael Sutfin",
			"cardImage": "GVG_052.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Écraser"
			},
			"id": "GVG_052",
			"name": "Crush",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "PART_007e.png",
			"fr": {
				"name": "Lames tourbillonnantes"
			},
			"id": "PART_007e",
			"name": "Whirling Blades",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "J. Meyers & A. Bozonnet",
			"attack": 4,
			"cardImage": "OG_291.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Exhalombre"
			},
			"health": 4,
			"id": "OG_291",
			"name": "Shadowcaster",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 6,
			"cardImage": "GVG_113.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Faucheur 4000"
			},
			"health": 9,
			"id": "GVG_113",
			"name": "Foe Reaper 4000",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "TB_011.png",
			"cost": 0,
			"fr": {
				"name": "Pièce ternie"
			},
			"id": "TB_011",
			"name": "Tarnished Coin",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Howard Lyon",
			"attack": 2,
			"cardImage": "AT_115.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maître d’escrime"
			},
			"health": 2,
			"id": "AT_115",
			"name": "Fencing Coach",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_038o.png",
			"fr": {
				"name": "Croissance"
			},
			"id": "NEW1_038o",
			"name": "Growth",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_022b.png",
			"fr": {
				"name": "Huile d’affûtage de Bricoleur"
			},
			"id": "GVG_022b",
			"name": "Tinker's Sharpsword Oil",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_FactionWar_Boss_RagFirst.png",
			"cost": 2,
			"fr": {
				"name": "Le chambellan"
			},
			"id": "TB_FactionWar_Boss_RagFirst",
			"name": "The Majordomo",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_022.png",
			"cost": 0,
			"fr": {
				"name": "Free Cards"
			},
			"id": "XXX_022",
			"name": "Free Cards",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "TB_007.png",
			"cost": 1,
			"fr": {
				"name": "Banane déviante"
			},
			"id": "TB_007",
			"name": "Deviate Banana",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_034_H1_AT_132.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu rang 2"
			},
			"id": "CS2_034_H1_AT_132",
			"name": "Fireblast Rank 2",
			"playerClass": "Mage",
			"set": "Hero_skins",
			"type": "Hero_power"
		},
		{
			"artist": "Gonzalo Ordonez",
			"cardImage": "EX1_379.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Repentir"
			},
			"id": "EX1_379",
			"name": "Repentance",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Grace Liu",
			"attack": 1,
			"cardImage": "OG_051.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Ancien frappé d’interdit"
			},
			"health": 1,
			"id": "OG_051",
			"name": "Forbidden Ancient",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 7,
			"cardImage": "OG_339.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Sectateur Skeram"
			},
			"health": 6,
			"id": "OG_339",
			"name": "Skeram Cultist",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "TB_Superfriends001e.png",
			"fr": {
				"name": "Facilité"
			},
			"id": "TB_Superfriends001e",
			"name": "Facilitated",
			"playerClass": "Rogue",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX15_04a.png",
			"fr": {
				"name": "Esclave de Kel’Thuzad"
			},
			"id": "NAX15_04a",
			"name": "Slave of Kel'Thuzad",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOE_061e.png",
			"fr": {
				"name": "Puissance des titans"
			},
			"id": "LOE_061e",
			"name": "Power of the Titans",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA17_4.png",
			"cost": 2,
			"fr": {
				"name": "LAVE !"
			},
			"id": "BRMA17_4",
			"name": "LAVA!",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"attack": 9,
			"cardImage": "CRED_17.png",
			"cost": 9,
			"fr": {
				"name": "Rob Pardo"
			},
			"health": 9,
			"id": "CRED_17",
			"name": "Rob Pardo",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Genevieve Tsai & Nutchapol ",
			"attack": 2,
			"cardImage": "OG_082.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Kobold évolué"
			},
			"health": 2,
			"id": "OG_082",
			"name": "Evolved Kobold",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_565o.png",
			"fr": {
				"name": "Langue de feu"
			},
			"id": "EX1_565o",
			"name": "Flametongue",
			"playerClass": "Shaman",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "TB_SPT_Minion3.png",
			"cost": 3,
			"fr": {
				"name": "Épéiste"
			},
			"health": 1,
			"id": "TB_SPT_Minion3",
			"name": "Swordsman",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 4,
			"cardImage": "OG_323.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Amasseur vicié"
			},
			"health": 2,
			"id": "OG_323",
			"name": "Polluted Hoarder",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Monica Langlois",
			"attack": 3,
			"cardImage": "CS1_069.png",
			"collectible": true,
			"cost": 5,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Rampant des tourbières"
			},
			"health": 6,
			"id": "CS1_069",
			"name": "Fen Creeper",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_111.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - All Charge, All Windfury!"
			},
			"id": "XXX_111",
			"name": "AI Buddy - All Charge, All Windfury!",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Bernie Kang",
			"attack": 0,
			"cardImage": "CS2_059.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Diablotin de sang"
			},
			"health": 1,
			"id": "CS2_059",
			"name": "Blood Imp",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TB_GreatCurves_01.png",
			"fr": {
				"name": "TB_ClockworkCardDealer"
			},
			"id": "TB_GreatCurves_01",
			"name": "TB_ClockworkCardDealer",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 2,
			"cardImage": "AT_075.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maître des chevaux de guerre"
			},
			"health": 4,
			"id": "AT_075",
			"name": "Warhorse Trainer",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_399e.png",
			"fr": {
				"name": "Berserker"
			},
			"id": "EX1_399e",
			"name": "Berserking",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_281e.png",
			"fr": {
				"name": "Dévotion du fanatique"
			},
			"id": "OG_281e",
			"name": "Fanatic Devotion",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_320.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Plaie funeste"
			},
			"id": "EX1_320",
			"name": "Bane of Doom",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Wayne Reynolds",
			"cardImage": "EX1_407.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Baston"
			},
			"id": "EX1_407",
			"name": "Brawl",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "James Zhang",
			"cardImage": "CS2_077.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Sprint"
			},
			"id": "CS2_077",
			"name": "Sprint",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_21H.png",
			"cost": 10,
			"fr": {
				"name": "Chef Scarvash"
			},
			"health": 10,
			"id": "LOEA16_21H",
			"name": "Chieftain Scarvash",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA15_3.png",
			"cost": 2,
			"fr": {
				"name": "Libérer les aberrations"
			},
			"id": "BRMA15_3",
			"name": "Release the Aberrations!",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_024e.png",
			"fr": {
				"name": "Grandes griffes"
			},
			"id": "BRM_024e",
			"name": "Large Talons",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_99.png",
			"cost": 5,
			"fr": {
				"name": "Garr"
			},
			"health": 8,
			"id": "BRMC_99",
			"name": "Garr",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "E.M. Gist",
			"attack": 1,
			"cardImage": "NEW1_037.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Maître fabricant d’épées"
			},
			"health": 3,
			"id": "NEW1_037",
			"name": "Master Swordsmith",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_014te.png",
			"fr": {
				"name": "Banane"
			},
			"id": "EX1_014te",
			"name": "Bananas",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 9,
			"cardImage": "GVG_116.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Mekgénieur Thermojoncteur"
			},
			"health": 7,
			"id": "GVG_116",
			"name": "Mekgineer Thermaplugg",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_411e2.png",
			"fr": {
				"name": "Affûtage nécessaire"
			},
			"id": "EX1_411e2",
			"name": "Needs Sharpening",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX11_01.png",
			"fr": {
				"name": "Grobbulus"
			},
			"health": 30,
			"id": "NAX11_01",
			"name": "Grobbulus",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "EX1_tk11.png",
			"cost": 2,
			"fr": {
				"name": "Esprit du loup"
			},
			"health": 3,
			"id": "EX1_tk11",
			"name": "Spirit Wolf",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NEW1_040t.png",
			"cost": 2,
			"fr": {
				"name": "Gnoll"
			},
			"health": 2,
			"id": "NEW1_040t",
			"name": "Gnoll",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TB_DecreasingCardCost.png",
			"fr": {
				"name": "TB_DecreasingCardCost"
			},
			"id": "TB_DecreasingCardCost",
			"name": "TB_DecreasingCardCost",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA14_10H_TB.png",
			"cost": 2,
			"fr": {
				"name": "Activation !"
			},
			"id": "BRMA14_10H_TB",
			"name": "Activate!",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_PickYourFate_2nd.png",
			"fr": {
				"name": "Choisissez votre destin : aléatoire 2"
			},
			"id": "TB_PickYourFate_2nd",
			"name": "Pick Your Fate Randon 2nd",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Dany Orizio",
			"attack": 3,
			"cardImage": "OG_149.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Goule ravageuse"
			},
			"health": 3,
			"id": "OG_149",
			"name": "Ravaging Ghoul",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "LOEA09_12.png",
			"cost": 4,
			"fr": {
				"name": "Naga affamé"
			},
			"health": 1,
			"id": "LOEA09_12",
			"name": "Hungry Naga",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Blizzard Cinematics",
			"attack": 1,
			"cardImage": "NEW1_012.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Wyrm de mana"
			},
			"health": 3,
			"id": "NEW1_012",
			"name": "Mana Wyrm",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_104.png",
			"cost": 0,
			"fr": {
				"name": "Add 4 to Health."
			},
			"id": "XXX_104",
			"name": "Add 4 to Health.",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Kerem Beyit",
			"cardImage": "GVG_019.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Cœur de démon"
			},
			"id": "GVG_019",
			"name": "Demonheart",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "XXX_099.png",
			"cost": 0,
			"fr": {
				"name": "AI Helper Buddy"
			},
			"health": 1,
			"id": "XXX_099",
			"name": "AI Helper Buddy",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"artist": "Tyson Murphy",
			"attack": 4,
			"cardImage": "LOE_011.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Reno Jackson"
			},
			"health": 6,
			"id": "LOE_011",
			"name": "Reno Jackson",
			"rarity": "Legendary",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Phroilan Gardner",
			"cardImage": "CS2_114.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Enchaînement"
			},
			"id": "CS2_114",
			"name": "Cleave",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "J. Meyers & Nutchapol ",
			"attack": 3,
			"cardImage": "OG_026.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Sentinelle éternelle"
			},
			"health": 2,
			"id": "OG_026",
			"name": "Eternal Sentinel",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "EX1_538t.png",
			"cost": 1,
			"fr": {
				"name": "Chien"
			},
			"health": 1,
			"id": "EX1_538t",
			"name": "Hound",
			"playerClass": "Hunter",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 2,
			"cardImage": "EX1_050.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Oracle froide-lumière"
			},
			"health": 2,
			"id": "EX1_050",
			"name": "Coldlight Oracle",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "DS1_233.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Attaque mentale"
			},
			"id": "DS1_233",
			"name": "Mind Blast",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"attack": 5,
			"cardImage": "OG_293.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Sombre arakkoa"
			},
			"health": 7,
			"id": "OG_293",
			"name": "Dark Arakkoa",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"attack": 4,
			"cardImage": "EX1_165.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Druide de la Griffe"
			},
			"health": 4,
			"id": "EX1_165",
			"name": "Druid of the Claw",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "AT_090e.png",
			"fr": {
				"name": "Puissance du singe"
			},
			"id": "AT_090e",
			"name": "Might of the Monkey",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA12_3H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : rouge"
			},
			"id": "BRMA12_3H",
			"name": "Brood Affliction: Red",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA03_1H.png",
			"fr": {
				"name": "Empereur Thaurissan"
			},
			"health": 30,
			"id": "BRMA03_1H",
			"name": "Emperor Thaurissan",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "FP1_018.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Dupliquer"
			},
			"id": "FP1_018",
			"name": "Duplicate",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "CRED_09.png",
			"cost": 6,
			"fr": {
				"name": "Ben Thompson"
			},
			"health": 7,
			"id": "CRED_09",
			"name": "Ben Thompson",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Karl Richardson",
			"attack": 1,
			"cardImage": "EX1_015.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Ingénieur novice"
			},
			"health": 1,
			"id": "EX1_015",
			"name": "Novice Engineer",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Sam Nielson",
			"attack": 2,
			"cardImage": "LOE_077.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Brann Barbe-de-Bronze"
			},
			"health": 4,
			"id": "LOE_077",
			"name": "Brann Bronzebeard",
			"rarity": "Legendary",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_033e.png",
			"fr": {
				"name": "Sang de dragon"
			},
			"id": "BRM_033e",
			"name": "Dragon Blood",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "CRED_10.png",
			"cost": 2,
			"fr": {
				"name": "Michael Schweitzer"
			},
			"health": 2,
			"id": "CRED_10",
			"name": "Michael Schweitzer",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_041.png",
			"cost": 0,
			"fr": {
				"name": "Destroy Hero Power"
			},
			"id": "XXX_041",
			"name": "Destroy Hero Power",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 5,
			"cardImage": "BRM_018.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Dragon consort"
			},
			"health": 5,
			"id": "BRM_018",
			"name": "Dragon Consort",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 3,
			"cardImage": "OG_080.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Xaril l’Esprit empoisonné"
			},
			"health": 2,
			"id": "OG_080",
			"name": "Xaril, Poisoned Mind",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Trevor Jacobs",
			"cardImage": "CS2_074.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Poison mortel"
			},
			"id": "CS2_074",
			"name": "Deadly Poison",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "LOE_007t.png",
			"cost": 2,
			"fr": {
				"name": "Maudit !"
			},
			"id": "LOE_007t",
			"name": "Cursed!",
			"playerClass": "Warlock",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_027h.png",
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 8,
			"id": "BRM_027h",
			"name": "Ragnaros the Firelord",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 8,
			"cardImage": "BRMA09_5Ht.png",
			"cost": 3,
			"fr": {
				"name": "Gyth"
			},
			"health": 8,
			"id": "BRMA09_5Ht",
			"name": "Gyth",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 3,
			"cardImage": "GVG_102.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Technicien de Brikabrok"
			},
			"health": 3,
			"id": "GVG_102",
			"name": "Tinkertown Technician",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "NAX1h_03.png",
			"cost": 2,
			"fr": {
				"name": "Nérubien"
			},
			"health": 4,
			"id": "NAX1h_03",
			"name": "Nerubian",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "EX1_409t.png",
			"cost": 1,
			"durability": 3,
			"fr": {
				"name": "Hache lourde"
			},
			"id": "EX1_409t",
			"name": "Heavy Axe",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Weapon"
		},
		{
			"cardImage": "AT_073e.png",
			"fr": {
				"name": "Esprit combatif"
			},
			"id": "AT_073e",
			"name": "Competitive Spirit",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Chippy",
			"attack": 2,
			"cardImage": "EX1_393.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Berserker amani"
			},
			"health": 3,
			"id": "EX1_393",
			"name": "Amani Berserker",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "LOE_002t.png",
			"cost": 3,
			"fr": {
				"name": "Torche enflammée"
			},
			"id": "LOE_002t",
			"name": "Roaring Torch",
			"playerClass": "Mage",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Alex Alexandrov",
			"cardImage": "OG_047.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Rage farouche"
			},
			"id": "OG_047",
			"name": "Feral Rage",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Benjamin Zhang",
			"attack": 5,
			"cardImage": "GVG_071.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Haut-trotteur égaré"
			},
			"health": 4,
			"id": "GVG_071",
			"name": "Lost Tallstrider",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "OG_118e.png",
			"fr": {
				"name": "Ench. de deck Parjurer les ténèbres"
			},
			"id": "OG_118e",
			"name": "Renounce Darkness Deck Ench",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Mark Gibbons",
			"cardImage": "EX1_334.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Folie de l’ombre"
			},
			"id": "EX1_334",
			"name": "Shadow Madness",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Marcleo Vignali",
			"attack": 4,
			"cardImage": "AT_127.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Champion du Nexus Saraad"
			},
			"health": 5,
			"id": "AT_127",
			"name": "Nexus-Champion Saraad",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Max Grecke",
			"attack": 2,
			"cardImage": "OG_322.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Pirate des flots noirs"
			},
			"health": 5,
			"id": "OG_322",
			"name": "Blackwater Pirate",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 6,
			"cardImage": "OG_309.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Princesse Huhuran"
			},
			"health": 5,
			"id": "OG_309",
			"name": "Princess Huhuran",
			"playerClass": "Hunter",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "PART_004e.png",
			"fr": {
				"name": "Camouflé"
			},
			"id": "PART_004e",
			"name": "Cloaked",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Christopher Moeller",
			"cardImage": "EX1_259.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Tempête de foudre"
			},
			"id": "EX1_259",
			"name": "Lightning Storm",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "EX1_131t.png",
			"cost": 1,
			"fr": {
				"name": "Bandit défias"
			},
			"health": 1,
			"id": "EX1_131t",
			"name": "Defias Bandit",
			"playerClass": "Rogue",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"cardImage": "PART_001.png",
			"cost": 1,
			"fr": {
				"name": "Plaque d’armure"
			},
			"id": "PART_001",
			"name": "Armor Plating",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "BRMA16_5.png",
			"cost": 1,
			"durability": 6,
			"fr": {
				"name": "Dent-de-Dragon"
			},
			"id": "BRMA16_5",
			"name": "Dragonteeth",
			"set": "Brm",
			"type": "Weapon"
		},
		{
			"cardImage": "OG_256e.png",
			"fr": {
				"name": "Poisseux"
			},
			"id": "OG_256e",
			"name": "Slimed",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 6,
			"cardImage": "OG_153.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Rampant des marais"
			},
			"health": 8,
			"id": "OG_153",
			"name": "Bog Creeper",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Mark Zug",
			"attack": 0,
			"cardImage": "EX1_100.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Chroniqueur Cho"
			},
			"health": 4,
			"id": "EX1_100",
			"name": "Lorewalker Cho",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_323h.png",
			"fr": {
				"name": "Seigneur Jaraxxus"
			},
			"health": 15,
			"id": "EX1_323h",
			"name": "Lord Jaraxxus",
			"playerClass": "Warlock",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Hero"
		},
		{
			"cardImage": "TB_YoggServant_Enchant.png",
			"fr": {
				"name": "Enchantement de héros par serviteur de Yogg"
			},
			"id": "TB_YoggServant_Enchant",
			"name": "Yogg Servant Hero Enchant",
			"rarity": "Unknown_6",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Cavotta",
			"attack": 4,
			"cardImage": "EX1_048.png",
			"collectible": true,
			"cost": 4,
			"faction": "HORDE",
			"fr": {
				"name": "Brise-sort"
			},
			"health": 3,
			"id": "EX1_048",
			"name": "Spellbreaker",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Brandon Kitkouski",
			"attack": 3,
			"cardImage": "AT_010.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Dompteur de béliers"
			},
			"health": 3,
			"id": "AT_010",
			"name": "Ram Wrangler",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_162o.png",
			"fr": {
				"name": "Force de la meute"
			},
			"id": "EX1_162o",
			"name": "Strength of the Pack",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "NEW1_014e.png",
			"fr": {
				"name": "Déguisé"
			},
			"id": "NEW1_014e",
			"name": "Disguised",
			"playerClass": "Rogue",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 7,
			"cardImage": "GVG_034.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Méca chat-ours"
			},
			"health": 6,
			"id": "GVG_034",
			"name": "Mech-Bear-Cat",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "NAX12_04.png",
			"cost": 3,
			"fr": {
				"name": "Accès de rage"
			},
			"id": "NAX12_04",
			"name": "Enrage",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA16_1.png",
			"fr": {
				"name": "Atramédès"
			},
			"health": 30,
			"id": "BRMA16_1",
			"name": "Atramedes",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 9,
			"cardImage": "GVG_021.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Mal’Ganis"
			},
			"health": 7,
			"id": "GVG_021",
			"name": "Mal'Ganis",
			"playerClass": "Warlock",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "TB_013.png",
			"fr": {
				"name": "Enchantement du choix du joueur"
			},
			"id": "TB_013",
			"name": "Player Choice Enchant",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Christopher Moeller",
			"attack": 6,
			"cardImage": "AT_008.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Drake de Frimarra"
			},
			"health": 6,
			"id": "AT_008",
			"name": "Coldarra Drake",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA08_1.png",
			"fr": {
				"name": "Général Drakkisath"
			},
			"health": 50,
			"id": "BRMA08_1",
			"name": "General Drakkisath",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "OG_031.png",
			"collectible": true,
			"cost": 5,
			"durability": 2,
			"fr": {
				"name": "Marteau du crépuscule"
			},
			"id": "OG_031",
			"name": "Hammer of Twilight",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Og",
			"type": "Weapon"
		},
		{
			"attack": 2,
			"cardImage": "EX1_398t.png",
			"cost": 1,
			"durability": 2,
			"fr": {
				"name": "Hache d’armes"
			},
			"id": "EX1_398t",
			"name": "Battle Axe",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Weapon"
		},
		{
			"artist": "Steve Prescott",
			"cardImage": "GVG_033.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Arbre de vie"
			},
			"id": "GVG_033",
			"name": "Tree of Life",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_379e.png",
			"fr": {
				"name": "Repentir"
			},
			"id": "EX1_379e",
			"name": "Repentance",
			"playerClass": "Paladin",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA16_2H.png",
			"cost": 0,
			"fr": {
				"name": "Écholocation"
			},
			"id": "BRMA16_2H",
			"name": "Echolocate",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_18H.png",
			"cost": 10,
			"fr": {
				"name": "Zinaar"
			},
			"health": 10,
			"id": "LOEA16_18H",
			"name": "Zinaar",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "CS2_117.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Prophète du Cercle terrestre"
			},
			"health": 3,
			"id": "CS2_117",
			"name": "Earthen Ring Farseer",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "BRMC_90.png",
			"cost": 2,
			"fr": {
				"name": "Lave vivante"
			},
			"health": 6,
			"id": "BRMC_90",
			"name": "Living Lava",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_24.png",
			"cost": 5,
			"fr": {
				"name": "Aileron-Géant"
			},
			"health": 5,
			"id": "LOEA16_24",
			"name": "Giantfin",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "EX1_400.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Tourbillon"
			},
			"id": "EX1_400",
			"name": "Whirlwind",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Ittoku",
			"attack": 2,
			"cardImage": "CS2_119.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gueule d’acier des oasis"
			},
			"health": 7,
			"id": "CS2_119",
			"name": "Oasis Snapjaw",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA15_1H.png",
			"fr": {
				"name": "Maloriak"
			},
			"health": 30,
			"id": "BRMA15_1H",
			"name": "Maloriak",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA05_03h.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester sorts !"
			},
			"id": "LOEA05_03h",
			"name": "Trogg Hate Spells!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_PickYourFate7Ench.png",
			"fr": {
				"name": "Destin 7 : enchantement La pièce"
			},
			"id": "TB_PickYourFate7Ench",
			"name": "Fate 7 Ench Get a Coin",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_26.png",
			"cost": 5,
			"fr": {
				"name": "Squeletosaurus Hex"
			},
			"health": 5,
			"id": "LOEA16_26",
			"name": "Skelesaurus Hex",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "NAX12_02H_2c_TB.png",
			"cost": 1,
			"fr": {
				"name": "Décimer"
			},
			"id": "NAX12_02H_2c_TB",
			"name": "Decimate",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Ben Zhang",
			"attack": 3,
			"cardImage": "LOE_050.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Raptor de monte"
			},
			"health": 2,
			"id": "LOE_050",
			"name": "Mounted Raptor",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "TB_DecreasingCardCostDebug.png",
			"cost": 0,
			"fr": {
				"name": "TBDecreasingCardCostDebug"
			},
			"id": "TB_DecreasingCardCostDebug",
			"name": "TBDecreasingCardCostDebug",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_083b.png",
			"cost": 2,
			"fr": {
				"name": "Maîtrise des dagues"
			},
			"id": "CS2_083b",
			"name": "Dagger Mastery",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero_power"
		},
		{
			"artist": "Laurel D. Austin",
			"attack": 4,
			"cardImage": "NEW1_040.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Lardeur"
			},
			"health": 4,
			"id": "NEW1_040",
			"name": "Hogger",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA05_01h.png",
			"fr": {
				"name": "Scarvash (héroïque)"
			},
			"health": 30,
			"id": "LOEA05_01h",
			"name": "Heroic Scarvash",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "AT_045ee.png",
			"fr": {
				"name": "Ench. de deck de mandebrume"
			},
			"id": "AT_045ee",
			"name": "Mistcaller Deck Ench",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Esad Ribic",
			"attack": 2,
			"cardImage": "AT_095.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chevalier silencieux"
			},
			"health": 2,
			"id": "AT_095",
			"name": "Silent Knight",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "OG_282e.png",
			"fr": {
				"name": "Dévotion de la lame"
			},
			"id": "OG_282e",
			"name": "Devotion of the Blade",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "BRMA15_4.png",
			"cost": 1,
			"fr": {
				"name": "Aberration"
			},
			"health": 1,
			"id": "BRMA15_4",
			"name": "Aberration",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "BRMC_100.png",
			"cost": 3,
			"fr": {
				"name": "Bombe vivante"
			},
			"id": "BRMC_100",
			"name": "Living Bomb",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "BRMA14_3.png",
			"cost": 0,
			"fr": {
				"name": "Arcanotron"
			},
			"health": 2,
			"id": "BRMA14_3",
			"name": "Arcanotron",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "NAX15_01H.png",
			"fr": {
				"name": "Kel’Thuzad"
			},
			"health": 45,
			"id": "NAX15_01H",
			"name": "Kel'Thuzad",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Jesper Esjing",
			"attack": 4,
			"cardImage": "OG_283.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Élue de C’Thun"
			},
			"health": 2,
			"id": "OG_283",
			"name": "C'Thun's Chosen",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "NAX10_03.png",
			"cost": 4,
			"fr": {
				"name": "Frappe haineuse"
			},
			"id": "NAX10_03",
			"name": "Hateful Strike",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"attack": 7,
			"cardImage": "XXX_109.png",
			"cost": 0,
			"fr": {
				"name": "Illidan Stormrage Cheat"
			},
			"health": 5,
			"id": "XXX_109",
			"name": "Illidan Stormrage Cheat",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"artist": "Grace Liu",
			"attack": 1,
			"cardImage": "OG_058.png",
			"cost": 1,
			"durability": 3,
			"fr": {
				"name": "Crochet rouillé"
			},
			"id": "OG_058",
			"name": "Rusty Hook",
			"playerClass": "Warrior",
			"set": "Og",
			"type": "Weapon"
		},
		{
			"cardImage": "BRM_027p.png",
			"cost": 2,
			"fr": {
				"name": "MEURS, INSECTE !"
			},
			"id": "BRM_027p",
			"name": "DIE, INSECT!",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "AT_132_SHAMAN.png",
			"cost": 2,
			"fr": {
				"name": "Heurt totémique"
			},
			"id": "AT_132_SHAMAN",
			"name": "Totemic Slam",
			"playerClass": "Shaman",
			"set": "Tgt",
			"type": "Hero_power"
		},
		{
			"cardImage": "AT_132_DRUID.png",
			"cost": 2,
			"fr": {
				"name": "Changeforme sinistre"
			},
			"id": "AT_132_DRUID",
			"name": "Dire Shapeshift",
			"playerClass": "Druid",
			"set": "Tgt",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "BRM_004t.png",
			"cost": 1,
			"fr": {
				"name": "Dragonnet"
			},
			"health": 1,
			"id": "BRM_004t",
			"name": "Whelp",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA04_4.png",
			"cost": 3,
			"fr": {
				"name": "Déchaînement"
			},
			"id": "BRMA04_4",
			"name": "Rock Out",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA10_1.png",
			"fr": {
				"name": "Tranchetripe l’Indompté"
			},
			"health": 30,
			"id": "BRMA10_1",
			"name": "Razorgore the Untamed",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Dave Berggren",
			"cardImage": "CS2_023.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Intelligence des Arcanes"
			},
			"id": "CS2_023",
			"name": "Arcane Intellect",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Dave Rapoza",
			"cardImage": "EX1_578.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Sauvagerie"
			},
			"id": "EX1_578",
			"name": "Savagery",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "A.J. Nazzaro",
			"attack": 6,
			"cardImage": "LOE_019t2.png",
			"cost": 4,
			"fr": {
				"name": "Singe doré"
			},
			"health": 6,
			"id": "LOE_019t2",
			"name": "Golden Monkey",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Mark Zug",
			"attack": 3,
			"cardImage": "AT_129.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Fjola Plaie-lumineuse"
			},
			"health": 4,
			"id": "AT_129",
			"name": "Fjola Lightbane",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_26H.png",
			"cost": 10,
			"fr": {
				"name": "Squeletosaurus Hex"
			},
			"health": 10,
			"id": "LOEA16_26H",
			"name": "Skelesaurus Hex",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 6,
			"cardImage": "GVG_118.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Troggzor le Terreminator"
			},
			"health": 6,
			"id": "GVG_118",
			"name": "Troggzor the Earthinator",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "GAME_002.png",
			"cost": 0,
			"fr": {
				"name": "Avatar de la pièce"
			},
			"health": 1,
			"id": "GAME_002",
			"name": "Avatar of the Coin",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_105e.png",
			"fr": {
				"name": "Frappe héroïque"
			},
			"id": "CS2_105e",
			"name": "Heroic Strike",
			"playerClass": "Warrior",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX11_04e.png",
			"fr": {
				"name": "Injection mutante"
			},
			"id": "NAX11_04e",
			"name": "Mutating Injection",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"attack": 6,
			"cardImage": "BRMA13_6.png",
			"cost": 0,
			"fr": {
				"name": "Lave vivante"
			},
			"health": 6,
			"id": "BRMA13_6",
			"name": "Living Lava",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA03_1.png",
			"fr": {
				"name": "Empereur Thaurissan"
			},
			"health": 30,
			"id": "BRMA03_1",
			"name": "Emperor Thaurissan",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "TBUD_1.png",
			"fr": {
				"name": "Invocation précoce de serviteur"
			},
			"id": "TBUD_1",
			"name": "TBUD Summon Early Minion",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "HERO_03.png",
			"collectible": true,
			"fr": {
				"name": "Valeera Sanguinar"
			},
			"health": 30,
			"id": "HERO_03",
			"name": "Valeera Sanguinar",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 4,
			"cardImage": "OG_209.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Hallazèle l’Élevé"
			},
			"health": 6,
			"id": "OG_209",
			"name": "Hallazeal the Ascended",
			"playerClass": "Shaman",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "BRM_005.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Courroux démoniaque"
			},
			"id": "BRM_005",
			"name": "Demonwrath",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Arthur Gimaldinov",
			"attack": 2,
			"cardImage": "OG_085.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mande-givre dément"
			},
			"health": 4,
			"id": "OG_085",
			"name": "Demented Frostcaller",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA13_2H.png",
			"cost": 0,
			"fr": {
				"name": "Puissance des anciens"
			},
			"id": "LOEA13_2H",
			"name": "Ancient Power",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 8,
			"cardImage": "OG_308.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Ver des sables géant"
			},
			"health": 8,
			"id": "OG_308",
			"name": "Giant Sand Worm",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_28.png",
			"cost": 0,
			"fr": {
				"name": "Un bassin luminescent"
			},
			"id": "LOEA04_28",
			"name": "A Glowing Pool",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "TB_SPT_ClearBoard.png",
			"cost": 0,
			"fr": {
				"name": "Plateau de jeu vidé pendant l’épreuve"
			},
			"id": "TB_SPT_ClearBoard",
			"name": "Trial Clear Board",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_92.png",
			"cost": 4,
			"fr": {
				"name": "Coren Navrebière"
			},
			"health": 8,
			"id": "BRMC_92",
			"name": "Coren Direbrew",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "NEW1_032.png",
			"cost": 3,
			"fr": {
				"name": "Misha"
			},
			"health": 4,
			"id": "NEW1_032",
			"name": "Misha",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA10_1H.png",
			"fr": {
				"name": "Tranchetripe l’Indompté"
			},
			"health": 30,
			"id": "BRMA10_1H",
			"name": "Razorgore the Untamed",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "EX1_411e.png",
			"fr": {
				"name": "Rage sanguinaire"
			},
			"id": "EX1_411e",
			"name": "Bloodrage",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX2_01.png",
			"fr": {
				"name": "Grande veuve Faerlina"
			},
			"health": 30,
			"id": "NAX2_01",
			"name": "Grand Widow Faerlina",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Steve Ellis",
			"cardImage": "CS2_024.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Éclair de givre"
			},
			"id": "CS2_024",
			"name": "Frostbolt",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Wei Wang",
			"attack": 5,
			"cardImage": "GVG_028.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Prince marchand Gallywix"
			},
			"health": 8,
			"id": "GVG_028",
			"name": "Trade Prince Gallywix",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "BRMC_99e.png",
			"cost": 2,
			"fr": {
				"name": "Élémentaire de roche"
			},
			"health": 3,
			"id": "BRMC_99e",
			"name": "Rock Elemental",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 6,
			"cardImage": "AT_020.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Garde funeste effroyable"
			},
			"health": 8,
			"id": "AT_020",
			"name": "Fearsome Doomguard",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_2H.png",
			"cost": 0,
			"fr": {
				"name": "Affliction de l’espèce"
			},
			"id": "BRMA12_2H",
			"name": "Brood Affliction",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Zero Yue",
			"attack": 2,
			"cardImage": "GVG_091.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Annulateur d’Arcane X-21"
			},
			"health": 5,
			"id": "GVG_091",
			"name": "Arcane Nullifier X-21",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_046e.png",
			"fr": {
				"name": "Furie sanguinaire"
			},
			"id": "CS2_046e",
			"name": "Bloodlust",
			"playerClass": "Shaman",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_4_Ench.png",
			"fr": {
				"name": "Pick Your Fate 4 Ench"
			},
			"id": "TB_PickYourFate_4_Ench",
			"name": "Pick Your Fate 4 Ench",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Anton Kagounkin",
			"attack": 2,
			"cardImage": "OG_249a.png",
			"cost": 1,
			"fr": {
				"name": "Gelée"
			},
			"health": 2,
			"id": "OG_249a",
			"name": "Slime",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Kevin Chen",
			"cardImage": "AT_024.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Fusion démoniaque"
			},
			"id": "AT_024",
			"name": "Demonfuse",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA02_1H.png",
			"fr": {
				"name": "Juge Supérieur Mornepierre"
			},
			"health": 30,
			"id": "BRMA02_1H",
			"name": "High Justice Grimstone",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "CRED_30.png",
			"cost": 7,
			"fr": {
				"name": "JC Park"
			},
			"health": 4,
			"id": "CRED_30",
			"name": "JC Park",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_11.png",
			"cost": 0,
			"fr": {
				"name": "Couronne de Kael’thas"
			},
			"id": "LOEA16_11",
			"name": "Crown of Kael'thas",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Phil Saunders",
			"attack": 2,
			"cardImage": "GVG_006.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Méca-téléporteur"
			},
			"health": 3,
			"id": "GVG_006",
			"name": "Mechwarper",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KTRAF_104.png",
			"cost": 3,
			"fr": {
				"name": "Découvrir un morceau du bâton"
			},
			"id": "TB_KTRAF_104",
			"name": "Uncover Staff Piece",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Rafael Zanchetin",
			"attack": 2,
			"cardImage": "OG_221.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Héroïne altruiste"
			},
			"health": 1,
			"id": "OG_221",
			"name": "Selfless Hero",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Ben Zhang",
			"attack": 4,
			"cardImage": "EX1_284.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Drake azur"
			},
			"health": 4,
			"id": "EX1_284",
			"name": "Azure Drake",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NAX9_03H.png",
			"cost": 3,
			"fr": {
				"name": "Thane Korth’azz"
			},
			"health": 7,
			"id": "NAX9_03H",
			"name": "Thane Korth'azz",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Sean O’Daniels",
			"cardImage": "CS1_113.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Contrôle mental"
			},
			"id": "CS1_113",
			"name": "Mind Control",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "LOE_051.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Sélénien de la jungle"
			},
			"health": 4,
			"id": "LOE_051",
			"name": "Jungle Moonkin",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_46.png",
			"cost": 2,
			"fr": {
				"name": "Keith Landes"
			},
			"health": 6,
			"id": "CRED_46",
			"name": "Keith Landes",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 6,
			"cardImage": "AT_079.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Adversaire mystérieux"
			},
			"health": 6,
			"id": "AT_079",
			"name": "Mysterious Challenger",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_42.png",
			"cost": 4,
			"fr": {
				"name": "Tim Erskine"
			},
			"health": 5,
			"id": "CRED_42",
			"name": "Tim Erskine",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_06.png",
			"cost": 0,
			"fr": {
				"name": "Fosse remplie de pointes"
			},
			"id": "LOEA04_06",
			"name": "Pit of Spikes",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "DS1h_292_H1.png",
			"cost": 2,
			"fr": {
				"name": "Tir assuré"
			},
			"id": "DS1h_292_H1",
			"name": "Steady Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Hero_skins",
			"type": "Hero_power"
		},
		{
			"attack": 2,
			"cardImage": "OG_314b.png",
			"cost": 1,
			"fr": {
				"name": "Gelée"
			},
			"health": 2,
			"id": "OG_314b",
			"name": "Slime",
			"playerClass": "Warrior",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Zero Yue",
			"attack": 5,
			"cardImage": "GVG_086.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Engin de siège"
			},
			"health": 5,
			"id": "GVG_086",
			"name": "Siege Engine",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "L. Lullabi &  Nutchapol ",
			"attack": 2,
			"cardImage": "OG_327.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Tentacule remuant"
			},
			"health": 4,
			"id": "OG_327",
			"name": "Squirming Tentacle",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "LOE_021.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Piège de fléchettes"
			},
			"id": "LOE_021",
			"name": "Dart Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_354.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Imposition des mains"
			},
			"id": "EX1_354",
			"name": "Lay on Hands",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_3.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : rouge"
			},
			"id": "BRMA12_3",
			"name": "Brood Affliction: Red",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Jimmy Lo",
			"cardImage": "OG_023.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Fusion primordiale"
			},
			"id": "OG_023",
			"name": "Primal Fusion",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Efrem Palacios",
			"cardImage": "CS2_094.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Marteau de courroux"
			},
			"id": "CS2_094",
			"name": "Hammer of Wrath",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_507e.png",
			"fr": {
				"name": "Mrgglaargl !"
			},
			"id": "EX1_507e",
			"name": "Mrgglaargl!",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_083e.png",
			"fr": {
				"name": "Aiguisé"
			},
			"id": "CS2_083e",
			"name": "Sharpened",
			"playerClass": "Rogue",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "Lars Grant-West",
			"attack": 3,
			"cardImage": "CS2_125.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Grizzly Ferpoil"
			},
			"health": 3,
			"id": "CS2_125",
			"name": "Ironfur Grizzly",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_332.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Silence"
			},
			"id": "EX1_332",
			"name": "Silence",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 3,
			"cardImage": "GVG_064.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Saute-flaque"
			},
			"health": 2,
			"id": "GVG_064",
			"name": "Puddlestomper",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_166b.png",
			"cost": 0,
			"fr": {
				"name": "Dissipation"
			},
			"id": "EX1_166b",
			"name": "Dispel",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Samwise",
			"attack": 10,
			"cardImage": "OG_042.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Y’Shaarj, la rage déchaînée"
			},
			"health": 10,
			"id": "OG_042",
			"name": "Y'Shaarj, Rage Unbound",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 3,
			"cardImage": "EX1_382.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Garde-paix de l’Aldor"
			},
			"health": 3,
			"id": "EX1_382",
			"name": "Aldor Peacekeeper",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "BRMA10_4.png",
			"cost": 1,
			"fr": {
				"name": "Œuf corrompu"
			},
			"health": 1,
			"id": "BRMA10_4",
			"name": "Corrupted Egg",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_21.png",
			"cost": 5,
			"fr": {
				"name": "Chef Scarvash"
			},
			"health": 5,
			"id": "LOEA16_21",
			"name": "Chieftain Scarvash",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA09_3.png",
			"cost": 2,
			"fr": {
				"name": "Ancienne Horde"
			},
			"id": "BRMA09_3",
			"name": "Old Horde",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "HERO_07.png",
			"collectible": true,
			"fr": {
				"name": "Gul’dan"
			},
			"health": 30,
			"id": "HERO_07",
			"name": "Gul'dan",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero"
		},
		{
			"cardImage": "PART_006a.png",
			"fr": {
				"name": "Inversion"
			},
			"id": "PART_006a",
			"name": "Switched",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "NAX9_04.png",
			"cost": 3,
			"fr": {
				"name": "Sire Zeliek"
			},
			"health": 7,
			"id": "NAX9_04",
			"name": "Sir Zeliek",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Jomaro Kindred",
			"attack": 4,
			"cardImage": "BRM_014.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Rageur du Magma"
			},
			"health": 4,
			"id": "BRM_014",
			"name": "Core Rager",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Jakub Kasber",
			"attack": 3,
			"cardImage": "OG_034.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Grouillant silithide"
			},
			"health": 5,
			"id": "OG_034",
			"name": "Silithid Swarmer",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "AT_040e.png",
			"fr": {
				"name": "Âme sœur"
			},
			"id": "AT_040e",
			"name": "Kindred Spirit",
			"playerClass": "Druid",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_014.png",
			"cost": 0,
			"fr": {
				"name": "Mill 10"
			},
			"id": "XXX_014",
			"name": "Mill 10",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Randy Gallegos",
			"attack": 1,
			"cardImage": "NEW1_025.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Forban de la Voile sanglante"
			},
			"health": 2,
			"id": "NEW1_025",
			"name": "Bloodsail Corsair",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Oliver Chipping",
			"attack": 1,
			"cardImage": "LOEA10_3.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Murloc mini-aileron"
			},
			"health": 1,
			"id": "LOEA10_3",
			"name": "Murloc Tinyfin",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "TB_006e.png",
			"fr": {
				"name": "Grande banane"
			},
			"id": "TB_006e",
			"name": "Big Banana",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Phil Saunders",
			"attack": 3,
			"cardImage": "GVG_123.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Cracheur de suie"
			},
			"health": 3,
			"id": "GVG_123",
			"name": "Soot Spewer",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_093e.png",
			"fr": {
				"name": "Main d’Argus"
			},
			"id": "EX1_093e",
			"name": "Hand of Argus",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 0,
			"cardImage": "NEW1_021.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Auspice funeste"
			},
			"health": 7,
			"id": "NEW1_021",
			"name": "Doomsayer",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 3,
			"cardImage": "NEW1_022.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Corsaire de l’effroi"
			},
			"health": 3,
			"id": "NEW1_022",
			"name": "Dread Corsair",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "DREAM_05.png",
			"cost": 0,
			"fr": {
				"name": "Cauchemar"
			},
			"id": "DREAM_05",
			"name": "Nightmare",
			"playerClass": "Dream",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_030be.png",
			"fr": {
				"name": "Mode Char"
			},
			"id": "GVG_030be",
			"name": "Tank Mode",
			"playerClass": "Druid",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "CS2_234.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Mot de l’ombre : Douleur"
			},
			"id": "CS2_234",
			"name": "Shadow Word: Pain",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "FP1_017.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Seigneur de la toile nérub’ar"
			},
			"health": 4,
			"id": "FP1_017",
			"name": "Nerub'ar Weblord",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Cole Eastburn",
			"attack": 1,
			"cardImage": "OG_158.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Initié zélé"
			},
			"health": 1,
			"id": "OG_158",
			"name": "Zealous Initiate",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 3,
			"cardImage": "OG_315.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Adepte de la Voile sanglante"
			},
			"health": 4,
			"id": "OG_315",
			"name": "Bloodsail Cultist",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_054.png",
			"cost": 0,
			"fr": {
				"name": "Weapon Buff"
			},
			"id": "XXX_054",
			"name": "Weapon Buff",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Sean McNally",
			"attack": 1,
			"cardImage": "AT_091.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Médecin du tournoi"
			},
			"health": 8,
			"id": "AT_091",
			"name": "Tournament Medic",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Daarken",
			"cardImage": "EX1_621.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Cercle de soins"
			},
			"id": "EX1_621",
			"name": "Circle of Healing",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA09_7e.png",
			"fr": {
				"name": "Chaudron"
			},
			"id": "LOEA09_7e",
			"name": "Cauldron",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Chris Seaman",
			"cardImage": "CS2_028.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Blizzard"
			},
			"id": "CS2_028",
			"name": "Blizzard",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "NAX9_05.png",
			"cost": 3,
			"durability": 3,
			"fr": {
				"name": "Lame runique"
			},
			"id": "NAX9_05",
			"name": "Runeblade",
			"set": "Naxx",
			"type": "Weapon"
		},
		{
			"cardImage": "EX1_004e.png",
			"fr": {
				"name": "Grâce d’Élune"
			},
			"id": "EX1_004e",
			"name": "Elune's Grace",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX15_02.png",
			"cost": 0,
			"fr": {
				"name": "Trait de givre"
			},
			"id": "NAX15_02",
			"name": "Frost Blast",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"cardImage": "TU4f_001.png",
			"fr": {
				"name": "Chroniqueur Cho"
			},
			"health": 25,
			"id": "TU4f_001",
			"name": "Lorewalker Cho",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "AT_093.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Frigbold algide"
			},
			"health": 6,
			"id": "AT_093",
			"name": "Frigid Snobold",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Steve Tappin",
			"cardImage": "EX1_160.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Puissance du fauve"
			},
			"id": "EX1_160",
			"name": "Power of the Wild",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Samwise",
			"attack": 4,
			"cardImage": "OG_326.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Sanglier de pénombre"
			},
			"health": 1,
			"id": "OG_326",
			"name": "Duskboar",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_360e.png",
			"fr": {
				"name": "Humilité"
			},
			"id": "EX1_360e",
			"name": "Humility",
			"playerClass": "Paladin",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "NAX8_05t.png",
			"cost": 5,
			"fr": {
				"name": "Cavalier spectral"
			},
			"health": 6,
			"id": "NAX8_05t",
			"name": "Spectral Rider",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Aleksi Briclot",
			"attack": 3,
			"cardImage": "GVG_068.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Trogg mâcheroc mastoc"
			},
			"health": 5,
			"id": "GVG_068",
			"name": "Burly Rockjaw Trogg",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "AT_037t.png",
			"cost": 1,
			"fr": {
				"name": "Arbrisseau"
			},
			"health": 1,
			"id": "AT_037t",
			"name": "Sapling",
			"playerClass": "Druid",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "TB_ClassRandom_Warlock.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : démoniste"
			},
			"id": "TB_ClassRandom_Warlock",
			"name": "Second Class: Warlock",
			"playerClass": "Warlock",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "Mekka1.png",
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Poulet à tête chercheuse"
			},
			"health": 1,
			"id": "Mekka1",
			"name": "Homing Chicken",
			"rarity": "Common",
			"set": "Promo",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA07_2_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "MOI TOUT CASSER"
			},
			"id": "BRMA07_2_2_TB",
			"name": "ME SMASH",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"attack": 2,
			"cardImage": "BRMA09_3Ht.png",
			"cost": 1,
			"fr": {
				"name": "Orc de l’ancienne Horde"
			},
			"health": 2,
			"id": "BRMA09_3Ht",
			"name": "Old Horde Orc",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Matt Cavotta",
			"cardImage": "EX1_409.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Amélioration !"
			},
			"id": "EX1_409",
			"name": "Upgrade!",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_155.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Marque de la nature"
			},
			"id": "EX1_155",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "TBA01_4.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "TBA01_4",
			"name": "Nefarian",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"cardImage": "AT_084e.png",
			"fr": {
				"name": "Équipé"
			},
			"id": "AT_084e",
			"name": "Equipped",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "NAX10_02H.png",
			"cost": 3,
			"durability": 8,
			"fr": {
				"name": "Crochet"
			},
			"id": "NAX10_02H",
			"name": "Hook",
			"set": "Naxx",
			"type": "Weapon"
		},
		{
			"cardImage": "LOEA04_29b.png",
			"cost": 0,
			"fr": {
				"name": "Examiner les runes"
			},
			"id": "LOEA04_29b",
			"name": "Investigate the Runes",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 7,
			"cardImage": "CRED_40.png",
			"cost": 4,
			"fr": {
				"name": "Ryan Masterson"
			},
			"health": 2,
			"id": "CRED_40",
			"name": "Ryan Masterson",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "BRMA02_2t.png",
			"cost": 1,
			"fr": {
				"name": "Spectateur sombrefer"
			},
			"health": 1,
			"id": "BRMA02_2t",
			"name": "Dark Iron Spectator",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "TB_FactionWar_BoomBot_Spell.png",
			"cost": 1,
			"fr": {
				"name": "TBFactionWarBoomBotSpell"
			},
			"id": "TB_FactionWar_BoomBot_Spell",
			"name": "TBFactionWarBoomBotSpell",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Leo Che",
			"cardImage": "EX1_161.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Acclimatation"
			},
			"id": "EX1_161",
			"name": "Naturalize",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_355e.png",
			"fr": {
				"name": "Bénédiction du champion"
			},
			"id": "EX1_355e",
			"name": "Blessed Champion",
			"playerClass": "Paladin",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_164b.png",
			"cost": 0,
			"fr": {
				"name": "Nourrir"
			},
			"id": "EX1_164b",
			"name": "Nourish",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_160b.png",
			"cost": 0,
			"fr": {
				"name": "Chef de la meute"
			},
			"id": "EX1_160b",
			"name": "Leader of the Pack",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "John Polidora",
			"attack": 5,
			"cardImage": "BRM_026.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Dragon affamé"
			},
			"health": 6,
			"id": "BRM_026",
			"name": "Hungry Dragon",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Matt Gaser",
			"attack": 2,
			"cardImage": "EX1_258.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Élémentaire délié"
			},
			"health": 4,
			"id": "EX1_258",
			"name": "Unbound Elemental",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA14_1H.png",
			"fr": {
				"name": "Système de défense Omnitron"
			},
			"health": 30,
			"id": "BRMA14_1H",
			"name": "Omnotron Defense System",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA05_3e.png",
			"fr": {
				"name": "Bombe vivante"
			},
			"id": "BRMA05_3e",
			"name": "Living Bomb",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"artist": "Jon McConnell",
			"attack": 4,
			"cardImage": "FP1_029.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Épées dansantes"
			},
			"health": 4,
			"id": "FP1_029",
			"name": "Dancing Swords",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NAX14_03.png",
			"cost": 5,
			"fr": {
				"name": "Champion gelé"
			},
			"health": 10,
			"id": "NAX14_03",
			"name": "Frozen Champion",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "CRED_05.png",
			"cost": 3,
			"fr": {
				"name": "Kyle Harrison"
			},
			"health": 4,
			"id": "CRED_05",
			"name": "Kyle Harrison",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 3,
			"cardImage": "EX1_082.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Bombardier fou"
			},
			"health": 2,
			"id": "EX1_082",
			"name": "Mad Bomber",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_023.png",
			"cost": 0,
			"fr": {
				"name": "Destroy All Heroes"
			},
			"id": "XXX_023",
			"name": "Destroy All Heroes",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "E.M. Gist",
			"attack": 5,
			"cardImage": "CS2_088.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Gardien des rois"
			},
			"health": 6,
			"id": "CS2_088",
			"name": "Guardian of Kings",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Howard Lyon",
			"attack": 2,
			"cardImage": "FP1_010.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Maexxna"
			},
			"health": 8,
			"id": "FP1_010",
			"name": "Maexxna",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_02h.png",
			"cost": 0,
			"fr": {
				"name": "Fuyez !"
			},
			"id": "LOEA04_02h",
			"name": "Escape!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 1,
			"cardImage": "EX1_102.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Démolisseur"
			},
			"health": 4,
			"id": "EX1_102",
			"name": "Demolisher",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_371.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Main de protection"
			},
			"id": "EX1_371",
			"name": "Hand of Protection",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_166a.png",
			"cost": 0,
			"fr": {
				"name": "Éclat lunaire"
			},
			"id": "EX1_166a",
			"name": "Moonfire",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 3,
			"cardImage": "EX1_023.png",
			"collectible": true,
			"cost": 4,
			"faction": "HORDE",
			"fr": {
				"name": "Garde de Lune-d’argent"
			},
			"health": 3,
			"id": "EX1_023",
			"name": "Silvermoon Guardian",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TB_SPT_Minion3e.png",
			"fr": {
				"name": "Force de Hurlevent"
			},
			"id": "TB_SPT_Minion3e",
			"name": "Strength of Stormwind",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Trent Kaniuga",
			"cardImage": "OG_081.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Fracasser"
			},
			"id": "OG_081",
			"name": "Shatter",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Steve Prescott",
			"cardImage": "EX1_617.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Tir meurtrier"
			},
			"id": "EX1_617",
			"name": "Deadly Shot",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "TB_KTRAF_HP_RAF4.png",
			"cost": 2,
			"fr": {
				"name": "Deuxième morceau du bâton"
			},
			"id": "TB_KTRAF_HP_RAF4",
			"name": "Staff, Two Pieces",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX11_04.png",
			"cost": 3,
			"fr": {
				"name": "Injection mutante"
			},
			"id": "NAX11_04",
			"name": "Mutating Injection",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA07_2.png",
			"cost": 1,
			"fr": {
				"name": "MOI TOUT CASSER"
			},
			"id": "BRMA07_2",
			"name": "ME SMASH",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX2_03.png",
			"cost": 2,
			"fr": {
				"name": "Pluie de feu"
			},
			"id": "NAX2_03",
			"name": "Rain of Fire",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "CS2_168.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Écumeur murloc"
			},
			"health": 1,
			"id": "CS2_168",
			"name": "Murloc Raider",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "E.M. Gist",
			"attack": 9,
			"cardImage": "CS2_201.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Chien du Magma"
			},
			"health": 5,
			"id": "CS2_201",
			"name": "Core Hound",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "NAX8_04t.png",
			"cost": 3,
			"fr": {
				"name": "Guerrier spectral"
			},
			"health": 4,
			"id": "NAX8_04t",
			"name": "Spectral Warrior",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_2.png",
			"cost": 0,
			"fr": {
				"name": "Affliction de l’espèce"
			},
			"id": "BRMA12_2",
			"name": "Brood Affliction",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Glenn Rane",
			"attack": 5,
			"cardImage": "EX1_016.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Sylvanas Coursevent"
			},
			"health": 5,
			"id": "EX1_016",
			"name": "Sylvanas Windrunner",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA13_1H.png",
			"fr": {
				"name": "Seigneur Victor Nefarius"
			},
			"health": 30,
			"id": "BRMA13_1H",
			"name": "Lord Victor Nefarius",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Jerry Mascho",
			"attack": 1,
			"cardImage": "OG_006.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Inquisiteur Aileron noir"
			},
			"health": 3,
			"id": "OG_006",
			"name": "Vilefin Inquisitor",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "OG_101.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Mutation interdite"
			},
			"id": "OG_101",
			"name": "Forbidden Shaping",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"attack": 7,
			"cardImage": "OG_270a.png",
			"cost": 8,
			"fr": {
				"name": "Soldat nérubien"
			},
			"health": 7,
			"id": "OG_270a",
			"name": "Nerubian Soldier",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_3_Ench.png",
			"fr": {
				"name": "Pick Your Fate 3 Ench"
			},
			"id": "TB_PickYourFate_3_Ench",
			"name": "Pick Your Fate 3 Ench",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_393e.png",
			"fr": {
				"name": "Enragé"
			},
			"id": "EX1_393e",
			"name": "Enraged",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Tyler Walpole",
			"attack": 1,
			"cardImage": "GVG_051.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Robo-baston"
			},
			"health": 3,
			"id": "GVG_051",
			"name": "Warbot",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "NAX4_04H.png",
			"cost": 0,
			"fr": {
				"name": "Réanimation morbide"
			},
			"id": "NAX4_04H",
			"name": "Raise Dead",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "Peter Stapleton",
			"attack": 4,
			"cardImage": "OG_292.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Traqueur lugubre"
			},
			"health": 2,
			"id": "OG_292",
			"name": "Forlorn Stalker",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 6,
			"cardImage": "OG_280.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "C’Thun"
			},
			"health": 6,
			"id": "OG_280",
			"name": "C'Thun",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "AT_039e.png",
			"fr": {
				"name": "Sauvage"
			},
			"id": "AT_039e",
			"name": "Savage",
			"playerClass": "Druid",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_7.png",
			"cost": 0,
			"fr": {
				"name": "Destin : La pièce"
			},
			"id": "TB_PickYourFate_7",
			"name": "Fate: Coin",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "NAX6_02H.png",
			"cost": 0,
			"fr": {
				"name": "Aura nécrotique"
			},
			"id": "NAX6_02H",
			"name": "Necrotic Aura",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_014.png",
			"cost": 0,
			"fr": {
				"name": "Choisir une nouvelle carte !"
			},
			"id": "TB_014",
			"name": "Choose a New Card!",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Vance Kovacs",
			"cardImage": "CS2_022.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Métamorphose"
			},
			"id": "CS2_022",
			"name": "Polymorph",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "AT_073.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Esprit combatif"
			},
			"id": "AT_073",
			"name": "Competitive Spirit",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_366e.png",
			"fr": {
				"name": "Justice rendue"
			},
			"id": "EX1_366e",
			"name": "Justice Served",
			"playerClass": "Paladin",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 9,
			"cardImage": "CRED_35.png",
			"cost": 4,
			"fr": {
				"name": "Max McCall"
			},
			"health": 2,
			"id": "CRED_35",
			"name": "Max McCall",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_006.png",
			"cost": 0,
			"fr": {
				"name": "Break Weapon"
			},
			"id": "XXX_006",
			"name": "Break Weapon",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_01h.png",
			"fr": {
				"name": "Fuite (héroïque)"
			},
			"health": 100,
			"id": "LOEA04_01h",
			"name": "Heroic Escape",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Christopher Moeller",
			"attack": 5,
			"cardImage": "GVG_114.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Vieux déchiqueteur de Sneed"
			},
			"health": 7,
			"id": "GVG_114",
			"name": "Sneed's Old Shredder",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_028e.png",
			"fr": {
				"name": "Faveur impériale"
			},
			"id": "BRM_028e",
			"name": "Imperial Favor",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"cardImage": "PART_001e.png",
			"fr": {
				"name": "Plaque d’armure"
			},
			"id": "PART_001e",
			"name": "Armor Plating",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX13_01.png",
			"fr": {
				"name": "Thaddius"
			},
			"health": 30,
			"id": "NAX13_01",
			"name": "Thaddius",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 3,
			"cardImage": "LOE_039.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gorillobot A-3"
			},
			"health": 4,
			"id": "LOE_039",
			"name": "Gorillabot A-3",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Nate Bowden",
			"attack": 3,
			"cardImage": "FP1_012.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Crache-vase"
			},
			"health": 5,
			"id": "FP1_012",
			"name": "Sludge Belcher",
			"rarity": "Rare",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_14.png",
			"cost": 5,
			"fr": {
				"name": "Yong Woo"
			},
			"health": 2,
			"id": "CRED_14",
			"name": "Yong Woo",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Chris Moeller",
			"attack": 3,
			"cardImage": "EX1_134.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Agent du SI:7"
			},
			"health": 3,
			"id": "EX1_134",
			"name": "SI:7 Agent",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Vance Kovacs",
			"attack": 3,
			"cardImage": "EX1_587.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Parlevent"
			},
			"health": 3,
			"id": "EX1_587",
			"name": "Windspeaker",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Lucas Graciano",
			"attack": 3,
			"cardImage": "CS2_106.png",
			"collectible": true,
			"cost": 2,
			"durability": 2,
			"fr": {
				"name": "Hache de guerre embrasée"
			},
			"id": "CS2_106",
			"name": "Fiery War Axe",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"type": "Weapon"
		},
		{
			"cardImage": "CS2_122e.png",
			"fr": {
				"name": "Amélioration"
			},
			"id": "CS2_122e",
			"name": "Enhanced",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA08_01h.png",
			"fr": {
				"name": "Archaedas (héroïque)"
			},
			"health": 30,
			"id": "LOEA08_01h",
			"name": "Heroic Archaedas",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA09_5.png",
			"cost": 4,
			"fr": {
				"name": "Pied à terre"
			},
			"id": "BRMA09_5",
			"name": "Dismount",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_tk33.png",
			"cost": 2,
			"fr": {
				"name": "FEU D’ENFER !"
			},
			"id": "EX1_tk33",
			"name": "INFERNO!",
			"playerClass": "Warlock",
			"set": "Expert1",
			"type": "Hero_power"
		},
		{
			"attack": 3,
			"cardImage": "CRED_32.png",
			"cost": 2,
			"fr": {
				"name": "Jerry Mascho"
			},
			"health": 2,
			"id": "CRED_32",
			"name": "Jerry Mascho",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"attack": 2,
			"cardImage": "EX1_133.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Lame de la perdition"
			},
			"id": "EX1_133",
			"name": "Perdition's Blade",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Weapon"
		},
		{
			"cardImage": "EX1_623e.png",
			"fr": {
				"name": "Infusion"
			},
			"id": "EX1_623e",
			"name": "Infusion",
			"playerClass": "Priest",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 3,
			"cardImage": "EX1_590.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chevalier de sang"
			},
			"health": 3,
			"id": "EX1_590",
			"name": "Blood Knight",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "TB_SPT_MinionKilled.png",
			"cost": 0,
			"fr": {
				"name": "Serviteurs tués pendant l’épreuve"
			},
			"health": 1,
			"id": "TB_SPT_MinionKilled",
			"name": "Trial Minions Killed",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_9.png",
			"fr": {
				"name": "Draconien chromatique"
			},
			"health": 30,
			"id": "BRMA12_9",
			"name": "Chromatic Dragonkin",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 5,
			"cardImage": "TB_KTRAF_08w.png",
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Lame runique massive"
			},
			"id": "TB_KTRAF_08w",
			"name": "Massive Runeblade",
			"set": "Tb",
			"type": "Weapon"
		},
		{
			"cardImage": "LOEA04_06a.png",
			"cost": 0,
			"fr": {
				"name": "Franchir d’un bond"
			},
			"id": "LOEA04_06a",
			"name": "Swing Across",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Alex Alexandrov",
			"cardImage": "OG_047b.png",
			"cost": 0,
			"fr": {
				"name": "Production d’écailles"
			},
			"id": "OG_047b",
			"name": "Evolve Scales",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "AT_047e.png",
			"fr": {
				"name": "Expérimenté"
			},
			"id": "AT_047e",
			"name": "Experienced",
			"playerClass": "Shaman",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Tom Baxa",
			"attack": 3,
			"cardImage": "EX1_083.png",
			"collectible": true,
			"cost": 3,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Suprétincelle"
			},
			"health": 3,
			"id": "EX1_083",
			"name": "Tinkmaster Overspark",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA06_2H_TB.png",
			"cost": 2,
			"fr": {
				"name": "Le chambellan"
			},
			"id": "BRMA06_2H_TB",
			"name": "The Majordomo",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "Mekka4t.png",
			"cost": 0,
			"fr": {
				"name": "Poulet"
			},
			"health": 1,
			"id": "Mekka4t",
			"name": "Chicken",
			"set": "Promo",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_Confused.png",
			"fr": {
				"name": "Destin"
			},
			"id": "TB_PickYourFate_Confused",
			"name": "Fate",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_086e.png",
			"fr": {
				"name": "Vilenie"
			},
			"id": "AT_086e",
			"name": "Villainy",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 7,
			"cardImage": "LOE_009.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Destructeur d’obsidienne"
			},
			"health": 7,
			"id": "LOE_009",
			"name": "Obsidian Destroyer",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Justin Thavirat",
			"attack": 0,
			"cardImage": "FP1_007.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Œuf de nérubien"
			},
			"health": 2,
			"id": "FP1_007",
			"name": "Nerubian Egg",
			"rarity": "Rare",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 2,
			"cardImage": "OG_083.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Mande-flamme du Crépuscule"
			},
			"health": 2,
			"id": "OG_083",
			"name": "Twilight Flamecaller",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "tt_010a.png",
			"cost": 0,
			"fr": {
				"name": "Courbe-sort"
			},
			"health": 3,
			"id": "tt_010a",
			"name": "Spellbender",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA15_2.png",
			"cost": 2,
			"fr": {
				"name": "Portail instable"
			},
			"id": "LOEA15_2",
			"name": "Unstable Portal",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "NEW1_026t.png",
			"cost": 0,
			"fr": {
				"name": "Apprenti pourpre"
			},
			"health": 1,
			"id": "NEW1_026t",
			"name": "Violet Apprentice",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Brad Vancata",
			"cardImage": "CS2_009.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Marque du fauve"
			},
			"id": "CS2_009",
			"name": "Mark of the Wild",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_027pH.png",
			"cost": 2,
			"fr": {
				"name": "MOUREZ, INSECTES !"
			},
			"id": "BRM_027pH",
			"name": "DIE, INSECTS!",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Steve Prescott",
			"attack": 2,
			"cardImage": "OG_338.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Nat le sombre pêcheur"
			},
			"health": 4,
			"id": "OG_338",
			"name": "Nat, the Darkfisher",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "AT_070.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Cap’taine céleste Kragg"
			},
			"health": 6,
			"id": "AT_070",
			"name": "Skycap'n Kragg",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "OG_072.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Périple dans les abîmes"
			},
			"id": "OG_072",
			"name": "Journey Below",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "OG_158e.png",
			"fr": {
				"name": "Secrets du culte"
			},
			"id": "OG_158e",
			"name": "Secrets of the Cult",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_145o.png",
			"fr": {
				"name": "Préparation"
			},
			"id": "EX1_145o",
			"name": "Preparation",
			"playerClass": "Rogue",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA13_3H.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "BRMA13_3H",
			"name": "Nefarian",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Mike Hayes",
			"cardImage": "GVG_061.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Régiment de bataille"
			},
			"id": "GVG_061",
			"name": "Muster for Battle",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "Ryan Metcalf",
			"attack": 2,
			"cardImage": "OG_161.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Voyant corrompu"
			},
			"health": 3,
			"id": "OG_161",
			"name": "Corrupted Seer",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_7_Ench_2nd.png",
			"fr": {
				"name": "Destin 7 : enchantement 2"
			},
			"id": "TB_PickYourFate_7_Ench_2nd",
			"name": "Fate 7 Ench 2nd",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA09_3a.png",
			"fr": {
				"name": "Mort de faim"
			},
			"id": "LOEA09_3a",
			"name": "Famished",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_016.png",
			"cost": 0,
			"fr": {
				"name": "Snake Ball"
			},
			"id": "XXX_016",
			"name": "Snake Ball",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_092e.png",
			"fr": {
				"name": "Bénédiction des rois"
			},
			"id": "CS2_092e",
			"name": "Blessing of Kings",
			"playerClass": "Paladin",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA12_7.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : bronze"
			},
			"id": "BRMA12_7",
			"name": "Brood Affliction: Bronze",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Daarken",
			"attack": 0,
			"cardImage": "EX1_335.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Rejeton de lumière"
			},
			"health": 5,
			"id": "EX1_335",
			"name": "Lightspawn",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TB_010e.png",
			"fr": {
				"name": "Choisir un des trois"
			},
			"id": "TB_010e",
			"name": "Choose One of Three",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_MechWar_Boss2_HeroPower.png",
			"cost": 2,
			"fr": {
				"name": "Ro’Boum junior"
			},
			"id": "TB_MechWar_Boss2_HeroPower",
			"name": "Boom Bot Jr.",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "TU4c_001.png",
			"fr": {
				"name": "Roi Mukla"
			},
			"health": 26,
			"id": "TU4c_001",
			"name": "King Mukla",
			"rarity": "Common",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "TB_BlingBrawl_Weapon.png",
			"cost": 1,
			"durability": 2,
			"fr": {
				"name": "Épée en mousse"
			},
			"id": "TB_BlingBrawl_Weapon",
			"name": "Foam Sword",
			"rarity": "Unknown_6",
			"set": "Tb",
			"type": "Weapon"
		},
		{
			"cardImage": "TU4c_008e.png",
			"fr": {
				"name": "Puissance de Mukla"
			},
			"id": "TU4c_008e",
			"name": "Might of Mukla",
			"set": "Missions",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_Mini_1e.png",
			"fr": {
				"name": "Miniature"
			},
			"id": "TB_Mini_1e",
			"name": "Miniature",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_026.png",
			"cost": 0,
			"fr": {
				"name": "Enable Emotes"
			},
			"id": "XXX_026",
			"name": "Enable Emotes",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_073e.png",
			"fr": {
				"name": "Sang froid"
			},
			"id": "CS2_073e",
			"name": "Cold Blood",
			"playerClass": "Rogue",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_073.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Sang froid"
			},
			"id": "CS2_073",
			"name": "Cold Blood",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "EX1_067.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Commandant d’Argent"
			},
			"health": 2,
			"id": "EX1_067",
			"name": "Argent Commander",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "hexfrog.png",
			"cost": 0,
			"fr": {
				"name": "Grenouille"
			},
			"health": 1,
			"id": "hexfrog",
			"name": "Frog",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Rafael Zanchetin",
			"cardImage": "OG_104.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Étreindre l’ombre"
			},
			"id": "OG_104",
			"name": "Embrace the Shadow",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Efrem Palacios",
			"attack": 2,
			"cardImage": "EX1_021.png",
			"collectible": true,
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Long-voyant de Thrallmar"
			},
			"health": 3,
			"id": "EX1_021",
			"name": "Thrallmar Farseer",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Alex Alexandrov",
			"cardImage": "OG_047a.png",
			"cost": 0,
			"fr": {
				"name": "Production d’aiguillons"
			},
			"id": "OG_047a",
			"name": "Evolve Spines",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Ron Spencer",
			"attack": 4,
			"cardImage": "NEW1_014.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Maîtresse du déguisement"
			},
			"health": 4,
			"id": "NEW1_014",
			"name": "Master of Disguise",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"attack": 8,
			"cardImage": "CS2_232.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Protecteur Écorcefer"
			},
			"health": 8,
			"id": "CS2_232",
			"name": "Ironbark Protector",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "James Zhang",
			"attack": 2,
			"cardImage": "AT_094.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Jongleur de flammes"
			},
			"health": 3,
			"id": "AT_094",
			"name": "Flame Juggler",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 4,
			"cardImage": "EX1_043.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Drake du Crépuscule"
			},
			"health": 1,
			"id": "EX1_043",
			"name": "Twilight Drake",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TB_FactionWar_Boss_Rag.png",
			"cost": 2,
			"fr": {
				"name": "MEURS, INSECTE !"
			},
			"id": "TB_FactionWar_Boss_Rag",
			"name": "DIE, INSECT!",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"artist": "Hideaki Takamura",
			"cardImage": "CS2_233.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Déluge de lames"
			},
			"id": "CS2_233",
			"name": "Blade Flurry",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_014t.png",
			"cost": 1,
			"fr": {
				"name": "Banane"
			},
			"id": "EX1_014t",
			"name": "Bananas",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "OG_162.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Disciple de C’Thun"
			},
			"health": 1,
			"id": "OG_162",
			"name": "Disciple of C'Thun",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Frank Cho",
			"cardImage": "CS2_075.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Attaque pernicieuse"
			},
			"id": "CS2_075",
			"name": "Sinister Strike",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Izzy Hoover",
			"cardImage": "OG_080f.png",
			"cost": 1,
			"fr": {
				"name": "Toxine de fleur de feu"
			},
			"id": "OG_080f",
			"name": "Firebloom Toxin",
			"playerClass": "Rogue",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA02_2H.png",
			"cost": 0,
			"fr": {
				"name": "Foule moqueuse"
			},
			"id": "BRMA02_2H",
			"name": "Jeering Crowd",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOEA10_2.png",
			"cost": 0,
			"fr": {
				"name": "Mrglmrgl MRGL !"
			},
			"id": "LOEA10_2",
			"name": "Mrglmrgl MRGL!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX12_02H.png",
			"cost": 0,
			"fr": {
				"name": "Décimer"
			},
			"id": "NAX12_02H",
			"name": "Decimate",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "Gabe from Penny Arcade",
			"attack": 6,
			"cardImage": "EX1_116.png",
			"collectible": true,
			"cost": 5,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Leeroy Jenkins"
			},
			"health": 2,
			"id": "EX1_116",
			"name": "Leeroy Jenkins",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA10_6e.png",
			"fr": {
				"name": "Rage aveugle"
			},
			"id": "BRMA10_6e",
			"name": "Blind With Rage",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "EX1_399.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Berserker gurubashi"
			},
			"health": 7,
			"id": "EX1_399",
			"name": "Gurubashi Berserker",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Matt Starbuck",
			"attack": 4,
			"cardImage": "CS2_151.png",
			"collectible": true,
			"cost": 5,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Champion de la Main d’argent"
			},
			"health": 4,
			"id": "CS2_151",
			"name": "Silver Hand Knight",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "EX1_506.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Chasse-marée murloc"
			},
			"health": 1,
			"id": "EX1_506",
			"name": "Murloc Tidehunter",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "AT_117e.png",
			"fr": {
				"name": "Cérémonie"
			},
			"id": "AT_117e",
			"name": "Ceremony",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 2,
			"cardImage": "AT_017.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gardien du Crépuscule"
			},
			"health": 6,
			"id": "AT_017",
			"name": "Twilight Guardian",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA13_2.png",
			"cost": 0,
			"fr": {
				"name": "Puissance des anciens"
			},
			"id": "LOEA13_2",
			"name": "Ancient Power",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX3_02_TB.png",
			"cost": 2,
			"fr": {
				"name": "Entoilage"
			},
			"id": "NAX3_02_TB",
			"name": "Web Wrap",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"attack": 5,
			"cardImage": "EX1_383t.png",
			"cost": 5,
			"durability": 3,
			"fr": {
				"name": "Porte-cendres"
			},
			"id": "EX1_383t",
			"name": "Ashbringer",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Weapon"
		},
		{
			"attack": 0,
			"cardImage": "TB_GiftExchange_Treasure.png",
			"cost": 0,
			"fr": {
				"name": "Cadeau du Voile d’hiver"
			},
			"health": 4,
			"id": "TB_GiftExchange_Treasure",
			"name": "Winter's Veil Gift",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Chris Seaman",
			"attack": 4,
			"cardImage": "OG_234.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Alchimiste de Sombre-Comté"
			},
			"health": 5,
			"id": "OG_234",
			"name": "Darkshire Alchemist",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 1,
			"cardImage": "GVG_098.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Infanterie de Gnomeregan"
			},
			"health": 4,
			"id": "GVG_098",
			"name": "Gnomeregan Infantry",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_087e.png",
			"fr": {
				"name": "Bénédiction de puissance"
			},
			"id": "CS2_087e",
			"name": "Blessing of Might",
			"playerClass": "Paladin",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_SPT_Minion2e.png",
			"fr": {
				"name": "Encouragé"
			},
			"id": "TB_SPT_Minion2e",
			"name": "Emboldened",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"attack": 3,
			"cardImage": "NAX15_03n.png",
			"cost": 4,
			"fr": {
				"name": "Garde de la Couronne de glace"
			},
			"health": 3,
			"id": "NAX15_03n",
			"name": "Guardian of Icecrown",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_012o.png",
			"fr": {
				"name": "Gorgé de mana"
			},
			"id": "NEW1_012o",
			"name": "Mana Gorged",
			"playerClass": "Mage",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_036e.png",
			"fr": {
				"name": "Puissance acquise"
			},
			"id": "GVG_036e",
			"name": "Powered",
			"playerClass": "Shaman",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "James Ryman",
			"attack": 5,
			"cardImage": "OG_340.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Soggoth le Rampant"
			},
			"health": 9,
			"id": "OG_340",
			"name": "Soggoth the Slitherer",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "NAX12_02.png",
			"cost": 2,
			"fr": {
				"name": "Décimer"
			},
			"id": "NAX12_02",
			"name": "Decimate",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"cardImage": "AT_132_WARRIOR.png",
			"cost": 2,
			"fr": {
				"name": "Défense stoïque"
			},
			"id": "AT_132_WARRIOR",
			"name": "Tank Up!",
			"playerClass": "Warrior",
			"set": "Tgt",
			"type": "Hero_power"
		},
		{
			"artist": "Dany Orizio",
			"attack": 2,
			"cardImage": "GVG_059.png",
			"collectible": true,
			"cost": 3,
			"durability": 3,
			"fr": {
				"name": "Rouage-marteau"
			},
			"id": "GVG_059",
			"name": "Coghammer",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Weapon"
		},
		{
			"cardImage": "LOEA16_10.png",
			"cost": 0,
			"fr": {
				"name": "Coupe de sang hakkari"
			},
			"id": "LOEA16_10",
			"name": "Hakkari Blood Goblet",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA07_29.png",
			"cost": 1,
			"fr": {
				"name": "Lancer des rochers"
			},
			"id": "LOEA07_29",
			"name": "Throw Rocks",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_254e.png",
			"fr": {
				"name": "Rassasié de secrets"
			},
			"id": "OG_254e",
			"name": "Secretly Sated",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_055e.png",
			"fr": {
				"name": "1000 Stats Enchant"
			},
			"id": "XXX_055e",
			"name": "1000 Stats Enchant",
			"set": "Cheat",
			"type": "Enchantment"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 6,
			"cardImage": "GVG_120.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Hemet Nesingwary"
			},
			"health": 3,
			"id": "GVG_120",
			"name": "Hemet Nesingwary",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "GVG_092t.png",
			"cost": 1,
			"fr": {
				"name": "Poulet"
			},
			"health": 1,
			"id": "GVG_092t",
			"name": "Chicken",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA09_2.png",
			"cost": 2,
			"fr": {
				"name": "Enragé !"
			},
			"id": "LOEA09_2",
			"name": "Enraged!",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_339.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Vol d’esprit"
			},
			"id": "EX1_339",
			"name": "Thoughtsteal",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Dany Orizio",
			"attack": 3,
			"cardImage": "GVG_044.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Char araignée"
			},
			"health": 4,
			"id": "GVG_044",
			"name": "Spider Tank",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "CS2_027.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Image miroir"
			},
			"id": "CS2_027",
			"name": "Mirror Image",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "TB_FactionWar_Hero_Nef.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "TB_FactionWar_Hero_Nef",
			"name": "Nefarian",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"cardImage": "TB_PickYourFate_10_EnchMinion.png",
			"fr": {
				"name": "Bonus"
			},
			"id": "TB_PickYourFate_10_EnchMinion",
			"name": "Bonus",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Konstad",
			"attack": 6,
			"cardImage": "OG_301.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Ancienne porte-bouclier"
			},
			"health": 6,
			"id": "OG_301",
			"name": "Ancient Shieldbearer",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Bernie Kang",
			"attack": 12,
			"cardImage": "NEW1_030.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Aile de mort"
			},
			"health": 12,
			"id": "NEW1_030",
			"name": "Deathwing",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 8,
			"cardImage": "BRMA09_5t.png",
			"cost": 3,
			"fr": {
				"name": "Gyth"
			},
			"health": 4,
			"id": "BRMA09_5t",
			"name": "Gyth",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "NAX8_03t.png",
			"cost": 1,
			"fr": {
				"name": "Jeune recrue spectrale"
			},
			"health": 2,
			"id": "NAX8_03t",
			"name": "Spectral Trainee",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"cardImage": "PART_007.png",
			"cost": 1,
			"fr": {
				"name": "Lames tourbillonnantes"
			},
			"id": "PART_007",
			"name": "Whirling Blades",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "Danny Beck",
			"attack": 4,
			"cardImage": "GVG_025.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Tricheur borgne"
			},
			"health": 1,
			"id": "GVG_025",
			"name": "One-eyed Cheat",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Warren Mahy",
			"attack": 2,
			"cardImage": "EX1_025.png",
			"collectible": true,
			"cost": 4,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Mécano de petit dragon"
			},
			"health": 4,
			"id": "EX1_025",
			"name": "Dragonling Mechanic",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "PRO_001b.png",
			"cost": 4,
			"fr": {
				"name": "Les voleurs, ça vous prend..."
			},
			"id": "PRO_001b",
			"name": "Rogues Do It...",
			"set": "Promo",
			"type": "Spell"
		},
		{
			"cardImage": "AT_109e.png",
			"fr": {
				"name": "Exalté"
			},
			"id": "AT_109e",
			"name": "Inspired",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_LevelUp_001.png",
			"cost": 2,
			"fr": {
				"name": "Gain de niveau !"
			},
			"id": "TB_LevelUp_001",
			"name": "Level Up!",
			"rarity": "Unknown_6",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"attack": 6,
			"cardImage": "OG_279.png",
			"cost": 10,
			"fr": {
				"name": "C’Thun"
			},
			"health": 6,
			"id": "OG_279",
			"name": "C'Thun",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_5H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : bleu"
			},
			"id": "BRMA12_5H",
			"name": "Brood Affliction: Blue",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "J. Curtis Cranford",
			"attack": 1,
			"cardImage": "FP1_002.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Rampante hantée"
			},
			"health": 2,
			"id": "FP1_002",
			"name": "Haunted Creeper",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "BRMA14_5.png",
			"cost": 1,
			"fr": {
				"name": "Toxitron"
			},
			"health": 3,
			"id": "BRMA14_5",
			"name": "Toxitron",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 7,
			"cardImage": "FP1_014.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Stalagg"
			},
			"health": 4,
			"id": "FP1_014",
			"name": "Stalagg",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_011.png",
			"cost": 0,
			"fr": {
				"name": "Summon a random Secret"
			},
			"id": "XXX_011",
			"name": "Summon a random Secret",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA02_10.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : compagnon"
			},
			"id": "LOEA02_10",
			"name": "Wish for Companionship",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_6_2nd.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : portails instables"
			},
			"id": "TB_PickYourFate_6_2nd",
			"name": "Dire Fate: Unstable Portals",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_308.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Feu de l’âme"
			},
			"id": "EX1_308",
			"name": "Soulfire",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "OG_116.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Folie galopante"
			},
			"id": "OG_116",
			"name": "Spreading Madness",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"cardImage": "EX1_132.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Œil pour œil"
			},
			"id": "EX1_132",
			"name": "Eye for an Eye",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_590e.png",
			"fr": {
				"name": "Ombres de M’uru"
			},
			"id": "EX1_590e",
			"name": "Shadows of M'uru",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "LOEA09_10.png",
			"cost": 2,
			"fr": {
				"name": "Naga affamé"
			},
			"health": 1,
			"id": "LOEA09_10",
			"name": "Hungry Naga",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "GVG_090.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Bombardier cinglé"
			},
			"health": 4,
			"id": "GVG_090",
			"name": "Madder Bomber",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_20H.png",
			"fr": {
				"name": "Bénédiction du soleil"
			},
			"id": "LOEA16_20H",
			"name": "Blessing of the Sun",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA12_1H.png",
			"fr": {
				"name": "Chromaggus"
			},
			"health": 60,
			"id": "BRMA12_1H",
			"name": "Chromaggus",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "EX1_564.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Manipulateur sans-visage"
			},
			"health": 3,
			"id": "EX1_564",
			"name": "Faceless Manipulator",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 3,
			"cardImage": "CS2_124.png",
			"collectible": true,
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Chevaucheur de loup"
			},
			"health": 1,
			"id": "CS2_124",
			"name": "Wolfrider",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA16_4.png",
			"cost": 1,
			"fr": {
				"name": "Gong réverbérant"
			},
			"id": "BRMA16_4",
			"name": "Reverberating Gong",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA14_2H.png",
			"cost": 0,
			"fr": {
				"name": "Armure de plates"
			},
			"id": "LOEA14_2H",
			"name": "Platemail Armor",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"attack": 8,
			"cardImage": "LOEA04_13bth.png",
			"cost": 4,
			"fr": {
				"name": "Garde d’Orsis"
			},
			"health": 8,
			"id": "LOEA04_13bth",
			"name": "Orsis Guard",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_41.png",
			"cost": 5,
			"fr": {
				"name": "Seyil Yoon"
			},
			"health": 9,
			"id": "CRED_41",
			"name": "Seyil Yoon",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA15_2H.png",
			"cost": 0,
			"fr": {
				"name": "Portail instable"
			},
			"id": "LOEA15_2H",
			"name": "Unstable Portal",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA13_1.png",
			"fr": {
				"name": "Seigneur Victor Nefarius"
			},
			"health": 30,
			"id": "BRMA13_1",
			"name": "Lord Victor Nefarius",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA14_1H.png",
			"fr": {
				"name": "Sentinelle (héroïque)"
			},
			"health": 30,
			"id": "LOEA14_1H",
			"name": "Heroic Sentinel",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_608.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Apprentie du sorcier"
			},
			"health": 2,
			"id": "EX1_608",
			"name": "Sorcerer's Apprentice",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Lucas Graciano",
			"cardImage": "CS2_092.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Bénédiction des rois"
			},
			"id": "CS2_092",
			"name": "Blessing of Kings",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Dave Allsop",
			"attack": 5,
			"cardImage": "AT_012.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Rejeton des Ombres"
			},
			"health": 4,
			"id": "AT_012",
			"name": "Spawn of Shadows",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Hideaki Takamura",
			"attack": 2,
			"cardImage": "BRM_010t2.png",
			"cost": 3,
			"fr": {
				"name": "Druidesse de la Flamme"
			},
			"health": 5,
			"id": "BRM_010t2",
			"name": "Druid of the Flame",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_034_H2.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu"
			},
			"id": "CS2_034_H2",
			"name": "Fireblast",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Hero_skins",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_020.png",
			"cost": 0,
			"fr": {
				"name": "Damage all but 1"
			},
			"id": "XXX_020",
			"name": "Damage all but 1",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "AT_034e.png",
			"fr": {
				"name": "Enduit perfide"
			},
			"id": "AT_034e",
			"name": "Laced",
			"playerClass": "Rogue",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 3,
			"cardImage": "OG_247.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Worgen corrompu"
			},
			"health": 1,
			"id": "OG_247",
			"name": "Twisted Worgen",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "XXX_095.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - All Charge!"
			},
			"health": 1,
			"id": "XXX_095",
			"name": "AI Buddy - All Charge!",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA12_2H.png",
			"cost": 0,
			"fr": {
				"name": "Perle des marées"
			},
			"id": "LOEA12_2H",
			"name": "Pearl of the Tides",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_PickYourFate_7_2nd.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : explosion de mana"
			},
			"id": "TB_PickYourFate_7_2nd",
			"name": "Dire Fate: Manaburst",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "OG_222e.png",
			"fr": {
				"name": "Ralliement"
			},
			"id": "OG_222e",
			"name": "Rally",
			"playerClass": "Paladin",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Richard Wright",
			"attack": 0,
			"cardImage": "LOE_024t.png",
			"cost": 4,
			"fr": {
				"name": "Rocher roulant"
			},
			"health": 4,
			"id": "LOE_024t",
			"name": "Rolling Boulder",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_334e.png",
			"fr": {
				"name": "Folie de l’ombre"
			},
			"id": "EX1_334e",
			"name": "Shadow Madness",
			"playerClass": "Priest",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA14_10H.png",
			"cost": 2,
			"fr": {
				"name": "Activation !"
			},
			"id": "BRMA14_10H",
			"name": "Activate!",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"attack": 2,
			"cardImage": "AT_042t.png",
			"cost": 2,
			"fr": {
				"name": "Lion dent-de-sabre"
			},
			"health": 1,
			"id": "AT_042t",
			"name": "Sabertooth Lion",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_030b.png",
			"cost": 0,
			"fr": {
				"name": "Mode Char"
			},
			"id": "GVG_030b",
			"name": "Tank Mode",
			"playerClass": "Druid",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "Andrew Hou",
			"attack": 3,
			"cardImage": "AT_007.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Jette-sorts"
			},
			"health": 4,
			"id": "AT_007",
			"name": "Spellslinger",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"cardImage": "CS2_013.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Croissance sauvage"
			},
			"id": "CS2_013",
			"name": "Wild Growth",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_596e.png",
			"fr": {
				"name": "Feu démoniaque"
			},
			"id": "EX1_596e",
			"name": "Demonfire",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Arthur Gimaldinov",
			"attack": 2,
			"cardImage": "AT_042.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Druidesse du Sabre"
			},
			"health": 1,
			"id": "AT_042",
			"name": "Druid of the Saber",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_001e.png",
			"fr": {
				"name": "Garde rapprochée"
			},
			"id": "EX1_001e",
			"name": "Warded",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_029e.png",
			"fr": {
				"name": "Lame effilée"
			},
			"id": "AT_029e",
			"name": "Extra Stabby",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Craig Mullins",
			"attack": 2,
			"cardImage": "LOE_118.png",
			"collectible": true,
			"cost": 1,
			"durability": 3,
			"fr": {
				"name": "Lame maudite"
			},
			"id": "LOE_118",
			"name": "Cursed Blade",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Weapon"
		},
		{
			"artist": "Linggar Bramanty",
			"cardImage": "EX1_538.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Lâcher les chiens"
			},
			"id": "EX1_538",
			"name": "Unleash the Hounds",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Samwise",
			"attack": 6,
			"cardImage": "GVG_088.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Ninja ogre"
			},
			"health": 6,
			"id": "GVG_088",
			"name": "Ogre Ninja",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Milivoj Ceran",
			"cardImage": "LOE_019t.png",
			"cost": 2,
			"fr": {
				"name": "Carte du singe doré"
			},
			"id": "LOE_019t",
			"name": "Map to the Golden Monkey",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Grace Liu",
			"cardImage": "CS2_011.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Rugissement sauvage"
			},
			"id": "CS2_011",
			"name": "Savage Roar",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_274e.png",
			"fr": {
				"name": "Puissance brute !"
			},
			"id": "EX1_274e",
			"name": "Raw Power!",
			"playerClass": "Mage",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_KTRAF_HP_KT_3.png",
			"cost": 2,
			"fr": {
				"name": "Nécromancie"
			},
			"id": "TB_KTRAF_HP_KT_3",
			"name": "Necromancy",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"artist": "Rafael Zanchetin",
			"attack": 3,
			"cardImage": "OG_109.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Archiviste de Sombre-Comté"
			},
			"health": 2,
			"id": "OG_109",
			"name": "Darkshire Librarian",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_111e.png",
			"fr": {
				"name": "All Charge, All Windfury, All The Time"
			},
			"id": "XXX_111e",
			"name": "All Charge, All Windfury, All The Time",
			"set": "Cheat",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "CS2_mirror.png",
			"cost": 0,
			"fr": {
				"name": "Image miroir"
			},
			"health": 2,
			"id": "CS2_mirror",
			"name": "Mirror Image",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "LOE_113e.png",
			"fr": {
				"name": "Mrglllroaarrrglrur !"
			},
			"id": "LOE_113e",
			"name": "Mrglllraawrrrglrur!",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Sedhayu Ardian",
			"attack": 4,
			"cardImage": "EX1_089.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Golem arcanique"
			},
			"health": 4,
			"id": "EX1_089",
			"name": "Arcane Golem",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_128e.png",
			"fr": {
				"name": "Dissimulé"
			},
			"id": "EX1_128e",
			"name": "Concealed",
			"playerClass": "Rogue",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "LOEA04_25.png",
			"cost": 8,
			"fr": {
				"name": "Statue vengeresse"
			},
			"health": 9,
			"id": "LOEA04_25",
			"name": "Seething Statue",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_027e.png",
			"fr": {
				"name": "Yarrr !"
			},
			"id": "NEW1_027e",
			"name": "Yarrr!",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_056.png",
			"cost": 0,
			"fr": {
				"name": "Silence and Destroy All Minions"
			},
			"id": "XXX_056",
			"name": "Silence and Destroy All Minions",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "OG_044a.png",
			"cost": 5,
			"fr": {
				"name": "Druide de la Griffe"
			},
			"health": 6,
			"id": "OG_044a",
			"name": "Druid of the Claw",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 3,
			"cardImage": "OG_145.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Psych-o-tron"
			},
			"health": 4,
			"id": "OG_145",
			"name": "Psych-o-Tron",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_226e.png",
			"fr": {
				"name": "Bannière loup-de-givre"
			},
			"id": "CS2_226e",
			"name": "Frostwolf Banner",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_313e.png",
			"fr": {
				"name": "Perturbé"
			},
			"id": "OG_313e",
			"name": "Addled",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Graven Tung",
			"cardImage": "EX1_144.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Pas de l’ombre"
			},
			"id": "EX1_144",
			"name": "Shadowstep",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_6.png",
			"cost": 0,
			"fr": {
				"name": "Éclat de Sulfuras"
			},
			"id": "LOEA16_6",
			"name": "Shard of Sulfuras",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA03_2.png",
			"cost": 2,
			"fr": {
				"name": "Puissance de Ragnaros"
			},
			"id": "BRMA03_2",
			"name": "Power of the Firelord",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "CS2_236e.png",
			"fr": {
				"name": "Esprit divin"
			},
			"id": "CS2_236e",
			"name": "Divine Spirit",
			"playerClass": "Priest",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_Superfriends002e.png",
			"fr": {
				"name": "Pioche Jeu offensif"
			},
			"id": "TB_Superfriends002e",
			"name": "Draw Offensive Play",
			"playerClass": "Rogue",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "CRED_03.png",
			"cost": 3,
			"fr": {
				"name": "Bob Fitch"
			},
			"health": 4,
			"id": "CRED_03",
			"name": "Bob Fitch",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "TB_013_PickOnCurve2.png",
			"fr": {
				"name": "Player Choice Enchant On Curve2"
			},
			"id": "TB_013_PickOnCurve2",
			"name": "Player Choice Enchant On Curve2",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_063e.png",
			"fr": {
				"name": "Corruption"
			},
			"id": "CS2_063e",
			"name": "Corruption",
			"playerClass": "Warlock",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Garner",
			"attack": 7,
			"cardImage": "GVG_110.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Dr Boum"
			},
			"health": 7,
			"id": "GVG_110",
			"name": "Dr. Boom",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA06_03e.png",
			"fr": {
				"name": "Animé"
			},
			"id": "LOEA06_03e",
			"name": "Animated",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "CS2_041.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Guérison ancestrale"
			},
			"id": "CS2_041",
			"name": "Ancestral Healing",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_412e.png",
			"fr": {
				"name": "Enragé"
			},
			"id": "EX1_412e",
			"name": "Enraged",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "TU4c_005.png",
			"cost": 2,
			"fr": {
				"name": "Gnome caché"
			},
			"health": 3,
			"id": "TU4c_005",
			"name": "Hidden Gnome",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"attack": 9,
			"cardImage": "CRED_16.png",
			"cost": 7,
			"fr": {
				"name": "Hamilton Chu"
			},
			"health": 5,
			"id": "CRED_16",
			"name": "Hamilton Chu",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_061.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Drain de vie"
			},
			"id": "CS2_061",
			"name": "Drain Life",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"attack": 1,
			"cardImage": "OG_272.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Invocateur du Crépuscule"
			},
			"health": 1,
			"id": "OG_272",
			"name": "Twilight Summoner",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "TB_CoOpBossSpell_2.png",
			"cost": 0,
			"fr": {
				"name": "Salve de bombes"
			},
			"id": "TB_CoOpBossSpell_2",
			"name": "Bomb Salvo",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Nutthapon Petchthai",
			"attack": 4,
			"cardImage": "AT_122.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gormok l’Empaleur"
			},
			"health": 4,
			"id": "AT_122",
			"name": "Gormok the Impaler",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Luke Mancini",
			"attack": 3,
			"cardImage": "GVG_117.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Gazleu"
			},
			"health": 6,
			"id": "GVG_117",
			"name": "Gazlowe",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "NAX9_03.png",
			"cost": 3,
			"fr": {
				"name": "Thane Korth’azz"
			},
			"health": 7,
			"id": "NAX9_03",
			"name": "Thane Korth'azz",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "OG_254.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mange-secrets"
			},
			"health": 4,
			"id": "OG_254",
			"name": "Eater of Secrets",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_7H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : bronze"
			},
			"id": "BRMA12_7H",
			"name": "Brood Affliction: Bronze",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Ryan Metcalf",
			"attack": 3,
			"cardImage": "AT_028.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Chevaucheur pandashan"
			},
			"health": 7,
			"id": "AT_028",
			"name": "Shado-Pan Rider",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_12_Ench.png",
			"fr": {
				"name": "Destin 12 : enchantement, Confusion"
			},
			"id": "TB_PickYourFate_12_Ench",
			"name": "Fate 12 Ench, Confuse",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"attack": 10,
			"cardImage": "BRMA14_12.png",
			"cost": 5,
			"fr": {
				"name": "Magmagueule"
			},
			"health": 2,
			"id": "BRMA14_12",
			"name": "Magmaw",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "A. J. Nazzaro",
			"attack": 9,
			"cardImage": "OG_173.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Sang de l’Ancien"
			},
			"health": 9,
			"id": "OG_173",
			"name": "Blood of The Ancient One",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_87.png",
			"cost": 3,
			"fr": {
				"name": "Moira Barbe-de-Bronze"
			},
			"health": 3,
			"id": "BRMC_87",
			"name": "Moira Bronzebeard",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_363e.png",
			"fr": {
				"name": "Bénédiction de sagesse"
			},
			"id": "EX1_363e",
			"name": "Blessing of Wisdom",
			"playerClass": "Paladin",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 4,
			"cardImage": "EX1_110.png",
			"collectible": true,
			"cost": 6,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Cairne Sabot-de-Sang"
			},
			"health": 5,
			"id": "EX1_110",
			"name": "Cairne Bloodhoof",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 5,
			"cardImage": "EX1_313.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Seigneur des abîmes"
			},
			"health": 6,
			"id": "EX1_313",
			"name": "Pit Lord",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Velvet Engine",
			"attack": 5,
			"cardImage": "AT_045.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Aviana"
			},
			"health": 5,
			"id": "AT_045",
			"name": "Aviana",
			"playerClass": "Druid",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "TB_SPT_HeroPowerUsed.png",
			"cost": 0,
			"fr": {
				"name": "Pouvoirs héroïques utilisés pendant l’épreuve"
			},
			"health": 1,
			"id": "TB_SPT_HeroPowerUsed",
			"name": "Trial Hero Power Used",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "TB_KTRAF_5.png",
			"cost": 4,
			"fr": {
				"name": "Grande veuve Faerlina"
			},
			"health": 5,
			"id": "TB_KTRAF_5",
			"name": "Grand Widow Faerlina",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_4_EnchMinion.png",
			"fr": {
				"name": "Destin"
			},
			"id": "TB_PickYourFate_4_EnchMinion",
			"name": "Fate",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Chris Seaman",
			"attack": 4,
			"cardImage": "GVG_111t.png",
			"cost": 8,
			"fr": {
				"name": "V-07-TR-0N"
			},
			"health": 8,
			"id": "GVG_111t",
			"name": "V-07-TR-0N",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "LOEA04_13bt.png",
			"cost": 4,
			"fr": {
				"name": "Garde d’Orsis"
			},
			"health": 5,
			"id": "LOEA04_13bt",
			"name": "Orsis Guard",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_6H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : noir"
			},
			"id": "BRMA12_6H",
			"name": "Brood Affliction: Black",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_11_Ench.png",
			"fr": {
				"name": "Fate 11 Ench. Murloc"
			},
			"id": "TB_PickYourFate_11_Ench",
			"name": "Fate 11 Ench. Murloc",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "TU4a_005.png",
			"cost": 4,
			"fr": {
				"name": "Gnoll massif"
			},
			"health": 2,
			"id": "TU4a_005",
			"name": "Massive Gnoll",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_Windfury.png",
			"fr": {
				"name": "Destin"
			},
			"id": "TB_PickYourFate_Windfury",
			"name": "Fate",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 1,
			"cardImage": "FP1_031.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Baron Vaillefendre"
			},
			"health": 7,
			"id": "FP1_031",
			"name": "Baron Rivendare",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_1.png",
			"fr": {
				"name": "Chromaggus"
			},
			"health": 30,
			"id": "BRMA12_1",
			"name": "Chromaggus",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "TU4c_008.png",
			"cost": 3,
			"fr": {
				"name": "Volonté de Mukla"
			},
			"id": "TU4c_008",
			"name": "Will of Mukla",
			"rarity": "Common",
			"set": "Missions",
			"type": "Spell"
		},
		{
			"artist": "John Polidora",
			"attack": 3,
			"cardImage": "EX1_301.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Gangregarde"
			},
			"health": 5,
			"id": "EX1_301",
			"name": "Felguard",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_036e.png",
			"fr": {
				"name": "Cri de commandement"
			},
			"id": "NEW1_036e",
			"name": "Commanding Shout",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Jun Kang",
			"attack": 2,
			"cardImage": "GVG_087.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Sniper de Gentepression"
			},
			"health": 3,
			"id": "GVG_087",
			"name": "Steamwheedle Sniper",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_032a.png",
			"cost": 0,
			"fr": {
				"name": "Don de mana"
			},
			"id": "GVG_032a",
			"name": "Gift of Mana",
			"playerClass": "Druid",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA07_3.png",
			"cost": 4,
			"fr": {
				"name": "CASSE-TÊTE"
			},
			"id": "BRMA07_3",
			"name": "TIME FOR SMASH",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "TB_BlingBrawl_Blade1e.png",
			"fr": {
				"name": "Lame de Bling-o-tron"
			},
			"id": "TB_BlingBrawl_Blade1e",
			"name": "Blingtron's Blade",
			"rarity": "Unknown_6",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_573a.png",
			"cost": 0,
			"fr": {
				"name": "Faveur du demi-dieu"
			},
			"id": "EX1_573a",
			"name": "Demigod's Favor",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 5,
			"cardImage": "AT_092.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Enragé de glace"
			},
			"health": 2,
			"id": "AT_092",
			"name": "Ice Rager",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "CS2_087.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Bénédiction de puissance"
			},
			"id": "CS2_087",
			"name": "Blessing of Might",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "NAX14_04.png",
			"cost": 5,
			"fr": {
				"name": "Froid absolu"
			},
			"id": "NAX14_04",
			"name": "Pure Cold",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "TB_KTRAF_1.png",
			"cost": 4,
			"fr": {
				"name": "Anub’Rekhan"
			},
			"health": 5,
			"id": "TB_KTRAF_1",
			"name": "Anub'Rekhan",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA02_2_2c_TB.png",
			"cost": 0,
			"fr": {
				"name": "Foule moqueuse"
			},
			"id": "BRMA02_2_2c_TB",
			"name": "Jeering Crowd",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 3,
			"cardImage": "AT_083.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chevaucheur de faucon-dragon"
			},
			"health": 3,
			"id": "AT_083",
			"name": "Dragonhawk Rider",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_047.png",
			"cost": 0,
			"fr": {
				"name": "Destroy Deck"
			},
			"id": "XXX_047",
			"name": "Destroy Deck",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Jimmy Lo",
			"cardImage": "CS2_084.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Marque du chasseur"
			},
			"id": "CS2_084",
			"name": "Hunter's Mark",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_2.png",
			"cost": 0,
			"fr": {
				"name": "Destin : bananes"
			},
			"id": "TB_PickYourFate_2",
			"name": "Fate: Bananas",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 6,
			"cardImage": "AT_098.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Mangesort prodigieuse"
			},
			"health": 5,
			"id": "AT_098",
			"name": "Sideshow Spelleater",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Sam Nielson",
			"attack": 5,
			"cardImage": "OG_122.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Mukla, tyran du val"
			},
			"health": 5,
			"id": "OG_122",
			"name": "Mukla, Tyrant of the Vale",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "PRO_001at.png",
			"cost": 0,
			"fr": {
				"name": "Murloc"
			},
			"health": 1,
			"id": "PRO_001at",
			"name": "Murloc",
			"set": "Promo",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_7_EnchMiniom2nd.png",
			"fr": {
				"name": "Destin"
			},
			"id": "TB_PickYourFate_7_EnchMiniom2nd",
			"name": "Fate",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 2,
			"cardImage": "GVG_060.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Intendant"
			},
			"health": 5,
			"id": "GVG_060",
			"name": "Quartermaster",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_004e.png",
			"fr": {
				"name": "Mot de pouvoir : Bouclier"
			},
			"id": "CS2_004e",
			"name": "Power Word: Shield",
			"playerClass": "Priest",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX13_01H.png",
			"fr": {
				"name": "Thaddius"
			},
			"health": 45,
			"id": "NAX13_01H",
			"name": "Thaddius",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "EX1_tk31.png",
			"fr": {
				"name": "Contrôle mental"
			},
			"id": "EX1_tk31",
			"name": "Mind Controlling",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA07_1H.png",
			"fr": {
				"name": "Généralissime Omokk"
			},
			"health": 30,
			"id": "BRMA07_1H",
			"name": "Highlord Omokk",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "AT_037b.png",
			"cost": 0,
			"fr": {
				"name": "Racines vivantes"
			},
			"id": "AT_037b",
			"name": "Living Roots",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Peerasak Senalai",
			"cardImage": "PART_005.png",
			"cost": 1,
			"fr": {
				"name": "Liquide de refroidissement"
			},
			"id": "PART_005",
			"name": "Emergency Coolant",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "TU4e_001.png",
			"fr": {
				"name": "Illidan Hurlorage"
			},
			"health": 30,
			"id": "TU4e_001",
			"name": "Illidan Stormrage",
			"playerClass": "Hunter",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "TB_KTRAF_2.png",
			"cost": 4,
			"fr": {
				"name": "Dame Blaumeux"
			},
			"health": 7,
			"id": "TB_KTRAF_2",
			"name": "Lady Blaumeux",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "NEW1_009.png",
			"cost": 1,
			"fr": {
				"name": "Totem de soins"
			},
			"health": 2,
			"id": "NEW1_009",
			"name": "Healing Totem",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "CS2_197.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Ogre-magi"
			},
			"health": 4,
			"id": "CS2_197",
			"name": "Ogre Magi",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Aleksi Briclot",
			"attack": 7,
			"cardImage": "GVG_007.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Léviathan des flammes"
			},
			"health": 7,
			"id": "GVG_007",
			"name": "Flame Leviathan",
			"playerClass": "Mage",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA04_23.png",
			"cost": 7,
			"fr": {
				"name": "Insecte géant"
			},
			"health": 3,
			"id": "LOEA04_23",
			"name": "Giant Insect",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 1,
			"cardImage": "GVG_013.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Maître des rouages"
			},
			"health": 2,
			"id": "GVG_013",
			"name": "Cogmaster",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "TB_AllMinionsTauntCharge.png",
			"fr": {
				"name": "Confère Provocation et Charge"
			},
			"id": "TB_AllMinionsTauntCharge",
			"name": "Give Taunt and Charge",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA16_9.png",
			"cost": 0,
			"fr": {
				"name": "Grèves abandonnées de Lothar"
			},
			"id": "LOEA16_9",
			"name": "Lothar's Left Greave",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "XXX_024.png",
			"cost": 0,
			"fr": {
				"name": "Damage Reflector"
			},
			"health": 10,
			"id": "XXX_024",
			"name": "Damage Reflector",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 7,
			"cardImage": "EX1_411.png",
			"collectible": true,
			"cost": 7,
			"durability": 1,
			"fr": {
				"name": "Hurlesang"
			},
			"id": "EX1_411",
			"name": "Gorehowl",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Weapon"
		},
		{
			"cardImage": "HRW02_1e.png",
			"cost": 1,
			"fr": {
				"name": "Puissance des rouages"
			},
			"id": "HRW02_1e",
			"name": "Overclock",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 7,
			"cardImage": "LOE_110.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Ombre ancienne"
			},
			"health": 4,
			"id": "LOE_110",
			"name": "Ancient Shade",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Hideaki Takamura",
			"attack": 3,
			"cardImage": "AT_066.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Aspirant d’Orgrimmar"
			},
			"health": 3,
			"id": "AT_066",
			"name": "Orgrimmar Aspirant",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 3,
			"cardImage": "GVG_069.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Robot de soins antique"
			},
			"health": 3,
			"id": "GVG_069",
			"name": "Antique Healbot",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "TB_BlingBrawl_Hero1.png",
			"fr": {
				"name": "Valeera Sanguinar"
			},
			"health": 30,
			"id": "TB_BlingBrawl_Hero1",
			"name": "Valeera Sanguinar",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"attack": 5,
			"cardImage": "LOEA09_8H.png",
			"cost": 5,
			"fr": {
				"name": "Garde ondulant"
			},
			"health": 7,
			"id": "LOEA09_8H",
			"name": "Slithering Guard",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "OG_150e.png",
			"fr": {
				"name": "Enragé"
			},
			"id": "OG_150e",
			"name": "Enraged",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_022a.png",
			"fr": {
				"name": "Huile d’affûtage de Bricoleur"
			},
			"id": "GVG_022a",
			"name": "Tinker's Sharpsword Oil",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "CS2_104.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Saccager"
			},
			"id": "CS2_104",
			"name": "Rampage",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_160a.png",
			"cost": 0,
			"fr": {
				"name": "Invocation de panthère"
			},
			"id": "EX1_160a",
			"name": "Summon a Panther",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA09_1.png",
			"fr": {
				"name": "Rend Main-Noire"
			},
			"health": 30,
			"id": "BRMA09_1",
			"name": "Rend Blackhand",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA02_01.png",
			"fr": {
				"name": "Zinaar"
			},
			"health": 30,
			"id": "LOEA02_01",
			"name": "Zinaar",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "James Ryman",
			"attack": 3,
			"cardImage": "NEW1_026.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Enseignante pourpre"
			},
			"health": 5,
			"id": "NEW1_026",
			"name": "Violet Teacher",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_014e.png",
			"fr": {
				"name": "Rage puissante"
			},
			"id": "BRM_014e",
			"name": "Power Rager",
			"playerClass": "Hunter",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_021e.png",
			"fr": {
				"name": "Gangrerage"
			},
			"id": "AT_021e",
			"name": "Felrage",
			"playerClass": "Warlock",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "LOEA01_12.png",
			"cost": 3,
			"fr": {
				"name": "Hoplite tol’vir"
			},
			"health": 2,
			"id": "LOEA01_12",
			"name": "Tol'vir Hoplite",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "TU4e_005.png",
			"cost": 3,
			"fr": {
				"name": "Explosion de flammes"
			},
			"id": "TU4e_005",
			"name": "Flame Burst",
			"rarity": "Common",
			"set": "Missions",
			"type": "Spell"
		},
		{
			"artist": "Jim Pavelec",
			"cardImage": "CS2_236.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Esprit divin"
			},
			"id": "CS2_236",
			"name": "Divine Spirit",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "BRMA14_7.png",
			"cost": 3,
			"fr": {
				"name": "Électron"
			},
			"health": 5,
			"id": "BRMA14_7",
			"name": "Electron",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Milivoj Ceran",
			"cardImage": "OG_090.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Grimoire de cabaliste"
			},
			"id": "OG_090",
			"name": "Cabalist's Tome",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "GVG_110t.png",
			"cost": 1,
			"fr": {
				"name": "Ro’Boum"
			},
			"health": 1,
			"id": "GVG_110t",
			"name": "Boom Bot",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 5,
			"cardImage": "AT_023.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Écraseur du Vide"
			},
			"health": 4,
			"id": "AT_023",
			"name": "Void Crusher",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "E.M. Gist",
			"attack": 6,
			"cardImage": "CS2_162.png",
			"collectible": true,
			"cost": 6,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Seigneur de l’arène"
			},
			"health": 5,
			"id": "CS2_162",
			"name": "Lord of the Arena",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Lars Grant-West",
			"cardImage": "CS2_053e.png",
			"fr": {
				"name": "Double vue"
			},
			"id": "CS2_053e",
			"name": "Far Sight",
			"playerClass": "Shaman",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 4,
			"cardImage": "OG_290.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Ancien héraut"
			},
			"health": 6,
			"id": "OG_290",
			"name": "Ancient Harbinger",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_30.png",
			"cost": 0,
			"fr": {
				"name": "Les ténèbres"
			},
			"id": "LOEA04_30",
			"name": "The Darkness",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "OG_045a.png",
			"fr": {
				"name": "Spores nérubiennes"
			},
			"id": "OG_045a",
			"name": "Nerubian Spores",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_145.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Préparation"
			},
			"id": "EX1_145",
			"name": "Preparation",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_98.png",
			"cost": 6,
			"fr": {
				"name": "Tranchetripe"
			},
			"health": 12,
			"id": "BRMC_98",
			"name": "Razorgore",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "BRMC_93.png",
			"cost": 3,
			"fr": {
				"name": "Système de défense Omnitron"
			},
			"id": "BRMC_93",
			"name": "Omnotron Defense System",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "CRED_25.png",
			"cost": 4,
			"fr": {
				"name": "Elizabeth Cho"
			},
			"health": 4,
			"id": "CRED_25",
			"name": "Elizabeth Cho",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Matthew O'Connor",
			"cardImage": "OG_080d.png",
			"cost": 1,
			"fr": {
				"name": "Toxine d’églantine"
			},
			"id": "OG_080d",
			"name": "Briarthorn Toxin",
			"playerClass": "Rogue",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Ludo Lullabi",
			"attack": 6,
			"cardImage": "EX1_112.png",
			"collectible": true,
			"cost": 6,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Gelbin Mekkanivelle"
			},
			"health": 6,
			"id": "EX1_112",
			"name": "Gelbin Mekkatorque",
			"rarity": "Legendary",
			"set": "Promo",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA15_1.png",
			"fr": {
				"name": "Rafaam"
			},
			"health": 30,
			"id": "LOEA15_1",
			"name": "Rafaam",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 7,
			"cardImage": "BRM_009.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Lourdaud volcanique"
			},
			"health": 8,
			"id": "BRM_009",
			"name": "Volcanic Lumberer",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 11,
			"cardImage": "FP1_014t.png",
			"cost": 10,
			"fr": {
				"name": "Thaddius"
			},
			"health": 11,
			"id": "FP1_014t",
			"name": "Thaddius",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "HRW02_1.png",
			"cost": 10,
			"fr": {
				"name": "Maître des rouages Mécazod"
			},
			"health": 80,
			"id": "HRW02_1",
			"name": "Gearmaster Mechazod",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "NAX13_05H.png",
			"cost": 5,
			"fr": {
				"name": "Stalagg"
			},
			"health": 4,
			"id": "NAX13_05H",
			"name": "Stalagg",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Adam Byrne",
			"attack": 3,
			"cardImage": "OG_334.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Acolyte capuchonnée"
			},
			"health": 6,
			"id": "OG_334",
			"name": "Hooded Acolyte",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_622.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Mot de l’ombre : Mort"
			},
			"id": "EX1_622",
			"name": "Shadow Word: Death",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "AT_013e.png",
			"fr": {
				"name": "Mot de pouvoir : Gloire"
			},
			"id": "AT_013e",
			"name": "Power Word: Glory",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_132_MAGE.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu rang 2"
			},
			"id": "AT_132_MAGE",
			"name": "Fireblast Rank 2",
			"playerClass": "Mage",
			"set": "Tgt",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOEA09_3c.png",
			"cost": 0,
			"fr": {
				"name": "Faim"
			},
			"id": "LOEA09_3c",
			"name": "Getting Hungry",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_RandHero2_001.png",
			"fr": {
				"name": "TB_EnchWhosTheBossNow"
			},
			"id": "TB_RandHero2_001",
			"name": "TB_EnchWhosTheBossNow",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA15_1.png",
			"fr": {
				"name": "Maloriak"
			},
			"health": 30,
			"id": "BRMA15_1",
			"name": "Maloriak",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Matt Dixon",
			"attack": 4,
			"cardImage": "EX1_095.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Commissaire-priseur"
			},
			"health": 4,
			"id": "EX1_095",
			"name": "Gadgetzan Auctioneer",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "NAX1_03.png",
			"cost": 2,
			"fr": {
				"name": "Nérubien"
			},
			"health": 1,
			"id": "NAX1_03",
			"name": "Nerubian",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "TB_SPT_Boss.png",
			"fr": {
				"name": "Hurlevent"
			},
			"health": 1,
			"id": "TB_SPT_Boss",
			"name": "City of Stormwind",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA04_4H.png",
			"cost": 3,
			"fr": {
				"name": "Déchaînement"
			},
			"id": "BRMA04_4H",
			"name": "Rock Out",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Steve Ellis",
			"cardImage": "CS1_130.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Châtiment sacré"
			},
			"id": "CS1_130",
			"name": "Holy Smite",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "GVG_084.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Machine volante"
			},
			"health": 4,
			"id": "GVG_084",
			"name": "Flying Machine",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA04_24.png",
			"cost": 8,
			"fr": {
				"name": "Garde du temple anubisath"
			},
			"health": 10,
			"id": "LOEA04_24",
			"name": "Anubisath Temple Guard",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"attack": 4,
			"cardImage": "OG_335.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Ombre mouvante"
			},
			"health": 3,
			"id": "OG_335",
			"name": "Shifting Shade",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "LOE_118e.png",
			"fr": {
				"name": "Lame maudite"
			},
			"id": "LOE_118e",
			"name": "Cursed Blade",
			"playerClass": "Warrior",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA14_2H.png",
			"cost": 0,
			"fr": {
				"name": "Activer Arcanotron"
			},
			"id": "BRMA14_2H",
			"name": "Activate Arcanotron",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Ben Olson",
			"attack": 2,
			"cardImage": "FP1_009.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Seigneur de la mort"
			},
			"health": 8,
			"id": "FP1_009",
			"name": "Deathlord",
			"rarity": "Rare",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_295o.png",
			"fr": {
				"name": "Bloc de glace"
			},
			"id": "EX1_295o",
			"name": "Ice Block",
			"playerClass": "Mage",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Mike Sass",
			"cardImage": "AT_005.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Métamorphose : sanglier"
			},
			"id": "AT_005",
			"name": "Polymorph: Boar",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Peter Stapleton",
			"cardImage": "OG_211.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Appel de la nature"
			},
			"id": "OG_211",
			"name": "Call of the Wild",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Steve Hui",
			"cardImage": "EX1_128.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Dissimuler"
			},
			"id": "EX1_128",
			"name": "Conceal",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Doug Alexander",
			"cardImage": "EX1_169.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Innervation"
			},
			"id": "EX1_169",
			"name": "Innervate",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_8rand.png",
			"cost": 0,
			"fr": {
				"name": "Destin : Armure"
			},
			"id": "TB_PickYourFate_8rand",
			"name": "Fate: Armor",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Peter Stapleton",
			"attack": 2,
			"cardImage": "OG_256.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Rejeton de N’Zoth"
			},
			"health": 2,
			"id": "OG_256",
			"name": "Spawn of N'Zoth",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Cole Eastburn",
			"attack": 4,
			"cardImage": "OG_188.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Tisse-ambre klaxxi"
			},
			"health": 5,
			"id": "OG_188",
			"name": "Klaxxi Amber-Weaver",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Dan Brereton",
			"attack": 4,
			"cardImage": "DS1_070.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Maître-chien"
			},
			"health": 3,
			"id": "DS1_070",
			"name": "Houndmaster",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"cardImage": "OG_273.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Résister aux ténèbres"
			},
			"id": "OG_273",
			"name": "Stand Against Darkness",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "LOEA09_8.png",
			"cost": 5,
			"fr": {
				"name": "Garde ondulant"
			},
			"health": 6,
			"id": "LOEA09_8",
			"name": "Slithering Guard",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "AT_068e.png",
			"fr": {
				"name": "Renforcé"
			},
			"id": "AT_068e",
			"name": "Bolstered",
			"playerClass": "Warrior",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "TU4a_001.png",
			"fr": {
				"name": "Lardeur"
			},
			"health": 10,
			"id": "TU4a_001",
			"name": "Hogger",
			"rarity": "Common",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"cardImage": "NAX9_07.png",
			"cost": 5,
			"fr": {
				"name": "Marque des cavaliers"
			},
			"id": "NAX9_07",
			"name": "Mark of the Horsemen",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"artist": "Sean O'Danield",
			"cardImage": "AT_016.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Confusion"
			},
			"id": "AT_016",
			"name": "Confuse",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 6,
			"cardImage": "OG_300.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "L’Épouvantueur"
			},
			"health": 7,
			"id": "OG_300",
			"name": "The Boogeymonster",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Eva Wilderman",
			"cardImage": "OG_223.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Force divine"
			},
			"id": "OG_223",
			"name": "Divine Strength",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"attack": 2,
			"cardImage": "FP1_004.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Savant fou"
			},
			"health": 2,
			"id": "FP1_004",
			"name": "Mad Scientist",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "OG_241.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Villageois possédé"
			},
			"health": 1,
			"id": "OG_241",
			"name": "Possessed Villager",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "OG_300e.png",
			"fr": {
				"name": "Délicieux !"
			},
			"id": "OG_300e",
			"name": "Tasty!",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA05_1.png",
			"fr": {
				"name": "Baron Geddon"
			},
			"health": 30,
			"id": "BRMA05_1",
			"name": "Baron Geddon",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "GVG_023a.png",
			"fr": {
				"name": "Lame affûtée"
			},
			"id": "GVG_023a",
			"name": "Extra Sharp",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_049e.png",
			"fr": {
				"name": "Puissance des Pitons"
			},
			"id": "AT_049e",
			"name": "Power of the Bluff",
			"playerClass": "Shaman",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "J. Curtis Cranford",
			"attack": 3,
			"cardImage": "OG_222.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Lame de ralliement"
			},
			"id": "OG_222",
			"name": "Rallying Blade",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Og",
			"type": "Weapon"
		},
		{
			"artist": "Tyson Murphy",
			"attack": 1,
			"cardImage": "AT_084.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Porte-lance"
			},
			"health": 2,
			"id": "AT_084",
			"name": "Lance Carrier",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "BRMA09_2t.png",
			"cost": 1,
			"fr": {
				"name": "Dragonnet"
			},
			"health": 1,
			"id": "BRMA09_2t",
			"name": "Whelp",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "AT_041e.png",
			"fr": {
				"name": "Appel des étendues sauvages"
			},
			"id": "AT_041e",
			"name": "Call of the Wild",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "FP1_020.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Venger"
			},
			"id": "FP1_020",
			"name": "Avenge",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_409e.png",
			"fr": {
				"name": "Améliorée"
			},
			"id": "EX1_409e",
			"name": "Upgraded",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Gaser",
			"attack": 1,
			"cardImage": "OG_248.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Enragé am’gam"
			},
			"health": 5,
			"id": "OG_248",
			"name": "Am'gam Rager",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "tt_004o.png",
			"fr": {
				"name": "Cannibalisme"
			},
			"id": "tt_004o",
			"name": "Cannibalize",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_104a.png",
			"fr": {
				"name": "CADEAU BONUS"
			},
			"id": "GVG_104a",
			"name": "HERE, TAKE BUFF.",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "LOE_089t3.png",
			"cost": 2,
			"fr": {
				"name": "Avorton grognon"
			},
			"health": 2,
			"id": "LOE_089t3",
			"name": "Grumbly Runt",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"cardImage": "AT_064.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Sonner"
			},
			"id": "AT_064",
			"name": "Bash",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Chris Rahn",
			"attack": 3,
			"cardImage": "EX1_066.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Limon des marais acide"
			},
			"health": 2,
			"id": "EX1_066",
			"name": "Acidic Swamp Ooze",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Michael Franchina",
			"attack": 3,
			"cardImage": "AT_065.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Défenseur du roi"
			},
			"id": "AT_065",
			"name": "King's Defender",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Weapon"
		},
		{
			"cardImage": "BRMA12_10.png",
			"cost": 1,
			"fr": {
				"name": "Mutation"
			},
			"id": "BRMA12_10",
			"name": "Mutation",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"attack": 3,
			"cardImage": "CRED_06.png",
			"cost": 1,
			"fr": {
				"name": "Derek Sakamoto"
			},
			"health": 1,
			"id": "CRED_06",
			"name": "Derek Sakamoto",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA07_2H.png",
			"cost": 0,
			"fr": {
				"name": "MOI TOUT CASSER"
			},
			"id": "BRMA07_2H",
			"name": "ME SMASH",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"attack": 0,
			"cardImage": "LOEA07_11.png",
			"cost": 1,
			"fr": {
				"name": "Débris"
			},
			"health": 3,
			"id": "LOEA07_11",
			"name": "Debris",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Sojin Hwang",
			"attack": 4,
			"cardImage": "AT_026.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Garde-courroux"
			},
			"health": 3,
			"id": "AT_026",
			"name": "Wrathguard",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_011t.png",
			"fr": {
				"name": "Horion de lave"
			},
			"id": "BRM_011t",
			"name": "Lava Shock",
			"playerClass": "Shaman",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "TB_KTRAF_7.png",
			"cost": 3,
			"fr": {
				"name": "Heigan l’Impur"
			},
			"health": 5,
			"id": "TB_KTRAF_7",
			"name": "Heigan the Unclean",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "TB_FactionWar_Rag1.png",
			"cost": 4,
			"fr": {
				"name": "MEURS, INSECTE !"
			},
			"id": "TB_FactionWar_Rag1",
			"name": "DIE, INSECT!",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "NEW1_033.png",
			"cost": 3,
			"fr": {
				"name": "Leokk"
			},
			"health": 4,
			"id": "NEW1_033",
			"name": "Leokk",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "AT_031.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Vide-gousset"
			},
			"health": 2,
			"id": "AT_031",
			"name": "Cutpurse",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "BRMA17_6.png",
			"cost": 1,
			"fr": {
				"name": "Assemblage d’os"
			},
			"health": 1,
			"id": "BRMA17_6",
			"name": "Bone Construct",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "TB_ClassRandom_Priest.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : prêtre"
			},
			"id": "TB_ClassRandom_Priest",
			"name": "Second Class: Priest",
			"playerClass": "Priest",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Steve Ellis",
			"attack": 4,
			"cardImage": "CS2_155.png",
			"collectible": true,
			"cost": 6,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Archimage"
			},
			"health": 7,
			"id": "CS2_155",
			"name": "Archmage",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Richie Marella",
			"attack": 2,
			"cardImage": "CS2_121.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Grunt loup-de-givre"
			},
			"health": 2,
			"id": "CS2_121",
			"name": "Frostwolf Grunt",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "DREAM_05e.png",
			"fr": {
				"name": "Cauchemar"
			},
			"id": "DREAM_05e",
			"name": "Nightmare",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 1,
			"cardImage": "LOE_029.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Scarabée orné de joyaux"
			},
			"health": 1,
			"id": "LOE_029",
			"name": "Jeweled Scarab",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "TBST_004.png",
			"cost": 3,
			"fr": {
				"name": "Soigneur honnête"
			},
			"health": 2,
			"id": "TBST_004",
			"name": "OLDLegit Healer",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Sean McNally",
			"attack": 3,
			"cardImage": "AT_049.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Vaillant des Pitons-du-Tonnerre"
			},
			"health": 6,
			"id": "AT_049",
			"name": "Thunder Bluff Valiant",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "NAX15_04H.png",
			"cost": 8,
			"fr": {
				"name": "Chaînes"
			},
			"id": "NAX15_04H",
			"name": "Chains",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "Andrew Hou",
			"cardImage": "GVG_050.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Lame rebondissante"
			},
			"id": "GVG_050",
			"name": "Bouncing Blade",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "AT_083e.png",
			"fr": {
				"name": "Volerie de faucons-dragons"
			},
			"id": "AT_083e",
			"name": "Dragonhawkery",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"artist": "Andrew Hou",
			"cardImage": "OG_100.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mot de l’ombre : Horreur"
			},
			"id": "OG_100",
			"name": "Shadow Word: Horror",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "John Polidora",
			"attack": 3,
			"cardImage": "AT_100.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Régente de la Main d’argent"
			},
			"health": 3,
			"id": "AT_100",
			"name": "Silver Hand Regent",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "LOEA02_10c.png",
			"cost": 0,
			"fr": {
				"name": "Misha"
			},
			"health": 4,
			"id": "LOEA02_10c",
			"name": "Misha",
			"playerClass": "Hunter",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"cardImage": "GVG_012.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Lumière des naaru"
			},
			"id": "GVG_012",
			"name": "Light of the Naaru",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "BRMA04_3H.png",
			"cost": 0,
			"fr": {
				"name": "Lige du feu"
			},
			"health": 5,
			"id": "BRMA04_3H",
			"name": "Firesworn",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"attack": 2,
			"cardImage": "GVG_122.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mini stoppe-sort"
			},
			"health": 5,
			"id": "GVG_122",
			"name": "Wee Spellstopper",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "TB_CoOpBossSpell_6.png",
			"cost": 0,
			"fr": {
				"name": "Détruire le chroniqueur"
			},
			"id": "TB_CoOpBossSpell_6",
			"name": "Kill the Lorewalker",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_019.png",
			"cost": 0,
			"fr": {
				"name": "Molasses"
			},
			"id": "XXX_019",
			"name": "Molasses",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "OG_293e.png",
			"fr": {
				"name": "Dévotion de l'arakkoa"
			},
			"id": "OG_293e",
			"name": "Arrakoa Devotion",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Greg Staples",
			"attack": 8,
			"cardImage": "AT_120.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Géant du givre"
			},
			"health": 8,
			"id": "AT_120",
			"name": "Frost Giant",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Adam Byrne",
			"attack": 2,
			"cardImage": "AT_097.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Spectateur du tournoi"
			},
			"health": 1,
			"id": "AT_097",
			"name": "Tournament Attendee",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "TU4c_003.png",
			"cost": 0,
			"fr": {
				"name": "Tonneau"
			},
			"health": 2,
			"id": "TU4c_003",
			"name": "Barrel",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"artist": "Ben Wootten",
			"attack": 3,
			"cardImage": "AT_099.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Chevaucheuse de kodo"
			},
			"health": 5,
			"id": "AT_099",
			"name": "Kodorider",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "James Zhang",
			"attack": 3,
			"cardImage": "AT_058.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Elekk du roi"
			},
			"health": 2,
			"id": "AT_058",
			"name": "King's Elekk",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_019e.png",
			"fr": {
				"name": "Cœur de démon"
			},
			"id": "GVG_019e",
			"name": "Demonheart",
			"playerClass": "Warlock",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"cardImage": "HERO_08b.png",
			"collectible": true,
			"fr": {
				"name": "Khadgar"
			},
			"health": 30,
			"id": "HERO_08b",
			"name": "Khadgar",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Hero_skins",
			"type": "Hero"
		},
		{
			"artist": "Gonzalo Ordonez",
			"attack": 1,
			"cardImage": "EX1_080.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Gardienne des secrets"
			},
			"health": 2,
			"id": "EX1_080",
			"name": "Secretkeeper",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_076a.png",
			"fr": {
				"name": "Pistons"
			},
			"id": "GVG_076a",
			"name": "Pistons",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "TB_FactionWar_Herald.png",
			"cost": 1,
			"fr": {
				"name": "Hérold"
			},
			"health": 1,
			"id": "TB_FactionWar_Herald",
			"name": "Herold",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Edouard Guiton & Stuido HIVE",
			"attack": 3,
			"cardImage": "BRM_020.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Sorcier draconien"
			},
			"health": 5,
			"id": "BRM_020",
			"name": "Dragonkin Sorcerer",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "OG_121e.png",
			"fr": {
				"name": "Sombre puissance"
			},
			"id": "OG_121e",
			"name": "Dark Power",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Tom Fleming",
			"attack": 2,
			"cardImage": "EX1_059.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Alchimiste dément"
			},
			"health": 2,
			"id": "EX1_059",
			"name": "Crazed Alchemist",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX5_03.png",
			"cost": 2,
			"fr": {
				"name": "Cervocalypse"
			},
			"id": "NAX5_03",
			"name": "Mindpocalypse",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 4,
			"cardImage": "EX1_017.png",
			"collectible": true,
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Panthère de la jungle"
			},
			"health": 2,
			"id": "EX1_017",
			"name": "Jungle Panther",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA01_12h.png",
			"cost": 3,
			"fr": {
				"name": "Hoplite tol’vir"
			},
			"health": 5,
			"id": "LOEA01_12h",
			"name": "Tol'vir Hoplite",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "EX1_598.png",
			"cost": 1,
			"fr": {
				"name": "Diablotin"
			},
			"health": 1,
			"id": "EX1_598",
			"name": "Imp",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Luke Mancini",
			"cardImage": "BRM_017.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Ressusciter"
			},
			"id": "BRM_017",
			"name": "Resurrect",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "PRO_001c.png",
			"cost": 4,
			"fr": {
				"name": "Puissance de la Horde"
			},
			"id": "PRO_001c",
			"name": "Power of the Horde",
			"set": "Promo",
			"type": "Spell"
		},
		{
			"artist": "Turovec Konstantin",
			"attack": 3,
			"cardImage": "LOE_047.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Araignée des tombes"
			},
			"health": 3,
			"id": "LOE_047",
			"name": "Tomb Spider",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Eva Widermann",
			"attack": 2,
			"cardImage": "GVG_030.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Ourson robot anodisé"
			},
			"health": 2,
			"id": "GVG_030",
			"name": "Anodized Robo Cub",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_1_Ench.png",
			"fr": {
				"name": "Pick Your Fate 1 Ench"
			},
			"id": "TB_PickYourFate_1_Ench",
			"name": "Pick Your Fate 1 Ench",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Tyson Murphy",
			"attack": 5,
			"cardImage": "OG_133.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "N’Zoth le corrupteur"
			},
			"health": 7,
			"id": "OG_133",
			"name": "N'Zoth, the Corruptor",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Dave Kendall",
			"cardImage": "EX1_303.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Ombreflamme"
			},
			"id": "EX1_303",
			"name": "Shadowflame",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "LOE_115.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Idole corbeau"
			},
			"id": "LOE_115",
			"name": "Raven Idol",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "TB_EndlessMinions01.png",
			"fr": {
				"name": "Enchantement sans fin"
			},
			"id": "TB_EndlessMinions01",
			"name": "Endless Enchantment",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "John Avon",
			"attack": 3,
			"cardImage": "CS2_033.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Élémentaire d’eau"
			},
			"health": 6,
			"id": "CS2_033",
			"name": "Water Elemental",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_607e.png",
			"fr": {
				"name": "Rage intérieure"
			},
			"id": "EX1_607e",
			"name": "Inner Rage",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "EX1_012.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Mage de sang Thalnos"
			},
			"health": 1,
			"id": "EX1_012",
			"name": "Bloodmage Thalnos",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA09_13.png",
			"cost": 5,
			"fr": {
				"name": "Naga affamé"
			},
			"health": 1,
			"id": "LOEA09_13",
			"name": "Hungry Naga",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA17_2H.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "BRMA17_2H",
			"name": "Nefarian",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Justin Sweet",
			"attack": 4,
			"cardImage": "CS2_221.png",
			"collectible": true,
			"cost": 5,
			"faction": "HORDE",
			"fr": {
				"name": "Forgeron malveillant"
			},
			"health": 6,
			"id": "CS2_221",
			"name": "Spiteful Smith",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Zoltan and Gabor",
			"attack": 3,
			"cardImage": "GVG_036.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Masse de puissance"
			},
			"id": "GVG_036",
			"name": "Powermace",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Weapon"
		},
		{
			"cardImage": "Mekka4e.png",
			"fr": {
				"name": "Transformé"
			},
			"id": "Mekka4e",
			"name": "Transformed",
			"set": "Promo",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_063a.png",
			"fr": {
				"name": "Vindicte"
			},
			"id": "GVG_063a",
			"name": "Retribution",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 2,
			"cardImage": "EX1_603.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Sous-chef cruel"
			},
			"health": 2,
			"id": "EX1_603",
			"name": "Cruel Taskmaster",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CRED_15.png",
			"cost": 1,
			"fr": {
				"name": "Andy Brock"
			},
			"health": 3,
			"id": "CRED_15",
			"name": "Andy Brock",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"artist": "Clint Langley",
			"attack": 2,
			"cardImage": "CS2_196.png",
			"collectible": true,
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Chasseuse de Tranchebauge"
			},
			"health": 3,
			"id": "CS2_196",
			"name": "Razorfen Hunter",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "LOE_105e.png",
			"fr": {
				"name": "Chapeau d’explorateur"
			},
			"id": "LOE_105e",
			"name": "Explorer's Hat",
			"playerClass": "Hunter",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Lars Grant-West",
			"attack": 2,
			"cardImage": "DS1_178.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Rhino de la toundra"
			},
			"health": 5,
			"id": "DS1_178",
			"name": "Tundra Rhino",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "TB_KTRAF_3.png",
			"cost": 4,
			"fr": {
				"name": "Gluth"
			},
			"health": 4,
			"id": "TB_KTRAF_3",
			"name": "Gluth",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_22H.png",
			"cost": 10,
			"fr": {
				"name": "Archaedas"
			},
			"health": 10,
			"id": "LOEA16_22H",
			"name": "Archaedas",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "AT_132_PALADIN.png",
			"cost": 2,
			"fr": {
				"name": "La Main d’argent"
			},
			"id": "AT_132_PALADIN",
			"name": "The Silver Hand",
			"playerClass": "Paladin",
			"set": "Tgt",
			"type": "Hero_power"
		},
		{
			"cardImage": "FP1_030e.png",
			"fr": {
				"name": "Aura nécrotique"
			},
			"id": "FP1_030e",
			"name": "Necrotic Aura",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_055.png",
			"cost": 0,
			"fr": {
				"name": "1000 Stats"
			},
			"id": "XXX_055",
			"name": "1000 Stats",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA_01.png",
			"cost": 3,
			"fr": {
				"name": "Présence menaçante"
			},
			"id": "LOEA_01",
			"name": "Looming Presence",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"attack": 7,
			"cardImage": "BRMA14_9.png",
			"cost": 5,
			"fr": {
				"name": "Magmatron"
			},
			"health": 7,
			"id": "BRMA14_9",
			"name": "Magmatron",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "BRMC_95h.png",
			"cost": 3,
			"fr": {
				"name": "Chiots du magma"
			},
			"id": "BRMC_95h",
			"name": "Core Hound Puppies",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "AT_132_PRIEST.png",
			"cost": 2,
			"fr": {
				"name": "Soins"
			},
			"id": "AT_132_PRIEST",
			"name": "Heal",
			"playerClass": "Priest",
			"set": "Tgt",
			"type": "Hero_power"
		},
		{
			"artist": "Ron Spears",
			"attack": 1,
			"cardImage": "AT_082.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Modeste écuyer"
			},
			"health": 2,
			"id": "AT_082",
			"name": "Lowly Squire",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 2,
			"cardImage": "EX1_058.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Protectrice solfurie"
			},
			"health": 3,
			"id": "EX1_058",
			"name": "Sunfury Protector",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_046e.png",
			"fr": {
				"name": "Le roi"
			},
			"id": "GVG_046e",
			"name": "The King",
			"playerClass": "Hunter",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Phill Gonzales",
			"attack": 2,
			"cardImage": "CS2_122.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chef de raid"
			},
			"health": 2,
			"id": "CS2_122",
			"name": "Raid Leader",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"attack": 3,
			"cardImage": "GVG_099.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Lobe-Bombe"
			},
			"health": 3,
			"id": "GVG_099",
			"name": "Bomb Lobber",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_408.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Frappe mortelle"
			},
			"id": "EX1_408",
			"name": "Mortal Strike",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_01.png",
			"fr": {
				"name": "Fuite du temple"
			},
			"health": 100,
			"id": "LOEA04_01",
			"name": "Temple Escape",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 4,
			"cardImage": "GVG_074.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mystique de Kezan"
			},
			"health": 3,
			"id": "GVG_074",
			"name": "Kezan Mystic",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "TU4f_007.png",
			"cost": 1,
			"fr": {
				"name": "Singe cinglé"
			},
			"health": 2,
			"id": "TU4f_007",
			"name": "Crazy Monkey",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"cardImage": "OG_337e.png",
			"fr": {
				"name": "Prémices de destruction"
			},
			"id": "OG_337e",
			"name": "Eve of Destruction",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "NAX10_02.png",
			"cost": 3,
			"durability": 8,
			"fr": {
				"name": "Crochet"
			},
			"id": "NAX10_02",
			"name": "Hook",
			"set": "Naxx",
			"type": "Weapon"
		},
		{
			"cardImage": "NEW1_025e.png",
			"fr": {
				"name": "Renforcement"
			},
			"id": "NEW1_025e",
			"name": "Bolstered",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_8_Ench.png",
			"fr": {
				"name": "Fate 8 Get Armor"
			},
			"id": "TB_PickYourFate_8_Ench",
			"name": "Fate 8 Get Armor",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX15_04.png",
			"cost": 8,
			"fr": {
				"name": "Chaînes"
			},
			"id": "NAX15_04",
			"name": "Chains",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "James Ryman",
			"attack": 3,
			"cardImage": "LOE_017.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gardienne d’Uldaman"
			},
			"health": 4,
			"id": "LOE_017",
			"name": "Keeper of Uldaman",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "skele21.png",
			"cost": 1,
			"fr": {
				"name": "Golem endommagé"
			},
			"health": 1,
			"id": "skele21",
			"name": "Damaged Golem",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Ittoku Seta",
			"attack": 2,
			"cardImage": "FP1_005.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Ombre de Naxxramas"
			},
			"health": 2,
			"id": "FP1_005",
			"name": "Shade of Naxxramas",
			"rarity": "Epic",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Den",
			"cardImage": "GVG_022.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Huile d’affûtage de Bricoleur"
			},
			"id": "GVG_022",
			"name": "Tinker's Sharpsword Oil",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 7,
			"cardImage": "LOE_092.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Prince voleur Rafaam"
			},
			"health": 8,
			"id": "LOE_092",
			"name": "Arch-Thief Rafaam",
			"rarity": "Legendary",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "XXX_108.png",
			"cost": 0,
			"fr": {
				"name": "Set all minions to 1 health"
			},
			"health": 0,
			"id": "XXX_108",
			"name": "Set all minions to 1 health",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA13_2.png",
			"cost": 1,
			"fr": {
				"name": "Forme véritable"
			},
			"id": "BRMA13_2",
			"name": "True Form",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_531e.png",
			"fr": {
				"name": "Bien nourri"
			},
			"id": "EX1_531e",
			"name": "Well Fed",
			"playerClass": "Hunter",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_064.png",
			"cost": 0,
			"fr": {
				"name": "The Song That Ends the World"
			},
			"id": "XXX_064",
			"name": "The Song That Ends the World",
			"rarity": "Legendary",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "TB_MechWar_Boss1_HeroPower.png",
			"cost": 2,
			"fr": {
				"name": "Bonjour ! Bonjour ! Bonjour !"
			},
			"id": "TB_MechWar_Boss1_HeroPower",
			"name": "Hello! Hello! Hello!",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_006.png",
			"cost": 1,
			"fr": {
				"name": "Grande banane"
			},
			"id": "TB_006",
			"name": "Big Banana",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "OG_176.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Attaque d’ombre"
			},
			"id": "OG_176",
			"name": "Shadow Strike",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Og",
			"type": "Spell"
		},
		{
			"cardImage": "AT_024e.png",
			"fr": {
				"name": "Sombre fusion"
			},
			"id": "AT_024e",
			"name": "Dark Fusion",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_009.png",
			"fr": {
				"name": "Créer 15 secrets"
			},
			"id": "TB_009",
			"name": "Create 15 Secrets",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Andrew Hou",
			"cardImage": "OG_006b.png",
			"cost": 2,
			"fr": {
				"name": "La marée d’argent"
			},
			"id": "OG_006b",
			"name": "The Tidal Hand",
			"playerClass": "Paladin",
			"set": "Og",
			"type": "Hero_power"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 8,
			"cardImage": "LOE_073.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Diablosaure fossilisé"
			},
			"health": 8,
			"id": "LOE_073",
			"name": "Fossilized Devilsaur",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Slawomir Maniak",
			"cardImage": "EX1_607.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Rage intérieure"
			},
			"id": "EX1_607",
			"name": "Inner Rage",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"attack": 8,
			"cardImage": "OG_229.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Ragnaros, porteur de Lumière"
			},
			"health": 8,
			"id": "OG_229",
			"name": "Ragnaros, Lightlord",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "FP1_025.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Réincarnation"
			},
			"id": "FP1_025",
			"name": "Reincarnate",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA01_02.png",
			"cost": 0,
			"fr": {
				"name": "Bénédictions du soleil"
			},
			"id": "LOEA01_02",
			"name": "Blessings of the Sun",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_103.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Charge"
			},
			"id": "CS2_103",
			"name": "Charge",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"attack": 7,
			"cardImage": "LOE_107.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Statue sinistre"
			},
			"health": 7,
			"id": "LOE_107",
			"name": "Eerie Statue",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_001e.png",
			"fr": {
				"name": "Fondre"
			},
			"id": "BRM_001e",
			"name": "Melt",
			"playerClass": "Priest",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"artist": "Howard Lyon",
			"attack": 2,
			"cardImage": "EX1_584.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mage ancien"
			},
			"health": 5,
			"id": "EX1_584",
			"name": "Ancient Mage",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KTRAF_H_1.png",
			"fr": {
				"name": "Kel’Thuzad"
			},
			"health": 30,
			"id": "TB_KTRAF_H_1",
			"name": "Kel'Thuzad",
			"rarity": "Free",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA15_2.png",
			"cost": 0,
			"fr": {
				"name": "L’alchimiste"
			},
			"id": "BRMA15_2",
			"name": "The Alchemist",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"attack": 2,
			"cardImage": "EX1_573t.png",
			"cost": 1,
			"fr": {
				"name": "Tréant"
			},
			"health": 2,
			"id": "EX1_573t",
			"name": "Treant",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"cardImage": "CS2_063.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Corruption"
			},
			"id": "CS2_063",
			"name": "Corruption",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_123e.png",
			"fr": {
				"name": "Remonté"
			},
			"id": "GVG_123e",
			"name": "Overclocked",
			"playerClass": "Mage",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "EX1_241.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Explosion de lave"
			},
			"id": "EX1_241",
			"name": "Lava Burst",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "GVG_045t.png",
			"cost": 1,
			"fr": {
				"name": "Diablotin"
			},
			"health": 1,
			"id": "GVG_045t",
			"name": "Imp",
			"playerClass": "Warlock",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"cardImage": "PART_004.png",
			"cost": 1,
			"fr": {
				"name": "Champ de camouflage"
			},
			"id": "PART_004",
			"name": "Finicky Cloakfield",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "John Dickenson",
			"attack": 2,
			"cardImage": "EX1_162.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Loup alpha redoutable"
			},
			"health": 2,
			"id": "EX1_162",
			"name": "Dire Wolf Alpha",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "BRM_006t.png",
			"cost": 1,
			"fr": {
				"name": "Diablotin"
			},
			"health": 1,
			"id": "BRM_006t",
			"name": "Imp",
			"playerClass": "Warlock",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 1,
			"cardImage": "GVG_076.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Mouton explosif"
			},
			"health": 1,
			"id": "GVG_076",
			"name": "Explosive Sheep",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "BRM_002.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Attise-flammes"
			},
			"health": 4,
			"id": "BRM_002",
			"name": "Flamewaker",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 8,
			"cardImage": "GVG_016.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Saccageur gangrené"
			},
			"health": 8,
			"id": "GVG_016",
			"name": "Fel Reaver",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "LOEA15_3.png",
			"cost": 3,
			"fr": {
				"name": "Raptor d’os"
			},
			"health": 2,
			"id": "LOEA15_3",
			"name": "Boneraptor",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Carl Critchlow",
			"attack": 0,
			"cardImage": "EX1_405.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Porte-bouclier"
			},
			"health": 4,
			"id": "EX1_405",
			"name": "Shieldbearer",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Samwise",
			"attack": 4,
			"cardImage": "CS2_181.png",
			"collectible": true,
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Maître-lame blessé"
			},
			"health": 7,
			"id": "CS2_181",
			"name": "Injured Blademaster",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA02_03.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : puissance"
			},
			"id": "LOEA02_03",
			"name": "Wish for Power",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA07_1.png",
			"fr": {
				"name": "Généralissime Omokk"
			},
			"health": 30,
			"id": "BRMA07_1",
			"name": "Highlord Omokk",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Ben Zhang",
			"attack": 2,
			"cardImage": "AT_109.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Guetteur d’Argent"
			},
			"health": 4,
			"id": "AT_109",
			"name": "Argent Watchman",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "BRM_013.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Tir réflexe"
			},
			"id": "BRM_013",
			"name": "Quick Shot",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Ben Wootten",
			"cardImage": "EX1_596.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Feu démoniaque"
			},
			"id": "EX1_596",
			"name": "Demonfire",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 7,
			"cardImage": "AT_009.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Rhonin"
			},
			"health": 7,
			"id": "AT_009",
			"name": "Rhonin",
			"playerClass": "Mage",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "AT_040.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Marcheuse sauvage"
			},
			"health": 4,
			"id": "AT_040",
			"name": "Wildwalker",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "OG_302e.png",
			"fr": {
				"name": "Puissance de l’âme"
			},
			"id": "OG_302e",
			"name": "Soul Power",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_6.png",
			"cost": 0,
			"fr": {
				"name": "Destin : portails"
			},
			"id": "TB_PickYourFate_6",
			"name": "Fate: Portals",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "GVG_053.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Vierge guerrière"
			},
			"health": 5,
			"id": "GVG_053",
			"name": "Shieldmaiden",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Brian Despain",
			"attack": 3,
			"cardImage": "CS2_179.png",
			"collectible": true,
			"cost": 4,
			"faction": "HORDE",
			"fr": {
				"name": "Maître-bouclier de Sen’jin"
			},
			"health": 5,
			"id": "CS2_179",
			"name": "Sen'jin Shieldmasta",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA04_2.png",
			"cost": 1,
			"fr": {
				"name": "Impulsion de magma"
			},
			"id": "BRMA04_2",
			"name": "Magma Pulse",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_390e.png",
			"fr": {
				"name": "Enragé"
			},
			"id": "EX1_390e",
			"name": "Enraged",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "LOEA04_25h.png",
			"cost": 8,
			"fr": {
				"name": "Statue vengeresse"
			},
			"health": 9,
			"id": "LOEA04_25h",
			"name": "Seething Statue",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Lars Grant-West",
			"attack": 4,
			"cardImage": "OG_138.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Prophète nérubien"
			},
			"health": 4,
			"id": "OG_138",
			"name": "Nerubian Prophet",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "GVG_001.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Canon lance-flammes"
			},
			"id": "GVG_001",
			"name": "Flamecannon",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "LOE_008H.png",
			"cost": 1,
			"fr": {
				"name": "Œil d’Hakkar"
			},
			"id": "LOE_008H",
			"name": "Eye of Hakkar",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Gino Whitehall",
			"attack": 2,
			"cardImage": "GVG_043.png",
			"collectible": true,
			"cost": 2,
			"durability": 2,
			"fr": {
				"name": "Glaivezooka"
			},
			"id": "GVG_043",
			"name": "Glaivezooka",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Weapon"
		},
		{
			"cardImage": "EX1_178a.png",
			"cost": 0,
			"fr": {
				"name": "Enraciner"
			},
			"id": "EX1_178a",
			"name": "Rooted",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA16_3e.png",
			"fr": {
				"name": "Souffle sonique"
			},
			"id": "BRMA16_3e",
			"name": "Sonic Breath",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_188o.png",
			"fr": {
				"name": "« Inspiré »"
			},
			"id": "CS2_188o",
			"name": "'Inspired'",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA05_2.png",
			"cost": 0,
			"fr": {
				"name": "Mana enflammé"
			},
			"id": "BRMA05_2",
			"name": "Ignite Mana",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Arthur Bozonnet",
			"attack": 1,
			"cardImage": "OG_114a.png",
			"cost": 1,
			"fr": {
				"name": "Tentacule gluant"
			},
			"health": 1,
			"id": "OG_114a",
			"name": "Icky Tentacle",
			"playerClass": "Warlock",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_010a.png",
			"cost": 0,
			"fr": {
				"name": "Forme de félin-de-feu"
			},
			"id": "BRM_010a",
			"name": "Firecat Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"artist": "Matt Smith",
			"attack": 1,
			"cardImage": "FP1_027.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Gargouille peau-de-pierre"
			},
			"health": 4,
			"id": "FP1_027",
			"name": "Stoneskin Gargoyle",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Mauro Cascioli",
			"cardImage": "DS1_184.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Pistage"
			},
			"id": "DS1_184",
			"name": "Tracking",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_1.png",
			"fr": {
				"name": "Rafaam"
			},
			"health": 30,
			"id": "LOEA16_1",
			"name": "Rafaam",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"attack": 4,
			"cardImage": "FP1_007t.png",
			"cost": 3,
			"fr": {
				"name": "Nérubien"
			},
			"health": 4,
			"id": "FP1_007t",
			"name": "Nerubian",
			"rarity": "Rare",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "TB_Face_Ench1.png",
			"fr": {
				"name": "À l’abri"
			},
			"id": "TB_Face_Ench1",
			"name": "Safe",
			"rarity": "Unknown_6",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 4,
			"cardImage": "EX1_306.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Succube"
			},
			"health": 3,
			"id": "EX1_306",
			"name": "Succubus",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "TB_012.png",
			"cost": 0,
			"fr": {
				"name": "Choisir une nouvelle carte !"
			},
			"id": "TB_012",
			"name": "Choose a New Card!",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "NAX3_02H.png",
			"cost": 0,
			"fr": {
				"name": "Entoilage"
			},
			"id": "NAX3_02H",
			"name": "Web Wrap",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_178ae.png",
			"fr": {
				"name": "Enraciné"
			},
			"id": "EX1_178ae",
			"name": "Rooted",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_133e.png",
			"fr": {
				"name": "Victoire !"
			},
			"id": "AT_133e",
			"name": "Victory!",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_014e.png",
			"fr": {
				"name": "Effet d’ombrefiel"
			},
			"id": "AT_014e",
			"name": "Shadowfiended",
			"playerClass": "Priest",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_048e.png",
			"fr": {
				"name": "Marque d’Y’Shaarj"
			},
			"id": "OG_048e",
			"name": "Mark of Y'Shaarj",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Steve Hui",
			"cardImage": "EX1_246.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maléfice"
			},
			"id": "EX1_246",
			"name": "Hex",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"cardImage": "OG_138e.png",
			"fr": {
				"name": "Volonté du vizir"
			},
			"id": "OG_138e",
			"name": "Will of the Vizier",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA09_2e.png",
			"fr": {
				"name": "Enragé"
			},
			"id": "LOEA09_2e",
			"name": "Enraged",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "NAX15_03t.png",
			"cost": 4,
			"fr": {
				"name": "Garde de la Couronne de glace"
			},
			"health": 5,
			"id": "NAX15_03t",
			"name": "Guardian of Icecrown",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_034_H1.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu"
			},
			"id": "CS2_034_H1",
			"name": "Fireblast",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Hero_skins",
			"type": "Hero_power"
		},
		{
			"attack": 0,
			"cardImage": "AT_132_SHAMANd.png",
			"cost": 0,
			"fr": {
				"name": "Totem de courroux de l’air"
			},
			"health": 2,
			"id": "AT_132_SHAMANd",
			"name": "Wrath of Air Totem",
			"playerClass": "Shaman",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Romain De Santi",
			"cardImage": "CS2_032.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Choc de flammes"
			},
			"id": "CS2_032",
			"name": "Flamestrike",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_23H.png",
			"cost": 10,
			"fr": {
				"name": "Seigneur Ondulance"
			},
			"health": 10,
			"id": "LOEA16_23H",
			"name": "Lord Slitherspear",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_028t.png",
			"cost": 0,
			"fr": {
				"name": "Pièce de Gallywix"
			},
			"id": "GVG_028t",
			"name": "Gallywix's Coin",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA09_3.png",
			"cost": 0,
			"fr": {
				"name": "Faim"
			},
			"id": "LOEA09_3",
			"name": "Getting Hungry",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "NEW1_010.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Al’Akir, seigneur des Vents"
			},
			"health": 5,
			"id": "NEW1_010",
			"name": "Al'Akir the Windlord",
			"playerClass": "Shaman",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX5_02H.png",
			"cost": 0,
			"fr": {
				"name": "Éruption"
			},
			"id": "NAX5_02H",
			"name": "Eruption",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"attack": 3,
			"cardImage": "DREAM_01.png",
			"cost": 3,
			"fr": {
				"name": "Sœur rieuse"
			},
			"health": 5,
			"id": "DREAM_01",
			"name": "Laughing Sister",
			"playerClass": "Dream",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 4,
			"cardImage": "OG_282.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Lame de C’Thun"
			},
			"health": 4,
			"id": "OG_282",
			"name": "Blade of C'Thun",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_012.png",
			"cost": 0,
			"fr": {
				"name": "Bounce"
			},
			"id": "XXX_012",
			"name": "Bounce",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"artist": "Jeff Haynie",
			"cardImage": "GVG_015.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Bombe de matière noire"
			},
			"id": "GVG_015",
			"name": "Darkbomb",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "Skan Srisuwan",
			"cardImage": "AT_062.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Boule d’araignées"
			},
			"id": "AT_062",
			"name": "Ball of Spiders",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "OG_314.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Du sang à l’ichor"
			},
			"id": "OG_314",
			"name": "Blood To Ichor",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Og",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "TB_SPT_Minion1.png",
			"cost": 2,
			"fr": {
				"name": "Porte-pavois"
			},
			"health": 1,
			"id": "TB_SPT_Minion1",
			"name": "Shieldsman",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_086e.png",
			"fr": {
				"name": "Armure en plaques"
			},
			"id": "GVG_086e",
			"name": "Armor Plated",
			"playerClass": "Warrior",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_412.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Worgen déchaîné"
			},
			"health": 3,
			"id": "EX1_412",
			"name": "Raging Worgen",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "E.M. Gist",
			"cardImage": "EX1_391.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Heurtoir"
			},
			"id": "EX1_391",
			"name": "Slam",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Garrett Hanna",
			"attack": 3,
			"cardImage": "OG_337.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Horreur cyclopéenne"
			},
			"health": 3,
			"id": "OG_337",
			"name": "Cyclopian Horror",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_104e.png",
			"fr": {
				"name": "Saccager"
			},
			"id": "CS2_104e",
			"name": "Rampage",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Andrius Matijoshius",
			"cardImage": "LOE_113.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Tout est vraiment génial"
			},
			"id": "LOE_113",
			"name": "Everyfin is Awesome",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "AT_057o.png",
			"fr": {
				"name": "Étrillé"
			},
			"id": "AT_057o",
			"name": "Groomed",
			"playerClass": "Hunter",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_102e.png",
			"fr": {
				"name": "Transfert de puissance"
			},
			"id": "OG_102e",
			"name": "Power Transfer",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_041a.png",
			"cost": 0,
			"fr": {
				"name": "Sombres feux follets"
			},
			"id": "GVG_041a",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"cardImage": "TB_SPT_BossHeroPower.png",
			"cost": 2,
			"fr": {
				"name": "Caserne"
			},
			"id": "TB_SPT_BossHeroPower",
			"name": "Barracks",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "DS1_175o.png",
			"fr": {
				"name": "Hurlement furieux"
			},
			"id": "DS1_175o",
			"name": "Furious Howl",
			"playerClass": "Hunter",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "John Polidora",
			"attack": 7,
			"cardImage": "CS2_227.png",
			"collectible": true,
			"cost": 5,
			"faction": "HORDE",
			"fr": {
				"name": "Nervi de la KapitalRisk"
			},
			"health": 6,
			"id": "CS2_227",
			"name": "Venture Co. Mercenary",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "TU4f_004o.png",
			"fr": {
				"name": "Héritage de l’Empereur"
			},
			"id": "TU4f_004o",
			"name": "Legacy of the Emperor",
			"set": "Missions",
			"type": "Enchantment"
		},
		{
			"artist": "Trevor Jacobs",
			"cardImage": "EX1_571.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Force de la nature"
			},
			"id": "EX1_571",
			"name": "Force of Nature",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "NAX10_03H.png",
			"cost": 4,
			"fr": {
				"name": "Frappe haineuse"
			},
			"id": "NAX10_03H",
			"name": "Hateful Strike",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "BRMA10_6.png",
			"cost": 1,
			"durability": 5,
			"fr": {
				"name": "Griffes de Tranchetripe"
			},
			"id": "BRMA10_6",
			"name": "Razorgore's Claws",
			"set": "Brm",
			"type": "Weapon"
		},
		{
			"cardImage": "BRMA14_8.png",
			"cost": 8,
			"fr": {
				"name": "Activer Magmatron"
			},
			"id": "BRMA14_8",
			"name": "Activate Magmatron",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Donato Giancola",
			"attack": 1,
			"cardImage": "CS1_042.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Soldat de Comté-de-l’Or"
			},
			"health": 2,
			"id": "CS1_042",
			"name": "Goldshire Footman",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "DS1_185.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Tir des Arcanes"
			},
			"id": "DS1_185",
			"name": "Arcane Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Zoltan Boros ",
			"attack": 3,
			"cardImage": "AT_030.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Vaillant de Fossoyeuse"
			},
			"health": 2,
			"id": "AT_030",
			"name": "Undercity Valiant",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Tooth",
			"attack": 4,
			"cardImage": "AT_032.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Marchand douteux"
			},
			"health": 3,
			"id": "AT_032",
			"name": "Shady Dealer",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "OG_267.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Face de poulpe"
			},
			"health": 4,
			"id": "OG_267",
			"name": "Southsea Squidface",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Bernie Kang",
			"attack": 5,
			"cardImage": "EX1_057.png",
			"collectible": true,
			"cost": 4,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Ancien maître brasseur"
			},
			"health": 4,
			"id": "EX1_057",
			"name": "Ancient Brewmaster",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX3_02.png",
			"cost": 3,
			"fr": {
				"name": "Entoilage"
			},
			"id": "NAX3_02",
			"name": "Web Wrap",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"cardImage": "GVG_102e.png",
			"fr": {
				"name": "Puissance de Brikabrok"
			},
			"id": "GVG_102e",
			"name": "Might of Tinkertown",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "TU4a_003.png",
			"cost": 1,
			"fr": {
				"name": "Gnoll"
			},
			"health": 1,
			"id": "TU4a_003",
			"name": "Gnoll",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_102.png",
			"cost": 0,
			"fr": {
				"name": "Add 1 to Health."
			},
			"id": "XXX_102",
			"name": "Add 1 to Health.",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_178b.png",
			"cost": 0,
			"fr": {
				"name": "Déraciner"
			},
			"id": "EX1_178b",
			"name": "Uproot",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "EX1_tk28.png",
			"cost": 1,
			"fr": {
				"name": "Écureuil"
			},
			"health": 1,
			"id": "EX1_tk28",
			"name": "Squirrel",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_008a.png",
			"cost": 0,
			"fr": {
				"name": "Connaissances anciennes"
			},
			"id": "NEW1_008a",
			"name": "Ancient Teachings",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Doug Alexander",
			"attack": 6,
			"cardImage": "CS2_222.png",
			"collectible": true,
			"cost": 7,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Champion de Hurlevent"
			},
			"health": 6,
			"id": "CS2_222",
			"name": "Stormwind Champion",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 5,
			"cardImage": "BRM_028.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Empereur Thaurissan"
			},
			"health": 5,
			"id": "BRM_028",
			"name": "Emperor Thaurissan",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "AT_044.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Charpie"
			},
			"id": "AT_044",
			"name": "Mulch",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "NAX5_01H.png",
			"fr": {
				"name": "Heigan l’Impur"
			},
			"health": 45,
			"id": "NAX5_01H",
			"name": "Heigan the Unclean",
			"playerClass": "Warlock",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"attack": 9,
			"cardImage": "TB_CoOp_Mechazod2.png",
			"cost": 10,
			"fr": {
				"name": "Mécazod surchargé"
			},
			"health": 80,
			"id": "TB_CoOp_Mechazod2",
			"name": "Overloaded Mechazod",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KTRAF_HP_RAF5.png",
			"cost": 2,
			"fr": {
				"name": "Bâton de l’Origine"
			},
			"id": "TB_KTRAF_HP_RAF5",
			"name": "Staff of Origination",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "CS2_226.png",
			"collectible": true,
			"cost": 5,
			"faction": "HORDE",
			"fr": {
				"name": "Chef de guerre loup-de-givre"
			},
			"health": 4,
			"id": "CS2_226",
			"name": "Frostwolf Warlord",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"attack": 5,
			"cardImage": "LOE_012.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Pilleur de tombes"
			},
			"health": 4,
			"id": "LOE_012",
			"name": "Tomb Pillager",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "EX1_531.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Hyène charognarde"
			},
			"health": 2,
			"id": "EX1_531",
			"name": "Scavenging Hyena",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "BRMA09_2Ht.png",
			"cost": 1,
			"fr": {
				"name": "Dragonnet"
			},
			"health": 2,
			"id": "BRMA09_2Ht",
			"name": "Whelp",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "BRMC_95he.png",
			"cost": 3,
			"fr": {
				"name": "Chiot du magma"
			},
			"health": 4,
			"id": "BRMC_95he",
			"name": "Core Hound Pup",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "TB_FactionWar_AnnoySpell1.png",
			"cost": 4,
			"fr": {
				"name": "Fan-club d’Ennuy-o-tron"
			},
			"id": "TB_FactionWar_AnnoySpell1",
			"name": "Annoy-o-Tron Fanclub",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "TB_ClassRandom_Shaman.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : chaman"
			},
			"id": "TB_ClassRandom_Shaman",
			"name": "Second Class: Shaman",
			"playerClass": "Shaman",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "BRMC_100e.png",
			"fr": {
				"name": "Bombe vivante"
			},
			"id": "BRMC_100e",
			"name": "Living Bomb",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX12_01.png",
			"fr": {
				"name": "Gluth"
			},
			"health": 30,
			"id": "NAX12_01",
			"name": "Gluth",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "LOEA07_09.png",
			"cost": 4,
			"fr": {
				"name": "Trogg en chasse"
			},
			"health": 6,
			"id": "LOEA07_09",
			"name": "Chasing Trogg",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "LOEA07_24.png",
			"cost": 1,
			"fr": {
				"name": "Leurre à pointes"
			},
			"health": 6,
			"id": "LOEA07_24",
			"name": "Spiked Decoy",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "AT_061e.png",
			"fr": {
				"name": "Prêt à tirer"
			},
			"id": "AT_061e",
			"name": "Lock and Load",
			"playerClass": "Hunter",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_074e2.png",
			"fr": {
				"name": "Sceau des champions"
			},
			"id": "AT_074e2",
			"name": "Seal of Champions",
			"playerClass": "Paladin",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX4_01.png",
			"fr": {
				"name": "Noth le Porte-Peste"
			},
			"health": 30,
			"id": "NAX4_01",
			"name": "Noth the Plaguebringer",
			"playerClass": "Mage",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Lorenzo Minaca",
			"cardImage": "EX1_609.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Tir de précision"
			},
			"id": "EX1_609",
			"name": "Snipe",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 3,
			"cardImage": "FP1_023.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Sombre sectateur"
			},
			"health": 4,
			"id": "FP1_023",
			"name": "Dark Cultist",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "AT_042t2.png",
			"cost": 2,
			"fr": {
				"name": "Panthère dent-de-sabre"
			},
			"health": 2,
			"id": "AT_042t2",
			"name": "Sabertooth Panther",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_028.png",
			"cost": 0,
			"fr": {
				"name": "Reveal Hand"
			},
			"id": "XXX_028",
			"name": "Reveal Hand",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA13_4.png",
			"cost": 1,
			"fr": {
				"name": "Magie sauvage"
			},
			"id": "BRMA13_4",
			"name": "Wild Magic",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOE_030e.png",
			"fr": {
				"name": "Trompeur"
			},
			"id": "LOE_030e",
			"name": "Hollow",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA09_2.png",
			"cost": 2,
			"fr": {
				"name": "Ouvrir les portes"
			},
			"id": "BRMA09_2",
			"name": "Open the Gates",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA15_2He.png",
			"fr": {
				"name": "Potion de puissance"
			},
			"id": "BRMA15_2He",
			"name": "Potion of Might",
			"set": "Brm",
			"type": "Enchantment"
		},
		{
			"artist": "Wei Wang",
			"attack": 4,
			"cardImage": "AT_054.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Le mandebrume"
			},
			"health": 4,
			"id": "AT_054",
			"name": "The Mistcaller",
			"playerClass": "Shaman",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_002.png",
			"cost": 0,
			"fr": {
				"name": "Damage 5"
			},
			"id": "XXX_002",
			"name": "Damage 5",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "HERO_01a.png",
			"collectible": true,
			"fr": {
				"name": "Magni Barbe-de-Bronze"
			},
			"health": 30,
			"id": "HERO_01a",
			"name": "Magni Bronzebeard",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Hero_skins",
			"type": "Hero"
		},
		{
			"artist": "Oliver Chipping",
			"attack": 9,
			"cardImage": "GVG_035.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Malorne"
			},
			"health": 7,
			"id": "GVG_035",
			"name": "Malorne",
			"playerClass": "Druid",
			"rarity": "Legendary",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_37.png",
			"cost": 4,
			"fr": {
				"name": "Ricardo Robaina"
			},
			"health": 4,
			"id": "CRED_37",
			"name": "Ricardo Robaina",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "HERO_01.png",
			"collectible": true,
			"fr": {
				"name": "Garrosh Hurlenfer"
			},
			"health": 30,
			"id": "HERO_01",
			"name": "Garrosh Hellscream",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero"
		},
		{
			"artist": "Popo Wei",
			"attack": 4,
			"cardImage": "EX1_612.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Mage du Kirin Tor"
			},
			"health": 3,
			"id": "EX1_612",
			"name": "Kirin Tor Mage",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "TU4f_005.png",
			"cost": 4,
			"fr": {
				"name": "Maître brasseur"
			},
			"health": 4,
			"id": "TU4f_005",
			"name": "Brewmaster",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KTRAF_HP_RAF3.png",
			"cost": 2,
			"fr": {
				"name": "Premier morceau du bâton"
			},
			"id": "TB_KTRAF_HP_RAF3",
			"name": "Staff, First Piece",
			"set": "Tb",
			"type": "Hero_power"
		},
		{
			"cardImage": "FP1_020e.png",
			"fr": {
				"name": "Vengeance"
			},
			"id": "FP1_020e",
			"name": "Vengeance",
			"playerClass": "Paladin",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_320e.png",
			"fr": {
				"name": "Heure de la corruption"
			},
			"id": "OG_320e",
			"name": "Hour of Corruption",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA12_6.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : noir"
			},
			"id": "BRMA12_6",
			"name": "Brood Affliction: Black",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "CRED_12.png",
			"cost": 2,
			"fr": {
				"name": "Rachelle Davis"
			},
			"health": 2,
			"id": "CRED_12",
			"name": "Rachelle Davis",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NAX2_05H.png",
			"cost": 3,
			"fr": {
				"name": "Adorateur"
			},
			"health": 4,
			"id": "NAX2_05H",
			"name": "Worshipper",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_27.png",
			"cost": 3,
			"fr": {
				"name": "Henry Ho"
			},
			"health": 4,
			"id": "CRED_27",
			"name": "Henry Ho",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMA01_3.png",
			"cost": 6,
			"fr": {
				"name": "Videur sombrefer"
			},
			"health": 8,
			"id": "BRMA01_3",
			"name": "Dark Iron Bouncer",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA07_21.png",
			"cost": 1,
			"fr": {
				"name": "Foncer en avant"
			},
			"id": "LOEA07_21",
			"name": "Barrel Forward",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_319.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Diablotin des flammes"
			},
			"health": 2,
			"id": "EX1_319",
			"name": "Flame Imp",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "LOEA15_3H.png",
			"cost": 3,
			"fr": {
				"name": "Raptor d’os"
			},
			"health": 2,
			"id": "LOEA15_3H",
			"name": "Boneraptor",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Chris Robinson",
			"attack": 6,
			"cardImage": "FP1_013.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Kel’Thuzad"
			},
			"health": 8,
			"id": "FP1_013",
			"name": "Kel'Thuzad",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Joe Wilson",
			"cardImage": "LOE_105.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Chapeau d’explorateur"
			},
			"id": "LOE_105",
			"name": "Explorer's Hat",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "TU4c_004.png",
			"cost": 2,
			"fr": {
				"name": "Piétinement"
			},
			"id": "TU4c_004",
			"name": "Stomp",
			"rarity": "Common",
			"set": "Missions",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "EX1_506a.png",
			"cost": 0,
			"fr": {
				"name": "Éclaireur murloc"
			},
			"health": 1,
			"id": "EX1_506a",
			"name": "Murloc Scout",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 5,
			"cardImage": "EX1_558.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Harrison Jones"
			},
			"health": 4,
			"id": "EX1_558",
			"name": "Harrison Jones",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_048.png",
			"cost": 0,
			"fr": {
				"name": "-1 Durability"
			},
			"id": "XXX_048",
			"name": "-1 Durability",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "NEW1_017e.png",
			"fr": {
				"name": "Ventre plein"
			},
			"id": "NEW1_017e",
			"name": "Full Belly",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA16_3.png",
			"cost": 10,
			"fr": {
				"name": "Lanterne de puissance"
			},
			"id": "LOEA16_3",
			"name": "Lantern of Power",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "CS1_112.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Nova sacrée"
			},
			"id": "CS1_112",
			"name": "Holy Nova",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "NAX11_03.png",
			"cost": 1,
			"fr": {
				"name": "Gelée polluée"
			},
			"health": 2,
			"id": "NAX11_03",
			"name": "Fallout Slime",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Justin Sweet",
			"cardImage": "EX1_365.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Colère divine"
			},
			"id": "EX1_365",
			"name": "Holy Wrath",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "OG_044c.png",
			"cost": 2,
			"fr": {
				"name": "Forme de tigre"
			},
			"health": 2,
			"id": "OG_044c",
			"name": "Tiger Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "GVG_009.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Bombardière d’ombre"
			},
			"health": 1,
			"id": "GVG_009",
			"name": "Shadowbomber",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Josh Tallman",
			"cardImage": "CS2_026.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Nova de givre"
			},
			"id": "CS2_026",
			"name": "Frost Nova",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "NAX15_05.png",
			"cost": 0,
			"fr": {
				"name": "M. Bigglesworth"
			},
			"health": 1,
			"id": "NAX15_05",
			"name": "Mr. Bigglesworth",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "LOE_018e.png",
			"fr": {
				"name": "Trogg pas stupide"
			},
			"id": "LOE_018e",
			"name": "Trogg No Stupid",
			"playerClass": "Shaman",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Joe Wilson",
			"cardImage": "OG_080e.png",
			"cost": 1,
			"fr": {
				"name": "Toxine de pâlerette"
			},
			"id": "OG_080e",
			"name": "Fadeleaf Toxin",
			"playerClass": "Rogue",
			"set": "Og",
			"type": "Spell"
		},
		{
			"artist": "Luca Zontini",
			"attack": 2,
			"cardImage": "CS2_188.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Sergent grossier"
			},
			"health": 1,
			"id": "CS2_188",
			"name": "Abusive Sergeant",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NAX7_01H.png",
			"fr": {
				"name": "Instructeur Razuvious"
			},
			"health": 55,
			"id": "NAX7_01H",
			"name": "Instructor Razuvious",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "AT_021.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Minuscule chevalier maléfique"
			},
			"health": 2,
			"id": "AT_021",
			"name": "Tiny Knight of Evil",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_155ae.png",
			"fr": {
				"name": "Marque de la nature"
			},
			"id": "EX1_155ae",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Jim Nelson",
			"attack": 6,
			"cardImage": "GVG_062.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Gardien de cobalt"
			},
			"health": 3,
			"id": "GVG_062",
			"name": "Cobalt Guardian",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA06_04h.png",
			"cost": 2,
			"fr": {
				"name": "Pulsion destructrice"
			},
			"id": "LOEA06_04h",
			"name": "Shattering Spree",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_221e.png",
			"fr": {
				"name": "Ça pique !"
			},
			"id": "CS2_221e",
			"name": "Sharp!",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"artist": "Tooth",
			"attack": 3,
			"cardImage": "OG_286.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Ancien du Crépuscule"
			},
			"health": 4,
			"id": "OG_286",
			"name": "Twilight Elder",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "GVG_010.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Choix de Velen"
			},
			"id": "GVG_010",
			"name": "Velen's Chosen",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "Dan Dos Santos",
			"cardImage": "AT_015.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Convertir"
			},
			"id": "AT_015",
			"name": "Convert",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "TB_GP_01e_v2.png",
			"fr": {
				"name": "Camouflage de la tour des Ombres"
			},
			"id": "TB_GP_01e_v2",
			"name": "Shadow Tower Stealth",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Jason Chan",
			"cardImage": "GVG_057.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Sceau de Lumière"
			},
			"id": "GVG_057",
			"name": "Seal of Light",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "Richard Wright",
			"attack": 4,
			"cardImage": "GVG_054.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Cogneguerre ogre"
			},
			"id": "GVG_054",
			"name": "Ogre Warmaul",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Weapon"
		},
		{
			"cardImage": "EX1_155be.png",
			"fr": {
				"name": "Marque de la nature"
			},
			"id": "EX1_155be",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "GAME_004.png",
			"fr": {
				"name": "ABS"
			},
			"id": "GAME_004",
			"name": "AFK",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"artist": "Alexander Alexandrov",
			"attack": 3,
			"cardImage": "EX1_304.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Terreur du Vide"
			},
			"health": 3,
			"id": "EX1_304",
			"name": "Void Terror",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA14_8H.png",
			"cost": 6,
			"fr": {
				"name": "Activer Magmatron"
			},
			"id": "BRMA14_8H",
			"name": "Activate Magmatron",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "GVG_008.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Bombe de lumière"
			},
			"id": "GVG_008",
			"name": "Lightbomb",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Spell"
		},
		{
			"artist": "Gabor Szikszai",
			"cardImage": "AT_004.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Déflagration des Arcanes"
			},
			"id": "AT_004",
			"name": "Arcane Blast",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "CRED_21.png",
			"cost": 1,
			"fr": {
				"name": "Bryan Chang"
			},
			"health": 3,
			"id": "CRED_21",
			"name": "Bryan Chang",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "AT_099t.png",
			"cost": 5,
			"fr": {
				"name": "Kodo de guerre"
			},
			"health": 5,
			"id": "AT_099t",
			"name": "War Kodo",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_414e.png",
			"fr": {
				"name": "Enragé"
			},
			"id": "EX1_414e",
			"name": "Enraged",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "NEW1_036e2.png",
			"fr": {
				"name": "Cri de commandement"
			},
			"id": "NEW1_036e2",
			"name": "Commanding Shout",
			"playerClass": "Warrior",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA16_16H.png",
			"cost": 2,
			"fr": {
				"name": "Fouilles"
			},
			"id": "LOEA16_16H",
			"name": "Rummage",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOE_073e.png",
			"fr": {
				"name": "Fossilisé"
			},
			"id": "LOE_073e",
			"name": "Fossilized",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_041c.png",
			"fr": {
				"name": "Sombres feux follets"
			},
			"id": "GVG_041c",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Greg Staples",
			"attack": 5,
			"cardImage": "BRM_034.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Corrupteur de l’Aile noire"
			},
			"health": 4,
			"id": "BRM_034",
			"name": "Blackwing Corruptor",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Hideaki Takamura",
			"attack": 3,
			"cardImage": "GVG_048.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Bondisseur dent-de-métal"
			},
			"health": 3,
			"id": "GVG_048",
			"name": "Metaltooth Leaper",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "OG_316k.png",
			"fr": {
				"name": "Ténébreux"
			},
			"id": "OG_316k",
			"name": "Shadowy",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA02_02h.png",
			"cost": 0,
			"fr": {
				"name": "Intuition de djinn"
			},
			"id": "LOEA02_02h",
			"name": "Djinn’s Intuition",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"artist": "Leo Che",
			"attack": 3,
			"cardImage": "EX1_085.png",
			"collectible": true,
			"cost": 3,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Contrôleur mental"
			},
			"health": 3,
			"id": "EX1_085",
			"name": "Mind Control Tech",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "BRMA01_4t.png",
			"cost": 1,
			"fr": {
				"name": "Écluseur"
			},
			"health": 1,
			"id": "BRMA01_4t",
			"name": "Guzzler",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Sam Nielson",
			"attack": 2,
			"cardImage": "LOE_089.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Avortons tremblants"
			},
			"health": 6,
			"id": "LOE_089",
			"name": "Wobbling Runts",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "NAX6_01H.png",
			"fr": {
				"name": "Horreb"
			},
			"health": 99,
			"id": "NAX6_01H",
			"name": "Loatheb",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_054e.png",
			"fr": {
				"name": "Weapon Buff Enchant"
			},
			"id": "XXX_054e",
			"name": "Weapon Buff Enchant",
			"set": "Cheat",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"attack": 8,
			"cardImage": "GVG_121.png",
			"collectible": true,
			"cost": 12,
			"fr": {
				"name": "Géant mécanique"
			},
			"health": 8,
			"id": "GVG_121",
			"name": "Clockwork Giant",
			"rarity": "Epic",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Gabe from Penny Arcade",
			"cardImage": "EX1_539.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Ordre de tuer"
			},
			"id": "EX1_539",
			"name": "Kill Command",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"attack": 7,
			"cardImage": "GVG_079.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Char de force MAX"
			},
			"health": 7,
			"id": "GVG_079",
			"name": "Force-Tank MAX",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "LOE_089t.png",
			"cost": 2,
			"fr": {
				"name": "Avorton vaurien"
			},
			"health": 2,
			"id": "LOE_089t",
			"name": "Rascally Runt",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "José Ladrönn",
			"attack": 5,
			"cardImage": "GVG_066.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Chaman cognedune"
			},
			"health": 4,
			"id": "GVG_066",
			"name": "Dunemaul Shaman",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "NAX1h_04.png",
			"cost": 2,
			"fr": {
				"name": "Grouillement"
			},
			"id": "NAX1h_04",
			"name": "Skitter",
			"set": "Naxx",
			"type": "Hero_power"
		},
		{
			"artist": "Sunny Gho",
			"attack": 5,
			"cardImage": "EX1_014.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Roi Mukla"
			},
			"health": 5,
			"id": "EX1_014",
			"name": "King Mukla",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NAX8_03.png",
			"cost": 1,
			"fr": {
				"name": "Jeune recrue tenace"
			},
			"health": 2,
			"id": "NAX8_03",
			"name": "Unrelenting Trainee",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "OG_094e.png",
			"fr": {
				"name": "Tentacules"
			},
			"id": "OG_094e",
			"name": "Tentacles",
			"playerClass": "Priest",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"artist": "Carl Critchlow",
			"attack": 1,
			"cardImage": "GVG_018.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Maîtresse de Douleur"
			},
			"health": 4,
			"id": "GVG_018",
			"name": "Mistress of Pain",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "DS1_070o.png",
			"fr": {
				"name": "Présence du maître"
			},
			"id": "DS1_070o",
			"name": "Master's Presence",
			"playerClass": "Hunter",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_034.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu"
			},
			"id": "CS2_034",
			"name": "Fireblast",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_PickYourFate_2_EnchMinion.png",
			"fr": {
				"name": "Destin"
			},
			"id": "TB_PickYourFate_2_EnchMinion",
			"name": "Fate",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "GVG_072.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Boxeur de l’ombre"
			},
			"health": 3,
			"id": "GVG_072",
			"name": "Shadowboxer",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_038e.png",
			"fr": {
				"name": "Esprit ancestral"
			},
			"id": "CS2_038e",
			"name": "Ancestral Spirit",
			"playerClass": "Shaman",
			"set": "Expert1",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "TB_015.png",
			"cost": 2,
			"fr": {
				"name": "Pirate"
			},
			"health": 3,
			"id": "TB_015",
			"name": "Pirate",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA12_1H.png",
			"fr": {
				"name": "Naz’jar (héroïque)"
			},
			"health": 30,
			"id": "LOEA12_1H",
			"name": "Heroic Naz'jar",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA01_1H.png",
			"fr": {
				"name": "Coren Navrebière"
			},
			"health": 30,
			"id": "BRMA01_1H",
			"name": "Coren Direbrew",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Tyler Walpole",
			"attack": 0,
			"cardImage": "EX1_315.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Portail d’invocation"
			},
			"health": 4,
			"id": "EX1_315",
			"name": "Summoning Portal",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_043e.png",
			"fr": {
				"name": "Glaivezooka"
			},
			"id": "GVG_043e",
			"name": "Glaivezooka",
			"playerClass": "Hunter",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Mike Sass",
			"cardImage": "AT_013.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Mot de pouvoir : Gloire"
			},
			"id": "AT_013",
			"name": "Power Word: Glory",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"cardImage": "TU4f_006o.png",
			"fr": {
				"name": "Transcendance"
			},
			"id": "TU4f_006o",
			"name": "Transcendence",
			"set": "Missions",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_89.png",
			"cost": 2,
			"fr": {
				"name": "Cendres tourbillonnantes"
			},
			"health": 5,
			"id": "BRMC_89",
			"name": "Whirling Ash",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA11_1.png",
			"fr": {
				"name": "Vaelastrasz le Corrompu"
			},
			"health": 30,
			"id": "BRMA11_1",
			"name": "Vaelastrasz the Corrupt",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Tom Baxa",
			"cardImage": "EX1_570.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Morsure"
			},
			"id": "EX1_570",
			"name": "Bite",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_8.png",
			"cost": 2,
			"fr": {
				"name": "Mutation chromatique"
			},
			"id": "BRMA12_8",
			"name": "Chromatic Mutation",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "TB_KTRAF_4.png",
			"cost": 4,
			"fr": {
				"name": "Gothik le Moissonneur"
			},
			"health": 4,
			"id": "TB_KTRAF_4",
			"name": "Gothik the Harvester",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "LOE_009e.png",
			"fr": {
				"name": "Puissance sinistre"
			},
			"id": "LOE_009e",
			"name": "Sinister Power",
			"playerClass": "Warlock",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"attack": 6,
			"cardImage": "BRMA13_5.png",
			"cost": 0,
			"fr": {
				"name": "Fils de la Flamme"
			},
			"health": 3,
			"id": "BRMA13_5",
			"name": "Son of the Flame",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CS2_boar.png",
			"cost": 1,
			"fr": {
				"name": "Sanglier"
			},
			"health": 1,
			"id": "CS2_boar",
			"name": "Boar",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA11_2H.png",
			"cost": 0,
			"fr": {
				"name": "Essence des Rouges"
			},
			"id": "BRMA11_2H",
			"name": "Essence of the Red",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_KTRAF_101.png",
			"cost": 8,
			"fr": {
				"name": "Appel des ténèbres"
			},
			"id": "TB_KTRAF_101",
			"name": "Darkness Calls",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_043.png",
			"cost": 0,
			"fr": {
				"name": "Mill 30"
			},
			"id": "XXX_043",
			"name": "Mill 30",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA14_11.png",
			"cost": 0,
			"fr": {
				"name": "Recharge"
			},
			"id": "BRMA14_11",
			"name": "Recharge",
			"set": "Brm",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA01_2H.png",
			"cost": 0,
			"fr": {
				"name": "Jeu forcé !"
			},
			"id": "BRMA01_2H",
			"name": "Pile On!",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_045.png",
			"cost": 0,
			"fr": {
				"name": "Steal Card"
			},
			"id": "XXX_045",
			"name": "Steal Card",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_101_H1_AT_132.png",
			"cost": 2,
			"fr": {
				"name": "La Main d’argent"
			},
			"id": "CS2_101_H1_AT_132",
			"name": "The Silver Hand",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Hero_skins",
			"type": "Hero_power"
		},
		{
			"artist": "James Ryman",
			"attack": 2,
			"cardImage": "OG_156.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Murloc aileron-bilieux"
			},
			"health": 1,
			"id": "OG_156",
			"name": "Bilefin Tidehunter",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 20,
			"cardImage": "BRMC_95.png",
			"cost": 50,
			"fr": {
				"name": "Golemagg"
			},
			"health": 20,
			"id": "BRMC_95",
			"name": "Golemagg",
			"rarity": "Legendary",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "AT_132_WARLOCK.png",
			"cost": 2,
			"fr": {
				"name": "Connexion d’âme"
			},
			"id": "AT_132_WARLOCK",
			"name": "Soul Tap",
			"playerClass": "Warlock",
			"set": "Tgt",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOEA10_5.png",
			"cost": 5,
			"fr": {
				"name": "Mrgl mrgl niah niah !"
			},
			"id": "LOEA10_5",
			"name": "Mrgl Mrgl Nyah Nyah",
			"rarity": "Common",
			"set": "Loe",
			"type": "Spell"
		},
		{
			"cardImage": "AT_050t.png",
			"cost": 2,
			"fr": {
				"name": "Décharge de foudre"
			},
			"id": "AT_050t",
			"name": "Lightning Jolt",
			"playerClass": "Shaman",
			"set": "Tgt",
			"type": "Hero_power"
		},
		{
			"cardImage": "CS2_013t.png",
			"cost": 0,
			"fr": {
				"name": "Excès de mana"
			},
			"id": "CS2_013t",
			"name": "Excess Mana",
			"playerClass": "Druid",
			"set": "Core",
			"type": "Spell"
		},
		{
			"artist": "Kev Walker",
			"attack": 7,
			"cardImage": "NEW1_038.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Gruul"
			},
			"health": 7,
			"id": "NEW1_038",
			"name": "Gruul",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "NEW1_024.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Capitaine Vertepeau"
			},
			"health": 4,
			"id": "NEW1_024",
			"name": "Captain Greenskin",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "AT_006e.png",
			"fr": {
				"name": "Puissance de Dalaran"
			},
			"id": "AT_006e",
			"name": "Power of Dalaran",
			"playerClass": "Mage",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA14_2.png",
			"cost": 2,
			"fr": {
				"name": "Activer Arcanotron"
			},
			"id": "BRMA14_2",
			"name": "Activate Arcanotron",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Anton Magdalin",
			"attack": 1,
			"cardImage": "OG_156a.png",
			"cost": 1,
			"fr": {
				"name": "Limon"
			},
			"health": 1,
			"id": "OG_156a",
			"name": "Ooze",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "AT_035.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Embusqué"
			},
			"id": "AT_035",
			"name": "Beneath the Grounds",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Tgt",
			"type": "Spell"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 1,
			"cardImage": "LOE_116.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Chercheuse du Reliquaire"
			},
			"health": 1,
			"id": "LOE_116",
			"name": "Reliquary Seeker",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "OG_174e.png",
			"fr": {
				"name": "Sans-visage"
			},
			"id": "OG_174e",
			"name": "Faceless",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"attack": 6,
			"cardImage": "CRED_19.png",
			"cost": 4,
			"fr": {
				"name": "Beomki Hong"
			},
			"health": 3,
			"id": "CRED_19",
			"name": "Beomki Hong",
			"rarity": "Legendary",
			"set": "Credits",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_040.png",
			"fr": {
				"name": "Hogger"
			},
			"health": 10,
			"id": "XXX_040",
			"name": "Hogger",
			"playerClass": "Warrior",
			"set": "Cheat",
			"type": "Hero"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_25H.png",
			"cost": 10,
			"fr": {
				"name": "Dame Naz’jar"
			},
			"health": 10,
			"id": "LOEA16_25H",
			"name": "Lady Naz'jar",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA05_1H.png",
			"fr": {
				"name": "Baron Geddon"
			},
			"health": 50,
			"id": "BRMA05_1H",
			"name": "Baron Geddon",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Wayne Reynolds",
			"cardImage": "NEW1_036.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Cri de commandement"
			},
			"id": "NEW1_036",
			"name": "Commanding Shout",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Spell"
		},
		{
			"artist": "Andrew Robinson",
			"attack": 2,
			"cardImage": "EX1_534t.png",
			"cost": 2,
			"fr": {
				"name": "Hyène"
			},
			"health": 2,
			"id": "EX1_534t",
			"name": "Hyena",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "BRMC_88.png",
			"cost": 6,
			"fr": {
				"name": "Pourfendeur drakônide"
			},
			"health": 6,
			"id": "BRMC_88",
			"name": "Drakonid Slayer",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"cardImage": "TB_Pilot1.png",
			"fr": {
				"name": "Pilote mystère"
			},
			"id": "TB_Pilot1",
			"name": "Mystery Pilot",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX14_01H.png",
			"fr": {
				"name": "Saphiron"
			},
			"health": 45,
			"id": "NAX14_01H",
			"name": "Sapphiron",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "NAX5_01.png",
			"fr": {
				"name": "Heigan l’Impur"
			},
			"health": 30,
			"id": "NAX5_01",
			"name": "Heigan the Unclean",
			"playerClass": "Warlock",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA13_4H.png",
			"cost": 1,
			"fr": {
				"name": "Magie sauvage"
			},
			"id": "BRMA13_4H",
			"name": "Wild Magic",
			"set": "Brm",
			"type": "Hero_power"
		},
		{
			"artist": "Mike Sass",
			"attack": 7,
			"cardImage": "AT_128.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Le chevalier squelette"
			},
			"health": 4,
			"id": "AT_128",
			"name": "The Skeleton Knight",
			"rarity": "Legendary",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_2.png",
			"cost": 0,
			"fr": {
				"name": "Bâton de l’Origine"
			},
			"id": "LOEA16_2",
			"name": "Staff of Origination",
			"set": "Loe",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "FP1_002t.png",
			"cost": 1,
			"fr": {
				"name": "Araignée spectrale"
			},
			"health": 1,
			"id": "FP1_002t",
			"name": "Spectral Spider",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_049e.png",
			"fr": {
				"name": "Puissance de Zul’Farrak"
			},
			"id": "GVG_049e",
			"name": "Might of Zul'Farrak",
			"playerClass": "Hunter",
			"set": "Gvg",
			"type": "Enchantment"
		},
		{
			"artist": "Daren Bader",
			"attack": 3,
			"cardImage": "NEW1_041.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Kodo déchaîné"
			},
			"health": 5,
			"id": "NEW1_041",
			"name": "Stampeding Kodo",
			"rarity": "Rare",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_056.png",
			"cost": 2,
			"fr": {
				"name": "Connexion"
			},
			"id": "CS2_056",
			"name": "Life Tap",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"type": "Hero_power"
		},
		{
			"attack": 3,
			"cardImage": "LOEA09_5H.png",
			"cost": 3,
			"fr": {
				"name": "Naga affamé"
			},
			"health": 3,
			"id": "LOEA09_5H",
			"name": "Hungry Naga",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "Mekka4.png",
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Pouletisateur"
			},
			"health": 3,
			"id": "Mekka4",
			"name": "Poultryizer",
			"rarity": "Common",
			"set": "Promo",
			"type": "Minion"
		}
	]
}