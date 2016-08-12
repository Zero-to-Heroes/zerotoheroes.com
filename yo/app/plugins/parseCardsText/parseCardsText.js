var parseCardsText = {
	cardRegex: /\[\[.+?\]\]/gm,
	manaRegex: /\d(\d)?-mana/gm,
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

	localizeText: function(card, lang) {
		if (!card) return ''
			
		lang = lang || parseCardsText.getLang()
		if (!lang) return card.text
		if (!card[lang]) return card.text
		return card[lang].text
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
			"cardImage": "TBA01_6.png",
			"cost": 2,
			"fr": {
				"name": "Rage du magma",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un enragé du magma 5/1."
			},
			"id": "TBA01_6",
			"name": "Molten Rage",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nSummon a 5/1 Magma Rager.",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_FactionWar_BoomBot_Spell.png",
			"cost": 1,
			"fr": {
				"name": "TBFactionWarBoomBotSpell"
			},
			"id": "TB_FactionWar_BoomBot_Spell",
			"name": "TBFactionWarBoomBotSpell",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"attack": 3,
			"cardImage": "KAR_011.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Comédien pompeux",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "KAR_011",
			"name": "Pompous Thespian",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_005.png",
			"cost": 0,
			"fr": {
				"name": "Destroy",
				"text": "Destroy a minion or hero."
			},
			"id": "XXX_005",
			"name": "Destroy",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Destroy a minion or hero.",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "LOEA15_3.png",
			"cost": 3,
			"fr": {
				"name": "Raptor d’os",
				"text": "<b>Cri de guerre :</b> prend le contrôle de l’arme de votre adversaire."
			},
			"health": 2,
			"id": "LOEA15_3",
			"name": "Boneraptor",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Battlecry:</b>Take control of your opponent's weapon.",
			"type": "Minion"
		},
		{
			"artist": "Garrett Hanna",
			"attack": 3,
			"cardImage": "OG_337.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Horreur cyclopéenne",
				"text": "<b>Provocation</b>. <b>Cri de guerre :</b> gagne +1 PV pour\nchaque serviteur adverse."
			},
			"health": 3,
			"id": "OG_337",
			"name": "Cyclopian Horror",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Taunt</b>. <b>Battlecry:</b> Gain      +1 Health for each enemy minion.",
			"type": "Minion"
		},
		{
			"artist": "James Zhang",
			"cardImage": "EX1_137.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Casse-tête",
				"text": "Inflige $2 |4(point,points) de dégâts au héros adverse. <b>Combo :</b> renvoie cette carte dans votre main au tour suivant."
			},
			"id": "EX1_137",
			"name": "Headcrack",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Deal $2 damage to the enemy hero. <b>Combo:</b> Return this to your hand next turn.",
			"type": "Spell"
		},
		{
			"artist": "Wei Wang",
			"attack": 5,
			"cardImage": "GVG_028.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Prince marchand Gallywix",
				"text": "Chaque fois que votre adversaire lance un sort, il obtient une Pièce et vous gagnez une copie du sort."
			},
			"health": 8,
			"id": "GVG_028",
			"name": "Trade Prince Gallywix",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "Whenever your opponent casts a spell, gain a copy of it and give them a Coin.",
			"type": "Minion"
		},
		{
			"cardImage": "LOE_113e.png",
			"fr": {
				"name": "Mrglllroaarrrglrur !",
				"text": "+2/+2."
			},
			"id": "LOE_113e",
			"name": "Mrglllraawrrrglrur!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "DS1h_292_H1_AT_132.png",
			"cost": 2,
			"fr": {
				"name": "Tir de baliste",
				"text": "<b>Pouvoir héroïque</b>\nInflige $3 points de dégâts au héros adverse."
			},
			"id": "DS1h_292_H1_AT_132",
			"name": "Ballista Shot",
			"playerClass": "Hunter",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nDeal $3 damage to the enemy hero.",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX15_04H.png",
			"cost": 8,
			"fr": {
				"name": "Chaînes",
				"text": "<b>Pouvoir héroïque</b>\nPrend le contrôle d’un serviteur adverse aléatoire."
			},
			"id": "NAX15_04H",
			"name": "Chains",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nTake control of a random enemy minion.",
			"type": "Hero_power"
		},
		{
			"cardImage": "AT_014e.png",
			"fr": {
				"name": "Effet d’ombrefiel",
				"text": "Coûte (1) |4(cristal,cristaux) de moins."
			},
			"id": "AT_014e",
			"name": "Shadowfiended",
			"playerClass": "Priest",
			"set": "Tgt",
			"text": "Costs (1) less.",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_094e.png",
			"fr": {
				"name": "Tentacules",
				"text": "+2/+6"
			},
			"id": "OG_094e",
			"name": "Tentacles",
			"playerClass": "Priest",
			"set": "Og",
			"text": "+2/+6",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRM_027h.png",
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 8,
			"id": "BRM_027h",
			"name": "Ragnaros the Firelord",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_99.png",
			"cost": 5,
			"fr": {
				"name": "Garr",
				"text": "Invoque un élémentaire 2/3 avec <b>Provocation</b> chaque fois que ce serviteur subit des dégâts."
			},
			"health": 8,
			"id": "BRMC_99",
			"name": "Garr",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Whenever this minion takes damage, summon a 2/3 Elemental with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_132_PRIEST.png",
			"cost": 2,
			"fr": {
				"name": "Soins",
				"text": "<b>Pouvoir héroïque</b>\nRend #4 PV."
			},
			"id": "AT_132_PRIEST",
			"name": "Heal",
			"playerClass": "Priest",
			"set": "Tgt",
			"text": "<b>Hero Power</b>\nRestore #4 Health.",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA12_5.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : bleu",
				"text": "Les sorts de Chromaggus coûtent (1) |4(cristal,cristaux) de moins tant que vous avez cette carte dans votre main."
			},
			"id": "BRMA12_5",
			"name": "Brood Affliction: Blue",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "While this is in your hand, Chromaggus' spells cost (1) less.",
			"type": "Spell"
		},
		{
			"artist": "Nutthapon Petchthai",
			"attack": 1,
			"cardImage": "AT_034.png",
			"collectible": true,
			"cost": 4,
			"durability": 3,
			"fr": {
				"name": "Lame empoisonnée",
				"text": "Votre pouvoir héroïque donne à cette arme\n+1 ATQ au lieu de la remplacer."
			},
			"id": "AT_034",
			"name": "Poisoned Blade",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Your Hero Power gives this weapon +1 Attack instead of replacing it.",
			"type": "Weapon"
		},
		{
			"cardImage": "BRMA16_2.png",
			"cost": 1,
			"fr": {
				"name": "Écholocation",
				"text": "<b>Pouvoir héroïque</b>\nS’équipe d’une arme qui croît à mesure que l’adversaire joue des cartes."
			},
			"id": "BRMA16_2",
			"name": "Echolocate",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nEquip a weapon that grows as your opponent plays cards.",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA01_4.png",
			"cost": 3,
			"fr": {
				"name": "Chopez-les !",
				"text": "Invoque quatre nains 1/1 avec <b>Provocation</b>."
			},
			"id": "BRMA01_4",
			"name": "Get 'em!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Summon four 1/1 Dwarves with <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "TB_SPT_Minion1.png",
			"cost": 2,
			"fr": {
				"name": "Porte-pavois",
				"text": "<b>Provocation</b>.\n<b>Cri de guerre_:</b> gagne un nombre de PV équivalent à l’attaque de Hurlevent."
			},
			"health": 1,
			"id": "TB_SPT_Minion1",
			"name": "Shieldsman",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Taunt</b>\n<b>Battlecry:</b> Gain Health equal to Stormwind's Attack.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA13_1.png",
			"fr": {
				"name": "Seigneur Victor Nefarius"
			},
			"health": 30,
			"id": "BRMA13_1",
			"name": "Lord Victor Nefarius",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 5,
			"cardImage": "AT_096.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Chevalier mécanique",
				"text": "<b>Cri de guerre :</b> donne +1/+1 à un Méca allié."
			},
			"health": 5,
			"id": "AT_096",
			"name": "Clockwork Knight",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Give a friendly Mech +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Slawomir Maniak",
			"cardImage": "EX1_607.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Rage intérieure",
				"text": "Inflige $1 |4(point,points) de dégâts à un serviteur et lui confère +2 ATQ."
			},
			"id": "EX1_607",
			"name": "Inner Rage",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Deal $1 damage to a minion and give it +2 Attack.",
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 1,
			"cardImage": "KAR_A10_02.png",
			"cost": 1,
			"fr": {
				"name": "Pion blanc",
				"text": "<b>Attaque automatique_:</b> inflige 1 point de dégâts aux adversaires en face de ce serviteur."
			},
			"health": 6,
			"id": "KAR_A10_02",
			"name": "White Pawn",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Auto-Attack:</b> Deal 1 damage to the enemies opposite this minion.",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 1,
			"cardImage": "FP1_031.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Baron Vaillefendre",
				"text": "Vos serviteurs déclenchent deux fois leur <b>Râle d’agonie</b>."
			},
			"health": 7,
			"id": "FP1_031",
			"name": "Baron Rivendare",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "Your minions trigger their <b>Deathrattles</b> twice.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_8rand.png",
			"cost": 0,
			"fr": {
				"name": "Destin : Armure",
				"text": "Chaque joueur gagne +2 Armure au début de son tour."
			},
			"id": "TB_PickYourFate_8rand",
			"name": "Fate: Armor",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Each player gains 2 Armor on the start of their turn.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_8_EnchRand.png",
			"fr": {
				"name": "Destin aléatoire 8 : +2 Armure à chaque tour"
			},
			"id": "TB_PickYourFate_8_EnchRand",
			"name": "Fate 8 Rand 2 armor each turn",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "KARA_08_04.png",
			"cost": 2,
			"fr": {
				"name": "Renforcement",
				"text": "Donne +8 ATQ à votre héros pendant ce tour."
			},
			"id": "KARA_08_04",
			"name": "Empowerment",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Give your hero +8 Attack this turn.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA07_21.png",
			"cost": 1,
			"fr": {
				"name": "Foncer en avant",
				"text": "Vous rapproche d’un tour de la sortie !"
			},
			"id": "LOEA07_21",
			"name": "Barrel Forward",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Get 1 turn closer to the Exit!",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_103.png",
			"cost": 0,
			"fr": {
				"name": "Add 2 to Health",
				"text": "Adds 2 health to a damaged character. Does NOT heal."
			},
			"id": "XXX_103",
			"name": "Add 2 to Health",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Adds 2 health to a damaged character. Does NOT heal.",
			"type": "Spell"
		},
		{
			"artist": "Greg Staples",
			"attack": 8,
			"cardImage": "EX1_298.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Ragnaros, seigneur du feu",
				"text": "Ne peut pas attaquer. À la fin de votre tour, inflige 8 points de dégâts à un adversaire aléatoire."
			},
			"health": 8,
			"id": "EX1_298",
			"name": "Ragnaros the Firelord",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "Can't attack. At the end of your turn, deal 8 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA06_2H.png",
			"cost": 2,
			"fr": {
				"name": "Le chambellan",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un acolyte attise-flammes 3/3."
			},
			"id": "BRMA06_2H",
			"name": "The Majordomo",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon a 3/3 Flamewaker Acolyte.",
			"type": "Hero_power"
		},
		{
			"cardImage": "CS2_104e.png",
			"fr": {
				"name": "Saccager",
				"text": "+3/+3."
			},
			"id": "CS2_104e",
			"name": "Rampage",
			"playerClass": "Warrior",
			"set": "Expert1",
			"text": "+3/+3.",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_315e.png",
			"fr": {
				"name": "Reforgé",
				"text": "+1/+1."
			},
			"id": "OG_315e",
			"name": "Reforged",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_312e.png",
			"fr": {
				"name": "Amélioration",
				"text": "Durabilité augmentée."
			},
			"id": "OG_312e",
			"name": "Upgraded",
			"playerClass": "Warrior",
			"set": "Og",
			"text": "Increased Durability.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NEW1_008b.png",
			"cost": 0,
			"fr": {
				"name": "Secrets anciens",
				"text": "Rend 5 points de vie."
			},
			"id": "NEW1_008b",
			"name": "Ancient Secrets",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Restore 5 Health.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"cardImage": "AT_033.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Larcin",
				"text": "Ajoute 2 cartes de classe aléatoires dans votre main <i>(de la classe de votre adversaire)</i>."
			},
			"id": "AT_033",
			"name": "Burgle",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "Add 2 random class cards to your hand <i>(from your opponent's class)</i>.",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "OG_254.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mange-secrets",
				"text": "<b>Cri de guerre :</b> détruit tous les <b>secrets</b> adverses. Gagne +1/+1 par secret détruit."
			},
			"health": 4,
			"id": "OG_254",
			"name": "Eater of Secrets",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> Destroy all enemy <b>Secrets</b>. Gain +1/+1 for each.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMC_98e.png",
			"fr": {
				"name": "Soif de dragon",
				"text": "+3 ATQ."
			},
			"id": "BRMC_98e",
			"name": "Dragonlust",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_164a.png",
			"cost": 0,
			"fr": {
				"name": "Nourrir",
				"text": "Vous gagnez 2 cristaux de mana."
			},
			"id": "EX1_164a",
			"name": "Nourish",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Gain 2 Mana Crystals.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "CS2_mirror.png",
			"cost": 0,
			"fr": {
				"name": "Image miroir",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "CS2_mirror",
			"name": "Mirror Image",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_09_01heroic.png",
			"fr": {
				"name": "Terestian Malsabot"
			},
			"health": 40,
			"id": "KARA_09_01heroic",
			"name": "Terestian Illhoof",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "TBA01_1.png",
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 60,
			"id": "TBA01_1",
			"name": "Ragnaros the Firelord",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"cardImage": "PART_007e.png",
			"fr": {
				"name": "Lames tourbillonnantes",
				"text": "+1 ATQ."
			},
			"id": "PART_007e",
			"name": "Whirling Blades",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "+1 Attack.",
			"type": "Enchantment"
		},
		{
			"attack": 3,
			"cardImage": "KARA_13_23.png",
			"cost": 5,
			"fr": {
				"name": "Romulo",
				"text": "À la fin de votre tour, rend 5_PV à votre héros."
			},
			"health": 4,
			"id": "KARA_13_23",
			"name": "Romulo",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "At the end of your turn, restore 5 health to your hero.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_008.png",
			"cost": 0,
			"fr": {
				"name": "Freeze",
				"text": "<b>Freeze</b> a character."
			},
			"id": "XXX_008",
			"name": "Freeze",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "<b>Freeze</b> a character.",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"attack": 3,
			"cardImage": "LOE_017.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gardienne d’Uldaman",
				"text": "<b>Cri de guerre :</b> fait passer l’Attaque et la Vie d’un serviteur à 3."
			},
			"health": 4,
			"id": "LOE_017",
			"name": "Keeper of Uldaman",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Battlecry:</b> Set a minion's Attack and Health to 3.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_111.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - All Charge, All Windfury!",
				"text": "Play this card to give all minions <b>Charge</b> and <b>Windfury</b>."
			},
			"id": "XXX_111",
			"name": "AI Buddy - All Charge, All Windfury!",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Play this card to give all minions <b>Charge</b> and <b>Windfury</b>.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "LOEA09_7H.png",
			"cost": 0,
			"fr": {
				"name": "Chaudron",
				"text": "<b>Provocation</b>\n<b>Râle d’agonie :</b> libère Sir Finley !"
			},
			"health": 10,
			"id": "LOEA09_7H",
			"name": "Cauldron",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Taunt</b>\n<b>Deathrattle:</b> Save Sir Finley!",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA12_2H.png",
			"cost": 0,
			"fr": {
				"name": "Perle des marées",
				"text": "À la fin de votre tour, remplace tous les serviteurs par de nouveaux. Les vôtres coûtent (1) |4(cristal,cristaux) de plus."
			},
			"id": "LOEA12_2H",
			"name": "Pearl of the Tides",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "At the end of your turn, replace all minions with new ones. Yours cost (1) more.",
			"type": "Hero_power"
		},
		{
			"artist": "Rafael Zanchetin",
			"attack": 3,
			"cardImage": "KAR_021.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Méchante sorcière",
				"text": "Chaque fois que vous lancez un sort, invoque un totem basique aléatoire."
			},
			"health": 4,
			"id": "KAR_021",
			"name": "Wicked Witchdoctor",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Kara",
			"text": "Whenever you cast a spell, summon a random basic_Totem.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_4H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : vert",
				"text": "Rend 6 PV à votre adversaire au début de votre tour tant que vous avez cette carte dans votre main."
			},
			"id": "BRMA12_4H",
			"name": "Brood Affliction: Green",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "While this is in your hand, restore 6 health to your opponent at the start of your turn.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_017o.png",
			"fr": {
				"name": "Griffes",
				"text": "Votre héros a +1 ATQ pendant ce tour."
			},
			"id": "CS2_017o",
			"name": "Claws",
			"playerClass": "Druid",
			"set": "Core",
			"text": "Your hero has +1 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 3,
			"cardImage": "GVG_107.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mécano-amplificateur",
				"text": "<b>Cri de guerre :</b> donne à vos autres serviteurs <b>Furie des vents</b>, <b>Provocation</b> ou <b>Bouclier divin</b>. <i>(Au hasard)</i>"
			},
			"health": 2,
			"id": "GVG_107",
			"name": "Enhance-o Mechano",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Give your other minions <b>Windfury</b>, <b>Taunt</b>, or <b>Divine Shield</b>.\n<i>(at random)</i>",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_017.png",
			"cost": 0,
			"fr": {
				"name": "Draw 3 Cards",
				"text": "Draw 3 cards."
			},
			"id": "XXX_017",
			"name": "Draw 3 Cards",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Draw 3 cards.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA05_1H.png",
			"fr": {
				"name": "Baron Geddon"
			},
			"health": 50,
			"id": "BRMA05_1H",
			"name": "Baron Geddon",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Brad Vancata",
			"cardImage": "CS2_009.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Marque du fauve",
				"text": "Confère <b>Provocation</b> et +2/+2 à un serviteur.<i> (+2 ATQ/+2 PV)</i>"
			},
			"id": "CS2_009",
			"name": "Mark of the Wild",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"text": "Give a minion <b>Taunt</b> and +2/+2.<i> (+2 Attack/+2 Health)</i>",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_102.png",
			"cost": 0,
			"fr": {
				"name": "Add 1 to Health.",
				"text": "Adds 1 health to a damaged character. Does NOT heal."
			},
			"id": "XXX_102",
			"name": "Add 1 to Health.",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Adds 1 health to a damaged character. Does NOT heal.",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_027pH.png",
			"cost": 2,
			"fr": {
				"name": "MOUREZ, INSECTES !",
				"text": "<b>Pouvoir héroïque</b>\nInflige $8 points de dégâts à un adversaire aléatoire. DEUX FOIS."
			},
			"id": "BRM_027pH",
			"name": "DIE, INSECTS!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nDeal $8 damage to a random enemy. TWICE.",
			"type": "Hero_power"
		},
		{
			"cardImage": "DREAM_05e.png",
			"fr": {
				"name": "Cauchemar",
				"text": "Ce serviteur a +5/+5, mais il sera bientôt détruit."
			},
			"id": "DREAM_05e",
			"name": "Nightmare",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "This minion has +5/+5, but will be destroyed soon.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA16_5e.png",
			"fr": {
				"name": "Je vous entends…",
				"text": "Attaque augmentée."
			},
			"id": "BRMA16_5e",
			"name": "I hear you...",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_188e.png",
			"fr": {
				"name": "Carapace d’ambre",
				"text": "+5 PV."
			},
			"id": "OG_188e",
			"name": "Amber Carapace",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+5 Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX11_04.png",
			"cost": 3,
			"fr": {
				"name": "Injection mutante",
				"text": "Confère à un serviteur +4/+4 et <b>Provocation</b>."
			},
			"id": "NAX11_04",
			"name": "Mutating Injection",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Give a minion +4/+4 and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX8_02H_TB.png",
			"cost": 2,
			"fr": {
				"name": "Moisson",
				"text": "<b>Pouvoir héroïque</b>\nVous piochez une carte et gagnez un cristal de mana."
			},
			"id": "NAX8_02H_TB",
			"name": "Harvest",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nDraw a card. Gain a Mana Crystal.",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMC_97e.png",
			"fr": {
				"name": "Montée d’adrénaline",
				"text": "Coûte (2) cristaux de moins."
			},
			"id": "BRMC_97e",
			"name": "Burning Adrenaline",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Costs (2) less.",
			"type": "Enchantment"
		},
		{
			"cardImage": "KARA_07_08heroic.png",
			"cost": 5,
			"fr": {
				"name": "Évasion de dragon !",
				"text": "Invoque un Dragon aléatoire."
			},
			"id": "KARA_07_08heroic",
			"name": "Dragons Free!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon a random Dragon.",
			"type": "Spell"
		},
		{
			"artist": "Markus Erdt",
			"cardImage": "EX1_158.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Âme de la forêt",
				"text": "Confère à vos serviteurs « <b>Râle d’agonie :</b> invoque un tréant 2/2. »"
			},
			"id": "EX1_158",
			"name": "Soul of the Forest",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Give your minions \"<b>Deathrattle:</b> Summon a 2/2 Treant.\"",
			"type": "Spell"
		},
		{
			"cardImage": "TB_KTRAF_HP_RAF3.png",
			"cost": 2,
			"fr": {
				"name": "Premier morceau du bâton",
				"text": "Ajoute une carte rare aléatoire dans votre main. Elle coûte (2) cristaux de moins."
			},
			"id": "TB_KTRAF_HP_RAF3",
			"name": "Staff, First Piece",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Add a random rare card to your hand. It costs (2) less.",
			"type": "Hero_power"
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
			"attack": 5,
			"cardImage": "CRED_43.png",
			"cost": 5,
			"fr": {
				"name": "Jon Bankard",
				"text": "50% de chances d’avoir raison à 100%."
			},
			"health": 5,
			"id": "CRED_43",
			"name": "Jon Bankard",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "50% chance to be 100% right.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_Confused.png",
			"fr": {
				"name": "Destin",
				"text": "Attaque et Vie échangées à la fin de chaque tour."
			},
			"id": "TB_PickYourFate_Confused",
			"name": "Fate",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Attack and Health swap at end of each turn.",
			"type": "Enchantment"
		},
		{
			"attack": 6,
			"cardImage": "CRED_29.png",
			"cost": 5,
			"fr": {
				"name": "Jason MacAllister",
				"text": "<i>C’est un gars vraiment fiable.</i>"
			},
			"health": 5,
			"id": "CRED_29",
			"name": "Jason MacAllister",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<i>He's a real stand-up guy.</i>",
			"type": "Minion"
		},
		{
			"artist": "Evgeniy Zagumennyy",
			"attack": 2,
			"cardImage": "AT_071.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Championne d’Alexstrasza",
				"text": "<b>Cri de guerre :</b> gagne\n+1 ATQ et <b>Charge</b> si vous avez un Dragon en main."
			},
			"health": 3,
			"id": "AT_071",
			"name": "Alexstrasza's Champion",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1 Attack and <b>Charge</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_112.png",
			"cost": 0,
			"fr": {
				"name": "Fill Deck",
				"text": "Fill target hero's deck with random cards."
			},
			"id": "XXX_112",
			"name": "Fill Deck",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Fill target hero's deck with random cards.",
			"type": "Spell"
		},
		{
			"artist": "Chris Moeller",
			"attack": 3,
			"cardImage": "EX1_134.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Agent du SI:7",
				"text": "<b>Combo :</b> inflige 2 points de dégâts."
			},
			"health": 3,
			"id": "EX1_134",
			"name": "SI:7 Agent",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Combo:</b> Deal 2 damage.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "AT_073.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Esprit combatif",
				"text": "<b>Secret :</b> donne +1/+1 à vos serviteurs quand votre tour commence."
			},
			"id": "AT_073",
			"name": "Competitive Spirit",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Secret:</b> When your turn starts, give your minions +1/+1.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_006.png",
			"cost": 1,
			"fr": {
				"name": "Grande banane",
				"text": "Confère +2/+2 à un serviteur."
			},
			"id": "TB_006",
			"name": "Big Banana",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Give a minion +2/+2.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_3e.png",
			"fr": {
				"name": "Lanterne de puissance",
				"text": "+10/+10."
			},
			"id": "LOEA16_3e",
			"name": "Lantern of Power",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "+10/+10.",
			"type": "Enchantment"
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
			"cardImage": "NAX12_02H_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Décimer",
				"text": "<b>Pouvoir héroïque</b>\nFait passer les points de vie des serviteurs adverses à 1."
			},
			"id": "NAX12_02H_2_TB",
			"name": "Decimate",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nChange the Health of enemy minions to 1.",
			"type": "Hero_power"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "AT_078.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Entrée dans le Colisée",
				"text": "Détruit tous les serviteurs excepté le serviteur ayant l’Attaque la plus élevée pour chaque joueur."
			},
			"id": "AT_078",
			"name": "Enter the Coliseum",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Destroy all minions except each player's highest Attack minion.",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_030t.png",
			"cost": 4,
			"fr": {
				"name": "Balayage de queue",
				"text": "Inflige $4 |4(point,points) de dégâts."
			},
			"id": "BRM_030t",
			"name": "Tail Swipe",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Deal $4 damage.",
			"type": "Spell"
		},
		{
			"artist": "Ryan Metcalf",
			"attack": 3,
			"cardImage": "AT_028.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Chevaucheur pandashan",
				"text": "<b>Combo :</b> gagne +3 ATQ."
			},
			"health": 7,
			"id": "AT_028",
			"name": "Shado-Pan Rider",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Combo:</b> Gain +3 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX4_04H.png",
			"cost": 0,
			"fr": {
				"name": "Réanimation morbide",
				"text": "<b>Pouvoir héroïque passif</b>\nChaque fois qu’un adversaire meurt, un squelette 5/5 se lève."
			},
			"id": "NAX4_04H",
			"name": "Raise Dead",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Passive Hero Power</b>\nWhenever an enemy dies, raise a 5/5 Skeleton.",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_278.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Kriss",
				"text": "Inflige $1 |4(point,points) de dégâts. Vous piochez une carte."
			},
			"id": "EX1_278",
			"name": "Shiv",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $1 damage. Draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_15.png",
			"cost": 0,
			"fr": {
				"name": "Larme d’Ysera",
				"text": "Gagne 4 cristaux de mana pendant ce tour uniquement."
			},
			"id": "LOEA16_15",
			"name": "Ysera's Tear",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Gain 4 Mana Crystals this turn only.",
			"type": "Spell"
		},
		{
			"artist": "Arthur Gimaldinov",
			"attack": 4,
			"cardImage": "KAR_A10_08.png",
			"cost": 4,
			"fr": {
				"name": "Cavalier blanc",
				"text": "<b>Charge</b>.\nNe peut pas attaquer les héros."
			},
			"health": 3,
			"id": "KAR_A10_08",
			"name": "White Knight",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Charge</b>.\nCan't Attack Heroes.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_014a.png",
			"fr": {
				"name": "Dissimulé",
				"text": "La Vie a été échangée."
			},
			"id": "GVG_014a",
			"name": "Shadowed",
			"playerClass": "Priest",
			"set": "Gvg",
			"text": "Health was swapped.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NEW1_033o.png",
			"fr": {
				"name": "Œil céleste",
				"text": "Leokk confère +1 ATQ à ce serviteur."
			},
			"id": "NEW1_033o",
			"name": "Eye In The Sky",
			"playerClass": "Hunter",
			"set": "Core",
			"text": "Leokk is granting this minion +1 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Steve Hui",
			"cardImage": "EX1_128.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Dissimuler",
				"text": "Confère <b>Camouflage</b> à vos serviteurs jusqu’à votre prochain tour."
			},
			"id": "EX1_128",
			"name": "Conceal",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Give your minions <b>Stealth</b> until your next turn.",
			"type": "Spell"
		},
		{
			"artist": "Edouard Guiton & Stuido HIVE",
			"attack": 3,
			"cardImage": "BRM_020.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Sorcier draconien",
				"text": "Gagne +1/+1 chaque fois que <b>vous</b> ciblez ce serviteur avec un sort."
			},
			"health": 5,
			"id": "BRM_020",
			"name": "Dragonkin Sorcerer",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Brm",
			"text": "Whenever <b>you</b> target this minion with a spell, gain +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_623e.png",
			"fr": {
				"name": "Infusion",
				"text": "+3 PV."
			},
			"id": "EX1_623e",
			"name": "Infusion",
			"playerClass": "Priest",
			"set": "Expert1",
			"text": "+3 Health.",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "BRMA17_7.png",
			"cost": 2,
			"fr": {
				"name": "Prototype chromatique",
				"text": "<b>Provocation</b>"
			},
			"health": 4,
			"id": "BRMA17_7",
			"name": "Chromatic Prototype",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 1,
			"cardImage": "EX1_509.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Mande-flots murloc",
				"text": "Chaque fois qu’un murloc est invoqué, gagne\n+1 ATQ."
			},
			"health": 2,
			"id": "EX1_509",
			"name": "Murloc Tidecaller",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Whenever a Murloc is summoned, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_008.png",
			"cost": 1,
			"fr": {
				"name": "Banane pourrie",
				"text": "Inflige $1 |4(point,points) de dégâts."
			},
			"id": "TB_008",
			"name": "Rotten Banana",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Deal $1 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpv3_006.png",
			"cost": 0,
			"fr": {
				"name": "Éruption élémentaire",
				"text": "Inflige 4 à 6 points de dégâts à tous les autres serviteurs."
			},
			"id": "TB_CoOpv3_006",
			"name": "Elemental Eruption",
			"playerClass": "Shaman",
			"set": "Tb",
			"text": "Deal 4-6 damage to all other minions.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA14_1.png",
			"fr": {
				"name": "Système de défense Omnitron"
			},
			"health": 30,
			"id": "BRMA14_1",
			"name": "Omnotron Defense System",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
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
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_13_01H.png",
			"fr": {
				"name": "Nazra Hache-Furieuse"
			},
			"health": 15,
			"id": "KARA_13_01H",
			"name": "Nazra Wildaxe",
			"playerClass": "Warrior",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 6,
			"cardImage": "GVG_120.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Hemet Nesingwary",
				"text": "<b>Cri de guerre :</b> détruit une Bête."
			},
			"health": 3,
			"id": "GVG_120",
			"name": "Hemet Nesingwary",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Destroy a Beast.",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"cardImage": "CS2_108.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Exécution",
				"text": "Détruit un serviteur adverse blessé."
			},
			"id": "CS2_108",
			"name": "Execute",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"text": "Destroy a damaged enemy minion.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA03_1.png",
			"fr": {
				"name": "Empereur Thaurissan"
			},
			"health": 30,
			"id": "BRMA03_1",
			"name": "Emperor Thaurissan",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "NEW1_018.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Mousse de la Voile sanglante",
				"text": "<b>Cri de guerre :</b> gagne des points d’Attaque d’un montant équivalent à ceux de votre arme."
			},
			"health": 3,
			"id": "NEW1_018",
			"name": "Bloodsail Raider",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Gain Attack equal to the Attack of your weapon.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "skele11.png",
			"cost": 1,
			"fr": {
				"name": "Squelette",
				"text": "<b></b>"
			},
			"health": 1,
			"id": "skele11",
			"name": "Skeleton",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b></b> ",
			"type": "Minion"
		},
		{
			"cardImage": "OG_113e.png",
			"fr": {
				"name": "Puissance du peuple",
				"text": "Attaque augmentée."
			},
			"id": "OG_113e",
			"name": "Power of the People",
			"playerClass": "Warlock",
			"set": "Og",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "G.Tsai & K. Turovec",
			"attack": 1,
			"cardImage": "KAR_A02_02.png",
			"cost": 1,
			"durability": 3,
			"fr": {
				"name": "Cuillère"
			},
			"id": "KAR_A02_02",
			"name": "Spoon",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX5_02H.png",
			"cost": 0,
			"fr": {
				"name": "Éruption",
				"text": "<b>Pouvoir héroïque</b>\nInflige 3 points de dégâts au serviteur adverse tout à gauche."
			},
			"id": "NAX5_02H",
			"name": "Eruption",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDeal 3 damage to the left-most enemy minion.",
			"type": "Hero_power"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "FP1_025.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Réincarnation",
				"text": "Détruit un serviteur, puis le ramène à la vie avec tous ses PV."
			},
			"id": "FP1_025",
			"name": "Reincarnate",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Naxx",
			"text": "Destroy a minion, then return it to life with full Health.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX5_03.png",
			"cost": 2,
			"fr": {
				"name": "Cervocalypse",
				"text": "Les deux joueurs piochent 2 cartes et gagnent un cristal de mana."
			},
			"id": "NAX5_03",
			"name": "Mindpocalypse",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Both players draw 2 cards and gain a Mana Crystal.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_KTRAF_10e.png",
			"fr": {
				"name": "Sombre puissance",
				"text": "A reçu de la puissance de Noth."
			},
			"id": "TB_KTRAF_10e",
			"name": "Dark Power",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Granted power from Noth",
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "TB_CoOpv3_012.png",
			"cost": 0,
			"fr": {
				"name": "Immolation",
				"text": "Inflige 4 points de dégâts à chaque héros."
			},
			"id": "TB_CoOpv3_012",
			"name": "Immolate",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Deal 4 damage to each hero.",
			"type": "Spell"
		},
		{
			"artist": "Zero Yue",
			"attack": 5,
			"cardImage": "GVG_086.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Engin de siège",
				"text": "Chaque fois que vous gagnez de l’Armure, donne +1 ATQ à ce serviteur."
			},
			"health": 5,
			"id": "GVG_086",
			"name": "Siege Engine",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Whenever you gain Armor, give this minion +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "KAR_A02_12.png",
			"fr": {
				"name": "Golem d’argenterie"
			},
			"health": 30,
			"id": "KAR_A02_12",
			"name": "Silverware Golem",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Glenn Rane",
			"attack": 3,
			"cardImage": "FP1_016.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Âme gémissante",
				"text": "<b>Cri de guerre :</b> réduit au <b>Silence</b> vos autres serviteurs."
			},
			"health": 5,
			"id": "FP1_016",
			"name": "Wailing Soul",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Naxx",
			"text": "<b>Battlecry: Silence</b> your other minions.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_584e.png",
			"fr": {
				"name": "Enseignements du Kirin Tor",
				"text": "<b>Dégâts des sorts : +1</b>"
			},
			"id": "EX1_584e",
			"name": "Teachings of the Kirin Tor",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "<b>Spell Damage +1</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "LOE_002.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Torche oubliée",
				"text": "Inflige $3 |4(point,points) de dégâts. Place une carte Torche enflammée dans votre deck qui inflige 6 points de dégâts."
			},
			"id": "LOE_002",
			"name": "Forgotten Torch",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Loe",
			"text": "Deal $3 damage. Shuffle a 'Roaring Torch' into your deck that deals 6 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_060e.png",
			"fr": {
				"name": "Bien équipé",
				"text": "+2/+2."
			},
			"id": "GVG_060e",
			"name": "Well Equipped",
			"playerClass": "Paladin",
			"set": "Gvg",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "J. Meyers & T. Washington",
			"attack": 1,
			"cardImage": "OG_151.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Tentacule de N’Zoth",
				"text": "<b>Râle d’agonie :</b> inflige\n1 point de dégâts à tous les serviteurs."
			},
			"health": 1,
			"id": "OG_151",
			"name": "Tentacle of N'Zoth",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Deal 1 damage to all minions.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_04_01heroic.png",
			"fr": {
				"name": "La Mégère"
			},
			"health": 50,
			"id": "KARA_04_01heroic",
			"name": "The Crone",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_027.png",
			"cost": 0,
			"fr": {
				"name": "Server Crash",
				"text": "Crash the Server.  DON'T BE A FOOL."
			},
			"id": "XXX_027",
			"name": "Server Crash",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Crash the Server.  DON'T BE A FOOL.",
			"type": "Spell"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 5,
			"cardImage": "AT_023.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Écraseur du Vide",
				"text": "<b>Exaltation :</b> détruit aléatoirement un serviteur de chaque joueur."
			},
			"health": 4,
			"id": "AT_023",
			"name": "Void Crusher",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Destroy a random minion for each player.",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "BRM_013.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Tir réflexe",
				"text": "Inflige $3 |4(point,points) de dégâts.\nVous piochez une carte si votre main est vide."
			},
			"id": "BRM_013",
			"name": "Quick Shot",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Brm",
			"text": "Deal $3 damage.\nIf your hand is empty, draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX15_04a.png",
			"fr": {
				"name": "Esclave de Kel’Thuzad",
				"text": "À MOI !"
			},
			"id": "NAX15_04a",
			"name": "Slave of Kel'Thuzad",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "MINE!",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA10_6e.png",
			"fr": {
				"name": "Rage aveugle",
				"text": "Attaque augmentée."
			},
			"id": "BRMA10_6e",
			"name": "Blind With Rage",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Eva Widermann",
			"attack": 2,
			"cardImage": "AT_059.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Brave archère",
				"text": "<b>Exaltation :</b> inflige 2 points de dégâts au héros adverse si votre main est vide."
			},
			"health": 1,
			"id": "AT_059",
			"name": "Brave Archer",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Inspire:</b> If your hand is empty, deal 2 damage to the enemy hero.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "EX1_554t.png",
			"cost": 1,
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
			"artist": "Gonzalo Ordonez",
			"attack": 1,
			"cardImage": "EX1_080.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Gardienne des secrets",
				"text": "Chaque fois qu’un <b>Secret</b> est joué, gagne +1/+1."
			},
			"health": 2,
			"id": "EX1_080",
			"name": "Secretkeeper",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Whenever a <b>Secret</b> is played, gain +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Alex Alexandrov",
			"cardImage": "OG_047b.png",
			"cost": 0,
			"fr": {
				"name": "Production d’écailles",
				"text": "Confère +8 points d’armure."
			},
			"id": "OG_047b",
			"name": "Evolve Scales",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"text": "Gain 8 Armor.",
			"type": "Spell"
		},
		{
			"artist": "Leo Che",
			"attack": 3,
			"cardImage": "EX1_085.png",
			"collectible": true,
			"cost": 3,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Contrôleur mental",
				"text": "<b>Cri de guerre :</b> si l’adversaire a 4 serviteurs ou plus, prend le contrôle de l’un d’eux au hasard."
			},
			"health": 3,
			"id": "EX1_085",
			"name": "Mind Control Tech",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> If your opponent has 4 or more minions, take control of one at random.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "LOEA09_4.png",
			"cost": 1,
			"durability": 2,
			"fr": {
				"name": "Lance rare",
				"text": "Gagne +1/+1 chaque fois que votre adversaire joue une carte rare."
			},
			"id": "LOEA09_4",
			"name": "Rare Spear",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Whenever your opponent plays a Rare card, gain +1/+1.",
			"type": "Weapon"
		},
		{
			"attack": 5,
			"cardImage": "KAR_A02_06H.png",
			"cost": 4,
			"fr": {
				"name": "Pichet",
				"text": "<b>Cri de guerre_:</b> donne +3/+3 à un serviteur."
			},
			"health": 5,
			"id": "KAR_A02_06H",
			"name": "Pitcher",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Give a minion +3/+3.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_154.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Colère",
				"text": "<b>Choix des armes :</b> inflige $3 |4(point,points) de dégâts à un serviteur ; ou inflige $1 |4(point,points) de dégâts à un serviteur et vous piochez une carte."
			},
			"id": "EX1_154",
			"name": "Wrath",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Choose One</b> - Deal $3 damage to a minion; or $1 damage and draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Genevieve Tsai & Nutchapol ",
			"attack": 2,
			"cardImage": "OG_082.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Kobold évolué",
				"text": "<b>Dégâts des sorts : +2</b>"
			},
			"health": 2,
			"id": "OG_082",
			"name": "Evolved Kobold",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"spellDamage": 2,
			"text": "<b>Spell Damage +2</b>",
			"type": "Minion"
		},
		{
			"artist": "Slawomir Maniak",
			"cardImage": "KARA_00_10.png",
			"cost": 3,
			"fr": {
				"name": "Rune mystérieuse",
				"text": "Joue 5_<b>Secrets</b> aléatoires de mage."
			},
			"id": "KARA_00_10",
			"name": "Mysterious Rune",
			"playerClass": "Mage",
			"set": "Kara",
			"text": "Put 5 random Mage <b>Secrets</b> into play.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_069e.png",
			"fr": {
				"name": "Entraînement terminé",
				"text": "<b>Provocation</b>"
			},
			"id": "AT_069e",
			"name": "Training Complete",
			"playerClass": "Warrior",
			"set": "Tgt",
			"text": "<b>Taunt</b>",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_570e.png",
			"fr": {
				"name": "Morsure",
				"text": "+4 ATQ pendant ce tour."
			},
			"id": "EX1_570e",
			"name": "Bite",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+4 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "BRMA01_4t.png",
			"cost": 1,
			"fr": {
				"name": "Écluseur",
				"text": "<b>Provocation</b>"
			},
			"health": 1,
			"id": "BRMA01_4t",
			"name": "Guzzler",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Taunt</b>",
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Lars Grant-West",
			"attack": 2,
			"cardImage": "EX1_170.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Cobra empereur",
				"text": "Détruit tout serviteur blessé par ce serviteur."
			},
			"health": 3,
			"id": "EX1_170",
			"name": "Emperor Cobra",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Destroy any minion damaged by this minion.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 2,
			"cardImage": "GVG_058.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Mini-robot blindé",
				"text": "<b>Bouclier divin</b>"
			},
			"health": 2,
			"id": "GVG_058",
			"name": "Shielded Minibot",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Arthur Gimaldinov",
			"attack": 2,
			"cardImage": "AT_042.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Druidesse du Sabre",
				"text": "<b>Choix des armes :</b> se transforme pour obtenir <b>Charge</b> ou gagne +1/+1 et <b>Camouflage</b>."
			},
			"health": 1,
			"id": "AT_042",
			"name": "Druid of the Saber",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Choose One -</b> Transform to gain <b>Charge</b>; or +1/+1 and <b>Stealth</b>.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "NEW1_024.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Capitaine Vertepeau",
				"text": "<b>Cri de guerre :</b> confère +1/+1 à votre arme."
			},
			"health": 4,
			"id": "NEW1_024",
			"name": "Captain Greenskin",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give your weapon +1/+1.",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "BRMC_88.png",
			"cost": 6,
			"fr": {
				"name": "Pourfendeur drakônide",
				"text": "Inflige également des dégâts aux serviteurs à côté de celui qu’il attaque."
			},
			"health": 6,
			"id": "BRMC_88",
			"name": "Drakonid Slayer",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Also damages the minions next to whomever he attacks.",
			"type": "Minion"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"attack": 5,
			"cardImage": "OG_293.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Sombre arakkoa",
				"text": "<b>Provocation</b>\n<b>Cri de guerre :</b> donne\n+3/+3 à votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 7,
			"id": "OG_293",
			"name": "Dark Arakkoa",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"text": "[x]<b>Taunt</b>\n<b>Battlecry:</b> Give your C'Thun\n+3/+3 <i>(wherever it is).</i>",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_018e.png",
			"fr": {
				"name": "Obnubilé par les trésors",
				"text": "Attaque augmentée."
			},
			"id": "NEW1_018e",
			"name": "Treasure Crazed",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Miguel Coimbra",
			"cardImage": "EX1_624.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Flammes sacrées",
				"text": "Inflige $5 points de dégâts. Rend #5 PV à votre héros."
			},
			"id": "EX1_624",
			"name": "Holy Fire",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Deal $5 damage. Restore #5 Health to your hero.",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "KARA_07_02.png",
			"cost": 0,
			"fr": {
				"name": "Protection de la galerie",
				"text": "<b>Pouvoir héroïque passif</b>\nVotre héros a <b>Provocation</b>."
			},
			"id": "KARA_07_02",
			"name": "Gallery Protection",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Passive Hero Power</b>\nYour hero has <b>Taunt</b>.",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_010e.png",
			"fr": {
				"name": "Choisir un des trois"
			},
			"id": "TB_010e",
			"name": "Choose One of Three",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 5,
			"cardImage": "EX1_559.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Archimage Antonidas",
				"text": "Chaque fois que vous lancez un sort, ajoute un sort « boule de feu » dans votre main."
			},
			"health": 7,
			"id": "EX1_559",
			"name": "Archmage Antonidas",
			"playerClass": "Mage",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "Whenever you cast a spell, add a 'Fireball' spell to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Ken Steacy",
			"attack": 3,
			"cardImage": "NEW1_027.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Capitaine des mers du Sud",
				"text": "Vos autres pirates\nont +1/+1."
			},
			"health": 3,
			"id": "NEW1_027",
			"name": "Southsea Captain",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Your other Pirates have +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 6,
			"cardImage": "OG_153.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Rampant des marais",
				"text": "<b>Provocation</b>"
			},
			"health": 8,
			"id": "OG_153",
			"name": "Bog Creeper",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "TB_ClassRandom_Priest.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : prêtre",
				"text": "Ajoute des cartes de prêtre dans votre deck."
			},
			"id": "TB_ClassRandom_Priest",
			"name": "Second Class: Priest",
			"playerClass": "Priest",
			"set": "Tb",
			"text": "Add Priest cards to your deck.",
			"type": "Spell"
		},
		{
			"cardImage": "KARA_05_01hheroic.png",
			"fr": {
				"name": "Grand Méchant Loup"
			},
			"health": 20,
			"id": "KARA_05_01hheroic",
			"name": "Big Bad Wolf",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Ben Thompson",
			"attack": 3,
			"cardImage": "AT_131.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Eydis Plaie-sombre",
				"text": "Chaque fois que <b>vous</b> ciblez ce serviteur avec un sort, inflige\n3 points de dégâts à un adversaire aléatoire."
			},
			"health": 4,
			"id": "AT_131",
			"name": "Eydis Darkbane",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "Whenever <b>you</b> target this minion with a spell, deal 3 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"cardImage": "TBST_006.png",
			"fr": {
				"name": "Forcer une carte commune",
				"text": "Place une carte commune dans la main du joueur."
			},
			"id": "TBST_006",
			"name": "OLDTBST Push Common Card",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "push a common card into player's hand",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "TB_CoOp_Mechazod.png",
			"cost": 10,
			"fr": {
				"name": "Maître des rouages Mécazod",
				"text": "<b>Boss</b>\nMécazod gagne s’il bat l’un de vous !"
			},
			"health": 95,
			"id": "TB_CoOp_Mechazod",
			"name": "Gearmaster Mechazod",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "<b>Boss</b>\nMechazod wins if he defeats either of you!",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"cardImage": "NEW1_036.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Cri de commandement",
				"text": "Les points de vie de vos serviteurs ne peuvent pas passer en dessous de 1 ce tour-ci. Vous piochez une carte."
			},
			"id": "NEW1_036",
			"name": "Commanding Shout",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Your minions can't be reduced below 1 Health this turn. Draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Glenn Rane",
			"attack": 5,
			"cardImage": "EX1_016.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Sylvanas Coursevent",
				"text": "<b>Râle d’agonie :</b> prend le contrôle d’un serviteur adverse aléatoire."
			},
			"health": 5,
			"id": "EX1_016",
			"name": "Sylvanas Windrunner",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Deathrattle:</b> Take control of a random enemy minion.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_11.png",
			"cost": 0,
			"fr": {
				"name": "Couronne de Kael’thas",
				"text": "Inflige $10 |4(point,points) de dégâts répartis de façon aléatoire entre TOUS les personnages."
			},
			"id": "LOEA16_11",
			"name": "Crown of Kael'thas",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Deal $10 damage randomly split among ALL characters.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "BRMA10_4H.png",
			"cost": 1,
			"fr": {
				"name": "Œuf corrompu",
				"text": "Éclot quand il a 5 PV ou plus."
			},
			"health": 3,
			"id": "BRMA10_4H",
			"name": "Corrupted Egg",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "When this minion has 5 or more Health, it hatches.",
			"type": "Minion"
		},
		{
			"artist": "Luke Mancini",
			"cardImage": "BRM_017.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Ressusciter",
				"text": "Invoque un serviteur allié aléatoire mort pendant la partie."
			},
			"id": "BRM_017",
			"name": "Resurrect",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Brm",
			"text": "Summon a random friendly minion that died this game.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_6.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : noir",
				"text": "Chaque fois que Chromaggus pioche une carte, il en obtient une copie tant que vous avez celle-ci dans votre main."
			},
			"id": "BRMA12_6",
			"name": "Brood Affliction: Black",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "While this is in your hand, whenever Chromaggus draws a card, he gets another copy of it.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_050t.png",
			"cost": 2,
			"fr": {
				"name": "Décharge de foudre",
				"text": "<b>Pouvoir héroïque</b>\nInflige $2 points de dégâts."
			},
			"id": "AT_050t",
			"name": "Lightning Jolt",
			"playerClass": "Shaman",
			"set": "Tgt",
			"text": "<b>Hero Power</b>\nDeal $2 damage.",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_293e.png",
			"fr": {
				"name": "Dévotion de l'arakkoa",
				"text": "+5/+5."
			},
			"id": "OG_293e",
			"name": "Arrakoa Devotion",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+5/+5.",
			"type": "Enchantment"
		},
		{
			"artist": "Daren Bader",
			"attack": 1,
			"cardImage": "CS2_127.png",
			"collectible": true,
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Patriarche dos-argenté",
				"text": "<b>Provocation</b>"
			},
			"health": 4,
			"id": "CS2_127",
			"name": "Silverback Patriarch",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Alex Garner",
			"attack": 6,
			"cardImage": "OG_096.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Soigneuse du Crépuscule",
				"text": "<b>Cri de guerre :</b> rend 10 PV\nà votre héros si votre\nC’Thun a au moins\n10 Attaque."
			},
			"health": 5,
			"id": "OG_096",
			"name": "Twilight Darkmender",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> If your C'Thun  has at least 10 Attack, restore 10 Health to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 7,
			"cardImage": "EX1_614.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Illidan Hurlorage",
				"text": "Quand vous jouez une carte, invoque une Flamme d’Azzinoth 2/1."
			},
			"health": 5,
			"id": "EX1_614",
			"name": "Illidan Stormrage",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "Whenever you play a card, summon a 2/1 Flame of Azzinoth.",
			"type": "Minion"
		},
		{
			"artist": "Eric Braddock",
			"attack": 4,
			"cardImage": "BRM_008.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Furtif sombrefer",
				"text": "<b>Cri de guerre :</b> inflige 2 points de dégâts à tous les serviteurs adverses qui ne sont pas blessés."
			},
			"health": 3,
			"id": "BRM_008",
			"name": "Dark Iron Skulker",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Brm",
			"text": "<b>Battlecry:</b> Deal 2 damage to all undamaged enemy minions.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "John Polidora",
			"attack": 10,
			"cardImage": "AT_125.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Glace-Hurlante",
				"text": "<b>Charge</b>\nNe peut pas attaquer les héros."
			},
			"health": 10,
			"id": "AT_125",
			"name": "Icehowl",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Charge</b>\nCan't attack heroes.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "TB_KTRAF_11.png",
			"cost": 5,
			"fr": {
				"name": "Saphiron",
				"text": "Au début de votre tour, <b>gèle</b> un serviteur adverse aléatoire."
			},
			"health": 6,
			"id": "TB_KTRAF_11",
			"name": "Sapphiron",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "At the start of your turn, <b>Freeze</b> a random enemy minion.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NAX9_03H.png",
			"cost": 3,
			"fr": {
				"name": "Thane Korth’azz",
				"text": "Votre héros est <b>Insensible</b>."
			},
			"health": 7,
			"id": "NAX9_03H",
			"name": "Thane Korth'azz",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "Your hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_28a.png",
			"cost": 0,
			"fr": {
				"name": "Boire à grands traits",
				"text": "Vous piochez une carte."
			},
			"id": "LOEA04_28a",
			"name": "Drink Deeply",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Ian Ameling",
			"attack": 7,
			"cardImage": "EX1_249.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Baron Geddon",
				"text": "À la fin de votre tour, inflige 2 points de dégâts à TOUS les autres personnages."
			},
			"health": 5,
			"id": "EX1_249",
			"name": "Baron Geddon",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "At the end of your turn, deal 2 damage to ALL other characters.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "CS2_038.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Esprit ancestral",
				"text": "Confère à un serviteur « <b>Râle d’agonie :</b> réinvoque ce serviteur. »"
			},
			"id": "CS2_038",
			"name": "Ancestral Spirit",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Give a minion \"<b>Deathrattle:</b> Resummon this minion.\"",
			"type": "Spell"
		},
		{
			"artist": "Aleksi Briclot",
			"attack": 7,
			"cardImage": "GVG_007.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Léviathan des flammes",
				"text": "Quand vous piochez cette carte, inflige 2 points de dégâts à tous les personnages."
			},
			"health": 7,
			"id": "GVG_007",
			"name": "Flame Leviathan",
			"playerClass": "Mage",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "When you draw this, deal 2 damage to all characters.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_113.png",
			"cost": 0,
			"fr": {
				"name": "Again"
			},
			"id": "XXX_113",
			"name": "Again",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "OG_102e.png",
			"fr": {
				"name": "Transfert de puissance",
				"text": "Caractéristiques échangées."
			},
			"id": "OG_102e",
			"name": "Power Transfer",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Swapped stats.",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_034_H1_AT_132.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu rang 2",
				"text": "<b>Pouvoir héroïque</b>\nInflige $2 points de dégâts."
			},
			"id": "CS2_034_H1_AT_132",
			"name": "Fireblast Rank 2",
			"playerClass": "Mage",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nDeal $2 damage.",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOEA06_04.png",
			"cost": 2,
			"fr": {
				"name": "Pulsion destructrice",
				"text": "Détruit toutes les statues. Inflige 1_point de dégâts pour chaque statue détruite."
			},
			"id": "LOEA06_04",
			"name": "Shattering Spree",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Destroy all Statues. For each destroyed, deal 1 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_011.png",
			"cost": 0,
			"fr": {
				"name": "Summon a random Secret",
				"text": "Summon a secret from your deck."
			},
			"id": "XXX_011",
			"name": "Summon a random Secret",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Summon a secret from your deck.",
			"type": "Spell"
		},
		{
			"attack": 6,
			"cardImage": "BRMA14_7H.png",
			"cost": 3,
			"fr": {
				"name": "Électron",
				"text": "Tous les sorts coûtent (3) |4(cristal,cristaux) de moins."
			},
			"health": 6,
			"id": "BRMA14_7H",
			"name": "Electron",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "All spells cost (3) less.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_06.png",
			"cost": 1,
			"fr": {
				"name": "Derek Sakamoto",
				"text": "<i>Le célèbre tapeur des pieds.</i>"
			},
			"health": 1,
			"id": "CRED_06",
			"name": "Derek Sakamoto",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<i>The notorious Footclapper.</i>",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KaraPortal_002.png",
			"cost": 2,
			"fr": {
				"name": "Invocation de Mediva",
				"text": "Invoque une Mediva aléatoire."
			},
			"id": "TB_KaraPortal_002",
			"name": "Call Mediva",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Tb",
			"text": "Summon a random Mediva",
			"type": "Spell"
		},
		{
			"artist": "Todd Lockwood",
			"attack": 1,
			"cardImage": "OG_320.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Drake de minuit",
				"text": "<b>Cri de guerre :</b> gagne +1 ATQ pour chaque autre carte dans votre main."
			},
			"health": 4,
			"id": "OG_320",
			"name": "Midnight Drake",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> Gain +1 Attack for each other card\nin your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_1H.png",
			"fr": {
				"name": "Rafaam"
			},
			"health": 30,
			"id": "LOEA16_1H",
			"name": "Rafaam",
			"playerClass": "Neutral",
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
				"name": "Marche-soleil",
				"text": "<b>Provocation</b>\n<b>Bouclier divin</b>"
			},
			"health": 5,
			"id": "EX1_032",
			"name": "Sunwalker",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Taunt</b>\n<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_154a.png",
			"cost": 0,
			"fr": {
				"name": "Colère",
				"text": "Inflige $3 |4(point,points) de dégâts à un serviteur."
			},
			"id": "EX1_154a",
			"name": "Wrath",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Deal $3 damage to a minion.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_004e.png",
			"fr": {
				"name": "Grâce d’Élune",
				"text": "Vie augmentée."
			},
			"id": "EX1_004e",
			"name": "Elune's Grace",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 12,
			"cardImage": "OG_317.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Seigneur Aile de mort",
				"text": "<b>Râle d’agonie :</b> place tous les dragons de votre main sur le champ de bataille."
			},
			"health": 12,
			"id": "OG_317",
			"name": "Deathwing, Dragonlord",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Put all Dragons from your hand into the battlefield.",
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Sean McNally",
			"attack": 2,
			"cardImage": "KAR_092.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Valet de Medivh",
				"text": "<b>Cri de guerre_:</b> si vous contrôlez un <b>Secret</b>, inflige 3_points de dégâts."
			},
			"health": 3,
			"id": "KAR_092",
			"name": "Medivh's Valet",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Battlecry:</b> If you control a <b>Secret</b>, deal 3 damage.",
			"type": "Minion"
		},
		{
			"cardImage": "KAR_077e.png",
			"fr": {
				"name": "Puissance d’Argent",
				"text": "+2/+2."
			},
			"id": "KAR_077e",
			"name": "Silver Might",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_037.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Horion de givre",
				"text": "Inflige $1 |4(point,points) de dégâts à un personnage adverse, et le <b>gèle</b>."
			},
			"id": "CS2_037",
			"name": "Frost Shock",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $1 damage to an enemy character and <b>Freeze</b> it.",
			"type": "Spell"
		},
		{
			"artist": "Cole Eastburn",
			"attack": 4,
			"cardImage": "OG_188.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Tisse-ambre klaxxi",
				"text": "<b>Cri de guerre :</b> gagne\n+5 PV si votre C’Thun a au moins 10 Attaque."
			},
			"health": 5,
			"id": "OG_188",
			"name": "Klaxxi Amber-Weaver",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> If your C'Thun has at least 10 Attack, gain +5 Health.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA07_2H.png",
			"cost": 0,
			"fr": {
				"name": "MOI TOUT CASSER",
				"text": "<b>Pouvoir héroïque</b>\nDétruit un serviteur adverse aléatoire."
			},
			"id": "BRMA07_2H",
			"name": "ME SMASH",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nDestroy a random enemy minion.",
			"type": "Hero_power"
		},
		{
			"cardImage": "AT_034e.png",
			"fr": {
				"name": "Enduit perfide",
				"text": "Attaque augmentée."
			},
			"id": "AT_034e",
			"name": "Laced",
			"playerClass": "Rogue",
			"set": "Tgt",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Andrew Hou",
			"attack": 1,
			"cardImage": "LOE_018.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Trogg des tunnels",
				"text": "Gagne +1 ATQ par cristal de mana verrouillé chaque fois que vous êtes en  <b>Surcharge</b>."
			},
			"health": 3,
			"id": "LOE_018",
			"name": "Tunnel Trogg",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Loe",
			"text": "Whenever you <b>Overload</b>, gain +1 Attack per locked Mana Crystal.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_226e.png",
			"fr": {
				"name": "Bannière loup-de-givre",
				"text": "Caractéristiques augmentées."
			},
			"id": "CS2_226e",
			"name": "Frostwolf Banner",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Svetlin Velinov",
			"attack": 8,
			"cardImage": "EX1_586.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Géant des mers",
				"text": "Coûte (1) cristal de moins pour chaque autre serviteur sur le champ de bataille."
			},
			"health": 8,
			"id": "EX1_586",
			"name": "Sea Giant",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Costs (1) less for each other minion on the battlefield.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "TB_KTRAF_5.png",
			"cost": 4,
			"fr": {
				"name": "Grande veuve Faerlina",
				"text": "Obtient +1 ATQ pour chaque carte dans la main de votre adversaire."
			},
			"health": 5,
			"id": "TB_KTRAF_5",
			"name": "Grand Widow Faerlina",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Has +1 Attack for each card in your opponent's hand.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_064.png",
			"cost": 0,
			"fr": {
				"name": "The Song That Ends the World",
				"text": "Crash the game server.  No, really."
			},
			"id": "XXX_064",
			"name": "The Song That Ends the World",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Cheat",
			"text": "Crash the game server.  No, really.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_074e2.png",
			"fr": {
				"name": "Sceau des champions",
				"text": "+3 ATQ et <b>Bouclier divin</b>."
			},
			"id": "AT_074e2",
			"name": "Seal of Champions",
			"playerClass": "Paladin",
			"set": "Tgt",
			"text": "+3 Attack and <b>Divine Shield</b>.",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "KAR_A10_10.png",
			"cost": 7,
			"fr": {
				"name": "Reine noire",
				"text": "<b>Attaque automatique_:</b> inflige 4 points de dégâts aux adversaires en face de ce serviteur."
			},
			"health": 6,
			"id": "KAR_A10_10",
			"name": "Black Queen",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Auto-Attack:</b> Deal 4 damage to the enemies opposite this minion.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_06_03hpheroic.png",
			"cost": 0,
			"fr": {
				"name": "Amour véritable",
				"text": "<b>Pouvoir héroïque</b>\nSi vous n’avez pas Romulo, l’invoque."
			},
			"id": "KARA_06_03hpheroic",
			"name": "True Love",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nIf you don't have Romulo, summon him.",
			"type": "Hero_power"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "OG_131.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Empereur jumeau Vek’lor",
				"text": "<b>Provocation</b>. <b>Cri de guerre :</b> invoque un autre empereur si votre C’Thun a au moins 10 Attaque."
			},
			"health": 6,
			"id": "OG_131",
			"name": "Twin Emperor Vek'lor",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "[x]<b><b>Taunt</b>\nBattlecry:</b> If your C'Thun has\nat least 10 Attack, summon\nanother Emperor.",
			"type": "Minion"
		},
		{
			"artist": "Lars Grant-West",
			"attack": 3,
			"cardImage": "CS2_125.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Grizzly Ferpoil",
				"text": "<b>Provocation</b>"
			},
			"health": 3,
			"id": "CS2_125",
			"name": "Ironfur Grizzly",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "BRMA09_3Ht.png",
			"cost": 1,
			"fr": {
				"name": "Orc de l’ancienne Horde",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "BRMA09_3Ht",
			"name": "Old Horde Orc",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Taunt</b>",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA02_02h.png",
			"cost": 0,
			"fr": {
				"name": "Intuition de djinn",
				"text": "Vous piochez une carte. Gagne un cristal de mana. Accorde un Vœu à votre adversaire."
			},
			"id": "LOEA02_02h",
			"name": "Djinn’s Intuition",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Draw a card. Gain a Mana Crystal. Give your opponent a Wish.",
			"type": "Hero_power"
		},
		{
			"cardImage": "KARA_09_07heroic.png",
			"cost": 4,
			"fr": {
				"name": "Vol de vie",
				"text": "Inflige 5_points de dégâts. Rend 5_PV à votre héros."
			},
			"id": "KARA_09_07heroic",
			"name": "Steal Life",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Deal 5 damage. Restore 5 Health to your hero.",
			"type": "Spell"
		},
		{
			"artist": "Samwise",
			"attack": 3,
			"cardImage": "NEW1_023.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Dragon féerique",
				"text": "Ne peut pas être la cible de sorts ou de pouvoirs héroïques."
			},
			"health": 2,
			"id": "NEW1_023",
			"name": "Faerie Dragon",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Can't be targeted by spells or Hero Powers.",
			"type": "Minion"
		},
		{
			"artist": "Donato Giancola",
			"attack": 1,
			"cardImage": "CS1_042.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Soldat de Comté-de-l’Or",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "CS1_042",
			"name": "Goldshire Footman",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"set": "Loe",
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
			"attack": 4,
			"cardImage": "TB_KTRAF_6.png",
			"cost": 5,
			"fr": {
				"name": "Grobbulus",
				"text": "Chaque fois qu’il détruit un serviteur, invoque une gelée empoisonnée 2/2. "
			},
			"health": 7,
			"id": "TB_KTRAF_6",
			"name": "Grobbulus",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Whenever this kills a minion, summon a poisonous 2/2 Slime.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "AT_132_SHAMANa.png",
			"cost": 0,
			"fr": {
				"name": "Totem de soins",
				"text": "À la fin de votre tour, rend 1 point de vie à tous vos serviteurs."
			},
			"health": 2,
			"id": "AT_132_SHAMANa",
			"name": "Healing Totem",
			"playerClass": "Shaman",
			"set": "Tgt",
			"text": "At the end of your turn, restore 1 Health to all friendly minions.",
			"type": "Minion"
		},
		{
			"artist": "Joe Madureira & Grace Liu",
			"cardImage": "KARA_13_06H.png",
			"fr": {
				"name": "Prince Malchezaar"
			},
			"health": 30,
			"id": "KARA_13_06H",
			"name": "Prince Malchezaar",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "BRM_007.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Recrutement",
				"text": "Choisissez un serviteur. En place 3 copies dans votre deck."
			},
			"id": "BRM_007",
			"name": "Gang Up",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Brm",
			"text": "Choose a minion. Shuffle 3 copies of it into your deck.",
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
				"name": "Sergent grossier",
				"text": "<b>Cri de guerre :</b> confère +2 ATQ à un serviteur pendant ce tour."
			},
			"health": 1,
			"id": "CS2_188",
			"name": "Abusive Sergeant",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give a minion +2 Attack this turn.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NAX9_04H.png",
			"cost": 3,
			"fr": {
				"name": "Sire Zeliek",
				"text": "Votre héros est <b>Insensible</b>."
			},
			"health": 7,
			"id": "NAX9_04H",
			"name": "Sir Zeliek",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "Your hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "OG_284e.png",
			"fr": {
				"name": "Géomancie",
				"text": "A <b>Provocation</b>."
			},
			"id": "OG_284e",
			"name": "Geomancy",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Has <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "CRED_05.png",
			"cost": 3,
			"fr": {
				"name": "Kyle Harrison",
				"text": "<i>3 cristaux pour un 5/4 ? Ça c’est une affaire !</i>"
			},
			"health": 4,
			"id": "CRED_05",
			"name": "Kyle Harrison",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<i>3 for a 5/4? That's a good deal!</i>",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA13_2.png",
			"cost": 0,
			"fr": {
				"name": "Puissance des anciens",
				"text": "<b>Pouvoir héroïque</b>\nDonne une carte aléatoire à chaque joueur. Elle coûte (0) |4(cristal,cristaux) de mana."
			},
			"id": "LOEA13_2",
			"name": "Ancient Power",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\nGive each player a random card. It costs (0).",
			"type": "Hero_power"
		},
		{
			"artist": "Andrew Hou",
			"attack": 1,
			"cardImage": "KARA_09_03a.png",
			"cost": 1,
			"fr": {
				"name": "Diablotin dégoûtant",
				"text": "<b>Râle d’agonie_:</b> réinvoque ce serviteur et Malsabot perd 2_PV."
			},
			"health": 1,
			"id": "KARA_09_03a",
			"name": "Icky Imp",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Deathrattle:</b> Resummon this minion and Illhoof loses 2 Health.",
			"type": "Minion"
		},
		{
			"cardImage": "KAR_A02_06He.png",
			"fr": {
				"name": "Rempli",
				"text": "+3/+3."
			},
			"id": "KAR_A02_06He",
			"name": "Filled Up",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "+3/+3.",
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "NAX14_01.png",
			"fr": {
				"name": "Saphiron"
			},
			"health": 30,
			"id": "NAX14_01",
			"name": "Sapphiron",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Nate Bowden",
			"cardImage": "KAR_091.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Portail de Forgefer",
				"text": "Gagne 4 points d’Armure. Invoque un serviteur aléatoire coûtant 4_cristaux de mana."
			},
			"id": "KAR_091",
			"name": "Ironforge Portal",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Kara",
			"text": "Gain 4 Armor.\nSummon a random\n4-Cost minion.",
			"type": "Spell"
		},
		{
			"artist": "Ron Spears",
			"attack": 2,
			"cardImage": "EX1_076.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Minuscule invocatrice",
				"text": "Le premier serviteur que vous jouez à chaque tour coûte (1) cristal de moins."
			},
			"health": 2,
			"id": "EX1_076",
			"name": "Pint-Sized Summoner",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "The first minion you play each turn costs (1) less.",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "TU4c_007.png",
			"cost": 6,
			"fr": {
				"name": "Grand frère de Mukla",
				"text": "Il est si fort, et pour seulement 6 cristaux de mana ?!"
			},
			"health": 10,
			"id": "TU4c_007",
			"name": "Mukla's Big Brother",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "So strong! And only 6 Mana?!",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_26H.png",
			"cost": 10,
			"fr": {
				"name": "Squeletosaurus Hex",
				"text": "À la fin de votre tour, place une carte aléatoire dans votre main. Elle coûte (0) |4(cristal,cristaux) de mana."
			},
			"health": 10,
			"id": "LOEA16_26H",
			"name": "Skelesaurus Hex",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, put a random card in your hand. It costs (0).",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA07_1H.png",
			"fr": {
				"name": "Généralissime Omokk"
			},
			"health": 30,
			"id": "BRMA07_1H",
			"name": "Highlord Omokk",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "OG_267.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Face de poulpe",
				"text": "<b>Râle d’agonie :</b> donne\n+2 ATQ à votre arme."
			},
			"health": 4,
			"id": "OG_267",
			"name": "Southsea Squidface",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Give your weapon +2 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 8,
			"cardImage": "EX1_562.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Onyxia",
				"text": "<b>Cri de guerre :</b> invoque des dragonnets 1/1 jusqu’à remplir votre côté du champ de bataille."
			},
			"health": 8,
			"id": "EX1_562",
			"name": "Onyxia",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Summon 1/1 Whelps until your side of the battlefield is full.",
			"type": "Minion"
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
			"artist": "Trent Kaniuga",
			"attack": 3,
			"cardImage": "EX1_590.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chevalier de sang",
				"text": "<b>Cri de guerre :</b> tous les serviteurs perdent <b>Bouclier divin</b>. Gagne +3/+3 pour chaque bouclier perdu."
			},
			"health": 3,
			"id": "EX1_590",
			"name": "Blood Knight",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> All minions lose <b>Divine Shield</b>. Gain +3/+3 for each Shield lost.",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "BRMA13_5.png",
			"cost": 0,
			"fr": {
				"name": "Fils de la Flamme",
				"text": "<b>Cri de guerre :</b> inflige 6 points de dégâts."
			},
			"health": 3,
			"id": "BRMA13_5",
			"name": "Son of the Flame",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Battlecry:</b> Deal 6 damage.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_29b.png",
			"cost": 0,
			"fr": {
				"name": "Examiner les runes",
				"text": "Vous piochez 2 cartes."
			},
			"id": "LOEA04_29b",
			"name": "Investigate the Runes",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Draw 2 cards.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_ClassRandom_Warlock.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : démoniste",
				"text": "Ajoute des cartes de démoniste dans votre deck."
			},
			"id": "TB_ClassRandom_Warlock",
			"name": "Second Class: Warlock",
			"playerClass": "Warlock",
			"set": "Tb",
			"text": "Add Warlock cards to your deck.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpBossSpell_3.png",
			"cost": 0,
			"fr": {
				"name": "Liquide de refroidissement",
				"text": "Gèle et inflige les dégâts de l’attaque à tous les serviteurs.\nGagne 2 ATQ."
			},
			"id": "TB_CoOpBossSpell_3",
			"name": "Release Coolant",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Freeze and deal Attack damage to all minions.\nGain 2 Attack.",
			"type": "Spell"
		},
		{
			"artist": "Tooth",
			"attack": 4,
			"cardImage": "AT_032.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Marchand douteux",
				"text": "<b>Cri de guerre :</b> si vous avez un pirate, gagne +1/+1."
			},
			"health": 3,
			"id": "AT_032",
			"name": "Shady Dealer",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> If you have a Pirate, gain +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "TBA01_4.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "TBA01_4",
			"name": "Nefarian",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"attack": 4,
			"cardImage": "EX1_165t2.png",
			"cost": 5,
			"fr": {
				"name": "Druide de la Griffe",
				"text": "<b>Provocation</b>"
			},
			"health": 6,
			"id": "EX1_165t2",
			"name": "Druid of the Claw",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "EX1_317t.png",
			"cost": 1,
			"fr": {
				"name": "Diablotin sans valeur",
				"text": "<i>Vous n’avez plus de démons_! Heureusement, il y a toujours des diablotins...</i>"
			},
			"health": 1,
			"id": "EX1_317t",
			"name": "Worthless Imp",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<i>You are out of demons! At least there are always imps...</i>",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_055e.png",
			"fr": {
				"name": "1000 Stats Enchant"
			},
			"id": "XXX_055e",
			"name": "1000 Stats Enchant",
			"playerClass": "Neutral",
			"set": "Cheat",
			"type": "Enchantment"
		},
		{
			"artist": "G.Tsai & K. Turovec",
			"attack": 5,
			"cardImage": "KAR_A02_04.png",
			"cost": 3,
			"fr": {
				"name": "Couteau",
				"text": "Les assiettes ont <b>Provocation</b>."
			},
			"health": 1,
			"id": "KAR_A02_04",
			"name": "Knife",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Plates have <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_308.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Feu de l’âme",
				"text": "Inflige $4 |4(point,points) de dégâts. Vous défausse d’une carte aléatoire."
			},
			"id": "EX1_308",
			"name": "Soulfire",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $4 damage. Discard a random card.",
			"type": "Spell"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "FP1_018.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Dupliquer",
				"text": "<b>Secret :</b> quand un serviteur allié meurt, en place 2 copies dans votre main."
			},
			"id": "FP1_018",
			"name": "Duplicate",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Secret:</b> When a friendly minion dies, put 2 copies of it into your hand.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_022e.png",
			"fr": {
				"name": "Métamorphose",
				"text": "Ce serviteur a été transformé en mouton 1/1."
			},
			"id": "CS2_022e",
			"name": "Polymorph",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"text": "This minion has been transformed into a 1/1 Sheep.",
			"type": "Enchantment"
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
			"cardImage": "NAXM_001.png",
			"cost": 4,
			"fr": {
				"name": "Nécro-chevalier",
				"text": "<b>Râle d’agonie :</b> détruit les serviteurs adjacents."
			},
			"health": 6,
			"id": "NAXM_001",
			"name": "Necroknight",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Destroy the minions next to this one as well.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 3,
			"cardImage": "LOE_046.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Crapaud énorme",
				"text": "<b>Râle d’agonie :</b> inflige\n1 point de dégâts à un adversaire aléatoire."
			},
			"health": 2,
			"id": "LOE_046",
			"name": "Huge Toad",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Deathrattle:</b> Deal 1 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "EX1_241.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Explosion de lave",
				"text": "Inflige $5 |4(point,points) de dégâts.\n<b>Surcharge :</b> (2)"
			},
			"id": "EX1_241",
			"name": "Lava Burst",
			"overload": 2,
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Deal $5 damage. <b>Overload:</b> (2)",
			"type": "Spell"
		},
		{
			"cardImage": "LOE_008.png",
			"cost": 1,
			"fr": {
				"name": "Œil d’Hakkar",
				"text": "Pioche un secret dans le deck de votre adversaire et le place sur le champ de bataille."
			},
			"id": "LOE_008",
			"name": "Eye of Hakkar",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Take a secret from your opponent's deck and put it into the battlefield.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA09_3d.png",
			"cost": 0,
			"fr": {
				"name": "Faim",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un naga affamé 5/1."
			},
			"id": "LOEA09_3d",
			"name": "Getting Hungry",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\nSummon a 5/1 Hungry Naga.",
			"type": "Hero_power"
		},
		{
			"artist": "Rafael Zanchetin",
			"cardImage": "OG_104.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Étreindre l’ombre",
				"text": "Durant ce tour, vos effets de soin infligent des dégâts à la place."
			},
			"id": "OG_104",
			"name": "Embrace the Shadow",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Og",
			"text": "This turn, your healing effects deal damage instead.",
			"type": "Spell"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_25H.png",
			"cost": 10,
			"fr": {
				"name": "Dame Naz’jar",
				"text": "À la fin de votre tour, remplace tous les autres serviteurs par de nouveaux de même coût."
			},
			"health": 10,
			"id": "LOEA16_25H",
			"name": "Lady Naz'jar",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, replace all other minions with new ones of the same Cost.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA_01H.png",
			"cost": 3,
			"fr": {
				"name": "Présence menaçante",
				"text": "Vous piochez 3 cartes. Gagne +6 points d’armure."
			},
			"id": "LOEA_01H",
			"name": "Looming Presence",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Draw 3 cards. Gain 6 Armor.",
			"type": "Spell"
		},
		{
			"artist": "Matt Cavotta",
			"cardImage": "KARA_09_01.png",
			"fr": {
				"name": "Terestian Malsabot"
			},
			"health": 30,
			"id": "KARA_09_01",
			"name": "Terestian Illhoof",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 4,
			"cardImage": "KAR_057.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Cavalier en ivoire",
				"text": "<b>Cri de guerre_:</b> <b>découvre</b> un sort. Rend un montant de PV équivalent à son coût à votre héros."
			},
			"health": 4,
			"id": "KAR_057",
			"name": "Ivory Knight",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Kara",
			"text": "[x]<b>Battlecry:</b> <b>Discover</b> a spell.\nRestore Health to your hero\nequal to its Cost.",
			"type": "Minion"
		},
		{
			"artist": "Randy Gallegos",
			"attack": 1,
			"cardImage": "NEW1_025.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Forban de la Voile sanglante",
				"text": "<b>Cri de guerre :</b> ôte 1 Durabilité à l’arme de votre adversaire."
			},
			"health": 2,
			"id": "NEW1_025",
			"name": "Bloodsail Corsair",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Remove 1 Durability from your opponent's weapon.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_BlingBrawl_Hero1p.png",
			"cost": 2,
			"fr": {
				"name": "Affûtage",
				"text": "<b>Pouvoir héroïque</b>\nAugmente l’attaque de votre arme de 1."
			},
			"id": "TB_BlingBrawl_Hero1p",
			"name": "Sharpen",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nIncrease your weapon's attack by 1",
			"type": "Hero_power"
		},
		{
			"artist": "Kev Walker",
			"attack": 7,
			"cardImage": "NEW1_038.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Gruul",
				"text": "À la fin de chaque tour, gagne +1/+1."
			},
			"health": 7,
			"id": "NEW1_038",
			"name": "Gruul",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "At the end of each turn, gain +1/+1 .",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_046e.png",
			"fr": {
				"name": "Acier trempé",
				"text": "+2 ATQ pendant ce tour."
			},
			"id": "EX1_046e",
			"name": "Tempered",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX3_03.png",
			"cost": 2,
			"fr": {
				"name": "Poison nécrotique",
				"text": "Détruit un serviteur."
			},
			"id": "NAX3_03",
			"name": "Necrotic Poison",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Destroy a minion.",
			"type": "Spell"
		},
		{
			"artist": "Ron Spears",
			"attack": 1,
			"cardImage": "AT_082.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Modeste écuyer",
				"text": "<b>Exaltation :</b> gagne +1 ATQ."
			},
			"health": 2,
			"id": "AT_082",
			"name": "Lowly Squire",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Gain +1 Attack.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "TB_KTRAF_08w.png",
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Lame runique massive",
				"text": "Inflige des dégâts doublés aux héros."
			},
			"id": "TB_KTRAF_08w",
			"name": "Massive Runeblade",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Deals double damage to heroes.",
			"type": "Weapon"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_323.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Seigneur Jaraxxus",
				"text": "<b>Cri de guerre :</b> le seigneur Jaraxxus détruit votre héros et prend sa place."
			},
			"health": 15,
			"id": "EX1_323",
			"name": "Lord Jaraxxus",
			"playerClass": "Warlock",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Destroy your hero and replace it with Lord Jaraxxus.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_4.png",
			"cost": 10,
			"fr": {
				"name": "Horloge de l’horreur",
				"text": "Inflige $10 |4(point,points) de dégâts répartis de façon aléatoire entre tous les adversaires."
			},
			"id": "LOEA16_4",
			"name": "Timepiece of Horror",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Deal $10 damage randomly split among all enemies.",
			"type": "Spell"
		},
		{
			"cardImage": "OG_302e.png",
			"fr": {
				"name": "Puissance de l’âme",
				"text": "Attaque augmentée."
			},
			"id": "OG_302e",
			"name": "Soul Power",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Tyson Murphy",
			"attack": 4,
			"cardImage": "AT_057.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maître des écuries",
				"text": "<b>Cri de guerre :</b> une Bête alliée devient <b>Insensible</b> pendant ce tour."
			},
			"health": 2,
			"id": "AT_057",
			"name": "Stablemaster",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Give a friendly Beast <b>Immune</b> this turn.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_MechWar_Boss1.png",
			"fr": {
				"name": "Ennuy-o-tron"
			},
			"health": 30,
			"id": "TB_MechWar_Boss1",
			"name": "Annoy-o-Tron",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "BRMC_86.png",
			"cost": 4,
			"fr": {
				"name": "Atramédès",
				"text": "Gagne +2 ATQ chaque fois que votre adversaire joue une carte."
			},
			"health": 8,
			"id": "BRMC_86",
			"name": "Atramedes",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Whenever your opponent plays a card, gain +2 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "CS2_065.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Marcheur du Vide",
				"text": "<b>Provocation</b>"
			},
			"health": 3,
			"id": "CS2_065",
			"name": "Voidwalker",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Den",
			"cardImage": "GVG_022.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Huile d’affûtage de Bricoleur",
				"text": "Confère à votre arme +3 ATQ. <b>Combo :</b> donne à un serviteur allié aléatoire +3 ATQ."
			},
			"id": "GVG_022",
			"name": "Tinker's Sharpsword Oil",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Give your weapon +3 Attack. <b>Combo:</b> Give a random friendly minion +3 Attack.",
			"type": "Spell"
		},
		{
			"artist": "Mike Sass",
			"cardImage": "AT_005.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Métamorphose : sanglier",
				"text": "Transforme un serviteur en sanglier 4/2 avec <b>Charge</b>."
			},
			"id": "AT_005",
			"name": "Polymorph: Boar",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "Transform a minion into a 4/2 Boar with <b>Charge</b>.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_045.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Arme croque-roc",
				"text": "Confère à un personnage allié +3 ATQ pendant ce tour."
			},
			"id": "CS2_045",
			"name": "Rockbiter Weapon",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"text": "Give a friendly character +3 Attack this turn.",
			"type": "Spell"
		},
		{
			"artist": "Gabor Szikszai",
			"cardImage": "AT_004.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Déflagration des Arcanes",
				"text": "Inflige $2 |4(point,points) de dégâts à un serviteur. Le bonus aux <b>Dégâts des sorts</b> est doublé pour ce sort."
			},
			"id": "AT_004",
			"name": "Arcane Blast",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Deal $2 damage to a minion. This spell gets double bonus from <b>Spell Damage</b>.",
			"type": "Spell"
		},
		{
			"artist": "Peter Stapleton",
			"attack": 4,
			"cardImage": "KARA_05_02.png",
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Grandes méchantes griffes"
			},
			"id": "KARA_05_02",
			"name": "Big Bad Claws",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Weapon"
		},
		{
			"cardImage": "BRMA02_2.png",
			"cost": 1,
			"fr": {
				"name": "Foule moqueuse",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un spectateur 1/1 avec <b>Provocation</b>."
			},
			"id": "BRMA02_2",
			"name": "Jeering Crowd",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Spectator with <b>Taunt</b>.",
			"type": "Hero_power"
		},
		{
			"artist": "Kevin Chen",
			"cardImage": "KARA_00_05.png",
			"cost": 3,
			"fr": {
				"name": "Perspicacité d’archimage",
				"text": "Vos sorts coûtent (0)_|4(cristal,cristaux) pendant ce tour."
			},
			"id": "KARA_00_05",
			"name": "Archmage's Insight",
			"playerClass": "Mage",
			"set": "Kara",
			"text": "Your spells cost (0) this turn.",
			"type": "Spell"
		},
		{
			"attack": 6,
			"cardImage": "PlaceholderCard.png",
			"cost": 9,
			"fr": {
				"name": "Placeholder Card",
				"text": "Battlecry: Someone remembers to publish this card."
			},
			"health": 8,
			"id": "PlaceholderCard",
			"name": "Placeholder Card",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "None",
			"text": "Battlecry: Someone remembers to publish this card.",
			"type": "Minion"
		},
		{
			"artist": "Garrett Hanna",
			"attack": 1,
			"cardImage": "OG_113.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Conseiller de Sombre-Comté",
				"text": "Gagne +1 ATQ après que vous avez invoqué un serviteur."
			},
			"health": 5,
			"id": "OG_113",
			"name": "Darkshire Councilman",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Og",
			"text": "After you summon a minion, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Tooth",
			"cardImage": "AT_002.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Effigie",
				"text": "<b>Secret :</b> quand un serviteur allié meurt, invoque un serviteur aléatoire de même coût."
			},
			"id": "AT_002",
			"name": "Effigy",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Secret:</b> When a friendly minion dies, summon a random minion with the same Cost.",
			"type": "Spell"
		},
		{
			"cardImage": "TU4c_001.png",
			"fr": {
				"name": "Roi Mukla"
			},
			"health": 26,
			"id": "TU4c_001",
			"name": "King Mukla",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"artist": "Christopher Moeller",
			"cardImage": "EX1_259.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Tempête de foudre",
				"text": "Inflige $2 à $3 points de dégâts à tous les serviteurs adverses. <b>Surcharge :</b> (2)"
			},
			"id": "EX1_259",
			"name": "Lightning Storm",
			"overload": 2,
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Deal $2-$3 damage to all enemy minions. <b>Overload:</b> (2)",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_102e.png",
			"fr": {
				"name": "Puissance de Brikabrok",
				"text": "+1/+1."
			},
			"id": "GVG_102e",
			"name": "Might of Tinkertown",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "+1/+1.",
			"type": "Enchantment"
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
			"cardImage": "LOE_030e.png",
			"fr": {
				"name": "Trompeur",
				"text": "Caractéristiques copiées."
			},
			"id": "LOE_030e",
			"name": "Hollow",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Stats copied.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA09_2.png",
			"cost": 2,
			"fr": {
				"name": "Enragé !",
				"text": "Donne +2 ATQ à votre héros pendant ce tour."
			},
			"id": "LOEA09_2",
			"name": "Enraged!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Give your hero +2 attack this turn.",
			"type": "Hero_power"
		},
		{
			"artist": "Mishi McCaig",
			"cardImage": "AT_068.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Renforcement",
				"text": "Confère +2/+2 à vos serviteurs avec <b>Provocation</b>."
			},
			"id": "AT_068",
			"name": "Bolster",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Give your <b>Taunt</b> minions +2/+2.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA06_02.png",
			"cost": 1,
			"fr": {
				"name": "Sculpture sur pierre",
				"text": "<b>Pouvoir héroïque</b>\nInvoque une statue 0/2 pour chaque joueur."
			},
			"id": "LOEA06_02",
			"name": "Stonesculpting",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\n Summon a 0/2 Statue for both players.",
			"type": "Hero_power"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "KARA_11_02.png",
			"cost": 0,
			"fr": {
				"name": "Tempête de mana",
				"text": "<b>Pouvoir héroïque passif</b>\nLes joueurs commencent la partie avec 10_cristaux de mana."
			},
			"id": "KARA_11_02",
			"name": "Manastorm",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Passive Hero Power</b>\nPlayers start with 10 Mana Crystals.",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_047e.png",
			"fr": {
				"name": "Aiguillons",
				"text": "+4 ATQ pendant ce tour."
			},
			"id": "OG_047e",
			"name": "Spines",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"text": "+4 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Sean O’Daniels",
			"cardImage": "CS2_012.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Balayage",
				"text": "Inflige $4 |4(point,points) de dégâts à un adversaire et $1 |4(point,points) de dégâts à tous les autres adversaires."
			},
			"id": "CS2_012",
			"name": "Swipe",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $4 damage to an enemy and $1 damage to all other enemies.",
			"type": "Spell"
		},
		{
			"cardImage": "LOE_118e.png",
			"fr": {
				"name": "Lame maudite",
				"text": "Double tous les dégâts subis par votre héros."
			},
			"id": "LOE_118e",
			"name": "Cursed Blade",
			"playerClass": "Warrior",
			"set": "Loe",
			"text": "Double all damage dealt to your hero.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOE_105e.png",
			"fr": {
				"name": "Chapeau d’explorateur",
				"text": "+1/+1.<b>Râle d’agonie :</b> ajoute un Chapeau d’explorateur dans votre main."
			},
			"id": "LOE_105e",
			"name": "Explorer's Hat",
			"playerClass": "Hunter",
			"set": "Loe",
			"text": "+1/+1. <b>Deathrattle:</b> Add an Explorer's Hat to your hand.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "TB_KTRAF_10.png",
			"cost": 9,
			"fr": {
				"name": "Noth le Porte-Peste",
				"text": "Chaque fois qu’un serviteur adverse meurt, invoque un squelette 1/1 et donne +1/+1 à vos autres serviteurs."
			},
			"health": 5,
			"id": "TB_KTRAF_10",
			"name": "Noth the Plaguebringer",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Whenever an enemy minion dies, summon a 1/1 Skeleton and give your other minions +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_101_H1_AT_132.png",
			"cost": 2,
			"fr": {
				"name": "La Main d’argent",
				"text": "<b>Pouvoir héroïque</b>\nInvoque deux recrues 1/1."
			},
			"id": "CS2_101_H1_AT_132",
			"name": "The Silver Hand",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nSummon two 1/1 Recruits.",
			"type": "Hero_power"
		},
		{
			"attack": 3,
			"cardImage": "KARA_13_19.png",
			"cost": 5,
			"fr": {
				"name": "Chaperon Rouge",
				"text": "<b>Provocation. Râle d’agonie_:</b> les adversaires ne peuvent pas attaquer pendant ce tour."
			},
			"health": 2,
			"id": "KARA_13_19",
			"name": "Red Riding Hood",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Taunt. Deathrattle:</b> Enemies can't attack this turn.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 6,
			"cardImage": "OG_318.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Lardeur, Perte d’Elwynn",
				"text": "Chaque fois que ce serviteur subit des dégâts, invoque un gnoll 2/2 avec <b>Provocation</b>."
			},
			"health": 6,
			"id": "OG_318",
			"name": "Hogger, Doom of Elwynn",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "Whenever this minion takes damage, summon a 2/2 Gnoll with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"cardImage": "OG_195a.png",
			"cost": 0,
			"fr": {
				"name": "Feux follets à foison",
				"text": "Invoque sept feux follets 1/1."
			},
			"id": "OG_195a",
			"name": "Many Wisps",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Og",
			"text": "Summon seven 1/1 Wisps.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX14_04.png",
			"cost": 5,
			"fr": {
				"name": "Froid absolu",
				"text": "Inflige $8 |4(point,points) de dégâts au héros adverse, et le <b>gèle</b>."
			},
			"id": "NAX14_04",
			"name": "Pure Cold",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Deal $8 damage to the enemy hero, and <b>Freeze</b> it.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "EX1_097.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Abomination",
				"text": "<b>Provocation</b>.\n<b>Râle d’agonie :</b> inflige 2 points de dégâts à TOUS les personnages."
			},
			"health": 4,
			"id": "EX1_097",
			"name": "Abomination",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Taunt</b>. <b>Deathrattle:</b> Deal 2 damage to ALL characters.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_09_06heroic.png",
			"cost": 4,
			"fr": {
				"name": "Salve d’Ombre",
				"text": "Inflige 3_points de dégâts à tous les serviteurs qui ne sont pas des démons."
			},
			"id": "KARA_09_06heroic",
			"name": "Shadow Volley",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Deal 3 damage to all non-Demon minions.",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_055e.png",
			"fr": {
				"name": "Ferraille tordue",
				"text": "+2/+2."
			},
			"id": "GVG_055e",
			"name": "Screwy Jank",
			"playerClass": "Warrior",
			"set": "Gvg",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "AT_040.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Marcheuse sauvage",
				"text": "<b>Cri de guerre :</b> donne\n+3 PV à une Bête alliée."
			},
			"health": 4,
			"id": "AT_040",
			"name": "Wildwalker",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Give a friendly Beast +3 Health.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX4_05.png",
			"cost": 6,
			"fr": {
				"name": "Peste",
				"text": "Détruit tous les serviteurs sauf les squelettes."
			},
			"id": "NAX4_05",
			"name": "Plague",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Destroy all non-Skeleton minions.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_075e.png",
			"fr": {
				"name": "Puissance du valet d’écurie",
				"text": "Le maître des chevaux de guerre confère +1 ATQ à ce serviteur."
			},
			"id": "AT_075e",
			"name": "Might of the Hostler",
			"playerClass": "Paladin",
			"set": "Tgt",
			"text": "Warhorse Trainer is granting this minion +1 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Grace Liu",
			"cardImage": "CS2_011.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Rugissement sauvage",
				"text": "Confère +2 ATQ à vos personnages pendant ce tour."
			},
			"id": "CS2_011",
			"name": "Savage Roar",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Core",
			"text": "Give your characters +2 Attack this turn.",
			"type": "Spell"
		},
		{
			"artist": "Andrius Matijoshius",
			"cardImage": "LOE_113.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Tout est vraiment génial",
				"text": "Donne +2/+2 à vos serviteurs. Coûte\n (1) |4(cristal,cristaux) de mana de moins pour chaque murloc contrôlé."
			},
			"id": "LOE_113",
			"name": "Everyfin is Awesome",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Loe",
			"text": "Give your minions +2/+2.\nCosts (1) less for each Murloc you control.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_132_DRUIDe.png",
			"fr": {
				"name": "Griffes sinistres",
				"text": "+2 ATQ pendant ce tour."
			},
			"id": "AT_132_DRUIDe",
			"name": "Dire Claws",
			"playerClass": "Druid",
			"set": "Tgt",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Terese Nielsen",
			"cardImage": "EX1_164.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Nourrir",
				"text": "<b>Choix des armes :</b> vous gagnez 2 cristaux de mana ou vous piochez 3 cartes."
			},
			"id": "EX1_164",
			"name": "Nourish",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Choose One</b> - Gain 2 Mana Crystals; or Draw 3 cards.",
			"type": "Spell"
		},
		{
			"cardImage": "DREAM_05.png",
			"cost": 0,
			"fr": {
				"name": "Cauchemar",
				"text": "Confère +5/+5 à un serviteur. Au début de votre prochain tour, le détruit."
			},
			"id": "DREAM_05",
			"name": "Nightmare",
			"playerClass": "Dream",
			"set": "Expert1",
			"text": "Give a minion +5/+5. At the start of your next turn, destroy it.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA02_2H.png",
			"cost": 0,
			"fr": {
				"name": "Foule moqueuse",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un spectateur 1/1 avec <b>Provocation</b>."
			},
			"id": "BRMA02_2H",
			"name": "Jeering Crowd",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Spectator with <b>Taunt</b>.",
			"type": "Hero_power"
		},
		{
			"artist": "Tom Baxa",
			"attack": 3,
			"cardImage": "EX1_083.png",
			"collectible": true,
			"cost": 3,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Suprétincelle",
				"text": "<b>Cri de guerre :</b> transforme un autre serviteur aléatoire soit en diablosaure 5/5, soit en écureuil 1/1 ."
			},
			"health": 3,
			"id": "EX1_083",
			"name": "Tinkmaster Overspark",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Transform another random minion into a 5/5 Devilsaur or a 1/1 Squirrel.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "BRM_011.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Horion de lave",
				"text": "Inflige $2 |4(point,points) de dégâts. Débloque vos cristaux de mana en <b>Surcharge</b>."
			},
			"id": "BRM_011",
			"name": "Lava Shock",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Brm",
			"text": "Deal $2 damage.\nUnlock your <b>Overloaded</b> Mana Crystals.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_010.png",
			"fr": {
				"name": "Enchantement de création de deck"
			},
			"id": "TB_010",
			"name": "Deckbuilding Enchant",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Luke Mancini",
			"attack": 5,
			"cardImage": "OG_316.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Héraut Volazj",
				"text": "<b>Cri de guerre :</b> invoque une copie 1/1 de chacun de vos autres serviteurs."
			},
			"health": 5,
			"id": "OG_316",
			"name": "Herald Volazj",
			"playerClass": "Priest",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Battlecry:</b> Summon a 1/1 copy of each of your other minions.",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "GVG_026.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Feindre la mort",
				"text": "Déclenche tous les <b>Râles d’agonie</b> de vos serviteurs."
			},
			"id": "GVG_026",
			"name": "Feign Death",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Trigger all <b>Deathrattles</b> on your minions.",
			"type": "Spell"
		},
		{
			"artist": "Dave Allsop",
			"attack": 8,
			"cardImage": "CS2_232.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Protecteur Écorcefer",
				"text": "<b>Provocation</b>"
			},
			"health": 8,
			"id": "CS2_232",
			"name": "Ironbark Protector",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_030a.png",
			"cost": 0,
			"fr": {
				"name": "Mode Attaque",
				"text": "+1 ATQ."
			},
			"id": "GVG_030a",
			"name": "Attack Mode",
			"playerClass": "Druid",
			"set": "Gvg",
			"text": "+1 Attack.",
			"type": "Spell"
		},
		{
			"artist": "Sam Nielson",
			"attack": 2,
			"cardImage": "LOE_077.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Brann Barbe-de-Bronze",
				"text": "Vos <b>Cris de guerre</b> se déclenchent deux fois."
			},
			"health": 4,
			"id": "LOE_077",
			"name": "Brann Bronzebeard",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "Your <b>Battlecries</b> trigger twice.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "LOE_021.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Piège de fléchettes",
				"text": "<b>Secret :</b> inflige\n$5 |4(point,points) de dégâts à un adversaire aléatoire après qu’un <b>pouvoir héroïque</b> adverse est utilisé."
			},
			"id": "LOE_021",
			"name": "Dart Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Secret:</b> After an opposing <b>Hero Power</b> is used, deal $5 damage to a random enemy.",
			"type": "Spell"
		},
		{
			"artist": "Bernie Kang",
			"attack": 3,
			"cardImage": "CS2_237.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Busard affamé",
				"text": "Vous piochez une carte chaque fois que vous invoquez une bête."
			},
			"health": 2,
			"id": "CS2_237",
			"name": "Starving Buzzard",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"text": "Whenever you summon a Beast, draw a card.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Clint Langley",
			"attack": 2,
			"cardImage": "GVG_040.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Marche-esprit aileron vaseux",
				"text": "Chaque fois qu’un autre murloc allié meurt, vous piochez une carte.\n<b>Surcharge_:</b>_(1)"
			},
			"health": 5,
			"id": "GVG_040",
			"name": "Siltfin Spiritwalker",
			"overload": 1,
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Whenever another friendly Murloc dies, draw a card. <b><b>Overload</b>:</b> (1)",
			"type": "Minion"
		},
		{
			"cardImage": "NAX11_01.png",
			"fr": {
				"name": "Grobbulus"
			},
			"health": 30,
			"id": "NAX11_01",
			"name": "Grobbulus",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "AT_070.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Cap’taine céleste Kragg",
				"text": "<b>Charrrrrge</b>\nCoûte (1) |4(cristal,cristaux) de moins pour chaque pirate allié."
			},
			"health": 6,
			"id": "AT_070",
			"name": "Skycap'n Kragg",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Charrrrrge</b>\nCosts (1) less for each friendly Pirate.",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 1,
			"cardImage": "AT_133.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Jouteuse de Gadgetzan",
				"text": "<b>Cri de guerre :</b> révèle un serviteur de chaque deck. Si le vôtre coûte plus, gagne +1/+1."
			},
			"health": 2,
			"id": "AT_133",
			"name": "Gadgetzan Jouster",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, gain +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA15_1.png",
			"fr": {
				"name": "Maloriak"
			},
			"health": 30,
			"id": "BRMA15_1",
			"name": "Maloriak",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 4,
			"cardImage": "EX1_017.png",
			"collectible": true,
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Panthère de la jungle",
				"text": "<b>Camouflage</b>"
			},
			"health": 2,
			"id": "EX1_017",
			"name": "Jungle Panther",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"artist": "Zolton Boros",
			"attack": 3,
			"cardImage": "GVG_023.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Robot barbier gobelin",
				"text": "<b>Cri de guerre_:</b> confère à votre arme +1_ATQ."
			},
			"health": 2,
			"id": "GVG_023",
			"name": "Goblin Auto-Barber",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Give your weapon +1 Attack.",
			"type": "Minion"
		},
		{
			"attack": 9,
			"cardImage": "CRED_17.png",
			"cost": 9,
			"fr": {
				"name": "Rob Pardo",
				"text": "Vous ne pouvez pas commencer de partie sans ce serviteur dans votre deck."
			},
			"health": 9,
			"id": "CRED_17",
			"name": "Rob Pardo",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "You can't start a game without this minion in your deck.",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"cardImage": "OG_094.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Mot de pouvoir : Tentacules",
				"text": "Donne +2/+6 à un serviteur."
			},
			"id": "OG_094",
			"name": "Power Word: Tentacles",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Og",
			"text": "Give a minion +2/+6.",
			"type": "Spell"
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
			"artist": "Luca Zontini",
			"cardImage": "OG_027.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Évolution",
				"text": "Transforme vos serviteurs en serviteurs aléatoires qui coûtent (1) |4(cristal,cristaux) de plus."
			},
			"id": "OG_027",
			"name": "Evolve",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Og",
			"text": "Transform your minions into random minions that cost (1) more.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"set": "Promo",
			"type": "Minion"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 3,
			"cardImage": "FP1_023.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Sombre sectateur",
				"text": "<b>Râle d’agonie :</b> confère\n+3 PV à un serviteur allié aléatoire."
			},
			"health": 4,
			"id": "FP1_023",
			"name": "Dark Cultist",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Give a random friendly minion +3 Health.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA05_3H.png",
			"cost": 3,
			"fr": {
				"name": "Bombe vivante",
				"text": "Choisissez un serviteur adverse. Inflige $10 |4(point,points) de dégâts à tous les adversaires s’il survit jusqu’à votre prochain tour."
			},
			"id": "BRMA05_3H",
			"name": "Living Bomb",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Choose an enemy minion. If it lives until your next turn, deal $10 damage to all enemies.",
			"type": "Spell"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "OG_116.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Folie galopante",
				"text": "Inflige $9 |4(point,points) de dégâts répartis de façon aléatoire entre TOUS les personnages."
			},
			"id": "OG_116",
			"name": "Spreading Madness",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Og",
			"text": "Deal $9 damage randomly split among ALL characters.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_BlingBrawl_Blade2e.png",
			"fr": {
				"name": "Lame de Bling-o-tron HEROÏQUE"
			},
			"id": "TB_BlingBrawl_Blade2e",
			"name": "Blingtron's Blade HERO",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "TB_GiftExchange_Treasure.png",
			"cost": 0,
			"fr": {
				"name": "Cadeau du Voile d’hiver",
				"text": "<b>Râle d’agonie_:</b> donne un cadeau volé au joueur dont c’est le tour."
			},
			"health": 4,
			"id": "TB_GiftExchange_Treasure",
			"name": "Winter's Veil Gift",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Deathrattle:</b> Give current player a Stolen Gift.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_048.png",
			"cost": 0,
			"fr": {
				"name": "-1 Durability",
				"text": "Give a player's weapon -1 Durability."
			},
			"id": "XXX_048",
			"name": "-1 Durability",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Give a player's weapon -1 Durability.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA09_2e.png",
			"fr": {
				"name": "Enragé",
				"text": "+2 ATQ."
			},
			"id": "LOEA09_2e",
			"name": "Enraged",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "+2 Attack",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX6_04.png",
			"cost": 1,
			"fr": {
				"name": "Explosion de spores",
				"text": "Inflige $1 |4(point,points) de dégâts à tous les serviteurs adverses. Invoque une spore."
			},
			"id": "NAX6_04",
			"name": "Sporeburst",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Deal $1 damage to all enemy minions. Summon a Spore.",
			"type": "Spell"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "KARA_09_07.png",
			"cost": 6,
			"fr": {
				"name": "Vol de vie",
				"text": "Inflige 5_points de dégâts. Rend 5_PV à votre héros."
			},
			"id": "KARA_09_07",
			"name": "Steal Life",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Deal 5 damage. Restore 5 Health to your hero.",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"cardImage": "CS2_013.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Croissance sauvage",
				"text": "Confère un cristal de mana vide."
			},
			"id": "CS2_013",
			"name": "Wild Growth",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"text": "Gain an empty Mana Crystal.",
			"type": "Spell"
		},
		{
			"artist": "Samwise",
			"attack": 6,
			"cardImage": "GVG_088.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Ninja ogre",
				"text": "<b>Camouflage</b>\n50% de chance d’attaquer le mauvais adversaire."
			},
			"health": 6,
			"id": "GVG_088",
			"name": "Ogre Ninja",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Stealth</b>\n50% chance to attack the wrong enemy.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "OG_150.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Berserker aberrant",
				"text": "<b>Accès de rage :</b> +2 ATQ."
			},
			"health": 5,
			"id": "OG_150",
			"name": "Aberrant Berserker",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Enrage:</b> +2 Attack.",
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
			"cardImage": "BRMA14_8H.png",
			"cost": 6,
			"fr": {
				"name": "Activer Magmatron",
				"text": "<b>Pouvoir héroïque</b>\nActive Magmatron !"
			},
			"id": "BRMA14_8H",
			"name": "Activate Magmatron",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nActivate Magmatron!",
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_21.png",
			"cost": 5,
			"fr": {
				"name": "Chef Scarvash",
				"text": "Les cartes adverses coûtent (1) |4(cristal,cristaux) de plus."
			},
			"health": 5,
			"id": "LOEA16_21",
			"name": "Chieftain Scarvash",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "Enemy cards cost (1) more.",
			"type": "Minion"
		},
		{
			"artist": "Dan Orizio",
			"attack": 0,
			"cardImage": "OG_200.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Auspice funeste confirmé",
				"text": "Au début de votre tour, porte l’Attaque de ce serviteur à 7."
			},
			"health": 7,
			"id": "OG_200",
			"name": "Validated Doomsayer",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Og",
			"text": "At the start of your turn, set this minion's Attack to 7.",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "BRMC_91.png",
			"cost": 3,
			"fr": {
				"name": "Fils de la Flamme",
				"text": "<b>Cri de guerre :</b> inflige 6 points de dégâts."
			},
			"health": 3,
			"id": "BRMC_91",
			"name": "Son of the Flame",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Battlecry:</b> Deal 6 damage.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_130.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Noble sacrifice",
				"text": "<b>Secret :</b> invoque un défenseur 2/1 qui devient la cible de l’adversaire sur le point d’attaquer."
			},
			"id": "EX1_130",
			"name": "Noble Sacrifice",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Secret:</b> When an enemy attacks, summon a 2/1 Defender as the new target.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX11_02.png",
			"cost": 2,
			"fr": {
				"name": "Nuage empoisonné",
				"text": "<b>Pouvoir héroïque</b>\nInflige 1 point de dégâts à\n tous les serviteurs. Invoque une gelée si l’un d’eux meurt."
			},
			"id": "NAX11_02",
			"name": "Poison Cloud",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDeal 1 damage to all minions. If any die, summon a slime.",
			"type": "Hero_power"
		},
		{
			"cardImage": "KARA_13_02H.png",
			"cost": 2,
			"fr": {
				"name": "La Horde",
				"text": "<b>Pouvoir héroïque</b>\nInvoque une orque_3/3 avec <b>Charge</b>."
			},
			"id": "KARA_13_02H",
			"name": "The Horde",
			"playerClass": "Warrior",
			"set": "Kara",
			"text": "[x]<b>Hero Power</b>\nSummon a 3/3 Orc\nwith <b>Charge</b>.",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRM_010a.png",
			"cost": 0,
			"fr": {
				"name": "Forme de félin-de-feu",
				"text": "Se transforme en un serviteur 5/2."
			},
			"id": "BRM_010a",
			"name": "Firecat Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Brm",
			"text": "Transform into a 5/2 minion.",
			"type": "Spell"
		},
		{
			"artist": "Joe Wilson",
			"cardImage": "KAR_A10_33.png",
			"cost": 2,
			"fr": {
				"name": "Triche",
				"text": "<b>Pouvoir héroïque</b>\nDétruit le serviteur adverse le plus à gauche."
			},
			"id": "KAR_A10_33",
			"name": "Cheat",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nDestroy the left-most enemy minion.",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOEA06_03.png",
			"cost": 2,
			"fr": {
				"name": "Terrestre animé",
				"text": "Donne +1/+1 et <b>Provocation</b> à vos serviteurs."
			},
			"id": "LOEA06_03",
			"name": "Animate Earthen",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Give your minions +1/+1 and <b>Taunt</b>.",
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
			"cardImage": "BRMA17_4.png",
			"cost": 2,
			"fr": {
				"name": "LAVE !",
				"text": "Inflige $2 |4(point,points) de dégâts à tous les serviteurs."
			},
			"id": "BRMA17_4",
			"name": "LAVA!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Deal $2 damage to all minions.",
			"type": "Spell"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 3,
			"cardImage": "OG_247.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Worgen corrompu",
				"text": "<b>Camouflage</b>"
			},
			"health": 1,
			"id": "OG_247",
			"name": "Twisted Worgen",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "AT_048.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Vague de soins",
				"text": "Rend #7 PV. Révèle un serviteur de chaque deck. Si le vôtre coûte plus cher, rend\n#14 PV à la place."
			},
			"id": "AT_048",
			"name": "Healing Wave",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "Restore #7 Health. Reveal a minion in each deck. If yours costs more, Restore #14 instead.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX5_02.png",
			"cost": 1,
			"fr": {
				"name": "Éruption",
				"text": "<b>Pouvoir héroïque</b>\nInflige 2 points de dégâts au serviteur adverse tout à gauche."
			},
			"id": "NAX5_02",
			"name": "Eruption",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDeal 2 damage to the left-most enemy minion.",
			"type": "Hero_power"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "EX1_355.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Bénédiction du champion",
				"text": "Double l’Attaque d’un serviteur."
			},
			"id": "EX1_355",
			"name": "Blessed Champion",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Double a minion's Attack.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "NEW1_011.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Soldat d’élite kor’kron",
				"text": "<b>Charge</b>"
			},
			"health": 3,
			"id": "NEW1_011",
			"name": "Kor'kron Elite",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "AT_005t.png",
			"cost": 3,
			"fr": {
				"name": "Sanglier",
				"text": "<b>Charge</b>"
			},
			"health": 2,
			"id": "AT_005t",
			"name": "Boar",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "<b>Charge</b>",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_608.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Apprentie du sorcier",
				"text": "Vos sorts coûtent (1) cristal de moins."
			},
			"health": 2,
			"id": "EX1_608",
			"name": "Sorcerer's Apprentice",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Your spells cost (1) less.",
			"type": "Minion"
		},
		{
			"cardImage": "OG_222e.png",
			"fr": {
				"name": "Ralliement",
				"text": "+1/+1."
			},
			"id": "OG_222e",
			"name": "Rally",
			"playerClass": "Paladin",
			"set": "Og",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "LOE_007.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Malédiction de Rafaam",
				"text": "Donne une carte Maudit ! à votre adversaire.\nTant qu’elle est dans sa main, il subit 2 points de dégâts au début de son tour."
			},
			"id": "LOE_007",
			"name": "Curse of Rafaam",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Loe",
			"text": "Give your opponent a 'Cursed!' card.\nWhile they hold it, they take 2 damage on their turn.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "TU4a_001.png",
			"fr": {
				"name": "Lardeur"
			},
			"health": 10,
			"id": "TU4a_001",
			"name": "Hogger",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 4,
			"cardImage": "GVG_074.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mystique de Kezan",
				"text": "<b>Cri de guerre :</b> prend le contrôle d’un <b>Secret</b> adverse aléatoire."
			},
			"health": 3,
			"id": "GVG_074",
			"name": "Kezan Mystic",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Take control of a random enemy <b>Secret</b>.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "TB_MechWar_Minion1.png",
			"cost": 2,
			"fr": {
				"name": "Fan de méca",
				"text": "<b>Provocation</b>"
			},
			"health": 1,
			"id": "TB_MechWar_Minion1",
			"name": "Mech Fan",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Tooth",
			"attack": 4,
			"cardImage": "AT_027.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Wilfred Flopboum",
				"text": "Les cartes que vous piochez avec votre pouvoir héroïque coûtent (0) |4(cristal,cristaux)."
			},
			"health": 4,
			"id": "AT_027",
			"name": "Wilfred Fizzlebang",
			"playerClass": "Warlock",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "Cards you draw from your Hero Power cost (0).",
			"type": "Minion"
		},
		{
			"artist": "Howard Lyon",
			"cardImage": "GVG_073.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Tir du cobra",
				"text": "Inflige $3 |4(point,points) de dégâts à un serviteur et au héros adverse."
			},
			"id": "GVG_073",
			"name": "Cobra Shot",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Deal $3 damage to a minion and the enemy hero.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX1h_04.png",
			"cost": 2,
			"fr": {
				"name": "Grouillement",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un nérubien 4/4."
			},
			"id": "NAX1h_04",
			"name": "Skitter",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nSummon a 4/4 Nerubian.",
			"type": "Hero_power"
		},
		{
			"artist": "Dan Dos Santos",
			"cardImage": "AT_015.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Convertir",
				"text": "Place une copie d’un serviteur adverse dans votre main."
			},
			"id": "AT_015",
			"name": "Convert",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "Put a copy of an enemy minion into your hand.",
			"type": "Spell"
		},
		{
			"artist": "Daren Bader",
			"attack": 3,
			"cardImage": "KAR_205.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Golem d’argenterie",
				"text": "Si vous vous défaussez de ce serviteur, l’invoque."
			},
			"health": 3,
			"id": "KAR_205",
			"name": "Silverware Golem",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Kara",
			"text": "If you discard this minion, summon it.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_98.png",
			"cost": 6,
			"fr": {
				"name": "Tranchetripe",
				"text": "Confère +3 ATQ à vos serviteurs au début de votre tour."
			},
			"health": 12,
			"id": "BRMC_98",
			"name": "Razorgore",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "At the start of your turn, give your minions +3 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"cardImage": "PART_004.png",
			"cost": 1,
			"fr": {
				"name": "Champ de camouflage",
				"text": "Confère <b>Camouflage</b> à un serviteur allié jusqu’à votre prochain tour."
			},
			"id": "PART_004",
			"name": "Finicky Cloakfield",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Give a friendly minion <b>Stealth</b> until your next turn.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA05_3He.png",
			"fr": {
				"name": "Bombe vivante",
				"text": "Pendant le tour de Geddon, inflige 10 points de dégâts à votre héros et vos serviteurs."
			},
			"id": "BRMA05_3He",
			"name": "Living Bomb",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "On Geddon's turn, deal 10 damage to all of your stuff.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_7_Ench_2nd.png",
			"fr": {
				"name": "Destin 7 : enchantement 2"
			},
			"id": "TB_PickYourFate_7_Ench_2nd",
			"name": "Fate 7 Ench 2nd",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_016.png",
			"cost": 0,
			"fr": {
				"name": "Snake Ball",
				"text": "Summon five 1/1 snakes."
			},
			"id": "XXX_016",
			"name": "Snake Ball",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Summon five 1/1 snakes.",
			"type": "Spell"
		},
		{
			"artist": "Chris Seaman",
			"cardImage": "GVG_056t.png",
			"cost": 0,
			"fr": {
				"name": "Mine enfouie",
				"text": "Quand vous la piochez, elle explose, vous infligeant 10 points de dégâts. Vous piochez une carte."
			},
			"id": "GVG_056t",
			"name": "Burrowing Mine",
			"playerClass": "Warrior",
			"set": "Gvg",
			"text": "When you draw this, it explodes. You take 10 damage and draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_Murgstone_001.png",
			"cost": 0,
			"fr": {
				"name": "La pièce de quête",
				"text": "Gagne un cristal de mana vide. Vous ne pouvez jouer qu’une carte de ce type par tour."
			},
			"id": "TB_Murgstone_001",
			"name": "Quest Coin",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Tb",
			"text": "Gain an empty Mana Crystal. Can only play one of these per turn.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "KARA_13_19e.png",
			"fr": {
				"name": "Triste",
				"text": "Ne peut pas attaquer pendant ce tour."
			},
			"id": "KARA_13_19e",
			"name": "Saddened",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Can't attack this turn.",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "XXX_096.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - Damage Own Hero 5",
				"text": "Spawn into play to smack your own hero for 5."
			},
			"health": 1,
			"id": "XXX_096",
			"name": "AI Buddy - Damage Own Hero 5",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Spawn into play to smack your own hero for 5.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_390e.png",
			"fr": {
				"name": "Enragé",
				"text": "+3 ATQ."
			},
			"id": "EX1_390e",
			"name": "Enraged",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "KARA_04_05h.png",
			"cost": 3,
			"fr": {
				"name": "Singe volant",
				"text": "<b>Charge</b>"
			},
			"health": 2,
			"id": "KARA_04_05h",
			"name": "Flying Monkey",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"artist": "E.M. Gist",
			"attack": 1,
			"cardImage": "NEW1_037.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Maître fabricant d’épées",
				"text": "À la fin de votre tour, donne +1 ATQ à un autre serviteur allié aléatoire."
			},
			"health": 3,
			"id": "NEW1_037",
			"name": "Master Swordsmith",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "At the end of your turn, give another random friendly minion +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX6_03.png",
			"cost": 4,
			"fr": {
				"name": "Mortelle floraison",
				"text": "Inflige $5 |4(point,points) de dégâts à un serviteur. Invoque une spore."
			},
			"id": "NAX6_03",
			"name": "Deathbloom",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Deal $5 damage to a minion. Summon a Spore.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_034.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu",
				"text": "<b>Pouvoir héroïque</b>\nInflige $1 point de dégâts."
			},
			"id": "CS2_034",
			"name": "Fireblast",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Hero Power</b>\nDeal $1 damage.",
			"type": "Hero_power"
		},
		{
			"artist": "Jimmy Lo",
			"cardImage": "CS2_084.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Marque du chasseur",
				"text": "Fait tomber les points de vie d’un serviteur\nà 1."
			},
			"id": "CS2_084",
			"name": "Hunter's Mark",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"text": "Change a minion's Health to 1.",
			"type": "Spell"
		},
		{
			"cardImage": "OG_291e.png",
			"fr": {
				"name": "Ténèbres vacillantes",
				"text": "L’exhalombre a créé ce serviteur 1/1."
			},
			"id": "OG_291e",
			"name": "Flickering Darkness",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Shadowcaster made this 1/1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "KARA_08_06e2.png",
			"fr": {
				"name": "Rayon bleu",
				"text": "Ne subit que 1_point de dégâts à la fois."
			},
			"id": "KARA_08_06e2",
			"name": "Blue Beam",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Only take 1 damage at a time.",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "GVG_014.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Vol’jin",
				"text": "<b>Cri de guerre :</b> échange sa Vie avec un autre serviteur."
			},
			"health": 2,
			"id": "GVG_014",
			"name": "Vol'jin",
			"playerClass": "Priest",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Swap Health with another minion.",
			"type": "Minion"
		},
		{
			"artist": "Eva Wilderman",
			"cardImage": "OG_223.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Force divine",
				"text": "Donne +1/+2 à un serviteur."
			},
			"id": "OG_223",
			"name": "Divine Strength",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Og",
			"text": "Give a minion +1/+2.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_379e.png",
			"fr": {
				"name": "Repentir",
				"text": "Points de vie réduits à 1."
			},
			"id": "EX1_379e",
			"name": "Repentance",
			"playerClass": "Paladin",
			"set": "Expert1",
			"text": "Health reduced to 1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_045a.png",
			"fr": {
				"name": "Spores nérubiennes",
				"text": "Vous obtenez une Bête quand ce serviteur meurt."
			},
			"id": "OG_045a",
			"name": "Nerubian Spores",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"text": "Get a Beast when this dies.",
			"type": "Enchantment"
		},
		{
			"attack": 6,
			"cardImage": "BRMA13_6.png",
			"cost": 0,
			"fr": {
				"name": "Lave vivante",
				"text": "<b>Provocation</b>"
			},
			"health": 6,
			"id": "BRMA13_6",
			"name": "Living Lava",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Taunt</b>",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_21H.png",
			"cost": 10,
			"fr": {
				"name": "Chef Scarvash",
				"text": "Les cartes adverses coûtent (2) |4(cristal,cristaux) de plus."
			},
			"health": 10,
			"id": "LOEA16_21H",
			"name": "Chieftain Scarvash",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "Enemy cards cost (2) more.",
			"type": "Minion"
		},
		{
			"artist": "Peter Stapleton",
			"attack": 3,
			"cardImage": "LOE_022.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Singe féroce",
				"text": "<b>Provocation</b>"
			},
			"health": 4,
			"id": "LOE_022",
			"name": "Fierce Monkey",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_2H.png",
			"cost": 0,
			"fr": {
				"name": "Bâton de l’Origine",
				"text": "<b>Pouvoir héroïque passif</b>\nVotre héros est <b>Insensible</b>."
			},
			"id": "LOEA16_2H",
			"name": "Staff of Origination",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\nYour hero is <b>Immune</b>.",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_GreatCurves_01.png",
			"fr": {
				"name": "TB_ClockworkCardDealer"
			},
			"id": "TB_GreatCurves_01",
			"name": "TB_ClockworkCardDealer",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
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
			"cardImage": "AT_017e.png",
			"fr": {
				"name": "Étreinte du Crépuscule",
				"text": "+1 ATQ et <b>Provocation</b>."
			},
			"id": "AT_017e",
			"name": "Twilight's Embrace",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+1 Attack and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Andrew Hou",
			"cardImage": "KARA_09_03.png",
			"cost": 2,
			"fr": {
				"name": "Des diablotins !",
				"text": "Invoque 2 diablotins dégoûtants."
			},
			"id": "KARA_09_03",
			"name": "Many Imps!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon 2 Icky Imps.",
			"type": "Spell"
		},
		{
			"artist": "Bernie Kang",
			"cardImage": "EX1_554.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Piège à serpents",
				"text": "<b>Secret :</b> quand un de vos serviteurs est attaqué, invoque trois serpents 1/1."
			},
			"id": "EX1_554",
			"name": "Snake Trap",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Secret:</b> When one of your minions is attacked, summon three 1/1 Snakes.",
			"type": "Spell"
		},
		{
			"artist": "Dany Orizio",
			"attack": 2,
			"cardImage": "EX1_131.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Meneur défias",
				"text": "<b>Combo :</b> invoque un bandit défias 2/1."
			},
			"health": 2,
			"id": "EX1_131",
			"name": "Defias Ringleader",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Combo:</b> Summon a 2/1 Defias Bandit.",
			"type": "Minion"
		},
		{
			"artist": "Gonzalo Ordonez",
			"attack": 3,
			"cardImage": "OG_321.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Adorateur fanatisé",
				"text": "<b>Provocation</b>. Chaque fois que ce serviteur subit des dégâts, donne +1/+1 à votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 6,
			"id": "OG_321",
			"name": "Crazed Worshipper",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Taunt.</b> Whenever this minion takes damage, give your C'Thun +1/+1 <i>(wherever it is).</i>",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_027e.png",
			"fr": {
				"name": "Bien armé",
				"text": "Caractéristiques augmentées."
			},
			"id": "GVG_027e",
			"name": "Ironed Out",
			"playerClass": "Rogue",
			"set": "Gvg",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_032a.png",
			"cost": 0,
			"fr": {
				"name": "Don de mana",
				"text": "Donne à chaque joueur un cristal de mana."
			},
			"id": "GVG_032a",
			"name": "Gift of Mana",
			"playerClass": "Druid",
			"set": "Gvg",
			"text": "Give each player a Mana Crystal.",
			"type": "Spell"
		},
		{
			"artist": "Monica Langlois",
			"attack": 3,
			"cardImage": "CS1_069.png",
			"collectible": true,
			"cost": 5,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Rampant des tourbières",
				"text": "<b>Provocation</b>"
			},
			"health": 6,
			"id": "CS1_069",
			"name": "Fen Creeper",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Taunt</b>",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Peter C. Lee",
			"attack": 5,
			"cardImage": "DS1_188.png",
			"collectible": true,
			"cost": 7,
			"durability": 2,
			"fr": {
				"name": "Arc long du gladiateur",
				"text": "Votre héros est <b>Insensible</b> quand il attaque."
			},
			"id": "DS1_188",
			"name": "Gladiator's Longbow",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Your hero is <b>Immune</b> while attacking.",
			"type": "Weapon"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "KAR_A01_01.png",
			"fr": {
				"name": "Miroir magique"
			},
			"health": 30,
			"id": "KAR_A01_01",
			"name": "Magic Mirror",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "TB_PickYourFate7Ench.png",
			"fr": {
				"name": "Destin 7 : enchantement La pièce"
			},
			"id": "TB_PickYourFate7Ench",
			"name": "Fate 7 Ench Get a Coin",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "GVG_056.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Mastodonte de fer",
				"text": "<b>Cri de guerre :</b> place une mine dans le deck de votre adversaire. Quand elle est piochée, elle explose et inflige 10 points de dégâts."
			},
			"health": 5,
			"id": "GVG_056",
			"name": "Iron Juggernaut",
			"playerClass": "Warrior",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Shuffle a Mine into your opponent's deck. When drawn, it explodes for 10 damage.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_041e.png",
			"fr": {
				"name": "Infusion ancestrale",
				"text": "Provocation."
			},
			"id": "CS2_041e",
			"name": "Ancestral Infusion",
			"playerClass": "Shaman",
			"set": "Core",
			"text": "Taunt.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 6,
			"cardImage": "AT_079.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Adversaire mystérieux",
				"text": "<b>Cri de guerre :</b> place un <b>Secret</b> de chaque type de votre deck sur le champ de bataille."
			},
			"health": 6,
			"id": "AT_079",
			"name": "Mysterious Challenger",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Put one of each <b>Secret</b> from your deck into the battlefield.",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "CS2_057.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Trait de l’ombre",
				"text": "Inflige $4 |4(point,points) de dégâts à un serviteur."
			},
			"id": "CS2_057",
			"name": "Shadow Bolt",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $4 damage to a minion.",
			"type": "Spell"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 1,
			"cardImage": "GVG_106.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Brik-à-bot",
				"text": "Chaque fois qu’un Méca allié meurt, gagne +2/+2."
			},
			"health": 5,
			"id": "GVG_106",
			"name": "Junkbot",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Whenever a friendly Mech dies, gain +2/+2.",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 8,
			"cardImage": "LOE_073.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Diablosaure fossilisé",
				"text": "<b>Cri de guerre :</b> gagne <b>Provocation</b> si vous contrôlez une Bête."
			},
			"health": 8,
			"id": "LOE_073",
			"name": "Fossilized Devilsaur",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Battlecry:</b> If you control a Beast, gain <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Eric Browning",
			"attack": 1,
			"cardImage": "FP1_003.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Limon résonnant",
				"text": "<b>Cri de guerre :</b> invoque une copie conforme de ce serviteur à la fin du tour."
			},
			"health": 2,
			"id": "FP1_003",
			"name": "Echoing Ooze",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Naxx",
			"text": "<b>Battlecry:</b> Summon an exact copy of this minion at the end of the turn.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_2nd.png",
			"fr": {
				"name": "Choisissez votre destin : aléatoire 2"
			},
			"id": "TB_PickYourFate_2nd",
			"name": "Pick Your Fate Randon 2nd",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "EX1_067.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Commandant d’Argent",
				"text": "<b>Charge</b>\n<b>Bouclier divin</b>"
			},
			"health": 2,
			"id": "EX1_067",
			"name": "Argent Commander",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Charge</b>\n<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_6H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : noir",
				"text": "Chaque fois que Chromaggus pioche une carte, il en obtient une copie tant que vous avez celle-ci dans votre main."
			},
			"id": "BRMA12_6H",
			"name": "Brood Affliction: Black",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "While this is in your hand, whenever Chromaggus draws a card, he gets another copy of it.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Max Grecke",
			"cardImage": "KARA_06_02.png",
			"fr": {
				"name": "Julianne"
			},
			"health": 15,
			"id": "KARA_06_02",
			"name": "Julianne",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"attack": 3,
			"cardImage": "TB_KTRAF_8.png",
			"cost": 8,
			"fr": {
				"name": "Instructeur Razuvious",
				"text": "<b>Cri de guerre :</b> vous équipe d’une Lame runique massive 5/2."
			},
			"health": 3,
			"id": "TB_KTRAF_8",
			"name": "Instructor Razuvious",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "<b>Battlecry:</b> Equip a 5/2 Massive Runeblade.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_13_11.png",
			"cost": 3,
			"fr": {
				"name": "Salve de traits de l’ombre",
				"text": "Inflige $4_|4(point,points) de dégâts à trois adversaires aléatoires."
			},
			"id": "KARA_13_11",
			"name": "Shadow Bolt Volley",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Deal $4 damage to three random enemies.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"cardImage": "AT_022.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Poing de Jaraxxus",
				"text": "Quand vous jouez ou que vous vous défaussez de cette carte, inflige $4 |4(point,points) de dégâts à un adversaire aléatoire."
			},
			"id": "AT_022",
			"name": "Fist of Jaraxxus",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "When you play or discard this, deal $4 damage to a random enemy.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_3.png",
			"cost": 10,
			"fr": {
				"name": "Lanterne de puissance",
				"text": "Donne +10/+10 à un serviteur."
			},
			"id": "LOEA16_3",
			"name": "Lantern of Power",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Give a minion +10/+10.",
			"type": "Spell"
		},
		{
			"artist": "John Polidora",
			"attack": 5,
			"cardImage": "CS2_213.png",
			"collectible": true,
			"cost": 6,
			"faction": "HORDE",
			"fr": {
				"name": "Missilière téméraire",
				"text": "<b>Charge</b>"
			},
			"health": 2,
			"id": "CS2_213",
			"name": "Reckless Rocketeer",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"cardImage": "OG_080de.png",
			"fr": {
				"name": "Pâlerette",
				"text": "Camouflé jusqu’à votre prochain tour."
			},
			"id": "OG_080de",
			"name": "Fadeleaf",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Stealthed until your next turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Paul Warzecha",
			"attack": 2,
			"cardImage": "EX1_390.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Guerrier tauren",
				"text": "<b>Provocation</b>.\n<b>Accès de rage :</b> +3 ATQ"
			},
			"health": 3,
			"id": "EX1_390",
			"name": "Tauren Warrior",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Taunt</b>. <b>Enrage:</b> +3 Attack",
			"type": "Minion"
		},
		{
			"artist": "Jimmy Lo",
			"cardImage": "OG_023.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Fusion primordiale",
				"text": "Confère +1/+1 à un serviteur pour chacun de vos totems."
			},
			"id": "OG_023",
			"name": "Primal Fusion",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Og",
			"text": "Give a minion +1/+1 for each of your Totems.",
			"type": "Spell"
		},
		{
			"cardImage": "KARA_08_01H.png",
			"fr": {
				"name": "Dédain-du-Néant"
			},
			"health": 30,
			"id": "KARA_08_01H",
			"name": "Netherspite",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "KARA_13_02.png",
			"cost": 2,
			"fr": {
				"name": "La Horde",
				"text": "<b>Pouvoir héroïque</b>\nInvoque une orque_3/2."
			},
			"id": "KARA_13_02",
			"name": "The Horde",
			"playerClass": "Warrior",
			"set": "Kara",
			"text": "[x]<b>Hero Power</b>\nSummon a 3/2 Orc.",
			"type": "Hero_power"
		},
		{
			"artist": "Ralph Horsley",
			"cardImage": "EX1_251.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Fourche d’éclairs",
				"text": "Inflige $2 |4(point,points) de dégâts à 2 serviteurs adverses aléatoires. <b>Surcharge :</b> (2)"
			},
			"id": "EX1_251",
			"name": "Forked Lightning",
			"overload": 2,
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Deal $2 damage to 2 random enemy minions. <b>Overload:</b> (2)",
			"type": "Spell"
		},
		{
			"artist": "Andrew Hou",
			"cardImage": "OG_100.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mot de l’ombre : Horreur",
				"text": "Détruit tous les serviteurs avec\n2 Attaque ou moins."
			},
			"id": "OG_100",
			"name": "Shadow Word: Horror",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Og",
			"text": "Destroy all minions with 2 or less Attack.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpv3_008.png",
			"cost": 0,
			"fr": {
				"name": "Projectiles enflammés",
				"text": "Inflige 10 points de dégâts répartis de façon aléatoire entre tous les autres personnages."
			},
			"id": "TB_CoOpv3_008",
			"name": "Flame Missiles",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Deal 10 damage randomly split among all other characters.",
			"type": "Spell"
		},
		{
			"artist": "Arthur Bozonnet",
			"cardImage": "KARA_00_02.png",
			"cost": 2,
			"fr": {
				"name": "Légion",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un abyssal_6/6."
			},
			"id": "KARA_00_02",
			"name": "Legion",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nSummon a 6/6 Abyssal.",
			"type": "Hero_power"
		},
		{
			"artist": "Steve Prescott",
			"cardImage": "EX1_617.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Tir meurtrier",
				"text": "Détruit un serviteur adverse aléatoire."
			},
			"id": "EX1_617",
			"name": "Deadly Shot",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Destroy a random enemy minion.",
			"type": "Spell"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 1,
			"cardImage": "GVG_103.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Micro-machine",
				"text": "Gagne +1 ATQ au début de chaque tour."
			},
			"health": 2,
			"id": "GVG_103",
			"name": "Micro Machine",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "At the start of each turn, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_046e.png",
			"fr": {
				"name": "Furie sanguinaire",
				"text": "+3 ATQ pendant ce tour."
			},
			"id": "CS2_046e",
			"name": "Bloodlust",
			"playerClass": "Shaman",
			"set": "Core",
			"text": "+3 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "KAR_037.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Gardien aviaire",
				"text": "<b>Cri de guerre_:</b> si vous contrôlez un <b>Secret</b>, gagne_+1/+1 et <b>Provocation</b>."
			},
			"health": 6,
			"id": "KAR_037",
			"name": "Avian Watcher",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Kara",
			"text": "<b>Battlecry:</b> If you control a <b>Secret</b>, gain +1/+1\nand <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_007.png",
			"cost": 0,
			"fr": {
				"name": "Enable for Attack",
				"text": "Give a character Charge and make him able to attack!"
			},
			"id": "XXX_007",
			"name": "Enable for Attack",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Give a character Charge and make him able to attack!",
			"type": "Spell"
		},
		{
			"cardImage": "TB_KaraPortal_003.png",
			"fr": {
				"name": "Enchantement de héros triste",
				"text": "Donne «_Ne peut pas attaquer pendant ce tour_» aux serviteurs adverses."
			},
			"id": "TB_KaraPortal_003",
			"name": "Saddened Hero Enchant",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Give can't attack this turn to enemy minions.",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "LOEA09_7.png",
			"cost": 0,
			"fr": {
				"name": "Chaudron",
				"text": "<b>Provocation</b>\n<b>Râle d’agonie :</b> libère Sir Finley et arrête l’attaque naga !"
			},
			"health": 5,
			"id": "LOEA09_7",
			"name": "Cauldron",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Taunt</b>\n<b>Deathrattle:</b> Save Sir Finley and stop the Naga onslaught!",
			"type": "Minion"
		},
		{
			"artist": "Brandon Kitkouski",
			"cardImage": "EX1_610.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Piège explosif",
				"text": "<b>Secret :</b> quand votre héros est attaqué, inflige $2 |4(point,points) de dégâts à tous les adversaires."
			},
			"id": "EX1_610",
			"name": "Explosive Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Secret:</b> When your hero is attacked, deal $2 damage to all enemies.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_9.png",
			"fr": {
				"name": "Draconien chromatique"
			},
			"health": 30,
			"id": "BRMA12_9",
			"name": "Chromatic Dragonkin",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "EX1_603e.png",
			"fr": {
				"name": "Coup de fouet motivant",
				"text": "+2 ATQ."
			},
			"id": "EX1_603e",
			"name": "Whipped Into Shape",
			"playerClass": "Warrior",
			"set": "Expert1",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "James Ryman",
			"attack": 2,
			"cardImage": "OG_156.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Murloc aileron-bilieux",
				"text": "<b>Cri de guerre :</b> invoque un limon 1/1 avec <b>Provocation</b>."
			},
			"health": 1,
			"id": "OG_156",
			"name": "Bilefin Tidehunter",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Battlecry:</b> Summon a 1/1 Ooze with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "KARA_13_15.png",
			"cost": 2,
			"fr": {
				"name": "Wanda Super-Sabots",
				"text": "Les portails coûtent (1)_|4(cristal,cristaux) de moins.\n<i>Ne compte pas comme un serviteur.</i>"
			},
			"health": 2,
			"id": "KARA_13_15",
			"name": "Wanda Wonderhooves",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Portals cost (1) less. \n<i>Does not count as a minion.</i>",
			"type": "Minion"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 1,
			"cardImage": "OG_312.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Second de N’Zoth",
				"text": "<b>Cri de guerre :</b> vous équipe d’un Crochet rouillé 1/3."
			},
			"health": 1,
			"id": "OG_312",
			"name": "N'Zoth's First Mate",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Battlecry:</b> Equip a 1/3 Rusty Hook.",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 1,
			"cardImage": "GVG_076.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Mouton explosif",
				"text": "<b>Râle d’agonie :</b> inflige 2 points de dégâts à tous les serviteurs."
			},
			"health": 1,
			"id": "GVG_076",
			"name": "Explosive Sheep",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Deathrattle:</b> Deal 2 damage to all minions.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX9_07.png",
			"cost": 5,
			"fr": {
				"name": "Marque des cavaliers",
				"text": "Confère +1/+1 à vos serviteurs et à votre arme."
			},
			"id": "NAX9_07",
			"name": "Mark of the Horsemen",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Give your minions and your weapon +1/+1.",
			"type": "Spell"
		},
		{
			"artist": "Alex Alexandrov",
			"cardImage": "OG_047a.png",
			"cost": 0,
			"fr": {
				"name": "Production d’aiguillons",
				"text": "Donne +4 ATQ à votre héros pendant ce tour."
			},
			"id": "OG_047a",
			"name": "Evolve Spines",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"text": "Give your hero +4 Attack this turn.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_29.png",
			"cost": 0,
			"fr": {
				"name": "L’Œil",
				"text": "<b>Choisissez un chemin !</b>"
			},
			"id": "LOEA04_29",
			"name": "The Eye",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Choose Your Path!</b>",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA10_5H.png",
			"cost": 3,
			"fr": {
				"name": "Mrgl mrgl niah niah !",
				"text": "Invoque 5 murlocs détruits pendant cette partie."
			},
			"id": "LOEA10_5H",
			"name": "Mrgl Mrgl Nyah Nyah",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Loe",
			"text": "Summon 5 Murlocs that died this game.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "FP1_012t.png",
			"cost": 1,
			"fr": {
				"name": "Gelée",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "FP1_012t",
			"name": "Slime",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_16.png",
			"cost": 0,
			"fr": {
				"name": "Fouilles",
				"text": "Trouve un artéfact."
			},
			"id": "LOEA16_16",
			"name": "Rummage",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Find an artifact.",
			"type": "Hero_power"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_160b.png",
			"cost": 0,
			"fr": {
				"name": "Chef de la meute",
				"text": "Donne à vos serviteurs +1/+1."
			},
			"id": "EX1_160b",
			"name": "Leader of the Pack",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Give your minions +1/+1.",
			"type": "Spell"
		},
		{
			"artist": "L. Lullabi & Nutchapol ",
			"attack": 2,
			"cardImage": "OG_327.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Tentacule remuant",
				"text": "<b>Provocation</b>"
			},
			"health": 4,
			"id": "OG_327",
			"name": "Squirming Tentacle",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Taunt</b>",
			"type": "Minion"
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
			"artist": "Nutchapol Thitinunthakorn",
			"cardImage": "PART_001.png",
			"cost": 1,
			"fr": {
				"name": "Plaque d’armure",
				"text": "Donne +1 PV à un serviteur."
			},
			"id": "PART_001",
			"name": "Armor Plating",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Give a minion +1 Health.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_103e2.png",
			"fr": {
				"name": "Charge",
				"text": "+2 ATQ et <b>Charge</b>."
			},
			"id": "CS2_103e2",
			"name": "Charge",
			"playerClass": "Warrior",
			"set": "Core",
			"text": "+2 Attack and <b>Charge</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA17_3.png",
			"fr": {
				"name": "Onyxia"
			},
			"health": 15,
			"id": "BRMA17_3",
			"name": "Onyxia",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "AT_016e.png",
			"fr": {
				"name": "Confus",
				"text": "Attaque et Vie échangées."
			},
			"id": "AT_016e",
			"name": "Confused",
			"playerClass": "Priest",
			"set": "Tgt",
			"text": "Swapped Attack and Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Dany Orizio",
			"attack": 2,
			"cardImage": "GVG_059.png",
			"collectible": true,
			"cost": 3,
			"durability": 3,
			"fr": {
				"name": "Rouage-marteau",
				"text": "<b>Cri de guerre :</b> donne <b>Bouclier divin</b> et <b>Provocation</b> à un serviteur allié aléatoire."
			},
			"id": "GVG_059",
			"name": "Coghammer",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Give a random friendly minion <b>Divine Shield</b> and <b>Taunt</b>.",
			"type": "Weapon"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 9,
			"cardImage": "GVG_116.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Mekgénieur Thermojoncteur",
				"text": "Chaque fois qu’un serviteur adverse meurt, invoque un gnome lépreux."
			},
			"health": 7,
			"id": "GVG_116",
			"name": "Mekgineer Thermaplugg",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "Whenever an enemy minion dies, summon a Leper Gnome.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "GVG_094.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Jeeves",
				"text": "À la fin du tour d’un joueur, ce dernier pioche jusqu’à avoir 3 cartes."
			},
			"health": 4,
			"id": "GVG_094",
			"name": "Jeeves",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "At the end of each player's turn, that player draws until they have 3 cards.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "BRMA10_6.png",
			"cost": 1,
			"durability": 5,
			"fr": {
				"name": "Griffes de Tranchetripe",
				"text": "Gagne +1 ATQ chaque fois qu’un œuf corrompu est détruit."
			},
			"id": "BRMA10_6",
			"name": "Razorgore's Claws",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Whenever a Corrupted Egg dies, gain +1 Attack.",
			"type": "Weapon"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 1,
			"cardImage": "KAR_069.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Fieffé forban",
				"text": "<b>Cri de guerre_:</b> ajoute une carte de classe aléatoire dans votre main <i>(de la classe de votre adversaire).</i>"
			},
			"health": 1,
			"id": "KAR_069",
			"name": "Swashburglar",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Add a random class card to your hand <i>(from your opponent's class).</i>",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_412.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Worgen déchaîné",
				"text": "<b>Accès de rage :</b> <b>Furie des vents</b> et +1 ATQ"
			},
			"health": 3,
			"id": "EX1_412",
			"name": "Raging Worgen",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Enrage:</b> <b>Windfury</b> and +1 Attack",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_625.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Forme d’Ombre",
				"text": "Transforme votre pouvoir héroïque, qui inflige 2 points de dégâts. Si la forme d’Ombre est déjà adoptée : 3 points de dégâts."
			},
			"id": "EX1_625",
			"name": "Shadowform",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Your Hero Power becomes 'Deal 2 damage'. If already in Shadowform: 3 damage.",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "NAX15_03t.png",
			"cost": 4,
			"fr": {
				"name": "Garde de la Couronne de glace",
				"text": "<b>Provocation</b>"
			},
			"health": 5,
			"id": "NAX15_03t",
			"name": "Guardian of Icecrown",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "Mekka2.png",
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Robot réparateur",
				"text": "À la fin de votre tour, rend 6 PV à un personnage blessé."
			},
			"health": 3,
			"id": "Mekka2",
			"name": "Repair Bot",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Promo",
			"text": "At the end of your turn, restore 6 Health to a damaged character.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA01_02h.png",
			"cost": 0,
			"fr": {
				"name": "Bénédictions du soleil",
				"text": "<b>Pouvoir héroïque passif</b>\nPhaerix est <b>Insensible</b> tant qu’il contrôle la baguette du Soleil."
			},
			"id": "LOEA01_02h",
			"name": "Blessings of the Sun",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\n Phaerix is <b>Immune</b> while he controls the Rod of the Sun.",
			"type": "Hero_power"
		},
		{
			"artist": "Hideaki Takamura",
			"attack": 3,
			"cardImage": "AT_066.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Aspirant d’Orgrimmar",
				"text": "<b>Exaltation :</b> confère +1 ATQ à votre arme."
			},
			"health": 3,
			"id": "AT_066",
			"name": "Orgrimmar Aspirant",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Give your weapon +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_003.png",
			"cost": 0,
			"fr": {
				"name": "Restore 1",
				"text": "Restore 1 Health to a character."
			},
			"id": "XXX_003",
			"name": "Restore 1",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Restore 1 Health to a character.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA14_2.png",
			"cost": 2,
			"fr": {
				"name": "Activer Arcanotron",
				"text": "<b>Pouvoir héroïque</b>\nActive Arcanotron !"
			},
			"id": "BRMA14_2",
			"name": "Activate Arcanotron",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nActivate Arcanotron!",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_RMC_001.png",
			"fr": {
				"name": "TB_EnchRandomManaCost"
			},
			"id": "TB_RMC_001",
			"name": "TB_EnchRandomManaCost",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_063a.png",
			"fr": {
				"name": "Vindicte",
				"text": "Attaque augmentée."
			},
			"id": "GVG_063a",
			"name": "Retribution",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Increased Attack",
			"type": "Enchantment"
		},
		{
			"artist": "Konstantin Turovec",
			"cardImage": "KAR_A02_13.png",
			"cost": 0,
			"fr": {
				"name": "Vous êtes notre invité",
				"text": "<b>Pouvoir héroïque</b>\nInvoque une assiette 1/1."
			},
			"id": "KAR_A02_13",
			"name": "Be Our Guest",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Plate.",
			"type": "Hero_power"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA09_1H.png",
			"fr": {
				"name": "Rend Main-Noire"
			},
			"health": 30,
			"id": "BRMA09_1H",
			"name": "Rend Blackhand",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Greg Hildebrandt",
			"attack": 1,
			"cardImage": "EX1_402.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Fabricante d’armures",
				"text": "Chaque fois qu’un serviteur allié subit des dégâts, vous gagnez 1 point d’armure."
			},
			"health": 4,
			"id": "EX1_402",
			"name": "Armorsmith",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Whenever a friendly minion takes damage, gain 1 Armor.",
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
				"name": "Inventrice gnome",
				"text": "<b>Cri de guerre :</b> vous piochez une carte."
			},
			"health": 4,
			"id": "CS2_147",
			"name": "Gnomish Inventor",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "AT_035.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Embusqué",
				"text": "Place 3 cartes Embuscade ! dans le deck de votre adversaire. À chaque fois qu’il en pioche une, vous invoquez un nérubien 4/4."
			},
			"id": "AT_035",
			"name": "Beneath the Grounds",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Shuffle 3 Ambushes into your opponent's deck. When drawn, you summon a 4/4 Nerubian.",
			"type": "Spell"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 4,
			"cardImage": "AT_119.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Écumeur kvaldir",
				"text": "<b>Exaltation :</b> gagne +2/+2."
			},
			"health": 4,
			"id": "AT_119",
			"name": "Kvaldir Raider",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Gain +2/+2.",
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
			"artist": "James Ryman",
			"attack": 7,
			"cardImage": "OG_121.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Cho’gall",
				"text": "<b>Cri de guerre :</b> le prochain sort que vous lancez ce tour coûte des points de vie plutôt que des cristaux de mana."
			},
			"health": 7,
			"id": "OG_121",
			"name": "Cho'gall",
			"playerClass": "Warlock",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Battlecry:</b> The next spell you cast this turn costs Health instead of Mana.",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 7,
			"cardImage": "KAR_097.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Medivh, le Gardien",
				"text": "<b>Cri de guerre_:</b> vous équipe d’Atiesh, grand bâton du Gardien."
			},
			"health": 7,
			"id": "KAR_097",
			"name": "Medivh, the Guardian",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Equip Atiesh, Greatstaff of the Guardian.",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_036e.png",
			"fr": {
				"name": "Cri de commandement",
				"text": "Ne peut pas avoir moins de 1 PV pendant ce tour."
			},
			"id": "NEW1_036e",
			"name": "Commanding Shout",
			"playerClass": "Warrior",
			"set": "Expert1",
			"text": "Can't be reduced below 1 Health this turn.",
			"type": "Enchantment"
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
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "BRM_002.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Attise-flammes",
				"text": "Après que vous avez lancé un sort, inflige 2 points de dégâts répartis de façon aléatoire entre tous les adversaires."
			},
			"health": 4,
			"id": "BRM_002",
			"name": "Flamewaker",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Brm",
			"text": "After you cast a spell, deal 2 damage randomly split among all enemies.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "AT_036t.png",
			"cost": 4,
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
			"artist": "Zoltan Boros",
			"attack": 4,
			"cardImage": "OG_290.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Ancien héraut",
				"text": "Au début de votre tour, place un serviteur coûtant 10 cristaux de mana de votre deck dans votre main."
			},
			"health": 6,
			"id": "OG_290",
			"name": "Ancient Harbinger",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Og",
			"text": "At the start of your turn, put a 10-Cost minion from your deck into your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA07_2_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "MOI TOUT CASSER",
				"text": "<b>Pouvoir héroïque</b>\nDétruit un serviteur adverse aléatoire."
			},
			"id": "BRMA07_2_2_TB",
			"name": "ME SMASH",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nDestroy a random enemy minion.",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_607e.png",
			"fr": {
				"name": "Rage intérieure",
				"text": "+2 Attaque."
			},
			"id": "EX1_607e",
			"name": "Inner Rage",
			"playerClass": "Warrior",
			"set": "Expert1",
			"text": "+2 Attack.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Raven Mimura",
			"cardImage": "EX1_294.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Entité miroir",
				"text": "<b>Secret :</b> une fois que votre adversaire a joué un serviteur, en invoque une copie."
			},
			"id": "EX1_294",
			"name": "Mirror Entity",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Secret:</b> After your opponent plays a minion, summon a copy of it.",
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
				"name": "Glaivezooka",
				"text": "<b>Cri de guerre :</b> donne +1 ATQ à un serviteur allié aléatoire."
			},
			"id": "GVG_043",
			"name": "Glaivezooka",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Give a random friendly minion +1 Attack.",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX3_01.png",
			"fr": {
				"name": "Maexxna"
			},
			"health": 30,
			"id": "NAX3_01",
			"name": "Maexxna",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"attack": 3,
			"cardImage": "BRMA03_3H.png",
			"cost": 2,
			"fr": {
				"name": "Moira Barbe-de-Bronze",
				"text": "Thaurissan ne peut pas utiliser son pouvoir héroïque.\nN’attaque jamais de serviteurs à moins qu’ils n’aient <b>Provocation</b>."
			},
			"health": 1,
			"id": "BRMA03_3H",
			"name": "Moira Bronzebeard",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Thaurissan's Hero Power can't be used.\nNever attacks minions unless they have <b>Taunt</b>.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "OG_080ee.png",
			"fr": {
				"name": "Églantine",
				"text": "+3 ATQ."
			},
			"id": "OG_080ee",
			"name": "Briarthorn",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Phil Saunders",
			"attack": 1,
			"cardImage": "EX1_508.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Oracle sinistrécaille",
				"text": "TOUS les autres murlocs ont +1 ATQ."
			},
			"health": 1,
			"id": "EX1_508",
			"name": "Grimscale Oracle",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "ALL other Murlocs have +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_289.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Barrière de glace",
				"text": "<b>Secret :</b> quand votre héros est attaqué, il gagne 8 points d’armure."
			},
			"id": "EX1_289",
			"name": "Ice Barrier",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Secret:</b> When your hero is attacked, gain 8 Armor.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_032e.png",
			"fr": {
				"name": "Marché douteux",
				"text": "+1/+1."
			},
			"id": "AT_032e",
			"name": "Shady Deals",
			"playerClass": "Rogue",
			"set": "Tgt",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Andrew Hou",
			"attack": 2,
			"cardImage": "OG_313.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Grizzly perturbé",
				"text": "Après que vous avez invoqué un serviteur, lui donne +1/+1."
			},
			"health": 2,
			"id": "OG_313",
			"name": "Addled Grizzly",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"text": "After you summon a minion, give it +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KaraPortal_001.png",
			"cost": 3,
			"fr": {
				"name": "Portail de fête !",
				"text": "Invoque un fêtard aléatoire."
			},
			"id": "TB_KaraPortal_001",
			"name": "Party Portal!",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Tb",
			"text": "Summon a random Partygoer.",
			"type": "Spell"
		},
		{
			"artist": "Greg Staples",
			"attack": 2,
			"cardImage": "OG_318t.png",
			"cost": 2,
			"fr": {
				"name": "Gnoll",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "OG_318t",
			"name": "Gnoll",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_7_EnchMinion.png",
			"fr": {
				"name": "Destin",
				"text": "<b>Râle d’agonie_:</b> vous obtenez une carte La pièce."
			},
			"id": "TB_PickYourFate_7_EnchMinion",
			"name": "Fate",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Deathrattle:</b> Your owner gets a coin.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "AT_042t.png",
			"cost": 2,
			"fr": {
				"name": "Lion dent-de-sabre",
				"text": "<b>Charge</b>"
			},
			"health": 1,
			"id": "AT_042t",
			"name": "Sabertooth Lion",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"artist": "Mark Abadier",
			"attack": 5,
			"cardImage": "OG_207.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Invocateur sans-visage",
				"text": "<b>Cri de guerre :</b> invoque un serviteur aléatoire coûtant 3 cristaux."
			},
			"health": 5,
			"id": "OG_207",
			"name": "Faceless Summoner",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Battlecry:</b> Summon a random 3-Cost minion.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "FP1_007t.png",
			"cost": 4,
			"fr": {
				"name": "Nérubien"
			},
			"health": 4,
			"id": "FP1_007t",
			"name": "Nerubian",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "E.M. Gist",
			"cardImage": "EX1_391.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Heurtoir",
				"text": "Inflige $2 |4(point,points) de dégâts à un serviteur. Vous piochez une carte s’il survit."
			},
			"id": "EX1_391",
			"name": "Slam",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Deal $2 damage to a minion. If it survives, draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_101_H1.png",
			"cost": 2,
			"fr": {
				"name": "Renfort",
				"text": "<b>Pouvoir héroïque</b>\nInvoque une recrue de la Main d’argent 1/1."
			},
			"id": "CS2_101_H1",
			"name": "Reinforce",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Silver Hand Recruit.",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOEA09_3b.png",
			"cost": 0,
			"fr": {
				"name": "Faim",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un naga affamé 1/1."
			},
			"id": "LOEA09_3b",
			"name": "Getting Hungry",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Hungry Naga.",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA08_2H.png",
			"cost": 0,
			"fr": {
				"name": "Regard intense",
				"text": "<b>Pouvoir héroïque passif</b>\nToutes les cartes coûtent (1) |4(cristal,cristaux) de mana. Vous êtes limité à 2 cristaux et l’adversaire à 1."
			},
			"id": "BRMA08_2H",
			"name": "Intense Gaze",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Passive Hero Power</b>\nAll cards cost (1). You are capped at 2 Mana Crystals, and opponent at 1.",
			"type": "Hero_power"
		},
		{
			"cardImage": "Mekka4e.png",
			"fr": {
				"name": "Transformé",
				"text": "A été transformé en poulet !"
			},
			"id": "Mekka4e",
			"name": "Transformed",
			"playerClass": "Neutral",
			"set": "Promo",
			"text": "Has been transformed into a chicken!",
			"type": "Enchantment"
		},
		{
			"artist": "Ben Olson",
			"cardImage": "BRM_015.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Revanche",
				"text": "Inflige $1 |4(point,points) de dégâts à tous les serviteurs. Si vous avez 12 PV ou moins, inflige $3 |4(point,points) de dégâts à la place."
			},
			"id": "BRM_015",
			"name": "Revenge",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Brm",
			"text": "Deal $1 damage to all minions. If you have 12 or less Health, deal $3 damage instead.",
			"type": "Spell"
		},
		{
			"artist": "Todd Lockwood",
			"attack": 6,
			"cardImage": "BRM_031.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Chromaggus",
				"text": "Chaque fois que vous piochez une carte, en place une copie dans votre main."
			},
			"health": 8,
			"id": "BRM_031",
			"name": "Chromaggus",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "Whenever you draw a card, put another copy into your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_5_Ench.png",
			"fr": {
				"name": "Choisissez votre destin : enchantement 5"
			},
			"id": "TB_PickYourFate_5_Ench",
			"name": "Pick Your Fate 5 Ench",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Jaemin Kim",
			"cardImage": "KARA_08_03.png",
			"cost": 4,
			"fr": {
				"name": "Souffle du Néant",
				"text": "Fait passer la Vie de tous les serviteurs adverses à_1."
			},
			"id": "KARA_08_03",
			"name": "Nether Breath",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "[x]Change the Health of\nall enemy minions to 1.",
			"type": "Spell"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "LOE_119.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Armure animée",
				"text": "Votre héros ne peut pas subir plus de 1 point de dégâts à la fois."
			},
			"health": 4,
			"id": "LOE_119",
			"name": "Animated Armor",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Loe",
			"text": "Your hero can only take 1 damage at a time.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_065e.png",
			"fr": {
				"name": "Défenseur du roi",
				"text": "+1 Durabilité."
			},
			"id": "AT_065e",
			"name": "King's Defender",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+1 Durability.",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_300e.png",
			"fr": {
				"name": "Délicieux !",
				"text": "Caractéristiques augmentées."
			},
			"id": "OG_300e",
			"name": "Tasty!",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_034_H1.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu",
				"text": "<b>Pouvoir héroïque</b>\nInflige $1 point de dégâts."
			},
			"id": "CS2_034_H1",
			"name": "Fireblast",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nDeal $1 damage.",
			"type": "Hero_power"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_23H.png",
			"cost": 10,
			"fr": {
				"name": "Seigneur Ondulance",
				"text": "À la fin de votre tour, invoque un Naga affamé 1/1 pour chaque serviteur adverse."
			},
			"health": 10,
			"id": "LOEA16_23H",
			"name": "Lord Slitherspear",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, summon 1/1 Hungry Naga for each enemy minion.",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "AT_051.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Destruction élémentaire",
				"text": "Inflige $4 à $5 points\nde dégâts à tous les serviteurs.\n<b>Surcharge :</b> (5)"
			},
			"id": "AT_051",
			"name": "Elemental Destruction",
			"overload": 5,
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Deal $4-$5 damage to all minions. <b>Overload:</b> (5),",
			"type": "Spell"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 3,
			"cardImage": "OG_080.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Xaril l’Esprit empoisonné",
				"text": "<b>Cri de guerre et Râle d’agonie :</b> ajoute une carte Toxine aléatoire dans votre main."
			},
			"health": 2,
			"id": "OG_080",
			"name": "Xaril, Poisoned Mind",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Battlecry and Deathrattle:</b> Add a random Toxin card to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_090e.png",
			"fr": {
				"name": "Puissance du singe",
				"text": "+1/+1."
			},
			"id": "AT_090e",
			"name": "Might of the Monkey",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "NEW1_026t.png",
			"cost": 1,
			"fr": {
				"name": "Apprenti pourpre"
			},
			"health": 1,
			"id": "NEW1_026t",
			"name": "Violet Apprentice",
			"playerClass": "Neutral",
			"set": "Expert1",
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
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Spell"
		},
		{
			"cardImage": "TU4c_006.png",
			"cost": 1,
			"fr": {
				"name": "Banane",
				"text": "Confère +1/+1 à un serviteur allié. <i>(+1 ATQ / +1 PV)</i>"
			},
			"id": "TU4c_006",
			"name": "Bananas",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "Give a friendly minion +1/+1. <i>(+1 Attack/+1 Health)</i>",
			"type": "Spell"
		},
		{
			"artist": "Warren Mahy",
			"attack": 2,
			"cardImage": "GVG_075.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Canon du navire",
				"text": "Après avoir invoqué un pirate, inflige 2 points de dégâts à un adversaire aléatoire."
			},
			"health": 3,
			"id": "GVG_075",
			"name": "Ship's Cannon",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "After you summon a Pirate, deal 2 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"attack": 5,
			"cardImage": "OG_302.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Passeuse d’âmes",
				"text": "Chaque fois qu’un serviteur allié meurt, donne +1/+1 à votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 6,
			"id": "OG_302",
			"name": "Usher of Souls",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Og",
			"text": "Whenever a friendly minion dies, give your C'Thun +1/+1\n<i>(wherever it is).</i>",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_08_02eH.png",
			"fr": {
				"name": "Rage du Néant",
				"text": "+8 ATQ."
			},
			"id": "KARA_08_02eH",
			"name": "Nether Rage",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "+8 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_10_EnchMinion.png",
			"fr": {
				"name": "Bonus",
				"text": "Vos serviteurs avec <b>Cri de guerre</b> ont +1/+1."
			},
			"id": "TB_PickYourFate_10_EnchMinion",
			"name": "Bonus",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Your <b>Battlecry</b> minions have +1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 3,
			"cardImage": "OG_202.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gardien du bourbier",
				"text": "<b>Choix des armes :</b> invoque une gelée 2/2 ou confère un cristal de mana vide."
			},
			"health": 3,
			"id": "OG_202",
			"name": "Mire Keeper",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"text": "[x]<b>Choose One -</b>Summon a\n2/2 Slime; or Gain an\nempty Mana Crystal.",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_014e.png",
			"fr": {
				"name": "Rage puissante",
				"text": "+3/+3."
			},
			"id": "BRM_014e",
			"name": "Power Rager",
			"playerClass": "Hunter",
			"set": "Brm",
			"text": "+3/+3",
			"type": "Enchantment"
		},
		{
			"cardImage": "KARA_12_03H.png",
			"cost": 3,
			"fr": {
				"name": "Couronne de flammes",
				"text": "<b>Secret_:</b> quand un adversaire attaque, inflige 10_points de dégâts à tous les autres ennemis."
			},
			"id": "KARA_12_03H",
			"name": "Flame Wreath",
			"playerClass": "Mage",
			"set": "Kara",
			"text": "<b>Secret:</b> When an enemy attacks, deal 10 damage to all other enemies.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_034_H2_AT_132.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu rang 2",
				"text": "<b>Pouvoir héroïque</b>\nInflige $2 points de dégâts."
			},
			"id": "CS2_034_H2_AT_132",
			"name": "Fireblast Rank 2",
			"playerClass": "Mage",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nDeal $2 damage.",
			"type": "Hero_power"
		},
		{
			"artist": "Tom Baxa",
			"cardImage": "EX1_316.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Puissance accablante",
				"text": "Confère +4/+4 à un serviteur allié jusqu’à la fin du tour. Puis il meurt. De façon horrible."
			},
			"id": "EX1_316",
			"name": "Power Overwhelming",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Give a friendly minion +4/+4 until end of turn. Then, it dies. Horribly.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Dan Brereton",
			"attack": 4,
			"cardImage": "DS1_070.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Maître-chien",
				"text": "<b>Cri de guerre :</b> confère +2/+2 et <b>Provocation</b> à une Bête alliée."
			},
			"health": 3,
			"id": "DS1_070",
			"name": "Houndmaster",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Battlecry:</b> Give a friendly Beast +2/+2 and <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 3,
			"cardImage": "KAR_710.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Forge-Arcanes",
				"text": "<b>Cri de guerre_:</b> invoque un serviteur 0/5 avec <b>Provocation</b>."
			},
			"health": 2,
			"id": "KAR_710",
			"name": "Arcanosmith",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Summon a 0/5 minion with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "James Zhang",
			"attack": 3,
			"cardImage": "AT_058.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Elekk du roi",
				"text": "<b>Cri de guerre :</b> révèle un serviteur de chaque deck. Si le vôtre coûte plus, vous le piochez."
			},
			"health": 2,
			"id": "AT_058",
			"name": "King's Elekk",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, draw it.",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 0,
			"cardImage": "KAR_710m.png",
			"cost": 2,
			"fr": {
				"name": "Bouclier animé",
				"text": "<b>Provocation</b>"
			},
			"health": 5,
			"id": "KAR_710m",
			"name": "Animated Shield",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Anton Kagounkin",
			"attack": 2,
			"cardImage": "OG_249a.png",
			"cost": 2,
			"fr": {
				"name": "Gelée"
			},
			"health": 2,
			"id": "OG_249a",
			"name": "Slime",
			"playerClass": "Neutral",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_236e.png",
			"fr": {
				"name": "Esprit divin",
				"text": "Les points de vie de ce serviteur sont doublés."
			},
			"id": "CS2_236e",
			"name": "Divine Spirit",
			"playerClass": "Priest",
			"set": "Core",
			"text": "This minion has double Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA14_6H.png",
			"cost": 4,
			"fr": {
				"name": "Activer Électron",
				"text": "<b>Pouvoir héroïque</b>\nActive Électron !"
			},
			"id": "BRMA14_6H",
			"name": "Activate Electron",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nActivate Electron!",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA_01.png",
			"cost": 3,
			"fr": {
				"name": "Cœur-de-flammes",
				"text": "Vous piochez 2 cartes.\nVous confère 4 points d’armure."
			},
			"id": "BRMA_01",
			"name": "Flameheart",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Draw 2 cards.\nGain 4 Armor.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_246e.png",
			"fr": {
				"name": "Maléficié",
				"text": "Ce serviteur a été transformé !"
			},
			"id": "EX1_246e",
			"name": "Hexxed",
			"playerClass": "Shaman",
			"set": "Core",
			"text": "This minion has been transformed!",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA15_1.png",
			"fr": {
				"name": "Rafaam"
			},
			"health": 30,
			"id": "LOEA15_1",
			"name": "Rafaam",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Michael Sutfin",
			"cardImage": "CS2_072.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Attaque sournoise",
				"text": "Inflige $2 |4(point,points) de dégâts à un serviteur indemne."
			},
			"id": "CS2_072",
			"name": "Backstab",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $2 damage to an undamaged minion.",
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
				"name": "Fusilier de Forgefer",
				"text": "<b>Cri de guerre :</b> inflige 1 point de dégâts."
			},
			"health": 2,
			"id": "CS2_141",
			"name": "Ironforge Rifleman",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Deal 1 damage.",
			"type": "Minion"
		},
		{
			"artist": "Nutthapon Petchthai",
			"attack": 4,
			"cardImage": "AT_122.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gormok l’Empaleur",
				"text": "<b>Cri de guerre :</b> inflige\n4 points de dégâts si vous avez au moins\n4 autres serviteurs."
			},
			"health": 4,
			"id": "AT_122",
			"name": "Gormok the Impaler",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> If you have at least 4 other minions, deal 4 damage.",
			"type": "Minion"
		},
		{
			"cardImage": "FP1_005e.png",
			"fr": {
				"name": "Consumer",
				"text": "Caractéristiques augmentées."
			},
			"id": "FP1_005e",
			"name": "Consume",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "CS2_104.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Saccager",
				"text": "Confère +3/+3 à un serviteur blessé."
			},
			"id": "CS2_104",
			"name": "Rampage",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Give a damaged minion +3/+3.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX12_01.png",
			"fr": {
				"name": "Gluth"
			},
			"health": 30,
			"id": "NAX12_01",
			"name": "Gluth",
			"playerClass": "Neutral",
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
				"name": "Élue de C’Thun",
				"text": "<b>Bouclier divin</b>. <b>Cri de\nguerre :</b> donne +2/+2 à votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 2,
			"id": "OG_283",
			"name": "C'Thun's Chosen",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "[x]<b>Divine Shield</b>\n<b>Battlecry:</b> Give your C'Thun\n+2/+2 <i>(wherever it is).</i>",
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
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "EX1_062.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Vieux Troublœil",
				"text": "<b>Charge</b>. A +1 ATQ pour chaque autre murloc sur le champ de bataille."
			},
			"health": 4,
			"id": "EX1_062",
			"name": "Old Murk-Eye",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Reward",
			"text": "<b>Charge</b>. Has +1 Attack for each other Murloc on the battlefield.",
			"type": "Minion"
		},
		{
			"artist": "Zero Yue",
			"attack": 2,
			"cardImage": "GVG_091.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Annulateur d’Arcane X-21",
				"text": "<b>Provocation</b>\nNe peut pas être la cible de sorts ou de pouvoirs héroïques."
			},
			"health": 5,
			"id": "GVG_091",
			"name": "Arcane Nullifier X-21",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Taunt</b>\nCan't be targeted by spells or Hero Powers.",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_020e.png",
			"fr": {
				"name": "Puissance draconique",
				"text": "Caractéristiques augmentées."
			},
			"id": "BRM_020e",
			"name": "Draconic Power",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMC_93.png",
			"cost": 3,
			"fr": {
				"name": "Système de défense Omnitron",
				"text": "Active un Tron aléatoire."
			},
			"id": "BRMC_93",
			"name": "Omnotron Defense System",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Summon a random Tron.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA06_2.png",
			"cost": 2,
			"fr": {
				"name": "Le chambellan",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un acolyte attise-flammes 1/3."
			},
			"id": "BRMA06_2",
			"name": "The Majordomo",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon a 1/3 Flamewaker Acolyte.",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_319.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Diablotin des flammes",
				"text": "<b>Cri de guerre :</b> inflige 3 points de dégâts à votre héros."
			},
			"health": 2,
			"id": "EX1_319",
			"name": "Flame Imp",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Deal 3 damage to your hero.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA10_2H.png",
			"cost": 0,
			"fr": {
				"name": "Mrglmrgl MRGL !",
				"text": "<b>Pouvoir héroïque</b>\nPioche deux cartes."
			},
			"id": "LOEA10_2H",
			"name": "Mrglmrgl MRGL!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\nDraw 2 cards.",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Pascenko",
			"attack": 5,
			"cardImage": "AT_039.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Combattant sauvage",
				"text": "<b>Exaltation :</b> donne +2 ATQ\nà votre héros pendant ce tour."
			},
			"health": 4,
			"id": "AT_039",
			"name": "Savage Combatant",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Give your hero\n+2 Attack this turn.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA09_5H.png",
			"cost": 4,
			"fr": {
				"name": "Pied à terre",
				"text": "<b>Pouvoir héroïque</b>\nInvoque Gyth. Change de pouvoir héroïque."
			},
			"id": "BRMA09_5H",
			"name": "Dismount",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon Gyth. Get a new Hero Power.",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "GVG_090.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Bombardier cinglé",
				"text": "<b>Cri de guerre :</b> inflige 6 points de dégâts répartis de façon aléatoire entre tous les autres personnages."
			},
			"health": 4,
			"id": "GVG_090",
			"name": "Madder Bomber",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Deal 6 damage randomly split between all other characters.",
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
				"name": "Protectrice solfurie",
				"text": "<b>Cri de guerre :</b> confère <b>Provocation</b> aux serviteurs adjacents."
			},
			"health": 3,
			"id": "EX1_058",
			"name": "Sunfury Protector",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give adjacent minions <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX6_02.png",
			"cost": 2,
			"fr": {
				"name": "Aura nécrotique",
				"text": "<b>Pouvoir héroïque</b>\nInflige 3 points de dégâts au héros adverse."
			},
			"id": "NAX6_02",
			"name": "Necrotic Aura",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDeal 3 damage to the enemy hero.",
			"type": "Hero_power"
		},
		{
			"artist": "Doug Alexander",
			"cardImage": "EX1_169.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Innervation",
				"text": "Vous gagnez 2 cristaux de mana pour ce tour uniquement."
			},
			"id": "EX1_169",
			"name": "Innervate",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"text": "Gain 2 Mana Crystals this turn only.",
			"type": "Spell"
		},
		{
			"artist": "Leo Che",
			"cardImage": "EX1_275.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Cône de froid",
				"text": "<b>Gèle</b> et inflige $1 |4(point,points) de dégâts à un serviteur et ceux à côté de lui."
			},
			"id": "EX1_275",
			"name": "Cone of Cold",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Freeze</b> a minion and the minions next to it, and deal $1 damage to them.",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"attack": 4,
			"cardImage": "FP1_021.png",
			"collectible": true,
			"cost": 4,
			"durability": 2,
			"fr": {
				"name": "Morsure de la mort",
				"text": "<b>Râle d’agonie :</b> inflige 1 point de dégâts à tous les serviteurs."
			},
			"id": "FP1_021",
			"name": "Death's Bite",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Deal 1 damage to all minions.",
			"type": "Weapon"
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
			"cardImage": "CS2_092e.png",
			"fr": {
				"name": "Bénédiction des rois",
				"text": "+4/+4."
			},
			"id": "CS2_092e",
			"name": "Blessing of Kings",
			"playerClass": "Paladin",
			"set": "Core",
			"text": "+4/+4.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA08_1H.png",
			"fr": {
				"name": "Général Drakkisath"
			},
			"health": 50,
			"id": "BRMA08_1H",
			"name": "General Drakkisath",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "DREAM_04.png",
			"cost": 0,
			"fr": {
				"name": "Rêve",
				"text": "Renvoie un serviteur dans la main de son propriétaire."
			},
			"id": "DREAM_04",
			"name": "Dream",
			"playerClass": "Dream",
			"set": "Expert1",
			"text": "Return a minion to its owner's hand.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_057.png",
			"cost": 0,
			"fr": {
				"name": "Destroy Target Secrets",
				"text": "Choose a hero. Destroy all <b>Secrets</b> controlled by that hero."
			},
			"id": "XXX_057",
			"name": "Destroy Target Secrets",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Choose a hero. Destroy all <b>Secrets</b> controlled by that hero.",
			"type": "Spell"
		},
		{
			"artist": "Kev Walker",
			"attack": 4,
			"cardImage": "CS2_150.png",
			"collectible": true,
			"cost": 5,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Commando foudrepique",
				"text": "<b>Cri de guerre :</b> inflige 2 points de dégâts."
			},
			"health": 2,
			"id": "CS2_150",
			"name": "Stormpike Commando",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Deal 2 damage.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 1,
			"cardImage": "OG_272.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Invocateur du Crépuscule",
				"text": "<b>Râle d’agonie :</b> invoque un destructeur\nsans-visage 5/5."
			},
			"health": 1,
			"id": "OG_272",
			"name": "Twilight Summoner",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Summon a 5/5 Faceless Destroyer.",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"cardImage": "KAR_004.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Surprise du chef",
				"text": "<b>Secret_:</b> après que votre adversaire a lancé un sort, invoque une panthère 4/2_avec <b>Camouflage</b>."
			},
			"id": "KAR_004",
			"name": "Cat Trick",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Kara",
			"text": "<b>Secret:</b> After your opponent casts a spell, summon a 4/2 Panther with <b>Stealth</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_021.png",
			"cost": 0,
			"fr": {
				"name": "Restore All Health",
				"text": "Restore all Health to a character."
			},
			"id": "XXX_021",
			"name": "Restore All Health",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Restore all Health to a character.",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "EX1_finkle.png",
			"cost": 3,
			"fr": {
				"name": "Finkle Einhorn"
			},
			"health": 3,
			"id": "EX1_finkle",
			"name": "Finkle Einhorn",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Mark Gibbons",
			"attack": 1,
			"cardImage": "EX1_597.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maître des diablotins",
				"text": "À la fin de votre tour, ce serviteur subit 1 point de dégâts et invoque un diablotin 1/1."
			},
			"health": 5,
			"id": "EX1_597",
			"name": "Imp Master",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "At the end of your turn, deal 1 damage to this minion and summon a 1/1 Imp.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_FactionWar_Boss_Rag.png",
			"cost": 2,
			"fr": {
				"name": "MEURS, INSECTE !",
				"text": "<b>Pouvoir héroïque</b>\nInflige $8 points de dégâts à un adversaire aléatoire."
			},
			"id": "TB_FactionWar_Boss_Rag",
			"name": "DIE, INSECT!",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nDeal $8 damage to random enemy.",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_155ae.png",
			"fr": {
				"name": "Marque de la nature",
				"text": "Ce serviteur a +4 ATQ."
			},
			"id": "EX1_155ae",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "This minion has +4 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX2_01H.png",
			"fr": {
				"name": "Grande veuve Faerlina"
			},
			"health": 45,
			"id": "NAX2_01H",
			"name": "Grand Widow Faerlina",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA09_7e.png",
			"fr": {
				"name": "Chaudron"
			},
			"id": "LOEA09_7e",
			"name": "Cauldron",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_FactionWar_Boss_RagFirst.png",
			"cost": 2,
			"fr": {
				"name": "Le chambellan",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un acolyte attise-flammes 1/3."
			},
			"id": "TB_FactionWar_Boss_RagFirst",
			"name": "The Majordomo",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nSummon a 1/3 Flamewaker Acolyte.",
			"type": "Hero_power"
		},
		{
			"artist": "Greg Staples",
			"attack": 4,
			"cardImage": "AT_086.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Saboteur",
				"text": "<b>Cri de guerre :</b> le pouvoir héroïque de votre adversaire coûte (5) cristaux de plus au tour suivant."
			},
			"health": 3,
			"id": "AT_086",
			"name": "Saboteur",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Your opponent's Hero Power costs (5) more next turn.",
			"type": "Minion"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 3,
			"cardImage": "BRM_012.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Destructeur garde du feu",
				"text": "<b>Cri de guerre :</b> gagne 1 à 4 points d’Attaque. <b>Surcharge :</b> (1)"
			},
			"health": 6,
			"id": "BRM_012",
			"name": "Fireguard Destroyer",
			"overload": 1,
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Brm",
			"text": "<b>Battlecry:</b> Gain 1-4 Attack. <b>Overload:</b> (1)",
			"type": "Minion"
		},
		{
			"artist": "John Polidora",
			"attack": 2,
			"cardImage": "EX1_567.png",
			"collectible": true,
			"cost": 5,
			"durability": 8,
			"fr": {
				"name": "Marteau-du-Destin",
				"text": "<b>Furie des vents\nSurcharge :</b> (2)"
			},
			"id": "EX1_567",
			"name": "Doomhammer",
			"overload": 2,
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Windfury, Overload:</b> (2)",
			"type": "Weapon"
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
			"cardImage": "EX1_043e.png",
			"fr": {
				"name": "Heure du Crépuscule",
				"text": "Vie augmentée."
			},
			"id": "EX1_043e",
			"name": "Hour of Twilight",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Increased Health.",
			"type": "Enchantment"
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
			"attack": 5,
			"cardImage": "NAX4_03H.png",
			"cost": 5,
			"fr": {
				"name": "Squelette"
			},
			"health": 5,
			"id": "NAX4_03H",
			"name": "Skeleton",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_101e.png",
			"fr": {
				"name": "Pur",
				"text": "Caractéristiques augmentées."
			},
			"id": "GVG_101e",
			"name": "Pure",
			"playerClass": "Paladin",
			"set": "Gvg",
			"text": "Increased Stats.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "NAX9_05H.png",
			"cost": 3,
			"durability": 3,
			"fr": {
				"name": "Lame runique",
				"text": "A +6 ATQ si les autres cavaliers sont morts."
			},
			"id": "NAX9_05H",
			"name": "Runeblade",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Has +6 Attack if the other Horsemen are dead.",
			"type": "Weapon"
		},
		{
			"artist": "Evgeniy Zaqumyenny",
			"attack": 2,
			"cardImage": "KARA_00_08.png",
			"cost": 2,
			"fr": {
				"name": "Apprenti de l’archimage",
				"text": "Chaque fois que vous lancez un sort, en place une copie dans votre deck."
			},
			"health": 4,
			"id": "KARA_00_08",
			"name": "Archmage's Apprentice",
			"playerClass": "Mage",
			"set": "Kara",
			"text": "Whenever you cast a spell, shuffle a copy of it into your deck.",
			"type": "Minion"
		},
		{
			"artist": "Jerry Mascho",
			"attack": 1,
			"cardImage": "OG_006.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Inquisiteur Aileron noir",
				"text": "<b>Cri de guerre :</b> votre pouvoir héroïque devient « Invoque un murloc 1/1 »."
			},
			"health": 3,
			"id": "OG_006",
			"name": "Vilefin Inquisitor",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Battlecry:</b> Your Hero Power becomes 'Summon a   1/1 Murloc.'",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA02_2_2c_TB.png",
			"cost": 0,
			"fr": {
				"name": "Foule moqueuse",
				"text": "Invoque un spectateur 1/1 avec <b>Provocation</b>."
			},
			"id": "BRMA02_2_2c_TB",
			"name": "Jeering Crowd",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Summon a 1/1 Spectator with <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"artist": "Daria Tuzova",
			"attack": 1,
			"cardImage": "OG_123.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Déphaseur Zerus",
				"text": "Chaque tour où cette carte est dans votre main, la transforme en un serviteur aléatoire."
			},
			"health": 1,
			"id": "OG_123",
			"name": "Shifter Zerus",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "Each turn this is in your hand, transform it into a random minion.",
			"type": "Minion"
		},
		{
			"artist": "Warren Mahy",
			"cardImage": "EX1_277.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Projectiles des Arcanes",
				"text": "Inflige $3 |4(point,points) de dégâts répartis de façon aléatoire entre tous les adversaires."
			},
			"id": "EX1_277",
			"name": "Arcane Missiles",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $3 damage randomly split among all enemies.",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_027p.png",
			"cost": 2,
			"fr": {
				"name": "MEURS, INSECTE !",
				"text": "<b>Pouvoir héroïque</b>\nInflige $8 points de dégâts à un adversaire aléatoire."
			},
			"id": "BRM_027p",
			"name": "DIE, INSECT!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nDeal $8 damage to a random enemy.",
			"type": "Hero_power"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 4,
			"cardImage": "EX1_110.png",
			"collectible": true,
			"cost": 6,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Cairne Sabot-de-Sang",
				"text": "<b>Râle d’agonie :</b> invoque Baine Sabot-de-Sang avec 4/5."
			},
			"health": 5,
			"id": "EX1_110",
			"name": "Cairne Bloodhoof",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Deathrattle:</b> Summon a 4/5 Baine Bloodhoof.",
			"type": "Minion"
		},
		{
			"artist": "Nate Bowden",
			"attack": 3,
			"cardImage": "FP1_012.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Crache-vase",
				"text": "<b>Provocation.\nRâle d’agonie :</b> invoque une gelée 1/2 avec <b>Provocation</b>."
			},
			"health": 5,
			"id": "FP1_012",
			"name": "Sludge Belcher",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Naxx",
			"text": "<b>Taunt\nDeathrattle:</b> Summon a 1/2 Slime with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_06a.png",
			"cost": 0,
			"fr": {
				"name": "Franchir d’un bond",
				"text": "Subit aléatoirement 10 points de dégâts ou aucun."
			},
			"id": "LOEA04_06a",
			"name": "Swing Across",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Take 10 damage or no damage, at random.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "TBST_003.png",
			"cost": 1,
			"fr": {
				"name": "Soigneur débutant",
				"text": "À la fin de votre tour, rend 2 PV aux serviteurs adjacents."
			},
			"health": 1,
			"id": "TBST_003",
			"name": "OLDN3wb Healer",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "At the end of your turn, heal 2 damage from adjacent minions.",
			"type": "Minion"
		},
		{
			"artist": "Andrew Hou",
			"cardImage": "OG_006b.png",
			"cost": 2,
			"fr": {
				"name": "La marée d’argent",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un murloc de la Main d’argent 1/1."
			},
			"id": "OG_006b",
			"name": "The Tidal Hand",
			"playerClass": "Paladin",
			"set": "Og",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Silver Hand Murloc.",
			"type": "Hero_power"
		},
		{
			"artist": "Sean McNally",
			"attack": 3,
			"cardImage": "AT_049.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Vaillant des Pitons-du-Tonnerre",
				"text": "<b>Exaltation :</b> donne +2 ATQ à vos totems."
			},
			"health": 6,
			"id": "AT_049",
			"name": "Thunder Bluff Valiant",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Give your Totems +2 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_158e.png",
			"fr": {
				"name": "Âme de la forêt",
				"text": "Râle d’agonie : invoque un tréant 2/2."
			},
			"id": "EX1_158e",
			"name": "Soul of the Forest",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Deathrattle: Summon a 2/2 Treant.",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Brereton",
			"cardImage": "AT_037.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Racines vivantes",
				"text": "<b>Choix des armes :</b> Inflige $2 |4(point,points) de dégâts ou invoque deux arbrisseaux 1/1."
			},
			"id": "AT_037",
			"name": "Living Roots",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Choose One</b> - Deal $2 damage; or Summon two 1/1 Saplings.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_068e.png",
			"fr": {
				"name": "Renforcé",
				"text": "+2/+2."
			},
			"id": "AT_068e",
			"name": "Bolstered",
			"playerClass": "Warrior",
			"set": "Tgt",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_311e.png",
			"fr": {
				"name": "Signal d’espoir",
				"text": "+1/+1."
			},
			"id": "OG_311e",
			"name": "Beacon of Hope",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Jomaro Kindred",
			"attack": 6,
			"cardImage": "AT_132.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Justicière Cœur-Vrai",
				"text": "<b>Cri de guerre :</b> remplace votre pouvoir héroïque de départ en l’améliorant."
			},
			"health": 3,
			"id": "AT_132",
			"name": "Justicar Trueheart",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Replace your starting Hero Power with a better one.",
			"type": "Minion"
		},
		{
			"cardImage": "tt_004o.png",
			"fr": {
				"name": "Cannibalisme",
				"text": "Attaque augmentée."
			},
			"id": "tt_004o",
			"name": "Cannibalize",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Joe Wilson",
			"cardImage": "LOE_105.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Chapeau d’explorateur",
				"text": "Donne à un serviteur +1/+1 et « <b>Râle d’agonie :</b> ajoute une carte Chapeau d’explorateur dans\nvotre main. »"
			},
			"id": "LOE_105",
			"name": "Explorer's Hat",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Loe",
			"text": "Give a minion +1/+1 and \"<b>Deathrattle:</b> Add an Explorer's Hat to your hand.\"",
			"type": "Spell"
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
			"attack": 3,
			"cardImage": "OG_044c.png",
			"cost": 2,
			"fr": {
				"name": "Tigre dent-de-sabre",
				"text": "<b>Charge, Camouflage</b>"
			},
			"health": 2,
			"id": "OG_044c",
			"name": "Sabertooth Tiger",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Charge, Stealth</b>",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Weapon"
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
			"artist": "Dany Orizio",
			"cardImage": "CS2_005.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Griffe",
				"text": "Confère à votre héros +2 ATQ pendant ce tour et +2 Armure."
			},
			"id": "CS2_005",
			"name": "Claw",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"text": "Give your hero +2 Attack this turn and 2 Armor.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpBossSpell_1.png",
			"cost": 0,
			"fr": {
				"name": "Fixer des priorités",
				"text": "Inflige les dégâts de l’attaque au serviteur le plus puissant."
			},
			"id": "TB_CoOpBossSpell_1",
			"name": "Prioritize",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Deal Attack damage to biggest minion.",
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
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "TB_DecreasingCardCost.png",
			"fr": {
				"name": "TB_DecreasingCardCost"
			},
			"id": "TB_DecreasingCardCost",
			"name": "TB_DecreasingCardCost",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "A.J. Nazzaro",
			"attack": 6,
			"cardImage": "LOE_019t2.png",
			"cost": 4,
			"fr": {
				"name": "Singe doré",
				"text": "<b>Provocation</b>\n<b>Cri de guerre :</b> remplace votre main et votre deck par des serviteurs <b>légendaires</b>."
			},
			"health": 6,
			"id": "LOE_019t2",
			"name": "Golden Monkey",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Taunt</b>\n<b>Battlecry:</b> Replace your hand and deck with <b>Legendary</b> minions.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "KAR_A02_05H.png",
			"cost": 2,
			"fr": {
				"name": "Tasse",
				"text": "Les assiettes ont +3_ATQ."
			},
			"health": 2,
			"id": "KAR_A02_05H",
			"name": "Cup",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Plates have +3 Attack.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "OG_321e.png",
			"fr": {
				"name": "Puissance de la foi",
				"text": "+1/+1."
			},
			"id": "OG_321e",
			"name": "Power of Faith",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Lars Grant-West",
			"attack": 2,
			"cardImage": "DS1_178.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Rhino de la toundra",
				"text": "Vos Bêtes ont <b>Charge</b>."
			},
			"health": 5,
			"id": "DS1_178",
			"name": "Tundra Rhino",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"text": "Your Beasts have <b>Charge</b>.",
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA14_1.png",
			"fr": {
				"name": "La sentinelle d’acier"
			},
			"health": 30,
			"id": "LOEA14_1",
			"name": "The Steel Sentinel",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "TB_AllMinionsTauntCharge.png",
			"fr": {
				"name": "Confère Provocation et Charge",
				"text": "Ce serviteur a obtenu <b>Provocation</b> et <b>Charge</b>."
			},
			"id": "TB_AllMinionsTauntCharge",
			"name": "Give Taunt and Charge",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "This minion is granted <b>Taunt</b> and <b>Charge</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "James Ryman",
			"cardImage": "EX1_132.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Œil pour œil",
				"text": "<b>Secret :</b> inflige au héros adverse autant de dégâts que ceux subis par votre héros."
			},
			"id": "EX1_132",
			"name": "Eye for an Eye",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Secret:</b> When your hero takes damage, deal that much damage to the enemy hero.",
			"type": "Spell"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "LOE_027.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Épreuve sacrée",
				"text": "<b>Secret :</b> si votre adversaire possède au moins 3 serviteurs et qu’il en joue un autre, le détruit."
			},
			"id": "LOE_027",
			"name": "Sacred Trial",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Secret:</b> After your opponent has at least 3 minions and plays another, destroy it.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_613e.png",
			"fr": {
				"name": "Vengeance de VanCleef",
				"text": "Caractéristiques augmentées."
			},
			"id": "EX1_613e",
			"name": "VanCleef's Vengeance",
			"playerClass": "Rogue",
			"set": "Expert1",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Jesper Ejsing",
			"cardImage": "GVG_012.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Lumière des naaru",
				"text": "Rend #3 |4(point,points) de vie. Si la cible est toujours blessée, invoque un Gardelumière."
			},
			"id": "GVG_012",
			"name": "Light of the Naaru",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Restore #3 Health. If the target is still damaged, summon a Lightwarden.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_16H.png",
			"cost": 2,
			"fr": {
				"name": "Fouilles",
				"text": "Trouve un artéfact."
			},
			"id": "LOEA16_16H",
			"name": "Rummage",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Find an artifact.",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_073.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Sang froid",
				"text": "Confère +2 ATQ à un serviteur. <b>Combo :</b> +4 ATQ à la place."
			},
			"id": "CS2_073",
			"name": "Cold Blood",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Give a minion +2 Attack. <b>Combo:</b> +4 Attack instead.",
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
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"cardImage": "EX1_412e.png",
			"fr": {
				"name": "Enragé",
				"text": "+1 ATQ et <b>Furie des vents</b>."
			},
			"id": "EX1_412e",
			"name": "Enraged",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+1 Attack and <b>Windfury</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_4_EnchMinion.png",
			"fr": {
				"name": "Destin",
				"text": "<b>Râle d’agonie_:</b> vous piochez une carte."
			},
			"id": "TB_PickYourFate_4_EnchMinion",
			"name": "Fate",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Deathrattle:</b> Draw a card.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA16_2.png",
			"cost": 0,
			"fr": {
				"name": "Bâton de l’Origine",
				"text": "<b>Pouvoir héroïque passif</b>\nVotre héros est <b>Insensible</b> tant que le bâton se charge."
			},
			"id": "LOEA16_2",
			"name": "Staff of Origination",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\nYour hero is <b>Immune</b> while the staff charges.",
			"type": "Hero_power"
		},
		{
			"artist": "Sam Nielson",
			"attack": 2,
			"cardImage": "LOE_089.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Avortons tremblants",
				"text": "<b>Râle d’agonie :</b> invoque trois avortons 2/2."
			},
			"health": 6,
			"id": "LOE_089",
			"name": "Wobbling Runts",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Loe",
			"text": "<b>Deathrattle:</b> Summon three 2/2 Runts.",
			"type": "Minion"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_339.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Vol d’esprit",
				"text": "Copie 2 cartes du jeu de votre adversaire et les place dans votre main."
			},
			"id": "EX1_339",
			"name": "Thoughtsteal",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Copy 2 cards from your opponent's deck and put them into your hand.",
			"type": "Spell"
		},
		{
			"artist": "E. Guiton & A. Bozonnet",
			"attack": 3,
			"cardImage": "OG_216.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Loup contaminé",
				"text": "<b>Râle d’agonie :</b> invoque deux araignées 1/1."
			},
			"health": 3,
			"id": "OG_216",
			"name": "Infested Wolf",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Summon two 1/1 Spiders.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA06_2H_TB.png",
			"cost": 2,
			"fr": {
				"name": "Le chambellan",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un acolyte attise-flammes 3/3."
			},
			"id": "BRMA06_2H_TB",
			"name": "The Majordomo",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nSummon a 3/3 Flamewaker Acolyte.",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "XXX_098.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - No Deck/Hand",
				"text": "Spawn into play to destroy the AI's Hand and Deck."
			},
			"health": 1,
			"id": "XXX_098",
			"name": "AI Buddy - No Deck/Hand",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Spawn into play to destroy the AI's Hand and Deck.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_11_01heroic.png",
			"fr": {
				"name": "Plaie-de-nuit"
			},
			"health": 30,
			"id": "KARA_11_01heroic",
			"name": "Nightbane",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA13_2H.png",
			"cost": 1,
			"fr": {
				"name": "Forme véritable",
				"text": "<b>Pouvoir héroïque</b>\nQue le combat commence !"
			},
			"id": "BRMA13_2H",
			"name": "True Form",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nLet the games begin!",
			"type": "Hero_power"
		},
		{
			"artist": "Todd Lockwood",
			"attack": 4,
			"cardImage": "GVG_100.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Guetteur flottant",
				"text": "Chaque fois que votre héros subit des dégâts pendant votre tour,\ngagne +2/+2."
			},
			"health": 4,
			"id": "GVG_100",
			"name": "Floating Watcher",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Whenever your hero takes damage on your turn, gain +2/+2.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_041b.png",
			"cost": 0,
			"fr": {
				"name": "Sombres feux follets",
				"text": "Invoque 5 feux follets."
			},
			"id": "GVG_041b",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"set": "Gvg",
			"text": "Summon 5 Wisps.",
			"type": "Spell"
		},
		{
			"cardImage": "TBA01_5.png",
			"cost": 2,
			"fr": {
				"name": "Magie sauvage",
				"text": "<b>Pouvoir héroïque</b>\nPlace un sort aléatoire de n’importe quelle classe dans votre main. Il coûte (0) cristal."
			},
			"id": "TBA01_5",
			"name": "Wild Magic",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nAdd a random spell from any class to your hand. It costs (0).",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA07_2.png",
			"cost": 1,
			"fr": {
				"name": "MOI TOUT CASSER",
				"text": "<b>Pouvoir héroïque</b>\nDétruit un serviteur adverse blessé aléatoire."
			},
			"id": "BRMA07_2",
			"name": "ME SMASH",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nDestroy a random damaged enemy minion.",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX15_01He.png",
			"fr": {
				"name": "Intrus !"
			},
			"id": "NAX15_01He",
			"name": "Interloper!",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_021e.png",
			"fr": {
				"name": "Étreinte de Mal’Ganis",
				"text": "Mal’Ganis confère +2/+2."
			},
			"id": "GVG_021e",
			"name": "Grasp of Mal'Ganis",
			"playerClass": "Warlock",
			"set": "Gvg",
			"text": "Mal'Ganis is granting +2/+2.",
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
				"name": "Brise-sort",
				"text": "<b>Cri de guerre :</b> réduit au <b>Silence</b> un serviteur."
			},
			"health": 3,
			"id": "EX1_048",
			"name": "Spellbreaker",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> <b>Silence</b> a minion.",
			"type": "Minion"
		},
		{
			"artist": "Peerasak Senalai",
			"cardImage": "PART_005.png",
			"cost": 1,
			"fr": {
				"name": "Liquide de refroidissement",
				"text": "<b>Gèle</b> un serviteur."
			},
			"id": "PART_005",
			"name": "Emergency Coolant",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "<b>Freeze</b> a minion.",
			"type": "Spell"
		},
		{
			"artist": "Ben Zhang",
			"attack": 5,
			"cardImage": "LOE_038.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Sorcière des mers naga",
				"text": "Vos cartes coûtent\n(5) |4(cristal,cristaux) de mana."
			},
			"health": 5,
			"id": "LOE_038",
			"name": "Naga Sea Witch",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Loe",
			"text": "Your cards cost (5).",
			"type": "Minion"
		},
		{
			"artist": "A.J. Nazzaro",
			"attack": 1,
			"cardImage": "KAR_009.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Grimoire bavard",
				"text": "<b>Cri de guerre_:</b> ajoute un sort de mage aléatoire dans votre main."
			},
			"health": 1,
			"id": "KAR_009",
			"name": "Babbling Book",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Add a random Mage spell to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_061.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Drain de vie",
				"text": "Inflige $2 |4(point,points) de dégâts. Rend #2 |4(point,points) de vie à votre héros."
			},
			"id": "CS2_061",
			"name": "Drain Life",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $2 damage. Restore #2 Health to your hero.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_132_HUNTER.png",
			"cost": 2,
			"fr": {
				"name": "Tir de baliste",
				"text": "<b>Pouvoir héroïque</b>\nInflige $3 points de dégâts au héros adverse."
			},
			"id": "AT_132_HUNTER",
			"name": "Ballista Shot",
			"playerClass": "Hunter",
			"set": "Tgt",
			"text": "<b>Hero Power</b>\nDeal $3 damage to the enemy hero.",
			"type": "Hero_power"
		},
		{
			"artist": "Cole Eastburn",
			"attack": 1,
			"cardImage": "EX1_396.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gardien mogu’shan",
				"text": "<b>Provocation</b>"
			},
			"health": 7,
			"id": "EX1_396",
			"name": "Mogu'shan Warden",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA16_2H.png",
			"cost": 0,
			"fr": {
				"name": "Écholocation",
				"text": "<b>Pouvoir héroïque</b>\nS’équipe d’une arme qui croît à mesure que l’adversaire joue des cartes."
			},
			"id": "BRMA16_2H",
			"name": "Echolocate",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nEquip a weapon that grows as your opponent plays cards.",
			"type": "Hero_power"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 2,
			"cardImage": "AT_080.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Commandant du fief",
				"text": "Vous pouvez utiliser votre pouvoir héroïque deux fois par tour."
			},
			"health": 3,
			"id": "AT_080",
			"name": "Garrison Commander",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "You can use your Hero Power twice a turn.",
			"type": "Minion"
		},
		{
			"cardImage": "GAME_005e.png",
			"fr": {
				"name": "La pièce"
			},
			"id": "GAME_005e",
			"name": "The Coin",
			"playerClass": "Neutral",
			"set": "Core",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_010.png",
			"cost": 0,
			"fr": {
				"name": "Silence - debug",
				"text": "Remove all enchantments and powers from a minion."
			},
			"id": "XXX_010",
			"name": "Silence - debug",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Remove all enchantments and powers from a minion.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_02.png",
			"cost": 0,
			"fr": {
				"name": "Fuyez !",
				"text": "Affrontez de nouveaux obstacles !"
			},
			"id": "LOEA04_02",
			"name": "Escape!",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Loe",
			"text": "Encounter new obstacles!",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_RandHero2_001.png",
			"fr": {
				"name": "TB_EnchWhosTheBossNow"
			},
			"id": "TB_RandHero2_001",
			"name": "TB_EnchWhosTheBossNow",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Daren Bader",
			"attack": 3,
			"cardImage": "NEW1_041.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Kodo déchaîné",
				"text": "<b>Cri de guerre :</b> détruit un serviteur adverse aléatoire avec 2 en Attaque ou moins."
			},
			"health": 5,
			"id": "NEW1_041",
			"name": "Stampeding Kodo",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Destroy a random enemy minion with 2 or less Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX1_05.png",
			"cost": 7,
			"fr": {
				"name": "Nuée de sauterelles",
				"text": "Inflige $3 |4(point,points) de dégâts à tous les serviteurs adverses. Rend #3 |4(point,points) de vie à votre héros."
			},
			"id": "NAX1_05",
			"name": "Locust Swarm",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Deal $3 damage to all enemy minions. Restore #3 Health to your hero.",
			"type": "Spell"
		},
		{
			"artist": "Jakub Kasber",
			"attack": 1,
			"cardImage": "OG_070.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Sectateur de la Lame",
				"text": "<b>Combo_:</b> gagne +1/+1."
			},
			"health": 2,
			"id": "OG_070",
			"name": "Bladed Cultist",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Combo:</b> Gain +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA01_2.png",
			"cost": 0,
			"fr": {
				"name": "Jeu forcé !",
				"text": "<b>Pouvoir héroïque</b>\nPlace un serviteur de chaque deck sur le champ de bataille."
			},
			"id": "BRMA01_2",
			"name": "Pile On!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nPut a minion from each deck into the battlefield.",
			"type": "Hero_power"
		},
		{
			"artist": "Kevin Chen",
			"cardImage": "KARA_05_01hp.png",
			"cost": 0,
			"fr": {
				"name": "Apeuré",
				"text": "<b>Pouvoir héroïque passif</b>\nLes serviteurs adverses ont_1/1 et coûtent (1)_cristal."
			},
			"id": "KARA_05_01hp",
			"name": "Trembling",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Passive Hero Power</b> Enemy minions are 1/1 and cost (1).",
			"type": "Hero_power"
		},
		{
			"cardImage": "KAR_A02_09H.png",
			"cost": 4,
			"fr": {
				"name": "Mettre la table",
				"text": "Donne +2/+2 à vos assiettes."
			},
			"id": "KAR_A02_09H",
			"name": "Set the Table",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Give your Plates +2/+2.",
			"type": "Spell"
		},
		{
			"artist": "Efrem Palacios",
			"cardImage": "OG_048.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Marque d’Y’Shaarj",
				"text": "Donne +2/+2 à un serviteur. Si c'est une Bête, vous piochez une carte."
			},
			"id": "OG_048",
			"name": "Mark of Y'Shaarj",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"text": "Give a minion +2/+2.\nIf it's a Beast, draw\na card.",
			"type": "Spell"
		},
		{
			"cardImage": "KAR_A01_02H.png",
			"cost": 0,
			"fr": {
				"name": "Reflets",
				"text": "<b>Pouvoir héroïque passif</b>\nChaque fois qu’un serviteur est joué, Miroir magique en invoque une copie_1/1."
			},
			"id": "KAR_A01_02H",
			"name": "Reflections",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Passive Hero Power</b>\nWhenever a minion is played, Magic Mirror summons a 1/1 copy of it.",
			"type": "Hero_power"
		},
		{
			"artist": "Matt O'Connor",
			"attack": 1,
			"cardImage": "KAR_025a.png",
			"cost": 1,
			"fr": {
				"name": "Bougie"
			},
			"health": 1,
			"id": "KAR_025a",
			"name": "Candle",
			"playerClass": "Warlock",
			"set": "Kara",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_4_Ench.png",
			"fr": {
				"name": "Pick Your Fate 4 Ench"
			},
			"id": "TB_PickYourFate_4_Ench",
			"name": "Pick Your Fate 4 Ench",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_006e.png",
			"fr": {
				"name": "Grande banane",
				"text": "A +2/+2."
			},
			"id": "TB_006e",
			"name": "Big Banana",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Has +2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "OG_162.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Disciple de C’Thun",
				"text": "<b>Cri de guerre :</b> inflige 2 points de dégâts. Donne +2/+2 à votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 1,
			"id": "OG_162",
			"name": "Disciple of C'Thun",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> Deal 2 damage. Give your C'Thun +2/+2 <i>(wherever it is)</i>.",
			"type": "Minion"
		},
		{
			"artist": "Cyril Van Der Haegen",
			"attack": 3,
			"cardImage": "EX1_536.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Arc cornedaigle",
				"text": "Chaque fois qu’un <b>Secret</b> allié est révélé, gagne +1 Durabilité."
			},
			"id": "EX1_536",
			"name": "Eaglehorn Bow",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Whenever a friendly <b>Secret</b> is revealed, gain +1 Durability.",
			"type": "Weapon"
		},
		{
			"cardImage": "BRMA03_1H.png",
			"fr": {
				"name": "Empereur Thaurissan"
			},
			"health": 30,
			"id": "BRMA03_1H",
			"name": "Emperor Thaurissan",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Garrett Hanna",
			"attack": 4,
			"cardImage": "KAR_702.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Magicien de la Ménagerie",
				"text": "<b>Cri de guerre_:</b> donne +2/+2 à une Bête, un Dragon et un Murloc alliés aléatoires."
			},
			"health": 4,
			"id": "KAR_702",
			"name": "Menagerie Magician",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Give a random friendly Beast, Dragon, and Murloc +2/+2.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "EX1_531.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Hyène charognarde",
				"text": "Chaque fois qu’une bête alliée meurt, gagne +2/+1."
			},
			"health": 2,
			"id": "EX1_531",
			"name": "Scavenging Hyena",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Whenever a friendly Beast dies, gain +2/+1.",
			"type": "Minion"
		},
		{
			"artist": "Bernie Kang",
			"attack": 12,
			"cardImage": "NEW1_030.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Aile de mort",
				"text": "<b>Cri de guerre :</b> détruit tous les autres serviteurs et vous défausse de votre main."
			},
			"health": 12,
			"id": "NEW1_030",
			"name": "Deathwing",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Destroy all other minions and discard your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_28.png",
			"cost": 0,
			"fr": {
				"name": "Un bassin luminescent",
				"text": "<b>Boire ?</b>"
			},
			"id": "LOEA04_28",
			"name": "A Glowing Pool",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Drink?</b>",
			"type": "Spell"
		},
		{
			"artist": "Michael Komarck",
			"attack": 4,
			"cardImage": "EX1_563.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Malygos",
				"text": "<b>Dégâts des sorts : +5</b>"
			},
			"health": 12,
			"id": "EX1_563",
			"name": "Malygos",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"spellDamage": 5,
			"text": "<b>Spell Damage +5</b>",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_009e.png",
			"fr": {
				"name": "Empty Enchant",
				"text": "This enchantment does nothing."
			},
			"id": "XXX_009e",
			"name": "Empty Enchant",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "This enchantment does nothing.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX10_03.png",
			"cost": 4,
			"fr": {
				"name": "Frappe haineuse",
				"text": "<b>Pouvoir héroïque</b>\nDétruit un serviteur."
			},
			"id": "NAX10_03",
			"name": "Hateful Strike",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDestroy a minion.",
			"type": "Hero_power"
		},
		{
			"artist": "James Ryman",
			"cardImage": "KARA_00_06.png",
			"cost": 2,
			"fr": {
				"name": "Pouvoir des Arcanes",
				"text": "Vous avez <b>+5_aux dégâts des sorts</b> pendant ce tour."
			},
			"id": "KARA_00_06",
			"name": "Arcane Power",
			"playerClass": "Mage",
			"set": "Kara",
			"text": "You have <b>Spell Damage</b> +5 this turn.",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_26.png",
			"cost": 5,
			"fr": {
				"name": "Squeletosaurus Hex",
				"text": "Donne une carte aléatoire à chaque joueur à la fin de votre tour. Elle coûte (0) |4(cristal,cristaux) de mana."
			},
			"health": 5,
			"id": "LOEA16_26",
			"name": "Skelesaurus Hex",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, give each player a random card. It costs (0).",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"cardImage": "KAR_A10_22H.png",
			"cost": 1,
			"fr": {
				"name": "Roque",
				"text": "<b>Pouvoir héroïque</b>\nDéplace un serviteur allié à gauche. Peut être répété."
			},
			"id": "KAR_A10_22H",
			"name": "Castle",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nMove a friendly minion left. Repeatable.",
			"type": "Hero_power"
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
			"artist": "Efrem Palacios",
			"cardImage": "GVG_031.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Recyclage",
				"text": "Replace un serviteur adverse dans le deck de votre adversaire."
			},
			"id": "GVG_031",
			"name": "Recycle",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Shuffle an enemy minion into your opponent's deck.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA17_5_TB.png",
			"cost": 2,
			"fr": {
				"name": "Séides des os",
				"text": "<b>Pouvoir héroïque</b>\nInvoque deux assemblages d’os 2/1."
			},
			"id": "BRMA17_5_TB",
			"name": "Bone Minions",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nSummon two 2/1 Bone Constructs.",
			"type": "Hero_power"
		},
		{
			"artist": "Dany Orizio",
			"attack": 3,
			"cardImage": "OG_149.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Goule ravageuse",
				"text": "<b>Cri de guerre :</b> inflige\n1 point de dégâts à tous les autres serviteurs."
			},
			"health": 3,
			"id": "OG_149",
			"name": "Ravaging Ghoul",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Battlecry:</b> Deal 1 damage to all other minions.",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 3,
			"cardImage": "AT_124.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Bolf Bélier-Frondeur",
				"text": "Chaque fois que votre héros subit des dégâts, les inflige à ce serviteur à la place."
			},
			"health": 9,
			"id": "AT_124",
			"name": "Bolf Ramshield",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "Whenever your hero takes damage, this minion takes it instead.",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "GVG_047.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Sabotage",
				"text": "Détruit un serviteur adverse aléatoire. <b>Combo_:</b> détruit aussi l’arme de votre adversaire."
			},
			"id": "GVG_047",
			"name": "Sabotage",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Destroy a random enemy minion. <b>Combo:</b> And your opponent's weapon.",
			"type": "Spell"
		},
		{
			"artist": "Hideaki Takamura",
			"cardImage": "CS2_233.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Déluge de lames",
				"text": "Détruit votre arme, dont les dégâts sont infligés à tous les serviteurs adverses."
			},
			"id": "CS2_233",
			"name": "Blade Flurry",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Destroy your weapon and deal its damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"cardImage": "KARA_05_01b.png",
			"fr": {
				"name": "Gentille grand-mère"
			},
			"health": 20,
			"id": "KARA_05_01b",
			"name": "Kindly Grandmother",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "John Polidora",
			"attack": 3,
			"cardImage": "AT_100.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Régente de la Main d’argent",
				"text": "<b>Exaltation :</b> invoque une recrue de la Main\nd’argent 1/1."
			},
			"health": 3,
			"id": "AT_100",
			"name": "Silver Hand Regent",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Summon a 1/1 Silver Hand Recruit.",
			"type": "Minion"
		},
		{
			"artist": "Alex Aleksandrov",
			"attack": 2,
			"cardImage": "KAR_036.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Anomalie arcanique",
				"text": "Chaque fois que vous lancez un sort, donne +1_PV à ce serviteur."
			},
			"health": 1,
			"id": "KAR_036",
			"name": "Arcane Anomaly",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "Whenever you cast a spell, give this minion\n+1 Health.",
			"type": "Minion"
		},
		{
			"artist": "Ben Zhang",
			"attack": 6,
			"cardImage": "LOE_003.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Adjurateur éthérien",
				"text": "<b>Cri de guerre : découvre</b>\nun sort."
			},
			"health": 3,
			"id": "LOE_003",
			"name": "Ethereal Conjurer",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Battlecry: Discover</b> a spell.",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "CRED_45.png",
			"cost": 6,
			"fr": {
				"name": "Jonas Laster",
				"text": "Chaque fois qu’un serviteur <b>réduit au silence</b> meurt, gagne +1/+1."
			},
			"health": 6,
			"id": "CRED_45",
			"name": "Jonas Laster",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Whenever a <b>Silenced</b> minion dies, gain +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Sean O’Daniels",
			"attack": 0,
			"cardImage": "EX1_006.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Robot d’alarme",
				"text": "Au début de votre tour, échange ce serviteur avec un autre choisi au hasard dans votre main."
			},
			"health": 3,
			"id": "EX1_006",
			"name": "Alarm-o-Bot",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "At the start of your turn, swap this minion with a random one in your hand.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "AT_029.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Boucanier",
				"text": "Chaque fois que vous vous équipez d’une arme, lui confère +1 ATQ."
			},
			"health": 1,
			"id": "AT_029",
			"name": "Buccaneer",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Whenever you equip a weapon, give it +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_561e.png",
			"fr": {
				"name": "Feu d’Alexstrasza",
				"text": "Les PV passent à 15."
			},
			"id": "EX1_561e",
			"name": "Alexstrasza's Fire",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Health set to 15.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 4,
			"cardImage": "KAR_A10_09.png",
			"cost": 7,
			"fr": {
				"name": "Reine blanche",
				"text": "<b>Attaque automatique_:</b> inflige 4 points de dégâts aux adversaires en face de ce serviteur."
			},
			"health": 6,
			"id": "KAR_A10_09",
			"name": "White Queen",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Auto-Attack:</b> Deal 4 damage to the enemies opposite this minion.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "GAME_002.png",
			"cost": 0,
			"fr": {
				"name": "Avatar de la pièce",
				"text": "<i>Vous avez peut-être perdu à pile ou face, mais vous avez gagné un ami.</i>"
			},
			"health": 1,
			"id": "GAME_002",
			"name": "Avatar of the Coin",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"text": "<i>You lost the coin flip, but gained a friend.</i>",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_9.png",
			"cost": 0,
			"fr": {
				"name": "Bonus : Râle d’agonie",
				"text": "Vos serviteurs avec <b>Râle d’agonie</b> ont +1/+1."
			},
			"id": "TB_PickYourFate_9",
			"name": "Deathrattle Bonus",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Your <b>Deathrattle</b> minions have +1/+1.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_022.png",
			"cost": 0,
			"fr": {
				"name": "Free Cards",
				"text": "Your cards cost (0) for the rest of the game."
			},
			"id": "XXX_022",
			"name": "Free Cards",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Your cards cost (0) for the rest of the game.",
			"type": "Spell"
		},
		{
			"cardImage": "PART_004e.png",
			"fr": {
				"name": "Camouflé",
				"text": "Camouflé jusqu’à votre prochain tour."
			},
			"id": "PART_004e",
			"name": "Cloaked",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Stealthed until your next turn.",
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
			"artist": "Turovec Konstantin",
			"attack": 3,
			"cardImage": "LOE_047.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Araignée des tombes",
				"text": "<b>Cri de guerre : découvre</b> une Bête."
			},
			"health": 3,
			"id": "LOE_047",
			"name": "Tomb Spider",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Battlecry: Discover</b> a Beast.",
			"type": "Minion"
		},
		{
			"artist": "Eva Widermann",
			"attack": 3,
			"cardImage": "AT_046.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Rohart totémique",
				"text": "<b>Cri de guerre :</b> invoque N’IMPORTE QUEL totem aléatoire."
			},
			"health": 2,
			"id": "AT_046",
			"name": "Tuskarr Totemic",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Summon ANY random Totem.",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 0,
			"cardImage": "BRM_022.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Œuf de dragon",
				"text": "Invoque un dragonnet 2/1 chaque fois que ce serviteur subit des dégâts."
			},
			"health": 2,
			"id": "BRM_022",
			"name": "Dragon Egg",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Brm",
			"text": "Whenever this minion takes damage, summon a 2/1 Whelp.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "OG_118.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Parjurer les ténèbres",
				"text": "Remplace votre pouvoir héroïque et vos cartes de démoniste par ceux d’une autre classe. Les cartes coûtent (1) |4(cristal,cristaux) de moins."
			},
			"id": "OG_118",
			"name": "Renounce Darkness",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Og",
			"text": "Replace your Hero Power and Warlock cards with another class's. The cards cost (1) less.",
			"type": "Spell"
		},
		{
			"cardImage": "KARA_00_06e.png",
			"fr": {
				"name": "Arcaniquement puissant",
				"text": "<b>+5 aux dégâts des sorts</b>."
			},
			"id": "KARA_00_06e",
			"name": "Arcanely Powerful",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "+5 Spell Damage.",
			"type": "Enchantment"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 5,
			"cardImage": "AT_104.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Jouteur rohart",
				"text": "<b>Cri de guerre :</b> révèle un serviteur de chaque deck. Si le vôtre coûte plus, rend 7 PV à votre héros."
			},
			"health": 5,
			"id": "AT_104",
			"name": "Tuskarr Jouster",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, restore 7 Health to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"attack": 1,
			"cardImage": "GVG_051.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Robo-baston",
				"text": "<b>Accès de rage :</b> +1 ATQ."
			},
			"health": 3,
			"id": "GVG_051",
			"name": "Warbot",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Enrage:</b> +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_00_04H.png",
			"cost": 2,
			"fr": {
				"name": "Génie",
				"text": "<b>Pouvoir héroïque</b>\nVous piochez 3 cartes."
			},
			"id": "KARA_00_04H",
			"name": "Brilliance",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nDraw 3 cards.",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA10_3e.png",
			"fr": {
				"name": "Incubation",
				"text": "Vie augmentée."
			},
			"id": "BRMA10_3e",
			"name": "Incubation",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_CoOpBossSpell_2.png",
			"cost": 0,
			"fr": {
				"name": "Salve de bombes",
				"text": "Inflige les dégâts de l’attaque à 3 cibles aléatoires au maximum."
			},
			"id": "TB_CoOpBossSpell_2",
			"name": "Bomb Salvo",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Deal Attack damage to up to 3 random targets.",
			"type": "Spell"
		},
		{
			"artist": "Luca Zontini",
			"attack": 4,
			"cardImage": "EX1_165.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Druide de la Griffe",
				"text": "<b>Choix des armes :</b> <b>Charge</b> ou confère +2 PV et <b>Provocation</b>."
			},
			"health": 4,
			"id": "EX1_165",
			"name": "Druid of the Claw",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Choose One -</b> <b>Charge</b>; or +2 Health and <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Howard Lyon",
			"attack": 2,
			"cardImage": "AT_115.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maître d’escrime",
				"text": "<b>Cri de guerre :</b> la prochaine fois que vous utilisez votre pouvoir héroïque, il coûte\n(2) cristaux de moins."
			},
			"health": 2,
			"id": "AT_115",
			"name": "Fencing Coach",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> The next time you use your Hero Power, it costs (2) less.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA06_03h.png",
			"cost": 2,
			"fr": {
				"name": "Terrestre animé",
				"text": "Donne +3/+3 et <b>Provocation</b> à vos serviteurs."
			},
			"id": "LOEA06_03h",
			"name": "Animate Earthen",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Give your minions +3/+3 and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"artist": "Ryan Metcalf",
			"cardImage": "LOE_026.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Tous les murlocs de ta vie",
				"text": "Invoque 7 murlocs détruits pendant cette partie."
			},
			"id": "LOE_026",
			"name": "Anyfin Can Happen",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Loe",
			"text": "Summon 7 Murlocs that died this game.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_073e.png",
			"fr": {
				"name": "Sang froid",
				"text": "+2 ATQ."
			},
			"id": "CS2_073e",
			"name": "Cold Blood",
			"playerClass": "Rogue",
			"set": "Expert1",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Oliver Chipping",
			"attack": 9,
			"cardImage": "GVG_035.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Malorne",
				"text": "<b>Râle d’agonie :</b> replace ce serviteur dans votre deck."
			},
			"health": 7,
			"id": "GVG_035",
			"name": "Malorne",
			"playerClass": "Druid",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "<b>Deathrattle:</b> Shuffle this minion into your deck.",
			"type": "Minion"
		},
		{
			"attack": 8,
			"cardImage": "BRMA14_9H.png",
			"cost": 5,
			"fr": {
				"name": "Magmatron",
				"text": "Chaque fois qu’un joueur joue une carte, lui inflige 2 points de dégâts."
			},
			"health": 8,
			"id": "BRMA14_9H",
			"name": "Magmatron",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "Whenever a player plays a card, Magmatron deals 2 damage to them.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_363e.png",
			"fr": {
				"name": "Bénédiction de sagesse",
				"text": "Quand ce serviteur attaque, le joueur qui l’a béni pioche une carte."
			},
			"id": "EX1_363e",
			"name": "Blessing of Wisdom",
			"playerClass": "Paladin",
			"set": "Expert1",
			"text": "When this minion attacks, the player who blessed it draws a card.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_ClassRandom_Paladin.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : paladin",
				"text": "Ajoute des cartes de paladin dans votre deck."
			},
			"id": "TB_ClassRandom_Paladin",
			"name": "Second Class: Paladin",
			"playerClass": "Paladin",
			"set": "Tb",
			"text": "Add Paladin cards to your deck.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "GVG_110t.png",
			"cost": 1,
			"fr": {
				"name": "Ro’Boum",
				"text": "<b>Râle d’agonie_:</b> inflige 1_à_4_points de dégâts à un adversaire aléatoire."
			},
			"health": 1,
			"id": "GVG_110t",
			"name": "Boom Bot",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "<b>Deathrattle:</b> Deal 1-4 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"attack": 4,
			"cardImage": "OG_335.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Ombre mouvante",
				"text": "<b>Râle d’agonie :</b> copie une carte du deck de votre adversaire et la place dans votre main."
			},
			"health": 3,
			"id": "OG_335",
			"name": "Shifting Shade",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Copy a card from your opponent's deck and add it to your hand.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "TB_Coopv3_105.png",
			"cost": 4,
			"fr": {
				"name": "Soigneuse de raid",
				"text": "Chaque fois que votre héros est soigné, soigne d’autant votre équipier."
			},
			"health": 7,
			"id": "TB_Coopv3_105",
			"name": "Raid Healer",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Whenever your hero is healed, also heal your teammate for that much.",
			"type": "Minion"
		},
		{
			"artist": "Arthur Bozonnet",
			"cardImage": "KARA_07_08.png",
			"cost": 6,
			"fr": {
				"name": "Évasion de dragon !",
				"text": "Invoque un Dragon aléatoire."
			},
			"id": "KARA_07_08",
			"name": "Dragons Free!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon a random Dragon.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpv3_BOSS2e.png",
			"fr": {
				"name": "Se met en colère…",
				"text": "Maintenant, il est en colère…"
			},
			"id": "TB_CoOpv3_BOSS2e",
			"name": "Getting Angry....",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Now he's mad....",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_019e.png",
			"fr": {
				"name": "Cœur de démon",
				"text": "+5/+5."
			},
			"id": "GVG_019e",
			"name": "Demonheart",
			"playerClass": "Warlock",
			"set": "Gvg",
			"text": "+5/+5.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "BRMA14_7.png",
			"cost": 3,
			"fr": {
				"name": "Électron",
				"text": "Tous les sorts coûtent (3) |4(cristal,cristaux) de moins."
			},
			"health": 5,
			"id": "BRMA14_7",
			"name": "Electron",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "All spells cost (3) less.",
			"type": "Minion"
		},
		{
			"artist": "Jon McConnell",
			"attack": 4,
			"cardImage": "FP1_029.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Épées dansantes",
				"text": "<b>Râle d’agonie :</b> votre adversaire pioche une carte."
			},
			"health": 4,
			"id": "FP1_029",
			"name": "Dancing Swords",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Your opponent draws a card.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_055.png",
			"cost": 0,
			"fr": {
				"name": "1000 Stats",
				"text": "Give a Minion +1000/+1000"
			},
			"id": "XXX_055",
			"name": "1000 Stats",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Give a Minion +1000/+1000",
			"type": "Spell"
		},
		{
			"artist": "Gonzalo Ordonez",
			"cardImage": "tt_010.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Courbe-sort",
				"text": "<b>Secret :</b> quand votre adversaire lance un sort sur un serviteur, invoque un 1/3 qui devient la nouvelle cible."
			},
			"id": "tt_010",
			"name": "Spellbender",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Secret:</b> When an enemy casts a spell on a minion, summon a 1/3 as the new target.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"attack": 5,
			"cardImage": "EX1_558.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Harrison Jones",
				"text": "<b>Cri de guerre :</b> détruit l’arme de votre adversaire. Vous piochez le nombre de cartes équivalent à sa durabilité."
			},
			"health": 4,
			"id": "EX1_558",
			"name": "Harrison Jones",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Destroy your opponent's weapon and draw cards equal to its Durability.",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "CRED_24.png",
			"cost": 7,
			"fr": {
				"name": "Dean Ayala",
				"text": "Vous ne pouvez pas perdre d’étoiles tant que vous avez cette carte dans votre deck."
			},
			"health": 5,
			"id": "CRED_24",
			"name": "Dean Ayala",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "You can't lose stars while this is in your deck.",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 1,
			"cardImage": "EX1_009.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Poulet furieux",
				"text": "<b>Accès de rage :</b> +5 ATQ."
			},
			"health": 1,
			"id": "EX1_009",
			"name": "Angry Chicken",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Enrage:</b> +5 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Seamus Gallagher",
			"attack": 2,
			"cardImage": "GVG_081.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Traqueur gloubelin",
				"text": "<b>Camouflage</b>"
			},
			"health": 3,
			"id": "GVG_081",
			"name": "Gilblin Stalker",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_8.png",
			"cost": 0,
			"fr": {
				"name": "Fiole de Putrescin",
				"text": "Détruit un serviteur adverse aléatoire."
			},
			"id": "LOEA16_8",
			"name": "Putress' Vial",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Destroy a random enemy minion.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 1,
			"cardImage": "EX1_102.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Démolisseur",
				"text": "Au début de votre tour, inflige 2 points de dégâts à un adversaire aléatoire."
			},
			"health": 4,
			"id": "EX1_102",
			"name": "Demolisher",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "At the start of your turn, deal 2 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_08_03H.png",
			"cost": 3,
			"fr": {
				"name": "Souffle du Néant",
				"text": "Fait passer la Vie de tous les serviteurs adverses à_1."
			},
			"id": "KARA_08_03H",
			"name": "Nether Breath",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "[x]Change the Health of\nall enemy minions to 1.",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "KAR_A02_01H.png",
			"cost": 1,
			"fr": {
				"name": "Assiette"
			},
			"health": 2,
			"id": "KAR_A02_01H",
			"name": "Plate",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_596e.png",
			"fr": {
				"name": "Feu démoniaque",
				"text": "Ce démon a +2/+2."
			},
			"id": "EX1_596e",
			"name": "Demonfire",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"text": "This Demon has +2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "CS2_226.png",
			"collectible": true,
			"cost": 5,
			"faction": "HORDE",
			"fr": {
				"name": "Chef de guerre loup-de-givre",
				"text": "<b>Cri de guerre :</b> gagne +1/+1 pour chaque autre serviteur allié sur le champ de bataille."
			},
			"health": 4,
			"id": "CS2_226",
			"name": "Frostwolf Warlord",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Gain +1/+1 for each other friendly minion on the battlefield.",
			"type": "Minion"
		},
		{
			"artist": "Adam Byrne",
			"attack": 2,
			"cardImage": "AT_097.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Spectateur du tournoi",
				"text": "<b>Provocation</b>"
			},
			"health": 1,
			"id": "AT_097",
			"name": "Tournament Attendee",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Adam Byrne",
			"attack": 0,
			"cardImage": "KARA_04_01.png",
			"cost": 4,
			"fr": {
				"name": "Dorothée",
				"text": "Les serviteurs à gauche ont <b>Charge</b>. Les serviteurs à droite_ont_<b>Provocation</b>."
			},
			"health": 10,
			"id": "KARA_04_01",
			"name": "Dorothee",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Minions to the left have <b>Charge</b>. Minions to the right have <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_CoOpv3_010.png",
			"cost": 0,
			"fr": {
				"name": "Runes explosives",
				"text": "Invoque deux «_runes explosives_»."
			},
			"id": "TB_CoOpv3_010",
			"name": "Explosive Runes",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Summon two 'Explosive Runes.'",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "BRMA01_3.png",
			"cost": 6,
			"fr": {
				"name": "Videur sombrefer",
				"text": "Gagne toujours à la baston."
			},
			"health": 8,
			"id": "BRMA01_3",
			"name": "Dark Iron Bouncer",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Always wins Brawls.",
			"type": "Minion"
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
			"attack": 7,
			"cardImage": "BRMA14_9.png",
			"cost": 5,
			"fr": {
				"name": "Magmatron",
				"text": "Chaque fois qu’un joueur joue une carte, lui inflige 2 points de dégâts."
			},
			"health": 7,
			"id": "BRMA14_9",
			"name": "Magmatron",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "Whenever a player plays a card, Magmatron deals 2 damage to them.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "NAX10_02.png",
			"cost": 3,
			"durability": 8,
			"fr": {
				"name": "Crochet",
				"text": "<b>Râle d’agonie :</b> place cette arme dans votre main."
			},
			"id": "NAX10_02",
			"name": "Hook",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Put this weapon into your hand.",
			"type": "Weapon"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 2,
			"cardImage": "OG_249.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Tauren contaminé",
				"text": "<b>Provocation</b>\n<b>Râle d’agonie :</b> invoque une gelée 2/2."
			},
			"health": 3,
			"id": "OG_249",
			"name": "Infested Tauren",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Taunt</b>\n<b>Deathrattle:</b> Summon a 2/2 Slime.",
			"type": "Minion"
		},
		{
			"artist": "Alex Konstad",
			"attack": 2,
			"cardImage": "OG_033.png",
			"collectible": true,
			"cost": 5,
			"durability": 2,
			"fr": {
				"name": "Tentacules brachiaux",
				"text": "<b>Râle d’agonie :</b> replace cette carte dans votre main."
			},
			"id": "OG_033",
			"name": "Tentacles for Arms",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Return this to your hand.",
			"type": "Weapon"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 2,
			"cardImage": "AT_075.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maître des chevaux de guerre",
				"text": "Vos recrues de la Main d’argent ont +1 ATQ."
			},
			"health": 4,
			"id": "AT_075",
			"name": "Warhorse Trainer",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Your Silver Hand Recruits have +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Andrew Hou",
			"attack": 4,
			"cardImage": "AT_063.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Gueule-d’acide",
				"text": "Chaque fois qu’un autre serviteur subit des dégâts, le détruit."
			},
			"health": 2,
			"id": "AT_063",
			"name": "Acidmaw",
			"playerClass": "Hunter",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "Whenever another minion takes damage, destroy it.",
			"type": "Minion"
		},
		{
			"cardImage": "KAR_A10_22.png",
			"cost": 2,
			"fr": {
				"name": "Roque",
				"text": "<b>Pouvoir héroïque</b>\n<b>Découvre</b> une pièce d’échiquier."
			},
			"id": "KAR_A10_22",
			"name": "Castle",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\n<b>Discover</b> a chess piece.",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_282e.png",
			"fr": {
				"name": "Dévotion de la lame",
				"text": "Caractéristiques augmentées."
			},
			"id": "OG_282e",
			"name": "Devotion of the Blade",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_121e.png",
			"fr": {
				"name": "Sombre puissance",
				"text": "Votre prochain sort coûte de la Vie au lieu de cristaux de mana."
			},
			"id": "OG_121e",
			"name": "Dark Power",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Your next spell costs Health instead of Mana.",
			"type": "Enchantment"
		},
		{
			"artist": "Marcleo Vignali",
			"attack": 4,
			"cardImage": "AT_127.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Champion du Nexus Saraad",
				"text": "<b>Exaltation :</b> ajoute un sort aléatoire dans votre main."
			},
			"health": 5,
			"id": "AT_127",
			"name": "Nexus-Champion Saraad",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Add a random spell to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_106e.png",
			"fr": {
				"name": "Bricolé à fond",
				"text": "Caractéristiques augmentées."
			},
			"id": "GVG_106e",
			"name": "Junked Up",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Gustav Schmidt",
			"cardImage": "KAR_076.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Portail des terres de Feu",
				"text": "Inflige $5 |4(point,points) de dégâts. Invoque un serviteur aléatoire coûtant 5_cristaux."
			},
			"id": "KAR_076",
			"name": "Firelands Portal",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Kara",
			"text": "Deal $5 damage. Summon a random\n5-Cost minion.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "LOEA04_25.png",
			"cost": 8,
			"fr": {
				"name": "Statue vengeresse",
				"text": "Inflige 2 points de dégâts à tous les adversaires à la fin de votre tour."
			},
			"health": 9,
			"id": "LOEA04_25",
			"name": "Seething Statue",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "At the end of your turn, deal 2 damage to all enemies.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA07_3.png",
			"cost": 4,
			"fr": {
				"name": "CASSE-TÊTE",
				"text": "Inflige $5 |4(point,points) de dégâts à un adversaire aléatoire. Gagne 5 points d’armure."
			},
			"id": "BRMA07_3",
			"name": "TIME FOR SMASH",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Deal $5 damage to a random enemy. Gain 5 Armor.",
			"type": "Spell"
		},
		{
			"artist": "Steve Ellis",
			"cardImage": "CS1_130.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Châtiment sacré",
				"text": "Inflige $2 |4(point,points) de dégâts."
			},
			"id": "CS1_130",
			"name": "Holy Smite",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $2 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "KAR_095e.png",
			"fr": {
				"name": "Bien nourri",
				"text": "+1/+1."
			},
			"id": "KAR_095e",
			"name": "Well Fed",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "KAR_A10_03.png",
			"cost": 3,
			"fr": {
				"name": "Tour noire",
				"text": "<b>Attaque automatique_:</b> inflige 2 points de dégâts aux adversaires en face de ce serviteur."
			},
			"health": 6,
			"id": "KAR_A10_03",
			"name": "Black Rook",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Auto-Attack:</b> Deal 2 damage to the enemies opposite this minion.",
			"type": "Minion"
		},
		{
			"artist": "Gonzalo Ordonez",
			"cardImage": "EX1_379.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Repentir",
				"text": "<b>Secret :</b> une fois que votre adversaire a joué un serviteur, ses points de vie sont réduits à 1."
			},
			"id": "EX1_379",
			"name": "Repentance",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Secret:</b> After your opponent plays a minion, reduce its Health to 1.",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "GVG_037.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Zap-o-matic tournoyant",
				"text": "<b>Furie des vents</b>"
			},
			"health": 2,
			"id": "GVG_037",
			"name": "Whirling Zap-o-matic",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA07_03.png",
			"cost": 0,
			"fr": {
				"name": "Fuir la mine !",
				"text": "Échappez aux troggs !"
			},
			"id": "LOEA07_03",
			"name": "Flee the Mine!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Escape the Troggs!",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_GiftExchange_Treasure_Spell.png",
			"cost": 1,
			"fr": {
				"name": "Cadeau du Voile d’hiver volé",
				"text": "<b>Découvre</b> un trésor aléatoire. Son coût est réduit."
			},
			"id": "TB_GiftExchange_Treasure_Spell",
			"name": "Stolen Winter's Veil Gift",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Discover</b> a random Treasure. Its cost is reduced.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_222o.png",
			"fr": {
				"name": "Puissance de Hurlevent",
				"text": "A +1/+1."
			},
			"id": "CS2_222o",
			"name": "Might of Stormwind",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "Has +1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_MechWar_Boss2_HeroPower.png",
			"cost": 2,
			"fr": {
				"name": "Ro’Boum junior",
				"text": "<b>Pouvoir héroïque</b>\nInflige 2 points de dégâts répartis de façon aléatoire entre tous les adversaires."
			},
			"id": "TB_MechWar_Boss2_HeroPower",
			"name": "Boom Bot Jr.",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nDeal 2 damage randomly split among all enemies.",
			"type": "Hero_power"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 2,
			"cardImage": "GVG_055.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Cliquetteur perce-vrille",
				"text": "<b>Cri de guerre_:</b> donne +2/+2 à un Méca allié."
			},
			"health": 5,
			"id": "GVG_055",
			"name": "Screwjank Clunker",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Give a friendly Mech +2/+2.",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 3,
			"cardImage": "AT_052.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Golem totémique",
				"text": "<b>Surcharge :</b> (1)"
			},
			"health": 4,
			"id": "AT_052",
			"name": "Totem Golem",
			"overload": 1,
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Overload:</b> (1).",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_023.png",
			"cost": 0,
			"fr": {
				"name": "Destroy All Heroes",
				"text": "Destroy all heroes."
			},
			"id": "XXX_023",
			"name": "Destroy All Heroes",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Destroy all heroes.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "LOE_020.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Dromadaire du désert",
				"text": "<b>Cri de guerre :</b> place un serviteur à 1 cristal de mana de chaque deck sur le champ de bataille."
			},
			"health": 4,
			"id": "LOE_020",
			"name": "Desert Camel",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Battlecry:</b> Put a 1-Cost minion from each deck into the battlefield.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_049.png",
			"cost": 0,
			"fr": {
				"name": "Destroy all Mana",
				"text": "Destroy all of a player's Mana Crystals."
			},
			"id": "XXX_049",
			"name": "Destroy all Mana",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Destroy all of a player's Mana Crystals.",
			"type": "Spell"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "OG_319.png",
			"cost": 7,
			"fr": {
				"name": "Empereur jumeau Vek’nilash",
				"text": "<b>Provocation</b>"
			},
			"health": 6,
			"id": "OG_319",
			"name": "Twin Emperor Vek'nilash",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Hideaki Takamura",
			"attack": 3,
			"cardImage": "GVG_048.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Bondisseur dent-de-métal",
				"text": "<b>Cri de guerre_:</b> donne +2_ATQ à vos autres Méca."
			},
			"health": 3,
			"id": "GVG_048",
			"name": "Metaltooth Leaper",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Give your other Mechs +2 Attack.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Weapon"
		},
		{
			"cardImage": "TB_CoOpv3_BOSSe.png",
			"fr": {
				"name": "POURQUOI VOUS NE MOUREZ PAS ?",
				"text": "Maintenant, il est VRAIMENT en colère…"
			},
			"id": "TB_CoOpv3_BOSSe",
			"name": "WHY WON'T YOU DIE!?",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Now he's REALLY mad....",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA06_3.png",
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 8,
			"id": "BRMA06_3",
			"name": "Ragnaros the Firelord",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA09_9.png",
			"cost": 1,
			"fr": {
				"name": "Répulsif à nagas",
				"text": "Détruit tous les nagas affamés."
			},
			"id": "LOEA09_9",
			"name": "Naga Repellent",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Destroy all Hungry Naga.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA01_11he.png",
			"fr": {
				"name": "Mode héroïque",
				"text": "+3/+3 si Phaerix contrôle la baguette !"
			},
			"id": "LOEA01_11he",
			"name": "Heroic Mode",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "+3/+3 if Phaerix controls the Rod.",
			"type": "Enchantment"
		},
		{
			"artist": "James Zhang",
			"attack": 2,
			"cardImage": "AT_094.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Jongleur de flammes",
				"text": "<b>Cri de guerre :</b> inflige 1 point de dégâts à un adversaire aléatoire."
			},
			"health": 3,
			"id": "AT_094",
			"name": "Flame Juggler",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Deal 1 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_049.png",
			"cost": 2,
			"fr": {
				"name": "Appel totémique",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un totem aléatoire."
			},
			"id": "CS2_049",
			"name": "Totemic Call",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Hero Power</b>\nSummon a random Totem.",
			"type": "Hero_power"
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
			"artist": "Jesper Ejsing",
			"attack": 3,
			"cardImage": "GVG_069.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Robot de soins antique",
				"text": "<b>Cri de guerre :</b> rend 8 PV à votre héros."
			},
			"health": 3,
			"id": "GVG_069",
			"name": "Antique Healbot",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Restore 8 Health to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Ittoku Seta",
			"attack": 2,
			"cardImage": "FP1_005.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Ombre de Naxxramas",
				"text": "<b>Camouflage</b>\nGagne +1/+1 au début de votre tour."
			},
			"health": 2,
			"id": "FP1_005",
			"name": "Shade of Naxxramas",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Naxx",
			"text": "<b>Stealth.</b> At the start of your turn, gain +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_1.png",
			"fr": {
				"name": "Rafaam"
			},
			"health": 30,
			"id": "LOEA16_1",
			"name": "Rafaam",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "EX1_573b.png",
			"cost": 0,
			"fr": {
				"name": "Leçon de Shan’do",
				"text": "Invoque deux tréants 2/2 avec <b>Provocation</b>."
			},
			"id": "EX1_573b",
			"name": "Shan'do's Lesson",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Summon two 2/2 Treants with <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "TB_FactionWar_Herald.png",
			"cost": 1,
			"fr": {
				"name": "Hérold",
				"text": "<b>Râle d’agonie_:</b> inflige 1_à_4_points de dégâts à un adversaire aléatoire."
			},
			"health": 1,
			"id": "TB_FactionWar_Herald",
			"name": "Herold",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Deathrattle:</b> Deal 1-4 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "LOEA07_24.png",
			"cost": 1,
			"fr": {
				"name": "Leurre à pointes",
				"text": "<b>Provocation</b>\nNe peut pas attaquer."
			},
			"health": 6,
			"id": "LOEA07_24",
			"name": "Spiked Decoy",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Taunt</b>\nCan't attack.",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 1,
			"cardImage": "NEW1_017.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Crabe affamé",
				"text": "<b>Cri de guerre :</b> détruit un murloc et gagne +2/+2."
			},
			"health": 2,
			"id": "NEW1_017",
			"name": "Hungry Crab",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Destroy a Murloc and gain +2/+2.",
			"type": "Minion"
		},
		{
			"artist": "Chris Seaman",
			"attack": 4,
			"cardImage": "GVG_078.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Yéti mécanique",
				"text": "<b>Râle d’agonie :</b> donne une <b>Pièce détachée</b> à chaque joueur."
			},
			"health": 5,
			"id": "GVG_078",
			"name": "Mechanical Yeti",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Deathrattle:</b> Give each player a <b>Spare Part.</b>",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA10_3H.png",
			"cost": 0,
			"fr": {
				"name": "La colonie",
				"text": "<b>Pouvoir héroïque</b>\nConfère +1 PV à tous les œufs corrompus, puis en invoque un."
			},
			"id": "BRMA10_3H",
			"name": "The Rookery",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nGive all Corrupted Eggs +1 Health, then summon one.",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA17_2.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "BRMA17_2",
			"name": "Nefarian",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "TU4a_006.png",
			"fr": {
				"name": "Jaina Portvaillant"
			},
			"health": 30,
			"id": "TU4a_006",
			"name": "Jaina Proudmoore",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA04_02h.png",
			"cost": 0,
			"fr": {
				"name": "Fuyez !",
				"text": "Affrontez de nouveaux obstacles !"
			},
			"id": "LOEA04_02h",
			"name": "Escape!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Encounter new obstacles!",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "CRED_21.png",
			"cost": 1,
			"fr": {
				"name": "Bryan Chang",
				"text": "<b>Gourmet :</b> rend tous les serviteurs comestibles."
			},
			"health": 3,
			"id": "CRED_21",
			"name": "Bryan Chang",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Foodie:</b> Make all minions edible.",
			"type": "Minion"
		},
		{
			"cardImage": "KAR_A02_13H.png",
			"cost": 0,
			"fr": {
				"name": "Vous êtes notre invité",
				"text": "<b>Pouvoir héroïque</b>\nInvoque deux assiettes 1/1."
			},
			"id": "KAR_A02_13H",
			"name": "Be Our Guest",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nSummon two 1/1 Plates.",
			"type": "Hero_power"
		},
		{
			"cardImage": "FP1_023e.png",
			"fr": {
				"name": "Puissance de la ziggourat",
				"text": "+3 PV."
			},
			"id": "FP1_023e",
			"name": "Power of the Ziggurat",
			"playerClass": "Priest",
			"set": "Naxx",
			"text": "+3 Health.",
			"type": "Enchantment"
		},
		{
			"attack": 3,
			"cardImage": "KAR_A02_03H.png",
			"cost": 2,
			"fr": {
				"name": "Fourchette",
				"text": "Les assiettes ont <b>Charge</b>."
			},
			"health": 3,
			"id": "KAR_A02_03H",
			"name": "Fork",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Plates have <b>Charge</b>.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "BRMA02_2t.png",
			"cost": 1,
			"fr": {
				"name": "Spectateur sombrefer",
				"text": "<b>Provocation</b>"
			},
			"health": 1,
			"id": "BRMA02_2t",
			"name": "Dark Iron Spectator",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "Mekka3.png",
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Encourageur 3000",
				"text": "À la fin de votre tour, confère +1/+1 à un serviteur aléatoire."
			},
			"health": 4,
			"id": "Mekka3",
			"name": "Emboldener 3000",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Promo",
			"text": "At the end of your turn, give a random minion +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_14.png",
			"cost": 0,
			"fr": {
				"name": "Pipe de Khadgar",
				"text": "Place un sort aléatoire dans la main de chaque joueur. Le vôtre coûte (0) |4(cristal,cristaux) de mana."
			},
			"id": "LOEA16_14",
			"name": "Khadgar's Pipe",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Put a random spell into each player's hand.  Yours costs (0).",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "CRED_32.png",
			"cost": 2,
			"fr": {
				"name": "Jerry Mascho",
				"text": "Inflige 1 point de dégâts au début de votre tour. Si cette carte est dorée, inflige à la place 1 point de dégâts à la fin de votre tour. BLAGUE HAN SOLO."
			},
			"health": 2,
			"id": "CRED_32",
			"name": "Jerry Mascho",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "At the start of your turn, deal 1 damage. If this card is golden, deal 1 damage at the end of your turn instead. THIS IS A HAN SOLO JOKE.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "TB_SPT_Minion2.png",
			"cost": 2,
			"fr": {
				"name": "Étendard de bataille",
				"text": "Les serviteurs adjacents ont +2 ATQ."
			},
			"health": 2,
			"id": "TB_SPT_Minion2",
			"name": "Battle Standard",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Adjacent minions have +2 Attack.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "TB_KTRAF_12.png",
			"cost": 8,
			"fr": {
				"name": "Le Recousu",
				"text": "<b>Cri de guerre :</b> détruit un serviteur adverse aléatoire."
			},
			"health": 8,
			"id": "TB_KTRAF_12",
			"name": "Patchwerk",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "<b>Battlecry:</b> Destroy a random enemy minion.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "LOE_016t.png",
			"cost": 1,
			"fr": {
				"name": "Rocher",
				"text": "<b>Provocation</b>"
			},
			"health": 6,
			"id": "LOE_016t",
			"name": "Rock",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_11_Ench.png",
			"fr": {
				"name": "Fate 11 Ench. Murloc"
			},
			"id": "TB_PickYourFate_11_Ench",
			"name": "Fate 11 Ench. Murloc",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX14_02.png",
			"cost": 0,
			"fr": {
				"name": "Souffle de givre",
				"text": "<b>Pouvoir héroïque</b>\nDétruit tous les serviteurs\n adverses qui ne sont pas <b>gelés</b>."
			},
			"id": "NAX14_02",
			"name": "Frost Breath",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDestroy all enemy minions that aren't <b>Frozen</b>.",
			"type": "Hero_power"
		},
		{
			"artist": "Max Grecke",
			"attack": 1,
			"cardImage": "KAR_044a.png",
			"cost": 1,
			"fr": {
				"name": "Serveur"
			},
			"health": 1,
			"id": "KAR_044a",
			"name": "Steward",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA13_4H.png",
			"cost": 1,
			"fr": {
				"name": "Magie sauvage",
				"text": "<b>Pouvoir héroïque</b>\nPlace un sort aléatoire de la classe de votre adversaire dans votre main."
			},
			"id": "BRMA13_4H",
			"name": "Wild Magic",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nPut a random spell from your opponent's class into your hand.",
			"type": "Hero_power"
		},
		{
			"attack": 0,
			"cardImage": "NEW1_009.png",
			"cost": 1,
			"fr": {
				"name": "Totem de soins",
				"text": "À la fin de votre tour, rend 1 point de vie à tous vos serviteurs."
			},
			"health": 2,
			"id": "NEW1_009",
			"name": "Healing Totem",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"text": "At the end of your turn, restore 1 Health to all friendly minions.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_102_H1_AT_132.png",
			"cost": 2,
			"fr": {
				"name": "Défense stoïque",
				"text": "<b>Pouvoir héroïque</b>\nGagne 4 points d’armure."
			},
			"id": "CS2_102_H1_AT_132",
			"name": "Tank Up!",
			"playerClass": "Warrior",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nGain 4 Armor.",
			"type": "Hero_power"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 4,
			"cardImage": "EX1_572.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Ysera",
				"text": "À la fin de votre tour, ajoute une carte Rêve dans votre main."
			},
			"health": 12,
			"id": "EX1_572",
			"name": "Ysera",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "At the end of your turn, add a Dream Card to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"attack": 5,
			"cardImage": "LOE_012.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Pilleur de tombes",
				"text": "<b>Râle d’agonie :</b> ajoute une carte La pièce dans votre main."
			},
			"health": 4,
			"id": "LOE_012",
			"name": "Tomb Pillager",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Deathrattle:</b> Add a Coin to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "AT_067.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Magnataure alpha",
				"text": "Inflige également des dégâts aux serviteurs adjacents de celui qu’il attaque."
			},
			"health": 3,
			"id": "AT_067",
			"name": "Magnataur Alpha",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Also damages the minions next to whomever\nhe attacks.",
			"type": "Minion"
		},
		{
			"cardImage": "PART_006a.png",
			"fr": {
				"name": "Inversion",
				"text": "L’Attaque et la Vie ont été échangées par l’inverseur."
			},
			"id": "PART_006a",
			"name": "Switched",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Attack and Health have been swapped by Reversing Switch.",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_045e.png",
			"fr": {
				"name": "Brume surpuissante",
				"text": "+1/+1."
			},
			"id": "AT_045e",
			"name": "Empowering Mist",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 4,
			"cardImage": "OG_209.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Hallazèle l’Élevé",
				"text": "Chaque fois que vos sorts infligent des dégâts, rend l’équivalent sous forme de PV à votre héros."
			},
			"health": 6,
			"id": "OG_209",
			"name": "Hallazeal the Ascended",
			"playerClass": "Shaman",
			"rarity": "Legendary",
			"set": "Og",
			"text": "Whenever your spells deal damage, restore that much Health to your hero.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_09_05heroic.png",
			"cost": 4,
			"fr": {
				"name": "Invocation de Kil’rek",
				"text": "Invoque Kil’rek."
			},
			"id": "KARA_09_05heroic",
			"name": "Summon Kil'rek",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon Kil'rek.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA10_1.png",
			"fr": {
				"name": "Aileron-Géant"
			},
			"health": 30,
			"id": "LOEA10_1",
			"name": "Giantfin",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Dan Scott",
			"attack": 8,
			"cardImage": "KAR_711.png",
			"collectible": true,
			"cost": 12,
			"fr": {
				"name": "Géant arcanique",
				"text": "Coûte (1) |4(cristal,cristaux) de moins pour chaque sort que vous lancez pendant cette partie."
			},
			"health": 8,
			"id": "KAR_711",
			"name": "Arcane Giant",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Kara",
			"text": "[x]Costs (1) less for each spell\nyou've cast this game.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA09_3c.png",
			"cost": 0,
			"fr": {
				"name": "Faim",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un naga affamé 2/1."
			},
			"id": "LOEA09_3c",
			"name": "Getting Hungry",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\nSummon a 2/1 Hungry Naga.",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX13_03e.png",
			"fr": {
				"name": "État de supercharge",
				"text": "+2 PV."
			},
			"id": "NAX13_03e",
			"name": "Supercharged",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "+2 Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Bobby Chiu",
			"attack": 3,
			"cardImage": "BRM_019.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Client sinistre",
				"text": "Invoque un autre client sinistre chaque fois que ce serviteur survit aux dégâts qu’il subit."
			},
			"health": 3,
			"id": "BRM_019",
			"name": "Grim Patron",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Brm",
			"text": "Whenever this minion survives damage, summon another Grim Patron.",
			"type": "Minion"
		},
		{
			"artist": "Cole Eastburn",
			"attack": 2,
			"cardImage": "LOE_016.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Élémentaire grondant",
				"text": "Après avoir joué un serviteur avec <b>Cri de guerre</b>, inflige\n2 points de dégâts à un adversaire aléatoire."
			},
			"health": 6,
			"id": "LOE_016",
			"name": "Rumbling Elemental",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Loe",
			"text": "After you play a <b>Battlecry</b> minion, deal 2 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"artist": "Ben Zhang",
			"attack": 4,
			"cardImage": "EX1_284.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Drake azur",
				"text": "<b>Dégâts des sorts : +1</b>.\n<b>Cri de guerre :</b> vous piochez une carte."
			},
			"health": 4,
			"id": "EX1_284",
			"name": "Azure Drake",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"spellDamage": 1,
			"text": "<b>Spell Damage +1</b>. <b>Battlecry:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA11_2.png",
			"cost": 0,
			"fr": {
				"name": "Essence des Rouges",
				"text": "<b>Pouvoir héroïque</b>\nChaque joueur pioche 2 cartes."
			},
			"id": "BRMA11_2",
			"name": "Essence of the Red",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nEach player draws 2 cards.",
			"type": "Hero_power"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KTRAF_HP_RAF4.png",
			"cost": 2,
			"fr": {
				"name": "Deuxième morceau du bâton",
				"text": "Ajoute une carte épique aléatoire dans votre main. Elle coûte (3) cristaux de moins."
			},
			"id": "TB_KTRAF_HP_RAF4",
			"name": "Staff, Two Pieces",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Add a random epic card to your hand. It costs (3) less.",
			"type": "Hero_power"
		},
		{
			"cardImage": "NEW1_012o.png",
			"fr": {
				"name": "Gorgé de mana",
				"text": "Attaque augmentée."
			},
			"id": "NEW1_012o",
			"name": "Mana Gorged",
			"playerClass": "Mage",
			"set": "Expert1",
			"text": "Increased attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA13_3.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "BRMA13_3",
			"name": "Nefarian",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 1,
			"cardImage": "NAX9_05.png",
			"cost": 3,
			"durability": 3,
			"fr": {
				"name": "Lame runique",
				"text": "A +3 ATQ si les autres cavaliers sont morts."
			},
			"id": "NAX9_05",
			"name": "Runeblade",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Has +3 Attack if the other Horsemen are dead.",
			"type": "Weapon"
		},
		{
			"cardImage": "KARA_00_03H.png",
			"fr": {
				"name": "Medivh"
			},
			"health": 30,
			"id": "KARA_00_03H",
			"name": "Medivh",
			"playerClass": "Mage",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "EX1_583.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Prêtresse d’Élune",
				"text": "<b>Cri de guerre :</b> rend 4 points de vie à votre héros."
			},
			"health": 4,
			"id": "EX1_583",
			"name": "Priestess of Elune",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Restore 4 Health to your hero.",
			"type": "Minion"
		},
		{
			"cardImage": "TU4c_004.png",
			"cost": 2,
			"fr": {
				"name": "Piétinement",
				"text": "Inflige 2 points de dégâts à tous les adversaires."
			},
			"id": "TU4c_004",
			"name": "Stomp",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "Deal 2 damage to all enemies.",
			"type": "Spell"
		},
		{
			"artist": "Paul Mafayon",
			"cardImage": "AT_025.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Sombre marché",
				"text": "Détruit 2 serviteurs adverses aléatoires. Vous vous défaussez de\n2 cartes aléatoires."
			},
			"id": "AT_025",
			"name": "Dark Bargain",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Destroy 2 random enemy minions. Discard 2 random cards.",
			"type": "Spell"
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
			"artist": "Carl Critchlow",
			"attack": 1,
			"cardImage": "GVG_018.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Maîtresse de Douleur",
				"text": "Chaque fois que ce serviteur inflige des dégâts, rend l’équivalent sous forme de PV à votre héros."
			},
			"health": 4,
			"id": "GVG_018",
			"name": "Mistress of Pain",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Whenever this minion deals damage, restore that much Health to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Phil Saunders",
			"attack": 2,
			"cardImage": "GVG_006.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Méca-téléporteur",
				"text": "Vos Méca coûtent (1) |4(cristal,cristaux) de moins."
			},
			"health": 3,
			"id": "GVG_006",
			"name": "Mechwarper",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Your Mechs cost (1) less.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_145o.png",
			"fr": {
				"name": "Préparation",
				"text": "Le prochain sort que vous lancez pendant ce tour coûte (3) cristaux de moins."
			},
			"id": "EX1_145o",
			"name": "Preparation",
			"playerClass": "Rogue",
			"set": "Expert1",
			"text": "The next spell you cast this turn costs (3) less.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_5.png",
			"cost": 0,
			"fr": {
				"name": "Destin : sorts",
				"text": "Les sorts coûtent (1) |4(cristal,cristaux) de moins."
			},
			"id": "TB_PickYourFate_5",
			"name": "Fate: Spells",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Spells cost (1) less.",
			"type": "Spell"
		},
		{
			"cardImage": "NEW1_036e2.png",
			"fr": {
				"name": "Cri de commandement",
				"text": "Les points de vie de vos serviteurs ne peuvent pas passer en dessous de 1 ce tour-ci."
			},
			"id": "NEW1_036e2",
			"name": "Commanding Shout",
			"playerClass": "Warrior",
			"set": "Expert1",
			"text": "Your minions can't be reduced below 1 Health this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Trevor Jacobs",
			"cardImage": "EX1_571.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Force de la nature",
				"text": "Invoque trois tréants 2/2."
			},
			"id": "EX1_571",
			"name": "Force of Nature",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Summon three 2/2 Treants.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_019e.png",
			"fr": {
				"name": "Bénédiction du clerc",
				"text": "+1/+1."
			},
			"id": "EX1_019e",
			"name": "Cleric's Blessing",
			"playerClass": "Priest",
			"set": "Core",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_040e.png",
			"fr": {
				"name": "Âme sœur",
				"text": "+3 PV."
			},
			"id": "AT_040e",
			"name": "Kindred Spirit",
			"playerClass": "Druid",
			"set": "Tgt",
			"text": "+3 Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA04_01eh.png",
			"fr": {
				"name": "Enchantement de fuite du temple"
			},
			"id": "LOEA04_01eh",
			"name": "Temple Escape Enchant",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Matthew O'Connor",
			"cardImage": "OG_080d.png",
			"cost": 1,
			"fr": {
				"name": "Toxine d’églantine",
				"text": "Confère +3 ATQ à un serviteur."
			},
			"id": "OG_080d",
			"name": "Briarthorn Toxin",
			"playerClass": "Rogue",
			"set": "Og",
			"text": "Give a minion +3 Attack.",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "KARA_13_20.png",
			"cost": 3,
			"fr": {
				"name": "Élémentaire de fête",
				"text": "<b>Provocation.</b>\nSe déplace toujours en groupe_!"
			},
			"health": 2,
			"id": "KARA_13_20",
			"name": "Party Elemental",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Taunt.\n</b> Comes with a party!",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "AT_110.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Régisseur du Colisée",
				"text": "<b>Exaltation :</b> renvoie ce serviteur dans votre main."
			},
			"health": 5,
			"id": "AT_110",
			"name": "Coliseum Manager",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Return this minion to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 4,
			"cardImage": "EX1_043.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Drake du Crépuscule",
				"text": "<b>Cri de guerre :</b> gagne +1 PV pour chaque carte dans votre main."
			},
			"health": 1,
			"id": "EX1_043",
			"name": "Twilight Drake",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Gain +1 Health for each card in your hand.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "EX1_002.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Le Chevalier noir",
				"text": "<b>Cri de guerre :</b> détruit un serviteur adverse avec <b>Provocation</b>."
			},
			"health": 5,
			"id": "EX1_002",
			"name": "The Black Knight",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Destroy an enemy minion with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 3,
			"cardImage": "LOE_039.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gorillobot A-3",
				"text": "<b>Cri de guerre :</b> si vous contrôlez un autre Méca, <b>découvre</b> un nouveau Méca."
			},
			"health": 4,
			"id": "LOE_039",
			"name": "Gorillabot A-3",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Battlecry:</b> If you control another Mech, <b>Discover</b> a Mech.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA14_4H.png",
			"cost": 2,
			"fr": {
				"name": "Activer Toxitron",
				"text": "<b>Pouvoir héroïque</b>\nActive Toxitron !"
			},
			"id": "BRMA14_4H",
			"name": "Activate Toxitron",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nActivate Toxitron!",
			"type": "Hero_power"
		},
		{
			"attack": 0,
			"cardImage": "NAX6_03t.png",
			"cost": 0,
			"fr": {
				"name": "Spore",
				"text": "<b>Râle d’agonie :</b> donne +8 ATQ à tous les serviteurs adverses."
			},
			"health": 1,
			"id": "NAX6_03t",
			"name": "Spore",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Give all enemy minions +8 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_GP_01e_v2.png",
			"fr": {
				"name": "Camouflage de la tour des Ombres",
				"text": "<b>Camouflage</b>."
			},
			"id": "TB_GP_01e_v2",
			"name": "Shadow Tower Stealth",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Stealth</b>.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Ben Olson",
			"attack": 1,
			"cardImage": "EX1_522.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Assassin patient",
				"text": "<b>Camouflage</b>. Détruit tout serviteur blessé par ce serviteur."
			},
			"health": 1,
			"id": "EX1_522",
			"name": "Patient Assassin",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Stealth</b>. Destroy any minion damaged by this minion.",
			"type": "Minion"
		},
		{
			"artist": "J. Curtis Cranford",
			"attack": 1,
			"cardImage": "FP1_002.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Rampante hantée",
				"text": "<b>Râle d’agonie :</b> invoque deux araignées spectrales 1/1."
			},
			"health": 2,
			"id": "FP1_002",
			"name": "Haunted Creeper",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Summon two 1/1 Spectral Spiders.",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 4,
			"cardImage": "GVG_111.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Tête de Mimiron",
				"text": "Au début de votre tour, si vous avez au moins 3 Méca, les détruit tous pour former V-07-TR-0N."
			},
			"health": 5,
			"id": "GVG_111",
			"name": "Mimiron's Head",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "At the start of your turn, if you have at least 3 Mechs, destroy them all and form V-07-TR-0N.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_102.png",
			"cost": 2,
			"fr": {
				"name": "Gain d’armure !",
				"text": "<b>Pouvoir héroïque</b>\nConfère 2 points d’armure."
			},
			"id": "CS2_102",
			"name": "Armor Up!",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Hero Power</b>\nGain 2 Armor.",
			"type": "Hero_power"
		},
		{
			"artist": "Luke Mancini",
			"attack": 4,
			"cardImage": "EX1_033.png",
			"collectible": true,
			"cost": 6,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Harpie Furie-des-vents",
				"text": "<b>Furie des vents</b>"
			},
			"health": 5,
			"id": "EX1_033",
			"name": "Windfury Harpy",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"artist": "Velvet Engine",
			"attack": 5,
			"cardImage": "AT_045.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Aviana",
				"text": "Vos serviteurs coûtent\n(1) |4(cristal,cristaux)."
			},
			"health": 5,
			"id": "AT_045",
			"name": "Aviana",
			"playerClass": "Druid",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "Your minions cost (1).",
			"type": "Minion"
		},
		{
			"cardImage": "OG_254e.png",
			"fr": {
				"name": "Rassasié de secrets",
				"text": "Caractéristiques augmentées."
			},
			"id": "OG_254e",
			"name": "Secretly Sated",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Richie Marella",
			"attack": 2,
			"cardImage": "CS2_121.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Grunt loup-de-givre",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "CS2_121",
			"name": "Frostwolf Grunt",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "OG_104e.png",
			"fr": {
				"name": "Ombre étreinte",
				"text": "Vos effets de soins infligent des dégâts."
			},
			"id": "OG_104e",
			"name": "Embracing the Shadow",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Your healing effects are dealing damage.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TU4c_008.png",
			"cost": 3,
			"fr": {
				"name": "Volonté de Mukla",
				"text": "Rend 8 points de vie."
			},
			"id": "TU4c_008",
			"name": "Will of Mukla",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "Restore 8 Health.",
			"type": "Spell"
		},
		{
			"artist": "Arthur Bozonnet",
			"attack": 3,
			"cardImage": "AT_003.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Héros défunt",
				"text": "Votre pouvoir héroïque inflige 1 point de dégâts supplémentaire."
			},
			"health": 2,
			"id": "AT_003",
			"name": "Fallen Hero",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "Your Hero Power deals 1 extra damage.",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "AT_056.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Tir puissant",
				"text": "Inflige $2 |4(point,points) de dégâts à un serviteur et aux serviteurs adjacents."
			},
			"id": "AT_056",
			"name": "Powershot",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "Deal $2 damage to a minion and the minions next to it.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_410.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Heurt de bouclier",
				"text": "Inflige 1 point de dégâts à un serviteur pour chaque point d’Armure que vous avez."
			},
			"id": "EX1_410",
			"name": "Shield Slam",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Deal 1 damage to a minion for each Armor you have.",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"attack": 6,
			"cardImage": "GVG_062.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Gardien de cobalt",
				"text": "Chaque fois que vous invoquez un Méca, gagne <b>Bouclier divin</b>."
			},
			"health": 3,
			"id": "GVG_062",
			"name": "Cobalt Guardian",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Whenever you summon a Mech, gain <b>Divine Shield</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_001.png",
			"fr": {
				"name": "Échanger les PV des boss"
			},
			"id": "TB_001",
			"name": "Boss HP Swapper",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Justin Sweet",
			"cardImage": "EX1_365.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Colère divine",
				"text": "Vous piochez une carte et infligez des dégâts d’un montant égal à son coût."
			},
			"id": "EX1_365",
			"name": "Holy Wrath",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Draw a card and deal damage equal to its cost.",
			"type": "Spell"
		},
		{
			"artist": "Grace Liu",
			"attack": 1,
			"cardImage": "OG_051.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Ancien frappé d’interdit",
				"text": "<b>Cri de guerre :</b> dépense tous vos cristaux de mana. Gagne +1/+1 pour chaque cristal dépensé."
			},
			"health": 1,
			"id": "OG_051",
			"name": "Forbidden Ancient",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Battlecry:</b> Spend all your Mana. Gain +1/+1 for each mana spent.",
			"type": "Minion"
		},
		{
			"artist": "Mark Gibbons",
			"cardImage": "KARA_05_01h.png",
			"fr": {
				"name": "Grand Méchant Loup"
			},
			"health": 20,
			"id": "KARA_05_01h",
			"name": "Big Bad Wolf",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "TB_PickYourFate_1_Ench.png",
			"fr": {
				"name": "Pick Your Fate 1 Ench"
			},
			"id": "TB_PickYourFate_1_Ench",
			"name": "Pick Your Fate 1 Ench",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Sean McNally",
			"attack": 1,
			"cardImage": "KAR_044.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Moroes",
				"text": "<b>Camouflage</b>\nÀ la fin de votre tour, invoque un serveur_1/1."
			},
			"health": 1,
			"id": "KAR_044",
			"name": "Moroes",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Kara",
			"text": "<b>Stealth</b>\nAt the end of your turn, summon a 1/1 Steward.",
			"type": "Minion"
		},
		{
			"artist": "Evgeniy Zagumennyy",
			"attack": 2,
			"cardImage": "AT_087.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Cavalier d’Argent",
				"text": "<b>Charge</b>\n<b>Bouclier divin</b>"
			},
			"health": 1,
			"id": "AT_087",
			"name": "Argent Horserider",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Charge</b>\n<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 7,
			"cardImage": "LOE_092.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Prince voleur Rafaam",
				"text": "<b>Cri de guerre : découvre</b>\nun puissant artéfact."
			},
			"health": 8,
			"id": "LOE_092",
			"name": "Arch-Thief Rafaam",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "<b>Battlecry: Discover</b> a powerful Artifact.",
			"type": "Minion"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"cardImage": "PART_007.png",
			"cost": 1,
			"fr": {
				"name": "Lames tourbillonnantes",
				"text": "Donne +1 ATQ à un serviteur."
			},
			"id": "PART_007",
			"name": "Whirling Blades",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Give a minion +1 Attack.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA02_06.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : plus de Vœux",
				"text": "Gagne 2 Vœux."
			},
			"id": "LOEA02_06",
			"name": "Wish for More Wishes",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Gain 2 Wishes.",
			"type": "Spell"
		},
		{
			"cardImage": "CS1h_001.png",
			"cost": 2,
			"fr": {
				"name": "Soins inférieurs",
				"text": "<b>Pouvoir héroïque</b>\nRend #2 PV."
			},
			"id": "CS1h_001",
			"name": "Lesser Heal",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Hero Power</b>\nRestore #2 Health.",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_080ae.png",
			"fr": {
				"name": "Chardon sanglant",
				"text": "Coûte (2) cristaux de moins."
			},
			"id": "OG_080ae",
			"name": "Bloodthistle",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Costs (2) less.",
			"type": "Enchantment"
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
			"artist": "Dan Scott",
			"attack": 3,
			"cardImage": "AT_006.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Aspirant de Dalaran",
				"text": "<b>Exaltation :</b> vous gagnez <b>+1 aux dégâts des sorts</b>."
			},
			"health": 5,
			"id": "AT_006",
			"name": "Dalaran Aspirant",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Gain <b>Spell Damage +1</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "LOE_008H.png",
			"cost": 1,
			"fr": {
				"name": "Œil d’Hakkar",
				"text": "Pioche un secret dans le deck de votre adversaire et le place sur le champ de bataille."
			},
			"id": "LOE_008H",
			"name": "Eye of Hakkar",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Take a secret from your opponent's deck and put it into the battlefield.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_056.png",
			"cost": 0,
			"fr": {
				"name": "Silence and Destroy All Minions",
				"text": "Destroy all minions without triggering deathrattles."
			},
			"id": "XXX_056",
			"name": "Silence and Destroy All Minions",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Destroy all minions without triggering deathrattles.",
			"type": "Spell"
		},
		{
			"artist": "Nutthapon Petthai",
			"cardImage": "PART_006.png",
			"cost": 1,
			"fr": {
				"name": "Inverseur",
				"text": "Inverse l’Attaque et la Vie d’un serviteur."
			},
			"id": "PART_006",
			"name": "Reversing Switch",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Swap a minion's Attack and Health.",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "NEW1_003.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Pacte sacrificiel",
				"text": "Détruit un démon. Rend #5 PV à votre héros."
			},
			"id": "NEW1_003",
			"name": "Sacrificial Pact",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Core",
			"text": "Destroy a Demon. Restore #5 Health to your hero.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_01e.png",
			"fr": {
				"name": "Enchantement de fuite du temple"
			},
			"id": "LOEA04_01e",
			"name": "Temple Escape Enchant",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "KAR_070.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Colporteur éthérien",
				"text": "<b>Cri de guerre_:</b> réduit de (2) cristaux le coût des cartes d’autres classes dans votre main."
			},
			"health": 6,
			"id": "KAR_070",
			"name": "Ethereal Peddler",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Kara",
			"text": "[x]<b>Battlecry:</b> Reduce the Cost\nof cards in your hand from\nother classes by (2).",
			"type": "Minion"
		},
		{
			"artist": "Sam Nielsen",
			"attack": 3,
			"cardImage": "KAR_025c.png",
			"cost": 3,
			"fr": {
				"name": "Théière"
			},
			"health": 3,
			"id": "KAR_025c",
			"name": "Teapot",
			"playerClass": "Warlock",
			"set": "Kara",
			"type": "Minion"
		},
		{
			"artist": "Jakub Kasper",
			"cardImage": "KARA_00_04.png",
			"cost": 2,
			"fr": {
				"name": "Génie",
				"text": "<b>Pouvoir héroïque</b>\nVous piochez 3 cartes."
			},
			"id": "KARA_00_04",
			"name": "Brilliance",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nDraw 3 cards.",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOEA09_1.png",
			"fr": {
				"name": "Seigneur Ondulance"
			},
			"health": 30,
			"id": "LOEA09_1",
			"name": "Lord Slitherspear",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "BRM_010b.png",
			"cost": 0,
			"fr": {
				"name": "Forme de faucon-de-feu",
				"text": "Se transforme en un serviteur 2/5."
			},
			"id": "BRM_010b",
			"name": "Fire Hawk Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Brm",
			"text": "Transform into a 2/5 minion.",
			"type": "Spell"
		},
		{
			"artist": "Dave Allsop",
			"attack": 1,
			"cardImage": "KAR_030a.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Araignée du garde-manger",
				"text": "<b>Cri de guerre_:</b> invoque une araignée 1/3."
			},
			"health": 3,
			"id": "KAR_030a",
			"name": "Pantry Spider",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Summon a\n1/3 Spider.",
			"type": "Minion"
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
			"artist": "Tyler Walpole",
			"attack": 0,
			"cardImage": "EX1_315.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Portail d’invocation",
				"text": "Vos serviteurs coûtent (2) cristaux de moins, mais jamais moins\nde (1)."
			},
			"health": 4,
			"id": "EX1_315",
			"name": "Summoning Portal",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Your minions cost (2) less, but not less than (1).",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_008a.png",
			"cost": 0,
			"fr": {
				"name": "Connaissances anciennes",
				"text": "Vous piochez une carte."
			},
			"id": "NEW1_008a",
			"name": "Ancient Teachings",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Laurel Austin",
			"cardImage": "KARA_11_01.png",
			"fr": {
				"name": "Plaie-de-nuit"
			},
			"health": 30,
			"id": "KARA_11_01",
			"name": "Nightbane",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Jakub Kasber",
			"attack": 3,
			"cardImage": "OG_034.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Grouillant silithide",
				"text": "Ne peut attaquer que si votre héros a attaqué pendant ce tour."
			},
			"health": 5,
			"id": "OG_034",
			"name": "Silithid Swarmer",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Og",
			"text": "Can only attack if your hero attacked this turn.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"cardImage": "OG_195.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Feux follets funestes",
				"text": "<b>Choix des armes :</b> invoque sept feux follets 1/1 ou donne +2/+2 à vos serviteurs."
			},
			"id": "OG_195",
			"name": "Wisps of the Old Gods",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Choose One -</b> Summon seven 1/1 Wisps; or Give your minions +2/+2.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "NEW1_010.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Al’Akir, seigneur des Vents",
				"text": "<b>Furie des vents, Charge, Bouclier divin, Provocation</b>"
			},
			"health": 5,
			"id": "NEW1_010",
			"name": "Al'Akir the Windlord",
			"playerClass": "Shaman",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Windfury, Charge, Divine Shield, Taunt</b>",
			"type": "Minion"
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
			"artist": "Zoltan & Gabor",
			"cardImage": "AT_053.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Savoir ancestral",
				"text": "Vous piochez 2 cartes. <b>Surcharge :</b> (2)"
			},
			"id": "AT_053",
			"name": "Ancestral Knowledge",
			"overload": 2,
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Draw 2 cards. <b>Overload:</b> (2).",
			"type": "Spell"
		},
		{
			"cardImage": "KAR_037t.png",
			"fr": {
				"name": "Secrets de Karazhan",
				"text": "+1/+1 et <b>Provocation</b>."
			},
			"id": "KAR_037t",
			"name": "Secrets of Karazhan",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "+1/+1 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Justin Sweet",
			"attack": 4,
			"cardImage": "CS2_221.png",
			"collectible": true,
			"cost": 5,
			"faction": "HORDE",
			"fr": {
				"name": "Forgeron malveillant",
				"text": "<b>Accès de rage :</b> votre arme a +2 ATQ."
			},
			"health": 6,
			"id": "CS2_221",
			"name": "Spiteful Smith",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Enrage:</b> Your weapon has +2 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Mauro Cascioli",
			"cardImage": "DS1_184.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Pistage",
				"text": "Affiche les trois cartes du dessus du deck. Vous en piochez une et vous vous défaussez des autres."
			},
			"id": "DS1_184",
			"name": "Tracking",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"text": "Look at the top three cards of your deck. Draw one and discard the others.",
			"type": "Spell"
		},
		{
			"artist": "Howard Lyon",
			"cardImage": "CS2_025.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Explosion des Arcanes",
				"text": "Inflige $1 |4(point,points) de dégâts à tous les serviteurs adverses."
			},
			"id": "CS2_025",
			"name": "Arcane Explosion",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $1 damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA02_04.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : vaillance",
				"text": "<b>Découvre</b> une carte à (4) |4(cristal,cristaux) de mana."
			},
			"id": "LOEA02_04",
			"name": "Wish for Valor",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Discover</b> a (4)-Cost card.",
			"type": "Spell"
		},
		{
			"artist": "Brom",
			"attack": 6,
			"cardImage": "EX1_383.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Tirion Fordring",
				"text": "<b>Bouclier divin</b>. <b>Provocation</b>. <b>Râle d’agonie :</b> vous équipe de Porte-cendres 5/3."
			},
			"health": 6,
			"id": "EX1_383",
			"name": "Tirion Fordring",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Divine Shield</b>. <b>Taunt</b>. <b>Deathrattle:</b> Equip a 5/3 Ashbringer.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "TBST_002.png",
			"cost": 1,
			"fr": {
				"name": "Mage débutant",
				"text": "À la fin de votre tour, inflige 1 point de dégâts à un serviteur adverse aléatoire."
			},
			"health": 1,
			"id": "TBST_002",
			"name": "OLDN3wb Mage",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "At the end of your turn, deal 1 damage to random enemy minion.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_625t.png",
			"cost": 2,
			"fr": {
				"name": "Pointe mentale",
				"text": "<b>Pouvoir héroïque</b>\nInflige $2 points de dégâts."
			},
			"id": "EX1_625t",
			"name": "Mind Spike",
			"playerClass": "Priest",
			"set": "Expert1",
			"text": "<b>Hero Power</b>\nDeal $2 damage.",
			"type": "Hero_power"
		},
		{
			"artist": "Wayne Reynolds",
			"cardImage": "EX1_407.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Baston",
				"text": "Détruit tous les serviteurs sauf un <i>(choisi au hasard)</i>."
			},
			"id": "EX1_407",
			"name": "Brawl",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Destroy all minions except one. <i>(chosen randomly)</i>",
			"type": "Spell"
		},
		{
			"artist": "Mark Zug",
			"attack": 3,
			"cardImage": "AT_129.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Fjola Plaie-lumineuse",
				"text": "Chaque fois que <b>vous</b> ciblez ce serviteur avec un sort, gagne <b>Bouclier divin</b>."
			},
			"health": 4,
			"id": "AT_129",
			"name": "Fjola Lightbane",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "Whenever <b>you</b> target this minion with a spell, gain <b>Divine Shield.</b>",
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
			"playerClass": "Neutral",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_043.png",
			"cost": 0,
			"fr": {
				"name": "Mill 30",
				"text": "Put 30 cards from a hero's deck into his graveyard."
			},
			"id": "XXX_043",
			"name": "Mill 30",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Put 30 cards from a hero's deck into his graveyard.",
			"type": "Spell"
		},
		{
			"artist": "Ron Spencer",
			"attack": 4,
			"cardImage": "NEW1_014.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Maîtresse du déguisement",
				"text": "<b>Cri de guerre :</b> confère <b>Camouflage</b> à un serviteur allié jusqu’à votre prochain tour."
			},
			"health": 4,
			"id": "NEW1_014",
			"name": "Master of Disguise",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give a friendly minion <b>Stealth</b> until your next turn.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA05_3.png",
			"cost": 4,
			"fr": {
				"name": "Bombe vivante",
				"text": "Choisissez un serviteur adverse. Inflige $5 |4(point,points) de dégâts à tous les adversaires s’il survit jusqu’à votre prochain tour."
			},
			"id": "BRMA05_3",
			"name": "Living Bomb",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Choose an enemy minion. If it lives until your next turn, deal $5 damage to all enemies.",
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
				"name": "Long-voyant de Thrallmar",
				"text": "<b>Furie des vents</b>"
			},
			"health": 3,
			"id": "EX1_021",
			"name": "Thrallmar Farseer",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"artist": "Howard Lyon",
			"attack": 2,
			"cardImage": "FP1_010.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Maexxna",
				"text": "Détruit tout serviteur blessé par ce serviteur."
			},
			"health": 8,
			"id": "FP1_010",
			"name": "Maexxna",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "Destroy any minion damaged by this minion.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_073e2.png",
			"fr": {
				"name": "Sang froid",
				"text": "+4 ATQ."
			},
			"id": "CS2_073e2",
			"name": "Cold Blood",
			"playerClass": "Rogue",
			"set": "Expert1",
			"text": "+4 Attack.",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_24.png",
			"cost": 5,
			"fr": {
				"name": "Aileron-Géant",
				"text": "À la fin de votre tour, vous piochez jusqu’à avoir autant de cartes que votre adversaire."
			},
			"health": 5,
			"id": "LOEA16_24",
			"name": "Giantfin",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, draw until you have as many cards as your opponent.",
			"type": "Minion"
		},
		{
			"artist": "Kevin Chen",
			"cardImage": "AT_024.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Fusion démoniaque",
				"text": "Confère +3/+3 à un démon et un cristal de mana à votre adversaire."
			},
			"id": "AT_024",
			"name": "Demonfuse",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Give a Demon +3/+3. Give your opponent a Mana Crystal.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpv3_003.png",
			"cost": 0,
			"fr": {
				"name": "Chambardement",
				"text": "Échange les mains des joueurs."
			},
			"id": "TB_CoOpv3_003",
			"name": "Bamboozle",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Swap player's hands.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX1h_01.png",
			"fr": {
				"name": "Anub’Rekhan"
			},
			"health": 45,
			"id": "NAX1h_01",
			"name": "Anub'Rekhan",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA07_29.png",
			"cost": 1,
			"fr": {
				"name": "Lancer des rochers",
				"text": "<b>Pouvoir héroïque</b>\nInflige 3 points de dégâts à un serviteur adverse aléatoire."
			},
			"id": "LOEA07_29",
			"name": "Throw Rocks",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\n Deal 3 damage to a random enemy minion.",
			"type": "Hero_power"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 3,
			"cardImage": "GVG_102.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Technicien de Brikabrok",
				"text": "<b>Cri de guerre :</b> si vous avez un Méca, gagne +1/+1 et ajoute une <b>Pièce détachée</b> dans votre main."
			},
			"health": 3,
			"id": "GVG_102",
			"name": "Tinkertown Technician",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> If you have a Mech, gain +1/+1 and add a <b>Spare Part</b> to your hand.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "TBST_001.png",
			"cost": 1,
			"fr": {
				"name": "Tank débutant",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "TBST_001",
			"name": "OLDN3wb Tank",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 1,
			"cardImage": "EX1_008.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Écuyère d’Argent",
				"text": "<b>Bouclier divin</b>"
			},
			"health": 1,
			"id": "EX1_008",
			"name": "Argent Squire",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Divine Shield</b>",
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CRED_26.png",
			"cost": 3,
			"fr": {
				"name": "Eric Del Priore",
				"text": "A <b>Provocation</b> s’il est 3 heures du matin."
			},
			"health": 6,
			"id": "CRED_26",
			"name": "Eric Del Priore",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Has <b>Taunt</b> if it's 3 AM.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "TB_KTRAF_4.png",
			"cost": 4,
			"fr": {
				"name": "Gothik le Moissonneur",
				"text": "<b>Râle d’agonie :</b> invoque un Gothik spectral pour votre adversaire."
			},
			"health": 4,
			"id": "TB_KTRAF_4",
			"name": "Gothik the Harvester",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "<b>Deathrattle:</b> Summon a Spectral Gothik for your opponent.",
			"type": "Minion"
		},
		{
			"cardImage": "OG_223e.png",
			"fr": {
				"name": "Optimisme",
				"text": "+1/+2."
			},
			"id": "OG_223e",
			"name": "Optimism",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+1/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Cole Eastburn",
			"attack": 1,
			"cardImage": "OG_158.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Initié zélé",
				"text": "<b>Râle d’agonie :</b> confère +1/+1 à un serviteur allié aléatoire."
			},
			"health": 1,
			"id": "OG_158",
			"name": "Zealous Initiate",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Give a random friendly minion +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA09_2H.png",
			"cost": 2,
			"fr": {
				"name": "Enragé !",
				"text": "Donne +5 ATQ à votre héros pendant ce tour."
			},
			"id": "LOEA09_2H",
			"name": "Enraged!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Give your hero +5 attack this turn.",
			"type": "Hero_power"
		},
		{
			"artist": "Chippy",
			"attack": 4,
			"cardImage": "EX1_091.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Prêtresse de la Cabale",
				"text": "<b>Cri de guerre :</b> prend le contrôle d’un serviteur adverse avec 2 en Attaque ou moins."
			},
			"health": 5,
			"id": "EX1_091",
			"name": "Cabal Shadow Priest",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Take control of an enemy minion that has 2 or less Attack.",
			"type": "Minion"
		},
		{
			"artist": "Mike Franchina",
			"cardImage": "OG_198.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Guérison interdite",
				"text": "Dépense tout votre mana pour en rendre le double en points de vie."
			},
			"id": "OG_198",
			"name": "Forbidden Healing",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Og",
			"text": "Spend all your Mana. Restore twice that much Health.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_103e.png",
			"fr": {
				"name": "Mrghlglhal",
				"text": "+2 PV."
			},
			"id": "EX1_103e",
			"name": "Mrghlglhal",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+2 Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Wei Wang",
			"attack": 4,
			"cardImage": "AT_054.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Le mandebrume",
				"text": "<b>Cri de guerre :</b> donne\n+1/+1 à tous les serviteurs dans votre main et votre deck."
			},
			"health": 4,
			"id": "AT_054",
			"name": "The Mistcaller",
			"playerClass": "Shaman",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Give all minions in your hand and deck +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 4,
			"cardImage": "FP1_015.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Feugen",
				"text": "<b>Râle d’agonie :</b> si Stalagg est aussi mort pendant cette partie, invoque Thaddius."
			},
			"health": 7,
			"id": "FP1_015",
			"name": "Feugen",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> If Stalagg also died this game, summon Thaddius.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "AT_123.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Frissegueule",
				"text": "<b>Provocation</b>. <b>Râle d’agonie_:</b> inflige 3_points de dégâts à tous les serviteurs si vous avez un Dragon en main."
			},
			"health": 6,
			"id": "AT_123",
			"name": "Chillmaw",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "[x]<b>Taunt</b>\n<b>Deathrattle:</b> If you're holding\na Dragon, deal 3 damage\nto all minions.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "KAR_A10_05.png",
			"cost": 3,
			"fr": {
				"name": "Fou blanc",
				"text": "<b>Attaque automatique_:</b> rend 2_PV aux serviteurs adjacents."
			},
			"health": 6,
			"id": "KAR_A10_05",
			"name": "White Bishop",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Auto-Attack:</b> Restore 2 Health to adjacent minions.",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_011t.png",
			"fr": {
				"name": "Horion de lave",
				"text": "Les cartes que vous jouez pendant ce tour n’entraînent pas de <b>Surcharge</b>."
			},
			"id": "BRM_011t",
			"name": "Lava Shock",
			"playerClass": "Shaman",
			"set": "Brm",
			"text": "Cards you play this turn don't cause <b>Overload</b>.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "EX1_573t.png",
			"cost": 2,
			"fr": {
				"name": "Tréant",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "EX1_573t",
			"name": "Treant",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"attack": 5,
			"cardImage": "AT_012.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Rejeton des Ombres",
				"text": "<b>Exaltation :</b> inflige 4 points de dégâts à chaque héros."
			},
			"health": 4,
			"id": "AT_012",
			"name": "Spawn of Shadows",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Deal 4 damage to each hero.",
			"type": "Minion"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "OG_276.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Guerriers de sang",
				"text": "Place une copie de chaque serviteur allié blessé dans votre main."
			},
			"id": "OG_276",
			"name": "Blood Warriors",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Og",
			"text": "Add a copy of each damaged friendly minion to your hand.",
			"type": "Spell"
		},
		{
			"artist": "Karl Richardson",
			"attack": 2,
			"cardImage": "EX1_011.png",
			"collectible": true,
			"cost": 1,
			"faction": "HORDE",
			"fr": {
				"name": "Docteur vaudou",
				"text": "<b>Cri de guerre :</b> rend 2 points de vie."
			},
			"health": 1,
			"id": "EX1_011",
			"name": "Voodoo Doctor",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Battlecry:</b> Restore 2 Health.",
			"type": "Minion"
		},
		{
			"artist": "Doug Alexander",
			"attack": 3,
			"cardImage": "EX1_019.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Clerc du Soleil brisé",
				"text": "<b>Cri de guerre :</b> confère +1/+1 à un serviteur allié."
			},
			"health": 2,
			"id": "EX1_019",
			"name": "Shattered Sun Cleric",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Give a friendly minion +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Stanley Lau",
			"attack": 2,
			"cardImage": "BRM_010.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Druidesse de la Flamme",
				"text": "<b>Choix des armes :</b> se transforme en un serviteur 5/2 ou en un serviteur 2/5."
			},
			"health": 2,
			"id": "BRM_010",
			"name": "Druid of the Flame",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Brm",
			"text": "<b>Choose One</b> - Transform into a 5/2 minion; or a 2/5 minion.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_366e.png",
			"fr": {
				"name": "Justice rendue",
				"text": "A +1/+1."
			},
			"id": "EX1_366e",
			"name": "Justice Served",
			"playerClass": "Paladin",
			"set": "Expert1",
			"text": "Has +1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_104a.png",
			"fr": {
				"name": "CADEAU BONUS",
				"text": "+2/+2."
			},
			"id": "GVG_104a",
			"name": "HERE, TAKE BUFF.",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_ClassRandom_Warrior.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : guerrier",
				"text": "Ajoute des cartes de guerrier dans votre deck."
			},
			"id": "TB_ClassRandom_Warrior",
			"name": "Second Class: Warrior",
			"playerClass": "Warrior",
			"set": "Tb",
			"text": "Add Warrior cards to your deck.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "GVG_010.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Choix de Velen",
				"text": "Confère à un serviteur +2/+4 et <b>+1 aux dégâts des sorts</b>."
			},
			"id": "GVG_010",
			"name": "Velen's Chosen",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Give a minion +2/+4 and <b>Spell Damage +1</b>.",
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
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"cardImage": "TB_Coopv3_102a.png",
			"cost": 0,
			"fr": {
				"name": "Secrets de l’ombre",
				"text": "Chaque joueur pioche 2 cartes."
			},
			"id": "TB_Coopv3_102a",
			"name": "Secrets of Shadow",
			"playerClass": "Priest",
			"set": "Tb",
			"text": "Each player draws 2 cards.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_030.png",
			"cost": 0,
			"fr": {
				"name": "Opponent Disconnect",
				"text": "Force your opponnet to disconnect."
			},
			"id": "XXX_030",
			"name": "Opponent Disconnect",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Force your opponnet to disconnect.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_074e.png",
			"fr": {
				"name": "Poison mortel",
				"text": "+2 ATQ."
			},
			"id": "CS2_074e",
			"name": "Deadly Poison",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA05_2.png",
			"cost": 0,
			"fr": {
				"name": "Mana enflammé",
				"text": "<b>Pouvoir héroïque</b>\nInflige 5 points de dégâts au héros adverse s’il lui reste des cristaux de mana inutilisés."
			},
			"id": "BRMA05_2",
			"name": "Ignite Mana",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nDeal 5 damage to the enemy hero if they have any unspent Mana.",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_178b.png",
			"cost": 0,
			"fr": {
				"name": "Déraciner",
				"text": "+5 ATQ."
			},
			"id": "EX1_178b",
			"name": "Uproot",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "+5 Attack.",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "TBST_005.png",
			"cost": 3,
			"fr": {
				"name": "Voleur JcJ",
				"text": "<b>Camouflage</b>\nRécupère <b>Camouflage</b> quand le voleur JcJ détruit un serviteur."
			},
			"health": 6,
			"id": "TBST_005",
			"name": "OLDPvP Rogue",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Stealth</b>\nRegain <b>Stealth</b> when PvP Rogue kills a minion.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "CRED_36.png",
			"cost": 6,
			"fr": {
				"name": "Mike Donais",
				"text": "<b>Cri de guerre :</b> remplace tous les serviteurs sur le champ de bataille, dans les mains et les decks des deux joueurs par des serviteurs aléatoires."
			},
			"health": 8,
			"id": "CRED_36",
			"name": "Mike Donais",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Replace all minions in the battlefield, in both hands, and in both decks with random minions.",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"cardImage": "KARA_08_02.png",
			"cost": 2,
			"fr": {
				"name": "Rage du Néant",
				"text": "<b>Pouvoir héroïque</b>\nDonne +3 ATQ à votre héros pendant ce tour."
			},
			"id": "KARA_08_02",
			"name": "Nether Rage",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nGive your hero +3 Attack this turn.",
			"type": "Hero_power"
		},
		{
			"artist": "Lars Grant-West",
			"cardImage": "CS2_053e.png",
			"fr": {
				"name": "Double vue",
				"text": "Une de vos cartes coûte (3) cristaux de moins."
			},
			"id": "CS2_053e",
			"name": "Far Sight",
			"playerClass": "Shaman",
			"set": "Expert1",
			"text": "One of your cards costs (3) less.",
			"type": "Enchantment"
		},
		{
			"cardImage": "KARA_12_02H.png",
			"cost": 0,
			"fr": {
				"name": "Lignes telluriques",
				"text": "<b>Pouvoir héroïque passif</b>\nLes deux héros ont <b>+5_aux Dégâts des sorts</b>."
			},
			"id": "KARA_12_02H",
			"name": "Ley Lines",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "[x]<b>Passive Hero Power</b>\nBoth players have\n<b>Spell Damage +5</b>.",
			"type": "Hero_power"
		},
		{
			"cardImage": "AT_077e.png",
			"fr": {
				"name": "Pique supplémentaire",
				"text": "+1 Durabilité."
			},
			"id": "AT_077e",
			"name": "Extra Poke",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+1 Durability.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_YoggServant_Enchant.png",
			"fr": {
				"name": "Enchantement de héros par serviteur de Yogg"
			},
			"id": "TB_YoggServant_Enchant",
			"name": "Yogg Servant Hero Enchant",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "AT_132_SHAMANc.png",
			"cost": 0,
			"fr": {
				"name": "Totem de griffes de pierre",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "AT_132_SHAMANc",
			"name": "Stoneclaw Totem",
			"playerClass": "Shaman",
			"set": "Tgt",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Wei Wang",
			"attack": 3,
			"cardImage": "EX1_049.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Jeune maître brasseur",
				"text": "<b>Cri de guerre :</b> renvoie un serviteur allié du champ de bataille et le place dans votre main."
			},
			"health": 2,
			"id": "EX1_049",
			"name": "Youthful Brewmaster",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Return a friendly minion from the battlefield to your hand.",
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_409e.png",
			"fr": {
				"name": "Améliorée",
				"text": "+1 ATQ et +1 Durabilité."
			},
			"id": "EX1_409e",
			"name": "Upgraded",
			"playerClass": "Warrior",
			"set": "Expert1",
			"text": "+1 Attack and +1 Durability.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_7.png",
			"cost": 0,
			"fr": {
				"name": "Destin : La pièce",
				"text": "Quand un serviteur meurt, son propriétaire obtient une carte La pièce."
			},
			"id": "TB_PickYourFate_7",
			"name": "Fate: Coin",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "When a minion dies, its owner gets a Coin.",
			"type": "Spell"
		},
		{
			"artist": "Justin Sweet",
			"cardImage": "CS2_039.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Furie des vents",
				"text": "Confère <b>Furie des vents</b> à un serviteur."
			},
			"id": "CS2_039",
			"name": "Windfury",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"text": "Give a minion <b>Windfury</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "FP1_020e.png",
			"fr": {
				"name": "Vengeance",
				"text": "+3/+2."
			},
			"id": "FP1_020e",
			"name": "Vengeance",
			"playerClass": "Paladin",
			"set": "Naxx",
			"text": "+3/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Josh Tallman",
			"cardImage": "CS2_026.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Nova de givre",
				"text": "<b>Gèle</b> tous les serviteurs adverses."
			},
			"id": "CS2_026",
			"name": "Frost Nova",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Freeze</b> all enemy minions.",
			"type": "Spell"
		},
		{
			"cardImage": "OG_051e.png",
			"fr": {
				"name": "Pouvoir interdit",
				"text": "Caractéristiques augmentées."
			},
			"id": "OG_051e",
			"name": "Forbidden Power",
			"playerClass": "Druid",
			"set": "Og",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Gaser",
			"cardImage": "EX1_302.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Voile de mort",
				"text": "Inflige $1 |4(point,points) de dégâts à un serviteur. Vous piochez une carte si ce serviteur est tué."
			},
			"id": "EX1_302",
			"name": "Mortal Coil",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $1 damage to a minion. If that kills it, draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Daarken",
			"cardImage": "EX1_621.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Cercle de soins",
				"text": "Rend #4 |4(point,points) de vie à TOUS les serviteurs."
			},
			"id": "EX1_621",
			"name": "Circle of Healing",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Restore #4 Health to ALL minions.",
			"type": "Spell"
		},
		{
			"artist": "Ben Olson",
			"attack": 3,
			"cardImage": "GVG_108.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Recombobulateur",
				"text": "<b>Cri de guerre :</b> transforme un serviteur allié en un serviteur aléatoire de même coût."
			},
			"health": 2,
			"id": "GVG_108",
			"name": "Recombobulator",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Transform a friendly minion into a random minion with the same Cost.",
			"type": "Minion"
		},
		{
			"artist": "Alex Konstad",
			"cardImage": "LOE_104.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Ensevelir",
				"text": "Choisit un serviteur adverse.\nLe place dans votre deck."
			},
			"id": "LOE_104",
			"name": "Entomb",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Loe",
			"text": "Choose an enemy minion.\nShuffle it into your deck.",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "BRMA14_5.png",
			"cost": 1,
			"fr": {
				"name": "Toxitron",
				"text": "Inflige 1 point de dégâts à tous les autres serviteurs au début de votre tour."
			},
			"health": 3,
			"id": "BRMA14_5",
			"name": "Toxitron",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "At the start of your turn, deal 1 damage to all other minions.",
			"type": "Minion"
		},
		{
			"artist": "Samwise",
			"attack": 10,
			"cardImage": "OG_042.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Y’Shaarj, la rage déchaînée",
				"text": "À la fin de votre tour, place un serviteur de votre deck sur le champ de bataille."
			},
			"health": 10,
			"id": "OG_042",
			"name": "Y'Shaarj, Rage Unbound",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "At the end of your turn, put a minion from your deck into the battlefield.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Josh Harris",
			"attack": 9,
			"cardImage": "GVG_077.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Golem d’anima",
				"text": "À la fin de chaque tour, détruit ce serviteur si c’est le seul que vous avez."
			},
			"health": 9,
			"id": "GVG_077",
			"name": "Anima Golem",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "At the end of each turn, destroy this minion if it's your only one.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_2H.png",
			"cost": 0,
			"fr": {
				"name": "Affliction de l’espèce",
				"text": "<b>Pouvoir héroïque</b>\nAjoute une carte Affliction de l’espèce dans la main de votre adversaire à la fin de votre tour."
			},
			"id": "BRMA12_2H",
			"name": "Brood Affliction",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nAt the end of your turn, add a Brood Affliction card to your opponent's hand.",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_PickYourFate_2.png",
			"cost": 0,
			"fr": {
				"name": "Destin : bananes",
				"text": "Quand un serviteur meurt, son propriétaire obtient une carte Banane à (1) |4(cristal,cristaux) de mana."
			},
			"id": "TB_PickYourFate_2",
			"name": "Fate: Bananas",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "When a minion dies, its owner gets a (1) mana Banana.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "KARA_13_01.png",
			"fr": {
				"name": "Nazra Hache-Furieuse"
			},
			"health": 15,
			"id": "KARA_13_01",
			"name": "Nazra Wildaxe",
			"playerClass": "Warrior",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Michael Sutfin",
			"cardImage": "GVG_052.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Écraser",
				"text": "Détruit un serviteur. Si vous avez un serviteur blessé, cette carte coûte (4) cristaux de moins."
			},
			"id": "GVG_052",
			"name": "Crush",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Destroy a minion. If you have a damaged minion, this costs (4) less.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "BRMA16_5.png",
			"cost": 1,
			"durability": 6,
			"fr": {
				"name": "Dent-de-Dragon",
				"text": "Gagne +1 ATQ chaque fois que votre adversaire joue une carte."
			},
			"id": "BRMA16_5",
			"name": "Dragonteeth",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Whenever your opponent plays a card, gain +1 Attack.",
			"type": "Weapon"
		},
		{
			"cardImage": "AT_132_ROGUE.png",
			"cost": 2,
			"fr": {
				"name": "Dagues empoisonnées",
				"text": "<b>Pouvoir héroïque</b>\nÉquipe d’une arme 2/2."
			},
			"id": "AT_132_ROGUE",
			"name": "Poisoned Daggers",
			"playerClass": "Rogue",
			"set": "Tgt",
			"text": "<b>Hero Power</b>\nEquip a 2/2 Weapon.",
			"type": "Hero_power"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_155.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Marque de la nature",
				"text": "<b>Choix des armes :</b> donne +4 ATQ à un serviteur ou +4 PV et <b>Provocation</b>."
			},
			"id": "EX1_155",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Choose One</b> - Give a minion +4 Attack; or +4 Health and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_004e.png",
			"fr": {
				"name": "Mot de pouvoir : Bouclier",
				"text": "+2 PV."
			},
			"id": "CS2_004e",
			"name": "Power Word: Shield",
			"playerClass": "Priest",
			"set": "Core",
			"text": "+2 Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA16_7.png",
			"cost": 0,
			"fr": {
				"name": "Esquille de bénédiction",
				"text": "Rend #10 PV à TOUS les personnages."
			},
			"id": "LOEA16_7",
			"name": "Benediction Splinter",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Restore #10 Health to ALL characters.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA15_2.png",
			"cost": 0,
			"fr": {
				"name": "L’alchimiste",
				"text": "<b>Pouvoir héroïque passif</b>\nChaque fois qu’un serviteur est invoqué, échange son Attaque et sa Vie."
			},
			"id": "BRMA15_2",
			"name": "The Alchemist",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Passive Hero Power</b>\nWhenever a minion is summoned, swap its Attack and Health.",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_604o.png",
			"fr": {
				"name": "Berserk",
				"text": "Attaque augmentée."
			},
			"id": "EX1_604o",
			"name": "Berserk",
			"playerClass": "Warrior",
			"set": "Expert1",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 4,
			"cardImage": "EX1_593.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Lamenuit",
				"text": "<b>Cri de guerre :</b> inflige 3 points de dégâts au héros adverse."
			},
			"health": 4,
			"id": "EX1_593",
			"name": "Nightblade",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Battlecry: </b>Deal 3 damage to the enemy hero.",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"cardImage": "CS2_076.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Assassiner",
				"text": "Détruit un serviteur adverse."
			},
			"id": "CS2_076",
			"name": "Assassinate",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"text": "Destroy an enemy minion.",
			"type": "Spell"
		},
		{
			"artist": "Steve Hui",
			"cardImage": "EX1_246.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maléfice",
				"text": "Transforme un serviteur en grenouille 0/1 avec <b>Provocation</b>."
			},
			"id": "EX1_246",
			"name": "Hex",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"text": "Transform a minion into a 0/1 Frog with <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"attack": 10,
			"cardImage": "CRED_13.png",
			"cost": 10,
			"fr": {
				"name": "Brian Schwab",
				"text": "À la fin de votre tour, confère +1 Attaque à un serviteur aléatoire."
			},
			"health": 10,
			"id": "CRED_13",
			"name": "Brian Schwab",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "At the end of your turn, give a random minion +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "LOE_007t.png",
			"cost": 2,
			"fr": {
				"name": "Maudit !",
				"text": "Vous subissez 2 points de dégâts au début de votre tour tant que vous avez cette carte dans votre main."
			},
			"id": "LOE_007t",
			"name": "Cursed!",
			"playerClass": "Warlock",
			"set": "Loe",
			"text": "While this is in your hand, take 2 damage at the start of your turn.",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "CRED_08.png",
			"cost": 3,
			"fr": {
				"name": "Ben Brode",
				"text": "Vous ne pouvez pas baisser le volume en dessous du maximum."
			},
			"health": 1,
			"id": "CRED_08",
			"name": "Ben Brode",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Your volume can't be reduced below maximum.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Hideaki Takamura",
			"attack": 1,
			"cardImage": "EX1_055.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Accro au mana",
				"text": "Chaque fois que vous lancez un sort, gagne +2 ATQ pendant ce tour."
			},
			"health": 3,
			"id": "EX1_055",
			"name": "Mana Addict",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Whenever you cast a spell, gain +2 Attack this turn.",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "CRED_19.png",
			"cost": 4,
			"fr": {
				"name": "Beomki Hong",
				"text": "<b>Provocation</b>. Les serviteurs alliés ne peuvent pas être <b>gelés</b>."
			},
			"health": 3,
			"id": "CRED_19",
			"name": "Beomki Hong",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Taunt.</b> Friendly minions can’t be <b>Frozen.</b>",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_017e.png",
			"fr": {
				"name": "Ventre plein",
				"text": "+2/+2. Rassasié."
			},
			"id": "NEW1_017e",
			"name": "Full Belly",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+2/+2.  Full of Murloc.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA11_1.png",
			"fr": {
				"name": "Vaelastrasz le Corrompu"
			},
			"health": 30,
			"id": "BRMA11_1",
			"name": "Vaelastrasz the Corrupt",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
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
			"cardImage": "DS1_178e.png",
			"fr": {
				"name": "Charge",
				"text": "Le rhino de la toundra confère <b>Charge</b>."
			},
			"id": "DS1_178e",
			"name": "Charge",
			"playerClass": "Hunter",
			"set": "Core",
			"text": "Tundra Rhino grants <b>Charge</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 2,
			"cardImage": "EX1_166.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gardien du bosquet",
				"text": "<b>Choix des armes :</b> inflige 2 points de dégâts ou réduit au <b>Silence</b> un serviteur."
			},
			"health": 2,
			"id": "EX1_166",
			"name": "Keeper of the Grove",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Choose One</b> - Deal 2 damage; or <b>Silence</b> a minion.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_29a.png",
			"cost": 0,
			"fr": {
				"name": "Toucher",
				"text": "Rend 10 PV à votre héros."
			},
			"id": "LOEA04_29a",
			"name": "Touch It",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Restore 10 Health to your hero.",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "GVG_072.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Boxeur de l’ombre",
				"text": "Chaque fois qu’un personnage est soigné, inflige 1 point de dégâts à un adversaire aléatoire."
			},
			"health": 3,
			"id": "GVG_072",
			"name": "Shadowboxer",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Whenever a character is healed, deal 1 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"artist": "Ruan Jia",
			"attack": 7,
			"cardImage": "GVG_042.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Neptulon",
				"text": "<b>Cri de guerre :</b> ajoute 4 murlocs aléatoires dans votre main.\n<b>Surcharge :</b> (3)"
			},
			"health": 7,
			"id": "GVG_042",
			"name": "Neptulon",
			"overload": 3,
			"playerClass": "Shaman",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Add 4 random Murlocs to your hand. <b>Overload:</b> (3)",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_09_05.png",
			"cost": 4,
			"fr": {
				"name": "Invocation de Kil’rek",
				"text": "Invoque Kil’rek."
			},
			"id": "KARA_09_05",
			"name": "Summon Kil'rek",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon Kil'rek.",
			"type": "Spell"
		},
		{
			"artist": "Wei Wang",
			"attack": 4,
			"cardImage": "KAR_061.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Le conservateur",
				"text": "<b>Provocation</b>. <b>Cri de guerre_:</b> vous piochez une Bête, un Dragon et un Murloc dans votre deck."
			},
			"health": 6,
			"id": "KAR_061",
			"name": "The Curator",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Kara",
			"text": "<b>Taunt</b>\n<b>Battlecry:</b> Draw a Beast, Dragon, and Murloc from your deck.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_06b.png",
			"cost": 0,
			"fr": {
				"name": "Traverser avec précaution",
				"text": "Subit 5 points de dégâts."
			},
			"id": "LOEA04_06b",
			"name": "Walk Across Gingerly",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Take 5 damage.",
			"type": "Spell"
		},
		{
			"artist": "Chris Seaman",
			"attack": 4,
			"cardImage": "GVG_111t.png",
			"cost": 8,
			"fr": {
				"name": "V-07-TR-0N",
				"text": "<b>Charge</b>\n<b>Méga furie des vents</b>\n<i>(Peut attaquer quatre fois par tour.)</i>"
			},
			"health": 8,
			"id": "GVG_111t",
			"name": "V-07-TR-0N",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "<b>Charge</b>\n<b>Mega-Windfury</b> <i>(Can attack four times a turn.)</i>",
			"type": "Minion"
		},
		{
			"artist": "Raplph Horsley",
			"attack": 1,
			"cardImage": "KAR_062.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Biographe de Dédain-du-Néant",
				"text": "<b>Cri de guerre_:</b> <b>découvre</b> un Dragon si vous en avez déjà un en main."
			},
			"health": 3,
			"id": "KAR_062",
			"name": "Netherspite Historian",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, <b>Discover</b>\na Dragon.",
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
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "LOEA09_6.png",
			"cost": 2,
			"fr": {
				"name": "Archer ondulant",
				"text": "<b>Cri de guerre :</b> inflige 1 point de dégâts."
			},
			"health": 2,
			"id": "LOEA09_6",
			"name": "Slithering Archer",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Battlecry:</b> Deal 1 damage.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_109e.png",
			"fr": {
				"name": "Exalté",
				"text": "Peut attaquer pendant ce tour."
			},
			"id": "AT_109e",
			"name": "Inspired",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "Can attack this turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_023t.png",
			"fr": {
				"name": "Fusion primordiale",
				"text": "Caractéristiques augmentées."
			},
			"id": "OG_023t",
			"name": "Primally Infused",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA04_06.png",
			"cost": 0,
			"fr": {
				"name": "Fosse remplie de pointes",
				"text": "<b>Choisissez un chemin !</b>"
			},
			"id": "LOEA04_06",
			"name": "Pit of Spikes",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Choose Your Path!</b>",
			"type": "Spell"
		},
		{
			"artist": "Trent Kaniuga",
			"cardImage": "OG_081.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Fracasser",
				"text": "Détruit un serviteur <b>gelé</b>."
			},
			"id": "OG_081",
			"name": "Shatter",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Og",
			"text": "Destroy a <b>Frozen</b> minion.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpv3_101e.png",
			"fr": {
				"name": "Enchantement de joueur d’équipe",
				"text": "<b>Insensible</b> pendant qu’il attaque."
			},
			"id": "TB_CoOpv3_101e",
			"name": "Team Player Enchantment",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Immune</b> ahile attacking",
			"type": "Enchantment"
		},
		{
			"artist": "Garrett Hanna",
			"attack": 3,
			"cardImage": "KAR_114.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Barnes",
				"text": "<b>Cri de guerre_:</b> invoque une copie 1/1 d’un serviteur aléatoire dans votre deck."
			},
			"health": 4,
			"id": "KAR_114",
			"name": "Barnes",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Summon a 1/1 copy of a random minion in your deck.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_178be.png",
			"fr": {
				"name": "Déraciné",
				"text": "+5 Attaque."
			},
			"id": "EX1_178be",
			"name": "Uprooted",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "+5 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Milivoj Ceran",
			"cardImage": "LOE_019t.png",
			"cost": 2,
			"fr": {
				"name": "Carte du singe doré",
				"text": "Place la carte Singe doré dans votre deck. Vous piochez une carte."
			},
			"id": "LOE_019t",
			"name": "Map to the Golden Monkey",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Shuffle the Golden Monkey into your deck. Draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "LOE_111.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Mal déterré",
				"text": "Inflige $3 |4(point,points) de dégâts à tous les serviteurs.\nPlace cette carte dans le deck de votre adversaire."
			},
			"id": "LOE_111",
			"name": "Excavated Evil",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Loe",
			"text": "Deal $3 damage to all minions.\nShuffle this card into your opponent's deck.",
			"type": "Spell"
		},
		{
			"attack": 20,
			"cardImage": "BRMC_95.png",
			"cost": 50,
			"fr": {
				"name": "Golemagg",
				"text": "Coûte (1) cristal de moins pour chaque point de dégâts subi par votre héros."
			},
			"health": 20,
			"id": "BRMC_95",
			"name": "Golemagg",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Costs (1) less for each damage your hero has taken.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_5.png",
			"cost": 10,
			"fr": {
				"name": "Miroir du destin",
				"text": "Remplit votre plateau de momies zombies 3/3."
			},
			"id": "LOEA16_5",
			"name": "Mirror of Doom",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Fill your board with 3/3 Mummy Zombies.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "XXX_097.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - Destroy Minions",
				"text": "Spawn into play to destroy all minions."
			},
			"health": 1,
			"id": "XXX_097",
			"name": "AI Buddy - Destroy Minions",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Spawn into play to destroy all minions.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "BRM_005.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Courroux démoniaque",
				"text": "Inflige $2 |4(point,points) de dégâts à tous les serviteurs qui ne sont pas des démons."
			},
			"id": "BRM_005",
			"name": "Demonwrath",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Brm",
			"text": "Deal $2 damage to all non-Demon minions.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX3_02.png",
			"cost": 3,
			"fr": {
				"name": "Entoilage",
				"text": "<b>Pouvoir héroïque</b>\nRenvoie un serviteur adverse aléatoire dans la main de votre adversaire."
			},
			"id": "NAX3_02",
			"name": "Web Wrap",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nReturn a random enemy minion to your opponent's hand.",
			"type": "Hero_power"
		},
		{
			"artist": "Nate Bowden",
			"attack": 5,
			"cardImage": "FP1_026.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Embusqué anub’ar",
				"text": "<b>Râle d’agonie :</b> renvoie un serviteur allié aléatoire dans votre main."
			},
			"health": 5,
			"id": "FP1_026",
			"name": "Anub'ar Ambusher",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Return a random friendly minion to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Konstantin Turovec",
			"attack": 3,
			"cardImage": "KAR_094.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Fourchette mortelle",
				"text": "<b>Râle d’agonie_:</b> ajoute une arme 3/2 dans votre main."
			},
			"health": 2,
			"id": "KAR_094",
			"name": "Deadly Fork",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Deathrattle:</b> Add a 3/2 weapon to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"attack": 1,
			"cardImage": "FP1_028.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Fossoyeur",
				"text": "Gagne +1 ATQ chaque fois que vous invoquez un serviteur avec <b>Râle d’agonie</b>."
			},
			"health": 2,
			"id": "FP1_028",
			"name": "Undertaker",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Naxx",
			"text": "Whenever you summon a minion with <b>Deathrattle</b>, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 4,
			"cardImage": "LOE_061.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Sentinelle Anubisath",
				"text": "<b>Râle d’agonie :</b> donne +3/+3 à un serviteur allié aléatoire."
			},
			"health": 4,
			"id": "LOE_061",
			"name": "Anubisath Sentinel",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Deathrattle:</b> Give a random friendly minion +3/+3.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_173.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Feu stellaire",
				"text": "Inflige $5 |4(point,points) de dégâts.\nVous piochez une carte."
			},
			"id": "EX1_173",
			"name": "Starfire",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $5 damage.\nDraw a card.",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_18.png",
			"cost": 5,
			"fr": {
				"name": "Zinaar",
				"text": "Vous gagnez un Vœu à la fin de votre tour."
			},
			"health": 5,
			"id": "LOEA16_18",
			"name": "Zinaar",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, gain a wish.",
			"type": "Minion"
		},
		{
			"attack": 9,
			"cardImage": "CRED_35.png",
			"cost": 4,
			"fr": {
				"name": "Max McCall",
				"text": "Vos emotes n’ont pas de temps de recharge et ne peuvent être coupées."
			},
			"health": 2,
			"id": "CRED_35",
			"name": "Max McCall",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Your emotes have no cooldown and can't be squelched.",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 7,
			"cardImage": "OG_339.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Sectateur Skeram",
				"text": "<b>Cri de guerre :</b> donne +2/+2 à votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 6,
			"id": "OG_339",
			"name": "Skeram Cultist",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> Give your C'Thun +2/+2 <i>(wherever it is).</i>",
			"type": "Minion"
		},
		{
			"cardImage": "TB_Superfriends002e.png",
			"fr": {
				"name": "Pioche Jeu offensif",
				"text": "Pioche Jeu offensif au premier tour"
			},
			"id": "TB_Superfriends002e",
			"name": "Draw Offensive Play",
			"playerClass": "Rogue",
			"set": "Tb",
			"text": "Draw Offensive Play on first turn",
			"type": "Enchantment"
		},
		{
			"cardImage": "PART_001e.png",
			"fr": {
				"name": "Plaque d’armure",
				"text": "+1 PV."
			},
			"id": "PART_001e",
			"name": "Armor Plating",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "+1 Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_073e.png",
			"fr": {
				"name": "Esprit combatif",
				"text": "+1/+1."
			},
			"id": "AT_073e",
			"name": "Competitive Spirit",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Richard Wright",
			"attack": 0,
			"cardImage": "LOE_024t.png",
			"cost": 4,
			"fr": {
				"name": "Rocher roulant",
				"text": "Détruit le serviteur à gauche à la fin de votre tour."
			},
			"health": 4,
			"id": "LOE_024t",
			"name": "Rolling Boulder",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "At the end of your turn, destroy the minion to the left.",
			"type": "Minion"
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
			"cardImage": "TU4a_004.png",
			"cost": 3,
			"fr": {
				"name": "Lardeur TOUT CASSER !",
				"text": "Inflige 4 points de dégâts."
			},
			"id": "TU4a_004",
			"name": "Hogger SMASH!",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "Deal 4 damage.",
			"type": "Spell"
		},
		{
			"artist": "Steve Prescott",
			"cardImage": "GVG_033.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Arbre de vie",
				"text": "Rend à tous les personnages tous leurs points de vie."
			},
			"id": "GVG_033",
			"name": "Tree of Life",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Restore all characters to full Health.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_316e.png",
			"fr": {
				"name": "Puissance accablante",
				"text": "Ce serviteur a +4/+4 mais il mourra de façon horrible à la fin du tour."
			},
			"id": "EX1_316e",
			"name": "Power Overwhelming",
			"playerClass": "Warlock",
			"set": "Expert1",
			"text": "This minion has +4/+4, but will die a horrible death at the end of the turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Richard Wright",
			"attack": 4,
			"cardImage": "GVG_054.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Cogneguerre ogre",
				"text": "50% de chance d’attaquer le mauvais adversaire."
			},
			"id": "GVG_054",
			"name": "Ogre Warmaul",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Gvg",
			"text": "50% chance to attack the wrong enemy.",
			"type": "Weapon"
		},
		{
			"artist": "Rafael Zanchetin",
			"cardImage": "KAR_013.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Purification",
				"text": "Réduit au <b>Silence</b> un serviteur allié. Vous piochez une carte."
			},
			"id": "KAR_013",
			"name": "Purify",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Silence</b> a friendly minion. Draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_026.png",
			"cost": 0,
			"fr": {
				"name": "Enable Emotes",
				"text": "Enable emotes for your VS.AI game. (not in tutorials, though)"
			},
			"id": "XXX_026",
			"name": "Enable Emotes",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Enable emotes for your VS.AI game. (not in tutorials, though)",
			"type": "Spell"
		},
		{
			"artist": "Steve Prescott",
			"attack": 1,
			"cardImage": "LOE_006.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Conservateur du musée",
				"text": "<b>Cri de guerre : découvre</b> une carte avec <b>Râle d’agonie</b>."
			},
			"health": 2,
			"id": "LOE_006",
			"name": "Museum Curator",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Battlecry: Discover</b> a <b>Deathrattle</b> card.",
			"type": "Minion"
		},
		{
			"artist": "Konstantin Turovec",
			"attack": 3,
			"cardImage": "KAR_094a.png",
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Fourchette pointue"
			},
			"id": "KAR_094a",
			"name": "Sharp Fork",
			"playerClass": "Rogue",
			"set": "Kara",
			"type": "Weapon"
		},
		{
			"cardImage": "OG_337e.png",
			"fr": {
				"name": "Prémices de destruction",
				"text": "Caractéristiques augmentées."
			},
			"id": "OG_337e",
			"name": "Eve of Destruction",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Stats increased.",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_049e.png",
			"fr": {
				"name": "Puissance de Zul’Farrak",
				"text": "Multiple l’Attaque."
			},
			"id": "GVG_049e",
			"name": "Might of Zul'Farrak",
			"playerClass": "Hunter",
			"set": "Gvg",
			"text": "Multiplying Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA08_2.png",
			"cost": 0,
			"fr": {
				"name": "Regard intense",
				"text": "<b>Pouvoir héroïque passif</b>\nToutes les cartes coûtent (1) |4(cristal,cristaux) de mana. Les joueurs sont limités à 1 cristal."
			},
			"id": "BRMA08_2",
			"name": "Intense Gaze",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Passive Hero Power</b>\nAll cards cost (1). Players are capped at 1 Mana Crystal.",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_015.png",
			"cost": 0,
			"fr": {
				"name": "Crash",
				"text": "Crash the game."
			},
			"id": "XXX_015",
			"name": "Crash",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Crash the game.",
			"type": "Spell"
		},
		{
			"artist": "Guangjian Huang",
			"attack": 0,
			"cardImage": "GVG_039.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Totem de vitalité",
				"text": "À la fin de votre tour, rend 4 PV à votre héros."
			},
			"health": 3,
			"id": "GVG_039",
			"name": "Vitality Totem",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "At the end of your turn, restore 4 Health to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Alex Aleksandrov",
			"cardImage": "KARA_07_05.png",
			"cost": 3,
			"fr": {
				"name": "Bête déchaînée !",
				"text": "Invoque une Bête aléatoire."
			},
			"id": "KARA_07_05",
			"name": "Stampeding Beast!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon a random Beast.",
			"type": "Spell"
		},
		{
			"artist": "Jeff Haynie",
			"cardImage": "GVG_015.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Bombe de matière noire",
				"text": "Inflige $3 |4(point,points) de dégâts."
			},
			"id": "GVG_015",
			"name": "Darkbomb",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Deal $3 damage.",
			"type": "Spell"
		},
		{
			"artist": "Joe Madureira & Grace Liu",
			"attack": 5,
			"cardImage": "KAR_096.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Prince Malchezaar",
				"text": "Quand la partie commence, ajoute 5 serviteurs <b>légendaires</b> dans votre deck."
			},
			"health": 6,
			"id": "KAR_096",
			"name": "Prince Malchezaar",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Kara",
			"text": "[x]When the game starts,\nadd 5 extra <b>Legendary</b>\nminions to your deck.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX12_04e.png",
			"fr": {
				"name": "Accès de rage",
				"text": "+6 ATQ pendant ce tour."
			},
			"id": "NAX12_04e",
			"name": "Enrage",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "+6 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMC_86e.png",
			"fr": {
				"name": "Je vous entends…",
				"text": "Attaque augmentée."
			},
			"id": "BRMC_86e",
			"name": "I Hear You...",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_100e.png",
			"fr": {
				"name": "Sourcils froncés",
				"text": "Caractéristiques augmentées."
			},
			"id": "GVG_100e",
			"name": "Brow Furrow",
			"playerClass": "Warlock",
			"set": "Gvg",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Sam Nielson",
			"attack": 3,
			"cardImage": "AT_076.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Chevalier murloc",
				"text": "<b>Exaltation :</b> invoque un murloc aléatoire."
			},
			"health": 4,
			"id": "AT_076",
			"name": "Murloc Knight",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Summon a random Murloc.",
			"type": "Minion"
		},
		{
			"artist": "Slawomir Maniak",
			"cardImage": "LOE_110t.png",
			"cost": 0,
			"fr": {
				"name": "Malédiction ancestrale",
				"text": "Quand vous piochez cette carte, vous subissez 7 points de dégâts et vous piochez une carte."
			},
			"id": "LOE_110t",
			"name": "Ancient Curse",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "When you draw this, take 7 damage and draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_1.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : Provocation, Charge",
				"text": "Tous les serviteurs ont <b>Provocation</b> et <b>Charge</b>."
			},
			"id": "TB_PickYourFate_1",
			"name": "Dire Fate: Taunt and Charge",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "All minions have <b>Taunt</b> and <b>Charge</b>.",
			"type": "Spell"
		},
		{
			"attack": 7,
			"cardImage": "XXX_109.png",
			"cost": 0,
			"fr": {
				"name": "Illidan Stormrage Cheat",
				"text": "Whenever you play a card, deal 1 damage to all minions."
			},
			"health": 5,
			"id": "XXX_109",
			"name": "Illidan Stormrage Cheat",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Whenever you play a card, deal 1 damage to all minions.",
			"type": "Minion"
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
			"artist": "Sojin Hwang",
			"attack": 4,
			"cardImage": "AT_026.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Garde-courroux",
				"text": "Chaque fois que ce serviteur subit des dégâts, inflige le même montant de dégâts à votre héros."
			},
			"health": 3,
			"id": "AT_026",
			"name": "Wrathguard",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Whenever this minion takes damage, also deal that amount to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "KAR_025b.png",
			"cost": 2,
			"fr": {
				"name": "Balai"
			},
			"health": 2,
			"id": "KAR_025b",
			"name": "Broom",
			"playerClass": "Warlock",
			"set": "Kara",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA09_2.png",
			"cost": 2,
			"fr": {
				"name": "Ouvrir les portes",
				"text": "<b>Pouvoir héroïque</b>\nInvoque trois dragonnets 1/1. Change de pouvoir héroïque."
			},
			"id": "BRMA09_2",
			"name": "Open the Gates",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon three 1/1 Whelps. Get a new Hero Power.",
			"type": "Hero_power"
		},
		{
			"artist": "Andrew Hou",
			"attack": 4,
			"cardImage": "AT_090.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Champion de Mukla",
				"text": "<b>Exaltation :</b> donne +1/+1 à vos autres serviteurs."
			},
			"health": 3,
			"id": "AT_090",
			"name": "Mukla's Champion",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Give your other minions +1/+1.",
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
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"cardImage": "EX1_244.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Puissance totémique",
				"text": "Confère +2 PV à vos totems."
			},
			"id": "EX1_244",
			"name": "Totemic Might",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Core",
			"text": "Give your Totems +2 Health.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "NAX9_03.png",
			"cost": 3,
			"fr": {
				"name": "Thane Korth’azz",
				"text": "Votre héros est <b>Insensible</b>."
			},
			"health": 7,
			"id": "NAX9_03",
			"name": "Thane Korth'azz",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "Your hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 4,
			"cardImage": "EX1_306.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Succube",
				"text": "<b>Cri de guerre :</b> vous défausse d’une carte aléatoire."
			},
			"health": 3,
			"id": "EX1_306",
			"name": "Succubus",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Battlecry:</b> Discard a random card.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 1,
			"cardImage": "EX1_582.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Mage de Dalaran",
				"text": "<b>Dégâts des sorts : +1</b>"
			},
			"health": 4,
			"id": "EX1_582",
			"name": "Dalaran Mage",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"spellDamage": 1,
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"artist": "Howard Lyon",
			"attack": 2,
			"cardImage": "EX1_584.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mage ancien",
				"text": "<b>Cri de guerre :</b> donne aux serviteurs adjacents <b>+1 aux dégâts des sorts</b>."
			},
			"health": 5,
			"id": "EX1_584",
			"name": "Ancient Mage",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give adjacent minions <b>Spell Damage +1</b>.",
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
			"cardImage": "CS2_122e.png",
			"fr": {
				"name": "Amélioration",
				"text": "Le chef de raid confère +1 ATQ à ce serviteur."
			},
			"id": "CS2_122e",
			"name": "Enhanced",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "Raid Leader is granting this minion +1 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Jon Neimeister",
			"attack": 2,
			"cardImage": "OG_330.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Colporteur de Fossoyeuse",
				"text": "<b>Râle d’agonie :</b> ajoute une carte aléatoire dans votre main <i>(de la classe de votre adversaire)</i>."
			},
			"health": 2,
			"id": "OG_330",
			"name": "Undercity Huckster",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Add a random class card to your hand <i>(from your opponent's class)</i>.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_611e.png",
			"fr": {
				"name": "Pris au piège",
				"text": "Sera <b>Gelé</b> à nouveau au début du tour suivant."
			},
			"id": "EX1_611e",
			"name": "Trapped",
			"playerClass": "Hunter",
			"set": "Expert1",
			"text": "Will be <b>Frozen</b> again at the start of the next turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_032b.png",
			"cost": 0,
			"fr": {
				"name": "Don de carte",
				"text": "Chaque joueur pioche une carte."
			},
			"id": "GVG_032b",
			"name": "Gift of Cards",
			"playerClass": "Druid",
			"set": "Gvg",
			"text": "Each player draws a card.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_165b.png",
			"cost": 0,
			"fr": {
				"name": "Forme d’ours",
				"text": "+2 PV et <b>Provocation</b>."
			},
			"id": "EX1_165b",
			"name": "Bear Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"text": "+2 Health and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"artist": "Eric Braddock",
			"attack": 8,
			"cardImage": "AT_036.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Anub’arak",
				"text": "<b>Râle d’agonie :</b> le renvoie dans votre main et invoque un nérubien 4/4."
			},
			"health": 4,
			"id": "AT_036",
			"name": "Anub'arak",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Deathrattle:</b> Return this to your hand and summon a 4/4 Nerubian.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_07_02e.png",
			"fr": {
				"name": "Protecteur de la galerie"
			},
			"id": "KARA_07_02e",
			"name": "Protecting the Gallery",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Enchantment"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 3,
			"cardImage": "AT_083.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chevaucheur de faucon-dragon",
				"text": "<b>Exaltation :</b> gagne <b>Furie des vents</b> pendant ce tour."
			},
			"health": 3,
			"id": "AT_083",
			"name": "Dragonhawk Rider",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Gain <b>Windfury</b>\nthis turn.",
			"type": "Minion"
		},
		{
			"artist": "Frank Cho",
			"cardImage": "CS2_075.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Attaque pernicieuse",
				"text": "Inflige $3 |4(point,points) de dégâts au héros adverse."
			},
			"id": "CS2_075",
			"name": "Sinister Strike",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $3 damage to the enemy hero.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "EX1_243.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Diable de poussière",
				"text": "<b>Furie des vents</b>\n<b>Surcharge :</b> (2)"
			},
			"health": 1,
			"id": "EX1_243",
			"name": "Dust Devil",
			"overload": 2,
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Windfury</b>. <b>Overload:</b> (2)",
			"type": "Minion"
		},
		{
			"cardImage": "AT_132_DRUID.png",
			"cost": 2,
			"fr": {
				"name": "Changeforme sinistre",
				"text": "<b>Pouvoir héroïque</b>\nGagne 2 points d’armure et +2 ATQ pendant ce tour."
			},
			"id": "AT_132_DRUID",
			"name": "Dire Shapeshift",
			"playerClass": "Druid",
			"set": "Tgt",
			"text": "<b>Hero Power</b>\nGain 2 Armor and +2 Attack this turn.",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_ClassRandom_Shaman.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : chaman",
				"text": "Ajoute des cartes de chaman dans votre deck."
			},
			"id": "TB_ClassRandom_Shaman",
			"name": "Second Class: Shaman",
			"playerClass": "Shaman",
			"set": "Tb",
			"text": "Add Shaman cards to your deck.",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "CRED_37.png",
			"cost": 4,
			"fr": {
				"name": "Ricardo Robaina",
				"text": "<b>Cri de guerre :</b> invoque trois chinchillas 1/1."
			},
			"health": 4,
			"id": "CRED_37",
			"name": "Ricardo Robaina",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Summon three 1/1 Chinchillas.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_08_04e.png",
			"fr": {
				"name": "Renforcé",
				"text": "+8 ATQ pendant ce tour."
			},
			"id": "KARA_08_04e",
			"name": "Empowered",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+8 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX8_02H.png",
			"cost": 1,
			"fr": {
				"name": "Moisson",
				"text": "<b>Pouvoir héroïque</b>\nVous piochez une carte et gagnez un cristal de mana."
			},
			"id": "NAX8_02H",
			"name": "Harvest",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDraw a card. Gain a Mana Crystal.",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_111e.png",
			"fr": {
				"name": "All Charge, All Windfury, All The Time",
				"text": "Your minions always have <b>Charge</b> and <b>Windfury</b>"
			},
			"id": "XXX_111e",
			"name": "All Charge, All Windfury, All The Time",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Your minions always have <b>Charge</b> and <b>Windfury</b>",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_292e.png",
			"fr": {
				"name": "Dévotion de la nuit",
				"text": "+1/+1."
			},
			"id": "OG_292e",
			"name": "Night's Devotion",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"attack": 10,
			"cardImage": "LOEA04_27.png",
			"cost": 1,
			"fr": {
				"name": "Statue animée",
				"text": "Vous avez dérangé cette ancienne statue…"
			},
			"health": 10,
			"id": "LOEA04_27",
			"name": "Animated Statue",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "You've disturbed the ancient statue...",
			"type": "Minion"
		},
		{
			"artist": "Leo Che",
			"cardImage": "EX1_161.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Acclimatation",
				"text": "Détruit un serviteur. Votre adversaire pioche 2 cartes."
			},
			"id": "EX1_161",
			"name": "Naturalize",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Destroy a minion. Your opponent draws 2 cards.",
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"attack": 9,
			"cardImage": "CRED_16.png",
			"cost": 7,
			"fr": {
				"name": "Hamilton Chu",
				"text": "<i>Ne fait PAS partie du problème... la plupart du temps.</i>"
			},
			"health": 5,
			"id": "CRED_16",
			"name": "Hamilton Chu",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<i>Was successfully NOT part of the problem! ...most of the time.</i>",
			"type": "Minion"
		},
		{
			"artist": "Anton Kagounkin",
			"attack": 2,
			"cardImage": "OG_202c.png",
			"cost": 2,
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
			"artist": "Jonathan Ryder",
			"attack": 0,
			"cardImage": "EX1_565.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Totem Langue de feu",
				"text": "Les serviteurs adjacents ont +2 ATQ."
			},
			"health": 3,
			"id": "EX1_565",
			"name": "Flametongue Totem",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Core",
			"text": "Adjacent minions have +2 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_508o.png",
			"fr": {
				"name": "Mlarggragllabl !",
				"text": "Ce murloc a +1 ATQ."
			},
			"id": "EX1_508o",
			"name": "Mlarggragllabl!",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "This Murloc has +1 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"attack": 7,
			"cardImage": "EX1_250.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Élémentaire de terre",
				"text": "<b>Provocation</b>\n<b>Surcharge :</b> (3)"
			},
			"health": 8,
			"id": "EX1_250",
			"name": "Earth Elemental",
			"overload": 3,
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Taunt</b>. <b>Overload:</b> (3)",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_2_EnchMinion.png",
			"fr": {
				"name": "Destin",
				"text": "<b>Râle d’agonie_:</b> vous obtenez une banane."
			},
			"id": "TB_PickYourFate_2_EnchMinion",
			"name": "Fate",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Deathrattle:</b> Your owner gets a banana.",
			"type": "Enchantment"
		},
		{
			"attack": 10,
			"cardImage": "BRMA14_12.png",
			"cost": 5,
			"fr": {
				"name": "Magmagueule",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "BRMA14_12",
			"name": "Magmaw",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "GAME_006.png",
			"cost": 2,
			"fr": {
				"name": "NOOOOOOOOOOOON !",
				"text": "Bizarrement, la carte que vous possédiez AVANT a été effacée. Allez, prenez celle-là à la place !"
			},
			"id": "GAME_006",
			"name": "NOOOOOOOOOOOO",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "Somehow, the card you USED to have has been deleted.  Here, have this one instead!",
			"type": "Spell"
		},
		{
			"artist": "E. M. Gist",
			"attack": 2,
			"cardImage": "FP1_001.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Croq’zombie",
				"text": "<b>Râle d’agonie :</b> rend 5 PV au héros adverse."
			},
			"health": 3,
			"id": "FP1_001",
			"name": "Zombie Chow",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Restore 5 Health to the enemy hero.",
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
				"name": "Lame de la perdition",
				"text": "<b>Cri de guerre :</b> inflige 1 point de dégâts. <b>Combo :</b> inflige 2 points de dégâts à la place."
			},
			"id": "EX1_133",
			"name": "Perdition's Blade",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Deal 1 damage. <b>Combo:</b> Deal 2 instead.",
			"type": "Weapon"
		},
		{
			"cardImage": "BRM_012e.png",
			"fr": {
				"name": "En feu !",
				"text": "Attaque augmentée."
			},
			"id": "BRM_012e",
			"name": "On Fire!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Increased Attack.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_8.png",
			"cost": 0,
			"fr": {
				"name": "Bonus : sorts",
				"text": "Chaque fois que vous lancez un sort, vous gagnez 3 points d’armure."
			},
			"id": "TB_PickYourFate_8",
			"name": "Spell Bonus",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Whenever you cast a spell, gain 3 Armor.",
			"type": "Spell"
		},
		{
			"artist": "Steve Prescott",
			"attack": 2,
			"cardImage": "EX1_050.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Oracle froide-lumière",
				"text": "<b>Cri de guerre :</b> chaque joueur pioche 2 cartes."
			},
			"health": 2,
			"id": "EX1_050",
			"name": "Coldlight Oracle",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Each player draws 2 cards.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_96.png",
			"cost": 3,
			"fr": {
				"name": "Juge Supérieur Mornepierre",
				"text": "Au début de votre tour, invoque un serviteur <b>légendaire</b>."
			},
			"health": 5,
			"id": "BRMC_96",
			"name": "High Justice Grimstone",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "At the start of your turn, summon a <b>Legendary</b> minion.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "BRMC_95he.png",
			"cost": 3,
			"fr": {
				"name": "Chiot du magma",
				"text": "À la fin de chaque tour, invoque tous les chiots du magma qui sont morts pendant ce tour."
			},
			"health": 4,
			"id": "BRMC_95he",
			"name": "Core Hound Pup",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "At the end of each turn, summon all Core Hound Pups that died this turn.",
			"type": "Minion"
		},
		{
			"cardImage": "PRO_001a.png",
			"cost": 4,
			"fr": {
				"name": "Je suis murloc",
				"text": "Invoque trois, quatre ou cinq murlocs 1/1."
			},
			"id": "PRO_001a",
			"name": "I Am Murloc",
			"playerClass": "Neutral",
			"set": "Promo",
			"text": "Summon three, four, or five 1/1 Murlocs.",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "CRED_03.png",
			"cost": 3,
			"fr": {
				"name": "Bob Fitch",
				"text": "<b>Super provocation</b> <i>(TOUS les personnages doivent attaquer ce serviteur.)</i>"
			},
			"health": 4,
			"id": "CRED_03",
			"name": "Bob Fitch",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Super Taunt</b> <i>(EVERY character must attack this minion.)</i>",
			"type": "Minion"
		},
		{
			"artist": "L. Lullabi & S. Srisuwan",
			"cardImage": "OG_202b.png",
			"cost": 0,
			"fr": {
				"name": "Magie de Yogg-Saron",
				"text": "Confère un cristal de mana vide."
			},
			"id": "OG_202b",
			"name": "Yogg-Saron's Magic",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"text": "Gain an empty Mana Crystal.",
			"type": "Spell"
		},
		{
			"artist": "Steve Prescott",
			"attack": 2,
			"cardImage": "OG_338.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Nat le sombre pêcheur",
				"text": "Au début de son tour, votre adversaire a 50% de chances de piocher une carte supplémentaire."
			},
			"health": 4,
			"id": "OG_338",
			"name": "Nat, the Darkfisher",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "At the start of your opponent's turn, they have a 50% chance to draw an extra card.",
			"type": "Minion"
		},
		{
			"artist": "Tooth",
			"attack": 7,
			"cardImage": "OG_134.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Yogg-Saron, la fin de l’espoir",
				"text": "<b>Cri de guerre :</b> lance un sort aléatoire pour chaque sort que vous avez lancé pendant cette partie <i>(cibles choisies au hasard)</i>."
			},
			"health": 5,
			"id": "OG_134",
			"name": "Yogg-Saron, Hope's End",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Battlecry:</b> Cast a random spell for each spell you've cast this game <i>(targets chosen randomly)</i>.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_105.png",
			"cost": 0,
			"fr": {
				"name": "Add 8 to Health.",
				"text": "Adds 8 health to a damaged character. Does NOT heal."
			},
			"id": "XXX_105",
			"name": "Add 8 to Health.",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Adds 8 health to a damaged character. Does NOT heal.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA17_5H.png",
			"cost": 2,
			"fr": {
				"name": "Séides des os",
				"text": "<b>Pouvoir héroïque</b>\nInvoque deux assemblages d’os 4/2."
			},
			"id": "BRMA17_5H",
			"name": "Bone Minions",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon two 4/2 Bone Constructs.",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_166b.png",
			"cost": 0,
			"fr": {
				"name": "Dissipation",
				"text": "Réduit au <b>Silence</b> un serviteur."
			},
			"id": "EX1_166b",
			"name": "Dispel",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "<b>Silence</b> a minion.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "NAX8_04t.png",
			"cost": 3,
			"fr": {
				"name": "Guerrier spectral",
				"text": "Au début de votre tour, inflige 1 point de dégâts à votre héros."
			},
			"health": 4,
			"id": "NAX8_04t",
			"name": "Spectral Warrior",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "At the start of your turn, deal 1 damage to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 4,
			"cardImage": "NEW1_029.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Millhouse Tempête-de-Mana",
				"text": "<b>Cri de guerre :</b> les sorts adverses coûtent (0) au prochain tour."
			},
			"health": 4,
			"id": "NEW1_029",
			"name": "Millhouse Manastorm",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Enemy spells cost (0) next turn.",
			"type": "Minion"
		},
		{
			"artist": "Daarken",
			"cardImage": "EX1_238.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Éclair",
				"text": "Inflige $3 |4(point,points) de dégâts.\n<b>Surcharge :</b> (1)"
			},
			"id": "EX1_238",
			"name": "Lightning Bolt",
			"overload": 1,
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Deal $3 damage. <b>Overload:</b> (1)",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_20.png",
			"cost": 1,
			"fr": {
				"name": "Bénédiction du soleil",
				"text": "Confère <b>Insensible</b> à un serviteur pendant ce tour."
			},
			"id": "LOEA16_20",
			"name": "Blessing of the Sun",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Give a minion <b>Immune</b> this turn.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_549.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Courroux bestial",
				"text": "Confère +2 ATQ et l’effet <b>Insensible</b> à une Bête alliée pendant ce tour."
			},
			"id": "EX1_549",
			"name": "Bestial Wrath",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Give a friendly Beast +2 Attack and <b>Immune</b> this turn.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 2,
			"cardImage": "BRM_006.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chef du gang des diablotins",
				"text": "Invoque un diablotin 1/1 chaque fois que ce serviteur subit des dégâts."
			},
			"health": 4,
			"id": "BRM_006",
			"name": "Imp Gang Boss",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Brm",
			"text": "Whenever this minion takes damage, summon a 1/1 Imp.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_162o.png",
			"fr": {
				"name": "Force de la meute",
				"text": "Le loup alpha redoutable confère +1 ATQ à ce serviteur."
			},
			"id": "EX1_162o",
			"name": "Strength of the Pack",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Dire Wolf Alpha is granting +1 Attack to this minion.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA16_4.png",
			"cost": 1,
			"fr": {
				"name": "Gong réverbérant",
				"text": "Détruit l’arme de votre adversaire."
			},
			"id": "BRMA16_4",
			"name": "Reverberating Gong",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Destroy your opponent's weapon.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "OG_218e.png",
			"fr": {
				"name": "Enragé",
				"text": "+3 ATQ."
			},
			"id": "OG_218e",
			"name": "Enraged",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+3 Attack.",
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
			"attack": 9,
			"cardImage": "TB_CoOp_Mechazod2.png",
			"cost": 10,
			"fr": {
				"name": "Mécazod surchargé",
				"text": "<b>Boss</b>\nAu début de chaque tour, Mécazod frappe !"
			},
			"health": 80,
			"id": "TB_CoOp_Mechazod2",
			"name": "Overloaded Mechazod",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "<b>Boss</b>\nAt the beginning of each turn, Mechazod strikes!",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA16_1.png",
			"fr": {
				"name": "Atramédès"
			},
			"health": 30,
			"id": "BRMA16_1",
			"name": "Atramedes",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "José Ladrönn",
			"attack": 5,
			"cardImage": "GVG_066.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Chaman cognedune",
				"text": "<b>Furie des vents.</b>\n50% de chance d’attaquer le mauvais adversaire. \n<b>Surcharge :</b> (1)"
			},
			"health": 4,
			"id": "GVG_066",
			"name": "Dunemaul Shaman",
			"overload": 1,
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Windfury, Overload: (1)</b>\n50% chance to attack the wrong enemy.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_594.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Vaporisation",
				"text": "<b>Secret :</b> quand un serviteur attaque votre héros, le détruit."
			},
			"id": "EX1_594",
			"name": "Vaporize",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Secret:</b> When a minion attacks your hero, destroy it.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_160be.png",
			"fr": {
				"name": "Chef de la meute",
				"text": "+1/+1."
			},
			"id": "EX1_160be",
			"name": "Leader of the Pack",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "+1/+1.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Milivoj Ceran",
			"attack": 6,
			"cardImage": "EX1_534.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Grande crinière des savanes",
				"text": "<b>Râle d’agonie :</b> invoque deux hyènes 2/2."
			},
			"health": 5,
			"id": "EX1_534",
			"name": "Savannah Highmane",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Deathrattle:</b> Summon two 2/2 Hyenas.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_047.png",
			"cost": 0,
			"fr": {
				"name": "Destroy Deck",
				"text": "Delete an opponent's deck"
			},
			"id": "XXX_047",
			"name": "Destroy Deck",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Delete an opponent's deck",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "NEW1_032.png",
			"cost": 3,
			"fr": {
				"name": "Misha",
				"text": "<b>Provocation</b>"
			},
			"health": 4,
			"id": "NEW1_032",
			"name": "Misha",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_001e.png",
			"fr": {
				"name": "Garde rapprochée",
				"text": "Attaque augmentée."
			},
			"id": "EX1_001e",
			"name": "Warded",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Robb Shoberg",
			"attack": 3,
			"cardImage": "FP1_022.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Implorateur du Vide",
				"text": "<b>Râle d’agonie :</b> place un démon aléatoire de votre main sur le champ de bataille."
			},
			"health": 4,
			"id": "FP1_022",
			"name": "Voidcaller",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Put a random Demon from your hand into the battlefield.",
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_061.png",
			"cost": 0,
			"fr": {
				"name": "Armor 1",
				"text": "Give target Hero +1 Armor"
			},
			"id": "XXX_061",
			"name": "Armor 1",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Give target Hero +1 Armor",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "CS2_234.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Mot de l’ombre : Douleur",
				"text": "Détruit un serviteur avec 3 Attaque ou moins."
			},
			"id": "CS2_234",
			"name": "Shadow Word: Pain",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"text": "Destroy a minion with 3 or less Attack.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA14_10.png",
			"cost": 4,
			"fr": {
				"name": "Activation !",
				"text": "<b>Pouvoir héroïque</b>\nActive un Tron aléatoire."
			},
			"id": "BRMA14_10",
			"name": "Activate!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nActivate a random Tron.",
			"type": "Hero_power"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 7,
			"cardImage": "GVG_034.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Méca chat-ours",
				"text": "Chaque fois que ce serviteur subit des dégâts, place une carte <b>Pièce détachée</b> dans votre main."
			},
			"health": 6,
			"id": "GVG_034",
			"name": "Mech-Bear-Cat",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Whenever this minion takes damage, add a <b>Spare Part</b> card to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_08_03e.png",
			"fr": {
				"name": "Souffle du Néant",
				"text": "Les points de vie sont passés à 1."
			},
			"id": "KARA_08_03e",
			"name": "Nether Breath",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Health changed to 1.",
			"type": "Enchantment"
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
			"attack": 4,
			"cardImage": "TB_Coopv3_104.png",
			"cost": 4,
			"fr": {
				"name": "Tank principal",
				"text": "<b>Cri de guerre_:</b> donne +2/+2 à tous les serviteurs, sauf au <b>boss</b>."
			},
			"health": 4,
			"id": "TB_Coopv3_104",
			"name": "Main Tank",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Battlecry:</b> Give all other minions +2/+2, except the <b>Boss</b>.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_22.png",
			"cost": 3,
			"fr": {
				"name": "Cameron Chrisman",
				"text": "Les cartes dorées coûtent (1) cristal de moins tant que vous avez cette carte dans votre main."
			},
			"health": 3,
			"id": "CRED_22",
			"name": "Cameron Chrisman",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "While this is in your hand, Golden cards cost (1) less.",
			"type": "Minion"
		},
		{
			"artist": "Peet Cooper",
			"attack": 2,
			"cardImage": "AT_050.png",
			"collectible": true,
			"cost": 4,
			"durability": 4,
			"fr": {
				"name": "Marteau chargé",
				"text": "<b>Râle d’agonie :</b> votre pouvoir héroïque devient « Inflige 2 points de dégâts »."
			},
			"id": "AT_050",
			"name": "Charged Hammer",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "<b>Deathrattle:</b> Your Hero Power becomes 'Deal 2 damage.'",
			"type": "Weapon"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_24H.png",
			"cost": 10,
			"fr": {
				"name": "Aileron-Géant",
				"text": "À la fin de votre tour, vous piochez 2 cartes."
			},
			"health": 10,
			"id": "LOEA16_24H",
			"name": "Giantfin",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, draw 2 cards.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_037b.png",
			"cost": 0,
			"fr": {
				"name": "Racines vivantes",
				"text": "Invoque deux arbrisseaux 1/1."
			},
			"id": "AT_037b",
			"name": "Living Roots",
			"playerClass": "Druid",
			"set": "Tgt",
			"text": "Summon two 1/1 Saplings.",
			"type": "Spell"
		},
		{
			"artist": "Ben Zhang",
			"attack": 2,
			"cardImage": "AT_109.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Guetteur d’Argent",
				"text": "Ne peut pas attaquer.\n<b>Exaltation :</b> peut attaquer normalement pendant ce tour."
			},
			"health": 4,
			"id": "AT_109",
			"name": "Argent Watchman",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "Can't attack.\n<b>Inspire:</b> Can attack as normal this turn.",
			"type": "Minion"
		},
		{
			"artist": "Seamus Gallagher",
			"attack": 2,
			"cardImage": "GVG_046.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Roi des bêtes",
				"text": "<b>Provocation</b>. <b>Cri de guerre :</b> gagne +1 ATQ pour chacune de vos autres Bêtes."
			},
			"health": 6,
			"id": "GVG_046",
			"name": "King of Beasts",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Taunt</b>. <b>Battlecry:</b> Gain +1 Attack for each other Beast you have.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "GVG_097.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Mini exorciste",
				"text": "<b>Provocation</b>. <b>Cri de guerre :</b> gagne +1/+1 pour chaque serviteur adverse avec <b>Râle d’agonie</b>."
			},
			"health": 3,
			"id": "GVG_097",
			"name": "Lil' Exorcist",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Taunt</b>\n<b>Battlecry:</b> Gain +1/+1 for each enemy <b>Deathrattle</b> minion.",
			"type": "Minion"
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
			"artist": "Steve Ellis",
			"attack": 4,
			"cardImage": "CS2_155.png",
			"collectible": true,
			"cost": 6,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Archimage",
				"text": "<b>Dégâts des sorts : +1</b>"
			},
			"health": 7,
			"id": "CS2_155",
			"name": "Archmage",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"spellDamage": 1,
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA11_3.png",
			"cost": 0,
			"fr": {
				"name": "Montée d’adrénaline",
				"text": "Inflige $2 |4(point,points) de dégâts au héros adverse."
			},
			"id": "BRMA11_3",
			"name": "Burning Adrenaline",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Deal $2 damage to the enemy hero.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMC_83.png",
			"cost": 8,
			"fr": {
				"name": "Ouvrir les portes",
				"text": "Remplit le plateau de dragonnets 2/2."
			},
			"id": "BRMC_83",
			"name": "Open the Gates",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Fill your board with 2/2 Whelps.",
			"type": "Spell"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 2,
			"cardImage": "GVG_060.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Intendant",
				"text": "<b>Cri de guerre :</b> donne +2/+2 à vos recrues de la Main d’argent."
			},
			"health": 5,
			"id": "GVG_060",
			"name": "Quartermaster",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Give your Silver Hand Recruits +2/+2.",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 3,
			"cardImage": "OG_044.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Fandral Forteramure",
				"text": "Vos cartes avec <b>Choix des armes</b> combinent les deux effets."
			},
			"health": 5,
			"id": "OG_044",
			"name": "Fandral Staghelm",
			"playerClass": "Druid",
			"rarity": "Legendary",
			"set": "Og",
			"text": "Your <b>Choose One</b> cards have both effects combined.",
			"type": "Minion"
		},
		{
			"artist": "Daarken",
			"attack": 0,
			"cardImage": "EX1_335.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Rejeton de lumière",
				"text": "L’Attaque de ce serviteur est toujours égale à sa Vie."
			},
			"health": 5,
			"id": "EX1_335",
			"name": "Lightspawn",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"text": "This minion's Attack is always equal to its Health.",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "AT_074.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Sceau des champions",
				"text": "Confère +3 ATQ et <b>Bouclier divin</b> à un serviteur."
			},
			"id": "AT_074",
			"name": "Seal of Champions",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Give a minion\n+3 Attack and <b>Divine Shield</b>.",
			"type": "Spell"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"attack": 7,
			"cardImage": "GVG_079.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Char de force MAX",
				"text": "<b>Bouclier divin</b>"
			},
			"health": 7,
			"id": "GVG_079",
			"name": "Force-Tank MAX",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 3,
			"cardImage": "EX1_382.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Garde-paix de l’Aldor",
				"text": "<b>Cri de guerre :</b> l’Attaque d’un serviteur adverse passe à 1."
			},
			"health": 3,
			"id": "EX1_382",
			"name": "Aldor Peacekeeper",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Change an enemy minion's Attack to 1.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "BRMC_94.png",
			"cost": 2,
			"durability": 6,
			"fr": {
				"name": "Sulfuras",
				"text": "<b>Râle d’agonie :</b> transforme votre pouvoir héroïque, qui inflige 8 points de dégâts à un adversaire aléatoire."
			},
			"id": "BRMC_94",
			"name": "Sulfuras",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Deathrattle:</b> Your Hero Power becomes 'Deal 8 damage to a random enemy'.",
			"type": "Weapon"
		},
		{
			"attack": 3,
			"cardImage": "CRED_14.png",
			"cost": 5,
			"fr": {
				"name": "Yong Woo",
				"text": "Vos autres serviteurs ont +3 Attaque et <b>Charge</b>."
			},
			"health": 2,
			"id": "CRED_14",
			"name": "Yong Woo",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Your other minions have +3 Attack and <b>Charge</b>.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_345.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Jeux d’esprit",
				"text": "Place une copie d’un serviteur aléatoire du jeu de votre adversaire sur le champ de bataille."
			},
			"id": "EX1_345",
			"name": "Mindgames",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Put a copy of a random minion from your opponent's deck into the battlefield.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_164b.png",
			"cost": 0,
			"fr": {
				"name": "Nourrir",
				"text": "Vous piochez 3 cartes."
			},
			"id": "EX1_164b",
			"name": "Nourish",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Draw 3 cards.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_Coopv3_102.png",
			"cost": 2,
			"fr": {
				"name": "L’Ombre ou la Lumière ?",
				"text": "<b>Choix des armes_:</b> chaque joueur pioche 2 cartes, ou rend 8 PV à chaque héros."
			},
			"id": "TB_Coopv3_102",
			"name": "Shadow or Light?",
			"playerClass": "Priest",
			"set": "Tb",
			"text": "<b>Choose One -</b> Each player draws 2 cards; or Restore 8 Health to each hero.",
			"type": "Spell"
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
			"cardImage": "TB_PickYourFate_4.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : carte",
				"text": "Quand un serviteur meurt, son propriétaire pioche une carte."
			},
			"id": "TB_PickYourFate_4",
			"name": "Dire Fate: Card",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "When a minion dies, its owner draws a card.",
			"type": "Spell"
		},
		{
			"artist": "Vance Kovacs",
			"attack": 2,
			"cardImage": "EX1_004.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Jeune prêtresse",
				"text": "À la fin de votre tour, donne +1 PV à un autre serviteur allié aléatoire."
			},
			"health": 1,
			"id": "EX1_004",
			"name": "Young Priestess",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "At the end of your turn, give another random friendly minion +1 Health.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX15_02.png",
			"cost": 0,
			"fr": {
				"name": "Trait de givre",
				"text": "<b>Pouvoir héroïque</b>\nInflige 2 points de dégâts au héros adverse et le <b>gèle</b>."
			},
			"id": "NAX15_02",
			"name": "Frost Blast",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDeal 2 damage to the enemy hero and <b>Freeze</b> it.",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "FP1_017.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Seigneur de la toile nérub’ar",
				"text": "Les serviteurs avec <b>Cri de guerre</b> coûtent (2) cristaux de plus."
			},
			"health": 4,
			"id": "FP1_017",
			"name": "Nerub'ar Weblord",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Naxx",
			"text": "Minions with <b>Battlecry</b> cost (2) more.",
			"type": "Minion"
		},
		{
			"cardImage": "LOE_061e.png",
			"fr": {
				"name": "Puissance des titans",
				"text": "+3/+3."
			},
			"id": "LOE_061e",
			"name": "Power of the Titans",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "+3/+3.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "CRED_07.png",
			"cost": 2,
			"fr": {
				"name": "Zwick",
				"text": "<b>Cri de guerre :</b> se plaint du prix du bacon."
			},
			"health": 2,
			"id": "CRED_07",
			"name": "Zwick",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Complain about bacon prices.",
			"type": "Minion"
		},
		{
			"artist": "Lars Grant-West",
			"attack": 4,
			"cardImage": "OG_138.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Prophète nérubien",
				"text": "Au début de votre tour, réduit le coût en mana de cette carte de\n(1) |4(cristal,cristaux)."
			},
			"health": 4,
			"id": "OG_138",
			"name": "Nerubian Prophet",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "At the start of your turn, reduce this card's\nCost by (1).",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_010b.png",
			"fr": {
				"name": "Choix de Velen",
				"text": "+2/+4 et <b>dégâts des sorts :+1</b>."
			},
			"id": "GVG_010b",
			"name": "Velen's Chosen",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "+2/+4 and <b>Spell Damage +1</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX11_01H.png",
			"fr": {
				"name": "Grobbulus"
			},
			"health": 45,
			"id": "NAX11_01H",
			"name": "Grobbulus",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "EX1_155be.png",
			"fr": {
				"name": "Marque de la nature",
				"text": "Ce serviteur a +4 PV et <b>Provocation</b>."
			},
			"id": "EX1_155be",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "This minion has +4 Health and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA04_4H.png",
			"cost": 3,
			"fr": {
				"name": "Déchaînement",
				"text": "Invoque 3 liges du feu. <b>Surcharge :</b> (2)"
			},
			"id": "BRMA04_4H",
			"name": "Rock Out",
			"overload": 2,
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Summon 3 Firesworn. <b>Overload:</b> (2)",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "EX1_538t.png",
			"cost": 1,
			"fr": {
				"name": "Chien",
				"text": "<b>Charge</b>"
			},
			"health": 1,
			"id": "EX1_538t",
			"name": "Hound",
			"playerClass": "Hunter",
			"set": "Expert1",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_8.png",
			"cost": 2,
			"fr": {
				"name": "Mutation chromatique",
				"text": "Transforme un serviteur en draconien chromatique 2/2."
			},
			"id": "BRMA12_8",
			"name": "Chromatic Mutation",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Transform a minion into a 2/2 Chromatic Dragonkin.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_104.png",
			"cost": 0,
			"fr": {
				"name": "Add 4 to Health.",
				"text": "Adds 4 health to a damaged character. Does NOT heal."
			},
			"id": "XXX_104",
			"name": "Add 4 to Health.",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Adds 4 health to a damaged character. Does NOT heal.",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "KARA_13_03H.png",
			"cost": 2,
			"fr": {
				"name": "Guerrière orque",
				"text": "<b>Charge</b>"
			},
			"health": 3,
			"id": "KARA_13_03H",
			"name": "Orc Warrior",
			"playerClass": "Warrior",
			"set": "Kara",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "GVG_085.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Ennuy-o-tron",
				"text": "<b>Provocation</b>\n<b>Bouclier divin</b>"
			},
			"health": 2,
			"id": "GVG_085",
			"name": "Annoy-o-Tron",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Taunt</b>\n<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "KAR_026.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Protégez le roi !",
				"text": "Invoque un pion 1/1 avec <b>Provocation</b> pour chaque serviteur adverse."
			},
			"id": "KAR_026",
			"name": "Protect the King!",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Kara",
			"text": "For each enemy minion, summon a 1/1 Pawn with <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "NEW1_025e.png",
			"fr": {
				"name": "Renforcement",
				"text": "Vie augmentée."
			},
			"id": "NEW1_025e",
			"name": "Bolstered",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_050.png",
			"cost": 0,
			"fr": {
				"name": "Destroy a Mana Crystal",
				"text": "Pick a player and destroy one of his Mana Crystals."
			},
			"id": "XXX_050",
			"name": "Destroy a Mana Crystal",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Pick a player and destroy one of his Mana Crystals.",
			"type": "Spell"
		},
		{
			"artist": "L. Lullabi & S. Srisuwan",
			"cardImage": "OG_202a.png",
			"cost": 0,
			"fr": {
				"name": "Force d’Y’Shaarj",
				"text": "Invoque une gelée 2/2."
			},
			"id": "OG_202a",
			"name": "Y'Shaarj's Strength",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"text": "Summon a 2/2 Slime.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_3.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : Furie des vents",
				"text": "Tous les serviteurs ont <b>Furie des vents</b>."
			},
			"id": "TB_PickYourFate_3",
			"name": "Dire Fate: Windfury",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "All minions have <b>Windfury</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA05_02.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester serviteurs !",
				"text": "<b>Pouvoir héroïque passif</b> Les serviteurs adverses coûtent (2) |4(cristal,cristaux) de plus. Le pouvoir change au début de votre tour."
			},
			"id": "LOEA05_02",
			"name": "Trogg Hate Minions!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\n Enemy minions cost (2) more. Swap at the start of your turn.",
			"type": "Hero_power"
		},
		{
			"artist": "E.M. Gist",
			"cardImage": "GVG_017.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Appel du familier",
				"text": "Vous piochez une carte. Si c’est une Bête, elle coûte (4) cristaux de moins."
			},
			"id": "GVG_017",
			"name": "Call Pet",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Draw a card.\nIf it's a Beast, it costs (4) less.",
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "BRMA15_4.png",
			"cost": 1,
			"fr": {
				"name": "Aberration",
				"text": "<b>Charge</b>"
			},
			"health": 1,
			"id": "BRMA15_4",
			"name": "Aberration",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "GVG_011.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Réducteur fou",
				"text": "<b>Cri de guerre :</b> donne à un serviteur -2 ATQ pendant ce tour."
			},
			"health": 2,
			"id": "GVG_011",
			"name": "Shrinkmeister",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Give a minion -2 Attack this turn.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_MP_02e.png",
			"fr": {
				"name": "Reconverti",
				"text": "<b>Râle d’agonie :</b> vous piochez une carte."
			},
			"id": "TB_MP_02e",
			"name": "Repurposed",
			"playerClass": "Dream",
			"set": "Tb",
			"text": "<b>Deathrattle:</b> Draw a card.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFateRandom.png",
			"fr": {
				"name": "Choisissez votre destin - Aléatoire"
			},
			"id": "TB_PickYourFateRandom",
			"name": "Pick Your Fate Random",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA05_2H.png",
			"cost": 0,
			"fr": {
				"name": "Mana enflammé",
				"text": "<b>Pouvoir héroïque</b>\nInflige 10 points de dégâts au héros adverse s’il lui reste des cristaux de mana inutilisés."
			},
			"id": "BRMA05_2H",
			"name": "Ignite Mana",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nDeal 10 damage to the enemy hero if they have any unspent Mana.",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX11_04e.png",
			"fr": {
				"name": "Injection mutante",
				"text": "+4/+4 et <b>Provocation</b>."
			},
			"id": "NAX11_04e",
			"name": "Mutating Injection",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "+4/+4 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "AT_031.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Vide-gousset",
				"text": "Chaque fois que ce serviteur attaque un héros, ajoute une carte La pièce dans votre main."
			},
			"health": 2,
			"id": "AT_031",
			"name": "Cutpurse",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "Whenever this minion attacks a hero, add the Coin to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "FP1_020.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Venger",
				"text": "<b>Secret :</b> quand l’un de vos serviteurs meurt, donne +3/+2 à un serviteur allié aléatoire."
			},
			"id": "FP1_020",
			"name": "Avenge",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Secret:</b> When one of your minions dies, give a random friendly minion +3/+2.",
			"type": "Spell"
		},
		{
			"artist": "Alex Garner",
			"attack": 7,
			"cardImage": "GVG_110.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Dr Boum",
				"text": "<b>Cri de guerre_:</b> invoque deux Ro’Boum_1/1. <i>ATTENTION_: les Ro’Boum peuvent exploser.</i>"
			},
			"health": 7,
			"id": "GVG_110",
			"name": "Dr. Boom",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Summon two 1/1 Boom Bots. <i>WARNING: Bots may explode.</i>",
			"type": "Minion"
		},
		{
			"cardImage": "NAX11_02H.png",
			"cost": 0,
			"fr": {
				"name": "Nuage empoisonné",
				"text": "<b>Pouvoir héroïque</b>\nInflige 2 points de dégâts à\n tous les adversaires. Invoque une gelée si l’un d’eux meurt."
			},
			"id": "NAX11_02H",
			"name": "Poison Cloud",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDeal 2 damage to all enemies. If any die, summon a slime.",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX9_07e.png",
			"fr": {
				"name": "Marque des cavaliers",
				"text": "+1/+1."
			},
			"id": "NAX9_07e",
			"name": "Mark of the Horsemen",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"attack": 3,
			"cardImage": "NAX12_03H.png",
			"cost": 1,
			"durability": 5,
			"fr": {
				"name": "Mâchoires",
				"text": "Gagne +2 ATQ chaque fois qu’un serviteur avec <b>Râle d’agonie</b> meurt."
			},
			"id": "NAX12_03H",
			"name": "Jaws",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Whenever a minion with <b>Deathrattle</b> dies, gain +2 Attack.",
			"type": "Weapon"
		},
		{
			"cardImage": "LOEA_01.png",
			"cost": 3,
			"fr": {
				"name": "Présence menaçante",
				"text": "Vous piochez 2 cartes. Gagne +4 points d’armure."
			},
			"id": "LOEA_01",
			"name": "Looming Presence",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Draw 2 cards. Gain 4 Armor.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA01_02.png",
			"cost": 0,
			"fr": {
				"name": "Bénédictions du soleil",
				"text": "<b>Pouvoir héroïque passif</b>\nLa personne qui contrôle la baguette du Soleil est <b>Insensible</b>."
			},
			"id": "LOEA01_02",
			"name": "Blessings of the Sun",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\nWhoever controls the Rod of the Sun is <b>Immune.</b>",
			"type": "Hero_power"
		},
		{
			"artist": "Sean O’Daniels",
			"cardImage": "CS1_113.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Contrôle mental",
				"text": "Prend le contrôle d’un serviteur adverse."
			},
			"id": "CS1_113",
			"name": "Mind Control",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Core",
			"text": "Take control of an enemy minion.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "James Zhang",
			"cardImage": "CS2_077.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Sprint",
				"text": "Vous piochez 4 cartes."
			},
			"id": "CS2_077",
			"name": "Sprint",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Core",
			"text": "Draw 4 cards.",
			"type": "Spell"
		},
		{
			"artist": "Luke Mancini",
			"cardImage": "KARA_08_05.png",
			"cost": 3,
			"fr": {
				"name": "Rugissement terrifiant",
				"text": "Renvoie un serviteur adverse dans la main de votre adversaire."
			},
			"id": "KARA_08_05",
			"name": "Terrifying Roar",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Return an enemy minion to your opponent's hand.",
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
			"artist": "Brandon Kitkouski",
			"attack": 4,
			"cardImage": "GVG_080.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Druide du Croc",
				"text": "<b>Cri de guerre :</b> si vous avez une Bête, transforme ce serviteur en une carte 7/7."
			},
			"health": 4,
			"id": "GVG_080",
			"name": "Druid of the Fang",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> If you have a Beast, transform this minion into a 7/7.",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_033e.png",
			"fr": {
				"name": "Sang de dragon",
				"text": "+1/+1"
			},
			"id": "BRM_033e",
			"name": "Dragon Blood",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "+1/+1",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_Windfury.png",
			"fr": {
				"name": "Destin",
				"text": "Ce serviteur a <b>Furie des vents</b>."
			},
			"id": "TB_PickYourFate_Windfury",
			"name": "Fate",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "This minion has <b>Windfury</b>",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_166a.png",
			"cost": 0,
			"fr": {
				"name": "Éclat lunaire",
				"text": "Inflige 2 points de dégâts."
			},
			"id": "EX1_166a",
			"name": "Moonfire",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Deal 2 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "KARA_13_11e.png",
			"fr": {
				"name": "Affaiblir",
				"text": "Les points de vie sont passés à 1."
			},
			"id": "KARA_13_11e",
			"name": "Enfeeble",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Health changed to 1.",
			"type": "Enchantment"
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
			"cardImage": "LOEA01_01h.png",
			"fr": {
				"name": "Écumeur du soleil Phaerix"
			},
			"health": 30,
			"id": "LOEA01_01h",
			"name": "Sun Raider Phaerix",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "AT_069.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Partenaire d’entraînement",
				"text": "<b>Provocation</b>\n<b>Cri de guerre :</b> confère <b>Provocation</b> à un serviteur."
			},
			"health": 2,
			"id": "AT_069",
			"name": "Sparring Partner",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Taunt</b>\n<b>Battlecry:</b> Give a\nminion <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Evgeniy Zaqumyenny",
			"cardImage": "KAR_075.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Portail de Reflet-de-Lune",
				"text": "Rend 6 PV. Invoque un serviteur aléatoire coûtant 6_cristaux."
			},
			"id": "KAR_075",
			"name": "Moonglade Portal",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Kara",
			"text": "Restore 6 Health. Summon a random\n6-Cost minion.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"attack": 5,
			"cardImage": "NEW1_005.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Kidnappeur",
				"text": "<b>Combo :</b> renvoie un serviteur dans la main de son propriétaire."
			},
			"health": 3,
			"id": "NEW1_005",
			"name": "Kidnapper",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Combo:</b> Return a minion to its owner's hand.",
			"type": "Minion"
		},
		{
			"artist": "Adam Byrne",
			"attack": 3,
			"cardImage": "OG_334.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Acolyte capuchonnée",
				"text": "Chaque fois qu’un personnage est soigné, donne +1/+1 à votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 6,
			"id": "OG_334",
			"name": "Hooded Acolyte",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Og",
			"text": "Whenever a character is healed, give your\nC'Thun +1/+1 <i>(wherever it is).</i>",
			"type": "Minion"
		},
		{
			"artist": "Chippy",
			"cardImage": "EX1_363.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Bénédiction de sagesse",
				"text": "Choisissez un serviteur. Chaque fois qu’il attaque, vous piochez une carte."
			},
			"id": "EX1_363",
			"name": "Blessing of Wisdom",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Choose a minion. Whenever it attacks, draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_2_Ench.png",
			"fr": {
				"name": "Pick Your Fate 2 Ench"
			},
			"id": "TB_PickYourFate_2_Ench",
			"name": "Pick Your Fate 2 Ench",
			"playerClass": "Neutral",
			"set": "Tb",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 1,
			"cardImage": "KAR_A10_01.png",
			"cost": 1,
			"fr": {
				"name": "Pion noir",
				"text": "<b>Attaque automatique_:</b> inflige 1 point de dégâts aux adversaires en face de ce serviteur."
			},
			"health": 6,
			"id": "KAR_A10_01",
			"name": "Black Pawn",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Auto-Attack:</b> Deal 1 damage to the enemies opposite this minion.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_068a.png",
			"fr": {
				"name": "Magie métabolisée",
				"text": "Attaque augmentée."
			},
			"id": "GVG_068a",
			"name": "Metabolized Magic",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Edouard Guiton & Tony Washington",
			"attack": 5,
			"cardImage": "AT_108.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Cheval de guerre cuirassé",
				"text": "<b>Cri de guerre :</b> révèle un serviteur de chaque deck. Si le vôtre coûte plus, gagne <b>Charge</b>."
			},
			"health": 3,
			"id": "AT_108",
			"name": "Armored Warhorse",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, gain <b>Charge</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "KAR_A01_02e.png",
			"fr": {
				"name": "Reflet",
				"text": "1/1."
			},
			"id": "KAR_A01_02e",
			"name": "Reflection",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "1/1.",
			"type": "Enchantment"
		},
		{
			"artist": "Josh Harris",
			"attack": 0,
			"cardImage": "KARA_08_08.png",
			"cost": 11,
			"fr": {
				"name": "Portail rouge",
				"text": "Le personnage dans le rayon rouge a <b>Furie des vents</b>."
			},
			"health": 1,
			"id": "KARA_08_08",
			"name": "Red Portal",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "The character in the red beam has <b>Windfury</b>.",
			"type": "Minion"
		},
		{
			"artist": "Peter Stapleton",
			"attack": 1,
			"cardImage": "KAR_089.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Diablotin de Malchezaar",
				"text": "Chaque fois que vous vous défaussez d’une carte, vous en piochez une."
			},
			"health": 3,
			"id": "KAR_089",
			"name": "Malchezaar's Imp",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Kara",
			"text": "Whenever you discard a card, draw a card.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_13_13.png",
			"cost": 2,
			"fr": {
				"name": "Légion",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un abyssal_6/6."
			},
			"id": "KARA_13_13",
			"name": "Legion",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nSummon a 6/6 Abyssal.",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_FactionWar_Rag1.png",
			"cost": 4,
			"fr": {
				"name": "MEURS, INSECTE !",
				"text": "Votre pouvoir héroïque devient « Inflige $8 points de dégâts à un adversaire aléatoire »."
			},
			"id": "TB_FactionWar_Rag1",
			"name": "DIE, INSECT!",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Your hero power becomes \"Deal $8 damage to random enemy.\"",
			"type": "Spell"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 6,
			"cardImage": "AT_098.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Mangesort prodigieuse",
				"text": "<b>Cri de guerre :</b> copie le pouvoir héroïque de votre adversaire."
			},
			"health": 5,
			"id": "AT_098",
			"name": "Sideshow Spelleater",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Copy your opponent's Hero Power.",
			"type": "Minion"
		},
		{
			"artist": "Eva Widermann",
			"attack": 2,
			"cardImage": "GVG_030.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Ourson robot anodisé",
				"text": "<b>Provocation</b>.\n<b>Choix des armes :</b>\n+1 ATQ ou +1 PV."
			},
			"health": 2,
			"id": "GVG_030",
			"name": "Anodized Robo Cub",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Taunt</b>. <b>Choose One -</b>\n+1 Attack; or +1 Health.",
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
				"name": "Mécano de petit dragon",
				"text": "<b>Cri de guerre :</b> invoque un petit dragon mécanique 2/1."
			},
			"health": 4,
			"id": "EX1_025",
			"name": "Dragonling Mechanic",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Summon a 2/1 Mechanical Dragonling.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_009.png",
			"fr": {
				"name": "Créer 15 secrets"
			},
			"id": "TB_009",
			"name": "Create 15 Secrets",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Ben Wootten",
			"cardImage": "EX1_596.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Feu démoniaque",
				"text": "Inflige $2 |4(point,points) de dégâts à un serviteur. Si la cible est un de vos démons, lui donne +2/+2 à la place."
			},
			"id": "EX1_596",
			"name": "Demonfire",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Deal $2 damage to a minion. If it’s a friendly Demon, give it +2/+2 instead.",
			"type": "Spell"
		},
		{
			"cardImage": "KARA_12_01H.png",
			"fr": {
				"name": "Ombre d’Aran"
			},
			"health": 30,
			"id": "KARA_12_01H",
			"name": "Shade of Aran",
			"playerClass": "Mage",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA04_30.png",
			"cost": 0,
			"fr": {
				"name": "Les ténèbres",
				"text": "<b>Prendre le raccourci ?</b>"
			},
			"id": "LOEA04_30",
			"name": "The Darkness",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Take the Shortcut?</b>",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA15_2H.png",
			"cost": 0,
			"fr": {
				"name": "L’alchimiste",
				"text": "<b>Pouvoir héroïque passif</b>\nL’Attaque et la Vie des serviteurs sont échangées.\nVos serviteurs ont +2/+2."
			},
			"id": "BRMA15_2H",
			"name": "The Alchemist",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Passive Hero Power</b>\nMinions' Attack and Health are swapped.\nYour minions have +2/+2.",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_ClassRandom_Mage.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : mage",
				"text": "Ajoute des cartes de mage dans votre deck."
			},
			"id": "TB_ClassRandom_Mage",
			"name": "Second Class: Mage",
			"playerClass": "Mage",
			"set": "Tb",
			"text": "Add Mage cards to your deck.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "KARA_13_26.png",
			"cost": 3,
			"durability": 3,
			"fr": {
				"name": "Atiesh",
				"text": "Après que vous avez lancé un sort, invoque un serviteur aléatoire de même coût. Perd 1_point de durabilité."
			},
			"id": "KARA_13_26",
			"name": "Atiesh",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "[x]After you cast a spell,\nsummon a random\nminion of that Cost.\nLose 1 Durability.",
			"type": "Weapon"
		},
		{
			"cardImage": "KAR_a10_Boss2H.png",
			"fr": {
				"name": "Roi noir"
			},
			"health": 20,
			"id": "KAR_a10_Boss2H",
			"name": "Black King",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_009.png",
			"cost": 0,
			"fr": {
				"name": "Enchant",
				"text": "Enchant a minion with an empty enchant."
			},
			"id": "XXX_009",
			"name": "Enchant",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Enchant a minion with an empty enchant.",
			"type": "Spell"
		},
		{
			"artist": "Luke Mancini",
			"attack": 2,
			"cardImage": "OG_271.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Cauchemar écailleux",
				"text": "Au début de votre tour, double l’Attaque de ce serviteur."
			},
			"health": 8,
			"id": "OG_271",
			"name": "Scaled Nightmare",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Og",
			"text": "At the start of your turn, double this minion's Attack.",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 1,
			"cardImage": "LOE_116.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Chercheuse du Reliquaire",
				"text": "<b>Cri de guerre :</b> gagne +4/+4 si vous avez\n6 autres serviteurs."
			},
			"health": 1,
			"id": "LOE_116",
			"name": "Reliquary Seeker",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Loe",
			"text": "<b>Battlecry:</b> If you have 6 other minions, gain +4/+4.",
			"type": "Minion"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "KAR_A01_02.png",
			"cost": 0,
			"fr": {
				"name": "Reflets",
				"text": "<b>Pouvoir héroïque passif</b>\nChaque fois qu’un serviteur est joué, en invoque une copie_1/1."
			},
			"id": "KAR_A01_02",
			"name": "Reflections",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Passive Hero Power</b>\nWhenever a minion is played, summon a 1/1 copy of it.",
			"type": "Hero_power"
		},
		{
			"artist": "Matt Dixon",
			"attack": 3,
			"cardImage": "KAR_095.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Zoobot",
				"text": "<b>Cri de guerre_:</b> donne +1/+1 à une Bête, un Dragon et un Murloc alliés aléatoires."
			},
			"health": 3,
			"id": "KAR_095",
			"name": "Zoobot",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Give a random friendly Beast, Dragon, and Murloc +1/+1.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "NAX8_03t.png",
			"cost": 1,
			"fr": {
				"name": "Jeune recrue spectrale",
				"text": "Au début de votre tour, inflige 1 point de dégâts à votre héros."
			},
			"health": 2,
			"id": "NAX8_03t",
			"name": "Spectral Trainee",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "At the start of your turn, deal 1 damage to your hero.",
			"type": "Minion"
		},
		{
			"cardImage": "KAR_a10_Boss1H.png",
			"fr": {
				"name": "Roi blanc"
			},
			"health": 20,
			"id": "KAR_a10_Boss1H",
			"name": "White King",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "KARA_00_02H.png",
			"cost": 2,
			"fr": {
				"name": "Légion",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un abyssal_6/6."
			},
			"id": "KARA_00_02H",
			"name": "Legion",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nSummon a 6/6 Abyssal.",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "tt_004.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Goule mangeuse de chair",
				"text": "Chaque fois qu’un serviteur meurt, gagne +1 ATQ."
			},
			"health": 3,
			"id": "tt_004",
			"name": "Flesheating Ghoul",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Whenever a minion dies, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Todd Lockwood",
			"attack": 5,
			"cardImage": "AT_118.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Grande croisée",
				"text": "<b>Cri de guerre :</b> ajoute une carte paladin aléatoire dans votre main."
			},
			"health": 5,
			"id": "AT_118",
			"name": "Grand Crusader",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Add a random Paladin card to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 2,
			"cardImage": "OG_083.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Mande-flamme du Crépuscule",
				"text": "<b>Cri de guerre :</b> inflige 1 point de dégâts à tous les serviteurs adverses."
			},
			"health": 2,
			"id": "OG_083",
			"name": "Twilight Flamecaller",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Battlecry:</b> Deal 1 damage to all enemy minions.",
			"type": "Minion"
		},
		{
			"artist": "A. J. Nazzaro",
			"attack": 9,
			"cardImage": "OG_173.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Sang de l’Ancien",
				"text": "Si vous contrôlez deux de ces serviteurs à la fin de votre tour, les fusionne en « l’Ancien »."
			},
			"health": 9,
			"id": "OG_173",
			"name": "Blood of The Ancient One",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Og",
			"text": "If you control two of these\nat the end of your turn, merge them into 'The Ancient One'.",
			"type": "Minion"
		},
		{
			"artist": "Lars Grant-West",
			"cardImage": "CS2_053.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Double vue",
				"text": "Vous piochez une carte. Elle coûte (3) cristaux de moins."
			},
			"id": "CS2_053",
			"name": "Far Sight",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Draw a card. That card costs (3) less.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_573a.png",
			"cost": 0,
			"fr": {
				"name": "Faveur du demi-dieu",
				"text": "Confère +2/+2 à vos autres serviteurs."
			},
			"id": "EX1_573a",
			"name": "Demigod's Favor",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Give your other minions +2/+2.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_160a.png",
			"cost": 0,
			"fr": {
				"name": "Invocation de panthère",
				"text": "Invoque une panthère 3/2."
			},
			"id": "EX1_160a",
			"name": "Summon a Panther",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Summon a 3/2 Panther.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpBossSpell_5.png",
			"cost": 0,
			"fr": {
				"name": "Double zap",
				"text": "Inflige les dégâts de l’attaque aux deux joueurs."
			},
			"id": "TB_CoOpBossSpell_5",
			"name": "Double Zap",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Deal Attack damage to both players.",
			"type": "Spell"
		},
		{
			"artist": "Rafael Zanchetin",
			"attack": 2,
			"cardImage": "OG_221.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Héroïne altruiste",
				"text": "<b>Râle d’agonie :</b> confère <b>Bouclier divin</b> à un serviteur allié aléatoire."
			},
			"health": 1,
			"id": "OG_221",
			"name": "Selfless Hero",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Give a random friendly minion <b>Divine Shield</b>.",
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
				"name": "Ancien maître brasseur",
				"text": "<b>Cri de guerre :</b> renvoie un serviteur allié du champ de bataille et le place dans votre main."
			},
			"health": 4,
			"id": "EX1_057",
			"name": "Ancient Brewmaster",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Return a friendly minion from the battlefield to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_00_01H.png",
			"fr": {
				"name": "Prince Malchezaar"
			},
			"health": 60,
			"id": "KARA_00_01H",
			"name": "Prince Malchezaar",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Seamus Gallagher",
			"attack": 9,
			"cardImage": "AT_103.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Kraken de la mer Boréale",
				"text": "<b>Cri de guerre :</b> inflige\n4 points de dégâts."
			},
			"health": 7,
			"id": "AT_103",
			"name": "North Sea Kraken",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Deal 4 damage.",
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
				"name": "Clé de maître des rouages",
				"text": "A +2 ATQ tant que vous avez un Méca."
			},
			"id": "GVG_024",
			"name": "Cogmaster's Wrench",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Has +2 Attack while you have a Mech.",
			"type": "Weapon"
		},
		{
			"artist": "Luke Mancini",
			"attack": 3,
			"cardImage": "GVG_117.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Gazleu",
				"text": "Chaque fois que vous lancez un sort à 1 cristal, ajoute un Méca aléatoire dans votre main."
			},
			"health": 6,
			"id": "GVG_117",
			"name": "Gazlowe",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "Whenever you cast a 1-mana spell, add a random Mech to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_354.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Imposition des mains",
				"text": "Rend #8 |4(point,points) de vie. Vous piochez 3 cartes."
			},
			"id": "EX1_354",
			"name": "Lay on Hands",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Restore #8 Health. Draw 3 cards.",
			"type": "Spell"
		},
		{
			"artist": "Nutthapon Petchthai",
			"cardImage": "AT_001.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Lance de flammes",
				"text": "Inflige $8 |4(point,points) de dégâts à un serviteur."
			},
			"id": "AT_001",
			"name": "Flame Lance",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Deal $8 damage to a minion.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX8_01.png",
			"fr": {
				"name": "Gothik le Moissonneur"
			},
			"health": 30,
			"id": "NAX8_01",
			"name": "Gothik the Harvester",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "KARA_06_02heroic.png",
			"fr": {
				"name": "Julianne"
			},
			"health": 15,
			"id": "KARA_06_02heroic",
			"name": "Julianne",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA06_03e.png",
			"fr": {
				"name": "Animé",
				"text": "+1/+1 et <b>Provocation</b>."
			},
			"id": "LOEA06_03e",
			"name": "Animated",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "+1/+1 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "LOEA04_25h.png",
			"cost": 8,
			"fr": {
				"name": "Statue vengeresse",
				"text": "Inflige 5 points de dégâts à tous les adversaires à la fin de votre tour."
			},
			"health": 9,
			"id": "LOEA04_25h",
			"name": "Seething Statue",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "At the end of your turn, deal 5 damage to all enemies.",
			"type": "Minion"
		},
		{
			"artist": "Michael Komarck",
			"cardImage": "EX1_606.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maîtrise du blocage",
				"text": "Vous gagnez 5 points d’armure.\nVous piochez une carte."
			},
			"id": "EX1_606",
			"name": "Shield Block",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Core",
			"text": "Gain 5 Armor.\nDraw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_BlingBrawl_Blade1e.png",
			"fr": {
				"name": "Lame de Bling-o-tron",
				"text": "Quand elle casse, invoque une nouvelle arme aléatoire."
			},
			"id": "TB_BlingBrawl_Blade1e",
			"name": "Blingtron's Blade",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "When this breaks, randomly summon a new weapon.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 4,
			"cardImage": "DS1_055.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Soigneuse sombrécaille",
				"text": "<b>Cri de guerre :</b> rend 2 points de vie à tous les personnages alliés."
			},
			"health": 5,
			"id": "DS1_055",
			"name": "Darkscale Healer",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Restore 2 Health to all friendly characters.",
			"type": "Minion"
		},
		{
			"artist": "Warren Mahy",
			"attack": 3,
			"cardImage": "AT_014.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Ombrefiel",
				"text": "Chaque fois que vous piochez une carte, réduit son coût de\n(1) |4(cristal,cristaux)."
			},
			"health": 3,
			"id": "AT_014",
			"name": "Shadowfiend",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Whenever you draw a card, reduce its Cost by (1).",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_274e.png",
			"fr": {
				"name": "Puissance brute !",
				"text": "Caractéristiques augmentées."
			},
			"id": "EX1_274e",
			"name": "Raw Power!",
			"playerClass": "Mage",
			"set": "Expert1",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Lucas Graciano",
			"cardImage": "CS2_092.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Bénédiction des rois",
				"text": "Confère à un serviteur +4/+4. <i>(+4 ATQ/+4 PV)</i>"
			},
			"id": "CS2_092",
			"name": "Blessing of Kings",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Core",
			"text": "Give a minion +4/+4. <i>(+4 Attack/+4 Health)</i>",
			"type": "Spell"
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
			"attack": 3,
			"cardImage": "AT_042t2.png",
			"cost": 2,
			"fr": {
				"name": "Panthère dent-de-sabre",
				"text": "<b>Camouflage</b>"
			},
			"health": 2,
			"id": "AT_042t2",
			"name": "Sabertooth Panther",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"cardImage": "TB_CoOpv3_009e.png",
			"fr": {
				"name": "Transformation en nova",
				"text": "Ça va exploser_!"
			},
			"id": "TB_CoOpv3_009e",
			"name": "Going Nova",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "It's about to blow!",
			"type": "Enchantment"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "CS2_008.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Éclat lunaire",
				"text": "Inflige $1 |4(point,points) de dégâts."
			},
			"id": "CS2_008",
			"name": "Moonfire",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $1 damage.",
			"type": "Spell"
		},
		{
			"artist": "Matt Cavotta",
			"cardImage": "EX1_409.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Amélioration !",
				"text": "Si vous avez une arme, lui donne +1/+1. Sinon, vous équipe d’une arme 1/3."
			},
			"id": "EX1_409",
			"name": "Upgrade!",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "If you have a weapon, give it +1/+1. Otherwise equip a 1/3 weapon.",
			"type": "Spell"
		},
		{
			"cardImage": "KARA_08_02e.png",
			"fr": {
				"name": "Rage du Néant",
				"text": "+3 ATQ."
			},
			"id": "KARA_08_02e",
			"name": "Nether Rage",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_059o.png",
			"fr": {
				"name": "Pacte de sang",
				"text": "Vie augmentée."
			},
			"id": "CS2_059o",
			"name": "Blood Pact",
			"playerClass": "Warlock",
			"set": "Expert1",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "LOEA02_10c.png",
			"cost": 0,
			"fr": {
				"name": "Misha",
				"text": "<b>Provocation</b>"
			},
			"health": 4,
			"id": "LOEA02_10c",
			"name": "Misha",
			"playerClass": "Hunter",
			"set": "Loe",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_014e.png",
			"fr": {
				"name": "Déguisé",
				"text": "Camouflé jusqu’à votre prochain tour."
			},
			"id": "NEW1_014e",
			"name": "Disguised",
			"playerClass": "Rogue",
			"set": "Expert1",
			"text": "Stealthed until your next turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 8,
			"cardImage": "GVG_016.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Saccageur gangrené",
				"text": "Chaque fois que votre adversaire joue une carte, retire les 3 cartes du dessus de votre deck."
			},
			"health": 8,
			"id": "GVG_016",
			"name": "Fel Reaver",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Whenever your opponent plays a card, remove the top 3 cards of your deck.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX13_01.png",
			"fr": {
				"name": "Thaddius"
			},
			"health": 30,
			"id": "NAX13_01",
			"name": "Thaddius",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "TB_PickYourFate_10.png",
			"cost": 0,
			"fr": {
				"name": "Bonus : Cri de guerre",
				"text": "Vos serviteurs avec <b>Cri de guerre</b> ont +1/+1."
			},
			"id": "TB_PickYourFate_10",
			"name": "Battlecry Bonus",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Your <b>Battlecry</b> minions have +1/+1.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_037a.png",
			"cost": 0,
			"fr": {
				"name": "Racines vivantes",
				"text": "Inflige $2 |4(point,points) de dégâts."
			},
			"id": "AT_037a",
			"name": "Living Roots",
			"playerClass": "Druid",
			"set": "Tgt",
			"text": "Deal $2 damage.",
			"type": "Spell"
		},
		{
			"artist": "Efrem Palacios",
			"cardImage": "CS2_094.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Marteau de courroux",
				"text": "Inflige $3 |4(point,points) de dégâts. Vous piochez une carte."
			},
			"id": "CS2_094",
			"name": "Hammer of Wrath",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $3 damage.\nDraw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_042a.png",
			"cost": 0,
			"fr": {
				"name": "Forme de lion",
				"text": "<b>Charge</b>"
			},
			"id": "AT_042a",
			"name": "Lion Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Charge</b>",
			"type": "Spell"
		},
		{
			"artist": "Andrew Hou",
			"cardImage": "GVG_050.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Lame rebondissante",
				"text": "Inflige $1 |4(point,points) de dégâts à un serviteur aléatoire. Recommence jusqu’à ce qu’un serviteur meure."
			},
			"id": "GVG_050",
			"name": "Bouncing Blade",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Deal $1 damage to a random minion. Repeat until a minion dies.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "TU4e_003.png",
			"cost": 1,
			"fr": {
				"name": "Myrmidon naga",
				"text": "<b></b>"
			},
			"health": 1,
			"id": "TU4e_003",
			"name": "Naga Myrmidon",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "<b></b> ",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "EX1_tk11.png",
			"cost": 2,
			"fr": {
				"name": "Esprit du loup",
				"text": "<b>Provocation</b>"
			},
			"health": 3,
			"id": "EX1_tk11",
			"name": "Spirit Wolf",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_22H.png",
			"cost": 10,
			"fr": {
				"name": "Archaedas",
				"text": "Transforme un serviteur adverse aléatoire en statue 0/2 à la fin de votre tour."
			},
			"health": 10,
			"id": "LOEA16_22H",
			"name": "Archaedas",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, turn a random enemy minion into a 0/2 Statue.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "BRMA03_3.png",
			"cost": 2,
			"fr": {
				"name": "Moira Barbe-de-Bronze",
				"text": "Thaurissan ne peut pas utiliser son pouvoir héroïque.\nN’attaque jamais de serviteurs à moins qu’ils n’aient <b>Provocation</b>."
			},
			"health": 3,
			"id": "BRMA03_3",
			"name": "Moira Bronzebeard",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Thaurissan's Hero Power can't be used.\nNever attacks minions unless they have <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "EX1_096.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Amasseur de butin",
				"text": "<b>Râle d’agonie :</b> vous piochez une carte."
			},
			"health": 1,
			"id": "EX1_096",
			"name": "Loot Hoarder",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Deathrattle:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "DS1_233.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Attaque mentale",
				"text": "Inflige $5 |4(point,points) de dégâts au héros adverse."
			},
			"id": "DS1_233",
			"name": "Mind Blast",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $5 damage to the enemy hero.",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "CRED_09.png",
			"cost": 6,
			"fr": {
				"name": "Ben Thompson",
				"text": "<b>Cri de guerre :</b> dessine ses propres cartes."
			},
			"health": 7,
			"id": "CRED_09",
			"name": "Ben Thompson",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Draw some cards. With a pen.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "XXX_044.png",
			"cost": 0,
			"fr": {
				"name": "Hand Swapper Minion",
				"text": "<b>Battlecry:</b> Discard 3 cards, then draw 3 cards."
			},
			"health": 5,
			"id": "XXX_044",
			"name": "Hand Swapper Minion",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "<b>Battlecry:</b> Discard 3 cards, then draw 3 cards.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_FactionWar_BoomBot.png",
			"fr": {
				"name": "TBFactionWarBoomBot"
			},
			"id": "TB_FactionWar_BoomBot",
			"name": "TBFactionWarBoomBot",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "KAR_702e.png",
			"fr": {
				"name": "Un tour simple",
				"text": "+2/+2."
			},
			"id": "KAR_702e",
			"name": "A Simple Trick",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "NEW1_020.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Pyromancien sauvage",
				"text": "Après que vous avez lancé un sort, inflige 1 point de dégâts à TOUS les serviteurs."
			},
			"health": 2,
			"id": "NEW1_020",
			"name": "Wild Pyromancer",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "After you cast a spell, deal 1 damage to ALL minions.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_055o.png",
			"fr": {
				"name": "Surpuissant",
				"text": "L’Attaque de l’accro au mana est augmentée."
			},
			"id": "EX1_055o",
			"name": "Empowered",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Mana Addict has increased Attack.",
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
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Minion"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 2,
			"cardImage": "AT_017.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gardien du Crépuscule",
				"text": "<b>Cri de guerre :</b> gagne\n+1 ATQ et <b>Provocation</b> si vous avez un Dragon en main."
			},
			"health": 6,
			"id": "AT_017",
			"name": "Twilight Guardian",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1 Attack and <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Wei Wang",
			"attack": 7,
			"cardImage": "EX1_350.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Prophète Velen",
				"text": "Double les dégâts et les soins de vos sorts et de votre pouvoir héroïque."
			},
			"health": 7,
			"id": "EX1_350",
			"name": "Prophet Velen",
			"playerClass": "Priest",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "Double the damage and healing of your spells and Hero Power.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA09_3.png",
			"cost": 2,
			"fr": {
				"name": "Ancienne Horde",
				"text": "<b>Pouvoir héroïque</b>\nInvoque deux orcs 1/1 avec <b>Provocation</b>. Change de pouvoir héroïque."
			},
			"id": "BRMA09_3",
			"name": "Old Horde",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon two 1/1 Orcs with <b>Taunt</b>. Get a new Hero Power.",
			"type": "Hero_power"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_22.png",
			"cost": 5,
			"fr": {
				"name": "Archaedas",
				"text": "Transforme un serviteur adverse aléatoire en statue 0/2 à la fin de votre tour."
			},
			"health": 5,
			"id": "LOEA16_22",
			"name": "Archaedas",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, turn a random enemy minion into a 0/2 Statue.",
			"type": "Minion"
		},
		{
			"attack": 8,
			"cardImage": "LOEA04_13bth.png",
			"cost": 4,
			"fr": {
				"name": "Garde d’Orsis",
				"text": "<b>Bouclier divin</b>"
			},
			"health": 8,
			"id": "LOEA04_13bth",
			"name": "Orsis Guard",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "John Polidora",
			"attack": 3,
			"cardImage": "EX1_301.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Gangregarde",
				"text": "<b>Provocation</b>. <b>Cri de guerre_:</b> détruit un de vos cristaux de mana."
			},
			"health": 5,
			"id": "EX1_301",
			"name": "Felguard",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Taunt</b>. <b>Battlecry:</b> Destroy one of your Mana Crystals.",
			"type": "Minion"
		},
		{
			"cardImage": "KAR_A02_12H.png",
			"fr": {
				"name": "Golem d’argenterie"
			},
			"health": 30,
			"id": "KAR_A02_12H",
			"name": "Silverware Golem",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Peter Stapleton",
			"cardImage": "OG_211.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Appel de la nature",
				"text": "Invoque les trois compagnons animaux."
			},
			"id": "OG_211",
			"name": "Call of the Wild",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Og",
			"text": "Summon all three Animal Companions.",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "KAR_A10_07.png",
			"cost": 4,
			"fr": {
				"name": "Cavalier noir",
				"text": "<b>Charge</b>.\nNe peut pas attaquer les héros."
			},
			"health": 3,
			"id": "KAR_A10_07",
			"name": "Black Knight",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Charge</b>.\nCan't Attack Heroes.",
			"type": "Minion"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 3,
			"cardImage": "AT_089.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Lieutenant de la garde d’os",
				"text": "<b>Exaltation :</b> gagne +1 PV."
			},
			"health": 2,
			"id": "AT_089",
			"name": "Boneguard Lieutenant",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Gain +1 Health.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "LOEA09_8.png",
			"cost": 5,
			"fr": {
				"name": "Garde ondulant",
				"text": "<b>Provocation</b>"
			},
			"health": 6,
			"id": "LOEA09_8",
			"name": "Slithering Guard",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "L. Lullabi & C. Luechaiwattasopon",
			"attack": 2,
			"cardImage": "KAR_A02_05.png",
			"cost": 2,
			"fr": {
				"name": "Tasse",
				"text": "Les assiettes ont +1_ATQ."
			},
			"health": 1,
			"id": "KAR_A02_05",
			"name": "Cup",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Plates have +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"attack": 5,
			"cardImage": "GVG_083.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Robot réparateur amélioré",
				"text": "<b>Cri de guerre :</b> donne +4 PV à un Méca allié."
			},
			"health": 5,
			"id": "GVG_083",
			"name": "Upgraded Repair Bot",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Give a friendly Mech +4 Health.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_LadyNazjar_PlayerEnch.png",
			"fr": {
				"name": "Transmutation des serviteurs"
			},
			"id": "TB_LadyNazjar_PlayerEnch",
			"name": "Transmute your minions",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Chris Rahn",
			"attack": 4,
			"cardImage": "FP1_008.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Chevalier spectral",
				"text": "Ne peut pas être la cible de sorts ou de pouvoirs héroïques."
			},
			"health": 6,
			"id": "FP1_008",
			"name": "Spectral Knight",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Naxx",
			"text": "Can't be targeted by spells or Hero Powers.",
			"type": "Minion"
		},
		{
			"artist": "Mike Nicholson",
			"attack": 1,
			"cardImage": "FP1_024.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Goule instable",
				"text": "<b>Provocation</b>\n<b>Râle d’agonie :</b> inflige 1 point de dégâts à tous les serviteurs."
			},
			"health": 3,
			"id": "FP1_024",
			"name": "Unstable Ghoul",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Taunt</b>. <b>Deathrattle:</b> Deal 1 damage to all minions.",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 4,
			"cardImage": "EX1_414.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Grommash Hurlenfer",
				"text": "<b>Charge</b>.\n<b>Accès de rage :</b> +6 ATQ"
			},
			"health": 9,
			"id": "EX1_414",
			"name": "Grommash Hellscream",
			"playerClass": "Warrior",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Charge</b>\n<b>Enrage:</b> +6 Attack",
			"type": "Minion"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 4,
			"cardImage": "AT_121.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Favori de la foule",
				"text": "Chaque fois que vous jouez une carte avec <b>Cri de guerre</b>,\nconfère +1/+1."
			},
			"health": 4,
			"id": "AT_121",
			"name": "Crowd Favorite",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Whenever you play a card with <b>Battlecry</b>, gain +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_FactionWar_AnnoySpell1.png",
			"cost": 4,
			"fr": {
				"name": "Fan-club d’Ennuy-o-tron",
				"text": "Invoque 3 Ennuy-o-trons."
			},
			"id": "TB_FactionWar_AnnoySpell1",
			"name": "Annoy-o-Tron Fanclub",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Summon 3 Annoy-o-Trons",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "BRMA09_3t.png",
			"cost": 1,
			"fr": {
				"name": "Orc de l’ancienne Horde",
				"text": "<b>Provocation</b>"
			},
			"health": 1,
			"id": "BRMA09_3t",
			"name": "Old Horde Orc",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_28b.png",
			"cost": 0,
			"fr": {
				"name": "Traverser à pied",
				"text": "Gagne un cristal de mana."
			},
			"id": "LOEA04_28b",
			"name": "Wade Through",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Gain a Mana Crystal",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA13_2H.png",
			"cost": 0,
			"fr": {
				"name": "Puissance des anciens",
				"text": "<b>Pouvoir héroïque</b>\nAjoute une carte aléatoire dans votre main. Elle coûte (0) |4(cristal,cristaux) de mana."
			},
			"id": "LOEA13_2H",
			"name": "Ancient Power",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\nAdd a random card to your hand. It costs (0).",
			"type": "Hero_power"
		},
		{
			"artist": "Efrem Palacios",
			"attack": 2,
			"cardImage": "BRM_016.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Lanceur de hache",
				"text": "Inflige 2 points de dégâts au héros adverse chaque fois que ce serviteur subit des dégâts."
			},
			"health": 5,
			"id": "BRM_016",
			"name": "Axe Flinger",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Brm",
			"text": "Whenever this minion takes damage, deal 2 damage to the enemy hero.",
			"type": "Minion"
		},
		{
			"artist": "Richard Wright",
			"attack": 4,
			"cardImage": "EX1_045.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Guetteur ancien",
				"text": "Ne peut pas attaquer."
			},
			"health": 5,
			"id": "EX1_045",
			"name": "Ancient Watcher",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Can't attack.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA17_8.png",
			"cost": 0,
			"fr": {
				"name": "Frappe de Nefarian",
				"text": "<b>Pouvoir héroïque</b>\nNefarian fait pleuvoir le feu depuis les cieux !"
			},
			"id": "BRMA17_8",
			"name": "Nefarian Strikes!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nNefarian rains fire from above!",
			"type": "Hero_power"
		},
		{
			"attack": 3,
			"cardImage": "TB_KTRAF_3.png",
			"cost": 4,
			"fr": {
				"name": "Gluth",
				"text": "À la fin de votre tour, invoque un mort-vivant aléatoire."
			},
			"health": 4,
			"id": "TB_KTRAF_3",
			"name": "Gluth",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "At the end of your turn, summon a random Undead.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA13_4.png",
			"cost": 1,
			"fr": {
				"name": "Magie sauvage",
				"text": "<b>Pouvoir héroïque</b>\nPlace un sort aléatoire de la classe de votre adversaire dans votre main."
			},
			"id": "BRMA13_4",
			"name": "Wild Magic",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nPut a random spell from your opponent's class into your hand.",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_CoOpBossSpell_6.png",
			"cost": 0,
			"fr": {
				"name": "Détruire le chroniqueur",
				"text": "Détruit le chroniqueur Cho."
			},
			"id": "TB_CoOpBossSpell_6",
			"name": "Kill the Lorewalker",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Destroy Lorewalker Cho.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "L. Lullabi & N. Thitinunthakorn",
			"attack": 3,
			"cardImage": "KAR_A02_06.png",
			"cost": 4,
			"fr": {
				"name": "Pichet",
				"text": "<b>Cri de guerre_:</b> donne +2/+2 à un serviteur."
			},
			"health": 3,
			"id": "KAR_A02_06",
			"name": "Pitcher",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Give a minion +2/+2.",
			"type": "Minion"
		},
		{
			"artist": "Lucas Graciano",
			"cardImage": "EX1_126.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Trahison",
				"text": "Force un serviteur adverse à infliger ses dégâts aux serviteurs à côté de lui."
			},
			"id": "EX1_126",
			"name": "Betrayal",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Force an enemy minion to deal its damage to the minions next to it.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "LOEA01_11h.png",
			"cost": 0,
			"fr": {
				"name": "Baguette du Soleil",
				"text": "<b>Râle d’agonie :</b> remet cette carte à votre adversaire."
			},
			"health": 5,
			"id": "LOEA01_11h",
			"name": "Rod of the Sun",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Deathrattle:</b> Surrender this to your opponent.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA14_10H_TB.png",
			"cost": 2,
			"fr": {
				"name": "Activation !",
				"text": "<b>Pouvoir héroïque</b>\nActive un Tron aléatoire."
			},
			"id": "BRMA14_10H_TB",
			"name": "Activate!",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nActivate a random Tron.",
			"type": "Hero_power"
		},
		{
			"artist": "Michal Ivan",
			"attack": 7,
			"cardImage": "GVG_112.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Mogor l’ogre",
				"text": "Tous les serviteurs ont 50% de chance d’attaquer le mauvais adversaire."
			},
			"health": 6,
			"id": "GVG_112",
			"name": "Mogor the Ogre",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "All minions have a 50% chance to attack the wrong enemy.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 4,
			"cardImage": "OG_323.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Amasseur vicié",
				"text": "<b>Râle d’agonie :</b> vous piochez une carte."
			},
			"health": 2,
			"id": "OG_323",
			"name": "Polluted Hoarder",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 5,
			"cardImage": "BRM_028.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Empereur Thaurissan",
				"text": "À la fin de votre tour, réduit de (1) |4(cristal,cristaux) le coût des cartes dans votre main."
			},
			"health": 5,
			"id": "BRM_028",
			"name": "Emperor Thaurissan",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "At the end of your turn, reduce the Cost of cards in your hand by (1).",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_123e.png",
			"fr": {
				"name": "Remonté",
				"text": "+2 aux dégâts des sorts."
			},
			"id": "GVG_123e",
			"name": "Overclocked",
			"playerClass": "Mage",
			"set": "Gvg",
			"spellDamage": 2,
			"text": "Spell Damage +2.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"cardImage": "AT_047e.png",
			"fr": {
				"name": "Expérimenté",
				"text": "Caractéristiques augmentées."
			},
			"id": "AT_047e",
			"name": "Experienced",
			"playerClass": "Shaman",
			"set": "Tgt",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_11rand.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : murlocs",
				"text": "Transforme chaque serviteur en jeu en murloc 1/1."
			},
			"id": "TB_PickYourFate_11rand",
			"name": "Dire Fate: Murlocs",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Turn each minion in play into a 1/1 Murloc.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "KAR_005.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Gentille grand-mère",
				"text": "<b>Râle d’agonie_:</b> invoque un\nGrand Méchant Loup_3/2."
			},
			"health": 1,
			"id": "KAR_005",
			"name": "Kindly Grandmother",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Deathrattle:</b> Summon a 3/2 Big Bad Wolf.",
			"type": "Minion"
		},
		{
			"artist": "Chippy",
			"cardImage": "CS2_062.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Flammes infernales",
				"text": "Inflige $3 |4(point,points) de dégâts à TOUS les personnages."
			},
			"id": "CS2_062",
			"name": "Hellfire",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $3 damage to ALL characters.",
			"type": "Spell"
		},
		{
			"artist": "Glenn Rane",
			"attack": 9,
			"cardImage": "EX1_577.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "La Bête",
				"text": "<b>Râle d’agonie :</b> invoque Finkle Einhorn 3/3 pour votre adversaire."
			},
			"health": 7,
			"id": "EX1_577",
			"name": "The Beast",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Deathrattle:</b> Summon a 3/3 Finkle Einhorn for your opponent.",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "CS2_046.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Furie sanguinaire",
				"text": "Confère +3 ATQ à vos serviteurs pendant ce tour."
			},
			"id": "CS2_046",
			"name": "Bloodlust",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Core",
			"text": "Give your minions +3 Attack this turn.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_019.png",
			"cost": 0,
			"fr": {
				"name": "Molasses",
				"text": "You can take as long as you want on your turn."
			},
			"id": "XXX_019",
			"name": "Molasses",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "You can take as long as you want on your turn.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "CRED_11.png",
			"cost": 4,
			"fr": {
				"name": "Jay Baxter",
				"text": "<b>Cri de guerre :</b> invoque CINQ inventions aléatoires."
			},
			"health": 4,
			"id": "CRED_11",
			"name": "Jay Baxter",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Summon FIVE random Inventions.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "KARA_13_22.png",
			"cost": 3,
			"fr": {
				"name": "Mime",
				"text": "<b>Provocation</b>"
			},
			"health": 6,
			"id": "KARA_13_22",
			"name": "Mime",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Graven Tung",
			"cardImage": "EX1_144.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Pas de l’ombre",
				"text": "Renvoie un serviteur allié dans votre main. Il coûte (2) cristaux de moins."
			},
			"id": "EX1_144",
			"name": "Shadowstep",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Return a friendly minion to your hand. It costs (2) less.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA07_28.png",
			"cost": 1,
			"fr": {
				"name": "Réparations",
				"text": "Rend 10 PV."
			},
			"id": "LOEA07_28",
			"name": "Repairs",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Restore 10 Health.",
			"type": "Spell"
		},
		{
			"cardImage": "OG_070e.png",
			"fr": {
				"name": "Lames assoiffées",
				"text": "+1/+1."
			},
			"id": "OG_070e",
			"name": "Thirsty Blades",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Og",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "KAR_a10_Boss2.png",
			"fr": {
				"name": "Roi noir"
			},
			"health": 20,
			"id": "KAR_a10_Boss2",
			"name": "Black King",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Gonzalo Ordonez",
			"attack": 3,
			"cardImage": "EX1_020.png",
			"collectible": true,
			"cost": 3,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Croisée écarlate",
				"text": "<b>Bouclier divin</b>"
			},
			"health": 1,
			"id": "EX1_020",
			"name": "Scarlet Crusader",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_18H.png",
			"cost": 10,
			"fr": {
				"name": "Zinaar",
				"text": "Vous gagnez un Vœu à la fin de votre tour."
			},
			"health": 10,
			"id": "LOEA16_18H",
			"name": "Zinaar",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, gain a wish.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 5,
			"cardImage": "GVG_115.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Toshley",
				"text": "<b>Cri de guerre et Râle d’agonie :</b> ajoute une carte <b>Pièce détachée</b> dans votre main."
			},
			"health": 7,
			"id": "GVG_115",
			"name": "Toshley",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "<b>Battlecry and Deathrattle:</b> Add a <b>Spare Part</b> card to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "OG_138e.png",
			"fr": {
				"name": "Volonté du vizir",
				"text": "Coût réduit."
			},
			"id": "OG_138e",
			"name": "Will of the Vizier",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Reduced Cost.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "LOEA07_11.png",
			"cost": 1,
			"fr": {
				"name": "Débris",
				"text": "<b>Provocation</b>."
			},
			"health": 3,
			"id": "LOEA07_11",
			"name": "Debris",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Taunt.</b>",
			"type": "Minion"
		},
		{
			"artist": "Samwise Didier",
			"attack": 5,
			"cardImage": "PRO_001.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Elite Tauren Chieftain",
				"text": "<b>Cri de guerre :</b> confère aux deux joueurs la puissance du ROCK ! (grâce à une carte au riff dément !)"
			},
			"health": 5,
			"id": "PRO_001",
			"name": "Elite Tauren Chieftain",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Promo",
			"text": "<b>Battlecry:</b> Give both players the power to ROCK! (with a Power Chord card)",
			"type": "Minion"
		},
		{
			"cardImage": "PRO_001b.png",
			"cost": 4,
			"fr": {
				"name": "Les voleurs, ça vous prend...",
				"text": "Inflige $4 |4(point,points) de dégâts. Vous piochez une carte."
			},
			"id": "PRO_001b",
			"name": "Rogues Do It...",
			"playerClass": "Neutral",
			"set": "Promo",
			"text": "Deal $4 damage. Draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_021e.png",
			"fr": {
				"name": "Gangrerage",
				"text": "Caractéristiques augmentées."
			},
			"id": "AT_021e",
			"name": "Felrage",
			"playerClass": "Warlock",
			"set": "Tgt",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_007e.png",
			"fr": {
				"name": "Inversion déviante",
				"text": "L’Attaque et la Vie ont été échangées par Banane déviante."
			},
			"id": "TB_007e",
			"name": "Deviate Switch",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Attack and Health have been swapped by Deviate Banana.",
			"type": "Enchantment"
		},
		{
			"artist": "Skan Srisuwan",
			"cardImage": "OG_195b.png",
			"cost": 0,
			"fr": {
				"name": "Feux follets furieux",
				"text": "Donne +2/+2 à vos serviteurs."
			},
			"id": "OG_195b",
			"name": "Big Wisps",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Og",
			"text": "Give your minions +2/+2.",
			"type": "Spell"
		},
		{
			"artist": "John Dickenson",
			"attack": 2,
			"cardImage": "EX1_162.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Loup alpha redoutable",
				"text": "Les serviteurs adjacents ont +1 ATQ."
			},
			"health": 2,
			"id": "EX1_162",
			"name": "Dire Wolf Alpha",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Adjacent minions have +1 Attack.",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "NAX7_04H.png",
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Lame runique massive",
				"text": "Inflige des dégâts doublés aux héros."
			},
			"id": "NAX7_04H",
			"name": "Massive Runeblade",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Deals double damage to heroes.",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX15_01e.png",
			"fr": {
				"name": "Intrus !"
			},
			"id": "NAX15_01e",
			"name": "Interloper!",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_244e.png",
			"fr": {
				"name": "Puissance totémique",
				"text": "+2 PV."
			},
			"id": "EX1_244e",
			"name": "Totemic Might",
			"playerClass": "Shaman",
			"set": "Core",
			"text": "+2 Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA16_3.png",
			"cost": 4,
			"fr": {
				"name": "Souffle sonique",
				"text": "Inflige $3 |4(point,points) de dégâts à un serviteur. Confère +3 ATQ à votre arme."
			},
			"id": "BRMA16_3",
			"name": "Sonic Breath",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Deal $3 damage to a minion. Give your weapon +3 Attack.",
			"type": "Spell"
		},
		{
			"artist": "Maurico Herrera",
			"cardImage": "OG_206.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Coup de tonnerre",
				"text": "Inflige $4 |4(point,points) de dégâts à un serviteur. <b>Surcharge :</b> (1)"
			},
			"id": "OG_206",
			"name": "Stormcrack",
			"overload": 1,
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Og",
			"text": "Deal $4 damage to a minion. <b>Overload:</b> (1)",
			"type": "Spell"
		},
		{
			"artist": "Skan Srisuwan",
			"cardImage": "AT_062.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Boule d’araignées",
				"text": "Invoque trois\ntisseuses 1/1."
			},
			"id": "AT_062",
			"name": "Ball of Spiders",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "Summon three 1/1 Webspinners.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "TB_SPT_BossWeapon.png",
			"cost": 1,
			"durability": 1,
			"fr": {
				"name": "Armurerie",
				"text": "L’Attaque augmente sur la durée."
			},
			"id": "TB_SPT_BossWeapon",
			"name": "Armory",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Attack increases over time.",
			"type": "Weapon"
		},
		{
			"cardImage": "LOEA15_1H.png",
			"fr": {
				"name": "Rafaam"
			},
			"health": 30,
			"id": "LOEA15_1H",
			"name": "Rafaam",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA05_01.png",
			"fr": {
				"name": "Chef Scarvash"
			},
			"health": 30,
			"id": "LOEA05_01",
			"name": "Chieftain Scarvash",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Arthur Gimaldinov",
			"attack": 2,
			"cardImage": "OG_085.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mande-givre dément",
				"text": "Après que vous avez lancé un sort, <b>gèle</b> un adversaire aléatoire."
			},
			"health": 4,
			"id": "OG_085",
			"name": "Demented Frostcaller",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Og",
			"text": "After you cast a spell, <b>Freeze</b> a random enemy.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_9_Ench.png",
			"fr": {
				"name": "Fate 9 Ench. Deathrattle bonus"
			},
			"id": "TB_PickYourFate_9_Ench",
			"name": "Fate 9 Ench. Deathrattle bonus",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Doug Alexander",
			"attack": 2,
			"cardImage": "EX1_362.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Protecteur d’Argent",
				"text": "<b>Cri de guerre :</b> confère <b>Bouclier divin</b> à un serviteur allié."
			},
			"health": 2,
			"id": "EX1_362",
			"name": "Argent Protector",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give a friendly minion <b>Divine Shield</b>.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_27.png",
			"cost": 3,
			"fr": {
				"name": "Henry Ho",
				"text": "<b>Cri de guerre :</b> regarde la main de votre adversaire."
			},
			"health": 4,
			"id": "CRED_27",
			"name": "Henry Ho",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Spectate your opponent's hand.",
			"type": "Minion"
		},
		{
			"artist": "Tyson Murphy",
			"attack": 1,
			"cardImage": "AT_084.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Porte-lance",
				"text": "<b>Cri de guerre :</b> donne\n+2 ATQ à un serviteur allié."
			},
			"health": 2,
			"id": "AT_084",
			"name": "Lance Carrier",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Give a friendly minion +2 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Dan Brereton",
			"attack": 2,
			"cardImage": "CS2_146.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Matelot des mers du Sud",
				"text": "A <b>Charge</b> tant que vous êtes équipé d’une arme."
			},
			"health": 1,
			"id": "CS2_146",
			"name": "Southsea Deckhand",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Has <b>Charge</b> while you have a weapon equipped.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "CS2_087.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Bénédiction de puissance",
				"text": "Confère +3 ATQ à un serviteur."
			},
			"id": "CS2_087",
			"name": "Blessing of Might",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"text": "Give a minion +3 Attack.",
			"type": "Spell"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 4,
			"cardImage": "AT_063t.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Écaille-d’effroi",
				"text": "Inflige 1 point de dégâts à tous les autres serviteurs à la fin de votre tour."
			},
			"health": 2,
			"id": "AT_063t",
			"name": "Dreadscale",
			"playerClass": "Hunter",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "At the end of your turn, deal 1 damage to all other minions.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_045e.png",
			"fr": {
				"name": "Arme croque-roc",
				"text": "Ce personnage a +3 ATQ pendant ce tour."
			},
			"id": "CS2_045e",
			"name": "Rockbiter Weapon",
			"playerClass": "Shaman",
			"set": "Core",
			"text": "This character has +3 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"attack": 7,
			"cardImage": "CRED_01.png",
			"cost": 6,
			"fr": {
				"name": "Jason Chayes",
				"text": "<b>Accès de rage :</b> non, on blague ! Il ne s’énerve jamais."
			},
			"health": 6,
			"id": "CRED_01",
			"name": "Jason Chayes",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Enrage:</b> Just kidding! He never Enrages.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_057o.png",
			"fr": {
				"name": "Étrillé",
				"text": "<b>Insensible</b> pendant ce tour"
			},
			"id": "AT_057o",
			"name": "Groomed",
			"playerClass": "Hunter",
			"set": "Tgt",
			"text": "<b>Immune</b> this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Jim Nelson",
			"attack": 5,
			"cardImage": "AT_113.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Recruteur",
				"text": "<b>Exaltation :</b> ajoute un écuyer 2/2 dans votre main."
			},
			"health": 4,
			"id": "AT_113",
			"name": "Recruiter",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Add a 2/2 Squire to your hand.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "HRW02_1.png",
			"cost": 10,
			"fr": {
				"name": "Maître des rouages Mécazod",
				"text": "<b>Boss</b>\nAu début de chaque tour, Mécazod frappe !"
			},
			"health": 80,
			"id": "HRW02_1",
			"name": "Gearmaster Mechazod",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "<b>Boss</b>\nAt the beginning of each turn, Mechazod strikes!",
			"type": "Minion"
		},
		{
			"artist": "Sedhayu Ardian",
			"attack": 4,
			"cardImage": "EX1_089.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Golem arcanique",
				"text": "<b>Cri de guerre :</b> donne à votre adversaire un cristal de mana."
			},
			"health": 4,
			"id": "EX1_089",
			"name": "Arcane Golem",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give your opponent a Mana Crystal.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "NAX10_02H.png",
			"cost": 3,
			"durability": 8,
			"fr": {
				"name": "Crochet",
				"text": "<b>Furie des vents</b>\n<b>Râle d’agonie :</b> place cette arme dans votre main."
			},
			"id": "NAX10_02H",
			"name": "Hook",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Windfury</b>\n<b>Deathrattle:</b> Put this weapon into your hand.",
			"type": "Weapon"
		},
		{
			"artist": "Alex Alexandrov",
			"cardImage": "OG_047.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Rage farouche",
				"text": "<b>Choix des armes :</b> donne +4 ATQ à votre héros pendant ce tour ou lui confère 8 points d’armure."
			},
			"id": "OG_047",
			"name": "Feral Rage",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Choose One</b> - Give your hero +4 Attack this turn; or Gain 8 Armor.",
			"type": "Spell"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 4,
			"cardImage": "GVG_101.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Purificateur écarlate",
				"text": "<b>Cri de guerre_:</b> inflige 2_points de dégâts à tous les serviteurs avec <b>Râle d’agonie</b>."
			},
			"health": 3,
			"id": "GVG_101",
			"name": "Scarlet Purifier",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Deal 2 damage to all minions with <b>Deathrattle</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_3H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : rouge",
				"text": "Vous subissez 3 points de dégâts au début de votre tour tant que vous avez cette carte dans votre main."
			},
			"id": "BRMA12_3H",
			"name": "Brood Affliction: Red",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "While this is in your hand, take 3 damage at the start of your turn.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_020.png",
			"cost": 0,
			"fr": {
				"name": "Damage all but 1",
				"text": "Set the Health of a character to 1."
			},
			"id": "XXX_020",
			"name": "Damage all but 1",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Set the Health of a character to 1.",
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
			"cardImage": "TB_CoOpv3_013.png",
			"cost": 0,
			"fr": {
				"name": "Immolation",
				"text": "Inflige 7 points de dégâts à chaque héros."
			},
			"id": "TB_CoOpv3_013",
			"name": "Immolate",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Deal 7 damage to each hero.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_9.png",
			"cost": 0,
			"fr": {
				"name": "Grèves abandonnées de Lothar",
				"text": "Inflige 3 points de dégâts à tous les adversaires."
			},
			"id": "LOEA16_9",
			"name": "Lothar's Left Greave",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Deal 3 damage to all enemies.",
			"type": "Spell"
		},
		{
			"cardImage": "KARA_08_08e2.png",
			"fr": {
				"name": "Rayon rouge",
				"text": "A <b>Furie des vents</b>."
			},
			"id": "KARA_08_08e2",
			"name": "Red Beam",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Has <b>Windfury</b>.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
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
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "LOEA15_3H.png",
			"cost": 3,
			"fr": {
				"name": "Raptor d’os",
				"text": "<b>Cri de guerre :</b> prend le contrôle de l’arme de votre adversaire."
			},
			"health": 2,
			"id": "LOEA15_3H",
			"name": "Boneraptor",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Battlecry:</b>Take control of your opponent's weapon.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KTRAF_HP_KT_3.png",
			"cost": 2,
			"fr": {
				"name": "Nécromancie",
				"text": "Ressuscite un serviteur allié aléatoire mort pendant cette partie."
			},
			"id": "TB_KTRAF_HP_KT_3",
			"name": "Necromancy",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Resurrect a random friendly minion that died this game.",
			"type": "Hero_power"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 4,
			"cardImage": "EX1_595.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Maître de culte",
				"text": "Vous piochez une carte quand un de vos autres serviteurs meurt."
			},
			"health": 2,
			"id": "EX1_595",
			"name": "Cult Master",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Whenever one of your other minions dies, draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 6,
			"cardImage": "BRM_024.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Écraseur drakônide",
				"text": "<b>Cri de guerre :</b> gagne +3/+3 si votre adversaire a 15 PV ou moins."
			},
			"health": 6,
			"id": "BRM_024",
			"name": "Drakonid Crusher",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Brm",
			"text": "<b>Battlecry:</b> If your opponent has 15 or less Health, gain +3/+3.",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "CS1_112.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Nova sacrée",
				"text": "Inflige $2 |4(point,points) de dégâts à tous les adversaires. Rend #2 |4(point,points) de vie à tous les personnages alliés."
			},
			"id": "CS1_112",
			"name": "Holy Nova",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $2 damage to all enemies. Restore #2 Health to all friendly characters.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_155b.png",
			"cost": 0,
			"fr": {
				"name": "Marque de la nature",
				"text": "+4 PV et <b>Provocation</b>."
			},
			"id": "EX1_155b",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "+4 Health and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 8,
			"cardImage": "EX1_561.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Alexstrasza",
				"text": "<b>Cri de guerre :</b> fixe les points de vie restants d’un héros à 15."
			},
			"health": 8,
			"id": "EX1_561",
			"name": "Alexstrasza",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Set a hero's remaining Health to 15.",
			"type": "Minion"
		},
		{
			"cardImage": "OG_290e.png",
			"fr": {
				"name": "Dévotion de l’implorateur",
				"text": "+1/+1."
			},
			"id": "OG_290e",
			"name": "Caller Devotion",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "KARA_07_06.png",
			"cost": 4,
			"fr": {
				"name": "Démon en liberté !",
				"text": "Invoque un Démon aléatoire."
			},
			"id": "KARA_07_06",
			"name": "Demons Loose!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon a random Demon.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_009e.png",
			"fr": {
				"name": "Marque du fauve",
				"text": "Ce serviteur a +2/+2 et <b>Provocation</b>."
			},
			"id": "CS2_009e",
			"name": "Mark of the Wild",
			"playerClass": "Druid",
			"set": "Core",
			"text": "This minion has +2/+2 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Alexandrov",
			"attack": 1,
			"cardImage": "OG_174.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Traînard sans-visage",
				"text": "<b>Provocation</b>\n<b>Cri de guerre :</b> copie l’Attaque et la Vie d’un serviteur allié."
			},
			"health": 1,
			"id": "OG_174",
			"name": "Faceless Shambler",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Taunt</b>\n<b>Battlecry:</b> Copy a friendly minion's Attack and Health.",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 1,
			"cardImage": "EX1_029.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Gnome lépreux",
				"text": "<b>Râle d’agonie :</b> inflige 2 points de dégâts au héros adverse."
			},
			"health": 1,
			"id": "EX1_029",
			"name": "Leper Gnome",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Deathrattle:</b> Deal 2 damage to the enemy hero.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_00_01.png",
			"fr": {
				"name": "Prince Malchezaar"
			},
			"health": 30,
			"id": "KARA_00_01",
			"name": "Prince Malchezaar",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_371.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Main de protection",
				"text": "Confère <b>Bouclier divin</b> à un serviteur."
			},
			"id": "EX1_371",
			"name": "Hand of Protection",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"text": "Give a minion <b>Divine Shield</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_025.png",
			"cost": 0,
			"fr": {
				"name": "Do Nothing",
				"text": "This does nothing."
			},
			"id": "XXX_025",
			"name": "Do Nothing",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "This does nothing.",
			"type": "Spell"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 2,
			"cardImage": "EX1_603.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Sous-chef cruel",
				"text": "<b>Cri de guerre :</b> inflige\n1 point de dégâts à\nun serviteur et lui\ndonne +2 ATQ."
			},
			"health": 2,
			"id": "EX1_603",
			"name": "Cruel Taskmaster",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Deal 1 damage to a minion and give it +2 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "GVG_008.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Bombe de lumière",
				"text": "Inflige à chaque serviteur des dégâts équivalents à leur ATQ."
			},
			"id": "GVG_008",
			"name": "Lightbomb",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Deal damage to each minion equal to its Attack.",
			"type": "Spell"
		},
		{
			"artist": "Michal Ivan",
			"cardImage": "EX1_619.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Égalité",
				"text": "Les points de vie de TOUS les serviteurs passent à 1."
			},
			"id": "EX1_619",
			"name": "Equality",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Change the Health of ALL minions to 1.",
			"type": "Spell"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 1,
			"cardImage": "LOE_009t.png",
			"cost": 1,
			"fr": {
				"name": "Scarabée",
				"text": "<b>Provocation</b>"
			},
			"health": 1,
			"id": "LOE_009t",
			"name": "Scarab",
			"playerClass": "Warrior",
			"set": "Loe",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "EX1_399.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Berserker gurubashi",
				"text": "Chaque fois que ce serviteur subit des dégâts, il gagne +3 ATQ."
			},
			"health": 7,
			"id": "EX1_399",
			"name": "Gurubashi Berserker",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "Whenever this minion takes damage, gain +3 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX12_02e.png",
			"fr": {
				"name": "Décimer",
				"text": "Les points de vie sont passés à 1."
			},
			"id": "NAX12_02e",
			"name": "Decimate",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Health changed to 1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA02_1.png",
			"fr": {
				"name": "Juge Supérieur Mornepierre"
			},
			"health": 30,
			"id": "BRMA02_1",
			"name": "High Justice Grimstone",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "NAX2_03.png",
			"cost": 2,
			"fr": {
				"name": "Pluie de feu",
				"text": "<b>Pouvoir héroïque</b>\nTire un missile pour chaque\n carte dans la main de votre adversaire."
			},
			"id": "NAX2_03",
			"name": "Rain of Fire",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nFire a missile for each card in your opponent's hand.",
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Froilan Gardner",
			"attack": 2,
			"cardImage": "AT_085.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Damoiselle du Lac",
				"text": "Votre pouvoir héroïque coûte (1) |4(cristal,cristaux)."
			},
			"health": 6,
			"id": "AT_085",
			"name": "Maiden of the Lake",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Your Hero Power costs (1).",
			"type": "Minion"
		},
		{
			"cardImage": "AT_132_WARRIOR.png",
			"cost": 2,
			"fr": {
				"name": "Défense stoïque",
				"text": "<b>Pouvoir héroïque</b>\nGagne 4 points d’armure."
			},
			"id": "AT_132_WARRIOR",
			"name": "Tank Up!",
			"playerClass": "Warrior",
			"set": "Tgt",
			"text": "<b>Hero Power</b>\nGain 4 Armor.",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 6,
			"cardImage": "OG_300.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "L’Épouvantueur",
				"text": "Quand il attaque un serviteur et le tue,\ngagne +2/+2."
			},
			"health": 7,
			"id": "OG_300",
			"name": "The Boogeymonster",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "Whenever this attacks and kills a minion, gain +2/+2.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_07_06heroic.png",
			"cost": 3,
			"fr": {
				"name": "Démon en liberté !",
				"text": "Invoque un Démon aléatoire."
			},
			"id": "KARA_07_06heroic",
			"name": "Demons Loose!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon a random Demon.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA07_20.png",
			"cost": 1,
			"fr": {
				"name": "Boum !",
				"text": "Inflige 3 points de dégâts à tous les serviteurs adverses."
			},
			"id": "LOEA07_20",
			"name": "Boom!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Deal 3 damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA05_02h.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester serviteurs !",
				"text": "<b>Pouvoir héroïque passif</b> Les serviteurs adverses coûtent (11) |4(cristal,cristaux) de mana. Le pouvoir change au début de votre tour."
			},
			"id": "LOEA05_02h",
			"name": "Trogg Hate Minions!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\n Enemy minions cost (11). Swap at the start of your turn.",
			"type": "Hero_power"
		},
		{
			"artist": "James Ryman",
			"attack": 6,
			"cardImage": "OG_280.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "C’Thun",
				"text": "<b>Cri de guerre :</b> inflige des dégâts égaux à l’Attaque de ce serviteur répartis aléatoirement entre tous les adversaires."
			},
			"health": 6,
			"id": "OG_280",
			"name": "C'Thun",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Battlecry:</b> Deal damage equal to this minion's Attack randomly split among all enemies.",
			"type": "Minion"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 2,
			"cardImage": "GVG_002.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Souffle-neige",
				"text": "<b>Gèle</b> tout personnage blessé par ce serviteur."
			},
			"health": 3,
			"id": "GVG_002",
			"name": "Snowchugger",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Freeze</b> any character damaged by this minion.",
			"type": "Minion"
		},
		{
			"artist": "Samwise",
			"attack": 8,
			"cardImage": "EX1_105.png",
			"collectible": true,
			"cost": 12,
			"fr": {
				"name": "Géant des montagnes",
				"text": "Coûte (1) cristal de moins pour chaque autre carte dans votre main."
			},
			"health": 8,
			"id": "EX1_105",
			"name": "Mountain Giant",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Costs (1) less for each other card in your hand.",
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
				"name": "Chevaucheur de loup",
				"text": "<b>Charge</b>"
			},
			"health": 1,
			"id": "CS2_124",
			"name": "Wolfrider",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 2,
			"cardImage": "OG_218.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Brave Sabot-de-Sang",
				"text": "<b>Provocation</b>\n<b>Accès de rage :</b> +3 ATQ."
			},
			"health": 6,
			"id": "OG_218",
			"name": "Bloodhoof Brave",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Taunt</b>\n<b>Enrage:</b> +3 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA05_3e.png",
			"fr": {
				"name": "Bombe vivante",
				"text": "Pendant le tour de Geddon, inflige 5 points de dégâts à votre héros et vos serviteurs."
			},
			"id": "BRMA05_3e",
			"name": "Living Bomb",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "On Geddon's turn, deal 5 damage to all of your stuff.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_392.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Rage du combat",
				"text": "Vous piochez une carte pour chaque personnage allié blessé."
			},
			"id": "EX1_392",
			"name": "Battle Rage",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Draw a card for each damaged friendly character.",
			"type": "Spell"
		},
		{
			"artist": "Jason Chan",
			"cardImage": "GVG_057.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Sceau de Lumière",
				"text": "Rend #4 |4(point,points) de vie à votre héros et lui confère +2 ATQ pendant ce tour."
			},
			"id": "GVG_057",
			"name": "Seal of Light",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Restore #4 Health to your hero and gain +2 Attack this turn.",
			"type": "Spell"
		},
		{
			"artist": "Mike Sass",
			"cardImage": "AT_013.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Mot de pouvoir : Gloire",
				"text": "Choisissez un serviteur. Chaque fois qu’il attaque, rend 4 PV à votre héros."
			},
			"id": "AT_013",
			"name": "Power Word: Glory",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Choose a minion. Whenever it attacks, restore 4 Health to\nyour hero.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA06_03eh.png",
			"fr": {
				"name": "Animé",
				"text": "+3/+3 et <b>Provocation</b>."
			},
			"id": "LOEA06_03eh",
			"name": "Animated",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "+3/+3 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX8_02.png",
			"cost": 2,
			"fr": {
				"name": "Moisson",
				"text": "<b>Pouvoir héroïque</b>\nPioche une carte."
			},
			"id": "NAX8_02",
			"name": "Harvest",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDraw a card.",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX14_01H.png",
			"fr": {
				"name": "Saphiron"
			},
			"health": 45,
			"id": "NAX14_01H",
			"name": "Sapphiron",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"attack": 0,
			"cardImage": "TB_KTRAF_4m.png",
			"cost": 3,
			"fr": {
				"name": "Gothik spectral",
				"text": "Au début de votre tour, inflige 4 points de dégâts à votre héros."
			},
			"health": 3,
			"id": "TB_KTRAF_4m",
			"name": "Spectral Gothik",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "At the start of your turn, deal 4 damage to your hero.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CRED_15.png",
			"cost": 1,
			"fr": {
				"name": "Andy Brock",
				"text": "Ne peut être <b>réduit au silence. Bouclier divin. Camouflage.</b>"
			},
			"health": 3,
			"id": "CRED_15",
			"name": "Andy Brock",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Can't be <b>Silenced. Divine Shield, Stealth.</b>",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_065.png",
			"cost": 0,
			"fr": {
				"name": "Remove All Immune",
				"text": "Remove <b>Immune</b> from ALL characters."
			},
			"id": "XXX_065",
			"name": "Remove All Immune",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Remove <b>Immune</b> from ALL characters.",
			"type": "Spell"
		},
		{
			"artist": "Jun Kang",
			"attack": 2,
			"cardImage": "GVG_087.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Sniper de Gentepression",
				"text": "Votre pouvoir héroïque peut viser les serviteurs."
			},
			"health": 3,
			"id": "GVG_087",
			"name": "Steamwheedle Sniper",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Your Hero Power can target minions.",
			"type": "Minion"
		},
		{
			"artist": "Penny Arcade",
			"attack": 5,
			"cardImage": "AT_112.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Maître jouteur",
				"text": "<b>Cri de guerre :</b> révèle un serviteur de chaque deck. Si le vôtre coûte plus, gagne <b>Provocation</b> et <b>Bouclier divin</b>."
			},
			"health": 6,
			"id": "AT_112",
			"name": "Master Jouster",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, gain <b>Taunt</b> and <b>Divine Shield</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA01_1H.png",
			"fr": {
				"name": "Coren Navrebière"
			},
			"health": 30,
			"id": "BRMA01_1H",
			"name": "Coren Direbrew",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA07_02.png",
			"fr": {
				"name": "Puits de mine"
			},
			"health": 80,
			"id": "LOEA07_02",
			"name": "Mine Shaft",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA09_5.png",
			"cost": 4,
			"fr": {
				"name": "Pied à terre",
				"text": "<b>Pouvoir héroïque</b>\nInvoque Gyth. Change de pouvoir héroïque."
			},
			"id": "BRMA09_5",
			"name": "Dismount",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon Gyth. Get a new Hero Power.",
			"type": "Hero_power"
		},
		{
			"artist": "Luke Mancini",
			"attack": 2,
			"cardImage": "KAR_010.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Templier Plaie-de-nuit",
				"text": "<b>Cri de guerre_:</b> si vous avez un Dragon en main,\ninvoque deux dragonnets 1/1."
			},
			"health": 3,
			"id": "KAR_010",
			"name": "Nightbane Templar",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, summon two 1/1 Whelps.",
			"type": "Minion"
		},
		{
			"cardImage": "HERO_02a.png",
			"collectible": true,
			"fr": {
				"name": "Morgl l’Oracle"
			},
			"health": 30,
			"id": "HERO_02a",
			"name": "Morgl the Oracle",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Hero_skins",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA12_4.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : vert",
				"text": "Rend 2 PV à votre adversaire au début de votre tour tant que vous avez cette carte dans votre main."
			},
			"id": "BRMA12_4",
			"name": "Brood Affliction: Green",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "While this is in your hand, restore 2 health to your opponent at the start of your turn.",
			"type": "Spell"
		},
		{
			"artist": "Karl Richardson",
			"attack": 1,
			"cardImage": "EX1_015.png",
			"collectible": true,
			"cost": 2,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Ingénieur novice",
				"text": "<b>Cri de guerre :</b> vous piochez une carte."
			},
			"health": 1,
			"id": "EX1_015",
			"name": "Novice Engineer",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Battlecry:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "CRED_31.png",
			"cost": 4,
			"fr": {
				"name": "Jeremy Cranford",
				"text": "Quand la partie commence, cette carte se place en début de deck."
			},
			"health": 4,
			"id": "CRED_31",
			"name": "Jeremy Cranford",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "When the game starts, this card climbs to the top of the deck.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_004.png",
			"cost": 0,
			"fr": {
				"name": "Restore 5",
				"text": "Restore 5 Health to a character."
			},
			"id": "XXX_004",
			"name": "Restore 5",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Restore 5 Health to a character.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX1_01.png",
			"fr": {
				"name": "Anub’Rekhan"
			},
			"health": 30,
			"id": "NAX1_01",
			"name": "Anub'Rekhan",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "OG_314.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Du sang à l’ichor",
				"text": "Inflige $1 |4(point,points) de dégâts à un serviteur.\nS’il survit, invoque une gelée 2/2."
			},
			"id": "OG_314",
			"name": "Blood To Ichor",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Og",
			"text": "Deal $1 damage to a minion. If it survives, summon a 2/2 Slime.",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "DREAM_01.png",
			"cost": 3,
			"fr": {
				"name": "Sœur rieuse",
				"text": "Ne peut pas être la cible de sorts ou de pouvoirs héroïques."
			},
			"health": 5,
			"id": "DREAM_01",
			"name": "Laughing Sister",
			"playerClass": "Dream",
			"set": "Expert1",
			"text": "Can't be targeted by spells or Hero Powers.",
			"type": "Minion"
		},
		{
			"artist": "Erik Ko",
			"attack": 1,
			"cardImage": "EX1_001.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Gardelumière",
				"text": "Chaque fois qu’un personnage est soigné, gagne +2 ATQ."
			},
			"health": 2,
			"id": "EX1_001",
			"name": "Lightwarden",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Whenever a character is healed, gain +2 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_CoOpv3_001.png",
			"cost": 0,
			"fr": {
				"name": "Glorieuse finale",
				"text": "Le véritable combat commence…"
			},
			"id": "TB_CoOpv3_001",
			"name": "Glorious Finale",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "The true battle begins....",
			"type": "Spell"
		},
		{
			"artist": "Andrew Hou",
			"attack": 3,
			"cardImage": "AT_007.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Jette-sorts",
				"text": "<b>Cri de guerre :</b> ajoute un sort aléatoire dans la main de chaque joueur."
			},
			"health": 4,
			"id": "AT_007",
			"name": "Spellslinger",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Add a random spell to each player's hand.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"type": "Minion"
		},
		{
			"artist": "John Polidora",
			"attack": 7,
			"cardImage": "CS2_227.png",
			"collectible": true,
			"cost": 5,
			"faction": "HORDE",
			"fr": {
				"name": "Nervi de la KapitalRisk",
				"text": "Vos serviteurs coûtent (3) cristaux de plus."
			},
			"health": 6,
			"id": "CS2_227",
			"name": "Venture Co. Mercenary",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Your minions cost (3) more.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_011.png",
			"cost": 0,
			"fr": {
				"name": "Pièce ternie",
				"text": "Confère 1 cristal de mana pendant ce tour uniquement."
			},
			"id": "TB_011",
			"name": "Tarnished Coin",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Gain 1 Mana Crystal this turn only.",
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
				"name": "Aventurier en pleine quête",
				"text": "Chaque fois que vous jouez une carte,\ngagne +1/+1."
			},
			"health": 2,
			"id": "EX1_044",
			"name": "Questing Adventurer",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Whenever you play a card, gain +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Vance Kovacs",
			"cardImage": "CS2_022.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Métamorphose",
				"text": "Transforme un serviteur en mouton 1/1."
			},
			"id": "CS2_022",
			"name": "Polymorph",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"text": "Transform a minion into a 1/1 Sheep.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_018.png",
			"cost": 0,
			"fr": {
				"name": "Destroy All Minions",
				"text": "Destroy all minions."
			},
			"id": "XXX_018",
			"name": "Destroy All Minions",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Destroy all minions.",
			"type": "Spell"
		},
		{
			"artist": "Wei Wang",
			"attack": 7,
			"cardImage": "AT_072.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Varian Wrynn",
				"text": "<b>Cri de guerre :</b> vous piochez\n3 cartes. Place tout serviteur pioché directement sur le champ de bataille."
			},
			"health": 7,
			"id": "AT_072",
			"name": "Varian Wrynn",
			"playerClass": "Warrior",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Draw 3 cards.\nPut any minions you drew directly into the battlefield.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_011e.png",
			"fr": {
				"name": "Bénédiction par la Lumière",
				"text": "Attaque augmentée."
			},
			"id": "AT_011e",
			"name": "Light's Blessing",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_014.png",
			"cost": 0,
			"fr": {
				"name": "Choisir une nouvelle carte !",
				"text": "Affiche 3 cartes aléatoires. Choisissez-en une à placer dans votre main."
			},
			"id": "TB_014",
			"name": "Choose a New Card!",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Look at 3 random cards. Choose one and put it into your hand.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_7_2nd.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : explosion de mana",
				"text": "Les serviteurs obtiennent «_<b>Râle d’agonie_:</b> une carte aléatoire de votre main coûte (0)_|4(cristal,cristaux) de mana._»."
			},
			"id": "TB_PickYourFate_7_2nd",
			"name": "Dire Fate: Manaburst",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Minions gain <b>Deathrattle:</b> Random card in owner's hand costs (0).",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_069a.png",
			"fr": {
				"name": "Réparations !",
				"text": "+4 PV."
			},
			"id": "GVG_069a",
			"name": "Repairs!",
			"playerClass": "Priest",
			"set": "Gvg",
			"text": "+4 Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Samwise",
			"attack": 4,
			"cardImage": "CS2_181.png",
			"collectible": true,
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Maître-lame blessé",
				"text": "<b>Cri de guerre :</b> s’inflige 4 points de dégâts."
			},
			"health": 7,
			"id": "CS2_181",
			"name": "Injured Blademaster",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Deal 4 damage to HIMSELF.",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 8,
			"cardImage": "EX1_620.png",
			"collectible": true,
			"cost": 25,
			"fr": {
				"name": "Géant de lave",
				"text": "Coûte (1) cristal de moins pour chaque point de dégâts subi par votre héros."
			},
			"health": 8,
			"id": "EX1_620",
			"name": "Molten Giant",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Costs (1) less for each damage your hero has taken.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA16_3e.png",
			"fr": {
				"name": "Souffle sonique",
				"text": "+3 ATQ."
			},
			"id": "BRMA16_3e",
			"name": "Sonic Breath",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 7,
			"cardImage": "CS2_161.png",
			"collectible": true,
			"cost": 7,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Assassin de Ravenholdt",
				"text": "<b>Camouflage</b>"
			},
			"health": 5,
			"id": "CS2_161",
			"name": "Ravenholdt Assassin",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"artist": "Alex Garner",
			"attack": 3,
			"cardImage": "AT_011.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Championne sacrée",
				"text": "Chaque fois qu’un personnage est soigné, gagne +2 ATQ."
			},
			"health": 5,
			"id": "AT_011",
			"name": "Holy Champion",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Whenever a character is healed, gain +2 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_10_Ench.png",
			"fr": {
				"name": "Destin"
			},
			"id": "TB_PickYourFate_10_Ench",
			"name": "Fate",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Anton Magdalin",
			"attack": 1,
			"cardImage": "OG_156a.png",
			"cost": 1,
			"fr": {
				"name": "Limon",
				"text": "<b>Provocation</b>"
			},
			"health": 1,
			"id": "OG_156a",
			"name": "Ooze",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 6,
			"cardImage": "CS2_064.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Infernal de l’effroi",
				"text": "<b>Cri de guerre :</b> inflige 1 point de dégâts à TOUS les autres personnages."
			},
			"health": 6,
			"id": "CS2_064",
			"name": "Dread Infernal",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Deal 1 damage to ALL other characters.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_13.png",
			"cost": 0,
			"fr": {
				"name": "Œil d’Orsis",
				"text": "<b>Découvre</b> un serviteur. Vous en gagnez 3 copies."
			},
			"id": "LOEA16_13",
			"name": "Eye of Orsis",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Discover</b> a minion and gain 3 copies of it.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_128e.png",
			"fr": {
				"name": "Dissimulé",
				"text": "Camouflé jusqu’à votre prochain tour."
			},
			"id": "EX1_128e",
			"name": "Concealed",
			"playerClass": "Rogue",
			"set": "Expert1",
			"text": "Stealthed until your next turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley",
			"attack": 8,
			"cardImage": "BRM_029.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Rend Main-Noire",
				"text": "<b>Cri de guerre :</b> détruit un serviteur <b>légendaire</b> si vous avez un Dragon en main."
			},
			"health": 4,
			"id": "BRM_029",
			"name": "Rend Blackhand",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, destroy a <b>Legendary</b> minion.",
			"type": "Minion"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "BRM_003.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Souffle du dragon",
				"text": "Inflige $4 points de dégâts. Coûte (1) |4(cristal,cristaux) de mana de moins pour chaque serviteur mort pendant ce tour."
			},
			"id": "BRM_003",
			"name": "Dragon's Breath",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Brm",
			"text": "Deal $4 damage. Costs (1) less for each minion that died this turn.",
			"type": "Spell"
		},
		{
			"artist": "Malcolm Davis",
			"attack": 1,
			"cardImage": "DS1_175.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Loup des bois",
				"text": "Vos autres Bêtes ont\n+1 ATQ."
			},
			"health": 1,
			"id": "DS1_175",
			"name": "Timber Wolf",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"text": "Your other Beasts have +1 Attack.",
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Loe",
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA11_1H.png",
			"fr": {
				"name": "Vaelastrasz le Corrompu"
			},
			"health": 30,
			"id": "BRMA11_1H",
			"name": "Vaelastrasz the Corrupt",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "GVG_089.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Illuminatrice",
				"text": "Si vous contrôlez un <b>Secret</b> à la fin de votre tour, rend 4 PV à votre héros."
			},
			"health": 4,
			"id": "GVG_089",
			"name": "Illuminator",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "If you control a <b>Secret</b> at the end of your turn, restore 4 Health to your hero.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_102_H1.png",
			"cost": 2,
			"fr": {
				"name": "Gain d’armure !",
				"text": "<b>Pouvoir héroïque</b>\nConfère 2 points d’armure."
			},
			"id": "CS2_102_H1",
			"name": "Armor Up!",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nGain 2 Armor.",
			"type": "Hero_power"
		},
		{
			"artist": "James Ryman",
			"cardImage": "KARA_00_03.png",
			"fr": {
				"name": "Medivh"
			},
			"health": 30,
			"id": "KARA_00_03",
			"name": "Medivh",
			"playerClass": "Mage",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Cyril Van Der Haegen",
			"cardImage": "CS2_007.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Toucher guérisseur",
				"text": "Rend #8 |4(point,points) de vie."
			},
			"id": "CS2_007",
			"name": "Healing Touch",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"text": "Restore #8 Health.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_399e.png",
			"fr": {
				"name": "Berserker",
				"text": "L’Attaque de ce serviteur est augmentée."
			},
			"id": "EX1_399e",
			"name": "Berserking",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "This minion has increased Attack.",
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
				"name": "Chevalier de Hurlevent",
				"text": "<b>Charge</b>"
			},
			"health": 5,
			"id": "CS2_131",
			"name": "Stormwind Knight",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"cardImage": "GAME_004.png",
			"fr": {
				"name": "ABS",
				"text": "Vos tours sont plus courts."
			},
			"id": "GAME_004",
			"name": "AFK",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "Your turns are shorter.",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_030b.png",
			"cost": 0,
			"fr": {
				"name": "Mode Char",
				"text": "+1 PV."
			},
			"id": "GVG_030b",
			"name": "Tank Mode",
			"playerClass": "Druid",
			"set": "Gvg",
			"text": "+1 Health.",
			"type": "Spell"
		},
		{
			"artist": "Efrem Palacios",
			"attack": 1,
			"cardImage": "EX1_366.png",
			"collectible": true,
			"cost": 3,
			"durability": 5,
			"fr": {
				"name": "Épée de justice",
				"text": "Après avoir invoqué un serviteur, lui donne +1/+1 et perd 1 Durabilité."
			},
			"id": "EX1_366",
			"name": "Sword of Justice",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "After you summon a minion, give it +1/+1 and this loses 1 Durability.",
			"type": "Weapon"
		},
		{
			"cardImage": "EX1_411e2.png",
			"fr": {
				"name": "Affûtage nécessaire",
				"text": "ATQ réduite."
			},
			"id": "EX1_411e2",
			"name": "Needs Sharpening",
			"playerClass": "Warrior",
			"set": "Expert1",
			"text": "Decreased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Eric Braddock",
			"attack": 4,
			"cardImage": "KAR_712.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Illusioniste pourpre",
				"text": "Pendant votre tour, votre héros est <b>Insensible</b>."
			},
			"health": 3,
			"id": "KAR_712",
			"name": "Violet Illusionist",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "During your turn, your hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_053.png",
			"cost": 0,
			"fr": {
				"name": "Armor 100",
				"text": "Give target Hero +100 Armor"
			},
			"id": "XXX_053",
			"name": "Armor 100",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Give target Hero +100 Armor",
			"type": "Spell"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "KARA_13_12.png",
			"cost": 3,
			"fr": {
				"name": "Présence démoniaque",
				"text": "Vous piochez 2_cartes.\nGagne 10_points d’armure."
			},
			"id": "KARA_13_12",
			"name": "Demonic Presence",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Draw 2 cards.\nGain 10 Armor.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "EX1_093.png",
			"collectible": true,
			"cost": 4,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Défenseur d’Argus",
				"text": "<b>Cri de guerre :</b> donne aux serviteurs adjacents +1/+1 et <b>Provocation</b>."
			},
			"health": 3,
			"id": "EX1_093",
			"name": "Defender of Argus",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give adjacent minions +1/+1 and <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA08_3.png",
			"cost": 1,
			"fr": {
				"name": "Ordres de Drakkisath",
				"text": "Détruit un serviteur. Gagne 10 points d’armure."
			},
			"id": "BRMA08_3",
			"name": "Drakkisath's Command",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Destroy a minion. Gain 10 Armor.",
			"type": "Spell"
		},
		{
			"artist": "Eric Braddock",
			"attack": 1,
			"cardImage": "OG_284.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Géomancienne du Crépuscule",
				"text": "<b>Provocation</b>. <b>Cri de guerre_:</b> donne <b>Provocation</b> à votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 4,
			"id": "OG_284",
			"name": "Twilight Geomancer",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "[x]<b>Taunt</b>\n<b>Battlecry:</b> Give your C'Thun\n<b>Taunt</b> <i>(wherever it is).</i>",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "KARA_09_04.png",
			"cost": 0,
			"fr": {
				"name": "Sombre pacte",
				"text": "<b>Pouvoir héroïque passif</b>\nSeuls les diablotins dégoûtants peuvent infliger des dégâts à Malsabot_!"
			},
			"id": "KARA_09_04",
			"name": "Dark Pact",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Passive Hero Power</b>\nOnly Icky Imps can damage Illhoof!",
			"type": "Hero_power"
		},
		{
			"attack": 3,
			"cardImage": "NAX15_03n.png",
			"cost": 4,
			"fr": {
				"name": "Garde de la Couronne de glace",
				"text": "<b>Provocation</b>"
			},
			"health": 3,
			"id": "NAX15_03n",
			"name": "Guardian of Icecrown",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Taunt</b>",
			"type": "Minion"
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
			"attack": 5,
			"cardImage": "LOEA16_27.png",
			"cost": 5,
			"fr": {
				"name": "La sentinelle d’acier",
				"text": "Ce serviteur ne peut pas subir plus de 1 point de dégâts à la fois."
			},
			"health": 5,
			"id": "LOEA16_27",
			"name": "The Steel Sentinel",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "This minion can only take 1 damage at a time.",
			"type": "Minion"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 7,
			"cardImage": "LOE_110.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Ombre ancienne",
				"text": "<b>Cri de guerre :</b> place une carte Malédiction ancestrale dans votre deck qui vous inflige 7 points de dégâts quand vous la piochez."
			},
			"health": 4,
			"id": "LOE_110",
			"name": "Ancient Shade",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Loe",
			"text": "<b>Battlecry:</b> Shuffle an 'Ancient Curse' into your deck that deals 7 damage to you when drawn.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_178a.png",
			"cost": 0,
			"fr": {
				"name": "Enraciner",
				"text": "+5 PV et <b>Provocation</b>."
			},
			"id": "EX1_178a",
			"name": "Rooted",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "+5 Health and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_ClassRandom_Druid.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : druide",
				"text": "Ajoute des cartes de druide dans votre deck."
			},
			"id": "TB_ClassRandom_Druid",
			"name": "Second Class: Druid",
			"playerClass": "Druid",
			"set": "Tb",
			"text": "Add Druid cards to your deck.",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_23.png",
			"cost": 5,
			"fr": {
				"name": "Seigneur Ondulance",
				"text": "À la fin de votre tour, invoque un Naga affamé 1/1 pour chaque serviteur adverse."
			},
			"health": 5,
			"id": "LOEA16_23",
			"name": "Lord Slitherspear",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, summon 1/1 Hungry Naga for each enemy minion.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA13_8.png",
			"cost": 0,
			"fr": {
				"name": "MEURS, INSECTE !",
				"text": "Inflige $8 |4(point,points) de dégâts à un adversaire aléatoire."
			},
			"id": "BRMA13_8",
			"name": "DIE, INSECT!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Deal $8 damage to a random enemy.",
			"type": "Spell"
		},
		{
			"cardImage": "KARA_13_13H.png",
			"cost": 2,
			"fr": {
				"name": "Légion",
				"text": "<b>Pouvoir héroïque</b>\nInvoque deux abyssaux_6/6."
			},
			"id": "KARA_13_13H",
			"name": "Legion",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nSummon two 6/6 Abyssals.",
			"type": "Hero_power"
		},
		{
			"artist": "James Ryman",
			"attack": 6,
			"cardImage": "GVG_113.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Faucheur 4000",
				"text": "Inflige également des dégâts aux serviteurs à côté de celui qu’il attaque."
			},
			"health": 9,
			"id": "GVG_113",
			"name": "Foe Reaper 4000",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "Also damages the minions next to whomever he attacks.",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "EX1_312.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Néant distordu",
				"text": "Détruit tous les serviteurs."
			},
			"id": "EX1_312",
			"name": "Twisting Nether",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Destroy all minions.",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "OG_314b.png",
			"cost": 2,
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
			"cardImage": "BRMA14_6.png",
			"cost": 6,
			"fr": {
				"name": "Activer Électron",
				"text": "<b>Pouvoir héroïque</b>\nActive Électron !"
			},
			"id": "BRMA14_6",
			"name": "Activate Electron",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nActivate Electron!",
			"type": "Hero_power"
		},
		{
			"artist": "Vance Kovacs",
			"cardImage": "CS2_093.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Consécration",
				"text": "Inflige $2 |4(point,points) de dégâts à tous les adversaires."
			},
			"id": "CS2_093",
			"name": "Consecration",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $2 damage to all enemies.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_7_EnchMiniom2nd.png",
			"fr": {
				"name": "Destin",
				"text": "<b>Râle d’agonie_:</b> une carte aléatoire de votre main coûte (0)_|4(cristal,cristaux) de mana."
			},
			"id": "TB_PickYourFate_7_EnchMiniom2nd",
			"name": "Fate",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Deathrattle:</b> random card in owner's hand costs (0).",
			"type": "Enchantment"
		},
		{
			"artist": "Ryan Metcalf",
			"attack": 2,
			"cardImage": "OG_161.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Voyant corrompu",
				"text": "<b>Cri de guerre :</b> inflige\n2 points de dégâts à tous les serviteurs non murlocs."
			},
			"health": 3,
			"id": "OG_161",
			"name": "Corrupted Seer",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> Deal 2 damage to all non-Murloc minions.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_101.png",
			"cost": 2,
			"fr": {
				"name": "Renfort",
				"text": "<b>Pouvoir héroïque</b>\nInvoque une recrue de la Main d’argent 1/1."
			},
			"id": "CS2_101",
			"name": "Reinforce",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Silver Hand Recruit.",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_612o.png",
			"fr": {
				"name": "Puissance du Kirin Tor",
				"text": "Votre prochain Secret coûte (0)."
			},
			"id": "EX1_612o",
			"name": "Power of the Kirin Tor",
			"playerClass": "Mage",
			"set": "Expert1",
			"text": "Your next Secret costs (0).",
			"type": "Enchantment"
		},
		{
			"artist": "Linggar Bramanty",
			"cardImage": "EX1_538.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Lâcher les chiens",
				"text": "Invoque un chien 1/1 avec <b>Charge</b> pour chaque serviteur adverse."
			},
			"id": "EX1_538",
			"name": "Unleash the Hounds",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"text": "For each enemy minion, summon a 1/1 Hound with <b>Charge</b>.",
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
				"name": "Gelbin Mekkanivelle",
				"text": "<b>Cri de guerre :</b> invoque une invention GÉNIALE."
			},
			"health": 6,
			"id": "EX1_112",
			"name": "Gelbin Mekkatorque",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Promo",
			"text": "<b>Battlecry:</b> Summon an AWESOME invention.",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"cardImage": "AT_064.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Sonner",
				"text": "Inflige $3 |4(point,points) de dégâts. Confère\n3 points d’armure."
			},
			"id": "AT_064",
			"name": "Bash",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Deal $3 damage.\nGain 3 Armor.",
			"type": "Spell"
		},
		{
			"artist": "E. Guiton & Nutchapol ",
			"attack": 6,
			"cardImage": "OG_220.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Malkorok",
				"text": "<b>Cri de guerre :</b> vous équipe d’une arme aléatoire."
			},
			"health": 5,
			"id": "OG_220",
			"name": "Malkorok",
			"playerClass": "Warrior",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Battlecry:</b> Equip a random weapon.",
			"type": "Minion"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 2,
			"cardImage": "CS2_173.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Guerrier branchie-bleue",
				"text": "<b>Charge</b>"
			},
			"health": 1,
			"id": "CS2_173",
			"name": "Bluegill Warrior",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"artist": "Vance Kovacs",
			"attack": 3,
			"cardImage": "EX1_587.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Parlevent",
				"text": "<b>Cri de guerre :</b> confère <b>Furie des vents</b> à un serviteur allié."
			},
			"health": 3,
			"id": "EX1_587",
			"name": "Windspeaker",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Give a friendly minion <b>Windfury</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "OG_281e.png",
			"fr": {
				"name": "Dévotion du fanatique",
				"text": "Caractéristiques augmentées."
			},
			"id": "OG_281e",
			"name": "Fanatic Devotion",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Increased Stats.",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_063e.png",
			"fr": {
				"name": "Corruption",
				"text": "Au début du tour du joueur utilisant Corruption, détruit ce serviteur."
			},
			"id": "CS2_063e",
			"name": "Corruption",
			"playerClass": "Warlock",
			"set": "Core",
			"text": "At the start of the corrupting player's turn, destroy this minion.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_11b.png",
			"cost": 0,
			"fr": {
				"name": "Bonus : murloc",
				"text": "À la fin de votre tour, invoque un murloc 1/1."
			},
			"id": "TB_PickYourFate_11b",
			"name": "Murloc Bonus",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Summon a 1/1 Murloc at the end of your turn.",
			"type": "Spell"
		},
		{
			"artist": "Evgeniy Zaqumyenny",
			"cardImage": "KARA_12_03.png",
			"cost": 3,
			"fr": {
				"name": "Couronne de flammes",
				"text": "<b>Secret_:</b> quand un adversaire attaque, inflige 5_points de dégâts à tous les autres ennemis."
			},
			"id": "KARA_12_03",
			"name": "Flame Wreath",
			"playerClass": "Mage",
			"set": "Kara",
			"text": "<b>Secret:</b> When an enemy attacks, deal 5 damage to all other enemies.",
			"type": "Spell"
		},
		{
			"artist": "Chris Robinson",
			"attack": 6,
			"cardImage": "FP1_013.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Kel’Thuzad",
				"text": "À la fin de chaque tour, invoque tous les serviteurs alliés qui sont morts pendant ce tour."
			},
			"health": 8,
			"id": "FP1_013",
			"name": "Kel'Thuzad",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "At the end of each turn, summon all friendly minions that died this turn.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 8,
			"cardImage": "GVG_121.png",
			"collectible": true,
			"cost": 12,
			"fr": {
				"name": "Géant mécanique",
				"text": "Coûte (1) |4(cristal,cristaux) de moins pour chaque carte dans la main de votre adversaire."
			},
			"health": 8,
			"id": "GVG_121",
			"name": "Clockwork Giant",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Costs (1) less for each card in your opponent's hand.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA14_10H.png",
			"cost": 2,
			"fr": {
				"name": "Activation !",
				"text": "<b>Pouvoir héroïque</b>\nActive un Tron aléatoire."
			},
			"id": "BRMA14_10H",
			"name": "Activate!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nActivate a random Tron.",
			"type": "Hero_power"
		},
		{
			"attack": 0,
			"cardImage": "Mekka4.png",
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Pouletisateur",
				"text": "Au début de votre tour, transforme un serviteur aléatoire en poulet 1/1."
			},
			"health": 3,
			"id": "Mekka4",
			"name": "Poultryizer",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Promo",
			"text": "At the start of your turn, transform a random minion into a 1/1 Chicken.",
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
			"playerClass": "Neutral",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 6,
			"cardImage": "KARA_00_02a.png",
			"cost": 6,
			"fr": {
				"name": "Abyssal"
			},
			"health": 6,
			"id": "KARA_00_02a",
			"name": "Abyssal",
			"playerClass": "Warlock",
			"set": "Kara",
			"type": "Minion"
		},
		{
			"cardImage": "NAX3_02_TB.png",
			"cost": 2,
			"fr": {
				"name": "Entoilage",
				"text": "<b>Pouvoir héroïque</b>\nRenvoie un serviteur adverse aléatoire dans la main de votre adversaire."
			},
			"id": "NAX3_02_TB",
			"name": "Web Wrap",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nReturn a random enemy minion to your opponent's hand.",
			"type": "Hero_power"
		},
		{
			"artist": "Izzy Hoover",
			"cardImage": "OG_080f.png",
			"cost": 1,
			"fr": {
				"name": "Toxine de fleur de feu",
				"text": "Inflige $2 |4(point,points) de dégâts."
			},
			"id": "OG_080f",
			"name": "Firebloom Toxin",
			"playerClass": "Rogue",
			"set": "Og",
			"text": "Deal $2 damage.",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "TBST_004.png",
			"cost": 3,
			"fr": {
				"name": "Soigneur honnête",
				"text": "À la fin de votre tour, invoque un serviteur allié aléatoire mort pendant ce tour."
			},
			"health": 2,
			"id": "TBST_004",
			"name": "OLDLegit Healer",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "At the end of your turn, summon a random friendly minion that died this turn.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_022b.png",
			"fr": {
				"name": "Huile d’affûtage de Bricoleur",
				"text": "+3 ATQ."
			},
			"id": "GVG_022b",
			"name": "Tinker's Sharpsword Oil",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA09_2H.png",
			"cost": 2,
			"fr": {
				"name": "Ouvrir les portes",
				"text": "<b>Pouvoir héroïque</b>\nInvoque trois dragonnets 2/2. Change de pouvoir héroïque."
			},
			"id": "BRMA09_2H",
			"name": "Open the Gates",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon three 2/2 Whelps. Get a new Hero Power.",
			"type": "Hero_power"
		},
		{
			"artist": "Kevin Chin",
			"cardImage": "EX1_245.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Horion de terre",
				"text": "Réduit un serviteur au <b>Silence</b>, puis lui inflige $1 |4(point,points) de dégâts."
			},
			"id": "EX1_245",
			"name": "Earth Shock",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Silence</b> a minion, then deal $1 damage to it.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX3_02H.png",
			"cost": 0,
			"fr": {
				"name": "Entoilage",
				"text": "<b>Pouvoir héroïque</b>\nRenvoie 2 serviteurs adverses aléatoires dans la main de votre adversaire."
			},
			"id": "NAX3_02H",
			"name": "Web Wrap",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nReturn 2 random enemy minions to your opponent's hand.",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Konstad",
			"attack": 6,
			"cardImage": "OG_301.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Ancienne porte-bouclier",
				"text": "<b>Cri de guerre :</b> gagne\n10 points d’armure si votre C’Thun a au moins 10 Attaque."
			},
			"health": 6,
			"id": "OG_301",
			"name": "Ancient Shieldbearer",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> If your C'Thun has at least 10 Attack, gain 10 Armor.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA13_4_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Magie sauvage",
				"text": "<b>Pouvoir héroïque</b>\nPlace un sort aléatoire de la classe de votre adversaire dans votre main."
			},
			"id": "BRMA13_4_2_TB",
			"name": "Wild Magic",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nPut a random spell from your opponent's class into your hand.",
			"type": "Hero_power"
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
			"cardImage": "EX1_334e.png",
			"fr": {
				"name": "Folie de l’ombre",
				"text": "Les commandes de ce serviteur sont échangées pour ce tour."
			},
			"id": "EX1_334e",
			"name": "Shadow Madness",
			"playerClass": "Priest",
			"set": "Expert1",
			"text": "This minion has switched controllers this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 7,
			"cardImage": "EX1_411.png",
			"collectible": true,
			"cost": 7,
			"durability": 1,
			"fr": {
				"name": "Hurlesang",
				"text": "Attaquer un serviteur coûte 1 ATQ au lieu de 1 Durabilité."
			},
			"id": "EX1_411",
			"name": "Gorehowl",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Attacking a minion costs 1 Attack instead of 1 Durability.",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX15_01H.png",
			"fr": {
				"name": "Kel’Thuzad"
			},
			"health": 45,
			"id": "NAX15_01H",
			"name": "Kel'Thuzad",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "LOE_115.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Idole corbeau",
				"text": "<b>Choix des armes :</b>\n<b>découvre</b> un serviteur ou un sort."
			},
			"id": "LOE_115",
			"name": "Raven Idol",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Choose One -</b>\n<b>Discover</b> a minion; or <b>Discover</b> a spell.",
			"type": "Spell"
		},
		{
			"artist": "Matt O'Connor",
			"cardImage": "KARA_06_03hp.png",
			"cost": 4,
			"fr": {
				"name": "Amour véritable",
				"text": "<b>Pouvoir héroïque</b>\nSi vous n’avez pas Romulo, l’invoque."
			},
			"id": "KARA_06_03hp",
			"name": "True Love",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nIf you don't have Romulo, summon him.",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_195e.png",
			"fr": {
				"name": "Furieux",
				"text": "+2/+2."
			},
			"id": "OG_195e",
			"name": "Enormous",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": " James Ryman",
			"attack": 3,
			"cardImage": "AT_081.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Eadric le Pur",
				"text": "<b>Cri de guerre :</b> l’Attaque de tous les serviteurs adverses passe à 1."
			},
			"health": 7,
			"id": "AT_081",
			"name": "Eadric the Pure",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Change all enemy minions'\nAttack to 1.",
			"type": "Minion"
		},
		{
			"cardImage": "TU4e_005.png",
			"cost": 3,
			"fr": {
				"name": "Explosion de flammes",
				"text": "Lance 5 missiles infligeant chacun $1 |4(point,points) de dégâts à des adversaires aléatoires."
			},
			"id": "TU4e_005",
			"name": "Flame Burst",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "Shoot 5 missiles at random enemies for $1 damage each.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_014t.png",
			"cost": 1,
			"fr": {
				"name": "Banane",
				"text": "Confère +1/+1 à un serviteur."
			},
			"id": "EX1_014t",
			"name": "Bananas",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Give a minion +1/+1.",
			"type": "Spell"
		},
		{
			"artist": "Ittoku",
			"cardImage": "EX1_136.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Rédemption",
				"text": "<b>Secret :</b> quand un de vos serviteurs meurt, il est ressuscité avec\n1 PV."
			},
			"id": "EX1_136",
			"name": "Redemption",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Secret:</b> When one of your minions dies, return it to life with 1 Health.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA07_03h.png",
			"cost": 0,
			"fr": {
				"name": "Fuir la mine !",
				"text": "Échappez aux troggs !"
			},
			"id": "LOEA07_03h",
			"name": "Flee the Mine!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Escape the Troggs!",
			"type": "Hero_power"
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
			"cardImage": "AT_096e.png",
			"fr": {
				"name": "Remonté",
				"text": "+1/+1."
			},
			"id": "AT_096e",
			"name": "Wound Up",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "KARA_05_01hpheroic.png",
			"cost": 0,
			"fr": {
				"name": "Apeuré",
				"text": "<b>Pouvoir héroïque passif</b>\nLes serviteurs coûtent (1)_cristal. Les serviteurs adverses ont_1/1."
			},
			"id": "KARA_05_01hpheroic",
			"name": "Trembling",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Passive Hero Power</b> Minions cost (1). Enemy minions are 1/1.",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_080o.png",
			"fr": {
				"name": "Garde des secrets",
				"text": "Caractéristiques augmentées."
			},
			"id": "EX1_080o",
			"name": "Keeping Secrets",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRM_024e.png",
			"fr": {
				"name": "Grandes griffes",
				"text": "+3/+3."
			},
			"id": "BRM_024e",
			"name": "Large Talons",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "+3/+3.",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_039e.png",
			"fr": {
				"name": "Sauvage",
				"text": "+2 ATQ pendant ce tour."
			},
			"id": "AT_039e",
			"name": "Savage",
			"playerClass": "Druid",
			"set": "Tgt",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Dave Allsop",
			"attack": 3,
			"cardImage": "KAR_033.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Wyrm de bibliothèque",
				"text": "<b>Cri de guerre_:</b> détruit un serviteur adverse avec 3_ATQ ou moins si vous avez un Dragon en main."
			},
			"health": 6,
			"id": "KAR_033",
			"name": "Book Wyrm",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Kara",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, destroy an enemy minion with 3 or less Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_046e.png",
			"fr": {
				"name": "Le roi",
				"text": "Attaque augmentée."
			},
			"id": "GVG_046e",
			"name": "The King",
			"playerClass": "Hunter",
			"set": "Gvg",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Andrew Hou",
			"attack": 2,
			"cardImage": "OG_179.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Chauve-souris embrasée",
				"text": "<b>Râle d’agonie :</b> inflige\n1 point de dégâts à un adversaire aléatoire."
			},
			"health": 1,
			"id": "OG_179",
			"name": "Fiery Bat",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Deal 1 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 3,
			"cardImage": "GVG_036.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Masse de puissance",
				"text": "<b>Râle d’agonie_:</b> donne à un Méca allié aléatoire_+2/+2."
			},
			"id": "GVG_036",
			"name": "Powermace",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Deathrattle:</b> Give a random friendly Mech +2/+2.",
			"type": "Weapon"
		},
		{
			"attack": 5,
			"cardImage": "LOEA09_8H.png",
			"cost": 5,
			"fr": {
				"name": "Garde ondulant",
				"text": "<b>Provocation</b>"
			},
			"health": 7,
			"id": "LOEA09_8H",
			"name": "Slithering Guard",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_022e.png",
			"fr": {
				"name": "Free Cards",
				"text": "Your cards cost (0) for the rest of the game."
			},
			"id": "XXX_022e",
			"name": "Free Cards",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Your cards cost (0) for the rest of the game.",
			"type": "Enchantment"
		},
		{
			"attack": 6,
			"cardImage": "OG_279.png",
			"cost": 10,
			"fr": {
				"name": "C’Thun",
				"text": "<b>Cri de guerre :</b> inflige des dégâts égaux à l’Attaque de ce serviteur répartis aléatoirement entre tous les adversaires."
			},
			"health": 6,
			"id": "OG_279",
			"name": "C'Thun",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Battlecry:</b> Deal damage equal to this minion's Attack randomly split among all enemies.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_012.png",
			"cost": 0,
			"fr": {
				"name": "Choisir une nouvelle carte !",
				"text": "Affiche 3 cartes aléatoires. Choisissez-en une à placer dans votre deck."
			},
			"id": "TB_012",
			"name": "Choose a New Card!",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Look at 3 random cards. Choose one and shuffle it into your deck.",
			"type": "Spell"
		},
		{
			"artist": "Steve Prescott",
			"attack": 0,
			"cardImage": "EX1_557.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Nat Pagle",
				"text": "Au début de votre tour, vous avez 50% de chances de piocher une carte supplémentaire."
			},
			"health": 4,
			"id": "EX1_557",
			"name": "Nat Pagle",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "At the start of your turn, you have a 50% chance to draw an extra card.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_411e.png",
			"fr": {
				"name": "Rage sanguinaire",
				"text": "Aucune perte de durabilité."
			},
			"id": "EX1_411e",
			"name": "Bloodrage",
			"playerClass": "Warrior",
			"set": "Expert1",
			"text": "No durability loss.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_9_EnchMinion.png",
			"fr": {
				"name": "Bonus",
				"text": "Vos serviteurs avec <b>Râle d’agonie</b> ont +1/+1."
			},
			"id": "TB_PickYourFate_9_EnchMinion",
			"name": "Bonus",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Your <b>Deathrattle</b> minions have +1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TU4e_002.png",
			"cost": 2,
			"fr": {
				"name": "Flammes d’Azzinoth",
				"text": "<b>Pouvoir héroïque</b>\nInvoque deux serviteurs 2/1."
			},
			"id": "TU4e_002",
			"name": "Flames of Azzinoth",
			"playerClass": "Neutral",
			"set": "Missions",
			"text": "<b>Hero Power</b>\nSummon two 2/1 minions.",
			"type": "Hero_power"
		},
		{
			"artist": "Laurel D. Austin",
			"attack": 2,
			"cardImage": "GVG_104.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Hobgobelin",
				"text": "Chaque fois que vous jouez un serviteur avec 1 ATQ, lui donne +2/+2."
			},
			"health": 3,
			"id": "GVG_104",
			"name": "Hobgoblin",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Whenever you play a 1-Attack minion, give it +2/+2.",
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
			"cardImage": "AT_066e.png",
			"fr": {
				"name": "Forges d’Orgrimmar",
				"text": "Attaque augmentée."
			},
			"id": "AT_066e",
			"name": "Forges of Orgrimmar",
			"playerClass": "Warrior",
			"set": "Tgt",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"attack": 3,
			"cardImage": "CRED_44.png",
			"cost": 4,
			"fr": {
				"name": "Walter Kong",
				"text": "<b>Cri de guerre :</b> inflige 1 point de dégâts à deux cibles stratégiques."
			},
			"health": 2,
			"id": "CRED_44",
			"name": "Walter Kong",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Deal 1 damage to each of 2 strategic targets.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "XXX_108.png",
			"cost": 0,
			"fr": {
				"name": "Set all minions to 1 health",
				"text": "Set every minion's health to 1, and then explode in nothingness."
			},
			"health": 0,
			"id": "XXX_108",
			"name": "Set all minions to 1 health",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Set every minion's health to 1, and then explode in nothingness.",
			"type": "Minion"
		},
		{
			"artist": "Tooth",
			"attack": 1,
			"cardImage": "KAR_010a.png",
			"cost": 1,
			"fr": {
				"name": "Dragonnet"
			},
			"health": 1,
			"id": "KAR_010a",
			"name": "Whelp",
			"playerClass": "Paladin",
			"set": "Kara",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 7,
			"cardImage": "LOE_009.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Destructeur d’obsidienne",
				"text": "À la fin de votre tour, invoque un scarabée 1/1 avec <b>Provocation</b>."
			},
			"health": 7,
			"id": "LOE_009",
			"name": "Obsidian Destroyer",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Loe",
			"text": "At the end of your turn, summon a 1/1 Scarab with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "OG_048e.png",
			"fr": {
				"name": "Marque d’Y’Shaarj",
				"text": "+2/+2."
			},
			"id": "OG_048e",
			"name": "Mark of Y'Shaarj",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Og",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "LOEA09_6H.png",
			"cost": 2,
			"fr": {
				"name": "Archer ondulant",
				"text": "<b>Cri de guerre :</b> inflige 2 points de dégâts à tous les serviteurs adverses."
			},
			"health": 2,
			"id": "LOEA09_6H",
			"name": "Slithering Archer",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Battlecry:</b> Deal 2 damage to all enemy minions.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_030be.png",
			"fr": {
				"name": "Mode Char",
				"text": "+1 PV."
			},
			"id": "GVG_030be",
			"name": "Tank Mode",
			"playerClass": "Druid",
			"set": "Gvg",
			"text": "+1 Health.",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_87.png",
			"cost": 3,
			"fr": {
				"name": "Moira Barbe-de-Bronze",
				"text": "<b>Râle d’agonie :</b> invoque l’empereur Thaurissan."
			},
			"health": 3,
			"id": "BRMC_87",
			"name": "Moira Bronzebeard",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "<b>Deathrattle:</b> Summon Emperor Thaurissan.",
			"type": "Minion"
		},
		{
			"artist": "Sean O’Daniels",
			"attack": 5,
			"cardImage": "EX1_178.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Ancien de la guerre",
				"text": "<b>Choix des armes :</b> \n+5 ATQ ou +5 PV et <b>Provocation</b>."
			},
			"health": 5,
			"id": "EX1_178",
			"name": "Ancient of War",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Choose One</b> -\n+5 Attack; or +5 Health and <b>Taunt</b>.",
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 9,
			"cardImage": "BRM_027.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Chambellan Executus",
				"text": "<b>Râle d’agonie :</b> remplace votre héros par Ragnaros, le seigneur du feu."
			},
			"health": 7,
			"id": "BRM_027",
			"name": "Majordomo Executus",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "<b>Deathrattle:</b> Replace your hero with Ragnaros, the Firelord.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "EX1_165t1.png",
			"cost": 5,
			"fr": {
				"name": "Druide de la Griffe",
				"text": "<b>Charge</b>"
			},
			"health": 4,
			"id": "EX1_165t1",
			"name": "Druid of the Claw",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "AT_132_SHAMANd.png",
			"cost": 0,
			"fr": {
				"name": "Totem de courroux de l’air",
				"text": "<b>Dégâts des sorts : +1</b>"
			},
			"health": 2,
			"id": "AT_132_SHAMANd",
			"name": "Wrath of Air Totem",
			"playerClass": "Shaman",
			"set": "Tgt",
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"cardImage": "AT_028e.png",
			"fr": {
				"name": "Lance de chi",
				"text": "+3 ATQ."
			},
			"id": "AT_028e",
			"name": "Chi Lance",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_034_H2.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu",
				"text": "<b>Pouvoir héroïque</b>\nInflige $1 point de dégâts."
			},
			"id": "CS2_034_H2",
			"name": "Fireblast",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nDeal $1 damage.",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOE_009e.png",
			"fr": {
				"name": "Puissance sinistre",
				"text": "+4/+4."
			},
			"id": "LOE_009e",
			"name": "Sinister Power",
			"playerClass": "Warlock",
			"set": "Loe",
			"text": "+4/+4.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA06_02h.png",
			"cost": 1,
			"fr": {
				"name": "Sculpture sur pierre",
				"text": "<b>Pouvoir héroïque</b>\nInvoque une statue pour chaque joueur."
			},
			"id": "LOEA06_02h",
			"name": "Stonesculpting",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\n Summon a Statue for both players.",
			"type": "Hero_power"
		},
		{
			"artist": "Dave Kendall",
			"cardImage": "EX1_303.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Ombreflamme",
				"text": "Détruit un serviteur allié et inflige des dégâts équivalents à ses points d’attaque à tous les serviteurs adverses."
			},
			"id": "EX1_303",
			"name": "Shadowflame",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Destroy a friendly minion and deal its Attack damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"artist": "Laurel D. Austin",
			"attack": 4,
			"cardImage": "NEW1_040.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Lardeur",
				"text": "À la fin de votre tour, invoque un gnoll 2/2 avec <b>Provocation</b>."
			},
			"health": 4,
			"id": "NEW1_040",
			"name": "Hogger",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "At the end of your turn, summon a 2/2 Gnoll with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros ",
			"attack": 3,
			"cardImage": "AT_030.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Vaillant de Fossoyeuse",
				"text": "<b>Combo :</b> inflige 1 point de dégâts."
			},
			"health": 2,
			"id": "AT_030",
			"name": "Undercity Valiant",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Combo:</b> Deal 1 damage.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_071e.png",
			"fr": {
				"name": "Aubaine d’Alexstrasza",
				"text": "+1 ATQ et <b>Charge</b>."
			},
			"id": "AT_071e",
			"name": "Alexstrasza's Boon",
			"playerClass": "Warrior",
			"set": "Tgt",
			"text": "+1 Attack and <b>Charge</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 3,
			"cardImage": "LOE_019.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Raptor déterré",
				"text": "<b>Cri de guerre :</b> choisit un serviteur allié. Gagne une copie de son <b>Râle d’agonie</b>."
			},
			"health": 4,
			"id": "LOE_019",
			"name": "Unearthed Raptor",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Loe",
			"text": "<b>Battlecry:</b> Choose a friendly minion. Gain a copy of its <b>Deathrattle</b> effect.",
			"type": "Minion"
		},
		{
			"artist": "Craig Mullins",
			"attack": 2,
			"cardImage": "LOE_118.png",
			"collectible": true,
			"cost": 1,
			"durability": 3,
			"fr": {
				"name": "Lame maudite",
				"text": "Double tous les dégâts subis par votre héros."
			},
			"id": "LOE_118",
			"name": "Cursed Blade",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Loe",
			"text": "Double all damage dealt to your hero.",
			"type": "Weapon"
		},
		{
			"artist": "Benjamin Zhang",
			"cardImage": "DS1_183.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Flèches multiples",
				"text": "Inflige $3 |4(point,points) de dégâts à deux serviteurs adverses aléatoires."
			},
			"id": "DS1_183",
			"name": "Multi-Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $3 damage to two random enemy minions.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_5H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : bleu",
				"text": "Les sorts de Chromaggus coûtent (3) |4(cristal,cristaux) de moins tant que vous avez cette carte dans votre main."
			},
			"id": "BRMA12_5H",
			"name": "Brood Affliction: Blue",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "While this is in your hand, Chromaggus' spells cost (3) less.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_054e.png",
			"fr": {
				"name": "Weapon Buff Enchant"
			},
			"id": "XXX_054e",
			"name": "Weapon Buff Enchant",
			"playerClass": "Neutral",
			"set": "Cheat",
			"type": "Enchantment"
		},
		{
			"artist": "Daren Bader",
			"attack": 6,
			"cardImage": "EX1_623.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Massacreur du temple",
				"text": "<b>Cri de guerre :</b> donne +3 PV à un serviteur allié."
			},
			"health": 6,
			"id": "EX1_623",
			"name": "Temple Enforcer",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give a friendly minion +3 Health.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX13_02e.png",
			"fr": {
				"name": "Polarité",
				"text": "Attaque et vie inversées."
			},
			"id": "NAX13_02e",
			"name": "Polarity",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Attack and Health swapped.",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_044e.png",
			"fr": {
				"name": "Gain de niveau !",
				"text": "Attaque et Vie augmentées."
			},
			"id": "EX1_044e",
			"name": "Level Up!",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Increased Attack and Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "KARA_07_01.png",
			"fr": {
				"name": "Conservateur"
			},
			"health": 30,
			"id": "KARA_07_01",
			"name": "Curator",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA07_18.png",
			"cost": 1,
			"fr": {
				"name": "Dynamite",
				"text": "Inflige $10 |4(point,points) de dégâts."
			},
			"id": "LOEA07_18",
			"name": "Dynamite",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Deal $10 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_059e.png",
			"fr": {
				"name": "Des expériences !",
				"text": "L’Attaque et la Vie ont été échangées par l’alchimiste dément."
			},
			"id": "EX1_059e",
			"name": "Experiments!",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Attack and Health have been swapped by Crazed Alchemist.",
			"type": "Enchantment"
		},
		{
			"artist": "Phil Saunders",
			"attack": 3,
			"cardImage": "GVG_123.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Cracheur de suie",
				"text": "<b>Dégâts des sorts : +1</b>"
			},
			"health": 3,
			"id": "GVG_123",
			"name": "Soot Spewer",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Gvg",
			"spellDamage": 1,
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "OG_031.png",
			"collectible": true,
			"cost": 5,
			"durability": 2,
			"fr": {
				"name": "Marteau du crépuscule",
				"text": "<b>Râle d’agonie :</b> invoque un élémentaire 4/2."
			},
			"id": "OG_031",
			"name": "Hammer of Twilight",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Summon a 4/2 Elemental.",
			"type": "Weapon"
		},
		{
			"cardImage": "OG_293f.png",
			"fr": {
				"name": "Sombre gardien",
				"text": "Caractéristiques augmentées."
			},
			"id": "OG_293f",
			"name": "Dark Guardian",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Increased Stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Greg Hildebrandt",
			"attack": 1,
			"cardImage": "CS2_169.png",
			"collectible": true,
			"cost": 1,
			"faction": "HORDE",
			"fr": {
				"name": "Jeune faucon-dragon",
				"text": "<b>Furie des vents</b>"
			},
			"health": 1,
			"id": "CS2_169",
			"name": "Young Dragonhawk",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Windfury</b>",
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Jimmy Lo",
			"cardImage": "KAR_077.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Portail de Lune-d’Argent",
				"text": "Donne +2/+2 à un serviteur. Invoque un serviteur aléatoire coûtant 2_cristaux."
			},
			"id": "KAR_077",
			"name": "Silvermoon Portal",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Kara",
			"text": "Give a minion +2/+2. Summon a random\n2-Cost minion.",
			"type": "Spell"
		},
		{
			"artist": "Dave Allsop",
			"attack": 1,
			"cardImage": "KAR_030.png",
			"cost": 3,
			"fr": {
				"name": "Araignée de la cave"
			},
			"health": 3,
			"id": "KAR_030",
			"name": "Cellar Spider",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_003e.png",
			"fr": {
				"name": "Puissance du dragon",
				"text": "Coûte (3) cristaux de moins pendant ce tour."
			},
			"id": "BRM_003e",
			"name": "Dragon's Might",
			"playerClass": "Mage",
			"set": "Brm",
			"text": "Costs (3) less this turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TU4c_002.png",
			"cost": 1,
			"fr": {
				"name": "Lancer de tonneau",
				"text": "Inflige 2 points de dégâts."
			},
			"id": "TU4c_002",
			"name": "Barrel Toss",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "Deal 2 damage.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "EX1_506a.png",
			"cost": 1,
			"fr": {
				"name": "Éclaireur murloc"
			},
			"health": 1,
			"id": "EX1_506a",
			"name": "Murloc Scout",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "KAR_A01_01H.png",
			"fr": {
				"name": "Miroir magique"
			},
			"health": 30,
			"id": "KAR_A01_01H",
			"name": "Magic Mirror",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA13_3H.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "BRMA13_3H",
			"name": "Nefarian",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "NAX2_05H.png",
			"cost": 3,
			"fr": {
				"name": "Adorateur",
				"text": "Votre héros a +3 ATQ pendant votre tour."
			},
			"health": 4,
			"id": "NAX2_05H",
			"name": "Worshipper",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Your hero has +3 Attack on your turn.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 3,
			"cardImage": "OG_315.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Adepte de la Voile sanglante",
				"text": "<b>Cri de guerre :</b> donne +1/+1 à votre arme si vous contrôlez un autre Pirate."
			},
			"health": 4,
			"id": "OG_315",
			"name": "Bloodsail Cultist",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> If you control another Pirate, give your weapon +1/+1.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "XXX_095.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - All Charge!",
				"text": "Spawn into play to give all minions <b>Charge</b>."
			},
			"health": 1,
			"id": "XXX_095",
			"name": "AI Buddy - All Charge!",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Spawn into play to give all minions <b>Charge</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_20e.png",
			"fr": {
				"name": "Béni",
				"text": "<b>Insensible</b> pendant ce tour."
			},
			"id": "LOEA16_20e",
			"name": "Blessed",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": " <b>Immune</b> this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Daren Bader",
			"attack": 1,
			"cardImage": "NEW1_016.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Perroquet du capitaine",
				"text": "<b>Cri de guerre :</b> place un pirate aléatoire de votre deck dans votre main."
			},
			"health": 1,
			"id": "NEW1_016",
			"name": "Captain's Parrot",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Reward",
			"text": "<b>Battlecry:</b> Put a random Pirate from your deck into your hand.",
			"type": "Minion"
		},
		{
			"artist": "Tyson Murphy",
			"attack": 4,
			"cardImage": "LOE_011.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Reno Jackson",
				"text": "<b>Cri de guerre :</b> si votre deck ne contient pas de cartes en double, rend tous ses points de vie à votre héros."
			},
			"health": 6,
			"id": "LOE_011",
			"name": "Reno Jackson",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "<b>Battlecry:</b> If your deck contains no more than 1 of any card, fully heal your hero.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "OG_311.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Lumière dans les ténèbres",
				"text": "<b>Découvre</b> un serviteur.\nLui donne +1/+1."
			},
			"id": "OG_311",
			"name": "A Light in the Darkness",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Discover</b> a minion.\nGive it +1/+1.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_116e.png",
			"fr": {
				"name": "Venez vous battre !",
				"text": "+1 ATQ et <b>Provocation</b>."
			},
			"id": "AT_116e",
			"name": "Bring it on!",
			"playerClass": "Priest",
			"set": "Tgt",
			"text": "+1 Attack and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_GiftExchange_Enchantment.png",
			"fr": {
				"name": "Cadeau nul",
				"text": "Le coût de cette carte est réduit."
			},
			"id": "TB_GiftExchange_Enchantment",
			"name": "Cheap Gift",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "This card's cost is reduced.",
			"type": "Enchantment"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "EX1_533.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Détournement",
				"text": "<b>Secret :</b> quand un personnage attaque votre héros, il attaque un autre personnage aléatoire à la place."
			},
			"id": "EX1_533",
			"name": "Misdirection",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Secret:</b> When a character attacks your hero, instead he attacks another random character.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "EX1_573.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Cénarius",
				"text": "<b>Choix des armes :</b> confère +2/+2 à vos autres serviteurs ou invoque deux tréants 2/2 avec <b>Provocation</b>."
			},
			"health": 8,
			"id": "EX1_573",
			"name": "Cenarius",
			"playerClass": "Druid",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Choose One</b> - Give your other minions +2/+2; or Summon two 2/2 Treants with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "LOEA02_10a.png",
			"cost": 0,
			"fr": {
				"name": "Leokk",
				"text": "Vos serviteurs ont +1 ATQ."
			},
			"health": 4,
			"id": "LOEA02_10a",
			"name": "Leokk",
			"playerClass": "Hunter",
			"set": "Loe",
			"text": "Your minions have +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_363e2.png",
			"fr": {
				"name": "Bénédiction de sagesse",
				"text": "Quand ce serviteur attaque, le joueur adverse pioche une carte."
			},
			"id": "EX1_363e2",
			"name": "Blessing of Wisdom",
			"playerClass": "Paladin",
			"set": "Expert1",
			"text": "When this minion attacks, the enemy player draws a card.",
			"type": "Enchantment"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "AT_060.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Piège à ours",
				"text": "<b>Secret :</b> invoque un ours 3/3 avec <b>Provocation</b> une fois que votre héros a été attaqué."
			},
			"id": "AT_060",
			"name": "Bear Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Secret:</b> After your hero is attacked, summon a 3/3 Bear with <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA14_2.png",
			"cost": 0,
			"fr": {
				"name": "Armure de plates",
				"text": "<b>Pouvoir héroïque passif</b>\nVotre héros ne peut pas subir plus de 1 point de dégâts à la fois."
			},
			"id": "LOEA14_2",
			"name": "Platemail Armor",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\nYour Hero can only take 1 damage at a time.",
			"type": "Hero_power"
		},
		{
			"artist": "Matt Starbuck",
			"attack": 4,
			"cardImage": "CS2_151.png",
			"collectible": true,
			"cost": 5,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Champion de la Main d’argent",
				"text": "<b>Cri de guerre :</b> invoque un écuyer 2/2."
			},
			"health": 4,
			"id": "CS2_151",
			"name": "Silver Hand Knight",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Summon a 2/2 Squire.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_042b.png",
			"cost": 0,
			"fr": {
				"name": "Forme de panthère",
				"text": "+1/+1 et <b>Camouflage</b>."
			},
			"id": "AT_042b",
			"name": "Panther Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Tgt",
			"text": "+1/+1 and <b>Stealth</b>",
			"type": "Spell"
		},
		{
			"artist": "Jakub Kasper",
			"cardImage": "KAR_025.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Kara Kazham !",
				"text": "Invoque une bougie 1/1, un balai 2/2 et une théière 3/3."
			},
			"id": "KAR_025",
			"name": "Kara Kazham!",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Kara",
			"text": "Summon a 1/1 Candle, 2/2 Broom, and 3/3 Teapot.",
			"type": "Spell"
		},
		{
			"artist": "Nate Bowden",
			"attack": 2,
			"cardImage": "EX1_247.png",
			"collectible": true,
			"cost": 2,
			"durability": 3,
			"fr": {
				"name": "Hache de Forge-foudre",
				"text": "<b>Surcharge :</b> (1)"
			},
			"id": "EX1_247",
			"name": "Stormforged Axe",
			"overload": 1,
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Overload:</b> (1)",
			"type": "Weapon"
		},
		{
			"cardImage": "OG_200e.png",
			"fr": {
				"name": "Destin funeste évité",
				"text": "Attaque portée à 7."
			},
			"id": "OG_200e",
			"name": "Doom Free",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Attack set to 7.",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_058.png",
			"cost": 0,
			"fr": {
				"name": "Weapon Nerf",
				"text": "Give a weapon a negative enchantment."
			},
			"id": "XXX_058",
			"name": "Weapon Nerf",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Give a weapon a negative enchantment.",
			"type": "Spell"
		},
		{
			"artist": "Wayne Reynolds",
			"cardImage": "CS2_063.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Corruption",
				"text": "Choisissez un serviteur adverse. Au début de votre tour, il est détruit."
			},
			"id": "CS2_063",
			"name": "Corruption",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Core",
			"text": "Choose an enemy minion. At the start of your turn, destroy it.",
			"type": "Spell"
		},
		{
			"artist": "Marcelo Vignali",
			"cardImage": "AT_055.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Soins rapides",
				"text": "Rend #5 PV."
			},
			"id": "AT_055",
			"name": "Flash Heal",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Tgt",
			"text": "Restore #5 Health.",
			"type": "Spell"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "OG_061.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "En chasse",
				"text": "Inflige $1 |4(point,points) de dégâts. Invoque un mastiff 1/1."
			},
			"id": "OG_061",
			"name": "On the Hunt",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Og",
			"text": "Deal $1 damage.\nSummon a 1/1 Mastiff.",
			"type": "Spell"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 2,
			"cardImage": "AT_105.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Kvaldir blessé",
				"text": "<b>Cri de guerre :</b> inflige\n3 points de dégâts à ce serviteur."
			},
			"health": 4,
			"id": "AT_105",
			"name": "Injured Kvaldir",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Deal 3 damage to this minion.",
			"type": "Minion"
		},
		{
			"artist": "Dave Kendall",
			"attack": 1,
			"cardImage": "EX1_007.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Acolyte de la souffrance",
				"text": "Vous piochez une carte chaque fois que ce serviteur subit des dégâts."
			},
			"health": 3,
			"id": "EX1_007",
			"name": "Acolyte of Pain",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Whenever this minion takes damage, draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Samwise",
			"attack": 3,
			"cardImage": "EX1_398.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Fabricante d’armes",
				"text": "<b>Cri de guerre :</b> vous équipe d’une arme 2/2."
			},
			"health": 3,
			"id": "EX1_398",
			"name": "Arathi Weaponsmith",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Equip a 2/2 weapon.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_MechWar_CommonCards.png",
			"fr": {
				"name": "TBMechWarCommonCards"
			},
			"id": "TB_MechWar_CommonCards",
			"name": "TBMechWarCommonCards",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Carl Frank",
			"cardImage": "EX1_295.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Bloc de glace",
				"text": "<b>Secret :</b> protège votre héros des dégâts mortels, et le rend <b>Insensible</b> pendant ce tour."
			},
			"id": "EX1_295",
			"name": "Ice Block",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Secret:</b> When your hero takes fatal damage, prevent it and become <b>Immune</b> this turn.",
			"type": "Spell"
		},
		{
			"artist": "Raven Mimura",
			"cardImage": "EX1_317.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Détection des démons",
				"text": "Place dans votre main 2 démons aléatoires de votre jeu."
			},
			"id": "EX1_317",
			"name": "Sense Demons",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Put 2 random Demons from your deck into your hand.",
			"type": "Spell"
		},
		{
			"artist": "Ruan Jia",
			"attack": 8,
			"cardImage": "BRM_030.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Nefarian",
				"text": "<b>Cri de guerre :</b> ajoute 2 sorts aléatoires dans votre main <i>(de la classe de votre adversaire)</i>."
			},
			"health": 8,
			"id": "BRM_030",
			"name": "Nefarian",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "<b>Battlecry:</b> Add 2 random spells to your hand <i>(from your opponent's class)</i>.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_013t.png",
			"cost": 0,
			"fr": {
				"name": "Excès de mana",
				"text": "Vous piochez une carte. <i>(Vous ne pouvez avoir que 10 cristaux de mana en réserve.)</i>"
			},
			"id": "CS2_013t",
			"name": "Excess Mana",
			"playerClass": "Druid",
			"set": "Core",
			"text": "Draw a card. <i>(You can only have 10 Mana in your tray.)</i>",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_165a.png",
			"cost": 0,
			"fr": {
				"name": "Forme de félin",
				"text": "<b>Charge</b>"
			},
			"id": "EX1_165a",
			"name": "Cat Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Charge</b>",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_7.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : bronze",
				"text": "Les serviteurs de Chromaggus coûtent (1) |4(cristal,cristaux) de moins tant que vous avez cette carte dans votre main."
			},
			"id": "BRMA12_7",
			"name": "Brood Affliction: Bronze",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "While this is in your hand, Chromaggus' minions cost (1) less.",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"attack": 3,
			"cardImage": "NEW1_026.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Enseignante pourpre",
				"text": "Chaque fois que vous lancez un sort, invoque un apprenti pourpre 1/1."
			},
			"health": 5,
			"id": "NEW1_026",
			"name": "Violet Teacher",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Whenever you cast a spell, summon a 1/1 Violet Apprentice.",
			"type": "Minion"
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
			"cardImage": "NAX4_04.png",
			"cost": 0,
			"fr": {
				"name": "Réanimation morbide",
				"text": "<b>Pouvoir héroïque passif</b>\nChaque fois qu’un adversaire meurt, un squelette 1/1 se lève."
			},
			"id": "NAX4_04",
			"name": "Raise Dead",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Passive Hero Power</b>\nWhenever an enemy dies, raise a 1/1 Skeleton.",
			"type": "Hero_power"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_85.png",
			"cost": 4,
			"fr": {
				"name": "Lucifron",
				"text": "<b>Cri de guerre :</b> lance Corruption sur tous les autres serviteurs."
			},
			"health": 7,
			"id": "BRMC_85",
			"name": "Lucifron",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "<b>Battlecry:</b> Cast Corruption on all other minions.",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "LOEA04_13bt.png",
			"cost": 4,
			"fr": {
				"name": "Garde d’Orsis",
				"text": "<b>Bouclier divin</b>"
			},
			"health": 5,
			"id": "LOEA04_13bt",
			"name": "Orsis Guard",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_12_01.png",
			"fr": {
				"name": "Ombre d’Aran"
			},
			"health": 30,
			"id": "KARA_12_01",
			"name": "Shade of Aran",
			"playerClass": "Mage",
			"set": "Kara",
			"type": "Hero"
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
			"cardImage": "XXX_013.png",
			"cost": 0,
			"fr": {
				"name": "Discard",
				"text": "Choose a hero.  That hero's controller discards his hand."
			},
			"id": "XXX_013",
			"name": "Discard",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Choose a hero.  That hero's controller discards his hand.",
			"type": "Spell"
		},
		{
			"artist": "Chris Seaman",
			"cardImage": "CS2_028.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Blizzard",
				"text": "Inflige $2 |4(point,points) de dégâts à tous les serviteurs adverses et les <b>gèle</b>."
			},
			"id": "CS2_028",
			"name": "Blizzard",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Deal $2 damage to all enemy minions and <b>Freeze</b> them.",
			"type": "Spell"
		},
		{
			"artist": "Romain De Santi",
			"cardImage": "CS2_032.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Choc de flammes",
				"text": "Inflige $4 |4(point,points) de dégâts à tous les serviteurs adverses."
			},
			"id": "CS2_032",
			"name": "Flamestrike",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $4 damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA01_2H_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Pioche forcée !",
				"text": "<b>Pouvoir héroïque</b>\nPlace un serviteur de chaque deck sur le champ de bataille."
			},
			"id": "BRMA01_2H_2_TB",
			"name": "Pile On!!!",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nPut a minion from each deck into the battlefield.",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_SPT_Boss.png",
			"fr": {
				"name": "Hurlevent"
			},
			"health": 1,
			"id": "TB_SPT_Boss",
			"name": "City of Stormwind",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA04_31b.png",
			"cost": 0,
			"fr": {
				"name": "Pas question !",
				"text": "Vous ne faites rien."
			},
			"id": "LOEA04_31b",
			"name": "No Way!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Do nothing.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_FactionWar_Boss_Rag_0.png",
			"cost": 2,
			"fr": {
				"name": "Tapette à mouches",
				"text": "<b>Pouvoir héroïque</b>\nInflige $3 points de dégâts à un adversaire aléatoire. Pour le moment…"
			},
			"id": "TB_FactionWar_Boss_Rag_0",
			"name": "Swat Fly",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nDeal $3 damage to random enemy, for now...",
			"type": "Hero_power"
		},
		{
			"attack": 4,
			"cardImage": "CRED_38.png",
			"cost": 4,
			"fr": {
				"name": "Robin Fredericksen",
				"text": "<b>Cri de guerre :</b> si vous n’avez pas d’autre Eric sur le champ de bataille, renomme cette carte « Eric »."
			},
			"health": 4,
			"id": "CRED_38",
			"name": "Robin Fredericksen",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> If you have no other Erics on the battlefield, rename this card to \"Eric\".",
			"type": "Minion"
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
			"cardImage": "EX1_009e.png",
			"fr": {
				"name": "Enragé",
				"text": "+5 ATQ."
			},
			"id": "EX1_009e",
			"name": "Enraged",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+5 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "John Avon",
			"attack": 3,
			"cardImage": "CS2_033.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Élémentaire d’eau",
				"text": "<b>Gèle</b> tout personnage blessé par ce serviteur."
			},
			"health": 6,
			"id": "CS2_033",
			"name": "Water Elemental",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Freeze</b> any character damaged by this minion.",
			"type": "Minion"
		},
		{
			"artist": "Carl Critchlow",
			"attack": 0,
			"cardImage": "EX1_405.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Porte-bouclier",
				"text": "<b>Provocation</b>"
			},
			"health": 4,
			"id": "EX1_405",
			"name": "Shieldbearer",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "NAX7_03H.png",
			"cost": 1,
			"fr": {
				"name": "Frappe déséquilibrante",
				"text": "<b>Pouvoir héroïque</b>\nInflige 4 points de dégâts."
			},
			"id": "NAX7_03H",
			"name": "Unbalancing Strike",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDeal 4 damage.",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_041.png",
			"cost": 0,
			"fr": {
				"name": "Destroy Hero Power",
				"text": "Destroy a player's Hero Power."
			},
			"id": "XXX_041",
			"name": "Destroy Hero Power",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Destroy a player's Hero Power.",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "TB_KTRAF_7.png",
			"cost": 3,
			"fr": {
				"name": "Heigan l’Impur",
				"text": "À la fin de votre tour, inflige 4 points de dégâts à un adversaire aléatoire."
			},
			"health": 5,
			"id": "TB_KTRAF_7",
			"name": "Heigan the Unclean",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "At the end of your turn, deal 4 damage to a  random enemy.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_25.png",
			"cost": 5,
			"fr": {
				"name": "Dame Naz’jar",
				"text": "À la fin de votre tour, remplace tous les autres serviteurs par de nouveaux de même coût."
			},
			"health": 5,
			"id": "LOEA16_25",
			"name": "Lady Naz'jar",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, replace all other minions with new ones of the same Cost.",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 5,
			"cardImage": "OG_340.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Soggoth le Rampant",
				"text": "<b>Provocation</b>\nNe peut pas être la cible de sorts ou de pouvoirs héroïques."
			},
			"health": 9,
			"id": "OG_340",
			"name": "Soggoth the Slitherer",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Taunt</b>\nCan't be targeted by spells or Hero Powers.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_076a.png",
			"fr": {
				"name": "Pistons",
				"text": "Attaque augmentée."
			},
			"id": "GVG_076a",
			"name": "Pistons",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA09_3H.png",
			"cost": 2,
			"fr": {
				"name": "Ancienne Horde",
				"text": "<b>Pouvoir héroïque</b>\nInvoque deux orcs 2/2 avec <b>Provocation</b>. Change de pouvoir héroïque."
			},
			"id": "BRMA09_3H",
			"name": "Old Horde",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon two 2/2 Orcs with <b>Taunt</b>. Get a new Hero Power.",
			"type": "Hero_power"
		},
		{
			"artist": "Scott Altmann",
			"attack": 0,
			"cardImage": "EX1_575.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Totem de vague de mana",
				"text": "Vous piochez une carte à la fin de votre tour."
			},
			"health": 3,
			"id": "EX1_575",
			"name": "Mana Tide Totem",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "At the end of your turn, draw a card.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"artist": "Phroilan Gardner",
			"cardImage": "CS2_114.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Enchaînement",
				"text": "Inflige $2 |4(point,points) de dégâts à deux serviteurs adverses aléatoires."
			},
			"id": "CS2_114",
			"name": "Cleave",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $2 damage to two random enemy minions.",
			"type": "Spell"
		},
		{
			"artist": "Lorenzo Minaca",
			"cardImage": "EX1_609.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Tir de précision",
				"text": "<b>Secret :</b> une fois que votre adversaire a joué un serviteur, ce dernier subit $4 |4(point,points) de dégâts."
			},
			"id": "EX1_609",
			"name": "Snipe",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Secret:</b> After your opponent plays a minion, deal $4 damage to it.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "BRMA04_3H.png",
			"cost": 0,
			"fr": {
				"name": "Lige du feu",
				"text": "<b>Râle d’agonie :</b> inflige 3 points de dégâts au héros adverse pour chaque lige du feu mort pendant ce tour."
			},
			"health": 5,
			"id": "BRMA04_3H",
			"name": "Firesworn",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Deathrattle:</b> Deal 3 damage to the enemy hero for each Firesworn that died this turn.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA02_05.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : gloire",
				"text": "<b>Découvre</b> un serviteur."
			},
			"id": "LOEA02_05",
			"name": "Wish for Glory",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Discover</b> a minion.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_01h.png",
			"fr": {
				"name": "Fuite du temple"
			},
			"health": 100,
			"id": "LOEA04_01h",
			"name": "Temple Escape",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"attack": 3,
			"cardImage": "NAX8_04.png",
			"cost": 3,
			"fr": {
				"name": "Guerrier tenace",
				"text": "<b>Râle d’agonie :</b> invoque un guerrier spectral pour votre adversaire."
			},
			"health": 4,
			"id": "NAX8_04",
			"name": "Unrelenting Warrior",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Summon a Spectral Warrior for your opponent.",
			"type": "Minion"
		},
		{
			"cardImage": "KAR_003a.png",
			"cost": 0,
			"fr": {
				"name": "Drink the Moonlight",
				"text": "Restore 20 Health."
			},
			"id": "KAR_003a",
			"name": "Drink the Moonlight",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Kara_reserve",
			"text": "Restore 20 Health.",
			"type": "Spell"
		},
		{
			"artist": "Greg Staples",
			"attack": 5,
			"cardImage": "BRM_034.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Corrupteur de l’Aile noire",
				"text": "<b>Cri de guerre :</b> inflige 3 points de dégâts si vous avez un Dragon en main."
			},
			"health": 4,
			"id": "BRM_034",
			"name": "Blackwing Corruptor",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Brm",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, deal 3 damage.",
			"type": "Minion"
		},
		{
			"artist": "Trevor Jacobs",
			"cardImage": "CS2_074.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Poison mortel",
				"text": "Confère +2 ATQ à votre arme."
			},
			"id": "CS2_074",
			"name": "Deadly Poison",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"text": "Give your weapon +2 Attack.",
			"type": "Spell"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 5,
			"cardImage": "OG_028.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Chose venue d’en bas",
				"text": "<b>Provocation</b>\nCoûte (1) |4(cristal,cristaux) de moins pour chaque totem invoqué par vous dans cette partie."
			},
			"health": 5,
			"id": "OG_028",
			"name": "Thing from Below",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Og",
			"text": "[x]<b>Taunt</b>\nCosts (1) less for each\nTotem you've summoned\nthis game.",
			"type": "Minion"
		},
		{
			"artist": "Jerry Mascho",
			"attack": 3,
			"cardImage": "KAR_041.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Rôdeur des douves",
				"text": "<b>Cri de guerre_:</b> détruit un serviteur. <b>Râle d’agonie_:</b> réinvoque ce serviteur."
			},
			"health": 3,
			"id": "KAR_041",
			"name": "Moat Lurker",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Destroy a minion. <b>Deathrattle:</b> Resummon it.",
			"type": "Minion"
		},
		{
			"artist": "Ben Zhang",
			"attack": 7,
			"cardImage": "OG_255.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Implorateur funeste",
				"text": "<b>Cri de guerre :</b> donne +2/+2 à votre C’Thun <i>(où qu’il soit)</i>. S’il est mort, le place dans votre deck."
			},
			"health": 9,
			"id": "OG_255",
			"name": "Doomcaller",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> Give your C'Thun +2/+2 <i>(wherever it is).</i> If it's dead, shuffle it into your deck.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_006e.png",
			"fr": {
				"name": "Puissance de Dalaran",
				"text": "Dégâts des sorts augmentés."
			},
			"id": "AT_006e",
			"name": "Power of Dalaran",
			"playerClass": "Mage",
			"set": "Tgt",
			"text": "Increased Spell Damage.",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_313e.png",
			"fr": {
				"name": "Perturbé",
				"text": "+1/+1."
			},
			"id": "OG_313e",
			"name": "Addled",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX12_02H_2c_TB.png",
			"cost": 1,
			"fr": {
				"name": "Décimer",
				"text": "Fait passer les points de vie des serviteurs adverses à 1."
			},
			"id": "NAX12_02H_2c_TB",
			"name": "Decimate",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Change the Health of enemy minions to 1.",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_92.png",
			"cost": 4,
			"fr": {
				"name": "Coren Navrebière",
				"text": "Gagne toujours à la baston.\n<b>Cri de guerre :</b> ajoute une carte Baston dans votre main."
			},
			"health": 8,
			"id": "BRMC_92",
			"name": "Coren Direbrew",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Always wins Brawls.\n <b>Battlecry:</b> Add a Brawl to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA02_03.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : puissance",
				"text": "<b>Découvre</b> un sort."
			},
			"id": "LOEA02_03",
			"name": "Wish for Power",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Discover</b> a spell.",
			"type": "Spell"
		},
		{
			"artist": "Ben Olson",
			"attack": 4,
			"cardImage": "GVG_109.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mini-mage",
				"text": "<b>Camouflage</b>\n<b>Dégâts des sorts : +1</b>"
			},
			"health": 1,
			"id": "GVG_109",
			"name": "Mini-Mage",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Gvg",
			"spellDamage": 1,
			"text": "<b>Stealth</b>\n<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"cardImage": "OG_118e.png",
			"fr": {
				"name": "Ench. de deck Parjurer les ténèbres"
			},
			"id": "OG_118e",
			"name": "Renounce Darkness Deck Ench",
			"playerClass": "Neutral",
			"set": "Og",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_590e.png",
			"fr": {
				"name": "Ombres de M’uru",
				"text": "Ce serviteur a consumé les Boucliers divins, et ses points d’Attaque et de Vie sont augmentés."
			},
			"id": "EX1_590e",
			"name": "Shadows of M'uru",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "This minion has consumed Divine Shields and has increased Attack and Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_087e.png",
			"fr": {
				"name": "Bénédiction de puissance",
				"text": "+3 ATQ."
			},
			"id": "CS2_087e",
			"name": "Blessing of Might",
			"playerClass": "Paladin",
			"set": "Core",
			"text": "+3 Attack.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"set": "Og",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "CRED_23.png",
			"cost": 4,
			"fr": {
				"name": "Christopher Yim",
				"text": "<b>Cri de guerre :</b> vos emotes sont désormais prononcées avec une voix radiophonique."
			},
			"health": 5,
			"id": "CRED_23",
			"name": "Christopher Yim",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Your emotes are now spoken in \"Radio Voice.\"",
			"type": "Minion"
		},
		{
			"cardImage": "TU4f_004o.png",
			"fr": {
				"name": "Héritage de l’Empereur",
				"text": "A +2/+2. <i>(+2 ATQ / +2 PV)</i>"
			},
			"id": "TU4f_004o",
			"name": "Legacy of the Emperor",
			"playerClass": "Neutral",
			"set": "Missions",
			"text": "Has +2/+2. <i>(+2 Attack/+2 Health)</i>",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_045ee.png",
			"fr": {
				"name": "Ench. de deck de mandebrume"
			},
			"id": "AT_045ee",
			"name": "Mistcaller Deck Ench",
			"playerClass": "Neutral",
			"set": "Tgt",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA09_6.png",
			"cost": 1,
			"fr": {
				"name": "Véritable chef de guerre",
				"text": "Détruit un serviteur légendaire."
			},
			"id": "BRMA09_6",
			"name": "The True Warchief",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Destroy a Legendary minion.",
			"type": "Spell"
		},
		{
			"artist": "J. Meyers & A. Bozonnet",
			"attack": 4,
			"cardImage": "OG_291.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Exhalombre",
				"text": "<b>Cri de guerre :</b> choisit un serviteur allié et en place une copie 1/1 coûtant (1) |4(cristal,cristaux) de mana dans votre main."
			},
			"health": 4,
			"id": "OG_291",
			"name": "Shadowcaster",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Battlecry:</b> Choose a friendly minion. Add a 1/1 copy     to your hand that costs (1).",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "CRED_20.png",
			"cost": 3,
			"fr": {
				"name": "Brian Birmingham",
				"text": "<b>Choix des armes :</b> rend tous ses PV à un Méca ou confère <b>Furie des vents</b> à un concepteur."
			},
			"health": 2,
			"id": "CRED_20",
			"name": "Brian Birmingham",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Choose One</b> - Restore a Mech to full Health; or Give a Designer <b>Windfury.</b>",
			"type": "Minion"
		},
		{
			"artist": "L. Lullabi & N. Thitinunthakorn",
			"cardImage": "KAR_A02_10.png",
			"cost": 3,
			"fr": {
				"name": "C’est ma tournée",
				"text": "Vous piochez une carte pour chacune de vos assiettes."
			},
			"id": "KAR_A02_10",
			"name": "Pour a Round",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Draw a card for each of your Plates.",
			"type": "Spell"
		},
		{
			"cardImage": "TU4f_004.png",
			"cost": 3,
			"fr": {
				"name": "Héritage de l’Empereur",
				"text": "Confère à vos serviteurs +2/+2. <i>(+2 ATQ / +2 PV)</i>"
			},
			"id": "TU4f_004",
			"name": "Legacy of the Emperor",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "Give your minions +2/+2. <i>(+2 Attack/+2 Health)</i>",
			"type": "Spell"
		},
		{
			"cardImage": "AT_081e.png",
			"fr": {
				"name": "Purifié",
				"text": "L’Attaque est passée à 1."
			},
			"id": "AT_081e",
			"name": "Purified",
			"playerClass": "Paladin",
			"set": "Tgt",
			"text": "Attack changed to 1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_6.png",
			"cost": 0,
			"fr": {
				"name": "Destin : portails",
				"text": "Place 10 cartes Portail instable dans le deck de chaque joueur."
			},
			"id": "TB_PickYourFate_6",
			"name": "Fate: Portals",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Shuffle 10 Unstable Portals into each player's deck.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "CS2_tk1.png",
			"cost": 1,
			"fr": {
				"name": "Mouton"
			},
			"health": 1,
			"id": "CS2_tk1",
			"name": "Sheep",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"artist": "Michael Phillippi",
			"attack": 6,
			"cardImage": "GVG_105.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Golem céleste piloté",
				"text": "<b>Râle d’agonie :</b> invoque un serviteur aléatoire coûtant 4 cristaux."
			},
			"health": 4,
			"id": "GVG_105",
			"name": "Piloted Sky Golem",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "<b>Deathrattle:</b> Summon a random 4-Cost minion.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "EX1_564.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Manipulateur sans-visage",
				"text": "<b>Cri de guerre :</b> choisit un serviteur et en devient la copie conforme."
			},
			"health": 3,
			"id": "EX1_564",
			"name": "Faceless Manipulator",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Choose a minion and become a copy of it.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_10.png",
			"cost": 1,
			"fr": {
				"name": "Mutation",
				"text": "<b>Pouvoir héroïque</b>\nVous défausse d’une carte aléatoire."
			},
			"id": "BRMA12_10",
			"name": "Mutation",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nDiscard a random card.",
			"type": "Hero_power"
		},
		{
			"attack": 0,
			"cardImage": "BRMA10_4.png",
			"cost": 1,
			"fr": {
				"name": "Œuf corrompu",
				"text": "Éclot quand il a 4 PV ou plus."
			},
			"health": 1,
			"id": "BRMA10_4",
			"name": "Corrupted Egg",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "When this minion has 4 or more Health, it hatches.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_05_01e.png",
			"fr": {
				"name": "Peur du loup",
				"text": "Passe à 1/1."
			},
			"id": "KARA_05_01e",
			"name": "Trembling Before the Wolf",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Shrunk to a 1/1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "KARA_07_01heroic.png",
			"fr": {
				"name": "Conservateur"
			},
			"health": 40,
			"id": "KARA_07_01heroic",
			"name": "Curator",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "CS1_129e.png",
			"fr": {
				"name": "Feu intérieur",
				"text": "L’Attaque de ce serviteur est égale à ses PV."
			},
			"id": "CS1_129e",
			"name": "Inner Fire",
			"playerClass": "Priest",
			"set": "Expert1",
			"text": "This minion's Attack is equal to its Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Matthew O'Connor",
			"cardImage": "OG_073.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Thé de chardon",
				"text": "Vous piochez une carte. En place 2 copies supplémentaires dans votre main."
			},
			"id": "OG_073",
			"name": "Thistle Tea",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Og",
			"text": "Draw a card. Add 2 extra copies of it to your hand.",
			"type": "Spell"
		},
		{
			"artist": "George Davis",
			"attack": 2,
			"cardImage": "LOE_023.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Sinistre colporteur",
				"text": "<b>Cri de guerre : découvre</b> une carte à 1 cristal de mana."
			},
			"health": 2,
			"id": "LOE_023",
			"name": "Dark Peddler",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Battlecry: Discover</b> a\n1-Cost card.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_13_12H.png",
			"cost": 3,
			"fr": {
				"name": "Présence démoniaque",
				"text": "Vous piochez 3_cartes.\nGagne 10_points d’armure."
			},
			"id": "KARA_13_12H",
			"name": "Demonic Presence",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Draw 3 cards.\nGain 10 Armor.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "NAX13_01H.png",
			"fr": {
				"name": "Thaddius"
			},
			"health": 45,
			"id": "NAX13_01H",
			"name": "Thaddius",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Ben Wootten",
			"attack": 3,
			"cardImage": "AT_099.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Chevaucheuse de kodo",
				"text": "<b>Exaltation : </b> invoque un kodo de guerre 3/5."
			},
			"health": 5,
			"id": "AT_099",
			"name": "Kodorider",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Summon a 3/5 War Kodo.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_10.png",
			"cost": 2,
			"fr": {
				"name": "Michael Schweitzer",
				"text": "<b>C-C-C-COMBO :</b> détruit un serviteur."
			},
			"health": 2,
			"id": "CRED_10",
			"name": "Michael Schweitzer",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>C-C-C-COMBO:</b> Destroy a minion.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_001.png",
			"cost": 0,
			"fr": {
				"name": "Damage 1",
				"text": "Deal 1 damage."
			},
			"id": "XXX_001",
			"name": "Damage 1",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Deal 1 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "LOE_073e.png",
			"fr": {
				"name": "Fossilisé",
				"text": "A <b>Provocation</b>."
			},
			"id": "LOE_073e",
			"name": "Fossilized",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Has <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA02_02.png",
			"cost": 0,
			"fr": {
				"name": "Intuition de djinn",
				"text": "Vous piochez une carte.\nAccorde un Vœu à votre adversaire."
			},
			"id": "LOEA02_02",
			"name": "Djinn’s Intuition",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Draw a card.\nGive your opponent a Wish.",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_258e.png",
			"fr": {
				"name": "Surcharge",
				"text": "Caractéristiques augmentées."
			},
			"id": "EX1_258e",
			"name": "Overloading",
			"playerClass": "Shaman",
			"set": "Expert1",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "FP1_006.png",
			"cost": 1,
			"fr": {
				"name": "Destrier de la mort",
				"text": "<b>Charge. Râle d’agonie :</b> inflige 3 points de dégâts à votre héros."
			},
			"health": 3,
			"id": "FP1_006",
			"name": "Deathcharger",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Charge. Deathrattle:</b> Deal 3 damage to your hero.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "BRMA04_3.png",
			"cost": 0,
			"fr": {
				"name": "Lige du feu",
				"text": "<b>Râle d’agonie :</b> inflige 1 point de dégâts au héros adverse pour chaque lige du feu mort pendant ce tour."
			},
			"health": 5,
			"id": "BRMA04_3",
			"name": "Firesworn",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Deathrattle:</b> Deal 1 damage to the enemy hero for each Firesworn that died this turn.",
			"type": "Minion"
		},
		{
			"artist": "Peerasak Senalai",
			"cardImage": "PART_003.png",
			"cost": 1,
			"fr": {
				"name": "Klaxon rouillé",
				"text": "Confère <b>Provocation</b> à un serviteur."
			},
			"id": "PART_003",
			"name": "Rusty Horn",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Give a minion <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"attack": 3,
			"cardImage": "KAR_005a.png",
			"cost": 2,
			"fr": {
				"name": "Grand Méchant Loup"
			},
			"health": 2,
			"id": "KAR_005a",
			"name": "Big Bad Wolf",
			"playerClass": "Hunter",
			"set": "Kara",
			"type": "Minion"
		},
		{
			"cardImage": "AT_041e.png",
			"fr": {
				"name": "Appel des étendues sauvages",
				"text": "Coût réduit."
			},
			"id": "AT_041e",
			"name": "Call of the Wild",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "Cost reduced.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_KTRAF_104.png",
			"cost": 2,
			"fr": {
				"name": "Découvrir un morceau du bâton",
				"text": "Amplifie votre pouvoir héroïque."
			},
			"id": "TB_KTRAF_104",
			"name": "Uncover Staff Piece",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Add another piece to your Hero Power.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA15_2.png",
			"cost": 2,
			"fr": {
				"name": "Portail instable",
				"text": "<b>Pouvoir héroïque</b>\nAjoute un serviteur aléatoire dans votre main. Il coûte (3) |4(cristal,cristaux) de moins."
			},
			"id": "LOEA15_2",
			"name": "Unstable Portal",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\nAdd a random minion to your hand. It costs (3) less.",
			"type": "Hero_power"
		},
		{
			"attack": 5,
			"cardImage": "TB_Coopv3_101.png",
			"cost": 5,
			"fr": {
				"name": "Furtif insoumis",
				"text": "À la fin de votre tour, change de camp."
			},
			"health": 6,
			"id": "TB_Coopv3_101",
			"name": "Freewheeling Skulker",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "At the end of your turn, switch sides.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA05_1.png",
			"fr": {
				"name": "Baron Geddon"
			},
			"health": 30,
			"id": "BRMA05_1",
			"name": "Baron Geddon",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "GVG_084.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Machine volante",
				"text": "<b>Furie des vents</b>"
			},
			"health": 4,
			"id": "GVG_084",
			"name": "Flying Machine",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Windfury</b>",
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
				"name": "Bombardier fou",
				"text": "<b>Cri de guerre :</b> inflige 3 points de dégâts répartis de façon aléatoire entre tous les autres personnages."
			},
			"health": 2,
			"id": "EX1_082",
			"name": "Mad Bomber",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Deal 3 damage randomly split between all other characters.",
			"type": "Minion"
		},
		{
			"artist": "Rafael Zanchetin",
			"attack": 3,
			"cardImage": "OG_109.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Archiviste de Sombre-Comté",
				"text": "<b>Cri de guerre :</b> vous défausse d’une carte aléatoire. <b>Râle d’agonie :</b> vous piochez une carte."
			},
			"health": 2,
			"id": "OG_109",
			"name": "Darkshire Librarian",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b>\nDiscard a random card. <b>Deathrattle:</b>\nDraw a card.",
			"type": "Minion"
		},
		{
			"artist": "Blizzard Entertainment",
			"attack": 0,
			"cardImage": "EX1_341.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Puits de lumière",
				"text": "Au début de votre tour, rend 3 PV à un personnage allié blessé."
			},
			"health": 5,
			"id": "EX1_341",
			"name": "Lightwell",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "At the start of your turn, restore 3 Health to a damaged friendly character.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_Pilot1.png",
			"fr": {
				"name": "Pilote mystère",
				"text": "Qui ça peut bien être ?"
			},
			"id": "TB_Pilot1",
			"name": "Mystery Pilot",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Who could it be?!",
			"type": "Enchantment"
		},
		{
			"cardImage": "KARA_07_05heroic.png",
			"cost": 2,
			"fr": {
				"name": "Bête déchaînée !",
				"text": "Invoque une Bête aléatoire."
			},
			"id": "KARA_07_05heroic",
			"name": "Stampeding Beast!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon a random Beast.",
			"type": "Spell"
		},
		{
			"artist": "Kan Liu",
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
			"artist": "Zoltan & Gabor",
			"cardImage": "CS2_089.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Lumière sacrée",
				"text": "Rend #6 |4(point,points) de vie."
			},
			"id": "CS2_089",
			"name": "Holy Light",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Core",
			"text": "Restore #6 Health.",
			"type": "Spell"
		},
		{
			"artist": "J. Meyers & Nutchapol ",
			"attack": 3,
			"cardImage": "OG_026.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Sentinelle éternelle",
				"text": "<b>Cri de guerre :</b> débloque vos cristaux de mana en <b>Surcharge</b>."
			},
			"health": 2,
			"id": "OG_026",
			"name": "Eternal Sentinel",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Battlecry:</b> Unlock your <b>Overloaded</b> Mana Crystals.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA02_01.png",
			"fr": {
				"name": "Zinaar"
			},
			"health": 30,
			"id": "LOEA02_01",
			"name": "Zinaar",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Sean O'Daniels",
			"cardImage": "GVG_003.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Portail instable",
				"text": "Place un serviteur aléatoire dans votre main. Il coûte (3) cristaux de moins."
			},
			"id": "GVG_003",
			"name": "Unstable Portal",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Add a random minion to your hand. It costs (3) less.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_SPT_Minion2e.png",
			"fr": {
				"name": "Encouragé",
				"text": "Le porte-étendard confère +2 ATQ à ce serviteur."
			},
			"id": "TB_SPT_Minion2e",
			"name": "Emboldened",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Standard Bearer is granting +2 Attack to this minion.",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_062.png",
			"cost": 0,
			"fr": {
				"name": "Armor 5",
				"text": "Give target Hero +5 Armor"
			},
			"id": "XXX_062",
			"name": "Armor 5",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Give target Hero +5 Armor",
			"type": "Spell"
		},
		{
			"artist": "Greg Staples",
			"attack": 8,
			"cardImage": "AT_120.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Géant du givre",
				"text": "Coûte (1) |4(cristal,cristaux) de moins chaque fois que vous utilisez votre pouvoir héroïque pendant cette partie."
			},
			"health": 8,
			"id": "AT_120",
			"name": "Frost Giant",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Costs (1) less for each time you used your Hero Power this game.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "OG_239.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "MALÉDICTION !",
				"text": "Détruit tous les serviteurs. Pioche une carte pour chaque serviteur détruit."
			},
			"id": "OG_239",
			"name": "DOOM!",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Og",
			"text": "Destroy all minions. Draw a card for each.",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"attack": 4,
			"cardImage": "GVG_096.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Déchiqueteur piloté",
				"text": "<b>Râle d’agonie :</b> invoque un serviteur aléatoire coûtant 2 cristaux."
			},
			"health": 3,
			"id": "GVG_096",
			"name": "Piloted Shredder",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Deathrattle:</b> Summon a random 2-Cost minion.",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_018e.png",
			"fr": {
				"name": "Libéré !",
				"text": "Votre prochain Dragon coûte (2) cristaux de moins."
			},
			"id": "BRM_018e",
			"name": "Unchained!",
			"playerClass": "Paladin",
			"set": "Brm",
			"text": "Your next Dragon costs (2) less.",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_105e.png",
			"fr": {
				"name": "Frappe héroïque",
				"text": "+4 ATQ pendant ce tour."
			},
			"id": "CS2_105e",
			"name": "Heroic Strike",
			"playerClass": "Warrior",
			"set": "Core",
			"text": "+4 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Tim McBurnie",
			"attack": 3,
			"cardImage": "EX1_507.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chef de guerre murloc",
				"text": "TOUS les autres murlocs ont +2/+1."
			},
			"health": 3,
			"id": "EX1_507",
			"name": "Murloc Warleader",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "ALL other Murlocs have +2/+1.",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 8,
			"cardImage": "EX1_560.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Nozdormu",
				"text": "Les joueurs n’ont que 15 secondes pour jouer leur tour."
			},
			"health": 8,
			"id": "EX1_560",
			"name": "Nozdormu",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "Players only have 15 seconds to take their turns.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "CRED_02.png",
			"cost": 6,
			"fr": {
				"name": "Eric Dodds",
				"text": "<b>Cri de guerre :</b> invoque un pirate 2/2 et détruit tous les ninjas."
			},
			"health": 5,
			"id": "CRED_02",
			"name": "Eric Dodds",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Summon a 2/2 Pirate and destroy all Ninjas.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_12.png",
			"cost": 0,
			"fr": {
				"name": "Destin : confusion",
				"text": "À la fin de chaque tour, échange l’Attaque et la Vie de tous les serviteurs."
			},
			"id": "TB_PickYourFate_12",
			"name": "Fate: Confusion",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "At the end of each turn, swap all minions' Attack and Health.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA05_02a.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester serviteurs !",
				"text": "<b>Pouvoir héroïque passif</b> Les serviteurs adverses coûtent (2) |4(cristal,cristaux) de plus. Le pouvoir change au début de votre tour."
			},
			"id": "LOEA05_02a",
			"name": "Trogg Hate Minions!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\n Enemy minions cost (2) more. Swap at the start of your turn.",
			"type": "Hero_power"
		},
		{
			"cardImage": "XXX_002.png",
			"cost": 0,
			"fr": {
				"name": "Damage 5",
				"text": "Deal 5 damage."
			},
			"id": "XXX_002",
			"name": "Damage 5",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Deal 5 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX7_05.png",
			"cost": 1,
			"fr": {
				"name": "Cristal de contrôle mental",
				"text": "Active le cristal pour prendre le contrôle des doublures !"
			},
			"id": "NAX7_05",
			"name": "Mind Control Crystal",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Activate the Crystal to control the Understudies!",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "EX1_028.png",
			"collectible": true,
			"cost": 5,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Tigre de Strangleronce",
				"text": "<b>Camouflage</b>"
			},
			"health": 5,
			"id": "EX1_028",
			"name": "Stranglethorn Tiger",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 7,
			"cardImage": "BRM_009.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Lourdaud volcanique",
				"text": "<b>Provocation</b>.\n Coûte (1) |4(cristal,cristaux) de moins pour chaque serviteur mort pendant ce tour."
			},
			"health": 8,
			"id": "BRM_009",
			"name": "Volcanic Lumberer",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Brm",
			"text": "<b>Taunt</b>\nCosts (1) less for each minion that died this turn.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_20H.png",
			"fr": {
				"name": "Bénédiction du soleil",
				"text": "<b>Insensible</b>."
			},
			"id": "LOEA16_20H",
			"name": "Blessing of the Sun",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Immune</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Daria Tuzova",
			"attack": 2,
			"cardImage": "KAR_300.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Corbeau enchanté"
			},
			"health": 2,
			"id": "KAR_300",
			"name": "Enchanted Raven",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Kara",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_042.png",
			"cost": 0,
			"fr": {
				"name": "Hand to Deck",
				"text": "Shuffle a player's hand into his deck."
			},
			"id": "XXX_042",
			"name": "Hand to Deck",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Shuffle a player's hand into his deck.",
			"type": "Spell"
		},
		{
			"attack": 6,
			"cardImage": "BRMC_90.png",
			"cost": 2,
			"fr": {
				"name": "Lave vivante",
				"text": "<b>Provocation</b>"
			},
			"health": 6,
			"id": "BRMC_90",
			"name": "Living Lava",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_017.png",
			"cost": 2,
			"fr": {
				"name": "Changeforme",
				"text": "<b>Pouvoir héroïque</b>\n+1 ATQ pendant ce tour.    +1 Armure."
			},
			"id": "CS2_017",
			"name": "Shapeshift",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Hero Power</b>\n+1 Attack this turn.    +1 Armor.",
			"type": "Hero_power"
		},
		{
			"artist": "Evgeniy Zagumennyy",
			"cardImage": "OG_114.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Rituel interdit",
				"text": "Dépense tous vos cristaux de mana. Invoque un nombre équivalent de tentacules 1/1."
			},
			"id": "OG_114",
			"name": "Forbidden Ritual",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Og",
			"text": "Spend all your Mana. Summon that many 1/1 Tentacles.",
			"type": "Spell"
		},
		{
			"artist": "Wei Wang",
			"cardImage": "NEW1_031.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Compagnon animal",
				"text": "Invoque un compagnon animal aléatoire."
			},
			"id": "NEW1_031",
			"name": "Animal Companion",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"text": "Summon a random Beast Companion.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_MechWar_Boss2.png",
			"fr": {
				"name": "Ro’Boum"
			},
			"health": 30,
			"id": "TB_MechWar_Boss2",
			"name": "Boom Bot",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Tb",
			"type": "Hero"
		},
		{
			"cardImage": "DREAM_02.png",
			"cost": 2,
			"fr": {
				"name": "Réveil d’Ysera",
				"text": "Inflige $5 |4(point,points) de dégâts à tous les personnages sauf Ysera."
			},
			"id": "DREAM_02",
			"name": "Ysera Awakens",
			"playerClass": "Dream",
			"set": "Expert1",
			"text": "Deal $5 damage to all characters except Ysera.",
			"type": "Spell"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_384.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Courroux vengeur",
				"text": "Inflige $8 |4(point,points) de dégâts répartis de façon aléatoire entre tous les adversaires."
			},
			"id": "EX1_384",
			"name": "Avenging Wrath",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Deal $8 damage randomly split among all enemies.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_3_Ench.png",
			"fr": {
				"name": "Pick Your Fate 3 Ench"
			},
			"id": "TB_PickYourFate_3_Ench",
			"name": "Pick Your Fate 3 Ench",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "DS1h_292.png",
			"cost": 2,
			"fr": {
				"name": "Tir assuré",
				"text": "<b>Pouvoir héroïque</b>\nInflige $2 points de dégâts au héros adverse."
			},
			"id": "DS1h_292",
			"name": "Steady Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Hero Power</b>\nDeal $2 damage to the enemy hero.",
			"type": "Hero_power"
		},
		{
			"attack": 0,
			"cardImage": "CS2_052.png",
			"cost": 1,
			"fr": {
				"name": "Totem de courroux de l’air",
				"text": "<b>Dégâts des sorts : +1</b>"
			},
			"health": 2,
			"id": "CS2_052",
			"name": "Wrath of Air Totem",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"spellDamage": 1,
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"cardImage": "FP1_030e.png",
			"fr": {
				"name": "Aura nécrotique",
				"text": "Vos sorts coûtent (5) cristaux de plus au prochain tour."
			},
			"id": "FP1_030e",
			"name": "Necrotic Aura",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Your spells cost (5) more this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 2,
			"cardImage": "GVG_095.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Sapeur gobelin",
				"text": "A +4 ATQ tant que votre adversaire a 6 cartes ou plus dans sa main."
			},
			"health": 4,
			"id": "GVG_095",
			"name": "Goblin Sapper",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Has +4 Attack while your opponent has 6 or more cards in hand.",
			"type": "Minion"
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
			"cardImage": "NAX9_06.png",
			"cost": 5,
			"fr": {
				"name": "Ombre impie",
				"text": "<b>Pouvoir héroïque</b>\nPioche deux cartes."
			},
			"id": "NAX9_06",
			"name": "Unholy Shadow",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDraw 2 cards.",
			"type": "Hero_power"
		},
		{
			"cardImage": "OG_339e.png",
			"fr": {
				"name": "Soumission du vassal",
				"text": "+2/+2."
			},
			"id": "OG_339e",
			"name": "Vassal's Subservience",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+2/+2.",
			"type": "Enchantment"
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
			"artist": "Arthur Gimaldinov",
			"attack": 3,
			"cardImage": "KAR_204.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Fou en onyx",
				"text": "<b>Cri de guerre_:</b> invoque un serviteur aléatoire mort pendant cette partie."
			},
			"health": 4,
			"id": "KAR_204",
			"name": "Onyx Bishop",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Summon a friendly minion that died this game.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_132_SHAMAN.png",
			"cost": 2,
			"fr": {
				"name": "Heurt totémique",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un totem de votre choix."
			},
			"id": "AT_132_SHAMAN",
			"name": "Totemic Slam",
			"playerClass": "Shaman",
			"set": "Tgt",
			"text": "<b>Hero Power</b>\nSummon a Totem of your choice.",
			"type": "Hero_power"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "CS2_105.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Frappe héroïque",
				"text": "Confère +4 ATQ à votre héros pendant ce tour."
			},
			"id": "CS2_105",
			"name": "Heroic Strike",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"text": "Give your hero +4 Attack this turn.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "NAX9_04.png",
			"cost": 3,
			"fr": {
				"name": "Sire Zeliek",
				"text": "Votre héros est <b>Insensible</b>."
			},
			"health": 7,
			"id": "NAX9_04",
			"name": "Sir Zeliek",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "Your hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "KARA_13_03.png",
			"cost": 2,
			"fr": {
				"name": "Guerrière orque"
			},
			"health": 2,
			"id": "KARA_13_03",
			"name": "Orc Warrior",
			"playerClass": "Warrior",
			"set": "Kara",
			"type": "Minion"
		},
		{
			"artist": "Brandon Kitkouski",
			"attack": 3,
			"cardImage": "AT_010.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Dompteur de béliers",
				"text": "<b>Cri de guerre :</b> si vous avez une Bête, invoque une Bête aléatoire."
			},
			"health": 3,
			"id": "AT_010",
			"name": "Ram Wrangler",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> If you have a Beast, summon a\nrandom Beast.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX12_02H.png",
			"cost": 0,
			"fr": {
				"name": "Décimer",
				"text": "<b>Pouvoir héroïque</b>\nFait passer les points de vie des serviteurs adverses à 1."
			},
			"id": "NAX12_02H",
			"name": "Decimate",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nChange the Health of enemy minions to 1.",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA06_1.png",
			"fr": {
				"name": "Chambellan Executus"
			},
			"health": 30,
			"id": "BRMA06_1",
			"name": "Majordomo Executus",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "TB_BlingBrawl_Hero1e.png",
			"fr": {
				"name": "Affûtée",
				"text": "+1 ATQ."
			},
			"id": "TB_BlingBrawl_Hero1e",
			"name": "Sharpened",
			"playerClass": "Rogue",
			"set": "Tb",
			"text": "+1 Attack",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "CRED_46.png",
			"cost": 2,
			"fr": {
				"name": "Keith Landes",
				"text": "Au début de votre tour, la faim inflige 2 points de dégâts à votre héros."
			},
			"health": 6,
			"id": "CRED_46",
			"name": "Keith Landes",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "At the start of your turn, get -2 Health due to hunger.",
			"type": "Minion"
		},
		{
			"artist": "Steve Ellis",
			"cardImage": "CS2_024.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Éclair de givre",
				"text": "Inflige $3 |4(point,points) de dégâts à un personnage et le <b>gèle</b>."
			},
			"id": "CS2_024",
			"name": "Frostbolt",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $3 damage to a character and <b>Freeze</b> it.",
			"type": "Spell"
		},
		{
			"attack": 7,
			"cardImage": "CRED_33.png",
			"cost": 6,
			"fr": {
				"name": "Jomaro Kindred",
				"text": "<b>Cri de guerre :</b> PREND n’importe quelle carte de la main de votre adversaire dont il ne veut pas."
			},
			"health": 6,
			"id": "CRED_33",
			"name": "Jomaro Kindred",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> TAKE any cards from your opponent's hand that they don't want.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 0,
			"cardImage": "GVG_093.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Cible leurre",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "GVG_093",
			"name": "Target Dummy",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "OG_080b.png",
			"cost": 1,
			"fr": {
				"name": "Toxine de sang-royal",
				"text": "Vous piochez une carte."
			},
			"id": "OG_080b",
			"name": "Kingsblood Toxin",
			"playerClass": "Rogue",
			"set": "Og",
			"text": "Draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "NEW1_007a.png",
			"cost": 0,
			"fr": {
				"name": "Météores",
				"text": "Inflige $2 |4(point,points) de dégâts à tous les serviteurs adverses."
			},
			"id": "NEW1_007a",
			"name": "Starfall",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Deal $2 damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX12_03e.png",
			"fr": {
				"name": "Double rangée de dents",
				"text": "Attaque augmentée."
			},
			"id": "NAX12_03e",
			"name": "Extra Teeth",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "EX1_345t.png",
			"cost": 0,
			"fr": {
				"name": "Ombre du néant",
				"text": "Comment ça « Votre adversaire n’a plus de serviteurs » ?"
			},
			"health": 1,
			"id": "EX1_345t",
			"name": "Shadow of Nothing",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Mindgames whiffed! Your opponent had no minions!",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA10_1H.png",
			"fr": {
				"name": "Aileron-Géant"
			},
			"health": 30,
			"id": "LOEA10_1H",
			"name": "Giantfin",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "E. M. Gist",
			"attack": 7,
			"cardImage": "OG_024.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Sans-visage nimbé de flammes",
				"text": "<b>Surcharge :</b> (2)"
			},
			"health": 7,
			"id": "OG_024",
			"name": "Flamewreathed Faceless",
			"overload": 2,
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Overload:</b> (2)",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_00_03c.png",
			"fr": {
				"name": "Medivh"
			},
			"health": 0,
			"id": "KARA_00_03c",
			"name": "Medivh",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA09_3.png",
			"cost": 0,
			"fr": {
				"name": "Faim",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un naga affamé."
			},
			"id": "LOEA09_3",
			"name": "Getting Hungry",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\nSummon a Hungry Naga.",
			"type": "Hero_power"
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
			"cardImage": "BRMC_95h.png",
			"cost": 3,
			"fr": {
				"name": "Chiots du magma",
				"text": "Invoque deux chiots du magma 2/4."
			},
			"id": "BRMC_95h",
			"name": "Core Hound Puppies",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Summon two 2/4 Core Hound Pups.",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "EX1_tk9.png",
			"cost": 2,
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
			"artist": "Jim Nelson",
			"cardImage": "CS2_027.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Image miroir",
				"text": "Invoque deux serviteurs 0/2 avec <b>Provocation</b>."
			},
			"id": "CS2_027",
			"name": "Mirror Image",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Core",
			"text": "Summon two 0/2 minions with <b>Taunt</b>.",
			"type": "Spell"
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
			"artist": "Alexander Alexandrov",
			"attack": 3,
			"cardImage": "EX1_304.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Terreur du Vide",
				"text": "<b>Cri de guerre :</b> détruit les serviteurs adjacents et gagne leurs points d’Attaque et de Vie."
			},
			"health": 3,
			"id": "EX1_304",
			"name": "Void Terror",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Destroy the minions on either side of this minion and gain their Attack and Health.",
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
				"name": "Défenseur du roi",
				"text": "<b>Cri de guerre :</b> gagne\n+1 Durabilité si vous avez un serviteur avec <b>Provocation</b>."
			},
			"id": "AT_065",
			"name": "King's Defender",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> If you have a minion with <b>Taunt</b>,  gain +1 Durability.",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX10_01H.png",
			"fr": {
				"name": "Le Recousu"
			},
			"health": 45,
			"id": "NAX10_01H",
			"name": "Patchwerk",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA09_3H.png",
			"cost": 0,
			"fr": {
				"name": "Faim sans fin",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un naga affamé."
			},
			"id": "LOEA09_3H",
			"name": "Endless Hunger",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\nSummon a Hungry Naga.",
			"type": "Hero_power"
		},
		{
			"artist": "Matt Cavotta",
			"attack": 5,
			"cardImage": "CS2_187.png",
			"collectible": true,
			"cost": 5,
			"faction": "HORDE",
			"fr": {
				"name": "Garde de Baie-du-Butin",
				"text": "<b>Provocation</b>"
			},
			"health": 4,
			"id": "CS2_187",
			"name": "Booty Bay Bodyguard",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NAX14_03.png",
			"cost": 5,
			"fr": {
				"name": "Champion gelé",
				"text": "Gelé pour toute la partie. Les serviteurs adjacents sont immunisés contre Souffle de givre."
			},
			"health": 10,
			"id": "NAX14_03",
			"name": "Frozen Champion",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Permanently Frozen.  Adjacent minions are Immune to Frost Breath.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 7,
			"cardImage": "AT_009.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Rhonin",
				"text": "<b>Râle d’agonie :</b> ajoute\n3 copies de Projectiles des Arcanes dans votre main."
			},
			"health": 7,
			"id": "AT_009",
			"name": "Rhonin",
			"playerClass": "Mage",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Deathrattle:</b> Add 3 copies of Arcane Missiles to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA08_01h.png",
			"fr": {
				"name": "Archaedas"
			},
			"health": 30,
			"id": "LOEA08_01h",
			"name": "Archaedas",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"artist": "Ron Spears",
			"attack": 3,
			"cardImage": "AT_111.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Vendeur de rafraîchissements",
				"text": "<b>Cri de guerre :</b> rend 4 PV à chaque héros."
			},
			"health": 5,
			"id": "AT_111",
			"name": "Refreshment Vendor",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Restore 4 Health to each hero.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA01_2H.png",
			"cost": 0,
			"fr": {
				"name": "Jeu forcé !",
				"text": "<b>Pouvoir héroïque</b>\nPlace deux serviteurs de votre deck et un de votre adversaire sur le champ de bataille."
			},
			"id": "BRMA01_2H",
			"name": "Pile On!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nPut two minions from your deck and one from your opponent's into the battlefield.",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOE_018e.png",
			"fr": {
				"name": "Trogg pas stupide",
				"text": "Attaque augmentée."
			},
			"id": "LOE_018e",
			"name": "Trogg No Stupid",
			"playerClass": "Shaman",
			"set": "Loe",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "NAX12_03.png",
			"cost": 1,
			"durability": 5,
			"fr": {
				"name": "Mâchoires",
				"text": "Gagne +2 ATQ chaque fois qu’un serviteur avec <b>Râle d’agonie</b> meurt."
			},
			"id": "NAX12_03",
			"name": "Jaws",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Whenever a minion with <b>Deathrattle</b> dies, gain +2 Attack.",
			"type": "Weapon"
		},
		{
			"cardImage": "OG_320e.png",
			"fr": {
				"name": "Heure de la corruption",
				"text": "Attaque augmentée."
			},
			"id": "OG_320e",
			"name": "Hour of Corruption",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "GVG_001.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Canon lance-flammes",
				"text": "Inflige $4 |4(point,points) de dégâts à un serviteur adverse aléatoire."
			},
			"id": "GVG_001",
			"name": "Flamecannon",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Deal $4 damage to a random enemy minion.",
			"type": "Spell"
		},
		{
			"cardImage": "NEW1_037e.png",
			"fr": {
				"name": "Équipé",
				"text": "Attaque augmentée."
			},
			"id": "NEW1_037e",
			"name": "Equipped",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 2,
			"cardImage": "EX1_010.png",
			"collectible": true,
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Infiltrateur worgen",
				"text": "<b>Camouflage</b>"
			},
			"health": 1,
			"id": "EX1_010",
			"name": "Worgen Infiltrator",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_12_Ench.png",
			"fr": {
				"name": "Destin 12 : enchantement, Confusion"
			},
			"id": "TB_PickYourFate_12_Ench",
			"name": "Fate 12 Ench, Confuse",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Brian Despain",
			"attack": 3,
			"cardImage": "CS2_179.png",
			"collectible": true,
			"cost": 4,
			"faction": "HORDE",
			"fr": {
				"name": "Maître-bouclier de Sen’jin",
				"text": "<b>Provocation</b>"
			},
			"health": 5,
			"id": "CS2_179",
			"name": "Sen'jin Shieldmasta",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_536e.png",
			"fr": {
				"name": "Amélioration",
				"text": "Durabilité augmentée."
			},
			"id": "EX1_536e",
			"name": "Upgraded",
			"playerClass": "Hunter",
			"set": "Expert1",
			"text": "Increased Durability.",
			"type": "Enchantment"
		},
		{
			"artist": "Warren Mahy",
			"cardImage": "GVG_038.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Crépitement",
				"text": "Inflige $3 à $6 points de dégâts. <b>Surcharge :</b> (1)"
			},
			"id": "GVG_038",
			"name": "Crackle",
			"overload": 1,
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Deal $3-$6 damage. <b>Overload:</b> (1)",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "TB_Coopv3_103.png",
			"cost": 5,
			"fr": {
				"name": "Traqueuse de dragon intrépide",
				"text": "Chaque fois qu’un joueur pioche une carte, gagne +1/+1."
			},
			"health": 3,
			"id": "TB_Coopv3_103",
			"name": "Intrepid Dragonstalker",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Whenever ANY player plays a card, gain +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Chris Rahn",
			"attack": 5,
			"cardImage": "AT_018.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Confesseur d’argent Paletress",
				"text": "<b>Exaltation :</b> invoque un serviteur <b>légendaire</b> aléatoire."
			},
			"health": 4,
			"id": "AT_018",
			"name": "Confessor Paletress",
			"playerClass": "Priest",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Summon a random <b>Legendary</b> minion.",
			"type": "Minion"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "LOE_115b.png",
			"cost": 0,
			"fr": {
				"name": "Idole corbeau",
				"text": "<b>Découvre</b> un sort."
			},
			"id": "LOE_115b",
			"name": "Raven Idol",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Discover</b> a spell.",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "KAR_A02_04H.png",
			"cost": 3,
			"fr": {
				"name": "Couteau",
				"text": "Les assiettes ont <b>Provocation</b>."
			},
			"health": 5,
			"id": "KAR_A02_04H",
			"name": "Knife",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Plates have <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "CS2_041.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Guérison ancestrale",
				"text": "Rend tous ses points de vie à un serviteur et lui confère <b>Provocation</b>."
			},
			"id": "CS2_041",
			"name": "Ancestral Healing",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"text": "Restore a minion to full Health and give it <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_SPT_BossHeroPower.png",
			"cost": 2,
			"fr": {
				"name": "Caserne",
				"text": "<b>Pouvoir héroïque</b>\nJoue un soldat de Hurlevent aléatoire."
			},
			"id": "TB_SPT_BossHeroPower",
			"name": "Barracks",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nPlay a random Stormwind Soldier.",
			"type": "Hero_power"
		},
		{
			"cardImage": "TB_PickYourFate_6_2nd.png",
			"cost": 0,
			"fr": {
				"name": "Destin cruel : portails instables",
				"text": "Place 3 cartes Portail instable dans la main de chaque joueur."
			},
			"id": "TB_PickYourFate_6_2nd",
			"name": "Dire Fate: Unstable Portals",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Place 3 Unstable Portals in each player's hand.",
			"type": "Spell"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "NEW1_007.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Météores",
				"text": "<b>Choix des armes :</b> inflige $5 |4(point,points) de dégâts à un serviteur ; ou $2 |4(point,points) de dégâts à tous les serviteurs adverses."
			},
			"id": "NEW1_007",
			"name": "Starfall",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Choose One -</b> Deal $5 damage to a minion; or $2 damage to all enemy minions.",
			"type": "Spell"
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
			"cardImage": "BRMA02_2_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Foule moqueuse",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un spectateur 1/1 avec <b>Provocation</b>."
			},
			"id": "BRMA02_2_2_TB",
			"name": "Jeering Crowd",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Spectator with <b>Taunt</b>.",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_084e.png",
			"fr": {
				"name": "Charge",
				"text": "Officier chanteguerre confère +1 ATQ à ce serviteur."
			},
			"id": "EX1_084e",
			"name": "Charge",
			"playerClass": "Warrior",
			"set": "Core",
			"text": "Warsong Commander is granting this minion +1 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_304e.png",
			"fr": {
				"name": "Consumer",
				"text": "Caractéristiques augmentées."
			},
			"id": "EX1_304e",
			"name": "Consume",
			"playerClass": "Warlock",
			"set": "Expert1",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA12_1.png",
			"fr": {
				"name": "Chromaggus"
			},
			"health": 30,
			"id": "BRMA12_1",
			"name": "Chromaggus",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "E.M. Gist",
			"attack": 5,
			"cardImage": "CS2_088.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Gardien des rois",
				"text": "<b>Cri de guerre :</b> rend 6 points de vie à votre héros."
			},
			"health": 6,
			"id": "CS2_088",
			"name": "Guardian of Kings",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Restore 6 Health to your hero.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "TB_CoOpv3_Boss.png",
			"cost": 10,
			"fr": {
				"name": "Nefarian",
				"text": "Ne peut pas être\nla cible de sorts.\n<b>Boss_:</b> Nefarian gagne s’il bat l’un de vous_!"
			},
			"health": 200,
			"id": "TB_CoOpv3_Boss",
			"name": "Nefarian",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Can't be targeted by spells.\n<b>Boss: </b>Nefarian wins if he defeats either of you!",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "NAX15_02H.png",
			"cost": 0,
			"fr": {
				"name": "Trait de givre",
				"text": "<b>Pouvoir héroïque</b>\nInflige 3 points de dégâts au héros adverse et le <b>gèle</b>."
			},
			"id": "NAX15_02H",
			"name": "Frost Blast",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDeal 3 damage to the enemy hero and <b>Freeze</b> it.",
			"type": "Hero_power"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "KAR_065.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Gardienne de la Ménagerie",
				"text": "<b>Cri de guerre_:</b> choisit une Bête alliée et en invoque une copie."
			},
			"health": 5,
			"id": "KAR_065",
			"name": "Menagerie Warden",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Battlecry:</b> Choose a friendly Beast. Summon a_copy of it.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_ClassRandom_Hunter.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : chasseur",
				"text": "Ajoute des cartes de chasseur dans votre deck."
			},
			"id": "TB_ClassRandom_Hunter",
			"name": "Second Class: Hunter",
			"playerClass": "Hunter",
			"set": "Tb",
			"text": "Add Hunter cards to your deck.",
			"type": "Spell"
		},
		{
			"artist": "Bernie Kang",
			"attack": 0,
			"cardImage": "CS2_059.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Diablotin de sang",
				"text": "<b>Camouflage</b>. À la fin de votre tour, donne +1 PV à un autre serviteur allié aléatoire."
			},
			"health": 1,
			"id": "CS2_059",
			"name": "Blood Imp",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Stealth</b>. At the end of your turn, give another random friendly minion +1 Health.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_625t2.png",
			"cost": 2,
			"fr": {
				"name": "Briser l’esprit",
				"text": "<b>Pouvoir héroïque</b>\nInflige $3 points de dégâts."
			},
			"id": "EX1_625t2",
			"name": "Mind Shatter",
			"playerClass": "Priest",
			"set": "Expert1",
			"text": "<b>Hero Power</b>\nDeal $3 damage.",
			"type": "Hero_power"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 3,
			"cardImage": "NEW1_022.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Corsaire de l’effroi",
				"text": "<b>Provocation</b>. Coûte (1) cristal de moins par Attaque de votre arme."
			},
			"health": 3,
			"id": "NEW1_022",
			"name": "Dread Corsair",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Taunt.</b> Costs (1) less per Attack of your weapon.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "KARA_05_02heroic.png",
			"cost": 2,
			"durability": 2,
			"fr": {
				"name": "Grandes méchantes griffes"
			},
			"id": "KARA_05_02heroic",
			"name": "Big Bad Claws",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Weapon"
		},
		{
			"attack": 1,
			"cardImage": "TB_SPT_Minion3.png",
			"cost": 3,
			"fr": {
				"name": "Épéiste",
				"text": "<b>Cri de guerre_:</b> gagne un nombre de points d’ATQ et de PV équivalent à l’Attaque de Hurlevent."
			},
			"health": 1,
			"id": "TB_SPT_Minion3",
			"name": "Swordsman",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Battlecry:</b> Gain Attack and Health equal to Stormwind's Attack",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA09_3a.png",
			"fr": {
				"name": "Mort de faim",
				"text": "A vraiment faim."
			},
			"id": "LOEA09_3a",
			"name": "Famished",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Quite Hungry.",
			"type": "Enchantment"
		},
		{
			"artist": "Jim Nelson",
			"attack": 7,
			"cardImage": "LOE_107.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Statue sinistre",
				"text": "Ne peut pas attaquer à moins d’être le seul serviteur sur le champ de bataille."
			},
			"health": 7,
			"id": "LOE_107",
			"name": "Eerie Statue",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Loe",
			"text": "Can’t attack unless it’s the only minion in the battlefield.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_132_WARLOCK.png",
			"cost": 2,
			"fr": {
				"name": "Connexion d’âme",
				"text": "<b>Pouvoir héroïque</b>\nPioche une carte."
			},
			"id": "AT_132_WARLOCK",
			"name": "Soul Tap",
			"playerClass": "Warlock",
			"set": "Tgt",
			"text": "<b>Hero Power</b>\nDraw a card.",
			"type": "Hero_power"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "KARA_09_06.png",
			"cost": 6,
			"fr": {
				"name": "Salve d’Ombre",
				"text": "Inflige 3_points de dégâts à tous les serviteurs qui ne sont pas des démons."
			},
			"id": "KARA_09_06",
			"name": "Shadow Volley",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Deal 3 damage to all non-Demon minions.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpv3_011.png",
			"cost": 0,
			"fr": {
				"name": "Ne me poussez pas !",
				"text": "Il se met en colère…"
			},
			"id": "TB_CoOpv3_011",
			"name": "Don't Push Me!",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "He's getting angry....",
			"type": "Spell"
		},
		{
			"artist": "Nutthapon Petthai",
			"cardImage": "PART_002.png",
			"cost": 1,
			"fr": {
				"name": "Remontoir",
				"text": "Renvoie un serviteur allié dans votre main."
			},
			"id": "PART_002",
			"name": "Time Rewinder",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Return a friendly minion to your hand.",
			"type": "Spell"
		},
		{
			"artist": "RK Post",
			"attack": 4,
			"cardImage": "AT_047.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Grave-totem draeneï",
				"text": "<b>Cri de guerre :</b> gagne +1/+1 pour chaque totem allié."
			},
			"health": 4,
			"id": "AT_047",
			"name": "Draenei Totemcarver",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Gain +1/+1 for each friendly Totem.",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"attack": 2,
			"cardImage": "EX1_616.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Âme en peine de mana",
				"text": "TOUS les serviteurs coûtent (1) cristal de plus."
			},
			"health": 2,
			"id": "EX1_616",
			"name": "Mana Wraith",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "ALL minions cost (1) more.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA14_4.png",
			"cost": 4,
			"fr": {
				"name": "Activer Toxitron",
				"text": "<b>Pouvoir héroïque</b>\nActive Toxitron !"
			},
			"id": "BRMA14_4",
			"name": "Activate Toxitron",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nActivate Toxitron!",
			"type": "Hero_power"
		},
		{
			"cardImage": "KARA_00_05e.png",
			"fr": {
				"name": "Perspicace",
				"text": "Vos sorts coûtent (0)_|4(cristal,cristaux)."
			},
			"id": "KARA_00_05e",
			"name": "Insightful",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Your spells cost (0).",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "AT_093.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Frigbold algide",
				"text": "<b>Dégâts des sorts : +1</b>"
			},
			"health": 6,
			"id": "AT_093",
			"name": "Frigid Snobold",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"spellDamage": 1,
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_155a.png",
			"cost": 0,
			"fr": {
				"name": "Marque de la nature",
				"text": "+4 ATQ."
			},
			"id": "EX1_155a",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "+4 Attack.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA03_2.png",
			"cost": 2,
			"fr": {
				"name": "Puissance de Ragnaros",
				"text": "<b>Pouvoir héroïque</b>\nInflige 30 points de dégâts."
			},
			"id": "BRMA03_2",
			"name": "Power of the Firelord",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nDeal 30 damage.",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX12_02.png",
			"cost": 2,
			"fr": {
				"name": "Décimer",
				"text": "<b>Pouvoir héroïque</b>\nFait passer les points de vie de tous les serviteurs à 1."
			},
			"id": "NAX12_02",
			"name": "Decimate",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nChange the Health of all minions to 1.",
			"type": "Hero_power"
		},
		{
			"artist": "Jessica Jung",
			"cardImage": "CS2_004.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Mot de pouvoir : Bouclier",
				"text": "Confère +2 PV à un serviteur.\nVous piochez une carte."
			},
			"id": "CS2_004",
			"name": "Power Word: Shield",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"text": "Give a minion +2 Health.\nDraw a card.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "GVG_082.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Gnome mécanique",
				"text": "<b>Râle d’agonie :</b> ajoute une carte <b>Pièce détachée</b> dans votre main."
			},
			"health": 1,
			"id": "GVG_082",
			"name": "Clockwork Gnome",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Deathrattle:</b> Add a <b>Spare Part</b> card to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_083e.png",
			"fr": {
				"name": "Volerie de faucons-dragons",
				"text": "A <b>Furie des vents</b> pendant ce tour."
			},
			"id": "AT_083e",
			"name": "Dragonhawkery",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "<b>Windfury</b> this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Tooth",
			"attack": 1,
			"cardImage": "GVG_063.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Bolvar Fordragon",
				"text": "Chaque fois qu’un serviteur allié meurt quand vous avez cette carte en main, elle gagne +1 ATQ."
			},
			"health": 7,
			"id": "GVG_063",
			"name": "Bolvar Fordragon",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "Whenever a friendly minion dies while this is in your hand, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA09_9H.png",
			"cost": 1,
			"fr": {
				"name": "Répulsif à nagas",
				"text": "Fait passer l’Attaque de tous les nagas affamés à 1."
			},
			"id": "LOEA09_9H",
			"name": "Naga Repellent",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Change the Attack of all Hungry Naga to 1.",
			"type": "Spell"
		},
		{
			"artist": "Anton Zemskov",
			"cardImage": "OG_045.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Infester",
				"text": "Confère à vos serviteurs « <b>Râle d’agonie :</b> ajoute une carte Bête aléatoire dans votre main. »"
			},
			"id": "OG_045",
			"name": "Infest",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Og",
			"text": "Give your minions \"<b>Deathrattle:</b> Add a random Beast to your hand.\"",
			"type": "Spell"
		},
		{
			"cardImage": "DS1_070o.png",
			"fr": {
				"name": "Présence du maître",
				"text": "+2/+2 et <b>Provocation</b>."
			},
			"id": "DS1_070o",
			"name": "Master's Presence",
			"playerClass": "Hunter",
			"set": "Core",
			"text": "+2/+2 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA14_8.png",
			"cost": 8,
			"fr": {
				"name": "Activer Magmatron",
				"text": "<b>Pouvoir héroïque</b>\nActive Magmatron !"
			},
			"id": "BRMA14_8",
			"name": "Activate Magmatron",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nActivate Magmatron!",
			"type": "Hero_power"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"cardImage": "AT_119e.png",
			"fr": {
				"name": "Exalté",
				"text": "Caractéristiques augmentées."
			},
			"id": "AT_119e",
			"name": "Inspired",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_332.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Silence",
				"text": "Réduit au <b>Silence</b> un serviteur."
			},
			"id": "EX1_332",
			"name": "Silence",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Silence</b> a minion.",
			"type": "Spell"
		},
		{
			"artist": "Chris Seaman",
			"attack": 4,
			"cardImage": "EX1_005.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Chasseur de gros gibier",
				"text": "<b>Cri de guerre :</b> détruit un serviteur avec 7 Attaque ou plus."
			},
			"health": 2,
			"id": "EX1_005",
			"name": "Big Game Hunter",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Destroy a minion with an Attack of 7 or more.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_MechWar_Boss1_HeroPower.png",
			"cost": 2,
			"fr": {
				"name": "Bonjour ! Bonjour ! Bonjour !",
				"text": "<b>Pouvoir héroïque</b>\nConfère <b>Bouclier divin</b> et <b>Provocation</b> à votre serviteur ayant la plus faible attaque."
			},
			"id": "TB_MechWar_Boss1_HeroPower",
			"name": "Hello! Hello! Hello!",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nGive your lowest attack minion <b>Divine Shield</b> and <b>Taunt</b>.",
			"type": "Hero_power"
		},
		{
			"artist": "Ryan Sook",
			"attack": 4,
			"cardImage": "CS2_097.png",
			"collectible": true,
			"cost": 4,
			"durability": 2,
			"fr": {
				"name": "Championne en vrai-argent",
				"text": "Chaque fois que votre héros attaque, lui rend 2 PV."
			},
			"id": "CS2_097",
			"name": "Truesilver Champion",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Core",
			"text": "Whenever your hero attacks, restore 2 Health to it.",
			"type": "Weapon"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 6,
			"cardImage": "CS2_042.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Élémentaire de feu",
				"text": "<b>Cri de guerre :</b> inflige 3 points de dégâts."
			},
			"health": 5,
			"id": "CS2_042",
			"name": "Fire Elemental",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Deal 3 damage.",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "EX1_360.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Humilité",
				"text": "L’Attaque d’un serviteur passe à 1."
			},
			"id": "EX1_360",
			"name": "Humility",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Core",
			"text": "Change a minion's Attack to 1.",
			"type": "Spell"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "LOE_115a.png",
			"cost": 0,
			"fr": {
				"name": "Idole corbeau",
				"text": "<b>Découvre</b> un serviteur."
			},
			"id": "LOE_115a",
			"name": "Raven Idol",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Discover</b> a minion.",
			"type": "Spell"
		},
		{
			"artist": "Mark Gibbons",
			"cardImage": "EX1_334.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Folie de l’ombre",
				"text": "Prend le contrôle d’un serviteur adverse avec 3 ATQ ou moins jusqu’à la fin du tour."
			},
			"id": "EX1_334",
			"name": "Shadow Madness",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Gain control of an enemy minion with 3 or less Attack until end of turn.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_084e.png",
			"fr": {
				"name": "Équipé",
				"text": "+2 ATQ."
			},
			"id": "AT_084e",
			"name": "Equipped",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA10_1H.png",
			"fr": {
				"name": "Tranchetripe l’Indompté"
			},
			"health": 30,
			"id": "BRMA10_1H",
			"name": "Razorgore the Untamed",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 7,
			"cardImage": "XXX_100.png",
			"cost": 0,
			"fr": {
				"name": "Yogg-Saron Test (Manual)",
				"text": "<b>Battlecry:</b> Cast each spell you've cast this game <i>(targets chosen randomly)</i>."
			},
			"health": 5,
			"id": "XXX_100",
			"name": "Yogg-Saron Test (Manual)",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Cheat",
			"text": "<b>Battlecry:</b> Cast each spell you've cast this game <i>(targets chosen randomly)</i>.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 4,
			"cardImage": "KARA_04_05.png",
			"cost": 3,
			"fr": {
				"name": "Singe volant",
				"text": "<b>Charge</b>"
			},
			"health": 2,
			"id": "KARA_04_05",
			"name": "Flying Monkey",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA15_2H.png",
			"cost": 0,
			"fr": {
				"name": "Portail instable",
				"text": "<b>Pouvoir héroïque</b>\nAjoute un serviteur aléatoire dans votre main. Il coûte (3) |4(cristal,cristaux) de moins."
			},
			"id": "LOEA15_2H",
			"name": "Unstable Portal",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\nAdd a random minion to your hand. It costs (3) less.",
			"type": "Hero_power"
		},
		{
			"artist": "Gabe from Penny Arcade",
			"cardImage": "EX1_539.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Ordre de tuer",
				"text": "Inflige $3 |4(point,points) de dégâts. Si vous avez une bête, inflige $5 |4(point,points) de dégâts à la place."
			},
			"id": "EX1_539",
			"name": "Kill Command",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $3 damage. If you have a Beast, deal $5 damage instead.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpv3_002.png",
			"cost": 0,
			"fr": {
				"name": "Lumière corrompue",
				"text": "Rend 30 PV à Nefarian. Inflige 30 points de dégâts à tous les autres serviteurs."
			},
			"id": "TB_CoOpv3_002",
			"name": "Twisted Light",
			"playerClass": "Priest",
			"set": "Tb",
			"text": "Restore 30 health to Nefarian. Deal 30 damage to all other minions.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_549o.png",
			"fr": {
				"name": "Courroux bestial",
				"text": "+2 ATQ et <b>Insensible</b> pendant ce tour."
			},
			"id": "EX1_549o",
			"name": "Bestial Wrath",
			"playerClass": "Hunter",
			"set": "Expert1",
			"text": "+2 Attack and <b>Immune</b> this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Andrea Uderzo",
			"attack": 4,
			"cardImage": "AT_106.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Champion de la Lumière",
				"text": "<b>Cri de guerre :</b> <b>réduit au silence</b> un démon."
			},
			"health": 3,
			"id": "AT_106",
			"name": "Light's Champion",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> <b>Silence</b> a Demon.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_42.png",
			"cost": 4,
			"fr": {
				"name": "Tim Erskine",
				"text": "Vous piochez une carte chaque fois que ce serviteur en détruit un autre."
			},
			"health": 5,
			"id": "CRED_42",
			"name": "Tim Erskine",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Whenever this minion destroys another minion, draw a card.",
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"artist": "Chris Seaman",
			"attack": 4,
			"cardImage": "OG_234.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Alchimiste de Sombre-Comté",
				"text": "<b>Cri de guerre :</b> rend 5 PV."
			},
			"health": 5,
			"id": "OG_234",
			"name": "Darkshire Alchemist",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Battlecry:</b> Restore 5 Health.",
			"type": "Minion"
		},
		{
			"cardImage": "OG_316k.png",
			"fr": {
				"name": "Ténébreux",
				"text": "1/1."
			},
			"id": "OG_316k",
			"name": "Shadowy",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "1/1.",
			"type": "Enchantment"
		},
		{
			"artist": "Vinod Rams",
			"attack": 4,
			"cardImage": "GVG_065.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Brute ogre",
				"text": "50% de chance d’attaquer le mauvais adversaire."
			},
			"health": 4,
			"id": "GVG_065",
			"name": "Ogre Brute",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "50% chance to attack the wrong enemy.",
			"type": "Minion"
		},
		{
			"artist": "Justin Thavirat",
			"attack": 0,
			"cardImage": "FP1_007.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Œuf de nérubien",
				"text": "<b>Râle d’agonie :</b> invoque un nérubien 4/4."
			},
			"health": 2,
			"id": "FP1_007",
			"name": "Nerubian Egg",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Summon a 4/4 Nerubian.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_014te.png",
			"fr": {
				"name": "Banane",
				"text": "A +1/+1."
			},
			"id": "EX1_014te",
			"name": "Bananas",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Has +1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_084e.png",
			"fr": {
				"name": "Marque du chasseur",
				"text": "Ce serviteur a 1 PV."
			},
			"id": "CS2_084e",
			"name": "Hunter's Mark",
			"playerClass": "Hunter",
			"set": "Core",
			"text": "This minion has 1 Health.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "CRED_41.png",
			"cost": 5,
			"fr": {
				"name": "Seyil Yoon",
				"text": "<b>Cri de guerre :</b> ajoute 3 Sprint et un Marathon dans votre main."
			},
			"health": 9,
			"id": "CRED_41",
			"name": "Seyil Yoon",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Add 3 Sprints and a Marathon to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "TU4f_001.png",
			"fr": {
				"name": "Chroniqueur Cho"
			},
			"health": 25,
			"id": "TU4f_001",
			"name": "Lorewalker Cho",
			"playerClass": "Neutral",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"cardImage": "TB_CoOpv3_007.png",
			"cost": 0,
			"fr": {
				"name": "Projectiles enflammés",
				"text": "Inflige 5 points de dégâts répartis de façon aléatoire entre tous les autres personnages."
			},
			"id": "TB_CoOpv3_007",
			"name": "Flame Missiles",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Deal 5 damage randomly split among all other characters.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_178ae.png",
			"fr": {
				"name": "Enraciné",
				"text": "+5 PV et <b>Provocation</b>."
			},
			"id": "EX1_178ae",
			"name": "Rooted",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "+5 Health and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA07_2_2c_TB.png",
			"cost": 0,
			"fr": {
				"name": "MOI TOUT CASSER",
				"text": "Détruit un serviteur adverse aléatoire."
			},
			"id": "BRMA07_2_2c_TB",
			"name": "ME SMASH",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Destroy a random enemy minion.",
			"type": "Spell"
		},
		{
			"artist": "Gabe from Penny Arcade",
			"attack": 6,
			"cardImage": "EX1_116.png",
			"collectible": true,
			"cost": 5,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Leeroy Jenkins",
				"text": "<b>Charge</b>. <b>Cri de guerre :</b> invoque deux dragonnets 1/1 pour votre adversaire."
			},
			"health": 2,
			"id": "EX1_116",
			"name": "Leeroy Jenkins",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Charge</b>. <b>Battlecry:</b> Summon two 1/1 Whelps for your opponent.",
			"type": "Minion"
		},
		{
			"artist": "Michael Komarck",
			"cardImage": "CS2_003.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Vision télépathique",
				"text": "Place une copie d’une carte aléatoire de la main de l’adversaire dans la vôtre."
			},
			"id": "CS2_003",
			"name": "Mind Vision",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Core",
			"text": "Put a copy of a random card in your opponent's hand into your hand.",
			"type": "Spell"
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
			"cardImage": "OG_267e.png",
			"fr": {
				"name": "Éclat d’huile de poulpe",
				"text": "+2 ATQ."
			},
			"id": "OG_267e",
			"name": "Squid Oil Sheen",
			"playerClass": "Rogue",
			"set": "Og",
			"text": "+2 Attack",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_355e.png",
			"fr": {
				"name": "Bénédiction du champion",
				"text": "L’Attaque de ce serviteur a été doublée."
			},
			"id": "EX1_355e",
			"name": "Blessed Champion",
			"playerClass": "Paladin",
			"set": "Expert1",
			"text": "This minion's Attack has been doubled.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NEW1_038o.png",
			"fr": {
				"name": "Croissance",
				"text": "Gruul est en train de grandir..."
			},
			"id": "NEW1_038o",
			"name": "Growth",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Gruul is growing...",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_132_PALADIN.png",
			"cost": 2,
			"fr": {
				"name": "La Main d’argent",
				"text": "<b>Pouvoir héroïque</b>\nInvoque deux recrues 1/1."
			},
			"id": "AT_132_PALADIN",
			"name": "The Silver Hand",
			"playerClass": "Paladin",
			"set": "Tgt",
			"text": "<b>Hero Power</b>\nSummon two 1/1 Recruits.",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX2_03H.png",
			"cost": 1,
			"fr": {
				"name": "Pluie de feu",
				"text": "<b>Pouvoir héroïque</b>\nTire un missile pour chaque\n carte dans la main de votre adversaire."
			},
			"id": "NAX2_03H",
			"name": "Rain of Fire",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nFire a missile for each card in your opponent's hand.",
			"type": "Hero_power"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_248.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Esprit farouche",
				"text": "Invoque deux esprits du loup 2/3 avec <b>Provocation</b>.\n<b>Surcharge_:</b>_(2)"
			},
			"id": "EX1_248",
			"name": "Feral Spirit",
			"overload": 2,
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Summon two 2/3 Spirit Wolves with <b>Taunt</b>. <b>Overload:</b> (2)",
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
			"attack": 0,
			"cardImage": "hexfrog.png",
			"cost": 0,
			"fr": {
				"name": "Grenouille",
				"text": "<b>Provocation</b>"
			},
			"health": 1,
			"id": "hexfrog",
			"name": "Frog",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Christopher Moeller",
			"attack": 6,
			"cardImage": "AT_008.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Drake de Frimarra",
				"text": "Vous pouvez utiliser votre pouvoir héroïque autant de fois que vous voulez."
			},
			"health": 6,
			"id": "AT_008",
			"name": "Coldarra Drake",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "You can use your Hero Power any number of times.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_029.png",
			"cost": 0,
			"fr": {
				"name": "Opponent Concede",
				"text": "Force your opponent to concede."
			},
			"id": "XXX_029",
			"name": "Opponent Concede",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Force your opponent to concede.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_Superfriends001e.png",
			"fr": {
				"name": "Facilité",
				"text": "La prochaine carte légendaire que vous jouez pendant ce tour coûte (3) cristaux de moins."
			},
			"id": "TB_Superfriends001e",
			"name": "Facilitated",
			"playerClass": "Rogue",
			"set": "Tb",
			"text": "The next legend you cast this turn costs (3) less.",
			"type": "Enchantment"
		},
		{
			"artist": "Jason Kang",
			"attack": 0,
			"cardImage": "LOE_086.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Pierre d’invocation",
				"text": "Chaque fois que vous lancez un sort, invoque un serviteur aléatoire de même coût."
			},
			"health": 6,
			"id": "LOE_086",
			"name": "Summoning Stone",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Loe",
			"text": "Whenever you cast a spell, summon a random minion of the same Cost.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_013.png",
			"fr": {
				"name": "Enchantement du choix du joueur"
			},
			"id": "TB_013",
			"name": "Player Choice Enchant",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Patrik Hjelm",
			"attack": 5,
			"cardImage": "NEW1_008.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Ancien du savoir",
				"text": "<b>Choix des armes :</b> rend 5 points de vie ou vous piochez une carte."
			},
			"health": 5,
			"id": "NEW1_008",
			"name": "Ancient of Lore",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Choose One -</b> Draw a card; or Restore 5 Health.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX15_04.png",
			"cost": 8,
			"fr": {
				"name": "Chaînes",
				"text": "<b>Pouvoir héroïque</b>\nPrend le contrôle d’un serviteur adverse aléatoire jusqu’à la fin du tour."
			},
			"id": "NAX15_04",
			"name": "Chains",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nTake control of a random enemy minion until end of turn.",
			"type": "Hero_power"
		},
		{
			"cardImage": "AT_029e.png",
			"fr": {
				"name": "Lame effilée",
				"text": "+1 ATQ."
			},
			"id": "AT_029e",
			"name": "Extra Stabby",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+1 Attack",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_Mini_1e.png",
			"fr": {
				"name": "Miniature",
				"text": "Miniaturisé, 1/1."
			},
			"id": "TB_Mini_1e",
			"name": "Miniature",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Mini-sized, set to 1/1",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_GiftExchange_Snowball.png",
			"cost": 0,
			"fr": {
				"name": "Boules de neige durcie",
				"text": "Renvoie 3 serviteurs adverses aléatoires dans la main de votre adversaire."
			},
			"id": "TB_GiftExchange_Snowball",
			"name": "Hardpacked Snowballs",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Return 3 random enemy minions to your opponent's hand.",
			"type": "Spell"
		},
		{
			"artist": "Steve Prescott",
			"attack": 4,
			"cardImage": "OG_282.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Lame de C’Thun",
				"text": "<b>Cri de guerre_:</b> détruit un serviteur. Ajoute son Attaque et sa Vie à celles de votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 4,
			"id": "OG_282",
			"name": "Blade of C'Thun",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Battlecry:</b> Destroy a minion. Add its Attack and Health to_your C'Thun's <i>(wherever it is).</i>",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KTRAF_H_2.png",
			"fr": {
				"name": "Rafaam"
			},
			"health": 60,
			"id": "TB_KTRAF_H_2",
			"name": "Rafaam",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Tb",
			"type": "Hero"
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
			"artist": "J. Curtis Cranford",
			"attack": 3,
			"cardImage": "OG_222.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Lame de ralliement",
				"text": "<b>Cri de guerre :</b> donne +1/+1 à vos serviteurs avec <b>Bouclier divin</b>."
			},
			"id": "OG_222",
			"name": "Rallying Blade",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> Give +1/+1 to your minions with <b>Divine Shield</b>.",
			"type": "Weapon"
		},
		{
			"cardImage": "TB_Face_Ench1.png",
			"fr": {
				"name": "À l’abri",
				"text": "Ce serviteur est protégé des attaques et ne peut pas avoir Provocation."
			},
			"id": "TB_Face_Ench1",
			"name": "Safe",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "This minion is safe from attacks and cannot have taunt.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_ClassRandom_PickSecondClass.png",
			"fr": {
				"name": "Choisissez votre deuxième classe"
			},
			"id": "TB_ClassRandom_PickSecondClass",
			"name": "Pick your second class",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Steve Prescott",
			"attack": 1,
			"cardImage": "CS2_189.png",
			"collectible": true,
			"cost": 1,
			"faction": "HORDE",
			"fr": {
				"name": "Archère elfe",
				"text": "<b>Cri de guerre :</b> inflige 1 point de dégâts."
			},
			"health": 1,
			"id": "CS2_189",
			"name": "Elven Archer",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Deal 1 damage.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "GVG_049.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Gahz’rilla",
				"text": "Chaque fois que ce serviteur subit des dégâts, double son Attaque."
			},
			"health": 9,
			"id": "GVG_049",
			"name": "Gahz'rilla",
			"playerClass": "Hunter",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "Whenever this minion takes damage, double its Attack.",
			"type": "Minion"
		},
		{
			"artist": "Brian Despain",
			"cardImage": "FP1_019.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Graines de poison",
				"text": "Détruit tous les serviteurs et les remplace par des tréants 2/2."
			},
			"id": "FP1_019",
			"name": "Poison Seeds",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Naxx",
			"text": "Destroy all minions and summon 2/2 Treants to replace them.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_083e.png",
			"fr": {
				"name": "Aiguisé",
				"text": "+1 ATQ pendant ce tour."
			},
			"id": "CS2_083e",
			"name": "Sharpened",
			"playerClass": "Rogue",
			"set": "Core",
			"text": "+1 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Phroi Gardner",
			"attack": 3,
			"cardImage": "OG_102.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Sombre orateur",
				"text": "<b>Cri de guerre_:</b> échange ses caractéristiques avec celles d’un serviteur allié."
			},
			"health": 6,
			"id": "OG_102",
			"name": "Darkspeaker",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Og",
			"text": "<b>Battlecry:</b> Swap stats with a friendly minion.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_007b.png",
			"cost": 0,
			"fr": {
				"name": "Météores",
				"text": "Inflige $5 |4(point,points) de dégâts à un serviteur."
			},
			"id": "NEW1_007b",
			"name": "Starfall",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Deal $5 damage to a minion.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_SPT_Minion3e.png",
			"fr": {
				"name": "Force de Hurlevent",
				"text": "Hurlevent confère de l’Attaque et de la Vie à cette carte."
			},
			"id": "TB_SPT_Minion3e",
			"name": "Strength of Stormwind",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Stormwind is granting this card Attack and Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA04_2.png",
			"cost": 1,
			"fr": {
				"name": "Impulsion de magma",
				"text": "<b>Pouvoir héroïque</b>\nInflige 1 point de dégâts à tous les serviteurs."
			},
			"id": "BRMA04_2",
			"name": "Magma Pulse",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nDeal 1 damage to all minions.",
			"type": "Hero_power"
		},
		{
			"cardImage": "KARA_08_02H.png",
			"cost": 1,
			"fr": {
				"name": "Rage du Néant",
				"text": "<b>Pouvoir héroïque</b>\nDonne +8 ATQ à votre héros pendant ce tour."
			},
			"id": "KARA_08_02H",
			"name": "Nether Rage",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nGive your hero +8 Attack this turn.",
			"type": "Hero_power"
		},
		{
			"artist": "John Polidora",
			"attack": 5,
			"cardImage": "BRM_026.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Dragon affamé",
				"text": "<b>Cri de guerre :</b> invoque un serviteur aléatoire à 1 cristal pour votre adversaire."
			},
			"health": 6,
			"id": "BRM_026",
			"name": "Hungry Dragon",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Brm",
			"text": "<b>Battlecry:</b> Summon a random 1-Cost minion for your opponent.",
			"type": "Minion"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "LOE_002t.png",
			"cost": 3,
			"fr": {
				"name": "Torche enflammée",
				"text": "Inflige $6 |4(point,points) de dégâts."
			},
			"id": "LOE_002t",
			"name": "Roaring Torch",
			"playerClass": "Mage",
			"set": "Loe",
			"text": "Deal $6 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA15_2He.png",
			"fr": {
				"name": "Potion de puissance",
				"text": "+2/+2."
			},
			"id": "BRMA15_2He",
			"name": "Potion of Might",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_089e.png",
			"fr": {
				"name": "Garde d’os",
				"text": "Vie augmentée."
			},
			"id": "AT_089e",
			"name": "Boneguarded",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "Increased Health.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "GVG_009.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Bombardière d’ombre",
				"text": "<b>Cri de guerre :</b> inflige 3 points de dégâts aux héros."
			},
			"health": 1,
			"id": "GVG_009",
			"name": "Shadowbomber",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Deal 3 damage to each hero.",
			"type": "Minion"
		},
		{
			"artist": "Wei Wang",
			"attack": 2,
			"cardImage": "EX1_084.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Officier chanteguerre",
				"text": "Vos serviteurs avec <b>Charge</b> ont +1 ATQ."
			},
			"health": 3,
			"id": "EX1_084",
			"name": "Warsong Commander",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"text": "Your <b>Charge</b> minions have +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_tk33.png",
			"cost": 2,
			"fr": {
				"name": "FEU D’ENFER !",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un infernal 6/6."
			},
			"id": "EX1_tk33",
			"name": "INFERNO!",
			"playerClass": "Warlock",
			"set": "Expert1",
			"text": "<b>Hero Power</b>\nSummon a 6/6 Infernal.",
			"type": "Hero_power"
		},
		{
			"cardImage": "TBUD_1.png",
			"fr": {
				"name": "Invocation précoce de serviteur",
				"text": "Invoque un serviteur gratuit à chaque tour, si vous avez moins de PV que votre adversaire."
			},
			"id": "TBUD_1",
			"name": "TBUD Summon Early Minion",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Each turn, if you have less health then a your opponent, summon a free minion",
			"type": "Enchantment"
		},
		{
			"artist": "Luca Zontini",
			"attack": 3,
			"cardImage": "GVG_099.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Lobe-Bombe",
				"text": "<b>Cri de guerre :</b> inflige 4 points de dégâts à un serviteur adverse aléatoire."
			},
			"health": 3,
			"id": "GVG_099",
			"name": "Bomb Lobber",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Deal 4 damage to a random enemy minion.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "TB_EndlessMinions01.png",
			"fr": {
				"name": "Enchantement sans fin",
				"text": "+2/+2."
			},
			"id": "TB_EndlessMinions01",
			"name": "Endless Enchantment",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_320.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Plaie funeste",
				"text": "Inflige $2 |4(point,points) de dégâts à un personnage. S’il est tué, invoque un démon aléatoire."
			},
			"id": "EX1_320",
			"name": "Bane of Doom",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Deal $2 damage to a character. If that kills it, summon a random Demon.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "KAR_026t.png",
			"cost": 1,
			"fr": {
				"name": "Pion",
				"text": "<b>Provocation</b>"
			},
			"health": 1,
			"id": "KAR_026t",
			"name": "Pawn",
			"playerClass": "Warrior",
			"set": "Kara",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_011o.png",
			"fr": {
				"name": "Rugissement sauvage",
				"text": "+2 ATQ pendant ce tour."
			},
			"id": "CS2_011o",
			"name": "Savage Roar",
			"playerClass": "Druid",
			"set": "Core",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_507e.png",
			"fr": {
				"name": "Mrgglaargl !",
				"text": "Le chef de guerre murloc confère +2/+1."
			},
			"id": "EX1_507e",
			"name": "Mrgglaargl!",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Murloc Warleader is granting +2/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA12_7H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : bronze",
				"text": "Les serviteurs de Chromaggus coûtent (3) |4(cristal,cristaux) de moins tant que vous avez cette carte dans votre main."
			},
			"id": "BRMA12_7H",
			"name": "Brood Affliction: Bronze",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "While this is in your hand, Chromaggus' minions cost (3) less.",
			"type": "Spell"
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
			"cardImage": "AT_049e.png",
			"fr": {
				"name": "Puissance des Pitons",
				"text": "Attaque augmentée."
			},
			"id": "AT_049e",
			"name": "Power of the Bluff",
			"playerClass": "Shaman",
			"set": "Tgt",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA14_2H.png",
			"cost": 0,
			"fr": {
				"name": "Armure de plates",
				"text": "<b>Pouvoir héroïque passif</b>\nVotre héros et vos serviteurs ne peuvent pas subir plus de 1 point de dégâts à la fois."
			},
			"id": "LOEA14_2H",
			"name": "Platemail Armor",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\nYour Hero and your minions can only take 1 damage at a time.",
			"type": "Hero_power"
		},
		{
			"artist": "Simon Bisley",
			"attack": 2,
			"cardImage": "EX1_604.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Berserker écumant",
				"text": "Chaque fois qu’un serviteur subit des dégâts, gagne +1 ATQ."
			},
			"health": 4,
			"id": "EX1_604",
			"name": "Frothing Berserker",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Whenever a minion takes damage, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA13_1.png",
			"fr": {
				"name": "Squeletosaurus Hex"
			},
			"health": 30,
			"id": "LOEA13_1",
			"name": "Skelesaurus Hex",
			"playerClass": "Neutral",
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
				"name": "Vieux déchiqueteur de Sneed",
				"text": "<b>Râle d’agonie :</b> invoque un serviteur <b>Légendaire</b> aléatoire."
			},
			"health": 7,
			"id": "GVG_114",
			"name": "Sneed's Old Shredder",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "<b>Deathrattle:</b> Summon a random <b>Legendary</b> minion.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "NAXM_002.png",
			"cost": 3,
			"fr": {
				"name": "Forgeron squelettique",
				"text": "<b>Râle d’agonie :</b> détruit l’arme de votre adversaire."
			},
			"health": 3,
			"id": "NAXM_002",
			"name": "Skeletal Smith",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Destroy your opponent's weapon.",
			"type": "Minion"
		},
		{
			"artist": "Kerem Beyit",
			"cardImage": "GVG_019.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Cœur de démon",
				"text": "Inflige $5 |4(point,points) de dégâts à un serviteur. Si c’est un démon allié, lui donne +5/+5 à la place."
			},
			"id": "GVG_019",
			"name": "Demonheart",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Deal $5 damage to a minion.  If it's a friendly Demon, give it +5/+5 instead.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_029t.png",
			"fr": {
				"name": "Tuez Millhouse !",
				"text": "Les sorts coûtent (0) pendant ce tour !"
			},
			"id": "NEW1_029t",
			"name": "Kill Millhouse!",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "Spells cost (0) this turn!",
			"type": "Enchantment"
		},
		{
			"artist": "G.Tsai & K. Turovec",
			"attack": 1,
			"cardImage": "KAR_A02_01.png",
			"cost": 1,
			"fr": {
				"name": "Assiette"
			},
			"health": 1,
			"id": "KAR_A02_01",
			"name": "Plate",
			"playerClass": "Neutral",
			"set": "Kara",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "TB_OG_027.png",
			"cost": 1,
			"fr": {
				"name": "Évolution",
				"text": "Transforme vos serviteurs en serviteurs aléatoires qui coûtent (1) |4(cristal,cristaux) de plus."
			},
			"id": "TB_OG_027",
			"name": "Evolve",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Og",
			"text": "Transform your minions into random minions that cost (1) more.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_133e.png",
			"fr": {
				"name": "Victoire !",
				"text": "+1/+1."
			},
			"id": "AT_133e",
			"name": "Victory!",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA12_8te.png",
			"fr": {
				"name": "Lignée draconique",
				"text": "+2/+2."
			},
			"id": "BRMA12_8te",
			"name": "Draconic Lineage",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "+2/+2",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "TB_ClassRandom_Rogue.png",
			"cost": 0,
			"fr": {
				"name": "Deuxième classe : voleur",
				"text": "Ajoute des cartes de voleur dans votre deck."
			},
			"id": "TB_ClassRandom_Rogue",
			"name": "Second Class: Rogue",
			"playerClass": "Rogue",
			"set": "Tb",
			"text": "Add Rogue cards to your deck.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX6_03te.png",
			"fr": {
				"name": "Croissance fongique",
				"text": "Attaque augmentée."
			},
			"id": "NAX6_03te",
			"name": "Fungal Growth",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "James Ryman",
			"attack": 2,
			"cardImage": "FP1_004.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Savant fou",
				"text": "<b>Râle d’agonie :</b> place un <b>Secret</b> de votre deck sur le champ de bataille."
			},
			"health": 2,
			"id": "FP1_004",
			"name": "Mad Scientist",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Put a <b>Secret</b> from your deck into the battlefield.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "KARA_13_16.png",
			"cost": 2,
			"fr": {
				"name": "Susie Grésichant",
				"text": "Les portails coûtent (1)_|4(cristal,cristaux) de moins.\n<i>Ne compte pas comme un serviteur.</i>"
			},
			"health": 2,
			"id": "KARA_13_16",
			"name": "Susie Sizzlesong",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Portals cost (1) less. \n<i>Does not count as a minion.</i>",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "TU4c_005.png",
			"cost": 2,
			"fr": {
				"name": "Gnome caché",
				"text": "Il se cachait dans un tonneau !"
			},
			"health": 3,
			"id": "TU4c_005",
			"name": "Hidden Gnome",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "Was hiding in a barrel!",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_12.png",
			"cost": 0,
			"fr": {
				"name": "Médaillon de Medivh",
				"text": "Remplace votre main par des cartes Portail instable."
			},
			"id": "LOEA16_12",
			"name": "Medivh's Locket",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Replace your hand with Unstable Portals.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpv3_004.png",
			"cost": 0,
			"fr": {
				"name": "Enchaînement",
				"text": "Inflige 7 points de dégâts à un serviteur et à son propriétaire."
			},
			"id": "TB_CoOpv3_004",
			"name": "Cleave",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Deal 7 damage to a minion and its owner.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA11_2H.png",
			"cost": 0,
			"fr": {
				"name": "Essence des Rouges",
				"text": "<b>Pouvoir héroïque</b>\nChaque joueur pioche 3 cartes. Vous gagnez un cristal de mana."
			},
			"id": "BRMA11_2H",
			"name": "Essence of the Red",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nEach player draws 3 cards. Gain a Mana Crystal.",
			"type": "Hero_power"
		},
		{
			"artist": "Glenn Rane",
			"attack": 5,
			"cardImage": "GVG_004.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Explomage gobelin",
				"text": "<b>Cri de guerre :</b> si vous possédez un Méca, inflige 4 points de dégâts répartis de façon aléatoire entre tous les adversaires."
			},
			"health": 4,
			"id": "GVG_004",
			"name": "Goblin Blastmage",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> If you have a Mech, deal 4 damage randomly split among all enemies.",
			"type": "Minion"
		},
		{
			"artist": "Arthur Bozonnet",
			"cardImage": "KARA_00_09.png",
			"cost": 1,
			"fr": {
				"name": "Armure de mage",
				"text": "Gagne 10_points d’armure."
			},
			"id": "KARA_00_09",
			"name": "Mage Armor",
			"playerClass": "Mage",
			"set": "Kara",
			"text": "Gain 10 Armor.",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_051e.png",
			"fr": {
				"name": "Enragé",
				"text": "+1 ATQ."
			},
			"id": "GVG_051e",
			"name": "Enraged",
			"playerClass": "Warrior",
			"set": "Gvg",
			"text": "+1 Attack",
			"type": "Enchantment"
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
			"cardImage": "OG_118f.png",
			"fr": {
				"name": "Nouvelle vocation",
				"text": "Coût réduit."
			},
			"id": "OG_118f",
			"name": "New Calling",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Cost reduced.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "TB_KTRAF_2.png",
			"cost": 4,
			"fr": {
				"name": "Dame Blaumeux",
				"text": "<b>Cri de guerre :</b> invoque un cavalier."
			},
			"health": 7,
			"id": "TB_KTRAF_2",
			"name": "Lady Blaumeux",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "<b>Battlecry:</b> Summon a fellow Horseman.",
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"cardImage": "TU4c_006e.png",
			"fr": {
				"name": "Banane",
				"text": "Ce serviteur a +1/+1. <i>(+1 ATQ / +1 PV)</i>"
			},
			"id": "TU4c_006e",
			"name": "Bananas",
			"playerClass": "Neutral",
			"set": "Missions",
			"text": "This minion has +1/+1. <i>(+1 Attack/+1 Health)</i>",
			"type": "Enchantment"
		},
		{
			"artist": "Samwise",
			"attack": 5,
			"cardImage": "FP1_030.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Horreb",
				"text": "<b>Cri de guerre :</b> les sorts adverses coûtent (5) cristaux de plus au prochain tour."
			},
			"health": 5,
			"id": "FP1_030",
			"name": "Loatheb",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "<b>Battlecry:</b> Enemy spells cost (5) more next turn.",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"cardImage": "CS1_129.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Feu intérieur",
				"text": "Change l’Attaque d’un serviteur pour qu’elle soit égale à ses PV."
			},
			"id": "CS1_129",
			"name": "Inner Fire",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Change a minion's Attack to be equal to its Health.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA08_01.png",
			"fr": {
				"name": "Archaedas"
			},
			"health": 30,
			"id": "LOEA08_01",
			"name": "Archaedas",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "TB_GP_01e_copy1.png",
			"fr": {
				"name": "Tour des Ombres donne Camouflage à mes serviteurs.",
				"text": "Ne peut pas attaquer.\n<b>Camouflage</b>."
			},
			"id": "TB_GP_01e_copy1",
			"name": "Shadow Tower Give My minions Stealth",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Can't Attack.\n<b>Stealth</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Efrem Palacios",
			"attack": 2,
			"cardImage": "EX1_613.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Edwin VanCleef",
				"text": "<b>Combo :</b> gagne +2/+2 pour chaque carte jouée auparavant pendant ce tour."
			},
			"health": 2,
			"id": "EX1_613",
			"name": "Edwin VanCleef",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Combo:</b> Gain +2/+2 for each card played earlier this turn.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "EX1_283.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Élémentaire de givre",
				"text": "<b>Cri de guerre :</b> <b>gèle</b> un personnage."
			},
			"health": 5,
			"id": "EX1_283",
			"name": "Frost Elemental",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> <b>Freeze</b> a character.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_013e.png",
			"fr": {
				"name": "Mot de pouvoir : Gloire",
				"text": "Quand il attaque, rend 4 PV au héros du joueur l’ayant amélioré."
			},
			"id": "AT_013e",
			"name": "Power Word: Glory",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "When this attacks, restore 4 Health to the hero of the player who buffed it.",
			"type": "Enchantment"
		},
		{
			"artist": "Jim Pavelec",
			"cardImage": "CS2_236.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Esprit divin",
				"text": "Double les points de vie d’un serviteur."
			},
			"id": "CS2_236",
			"name": "Divine Spirit",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Core",
			"text": "Double a minion's Health.",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "BRMC_99e.png",
			"cost": 2,
			"fr": {
				"name": "Élémentaire de roche",
				"text": "<b>Provocation</b>"
			},
			"health": 3,
			"id": "BRMC_99e",
			"name": "Rock Elemental",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Taunt</b>",
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Max Grecke",
			"attack": 2,
			"cardImage": "OG_322.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Pirate des flots noirs",
				"text": "Vos armes coûtent (2) cristaux de moins."
			},
			"health": 5,
			"id": "OG_322",
			"name": "Blackwater Pirate",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Og",
			"text": "Your weapons cost (2) less.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "BRM_033.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Technicienne de l’Aile noire",
				"text": "<b>Cri de guerre :</b> gagne +1/+1 si vous avez un Dragon en main."
			},
			"health": 4,
			"id": "BRM_033",
			"name": "Blackwing Technician",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Brm",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1/+1. ",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "CRED_40.png",
			"cost": 4,
			"fr": {
				"name": "Ryan Masterson",
				"text": "<b>Cri de guerre :</b> lance des copies d’Attaque sournoise, Sang froid et Éviscération. <i>(cibles choisies au hasard).</i>"
			},
			"health": 2,
			"id": "CRED_40",
			"name": "Ryan Masterson",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Cast copies of Backstab, Cold Blood, and Eviscerate. <i>(targets chosen randomly).</i>",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "KAR_004a.png",
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Félin surprise",
				"text": "<b>Camouflage</b>"
			},
			"health": 2,
			"id": "KAR_004a",
			"name": "Cat in a Hat",
			"playerClass": "Hunter",
			"set": "Kara",
			"text": "<b>Stealth</b>",
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
			"cardImage": "TB_013_PickOnCurve2.png",
			"fr": {
				"name": "Player Choice Enchant On Curve2"
			},
			"id": "TB_013_PickOnCurve2",
			"name": "Player Choice Enchant On Curve2",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Bernie Kang",
			"attack": 2,
			"cardImage": "LOE_010.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Serpent de la fosse",
				"text": "Détruit tout serviteur blessé par ce serviteur."
			},
			"health": 1,
			"id": "LOE_010",
			"name": "Pit Snake",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Loe",
			"text": "Destroy any minion damaged by this minion.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "TB_KTRAF_2s.png",
			"cost": 4,
			"fr": {
				"name": "Sire Zeliek",
				"text": "Dame Blaumeux est <b>Insensible</b>."
			},
			"health": 5,
			"id": "TB_KTRAF_2s",
			"name": "Sir Zeliek",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Lady Blaumeux is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "KARA_00_11.png",
			"cost": 0,
			"fr": {
				"name": "Évocation",
				"text": "Gagne 5_cristaux de mana pendant ce tour uniquement."
			},
			"id": "KARA_00_11",
			"name": "Evocation",
			"playerClass": "Mage",
			"set": "Kara",
			"text": "Gain 5 Mana Crystals this turn only.",
			"type": "Spell"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 3,
			"cardImage": "KAR_035.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Prêtre du festin",
				"text": "Chaque fois que vous lancez un sort, rend 3_PV à votre héros."
			},
			"health": 6,
			"id": "KAR_035",
			"name": "Priest of the Feast",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Kara",
			"text": "Whenever you cast a spell, restore 3 Health to\nyour hero.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"type": "Weapon"
		},
		{
			"artist": "Jason Chan",
			"cardImage": "EX1_287.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Contresort",
				"text": "<b>Secret :</b> quand votre adversaire lance un sort, le <b>contre</b>."
			},
			"id": "EX1_287",
			"name": "Counterspell",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Secret:</b> When your opponent casts a spell, <b>Counter</b> it.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA12_1H.png",
			"fr": {
				"name": "Dame Naz’jar"
			},
			"health": 30,
			"id": "LOEA12_1H",
			"name": "Lady Naz'jar",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "OG_123e.png",
			"fr": {
				"name": "Déphasé",
				"text": "Se transforme en serviteurs aléatoires."
			},
			"id": "OG_123e",
			"name": "Shifting",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Transforming into random minions.",
			"type": "Enchantment"
		},
		{
			"artist": "Michael Komarck",
			"attack": 3,
			"cardImage": "EX1_274.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Arcaniste éthérien",
				"text": "Si vous contrôlez un <b>Secret</b> à la fin de votre tour, gagne +2/+2."
			},
			"health": 3,
			"id": "EX1_274",
			"name": "Ethereal Arcanist",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "If you control a <b>Secret</b> at the end of your turn, gain +2/+2.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA13_2.png",
			"cost": 1,
			"fr": {
				"name": "Forme véritable",
				"text": "<b>Pouvoir héroïque</b>\nQue le combat commence !"
			},
			"id": "BRMA13_2",
			"name": "True Form",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nLet the games begin!",
			"type": "Hero_power"
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
			"attack": 1,
			"cardImage": "NAX2_05.png",
			"cost": 3,
			"fr": {
				"name": "Adorateur",
				"text": "Votre héros a +1 ATQ pendant votre tour."
			},
			"health": 4,
			"id": "NAX2_05",
			"name": "Worshipper",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Your hero has +1 Attack on your turn.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA04_4.png",
			"cost": 3,
			"fr": {
				"name": "Déchaînement",
				"text": "Invoque 3 liges du feu. <b>Surcharge :</b> (2)"
			},
			"id": "BRMA04_4",
			"name": "Rock Out",
			"overload": 2,
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Summon 3 Firesworn. <b>Overload:</b> (2)",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"set": "Loe",
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 5,
			"cardImage": "OG_087.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Serviteur de Yogg-Saron",
				"text": "<b>Cri de guerre :</b> lance un sort aléatoire coûtant au maximum\n(5) cristaux de mana <i>(cibles choisies au hasard).</i>"
			},
			"health": 4,
			"id": "OG_087",
			"name": "Servant of Yogg-Saron",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> Cast a random spell that costs (5) or less <i>(targets chosen randomly)</i>.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA17_5.png",
			"cost": 2,
			"fr": {
				"name": "Séides des os",
				"text": "<b>Pouvoir héroïque</b>\nInvoque deux assemblages d’os 2/1."
			},
			"id": "BRMA17_5",
			"name": "Bone Minions",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon two 2/1 Bone Constructs.",
			"type": "Hero_power"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 5,
			"cardImage": "BRM_018.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Dragon consort",
				"text": "<b>Cri de guerre :</b> le prochain Dragon que vous jouez coûte (2) cristaux de moins."
			},
			"health": 5,
			"id": "BRM_018",
			"name": "Dragon Consort",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Brm",
			"text": "<b>Battlecry:</b> The next Dragon you play costs (2) less.",
			"type": "Minion"
		},
		{
			"artist": "A.J. Nazzaro",
			"attack": 0,
			"cardImage": "KAR_029.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Œuf runique",
				"text": "<b>Râle d’agonie :</b> vous piochez une carte."
			},
			"health": 2,
			"id": "KAR_029",
			"name": "Runic Egg",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Deathrattle:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_154b.png",
			"cost": 0,
			"fr": {
				"name": "Colère",
				"text": "Inflige $1 |4(point,points) de dégâts à un serviteur. Vous piochez une carte."
			},
			"id": "EX1_154b",
			"name": "Wrath",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "Deal $1 damage to a minion. Draw a card.",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "OG_044a.png",
			"cost": 5,
			"fr": {
				"name": "Druide de la Griffe",
				"text": "<b>Charge, Provocation</b>"
			},
			"health": 6,
			"id": "OG_044a",
			"name": "Druid of the Claw",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Charge</b>\n<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "BRM_028e.png",
			"fr": {
				"name": "Faveur impériale",
				"text": "Coûte (1) |4(cristal,cristaux) de moins."
			},
			"id": "BRM_028e",
			"name": "Imperial Favor",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Costs (1) less.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "CRED_25.png",
			"cost": 4,
			"fr": {
				"name": "Elizabeth Cho",
				"text": "<b>Cri de guerre :</b> ajoute Écho de Medivh et Limon résonnant dans votre main."
			},
			"health": 4,
			"id": "CRED_25",
			"name": "Elizabeth Cho",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Add Echo of Medivh and Echoing Ooze to your hand. ",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_049_H1.png",
			"cost": 2,
			"fr": {
				"name": "Appel totémique",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un totem aléatoire."
			},
			"id": "CS2_049_H1",
			"name": "Totemic Call",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nSummon a random Totem.",
			"type": "Hero_power"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 8,
			"cardImage": "OG_308.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Ver des sables géant",
				"text": "Quand ce serviteur en tue un autre, il peut attaquer de nouveau."
			},
			"health": 8,
			"id": "OG_308",
			"name": "Giant Sand Worm",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Og",
			"text": "Whenever this attacks and kills a minion, it may attack again.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_039.png",
			"cost": 0,
			"fr": {
				"name": "Become Hogger",
				"text": "Become Hogger for Video Recording."
			},
			"id": "XXX_039",
			"name": "Become Hogger",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Become Hogger for Video Recording.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_408.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Frappe mortelle",
				"text": "Inflige $4 |4(point,points) de dégâts. Si votre héros a 12 PV ou moins, inflige $6 |4(point,points) de dégâts à la place."
			},
			"id": "EX1_408",
			"name": "Mortal Strike",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Deal $4 damage. If you have 12 or less Health, deal $6 instead.",
			"type": "Spell"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 4,
			"cardImage": "OG_295.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Apothicaire du culte",
				"text": "<b>Cri de guerre :</b> rend 2 PV à votre héros pour chaque serviteur adverse."
			},
			"health": 4,
			"id": "OG_295",
			"name": "Cult Apothecary",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Battlecry:</b> For each enemy minion, restore 2 Health to your hero.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA13_1h.png",
			"fr": {
				"name": "Squeletosaurus Hex"
			},
			"health": 30,
			"id": "LOEA13_1h",
			"name": "Skelesaurus Hex",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "CS2_049_H1_AT_132.png",
			"cost": 2,
			"fr": {
				"name": "Heurt totémique",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un totem de votre choix."
			},
			"id": "CS2_049_H1_AT_132",
			"name": "Totemic Slam",
			"playerClass": "Shaman",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nSummon a Totem of your choice.",
			"type": "Hero_power"
		},
		{
			"cardImage": "GVG_036e.png",
			"fr": {
				"name": "Puissance acquise",
				"text": "+2/+2."
			},
			"id": "GVG_036e",
			"name": "Powered",
			"playerClass": "Shaman",
			"set": "Gvg",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Dave Rapoza",
			"cardImage": "EX1_578.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Sauvagerie",
				"text": "Inflige des dégâts d’un montant équivalent à l’Attaque de votre héros à un serviteur."
			},
			"id": "EX1_578",
			"name": "Savagery",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Deal damage equal to your hero's Attack to a minion.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_007.png",
			"cost": 1,
			"fr": {
				"name": "Banane déviante",
				"text": "Inverse l’Attaque et la Vie d’un serviteur."
			},
			"id": "TB_007",
			"name": "Deviate Banana",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Swap a minion's Attack and Health.",
			"type": "Spell"
		},
		{
			"artist": "J. Meyers & T. Washington",
			"attack": 3,
			"cardImage": "OG_303.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Ensorceleuse du culte",
				"text": "<b>Dégâts des sorts : +1</b>\nAprès que vous avez lancé un sort, donne +1/+1 à votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 2,
			"id": "OG_303",
			"name": "Cult Sorcerer",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Og",
			"spellDamage": 1,
			"text": "[x]<b><b>Spell Damage</b> +1</b>\nAfter you cast a spell,\ngive your C'Thun +1/+1\n<i>(wherever it is).</i>",
			"type": "Minion"
		},
		{
			"artist": "Raplph Horsley",
			"attack": 1,
			"cardImage": "KAR_063.png",
			"collectible": true,
			"cost": 1,
			"durability": 3,
			"fr": {
				"name": "Griffes spectrales",
				"text": "A +2 ATQ tant que vous avez <b>Dégâts des sorts</b>."
			},
			"id": "KAR_063",
			"name": "Spirit Claws",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Kara",
			"text": "[x]Has +2 Attack while you\nhave <b>Spell Damage</b>.",
			"type": "Weapon"
		},
		{
			"cardImage": "LOEA07_26.png",
			"cost": 1,
			"fr": {
				"name": "Consulter Brann",
				"text": "Vous piochez 3 cartes."
			},
			"id": "LOEA07_26",
			"name": "Consult Brann",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Draw 3 cards.",
			"type": "Spell"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "LOE_051.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Sélénien de la jungle",
				"text": "Chaque joueur a\n<b>+2 aux dégâts des sorts</b>."
			},
			"health": 4,
			"id": "LOE_051",
			"name": "Jungle Moonkin",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Loe",
			"spellDamage": 2,
			"text": "Both players have\n<b>Spell Damage +2</b>.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "OG_072.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Périple dans les abîmes",
				"text": "<b>Découvre</b> une carte avec <b>Râle d’agonie</b>."
			},
			"id": "OG_072",
			"name": "Journey Below",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Discover</b> a <b>Deathrattle</b> card.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_Superfriends001.png",
			"cost": 0,
			"fr": {
				"name": "Jeu offensif",
				"text": "Le prochain serviteur légendaire que vous jouez et toutes ses copies coûtent (3) cristaux de moins."
			},
			"id": "TB_Superfriends001",
			"name": "Offensive Play",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "The next Legendary minion you play and all your other copies cost (3) less.",
			"type": "Spell"
		},
		{
			"artist": "Chippy",
			"attack": 2,
			"cardImage": "EX1_393.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Berserker amani",
				"text": "<b>Accès de rage :</b> +3 ATQ."
			},
			"health": 3,
			"id": "EX1_393",
			"name": "Amani Berserker",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Enrage:</b> +3 Attack",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 2,
			"cardImage": "KARA_09_08.png",
			"cost": 4,
			"fr": {
				"name": "Kil’rek",
				"text": "<b>Provocation</b>"
			},
			"health": 6,
			"id": "KARA_09_08",
			"name": "Kil'rek",
			"playerClass": "Warlock",
			"set": "Kara",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Andrew Robinson",
			"cardImage": "EX1_129.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Éventail de couteaux",
				"text": "Inflige $1 |4(point,points) de dégâts à tous les serviteurs adverses. Vous piochez une carte."
			},
			"id": "EX1_129",
			"name": "Fan of Knives",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $1 damage to all enemy minions. Draw a card.",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "BRMA12_8t.png",
			"cost": 2,
			"fr": {
				"name": "Draconien chromatique",
				"text": "Gagne +2/+2 chaque fois que votre adversaire lance un sort."
			},
			"health": 3,
			"id": "BRMA12_8t",
			"name": "Chromatic Dragonkin",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Whenever your opponent casts a spell, gain +2/+2.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA09_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Ouvrir les portes",
				"text": "<b>Pouvoir héroïque</b>\nInvoque trois dragonnets 1/1."
			},
			"id": "BRMA09_2_TB",
			"name": "Open the Gates",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nSummon three 1/1 Whelps.",
			"type": "Hero_power"
		},
		{
			"artist": "Doug Alexander",
			"attack": 6,
			"cardImage": "CS2_222.png",
			"collectible": true,
			"cost": 7,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Champion de Hurlevent",
				"text": "Vos autres serviteurs\nont +1/+1."
			},
			"health": 6,
			"id": "CS2_222",
			"name": "Stormwind Champion",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "Your other minions have +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_057a.png",
			"fr": {
				"name": "Sceau de Lumière",
				"text": "+2 ATQ pendant ce tour."
			},
			"id": "GVG_057a",
			"name": "Seal of Light",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"attack": 7,
			"cardImage": "XXX_110.png",
			"cost": 0,
			"fr": {
				"name": "Yogg-Saron Test (Auto)",
				"text": "<b>Battlecry:</b> Cast 30 random spells <i>(targets chosen randomly)</i>."
			},
			"health": 5,
			"id": "XXX_110",
			"name": "Yogg-Saron Test (Auto)",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Cheat",
			"text": "<b>Battlecry:</b> Cast 30 random spells <i>(targets chosen randomly)</i>.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "TB_KTRAF_1.png",
			"cost": 4,
			"fr": {
				"name": "Anub’Rekhan",
				"text": "À la fin de votre tour, invoque un nérubien 3/1."
			},
			"health": 5,
			"id": "TB_KTRAF_1",
			"name": "Anub'Rekhan",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "At the end of your turn, summon a 3/1 Nerubian.",
			"type": "Minion"
		},
		{
			"cardImage": "Mekka3e.png",
			"fr": {
				"name": "Encouragé !",
				"text": "Caractéristiques augmentées."
			},
			"id": "Mekka3e",
			"name": "Emboldened!",
			"playerClass": "Neutral",
			"set": "Promo",
			"text": "Increased Stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 6,
			"cardImage": "OG_309.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Princesse Huhuran",
				"text": "<b>Cri de guerre :</b> déclenche le <b>Râle d’agonie</b> d’un serviteur allié."
			},
			"health": 5,
			"id": "OG_309",
			"name": "Princess Huhuran",
			"playerClass": "Hunter",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Battlecry:</b> Trigger a friendly minion's <b>Deathrattle</b> effect.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_CoOpv3_104e.png",
			"fr": {
				"name": "Unité",
				"text": "+2/+2."
			},
			"id": "TB_CoOpv3_104e",
			"name": "Unity",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "+2/+2",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA09_1H.png",
			"fr": {
				"name": "Seigneur Ondulance"
			},
			"health": 30,
			"id": "LOEA09_1H",
			"name": "Lord Slitherspear",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "CRED_18.png",
			"cost": 2,
			"fr": {
				"name": "Becca Abel",
				"text": "Chaque fois que vous piochez une carte, la transforme en carte dorée."
			},
			"health": 2,
			"id": "CRED_18",
			"name": "Becca Abel",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Whenever you draw a card, make it Golden.",
			"type": "Minion"
		},
		{
			"cardImage": "TU4f_006.png",
			"cost": 1,
			"fr": {
				"name": "Transcendance",
				"text": "Cho ne peut pas être attaqué tant qu’il a des serviteurs."
			},
			"id": "TU4f_006",
			"name": "Transcendence",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "Until you kill Cho's minions, he can't be attacked.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA12_2.png",
			"cost": 0,
			"fr": {
				"name": "Perle des marées",
				"text": "À la fin de votre tour, remplace tous les serviteurs par de nouveaux coûtant (1) |4(cristal,cristaux) de plus."
			},
			"id": "LOEA12_2",
			"name": "Pearl of the Tides",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "At the end of your turn, replace all minions with new ones that cost (1) more.",
			"type": "Hero_power"
		},
		{
			"artist": "Esad Ribic",
			"attack": 2,
			"cardImage": "AT_095.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chevalier silencieux",
				"text": "<b>Camouflage</b>\n<b>Bouclier divin</b>"
			},
			"health": 2,
			"id": "AT_095",
			"name": "Silent Knight",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Stealth</b>\n<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_3.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : rouge",
				"text": "Vous subissez 1 point de dégâts au début de votre tour tant que vous avez cette carte dans votre main."
			},
			"id": "BRMA12_3",
			"name": "Brood Affliction: Red",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "While this is in your hand, take 1 damage at the start of your turn.",
			"type": "Spell"
		},
		{
			"cardImage": "OG_202ae.png",
			"fr": {
				"name": "Force d’Y’Shaarj",
				"text": "+3/+3."
			},
			"id": "OG_202ae",
			"name": "Y'Shaarj's Strength",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Og",
			"text": "+3/+3.",
			"type": "Enchantment"
		},
		{
			"artist": "Daria Tuzova",
			"cardImage": "KAR_073.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Portail du Maelström",
				"text": "Inflige $1 |4(point,points) de dégâts à tous les serviteurs adverses. Invoque un serviteur aléatoire coûtant 1_cristal."
			},
			"id": "KAR_073",
			"name": "Maelstrom Portal",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Kara",
			"text": "Deal_$1_damage to_all_enemy_minions. Summon_a_random\n1-Cost minion.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA05_03h.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester sorts !",
				"text": "<b>Pouvoir héroïque passif</b> Les sorts adverses coûtent (11) |4(cristal,cristaux) de mana. Le pouvoir change au début de votre tour."
			},
			"id": "LOEA05_03h",
			"name": "Trogg Hate Spells!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\n Enemy spells cost (11). Swap at the start of your turn.",
			"type": "Hero_power"
		},
		{
			"attack": 5,
			"cardImage": "NAX8_05.png",
			"cost": 6,
			"fr": {
				"name": "Cavalier tenace",
				"text": "<b>Râle d’agonie :</b> invoque un cavalier spectral pour votre adversaire."
			},
			"health": 6,
			"id": "NAX8_05",
			"name": "Unrelenting Rider",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Summon a Spectral Rider for your opponent.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_6.png",
			"cost": 0,
			"fr": {
				"name": "Éclat de Sulfuras",
				"text": "Inflige $5 |4(point,points) de dégâts à TOUS les personnages."
			},
			"id": "LOEA16_6",
			"name": "Shard of Sulfuras",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Deal $5 damage to ALL characters.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_LevelUp_001.png",
			"cost": 2,
			"fr": {
				"name": "Gain de niveau !",
				"text": "Tous les sorts dans votre main et votre deck gagne un niveau."
			},
			"id": "TB_LevelUp_001",
			"name": "Level Up!",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Level up all the spells in your hand and deck.",
			"type": "Hero_power"
		},
		{
			"cardImage": "FP1_028e.png",
			"fr": {
				"name": "Appel des ténèbres",
				"text": "Caractéristiques augmentées."
			},
			"id": "FP1_028e",
			"name": "Darkness Calls",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Increased stats.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Mark Zug",
			"attack": 0,
			"cardImage": "EX1_100.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Chroniqueur Cho",
				"text": "Quand un joueur lance un sort, en place une copie dans la main de son adversaire."
			},
			"health": 4,
			"id": "EX1_100",
			"name": "Lorewalker Cho",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "Whenever a player casts a spell, put a copy into the other player’s hand.",
			"type": "Minion"
		},
		{
			"artist": "Steve Tappin",
			"cardImage": "EX1_160.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Puissance du fauve",
				"text": "<b>Choix des armes :</b>\ndonne à vos serviteurs +1/+1 ou invoque une panthère 3/2."
			},
			"id": "EX1_160",
			"name": "Power of the Wild",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Choose One</b> - Give your minions +1/+1; or Summon a 3/2 Panther.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_082e.png",
			"fr": {
				"name": "Entraînement",
				"text": "Attaque augmentée."
			},
			"id": "AT_082e",
			"name": "Training",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_035t.png",
			"cost": 0,
			"fr": {
				"name": "Embuscade !",
				"text": "Quand vous piochez cette carte, invoque un nérubien 4/4 pour votre adversaire. Vous piochez une carte."
			},
			"id": "AT_035t",
			"name": "Ambush!",
			"playerClass": "Rogue",
			"set": "Tgt",
			"text": "When you draw this, summon a 4/4 Nerubian for your opponent. Draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Garrett Hanna",
			"attack": 0,
			"cardImage": "KARA_08_06.png",
			"cost": 1,
			"fr": {
				"name": "Portail bleu",
				"text": "Le personnage dans le rayon bleu ne subit que 1_point de dégâts à la fois."
			},
			"health": 1,
			"id": "KARA_08_06",
			"name": "Blue Portal",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "The character in the blue beam only takes 1 damage at a time.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA10_2.png",
			"cost": 0,
			"fr": {
				"name": "Mrglmrgl MRGL !",
				"text": "<b>Pouvoir héroïque</b>\nVous piochez des cartes jusqu’à en avoir autant en main que votre adversaire."
			},
			"id": "LOEA10_2",
			"name": "Mrglmrgl MRGL!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Hero Power</b>\nDraw cards until you have as many in hand as your opponent.",
			"type": "Hero_power"
		},
		{
			"cardImage": "CS2_005o.png",
			"fr": {
				"name": "Griffe",
				"text": "+2 ATQ pendant ce tour."
			},
			"id": "CS2_005o",
			"name": "Claw",
			"playerClass": "Druid",
			"set": "Core",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA02_10.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : compagnon",
				"text": "<b>Découvre</b> un compagnon."
			},
			"id": "LOEA02_10",
			"name": "Wish for Companionship",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Discover</b> a Companion.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "LOEA01_11.png",
			"cost": 0,
			"fr": {
				"name": "Baguette du Soleil",
				"text": "<b>Râle d’agonie :</b> remet cette carte à votre adversaire."
			},
			"health": 5,
			"id": "LOEA01_11",
			"name": "Rod of the Sun",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Deathrattle:</b> Surrender this to your opponent.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_041a.png",
			"cost": 0,
			"fr": {
				"name": "Sombres feux follets",
				"text": "+5/+5 et <b>Provocation</b>."
			},
			"id": "GVG_041a",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"set": "Gvg",
			"text": "+5/+5 and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"artist": "Steve Prescott",
			"attack": 8,
			"cardImage": "AT_088.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Champion de Mogor",
				"text": "50% de chance d’attaquer le mauvais adversaire."
			},
			"health": 5,
			"id": "AT_088",
			"name": "Mogor's Champion",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "50% chance to attack the wrong enemy.",
			"type": "Minion"
		},
		{
			"cardImage": "GAME_001.png",
			"fr": {
				"name": "Chance de la pièce",
				"text": "Passer en second augmente vos points de vie."
			},
			"id": "GAME_001",
			"name": "Luck of the Coin",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "Going second grants you increased Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA16_10.png",
			"cost": 0,
			"fr": {
				"name": "Coupe de sang hakkari",
				"text": "Transforme un serviteur en un serpent de la fosse 2/1."
			},
			"id": "LOEA16_10",
			"name": "Hakkari Blood Goblet",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Transform a minion into a 2/1 Pit Snake.",
			"type": "Spell"
		},
		{
			"artist": "Jesper Esjing",
			"attack": 6,
			"cardImage": "OG_147.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Robot de soins corrompu",
				"text": "<b>Râle d’agonie :</b> rend 8 PV au héros adverse."
			},
			"health": 6,
			"id": "OG_147",
			"name": "Corrupted Healbot",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Restore 8 Health to the enemy hero.",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_27H.png",
			"cost": 10,
			"fr": {
				"name": "La sentinelle d’acier",
				"text": "Ce serviteur ne peut pas subir plus de 1 point de dégâts à la fois."
			},
			"health": 10,
			"id": "LOEA16_27H",
			"name": "The Steel Sentinel",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "This minion can only take 1 damage at a time.",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "EX1_400.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Tourbillon",
				"text": "Inflige $1 |4(point,points) de dégâts à TOUS les serviteurs."
			},
			"id": "EX1_400",
			"name": "Whirlwind",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Core",
			"text": "Deal $1 damage to ALL minions.",
			"type": "Spell"
		},
		{
			"artist": "Eva Wilderman",
			"attack": 2,
			"cardImage": "OG_281.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Annonciatrice du mal",
				"text": "<b>Cri de guerre :</b> donne +2/+2 à votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 3,
			"id": "OG_281",
			"name": "Beckoner of Evil",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Battlecry:</b> Give your C'Thun +2/+2 <i>(wherever it is).</i>",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_012.png",
			"cost": 0,
			"fr": {
				"name": "Bounce",
				"text": "Return a minion to its owner's hand."
			},
			"id": "XXX_012",
			"name": "Bounce",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Return a minion to its owner's hand.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_RandCardCost.png",
			"fr": {
				"name": "TBRandomCardCost"
			},
			"id": "TB_RandCardCost",
			"name": "TBRandomCardCost",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "NEW1_024o.png",
			"fr": {
				"name": "Ordres de Vertepeau",
				"text": "+1/+1."
			},
			"id": "NEW1_024o",
			"name": "Greenskin's Command",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+1/+1.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "NAX8_03.png",
			"cost": 1,
			"fr": {
				"name": "Jeune recrue tenace",
				"text": "<b>Râle d’agonie :</b> invoque une jeune recrue spectrale pour votre adversaire."
			},
			"health": 2,
			"id": "NAX8_03",
			"name": "Unrelenting Trainee",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Summon a Spectral Trainee for your opponent.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "NAX9_02.png",
			"cost": 3,
			"fr": {
				"name": "Dame Blaumeux",
				"text": "Votre héros est <b>Insensible</b>."
			},
			"health": 7,
			"id": "NAX9_02",
			"name": "Lady Blaumeux",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "Your hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"artist": "Tyson Murphy",
			"attack": 5,
			"cardImage": "OG_133.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "N’Zoth le corrupteur",
				"text": "<b>Cri de guerre :</b> invoque vos serviteurs avec <b>Râle d’agonie</b> morts pendant cette partie."
			},
			"health": 7,
			"id": "OG_133",
			"name": "N'Zoth, the Corruptor",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Battlecry:</b> Summon your <b>Deathrattle</b> minions that died this game.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 8,
			"cardImage": "EX1_543.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Roi Krush",
				"text": "<b>Charge</b>"
			},
			"health": 8,
			"id": "EX1_543",
			"name": "King Krush",
			"playerClass": "Hunter",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA09_4H.png",
			"cost": 1,
			"fr": {
				"name": "Aile noire",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un draconien 5/4. Change de pouvoir héroïque."
			},
			"id": "BRMA09_4H",
			"name": "Blackwing",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon a 5/4 Dragonkin. Get a new Hero Power.",
			"type": "Hero_power"
		},
		{
			"cardImage": "AT_132_MAGE.png",
			"cost": 2,
			"fr": {
				"name": "Explosion de feu rang 2",
				"text": "<b>Pouvoir héroïque</b>\nInflige $2 points de dégâts."
			},
			"id": "AT_132_MAGE",
			"name": "Fireblast Rank 2",
			"playerClass": "Mage",
			"set": "Tgt",
			"text": "<b>Hero Power</b>\nDeal $2 damage.",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA04_1.png",
			"fr": {
				"name": "Garr"
			},
			"health": 30,
			"id": "BRMA04_1",
			"name": "Garr",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "EX1_509e.png",
			"fr": {
				"name": "Blarghghl",
				"text": "Attaque augmentée."
			},
			"id": "EX1_509e",
			"name": "Blarghghl",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Increased Attack.",
			"type": "Enchantment"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_19.png",
			"cost": 5,
			"fr": {
				"name": "Écumeur du soleil Phaerix",
				"text": "Ajoute une carte Bénédiction du soleil dans votre main à la fin de votre tour."
			},
			"health": 5,
			"id": "LOEA16_19",
			"name": "Sun Raider Phaerix",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "At the end of your turn, add a Blessing of the Sun to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX12_04.png",
			"cost": 3,
			"fr": {
				"name": "Accès de rage",
				"text": "Confère +6 ATQ à votre héros pendant ce tour."
			},
			"id": "NAX12_04",
			"name": "Enrage",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Give your hero +6 Attack this turn.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_058e.png",
			"fr": {
				"name": "Weapon Nerf Enchant",
				"text": "Red Sparkles!"
			},
			"id": "XXX_058e",
			"name": "Weapon Nerf Enchant",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Red Sparkles!",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "KARA_09_03a_heroic.png",
			"cost": 1,
			"fr": {
				"name": "Diablotin dégoûtant",
				"text": "<b>Râle d’agonie_:</b> réinvoque ce serviteur et Malsabot perd 2_PV."
			},
			"health": 2,
			"id": "KARA_09_03a_heroic",
			"name": "Icky Imp",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Deathrattle:</b> Resummon this minion and Illhoof loses 2 Health.",
			"type": "Minion"
		},
		{
			"artist": "Terese Nielsen",
			"attack": 1,
			"cardImage": "CS2_235.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Clerc de Comté-du-Nord",
				"text": "Vous piochez une carte chaque fois qu’un serviteur est soigné."
			},
			"health": 3,
			"id": "CS2_235",
			"name": "Northshire Cleric",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Core",
			"text": "Whenever a minion is healed, draw a card.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA07_01.png",
			"fr": {
				"name": "Chariot de mine"
			},
			"health": 30,
			"id": "LOEA07_01",
			"name": "Mine Cart",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA10_3.png",
			"cost": 1,
			"fr": {
				"name": "La colonie",
				"text": "<b>Pouvoir héroïque</b>\nConfère +1 PV à tous les œufs corrompus, puis en invoque un."
			},
			"id": "BRMA10_3",
			"name": "The Rookery",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nGive all Corrupted Eggs +1 Health, then summon one.",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "KARA_13_17.png",
			"cost": 2,
			"fr": {
				"name": "Mark Marchelune",
				"text": "Les portails coûtent (1)_|4(cristal,cristaux) de moins.\n<i>Ne compte pas comme un serviteur.</i>"
			},
			"health": 2,
			"id": "KARA_13_17",
			"name": "Mark Moonwalker",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Portals cost (1) less. \n<i>Does not count as a minion.</i>",
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
			"cardImage": "BRM_004e.png",
			"fr": {
				"name": "Endurance du Crépuscule",
				"text": "Vie augmentée."
			},
			"id": "BRM_004e",
			"name": "Twilight Endurance",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_031.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Javelot de glace",
				"text": "<b>Gèle</b> un personnage. S’il est déjà <b>gelé</b>, inflige $4 |4(point,points) de dégâts à la place."
			},
			"id": "CS2_031",
			"name": "Ice Lance",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Freeze</b> a character. If it was already <b>Frozen</b>, deal $4 damage instead.",
			"type": "Spell"
		},
		{
			"artist": "Ralph Horsley",
			"cardImage": "OG_273.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Résister aux ténèbres",
				"text": "Invoque cinq recrues de la Main\nd’argent 1/1."
			},
			"id": "OG_273",
			"name": "Stand Against Darkness",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Og",
			"text": "Summon five 1/1 Silver Hand Recruits.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_056.png",
			"cost": 2,
			"fr": {
				"name": "Connexion",
				"text": "<b>Pouvoir héroïque</b>\nSubit $2 points de dégâts. Vous piochez une carte."
			},
			"id": "CS2_056",
			"name": "Life Tap",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Hero Power</b>\nDraw a card and take $2 damage.",
			"type": "Hero_power"
		},
		{
			"attack": 5,
			"cardImage": "NAX7_04.png",
			"cost": 3,
			"durability": 2,
			"fr": {
				"name": "Lame runique massive",
				"text": "Inflige des dégâts doublés aux héros."
			},
			"id": "NAX7_04",
			"name": "Massive Runeblade",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Deals double damage to heroes.",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX10_03H.png",
			"cost": 4,
			"fr": {
				"name": "Frappe haineuse",
				"text": "<b>Pouvoir héroïque</b>\nDétruit un serviteur."
			},
			"id": "NAX10_03H",
			"name": "Hateful Strike",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDestroy a minion.",
			"type": "Hero_power"
		},
		{
			"cardImage": "NAX11_02H_2_TB.png",
			"cost": 2,
			"fr": {
				"name": "Nuage empoisonné",
				"text": "<b>Pouvoir héroïque</b>\nInflige 1 point de dégâts à\n tous les serviteurs adverses. Invoque une gelée si l’un d’eux meurt."
			},
			"id": "NAX11_02H_2_TB",
			"name": "Poison Cloud",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Hero Power</b>\nDeal 1 damage to all enemy minions. If any die, summon a slime.",
			"type": "Hero_power"
		},
		{
			"artist": "Peter Stapleton",
			"attack": 4,
			"cardImage": "OG_292.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Traqueur lugubre",
				"text": "<b>Cri de guerre :</b> donne +1/+1 à tous les serviteurs avec <b>Râle d’agonie</b> dans votre main."
			},
			"health": 2,
			"id": "OG_292",
			"name": "Forlorn Stalker",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> Give all <b>Deathrattle</b> minions in your hand +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_573ae.png",
			"fr": {
				"name": "Faveur du demi-dieu",
				"text": "+2/+2."
			},
			"id": "EX1_573ae",
			"name": "Demigod's Favor",
			"playerClass": "Druid",
			"set": "Expert1",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_188o.png",
			"fr": {
				"name": "« Inspiré »",
				"text": "Ce serviteur a +2 ATQ pendant ce tour."
			},
			"id": "CS2_188o",
			"name": "'Inspired'",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "This minion has +2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 1,
			"cardImage": "GVG_013.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Maître des rouages",
				"text": "A +2 ATQ tant que vous avez un Méca."
			},
			"health": 2,
			"id": "GVG_013",
			"name": "Cogmaster",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Has +2 Attack while you have a Mech.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "CRED_28.png",
			"cost": 4,
			"fr": {
				"name": "He-Rim Woo",
				"text": "<b>Choix des armes :</b> donne un coup dans le bras, offre une friandise ou fait un gros câlin."
			},
			"health": 3,
			"id": "CRED_28",
			"name": "He-Rim Woo",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Choose One</b> - Punch an arm; Offer a treat; or Give a big hug.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "KAR_A02_02H.png",
			"cost": 1,
			"durability": 3,
			"fr": {
				"name": "Cuillère"
			},
			"id": "KAR_A02_02H",
			"name": "Spoon",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX13_02.png",
			"cost": 0,
			"fr": {
				"name": "Changement de polarité",
				"text": "<b>Pouvoir héroïque</b>\nÉchange l’Attaque et la Vie de tous les serviteurs."
			},
			"id": "NAX13_02",
			"name": "Polarity Shift",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nSwap the Attack and Health of all minions.",
			"type": "Hero_power"
		},
		{
			"cardImage": "KAR_A02_09eH.png",
			"fr": {
				"name": "Table mise",
				"text": "+2/+2."
			},
			"id": "KAR_A02_09eH",
			"name": "Table Set",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_393e.png",
			"fr": {
				"name": "Enragé",
				"text": "+3 ATQ."
			},
			"id": "EX1_393e",
			"name": "Enraged",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"cardImage": "OG_080c.png",
			"cost": 1,
			"fr": {
				"name": "Toxine de chardon sanglant",
				"text": "Renvoie un serviteur allié dans votre main.\nIl coûte (2) |4(cristal,cristaux) de moins."
			},
			"id": "OG_080c",
			"name": "Bloodthistle Toxin",
			"playerClass": "Rogue",
			"set": "Og",
			"text": "Return a friendly minion to your hand.\nIt costs (2) less.",
			"type": "Spell"
		},
		{
			"cardImage": "KAR_A02_09e.png",
			"fr": {
				"name": "Table mise",
				"text": "+1/+1."
			},
			"id": "KAR_A02_09e",
			"name": "Table Set",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "EX1_309.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Siphonner l’âme",
				"text": "Détruit un serviteur. Rend #3 PV à votre héros."
			},
			"id": "EX1_309",
			"name": "Siphon Soul",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Destroy a minion. Restore #3 Health to your hero.",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_030ae.png",
			"fr": {
				"name": "Mode Attaque",
				"text": "+1 ATQ."
			},
			"id": "GVG_030ae",
			"name": "Attack Mode",
			"playerClass": "Druid",
			"set": "Gvg",
			"text": "+1 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_414e.png",
			"fr": {
				"name": "Enragé",
				"text": "+6 ATQ."
			},
			"id": "EX1_414e",
			"name": "Enraged",
			"playerClass": "Warrior",
			"set": "Expert1",
			"text": "+6 Attack",
			"type": "Enchantment"
		},
		{
			"cardImage": "AT_121e.png",
			"fr": {
				"name": "Ego énorme",
				"text": "Caractéristiques augmentées."
			},
			"id": "AT_121e",
			"name": "Huge Ego",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Rafael Zanchetin",
			"cardImage": "KARA_04_02hp.png",
			"cost": 0,
			"fr": {
				"name": "Tornade",
				"text": "<b>Pouvoir héroïque</b>\nInflige 100 points de dégâts. Ne peut pas être utilisé si Dorothée est en vie."
			},
			"id": "KARA_04_02hp",
			"name": "Twister",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"text": "<b>Hero Power</b>\nDeal 100 damage. Can't be used if Dorothee is alive.",
			"type": "Hero_power"
		},
		{
			"cardImage": "DS1_175o.png",
			"fr": {
				"name": "Hurlement furieux",
				"text": "Le loup des bois confère +1 ATQ à cette Bête."
			},
			"id": "DS1_175o",
			"name": "Furious Howl",
			"playerClass": "Hunter",
			"set": "Core",
			"text": "This Beast has +1 Attack from Timber Wolf.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX15_01.png",
			"fr": {
				"name": "Kel’Thuzad"
			},
			"health": 30,
			"id": "NAX15_01",
			"name": "Kel'Thuzad",
			"playerClass": "Neutral",
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
			"attack": 2,
			"cardImage": "BRMA14_3.png",
			"cost": 0,
			"fr": {
				"name": "Arcanotron",
				"text": "Chaque joueur a <b>+2 aux dégâts des sorts</b>."
			},
			"health": 2,
			"id": "BRMA14_3",
			"name": "Arcanotron",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"spellDamage": 2,
			"text": "Both players have <b>Spell Damage +2</b>.",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"cardImage": "KARA_07_07.png",
			"cost": 3,
			"fr": {
				"name": "Méca détraqué !",
				"text": "Invoque un Méca aléatoire."
			},
			"id": "KARA_07_07",
			"name": "Haywire Mech!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon a random Mech.",
			"type": "Spell"
		},
		{
			"cardImage": "NEW1_027e.png",
			"fr": {
				"name": "Yarrr !",
				"text": "Capitaine des mers du Sud confère +1/+1."
			},
			"id": "NEW1_027e",
			"name": "Yarrr!",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "Southsea Captain is granting +1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA17_2H.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "BRMA17_2H",
			"name": "Nefarian",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "LOE_017e.png",
			"fr": {
				"name": "Observé",
				"text": "Caractéristiques changées en 3/3."
			},
			"id": "LOE_017e",
			"name": "Watched",
			"playerClass": "Paladin",
			"set": "Loe",
			"text": "Stats changed to 3/3.",
			"type": "Enchantment"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 3,
			"cardImage": "EX1_023.png",
			"collectible": true,
			"cost": 4,
			"faction": "HORDE",
			"fr": {
				"name": "Garde de Lune-d’argent",
				"text": "<b>Bouclier divin</b>"
			},
			"health": 3,
			"id": "EX1_023",
			"name": "Silvermoon Guardian",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 3,
			"cardImage": "GVG_092.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Expérimentateur gnome",
				"text": "<b>Cri de guerre :</b> vous piochez une carte. Si c’est un serviteur, le transforme en poulet."
			},
			"health": 2,
			"id": "GVG_092",
			"name": "Gnomish Experimenter",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Draw a card. If it's a minion, transform it into a Chicken.",
			"type": "Minion"
		},
		{
			"artist": "Ben Olson",
			"attack": 2,
			"cardImage": "FP1_009.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Seigneur de la mort",
				"text": "<b>Provocation. Râle d’agonie :</b> votre adversaire place un serviteur de son deck sur le champ de bataille."
			},
			"health": 8,
			"id": "FP1_009",
			"name": "Deathlord",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Naxx",
			"text": "<b>Taunt. Deathrattle:</b> Your opponent puts a minion from their deck into the battlefield.",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"cardImage": "GVG_041.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Sombres feux follets",
				"text": "<b>Choix des armes :</b> invoque 5 feux follets ou donne +5/+5 et <b>Provocation</b> à un serviteur."
			},
			"id": "GVG_041",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "<b>Choose One -</b> Summon 5 Wisps; or Give a minion +5/+5 and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"artist": "Luke Mancini",
			"attack": 3,
			"cardImage": "LOE_079.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Élise Cherchétoile",
				"text": "<b>Cri de guerre :</b> place Carte du singe doré dans votre deck."
			},
			"health": 5,
			"id": "LOE_079",
			"name": "Elise Starseeker",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "<b>Battlecry:</b> Shuffle the 'Map to the Golden Monkey'   into your deck.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA09_4.png",
			"cost": 1,
			"fr": {
				"name": "Aile noire",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un draconien 3/1. Change de pouvoir héroïque."
			},
			"id": "BRMA09_4",
			"name": "Blackwing",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nSummon a 3/1 Dragonkin. Get a new Hero Power.",
			"type": "Hero_power"
		},
		{
			"artist": "Dave Berggren",
			"cardImage": "CS2_023.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Intelligence des Arcanes",
				"text": "Vous piochez 2 cartes."
			},
			"id": "CS2_023",
			"name": "Arcane Intellect",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"text": "Draw 2 cards.",
			"type": "Spell"
		},
		{
			"artist": "Christopher Moeller",
			"cardImage": "AT_043.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Communion astrale",
				"text": "Gagne 10 cristaux de mana. Vous défausse de votre main."
			},
			"id": "AT_043",
			"name": "Astral Communion",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Gain 10 Mana Crystals. Discard your hand.",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_89.png",
			"cost": 2,
			"fr": {
				"name": "Cendres tourbillonnantes",
				"text": "<b>Furie des vents</b>"
			},
			"health": 5,
			"id": "BRMC_89",
			"name": "Whirling Ash",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 9,
			"cardImage": "GVG_021.png",
			"collectible": true,
			"cost": 9,
			"fr": {
				"name": "Mal’Ganis",
				"text": "Vos autres démons ont +2/+2. Votre héros est <b>Insensible</b>."
			},
			"health": 7,
			"id": "GVG_021",
			"name": "Mal'Ganis",
			"playerClass": "Warlock",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "Your other Demons have +2/+2.\nYour hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_565o.png",
			"fr": {
				"name": "Langue de feu",
				"text": "Le totem Langue de feu confère +2 ATQ."
			},
			"id": "EX1_565o",
			"name": "Flametongue",
			"playerClass": "Shaman",
			"set": "Core",
			"text": "+2 Attack from Flametongue Totem.",
			"type": "Enchantment"
		},
		{
			"artist": "Glenn Rane",
			"attack": 5,
			"cardImage": "EX1_313.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Seigneur des abîmes",
				"text": "<b>Cri de guerre :</b> inflige 5 points de dégâts à votre héros."
			},
			"health": 6,
			"id": "EX1_313",
			"name": "Pit Lord",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Deal 5 damage to your hero.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA09_2eH.png",
			"fr": {
				"name": "Enragé",
				"text": "+5 ATQ."
			},
			"id": "LOEA09_2eH",
			"name": "Enraged",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "+5 Attack",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "LOEA01_12h.png",
			"cost": 3,
			"fr": {
				"name": "Hoplite tol’vir",
				"text": "<b>Râle d’agonie :</b> inflige 5 points de dégâts aux deux héros."
			},
			"health": 5,
			"id": "LOEA01_12h",
			"name": "Tol'vir Hoplite",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Deathrattle:</b> Deal 5 damage to both heroes.",
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
			"cardImage": "AT_086e.png",
			"fr": {
				"name": "Vilenie",
				"text": "Votre pouvoir héroïque coûte (5) cristaux de plus pendant ce tour."
			},
			"id": "AT_086e",
			"name": "Villainy",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "Your Hero Power costs (5) more this turn.",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "Mekka1.png",
			"cost": 1,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Poulet à tête chercheuse",
				"text": "Au début de votre tour, ce serviteur est détruit et vous piochez 3 cartes."
			},
			"health": 1,
			"id": "Mekka1",
			"name": "Homing Chicken",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Promo",
			"text": "At the start of your turn, destroy this minion and draw 3 cards.",
			"type": "Minion"
		},
		{
			"artist": "Aleksi Briclot",
			"attack": 3,
			"cardImage": "GVG_068.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Trogg mâcheroc mastoc",
				"text": "Chaque fois que votre adversaire lance un sort, gagne +2 ATQ."
			},
			"health": 5,
			"id": "GVG_068",
			"name": "Burly Rockjaw Trogg",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Whenever your opponent casts a spell, gain +2 Attack.",
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
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_045.png",
			"cost": 0,
			"fr": {
				"name": "Steal Card",
				"text": "Steal a random card from your opponent."
			},
			"id": "XXX_045",
			"name": "Steal Card",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Steal a random card from your opponent.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_531e.png",
			"fr": {
				"name": "Bien nourri",
				"text": "Les points d’Attaque et de Vie sont augmentés."
			},
			"id": "EX1_531e",
			"name": "Well Fed",
			"playerClass": "Hunter",
			"set": "Expert1",
			"text": "Increased Attack and Health.",
			"type": "Enchantment"
		},
		{
			"attack": 3,
			"cardImage": "CRED_04.png",
			"cost": 1,
			"fr": {
				"name": "Steven Gabriel",
				"text": "<b>Cri de guerre :</b> invoque une boisson à mousse."
			},
			"health": 3,
			"id": "CRED_04",
			"name": "Steven Gabriel",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Summon a frothy beverage.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "NEW1_034.png",
			"cost": 3,
			"fr": {
				"name": "Souffleur",
				"text": "<b>Charge</b>"
			},
			"health": 2,
			"id": "NEW1_034",
			"name": "Huffer",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Charge</b>",
			"type": "Minion"
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
			"attack": 3,
			"cardImage": "TB_Coopv3_100.png",
			"cost": 3,
			"fr": {
				"name": "Guerrier écaille-de-dragon",
				"text": "Chaque fois qu’un joueur cible ce serviteur avec un sort, ce joueur pioche une carte."
			},
			"health": 4,
			"id": "TB_Coopv3_100",
			"name": "Dragonscale Warrior",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Whenever any player targets this minion with a spell, that player draws a card.",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"attack": 2,
			"cardImage": "GVG_122.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Mini stoppe-sort",
				"text": "Les serviteurs adjacents ne peuvent pas être la cible de sorts ou de pouvoirs héroïques."
			},
			"health": 5,
			"id": "GVG_122",
			"name": "Wee Spellstopper",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Adjacent minions can't be targeted by spells or Hero Powers.",
			"type": "Minion"
		},
		{
			"artist": "Chris Rahn",
			"attack": 2,
			"cardImage": "GVG_032.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Sylvenier du Bosquet",
				"text": "<b>Choix des armes :</b> donne à chaque joueur un cristal de mana ou chaque joueur pioche une carte."
			},
			"health": 4,
			"id": "GVG_032",
			"name": "Grove Tender",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Choose One -</b> Give each player a Mana Crystal; or Each player draws a card.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KTRAF_101.png",
			"cost": 8,
			"fr": {
				"name": "Appel des ténèbres",
				"text": "Invoque deux boss aléatoires de Naxxramas et déclenche leur <b>Cri de guerre</b>."
			},
			"id": "TB_KTRAF_101",
			"name": "Darkness Calls",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Summon two random Naxxramas bosses and trigger their <b>Battlecries</b>.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "LOE_076.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Sir Finley Mrrgglton",
				"text": "<b>Cri de guerre : découvre</b> un nouveau pouvoir héroïque de base."
			},
			"health": 3,
			"id": "LOE_076",
			"name": "Sir Finley Mrrgglton",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "<b>Battlecry: Discover</b> a new basic Hero Power.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NEW1_033.png",
			"cost": 3,
			"fr": {
				"name": "Leokk",
				"text": "Vos autres serviteurs ont +1 ATQ."
			},
			"health": 4,
			"id": "NEW1_033",
			"name": "Leokk",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Core",
			"text": "Your other minions have +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "OG_303e.png",
			"fr": {
				"name": "Dévotion de l’ensorceleur",
				"text": "+1/+1."
			},
			"id": "OG_303e",
			"name": "Sorcerous Devotion",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Howard Lyon",
			"attack": 1,
			"cardImage": "CS2_171.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Sanglier brocheroc",
				"text": "<b>Charge</b>"
			},
			"health": 1,
			"id": "CS2_171",
			"name": "Stonetusk Boar",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Charge</b>",
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
				"name": "Nain sombrefer",
				"text": "<b>Cri de guerre :</b> donne +2 ATQ à un serviteur pendant ce tour."
			},
			"health": 4,
			"id": "EX1_046",
			"name": "Dark Iron Dwarf",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give a minion +2 Attack this turn.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_13_06.png",
			"fr": {
				"name": "Prince Malchezaar"
			},
			"health": 30,
			"id": "KARA_13_06",
			"name": "Prince Malchezaar",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"attack": 7,
			"cardImage": "BRMC_97.png",
			"cost": 6,
			"fr": {
				"name": "Vaelastrasz",
				"text": "Vos cartes coûtent (3) |4(cristal,cristaux) de moins."
			},
			"health": 7,
			"id": "BRMC_97",
			"name": "Vaelastrasz",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tb",
			"text": "Your cards cost (3) less.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate.png",
			"fr": {
				"name": "Choisissez votre destin - Construction"
			},
			"id": "TB_PickYourFate",
			"name": "Pick Your Fate Build Around",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA05_03.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester sorts !",
				"text": "<b>Pouvoir héroïque passif</b> Les sorts adverses coûtent (2) |4(cristal,cristaux) de plus. Le pouvoir change au début de votre tour."
			},
			"id": "LOEA05_03",
			"name": "Trogg Hate Spells!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\n Enemy spells cost (2) more. Swap at the start of your turn.",
			"type": "Hero_power"
		},
		{
			"artist": "John Polidora",
			"cardImage": "KARA_08_01.png",
			"fr": {
				"name": "Dédain-du-Néant"
			},
			"health": 30,
			"id": "KARA_08_01",
			"name": "Netherspite",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "KARA_09_02.png",
			"fr": {
				"name": "Conservateur"
			},
			"health": 30,
			"id": "KARA_09_02",
			"name": "Curator",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_051.png",
			"cost": 0,
			"fr": {
				"name": "Make Immune",
				"text": "Permanently make a character <b>Immune</b>."
			},
			"id": "XXX_051",
			"name": "Make Immune",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Permanently make a character <b>Immune</b>.",
			"type": "Spell"
		},
		{
			"artist": "Sean O'Daniels",
			"cardImage": "EX1_626.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Dissipation de masse",
				"text": "Réduit au <b>Silence</b> tous les serviteurs adverses. Vous piochez une carte."
			},
			"id": "EX1_626",
			"name": "Mass Dispel",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Silence</b> all enemy minions. Draw a card.",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "TB_KaraPortals_003.png",
			"cost": 3,
			"fr": {
				"name": "Élémentaire de fête",
				"text": "<b>Provocation.</b>\nSe déplace toujours en groupe_!"
			},
			"health": 2,
			"id": "TB_KaraPortals_003",
			"name": "Party Elemental",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Taunt.\n</b> Comes with a party!",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "EX1_279.png",
			"collectible": true,
			"cost": 10,
			"fr": {
				"name": "Explosion pyrotechnique",
				"text": "Inflige $10 |4(point,points) de dégâts."
			},
			"id": "EX1_279",
			"name": "Pyroblast",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "Deal $10 damage.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "KAR_097t.png",
			"cost": 3,
			"durability": 3,
			"fr": {
				"name": "Atiesh",
				"text": "Après que vous avez lancé un sort, invoque un serviteur aléatoire de même coût. Perd 1_point de durabilité."
			},
			"id": "KAR_097t",
			"name": "Atiesh",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "[x]After you cast a spell,\nsummon a random\nminion of that Cost.\nLose 1 Durability.",
			"type": "Weapon"
		},
		{
			"attack": 0,
			"cardImage": "TB_Coopv3_009t.png",
			"cost": 2,
			"fr": {
				"name": "Rune explosive",
				"text": "Au début de votre tour, explose et inflige 9 points de dégâts à votre héros."
			},
			"health": 3,
			"id": "TB_Coopv3_009t",
			"name": "Explosive Rune",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "At the start of your turn, this explodes, dealing 9 damage to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "KAR_a10_Boss1.png",
			"fr": {
				"name": "Roi blanc"
			},
			"health": 20,
			"id": "KAR_a10_Boss1",
			"name": "White King",
			"playerClass": "Neutral",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"artist": "Dan Scott",
			"attack": 4,
			"cardImage": "OG_328.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Maître de l’évolution",
				"text": "<b>Cri de guerre :</b> transforme un serviteur allié en un serviteur aléatoire coûtant\n(1) |4(cristal,cristaux) de plus."
			},
			"health": 5,
			"id": "OG_328",
			"name": "Master of Evolution",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Og",
			"text": "<b>Battlecry:</b> Transform a friendly minion into a random one that costs (1) more.",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "DS1_185.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Tir des Arcanes",
				"text": "Inflige $2 |4(point,points) de dégâts."
			},
			"id": "DS1_185",
			"name": "Arcane Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $2 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_MP_01e.png",
			"fr": {
				"name": "Chargez !",
				"text": "A <b>Charge</b>."
			},
			"id": "TB_MP_01e",
			"name": "Charge!",
			"playerClass": "Warrior",
			"set": "Tb",
			"text": "Has <b>Charge</b>",
			"type": "Enchantment"
		},
		{
			"artist": "Peter Stapleton",
			"attack": 2,
			"cardImage": "OG_256.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Rejeton de N’Zoth",
				"text": "<b>Râle d’agonie :</b> donne +1/+1 à vos serviteurs."
			},
			"health": 2,
			"id": "OG_256",
			"name": "Spawn of N'Zoth",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Give your minions +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMC_100e.png",
			"fr": {
				"name": "Bombe vivante",
				"text": "Inflige 5 points de dégâts de ce côté du plateau pendant le tour de Ragnaros."
			},
			"id": "BRMC_100e",
			"name": "Living Bomb",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "On Ragnaros' turn, deal 5 damage to this side of the board.",
			"type": "Enchantment"
		},
		{
			"artist": "Jomaro Kindred",
			"attack": 4,
			"cardImage": "BRM_014.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Rageur du Magma",
				"text": "<b>Cri de guerre :</b> gagne +3/+3 si votre main est vide."
			},
			"health": 4,
			"id": "BRM_014",
			"name": "Core Rager",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Brm",
			"text": "<b>Battlecry:</b> If your hand is empty, gain +3/+3.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "OG_241.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Villageois possédé",
				"text": "<b>Râle d’agonie :</b> invoque une ombrebête 1/1."
			},
			"health": 1,
			"id": "OG_241",
			"name": "Possessed Villager",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Summon a 1/1 Shadowbeast.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_027e.png",
			"fr": {
				"name": "Maître invocateur",
				"text": "Coûte (0) |4(cristal,cristaux)."
			},
			"id": "AT_027e",
			"name": "Master Summoner",
			"playerClass": "Warlock",
			"set": "Tgt",
			"text": "Costs (0).",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 2,
			"cardImage": "KAR_A10_04.png",
			"cost": 3,
			"fr": {
				"name": "Tour blanche",
				"text": "<b>Attaque automatique_:</b> inflige 2 points de dégâts aux adversaires en face de ce serviteur."
			},
			"health": 6,
			"id": "KAR_A10_04",
			"name": "White Rook",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Auto-Attack:</b> Deal 2 damage to the enemies opposite this minion.",
			"type": "Minion"
		},
		{
			"artist": "Lucas Graciano",
			"attack": 5,
			"cardImage": "EX1_310.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Garde funeste",
				"text": "<b>Charge</b>. <b>Cri de guerre :</b> vous défausse de deux cartes aléatoires."
			},
			"health": 7,
			"id": "EX1_310",
			"name": "Doomguard",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Charge</b>. <b>Battlecry:</b> Discard two random cards.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_DeckRecipe_MyDeckID.png",
			"fr": {
				"name": "ID de mon deck"
			},
			"id": "TB_DeckRecipe_MyDeckID",
			"name": "My Deck ID",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"artist": "Jaime Jones",
			"cardImage": "BRM_001.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Veille solennelle",
				"text": "Vous piochez 2 cartes. Coûte (1) |4(cristal,cristaux) de mana de moins pour chaque serviteur mort pendant ce tour."
			},
			"id": "BRM_001",
			"name": "Solemn Vigil",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Brm",
			"text": "Draw 2 cards. Costs (1) less for each minion that died this turn.",
			"type": "Spell"
		},
		{
			"cardImage": "OG_271e.png",
			"fr": {
				"name": "Visage terrifiant",
				"text": "Attaque augmentée."
			},
			"id": "OG_271e",
			"name": "Terrifying Visage",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Attack increased.",
			"type": "Enchantment"
		},
		{
			"cardImage": "KARA_08_05H.png",
			"cost": 2,
			"fr": {
				"name": "Rugissement terrifiant",
				"text": "Renvoie un serviteur adverse dans la main de votre adversaire."
			},
			"id": "KARA_08_05H",
			"name": "Terrifying Roar",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Return an enemy minion to your opponent's hand.",
			"type": "Spell"
		},
		{
			"artist": "Slawomir Maniak",
			"cardImage": "KARA_12_02.png",
			"cost": 0,
			"fr": {
				"name": "Lignes telluriques",
				"text": "<b>Pouvoir héroïque passif</b>\nLes deux héros ont <b>+3_aux Dégâts des sorts</b>."
			},
			"id": "KARA_12_02",
			"name": "Ley Lines",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "[x]<b>Passive Hero Power</b>\nBoth players have\n<b>Spell Damage +3</b>.",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA10_1.png",
			"fr": {
				"name": "Tranchetripe l’Indompté"
			},
			"health": 30,
			"id": "BRMA10_1",
			"name": "Razorgore the Untamed",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA14_1H.png",
			"fr": {
				"name": "La sentinelle d’acier"
			},
			"health": 30,
			"id": "LOEA14_1H",
			"name": "The Steel Sentinel",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "KARA_00_07.png",
			"cost": 1,
			"fr": {
				"name": "Portail astral",
				"text": "Invoque un serviteur <b>légendaire</b> aléatoire."
			},
			"id": "KARA_00_07",
			"name": "Astral Portal",
			"playerClass": "Mage",
			"set": "Kara",
			"text": "Summon a random <b>Legendary</b> minion.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_295o.png",
			"fr": {
				"name": "Bloc de glace",
				"text": "Votre héros est <b>Insensible</b> pour ce tour."
			},
			"id": "EX1_295o",
			"name": "Ice Block",
			"playerClass": "Mage",
			"set": "Expert1",
			"text": "Your hero is <b>Immune</b> this turn.",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "NAX15_05.png",
			"cost": 0,
			"fr": {
				"name": "M. Bigglesworth",
				"text": "<i>Le chat-chat adoré de Kel’Thuzad.</i>"
			},
			"health": 1,
			"id": "NAX15_05",
			"name": "Mr. Bigglesworth",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "<i>This is Kel'Thuzad's kitty.</i>",
			"type": "Minion"
		},
		{
			"cardImage": "TB_CoOpv3_009.png",
			"cost": 0,
			"fr": {
				"name": "Rune explosive",
				"text": "Invoque une «_rune explosive_»."
			},
			"id": "TB_CoOpv3_009",
			"name": "Explosive Rune",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Summon an 'Explosive Rune.'",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "XXX_024.png",
			"cost": 0,
			"fr": {
				"name": "Damage Reflector",
				"text": "Whenever this minion takes damage, deal 1 damage to ALL other characters."
			},
			"health": 10,
			"id": "XXX_024",
			"name": "Damage Reflector",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Whenever this minion takes damage, deal 1 damage to ALL other characters.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_KTRAF_HP_RAF5.png",
			"cost": 2,
			"fr": {
				"name": "Bâton de l’Origine",
				"text": "Ajoute un serviteur légendaire aléatoire dans votre main. Il coûte (4) cristaux de moins."
			},
			"id": "TB_KTRAF_HP_RAF5",
			"name": "Staff of Origination",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Add a random legendary minion to your hand. It costs (4) less.",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "CRED_12.png",
			"cost": 2,
			"fr": {
				"name": "Rachelle Davis",
				"text": "<b>Cri de guerre :</b> pioche DEUX cartes. <i>Ce n’est pas un ingénieur novice.</i>"
			},
			"health": 2,
			"id": "CRED_12",
			"name": "Rachelle Davis",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Draw TWO cards. <i>She's not a novice engineer.</i>",
			"type": "Minion"
		},
		{
			"artist": "Milivoj Ceran",
			"cardImage": "OG_090.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Grimoire de cabaliste",
				"text": "Place 3 sorts de mage aléatoires dans votre main."
			},
			"id": "OG_090",
			"name": "Cabalist's Tome",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Og",
			"text": "Add 3 random Mage spells to your hand.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpv3_BOSS3e.png",
			"fr": {
				"name": "Assez !",
				"text": "Nefarian est <b>Insensible</b> pendant ce tour."
			},
			"id": "TB_CoOpv3_BOSS3e",
			"name": "Enough!",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Nefarian is <b>Immune</b> this turn.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "EX1_158t.png",
			"cost": 2,
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
			"cardImage": "BRMA17_8H.png",
			"cost": 0,
			"fr": {
				"name": "Frappe de Nefarian",
				"text": "<b>Pouvoir héroïque</b>\nNefarian fait pleuvoir le feu depuis les cieux !"
			},
			"id": "BRMA17_8H",
			"name": "Nefarian Strikes!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nNefarian rains fire from above!",
			"type": "Hero_power"
		},
		{
			"cardImage": "EX1_360e.png",
			"fr": {
				"name": "Humilité",
				"text": "L’Attaque est passée à 1."
			},
			"id": "EX1_360e",
			"name": "Humility",
			"playerClass": "Paladin",
			"set": "Core",
			"text": "Attack has been changed to 1.",
			"type": "Enchantment"
		},
		{
			"artist": "Brian Despain",
			"attack": 2,
			"cardImage": "GVG_027.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Senseï de fer",
				"text": "À la fin de votre tour, donne +2/+2 à un autre Méca allié."
			},
			"health": 2,
			"id": "GVG_027",
			"name": "Iron Sensei",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "At the end of your turn, give another friendly Mech +2/+2.",
			"type": "Minion"
		},
		{
			"artist": "Tom Baxa",
			"cardImage": "EX1_570.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Morsure",
				"text": "Confère +4 ATQ au héros pendant ce tour et +4 Armure."
			},
			"id": "EX1_570",
			"name": "Bite",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Give your hero +4 Attack this turn and 4 Armor.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "KAR_036e.png",
			"fr": {
				"name": "En train de manger",
				"text": "Vie augmentée."
			},
			"id": "KAR_036e",
			"name": "Eating",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA13_1H.png",
			"fr": {
				"name": "Seigneur Victor Nefarius"
			},
			"health": 30,
			"id": "BRMA13_1H",
			"name": "Lord Victor Nefarius",
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "XXX_054.png",
			"cost": 0,
			"fr": {
				"name": "Weapon Buff",
				"text": "Give your Weapon +100/+100"
			},
			"id": "XXX_054",
			"name": "Weapon Buff",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Give your Weapon +100/+100",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_8a.png",
			"fr": {
				"name": "Putréfié",
				"text": "Attaque et vie inversées."
			},
			"id": "LOEA16_8a",
			"name": "Putressed",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Attack and Health swapped.",
			"type": "Enchantment"
		},
		{
			"artist": "Lucas Graciano",
			"cardImage": "EX1_349.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Faveur divine",
				"text": "Vous piochez des cartes jusqu’à en avoir autant en main que votre adversaire."
			},
			"id": "EX1_349",
			"name": "Divine Favor",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Draw cards until you have as many in hand as your opponent.",
			"type": "Spell"
		},
		{
			"artist": "Kan Liu",
			"attack": 8,
			"cardImage": "OG_120.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Anomalus",
				"text": "<b>Râle d’agonie :</b> inflige\n8 points de dégâts à tous les serviteurs."
			},
			"health": 6,
			"id": "OG_120",
			"name": "Anomalus",
			"playerClass": "Mage",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Deathrattle:</b> Deal 8 damage to all minions.",
			"type": "Minion"
		},
		{
			"artist": "Sean McNally",
			"attack": 1,
			"cardImage": "AT_091.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Médecin du tournoi",
				"text": "<b>Exaltation :</b> rend 2 PV à votre héros."
			},
			"health": 8,
			"id": "AT_091",
			"name": "Tournament Medic",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Inspire:</b> Restore 2 Health to your hero.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_84.png",
			"cost": 5,
			"fr": {
				"name": "Lanceur de sorts draconien",
				"text": "<b>Cri de guerre :</b> invoque deux dragonnets 2/2."
			},
			"health": 6,
			"id": "BRMC_84",
			"name": "Dragonkin Spellcaster",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "<b>Battlecry:</b> Summon two 2/2 Whelps.",
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"type": "Minion"
		},
		{
			"cardImage": "OG_174e.png",
			"fr": {
				"name": "Sans-visage",
				"text": "Copie des caractéristiques."
			},
			"id": "OG_174e",
			"name": "Faceless",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "Copying stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Smith",
			"attack": 1,
			"cardImage": "FP1_027.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Gargouille peau-de-pierre",
				"text": "Au début de votre tour, rend tous ses points de vie à ce serviteur."
			},
			"health": 4,
			"id": "FP1_027",
			"name": "Stoneskin Gargoyle",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Naxx",
			"text": "At the start of your turn, restore this minion to full Health.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_622.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Mot de l’ombre : Mort",
				"text": "Détruit un serviteur avec 5 Attaque ou plus."
			},
			"id": "EX1_622",
			"name": "Shadow Word: Death",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Core",
			"text": "Destroy a minion with an Attack of 5 or more.",
			"type": "Spell"
		},
		{
			"artist": "Matt Gaser",
			"attack": 3,
			"cardImage": "GVG_020.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Gangrecanon",
				"text": "À la fin de votre tour, inflige 2 points de dégâts à un serviteur non Méca."
			},
			"health": 5,
			"id": "GVG_020",
			"name": "Fel Cannon",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "At the end of your turn, deal 2 damage to a non-Mech minion.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA02_01h.png",
			"fr": {
				"name": "Zinaar"
			},
			"health": 30,
			"id": "LOEA02_01h",
			"name": "Zinaar",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "CS2_083b.png",
			"cost": 2,
			"fr": {
				"name": "Maîtrise des dagues",
				"text": "<b>Pouvoir héroïque</b>\nVous équipe d’une dague 1/2."
			},
			"id": "CS2_083b",
			"name": "Dagger Mastery",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Hero Power</b>\nEquip a 1/2 Dagger.",
			"type": "Hero_power"
		},
		{
			"cardImage": "BRMA12_2.png",
			"cost": 0,
			"fr": {
				"name": "Affliction de l’espèce",
				"text": "<b>Pouvoir héroïque</b>\nAjoute une carte Affliction de l’espèce dans la main de votre adversaire à la fin de votre tour."
			},
			"id": "BRMA12_2",
			"name": "Brood Affliction",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nAt the end of your turn, add a Brood Affliction card to your opponent's hand.",
			"type": "Hero_power"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
		},
		{
			"cardImage": "NAX12_01H.png",
			"fr": {
				"name": "Gluth"
			},
			"health": 45,
			"id": "NAX12_01H",
			"name": "Gluth",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "AT_044.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Charpie",
				"text": "Détruit un serviteur.\nAjoute un serviteur aléatoire dans la main de votre adversaire."
			},
			"id": "AT_044",
			"name": "Mulch",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Destroy a minion.\nAdd a random minion to your opponent's hand.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA07_02h.png",
			"fr": {
				"name": "Puits de mine"
			},
			"health": 80,
			"id": "LOEA07_02h",
			"name": "Mine Shaft",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"cardImage": "CS2_221e.png",
			"fr": {
				"name": "Ça pique !",
				"text": "Le forgeron malveillant confère +2 ATQ."
			},
			"id": "CS2_221e",
			"name": "Sharp!",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+2 Attack from Spiteful Smith.",
			"type": "Enchantment"
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
			"attack": 0,
			"cardImage": "CS2_051.png",
			"cost": 1,
			"fr": {
				"name": "Totem de griffes de pierre",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "CS2_051",
			"name": "Stoneclaw Totem",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_028t.png",
			"cost": 0,
			"fr": {
				"name": "Pièce de Gallywix",
				"text": "Gagne 1 cristal de mana pendant ce tour seulement. <i>(Ne déclenche pas le pouvoir de Gallywix.)</i>"
			},
			"id": "GVG_028t",
			"name": "Gallywix's Coin",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Gain 1 Mana Crystal this turn only.\n<i>(Won't trigger Gallywix.)</i>",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpv3_BOSS4e.png",
			"fr": {
				"name": "Intimidé",
				"text": "Ne peut pas attaquer pendant ce tour."
			},
			"id": "TB_CoOpv3_BOSS4e",
			"name": "Cowed",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Can't attack this turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA09_3aH.png",
			"fr": {
				"name": "Mort de faim",
				"text": "A vraiment faim."
			},
			"id": "LOEA09_3aH",
			"name": "Famished",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Quite Hungry.",
			"type": "Enchantment"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "OG_176.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Attaque d’ombre",
				"text": "Inflige $5 points de dégâts à un personnage indemne."
			},
			"id": "OG_176",
			"name": "Shadow Strike",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Og",
			"text": "Deal $5 damage to an undamaged character.",
			"type": "Spell"
		},
		{
			"attack": 2,
			"cardImage": "NEW1_040t.png",
			"cost": 2,
			"fr": {
				"name": "Gnoll",
				"text": "<b>Provocation</b>"
			},
			"health": 2,
			"id": "NEW1_040t",
			"name": "Gnoll",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_39.png",
			"cost": 2,
			"fr": {
				"name": "Ryan Chew",
				"text": "<b>Chew des armes :</b> chante au karaoké ou part à l’heure et en informe tout le monde."
			},
			"health": 3,
			"id": "CRED_39",
			"name": "Ryan Chew",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Chews One</b> - Sing karaoke; or Leave on time and tell everyone about it.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_043e.png",
			"fr": {
				"name": "Glaivezooka",
				"text": "+1 ATQ."
			},
			"id": "GVG_043e",
			"name": "Glaivezooka",
			"playerClass": "Hunter",
			"set": "Gvg",
			"text": "+1 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "KAR_003b.png",
			"cost": 0,
			"fr": {
				"name": "Coalesce the Moonlight",
				"text": "Summon a 10/10 Lunar Elemental."
			},
			"id": "KAR_003b",
			"name": "Coalesce the Moonlight",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Kara_reserve",
			"text": "Summon a 10/10 Lunar Elemental.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA06_04h.png",
			"cost": 2,
			"fr": {
				"name": "Pulsion destructrice",
				"text": "Détruit toutes les statues. Inflige 3_points de dégâts pour chaque statue détruite."
			},
			"id": "LOEA06_04h",
			"name": "Shattering Spree",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Destroy all Statues. For each destroyed, deal 3 damage.",
			"type": "Spell"
		},
		{
			"artist": "Ariel Olivetti",
			"cardImage": "EX1_124.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Éviscération",
				"text": "Inflige $2 |4(point,points) de dégâts. <b>Combo :</b> inflige $4 |4(point,points) de dégâts à la place."
			},
			"id": "EX1_124",
			"name": "Eviscerate",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Deal $2 damage. <b>Combo:</b> Deal $4 damage instead.",
			"type": "Spell"
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
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_048e.png",
			"fr": {
				"name": "Dents de métal",
				"text": "+2 ATQ."
			},
			"id": "GVG_048e",
			"name": "Metal Teeth",
			"playerClass": "Hunter",
			"set": "Gvg",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "KARA_07_03heroic.png",
			"cost": 1,
			"fr": {
				"name": "Murlocs en fuite !",
				"text": "Invoque deux murlocs aléatoires."
			},
			"id": "KARA_07_03heroic",
			"name": "Murlocs Escaping!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon two random Murlocs.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA14_2H.png",
			"cost": 0,
			"fr": {
				"name": "Activer Arcanotron",
				"text": "<b>Pouvoir héroïque</b>\nActive Arcanotron !"
			},
			"id": "BRMA14_2H",
			"name": "Activate Arcanotron",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Hero Power</b>\nActivate Arcanotron!",
			"type": "Hero_power"
		},
		{
			"attack": 1,
			"cardImage": "XXX_099.png",
			"cost": 0,
			"fr": {
				"name": "AI Helper Buddy",
				"text": "Get the AI ready for testing."
			},
			"health": 1,
			"id": "XXX_099",
			"name": "AI Helper Buddy",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Get the AI ready for testing.",
			"type": "Minion"
		},
		{
			"artist": "Sam Nielson",
			"attack": 2,
			"cardImage": "BRM_004.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Dragonnet du Crépuscule",
				"text": "<b>Cri de guerre :</b> gagne +2 PV si vous avez un Dragon en main."
			},
			"health": 1,
			"id": "BRM_004",
			"name": "Twilight Whelp",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Brm",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, gain +2 Health.",
			"type": "Minion"
		},
		{
			"artist": "Mike Hayes",
			"cardImage": "GVG_061.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Régiment de bataille",
				"text": "Invoque trois recrues de la Main d’argent 1/1. Équipe une arme 1/4."
			},
			"id": "GVG_061",
			"name": "Muster for Battle",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Summon three 1/1 Silver Hand Recruits. Equip a 1/4 Weapon.",
			"type": "Spell"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_19H.png",
			"cost": 10,
			"fr": {
				"name": "Écumeur du soleil Phaerix",
				"text": "Vos autres serviteurs sont <b>Insensibles</b>."
			},
			"health": 10,
			"id": "LOEA16_19H",
			"name": "Sun Raider Phaerix",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Loe",
			"text": "Your other minions are <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"artist": "L. Lullabi & A.Thawornsathitwong",
			"cardImage": "KAR_A02_09.png",
			"cost": 4,
			"fr": {
				"name": "Mettre la table",
				"text": "Donne +1/+1 à vos assiettes."
			},
			"id": "KAR_A02_09",
			"name": "Set the Table",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Give your Plates +1/+1.",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_022a.png",
			"fr": {
				"name": "Huile d’affûtage de Bricoleur",
				"text": "+3 ATQ."
			},
			"id": "GVG_022a",
			"name": "Tinker's Sharpsword Oil",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX13_03.png",
			"cost": 2,
			"fr": {
				"name": "Supercharge",
				"text": "Confère +2 PV à vos serviteurs."
			},
			"id": "NAX13_03",
			"name": "Supercharge",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "Give your minions +2 Health.",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"attack": 8,
			"cardImage": "OG_229.png",
			"collectible": true,
			"cost": 8,
			"fr": {
				"name": "Ragnaros, porteur de Lumière",
				"text": "À la fin de votre tour, rend 8 PV à un personnage allié blessé."
			},
			"health": 8,
			"id": "OG_229",
			"name": "Ragnaros, Lightlord",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "Og",
			"text": "At the end of your turn, restore 8 Health to a damaged friendly character.",
			"type": "Minion"
		},
		{
			"artist": "Ben Zhang",
			"attack": 3,
			"cardImage": "LOE_050.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Raptor de monte",
				"text": "<b>Râle d’agonie :</b> invoque un serviteur aléatoire coûtant 1 cristal."
			},
			"health": 2,
			"id": "LOE_050",
			"name": "Mounted Raptor",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Deathrattle:</b> Summon a random 1-Cost minion.",
			"type": "Minion"
		},
		{
			"cardImage": "DS1h_292_H1.png",
			"cost": 2,
			"fr": {
				"name": "Tir assuré",
				"text": "<b>Pouvoir héroïque</b>\nInflige $2 points de dégâts au héros adverse."
			},
			"id": "DS1h_292_H1",
			"name": "Steady Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Hero_skins",
			"text": "<b>Hero Power</b>\nDeal $2 damage to the enemy hero.",
			"type": "Hero_power"
		},
		{
			"artist": "Peet Cooper",
			"attack": 2,
			"cardImage": "GVG_067.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Trogg brisepierre",
				"text": "Chaque fois que votre adversaire lance un sort, gagne +1 ATQ."
			},
			"health": 3,
			"id": "GVG_067",
			"name": "Stonesplinter Trogg",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "Whenever your opponent casts a spell, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_059.png",
			"cost": 0,
			"fr": {
				"name": "Destroy Hero's Stuff",
				"text": "Destroy target hero's hero power, weapon, deck, hand, minions, and secrets."
			},
			"id": "XXX_059",
			"name": "Destroy Hero's Stuff",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Destroy target hero's hero power, weapon, deck, hand, minions, and secrets.",
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
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_041c.png",
			"fr": {
				"name": "Sombres feux follets",
				"text": "+5/+5 et <b>Provocation</b>."
			},
			"id": "GVG_041c",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"set": "Gvg",
			"text": "+5/+5 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TU4c_008e.png",
			"fr": {
				"name": "Puissance de Mukla",
				"text": "Le roi Mukla a +8 en Attaque pendant ce tour."
			},
			"id": "TU4c_008e",
			"name": "Might of Mukla",
			"playerClass": "Neutral",
			"set": "Missions",
			"text": "King Mukla has +8 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "EX1_506.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Chasse-marée murloc",
				"text": "<b>Cri de guerre :</b> invoque un éclaireur murloc 1/1."
			},
			"health": 1,
			"id": "EX1_506",
			"name": "Murloc Tidehunter",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Summon a 1/1 Murloc Scout.",
			"type": "Minion"
		},
		{
			"artist": "Jomaro Kindred",
			"attack": 3,
			"cardImage": "GVG_119.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Bling-o-tron 3000",
				"text": "<b>Cri de guerre :</b> équipe chaque joueur d’une arme aléatoire."
			},
			"health": 4,
			"id": "GVG_119",
			"name": "Blingtron 3000",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Equip a random weapon for each player.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "XXX_094.png",
			"cost": 0,
			"fr": {
				"name": "AI Buddy - Blank Slate",
				"text": "Spawn into play to clear the entire board, both hands, both decks, all mana and all secrets."
			},
			"health": 1,
			"id": "XXX_094",
			"name": "AI Buddy - Blank Slate",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Spawn into play to clear the entire board, both hands, both decks, all mana and all secrets.",
			"type": "Minion"
		},
		{
			"artist": "L. Lullabi & C. Luechaiwattasopon",
			"cardImage": "KAR_A02_11.png",
			"cost": 5,
			"fr": {
				"name": "Lancer d’assiettes",
				"text": "Invoque cinq assiettes_1/1."
			},
			"id": "KAR_A02_11",
			"name": "Tossing Plates",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon five 1/1 Plates.",
			"type": "Spell"
		},
		{
			"cardImage": "OG_150e.png",
			"fr": {
				"name": "Enragé",
				"text": "+2 ATQ."
			},
			"id": "OG_150e",
			"name": "Enraged",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 1,
			"cardImage": "LOE_029.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Scarabée orné de joyaux",
				"text": "<b>Cri de guerre : découvre</b>\nune carte à 3 cristaux de mana."
			},
			"health": 1,
			"id": "LOE_029",
			"name": "Jeweled Scarab",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Loe",
			"text": "<b>Battlecry: Discover</b> a\n3-Cost card.",
			"type": "Minion"
		},
		{
			"artist": "Popo Wei",
			"attack": 4,
			"cardImage": "EX1_612.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Mage du Kirin Tor",
				"text": "<b>Cri de guerre :</b> le prochain <b>Secret</b> que vous jouez ce tour-ci coûte (0)."
			},
			"health": 3,
			"id": "EX1_612",
			"name": "Kirin Tor Mage",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> The next <b>Secret</b> you play this turn costs (0).",
			"type": "Minion"
		},
		{
			"artist": "Arthur Gimaldinov",
			"attack": 2,
			"cardImage": "EX1_103.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Voyant froide-lumière",
				"text": "<b>Cri de guerre :</b> donne +2 PV à TOUS les autres murlocs."
			},
			"health": 3,
			"id": "EX1_103",
			"name": "Coldlight Seer",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give ALL other Murlocs +2 Health.",
			"type": "Minion"
		},
		{
			"artist": "Blizzard Cinematics",
			"attack": 1,
			"cardImage": "NEW1_012.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Wyrm de mana",
				"text": "Chaque fois que vous lancez un sort, gagne +1 ATQ."
			},
			"health": 3,
			"id": "NEW1_012",
			"name": "Mana Wyrm",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Whenever you cast a spell, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Laurel Austin",
			"attack": 2,
			"cardImage": "AT_038.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Aspirante de Darnassus",
				"text": "<b>Cri de guerre :</b> gagne un cristal de mana vide.\n<b>Râle d’agonie :</b> perd un cristal de mana."
			},
			"health": 3,
			"id": "AT_038",
			"name": "Darnassus Aspirant",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Gain an empty Mana Crystal.\n<b>Deathrattle:</b> Lose a Mana Crystal.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX6_02H.png",
			"cost": 0,
			"fr": {
				"name": "Aura nécrotique",
				"text": "<b>Pouvoir héroïque</b>\nInflige 3 points de dégâts au héros adverse."
			},
			"id": "NAX6_02H",
			"name": "Necrotic Aura",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDeal 3 damage to the enemy hero.",
			"type": "Hero_power"
		},
		{
			"artist": "Sunny Gho",
			"attack": 5,
			"cardImage": "EX1_014.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Roi Mukla",
				"text": "<b>Cri de guerre :</b> donne 2 bananes à votre adversaire."
			},
			"health": 5,
			"id": "EX1_014",
			"name": "King Mukla",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Give your opponent 2 Bananas.",
			"type": "Minion"
		},
		{
			"artist": "Dan Brereton",
			"attack": 1,
			"cardImage": "FP1_011.png",
			"collectible": true,
			"cost": 1,
			"fr": {
				"name": "Tisseuse",
				"text": "<b>Râle d’agonie :</b> ajoute une carte Bête aléatoire dans votre main."
			},
			"health": 1,
			"id": "FP1_011",
			"name": "Webspinner",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> Add a random Beast card to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "PRO_001c.png",
			"cost": 4,
			"fr": {
				"name": "Puissance de la Horde",
				"text": "Invoque un guerrier de la Horde aléatoire."
			},
			"id": "PRO_001c",
			"name": "Power of the Horde",
			"playerClass": "Neutral",
			"set": "Promo",
			"text": "Summon a random Horde Warrior.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_382e.png",
			"fr": {
				"name": "Du calme !",
				"text": "L’Attaque est passée à 1."
			},
			"id": "EX1_382e",
			"name": "Stand Down!",
			"playerClass": "Paladin",
			"set": "Expert1",
			"text": "Attack changed to 1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "CS2_181e.png",
			"fr": {
				"name": "En pleine forme",
				"text": "Ce serviteur a +2 ATQ."
			},
			"id": "CS2_181e",
			"name": "Full Strength",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "This minion has +2 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "AT_019.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Destrier de l’effroi",
				"text": "<b>Râle d’agonie :</b> invoque un destrier de l’effroi."
			},
			"health": 1,
			"id": "AT_019",
			"name": "Dreadsteed",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "<b>Deathrattle:</b> Summon a Dreadsteed.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 0,
			"cardImage": "KAR_A10_06.png",
			"cost": 3,
			"fr": {
				"name": "Fou noir",
				"text": "<b>Attaque automatique_:</b> rend 2_PV aux serviteurs adjacents."
			},
			"health": 6,
			"id": "KAR_A10_06",
			"name": "Black Bishop",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "<b>Auto-Attack:</b> Restore 2 Health to adjacent minions.",
			"type": "Minion"
		},
		{
			"cardImage": "TU4d_003.png",
			"cost": 2,
			"fr": {
				"name": "Coup de fusil",
				"text": "<b>Pouvoir héroïque</b>\nInflige 1 point de dégâts."
			},
			"id": "TU4d_003",
			"name": "Shotgun Blast",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Missions",
			"text": "<b>Hero Power</b>\nDeal 1 damage.",
			"type": "Hero_power"
		},
		{
			"cardImage": "GAME_003.png",
			"fr": {
				"name": "Vengeance de la pièce",
				"text": "Passer en second renforce votre premier serviteur."
			},
			"id": "GAME_003",
			"name": "Coin's Vengeance",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "Going second makes your first minion stronger.",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "TU4f_007.png",
			"cost": 1,
			"fr": {
				"name": "Singe cinglé",
				"text": "<b>Cri de guerre :</b> lance des bananes."
			},
			"health": 2,
			"id": "TU4f_007",
			"name": "Crazy Monkey",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "<b>Battlecry:</b> Throw Bananas.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_052.png",
			"cost": 0,
			"fr": {
				"name": "Grant Mega-Windfury",
				"text": "Give a minion <b>Mega-Windfury</b>."
			},
			"id": "XXX_052",
			"name": "Grant Mega-Windfury",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Give a minion <b>Mega-Windfury</b>.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "CS2_117.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Prophète du Cercle terrestre",
				"text": "<b>Cri de guerre :</b> rend 3 points de vie."
			},
			"health": 3,
			"id": "CS2_117",
			"name": "Earthen Ring Farseer",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Restore 3 Health.",
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"type": "Weapon"
		},
		{
			"cardImage": "XXX_107.png",
			"cost": 0,
			"fr": {
				"name": "Set Health to 1",
				"text": "Set a character's health to 1, and remove all armour."
			},
			"id": "XXX_107",
			"name": "Set Health to 1",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Set a character's health to 1, and remove all armour.",
			"type": "Spell"
		},
		{
			"artist": "Hideaki Takamura",
			"cardImage": "OG_086.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Flamme interdite",
				"text": "Dépense tous vos cristaux de mana. Inflige l’équivalent sous forme de dégâts à un serviteur."
			},
			"id": "OG_086",
			"name": "Forbidden Flame",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Og",
			"text": "Spend all your Mana. Deal that much damage to a minion.",
			"type": "Spell"
		},
		{
			"artist": "Mike Sass",
			"attack": 6,
			"cardImage": "GVG_118.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Troggzor le Terreminator",
				"text": "Chaque fois que votre adversaire lance un sort, invoque un trogg mâcheroc mastoc."
			},
			"health": 6,
			"id": "GVG_118",
			"name": "Troggzor the Earthinator",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Gvg",
			"text": "Whenever your opponent casts a spell, summon a Burly Rockjaw Trogg.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_117e.png",
			"fr": {
				"name": "Cérémonie",
				"text": "+2/+2."
			},
			"id": "AT_117e",
			"name": "Ceremony",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "KAR_114e.png",
			"fr": {
				"name": "Impression incroyable",
				"text": "Attaque et Vie portées à 1."
			},
			"id": "KAR_114e",
			"name": "Incredible Impression",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Attack and Health set to 1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_CoOpBossSpell_4.png",
			"cost": 0,
			"fr": {
				"name": "Suralimenter",
				"text": "Gagne 2 ATQ."
			},
			"id": "TB_CoOpBossSpell_4",
			"name": "Overclock",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Gain 2 Attack.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"attack": 3,
			"cardImage": "OG_145.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Psych-o-tron",
				"text": "<b>Provocation</b>\n<b>Bouclier divin</b>"
			},
			"health": 4,
			"id": "OG_145",
			"name": "Psych-o-Tron",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Taunt</b>\n<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "tt_010a.png",
			"cost": 1,
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
			"attack": 0,
			"cardImage": "TU4c_003.png",
			"cost": 0,
			"fr": {
				"name": "Tonneau",
				"text": "Il y a quelque chose dans ce tonneau ?"
			},
			"health": 2,
			"id": "TU4c_003",
			"name": "Barrel",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Missions",
			"text": "Is something in this barrel?",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 6,
			"cardImage": "AT_041.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Chevalier des étendues sauvages",
				"text": "Chaque fois que vous invoquez une Bête, réduit le coût de cette carte de (1) |4(cristal,cristaux)."
			},
			"health": 6,
			"id": "AT_041",
			"name": "Knight of the Wild",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "Whenever you summon a Beast, reduce the Cost of this card by (1).",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"attack": 1,
			"cardImage": "LOEA09_4H.png",
			"cost": 1,
			"durability": 2,
			"fr": {
				"name": "Lance rare",
				"text": "Gagne +1/+1 chaque fois que votre adversaire joue une carte rare."
			},
			"id": "LOEA09_4H",
			"name": "Rare Spear",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Whenever your opponent plays a Rare card, gain +1/+1.",
			"type": "Weapon"
		},
		{
			"cardImage": "GVG_011a.png",
			"fr": {
				"name": "Rayon réducteur",
				"text": "-2 ATQ pendant ce tour."
			},
			"id": "GVG_011a",
			"name": "Shrink Ray",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "-2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 4,
			"cardImage": "LOE_053.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Djinn des zéphirs",
				"text": "Lorsque vous lancez un sort sur un autre serviteur allié, en lance une copie sur le djinn."
			},
			"health": 6,
			"id": "LOE_053",
			"name": "Djinni of Zephyrs",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Loe",
			"text": "After you cast a spell on another friendly minion, cast a copy of it on this one.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_999_Crash.png",
			"cost": 0,
			"fr": {
				"name": "Crash the server",
				"text": "Crash the server"
			},
			"id": "XXX_999_Crash",
			"name": "Crash the server",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Crash the server",
			"type": "Spell"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 2,
			"cardImage": "CS2_142.png",
			"collectible": true,
			"cost": 2,
			"faction": "HORDE",
			"fr": {
				"name": "Géomancien kobold",
				"text": "<b>Dégâts des sorts : +1</b>"
			},
			"health": 2,
			"id": "CS2_142",
			"name": "Kobold Geomancer",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"spellDamage": 1,
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"artist": "Danny Beck",
			"attack": 4,
			"cardImage": "GVG_025.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Tricheur borgne",
				"text": "Chaque fois que vous jouez un pirate, gagne <b>Camouflage</b>."
			},
			"health": 1,
			"id": "GVG_025",
			"name": "One-eyed Cheat",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Whenever you summon a Pirate, gain <b>Stealth</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "KAR_A02_06e2.png",
			"fr": {
				"name": "Rempli",
				"text": "+2/+2."
			},
			"id": "KAR_A02_06e2",
			"name": "Filled Up",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "NAX9_02H.png",
			"cost": 3,
			"fr": {
				"name": "Dame Blaumeux",
				"text": "Votre héros est <b>Insensible</b>."
			},
			"health": 7,
			"id": "NAX9_02H",
			"name": "Lady Blaumeux",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "Your hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"artist": "Tom Fleming",
			"attack": 2,
			"cardImage": "EX1_059.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Alchimiste dément",
				"text": "<b>Cri de guerre :</b> échange l’Attaque et la Vie d’un serviteur."
			},
			"health": 2,
			"id": "EX1_059",
			"name": "Crazed Alchemist",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> Swap the Attack and Health of a minion.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "KARA_06_01heroic.png",
			"cost": 3,
			"fr": {
				"name": "Romulo",
				"text": "Julianne est <b>Insensible</b>."
			},
			"health": 2,
			"id": "KARA_06_01heroic",
			"name": "Romulo",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Julianne is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_CoOpv3_005.png",
			"cost": 0,
			"fr": {
				"name": "Enchaînement",
				"text": "Inflige 4 points de dégâts à un serviteur et à son propriétaire."
			},
			"id": "TB_CoOpv3_005",
			"name": "Cleave",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Deal 4 damage to a minion and its owner.",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "GVG_029.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Appel des ancêtres",
				"text": "Prend un serviteur aléatoire dans la main de chaque joueur et les pose sur le champ de bataille."
			},
			"id": "GVG_029",
			"name": "Ancestor's Call",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Put a random minion from each player's hand into the battlefield.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_093e.png",
			"fr": {
				"name": "Main d’Argus",
				"text": "+1/+1 et <b>Provocation</b>."
			},
			"id": "EX1_093e",
			"name": "Hand of Argus",
			"playerClass": "Neutral",
			"set": "Expert1",
			"text": "+1/+1 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_063.png",
			"cost": 0,
			"fr": {
				"name": "Destroy ALL Secrets",
				"text": "Destroy all <b>Secrets:</b>."
			},
			"id": "XXX_063",
			"name": "Destroy ALL Secrets",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Destroy all <b>Secrets:</b>.",
			"type": "Spell"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "EX1_544.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Fusée éclairante",
				"text": "Tous les serviteurs perdent le <b>Camouflage</b>. Détruit tous les <b>Secrets</b> adverses. Vous piochez une carte."
			},
			"id": "EX1_544",
			"name": "Flare",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "All minions lose <b>Stealth</b>. Destroy all enemy <b>Secrets</b>. Draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_001e.png",
			"fr": {
				"name": "Fondre",
				"text": "L’Attaque passe à 0 pendant ce tour."
			},
			"id": "BRM_001e",
			"name": "Melt",
			"playerClass": "Priest",
			"set": "Brm",
			"text": "Attack changed to 0 this turn.",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "BRMA14_5H.png",
			"cost": 1,
			"fr": {
				"name": "Toxitron",
				"text": "Inflige 1 point de dégâts à tous les autres serviteurs au début de votre tour."
			},
			"health": 4,
			"id": "BRMA14_5H",
			"name": "Toxitron",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Brm",
			"text": "At the start of your turn, deal 1 damage to all other minions.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA10_5.png",
			"cost": 5,
			"fr": {
				"name": "Mrgl mrgl niah niah !",
				"text": "Invoque 3 murlocs détruits pendant cette partie."
			},
			"id": "LOEA10_5",
			"name": "Mrgl Mrgl Nyah Nyah",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Loe",
			"text": "Summon 3 Murlocs that died this game.",
			"type": "Spell"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 1,
			"cardImage": "GVG_098.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Infanterie de Gnomeregan",
				"text": "<b>Charge</b>\n<b>Provocation</b>"
			},
			"health": 4,
			"id": "GVG_098",
			"name": "Gnomeregan Infantry",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Gvg",
			"text": "<b>Charge</b>\n<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"cardImage": "CS2_029.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Boule de feu",
				"text": "Inflige $6 |4(point,points) de dégâts."
			},
			"id": "CS2_029",
			"name": "Fireball",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Core",
			"text": "Deal $6 damage.",
			"type": "Spell"
		},
		{
			"artist": "E.M. Gist",
			"attack": 6,
			"cardImage": "CS2_162.png",
			"collectible": true,
			"cost": 6,
			"faction": "ALLIANCE",
			"fr": {
				"name": "Seigneur de l’arène",
				"text": "<b>Provocation</b>"
			},
			"health": 5,
			"id": "CS2_162",
			"name": "Lord of the Arena",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "Mekka4t.png",
			"cost": 0,
			"fr": {
				"name": "Poulet",
				"text": "<i>Viens mon poulet !</i>"
			},
			"health": 1,
			"id": "Mekka4t",
			"name": "Chicken",
			"playerClass": "Neutral",
			"set": "Promo",
			"text": "<i>Hey Chicken!</i>",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 5,
			"cardImage": "OG_152.png",
			"collectible": true,
			"cost": 7,
			"fr": {
				"name": "Faucon-dragon difforme",
				"text": "<b>Furie des vents</b>"
			},
			"health": 5,
			"id": "OG_152",
			"name": "Grotesque Dragonhawk",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"artist": "Phroi Gardner",
			"attack": 3,
			"cardImage": "OG_310.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Régisseuse de Sombre-Comté",
				"text": "Quand vous invoquez un serviteur à 1 PV, lui donne <b>Bouclier divin</b>."
			},
			"health": 3,
			"id": "OG_310",
			"name": "Steward of Darkshire",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Og",
			"text": "Whenever you summon a 1-Health minion, give it <b>Divine Shield</b>.",
			"type": "Minion"
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
			"cardImage": "OG_256e.png",
			"fr": {
				"name": "Poisseux",
				"text": "+1/+1."
			},
			"id": "OG_256e",
			"name": "Slimed",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Brian Despain",
			"attack": 2,
			"cardImage": "EX1_556.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Golem des moissons",
				"text": "<b>Râle d’agonie :</b> invoque un golem endommagé 2/1."
			},
			"health": 3,
			"id": "EX1_556",
			"name": "Harvest Golem",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Deathrattle:</b> Summon a 2/1 Damaged Golem.",
			"type": "Minion"
		},
		{
			"artist": "Jeff Easley",
			"attack": 1,
			"cardImage": "AT_116.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Agent du Repos du ver",
				"text": "<b>Cri de guerre :</b> gagne\n+1 ATQ et <b>Provocation</b> si vous avez un Dragon en main."
			},
			"health": 4,
			"id": "AT_116",
			"name": "Wyrmrest Agent",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1 Attack and <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "OG_101.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Mutation interdite",
				"text": "Dépense tous vos cristaux de mana. Invoque un serviteur aléatoire de même coût."
			},
			"id": "OG_101",
			"name": "Forbidden Shaping",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Og",
			"text": "Spend all your Mana. Summon a random minion that costs that much.",
			"type": "Spell"
		},
		{
			"cardImage": "KARA_09_03heroic.png",
			"cost": 2,
			"fr": {
				"name": "Des diablotins !",
				"text": "Invoque 2 diablotins dégoûtants."
			},
			"id": "KARA_09_03heroic",
			"name": "Many Imps!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon 2 Icky Imps.",
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
				"name": "Limon des marais acide",
				"text": "<b>Cri de guerre :</b> détruit l’arme de votre adversaire."
			},
			"health": 2,
			"id": "EX1_066",
			"name": "Acidic Swamp Ooze",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Destroy your opponent's weapon.",
			"type": "Minion"
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
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Minion"
		},
		{
			"cardImage": "AT_024e.png",
			"fr": {
				"name": "Sombre fusion",
				"text": "+3/+3."
			},
			"id": "AT_024e",
			"name": "Dark Fusion",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "+3/+3.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA15_3.png",
			"cost": 2,
			"fr": {
				"name": "Libérer les aberrations",
				"text": "Invoque 3 aberrations."
			},
			"id": "BRMA15_3",
			"name": "Release the Aberrations!",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Summon 3 Aberrations.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMC_100.png",
			"cost": 3,
			"fr": {
				"name": "Bombe vivante",
				"text": "Choisissez un serviteur adverse. Inflige 5 points de dégâts à tous les adversaires s’il survit jusqu’à votre prochain tour."
			},
			"id": "BRMC_100",
			"name": "Living Bomb",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Choose an enemy minion. If it lives until your next turn, deal 5 damage to all enemies.",
			"type": "Spell"
		},
		{
			"artist": "Matt Gaser",
			"cardImage": "EX1_611.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Piège givrant",
				"text": "<b>Secret :</b> quand un serviteur adverse attaque, le renvoie dans la main de son propriétaire et il coûte désormais (2) cristaux de plus."
			},
			"id": "EX1_611",
			"name": "Freezing Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Secret:</b> When an enemy minion attacks, return it to its owner's hand and it costs (2) more.",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_023a.png",
			"fr": {
				"name": "Lame affûtée",
				"text": "+1 ATQ."
			},
			"id": "GVG_023a",
			"name": "Extra Sharp",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "+1 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Doug Alexander",
			"attack": 3,
			"cardImage": "EX1_591.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Prêtresse auchenaï",
				"text": "Vos cartes et pouvoirs rendant de la Vie infligent désormais des dégâts à la place."
			},
			"health": 5,
			"id": "EX1_591",
			"name": "Auchenai Soulpriest",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Your cards and powers that restore Health now deal damage instead.",
			"type": "Minion"
		},
		{
			"cardImage": "TP_Bling_HP2.png",
			"cost": 2,
			"fr": {
				"name": "Encaissement",
				"text": "Détruit votre arme et vous en donne une nouvelle au hasard."
			},
			"id": "TP_Bling_HP2",
			"name": "Cash In",
			"playerClass": "Rogue",
			"set": "Tb",
			"text": "Destroy your weapon, gaining a random one.",
			"type": "Hero_power"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_145.png",
			"collectible": true,
			"cost": 0,
			"fr": {
				"name": "Préparation",
				"text": "Le prochain sort que vous lancez pendant ce tour coûte (3) cristaux de moins."
			},
			"id": "EX1_145",
			"name": "Preparation",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "The next spell you cast this turn costs (3) less.",
			"type": "Spell"
		},
		{
			"cardImage": "TU4f_006o.png",
			"fr": {
				"name": "Transcendance",
				"text": "Cho ne peut pas être attaqué tant qu’il a des serviteurs."
			},
			"id": "TU4f_006o",
			"name": "Transcendence",
			"playerClass": "Neutral",
			"set": "Missions",
			"text": "Until you kill Cho's minions, he can't be attacked.",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_028.png",
			"cost": 0,
			"fr": {
				"name": "Reveal Hand"
			},
			"id": "XXX_028",
			"name": "Reveal Hand",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"type": "Spell"
		},
		{
			"cardImage": "NAX7_03.png",
			"cost": 2,
			"fr": {
				"name": "Frappe déséquilibrante",
				"text": "<b>Pouvoir héroïque</b>\nInflige 3 points de dégâts."
			},
			"id": "NAX7_03",
			"name": "Unbalancing Strike",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nDeal 3 damage.",
			"type": "Hero_power"
		},
		{
			"attack": 4,
			"cardImage": "BRMA13_7.png",
			"cost": 0,
			"fr": {
				"name": "Cendres tourbillonnantes",
				"text": "<b>Furie des vents</b>"
			},
			"health": 5,
			"id": "BRMA13_7",
			"name": "Whirling Ash",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"artist": "Joe Wilson",
			"attack": 2,
			"cardImage": "AT_077.png",
			"collectible": true,
			"cost": 2,
			"durability": 2,
			"fr": {
				"name": "Lance d’Argent",
				"text": "<b>Cri de guerre :</b> révèle un serviteur de chaque deck. Si le vôtre coûte plus, gagne +1 Durabilité."
			},
			"id": "AT_077",
			"name": "Argent Lance",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, +1 Durability.",
			"type": "Weapon"
		},
		{
			"artist": "Matt Dixon",
			"cardImage": "AT_061.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Prêt à tirer",
				"text": "Chaque fois que vous lancez un sort pendant ce tour, ajoute une carte chasseur aléatoire dans votre main."
			},
			"id": "AT_061",
			"name": "Lock and Load",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Each time you cast a spell this turn, add a random Hunter card to your hand.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_101.png",
			"cost": 0,
			"fr": {
				"name": "Set health to full",
				"text": "Set a character's health to full, and removes armour."
			},
			"id": "XXX_101",
			"name": "Set health to full",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Set a character's health to full, and removes armour.",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "CS2_197.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Ogre-magi",
				"text": "<b>Dégâts des sorts : +1</b>"
			},
			"health": 4,
			"id": "CS2_197",
			"name": "Ogre Magi",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"spellDamage": 1,
			"text": "<b>Spell Damage +1</b>",
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
				"name": "Chasseuse de Tranchebauge",
				"text": "<b>Cri de guerre :</b> invoque un sanglier 1/1."
			},
			"health": 3,
			"id": "CS2_196",
			"name": "Razorfen Hunter",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Core",
			"text": "<b>Battlecry:</b> Summon a 1/1 Boar.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "NAX8_05t.png",
			"cost": 5,
			"fr": {
				"name": "Cavalier spectral",
				"text": "Au début de votre tour, inflige 1 point de dégâts à votre héros."
			},
			"health": 6,
			"id": "NAX8_05t",
			"name": "Spectral Rider",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "At the start of your turn, deal 1 damage to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Scott Altmann",
			"cardImage": "EX1_581.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Assommer",
				"text": "Renvoie un serviteur adverse dans la main de votre adversaire."
			},
			"id": "EX1_581",
			"name": "Sap",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Core",
			"text": "Return an enemy minion to your opponent's hand.",
			"type": "Spell"
		},
		{
			"artist": "Joe Wilson",
			"cardImage": "OG_080e.png",
			"cost": 1,
			"fr": {
				"name": "Toxine de pâlerette",
				"text": "Confère <b>Camouflage</b> à un serviteur allié jusqu’à votre prochain tour."
			},
			"id": "OG_080e",
			"name": "Fadeleaf Toxin",
			"playerClass": "Rogue",
			"set": "Og",
			"text": "Give a friendly minion <b>Stealth</b> until your next turn.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 0,
			"cardImage": "NEW1_021.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Auspice funeste",
				"text": "Au début de votre tour, détruit TOUS les serviteurs."
			},
			"health": 7,
			"id": "NEW1_021",
			"name": "Doomsayer",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Expert1",
			"text": "At the start of your turn, destroy ALL minions.",
			"type": "Minion"
		},
		{
			"artist": "Matt Gaser",
			"attack": 2,
			"cardImage": "EX1_258.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Élémentaire délié",
				"text": "Chaque fois que vous jouez une carte avec <b>Surcharge</b>, gagne +1/+1."
			},
			"health": 4,
			"id": "EX1_258",
			"name": "Unbound Elemental",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Expert1",
			"text": "Whenever you play a card with <b>Overload</b>, gain +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX3_01H.png",
			"fr": {
				"name": "Maexxna"
			},
			"health": 45,
			"id": "NAX3_01H",
			"name": "Maexxna",
			"playerClass": "Neutral",
			"set": "Naxx",
			"type": "Hero"
		},
		{
			"artist": "Jaemin Kim",
			"cardImage": "GVG_045.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Éruption de diablotins",
				"text": "Inflige $2 à $4 points de dégâts à un serviteur. Invoque un diablotin 1/1 pour chaque point de dégâts infligé."
			},
			"id": "GVG_045",
			"name": "Imp-losion",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "Deal $2-$4 damage to a minion. Summon a 1/1 Imp for each damage dealt.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "GVG_053.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Vierge guerrière",
				"text": "<b>Cri de guerre :</b> gagne 5 points d’armure."
			},
			"health": 5,
			"id": "GVG_053",
			"name": "Shieldmaiden",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Gvg",
			"text": "<b>Battlecry:</b> Gain 5 Armor.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Minion"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "GVG_005.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Écho de Medivh",
				"text": "Place une copie de chaque serviteur allié dans votre main."
			},
			"id": "GVG_005",
			"name": "Echo of Medivh",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Gvg",
			"text": "Put a copy of each friendly minion into your hand.",
			"type": "Spell"
		},
		{
			"artist": "Tooth",
			"attack": 3,
			"cardImage": "OG_286.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Ancien du Crépuscule",
				"text": "À la fin de votre tour, donne +1/+1 à votre C’Thun <i>(où qu’il soit)</i>."
			},
			"health": 4,
			"id": "OG_286",
			"name": "Twilight Elder",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Og",
			"text": "At the end of your turn, give your C'Thun +1/+1 <i>(wherever it is).</i>",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA14_11.png",
			"cost": 0,
			"fr": {
				"name": "Recharge",
				"text": "Remplit tous les cristaux de mana vides."
			},
			"id": "BRMA14_11",
			"name": "Recharge",
			"playerClass": "Neutral",
			"set": "Brm",
			"text": "Fill all empty Mana Crystals.",
			"type": "Spell"
		},
		{
			"artist": "Trevor Jacobs",
			"attack": 2,
			"cardImage": "CS2_203.png",
			"collectible": true,
			"cost": 3,
			"faction": "HORDE",
			"fr": {
				"name": "Chouette bec-de-fer",
				"text": "<b>Cri de guerre :</b> réduit au <b>Silence</b> un serviteur."
			},
			"health": 1,
			"id": "CS2_203",
			"name": "Ironbeak Owl",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Expert1",
			"text": "<b>Battlecry:</b> <b>Silence</b> a minion.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "EX1_012.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Mage de sang Thalnos",
				"text": "<b>Dégâts des sorts : +1</b>.\n<b>Râle d’agonie :</b> vous piochez une carte."
			},
			"health": 1,
			"id": "EX1_012",
			"name": "Bloodmage Thalnos",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Expert1",
			"spellDamage": 1,
			"text": "<b>Spell Damage +1</b>. <b>Deathrattle:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"cardImage": "XXX_060.png",
			"cost": 0,
			"fr": {
				"name": "Damage All",
				"text": "Set the Health of a character to 0."
			},
			"id": "XXX_060",
			"name": "Damage All",
			"playerClass": "Neutral",
			"set": "Cheat",
			"text": "Set the Health of a character to 0.",
			"type": "Spell"
		},
		{
			"artist": "Tom Baxa",
			"cardImage": "EX1_537.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Tir explosif",
				"text": "Inflige $5 |4(point,points) de dégâts à un serviteur et $2 |4(point,points) de dégâts aux serviteurs adjacents."
			},
			"id": "EX1_537",
			"name": "Explosive Shot",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Deal $5 damage to a minion and $2 damage to adjacent ones.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 4,
			"cardImage": "AT_117.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Maîtresse de cérémonie",
				"text": "<b>Cri de guerre :</b> gagne\n+2/+2 si vous avez un serviteur avec <b>Dégâts des sorts</b>."
			},
			"health": 2,
			"id": "AT_117",
			"name": "Master of Ceremonies",
			"playerClass": "Neutral",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "<b>Battlecry:</b> If you have a minion with <b>Spell Damage</b>, gain +2/+2.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_619e.png",
			"fr": {
				"name": "Égalité",
				"text": "Les points de vie sont passés à 1."
			},
			"id": "EX1_619e",
			"name": "Equality",
			"playerClass": "Paladin",
			"set": "Expert1",
			"text": "Health changed to 1.",
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
			"playerClass": "Neutral",
			"set": "Brm",
			"type": "Hero"
		},
		{
			"cardImage": "GVG_086e.png",
			"fr": {
				"name": "Armure en plaques",
				"text": "Attaque augmentée."
			},
			"id": "GVG_086e",
			"name": "Armor Plated",
			"playerClass": "Warrior",
			"set": "Gvg",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "GAME_005.png",
			"cost": 0,
			"fr": {
				"name": "La pièce",
				"text": "Confère 1 cristal de mana pendant ce tour uniquement."
			},
			"id": "GAME_005",
			"name": "The Coin",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "Gain 1 Mana Crystal this turn only.",
			"type": "Spell"
		},
		{
			"artist": "Max Grecke",
			"attack": 4,
			"cardImage": "KARA_06_01.png",
			"cost": 4,
			"fr": {
				"name": "Romulo",
				"text": "Julianne est <b>Insensible</b>."
			},
			"health": 2,
			"id": "KARA_06_01",
			"name": "Romulo",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Julianne is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_07_07heroic.png",
			"cost": 3,
			"fr": {
				"name": "Méca détraqué !",
				"text": "Invoque un Méca aléatoire."
			},
			"id": "KARA_07_07heroic",
			"name": "Haywire Mech!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon a random Mech.",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_067a.png",
			"fr": {
				"name": "Magie métabolisée",
				"text": "Attaque augmentée."
			},
			"id": "GVG_067a",
			"name": "Metabolized Magic",
			"playerClass": "Neutral",
			"set": "Gvg",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_SPT_Minion1e.png",
			"fr": {
				"name": "Volonté de Hurlevent",
				"text": "Hurlevent donne de la Vie à cette carte."
			},
			"id": "TB_SPT_Minion1e",
			"name": "Will of Stormwind",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Stormwind is granting this card Health.",
			"type": "Enchantment"
		},
		{
			"artist": "G.Tsai & K. Turovec",
			"attack": 3,
			"cardImage": "KAR_A02_03.png",
			"cost": 3,
			"fr": {
				"name": "Fourchette",
				"text": "Les assiettes ont <b>Charge</b>."
			},
			"health": 1,
			"id": "KAR_A02_03",
			"name": "Fork",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Plates have <b>Charge</b>.",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"cardImage": "KARA_07_03.png",
			"cost": 1,
			"fr": {
				"name": "Murloc en fuite !",
				"text": "Invoque un Murloc aléatoire."
			},
			"id": "KARA_07_03",
			"name": "Murloc Escaping!",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Summon a random Murloc.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_014.png",
			"cost": 0,
			"fr": {
				"name": "Mill 10",
				"text": "Put 10 cards from a hero's deck into his graveyard."
			},
			"id": "XXX_014",
			"name": "Mill 10",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Put 10 cards from a hero's deck into his graveyard.",
			"type": "Spell"
		},
		{
			"artist": "Phill Gonzales",
			"attack": 2,
			"cardImage": "CS2_122.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chef de raid",
				"text": "Vos autres serviteurs ont +1 ATQ."
			},
			"health": 2,
			"id": "CS2_122",
			"name": "Raid Leader",
			"playerClass": "Neutral",
			"rarity": "Free",
			"set": "Core",
			"text": "Your other minions have +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "KARA_06_01e.png",
			"fr": {
				"name": "Un amour fatal",
				"text": "Julianne est <b>Insensible</b>."
			},
			"id": "KARA_06_01e",
			"name": "Death-Marked Love",
			"playerClass": "Neutral",
			"set": "Kara",
			"text": "Julianne is <b>immune</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA04_30a.png",
			"cost": 0,
			"fr": {
				"name": "Prendre le raccourci",
				"text": "Vous vous rapprochez d’un tour de la sortie ! Vous rencontrez un golem de guerre 7/7."
			},
			"id": "LOEA04_30a",
			"name": "Take the Shortcut",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "Get 1 turn closer to the Exit! Encounter a 7/7 War Golem.",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "KARA_09_08_heroic.png",
			"cost": 4,
			"fr": {
				"name": "Kil’rek",
				"text": "<b>Provocation</b>"
			},
			"health": 8,
			"id": "KARA_09_08_heroic",
			"name": "Kil'rek",
			"playerClass": "Warlock",
			"set": "Kara",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "TB_KTRAF_6m.png",
			"cost": 1,
			"fr": {
				"name": "Gelée polluée",
				"text": "Détruit tout serviteur blessé par ce serviteur."
			},
			"health": 2,
			"id": "TB_KTRAF_6m",
			"name": "Fallout Slime",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Destroy any minion damaged by this minion.",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 3,
			"cardImage": "KAR_028.png",
			"collectible": true,
			"cost": 5,
			"durability": 4,
			"fr": {
				"name": "Écrase-patate",
				"text": "Pas de limite d’attaques par tour. Ne peut pas attaquer les héros."
			},
			"id": "KAR_028",
			"name": "Fool's Bane",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Kara",
			"text": "Unlimited attacks each turn. Can't attack heroes.",
			"type": "Weapon"
		},
		{
			"artist": "Dany Orizio",
			"attack": 7,
			"cardImage": "FP1_014.png",
			"collectible": true,
			"cost": 5,
			"fr": {
				"name": "Stalagg",
				"text": "<b>Râle d’agonie :</b> si Feugen est aussi mort pendant cette partie, invoque Thaddius."
			},
			"health": 4,
			"id": "FP1_014",
			"name": "Stalagg",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Naxx",
			"text": "<b>Deathrattle:</b> If Feugen also died this game, summon Thaddius.",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 7,
			"cardImage": "AT_128.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Le chevalier squelette",
				"text": "<b>Râle d’agonie :</b> révèle un serviteur de chaque deck. Si le vôtre coûte plus, renvoie le chevalier dans votre main."
			},
			"health": 4,
			"id": "AT_128",
			"name": "The Skeleton Knight",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Tgt",
			"text": "<b>Deathrattle:</b> Reveal a minion in each deck. If yours costs more, return this to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_103.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Charge",
				"text": "Confère +2 ATQ et <b>Charge</b> à un serviteur allié."
			},
			"id": "CS2_103",
			"name": "Charge",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Core",
			"text": "Give a friendly minion +2 Attack and <b>Charge</b>.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"attack": 4,
			"cardImage": "EX1_095.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Commissaire-priseur",
				"text": "Vous piochez une carte chaque fois que vous lancez un sort."
			},
			"health": 4,
			"id": "EX1_095",
			"name": "Gadgetzan Auctioneer",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "Whenever you cast a spell, draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "AT_021.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Minuscule chevalier maléfique",
				"text": "Chaque fois que vous vous défaussez d’une carte, gagne +1/+1."
			},
			"health": 2,
			"id": "AT_021",
			"name": "Tiny Knight of Evil",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Tgt",
			"text": "Whenever you discard a card, gain +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Rafael Zanchetin",
			"cardImage": "KARA_04_01h.png",
			"fr": {
				"name": "La Mégère"
			},
			"health": 30,
			"id": "KARA_04_01h",
			"name": "The Crone",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Kara",
			"type": "Hero"
		},
		{
			"cardImage": "HRW02_1e.png",
			"cost": 1,
			"fr": {
				"name": "Puissance des rouages",
				"text": "Attaque augmentée."
			},
			"id": "HRW02_1e",
			"name": "Overclock",
			"playerClass": "Neutral",
			"set": "Tb",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Sean O'Danield",
			"cardImage": "AT_016.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Confusion",
				"text": "Échange l’Attaque et la Vie de tous les serviteurs."
			},
			"id": "AT_016",
			"name": "Confuse",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "Swap the Attack and Health of all minions.",
			"type": "Spell"
		},
		{
			"artist": "Sean O’Daniels",
			"cardImage": "NEW1_004.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Disparition",
				"text": "Renvoie tous les serviteurs dans la main de leur propriétaire."
			},
			"id": "NEW1_004",
			"name": "Vanish",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Core",
			"text": "Return all minions to their owner's hand.",
			"type": "Spell"
		},
		{
			"artist": "Lucas Graciano",
			"attack": 6,
			"cardImage": "BRM_025.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Drake volcanique",
				"text": "Coûte (1) |4(cristal,cristaux) de moins pour chaque serviteur mort pendant ce tour."
			},
			"health": 4,
			"id": "BRM_025",
			"name": "Volcanic Drake",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Brm",
			"text": "Costs (1) less for each minion that died this turn.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_013_PickOnCurve.png",
			"fr": {
				"name": "Player Choice Enchant On Curve"
			},
			"id": "TB_013_PickOnCurve",
			"name": "Player Choice Enchant On Curve",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_006.png",
			"cost": 0,
			"fr": {
				"name": "Break Weapon",
				"text": "Destroy a hero's weapon."
			},
			"id": "XXX_006",
			"name": "Break Weapon",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Destroy a hero's weapon.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX1_04.png",
			"cost": 2,
			"fr": {
				"name": "Grouillement",
				"text": "<b>Pouvoir héroïque</b>\nInvoque un nérubien 3/1."
			},
			"id": "NAX1_04",
			"name": "Skitter",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Hero Power</b>\nSummon a 3/1 Nerubian.",
			"type": "Hero_power"
		},
		{
			"cardImage": "LOEA05_02ha.png",
			"cost": 0,
			"fr": {
				"name": "Trogg détester serviteurs !",
				"text": "<b>Pouvoir héroïque passif</b> Les serviteurs adverses coûtent (11) |4(cristal,cristaux) de mana. Le pouvoir change au début de votre tour."
			},
			"id": "LOEA05_02ha",
			"name": "Trogg Hate Minions!",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Passive Hero Power</b>\n Enemy minions cost (11). Swap at the start of your turn.",
			"type": "Hero_power"
		},
		{
			"attack": 0,
			"cardImage": "NAX7_02.png",
			"cost": 2,
			"fr": {
				"name": "Doublure",
				"text": "<b>Provocation</b>"
			},
			"health": 7,
			"id": "NAX7_02",
			"name": "Understudy",
			"playerClass": "Neutral",
			"set": "Naxx",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_038e.png",
			"fr": {
				"name": "Esprit ancestral",
				"text": "<b>Râle d’agonie :</b> réinvoque ce serviteur."
			},
			"id": "CS2_038e",
			"name": "Ancestral Spirit",
			"playerClass": "Shaman",
			"set": "Expert1",
			"text": "<b>Deathrattle:</b> Resummon this minion.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_Coopv3_102b.png",
			"cost": 0,
			"fr": {
				"name": "Aumône de Lumière",
				"text": "Rend 8 PV à chaque héros."
			},
			"id": "TB_Coopv3_102b",
			"name": "Alms of Light",
			"playerClass": "Priest",
			"set": "Tb",
			"text": "Restore 8 Health to each hero.",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "AT_114.png",
			"collectible": true,
			"cost": 4,
			"fr": {
				"name": "Provocateur maléfique",
				"text": "<b>Provocation</b>"
			},
			"health": 4,
			"id": "AT_114",
			"name": "Evil Heckler",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Tgt",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "GAME_003e.png",
			"fr": {
				"name": "Vengeance de la pièce",
				"text": "Passer en second renforce votre premier serviteur."
			},
			"id": "GAME_003e",
			"name": "Coin's Vengence",
			"playerClass": "Neutral",
			"set": "Core",
			"text": "Going second makes your first minion stronger.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "CRED_30.png",
			"cost": 7,
			"fr": {
				"name": "JC Park",
				"text": "<b>Cri de guerre :</b> ajoute une nouvelle plateforme pour Hearthstone."
			},
			"health": 4,
			"id": "CRED_30",
			"name": "JC Park",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Add a new platform for Hearthstone.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA05_01h.png",
			"fr": {
				"name": "Chef Scarvash"
			},
			"health": 30,
			"id": "LOEA05_01h",
			"name": "Chieftain Scarvash",
			"playerClass": "Neutral",
			"set": "Loe",
			"type": "Hero"
		},
		{
			"attack": 6,
			"cardImage": "CRED_34.png",
			"cost": 3,
			"fr": {
				"name": "Max Ma",
				"text": "Peut uniquement être joué sur un mobile."
			},
			"health": 3,
			"id": "CRED_34",
			"name": "Max Ma",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Can only be played on a mobile device.",
			"type": "Minion"
		},
		{
			"artist": "Arthur Bozonnet",
			"attack": 3,
			"cardImage": "KAR_006.png",
			"collectible": true,
			"cost": 3,
			"fr": {
				"name": "Chasseresse capuchonnée",
				"text": "Vos <b>Secrets</b> coûtent (0) |4(cristal,cristaux)."
			},
			"health": 4,
			"id": "KAR_006",
			"name": "Cloaked Huntress",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Kara",
			"text": "Your <b>Secrets</b> cost (0).",
			"type": "Minion"
		},
		{
			"artist": "Sam Nielson",
			"attack": 5,
			"cardImage": "OG_122.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Mukla, tyran du val",
				"text": "<b>Cri de guerre :</b> place\n2 bananes dans votre main."
			},
			"health": 5,
			"id": "OG_122",
			"name": "Mukla, Tyrant of the Vale",
			"playerClass": "Neutral",
			"rarity": "Legendary",
			"set": "Og",
			"text": "<b>Battlecry:</b> Add 2 Bananas to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Matt Cavotta",
			"attack": 2,
			"cardImage": "NEW1_019.png",
			"collectible": true,
			"cost": 2,
			"fr": {
				"name": "Jongleur de couteaux",
				"text": "Inflige 1 point de dégâts à un adversaire aléatoire après que vous avez invoqué un serviteur."
			},
			"health": 2,
			"id": "NEW1_019",
			"name": "Knife Juggler",
			"playerClass": "Neutral",
			"rarity": "Rare",
			"set": "Expert1",
			"text": "After you summon a minion, deal 1 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 6,
			"cardImage": "AT_130.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Saccageur des mers",
				"text": "Quand vous piochez cette carte, inflige 1 point de dégâts à vos serviteurs."
			},
			"health": 7,
			"id": "AT_130",
			"name": "Sea Reaver",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Tgt",
			"text": "When you draw this, deal 1 damage to your minions.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_PickYourFate_8_Ench.png",
			"fr": {
				"name": "Fate 8 Get Armor"
			},
			"id": "TB_PickYourFate_8_Ench",
			"name": "Fate 8 Get Armor",
			"playerClass": "Neutral",
			"set": "Tb",
			"type": "Enchantment"
		},
		{
			"attack": 5,
			"cardImage": "LOEA01_12.png",
			"cost": 3,
			"fr": {
				"name": "Hoplite tol’vir",
				"text": "<b>Râle d’agonie :</b> inflige 5 points de dégâts aux deux héros."
			},
			"health": 2,
			"id": "LOEA01_12",
			"name": "Tol'vir Hoplite",
			"playerClass": "Neutral",
			"set": "Loe",
			"text": "<b>Deathrattle:</b> Deal 5 damage to both heroes.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_115e.png",
			"fr": {
				"name": "Entraînement à l’escrime",
				"text": "Votre pouvoir héroïque coûte (2) cristaux de moins."
			},
			"id": "AT_115e",
			"name": "Fencing Practice",
			"playerClass": "Neutral",
			"set": "Tgt",
			"text": "Your Hero Power costs (2) less.",
			"type": "Enchantment"
		},
		{
			"cardImage": "OG_158e.png",
			"fr": {
				"name": "Secrets du culte",
				"text": "+1/+1."
			},
			"id": "OG_158e",
			"name": "Secrets of the Cult",
			"playerClass": "Neutral",
			"set": "Og",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_046.png",
			"cost": 0,
			"fr": {
				"name": "Force AI to Use Hero Power",
				"text": "Force the AI to use their Hero Power every turn from now on."
			},
			"id": "XXX_046",
			"name": "Force AI to Use Hero Power",
			"playerClass": "Neutral",
			"rarity": "Common",
			"set": "Cheat",
			"text": "Force the AI to use their Hero Power every turn from now on.",
			"type": "Spell"
		}
	]
}