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
					// var cssClass = card.rarity ? parseCardsText.getRarity(card).toLowerCase() : 'common';
					// var localizedName = parseCardsText.localizeName(card, lang);
					// var localizedImage = parseCardsText.localizeImage(card, lang);
					// result = result.replace(match, '<a class="card ' + cssClass + '" data-template-url="plugins/parseCardsText/template.html" data-title="' + localizedImage + '" data-placement="auto left" data-container="body" bs-tooltip>' + localizedName + '</a>');
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
				callback($.map(parseCardsText.jsonDatabase, function(card) {
					var localizeName = parseCardsText.localizeName(card);
					var res = S(localizeName.toLowerCase()).latinise().s.indexOf(S(term).latinise().s.substring(2).toLowerCase()) === 0;
					// var debug = false;
					// if (res) debug = true;
					// add search on english term
					res = res || card.name.toLowerCase().indexOf(term.substring(2).toLowerCase()) === 0;
					// if (debug) console.log('res2', term, localizeName, res);
					// Keep only valid cards
					res = res && card.cardImage && card.type != 'Hero';
					// if (debug) console.log('res3', term, localizeName, res);
					res = res ? card : null
					// if (debug) console.log('res4', term, localizeName, res);
					return res;
				}))
				$(function () {
					// console.log('unloading tooltips', $('[data-toggle="tooltip"]'));
					$('.tooltip.parse-cards-text').hide();
				})
				$(function () {
					// console.log('loading tooltips', $('[data-toggle="tooltip"]'));
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
		if (!cardName)
			return null
		
		var result;
		var possibleResult;

		// cf http://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break
		parseCardsText.jsonDatabase.some(function(card) {
			// Seems like variations (the non-standard version) of the card has a lowercase letter in the name
			if (card.id == cardName) {
				result = card;
				return true;
			}
			else if (card.name.toLowerCase() == cardName.toLowerCase()) {
				possibleResult = card;
				if (card.set == 'Basic') {
					card.rarity = 'Free';
				}
				// console.log('card id matches regex?', card.id, card.id.match(/.*\d$/));
				// console.log('card type', card.type)
				if (card.type != 'Hero' && (card.id.toLowerCase() == card.id || card.id.toUpperCase() == card.id) && card.id.match(/.*\d$/)) {
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
			"artist": "Chris Rahn",
			"attack": 3,
			"cardImage": "EX1_066.png",
			"collectible": true,
			"cost": 2,
			"faction": "Alliance",
			"flavor": "Oozes love Flamenco.  Don't ask.",
			"fr": {
				"name": "Limon des marais acide"
			},
			"health": 2,
			"howToGetGold": "Unlocked at Rogue Level 57.",
			"id": "EX1_066",
			"mechanics": [
				"Battlecry"
			],
			"name": "Acidic Swamp Ooze",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Destroy your opponent's weapon.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "ABS"
			},
			"id": "GAME_004",
			"name": "AFK",
			"set": "Basic",
			"text": "Your turns are shorter.",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "CS2_041.png",
			"collectible": true,
			"cost": 0,
			"faction": "Neutral",
			"flavor": "I personally prefer some non-ancestral right-the-heck-now healing, but maybe that is just me.",
			"fr": {
				"name": "Guérison ancestrale"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 15.",
			"id": "CS2_041",
			"name": "Ancestral Healing",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Basic",
			"text": "Restore a minion to full Health and give it <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Infusion ancestrale"
			},
			"id": "CS2_041e",
			"mechanics": [
				"Taunt"
			],
			"name": "Ancestral Infusion",
			"playerClass": "Shaman",
			"set": "Basic",
			"text": "Taunt.",
			"type": "Enchantment"
		},
		{
			"cardImage": "HERO_09.png",
			"collectible": true,
			"faction": "Neutral",
			"fr": {
				"name": "Anduin Wrynn"
			},
			"health": 30,
			"id": "HERO_09",
			"name": "Anduin Wrynn",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Basic",
			"type": "Hero"
		},
		{
			"artist": "Wei Wang",
			"cardImage": "NEW1_031.png",
			"collectible": true,
			"cost": 3,
			"flavor": "You could summon Misha, Leokk, or Huffer!  Huffer is more trouble than he's worth.",
			"fr": {
				"name": "Compagnon animal"
			},
			"howToGet": "Unlocked at Level 2.",
			"howToGetGold": "Unlocked at Level 45.",
			"id": "NEW1_031",
			"name": "Animal Companion",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Basic",
			"text": "Summon a random Beast Companion.",
			"type": "Spell"
		},
		{
			"artist": "Howard Lyon",
			"cardImage": "CS2_025.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "This spell is much better than Arcane Implosion.",
			"fr": {
				"name": "Explosion des Arcanes"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 28.",
			"id": "CS2_025",
			"name": "Arcane Explosion",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $1 damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"artist": "Dave Berggren",
			"cardImage": "CS2_023.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Playing this card makes you SMARTER.  And let's face it: we could all stand to be a little smarter.",
			"fr": {
				"name": "Intelligence des Arcanes"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 15.",
			"id": "CS2_023",
			"name": "Arcane Intellect",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Basic",
			"text": "Draw 2 cards.",
			"type": "Spell"
		},
		{
			"artist": "Warren Mahy",
			"cardImage": "EX1_277.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "You'd think you'd be able to control your missiles a little better since you're a powerful mage and all.",
			"fr": {
				"name": "Projectiles des Arcanes"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 32.",
			"id": "EX1_277",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Arcane Missiles",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $3 damage randomly split among all enemies.",
			"type": "Spell"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "DS1_185.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Magi conjured arcane arrows to sell to hunters, until hunters learned just enough magic to do it themselves.  The resulting loss of jobs sent Stormwind into a minor recession.",
			"fr": {
				"name": "Tir des Arcanes"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 32.",
			"id": "DS1_185",
			"name": "Arcane Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $2 damage.",
			"type": "Spell"
		},
		{
			"artist": "Stefan Kopinski",
			"attack": 5,
			"cardImage": "CS2_112.png",
			"collectible": true,
			"cost": 5,
			"durability": 2,
			"faction": "Neutral",
			"flavor": "No… actually you should fear the Reaper.",
			"fr": {
				"name": "Faucheuse en arcanite"
			},
			"howToGet": "Unlocked at Level 10.",
			"howToGetGold": "Unlocked at Level 51.",
			"id": "CS2_112",
			"name": "Arcanite Reaper",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Basic",
			"type": "Weapon"
		},
		{
			"artist": "Steve Ellis",
			"attack": 4,
			"cardImage": "CS2_155.png",
			"collectible": true,
			"cost": 6,
			"faction": "Alliance",
			"flavor": "You earn the title of Archmage when you can destroy anyone who calls you on it.",
			"fr": {
				"name": "Archimage"
			},
			"health": 7,
			"howToGetGold": "Unlocked at Mage Level 57.",
			"id": "CS2_155",
			"mechanics": [
				"Spellpower"
			],
			"name": "Archmage",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_102.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Gain d’armure !"
			},
			"id": "CS2_102",
			"name": "Armor Up!",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Hero Power</b>\nGain 2 Armor.",
			"type": "Hero Power"
		},
		{
			"artist": "Brian Huang",
			"attack": 3,
			"cardImage": "CS2_080.png",
			"collectible": true,
			"cost": 5,
			"durability": 4,
			"faction": "Neutral",
			"flavor": "Guaranteed to have been owned by a real assassin.   Certificate of authenticity included.",
			"fr": {
				"name": "Lame d’assassin"
			},
			"howToGet": "Unlocked at Level 2.",
			"howToGetGold": "Unlocked at Level 32.",
			"id": "CS2_080",
			"name": "Assassin's Blade",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Basic",
			"type": "Weapon"
		},
		{
			"artist": "Glenn Rane",
			"cardImage": "CS2_076.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "If you don't want to be assassinated, move to the Barrens and change your name. Good luck!",
			"fr": {
				"name": "Assassiner"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 47.",
			"id": "CS2_076",
			"name": "Assassinate",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Basic",
			"text": "Destroy an enemy minion.",
			"type": "Spell"
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
			"set": "Basic",
			"text": "<i>You lost the coin flip, but gained a friend.</i>",
			"type": "Minion"
		},
		{
			"artist": "Michael Sutfin",
			"cardImage": "CS2_072.png",
			"collectible": true,
			"cost": 0,
			"faction": "Neutral",
			"flavor": "It's funny how often yelling \"Look over there!\" gets your opponent to turn around.",
			"fr": {
				"name": "Attaque sournoise"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 36.",
			"id": "CS2_072",
			"name": "Backstab",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $2 damage to an undamaged minion.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Berserker"
			},
			"id": "EX1_399e",
			"name": "Berserking",
			"set": "Basic",
			"text": "This minion has increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Lucas Graciano",
			"cardImage": "CS2_092.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Given the number of kings who have been assassinated, are you sure you want their blessing?",
			"fr": {
				"name": "Bénédiction des rois"
			},
			"howToGet": "Unlocked at Level 10.",
			"howToGetGold": "Unlocked at Level 49.",
			"id": "CS2_092",
			"name": "Blessing of Kings",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Basic",
			"text": "Give a minion +4/+4. <i>(+4 Attack/+4 Health)</i>",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Bénédiction des rois"
			},
			"id": "CS2_092e",
			"name": "Blessing of Kings",
			"playerClass": "Paladin",
			"set": "Basic",
			"text": "+4/+4.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "CS2_087.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "\"As in, you MIGHT want to get out of my way.\" - Toad Mackle, recently buffed.",
			"fr": {
				"name": "Bénédiction de puissance"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 45.",
			"id": "CS2_087",
			"name": "Blessing of Might",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Basic",
			"text": "Give a minion +3 Attack.",
			"type": "Spell"
		},
		{
			"faction": "Neutral",
			"fr": {
				"name": "Bénédiction de puissance"
			},
			"id": "CS2_087e",
			"name": "Blessing of Might",
			"playerClass": "Paladin",
			"set": "Basic",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Brereton",
			"attack": 3,
			"cardImage": "CS2_172.png",
			"collectible": true,
			"cost": 2,
			"faction": "Horde",
			"flavor": "\"Kill 30 raptors.\" - Hemet Nesingwary",
			"fr": {
				"name": "Raptor Rougefange"
			},
			"health": 2,
			"howToGetGold": "Unlocked at Hunter Level 57.",
			"id": "CS2_172",
			"name": "Bloodfen Raptor",
			"race": "Beast",
			"rarity": "Free",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "CS2_046.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "blaarghghLLGHRHARAAHAHHH!!",
			"fr": {
				"name": "Furie sanguinaire"
			},
			"howToGet": "Unlocked at Level 2.",
			"howToGetGold": "Unlocked at Level 40.",
			"id": "CS2_046",
			"name": "Bloodlust",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Basic",
			"text": "Give your minions +3 Attack this turn.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Furie sanguinaire"
			},
			"id": "CS2_046e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Bloodlust",
			"playerClass": "Shaman",
			"set": "Basic",
			"text": "+3 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 2,
			"cardImage": "CS2_173.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "He just wants a hug.   A sloppy... slimy... hug.",
			"fr": {
				"name": "Guerrier branchie-bleue"
			},
			"health": 1,
			"howToGetGold": "Unlocked at Paladin Level 53.",
			"id": "CS2_173",
			"mechanics": [
				"Charge"
			],
			"name": "Bluegill Warrior",
			"race": "Murloc",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CS2_boar.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Sanglier"
			},
			"health": 1,
			"id": "CS2_boar",
			"name": "Boar",
			"race": "Beast",
			"rarity": "Common",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"artist": "Matt Cavotta",
			"attack": 5,
			"cardImage": "CS2_187.png",
			"collectible": true,
			"cost": 5,
			"faction": "Horde",
			"flavor": "You can hire him... until someone offers him enough gold to turn on you.",
			"fr": {
				"name": "Garde de Baie-du-Butin"
			},
			"health": 4,
			"howToGetGold": "Unlocked at Shaman Level 55.",
			"id": "CS2_187",
			"mechanics": [
				"Taunt"
			],
			"name": "Booty Bay Bodyguard",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Brian Despain",
			"attack": 6,
			"cardImage": "CS2_200.png",
			"collectible": true,
			"cost": 6,
			"flavor": "\"ME HAVE GOOD STATS FOR THE COST\"",
			"fr": {
				"name": "Ogre rochepoing"
			},
			"health": 7,
			"howToGetGold": "Unlocked at Warlock Level 51.",
			"id": "CS2_200",
			"name": "Boulderfist Ogre",
			"rarity": "Free",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Charge"
			},
			"id": "CS2_103e2",
			"name": "Charge",
			"playerClass": "Warrior",
			"set": "Basic",
			"text": "+2 Attack and <b>Charge</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_103.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "\"Guys! Guys! Slow down!\" - some kind of non-warrior minion",
			"fr": {
				"name": "Charge"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 23.",
			"id": "CS2_103",
			"name": "Charge",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Basic",
			"text": "Give a friendly minion +2 Attack and <b>Charge</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Charge"
			},
			"id": "DS1_178e",
			"name": "Charge",
			"playerClass": "Hunter",
			"set": "Basic",
			"text": "Tundra Rhino grants <b>Charge</b>.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Charge"
			},
			"id": "EX1_084e",
			"name": "Charge",
			"playerClass": "Warrior",
			"set": "Basic",
			"text": "Warsong Commander is granting this minion +1 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Mauro Cascioli",
			"attack": 4,
			"cardImage": "CS2_182.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "He always dreamed of coming down from the mountains and opening a noodle shop, but he never got the nerve.",
			"fr": {
				"name": "Yéti noroît"
			},
			"health": 5,
			"howToGetGold": "Unlocked at Warrior Level 55.",
			"id": "CS2_182",
			"name": "Chillwind Yeti",
			"rarity": "Common",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Griffe"
			},
			"id": "CS2_005o",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Claw",
			"playerClass": "Druid",
			"set": "Basic",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Dany Orizio",
			"cardImage": "CS2_005.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "The claw decides who will stay and who will go.",
			"fr": {
				"name": "Griffe"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 32.",
			"id": "CS2_005",
			"name": "Claw",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Basic",
			"text": "Give your hero +2 Attack this turn and 2 Armor.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Griffes"
			},
			"id": "CS2_017o",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Claws",
			"playerClass": "Druid",
			"set": "Basic",
			"text": "Your hero has +1 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Phroilan Gardner",
			"cardImage": "CS2_114.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Hey you two…could you stand next to each other for a second…",
			"fr": {
				"name": "Enchaînement"
			},
			"howToGet": "Unlocked at Level 2.",
			"howToGetGold": "Unlocked at Level 40.",
			"id": "CS2_114",
			"name": "Cleave",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $2 damage to two random enemy minions.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Bénédiction du clerc"
			},
			"id": "EX1_019e",
			"name": "Cleric's Blessing",
			"playerClass": "Priest",
			"set": "Basic",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Vengeance de la pièce"
			},
			"id": "GAME_003",
			"name": "Coin's Vengeance",
			"set": "Basic",
			"text": "Going second makes your first minion stronger.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Vengeance de la pièce"
			},
			"id": "GAME_003e",
			"name": "Coin's Vengence",
			"set": "Basic",
			"text": "Going second makes your first minion stronger.",
			"type": "Enchantment"
		},
		{
			"artist": "Vance Kovacs",
			"cardImage": "CS2_093.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Consecrated ground glows with Holy energy.  But it smells a little, too.",
			"fr": {
				"name": "Consécration"
			},
			"howToGet": "Unlocked at Level 4.",
			"howToGetGold": "Unlocked at Level 43.",
			"id": "CS2_093",
			"name": "Consecration",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $2 damage to all enemies.",
			"type": "Spell"
		},
		{
			"artist": "E.M. Gist",
			"attack": 9,
			"cardImage": "CS2_201.png",
			"collectible": true,
			"cost": 7,
			"flavor": "You don’t tame a Core Hound. You just train it to eat someone else before it eats you.",
			"fr": {
				"name": "Chien du Magma"
			},
			"health": 5,
			"howToGetGold": "Unlocked at Hunter Level 51.",
			"id": "CS2_201",
			"name": "Core Hound",
			"race": "Beast",
			"rarity": "Common",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Corruption"
			},
			"id": "CS2_063e",
			"name": "Corruption",
			"playerClass": "Warlock",
			"set": "Basic",
			"text": "At the start of the corrupting player's turn, destroy this minion.",
			"type": "Enchantment"
		},
		{
			"artist": "Wayne Reynolds",
			"cardImage": "CS2_063.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "It starts with stealing a pen from work, and before you know it, BOOM!  Corrupted!",
			"fr": {
				"name": "Corruption"
			},
			"howToGet": "Unlocked at Level 2.",
			"howToGetGold": "Unlocked at Level 32.",
			"id": "CS2_063",
			"name": "Corruption",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Basic",
			"text": "Choose an enemy minion. At the start of your turn, destroy it.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_083b.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Maîtrise des dagues"
			},
			"id": "CS2_083b",
			"name": "Dagger Mastery",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Hero Power</b>\nEquip a 1/2 Dagger.",
			"type": "Hero Power"
		},
		{
			"artist": "Jim Nelson",
			"attack": 1,
			"cardImage": "EX1_582.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "You don't see a lot of Dalaran warriors.",
			"fr": {
				"name": "Mage de Dalaran"
			},
			"health": 4,
			"howToGetGold": "Unlocked at Mage Level 59.",
			"id": "EX1_582",
			"mechanics": [
				"Spellpower"
			],
			"name": "Dalaran Mage",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 4,
			"cardImage": "DS1_055.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "Healing is just something she does in her free time.  It's more of a hobby really.",
			"fr": {
				"name": "Soigneuse sombrécaille"
			},
			"health": 5,
			"howToGetGold": "Unlocked at Priest Level 55.",
			"id": "DS1_055",
			"mechanics": [
				"Battlecry"
			],
			"name": "Darkscale Healer",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Restore 2 Health to all friendly characters.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Poison mortel"
			},
			"id": "CS2_074e",
			"name": "Deadly Poison",
			"set": "Basic",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Trevor Jacobs",
			"cardImage": "CS2_074.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Rogues guard the secrets to poison-making carefully, lest magi start incorporating poison into their spells.  Poisonbolt? Rain of Poison?  Poison Elemental?  Nobody wants that.",
			"fr": {
				"name": "Poison mortel"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 43.",
			"id": "CS2_074",
			"name": "Deadly Poison",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Basic",
			"text": "Give your weapon +2 Attack.",
			"type": "Spell"
		},
		{
			"artist": "Jim Pavelec",
			"cardImage": "CS2_236.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Double the trouble. Double the fun!",
			"fr": {
				"name": "Esprit divin"
			},
			"howToGet": "Unlocked at Level 2.",
			"howToGetGold": "Unlocked at Level 28.",
			"id": "CS2_236",
			"name": "Divine Spirit",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Basic",
			"text": "Double a minion's Health.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Esprit divin"
			},
			"id": "CS2_236e",
			"name": "Divine Spirit",
			"playerClass": "Priest",
			"set": "Basic",
			"text": "This minion has double Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Warren Mahy",
			"attack": 2,
			"cardImage": "EX1_025.png",
			"collectible": true,
			"cost": 4,
			"faction": "Alliance",
			"flavor": "She is still working on installing the rocket launcher add-on for Mr. Bitey.",
			"fr": {
				"name": "Mécano de petit dragon"
			},
			"health": 4,
			"howToGetGold": "Unlocked at Mage Level 53.",
			"id": "EX1_025",
			"mechanics": [
				"Battlecry"
			],
			"name": "Dragonling Mechanic",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Summon a 2/1 Mechanical Dragonling.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_061.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "\"I've just sucked one year of your life away.\"",
			"fr": {
				"name": "Drain de vie"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 45.",
			"id": "CS2_061",
			"name": "Drain Life",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $2 damage. Restore #2 Health to your hero.",
			"type": "Spell"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 6,
			"cardImage": "CS2_064.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "\"INFERNOOOOOOOOOO!\" - Jaraxxus, Eredar Lord of the Burning Legion",
			"fr": {
				"name": "Infernal de l’effroi"
			},
			"health": 6,
			"howToGet": "Unlocked at Level 10.",
			"howToGetGold": "Unlocked at Level 23.",
			"id": "CS2_064",
			"mechanics": [
				"Battlecry"
			],
			"name": "Dread Infernal",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Deal 1 damage to ALL other characters.",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 1,
			"cardImage": "CS2_189.png",
			"collectible": true,
			"cost": 1,
			"faction": "Horde",
			"flavor": "Don't bother asking her out on a date.  She'll shoot you down.",
			"fr": {
				"name": "Archère elfe"
			},
			"health": 1,
			"howToGetGold": "Unlocked at Druid Level 57.",
			"id": "CS2_189",
			"mechanics": [
				"Battlecry"
			],
			"name": "Elven Archer",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Deal 1 damage.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Amélioration"
			},
			"id": "CS2_122e",
			"name": "Enhanced",
			"set": "Basic",
			"text": "Raid Leader is granting this minion +1 Attack.",
			"type": "Enchantment"
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
			"set": "Basic",
			"text": "Draw a card. <i>(You can only have 10 Mana in your tray.)</i>",
			"type": "Spell"
		},
		{
			"artist": "Dany Orizio",
			"cardImage": "CS2_108.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "It's okay, he deserved it.",
			"fr": {
				"name": "Exécution"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 47.",
			"id": "CS2_108",
			"name": "Execute",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Basic",
			"text": "Destroy a damaged enemy minion.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Œil céleste"
			},
			"id": "NEW1_033o",
			"name": "Eye In The Sky",
			"playerClass": "Hunter",
			"set": "Basic",
			"text": "Leokk is granting this minion +1 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Andrew Robinson",
			"cardImage": "EX1_129.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "I wouldn't say I LOVE knives, but I'm definitely a fan.",
			"fr": {
				"name": "Éventail de couteaux"
			},
			"howToGet": "Unlocked at Level 4.",
			"howToGetGold": "Unlocked at Level 29.",
			"id": "EX1_129",
			"name": "Fan of Knives",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $1 damage to all enemy minions. Draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Lucas Graciano",
			"attack": 3,
			"cardImage": "CS2_106.png",
			"collectible": true,
			"cost": 2,
			"durability": 2,
			"faction": "Neutral",
			"flavor": "During times of tranquility and harmony, this weapon was called by its less popular name, Chilly Peace Axe.",
			"fr": {
				"name": "Hache de guerre embrasée"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 49.",
			"id": "CS2_106",
			"name": "Fiery War Axe",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Basic",
			"type": "Weapon"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 6,
			"cardImage": "CS2_042.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "He can never take a bath. Ewww.",
			"fr": {
				"name": "Élémentaire de feu"
			},
			"health": 5,
			"howToGet": "Unlocked at Level 10.",
			"howToGetGold": "Unlocked at Level 49.",
			"id": "CS2_042",
			"mechanics": [
				"Battlecry"
			],
			"name": "Fire Elemental",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Deal 3 damage.",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"cardImage": "CS2_029.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "This spell is useful for burning things.  If you're looking for spells that toast things, or just warm them a little, you're in the wrong place.",
			"fr": {
				"name": "Boule de feu"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 44.",
			"id": "CS2_029",
			"name": "Fireball",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $6 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_034.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Explosion de feu"
			},
			"id": "CS2_034",
			"name": "Fireblast",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Hero Power</b>\nDeal $1 damage.",
			"type": "Hero Power"
		},
		{
			"artist": "Romain De Santi",
			"cardImage": "CS2_032.png",
			"collectible": true,
			"cost": 7,
			"faction": "Neutral",
			"flavor": "When the ground is on fire, you should <i>not</i> stop, drop, and roll.",
			"fr": {
				"name": "Choc de flammes"
			},
			"howToGet": "Unlocked at Level 10.",
			"howToGetGold": "Unlocked at Level 51.",
			"id": "CS2_032",
			"name": "Flamestrike",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $4 damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Langue de feu"
			},
			"id": "EX1_565o",
			"name": "Flametongue",
			"playerClass": "Shaman",
			"set": "Basic",
			"text": "+2 Attack from Flametongue Totem.",
			"type": "Enchantment"
		},
		{
			"artist": "Jonathan Ryder",
			"attack": 0,
			"cardImage": "EX1_565.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Totemsmiths like to use the rarest woods for their totems.  There are even rumors of totems made of Ironbark Protectors.",
			"fr": {
				"name": "Totem Langue de feu"
			},
			"health": 3,
			"howToGet": "Unlocked at Level 4.",
			"howToGetGold": "Unlocked at Level 43.",
			"id": "EX1_565",
			"inPlayText": "Flametongue",
			"mechanics": [
				"AdjacentBuff",
				"Aura"
			],
			"name": "Flametongue Totem",
			"playerClass": "Shaman",
			"race": "Totem",
			"rarity": "Common",
			"set": "Basic",
			"text": "Adjacent minions have +2 Attack.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "hexfrog.png",
			"cost": 0,
			"faction": "Neutral",
			"fr": {
				"name": "Grenouille"
			},
			"health": 1,
			"id": "hexfrog",
			"mechanics": [
				"Taunt"
			],
			"name": "Frog",
			"race": "Beast",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Josh Tallman",
			"cardImage": "CS2_026.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Hey man, that's cold.  Literally and metaphorically.",
			"fr": {
				"name": "Nova de givre"
			},
			"howToGet": "Unlocked at Level 6.",
			"howToGetGold": "Unlocked at Level 23.",
			"id": "CS2_026",
			"mechanics": [
				"Freeze"
			],
			"name": "Frost Nova",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Freeze</b> all enemy minions.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_037.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "FROST SHOCK!",
			"fr": {
				"name": "Horion de givre"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 32.",
			"id": "CS2_037",
			"mechanics": [
				"Freeze"
			],
			"name": "Frost Shock",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $1 damage to an enemy character and <b>Freeze</b> it.",
			"type": "Spell"
		},
		{
			"artist": "Steve Ellis",
			"cardImage": "CS2_024.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "It is customary to yell \"Chill out!\" or \"Freeze!\" or \"Ice ice, baby!\" when you play this card.",
			"fr": {
				"name": "Éclair de givre"
			},
			"howToGet": "Unlocked at Level 2.",
			"howToGetGold": "Unlocked at Level 40.",
			"id": "CS2_024",
			"mechanics": [
				"Freeze"
			],
			"name": "Frostbolt",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $3 damage to a character and <b>Freeze</b> it.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Bannière loup-de-givre"
			},
			"id": "CS2_226e",
			"name": "Frostwolf Banner",
			"set": "Basic",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Richie Marella",
			"attack": 2,
			"cardImage": "CS2_121.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Grunting is what his father did and his father before that.   It's more than just a job.",
			"fr": {
				"name": "Grunt loup-de-givre"
			},
			"health": 2,
			"howToGetGold": "Unlocked at Shaman Level 57.",
			"id": "CS2_121",
			"mechanics": [
				"Taunt"
			],
			"name": "Frostwolf Grunt",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "CS2_226.png",
			"collectible": true,
			"cost": 5,
			"faction": "Horde",
			"flavor": "The Frostwolves are locked in combat with the Stormpike Expedition over control of Alterac Valley.  Every attempt at peace-talks has ended with Captain Galvangar killing the mediator.",
			"fr": {
				"name": "Chef de guerre loup-de-givre"
			},
			"health": 4,
			"howToGetGold": "Unlocked at Shaman Level 53.",
			"id": "CS2_226",
			"mechanics": [
				"Battlecry"
			],
			"name": "Frostwolf Warlord",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Gain +1/+1 for each other friendly minion on the battlefield.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Hurlement furieux"
			},
			"id": "DS1_175o",
			"name": "Furious Howl",
			"playerClass": "Hunter",
			"set": "Basic",
			"text": "This Beast has +1 Attack from Timber Wolf.",
			"type": "Enchantment"
		},
		{
			"cardImage": "HERO_01.png",
			"collectible": true,
			"faction": "Neutral",
			"fr": {
				"name": "Garrosh Hurlenfer"
			},
			"health": 30,
			"id": "HERO_01",
			"name": "Garrosh Hellscream",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Basic",
			"type": "Hero"
		},
		{
			"artist": "Court Jones",
			"attack": 2,
			"cardImage": "CS2_147.png",
			"collectible": true,
			"cost": 4,
			"faction": "Alliance",
			"flavor": "She's never quite sure what she's making, she just knows it's AWESOME!",
			"fr": {
				"name": "Inventrice gnome"
			},
			"health": 4,
			"howToGetGold": "Unlocked at Priest Level 57.",
			"id": "CS2_147",
			"mechanics": [
				"Battlecry"
			],
			"name": "Gnomish Inventor",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Donato Giancola",
			"attack": 1,
			"cardImage": "CS1_042.png",
			"collectible": true,
			"cost": 1,
			"faction": "Alliance",
			"flavor": "If 1/2 minions are all that is defending Goldshire, you would think it would have been overrun years ago.",
			"fr": {
				"name": "Soldat de Comté-de-l’Or"
			},
			"health": 2,
			"howToGetGold": "Unlocked at Paladin Level 57.",
			"id": "CS1_042",
			"mechanics": [
				"Taunt"
			],
			"name": "Goldshire Footman",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Phil Saunders",
			"attack": 1,
			"cardImage": "EX1_508.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "These are the brainy murlocs.  It turns out that doesn’t mean much.",
			"fr": {
				"name": "Oracle sinistrécaille"
			},
			"health": 1,
			"howToGetGold": "Unlocked at Warlock Level 53.",
			"id": "EX1_508",
			"name": "Grimscale Oracle",
			"race": "Murloc",
			"rarity": "Common",
			"set": "Basic",
			"text": "ALL other Murlocs have +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "E.M. Gist",
			"attack": 5,
			"cardImage": "CS2_088.png",
			"collectible": true,
			"cost": 7,
			"faction": "Neutral",
			"flavor": "Holy beings from the beyond are so cliché!",
			"fr": {
				"name": "Gardien des rois"
			},
			"health": 6,
			"howToGet": "Unlocked at Level 8.",
			"howToGetGold": "Unlocked at Level 47.",
			"id": "CS2_088",
			"mechanics": [
				"Battlecry"
			],
			"name": "Guardian of Kings",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Restore 6 Health to your hero.",
			"type": "Minion"
		},
		{
			"cardImage": "HERO_07.png",
			"collectible": true,
			"faction": "Neutral",
			"fr": {
				"name": "Gul’dan"
			},
			"health": 30,
			"id": "HERO_07",
			"name": "Gul'dan",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Basic",
			"type": "Hero"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "EX1_399.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "No Pain, No Gain.",
			"fr": {
				"name": "Berserker gurubashi"
			},
			"health": 7,
			"howToGetGold": "Unlocked at Warlock Level 57.",
			"id": "EX1_399",
			"name": "Gurubashi Berserker",
			"rarity": "Common",
			"set": "Basic",
			"text": "Whenever this minion takes damage, gain +3 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Efrem Palacios",
			"cardImage": "CS2_094.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "A good paladin has many tools.  Hammer of Wrath, Pliers of Vengeance, Hacksaw of Justice, etc.",
			"fr": {
				"name": "Marteau de courroux"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 32.",
			"id": "CS2_094",
			"name": "Hammer of Wrath",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $3 damage.\nDraw a card.",
			"type": "Spell"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_371.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "This spell has been renamed so many times, even paladins don’t know what it should be called anymore.",
			"fr": {
				"name": "Main de protection"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 23.",
			"id": "EX1_371",
			"name": "Hand of Protection",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Basic",
			"text": "Give a minion <b>Divine Shield</b>.",
			"type": "Spell"
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
			"race": "Totem",
			"rarity": "Free",
			"set": "Basic",
			"text": "At the end of your turn, restore 1 Health to all friendly minions.",
			"type": "Minion"
		},
		{
			"artist": "Cyril Van Der Haegen",
			"cardImage": "CS2_007.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "8 Health, no waiting.",
			"fr": {
				"name": "Toucher guérisseur"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 15.",
			"id": "CS2_007",
			"name": "Healing Touch",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Basic",
			"text": "Restore #8 Health.",
			"type": "Spell"
		},
		{
			"artist": "Chippy",
			"cardImage": "CS2_062.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "It's spells like these that make it hard for Warlocks to get decent help.",
			"fr": {
				"name": "Flammes infernales"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 49.",
			"id": "CS2_062",
			"name": "Hellfire",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $3 damage to ALL characters.",
			"type": "Spell"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "CS2_105.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Really, if you're a hero, this is <i>every</i> strike.",
			"fr": {
				"name": "Frappe héroïque"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 15.",
			"id": "CS2_105",
			"name": "Heroic Strike",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Basic",
			"text": "Give your hero +4 Attack this turn.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Frappe héroïque"
			},
			"id": "CS2_105e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Heroic Strike",
			"playerClass": "Warrior",
			"set": "Basic",
			"text": "+4 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Steve Hui",
			"cardImage": "EX1_246.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "If you Hex a Murloc... it really isn't much of a change, is it?",
			"fr": {
				"name": "Maléfice"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 47.",
			"id": "EX1_246",
			"name": "Hex",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Basic",
			"text": "Transform a minion into a 0/1 Frog with <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Maléficié"
			},
			"id": "EX1_246e",
			"mechanics": [
				"Morph"
			],
			"name": "Hexxed",
			"playerClass": "Shaman",
			"set": "Basic",
			"text": "This minion has been transformed!",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "CS2_089.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "If you are often bathed in Holy Light, you should consider wearing sunscreen.",
			"fr": {
				"name": "Lumière sacrée"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 15.",
			"id": "CS2_089",
			"name": "Holy Light",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Basic",
			"text": "Restore #6 Health.",
			"type": "Spell"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "CS1_112.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "If the Holy Light forsakes you, good luck casting this spell.  Also, you're probably a jerk.",
			"fr": {
				"name": "Nova sacrée"
			},
			"howToGet": "Unlocked at Level 6.",
			"howToGetGold": "Unlocked at Level 45.",
			"id": "CS1_112",
			"name": "Holy Nova",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $2 damage to all enemies. Restore #2 Health to all friendly characters.",
			"type": "Spell"
		},
		{
			"artist": "Steve Ellis",
			"cardImage": "CS1_130.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "It doesn't matter how pious you are.  Everyone needs a good smiting now and again.",
			"fr": {
				"name": "Châtiment sacré"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 23.",
			"id": "CS1_130",
			"name": "Holy Smite",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $2 damage.",
			"type": "Spell"
		},
		{
			"artist": "Dan Brereton",
			"attack": 4,
			"cardImage": "DS1_070.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "\"Who let the dogs out?\" he asks.  It's rhetorical.",
			"fr": {
				"name": "Maître-chien"
			},
			"health": 3,
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 28.",
			"id": "DS1_070",
			"inPlayText": "Beastmaster",
			"mechanics": [
				"Battlecry"
			],
			"name": "Houndmaster",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Give a friendly Beast +2/+2 and <b>Taunt</b>.",
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
			"mechanics": [
				"Charge"
			],
			"name": "Huffer",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"faction": "Neutral",
			"fr": {
				"name": "Humilité"
			},
			"id": "EX1_360e",
			"name": "Humility",
			"playerClass": "Paladin",
			"set": "Basic",
			"text": "Attack has been changed to 1.",
			"type": "Enchantment"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "EX1_360.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "This card makes something really damp.  Oh wait.  That's \"Humidity.\"",
			"fr": {
				"name": "Humilité"
			},
			"howToGet": "Unlocked at Level 6.",
			"howToGetGold": "Unlocked at Level 28.",
			"id": "EX1_360",
			"name": "Humility",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Basic",
			"text": "Change a minion's Attack to 1.",
			"type": "Spell"
		},
		{
			"artist": "Jimmy Lo",
			"cardImage": "CS2_084.png",
			"collectible": true,
			"cost": 0,
			"faction": "Neutral",
			"flavor": "Never play 'Hide and Go Seek' with a Hunter.",
			"fr": {
				"name": "Marque du chasseur"
			},
			"howToGet": "Unlocked at Level 6.",
			"howToGetGold": "Unlocked at Level 40.",
			"id": "CS2_084",
			"name": "Hunter's Mark",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Basic",
			"text": "Change a minion's Health to 1.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Marque du chasseur"
			},
			"id": "CS2_084e",
			"name": "Hunter's Mark",
			"playerClass": "Hunter",
			"set": "Basic",
			"text": "This minion has 1 Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Doug Alexander",
			"cardImage": "EX1_169.png",
			"collectible": true,
			"cost": 0,
			"faction": "Neutral",
			"flavor": "Some druids still have flashbacks from strangers yelling \"Innervate me!!\" at them.",
			"fr": {
				"name": "Innervation"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 36.",
			"id": "EX1_169",
			"name": "Innervate",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Basic",
			"text": "Gain 2 Mana Crystals this turn only.",
			"type": "Spell"
		},
		{
			"artist": "Dave Allsop",
			"attack": 8,
			"cardImage": "CS2_232.png",
			"collectible": true,
			"cost": 8,
			"faction": "Neutral",
			"flavor": "I <i>dare</i> you to attack Darnassus.",
			"fr": {
				"name": "Protecteur Écorcefer"
			},
			"health": 8,
			"howToGet": "Unlocked at Level 10.",
			"howToGetGold": "Unlocked at Level 49.",
			"id": "CS2_232",
			"mechanics": [
				"Taunt"
			],
			"name": "Ironbark Protector",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Tooth",
			"attack": 2,
			"cardImage": "CS2_141.png",
			"collectible": true,
			"cost": 3,
			"faction": "Alliance",
			"flavor": "\"Ready! Aim! Drink!\"",
			"fr": {
				"name": "Fusilier de Forgefer"
			},
			"health": 2,
			"howToGetGold": "Unlocked at Mage Level 55.",
			"id": "CS2_141",
			"mechanics": [
				"Battlecry"
			],
			"name": "Ironforge Rifleman",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Deal 1 damage.",
			"type": "Minion"
		},
		{
			"artist": "Lars Grant-West",
			"attack": 3,
			"cardImage": "CS2_125.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "\"Bear Carcass 1/10\"",
			"fr": {
				"name": "Grizzly Ferpoil"
			},
			"health": 3,
			"howToGetGold": "Unlocked at Hunter Level 59.",
			"id": "CS2_125",
			"mechanics": [
				"Taunt"
			],
			"name": "Ironfur Grizzly",
			"race": "Beast",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "HERO_08.png",
			"collectible": true,
			"faction": "Neutral",
			"fr": {
				"name": "Jaina Portvaillant"
			},
			"health": 30,
			"id": "HERO_08",
			"name": "Jaina Proudmoore",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Basic",
			"type": "Hero"
		},
		{
			"artist": "Gabe from Penny Arcade",
			"cardImage": "EX1_539.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "\"Kill!\", he commanded.",
			"fr": {
				"name": "Ordre de tuer"
			},
			"howToGet": "Unlocked at Level 10.",
			"howToGetGold": "Unlocked at Level 49.",
			"id": "EX1_539",
			"name": "Kill Command",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $3 damage. If you have a Beast, deal $5 damage instead.",
			"type": "Spell"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 2,
			"cardImage": "CS2_142.png",
			"collectible": true,
			"cost": 2,
			"faction": "Horde",
			"flavor": "In the old days, Kobolds were the finest candle merchants in the land. Then they got pushed too far...",
			"fr": {
				"name": "Géomancien kobold"
			},
			"health": 2,
			"howToGetGold": "Unlocked at Warlock Level 59.",
			"id": "CS2_142",
			"mechanics": [
				"Spellpower"
			],
			"name": "Kobold Geomancer",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "NEW1_011.png",
			"collectible": true,
			"cost": 4,
			"flavor": "The Kor'kron are the elite forces of Garrosh Hellscream. Let's just say you don't want to run into these guys while wearing a blue tabard.",
			"fr": {
				"name": "Soldat d’élite kor’kron"
			},
			"health": 3,
			"howToGet": "Unlocked at Level 4.",
			"howToGetGold": "Unlocked at Level 44.",
			"id": "NEW1_011",
			"mechanics": [
				"Charge"
			],
			"name": "Kor'kron Elite",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Charge</b>",
			"type": "Minion"
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
			"race": "Beast",
			"rarity": "Common",
			"set": "Basic",
			"text": "Your other minions have +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "CS1h_001.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Soins inférieurs"
			},
			"id": "CS1h_001",
			"name": "Lesser Heal",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Hero Power</b>\nRestore #2 Health.",
			"type": "Hero Power"
		},
		{
			"cardImage": "CS2_056.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Connexion"
			},
			"id": "CS2_056",
			"name": "Life Tap",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Hero Power</b>\nDraw a card and take $2 damage.",
			"type": "Hero Power"
		},
		{
			"artist": "Glenn Rane",
			"attack": 1,
			"cardImage": "CS2_091.png",
			"collectible": true,
			"cost": 1,
			"durability": 4,
			"faction": "Neutral",
			"flavor": "Prince Malchezaar was a collector of rare weapons. He'd animate them and have them dance for him.",
			"fr": {
				"name": "Justice de la Lumière"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 36.",
			"id": "CS2_091",
			"name": "Light's Justice",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Basic",
			"type": "Weapon"
		},
		{
			"artist": "E.M. Gist",
			"attack": 6,
			"cardImage": "CS2_162.png",
			"collectible": true,
			"cost": 6,
			"faction": "Alliance",
			"flavor": "He used to be a 2100+ rated arena player, but that was years ago and nobody can get him to shut up about it.",
			"fr": {
				"name": "Seigneur de l’arène"
			},
			"health": 5,
			"howToGetGold": "Unlocked at Priest Level 59.",
			"id": "CS2_162",
			"mechanics": [
				"Taunt"
			],
			"name": "Lord of the Arena",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Chance de la pièce"
			},
			"id": "GAME_001",
			"name": "Luck of the Coin",
			"set": "Basic",
			"text": "Going second grants you increased Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Gaser",
			"attack": 5,
			"cardImage": "CS2_118.png",
			"collectible": true,
			"cost": 3,
			"flavor": "He likes to think he is powerful, but pretty much anyone can solo Molten Core now.",
			"fr": {
				"name": "Enragé du magma"
			},
			"health": 1,
			"howToGetGold": "Unlocked at Shaman Level 51.",
			"id": "CS2_118",
			"name": "Magma Rager",
			"rarity": "Free",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"cardImage": "HERO_06.png",
			"collectible": true,
			"faction": "Neutral",
			"fr": {
				"name": "Malfurion Hurlorage"
			},
			"health": 30,
			"id": "HERO_06",
			"name": "Malfurion Stormrage",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Basic",
			"type": "Hero"
		},
		{
			"artist": "Brad Vancata",
			"cardImage": "CS2_009.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Not to be confused with Jim of the Wild.",
			"fr": {
				"name": "Marque du fauve"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 28.",
			"id": "CS2_009",
			"name": "Mark of the Wild",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Basic",
			"text": "Give a minion <b>Taunt</b> and +2/+2.<i> (+2 Attack/+2 Health)</i>",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Marque du fauve"
			},
			"id": "CS2_009e",
			"name": "Mark of the Wild",
			"playerClass": "Druid",
			"set": "Basic",
			"text": "This minion has +2/+2 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Présence du maître"
			},
			"id": "DS1_070o",
			"name": "Master's Presence",
			"playerClass": "Hunter",
			"set": "Basic",
			"text": "+2/+2 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "EX1_025t.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Petit dragon mécanique"
			},
			"health": 1,
			"id": "EX1_025t",
			"name": "Mechanical Dragonling",
			"race": "Mech",
			"rarity": "Common",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Puissance de Hurlevent"
			},
			"id": "CS2_222o",
			"name": "Might of Stormwind",
			"set": "Basic",
			"text": "Has +1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "DS1_233.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "This spell blasts you directly in the MIND.",
			"fr": {
				"name": "Attaque mentale"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 15.",
			"id": "DS1_233",
			"name": "Mind Blast",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $5 damage to the enemy hero.",
			"type": "Spell"
		},
		{
			"faction": "Neutral",
			"fr": {
				"name": "Contrôle mental"
			},
			"id": "CS1_113e",
			"name": "Mind Control",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Basic",
			"text": "This minion has switched controllers.",
			"type": "Enchantment"
		},
		{
			"artist": "Sean O’Daniels",
			"cardImage": "CS1_113.png",
			"collectible": true,
			"cost": 10,
			"faction": "Neutral",
			"flavor": "Nominated as \"Spell Most Likely to Make Your Opponent Punch the Wall.\"",
			"fr": {
				"name": "Contrôle mental"
			},
			"howToGet": "Unlocked at Level 10.",
			"howToGetGold": "Unlocked at Level 49.",
			"id": "CS1_113",
			"name": "Mind Control",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Basic",
			"text": "Take control of an enemy minion.",
			"type": "Spell"
		},
		{
			"artist": "Michael Komarck",
			"cardImage": "CS2_003.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "I see what you did there.",
			"fr": {
				"name": "Vision télépathique"
			},
			"howToGet": "Unlocked at Level 4.",
			"howToGetGold": "Unlocked at Level 32.",
			"id": "CS2_003",
			"name": "Mind Vision",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Basic",
			"text": "Put a copy of a random card in your opponent's hand into your hand.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "CS2_mirror.png",
			"cost": 0,
			"faction": "Neutral",
			"fr": {
				"name": "Image miroir"
			},
			"health": 2,
			"id": "CS2_mirror",
			"mechanics": [
				"Taunt"
			],
			"name": "Mirror Image",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "CS2_027.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Oh hey it's Mirror Image! !egamI rorriM s'ti yeh hO",
			"fr": {
				"name": "Image miroir"
			},
			"howToGet": "Unlocked at Level 4.",
			"howToGetGold": "Unlocked at Level 36.",
			"id": "CS2_027",
			"name": "Mirror Image",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Basic",
			"text": "Summon two 0/2 minions with <b>Taunt</b>.",
			"type": "Spell"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Misha",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Mlarggragllabl !"
			},
			"id": "EX1_508o",
			"name": "Mlarggragllabl!",
			"set": "Basic",
			"text": "This Murloc has +1 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "CS2_008.png",
			"collectible": true,
			"cost": 0,
			"faction": "Neutral",
			"flavor": "\"Cast Moonfire, and never stop.\" - How to Be a Druid, Chapter 5, Section 3",
			"fr": {
				"name": "Éclat lunaire"
			},
			"howToGet": "Unlocked at Level 6.",
			"howToGetGold": "Unlocked at Level 40.",
			"id": "CS2_008",
			"name": "Moonfire",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $1 damage.",
			"type": "Spell"
		},
		{
			"artist": "Matt Gaser",
			"cardImage": "EX1_302.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "If your spells look like horrifying skulls, let's be honest, you should get to draw some cards.",
			"fr": {
				"name": "Voile de mort"
			},
			"howToGet": "Unlocked at Level 4.",
			"howToGetGold": "Unlocked at Level 43.",
			"id": "EX1_302",
			"name": "Mortal Coil",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $1 damage to a minion. If that kills it, draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Benjamin Zhang",
			"cardImage": "DS1_183.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "You see, it's all about <i>throughput</i>.",
			"fr": {
				"name": "Flèches multiples"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 36.",
			"id": "DS1_183",
			"name": "Multi-Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $3 damage to two random enemy minions.",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "CS2_168.png",
			"collectible": true,
			"cost": 1,
			"faction": "Alliance",
			"flavor": "Mrrraggglhlhghghlgh, mrgaaag blarrghlgaahahl mrgggg glhalhah a bghhll graggmgmg Garrosh mglhlhlh mrghlhlhl!!",
			"fr": {
				"name": "Écumeur murloc"
			},
			"health": 1,
			"howToGetGold": "Unlocked at Priest Level 51.",
			"id": "CS2_168",
			"name": "Murloc Raider",
			"race": "Murloc",
			"rarity": "Free",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "EX1_506a.png",
			"cost": 0,
			"faction": "Neutral",
			"fr": {
				"name": "Éclaireur murloc"
			},
			"health": 1,
			"id": "EX1_506a",
			"name": "Murloc Scout",
			"race": "Murloc",
			"rarity": "Common",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "EX1_506.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "\"Death will rise, from the tides!\"",
			"fr": {
				"name": "Chasse-marée murloc"
			},
			"health": 1,
			"howToGetGold": "Unlocked at Rogue Level 53.",
			"id": "EX1_506",
			"mechanics": [
				"Battlecry"
			],
			"name": "Murloc Tidehunter",
			"race": "Murloc",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Summon a 1/1 Murloc Scout.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 4,
			"cardImage": "EX1_593.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "Your face is the place you'd probably least like a dagger, and where rogues are most likely to deliver them.",
			"fr": {
				"name": "Lamenuit"
			},
			"health": 4,
			"howToGetGold": "Unlocked at Druid Level 53.",
			"id": "EX1_593",
			"mechanics": [
				"Battlecry"
			],
			"name": "Nightblade",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Battlecry: </b>Deal 3 damage to the enemy hero.",
			"type": "Minion"
		},
		{
			"cardImage": "GAME_006.png",
			"cost": 2,
			"flavor": "Even your flavor text has been deleted. Dang.",
			"fr": {
				"name": "NOOOOOOOOOOOON !"
			},
			"id": "GAME_006",
			"name": "NOOOOOOOOOOOO",
			"set": "Basic",
			"text": "Somehow, the card you USED to have has been deleted.  Here, have this one instead!",
			"type": "Spell"
		},
		{
			"artist": "Terese Nielsen",
			"attack": 1,
			"cardImage": "CS2_235.png",
			"collectible": true,
			"cost": 1,
			"flavor": "They help the downtrodden and distressed.  Also they sell cookies.",
			"fr": {
				"name": "Clerc de Comté-du-Nord"
			},
			"health": 3,
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 40.",
			"id": "CS2_235",
			"mechanics": [
				"HealTarget"
			],
			"name": "Northshire Cleric",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Basic",
			"text": "Whenever a minion is healed, draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Karl Richardson",
			"attack": 1,
			"cardImage": "EX1_015.png",
			"collectible": true,
			"cost": 2,
			"faction": "Alliance",
			"flavor": "\"Half of this class will not graduate… since they'll have been turned to chickens.\" - Tinkmaster Overspark, teaching Gizmos 101.",
			"fr": {
				"name": "Ingénieur novice"
			},
			"health": 1,
			"howToGetGold": "Unlocked at Druid Level 59.",
			"id": "EX1_015",
			"mechanics": [
				"Battlecry"
			],
			"name": "Novice Engineer",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Ittoku",
			"attack": 2,
			"cardImage": "CS2_119.png",
			"collectible": true,
			"cost": 4,
			"flavor": "His dreams of flying and breathing fire like his idol will never be realized.",
			"fr": {
				"name": "Gueule d’acier des oasis"
			},
			"health": 7,
			"howToGetGold": "Unlocked at Druid Level 51.",
			"id": "CS2_119",
			"name": "Oasis Snapjaw",
			"race": "Beast",
			"rarity": "Free",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "CS2_197.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Training Ogres in the art of spellcasting is a questionable decision.",
			"fr": {
				"name": "Ogre-magi"
			},
			"health": 4,
			"howToGetGold": "Unlocked at Warlock Level 55.",
			"id": "CS2_197",
			"mechanics": [
				"Spellpower"
			],
			"name": "Ogre Magi",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"faction": "Neutral",
			"fr": {
				"name": "Métamorphose"
			},
			"id": "CS2_022e",
			"mechanics": [
				"Morph"
			],
			"name": "Polymorph",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Basic",
			"text": "This minion has been transformed into a 1/1 Sheep.",
			"type": "Enchantment"
		},
		{
			"artist": "Vance Kovacs",
			"cardImage": "CS2_022.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "There was going to be a pun in this flavor text, but it just came out baa-d.",
			"fr": {
				"name": "Métamorphose"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 47.",
			"id": "CS2_022",
			"name": "Polymorph",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Basic",
			"text": "Transform a minion into a 1/1 Sheep.",
			"type": "Spell"
		},
		{
			"artist": "Jessica Jung",
			"cardImage": "CS2_004.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Sure the extra protection is nice, but the shield really reduces visibility.",
			"fr": {
				"name": "Mot de pouvoir : Bouclier"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 47.",
			"id": "CS2_004",
			"name": "Power Word: Shield",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Basic",
			"text": "Give a minion +2 Health.\nDraw a card.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Mot de pouvoir : Bouclier"
			},
			"id": "CS2_004e",
			"name": "Power Word: Shield",
			"playerClass": "Priest",
			"set": "Basic",
			"text": "+2 Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Phill Gonzales",
			"attack": 2,
			"cardImage": "CS2_122.png",
			"collectible": true,
			"cost": 3,
			"flavor": "\"That's a 50 DKP minus!\"",
			"fr": {
				"name": "Chef de raid"
			},
			"health": 2,
			"howToGetGold": "Unlocked at Warrior Level 57.",
			"id": "CS2_122",
			"mechanics": [
				"Aura"
			],
			"name": "Raid Leader",
			"rarity": "Free",
			"set": "Basic",
			"text": "Your other minions have +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Clint Langley",
			"attack": 2,
			"cardImage": "CS2_196.png",
			"collectible": true,
			"cost": 3,
			"faction": "Horde",
			"flavor": "Someone did mess with Tuskerr once.  ONCE.",
			"fr": {
				"name": "Chasseuse de Tranchebauge"
			},
			"health": 3,
			"howToGetGold": "Unlocked at Hunter Level 55.",
			"id": "CS2_196",
			"mechanics": [
				"Battlecry"
			],
			"name": "Razorfen Hunter",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Summon a 1/1 Boar.",
			"type": "Minion"
		},
		{
			"artist": "John Polidora",
			"attack": 5,
			"cardImage": "CS2_213.png",
			"collectible": true,
			"cost": 6,
			"faction": "Horde",
			"flavor": "One Insane Rocketeer.   One Rocket full of Explosives.   Infinite Fun.",
			"fr": {
				"name": "Missilière téméraire"
			},
			"health": 2,
			"howToGetGold": "Unlocked at Shaman Level 59.",
			"id": "CS2_213",
			"mechanics": [
				"Charge"
			],
			"name": "Reckless Rocketeer",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_101.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Renfort"
			},
			"id": "CS2_101",
			"name": "Reinforce",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Silver Hand Recruit.",
			"type": "Hero Power"
		},
		{
			"cardImage": "HERO_05.png",
			"collectible": true,
			"faction": "Neutral",
			"fr": {
				"name": "Rexxar"
			},
			"health": 30,
			"id": "HERO_05",
			"name": "Rexxar",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Basic",
			"type": "Hero"
		},
		{
			"artist": "Daren Bader",
			"attack": 2,
			"cardImage": "CS2_120.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Edward \"Lefty\" Smith tried to make luggage out of a river crocolisk once.",
			"fr": {
				"name": "Crocilisque des rivières"
			},
			"health": 3,
			"howToGetGold": "Unlocked at Druid Level 55.",
			"id": "CS2_120",
			"name": "River Crocolisk",
			"race": "Beast",
			"rarity": "Free",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Arme croque-roc"
			},
			"id": "CS2_045e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Rockbiter Weapon",
			"playerClass": "Shaman",
			"set": "Basic",
			"text": "This character has +3 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_045.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "This would be real handy if your enemy is made of rock.",
			"fr": {
				"name": "Arme croque-roc"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 36.",
			"id": "CS2_045",
			"name": "Rockbiter Weapon",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Basic",
			"text": "Give a friendly character +3 Attack this turn.",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "NEW1_003.png",
			"collectible": true,
			"cost": 0,
			"flavor": "This is the reason that Demons never really become friends with Warlocks.",
			"fr": {
				"name": "Pacte sacrificiel"
			},
			"howToGet": "Unlocked at Level 8.",
			"howToGetGold": "Unlocked at Level 15.",
			"id": "NEW1_003",
			"name": "Sacrificial Pact",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Basic",
			"text": "Destroy a Demon. Restore #5 Health to your hero.",
			"type": "Spell"
		},
		{
			"artist": "Scott Altmann",
			"cardImage": "EX1_581.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Rogues love sappy movies.",
			"fr": {
				"name": "Assommer"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 40.",
			"id": "EX1_581",
			"name": "Sap",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Basic",
			"text": "Return an enemy minion to your opponent's hand.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Rugissement sauvage"
			},
			"id": "CS2_011o",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Savage Roar",
			"playerClass": "Druid",
			"set": "Basic",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Grace Liu",
			"cardImage": "CS2_011.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "What do they roar? Nobody can quite tell, but it sounds like \"Elephant Macho Breeze\".  It's probably not that, though.",
			"fr": {
				"name": "Rugissement sauvage"
			},
			"howToGet": "Unlocked at Level 4.",
			"howToGetGold": "Unlocked at Level 43.",
			"id": "CS2_011",
			"name": "Savage Roar",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Basic",
			"text": "Give your characters +2 Attack this turn.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "CS2_050.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Totem incendiaire"
			},
			"health": 1,
			"id": "CS2_050",
			"name": "Searing Totem",
			"playerClass": "Shaman",
			"race": "Totem",
			"rarity": "Free",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"artist": "Brian Despain",
			"attack": 3,
			"cardImage": "CS2_179.png",
			"collectible": true,
			"cost": 4,
			"faction": "Horde",
			"flavor": "Sen'jin Villiage is nice, if you like trolls and dust.",
			"fr": {
				"name": "Maître-bouclier de Sen’jin"
			},
			"health": 5,
			"howToGetGold": "Unlocked at Rogue Level 59.",
			"id": "CS2_179",
			"mechanics": [
				"Taunt"
			],
			"name": "Sen'jin Shieldmasta",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "CS2_057.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "It’s a Bolt.   Its made out of Shadow.   What more do you need to know!",
			"fr": {
				"name": "Trait de l’ombre"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 47.",
			"id": "CS2_057",
			"name": "Shadow Bolt",
			"playerClass": "Warlock",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $4 damage to a minion.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_622.png",
			"collectible": true,
			"cost": 3,
			"flavor": "If you miss, it leaves a lightning-bolt-shaped scar on your target.",
			"fr": {
				"name": "Mot de l’ombre : Mort"
			},
			"howToGet": "Unlocked at Level 8.",
			"howToGetGold": "Unlocked at Level 43.",
			"id": "EX1_622",
			"name": "Shadow Word: Death",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Basic",
			"text": "Destroy a minion with an Attack of 5 or more.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "CS2_234.png",
			"collectible": true,
			"cost": 2,
			"flavor": "A step up from a spell cast by many beginning acolytes: \"Shadow Word: Annoy\".",
			"fr": {
				"name": "Mot de l’ombre : Douleur"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 36.",
			"id": "CS2_234",
			"name": "Shadow Word: Pain",
			"playerClass": "Priest",
			"rarity": "Free",
			"set": "Basic",
			"text": "Destroy a minion with 3 or less Attack.",
			"type": "Spell"
		},
		{
			"cardImage": "CS2_017.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Changeforme"
			},
			"id": "CS2_017",
			"name": "Shapeshift",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Hero Power</b>\n+1 Attack this turn.\n+1 Armor.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Aiguisé"
			},
			"id": "CS2_083e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Sharpened",
			"playerClass": "Rogue",
			"set": "Basic",
			"text": "+1 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Doug Alexander",
			"attack": 3,
			"cardImage": "EX1_019.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "They always have a spare flask of Sunwell Energy Drink™!",
			"fr": {
				"name": "Clerc du Soleil brisé"
			},
			"health": 2,
			"howToGetGold": "Unlocked at Priest Level 53.",
			"id": "EX1_019",
			"mechanics": [
				"Battlecry"
			],
			"name": "Shattered Sun Cleric",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Give a friendly minion +1/+1.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CS2_tk1.png",
			"cost": 0,
			"faction": "Neutral",
			"fr": {
				"name": "Mouton"
			},
			"health": 1,
			"id": "CS2_tk1",
			"name": "Sheep",
			"race": "Beast",
			"rarity": "Common",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"artist": "Michael Komarck",
			"cardImage": "EX1_606.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Shields were invented because Face Block is USELESS.",
			"fr": {
				"name": "Maîtrise du blocage"
			},
			"howToGet": "Unlocked at Level 8.",
			"howToGetGold": "Unlocked at Level 28.",
			"id": "EX1_606",
			"name": "Shield Block",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Basic",
			"text": "Gain 5 Armor.\nDraw a card.",
			"type": "Spell"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_278.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Rogues are experts at SHIV-al-ry.",
			"fr": {
				"name": "Kriss"
			},
			"howToGet": "Unlocked at Level 6.",
			"howToGetGold": "Unlocked at Level 45.",
			"id": "EX1_278",
			"name": "Shiv",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $1 damage. Draw a card.",
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
			"set": "Basic",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"attack": 1,
			"cardImage": "CS2_127.png",
			"collectible": true,
			"cost": 3,
			"faction": "Horde",
			"flavor": "He likes to act like he's in charge, but the silverback matriarch actually runs things.",
			"fr": {
				"name": "Patriarche dos-argenté"
			},
			"health": 4,
			"howToGetGold": "Unlocked at Warrior Level 53.",
			"id": "CS2_127",
			"mechanics": [
				"Taunt"
			],
			"name": "Silverback Patriarch",
			"race": "Beast",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Frank Cho",
			"cardImage": "CS2_075.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "There's something about this strike that just feels off.  Sinister, even.",
			"fr": {
				"name": "Attaque pernicieuse"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 15.",
			"id": "CS2_075",
			"name": "Sinister Strike",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Basic",
			"text": "Deal $3 damage to the enemy hero.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "skele11.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Squelette"
			},
			"health": 1,
			"id": "skele11",
			"name": "Skeleton",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b></b>",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_308.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Are you lighting a soul on fire? Or burning someone with your OWN soul? This seems like an important distinction.",
			"fr": {
				"name": "Feu de l’âme"
			},
			"howToGet": "Unlocked at Level 6.",
			"howToGetGold": "Unlocked at Level 28.",
			"id": "EX1_308",
			"name": "Soulfire",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $4 damage. Discard a random card.",
			"type": "Spell"
		},
		{
			"artist": "James Zhang",
			"cardImage": "CS2_077.png",
			"collectible": true,
			"cost": 7,
			"faction": "Neutral",
			"flavor": "Rogues are not good joggers.",
			"fr": {
				"name": "Sprint"
			},
			"howToGet": "Unlocked at Level 10.",
			"howToGetGold": "Unlocked at Level 49.",
			"id": "CS2_077",
			"name": "Sprint",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Basic",
			"text": "Draw 4 cards.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_173.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "Balance is important to druids.  This card is perfectly balanced.",
			"fr": {
				"name": "Feu stellaire"
			},
			"howToGet": "Unlocked at Level 2.",
			"howToGetGold": "Unlocked at Level 45.",
			"id": "EX1_173",
			"name": "Starfire",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $5 damage.\nDraw a card.",
			"type": "Spell"
		},
		{
			"artist": "Bernie Kang",
			"attack": 3,
			"cardImage": "CS2_237.png",
			"collectible": true,
			"cost": 5,
			"flavor": "If you feed him, he loses his whole <i>identity</i>.",
			"fr": {
				"name": "Busard affamé"
			},
			"health": 2,
			"howToGet": "Unlocked at Level 4.",
			"howToGetGold": "Unlocked at Level 47.",
			"id": "CS2_237",
			"inPlayText": "Soaring",
			"name": "Starving Buzzard",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Common",
			"set": "Basic",
			"text": "Whenever you summon a Beast, draw a card.",
			"type": "Minion"
		},
		{
			"cardImage": "DS1h_292.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Tir assuré"
			},
			"id": "DS1h_292",
			"name": "Steady Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Hero Power</b>\nDeal $2 damage to the enemy hero.",
			"type": "Hero Power"
		},
		{
			"attack": 0,
			"cardImage": "CS2_051.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Totem de griffes de pierre"
			},
			"health": 2,
			"id": "CS2_051",
			"mechanics": [
				"Taunt"
			],
			"name": "Stoneclaw Totem",
			"playerClass": "Shaman",
			"race": "Totem",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Howard Lyon",
			"attack": 1,
			"cardImage": "CS2_171.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "This card is boaring.",
			"fr": {
				"name": "Sanglier brocheroc"
			},
			"health": 1,
			"howToGetGold": "Unlocked at Hunter Level 53.",
			"id": "CS2_171",
			"mechanics": [
				"Charge"
			],
			"name": "Stonetusk Boar",
			"race": "Beast",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"artist": "Kev Walker",
			"attack": 4,
			"cardImage": "CS2_150.png",
			"collectible": true,
			"cost": 5,
			"faction": "Alliance",
			"flavor": "The Stormpike Commandos are demolition experts.  They also bake a mean cupcake.",
			"fr": {
				"name": "Commando foudrepique"
			},
			"health": 2,
			"howToGetGold": "Unlocked at Paladin Level 51.",
			"id": "CS2_150",
			"mechanics": [
				"Battlecry"
			],
			"name": "Stormpike Commando",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Deal 2 damage.",
			"type": "Minion"
		},
		{
			"artist": "Doug Alexander",
			"attack": 6,
			"cardImage": "CS2_222.png",
			"collectible": true,
			"cost": 7,
			"faction": "Alliance",
			"flavor": "When Deathwing assaulted the capital, this soldier was the only member of his squad to survive. Now he's all bitter and stuff.",
			"fr": {
				"name": "Champion de Hurlevent"
			},
			"health": 6,
			"howToGetGold": "Unlocked at Paladin Level 59.",
			"id": "CS2_222",
			"inPlayText": "For the Alliance!",
			"mechanics": [
				"Aura"
			],
			"name": "Stormwind Champion",
			"rarity": "Common",
			"set": "Basic",
			"text": "Your other minions have +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Ladronn",
			"attack": 2,
			"cardImage": "CS2_131.png",
			"collectible": true,
			"cost": 4,
			"faction": "Alliance",
			"flavor": "They're still embarassed about \"The Deathwing Incident\".",
			"fr": {
				"name": "Chevalier de Hurlevent"
			},
			"health": 5,
			"howToGetGold": "Unlocked at Paladin Level 55.",
			"id": "CS2_131",
			"mechanics": [
				"Charge"
			],
			"name": "Stormwind Knight",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 4,
			"cardImage": "EX1_306.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Warlocks have it pretty good.",
			"fr": {
				"name": "Succube"
			},
			"health": 3,
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 40.",
			"id": "EX1_306",
			"mechanics": [
				"Battlecry"
			],
			"name": "Succubus",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Discard a random card.",
			"type": "Minion"
		},
		{
			"artist": "Sean O’Daniels",
			"cardImage": "CS2_012.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "When a bear rears back and extends his arms, he's about to Swipe!  ... or hug.",
			"fr": {
				"name": "Balayage"
			},
			"howToGet": "Unlocked at Level 8.",
			"howToGetGold": "Unlocked at Level 47.",
			"id": "CS2_012",
			"name": "Swipe",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $4 damage to an enemy and $1 damage to all other enemies.",
			"type": "Spell"
		},
		{
			"cardImage": "GAME_005.png",
			"fr": {
				"name": "La pièce"
			},
			"id": "GAME_005",
			"name": "The Coin",
			"set": "Basic",
			"text": "Gain 1 Mana Crystal this turn only.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "La pièce"
			},
			"id": "GAME_005e",
			"name": "The Coin",
			"set": "Basic",
			"type": "Enchantment"
		},
		{
			"cardImage": "HERO_02.png",
			"collectible": true,
			"faction": "Neutral",
			"fr": {
				"name": "Thrall"
			},
			"health": 30,
			"id": "HERO_02",
			"name": "Thrall",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Basic",
			"type": "Hero"
		},
		{
			"artist": "Malcolm Davis",
			"attack": 1,
			"cardImage": "DS1_175.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Other beasts totally dig hanging out with timber wolves.",
			"fr": {
				"name": "Loup des bois"
			},
			"health": 1,
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 23.",
			"id": "DS1_175",
			"mechanics": [
				"Aura"
			],
			"name": "Timber Wolf",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Free",
			"set": "Basic",
			"text": "Your other Beasts have +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "CS2_049.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Appel totémique"
			},
			"id": "CS2_049",
			"name": "Totemic Call",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Hero Power</b>\nSummon a random Totem.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Puissance totémique"
			},
			"id": "EX1_244e",
			"name": "Totemic Might",
			"playerClass": "Shaman",
			"set": "Basic",
			"text": "+2 Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Trent Kaniuga",
			"cardImage": "EX1_244.png",
			"collectible": true,
			"cost": 0,
			"faction": "Neutral",
			"flavor": "Totem-stomping is no longer recommended.",
			"fr": {
				"name": "Puissance totémique"
			},
			"howToGet": "Unlocked at Level 6.",
			"howToGetGold": "Unlocked at Level 28.",
			"id": "EX1_244",
			"name": "Totemic Might",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Basic",
			"text": "Give your Totems +2 Health.",
			"type": "Spell"
		},
		{
			"artist": "Mauro Cascioli",
			"cardImage": "DS1_184.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "For the person who just cannot decide what card to put into a deck!",
			"fr": {
				"name": "Pistage"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 15.",
			"id": "DS1_184",
			"name": "Tracking",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Basic",
			"text": "Look at the top three cards of your deck. Draw one and discard the others.",
			"type": "Spell"
		},
		{
			"artist": "Ryan Sook",
			"attack": 4,
			"cardImage": "CS2_097.png",
			"collectible": true,
			"cost": 4,
			"durability": 2,
			"faction": "Neutral",
			"flavor": "It Slices, it Dices. You can cut a tin can with it. (But you wouldn't want to.)",
			"fr": {
				"name": "Championne en vrai-argent"
			},
			"howToGet": "Unlocked at Level 2.",
			"howToGetGold": "Unlocked at Level 40.",
			"id": "CS2_097",
			"name": "Truesilver Champion",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Basic",
			"text": "Whenever your hero attacks, restore 2 Health to it.",
			"type": "Weapon"
		},
		{
			"artist": "Lars Grant-West",
			"attack": 2,
			"cardImage": "DS1_178.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "Tundra rhinos are often mistaken for kodos.  Or am I mistaken?",
			"fr": {
				"name": "Rhino de la toundra"
			},
			"health": 5,
			"howToGet": "Unlocked at Level 8.",
			"howToGetGold": "Unlocked at Level 43.",
			"id": "DS1_178",
			"name": "Tundra Rhino",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Common",
			"set": "Basic",
			"text": "Your Beasts have <b>Charge</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "HERO_04.png",
			"collectible": true,
			"faction": "Neutral",
			"fr": {
				"name": "Uther le Porteur de Lumière"
			},
			"health": 30,
			"id": "HERO_04",
			"name": "Uther Lightbringer",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Basic",
			"type": "Hero"
		},
		{
			"cardImage": "HERO_03.png",
			"collectible": true,
			"faction": "Neutral",
			"fr": {
				"name": "Valeera Sanguinar"
			},
			"health": 30,
			"id": "HERO_03",
			"name": "Valeera Sanguinar",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Basic",
			"type": "Hero"
		},
		{
			"artist": "Sean O’Daniels",
			"cardImage": "NEW1_004.png",
			"collectible": true,
			"cost": 6,
			"fr": {
				"name": "Disparition"
			},
			"howToGet": "Unlocked at Level 8.",
			"howToGetGold": "Unlocked at Level 23.",
			"id": "NEW1_004",
			"name": "Vanish",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Basic",
			"text": "Return all minions to their owner's hand.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "CS2_065.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "No relation to \"The Voidsteppers\", the popular Void-based dance troupe.",
			"fr": {
				"name": "Marcheur du Vide"
			},
			"health": 3,
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 36.",
			"id": "CS2_065",
			"mechanics": [
				"Taunt"
			],
			"name": "Voidwalker",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Karl Richardson",
			"attack": 2,
			"cardImage": "EX1_011.png",
			"collectible": true,
			"cost": 1,
			"faction": "Horde",
			"flavor": "Voodoo is an oft-misunderstood art. But it <i>is</i> art.",
			"fr": {
				"name": "Docteur vaudou"
			},
			"health": 1,
			"howToGetGold": "Unlocked at Rogue Level 55.",
			"id": "EX1_011",
			"mechanics": [
				"Battlecry"
			],
			"name": "Voodoo Doctor",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Restore 2 Health.",
			"type": "Minion"
		},
		{
			"artist": "Dave Kendall",
			"attack": 7,
			"cardImage": "CS2_186.png",
			"collectible": true,
			"cost": 7,
			"faction": "Neutral",
			"flavor": "Golems are not afraid, but for some reason they still run when you cast Fear on them.  Instinct, maybe?  A desire to blend in?",
			"fr": {
				"name": "Golem de guerre"
			},
			"health": 7,
			"howToGetGold": "Unlocked at Rogue Level 51.",
			"id": "CS2_186",
			"name": "War Golem",
			"rarity": "Common",
			"set": "Basic",
			"type": "Minion"
		},
		{
			"artist": "Wei Wang",
			"attack": 2,
			"cardImage": "EX1_084.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "The Warsong clan is <i>such drama</i>. It's really not worth it to become a commander.",
			"fr": {
				"name": "Officier chanteguerre"
			},
			"health": 3,
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 36.",
			"id": "EX1_084",
			"mechanics": [
				"Aura"
			],
			"name": "Warsong Commander",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Basic",
			"text": "Your <b>Charge</b> minions have +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "John Avon",
			"attack": 3,
			"cardImage": "CS2_033.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Don't summon a water elemental at a party.  It'll dampen the mood.",
			"fr": {
				"name": "Élémentaire d’eau"
			},
			"health": 6,
			"howToGet": "Unlocked at Level 8.",
			"howToGetGold": "Unlocked at Level 49.",
			"id": "CS2_033",
			"inPlayText": "Frostbolt",
			"mechanics": [
				"Freeze"
			],
			"name": "Water Elemental",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Freeze</b> any character damaged by this minion.",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "EX1_400.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "The way to tell seasoned warriors from novice ones: the novices yell \"wheeeee\" while whirlwinding.",
			"fr": {
				"name": "Tourbillon"
			},
			"howToGet": "Unlocked at Level 6.",
			"howToGetGold": "Unlocked at Level 32.",
			"id": "EX1_400",
			"name": "Whirlwind",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Basic",
			"text": "Deal $1 damage to ALL minions.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "CS2_082.png",
			"cost": 1,
			"durability": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Lame pernicieuse"
			},
			"id": "CS2_082",
			"name": "Wicked Knife",
			"playerClass": "Rogue",
			"rarity": "Free",
			"set": "Basic",
			"type": "Weapon"
		},
		{
			"artist": "James Ryman",
			"cardImage": "CS2_013.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Grow your own mana crystals with this Mana Crystal Growth Kit, only 39.99!",
			"fr": {
				"name": "Croissance sauvage"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 23.",
			"id": "CS2_013",
			"name": "Wild Growth",
			"playerClass": "Druid",
			"rarity": "Free",
			"set": "Basic",
			"text": "Gain an empty Mana Crystal.",
			"type": "Spell"
		},
		{
			"artist": "Justin Sweet",
			"cardImage": "CS2_039.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Windfury is like Earthfury and Firefury, but more light and airy.",
			"fr": {
				"name": "Furie des vents"
			},
			"howToGet": "Unlocked at Level 1.",
			"howToGetGold": "Unlocked at Level 23.",
			"id": "CS2_039",
			"name": "Windfury",
			"playerClass": "Shaman",
			"rarity": "Free",
			"set": "Basic",
			"text": "Give a minion <b>Windfury</b>.",
			"type": "Spell"
		},
		{
			"artist": "Vance Kovacs",
			"attack": 3,
			"cardImage": "EX1_587.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Is there anything worse than a Windspeaker with halitosis?",
			"fr": {
				"name": "Parlevent"
			},
			"health": 3,
			"howToGet": "Unlocked at Level 8.",
			"howToGetGold": "Unlocked at Level 45.",
			"id": "EX1_587",
			"mechanics": [
				"Battlecry"
			],
			"name": "Windspeaker",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Basic",
			"text": "<b>Battlecry:</b> Give a friendly minion <b>Windfury</b>.",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 3,
			"cardImage": "CS2_124.png",
			"collectible": true,
			"cost": 3,
			"faction": "Horde",
			"flavor": "Orcish raiders ride wolves because they are well adapted to harsh environments, and because they are soft and cuddly.",
			"fr": {
				"name": "Chevaucheur de loup"
			},
			"health": 1,
			"howToGetGold": "Unlocked at Warrior Level 59.",
			"id": "CS2_124",
			"mechanics": [
				"Charge"
			],
			"name": "Wolfrider",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "CS2_052.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Totem de courroux de l’air"
			},
			"health": 2,
			"id": "CS2_052",
			"mechanics": [
				"Spellpower"
			],
			"name": "Wrath of Air Totem",
			"playerClass": "Shaman",
			"race": "Totem",
			"rarity": "Free",
			"set": "Basic",
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"artist": "Andrew Hou",
			"attack": 4,
			"cardImage": "AT_063.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "With the help of his trusty sidekick Dreadscale, the giant jormungar Acidmaw is ready to face any knight!",
			"fr": {
				"name": "Gueule-d’acide"
			},
			"health": 2,
			"id": "AT_063",
			"name": "Acidmaw",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "Whenever another minion takes damage, destroy it.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Aubaine d’Alexstrasza"
			},
			"id": "AT_071e",
			"name": "Alexstrasza's Boon",
			"playerClass": "Warrior",
			"set": "The Grand Tournament",
			"text": "+1 Attack and <b>Charge</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Evgeniy Zagumennyy",
			"attack": 2,
			"cardImage": "AT_071.png",
			"collectible": true,
			"cost": 2,
			"flavor": "\"Put more spikes on her.  No, more spikes.  What part of 'more spikes' do you not understand?  MORE SPIKES!\" - Alexstrasza",
			"fr": {
				"name": "Championne d’Alexstrasza"
			},
			"health": 3,
			"id": "AT_071",
			"mechanics": [
				"Battlecry"
			],
			"name": "Alexstrasza's Champion",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1 Attack and <b>Charge</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_035t.png",
			"cost": 0,
			"fr": {
				"name": "Embuscade !"
			},
			"id": "AT_035t",
			"name": "Ambush!",
			"playerClass": "Rogue",
			"set": "The Grand Tournament",
			"text": "When you draw this, summon a 4/4 Nerubian for your opponent. Draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "AT_053.png",
			"collectible": true,
			"cost": 2,
			"flavor": "MOMMMMMYYYYYYYYY!!!",
			"fr": {
				"name": "Savoir ancestral"
			},
			"id": "AT_053",
			"mechanics": [
				"Overload"
			],
			"name": "Ancestral Knowledge",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Draw 2 cards. <b>Overload: (2)</b>",
			"type": "Spell"
		},
		{
			"artist": "Eric Braddock",
			"attack": 8,
			"cardImage": "AT_036.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"flavor": "Was actually a pretty nice guy before, you know, the whole Lich King thing.",
			"fr": {
				"name": "Anub’arak"
			},
			"health": 4,
			"id": "AT_036",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Anub'arak",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Deathrattle:</b> Return this to your hand and summon a 4/4 Nerubian.",
			"type": "Minion"
		},
		{
			"artist": "Gabor Szikszai",
			"cardImage": "AT_004.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Now with 100% more blast!",
			"fr": {
				"name": "Déflagration des Arcanes"
			},
			"id": "AT_004",
			"name": "Arcane Blast",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Deal $2 damage to a minion. This spell gets double bonus from <b>Spell Damage</b>.",
			"type": "Spell"
		},
		{
			"artist": "Evgeniy Zagumennyy",
			"attack": 2,
			"cardImage": "AT_087.png",
			"collectible": true,
			"cost": 3,
			"flavor": "His horse's name is Betsy.",
			"fr": {
				"name": "Cavalier d’Argent"
			},
			"health": 1,
			"id": "AT_087",
			"mechanics": [
				"Charge",
				"Divine Shield"
			],
			"name": "Argent Horserider",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Charge</b>\n<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Joe Wilson",
			"attack": 2,
			"cardImage": "AT_077.png",
			"collectible": true,
			"cost": 2,
			"durability": 2,
			"flavor": "The stripes make it look like a candy cane, but we recommend against licking it.",
			"fr": {
				"name": "Lance d’Argent"
			},
			"id": "AT_077",
			"mechanics": [
				"Battlecry"
			],
			"name": "Argent Lance",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, +1 Durability.",
			"type": "Weapon"
		},
		{
			"artist": "Ben Zhang",
			"attack": 2,
			"cardImage": "AT_109.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Who argent watches the Argent Watchman?",
			"fr": {
				"name": "Guetteur d’Argent"
			},
			"health": 4,
			"id": "AT_109",
			"mechanics": [
				"Inspire"
			],
			"name": "Argent Watchman",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "Can't attack.\n<b>Inspire:</b> Can attack as normal this turn.",
			"type": "Minion"
		},
		{
			"artist": "Edouard Guiton & Tony Washington",
			"attack": 5,
			"cardImage": "AT_108.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Yep.  It's a horse... wearing armor... going to war.",
			"fr": {
				"name": "Cheval de guerre cuirassé"
			},
			"health": 3,
			"id": "AT_108",
			"mechanics": [
				"Battlecry"
			],
			"name": "Armored Warhorse",
			"race": "Beast",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, gain <b>Charge</b>.",
			"type": "Minion"
		},
		{
			"artist": "Christopher Moeller",
			"cardImage": "AT_043.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Hey!  Moon!  Can I have some mana crystals?",
			"fr": {
				"name": "Communion astrale"
			},
			"id": "AT_043",
			"name": "Astral Communion",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Gain 10 Mana Crystals. Discard your hand.",
			"type": "Spell"
		},
		{
			"artist": "Velvet Engine",
			"attack": 5,
			"cardImage": "AT_045.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"flavor": "Call her \"Tweety\".  She'll find it real funny.  I PROMISE.",
			"fr": {
				"name": "Aviana"
			},
			"health": 5,
			"id": "AT_045",
			"mechanics": [
				"Aura"
			],
			"name": "Aviana",
			"playerClass": "Druid",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "Your minions cost (1).",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"cardImage": "AT_062.png",
			"collectible": true,
			"cost": 6,
			"flavor": "\"THEY'RE EVERYWHERE GET THEM OFF!!!\" - Everyone",
			"fr": {
				"name": "Boule d’araignées"
			},
			"id": "AT_062",
			"name": "Ball of Spiders",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "Summon three 1/1 Webspinners.",
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
			"set": "The Grand Tournament",
			"text": "<b>Hero Power</b>\nDeal $3 damage to the enemy hero.",
			"type": "Hero Power"
		},
		{
			"artist": "Dany Orizio",
			"cardImage": "AT_064.png",
			"collectible": true,
			"cost": 3,
			"flavor": "You might think bashing doesn't take a lot of practice.  It doesn't.",
			"fr": {
				"name": "Sonner"
			},
			"id": "AT_064",
			"name": "Bash",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Deal $3 damage.\nGain 3 Armor.",
			"type": "Spell"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "AT_060.png",
			"collectible": true,
			"cost": 2,
			"flavor": "You'll never guess what's in that conveniently bear-sized, bear-smelling box.",
			"fr": {
				"name": "Piège à ours"
			},
			"id": "AT_060",
			"mechanics": [
				"Secret"
			],
			"name": "Bear Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Secret:</b> After your hero is attacked, summon a 3/3 Bear with <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "AT_035.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Can you hold these eggs for just a second?  I promise they're not full of giant enraged undead spider things.",
			"fr": {
				"name": "Embusqué"
			},
			"id": "AT_035",
			"name": "Beneath the Grounds",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Shuffle 3 Ambushes into your opponent's deck. When drawn, you summon a 4/4 Nerubian.",
			"type": "Spell"
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
			"mechanics": [
				"Charge"
			],
			"name": "Boar",
			"race": "Beast",
			"set": "The Grand Tournament",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 3,
			"cardImage": "AT_124.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "Bolf keeps coming in 2nd at the Grand Tournament.  It might be his year this year, if Lebron doesn't enter.",
			"fr": {
				"name": "Bolf Bélier-Frondeur"
			},
			"health": 9,
			"id": "AT_124",
			"name": "Bolf Ramshield",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "Whenever your hero takes damage, this minion takes it instead.",
			"type": "Minion"
		},
		{
			"artist": "Mishi McCaig",
			"cardImage": "AT_068.png",
			"collectible": true,
			"cost": 2,
			"flavor": "The best offense is a good defense.",
			"fr": {
				"name": "Renforcement"
			},
			"id": "AT_068",
			"name": "Bolster",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Give your <b>Taunt</b> minions +2/+2.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Renforcé"
			},
			"id": "AT_068e",
			"name": "Bolstered",
			"playerClass": "Warrior",
			"set": "The Grand Tournament",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 3,
			"cardImage": "AT_089.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Underneath all that impressive armor, he's just skin and bones.  Okay, maybe just bones.",
			"fr": {
				"name": "Lieutenant de la garde d’os"
			},
			"health": 2,
			"id": "AT_089",
			"mechanics": [
				"Inspire"
			],
			"name": "Boneguard Lieutenant",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Gain +1 Health.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Garde d’os"
			},
			"id": "AT_089e",
			"name": "Boneguarded",
			"set": "The Grand Tournament",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Eva Widermann",
			"attack": 2,
			"cardImage": "AT_059.png",
			"collectible": true,
			"cost": 1,
			"flavor": "This is a \"bearly\" concealed reference.",
			"fr": {
				"name": "Brave archère"
			},
			"health": 1,
			"id": "AT_059",
			"mechanics": [
				"Inspire"
			],
			"name": "Brave Archer",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> If your hand is empty, deal 2 damage to the enemy hero.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Venez vous battre !"
			},
			"id": "AT_116e",
			"name": "Bring it on!",
			"playerClass": "Priest",
			"set": "The Grand Tournament",
			"text": "+1 Attack and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "AT_029.png",
			"collectible": true,
			"cost": 1,
			"flavor": "The best part of buccaneering is the pants.",
			"fr": {
				"name": "Boucanier"
			},
			"health": 1,
			"id": "AT_029",
			"name": "Buccaneer",
			"playerClass": "Rogue",
			"race": "Pirate",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Whenever you equip a weapon, give it +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"cardImage": "AT_033.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Yoink!",
			"fr": {
				"name": "Larcin"
			},
			"id": "AT_033",
			"name": "Burgle",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "Add 2 random class cards to your hand <i>(from your opponent's class)</i>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Appel des étendues sauvages"
			},
			"id": "AT_041e",
			"name": "Call of the Wild",
			"set": "The Grand Tournament",
			"text": "Cost reduced.",
			"type": "Enchantment"
		},
		{
			"artist": "Gonzalo Ordonez",
			"attack": 5,
			"cardImage": "AT_102.png",
			"collectible": true,
			"cost": 7,
			"flavor": "You can keep him, but you have to promise to feed him and clean out his tank every day!",
			"fr": {
				"name": "Jormungar capturé"
			},
			"health": 9,
			"id": "AT_102",
			"name": "Captured Jormungar",
			"race": "Beast",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Cérémonie"
			},
			"id": "AT_117e",
			"name": "Ceremony",
			"set": "The Grand Tournament",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Peet Cooper",
			"attack": 2,
			"cardImage": "AT_050.png",
			"collectible": true,
			"cost": 4,
			"durability": 4,
			"flavor": "You can only pick it up if you are worthy.",
			"fr": {
				"name": "Marteau chargé"
			},
			"id": "AT_050",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Charged Hammer",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "<b>Deathrattle:</b> Your Hero Power becomes 'Deal 2 damage.'",
			"type": "Weapon"
		},
		{
			"fr": {
				"name": "Lance de chi"
			},
			"id": "AT_028e",
			"name": "Chi Lance",
			"set": "The Grand Tournament",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "AT_123.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "Chillmaw keeps trying to ruin the Grand Tournament, and she would've done it too, if it weren't for those dang kids!",
			"fr": {
				"name": "Frissegueule"
			},
			"health": 6,
			"id": "AT_123",
			"mechanics": [
				"Deathrattle",
				"Taunt"
			],
			"name": "Chillmaw",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Taunt</b>\n<b>Deathrattle:</b> If you're holding a Dragon, deal 3 damage to all minions.",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 5,
			"cardImage": "AT_096.png",
			"collectible": true,
			"cost": 5,
			"flavor": "It takes a lot to wind him up.",
			"fr": {
				"name": "Chevalier mécanique"
			},
			"health": 5,
			"id": "AT_096",
			"mechanics": [
				"Battlecry"
			],
			"name": "Clockwork Knight",
			"race": "Mech",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Give a friendly Mech +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Christopher Moeller",
			"attack": 6,
			"cardImage": "AT_008.png",
			"collectible": true,
			"cost": 6,
			"flavor": "The Grand Tournament has a \"No dragons allowed\" policy, but it's rarely enforced.",
			"fr": {
				"name": "Drake de Frimarra"
			},
			"health": 6,
			"id": "AT_008",
			"mechanics": [
				"Aura"
			],
			"name": "Coldarra Drake",
			"playerClass": "Mage",
			"race": "Dragon",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "You can use your Hero Power any number of times.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "AT_110.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Meets monthly with the gladiators to discuss career goals.",
			"fr": {
				"name": "Régisseur du Colisée"
			},
			"health": 5,
			"id": "AT_110",
			"mechanics": [
				"Inspire"
			],
			"name": "Coliseum Manager",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Return this minion to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "AT_073.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Competition can be an inspiration to improve oneself.  Or kill all the competitors.",
			"fr": {
				"name": "Esprit combatif"
			},
			"id": "AT_073",
			"mechanics": [
				"Secret"
			],
			"name": "Competitive Spirit",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Secret:</b> When your turn starts, give your minions +1/+1.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Esprit combatif"
			},
			"id": "AT_073e",
			"name": "Competitive Spirit",
			"set": "The Grand Tournament",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Chris Rahn",
			"attack": 5,
			"cardImage": "AT_018.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "She sees into your past and makes you face your fears.  Most common fear:  Getting Majordomo out of Sneed's Old Shredder.",
			"fr": {
				"name": "Confesseur d’argent Paletress"
			},
			"health": 4,
			"id": "AT_018",
			"mechanics": [
				"Inspire"
			],
			"name": "Confessor Paletress",
			"playerClass": "Priest",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Summon a random <b>Legendary</b> minion.",
			"type": "Minion"
		},
		{
			"artist": "Sean O'Danield",
			"cardImage": "AT_016.png",
			"collectible": true,
			"cost": 2,
			"flavor": "This minion is really powerful!",
			"fr": {
				"name": "Confusion"
			},
			"id": "AT_016",
			"name": "Confuse",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Swap the Attack and Health of all minions.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Confus"
			},
			"id": "AT_016e",
			"name": "Confused",
			"playerClass": "Priest",
			"set": "The Grand Tournament",
			"text": "Swapped Attack and Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Dos Santos",
			"cardImage": "AT_015.png",
			"collectible": true,
			"cost": 2,
			"flavor": "\"Are you interested in... HEALTH benefits?!\"",
			"fr": {
				"name": "Convertir"
			},
			"id": "AT_015",
			"name": "Convert",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "Put a copy of an enemy minion into your hand.",
			"type": "Spell"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 4,
			"cardImage": "AT_121.png",
			"collectible": true,
			"cost": 4,
			"flavor": "The crowd ALWAYS yells lethal.",
			"fr": {
				"name": "Favori de la foule"
			},
			"health": 4,
			"id": "AT_121",
			"name": "Crowd Favorite",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Whenever you play a card with <b>Battlecry</b>, gain +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "AT_031.png",
			"collectible": true,
			"cost": 2,
			"flavor": "He has a giant collection of purses now.  One for every outfit!",
			"fr": {
				"name": "Vide-gousset"
			},
			"health": 2,
			"id": "AT_031",
			"name": "Cutpurse",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "Whenever this minion attacks a hero, add the Coin to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 3,
			"cardImage": "AT_006.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Is he aspiring or inspiring?  Make up your mind!",
			"fr": {
				"name": "Aspirant de Dalaran"
			},
			"health": 5,
			"id": "AT_006",
			"mechanics": [
				"Inspire"
			],
			"name": "Dalaran Aspirant",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Gain <b>Spell Damage +1</b>.",
			"type": "Minion"
		},
		{
			"artist": "Paul Mafayon",
			"cardImage": "AT_025.png",
			"collectible": true,
			"cost": 6,
			"flavor": "A prime example of lose-lose negotiating.",
			"fr": {
				"name": "Sombre marché"
			},
			"id": "AT_025",
			"name": "Dark Bargain",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Destroy 2 random enemy minions. Discard 2 random cards.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Sombre fusion"
			},
			"id": "AT_024e",
			"name": "Dark Fusion",
			"set": "The Grand Tournament",
			"text": "+3/+3.",
			"type": "Enchantment"
		},
		{
			"artist": "Laurel Austin",
			"attack": 2,
			"cardImage": "AT_038.png",
			"collectible": true,
			"cost": 2,
			"flavor": "She loves mana crystals, she hates mana crystals.   So fickle!",
			"fr": {
				"name": "Aspirante de Darnassus"
			},
			"health": 3,
			"id": "AT_038",
			"mechanics": [
				"Battlecry",
				"Deathrattle"
			],
			"name": "Darnassus Aspirant",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Gain an empty Mana Crystal.\n<b>Deathrattle:</b> Lose a Mana Crystal.",
			"type": "Minion"
		},
		{
			"artist": "Kevin Chen",
			"cardImage": "AT_024.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Very dangerous when attached to a demonbomb.",
			"fr": {
				"name": "Fusion démoniaque"
			},
			"id": "AT_024",
			"name": "Demonfuse",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Give a Demon +3/+3. Give your opponent a Mana Crystal.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Griffes sinistres"
			},
			"id": "AT_132_DRUIDe",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Dire Claws",
			"playerClass": "Druid",
			"set": "The Grand Tournament",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
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
			"set": "The Grand Tournament",
			"text": "<b>Hero Power</b>\nGain 2 Armor and +2 Attack this turn.",
			"type": "Hero Power"
		},
		{
			"artist": "RK Post",
			"attack": 4,
			"cardImage": "AT_047.png",
			"collectible": true,
			"cost": 4,
			"flavor": "It's nice to find a real craftsman in this day and age of mass-produced totems.",
			"fr": {
				"name": "Grave-totem draeneï"
			},
			"health": 4,
			"id": "AT_047",
			"mechanics": [
				"Battlecry"
			],
			"name": "Draenei Totemcarver",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Gain +1/+1 for each friendly Totem.",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 3,
			"cardImage": "AT_083.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Check it out.  You can do barrel rolls on this thing.",
			"fr": {
				"name": "Chevaucheur de faucon-dragon"
			},
			"health": 3,
			"id": "AT_083",
			"mechanics": [
				"Inspire"
			],
			"name": "Dragonhawk Rider",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Gain <b>Windfury</b>\nthis turn.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Volerie de faucons-dragons"
			},
			"id": "AT_083e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Dragonhawkery",
			"set": "The Grand Tournament",
			"text": "<b>Windfury</b> this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 4,
			"cardImage": "AT_063t.png",
			"collectible": true,
			"cost": 3,
			"elite": true,
			"flavor": "Let's be clear about this:  ACIDMAW is the sidekick.",
			"fr": {
				"name": "Écaille-d’effroi"
			},
			"health": 2,
			"id": "AT_063t",
			"name": "Dreadscale",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "At the end of your turn, deal 1 damage to all other minions.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "AT_019.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Crescendo himself summoned this steed, riding it to victory in the Grand Tournament.  Wherever he rides, an army of riders ride behind him, supporting the legendary champion.",
			"fr": {
				"name": "Destrier de l’effroi"
			},
			"health": 1,
			"id": "AT_019",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Dreadsteed",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "<b>Deathrattle:</b> Summon a Dreadsteed.",
			"type": "Minion"
		},
		{
			"artist": "Arthur Gimaldinov",
			"attack": 2,
			"cardImage": "AT_042.png",
			"collectible": true,
			"cost": 2,
			"flavor": "That's saberTEETH, not like curved pirate blades.  That's a different kind of druid.  Druid of the Curved Pirate Blades.",
			"fr": {
				"name": "Druidesse du Sabre"
			},
			"health": 1,
			"id": "AT_042",
			"name": "Druid of the Saber",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Choose One -</b> Transform to gain <b>Charge</b>; or +1/+1 and <b>Stealth</b>.",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 3,
			"cardImage": "AT_081.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "Nobody rocks a monocle like Eadric.",
			"fr": {
				"name": "Eadric le Pur"
			},
			"health": 7,
			"id": "AT_081",
			"mechanics": [
				"Battlecry"
			],
			"name": "Eadric the Pure",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Change all enemy minions'\nAttack to 1.",
			"type": "Minion"
		},
		{
			"artist": "Tooth",
			"cardImage": "AT_002.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Burning man, brah.",
			"fr": {
				"name": "Effigie"
			},
			"id": "AT_002",
			"mechanics": [
				"Secret"
			],
			"name": "Effigy",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Secret:</b> When a friendly minion dies, summon a random minion with the same Cost.",
			"type": "Spell"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "AT_051.png",
			"collectible": true,
			"cost": 3,
			"flavor": "I'm not a shaman or anything, but isn't Elemental Destruction the opposite of what they want to do?",
			"fr": {
				"name": "Destruction élémentaire"
			},
			"id": "AT_051",
			"mechanics": [
				"Overload"
			],
			"name": "Elemental Destruction",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Deal $4-$5 damage to all minions. <b>Overload: (5)</b>",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Brume surpuissante"
			},
			"id": "AT_045e",
			"name": "Empowering Mist",
			"set": "The Grand Tournament",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "AT_078.png",
			"collectible": true,
			"cost": 6,
			"flavor": "You have to get past the vendors first.  So many are lost to shopping...",
			"fr": {
				"name": "Entrée dans le Colisée"
			},
			"id": "AT_078",
			"name": "Enter the Coliseum",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Destroy all minions except each player's highest Attack minion.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Équipé"
			},
			"id": "AT_084e",
			"name": "Equipped",
			"set": "The Grand Tournament",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "AT_114.png",
			"collectible": true,
			"cost": 4,
			"flavor": "To be honest, heckling is not the most effective form of evil.",
			"fr": {
				"name": "Provocateur maléfique"
			},
			"health": 4,
			"id": "AT_114",
			"mechanics": [
				"Taunt"
			],
			"name": "Evil Heckler",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Expérimenté"
			},
			"id": "AT_047e",
			"name": "Experienced",
			"playerClass": "Shaman",
			"set": "The Grand Tournament",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Pique supplémentaire"
			},
			"id": "AT_077e",
			"name": "Extra Poke",
			"set": "The Grand Tournament",
			"text": "+1 Durability.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Lame effilée"
			},
			"id": "AT_029e",
			"name": "Extra Stabby",
			"set": "The Grand Tournament",
			"text": "+1 Attack",
			"type": "Enchantment"
		},
		{
			"artist": "Ben Thompson",
			"attack": 3,
			"cardImage": "AT_131.png",
			"collectible": true,
			"cost": 3,
			"elite": true,
			"flavor": "HATES being called \"the wonder twins\".",
			"fr": {
				"name": "Eydis Plaie-sombre"
			},
			"health": 4,
			"id": "AT_131",
			"name": "Eydis Darkbane",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "Whenever <b>you</b> target this minion with a spell, deal 3 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"artist": "Arthur Bozonnet",
			"attack": 3,
			"cardImage": "AT_003.png",
			"collectible": true,
			"cost": 2,
			"flavor": "And he can't get up.",
			"fr": {
				"name": "Héros défunt"
			},
			"health": 2,
			"id": "AT_003",
			"name": "Fallen Hero",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "Your Hero Power deals 1 extra damage.",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 6,
			"cardImage": "AT_020.png",
			"collectible": true,
			"cost": 7,
			"flavor": "They were originally called Cuddleguards, but they were not inspiring the proper amount of fear.",
			"fr": {
				"name": "Garde funeste effroyable"
			},
			"health": 8,
			"id": "AT_020",
			"name": "Fearsome Doomguard",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Gangrerage"
			},
			"id": "AT_021e",
			"name": "Felrage",
			"playerClass": "Warlock",
			"set": "The Grand Tournament",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Howard Lyon",
			"attack": 2,
			"cardImage": "AT_115.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Good fencers make good neighbors, right?",
			"fr": {
				"name": "Maître d’escrime"
			},
			"health": 2,
			"id": "AT_115",
			"mechanics": [
				"Battlecry"
			],
			"name": "Fencing Coach",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> The next time you use your Hero Power, it costs (2) less.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Entraînement à l’escrime"
			},
			"id": "AT_115e",
			"name": "Fencing Practice",
			"set": "The Grand Tournament",
			"text": "Your Hero Power costs (2) less.",
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
			"set": "The Grand Tournament",
			"text": "<b>Hero Power</b>\nDeal $2 damage.",
			"type": "Hero Power"
		},
		{
			"artist": "Matt Dixon",
			"cardImage": "AT_022.png",
			"collectible": true,
			"cost": 4,
			"flavor": "* Not actually Jaraxxus' fist.",
			"fr": {
				"name": "Poing de Jaraxxus"
			},
			"id": "AT_022",
			"name": "Fist of Jaraxxus",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "When you play or discard this, deal $4 damage to a random enemy.",
			"type": "Spell"
		},
		{
			"artist": "Mark Zug",
			"attack": 3,
			"cardImage": "AT_129.png",
			"collectible": true,
			"cost": 3,
			"elite": true,
			"flavor": "LOVES being called \"the wonder twins\".",
			"fr": {
				"name": "Fjola Plaie-lumineuse"
			},
			"health": 4,
			"id": "AT_129",
			"name": "Fjola Lightbane",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "Whenever <b>you</b> target this minion with a spell, gain <b>Divine Shield.</b>",
			"type": "Minion"
		},
		{
			"artist": "James Zhang",
			"attack": 2,
			"cardImage": "AT_094.png",
			"collectible": true,
			"cost": 2,
			"flavor": "At first he liked juggling chain saws, but then he thought, \"Flames are better!  Because FIRE!\"",
			"fr": {
				"name": "Jongleur de flammes"
			},
			"health": 3,
			"id": "AT_094",
			"mechanics": [
				"Battlecry"
			],
			"name": "Flame Juggler",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Deal 1 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"artist": "Nutthapon Petchthai",
			"cardImage": "AT_001.png",
			"collectible": true,
			"cost": 5,
			"flavor": "It's on the rack next to ice lance, acid lance, and English muffin lance.",
			"fr": {
				"name": "Lance de flammes"
			},
			"id": "AT_001",
			"name": "Flame Lance",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Deal $8 damage to a minion.",
			"type": "Spell"
		},
		{
			"artist": "Marcelo Vignali",
			"cardImage": "AT_055.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Flash!  Ahhhhhhh~",
			"fr": {
				"name": "Soins rapides"
			},
			"id": "AT_055",
			"name": "Flash Heal",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Restore #5 Health.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Forges d’Orgrimmar"
			},
			"id": "AT_066e",
			"name": "Forges of Orgrimmar",
			"playerClass": "Warrior",
			"set": "The Grand Tournament",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "AT_093.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Ironically, the natural enemy of the snobold is THE CANDLE.",
			"fr": {
				"name": "Frigbold algide"
			},
			"health": 6,
			"id": "AT_093",
			"mechanics": [
				"Spellpower"
			],
			"name": "Frigid Snobold",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"artist": "Greg Staples",
			"attack": 8,
			"cardImage": "AT_120.png",
			"collectible": true,
			"cost": 10,
			"flavor": "Don't ask him about the beard.  JUST DON'T.",
			"fr": {
				"name": "Géant du givre"
			},
			"health": 8,
			"id": "AT_120",
			"name": "Frost Giant",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Costs (1) less for each time you used your Hero Power this game.",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 1,
			"cardImage": "AT_133.png",
			"collectible": true,
			"cost": 1,
			"flavor": "It's not HER fault you didn't put a spinning saw blade on your horse.",
			"fr": {
				"name": "Jouteuse de Gadgetzan"
			},
			"health": 2,
			"id": "AT_133",
			"mechanics": [
				"Battlecry"
			],
			"name": "Gadgetzan Jouster",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, gain +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 2,
			"cardImage": "AT_080.png",
			"collectible": true,
			"cost": 2,
			"flavor": "He'll never admit it, but he pushes you hard because he really cares about you.",
			"fr": {
				"name": "Commandant du fief"
			},
			"health": 3,
			"id": "AT_080",
			"mechanics": [
				"Aura"
			],
			"name": "Garrison Commander",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "You can use your Hero Power twice a turn.",
			"type": "Minion"
		},
		{
			"artist": "Nutthapon Petchthai",
			"attack": 4,
			"cardImage": "AT_122.png",
			"collectible": true,
			"cost": 4,
			"elite": true,
			"flavor": "Gormok has been giving impaling lessons in a small tent near the tournament grounds.  For only 25g you too could learn the fine art of impaling!",
			"fr": {
				"name": "Gormok l’Empaleur"
			},
			"health": 4,
			"id": "AT_122",
			"mechanics": [
				"Battlecry"
			],
			"name": "Gormok the Impaler",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> If you have at least 4 other minions, deal 4 damage.",
			"type": "Minion"
		},
		{
			"artist": "Todd Lockwood",
			"attack": 5,
			"cardImage": "AT_118.png",
			"collectible": true,
			"cost": 6,
			"flavor": "A veteran of a number of crusades, she is a force for light and goodness.  Her latest crusade is against goblin telemarketers.",
			"fr": {
				"name": "Grande croisée"
			},
			"health": 5,
			"id": "AT_118",
			"mechanics": [
				"Battlecry"
			],
			"name": "Grand Crusader",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Add a random Paladin card to your hand.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Étrillé"
			},
			"id": "AT_057o",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Groomed",
			"playerClass": "Hunter",
			"set": "The Grand Tournament",
			"text": "<b>Immune</b> this turn.",
			"type": "Enchantment"
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
			"set": "The Grand Tournament",
			"text": "<b>Hero Power</b>\nRestore #4 Health.",
			"type": "Hero Power"
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
			"set": "The Grand Tournament",
			"text": "At the end of your turn, restore 1 Health to all friendly minions.",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "AT_048.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Favored by shaman who study the art of restoration and healing, this spell would feel smug, if it had feelings.",
			"fr": {
				"name": "Vague de soins"
			},
			"id": "AT_048",
			"name": "Healing Wave",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "Restore #7 Health. Reveal a minion in each deck. If yours costs more, Restore #14 instead.",
			"type": "Spell"
		},
		{
			"artist": "Alex Garner",
			"attack": 3,
			"cardImage": "AT_011.png",
			"collectible": true,
			"cost": 4,
			"flavor": "She really likes seeing people get better.  That's why she hurts them in the first place.",
			"fr": {
				"name": "Championne sacrée"
			},
			"health": 5,
			"id": "AT_011",
			"name": "Holy Champion",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Whenever a character is healed, gain +2 Attack.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Ego énorme"
			},
			"id": "AT_121e",
			"name": "Huge Ego",
			"set": "The Grand Tournament",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 5,
			"cardImage": "AT_092.png",
			"collectible": true,
			"cost": 3,
			"flavor": "He's a lot cooler than Magma Rager.",
			"fr": {
				"name": "Enragé de glace"
			},
			"health": 2,
			"id": "AT_092",
			"name": "Ice Rager",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"type": "Minion"
		},
		{
			"artist": "John Polidora",
			"attack": 10,
			"cardImage": "AT_125.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"flavor": "This massive yeti just closes his eyes and charges at the nearest target.  The nearest Target is a couple blocks away and has sick deals on skateboards.",
			"fr": {
				"name": "Glace-Hurlante"
			},
			"health": 10,
			"id": "AT_125",
			"mechanics": [
				"Charge"
			],
			"name": "Icehowl",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Charge</b>\nCan't attack heroes.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 2,
			"cardImage": "AT_105.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Don't worry.  With a little skin cream he's going to clear right up.",
			"fr": {
				"name": "Kvaldir blessé"
			},
			"health": 4,
			"id": "AT_105",
			"mechanics": [
				"Battlecry"
			],
			"name": "Injured Kvaldir",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Deal 3 damage to this minion.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Exalté"
			},
			"id": "AT_109e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Inspired",
			"set": "The Grand Tournament",
			"text": "Can attack this turn.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Exalté"
			},
			"id": "AT_119e",
			"name": "Inspired",
			"set": "The Grand Tournament",
			"text": "Increased Stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Jomaro Kindred",
			"attack": 6,
			"cardImage": "AT_132.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "It's like putting racing stripes and a giant spoiler on your hero power.",
			"fr": {
				"name": "Justicière Cœur-Vrai"
			},
			"health": 3,
			"id": "AT_132",
			"mechanics": [
				"Battlecry"
			],
			"name": "Justicar Trueheart",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Replace your starting Hero Power with a better one.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Âme sœur"
			},
			"id": "AT_040e",
			"name": "Kindred Spirit",
			"playerClass": "Druid",
			"set": "The Grand Tournament",
			"text": "+3 Health.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Défenseur du roi"
			},
			"id": "AT_065e",
			"name": "King's Defender",
			"set": "The Grand Tournament",
			"text": "+1 Durability.",
			"type": "Enchantment"
		},
		{
			"artist": "Michael Franchina",
			"attack": 3,
			"cardImage": "AT_065.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"flavor": "\"King's Attacker\" is a shield.  Funny, huh?",
			"fr": {
				"name": "Défenseur du roi"
			},
			"id": "AT_065",
			"mechanics": [
				"Battlecry"
			],
			"name": "King's Defender",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry</b>: If you have a minion with <b>Taunt</b>,  gain +1 Durability.",
			"type": "Weapon"
		},
		{
			"artist": "James Zhang",
			"attack": 3,
			"cardImage": "AT_058.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Elekk jousting is AWESOME.",
			"fr": {
				"name": "Elekk du roi"
			},
			"health": 2,
			"id": "AT_058",
			"mechanics": [
				"Battlecry"
			],
			"name": "King's Elekk",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, draw it.",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 6,
			"cardImage": "AT_041.png",
			"collectible": true,
			"cost": 7,
			"flavor": "He gets a discount on the tournament entry fee because he is his own horse.",
			"fr": {
				"name": "Chevalier des étendues sauvages"
			},
			"health": 6,
			"id": "AT_041",
			"name": "Knight of the Wild",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "Whenever you summon a Beast, reduce the Cost of this card by (1).",
			"type": "Minion"
		},
		{
			"artist": "Ben Wootten",
			"attack": 3,
			"cardImage": "AT_099.png",
			"collectible": true,
			"cost": 6,
			"flavor": "Someone called her a Rhinorider, and she's NOT HAPPY.",
			"fr": {
				"name": "Chevaucheuse de kodo"
			},
			"health": 5,
			"id": "AT_099",
			"mechanics": [
				"Inspire"
			],
			"name": "Kodorider",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Summon a 3/5 War Kodo.",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 4,
			"cardImage": "AT_119.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Coming soon... to a tuskarr village near you!",
			"fr": {
				"name": "Écumeur kvaldir"
			},
			"health": 4,
			"id": "AT_119",
			"mechanics": [
				"Inspire"
			],
			"name": "Kvaldir Raider",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Gain +2/+2.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Enduit perfide"
			},
			"id": "AT_034e",
			"name": "Laced",
			"playerClass": "Rogue",
			"set": "The Grand Tournament",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Tyson Murphy",
			"attack": 1,
			"cardImage": "AT_084.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Lance Carrier is an obscure entry level position in orcish armies.  A mystery, since orcs don't generally use lances.",
			"fr": {
				"name": "Porte-lance"
			},
			"health": 2,
			"id": "AT_084",
			"mechanics": [
				"Battlecry"
			],
			"name": "Lance Carrier",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Give a friendly minion +2 Attack.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Bénédiction par la Lumière"
			},
			"id": "AT_011e",
			"mechanics": [
				"Aura"
			],
			"name": "Light's Blessing",
			"set": "The Grand Tournament",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Andrea Uderzo",
			"attack": 4,
			"cardImage": "AT_106.png",
			"collectible": true,
			"cost": 3,
			"flavor": "When there's something strange (say, a gibbering demon) in your neighborhood, who are you going to call?",
			"fr": {
				"name": "Champion de la Lumière"
			},
			"health": 3,
			"id": "AT_106",
			"mechanics": [
				"Battlecry"
			],
			"name": "Light's Champion",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> <b>Silence</b> a Demon.",
			"type": "Minion"
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
			"set": "The Grand Tournament",
			"text": "<b>Hero Power</b>\nDeal $2 damage.",
			"type": "Hero Power"
		},
		{
			"cardImage": "AT_042a.png",
			"fr": {
				"name": "Forme de lion"
			},
			"id": "AT_042a",
			"name": "Lion Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Charge</b>",
			"type": "Spell"
		},
		{
			"cardImage": "AT_037b.png",
			"fr": {
				"name": "Racines vivantes"
			},
			"id": "AT_037b",
			"name": "Living Roots",
			"set": "The Grand Tournament",
			"text": "Summon two 1/1 Saplings.",
			"type": "Spell"
		},
		{
			"cardImage": "AT_037a.png",
			"fr": {
				"name": "Racines vivantes"
			},
			"id": "AT_037a",
			"name": "Living Roots",
			"set": "The Grand Tournament",
			"text": "Deal $2 damage.",
			"type": "Spell"
		},
		{
			"artist": "Dan Brereton",
			"cardImage": "AT_037.png",
			"collectible": true,
			"cost": 1,
			"flavor": "2 out of 2 saplings recommend that you summon the saplings.",
			"fr": {
				"name": "Racines vivantes"
			},
			"id": "AT_037",
			"name": "Living Roots",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Choose One</b> - Deal $2 damage; or Summon two 1/1 Saplings.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"cardImage": "AT_061.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Rexxar narrowed his eyes, grabbed his machine gun, and said: \"It's go time.  Lock and load.\"\nThis card pays homage to that special moment.",
			"fr": {
				"name": "Prêt à tirer"
			},
			"id": "AT_061",
			"name": "Lock and Load",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Each time you cast a spell this turn, add a random Hunter card to your hand.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Prêt à tirer"
			},
			"id": "AT_061e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Lock and Load",
			"playerClass": "Hunter",
			"set": "The Grand Tournament",
			"type": "Enchantment"
		},
		{
			"artist": "Ron Spears",
			"attack": 1,
			"cardImage": "AT_082.png",
			"collectible": true,
			"cost": 1,
			"flavor": "But not the lowliest!",
			"fr": {
				"name": "Modeste écuyer"
			},
			"health": 2,
			"id": "AT_082",
			"mechanics": [
				"Inspire"
			],
			"name": "Lowly Squire",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Gain +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "AT_067.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Playing him also gets you into the Magnataur Beta.",
			"fr": {
				"name": "Magnataure alpha"
			},
			"health": 3,
			"id": "AT_067",
			"name": "Magnataur Alpha",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Also damages the minions next to whomever\nhe attacks.",
			"type": "Minion"
		},
		{
			"artist": "Froilan Gardner",
			"attack": 2,
			"cardImage": "AT_085.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Not a good basis for a system of government.",
			"fr": {
				"name": "Damoiselle du Lac"
			},
			"health": 6,
			"id": "AT_085",
			"mechanics": [
				"Aura"
			],
			"name": "Maiden of the Lake",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Your Hero Power costs (1).",
			"type": "Minion"
		},
		{
			"artist": "Penny Arcade",
			"attack": 5,
			"cardImage": "AT_112.png",
			"collectible": true,
			"cost": 6,
			"flavor": "Needs just a few more ratings points to become Grandmaster Jouster.",
			"fr": {
				"name": "Maître jouteur"
			},
			"health": 6,
			"id": "AT_112",
			"mechanics": [
				"Battlecry"
			],
			"name": "Master Jouster",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, gain <b>Taunt</b> and <b>Divine Shield</b>.",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 4,
			"cardImage": "AT_117.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Goes by \"MC ElfyElf\".",
			"fr": {
				"name": "Maîtresse de cérémonie"
			},
			"health": 2,
			"id": "AT_117",
			"mechanics": [
				"Battlecry"
			],
			"name": "Master of Ceremonies",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> If you have a minion with <b>Spell Damage</b>, gain +2/+2.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Maître invocateur"
			},
			"id": "AT_027e",
			"name": "Master Summoner",
			"playerClass": "Warlock",
			"set": "The Grand Tournament",
			"text": "Costs (0).",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Puissance du valet d’écurie"
			},
			"id": "AT_075e",
			"name": "Might of the Hostler",
			"playerClass": "Paladin",
			"set": "The Grand Tournament",
			"text": "Warhorse Trainer is granting this minion +1 Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Puissance du singe"
			},
			"id": "AT_090e",
			"name": "Might of the Monkey",
			"set": "The Grand Tournament",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Ench. de deck de mandebrume"
			},
			"id": "AT_045ee",
			"name": "Mistcaller Deck Ench",
			"set": "The Grand Tournament",
			"type": "Enchantment"
		},
		{
			"artist": "Steve Prescott",
			"attack": 8,
			"cardImage": "AT_088.png",
			"collectible": true,
			"cost": 6,
			"flavor": "This champion has learned from the best.  Except for his target selection.",
			"fr": {
				"name": "Champion de Mogor"
			},
			"health": 5,
			"id": "AT_088",
			"name": "Mogor's Champion",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "50% chance to attack the wrong enemy.",
			"type": "Minion"
		},
		{
			"artist": "Andrew Hou",
			"attack": 4,
			"cardImage": "AT_090.png",
			"collectible": true,
			"cost": 5,
			"flavor": "An elegant gorilla, for a more civilized age.",
			"fr": {
				"name": "Champion de Mukla"
			},
			"health": 3,
			"id": "AT_090",
			"mechanics": [
				"Inspire"
			],
			"name": "Mukla's Champion",
			"race": "Beast",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Give your other minions +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "AT_044.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Is this a noun or a verb?  We will never know.",
			"fr": {
				"name": "Charpie"
			},
			"id": "AT_044",
			"name": "Mulch",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Destroy a minion.\nAdd a random minion to your opponent's hand.",
			"type": "Spell"
		},
		{
			"artist": "Sam Nielson",
			"attack": 3,
			"cardImage": "AT_076.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Hee hee!  Look at his cute little feet.",
			"fr": {
				"name": "Chevalier murloc"
			},
			"health": 4,
			"id": "AT_076",
			"mechanics": [
				"Inspire"
			],
			"name": "Murloc Knight",
			"playerClass": "Paladin",
			"race": "Murloc",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Summon a random Murloc.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 6,
			"cardImage": "AT_079.png",
			"collectible": true,
			"cost": 6,
			"flavor": "He may sound surly and antisocial, but he's actually just really shy.",
			"fr": {
				"name": "Adversaire mystérieux"
			},
			"health": 6,
			"id": "AT_079",
			"mechanics": [
				"Battlecry"
			],
			"name": "Mysterious Challenger",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Put one of each <b>Secret</b> from your deck into the battlefield.",
			"type": "Minion"
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
			"set": "The Grand Tournament",
			"type": "Minion"
		},
		{
			"artist": "Marcleo Vignali",
			"attack": 4,
			"cardImage": "AT_127.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"flavor": "The ethereals have their own jousting tournament, and Saraad is the reigning champion.  Also he won the ethereal hot dog eating contest.",
			"fr": {
				"name": "Champion du Nexus Saraad"
			},
			"health": 5,
			"id": "AT_127",
			"mechanics": [
				"Inspire"
			],
			"name": "Nexus-Champion Saraad",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Add a random spell to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Seamus Gallagher",
			"attack": 9,
			"cardImage": "AT_103.png",
			"collectible": true,
			"cost": 9,
			"flavor": "You have no idea how tired this guy is of being released.",
			"fr": {
				"name": "Kraken de la mer Boréale"
			},
			"health": 7,
			"id": "AT_103",
			"mechanics": [
				"Battlecry"
			],
			"name": "North Sea Kraken",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Deal 4 damage.",
			"type": "Minion"
		},
		{
			"artist": "Hideaki Takamura",
			"attack": 3,
			"cardImage": "AT_066.png",
			"collectible": true,
			"cost": 3,
			"flavor": "\"Four out of three orcs struggle with math.\" - Angry Zurge",
			"fr": {
				"name": "Aspirant d’Orgrimmar"
			},
			"health": 3,
			"id": "AT_066",
			"mechanics": [
				"Inspire"
			],
			"name": "Orgrimmar Aspirant",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Give your weapon +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "AT_042b.png",
			"fr": {
				"name": "Forme de panthère"
			},
			"id": "AT_042b",
			"name": "Panther Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "+1/+1 and <b>Stealth</b>",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "AT_101.png",
			"collectible": true,
			"cost": 5,
			"flavor": "What did the pits ever do to you?",
			"fr": {
				"name": "Combattante de la fosse"
			},
			"health": 6,
			"id": "AT_101",
			"name": "Pit Fighter",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"type": "Minion"
		},
		{
			"artist": "Nutthapon Petchthai",
			"attack": 1,
			"cardImage": "AT_034.png",
			"collectible": true,
			"cost": 4,
			"durability": 3,
			"flavor": "How much more poisoned can a blade get?  The answer is a lot.  A lot more poisoned.",
			"fr": {
				"name": "Lame empoisonnée"
			},
			"id": "AT_034",
			"name": "Poisoned Blade",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Your Hero Power gives this weapon +1 Attack instead of replacing it.",
			"type": "Weapon"
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
			"set": "The Grand Tournament",
			"type": "Weapon"
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
			"set": "The Grand Tournament",
			"text": "<b>Hero Power</b>\nEquip a 2/2 Weapon.",
			"type": "Hero Power"
		},
		{
			"artist": "Mike Sass",
			"cardImage": "AT_005.png",
			"collectible": true,
			"cost": 3,
			"flavor": "It's always Huffer.",
			"fr": {
				"name": "Métamorphose : sanglier"
			},
			"id": "AT_005",
			"name": "Polymorph: Boar",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "Transform a minion into a 4/2 Boar with <b>Charge</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Puissance de Dalaran"
			},
			"id": "AT_006e",
			"name": "Power of Dalaran",
			"playerClass": "Mage",
			"set": "The Grand Tournament",
			"text": "Increased Spell Damage.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Puissance des Pitons"
			},
			"id": "AT_049e",
			"name": "Power of the Bluff",
			"playerClass": "Shaman",
			"set": "The Grand Tournament",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Mot de pouvoir : Gloire"
			},
			"id": "AT_013e",
			"name": "Power Word: Glory",
			"set": "The Grand Tournament",
			"text": "When this attacks, restore 4 Health to the hero of the player who buffed it.",
			"type": "Enchantment"
		},
		{
			"artist": "Mike Sass",
			"cardImage": "AT_013.png",
			"collectible": true,
			"cost": 1,
			"flavor": "The promise of glory is a powerful tool to get minions to do your bidding.  Only slightly less powerful than the promise of an ice cream bar!",
			"fr": {
				"name": "Mot de pouvoir : Gloire"
			},
			"id": "AT_013",
			"name": "Power Word: Glory",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Choose a minion. Whenever it attacks, restore 4 Health to\nyour hero.",
			"type": "Spell"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "AT_056.png",
			"collectible": true,
			"cost": 3,
			"flavor": "pow POW pow",
			"fr": {
				"name": "Tir puissant"
			},
			"id": "AT_056",
			"name": "Powershot",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "Deal $2 damage to a minion and the minions next to it.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Purifié"
			},
			"id": "AT_081e",
			"name": "Purified",
			"playerClass": "Paladin",
			"set": "The Grand Tournament",
			"text": "Attack changed to 1.",
			"type": "Enchantment"
		},
		{
			"artist": "Brandon Kitkouski",
			"attack": 3,
			"cardImage": "AT_010.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Not getting trampled is really the trick here.",
			"fr": {
				"name": "Dompteur de béliers"
			},
			"health": 3,
			"id": "AT_010",
			"mechanics": [
				"Battlecry"
			],
			"name": "Ram Wrangler",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> If you have a Beast, summon a\nrandom Beast.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 5,
			"cardImage": "AT_113.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Join the Argent Crusade!  We have attractive tabards and you get to carry really nice swords!",
			"fr": {
				"name": "Recruteur"
			},
			"health": 4,
			"id": "AT_113",
			"mechanics": [
				"Inspire"
			],
			"name": "Recruiter",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Add a 2/2 Squire to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Ron Spears",
			"attack": 3,
			"cardImage": "AT_111.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Menu:  Funnel cakes, carrots, popcorn, jormungar steaks.  It's hard serving a diverse clientele.",
			"fr": {
				"name": "Vendeur de rafraîchissements"
			},
			"health": 5,
			"id": "AT_111",
			"mechanics": [
				"Battlecry"
			],
			"name": "Refreshment Vendor",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Restore 4 Health to each hero.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 7,
			"cardImage": "AT_009.png",
			"collectible": true,
			"cost": 8,
			"elite": true,
			"flavor": "A masterless shamurai.",
			"fr": {
				"name": "Rhonin"
			},
			"health": 7,
			"id": "AT_009",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Rhonin",
			"playerClass": "Mage",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Deathrattle:</b> Add 3 copies of Arcane Missiles to your hand.",
			"type": "Minion"
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
			"mechanics": [
				"Charge"
			],
			"name": "Sabertooth Lion",
			"playerClass": "Druid",
			"race": "Beast",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Charge</b>",
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
			"mechanics": [
				"Stealth"
			],
			"name": "Sabertooth Panther",
			"playerClass": "Druid",
			"race": "Beast",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"artist": "Greg Staples",
			"attack": 4,
			"cardImage": "AT_086.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Listen all y'all it's a saboteur!",
			"fr": {
				"name": "Saboteur"
			},
			"health": 3,
			"id": "AT_086",
			"mechanics": [
				"Battlecry"
			],
			"name": "Saboteur",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Your opponent's Hero Power costs (5) more next turn.",
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
			"set": "The Grand Tournament",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Sauvage"
			},
			"id": "AT_039e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Savage",
			"playerClass": "Druid",
			"set": "The Grand Tournament",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Pascenko",
			"attack": 5,
			"cardImage": "AT_039.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Maybe if you whistle a tune it will soothe him.  Yeah...  Try that.",
			"fr": {
				"name": "Combattant sauvage"
			},
			"health": 4,
			"id": "AT_039",
			"mechanics": [
				"Inspire"
			],
			"name": "Savage Combatant",
			"playerClass": "Druid",
			"race": "Beast",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Give your hero\n+2 Attack this turn.",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 6,
			"cardImage": "AT_130.png",
			"collectible": true,
			"cost": 6,
			"flavor": "A little better than Sea Minus Reaver.",
			"fr": {
				"name": "Saccageur des mers"
			},
			"health": 7,
			"id": "AT_130",
			"name": "Sea Reaver",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "When you draw this, deal 1 damage to your minions.",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "AT_074.png",
			"collectible": true,
			"cost": 3,
			"flavor": "\"Arf! Arf! Arf!\" - Seal of Champions",
			"fr": {
				"name": "Sceau des champions"
			},
			"id": "AT_074",
			"name": "Seal of Champions",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Give a minion\n+3 Attack and <b>Divine Shield</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Sceau des champions"
			},
			"id": "AT_074e2",
			"name": "Seal of Champions",
			"playerClass": "Paladin",
			"set": "The Grand Tournament",
			"text": "+3 Attack and <b>Divine Shield</b>.",
			"type": "Enchantment"
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
			"set": "The Grand Tournament",
			"type": "Minion"
		},
		{
			"artist": "Ryan Metcaff",
			"attack": 3,
			"cardImage": "AT_028.png",
			"collectible": true,
			"cost": 5,
			"flavor": "He needed a break after that business in the Vale of Eternal Blossoms. Naturally, he chose to spend his vacation in an icy snowscape killing monsters.",
			"fr": {
				"name": "Chevaucheur pandashan"
			},
			"health": 7,
			"id": "AT_028",
			"mechanics": [
				"Combo"
			],
			"name": "Shado-Pan Rider",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Combo:</b> Gain +3 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Warren Mahy",
			"attack": 3,
			"cardImage": "AT_014.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Hopes to be promoted to \"Shadowfriend\" someday.",
			"fr": {
				"name": "Ombrefiel"
			},
			"health": 3,
			"id": "AT_014",
			"name": "Shadowfiend",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "Whenever you draw a card, reduce its Cost by (1).",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Effet d’ombrefiel"
			},
			"id": "AT_014e",
			"name": "Shadowfiended",
			"playerClass": "Priest",
			"set": "The Grand Tournament",
			"text": "Costs (1) less.",
			"type": "Enchantment"
		},
		{
			"artist": "Tooth",
			"attack": 4,
			"cardImage": "AT_032.png",
			"collectible": true,
			"cost": 3,
			"flavor": "I have great deal for you... for 4 damage to your face!",
			"fr": {
				"name": "Marchand douteux"
			},
			"health": 3,
			"id": "AT_032",
			"mechanics": [
				"Battlecry"
			],
			"name": "Shady Dealer",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> If you have a Pirate, gain +1/+1.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Marché douteux"
			},
			"id": "AT_032e",
			"name": "Shady Deals",
			"playerClass": "Rogue",
			"set": "The Grand Tournament",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 6,
			"cardImage": "AT_098.png",
			"collectible": true,
			"cost": 6,
			"flavor": "Hey!  Let me try that...",
			"fr": {
				"name": "Mangesort prodigieuse"
			},
			"health": 5,
			"id": "AT_098",
			"mechanics": [
				"Battlecry"
			],
			"name": "Sideshow Spelleater",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Copy your opponent's Hero Power.",
			"type": "Minion"
		},
		{
			"artist": "Esad Ribic",
			"attack": 2,
			"cardImage": "AT_095.png",
			"collectible": true,
			"cost": 3,
			"flavor": "He used to be a librarian.  Old habits die hard.",
			"fr": {
				"name": "Chevalier silencieux"
			},
			"health": 2,
			"id": "AT_095",
			"mechanics": [
				"Divine Shield",
				"Stealth"
			],
			"name": "Silent Knight",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Stealth</b>\n<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "John Polidora",
			"attack": 3,
			"cardImage": "AT_100.png",
			"collectible": true,
			"cost": 3,
			"flavor": "The Silver Hand is the best paladin organization.  The Argent Crusaders are super jealous.",
			"fr": {
				"name": "Régente de la Main d’argent"
			},
			"health": 3,
			"id": "AT_100",
			"mechanics": [
				"Inspire"
			],
			"name": "Silver Hand Regent",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Summon a 1/1 Silver Hand Recruit.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "AT_070.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "What's more boss than riding a parrot with a jawbone for a shoulderpad while wielding a giant hook-lance-thing and wearing a pirate hat?  NOTHING.",
			"fr": {
				"name": "Cap’taine céleste Kragg"
			},
			"health": 6,
			"id": "AT_070",
			"mechanics": [
				"Charge"
			],
			"name": "Skycap'n Kragg",
			"race": "Pirate",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Charrrrrge</b>\nCosts (1) less for each friendly Pirate.",
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
			"set": "The Grand Tournament",
			"text": "<b>Hero Power</b>\nDraw a card.",
			"type": "Hero Power"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "AT_069.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Come at me, bro.",
			"fr": {
				"name": "Partenaire d’entraînement"
			},
			"health": 2,
			"id": "AT_069",
			"mechanics": [
				"Battlecry",
				"Taunt"
			],
			"name": "Sparring Partner",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Taunt</b>\n<b>Battlecry:</b> Give a\nminion <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"attack": 5,
			"cardImage": "AT_012.png",
			"collectible": true,
			"cost": 4,
			"flavor": "What did you expect to happen?  He's a Spawn.  Of Shadows.",
			"fr": {
				"name": "Rejeton des Ombres"
			},
			"health": 4,
			"id": "AT_012",
			"mechanics": [
				"Inspire"
			],
			"name": "Spawn of Shadows",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Deal 4 damage to each hero.",
			"type": "Minion"
		},
		{
			"artist": "Andrew Hou",
			"attack": 3,
			"cardImage": "AT_007.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Does he sling spells, or do his spells linger about.  Who can say?",
			"fr": {
				"name": "Jette-sorts"
			},
			"health": 4,
			"id": "AT_007",
			"mechanics": [
				"Battlecry"
			],
			"name": "Spellslinger",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Add a random spell to each player's hand.",
			"type": "Minion"
		},
		{
			"artist": "Tyson Murphy",
			"attack": 4,
			"cardImage": "AT_057.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Takes way better care of her pets than her brother, Unstablemaster.",
			"fr": {
				"name": "Maître des écuries"
			},
			"health": 2,
			"id": "AT_057",
			"mechanics": [
				"Battlecry"
			],
			"name": "Stablemaster",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Give a friendly Beast <b>Immune</b> this turn.",
			"type": "Minion"
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
			"set": "The Grand Tournament",
			"text": "<b>Taunt</b>",
			"type": "Minion"
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
			"set": "The Grand Tournament",
			"text": "<b>Hero Power</b>\nGain 4 Armor.",
			"type": "Hero Power"
		},
		{
			"artist": "Wei Wang",
			"attack": 4,
			"cardImage": "AT_054.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "Calling the mist doesn't sound all that great.  \"Ooooh, it is slightly damp now!\"",
			"fr": {
				"name": "Le mandebrume"
			},
			"health": 4,
			"id": "AT_054",
			"mechanics": [
				"Battlecry"
			],
			"name": "The Mistcaller",
			"playerClass": "Shaman",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Give all minions in your hand and deck +1/+1.",
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
			"set": "The Grand Tournament",
			"text": "<b>Hero Power</b>\nSummon two 1/1 Recruits.",
			"type": "Hero Power"
		},
		{
			"artist": "Mike Sass",
			"attack": 7,
			"cardImage": "AT_128.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "Apparently it really was just a flesh wound.",
			"fr": {
				"name": "Le chevalier squelette"
			},
			"health": 4,
			"id": "AT_128",
			"mechanics": [
				"Deathrattle"
			],
			"name": "The Skeleton Knight",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Deathrattle:</b> Reveal a minion in each deck. If yours costs more, return this to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Sean McNally",
			"attack": 3,
			"cardImage": "AT_049.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Allowing totems to attack is not cheating.  I mean, there isn't anything in the rule books about it.",
			"fr": {
				"name": "Vaillant des Pitons-du-Tonnerre"
			},
			"health": 6,
			"id": "AT_049",
			"mechanics": [
				"Inspire"
			],
			"name": "Thunder Bluff Valiant",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Give your Totems +2 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "AT_021.png",
			"collectible": true,
			"cost": 2,
			"flavor": "\"No, no, no. I asked for a tiny JESTER of evil.\"",
			"fr": {
				"name": "Minuscule chevalier maléfique"
			},
			"health": 2,
			"id": "AT_021",
			"name": "Tiny Knight of Evil",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "Whenever you discard a card, gain +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 3,
			"cardImage": "AT_052.png",
			"collectible": true,
			"cost": 2,
			"flavor": "What happens when you glue a buncha totems together.",
			"fr": {
				"name": "Golem totémique"
			},
			"health": 4,
			"id": "AT_052",
			"mechanics": [
				"Overload"
			],
			"name": "Totem Golem",
			"playerClass": "Shaman",
			"race": "Totem",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Overload: (1)</b>",
			"type": "Minion"
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
			"set": "The Grand Tournament",
			"text": "<b>Hero Power</b>\nSummon a Totem of your choice.",
			"type": "Hero Power"
		},
		{
			"artist": "Adam Byrne",
			"attack": 2,
			"cardImage": "AT_097.png",
			"collectible": true,
			"cost": 1,
			"flavor": "He was so excited to get season tickets to this year's Grand Tournament.  He normally doesn't get them at first and has to buy them from Ogre scalpers.",
			"fr": {
				"name": "Spectateur du tournoi"
			},
			"health": 1,
			"id": "AT_097",
			"mechanics": [
				"Taunt"
			],
			"name": "Tournament Attendee",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Sean McNally",
			"attack": 1,
			"cardImage": "AT_091.png",
			"collectible": true,
			"cost": 4,
			"flavor": "The medic tournament is less entertaining than the Grand Tournament.",
			"fr": {
				"name": "Médecin du tournoi"
			},
			"health": 8,
			"id": "AT_091",
			"mechanics": [
				"Inspire"
			],
			"name": "Tournament Medic",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Restore 2 Health to your hero.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Entraînement"
			},
			"id": "AT_082e",
			"name": "Training",
			"set": "The Grand Tournament",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Entraînement terminé"
			},
			"id": "AT_069e",
			"name": "Training Complete",
			"playerClass": "Warrior",
			"set": "The Grand Tournament",
			"text": "<b>Taunt</b>",
			"type": "Enchantment"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 5,
			"cardImage": "AT_104.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Just could not be talked out of using his turtle for the joust...",
			"fr": {
				"name": "Jouteur rohart"
			},
			"health": 5,
			"id": "AT_104",
			"mechanics": [
				"Battlecry"
			],
			"name": "Tuskarr Jouster",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, restore 7 Health to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Eva Widermann",
			"attack": 3,
			"cardImage": "AT_046.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Turns out the tuskarr aren't real choosy about their totems.",
			"fr": {
				"name": "Rohart totémique"
			},
			"health": 2,
			"id": "AT_046",
			"mechanics": [
				"Battlecry"
			],
			"name": "Tuskarr Totemic",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Summon ANY random Totem.",
			"type": "Minion"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 2,
			"cardImage": "AT_017.png",
			"collectible": true,
			"cost": 4,
			"flavor": "A result of magical experiments carried out by the Black Dragonflight, it's not his fault that he's a vicious killer.",
			"fr": {
				"name": "Gardien du Crépuscule"
			},
			"health": 6,
			"id": "AT_017",
			"mechanics": [
				"Battlecry"
			],
			"name": "Twilight Guardian",
			"race": "Dragon",
			"rarity": "Epic",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1 Attack and <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Étreinte du Crépuscule"
			},
			"id": "AT_017e",
			"name": "Twilight's Embrace",
			"set": "The Grand Tournament",
			"text": "+1 Attack and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 3,
			"cardImage": "AT_030.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Almost went to play for Stormwind before signing with Undercity.",
			"fr": {
				"name": "Vaillant de Fossoyeuse"
			},
			"health": 2,
			"id": "AT_030",
			"mechanics": [
				"Combo"
			],
			"name": "Undercity Valiant",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Combo:</b> Deal 1 damage.",
			"type": "Minion"
		},
		{
			"artist": "Wei Wang",
			"attack": 7,
			"cardImage": "AT_072.png",
			"collectible": true,
			"cost": 10,
			"elite": true,
			"flavor": "Leader of the Alliance!  Father of Anduin!  Also he likes to play Arena, and he averages 12 wins.",
			"fr": {
				"name": "Varian Wrynn"
			},
			"health": 7,
			"id": "AT_072",
			"mechanics": [
				"Battlecry"
			],
			"name": "Varian Wrynn",
			"playerClass": "Warrior",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Draw 3 cards.\nPut any minions you drew directly into the battlefield.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Victoire !"
			},
			"id": "AT_133e",
			"name": "Victory!",
			"set": "The Grand Tournament",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Vilenie"
			},
			"id": "AT_086e",
			"name": "Villainy",
			"set": "The Grand Tournament",
			"text": "Your Hero Power costs (5) more this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 5,
			"cardImage": "AT_023.png",
			"collectible": true,
			"cost": 6,
			"flavor": "We like to call him \"Wesley\".",
			"fr": {
				"name": "Écraseur du Vide"
			},
			"health": 4,
			"id": "AT_023",
			"mechanics": [
				"Inspire"
			],
			"name": "Void Crusher",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Inspire:</b> Destroy a random minion for each player.",
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
			"race": "Beast",
			"set": "The Grand Tournament",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 2,
			"cardImage": "AT_075.png",
			"collectible": true,
			"cost": 3,
			"flavor": "He doesn't even get Sundays off.  Every day he's hostling.",
			"fr": {
				"name": "Maître des chevaux de guerre"
			},
			"health": 4,
			"id": "AT_075",
			"mechanics": [
				"Aura"
			],
			"name": "Warhorse Trainer",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Your Silver Hand Recruits have +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "AT_040.png",
			"collectible": true,
			"cost": 4,
			"flavor": "She was born to be something.  She is just not quite sure what yet...",
			"fr": {
				"name": "Marcheuse sauvage"
			},
			"health": 4,
			"id": "AT_040",
			"mechanics": [
				"Battlecry"
			],
			"name": "Wildwalker",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> Give a friendly Beast +3 Health.",
			"type": "Minion"
		},
		{
			"artist": "Tooth",
			"attack": 4,
			"cardImage": "AT_027.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "He can summon anything, even a FEARSOME DOOMGUARD*.\n*He's pretty sure this is going to work out.",
			"fr": {
				"name": "Wilfred Flopboum"
			},
			"health": 4,
			"id": "AT_027",
			"name": "Wilfred Fizzlebang",
			"playerClass": "Warlock",
			"rarity": "Legendary",
			"set": "The Grand Tournament",
			"text": "Cards you draw from your Hero Power cost (0).",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Remonté"
			},
			"id": "AT_096e",
			"name": "Wound Up",
			"set": "The Grand Tournament",
			"text": "+1/+1.",
			"type": "Enchantment"
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
			"set": "The Grand Tournament",
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"artist": "Sojin Hwang",
			"attack": 4,
			"cardImage": "AT_026.png",
			"collectible": true,
			"cost": 2,
			"flavor": "After playing against 5 Annoy-O-Trons, any normal guard will become a Wrathguard.",
			"fr": {
				"name": "Garde-courroux"
			},
			"health": 3,
			"id": "AT_026",
			"name": "Wrathguard",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Common",
			"set": "The Grand Tournament",
			"text": "Whenever this minion takes damage, also deal that amount to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Jeff Easley",
			"attack": 1,
			"cardImage": "AT_116.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Keeping tabs on the Grand Tournament is priority #1 for the five mighty Dragonflights!",
			"fr": {
				"name": "Agent du Repos du ver"
			},
			"health": 4,
			"id": "AT_116",
			"mechanics": [
				"Battlecry"
			],
			"name": "Wyrmrest Agent",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "The Grand Tournament",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1 Attack and <b>Taunt</b>.",
			"type": "Minion"
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
			"mechanics": [
				"Charge"
			],
			"name": "Aberration",
			"set": "Blackrock Mountain",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA14_2H.png",
			"cost": 0,
			"fr": {
				"name": "Activer Arcanotron"
			},
			"id": "BRMA14_2H",
			"name": "Activate Arcanotron",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nActivate Arcanotron!",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA14_2.png",
			"cost": 2,
			"fr": {
				"name": "Activer Arcanotron"
			},
			"id": "BRMA14_2",
			"name": "Activate Arcanotron",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nActivate Arcanotron!",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA14_6H.png",
			"cost": 4,
			"fr": {
				"name": "Activer Électron"
			},
			"id": "BRMA14_6H",
			"name": "Activate Electron",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nActivate Electron!",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA14_6.png",
			"cost": 6,
			"fr": {
				"name": "Activer Électron"
			},
			"id": "BRMA14_6",
			"name": "Activate Electron",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nActivate Electron!",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA14_8.png",
			"cost": 8,
			"fr": {
				"name": "Activer Magmatron"
			},
			"id": "BRMA14_8",
			"name": "Activate Magmatron",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nActivate Magmatron!",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA14_8H.png",
			"cost": 6,
			"fr": {
				"name": "Activer Magmatron"
			},
			"id": "BRMA14_8H",
			"name": "Activate Magmatron",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nActivate Magmatron!",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA14_4H.png",
			"cost": 2,
			"fr": {
				"name": "Activer Toxitron"
			},
			"id": "BRMA14_4H",
			"name": "Activate Toxitron",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nActivate Toxitron!",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA14_4.png",
			"cost": 4,
			"fr": {
				"name": "Activer Toxitron"
			},
			"id": "BRMA14_4",
			"name": "Activate Toxitron",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nActivate Toxitron!",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA14_10.png",
			"cost": 4,
			"fr": {
				"name": "Activation !"
			},
			"id": "BRMA14_10",
			"name": "Activate!",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nActivate a random Tron.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA14_10H.png",
			"cost": 2,
			"fr": {
				"name": "Activation !"
			},
			"id": "BRMA14_10H",
			"name": "Activate!",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nActivate a random Tron.",
			"type": "Hero Power"
		},
		{
			"attack": 2,
			"cardImage": "BRMA14_3.png",
			"cost": 0,
			"elite": true,
			"fr": {
				"name": "Arcanotron"
			},
			"health": 2,
			"id": "BRMA14_3",
			"mechanics": [
				"Spellpower"
			],
			"name": "Arcanotron",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "Both players have <b>Spell Damage +2</b>.",
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
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA16_1H.png",
			"fr": {
				"name": "Atramédès"
			},
			"health": 30,
			"id": "BRMA16_1H",
			"name": "Atramedes",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"artist": "Efrem Palacios",
			"attack": 2,
			"cardImage": "BRM_016.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Once a lowly \"Stick Flinger\", he's been relentless on the path to his ultimate dream: \"Tauren Flinger\".",
			"fr": {
				"name": "Lanceur de hache"
			},
			"health": 5,
			"howToGet": "Unlocked by completing the Warrior Class Challenge in Blackrock Mountain.",
			"howToGetGold": "Can be crafted after completing the Warrior Class Challenge in Blackrock Mountain.",
			"id": "BRM_016",
			"name": "Axe Flinger",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "Whenever this minion takes damage, deal 2 damage to the enemy hero.",
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
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA05_1H.png",
			"fr": {
				"name": "Baron Geddon"
			},
			"health": 50,
			"id": "BRMA05_1H",
			"name": "Baron Geddon",
			"set": "Blackrock Mountain",
			"type": "Hero"
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
			"race": "Dragon",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA09_4H.png",
			"cost": 1,
			"fr": {
				"name": "Aile noire"
			},
			"id": "BRMA09_4H",
			"name": "Blackwing",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon a 5/4 Dragonkin. Get a new Hero Power.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA09_4.png",
			"cost": 1,
			"fr": {
				"name": "Aile noire"
			},
			"id": "BRMA09_4",
			"name": "Blackwing",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon a 3/1 Dragonkin. Get a new Hero Power.",
			"type": "Hero Power"
		},
		{
			"artist": "Greg Staples",
			"attack": 5,
			"cardImage": "BRM_034.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "He got his name when he gave Blackwing some comic books and rock & roll records.",
			"fr": {
				"name": "Corrupteur de l’Aile noire"
			},
			"health": 4,
			"howToGet": "Unlocked by defeating Maloriak in the Hidden Laboratory.",
			"howToGetGold": "Can be crafted after defeating Maloriak in the Hidden Laboratory.",
			"id": "BRM_034",
			"mechanics": [
				"Battlecry"
			],
			"name": "Blackwing Corruptor",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry</b>: If you're holding a Dragon, deal 3 damage.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "BRM_033.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "This is who you go to when your Blackwing needs a tune up. Don't go to a cut rate Blackwing tune up shop!",
			"fr": {
				"name": "Technicienne de l’Aile noire"
			},
			"health": 4,
			"howToGet": "Unlocked by defeating Baron Geddon in Molten Core.",
			"howToGetGold": "Can be crafted after defeating Baron Geddon in Molten Core.",
			"id": "BRM_033",
			"mechanics": [
				"Battlecry"
			],
			"name": "Blackwing Technician",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1/+1.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Rage aveugle"
			},
			"id": "BRMA10_6e",
			"name": "Blind With Rage",
			"set": "Blackrock Mountain",
			"text": "Increased Attack.",
			"type": "Enchantment"
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
			"set": "Blackrock Mountain",
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
			"set": "Blackrock Mountain",
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
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon two 4/2 Bone Constructs.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA17_5.png",
			"cost": 2,
			"fr": {
				"name": "Séides des os"
			},
			"id": "BRMA17_5",
			"name": "Bone Minions",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon two 2/1 Bone Constructs.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA12_2.png",
			"cost": 0,
			"fr": {
				"name": "Affliction de l’espèce"
			},
			"id": "BRMA12_2",
			"name": "Brood Affliction",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nAt the end of your turn, add a Brood Affliction card to your opponent's hand.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA12_2H.png",
			"cost": 0,
			"fr": {
				"name": "Affliction de l’espèce"
			},
			"id": "BRMA12_2H",
			"name": "Brood Affliction",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nAt the end of your turn, add a Brood Affliction card to your opponent's hand.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA12_6H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : noir"
			},
			"id": "BRMA12_6H",
			"name": "Brood Affliction: Black",
			"set": "Blackrock Mountain",
			"text": "While this is in your hand, whenever Chromaggus draws a card, he gets another copy of it.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_6.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : noir"
			},
			"id": "BRMA12_6",
			"name": "Brood Affliction: Black",
			"set": "Blackrock Mountain",
			"text": "While this is in your hand, whenever Chromaggus draws a card, he gets another copy of it.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_5.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : bleu"
			},
			"id": "BRMA12_5",
			"name": "Brood Affliction: Blue",
			"set": "Blackrock Mountain",
			"text": "While this is in your hand, Chromaggus' spells cost (1) less.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_5H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : bleu"
			},
			"id": "BRMA12_5H",
			"name": "Brood Affliction: Blue",
			"set": "Blackrock Mountain",
			"text": "While this is in your hand, Chromaggus' spells cost (3) less.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_7H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : bronze"
			},
			"id": "BRMA12_7H",
			"name": "Brood Affliction: Bronze",
			"set": "Blackrock Mountain",
			"text": "While this is in your hand, Chromaggus' minions cost (3) less.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_7.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : bronze"
			},
			"id": "BRMA12_7",
			"name": "Brood Affliction: Bronze",
			"set": "Blackrock Mountain",
			"text": "While this is in your hand, Chromaggus' minions cost (1) less.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_4.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : vert"
			},
			"id": "BRMA12_4",
			"name": "Brood Affliction: Green",
			"set": "Blackrock Mountain",
			"text": "While this is in your hand, restore 2 health to your opponent at the start of your turn.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_4H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : vert"
			},
			"id": "BRMA12_4H",
			"name": "Brood Affliction: Green",
			"set": "Blackrock Mountain",
			"text": "While this is in your hand, restore 6 health to your opponent at the start of your turn.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_3.png",
			"cost": 1,
			"fr": {
				"name": "Affliction de l’espèce : rouge"
			},
			"id": "BRMA12_3",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Brood Affliction: Red",
			"set": "Blackrock Mountain",
			"text": "While this is in your hand, take 1 damage at the start of your turn.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_3H.png",
			"cost": 3,
			"fr": {
				"name": "Affliction de l’espèce : rouge"
			},
			"id": "BRMA12_3H",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Brood Affliction: Red",
			"set": "Blackrock Mountain",
			"text": "While this is in your hand, take 3 damage at the start of your turn.",
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
			"set": "Blackrock Mountain",
			"text": "Deal $2 damage to the enemy hero.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA12_1H.png",
			"fr": {
				"name": "Chromaggus"
			},
			"health": 60,
			"id": "BRMA12_1H",
			"name": "Chromaggus",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA12_1.png",
			"fr": {
				"name": "Chromaggus"
			},
			"health": 30,
			"id": "BRMA12_1",
			"name": "Chromaggus",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"artist": "Todd Lockwood",
			"attack": 6,
			"cardImage": "BRM_031.png",
			"collectible": true,
			"cost": 8,
			"elite": true,
			"flavor": "Left head and right head can never agree about what to eat for dinner, so they always end up just eating ramen again.",
			"fr": {
				"name": "Chromaggus"
			},
			"health": 8,
			"howToGet": "Unlocked by completing Blackwing Lair.",
			"howToGetGold": "Can be crafted after completing Blackwing Lair.",
			"id": "BRM_031",
			"name": "Chromaggus",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "Whenever you draw a card, put another copy into your hand.",
			"type": "Minion"
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
			"race": "Dragon",
			"set": "Blackrock Mountain",
			"text": "Whenever your opponent casts a spell, gain +2/+2.",
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
			"set": "Blackrock Mountain",
			"type": "Hero"
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
			"race": "Dragon",
			"set": "Blackrock Mountain",
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
			"race": "Dragon",
			"set": "Blackrock Mountain",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_8.png",
			"cost": 2,
			"fr": {
				"name": "Mutation chromatique"
			},
			"id": "BRMA12_8",
			"name": "Chromatic Mutation",
			"set": "Blackrock Mountain",
			"text": "Transform a minion into a 2/2 Chromatic Dragonkin.",
			"type": "Spell"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Chromatic Prototype",
			"set": "Blackrock Mountain",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Jomaro Kindred",
			"attack": 4,
			"cardImage": "BRM_014.png",
			"collectible": true,
			"cost": 4,
			"flavor": "It takes a special kind of hunter to venture deep into a firey lava pit and convince a monster who lives there to come home and be a cuddly housepet.",
			"fr": {
				"name": "Rageur du Magma"
			},
			"health": 4,
			"howToGet": "Unlocked by defeating Highlord Omokk in Blackrock Spire.",
			"howToGetGold": "Can be crafted after defeating Highlord Omokk in Blackrock Spire.",
			"id": "BRM_014",
			"mechanics": [
				"Battlecry"
			],
			"name": "Core Rager",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Rare",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry:</b> If your hand is empty, gain +3/+3.",
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
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA01_1.png",
			"fr": {
				"name": "Coren Navrebière"
			},
			"health": 30,
			"id": "BRMA01_1",
			"name": "Coren Direbrew",
			"set": "Blackrock Mountain",
			"type": "Hero"
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
			"set": "Blackrock Mountain",
			"text": "When this minion has 4 or more Health, it hatches.",
			"type": "Minion"
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
			"set": "Blackrock Mountain",
			"text": "When this minion has 5 or more Health, it hatches.",
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
			"set": "Blackrock Mountain",
			"text": "Always wins Brawls.",
			"type": "Minion"
		},
		{
			"artist": "Eric Braddock",
			"attack": 4,
			"cardImage": "BRM_008.png",
			"collectible": true,
			"cost": 5,
			"flavor": "He loves skulking. He skulks after hours just for the joy of it, but his friends are pretty worried he'll get burnt out.",
			"fr": {
				"name": "Furtif sombrefer"
			},
			"health": 3,
			"howToGet": "Unlocked by completing the Rogue Class Challenge in Blackrock Mountain.",
			"howToGetGold": "Can be crafted after completing the Rogue Class Challenge in Blackrock Mountain.",
			"id": "BRM_008",
			"mechanics": [
				"Battlecry"
			],
			"name": "Dark Iron Skulker",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry:</b> Deal 2 damage to all undamaged enemy minions.",
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
			"mechanics": [
				"Taunt"
			],
			"name": "Dark Iron Spectator",
			"set": "Blackrock Mountain",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "BRM_005.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Demons are not angry most of the time. You have to play this card in order to really bring it out of them.",
			"fr": {
				"name": "Courroux démoniaque"
			},
			"howToGet": "Unlocked by completing the Warlock Class Challenge in Blackrock Mountain.",
			"howToGetGold": "Can be crafted after completing the Warlock Class Challenge in Blackrock Mountain.",
			"id": "BRM_005",
			"mechanics": [
				"AffectedBySpellPower"
			],
			"name": "Demonwrath",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Blackrock Mountain",
			"text": "Deal $2 damage to all non-Demon minions.",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_027p.png",
			"cost": 2,
			"fr": {
				"name": "MEURS, INSECTE !"
			},
			"id": "BRM_027p",
			"name": "DIE, INSECT!",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nDeal $8 damage to a random enemy.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA13_8.png",
			"cost": 0,
			"fr": {
				"name": "MEURS, INSECTE !"
			},
			"id": "BRMA13_8",
			"mechanics": [
				"AffectedBySpellPower"
			],
			"name": "DIE, INSECT!",
			"set": "Blackrock Mountain",
			"text": "Deal $8 damage to a random enemy.",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_027pH.png",
			"cost": 2,
			"fr": {
				"name": "MOUREZ, INSECTES !"
			},
			"id": "BRM_027pH",
			"name": "DIE, INSECTS!",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nDeal $8 damage to a random enemy. TWICE.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA09_5.png",
			"cost": 4,
			"fr": {
				"name": "Pied à terre"
			},
			"id": "BRMA09_5",
			"name": "Dismount",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon Gyth. Get a new Hero Power.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA09_5H.png",
			"cost": 4,
			"fr": {
				"name": "Pied à terre"
			},
			"id": "BRMA09_5H",
			"name": "Dismount",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon Gyth. Get a new Hero Power.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Puissance draconique"
			},
			"id": "BRM_020e",
			"name": "Draconic Power",
			"set": "Blackrock Mountain",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Sang de dragon"
			},
			"id": "BRM_033e",
			"name": "Dragon Blood",
			"set": "Blackrock Mountain",
			"text": "+1/+1",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 5,
			"cardImage": "BRM_018.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Everybody wants someone to snuggle with. Even giant armored scaly draconic beasts of destruction.",
			"fr": {
				"name": "Dragon consort"
			},
			"health": 5,
			"howToGet": "Unlocked by defeating General Drakkisath in Blackrock Spire.",
			"howToGetGold": "Can be crafted after defeating General Drakkisath in Blackrock Spire.",
			"id": "BRM_018",
			"mechanics": [
				"Battlecry"
			],
			"name": "Dragon Consort",
			"playerClass": "Paladin",
			"race": "Dragon",
			"rarity": "Rare",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry:</b> The next Dragon you play costs (2) less.",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 0,
			"cardImage": "BRM_022.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Think of them as bullets for your dragon gun.",
			"fr": {
				"name": "Œuf de dragon"
			},
			"health": 2,
			"howToGet": "Unlocked by defeating Rend Blackhand in Blackrock Spire.",
			"howToGetGold": "Can be crafted after defeating Rend Blackhand in Blackrock Spire.",
			"id": "BRM_022",
			"name": "Dragon Egg",
			"rarity": "Rare",
			"set": "Blackrock Mountain",
			"text": "Whenever this minion takes damage, summon a 2/1 Whelp.",
			"type": "Minion"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "BRM_003.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Dragons breathe fire, sure, but did you know they can also breathe Cotton Candy?  It's harder to give them a reason to do that, though.",
			"fr": {
				"name": "Souffle du dragon"
			},
			"howToGet": "Unlocked by completing the Mage Class Challenge in Blackrock Mountain.",
			"howToGetGold": "Can be crafted after completing the Mage Class Challenge in Blackrock Mountain.",
			"id": "BRM_003",
			"name": "Dragon's Breath",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "Deal $4 damage. Costs (1) less for each minion that died this turn.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Puissance du dragon"
			},
			"id": "BRM_003e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Dragon's Might",
			"playerClass": "Mage",
			"set": "Blackrock Mountain",
			"text": "Costs (3) less this turn.",
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
			"race": "Dragon",
			"set": "Blackrock Mountain",
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
			"race": "Dragon",
			"set": "Blackrock Mountain",
			"type": "Minion"
		},
		{
			"artist": "Edouard Guiton & Stuido HIVE",
			"attack": 3,
			"cardImage": "BRM_020.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Dragonkin Sorcerers be all \"I'm a wizard\" and everyone else be all \"daaaaang\".",
			"fr": {
				"name": "Sorcier draconien"
			},
			"health": 5,
			"howToGet": "Unlocked by defeating Nefarian in the Hidden Laboratory.",
			"howToGetGold": "Can be crafted after defeating Nefarian in the Hidden Laboratory.",
			"id": "BRM_020",
			"name": "Dragonkin Sorcerer",
			"race": "Dragon",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "Whenever <b>you</b> target this minion with a spell, gain +1/+1.",
			"type": "Minion"
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
			"set": "Blackrock Mountain",
			"text": "Whenever your opponent plays a card, gain +1 Attack.",
			"type": "Weapon"
		},
		{
			"cardImage": "BRMA08_3.png",
			"cost": 1,
			"fr": {
				"name": "Ordres de Drakkisath"
			},
			"id": "BRMA08_3",
			"name": "Drakkisath's Command",
			"set": "Blackrock Mountain",
			"text": "Destroy a minion. Gain 10 Armor.",
			"type": "Spell"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 6,
			"cardImage": "BRM_024.png",
			"collectible": true,
			"cost": 6,
			"flavor": "Drakonids were created to have all the bad parts of a dragon in the form of a humaniod. But, like, why?",
			"fr": {
				"name": "Écraseur drakônide"
			},
			"health": 6,
			"howToGet": "Unlocked by defeating Atramedes in the Hidden Laboratory.",
			"howToGetGold": "Can be crafted after defeating Atramedes in the Hidden Laboratory.",
			"id": "BRM_024",
			"mechanics": [
				"Battlecry"
			],
			"name": "Drakonid Crusher",
			"race": "Dragon",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry:</b> If your opponent has 15 or less Health, gain +3/+3.",
			"type": "Minion"
		},
		{
			"artist": "Stanley Lau",
			"attack": 2,
			"cardImage": "BRM_010.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Druids who fought too long in Northrend were easily seduced by Ragnaros; a mug of hot chocolate was generally all it took.",
			"fr": {
				"name": "Druidesse de la Flamme"
			},
			"health": 2,
			"howToGet": "Unlocked by defeating Garr in Molten Core.",
			"howToGetGold": "Can be crafted after defeating Garr in Molten Core.",
			"id": "BRM_010",
			"name": "Druid of the Flame",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "<b>Choose One</b> - Transform into a 5/2 minion; or a 2/5 minion.",
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
			"race": "Beast",
			"rarity": "Common",
			"set": "Blackrock Mountain",
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
			"race": "Beast",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA16_2H.png",
			"cost": 0,
			"fr": {
				"name": "Écholocation"
			},
			"id": "BRMA16_2H",
			"name": "Echolocate",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nEquip a weapon that grows as your opponent plays cards.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA16_2.png",
			"cost": 1,
			"fr": {
				"name": "Écholocation"
			},
			"id": "BRMA16_2",
			"name": "Echolocate",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nEquip a weapon that grows as your opponent plays cards.",
			"type": "Hero Power"
		},
		{
			"attack": 6,
			"cardImage": "BRMA14_7H.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Électron"
			},
			"health": 6,
			"id": "BRMA14_7H",
			"name": "Electron",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "All spells cost (3) less.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "BRMA14_7.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Électron"
			},
			"health": 5,
			"id": "BRMA14_7",
			"mechanics": [
				"Aura"
			],
			"name": "Electron",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "All spells cost (3) less.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA03_1H.png",
			"fr": {
				"name": "Empereur Thaurissan"
			},
			"health": 30,
			"id": "BRMA03_1H",
			"name": "Emperor Thaurissan",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA03_1.png",
			"fr": {
				"name": "Empereur Thaurissan"
			},
			"health": 30,
			"id": "BRMA03_1",
			"name": "Emperor Thaurissan",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 5,
			"cardImage": "BRM_028.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "His second greatest regret is summoning an evil Firelord who enslaved his entire people.",
			"fr": {
				"name": "Empereur Thaurissan"
			},
			"health": 5,
			"howToGet": "Unlocked by completing Blackrock Depths.",
			"howToGetGold": "Can be crafted after completing Blackrock Depths.",
			"id": "BRM_028",
			"name": "Emperor Thaurissan",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "At the end of your turn, reduce the Cost of cards in your hand by (1).",
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
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nEach player draws 3 cards. Gain a Mana Crystal.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA11_2.png",
			"cost": 0,
			"fr": {
				"name": "Essence des Rouges"
			},
			"id": "BRMA11_2",
			"name": "Essence of the Red",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nEach player draws 2 cards.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRM_010b.png",
			"fr": {
				"name": "Forme de faucon-de-feu"
			},
			"id": "BRM_010b",
			"name": "Fire Hawk Form",
			"playerClass": "Druid",
			"race": "Beast",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "Transform into a 2/5 minion.",
			"type": "Spell"
		},
		{
			"cardImage": "BRM_010a.png",
			"fr": {
				"name": "Forme de félin-de-feu"
			},
			"id": "BRM_010a",
			"name": "Firecat Form",
			"playerClass": "Druid",
			"race": "Beast",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "Transform into a 5/2 minion.",
			"type": "Spell"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 3,
			"cardImage": "BRM_012.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Ragnaros interviews hundreds of Fire Elementals for the position of \"Destroyer\" but very few have what it takes.",
			"fr": {
				"name": "Destructeur garde du feu"
			},
			"health": 6,
			"howToGet": "Unlocked by defeating Lord Victor Nefarius in Blackwing Lair.",
			"howToGetGold": "Can be crafted after defeating Lord Victor Nefarius in Blackwing Lair.",
			"id": "BRM_012",
			"mechanics": [
				"Battlecry",
				"Overload"
			],
			"name": "Fireguard Destroyer",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry:</b> Gain 1-4 Attack. <b>Overload:</b> (1)",
			"type": "Minion"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Firesworn",
			"set": "Blackrock Mountain",
			"text": "<b>Deathrattle:</b> Deal 1 damage to the enemy hero for each Firesworn that died this turn.",
			"type": "Minion"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Firesworn",
			"set": "Blackrock Mountain",
			"text": "<b>Deathrattle:</b> Deal 3 damage to the enemy hero for each Firesworn that died this turn.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA_01.png",
			"cost": 3,
			"fr": {
				"name": "Cœur-de-flammes"
			},
			"id": "BRMA_01",
			"name": "Flameheart",
			"set": "Blackrock Mountain",
			"text": "Draw 2 cards.\nGain 4 Armor.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "BRM_002.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Flamewakers HATE being confused for Flamewalkers. They just wake up fire, they don’t walk on it. Walking on fire is CRAZY.",
			"fr": {
				"name": "Attise-flammes"
			},
			"health": 4,
			"howToGet": "Unlocked by defeating Vaelastrasz in Blackwing Lair.",
			"howToGetGold": "Can be crafted after defeating Vaelastrasz in Blackwing Lair.",
			"id": "BRM_002",
			"name": "Flamewaker",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Blackrock Mountain",
			"text": "After you cast a spell, deal 2 damage randomly split among all enemies.",
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
			"set": "Blackrock Mountain",
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
			"set": "Blackrock Mountain",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "BRM_007.png",
			"collectible": true,
			"cost": 2,
			"flavor": "If you are thinking about visiting Moonbrook, you better roll deep.",
			"fr": {
				"name": "Recrutement"
			},
			"howToGet": "Unlocked by defeating the Dark Iron Arena in Blackrock Depths.",
			"howToGetGold": "Can be crafted after defeating the Dark Iron Arena in Blackrock Depths.",
			"id": "BRM_007",
			"name": "Gang Up",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "Choose a minion. Shuffle 3 copies of it into your deck.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA04_1H.png",
			"fr": {
				"name": "Garr"
			},
			"health": 45,
			"id": "BRMA04_1H",
			"name": "Garr",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA04_1.png",
			"fr": {
				"name": "Garr"
			},
			"health": 30,
			"id": "BRMA04_1",
			"name": "Garr",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA08_1H.png",
			"fr": {
				"name": "Général Drakkisath"
			},
			"health": 50,
			"id": "BRMA08_1H",
			"name": "General Drakkisath",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA08_1.png",
			"fr": {
				"name": "Général Drakkisath"
			},
			"health": 50,
			"id": "BRMA08_1",
			"name": "General Drakkisath",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA01_4.png",
			"cost": 3,
			"fr": {
				"name": "Chopez-les !"
			},
			"id": "BRMA01_4",
			"name": "Get 'em!",
			"set": "Blackrock Mountain",
			"text": "Summon four 1/1 Dwarves with <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"artist": "Bobby Chiu",
			"attack": 3,
			"cardImage": "BRM_019.png",
			"collectible": true,
			"cost": 5,
			"flavor": "If you love getting your face punched, come to the Grim Guzzler!",
			"fr": {
				"name": "Client sinistre"
			},
			"health": 3,
			"howToGet": "Unlocked by defeating The Grim Guzzler in Blackrock Depths.",
			"howToGetGold": "Can be crafted after defeating The Grim Guzzler in Blackrock Depths.",
			"id": "BRM_019",
			"name": "Grim Patron",
			"rarity": "Rare",
			"set": "Blackrock Mountain",
			"text": "Whenever this minion survives damage, summon another Grim Patron.",
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
			"mechanics": [
				"Taunt"
			],
			"name": "Guzzler",
			"set": "Blackrock Mountain",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 8,
			"cardImage": "BRMA09_5t.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Gyth"
			},
			"health": 4,
			"id": "BRMA09_5t",
			"name": "Gyth",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"type": "Minion"
		},
		{
			"attack": 8,
			"cardImage": "BRMA09_5Ht.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Gyth"
			},
			"health": 8,
			"id": "BRMA09_5Ht",
			"name": "Gyth",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA02_1.png",
			"fr": {
				"name": "Juge Supérieur Mornepierre"
			},
			"health": 30,
			"id": "BRMA02_1",
			"name": "High Justice Grimstone",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA02_1H.png",
			"fr": {
				"name": "Juge Supérieur Mornepierre"
			},
			"health": 30,
			"id": "BRMA02_1H",
			"name": "High Justice Grimstone",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA07_1H.png",
			"fr": {
				"name": "Généralissime Omokk"
			},
			"health": 30,
			"id": "BRMA07_1H",
			"name": "Highlord Omokk",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA07_1.png",
			"fr": {
				"name": "Généralissime Omokk"
			},
			"health": 30,
			"id": "BRMA07_1",
			"name": "Highlord Omokk",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"artist": "John Polidora",
			"attack": 5,
			"cardImage": "BRM_026.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Hungry Hungry Dragon is NOT a fun game.",
			"fr": {
				"name": "Dragon affamé"
			},
			"health": 6,
			"howToGet": "Unlocked by defeating Chromaggus in Blackwing Lair.",
			"howToGetGold": "Can be crafted after defeating Chromaggus in Blackwing Lair.",
			"id": "BRM_026",
			"mechanics": [
				"Battlecry"
			],
			"name": "Hungry Dragon",
			"race": "Dragon",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry:</b> Summon a random 1-Cost minion for your opponent.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Je vous entends…"
			},
			"id": "BRMA16_5e",
			"name": "I hear you...",
			"set": "Blackrock Mountain",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA05_2H.png",
			"cost": 0,
			"fr": {
				"name": "Mana enflammé"
			},
			"id": "BRMA05_2H",
			"name": "Ignite Mana",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nDeal 10 damage to the enemy hero if they have any unspent Mana.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA05_2.png",
			"cost": 0,
			"fr": {
				"name": "Mana enflammé"
			},
			"id": "BRMA05_2",
			"name": "Ignite Mana",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nDeal 5 damage to the enemy hero if they have any unspent Mana.",
			"type": "Hero Power"
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
			"race": "Demon",
			"set": "Blackrock Mountain",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 2,
			"cardImage": "BRM_006.png",
			"collectible": true,
			"cost": 3,
			"flavor": "His imp gang likes to sneak into Stormwind to spraypaint \"Ragnaros Rulez\" on the Mage Tower.",
			"fr": {
				"name": "Chef du gang des diablotins"
			},
			"health": 4,
			"howToGet": "Unlocked by defeating Majordomo Executus in Molten Core.",
			"howToGetGold": "Can be crafted after defeating Majordomo Executus in Molten Core.",
			"id": "BRM_006",
			"name": "Imp Gang Boss",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "Whenever this minion takes damage, summon a 1/1 Imp.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Faveur impériale"
			},
			"id": "BRM_028e",
			"name": "Imperial Favor",
			"set": "Blackrock Mountain",
			"text": "Costs (1) less.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Incubation"
			},
			"id": "BRMA10_3e",
			"name": "Incubation",
			"set": "Blackrock Mountain",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA08_2.png",
			"fr": {
				"name": "Regard intense"
			},
			"id": "BRMA08_2",
			"name": "Intense Gaze",
			"set": "Blackrock Mountain",
			"text": "<b>Passive Hero Power</b>\nAll cards cost (1). Players are capped at 1 Mana Crystal.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA08_2H.png",
			"fr": {
				"name": "Regard intense"
			},
			"id": "BRMA08_2H",
			"name": "Intense Gaze",
			"set": "Blackrock Mountain",
			"text": "<b>Passive Hero Power</b>\nAll cards cost (1). You are capped at 2 Mana Crystals, and opponent at 1.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA02_2H.png",
			"cost": 0,
			"fr": {
				"name": "Foule moqueuse"
			},
			"id": "BRMA02_2H",
			"name": "Jeering Crowd",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Spectator with <b>Taunt</b>.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA02_2.png",
			"cost": 1,
			"fr": {
				"name": "Foule moqueuse"
			},
			"id": "BRMA02_2",
			"name": "Jeering Crowd",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Spectator with <b>Taunt</b>.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Grandes griffes"
			},
			"id": "BRM_024e",
			"name": "Large Talons",
			"set": "Blackrock Mountain",
			"text": "+3/+3.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "BRM_011.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Chocolate lava cake is shockingly delicious.",
			"fr": {
				"name": "Horion de lave"
			},
			"howToGet": "Unlocked by completing the Shaman Class Challenge in Blackrock Mountain.",
			"howToGetGold": "Can be crafted after completing the Shaman Class Challenge in Blackrock Mountain.",
			"id": "BRM_011",
			"name": "Lava Shock",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Blackrock Mountain",
			"text": "Deal $2 damage.\nUnlock your <b>Overloaded</b> Mana Crystals.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Horion de lave"
			},
			"id": "BRM_011t",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Lava Shock",
			"playerClass": "Shaman",
			"set": "Blackrock Mountain",
			"text": "Cards you play this turn don't cause <b>Overload</b>.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA17_4.png",
			"cost": 2,
			"fr": {
				"name": "LAVE !"
			},
			"id": "BRMA17_4",
			"name": "LAVA!",
			"set": "Blackrock Mountain",
			"text": "Deal $2 damage to all minions.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Bombe vivante"
			},
			"id": "BRMA05_3He",
			"name": "Living Bomb",
			"set": "Blackrock Mountain",
			"text": "On Geddon's turn, deal 10 damage to all of your stuff.",
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
			"set": "Blackrock Mountain",
			"text": "Choose an enemy minion. If it lives until your next turn, deal $10 damage to all enemies.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Bombe vivante"
			},
			"id": "BRMA05_3e",
			"name": "Living Bomb",
			"set": "Blackrock Mountain",
			"text": "On Geddon's turn, deal 5 damage to all of your stuff.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA05_3.png",
			"cost": 4,
			"fr": {
				"name": "Bombe vivante"
			},
			"id": "BRMA05_3",
			"name": "Living Bomb",
			"set": "Blackrock Mountain",
			"text": "Choose an enemy minion. If it lives until your next turn, deal $5 damage to all enemies.",
			"type": "Spell"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Living Lava",
			"set": "Blackrock Mountain",
			"text": "<b>Taunt</b>",
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
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA13_1H.png",
			"fr": {
				"name": "Seigneur Victor Nefarius"
			},
			"health": 30,
			"id": "BRMA13_1H",
			"name": "Lord Victor Nefarius",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA04_2.png",
			"cost": 1,
			"fr": {
				"name": "Impulsion de magma"
			},
			"id": "BRMA04_2",
			"name": "Magma Pulse",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nDeal 1 damage to all minions.",
			"type": "Hero Power"
		},
		{
			"attack": 7,
			"cardImage": "BRMA14_9.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Magmatron"
			},
			"health": 7,
			"id": "BRMA14_9",
			"mechanics": [
				"Aura"
			],
			"name": "Magmatron",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "Whenever a player plays a card, Magmatron deals 2 damage to them.",
			"type": "Minion"
		},
		{
			"attack": 8,
			"cardImage": "BRMA14_9H.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Magmatron"
			},
			"health": 8,
			"id": "BRMA14_9H",
			"name": "Magmatron",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "Whenever a player plays a card, Magmatron deals 2 damage to them.",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "BRMA14_12.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Magmagueule"
			},
			"health": 2,
			"id": "BRMA14_12",
			"mechanics": [
				"Taunt"
			],
			"name": "Magmaw",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA06_1H.png",
			"fr": {
				"name": "Chambellan Executus"
			},
			"health": 30,
			"id": "BRMA06_1H",
			"name": "Majordomo Executus",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA06_1.png",
			"fr": {
				"name": "Chambellan Executus"
			},
			"health": 30,
			"id": "BRMA06_1",
			"name": "Majordomo Executus",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 9,
			"cardImage": "BRM_027.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"flavor": "You thought Executus turned you into Ragnaros, but really Ragnaros was in you the whole time.",
			"fr": {
				"name": "Chambellan Executus"
			},
			"health": 7,
			"howToGet": "Unlocked by completing Molten Core.",
			"howToGetGold": "Can be crafted after completing Molten Core.",
			"id": "BRM_027",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Majordomo Executus",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "<b>Deathrattle:</b> Replace your hero with Ragnaros, the Firelord.",
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
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA15_1.png",
			"fr": {
				"name": "Maloriak"
			},
			"health": 30,
			"id": "BRMA15_1",
			"name": "Maloriak",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA07_2.png",
			"cost": 1,
			"fr": {
				"name": "MOI TOUT CASSER"
			},
			"id": "BRMA07_2",
			"name": "ME SMASH",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nDestroy a random damaged enemy minion.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA07_2H.png",
			"cost": 0,
			"fr": {
				"name": "MOI TOUT CASSER"
			},
			"id": "BRMA07_2H",
			"name": "ME SMASH",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nDestroy a random enemy minion.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Fondre"
			},
			"id": "BRM_001e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Melt",
			"playerClass": "Priest",
			"set": "Blackrock Mountain",
			"text": "Attack changed to 0 this turn.",
			"type": "Enchantment"
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
			"mechanics": [
				"Aura"
			],
			"name": "Moira Bronzebeard",
			"set": "Blackrock Mountain",
			"text": "Thaurissan's Hero Power can't be used.\nNever attacks minions unless they have <b>Taunt</b>.",
			"type": "Minion"
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
			"mechanics": [
				"Aura"
			],
			"name": "Moira Bronzebeard",
			"set": "Blackrock Mountain",
			"text": "Thaurissan's Hero Power can't be used.\nNever attacks minions unless they have <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA12_10.png",
			"cost": 1,
			"fr": {
				"name": "Mutation"
			},
			"id": "BRMA12_10",
			"name": "Mutation",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nDiscard a random card.",
			"type": "Hero Power"
		},
		{
			"artist": "Ruan Jia",
			"attack": 8,
			"cardImage": "BRM_030.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"flavor": "They call him \"Blackwing\" because he's a black dragon...... and he's got wings.",
			"fr": {
				"name": "Nefarian"
			},
			"health": 8,
			"howToGet": "Unlocked by defeating every boss in Blackrock Mountain!",
			"howToGetGold": "Can be crafted after completing the Hidden Laboratory.",
			"id": "BRM_030",
			"mechanics": [
				"Battlecry"
			],
			"name": "Nefarian",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry:</b> Add 2 random spells to your hand <i>(from your opponent's class)</i>.",
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
			"set": "Blackrock Mountain",
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
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA17_2.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "BRMA17_2",
			"name": "Nefarian",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA13_3.png",
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "BRMA13_3",
			"name": "Nefarian",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA17_8.png",
			"cost": 0,
			"fr": {
				"name": "Frappe de Nefarian"
			},
			"id": "BRMA17_8",
			"name": "Nefarian Strikes!",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nNefarian rains fire from above!",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA17_8H.png",
			"cost": 0,
			"fr": {
				"name": "Frappe de Nefarian"
			},
			"id": "BRMA17_8H",
			"name": "Nefarian Strikes!",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nNefarian rains fire from above!",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA09_3.png",
			"cost": 2,
			"fr": {
				"name": "Ancienne Horde"
			},
			"id": "BRMA09_3",
			"name": "Old Horde",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon two 1/1 Orcs with <b>Taunt</b>. Get a new Hero Power.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA09_3H.png",
			"cost": 2,
			"fr": {
				"name": "Ancienne Horde"
			},
			"id": "BRMA09_3H",
			"name": "Old Horde",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon two 2/2 Orcs with <b>Taunt</b>. Get a new Hero Power.",
			"type": "Hero Power"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Old Horde Orc",
			"set": "Blackrock Mountain",
			"text": "<b>Taunt</b>",
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
			"mechanics": [
				"Taunt"
			],
			"name": "Old Horde Orc",
			"set": "Blackrock Mountain",
			"text": "<b>Taunt</b>",
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
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA14_1.png",
			"fr": {
				"name": "Système de défense Omnitron"
			},
			"health": 30,
			"id": "BRMA14_1",
			"name": "Omnotron Defense System",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"fr": {
				"name": "En feu !"
			},
			"id": "BRM_012e",
			"name": "On Fire!",
			"set": "Blackrock Mountain",
			"text": "Increased Attack.",
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
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA17_3.png",
			"fr": {
				"name": "Onyxia"
			},
			"health": 15,
			"id": "BRMA17_3",
			"name": "Onyxia",
			"set": "Blackrock Mountain",
			"type": "Hero"
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
			"set": "Blackrock Mountain",
			"type": "Weapon"
		},
		{
			"cardImage": "BRMA09_2.png",
			"cost": 2,
			"fr": {
				"name": "Ouvrir les portes"
			},
			"id": "BRMA09_2",
			"name": "Open the Gates",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon three 1/1 Whelps. Get a new Hero Power.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA09_2H.png",
			"cost": 2,
			"fr": {
				"name": "Ouvrir les portes"
			},
			"id": "BRMA09_2H",
			"name": "Open the Gates",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon three 2/2 Whelps. Get a new Hero Power.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA01_2.png",
			"cost": 0,
			"fr": {
				"name": "Jeu forcé !"
			},
			"id": "BRMA01_2",
			"name": "Pile On!",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nPut a minion from each deck into the battlefield.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA01_2H.png",
			"cost": 0,
			"fr": {
				"name": "Jeu forcé !"
			},
			"id": "BRMA01_2H",
			"name": "Pile On!",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nPut two minions from your deck and one from your opponent's into the battlefield.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Potion de puissance"
			},
			"id": "BRMA15_2He",
			"name": "Potion of Might",
			"set": "Blackrock Mountain",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA03_2.png",
			"cost": 2,
			"fr": {
				"name": "Puissance de Ragnaros"
			},
			"id": "BRMA03_2",
			"name": "Power of the Firelord",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nDeal 30 damage.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Rage puissante"
			},
			"id": "BRM_014e",
			"name": "Power Rager",
			"playerClass": "Hunter",
			"set": "Blackrock Mountain",
			"text": "+3/+3",
			"type": "Enchantment"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "BRM_013.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Han shot first.",
			"fr": {
				"name": "Tir réflexe"
			},
			"howToGet": "Unlocked by completing the Hunter Class Challenge in Blackrock Mountain.",
			"howToGetGold": "Can be crafted after completing the Hunter Class Challenge in Blackrock Mountain.",
			"id": "BRM_013",
			"mechanics": [
				"AffectedBySpellPower"
			],
			"name": "Quick Shot",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "Deal $3 damage.\nIf your hand is empty, draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA06_3.png",
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 8,
			"id": "BRMA06_3",
			"name": "Ragnaros the Firelord",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRM_027h.png",
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 8,
			"id": "BRM_027h",
			"name": "Ragnaros the Firelord",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA06_3H.png",
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 30,
			"id": "BRMA06_3H",
			"name": "Ragnaros the Firelord",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA10_1.png",
			"fr": {
				"name": "Tranchetripe l’Indompté"
			},
			"health": 30,
			"id": "BRMA10_1",
			"name": "Razorgore the Untamed",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA10_1H.png",
			"fr": {
				"name": "Tranchetripe l’Indompté"
			},
			"health": 30,
			"id": "BRMA10_1H",
			"name": "Razorgore the Untamed",
			"set": "Blackrock Mountain",
			"type": "Hero"
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
			"set": "Blackrock Mountain",
			"text": "Whenever a Corrupted Egg dies, gain +1 Attack.",
			"type": "Weapon"
		},
		{
			"cardImage": "BRMA14_11.png",
			"cost": 0,
			"fr": {
				"name": "Recharge"
			},
			"id": "BRMA14_11",
			"name": "Recharge",
			"set": "Blackrock Mountain",
			"text": "Fill all empty Mana Crystals.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA15_3.png",
			"cost": 2,
			"fr": {
				"name": "Libérer les aberrations"
			},
			"id": "BRMA15_3",
			"name": "Release the Aberrations!",
			"set": "Blackrock Mountain",
			"text": "Summon 3 Aberrations.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA09_1H.png",
			"fr": {
				"name": "Rend Main-Noire"
			},
			"health": 30,
			"id": "BRMA09_1H",
			"name": "Rend Blackhand",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA09_1.png",
			"fr": {
				"name": "Rend Main-Noire"
			},
			"health": 30,
			"id": "BRMA09_1",
			"name": "Rend Blackhand",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"artist": "Alex Horley",
			"attack": 8,
			"cardImage": "BRM_029.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "Rend believes he is the True Warchief of the Horde and he keeps editing the wikipedia page for \"Warchief of the Horde\" to include his picture.",
			"fr": {
				"name": "Rend Main-Noire"
			},
			"health": 4,
			"howToGet": "Unlocked by completing Blackrock Spire.",
			"howToGetGold": "Can be crafted after completing Blackrock Spire.",
			"id": "BRM_029",
			"mechanics": [
				"Battlecry"
			],
			"name": "Rend Blackhand",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, destroy a <b>Legendary</b> minion.",
			"type": "Minion"
		},
		{
			"artist": "Luke Mancini",
			"cardImage": "BRM_017.png",
			"collectible": true,
			"cost": 2,
			"flavor": "I walked into the dungeon and noticed a slain adventurer. In his final moments, he had scrawled out a message in the dust on the wall beside him. Two words: \"rez plz\"",
			"fr": {
				"name": "Ressusciter"
			},
			"howToGet": "Unlocked by defeating Emperor Thaurissan in Blackrock Depths.",
			"howToGetGold": "Can be crafted after defeating Emperor Thaurissan in Blackrock Depths.",
			"id": "BRM_017",
			"name": "Resurrect",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Blackrock Mountain",
			"text": "Summon a random friendly minion that died this game.",
			"type": "Spell"
		},
		{
			"artist": "Ben Olson",
			"cardImage": "BRM_015.png",
			"collectible": true,
			"cost": 2,
			"flavor": "This is better than Arcane Explosion, so I guess warriors are finally getting revenge on mages for Mortal Strike being worse than Fireball.",
			"fr": {
				"name": "Revanche"
			},
			"howToGet": "Unlocked by defeating Razorgore in Blackwing Lair.",
			"howToGetGold": "Can be crafted after defeating Razorgore in Blackwing Lair.",
			"id": "BRM_015",
			"name": "Revenge",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Blackrock Mountain",
			"text": "Deal $1 damage to all minions. If you have 12 or less Health, deal $3 damage instead.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA16_4.png",
			"cost": 1,
			"fr": {
				"name": "Gong réverbérant"
			},
			"id": "BRMA16_4",
			"name": "Reverberating Gong",
			"set": "Blackrock Mountain",
			"text": "Destroy your opponent's weapon.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA04_4H.png",
			"cost": 3,
			"fr": {
				"name": "Déchaînement"
			},
			"id": "BRMA04_4H",
			"mechanics": [
				"Overload"
			],
			"name": "Rock Out",
			"set": "Blackrock Mountain",
			"text": "Summon 3 Firesworn. <b>Overload:</b> (2)",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA04_4.png",
			"cost": 3,
			"fr": {
				"name": "Déchaînement"
			},
			"id": "BRMA04_4",
			"mechanics": [
				"Overload"
			],
			"name": "Rock Out",
			"set": "Blackrock Mountain",
			"text": "Summon 3 Firesworn. <b>Overload:</b> (2)",
			"type": "Spell"
		},
		{
			"artist": "Jaime Jones",
			"cardImage": "BRM_001.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Each year, folk gather in front of Blackrock Mountain to mourn those who were mind-controlled into the lava.",
			"fr": {
				"name": "Veille solennelle"
			},
			"howToGet": "Unlocked by completing the Paladin Class Challenge in Blackrock Mountain.",
			"howToGetGold": "Can be crafted after completing the Paladin Class Challenge in Blackrock Mountain.",
			"id": "BRM_001",
			"name": "Solemn Vigil",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "Draw 2 cards. Costs (1) less for each minion that died this turn.",
			"type": "Spell"
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
			"mechanics": [
				"Battlecry"
			],
			"name": "Son of the Flame",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry:</b> Deal 6 damage.",
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
			"set": "Blackrock Mountain",
			"text": "Deal $3 damage to a minion. Give your weapon +3 Attack.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Souffle sonique"
			},
			"id": "BRMA16_3e",
			"name": "Sonic Breath",
			"set": "Blackrock Mountain",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRM_030t.png",
			"cost": 4,
			"fr": {
				"name": "Balayage de queue"
			},
			"id": "BRM_030t",
			"name": "Tail Swipe",
			"set": "Blackrock Mountain",
			"text": "Deal $4 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "BRMA15_2.png",
			"fr": {
				"name": "L’alchimiste"
			},
			"id": "BRMA15_2",
			"name": "The Alchemist",
			"set": "Blackrock Mountain",
			"text": "<b>Passive Hero Power</b>\nWhenever a minion is summoned, swap its Attack and Health.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA15_2H.png",
			"fr": {
				"name": "L’alchimiste"
			},
			"id": "BRMA15_2H",
			"name": "The Alchemist",
			"set": "Blackrock Mountain",
			"text": "<b>Passive Hero Power</b>\nMinions' Attack and Health are swapped.\nYour minions have +2/+2.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA06_2.png",
			"cost": 2,
			"fr": {
				"name": "Le chambellan"
			},
			"id": "BRMA06_2",
			"name": "The Majordomo",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon a 1/3 Flamewaker Acolyte.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA06_2H.png",
			"cost": 2,
			"fr": {
				"name": "Le chambellan"
			},
			"id": "BRMA06_2H",
			"name": "The Majordomo",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nSummon a 3/3 Flamewaker Acolyte.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA10_3H.png",
			"cost": 0,
			"fr": {
				"name": "La colonie"
			},
			"id": "BRMA10_3H",
			"name": "The Rookery",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nGive all Corrupted Eggs +1 Health, then summon one.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA10_3.png",
			"cost": 1,
			"fr": {
				"name": "La colonie"
			},
			"id": "BRMA10_3",
			"name": "The Rookery",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nGive all Corrupted Eggs +1 Health, then summon one.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA09_6.png",
			"cost": 1,
			"fr": {
				"name": "Véritable chef de guerre"
			},
			"id": "BRMA09_6",
			"name": "The True Warchief",
			"set": "Blackrock Mountain",
			"text": "Destroy a Legendary minion.",
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
			"set": "Blackrock Mountain",
			"text": "Deal $5 damage to a random enemy. Gain 5 Armor.",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "BRMA14_5.png",
			"cost": 1,
			"elite": true,
			"fr": {
				"name": "Toxitron"
			},
			"health": 3,
			"id": "BRMA14_5",
			"name": "Toxitron",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "At the start of your turn, deal 1 damage to all other minions.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMA14_5H.png",
			"cost": 1,
			"elite": true,
			"fr": {
				"name": "Toxitron"
			},
			"health": 4,
			"id": "BRMA14_5H",
			"name": "Toxitron",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Blackrock Mountain",
			"text": "At the start of your turn, deal 1 damage to all other minions.",
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
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nLet the games begin!",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA13_2H.png",
			"cost": 1,
			"fr": {
				"name": "Forme véritable"
			},
			"id": "BRMA13_2H",
			"name": "True Form",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nLet the games begin!",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Endurance du Crépuscule"
			},
			"id": "BRM_004e",
			"name": "Twilight Endurance",
			"set": "Blackrock Mountain",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Sam Nielson",
			"attack": 2,
			"cardImage": "BRM_004.png",
			"collectible": true,
			"cost": 1,
			"flavor": "The twilight whelps are basically magic-vampires. Despite this, they are not a reference to any popular series of novels.",
			"fr": {
				"name": "Dragonnet du Crépuscule"
			},
			"health": 1,
			"howToGet": "Unlocked by completing the Priest Class Challenge in Blackrock Mountain.",
			"howToGetGold": "Can be crafted after completing the Priest Class Challenge in Blackrock Mountain.",
			"id": "BRM_004",
			"mechanics": [
				"Battlecry"
			],
			"name": "Twilight Whelp",
			"playerClass": "Priest",
			"race": "Dragon",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "<b>Battlecry:</b> If you're holding a Dragon, gain +2 Health.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Libéré !"
			},
			"id": "BRM_018e",
			"name": "Unchained!",
			"playerClass": "Paladin",
			"set": "Blackrock Mountain",
			"text": "Your next Dragon costs (2) less.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMA11_1H.png",
			"fr": {
				"name": "Vaelastrasz le Corrompu"
			},
			"health": 30,
			"id": "BRMA11_1H",
			"name": "Vaelastrasz the Corrupt",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"cardImage": "BRMA11_1.png",
			"fr": {
				"name": "Vaelastrasz le Corrompu"
			},
			"health": 30,
			"id": "BRMA11_1",
			"name": "Vaelastrasz the Corrupt",
			"set": "Blackrock Mountain",
			"type": "Hero"
		},
		{
			"artist": "Lucas Graciano",
			"attack": 6,
			"cardImage": "BRM_025.png",
			"collectible": true,
			"cost": 6,
			"flavor": "Volcanic Drakes breathe lava instead of fire. The antacid vendor at Thorium Point does a brisk business with them.",
			"fr": {
				"name": "Drake volcanique"
			},
			"health": 4,
			"howToGet": "Unlocked by defeating Omnotron Defense System in the Hidden Laboratory.",
			"howToGetGold": "Can be crafted after defeating Omnotron Defense System in the Hidden Laboratory.",
			"id": "BRM_025",
			"name": "Volcanic Drake",
			"race": "Dragon",
			"rarity": "Common",
			"set": "Blackrock Mountain",
			"text": "Costs (1) less for each minion that died this turn.",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 7,
			"cardImage": "BRM_009.png",
			"collectible": true,
			"cost": 9,
			"flavor": "The roots, the roots, the roots is on fire!",
			"fr": {
				"name": "Lourdaud volcanique"
			},
			"health": 8,
			"howToGet": "Unlocked by completing the Druid Class Challenge in Blackrock Mountain.",
			"howToGetGold": "Can be crafted after completing the Druid Class Challenge in Blackrock Mountain.",
			"id": "BRM_009",
			"mechanics": [
				"Taunt"
			],
			"name": "Volcanic Lumberer",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Blackrock Mountain",
			"text": "<b>Taunt</b>\nCosts (1) less for each minion that died this turn.",
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
			"set": "Blackrock Mountain",
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
			"race": "Dragon",
			"set": "Blackrock Mountain",
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
			"race": "Dragon",
			"set": "Blackrock Mountain",
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
			"mechanics": [
				"Windfury"
			],
			"name": "Whirling Ash",
			"set": "Blackrock Mountain",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"cardImage": "BRMA13_4.png",
			"cost": 1,
			"fr": {
				"name": "Magie sauvage"
			},
			"id": "BRMA13_4",
			"name": "Wild Magic",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nPut a random spell from your opponent's class into your hand.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMA13_4H.png",
			"cost": 1,
			"fr": {
				"name": "Magie sauvage"
			},
			"id": "BRMA13_4H",
			"name": "Wild Magic",
			"set": "Blackrock Mountain",
			"text": "<b>Hero Power</b>\nPut a random spell from your opponent's class into your hand.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "« Inspiré »"
			},
			"id": "CS2_188o",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "'Inspired'",
			"set": "Classic",
			"text": "This minion has +2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "EX1_097.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "Abominations enjoy Fresh Meat and long walks on the beach.",
			"fr": {
				"name": "Abomination"
			},
			"health": 4,
			"id": "EX1_097",
			"mechanics": [
				"Deathrattle",
				"Taunt"
			],
			"name": "Abomination",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Taunt</b>. <b>Deathrattle:</b> Deal 2 damage to ALL characters.",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"attack": 2,
			"cardImage": "CS2_188.png",
			"collectible": true,
			"cost": 1,
			"faction": "Alliance",
			"flavor": "ADD ME TO YOUR DECK, MAGGOT!",
			"fr": {
				"name": "Sergent grossier"
			},
			"health": 1,
			"id": "CS2_188",
			"mechanics": [
				"Battlecry"
			],
			"name": "Abusive Sergeant",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Give a minion +2 Attack this turn.",
			"type": "Minion"
		},
		{
			"artist": "Dave Kendall",
			"attack": 1,
			"cardImage": "EX1_007.png",
			"collectible": true,
			"cost": 3,
			"flavor": "He trained when he was younger to be an acolyte of joy, but things didn’t work out like he thought they would.",
			"fr": {
				"name": "Acolyte de la souffrance"
			},
			"health": 3,
			"id": "EX1_007",
			"name": "Acolyte of Pain",
			"rarity": "Common",
			"set": "Classic",
			"text": "Whenever this minion takes damage, draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "NEW1_010.png",
			"collectible": true,
			"cost": 8,
			"elite": true,
			"flavor": "He is the weakest of the four Elemental Lords.  And the other three don't let him forget it.",
			"fr": {
				"name": "Al’Akir, seigneur des Vents"
			},
			"health": 5,
			"id": "NEW1_010",
			"mechanics": [
				"Charge",
				"Divine Shield",
				"Taunt",
				"Windfury"
			],
			"name": "Al'Akir the Windlord",
			"playerClass": "Shaman",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Windfury, Charge, Divine Shield, Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Sean O’Daniels",
			"attack": 0,
			"cardImage": "EX1_006.png",
			"collectible": true,
			"cost": 3,
			"flavor": "WARNING.  WARNING.  WARNING.",
			"fr": {
				"name": "Robot d’alarme"
			},
			"health": 3,
			"id": "EX1_006",
			"name": "Alarm-o-Bot",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Classic",
			"text": "At the start of your turn, swap this minion with a random one in your hand.",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 3,
			"cardImage": "EX1_382.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "The Aldor hate two things: the Scryers and smooth jazz.",
			"fr": {
				"name": "Garde-paix de l’Aldor"
			},
			"health": 3,
			"id": "EX1_382",
			"mechanics": [
				"Battlecry"
			],
			"name": "Aldor Peacekeeper",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Change an enemy minion's Attack to 1.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 8,
			"cardImage": "EX1_561.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Alexstrasza the Life-Binder brings life and hope to everyone.  Except Deathwing.  And Malygos.  And Nekros.",
			"fr": {
				"name": "Alexstrasza"
			},
			"health": 8,
			"id": "EX1_561",
			"mechanics": [
				"Battlecry"
			],
			"name": "Alexstrasza",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Set a hero's remaining Health to 15.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Feu d’Alexstrasza"
			},
			"id": "EX1_561e",
			"name": "Alexstrasza's Fire",
			"set": "Classic",
			"text": "Health set to 15.",
			"type": "Enchantment"
		},
		{
			"artist": "Chippy",
			"attack": 2,
			"cardImage": "EX1_393.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "If an Amani berserker asks \"Joo lookin' at me?!\", the correct response is \"Nah, mon\".",
			"fr": {
				"name": "Berserker amani"
			},
			"health": 3,
			"id": "EX1_393",
			"mechanics": [
				"Enrage"
			],
			"name": "Amani Berserker",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Enrage:</b> +3 Attack",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "CS2_038.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "It was just a flesh wound.",
			"fr": {
				"name": "Esprit ancestral"
			},
			"id": "CS2_038",
			"name": "Ancestral Spirit",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Give a minion \"<b>Deathrattle:</b> Resummon this minion.\"",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Esprit ancestral"
			},
			"id": "CS2_038e",
			"name": "Ancestral Spirit",
			"playerClass": "Shaman",
			"set": "Classic",
			"text": "<b>Deathrattle:</b> Resummon this minion.",
			"type": "Enchantment"
		},
		{
			"artist": "Bernie Kang",
			"attack": 5,
			"cardImage": "EX1_057.png",
			"collectible": true,
			"cost": 4,
			"faction": "Alliance",
			"flavor": "Most pandaren say his brew tastes like yak.  But apparently that's a compliment.",
			"fr": {
				"name": "Ancien maître brasseur"
			},
			"health": 4,
			"id": "EX1_057",
			"mechanics": [
				"Battlecry"
			],
			"name": "Ancient Brewmaster",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Return a friendly minion from the battlefield to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Howard Lyon",
			"attack": 2,
			"cardImage": "EX1_584.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Sometimes he forgets and just wanders into someone else's game.",
			"fr": {
				"name": "Mage ancien"
			},
			"health": 5,
			"id": "EX1_584",
			"mechanics": [
				"Battlecry"
			],
			"name": "Ancient Mage",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Give adjacent minions <b>Spell Damage +1</b>.",
			"type": "Minion"
		},
		{
			"artist": "Patrik Hjelm",
			"attack": 5,
			"cardImage": "NEW1_008.png",
			"collectible": true,
			"cost": 7,
			"flavor": "Go ahead, carve your initials in him.",
			"fr": {
				"name": "Ancien du savoir"
			},
			"health": 5,
			"id": "NEW1_008",
			"name": "Ancient of Lore",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Choose One -</b> Draw 2 cards; or Restore 5 Health.",
			"type": "Minion"
		},
		{
			"artist": "Sean O’Daniels",
			"attack": 5,
			"cardImage": "EX1_178.png",
			"collectible": true,
			"cost": 7,
			"faction": "Neutral",
			"flavor": "Young Night Elves love to play \"Who can get the Ancient of War to Uproot?\"  You lose if you get crushed to death.",
			"fr": {
				"name": "Ancien de la guerre"
			},
			"health": 5,
			"id": "EX1_178",
			"name": "Ancient of War",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Choose One</b> -\n+5 Attack; or +5 Health and <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "NEW1_008b.png",
			"fr": {
				"name": "Secrets anciens"
			},
			"id": "NEW1_008b",
			"name": "Ancient Secrets",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Restore 5 Health.",
			"type": "Spell"
		},
		{
			"cardImage": "NEW1_008a.png",
			"fr": {
				"name": "Connaissances anciennes"
			},
			"id": "NEW1_008a",
			"name": "Ancient Teachings",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Draw 2 cards.",
			"type": "Spell"
		},
		{
			"artist": "Richard Wright",
			"attack": 4,
			"cardImage": "EX1_045.png",
			"collectible": true,
			"cost": 2,
			"faction": "Alliance",
			"flavor": "Why do its eyes seem to follow you as you walk by?",
			"fr": {
				"name": "Guetteur ancien"
			},
			"health": 5,
			"id": "EX1_045",
			"name": "Ancient Watcher",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Can't attack.",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 1,
			"cardImage": "EX1_009.png",
			"collectible": true,
			"cost": 1,
			"flavor": "There is no beast more frightening (or ridiculous) than a fully enraged chicken.",
			"fr": {
				"name": "Poulet furieux"
			},
			"health": 1,
			"id": "EX1_009",
			"mechanics": [
				"Enrage"
			],
			"name": "Angry Chicken",
			"race": "Beast",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Enrage:</b> +5 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Samwise",
			"attack": 3,
			"cardImage": "EX1_398.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "50% off fist weapons, limited time only!",
			"fr": {
				"name": "Fabricante d’armes"
			},
			"health": 3,
			"id": "EX1_398",
			"mechanics": [
				"Battlecry"
			],
			"name": "Arathi Weaponsmith",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Equip a 2/2 weapon.",
			"type": "Minion"
		},
		{
			"artist": "Sedhayu Ardian",
			"attack": 4,
			"cardImage": "EX1_089.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Having Arcane golems at home really classes up the place, and as a bonus they are great conversation pieces.",
			"fr": {
				"name": "Golem arcanique"
			},
			"health": 2,
			"id": "EX1_089",
			"mechanics": [
				"Battlecry",
				"Charge"
			],
			"name": "Arcane Golem",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Charge</b>. <b>Battlecry:</b> Give your opponent a Mana Crystal.",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 5,
			"cardImage": "EX1_559.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Antonidas was the Grand Magus of the Kirin Tor, and Jaina's mentor.  This was a big step up from being Grand Magus of Jelly Donuts.",
			"fr": {
				"name": "Archimage Antonidas"
			},
			"health": 7,
			"id": "EX1_559",
			"name": "Archmage Antonidas",
			"playerClass": "Mage",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "Whenever you cast a spell, add a 'Fireball' spell to your hand.",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 4,
			"cardImage": "EX1_067.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "The Argent Dawn stands vigilant against the Scourge, as well as people who cut in line at coffee shops.",
			"fr": {
				"name": "Commandant d’Argent"
			},
			"health": 2,
			"id": "EX1_067",
			"mechanics": [
				"Charge",
				"Divine Shield"
			],
			"name": "Argent Commander",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Charge</b>\n<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Doug Alexander",
			"attack": 2,
			"cardImage": "EX1_362.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "\"I'm not saying you can dodge fireballs.  I'm saying with this shield, you won't have to.\"",
			"fr": {
				"name": "Protecteur d’Argent"
			},
			"health": 2,
			"id": "EX1_362",
			"mechanics": [
				"Battlecry"
			],
			"name": "Argent Protector",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Give a friendly minion <b>Divine Shield</b>.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 1,
			"cardImage": "EX1_008.png",
			"collectible": true,
			"cost": 1,
			"faction": "Alliance",
			"flavor": "\"I solemnly swear to uphold the Light, purge the world of darkness, and to eat only burritos.\" - The Argent Dawn Oath",
			"fr": {
				"name": "Écuyère d’Argent"
			},
			"health": 1,
			"id": "EX1_008",
			"mechanics": [
				"Divine Shield"
			],
			"name": "Argent Squire",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Greg Hildebrandt",
			"attack": 1,
			"cardImage": "EX1_402.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "She accepts guild funds for repairs!",
			"fr": {
				"name": "Fabricante d’armures"
			},
			"health": 4,
			"id": "EX1_402",
			"inPlayText": "Smithing",
			"name": "Armorsmith",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Whenever a friendly minion takes damage, gain 1 Armor.",
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
			"set": "Classic",
			"type": "Weapon"
		},
		{
			"artist": "Doug Alexander",
			"attack": 3,
			"cardImage": "EX1_591.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "The Auchenai know the end is coming, but they're not sure when.",
			"fr": {
				"name": "Prêtresse auchenaï"
			},
			"health": 5,
			"id": "EX1_591",
			"mechanics": [
				"Aura"
			],
			"name": "Auchenai Soulpriest",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Your cards and powers that restore Health now deal damage instead.",
			"type": "Minion"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_384.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "Wham! Wham! Wham! Wham! Wham! Wham! Wham! Wham!",
			"fr": {
				"name": "Courroux vengeur"
			},
			"id": "EX1_384",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Avenging Wrath",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Deal $8 damage randomly split among all enemies.",
			"type": "Spell"
		},
		{
			"artist": "Ben Zhang",
			"attack": 4,
			"cardImage": "EX1_284.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "They initially planned to be the Beryl or Cerulean drakes, but those felt a tad too pretentious.",
			"fr": {
				"name": "Drake azur"
			},
			"health": 4,
			"id": "EX1_284",
			"mechanics": [
				"Battlecry",
				"Spellpower"
			],
			"name": "Azure Drake",
			"race": "Dragon",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Spell Damage +1</b>. <b>Battlecry:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "EX1_110t.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Baine Sabot-de-Sang"
			},
			"health": 5,
			"id": "EX1_110t",
			"name": "Baine Bloodhoof",
			"rarity": "Legendary",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_014t.png",
			"cost": 1,
			"fr": {
				"name": "Banane"
			},
			"id": "EX1_014t",
			"name": "Bananas",
			"set": "Classic",
			"text": "Give a minion +1/+1.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Banane"
			},
			"id": "EX1_014te",
			"name": "Bananas",
			"set": "Classic",
			"text": "Has +1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_320.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "My advice to you is to avoid Doom, if possible.",
			"fr": {
				"name": "Plaie funeste"
			},
			"id": "EX1_320",
			"name": "Bane of Doom",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Deal $2 damage to a character. If that kills it, summon a random Demon.",
			"type": "Spell"
		},
		{
			"artist": "Ian Ameling",
			"attack": 7,
			"cardImage": "EX1_249.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Baron Geddon was Ragnaros's foremost lieutenant, until he got FIRED.",
			"fr": {
				"name": "Baron Geddon"
			},
			"health": 5,
			"id": "EX1_249",
			"name": "Baron Geddon",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "At the end of your turn, deal 2 damage to ALL other characters.",
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
			"set": "Classic",
			"type": "Weapon"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_392.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "\"You won't like me when I'm angry.\"",
			"fr": {
				"name": "Rage du combat"
			},
			"id": "EX1_392",
			"name": "Battle Rage",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Classic",
			"text": "Draw a card for each damaged friendly character.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_165b.png",
			"faction": "Neutral",
			"fr": {
				"name": "Forme d’ours"
			},
			"id": "EX1_165b",
			"name": "Bear Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Classic",
			"text": "+2 Health and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Berserk"
			},
			"id": "EX1_604o",
			"name": "Berserk",
			"playerClass": "Warrior",
			"set": "Classic",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_549.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "The seething wrath is just beneath the surface.  Beneath that is wild abandon, followed by slight annoyance.",
			"fr": {
				"name": "Courroux bestial"
			},
			"id": "EX1_549",
			"name": "Bestial Wrath",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Give a friendly Beast +2 Attack and <b>Immune</b> this turn.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Courroux bestial"
			},
			"id": "EX1_549o",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Bestial Wrath",
			"playerClass": "Hunter",
			"set": "Classic",
			"text": "+2 Attack and <b>Immune</b> this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Lucas Graciano",
			"cardImage": "EX1_126.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Everyone has a price. Gnomes, for example, can be persuaded by stuffed animals and small amounts of chocolate.",
			"fr": {
				"name": "Trahison"
			},
			"id": "EX1_126",
			"name": "Betrayal",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Classic",
			"text": "Force an enemy minion to deal its damage to the minions next to it.",
			"type": "Spell"
		},
		{
			"artist": "Chris Seaman",
			"attack": 4,
			"cardImage": "EX1_005.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Mere devilsaurs no longer excite him.  Soon he'll be trying to catch Onyxia with only a dull Krol Blade.",
			"fr": {
				"name": "Chasseur de gros gibier"
			},
			"health": 2,
			"id": "EX1_005",
			"mechanics": [
				"Battlecry"
			],
			"name": "Big Game Hunter",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Destroy a minion with an Attack of 7 or more.",
			"type": "Minion"
		},
		{
			"artist": "Tom Baxa",
			"cardImage": "EX1_570.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Chew your food!",
			"fr": {
				"name": "Morsure"
			},
			"id": "EX1_570",
			"name": "Bite",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Give your hero +4 Attack this turn and 4 Armor.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Morsure"
			},
			"id": "EX1_570e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Bite",
			"set": "Classic",
			"text": "+4 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Hideaki Takamura",
			"cardImage": "CS2_233.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "\"Look, it's not just about waving daggers around really fast.  It's a lot more complicated than that.\" - Shan, Rogue Trainer",
			"fr": {
				"name": "Déluge de lames"
			},
			"id": "CS2_233",
			"mechanics": [
				"AffectedBySpellPower"
			],
			"name": "Blade Flurry",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Destroy your weapon and deal its damage to all enemies.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Blarghghl"
			},
			"id": "EX1_509e",
			"name": "Blarghghl",
			"set": "Classic",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Bénédiction du champion"
			},
			"id": "EX1_355e",
			"name": "Blessed Champion",
			"playerClass": "Paladin",
			"set": "Classic",
			"text": "This minion's Attack has been doubled.",
			"type": "Enchantment"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "EX1_355.png",
			"collectible": true,
			"cost": 5,
			"flavor": "This card causes double the trouble AND double the fun.",
			"fr": {
				"name": "Bénédiction du champion"
			},
			"id": "EX1_355",
			"name": "Blessed Champion",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Double a minion's Attack.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Bénédiction de sagesse"
			},
			"id": "EX1_363e2",
			"name": "Blessing of Wisdom",
			"playerClass": "Paladin",
			"set": "Classic",
			"text": "When this minion attacks, the enemy player draws a card.",
			"type": "Enchantment"
		},
		{
			"artist": "Chippy",
			"cardImage": "EX1_363.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Apparently with wisdom comes the knowledge that you should probably be attacking every turn.",
			"fr": {
				"name": "Bénédiction de sagesse"
			},
			"id": "EX1_363",
			"name": "Blessing of Wisdom",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Classic",
			"text": "Choose a minion. Whenever it attacks, draw a card.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Bénédiction de sagesse"
			},
			"id": "EX1_363e",
			"name": "Blessing of Wisdom",
			"playerClass": "Paladin",
			"set": "Classic",
			"text": "When this minion attacks, the player who blessed it draws a card.",
			"type": "Enchantment"
		},
		{
			"artist": "Chris Seaman",
			"cardImage": "CS2_028.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "This spell can be very Entertaining.",
			"fr": {
				"name": "Blizzard"
			},
			"id": "CS2_028",
			"mechanics": [
				"Freeze"
			],
			"name": "Blizzard",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Deal $2 damage to all enemy minions and <b>Freeze</b> them.",
			"type": "Spell"
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
			"set": "Classic",
			"type": "Weapon"
		},
		{
			"artist": "Bernie Kang",
			"attack": 0,
			"cardImage": "CS2_059.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Imps are content to hide and viciously taunt everyone nearby.",
			"fr": {
				"name": "Diablotin de sang"
			},
			"health": 1,
			"id": "CS2_059",
			"mechanics": [
				"Stealth"
			],
			"name": "Blood Imp",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Stealth</b>. At the end of your turn, give another random friendly minion +1 Health.",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 3,
			"cardImage": "EX1_590.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "The Blood Knights get their holy powers from the Sunwell, which you should NOT bathe in.",
			"fr": {
				"name": "Chevalier de sang"
			},
			"health": 3,
			"id": "EX1_590",
			"mechanics": [
				"Battlecry"
			],
			"name": "Blood Knight",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Battlecry:</b> All minions lose <b>Divine Shield</b>. Gain +3/+3 for each Shield lost.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Pacte de sang"
			},
			"id": "CS2_059o",
			"name": "Blood Pact",
			"playerClass": "Warlock",
			"set": "Classic",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "EX1_012.png",
			"collectible": true,
			"cost": 2,
			"elite": true,
			"faction": "Neutral",
			"flavor": "He's in charge of the Annual Scarlet Monastery Blood Drive!",
			"fr": {
				"name": "Mage de sang Thalnos"
			},
			"health": 1,
			"id": "EX1_012",
			"mechanics": [
				"Deathrattle",
				"Spellpower"
			],
			"name": "Bloodmage Thalnos",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Spell Damage +1</b>. <b>Deathrattle:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Rage sanguinaire"
			},
			"id": "EX1_411e",
			"name": "Bloodrage",
			"playerClass": "Warrior",
			"set": "Classic",
			"text": "No durability loss.",
			"type": "Enchantment"
		},
		{
			"artist": "Randy Gallegos",
			"attack": 1,
			"cardImage": "NEW1_025.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Every pirate uses the same four digits to access Automated Gold Dispensers.  It's called the \"Pirate's Code\".",
			"fr": {
				"name": "Forban de la Voile sanglante"
			},
			"health": 2,
			"id": "NEW1_025",
			"mechanics": [
				"Battlecry"
			],
			"name": "Bloodsail Corsair",
			"race": "Pirate",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Remove 1 Durability from your opponent's weapon.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "NEW1_018.png",
			"collectible": true,
			"cost": 2,
			"flavor": "\"I only plunder on days that end in 'y'.\"",
			"fr": {
				"name": "Mousse de la Voile sanglante"
			},
			"health": 3,
			"id": "NEW1_018",
			"mechanics": [
				"Battlecry"
			],
			"name": "Bloodsail Raider",
			"race": "Pirate",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Gain Attack equal to the Attack of your weapon.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Renforcement"
			},
			"id": "NEW1_025e",
			"name": "Bolstered",
			"set": "Classic",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Wayne Reynolds",
			"cardImage": "EX1_407.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "Do you know the first rule of Brawl Club?",
			"fr": {
				"name": "Baston"
			},
			"id": "EX1_407",
			"name": "Brawl",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Destroy all minions except one. <i>(chosen randomly)</i>",
			"type": "Spell"
		},
		{
			"artist": "Chippy",
			"attack": 4,
			"cardImage": "EX1_091.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "You never know who may be secretly working for the Cabal....",
			"fr": {
				"name": "Prêtresse de la Cabale"
			},
			"health": 5,
			"id": "EX1_091",
			"mechanics": [
				"Battlecry"
			],
			"name": "Cabal Shadow Priest",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Take control of an enemy minion that has 2 or less Attack.",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 4,
			"cardImage": "EX1_110.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"faction": "Alliance",
			"flavor": "Cairne was killed by Garrosh, so... don't put this guy in a Warrior deck.  It's pretty insensitive.",
			"fr": {
				"name": "Cairne Sabot-de-Sang"
			},
			"health": 5,
			"id": "EX1_110",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Cairne Bloodhoof",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Deathrattle:</b> Summon a 4/5 Baine Bloodhoof.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Cannibalisme"
			},
			"id": "tt_004o",
			"name": "Cannibalize",
			"set": "Classic",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "NEW1_024.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"flavor": "He was <i>this close</i> to piloting a massive juggernaut into Stormwind Harbor. If it weren't for those pesky kids!",
			"fr": {
				"name": "Capitaine Vertepeau"
			},
			"health": 4,
			"id": "NEW1_024",
			"mechanics": [
				"Battlecry"
			],
			"name": "Captain Greenskin",
			"race": "Pirate",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Give your weapon +1/+1.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_165a.png",
			"faction": "Neutral",
			"fr": {
				"name": "Forme de félin"
			},
			"id": "EX1_165a",
			"name": "Cat Form",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Charge</b>",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "EX1_573.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Yes, he's a demigod. No, he doesn't need to wear a shirt.",
			"fr": {
				"name": "Cénarius"
			},
			"health": 8,
			"id": "EX1_573",
			"name": "Cenarius",
			"playerClass": "Druid",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Choose One</b> - Give your other minions +2/+2; or Summon two 2/2 Treants with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Daarken",
			"cardImage": "EX1_621.png",
			"collectible": true,
			"cost": 0,
			"flavor": "It isn't really a circle.",
			"fr": {
				"name": "Cercle de soins"
			},
			"id": "EX1_621",
			"name": "Circle of Healing",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Classic",
			"text": "Restore #4 Health to ALL minions.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Sang froid"
			},
			"id": "CS2_073e",
			"name": "Cold Blood",
			"playerClass": "Rogue",
			"set": "Classic",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Sang froid"
			},
			"id": "CS2_073e2",
			"name": "Cold Blood",
			"playerClass": "Rogue",
			"set": "Classic",
			"text": "+4 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_073.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "\"I'm cold blooded, check it and see!\"",
			"fr": {
				"name": "Sang froid"
			},
			"id": "CS2_073",
			"mechanics": [
				"Combo"
			],
			"name": "Cold Blood",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Classic",
			"text": "Give a minion +2 Attack. <b>Combo:</b> +4 Attack instead.",
			"type": "Spell"
		},
		{
			"artist": "Steve Prescott",
			"attack": 2,
			"cardImage": "EX1_050.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "They can see the future.   In that future both players draw more cards.   Spoooky.",
			"fr": {
				"name": "Oracle froide-lumière"
			},
			"health": 2,
			"id": "EX1_050",
			"mechanics": [
				"Battlecry"
			],
			"name": "Coldlight Oracle",
			"race": "Murloc",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Each player draws 2 cards.",
			"type": "Minion"
		},
		{
			"artist": "Arthur Gimaldinov",
			"attack": 2,
			"cardImage": "EX1_103.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "The Coldlight murlocs reside in the darkest pits of the Abyssal Depths.  So no, there's no getting away from murlocs.",
			"fr": {
				"name": "Voyant froide-lumière"
			},
			"health": 3,
			"id": "EX1_103",
			"mechanics": [
				"Battlecry"
			],
			"name": "Coldlight Seer",
			"race": "Murloc",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Give ALL other Murlocs +2 Health.",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"cardImage": "NEW1_036.png",
			"collectible": true,
			"cost": 2,
			"flavor": "\"Shout! Shout! Let it all out!\" - Advice to warriors-in-training",
			"fr": {
				"name": "Cri de commandement"
			},
			"id": "NEW1_036",
			"name": "Commanding Shout",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Your minions can't be reduced below 1 Health this turn. Draw a card.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Cri de commandement"
			},
			"id": "NEW1_036e2",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Commanding Shout",
			"playerClass": "Warrior",
			"set": "Classic",
			"text": "Your minions can't be reduced below 1 Health this turn.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Cri de commandement"
			},
			"id": "NEW1_036e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Commanding Shout",
			"playerClass": "Warrior",
			"set": "Classic",
			"text": "Can't be reduced below 1 Health this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Steve Hui",
			"cardImage": "EX1_128.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Rogues conceal everything but their emotions.  You can't get 'em to shut up about feelings.",
			"fr": {
				"name": "Dissimuler"
			},
			"id": "EX1_128",
			"name": "Conceal",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Classic",
			"text": "Give your minions <b>Stealth</b> until your next turn.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Dissimulé"
			},
			"id": "EX1_128e",
			"name": "Concealed",
			"playerClass": "Rogue",
			"set": "Classic",
			"text": "Stealthed until your next turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Leo Che",
			"cardImage": "EX1_275.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Magi of the Kirin Tor were casting Cubes of Cold for many years before Cones came into fashion some 90 years ago.",
			"fr": {
				"name": "Cône de froid"
			},
			"id": "EX1_275",
			"mechanics": [
				"Freeze"
			],
			"name": "Cone of Cold",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Freeze</b> a minion and the minions next to it, and deal $1 damage to them.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Consumer"
			},
			"id": "EX1_304e",
			"name": "Consume",
			"playerClass": "Warlock",
			"set": "Classic",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Jason Chan",
			"cardImage": "EX1_287.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "What's the difference between a mage playing with Counterspell and a mage who isn't?  The mage who isn't is getting Pyroblasted in the face.",
			"fr": {
				"name": "Contresort"
			},
			"id": "EX1_287",
			"mechanics": [
				"Secret"
			],
			"name": "Counterspell",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Secret:</b> When your opponent casts a spell, <b>Counter</b> it.",
			"type": "Spell"
		},
		{
			"artist": "Tom Fleming",
			"attack": 2,
			"cardImage": "EX1_059.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "\"You'll <i>love</i> my new recipe!\" he says... especially if you're not happy with your current number of limbs.",
			"fr": {
				"name": "Alchimiste dément"
			},
			"health": 2,
			"id": "EX1_059",
			"mechanics": [
				"Battlecry"
			],
			"name": "Crazed Alchemist",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Swap the Attack and Health of a minion.",
			"type": "Minion"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 2,
			"cardImage": "EX1_603.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "\"I'm going to need you to come in on Sunday.\" - Cruel Taskmaster",
			"fr": {
				"name": "Sous-chef cruel"
			},
			"health": 2,
			"id": "EX1_603",
			"mechanics": [
				"Battlecry"
			],
			"name": "Cruel Taskmaster",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Deal 1 damage to a minion and give it +2 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 4,
			"cardImage": "EX1_595.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "She may be an evil cult master, but she still calls her parents once a week.",
			"fr": {
				"name": "Maître de culte"
			},
			"health": 2,
			"id": "EX1_595",
			"inPlayText": "Cultist",
			"name": "Cult Master",
			"rarity": "Common",
			"set": "Classic",
			"text": "Whenever one of your other minions dies, draw a card.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "skele21.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Golem endommagé"
			},
			"health": 1,
			"id": "skele21",
			"name": "Damaged Golem",
			"race": "Mech",
			"rarity": "Common",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Scott Hampton",
			"attack": 4,
			"cardImage": "EX1_046.png",
			"collectible": true,
			"cost": 4,
			"faction": "Alliance",
			"flavor": "Guardians of Dark Iron Ore.  Perhaps the most annoying ore, given where you have to forge it.",
			"fr": {
				"name": "Nain sombrefer"
			},
			"health": 4,
			"id": "EX1_046",
			"mechanics": [
				"Battlecry"
			],
			"name": "Dark Iron Dwarf",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Give a minion +2 Attack this turn.",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"cardImage": "EX1_617.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Accuracy is not a highly valued trait among the mok'nathal.  Deadliness is near the top, though.",
			"fr": {
				"name": "Tir meurtrier"
			},
			"id": "EX1_617",
			"name": "Deadly Shot",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Classic",
			"text": "Destroy a random enemy minion.",
			"type": "Spell"
		},
		{
			"artist": "Bernie Kang",
			"attack": 12,
			"cardImage": "NEW1_030.png",
			"collectible": true,
			"cost": 10,
			"elite": true,
			"flavor": "Once a noble dragon known as Neltharion, Deathwing lost his mind and shattered Azeroth before finally being defeated.  Daddy issues?",
			"fr": {
				"name": "Aile de mort"
			},
			"health": 12,
			"id": "NEW1_030",
			"mechanics": [
				"Battlecry"
			],
			"name": "Deathwing",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Destroy all other minions and discard your hand.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "EX1_130a.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Défenseur"
			},
			"health": 1,
			"id": "EX1_130a",
			"name": "Defender",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "EX1_093.png",
			"collectible": true,
			"cost": 4,
			"faction": "Alliance",
			"flavor": "You wouldn’t think that Argus would need this much defending.  But it does.",
			"fr": {
				"name": "Défenseur d’Argus"
			},
			"health": 3,
			"id": "EX1_093",
			"mechanics": [
				"Battlecry"
			],
			"name": "Defender of Argus",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Give adjacent minions +1/+1 and <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "EX1_131t.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Bandit défias"
			},
			"health": 1,
			"id": "EX1_131t",
			"name": "Defias Bandit",
			"playerClass": "Rogue",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 2,
			"cardImage": "EX1_131.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "He stole the deed to town years ago, so technically the town <i>is</i> his. He just calls people Scrub to be mean.",
			"fr": {
				"name": "Meneur défias"
			},
			"health": 2,
			"id": "EX1_131",
			"mechanics": [
				"Combo"
			],
			"name": "Defias Ringleader",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Combo:</b> Summon a 2/1 Defias Bandit.",
			"type": "Minion"
		},
		{
			"faction": "Neutral",
			"fr": {
				"name": "Faveur du demi-dieu"
			},
			"id": "EX1_573ae",
			"name": "Demigod's Favor",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_573a.png",
			"faction": "Neutral",
			"fr": {
				"name": "Faveur du demi-dieu"
			},
			"id": "EX1_573a",
			"name": "Demigod's Favor",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Give your other minions +2/+2.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 1,
			"cardImage": "EX1_102.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Laying siege isn't fun for anyone.  It's not even all that effective, now that everyone has a flying mount.",
			"fr": {
				"name": "Démolisseur"
			},
			"health": 4,
			"id": "EX1_102",
			"name": "Demolisher",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Classic",
			"text": "At the start of your turn, deal 2 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"cost": 0,
			"faction": "Neutral",
			"fr": {
				"name": "Feu démoniaque"
			},
			"id": "EX1_596e",
			"name": "Demonfire",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Classic",
			"text": "This Demon has +2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Ben Wootten",
			"cardImage": "EX1_596.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Demonfire is like regular fire except for IT NEVER STOPS BURNING HELLLPPP",
			"fr": {
				"name": "Feu démoniaque"
			},
			"id": "EX1_596",
			"name": "Demonfire",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Classic",
			"text": "Deal $2 damage to a minion. If it’s a friendly Demon, give it +2/+2 instead.",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "EX1_tk29.png",
			"cost": 5,
			"faction": "Neutral",
			"fr": {
				"name": "Diablosaure"
			},
			"health": 5,
			"id": "EX1_tk29",
			"name": "Devilsaur",
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "John Dickenson",
			"attack": 2,
			"cardImage": "EX1_162.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "We are pretty excited about the upcoming release of Dire Wolf Beta, just repost this sign for a chance at a key.",
			"fr": {
				"name": "Loup alpha redoutable"
			},
			"health": 2,
			"id": "EX1_162",
			"inPlayText": "Alpha Dog",
			"mechanics": [
				"AdjacentBuff",
				"Aura"
			],
			"name": "Dire Wolf Alpha",
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"text": "Adjacent minions have +1 Attack.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Déguisé"
			},
			"id": "NEW1_014e",
			"name": "Disguised",
			"playerClass": "Rogue",
			"set": "Classic",
			"text": "Stealthed until your next turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_166b.png",
			"faction": "Neutral",
			"fr": {
				"name": "Dissipation"
			},
			"id": "EX1_166b",
			"mechanics": [
				"Silence"
			],
			"name": "Dispel",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "<b>Silence</b> a minion.",
			"type": "Spell"
		},
		{
			"artist": "Lucas Graciano",
			"cardImage": "EX1_349.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "This is not just a favor, but a divine one, like helping someone move a couch with a fold out bed!",
			"fr": {
				"name": "Faveur divine"
			},
			"id": "EX1_349",
			"name": "Divine Favor",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Draw cards until you have as many in hand as your opponent.",
			"type": "Spell"
		},
		{
			"artist": "Lucas Graciano",
			"attack": 5,
			"cardImage": "EX1_310.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "Summoning a doomguard is risky. <i>Someone</i> is going to die.",
			"fr": {
				"name": "Garde funeste"
			},
			"health": 7,
			"id": "EX1_310",
			"mechanics": [
				"Battlecry",
				"Charge"
			],
			"name": "Doomguard",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Charge</b>. <b>Battlecry:</b> Discard two random cards.",
			"type": "Minion"
		},
		{
			"artist": "John Polidora",
			"attack": 2,
			"cardImage": "EX1_567.png",
			"collectible": true,
			"cost": 5,
			"durability": 8,
			"faction": "Neutral",
			"flavor": "Orgrim Doomhammer gave this legendary weapon to Thrall.  His name is a total coincidence.",
			"fr": {
				"name": "Marteau-du-Destin"
			},
			"id": "EX1_567",
			"mechanics": [
				"Overload",
				"Windfury"
			],
			"name": "Doomhammer",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Windfury, Overload:</b> (2)",
			"type": "Weapon"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 0,
			"cardImage": "NEW1_021.png",
			"collectible": true,
			"cost": 2,
			"flavor": "He's almost been right so many times. He was <i>sure</i> it was coming during the Cataclysm.",
			"fr": {
				"name": "Auspice funeste"
			},
			"health": 7,
			"id": "NEW1_021",
			"name": "Doomsayer",
			"rarity": "Epic",
			"set": "Classic",
			"text": "At the start of your turn, destroy ALL minions.",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 3,
			"cardImage": "NEW1_022.png",
			"collectible": true,
			"cost": 4,
			"flavor": "\"Yarrrr\" is a pirate word that means \"Greetings, milord.\"",
			"fr": {
				"name": "Corsaire de l’effroi"
			},
			"health": 3,
			"id": "NEW1_022",
			"mechanics": [
				"Taunt"
			],
			"name": "Dread Corsair",
			"race": "Pirate",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Taunt.</b> Costs (1) less per Attack of your weapon.",
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
			"set": "Classic",
			"text": "Return a minion to its owner's hand.",
			"type": "Spell"
		},
		{
			"artist": "Luca Zontini",
			"attack": 4,
			"cardImage": "EX1_165.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "Cat or Bear?  Cat or Bear?!  I just cannot CHOOSE!",
			"fr": {
				"name": "Druide de la Griffe"
			},
			"health": 4,
			"id": "EX1_165",
			"name": "Druid of the Claw",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Choose One -</b> <b>Charge</b>; or +2 Health and <b>Taunt</b>.",
			"type": "Minion"
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
			"mechanics": [
				"Charge"
			],
			"name": "Druid of the Claw",
			"playerClass": "Druid",
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Charge</b>",
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
			"mechanics": [
				"Taunt"
			],
			"name": "Druid of the Claw",
			"playerClass": "Druid",
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "EX1_243.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Westfall is full of dust devils. And buzzards. And crazed golems. And pirates. Why does anyone live here?",
			"fr": {
				"name": "Diable de poussière"
			},
			"health": 1,
			"id": "EX1_243",
			"mechanics": [
				"Overload",
				"Windfury"
			],
			"name": "Dust Devil",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Windfury</b>. <b>Overload:</b> (2)",
			"type": "Minion"
		},
		{
			"artist": "Cyril Van Der Haegen",
			"attack": 3,
			"cardImage": "EX1_536.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"flavor": "First Lesson: Put the pointy end in the other guy.",
			"fr": {
				"name": "Arc cornedaigle"
			},
			"id": "EX1_536",
			"name": "Eaglehorn Bow",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Whenever a friendly <b>Secret</b> is revealed, gain +1 Durability.",
			"type": "Weapon"
		},
		{
			"artist": "Dan Scott",
			"attack": 7,
			"cardImage": "EX1_250.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "Nothing beats rock.",
			"fr": {
				"name": "Élémentaire de terre"
			},
			"health": 8,
			"id": "EX1_250",
			"mechanics": [
				"Overload",
				"Taunt"
			],
			"name": "Earth Elemental",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Taunt</b>. <b>Overload:</b> (3)",
			"type": "Minion"
		},
		{
			"artist": "Kevin Chin",
			"cardImage": "EX1_245.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Earth Shock? Shouldn't it be \"Azeroth Shock\"?",
			"fr": {
				"name": "Horion de terre"
			},
			"id": "EX1_245",
			"mechanics": [
				"Silence"
			],
			"name": "Earth Shock",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Silence</b> a minion, then deal $1 damage to it.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "CS2_117.png",
			"collectible": true,
			"cost": 3,
			"flavor": "He can see really far, and he doesn't use a telescope like those filthy pirates.",
			"fr": {
				"name": "Prophète du Cercle terrestre"
			},
			"health": 3,
			"id": "CS2_117",
			"mechanics": [
				"Battlecry"
			],
			"name": "Earthen Ring Farseer",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Restore 3 Health.",
			"type": "Minion"
		},
		{
			"artist": "Efrem Palacios",
			"attack": 2,
			"cardImage": "EX1_613.png",
			"collectible": true,
			"cost": 3,
			"elite": true,
			"faction": "Neutral",
			"flavor": "He led the Stonemasons in the reconstruction of Stormwind, and when the nobles refused to pay, he founded the Defias Brotherhood to, well, <i>deconstruct</i> Stormwind.",
			"fr": {
				"name": "Edwin VanCleef"
			},
			"health": 2,
			"id": "EX1_613",
			"mechanics": [
				"Combo"
			],
			"name": "Edwin VanCleef",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Combo:</b> Gain +2/+2 for each card played earlier this turn.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Grâce d’Élune"
			},
			"id": "EX1_004e",
			"name": "Elune's Grace",
			"set": "Classic",
			"text": "Increased Health.",
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
			"race": "Dragon",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Lars Grant-West",
			"attack": 2,
			"cardImage": "EX1_170.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "The Sholazar Basin is home to a lot of really horrible things. If you're going to visit, wear bug spray.  And plate armor.",
			"fr": {
				"name": "Cobra empereur"
			},
			"health": 3,
			"id": "EX1_170",
			"inPlayText": "Fanged",
			"mechanics": [
				"Poisonous"
			],
			"name": "Emperor Cobra",
			"race": "Beast",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Destroy any minion damaged by this minion.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Surpuissant"
			},
			"id": "EX1_055o",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Empowered",
			"set": "Classic",
			"text": "Mana Addict has increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Michal Ivan",
			"cardImage": "EX1_619.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "We are all special unique snowflakes... with 1 Health.",
			"fr": {
				"name": "Égalité"
			},
			"id": "EX1_619",
			"name": "Equality",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Change the Health of ALL minions to 1.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Égalité"
			},
			"id": "EX1_619e",
			"name": "Equality",
			"playerClass": "Paladin",
			"set": "Classic",
			"text": "Health changed to 1.",
			"type": "Enchantment"
		},
		{
			"collectible": false,
			"fr": {
				"name": "Équipé"
			},
			"id": "NEW1_037e",
			"name": "Equipped",
			"set": "Classic",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Michael Komarck",
			"attack": 3,
			"cardImage": "EX1_274.png",
			"collectible": true,
			"cost": 4,
			"elite": false,
			"flavor": "The ethereals are wrapped in cloth to give form to their non-corporeal bodies. Also because it's nice and soft.",
			"fr": {
				"name": "Arcaniste éthérien"
			},
			"health": 3,
			"id": "EX1_274",
			"name": "Ethereal Arcanist",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Classic",
			"text": "If you control a <b>Secret</b> at the end of your turn, gain +2/+2.",
			"type": "Minion"
		},
		{
			"artist": "Ariel Olivetti",
			"cardImage": "EX1_124.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "There is a high cost to Eviscerating your opponent:  It takes a long time to get blood stains out of leather armor.",
			"fr": {
				"name": "Éviscération"
			},
			"id": "EX1_124",
			"mechanics": [
				"Combo"
			],
			"name": "Eviscerate",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Classic",
			"text": "Deal $2 damage. <b>Combo:</b> Deal $4 damage instead.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Des expériences !"
			},
			"id": "EX1_059e",
			"name": "Experiments!",
			"set": "Classic",
			"text": "Attack and Health have been swapped by Crazed Alchemist.",
			"type": "Enchantment"
		},
		{
			"artist": "Tom Baxa",
			"cardImage": "EX1_537.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "Pull the pin, count to 5, then shoot.  Then duck.",
			"fr": {
				"name": "Tir explosif"
			},
			"id": "EX1_537",
			"name": "Explosive Shot",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Deal $5 damage to a minion and $2 damage to adjacent ones.",
			"type": "Spell"
		},
		{
			"artist": "Brandon Kitkouski",
			"cardImage": "EX1_610.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "It traps your food AND cooks it for you!",
			"fr": {
				"name": "Piège explosif"
			},
			"id": "EX1_610",
			"mechanics": [
				"Secret"
			],
			"name": "Explosive Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Secret:</b> When your hero is attacked, deal $2 damage to all enemies.",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"cardImage": "EX1_132.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Justice sometimes takes the form of a closed fist into a soft cheek.",
			"fr": {
				"name": "Œil pour œil"
			},
			"id": "EX1_132",
			"mechanics": [
				"Secret"
			],
			"name": "Eye for an Eye",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Secret:</b> When your hero takes damage, deal that much damage to the enemy hero.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 3,
			"cardImage": "EX1_564.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "The Faceless Ones are servants of Yogg-Saron, and they feed on fear. Right now they are feeding on your fear of accidentally disenchanting all your good cards.",
			"fr": {
				"name": "Manipulateur sans-visage"
			},
			"health": 3,
			"id": "EX1_564",
			"mechanics": [
				"Battlecry"
			],
			"name": "Faceless Manipulator",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Choose a minion and become a copy of it.",
			"type": "Minion"
		},
		{
			"artist": "Samwise",
			"attack": 3,
			"cardImage": "NEW1_023.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Adorable.  Immune to Magic.  Doesn't pee on the rug.  The perfect pet!",
			"fr": {
				"name": "Dragon féerique"
			},
			"health": 2,
			"id": "NEW1_023",
			"name": "Faerie Dragon",
			"race": "Dragon",
			"rarity": "Common",
			"set": "Classic",
			"text": "Can't be targeted by spells or Hero Powers.",
			"type": "Minion"
		},
		{
			"artist": "Lars Grant-West",
			"fr": {
				"name": "Double vue"
			},
			"id": "CS2_053e",
			"name": "Far Sight",
			"playerClass": "Shaman",
			"set": "Classic",
			"text": "One of your cards costs (3) less.",
			"type": "Enchantment"
		},
		{
			"artist": "Lars Grant-West",
			"cardImage": "CS2_053.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Drek'thar can't see, but he can <i>see</i>. You know what I mean? It's ok if you don't.",
			"fr": {
				"name": "Double vue"
			},
			"id": "CS2_053",
			"name": "Far Sight",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Draw a card. That card costs (3) less.",
			"type": "Spell"
		},
		{
			"artist": "John Polidora",
			"attack": 3,
			"cardImage": "EX1_301.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Yes, he'll fight for you.  BUT HE'S NOT GOING TO LIKE IT.",
			"fr": {
				"name": "Gangregarde"
			},
			"health": 5,
			"id": "EX1_301",
			"mechanics": [
				"Battlecry",
				"Taunt"
			],
			"name": "Felguard",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Taunt</b>. <b>Battlecry:</b> Destroy one of your Mana Crystals.",
			"type": "Minion"
		},
		{
			"artist": "Monica Langlois",
			"attack": 3,
			"cardImage": "CS1_069.png",
			"collectible": true,
			"cost": 5,
			"faction": "Alliance",
			"flavor": "He used to be called Bog Beast, but it confused people because he wasn't an actual beast.   Boom, New Name!",
			"fr": {
				"name": "Rampant des tourbières"
			},
			"health": 6,
			"id": "CS1_069",
			"mechanics": [
				"Taunt"
			],
			"name": "Fen Creeper",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_248.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Spirit wolves are like regular wolves with pom-poms.",
			"fr": {
				"name": "Esprit farouche"
			},
			"id": "EX1_248",
			"mechanics": [
				"Overload"
			],
			"name": "Feral Spirit",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Summon two 2/3 Spirit Wolves with <b>Taunt</b>. <b>Overload:</b> (2)",
			"type": "Spell"
		},
		{
			"attack": 3,
			"cardImage": "EX1_finkle.png",
			"cost": 2,
			"elite": true,
			"faction": "Neutral",
			"fr": {
				"name": "Finkle Einhorn"
			},
			"health": 3,
			"id": "EX1_finkle",
			"name": "Finkle Einhorn",
			"rarity": "Legendary",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_319.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Imps like being on fire.  They just do.",
			"fr": {
				"name": "Diablotin des flammes"
			},
			"health": 2,
			"id": "EX1_319",
			"mechanics": [
				"Battlecry"
			],
			"name": "Flame Imp",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Deal 3 damage to your hero.",
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
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "EX1_544.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Not only does it reveal your enemies, but it's also great for parties!",
			"fr": {
				"name": "Fusée éclairante"
			},
			"id": "EX1_544",
			"name": "Flare",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Classic",
			"text": "All minions lose <b>Stealth</b>. Destroy all enemy <b>Secrets</b>. Draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 2,
			"cardImage": "tt_004.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "'Flesheating' is an unfair name.  It's just that there's not really much else for him to eat.",
			"fr": {
				"name": "Goule mangeuse de chair"
			},
			"health": 3,
			"id": "tt_004",
			"inPlayText": "Cannibalism",
			"name": "Flesheating Ghoul",
			"rarity": "Common",
			"set": "Classic",
			"text": "Whenever a minion dies, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Trevor Jacobs",
			"cardImage": "EX1_571.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "\"I think I'll just nap under these trees. Wait... AAAAAHHH!\" - Blinkfizz, the Unfortunate Gnome",
			"fr": {
				"name": "Force de la nature"
			},
			"id": "EX1_571",
			"name": "Force of Nature",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Summon three 2/2 Treants with <b>Charge</b> that die at the end of the turn.",
			"type": "Spell"
		},
		{
			"artist": "Ralph Horsley",
			"cardImage": "EX1_251.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "If you combine it with Spooned Lightning and Knived Lightning, you have the full dining set.",
			"fr": {
				"name": "Fourche d’éclairs"
			},
			"id": "EX1_251",
			"mechanics": [
				"Overload"
			],
			"name": "Forked Lightning",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Classic",
			"text": "Deal $2 damage to 2 random enemy minions. <b>Overload:</b> (2)",
			"type": "Spell"
		},
		{
			"artist": "Matt Gaser",
			"cardImage": "EX1_611.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "\"Dang, that's cold.\" - appropriate response to Freezing Trap, or a mean joke.",
			"fr": {
				"name": "Piège givrant"
			},
			"id": "EX1_611",
			"mechanics": [
				"Secret"
			],
			"name": "Freezing Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Secret:</b> When an enemy minion attacks, return it to its owner's hand and it costs (2) more.",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "EX1_283.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "When a Water elemental and an Ice elemental love each other VERY much...",
			"fr": {
				"name": "Élémentaire de givre"
			},
			"health": 5,
			"id": "EX1_283",
			"mechanics": [
				"Battlecry",
				"Freeze"
			],
			"name": "Frost Elemental",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> <b>Freeze</b> a character.",
			"type": "Minion"
		},
		{
			"artist": "Simon Bisley",
			"attack": 2,
			"cardImage": "EX1_604.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "He used to work as an accountant before he tried his hand at Berserkering.",
			"fr": {
				"name": "Berserker écumant"
			},
			"health": 4,
			"id": "EX1_604",
			"inPlayText": "Berserk",
			"name": "Frothing Berserker",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Whenever a minion takes damage, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Ventre plein"
			},
			"id": "NEW1_017e",
			"name": "Full Belly",
			"set": "Classic",
			"text": "+2/+2.  Full of Murloc.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "En pleine forme"
			},
			"id": "CS2_181e",
			"name": "Full Strength",
			"set": "Classic",
			"text": "This minion has +2 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 4,
			"cardImage": "EX1_095.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "He used to run the black market auction house, but there was just too much violence and he had to move.",
			"fr": {
				"name": "Commissaire-priseur"
			},
			"health": 4,
			"id": "EX1_095",
			"inPlayText": "Auctioning",
			"name": "Gadgetzan Auctioneer",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Whenever you cast a spell, draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Peter C. Lee",
			"attack": 5,
			"cardImage": "DS1_188.png",
			"collectible": true,
			"cost": 7,
			"durability": 2,
			"faction": "Neutral",
			"flavor": "The longbow allows shots to be fired from farther away and is useful for firing on particularly odorous targets.",
			"fr": {
				"name": "Arc long du gladiateur"
			},
			"id": "DS1_188",
			"name": "Gladiator's Longbow",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Your hero is <b>Immune</b> while attacking.",
			"type": "Weapon"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Gnoll",
			"set": "Classic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 7,
			"cardImage": "EX1_411.png",
			"collectible": true,
			"cost": 7,
			"durability": 1,
			"faction": "Neutral",
			"flavor": "Grommash Hellscream's famous axe.  Somehow this ended up in Prince Malchezaar's possession.  Quite the mystery!",
			"fr": {
				"name": "Hurlesang"
			},
			"id": "EX1_411",
			"name": "Gorehowl",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Attacking a minion costs 1 Attack instead of 1 Durability.",
			"type": "Weapon"
		},
		{
			"fr": {
				"name": "Ordres de Vertepeau"
			},
			"id": "NEW1_024o",
			"name": "Greenskin's Command",
			"set": "Classic",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Glenn Rane",
			"attack": 4,
			"cardImage": "EX1_414.png",
			"collectible": true,
			"cost": 8,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Grommash drank the tainted blood of Mannoroth, dooming the orcs to green skin and red eyes!  Maybe not his best decision.",
			"fr": {
				"name": "Grommash Hurlenfer"
			},
			"health": 9,
			"id": "EX1_414",
			"mechanics": [
				"Charge",
				"Enrage"
			],
			"name": "Grommash Hellscream",
			"playerClass": "Warrior",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Charge</b>\n<b>Enrage:</b> +6 Attack",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Croissance"
			},
			"id": "NEW1_038o",
			"name": "Growth",
			"set": "Classic",
			"text": "Gruul is growing...",
			"type": "Enchantment"
		},
		{
			"artist": "Kev Walker",
			"attack": 7,
			"cardImage": "NEW1_038.png",
			"collectible": true,
			"cost": 8,
			"elite": true,
			"flavor": "He's Gruul \"the Dragonkiller\".  He just wanted to cuddle them… he never meant to…",
			"fr": {
				"name": "Gruul"
			},
			"health": 7,
			"id": "NEW1_038",
			"inPlayText": "Growth",
			"name": "Gruul",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "At the end of each turn, gain +1/+1 .",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Main d’Argus"
			},
			"id": "EX1_093e",
			"name": "Hand of Argus",
			"set": "Classic",
			"text": "+1/+1 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 5,
			"cardImage": "EX1_558.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"faction": "Neutral",
			"flavor": "“That belongs in the Hall of Explorers!”",
			"fr": {
				"name": "Harrison Jones"
			},
			"health": 4,
			"id": "EX1_558",
			"mechanics": [
				"Battlecry"
			],
			"name": "Harrison Jones",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Destroy your opponent's weapon and draw cards equal to its Durability.",
			"type": "Minion"
		},
		{
			"artist": "Brian Despain",
			"attack": 2,
			"cardImage": "EX1_556.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "\"Overheat threshold exceeded. System failure. Wheat clog in port two. Shutting down.\"",
			"fr": {
				"name": "Golem des moissons"
			},
			"health": 3,
			"id": "EX1_556",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Harvest Golem",
			"race": "Mech",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Deathrattle:</b> Summon a 2/1 Damaged Golem.",
			"type": "Minion"
		},
		{
			"artist": "James Zhang",
			"cardImage": "EX1_137.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "When all else fails, nothing beats a swift whack upside the head.",
			"fr": {
				"name": "Casse-tête"
			},
			"id": "EX1_137",
			"mechanics": [
				"Combo"
			],
			"name": "Headcrack",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Deal $2 damage to the enemy hero. <b>Combo:</b> Return this to your hand next turn.",
			"type": "Spell"
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
			"set": "Classic",
			"type": "Weapon"
		},
		{
			"artist": "Laurel D. Austin",
			"attack": 4,
			"cardImage": "NEW1_040.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "Hogger is super powerful. If you kill him, it's because he <i>let</i> you.",
			"fr": {
				"name": "Lardeur"
			},
			"health": 4,
			"id": "NEW1_040",
			"name": "Hogger",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "At the end of your turn, summon a 2/2 Gnoll with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Miguel Coimbra",
			"cardImage": "EX1_624.png",
			"collectible": true,
			"cost": 6,
			"flavor": "Often followed by Holy Smokes!",
			"fr": {
				"name": "Flammes sacrées"
			},
			"id": "EX1_624",
			"name": "Holy Fire",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Deal $5 damage. Restore #5 Health to your hero.",
			"type": "Spell"
		},
		{
			"artist": "Justin Sweet",
			"cardImage": "EX1_365.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "C'mon Molten Giant!!",
			"fr": {
				"name": "Colère divine"
			},
			"id": "EX1_365",
			"name": "Holy Wrath",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Draw a card and deal damage equal to its cost.",
			"type": "Spell"
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
			"mechanics": [
				"Charge"
			],
			"name": "Hound",
			"playerClass": "Hunter",
			"race": "Beast",
			"set": "Classic",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Heure du Crépuscule"
			},
			"id": "EX1_043e",
			"name": "Hour of Twilight",
			"set": "Classic",
			"text": "Increased Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 1,
			"cardImage": "NEW1_017.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Murloc.  It's what's for dinner.",
			"fr": {
				"name": "Crabe affamé"
			},
			"health": 2,
			"id": "NEW1_017",
			"mechanics": [
				"Battlecry"
			],
			"name": "Hungry Crab",
			"race": "Beast",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Destroy a Murloc and gain +2/+2.",
			"type": "Minion"
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
			"race": "Beast",
			"rarity": "Rare",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_289.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "This is Rank 1.  Rank 2 is Chocolate Milk Barrier.",
			"fr": {
				"name": "Barrière de glace"
			},
			"id": "EX1_289",
			"mechanics": [
				"Secret"
			],
			"name": "Ice Barrier",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Secret:</b> When your hero is attacked, gain 8 Armor.",
			"type": "Spell"
		},
		{
			"artist": "Carl Frank",
			"cardImage": "EX1_295.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Ice is nice, and will suffice!",
			"fr": {
				"name": "Bloc de glace"
			},
			"id": "EX1_295",
			"mechanics": [
				"Secret"
			],
			"name": "Ice Block",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Secret:</b> When your hero takes fatal damage, prevent it and become <b>Immune</b> this turn.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Bloc de glace"
			},
			"id": "EX1_295o",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Ice Block",
			"playerClass": "Mage",
			"set": "Classic",
			"text": "Your hero is <b>Immune</b> this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "CS2_031.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "The trick is not to break the lance.  Otherwise, you have \"Ice Pieces.\"  Ice Pieces aren't as effective.",
			"fr": {
				"name": "Javelot de glace"
			},
			"id": "CS2_031",
			"mechanics": [
				"Freeze"
			],
			"name": "Ice Lance",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Freeze</b> a character. If it was already <b>Frozen</b>, deal $4 damage instead.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 7,
			"cardImage": "EX1_614.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Illidan's brother, Malfurion, imprisoned him beneath Hyjal for 10,000 years.  Stormrages are not good at letting go of grudges.",
			"fr": {
				"name": "Illidan Hurlorage"
			},
			"health": 5,
			"id": "EX1_614",
			"name": "Illidan Stormrage",
			"race": "Demon",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "Whenever you play a card, summon a 2/1 Flame of Azzinoth.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "EX1_598.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Diablotin"
			},
			"health": 1,
			"id": "EX1_598",
			"name": "Imp",
			"race": "Demon",
			"rarity": "Rare",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Mark Gibbons",
			"attack": 1,
			"cardImage": "EX1_597.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "She would enjoy the job a lot more if she just could get the imps to QUIT BITING HER.",
			"fr": {
				"name": "Maître des diablotins"
			},
			"health": 5,
			"id": "EX1_597",
			"inPlayText": "Imp Master",
			"name": "Imp Master",
			"rarity": "Rare",
			"set": "Classic",
			"text": "At the end of your turn, deal 1 damage to this minion and summon a 1/1 Imp.",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "EX1_tk34.png",
			"cost": 6,
			"faction": "Neutral",
			"fr": {
				"name": "Infernal"
			},
			"health": 6,
			"id": "EX1_tk34",
			"name": "Infernal",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Common",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_tk33.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "FEU D’ENFER !"
			},
			"id": "EX1_tk33",
			"name": "INFERNO!",
			"playerClass": "Warlock",
			"set": "Classic",
			"text": "<b>Hero Power</b>\nSummon a 6/6 Infernal.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Infusion"
			},
			"id": "EX1_623e",
			"name": "Infusion",
			"playerClass": "Priest",
			"set": "Classic",
			"text": "+3 Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Samwise",
			"attack": 4,
			"cardImage": "CS2_181.png",
			"collectible": true,
			"cost": 3,
			"faction": "Horde",
			"flavor": "He claims it is an old war wound, but we think he just cut himself shaving.",
			"fr": {
				"name": "Maître-lame blessé"
			},
			"health": 7,
			"id": "CS2_181",
			"inPlayText": "Weakened",
			"mechanics": [
				"Battlecry"
			],
			"name": "Injured Blademaster",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Deal 4 damage to HIMSELF.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Feu intérieur"
			},
			"id": "CS1_129e",
			"name": "Inner Fire",
			"playerClass": "Priest",
			"set": "Classic",
			"text": "This minion's Attack is equal to its Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Steve Prescott",
			"cardImage": "CS1_129.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Good idea: Buffing your minions.  Bad idea: Starting a conversation in the Barrens.",
			"fr": {
				"name": "Feu intérieur"
			},
			"id": "CS1_129",
			"name": "Inner Fire",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Classic",
			"text": "Change a minion's Attack to be equal to its Health.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Rage intérieure"
			},
			"id": "EX1_607e",
			"name": "Inner Rage",
			"playerClass": "Warrior",
			"set": "Classic",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Slawomir Maniak",
			"cardImage": "EX1_607.png",
			"collectible": true,
			"cost": 0,
			"faction": "Neutral",
			"flavor": "They're only smiling on the outside.",
			"fr": {
				"name": "Rage intérieure"
			},
			"id": "EX1_607",
			"name": "Inner Rage",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Classic",
			"text": "Deal $1 damage to a minion and give it +2 Attack.",
			"type": "Spell"
		},
		{
			"artist": "Trevor Jacobs",
			"attack": 2,
			"cardImage": "CS2_203.png",
			"collectible": true,
			"cost": 2,
			"faction": "Horde",
			"flavor": "Their wings are silent but their screech is... whatever the opposite of silent is.",
			"fr": {
				"name": "Chouette bec-de-fer"
			},
			"health": 1,
			"id": "CS2_203",
			"mechanics": [
				"Battlecry"
			],
			"name": "Ironbeak Owl",
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> <b>Silence</b> a minion.",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 4,
			"cardImage": "EX1_017.png",
			"collectible": true,
			"cost": 3,
			"faction": "Horde",
			"flavor": "Stranglethorn is a beautiful place to visit, but you wouldn't want to live there.",
			"fr": {
				"name": "Panthère de la jungle"
			},
			"health": 2,
			"id": "EX1_017",
			"mechanics": [
				"Stealth"
			],
			"name": "Jungle Panther",
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Justice rendue"
			},
			"id": "EX1_366e",
			"name": "Justice Served",
			"playerClass": "Paladin",
			"set": "Classic",
			"text": "Has +1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 2,
			"cardImage": "EX1_166.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "These guys just show up and start Keeping your Groves without even asking.",
			"fr": {
				"name": "Gardien du bosquet"
			},
			"health": 4,
			"id": "EX1_166",
			"name": "Keeper of the Grove",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Choose One</b> - Deal 2 damage; or <b>Silence</b> a minion.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Garde des secrets"
			},
			"id": "EX1_080o",
			"name": "Keeping Secrets",
			"set": "Classic",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Dave Allsop",
			"attack": 5,
			"cardImage": "NEW1_005.png",
			"collectible": true,
			"cost": 6,
			"flavor": "He just wants people to see his vacation photos.",
			"fr": {
				"name": "Kidnappeur"
			},
			"health": 3,
			"id": "NEW1_005",
			"mechanics": [
				"Combo"
			],
			"name": "Kidnapper",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Combo:</b> Return a minion to its owner's hand.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Tuez Millhouse !"
			},
			"id": "NEW1_029t",
			"name": "Kill Millhouse!",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "Spells cost (0) this turn!",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 8,
			"cardImage": "EX1_543.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"faction": "Neutral",
			"flavor": "The best defense against King Krush is to have someone you don’t like standing in front of you.",
			"fr": {
				"name": "Roi Krush"
			},
			"health": 8,
			"id": "EX1_543",
			"mechanics": [
				"Charge"
			],
			"name": "King Krush",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Charge</b>",
			"type": "Minion"
		},
		{
			"artist": "Sunny Gho",
			"attack": 5,
			"cardImage": "EX1_014.png",
			"collectible": true,
			"cost": 3,
			"elite": true,
			"flavor": "King Mukla wanders Jaguero Isle, searching for love.",
			"fr": {
				"name": "Roi Mukla"
			},
			"health": 5,
			"id": "EX1_014",
			"mechanics": [
				"Battlecry"
			],
			"name": "King Mukla",
			"race": "Beast",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Give your opponent 2 Bananas.",
			"type": "Minion"
		},
		{
			"artist": "Popo Wei",
			"attack": 4,
			"cardImage": "EX1_612.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "The Kirin Tor reside in the floating city of Dalaran.  How do you make a Dalaran float?  Two scoops of ice cream, one scoop of Dalaran.",
			"fr": {
				"name": "Mage du Kirin Tor"
			},
			"health": 3,
			"id": "EX1_612",
			"mechanics": [
				"Battlecry"
			],
			"name": "Kirin Tor Mage",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> The next <b>Secret</b> you play this turn costs (0).",
			"type": "Minion"
		},
		{
			"artist": "Matt Cavotta",
			"attack": 3,
			"cardImage": "NEW1_019.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Ambitious Knife Jugglers sometimes graduate to Bomb Jugglers.    They never last long enough to make it onto a card though.",
			"fr": {
				"name": "Jongleur de couteaux"
			},
			"health": 2,
			"id": "NEW1_019",
			"name": "Knife Juggler",
			"rarity": "Rare",
			"set": "Classic",
			"text": "After you summon a minion, deal 1 damage to a random enemy.",
			"type": "Minion"
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
			"inPlayText": "Quick",
			"name": "Laughing Sister",
			"playerClass": "Dream",
			"set": "Classic",
			"text": "Can't be targeted by spells or Hero Powers.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "EX1_241.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "It's like an ocean of liquid magma in your mouth!",
			"fr": {
				"name": "Explosion de lave"
			},
			"id": "EX1_241",
			"mechanics": [
				"Overload"
			],
			"name": "Lava Burst",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Deal $5 damage. <b>Overload:</b> (2)",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_354.png",
			"collectible": true,
			"cost": 8,
			"faction": "Neutral",
			"flavor": "A grammatically awkward life saver.",
			"fr": {
				"name": "Imposition des mains"
			},
			"id": "EX1_354",
			"name": "Lay on Hands",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Restore #8 Health. Draw 3 cards.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_160b.png",
			"faction": "Neutral",
			"fr": {
				"name": "Chef de la meute"
			},
			"id": "EX1_160b",
			"name": "Leader of the Pack",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Give your minions +1/+1.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Chef de la meute"
			},
			"id": "EX1_160be",
			"name": "Leader of the Pack",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "+1/+1",
			"type": "Enchantment"
		},
		{
			"artist": "Gabe from Penny Arcade",
			"attack": 6,
			"cardImage": "EX1_116.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"faction": "Alliance",
			"flavor": "At least he has Angry Chicken.",
			"fr": {
				"name": "Leeroy Jenkins"
			},
			"health": 2,
			"id": "EX1_116",
			"mechanics": [
				"Battlecry",
				"Charge"
			],
			"name": "Leeroy Jenkins",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Charge</b>. <b>Battlecry:</b> Summon two 1/1 Whelps for your opponent.",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 2,
			"cardImage": "EX1_029.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "He really just wants to be your friend, but the constant rejection is starting to really get to him.",
			"fr": {
				"name": "Gnome lépreux"
			},
			"health": 1,
			"id": "EX1_029",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Leper Gnome",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Deathrattle:</b> Deal 2 damage to the enemy hero.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Gain de niveau !"
			},
			"id": "EX1_044e",
			"name": "Level Up!",
			"set": "Classic",
			"text": "Increased Attack and Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Daarken",
			"cardImage": "EX1_238.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Lightning Bolt! Lightning Bolt! Lightning Bolt!",
			"fr": {
				"name": "Éclair"
			},
			"id": "EX1_238",
			"mechanics": [
				"Overload"
			],
			"name": "Lightning Bolt",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Classic",
			"text": "Deal $3 damage. <b>Overload:</b> (1)",
			"type": "Spell"
		},
		{
			"artist": "Christopher Moeller",
			"cardImage": "EX1_259.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "An umbrella won't be effective, I'm afraid.",
			"fr": {
				"name": "Tempête de foudre"
			},
			"id": "EX1_259",
			"mechanics": [
				"Overload"
			],
			"name": "Lightning Storm",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Deal $2-$3 damage to all enemy minions. <b>Overload:</b> (2)",
			"type": "Spell"
		},
		{
			"artist": "Daarken",
			"attack": 0,
			"cardImage": "EX1_335.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Spawn of the Light? Or Pawn of the Lights?",
			"fr": {
				"name": "Rejeton de lumière"
			},
			"health": 5,
			"id": "EX1_335",
			"name": "Lightspawn",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Classic",
			"text": "This minion's Attack is always equal to its Health.",
			"type": "Minion"
		},
		{
			"artist": "Erik Ko",
			"attack": 1,
			"cardImage": "EX1_001.png",
			"collectible": true,
			"cost": 1,
			"flavor": "She’s smaller than her sisters Mediumwarden and Heavywarden.",
			"fr": {
				"name": "Gardelumière"
			},
			"health": 2,
			"id": "EX1_001",
			"name": "Lightwarden",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Whenever a character is healed, gain +2 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Blizzard Entertainment",
			"attack": 0,
			"cardImage": "EX1_341.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "It isn't clear if people ignore the Lightwell, or if it is just invisible.",
			"fr": {
				"name": "Puits de lumière"
			},
			"health": 5,
			"id": "EX1_341",
			"name": "Lightwell",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Classic",
			"text": "At the start of your turn, restore 3 Health to a damaged friendly character.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "EX1_096.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Always roll need.",
			"fr": {
				"name": "Amasseur de butin"
			},
			"health": 1,
			"id": "EX1_096",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Loot Hoarder",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Deathrattle:</b> Draw a card.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "EX1_323h.png",
			"cost": 0,
			"faction": "Neutral",
			"fr": {
				"name": "Seigneur Jaraxxus"
			},
			"health": 15,
			"id": "EX1_323h",
			"name": "Lord Jaraxxus",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Legendary",
			"set": "Classic",
			"type": "Hero"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_323.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"flavor": "\"TRIFLING GNOME! YOUR ARROGANCE WILL BE YOUR UNDOING!!!!\"",
			"fr": {
				"name": "Seigneur Jaraxxus"
			},
			"health": 15,
			"id": "EX1_323",
			"mechanics": [
				"Battlecry"
			],
			"name": "Lord Jaraxxus",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Destroy your hero and replace it with Lord Jaraxxus.",
			"type": "Minion"
		},
		{
			"artist": "Mark Zug",
			"attack": 0,
			"cardImage": "EX1_100.png",
			"collectible": true,
			"cost": 2,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Lorewalker Cho archives and shares tales from the land of Pandaria, but his favorite story is the one where Joey and Phoebe go on a road trip.",
			"fr": {
				"name": "Chroniqueur Cho"
			},
			"health": 4,
			"id": "EX1_100",
			"name": "Lorewalker Cho",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "Whenever a player casts a spell, put a copy into the other player’s hand.",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 3,
			"cardImage": "EX1_082.png",
			"collectible": true,
			"cost": 2,
			"faction": "Alliance",
			"flavor": "He's not really all that crazy, he is just not as careful with explosives as he should be.",
			"fr": {
				"name": "Bombardier fou"
			},
			"health": 2,
			"id": "EX1_082",
			"mechanics": [
				"Battlecry"
			],
			"name": "Mad Bomber",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Deal 3 damage randomly split between all other characters.",
			"type": "Minion"
		},
		{
			"artist": "Michael Komarck",
			"attack": 4,
			"cardImage": "EX1_563.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Malygos hates it when mortals use magic.  He gets so mad!",
			"fr": {
				"name": "Malygos"
			},
			"health": 12,
			"id": "EX1_563",
			"mechanics": [
				"Spellpower"
			],
			"name": "Malygos",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Spell Damage +5</b>",
			"type": "Minion"
		},
		{
			"artist": "Hideaki Takamura",
			"attack": 1,
			"cardImage": "EX1_055.png",
			"collectible": true,
			"cost": 2,
			"faction": "Alliance",
			"flavor": "She’s trying to kick the habit, but still takes some mana whenever she has a stressful day.",
			"fr": {
				"name": "Accro au mana"
			},
			"health": 3,
			"id": "EX1_055",
			"inPlayText": "Addicted",
			"name": "Mana Addict",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Whenever you cast a spell, gain +2 Attack this turn.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Gorgé de mana"
			},
			"id": "NEW1_012o",
			"name": "Mana Gorged",
			"playerClass": "Mage",
			"set": "Classic",
			"text": "Increased attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Scott Altmann",
			"attack": 0,
			"cardImage": "EX1_575.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "It is said that some shaman can say \"Floatin' totem\" 10 times, fast.",
			"fr": {
				"name": "Totem de vague de mana"
			},
			"health": 3,
			"id": "EX1_575",
			"name": "Mana Tide Totem",
			"playerClass": "Shaman",
			"race": "Totem",
			"rarity": "Rare",
			"set": "Classic",
			"text": "At the end of your turn, draw a card.",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"attack": 2,
			"cardImage": "EX1_616.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "They come out at night to eat leftover mana crystals. \"Mmmmmm,\" they say.",
			"fr": {
				"name": "Âme en peine de mana"
			},
			"health": 2,
			"id": "EX1_616",
			"mechanics": [
				"Aura"
			],
			"name": "Mana Wraith",
			"rarity": "Rare",
			"set": "Classic",
			"text": "ALL minions cost (1) more.",
			"type": "Minion"
		},
		{
			"artist": "Blizzard Cinematics",
			"attack": 1,
			"cardImage": "NEW1_012.png",
			"collectible": true,
			"cost": 1,
			"flavor": "These wyrms feed on arcane energies, and while they are generally considered a nuisance rather than a real threat, you really shouldn't leave them alone with a bucket of mana.",
			"fr": {
				"name": "Wyrm de mana"
			},
			"health": 3,
			"id": "NEW1_012",
			"inPlayText": "Gorging",
			"name": "Mana Wyrm",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Classic",
			"text": "Whenever you cast a spell, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_155b.png",
			"faction": "Neutral",
			"fr": {
				"name": "Marque de la nature"
			},
			"id": "EX1_155b",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "+4 Health and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Marque de la nature"
			},
			"id": "EX1_155ae",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "This minion has +4 Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_155a.png",
			"faction": "Neutral",
			"fr": {
				"name": "Marque de la nature"
			},
			"id": "EX1_155a",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "+4 Attack.",
			"type": "Spell"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_155.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Druids call it the \"Mark of Nature.\"  Everyone else calls it \"needing a bath.\"",
			"fr": {
				"name": "Marque de la nature"
			},
			"id": "EX1_155",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Choose One</b> - Give a minion +4 Attack; or +4 Health and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Marque de la nature"
			},
			"id": "EX1_155be",
			"name": "Mark of Nature",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "This minion has +4 Health and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Sean O'Daniels",
			"cardImage": "EX1_626.png",
			"collectible": true,
			"cost": 4,
			"flavor": "It dispels buffs, powers, hopes, and dreams.",
			"fr": {
				"name": "Dissipation de masse"
			},
			"id": "EX1_626",
			"mechanics": [
				"Silence"
			],
			"name": "Mass Dispel",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Silence</b> all enemy minions. Draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Ron Spencer",
			"attack": 4,
			"cardImage": "NEW1_014.png",
			"collectible": true,
			"cost": 4,
			"flavor": "She's actually a male tauren.  People don't call him \"Master of Disguise\" for nothing.",
			"fr": {
				"name": "Maîtresse du déguisement"
			},
			"health": 4,
			"id": "NEW1_014",
			"mechanics": [
				"Battlecry"
			],
			"name": "Master of Disguise",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Give a friendly minion <b>Stealth</b>.",
			"type": "Minion"
		},
		{
			"artist": "E.M. Gist",
			"attack": 1,
			"cardImage": "NEW1_037.png",
			"collectible": true,
			"cost": 2,
			"flavor": "He's currently trying to craft a \"flail-axe\", but all the other swordsmiths say it can't be done.",
			"fr": {
				"name": "Maître fabricant d’épées"
			},
			"health": 3,
			"id": "NEW1_037",
			"name": "Master Swordsmith",
			"rarity": "Rare",
			"set": "Classic",
			"text": "At the end of your turn, give another random friendly minion +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 4,
			"cardImage": "NEW1_029.png",
			"collectible": true,
			"cost": 2,
			"elite": true,
			"flavor": "\"I'm gonna light you up, sweetcheeks!\"",
			"fr": {
				"name": "Millhouse Tempête-de-Mana"
			},
			"health": 4,
			"id": "NEW1_029",
			"mechanics": [
				"Battlecry"
			],
			"name": "Millhouse Manastorm",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Enemy spells cost (0) next turn.",
			"type": "Minion"
		},
		{
			"artist": "Leo Che",
			"attack": 3,
			"cardImage": "EX1_085.png",
			"collectible": true,
			"cost": 3,
			"faction": "Alliance",
			"flavor": "Mind Control technology is getting better, but that's not saying much.",
			"fr": {
				"name": "Contrôleur mental"
			},
			"health": 3,
			"id": "EX1_085",
			"mechanics": [
				"Battlecry"
			],
			"name": "Mind Control Tech",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> If your opponent has 4 or more minions, take control of one at random.",
			"type": "Minion"
		},
		{
			"faction": "Neutral",
			"fr": {
				"name": "Contrôle mental"
			},
			"id": "EX1_tk31",
			"mechanics": [
				"Summoned"
			],
			"name": "Mind Controlling",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Classic",
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
			"set": "Classic",
			"text": "<b>Hero Power</b>\nDeal $3 damage.",
			"type": "Hero Power"
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
			"set": "Classic",
			"text": "<b>Hero Power</b>\nDeal $2 damage.",
			"type": "Hero Power"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_345.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Sometimes it feels like this is all a game.",
			"fr": {
				"name": "Jeux d’esprit"
			},
			"id": "EX1_345",
			"name": "Mindgames",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Put a copy of a random minion from your opponent's deck into the battlefield.",
			"type": "Spell"
		},
		{
			"artist": "Raven Mimura",
			"cardImage": "EX1_294.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "\"You go first.\" - Krush'gor the Behemoth, to his pet boar.",
			"fr": {
				"name": "Entité miroir"
			},
			"id": "EX1_294",
			"mechanics": [
				"Secret"
			],
			"name": "Mirror Entity",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Secret:</b> When your opponent plays a minion, summon a copy of it.",
			"type": "Spell"
		},
		{
			"artist": "Daren Bader",
			"cardImage": "EX1_533.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Sometimes it's as simple as putting on a fake mustache and pointing at someone else.",
			"fr": {
				"name": "Détournement"
			},
			"id": "EX1_533",
			"mechanics": [
				"Secret"
			],
			"name": "Misdirection",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Secret:</b> When a character attacks your hero, instead he attacks another random character.",
			"type": "Spell"
		},
		{
			"artist": "Cole Eastburn",
			"attack": 1,
			"cardImage": "EX1_396.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "All these guys ever do is talk about the Thunder King.   BOOOORRRINNG!",
			"fr": {
				"name": "Gardien mogu’shan"
			},
			"health": 7,
			"id": "EX1_396",
			"mechanics": [
				"Taunt"
			],
			"name": "Mogu'shan Warden",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 8,
			"cardImage": "EX1_620.png",
			"collectible": true,
			"cost": 20,
			"flavor": "He gets terrible heartburn.  BECAUSE HE IS FULL OF LAVA.",
			"fr": {
				"name": "Géant de lave"
			},
			"health": 8,
			"id": "EX1_620",
			"name": "Molten Giant",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Costs (1) less for each damage your hero has taken.",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_166a.png",
			"faction": "Neutral",
			"fr": {
				"name": "Éclat lunaire"
			},
			"id": "EX1_166a",
			"name": "Moonfire",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Deal 2 damage.",
			"type": "Spell"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_408.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "\"If you only use one ability, use Mortal Strike.\" - The Warrior Code, Line 6",
			"fr": {
				"name": "Frappe mortelle"
			},
			"id": "EX1_408",
			"name": "Mortal Strike",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Deal $4 damage. If you have 12 or less Health, deal $6 instead.",
			"type": "Spell"
		},
		{
			"artist": "Samwise",
			"attack": 8,
			"cardImage": "EX1_105.png",
			"collectible": true,
			"cost": 12,
			"faction": "Neutral",
			"flavor": "His mother said that he was just big boned.",
			"fr": {
				"name": "Géant des montagnes"
			},
			"health": 8,
			"id": "EX1_105",
			"name": "Mountain Giant",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Costs (1) less for each other card in your hand.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Mrgglaargl !"
			},
			"id": "EX1_507e",
			"name": "Mrgglaargl!",
			"set": "Classic",
			"text": "Murloc Warleader is granting +2/+1.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Mrghlglhal"
			},
			"id": "EX1_103e",
			"name": "Mrghlglhal",
			"set": "Classic",
			"text": "+2 Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 1,
			"cardImage": "EX1_509.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "This guy gets crazy strong at family reunions.",
			"fr": {
				"name": "Mande-flots murloc"
			},
			"health": 2,
			"id": "EX1_509",
			"name": "Murloc Tidecaller",
			"race": "Murloc",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Whenever a Murloc is summoned, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Tim McBurnie",
			"attack": 3,
			"cardImage": "EX1_507.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Do Murlocs ever get tired of making the same old sound?  Nope!  Mrglglrglglglglglglgl!",
			"fr": {
				"name": "Chef de guerre murloc"
			},
			"health": 3,
			"id": "EX1_507",
			"mechanics": [
				"Aura"
			],
			"name": "Murloc Warleader",
			"race": "Murloc",
			"rarity": "Epic",
			"set": "Classic",
			"text": "ALL other Murlocs have +2/+1.",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 0,
			"cardImage": "EX1_557.png",
			"collectible": true,
			"cost": 2,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Nat Pagle, Azeroth's premier fisherman!  He invented the Auto-Angler 3000, the Extendo-Pole 3000, and the Lure-o-matic 2099 (still in testing).",
			"fr": {
				"name": "Nat Pagle"
			},
			"health": 4,
			"id": "EX1_557",
			"inPlayText": "Fishing",
			"name": "Nat Pagle",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "At the start of your turn, you have a 50% chance to draw an extra card.",
			"type": "Minion"
		},
		{
			"artist": "Leo Che",
			"cardImage": "EX1_161.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Another one bites the dust.",
			"fr": {
				"name": "Acclimatation"
			},
			"id": "EX1_161",
			"name": "Naturalize",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Classic",
			"text": "Destroy a minion. Your opponent draws 2 cards.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Affûtage nécessaire"
			},
			"id": "EX1_411e2",
			"name": "Needs Sharpening",
			"playerClass": "Warrior",
			"set": "Classic",
			"text": "Decreased Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Cauchemar"
			},
			"id": "DREAM_05e",
			"name": "Nightmare",
			"set": "Classic",
			"text": "This minion has +5/+5, but will be destroyed soon.",
			"type": "Enchantment"
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
			"set": "Classic",
			"text": "Give a minion +5/+5. At the start of your next turn, destroy it.",
			"type": "Spell"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_130.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "We will always remember you, \"Defender!\"",
			"fr": {
				"name": "Noble sacrifice"
			},
			"id": "EX1_130",
			"mechanics": [
				"Secret"
			],
			"name": "Noble Sacrifice",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Secret:</b> When an enemy attacks, summon a 2/1 Defender as the new target.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_164a.png",
			"faction": "Neutral",
			"fr": {
				"name": "Nourrir"
			},
			"id": "EX1_164a",
			"name": "Nourish",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Gain 2 Mana Crystals.",
			"type": "Spell"
		},
		{
			"artist": "Terese Nielsen",
			"cardImage": "EX1_164.png",
			"collectible": true,
			"cost": 5,
			"faction": "Neutral",
			"flavor": "Druids take nourishment from many things: the power of nature, the songbird's chirp, a chocolate cake.",
			"fr": {
				"name": "Nourrir"
			},
			"id": "EX1_164",
			"name": "Nourish",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Choose One</b> - Gain 2 Mana Crystals; or Draw 3 cards.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_164b.png",
			"faction": "Neutral",
			"fr": {
				"name": "Nourrir"
			},
			"id": "EX1_164b",
			"name": "Nourish",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Draw 3 cards.",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"attack": 8,
			"cardImage": "EX1_560.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Time to write some flavor text.",
			"fr": {
				"name": "Nozdormu"
			},
			"health": 8,
			"id": "EX1_560",
			"inPlayText": "Aspect of Time",
			"name": "Nozdormu",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "Players only have 15 seconds to take their turns.",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 8,
			"cardImage": "EX1_562.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Onyxia long manipulated the Stormwind Court by disguising herself as Lady Katrana Prestor.   You would have thought that the giant wings and scales would have been a giveaway.",
			"fr": {
				"name": "Onyxia"
			},
			"health": 8,
			"id": "EX1_562",
			"mechanics": [
				"Battlecry"
			],
			"name": "Onyxia",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Summon 1/1 Whelps until your side of the battlefield is full.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Surcharge"
			},
			"id": "EX1_258e",
			"name": "Overloading",
			"playerClass": "Shaman",
			"set": "Classic",
			"text": "Increased stats.",
			"type": "Enchantment"
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
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Ben Olson",
			"attack": 1,
			"cardImage": "EX1_522.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "He’s not really that patient. It just takes a while for someone to walk by that he can actually reach.",
			"fr": {
				"name": "Assassin patient"
			},
			"health": 1,
			"id": "EX1_522",
			"inPlayText": "Sharpening",
			"mechanics": [
				"Poisonous",
				"Stealth"
			],
			"name": "Patient Assassin",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Stealth</b>. Destroy any minion damaged by this minion.",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"attack": 2,
			"cardImage": "EX1_133.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"faction": "Neutral",
			"flavor": "Perdition's Blade is Ragnaros's back-up weapon while Sulfuras is in the shop.",
			"fr": {
				"name": "Lame de la perdition"
			},
			"id": "EX1_133",
			"mechanics": [
				"Battlecry",
				"Combo"
			],
			"name": "Perdition's Blade",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Deal 1 damage. <b>Combo:</b> Deal 2 instead.",
			"type": "Weapon"
		},
		{
			"artist": "Ron Spears",
			"attack": 2,
			"cardImage": "EX1_076.png",
			"collectible": true,
			"cost": 2,
			"faction": "Alliance",
			"flavor": "She's quite jealous of the Gallon-Sized Summoner.",
			"fr": {
				"name": "Minuscule invocatrice"
			},
			"health": 2,
			"id": "EX1_076",
			"inPlayText": "Ritual",
			"mechanics": [
				"Aura"
			],
			"name": "Pint-Sized Summoner",
			"rarity": "Rare",
			"set": "Classic",
			"text": "The first minion you play each turn costs (1) less.",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 5,
			"cardImage": "EX1_313.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Mannoroth, Magtheridon, and Brutallus may be dead, but it turns out there are a LOT of pit lords.",
			"fr": {
				"name": "Seigneur des abîmes"
			},
			"health": 6,
			"id": "EX1_313",
			"mechanics": [
				"Battlecry"
			],
			"name": "Pit Lord",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Deal 5 damage to your hero.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Puissance du Kirin Tor"
			},
			"id": "EX1_612o",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Power of the Kirin Tor",
			"playerClass": "Mage",
			"set": "Classic",
			"text": "Your next Secret costs (0).",
			"type": "Enchantment"
		},
		{
			"artist": "Steve Tappin",
			"cardImage": "EX1_160.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Never look a panther in the eye.  Or is it 'Always look a panther in the eye'?  Well, it's one of those.",
			"fr": {
				"name": "Puissance du fauve"
			},
			"id": "EX1_160",
			"name": "Power of the Wild",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Choose One</b> - Give your minions +1/+1; or Summon a 3/2 Panther.",
			"type": "Spell"
		},
		{
			"artist": "Tom Baxa",
			"cardImage": "EX1_316.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "We cannot even describe how horrible the death is.  It's CRAZY bad!  Maybe worse than that.  Just don't do it.",
			"fr": {
				"name": "Puissance accablante"
			},
			"id": "EX1_316",
			"name": "Power Overwhelming",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Classic",
			"text": "Give a friendly minion +4/+4 until end of turn. Then, it dies. Horribly.",
			"type": "Spell"
		},
		{
			"faction": "Neutral",
			"fr": {
				"name": "Puissance accablante"
			},
			"id": "EX1_316e",
			"name": "Power Overwhelming",
			"playerClass": "Warlock",
			"set": "Classic",
			"text": "This minion has +4/+4, but will die a horrible death at the end of the turn.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Préparation"
			},
			"id": "EX1_145o",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Preparation",
			"playerClass": "Rogue",
			"set": "Classic",
			"text": "The next spell you cast this turn costs (3) less.",
			"type": "Enchantment"
		},
		{
			"artist": "Clint Langley",
			"cardImage": "EX1_145.png",
			"collectible": true,
			"cost": 0,
			"faction": "Neutral",
			"flavor": "\"Be Prepared\" - Rogue Motto",
			"fr": {
				"name": "Préparation"
			},
			"id": "EX1_145",
			"name": "Preparation",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Classic",
			"text": "The next spell you cast this turn costs (3) less.",
			"type": "Spell"
		},
		{
			"artist": "Dan Scott",
			"attack": 5,
			"cardImage": "EX1_583.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "If she threatens to \"moon\" you, it's not what you think.",
			"fr": {
				"name": "Prêtresse d’Élune"
			},
			"health": 4,
			"id": "EX1_583",
			"mechanics": [
				"Battlecry"
			],
			"name": "Priestess of Elune",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Restore 4 Health to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Wei Wang",
			"attack": 7,
			"cardImage": "EX1_350.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"faction": "Neutral",
			"flavor": "He's been exiled from his home, and all his brothers turned evil, but otherwise he doesn't have a lot to complain about.",
			"fr": {
				"name": "Prophète Velen"
			},
			"health": 7,
			"id": "EX1_350",
			"name": "Prophet Velen",
			"playerClass": "Priest",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "Double the damage and healing of your spells and Hero Power.",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "EX1_279.png",
			"collectible": true,
			"cost": 10,
			"faction": "Neutral",
			"flavor": "Take the time for an evil laugh after you draw this card.",
			"fr": {
				"name": "Explosion pyrotechnique"
			},
			"id": "EX1_279",
			"name": "Pyroblast",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Deal $10 damage.",
			"type": "Spell"
		},
		{
			"artist": "Attila Adorjany",
			"attack": 2,
			"cardImage": "EX1_044.png",
			"collectible": true,
			"cost": 3,
			"faction": "Alliance",
			"flavor": "\"Does anyone have some extra Boar Pelts?\"",
			"fr": {
				"name": "Aventurier en pleine quête"
			},
			"health": 2,
			"id": "EX1_044",
			"inPlayText": "Questing",
			"name": "Questing Adventurer",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Whenever you play a card, gain +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_412.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "If he's raging now, just wait until he gets nerfed.",
			"fr": {
				"name": "Worgen déchaîné"
			},
			"health": 3,
			"id": "EX1_412",
			"mechanics": [
				"Enrage"
			],
			"name": "Raging Worgen",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Enrage:</b> <b>Windfury</b> and +1 Attack",
			"type": "Minion"
		},
		{
			"artist": "Greg Staples",
			"attack": 8,
			"cardImage": "EX1_298.png",
			"collectible": true,
			"cost": 8,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Ragnaros was summoned by the Dark Iron dwarves, who were eventually enslaved by the Firelord.  Summoning Ragnaros often doesn’t work out the way you want it to.",
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 8,
			"id": "EX1_298",
			"name": "Ragnaros the Firelord",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "Can't attack. At the end of your turn, deal 8 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"cardImage": "CS2_104.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Minion get ANGRY.   Minion SMASH!",
			"fr": {
				"name": "Saccager"
			},
			"id": "CS2_104",
			"name": "Rampage",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Classic",
			"text": "Give a damaged minion +3/+3.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Saccager"
			},
			"id": "CS2_104e",
			"name": "Rampage",
			"playerClass": "Warrior",
			"set": "Classic",
			"text": "+3/+3.",
			"type": "Enchantment"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 7,
			"cardImage": "CS2_161.png",
			"collectible": true,
			"cost": 7,
			"faction": "Alliance",
			"flavor": "Just mail him a package with a name and 10,000 gold.  He'll take care of the rest.",
			"fr": {
				"name": "Assassin de Ravenholdt"
			},
			"health": 5,
			"id": "CS2_161",
			"mechanics": [
				"Stealth"
			],
			"name": "Ravenholdt Assassin",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Puissance brute !"
			},
			"id": "EX1_274e",
			"name": "Raw Power!",
			"playerClass": "Mage",
			"set": "Classic",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Ittoku",
			"cardImage": "EX1_136.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "I am not sure how you get demptioned the first time.  It’s a mystery!",
			"fr": {
				"name": "Rédemption"
			},
			"id": "EX1_136",
			"mechanics": [
				"Secret"
			],
			"name": "Redemption",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Secret:</b> When one of your minions dies, return it to life with 1 Health.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Repentir"
			},
			"id": "EX1_379e",
			"name": "Repentance",
			"playerClass": "Paladin",
			"set": "Classic",
			"text": "Health reduced to 1.",
			"type": "Enchantment"
		},
		{
			"artist": "Gonzalo Ordonez",
			"cardImage": "EX1_379.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Repentance often comes in the moment before obliteration. Curious.",
			"fr": {
				"name": "Repentir"
			},
			"id": "EX1_379",
			"mechanics": [
				"Secret"
			],
			"name": "Repentance",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Secret:</b> When your opponent plays a minion, reduce its Health to 1.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_178a.png",
			"faction": "Neutral",
			"fr": {
				"name": "Enraciner"
			},
			"id": "EX1_178a",
			"name": "Rooted",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "+5 Health and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Enraciné"
			},
			"id": "EX1_178ae",
			"name": "Rooted",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "+5 Health and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Dave Rapoza",
			"cardImage": "EX1_578.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "It is true that some druids are savage, but others still enjoy a quiet moment and a spot of tea.",
			"fr": {
				"name": "Sauvagerie"
			},
			"id": "EX1_578",
			"mechanics": [
				"AffectedBySpellPower"
			],
			"name": "Savagery",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Deal damage equal to your hero's Attack to a minion.",
			"type": "Spell"
		},
		{
			"artist": "Milivoj Ceran",
			"attack": 6,
			"cardImage": "EX1_534.png",
			"collectible": true,
			"cost": 6,
			"flavor": "In the jungle, the mighty jungle, the lion gets slowly consumed by hyenas.",
			"fr": {
				"name": "Grande crinière des savanes"
			},
			"health": 5,
			"id": "EX1_534",
			"inPlayText": "Master",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Savannah Highmane",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Deathrattle:</b> Summon two 2/2 Hyenas.",
			"type": "Minion"
		},
		{
			"artist": "Gonzalo Ordonez",
			"attack": 3,
			"cardImage": "EX1_020.png",
			"collectible": true,
			"cost": 3,
			"faction": "Alliance",
			"flavor": "Never wash your whites with a Scarlet Crusader.",
			"fr": {
				"name": "Croisée écarlate"
			},
			"health": 1,
			"id": "EX1_020",
			"mechanics": [
				"Divine Shield"
			],
			"name": "Scarlet Crusader",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "EX1_531.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Hyenas prefer the bones of kodos or windserpents, but they'll eat pretty much anything.  Even Brussels sprouts.",
			"fr": {
				"name": "Hyène charognarde"
			},
			"health": 2,
			"id": "EX1_531",
			"inPlayText": "Scavenging",
			"name": "Scavenging Hyena",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"text": "Whenever a friendly Beast dies, gain +2/+1.",
			"type": "Minion"
		},
		{
			"artist": "Svetlin Velinov",
			"attack": 8,
			"cardImage": "EX1_586.png",
			"collectible": true,
			"cost": 10,
			"faction": "Neutral",
			"flavor": "See?  Giant.",
			"fr": {
				"name": "Géant des mers"
			},
			"health": 8,
			"id": "EX1_586",
			"name": "Sea Giant",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Costs (1) less for each other minion on the battlefield.",
			"type": "Minion"
		},
		{
			"artist": "Gonzalo Ordonez",
			"attack": 1,
			"cardImage": "EX1_080.png",
			"collectible": true,
			"cost": 1,
			"faction": "Alliance",
			"flavor": "She promises not to tell anyone about that thing you did last night with that one person.",
			"fr": {
				"name": "Gardienne des secrets"
			},
			"health": 2,
			"id": "EX1_080",
			"name": "Secretkeeper",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Whenever a <b>Secret</b> is played, gain +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Raven Mimura",
			"cardImage": "EX1_317.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Generally demons are pretty obvious and you don’t need a spell to sense them.",
			"fr": {
				"name": "Détection des démons"
			},
			"id": "EX1_317",
			"name": "Sense Demons",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Classic",
			"text": "Put 2 random Demons from your deck into your hand.",
			"type": "Spell"
		},
		{
			"artist": "Mark Gibbons",
			"cardImage": "EX1_334.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "You can rationalize it all you want, it's still a mean thing to do.",
			"fr": {
				"name": "Folie de l’ombre"
			},
			"id": "EX1_334",
			"name": "Shadow Madness",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Gain control of an enemy minion with 3 or less Attack until end of turn.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Folie de l’ombre"
			},
			"id": "EX1_334e",
			"name": "Shadow Madness",
			"playerClass": "Priest",
			"set": "Classic",
			"text": "This minion has switched controllers this turn.",
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
			"set": "Classic",
			"text": "Mindgames whiffed! Your opponent had no minions!",
			"type": "Minion"
		},
		{
			"artist": "Dave Kendall",
			"cardImage": "EX1_303.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Start with a powerful minion and stir in Shadowflame and you have a good time!",
			"fr": {
				"name": "Ombreflamme"
			},
			"id": "EX1_303",
			"mechanics": [
				"AffectedBySpellPower"
			],
			"name": "Shadowflame",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Destroy a friendly minion and deal its Attack damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "EX1_625.png",
			"collectible": true,
			"cost": 3,
			"flavor": "If a bright light shines on a priest in Shadowform… do they cast a shadow?",
			"fr": {
				"name": "Forme d’Ombre"
			},
			"id": "EX1_625",
			"name": "Shadowform",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Your Hero Power becomes 'Deal 2 damage'. If already in Shadowform: 3 damage.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Ombres de M’uru"
			},
			"id": "EX1_590e",
			"name": "Shadows of M'uru",
			"rarity": "Common",
			"set": "Classic",
			"text": "This minion has consumed Divine Shields and has increased Attack and Health.",
			"type": "Enchantment"
		},
		{
			"artist": "Graven Tung",
			"cardImage": "EX1_144.png",
			"collectible": true,
			"cost": 0,
			"faction": "Neutral",
			"flavor": "Rogue dance troops will sometimes Shadowstep away at the end of a performance.  Crowds love it.",
			"fr": {
				"name": "Pas de l’ombre"
			},
			"id": "EX1_144",
			"name": "Shadowstep",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Classic",
			"text": "Return a friendly minion to your hand. It costs (2) less.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_573b.png",
			"faction": "Neutral",
			"fr": {
				"name": "Leçon de Shan’do"
			},
			"id": "EX1_573b",
			"name": "Shan'do's Lesson",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Summon two 2/2 Treants with <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Ça pique !"
			},
			"id": "CS2_221e",
			"name": "Sharp!",
			"set": "Classic",
			"text": "+2 Attack from Spiteful Smith.",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_410.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "\"What is a better weapon? The sharp one your enemies expect, or the blunt one they ignore?\" - The Art of Warrior, Chapter 9",
			"fr": {
				"name": "Heurt de bouclier"
			},
			"id": "EX1_410",
			"mechanics": [
				"AffectedBySpellPower"
			],
			"name": "Shield Slam",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Deal 1 damage to a minion for each Armor you have.",
			"type": "Spell"
		},
		{
			"artist": "Carl Critchlow",
			"attack": 0,
			"cardImage": "EX1_405.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Have you seen the size of the shields in this game??  This is no easy job.",
			"fr": {
				"name": "Porte-bouclier"
			},
			"health": 4,
			"id": "EX1_405",
			"mechanics": [
				"Taunt"
			],
			"name": "Shieldbearer",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Chris Moeller",
			"attack": 3,
			"cardImage": "EX1_134.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "The agents of SI:7 are responsible for Stormwind's covert activities.  Their duties include espionage, assassination, and throwing surprise birthday parties for the royal family.",
			"fr": {
				"name": "Agent du SI:7"
			},
			"health": 3,
			"id": "EX1_134",
			"mechanics": [
				"Combo"
			],
			"name": "SI:7 Agent",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Combo:</b> Deal 2 damage.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "EX1_332.png",
			"collectible": true,
			"cost": 0,
			"faction": "Neutral",
			"flavor": "Reserved for enemy spellcasters, evil liches from beyond the grave, and karaoke nights at the Grim Guzzler.",
			"fr": {
				"name": "Silence"
			},
			"id": "EX1_332",
			"mechanics": [
				"Silence"
			],
			"name": "Silence",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Silence</b> a minion.",
			"type": "Spell"
		},
		{
			"artist": "Matt Starbuck",
			"attack": 4,
			"cardImage": "CS2_151.png",
			"collectible": true,
			"cost": 5,
			"faction": "Alliance",
			"flavor": "It's good to be a knight.   Less so to be one's squire.",
			"fr": {
				"name": "Champion de la Main d’argent"
			},
			"health": 4,
			"id": "CS2_151",
			"mechanics": [
				"Battlecry"
			],
			"name": "Silver Hand Knight",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Summon a 2/2 Squire.",
			"type": "Minion"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 3,
			"cardImage": "EX1_023.png",
			"collectible": true,
			"cost": 4,
			"faction": "Horde",
			"flavor": "The first time they tried to guard Silvermoon against the scourge, it didn’t go so well…",
			"fr": {
				"name": "Garde de Lune-d’argent"
			},
			"health": 3,
			"id": "EX1_023",
			"mechanics": [
				"Divine Shield"
			],
			"name": "Silvermoon Guardian",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"cardImage": "EX1_309.png",
			"collectible": true,
			"cost": 6,
			"faction": "Neutral",
			"flavor": "You probably should avoid siphoning your own soul.  You might create some kind of weird infinite loop.",
			"fr": {
				"name": "Siphonner l’âme"
			},
			"id": "EX1_309",
			"name": "Siphon Soul",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Destroy a minion. Restore #3 Health to your hero.",
			"type": "Spell"
		},
		{
			"artist": "E.M. Gist",
			"cardImage": "EX1_391.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "\"Dun da dun, dun da dun\": if you've heard an ogre sing this, it's too late.",
			"fr": {
				"name": "Heurtoir"
			},
			"id": "EX1_391",
			"name": "Slam",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Classic",
			"text": "Deal $2 damage to a minion. If it survives, draw a card.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "EX1_554t.png",
			"cost": 0,
			"faction": "Neutral",
			"fr": {
				"name": "Serpent"
			},
			"health": 1,
			"id": "EX1_554t",
			"name": "Snake",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Bernie Kang",
			"cardImage": "EX1_554.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Why did it have to be snakes?",
			"fr": {
				"name": "Piège à serpents"
			},
			"id": "EX1_554",
			"mechanics": [
				"Secret"
			],
			"name": "Snake Trap",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Secret:</b> When one of your minions is attacked, summon three 1/1 Snakes.",
			"type": "Spell"
		},
		{
			"artist": "Lorenzo Minaca",
			"cardImage": "EX1_609.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "A great sniper hits the spot.  Just like a delicious flank of boar. Mmmmm.",
			"fr": {
				"name": "Tir de précision"
			},
			"id": "EX1_609",
			"mechanics": [
				"Secret"
			],
			"name": "Snipe",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Secret:</b> When your opponent plays a minion, deal $4 damage to it.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "EX1_608.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "Apprentices are great for bossing around.  \"Conjure me some mana buns! And a coffee!  Make that a mana coffee!\"",
			"fr": {
				"name": "Apprentie du sorcier"
			},
			"health": 2,
			"id": "EX1_608",
			"mechanics": [
				"Aura"
			],
			"name": "Sorcerer's Apprentice",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Classic",
			"text": "Your spells cost (1) less.",
			"type": "Minion"
		},
		{
			"artist": "Markus Erdt",
			"cardImage": "EX1_158.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "\"Reforestation\" is suddenly a terrifying word.",
			"fr": {
				"name": "Âme de la forêt"
			},
			"id": "EX1_158",
			"name": "Soul of the Forest",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Classic",
			"text": "Give your minions \"<b>Deathrattle:</b> Summon a 2/2 Treant.\"",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Âme de la forêt"
			},
			"id": "EX1_158e",
			"name": "Soul of the Forest",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Deathrattle: Summon a 2/2 Treant.",
			"type": "Enchantment"
		},
		{
			"artist": "Ken Steacy",
			"attack": 3,
			"cardImage": "NEW1_027.png",
			"collectible": true,
			"cost": 3,
			"flavor": "When he saves enough plunder, he's going to commission an enormous captain's hat.  He has hat envy.",
			"fr": {
				"name": "Capitaine des mers du Sud"
			},
			"health": 3,
			"id": "NEW1_027",
			"mechanics": [
				"Aura"
			],
			"name": "Southsea Captain",
			"race": "Pirate",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Your other Pirates have +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Dan Brereton",
			"attack": 2,
			"cardImage": "CS2_146.png",
			"collectible": true,
			"cost": 1,
			"faction": "Alliance",
			"flavor": "Pirates are into this new fad called \"Planking\".",
			"fr": {
				"name": "Matelot des mers du Sud"
			},
			"health": 1,
			"id": "CS2_146",
			"name": "Southsea Deckhand",
			"race": "Pirate",
			"rarity": "Common",
			"set": "Classic",
			"text": "Has <b>Charge</b> while you have a weapon equipped.",
			"type": "Minion"
		},
		{
			"artist": "Gonzalo Ordonez",
			"cardImage": "tt_010.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "While it's fun to intercept enemy lightning bolts, a spellbender much prefers to intercept opposing Marks of the Wild.  It just feels meaner.  And blood elves... well, they're a little mean.",
			"fr": {
				"name": "Courbe-sort"
			},
			"id": "tt_010",
			"mechanics": [
				"Secret"
			],
			"name": "Spellbender",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Classic",
			"text": "<b>Secret:</b> When an enemy casts a spell on a minion, summon a 1/3 as the new target.",
			"type": "Spell"
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
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Matt Cavotta",
			"attack": 4,
			"cardImage": "EX1_048.png",
			"collectible": true,
			"cost": 4,
			"faction": "Horde",
			"flavor": "Spellbreakers can rip enchantments from magic-wielders.  The process is painless and can be performed on an outpatient basis.",
			"fr": {
				"name": "Brise-sort"
			},
			"health": 3,
			"id": "EX1_048",
			"mechanics": [
				"Battlecry"
			],
			"name": "Spellbreaker",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> <b>Silence</b> a minion.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "EX1_tk11.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Esprit du loup"
			},
			"health": 3,
			"id": "EX1_tk11",
			"mechanics": [
				"Taunt"
			],
			"name": "Spirit Wolf",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Justin Sweet",
			"attack": 4,
			"cardImage": "CS2_221.png",
			"collectible": true,
			"cost": 5,
			"faction": "Horde",
			"flavor": "She'll craft you a sword, but you'll need to bring her 5 Steel Ingots, 3 Motes of Earth, and the scalp of her last customer.",
			"fr": {
				"name": "Forgeron malveillant"
			},
			"health": 6,
			"id": "CS2_221",
			"inPlayText": "Summoning",
			"mechanics": [
				"Enrage"
			],
			"name": "Spiteful Smith",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Enrage:</b> Your weapon has +2 Attack.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CS2_152.png",
			"cost": 1,
			"faction": "Alliance",
			"fr": {
				"name": "Écuyer"
			},
			"health": 2,
			"id": "CS2_152",
			"name": "Squire",
			"rarity": "Common",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "EX1_tk28.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Écureuil"
			},
			"health": 1,
			"id": "EX1_tk28",
			"name": "Squirrel",
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"attack": 3,
			"cardImage": "NEW1_041.png",
			"collectible": true,
			"cost": 5,
			"flavor": "This Kodo is so big that he can stampede by <i>himself</i>.",
			"fr": {
				"name": "Kodo déchaîné"
			},
			"health": 5,
			"id": "NEW1_041",
			"mechanics": [
				"Battlecry"
			],
			"name": "Stampeding Kodo",
			"race": "Beast",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Destroy a random enemy minion with 2 or less Attack.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Du calme !"
			},
			"id": "EX1_382e",
			"name": "Stand Down!",
			"playerClass": "Paladin",
			"set": "Classic",
			"text": "Attack changed to 1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NEW1_007b.png",
			"fr": {
				"name": "Météores"
			},
			"id": "NEW1_007b",
			"name": "Starfall",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Deal $5 damage to a minion.",
			"type": "Spell"
		},
		{
			"cardImage": "NEW1_007a.png",
			"fr": {
				"name": "Météores"
			},
			"id": "NEW1_007a",
			"name": "Starfall",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Deal $2 damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "NEW1_007.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Is the sky falling?  Yes.  Yes it is.",
			"fr": {
				"name": "Météores"
			},
			"id": "NEW1_007",
			"name": "Starfall",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Choose One -</b> Deal $5 damage to a minion; or $2 damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"artist": "Nate Bowden",
			"attack": 2,
			"cardImage": "EX1_247.png",
			"collectible": true,
			"cost": 2,
			"durability": 3,
			"faction": "Neutral",
			"flavor": "Yo, that's a nice axe.",
			"fr": {
				"name": "Hache de Forge-foudre"
			},
			"id": "EX1_247",
			"mechanics": [
				"Overload"
			],
			"name": "Stormforged Axe",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Overload:</b> (1)",
			"type": "Weapon"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "EX1_028.png",
			"collectible": true,
			"cost": 5,
			"faction": "Alliance",
			"flavor": "The wonderful thing about tigers is tigers are wonderful things!",
			"fr": {
				"name": "Tigre de Strangleronce"
			},
			"health": 5,
			"id": "EX1_028",
			"mechanics": [
				"Stealth"
			],
			"name": "Stranglethorn Tiger",
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Force de la meute"
			},
			"id": "EX1_162o",
			"name": "Strength of the Pack",
			"set": "Classic",
			"text": "Dire Wolf Alpha is granting +1 Attack to this minion.",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_160a.png",
			"faction": "Neutral",
			"fr": {
				"name": "Invocation de panthère"
			},
			"id": "EX1_160a",
			"name": "Summon a Panther",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Summon a 3/2 Panther.",
			"type": "Spell"
		},
		{
			"artist": "Tyler Walpole",
			"attack": 0,
			"cardImage": "EX1_315.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "NOT LESS THAN 1!  Don't get any ideas!",
			"fr": {
				"name": "Portail d’invocation"
			},
			"health": 4,
			"id": "EX1_315",
			"inPlayText": "Summoning",
			"mechanics": [
				"Aura"
			],
			"name": "Summoning Portal",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Classic",
			"text": "Your minions cost (2) less, but not less than (1).",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 2,
			"cardImage": "EX1_058.png",
			"collectible": true,
			"cost": 2,
			"faction": "Alliance",
			"flavor": "She carries a shield, but only so she can give it to someone she can stand behind.",
			"fr": {
				"name": "Protectrice solfurie"
			},
			"health": 3,
			"id": "EX1_058",
			"mechanics": [
				"Battlecry"
			],
			"name": "Sunfury Protector",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Give adjacent minions <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Andrea Uderzo",
			"attack": 4,
			"cardImage": "EX1_032.png",
			"collectible": true,
			"cost": 6,
			"faction": "Alliance",
			"flavor": "She doesn’t ACTUALLY walk on the Sun.  It's just a name.  Don’t worry!",
			"fr": {
				"name": "Marche-soleil"
			},
			"health": 5,
			"id": "EX1_032",
			"mechanics": [
				"Divine Shield",
				"Taunt"
			],
			"name": "Sunwalker",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Taunt</b>\n<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Efrem Palacios",
			"attack": 1,
			"cardImage": "EX1_366.png",
			"collectible": true,
			"cost": 3,
			"durability": 5,
			"faction": "Neutral",
			"flavor": "I dub you Sir Loin of Beef!",
			"fr": {
				"name": "Épée de justice"
			},
			"id": "EX1_366",
			"name": "Sword of Justice",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Whenever you summon a minion, give it +1/+1 and this loses 1 Durability.",
			"type": "Weapon"
		},
		{
			"artist": "Glenn Rane",
			"attack": 5,
			"cardImage": "EX1_016.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "Sylvanas was turned into the Banshee Queen by Arthas, but he probably should have just killed her because it just pissed her off.",
			"fr": {
				"name": "Sylvanas Coursevent"
			},
			"health": 5,
			"id": "EX1_016",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Sylvanas Windrunner",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Deathrattle:</b> Take control of a random enemy minion.",
			"type": "Minion"
		},
		{
			"artist": "Paul Warzecha",
			"attack": 2,
			"cardImage": "EX1_390.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Tauren Warrior: Champion of Mulgore, Slayer of Quilboar, Rider of Thunderbluff Elevators.",
			"fr": {
				"name": "Guerrier tauren"
			},
			"health": 3,
			"id": "EX1_390",
			"mechanics": [
				"Enrage",
				"Taunt"
			],
			"name": "Tauren Warrior",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Taunt</b>. <b>Enrage:</b> +3 Attack",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Enseignements du Kirin Tor"
			},
			"id": "EX1_584e",
			"name": "Teachings of the Kirin Tor",
			"set": "Classic",
			"text": "<b>Spell Damage +1</b>.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Acier trempé"
			},
			"id": "EX1_046e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Tempered",
			"set": "Classic",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Daren Bader",
			"attack": 6,
			"cardImage": "EX1_623.png",
			"collectible": true,
			"cost": 6,
			"flavor": "He also moonlights Thursday nights as a bouncer at the Pig and Whistle Tavern.",
			"fr": {
				"name": "Massacreur du temple"
			},
			"health": 6,
			"id": "EX1_623",
			"mechanics": [
				"Battlecry"
			],
			"name": "Temple Enforcer",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Give a friendly minion +3 Health.",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 9,
			"cardImage": "EX1_577.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"faction": "Neutral",
			"flavor": "He lives in Blackrock Mountain.  He eats Gnomes.  That's pretty much it.",
			"fr": {
				"name": "La Bête"
			},
			"health": 7,
			"id": "EX1_577",
			"mechanics": [
				"Deathrattle"
			],
			"name": "The Beast",
			"race": "Beast",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Deathrattle:</b> Summon a 3/3 Finkle Einhorn for your opponent.",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 4,
			"cardImage": "EX1_002.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "He was sent by the Lich King to disrupt the Argent Tournament.   We can pretty much mark that a failure.",
			"fr": {
				"name": "Le Chevalier noir"
			},
			"health": 5,
			"id": "EX1_002",
			"mechanics": [
				"Battlecry"
			],
			"name": "The Black Knight",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Destroy an enemy minion with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "EX1_339.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "\"What do you get when you cast Thoughtsteal on an Orc?  Nothing!\" - Tauren joke",
			"fr": {
				"name": "Vol d’esprit"
			},
			"id": "EX1_339",
			"name": "Thoughtsteal",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Classic",
			"text": "Copy 2 cards from your opponent's deck and put them into your hand.",
			"type": "Spell"
		},
		{
			"artist": "Efrem Palacios",
			"attack": 2,
			"cardImage": "EX1_021.png",
			"collectible": true,
			"cost": 3,
			"faction": "Horde",
			"flavor": "He's stationed in the Hellfire Peninsula, but he's hoping for a reassignment closer to Orgrimmar, or really anywhere the ground is less on fire.",
			"fr": {
				"name": "Long-voyant de Thrallmar"
			},
			"health": 3,
			"id": "EX1_021",
			"mechanics": [
				"Windfury"
			],
			"name": "Thrallmar Farseer",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"artist": "Tom Baxa",
			"attack": 3,
			"cardImage": "EX1_083.png",
			"collectible": true,
			"cost": 3,
			"elite": true,
			"faction": "Alliance",
			"flavor": "Tinkmaster Overspark nearly lost his Tinker's license after the Great Ironforge Squirrel Stampede of '09.",
			"fr": {
				"name": "Suprétincelle"
			},
			"health": 3,
			"id": "EX1_083",
			"mechanics": [
				"Battlecry"
			],
			"name": "Tinkmaster Overspark",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Transform another random minion into a 5/5 Devilsaur or a 1/1 Squirrel.",
			"type": "Minion"
		},
		{
			"artist": "Brom",
			"attack": 6,
			"cardImage": "EX1_383.png",
			"collectible": true,
			"cost": 8,
			"elite": true,
			"faction": "Neutral",
			"flavor": "If you haven't heard the Tirion Fordring theme song, it's because it doesn't exist.",
			"fr": {
				"name": "Tirion Fordring"
			},
			"health": 6,
			"id": "EX1_383",
			"mechanics": [
				"Deathrattle",
				"Divine Shield",
				"Taunt"
			],
			"name": "Tirion Fordring",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "<b>Divine Shield</b>. <b>Taunt</b>. <b>Deathrattle:</b> Equip a 5/3 Ashbringer.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Pris au piège"
			},
			"id": "EX1_611e",
			"name": "Trapped",
			"playerClass": "Hunter",
			"set": "Classic",
			"text": "Will be <b>Frozen</b> again at the start of the next turn.",
			"type": "Enchantment"
		},
		{
			"attack": 2,
			"cardImage": "EX1_158t.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Tréant"
			},
			"health": 2,
			"id": "EX1_158t",
			"name": "Treant",
			"playerClass": "Druid",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "EX1_tk9.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Tréant"
			},
			"health": 2,
			"id": "EX1_tk9",
			"mechanics": [
				"Charge"
			],
			"name": "Treant",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Charge</b>.  At the end of the turn, destroy this minion.",
			"type": "Minion"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Treant",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Obnubilé par les trésors"
			},
			"id": "NEW1_018e",
			"name": "Treasure Crazed",
			"set": "Classic",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 4,
			"cardImage": "EX1_043.png",
			"collectible": true,
			"cost": 4,
			"faction": "Neutral",
			"flavor": "Twilight drakes feed on Mystical Energy.  And Tacos.",
			"fr": {
				"name": "Drake du Crépuscule"
			},
			"health": 1,
			"id": "EX1_043",
			"mechanics": [
				"Battlecry"
			],
			"name": "Twilight Drake",
			"race": "Dragon",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Gain +1 Health for each card in your hand.",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "EX1_312.png",
			"collectible": true,
			"cost": 8,
			"faction": "Neutral",
			"flavor": "The Twisting Nether is a formless place of magic and illusion and destroyed minions.",
			"fr": {
				"name": "Néant distordu"
			},
			"id": "EX1_312",
			"name": "Twisting Nether",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Classic",
			"text": "Destroy all minions.",
			"type": "Spell"
		},
		{
			"artist": "Matt Gaser",
			"attack": 2,
			"cardImage": "EX1_258.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Unlike bound elementals, Unbound ones really enjoy a night on the town.",
			"fr": {
				"name": "Élémentaire délié"
			},
			"health": 4,
			"id": "EX1_258",
			"name": "Unbound Elemental",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Classic",
			"text": "Whenever you play a card with <b>Overload</b>, gain +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Linggar Bramanty",
			"cardImage": "EX1_538.png",
			"collectible": true,
			"cost": 3,
			"flavor": "You must read the name of this card out loud each time you play it.",
			"fr": {
				"name": "Lâcher les chiens"
			},
			"id": "EX1_538",
			"name": "Unleash the Hounds",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Classic",
			"text": "For each enemy minion, summon a 1/1 Hound with <b>Charge</b>.",
			"type": "Spell"
		},
		{
			"artist": "Matt Cavotta",
			"cardImage": "EX1_409.png",
			"collectible": true,
			"cost": 1,
			"faction": "Neutral",
			"flavor": "Easily worth 50 DKP.",
			"fr": {
				"name": "Amélioration !"
			},
			"id": "EX1_409",
			"name": "Upgrade!",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Classic",
			"text": "If you have a weapon, give it +1/+1. Otherwise equip a 1/3 weapon.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Amélioration"
			},
			"id": "EX1_536e",
			"name": "Upgraded",
			"playerClass": "Hunter",
			"set": "Classic",
			"text": "Increased Durability.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Améliorée"
			},
			"id": "EX1_409e",
			"name": "Upgraded",
			"playerClass": "Warrior",
			"set": "Classic",
			"text": "+1 Attack and +1 Durability.",
			"type": "Enchantment"
		},
		{
			"cardImage": "EX1_178b.png",
			"faction": "Neutral",
			"fr": {
				"name": "Déraciner"
			},
			"id": "EX1_178b",
			"name": "Uproot",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "+5 Attack.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Déraciné"
			},
			"id": "EX1_178be",
			"name": "Uprooted",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "+5 Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Vengeance de VanCleef"
			},
			"id": "EX1_613e",
			"name": "VanCleef's Vengeance",
			"playerClass": "Rogue",
			"set": "Classic",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_594.png",
			"collectible": true,
			"cost": 3,
			"faction": "Neutral",
			"flavor": "Rumor has it that Deathwing brought about the Cataclysm after losing a game to this card.  We may never know the truth.",
			"fr": {
				"name": "Vaporisation"
			},
			"id": "EX1_594",
			"mechanics": [
				"Secret"
			],
			"name": "Vaporize",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Secret:</b> When a minion attacks your hero, destroy it.",
			"type": "Spell"
		},
		{
			"artist": "John Polidora",
			"attack": 7,
			"cardImage": "CS2_227.png",
			"collectible": true,
			"cost": 5,
			"faction": "Horde",
			"flavor": "No Job is too big.  No fee is too big.",
			"fr": {
				"name": "Nervi de la KapitalRisk"
			},
			"health": 6,
			"id": "CS2_227",
			"mechanics": [
				"Aura"
			],
			"name": "Venture Co. Mercenary",
			"rarity": "Common",
			"set": "Classic",
			"text": "Your minions cost (3) more.",
			"type": "Minion"
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
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 3,
			"cardImage": "NEW1_026.png",
			"collectible": true,
			"cost": 4,
			"flavor": "If you don't pay attention, you may be turned into a pig.  And then you get your name on the board.",
			"fr": {
				"name": "Enseignante pourpre"
			},
			"health": 5,
			"id": "NEW1_026",
			"name": "Violet Teacher",
			"rarity": "Rare",
			"set": "Classic",
			"text": "Whenever you cast a spell, summon a 1/1 Violet Apprentice.",
			"type": "Minion"
		},
		{
			"artist": "Alexander Alexandrov",
			"attack": 3,
			"cardImage": "EX1_304.png",
			"collectible": true,
			"cost": 3,
			"flavor": "If you put this into your deck, you WILL lose the trust of your other minions.",
			"fr": {
				"name": "Terreur du Vide"
			},
			"health": 3,
			"id": "EX1_304",
			"mechanics": [
				"Battlecry"
			],
			"name": "Void Terror",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Rare",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Destroy the minions on either side of this minion and gain their Attack and Health.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Garde rapprochée"
			},
			"id": "EX1_001e",
			"name": "Warded",
			"set": "Classic",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Bien nourri"
			},
			"id": "EX1_531e",
			"name": "Well Fed",
			"playerClass": "Hunter",
			"set": "Classic",
			"text": "Increased Attack and Health.",
			"type": "Enchantment"
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
			"race": "Dragon",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "ds1_whelptoken.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Dragonnet"
			},
			"health": 1,
			"id": "ds1_whelptoken",
			"name": "Whelp",
			"race": "Dragon",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Coup de fouet motivant"
			},
			"id": "EX1_603e",
			"name": "Whipped Into Shape",
			"playerClass": "Warrior",
			"set": "Classic",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 3,
			"cardImage": "NEW1_020.png",
			"collectible": true,
			"cost": 2,
			"flavor": "BOOM BABY BOOM!  BAD IS GOOD!  DOWN WITH GOVERNMENT!",
			"fr": {
				"name": "Pyromancien sauvage"
			},
			"health": 2,
			"id": "NEW1_020",
			"name": "Wild Pyromancer",
			"rarity": "Rare",
			"set": "Classic",
			"text": "After you cast a spell, deal 1 damage to ALL minions.",
			"type": "Minion"
		},
		{
			"artist": "Luke Mancini",
			"attack": 4,
			"cardImage": "EX1_033.png",
			"collectible": true,
			"cost": 6,
			"faction": "Alliance",
			"flavor": "Harpies are not pleasant sounding.  That's the nicest I can put it.",
			"fr": {
				"name": "Harpie Furie-des-vents"
			},
			"health": 5,
			"id": "EX1_033",
			"mechanics": [
				"Windfury"
			],
			"name": "Windfury Harpy",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"artist": "Malcolm Davis",
			"attack": 1,
			"cardImage": "CS2_231.png",
			"collectible": true,
			"cost": 0,
			"faction": "Neutral",
			"flavor": "If you hit an Eredar Lord with enough Wisps, it will explode.   But why?",
			"fr": {
				"name": "Feu follet"
			},
			"health": 1,
			"id": "CS2_231",
			"name": "Wisp",
			"rarity": "Common",
			"set": "Classic",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 2,
			"cardImage": "EX1_010.png",
			"collectible": true,
			"cost": 1,
			"faction": "Alliance",
			"flavor": "If you want to stop a worgen from infiltrating, just yell, \"No! Bad boy!\"",
			"fr": {
				"name": "Infiltrateur worgen"
			},
			"health": 1,
			"id": "EX1_010",
			"mechanics": [
				"Stealth"
			],
			"name": "Worgen Infiltrator",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Stealth</b>",
			"type": "Minion"
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
			"race": "Demon",
			"rarity": "Common",
			"set": "Classic",
			"text": "<i>You are out of demons! At least there are always imps...</i>",
			"type": "Minion"
		},
		{
			"cardImage": "EX1_154a.png",
			"faction": "Neutral",
			"fr": {
				"name": "Colère"
			},
			"id": "EX1_154a",
			"name": "Wrath",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Deal $3 damage to a minion.",
			"type": "Spell"
		},
		{
			"cardImage": "EX1_154b.png",
			"faction": "Neutral",
			"fr": {
				"name": "Colère"
			},
			"id": "EX1_154b",
			"name": "Wrath",
			"playerClass": "Druid",
			"set": "Classic",
			"text": "Deal $1 damage to a minion. Draw a card.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "EX1_154.png",
			"collectible": true,
			"cost": 2,
			"faction": "Neutral",
			"flavor": "The talk around the Ratchet Inn is that this card is too good and should be a Legendary.",
			"fr": {
				"name": "Colère"
			},
			"id": "EX1_154",
			"name": "Wrath",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Choose One</b> - Deal $3 damage to a minion; or $1 damage and draw a card.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Yarrr !"
			},
			"id": "NEW1_027e",
			"name": "Yarrr!",
			"set": "Classic",
			"text": "Southsea Captain is granting +1/+1.",
			"type": "Enchantment"
		},
		{
			"artist": "Greg Hildebrandt",
			"attack": 1,
			"cardImage": "CS2_169.png",
			"collectible": true,
			"cost": 1,
			"faction": "Horde",
			"flavor": "They were the inspiration for the championship Taurenball team: The Dragonhawks.",
			"fr": {
				"name": "Jeune faucon-dragon"
			},
			"health": 1,
			"id": "CS2_169",
			"mechanics": [
				"Windfury"
			],
			"name": "Young Dragonhawk",
			"race": "Beast",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"artist": "Vance Kovacs",
			"attack": 2,
			"cardImage": "EX1_004.png",
			"collectible": true,
			"cost": 1,
			"flavor": "She can't wait to learn Power Word: Fortitude Rank 2.",
			"fr": {
				"name": "Jeune prêtresse"
			},
			"health": 1,
			"id": "EX1_004",
			"name": "Young Priestess",
			"rarity": "Rare",
			"set": "Classic",
			"text": "At the end of your turn, give another random friendly minion +1 Health.",
			"type": "Minion"
		},
		{
			"artist": "Wei Wang",
			"attack": 3,
			"cardImage": "EX1_049.png",
			"collectible": true,
			"cost": 2,
			"faction": "Alliance",
			"flavor": "His youthful enthusiasm doesn’t always equal excellence in his brews.   Don’t drink the Mogu Stout!",
			"fr": {
				"name": "Jeune maître brasseur"
			},
			"health": 2,
			"id": "EX1_049",
			"mechanics": [
				"Battlecry"
			],
			"name": "Youthful Brewmaster",
			"rarity": "Common",
			"set": "Classic",
			"text": "<b>Battlecry:</b> Return a friendly minion from the battlefield to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 4,
			"cardImage": "EX1_572.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"faction": "Neutral",
			"flavor": "Ysera rules the Emerald Dream.  Which is some kind of green-mirror-version of the real world, or something?",
			"fr": {
				"name": "Ysera"
			},
			"health": 12,
			"id": "EX1_572",
			"name": "Ysera",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Classic",
			"text": "At the end of your turn, add a Dream Card to your hand.",
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
			"set": "Classic",
			"text": "Deal $5 damage to all characters except Ysera.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Banane"
			},
			"id": "TU4c_006e",
			"name": "Bananas",
			"set": "Missions",
			"text": "This minion has +1/+1. <i>(+1 Attack/+1 Health)</i>",
			"type": "Enchantment"
		},
		{
			"cardImage": "TU4c_006.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Banane"
			},
			"id": "TU4c_006",
			"name": "Bananas",
			"rarity": "Common",
			"set": "Missions",
			"text": "Give a friendly minion +1/+1. <i>(+1 Attack/+1 Health)</i>",
			"type": "Spell"
		},
		{
			"cardImage": "TU4c_003.png",
			"cost": 0,
			"faction": "Neutral",
			"fr": {
				"name": "Tonneau"
			},
			"health": 2,
			"id": "TU4c_003",
			"inPlayText": "Breakable",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Barrel",
			"rarity": "Common",
			"set": "Missions",
			"text": "Is something in this barrel?",
			"type": "Minion"
		},
		{
			"cardImage": "TU4c_002.png",
			"cost": 1,
			"faction": "Neutral",
			"fr": {
				"name": "Lancer de tonneau"
			},
			"id": "TU4c_002",
			"name": "Barrel Toss",
			"rarity": "Common",
			"set": "Missions",
			"text": "Deal 2 damage.",
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
			"rarity": "Common",
			"set": "Missions",
			"type": "Minion"
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
			"attack": 1,
			"cardImage": "TU4f_007.png",
			"cost": 1,
			"fr": {
				"name": "Singe cinglé"
			},
			"health": 2,
			"id": "TU4f_007",
			"mechanics": [
				"Battlecry"
			],
			"name": "Crazy Monkey",
			"rarity": "Common",
			"set": "Missions",
			"text": "<b>Battlecry:</b> Throw Bananas.",
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
			"cardImage": "TU4e_005.png",
			"cost": 3,
			"fr": {
				"name": "Explosion de flammes"
			},
			"id": "TU4e_005",
			"name": "Flame Burst",
			"rarity": "Common",
			"set": "Missions",
			"text": "Shoot 5 missiles at random enemies for $1 damage each.",
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
			"cardImage": "TU4e_002.png",
			"cost": 2,
			"fr": {
				"name": "Flammes d’Azzinoth"
			},
			"id": "TU4e_002",
			"name": "Flames of Azzinoth",
			"set": "Missions",
			"text": "<b>Hero Power</b>\nSummon two 2/1 minions.",
			"type": "Hero Power"
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
			"attack": 1,
			"cardImage": "TU4c_005.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Gnome caché"
			},
			"health": 3,
			"id": "TU4c_005",
			"name": "Hidden Gnome",
			"rarity": "Common",
			"set": "Missions",
			"text": "Was hiding in a barrel!",
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
			"rarity": "Common",
			"set": "Missions",
			"type": "Hero"
		},
		{
			"cardImage": "TU4a_004.png",
			"cost": 3,
			"fr": {
				"name": "Lardeur TOUT CASSER !"
			},
			"id": "TU4a_004",
			"name": "Hogger SMASH!",
			"rarity": "Common",
			"set": "Missions",
			"text": "Deal 4 damage.",
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
			"fr": {
				"name": "Héritage de l’Empereur"
			},
			"id": "TU4f_004o",
			"name": "Legacy of the Emperor",
			"set": "Missions",
			"text": "Has +2/+2. <i>(+2 Attack/+2 Health)</i>",
			"type": "Enchantment"
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
			"text": "Give your minions +2/+2. <i>(+2 Attack/+2 Health)</i>",
			"type": "Spell"
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
			"fr": {
				"name": "Puissance de Mukla"
			},
			"id": "TU4c_008e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Might of Mukla",
			"set": "Missions",
			"text": "King Mukla has +8 Attack this turn.",
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
			"text": "So strong! And only 6 Mana?!",
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
			"text": "<b></b>",
			"type": "Minion"
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
			"text": "<b>Hero Power</b>\nDeal 1 damage.",
			"type": "Hero Power"
		},
		{
			"cardImage": "TU4c_004.png",
			"cost": 2,
			"faction": "Neutral",
			"fr": {
				"name": "Piétinement"
			},
			"id": "TU4c_004",
			"name": "Stomp",
			"rarity": "Common",
			"set": "Missions",
			"text": "Deal 2 damage to all enemies.",
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
			"text": "Until you kill Cho's minions, he can't be attacked.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Transcendance"
			},
			"id": "TU4f_006o",
			"name": "Transcendence",
			"set": "Missions",
			"text": "Until you kill Cho's minions, he can't be attacked.",
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
			"cardImage": "TU4c_008.png",
			"cost": 3,
			"fr": {
				"name": "Volonté de Mukla"
			},
			"id": "TU4c_008",
			"name": "Will of Mukla",
			"rarity": "Common",
			"set": "Missions",
			"text": "Restore 8 Health.",
			"type": "Spell"
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
			"race": "Beast",
			"set": "Promotion",
			"text": "<i>Hey Chicken!</i>",
			"type": "Minion"
		},
		{
			"artist": "Samwise Didier",
			"attack": 5,
			"cardImage": "PRO_001.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"flavor": "He's looking for a drummer.  The current candidates are: Novice Engineer, Sen'jin Shieldmasta', and Ragnaros the Firelord.",
			"fr": {
				"name": "Elite Tauren Chieftain"
			},
			"health": 5,
			"howToGetGold": "Awarded at BlizzCon 2013.",
			"id": "PRO_001",
			"mechanics": [
				"Battlecry"
			],
			"name": "Elite Tauren Chieftain",
			"rarity": "Legendary",
			"set": "Promotion",
			"text": "<b>Battlecry:</b> Give both players the power to ROCK! (with a Power Chord card)",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Encouragé !"
			},
			"id": "Mekka3e",
			"name": "Emboldened!",
			"set": "Promotion",
			"text": "Increased Stats.",
			"type": "Enchantment"
		},
		{
			"attack": 0,
			"cardImage": "Mekka3.png",
			"cost": 1,
			"faction": "Alliance",
			"fr": {
				"name": "Encourageur 3000"
			},
			"health": 4,
			"id": "Mekka3",
			"name": "Emboldener 3000",
			"race": "Mech",
			"rarity": "Common",
			"set": "Promotion",
			"text": "At the end of your turn, give a random minion +1/+1.",
			"type": "Minion"
		},
		{
			"artist": "Ludo Lullabi",
			"attack": 6,
			"cardImage": "EX1_112.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"faction": "Alliance",
			"flavor": "He's the leader of the gnomes, and an incredible inventor.  He's getting better, too; He turns things into chickens WAY less than he used to.",
			"fr": {
				"name": "Gelbin Mekkanivelle"
			},
			"health": 6,
			"howToGetGold": "This was rewarded to players who helped test the Store during the Beta.",
			"id": "EX1_112",
			"mechanics": [
				"Battlecry"
			],
			"name": "Gelbin Mekkatorque",
			"rarity": "Legendary",
			"set": "Promotion",
			"text": "<b>Battlecry:</b> Summon an AWESOME invention.",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "Mekka1.png",
			"cost": 1,
			"faction": "Alliance",
			"fr": {
				"name": "Poulet à tête chercheuse"
			},
			"health": 1,
			"id": "Mekka1",
			"inPlayText": "Pecking",
			"name": "Homing Chicken",
			"race": "Mech",
			"rarity": "Common",
			"set": "Promotion",
			"text": "At the start of your turn, destroy this minion and draw 3 cards.",
			"type": "Minion"
		},
		{
			"cardImage": "PRO_001a.png",
			"cost": 4,
			"fr": {
				"name": "Je suis murloc"
			},
			"id": "PRO_001a",
			"name": "I Am Murloc",
			"set": "Promotion",
			"text": "Summon three, four, or five 1/1 Murlocs.",
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
			"race": "Murloc",
			"set": "Promotion",
			"type": "Minion"
		},
		{
			"attack": 0,
			"cardImage": "Mekka4.png",
			"cost": 1,
			"faction": "Alliance",
			"fr": {
				"name": "Pouletisateur"
			},
			"health": 3,
			"id": "Mekka4",
			"name": "Poultryizer",
			"race": "Mech",
			"rarity": "Common",
			"set": "Promotion",
			"text": "At the start of your turn, transform a random minion into a 1/1 Chicken.",
			"type": "Minion"
		},
		{
			"cardImage": "PRO_001c.png",
			"cost": 4,
			"fr": {
				"name": "Puissance de la Horde"
			},
			"id": "PRO_001c",
			"name": "Power of the Horde",
			"set": "Promotion",
			"text": "Summon a random Horde Warrior.",
			"type": "Spell"
		},
		{
			"attack": 0,
			"cardImage": "Mekka2.png",
			"cost": 1,
			"faction": "Alliance",
			"fr": {
				"name": "Robot réparateur"
			},
			"health": 3,
			"id": "Mekka2",
			"name": "Repair Bot",
			"race": "Mech",
			"rarity": "Common",
			"set": "Promotion",
			"text": "At the end of your turn, restore 6 Health to a damaged character.",
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
			"set": "Promotion",
			"text": "Deal $4 damage. Draw a card.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Transformé"
			},
			"id": "Mekka4e",
			"mechanics": [
				"Morph"
			],
			"name": "Transformed",
			"set": "Promotion",
			"text": "Has been transformed into a chicken!",
			"type": "Enchantment"
		},
		{
			"attack": 6,
			"cost": 9,
			"faction": "Neutral",
			"fr": {
				"name": "Placeholder Card"
			},
			"health": 8,
			"id": "PlaceholderCard",
			"name": "Placeholder Card",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "System",
			"text": "Battlecry: Someone remembers to publish this card.",
			"type": "Minion"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Activation !"
			},
			"id": "BRMA14_10H_TB",
			"name": "Activate!",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nActivate a random Tron.",
			"type": "Hero Power"
		},
		{
			"faction": "Neutral",
			"fr": {
				"name": "Ennuy-o-tron"
			},
			"health": 30,
			"id": "TB_MechWar_Boss1",
			"name": "Annoy-o-Tron",
			"rarity": "Free",
			"set": "Tavern Brawl",
			"type": "Hero"
		},
		{
			"attack": 2,
			"cardImage": "BRMC_86.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Atramédès"
			},
			"health": 8,
			"id": "BRMC_86",
			"name": "Atramedes",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Tavern Brawl",
			"text": "Whenever your opponent plays a card, gain +2 Attack.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Grande banane"
			},
			"id": "TB_006e",
			"name": "Big Banana",
			"set": "Tavern Brawl",
			"text": "Has +2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_006.png",
			"collectible": false,
			"cost": 1,
			"fr": {
				"name": "Grande banane"
			},
			"id": "TB_006",
			"name": "Big Banana",
			"set": "Tavern Brawl",
			"text": "Give a minion +2/+2.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpBossSpell_2.png",
			"fr": {
				"name": "Salve de bombes"
			},
			"id": "TB_CoOpBossSpell_2",
			"name": "Bomb Salvo",
			"set": "Tavern Brawl",
			"text": "Deal Attack damage to up to 3 random targets.",
			"type": "Spell"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Séides des os"
			},
			"id": "BRMA17_5_TB",
			"name": "Bone Minions",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nSummon two 2/1 Bone Constructs.",
			"type": "Hero Power"
		},
		{
			"faction": "Neutral",
			"fr": {
				"name": "Ro’Boum"
			},
			"health": 30,
			"id": "TB_MechWar_Boss2",
			"name": "Boom Bot",
			"rarity": "Free",
			"set": "Tavern Brawl",
			"type": "Hero"
		},
		{
			"cardImage": "TB_MechWar_Boss2_HeroPower.png",
			"cost": 2,
			"fr": {
				"name": "Ro’Boum junior"
			},
			"id": "TB_MechWar_Boss2_HeroPower",
			"name": "Boom Bot Jr.",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nDeal 1 damage to 2 random enemies.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Échanger les PV des boss"
			},
			"id": "TB_001",
			"name": "Boss HP Swapper",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Montée d’adrénaline"
			},
			"id": "BRMC_97e",
			"name": "Burning Adrenaline",
			"set": "Tavern Brawl",
			"text": "Costs (2) less.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Cadeau nul"
			},
			"id": "TB_GiftExchange_Enchantment",
			"name": "Cheap Gift",
			"set": "Tavern Brawl",
			"text": "This card's costs is reduced by (4)",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_012.png",
			"cost": 0,
			"fr": {
				"name": "Choisir une nouvelle carte !"
			},
			"id": "TB_012",
			"name": "Choose a New Card!",
			"set": "Tavern Brawl",
			"text": "Look at 3 random cards. Choose one and shuffle it into your deck.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_014.png",
			"cost": 0,
			"fr": {
				"name": "Choisir une nouvelle carte !"
			},
			"id": "TB_014",
			"name": "Choose a New Card!",
			"set": "Tavern Brawl",
			"text": "Look at 3 random cards. Choose one and put it into your hand.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Choisir un des trois"
			},
			"id": "TB_010e",
			"name": "Choose One of Three",
			"set": "Tavern Brawl",
			"type": "Enchantment"
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
			"race": "Beast",
			"set": "Tavern Brawl",
			"text": "At the end of each turn, summon all Core Hound Pups that died this turn.",
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
			"set": "Tavern Brawl",
			"text": "Summon two 2/4 Core Hound Pups.",
			"type": "Spell"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_92.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Coren Navrebière"
			},
			"health": 8,
			"id": "BRMC_92",
			"mechanics": [
				"Battlecry"
			],
			"name": "Coren Direbrew",
			"rarity": "Legendary",
			"set": "Tavern Brawl",
			"text": "Always wins Brawls.\n <b>Battlecry:</b> Add a Brawl to your hand.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Créer 15 secrets"
			},
			"id": "TB_009",
			"name": "Create 15 Secrets",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX12_02H_2c_TB.png",
			"cost": 1,
			"fr": {
				"name": "Décimer"
			},
			"id": "NAX12_02H_2c_TB",
			"name": "Decimate",
			"set": "Tavern Brawl",
			"text": "Change the Health of enemy minions to 1.",
			"type": "Spell"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Décimer"
			},
			"id": "NAX12_02H_2_TB",
			"name": "Decimate",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nChange the Health of enemy minions to 1.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Enchantement de création de deck"
			},
			"id": "TB_010",
			"name": "Deckbuilding Enchant",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_007.png",
			"collectible": false,
			"cost": 1,
			"fr": {
				"name": "Banane déviante"
			},
			"id": "TB_007",
			"name": "Deviate Banana",
			"set": "Tavern Brawl",
			"text": "Swap a minion's Attack and Health.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Inversion déviante"
			},
			"id": "TB_007e",
			"name": "Deviate Switch",
			"set": "Tavern Brawl",
			"text": "Attack and Health have been swapped by Deviate Banana.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_CoOpBossSpell_5.png",
			"fr": {
				"name": "Double zap"
			},
			"id": "TB_CoOpBossSpell_5",
			"name": "Double Zap",
			"set": "Tavern Brawl",
			"text": "Deal Attack damage to both players.",
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
			"mechanics": [
				"Battlecry"
			],
			"name": "Dragonkin Spellcaster",
			"race": "Dragon",
			"set": "Tavern Brawl",
			"text": "<b>Battlecry:</b> Summon two 2/2 Whelps.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Soif de dragon"
			},
			"id": "BRMC_98e",
			"name": "Dragonlust",
			"set": "Tavern Brawl",
			"text": "+3 Attack.",
			"type": "Enchantment"
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
			"race": "Dragon",
			"set": "Tavern Brawl",
			"text": "Also damages the minions next to whomever he attacks.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Enchantement sans fin"
			},
			"id": "TB_EndlessMinions01",
			"name": "Endless Enchantment",
			"set": "Tavern Brawl",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_FactionWar_Boss_BoomBot.png",
			"fr": {
				"name": "FactionWar_BoomBot"
			},
			"health": 30,
			"id": "TB_FactionWar_Boss_BoomBot",
			"name": "FactionWar_BoomBot",
			"set": "Tavern Brawl",
			"type": "Hero"
		},
		{
			"cardImage": "TB_PickYourFate_1.png",
			"fr": {
				"name": "Fate 1"
			},
			"id": "TB_PickYourFate_1",
			"name": "Fate 1",
			"set": "Tavern Brawl",
			"text": "All minions have <b>Taunt</b> and <b>Charge</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_10.png",
			"fr": {
				"name": "Destin 10"
			},
			"id": "TB_PickYourFate_10",
			"name": "Fate 10",
			"set": "Tavern Brawl",
			"text": "Battlecry minions get +1/+1",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Fate 10 Ench. Battlecry bonus"
			},
			"id": "TB_PickYourFate_10_Ench",
			"name": "Fate 10 Ench. Battlecry bonus",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_11.png",
			"fr": {
				"name": "Fate 11"
			},
			"id": "TB_PickYourFate_11",
			"name": "Fate 11",
			"set": "Tavern Brawl",
			"text": "Each turn, you get a 1/1 Murloc",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Fate 11 Ench. Murloc"
			},
			"id": "TB_PickYourFate_11_Ench",
			"name": "Fate 11 Ench. Murloc",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_2.png",
			"fr": {
				"name": "Fate 2"
			},
			"id": "TB_PickYourFate_2",
			"name": "Fate 2",
			"set": "Tavern Brawl",
			"text": "When a minion dies, its owner gets a (1) mana Banana.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_3.png",
			"fr": {
				"name": "Fate 3"
			},
			"id": "TB_PickYourFate_3",
			"name": "Fate 3",
			"set": "Tavern Brawl",
			"text": "All minions have <b>Windfury</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_4.png",
			"fr": {
				"name": "Fate 4"
			},
			"id": "TB_PickYourFate_4",
			"name": "Fate 4",
			"set": "Tavern Brawl",
			"text": "All minions get +1 Attack.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_5.png",
			"fr": {
				"name": "Fate 5"
			},
			"id": "TB_PickYourFate_5",
			"name": "Fate 5",
			"set": "Tavern Brawl",
			"text": "Spells cost (1) less.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_6.png",
			"fr": {
				"name": "Fate 6"
			},
			"id": "TB_PickYourFate_6",
			"name": "Fate 6",
			"set": "Tavern Brawl",
			"text": "Shuffle 10 Unstable Portals into your deck.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_PickYourFate_7.png",
			"fr": {
				"name": "Fate 7"
			},
			"id": "TB_PickYourFate_7",
			"name": "Fate 7",
			"set": "Tavern Brawl",
			"text": "When a minion dies, its owner gets a Coin.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Fate 7 Ench Get a Coin"
			},
			"id": "TB_PickYourFate_7_Ench",
			"name": "Fate 7 Ench Get a Coin",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_8.png",
			"fr": {
				"name": "Fate 8"
			},
			"id": "TB_PickYourFate_8",
			"name": "Fate 8",
			"set": "Tavern Brawl",
			"text": "Whenever a spell is played, its caster gains 3 armor.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Fate 8 Get Armor"
			},
			"id": "TB_PickYourFate_8_Ench",
			"name": "Fate 8 Get Armor",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_PickYourFate_9.png",
			"fr": {
				"name": "Fate 9"
			},
			"id": "TB_PickYourFate_9",
			"name": "Fate 9",
			"set": "Tavern Brawl",
			"text": "Deathrattle minions get +1/+1",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Fate 9 Ench. Deathrattle bonus"
			},
			"id": "TB_PickYourFate_9_Ench",
			"name": "Fate 9 Ench. Deathrattle bonus",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_99.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Garr"
			},
			"health": 8,
			"id": "BRMC_99",
			"name": "Garr",
			"rarity": "Legendary",
			"set": "Tavern Brawl",
			"text": "Whenever this minion takes damage, summon a 2/3 Elemental with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "TB_CoOp_Mechazod.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "Maître des rouages Mécazod"
			},
			"health": 95,
			"id": "TB_CoOp_Mechazod",
			"mechanics": [
				"Taunt"
			],
			"name": "Gearmaster Mechazod",
			"rarity": "Legendary",
			"set": "Tavern Brawl",
			"text": "<b>Boss</b>\nMechazod wins if he defeats either of you!",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Confère Provocation et Charge"
			},
			"id": "TB_AllMinionsTauntCharge",
			"name": "Give Taunt and Charge",
			"set": "Tavern Brawl",
			"text": "This minion is granted <b>Taunt</b> and <b>Charge</b>.",
			"type": "Enchantment"
		},
		{
			"attack": 20,
			"cardImage": "BRMC_95.png",
			"cost": 50,
			"elite": true,
			"fr": {
				"name": "Golemagg"
			},
			"health": 20,
			"id": "BRMC_95",
			"name": "Golemagg",
			"rarity": "Legendary",
			"set": "Tavern Brawl",
			"text": "Costs (1) less for each damage your hero has taken.",
			"type": "Minion"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Moisson"
			},
			"id": "NAX8_02H_TB",
			"name": "Harvest",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nDraw a card. Gain a Mana Crystal.",
			"type": "Hero Power"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Bonjour ! Bonjour ! Bonjour !"
			},
			"id": "TB_MechWar_Boss1_HeroPower",
			"name": "Hello! Hello! Hello!",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nGive your lowest attack minion <b>Divine Shield</b> and <b>Taunt</b>.",
			"type": "Hero Power"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_96.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Juge Supérieur Mornepierre"
			},
			"health": 5,
			"id": "BRMC_96",
			"name": "High Justice Grimstone",
			"rarity": "Legendary",
			"set": "Tavern Brawl",
			"text": "At the start of your turn, summon a <b>Legendary</b> minion.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Je vous entends…"
			},
			"id": "BRMC_86e",
			"name": "I Hear You...",
			"set": "Tavern Brawl",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Foule moqueuse"
			},
			"id": "BRMA02_2_2_TB",
			"name": "Jeering Crowd",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Spectator with <b>Taunt</b>.",
			"type": "Hero Power"
		},
		{
			"cost": 0,
			"fr": {
				"name": "Foule moqueuse"
			},
			"id": "BRMA02_2_2c_TB",
			"name": "Jeering Crowd",
			"set": "Tavern Brawl",
			"text": "Summon a 1/1 Spectator with <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpBossSpell_6.png",
			"fr": {
				"name": "Détruire le chroniqueur"
			},
			"id": "TB_CoOpBossSpell_6",
			"name": "Kill the Lorewalker",
			"set": "Tavern Brawl",
			"text": "Destroy Lorewalker Cho.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Bombe vivante"
			},
			"id": "BRMC_100e",
			"name": "Living Bomb",
			"set": "Tavern Brawl",
			"text": "On Ragnaros' turn, deal 5 damage to this side of the board.",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMC_100.png",
			"cost": 3,
			"fr": {
				"name": "Bombe vivante"
			},
			"id": "BRMC_100",
			"name": "Living Bomb",
			"set": "Tavern Brawl",
			"text": "Choose an enemy minion. If it lives until your next turn, deal 5 damage to all enemies.",
			"type": "Spell"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Living Lava",
			"set": "Tavern Brawl",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_85.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Lucifron"
			},
			"health": 7,
			"id": "BRMC_85",
			"mechanics": [
				"Battlecry"
			],
			"name": "Lucifron",
			"rarity": "Legendary",
			"set": "Tavern Brawl",
			"text": "<b>Battlecry:</b> Cast Corruption on all other minions.",
			"type": "Minion"
		},
		{
			"cost": 0,
			"fr": {
				"name": "MOI TOUT CASSER"
			},
			"id": "BRMA07_2_2c_TB",
			"name": "ME SMASH",
			"set": "Tavern Brawl",
			"text": "Destroy a random enemy minion.",
			"type": "Spell"
		},
		{
			"cost": 2,
			"fr": {
				"name": "MOI TOUT CASSER"
			},
			"id": "BRMA07_2_2_TB",
			"name": "ME SMASH",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nDestroy a random enemy minion.",
			"type": "Hero Power"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Mech Fan",
			"set": "Tavern Brawl",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_87.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Moira Barbe-de-Bronze"
			},
			"health": 3,
			"id": "BRMC_87",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Moira Bronzebeard",
			"rarity": "Legendary",
			"set": "Tavern Brawl",
			"text": "<b>Deathrattle:</b> Summon Emperor Thaurissan.",
			"type": "Minion"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Rage du magma"
			},
			"id": "TBA01_6",
			"name": "Molten Rage",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nSummon a 5/1 Magma Rager.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Pilote mystère"
			},
			"id": "TB_Pilot1",
			"name": "Mystery Pilot",
			"set": "Tavern Brawl",
			"text": "Who could it be?!",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Nefarian"
			},
			"health": 30,
			"id": "TBA01_4",
			"name": "Nefarian",
			"set": "Tavern Brawl",
			"type": "Hero"
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
			"set": "Tavern Brawl",
			"text": "At the end of your turn, summon a random friendly minion that died this turn.",
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
			"set": "Tavern Brawl",
			"text": "At the end of your turn, heal 2 damage from adjacent minions.",
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
			"set": "Tavern Brawl",
			"text": "At the end of your turn, deal 1 damage to random enemy minion.",
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
			"mechanics": [
				"Taunt"
			],
			"name": "OLDN3wb Tank",
			"set": "Tavern Brawl",
			"text": "<b>Taunt</b>",
			"type": "Minion"
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
			"mechanics": [
				"Stealth"
			],
			"name": "OLDPvP Rogue",
			"set": "Tavern Brawl",
			"text": "<b>Stealth</b>\nRegain <b>Stealth</b> when PvP Rogue kills a minion.",
			"type": "Minion"
		},
		{
			"cost": 0,
			"fr": {
				"name": "Forcer une carte commune"
			},
			"id": "TBST_006",
			"name": "OLDTBST Push Common Card",
			"set": "Tavern Brawl",
			"text": "push a common card into player's hand",
			"type": "Enchantment"
		},
		{
			"cardImage": "BRMC_93.png",
			"cost": 3,
			"fr": {
				"name": "Système de défense Omnitron"
			},
			"id": "BRMC_93",
			"name": "Omnotron Defense System",
			"set": "Tavern Brawl",
			"text": "Summon a random Tron.",
			"type": "Spell"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Ouvrir les portes"
			},
			"id": "BRMA09_2_TB",
			"name": "Open the Gates",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nSummon three 1/1 Whelps.",
			"type": "Hero Power"
		},
		{
			"cardImage": "BRMC_83.png",
			"cost": 8,
			"fr": {
				"name": "Ouvrir les portes"
			},
			"id": "BRMC_83",
			"name": "Open the Gates",
			"set": "Tavern Brawl",
			"text": "Fill your board with 2/2 Whelps.",
			"type": "Spell"
		},
		{
			"cardImage": "TB_CoOpBossSpell_4.png",
			"fr": {
				"name": "Suralimenter"
			},
			"id": "TB_CoOpBossSpell_4",
			"name": "Overclock",
			"set": "Tavern Brawl",
			"text": "Gain 2 Attack.",
			"type": "Spell"
		},
		{
			"cost": 1,
			"fr": {
				"name": "Puissance des rouages"
			},
			"id": "HRW02_1e",
			"name": "Overclock",
			"set": "Tavern Brawl",
			"text": "Increased Attack.",
			"type": "Enchantment"
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
			"set": "Tavern Brawl",
			"text": "<b>Boss</b>\nAt the beginning of each turn, Mechazod strikes!",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Pick You rFate 5 Ench"
			},
			"id": "TB_PickYourFate_5_Ench",
			"name": "Pick You rFate 5 Ench",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Pick Your Fate 1 Ench"
			},
			"id": "TB_PickYourFate_1_Ench",
			"name": "Pick Your Fate 1 Ench",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Pick Your Fate 2 Ench"
			},
			"id": "TB_PickYourFate_2_Ench",
			"name": "Pick Your Fate 2 Ench",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Pick Your Fate 3 Ench"
			},
			"id": "TB_PickYourFate_3_Ench",
			"name": "Pick Your Fate 3 Ench",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Pick Your Fate 4 Ench"
			},
			"id": "TB_PickYourFate_4_Ench",
			"name": "Pick Your Fate 4 Ench",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Choisissez votre destin - Construction"
			},
			"id": "TB_PickYourFate",
			"name": "Pick Your Fate Build Around",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Choisissez votre destin - Aléatoire"
			},
			"id": "TB_PickYourFateRandom",
			"name": "Pick Your Fate Random",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Pioche forcée !"
			},
			"id": "BRMA01_2H_2_TB",
			"name": "Pile On!!!",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nPut a minion from each deck into the battlefield.",
			"type": "Hero Power"
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
			"race": "Pirate",
			"set": "Tavern Brawl",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Enchantement du choix du joueur"
			},
			"id": "TB_013",
			"name": "Player Choice Enchant",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Player Choice Enchant On Curve"
			},
			"id": "TB_013_PickOnCurve",
			"name": "Player Choice Enchant On Curve",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Player Choice Enchant On Curve2"
			},
			"id": "TB_013_PickOnCurve2",
			"name": "Player Choice Enchant On Curve2",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Nuage empoisonné"
			},
			"id": "NAX11_02H_2_TB",
			"name": "Poison Cloud",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nDeal 1 damage to all enemy minions. If any die, summon a slime.",
			"type": "Hero Power"
		},
		{
			"cardImage": "TB_CoOpBossSpell_1.png",
			"fr": {
				"name": "Fixer des priorités"
			},
			"id": "TB_CoOpBossSpell_1",
			"name": "Prioritize",
			"set": "Tavern Brawl",
			"text": "Deal Attack damage to biggest minion.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Ragnaros, seigneur du feu"
			},
			"health": 60,
			"id": "TBA01_1",
			"name": "Ragnaros the Firelord",
			"set": "Tavern Brawl",
			"type": "Hero"
		},
		{
			"attack": 4,
			"cardImage": "BRMC_98.png",
			"cost": 6,
			"elite": true,
			"fr": {
				"name": "Tranchetripe"
			},
			"health": 12,
			"id": "BRMC_98",
			"name": "Razorgore",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Tavern Brawl",
			"text": "At the start of your turn, give your minions +3 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_CoOpBossSpell_3.png",
			"fr": {
				"name": "Liquide de refroidissement"
			},
			"id": "TB_CoOpBossSpell_3",
			"name": "Release Coolant",
			"set": "Tavern Brawl",
			"text": "Freeze and deal Attack damage to all minions.\nGain 2 Attack.",
			"type": "Spell"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Rock Elemental",
			"set": "Tavern Brawl",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "TB_008.png",
			"collectible": false,
			"cost": 1,
			"fr": {
				"name": "Banane pourrie"
			},
			"id": "TB_008",
			"mechanics": [
				"AffectedBySpellPower"
			],
			"name": "Rotten Banana",
			"set": "Tavern Brawl",
			"text": "Deal $1 damage.",
			"type": "Spell"
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
			"mechanics": [
				"Battlecry"
			],
			"name": "Son of the Flame",
			"set": "Tavern Brawl",
			"text": "<b>Battlecry:</b> Deal 6 damage.",
			"type": "Minion"
		},
		{
			"cardImage": "TB_GiftExchange_Treasure_Spell.png",
			"cost": 1,
			"fr": {
				"name": "Cadeau du Voile d’hiver volé"
			},
			"id": "TB_GiftExchange_Treasure_Spell",
			"name": "Stolen Winter's Veil Gift",
			"set": "Tavern Brawl",
			"text": "Find a random Treasure.",
			"type": "Spell"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Sulfuras",
			"set": "Tavern Brawl",
			"text": "<b>Deathrattle:</b> Your Hero Power becomes 'Deal 8 damage to a random enemy'.",
			"type": "Weapon"
		},
		{
			"cardImage": "TB_011.png",
			"cost": 0,
			"fr": {
				"name": "Pièce ternie"
			},
			"id": "TB_011",
			"name": "Tarnished Coin",
			"set": "Tavern Brawl",
			"text": "Gain 1 Mana Crystal this turn only.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "TB_ClockworkCardDealer"
			},
			"id": "TB_GreatCurves_01",
			"name": "TB_ClockworkCardDealer",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "TB_DecreasingCardCost"
			},
			"id": "TB_DecreasingCardCost",
			"name": "TB_DecreasingCardCost",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"cost": 0,
			"fr": {
				"name": "TB_EnchRandomManaCost"
			},
			"id": "TB_RMC_001",
			"name": "TB_EnchRandomManaCost",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "TB_EnchWhosTheBossNow"
			},
			"id": "TB_RandHero2_001",
			"name": "TB_EnchWhosTheBossNow",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_DecreasingCardCostDebug.png",
			"fr": {
				"name": "TBDecreasingCardCostDebug"
			},
			"id": "TB_DecreasingCardCostDebug",
			"name": "TBDecreasingCardCostDebug",
			"set": "Tavern Brawl",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "TBFactionWarBoomBot"
			},
			"id": "TB_FactionWar_BoomBot",
			"name": "TBFactionWarBoomBot",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"cardImage": "TB_FactionWar_BoomBot_Spell.png",
			"cost": 1,
			"fr": {
				"name": "TBFactionWarBoomBotSpell"
			},
			"id": "TB_FactionWar_BoomBot_Spell",
			"name": "TBFactionWarBoomBotSpell",
			"set": "Tavern Brawl",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "TBMechWarCommonCards"
			},
			"id": "TB_MechWar_CommonCards",
			"name": "TBMechWarCommonCards",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "TBRandomCardCost"
			},
			"id": "TB_RandCardCost",
			"name": "TBRandomCardCost",
			"set": "Tavern Brawl",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Invocation précoce de serviteur"
			},
			"id": "TBUD_1",
			"name": "TBUD Summon Early Minion",
			"set": "Tavern Brawl",
			"text": "Each turn, if you have less health then a your opponent, summon a free minion",
			"type": "Enchantment"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Le chambellan"
			},
			"id": "BRMA06_2H_TB",
			"name": "The Majordomo",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nSummon a 3/3 Flamewaker Acolyte.",
			"type": "Hero Power"
		},
		{
			"attack": 7,
			"cardImage": "BRMC_97.png",
			"cost": 6,
			"elite": true,
			"fr": {
				"name": "Vaelastrasz"
			},
			"health": 7,
			"id": "BRMC_97",
			"name": "Vaelastrasz",
			"race": "Dragon",
			"rarity": "Legendary",
			"set": "Tavern Brawl",
			"text": "Your cards cost (3) less.",
			"type": "Minion"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Entoilage"
			},
			"id": "NAX3_02_TB",
			"name": "Web Wrap",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nReturn a random enemy minion to your opponent's hand.",
			"type": "Hero Power"
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
			"mechanics": [
				"Windfury"
			],
			"name": "Whirling Ash",
			"set": "Tavern Brawl",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"cardImage": "TBA01_5.png",
			"cost": 2,
			"fr": {
				"name": "Magie sauvage"
			},
			"id": "TBA01_5",
			"name": "Wild Magic",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nAdd a random spell from any class to your hand. It costs (0).",
			"type": "Hero Power"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Magie sauvage"
			},
			"id": "BRMA13_4_2_TB",
			"name": "Wild Magic",
			"set": "Tavern Brawl",
			"text": "<b>Hero Power</b>\nPut a random spell from your opponent's class into your hand.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Furie des vents"
			},
			"id": "TB_PickYourFate_Windfury",
			"name": "Windfury",
			"set": "Tavern Brawl",
			"text": "This minion has <b>Windfury</b>",
			"type": "Enchantment"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Winter's Veil Gift",
			"set": "Tavern Brawl",
			"text": "<b>Deathrattle</b> Give attacking player a Treasure.",
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
			"set": "Hero Skins",
			"type": "Hero"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Gain d’armure !"
			},
			"id": "CS2_102_H1",
			"name": "Armor Up!",
			"playerClass": "Warrior",
			"rarity": "Free",
			"set": "Hero Skins",
			"text": "<b>Hero Power</b>\nGain 2 Armor.",
			"type": "Hero Power"
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
			"set": "Hero Skins",
			"text": "<b>Hero Power</b>\nDeal $3 damage to the enemy hero.",
			"type": "Hero Power"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Explosion de feu"
			},
			"id": "CS2_034_H1",
			"name": "Fireblast",
			"playerClass": "Mage",
			"rarity": "Free",
			"set": "Hero Skins",
			"text": "<b>Hero Power</b>\nDeal $1 damage.",
			"type": "Hero Power"
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
			"set": "Hero Skins",
			"text": "<b>Hero Power</b>\nDeal $2 damage.",
			"type": "Hero Power"
		},
		{
			"cardImage": "HERO_01a.png",
			"collectible": true,
			"fr": {
				"name": "Magni Barbe-de-bronze"
			},
			"health": 30,
			"id": "HERO_01a",
			"name": "Magni Bronzebeard",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Hero Skins",
			"type": "Hero"
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
			"set": "Hero Skins",
			"type": "Hero"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Renfort"
			},
			"id": "CS2_101_H1",
			"name": "Reinforce",
			"playerClass": "Paladin",
			"rarity": "Free",
			"set": "Hero Skins",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Silver Hand Recruit.",
			"type": "Hero Power"
		},
		{
			"cost": 2,
			"fr": {
				"name": "Tir assuré"
			},
			"id": "DS1h_292_H1",
			"name": "Steady Shot",
			"playerClass": "Hunter",
			"rarity": "Free",
			"set": "Hero Skins",
			"text": "<b>Hero Power</b>\nDeal $2 damage to the enemy hero.",
			"type": "Hero Power"
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
			"set": "Hero Skins",
			"text": "<b>Hero Power</b>\nGain 4 Armor.",
			"type": "Hero Power"
		},
		{
			"attack": 1,
			"cardImage": "CRED_15.png",
			"cost": 1,
			"elite": true,
			"fr": {
				"name": "Andy Brock"
			},
			"health": 3,
			"id": "CRED_15",
			"name": "Andy Brock",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Can't be <b>Silenced. Divine Shield, Stealth.</b>",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_18.png",
			"cost": 2,
			"elite": true,
			"fr": {
				"name": "Becca Abel"
			},
			"health": 2,
			"id": "CRED_18",
			"name": "Becca Abel",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Whenever you draw a card, make it Golden.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "CRED_08.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Ben Brode"
			},
			"health": 1,
			"id": "CRED_08",
			"name": "Ben Brode",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Your volume can't be reduced below maximum.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "CRED_09.png",
			"cost": 6,
			"elite": true,
			"fr": {
				"name": "Ben Thompson"
			},
			"health": 7,
			"id": "CRED_09",
			"name": "Ben Thompson",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Draw some cards. With a pen.",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "CRED_19.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Beomki Hong"
			},
			"health": 3,
			"id": "CRED_19",
			"name": "Beomki Hong",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Taunt.</b> Friendly minions can’t be <b>Frozen.</b>",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_03.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Bob Fitch"
			},
			"health": 4,
			"id": "CRED_03",
			"name": "Bob Fitch",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Super Taunt</b> <i>(EVERY character must attack this minion.)</i>",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "CRED_20.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Brian Birmingham"
			},
			"health": 2,
			"id": "CRED_20",
			"name": "Brian Birmingham",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Choose One</b> - Restore a Mech to full Health; or Give a Designer <b>Windfury.</b>",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "CRED_13.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "Brian Schwab"
			},
			"health": 10,
			"id": "CRED_13",
			"name": "Brian Schwab",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "At the end of your turn, give a random minion +1 Attack.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CRED_21.png",
			"cost": 1,
			"elite": true,
			"fr": {
				"name": "Bryan Chang"
			},
			"health": 3,
			"id": "CRED_21",
			"name": "Bryan Chang",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Foodie:</b> Make all minions edible.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_22.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Cameron Chrisman"
			},
			"health": 3,
			"id": "CRED_22",
			"name": "Cameron Chrisman",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "While this is in your hand, Golden cards cost (1) less.",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "CRED_23.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Christopher Yim"
			},
			"health": 5,
			"id": "CRED_23",
			"name": "Christopher Yim",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Your emotes are now spoken in \"Radio Voice.\"",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "CRED_24.png",
			"cost": 7,
			"elite": true,
			"fr": {
				"name": "Dean Ayala"
			},
			"health": 5,
			"id": "CRED_24",
			"name": "Dean Ayala",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "You can't lose stars while this is in your deck.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_06.png",
			"cost": 1,
			"elite": true,
			"fr": {
				"name": "Derek Sakamoto"
			},
			"health": 1,
			"id": "CRED_06",
			"name": "Derek Sakamoto",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<i>The notorious Footclapper.</i>",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_25.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Elizabeth Cho"
			},
			"health": 4,
			"id": "CRED_25",
			"name": "Elizabeth Cho",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Add Echo of Medivh and Echoing Ooze to your hand.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CRED_26.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Eric Del Priore"
			},
			"health": 6,
			"id": "CRED_26",
			"name": "Eric Del Priore",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Has <b>Taunt</b> if it's 3 AM.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "CRED_02.png",
			"cost": 6,
			"elite": true,
			"fr": {
				"name": "Eric Dodds"
			},
			"health": 5,
			"id": "CRED_02",
			"name": "Eric Dodds",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Summon a 2/2 Pirate and destroy all Ninjas.",
			"type": "Minion"
		},
		{
			"attack": 9,
			"cardImage": "CRED_16.png",
			"cost": 7,
			"elite": true,
			"fr": {
				"name": "Hamilton Chu"
			},
			"health": 5,
			"id": "CRED_16",
			"name": "Hamilton Chu",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<i>Was successfully NOT part of the problem! ...most of the time.</i>",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "CRED_28.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "He-Rim Woo"
			},
			"health": 3,
			"id": "CRED_28",
			"name": "He-Rim Woo",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Choose One</b> - Punch an arm; Offer a treat; or Give a big hug.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_27.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Henry Ho"
			},
			"health": 4,
			"id": "CRED_27",
			"name": "Henry Ho",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Spectate your opponent's hand.",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "CRED_01.png",
			"cost": 6,
			"elite": true,
			"fr": {
				"name": "Jason Chayes"
			},
			"health": 6,
			"id": "CRED_01",
			"name": "Jason Chayes",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Enrage:</b> Just kidding! He never Enrages.",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "CRED_29.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Jason MacAllister"
			},
			"health": 5,
			"id": "CRED_29",
			"name": "Jason MacAllister",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<i>He's a real stand-up guy.</i>",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CRED_11.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Jay Baxter"
			},
			"health": 4,
			"id": "CRED_11",
			"name": "Jay Baxter",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Summon FIVE random Inventions.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_30.png",
			"cost": 7,
			"elite": true,
			"fr": {
				"name": "JC Park"
			},
			"health": 4,
			"id": "CRED_30",
			"name": "JC Park",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Add a new platform for Hearthstone.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "CRED_31.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Jeremy Cranford"
			},
			"health": 4,
			"id": "CRED_31",
			"name": "Jeremy Cranford",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "When the game starts, this card climbs to the top of the deck.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_32.png",
			"cost": 2,
			"elite": true,
			"fr": {
				"name": "Jerry Mascho"
			},
			"health": 2,
			"id": "CRED_32",
			"name": "Jerry Mascho",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "At the start of your turn, deal 1 damage. If this card is golden, deal 1 damage at the end of your turn instead. THIS IS A HAN SOLO JOKE.",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "CRED_33.png",
			"cost": 6,
			"elite": true,
			"fr": {
				"name": "Jomaro Kindred"
			},
			"health": 6,
			"id": "CRED_33",
			"name": "Jomaro Kindred",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> TAKE any cards from your opponent's hand that they don't want.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "CRED_43.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Jon Bankard"
			},
			"health": 5,
			"id": "CRED_43",
			"name": "Jon Bankard",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "50% chance to be 100% right.",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "CRED_45.png",
			"cost": 6,
			"elite": true,
			"fr": {
				"name": "Jonas Laster"
			},
			"health": 6,
			"id": "CRED_45",
			"name": "Jonas Laster",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Whenever a <b>Silenced</b> minion dies, gain +1/+1.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_46.png",
			"cost": 2,
			"elite": true,
			"fr": {
				"name": "Keith Landes"
			},
			"health": 6,
			"id": "CRED_46",
			"name": "Keith Landes",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "At the start of your turn, get -2 Health due to hunger.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "CRED_05.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Kyle Harrison"
			},
			"health": 4,
			"id": "CRED_05",
			"name": "Kyle Harrison",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<i>3 for a 5/4? That's a good deal!</i>",
			"type": "Minion"
		},
		{
			"attack": 6,
			"cardImage": "CRED_34.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Max Ma"
			},
			"health": 3,
			"id": "CRED_34",
			"name": "Max Ma",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Can only be played on a mobile device.",
			"type": "Minion"
		},
		{
			"attack": 9,
			"cardImage": "CRED_35.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Max McCall"
			},
			"health": 2,
			"id": "CRED_35",
			"name": "Max McCall",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Your emotes have no cooldown and can't be squelched.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_10.png",
			"cost": 2,
			"elite": true,
			"fr": {
				"name": "Michael Schweitzer"
			},
			"health": 2,
			"id": "CRED_10",
			"name": "Michael Schweitzer",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>C-C-C-COMBO:</b> Destroy a minion.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "CRED_36.png",
			"cost": 6,
			"elite": true,
			"fr": {
				"name": "Mike Donais"
			},
			"health": 8,
			"id": "CRED_36",
			"name": "Mike Donais",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Replace all minions in the battlefield, in both hands, and in both decks with random minions.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "CRED_12.png",
			"cost": 2,
			"elite": true,
			"fr": {
				"name": "Rachelle Davis"
			},
			"health": 2,
			"id": "CRED_12",
			"name": "Rachelle Davis",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Draw TWO cards. <i>She's not a novice engineer.</i>",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_37.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Ricardo Robaina"
			},
			"health": 4,
			"id": "CRED_37",
			"name": "Ricardo Robaina",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Summon three 1/1 Chinchillas.",
			"type": "Minion"
		},
		{
			"attack": 9,
			"cardImage": "CRED_17.png",
			"cost": 9,
			"elite": true,
			"fr": {
				"name": "Rob Pardo"
			},
			"health": 9,
			"id": "CRED_17",
			"name": "Rob Pardo",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "You can't start a game without this minion in your deck.",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "CRED_38.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Robin Fredericksen"
			},
			"health": 4,
			"id": "CRED_38",
			"name": "Robin Fredericksen",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> If you have no other Erics on the battlefield, rename this card to \"Eric\".",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_39.png",
			"cost": 2,
			"elite": true,
			"fr": {
				"name": "Ryan Chew"
			},
			"health": 3,
			"id": "CRED_39",
			"name": "Ryan Chew",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Chews One</b> - Sing karaoke; or Leave on time and tell everyone about it.",
			"type": "Minion"
		},
		{
			"attack": 7,
			"cardImage": "CRED_40.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Ryan Masterson"
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
			"attack": 2,
			"cardImage": "CRED_41.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Seyil Yoon"
			},
			"health": 9,
			"id": "CRED_41",
			"name": "Seyil Yoon",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Add 3 Sprints and a Marathon to your hand.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_04.png",
			"cost": 1,
			"elite": true,
			"fr": {
				"name": "Steven Gabriel"
			},
			"health": 3,
			"id": "CRED_04",
			"name": "Steven Gabriel",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Summon a frothy beverage.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_42.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Tim Erskine"
			},
			"health": 5,
			"id": "CRED_42",
			"name": "Tim Erskine",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Whenever this minion destroys another minion, draw a card.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_44.png",
			"cost": 4,
			"elite": true,
			"fr": {
				"name": "Walter Kong"
			},
			"health": 2,
			"id": "CRED_44",
			"name": "Walter Kong",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Deal 1 damage to each of 2 strategic targets.",
			"type": "Minion"
		},
		{
			"attack": 3,
			"cardImage": "CRED_14.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Yong Woo"
			},
			"health": 2,
			"id": "CRED_14",
			"name": "Yong Woo",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "Your other minions have +3 Attack and <b>Charge</b>.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "CRED_07.png",
			"cost": 2,
			"elite": true,
			"fr": {
				"name": "Zwick"
			},
			"health": 2,
			"id": "CRED_07",
			"name": "Zwick",
			"rarity": "Legendary",
			"set": "Credits",
			"text": "<b>Battlecry:</b> Complain about bacon prices.",
			"type": "Minion"
		},
		{
			"artist": "Daren Bader",
			"attack": 1,
			"cardImage": "NEW1_016.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Pirates and Parrots go together like Virmen and Carrots.",
			"fr": {
				"name": "Perroquet du capitaine"
			},
			"health": 1,
			"howToGet": "Unlocked when you have all the Pirates from the Classic Set.",
			"howToGetGold": "Unlocked when you have all the Golden Pirates from the Classic Set.",
			"id": "NEW1_016",
			"mechanics": [
				"Battlecry"
			],
			"name": "Captain's Parrot",
			"race": "Beast",
			"rarity": "Epic",
			"set": "Reward",
			"text": "<b>Battlecry:</b> Put a random Pirate from your deck into your hand.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "EX1_062.png",
			"collectible": true,
			"cost": 4,
			"elite": true,
			"faction": "Neutral",
			"flavor": "He's a legend among murlocs.  \"Mrghllghghllghg!\", they say.",
			"fr": {
				"name": "Vieux Troublœil"
			},
			"health": 4,
			"howToGet": "Unlocked when you have all the Murlocs from the Classic Set.",
			"howToGetGold": "Unlocked when you have all the Golden Murlocs from the Classic and Basic Sets.",
			"id": "EX1_062",
			"mechanics": [
				"Charge"
			],
			"name": "Old Murk-Eye",
			"race": "Murloc",
			"rarity": "Legendary",
			"set": "Reward",
			"text": "<b>Charge</b>. Has +1 Attack for each other Murloc on the battlefield.",
			"type": "Minion"
		},
		{
			"artist": "Nate Bowden",
			"attack": 5,
			"cardImage": "FP1_026.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Originally he was called \"Anub'ar Guy who bounces a guy back to your hand\", but it lacked a certain zing.",
			"fr": {
				"name": "Embusqué anub’ar"
			},
			"health": 5,
			"howToGet": "Unlocked by completing the Rogue Class Challenge in Naxxramas.",
			"howToGetGold": "Can be crafted after completing the Rogue Class Challenge in Naxxramas.",
			"id": "FP1_026",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Anub'ar Ambusher",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Return a random friendly minion to your hand.",
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
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX1h_01.png",
			"fr": {
				"name": "Anub’Rekhan"
			},
			"health": 45,
			"id": "NAX1h_01",
			"name": "Anub'Rekhan",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"artist": "Zoltan & Gabor",
			"cardImage": "FP1_020.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Several paladins have joined together to deliver justice under the name \"Justice Force\".  Their lawyer talked them out of calling themselves the Justice League.",
			"fr": {
				"name": "Venger"
			},
			"howToGet": "Unlocked by completing the Paladin Class Challenge in Naxxramas.",
			"howToGetGold": "Can be crafted after completing the Paladin Class Challenge in Naxxramas.",
			"id": "FP1_020",
			"mechanics": [
				"Secret"
			],
			"name": "Avenge",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Secret:</b> When one of your minions dies, give a random friendly minion +3/+2.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX9_01.png",
			"fr": {
				"name": "Baron Vaillefendre"
			},
			"health": 7,
			"id": "NAX9_01",
			"name": "Baron Rivendare",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX9_01H.png",
			"fr": {
				"name": "Baron Vaillefendre"
			},
			"health": 14,
			"id": "NAX9_01H",
			"name": "Baron Rivendare",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 1,
			"cardImage": "FP1_031.png",
			"collectible": true,
			"cost": 4,
			"elite": true,
			"flavor": "There used to be five Horsemen but one of them left because a job opened up in the deadmines and the benefits were better.",
			"fr": {
				"name": "Baron Vaillefendre"
			},
			"health": 7,
			"howToGet": "Unlocked by completing the Military Quarter.",
			"howToGetGold": "Can be crafted after completing the Military Quarter.",
			"id": "FP1_031",
			"mechanics": [
				"Aura"
			],
			"name": "Baron Rivendare",
			"rarity": "Legendary",
			"set": "Curse of Naxxramas",
			"text": "Your minions trigger their <b>Deathrattles</b> twice.",
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
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nTake control of a random enemy minion.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX15_04.png",
			"cost": 8,
			"fr": {
				"name": "Chaînes"
			},
			"id": "NAX15_04",
			"name": "Chains",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nTake control of a random enemy minion until end of turn.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Consumer"
			},
			"id": "FP1_005e",
			"name": "Consume",
			"set": "Curse of Naxxramas",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Jon McConnell",
			"attack": 4,
			"cardImage": "FP1_029.png",
			"collectible": true,
			"cost": 3,
			"flavor": "They like to dance to reggae.",
			"fr": {
				"name": "Épées dansantes"
			},
			"health": 4,
			"howToGet": "Unlocked by defeating Instructor Razuvious in the Military Quarter.",
			"howToGetGold": "Can be crafted after defeating Instructor Razuvious in the Military Quarter.",
			"id": "FP1_029",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Dancing Swords",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Your opponent draws a card.",
			"type": "Minion"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 3,
			"cardImage": "FP1_023.png",
			"collectible": true,
			"cost": 3,
			"flavor": "The Cult of the Damned has found it's best not to mention their name when recruiting new cultists.",
			"fr": {
				"name": "Sombre sectateur"
			},
			"health": 4,
			"howToGet": "Unlocked by completing the Priest Class Challenge in Naxxramas.",
			"howToGetGold": "Can be crafted after completing the Priest Class Challenge in Naxxramas.",
			"id": "FP1_023",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Dark Cultist",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Give a random friendly minion +3 Health.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Appel des ténèbres"
			},
			"id": "FP1_028e",
			"name": "Darkness Calls",
			"set": "Curse of Naxxramas",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Jim Nelson",
			"attack": 4,
			"cardImage": "FP1_021.png",
			"collectible": true,
			"cost": 4,
			"durability": 2,
			"flavor": "\"Take a bite outta Death.\" - McScruff the Deathlord",
			"fr": {
				"name": "Morsure de la mort"
			},
			"howToGet": "Unlocked by completing the Warrior Class Challenge in Naxxramas.",
			"howToGetGold": "Can be crafted after completing the Warrior Class Challenge in Naxxramas.",
			"id": "FP1_021",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Death's Bite",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Deal 1 damage to all minions.",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX6_03.png",
			"cost": 4,
			"fr": {
				"name": "Mortelle floraison"
			},
			"id": "NAX6_03",
			"name": "Deathbloom",
			"set": "Curse of Naxxramas",
			"text": "Deal $5 damage to a minion. Summon a Spore.",
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
			"mechanics": [
				"Charge",
				"Deathrattle"
			],
			"name": "Deathcharger",
			"set": "Curse of Naxxramas",
			"text": "<b>Charge. Deathrattle:</b> Deal 3 damage to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Ben Olson",
			"attack": 2,
			"cardImage": "FP1_009.png",
			"collectible": true,
			"cost": 3,
			"flavor": "\"Rise from your grave!\" - Kel'Thuzad",
			"fr": {
				"name": "Seigneur de la mort"
			},
			"health": 8,
			"howToGet": "Unlocked by defeating The Four Horsemen in the Military Quarter.",
			"howToGetGold": "Can be crafted after defeating The Four Horsemen in the Military Quarter.",
			"id": "FP1_009",
			"mechanics": [
				"Deathrattle",
				"Taunt"
			],
			"name": "Deathlord",
			"rarity": "Rare",
			"set": "Curse of Naxxramas",
			"text": "<b>Taunt. Deathrattle:</b> Your opponent puts a minion from their deck into the battlefield.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Décimer"
			},
			"id": "NAX12_02e",
			"name": "Decimate",
			"set": "Curse of Naxxramas",
			"text": "Health changed to 1.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX12_02.png",
			"cost": 2,
			"fr": {
				"name": "Décimer"
			},
			"id": "NAX12_02",
			"name": "Decimate",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nChange the Health of all minions to 1.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX12_02H.png",
			"cost": 0,
			"fr": {
				"name": "Décimer"
			},
			"id": "NAX12_02H",
			"name": "Decimate",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nChange the Health of enemy minions to 1.",
			"type": "Hero Power"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "FP1_018.png",
			"collectible": true,
			"cost": 3,
			"flavor": "The one time when duping cards won't get your account banned!",
			"fr": {
				"name": "Dupliquer"
			},
			"howToGet": "Unlocked by completing the Mage Class Challenge in Naxxramas.",
			"howToGetGold": "Can be crafted after completing the Mage Class Challenge in Naxxramas.",
			"id": "FP1_018",
			"mechanics": [
				"Secret"
			],
			"name": "Duplicate",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Secret:</b> When a friendly minion dies, put 2 copies of it into your hand.",
			"type": "Spell"
		},
		{
			"artist": "Eric Browning",
			"attack": 1,
			"cardImage": "FP1_003.png",
			"collectible": true,
			"cost": 2,
			"flavor": "OOZE... Ooze... Ooze... (ooze...)",
			"fr": {
				"name": "Limon résonnant"
			},
			"health": 2,
			"howToGet": "Unlocked by defeating Sapphiron in the Frostwyrm Lair.",
			"howToGetGold": "Can be crafted after defeating Sapphiron in the Frostwyrm Lair.",
			"id": "FP1_003",
			"mechanics": [
				"Battlecry"
			],
			"name": "Echoing Ooze",
			"rarity": "Epic",
			"set": "Curse of Naxxramas",
			"text": "<b>Battlecry:</b> Summon an exact copy of this minion at the end of the turn.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Accès de rage"
			},
			"id": "NAX12_04e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Enrage",
			"set": "Curse of Naxxramas",
			"text": "+6 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX12_04.png",
			"cost": 3,
			"fr": {
				"name": "Accès de rage"
			},
			"id": "NAX12_04",
			"name": "Enrage",
			"set": "Curse of Naxxramas",
			"text": "Give your hero +6 Attack this turn.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX5_02H.png",
			"cost": 0,
			"fr": {
				"name": "Éruption"
			},
			"id": "NAX5_02H",
			"name": "Eruption",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDeal 3 damage to the left-most enemy minion.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX5_02.png",
			"cost": 1,
			"fr": {
				"name": "Éruption"
			},
			"id": "NAX5_02",
			"name": "Eruption",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDeal 2 damage to the left-most enemy minion.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Double rangée de dents"
			},
			"id": "NAX12_03e",
			"name": "Extra Teeth",
			"set": "Curse of Naxxramas",
			"text": "Increased Attack.",
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
			"set": "Curse of Naxxramas",
			"type": "Minion"
		},
		{
			"attack": 4,
			"cardImage": "NAX13_04H.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Feugen"
			},
			"health": 7,
			"id": "NAX13_04H",
			"name": "Feugen",
			"rarity": "Legendary",
			"set": "Curse of Naxxramas",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 4,
			"cardImage": "FP1_015.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"flavor": "Feugen is sad because everyone likes Stalagg better.",
			"fr": {
				"name": "Feugen"
			},
			"health": 7,
			"howToGet": "Unlocked by completing the Construct Quarter.",
			"howToGetGold": "Can be crafted after completing the Construct Quarter.",
			"id": "FP1_015",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Feugen",
			"rarity": "Legendary",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> If Stalagg also died this game, summon Thaddius.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX15_02.png",
			"cost": 0,
			"fr": {
				"name": "Trait de givre"
			},
			"id": "NAX15_02",
			"mechanics": [
				"Freeze"
			],
			"name": "Frost Blast",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDeal 2 damage to the enemy hero and <b>Freeze</b> it.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX15_02H.png",
			"cost": 0,
			"fr": {
				"name": "Trait de givre"
			},
			"id": "NAX15_02H",
			"mechanics": [
				"Freeze"
			],
			"name": "Frost Blast",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDeal 3 damage to the enemy hero and <b>Freeze</b> it.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX14_02.png",
			"cost": 0,
			"fr": {
				"name": "Souffle de givre"
			},
			"id": "NAX14_02",
			"name": "Frost Breath",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDestroy all enemy minions that aren't <b>Frozen</b>.",
			"type": "Hero Power"
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
			"mechanics": [
				"Aura"
			],
			"name": "Frozen Champion",
			"set": "Curse of Naxxramas",
			"text": "Permanently Frozen.  Adjacent minions are Immune to Frost Breath.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Croissance fongique"
			},
			"id": "NAX6_03te",
			"name": "Fungal Growth",
			"set": "Curse of Naxxramas",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX12_01H.png",
			"fr": {
				"name": "Gluth"
			},
			"health": 45,
			"id": "NAX12_01H",
			"name": "Gluth",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX12_01.png",
			"fr": {
				"name": "Gluth"
			},
			"health": 30,
			"id": "NAX12_01",
			"name": "Gluth",
			"set": "Curse of Naxxramas",
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
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX8_01H.png",
			"fr": {
				"name": "Gothik le Moissonneur"
			},
			"health": 45,
			"id": "NAX8_01H",
			"name": "Gothik the Harvester",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX2_01H.png",
			"fr": {
				"name": "Grande veuve Faerlina"
			},
			"health": 45,
			"id": "NAX2_01H",
			"name": "Grand Widow Faerlina",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX2_01.png",
			"fr": {
				"name": "Grande veuve Faerlina"
			},
			"health": 30,
			"id": "NAX2_01",
			"name": "Grand Widow Faerlina",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX11_01H.png",
			"fr": {
				"name": "Grobbulus"
			},
			"health": 45,
			"id": "NAX11_01H",
			"name": "Grobbulus",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX11_01.png",
			"fr": {
				"name": "Grobbulus"
			},
			"health": 30,
			"id": "NAX11_01",
			"name": "Grobbulus",
			"set": "Curse of Naxxramas",
			"type": "Hero"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Guardian of Icecrown",
			"set": "Curse of Naxxramas",
			"text": "<b>Taunt</b>",
			"type": "Minion"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Guardian of Icecrown",
			"set": "Curse of Naxxramas",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "NAX8_02.png",
			"cost": 2,
			"fr": {
				"name": "Moisson"
			},
			"id": "NAX8_02",
			"name": "Harvest",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDraw a card.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX8_02H.png",
			"cost": 1,
			"fr": {
				"name": "Moisson"
			},
			"id": "NAX8_02H",
			"name": "Harvest",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDraw a card. Gain a Mana Crystal.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX10_03H.png",
			"cost": 4,
			"fr": {
				"name": "Frappe haineuse"
			},
			"id": "NAX10_03H",
			"name": "Hateful Strike",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDestroy a minion.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX10_03.png",
			"cost": 4,
			"fr": {
				"name": "Frappe haineuse"
			},
			"id": "NAX10_03",
			"name": "Hateful Strike",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDestroy a minion.",
			"type": "Hero Power"
		},
		{
			"artist": "Jeremy Cranford",
			"attack": 1,
			"cardImage": "FP1_002.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Arachnofauxbia: Fear of fake spiders.",
			"fr": {
				"name": "Rampante hantée"
			},
			"health": 2,
			"howToGet": "Unlocked by defeating Anub'Rekhan in the Arachnid Quarter.",
			"howToGetGold": "Can be crafted after defeating Anub'Rekhan in the Arachnid Quarter.",
			"id": "FP1_002",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Haunted Creeper",
			"race": "Beast",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Summon two 1/1 Spectral Spiders.",
			"type": "Minion"
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
			"set": "Curse of Naxxramas",
			"type": "Hero"
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
			"set": "Curse of Naxxramas",
			"type": "Hero"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Hook",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Put this weapon into your hand.",
			"type": "Weapon"
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
			"mechanics": [
				"Deathrattle",
				"Windfury"
			],
			"name": "Hook",
			"set": "Curse of Naxxramas",
			"text": "<b>Windfury</b>\n<b>Deathrattle:</b> Put this weapon into your hand.",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX7_01H.png",
			"fr": {
				"name": "Instructeur Razuvious"
			},
			"health": 55,
			"id": "NAX7_01H",
			"name": "Instructor Razuvious",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX7_01.png",
			"fr": {
				"name": "Instructeur Razuvious"
			},
			"health": 40,
			"id": "NAX7_01",
			"name": "Instructor Razuvious",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"fr": {
				"name": "Intrus !"
			},
			"id": "NAX15_01He",
			"name": "Interloper!",
			"set": "Curse of Naxxramas",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Intrus !"
			},
			"id": "NAX15_01e",
			"name": "Interloper!",
			"set": "Curse of Naxxramas",
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
			"set": "Curse of Naxxramas",
			"text": "Whenever a minion with <b>Deathrattle</b> dies, gain +2 Attack.",
			"type": "Weapon"
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
			"set": "Curse of Naxxramas",
			"text": "Whenever a minion with <b>Deathrattle</b> dies, gain +2 Attack.",
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
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX15_01.png",
			"fr": {
				"name": "Kel’Thuzad"
			},
			"health": 30,
			"id": "NAX15_01",
			"name": "Kel'Thuzad",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"artist": "Chris Robinson",
			"attack": 6,
			"cardImage": "FP1_013.png",
			"collectible": true,
			"cost": 8,
			"elite": true,
			"flavor": "Kel'Thuzad could not resist the call of the Lich King. Even when it's just a robo-call extolling the Lich King's virtues.",
			"fr": {
				"name": "Kel’Thuzad"
			},
			"health": 8,
			"howToGet": "Unlocked by defeating every boss in Naxxramas!",
			"howToGetGold": "Can be crafted after defeating every boss in Naxxramas!",
			"id": "FP1_013",
			"name": "Kel'Thuzad",
			"rarity": "Legendary",
			"set": "Curse of Naxxramas",
			"text": "At the end of each turn, summon all friendly minions that died this turn.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NAX9_02H.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Dame Blaumeux"
			},
			"health": 7,
			"id": "NAX9_02H",
			"name": "Lady Blaumeux",
			"set": "Curse of Naxxramas",
			"text": "Your hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "NAX9_02.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Dame Blaumeux"
			},
			"health": 7,
			"id": "NAX9_02",
			"name": "Lady Blaumeux",
			"set": "Curse of Naxxramas",
			"text": "Your hero is <b>Immune</b>.",
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
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX6_01.png",
			"fr": {
				"name": "Horreb"
			},
			"health": 75,
			"id": "NAX6_01",
			"name": "Loatheb",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"artist": "Samwise",
			"attack": 5,
			"cardImage": "FP1_030.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"flavor": "Loatheb used to be a simple Bog Beast.  This is why we need stricter regulations on mining and agriculture.",
			"fr": {
				"name": "Horreb"
			},
			"health": 5,
			"howToGet": "Unlocked by completing the Plague Quarter.",
			"howToGetGold": "Can be crafted after completing the Plague Quarter.",
			"id": "FP1_030",
			"mechanics": [
				"Battlecry"
			],
			"name": "Loatheb",
			"rarity": "Legendary",
			"set": "Curse of Naxxramas",
			"text": "<b>Battlecry:</b> Enemy spells cost (5) more next turn.",
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
			"set": "Curse of Naxxramas",
			"text": "Deal $3 damage to all enemy minions. Restore #3 Health to your hero.",
			"type": "Spell"
		},
		{
			"artist": "James Ryman",
			"attack": 2,
			"cardImage": "FP1_004.png",
			"collectible": true,
			"cost": 2,
			"flavor": "His mother wanted him to be a mage or a warlock, but noooooooo, he had to go and be a scientist like his father.",
			"fr": {
				"name": "Savant fou"
			},
			"health": 2,
			"howToGet": "Unlocked by defeating Grobbulus in the Construct Quarter.",
			"howToGetGold": "Can be crafted after defeating Grobbulus in the Construct Quarter.",
			"id": "FP1_004",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Mad Scientist",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Put a <b>Secret</b> from your deck into the battlefield.",
			"type": "Minion"
		},
		{
			"artist": "Howard Lyon",
			"attack": 2,
			"cardImage": "FP1_010.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "Maexxna gets super mad when people introduce her as \"Maxina\" or \"Maxxy\".",
			"fr": {
				"name": "Maexxna"
			},
			"health": 8,
			"howToGet": "Unlocked by completing the Arachnid Quarter.",
			"howToGetGold": "Can be crafted after completing the Arachnid Quarter.",
			"id": "FP1_010",
			"mechanics": [
				"Poisonous"
			],
			"name": "Maexxna",
			"race": "Beast",
			"rarity": "Legendary",
			"set": "Curse of Naxxramas",
			"text": "Destroy any minion damaged by this minion.",
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
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX3_01.png",
			"fr": {
				"name": "Maexxna"
			},
			"health": 30,
			"id": "NAX3_01",
			"name": "Maexxna",
			"set": "Curse of Naxxramas",
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
			"set": "Curse of Naxxramas",
			"text": "Give your minions and your weapon +1/+1.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Marque des cavaliers"
			},
			"id": "NAX9_07e",
			"name": "Mark of the Horsemen",
			"set": "Curse of Naxxramas",
			"text": "+1/+1.",
			"type": "Enchantment"
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
			"set": "Curse of Naxxramas",
			"text": "Deals double damage to heroes.",
			"type": "Weapon"
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
			"set": "Curse of Naxxramas",
			"text": "Deals double damage to heroes.",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX7_05.png",
			"cost": 1,
			"fr": {
				"name": "Cristal de contrôle mental"
			},
			"id": "NAX7_05",
			"name": "Mind Control Crystal",
			"set": "Curse of Naxxramas",
			"text": "Activate the Crystal to control the Understudies!",
			"type": "Spell"
		},
		{
			"cardImage": "NAX5_03.png",
			"cost": 2,
			"fr": {
				"name": "Cervocalypse"
			},
			"id": "NAX5_03",
			"name": "Mindpocalypse",
			"set": "Curse of Naxxramas",
			"text": "Both players draw 2 cards and gain a Mana Crystal.",
			"type": "Spell"
		},
		{
			"attack": 1,
			"cardImage": "NAX15_05.png",
			"cost": 0,
			"elite": true,
			"fr": {
				"name": "M. Bigglesworth"
			},
			"health": 1,
			"id": "NAX15_05",
			"name": "Mr. Bigglesworth",
			"race": "Beast",
			"rarity": "Legendary",
			"set": "Curse of Naxxramas",
			"text": "<i>This is Kel'Thuzad's kitty.</i>",
			"type": "Minion"
		},
		{
			"cardImage": "NAX11_04.png",
			"cost": 3,
			"fr": {
				"name": "Injection mutante"
			},
			"id": "NAX11_04",
			"name": "Mutating Injection",
			"set": "Curse of Naxxramas",
			"text": "Give a minion +4/+4 and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Injection mutante"
			},
			"id": "NAX11_04e",
			"name": "Mutating Injection",
			"set": "Curse of Naxxramas",
			"text": "+4/+4 and <b>Taunt</b>.",
			"type": "Enchantment"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Necroknight",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Destroy the minions next to this one as well.",
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
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDeal 3 damage to the enemy hero.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX6_02H.png",
			"cost": 0,
			"fr": {
				"name": "Aura nécrotique"
			},
			"id": "NAX6_02H",
			"name": "Necrotic Aura",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDeal 3 damage to the enemy hero.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Aura nécrotique"
			},
			"id": "FP1_030e",
			"name": "Necrotic Aura",
			"set": "Curse of Naxxramas",
			"text": "Your spells cost (5) more this turn.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX3_03.png",
			"cost": 2,
			"fr": {
				"name": "Poison nécrotique"
			},
			"id": "NAX3_03",
			"name": "Necrotic Poison",
			"set": "Curse of Naxxramas",
			"text": "Destroy a minion.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 1,
			"cardImage": "FP1_017.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Weblords spend all day making giant trampoline parks.",
			"fr": {
				"name": "Seigneur de la toile nérub’ar"
			},
			"health": 4,
			"howToGet": "Unlocked by defeating Grand Widow Faerlina in the Arachnid Quarter.",
			"howToGetGold": "Can be crafted after defeating Grand Widow Faerlina in the Arachnid Quarter.",
			"id": "FP1_017",
			"mechanics": [
				"Aura"
			],
			"name": "Nerub'ar Weblord",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "Minions with <b>Battlecry</b> cost (2) more.",
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
			"set": "Curse of Naxxramas",
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
			"set": "Curse of Naxxramas",
			"type": "Minion"
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
			"set": "Curse of Naxxramas",
			"type": "Minion"
		},
		{
			"artist": "Justin Thavirat",
			"attack": 0,
			"cardImage": "FP1_007.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Eggs are a good source of protein and Nerubians.",
			"fr": {
				"name": "Œuf de nérubien"
			},
			"health": 2,
			"howToGet": "Unlocked by defeating Maexxna in the Arachnid Quarter.",
			"howToGetGold": "Can be crafted after defeating Maexxna in the Arachnid Quarter.",
			"id": "FP1_007",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Nerubian Egg",
			"rarity": "Rare",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Summon a 4/4 Nerubian.",
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
			"set": "Curse of Naxxramas",
			"type": "Hero"
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
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX10_01H.png",
			"fr": {
				"name": "Le Recousu"
			},
			"health": 45,
			"id": "NAX10_01H",
			"name": "Patchwerk",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX10_01.png",
			"fr": {
				"name": "Le Recousu"
			},
			"health": 30,
			"id": "NAX10_01",
			"name": "Patchwerk",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX4_05.png",
			"cost": 6,
			"fr": {
				"name": "Peste"
			},
			"id": "NAX4_05",
			"name": "Plague",
			"set": "Curse of Naxxramas",
			"text": "Destroy all non-Skeleton minions.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX11_02.png",
			"cost": 2,
			"fr": {
				"name": "Nuage empoisonné"
			},
			"id": "NAX11_02",
			"name": "Poison Cloud",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDeal 1 damage to all minions. If any die, summon a slime.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX11_02H.png",
			"cost": 0,
			"fr": {
				"name": "Nuage empoisonné"
			},
			"id": "NAX11_02H",
			"name": "Poison Cloud",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDeal 2 damage to all enemies. If any die, summon a slime.",
			"type": "Hero Power"
		},
		{
			"artist": "Brian Despain",
			"cardImage": "FP1_019.png",
			"collectible": true,
			"cost": 4,
			"flavor": "\"Poisonseed Bagel\" is the least popular bagel at McTiggin's Druidic Bagel Emporium.",
			"fr": {
				"name": "Graines de poison"
			},
			"howToGet": "Unlocked by completing the Druid Class Challenge in Naxxramas.",
			"howToGetGold": "Can be crafted after completing the Druid Class Challenge in Naxxramas.",
			"id": "FP1_019",
			"name": "Poison Seeds",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "Destroy all minions and summon 2/2 Treants to replace them.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Polarité"
			},
			"id": "NAX13_02e",
			"name": "Polarity",
			"set": "Curse of Naxxramas",
			"text": "Attack and Health swapped.",
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
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nSwap the Attack and Health of all minions.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Puissance de la ziggourat"
			},
			"id": "FP1_023e",
			"name": "Power of the Ziggurat",
			"playerClass": "Priest",
			"set": "Curse of Naxxramas",
			"text": "+3 Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "NAX14_04.png",
			"cost": 5,
			"fr": {
				"name": "Froid absolu"
			},
			"id": "NAX14_04",
			"mechanics": [
				"Freeze"
			],
			"name": "Pure Cold",
			"set": "Curse of Naxxramas",
			"text": "Deal $8 damage to the enemy hero, and <b>Freeze</b> it.",
			"type": "Spell"
		},
		{
			"cardImage": "NAX2_03.png",
			"cost": 2,
			"fr": {
				"name": "Pluie de feu"
			},
			"id": "NAX2_03",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Rain of Fire",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nFire a missile for each card in your opponent's hand.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX2_03H.png",
			"cost": 1,
			"fr": {
				"name": "Pluie de feu"
			},
			"id": "NAX2_03H",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Rain of Fire",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nFire a missile for each card in your opponent's hand.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX4_04.png",
			"cost": 0,
			"fr": {
				"name": "Réanimation morbide"
			},
			"id": "NAX4_04",
			"name": "Raise Dead",
			"set": "Curse of Naxxramas",
			"text": "<b>Passive Hero Power</b>\nWhenever an enemy dies, raise a 1/1 Skeleton.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX4_04H.png",
			"cost": 0,
			"fr": {
				"name": "Réanimation morbide"
			},
			"id": "NAX4_04H",
			"name": "Raise Dead",
			"set": "Curse of Naxxramas",
			"text": "<b>Passive Hero Power</b>\nWhenever an enemy dies, raise a 5/5 Skeleton.",
			"type": "Hero Power"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "FP1_025.png",
			"collectible": true,
			"cost": 2,
			"flavor": "It's like birth, except you're an adult and you were just dead a second ago.",
			"fr": {
				"name": "Réincarnation"
			},
			"howToGet": "Unlocked by completing the Shaman Class Challenge in Naxxramas.",
			"howToGetGold": "Can be crafted after completing the Shaman Class Challenge in Naxxramas.",
			"id": "FP1_025",
			"name": "Reincarnate",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "Destroy a minion, then return it to life with full Health.",
			"type": "Spell"
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
			"set": "Curse of Naxxramas",
			"text": "Has +6 Attack if the other Horsemen are dead.",
			"type": "Weapon"
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
			"set": "Curse of Naxxramas",
			"text": "Has +3 Attack if the other Horsemen are dead.",
			"type": "Weapon"
		},
		{
			"cardImage": "NAX14_01H.png",
			"fr": {
				"name": "Saphiron"
			},
			"health": 45,
			"id": "NAX14_01H",
			"name": "Sapphiron",
			"set": "Curse of Naxxramas",
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
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"artist": "Ittoku Seta",
			"attack": 2,
			"cardImage": "FP1_005.png",
			"collectible": true,
			"cost": 3,
			"flavor": "The Shades of Naxxramas <i>hate</i> the living. They even have a slur they use to refer them: <i>Livers</i>.",
			"fr": {
				"name": "Ombre de Naxxramas"
			},
			"health": 2,
			"howToGet": "Unlocked by defeating Kel'Thuzad in the Frostwyrm Lair.",
			"howToGetGold": "Can be crafted after defeating Kel'Thuzad in the Frostwyrm Lair.",
			"id": "FP1_005",
			"mechanics": [
				"Stealth"
			],
			"name": "Shade of Naxxramas",
			"rarity": "Epic",
			"set": "Curse of Naxxramas",
			"text": "<b>Stealth.</b> At the start of your turn, gain +1/+1.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "NAX9_04.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Sire Zeliek"
			},
			"health": 7,
			"id": "NAX9_04",
			"name": "Sir Zeliek",
			"set": "Curse of Naxxramas",
			"text": "Your hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NAX9_04H.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Sire Zeliek"
			},
			"health": 7,
			"id": "NAX9_04H",
			"name": "Sir Zeliek",
			"set": "Curse of Naxxramas",
			"text": "Your hero is <b>Immune</b>.",
			"type": "Minion"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Skeletal Smith",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Destroy your opponent's weapon.",
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
			"set": "Curse of Naxxramas",
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
			"set": "Curse of Naxxramas",
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
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nSummon a 4/4 Nerubian.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX1_04.png",
			"cost": 2,
			"fr": {
				"name": "Grouillement"
			},
			"id": "NAX1_04",
			"name": "Skitter",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nSummon a 3/1 Nerubian.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Esclave de Kel’Thuzad"
			},
			"id": "NAX15_04a",
			"name": "Slave of Kel'Thuzad",
			"set": "Curse of Naxxramas",
			"text": "MINE!",
			"type": "Enchantment"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Slime",
			"set": "Curse of Naxxramas",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Nate Bowden",
			"attack": 3,
			"cardImage": "FP1_012.png",
			"collectible": true,
			"cost": 5,
			"flavor": "DO NOT GIVE HIM A ROOT BEER.",
			"fr": {
				"name": "Crache-vase"
			},
			"health": 5,
			"howToGet": "Unlocked by defeating Loatheb in the Plague Quarter.",
			"howToGetGold": "Can be crafted after defeating Loatheb in the Plague Quarter.",
			"id": "FP1_012",
			"mechanics": [
				"Deathrattle",
				"Taunt"
			],
			"name": "Sludge Belcher",
			"rarity": "Rare",
			"set": "Curse of Naxxramas",
			"text": "<b>Taunt.\nDeathrattle:</b> Summon a 1/2 Slime with <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"artist": "Chris Rahn",
			"attack": 4,
			"cardImage": "FP1_008.png",
			"collectible": true,
			"cost": 5,
			"flavor": "What do Faerie Dragons and Spectral Knights have in common?  They both love pasta!",
			"fr": {
				"name": "Chevalier de la mort spectral"
			},
			"health": 6,
			"howToGet": "Unlocked by defeating Gothik the Harvester in the Military Quarter.",
			"howToGetGold": "Can be crafted after defeating Gothik the Harvester in the Military Quarter.",
			"id": "FP1_008",
			"name": "Spectral Knight",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "Can't be targeted by spells or Hero Powers.",
			"type": "Minion"
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
			"set": "Curse of Naxxramas",
			"text": "At the start of your turn, deal 1 damage to your hero.",
			"type": "Minion"
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
			"set": "Curse of Naxxramas",
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
			"set": "Curse of Naxxramas",
			"text": "At the start of your turn, deal 1 damage to your hero.",
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
			"set": "Curse of Naxxramas",
			"text": "At the start of your turn, deal 1 damage to your hero.",
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Spore",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Give all enemy minions +8 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX6_04.png",
			"cost": 1,
			"fr": {
				"name": "Explosion de spores"
			},
			"id": "NAX6_04",
			"name": "Sporeburst",
			"set": "Curse of Naxxramas",
			"text": "Deal $1 damage to all enemy minions. Summon a Spore.",
			"type": "Spell"
		},
		{
			"attack": 7,
			"cardImage": "NAX13_05H.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Stalagg"
			},
			"health": 4,
			"id": "NAX13_05H",
			"name": "Stalagg",
			"rarity": "Legendary",
			"set": "Curse of Naxxramas",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 7,
			"cardImage": "FP1_014.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"flavor": "Stalagg want to write own flavor text.  \"STALAGG AWESOME!\"",
			"fr": {
				"name": "Stalagg"
			},
			"health": 4,
			"howToGet": "Unlocked by completing the Construct Quarter.",
			"howToGetGold": "Can be crafted after completing the Construct Quarter.",
			"id": "FP1_014",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Stalagg",
			"rarity": "Legendary",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> If Feugen also died this game, summon Thaddius.",
			"type": "Minion"
		},
		{
			"artist": "Matt Smith",
			"attack": 1,
			"cardImage": "FP1_027.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Stoneskin Gargoyles love freeze tag.",
			"fr": {
				"name": "Gargouille peau-de-pierre"
			},
			"health": 4,
			"howToGet": "Unlocked by defeating Noth the Plaguebringer in the Plague Quarter.",
			"howToGetGold": "Can be crafted after defeating Noth the Plaguebringer in the Plague Quarter.",
			"id": "FP1_027",
			"name": "Stoneskin Gargoyle",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "At the start of your turn, restore this minion to full Health.",
			"type": "Minion"
		},
		{
			"cardImage": "NAX13_03.png",
			"cost": 2,
			"fr": {
				"name": "Supercharge"
			},
			"id": "NAX13_03",
			"name": "Supercharge",
			"set": "Curse of Naxxramas",
			"text": "Give your minions +2 Health.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "État de supercharge"
			},
			"id": "NAX13_03e",
			"name": "Supercharged",
			"set": "Curse of Naxxramas",
			"text": "+2 Health.",
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
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"cardImage": "NAX13_01.png",
			"fr": {
				"name": "Thaddius"
			},
			"health": 30,
			"id": "NAX13_01",
			"name": "Thaddius",
			"set": "Curse of Naxxramas",
			"type": "Hero"
		},
		{
			"attack": 11,
			"cardImage": "FP1_014t.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "Thaddius"
			},
			"health": 11,
			"id": "FP1_014t",
			"name": "Thaddius",
			"rarity": "Legendary",
			"set": "Curse of Naxxramas",
			"type": "Minion"
		},
		{
			"attack": 2,
			"cardImage": "NAX9_03H.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Thane Korth’azz"
			},
			"health": 7,
			"id": "NAX9_03H",
			"name": "Thane Korth'azz",
			"set": "Curse of Naxxramas",
			"text": "Your hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "NAX9_03.png",
			"cost": 3,
			"elite": true,
			"fr": {
				"name": "Thane Korth’azz"
			},
			"health": 7,
			"id": "NAX9_03",
			"name": "Thane Korth'azz",
			"set": "Curse of Naxxramas",
			"text": "Your hero is <b>Immune</b>.",
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
			"set": "Curse of Naxxramas",
			"type": "Minion"
		},
		{
			"cardImage": "NAX7_03.png",
			"cost": 2,
			"fr": {
				"name": "Frappe déséquilibrante"
			},
			"id": "NAX7_03",
			"name": "Unbalancing Strike",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDeal 3 damage.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX7_03H.png",
			"cost": 1,
			"fr": {
				"name": "Frappe déséquilibrante"
			},
			"id": "NAX7_03H",
			"name": "Unbalancing Strike",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDeal 4 damage.",
			"type": "Hero Power"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Understudy",
			"set": "Curse of Naxxramas",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"attack": 1,
			"cardImage": "FP1_028.png",
			"collectible": true,
			"cost": 1,
			"flavor": "In a world where you can run to a spirit healer and resurrect yourself, Undertakers do pretty light business.",
			"fr": {
				"name": "Fossoyeur"
			},
			"health": 2,
			"howToGet": "Unlocked by defeating Patchwerk in the Construct Quarter.",
			"howToGetGold": "Can be crafted after defeating Patchwerk in the Construct Quarter.",
			"id": "FP1_028",
			"name": "Undertaker",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "Whenever you summon a minion with <b>Deathrattle</b>, gain +1 Attack.",
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
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nDraw 2 cards.",
			"type": "Hero Power"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Unrelenting Rider",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Summon a Spectral Rider for your opponent.",
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Unrelenting Trainee",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Summon a Spectral Trainee for your opponent.",
			"type": "Minion"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Unrelenting Warrior",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Summon a Spectral Warrior for your opponent.",
			"type": "Minion"
		},
		{
			"artist": "Mike Nicholson",
			"attack": 1,
			"cardImage": "FP1_024.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Filling your Ghouls with Rocket Fuel is all the rage at Necromancer school.",
			"fr": {
				"name": "Goule instable"
			},
			"health": 3,
			"howToGet": "Unlocked by defeating Heigan the Unclean in the Plague Quarter.",
			"howToGetGold": "Can be crafted after defeating Heigan the Unclean in the Plague Quarter.",
			"id": "FP1_024",
			"mechanics": [
				"Deathrattle",
				"Taunt"
			],
			"name": "Unstable Ghoul",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Taunt</b>. <b>Deathrattle:</b> Deal 1 damage to all minions.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Vengeance"
			},
			"id": "FP1_020e",
			"name": "Vengeance",
			"playerClass": "Paladin",
			"set": "Curse of Naxxramas",
			"text": "+3/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Robb Shoberg",
			"attack": 3,
			"cardImage": "FP1_022.png",
			"collectible": true,
			"cost": 4,
			"flavor": "\"Void!  Here, void!  Here, buddy!\"",
			"fr": {
				"name": "Implorateur du Vide"
			},
			"health": 4,
			"howToGet": "Unlocked by completing the Warlock Class Challenge in Naxxramas.",
			"howToGetGold": "Can be crafted after completing the Warlock Class Challenge in Naxxramas.",
			"id": "FP1_022",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Voidcaller",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Put a random Demon from your hand into the battlefield.",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 3,
			"cardImage": "FP1_016.png",
			"collectible": true,
			"cost": 4,
			"flavor": "This soul just <i>wails</i> on you. Dang, soul, let up already.",
			"fr": {
				"name": "Âme gémissante"
			},
			"health": 5,
			"howToGet": "Unlocked by defeating Thaddius in the Construct Quarter.",
			"howToGetGold": "Can be crafted after defeating Thaddius in the Construct Quarter.",
			"id": "FP1_016",
			"mechanics": [
				"Battlecry"
			],
			"name": "Wailing Soul",
			"rarity": "Rare",
			"set": "Curse of Naxxramas",
			"text": "<b>Battlecry: Silence</b> your other minions.",
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
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nReturn a random enemy minion to your opponent's hand.",
			"type": "Hero Power"
		},
		{
			"cardImage": "NAX3_02H.png",
			"cost": 0,
			"fr": {
				"name": "Entoilage"
			},
			"id": "NAX3_02H",
			"name": "Web Wrap",
			"set": "Curse of Naxxramas",
			"text": "<b>Hero Power</b>\nReturn 2 random enemy minions to your opponent's hand.",
			"type": "Hero Power"
		},
		{
			"artist": "Dan Brereton",
			"attack": 1,
			"cardImage": "FP1_011.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Spider cocoons are like little piñatas!",
			"fr": {
				"name": "Tisseuse"
			},
			"health": 1,
			"howToGet": "Unlocked by completing the Hunter Class Challenge in Naxxramas.",
			"howToGetGold": "Can be crafted after completing the Hunter Class Challenge in Naxxramas.",
			"id": "FP1_011",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Webspinner",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Add a random Beast card to your hand.",
			"type": "Minion"
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
			"mechanics": [
				"Aura"
			],
			"name": "Worshipper",
			"set": "Curse of Naxxramas",
			"text": "Your hero has +1 Attack on your turn.",
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
			"mechanics": [
				"Aura"
			],
			"name": "Worshipper",
			"set": "Curse of Naxxramas",
			"text": "Your hero has +3 Attack on your turn.",
			"type": "Minion"
		},
		{
			"artist": "E. M. Gist",
			"attack": 2,
			"cardImage": "FP1_001.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Zombie.  It's what's for dinner.",
			"fr": {
				"name": "Croq’zombie"
			},
			"health": 3,
			"howToGet": "Unlocked by defeating Gluth in the Construct Quarter.",
			"howToGetGold": "Can be crafted after defeating Gluth in the Construct Quarter.",
			"id": "FP1_001",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Zombie Chow",
			"rarity": "Common",
			"set": "Curse of Naxxramas",
			"text": "<b>Deathrattle:</b> Restore 5 Health to the enemy hero.",
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
			"set": "Debug",
			"text": "Give a player's weapon -1 Durability.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_055.png",
			"cost": 0,
			"fr": {
				"name": "1000 Stats"
			},
			"id": "XXX_055",
			"name": "1000 Stats",
			"set": "Debug",
			"text": "Give a Minion +1000/+1000",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "1000 Stats Enchant"
			},
			"id": "XXX_055e",
			"name": "1000 Stats Enchant",
			"set": "Debug",
			"type": "Enchantment"
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
			"set": "Debug",
			"text": "Spawn into play to give all minions <b>Charge</b>.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cost": 0,
			"fr": {
				"name": "AI Buddy - Blank Slate"
			},
			"health": 1,
			"id": "XXX_094",
			"name": "AI Buddy - Blank Slate",
			"set": "Debug",
			"text": "Spawn into play to clear the entire board, both hands, both decks, all mana and all secrets.",
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
			"set": "Debug",
			"text": "Spawn into play to smack your own hero for 5.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "XXX_097.png",
			"cost": 0,
			"durability": 0,
			"fr": {
				"name": "AI Buddy - Destroy Minions"
			},
			"health": 1,
			"id": "XXX_097",
			"name": "AI Buddy - Destroy Minions",
			"set": "Debug",
			"text": "Spawn into play to destroy all minions.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "XXX_098.png",
			"cost": 0,
			"durability": 0,
			"fr": {
				"name": "AI Buddy - No Deck/Hand"
			},
			"health": 1,
			"id": "XXX_098",
			"name": "AI Buddy - No Deck/Hand",
			"set": "Debug",
			"text": "Spawn into play to destroy the AI's Hand and Deck.",
			"type": "Minion"
		},
		{
			"attack": 1,
			"cardImage": "XXX_099.png",
			"cost": 0,
			"durability": 0,
			"elite": false,
			"fr": {
				"name": "AI Helper Buddy"
			},
			"health": 1,
			"id": "XXX_099",
			"name": "AI Helper Buddy",
			"set": "Debug",
			"text": "Get the AI ready for testing.",
			"type": "Minion"
		},
		{
			"cost": 0,
			"fr": {
				"name": "Armor 1"
			},
			"id": "XXX_061",
			"name": "Armor 1",
			"set": "Debug",
			"text": "Give target Hero +1 Armor",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_053.png",
			"cost": 0,
			"fr": {
				"name": "Armor 100"
			},
			"id": "XXX_053",
			"name": "Armor 100",
			"set": "Debug",
			"text": "Give target Hero +100 Armor",
			"type": "Spell"
		},
		{
			"cost": 0,
			"fr": {
				"name": "Armor 5"
			},
			"id": "XXX_062",
			"name": "Armor 5",
			"set": "Debug",
			"text": "Give target Hero +5 Armor",
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
			"set": "Debug",
			"text": "Become Hogger for Video Recording.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Return a minion to its owner's hand.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Destroy a hero's weapon.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Crash the game.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_001.png",
			"cost": 0,
			"fr": {
				"name": "Damage 1"
			},
			"id": "XXX_001",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Damage 1",
			"rarity": "Common",
			"set": "Debug",
			"text": "Deal 1 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_002.png",
			"cost": 0,
			"fr": {
				"name": "Damage 5"
			},
			"id": "XXX_002",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Damage 5",
			"rarity": "Common",
			"set": "Debug",
			"text": "Deal 5 damage.",
			"type": "Spell"
		},
		{
			"cost": 0,
			"fr": {
				"name": "Damage All"
			},
			"id": "XXX_060",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Damage All",
			"set": "Debug",
			"text": "Set the Health of a character to 0.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_020.png",
			"cost": 0,
			"fr": {
				"name": "Damage all but 1"
			},
			"id": "XXX_020",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Damage all but 1",
			"rarity": "Common",
			"set": "Debug",
			"text": "Set the Health of a character to 1.",
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
			"set": "Debug",
			"text": "Whenever this minion takes damage, deal 1 damage to ALL other characters.",
			"type": "Minion"
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
			"set": "Debug",
			"text": "Destroy a minion or hero.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Pick a player and destroy one of his Mana Crystals.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Destroy all heroes.",
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
			"set": "Debug",
			"text": "Destroy all of a player's Mana Crystals.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Destroy all minions.",
			"type": "Spell"
		},
		{
			"cost": 0,
			"fr": {
				"name": "Destroy ALL Secrets"
			},
			"id": "XXX_063",
			"name": "Destroy ALL Secrets",
			"set": "Debug",
			"text": "Destroy all <b>Secrets:</b>.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Delete an opponent's deck",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Destroy a player's Hero Power.",
			"type": "Spell"
		},
		{
			"cost": 0,
			"fr": {
				"name": "Destroy Hero's Stuff"
			},
			"id": "XXX_059",
			"name": "Destroy Hero's Stuff",
			"set": "Debug",
			"text": "Destroy target hero's hero power, weapon, deck, hand, minions, and secrets.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_057.png",
			"cost": 0,
			"fr": {
				"name": "Destroy Target Secrets"
			},
			"id": "XXX_057",
			"name": "Destroy Target Secrets",
			"set": "Debug",
			"text": "Choose a hero. Destroy all <b>Secrets</b> controlled by that hero.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Choose a hero.  That hero's controller discards his hand.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "This does nothing.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Draw 3 cards.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Empty Enchant"
			},
			"id": "XXX_009e",
			"name": "Empty Enchant",
			"rarity": "Common",
			"set": "Debug",
			"text": "This enchantment does nothing.",
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
			"set": "Debug",
			"text": "Enable emotes for your VS.AI game. (not in tutorials, though)",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Give a character Charge and make him able to attack!",
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
			"set": "Debug",
			"text": "Enchant a minion with an empty enchant.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Force the AI to use their Hero Power every turn from now on.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Your cards cost (0) for the rest of the game.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Free Cards"
			},
			"id": "XXX_022e",
			"name": "Free Cards",
			"set": "Debug",
			"text": "Your cards cost (0) for the rest of the game.",
			"type": "Enchantment"
		},
		{
			"cardImage": "XXX_008.png",
			"cost": 0,
			"fr": {
				"name": "Freeze"
			},
			"id": "XXX_008",
			"mechanics": [
				"Freeze"
			],
			"name": "Freeze",
			"rarity": "Common",
			"set": "Debug",
			"text": "<b>Freeze</b> a character.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Give a minion <b>Mega-Windfury</b>.",
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
			"set": "Debug",
			"text": "<b>Battlecry:</b> Discard 3 cards, then draw 3 cards.",
			"type": "Minion"
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
			"set": "Debug",
			"text": "Shuffle a player's hand into his deck.",
			"type": "Spell"
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
			"set": "Debug",
			"type": "Hero"
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
			"set": "Debug",
			"text": "Permanently make a character <b>Immune</b>.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Put 10 cards from a hero's deck into his graveyard.",
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
			"set": "Debug",
			"text": "Put 30 cards from a hero's deck into his graveyard.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_019.png",
			"fr": {
				"name": "Molasses"
			},
			"id": "XXX_019",
			"name": "Molasses",
			"rarity": "Common",
			"set": "Debug",
			"text": "You can take as long as you want on your turn.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_029.png",
			"cost": 0,
			"fr": {
				"name": "Opponent Concede"
			},
			"id": "XXX_029",
			"name": "Opponent Concede",
			"set": "Debug",
			"text": "Force your opponent to concede.",
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
			"set": "Debug",
			"text": "Force your opponnet to disconnect.",
			"type": "Spell"
		},
		{
			"cost": 0,
			"fr": {
				"name": "Remove All Immune"
			},
			"id": "XXX_065",
			"name": "Remove All Immune",
			"rarity": "Common",
			"set": "Debug",
			"text": "Remove <b>Immune</b> from enemy hero",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Restore 1 Health to a character.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Restore 5 Health to a character.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Restore all Health to a character.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_028.png",
			"fr": {
				"name": "Reveal Hand"
			},
			"id": "XXX_028",
			"name": "Reveal Hand",
			"rarity": "Common",
			"set": "Debug",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_027.png",
			"fr": {
				"name": "Server Crash"
			},
			"id": "XXX_027",
			"name": "Server Crash",
			"set": "Debug",
			"text": "Crash the Server.  DON'T BE A FOOL.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Remove all enchantments and powers from a minion.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_056.png",
			"cost": 0,
			"fr": {
				"name": "Silence and Destroy All Minions"
			},
			"id": "XXX_056",
			"name": "Silence and Destroy All Minions",
			"set": "Debug",
			"text": "Destroy all minions without triggering deathrattles.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_016.png",
			"cost": 0,
			"fr": {
				"name": "Snake Ball"
			},
			"id": "XXX_016",
			"name": "Snake Ball",
			"set": "Debug",
			"text": "Summon five 1/1 snakes.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Steal a random card from your opponent.",
			"type": "Spell"
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
			"set": "Debug",
			"text": "Summon a secret from your deck.",
			"type": "Spell"
		},
		{
			"cardImage": "XXX_054.png",
			"cost": 0,
			"fr": {
				"name": "Weapon Buff"
			},
			"id": "XXX_054",
			"name": "Weapon Buff",
			"set": "Debug",
			"text": "Give your Weapon +100/+100",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Weapon Buff Enchant"
			},
			"id": "XXX_054e",
			"name": "Weapon Buff Enchant",
			"set": "Debug",
			"type": "Enchantment"
		},
		{
			"cost": 0,
			"fr": {
				"name": "Weapon Nerf"
			},
			"id": "XXX_058",
			"name": "Weapon Nerf",
			"rarity": "Common",
			"set": "Debug",
			"text": "Give a weapon a negative enchantment.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Weapon Nerf Enchant"
			},
			"id": "XXX_058e",
			"name": "Weapon Nerf Enchant",
			"set": "Debug",
			"text": "Red Sparkles!",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"cardImage": "GVG_029.png",
			"collectible": true,
			"cost": 4,
			"flavor": "\"Hey! Ancestors!\" - Ancestor's call",
			"fr": {
				"name": "Appel des ancêtres"
			},
			"id": "GVG_029",
			"name": "Ancestor's Call",
			"playerClass": "Shaman",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Put a random minion from each player's hand into the battlefield.",
			"type": "Spell"
		},
		{
			"artist": "Josh Harris",
			"attack": 9,
			"cardImage": "GVG_077.png",
			"collectible": true,
			"cost": 6,
			"flavor": "The Dark Animus is evil and mysterious and huge and unable to write sentences that utilize proper grammar.",
			"fr": {
				"name": "Golem d’anima"
			},
			"health": 9,
			"id": "GVG_077",
			"name": "Anima Golem",
			"playerClass": "Warlock",
			"race": "Mech",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "At the end of each turn, destroy this minion if it's your only one.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "GVG_085.png",
			"collectible": true,
			"cost": 2,
			"flavor": "The inventor of the Annoy-o-Tron was immediately expelled from Tinkerschool, Tinkertown, and was eventually exiled from the Eastern Kingdoms altogether.",
			"fr": {
				"name": "Ennuy-o-tron"
			},
			"health": 2,
			"id": "GVG_085",
			"mechanics": [
				"Divine Shield",
				"Taunt"
			],
			"name": "Annoy-o-Tron",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Taunt</b>\n<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Eva Widermann",
			"attack": 2,
			"cardImage": "GVG_030.png",
			"collectible": true,
			"cost": 2,
			"elite": false,
			"flavor": "It's adorable! AND OH MY GOODNESS WHY IS IT EATING MY FACE",
			"fr": {
				"name": "Ourson robot anodisé"
			},
			"health": 2,
			"id": "GVG_030",
			"mechanics": [
				"Taunt"
			],
			"name": "Anodized Robo Cub",
			"playerClass": "Druid",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Taunt</b>. <b>Choose One -</b>\n+1 Attack; or +1 Health.",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 3,
			"cardImage": "GVG_069.png",
			"collectible": true,
			"cost": 5,
			"flavor": "They don't make 'em like they used to! (Because of explosions, mostly.)",
			"fr": {
				"name": "Robot de soins antique"
			},
			"health": 3,
			"id": "GVG_069",
			"mechanics": [
				"Battlecry"
			],
			"name": "Antique Healbot",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Restore 8 Health to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Zero Yue",
			"attack": 2,
			"cardImage": "GVG_091.png",
			"collectible": true,
			"cost": 4,
			"flavor": "There was some hard talk between gnome magi and engineers about inventing this mech.",
			"fr": {
				"name": "Annulateur d’Arcane X-21"
			},
			"health": 5,
			"id": "GVG_091",
			"mechanics": [
				"Taunt"
			],
			"name": "Arcane Nullifier X-21",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Taunt</b>\nCan't be targeted by spells or Hero Powers.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Armure en plaques"
			},
			"id": "GVG_086e",
			"name": "Armor Plated",
			"playerClass": "Warrior",
			"set": "Goblins vs Gnomes",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Plaque d’armure"
			},
			"id": "PART_001e",
			"name": "Armor Plating",
			"set": "Goblins vs Gnomes",
			"text": "+1 Health.",
			"type": "Enchantment"
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
			"set": "Goblins vs Gnomes",
			"text": "Give a minion +1 Health.",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_030a.png",
			"fr": {
				"name": "Mode Attaque"
			},
			"id": "GVG_030a",
			"name": "Attack Mode",
			"playerClass": "Druid",
			"set": "Goblins vs Gnomes",
			"text": "+1 Attack.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Mode Attaque"
			},
			"id": "GVG_030ae",
			"name": "Attack Mode",
			"playerClass": "Druid",
			"set": "Goblins vs Gnomes",
			"text": "+1 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Jomaro Kindred",
			"attack": 3,
			"cardImage": "GVG_119.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"flavor": "PREPARE PARTY SERVOS FOR IMMEDIATE DEPLOYMENT.",
			"fr": {
				"name": "Bling-o-tron 3000"
			},
			"health": 4,
			"id": "GVG_119",
			"mechanics": [
				"Battlecry"
			],
			"name": "Blingtron 3000",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Equip a random weapon for each player.",
			"type": "Minion"
		},
		{
			"artist": "Tooth",
			"attack": 1,
			"cardImage": "GVG_063.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"flavor": "Spoiler alert: Bolvar gets melted and then sits on an ice throne and everyone forgets about him.",
			"fr": {
				"name": "Bolvar Fordragon"
			},
			"health": 7,
			"id": "GVG_063",
			"name": "Bolvar Fordragon",
			"playerClass": "Paladin",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "Whenever a friendly minion dies while this is in your hand, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Luca Zontini",
			"attack": 3,
			"cardImage": "GVG_099.png",
			"collectible": true,
			"cost": 5,
			"flavor": "He lobbies Orgrimmar daily on behalf of bombs.",
			"fr": {
				"name": "Lobe-Bombe"
			},
			"health": 3,
			"id": "GVG_099",
			"mechanics": [
				"Battlecry"
			],
			"name": "Bomb Lobber",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Deal 4 damage to a random enemy minion.",
			"type": "Minion"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Boom Bot",
			"race": "Mech",
			"set": "Goblins vs Gnomes",
			"text": "<b>Deathrattle</b>: Deal 1-4 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"artist": "Andrew Hou",
			"cardImage": "GVG_050.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Only goblins would think this was a good idea. Even they are starting to have their doubts.",
			"fr": {
				"name": "Lame rebondissante"
			},
			"id": "GVG_050",
			"name": "Bouncing Blade",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Deal $1 damage to a random minion. Repeat until a minion dies.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Sourcils froncés"
			},
			"id": "GVG_100e",
			"name": "Brow Furrow",
			"playerClass": "Warlock",
			"set": "Goblins vs Gnomes",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Aleksi Briclot",
			"attack": 3,
			"cardImage": "GVG_068.png",
			"collectible": true,
			"cost": 4,
			"flavor": "He's burly because he does CrossFit.",
			"fr": {
				"name": "Trogg mâcheroc mastoc"
			},
			"health": 5,
			"id": "GVG_068",
			"name": "Burly Rockjaw Trogg",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Whenever your opponent casts a spell, gain +2 Attack.",
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
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Burrowing Mine",
			"playerClass": "Warrior",
			"set": "Goblins vs Gnomes",
			"text": "When you draw this, it explodes. You take 10 damage and draw a card.",
			"type": "Spell"
		},
		{
			"artist": "E.M. Gist",
			"cardImage": "GVG_017.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Real hunters tame hungry crabs.",
			"fr": {
				"name": "Appel du familier"
			},
			"id": "GVG_017",
			"name": "Call Pet",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Draw a card.\nIf it's a Beast, it costs (4) less.",
			"type": "Spell"
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
			"race": "Beast",
			"set": "Goblins vs Gnomes",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Camouflé"
			},
			"id": "PART_004e",
			"name": "Cloaked",
			"set": "Goblins vs Gnomes",
			"text": "Stealthed until your next turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"attack": 8,
			"cardImage": "GVG_121.png",
			"collectible": true,
			"cost": 12,
			"flavor": "He and Mountain Giant don't get along.",
			"fr": {
				"name": "Géant mécanique"
			},
			"health": 8,
			"id": "GVG_121",
			"name": "Clockwork Giant",
			"race": "Mech",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Costs (1) less for each card in your opponent's hand.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "GVG_082.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Clockwork gnomes are always asking what time it is.",
			"fr": {
				"name": "Gnome mécanique"
			},
			"health": 1,
			"id": "GVG_082",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Clockwork Gnome",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Deathrattle:</b> Add a <b>Spare Part</b> card to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 6,
			"cardImage": "GVG_062.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Guardians used to be built out of Adamantium, but production got moved to Gadgetzan and Cobalt was cheap.",
			"fr": {
				"name": "Gardien de cobalt"
			},
			"health": 3,
			"id": "GVG_062",
			"name": "Cobalt Guardian",
			"playerClass": "Paladin",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Whenever you summon a Mech, gain <b>Divine Shield</b>.",
			"type": "Minion"
		},
		{
			"artist": "Howard Lyon",
			"cardImage": "GVG_073.png",
			"collectible": true,
			"cost": 5,
			"flavor": "\"Cobra Shot\" hurts way, way, way more than \"Cobra Cuddle.\"",
			"fr": {
				"name": "Tir du cobra"
			},
			"id": "GVG_073",
			"name": "Cobra Shot",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Deal $3 damage to a minion and the enemy hero.",
			"type": "Spell"
		},
		{
			"artist": "Dany Orizio",
			"attack": 2,
			"cardImage": "GVG_059.png",
			"collectible": true,
			"cost": 3,
			"durability": 3,
			"flavor": "So you ripped this out of a machine, carved some runes on it, stuck it on a handle, and now it's a weapon of great divine power? Seems legit.",
			"fr": {
				"name": "Rouage-marteau"
			},
			"id": "GVG_059",
			"mechanics": [
				"Battlecry"
			],
			"name": "Coghammer",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Give a random friendly minion <b>Divine Shield</b> and <b>Taunt</b>.",
			"type": "Weapon"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 1,
			"cardImage": "GVG_013.png",
			"collectible": true,
			"cost": 1,
			"flavor": "After a while, you don't see the cogs and sprockets. All you see is a robot, a spider tank, a deathray...",
			"fr": {
				"name": "Maître des rouages"
			},
			"health": 2,
			"id": "GVG_013",
			"mechanics": [
				"Aura"
			],
			"name": "Cogmaster",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Has +2 Attack while you have a Mech.",
			"type": "Minion"
		},
		{
			"artist": "Richard Wright",
			"attack": 1,
			"cardImage": "GVG_024.png",
			"collectible": true,
			"cost": 3,
			"durability": 3,
			"flavor": "For tightening cogs and smashin' troggs!",
			"fr": {
				"name": "Clé de maître des rouages"
			},
			"id": "GVG_024",
			"mechanics": [
				"Aura"
			],
			"name": "Cogmaster's Wrench",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Has +2 Attack while you have a Mech.",
			"type": "Weapon"
		},
		{
			"artist": "Warren Mahy",
			"cardImage": "GVG_038.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Snap! This card! Pop!",
			"fr": {
				"name": "Crépitement"
			},
			"id": "GVG_038",
			"mechanics": [
				"Overload"
			],
			"name": "Crackle",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Deal $3-$6 damage. <b>Overload:</b> (1)",
			"type": "Spell"
		},
		{
			"artist": "Michael Sutfin",
			"cardImage": "GVG_052.png",
			"collectible": true,
			"cost": 7,
			"flavor": "Using this card on your enemies is one of the best things in life, according to some barbarians.",
			"fr": {
				"name": "Écraser"
			},
			"id": "GVG_052",
			"name": "Crush",
			"playerClass": "Warrior",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Destroy a minion. If you have a damaged minion, this costs (4) less.",
			"type": "Spell"
		},
		{
			"artist": "Trent Kaniuga",
			"cardImage": "GVG_041.png",
			"collectible": true,
			"cost": 6,
			"flavor": "Don't worry; we fired the person who named this card.",
			"fr": {
				"name": "Sombres feux follets"
			},
			"id": "GVG_041",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "<b>Choose One -</b> Summon 5 Wisps; or Give a minion +5/+5 and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_041b.png",
			"fr": {
				"name": "Sombres feux follets"
			},
			"id": "GVG_041b",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"set": "Goblins vs Gnomes",
			"text": "Summon 5 Wisps.",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_041a.png",
			"fr": {
				"name": "Sombres feux follets"
			},
			"id": "GVG_041a",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"set": "Goblins vs Gnomes",
			"text": "+5/+5 and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Sombres feux follets"
			},
			"id": "GVG_041c",
			"name": "Dark Wispers",
			"playerClass": "Druid",
			"set": "Goblins vs Gnomes",
			"text": "+5/+5 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Jeff Haynie",
			"cardImage": "GVG_015.png",
			"collectible": true,
			"cost": 2,
			"flavor": "If you're looking to make an \"Emo\" deck, this card is perfect!",
			"fr": {
				"name": "Bombe de matière noire"
			},
			"id": "GVG_015",
			"name": "Darkbomb",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Deal $3 damage.",
			"type": "Spell"
		},
		{
			"artist": "Kerem Beyit",
			"cardImage": "GVG_019.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Virtually every member of the pro demon lobby is a warlock. Weird.",
			"fr": {
				"name": "Cœur de démon"
			},
			"id": "GVG_019",
			"name": "Demonheart",
			"playerClass": "Warlock",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Deal $5 damage to a minion.  If it's a friendly Demon, give it +5/+5 instead.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Cœur de démon"
			},
			"id": "GVG_019e",
			"name": "Demonheart",
			"playerClass": "Warlock",
			"set": "Goblins vs Gnomes",
			"text": "+5/+5.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Garner",
			"attack": 7,
			"cardImage": "GVG_110.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "MARVEL AT HIS MIGHT!",
			"fr": {
				"name": "Dr Boum"
			},
			"health": 7,
			"id": "GVG_110",
			"mechanics": [
				"Battlecry"
			],
			"name": "Dr. Boom",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry</b>: Summon two 1/1 Boom Bots. <i>WARNING: Bots may explode.</i>",
			"type": "Minion"
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
			"race": "Beast",
			"set": "Goblins vs Gnomes",
			"type": "Minion"
		},
		{
			"artist": "Brandon Kitkouski",
			"attack": 4,
			"cardImage": "GVG_080.png",
			"collectible": true,
			"cost": 5,
			"flavor": "The Druids of the Fang live in the Wailing Caverns. They wear cool snake shirts and tell snake jokes and say \"bro\" a lot.",
			"fr": {
				"name": "Druide du Croc"
			},
			"health": 4,
			"id": "GVG_080",
			"mechanics": [
				"Battlecry"
			],
			"name": "Druid of the Fang",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> If you have a Beast, transform this minion into a 7/7.",
			"type": "Minion"
		},
		{
			"artist": "José Ladrönn",
			"attack": 5,
			"cardImage": "GVG_066.png",
			"collectible": true,
			"cost": 4,
			"flavor": "He just closes his eyes and goes for it. Raarararrrarar!",
			"fr": {
				"name": "Chaman cognedune"
			},
			"health": 4,
			"id": "GVG_066",
			"mechanics": [
				"Overload",
				"Windfury"
			],
			"name": "Dunemaul Shaman",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Windfury, Overload: (1)</b>\n50% chance to attack the wrong enemy.",
			"type": "Minion"
		},
		{
			"artist": "Alex Garner",
			"cardImage": "GVG_005.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Medivh's echo haunts Karazhan, eternally cheating at chess and <i>Hearthstone</i>.",
			"fr": {
				"name": "Écho de Medivh"
			},
			"id": "GVG_005",
			"name": "Echo of Medivh",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Put a copy of each friendly minion into your hand.",
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
			"mechanics": [
				"Freeze"
			],
			"name": "Emergency Coolant",
			"set": "Goblins vs Gnomes",
			"text": "<b>Freeze</b> a minion.",
			"type": "Spell"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 3,
			"cardImage": "GVG_107.png",
			"collectible": true,
			"cost": 4,
			"flavor": "His enhancements are gluten free!",
			"fr": {
				"name": "Mécano-amplificateur"
			},
			"health": 2,
			"id": "GVG_107",
			"mechanics": [
				"Battlecry"
			],
			"name": "Enhance-o Mechano",
			"race": "Mech",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Give your other minions <b>Windfury</b>, <b>Taunt</b>, or <b>Divine Shield</b>.\n<i>(at random)</i>",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 1,
			"cardImage": "GVG_076.png",
			"collectible": true,
			"cost": 2,
			"flavor": "How is this supposed to work?  Your enemies think, \"<i>Hey!</i> Cute sheep!\" and run over to cuddle it?",
			"fr": {
				"name": "Mouton explosif"
			},
			"health": 1,
			"id": "GVG_076",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Explosive Sheep",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Deathrattle:</b> Deal 2 damage to all minions.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Lame affûtée"
			},
			"id": "GVG_023a",
			"name": "Extra Sharp",
			"set": "Goblins vs Gnomes",
			"text": "+1 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "GVG_026.png",
			"collectible": true,
			"cost": 2,
			"flavor": "The hardest part about doing a \"Feign Death\" convincingly is learning how to make the right smell. It takes a lot of commitment.",
			"fr": {
				"name": "Feindre la mort"
			},
			"id": "GVG_026",
			"name": "Feign Death",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Trigger all <b>Deathrattles</b> on your minions.",
			"type": "Spell"
		},
		{
			"artist": "Matt Gaser",
			"attack": 3,
			"cardImage": "GVG_020.png",
			"collectible": true,
			"cost": 4,
			"flavor": "The box says, \"New and improved, with 200% more fel!\"",
			"fr": {
				"name": "Gangrecanon"
			},
			"health": 5,
			"id": "GVG_020",
			"name": "Fel Cannon",
			"playerClass": "Warlock",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "At the end of your turn, deal 2 damage to a non-Mech minion.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 8,
			"cardImage": "GVG_016.png",
			"collectible": true,
			"cost": 5,
			"flavor": "So reaver. Much fel. Wow.",
			"fr": {
				"name": "Saccageur gangrené"
			},
			"health": 8,
			"id": "GVG_016",
			"name": "Fel Reaver",
			"race": "Mech",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Whenever your opponent plays a card, remove the top 3 cards of your deck.",
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
			"set": "Goblins vs Gnomes",
			"text": "Give a friendly minion <b>Stealth</b> until your next turn.",
			"type": "Spell"
		},
		{
			"artist": "Aleksi Briclot",
			"attack": 7,
			"cardImage": "GVG_007.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "Mimiron likes to take the Flame Leviathan out on some sweet joyrides.",
			"fr": {
				"name": "Léviathan des flammes"
			},
			"health": 7,
			"id": "GVG_007",
			"name": "Flame Leviathan",
			"playerClass": "Mage",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "When you draw this, deal 2 damage to all characters.",
			"type": "Minion"
		},
		{
			"artist": "Mauricio Herrera",
			"cardImage": "GVG_001.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Calling something a flamecannon really doesn't do much to distinguish it from other goblin devices.",
			"fr": {
				"name": "Canon lance-flammes"
			},
			"id": "GVG_001",
			"name": "Flamecannon",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Deal $4 damage to a random enemy minion.",
			"type": "Spell"
		},
		{
			"artist": "Todd Lockwood",
			"attack": 4,
			"cardImage": "GVG_100.png",
			"collectible": true,
			"cost": 5,
			"flavor": "\"Evil Eye Watcher of Doom\" was the original name, but marketing felt it was a bit too aggressive.",
			"fr": {
				"name": "Guetteur flottant"
			},
			"health": 4,
			"id": "GVG_100",
			"name": "Floating Watcher",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Whenever your hero takes damage on your turn, gain +2/+2.",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "GVG_084.png",
			"collectible": true,
			"cost": 3,
			"flavor": "To operate, this contraption needs a hula doll on the dashboard. Otherwise it's just a “falling machine.”",
			"fr": {
				"name": "Machine volante"
			},
			"health": 4,
			"id": "GVG_084",
			"mechanics": [
				"Windfury"
			],
			"name": "Flying Machine",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Windfury</b>",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 6,
			"cardImage": "GVG_113.png",
			"collectible": true,
			"cost": 8,
			"elite": true,
			"flavor": "Foe reaping is really not so different from harvest reaping, at the end of the day.",
			"fr": {
				"name": "Faucheur 4000"
			},
			"health": 9,
			"id": "GVG_113",
			"name": "Foe Reaper 4000",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "Also damages the minions next to whomever he attacks.",
			"type": "Minion"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"attack": 7,
			"cardImage": "GVG_079.png",
			"collectible": true,
			"cost": 8,
			"flavor": "There is a factory in Tanaris for crafting force-tanks, but it only ever made two, because of cost overruns.",
			"fr": {
				"name": "Char de force MAX"
			},
			"health": 7,
			"id": "GVG_079",
			"mechanics": [
				"Divine Shield"
			],
			"name": "Force-Tank MAX",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "GVG_049.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "The Sen'jin High football team is The Gahz'rillas.",
			"fr": {
				"name": "Gahz’rilla"
			},
			"health": 9,
			"id": "GVG_049",
			"name": "Gahz'rilla",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "Whenever this minion takes damage, double its Attack.",
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
			"set": "Goblins vs Gnomes",
			"text": "Gain 1 Mana Crystal this turn only.\n<i>(Won't trigger Gallywix.)</i>",
			"type": "Spell"
		},
		{
			"artist": "Luke Mancini",
			"attack": 3,
			"cardImage": "GVG_117.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "Gazlowe was voted \"Most Likely to Explode\" in high school.",
			"fr": {
				"name": "Gazleu"
			},
			"health": 6,
			"id": "GVG_117",
			"name": "Gazlowe",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "Whenever you cast a 1-mana spell, add a random Mech to your hand.",
			"type": "Minion"
		},
		{
			"cardImage": "GVG_032b.png",
			"fr": {
				"name": "Don de carte"
			},
			"id": "GVG_032b",
			"name": "Gift of Cards",
			"playerClass": "Druid",
			"set": "Goblins vs Gnomes",
			"text": "Each player draws a card.",
			"type": "Spell"
		},
		{
			"cardImage": "GVG_032a.png",
			"fr": {
				"name": "Don de mana"
			},
			"id": "GVG_032a",
			"name": "Gift of Mana",
			"playerClass": "Druid",
			"set": "Goblins vs Gnomes",
			"text": "Give each player a Mana Crystal.",
			"type": "Spell"
		},
		{
			"artist": "Seamus Gallagher",
			"attack": 2,
			"cardImage": "GVG_081.png",
			"collectible": true,
			"cost": 2,
			"flavor": "\"Shhh, I think I hear something.\"\n\"Ah, it's probably nothing.\" - Every Henchman",
			"fr": {
				"name": "Traqueur gloubelin"
			},
			"health": 3,
			"id": "GVG_081",
			"mechanics": [
				"Stealth"
			],
			"name": "Gilblin Stalker",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Stealth</b>",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Glaivezooka"
			},
			"id": "GVG_043e",
			"name": "Glaivezooka",
			"playerClass": "Hunter",
			"set": "Goblins vs Gnomes",
			"text": "+1 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Gino Whitehall",
			"attack": 2,
			"cardImage": "GVG_043.png",
			"collectible": true,
			"cost": 2,
			"durability": 2,
			"flavor": "For the times when a regular bazooka just isn't enough.",
			"fr": {
				"name": "Glaivezooka"
			},
			"id": "GVG_043",
			"mechanics": [
				"Battlecry"
			],
			"name": "Glaivezooka",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Give a random friendly minion +1 Attack.",
			"type": "Weapon"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 1,
			"cardImage": "GVG_098.png",
			"collectible": true,
			"cost": 3,
			"flavor": "The gnomes are valiant and ready to return to their irradiated, poorly ventilated homeland!",
			"fr": {
				"name": "Infanterie de Gnomeregan"
			},
			"health": 4,
			"id": "GVG_098",
			"mechanics": [
				"Charge",
				"Taunt"
			],
			"name": "Gnomeregan Infantry",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Charge</b>\n<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 3,
			"cardImage": "GVG_092.png",
			"collectible": true,
			"cost": 3,
			"flavor": "He's legitimately surprised every time he turns himself into a chicken.",
			"fr": {
				"name": "Expérimentateur gnome"
			},
			"health": 2,
			"id": "GVG_092",
			"mechanics": [
				"Battlecry"
			],
			"name": "Gnomish Experimenter",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Draw a card. If it's a minion, transform it into a Chicken.",
			"type": "Minion"
		},
		{
			"artist": "Zolton Boros",
			"attack": 3,
			"cardImage": "GVG_023.png",
			"collectible": true,
			"cost": 2,
			"flavor": "This guy is excellent at adjusting your haircut and/or height.",
			"fr": {
				"name": "Robot barbier gobelin"
			},
			"health": 2,
			"id": "GVG_023",
			"mechanics": [
				"Battlecry"
			],
			"name": "Goblin Auto-Barber",
			"playerClass": "Rogue",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry</b>: Give your weapon +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Glenn Rane",
			"attack": 5,
			"cardImage": "GVG_004.png",
			"collectible": true,
			"cost": 4,
			"flavor": "If you can't find a bomb to throw, just pick up any goblin invention and throw that.",
			"fr": {
				"name": "Explomage gobelin"
			},
			"health": 4,
			"id": "GVG_004",
			"mechanics": [
				"Battlecry"
			],
			"name": "Goblin Blastmage",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> If you have a Mech, deal 4 damage randomly split among all enemies.",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 2,
			"cardImage": "GVG_095.png",
			"collectible": true,
			"cost": 3,
			"flavor": "He’s not such a binge exploder anymore. These days, he only explodes socially.",
			"fr": {
				"name": "Sapeur gobelin"
			},
			"health": 4,
			"id": "GVG_095",
			"mechanics": [
				"Aura"
			],
			"name": "Goblin Sapper",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Has +4 Attack while your opponent has 6 or more cards in hand.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Étreinte de Mal’Ganis"
			},
			"id": "GVG_021e",
			"name": "Grasp of Mal'Ganis",
			"playerClass": "Warlock",
			"set": "Goblins vs Gnomes",
			"text": "Mal'Ganis is granting +2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Chris Rahn",
			"attack": 2,
			"cardImage": "GVG_032.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Likes: Hiking and the great outdoors. Dislikes: Goblin shredders and sandals. (Can’t find any that fit!).",
			"fr": {
				"name": "Sylvenier du Bosquet"
			},
			"health": 4,
			"id": "GVG_032",
			"name": "Grove Tender",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Choose One -</b> Give each player a Mana Crystal; or Each player draws a card.",
			"type": "Minion"
		},
		{
			"artist": "Ralph Horsley",
			"attack": 6,
			"cardImage": "GVG_120.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"flavor": "It's hard to make a living as a hunter in a world where beasts instantly reappear minutes after you kill them.",
			"fr": {
				"name": "Hemet Nesingwary"
			},
			"health": 3,
			"id": "GVG_120",
			"mechanics": [
				"Battlecry"
			],
			"name": "Hemet Nesingwary",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Destroy a Beast.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "CADEAU BONUS"
			},
			"id": "GVG_104a",
			"name": "HERE, TAKE BUFF.",
			"set": "Goblins vs Gnomes",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Laurel D. Austin",
			"attack": 2,
			"cardImage": "GVG_104.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Hobgoblins are meeting next week to discuss union benefits.  First on the list: dental plan.",
			"fr": {
				"name": "Hobgobelin"
			},
			"health": 3,
			"id": "GVG_104",
			"name": "Hobgoblin",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Whenever you play a 1-Attack minion, give it +2/+2.",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "GVG_089.png",
			"collectible": true,
			"cost": 3,
			"flavor": "\"LUMOS!\" is not what they yell. What do you think this is, Hogwarts?",
			"fr": {
				"name": "Illuminatrice"
			},
			"health": 4,
			"id": "GVG_089",
			"name": "Illuminator",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "If you control a <b>Secret</b> at the end of your turn, restore 4 Health to your hero.",
			"type": "Minion"
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
			"race": "Demon",
			"set": "Goblins vs Gnomes",
			"type": "Minion"
		},
		{
			"artist": "Jaemin Kim",
			"cardImage": "GVG_045.png",
			"collectible": true,
			"cost": 4,
			"flavor": "The shrapnel is waaaaay worse than the explosion.",
			"fr": {
				"name": "Éruption de diablotins"
			},
			"id": "GVG_045",
			"name": "Imp-losion",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Deal $2-$4 damage to a minion. Summon a 1/1 Imp for each damage dealt.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "GVG_056.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "The Iron Juggernaut guards Orgrimmar and has just earned the \"Employee of the Month\" award!",
			"fr": {
				"name": "Mastodonte de fer"
			},
			"health": 5,
			"id": "GVG_056",
			"mechanics": [
				"Battlecry"
			],
			"name": "Iron Juggernaut",
			"playerClass": "Warrior",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Shuffle a Mine into your opponent's deck. When drawn, it explodes for 10 damage.",
			"type": "Minion"
		},
		{
			"artist": "Brian Despain",
			"attack": 2,
			"cardImage": "GVG_027.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Mechs like learning from him because he really speaks their language.\n0110100001101001",
			"fr": {
				"name": "Senseï de fer"
			},
			"health": 2,
			"id": "GVG_027",
			"name": "Iron Sensei",
			"playerClass": "Rogue",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "At the end of your turn, give another friendly Mech +2/+2.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Bien armé"
			},
			"id": "GVG_027e",
			"name": "Ironed Out",
			"playerClass": "Rogue",
			"set": "Goblins vs Gnomes",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "GVG_094.png",
			"collectible": true,
			"cost": 4,
			"flavor": "This robot is a lean, mean, butlerin' machine.",
			"fr": {
				"name": "Jeeves"
			},
			"health": 4,
			"id": "GVG_094",
			"name": "Jeeves",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "At the end of each player's turn, that player draws until they have 3 cards.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"attack": 1,
			"cardImage": "GVG_106.png",
			"collectible": true,
			"cost": 5,
			"flavor": "One bot's junk is another bot's AWESOME UPGRADE!",
			"fr": {
				"name": "Brik-à-bot"
			},
			"health": 5,
			"id": "GVG_106",
			"name": "Junkbot",
			"race": "Mech",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Whenever a friendly Mech dies, gain +2/+2.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Bricolé à fond"
			},
			"id": "GVG_106e",
			"name": "Junked Up",
			"set": "Goblins vs Gnomes",
			"text": "Increased stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 4,
			"cardImage": "GVG_074.png",
			"collectible": true,
			"cost": 4,
			"flavor": "They pretend to be wise and enlightened, but they mostly just hate to be left out of a secret.",
			"fr": {
				"name": "Mystique de Kezan"
			},
			"health": 3,
			"id": "GVG_074",
			"mechanics": [
				"Battlecry"
			],
			"name": "Kezan Mystic",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Take control of a random enemy <b>Secret</b>.",
			"type": "Minion"
		},
		{
			"artist": "Seamus Gallagher",
			"attack": 2,
			"cardImage": "GVG_046.png",
			"collectible": true,
			"cost": 5,
			"flavor": "He never sleeps.  Not even in the mighty jungle.",
			"fr": {
				"name": "Roi des bêtes"
			},
			"health": 6,
			"id": "GVG_046",
			"mechanics": [
				"Battlecry",
				"Taunt"
			],
			"name": "King of Beasts",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Taunt</b>. <b>Battlecry:</b> Gain +1 Attack for each other Beast you have.",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"cardImage": "GVG_012.png",
			"collectible": true,
			"cost": 1,
			"flavor": "\"Light it up!\" - Command given to both Lightwardens and Goblins holding Flamecannons.",
			"fr": {
				"name": "Lumière des naaru"
			},
			"id": "GVG_012",
			"name": "Light of the Naaru",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Restore #3 Health. If the target is still damaged, summon a Lightwarden.",
			"type": "Spell"
		},
		{
			"artist": "Luca Zontini",
			"cardImage": "GVG_008.png",
			"collectible": true,
			"cost": 6,
			"flavor": "This is what happens when you allow goblins to be priests.",
			"fr": {
				"name": "Bombe de lumière"
			},
			"id": "GVG_008",
			"mechanics": [
				"AffectedBySpellPower"
			],
			"name": "Lightbomb",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Deal damage to each minion equal to its Attack.",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"attack": 2,
			"cardImage": "GVG_097.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Warlocks have the town exorcist on speed dial in case they unleash the wrong demon.",
			"fr": {
				"name": "Mini exorciste"
			},
			"health": 3,
			"id": "GVG_097",
			"mechanics": [
				"Battlecry",
				"Taunt"
			],
			"name": "Lil' Exorcist",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Taunt</b>\n<b>Battlecry:</b> Gain +1/+1 for each enemy <b>Deathrattle</b> minion.",
			"type": "Minion"
		},
		{
			"artist": "Benjamin Zhang",
			"attack": 5,
			"cardImage": "GVG_071.png",
			"collectible": true,
			"cost": 4,
			"flavor": "The message, \"If found, please return to Mulgore,\" is tattooed on his rear.",
			"fr": {
				"name": "Haut-trotteur égaré"
			},
			"health": 4,
			"id": "GVG_071",
			"name": "Lost Tallstrider",
			"race": "Beast",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "GVG_090.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Dang, Bomber, calm down.",
			"fr": {
				"name": "Bombardier cinglé"
			},
			"health": 4,
			"id": "GVG_090",
			"mechanics": [
				"Battlecry"
			],
			"name": "Madder Bomber",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Deal 6 damage randomly split between all other characters.",
			"type": "Minion"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 9,
			"cardImage": "GVG_021.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"flavor": "Mal'Ganis doesn't like being betrayed, so if you discard him, watch out.",
			"fr": {
				"name": "Mal’Ganis"
			},
			"health": 7,
			"id": "GVG_021",
			"mechanics": [
				"Aura"
			],
			"name": "Mal'Ganis",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "Your other Demons have +2/+2.\nYour hero is <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"artist": "Oliver Chipping",
			"attack": 9,
			"cardImage": "GVG_035.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "When Malorne isn't mauling hordes of demons, he enjoys attending parties, though he prefers to go stag.",
			"fr": {
				"name": "Malorne"
			},
			"health": 7,
			"id": "GVG_035",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Malorne",
			"playerClass": "Druid",
			"race": "Beast",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "<b>Deathrattle:</b> Shuffle this minion into your deck.",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 7,
			"cardImage": "GVG_034.png",
			"collectible": true,
			"cost": 6,
			"flavor": "Crushes buildings with his BEAR hands.",
			"fr": {
				"name": "Méca chat-ours"
			},
			"health": 6,
			"id": "GVG_034",
			"name": "Mech-Bear-Cat",
			"playerClass": "Druid",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Whenever this minion takes damage, add a <b>Spare Part</b> card to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Chris Seaman",
			"attack": 4,
			"cardImage": "GVG_078.png",
			"collectible": true,
			"cost": 4,
			"flavor": "The yetis of Chillwind Point are a source of both inspiration and savage beatings.",
			"fr": {
				"name": "Yéti mécanique"
			},
			"health": 5,
			"id": "GVG_078",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Mechanical Yeti",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Deathrattle:</b> Give each player a <b>Spare Part.</b>",
			"type": "Minion"
		},
		{
			"artist": "Phil Saunders",
			"attack": 2,
			"cardImage": "GVG_006.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Mechs that summon mechs? What's next? Donuts that summon donuts? Mmmmm.",
			"fr": {
				"name": "Méca-téléporteur"
			},
			"health": 3,
			"id": "GVG_006",
			"mechanics": [
				"Aura"
			],
			"name": "Mechwarper",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Your Mechs cost (1) less.",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 9,
			"cardImage": "GVG_116.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"flavor": "He was obsessed with explosives until he discovered knitting. Now he yells, “SWEATERS! MORE SWEATERS!”",
			"fr": {
				"name": "Mekgénieur Thermojoncteur"
			},
			"health": 7,
			"id": "GVG_116",
			"name": "Mekgineer Thermaplugg",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "Whenever an enemy minion dies, summon a Leper Gnome.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Magie métabolisée"
			},
			"id": "GVG_067a",
			"mechanics": [
				"Aura"
			],
			"name": "Metabolized Magic",
			"set": "Goblins vs Gnomes",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Magie métabolisée"
			},
			"id": "GVG_068a",
			"mechanics": [
				"Aura"
			],
			"name": "Metabolized Magic",
			"set": "Goblins vs Gnomes",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Dents de métal"
			},
			"id": "GVG_048e",
			"name": "Metal Teeth",
			"playerClass": "Hunter",
			"set": "Goblins vs Gnomes",
			"text": "+2 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Hideaki Takamura",
			"attack": 3,
			"cardImage": "GVG_048.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Don't leave them out in the rain. In Un'Goro Crater there is a whole colony of rust-tooth leapers.",
			"fr": {
				"name": "Bondisseur dent-de-métal"
			},
			"health": 3,
			"id": "GVG_048",
			"mechanics": [
				"Battlecry"
			],
			"name": "Metaltooth Leaper",
			"playerClass": "Hunter",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry</b>: Give your other Mechs +2 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 1,
			"cardImage": "GVG_103.png",
			"collectible": true,
			"cost": 2,
			"flavor": "This card is the real thing.",
			"fr": {
				"name": "Micro-machine"
			},
			"health": 2,
			"id": "GVG_103",
			"name": "Micro Machine",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "At the start of each turn, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Puissance de Brikabrok"
			},
			"id": "GVG_102e",
			"name": "Might of Tinkertown",
			"set": "Goblins vs Gnomes",
			"text": "+1/+1.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Puissance de Zul’Farrak"
			},
			"id": "GVG_049e",
			"name": "Might of Zul'Farrak",
			"playerClass": "Hunter",
			"set": "Goblins vs Gnomes",
			"text": "Multiplying Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 4,
			"cardImage": "GVG_111.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"flavor": "Do not push the big red button!",
			"fr": {
				"name": "Tête de Mimiron"
			},
			"health": 5,
			"id": "GVG_111",
			"name": "Mimiron's Head",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "At the start of your turn, if you have at least 3 Mechs, destroy them all and form V-07-TR-0N.",
			"type": "Minion"
		},
		{
			"artist": "Ben Olson",
			"attack": 4,
			"cardImage": "GVG_109.png",
			"collectible": true,
			"cost": 4,
			"flavor": "He is sometimes found hiding in the treasure chest in the Gurubashi Arena.",
			"fr": {
				"name": "Mini-mage"
			},
			"health": 1,
			"id": "GVG_109",
			"mechanics": [
				"Spellpower",
				"Stealth"
			],
			"name": "Mini-Mage",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "<b>Stealth</b>\n<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"artist": "Carl Critchlow",
			"attack": 1,
			"cardImage": "GVG_018.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Her sister is the Mistress of Pane who sells windows and shower doors.",
			"fr": {
				"name": "Maîtresse de Douleur"
			},
			"health": 4,
			"id": "GVG_018",
			"name": "Mistress of Pain",
			"playerClass": "Warlock",
			"race": "Demon",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Whenever this minion deals damage, restore that much Health to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Michal Ivan",
			"attack": 7,
			"cardImage": "GVG_112.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "Mogor helped reopen the Dark Portal once. You know you're in trouble when you have to rely on an ogre.",
			"fr": {
				"name": "Mogor l’ogre"
			},
			"health": 6,
			"id": "GVG_112",
			"name": "Mogor the Ogre",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "All minions have a 50% chance to attack the wrong enemy.",
			"type": "Minion"
		},
		{
			"artist": "Mike Hayes",
			"cardImage": "GVG_061.png",
			"collectible": true,
			"cost": 3,
			"flavor": "\"I'm bringing the guacamole!\" – One of the most successful (yet rare) Silver Hand rallying cries",
			"fr": {
				"name": "Régiment de bataille"
			},
			"id": "GVG_061",
			"name": "Muster for Battle",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Summon three 1/1 Silver Hand Recruits. Equip a 1/4 Weapon.",
			"type": "Spell"
		},
		{
			"artist": "Ruan Jia",
			"attack": 7,
			"cardImage": "GVG_042.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "Neptulon is \"The Tidehunter\". He’s one of the four elemental lords. And he and Ragnaros get together and make really amazing saunas.",
			"fr": {
				"name": "Neptulon"
			},
			"health": 7,
			"id": "GVG_042",
			"mechanics": [
				"Battlecry",
				"Overload"
			],
			"name": "Neptulon",
			"playerClass": "Shaman",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Add 4 random Murlocs to your hand. <b>Overload:</b> (3)",
			"type": "Minion"
		},
		{
			"artist": "Vinod Rams",
			"attack": 4,
			"cardImage": "GVG_065.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Ogres have really terrible short-term chocolate.",
			"fr": {
				"name": "Brute ogre"
			},
			"health": 4,
			"id": "GVG_065",
			"name": "Ogre Brute",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "50% chance to attack the wrong enemy.",
			"type": "Minion"
		},
		{
			"artist": "Samwise",
			"attack": 6,
			"cardImage": "GVG_088.png",
			"collectible": true,
			"cost": 5,
			"flavor": "He didn't have the grades to get into ninja school, but his dad pulled some strings.",
			"fr": {
				"name": "Ninja ogre"
			},
			"health": 6,
			"id": "GVG_088",
			"mechanics": [
				"Stealth"
			],
			"name": "Ogre Ninja",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Stealth</b>\n50% chance to attack the wrong enemy.",
			"type": "Minion"
		},
		{
			"artist": "Richard Wright",
			"attack": 4,
			"cardImage": "GVG_054.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"flavor": "Simple, misguided, and incredibly dangerous. You know, like most things ogre.",
			"fr": {
				"name": "Cogneguerre ogre"
			},
			"id": "GVG_054",
			"name": "Ogre Warmaul",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "50% chance to attack the wrong enemy.",
			"type": "Weapon"
		},
		{
			"artist": "Danny Beck",
			"attack": 4,
			"cardImage": "GVG_025.png",
			"collectible": true,
			"cost": 2,
			"flavor": "When pirates say there is no \"Eye\" in \"team,\" they are very literal about it.",
			"fr": {
				"name": "Tricheur borgne"
			},
			"health": 1,
			"id": "GVG_025",
			"name": "One-eyed Cheat",
			"playerClass": "Rogue",
			"race": "Pirate",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Whenever you summon a Pirate, gain <b>Stealth</b>.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Remonté"
			},
			"id": "GVG_123e",
			"mechanics": [
				"Spellpower"
			],
			"name": "Overclocked",
			"playerClass": "Mage",
			"set": "Goblins vs Gnomes",
			"text": "Spell Damage +2.",
			"type": "Enchantment"
		},
		{
			"artist": "Dan Scott",
			"attack": 4,
			"cardImage": "GVG_096.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Once upon a time, only goblins piloted shredders. These days, everyone from Doomsayer to Lorewalker Cho seems to ride one.",
			"fr": {
				"name": "Déchiqueteur piloté"
			},
			"health": 3,
			"id": "GVG_096",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Piloted Shredder",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Deathrattle:</b> Summon a random 2-Cost minion.",
			"type": "Minion"
		},
		{
			"artist": "Michael Phillippi",
			"attack": 6,
			"cardImage": "GVG_105.png",
			"collectible": true,
			"cost": 6,
			"flavor": "The pinnacle of goblin engineering. Includes an espresso machine and foot massager.",
			"fr": {
				"name": "Golem céleste piloté"
			},
			"health": 4,
			"id": "GVG_105",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Piloted Sky Golem",
			"race": "Mech",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "<b>Deathrattle:</b> Summon a random 4-Cost minion.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Pistons"
			},
			"id": "GVG_076a",
			"name": "Pistons",
			"set": "Goblins vs Gnomes",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Puissance acquise"
			},
			"id": "GVG_036e",
			"name": "Powered",
			"playerClass": "Shaman",
			"set": "Goblins vs Gnomes",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Zoltan and Gabor",
			"attack": 3,
			"cardImage": "GVG_036.png",
			"collectible": true,
			"cost": 3,
			"durability": 2,
			"flavor": "People assume that shamans control the elements, but really, they have to ask them stuff and the elements are like, \"Yeah ok, sure.\"",
			"fr": {
				"name": "Masse de puissance"
			},
			"id": "GVG_036",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Powermace",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Deathrattle</b>: Give a random friendly Mech +2/+2.",
			"type": "Weapon"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 3,
			"cardImage": "GVG_064.png",
			"collectible": true,
			"cost": 2,
			"flavor": "He pays homage to Morgl, the great murloc oracle! (Who doesn't??)",
			"fr": {
				"name": "Saute-flaque"
			},
			"health": 2,
			"id": "GVG_064",
			"name": "Puddlestomper",
			"race": "Murloc",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Pur"
			},
			"id": "GVG_101e",
			"name": "Pure",
			"playerClass": "Paladin",
			"set": "Goblins vs Gnomes",
			"text": "Increased Stats.",
			"type": "Enchantment"
		},
		{
			"artist": "Phroilan Gardner",
			"attack": 2,
			"cardImage": "GVG_060.png",
			"collectible": true,
			"cost": 5,
			"flavor": "His specialty? Dividing things into four pieces.",
			"fr": {
				"name": "Intendant"
			},
			"health": 5,
			"id": "GVG_060",
			"mechanics": [
				"Battlecry"
			],
			"name": "Quartermaster",
			"playerClass": "Paladin",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Give your Silver Hand Recruits +2/+2.",
			"type": "Minion"
		},
		{
			"artist": "Ben Olson",
			"attack": 3,
			"cardImage": "GVG_108.png",
			"collectible": true,
			"cost": 2,
			"flavor": "For when you didn’t combobulate quite right the first time around.",
			"fr": {
				"name": "Recombobulateur"
			},
			"health": 2,
			"id": "GVG_108",
			"mechanics": [
				"Battlecry"
			],
			"name": "Recombobulator",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Transform a friendly minion into a random minion with the same Cost.",
			"type": "Minion"
		},
		{
			"artist": "Efrem Palacios",
			"cardImage": "GVG_031.png",
			"collectible": true,
			"cost": 6,
			"flavor": "Druidic recycling involves putting plastics in one bin and enemy minions in another bin.",
			"fr": {
				"name": "Recyclage"
			},
			"id": "GVG_031",
			"name": "Recycle",
			"playerClass": "Druid",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Shuffle an enemy minion into your opponent's deck.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Réparations !"
			},
			"id": "GVG_069a",
			"name": "Repairs!",
			"playerClass": "Priest",
			"set": "Goblins vs Gnomes",
			"text": "+4 Health.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Vindicte"
			},
			"id": "GVG_063a",
			"name": "Retribution",
			"set": "Goblins vs Gnomes",
			"text": "Increased Attack",
			"type": "Enchantment"
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
			"set": "Goblins vs Gnomes",
			"text": "Swap a minion's Attack and Health.",
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
			"set": "Goblins vs Gnomes",
			"text": "Give a minion <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"artist": "Dave Allsop",
			"cardImage": "GVG_047.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Rogues can't stand it. They know you planned it! They are going to set you straight!",
			"fr": {
				"name": "Sabotage"
			},
			"id": "GVG_047",
			"mechanics": [
				"Combo"
			],
			"name": "Sabotage",
			"playerClass": "Rogue",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Destroy a random enemy minion. <b>Combo</b>: And your opponent's weapon.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 7,
			"cardImage": "GVG_070.png",
			"collectible": true,
			"cost": 5,
			"flavor": "He's recently recovered from being a \"scurvy dog.\"",
			"fr": {
				"name": "Mataf"
			},
			"health": 4,
			"id": "GVG_070",
			"name": "Salty Dog",
			"race": "Pirate",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"type": "Minion"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 4,
			"cardImage": "GVG_101.png",
			"collectible": true,
			"cost": 3,
			"flavor": "The Scarlet Crusade is doing market research to find out if the \"Mauve Crusade\" would be better received.",
			"fr": {
				"name": "Purificateur écarlate"
			},
			"health": 3,
			"id": "GVG_101",
			"mechanics": [
				"Battlecry"
			],
			"name": "Scarlet Purifier",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry</b>: Deal 2 damage to all minions with <b>Deathrattle</b>.",
			"type": "Minion"
		},
		{
			"artist": "Jesper Ejsing",
			"attack": 2,
			"cardImage": "GVG_055.png",
			"collectible": true,
			"cost": 4,
			"flavor": "If it breaks, just kick it a couple of times while yelling \"Durn thing!\"",
			"fr": {
				"name": "Cliquetteur perce-vrille"
			},
			"health": 5,
			"id": "GVG_055",
			"mechanics": [
				"Battlecry"
			],
			"name": "Screwjank Clunker",
			"playerClass": "Warrior",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry</b>: Give a friendly Mech +2/+2.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Ferraille tordue"
			},
			"id": "GVG_055e",
			"name": "Screwy Jank",
			"playerClass": "Warrior",
			"set": "Goblins vs Gnomes",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"artist": "Jason Chan",
			"cardImage": "GVG_057.png",
			"collectible": true,
			"cost": 2,
			"flavor": "The walrus of Light restores EIGHT Health.",
			"fr": {
				"name": "Sceau de Lumière"
			},
			"id": "GVG_057",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Seal of Light",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Restore #4 Health to your hero and gain +2 Attack this turn.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Sceau de Lumière"
			},
			"id": "GVG_057a",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Seal of Light",
			"set": "Goblins vs Gnomes",
			"text": "+2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "GVG_009.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Shadowbomber does her job, but she's kind of phoning it in at this point.",
			"fr": {
				"name": "Bombardière d’ombre"
			},
			"health": 1,
			"id": "GVG_009",
			"mechanics": [
				"Battlecry"
			],
			"name": "Shadowbomber",
			"playerClass": "Priest",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Deal 3 damage to each hero.",
			"type": "Minion"
		},
		{
			"artist": "Dan Scott",
			"attack": 2,
			"cardImage": "GVG_072.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Punching is its primary function. Also, its secondary function.",
			"fr": {
				"name": "Boxeur de l’ombre"
			},
			"health": 3,
			"id": "GVG_072",
			"name": "Shadowboxer",
			"playerClass": "Priest",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Whenever a character is healed, deal 1 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Dissimulé"
			},
			"id": "GVG_014a",
			"name": "Shadowed",
			"playerClass": "Priest",
			"set": "Goblins vs Gnomes",
			"text": "Health was swapped.",
			"type": "Enchantment"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 2,
			"cardImage": "GVG_058.png",
			"collectible": true,
			"cost": 2,
			"flavor": "He chooses to believe what he is programmed to believe!",
			"fr": {
				"name": "Mini-robot blindé"
			},
			"health": 2,
			"id": "GVG_058",
			"mechanics": [
				"Divine Shield"
			],
			"name": "Shielded Minibot",
			"playerClass": "Paladin",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 5,
			"cardImage": "GVG_053.png",
			"collectible": true,
			"cost": 6,
			"flavor": "She has three shieldbearers in her party to supply her with back ups when she gets low on durability.",
			"fr": {
				"name": "Vierge guerrière"
			},
			"health": 5,
			"id": "GVG_053",
			"mechanics": [
				"Battlecry"
			],
			"name": "Shieldmaiden",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Gain 5 Armor.",
			"type": "Minion"
		},
		{
			"artist": "Warren Mahy",
			"attack": 2,
			"cardImage": "GVG_075.png",
			"collectible": true,
			"cost": 2,
			"flavor": "If you hear someone yell, \"Cannonball!\" you're about to get wet. Or crushed.",
			"fr": {
				"name": "Canon du navire"
			},
			"health": 3,
			"id": "GVG_075",
			"name": "Ship's Cannon",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Whenever you summon a Pirate, deal 2 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Rayon réducteur"
			},
			"id": "GVG_011a",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Shrink Ray",
			"set": "Goblins vs Gnomes",
			"text": "-2 Attack this turn.",
			"type": "Enchantment"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "GVG_011.png",
			"collectible": true,
			"cost": 2,
			"flavor": "After the debacle of the Gnomish World Enlarger, gnomes are wary of size-changing inventions.",
			"fr": {
				"name": "Réducteur fou"
			},
			"health": 2,
			"id": "GVG_011",
			"mechanics": [
				"Battlecry"
			],
			"name": "Shrinkmeister",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Give a minion -2 Attack this turn.",
			"type": "Minion"
		},
		{
			"artist": "Zero Yue",
			"attack": 5,
			"cardImage": "GVG_086.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Wintergrasp Keep's only weakness!",
			"fr": {
				"name": "Engin de siège"
			},
			"health": 5,
			"id": "GVG_086",
			"name": "Siege Engine",
			"playerClass": "Warrior",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Whenever you gain Armor, give this minion +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Clint Langley",
			"attack": 2,
			"cardImage": "GVG_040.png",
			"collectible": true,
			"cost": 4,
			"flavor": "The elements respond to anyone who calls them for a worthy cause, even if you call them by yelling, \"MRGHRGLGLGL!\"",
			"fr": {
				"name": "Marche-esprit aileron vaseux"
			},
			"health": 5,
			"id": "GVG_040",
			"mechanics": [
				"Overload"
			],
			"name": "Siltfin Spiritwalker",
			"playerClass": "Shaman",
			"race": "Murloc",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Whenever another friendly Murloc dies, draw a card. <b>Overload</b>: (1)",
			"type": "Minion"
		},
		{
			"artist": "Christopher Moeller",
			"attack": 5,
			"cardImage": "GVG_114.png",
			"collectible": true,
			"cost": 8,
			"elite": true,
			"flavor": "When Sneed was defeated in the Deadmines, his shredder was sold at auction to an anonymous buyer. (Probably Hogger.)",
			"fr": {
				"name": "Vieux déchiqueteur de Sneed"
			},
			"health": 7,
			"id": "GVG_114",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Sneed's Old Shredder",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "<b>Deathrattle:</b> Summon a random legendary minion.",
			"type": "Minion"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 2,
			"cardImage": "GVG_002.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Do the slow chant when he waddles by: \"Chug! Chug! Chug!\"",
			"fr": {
				"name": "Souffle-neige"
			},
			"health": 3,
			"id": "GVG_002",
			"mechanics": [
				"Freeze"
			],
			"name": "Snowchugger",
			"playerClass": "Mage",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Freeze</b> any character damaged by this minion.",
			"type": "Minion"
		},
		{
			"artist": "Phil Saunders",
			"attack": 3,
			"cardImage": "GVG_123.png",
			"collectible": true,
			"cost": 3,
			"flavor": "The inventor of the goblin shredder is involved in several patent disputes with the inventor of the soot spewer.",
			"fr": {
				"name": "Cracheur de suie"
			},
			"health": 3,
			"id": "GVG_123",
			"mechanics": [
				"Spellpower"
			],
			"name": "Soot Spewer",
			"playerClass": "Mage",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Spell Damage +1</b>",
			"type": "Minion"
		},
		{
			"artist": "Dany Orizio",
			"attack": 3,
			"cardImage": "GVG_044.png",
			"collectible": true,
			"cost": 3,
			"flavor": "\"What if we put guns on it?\" -Fizzblitz, staring at the spider-transportation-machine",
			"fr": {
				"name": "Char araignée"
			},
			"health": 4,
			"id": "GVG_044",
			"name": "Spider Tank",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"type": "Minion"
		},
		{
			"artist": "Jun Kang",
			"attack": 2,
			"cardImage": "GVG_087.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Goblins seldom have the patience for sniping. Most prefer lobbing explosives.",
			"fr": {
				"name": "Sniper de Gentepression"
			},
			"health": 3,
			"id": "GVG_087",
			"name": "Steamwheedle Sniper",
			"playerClass": "Hunter",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Your Hero Power can target minions.",
			"type": "Minion"
		},
		{
			"artist": "Peet Cooper",
			"attack": 2,
			"cardImage": "GVG_067.png",
			"collectible": true,
			"cost": 2,
			"flavor": "The only thing worse than smelling troggs is listening to their poetry.",
			"fr": {
				"name": "Trogg brisepierre"
			},
			"health": 3,
			"id": "GVG_067",
			"name": "Stonesplinter Trogg",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Whenever your opponent casts a spell, gain +1 Attack.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Inversion"
			},
			"id": "PART_006a",
			"name": "Switched",
			"set": "Goblins vs Gnomes",
			"text": "Attack and Health have been swapped by Reversing Switch.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Mode Char"
			},
			"id": "GVG_030be",
			"name": "Tank Mode",
			"playerClass": "Druid",
			"set": "Goblins vs Gnomes",
			"text": "+1 Health.",
			"type": "Enchantment"
		},
		{
			"cardImage": "GVG_030b.png",
			"fr": {
				"name": "Mode Char"
			},
			"id": "GVG_030b",
			"name": "Tank Mode",
			"playerClass": "Druid",
			"set": "Goblins vs Gnomes",
			"text": "+1 Health.",
			"type": "Spell"
		},
		{
			"artist": "Matt Dixon",
			"attack": 0,
			"cardImage": "GVG_093.png",
			"collectible": true,
			"cost": 0,
			"flavor": "The engineering equivalent of a \"Kick Me\" sticker.",
			"fr": {
				"name": "Cible leurre"
			},
			"health": 2,
			"id": "GVG_093",
			"mechanics": [
				"Taunt"
			],
			"name": "Target Dummy",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Le roi"
			},
			"id": "GVG_046e",
			"name": "The King",
			"playerClass": "Hunter",
			"set": "Goblins vs Gnomes",
			"text": "Increased Attack.",
			"type": "Enchantment"
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
			"set": "Goblins vs Gnomes",
			"text": "Return a friendly minion to your hand.",
			"type": "Spell"
		},
		{
			"artist": "Den",
			"cardImage": "GVG_022.png",
			"collectible": true,
			"cost": 4,
			"flavor": "\"Get ready to strike oil!\" - Super-cheesy battle cry",
			"fr": {
				"name": "Huile d’affûtage de Bricoleur"
			},
			"id": "GVG_022",
			"mechanics": [
				"Combo"
			],
			"name": "Tinker's Sharpsword Oil",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Give your weapon +3 Attack. <b>Combo:</b> Give a random friendly minion +3 Attack.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Huile d’affûtage de Bricoleur"
			},
			"id": "GVG_022a",
			"name": "Tinker's Sharpsword Oil",
			"set": "Goblins vs Gnomes",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Huile d’affûtage de Bricoleur"
			},
			"id": "GVG_022b",
			"name": "Tinker's Sharpsword Oil",
			"set": "Goblins vs Gnomes",
			"text": "+3 Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Gabor Szikszai",
			"attack": 3,
			"cardImage": "GVG_102.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Won't you take me to... Tinkertown?",
			"fr": {
				"name": "Technicien de Brikabrok"
			},
			"health": 3,
			"id": "GVG_102",
			"mechanics": [
				"Battlecry"
			],
			"name": "Tinkertown Technician",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> If you have a Mech, gain +1/+1 and add a <b>Spare Part</b> to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan & Gabor",
			"attack": 5,
			"cardImage": "GVG_115.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "Something about power converters.",
			"fr": {
				"name": "Toshley"
			},
			"health": 7,
			"id": "GVG_115",
			"mechanics": [
				"Battlecry",
				"Deathrattle"
			],
			"name": "Toshley",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry and Deathrattle:</b> Add a <b>Spare Part</b> card to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Wei Wang",
			"attack": 5,
			"cardImage": "GVG_028.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "Gallywix believes in supply and demand. He supplies the beatings and demands you pay up!",
			"fr": {
				"name": "Prince marchand Gallywix"
			},
			"health": 8,
			"id": "GVG_028",
			"name": "Trade Prince Gallywix",
			"playerClass": "Rogue",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "Whenever your opponent casts a spell, gain a copy of it and give them a Coin.",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"cardImage": "GVG_033.png",
			"collectible": true,
			"cost": 9,
			"flavor": "Healing: It grows on trees!",
			"fr": {
				"name": "Arbre de vie"
			},
			"id": "GVG_033",
			"name": "Tree of Life",
			"playerClass": "Druid",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Restore all characters to full Health.",
			"type": "Spell"
		},
		{
			"artist": "Mike Sass",
			"attack": 6,
			"cardImage": "GVG_118.png",
			"collectible": true,
			"cost": 7,
			"elite": true,
			"flavor": "He keeps earthinating the countryside despite attempts to stop him.",
			"fr": {
				"name": "Troggzor le Terreminator"
			},
			"health": 6,
			"id": "GVG_118",
			"name": "Troggzor the Earthinator",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "Whenever your opponent casts a spell, summon a Burly Rockjaw Trogg.",
			"type": "Minion"
		},
		{
			"artist": "Sean O'Daniels",
			"cardImage": "GVG_003.png",
			"collectible": true,
			"cost": 2,
			"flavor": "The denizens of Azeroth have no idea how much work goes into stabilizing portals.  We spend like 30% of GDP on portal upkeep.",
			"fr": {
				"name": "Portail instable"
			},
			"id": "GVG_003",
			"name": "Unstable Portal",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "Add a random minion to your hand. It costs (3) less.",
			"type": "Spell"
		},
		{
			"artist": "Nutchapol Thitinunthakorn",
			"attack": 5,
			"cardImage": "GVG_083.png",
			"collectible": true,
			"cost": 5,
			"flavor": "It's the same as the previous generation but they slapped the word \"upgraded\" on it to sell it for double.",
			"fr": {
				"name": "Robot réparateur amélioré"
			},
			"health": 5,
			"id": "GVG_083",
			"mechanics": [
				"Battlecry"
			],
			"name": "Upgraded Repair Bot",
			"playerClass": "Priest",
			"race": "Mech",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Give a friendly Mech +4 Health.",
			"type": "Minion"
		},
		{
			"artist": "Chris Seaman",
			"attack": 4,
			"cardImage": "GVG_111t.png",
			"cost": 8,
			"elite": true,
			"fr": {
				"name": "V-07-TR-0N"
			},
			"health": 8,
			"id": "GVG_111t",
			"mechanics": [
				"Charge"
			],
			"name": "V-07-TR-0N",
			"race": "Mech",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "<b>Charge</b>\n<b>Mega-Windfury</b> <i>(Can attack four times a turn.)</i>",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Choix de Velen"
			},
			"id": "GVG_010b",
			"name": "Velen's Chosen",
			"set": "Goblins vs Gnomes",
			"text": "+2/+4 and <b>Spell Damage +1</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "GVG_010.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Velen wrote a \"Lovely Card\" for Tyrande with a picture of the Deeprun Tram that said \"I Choo-Choo-Choose you!\"",
			"fr": {
				"name": "Choix de Velen"
			},
			"id": "GVG_010",
			"name": "Velen's Chosen",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "Give a minion +2/+4 and <b>Spell Damage +1</b>.",
			"type": "Spell"
		},
		{
			"artist": "Guangjian Huang",
			"attack": 0,
			"cardImage": "GVG_039.png",
			"collectible": true,
			"cost": 2,
			"flavor": "You can usually find these at the totemist's market on Saturdays.",
			"fr": {
				"name": "Totem de vitalité"
			},
			"health": 3,
			"id": "GVG_039",
			"name": "Vitality Totem",
			"playerClass": "Shaman",
			"race": "Totem",
			"rarity": "Rare",
			"set": "Goblins vs Gnomes",
			"text": "At the end of your turn, restore 4 Health to your hero.",
			"type": "Minion"
		},
		{
			"artist": "Raymond Swanland",
			"attack": 6,
			"cardImage": "GVG_014.png",
			"collectible": true,
			"cost": 5,
			"elite": true,
			"flavor": "Vol'jin is a shadow hunter, which is like a shadow priest except more voodoo.",
			"fr": {
				"name": "Vol’jin"
			},
			"health": 2,
			"id": "GVG_014",
			"mechanics": [
				"Battlecry"
			],
			"name": "Vol'jin",
			"playerClass": "Priest",
			"rarity": "Legendary",
			"set": "Goblins vs Gnomes",
			"text": "<b>Battlecry:</b> Swap Health with another minion.",
			"type": "Minion"
		},
		{
			"artist": "Tyler Walpole",
			"attack": 1,
			"cardImage": "GVG_051.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Mass production of warbots was halted when it was discovered that they were accidentally being produced at \"sample size.\"",
			"fr": {
				"name": "Robo-baston"
			},
			"health": 3,
			"id": "GVG_051",
			"mechanics": [
				"Enrage"
			],
			"name": "Warbot",
			"playerClass": "Warrior",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Enrage:</b> +1 Attack.",
			"type": "Minion"
		},
		{
			"artist": "Jonboy Meyers",
			"attack": 2,
			"cardImage": "GVG_122.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Bane of spellcasters and spelling bees everywhere.",
			"fr": {
				"name": "Mini stoppe-sort"
			},
			"health": 5,
			"id": "GVG_122",
			"mechanics": [
				"Aura"
			],
			"name": "Wee Spellstopper",
			"playerClass": "Mage",
			"rarity": "Epic",
			"set": "Goblins vs Gnomes",
			"text": "Adjacent minions can't be targeted by spells or Hero Powers.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Bien équipé"
			},
			"id": "GVG_060e",
			"name": "Well Equipped",
			"playerClass": "Paladin",
			"set": "Goblins vs Gnomes",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Lames tourbillonnantes"
			},
			"id": "PART_007e",
			"name": "Whirling Blades",
			"set": "Goblins vs Gnomes",
			"text": "+1 Attack.",
			"type": "Enchantment"
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
			"set": "Goblins vs Gnomes",
			"text": "Give a minion +1 Attack.",
			"type": "Spell"
		},
		{
			"artist": "Jim Nelson",
			"attack": 3,
			"cardImage": "GVG_037.png",
			"collectible": true,
			"cost": 2,
			"flavor": "If you pay a little extra, you can get it in \"candy-apple red.\"",
			"fr": {
				"name": "Zap-o-matic tournoyant"
			},
			"health": 2,
			"id": "GVG_037",
			"mechanics": [
				"Windfury"
			],
			"name": "Whirling Zap-o-matic",
			"playerClass": "Shaman",
			"race": "Mech",
			"rarity": "Common",
			"set": "Goblins vs Gnomes",
			"text": "<b>Windfury</b>",
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
			"set": "League of Explorers",
			"text": "<b>Drink?</b>",
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
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Ancient Curse",
			"set": "League of Explorers",
			"text": "When you draw this, take 7 damage and draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA13_2.png",
			"cost": 0,
			"fr": {
				"name": "Puissance des anciens"
			},
			"id": "LOEA13_2",
			"name": "Ancient Power",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\nGive each player a random card. It costs (0).",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA13_2H.png",
			"cost": 0,
			"fr": {
				"name": "Puissance des anciens"
			},
			"id": "LOEA13_2H",
			"name": "Ancient Power",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\nAdd a random card to your hand. It costs (0).",
			"type": "Hero Power"
		},
		{
			"artist": "Slawomir Maniak",
			"attack": 7,
			"cardImage": "LOE_110.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Warning: Do not expose to direct sunlight.",
			"fr": {
				"name": "Ombre ancienne"
			},
			"health": 4,
			"id": "LOE_110",
			"mechanics": [
				"Battlecry"
			],
			"name": "Ancient Shade",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b> Shuffle an 'Ancient Curse' into your deck that deals 7 damage to you when drawn.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA06_03.png",
			"cost": 2,
			"fr": {
				"name": "Terrestre animé"
			},
			"id": "LOEA06_03",
			"name": "Animate Earthen",
			"set": "League of Explorers",
			"text": "Give your minions +1/+1 and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA06_03h.png",
			"cost": 2,
			"fr": {
				"name": "Terrestre animé"
			},
			"id": "LOEA06_03h",
			"name": "Animate Earthen",
			"set": "League of Explorers",
			"text": "Give your minions +3/+3 and <b>Taunt</b>.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Animé"
			},
			"id": "LOEA06_03e",
			"name": "Animated",
			"set": "League of Explorers",
			"text": "+1/+1 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Animé"
			},
			"id": "LOEA06_03eh",
			"name": "Animated",
			"set": "League of Explorers",
			"text": "+3/+3 and <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "LOE_119.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Try putting it on.  Wait, let me get my camera.",
			"fr": {
				"name": "Armure animée"
			},
			"health": 4,
			"id": "LOE_119",
			"name": "Animated Armor",
			"playerClass": "Mage",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "Your hero can only take 1 damage at a time.",
			"type": "Minion"
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
			"set": "League of Explorers",
			"text": "You've disturbed the ancient statue...",
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
			"set": "League of Explorers",
			"type": "Minion"
		},
		{
			"artist": "Paul Mafayon",
			"attack": 4,
			"cardImage": "LOE_061.png",
			"collectible": true,
			"cost": 5,
			"flavor": "He's actually a 1/1 who picked up the hammer from the last guy.",
			"fr": {
				"name": "Sentinelle Anubisath"
			},
			"health": 4,
			"id": "LOE_061",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Anubisath Sentinel",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Deathrattle:</b> Give a random friendly minion +3/+3.",
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
			"set": "League of Explorers",
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
			"set": "League of Explorers",
			"type": "Minion"
		},
		{
			"artist": "Ryan Metcalf",
			"cardImage": "LOE_026.png",
			"collectible": true,
			"cost": 10,
			"flavor": "Theme song by Ellie Goldfin and Blagghghlrlrl Harris.",
			"fr": {
				"name": "Tous les murlocs de ta vie"
			},
			"id": "LOE_026",
			"name": "Anyfin Can Happen",
			"playerClass": "Paladin",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "Summon 7 Murlocs that died this game.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"attack": 7,
			"cardImage": "LOE_092.png",
			"collectible": true,
			"cost": 9,
			"elite": true,
			"flavor": "He's very good at retrieving artifacts.  From other people's museums.",
			"fr": {
				"name": "Prince voleur Rafaam"
			},
			"health": 8,
			"id": "LOE_092",
			"mechanics": [
				"Battlecry"
			],
			"name": "Arch-Thief Rafaam",
			"rarity": "Legendary",
			"set": "League of Explorers",
			"text": "<b>Battlecry: Discover</b> a powerful Artifact.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_22.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Archaedas"
			},
			"health": 5,
			"id": "LOEA16_22",
			"name": "Archaedas",
			"set": "League of Explorers",
			"text": "At the end of your turn, turn a random enemy minion into a 0/2 Statue.",
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
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_22H.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "Archaedas"
			},
			"health": 10,
			"id": "LOEA16_22H",
			"name": "Archaedas",
			"set": "League of Explorers",
			"text": "At the end of your turn, turn a random enemy minion into a 0/2 Statue.",
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
			"set": "League of Explorers",
			"text": "Get 1 turn closer to the Exit!",
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
			"set": "League of Explorers",
			"text": "Restore #10 Health to ALL characters.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Béni"
			},
			"id": "LOEA16_20e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Blessed",
			"set": "League of Explorers",
			"text": "<b>Immune</b> this turn.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Bénédiction du soleil"
			},
			"id": "LOEA16_20H",
			"name": "Blessing of the Sun",
			"set": "League of Explorers",
			"text": "<b>Immune</b>.",
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
			"set": "League of Explorers",
			"text": "Give a minion <b>Immune</b> this turn.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA01_02h.png",
			"fr": {
				"name": "Bénédictions du soleil"
			},
			"id": "LOEA01_02h",
			"name": "Blessings of the Sun",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\n Phaerix is <b>Immune</b> while he controls the Rod of the Sun.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA01_02.png",
			"fr": {
				"name": "Bénédictions du soleil"
			},
			"id": "LOEA01_02",
			"name": "Blessings of the Sun",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\nWhoever controls the Rod of the Sun is <b>Immune.</b>",
			"type": "Hero Power"
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
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b>Take control of your opponent's weapon.",
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
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b>Take control of your opponent's weapon.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA07_20.png",
			"cost": 1,
			"fr": {
				"name": "Boum !"
			},
			"id": "LOEA07_20",
			"name": "Boom!",
			"set": "League of Explorers",
			"text": "Deal 3 damage to all enemy minions.",
			"type": "Spell"
		},
		{
			"artist": "Sam Nielson",
			"attack": 2,
			"cardImage": "LOE_077.png",
			"collectible": true,
			"cost": 3,
			"elite": true,
			"flavor": "Contains 75% more fiber than his brother Magni!",
			"fr": {
				"name": "Brann Barbe-de-Bronze"
			},
			"health": 4,
			"id": "LOE_077",
			"mechanics": [
				"Aura"
			],
			"name": "Brann Bronzebeard",
			"rarity": "Legendary",
			"set": "League of Explorers",
			"text": "Your <b>Battlecries</b> trigger twice.",
			"type": "Minion"
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
			"mechanics": [
				"Deathrattle",
				"Taunt"
			],
			"name": "Cauldron",
			"set": "League of Explorers",
			"text": "<b>Taunt</b>\n<b>Deathrattle:</b> Save Sir Finley!",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Chaudron"
			},
			"id": "LOEA09_7e",
			"name": "Cauldron",
			"set": "League of Explorers",
			"type": "Enchantment"
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
			"mechanics": [
				"Deathrattle",
				"Taunt"
			],
			"name": "Cauldron",
			"set": "League of Explorers",
			"text": "<b>Taunt</b>\n<b>Deathrattle:</b> Save Sir Finley and stop the Naga onslaught!",
			"type": "Minion"
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
			"set": "League of Explorers",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA05_01.png",
			"fr": {
				"name": "Chef Scarvash"
			},
			"health": 30,
			"id": "LOEA05_01",
			"name": "Chieftain Scarvash",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_21.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Chef Scarvash"
			},
			"health": 5,
			"id": "LOEA16_21",
			"mechanics": [
				"Aura"
			],
			"name": "Chieftain Scarvash",
			"set": "League of Explorers",
			"text": "Enemy cards cost (1) more.",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_21H.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "Chef Scarvash"
			},
			"health": 10,
			"id": "LOEA16_21H",
			"mechanics": [
				"Aura"
			],
			"name": "Chieftain Scarvash",
			"set": "League of Explorers",
			"text": "Enemy cards cost (2) more.",
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
			"set": "League of Explorers",
			"text": "Draw 3 cards.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_11.png",
			"cost": 0,
			"fr": {
				"name": "Couronne de Kael’thas"
			},
			"id": "LOEA16_11",
			"name": "Crown of Kael'thas",
			"set": "League of Explorers",
			"text": "Deal $10 damage randomly split among ALL characters.",
			"type": "Spell"
		},
		{
			"artist": "Alex Horley Orlandelli",
			"cardImage": "LOE_007.png",
			"collectible": true,
			"cost": 2,
			"flavor": "This is what happens when Rafaam stubs his toe unexpectedly.",
			"fr": {
				"name": "Malédiction de Rafaam"
			},
			"id": "LOE_007",
			"name": "Curse of Rafaam",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "Give your opponent a 'Cursed!' card.\nWhile they hold it, they take 2 damage on their turn.",
			"type": "Spell"
		},
		{
			"artist": "Craig Mullins",
			"attack": 2,
			"cardImage": "LOE_118.png",
			"collectible": true,
			"cost": 1,
			"durability": 3,
			"flavor": "The Curse is that you have to listen to \"MMMBop\" on repeat.",
			"fr": {
				"name": "Lame maudite"
			},
			"id": "LOE_118",
			"name": "Cursed Blade",
			"playerClass": "Warrior",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "Double all damage dealt to your hero.",
			"type": "Weapon"
		},
		{
			"fr": {
				"name": "Lame maudite"
			},
			"id": "LOE_118e",
			"name": "Cursed Blade",
			"playerClass": "Warrior",
			"set": "League of Explorers",
			"text": "Double all damage dealt to your hero.",
			"type": "Enchantment"
		},
		{
			"artist": "Jim Nelson",
			"cardImage": "LOE_007t.png",
			"cost": 2,
			"fr": {
				"name": "Maudit !"
			},
			"id": "LOE_007t",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Cursed!",
			"playerClass": "Warlock",
			"set": "League of Explorers",
			"text": "While this is in your hand, take 2 damage at the start of your turn.",
			"type": "Spell"
		},
		{
			"artist": "George Davis",
			"attack": 2,
			"cardImage": "LOE_023.png",
			"collectible": true,
			"cost": 2,
			"flavor": "I'm offering you a bargain here!  This amazing vacuum cleaner for your soul!",
			"fr": {
				"name": "Sinistre colporteur"
			},
			"health": 2,
			"id": "LOE_023",
			"mechanics": [
				"Battlecry"
			],
			"name": "Dark Peddler",
			"playerClass": "Warlock",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Battlecry: Discover</b> a\n1-Cost card.",
			"type": "Minion"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "LOE_021.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Five years of tap-dancing lessons are FINALLY going to pay off!",
			"fr": {
				"name": "Piège de fléchettes"
			},
			"id": "LOE_021",
			"mechanics": [
				"Secret"
			],
			"name": "Dart Trap",
			"playerClass": "Hunter",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Secret:</b> When an opposing Hero Power is used, deal 5 damage to a random enemy.",
			"type": "Spell"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Debris",
			"set": "League of Explorers",
			"text": "<b>Taunt.</b>",
			"type": "Minion"
		},
		{
			"artist": "Matt Dixon",
			"attack": 2,
			"cardImage": "LOE_020.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Dang.  This card is sweet.  Almost as sweet as Dessert Camel.",
			"fr": {
				"name": "Dromadaire du désert"
			},
			"health": 4,
			"id": "LOE_020",
			"mechanics": [
				"Battlecry"
			],
			"name": "Desert Camel",
			"playerClass": "Hunter",
			"race": "Beast",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b> Put a 1-Cost minion from each deck into the battlefield.",
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
			"set": "League of Explorers",
			"text": "Draw a card.\nGive your opponent a Wish.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA02_02h.png",
			"cost": 0,
			"fr": {
				"name": "Intuition de djinn"
			},
			"id": "LOEA02_02h",
			"name": "Djinn’s Intuition",
			"set": "League of Explorers",
			"text": "Draw a card. Gain a Mana Crystal. Give your opponent a Wish.",
			"type": "Hero Power"
		},
		{
			"artist": "Jakub Kasper",
			"attack": 4,
			"cardImage": "LOE_053.png",
			"collectible": true,
			"cost": 5,
			"flavor": "If you want your wish granted, don't rub him the wrong way.",
			"fr": {
				"name": "Djinn des zéphirs"
			},
			"health": 6,
			"id": "LOE_053",
			"name": "Djinni of Zephyrs",
			"rarity": "Epic",
			"set": "League of Explorers",
			"text": "Whenever you cast a spell on another friendly minion, cast a copy of it on this one.",
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
			"set": "League of Explorers",
			"text": "Draw a card.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA07_18.png",
			"cost": 1,
			"fr": {
				"name": "Dynamite"
			},
			"id": "LOEA07_18",
			"name": "Dynamite",
			"set": "League of Explorers",
			"text": "Deal $10 damage.",
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
			"set": "League of Explorers",
			"type": "Minion"
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
			"set": "League of Explorers",
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
			"set": "League of Explorers",
			"type": "Minion"
		},
		{
			"artist": "Jim Nelson",
			"attack": 7,
			"cardImage": "LOE_107.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Don't blink!  Don't turn your back, don't look away, and DON'T BLINK.",
			"fr": {
				"name": "Statue sinistre"
			},
			"health": 7,
			"id": "LOE_107",
			"name": "Eerie Statue",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "Can’t attack unless it’s the only minion in the battlefield.",
			"type": "Minion"
		},
		{
			"artist": "Luke Mancini",
			"attack": 3,
			"cardImage": "LOE_079.png",
			"collectible": true,
			"cost": 4,
			"elite": true,
			"flavor": "A large part of her job entails not mixing up the Map to the Golden Monkey with the Map to Monkey Island.",
			"fr": {
				"name": "Élise Cherchétoile"
			},
			"health": 5,
			"id": "LOE_079",
			"mechanics": [
				"Battlecry"
			],
			"name": "Elise Starseeker",
			"rarity": "Legendary",
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b> Shuffle the 'Map to the Golden Monkey'   into your deck.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA09_3H.png",
			"cost": 0,
			"fr": {
				"name": "Faim sans fin"
			},
			"id": "LOEA09_3H",
			"name": "Endless Hunger",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\nSummon a Hungry Naga.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Enragé"
			},
			"id": "LOEA09_2eH",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Enraged",
			"set": "League of Explorers",
			"text": "+5 Attack",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Enragé"
			},
			"id": "LOEA09_2e",
			"mechanics": [
				"OneTurnEffect"
			],
			"name": "Enraged",
			"set": "League of Explorers",
			"text": "+2 Attack",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA09_2H.png",
			"cost": 2,
			"fr": {
				"name": "Enragé !"
			},
			"id": "LOEA09_2H",
			"name": "Enraged!",
			"set": "League of Explorers",
			"text": "Give your hero +5 attack this turn.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA09_2.png",
			"cost": 2,
			"fr": {
				"name": "Enragé !"
			},
			"id": "LOEA09_2",
			"name": "Enraged!",
			"set": "League of Explorers",
			"text": "Give your hero +2 attack this turn.",
			"type": "Hero Power"
		},
		{
			"artist": "Alex Konstad",
			"cardImage": "LOE_104.png",
			"collectible": true,
			"cost": 6,
			"flavor": "It's perfectly safe as long as you remember to put in air holes.",
			"fr": {
				"name": "Ensevelir"
			},
			"id": "LOE_104",
			"name": "Entomb",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "Choose an enemy minion.\nShuffle it into your deck.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_02.png",
			"cost": 0,
			"fr": {
				"name": "Fuyez !"
			},
			"id": "LOEA04_02",
			"name": "Escape!",
			"rarity": "Free",
			"set": "League of Explorers",
			"text": "Encounter new obstacles!",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA04_02h.png",
			"cost": 0,
			"fr": {
				"name": "Fuyez !"
			},
			"id": "LOEA04_02h",
			"name": "Escape!",
			"set": "League of Explorers",
			"text": "Encounter new obstacles!",
			"type": "Hero Power"
		},
		{
			"artist": "Ben Zhang",
			"attack": 6,
			"cardImage": "LOE_003.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Despite the name, he's a solid conjurer.",
			"fr": {
				"name": "Adjurateur éthérien"
			},
			"health": 3,
			"id": "LOE_003",
			"mechanics": [
				"Battlecry"
			],
			"name": "Ethereal Conjurer",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Battlecry: Discover</b> a spell.",
			"type": "Minion"
		},
		{
			"artist": "Andrius Matijoshius",
			"cardImage": "LOE_113.png",
			"collectible": true,
			"cost": 7,
			"flavor": "Everyfin is cool when you're part of a murloc team!",
			"fr": {
				"name": "Tout est vraiment génial"
			},
			"id": "LOE_113",
			"name": "Everyfin is Awesome",
			"playerClass": "Shaman",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "Give your minions +2/+2.\nCosts (1) less for each Murloc you control.",
			"type": "Spell"
		},
		{
			"artist": "Raymond Swanland",
			"cardImage": "LOE_111.png",
			"collectible": true,
			"cost": 5,
			"flavor": "MOM! DAD! DON'T TOUCH IT! IT'S EVIL!!!!!!",
			"fr": {
				"name": "Mal déterré"
			},
			"id": "LOE_111",
			"name": "Excavated Evil",
			"playerClass": "Priest",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "Deal $3 damage to all minions.\nShuffle this card into your opponent's deck.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Chapeau d’explorateur"
			},
			"id": "LOE_105e",
			"name": "Explorer's Hat",
			"playerClass": "Hunter",
			"set": "League of Explorers",
			"text": "+1/+1. <b>Deathrattle:</b> Add an Explorer's Hat to your hand.",
			"type": "Enchantment"
		},
		{
			"artist": "Joe Wilson",
			"cardImage": "LOE_105.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Harrison Jones was disappointed that he didn't get to be part of the League of Explorers, but his hat did.",
			"fr": {
				"name": "Chapeau d’explorateur"
			},
			"id": "LOE_105",
			"name": "Explorer's Hat",
			"playerClass": "Hunter",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "Give a minion +1/+1 and \"<b>Deathrattle:</b> Add an Explorer's Hat to your hand.\"",
			"type": "Spell"
		},
		{
			"cardImage": "LOE_008.png",
			"cost": 1,
			"flavor": "-",
			"fr": {
				"name": "Œil d’Hakkar"
			},
			"id": "LOE_008",
			"name": "Eye of Hakkar",
			"set": "League of Explorers",
			"text": "Take a secret from your opponent's deck and put it into the battlefield.",
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
			"set": "League of Explorers",
			"text": "Take a secret from your opponent's deck and put it into the battlefield.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA16_13.png",
			"cost": 0,
			"fr": {
				"name": "Œil d’Orsis"
			},
			"id": "LOEA16_13",
			"name": "Eye of Orsis",
			"set": "League of Explorers",
			"text": "<b>Discover</b> a minion and gain 3 copies of it.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Mort de faim"
			},
			"id": "LOEA09_3aH",
			"name": "Famished",
			"set": "League of Explorers",
			"text": "Quite Hungry.",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Mort de faim"
			},
			"id": "LOEA09_3a",
			"name": "Famished",
			"set": "League of Explorers",
			"text": "Quite Hungry.",
			"type": "Enchantment"
		},
		{
			"artist": "Peter Stapleton",
			"attack": 3,
			"cardImage": "LOE_022.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Fierce monkey.  That funky monkey.",
			"fr": {
				"name": "Singe féroce"
			},
			"health": 4,
			"id": "LOE_022",
			"mechanics": [
				"Taunt"
			],
			"name": "Fierce Monkey",
			"playerClass": "Warrior",
			"race": "Beast",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA07_03h.png",
			"cost": 0,
			"fr": {
				"name": "Fuir la mine !"
			},
			"id": "LOEA07_03h",
			"name": "Flee the Mine!",
			"set": "League of Explorers",
			"text": "Escape the Troggs!",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA07_03.png",
			"cost": 0,
			"fr": {
				"name": "Fuir la mine !"
			},
			"id": "LOEA07_03",
			"name": "Flee the Mine!",
			"set": "League of Explorers",
			"text": "Escape the Troggs!",
			"type": "Hero Power"
		},
		{
			"artist": "Richard Wright",
			"cardImage": "LOE_002.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Why does a forgotten torch turn into a roaring torch with no provocation?  It's one of life's many mysteries.",
			"fr": {
				"name": "Torche oubliée"
			},
			"id": "LOE_002",
			"name": "Forgotten Torch",
			"playerClass": "Mage",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "Deal $3 damage. Shuffle a 'Roaring Torch' into your deck that deals 6 damage.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Fossilisé"
			},
			"id": "LOE_073e",
			"name": "Fossilized",
			"set": "League of Explorers",
			"text": "Has <b>Taunt</b>.",
			"type": "Enchantment"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 8,
			"cardImage": "LOE_073.png",
			"collectible": true,
			"cost": 8,
			"flavor": "This was the only job he could get after the dinosaur theme park debacle.",
			"fr": {
				"name": "Diablosaure fossilisé"
			},
			"health": 8,
			"id": "LOE_073",
			"mechanics": [
				"Battlecry"
			],
			"name": "Fossilized Devilsaur",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b> If you control a Beast, gain <b>Taunt</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA09_3b.png",
			"cost": 0,
			"fr": {
				"name": "Faim"
			},
			"id": "LOEA09_3b",
			"name": "Getting Hungry",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\nSummon a 1/1 Hungry Naga.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA09_3.png",
			"cost": 0,
			"fr": {
				"name": "Faim"
			},
			"id": "LOEA09_3",
			"name": "Getting Hungry",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\nSummon a Hungry Naga.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA09_3c.png",
			"cost": 0,
			"fr": {
				"name": "Faim"
			},
			"id": "LOEA09_3c",
			"name": "Getting Hungry",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\nSummon a 2/1 Hungry Naga.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA09_3d.png",
			"cost": 0,
			"fr": {
				"name": "Faim"
			},
			"id": "LOEA09_3d",
			"name": "Getting Hungry",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\nSummon a 5/1 Hungry Naga.",
			"type": "Hero Power"
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
			"set": "League of Explorers",
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
			"set": "League of Explorers",
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
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_24H.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "Aileron-Géant"
			},
			"health": 10,
			"id": "LOEA16_24H",
			"name": "Giantfin",
			"race": "Murloc",
			"set": "League of Explorers",
			"text": "At the end of your turn, draw 2 cards.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_24.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Aileron-Géant"
			},
			"health": 5,
			"id": "LOEA16_24",
			"name": "Giantfin",
			"race": "Murloc",
			"set": "League of Explorers",
			"text": "At the end of your turn, draw until you have as many cards as your opponent.",
			"type": "Minion"
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
			"mechanics": [
				"Battlecry",
				"Taunt"
			],
			"name": "Golden Monkey",
			"set": "League of Explorers",
			"text": "<b>Taunt</b>\n<b>Battlecry:</b> Replace your hand and deck with <b>Legendary</b> minions.",
			"type": "Minion"
		},
		{
			"artist": "Skan Srisuwan",
			"attack": 3,
			"cardImage": "LOE_039.png",
			"collectible": true,
			"cost": 4,
			"flavor": "A-1 and A-2 went nuts, when they should have gone bolts.",
			"fr": {
				"name": "Gorillobot A-3"
			},
			"health": 4,
			"id": "LOE_039",
			"mechanics": [
				"Battlecry"
			],
			"name": "Gorillabot A-3",
			"race": "Mech",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b> If you control another Mech, <b>Discover</b> a Mech.",
			"type": "Minion"
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
			"set": "League of Explorers",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_10.png",
			"cost": 0,
			"fr": {
				"name": "Coupe de sang hakkari"
			},
			"id": "LOEA16_10",
			"name": "Hakkari Blood Goblet",
			"set": "League of Explorers",
			"text": "Transform a minion into a 2/1 Pit Snake.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA08_01h.png",
			"fr": {
				"name": "Archaedas (héroïque)"
			},
			"health": 30,
			"id": "LOEA08_01h",
			"name": "Heroic Archaedas",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA04_01h.png",
			"fr": {
				"name": "Fuite (héroïque)"
			},
			"health": 100,
			"id": "LOEA04_01h",
			"name": "Heroic Escape",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA10_1H.png",
			"fr": {
				"name": "Aileron-Géant (héroïque)"
			},
			"health": 30,
			"id": "LOEA10_1H",
			"name": "Heroic Giantfin",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA07_02h.png",
			"fr": {
				"name": "Puits de mine (héroïque)"
			},
			"health": 80,
			"id": "LOEA07_02h",
			"name": "Heroic Mine Shaft",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"fr": {
				"name": "Mode héroïque"
			},
			"id": "LOEA01_11he",
			"name": "Heroic Mode",
			"set": "League of Explorers",
			"text": "+3/+3 if Phaerix controls the Rod.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA12_1H.png",
			"fr": {
				"name": "Naz’jar (héroïque)"
			},
			"health": 30,
			"id": "LOEA12_1H",
			"name": "Heroic Naz'jar",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA01_01h.png",
			"fr": {
				"name": "Phaerix (héroïque)"
			},
			"health": 30,
			"id": "LOEA01_01h",
			"name": "Heroic Phaerix",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA15_1H.png",
			"fr": {
				"name": "Rafaam (héroïque)"
			},
			"health": 30,
			"id": "LOEA15_1H",
			"name": "Heroic Rafaam",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA16_1H.png",
			"fr": {
				"name": "Rafaam (héroïque)"
			},
			"health": 30,
			"id": "LOEA16_1H",
			"name": "Heroic Rafaam",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA05_01h.png",
			"fr": {
				"name": "Scarvash (héroïque)"
			},
			"health": 30,
			"id": "LOEA05_01h",
			"name": "Heroic Scarvash",
			"set": "League of Explorers",
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
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA13_1h.png",
			"fr": {
				"name": "Squeletosaurus Hex (héroïque)"
			},
			"health": 30,
			"id": "LOEA13_1h",
			"name": "Heroic Skelesaurus",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA09_1H.png",
			"fr": {
				"name": "Ondulance (héroïque)"
			},
			"health": 30,
			"id": "LOEA09_1H",
			"name": "Heroic Slitherspear",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA02_01h.png",
			"fr": {
				"name": "Zinaar (héroïque)"
			},
			"health": 30,
			"id": "LOEA02_01h",
			"name": "Heroic Zinaar",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"fr": {
				"name": "Trompeur"
			},
			"id": "LOE_030e",
			"name": "Hollow",
			"set": "League of Explorers",
			"text": "Stats copied.",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 3,
			"cardImage": "LOE_046.png",
			"collectible": true,
			"cost": 2,
			"flavor": "Deals damage when he croaks.",
			"fr": {
				"name": "Crapaud énorme"
			},
			"health": 2,
			"id": "LOE_046",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Huge Toad",
			"race": "Beast",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Deathrattle:</b> Deal 1 damage to a random enemy.",
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
			"set": "League of Explorers",
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
			"set": "League of Explorers",
			"type": "Minion"
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
			"set": "League of Explorers",
			"type": "Minion"
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
			"set": "League of Explorers",
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
			"set": "League of Explorers",
			"type": "Minion"
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
			"set": "League of Explorers",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_29b.png",
			"fr": {
				"name": "Examiner les runes"
			},
			"id": "LOEA04_29b",
			"name": "Investigate the Runes",
			"set": "League of Explorers",
			"text": "Draw 2 cards.",
			"type": "Spell"
		},
		{
			"artist": "Jaemin Kim",
			"attack": 1,
			"cardImage": "LOE_029.png",
			"collectible": true,
			"cost": 2,
			"flavor": "It's amazing what you can do with super glue!",
			"fr": {
				"name": "Scarabée orné de joyaux"
			},
			"health": 1,
			"id": "LOE_029",
			"mechanics": [
				"Battlecry"
			],
			"name": "Jeweled Scarab",
			"race": "Beast",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Battlecry: Discover</b> a\n3-Cost card.",
			"type": "Minion"
		},
		{
			"artist": "Mike Sass",
			"attack": 4,
			"cardImage": "LOE_051.png",
			"collectible": true,
			"cost": 4,
			"flavor": "The REAL angry chicken!",
			"fr": {
				"name": "Sélénien de la jungle"
			},
			"health": 4,
			"id": "LOE_051",
			"name": "Jungle Moonkin",
			"playerClass": "Druid",
			"race": "Beast",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "Both players have\n<b>Spell Damage +2</b>.",
			"type": "Minion"
		},
		{
			"artist": "James Ryman",
			"attack": 3,
			"cardImage": "LOE_017.png",
			"collectible": true,
			"cost": 4,
			"flavor": "U da man!  No, U da man!",
			"fr": {
				"name": "Gardienne d’Uldaman"
			},
			"health": 4,
			"id": "LOE_017",
			"mechanics": [
				"Battlecry"
			],
			"name": "Keeper of Uldaman",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b> Set a minion's Attack and Health to 3.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_14.png",
			"cost": 0,
			"fr": {
				"name": "Pipe de Khadgar"
			},
			"id": "LOEA16_14",
			"name": "Khadgar's Pipe",
			"set": "League of Explorers",
			"text": "Put a random spell into each player's hand.  Yours costs (0).",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA12_1.png",
			"fr": {
				"name": "Dame Naz’jar"
			},
			"health": 30,
			"id": "LOEA12_1",
			"name": "Lady Naz'jar",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_25.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Dame Naz’jar"
			},
			"health": 5,
			"id": "LOEA16_25",
			"name": "Lady Naz'jar",
			"set": "League of Explorers",
			"text": "At the end of your turn, replace all other minions with new ones of the same Cost.",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_25H.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "Dame Naz’jar"
			},
			"health": 10,
			"id": "LOEA16_25H",
			"name": "Lady Naz'jar",
			"set": "League of Explorers",
			"text": "At the end of your turn, replace all other minions with new ones of the same Cost.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Lanterne de puissance"
			},
			"id": "LOEA16_3e",
			"name": "Lantern of Power",
			"set": "League of Explorers",
			"text": "+10/+10.",
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
			"set": "League of Explorers",
			"text": "Give a minion +10/+10.",
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
			"race": "Beast",
			"set": "League of Explorers",
			"text": "Your minions have +1 Attack.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA_01.png",
			"cost": 3,
			"fr": {
				"name": "Présence menaçante"
			},
			"id": "LOEA_01",
			"name": "Looming Presence",
			"set": "League of Explorers",
			"text": "Draw 2 cards. Gain 4 Armor.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA_01H.png",
			"cost": 3,
			"fr": {
				"name": "Présence menaçante"
			},
			"id": "LOEA_01H",
			"name": "Looming Presence",
			"set": "League of Explorers",
			"text": "Draw 3 cards. Gain 6 Armor.",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_23.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Seigneur Ondulance"
			},
			"health": 5,
			"id": "LOEA16_23",
			"name": "Lord Slitherspear",
			"set": "League of Explorers",
			"text": "At the end of your turn, summon 1/1 Hungry Naga for each enemy minion.",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_23H.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "Seigneur Ondulance"
			},
			"health": 10,
			"id": "LOEA16_23H",
			"name": "Lord Slitherspear",
			"set": "League of Explorers",
			"text": "At the end of your turn, summon 1/1 Hungry Naga for each enemy minion.",
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
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA16_9.png",
			"cost": 0,
			"fr": {
				"name": "Grèves abandonnées de Lothar"
			},
			"id": "LOEA16_9",
			"name": "Lothar's Left Greave",
			"set": "League of Explorers",
			"text": "Deal 3 damage to all enemies.",
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
			"set": "League of Explorers",
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
			"set": "League of Explorers",
			"text": "Shuffle the Golden Monkey into your deck. Draw a card.",
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
			"race": "Mech",
			"set": "League of Explorers",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_12.png",
			"cost": 0,
			"fr": {
				"name": "Médaillon de Medivh"
			},
			"id": "LOEA16_12",
			"name": "Medivh's Locket",
			"set": "League of Explorers",
			"text": "Replace your hand with Unstable Portals.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA07_01.png",
			"fr": {
				"name": "Chariot de mine"
			},
			"health": 30,
			"id": "LOEA07_01",
			"name": "Mine Cart",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA07_02.png",
			"fr": {
				"name": "Puits de mine"
			},
			"health": 80,
			"id": "LOEA07_02",
			"name": "Mine Shaft",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA16_5.png",
			"cost": 10,
			"fr": {
				"name": "Miroir du destin"
			},
			"id": "LOEA16_5",
			"name": "Mirror of Doom",
			"set": "League of Explorers",
			"text": "Fill your board with 3/3 Mummy Zombies.",
			"type": "Spell"
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
			"race": "Beast",
			"set": "League of Explorers",
			"text": "<b>Taunt</b>",
			"type": "Minion"
		},
		{
			"artist": "Ben Zhang",
			"attack": 3,
			"cardImage": "LOE_050.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Clever girl!",
			"fr": {
				"name": "Raptor de monte"
			},
			"health": 2,
			"id": "LOE_050",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Mounted Raptor",
			"playerClass": "Druid",
			"race": "Beast",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Deathrattle:</b> Summon a random 1-Cost minion.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA10_5H.png",
			"cost": 3,
			"fr": {
				"name": "Mrgl mrgl niah niah !"
			},
			"id": "LOEA10_5H",
			"name": "Mrgl Mrgl Nyah Nyah",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "Summon 5 Murlocs that died this game.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA10_5.png",
			"cost": 5,
			"fr": {
				"name": "Mrgl mrgl niah niah !"
			},
			"id": "LOEA10_5",
			"name": "Mrgl Mrgl Nyah Nyah",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "Summon 3 Murlocs that died this game.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Mrglllroaarrrglrur !"
			},
			"id": "LOE_113e",
			"name": "Mrglllraawrrrglrur!",
			"set": "League of Explorers",
			"text": "+2/+2.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA10_2H.png",
			"cost": 0,
			"fr": {
				"name": "Mrglmrgl MRGL !"
			},
			"id": "LOEA10_2H",
			"name": "Mrglmrgl MRGL!",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\nDraw 2 cards.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA10_2.png",
			"cost": 0,
			"fr": {
				"name": "Mrglmrgl MRGL !"
			},
			"id": "LOEA10_2",
			"name": "Mrglmrgl MRGL!",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\nDraw cards until you have as many in hand as your opponent.",
			"type": "Hero Power"
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
			"set": "League of Explorers",
			"type": "Minion"
		},
		{
			"artist": "Oliver Chipping",
			"attack": 1,
			"cardImage": "LOEA10_3.png",
			"collectible": true,
			"cost": 0,
			"flavor": "High mortality rate, from often being hugged to death.",
			"fr": {
				"name": "Murloc mini-aileron"
			},
			"health": 1,
			"id": "LOEA10_3",
			"name": "Murloc Tinyfin",
			"race": "Murloc",
			"rarity": "Common",
			"set": "League of Explorers",
			"type": "Minion"
		},
		{
			"artist": "Steve Prescott",
			"attack": 1,
			"cardImage": "LOE_006.png",
			"collectible": true,
			"cost": 2,
			"flavor": "He is forever cursing the kids who climb on the rails and the evil archeologists who animate the exhibits.",
			"fr": {
				"name": "Conservateur du musée"
			},
			"health": 2,
			"id": "LOE_006",
			"mechanics": [
				"Battlecry"
			],
			"name": "Museum Curator",
			"playerClass": "Priest",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Battlecry: Discover</b> a <b>Deathrattle</b> card.",
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
			"set": "League of Explorers",
			"text": "Change the Attack of all Hungry Naga to 1.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA09_9.png",
			"cost": 1,
			"fr": {
				"name": "Répulsif à nagas"
			},
			"id": "LOEA09_9",
			"name": "Naga Repellent",
			"set": "League of Explorers",
			"text": "Destroy all Hungry Naga.",
			"type": "Spell"
		},
		{
			"artist": "Ben Zhang",
			"attack": 5,
			"cardImage": "LOE_038.png",
			"collectible": true,
			"cost": 5,
			"flavor": "If she had studied harder, she would have been a C+ witch.",
			"fr": {
				"name": "Sorcière des mers naga"
			},
			"health": 5,
			"id": "LOE_038",
			"mechanics": [
				"Aura"
			],
			"name": "Naga Sea Witch",
			"rarity": "Epic",
			"set": "League of Explorers",
			"text": "Your cards cost (5).",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_31b.png",
			"fr": {
				"name": "Pas question !"
			},
			"id": "LOEA04_31b",
			"name": "No Way!",
			"set": "League of Explorers",
			"text": "Do nothing.",
			"type": "Spell"
		},
		{
			"artist": "Anton Zemskov",
			"attack": 7,
			"cardImage": "LOE_009.png",
			"collectible": true,
			"cost": 7,
			"flavor": "No obsidian is safe around the Obsidian Destroyer!",
			"fr": {
				"name": "Destructeur d’obsidienne"
			},
			"health": 7,
			"id": "LOE_009",
			"name": "Obsidian Destroyer",
			"playerClass": "Warrior",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "At the end of your turn, summon a 1/1 Scarab with <b>Taunt</b>.",
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
			"mechanics": [
				"Divine Shield"
			],
			"name": "Orsis Guard",
			"set": "League of Explorers",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
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
			"mechanics": [
				"Divine Shield"
			],
			"name": "Orsis Guard",
			"set": "League of Explorers",
			"text": "<b>Divine Shield</b>",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA12_2.png",
			"fr": {
				"name": "Perle des marées"
			},
			"id": "LOEA12_2",
			"name": "Pearl of the Tides",
			"set": "League of Explorers",
			"text": "At the end of your turn, replace all minions with new ones that cost (1) more.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA12_2H.png",
			"fr": {
				"name": "Perle des marées"
			},
			"id": "LOEA12_2H",
			"name": "Pearl of the Tides",
			"set": "League of Explorers",
			"text": "At the end of your turn, replace all minions with new ones. Yours cost (1) more.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA04_06.png",
			"cost": 0,
			"fr": {
				"name": "Fosse remplie de pointes"
			},
			"id": "LOEA04_06",
			"name": "Pit of Spikes",
			"set": "League of Explorers",
			"text": "<b>Choose Your Path!</b>",
			"type": "Spell"
		},
		{
			"artist": "Bernie Kang",
			"attack": 2,
			"cardImage": "LOE_010.png",
			"collectible": true,
			"cost": 1,
			"flavor": "It could be worse.  It could be a Snake Pit.",
			"fr": {
				"name": "Serpent de la fosse"
			},
			"health": 1,
			"id": "LOE_010",
			"mechanics": [
				"Poisonous"
			],
			"name": "Pit Snake",
			"playerClass": "Rogue",
			"race": "Beast",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "Destroy any minion damaged by this minion.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA14_2H.png",
			"fr": {
				"name": "Armure de plates"
			},
			"id": "LOEA14_2H",
			"name": "Platemail Armor",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\nYour Hero and your minions can only take 1 damage at a time.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA14_2.png",
			"fr": {
				"name": "Armure de plates"
			},
			"id": "LOEA14_2",
			"name": "Platemail Armor",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\nYour Hero can only take 1 damage at a time.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Puissance des titans"
			},
			"id": "LOE_061e",
			"name": "Power of the Titans",
			"set": "League of Explorers",
			"text": "+3/+3.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA16_8.png",
			"cost": 0,
			"fr": {
				"name": "Fiole de Putrescin"
			},
			"id": "LOEA16_8",
			"name": "Putress' Vial",
			"set": "League of Explorers",
			"text": "Destroy a random enemy minion.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Putréfié"
			},
			"id": "LOEA16_8a",
			"name": "Putressed",
			"set": "League of Explorers",
			"text": "Attack and Health swapped.",
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
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA16_1.png",
			"fr": {
				"name": "Rafaam"
			},
			"health": 30,
			"id": "LOEA16_1",
			"name": "Rafaam",
			"set": "League of Explorers",
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
			"set": "League of Explorers",
			"text": "Whenever your opponent plays a Rare card, gain +1/+1.",
			"type": "Weapon"
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
			"set": "League of Explorers",
			"text": "Whenever your opponent plays a Rare card, gain +1/+1.",
			"type": "Weapon"
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
			"set": "League of Explorers",
			"type": "Minion"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "LOE_115.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Was petrified when it found out it didn't make the cut for Azerothean Idol.",
			"fr": {
				"name": "Idole corbeau"
			},
			"id": "LOE_115",
			"name": "Raven Idol",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Choose One -</b>\n<b>Discover</b> a minion; or <b>Discover</b> a spell.",
			"type": "Spell"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "LOE_115b.png",
			"fr": {
				"name": "Idole corbeau"
			},
			"id": "LOE_115b",
			"name": "Raven Idol",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Discover</b> a spell.",
			"type": "Spell"
		},
		{
			"artist": "A.J. Nazzaro",
			"cardImage": "LOE_115a.png",
			"fr": {
				"name": "Idole corbeau"
			},
			"id": "LOE_115a",
			"name": "Raven Idol",
			"playerClass": "Druid",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Discover</b> a minion.",
			"type": "Spell"
		},
		{
			"artist": "Wayne Reynolds",
			"attack": 1,
			"cardImage": "LOE_116.png",
			"collectible": true,
			"cost": 1,
			"flavor": "The Reliquary considers itself the equal of the League of Explorers.  The League of Explorers doesn't.",
			"fr": {
				"name": "Chercheuse du Reliquaire"
			},
			"health": 1,
			"id": "LOE_116",
			"mechanics": [
				"Battlecry"
			],
			"name": "Reliquary Seeker",
			"playerClass": "Warlock",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b> If you have 6 other minions, gain +4/+4.",
			"type": "Minion"
		},
		{
			"artist": "Tyson Murphy",
			"attack": 4,
			"cardImage": "LOE_011.png",
			"collectible": true,
			"cost": 6,
			"elite": true,
			"flavor": "Reno is a four-time winner of the 'Best Accessorized Explorer' award.",
			"fr": {
				"name": "Reno Jackson"
			},
			"health": 6,
			"id": "LOE_011",
			"mechanics": [
				"Battlecry"
			],
			"name": "Reno Jackson",
			"rarity": "Legendary",
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b> If your deck contains no more than 1 of any card, fully heal your hero.",
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
			"set": "League of Explorers",
			"text": "Restore 10 Health.",
			"type": "Spell"
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
			"set": "League of Explorers",
			"text": "Deal $6 damage.",
			"type": "Spell"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Rock",
			"set": "League of Explorers",
			"text": "<b>Taunt.</b>",
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Rod of the Sun",
			"set": "League of Explorers",
			"text": "<b>Deathrattle:</b> Surrender this to your opponent.",
			"type": "Minion"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Rod of the Sun",
			"set": "League of Explorers",
			"text": "<b>Deathrattle:</b> Surrender this to your opponent.",
			"type": "Minion"
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
			"set": "League of Explorers",
			"text": "At the end of your turn, destroy the minion to the left.",
			"type": "Minion"
		},
		{
			"artist": "Cole Eastburn",
			"attack": 2,
			"cardImage": "LOE_016.png",
			"collectible": true,
			"cost": 4,
			"flavor": "He's a very hungry elemental.",
			"fr": {
				"name": "Élémentaire grondant"
			},
			"health": 6,
			"id": "LOE_016",
			"name": "Rumbling Elemental",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "After you play a <b>Battlecry</b> minion, deal 2 damage to a random enemy.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_16H.png",
			"cost": 2,
			"fr": {
				"name": "Fouilles"
			},
			"id": "LOEA16_16H",
			"name": "Rummage",
			"set": "League of Explorers",
			"text": "Find an artifact.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA16_16.png",
			"cost": 0,
			"fr": {
				"name": "Fouilles"
			},
			"id": "LOEA16_16",
			"name": "Rummage",
			"set": "League of Explorers",
			"text": "Find an artifact.",
			"type": "Hero Power"
		},
		{
			"artist": "Zoltan Boros",
			"cardImage": "LOE_027.png",
			"collectible": true,
			"cost": 1,
			"flavor": "You have chosen poorly.",
			"fr": {
				"name": "Épreuve sacrée"
			},
			"id": "LOE_027",
			"mechanics": [
				"Secret"
			],
			"name": "Sacred Trial",
			"playerClass": "Paladin",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Secret:</b> When your opponent has at least 3 minions and plays another, destroy it.",
			"type": "Spell"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Scarab",
			"playerClass": "Warrior",
			"set": "League of Explorers",
			"text": "<b>Taunt</b>",
			"type": "Minion"
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
			"set": "League of Explorers",
			"text": "At the end of your turn, deal 2 damage to all enemies.",
			"type": "Minion"
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
			"set": "League of Explorers",
			"text": "At the end of your turn, deal 5 damage to all enemies.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_6.png",
			"cost": 0,
			"fr": {
				"name": "Éclat de Sulfuras"
			},
			"id": "LOEA16_6",
			"name": "Shard of Sulfuras",
			"set": "League of Explorers",
			"text": "Deal $5 damage to ALL characters.",
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
			"set": "League of Explorers",
			"text": "Destroy all Statues. For each destroyed, deal $1 damage.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA06_04h.png",
			"cost": 2,
			"fr": {
				"name": "Pulsion destructrice"
			},
			"id": "LOEA06_04h",
			"name": "Shattering Spree",
			"set": "League of Explorers",
			"text": "Destroy all Statues. For each destroyed, deal $3 damage.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Puissance sinistre"
			},
			"id": "LOE_009e",
			"name": "Sinister Power",
			"playerClass": "Warlock",
			"set": "League of Explorers",
			"text": "+4/+4.",
			"type": "Enchantment"
		},
		{
			"artist": "Matt Dixon",
			"attack": 1,
			"cardImage": "LOE_076.png",
			"collectible": true,
			"cost": 1,
			"elite": true,
			"flavor": "In addition to fluent Common, he also speaks fourteen dialects of 'mrgl'.",
			"fr": {
				"name": "Sir Finley Mrrgglton"
			},
			"health": 3,
			"id": "LOE_076",
			"mechanics": [
				"Battlecry"
			],
			"name": "Sir Finley Mrrgglton",
			"race": "Murloc",
			"rarity": "Legendary",
			"set": "League of Explorers",
			"text": "<b>Battlecry: Discover</b> a new basic Hero Power.",
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
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_26.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Squeletosaurus Hex"
			},
			"health": 5,
			"id": "LOEA16_26",
			"name": "Skelesaurus Hex",
			"set": "League of Explorers",
			"text": "At the end of your turn, give each player a random card. It costs (0).",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_26H.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "Squeletosaurus Hex"
			},
			"health": 10,
			"id": "LOEA16_26H",
			"name": "Skelesaurus Hex",
			"set": "League of Explorers",
			"text": "At the end of your turn, put a random card in your hand. It costs (0).",
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
			"mechanics": [
				"Battlecry"
			],
			"name": "Slithering Archer",
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b> Deal 2 damage to all enemy minions.",
			"type": "Minion"
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
			"mechanics": [
				"Battlecry"
			],
			"name": "Slithering Archer",
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b> Deal 1 damage.",
			"type": "Minion"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Slithering Guard",
			"set": "League of Explorers",
			"text": "<b>Taunt</b>",
			"type": "Minion"
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
			"mechanics": [
				"Taunt"
			],
			"name": "Slithering Guard",
			"set": "League of Explorers",
			"text": "<b>Taunt</b>",
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
			"mechanics": [
				"Taunt"
			],
			"name": "Spiked Decoy",
			"race": "Mech",
			"set": "League of Explorers",
			"text": "<b>Taunt</b>\nCan't attack.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA16_2H.png",
			"fr": {
				"name": "Bâton de l’Origine"
			},
			"id": "LOEA16_2H",
			"name": "Staff of Origination",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\nYour hero is <b>Immune</b>.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA16_2.png",
			"fr": {
				"name": "Bâton de l’Origine"
			},
			"id": "LOEA16_2",
			"name": "Staff of Origination",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\nYour hero is <b>Immune</b> while the staff charges.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA06_02h.png",
			"cost": 1,
			"fr": {
				"name": "Sculpture sur pierre"
			},
			"id": "LOEA06_02h",
			"name": "Stonesculpting",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\n Summon a Statue for both players.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA06_02.png",
			"cost": 1,
			"fr": {
				"name": "Sculpture sur pierre"
			},
			"id": "LOEA06_02",
			"name": "Stonesculpting",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\n Summon a 0/2 Statue for both players.",
			"type": "Hero Power"
		},
		{
			"artist": "Jason Kang",
			"attack": 0,
			"cardImage": "LOE_086.png",
			"collectible": true,
			"cost": 5,
			"flavor": "Sometimes it feels like it's always the same slackers that are waiting for a summon.",
			"fr": {
				"name": "Pierre d’invocation"
			},
			"health": 6,
			"id": "LOE_086",
			"name": "Summoning Stone",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "Whenever you cast a spell, summon a random minion of the same Cost.",
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
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_19.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Écumeur du soleil Phaerix"
			},
			"health": 5,
			"id": "LOEA16_19",
			"name": "Sun Raider Phaerix",
			"set": "League of Explorers",
			"text": "At the end of your turn, add a Blessing of the Sun to your hand.",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_19H.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "Écumeur du soleil Phaerix"
			},
			"health": 10,
			"id": "LOEA16_19H",
			"name": "Sun Raider Phaerix",
			"set": "League of Explorers",
			"text": "Your other minions are <b>Immune</b>.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_06a.png",
			"fr": {
				"name": "Franchir d’un bond"
			},
			"id": "LOEA04_06a",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Swing Across",
			"set": "League of Explorers",
			"text": "Take 10 damage or no damage, at random.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_30a.png",
			"fr": {
				"name": "Prendre le raccourci"
			},
			"id": "LOEA04_30a",
			"name": "Take the Shortcut",
			"set": "League of Explorers",
			"text": "Get 1 turn closer to the Exit! Encounter a 7/7 War Golem.",
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
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"fr": {
				"name": "Enchantement de fuite du temple"
			},
			"id": "LOEA04_01e",
			"name": "Temple Escape Enchant",
			"set": "League of Explorers",
			"type": "Enchantment"
		},
		{
			"fr": {
				"name": "Enchantement de fuite du temple"
			},
			"id": "LOEA04_01eh",
			"name": "Temple Escape Enchant",
			"set": "League of Explorers",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA04_30.png",
			"cost": 0,
			"fr": {
				"name": "Les ténèbres"
			},
			"id": "LOEA04_30",
			"name": "The Darkness",
			"set": "League of Explorers",
			"text": "<b>Take the Shortcut?</b>",
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
			"set": "League of Explorers",
			"text": "<b>Choose Your Path!</b>",
			"type": "Spell"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_27.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "La sentinelle d’acier"
			},
			"health": 5,
			"id": "LOEA16_27",
			"name": "The Steel Sentinel",
			"set": "League of Explorers",
			"text": "This minion can only take 1 damage at a time.",
			"type": "Minion"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_27H.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "La sentinelle d’acier"
			},
			"health": 10,
			"id": "LOEA16_27H",
			"name": "The Steel Sentinel",
			"set": "League of Explorers",
			"text": "This minion can only take 1 damage at a time.",
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
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"cardImage": "LOEA07_29.png",
			"cost": 1,
			"fr": {
				"name": "Lancer des rochers"
			},
			"id": "LOEA07_29",
			"name": "Throw Rocks",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\n Deal 3 damage to a random enemy minion.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA16_4.png",
			"cost": 10,
			"fr": {
				"name": "Horloge de l’horreur"
			},
			"id": "LOEA16_4",
			"mechanics": [
				"ImmuneToSpellpower"
			],
			"name": "Timepiece of Horror",
			"set": "League of Explorers",
			"text": "Deal $10 damage randomly split among all enemies.",
			"type": "Spell"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Tol'vir Hoplite",
			"set": "League of Explorers",
			"text": "<b>Deathrattle:</b> Deal 5 damage to both heroes.",
			"type": "Minion"
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
			"mechanics": [
				"Deathrattle"
			],
			"name": "Tol'vir Hoplite",
			"set": "League of Explorers",
			"text": "<b>Deathrattle:</b> Deal 5 damage to both heroes.",
			"type": "Minion"
		},
		{
			"artist": "Dave Allsop",
			"attack": 5,
			"cardImage": "LOE_012.png",
			"collectible": true,
			"cost": 4,
			"flavor": "After the guild broke up, he could no longer raid the tombs.",
			"fr": {
				"name": "Pilleur de tombes"
			},
			"health": 4,
			"id": "LOE_012",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Tomb Pillager",
			"playerClass": "Rogue",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Deathrattle:</b> Add a Coin to your hand.",
			"type": "Minion"
		},
		{
			"artist": "Turovec Konstantin",
			"attack": 3,
			"cardImage": "LOE_047.png",
			"collectible": true,
			"cost": 4,
			"flavor": "Less serious than its cousin, the Grave Spider.",
			"fr": {
				"name": "Araignée des tombes"
			},
			"health": 3,
			"id": "LOE_047",
			"mechanics": [
				"Battlecry"
			],
			"name": "Tomb Spider",
			"race": "Beast",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Battlecry: Discover</b> a Beast.",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA04_29a.png",
			"fr": {
				"name": "Toucher"
			},
			"id": "LOEA04_29a",
			"name": "Touch It",
			"set": "League of Explorers",
			"text": "Restore 10 Health to your hero.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA05_02h.png",
			"fr": {
				"name": "Trogg détester serviteurs !"
			},
			"id": "LOEA05_02h",
			"name": "Trogg Hate Minions!",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\n Enemy minions cost (11). Swap at the start of your turn.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA05_02a.png",
			"fr": {
				"name": "Trogg détester serviteurs !"
			},
			"id": "LOEA05_02a",
			"name": "Trogg Hate Minions!",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\n Enemy minions cost (2) more. Swap at the start of your turn.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA05_02ha.png",
			"fr": {
				"name": "Trogg détester serviteurs !"
			},
			"id": "LOEA05_02ha",
			"name": "Trogg Hate Minions!",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\n Enemy minions cost (11). Swap at the start of your turn.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA05_02.png",
			"fr": {
				"name": "Trogg détester serviteurs !"
			},
			"id": "LOEA05_02",
			"name": "Trogg Hate Minions!",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\n Enemy minions cost (2) more. Swap at the start of your turn.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA05_03h.png",
			"fr": {
				"name": "Trogg détester sorts !"
			},
			"id": "LOEA05_03h",
			"name": "Trogg Hate Spells!",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\n Enemy spells cost (11). Swap at the start of your turn.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA05_03.png",
			"fr": {
				"name": "Trogg détester sorts !"
			},
			"id": "LOEA05_03",
			"name": "Trogg Hate Spells!",
			"set": "League of Explorers",
			"text": "<b>Passive Hero Power</b>\n Enemy spells cost (2) more. Swap at the start of your turn.",
			"type": "Hero Power"
		},
		{
			"fr": {
				"name": "Trogg pas stupide"
			},
			"id": "LOE_018e",
			"name": "Trogg No Stupid",
			"playerClass": "Shaman",
			"set": "League of Explorers",
			"text": "Increased Attack.",
			"type": "Enchantment"
		},
		{
			"artist": "Andrew Hou",
			"attack": 1,
			"cardImage": "LOE_018.png",
			"collectible": true,
			"cost": 1,
			"flavor": "Sure, they're ugly, but they live in tunnels.  You try your beauty routine without natural light.",
			"fr": {
				"name": "Trogg des tunnels"
			},
			"health": 3,
			"id": "LOE_018",
			"name": "Tunnel Trogg",
			"playerClass": "Shaman",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "Whenever you <b>Overload</b>, gain +1 Attack per locked Mana Crystal.",
			"type": "Minion"
		},
		{
			"artist": "Trent Kaniuga",
			"attack": 3,
			"cardImage": "LOE_019.png",
			"collectible": true,
			"cost": 3,
			"flavor": "Still hunting for the ones who earthed him.",
			"fr": {
				"name": "Raptor déterré"
			},
			"health": 4,
			"id": "LOE_019",
			"mechanics": [
				"Battlecry"
			],
			"name": "Unearthed Raptor",
			"playerClass": "Rogue",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "<b>Battlecry:</b> Choose a friendly minion. Gain a copy of its <b>Deathrattle</b> effect.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "Raptor déterré"
			},
			"id": "LOE_019e",
			"name": "Unearthed Raptor",
			"playerClass": "Rogue",
			"set": "League of Explorers",
			"text": "Copied <b>Deathrattle</b> from CARD_NAME.",
			"type": "Enchantment"
		},
		{
			"cardImage": "LOEA15_2.png",
			"cost": 2,
			"fr": {
				"name": "Portail instable"
			},
			"id": "LOEA15_2",
			"name": "Unstable Portal",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\nAdd a random minion to your hand. It costs (3) less.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA15_2H.png",
			"cost": 0,
			"fr": {
				"name": "Portail instable"
			},
			"id": "LOEA15_2H",
			"name": "Unstable Portal",
			"set": "League of Explorers",
			"text": "<b>Hero Power</b>\nAdd a random minion to your hand. It costs (3) less.",
			"type": "Hero Power"
		},
		{
			"cardImage": "LOEA04_28b.png",
			"cost": 0,
			"fr": {
				"name": "Traverser à pied"
			},
			"id": "LOEA04_28b",
			"name": "Wade Through",
			"set": "League of Explorers",
			"text": "Gain a Mana Crystal",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA04_06b.png",
			"fr": {
				"name": "Traverser avec précaution"
			},
			"id": "LOEA04_06b",
			"name": "Walk Across Gingerly",
			"set": "League of Explorers",
			"text": "Take 5 damage.",
			"type": "Spell"
		},
		{
			"fr": {
				"name": "Observé"
			},
			"id": "LOE_017e",
			"name": "Watched",
			"playerClass": "Paladin",
			"set": "League of Explorers",
			"text": "Stats changed to 3/3.",
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
			"set": "League of Explorers",
			"type": "Minion"
		},
		{
			"cardImage": "LOEA02_10.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : compagnon"
			},
			"id": "LOEA02_10",
			"name": "Wish for Companionship",
			"set": "League of Explorers",
			"text": "<b>Discover</b> a Companion.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA02_05.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : gloire"
			},
			"id": "LOEA02_05",
			"name": "Wish for Glory",
			"set": "League of Explorers",
			"text": "<b>Discover</b> a minion.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA02_06.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : plus de Vœux"
			},
			"id": "LOEA02_06",
			"name": "Wish for More Wishes",
			"set": "League of Explorers",
			"text": "Gain 2 Wishes.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA02_03.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : puissance"
			},
			"id": "LOEA02_03",
			"name": "Wish for Power",
			"set": "League of Explorers",
			"text": "<b>Discover</b> a spell.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA02_04.png",
			"cost": 0,
			"fr": {
				"name": "Vœu : vaillance"
			},
			"id": "LOEA02_04",
			"name": "Wish for Valor",
			"set": "League of Explorers",
			"text": "<b>Discover</b> a (4)-Cost card.",
			"type": "Spell"
		},
		{
			"artist": "Sam Nielson",
			"attack": 2,
			"cardImage": "LOE_089.png",
			"collectible": true,
			"cost": 6,
			"flavor": "The fourth one fell off in a tragic accident.  They don't talk about it.",
			"fr": {
				"name": "Avortons tremblants"
			},
			"health": 6,
			"id": "LOE_089",
			"mechanics": [
				"Deathrattle"
			],
			"name": "Wobbling Runts",
			"rarity": "Rare",
			"set": "League of Explorers",
			"text": "<b>Deathrattle:</b> Summon three 2/2 Runts.",
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
			"set": "League of Explorers",
			"text": "Gain 4 Mana Crystals this turn only.",
			"type": "Spell"
		},
		{
			"cardImage": "LOEA02_01.png",
			"fr": {
				"name": "Zinaar"
			},
			"health": 30,
			"id": "LOEA02_01",
			"name": "Zinaar",
			"set": "League of Explorers",
			"type": "Hero"
		},
		{
			"attack": 10,
			"cardImage": "LOEA16_18H.png",
			"cost": 10,
			"elite": true,
			"fr": {
				"name": "Zinaar"
			},
			"health": 10,
			"id": "LOEA16_18H",
			"name": "Zinaar",
			"set": "League of Explorers",
			"text": "At the end of your turn, gain a wish.",
			"type": "Minion"
		},
		{
			"attack": 5,
			"cardImage": "LOEA16_18.png",
			"cost": 5,
			"elite": true,
			"fr": {
				"name": "Zinaar"
			},
			"health": 5,
			"id": "LOEA16_18",
			"name": "Zinaar",
			"set": "League of Explorers",
			"text": "At the end of your turn, gain a wish.",
			"type": "Minion"
		},
		{
			"fr": {
				"name": "zzDELETE Explorateur de tombes"
			},
			"id": "LOE_012e",
			"name": "zzDELETE Tomb Explorer",
			"playerClass": "Rogue",
			"set": "League of Explorers",
			"text": "Copied Deathrattle from CARD_NAME",
			"type": "Enchantment"
		},
		{
			"attack": 1,
			"cardImage": "LOE_030.png",
			"collectible": false,
			"cost": 4,
			"fr": {
				"name": "zzDELETE? Armure animée"
			},
			"health": 1,
			"id": "LOE_030",
			"mechanics": [
				"Battlecry",
				"Taunt"
			],
			"name": "zzDELETE? Animated Armor",
			"rarity": "Common",
			"set": "League of Explorers",
			"text": "<b>Taunt</b>\n<b>Battlecry:</b> Copy a friendly minion's Attack and Health.",
			"type": "Minion"
		}
	]
}