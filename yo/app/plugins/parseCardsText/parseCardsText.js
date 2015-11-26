var cardRegex = /\[\[.+?\]\]/gm;
var manaRegex = /\d-mana/gm;

function parseCardsText(review, text) {
	var matches = text.match(cardRegex);
	var result = text;
	var lang = window.localStorage.language;
	// Parsing card names
	if (matches) {
		matches.forEach(function(match) {
			var cardName = match.substring(2, match.length - 2);
			var card = getCard(cardName);
			if (card) {
				var cssClass = card.rarity ? getRarity(card).toLowerCase() : 'common';
				var localizedName = parseCardsText_localizeName(card, lang);
				var localizedImage = parseCardsText_localizeImage(card, lang);
				result = result.replace(match, '<a class="card ' + cssClass + '" data-template-url="plugins/parseCardsText/template.html" data-title="' + localizedImage + '" data-placement="auto left" data-container="body" bs-tooltip>' + localizedName + '</a>');
			}
		})
	}

	// Parsing mana costs
	matches = text.match(manaRegex);
	if (matches) {
		matches.forEach(function(match) {
			var cost = match.substring(0, match.indexOf('-'));
			result = result.replace(match, '<img src="https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/mana/' + cost + '.png" class="parse-cards-text mana-cost">');
		})
	}


	return result;
}

function parseCardsText_localizeName(card, lang) {
	if (!lang) return card.name;
	if (!card[lang]) return card.name;
	return card[lang].name;
}

function parseCardsText_localizeImage(card, lang) {
	if (!lang) return card.cardImage;
	if (!card[lang]) return card.cardImage;
	// console.log('localized image', lang + '/' + card.cardImage);
	return lang + '/' + card.cardImage;
}

function parseCardsText_attach(element) {
	//console.log('attaching to element', element);
	element.textcomplete([{
		match: /\[\[[a-zA-Z\s]{3,}$/,
		search: function (term, callback, match) {
			callback($.map(jsonDatabase, function(card) {
				var localizeName = parseCardsText_localizeName(card, window.localStorage.language);
				var res = S(localizeName.toLowerCase()).latinise().s.indexOf(S(term).latinise().s.substring(2).toLowerCase()) === 0;
                // add search on english term
                res = res || card.name.toLowerCase().indexOf(term.substring(2).toLowerCase()) === 0;
                // Keep only valid cards
                res = res && card.cardImage && card.type != 'Hero';
                res = res ? card : null
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
			var title =	'<img src=\'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/allCards/' + parseCardsText_localizeImage(card, window.localStorage.language) + '\'>';
			var cssClass = card.rarity ? getRarity(card).toLowerCase() : 'common';
			return '<span class="autocomplete card ' + cssClass + '" data-toggle="tooltip" data-template="' + tooltipTemplate + '" data-title="' + title + '"data-placement="auto left" data-html="true" data-container="body" data-animation="false">' + parseCardsText_localizeName(card, window.localStorage.language) + '</span>';
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
}

function parseCardsText_detach(element) {
	//console.log('detaching from element', element);
	element.textcomplete('destroy');
}

function getRarity(card) {
	if (card.set == 'Basic') {
		card.rarity = 'Free';
	}
	return card.rarity;
}

function getCard(cardName) {
	var result;
    var possibleResult;
	// cf http://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break
	jsonDatabase.some(function(card) {
		//console.log('\tlooking at card', card.name);
		//console.log('\tcardimage is', card.cardimage);
		//console.log('\tis equal', card.name, cardName, card.name == cardName);
		// Seems like variations (the non-standard version) of the card has a lowercase letter in the name
		if (card.name.toLowerCase() == cardName.toLowerCase()) {
            possibleResult = card;
            if (card.set == 'Basic') {
                card.rarity = 'Free';
            }
            // console.log('card id matches regex?', card.id, card.id.match(/.*\d$/));
            // console.log('card type', card.type)
            if (card.type != 'Hero' && (card.id.toLowerCase() == card.id || card.id.toUpperCase() == card.id) && card.id.match(/.*\d$/)) {
    			result = card;
    			if (result.cardImage) {
    				console.log('returning card', result);
    				return true;
    			}
            }
		}
	});
	return result || possibleResult;
}

// TODO: export this to real db? Do the match on server side?
var jsonDatabase = [
    {
        "cardImage": "EX1_066.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Chris Rahn",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Rogue Level 57.",
        "fr": {
            "name": "Limon des marais acide"
        },
        "flavor": "Oozes love Flamenco.  Don't ask.",
        "attack": 3,
        "faction": "Alliance",
        "name": "Acidic Swamp Ooze",
        "id": "EX1_066",
        "text": "<b>Battlecry:</b> Destroy your opponent's weapon.",
        "rarity": "Common"
    },
    {
        "set": "Basic",
        "name": "AFK",
        "id": "GAME_004",
        "text": "Your turns are shorter.",
        "type": "Enchantment",
        "fr": {
            "name": "ABS"
        }
    },
    {
        "cardImage": "CS2_041.png",
        "cost": 0,
        "collectible": true,
        "set": "Basic",
        "artist": "Dan Scott",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 15.",
        "fr": {
            "name": "Guérison ancestrale"
        },
        "flavor": "I personally prefer some non-ancestral right-the-heck-now healing, but maybe that is just me.",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Ancestral Healing",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_041",
        "text": "Restore a minion to full Health and give it <b>Taunt</b>.",
        "rarity": "Free"
    },
    {
        "playerClass": "Shaman",
        "set": "Basic",
        "name": "Ancestral Infusion",
        "mechanics": [
            "Taunt"
        ],
        "id": "CS2_041e",
        "text": "Taunt.",
        "type": "Enchantment",
        "fr": {
            "name": "Infusion ancestrale"
        }
    },
    {
        "cardImage": "HERO_09.png",
        "playerClass": "Priest",
        "collectible": true,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Anduin Wrynn",
        "health": 30,
        "id": "HERO_09",
        "type": "Hero",
        "fr": {
            "name": "Anduin Wrynn"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "NEW1_031.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Wei Wang",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 45.",
        "fr": {
            "name": "Compagnon animal"
        },
        "flavor": "You could summon Misha, Leokk, or Huffer!  Huffer is more trouble than he's worth.",
        "playerClass": "Hunter",
        "name": "Animal Companion",
        "howToGet": "Unlocked at Level 2.",
        "id": "NEW1_031",
        "text": "Summon a random Beast Companion.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_025.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Howard Lyon",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 28.",
        "fr": {
            "name": "Explosion des Arcanes"
        },
        "flavor": "This spell is much better than Arcane Implosion.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Arcane Explosion",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_025",
        "text": "Deal $1 damage to all enemy minions.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_023.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Dave Berggren",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 15.",
        "fr": {
            "name": "Intelligence des Arcanes"
        },
        "flavor": "Playing this card makes you SMARTER.  And let's face it: we could all stand to be a little smarter.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Arcane Intellect",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_023",
        "text": "Draw 2 cards.",
        "rarity": "Free"
    },
    {
        "cardImage": "EX1_277.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Warren Mahy",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 32.",
        "fr": {
            "name": "Projectiles des Arcanes"
        },
        "flavor": "You'd think you'd be able to control your missiles a little better since you're a powerful mage and all.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Arcane Missiles",
        "howToGet": "Unlocked at Level 1.",
        "id": "EX1_277",
        "text": "Deal $3 damage randomly split among all enemies.",
        "rarity": "Free"
    },
    {
        "cardImage": "DS1_185.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Luca Zontini",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 32.",
        "fr": {
            "name": "Tir des Arcanes"
        },
        "flavor": "Magi conjured arcane arrows to sell to hunters, until hunters learned just enough magic to do it themselves.  The resulting loss of jobs sent Stormwind into a minor recession.",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Arcane Shot",
        "howToGet": "Unlocked at Level 1.",
        "id": "DS1_185",
        "text": "Deal $2 damage.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_112.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "artist": "Stefan Kopinski",
        "durability": 2,
        "type": "Weapon",
        "howToGetGold": "Unlocked at Level 51.",
        "fr": {
            "name": "Faucheuse en arcanite"
        },
        "flavor": "No… actually you should fear the Reaper.",
        "playerClass": "Warrior",
        "attack": 5,
        "faction": "Neutral",
        "name": "Arcanite Reaper",
        "howToGet": "Unlocked at Level 10.",
        "id": "CS2_112",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_155.png",
        "cost": 6,
        "collectible": true,
        "set": "Basic",
        "artist": "Steve Ellis",
        "health": 7,
        "mechanics": [
            "Spellpower"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Mage Level 57.",
        "fr": {
            "name": "Archimage"
        },
        "flavor": "You earn the title of Archmage when you can destroy anyone who calls you on it.",
        "attack": 4,
        "faction": "Alliance",
        "name": "Archmage",
        "id": "CS2_155",
        "text": "<b>Spell Damage +1</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_102.png",
        "playerClass": "Warrior",
        "cost": 2,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Armor Up!",
        "id": "CS2_102",
        "text": "<b>Hero Power</b>\nGain 2 Armor.",
        "type": "Hero Power",
        "fr": {
            "name": "Gain d’armure !"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_080.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "artist": "Brian Huang",
        "durability": 4,
        "type": "Weapon",
        "howToGetGold": "Unlocked at Level 32.",
        "fr": {
            "name": "Lame d’assassin"
        },
        "flavor": "Guaranteed to have been owned by a real assassin.   Certificate of authenticity included.",
        "playerClass": "Rogue",
        "attack": 3,
        "faction": "Neutral",
        "name": "Assassin's Blade",
        "howToGet": "Unlocked at Level 2.",
        "id": "CS2_080",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_076.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "artist": "Glenn Rane",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 47.",
        "fr": {
            "name": "Assassiner"
        },
        "flavor": "If you don't want to be assassinated, move to the Barrens and change your name. Good luck!",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Assassinate",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_076",
        "text": "Destroy an enemy minion.",
        "rarity": "Free"
    },
    {
        "cardImage": "GAME_002.png",
        "cost": 0,
        "set": "Basic",
        "attack": 1,
        "name": "Avatar of the Coin",
        "health": 1,
        "id": "GAME_002",
        "text": "<i>You lost the coin flip, but gained a friend.</i>",
        "type": "Minion",
        "fr": {
            "name": "Avatar de la pièce"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_072.png",
        "cost": 0,
        "collectible": true,
        "set": "Basic",
        "artist": "Michael Sutfin",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 36.",
        "fr": {
            "name": "Attaque sournoise"
        },
        "flavor": "It's funny how often yelling \"Look over there!\" gets your opponent to turn around.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Backstab",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_072",
        "text": "Deal $2 damage to an undamaged minion.",
        "rarity": "Free"
    },
    {
        "set": "Basic",
        "name": "Berserking",
        "id": "EX1_399e",
        "text": "This minion has increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Berserker"
        }
    },
    {
        "cardImage": "CS2_092.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Lucas Graciano",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 49.",
        "fr": {
            "name": "Bénédiction des rois"
        },
        "flavor": "Given the number of kings who have been assassinated, are you sure you want their blessing?",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Blessing of Kings",
        "howToGet": "Unlocked at Level 10.",
        "id": "CS2_092",
        "text": "Give a minion +4/+4. <i>(+4 Attack/+4 Health)</i>",
        "rarity": "Common"
    },
    {
        "playerClass": "Paladin",
        "set": "Basic",
        "name": "Blessing of Kings",
        "id": "CS2_092e",
        "text": "+4/+4.",
        "type": "Enchantment",
        "fr": {
            "name": "Bénédiction des rois"
        }
    },
    {
        "cardImage": "CS2_087.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Zoltan Boros",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 45.",
        "fr": {
            "name": "Bénédiction de puissance"
        },
        "flavor": "\"As in, you MIGHT want to get out of my way.\" - Toad Mackle, recently buffed.",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Blessing of Might",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_087",
        "text": "Give a minion +3 Attack.",
        "rarity": "Free"
    },
    {
        "playerClass": "Paladin",
        "set": "Basic",
        "faction": "Neutral",
        "name": "Blessing of Might",
        "id": "CS2_087e",
        "text": "+3 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Bénédiction de puissance"
        }
    },
    {
        "cardImage": "CS2_172.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "race": "Beast",
        "artist": "Dan Brereton",
        "health": 2,
        "type": "Minion",
        "howToGetGold": "Unlocked at Hunter Level 57.",
        "fr": {
            "name": "Raptor Rougefange"
        },
        "flavor": "\"Kill 30 raptors.\" - Hemet Nesingwary",
        "attack": 3,
        "faction": "Horde",
        "name": "Bloodfen Raptor",
        "id": "CS2_172",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_046.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "artist": "Luca Zontini",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 40.",
        "fr": {
            "name": "Furie sanguinaire"
        },
        "flavor": "blaarghghLLGHRHARAAHAHHH!!",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Bloodlust",
        "howToGet": "Unlocked at Level 2.",
        "id": "CS2_046",
        "text": "Give your minions +3 Attack this turn.",
        "rarity": "Common"
    },
    {
        "playerClass": "Shaman",
        "set": "Basic",
        "name": "Bloodlust",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "CS2_046e",
        "text": "+3 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Furie sanguinaire"
        }
    },
    {
        "cardImage": "CS2_173.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "race": "Murloc",
        "artist": "Jakub Kasper",
        "health": 1,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Paladin Level 53.",
        "fr": {
            "name": "Guerrier branchie-bleue"
        },
        "flavor": "He just wants a hug.   A sloppy... slimy... hug.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Bluegill Warrior",
        "id": "CS2_173",
        "text": "<b>Charge</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_boar.png",
        "cost": 1,
        "set": "Basic",
        "race": "Beast",
        "attack": 1,
        "faction": "Neutral",
        "name": "Boar",
        "health": 1,
        "id": "CS2_boar",
        "type": "Minion",
        "fr": {
            "name": "Sanglier"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_187.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "artist": "Matt Cavotta",
        "health": 4,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Shaman Level 55.",
        "fr": {
            "name": "Garde de Baie-du-Butin"
        },
        "flavor": "You can hire him... until someone offers him enough gold to turn on you.",
        "attack": 5,
        "faction": "Horde",
        "name": "Booty Bay Bodyguard",
        "id": "CS2_187",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_200.png",
        "cost": 6,
        "collectible": true,
        "set": "Basic",
        "artist": "Brian Despain",
        "health": 7,
        "type": "Minion",
        "howToGetGold": "Unlocked at Warlock Level 51.",
        "fr": {
            "name": "Ogre rochepoing"
        },
        "flavor": "\"ME HAVE GOOD STATS FOR THE COST\"",
        "attack": 6,
        "name": "Boulderfist Ogre",
        "id": "CS2_200",
        "rarity": "Free"
    },
    {
        "playerClass": "Warrior",
        "set": "Basic",
        "name": "Charge",
        "id": "CS2_103e2",
        "text": "+2 Attack and <b>Charge</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Charge"
        }
    },
    {
        "cardImage": "CS2_103.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Alex Horley Orlandelli",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 23.",
        "fr": {
            "name": "Charge"
        },
        "flavor": "\"Guys! Guys! Slow down!\" - some kind of non-warrior minion",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Charge",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_103",
        "text": "Give a friendly minion +2 Attack and <b>Charge</b>.",
        "rarity": "Free"
    },
    {
        "playerClass": "Hunter",
        "set": "Basic",
        "name": "Charge",
        "id": "DS1_178e",
        "text": "Tundra Rhino grants <b>Charge</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Charge"
        }
    },
    {
        "playerClass": "Warrior",
        "set": "Basic",
        "name": "Charge",
        "id": "EX1_084e",
        "text": "Warsong Commander is granting this minion +1 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Charge"
        }
    },
    {
        "cardImage": "CS2_182.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Mauro Cascioli",
        "health": 5,
        "type": "Minion",
        "howToGetGold": "Unlocked at Warrior Level 55.",
        "fr": {
            "name": "Yéti noroît"
        },
        "flavor": "He always dreamed of coming down from the mountains and opening a noodle shop, but he never got the nerve.",
        "attack": 4,
        "faction": "Neutral",
        "name": "Chillwind Yeti",
        "id": "CS2_182",
        "rarity": "Common"
    },
    {
        "playerClass": "Druid",
        "set": "Basic",
        "name": "Claw",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "CS2_005o",
        "text": "+2 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Griffe"
        }
    },
    {
        "cardImage": "CS2_005.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Dany Orizio",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 32.",
        "fr": {
            "name": "Griffe"
        },
        "flavor": "The claw decides who will stay and who will go.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Claw",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_005",
        "text": "Give your hero +2 Attack this turn and 2 Armor.",
        "rarity": "Free"
    },
    {
        "playerClass": "Druid",
        "set": "Basic",
        "name": "Claws",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "CS2_017o",
        "text": "Your hero has +1 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Griffes"
        }
    },
    {
        "cardImage": "CS2_114.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Phroilan Gardner",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 40.",
        "fr": {
            "name": "Enchaînement"
        },
        "flavor": "Hey you two…could you stand next to each other for a second…",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Cleave",
        "howToGet": "Unlocked at Level 2.",
        "id": "CS2_114",
        "text": "Deal $2 damage to two random enemy minions.",
        "rarity": "Common"
    },
    {
        "playerClass": "Priest",
        "set": "Basic",
        "name": "Cleric's Blessing",
        "id": "EX1_019e",
        "text": "+1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Bénédiction du clerc"
        }
    },
    {
        "set": "Basic",
        "name": "Coin's Vengeance",
        "id": "GAME_003",
        "text": "Going second makes your first minion stronger.",
        "type": "Enchantment",
        "fr": {
            "name": "Vengeance de la pièce"
        }
    },
    {
        "set": "Basic",
        "name": "Coin's Vengence",
        "id": "GAME_003e",
        "text": "Going second makes your first minion stronger.",
        "type": "Enchantment",
        "fr": {
            "name": "Vengeance de la pièce"
        }
    },
    {
        "cardImage": "CS2_093.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Vance Kovacs",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 43.",
        "fr": {
            "name": "Consécration"
        },
        "flavor": "Consecrated ground glows with Holy energy.  But it smells a little, too.",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Consecration",
        "howToGet": "Unlocked at Level 4.",
        "id": "CS2_093",
        "text": "Deal $2 damage to all enemies.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_201.png",
        "cost": 7,
        "collectible": true,
        "set": "Basic",
        "race": "Beast",
        "artist": "E.M. Gist",
        "health": 5,
        "type": "Minion",
        "howToGetGold": "Unlocked at Hunter Level 51.",
        "fr": {
            "name": "Chien du Magma"
        },
        "flavor": "You don’t tame a Core Hound. You just train it to eat someone else before it eats you.",
        "attack": 9,
        "name": "Core Hound",
        "id": "CS2_201",
        "rarity": "Common"
    },
    {
        "playerClass": "Warlock",
        "set": "Basic",
        "name": "Corruption",
        "id": "CS2_063e",
        "text": "At the start of the corrupting player's turn, destroy this minion.",
        "type": "Enchantment",
        "fr": {
            "name": "Corruption"
        }
    },
    {
        "cardImage": "CS2_063.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Wayne Reynolds",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 32.",
        "fr": {
            "name": "Corruption"
        },
        "flavor": "It starts with stealing a pen from work, and before you know it, BOOM!  Corrupted!",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Corruption",
        "howToGet": "Unlocked at Level 2.",
        "id": "CS2_063",
        "text": "Choose an enemy minion. At the start of your turn, destroy it.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_083b.png",
        "playerClass": "Rogue",
        "cost": 2,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Dagger Mastery",
        "id": "CS2_083b",
        "text": "<b>Hero Power</b>\nEquip a 1/2 Dagger.",
        "type": "Hero Power",
        "fr": {
            "name": "Maîtrise des dagues"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "EX1_582.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Jim Nelson",
        "health": 4,
        "mechanics": [
            "Spellpower"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Mage Level 59.",
        "fr": {
            "name": "Mage de Dalaran"
        },
        "flavor": "You don't see a lot of Dalaran warriors.",
        "attack": 1,
        "faction": "Neutral",
        "name": "Dalaran Mage",
        "id": "EX1_582",
        "text": "<b>Spell Damage +1</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "DS1_055.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "artist": "Jesper Ejsing",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Priest Level 55.",
        "fr": {
            "name": "Soigneuse sombrécaille"
        },
        "flavor": "Healing is just something she does in her free time.  It's more of a hobby really.",
        "attack": 4,
        "faction": "Neutral",
        "name": "Darkscale Healer",
        "id": "DS1_055",
        "text": "<b>Battlecry:</b> Restore 2 Health to all friendly characters.",
        "rarity": "Common"
    },
    {
        "set": "Basic",
        "name": "Deadly Poison",
        "id": "CS2_074e",
        "text": "+2 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Poison mortel"
        }
    },
    {
        "cardImage": "CS2_074.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Trevor Jacobs",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 43.",
        "fr": {
            "name": "Poison mortel"
        },
        "flavor": "Rogues guard the secrets to poison-making carefully, lest magi start incorporating poison into their spells.  Poisonbolt? Rain of Poison?  Poison Elemental?  Nobody wants that.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Deadly Poison",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_074",
        "text": "Give your weapon +2 Attack.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_236.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Jim Pavelec",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 28.",
        "fr": {
            "name": "Esprit divin"
        },
        "flavor": "Double the trouble. Double the fun!",
        "playerClass": "Priest",
        "name": "Divine Spirit",
        "howToGet": "Unlocked at Level 2.",
        "id": "CS2_236",
        "text": "Double a minion's Health.",
        "rarity": "Common"
    },
    {
        "playerClass": "Priest",
        "set": "Basic",
        "name": "Divine Spirit",
        "id": "CS2_236e",
        "text": "This minion has double Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Esprit divin"
        }
    },
    {
        "cardImage": "EX1_025.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Warren Mahy",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Mage Level 53.",
        "fr": {
            "name": "Mécano de petit dragon"
        },
        "flavor": "She is still working on installing the rocket launcher add-on for Mr. Bitey.",
        "attack": 2,
        "faction": "Alliance",
        "name": "Dragonling Mechanic",
        "id": "EX1_025",
        "text": "<b>Battlecry:</b> Summon a 2/1 Mechanical Dragonling.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_061.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Alex Horley Orlandelli",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 45.",
        "fr": {
            "name": "Drain de vie"
        },
        "flavor": "\"I've just sucked one year of your life away.\"",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Drain Life",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_061",
        "text": "Deal $2 damage. Restore #2 Health to your hero.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_064.png",
        "cost": 6,
        "collectible": true,
        "set": "Basic",
        "race": "Demon",
        "artist": "Zoltan & Gabor",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 23.",
        "fr": {
            "name": "Infernal de l’effroi"
        },
        "flavor": "\"INFERNOOOOOOOOOO!\" - Jaraxxus, Eredar Lord of the Burning Legion",
        "playerClass": "Warlock",
        "attack": 6,
        "faction": "Neutral",
        "name": "Dread Infernal",
        "howToGet": "Unlocked at Level 10.",
        "id": "CS2_064",
        "text": "<b>Battlecry:</b> Deal 1 damage to ALL other characters.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_189.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Steve Prescott",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Druid Level 57.",
        "fr": {
            "name": "Archère elfe"
        },
        "flavor": "Don't bother asking her out on a date.  She'll shoot you down.",
        "attack": 1,
        "faction": "Horde",
        "name": "Elven Archer",
        "id": "CS2_189",
        "text": "<b>Battlecry:</b> Deal 1 damage.",
        "rarity": "Common"
    },
    {
        "set": "Basic",
        "name": "Enhanced",
        "id": "CS2_122e",
        "text": "Raid Leader is granting this minion +1 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Amélioration"
        }
    },
    {
        "cardImage": "CS2_013t.png",
        "playerClass": "Druid",
        "cost": 0,
        "set": "Basic",
        "name": "Excess Mana",
        "id": "CS2_013t",
        "text": "Draw a card. <i>(You can only have 10 Mana in your tray.)</i>",
        "type": "Spell",
        "fr": {
            "name": "Excès de mana"
        }
    },
    {
        "cardImage": "CS2_108.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Dany Orizio",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 47.",
        "fr": {
            "name": "Exécution"
        },
        "flavor": "It's okay, he deserved it.",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Execute",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_108",
        "text": "Destroy a damaged enemy minion.",
        "rarity": "Free"
    },
    {
        "playerClass": "Hunter",
        "set": "Basic",
        "name": "Eye In The Sky",
        "id": "NEW1_033o",
        "text": "Leokk is granting this minion +1 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Œil céleste"
        }
    },
    {
        "cardImage": "EX1_129.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Andrew Robinson",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 29.",
        "fr": {
            "name": "Éventail de couteaux"
        },
        "flavor": "I wouldn't say I LOVE knives, but I'm definitely a fan.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Fan of Knives",
        "howToGet": "Unlocked at Level 4.",
        "id": "EX1_129",
        "text": "Deal $1 damage to all enemy minions. Draw a card.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_106.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Lucas Graciano",
        "durability": 2,
        "type": "Weapon",
        "howToGetGold": "Unlocked at Level 49.",
        "fr": {
            "name": "Hache de guerre embrasée"
        },
        "flavor": "During times of tranquility and harmony, this weapon was called by its less popular name, Chilly Peace Axe.",
        "playerClass": "Warrior",
        "attack": 3,
        "faction": "Neutral",
        "name": "Fiery War Axe",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_106",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_042.png",
        "cost": 6,
        "collectible": true,
        "set": "Basic",
        "artist": "Ralph Horsley",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 49.",
        "fr": {
            "name": "Élémentaire de feu"
        },
        "flavor": "He can never take a bath. Ewww.",
        "playerClass": "Shaman",
        "attack": 6,
        "faction": "Neutral",
        "name": "Fire Elemental",
        "howToGet": "Unlocked at Level 10.",
        "id": "CS2_042",
        "text": "<b>Battlecry:</b> Deal 3 damage.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_029.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Ralph Horsley",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 44.",
        "fr": {
            "name": "Boule de feu"
        },
        "flavor": "This spell is useful for burning things.  If you're looking for spells that toast things, or just warm them a little, you're in the wrong place.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Fireball",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_029",
        "text": "Deal $6 damage.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_034.png",
        "playerClass": "Mage",
        "cost": 2,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Fireblast",
        "id": "CS2_034",
        "text": "<b>Hero Power</b>\nDeal $1 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Explosion de feu"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_032.png",
        "cost": 7,
        "collectible": true,
        "set": "Basic",
        "artist": "Romain De Santi",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 51.",
        "fr": {
            "name": "Choc de flammes"
        },
        "flavor": "When the ground is on fire, you should <i>not</i> stop, drop, and roll.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Flamestrike",
        "howToGet": "Unlocked at Level 10.",
        "id": "CS2_032",
        "text": "Deal $4 damage to all enemy minions.",
        "rarity": "Common"
    },
    {
        "playerClass": "Shaman",
        "set": "Basic",
        "name": "Flametongue",
        "id": "EX1_565o",
        "text": "+2 Attack from Flametongue Totem.",
        "type": "Enchantment",
        "fr": {
            "name": "Langue de feu"
        }
    },
    {
        "cardImage": "EX1_565.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "race": "Totem",
        "artist": "Jonathan Ryder",
        "health": 3,
        "mechanics": [
            "AdjacentBuff",
            "Aura"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 43.",
        "fr": {
            "name": "Totem Langue de feu"
        },
        "flavor": "Totemsmiths like to use the rarest woods for their totems.  There are even rumors of totems made of Ironbark Protectors.",
        "playerClass": "Shaman",
        "attack": 0,
        "faction": "Neutral",
        "name": "Flametongue Totem",
        "howToGet": "Unlocked at Level 4.",
        "id": "EX1_565",
        "text": "Adjacent minions have +2 Attack.",
        "inPlayText": "Flametongue",
        "rarity": "Common"
    },
    {
        "cardImage": "hexfrog.png",
        "cost": 0,
        "set": "Basic",
        "race": "Beast",
        "health": 1,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Grenouille"
        },
        "attack": 0,
        "faction": "Neutral",
        "name": "Frog",
        "id": "hexfrog",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_026.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Josh Tallman",
        "mechanics": [
            "Freeze"
        ],
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 23.",
        "fr": {
            "name": "Nova de givre"
        },
        "flavor": "Hey man, that's cold.  Literally and metaphorically.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Frost Nova",
        "howToGet": "Unlocked at Level 6.",
        "id": "CS2_026",
        "text": "<b>Freeze</b> all enemy minions.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_037.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Alex Horley Orlandelli",
        "mechanics": [
            "Freeze"
        ],
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 32.",
        "fr": {
            "name": "Horion de givre"
        },
        "flavor": "FROST SHOCK!",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Frost Shock",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_037",
        "text": "Deal $1 damage to an enemy character and <b>Freeze</b> it.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_024.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Steve Ellis",
        "mechanics": [
            "Freeze"
        ],
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 40.",
        "fr": {
            "name": "Éclair de givre"
        },
        "flavor": "It is customary to yell \"Chill out!\" or \"Freeze!\" or \"Ice ice, baby!\" when you play this card.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Frostbolt",
        "howToGet": "Unlocked at Level 2.",
        "id": "CS2_024",
        "text": "Deal $3 damage to a character and <b>Freeze</b> it.",
        "rarity": "Common"
    },
    {
        "set": "Basic",
        "name": "Frostwolf Banner",
        "id": "CS2_226e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Bannière loup-de-givre"
        }
    },
    {
        "cardImage": "CS2_121.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Richie Marella",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Shaman Level 57.",
        "fr": {
            "name": "Grunt loup-de-givre"
        },
        "flavor": "Grunting is what his father did and his father before that.   It's more than just a job.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Frostwolf Grunt",
        "id": "CS2_121",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_226.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "artist": "James Ryman",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Shaman Level 53.",
        "fr": {
            "name": "Chef de guerre loup-de-givre"
        },
        "flavor": "The Frostwolves are locked in combat with the Stormpike Expedition over control of Alterac Valley.  Every attempt at peace-talks has ended with Captain Galvangar killing the mediator.",
        "attack": 4,
        "faction": "Horde",
        "name": "Frostwolf Warlord",
        "id": "CS2_226",
        "text": "<b>Battlecry:</b> Gain +1/+1 for each other friendly minion on the battlefield.",
        "rarity": "Common"
    },
    {
        "playerClass": "Hunter",
        "set": "Basic",
        "name": "Furious Howl",
        "id": "DS1_175o",
        "text": "This Beast has +1 Attack from Timber Wolf.",
        "type": "Enchantment",
        "fr": {
            "name": "Hurlement furieux"
        }
    },
    {
        "cardImage": "HERO_01.png",
        "playerClass": "Warrior",
        "collectible": true,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Garrosh Hellscream",
        "health": 30,
        "id": "HERO_01",
        "type": "Hero",
        "fr": {
            "name": "Garrosh Hurlenfer"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_147.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Court Jones",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Priest Level 57.",
        "fr": {
            "name": "Inventrice gnome"
        },
        "flavor": "She's never quite sure what she's making, she just knows it's AWESOME!",
        "attack": 2,
        "faction": "Alliance",
        "name": "Gnomish Inventor",
        "id": "CS2_147",
        "text": "<b>Battlecry:</b> Draw a card.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS1_042.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Donato Giancola",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Paladin Level 57.",
        "fr": {
            "name": "Soldat de Comté-de-l’Or"
        },
        "flavor": "If 1/2 minions are all that is defending Goldshire, you would think it would have been overrun years ago.",
        "attack": 1,
        "faction": "Alliance",
        "name": "Goldshire Footman",
        "id": "CS1_042",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_508.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "race": "Murloc",
        "artist": "Phil Saunders",
        "health": 1,
        "type": "Minion",
        "howToGetGold": "Unlocked at Warlock Level 53.",
        "fr": {
            "name": "Oracle sinistrécaille"
        },
        "flavor": "These are the brainy murlocs.  It turns out that doesn’t mean much.",
        "attack": 1,
        "faction": "Neutral",
        "name": "Grimscale Oracle",
        "id": "EX1_508",
        "text": "ALL other Murlocs have +1 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_088.png",
        "cost": 7,
        "collectible": true,
        "set": "Basic",
        "artist": "E.M. Gist",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 47.",
        "fr": {
            "name": "Gardien des rois"
        },
        "flavor": "Holy beings from the beyond are so cliché!",
        "playerClass": "Paladin",
        "attack": 5,
        "faction": "Neutral",
        "name": "Guardian of Kings",
        "howToGet": "Unlocked at Level 8.",
        "id": "CS2_088",
        "text": "<b>Battlecry:</b> Restore 6 Health to your hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "HERO_07.png",
        "playerClass": "Warlock",
        "collectible": true,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Gul'dan",
        "health": 30,
        "id": "HERO_07",
        "type": "Hero",
        "fr": {
            "name": "Gul’dan"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "EX1_399.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "artist": "Alex Horley Orlandelli",
        "health": 7,
        "type": "Minion",
        "howToGetGold": "Unlocked at Warlock Level 57.",
        "fr": {
            "name": "Berserker gurubashi"
        },
        "flavor": "No Pain, No Gain.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Gurubashi Berserker",
        "id": "EX1_399",
        "text": "Whenever this minion takes damage, gain +3 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_094.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Efrem Palacios",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 32.",
        "fr": {
            "name": "Marteau de courroux"
        },
        "flavor": "A good paladin has many tools.  Hammer of Wrath, Pliers of Vengeance, Hacksaw of Justice, etc.",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Hammer of Wrath",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_094",
        "text": "Deal $3 damage.\nDraw a card.",
        "rarity": "Free"
    },
    {
        "cardImage": "EX1_371.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Clint Langley",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 23.",
        "fr": {
            "name": "Main de protection"
        },
        "flavor": "This spell has been renamed so many times, even paladins don’t know what it should be called anymore.",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Hand of Protection",
        "howToGet": "Unlocked at Level 1.",
        "id": "EX1_371",
        "text": "Give a minion <b>Divine Shield</b>.",
        "rarity": "Free"
    },
    {
        "cardImage": "NEW1_009.png",
        "cost": 1,
        "set": "Basic",
        "race": "Totem",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Totem de soins"
        },
        "playerClass": "Shaman",
        "attack": 0,
        "name": "Healing Totem",
        "id": "NEW1_009",
        "text": "At the end of your turn, restore 1 Health to all friendly minions.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_007.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Cyril Van Der Haegen",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 15.",
        "fr": {
            "name": "Toucher guérisseur"
        },
        "flavor": "8 Health, no waiting.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Healing Touch",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_007",
        "text": "Restore #8 Health.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_062.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Chippy",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 49.",
        "fr": {
            "name": "Flammes infernales"
        },
        "flavor": "It's spells like these that make it hard for Warlocks to get decent help.",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Hellfire",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_062",
        "text": "Deal $3 damage to ALL characters.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_105.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Jonboy Meyers",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 15.",
        "fr": {
            "name": "Frappe héroïque"
        },
        "flavor": "Really, if you're a hero, this is <i>every</i> strike.",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Heroic Strike",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_105",
        "text": "Give your hero +4 Attack this turn.",
        "rarity": "Free"
    },
    {
        "playerClass": "Warrior",
        "set": "Basic",
        "name": "Heroic Strike",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "CS2_105e",
        "text": "+4 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Frappe héroïque"
        }
    },
    {
        "cardImage": "EX1_246.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Steve Hui",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 47.",
        "fr": {
            "name": "Maléfice"
        },
        "flavor": "If you Hex a Murloc... it really isn't much of a change, is it?",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Hex",
        "howToGet": "Unlocked at Level 1.",
        "id": "EX1_246",
        "text": "Transform a minion into a 0/1 Frog with <b>Taunt</b>.",
        "rarity": "Free"
    },
    {
        "playerClass": "Shaman",
        "set": "Basic",
        "name": "Hexxed",
        "mechanics": [
            "Morph"
        ],
        "id": "EX1_246e",
        "text": "This minion has been transformed!",
        "type": "Enchantment",
        "fr": {
            "name": "Maléficié"
        }
    },
    {
        "cardImage": "CS2_089.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Zoltan & Gabor",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 15.",
        "fr": {
            "name": "Lumière sacrée"
        },
        "flavor": "If you are often bathed in Holy Light, you should consider wearing sunscreen.",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Holy Light",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_089",
        "text": "Restore #6 Health.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS1_112.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "artist": "Luca Zontini",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 45.",
        "fr": {
            "name": "Nova sacrée"
        },
        "flavor": "If the Holy Light forsakes you, good luck casting this spell.  Also, you're probably a jerk.",
        "playerClass": "Priest",
        "faction": "Neutral",
        "name": "Holy Nova",
        "howToGet": "Unlocked at Level 6.",
        "id": "CS1_112",
        "text": "Deal $2 damage to all enemies. Restore #2 Health to all friendly characters.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS1_130.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Steve Ellis",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 23.",
        "fr": {
            "name": "Châtiment sacré"
        },
        "flavor": "It doesn't matter how pious you are.  Everyone needs a good smiting now and again.",
        "playerClass": "Priest",
        "faction": "Neutral",
        "name": "Holy Smite",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS1_130",
        "text": "Deal $2 damage.",
        "rarity": "Free"
    },
    {
        "cardImage": "DS1_070.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Dan Brereton",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 28.",
        "fr": {
            "name": "Maître-chien"
        },
        "flavor": "\"Who let the dogs out?\" he asks.  It's rhetorical.",
        "playerClass": "Hunter",
        "attack": 4,
        "faction": "Neutral",
        "name": "Houndmaster",
        "howToGet": "Unlocked at Level 1.",
        "id": "DS1_070",
        "text": "<b>Battlecry:</b> Give a friendly Beast +2/+2 and <b>Taunt</b>.",
        "inPlayText": "Beastmaster",
        "rarity": "Free"
    },
    {
        "cardImage": "NEW1_034.png",
        "cost": 3,
        "set": "Basic",
        "race": "Beast",
        "health": 2,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "Souffleur"
        },
        "playerClass": "Hunter",
        "attack": 4,
        "name": "Huffer",
        "id": "NEW1_034",
        "text": "<b>Charge</b>",
        "rarity": "Common"
    },
    {
        "playerClass": "Paladin",
        "set": "Basic",
        "faction": "Neutral",
        "name": "Humility",
        "id": "EX1_360e",
        "text": "Attack has been changed to 1.",
        "type": "Enchantment",
        "fr": {
            "name": "Humilité"
        }
    },
    {
        "cardImage": "EX1_360.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Daren Bader",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 28.",
        "fr": {
            "name": "Humilité"
        },
        "flavor": "This card makes something really damp.  Oh wait.  That's \"Humidity.\"",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Humility",
        "howToGet": "Unlocked at Level 6.",
        "id": "EX1_360",
        "text": "Change a minion's Attack to 1.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_084.png",
        "cost": 0,
        "collectible": true,
        "set": "Basic",
        "artist": "Jimmy Lo",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 40.",
        "fr": {
            "name": "Marque du chasseur"
        },
        "flavor": "Never play 'Hide and Go Seek' with a Hunter.",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Hunter's Mark",
        "howToGet": "Unlocked at Level 6.",
        "id": "CS2_084",
        "text": "Change a minion's Health to 1.",
        "rarity": "Common"
    },
    {
        "playerClass": "Hunter",
        "set": "Basic",
        "name": "Hunter's Mark",
        "id": "CS2_084e",
        "text": "This minion has 1 Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Marque du chasseur"
        }
    },
    {
        "cardImage": "EX1_169.png",
        "cost": 0,
        "collectible": true,
        "set": "Basic",
        "artist": "Doug Alexander",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 36.",
        "fr": {
            "name": "Innervation"
        },
        "flavor": "Some druids still have flashbacks from strangers yelling \"Innervate me!!\" at them.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Innervate",
        "howToGet": "Unlocked at Level 1.",
        "id": "EX1_169",
        "text": "Gain 2 Mana Crystals this turn only.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_232.png",
        "cost": 8,
        "collectible": true,
        "set": "Basic",
        "artist": "Dave Allsop",
        "health": 8,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 49.",
        "fr": {
            "name": "Protecteur Écorcefer"
        },
        "flavor": "I <i>dare</i> you to attack Darnassus.",
        "playerClass": "Druid",
        "attack": 8,
        "faction": "Neutral",
        "name": "Ironbark Protector",
        "howToGet": "Unlocked at Level 10.",
        "id": "CS2_232",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_141.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Tooth",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Mage Level 55.",
        "fr": {
            "name": "Fusilier de Forgefer"
        },
        "flavor": "\"Ready! Aim! Drink!\"",
        "attack": 2,
        "faction": "Alliance",
        "name": "Ironforge Rifleman",
        "id": "CS2_141",
        "text": "<b>Battlecry:</b> Deal 1 damage.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_125.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "race": "Beast",
        "artist": "Lars Grant-West",
        "health": 3,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Hunter Level 59.",
        "fr": {
            "name": "Grizzly Ferpoil"
        },
        "flavor": "\"Bear Carcass 1/10\"",
        "attack": 3,
        "faction": "Neutral",
        "name": "Ironfur Grizzly",
        "id": "CS2_125",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "HERO_08.png",
        "playerClass": "Mage",
        "collectible": true,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Jaina Proudmoore",
        "health": 30,
        "id": "HERO_08",
        "type": "Hero",
        "fr": {
            "name": "Jaina Portvaillant"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "EX1_539.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Gabe from Penny Arcade",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 49.",
        "fr": {
            "name": "Ordre de tuer"
        },
        "flavor": "\"Kill!\", he commanded.",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Kill Command",
        "howToGet": "Unlocked at Level 10.",
        "id": "EX1_539",
        "text": "Deal $3 damage. If you have a Beast, deal $5 damage instead.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_142.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Gabor Szikszai",
        "health": 2,
        "mechanics": [
            "Spellpower"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Warlock Level 59.",
        "fr": {
            "name": "Géomancien kobold"
        },
        "flavor": "In the old days, Kobolds were the finest candle merchants in the land. Then they got pushed too far...",
        "attack": 2,
        "faction": "Horde",
        "name": "Kobold Geomancer",
        "id": "CS2_142",
        "text": "<b>Spell Damage +1</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "NEW1_011.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Alex Horley Orlandelli",
        "health": 3,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 44.",
        "fr": {
            "name": "Soldat d’élite kor’kron"
        },
        "flavor": "The Kor'kron are the elite forces of Garrosh Hellscream. Let's just say you don't want to run into these guys while wearing a blue tabard.",
        "playerClass": "Warrior",
        "attack": 4,
        "name": "Kor'kron Elite",
        "howToGet": "Unlocked at Level 4.",
        "id": "NEW1_011",
        "text": "<b>Charge</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "NEW1_033.png",
        "cost": 3,
        "set": "Basic",
        "race": "Beast",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Leokk"
        },
        "playerClass": "Hunter",
        "attack": 2,
        "name": "Leokk",
        "id": "NEW1_033",
        "text": "Your other minions have +1 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS1h_001.png",
        "playerClass": "Priest",
        "cost": 2,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Lesser Heal",
        "id": "CS1h_001",
        "text": "<b>Hero Power</b>\nRestore #2 Health.",
        "type": "Hero Power",
        "fr": {
            "name": "Soins inférieurs"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_056.png",
        "playerClass": "Warlock",
        "cost": 2,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Life Tap",
        "id": "CS2_056",
        "text": "<b>Hero Power</b>\nDraw a card and take $2 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Connexion"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_091.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Glenn Rane",
        "durability": 4,
        "type": "Weapon",
        "howToGetGold": "Unlocked at Level 36.",
        "fr": {
            "name": "Justice de la Lumière"
        },
        "flavor": "Prince Malchezaar was a collector of rare weapons. He'd animate them and have them dance for him.",
        "playerClass": "Paladin",
        "attack": 1,
        "faction": "Neutral",
        "name": "Light's Justice",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_091",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_162.png",
        "cost": 6,
        "collectible": true,
        "set": "Basic",
        "artist": "E.M. Gist",
        "health": 5,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Priest Level 59.",
        "fr": {
            "name": "Seigneur de l’arène"
        },
        "flavor": "He used to be a 2100+ rated arena player, but that was years ago and nobody can get him to shut up about it.",
        "attack": 6,
        "faction": "Alliance",
        "name": "Lord of the Arena",
        "id": "CS2_162",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "set": "Basic",
        "name": "Luck of the Coin",
        "id": "GAME_001",
        "text": "Going second grants you increased Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Chance de la pièce"
        }
    },
    {
        "cardImage": "CS2_118.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Matt Gaser",
        "health": 1,
        "type": "Minion",
        "howToGetGold": "Unlocked at Shaman Level 51.",
        "fr": {
            "name": "Enragé du magma"
        },
        "flavor": "He likes to think he is powerful, but pretty much anyone can solo Molten Core now.",
        "attack": 5,
        "name": "Magma Rager",
        "id": "CS2_118",
        "rarity": "Free"
    },
    {
        "cardImage": "HERO_06.png",
        "playerClass": "Druid",
        "collectible": true,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Malfurion Stormrage",
        "health": 30,
        "id": "HERO_06",
        "type": "Hero",
        "fr": {
            "name": "Malfurion Hurlorage"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_009.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Brad Vancata",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 28.",
        "fr": {
            "name": "Marque du fauve"
        },
        "flavor": "Not to be confused with Jim of the Wild.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Mark of the Wild",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_009",
        "text": "Give a minion <b>Taunt</b> and +2/+2.<i> (+2 Attack/+2 Health)</i>",
        "rarity": "Free"
    },
    {
        "playerClass": "Druid",
        "set": "Basic",
        "name": "Mark of the Wild",
        "id": "CS2_009e",
        "text": "This minion has +2/+2 and <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Marque du fauve"
        }
    },
    {
        "playerClass": "Hunter",
        "set": "Basic",
        "name": "Master's Presence",
        "id": "DS1_070o",
        "text": "+2/+2 and <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Présence du maître"
        }
    },
    {
        "cardImage": "EX1_025t.png",
        "cost": 1,
        "set": "Basic",
        "race": "Mech",
        "attack": 2,
        "faction": "Neutral",
        "name": "Mechanical Dragonling",
        "health": 1,
        "id": "EX1_025t",
        "type": "Minion",
        "fr": {
            "name": "Petit dragon mécanique"
        },
        "rarity": "Common"
    },
    {
        "set": "Basic",
        "name": "Might of Stormwind",
        "id": "CS2_222o",
        "text": "Has +1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance de Hurlevent"
        }
    },
    {
        "cardImage": "DS1_233.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Dave Allsop",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 15.",
        "fr": {
            "name": "Attaque mentale"
        },
        "flavor": "This spell blasts you directly in the MIND.",
        "playerClass": "Priest",
        "faction": "Neutral",
        "name": "Mind Blast",
        "howToGet": "Unlocked at Level 1.",
        "id": "DS1_233",
        "text": "Deal $5 damage to the enemy hero.",
        "rarity": "Free"
    },
    {
        "playerClass": "Priest",
        "set": "Basic",
        "faction": "Neutral",
        "name": "Mind Control",
        "id": "CS1_113e",
        "text": "This minion has switched controllers.",
        "type": "Enchantment",
        "fr": {
            "name": "Contrôle mental"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "CS1_113.png",
        "cost": 10,
        "collectible": true,
        "set": "Basic",
        "artist": "Sean O’Daniels",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 49.",
        "fr": {
            "name": "Contrôle mental"
        },
        "flavor": "Nominated as \"Spell Most Likely to Make Your Opponent Punch the Wall.\"",
        "playerClass": "Priest",
        "faction": "Neutral",
        "name": "Mind Control",
        "howToGet": "Unlocked at Level 10.",
        "id": "CS1_113",
        "text": "Take control of an enemy minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_003.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Michael Komarck",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 32.",
        "fr": {
            "name": "Vision télépathique"
        },
        "flavor": "I see what you did there.",
        "playerClass": "Priest",
        "faction": "Neutral",
        "name": "Mind Vision",
        "howToGet": "Unlocked at Level 4.",
        "id": "CS2_003",
        "text": "Put a copy of a random card in your opponent's hand into your hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_mirror.png",
        "cost": 0,
        "set": "Basic",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Image miroir"
        },
        "playerClass": "Mage",
        "attack": 0,
        "faction": "Neutral",
        "name": "Mirror Image",
        "id": "CS2_mirror",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_027.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Jim Nelson",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 36.",
        "fr": {
            "name": "Image miroir"
        },
        "flavor": "Oh hey it's Mirror Image! !egamI rorriM s'ti yeh hO",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Mirror Image",
        "howToGet": "Unlocked at Level 4.",
        "id": "CS2_027",
        "text": "Summon two 0/2 minions with <b>Taunt</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "NEW1_032.png",
        "cost": 3,
        "set": "Basic",
        "race": "Beast",
        "health": 4,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Misha"
        },
        "playerClass": "Hunter",
        "attack": 4,
        "name": "Misha",
        "id": "NEW1_032",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "set": "Basic",
        "name": "Mlarggragllabl!",
        "id": "EX1_508o",
        "text": "This Murloc has +1 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Mlarggragllabl !"
        }
    },
    {
        "cardImage": "CS2_008.png",
        "cost": 0,
        "collectible": true,
        "set": "Basic",
        "artist": "Richard Wright",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 40.",
        "fr": {
            "name": "Éclat lunaire"
        },
        "flavor": "\"Cast Moonfire, and never stop.\" - How to Be a Druid, Chapter 5, Section 3",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Moonfire",
        "howToGet": "Unlocked at Level 6.",
        "id": "CS2_008",
        "text": "Deal $1 damage.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_302.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Matt Gaser",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 43.",
        "fr": {
            "name": "Voile de mort"
        },
        "flavor": "If your spells look like horrifying skulls, let's be honest, you should get to draw some cards.",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Mortal Coil",
        "howToGet": "Unlocked at Level 4.",
        "id": "EX1_302",
        "text": "Deal $1 damage to a minion. If that kills it, draw a card.",
        "rarity": "Common"
    },
    {
        "cardImage": "DS1_183.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Benjamin Zhang",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 36.",
        "fr": {
            "name": "Flèches multiples"
        },
        "flavor": "You see, it's all about <i>throughput</i>.",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Multi-Shot",
        "howToGet": "Unlocked at Level 1.",
        "id": "DS1_183",
        "text": "Deal $3 damage to two random enemy minions.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_168.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "race": "Murloc",
        "artist": "Dan Scott",
        "health": 1,
        "type": "Minion",
        "howToGetGold": "Unlocked at Priest Level 51.",
        "fr": {
            "name": "Écumeur murloc"
        },
        "flavor": "Mrrraggglhlhghghlgh, mrgaaag blarrghlgaahahl mrgggg glhalhah a bghhll graggmgmg Garrosh mglhlhlh mrghlhlhl!!",
        "attack": 2,
        "faction": "Alliance",
        "name": "Murloc Raider",
        "id": "CS2_168",
        "rarity": "Free"
    },
    {
        "cardImage": "EX1_506a.png",
        "cost": 0,
        "set": "Basic",
        "race": "Murloc",
        "attack": 1,
        "faction": "Neutral",
        "name": "Murloc Scout",
        "health": 1,
        "id": "EX1_506a",
        "type": "Minion",
        "fr": {
            "name": "Éclaireur murloc"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_506.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "race": "Murloc",
        "artist": "Dan Scott",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Rogue Level 53.",
        "fr": {
            "name": "Chasse-marée murloc"
        },
        "flavor": "\"Death will rise, from the tides!\"",
        "attack": 2,
        "faction": "Neutral",
        "name": "Murloc Tidehunter",
        "id": "EX1_506",
        "text": "<b>Battlecry:</b> Summon a 1/1 Murloc Scout.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_593.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "artist": "Raymond Swanland",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Druid Level 53.",
        "fr": {
            "name": "Lamenuit"
        },
        "flavor": "Your face is the place you'd probably least like a dagger, and where rogues are most likely to deliver them.",
        "attack": 4,
        "faction": "Neutral",
        "name": "Nightblade",
        "id": "EX1_593",
        "text": "<b>Battlecry: </b>Deal 3 damage to the enemy hero.",
        "rarity": "Free"
    },
    {
        "flavor": "Even your flavor text has been deleted. Dang.",
        "cardImage": "GAME_006.png",
        "cost": 2,
        "set": "Basic",
        "name": "NOOOOOOOOOOOO",
        "id": "GAME_006",
        "text": "Somehow, the card you USED to have has been deleted.  Here, have this one instead!",
        "type": "Spell",
        "fr": {
            "name": "NOOOOOOOOOOOON !"
        }
    },
    {
        "cardImage": "CS2_235.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Terese Nielsen",
        "health": 3,
        "mechanics": [
            "HealTarget"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 40.",
        "fr": {
            "name": "Clerc de Comté-du-Nord"
        },
        "flavor": "They help the downtrodden and distressed.  Also they sell cookies.",
        "playerClass": "Priest",
        "attack": 1,
        "name": "Northshire Cleric",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_235",
        "text": "Whenever a minion is healed, draw a card.",
        "rarity": "Free"
    },
    {
        "cardImage": "EX1_015.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Karl Richardson",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Druid Level 59.",
        "fr": {
            "name": "Ingénieur novice"
        },
        "flavor": "\"Half of this class will not graduate… since they'll have been turned to chickens.\" - Tinkmaster Overspark, teaching Gizmos 101.",
        "attack": 1,
        "faction": "Alliance",
        "name": "Novice Engineer",
        "id": "EX1_015",
        "text": "<b>Battlecry:</b> Draw a card.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_119.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "race": "Beast",
        "artist": "Ittoku",
        "health": 7,
        "type": "Minion",
        "howToGetGold": "Unlocked at Druid Level 51.",
        "fr": {
            "name": "Gueule d’acier des oasis"
        },
        "flavor": "His dreams of flying and breathing fire like his idol will never be realized.",
        "attack": 2,
        "name": "Oasis Snapjaw",
        "id": "CS2_119",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_197.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "James Ryman",
        "health": 4,
        "mechanics": [
            "Spellpower"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Warlock Level 55.",
        "fr": {
            "name": "Ogre-magi"
        },
        "flavor": "Training Ogres in the art of spellcasting is a questionable decision.",
        "attack": 4,
        "faction": "Neutral",
        "name": "Ogre Magi",
        "id": "CS2_197",
        "text": "<b>Spell Damage +1</b>",
        "rarity": "Common"
    },
    {
        "playerClass": "Mage",
        "set": "Basic",
        "faction": "Neutral",
        "name": "Polymorph",
        "mechanics": [
            "Morph"
        ],
        "id": "CS2_022e",
        "text": "This minion has been transformed into a 1/1 Sheep.",
        "type": "Enchantment",
        "fr": {
            "name": "Métamorphose"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_022.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Vance Kovacs",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 47.",
        "fr": {
            "name": "Métamorphose"
        },
        "flavor": "There was going to be a pun in this flavor text, but it just came out baa-d.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Polymorph",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_022",
        "text": "Transform a minion into a 1/1 Sheep.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_004.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Jessica Jung",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 47.",
        "fr": {
            "name": "Mot de pouvoir : Bouclier"
        },
        "flavor": "Sure the extra protection is nice, but the shield really reduces visibility.",
        "playerClass": "Priest",
        "faction": "Neutral",
        "name": "Power Word: Shield",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_004",
        "text": "Give a minion +2 Health.\nDraw a card.",
        "rarity": "Free"
    },
    {
        "playerClass": "Priest",
        "set": "Basic",
        "name": "Power Word: Shield",
        "id": "CS2_004e",
        "text": "+2 Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Mot de pouvoir : Bouclier"
        }
    },
    {
        "cardImage": "CS2_122.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Phill Gonzales",
        "health": 2,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Warrior Level 57.",
        "fr": {
            "name": "Chef de raid"
        },
        "flavor": "\"That's a 50 DKP minus!\"",
        "attack": 2,
        "name": "Raid Leader",
        "id": "CS2_122",
        "text": "Your other minions have +1 Attack.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_196.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Clint Langley",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Hunter Level 55.",
        "fr": {
            "name": "Chasseuse de Tranchebauge"
        },
        "flavor": "Someone did mess with Tuskerr once.  ONCE.",
        "attack": 2,
        "faction": "Horde",
        "name": "Razorfen Hunter",
        "id": "CS2_196",
        "text": "<b>Battlecry:</b> Summon a 1/1 Boar.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_213.png",
        "cost": 6,
        "collectible": true,
        "set": "Basic",
        "artist": "John Polidora",
        "health": 2,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Shaman Level 59.",
        "fr": {
            "name": "Missilière téméraire"
        },
        "flavor": "One Insane Rocketeer.   One Rocket full of Explosives.   Infinite Fun.",
        "attack": 5,
        "faction": "Horde",
        "name": "Reckless Rocketeer",
        "id": "CS2_213",
        "text": "<b>Charge</b>",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_101.png",
        "playerClass": "Paladin",
        "cost": 2,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Reinforce",
        "id": "CS2_101",
        "text": "<b>Hero Power</b>\nSummon a 1/1 Silver Hand Recruit.",
        "type": "Hero Power",
        "fr": {
            "name": "Renfort"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "HERO_05.png",
        "playerClass": "Hunter",
        "collectible": true,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Rexxar",
        "health": 30,
        "id": "HERO_05",
        "type": "Hero",
        "fr": {
            "name": "Rexxar"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_120.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "race": "Beast",
        "artist": "Daren Bader",
        "health": 3,
        "type": "Minion",
        "howToGetGold": "Unlocked at Druid Level 55.",
        "fr": {
            "name": "Crocilisque des rivières"
        },
        "flavor": "Edward \"Lefty\" Smith tried to make luggage out of a river crocolisk once.",
        "attack": 2,
        "name": "River Crocolisk",
        "id": "CS2_120",
        "rarity": "Free"
    },
    {
        "playerClass": "Shaman",
        "set": "Basic",
        "name": "Rockbiter Weapon",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "CS2_045e",
        "text": "This character has +3 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Arme croque-roc"
        }
    },
    {
        "cardImage": "CS2_045.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Alex Horley Orlandelli",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 36.",
        "fr": {
            "name": "Arme croque-roc"
        },
        "flavor": "This would be real handy if your enemy is made of rock.",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Rockbiter Weapon",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_045",
        "text": "Give a friendly character +3 Attack this turn.",
        "rarity": "Free"
    },
    {
        "cardImage": "NEW1_003.png",
        "cost": 0,
        "collectible": true,
        "set": "Basic",
        "artist": "Jim Nelson",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 15.",
        "fr": {
            "name": "Pacte sacrificiel"
        },
        "flavor": "This is the reason that Demons never really become friends with Warlocks.",
        "playerClass": "Warlock",
        "name": "Sacrificial Pact",
        "howToGet": "Unlocked at Level 8.",
        "id": "NEW1_003",
        "text": "Destroy a Demon. Restore #5 Health to your hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_581.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Scott Altmann",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 40.",
        "fr": {
            "name": "Assommer"
        },
        "flavor": "Rogues love sappy movies.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Sap",
        "howToGet": "Unlocked at Level 1.",
        "id": "EX1_581",
        "text": "Return an enemy minion to your opponent's hand.",
        "rarity": "Free"
    },
    {
        "playerClass": "Druid",
        "set": "Basic",
        "name": "Savage Roar",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "CS2_011o",
        "text": "+2 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Rugissement sauvage"
        }
    },
    {
        "cardImage": "CS2_011.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Grace Liu",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 43.",
        "fr": {
            "name": "Rugissement sauvage"
        },
        "flavor": "What do they roar? Nobody can quite tell, but it sounds like \"Elephant Macho Breeze\".  It's probably not that, though.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Savage Roar",
        "howToGet": "Unlocked at Level 4.",
        "id": "CS2_011",
        "text": "Give your characters +2 Attack this turn.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_050.png",
        "cost": 1,
        "set": "Basic",
        "race": "Totem",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "Totem incendiaire"
        },
        "playerClass": "Shaman",
        "attack": 1,
        "faction": "Neutral",
        "name": "Searing Totem",
        "id": "CS2_050",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_179.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Brian Despain",
        "health": 5,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Rogue Level 59.",
        "fr": {
            "name": "Maître-bouclier de Sen’jin"
        },
        "flavor": "Sen'jin Villiage is nice, if you like trolls and dust.",
        "attack": 3,
        "faction": "Horde",
        "name": "Sen'jin Shieldmasta",
        "id": "CS2_179",
        "text": "<b>Taunt</b>",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_057.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Dave Allsop",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 47.",
        "fr": {
            "name": "Trait de l’ombre"
        },
        "flavor": "It’s a Bolt.   Its made out of Shadow.   What more do you need to know!",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Shadow Bolt",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_057",
        "text": "Deal $4 damage to a minion.",
        "rarity": "Free"
    },
    {
        "cardImage": "EX1_622.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Raymond Swanland",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 43.",
        "fr": {
            "name": "Mot de l’ombre : Mort"
        },
        "flavor": "If you miss, it leaves a lightning-bolt-shaped scar on your target.",
        "playerClass": "Priest",
        "name": "Shadow Word: Death",
        "howToGet": "Unlocked at Level 8.",
        "id": "EX1_622",
        "text": "Destroy a minion with an Attack of 5 or more.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_234.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Raymond Swanland",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 36.",
        "fr": {
            "name": "Mot de l’ombre : Douleur"
        },
        "flavor": "A step up from a spell cast by many beginning acolytes: \"Shadow Word: Annoy\".",
        "playerClass": "Priest",
        "name": "Shadow Word: Pain",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_234",
        "text": "Destroy a minion with 3 or less Attack.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_017.png",
        "playerClass": "Druid",
        "cost": 2,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Shapeshift",
        "id": "CS2_017",
        "text": "<b>Hero Power</b>\n+1 Attack this turn.\n+1 Armor.",
        "type": "Hero Power",
        "fr": {
            "name": "Changeforme"
        },
        "rarity": "Free"
    },
    {
        "playerClass": "Rogue",
        "set": "Basic",
        "name": "Sharpened",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "CS2_083e",
        "text": "+1 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Aiguisé"
        }
    },
    {
        "cardImage": "EX1_019.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Doug Alexander",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Priest Level 53.",
        "fr": {
            "name": "Clerc du Soleil brisé"
        },
        "flavor": "They always have a spare flask of Sunwell Energy Drink™!",
        "attack": 3,
        "faction": "Neutral",
        "name": "Shattered Sun Cleric",
        "id": "EX1_019",
        "text": "<b>Battlecry:</b> Give a friendly minion +1/+1.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_tk1.png",
        "cost": 0,
        "set": "Basic",
        "race": "Beast",
        "attack": 1,
        "faction": "Neutral",
        "name": "Sheep",
        "health": 1,
        "id": "CS2_tk1",
        "type": "Minion",
        "fr": {
            "name": "Mouton"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_606.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Michael Komarck",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 28.",
        "fr": {
            "name": "Maîtrise du blocage"
        },
        "flavor": "Shields were invented because Face Block is USELESS.",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Shield Block",
        "howToGet": "Unlocked at Level 8.",
        "id": "EX1_606",
        "text": "Gain 5 Armor.\nDraw a card.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_278.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Alex Garner",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 45.",
        "fr": {
            "name": "Kriss"
        },
        "flavor": "Rogues are experts at SHIV-al-ry.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Shiv",
        "howToGet": "Unlocked at Level 6.",
        "id": "EX1_278",
        "text": "Deal $1 damage. Draw a card.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_101t.png",
        "playerClass": "Paladin",
        "cost": 1,
        "set": "Basic",
        "attack": 1,
        "name": "Silver Hand Recruit",
        "health": 1,
        "id": "CS2_101t",
        "type": "Minion",
        "fr": {
            "name": "Recrue de la Main d’argent"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_127.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "race": "Beast",
        "artist": "Daren Bader",
        "health": 4,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Warrior Level 53.",
        "fr": {
            "name": "Patriarche dos-argenté"
        },
        "flavor": "He likes to act like he's in charge, but the silverback matriarch actually runs things.",
        "attack": 1,
        "faction": "Horde",
        "name": "Silverback Patriarch",
        "id": "CS2_127",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_075.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Frank Cho",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 15.",
        "fr": {
            "name": "Attaque pernicieuse"
        },
        "flavor": "There's something about this strike that just feels off.  Sinister, even.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Sinister Strike",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_075",
        "text": "Deal $3 damage to the enemy hero.",
        "rarity": "Free"
    },
    {
        "cardImage": "skele11.png",
        "cost": 1,
        "set": "Basic",
        "attack": 1,
        "faction": "Neutral",
        "name": "Skeleton",
        "health": 1,
        "id": "skele11",
        "text": "<b></b>",
        "type": "Minion",
        "fr": {
            "name": "Squelette"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_308.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Raymond Swanland",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 28.",
        "fr": {
            "name": "Feu de l’âme"
        },
        "flavor": "Are you lighting a soul on fire? Or burning someone with your OWN soul? This seems like an important distinction.",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Soulfire",
        "howToGet": "Unlocked at Level 6.",
        "id": "EX1_308",
        "text": "Deal $4 damage. Discard a random card.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_077.png",
        "cost": 7,
        "collectible": true,
        "set": "Basic",
        "artist": "James Zhang",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 49.",
        "fr": {
            "name": "Sprint"
        },
        "flavor": "Rogues are not good joggers.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Sprint",
        "howToGet": "Unlocked at Level 10.",
        "id": "CS2_077",
        "text": "Draw 4 cards.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_173.png",
        "cost": 6,
        "collectible": true,
        "set": "Basic",
        "artist": "Alex Horley Orlandelli",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 45.",
        "fr": {
            "name": "Feu stellaire"
        },
        "flavor": "Balance is important to druids.  This card is perfectly balanced.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Starfire",
        "howToGet": "Unlocked at Level 2.",
        "id": "EX1_173",
        "text": "Deal $5 damage.\nDraw a card.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_237.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "race": "Beast",
        "artist": "Bernie Kang",
        "health": 2,
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 47.",
        "fr": {
            "name": "Busard affamé"
        },
        "flavor": "If you feed him, he loses his whole <i>identity</i>.",
        "playerClass": "Hunter",
        "attack": 3,
        "name": "Starving Buzzard",
        "howToGet": "Unlocked at Level 4.",
        "id": "CS2_237",
        "text": "Whenever you summon a Beast, draw a card.",
        "inPlayText": "Soaring",
        "rarity": "Common"
    },
    {
        "cardImage": "DS1h_292.png",
        "playerClass": "Hunter",
        "cost": 2,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Steady Shot",
        "id": "DS1h_292",
        "text": "<b>Hero Power</b>\nDeal $2 damage to the enemy hero.",
        "type": "Hero Power",
        "fr": {
            "name": "Tir assuré"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_051.png",
        "cost": 1,
        "set": "Basic",
        "race": "Totem",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Totem de griffes de pierre"
        },
        "playerClass": "Shaman",
        "attack": 0,
        "faction": "Neutral",
        "name": "Stoneclaw Totem",
        "id": "CS2_051",
        "text": "<b>Taunt</b>",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_171.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "race": "Beast",
        "artist": "Howard Lyon",
        "health": 1,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Hunter Level 53.",
        "fr": {
            "name": "Sanglier brocheroc"
        },
        "flavor": "This card is boaring.",
        "attack": 1,
        "faction": "Neutral",
        "name": "Stonetusk Boar",
        "id": "CS2_171",
        "text": "<b>Charge</b>",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_150.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "artist": "Kev Walker",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Paladin Level 51.",
        "fr": {
            "name": "Commando foudrepique"
        },
        "flavor": "The Stormpike Commandos are demolition experts.  They also bake a mean cupcake.",
        "attack": 4,
        "faction": "Alliance",
        "name": "Stormpike Commando",
        "id": "CS2_150",
        "text": "<b>Battlecry:</b> Deal 2 damage.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_222.png",
        "cost": 7,
        "collectible": true,
        "set": "Basic",
        "artist": "Doug Alexander",
        "health": 6,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Paladin Level 59.",
        "fr": {
            "name": "Champion de Hurlevent"
        },
        "flavor": "When Deathwing assaulted the capital, this soldier was the only member of his squad to survive. Now he's all bitter and stuff.",
        "attack": 6,
        "faction": "Alliance",
        "name": "Stormwind Champion",
        "id": "CS2_222",
        "text": "Your other minions have +1/+1.",
        "inPlayText": "For the Alliance!",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_131.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Ladronn",
        "health": 5,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Paladin Level 55.",
        "fr": {
            "name": "Chevalier de Hurlevent"
        },
        "flavor": "They're still embarassed about \"The Deathwing Incident\".",
        "attack": 2,
        "faction": "Alliance",
        "name": "Stormwind Knight",
        "id": "CS2_131",
        "text": "<b>Charge</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_306.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "race": "Demon",
        "artist": "Matt Dixon",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 40.",
        "fr": {
            "name": "Succube"
        },
        "flavor": "Warlocks have it pretty good.",
        "playerClass": "Warlock",
        "attack": 4,
        "faction": "Neutral",
        "name": "Succubus",
        "howToGet": "Unlocked at Level 1.",
        "id": "EX1_306",
        "text": "<b>Battlecry:</b> Discard a random card.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_012.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Sean O’Daniels",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 47.",
        "fr": {
            "name": "Balayage"
        },
        "flavor": "When a bear rears back and extends his arms, he's about to Swipe!  ... or hug.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Swipe",
        "howToGet": "Unlocked at Level 8.",
        "id": "CS2_012",
        "text": "Deal $4 damage to an enemy and $1 damage to all other enemies.",
        "rarity": "Common"
    },
    {
        "cardImage": "GAME_005.png",
        "set": "Basic",
        "name": "The Coin",
        "id": "GAME_005",
        "text": "Gain 1 Mana Crystal this turn only.",
        "type": "Spell",
        "fr": {
            "name": "La pièce"
        }
    },
    {
        "set": "Basic",
        "name": "The Coin",
        "id": "GAME_005e",
        "type": "Enchantment",
        "fr": {
            "name": "La pièce"
        }
    },
    {
        "cardImage": "HERO_02.png",
        "playerClass": "Shaman",
        "collectible": true,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Thrall",
        "health": 30,
        "id": "HERO_02",
        "type": "Hero",
        "fr": {
            "name": "Thrall"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "DS1_175.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "race": "Beast",
        "artist": "Malcolm Davis",
        "health": 1,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 23.",
        "fr": {
            "name": "Loup des bois"
        },
        "flavor": "Other beasts totally dig hanging out with timber wolves.",
        "playerClass": "Hunter",
        "attack": 1,
        "faction": "Neutral",
        "name": "Timber Wolf",
        "howToGet": "Unlocked at Level 1.",
        "id": "DS1_175",
        "text": "Your other Beasts have +1 Attack.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_049.png",
        "playerClass": "Shaman",
        "cost": 2,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Totemic Call",
        "id": "CS2_049",
        "text": "<b>Hero Power</b>\nSummon a random Totem.",
        "type": "Hero Power",
        "fr": {
            "name": "Appel totémique"
        },
        "rarity": "Free"
    },
    {
        "playerClass": "Shaman",
        "set": "Basic",
        "name": "Totemic Might",
        "id": "EX1_244e",
        "text": "+2 Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance totémique"
        }
    },
    {
        "cardImage": "EX1_244.png",
        "cost": 0,
        "collectible": true,
        "set": "Basic",
        "artist": "Trent Kaniuga",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 28.",
        "fr": {
            "name": "Puissance totémique"
        },
        "flavor": "Totem-stomping is no longer recommended.",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Totemic Might",
        "howToGet": "Unlocked at Level 6.",
        "id": "EX1_244",
        "text": "Give your Totems +2 Health.",
        "rarity": "Common"
    },
    {
        "cardImage": "DS1_184.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Mauro Cascioli",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 15.",
        "fr": {
            "name": "Pistage"
        },
        "flavor": "For the person who just cannot decide what card to put into a deck!",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Tracking",
        "howToGet": "Unlocked at Level 1.",
        "id": "DS1_184",
        "text": "Look at the top three cards of your deck. Draw one and discard the others.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_097.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Ryan Sook",
        "durability": 2,
        "type": "Weapon",
        "howToGetGold": "Unlocked at Level 40.",
        "fr": {
            "name": "Championne en vrai-argent"
        },
        "flavor": "It Slices, it Dices. You can cut a tin can with it. (But you wouldn't want to.)",
        "playerClass": "Paladin",
        "attack": 4,
        "faction": "Neutral",
        "name": "Truesilver Champion",
        "howToGet": "Unlocked at Level 2.",
        "id": "CS2_097",
        "text": "Whenever your hero attacks, restore 2 Health to it.",
        "rarity": "Common"
    },
    {
        "cardImage": "DS1_178.png",
        "cost": 5,
        "collectible": true,
        "set": "Basic",
        "race": "Beast",
        "artist": "Lars Grant-West",
        "health": 5,
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 43.",
        "fr": {
            "name": "Rhino de la toundra"
        },
        "flavor": "Tundra rhinos are often mistaken for kodos.  Or am I mistaken?",
        "playerClass": "Hunter",
        "attack": 2,
        "faction": "Neutral",
        "name": "Tundra Rhino",
        "howToGet": "Unlocked at Level 8.",
        "id": "DS1_178",
        "text": "Your Beasts have <b>Charge</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "HERO_04.png",
        "playerClass": "Paladin",
        "collectible": true,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Uther Lightbringer",
        "health": 30,
        "id": "HERO_04",
        "type": "Hero",
        "fr": {
            "name": "Uther le Porteur de Lumière"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "HERO_03.png",
        "playerClass": "Rogue",
        "collectible": true,
        "set": "Basic",
        "faction": "Neutral",
        "name": "Valeera Sanguinar",
        "health": 30,
        "id": "HERO_03",
        "type": "Hero",
        "fr": {
            "name": "Valeera Sanguinar"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "NEW1_004.png",
        "cost": 6,
        "collectible": true,
        "set": "Basic",
        "artist": "Sean O’Daniels",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 23.",
        "fr": {
            "name": "Disparition"
        },
        "playerClass": "Rogue",
        "name": "Vanish",
        "howToGet": "Unlocked at Level 8.",
        "id": "NEW1_004",
        "text": "Return all minions to their owner's hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_065.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "race": "Demon",
        "artist": "Alex Horley Orlandelli",
        "health": 3,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 36.",
        "fr": {
            "name": "Marcheur du Vide"
        },
        "flavor": "No relation to \"The Voidsteppers\", the popular Void-based dance troupe.",
        "playerClass": "Warlock",
        "attack": 1,
        "faction": "Neutral",
        "name": "Voidwalker",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_065",
        "text": "<b>Taunt</b>",
        "rarity": "Free"
    },
    {
        "cardImage": "EX1_011.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Karl Richardson",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Rogue Level 55.",
        "fr": {
            "name": "Docteur vaudou"
        },
        "flavor": "Voodoo is an oft-misunderstood art. But it <i>is</i> art.",
        "attack": 2,
        "faction": "Horde",
        "name": "Voodoo Doctor",
        "id": "EX1_011",
        "text": "<b>Battlecry:</b> Restore 2 Health.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_186.png",
        "cost": 7,
        "collectible": true,
        "set": "Basic",
        "artist": "Dave Kendall",
        "health": 7,
        "type": "Minion",
        "howToGetGold": "Unlocked at Rogue Level 51.",
        "fr": {
            "name": "Golem de guerre"
        },
        "flavor": "Golems are not afraid, but for some reason they still run when you cast Fear on them.  Instinct, maybe?  A desire to blend in?",
        "attack": 7,
        "faction": "Neutral",
        "name": "War Golem",
        "id": "CS2_186",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_084.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Wei Wang",
        "health": 3,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 36.",
        "fr": {
            "name": "Officier chanteguerre"
        },
        "flavor": "The Warsong clan is <i>such drama</i>. It's really not worth it to become a commander.",
        "playerClass": "Warrior",
        "attack": 2,
        "faction": "Neutral",
        "name": "Warsong Commander",
        "howToGet": "Unlocked at Level 1.",
        "id": "EX1_084",
        "text": "Your <b>Charge</b> minions have +1 Attack.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_033.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "John Avon",
        "health": 6,
        "mechanics": [
            "Freeze"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 49.",
        "fr": {
            "name": "Élémentaire d’eau"
        },
        "flavor": "Don't summon a water elemental at a party.  It'll dampen the mood.",
        "playerClass": "Mage",
        "attack": 3,
        "faction": "Neutral",
        "name": "Water Elemental",
        "howToGet": "Unlocked at Level 8.",
        "id": "CS2_033",
        "text": "<b>Freeze</b> any character damaged by this minion.",
        "inPlayText": "Frostbolt",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_400.png",
        "cost": 1,
        "collectible": true,
        "set": "Basic",
        "artist": "Jonboy Meyers",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 32.",
        "fr": {
            "name": "Tourbillon"
        },
        "flavor": "The way to tell seasoned warriors from novice ones: the novices yell \"wheeeee\" while whirlwinding.",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Whirlwind",
        "howToGet": "Unlocked at Level 6.",
        "id": "EX1_400",
        "text": "Deal $1 damage to ALL minions.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_082.png",
        "playerClass": "Rogue",
        "cost": 1,
        "set": "Basic",
        "attack": 1,
        "faction": "Neutral",
        "durability": 2,
        "name": "Wicked Knife",
        "id": "CS2_082",
        "type": "Weapon",
        "fr": {
            "name": "Lame pernicieuse"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_013.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "James Ryman",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 23.",
        "fr": {
            "name": "Croissance sauvage"
        },
        "flavor": "Grow your own mana crystals with this Mana Crystal Growth Kit, only 39.99!",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Wild Growth",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_013",
        "text": "Gain an empty Mana Crystal.",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_039.png",
        "cost": 2,
        "collectible": true,
        "set": "Basic",
        "artist": "Justin Sweet",
        "type": "Spell",
        "howToGetGold": "Unlocked at Level 23.",
        "fr": {
            "name": "Furie des vents"
        },
        "flavor": "Windfury is like Earthfury and Firefury, but more light and airy.",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Windfury",
        "howToGet": "Unlocked at Level 1.",
        "id": "CS2_039",
        "text": "Give a minion <b>Windfury</b>.",
        "rarity": "Free"
    },
    {
        "cardImage": "EX1_587.png",
        "cost": 4,
        "collectible": true,
        "set": "Basic",
        "artist": "Vance Kovacs",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Level 45.",
        "fr": {
            "name": "Parlevent"
        },
        "flavor": "Is there anything worse than a Windspeaker with halitosis?",
        "playerClass": "Shaman",
        "attack": 3,
        "faction": "Neutral",
        "name": "Windspeaker",
        "howToGet": "Unlocked at Level 8.",
        "id": "EX1_587",
        "text": "<b>Battlecry:</b> Give a friendly minion <b>Windfury</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_124.png",
        "cost": 3,
        "collectible": true,
        "set": "Basic",
        "artist": "Dany Orizio",
        "health": 1,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked at Warrior Level 59.",
        "fr": {
            "name": "Chevaucheur de loup"
        },
        "flavor": "Orcish raiders ride wolves because they are well adapted to harsh environments, and because they are soft and cuddly.",
        "attack": 3,
        "faction": "Horde",
        "name": "Wolfrider",
        "id": "CS2_124",
        "text": "<b>Charge</b>",
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_052.png",
        "cost": 1,
        "set": "Basic",
        "race": "Totem",
        "health": 2,
        "mechanics": [
            "Spellpower"
        ],
        "type": "Minion",
        "fr": {
            "name": "Totem de courroux de l’air"
        },
        "playerClass": "Shaman",
        "attack": 0,
        "faction": "Neutral",
        "name": "Wrath of Air Totem",
        "id": "CS2_052",
        "text": "<b>Spell Damage +1</b>",
        "rarity": "Free"
    },
    {
        "cardImage": "AT_063.png",
        "cost": 7,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Beast",
        "artist": "Andrew Hou",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Gueule-d’acide"
        },
        "flavor": "With the help of his trusty sidekick Dreadscale, the giant jormungar Acidmaw is ready to face any knight!",
        "playerClass": "Hunter",
        "elite": true,
        "attack": 4,
        "name": "Acidmaw",
        "id": "AT_063",
        "text": "Whenever another minion takes damage, destroy it.",
        "rarity": "Legendary"
    },
    {
        "playerClass": "Warrior",
        "set": "The Grand Tournament",
        "name": "Alexstrasza's Boon",
        "id": "AT_071e",
        "text": "+1 Attack and <b>Charge</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Aubaine d’Alexstrasza"
        }
    },
    {
        "cardImage": "AT_071.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Evgeniy Zagumennyy",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Championne d’Alexstrasza"
        },
        "flavor": "\"Put more spikes on her.  No, more spikes.  What part of 'more spikes' do you not understand?  MORE SPIKES!\" - Alexstrasza",
        "playerClass": "Warrior",
        "attack": 2,
        "name": "Alexstrasza's Champion",
        "id": "AT_071",
        "text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1 Attack and <b>Charge</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_035t.png",
        "playerClass": "Rogue",
        "cost": 0,
        "set": "The Grand Tournament",
        "name": "Ambush!",
        "id": "AT_035t",
        "text": "When you draw this, summon a 4/4 Nerubian for your opponent. Draw a card.",
        "type": "Spell",
        "fr": {
            "name": "Embuscade !"
        }
    },
    {
        "cardImage": "AT_053.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Zoltan & Gabor",
        "mechanics": [
            "Overload"
        ],
        "type": "Spell",
        "fr": {
            "name": "Savoir ancestral"
        },
        "flavor": "MOMMMMMYYYYYYYYY!!!",
        "playerClass": "Shaman",
        "name": "Ancestral Knowledge",
        "id": "AT_053",
        "text": "Draw 2 cards. <b>Overload: (2)</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_036.png",
        "cost": 9,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Eric Braddock",
        "health": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Anub’arak"
        },
        "flavor": "Was actually a pretty nice guy before, you know, the whole Lich King thing.",
        "playerClass": "Rogue",
        "elite": true,
        "attack": 8,
        "name": "Anub'arak",
        "id": "AT_036",
        "text": "<b>Deathrattle:</b> Return this to your hand and summon a 4/4 Nerubian.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_004.png",
        "cost": 1,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Gabor Szikszai",
        "type": "Spell",
        "fr": {
            "name": "Déflagration des Arcanes"
        },
        "flavor": "Now with 100% more blast!",
        "playerClass": "Mage",
        "name": "Arcane Blast",
        "id": "AT_004",
        "text": "Deal $2 damage to a minion. This spell gets double bonus from <b>Spell Damage</b>.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_087.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Evgeniy Zagumennyy",
        "health": 1,
        "mechanics": [
            "Charge",
            "Divine Shield"
        ],
        "type": "Minion",
        "fr": {
            "name": "Cavalier d’Argent"
        },
        "flavor": "His horse's name is Betsy.",
        "attack": 2,
        "name": "Argent Horserider",
        "id": "AT_087",
        "text": "<b>Charge</b>\n<b>Divine Shield</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_077.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Joe Wilson",
        "durability": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Weapon",
        "fr": {
            "name": "Lance d’Argent"
        },
        "flavor": "The stripes make it look like a candy cane, but we recommend against licking it.",
        "playerClass": "Paladin",
        "attack": 2,
        "name": "Argent Lance",
        "id": "AT_077",
        "text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, +1 Durability.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_109.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Ben Zhang",
        "health": 4,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Guetteur d’Argent"
        },
        "flavor": "Who argent watches the Argent Watchman?",
        "attack": 2,
        "name": "Argent Watchman",
        "id": "AT_109",
        "text": "Can't attack.\n<b>Inspire:</b> Can attack as normal this turn.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_108.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Beast",
        "artist": "Edouard Guiton & Tony Washington",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Cheval de guerre cuirassé"
        },
        "flavor": "Yep.  It's a horse... wearing armor... going to war.",
        "attack": 5,
        "name": "Armored Warhorse",
        "id": "AT_108",
        "text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, gain <b>Charge</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_043.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Christopher Moeller",
        "type": "Spell",
        "fr": {
            "name": "Communion astrale"
        },
        "flavor": "Hey!  Moon!  Can I have some mana crystals?",
        "playerClass": "Druid",
        "name": "Astral Communion",
        "id": "AT_043",
        "text": "Gain 10 Mana Crystals. Discard your hand.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_045.png",
        "cost": 9,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Velvet Engine",
        "health": 5,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Aviana"
        },
        "flavor": "Call her \"Tweety\".  She'll find it real funny.  I PROMISE.",
        "playerClass": "Druid",
        "elite": true,
        "attack": 5,
        "name": "Aviana",
        "id": "AT_045",
        "text": "Your minions cost (1).",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_062.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Skan Srisuwan",
        "type": "Spell",
        "fr": {
            "name": "Boule d’araignées"
        },
        "flavor": "\"THEY'RE EVERYWHERE GET THEM OFF!!!\" - Everyone",
        "playerClass": "Hunter",
        "name": "Ball of Spiders",
        "id": "AT_062",
        "text": "Summon three 1/1 Webspinners.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_132_HUNTER.png",
        "playerClass": "Hunter",
        "cost": 2,
        "set": "The Grand Tournament",
        "name": "Ballista Shot",
        "id": "AT_132_HUNTER",
        "text": "<b>Hero Power</b>\nDeal $3 damage to the enemy hero.",
        "type": "Hero Power",
        "fr": {
            "name": "Tir de baliste"
        }
    },
    {
        "cardImage": "AT_064.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Dany Orizio",
        "type": "Spell",
        "fr": {
            "name": "Sonner"
        },
        "flavor": "You might think bashing doesn't take a lot of practice.  It doesn't.",
        "playerClass": "Warrior",
        "name": "Bash",
        "id": "AT_064",
        "text": "Deal $3 damage.\nGain 3 Armor.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_060.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Richard Wright",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Piège à ours"
        },
        "flavor": "You'll never guess what's in that conveniently bear-sized, bear-smelling box.",
        "playerClass": "Hunter",
        "name": "Bear Trap",
        "id": "AT_060",
        "text": "<b>Secret:</b> After your hero is attacked, summon a 3/3 Bear with <b>Taunt</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_035.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Daren Bader",
        "type": "Spell",
        "fr": {
            "name": "Embusqué"
        },
        "flavor": "Can you hold these eggs for just a second?  I promise they're not full of giant enraged undead spider things.",
        "playerClass": "Rogue",
        "name": "Beneath the Grounds",
        "id": "AT_035",
        "text": "Shuffle 3 Ambushes into your opponent's deck. When drawn, you summon a 4/4 Nerubian.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_005t.png",
        "cost": 3,
        "set": "The Grand Tournament",
        "race": "Beast",
        "attack": 4,
        "name": "Boar",
        "health": 2,
        "mechanics": [
            "Charge"
        ],
        "id": "AT_005t",
        "text": "<b>Charge</b>",
        "type": "Minion",
        "fr": {
            "name": "Sanglier"
        }
    },
    {
        "cardImage": "AT_124.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Wayne Reynolds",
        "health": 9,
        "type": "Minion",
        "fr": {
            "name": "Bolf Bélier-Frondeur"
        },
        "flavor": "Bolf keeps coming in 2nd at the Grand Tournament.  It might be his year this year, if Lebron doesn't enter.",
        "elite": true,
        "attack": 3,
        "name": "Bolf Ramshield",
        "id": "AT_124",
        "text": "Whenever your hero takes damage, this minion takes it instead.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_068.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Mishi McCaig",
        "type": "Spell",
        "fr": {
            "name": "Renforcement"
        },
        "flavor": "The best offense is a good defense.",
        "playerClass": "Warrior",
        "name": "Bolster",
        "id": "AT_068",
        "text": "Give your <b>Taunt</b> minions +2/+2.",
        "rarity": "Common"
    },
    {
        "playerClass": "Warrior",
        "set": "The Grand Tournament",
        "name": "Bolstered",
        "id": "AT_068e",
        "text": "+2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Renforcé"
        }
    },
    {
        "cardImage": "AT_089.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Slawomir Maniak",
        "health": 2,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Lieutenant de la garde d’os"
        },
        "flavor": "Underneath all that impressive armor, he's just skin and bones.  Okay, maybe just bones.",
        "attack": 3,
        "name": "Boneguard Lieutenant",
        "id": "AT_089",
        "text": "<b>Inspire:</b> Gain +1 Health.",
        "rarity": "Common"
    },
    {
        "set": "The Grand Tournament",
        "name": "Boneguarded",
        "id": "AT_089e",
        "text": "Increased Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Garde d’os"
        }
    },
    {
        "cardImage": "AT_059.png",
        "cost": 1,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Eva Widermann",
        "health": 1,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Brave archère"
        },
        "flavor": "This is a \"bearly\" concealed reference.",
        "playerClass": "Hunter",
        "attack": 2,
        "name": "Brave Archer",
        "id": "AT_059",
        "text": "<b>Inspire:</b> If your hand is empty, deal 2 damage to the enemy hero.",
        "rarity": "Common"
    },
    {
        "playerClass": "Priest",
        "set": "The Grand Tournament",
        "name": "Bring it on!",
        "id": "AT_116e",
        "text": "+1 Attack and <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Venez vous battre !"
        }
    },
    {
        "cardImage": "AT_029.png",
        "cost": 1,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Pirate",
        "artist": "Matt Dixon",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "Boucanier"
        },
        "flavor": "The best part of buccaneering is the pants.",
        "playerClass": "Rogue",
        "attack": 2,
        "name": "Buccaneer",
        "id": "AT_029",
        "text": "Whenever you equip a weapon, give it +1 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_033.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Matt Dixon",
        "type": "Spell",
        "fr": {
            "name": "Larcin"
        },
        "flavor": "Yoink!",
        "playerClass": "Rogue",
        "name": "Burgle",
        "id": "AT_033",
        "text": "Add 2 random class cards to your hand <i>(from your opponent's class)</i>.",
        "rarity": "Rare"
    },
    {
        "set": "The Grand Tournament",
        "name": "Call of the Wild",
        "id": "AT_041e",
        "text": "Cost reduced.",
        "type": "Enchantment",
        "fr": {
            "name": "Appel des étendues sauvages"
        }
    },
    {
        "cardImage": "AT_102.png",
        "cost": 7,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Beast",
        "artist": "Gonzalo Ordonez",
        "health": 9,
        "type": "Minion",
        "fr": {
            "name": "Jormungar capturé"
        },
        "flavor": "You can keep him, but you have to promise to feed him and clean out his tank every day!",
        "attack": 5,
        "name": "Captured Jormungar",
        "id": "AT_102",
        "rarity": "Common"
    },
    {
        "set": "The Grand Tournament",
        "name": "Ceremony",
        "id": "AT_117e",
        "text": "+2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Cérémonie"
        }
    },
    {
        "cardImage": "AT_050.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Peet Cooper",
        "durability": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Weapon",
        "fr": {
            "name": "Marteau chargé"
        },
        "flavor": "You can only pick it up if you are worthy.",
        "playerClass": "Shaman",
        "attack": 2,
        "name": "Charged Hammer",
        "id": "AT_050",
        "text": "<b>Deathrattle:</b> Your Hero Power becomes 'Deal 2 damage.'",
        "rarity": "Epic"
    },
    {
        "set": "The Grand Tournament",
        "name": "Chi Lance",
        "id": "AT_028e",
        "text": "+3 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Lance de chi"
        }
    },
    {
        "cardImage": "AT_123.png",
        "cost": 7,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Dragon",
        "artist": "Raymond Swanland",
        "health": 6,
        "mechanics": [
            "Deathrattle",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Frissegueule"
        },
        "flavor": "Chillmaw keeps trying to ruin the Grand Tournament, and she would've done it too, if it weren't for those dang kids!",
        "elite": true,
        "attack": 6,
        "name": "Chillmaw",
        "id": "AT_123",
        "text": "<b>Taunt</b>\n<b>Deathrattle:</b> If you're holding a Dragon, deal 3 damage to all minions.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_096.png",
        "cost": 5,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Mech",
        "artist": "Skan Srisuwan",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chevalier mécanique"
        },
        "flavor": "It takes a lot to wind him up.",
        "attack": 5,
        "name": "Clockwork Knight",
        "id": "AT_096",
        "text": "<b>Battlecry:</b> Give a friendly Mech +1/+1.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_008.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Dragon",
        "artist": "Christopher Moeller",
        "health": 6,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Drake de Frimarra"
        },
        "flavor": "The Grand Tournament has a \"No dragons allowed\" policy, but it's rarely enforced.",
        "playerClass": "Mage",
        "attack": 6,
        "name": "Coldarra Drake",
        "id": "AT_008",
        "text": "You can use your Hero Power any number of times.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_110.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Dan Scott",
        "health": 5,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Régisseur du Colisée"
        },
        "flavor": "Meets monthly with the gladiators to discuss career goals.",
        "attack": 2,
        "name": "Coliseum Manager",
        "id": "AT_110",
        "text": "<b>Inspire:</b> Return this minion to your hand.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_073.png",
        "cost": 1,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Jim Nelson",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Esprit combatif"
        },
        "flavor": "Competition can be an inspiration to improve oneself.  Or kill all the competitors.",
        "playerClass": "Paladin",
        "name": "Competitive Spirit",
        "id": "AT_073",
        "text": "<b>Secret:</b> When your turn starts, give your minions +1/+1.",
        "rarity": "Rare"
    },
    {
        "set": "The Grand Tournament",
        "name": "Competitive Spirit",
        "id": "AT_073e",
        "text": "+1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Esprit combatif"
        }
    },
    {
        "cardImage": "AT_018.png",
        "cost": 7,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Chris Rahn",
        "health": 4,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Confesseur d’argent Paletress"
        },
        "flavor": "She sees into your past and makes you face your fears.  Most common fear:  Getting Majordomo out of Sneed's Old Shredder.",
        "playerClass": "Priest",
        "elite": true,
        "attack": 5,
        "name": "Confessor Paletress",
        "id": "AT_018",
        "text": "<b>Inspire:</b> Summon a random <b>Legendary</b> minion.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_016.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Sean O'Danield",
        "type": "Spell",
        "fr": {
            "name": "Confusion"
        },
        "flavor": "This minion is really powerful!",
        "playerClass": "Priest",
        "name": "Confuse",
        "id": "AT_016",
        "text": "Swap the Attack and Health of all minions.",
        "rarity": "Epic"
    },
    {
        "playerClass": "Priest",
        "set": "The Grand Tournament",
        "name": "Confused",
        "id": "AT_016e",
        "text": "Swapped Attack and Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Confus"
        }
    },
    {
        "cardImage": "AT_015.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Dan Dos Santos",
        "type": "Spell",
        "fr": {
            "name": "Convertir"
        },
        "flavor": "\"Are you interested in... HEALTH benefits?!\"",
        "playerClass": "Priest",
        "name": "Convert",
        "id": "AT_015",
        "text": "Put a copy of an enemy minion into your hand.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_121.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Jakub Kasper",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Favori de la foule"
        },
        "flavor": "The crowd ALWAYS yells lethal.",
        "attack": 4,
        "name": "Crowd Favorite",
        "id": "AT_121",
        "text": "Whenever you play a card with <b>Battlecry</b>, gain +1/+1.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_031.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Alex Horley Orlandelli",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Vide-gousset"
        },
        "flavor": "He has a giant collection of purses now.  One for every outfit!",
        "playerClass": "Rogue",
        "attack": 2,
        "name": "Cutpurse",
        "id": "AT_031",
        "text": "Whenever this minion attacks a hero, add the Coin to your hand.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_006.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Dan Scott",
        "health": 5,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Aspirant de Dalaran"
        },
        "flavor": "Is he aspiring or inspiring?  Make up your mind!",
        "playerClass": "Mage",
        "attack": 3,
        "name": "Dalaran Aspirant",
        "id": "AT_006",
        "text": "<b>Inspire:</b> Gain <b>Spell Damage +1</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_025.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Paul Mafayon",
        "type": "Spell",
        "fr": {
            "name": "Sombre marché"
        },
        "flavor": "A prime example of lose-lose negotiating.",
        "playerClass": "Warlock",
        "name": "Dark Bargain",
        "id": "AT_025",
        "text": "Destroy 2 random enemy minions. Discard 2 random cards.",
        "rarity": "Epic"
    },
    {
        "set": "The Grand Tournament",
        "name": "Dark Fusion",
        "id": "AT_024e",
        "text": "+3/+3.",
        "type": "Enchantment",
        "fr": {
            "name": "Sombre fusion"
        }
    },
    {
        "cardImage": "AT_038.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Laurel Austin",
        "health": 3,
        "mechanics": [
            "Battlecry",
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Aspirante de Darnassus"
        },
        "flavor": "She loves mana crystals, she hates mana crystals.   So fickle!",
        "playerClass": "Druid",
        "attack": 2,
        "name": "Darnassus Aspirant",
        "id": "AT_038",
        "text": "<b>Battlecry:</b> Gain an empty Mana Crystal.\n<b>Deathrattle:</b> Lose a Mana Crystal.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_024.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Kevin Chen",
        "type": "Spell",
        "fr": {
            "name": "Fusion démoniaque"
        },
        "flavor": "Very dangerous when attached to a demonbomb.",
        "playerClass": "Warlock",
        "name": "Demonfuse",
        "id": "AT_024",
        "text": "Give a Demon +3/+3. Give your opponent a Mana Crystal.",
        "rarity": "Common"
    },
    {
        "playerClass": "Druid",
        "set": "The Grand Tournament",
        "name": "Dire Claws",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "AT_132_DRUIDe",
        "text": "+2 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Griffes sinistres"
        }
    },
    {
        "cardImage": "AT_132_DRUID.png",
        "playerClass": "Druid",
        "cost": 2,
        "set": "The Grand Tournament",
        "name": "Dire Shapeshift",
        "id": "AT_132_DRUID",
        "text": "<b>Hero Power</b>\nGain 2 Armor and +2 Attack this turn.",
        "type": "Hero Power",
        "fr": {
            "name": "Changeforme sinistre"
        }
    },
    {
        "cardImage": "AT_047.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "RK Post",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Grave-totem draeneï"
        },
        "flavor": "It's nice to find a real craftsman in this day and age of mass-produced totems.",
        "playerClass": "Shaman",
        "attack": 4,
        "name": "Draenei Totemcarver",
        "id": "AT_047",
        "text": "<b>Battlecry:</b> Gain +1/+1 for each friendly Totem.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_083.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Anton Zemskov",
        "health": 3,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chevaucheur de faucon-dragon"
        },
        "flavor": "Check it out.  You can do barrel rolls on this thing.",
        "attack": 3,
        "name": "Dragonhawk Rider",
        "id": "AT_083",
        "text": "<b>Inspire:</b> Gain <b>Windfury</b>\nthis turn.",
        "rarity": "Common"
    },
    {
        "set": "The Grand Tournament",
        "name": "Dragonhawkery",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "AT_083e",
        "text": "<b>Windfury</b> this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Volerie de faucons-dragons"
        }
    },
    {
        "cardImage": "AT_063t.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Beast",
        "artist": "Zoltan Boros",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Écaille-d’effroi"
        },
        "flavor": "Let's be clear about this:  ACIDMAW is the sidekick.",
        "playerClass": "Hunter",
        "elite": true,
        "attack": 4,
        "name": "Dreadscale",
        "id": "AT_063t",
        "text": "At the end of your turn, deal 1 damage to all other minions.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_019.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Demon",
        "artist": "Alex Horley Orlandelli",
        "health": 1,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Destrier de l’effroi"
        },
        "flavor": "Crescendo himself summoned this steed, riding it to victory in the Grand Tournament.  Wherever he rides, an army of riders ride behind him, supporting the legendary champion.",
        "playerClass": "Warlock",
        "attack": 1,
        "name": "Dreadsteed",
        "id": "AT_019",
        "text": "<b>Deathrattle:</b> Summon a Dreadsteed.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_042.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Arthur Gimaldinov",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "Druidesse du Sabre"
        },
        "flavor": "That's saberTEETH, not like curved pirate blades.  That's a different kind of druid.  Druid of the Curved Pirate Blades.",
        "playerClass": "Druid",
        "attack": 2,
        "name": "Druid of the Saber",
        "id": "AT_042",
        "text": "<b>Choose One -</b> Transform to gain <b>Charge</b>; or +1/+1 and <b>Stealth</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_081.png",
        "cost": 7,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "James Ryman",
        "health": 7,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Eadric le Pur"
        },
        "flavor": "Nobody rocks a monocle like Eadric.",
        "playerClass": "Paladin",
        "elite": true,
        "attack": 3,
        "name": "Eadric the Pure",
        "id": "AT_081",
        "text": "<b>Battlecry:</b> Change all enemy minions'\nAttack to 1.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_002.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Tooth",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Effigie"
        },
        "flavor": "Burning man, brah.",
        "playerClass": "Mage",
        "name": "Effigy",
        "id": "AT_002",
        "text": "<b>Secret:</b> When a friendly minion dies, summon a random minion with the same Cost.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_051.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Tyler Walpole",
        "mechanics": [
            "Overload"
        ],
        "type": "Spell",
        "fr": {
            "name": "Destruction élémentaire"
        },
        "flavor": "I'm not a shaman or anything, but isn't Elemental Destruction the opposite of what they want to do?",
        "playerClass": "Shaman",
        "name": "Elemental Destruction",
        "id": "AT_051",
        "text": "Deal $4-$5 damage to all minions. <b>Overload: (5)</b>",
        "rarity": "Epic"
    },
    {
        "set": "The Grand Tournament",
        "name": "Empowering Mist",
        "id": "AT_045e",
        "text": "+1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Brume surpuissante"
        }
    },
    {
        "cardImage": "AT_078.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Mauricio Herrera",
        "type": "Spell",
        "fr": {
            "name": "Entrée dans le Colisée"
        },
        "flavor": "You have to get past the vendors first.  So many are lost to shopping...",
        "playerClass": "Paladin",
        "name": "Enter the Coliseum",
        "id": "AT_078",
        "text": "Destroy all minions except each player's highest Attack minion.",
        "rarity": "Epic"
    },
    {
        "set": "The Grand Tournament",
        "name": "Equipped",
        "id": "AT_084e",
        "text": "+2 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Équipé"
        }
    },
    {
        "cardImage": "AT_114.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Dan Scott",
        "health": 4,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Provocateur maléfique"
        },
        "flavor": "To be honest, heckling is not the most effective form of evil.",
        "attack": 5,
        "name": "Evil Heckler",
        "id": "AT_114",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "playerClass": "Shaman",
        "set": "The Grand Tournament",
        "name": "Experienced",
        "id": "AT_047e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Expérimenté"
        }
    },
    {
        "set": "The Grand Tournament",
        "name": "Extra Poke",
        "id": "AT_077e",
        "text": "+1 Durability.",
        "type": "Enchantment",
        "fr": {
            "name": "Pique supplémentaire"
        }
    },
    {
        "set": "The Grand Tournament",
        "name": "Extra Stabby",
        "id": "AT_029e",
        "text": "+1 Attack",
        "type": "Enchantment",
        "fr": {
            "name": "Lame effilée"
        }
    },
    {
        "cardImage": "AT_131.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Ben Thompson",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Eydis Plaie-sombre"
        },
        "flavor": "HATES being called \"the wonder twins\".",
        "elite": true,
        "attack": 3,
        "name": "Eydis Darkbane",
        "id": "AT_131",
        "text": "Whenever <b>you</b> target this minion with a spell, deal 3 damage to a random enemy.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_003.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Arthur Bozonnet",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Héros défunt"
        },
        "flavor": "And he can't get up.",
        "playerClass": "Mage",
        "attack": 3,
        "name": "Fallen Hero",
        "id": "AT_003",
        "text": "Your Hero Power deals 1 extra damage.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_020.png",
        "cost": 7,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Demon",
        "artist": "Anton Zemskov",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Garde funeste effroyable"
        },
        "flavor": "They were originally called Cuddleguards, but they were not inspiring the proper amount of fear.",
        "playerClass": "Warlock",
        "attack": 6,
        "name": "Fearsome Doomguard",
        "id": "AT_020",
        "rarity": "Common"
    },
    {
        "playerClass": "Warlock",
        "set": "The Grand Tournament",
        "name": "Felrage",
        "id": "AT_021e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Gangrerage"
        }
    },
    {
        "cardImage": "AT_115.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Howard Lyon",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Maître d’escrime"
        },
        "flavor": "Good fencers make good neighbors, right?",
        "attack": 2,
        "name": "Fencing Coach",
        "id": "AT_115",
        "text": "<b>Battlecry:</b> The next time you use your Hero Power, it costs (2) less.",
        "rarity": "Rare"
    },
    {
        "set": "The Grand Tournament",
        "name": "Fencing Practice",
        "id": "AT_115e",
        "text": "Your Hero Power costs (2) less.",
        "type": "Enchantment",
        "fr": {
            "name": "Entraînement à l’escrime"
        }
    },
    {
        "cardImage": "AT_132_MAGE.png",
        "playerClass": "Mage",
        "cost": 2,
        "set": "The Grand Tournament",
        "name": "Fireblast Rank 2",
        "id": "AT_132_MAGE",
        "text": "<b>Hero Power</b>\nDeal $2 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Explosion de feu rang 2"
        }
    },
    {
        "cardImage": "AT_022.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Matt Dixon",
        "type": "Spell",
        "fr": {
            "name": "Poing de Jaraxxus"
        },
        "flavor": "* Not actually Jaraxxus' fist.",
        "playerClass": "Warlock",
        "name": "Fist of Jaraxxus",
        "id": "AT_022",
        "text": "When you play or discard this, deal $4 damage to a random enemy.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_129.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Mark Zug",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Fjola Plaie-lumineuse"
        },
        "flavor": "LOVES being called \"the wonder twins\".",
        "elite": true,
        "attack": 3,
        "name": "Fjola Lightbane",
        "id": "AT_129",
        "text": "Whenever <b>you</b> target this minion with a spell, gain <b>Divine Shield.</b>",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_094.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "James Zhang",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Jongleur de flammes"
        },
        "flavor": "At first he liked juggling chain saws, but then he thought, \"Flames are better!  Because FIRE!\"",
        "attack": 2,
        "name": "Flame Juggler",
        "id": "AT_094",
        "text": "<b>Battlecry:</b> Deal 1 damage to a random enemy.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_001.png",
        "cost": 5,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Nutthapon Petchthai",
        "type": "Spell",
        "fr": {
            "name": "Lance de flammes"
        },
        "flavor": "It's on the rack next to ice lance, acid lance, and English muffin lance.",
        "playerClass": "Mage",
        "name": "Flame Lance",
        "id": "AT_001",
        "text": "Deal $8 damage to a minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_055.png",
        "cost": 1,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Marcelo Vignali",
        "type": "Spell",
        "fr": {
            "name": "Soins rapides"
        },
        "flavor": "Flash!  Ahhhhhhh~",
        "playerClass": "Priest",
        "name": "Flash Heal",
        "id": "AT_055",
        "text": "Restore #5 Health.",
        "rarity": "Common"
    },
    {
        "playerClass": "Warrior",
        "set": "The Grand Tournament",
        "name": "Forges of Orgrimmar",
        "id": "AT_066e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Forges d’Orgrimmar"
        }
    },
    {
        "cardImage": "AT_093.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Matt Dixon",
        "health": 6,
        "mechanics": [
            "Spellpower"
        ],
        "type": "Minion",
        "fr": {
            "name": "Frigbold algide"
        },
        "flavor": "Ironically, the natural enemy of the snobold is THE CANDLE.",
        "attack": 2,
        "name": "Frigid Snobold",
        "id": "AT_093",
        "text": "<b>Spell Damage +1</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_120.png",
        "cost": 10,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Greg Staples",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Géant du givre"
        },
        "flavor": "Don't ask him about the beard.  JUST DON'T.",
        "attack": 8,
        "name": "Frost Giant",
        "id": "AT_120",
        "text": "Costs (1) less for each time you used your Hero Power this game.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_133.png",
        "cost": 1,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Skan Srisuwan",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Jouteuse de Gadgetzan"
        },
        "flavor": "It's not HER fault you didn't put a spinning saw blade on your horse.",
        "attack": 1,
        "name": "Gadgetzan Jouster",
        "id": "AT_133",
        "text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, gain +1/+1.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_080.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Jesper Ejsing",
        "health": 3,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Commandant du fief"
        },
        "flavor": "He'll never admit it, but he pushes you hard because he really cares about you.",
        "attack": 2,
        "name": "Garrison Commander",
        "id": "AT_080",
        "text": "You can use your Hero Power twice a turn.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_122.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Nutthapon Petchthai",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Gormok l’Empaleur"
        },
        "flavor": "Gormok has been giving impaling lessons in a small tent near the tournament grounds.  For only 25g you too could learn the fine art of impaling!",
        "elite": true,
        "attack": 4,
        "name": "Gormok the Impaler",
        "id": "AT_122",
        "text": "<b>Battlecry:</b> If you have at least 4 other minions, deal 4 damage.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_118.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Todd Lockwood",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Grande croisée"
        },
        "flavor": "A veteran of a number of crusades, she is a force for light and goodness.  Her latest crusade is against goblin telemarketers.",
        "attack": 5,
        "name": "Grand Crusader",
        "id": "AT_118",
        "text": "<b>Battlecry:</b> Add a random Paladin card to your hand.",
        "rarity": "Epic"
    },
    {
        "playerClass": "Hunter",
        "set": "The Grand Tournament",
        "name": "Groomed",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "AT_057o",
        "text": "<b>Immune</b> this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Étrillé"
        }
    },
    {
        "cardImage": "AT_132_PRIEST.png",
        "playerClass": "Priest",
        "cost": 2,
        "set": "The Grand Tournament",
        "name": "Heal",
        "id": "AT_132_PRIEST",
        "text": "<b>Hero Power</b>\nRestore #4 Health.",
        "type": "Hero Power",
        "fr": {
            "name": "Soins"
        }
    },
    {
        "cardImage": "AT_132_SHAMANa.png",
        "playerClass": "Shaman",
        "cost": 0,
        "set": "The Grand Tournament",
        "attack": 0,
        "name": "Healing Totem",
        "health": 2,
        "id": "AT_132_SHAMANa",
        "text": "At the end of your turn, restore 1 Health to all friendly minions.",
        "type": "Minion",
        "fr": {
            "name": "Totem de soins"
        }
    },
    {
        "cardImage": "AT_048.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Luca Zontini",
        "type": "Spell",
        "fr": {
            "name": "Vague de soins"
        },
        "flavor": "Favored by shaman who study the art of restoration and healing, this spell would feel smug, if it had feelings.",
        "playerClass": "Shaman",
        "name": "Healing Wave",
        "id": "AT_048",
        "text": "Restore #7 Health. Reveal a minion in each deck. If yours costs more, Restore #14 instead.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_011.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Alex Garner",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Championne sacrée"
        },
        "flavor": "She really likes seeing people get better.  That's why she hurts them in the first place.",
        "playerClass": "Priest",
        "attack": 3,
        "name": "Holy Champion",
        "id": "AT_011",
        "text": "Whenever a character is healed, gain +2 Attack.",
        "rarity": "Common"
    },
    {
        "set": "The Grand Tournament",
        "name": "Huge Ego",
        "id": "AT_121e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Ego énorme"
        }
    },
    {
        "cardImage": "AT_092.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Anton Zemskov",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Enragé de glace"
        },
        "flavor": "He's a lot cooler than Magma Rager.",
        "attack": 5,
        "name": "Ice Rager",
        "id": "AT_092",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_125.png",
        "cost": 9,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "John Polidora",
        "health": 10,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "Glace-Hurlante"
        },
        "flavor": "This massive yeti just closes his eyes and charges at the nearest target.  The nearest Target is a couple blocks away and has sick deals on skateboards.",
        "elite": true,
        "attack": 10,
        "name": "Icehowl",
        "id": "AT_125",
        "text": "<b>Charge</b>\nCan't attack heroes.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_105.png",
        "cost": 1,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Zoltan Boros",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Kvaldir blessé"
        },
        "flavor": "Don't worry.  With a little skin cream he's going to clear right up.",
        "attack": 2,
        "name": "Injured Kvaldir",
        "id": "AT_105",
        "text": "<b>Battlecry:</b> Deal 3 damage to this minion.",
        "rarity": "Rare"
    },
    {
        "set": "The Grand Tournament",
        "name": "Inspired",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "AT_109e",
        "text": "Can attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Exalté"
        }
    },
    {
        "set": "The Grand Tournament",
        "name": "Inspired",
        "id": "AT_119e",
        "text": "Increased Stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Exalté"
        }
    },
    {
        "cardImage": "AT_132.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Jomaro Kindred",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Justicière Cœur-Vrai"
        },
        "flavor": "It's like putting racing stripes and a giant spoiler on your hero power.",
        "elite": true,
        "attack": 6,
        "name": "Justicar Trueheart",
        "id": "AT_132",
        "text": "<b>Battlecry:</b> Replace your starting Hero Power with a better one.",
        "rarity": "Legendary"
    },
    {
        "playerClass": "Druid",
        "set": "The Grand Tournament",
        "name": "Kindred Spirit",
        "id": "AT_040e",
        "text": "+3 Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Âme sœur"
        }
    },
    {
        "set": "The Grand Tournament",
        "name": "King's Defender",
        "id": "AT_065e",
        "text": "+1 Durability.",
        "type": "Enchantment",
        "fr": {
            "name": "Défenseur du roi"
        }
    },
    {
        "cardImage": "AT_065.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Michael Franchina",
        "durability": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Weapon",
        "fr": {
            "name": "Défenseur du roi"
        },
        "flavor": "\"King's Attacker\" is a shield.  Funny, huh?",
        "playerClass": "Warrior",
        "attack": 3,
        "name": "King's Defender",
        "id": "AT_065",
        "text": "<b>Battlecry</b>: If you have a minion with <b>Taunt</b>,  gain +1 Durability.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_058.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Beast",
        "artist": "James Zhang",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Elekk du roi"
        },
        "flavor": "Elekk jousting is AWESOME.",
        "playerClass": "Hunter",
        "attack": 3,
        "name": "King's Elekk",
        "id": "AT_058",
        "text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, draw it.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_041.png",
        "cost": 7,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Ralph Horsley",
        "health": 6,
        "type": "Minion",
        "fr": {
            "name": "Chevalier des étendues sauvages"
        },
        "flavor": "He gets a discount on the tournament entry fee because he is his own horse.",
        "playerClass": "Druid",
        "attack": 6,
        "name": "Knight of the Wild",
        "id": "AT_041",
        "text": "Whenever you summon a Beast, reduce the Cost of this card by (1).",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_099.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Ben Wootten",
        "health": 5,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chevaucheuse de kodo"
        },
        "flavor": "Someone called her a Rhinorider, and she's NOT HAPPY.",
        "attack": 3,
        "name": "Kodorider",
        "id": "AT_099",
        "text": "<b>Inspire:</b> Summon a 3/5 War Kodo.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_119.png",
        "cost": 5,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Trent Kaniuga",
        "health": 4,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Écumeur kvaldir"
        },
        "flavor": "Coming soon... to a tuskarr village near you!",
        "attack": 4,
        "name": "Kvaldir Raider",
        "id": "AT_119",
        "text": "<b>Inspire:</b> Gain +2/+2.",
        "rarity": "Common"
    },
    {
        "playerClass": "Rogue",
        "set": "The Grand Tournament",
        "name": "Laced",
        "id": "AT_034e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Enduit perfide"
        }
    },
    {
        "cardImage": "AT_084.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Tyson Murphy",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Porte-lance"
        },
        "flavor": "Lance Carrier is an obscure entry level position in orcish armies.  A mystery, since orcs don't generally use lances.",
        "attack": 1,
        "name": "Lance Carrier",
        "id": "AT_084",
        "text": "<b>Battlecry:</b> Give a friendly minion +2 Attack.",
        "rarity": "Common"
    },
    {
        "set": "The Grand Tournament",
        "name": "Light's Blessing",
        "mechanics": [
            "Aura"
        ],
        "id": "AT_011e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Bénédiction par la Lumière"
        }
    },
    {
        "cardImage": "AT_106.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Andrea Uderzo",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Champion de la Lumière"
        },
        "flavor": "When there's something strange (say, a gibbering demon) in your neighborhood, who are you going to call?",
        "attack": 4,
        "name": "Light's Champion",
        "id": "AT_106",
        "text": "<b>Battlecry:</b> <b>Silence</b> a Demon.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_050t.png",
        "playerClass": "Shaman",
        "cost": 2,
        "set": "The Grand Tournament",
        "name": "Lightning Jolt",
        "id": "AT_050t",
        "text": "<b>Hero Power</b>\nDeal $2 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Décharge de foudre"
        }
    },
    {
        "cardImage": "AT_042a.png",
        "playerClass": "Druid",
        "set": "The Grand Tournament",
        "name": "Lion Form",
        "id": "AT_042a",
        "text": "<b>Charge</b>",
        "type": "Spell",
        "fr": {
            "name": "Forme de lion"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "AT_037b.png",
        "set": "The Grand Tournament",
        "name": "Living Roots",
        "id": "AT_037b",
        "text": "Summon two 1/1 Saplings.",
        "type": "Spell",
        "fr": {
            "name": "Racines vivantes"
        }
    },
    {
        "cardImage": "AT_037a.png",
        "set": "The Grand Tournament",
        "name": "Living Roots",
        "id": "AT_037a",
        "text": "Deal $2 damage.",
        "type": "Spell",
        "fr": {
            "name": "Racines vivantes"
        }
    },
    {
        "cardImage": "AT_037.png",
        "cost": 1,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Dan Brereton",
        "type": "Spell",
        "fr": {
            "name": "Racines vivantes"
        },
        "flavor": "2 out of 2 saplings recommend that you summon the saplings.",
        "playerClass": "Druid",
        "name": "Living Roots",
        "id": "AT_037",
        "text": "<b>Choose One</b> - Deal $2 damage; or Summon two 1/1 Saplings.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_061.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Matt Dixon",
        "type": "Spell",
        "fr": {
            "name": "Prêt à tirer"
        },
        "flavor": "Rexxar narrowed his eyes, grabbed his machine gun, and said: \"It's go time.  Lock and load.\"\nThis card pays homage to that special moment.",
        "playerClass": "Hunter",
        "name": "Lock and Load",
        "id": "AT_061",
        "text": "Each time you cast a spell this turn, add a random Hunter card to your hand.",
        "rarity": "Epic"
    },
    {
        "playerClass": "Hunter",
        "set": "The Grand Tournament",
        "name": "Lock and Load",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "AT_061e",
        "type": "Enchantment",
        "fr": {
            "name": "Prêt à tirer"
        }
    },
    {
        "cardImage": "AT_082.png",
        "cost": 1,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Ron Spears",
        "health": 2,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Modeste écuyer"
        },
        "flavor": "But not the lowliest!",
        "attack": 1,
        "name": "Lowly Squire",
        "id": "AT_082",
        "text": "<b>Inspire:</b> Gain +1 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_067.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Alex Horley Orlandelli",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Magnataure alpha"
        },
        "flavor": "Playing him also gets you into the Magnataur Beta.",
        "playerClass": "Warrior",
        "attack": 5,
        "name": "Magnataur Alpha",
        "id": "AT_067",
        "text": "Also damages the minions next to whomever\nhe attacks.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_085.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Froilan Gardner",
        "health": 6,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Damoiselle du Lac"
        },
        "flavor": "Not a good basis for a system of government.",
        "attack": 2,
        "name": "Maiden of the Lake",
        "id": "AT_085",
        "text": "Your Hero Power costs (1).",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_112.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Penny Arcade",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Maître jouteur"
        },
        "flavor": "Needs just a few more ratings points to become Grandmaster Jouster.",
        "attack": 5,
        "name": "Master Jouster",
        "id": "AT_112",
        "text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, gain <b>Taunt</b> and <b>Divine Shield</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_117.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Jesper Ejsing",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Maîtresse de cérémonie"
        },
        "flavor": "Goes by \"MC ElfyElf\".",
        "attack": 4,
        "name": "Master of Ceremonies",
        "id": "AT_117",
        "text": "<b>Battlecry:</b> If you have a minion with <b>Spell Damage</b>, gain +2/+2.",
        "rarity": "Epic"
    },
    {
        "playerClass": "Warlock",
        "set": "The Grand Tournament",
        "name": "Master Summoner",
        "id": "AT_027e",
        "text": "Costs (0).",
        "type": "Enchantment",
        "fr": {
            "name": "Maître invocateur"
        }
    },
    {
        "playerClass": "Paladin",
        "set": "The Grand Tournament",
        "name": "Might of the Hostler",
        "id": "AT_075e",
        "text": "Warhorse Trainer is granting this minion +1 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance du valet d’écurie"
        }
    },
    {
        "set": "The Grand Tournament",
        "name": "Might of the Monkey",
        "id": "AT_090e",
        "text": "+1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance du singe"
        }
    },
    {
        "set": "The Grand Tournament",
        "name": "Mistcaller Deck Ench",
        "id": "AT_045ee",
        "type": "Enchantment",
        "fr": {
            "name": "Ench. de deck de mandebrume"
        }
    },
    {
        "cardImage": "AT_088.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Steve Prescott",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Champion de Mogor"
        },
        "flavor": "This champion has learned from the best.  Except for his target selection.",
        "attack": 8,
        "name": "Mogor's Champion",
        "id": "AT_088",
        "text": "50% chance to attack the wrong enemy.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_090.png",
        "cost": 5,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Beast",
        "artist": "Andrew Hou",
        "health": 3,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Champion de Mukla"
        },
        "flavor": "An elegant gorilla, for a more civilized age.",
        "attack": 4,
        "name": "Mukla's Champion",
        "id": "AT_090",
        "text": "<b>Inspire:</b> Give your other minions +1/+1.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_044.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Dan Scott",
        "type": "Spell",
        "fr": {
            "name": "Charpie"
        },
        "flavor": "Is this a noun or a verb?  We will never know.",
        "playerClass": "Druid",
        "name": "Mulch",
        "id": "AT_044",
        "text": "Destroy a minion.\nAdd a random minion to your opponent's hand.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_076.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Murloc",
        "artist": "Sam Nielson",
        "health": 4,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chevalier murloc"
        },
        "flavor": "Hee hee!  Look at his cute little feet.",
        "playerClass": "Paladin",
        "attack": 3,
        "name": "Murloc Knight",
        "id": "AT_076",
        "text": "<b>Inspire:</b> Summon a random Murloc.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_079.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Zoltan Boros",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Adversaire mystérieux"
        },
        "flavor": "He may sound surly and antisocial, but he's actually just really shy.",
        "playerClass": "Paladin",
        "attack": 6,
        "name": "Mysterious Challenger",
        "id": "AT_079",
        "text": "<b>Battlecry:</b> Put one of each <b>Secret</b> from your deck into the battlefield.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_036t.png",
        "playerClass": "Rogue",
        "cost": 3,
        "set": "The Grand Tournament",
        "attack": 4,
        "name": "Nerubian",
        "health": 4,
        "id": "AT_036t",
        "type": "Minion",
        "fr": {
            "name": "Nérubien"
        }
    },
    {
        "cardImage": "AT_127.png",
        "cost": 5,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Marcleo Vignali",
        "health": 5,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Champion du Nexus Saraad"
        },
        "flavor": "The ethereals have their own jousting tournament, and Saraad is the reigning champion.  Also he won the ethereal hot dog eating contest.",
        "elite": true,
        "attack": 4,
        "name": "Nexus-Champion Saraad",
        "id": "AT_127",
        "text": "<b>Inspire:</b> Add a random spell to your hand.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_103.png",
        "cost": 9,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Seamus Gallagher",
        "health": 7,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Kraken de la mer Boréale"
        },
        "flavor": "You have no idea how tired this guy is of being released.",
        "attack": 9,
        "name": "North Sea Kraken",
        "id": "AT_103",
        "text": "<b>Battlecry:</b> Deal 4 damage.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_066.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Hideaki Takamura",
        "health": 3,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Aspirant d’Orgrimmar"
        },
        "flavor": "\"Four out of three orcs struggle with math.\" - Angry Zurge",
        "playerClass": "Warrior",
        "attack": 3,
        "name": "Orgrimmar Aspirant",
        "id": "AT_066",
        "text": "<b>Inspire:</b> Give your weapon +1 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_042b.png",
        "playerClass": "Druid",
        "set": "The Grand Tournament",
        "name": "Panther Form",
        "id": "AT_042b",
        "text": "+1/+1 and <b>Stealth</b>",
        "type": "Spell",
        "fr": {
            "name": "Forme de panthère"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "AT_101.png",
        "cost": 5,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Alex Horley Orlandelli",
        "health": 6,
        "type": "Minion",
        "fr": {
            "name": "Combattante de la fosse"
        },
        "flavor": "What did the pits ever do to you?",
        "attack": 5,
        "name": "Pit Fighter",
        "id": "AT_101",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_034.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Nutthapon Petchthai",
        "durability": 3,
        "type": "Weapon",
        "fr": {
            "name": "Lame empoisonnée"
        },
        "flavor": "How much more poisoned can a blade get?  The answer is a lot.  A lot more poisoned.",
        "playerClass": "Rogue",
        "attack": 1,
        "name": "Poisoned Blade",
        "id": "AT_034",
        "text": "Your Hero Power gives this weapon +1 Attack instead of replacing it.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_132_ROGUEt.png",
        "playerClass": "Rogue",
        "cost": 1,
        "set": "The Grand Tournament",
        "attack": 2,
        "durability": 2,
        "name": "Poisoned Dagger",
        "id": "AT_132_ROGUEt",
        "type": "Weapon",
        "fr": {
            "name": "Dague empoisonnée"
        }
    },
    {
        "cardImage": "AT_132_ROGUE.png",
        "playerClass": "Rogue",
        "cost": 2,
        "set": "The Grand Tournament",
        "name": "Poisoned Daggers",
        "id": "AT_132_ROGUE",
        "text": "<b>Hero Power</b>\nEquip a 2/2 Weapon.",
        "type": "Hero Power",
        "fr": {
            "name": "Dagues empoisonnées"
        }
    },
    {
        "cardImage": "AT_005.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Mike Sass",
        "type": "Spell",
        "fr": {
            "name": "Métamorphose : sanglier"
        },
        "flavor": "It's always Huffer.",
        "playerClass": "Mage",
        "name": "Polymorph: Boar",
        "id": "AT_005",
        "text": "Transform a minion into a 4/2 Boar with <b>Charge</b>.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Mage",
        "set": "The Grand Tournament",
        "name": "Power of Dalaran",
        "id": "AT_006e",
        "text": "Increased Spell Damage.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance de Dalaran"
        }
    },
    {
        "playerClass": "Shaman",
        "set": "The Grand Tournament",
        "name": "Power of the Bluff",
        "id": "AT_049e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance des Pitons"
        }
    },
    {
        "set": "The Grand Tournament",
        "name": "Power Word: Glory",
        "id": "AT_013e",
        "text": "When this attacks, restore 4 Health to the hero of the player who buffed it.",
        "type": "Enchantment",
        "fr": {
            "name": "Mot de pouvoir : Gloire"
        }
    },
    {
        "cardImage": "AT_013.png",
        "cost": 1,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Mike Sass",
        "type": "Spell",
        "fr": {
            "name": "Mot de pouvoir : Gloire"
        },
        "flavor": "The promise of glory is a powerful tool to get minions to do your bidding.  Only slightly less powerful than the promise of an ice cream bar!",
        "playerClass": "Priest",
        "name": "Power Word: Glory",
        "id": "AT_013",
        "text": "Choose a minion. Whenever it attacks, restore 4 Health to\nyour hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_056.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Jonboy Meyers",
        "type": "Spell",
        "fr": {
            "name": "Tir puissant"
        },
        "flavor": "pow POW pow",
        "playerClass": "Hunter",
        "name": "Powershot",
        "id": "AT_056",
        "text": "Deal $2 damage to a minion and the minions next to it.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Paladin",
        "set": "The Grand Tournament",
        "name": "Purified",
        "id": "AT_081e",
        "text": "Attack changed to 1.",
        "type": "Enchantment",
        "fr": {
            "name": "Purifié"
        }
    },
    {
        "cardImage": "AT_010.png",
        "cost": 5,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Brandon Kitkouski",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Dompteur de béliers"
        },
        "flavor": "Not getting trampled is really the trick here.",
        "playerClass": "Hunter",
        "attack": 3,
        "name": "Ram Wrangler",
        "id": "AT_010",
        "text": "<b>Battlecry:</b> If you have a Beast, summon a\nrandom Beast.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_113.png",
        "cost": 5,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Jim Nelson",
        "health": 4,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Recruteur"
        },
        "flavor": "Join the Argent Crusade!  We have attractive tabards and you get to carry really nice swords!",
        "attack": 5,
        "name": "Recruiter",
        "id": "AT_113",
        "text": "<b>Inspire:</b> Add a 2/2 Squire to your hand.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_111.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Ron Spears",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Vendeur de rafraîchissements"
        },
        "flavor": "Menu:  Funnel cakes, carrots, popcorn, jormungar steaks.  It's hard serving a diverse clientele.",
        "attack": 3,
        "name": "Refreshment Vendor",
        "id": "AT_111",
        "text": "<b>Battlecry:</b> Restore 4 Health to each hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_009.png",
        "cost": 8,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Zoltan & Gabor",
        "health": 7,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Rhonin"
        },
        "flavor": "A masterless shamurai.",
        "playerClass": "Mage",
        "elite": true,
        "attack": 7,
        "name": "Rhonin",
        "id": "AT_009",
        "text": "<b>Deathrattle:</b> Add 3 copies of Arcane Missiles to your hand.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_042t.png",
        "cost": 2,
        "set": "The Grand Tournament",
        "race": "Beast",
        "health": 1,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "Lion dent-de-sabre"
        },
        "playerClass": "Druid",
        "attack": 2,
        "name": "Sabertooth Lion",
        "id": "AT_042t",
        "text": "<b>Charge</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_042t2.png",
        "cost": 2,
        "set": "The Grand Tournament",
        "race": "Beast",
        "health": 2,
        "mechanics": [
            "Stealth"
        ],
        "type": "Minion",
        "fr": {
            "name": "Panthère dent-de-sabre"
        },
        "playerClass": "Druid",
        "attack": 3,
        "name": "Sabertooth Panther",
        "id": "AT_042t2",
        "text": "<b>Stealth</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_086.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Greg Staples",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Saboteur"
        },
        "flavor": "Listen all y'all it's a saboteur!",
        "attack": 4,
        "name": "Saboteur",
        "id": "AT_086",
        "text": "<b>Battlecry:</b> Your opponent's Hero Power costs (5) more next turn.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_037t.png",
        "playerClass": "Druid",
        "cost": 1,
        "set": "The Grand Tournament",
        "attack": 1,
        "name": "Sapling",
        "health": 1,
        "id": "AT_037t",
        "type": "Minion",
        "fr": {
            "name": "Arbrisseau"
        }
    },
    {
        "playerClass": "Druid",
        "set": "The Grand Tournament",
        "name": "Savage",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "AT_039e",
        "text": "+2 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Sauvage"
        }
    },
    {
        "cardImage": "AT_039.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Beast",
        "artist": "Alex Pascenko",
        "health": 4,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Combattant sauvage"
        },
        "flavor": "Maybe if you whistle a tune it will soothe him.  Yeah...  Try that.",
        "playerClass": "Druid",
        "attack": 5,
        "name": "Savage Combatant",
        "id": "AT_039",
        "text": "<b>Inspire:</b> Give your hero\n+2 Attack this turn.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_130.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "James Ryman",
        "health": 7,
        "type": "Minion",
        "fr": {
            "name": "Saccageur des mers"
        },
        "flavor": "A little better than Sea Minus Reaver.",
        "playerClass": "Warrior",
        "attack": 6,
        "name": "Sea Reaver",
        "id": "AT_130",
        "text": "When you draw this, deal 1 damage to your minions.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_074.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Jonboy Meyers",
        "type": "Spell",
        "fr": {
            "name": "Sceau des champions"
        },
        "flavor": "\"Arf! Arf! Arf!\" - Seal of Champions",
        "playerClass": "Paladin",
        "name": "Seal of Champions",
        "id": "AT_074",
        "text": "Give a minion\n+3 Attack and <b>Divine Shield</b>.",
        "rarity": "Common"
    },
    {
        "playerClass": "Paladin",
        "set": "The Grand Tournament",
        "name": "Seal of Champions",
        "id": "AT_074e2",
        "text": "+3 Attack and <b>Divine Shield</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Sceau des champions"
        }
    },
    {
        "cardImage": "AT_132_SHAMANb.png",
        "playerClass": "Shaman",
        "cost": 0,
        "set": "The Grand Tournament",
        "attack": 1,
        "name": "Searing Totem",
        "health": 1,
        "id": "AT_132_SHAMANb",
        "type": "Minion",
        "fr": {
            "name": "Totem incendiaire"
        }
    },
    {
        "cardImage": "AT_028.png",
        "cost": 5,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Ryan Metcaff",
        "health": 7,
        "mechanics": [
            "Combo"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chevaucheur pandashan"
        },
        "flavor": "He needed a break after that business in the Vale of Eternal Blossoms. Naturally, he chose to spend his vacation in an icy snowscape killing monsters.",
        "playerClass": "Rogue",
        "attack": 3,
        "name": "Shado-Pan Rider",
        "id": "AT_028",
        "text": "<b>Combo:</b> Gain +3 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_014.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Warren Mahy",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Ombrefiel"
        },
        "flavor": "Hopes to be promoted to \"Shadowfriend\" someday.",
        "playerClass": "Priest",
        "attack": 3,
        "name": "Shadowfiend",
        "id": "AT_014",
        "text": "Whenever you draw a card, reduce its Cost by (1).",
        "rarity": "Epic"
    },
    {
        "playerClass": "Priest",
        "set": "The Grand Tournament",
        "name": "Shadowfiended",
        "id": "AT_014e",
        "text": "Costs (1) less.",
        "type": "Enchantment",
        "fr": {
            "name": "Effet d’ombrefiel"
        }
    },
    {
        "cardImage": "AT_032.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Tooth",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Marchand douteux"
        },
        "flavor": "I have great deal for you... for 4 damage to your face!",
        "playerClass": "Rogue",
        "attack": 4,
        "name": "Shady Dealer",
        "id": "AT_032",
        "text": "<b>Battlecry:</b> If you have a Pirate, gain +1/+1.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Rogue",
        "set": "The Grand Tournament",
        "name": "Shady Deals",
        "id": "AT_032e",
        "text": "+1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Marché douteux"
        }
    },
    {
        "cardImage": "AT_098.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Wayne Reynolds",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mangesort prodigieuse"
        },
        "flavor": "Hey!  Let me try that...",
        "attack": 6,
        "name": "Sideshow Spelleater",
        "id": "AT_098",
        "text": "<b>Battlecry:</b> Copy your opponent's Hero Power.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_095.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Esad Ribic",
        "health": 2,
        "mechanics": [
            "Divine Shield",
            "Stealth"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chevalier silencieux"
        },
        "flavor": "He used to be a librarian.  Old habits die hard.",
        "attack": 2,
        "name": "Silent Knight",
        "id": "AT_095",
        "text": "<b>Stealth</b>\n<b>Divine Shield</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_100.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "John Polidora",
        "health": 3,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Régente de la Main d’argent"
        },
        "flavor": "The Silver Hand is the best paladin organization.  The Argent Crusaders are super jealous.",
        "attack": 3,
        "name": "Silver Hand Regent",
        "id": "AT_100",
        "text": "<b>Inspire:</b> Summon a 1/1 Silver Hand Recruit.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_070.png",
        "cost": 7,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Pirate",
        "artist": "Alex Horley Orlandelli",
        "health": 6,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "Cap’taine céleste Kragg"
        },
        "flavor": "What's more boss than riding a parrot with a jawbone for a shoulderpad while wielding a giant hook-lance-thing and wearing a pirate hat?  NOTHING.",
        "elite": true,
        "attack": 4,
        "name": "Skycap'n Kragg",
        "id": "AT_070",
        "text": "<b>Charrrrrge</b>\nCosts (1) less for each friendly Pirate.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_132_WARLOCK.png",
        "playerClass": "Warlock",
        "cost": 2,
        "set": "The Grand Tournament",
        "name": "Soul Tap",
        "id": "AT_132_WARLOCK",
        "text": "<b>Hero Power</b>\nDraw a card.",
        "type": "Hero Power",
        "fr": {
            "name": "Connexion d’âme"
        }
    },
    {
        "cardImage": "AT_069.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Jim Nelson",
        "health": 2,
        "mechanics": [
            "Battlecry",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Partenaire d’entraînement"
        },
        "flavor": "Come at me, bro.",
        "playerClass": "Warrior",
        "attack": 3,
        "name": "Sparring Partner",
        "id": "AT_069",
        "text": "<b>Taunt</b>\n<b>Battlecry:</b> Give a\nminion <b>Taunt</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_012.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Dave Allsop",
        "health": 4,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Rejeton des Ombres"
        },
        "flavor": "What did you expect to happen?  He's a Spawn.  Of Shadows.",
        "playerClass": "Priest",
        "attack": 5,
        "name": "Spawn of Shadows",
        "id": "AT_012",
        "text": "<b>Inspire:</b> Deal 4 damage to each hero.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_007.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Andrew Hou",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Jette-sorts"
        },
        "flavor": "Does he sling spells, or do his spells linger about.  Who can say?",
        "playerClass": "Mage",
        "attack": 3,
        "name": "Spellslinger",
        "id": "AT_007",
        "text": "<b>Battlecry:</b> Add a random spell to each player's hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_057.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Tyson Murphy",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Maître des écuries"
        },
        "flavor": "Takes way better care of her pets than her brother, Unstablemaster.",
        "playerClass": "Hunter",
        "attack": 4,
        "name": "Stablemaster",
        "id": "AT_057",
        "text": "<b>Battlecry:</b> Give a friendly Beast <b>Immune</b> this turn.",
        "rarity": "Epic"
    },
    {
        "cardImage": "AT_132_SHAMANc.png",
        "playerClass": "Shaman",
        "cost": 0,
        "set": "The Grand Tournament",
        "attack": 0,
        "name": "Stoneclaw Totem",
        "health": 2,
        "id": "AT_132_SHAMANc",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Totem de griffes de pierre"
        }
    },
    {
        "cardImage": "AT_132_WARRIOR.png",
        "playerClass": "Warrior",
        "cost": 2,
        "set": "The Grand Tournament",
        "name": "Tank Up!",
        "id": "AT_132_WARRIOR",
        "text": "<b>Hero Power</b>\nGain 4 Armor.",
        "type": "Hero Power",
        "fr": {
            "name": "Défense stoïque"
        }
    },
    {
        "cardImage": "AT_054.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Wei Wang",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Le mandebrume"
        },
        "flavor": "Calling the mist doesn't sound all that great.  \"Ooooh, it is slightly damp now!\"",
        "playerClass": "Shaman",
        "elite": true,
        "attack": 4,
        "name": "The Mistcaller",
        "id": "AT_054",
        "text": "<b>Battlecry:</b> Give all minions in your hand and deck +1/+1.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_132_PALADIN.png",
        "playerClass": "Paladin",
        "cost": 2,
        "set": "The Grand Tournament",
        "name": "The Silver Hand",
        "id": "AT_132_PALADIN",
        "text": "<b>Hero Power</b>\nSummon two 1/1 Recruits.",
        "type": "Hero Power",
        "fr": {
            "name": "La Main d’argent"
        }
    },
    {
        "cardImage": "AT_128.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Mike Sass",
        "health": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Le chevalier squelette"
        },
        "flavor": "Apparently it really was just a flesh wound.",
        "elite": true,
        "attack": 7,
        "name": "The Skeleton Knight",
        "id": "AT_128",
        "text": "<b>Deathrattle:</b> Reveal a minion in each deck. If yours costs more, return this to your hand.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "AT_049.png",
        "cost": 5,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Sean McNally",
        "health": 6,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Vaillant des Pitons-du-Tonnerre"
        },
        "flavor": "Allowing totems to attack is not cheating.  I mean, there isn't anything in the rule books about it.",
        "playerClass": "Shaman",
        "attack": 3,
        "name": "Thunder Bluff Valiant",
        "id": "AT_049",
        "text": "<b>Inspire:</b> Give your Totems +2 Attack.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_021.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Demon",
        "artist": "Raymond Swanland",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Minuscule chevalier maléfique"
        },
        "flavor": "\"No, no, no. I asked for a tiny JESTER of evil.\"",
        "playerClass": "Warlock",
        "attack": 3,
        "name": "Tiny Knight of Evil",
        "id": "AT_021",
        "text": "Whenever you discard a card, gain +1/+1.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_052.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Totem",
        "artist": "Steve Prescott",
        "health": 4,
        "mechanics": [
            "Overload"
        ],
        "type": "Minion",
        "fr": {
            "name": "Golem totémique"
        },
        "flavor": "What happens when you glue a buncha totems together.",
        "playerClass": "Shaman",
        "attack": 3,
        "name": "Totem Golem",
        "id": "AT_052",
        "text": "<b>Overload: (1)</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_132_SHAMAN.png",
        "playerClass": "Shaman",
        "cost": 2,
        "set": "The Grand Tournament",
        "name": "Totemic Slam",
        "id": "AT_132_SHAMAN",
        "text": "<b>Hero Power</b>\nSummon a Totem of your choice.",
        "type": "Hero Power",
        "fr": {
            "name": "Heurt totémique"
        }
    },
    {
        "cardImage": "AT_097.png",
        "cost": 1,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Adam Byrne",
        "health": 1,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Spectateur du tournoi"
        },
        "flavor": "He was so excited to get season tickets to this year's Grand Tournament.  He normally doesn't get them at first and has to buy them from Ogre scalpers.",
        "attack": 2,
        "name": "Tournament Attendee",
        "id": "AT_097",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_091.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Sean McNally",
        "health": 8,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Médecin du tournoi"
        },
        "flavor": "The medic tournament is less entertaining than the Grand Tournament.",
        "attack": 1,
        "name": "Tournament Medic",
        "id": "AT_091",
        "text": "<b>Inspire:</b> Restore 2 Health to your hero.",
        "rarity": "Common"
    },
    {
        "set": "The Grand Tournament",
        "name": "Training",
        "id": "AT_082e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Entraînement"
        }
    },
    {
        "playerClass": "Warrior",
        "set": "The Grand Tournament",
        "name": "Training Complete",
        "id": "AT_069e",
        "text": "<b>Taunt</b>",
        "type": "Enchantment",
        "fr": {
            "name": "Entraînement terminé"
        }
    },
    {
        "cardImage": "AT_104.png",
        "cost": 5,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Skan Srisuwan",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Jouteur rohart"
        },
        "flavor": "Just could not be talked out of using his turtle for the joust...",
        "playerClass": "Paladin",
        "attack": 5,
        "name": "Tuskarr Jouster",
        "id": "AT_104",
        "text": "<b>Battlecry:</b> Reveal a minion in each deck. If yours costs more, restore 7 Health to your hero.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_046.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Eva Widermann",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Rohart totémique"
        },
        "flavor": "Turns out the tuskarr aren't real choosy about their totems.",
        "playerClass": "Shaman",
        "attack": 3,
        "name": "Tuskarr Totemic",
        "id": "AT_046",
        "text": "<b>Battlecry:</b> Summon ANY random Totem.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_017.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Dragon",
        "artist": "Slawomir Maniak",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Gardien du Crépuscule"
        },
        "flavor": "A result of magical experiments carried out by the Black Dragonflight, it's not his fault that he's a vicious killer.",
        "attack": 2,
        "name": "Twilight Guardian",
        "id": "AT_017",
        "text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1 Attack and <b>Taunt</b>.",
        "rarity": "Epic"
    },
    {
        "set": "The Grand Tournament",
        "name": "Twilight's Embrace",
        "id": "AT_017e",
        "text": "+1 Attack and <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Étreinte du Crépuscule"
        }
    },
    {
        "cardImage": "AT_030.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Zoltan Boros",
        "health": 2,
        "mechanics": [
            "Combo"
        ],
        "type": "Minion",
        "fr": {
            "name": "Vaillant de Fossoyeuse"
        },
        "flavor": "Almost went to play for Stormwind before signing with Undercity.",
        "playerClass": "Rogue",
        "attack": 3,
        "name": "Undercity Valiant",
        "id": "AT_030",
        "text": "<b>Combo:</b> Deal 1 damage.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_072.png",
        "cost": 10,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Wei Wang",
        "health": 7,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Varian Wrynn"
        },
        "flavor": "Leader of the Alliance!  Father of Anduin!  Also he likes to play Arena, and he averages 12 wins.",
        "playerClass": "Warrior",
        "elite": true,
        "attack": 7,
        "name": "Varian Wrynn",
        "id": "AT_072",
        "text": "<b>Battlecry:</b> Draw 3 cards.\nPut any minions you drew directly into the battlefield.",
        "rarity": "Legendary"
    },
    {
        "set": "The Grand Tournament",
        "name": "Victory!",
        "id": "AT_133e",
        "text": "+1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Victoire !"
        }
    },
    {
        "set": "The Grand Tournament",
        "name": "Villainy",
        "id": "AT_086e",
        "text": "Your Hero Power costs (5) more this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Vilenie"
        }
    },
    {
        "cardImage": "AT_023.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Demon",
        "artist": "Skan Srisuwan",
        "health": 4,
        "mechanics": [
            "Inspire"
        ],
        "type": "Minion",
        "fr": {
            "name": "Écraseur du Vide"
        },
        "flavor": "We like to call him \"Wesley\".",
        "playerClass": "Warlock",
        "attack": 5,
        "name": "Void Crusher",
        "id": "AT_023",
        "text": "<b>Inspire:</b> Destroy a random minion for each player.",
        "rarity": "Rare"
    },
    {
        "cardImage": "AT_099t.png",
        "cost": 5,
        "set": "The Grand Tournament",
        "race": "Beast",
        "attack": 3,
        "name": "War Kodo",
        "health": 5,
        "id": "AT_099t",
        "type": "Minion",
        "fr": {
            "name": "Kodo de guerre"
        }
    },
    {
        "cardImage": "AT_075.png",
        "cost": 3,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Zoltan & Gabor",
        "health": 4,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Maître des chevaux de guerre"
        },
        "flavor": "He doesn't even get Sundays off.  Every day he's hostling.",
        "playerClass": "Paladin",
        "attack": 2,
        "name": "Warhorse Trainer",
        "id": "AT_075",
        "text": "Your Silver Hand Recruits have +1 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_040.png",
        "cost": 4,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "James Ryman",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Marcheuse sauvage"
        },
        "flavor": "She was born to be something.  She is just not quite sure what yet...",
        "playerClass": "Druid",
        "attack": 4,
        "name": "Wildwalker",
        "id": "AT_040",
        "text": "<b>Battlecry:</b> Give a friendly Beast +3 Health.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_027.png",
        "cost": 6,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Tooth",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Wilfred Flopboum"
        },
        "flavor": "He can summon anything, even a FEARSOME DOOMGUARD*.\n*He's pretty sure this is going to work out.",
        "playerClass": "Warlock",
        "elite": true,
        "attack": 4,
        "name": "Wilfred Fizzlebang",
        "id": "AT_027",
        "text": "Cards you draw from your Hero Power cost (0).",
        "rarity": "Legendary"
    },
    {
        "set": "The Grand Tournament",
        "name": "Wound Up",
        "id": "AT_096e",
        "text": "+1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Remonté"
        }
    },
    {
        "cardImage": "AT_132_SHAMANd.png",
        "playerClass": "Shaman",
        "cost": 0,
        "set": "The Grand Tournament",
        "attack": 0,
        "name": "Wrath of Air Totem",
        "health": 2,
        "id": "AT_132_SHAMANd",
        "text": "<b>Spell Damage +1</b>",
        "type": "Minion",
        "fr": {
            "name": "Totem de courroux de l’air"
        }
    },
    {
        "cardImage": "AT_026.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "race": "Demon",
        "artist": "Sojin Hwang",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Garde-courroux"
        },
        "flavor": "After playing against 5 Annoy-O-Trons, any normal guard will become a Wrathguard.",
        "playerClass": "Warlock",
        "attack": 4,
        "name": "Wrathguard",
        "id": "AT_026",
        "text": "Whenever this minion takes damage, also deal that amount to your hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "AT_116.png",
        "cost": 2,
        "collectible": true,
        "set": "The Grand Tournament",
        "artist": "Jeff Easley",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Agent du Repos du ver"
        },
        "flavor": "Keeping tabs on the Grand Tournament is priority #1 for the five mighty Dragonflights!",
        "playerClass": "Priest",
        "attack": 1,
        "name": "Wyrmrest Agent",
        "id": "AT_116",
        "text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1 Attack and <b>Taunt</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "BRMA15_4.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 1,
        "name": "Aberration",
        "health": 1,
        "mechanics": [
            "Charge"
        ],
        "id": "BRMA15_4",
        "text": "<b>Charge</b>",
        "type": "Minion",
        "fr": {
            "name": "Aberration"
        }
    },
    {
        "cardImage": "BRMA14_2H.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Activate Arcanotron",
        "id": "BRMA14_2H",
        "text": "<b>Hero Power</b>\nActivate Arcanotron!",
        "type": "Hero Power",
        "fr": {
            "name": "Activer Arcanotron"
        }
    },
    {
        "cardImage": "BRMA14_2.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Activate Arcanotron",
        "id": "BRMA14_2",
        "text": "<b>Hero Power</b>\nActivate Arcanotron!",
        "type": "Hero Power",
        "fr": {
            "name": "Activer Arcanotron"
        }
    },
    {
        "cardImage": "BRMA14_6H.png",
        "cost": 4,
        "set": "Blackrock Mountain",
        "name": "Activate Electron",
        "id": "BRMA14_6H",
        "text": "<b>Hero Power</b>\nActivate Electron!",
        "type": "Hero Power",
        "fr": {
            "name": "Activer Électron"
        }
    },
    {
        "cardImage": "BRMA14_6.png",
        "cost": 6,
        "set": "Blackrock Mountain",
        "name": "Activate Electron",
        "id": "BRMA14_6",
        "text": "<b>Hero Power</b>\nActivate Electron!",
        "type": "Hero Power",
        "fr": {
            "name": "Activer Électron"
        }
    },
    {
        "cardImage": "BRMA14_8.png",
        "cost": 8,
        "set": "Blackrock Mountain",
        "name": "Activate Magmatron",
        "id": "BRMA14_8",
        "text": "<b>Hero Power</b>\nActivate Magmatron!",
        "type": "Hero Power",
        "fr": {
            "name": "Activer Magmatron"
        }
    },
    {
        "cardImage": "BRMA14_8H.png",
        "cost": 6,
        "set": "Blackrock Mountain",
        "name": "Activate Magmatron",
        "id": "BRMA14_8H",
        "text": "<b>Hero Power</b>\nActivate Magmatron!",
        "type": "Hero Power",
        "fr": {
            "name": "Activer Magmatron"
        }
    },
    {
        "cardImage": "BRMA14_4H.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Activate Toxitron",
        "id": "BRMA14_4H",
        "text": "<b>Hero Power</b>\nActivate Toxitron!",
        "type": "Hero Power",
        "fr": {
            "name": "Activer Toxitron"
        }
    },
    {
        "cardImage": "BRMA14_4.png",
        "cost": 4,
        "set": "Blackrock Mountain",
        "name": "Activate Toxitron",
        "id": "BRMA14_4",
        "text": "<b>Hero Power</b>\nActivate Toxitron!",
        "type": "Hero Power",
        "fr": {
            "name": "Activer Toxitron"
        }
    },
    {
        "cardImage": "BRMA14_10.png",
        "cost": 4,
        "set": "Blackrock Mountain",
        "name": "Activate!",
        "id": "BRMA14_10",
        "text": "<b>Hero Power</b>\nActivate a random Tron.",
        "type": "Hero Power",
        "fr": {
            "name": "Activation !"
        }
    },
    {
        "cardImage": "BRMA14_10H.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Activate!",
        "id": "BRMA14_10H",
        "text": "<b>Hero Power</b>\nActivate a random Tron.",
        "type": "Hero Power",
        "fr": {
            "name": "Activation !"
        }
    },
    {
        "cardImage": "BRMA14_3.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "race": "Mech",
        "health": 2,
        "mechanics": [
            "Spellpower"
        ],
        "type": "Minion",
        "fr": {
            "name": "Arcanotron"
        },
        "elite": true,
        "attack": 2,
        "name": "Arcanotron",
        "id": "BRMA14_3",
        "text": "Both players have <b>Spell Damage +2</b>.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA16_1.png",
        "set": "Blackrock Mountain",
        "name": "Atramedes",
        "health": 30,
        "id": "BRMA16_1",
        "type": "Hero",
        "fr": {
            "name": "Atramédès"
        }
    },
    {
        "cardImage": "BRMA16_1H.png",
        "set": "Blackrock Mountain",
        "name": "Atramedes",
        "health": 30,
        "id": "BRMA16_1H",
        "type": "Hero",
        "fr": {
            "name": "Atramédès"
        }
    },
    {
        "cardImage": "BRM_016.png",
        "cost": 4,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Efrem Palacios",
        "health": 5,
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Warrior Class Challenge in Blackrock Mountain.",
        "fr": {
            "name": "Lanceur de hache"
        },
        "flavor": "Once a lowly \"Stick Flinger\", he's been relentless on the path to his ultimate dream: \"Tauren Flinger\".",
        "playerClass": "Warrior",
        "attack": 2,
        "name": "Axe Flinger",
        "howToGet": "Unlocked by completing the Warrior Class Challenge in Blackrock Mountain.",
        "id": "BRM_016",
        "text": "Whenever this minion takes damage, deal 2 damage to the enemy hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "BRMA05_1.png",
        "set": "Blackrock Mountain",
        "name": "Baron Geddon",
        "health": 30,
        "id": "BRMA05_1",
        "type": "Hero",
        "fr": {
            "name": "Baron Geddon"
        }
    },
    {
        "cardImage": "BRMA05_1H.png",
        "set": "Blackrock Mountain",
        "name": "Baron Geddon",
        "health": 50,
        "id": "BRMA05_1H",
        "type": "Hero",
        "fr": {
            "name": "Baron Geddon"
        }
    },
    {
        "cardImage": "BRM_022t.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "artist": "Jaemin Kim",
        "attack": 2,
        "name": "Black Whelp",
        "health": 1,
        "id": "BRM_022t",
        "type": "Minion",
        "fr": {
            "name": "Dragonnet noir"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "BRMA09_4H.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Blackwing",
        "id": "BRMA09_4H",
        "text": "<b>Hero Power</b>\nSummon a 5/4 Dragonkin. Get a new Hero Power.",
        "type": "Hero Power",
        "fr": {
            "name": "Aile noire"
        }
    },
    {
        "cardImage": "BRMA09_4.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Blackwing",
        "id": "BRMA09_4",
        "text": "<b>Hero Power</b>\nSummon a 3/1 Dragonkin. Get a new Hero Power.",
        "type": "Hero Power",
        "fr": {
            "name": "Aile noire"
        }
    },
    {
        "cardImage": "BRM_034.png",
        "cost": 5,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Greg Staples",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Maloriak in the Hidden Laboratory.",
        "fr": {
            "name": "Corrupteur de l’Aile noire"
        },
        "flavor": "He got his name when he gave Blackwing some comic books and rock & roll records.",
        "attack": 5,
        "faction": "Neutral",
        "name": "Blackwing Corruptor",
        "howToGet": "Unlocked by defeating Maloriak in the Hidden Laboratory.",
        "id": "BRM_034",
        "text": "<b>Battlecry</b>: If you're holding a Dragon, deal 3 damage.",
        "rarity": "Common"
    },
    {
        "cardImage": "BRM_033.png",
        "cost": 3,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Matt Dixon",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Baron Geddon in Molten Core.",
        "fr": {
            "name": "Technicienne de l’Aile noire"
        },
        "flavor": "This is who you go to when your Blackwing needs a tune up. Don't go to a cut rate Blackwing tune up shop!",
        "attack": 2,
        "faction": "Neutral",
        "name": "Blackwing Technician",
        "howToGet": "Unlocked by defeating Baron Geddon in Molten Core.",
        "id": "BRM_033",
        "text": "<b>Battlecry:</b> If you're holding a Dragon, gain +1/+1.",
        "rarity": "Common"
    },
    {
        "set": "Blackrock Mountain",
        "name": "Blind With Rage",
        "id": "BRMA10_6e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Rage aveugle"
        }
    },
    {
        "cardImage": "BRMA17_6.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 2,
        "name": "Bone Construct",
        "health": 1,
        "id": "BRMA17_6",
        "type": "Minion",
        "fr": {
            "name": "Assemblage d’os"
        }
    },
    {
        "cardImage": "BRMA17_6H.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 4,
        "name": "Bone Construct",
        "health": 2,
        "id": "BRMA17_6H",
        "type": "Minion",
        "fr": {
            "name": "Assemblage d’os"
        }
    },
    {
        "cardImage": "BRMA17_5H.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Bone Minions",
        "id": "BRMA17_5H",
        "text": "<b>Hero Power</b>\nSummon two 4/2 Bone Constructs.",
        "type": "Hero Power",
        "fr": {
            "name": "Séides des os"
        }
    },
    {
        "cardImage": "BRMA17_5.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Bone Minions",
        "id": "BRMA17_5",
        "text": "<b>Hero Power</b>\nSummon two 2/1 Bone Constructs.",
        "type": "Hero Power",
        "fr": {
            "name": "Séides des os"
        }
    },
    {
        "cardImage": "BRMA12_2.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction",
        "id": "BRMA12_2",
        "text": "<b>Hero Power</b>\nAt the end of your turn, add a Brood Affliction card to your opponent's hand.",
        "type": "Hero Power",
        "fr": {
            "name": "Affliction de l’espèce"
        }
    },
    {
        "cardImage": "BRMA12_2H.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction",
        "id": "BRMA12_2H",
        "text": "<b>Hero Power</b>\nAt the end of your turn, add a Brood Affliction card to your opponent's hand.",
        "type": "Hero Power",
        "fr": {
            "name": "Affliction de l’espèce"
        }
    },
    {
        "cardImage": "BRMA12_6H.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction: Black",
        "id": "BRMA12_6H",
        "text": "While this is in your hand, whenever Chromaggus draws a card, he gets another copy of it.",
        "type": "Spell",
        "fr": {
            "name": "Affliction de l’espèce : noir"
        }
    },
    {
        "cardImage": "BRMA12_6.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction: Black",
        "id": "BRMA12_6",
        "text": "While this is in your hand, whenever Chromaggus draws a card, he gets another copy of it.",
        "type": "Spell",
        "fr": {
            "name": "Affliction de l’espèce : noir"
        }
    },
    {
        "cardImage": "BRMA12_5.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction: Blue",
        "id": "BRMA12_5",
        "text": "While this is in your hand, Chromaggus' spells cost (1) less.",
        "type": "Spell",
        "fr": {
            "name": "Affliction de l’espèce : bleu"
        }
    },
    {
        "cardImage": "BRMA12_5H.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction: Blue",
        "id": "BRMA12_5H",
        "text": "While this is in your hand, Chromaggus' spells cost (3) less.",
        "type": "Spell",
        "fr": {
            "name": "Affliction de l’espèce : bleu"
        }
    },
    {
        "cardImage": "BRMA12_7H.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction: Bronze",
        "id": "BRMA12_7H",
        "text": "While this is in your hand, Chromaggus' minions cost (3) less.",
        "type": "Spell",
        "fr": {
            "name": "Affliction de l’espèce : bronze"
        }
    },
    {
        "cardImage": "BRMA12_7.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction: Bronze",
        "id": "BRMA12_7",
        "text": "While this is in your hand, Chromaggus' minions cost (1) less.",
        "type": "Spell",
        "fr": {
            "name": "Affliction de l’espèce : bronze"
        }
    },
    {
        "cardImage": "BRMA12_4.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction: Green",
        "id": "BRMA12_4",
        "text": "While this is in your hand, restore 2 health to your opponent at the start of your turn.",
        "type": "Spell",
        "fr": {
            "name": "Affliction de l’espèce : vert"
        }
    },
    {
        "cardImage": "BRMA12_4H.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction: Green",
        "id": "BRMA12_4H",
        "text": "While this is in your hand, restore 6 health to your opponent at the start of your turn.",
        "type": "Spell",
        "fr": {
            "name": "Affliction de l’espèce : vert"
        }
    },
    {
        "cardImage": "BRMA12_3.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction: Red",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "BRMA12_3",
        "text": "While this is in your hand, take 1 damage at the start of your turn.",
        "type": "Spell",
        "fr": {
            "name": "Affliction de l’espèce : rouge"
        }
    },
    {
        "cardImage": "BRMA12_3H.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "name": "Brood Affliction: Red",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "BRMA12_3H",
        "text": "While this is in your hand, take 3 damage at the start of your turn.",
        "type": "Spell",
        "fr": {
            "name": "Affliction de l’espèce : rouge"
        }
    },
    {
        "cardImage": "BRMA11_3.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Burning Adrenaline",
        "id": "BRMA11_3",
        "text": "Deal $2 damage to the enemy hero.",
        "type": "Spell",
        "fr": {
            "name": "Montée d’adrénaline"
        }
    },
    {
        "cardImage": "BRMA12_1H.png",
        "set": "Blackrock Mountain",
        "name": "Chromaggus",
        "health": 60,
        "id": "BRMA12_1H",
        "type": "Hero",
        "fr": {
            "name": "Chromaggus"
        }
    },
    {
        "cardImage": "BRMA12_1.png",
        "set": "Blackrock Mountain",
        "name": "Chromaggus",
        "health": 30,
        "id": "BRMA12_1",
        "type": "Hero",
        "fr": {
            "name": "Chromaggus"
        }
    },
    {
        "cardImage": "BRM_031.png",
        "cost": 8,
        "collectible": true,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "artist": "Todd Lockwood",
        "health": 8,
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing Blackwing Lair.",
        "fr": {
            "name": "Chromaggus"
        },
        "flavor": "Left head and right head can never agree about what to eat for dinner, so they always end up just eating ramen again.",
        "elite": true,
        "attack": 6,
        "name": "Chromaggus",
        "howToGet": "Unlocked by completing Blackwing Lair.",
        "id": "BRM_031",
        "text": "Whenever you draw a card, put another copy into your hand.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA12_8t.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "attack": 2,
        "name": "Chromatic Dragonkin",
        "health": 3,
        "id": "BRMA12_8t",
        "text": "Whenever your opponent casts a spell, gain +2/+2.",
        "type": "Minion",
        "fr": {
            "name": "Draconien chromatique"
        }
    },
    {
        "cardImage": "BRMA12_9.png",
        "set": "Blackrock Mountain",
        "name": "Chromatic Dragonkin",
        "health": 30,
        "id": "BRMA12_9",
        "type": "Hero",
        "fr": {
            "name": "Draconien chromatique"
        }
    },
    {
        "cardImage": "BRMA10_5H.png",
        "cost": 4,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "attack": 7,
        "name": "Chromatic Drake",
        "health": 7,
        "id": "BRMA10_5H",
        "type": "Minion",
        "fr": {
            "name": "Drake chromatique"
        }
    },
    {
        "cardImage": "BRMA10_5.png",
        "cost": 4,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "attack": 7,
        "name": "Chromatic Drake",
        "health": 3,
        "id": "BRMA10_5",
        "type": "Minion",
        "fr": {
            "name": "Drake chromatique"
        }
    },
    {
        "cardImage": "BRMA12_8.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Chromatic Mutation",
        "id": "BRMA12_8",
        "text": "Transform a minion into a 2/2 Chromatic Dragonkin.",
        "type": "Spell",
        "fr": {
            "name": "Mutation chromatique"
        }
    },
    {
        "cardImage": "BRMA17_7.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "attack": 1,
        "name": "Chromatic Prototype",
        "health": 4,
        "mechanics": [
            "Taunt"
        ],
        "id": "BRMA17_7",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Prototype chromatique"
        }
    },
    {
        "cardImage": "BRM_014.png",
        "cost": 4,
        "collectible": true,
        "set": "Blackrock Mountain",
        "race": "Beast",
        "artist": "Jomaro Kindred",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Highlord Omokk in Blackrock Spire.",
        "fr": {
            "name": "Rageur du Magma"
        },
        "flavor": "It takes a special kind of hunter to venture deep into a firey lava pit and convince a monster who lives there to come home and be a cuddly housepet.",
        "playerClass": "Hunter",
        "attack": 4,
        "name": "Core Rager",
        "howToGet": "Unlocked by defeating Highlord Omokk in Blackrock Spire.",
        "id": "BRM_014",
        "text": "<b>Battlecry:</b> If your hand is empty, gain +3/+3.",
        "rarity": "Rare"
    },
    {
        "cardImage": "BRMA01_1H.png",
        "set": "Blackrock Mountain",
        "name": "Coren Direbrew",
        "health": 30,
        "id": "BRMA01_1H",
        "type": "Hero",
        "fr": {
            "name": "Coren Navrebière"
        }
    },
    {
        "cardImage": "BRMA01_1.png",
        "set": "Blackrock Mountain",
        "name": "Coren Direbrew",
        "health": 30,
        "id": "BRMA01_1",
        "type": "Hero",
        "fr": {
            "name": "Coren Navrebière"
        }
    },
    {
        "cardImage": "BRMA10_4.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 0,
        "name": "Corrupted Egg",
        "health": 1,
        "id": "BRMA10_4",
        "text": "When this minion has 4 or more Health, it hatches.",
        "type": "Minion",
        "fr": {
            "name": "Œuf corrompu"
        }
    },
    {
        "cardImage": "BRMA10_4H.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 0,
        "name": "Corrupted Egg",
        "health": 3,
        "id": "BRMA10_4H",
        "text": "When this minion has 5 or more Health, it hatches.",
        "type": "Minion",
        "fr": {
            "name": "Œuf corrompu"
        }
    },
    {
        "cardImage": "BRMA01_3.png",
        "cost": 6,
        "set": "Blackrock Mountain",
        "attack": 4,
        "name": "Dark Iron Bouncer",
        "health": 8,
        "id": "BRMA01_3",
        "text": "Always wins Brawls.",
        "type": "Minion",
        "fr": {
            "name": "Videur sombrefer"
        }
    },
    {
        "cardImage": "BRM_008.png",
        "cost": 5,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Eric Braddock",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Rogue Class Challenge in Blackrock Mountain.",
        "fr": {
            "name": "Furtif sombrefer"
        },
        "flavor": "He loves skulking. He skulks after hours just for the joy of it, but his friends are pretty worried he'll get burnt out.",
        "playerClass": "Rogue",
        "attack": 4,
        "name": "Dark Iron Skulker",
        "howToGet": "Unlocked by completing the Rogue Class Challenge in Blackrock Mountain.",
        "id": "BRM_008",
        "text": "<b>Battlecry:</b> Deal 2 damage to all undamaged enemy minions.",
        "rarity": "Rare"
    },
    {
        "cardImage": "BRMA02_2t.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 1,
        "name": "Dark Iron Spectator",
        "health": 1,
        "mechanics": [
            "Taunt"
        ],
        "id": "BRMA02_2t",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Spectateur sombrefer"
        }
    },
    {
        "cardImage": "BRM_005.png",
        "cost": 3,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Raymond Swanland",
        "mechanics": [
            "AffectedBySpellPower"
        ],
        "type": "Spell",
        "howToGetGold": "Can be crafted after completing the Warlock Class Challenge in Blackrock Mountain.",
        "fr": {
            "name": "Courroux démoniaque"
        },
        "flavor": "Demons are not angry most of the time. You have to play this card in order to really bring it out of them.",
        "playerClass": "Warlock",
        "name": "Demonwrath",
        "howToGet": "Unlocked by completing the Warlock Class Challenge in Blackrock Mountain.",
        "id": "BRM_005",
        "text": "Deal $2 damage to all non-Demon minions.",
        "rarity": "Rare"
    },
    {
        "cardImage": "BRM_027p.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "DIE, INSECT!",
        "id": "BRM_027p",
        "text": "<b>Hero Power</b>\nDeal $8 damage to a random enemy.",
        "type": "Hero Power",
        "fr": {
            "name": "MEURS, INSECTE !"
        }
    },
    {
        "cardImage": "BRMA13_8.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "DIE, INSECT!",
        "mechanics": [
            "AffectedBySpellPower"
        ],
        "id": "BRMA13_8",
        "text": "Deal $8 damage to a random enemy.",
        "type": "Spell",
        "fr": {
            "name": "MEURS, INSECTE !"
        }
    },
    {
        "cardImage": "BRM_027pH.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "DIE, INSECTS!",
        "id": "BRM_027pH",
        "text": "<b>Hero Power</b>\nDeal $8 damage to a random enemy. TWICE.",
        "type": "Hero Power",
        "fr": {
            "name": "MOUREZ, INSECTES !"
        }
    },
    {
        "cardImage": "BRMA09_5.png",
        "cost": 4,
        "set": "Blackrock Mountain",
        "name": "Dismount",
        "id": "BRMA09_5",
        "text": "<b>Hero Power</b>\nSummon Gyth. Get a new Hero Power.",
        "type": "Hero Power",
        "fr": {
            "name": "Pied à terre"
        }
    },
    {
        "cardImage": "BRMA09_5H.png",
        "cost": 4,
        "set": "Blackrock Mountain",
        "name": "Dismount",
        "id": "BRMA09_5H",
        "text": "<b>Hero Power</b>\nSummon Gyth. Get a new Hero Power.",
        "type": "Hero Power",
        "fr": {
            "name": "Pied à terre"
        }
    },
    {
        "set": "Blackrock Mountain",
        "name": "Draconic Power",
        "id": "BRM_020e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance draconique"
        }
    },
    {
        "set": "Blackrock Mountain",
        "name": "Dragon Blood",
        "id": "BRM_033e",
        "text": "+1/+1",
        "type": "Enchantment",
        "fr": {
            "name": "Sang de dragon"
        }
    },
    {
        "cardImage": "BRM_018.png",
        "cost": 5,
        "collectible": true,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "artist": "Raymond Swanland",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating General Drakkisath in Blackrock Spire.",
        "fr": {
            "name": "Dragon consort"
        },
        "flavor": "Everybody wants someone to snuggle with. Even giant armored scaly draconic beasts of destruction.",
        "playerClass": "Paladin",
        "attack": 5,
        "name": "Dragon Consort",
        "howToGet": "Unlocked by defeating General Drakkisath in Blackrock Spire.",
        "id": "BRM_018",
        "text": "<b>Battlecry:</b> The next Dragon you play costs (2) less.",
        "rarity": "Rare"
    },
    {
        "cardImage": "BRM_022.png",
        "cost": 1,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Jaemin Kim",
        "health": 2,
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Rend Blackhand in Blackrock Spire.",
        "fr": {
            "name": "Œuf de dragon"
        },
        "flavor": "Think of them as bullets for your dragon gun.",
        "attack": 0,
        "name": "Dragon Egg",
        "howToGet": "Unlocked by defeating Rend Blackhand in Blackrock Spire.",
        "id": "BRM_022",
        "text": "Whenever this minion takes damage, summon a 2/1 Whelp.",
        "rarity": "Rare"
    },
    {
        "cardImage": "BRM_003.png",
        "cost": 5,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Mauricio Herrera",
        "type": "Spell",
        "howToGetGold": "Can be crafted after completing the Mage Class Challenge in Blackrock Mountain.",
        "fr": {
            "name": "Souffle du dragon"
        },
        "flavor": "Dragons breathe fire, sure, but did you know they can also breathe Cotton Candy?  It's harder to give them a reason to do that, though.",
        "playerClass": "Mage",
        "name": "Dragon's Breath",
        "howToGet": "Unlocked by completing the Mage Class Challenge in Blackrock Mountain.",
        "id": "BRM_003",
        "text": "Deal $4 damage. Costs (1) less for each minion that died this turn.",
        "rarity": "Common"
    },
    {
        "playerClass": "Mage",
        "set": "Blackrock Mountain",
        "name": "Dragon's Might",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "BRM_003e",
        "text": "Costs (3) less this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance du dragon"
        }
    },
    {
        "cardImage": "BRMA09_4t.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "attack": 3,
        "name": "Dragonkin",
        "health": 1,
        "id": "BRMA09_4t",
        "type": "Minion",
        "fr": {
            "name": "Draconien"
        }
    },
    {
        "cardImage": "BRMA09_4Ht.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "attack": 5,
        "name": "Dragonkin",
        "health": 4,
        "id": "BRMA09_4Ht",
        "type": "Minion",
        "fr": {
            "name": "Draconien"
        }
    },
    {
        "cardImage": "BRM_020.png",
        "cost": 4,
        "collectible": true,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "artist": "Edouard Guiton & Stuido HIVE",
        "health": 5,
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Nefarian in the Hidden Laboratory.",
        "fr": {
            "name": "Sorcier draconien"
        },
        "flavor": "Dragonkin Sorcerers be all \"I'm a wizard\" and everyone else be all \"daaaaang\".",
        "attack": 3,
        "name": "Dragonkin Sorcerer",
        "howToGet": "Unlocked by defeating Nefarian in the Hidden Laboratory.",
        "id": "BRM_020",
        "text": "Whenever <b>you</b> target this minion with a spell, gain +1/+1.",
        "rarity": "Common"
    },
    {
        "cardImage": "BRMA16_5.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 0,
        "durability": 6,
        "name": "Dragonteeth",
        "id": "BRMA16_5",
        "text": "Whenever your opponent plays a card, gain +1 Attack.",
        "type": "Weapon",
        "fr": {
            "name": "Dent-de-Dragon"
        }
    },
    {
        "cardImage": "BRMA08_3.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Drakkisath's Command",
        "id": "BRMA08_3",
        "text": "Destroy a minion. Gain 10 Armor.",
        "type": "Spell",
        "fr": {
            "name": "Ordres de Drakkisath"
        }
    },
    {
        "cardImage": "BRM_024.png",
        "cost": 6,
        "collectible": true,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "artist": "Slawomir Maniak",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Atramedes in the Hidden Laboratory.",
        "fr": {
            "name": "Écraseur drakônide"
        },
        "flavor": "Drakonids were created to have all the bad parts of a dragon in the form of a humaniod. But, like, why?",
        "attack": 6,
        "name": "Drakonid Crusher",
        "howToGet": "Unlocked by defeating Atramedes in the Hidden Laboratory.",
        "id": "BRM_024",
        "text": "<b>Battlecry:</b> If your opponent has 15 or less Health, gain +3/+3.",
        "rarity": "Common"
    },
    {
        "cardImage": "BRM_010.png",
        "cost": 3,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Stanley Lau",
        "health": 2,
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Garr in Molten Core.",
        "fr": {
            "name": "Druidesse de la Flamme"
        },
        "flavor": "Druids who fought too long in Northrend were easily seduced by Ragnaros; a mug of hot chocolate was generally all it took.",
        "playerClass": "Druid",
        "attack": 2,
        "name": "Druid of the Flame",
        "howToGet": "Unlocked by defeating Garr in Molten Core.",
        "id": "BRM_010",
        "text": "<b>Choose One</b> - Transform into a 5/2 minion; or a 2/5 minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "BRM_010t.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "race": "Beast",
        "artist": "Ben Zhang",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Druidesse de la Flamme"
        },
        "playerClass": "Druid",
        "attack": 5,
        "name": "Druid of the Flame",
        "id": "BRM_010t",
        "rarity": "Common"
    },
    {
        "cardImage": "BRM_010t2.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "race": "Beast",
        "artist": "Hideaki Takamura",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Druidesse de la Flamme"
        },
        "playerClass": "Druid",
        "attack": 2,
        "name": "Druid of the Flame",
        "id": "BRM_010t2",
        "rarity": "Common"
    },
    {
        "cardImage": "BRMA16_2H.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Echolocate",
        "id": "BRMA16_2H",
        "text": "<b>Hero Power</b>\nEquip a weapon that grows as your opponent plays cards.",
        "type": "Hero Power",
        "fr": {
            "name": "Écholocation"
        }
    },
    {
        "cardImage": "BRMA16_2.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Echolocate",
        "id": "BRMA16_2",
        "text": "<b>Hero Power</b>\nEquip a weapon that grows as your opponent plays cards.",
        "type": "Hero Power",
        "fr": {
            "name": "Écholocation"
        }
    },
    {
        "cardImage": "BRMA14_7H.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "race": "Mech",
        "health": 6,
        "type": "Minion",
        "fr": {
            "name": "Électron"
        },
        "elite": true,
        "attack": 6,
        "name": "Electron",
        "id": "BRMA14_7H",
        "text": "All spells cost (3) less.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA14_7.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "race": "Mech",
        "health": 5,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Électron"
        },
        "elite": true,
        "attack": 5,
        "name": "Electron",
        "id": "BRMA14_7",
        "text": "All spells cost (3) less.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA03_1H.png",
        "set": "Blackrock Mountain",
        "name": "Emperor Thaurissan",
        "health": 30,
        "id": "BRMA03_1H",
        "type": "Hero",
        "fr": {
            "name": "Empereur Thaurissan"
        }
    },
    {
        "cardImage": "BRMA03_1.png",
        "set": "Blackrock Mountain",
        "name": "Emperor Thaurissan",
        "health": 30,
        "id": "BRMA03_1",
        "type": "Hero",
        "fr": {
            "name": "Empereur Thaurissan"
        }
    },
    {
        "cardImage": "BRM_028.png",
        "cost": 6,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Wayne Reynolds",
        "health": 5,
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing Blackrock Depths.",
        "fr": {
            "name": "Empereur Thaurissan"
        },
        "flavor": "His second greatest regret is summoning an evil Firelord who enslaved his entire people.",
        "elite": true,
        "attack": 5,
        "name": "Emperor Thaurissan",
        "howToGet": "Unlocked by completing Blackrock Depths.",
        "id": "BRM_028",
        "text": "At the end of your turn, reduce the Cost of cards in your hand by (1).",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA11_2H.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Essence of the Red",
        "id": "BRMA11_2H",
        "text": "<b>Hero Power</b>\nEach player draws 3 cards. Gain a Mana Crystal.",
        "type": "Hero Power",
        "fr": {
            "name": "Essence des Rouges"
        }
    },
    {
        "cardImage": "BRMA11_2.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Essence of the Red",
        "id": "BRMA11_2",
        "text": "<b>Hero Power</b>\nEach player draws 2 cards.",
        "type": "Hero Power",
        "fr": {
            "name": "Essence des Rouges"
        }
    },
    {
        "cardImage": "BRM_010b.png",
        "playerClass": "Druid",
        "set": "Blackrock Mountain",
        "race": "Beast",
        "name": "Fire Hawk Form",
        "id": "BRM_010b",
        "text": "Transform into a 2/5 minion.",
        "type": "Spell",
        "fr": {
            "name": "Forme de faucon-de-feu"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "BRM_010a.png",
        "playerClass": "Druid",
        "set": "Blackrock Mountain",
        "race": "Beast",
        "name": "Firecat Form",
        "id": "BRM_010a",
        "text": "Transform into a 5/2 minion.",
        "type": "Spell",
        "fr": {
            "name": "Forme de félin-de-feu"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "BRM_012.png",
        "cost": 4,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Paul Mafayon",
        "health": 6,
        "mechanics": [
            "Battlecry",
            "Overload"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Lord Victor Nefarius in Blackwing Lair.",
        "fr": {
            "name": "Destructeur garde du feu"
        },
        "flavor": "Ragnaros interviews hundreds of Fire Elementals for the position of \"Destroyer\" but very few have what it takes.",
        "playerClass": "Shaman",
        "attack": 3,
        "name": "Fireguard Destroyer",
        "howToGet": "Unlocked by defeating Lord Victor Nefarius in Blackwing Lair.",
        "id": "BRM_012",
        "text": "<b>Battlecry:</b> Gain 1-4 Attack. <b>Overload:</b> (1)",
        "rarity": "Common"
    },
    {
        "cardImage": "BRMA04_3.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "attack": 0,
        "name": "Firesworn",
        "health": 5,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "BRMA04_3",
        "text": "<b>Deathrattle:</b> Deal 1 damage to the enemy hero for each Firesworn that died this turn.",
        "type": "Minion",
        "fr": {
            "name": "Lige du feu"
        }
    },
    {
        "cardImage": "BRMA04_3H.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "attack": 0,
        "name": "Firesworn",
        "health": 5,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "BRMA04_3H",
        "text": "<b>Deathrattle:</b> Deal 3 damage to the enemy hero for each Firesworn that died this turn.",
        "type": "Minion",
        "fr": {
            "name": "Lige du feu"
        }
    },
    {
        "cardImage": "BRMA_01.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "name": "Flameheart",
        "id": "BRMA_01",
        "text": "Draw 2 cards.\nGain 4 Armor.",
        "type": "Spell",
        "fr": {
            "name": "Cœur-de-flammes"
        }
    },
    {
        "cardImage": "BRM_002.png",
        "cost": 3,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Alex Horley Orlandelli",
        "health": 4,
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Vaelastrasz in Blackwing Lair.",
        "fr": {
            "name": "Attise-flammes"
        },
        "flavor": "Flamewakers HATE being confused for Flamewalkers. They just wake up fire, they don’t walk on it. Walking on fire is CRAZY.",
        "playerClass": "Mage",
        "attack": 2,
        "name": "Flamewaker",
        "howToGet": "Unlocked by defeating Vaelastrasz in Blackwing Lair.",
        "id": "BRM_002",
        "text": "After you cast a spell, deal 2 damage randomly split among all enemies.",
        "rarity": "Rare"
    },
    {
        "cardImage": "BRMA06_4H.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "attack": 3,
        "name": "Flamewaker Acolyte",
        "health": 3,
        "id": "BRMA06_4H",
        "type": "Minion",
        "fr": {
            "name": "Acolyte attise-flammes"
        }
    },
    {
        "cardImage": "BRMA06_4.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "attack": 1,
        "name": "Flamewaker Acolyte",
        "health": 3,
        "id": "BRMA06_4",
        "type": "Minion",
        "fr": {
            "name": "Acolyte attise-flammes"
        }
    },
    {
        "cardImage": "BRM_007.png",
        "cost": 2,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Jim Nelson",
        "type": "Spell",
        "howToGetGold": "Can be crafted after defeating the Dark Iron Arena in Blackrock Depths.",
        "fr": {
            "name": "Recrutement"
        },
        "flavor": "If you are thinking about visiting Moonbrook, you better roll deep.",
        "playerClass": "Rogue",
        "name": "Gang Up",
        "howToGet": "Unlocked by defeating the Dark Iron Arena in Blackrock Depths.",
        "id": "BRM_007",
        "text": "Choose a minion. Shuffle 3 copies of it into your deck.",
        "rarity": "Common"
    },
    {
        "cardImage": "BRMA04_1H.png",
        "set": "Blackrock Mountain",
        "name": "Garr",
        "health": 45,
        "id": "BRMA04_1H",
        "type": "Hero",
        "fr": {
            "name": "Garr"
        }
    },
    {
        "cardImage": "BRMA04_1.png",
        "set": "Blackrock Mountain",
        "name": "Garr",
        "health": 30,
        "id": "BRMA04_1",
        "type": "Hero",
        "fr": {
            "name": "Garr"
        }
    },
    {
        "cardImage": "BRMA08_1H.png",
        "set": "Blackrock Mountain",
        "name": "General Drakkisath",
        "health": 50,
        "id": "BRMA08_1H",
        "type": "Hero",
        "fr": {
            "name": "Général Drakkisath"
        }
    },
    {
        "cardImage": "BRMA08_1.png",
        "set": "Blackrock Mountain",
        "name": "General Drakkisath",
        "health": 50,
        "id": "BRMA08_1",
        "type": "Hero",
        "fr": {
            "name": "Général Drakkisath"
        }
    },
    {
        "cardImage": "BRMA01_4.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "name": "Get 'em!",
        "id": "BRMA01_4",
        "text": "Summon four 1/1 Dwarves with <b>Taunt</b>.",
        "type": "Spell",
        "fr": {
            "name": "Chopez-les !"
        }
    },
    {
        "cardImage": "BRM_019.png",
        "cost": 5,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Bobby Chiu",
        "health": 3,
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating The Grim Guzzler in Blackrock Depths.",
        "fr": {
            "name": "Client sinistre"
        },
        "flavor": "If you love getting your face punched, come to the Grim Guzzler!",
        "attack": 3,
        "name": "Grim Patron",
        "howToGet": "Unlocked by defeating The Grim Guzzler in Blackrock Depths.",
        "id": "BRM_019",
        "text": "Whenever this minion survives damage, summon another Grim Patron.",
        "rarity": "Rare"
    },
    {
        "cardImage": "BRMA01_4t.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 1,
        "name": "Guzzler",
        "health": 1,
        "mechanics": [
            "Taunt"
        ],
        "id": "BRMA01_4t",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Écluseur"
        }
    },
    {
        "cardImage": "BRMA09_5t.png",
        "elite": true,
        "cost": 3,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "attack": 8,
        "name": "Gyth",
        "health": 4,
        "id": "BRMA09_5t",
        "type": "Minion",
        "fr": {
            "name": "Gyth"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA09_5Ht.png",
        "elite": true,
        "cost": 3,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "attack": 8,
        "name": "Gyth",
        "health": 8,
        "id": "BRMA09_5Ht",
        "type": "Minion",
        "fr": {
            "name": "Gyth"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA02_1.png",
        "set": "Blackrock Mountain",
        "name": "High Justice Grimstone",
        "health": 30,
        "id": "BRMA02_1",
        "type": "Hero",
        "fr": {
            "name": "Juge Supérieur Mornepierre"
        }
    },
    {
        "cardImage": "BRMA02_1H.png",
        "set": "Blackrock Mountain",
        "name": "High Justice Grimstone",
        "health": 30,
        "id": "BRMA02_1H",
        "type": "Hero",
        "fr": {
            "name": "Juge Supérieur Mornepierre"
        }
    },
    {
        "cardImage": "BRMA07_1H.png",
        "set": "Blackrock Mountain",
        "name": "Highlord Omokk",
        "health": 30,
        "id": "BRMA07_1H",
        "type": "Hero",
        "fr": {
            "name": "Généralissime Omokk"
        }
    },
    {
        "cardImage": "BRMA07_1.png",
        "set": "Blackrock Mountain",
        "name": "Highlord Omokk",
        "health": 30,
        "id": "BRMA07_1",
        "type": "Hero",
        "fr": {
            "name": "Généralissime Omokk"
        }
    },
    {
        "cardImage": "BRM_026.png",
        "cost": 4,
        "collectible": true,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "artist": "John Polidora",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Chromaggus in Blackwing Lair.",
        "fr": {
            "name": "Dragon affamé"
        },
        "flavor": "Hungry Hungry Dragon is NOT a fun game.",
        "attack": 5,
        "name": "Hungry Dragon",
        "howToGet": "Unlocked by defeating Chromaggus in Blackwing Lair.",
        "id": "BRM_026",
        "text": "<b>Battlecry:</b> Summon a random 1-Cost minion for your opponent.",
        "rarity": "Common"
    },
    {
        "set": "Blackrock Mountain",
        "name": "I hear you...",
        "id": "BRMA16_5e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Je vous entends…"
        }
    },
    {
        "cardImage": "BRMA05_2H.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Ignite Mana",
        "id": "BRMA05_2H",
        "text": "<b>Hero Power</b>\nDeal 10 damage to the enemy hero if they have any unspent Mana.",
        "type": "Hero Power",
        "fr": {
            "name": "Mana enflammé"
        }
    },
    {
        "cardImage": "BRMA05_2.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Ignite Mana",
        "id": "BRMA05_2",
        "text": "<b>Hero Power</b>\nDeal 5 damage to the enemy hero if they have any unspent Mana.",
        "type": "Hero Power",
        "fr": {
            "name": "Mana enflammé"
        }
    },
    {
        "cardImage": "BRM_006t.png",
        "playerClass": "Warlock",
        "cost": 1,
        "set": "Blackrock Mountain",
        "race": "Demon",
        "attack": 1,
        "name": "Imp",
        "health": 1,
        "id": "BRM_006t",
        "type": "Minion",
        "fr": {
            "name": "Diablotin"
        }
    },
    {
        "cardImage": "BRM_006.png",
        "cost": 3,
        "collectible": true,
        "set": "Blackrock Mountain",
        "race": "Demon",
        "artist": "Steve Prescott",
        "health": 4,
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Majordomo Executus in Molten Core.",
        "fr": {
            "name": "Chef du gang des diablotins"
        },
        "flavor": "His imp gang likes to sneak into Stormwind to spraypaint \"Ragnaros Rulez\" on the Mage Tower.",
        "playerClass": "Warlock",
        "attack": 2,
        "name": "Imp Gang Boss",
        "howToGet": "Unlocked by defeating Majordomo Executus in Molten Core.",
        "id": "BRM_006",
        "text": "Whenever this minion takes damage, summon a 1/1 Imp.",
        "rarity": "Common"
    },
    {
        "set": "Blackrock Mountain",
        "name": "Imperial Favor",
        "id": "BRM_028e",
        "text": "Costs (1) less.",
        "type": "Enchantment",
        "fr": {
            "name": "Faveur impériale"
        }
    },
    {
        "set": "Blackrock Mountain",
        "name": "Incubation",
        "id": "BRMA10_3e",
        "text": "Increased Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Incubation"
        }
    },
    {
        "cardImage": "BRMA08_2.png",
        "set": "Blackrock Mountain",
        "name": "Intense Gaze",
        "id": "BRMA08_2",
        "text": "<b>Passive Hero Power</b>\nAll cards cost (1). Players are capped at 1 Mana Crystal.",
        "type": "Hero Power",
        "fr": {
            "name": "Regard intense"
        }
    },
    {
        "cardImage": "BRMA08_2H.png",
        "set": "Blackrock Mountain",
        "name": "Intense Gaze",
        "id": "BRMA08_2H",
        "text": "<b>Passive Hero Power</b>\nAll cards cost (1). You are capped at 2 Mana Crystals, and opponent at 1.",
        "type": "Hero Power",
        "fr": {
            "name": "Regard intense"
        }
    },
    {
        "cardImage": "BRMA02_2H.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Jeering Crowd",
        "id": "BRMA02_2H",
        "text": "<b>Hero Power</b>\nSummon a 1/1 Spectator with <b>Taunt</b>.",
        "type": "Hero Power",
        "fr": {
            "name": "Foule moqueuse"
        }
    },
    {
        "cardImage": "BRMA02_2.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Jeering Crowd",
        "id": "BRMA02_2",
        "text": "<b>Hero Power</b>\nSummon a 1/1 Spectator with <b>Taunt</b>.",
        "type": "Hero Power",
        "fr": {
            "name": "Foule moqueuse"
        }
    },
    {
        "set": "Blackrock Mountain",
        "name": "Large Talons",
        "id": "BRM_024e",
        "text": "+3/+3.",
        "type": "Enchantment",
        "fr": {
            "name": "Grandes griffes"
        }
    },
    {
        "cardImage": "BRM_011.png",
        "cost": 2,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Zoltan Boros",
        "type": "Spell",
        "howToGetGold": "Can be crafted after completing the Shaman Class Challenge in Blackrock Mountain.",
        "fr": {
            "name": "Horion de lave"
        },
        "flavor": "Chocolate lava cake is shockingly delicious.",
        "playerClass": "Shaman",
        "name": "Lava Shock",
        "howToGet": "Unlocked by completing the Shaman Class Challenge in Blackrock Mountain.",
        "id": "BRM_011",
        "text": "Deal $2 damage.\nUnlock your <b>Overloaded</b> Mana Crystals.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Shaman",
        "set": "Blackrock Mountain",
        "name": "Lava Shock",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "BRM_011t",
        "text": "Cards you play this turn don't cause <b>Overload</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Horion de lave"
        }
    },
    {
        "cardImage": "BRMA17_4.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "LAVA!",
        "id": "BRMA17_4",
        "text": "Deal $2 damage to all minions.",
        "type": "Spell",
        "fr": {
            "name": "LAVE !"
        }
    },
    {
        "set": "Blackrock Mountain",
        "name": "Living Bomb",
        "id": "BRMA05_3He",
        "text": "On Geddon's turn, deal 10 damage to all of your stuff.",
        "type": "Enchantment",
        "fr": {
            "name": "Bombe vivante"
        }
    },
    {
        "cardImage": "BRMA05_3H.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "name": "Living Bomb",
        "id": "BRMA05_3H",
        "text": "Choose an enemy minion. If it lives until your next turn, deal $10 damage to all enemies.",
        "type": "Spell",
        "fr": {
            "name": "Bombe vivante"
        }
    },
    {
        "set": "Blackrock Mountain",
        "name": "Living Bomb",
        "id": "BRMA05_3e",
        "text": "On Geddon's turn, deal 5 damage to all of your stuff.",
        "type": "Enchantment",
        "fr": {
            "name": "Bombe vivante"
        }
    },
    {
        "cardImage": "BRMA05_3.png",
        "cost": 4,
        "set": "Blackrock Mountain",
        "name": "Living Bomb",
        "id": "BRMA05_3",
        "text": "Choose an enemy minion. If it lives until your next turn, deal $5 damage to all enemies.",
        "type": "Spell",
        "fr": {
            "name": "Bombe vivante"
        }
    },
    {
        "cardImage": "BRMA13_6.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "attack": 6,
        "name": "Living Lava",
        "health": 6,
        "mechanics": [
            "Taunt"
        ],
        "id": "BRMA13_6",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Lave vivante"
        }
    },
    {
        "cardImage": "BRMA13_1.png",
        "set": "Blackrock Mountain",
        "name": "Lord Victor Nefarius",
        "health": 30,
        "id": "BRMA13_1",
        "type": "Hero",
        "fr": {
            "name": "Seigneur Victor Nefarius"
        }
    },
    {
        "cardImage": "BRMA13_1H.png",
        "set": "Blackrock Mountain",
        "name": "Lord Victor Nefarius",
        "health": 30,
        "id": "BRMA13_1H",
        "type": "Hero",
        "fr": {
            "name": "Seigneur Victor Nefarius"
        }
    },
    {
        "cardImage": "BRMA04_2.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Magma Pulse",
        "id": "BRMA04_2",
        "text": "<b>Hero Power</b>\nDeal 1 damage to all minions.",
        "type": "Hero Power",
        "fr": {
            "name": "Impulsion de magma"
        }
    },
    {
        "cardImage": "BRMA14_9.png",
        "cost": 5,
        "set": "Blackrock Mountain",
        "race": "Mech",
        "health": 7,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Magmatron"
        },
        "elite": true,
        "attack": 7,
        "name": "Magmatron",
        "id": "BRMA14_9",
        "text": "Whenever a player plays a card, Magmatron deals 2 damage to them.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA14_9H.png",
        "cost": 5,
        "set": "Blackrock Mountain",
        "race": "Mech",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Magmatron"
        },
        "elite": true,
        "attack": 8,
        "name": "Magmatron",
        "id": "BRMA14_9H",
        "text": "Whenever a player plays a card, Magmatron deals 2 damage to them.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA14_12.png",
        "cost": 5,
        "set": "Blackrock Mountain",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Magmagueule"
        },
        "elite": true,
        "attack": 10,
        "name": "Magmaw",
        "id": "BRMA14_12",
        "text": "<b>Taunt</b>",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA06_1H.png",
        "set": "Blackrock Mountain",
        "name": "Majordomo Executus",
        "health": 30,
        "id": "BRMA06_1H",
        "type": "Hero",
        "fr": {
            "name": "Chambellan Executus"
        }
    },
    {
        "cardImage": "BRMA06_1.png",
        "set": "Blackrock Mountain",
        "name": "Majordomo Executus",
        "health": 30,
        "id": "BRMA06_1",
        "type": "Hero",
        "fr": {
            "name": "Chambellan Executus"
        }
    },
    {
        "cardImage": "BRM_027.png",
        "cost": 9,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Alex Horley Orlandelli",
        "health": 7,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing Molten Core.",
        "fr": {
            "name": "Chambellan Executus"
        },
        "flavor": "You thought Executus turned you into Ragnaros, but really Ragnaros was in you the whole time.",
        "elite": true,
        "attack": 9,
        "name": "Majordomo Executus",
        "howToGet": "Unlocked by completing Molten Core.",
        "id": "BRM_027",
        "text": "<b>Deathrattle:</b> Replace your hero with Ragnaros, the Firelord.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA15_1H.png",
        "set": "Blackrock Mountain",
        "name": "Maloriak",
        "health": 30,
        "id": "BRMA15_1H",
        "type": "Hero",
        "fr": {
            "name": "Maloriak"
        }
    },
    {
        "cardImage": "BRMA15_1.png",
        "set": "Blackrock Mountain",
        "name": "Maloriak",
        "health": 30,
        "id": "BRMA15_1",
        "type": "Hero",
        "fr": {
            "name": "Maloriak"
        }
    },
    {
        "cardImage": "BRMA07_2.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "ME SMASH",
        "id": "BRMA07_2",
        "text": "<b>Hero Power</b>\nDestroy a random damaged enemy minion.",
        "type": "Hero Power",
        "fr": {
            "name": "MOI TOUT CASSER"
        }
    },
    {
        "cardImage": "BRMA07_2H.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "ME SMASH",
        "id": "BRMA07_2H",
        "text": "<b>Hero Power</b>\nDestroy a random enemy minion.",
        "type": "Hero Power",
        "fr": {
            "name": "MOI TOUT CASSER"
        }
    },
    {
        "playerClass": "Priest",
        "set": "Blackrock Mountain",
        "name": "Melt",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "BRM_001e",
        "text": "Attack changed to 0 this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Fondre"
        }
    },
    {
        "cardImage": "BRMA03_3.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "attack": 1,
        "name": "Moira Bronzebeard",
        "health": 3,
        "mechanics": [
            "Aura"
        ],
        "id": "BRMA03_3",
        "text": "Thaurissan's Hero Power can't be used.\nNever attacks minions unless they have <b>Taunt</b>.",
        "type": "Minion",
        "fr": {
            "name": "Moira Barbe-de-Bronze"
        }
    },
    {
        "cardImage": "BRMA03_3H.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "attack": 3,
        "name": "Moira Bronzebeard",
        "health": 1,
        "mechanics": [
            "Aura"
        ],
        "id": "BRMA03_3H",
        "text": "Thaurissan's Hero Power can't be used.\nNever attacks minions unless they have <b>Taunt</b>.",
        "type": "Minion",
        "fr": {
            "name": "Moira Barbe-de-Bronze"
        }
    },
    {
        "cardImage": "BRMA12_10.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Mutation",
        "id": "BRMA12_10",
        "text": "<b>Hero Power</b>\nDiscard a random card.",
        "type": "Hero Power",
        "fr": {
            "name": "Mutation"
        }
    },
    {
        "cardImage": "BRM_030.png",
        "cost": 9,
        "collectible": true,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "artist": "Ruan Jia",
        "health": 8,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Hidden Laboratory.",
        "fr": {
            "name": "Nefarian"
        },
        "flavor": "They call him \"Blackwing\" because he's a black dragon...... and he's got wings.",
        "elite": true,
        "attack": 8,
        "name": "Nefarian",
        "howToGet": "Unlocked by defeating every boss in Blackrock Mountain!",
        "id": "BRM_030",
        "text": "<b>Battlecry:</b> Add 2 random spells to your hand <i>(from your opponent's class)</i>.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA17_2H.png",
        "set": "Blackrock Mountain",
        "name": "Nefarian",
        "health": 30,
        "id": "BRMA17_2H",
        "type": "Hero",
        "fr": {
            "name": "Nefarian"
        }
    },
    {
        "cardImage": "BRMA13_3H.png",
        "set": "Blackrock Mountain",
        "name": "Nefarian",
        "health": 30,
        "id": "BRMA13_3H",
        "type": "Hero",
        "fr": {
            "name": "Nefarian"
        }
    },
    {
        "cardImage": "BRMA17_2.png",
        "set": "Blackrock Mountain",
        "name": "Nefarian",
        "health": 30,
        "id": "BRMA17_2",
        "type": "Hero",
        "fr": {
            "name": "Nefarian"
        }
    },
    {
        "cardImage": "BRMA13_3.png",
        "set": "Blackrock Mountain",
        "name": "Nefarian",
        "health": 30,
        "id": "BRMA13_3",
        "type": "Hero",
        "fr": {
            "name": "Nefarian"
        }
    },
    {
        "cardImage": "BRMA17_8.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Nefarian Strikes!",
        "id": "BRMA17_8",
        "text": "<b>Hero Power</b>\nNefarian rains fire from above!",
        "type": "Hero Power",
        "fr": {
            "name": "Frappe de Nefarian"
        }
    },
    {
        "cardImage": "BRMA17_8H.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Nefarian Strikes!",
        "id": "BRMA17_8H",
        "text": "<b>Hero Power</b>\nNefarian rains fire from above!",
        "type": "Hero Power",
        "fr": {
            "name": "Frappe de Nefarian"
        }
    },
    {
        "cardImage": "BRMA09_3.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Old Horde",
        "id": "BRMA09_3",
        "text": "<b>Hero Power</b>\nSummon two 1/1 Orcs with <b>Taunt</b>. Get a new Hero Power.",
        "type": "Hero Power",
        "fr": {
            "name": "Ancienne Horde"
        }
    },
    {
        "cardImage": "BRMA09_3H.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Old Horde",
        "id": "BRMA09_3H",
        "text": "<b>Hero Power</b>\nSummon two 2/2 Orcs with <b>Taunt</b>. Get a new Hero Power.",
        "type": "Hero Power",
        "fr": {
            "name": "Ancienne Horde"
        }
    },
    {
        "cardImage": "BRMA09_3Ht.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 2,
        "name": "Old Horde Orc",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "id": "BRMA09_3Ht",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Orc de l’ancienne Horde"
        }
    },
    {
        "cardImage": "BRMA09_3t.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 1,
        "name": "Old Horde Orc",
        "health": 1,
        "mechanics": [
            "Taunt"
        ],
        "id": "BRMA09_3t",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Orc de l’ancienne Horde"
        }
    },
    {
        "cardImage": "BRMA14_1H.png",
        "set": "Blackrock Mountain",
        "name": "Omnotron Defense System",
        "health": 30,
        "id": "BRMA14_1H",
        "type": "Hero",
        "fr": {
            "name": "Système de défense Omnitron"
        }
    },
    {
        "cardImage": "BRMA14_1.png",
        "set": "Blackrock Mountain",
        "name": "Omnotron Defense System",
        "health": 30,
        "id": "BRMA14_1",
        "type": "Hero",
        "fr": {
            "name": "Système de défense Omnitron"
        }
    },
    {
        "set": "Blackrock Mountain",
        "name": "On Fire!",
        "id": "BRM_012e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "En feu !"
        }
    },
    {
        "cardImage": "BRMA17_3H.png",
        "set": "Blackrock Mountain",
        "name": "Onyxia",
        "health": 30,
        "id": "BRMA17_3H",
        "type": "Hero",
        "fr": {
            "name": "Onyxia"
        }
    },
    {
        "cardImage": "BRMA17_3.png",
        "set": "Blackrock Mountain",
        "name": "Onyxia",
        "health": 15,
        "id": "BRMA17_3",
        "type": "Hero",
        "fr": {
            "name": "Onyxia"
        }
    },
    {
        "cardImage": "BRMA17_9.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "attack": 2,
        "durability": 6,
        "name": "Onyxiclaw",
        "id": "BRMA17_9",
        "type": "Weapon",
        "fr": {
            "name": "Onyxigriffe"
        }
    },
    {
        "cardImage": "BRMA09_2.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Open the Gates",
        "id": "BRMA09_2",
        "text": "<b>Hero Power</b>\nSummon three 1/1 Whelps. Get a new Hero Power.",
        "type": "Hero Power",
        "fr": {
            "name": "Ouvrir les portes"
        }
    },
    {
        "cardImage": "BRMA09_2H.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Open the Gates",
        "id": "BRMA09_2H",
        "text": "<b>Hero Power</b>\nSummon three 2/2 Whelps. Get a new Hero Power.",
        "type": "Hero Power",
        "fr": {
            "name": "Ouvrir les portes"
        }
    },
    {
        "cardImage": "BRMA01_2.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Pile On!",
        "id": "BRMA01_2",
        "text": "<b>Hero Power</b>\nPut a minion from each deck into the battlefield.",
        "type": "Hero Power",
        "fr": {
            "name": "Jeu forcé !"
        }
    },
    {
        "cardImage": "BRMA01_2H.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Pile On!",
        "id": "BRMA01_2H",
        "text": "<b>Hero Power</b>\nPut two minions from your deck and one from your opponent's into the battlefield.",
        "type": "Hero Power",
        "fr": {
            "name": "Jeu forcé !"
        }
    },
    {
        "set": "Blackrock Mountain",
        "name": "Potion of Might",
        "id": "BRMA15_2He",
        "text": "+2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Potion de puissance"
        }
    },
    {
        "cardImage": "BRMA03_2.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Power of the Firelord",
        "id": "BRMA03_2",
        "text": "<b>Hero Power</b>\nDeal 30 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Puissance de Ragnaros"
        }
    },
    {
        "playerClass": "Hunter",
        "set": "Blackrock Mountain",
        "name": "Power Rager",
        "id": "BRM_014e",
        "text": "+3/+3",
        "type": "Enchantment",
        "fr": {
            "name": "Rage puissante"
        }
    },
    {
        "cardImage": "BRM_013.png",
        "cost": 2,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Jonboy Meyers",
        "mechanics": [
            "AffectedBySpellPower"
        ],
        "type": "Spell",
        "howToGetGold": "Can be crafted after completing the Hunter Class Challenge in Blackrock Mountain.",
        "fr": {
            "name": "Tir réflexe"
        },
        "flavor": "Han shot first.",
        "playerClass": "Hunter",
        "name": "Quick Shot",
        "howToGet": "Unlocked by completing the Hunter Class Challenge in Blackrock Mountain.",
        "id": "BRM_013",
        "text": "Deal $3 damage.\nIf your hand is empty, draw a card.",
        "rarity": "Common"
    },
    {
        "cardImage": "BRMA06_3.png",
        "set": "Blackrock Mountain",
        "name": "Ragnaros the Firelord",
        "health": 8,
        "id": "BRMA06_3",
        "type": "Hero",
        "fr": {
            "name": "Ragnaros, seigneur du feu"
        }
    },
    {
        "cardImage": "BRM_027h.png",
        "set": "Blackrock Mountain",
        "name": "Ragnaros the Firelord",
        "health": 8,
        "id": "BRM_027h",
        "type": "Hero",
        "fr": {
            "name": "Ragnaros, seigneur du feu"
        }
    },
    {
        "cardImage": "BRMA06_3H.png",
        "set": "Blackrock Mountain",
        "name": "Ragnaros the Firelord",
        "health": 30,
        "id": "BRMA06_3H",
        "type": "Hero",
        "fr": {
            "name": "Ragnaros, seigneur du feu"
        }
    },
    {
        "cardImage": "BRMA10_1.png",
        "set": "Blackrock Mountain",
        "name": "Razorgore the Untamed",
        "health": 30,
        "id": "BRMA10_1",
        "type": "Hero",
        "fr": {
            "name": "Tranchetripe l’Indompté"
        }
    },
    {
        "cardImage": "BRMA10_1H.png",
        "set": "Blackrock Mountain",
        "name": "Razorgore the Untamed",
        "health": 30,
        "id": "BRMA10_1H",
        "type": "Hero",
        "fr": {
            "name": "Tranchetripe l’Indompté"
        }
    },
    {
        "cardImage": "BRMA10_6.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 1,
        "durability": 5,
        "name": "Razorgore's Claws",
        "id": "BRMA10_6",
        "text": "Whenever a Corrupted Egg dies, gain +1 Attack.",
        "type": "Weapon",
        "fr": {
            "name": "Griffes de Tranchetripe"
        }
    },
    {
        "cardImage": "BRMA14_11.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "Recharge",
        "id": "BRMA14_11",
        "text": "Fill all empty Mana Crystals.",
        "type": "Spell",
        "fr": {
            "name": "Recharge"
        }
    },
    {
        "cardImage": "BRMA15_3.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "Release the Aberrations!",
        "id": "BRMA15_3",
        "text": "Summon 3 Aberrations.",
        "type": "Spell",
        "fr": {
            "name": "Libérer les aberrations"
        }
    },
    {
        "cardImage": "BRMA09_1H.png",
        "set": "Blackrock Mountain",
        "name": "Rend Blackhand",
        "health": 30,
        "id": "BRMA09_1H",
        "type": "Hero",
        "fr": {
            "name": "Rend Main-Noire"
        }
    },
    {
        "cardImage": "BRMA09_1.png",
        "set": "Blackrock Mountain",
        "name": "Rend Blackhand",
        "health": 30,
        "id": "BRMA09_1",
        "type": "Hero",
        "fr": {
            "name": "Rend Main-Noire"
        }
    },
    {
        "cardImage": "BRM_029.png",
        "cost": 7,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Alex Horley",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing Blackrock Spire.",
        "fr": {
            "name": "Rend Main-Noire"
        },
        "flavor": "Rend believes he is the True Warchief of the Horde and he keeps editing the wikipedia page for \"Warchief of the Horde\" to include his picture.",
        "elite": true,
        "attack": 8,
        "name": "Rend Blackhand",
        "howToGet": "Unlocked by completing Blackrock Spire.",
        "id": "BRM_029",
        "text": "<b>Battlecry:</b> If you're holding a Dragon, destroy a <b>Legendary</b> minion.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRM_017.png",
        "cost": 2,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Luke Mancini",
        "type": "Spell",
        "howToGetGold": "Can be crafted after defeating Emperor Thaurissan in Blackrock Depths.",
        "fr": {
            "name": "Ressusciter"
        },
        "flavor": "I walked into the dungeon and noticed a slain adventurer. In his final moments, he had scrawled out a message in the dust on the wall beside him. Two words: \"rez plz\"",
        "playerClass": "Priest",
        "name": "Resurrect",
        "howToGet": "Unlocked by defeating Emperor Thaurissan in Blackrock Depths.",
        "id": "BRM_017",
        "text": "Summon a random friendly minion that died this game.",
        "rarity": "Rare"
    },
    {
        "cardImage": "BRM_015.png",
        "cost": 2,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Ben Olson",
        "type": "Spell",
        "howToGetGold": "Can be crafted after defeating Razorgore in Blackwing Lair.",
        "fr": {
            "name": "Revanche"
        },
        "flavor": "This is better than Arcane Explosion, so I guess warriors are finally getting revenge on mages for Mortal Strike being worse than Fireball.",
        "playerClass": "Warrior",
        "name": "Revenge",
        "howToGet": "Unlocked by defeating Razorgore in Blackwing Lair.",
        "id": "BRM_015",
        "text": "Deal $1 damage to all minions. If you have 12 or less Health, deal $3 damage instead.",
        "rarity": "Rare"
    },
    {
        "cardImage": "BRMA16_4.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Reverberating Gong",
        "id": "BRMA16_4",
        "text": "Destroy your opponent's weapon.",
        "type": "Spell",
        "fr": {
            "name": "Gong réverbérant"
        }
    },
    {
        "cardImage": "BRMA04_4H.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "name": "Rock Out",
        "mechanics": [
            "Overload"
        ],
        "id": "BRMA04_4H",
        "text": "Summon 3 Firesworn. <b>Overload:</b> (2)",
        "type": "Spell",
        "fr": {
            "name": "Déchaînement"
        }
    },
    {
        "cardImage": "BRMA04_4.png",
        "cost": 3,
        "set": "Blackrock Mountain",
        "name": "Rock Out",
        "mechanics": [
            "Overload"
        ],
        "id": "BRMA04_4",
        "text": "Summon 3 Firesworn. <b>Overload:</b> (2)",
        "type": "Spell",
        "fr": {
            "name": "Déchaînement"
        }
    },
    {
        "cardImage": "BRM_001.png",
        "cost": 5,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Jaime Jones",
        "type": "Spell",
        "howToGetGold": "Can be crafted after completing the Paladin Class Challenge in Blackrock Mountain.",
        "fr": {
            "name": "Veille solennelle"
        },
        "flavor": "Each year, folk gather in front of Blackrock Mountain to mourn those who were mind-controlled into the lava.",
        "playerClass": "Paladin",
        "name": "Solemn Vigil",
        "howToGet": "Unlocked by completing the Paladin Class Challenge in Blackrock Mountain.",
        "id": "BRM_001",
        "text": "Draw 2 cards. Costs (1) less for each minion that died this turn.",
        "rarity": "Common"
    },
    {
        "cardImage": "BRMA13_5.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "attack": 6,
        "name": "Son of the Flame",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "id": "BRMA13_5",
        "text": "<b>Battlecry:</b> Deal 6 damage.",
        "type": "Minion",
        "fr": {
            "name": "Fils de la Flamme"
        }
    },
    {
        "cardImage": "BRMA16_3.png",
        "cost": 4,
        "set": "Blackrock Mountain",
        "name": "Sonic Breath",
        "id": "BRMA16_3",
        "text": "Deal $3 damage to a minion. Give your weapon +3 Attack.",
        "type": "Spell",
        "fr": {
            "name": "Souffle sonique"
        }
    },
    {
        "set": "Blackrock Mountain",
        "name": "Sonic Breath",
        "id": "BRMA16_3e",
        "text": "+3 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Souffle sonique"
        }
    },
    {
        "cardImage": "BRM_030t.png",
        "cost": 4,
        "set": "Blackrock Mountain",
        "name": "Tail Swipe",
        "id": "BRM_030t",
        "text": "Deal $4 damage.",
        "type": "Spell",
        "fr": {
            "name": "Balayage de queue"
        }
    },
    {
        "cardImage": "BRMA15_2.png",
        "set": "Blackrock Mountain",
        "name": "The Alchemist",
        "id": "BRMA15_2",
        "text": "<b>Passive Hero Power</b>\nWhenever a minion is summoned, swap its Attack and Health.",
        "type": "Hero Power",
        "fr": {
            "name": "L’alchimiste"
        }
    },
    {
        "cardImage": "BRMA15_2H.png",
        "set": "Blackrock Mountain",
        "name": "The Alchemist",
        "id": "BRMA15_2H",
        "text": "<b>Passive Hero Power</b>\nMinions' Attack and Health are swapped.\nYour minions have +2/+2.",
        "type": "Hero Power",
        "fr": {
            "name": "L’alchimiste"
        }
    },
    {
        "cardImage": "BRMA06_2.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "The Majordomo",
        "id": "BRMA06_2",
        "text": "<b>Hero Power</b>\nSummon a 1/3 Flamewaker Acolyte.",
        "type": "Hero Power",
        "fr": {
            "name": "Le chambellan"
        }
    },
    {
        "cardImage": "BRMA06_2H.png",
        "cost": 2,
        "set": "Blackrock Mountain",
        "name": "The Majordomo",
        "id": "BRMA06_2H",
        "text": "<b>Hero Power</b>\nSummon a 3/3 Flamewaker Acolyte.",
        "type": "Hero Power",
        "fr": {
            "name": "Le chambellan"
        }
    },
    {
        "cardImage": "BRMA10_3H.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "name": "The Rookery",
        "id": "BRMA10_3H",
        "text": "<b>Hero Power</b>\nGive all Corrupted Eggs +1 Health, then summon one.",
        "type": "Hero Power",
        "fr": {
            "name": "La colonie"
        }
    },
    {
        "cardImage": "BRMA10_3.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "The Rookery",
        "id": "BRMA10_3",
        "text": "<b>Hero Power</b>\nGive all Corrupted Eggs +1 Health, then summon one.",
        "type": "Hero Power",
        "fr": {
            "name": "La colonie"
        }
    },
    {
        "cardImage": "BRMA09_6.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "The True Warchief",
        "id": "BRMA09_6",
        "text": "Destroy a Legendary minion.",
        "type": "Spell",
        "fr": {
            "name": "Véritable chef de guerre"
        }
    },
    {
        "cardImage": "BRMA07_3.png",
        "cost": 4,
        "set": "Blackrock Mountain",
        "name": "TIME FOR SMASH",
        "id": "BRMA07_3",
        "text": "Deal $5 damage to a random enemy. Gain 5 Armor.",
        "type": "Spell",
        "fr": {
            "name": "CASSE-TÊTE"
        }
    },
    {
        "cardImage": "BRMA14_5.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "race": "Mech",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Toxitron"
        },
        "elite": true,
        "attack": 3,
        "name": "Toxitron",
        "id": "BRMA14_5",
        "text": "At the start of your turn, deal 1 damage to all other minions.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA14_5H.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "race": "Mech",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Toxitron"
        },
        "elite": true,
        "attack": 4,
        "name": "Toxitron",
        "id": "BRMA14_5H",
        "text": "At the start of your turn, deal 1 damage to all other minions.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "BRMA13_2.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "True Form",
        "id": "BRMA13_2",
        "text": "<b>Hero Power</b>\nLet the games begin!",
        "type": "Hero Power",
        "fr": {
            "name": "Forme véritable"
        }
    },
    {
        "cardImage": "BRMA13_2H.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "True Form",
        "id": "BRMA13_2H",
        "text": "<b>Hero Power</b>\nLet the games begin!",
        "type": "Hero Power",
        "fr": {
            "name": "Forme véritable"
        }
    },
    {
        "set": "Blackrock Mountain",
        "name": "Twilight Endurance",
        "id": "BRM_004e",
        "text": "Increased Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Endurance du Crépuscule"
        }
    },
    {
        "cardImage": "BRM_004.png",
        "cost": 1,
        "collectible": true,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "artist": "Sam Nielson",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Priest Class Challenge in Blackrock Mountain.",
        "fr": {
            "name": "Dragonnet du Crépuscule"
        },
        "flavor": "The twilight whelps are basically magic-vampires. Despite this, they are not a reference to any popular series of novels.",
        "playerClass": "Priest",
        "attack": 2,
        "name": "Twilight Whelp",
        "howToGet": "Unlocked by completing the Priest Class Challenge in Blackrock Mountain.",
        "id": "BRM_004",
        "text": "<b>Battlecry:</b> If you're holding a Dragon, gain +2 Health.",
        "rarity": "Common"
    },
    {
        "playerClass": "Paladin",
        "set": "Blackrock Mountain",
        "name": "Unchained!",
        "id": "BRM_018e",
        "text": "Your next Dragon costs (2) less.",
        "type": "Enchantment",
        "fr": {
            "name": "Libéré !"
        }
    },
    {
        "cardImage": "BRMA11_1H.png",
        "set": "Blackrock Mountain",
        "name": "Vaelastrasz the Corrupt",
        "health": 30,
        "id": "BRMA11_1H",
        "type": "Hero",
        "fr": {
            "name": "Vaelastrasz le Corrompu"
        }
    },
    {
        "cardImage": "BRMA11_1.png",
        "set": "Blackrock Mountain",
        "name": "Vaelastrasz the Corrupt",
        "health": 30,
        "id": "BRMA11_1",
        "type": "Hero",
        "fr": {
            "name": "Vaelastrasz le Corrompu"
        }
    },
    {
        "cardImage": "BRM_025.png",
        "cost": 6,
        "collectible": true,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "artist": "Lucas Graciano",
        "health": 4,
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Omnotron Defense System in the Hidden Laboratory.",
        "fr": {
            "name": "Drake volcanique"
        },
        "flavor": "Volcanic Drakes breathe lava instead of fire. The antacid vendor at Thorium Point does a brisk business with them.",
        "attack": 6,
        "name": "Volcanic Drake",
        "howToGet": "Unlocked by defeating Omnotron Defense System in the Hidden Laboratory.",
        "id": "BRM_025",
        "text": "Costs (1) less for each minion that died this turn.",
        "rarity": "Common"
    },
    {
        "cardImage": "BRM_009.png",
        "cost": 9,
        "collectible": true,
        "set": "Blackrock Mountain",
        "artist": "Trent Kaniuga",
        "health": 8,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Druid Class Challenge in Blackrock Mountain.",
        "fr": {
            "name": "Lourdaud volcanique"
        },
        "flavor": "The roots, the roots, the roots is on fire!",
        "playerClass": "Druid",
        "attack": 7,
        "name": "Volcanic Lumberer",
        "howToGet": "Unlocked by completing the Druid Class Challenge in Blackrock Mountain.",
        "id": "BRM_009",
        "text": "<b>Taunt</b>\nCosts (1) less for each minion that died this turn.",
        "rarity": "Rare"
    },
    {
        "cardImage": "BRM_004t.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "attack": 1,
        "name": "Whelp",
        "health": 1,
        "id": "BRM_004t",
        "type": "Minion",
        "fr": {
            "name": "Dragonnet"
        }
    },
    {
        "cardImage": "BRMA09_2t.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "attack": 1,
        "name": "Whelp",
        "health": 1,
        "id": "BRMA09_2t",
        "type": "Minion",
        "fr": {
            "name": "Dragonnet"
        }
    },
    {
        "cardImage": "BRMA09_2Ht.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "race": "Dragon",
        "attack": 2,
        "name": "Whelp",
        "health": 2,
        "id": "BRMA09_2Ht",
        "type": "Minion",
        "fr": {
            "name": "Dragonnet"
        }
    },
    {
        "cardImage": "BRMA13_7.png",
        "cost": 0,
        "set": "Blackrock Mountain",
        "attack": 4,
        "name": "Whirling Ash",
        "health": 5,
        "mechanics": [
            "Windfury"
        ],
        "id": "BRMA13_7",
        "text": "<b>Windfury</b>",
        "type": "Minion",
        "fr": {
            "name": "Cendres tourbillonnantes"
        }
    },
    {
        "cardImage": "BRMA13_4.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Wild Magic",
        "id": "BRMA13_4",
        "text": "<b>Hero Power</b>\nPut a random spell from your opponent's class into your hand.",
        "type": "Hero Power",
        "fr": {
            "name": "Magie sauvage"
        }
    },
    {
        "cardImage": "BRMA13_4H.png",
        "cost": 1,
        "set": "Blackrock Mountain",
        "name": "Wild Magic",
        "id": "BRMA13_4H",
        "text": "<b>Hero Power</b>\nPut a random spell from your opponent's class into your hand.",
        "type": "Hero Power",
        "fr": {
            "name": "Magie sauvage"
        }
    },
    {
        "set": "Classic",
        "name": "'Inspired'",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "CS2_188o",
        "text": "This minion has +2 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "« Inspiré »"
        }
    },
    {
        "cardImage": "EX1_097.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "health": 4,
        "mechanics": [
            "Deathrattle",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Abomination"
        },
        "flavor": "Abominations enjoy Fresh Meat and long walks on the beach.",
        "attack": 4,
        "faction": "Neutral",
        "name": "Abomination",
        "id": "EX1_097",
        "text": "<b>Taunt</b>. <b>Deathrattle:</b> Deal 2 damage to ALL characters.",
        "rarity": "Rare"
    },
    {
        "cardImage": "CS2_188.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Luca Zontini",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Sergent grossier"
        },
        "flavor": "ADD ME TO YOUR DECK, MAGGOT!",
        "attack": 2,
        "faction": "Alliance",
        "name": "Abusive Sergeant",
        "id": "CS2_188",
        "text": "<b>Battlecry:</b> Give a minion +2 Attack this turn.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_007.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Dave Kendall",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Acolyte de la souffrance"
        },
        "flavor": "He trained when he was younger to be an acolyte of joy, but things didn’t work out like he thought they would.",
        "attack": 1,
        "name": "Acolyte of Pain",
        "id": "EX1_007",
        "text": "Whenever this minion takes damage, draw a card.",
        "rarity": "Common"
    },
    {
        "cardImage": "NEW1_010.png",
        "cost": 8,
        "collectible": true,
        "set": "Classic",
        "artist": "Raymond Swanland",
        "health": 5,
        "mechanics": [
            "Charge",
            "Divine Shield",
            "Taunt",
            "Windfury"
        ],
        "type": "Minion",
        "fr": {
            "name": "Al’Akir, seigneur des Vents"
        },
        "flavor": "He is the weakest of the four Elemental Lords.  And the other three don't let him forget it.",
        "playerClass": "Shaman",
        "elite": true,
        "attack": 3,
        "name": "Al'Akir the Windlord",
        "id": "NEW1_010",
        "text": "<b>Windfury, Charge, Divine Shield, Taunt</b>",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_006.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Mech",
        "artist": "Sean O’Daniels",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Robot d’alarme"
        },
        "flavor": "WARNING.  WARNING.  WARNING.",
        "attack": 0,
        "name": "Alarm-o-Bot",
        "id": "EX1_006",
        "text": "At the start of your turn, swap this minion with a random one in your hand.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_382.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Dany Orizio",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Garde-paix de l’Aldor"
        },
        "flavor": "The Aldor hate two things: the Scryers and smooth jazz.",
        "playerClass": "Paladin",
        "attack": 3,
        "faction": "Neutral",
        "name": "Aldor Peacekeeper",
        "id": "EX1_382",
        "text": "<b>Battlecry:</b> Change an enemy minion's Attack to 1.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_561.png",
        "cost": 9,
        "collectible": true,
        "set": "Classic",
        "race": "Dragon",
        "artist": "Raymond Swanland",
        "health": 8,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Alexstrasza"
        },
        "flavor": "Alexstrasza the Life-Binder brings life and hope to everyone.  Except Deathwing.  And Malygos.  And Nekros.",
        "elite": true,
        "attack": 8,
        "faction": "Neutral",
        "name": "Alexstrasza",
        "id": "EX1_561",
        "text": "<b>Battlecry:</b> Set a hero's remaining Health to 15.",
        "rarity": "Legendary"
    },
    {
        "set": "Classic",
        "name": "Alexstrasza's Fire",
        "id": "EX1_561e",
        "text": "Health set to 15.",
        "type": "Enchantment",
        "fr": {
            "name": "Feu d’Alexstrasza"
        }
    },
    {
        "cardImage": "EX1_393.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Chippy",
        "health": 3,
        "mechanics": [
            "Enrage"
        ],
        "type": "Minion",
        "fr": {
            "name": "Berserker amani"
        },
        "flavor": "If an Amani berserker asks \"Joo lookin' at me?!\", the correct response is \"Nah, mon\".",
        "attack": 2,
        "faction": "Neutral",
        "name": "Amani Berserker",
        "id": "EX1_393",
        "text": "<b>Enrage:</b> +3 Attack",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_038.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Zoltan & Gabor",
        "type": "Spell",
        "fr": {
            "name": "Esprit ancestral"
        },
        "flavor": "It was just a flesh wound.",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Ancestral Spirit",
        "id": "CS2_038",
        "text": "Give a minion \"<b>Deathrattle:</b> Resummon this minion.\"",
        "rarity": "Rare"
    },
    {
        "playerClass": "Shaman",
        "set": "Classic",
        "name": "Ancestral Spirit",
        "id": "CS2_038e",
        "text": "<b>Deathrattle:</b> Resummon this minion.",
        "type": "Enchantment",
        "fr": {
            "name": "Esprit ancestral"
        }
    },
    {
        "cardImage": "EX1_057.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Bernie Kang",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Ancien maître brasseur"
        },
        "flavor": "Most pandaren say his brew tastes like yak.  But apparently that's a compliment.",
        "attack": 5,
        "faction": "Alliance",
        "name": "Ancient Brewmaster",
        "id": "EX1_057",
        "text": "<b>Battlecry:</b> Return a friendly minion from the battlefield to your hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_584.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Howard Lyon",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mage ancien"
        },
        "flavor": "Sometimes he forgets and just wanders into someone else's game.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Ancient Mage",
        "id": "EX1_584",
        "text": "<b>Battlecry:</b> Give adjacent minions <b>Spell Damage +1</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "NEW1_008.png",
        "cost": 7,
        "collectible": true,
        "set": "Classic",
        "artist": "Patrik Hjelm",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Ancien du savoir"
        },
        "flavor": "Go ahead, carve your initials in him.",
        "playerClass": "Druid",
        "attack": 5,
        "name": "Ancient of Lore",
        "id": "NEW1_008",
        "text": "<b>Choose One -</b> Draw 2 cards; or Restore 5 Health.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_178.png",
        "cost": 7,
        "collectible": true,
        "set": "Classic",
        "artist": "Sean O’Daniels",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Ancien de la guerre"
        },
        "flavor": "Young Night Elves love to play \"Who can get the Ancient of War to Uproot?\"  You lose if you get crushed to death.",
        "playerClass": "Druid",
        "attack": 5,
        "faction": "Neutral",
        "name": "Ancient of War",
        "id": "EX1_178",
        "text": "<b>Choose One</b> -\n+5 Attack; or +5 Health and <b>Taunt</b>.",
        "rarity": "Epic"
    },
    {
        "cardImage": "NEW1_008b.png",
        "playerClass": "Druid",
        "set": "Classic",
        "name": "Ancient Secrets",
        "id": "NEW1_008b",
        "text": "Restore 5 Health.",
        "type": "Spell",
        "fr": {
            "name": "Secrets anciens"
        }
    },
    {
        "cardImage": "NEW1_008a.png",
        "playerClass": "Druid",
        "set": "Classic",
        "name": "Ancient Teachings",
        "id": "NEW1_008a",
        "text": "Draw 2 cards.",
        "type": "Spell",
        "fr": {
            "name": "Connaissances anciennes"
        }
    },
    {
        "cardImage": "EX1_045.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Richard Wright",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Guetteur ancien"
        },
        "flavor": "Why do its eyes seem to follow you as you walk by?",
        "attack": 4,
        "faction": "Alliance",
        "name": "Ancient Watcher",
        "id": "EX1_045",
        "text": "Can't attack.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_009.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Mike Sass",
        "health": 1,
        "mechanics": [
            "Enrage"
        ],
        "type": "Minion",
        "fr": {
            "name": "Poulet furieux"
        },
        "flavor": "There is no beast more frightening (or ridiculous) than a fully enraged chicken.",
        "attack": 1,
        "name": "Angry Chicken",
        "id": "EX1_009",
        "text": "<b>Enrage:</b> +5 Attack.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_398.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Samwise",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Fabricante d’armes"
        },
        "flavor": "50% off fist weapons, limited time only!",
        "playerClass": "Warrior",
        "attack": 3,
        "faction": "Neutral",
        "name": "Arathi Weaponsmith",
        "id": "EX1_398",
        "text": "<b>Battlecry:</b> Equip a 2/2 weapon.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_089.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Sedhayu Ardian",
        "health": 2,
        "mechanics": [
            "Battlecry",
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "Golem arcanique"
        },
        "flavor": "Having Arcane golems at home really classes up the place, and as a bonus they are great conversation pieces.",
        "attack": 4,
        "faction": "Neutral",
        "name": "Arcane Golem",
        "id": "EX1_089",
        "text": "<b>Charge</b>. <b>Battlecry:</b> Give your opponent a Mana Crystal.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_559.png",
        "cost": 7,
        "collectible": true,
        "set": "Classic",
        "artist": "Wayne Reynolds",
        "health": 7,
        "type": "Minion",
        "fr": {
            "name": "Archimage Antonidas"
        },
        "flavor": "Antonidas was the Grand Magus of the Kirin Tor, and Jaina's mentor.  This was a big step up from being Grand Magus of Jelly Donuts.",
        "playerClass": "Mage",
        "elite": true,
        "attack": 5,
        "faction": "Neutral",
        "name": "Archmage Antonidas",
        "id": "EX1_559",
        "text": "Whenever you cast a spell, add a 'Fireball' spell to your hand.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_067.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "James Ryman",
        "health": 2,
        "mechanics": [
            "Charge",
            "Divine Shield"
        ],
        "type": "Minion",
        "fr": {
            "name": "Commandant d’Argent"
        },
        "flavor": "The Argent Dawn stands vigilant against the Scourge, as well as people who cut in line at coffee shops.",
        "attack": 4,
        "faction": "Neutral",
        "name": "Argent Commander",
        "id": "EX1_067",
        "text": "<b>Charge</b>\n<b>Divine Shield</b>",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_362.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Doug Alexander",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Protecteur d’Argent"
        },
        "flavor": "\"I'm not saying you can dodge fireballs.  I'm saying with this shield, you won't have to.\"",
        "playerClass": "Paladin",
        "attack": 2,
        "faction": "Neutral",
        "name": "Argent Protector",
        "id": "EX1_362",
        "text": "<b>Battlecry:</b> Give a friendly minion <b>Divine Shield</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_008.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Zoltan & Gabor",
        "health": 1,
        "mechanics": [
            "Divine Shield"
        ],
        "type": "Minion",
        "fr": {
            "name": "Écuyère d’Argent"
        },
        "flavor": "\"I solemnly swear to uphold the Light, purge the world of darkness, and to eat only burritos.\" - The Argent Dawn Oath",
        "attack": 1,
        "faction": "Alliance",
        "name": "Argent Squire",
        "id": "EX1_008",
        "text": "<b>Divine Shield</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_402.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Greg Hildebrandt",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Fabricante d’armures"
        },
        "flavor": "She accepts guild funds for repairs!",
        "playerClass": "Warrior",
        "attack": 1,
        "faction": "Neutral",
        "name": "Armorsmith",
        "id": "EX1_402",
        "text": "Whenever a friendly minion takes damage, gain 1 Armor.",
        "inPlayText": "Smithing",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_383t.png",
        "playerClass": "Paladin",
        "cost": 5,
        "set": "Classic",
        "attack": 5,
        "durability": 3,
        "name": "Ashbringer",
        "id": "EX1_383t",
        "type": "Weapon",
        "fr": {
            "name": "Porte-cendres"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_591.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Doug Alexander",
        "health": 5,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Prêtresse auchenaï"
        },
        "flavor": "The Auchenai know the end is coming, but they're not sure when.",
        "playerClass": "Priest",
        "attack": 3,
        "faction": "Neutral",
        "name": "Auchenai Soulpriest",
        "id": "EX1_591",
        "text": "Your cards and powers that restore Health now deal damage instead.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_384.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Garner",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "type": "Spell",
        "fr": {
            "name": "Courroux vengeur"
        },
        "flavor": "Wham! Wham! Wham! Wham! Wham! Wham! Wham! Wham!",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Avenging Wrath",
        "id": "EX1_384",
        "text": "Deal $8 damage randomly split among all enemies.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_284.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "race": "Dragon",
        "artist": "Ben Zhang",
        "health": 4,
        "mechanics": [
            "Battlecry",
            "Spellpower"
        ],
        "type": "Minion",
        "fr": {
            "name": "Drake azur"
        },
        "flavor": "They initially planned to be the Beryl or Cerulean drakes, but those felt a tad too pretentious.",
        "attack": 4,
        "faction": "Neutral",
        "name": "Azure Drake",
        "id": "EX1_284",
        "text": "<b>Spell Damage +1</b>. <b>Battlecry:</b> Draw a card.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_110t.png",
        "elite": true,
        "cost": 4,
        "set": "Classic",
        "attack": 4,
        "name": "Baine Bloodhoof",
        "health": 5,
        "id": "EX1_110t",
        "type": "Minion",
        "fr": {
            "name": "Baine Sabot-de-Sang"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_014t.png",
        "cost": 1,
        "set": "Classic",
        "name": "Bananas",
        "id": "EX1_014t",
        "text": "Give a minion +1/+1.",
        "type": "Spell",
        "fr": {
            "name": "Banane"
        }
    },
    {
        "set": "Classic",
        "name": "Bananas",
        "id": "EX1_014te",
        "text": "Has +1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Banane"
        }
    },
    {
        "cardImage": "EX1_320.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Raymond Swanland",
        "type": "Spell",
        "fr": {
            "name": "Plaie funeste"
        },
        "flavor": "My advice to you is to avoid Doom, if possible.",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Bane of Doom",
        "id": "EX1_320",
        "text": "Deal $2 damage to a character. If that kills it, summon a random Demon.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_249.png",
        "cost": 7,
        "collectible": true,
        "set": "Classic",
        "artist": "Ian Ameling",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Baron Geddon"
        },
        "flavor": "Baron Geddon was Ragnaros's foremost lieutenant, until he got FIRED.",
        "elite": true,
        "attack": 7,
        "faction": "Neutral",
        "name": "Baron Geddon",
        "id": "EX1_249",
        "text": "At the end of your turn, deal 2 damage to ALL other characters.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_398t.png",
        "playerClass": "Warrior",
        "cost": 1,
        "set": "Classic",
        "attack": 2,
        "durability": 2,
        "name": "Battle Axe",
        "id": "EX1_398t",
        "type": "Weapon",
        "fr": {
            "name": "Hache d’armes"
        }
    },
    {
        "cardImage": "EX1_392.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "type": "Spell",
        "fr": {
            "name": "Rage du combat"
        },
        "flavor": "\"You won't like me when I'm angry.\"",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Battle Rage",
        "id": "EX1_392",
        "text": "Draw a card for each damaged friendly character.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_165b.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Bear Form",
        "id": "EX1_165b",
        "text": "+2 Health and <b>Taunt</b>.",
        "type": "Spell",
        "fr": {
            "name": "Forme d’ours"
        },
        "rarity": "Common"
    },
    {
        "playerClass": "Warrior",
        "set": "Classic",
        "name": "Berserk",
        "id": "EX1_604o",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Berserk"
        }
    },
    {
        "cardImage": "EX1_549.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "type": "Spell",
        "fr": {
            "name": "Courroux bestial"
        },
        "flavor": "The seething wrath is just beneath the surface.  Beneath that is wild abandon, followed by slight annoyance.",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Bestial Wrath",
        "id": "EX1_549",
        "text": "Give a friendly Beast +2 Attack and <b>Immune</b> this turn.",
        "rarity": "Epic"
    },
    {
        "playerClass": "Hunter",
        "set": "Classic",
        "name": "Bestial Wrath",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "EX1_549o",
        "text": "+2 Attack and <b>Immune</b> this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Courroux bestial"
        }
    },
    {
        "cardImage": "EX1_126.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Lucas Graciano",
        "type": "Spell",
        "fr": {
            "name": "Trahison"
        },
        "flavor": "Everyone has a price. Gnomes, for example, can be persuaded by stuffed animals and small amounts of chocolate.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Betrayal",
        "id": "EX1_126",
        "text": "Force an enemy minion to deal its damage to the minions next to it.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_005.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Chris Seaman",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chasseur de gros gibier"
        },
        "flavor": "Mere devilsaurs no longer excite him.  Soon he'll be trying to catch Onyxia with only a dull Krol Blade.",
        "attack": 4,
        "name": "Big Game Hunter",
        "id": "EX1_005",
        "text": "<b>Battlecry:</b> Destroy a minion with an Attack of 7 or more.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_570.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Tom Baxa",
        "type": "Spell",
        "fr": {
            "name": "Morsure"
        },
        "flavor": "Chew your food!",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Bite",
        "id": "EX1_570",
        "text": "Give your hero +4 Attack this turn and 4 Armor.",
        "rarity": "Rare"
    },
    {
        "set": "Classic",
        "name": "Bite",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "EX1_570e",
        "text": "+4 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Morsure"
        }
    },
    {
        "cardImage": "CS2_233.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Hideaki Takamura",
        "mechanics": [
            "AffectedBySpellPower"
        ],
        "type": "Spell",
        "fr": {
            "name": "Déluge de lames"
        },
        "flavor": "\"Look, it's not just about waving daggers around really fast.  It's a lot more complicated than that.\" - Shan, Rogue Trainer",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Blade Flurry",
        "id": "CS2_233",
        "text": "Destroy your weapon and deal its damage to all enemies.",
        "rarity": "Rare"
    },
    {
        "set": "Classic",
        "name": "Blarghghl",
        "id": "EX1_509e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Blarghghl"
        }
    },
    {
        "playerClass": "Paladin",
        "set": "Classic",
        "name": "Blessed Champion",
        "id": "EX1_355e",
        "text": "This minion's Attack has been doubled.",
        "type": "Enchantment",
        "fr": {
            "name": "Bénédiction du champion"
        }
    },
    {
        "cardImage": "EX1_355.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Tyler Walpole",
        "type": "Spell",
        "fr": {
            "name": "Bénédiction du champion"
        },
        "flavor": "This card causes double the trouble AND double the fun.",
        "playerClass": "Paladin",
        "name": "Blessed Champion",
        "id": "EX1_355",
        "text": "Double a minion's Attack.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Paladin",
        "set": "Classic",
        "name": "Blessing of Wisdom",
        "id": "EX1_363e2",
        "text": "When this minion attacks, the enemy player draws a card.",
        "type": "Enchantment",
        "fr": {
            "name": "Bénédiction de sagesse"
        }
    },
    {
        "cardImage": "EX1_363.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Chippy",
        "type": "Spell",
        "fr": {
            "name": "Bénédiction de sagesse"
        },
        "flavor": "Apparently with wisdom comes the knowledge that you should probably be attacking every turn.",
        "playerClass": "Paladin",
        "name": "Blessing of Wisdom",
        "id": "EX1_363",
        "text": "Choose a minion. Whenever it attacks, draw a card.",
        "rarity": "Common"
    },
    {
        "playerClass": "Paladin",
        "set": "Classic",
        "name": "Blessing of Wisdom",
        "id": "EX1_363e",
        "text": "When this minion attacks, the player who blessed it draws a card.",
        "type": "Enchantment",
        "fr": {
            "name": "Bénédiction de sagesse"
        }
    },
    {
        "cardImage": "CS2_028.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Chris Seaman",
        "mechanics": [
            "Freeze"
        ],
        "type": "Spell",
        "fr": {
            "name": "Blizzard"
        },
        "flavor": "This spell can be very Entertaining.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Blizzard",
        "id": "CS2_028",
        "text": "Deal $2 damage to all enemy minions and <b>Freeze</b> them.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_323w.png",
        "playerClass": "Warlock",
        "cost": 3,
        "set": "Classic",
        "attack": 3,
        "durability": 8,
        "name": "Blood Fury",
        "id": "EX1_323w",
        "type": "Weapon",
        "fr": {
            "name": "Fureur sanguinaire"
        }
    },
    {
        "cardImage": "CS2_059.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "race": "Demon",
        "artist": "Bernie Kang",
        "health": 1,
        "mechanics": [
            "Stealth"
        ],
        "type": "Minion",
        "fr": {
            "name": "Diablotin de sang"
        },
        "flavor": "Imps are content to hide and viciously taunt everyone nearby.",
        "playerClass": "Warlock",
        "attack": 0,
        "faction": "Neutral",
        "name": "Blood Imp",
        "id": "CS2_059",
        "text": "<b>Stealth</b>. At the end of your turn, give another random friendly minion +1 Health.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_590.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Trent Kaniuga",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chevalier de sang"
        },
        "flavor": "The Blood Knights get their holy powers from the Sunwell, which you should NOT bathe in.",
        "attack": 3,
        "faction": "Neutral",
        "name": "Blood Knight",
        "id": "EX1_590",
        "text": "<b>Battlecry:</b> All minions lose <b>Divine Shield</b>. Gain +3/+3 for each Shield lost.",
        "rarity": "Epic"
    },
    {
        "playerClass": "Warlock",
        "set": "Classic",
        "name": "Blood Pact",
        "id": "CS2_059o",
        "text": "Increased Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Pacte de sang"
        }
    },
    {
        "cardImage": "EX1_012.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "health": 1,
        "mechanics": [
            "Deathrattle",
            "Spellpower"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mage de sang Thalnos"
        },
        "flavor": "He's in charge of the Annual Scarlet Monastery Blood Drive!",
        "elite": true,
        "attack": 1,
        "faction": "Neutral",
        "name": "Bloodmage Thalnos",
        "id": "EX1_012",
        "text": "<b>Spell Damage +1</b>. <b>Deathrattle:</b> Draw a card.",
        "rarity": "Legendary"
    },
    {
        "playerClass": "Warrior",
        "set": "Classic",
        "name": "Bloodrage",
        "id": "EX1_411e",
        "text": "No durability loss.",
        "type": "Enchantment",
        "fr": {
            "name": "Rage sanguinaire"
        }
    },
    {
        "cardImage": "NEW1_025.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "race": "Pirate",
        "artist": "Randy Gallegos",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Forban de la Voile sanglante"
        },
        "flavor": "Every pirate uses the same four digits to access Automated Gold Dispensers.  It's called the \"Pirate's Code\".",
        "attack": 1,
        "name": "Bloodsail Corsair",
        "id": "NEW1_025",
        "text": "<b>Battlecry:</b> Remove 1 Durability from your opponent's weapon.",
        "rarity": "Rare"
    },
    {
        "cardImage": "NEW1_018.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "race": "Pirate",
        "artist": "Jim Nelson",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mousse de la Voile sanglante"
        },
        "flavor": "\"I only plunder on days that end in 'y'.\"",
        "attack": 2,
        "name": "Bloodsail Raider",
        "id": "NEW1_018",
        "text": "<b>Battlecry:</b> Gain Attack equal to the Attack of your weapon.",
        "rarity": "Common"
    },
    {
        "set": "Classic",
        "name": "Bolstered",
        "id": "NEW1_025e",
        "text": "Increased Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Renforcement"
        }
    },
    {
        "cardImage": "EX1_407.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Wayne Reynolds",
        "type": "Spell",
        "fr": {
            "name": "Baston"
        },
        "flavor": "Do you know the first rule of Brawl Club?",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Brawl",
        "id": "EX1_407",
        "text": "Destroy all minions except one. <i>(chosen randomly)</i>",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_091.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Chippy",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Prêtresse de la Cabale"
        },
        "flavor": "You never know who may be secretly working for the Cabal....",
        "playerClass": "Priest",
        "attack": 4,
        "faction": "Neutral",
        "name": "Cabal Shadow Priest",
        "id": "EX1_091",
        "text": "<b>Battlecry:</b> Take control of an enemy minion that has 2 or less Attack.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_110.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Wayne Reynolds",
        "health": 5,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Cairne Sabot-de-Sang"
        },
        "flavor": "Cairne was killed by Garrosh, so... don't put this guy in a Warrior deck.  It's pretty insensitive.",
        "elite": true,
        "attack": 4,
        "faction": "Alliance",
        "name": "Cairne Bloodhoof",
        "id": "EX1_110",
        "text": "<b>Deathrattle:</b> Summon a 4/5 Baine Bloodhoof.",
        "rarity": "Legendary"
    },
    {
        "set": "Classic",
        "name": "Cannibalize",
        "id": "tt_004o",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Cannibalisme"
        }
    },
    {
        "cardImage": "NEW1_024.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "race": "Pirate",
        "artist": "Dan Scott",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Capitaine Vertepeau"
        },
        "flavor": "He was <i>this close</i> to piloting a massive juggernaut into Stormwind Harbor. If it weren't for those pesky kids!",
        "elite": true,
        "attack": 5,
        "name": "Captain Greenskin",
        "id": "NEW1_024",
        "text": "<b>Battlecry:</b> Give your weapon +1/+1.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_165a.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Cat Form",
        "id": "EX1_165a",
        "text": "<b>Charge</b>",
        "type": "Spell",
        "fr": {
            "name": "Forme de félin"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_573.png",
        "cost": 9,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Cénarius"
        },
        "flavor": "Yes, he's a demigod. No, he doesn't need to wear a shirt.",
        "playerClass": "Druid",
        "elite": true,
        "attack": 5,
        "faction": "Neutral",
        "name": "Cenarius",
        "id": "EX1_573",
        "text": "<b>Choose One</b> - Give your other minions +2/+2; or Summon two 2/2 Treants with <b>Taunt</b>.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_621.png",
        "cost": 0,
        "collectible": true,
        "set": "Classic",
        "artist": "Daarken",
        "type": "Spell",
        "fr": {
            "name": "Cercle de soins"
        },
        "flavor": "It isn't really a circle.",
        "playerClass": "Priest",
        "name": "Circle of Healing",
        "id": "EX1_621",
        "text": "Restore #4 Health to ALL minions.",
        "rarity": "Common"
    },
    {
        "playerClass": "Rogue",
        "set": "Classic",
        "name": "Cold Blood",
        "id": "CS2_073e",
        "text": "+2 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Sang froid"
        }
    },
    {
        "playerClass": "Rogue",
        "set": "Classic",
        "name": "Cold Blood",
        "id": "CS2_073e2",
        "text": "+4 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Sang froid"
        }
    },
    {
        "cardImage": "CS2_073.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "mechanics": [
            "Combo"
        ],
        "type": "Spell",
        "fr": {
            "name": "Sang froid"
        },
        "flavor": "\"I'm cold blooded, check it and see!\"",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Cold Blood",
        "id": "CS2_073",
        "text": "Give a minion +2 Attack. <b>Combo:</b> +4 Attack instead.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_050.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Murloc",
        "artist": "Steve Prescott",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Oracle froide-lumière"
        },
        "flavor": "They can see the future.   In that future both players draw more cards.   Spoooky.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Coldlight Oracle",
        "id": "EX1_050",
        "text": "<b>Battlecry:</b> Each player draws 2 cards.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_103.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Murloc",
        "artist": "Arthur Gimaldinov",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Voyant froide-lumière"
        },
        "flavor": "The Coldlight murlocs reside in the darkest pits of the Abyssal Depths.  So no, there's no getting away from murlocs.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Coldlight Seer",
        "id": "EX1_103",
        "text": "<b>Battlecry:</b> Give ALL other Murlocs +2 Health.",
        "rarity": "Rare"
    },
    {
        "cardImage": "NEW1_036.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Wayne Reynolds",
        "type": "Spell",
        "fr": {
            "name": "Cri de commandement"
        },
        "flavor": "\"Shout! Shout! Let it all out!\" - Advice to warriors-in-training",
        "playerClass": "Warrior",
        "name": "Commanding Shout",
        "id": "NEW1_036",
        "text": "Your minions can't be reduced below 1 Health this turn. Draw a card.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Warrior",
        "set": "Classic",
        "name": "Commanding Shout",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "NEW1_036e2",
        "text": "Your minions can't be reduced below 1 Health this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Cri de commandement"
        }
    },
    {
        "playerClass": "Warrior",
        "set": "Classic",
        "name": "Commanding Shout",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "NEW1_036e",
        "text": "Can't be reduced below 1 Health this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Cri de commandement"
        }
    },
    {
        "cardImage": "EX1_128.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Steve Hui",
        "type": "Spell",
        "fr": {
            "name": "Dissimuler"
        },
        "flavor": "Rogues conceal everything but their emotions.  You can't get 'em to shut up about feelings.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Conceal",
        "id": "EX1_128",
        "text": "Give your minions <b>Stealth</b> until your next turn.",
        "rarity": "Common"
    },
    {
        "playerClass": "Rogue",
        "set": "Classic",
        "name": "Concealed",
        "id": "EX1_128e",
        "text": "Stealthed until your next turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Dissimulé"
        }
    },
    {
        "cardImage": "EX1_275.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Leo Che",
        "mechanics": [
            "Freeze"
        ],
        "type": "Spell",
        "fr": {
            "name": "Cône de froid"
        },
        "flavor": "Magi of the Kirin Tor were casting Cubes of Cold for many years before Cones came into fashion some 90 years ago.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Cone of Cold",
        "id": "EX1_275",
        "text": "<b>Freeze</b> a minion and the minions next to it, and deal $1 damage to them.",
        "rarity": "Common"
    },
    {
        "playerClass": "Warlock",
        "set": "Classic",
        "name": "Consume",
        "id": "EX1_304e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Consumer"
        }
    },
    {
        "cardImage": "EX1_287.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Jason Chan",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Contresort"
        },
        "flavor": "What's the difference between a mage playing with Counterspell and a mage who isn't?  The mage who isn't is getting Pyroblasted in the face.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Counterspell",
        "id": "EX1_287",
        "text": "<b>Secret:</b> When your opponent casts a spell, <b>Counter</b> it.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_059.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Tom Fleming",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Alchimiste dément"
        },
        "flavor": "\"You'll <i>love</i> my new recipe!\" he says... especially if you're not happy with your current number of limbs.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Crazed Alchemist",
        "id": "EX1_059",
        "text": "<b>Battlecry:</b> Swap the Attack and Health of a minion.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_603.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Phroilan Gardner",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Sous-chef cruel"
        },
        "flavor": "\"I'm going to need you to come in on Sunday.\" - Cruel Taskmaster",
        "playerClass": "Warrior",
        "attack": 2,
        "faction": "Neutral",
        "name": "Cruel Taskmaster",
        "id": "EX1_603",
        "text": "<b>Battlecry:</b> Deal 1 damage to a minion and give it +2 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_595.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Raymond Swanland",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Maître de culte"
        },
        "flavor": "She may be an evil cult master, but she still calls her parents once a week.",
        "attack": 4,
        "faction": "Neutral",
        "name": "Cult Master",
        "id": "EX1_595",
        "text": "Whenever one of your other minions dies, draw a card.",
        "inPlayText": "Cultist",
        "rarity": "Common"
    },
    {
        "cardImage": "skele21.png",
        "cost": 1,
        "set": "Classic",
        "race": "Mech",
        "attack": 2,
        "faction": "Neutral",
        "name": "Damaged Golem",
        "health": 1,
        "id": "skele21",
        "type": "Minion",
        "fr": {
            "name": "Golem endommagé"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_046.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Scott Hampton",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Nain sombrefer"
        },
        "flavor": "Guardians of Dark Iron Ore.  Perhaps the most annoying ore, given where you have to forge it.",
        "attack": 4,
        "faction": "Alliance",
        "name": "Dark Iron Dwarf",
        "id": "EX1_046",
        "text": "<b>Battlecry:</b> Give a minion +2 Attack this turn.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_617.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Steve Prescott",
        "type": "Spell",
        "fr": {
            "name": "Tir meurtrier"
        },
        "flavor": "Accuracy is not a highly valued trait among the mok'nathal.  Deadliness is near the top, though.",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Deadly Shot",
        "id": "EX1_617",
        "text": "Destroy a random enemy minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "NEW1_030.png",
        "cost": 10,
        "collectible": true,
        "set": "Classic",
        "race": "Dragon",
        "artist": "Bernie Kang",
        "health": 12,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Aile de mort"
        },
        "flavor": "Once a noble dragon known as Neltharion, Deathwing lost his mind and shattered Azeroth before finally being defeated.  Daddy issues?",
        "elite": true,
        "attack": 12,
        "name": "Deathwing",
        "id": "NEW1_030",
        "text": "<b>Battlecry:</b> Destroy all other minions and discard your hand.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_130a.png",
        "playerClass": "Paladin",
        "cost": 1,
        "set": "Classic",
        "attack": 2,
        "faction": "Neutral",
        "name": "Defender",
        "health": 1,
        "id": "EX1_130a",
        "type": "Minion",
        "fr": {
            "name": "Défenseur"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_093.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Défenseur d’Argus"
        },
        "flavor": "You wouldn’t think that Argus would need this much defending.  But it does.",
        "attack": 2,
        "faction": "Alliance",
        "name": "Defender of Argus",
        "id": "EX1_093",
        "text": "<b>Battlecry:</b> Give adjacent minions +1/+1 and <b>Taunt</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_131t.png",
        "playerClass": "Rogue",
        "cost": 1,
        "set": "Classic",
        "attack": 2,
        "faction": "Neutral",
        "name": "Defias Bandit",
        "health": 1,
        "id": "EX1_131t",
        "type": "Minion",
        "fr": {
            "name": "Bandit défias"
        }
    },
    {
        "cardImage": "EX1_131.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Dany Orizio",
        "health": 2,
        "mechanics": [
            "Combo"
        ],
        "type": "Minion",
        "fr": {
            "name": "Meneur défias"
        },
        "flavor": "He stole the deed to town years ago, so technically the town <i>is</i> his. He just calls people Scrub to be mean.",
        "playerClass": "Rogue",
        "attack": 2,
        "faction": "Neutral",
        "name": "Defias Ringleader",
        "id": "EX1_131",
        "text": "<b>Combo:</b> Summon a 2/1 Defias Bandit.",
        "rarity": "Common"
    },
    {
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Demigod's Favor",
        "id": "EX1_573ae",
        "text": "+2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Faveur du demi-dieu"
        }
    },
    {
        "cardImage": "EX1_573a.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Demigod's Favor",
        "id": "EX1_573a",
        "text": "Give your other minions +2/+2.",
        "type": "Spell",
        "fr": {
            "name": "Faveur du demi-dieu"
        }
    },
    {
        "cardImage": "EX1_102.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Mech",
        "artist": "Raymond Swanland",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Démolisseur"
        },
        "flavor": "Laying siege isn't fun for anyone.  It's not even all that effective, now that everyone has a flying mount.",
        "attack": 1,
        "faction": "Neutral",
        "name": "Demolisher",
        "id": "EX1_102",
        "text": "At the start of your turn, deal 2 damage to a random enemy.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Warlock",
        "cost": 0,
        "set": "Classic",
        "faction": "Neutral",
        "name": "Demonfire",
        "id": "EX1_596e",
        "text": "This Demon has +2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Feu démoniaque"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_596.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Ben Wootten",
        "type": "Spell",
        "fr": {
            "name": "Feu démoniaque"
        },
        "flavor": "Demonfire is like regular fire except for IT NEVER STOPS BURNING HELLLPPP",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Demonfire",
        "id": "EX1_596",
        "text": "Deal $2 damage to a minion. If it’s a friendly Demon, give it +2/+2 instead.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_tk29.png",
        "cost": 5,
        "set": "Classic",
        "race": "Beast",
        "attack": 5,
        "faction": "Neutral",
        "name": "Devilsaur",
        "health": 5,
        "id": "EX1_tk29",
        "type": "Minion",
        "fr": {
            "name": "Diablosaure"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_162.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "John Dickenson",
        "health": 2,
        "mechanics": [
            "AdjacentBuff",
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Loup alpha redoutable"
        },
        "flavor": "We are pretty excited about the upcoming release of Dire Wolf Beta, just repost this sign for a chance at a key.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Dire Wolf Alpha",
        "id": "EX1_162",
        "text": "Adjacent minions have +1 Attack.",
        "inPlayText": "Alpha Dog",
        "rarity": "Common"
    },
    {
        "playerClass": "Rogue",
        "set": "Classic",
        "name": "Disguised",
        "id": "NEW1_014e",
        "text": "Stealthed until your next turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Déguisé"
        }
    },
    {
        "cardImage": "EX1_166b.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Dispel",
        "mechanics": [
            "Silence"
        ],
        "id": "EX1_166b",
        "text": "<b>Silence</b> a minion.",
        "type": "Spell",
        "fr": {
            "name": "Dissipation"
        }
    },
    {
        "cardImage": "EX1_349.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Lucas Graciano",
        "type": "Spell",
        "fr": {
            "name": "Faveur divine"
        },
        "flavor": "This is not just a favor, but a divine one, like helping someone move a couch with a fold out bed!",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Divine Favor",
        "id": "EX1_349",
        "text": "Draw cards until you have as many in hand as your opponent.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_310.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "race": "Demon",
        "artist": "Lucas Graciano",
        "health": 7,
        "mechanics": [
            "Battlecry",
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "Garde funeste"
        },
        "flavor": "Summoning a doomguard is risky. <i>Someone</i> is going to die.",
        "playerClass": "Warlock",
        "attack": 5,
        "faction": "Neutral",
        "name": "Doomguard",
        "id": "EX1_310",
        "text": "<b>Charge</b>. <b>Battlecry:</b> Discard two random cards.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_567.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "John Polidora",
        "durability": 8,
        "mechanics": [
            "Overload",
            "Windfury"
        ],
        "type": "Weapon",
        "fr": {
            "name": "Marteau-du-Destin"
        },
        "flavor": "Orgrim Doomhammer gave this legendary weapon to Thrall.  His name is a total coincidence.",
        "playerClass": "Shaman",
        "attack": 2,
        "faction": "Neutral",
        "name": "Doomhammer",
        "id": "EX1_567",
        "text": "<b>Windfury, Overload:</b> (2)",
        "rarity": "Epic"
    },
    {
        "cardImage": "NEW1_021.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "health": 7,
        "type": "Minion",
        "fr": {
            "name": "Auspice funeste"
        },
        "flavor": "He's almost been right so many times. He was <i>sure</i> it was coming during the Cataclysm.",
        "attack": 0,
        "name": "Doomsayer",
        "id": "NEW1_021",
        "text": "At the start of your turn, destroy ALL minions.",
        "rarity": "Epic"
    },
    {
        "cardImage": "NEW1_022.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "race": "Pirate",
        "artist": "Trent Kaniuga",
        "health": 3,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Corsaire de l’effroi"
        },
        "flavor": "\"Yarrrr\" is a pirate word that means \"Greetings, milord.\"",
        "attack": 3,
        "name": "Dread Corsair",
        "id": "NEW1_022",
        "text": "<b>Taunt.</b> Costs (1) less per Attack of your weapon.",
        "rarity": "Common"
    },
    {
        "cardImage": "DREAM_04.png",
        "playerClass": "Dream",
        "cost": 0,
        "set": "Classic",
        "name": "Dream",
        "id": "DREAM_04",
        "text": "Return a minion to its owner's hand.",
        "type": "Spell",
        "fr": {
            "name": "Rêve"
        }
    },
    {
        "cardImage": "EX1_165.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Luca Zontini",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Druide de la Griffe"
        },
        "flavor": "Cat or Bear?  Cat or Bear?!  I just cannot CHOOSE!",
        "playerClass": "Druid",
        "attack": 4,
        "faction": "Neutral",
        "name": "Druid of the Claw",
        "id": "EX1_165",
        "text": "<b>Choose One -</b> <b>Charge</b>; or +2 Health and <b>Taunt</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_165t1.png",
        "cost": 5,
        "set": "Classic",
        "race": "Beast",
        "health": 4,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "Druide de la Griffe"
        },
        "playerClass": "Druid",
        "attack": 4,
        "name": "Druid of the Claw",
        "id": "EX1_165t1",
        "text": "<b>Charge</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_165t2.png",
        "cost": 5,
        "set": "Classic",
        "race": "Beast",
        "health": 6,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Druide de la Griffe"
        },
        "playerClass": "Druid",
        "attack": 4,
        "name": "Druid of the Claw",
        "id": "EX1_165t2",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_243.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Raymond Swanland",
        "health": 1,
        "mechanics": [
            "Overload",
            "Windfury"
        ],
        "type": "Minion",
        "fr": {
            "name": "Diable de poussière"
        },
        "flavor": "Westfall is full of dust devils. And buzzards. And crazed golems. And pirates. Why does anyone live here?",
        "playerClass": "Shaman",
        "attack": 3,
        "faction": "Neutral",
        "name": "Dust Devil",
        "id": "EX1_243",
        "text": "<b>Windfury</b>. <b>Overload:</b> (2)",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_536.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Cyril Van Der Haegen",
        "durability": 2,
        "type": "Weapon",
        "fr": {
            "name": "Arc cornedaigle"
        },
        "flavor": "First Lesson: Put the pointy end in the other guy.",
        "playerClass": "Hunter",
        "attack": 3,
        "name": "Eaglehorn Bow",
        "id": "EX1_536",
        "text": "Whenever a friendly <b>Secret</b> is revealed, gain +1 Durability.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_250.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Dan Scott",
        "health": 8,
        "mechanics": [
            "Overload",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Élémentaire de terre"
        },
        "flavor": "Nothing beats rock.",
        "playerClass": "Shaman",
        "attack": 7,
        "faction": "Neutral",
        "name": "Earth Elemental",
        "id": "EX1_250",
        "text": "<b>Taunt</b>. <b>Overload:</b> (3)",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_245.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Kevin Chin",
        "mechanics": [
            "Silence"
        ],
        "type": "Spell",
        "fr": {
            "name": "Horion de terre"
        },
        "flavor": "Earth Shock? Shouldn't it be \"Azeroth Shock\"?",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Earth Shock",
        "id": "EX1_245",
        "text": "<b>Silence</b> a minion, then deal $1 damage to it.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_117.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Prophète du Cercle terrestre"
        },
        "flavor": "He can see really far, and he doesn't use a telescope like those filthy pirates.",
        "attack": 3,
        "name": "Earthen Ring Farseer",
        "id": "CS2_117",
        "text": "<b>Battlecry:</b> Restore 3 Health.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_613.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Efrem Palacios",
        "health": 2,
        "mechanics": [
            "Combo"
        ],
        "type": "Minion",
        "fr": {
            "name": "Edwin VanCleef"
        },
        "flavor": "He led the Stonemasons in the reconstruction of Stormwind, and when the nobles refused to pay, he founded the Defias Brotherhood to, well, <i>deconstruct</i> Stormwind.",
        "playerClass": "Rogue",
        "elite": true,
        "attack": 2,
        "faction": "Neutral",
        "name": "Edwin VanCleef",
        "id": "EX1_613",
        "text": "<b>Combo:</b> Gain +2/+2 for each card played earlier this turn.",
        "rarity": "Legendary"
    },
    {
        "set": "Classic",
        "name": "Elune's Grace",
        "id": "EX1_004e",
        "text": "Increased Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Grâce d’Élune"
        }
    },
    {
        "cardImage": "DREAM_03.png",
        "playerClass": "Dream",
        "cost": 4,
        "set": "Classic",
        "race": "Dragon",
        "attack": 7,
        "name": "Emerald Drake",
        "health": 6,
        "id": "DREAM_03",
        "type": "Minion",
        "fr": {
            "name": "Drake émeraude"
        }
    },
    {
        "cardImage": "EX1_170.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Lars Grant-West",
        "health": 3,
        "mechanics": [
            "Poisonous"
        ],
        "type": "Minion",
        "fr": {
            "name": "Cobra empereur"
        },
        "flavor": "The Sholazar Basin is home to a lot of really horrible things. If you're going to visit, wear bug spray.  And plate armor.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Emperor Cobra",
        "id": "EX1_170",
        "text": "Destroy any minion damaged by this minion.",
        "inPlayText": "Fanged",
        "rarity": "Rare"
    },
    {
        "set": "Classic",
        "name": "Empowered",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "EX1_055o",
        "text": "Mana Addict has increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Surpuissant"
        }
    },
    {
        "cardImage": "EX1_619.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Michal Ivan",
        "type": "Spell",
        "fr": {
            "name": "Égalité"
        },
        "flavor": "We are all special unique snowflakes... with 1 Health.",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Equality",
        "id": "EX1_619",
        "text": "Change the Health of ALL minions to 1.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Paladin",
        "set": "Classic",
        "name": "Equality",
        "id": "EX1_619e",
        "text": "Health changed to 1.",
        "type": "Enchantment",
        "fr": {
            "name": "Égalité"
        }
    },
    {
        "collectible": false,
        "set": "Classic",
        "name": "Equipped",
        "id": "NEW1_037e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Équipé"
        }
    },
    {
        "cardImage": "EX1_274.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Michael Komarck",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Arcaniste éthérien"
        },
        "flavor": "The ethereals are wrapped in cloth to give form to their non-corporeal bodies. Also because it's nice and soft.",
        "playerClass": "Mage",
        "elite": false,
        "attack": 3,
        "name": "Ethereal Arcanist",
        "id": "EX1_274",
        "text": "If you control a <b>Secret</b> at the end of your turn, gain +2/+2.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_124.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Ariel Olivetti",
        "mechanics": [
            "Combo"
        ],
        "type": "Spell",
        "fr": {
            "name": "Éviscération"
        },
        "flavor": "There is a high cost to Eviscerating your opponent:  It takes a long time to get blood stains out of leather armor.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Eviscerate",
        "id": "EX1_124",
        "text": "Deal $2 damage. <b>Combo:</b> Deal $4 damage instead.",
        "rarity": "Common"
    },
    {
        "set": "Classic",
        "name": "Experiments!",
        "id": "EX1_059e",
        "text": "Attack and Health have been swapped by Crazed Alchemist.",
        "type": "Enchantment",
        "fr": {
            "name": "Des expériences !"
        }
    },
    {
        "cardImage": "EX1_537.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Tom Baxa",
        "type": "Spell",
        "fr": {
            "name": "Tir explosif"
        },
        "flavor": "Pull the pin, count to 5, then shoot.  Then duck.",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Explosive Shot",
        "id": "EX1_537",
        "text": "Deal $5 damage to a minion and $2 damage to adjacent ones.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_610.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Brandon Kitkouski",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Piège explosif"
        },
        "flavor": "It traps your food AND cooks it for you!",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Explosive Trap",
        "id": "EX1_610",
        "text": "<b>Secret:</b> When your hero is attacked, deal $2 damage to all enemies.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_132.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "James Ryman",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Œil pour œil"
        },
        "flavor": "Justice sometimes takes the form of a closed fist into a soft cheek.",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Eye for an Eye",
        "id": "EX1_132",
        "text": "<b>Secret:</b> When your hero takes damage, deal that much damage to the enemy hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_564.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Raymond Swanland",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Manipulateur sans-visage"
        },
        "flavor": "The Faceless Ones are servants of Yogg-Saron, and they feed on fear. Right now they are feeding on your fear of accidentally disenchanting all your good cards.",
        "attack": 3,
        "faction": "Neutral",
        "name": "Faceless Manipulator",
        "id": "EX1_564",
        "text": "<b>Battlecry:</b> Choose a minion and become a copy of it.",
        "rarity": "Epic"
    },
    {
        "cardImage": "NEW1_023.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "race": "Dragon",
        "artist": "Samwise",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Dragon féerique"
        },
        "flavor": "Adorable.  Immune to Magic.  Doesn't pee on the rug.  The perfect pet!",
        "attack": 3,
        "name": "Faerie Dragon",
        "id": "NEW1_023",
        "text": "Can't be targeted by spells or Hero Powers.",
        "rarity": "Common"
    },
    {
        "playerClass": "Shaman",
        "set": "Classic",
        "artist": "Lars Grant-West",
        "name": "Far Sight",
        "id": "CS2_053e",
        "text": "One of your cards costs (3) less.",
        "type": "Enchantment",
        "fr": {
            "name": "Double vue"
        }
    },
    {
        "cardImage": "CS2_053.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Lars Grant-West",
        "type": "Spell",
        "fr": {
            "name": "Double vue"
        },
        "flavor": "Drek'thar can't see, but he can <i>see</i>. You know what I mean? It's ok if you don't.",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Far Sight",
        "id": "CS2_053",
        "text": "Draw a card. That card costs (3) less.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_301.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Demon",
        "artist": "John Polidora",
        "health": 5,
        "mechanics": [
            "Battlecry",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Gangregarde"
        },
        "flavor": "Yes, he'll fight for you.  BUT HE'S NOT GOING TO LIKE IT.",
        "playerClass": "Warlock",
        "attack": 3,
        "faction": "Neutral",
        "name": "Felguard",
        "id": "EX1_301",
        "text": "<b>Taunt</b>. <b>Battlecry:</b> Destroy one of your Mana Crystals.",
        "rarity": "Rare"
    },
    {
        "cardImage": "CS1_069.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Monica Langlois",
        "health": 6,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Rampant des tourbières"
        },
        "flavor": "He used to be called Bog Beast, but it confused people because he wasn't an actual beast.   Boom, New Name!",
        "attack": 3,
        "faction": "Alliance",
        "name": "Fen Creeper",
        "id": "CS1_069",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_248.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Clint Langley",
        "mechanics": [
            "Overload"
        ],
        "type": "Spell",
        "fr": {
            "name": "Esprit farouche"
        },
        "flavor": "Spirit wolves are like regular wolves with pom-poms.",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Feral Spirit",
        "id": "EX1_248",
        "text": "Summon two 2/3 Spirit Wolves with <b>Taunt</b>. <b>Overload:</b> (2)",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_finkle.png",
        "elite": true,
        "cost": 2,
        "set": "Classic",
        "attack": 3,
        "faction": "Neutral",
        "name": "Finkle Einhorn",
        "health": 3,
        "id": "EX1_finkle",
        "type": "Minion",
        "fr": {
            "name": "Finkle Einhorn"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_319.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "race": "Demon",
        "artist": "Alex Horley Orlandelli",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Diablotin des flammes"
        },
        "flavor": "Imps like being on fire.  They just do.",
        "playerClass": "Warlock",
        "attack": 3,
        "faction": "Neutral",
        "name": "Flame Imp",
        "id": "EX1_319",
        "text": "<b>Battlecry:</b> Deal 3 damage to your hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_614t.png",
        "cost": 1,
        "set": "Classic",
        "attack": 2,
        "name": "Flame of Azzinoth",
        "health": 1,
        "id": "EX1_614t",
        "type": "Minion",
        "fr": {
            "name": "Flamme d’Azzinoth"
        }
    },
    {
        "cardImage": "EX1_544.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Tyler Walpole",
        "type": "Spell",
        "fr": {
            "name": "Fusée éclairante"
        },
        "flavor": "Not only does it reveal your enemies, but it's also great for parties!",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Flare",
        "id": "EX1_544",
        "text": "All minions lose <b>Stealth</b>. Destroy all enemy <b>Secrets</b>. Draw a card.",
        "rarity": "Rare"
    },
    {
        "cardImage": "tt_004.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Goule mangeuse de chair"
        },
        "flavor": "'Flesheating' is an unfair name.  It's just that there's not really much else for him to eat.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Flesheating Ghoul",
        "id": "tt_004",
        "text": "Whenever a minion dies, gain +1 Attack.",
        "inPlayText": "Cannibalism",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_571.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Trevor Jacobs",
        "type": "Spell",
        "fr": {
            "name": "Force de la nature"
        },
        "flavor": "\"I think I'll just nap under these trees. Wait... AAAAAHHH!\" - Blinkfizz, the Unfortunate Gnome",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Force of Nature",
        "id": "EX1_571",
        "text": "Summon three 2/2 Treants with <b>Charge</b> that die at the end of the turn.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_251.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Ralph Horsley",
        "mechanics": [
            "Overload"
        ],
        "type": "Spell",
        "fr": {
            "name": "Fourche d’éclairs"
        },
        "flavor": "If you combine it with Spooned Lightning and Knived Lightning, you have the full dining set.",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Forked Lightning",
        "id": "EX1_251",
        "text": "Deal $2 damage to 2 random enemy minions. <b>Overload:</b> (2)",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_611.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Matt Gaser",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Piège givrant"
        },
        "flavor": "\"Dang, that's cold.\" - appropriate response to Freezing Trap, or a mean joke.",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Freezing Trap",
        "id": "EX1_611",
        "text": "<b>Secret:</b> When an enemy minion attacks, return it to its owner's hand and it costs (2) more.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_283.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Dan Scott",
        "health": 5,
        "mechanics": [
            "Battlecry",
            "Freeze"
        ],
        "type": "Minion",
        "fr": {
            "name": "Élémentaire de givre"
        },
        "flavor": "When a Water elemental and an Ice elemental love each other VERY much...",
        "attack": 5,
        "faction": "Neutral",
        "name": "Frost Elemental",
        "id": "EX1_283",
        "text": "<b>Battlecry:</b> <b>Freeze</b> a character.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_604.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Simon Bisley",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Berserker écumant"
        },
        "flavor": "He used to work as an accountant before he tried his hand at Berserkering.",
        "playerClass": "Warrior",
        "attack": 2,
        "faction": "Neutral",
        "name": "Frothing Berserker",
        "id": "EX1_604",
        "text": "Whenever a minion takes damage, gain +1 Attack.",
        "inPlayText": "Berserk",
        "rarity": "Rare"
    },
    {
        "set": "Classic",
        "name": "Full Belly",
        "id": "NEW1_017e",
        "text": "+2/+2.  Full of Murloc.",
        "type": "Enchantment",
        "fr": {
            "name": "Ventre plein"
        }
    },
    {
        "set": "Classic",
        "name": "Full Strength",
        "id": "CS2_181e",
        "text": "This minion has +2 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "En pleine forme"
        }
    },
    {
        "cardImage": "EX1_095.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Matt Dixon",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Commissaire-priseur"
        },
        "flavor": "He used to run the black market auction house, but there was just too much violence and he had to move.",
        "attack": 4,
        "faction": "Neutral",
        "name": "Gadgetzan Auctioneer",
        "id": "EX1_095",
        "text": "Whenever you cast a spell, draw a card.",
        "inPlayText": "Auctioning",
        "rarity": "Rare"
    },
    {
        "cardImage": "DS1_188.png",
        "cost": 7,
        "collectible": true,
        "set": "Classic",
        "artist": "Peter C. Lee",
        "durability": 2,
        "type": "Weapon",
        "fr": {
            "name": "Arc long du gladiateur"
        },
        "flavor": "The longbow allows shots to be fired from farther away and is useful for firing on particularly odorous targets.",
        "playerClass": "Hunter",
        "attack": 5,
        "faction": "Neutral",
        "name": "Gladiator's Longbow",
        "id": "DS1_188",
        "text": "Your hero is <b>Immune</b> while attacking.",
        "rarity": "Epic"
    },
    {
        "cardImage": "NEW1_040t.png",
        "cost": 2,
        "set": "Classic",
        "attack": 2,
        "name": "Gnoll",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "id": "NEW1_040t",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Gnoll"
        }
    },
    {
        "cardImage": "EX1_411.png",
        "cost": 7,
        "collectible": true,
        "set": "Classic",
        "artist": "Zoltan & Gabor",
        "durability": 1,
        "type": "Weapon",
        "fr": {
            "name": "Hurlesang"
        },
        "flavor": "Grommash Hellscream's famous axe.  Somehow this ended up in Prince Malchezaar's possession.  Quite the mystery!",
        "playerClass": "Warrior",
        "attack": 7,
        "faction": "Neutral",
        "name": "Gorehowl",
        "id": "EX1_411",
        "text": "Attacking a minion costs 1 Attack instead of 1 Durability.",
        "rarity": "Epic"
    },
    {
        "set": "Classic",
        "name": "Greenskin's Command",
        "id": "NEW1_024o",
        "text": "+1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Ordres de Vertepeau"
        }
    },
    {
        "cardImage": "EX1_414.png",
        "cost": 8,
        "collectible": true,
        "set": "Classic",
        "artist": "Glenn Rane",
        "health": 9,
        "mechanics": [
            "Charge",
            "Enrage"
        ],
        "type": "Minion",
        "fr": {
            "name": "Grommash Hurlenfer"
        },
        "flavor": "Grommash drank the tainted blood of Mannoroth, dooming the orcs to green skin and red eyes!  Maybe not his best decision.",
        "playerClass": "Warrior",
        "elite": true,
        "attack": 4,
        "faction": "Neutral",
        "name": "Grommash Hellscream",
        "id": "EX1_414",
        "text": "<b>Charge</b>\n<b>Enrage:</b> +6 Attack",
        "rarity": "Legendary"
    },
    {
        "set": "Classic",
        "name": "Growth",
        "id": "NEW1_038o",
        "text": "Gruul is growing...",
        "type": "Enchantment",
        "fr": {
            "name": "Croissance"
        }
    },
    {
        "cardImage": "NEW1_038.png",
        "cost": 8,
        "collectible": true,
        "set": "Classic",
        "artist": "Kev Walker",
        "health": 7,
        "type": "Minion",
        "fr": {
            "name": "Gruul"
        },
        "flavor": "He's Gruul \"the Dragonkiller\".  He just wanted to cuddle them… he never meant to…",
        "elite": true,
        "attack": 7,
        "name": "Gruul",
        "id": "NEW1_038",
        "text": "At the end of each turn, gain +1/+1 .",
        "inPlayText": "Growth",
        "rarity": "Legendary"
    },
    {
        "set": "Classic",
        "name": "Hand of Argus",
        "id": "EX1_093e",
        "text": "+1/+1 and <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Main d’Argus"
        }
    },
    {
        "cardImage": "EX1_558.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Matt Dixon",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Harrison Jones"
        },
        "flavor": "“That belongs in the Hall of Explorers!”",
        "elite": true,
        "attack": 5,
        "faction": "Neutral",
        "name": "Harrison Jones",
        "id": "EX1_558",
        "text": "<b>Battlecry:</b> Destroy your opponent's weapon and draw cards equal to its Durability.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_556.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Mech",
        "artist": "Brian Despain",
        "health": 3,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Golem des moissons"
        },
        "flavor": "\"Overheat threshold exceeded. System failure. Wheat clog in port two. Shutting down.\"",
        "attack": 2,
        "faction": "Neutral",
        "name": "Harvest Golem",
        "id": "EX1_556",
        "text": "<b>Deathrattle:</b> Summon a 2/1 Damaged Golem.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_137.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "James Zhang",
        "mechanics": [
            "Combo"
        ],
        "type": "Spell",
        "fr": {
            "name": "Casse-tête"
        },
        "flavor": "When all else fails, nothing beats a swift whack upside the head.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Headcrack",
        "id": "EX1_137",
        "text": "Deal $2 damage to the enemy hero. <b>Combo:</b> Return this to your hand next turn.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_409t.png",
        "playerClass": "Warrior",
        "cost": 1,
        "set": "Classic",
        "attack": 1,
        "durability": 3,
        "name": "Heavy Axe",
        "id": "EX1_409t",
        "type": "Weapon",
        "fr": {
            "name": "Hache lourde"
        }
    },
    {
        "cardImage": "NEW1_040.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Laurel D. Austin",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Lardeur"
        },
        "flavor": "Hogger is super powerful. If you kill him, it's because he <i>let</i> you.",
        "elite": true,
        "attack": 4,
        "name": "Hogger",
        "id": "NEW1_040",
        "text": "At the end of your turn, summon a 2/2 Gnoll with <b>Taunt</b>.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_624.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Miguel Coimbra",
        "type": "Spell",
        "fr": {
            "name": "Flammes sacrées"
        },
        "flavor": "Often followed by Holy Smokes!",
        "playerClass": "Priest",
        "name": "Holy Fire",
        "id": "EX1_624",
        "text": "Deal $5 damage. Restore #5 Health to your hero.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_365.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Justin Sweet",
        "type": "Spell",
        "fr": {
            "name": "Colère divine"
        },
        "flavor": "C'mon Molten Giant!!",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Holy Wrath",
        "id": "EX1_365",
        "text": "Draw a card and deal damage equal to its cost.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_538t.png",
        "cost": 1,
        "set": "Classic",
        "race": "Beast",
        "health": 1,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chien"
        },
        "playerClass": "Hunter",
        "attack": 1,
        "name": "Hound",
        "id": "EX1_538t",
        "text": "<b>Charge</b>"
    },
    {
        "set": "Classic",
        "name": "Hour of Twilight",
        "id": "EX1_043e",
        "text": "Increased Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Heure du Crépuscule"
        }
    },
    {
        "cardImage": "NEW1_017.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Jaemin Kim",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Crabe affamé"
        },
        "flavor": "Murloc.  It's what's for dinner.",
        "attack": 1,
        "name": "Hungry Crab",
        "id": "NEW1_017",
        "text": "<b>Battlecry:</b> Destroy a Murloc and gain +2/+2.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_534t.png",
        "cost": 2,
        "set": "Classic",
        "race": "Beast",
        "artist": "Andrew Robinson",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Hyène"
        },
        "playerClass": "Hunter",
        "attack": 2,
        "name": "Hyena",
        "id": "EX1_534t",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_289.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Garner",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Barrière de glace"
        },
        "flavor": "This is Rank 1.  Rank 2 is Chocolate Milk Barrier.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Ice Barrier",
        "id": "EX1_289",
        "text": "<b>Secret:</b> When your hero is attacked, gain 8 Armor.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_295.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Carl Frank",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Bloc de glace"
        },
        "flavor": "Ice is nice, and will suffice!",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Ice Block",
        "id": "EX1_295",
        "text": "<b>Secret:</b> When your hero takes fatal damage, prevent it and become <b>Immune</b> this turn.",
        "rarity": "Epic"
    },
    {
        "playerClass": "Mage",
        "set": "Classic",
        "name": "Ice Block",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "EX1_295o",
        "text": "Your hero is <b>Immune</b> this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Bloc de glace"
        }
    },
    {
        "cardImage": "CS2_031.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "mechanics": [
            "Freeze"
        ],
        "type": "Spell",
        "fr": {
            "name": "Javelot de glace"
        },
        "flavor": "The trick is not to break the lance.  Otherwise, you have \"Ice Pieces.\"  Ice Pieces aren't as effective.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Ice Lance",
        "id": "CS2_031",
        "text": "<b>Freeze</b> a character. If it was already <b>Frozen</b>, deal $4 damage instead.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_614.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "race": "Demon",
        "artist": "Alex Horley Orlandelli",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Illidan Hurlorage"
        },
        "flavor": "Illidan's brother, Malfurion, imprisoned him beneath Hyjal for 10,000 years.  Stormrages are not good at letting go of grudges.",
        "elite": true,
        "attack": 7,
        "faction": "Neutral",
        "name": "Illidan Stormrage",
        "id": "EX1_614",
        "text": "Whenever you play a card, summon a 2/1 Flame of Azzinoth.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_598.png",
        "cost": 1,
        "set": "Classic",
        "race": "Demon",
        "attack": 1,
        "faction": "Neutral",
        "name": "Imp",
        "health": 1,
        "id": "EX1_598",
        "type": "Minion",
        "fr": {
            "name": "Diablotin"
        },
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_597.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Mark Gibbons",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Maître des diablotins"
        },
        "flavor": "She would enjoy the job a lot more if she just could get the imps to QUIT BITING HER.",
        "attack": 1,
        "faction": "Neutral",
        "name": "Imp Master",
        "id": "EX1_597",
        "text": "At the end of your turn, deal 1 damage to this minion and summon a 1/1 Imp.",
        "inPlayText": "Imp Master",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_tk34.png",
        "cost": 6,
        "set": "Classic",
        "race": "Demon",
        "health": 6,
        "type": "Minion",
        "fr": {
            "name": "Infernal"
        },
        "playerClass": "Warlock",
        "attack": 6,
        "faction": "Neutral",
        "name": "Infernal",
        "id": "EX1_tk34",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_tk33.png",
        "playerClass": "Warlock",
        "cost": 2,
        "set": "Classic",
        "faction": "Neutral",
        "name": "INFERNO!",
        "id": "EX1_tk33",
        "text": "<b>Hero Power</b>\nSummon a 6/6 Infernal.",
        "type": "Hero Power",
        "fr": {
            "name": "FEU D’ENFER !"
        }
    },
    {
        "playerClass": "Priest",
        "set": "Classic",
        "name": "Infusion",
        "id": "EX1_623e",
        "text": "+3 Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Infusion"
        }
    },
    {
        "cardImage": "CS2_181.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Samwise",
        "health": 7,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Maître-lame blessé"
        },
        "flavor": "He claims it is an old war wound, but we think he just cut himself shaving.",
        "attack": 4,
        "faction": "Horde",
        "name": "Injured Blademaster",
        "id": "CS2_181",
        "text": "<b>Battlecry:</b> Deal 4 damage to HIMSELF.",
        "inPlayText": "Weakened",
        "rarity": "Rare"
    },
    {
        "playerClass": "Priest",
        "set": "Classic",
        "name": "Inner Fire",
        "id": "CS1_129e",
        "text": "This minion's Attack is equal to its Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Feu intérieur"
        }
    },
    {
        "cardImage": "CS1_129.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Steve Prescott",
        "type": "Spell",
        "fr": {
            "name": "Feu intérieur"
        },
        "flavor": "Good idea: Buffing your minions.  Bad idea: Starting a conversation in the Barrens.",
        "playerClass": "Priest",
        "faction": "Neutral",
        "name": "Inner Fire",
        "id": "CS1_129",
        "text": "Change a minion's Attack to be equal to its Health.",
        "rarity": "Common"
    },
    {
        "playerClass": "Warrior",
        "set": "Classic",
        "name": "Inner Rage",
        "id": "EX1_607e",
        "text": "+2 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Rage intérieure"
        }
    },
    {
        "cardImage": "EX1_607.png",
        "cost": 0,
        "collectible": true,
        "set": "Classic",
        "artist": "Slawomir Maniak",
        "type": "Spell",
        "fr": {
            "name": "Rage intérieure"
        },
        "flavor": "They're only smiling on the outside.",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Inner Rage",
        "id": "EX1_607",
        "text": "Deal $1 damage to a minion and give it +2 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_203.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Trevor Jacobs",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chouette bec-de-fer"
        },
        "flavor": "Their wings are silent but their screech is... whatever the opposite of silent is.",
        "attack": 2,
        "faction": "Horde",
        "name": "Ironbeak Owl",
        "id": "CS2_203",
        "text": "<b>Battlecry:</b> <b>Silence</b> a minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_017.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Jaemin Kim",
        "health": 2,
        "mechanics": [
            "Stealth"
        ],
        "type": "Minion",
        "fr": {
            "name": "Panthère de la jungle"
        },
        "flavor": "Stranglethorn is a beautiful place to visit, but you wouldn't want to live there.",
        "attack": 4,
        "faction": "Horde",
        "name": "Jungle Panther",
        "id": "EX1_017",
        "text": "<b>Stealth</b>",
        "rarity": "Common"
    },
    {
        "playerClass": "Paladin",
        "set": "Classic",
        "name": "Justice Served",
        "id": "EX1_366e",
        "text": "Has +1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Justice rendue"
        }
    },
    {
        "cardImage": "EX1_166.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Gabor Szikszai",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Gardien du bosquet"
        },
        "flavor": "These guys just show up and start Keeping your Groves without even asking.",
        "playerClass": "Druid",
        "attack": 2,
        "faction": "Neutral",
        "name": "Keeper of the Grove",
        "id": "EX1_166",
        "text": "<b>Choose One</b> - Deal 2 damage; or <b>Silence</b> a minion.",
        "rarity": "Rare"
    },
    {
        "set": "Classic",
        "name": "Keeping Secrets",
        "id": "EX1_080o",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Garde des secrets"
        }
    },
    {
        "cardImage": "NEW1_005.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Dave Allsop",
        "health": 3,
        "mechanics": [
            "Combo"
        ],
        "type": "Minion",
        "fr": {
            "name": "Kidnappeur"
        },
        "flavor": "He just wants people to see his vacation photos.",
        "playerClass": "Rogue",
        "attack": 5,
        "name": "Kidnapper",
        "id": "NEW1_005",
        "text": "<b>Combo:</b> Return a minion to its owner's hand.",
        "rarity": "Epic"
    },
    {
        "set": "Classic",
        "name": "Kill Millhouse!",
        "id": "NEW1_029t",
        "text": "Spells cost (0) this turn!",
        "type": "Enchantment",
        "fr": {
            "name": "Tuez Millhouse !"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_543.png",
        "cost": 9,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Alex Horley Orlandelli",
        "health": 8,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "Roi Krush"
        },
        "flavor": "The best defense against King Krush is to have someone you don’t like standing in front of you.",
        "playerClass": "Hunter",
        "elite": true,
        "attack": 8,
        "faction": "Neutral",
        "name": "King Krush",
        "id": "EX1_543",
        "text": "<b>Charge</b>",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_014.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Sunny Gho",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Roi Mukla"
        },
        "flavor": "King Mukla wanders Jaguero Isle, searching for love.",
        "elite": true,
        "attack": 5,
        "name": "King Mukla",
        "id": "EX1_014",
        "text": "<b>Battlecry:</b> Give your opponent 2 Bananas.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_612.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Popo Wei",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mage du Kirin Tor"
        },
        "flavor": "The Kirin Tor reside in the floating city of Dalaran.  How do you make a Dalaran float?  Two scoops of ice cream, one scoop of Dalaran.",
        "playerClass": "Mage",
        "attack": 4,
        "faction": "Neutral",
        "name": "Kirin Tor Mage",
        "id": "EX1_612",
        "text": "<b>Battlecry:</b> The next <b>Secret</b> you play this turn costs (0).",
        "rarity": "Rare"
    },
    {
        "cardImage": "NEW1_019.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Matt Cavotta",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Jongleur de couteaux"
        },
        "flavor": "Ambitious Knife Jugglers sometimes graduate to Bomb Jugglers.    They never last long enough to make it onto a card though.",
        "attack": 3,
        "name": "Knife Juggler",
        "id": "NEW1_019",
        "text": "After you summon a minion, deal 1 damage to a random enemy.",
        "rarity": "Rare"
    },
    {
        "cardImage": "DREAM_01.png",
        "playerClass": "Dream",
        "cost": 3,
        "set": "Classic",
        "attack": 3,
        "name": "Laughing Sister",
        "health": 5,
        "id": "DREAM_01",
        "text": "Can't be targeted by spells or Hero Powers.",
        "inPlayText": "Quick",
        "type": "Minion",
        "fr": {
            "name": "Sœur rieuse"
        }
    },
    {
        "cardImage": "EX1_241.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Dan Scott",
        "mechanics": [
            "Overload"
        ],
        "type": "Spell",
        "fr": {
            "name": "Explosion de lave"
        },
        "flavor": "It's like an ocean of liquid magma in your mouth!",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Lava Burst",
        "id": "EX1_241",
        "text": "Deal $5 damage. <b>Overload:</b> (2)",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_354.png",
        "cost": 8,
        "collectible": true,
        "set": "Classic",
        "artist": "Raymond Swanland",
        "type": "Spell",
        "fr": {
            "name": "Imposition des mains"
        },
        "flavor": "A grammatically awkward life saver.",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Lay on Hands",
        "id": "EX1_354",
        "text": "Restore #8 Health. Draw 3 cards.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_160b.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Leader of the Pack",
        "id": "EX1_160b",
        "text": "Give your minions +1/+1.",
        "type": "Spell",
        "fr": {
            "name": "Chef de la meute"
        }
    },
    {
        "playerClass": "Druid",
        "set": "Classic",
        "name": "Leader of the Pack",
        "id": "EX1_160be",
        "text": "+1/+1",
        "type": "Enchantment",
        "fr": {
            "name": "Chef de la meute"
        }
    },
    {
        "cardImage": "EX1_116.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Gabe from Penny Arcade",
        "health": 2,
        "mechanics": [
            "Battlecry",
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "Leeroy Jenkins"
        },
        "flavor": "At least he has Angry Chicken.",
        "elite": true,
        "attack": 6,
        "faction": "Alliance",
        "name": "Leeroy Jenkins",
        "id": "EX1_116",
        "text": "<b>Charge</b>. <b>Battlecry:</b> Summon two 1/1 Whelps for your opponent.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_029.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Glenn Rane",
        "health": 1,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Gnome lépreux"
        },
        "flavor": "He really just wants to be your friend, but the constant rejection is starting to really get to him.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Leper Gnome",
        "id": "EX1_029",
        "text": "<b>Deathrattle:</b> Deal 2 damage to the enemy hero.",
        "rarity": "Common"
    },
    {
        "set": "Classic",
        "name": "Level Up!",
        "id": "EX1_044e",
        "text": "Increased Attack and Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Gain de niveau !"
        }
    },
    {
        "cardImage": "EX1_238.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Daarken",
        "mechanics": [
            "Overload"
        ],
        "type": "Spell",
        "fr": {
            "name": "Éclair"
        },
        "flavor": "Lightning Bolt! Lightning Bolt! Lightning Bolt!",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Lightning Bolt",
        "id": "EX1_238",
        "text": "Deal $3 damage. <b>Overload:</b> (1)",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_259.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Christopher Moeller",
        "mechanics": [
            "Overload"
        ],
        "type": "Spell",
        "fr": {
            "name": "Tempête de foudre"
        },
        "flavor": "An umbrella won't be effective, I'm afraid.",
        "playerClass": "Shaman",
        "faction": "Neutral",
        "name": "Lightning Storm",
        "id": "EX1_259",
        "text": "Deal $2-$3 damage to all enemy minions. <b>Overload:</b> (2)",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_335.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Daarken",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Rejeton de lumière"
        },
        "flavor": "Spawn of the Light? Or Pawn of the Lights?",
        "playerClass": "Priest",
        "attack": 0,
        "faction": "Neutral",
        "name": "Lightspawn",
        "id": "EX1_335",
        "text": "This minion's Attack is always equal to its Health.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_001.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Erik Ko",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Gardelumière"
        },
        "flavor": "She’s smaller than her sisters Mediumwarden and Heavywarden.",
        "attack": 1,
        "name": "Lightwarden",
        "id": "EX1_001",
        "text": "Whenever a character is healed, gain +2 Attack.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_341.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Blizzard Entertainment",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Puits de lumière"
        },
        "flavor": "It isn't clear if people ignore the Lightwell, or if it is just invisible.",
        "playerClass": "Priest",
        "attack": 0,
        "faction": "Neutral",
        "name": "Lightwell",
        "id": "EX1_341",
        "text": "At the start of your turn, restore 3 Health to a damaged friendly character.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_096.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Jim Nelson",
        "health": 1,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Amasseur de butin"
        },
        "flavor": "Always roll need.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Loot Hoarder",
        "id": "EX1_096",
        "text": "<b>Deathrattle:</b> Draw a card.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_323h.png",
        "cost": 0,
        "set": "Classic",
        "race": "Demon",
        "health": 15,
        "type": "Hero",
        "fr": {
            "name": "Seigneur Jaraxxus"
        },
        "playerClass": "Warlock",
        "attack": 0,
        "faction": "Neutral",
        "name": "Lord Jaraxxus",
        "id": "EX1_323h",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_323.png",
        "cost": 9,
        "collectible": true,
        "set": "Classic",
        "race": "Demon",
        "artist": "Alex Horley Orlandelli",
        "health": 15,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Seigneur Jaraxxus"
        },
        "flavor": "\"TRIFLING GNOME! YOUR ARROGANCE WILL BE YOUR UNDOING!!!!\"",
        "playerClass": "Warlock",
        "elite": true,
        "attack": 3,
        "name": "Lord Jaraxxus",
        "id": "EX1_323",
        "text": "<b>Battlecry:</b> Destroy your hero and replace it with Lord Jaraxxus.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_100.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Mark Zug",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Chroniqueur Cho"
        },
        "flavor": "Lorewalker Cho archives and shares tales from the land of Pandaria, but his favorite story is the one where Joey and Phoebe go on a road trip.",
        "elite": true,
        "attack": 0,
        "faction": "Neutral",
        "name": "Lorewalker Cho",
        "id": "EX1_100",
        "text": "Whenever a player casts a spell, put a copy into the other player’s hand.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_082.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Mike Sass",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Bombardier fou"
        },
        "flavor": "He's not really all that crazy, he is just not as careful with explosives as he should be.",
        "attack": 3,
        "faction": "Alliance",
        "name": "Mad Bomber",
        "id": "EX1_082",
        "text": "<b>Battlecry:</b> Deal 3 damage randomly split between all other characters.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_563.png",
        "cost": 9,
        "collectible": true,
        "set": "Classic",
        "race": "Dragon",
        "artist": "Michael Komarck",
        "health": 12,
        "mechanics": [
            "Spellpower"
        ],
        "type": "Minion",
        "fr": {
            "name": "Malygos"
        },
        "flavor": "Malygos hates it when mortals use magic.  He gets so mad!",
        "elite": true,
        "attack": 4,
        "faction": "Neutral",
        "name": "Malygos",
        "id": "EX1_563",
        "text": "<b>Spell Damage +5</b>",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_055.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Hideaki Takamura",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Accro au mana"
        },
        "flavor": "She’s trying to kick the habit, but still takes some mana whenever she has a stressful day.",
        "attack": 1,
        "faction": "Alliance",
        "name": "Mana Addict",
        "id": "EX1_055",
        "text": "Whenever you cast a spell, gain +2 Attack this turn.",
        "inPlayText": "Addicted",
        "rarity": "Rare"
    },
    {
        "playerClass": "Mage",
        "set": "Classic",
        "name": "Mana Gorged",
        "id": "NEW1_012o",
        "text": "Increased attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Gorgé de mana"
        }
    },
    {
        "cardImage": "EX1_575.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Totem",
        "artist": "Scott Altmann",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Totem de vague de mana"
        },
        "flavor": "It is said that some shaman can say \"Floatin' totem\" 10 times, fast.",
        "playerClass": "Shaman",
        "attack": 0,
        "faction": "Neutral",
        "name": "Mana Tide Totem",
        "id": "EX1_575",
        "text": "At the end of your turn, draw a card.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_616.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Luca Zontini",
        "health": 2,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Âme en peine de mana"
        },
        "flavor": "They come out at night to eat leftover mana crystals. \"Mmmmmm,\" they say.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Mana Wraith",
        "id": "EX1_616",
        "text": "ALL minions cost (1) more.",
        "rarity": "Rare"
    },
    {
        "cardImage": "NEW1_012.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Blizzard Cinematics",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Wyrm de mana"
        },
        "flavor": "These wyrms feed on arcane energies, and while they are generally considered a nuisance rather than a real threat, you really shouldn't leave them alone with a bucket of mana.",
        "playerClass": "Mage",
        "attack": 1,
        "name": "Mana Wyrm",
        "id": "NEW1_012",
        "text": "Whenever you cast a spell, gain +1 Attack.",
        "inPlayText": "Gorging",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_155b.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Mark of Nature",
        "id": "EX1_155b",
        "text": "+4 Health and <b>Taunt</b>.",
        "type": "Spell",
        "fr": {
            "name": "Marque de la nature"
        }
    },
    {
        "playerClass": "Druid",
        "set": "Classic",
        "name": "Mark of Nature",
        "id": "EX1_155ae",
        "text": "This minion has +4 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Marque de la nature"
        }
    },
    {
        "cardImage": "EX1_155a.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Mark of Nature",
        "id": "EX1_155a",
        "text": "+4 Attack.",
        "type": "Spell",
        "fr": {
            "name": "Marque de la nature"
        }
    },
    {
        "cardImage": "EX1_155.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Clint Langley",
        "type": "Spell",
        "fr": {
            "name": "Marque de la nature"
        },
        "flavor": "Druids call it the \"Mark of Nature.\"  Everyone else calls it \"needing a bath.\"",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Mark of Nature",
        "id": "EX1_155",
        "text": "<b>Choose One</b> - Give a minion +4 Attack; or +4 Health and <b>Taunt</b>.",
        "rarity": "Common"
    },
    {
        "playerClass": "Druid",
        "set": "Classic",
        "name": "Mark of Nature",
        "id": "EX1_155be",
        "text": "This minion has +4 Health and <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Marque de la nature"
        }
    },
    {
        "cardImage": "EX1_626.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Sean O'Daniels",
        "mechanics": [
            "Silence"
        ],
        "type": "Spell",
        "fr": {
            "name": "Dissipation de masse"
        },
        "flavor": "It dispels buffs, powers, hopes, and dreams.",
        "playerClass": "Priest",
        "name": "Mass Dispel",
        "id": "EX1_626",
        "text": "<b>Silence</b> all enemy minions. Draw a card.",
        "rarity": "Rare"
    },
    {
        "cardImage": "NEW1_014.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Ron Spencer",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Maîtresse du déguisement"
        },
        "flavor": "She's actually a male tauren.  People don't call him \"Master of Disguise\" for nothing.",
        "playerClass": "Rogue",
        "attack": 4,
        "name": "Master of Disguise",
        "id": "NEW1_014",
        "text": "<b>Battlecry:</b> Give a friendly minion <b>Stealth</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "NEW1_037.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "E.M. Gist",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Maître fabricant d’épées"
        },
        "flavor": "He's currently trying to craft a \"flail-axe\", but all the other swordsmiths say it can't be done.",
        "attack": 1,
        "name": "Master Swordsmith",
        "id": "NEW1_037",
        "text": "At the end of your turn, give another random friendly minion +1 Attack.",
        "rarity": "Rare"
    },
    {
        "cardImage": "NEW1_029.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Jim Nelson",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Millhouse Tempête-de-Mana"
        },
        "flavor": "\"I'm gonna light you up, sweetcheeks!\"",
        "elite": true,
        "attack": 4,
        "name": "Millhouse Manastorm",
        "id": "NEW1_029",
        "text": "<b>Battlecry:</b> Enemy spells cost (0) next turn.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_085.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Leo Che",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Contrôleur mental"
        },
        "flavor": "Mind Control technology is getting better, but that's not saying much.",
        "attack": 3,
        "faction": "Alliance",
        "name": "Mind Control Tech",
        "id": "EX1_085",
        "text": "<b>Battlecry:</b> If your opponent has 4 or more minions, take control of one at random.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Priest",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Mind Controlling",
        "mechanics": [
            "Summoned"
        ],
        "id": "EX1_tk31",
        "type": "Enchantment",
        "fr": {
            "name": "Contrôle mental"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_625t2.png",
        "playerClass": "Priest",
        "cost": 2,
        "set": "Classic",
        "name": "Mind Shatter",
        "id": "EX1_625t2",
        "text": "<b>Hero Power</b>\nDeal $3 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Briser l’esprit"
        }
    },
    {
        "cardImage": "EX1_625t.png",
        "playerClass": "Priest",
        "cost": 2,
        "set": "Classic",
        "name": "Mind Spike",
        "id": "EX1_625t",
        "text": "<b>Hero Power</b>\nDeal $2 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Pointe mentale"
        }
    },
    {
        "cardImage": "EX1_345.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Zoltan & Gabor",
        "type": "Spell",
        "fr": {
            "name": "Jeux d’esprit"
        },
        "flavor": "Sometimes it feels like this is all a game.",
        "playerClass": "Priest",
        "faction": "Neutral",
        "name": "Mindgames",
        "id": "EX1_345",
        "text": "Put a copy of a random minion from your opponent's deck into the battlefield.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_294.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Raven Mimura",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Entité miroir"
        },
        "flavor": "\"You go first.\" - Krush'gor the Behemoth, to his pet boar.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Mirror Entity",
        "id": "EX1_294",
        "text": "<b>Secret:</b> When your opponent plays a minion, summon a copy of it.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_533.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Daren Bader",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Détournement"
        },
        "flavor": "Sometimes it's as simple as putting on a fake mustache and pointing at someone else.",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Misdirection",
        "id": "EX1_533",
        "text": "<b>Secret:</b> When a character attacks your hero, instead he attacks another random character.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_396.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Cole Eastburn",
        "health": 7,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Gardien mogu’shan"
        },
        "flavor": "All these guys ever do is talk about the Thunder King.   BOOOORRRINNG!",
        "attack": 1,
        "faction": "Neutral",
        "name": "Mogu'shan Warden",
        "id": "EX1_396",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_620.png",
        "cost": 20,
        "collectible": true,
        "set": "Classic",
        "artist": "Glenn Rane",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Géant de lave"
        },
        "flavor": "He gets terrible heartburn.  BECAUSE HE IS FULL OF LAVA.",
        "attack": 8,
        "name": "Molten Giant",
        "id": "EX1_620",
        "text": "Costs (1) less for each damage your hero has taken.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_166a.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Moonfire",
        "id": "EX1_166a",
        "text": "Deal 2 damage.",
        "type": "Spell",
        "fr": {
            "name": "Éclat lunaire"
        }
    },
    {
        "cardImage": "EX1_408.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Zoltan & Gabor",
        "type": "Spell",
        "fr": {
            "name": "Frappe mortelle"
        },
        "flavor": "\"If you only use one ability, use Mortal Strike.\" - The Warrior Code, Line 6",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Mortal Strike",
        "id": "EX1_408",
        "text": "Deal $4 damage. If you have 12 or less Health, deal $6 instead.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_105.png",
        "cost": 12,
        "collectible": true,
        "set": "Classic",
        "artist": "Samwise",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Géant des montagnes"
        },
        "flavor": "His mother said that he was just big boned.",
        "attack": 8,
        "faction": "Neutral",
        "name": "Mountain Giant",
        "id": "EX1_105",
        "text": "Costs (1) less for each other card in your hand.",
        "rarity": "Epic"
    },
    {
        "set": "Classic",
        "name": "Mrgglaargl!",
        "id": "EX1_507e",
        "text": "Murloc Warleader is granting +2/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Mrgglaargl !"
        }
    },
    {
        "set": "Classic",
        "name": "Mrghlglhal",
        "id": "EX1_103e",
        "text": "+2 Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Mrghlglhal"
        }
    },
    {
        "cardImage": "EX1_509.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "race": "Murloc",
        "artist": "Jaemin Kim",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Mande-flots murloc"
        },
        "flavor": "This guy gets crazy strong at family reunions.",
        "attack": 1,
        "faction": "Neutral",
        "name": "Murloc Tidecaller",
        "id": "EX1_509",
        "text": "Whenever a Murloc is summoned, gain +1 Attack.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_507.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Murloc",
        "artist": "Tim McBurnie",
        "health": 3,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chef de guerre murloc"
        },
        "flavor": "Do Murlocs ever get tired of making the same old sound?  Nope!  Mrglglrglglglglglglgl!",
        "attack": 3,
        "faction": "Neutral",
        "name": "Murloc Warleader",
        "id": "EX1_507",
        "text": "ALL other Murlocs have +2/+1.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_557.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Steve Prescott",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Nat Pagle"
        },
        "flavor": "Nat Pagle, Azeroth's premier fisherman!  He invented the Auto-Angler 3000, the Extendo-Pole 3000, and the Lure-o-matic 2099 (still in testing).",
        "elite": true,
        "attack": 0,
        "faction": "Neutral",
        "name": "Nat Pagle",
        "id": "EX1_557",
        "text": "At the start of your turn, you have a 50% chance to draw an extra card.",
        "inPlayText": "Fishing",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_161.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Leo Che",
        "type": "Spell",
        "fr": {
            "name": "Acclimatation"
        },
        "flavor": "Another one bites the dust.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Naturalize",
        "id": "EX1_161",
        "text": "Destroy a minion. Your opponent draws 2 cards.",
        "rarity": "Common"
    },
    {
        "playerClass": "Warrior",
        "set": "Classic",
        "name": "Needs Sharpening",
        "id": "EX1_411e2",
        "text": "Decreased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Affûtage nécessaire"
        }
    },
    {
        "set": "Classic",
        "name": "Nightmare",
        "id": "DREAM_05e",
        "text": "This minion has +5/+5, but will be destroyed soon.",
        "type": "Enchantment",
        "fr": {
            "name": "Cauchemar"
        }
    },
    {
        "cardImage": "DREAM_05.png",
        "playerClass": "Dream",
        "cost": 0,
        "set": "Classic",
        "name": "Nightmare",
        "id": "DREAM_05",
        "text": "Give a minion +5/+5. At the start of your next turn, destroy it.",
        "type": "Spell",
        "fr": {
            "name": "Cauchemar"
        }
    },
    {
        "cardImage": "EX1_130.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Zoltan & Gabor",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Noble sacrifice"
        },
        "flavor": "We will always remember you, \"Defender!\"",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Noble Sacrifice",
        "id": "EX1_130",
        "text": "<b>Secret:</b> When an enemy attacks, summon a 2/1 Defender as the new target.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_164a.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Nourish",
        "id": "EX1_164a",
        "text": "Gain 2 Mana Crystals.",
        "type": "Spell",
        "fr": {
            "name": "Nourrir"
        }
    },
    {
        "cardImage": "EX1_164.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Terese Nielsen",
        "type": "Spell",
        "fr": {
            "name": "Nourrir"
        },
        "flavor": "Druids take nourishment from many things: the power of nature, the songbird's chirp, a chocolate cake.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Nourish",
        "id": "EX1_164",
        "text": "<b>Choose One</b> - Gain 2 Mana Crystals; or Draw 3 cards.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_164b.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Nourish",
        "id": "EX1_164b",
        "text": "Draw 3 cards.",
        "type": "Spell",
        "fr": {
            "name": "Nourrir"
        }
    },
    {
        "cardImage": "EX1_560.png",
        "cost": 9,
        "collectible": true,
        "set": "Classic",
        "race": "Dragon",
        "artist": "James Ryman",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Nozdormu"
        },
        "flavor": "Time to write some flavor text.",
        "elite": true,
        "attack": 8,
        "faction": "Neutral",
        "name": "Nozdormu",
        "id": "EX1_560",
        "text": "Players only have 15 seconds to take their turns.",
        "inPlayText": "Aspect of Time",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_562.png",
        "cost": 9,
        "collectible": true,
        "set": "Classic",
        "race": "Dragon",
        "artist": "Dany Orizio",
        "health": 8,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Onyxia"
        },
        "flavor": "Onyxia long manipulated the Stormwind Court by disguising herself as Lady Katrana Prestor.   You would have thought that the giant wings and scales would have been a giveaway.",
        "elite": true,
        "attack": 8,
        "faction": "Neutral",
        "name": "Onyxia",
        "id": "EX1_562",
        "text": "<b>Battlecry:</b> Summon 1/1 Whelps until your side of the battlefield is full.",
        "rarity": "Legendary"
    },
    {
        "playerClass": "Shaman",
        "set": "Classic",
        "name": "Overloading",
        "id": "EX1_258e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Surcharge"
        }
    },
    {
        "cardImage": "EX1_160t.png",
        "playerClass": "Druid",
        "cost": 2,
        "set": "Classic",
        "race": "Beast",
        "attack": 3,
        "name": "Panther",
        "health": 2,
        "id": "EX1_160t",
        "type": "Minion",
        "fr": {
            "name": "Panthère"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_522.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Ben Olson",
        "health": 1,
        "mechanics": [
            "Poisonous",
            "Stealth"
        ],
        "type": "Minion",
        "fr": {
            "name": "Assassin patient"
        },
        "flavor": "He’s not really that patient. It just takes a while for someone to walk by that he can actually reach.",
        "playerClass": "Rogue",
        "attack": 1,
        "faction": "Neutral",
        "name": "Patient Assassin",
        "id": "EX1_522",
        "text": "<b>Stealth</b>. Destroy any minion damaged by this minion.",
        "inPlayText": "Sharpening",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_133.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Daren Bader",
        "durability": 2,
        "mechanics": [
            "Battlecry",
            "Combo"
        ],
        "type": "Weapon",
        "fr": {
            "name": "Lame de la perdition"
        },
        "flavor": "Perdition's Blade is Ragnaros's back-up weapon while Sulfuras is in the shop.",
        "playerClass": "Rogue",
        "attack": 2,
        "faction": "Neutral",
        "name": "Perdition's Blade",
        "id": "EX1_133",
        "text": "<b>Battlecry:</b> Deal 1 damage. <b>Combo:</b> Deal 2 instead.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_076.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Ron Spears",
        "health": 2,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Minuscule invocatrice"
        },
        "flavor": "She's quite jealous of the Gallon-Sized Summoner.",
        "attack": 2,
        "faction": "Alliance",
        "name": "Pint-Sized Summoner",
        "id": "EX1_076",
        "text": "The first minion you play each turn costs (1) less.",
        "inPlayText": "Ritual",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_313.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "race": "Demon",
        "artist": "Glenn Rane",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Seigneur des abîmes"
        },
        "flavor": "Mannoroth, Magtheridon, and Brutallus may be dead, but it turns out there are a LOT of pit lords.",
        "playerClass": "Warlock",
        "attack": 5,
        "faction": "Neutral",
        "name": "Pit Lord",
        "id": "EX1_313",
        "text": "<b>Battlecry:</b> Deal 5 damage to your hero.",
        "rarity": "Epic"
    },
    {
        "playerClass": "Mage",
        "set": "Classic",
        "name": "Power of the Kirin Tor",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "EX1_612o",
        "text": "Your next Secret costs (0).",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance du Kirin Tor"
        }
    },
    {
        "cardImage": "EX1_160.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Steve Tappin",
        "type": "Spell",
        "fr": {
            "name": "Puissance du fauve"
        },
        "flavor": "Never look a panther in the eye.  Or is it 'Always look a panther in the eye'?  Well, it's one of those.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Power of the Wild",
        "id": "EX1_160",
        "text": "<b>Choose One</b> - Give your minions +1/+1; or Summon a 3/2 Panther.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_316.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Tom Baxa",
        "type": "Spell",
        "fr": {
            "name": "Puissance accablante"
        },
        "flavor": "We cannot even describe how horrible the death is.  It's CRAZY bad!  Maybe worse than that.  Just don't do it.",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Power Overwhelming",
        "id": "EX1_316",
        "text": "Give a friendly minion +4/+4 until end of turn. Then, it dies. Horribly.",
        "rarity": "Common"
    },
    {
        "playerClass": "Warlock",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Power Overwhelming",
        "id": "EX1_316e",
        "text": "This minion has +4/+4, but will die a horrible death at the end of the turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance accablante"
        }
    },
    {
        "playerClass": "Rogue",
        "set": "Classic",
        "name": "Preparation",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "EX1_145o",
        "text": "The next spell you cast this turn costs (3) less.",
        "type": "Enchantment",
        "fr": {
            "name": "Préparation"
        }
    },
    {
        "cardImage": "EX1_145.png",
        "cost": 0,
        "collectible": true,
        "set": "Classic",
        "artist": "Clint Langley",
        "type": "Spell",
        "fr": {
            "name": "Préparation"
        },
        "flavor": "\"Be Prepared\" - Rogue Motto",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Preparation",
        "id": "EX1_145",
        "text": "The next spell you cast this turn costs (3) less.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_583.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Dan Scott",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Prêtresse d’Élune"
        },
        "flavor": "If she threatens to \"moon\" you, it's not what you think.",
        "attack": 5,
        "faction": "Neutral",
        "name": "Priestess of Elune",
        "id": "EX1_583",
        "text": "<b>Battlecry:</b> Restore 4 Health to your hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_350.png",
        "cost": 7,
        "collectible": true,
        "set": "Classic",
        "artist": "Wei Wang",
        "health": 7,
        "type": "Minion",
        "fr": {
            "name": "Prophète Velen"
        },
        "flavor": "He's been exiled from his home, and all his brothers turned evil, but otherwise he doesn't have a lot to complain about.",
        "playerClass": "Priest",
        "elite": true,
        "attack": 7,
        "faction": "Neutral",
        "name": "Prophet Velen",
        "id": "EX1_350",
        "text": "Double the damage and healing of your spells and Hero Power.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_279.png",
        "cost": 10,
        "collectible": true,
        "set": "Classic",
        "artist": "Luca Zontini",
        "type": "Spell",
        "fr": {
            "name": "Explosion pyrotechnique"
        },
        "flavor": "Take the time for an evil laugh after you draw this card.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Pyroblast",
        "id": "EX1_279",
        "text": "Deal $10 damage.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_044.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Attila Adorjany",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Aventurier en pleine quête"
        },
        "flavor": "\"Does anyone have some extra Boar Pelts?\"",
        "attack": 2,
        "faction": "Alliance",
        "name": "Questing Adventurer",
        "id": "EX1_044",
        "text": "Whenever you play a card, gain +1/+1.",
        "inPlayText": "Questing",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_412.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "health": 3,
        "mechanics": [
            "Enrage"
        ],
        "type": "Minion",
        "fr": {
            "name": "Worgen déchaîné"
        },
        "flavor": "If he's raging now, just wait until he gets nerfed.",
        "attack": 3,
        "faction": "Neutral",
        "name": "Raging Worgen",
        "id": "EX1_412",
        "text": "<b>Enrage:</b> <b>Windfury</b> and +1 Attack",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_298.png",
        "cost": 8,
        "collectible": true,
        "set": "Classic",
        "artist": "Greg Staples",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Ragnaros, seigneur du feu"
        },
        "flavor": "Ragnaros was summoned by the Dark Iron dwarves, who were eventually enslaved by the Firelord.  Summoning Ragnaros often doesn’t work out the way you want it to.",
        "elite": true,
        "attack": 8,
        "faction": "Neutral",
        "name": "Ragnaros the Firelord",
        "id": "EX1_298",
        "text": "Can't attack. At the end of your turn, deal 8 damage to a random enemy.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "CS2_104.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Jonboy Meyers",
        "type": "Spell",
        "fr": {
            "name": "Saccager"
        },
        "flavor": "Minion get ANGRY.   Minion SMASH!",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Rampage",
        "id": "CS2_104",
        "text": "Give a damaged minion +3/+3.",
        "rarity": "Common"
    },
    {
        "playerClass": "Warrior",
        "set": "Classic",
        "name": "Rampage",
        "id": "CS2_104e",
        "text": "+3/+3.",
        "type": "Enchantment",
        "fr": {
            "name": "Saccager"
        }
    },
    {
        "cardImage": "CS2_161.png",
        "cost": 7,
        "collectible": true,
        "set": "Classic",
        "artist": "Ralph Horsley",
        "health": 5,
        "mechanics": [
            "Stealth"
        ],
        "type": "Minion",
        "fr": {
            "name": "Assassin de Ravenholdt"
        },
        "flavor": "Just mail him a package with a name and 10,000 gold.  He'll take care of the rest.",
        "attack": 7,
        "faction": "Alliance",
        "name": "Ravenholdt Assassin",
        "id": "CS2_161",
        "text": "<b>Stealth</b>",
        "rarity": "Rare"
    },
    {
        "playerClass": "Mage",
        "set": "Classic",
        "name": "Raw Power!",
        "id": "EX1_274e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance brute !"
        }
    },
    {
        "cardImage": "EX1_136.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Ittoku",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Rédemption"
        },
        "flavor": "I am not sure how you get demptioned the first time.  It’s a mystery!",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Redemption",
        "id": "EX1_136",
        "text": "<b>Secret:</b> When one of your minions dies, return it to life with 1 Health.",
        "rarity": "Common"
    },
    {
        "playerClass": "Paladin",
        "set": "Classic",
        "name": "Repentance",
        "id": "EX1_379e",
        "text": "Health reduced to 1.",
        "type": "Enchantment",
        "fr": {
            "name": "Repentir"
        }
    },
    {
        "cardImage": "EX1_379.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Gonzalo Ordonez",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Repentir"
        },
        "flavor": "Repentance often comes in the moment before obliteration. Curious.",
        "playerClass": "Paladin",
        "faction": "Neutral",
        "name": "Repentance",
        "id": "EX1_379",
        "text": "<b>Secret:</b> When your opponent plays a minion, reduce its Health to 1.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_178a.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Rooted",
        "id": "EX1_178a",
        "text": "+5 Health and <b>Taunt</b>.",
        "type": "Spell",
        "fr": {
            "name": "Enraciner"
        }
    },
    {
        "playerClass": "Druid",
        "set": "Classic",
        "name": "Rooted",
        "id": "EX1_178ae",
        "text": "+5 Health and <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Enraciné"
        }
    },
    {
        "cardImage": "EX1_578.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Dave Rapoza",
        "mechanics": [
            "AffectedBySpellPower"
        ],
        "type": "Spell",
        "fr": {
            "name": "Sauvagerie"
        },
        "flavor": "It is true that some druids are savage, but others still enjoy a quiet moment and a spot of tea.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Savagery",
        "id": "EX1_578",
        "text": "Deal damage equal to your hero's Attack to a minion.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_534.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Milivoj Ceran",
        "health": 5,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Grande crinière des savanes"
        },
        "flavor": "In the jungle, the mighty jungle, the lion gets slowly consumed by hyenas.",
        "playerClass": "Hunter",
        "attack": 6,
        "name": "Savannah Highmane",
        "id": "EX1_534",
        "text": "<b>Deathrattle:</b> Summon two 2/2 Hyenas.",
        "inPlayText": "Master",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_020.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Gonzalo Ordonez",
        "health": 1,
        "mechanics": [
            "Divine Shield"
        ],
        "type": "Minion",
        "fr": {
            "name": "Croisée écarlate"
        },
        "flavor": "Never wash your whites with a Scarlet Crusader.",
        "attack": 3,
        "faction": "Alliance",
        "name": "Scarlet Crusader",
        "id": "EX1_020",
        "text": "<b>Divine Shield</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_531.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Jim Nelson",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Hyène charognarde"
        },
        "flavor": "Hyenas prefer the bones of kodos or windserpents, but they'll eat pretty much anything.  Even Brussels sprouts.",
        "playerClass": "Hunter",
        "attack": 2,
        "name": "Scavenging Hyena",
        "id": "EX1_531",
        "text": "Whenever a friendly Beast dies, gain +2/+1.",
        "inPlayText": "Scavenging",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_586.png",
        "cost": 10,
        "collectible": true,
        "set": "Classic",
        "artist": "Svetlin Velinov",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Géant des mers"
        },
        "flavor": "See?  Giant.",
        "attack": 8,
        "faction": "Neutral",
        "name": "Sea Giant",
        "id": "EX1_586",
        "text": "Costs (1) less for each other minion on the battlefield.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_080.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Gonzalo Ordonez",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Gardienne des secrets"
        },
        "flavor": "She promises not to tell anyone about that thing you did last night with that one person.",
        "attack": 1,
        "faction": "Alliance",
        "name": "Secretkeeper",
        "id": "EX1_080",
        "text": "Whenever a <b>Secret</b> is played, gain +1/+1.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_317.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Raven Mimura",
        "type": "Spell",
        "fr": {
            "name": "Détection des démons"
        },
        "flavor": "Generally demons are pretty obvious and you don’t need a spell to sense them.",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Sense Demons",
        "id": "EX1_317",
        "text": "Put 2 random Demons from your deck into your hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_334.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Mark Gibbons",
        "type": "Spell",
        "fr": {
            "name": "Folie de l’ombre"
        },
        "flavor": "You can rationalize it all you want, it's still a mean thing to do.",
        "playerClass": "Priest",
        "faction": "Neutral",
        "name": "Shadow Madness",
        "id": "EX1_334",
        "text": "Gain control of an enemy minion with 3 or less Attack until end of turn.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Priest",
        "set": "Classic",
        "name": "Shadow Madness",
        "id": "EX1_334e",
        "text": "This minion has switched controllers this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Folie de l’ombre"
        }
    },
    {
        "cardImage": "EX1_345t.png",
        "playerClass": "Priest",
        "cost": 0,
        "set": "Classic",
        "attack": 0,
        "name": "Shadow of Nothing",
        "health": 1,
        "id": "EX1_345t",
        "text": "Mindgames whiffed! Your opponent had no minions!",
        "type": "Minion",
        "fr": {
            "name": "Ombre du néant"
        },
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_303.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Dave Kendall",
        "mechanics": [
            "AffectedBySpellPower"
        ],
        "type": "Spell",
        "fr": {
            "name": "Ombreflamme"
        },
        "flavor": "Start with a powerful minion and stir in Shadowflame and you have a good time!",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Shadowflame",
        "id": "EX1_303",
        "text": "Destroy a friendly minion and deal its Attack damage to all enemy minions.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_625.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "type": "Spell",
        "fr": {
            "name": "Forme d’Ombre"
        },
        "flavor": "If a bright light shines on a priest in Shadowform… do they cast a shadow?",
        "playerClass": "Priest",
        "name": "Shadowform",
        "id": "EX1_625",
        "text": "Your Hero Power becomes 'Deal 2 damage'. If already in Shadowform: 3 damage.",
        "rarity": "Epic"
    },
    {
        "set": "Classic",
        "name": "Shadows of M'uru",
        "id": "EX1_590e",
        "text": "This minion has consumed Divine Shields and has increased Attack and Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Ombres de M’uru"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_144.png",
        "cost": 0,
        "collectible": true,
        "set": "Classic",
        "artist": "Graven Tung",
        "type": "Spell",
        "fr": {
            "name": "Pas de l’ombre"
        },
        "flavor": "Rogue dance troops will sometimes Shadowstep away at the end of a performance.  Crowds love it.",
        "playerClass": "Rogue",
        "faction": "Neutral",
        "name": "Shadowstep",
        "id": "EX1_144",
        "text": "Return a friendly minion to your hand. It costs (2) less.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_573b.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Shan'do's Lesson",
        "id": "EX1_573b",
        "text": "Summon two 2/2 Treants with <b>Taunt</b>.",
        "type": "Spell",
        "fr": {
            "name": "Leçon de Shan’do"
        }
    },
    {
        "set": "Classic",
        "name": "Sharp!",
        "id": "CS2_221e",
        "text": "+2 Attack from Spiteful Smith.",
        "type": "Enchantment",
        "fr": {
            "name": "Ça pique !"
        }
    },
    {
        "cardImage": "EX1_410.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Raymond Swanland",
        "mechanics": [
            "AffectedBySpellPower"
        ],
        "type": "Spell",
        "fr": {
            "name": "Heurt de bouclier"
        },
        "flavor": "\"What is a better weapon? The sharp one your enemies expect, or the blunt one they ignore?\" - The Art of Warrior, Chapter 9",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Shield Slam",
        "id": "EX1_410",
        "text": "Deal 1 damage to a minion for each Armor you have.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_405.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Carl Critchlow",
        "health": 4,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Porte-bouclier"
        },
        "flavor": "Have you seen the size of the shields in this game??  This is no easy job.",
        "attack": 0,
        "faction": "Neutral",
        "name": "Shieldbearer",
        "id": "EX1_405",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_134.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Chris Moeller",
        "health": 3,
        "mechanics": [
            "Combo"
        ],
        "type": "Minion",
        "fr": {
            "name": "Agent du SI:7"
        },
        "flavor": "The agents of SI:7 are responsible for Stormwind's covert activities.  Their duties include espionage, assassination, and throwing surprise birthday parties for the royal family.",
        "playerClass": "Rogue",
        "attack": 3,
        "faction": "Neutral",
        "name": "SI:7 Agent",
        "id": "EX1_134",
        "text": "<b>Combo:</b> Deal 2 damage.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_332.png",
        "cost": 0,
        "collectible": true,
        "set": "Classic",
        "artist": "Zoltan & Gabor",
        "mechanics": [
            "Silence"
        ],
        "type": "Spell",
        "fr": {
            "name": "Silence"
        },
        "flavor": "Reserved for enemy spellcasters, evil liches from beyond the grave, and karaoke nights at the Grim Guzzler.",
        "playerClass": "Priest",
        "faction": "Neutral",
        "name": "Silence",
        "id": "EX1_332",
        "text": "<b>Silence</b> a minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_151.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Matt Starbuck",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Champion de la Main d’argent"
        },
        "flavor": "It's good to be a knight.   Less so to be one's squire.",
        "attack": 4,
        "faction": "Alliance",
        "name": "Silver Hand Knight",
        "id": "CS2_151",
        "text": "<b>Battlecry:</b> Summon a 2/2 Squire.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_023.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Phroilan Gardner",
        "health": 3,
        "mechanics": [
            "Divine Shield"
        ],
        "type": "Minion",
        "fr": {
            "name": "Garde de Lune-d’argent"
        },
        "flavor": "The first time they tried to guard Silvermoon against the scourge, it didn’t go so well…",
        "attack": 3,
        "faction": "Horde",
        "name": "Silvermoon Guardian",
        "id": "EX1_023",
        "text": "<b>Divine Shield</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_309.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Tyler Walpole",
        "type": "Spell",
        "fr": {
            "name": "Siphonner l’âme"
        },
        "flavor": "You probably should avoid siphoning your own soul.  You might create some kind of weird infinite loop.",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Siphon Soul",
        "id": "EX1_309",
        "text": "Destroy a minion. Restore #3 Health to your hero.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_391.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "E.M. Gist",
        "type": "Spell",
        "fr": {
            "name": "Heurtoir"
        },
        "flavor": "\"Dun da dun, dun da dun\": if you've heard an ogre sing this, it's too late.",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Slam",
        "id": "EX1_391",
        "text": "Deal $2 damage to a minion. If it survives, draw a card.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_554t.png",
        "cost": 0,
        "set": "Classic",
        "race": "Beast",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "Serpent"
        },
        "playerClass": "Hunter",
        "attack": 1,
        "faction": "Neutral",
        "name": "Snake",
        "id": "EX1_554t",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_554.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Bernie Kang",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Piège à serpents"
        },
        "flavor": "Why did it have to be snakes?",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Snake Trap",
        "id": "EX1_554",
        "text": "<b>Secret:</b> When one of your minions is attacked, summon three 1/1 Snakes.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_609.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Lorenzo Minaca",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Tir de précision"
        },
        "flavor": "A great sniper hits the spot.  Just like a delicious flank of boar. Mmmmm.",
        "playerClass": "Hunter",
        "faction": "Neutral",
        "name": "Snipe",
        "id": "EX1_609",
        "text": "<b>Secret:</b> When your opponent plays a minion, deal $4 damage to it.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_608.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "health": 2,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Apprentie du sorcier"
        },
        "flavor": "Apprentices are great for bossing around.  \"Conjure me some mana buns! And a coffee!  Make that a mana coffee!\"",
        "playerClass": "Mage",
        "attack": 3,
        "faction": "Neutral",
        "name": "Sorcerer's Apprentice",
        "id": "EX1_608",
        "text": "Your spells cost (1) less.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_158.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Markus Erdt",
        "type": "Spell",
        "fr": {
            "name": "Âme de la forêt"
        },
        "flavor": "\"Reforestation\" is suddenly a terrifying word.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Soul of the Forest",
        "id": "EX1_158",
        "text": "Give your minions \"<b>Deathrattle:</b> Summon a 2/2 Treant.\"",
        "rarity": "Common"
    },
    {
        "playerClass": "Druid",
        "set": "Classic",
        "name": "Soul of the Forest",
        "id": "EX1_158e",
        "text": "Deathrattle: Summon a 2/2 Treant.",
        "type": "Enchantment",
        "fr": {
            "name": "Âme de la forêt"
        }
    },
    {
        "cardImage": "NEW1_027.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Pirate",
        "artist": "Ken Steacy",
        "health": 3,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Capitaine des mers du Sud"
        },
        "flavor": "When he saves enough plunder, he's going to commission an enormous captain's hat.  He has hat envy.",
        "attack": 3,
        "name": "Southsea Captain",
        "id": "NEW1_027",
        "text": "Your other Pirates have +1/+1.",
        "rarity": "Epic"
    },
    {
        "cardImage": "CS2_146.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "race": "Pirate",
        "artist": "Dan Brereton",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "Matelot des mers du Sud"
        },
        "flavor": "Pirates are into this new fad called \"Planking\".",
        "attack": 2,
        "faction": "Alliance",
        "name": "Southsea Deckhand",
        "id": "CS2_146",
        "text": "Has <b>Charge</b> while you have a weapon equipped.",
        "rarity": "Common"
    },
    {
        "cardImage": "tt_010.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Gonzalo Ordonez",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Courbe-sort"
        },
        "flavor": "While it's fun to intercept enemy lightning bolts, a spellbender much prefers to intercept opposing Marks of the Wild.  It just feels meaner.  And blood elves... well, they're a little mean.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Spellbender",
        "id": "tt_010",
        "text": "<b>Secret:</b> When an enemy casts a spell on a minion, summon a 1/3 as the new target.",
        "rarity": "Epic"
    },
    {
        "cardImage": "tt_010a.png",
        "playerClass": "Mage",
        "cost": 0,
        "set": "Classic",
        "attack": 1,
        "name": "Spellbender",
        "health": 3,
        "id": "tt_010a",
        "type": "Minion",
        "fr": {
            "name": "Courbe-sort"
        },
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_048.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Matt Cavotta",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Brise-sort"
        },
        "flavor": "Spellbreakers can rip enchantments from magic-wielders.  The process is painless and can be performed on an outpatient basis.",
        "attack": 4,
        "faction": "Horde",
        "name": "Spellbreaker",
        "id": "EX1_048",
        "text": "<b>Battlecry:</b> <b>Silence</b> a minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_tk11.png",
        "cost": 2,
        "set": "Classic",
        "health": 3,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Esprit du loup"
        },
        "playerClass": "Shaman",
        "attack": 2,
        "faction": "Neutral",
        "name": "Spirit Wolf",
        "id": "EX1_tk11",
        "text": "<b>Taunt</b>",
        "rarity": "Rare"
    },
    {
        "cardImage": "CS2_221.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Justin Sweet",
        "health": 6,
        "mechanics": [
            "Enrage"
        ],
        "type": "Minion",
        "fr": {
            "name": "Forgeron malveillant"
        },
        "flavor": "She'll craft you a sword, but you'll need to bring her 5 Steel Ingots, 3 Motes of Earth, and the scalp of her last customer.",
        "attack": 4,
        "faction": "Horde",
        "name": "Spiteful Smith",
        "id": "CS2_221",
        "text": "<b>Enrage:</b> Your weapon has +2 Attack.",
        "inPlayText": "Summoning",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_152.png",
        "cost": 1,
        "set": "Classic",
        "attack": 2,
        "faction": "Alliance",
        "name": "Squire",
        "health": 2,
        "id": "CS2_152",
        "type": "Minion",
        "fr": {
            "name": "Écuyer"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_tk28.png",
        "cost": 1,
        "set": "Classic",
        "race": "Beast",
        "attack": 1,
        "faction": "Neutral",
        "name": "Squirrel",
        "health": 1,
        "id": "EX1_tk28",
        "type": "Minion",
        "fr": {
            "name": "Écureuil"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "NEW1_041.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Daren Bader",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Kodo déchaîné"
        },
        "flavor": "This Kodo is so big that he can stampede by <i>himself</i>.",
        "attack": 3,
        "name": "Stampeding Kodo",
        "id": "NEW1_041",
        "text": "<b>Battlecry:</b> Destroy a random enemy minion with 2 or less Attack.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Paladin",
        "set": "Classic",
        "name": "Stand Down!",
        "id": "EX1_382e",
        "text": "Attack changed to 1.",
        "type": "Enchantment",
        "fr": {
            "name": "Du calme !"
        }
    },
    {
        "cardImage": "NEW1_007b.png",
        "playerClass": "Druid",
        "set": "Classic",
        "name": "Starfall",
        "id": "NEW1_007b",
        "text": "Deal $5 damage to a minion.",
        "type": "Spell",
        "fr": {
            "name": "Météores"
        }
    },
    {
        "cardImage": "NEW1_007a.png",
        "playerClass": "Druid",
        "set": "Classic",
        "name": "Starfall",
        "id": "NEW1_007a",
        "text": "Deal $2 damage to all enemy minions.",
        "type": "Spell",
        "fr": {
            "name": "Météores"
        }
    },
    {
        "cardImage": "NEW1_007.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "Richard Wright",
        "type": "Spell",
        "fr": {
            "name": "Météores"
        },
        "flavor": "Is the sky falling?  Yes.  Yes it is.",
        "playerClass": "Druid",
        "name": "Starfall",
        "id": "NEW1_007",
        "text": "<b>Choose One -</b> Deal $5 damage to a minion; or $2 damage to all enemy minions.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_247.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Nate Bowden",
        "durability": 3,
        "mechanics": [
            "Overload"
        ],
        "type": "Weapon",
        "fr": {
            "name": "Hache de Forge-foudre"
        },
        "flavor": "Yo, that's a nice axe.",
        "playerClass": "Shaman",
        "attack": 2,
        "faction": "Neutral",
        "name": "Stormforged Axe",
        "id": "EX1_247",
        "text": "<b>Overload:</b> (1)",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_028.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Alex Horley Orlandelli",
        "health": 5,
        "mechanics": [
            "Stealth"
        ],
        "type": "Minion",
        "fr": {
            "name": "Tigre de Strangleronce"
        },
        "flavor": "The wonderful thing about tigers is tigers are wonderful things!",
        "attack": 5,
        "faction": "Alliance",
        "name": "Stranglethorn Tiger",
        "id": "EX1_028",
        "text": "<b>Stealth</b>",
        "rarity": "Common"
    },
    {
        "set": "Classic",
        "name": "Strength of the Pack",
        "id": "EX1_162o",
        "text": "Dire Wolf Alpha is granting +1 Attack to this minion.",
        "type": "Enchantment",
        "fr": {
            "name": "Force de la meute"
        }
    },
    {
        "cardImage": "EX1_160a.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Summon a Panther",
        "id": "EX1_160a",
        "text": "Summon a 3/2 Panther.",
        "type": "Spell",
        "fr": {
            "name": "Invocation de panthère"
        }
    },
    {
        "cardImage": "EX1_315.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "Tyler Walpole",
        "health": 4,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Portail d’invocation"
        },
        "flavor": "NOT LESS THAN 1!  Don't get any ideas!",
        "playerClass": "Warlock",
        "attack": 0,
        "faction": "Neutral",
        "name": "Summoning Portal",
        "id": "EX1_315",
        "text": "Your minions cost (2) less, but not less than (1).",
        "inPlayText": "Summoning",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_058.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "James Ryman",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Protectrice solfurie"
        },
        "flavor": "She carries a shield, but only so she can give it to someone she can stand behind.",
        "attack": 2,
        "faction": "Alliance",
        "name": "Sunfury Protector",
        "id": "EX1_058",
        "text": "<b>Battlecry:</b> Give adjacent minions <b>Taunt</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_032.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Andrea Uderzo",
        "health": 5,
        "mechanics": [
            "Divine Shield",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Marche-soleil"
        },
        "flavor": "She doesn’t ACTUALLY walk on the Sun.  It's just a name.  Don’t worry!",
        "attack": 4,
        "faction": "Alliance",
        "name": "Sunwalker",
        "id": "EX1_032",
        "text": "<b>Taunt</b>\n<b>Divine Shield</b>",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_366.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Efrem Palacios",
        "durability": 5,
        "type": "Weapon",
        "fr": {
            "name": "Épée de justice"
        },
        "flavor": "I dub you Sir Loin of Beef!",
        "playerClass": "Paladin",
        "attack": 1,
        "faction": "Neutral",
        "name": "Sword of Justice",
        "id": "EX1_366",
        "text": "Whenever you summon a minion, give it +1/+1 and this loses 1 Durability.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_016.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Glenn Rane",
        "health": 5,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Sylvanas Coursevent"
        },
        "flavor": "Sylvanas was turned into the Banshee Queen by Arthas, but he probably should have just killed her because it just pissed her off.",
        "elite": true,
        "attack": 5,
        "name": "Sylvanas Windrunner",
        "id": "EX1_016",
        "text": "<b>Deathrattle:</b> Take control of a random enemy minion.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_390.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Paul Warzecha",
        "health": 3,
        "mechanics": [
            "Enrage",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Guerrier tauren"
        },
        "flavor": "Tauren Warrior: Champion of Mulgore, Slayer of Quilboar, Rider of Thunderbluff Elevators.",
        "attack": 2,
        "faction": "Neutral",
        "name": "Tauren Warrior",
        "id": "EX1_390",
        "text": "<b>Taunt</b>. <b>Enrage:</b> +3 Attack",
        "rarity": "Common"
    },
    {
        "set": "Classic",
        "name": "Teachings of the Kirin Tor",
        "id": "EX1_584e",
        "text": "<b>Spell Damage +1</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Enseignements du Kirin Tor"
        }
    },
    {
        "set": "Classic",
        "name": "Tempered",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "EX1_046e",
        "text": "+2 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Acier trempé"
        }
    },
    {
        "cardImage": "EX1_623.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Daren Bader",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Massacreur du temple"
        },
        "flavor": "He also moonlights Thursday nights as a bouncer at the Pig and Whistle Tavern.",
        "playerClass": "Priest",
        "attack": 6,
        "name": "Temple Enforcer",
        "id": "EX1_623",
        "text": "<b>Battlecry:</b> Give a friendly minion +3 Health.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_577.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Glenn Rane",
        "health": 7,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "La Bête"
        },
        "flavor": "He lives in Blackrock Mountain.  He eats Gnomes.  That's pretty much it.",
        "elite": true,
        "attack": 9,
        "faction": "Neutral",
        "name": "The Beast",
        "id": "EX1_577",
        "text": "<b>Deathrattle:</b> Summon a 3/3 Finkle Einhorn for your opponent.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_002.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Le Chevalier noir"
        },
        "flavor": "He was sent by the Lich King to disrupt the Argent Tournament.   We can pretty much mark that a failure.",
        "elite": true,
        "attack": 4,
        "name": "The Black Knight",
        "id": "EX1_002",
        "text": "<b>Battlecry:</b> Destroy an enemy minion with <b>Taunt</b>.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_339.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Garner",
        "type": "Spell",
        "fr": {
            "name": "Vol d’esprit"
        },
        "flavor": "\"What do you get when you cast Thoughtsteal on an Orc?  Nothing!\" - Tauren joke",
        "playerClass": "Priest",
        "faction": "Neutral",
        "name": "Thoughtsteal",
        "id": "EX1_339",
        "text": "Copy 2 cards from your opponent's deck and put them into your hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_021.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Efrem Palacios",
        "health": 3,
        "mechanics": [
            "Windfury"
        ],
        "type": "Minion",
        "fr": {
            "name": "Long-voyant de Thrallmar"
        },
        "flavor": "He's stationed in the Hellfire Peninsula, but he's hoping for a reassignment closer to Orgrimmar, or really anywhere the ground is less on fire.",
        "attack": 2,
        "faction": "Horde",
        "name": "Thrallmar Farseer",
        "id": "EX1_021",
        "text": "<b>Windfury</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_083.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Tom Baxa",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Suprétincelle"
        },
        "flavor": "Tinkmaster Overspark nearly lost his Tinker's license after the Great Ironforge Squirrel Stampede of '09.",
        "elite": true,
        "attack": 3,
        "faction": "Alliance",
        "name": "Tinkmaster Overspark",
        "id": "EX1_083",
        "text": "<b>Battlecry:</b> Transform another random minion into a 5/5 Devilsaur or a 1/1 Squirrel.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "EX1_383.png",
        "cost": 8,
        "collectible": true,
        "set": "Classic",
        "artist": "Brom",
        "health": 6,
        "mechanics": [
            "Deathrattle",
            "Divine Shield",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Tirion Fordring"
        },
        "flavor": "If you haven't heard the Tirion Fordring theme song, it's because it doesn't exist.",
        "playerClass": "Paladin",
        "elite": true,
        "attack": 6,
        "faction": "Neutral",
        "name": "Tirion Fordring",
        "id": "EX1_383",
        "text": "<b>Divine Shield</b>. <b>Taunt</b>. <b>Deathrattle:</b> Equip a 5/3 Ashbringer.",
        "rarity": "Legendary"
    },
    {
        "playerClass": "Hunter",
        "set": "Classic",
        "name": "Trapped",
        "id": "EX1_611e",
        "text": "Will be <b>Frozen</b> again at the start of the next turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Pris au piège"
        }
    },
    {
        "cardImage": "EX1_158t.png",
        "playerClass": "Druid",
        "cost": 1,
        "set": "Classic",
        "attack": 2,
        "faction": "Neutral",
        "name": "Treant",
        "health": 2,
        "id": "EX1_158t",
        "type": "Minion",
        "fr": {
            "name": "Tréant"
        }
    },
    {
        "cardImage": "EX1_tk9.png",
        "cost": 1,
        "set": "Classic",
        "health": 2,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "Tréant"
        },
        "playerClass": "Druid",
        "attack": 2,
        "faction": "Neutral",
        "name": "Treant",
        "id": "EX1_tk9",
        "text": "<b>Charge</b>.  At the end of the turn, destroy this minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_573t.png",
        "playerClass": "Druid",
        "cost": 1,
        "set": "Classic",
        "attack": 2,
        "name": "Treant",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "id": "EX1_573t",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Tréant"
        }
    },
    {
        "set": "Classic",
        "name": "Treasure Crazed",
        "id": "NEW1_018e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Obnubilé par les trésors"
        }
    },
    {
        "cardImage": "EX1_043.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "race": "Dragon",
        "artist": "Jaemin Kim",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Drake du Crépuscule"
        },
        "flavor": "Twilight drakes feed on Mystical Energy.  And Tacos.",
        "attack": 4,
        "faction": "Neutral",
        "name": "Twilight Drake",
        "id": "EX1_043",
        "text": "<b>Battlecry:</b> Gain +1 Health for each card in your hand.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_312.png",
        "cost": 8,
        "collectible": true,
        "set": "Classic",
        "artist": "Dave Allsop",
        "type": "Spell",
        "fr": {
            "name": "Néant distordu"
        },
        "flavor": "The Twisting Nether is a formless place of magic and illusion and destroyed minions.",
        "playerClass": "Warlock",
        "faction": "Neutral",
        "name": "Twisting Nether",
        "id": "EX1_312",
        "text": "Destroy all minions.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_258.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Matt Gaser",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Élémentaire délié"
        },
        "flavor": "Unlike bound elementals, Unbound ones really enjoy a night on the town.",
        "playerClass": "Shaman",
        "attack": 2,
        "faction": "Neutral",
        "name": "Unbound Elemental",
        "id": "EX1_258",
        "text": "Whenever you play a card with <b>Overload</b>, gain +1/+1.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_538.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Linggar Bramanty",
        "type": "Spell",
        "fr": {
            "name": "Lâcher les chiens"
        },
        "flavor": "You must read the name of this card out loud each time you play it.",
        "playerClass": "Hunter",
        "name": "Unleash the Hounds",
        "id": "EX1_538",
        "text": "For each enemy minion, summon a 1/1 Hound with <b>Charge</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_409.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Matt Cavotta",
        "type": "Spell",
        "fr": {
            "name": "Amélioration !"
        },
        "flavor": "Easily worth 50 DKP.",
        "playerClass": "Warrior",
        "faction": "Neutral",
        "name": "Upgrade!",
        "id": "EX1_409",
        "text": "If you have a weapon, give it +1/+1. Otherwise equip a 1/3 weapon.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Hunter",
        "set": "Classic",
        "name": "Upgraded",
        "id": "EX1_536e",
        "text": "Increased Durability.",
        "type": "Enchantment",
        "fr": {
            "name": "Amélioration"
        }
    },
    {
        "playerClass": "Warrior",
        "set": "Classic",
        "name": "Upgraded",
        "id": "EX1_409e",
        "text": "+1 Attack and +1 Durability.",
        "type": "Enchantment",
        "fr": {
            "name": "Améliorée"
        }
    },
    {
        "cardImage": "EX1_178b.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Uproot",
        "id": "EX1_178b",
        "text": "+5 Attack.",
        "type": "Spell",
        "fr": {
            "name": "Déraciner"
        }
    },
    {
        "playerClass": "Druid",
        "set": "Classic",
        "name": "Uprooted",
        "id": "EX1_178be",
        "text": "+5 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Déraciné"
        }
    },
    {
        "playerClass": "Rogue",
        "set": "Classic",
        "name": "VanCleef's Vengeance",
        "id": "EX1_613e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Vengeance de VanCleef"
        }
    },
    {
        "cardImage": "EX1_594.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "artist": "Raymond Swanland",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Vaporisation"
        },
        "flavor": "Rumor has it that Deathwing brought about the Cataclysm after losing a game to this card.  We may never know the truth.",
        "playerClass": "Mage",
        "faction": "Neutral",
        "name": "Vaporize",
        "id": "EX1_594",
        "text": "<b>Secret:</b> When a minion attacks your hero, destroy it.",
        "rarity": "Rare"
    },
    {
        "cardImage": "CS2_227.png",
        "cost": 5,
        "collectible": true,
        "set": "Classic",
        "artist": "John Polidora",
        "health": 6,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Nervi de la KapitalRisk"
        },
        "flavor": "No Job is too big.  No fee is too big.",
        "attack": 7,
        "faction": "Horde",
        "name": "Venture Co. Mercenary",
        "id": "CS2_227",
        "text": "Your minions cost (3) more.",
        "rarity": "Common"
    },
    {
        "cardImage": "NEW1_026t.png",
        "cost": 0,
        "set": "Classic",
        "attack": 1,
        "name": "Violet Apprentice",
        "health": 1,
        "id": "NEW1_026t",
        "type": "Minion",
        "fr": {
            "name": "Apprenti pourpre"
        }
    },
    {
        "cardImage": "NEW1_026.png",
        "cost": 4,
        "collectible": true,
        "set": "Classic",
        "artist": "James Ryman",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Enseignante pourpre"
        },
        "flavor": "If you don't pay attention, you may be turned into a pig.  And then you get your name on the board.",
        "attack": 3,
        "name": "Violet Teacher",
        "id": "NEW1_026",
        "text": "Whenever you cast a spell, summon a 1/1 Violet Apprentice.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_304.png",
        "cost": 3,
        "collectible": true,
        "set": "Classic",
        "race": "Demon",
        "artist": "Alexander Alexandrov",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Terreur du Vide"
        },
        "flavor": "If you put this into your deck, you WILL lose the trust of your other minions.",
        "playerClass": "Warlock",
        "attack": 3,
        "name": "Void Terror",
        "id": "EX1_304",
        "text": "<b>Battlecry:</b> Destroy the minions on either side of this minion and gain their Attack and Health.",
        "rarity": "Rare"
    },
    {
        "set": "Classic",
        "name": "Warded",
        "id": "EX1_001e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Garde rapprochée"
        }
    },
    {
        "playerClass": "Hunter",
        "set": "Classic",
        "name": "Well Fed",
        "id": "EX1_531e",
        "text": "Increased Attack and Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Bien nourri"
        }
    },
    {
        "cardImage": "EX1_116t.png",
        "cost": 1,
        "set": "Classic",
        "race": "Dragon",
        "attack": 1,
        "name": "Whelp",
        "health": 1,
        "id": "EX1_116t",
        "type": "Minion",
        "fr": {
            "name": "Dragonnet"
        }
    },
    {
        "cardImage": "ds1_whelptoken.png",
        "cost": 1,
        "set": "Classic",
        "race": "Dragon",
        "attack": 1,
        "faction": "Neutral",
        "name": "Whelp",
        "health": 1,
        "id": "ds1_whelptoken",
        "type": "Minion",
        "fr": {
            "name": "Dragonnet"
        }
    },
    {
        "playerClass": "Warrior",
        "set": "Classic",
        "name": "Whipped Into Shape",
        "id": "EX1_603e",
        "text": "+2 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Coup de fouet motivant"
        }
    },
    {
        "cardImage": "NEW1_020.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Alex Horley Orlandelli",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Pyromancien sauvage"
        },
        "flavor": "BOOM BABY BOOM!  BAD IS GOOD!  DOWN WITH GOVERNMENT!",
        "attack": 3,
        "name": "Wild Pyromancer",
        "id": "NEW1_020",
        "text": "After you cast a spell, deal 1 damage to ALL minions.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_033.png",
        "cost": 6,
        "collectible": true,
        "set": "Classic",
        "artist": "Luke Mancini",
        "health": 5,
        "mechanics": [
            "Windfury"
        ],
        "type": "Minion",
        "fr": {
            "name": "Harpie Furie-des-vents"
        },
        "flavor": "Harpies are not pleasant sounding.  That's the nicest I can put it.",
        "attack": 4,
        "faction": "Alliance",
        "name": "Windfury Harpy",
        "id": "EX1_033",
        "text": "<b>Windfury</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "CS2_231.png",
        "cost": 0,
        "collectible": true,
        "set": "Classic",
        "artist": "Malcolm Davis",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "Feu follet"
        },
        "flavor": "If you hit an Eredar Lord with enough Wisps, it will explode.   But why?",
        "attack": 1,
        "faction": "Neutral",
        "name": "Wisp",
        "id": "CS2_231",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_010.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Raymond Swanland",
        "health": 1,
        "mechanics": [
            "Stealth"
        ],
        "type": "Minion",
        "fr": {
            "name": "Infiltrateur worgen"
        },
        "flavor": "If you want to stop a worgen from infiltrating, just yell, \"No! Bad boy!\"",
        "attack": 2,
        "faction": "Alliance",
        "name": "Worgen Infiltrator",
        "id": "EX1_010",
        "text": "<b>Stealth</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_317t.png",
        "cost": 1,
        "set": "Classic",
        "race": "Demon",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "Diablotin sans valeur"
        },
        "playerClass": "Warlock",
        "attack": 1,
        "name": "Worthless Imp",
        "id": "EX1_317t",
        "text": "<i>You are out of demons! At least there are always imps...</i>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_154a.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Wrath",
        "id": "EX1_154a",
        "text": "Deal $3 damage to a minion.",
        "type": "Spell",
        "fr": {
            "name": "Colère"
        }
    },
    {
        "cardImage": "EX1_154b.png",
        "playerClass": "Druid",
        "set": "Classic",
        "faction": "Neutral",
        "name": "Wrath",
        "id": "EX1_154b",
        "text": "Deal $1 damage to a minion. Draw a card.",
        "type": "Spell",
        "fr": {
            "name": "Colère"
        }
    },
    {
        "cardImage": "EX1_154.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Raymond Swanland",
        "type": "Spell",
        "fr": {
            "name": "Colère"
        },
        "flavor": "The talk around the Ratchet Inn is that this card is too good and should be a Legendary.",
        "playerClass": "Druid",
        "faction": "Neutral",
        "name": "Wrath",
        "id": "EX1_154",
        "text": "<b>Choose One</b> - Deal $3 damage to a minion; or $1 damage and draw a card.",
        "rarity": "Common"
    },
    {
        "set": "Classic",
        "name": "Yarrr!",
        "id": "NEW1_027e",
        "text": "Southsea Captain is granting +1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Yarrr !"
        }
    },
    {
        "cardImage": "CS2_169.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "race": "Beast",
        "artist": "Greg Hildebrandt",
        "health": 1,
        "mechanics": [
            "Windfury"
        ],
        "type": "Minion",
        "fr": {
            "name": "Jeune faucon-dragon"
        },
        "flavor": "They were the inspiration for the championship Taurenball team: The Dragonhawks.",
        "attack": 1,
        "faction": "Horde",
        "name": "Young Dragonhawk",
        "id": "CS2_169",
        "text": "<b>Windfury</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_004.png",
        "cost": 1,
        "collectible": true,
        "set": "Classic",
        "artist": "Vance Kovacs",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "Jeune prêtresse"
        },
        "flavor": "She can't wait to learn Power Word: Fortitude Rank 2.",
        "attack": 2,
        "name": "Young Priestess",
        "id": "EX1_004",
        "text": "At the end of your turn, give another random friendly minion +1 Health.",
        "rarity": "Rare"
    },
    {
        "cardImage": "EX1_049.png",
        "cost": 2,
        "collectible": true,
        "set": "Classic",
        "artist": "Wei Wang",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Jeune maître brasseur"
        },
        "flavor": "His youthful enthusiasm doesn’t always equal excellence in his brews.   Don’t drink the Mogu Stout!",
        "attack": 3,
        "faction": "Alliance",
        "name": "Youthful Brewmaster",
        "id": "EX1_049",
        "text": "<b>Battlecry:</b> Return a friendly minion from the battlefield to your hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_572.png",
        "cost": 9,
        "collectible": true,
        "set": "Classic",
        "race": "Dragon",
        "artist": "Gabor Szikszai",
        "health": 12,
        "type": "Minion",
        "fr": {
            "name": "Ysera"
        },
        "flavor": "Ysera rules the Emerald Dream.  Which is some kind of green-mirror-version of the real world, or something?",
        "elite": true,
        "attack": 4,
        "faction": "Neutral",
        "name": "Ysera",
        "id": "EX1_572",
        "text": "At the end of your turn, add a Dream Card to your hand.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "DREAM_02.png",
        "playerClass": "Dream",
        "cost": 2,
        "set": "Classic",
        "name": "Ysera Awakens",
        "id": "DREAM_02",
        "text": "Deal $5 damage to all characters except Ysera.",
        "type": "Spell",
        "fr": {
            "name": "Réveil d’Ysera"
        }
    },
    {
        "set": "Missions",
        "name": "Bananas",
        "id": "TU4c_006e",
        "text": "This minion has +1/+1. <i>(+1 Attack/+1 Health)</i>",
        "type": "Enchantment",
        "fr": {
            "name": "Banane"
        }
    },
    {
        "cardImage": "TU4c_006.png",
        "cost": 1,
        "set": "Missions",
        "faction": "Neutral",
        "name": "Bananas",
        "id": "TU4c_006",
        "text": "Give a friendly minion +1/+1. <i>(+1 Attack/+1 Health)</i>",
        "type": "Spell",
        "fr": {
            "name": "Banane"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4c_003.png",
        "cost": 0,
        "set": "Missions",
        "health": 2,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Tonneau"
        },
        "faction": "Neutral",
        "name": "Barrel",
        "id": "TU4c_003",
        "text": "Is something in this barrel?",
        "inPlayText": "Breakable",
        "rarity": "Common"
    },
    {
        "cardImage": "TU4c_002.png",
        "cost": 1,
        "set": "Missions",
        "faction": "Neutral",
        "name": "Barrel Toss",
        "id": "TU4c_002",
        "text": "Deal 2 damage.",
        "type": "Spell",
        "fr": {
            "name": "Lancer de tonneau"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4f_005.png",
        "cost": 4,
        "set": "Missions",
        "attack": 4,
        "name": "Brewmaster",
        "health": 4,
        "id": "TU4f_005",
        "type": "Minion",
        "fr": {
            "name": "Maître brasseur"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4d_002.png",
        "cost": 1,
        "set": "Missions",
        "attack": 1,
        "name": "Crazed Hunter",
        "health": 1,
        "id": "TU4d_002",
        "type": "Minion",
        "fr": {
            "name": "Chasseur fou"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4f_007.png",
        "cost": 1,
        "set": "Missions",
        "attack": 1,
        "name": "Crazy Monkey",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "id": "TU4f_007",
        "text": "<b>Battlecry:</b> Throw Bananas.",
        "type": "Minion",
        "fr": {
            "name": "Singe cinglé"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4e_007.png",
        "cost": 6,
        "set": "Missions",
        "attack": 4,
        "durability": 2,
        "name": "Dual Warglaives",
        "id": "TU4e_007",
        "type": "Weapon",
        "fr": {
            "name": "Glaives de guerre doubles"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4e_005.png",
        "cost": 3,
        "set": "Missions",
        "name": "Flame Burst",
        "id": "TU4e_005",
        "text": "Shoot 5 missiles at random enemies for $1 damage each.",
        "type": "Spell",
        "fr": {
            "name": "Explosion de flammes"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4e_002t.png",
        "cost": 1,
        "set": "Missions",
        "attack": 2,
        "name": "Flame of Azzinoth",
        "health": 1,
        "id": "TU4e_002t",
        "type": "Minion",
        "fr": {
            "name": "Flamme d’Azzinoth"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4e_002.png",
        "cost": 2,
        "set": "Missions",
        "name": "Flames of Azzinoth",
        "id": "TU4e_002",
        "text": "<b>Hero Power</b>\nSummon two 2/1 minions.",
        "type": "Hero Power",
        "fr": {
            "name": "Flammes d’Azzinoth"
        }
    },
    {
        "cardImage": "TU4a_003.png",
        "cost": 1,
        "set": "Missions",
        "attack": 1,
        "name": "Gnoll",
        "health": 1,
        "id": "TU4a_003",
        "type": "Minion",
        "fr": {
            "name": "Gnoll"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4d_001.png",
        "playerClass": "Hunter",
        "set": "Missions",
        "name": "Hemet Nesingwary",
        "health": 20,
        "id": "TU4d_001",
        "type": "Hero",
        "fr": {
            "name": "Hemet Nesingwary"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4c_005.png",
        "cost": 2,
        "set": "Missions",
        "attack": 1,
        "faction": "Neutral",
        "name": "Hidden Gnome",
        "health": 3,
        "id": "TU4c_005",
        "text": "Was hiding in a barrel!",
        "type": "Minion",
        "fr": {
            "name": "Gnome caché"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4a_001.png",
        "set": "Missions",
        "name": "Hogger",
        "health": 10,
        "id": "TU4a_001",
        "type": "Hero",
        "fr": {
            "name": "Lardeur"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4a_004.png",
        "cost": 3,
        "set": "Missions",
        "name": "Hogger SMASH!",
        "id": "TU4a_004",
        "text": "Deal 4 damage.",
        "type": "Spell",
        "fr": {
            "name": "Lardeur TOUT CASSER !"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4e_001.png",
        "playerClass": "Hunter",
        "set": "Missions",
        "name": "Illidan Stormrage",
        "health": 30,
        "id": "TU4e_001",
        "type": "Hero",
        "fr": {
            "name": "Illidan Hurlorage"
        }
    },
    {
        "cardImage": "TU4a_006.png",
        "playerClass": "Mage",
        "set": "Missions",
        "name": "Jaina Proudmoore",
        "health": 27,
        "id": "TU4a_006",
        "type": "Hero",
        "fr": {
            "name": "Jaina Portvaillant"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4c_001.png",
        "set": "Missions",
        "name": "King Mukla",
        "health": 26,
        "id": "TU4c_001",
        "type": "Hero",
        "fr": {
            "name": "Roi Mukla"
        },
        "rarity": "Common"
    },
    {
        "set": "Missions",
        "name": "Legacy of the Emperor",
        "id": "TU4f_004o",
        "text": "Has +2/+2. <i>(+2 Attack/+2 Health)</i>",
        "type": "Enchantment",
        "fr": {
            "name": "Héritage de l’Empereur"
        }
    },
    {
        "cardImage": "TU4f_004.png",
        "cost": 3,
        "set": "Missions",
        "name": "Legacy of the Emperor",
        "id": "TU4f_004",
        "text": "Give your minions +2/+2. <i>(+2 Attack/+2 Health)</i>",
        "type": "Spell",
        "fr": {
            "name": "Héritage de l’Empereur"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4f_001.png",
        "set": "Missions",
        "name": "Lorewalker Cho",
        "health": 25,
        "id": "TU4f_001",
        "type": "Hero",
        "fr": {
            "name": "Chroniqueur Cho"
        }
    },
    {
        "cardImage": "TU4a_005.png",
        "cost": 4,
        "set": "Missions",
        "attack": 5,
        "name": "Massive Gnoll",
        "health": 2,
        "id": "TU4a_005",
        "type": "Minion",
        "fr": {
            "name": "Gnoll massif"
        },
        "rarity": "Common"
    },
    {
        "set": "Missions",
        "name": "Might of Mukla",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "TU4c_008e",
        "text": "King Mukla has +8 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance de Mukla"
        }
    },
    {
        "cardImage": "TU4b_001.png",
        "playerClass": "Mage",
        "set": "Missions",
        "name": "Millhouse Manastorm",
        "health": 20,
        "id": "TU4b_001",
        "type": "Hero",
        "fr": {
            "name": "Millhouse Tempête-de-Mana"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4c_007.png",
        "cost": 6,
        "set": "Missions",
        "attack": 10,
        "name": "Mukla's Big Brother",
        "health": 10,
        "id": "TU4c_007",
        "text": "So strong! And only 6 Mana?!",
        "type": "Minion",
        "fr": {
            "name": "Grand frère de Mukla"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4e_003.png",
        "cost": 1,
        "set": "Missions",
        "attack": 1,
        "name": "Naga Myrmidon",
        "health": 1,
        "id": "TU4e_003",
        "text": "<b></b>",
        "type": "Minion",
        "fr": {
            "name": "Myrmidon naga"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4f_002.png",
        "cost": 1,
        "set": "Missions",
        "attack": 1,
        "name": "Pandaren Scout",
        "health": 1,
        "id": "TU4f_002",
        "type": "Minion",
        "fr": {
            "name": "Éclaireur pandaren"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4a_002.png",
        "cost": 1,
        "set": "Missions",
        "attack": 2,
        "name": "Riverpaw Gnoll",
        "health": 1,
        "id": "TU4a_002",
        "type": "Minion",
        "fr": {
            "name": "Gnoll rivepatte"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4f_003.png",
        "cost": 2,
        "set": "Missions",
        "attack": 2,
        "name": "Shado-Pan Monk",
        "health": 2,
        "id": "TU4f_003",
        "type": "Minion",
        "fr": {
            "name": "Moine pandashan"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4d_003.png",
        "playerClass": "Hunter",
        "cost": 2,
        "set": "Missions",
        "name": "Shotgun Blast",
        "id": "TU4d_003",
        "text": "<b>Hero Power</b>\nDeal 1 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Coup de fusil"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4c_004.png",
        "cost": 2,
        "set": "Missions",
        "faction": "Neutral",
        "name": "Stomp",
        "id": "TU4c_004",
        "text": "Deal 2 damage to all enemies.",
        "type": "Spell",
        "fr": {
            "name": "Piétinement"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4f_006.png",
        "cost": 1,
        "set": "Missions",
        "name": "Transcendence",
        "id": "TU4f_006",
        "text": "Until you kill Cho's minions, he can't be attacked.",
        "type": "Spell",
        "fr": {
            "name": "Transcendance"
        },
        "rarity": "Common"
    },
    {
        "set": "Missions",
        "name": "Transcendence",
        "id": "TU4f_006o",
        "text": "Until you kill Cho's minions, he can't be attacked.",
        "type": "Enchantment",
        "fr": {
            "name": "Transcendance"
        }
    },
    {
        "cardImage": "TU4e_004.png",
        "cost": 2,
        "set": "Missions",
        "attack": 2,
        "durability": 2,
        "name": "Warglaive of Azzinoth",
        "id": "TU4e_004",
        "type": "Weapon",
        "fr": {
            "name": "Glaive de guerre d’Azzinoth"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "TU4c_008.png",
        "cost": 3,
        "set": "Missions",
        "name": "Will of Mukla",
        "id": "TU4c_008",
        "text": "Restore 8 Health.",
        "type": "Spell",
        "fr": {
            "name": "Volonté de Mukla"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "Mekka4t.png",
        "cost": 0,
        "set": "Promotion",
        "race": "Beast",
        "attack": 1,
        "name": "Chicken",
        "health": 1,
        "id": "Mekka4t",
        "text": "<i>Hey Chicken!</i>",
        "type": "Minion",
        "fr": {
            "name": "Poulet"
        }
    },
    {
        "cardImage": "PRO_001.png",
        "cost": 5,
        "collectible": true,
        "set": "Promotion",
        "artist": "Samwise Didier",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Awarded at BlizzCon 2013.",
        "fr": {
            "name": "Elite Tauren Chieftain"
        },
        "flavor": "He's looking for a drummer.  The current candidates are: Novice Engineer, Sen'jin Shieldmasta', and Ragnaros the Firelord.",
        "elite": true,
        "attack": 5,
        "name": "Elite Tauren Chieftain",
        "id": "PRO_001",
        "text": "<b>Battlecry:</b> Give both players the power to ROCK! (with a Power Chord card)",
        "rarity": "Legendary"
    },
    {
        "set": "Promotion",
        "name": "Emboldened!",
        "id": "Mekka3e",
        "text": "Increased Stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Encouragé !"
        }
    },
    {
        "cardImage": "Mekka3.png",
        "cost": 1,
        "set": "Promotion",
        "race": "Mech",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Encourageur 3000"
        },
        "attack": 0,
        "faction": "Alliance",
        "name": "Emboldener 3000",
        "id": "Mekka3",
        "text": "At the end of your turn, give a random minion +1/+1.",
        "rarity": "Common"
    },
    {
        "cardImage": "EX1_112.png",
        "cost": 6,
        "collectible": true,
        "set": "Promotion",
        "artist": "Ludo Lullabi",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "This was rewarded to players who helped test the Store during the Beta.",
        "fr": {
            "name": "Gelbin Mekkanivelle"
        },
        "flavor": "He's the leader of the gnomes, and an incredible inventor.  He's getting better, too; He turns things into chickens WAY less than he used to.",
        "elite": true,
        "attack": 6,
        "faction": "Alliance",
        "name": "Gelbin Mekkatorque",
        "id": "EX1_112",
        "text": "<b>Battlecry:</b> Summon an AWESOME invention.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "Mekka1.png",
        "cost": 1,
        "set": "Promotion",
        "race": "Mech",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "Poulet à tête chercheuse"
        },
        "attack": 0,
        "faction": "Alliance",
        "name": "Homing Chicken",
        "id": "Mekka1",
        "text": "At the start of your turn, destroy this minion and draw 3 cards.",
        "inPlayText": "Pecking",
        "rarity": "Common"
    },
    {
        "cardImage": "PRO_001a.png",
        "cost": 4,
        "set": "Promotion",
        "name": "I Am Murloc",
        "id": "PRO_001a",
        "text": "Summon three, four, or five 1/1 Murlocs.",
        "type": "Spell",
        "fr": {
            "name": "Je suis murloc"
        }
    },
    {
        "cardImage": "PRO_001at.png",
        "cost": 0,
        "set": "Promotion",
        "race": "Murloc",
        "attack": 1,
        "name": "Murloc",
        "health": 1,
        "id": "PRO_001at",
        "type": "Minion",
        "fr": {
            "name": "Murloc"
        }
    },
    {
        "cardImage": "Mekka4.png",
        "cost": 1,
        "set": "Promotion",
        "race": "Mech",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Pouletisateur"
        },
        "attack": 0,
        "faction": "Alliance",
        "name": "Poultryizer",
        "id": "Mekka4",
        "text": "At the start of your turn, transform a random minion into a 1/1 Chicken.",
        "rarity": "Common"
    },
    {
        "cardImage": "PRO_001c.png",
        "cost": 4,
        "set": "Promotion",
        "name": "Power of the Horde",
        "id": "PRO_001c",
        "text": "Summon a random Horde Warrior.",
        "type": "Spell",
        "fr": {
            "name": "Puissance de la Horde"
        }
    },
    {
        "cardImage": "Mekka2.png",
        "cost": 1,
        "set": "Promotion",
        "race": "Mech",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Robot réparateur"
        },
        "attack": 0,
        "faction": "Alliance",
        "name": "Repair Bot",
        "id": "Mekka2",
        "text": "At the end of your turn, restore 6 Health to a damaged character.",
        "rarity": "Common"
    },
    {
        "cardImage": "PRO_001b.png",
        "cost": 4,
        "set": "Promotion",
        "name": "Rogues Do It...",
        "id": "PRO_001b",
        "text": "Deal $4 damage. Draw a card.",
        "type": "Spell",
        "fr": {
            "name": "Les voleurs, ça vous prend..."
        }
    },
    {
        "set": "Promotion",
        "name": "Transformed",
        "mechanics": [
            "Morph"
        ],
        "id": "Mekka4e",
        "text": "Has been transformed into a chicken!",
        "type": "Enchantment",
        "fr": {
            "name": "Transformé"
        }
    },
    {
        "playerClass": "Mage",
        "cost": 9,
        "set": "System",
        "attack": 6,
        "faction": "Neutral",
        "name": "Placeholder Card",
        "health": 8,
        "id": "PlaceholderCard",
        "text": "Battlecry: Someone remembers to publish this card.",
        "type": "Minion",
        "fr": {
            "name": "Placeholder Card"
        },
        "rarity": "Epic"
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Activate!",
        "id": "BRMA14_10H_TB",
        "text": "<b>Hero Power</b>\nActivate a random Tron.",
        "type": "Hero Power",
        "fr": {
            "name": "Activation !"
        }
    },
    {
        "set": "Tavern Brawl",
        "faction": "Neutral",
        "name": "Annoy-o-Tron",
        "health": 30,
        "id": "TB_MechWar_Boss1",
        "type": "Hero",
        "fr": {
            "name": "Ennuy-o-tron"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "BRMC_86.png",
        "cost": 4,
        "set": "Tavern Brawl",
        "race": "Dragon",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Atramédès"
        },
        "elite": true,
        "attack": 2,
        "name": "Atramedes",
        "id": "BRMC_86",
        "text": "Whenever your opponent plays a card, gain +2 Attack.",
        "rarity": "Legendary"
    },
    {
        "set": "Tavern Brawl",
        "name": "Big Banana",
        "id": "TB_006e",
        "text": "Has +2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Grande banane"
        }
    },
    {
        "cardImage": "TB_006.png",
        "cost": 1,
        "collectible": false,
        "set": "Tavern Brawl",
        "name": "Big Banana",
        "id": "TB_006",
        "text": "Give a minion +2/+2.",
        "type": "Spell",
        "fr": {
            "name": "Grande banane"
        }
    },
    {
        "cardImage": "TB_CoOpBossSpell_2.png",
        "set": "Tavern Brawl",
        "name": "Bomb Salvo",
        "id": "TB_CoOpBossSpell_2",
        "text": "Deal Attack damage to up to 3 random targets.",
        "type": "Spell",
        "fr": {
            "name": "Salve de bombes"
        }
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Bone Minions",
        "id": "BRMA17_5_TB",
        "text": "<b>Hero Power</b>\nSummon two 2/1 Bone Constructs.",
        "type": "Hero Power",
        "fr": {
            "name": "Séides des os"
        }
    },
    {
        "set": "Tavern Brawl",
        "faction": "Neutral",
        "name": "Boom Bot",
        "health": 30,
        "id": "TB_MechWar_Boss2",
        "type": "Hero",
        "fr": {
            "name": "Ro’Boum"
        },
        "rarity": "Free"
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Boom Bot Jr.",
        "id": "TB_MechWar_Boss2_HeroPower",
        "text": "<b>Hero Power</b>\nDeal 1 damage to 2 random enemies.",
        "type": "Hero Power",
        "fr": {
            "name": "Ro’Boum junior"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Boss HP Swapper",
        "id": "TB_001",
        "type": "Enchantment",
        "fr": {
            "name": "Échanger les PV des boss"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Burning Adrenaline",
        "id": "BRMC_97e",
        "text": "Costs (2) less.",
        "type": "Enchantment",
        "fr": {
            "name": "Montée d’adrénaline"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Cheap Gift",
        "id": "TB_GiftExchange_Enchantment",
        "text": "This card's costs is reduced by (4)",
        "type": "Enchantment",
        "fr": {
            "name": "Cadeau nul"
        }
    },
    {
        "cardImage": "TB_012.png",
        "cost": 0,
        "set": "Tavern Brawl",
        "name": "Choose a New Card!",
        "id": "TB_012",
        "text": "Look at 3 random cards. Choose one and shuffle it into your deck.",
        "type": "Spell",
        "fr": {
            "name": "Choisir une nouvelle carte !"
        }
    },
    {
        "cardImage": "TB_014.png",
        "cost": 0,
        "set": "Tavern Brawl",
        "name": "Choose a New Card!",
        "id": "TB_014",
        "text": "Look at 3 random cards. Choose one and put it into your hand.",
        "type": "Spell",
        "fr": {
            "name": "Choisir une nouvelle carte !"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Choose One of Three",
        "id": "TB_010e",
        "type": "Enchantment",
        "fr": {
            "name": "Choisir un des trois"
        }
    },
    {
        "cardImage": "BRMC_95he.png",
        "cost": 3,
        "set": "Tavern Brawl",
        "race": "Beast",
        "attack": 2,
        "name": "Core Hound Pup",
        "health": 4,
        "id": "BRMC_95he",
        "text": "At the end of each turn, summon all Core Hound Pups that died this turn.",
        "type": "Minion",
        "fr": {
            "name": "Chiot du magma"
        }
    },
    {
        "cardImage": "BRMC_95h.png",
        "cost": 3,
        "set": "Tavern Brawl",
        "name": "Core Hound Puppies",
        "id": "BRMC_95h",
        "text": "Summon two 2/4 Core Hound Pups.",
        "type": "Spell",
        "fr": {
            "name": "Chiots du magma"
        }
    },
    {
        "cardImage": "BRMC_92.png",
        "cost": 4,
        "set": "Tavern Brawl",
        "health": 8,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Coren Navrebière"
        },
        "elite": true,
        "attack": 4,
        "name": "Coren Direbrew",
        "id": "BRMC_92",
        "text": "Always wins Brawls.\n <b>Battlecry:</b> Add a Brawl to your hand.",
        "rarity": "Legendary"
    },
    {
        "set": "Tavern Brawl",
        "name": "Create 15 Secrets",
        "id": "TB_009",
        "type": "Enchantment",
        "fr": {
            "name": "Créer 15 secrets"
        }
    },
    {
        "cardImage": "NAX12_02H_2c_TB.png",
        "cost": 1,
        "set": "Tavern Brawl",
        "name": "Decimate",
        "id": "NAX12_02H_2c_TB",
        "text": "Change the Health of enemy minions to 1.",
        "type": "Spell",
        "fr": {
            "name": "Décimer"
        }
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Decimate",
        "id": "NAX12_02H_2_TB",
        "text": "<b>Hero Power</b>\nChange the Health of enemy minions to 1.",
        "type": "Hero Power",
        "fr": {
            "name": "Décimer"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Deckbuilding Enchant",
        "id": "TB_010",
        "type": "Enchantment",
        "fr": {
            "name": "Enchantement de création de deck"
        }
    },
    {
        "cardImage": "TB_007.png",
        "cost": 1,
        "collectible": false,
        "set": "Tavern Brawl",
        "name": "Deviate Banana",
        "id": "TB_007",
        "text": "Swap a minion's Attack and Health.",
        "type": "Spell",
        "fr": {
            "name": "Banane déviante"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Deviate Switch",
        "id": "TB_007e",
        "text": "Attack and Health have been swapped by Deviate Banana.",
        "type": "Enchantment",
        "fr": {
            "name": "Inversion déviante"
        }
    },
    {
        "cardImage": "TB_CoOpBossSpell_5.png",
        "set": "Tavern Brawl",
        "name": "Double Zap",
        "id": "TB_CoOpBossSpell_5",
        "text": "Deal Attack damage to both players.",
        "type": "Spell",
        "fr": {
            "name": "Double zap"
        }
    },
    {
        "cardImage": "BRMC_84.png",
        "cost": 5,
        "set": "Tavern Brawl",
        "race": "Dragon",
        "attack": 4,
        "name": "Dragonkin Spellcaster",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "id": "BRMC_84",
        "text": "<b>Battlecry:</b> Summon two 2/2 Whelps.",
        "type": "Minion",
        "fr": {
            "name": "Lanceur de sorts draconien"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Dragonlust",
        "id": "BRMC_98e",
        "text": "+3 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Soif de dragon"
        }
    },
    {
        "cardImage": "BRMC_88.png",
        "cost": 6,
        "set": "Tavern Brawl",
        "race": "Dragon",
        "attack": 6,
        "name": "Drakonid Slayer",
        "health": 6,
        "id": "BRMC_88",
        "text": "Also damages the minions next to whomever he attacks.",
        "type": "Minion",
        "fr": {
            "name": "Pourfendeur drakônide"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Endless Enchantment",
        "id": "TB_EndlessMinions01",
        "text": "+2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Enchantement sans fin"
        }
    },
    {
        "cardImage": "TB_FactionWar_Boss_BoomBot.png",
        "set": "Tavern Brawl",
        "name": "FactionWar_BoomBot",
        "health": 30,
        "id": "TB_FactionWar_Boss_BoomBot",
        "type": "Hero",
        "fr": {
            "name": "FactionWar_BoomBot"
        }
    },
    {
        "cardImage": "TB_PickYourFate_1.png",
        "set": "Tavern Brawl",
        "name": "Fate 1",
        "id": "TB_PickYourFate_1",
        "text": "All minions have <b>Taunt</b> and <b>Charge</b>.",
        "type": "Spell",
        "fr": {
            "name": "Fate 1"
        }
    },
    {
        "cardImage": "TB_PickYourFate_10.png",
        "set": "Tavern Brawl",
        "name": "Fate 10",
        "id": "TB_PickYourFate_10",
        "text": "Battlecry minions get +1/+1",
        "type": "Spell",
        "fr": {
            "name": "Destin 10"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Fate 10 Ench. Battlecry bonus",
        "id": "TB_PickYourFate_10_Ench",
        "type": "Enchantment",
        "fr": {
            "name": "Fate 10 Ench. Battlecry bonus"
        }
    },
    {
        "cardImage": "TB_PickYourFate_11.png",
        "set": "Tavern Brawl",
        "name": "Fate 11",
        "id": "TB_PickYourFate_11",
        "text": "Each turn, you get a 1/1 Murloc",
        "type": "Spell",
        "fr": {
            "name": "Fate 11"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Fate 11 Ench. Murloc",
        "id": "TB_PickYourFate_11_Ench",
        "type": "Enchantment",
        "fr": {
            "name": "Fate 11 Ench. Murloc"
        }
    },
    {
        "cardImage": "TB_PickYourFate_2.png",
        "set": "Tavern Brawl",
        "name": "Fate 2",
        "id": "TB_PickYourFate_2",
        "text": "When a minion dies, its owner gets a (1) mana Banana.",
        "type": "Spell",
        "fr": {
            "name": "Fate 2"
        }
    },
    {
        "cardImage": "TB_PickYourFate_3.png",
        "set": "Tavern Brawl",
        "name": "Fate 3",
        "id": "TB_PickYourFate_3",
        "text": "All minions have <b>Windfury</b>.",
        "type": "Spell",
        "fr": {
            "name": "Fate 3"
        }
    },
    {
        "cardImage": "TB_PickYourFate_4.png",
        "set": "Tavern Brawl",
        "name": "Fate 4",
        "id": "TB_PickYourFate_4",
        "text": "All minions get +1 Attack.",
        "type": "Spell",
        "fr": {
            "name": "Fate 4"
        }
    },
    {
        "cardImage": "TB_PickYourFate_5.png",
        "set": "Tavern Brawl",
        "name": "Fate 5",
        "id": "TB_PickYourFate_5",
        "text": "Spells cost (1) less.",
        "type": "Spell",
        "fr": {
            "name": "Fate 5"
        }
    },
    {
        "cardImage": "TB_PickYourFate_6.png",
        "set": "Tavern Brawl",
        "name": "Fate 6",
        "id": "TB_PickYourFate_6",
        "text": "Shuffle 10 Unstable Portals into your deck.",
        "type": "Spell",
        "fr": {
            "name": "Fate 6"
        }
    },
    {
        "cardImage": "TB_PickYourFate_7.png",
        "set": "Tavern Brawl",
        "name": "Fate 7",
        "id": "TB_PickYourFate_7",
        "text": "When a minion dies, its owner gets a Coin.",
        "type": "Spell",
        "fr": {
            "name": "Fate 7"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Fate 7 Ench Get a Coin",
        "id": "TB_PickYourFate_7_Ench",
        "type": "Enchantment",
        "fr": {
            "name": "Fate 7 Ench Get a Coin"
        }
    },
    {
        "cardImage": "TB_PickYourFate_8.png",
        "set": "Tavern Brawl",
        "name": "Fate 8",
        "id": "TB_PickYourFate_8",
        "text": "Whenever a spell is played, its caster gains 3 armor.",
        "type": "Spell",
        "fr": {
            "name": "Fate 8"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Fate 8 Get Armor",
        "id": "TB_PickYourFate_8_Ench",
        "type": "Enchantment",
        "fr": {
            "name": "Fate 8 Get Armor"
        }
    },
    {
        "cardImage": "TB_PickYourFate_9.png",
        "set": "Tavern Brawl",
        "name": "Fate 9",
        "id": "TB_PickYourFate_9",
        "text": "Deathrattle minions get +1/+1",
        "type": "Spell",
        "fr": {
            "name": "Fate 9"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Fate 9 Ench. Deathrattle bonus",
        "id": "TB_PickYourFate_9_Ench",
        "type": "Enchantment",
        "fr": {
            "name": "Fate 9 Ench. Deathrattle bonus"
        }
    },
    {
        "cardImage": "BRMC_99.png",
        "elite": true,
        "cost": 5,
        "set": "Tavern Brawl",
        "attack": 4,
        "name": "Garr",
        "health": 8,
        "id": "BRMC_99",
        "text": "Whenever this minion takes damage, summon a 2/3 Elemental with <b>Taunt</b>.",
        "type": "Minion",
        "fr": {
            "name": "Garr"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "TB_CoOp_Mechazod.png",
        "cost": 10,
        "set": "Tavern Brawl",
        "health": 95,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Maître des rouages Mécazod"
        },
        "elite": true,
        "attack": 2,
        "name": "Gearmaster Mechazod",
        "id": "TB_CoOp_Mechazod",
        "text": "<b>Boss</b>\nMechazod wins if he defeats either of you!",
        "rarity": "Legendary"
    },
    {
        "set": "Tavern Brawl",
        "name": "Give Taunt and Charge",
        "id": "TB_AllMinionsTauntCharge",
        "text": "This minion is granted <b>Taunt</b> and <b>Charge</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Confère Provocation et Charge"
        }
    },
    {
        "cardImage": "BRMC_95.png",
        "elite": true,
        "cost": 50,
        "set": "Tavern Brawl",
        "attack": 20,
        "name": "Golemagg",
        "health": 20,
        "id": "BRMC_95",
        "text": "Costs (1) less for each damage your hero has taken.",
        "type": "Minion",
        "fr": {
            "name": "Golemagg"
        },
        "rarity": "Legendary"
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Harvest",
        "id": "NAX8_02H_TB",
        "text": "<b>Hero Power</b>\nDraw a card. Gain a Mana Crystal.",
        "type": "Hero Power",
        "fr": {
            "name": "Moisson"
        }
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Hello! Hello! Hello!",
        "id": "TB_MechWar_Boss1_HeroPower",
        "text": "<b>Hero Power</b>\nGive your lowest attack minion <b>Divine Shield</b> and <b>Taunt</b>.",
        "type": "Hero Power",
        "fr": {
            "name": "Bonjour ! Bonjour ! Bonjour !"
        }
    },
    {
        "cardImage": "BRMC_96.png",
        "elite": true,
        "cost": 3,
        "set": "Tavern Brawl",
        "attack": 4,
        "name": "High Justice Grimstone",
        "health": 5,
        "id": "BRMC_96",
        "text": "At the start of your turn, summon a <b>Legendary</b> minion.",
        "type": "Minion",
        "fr": {
            "name": "Juge Supérieur Mornepierre"
        },
        "rarity": "Legendary"
    },
    {
        "set": "Tavern Brawl",
        "name": "I Hear You...",
        "id": "BRMC_86e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Je vous entends…"
        }
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Jeering Crowd",
        "id": "BRMA02_2_2_TB",
        "text": "<b>Hero Power</b>\nSummon a 1/1 Spectator with <b>Taunt</b>.",
        "type": "Hero Power",
        "fr": {
            "name": "Foule moqueuse"
        }
    },
    {
        "cost": 0,
        "set": "Tavern Brawl",
        "name": "Jeering Crowd",
        "id": "BRMA02_2_2c_TB",
        "text": "Summon a 1/1 Spectator with <b>Taunt</b>.",
        "type": "Spell",
        "fr": {
            "name": "Foule moqueuse"
        }
    },
    {
        "cardImage": "TB_CoOpBossSpell_6.png",
        "set": "Tavern Brawl",
        "name": "Kill the Lorewalker",
        "id": "TB_CoOpBossSpell_6",
        "text": "Destroy Lorewalker Cho.",
        "type": "Spell",
        "fr": {
            "name": "Détruire le chroniqueur"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Living Bomb",
        "id": "BRMC_100e",
        "text": "On Ragnaros' turn, deal 5 damage to this side of the board.",
        "type": "Enchantment",
        "fr": {
            "name": "Bombe vivante"
        }
    },
    {
        "cardImage": "BRMC_100.png",
        "cost": 3,
        "set": "Tavern Brawl",
        "name": "Living Bomb",
        "id": "BRMC_100",
        "text": "Choose an enemy minion. If it lives until your next turn, deal 5 damage to all enemies.",
        "type": "Spell",
        "fr": {
            "name": "Bombe vivante"
        }
    },
    {
        "cardImage": "BRMC_90.png",
        "cost": 2,
        "set": "Tavern Brawl",
        "attack": 6,
        "name": "Living Lava",
        "health": 6,
        "mechanics": [
            "Taunt"
        ],
        "id": "BRMC_90",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Lave vivante"
        }
    },
    {
        "cardImage": "BRMC_85.png",
        "cost": 4,
        "set": "Tavern Brawl",
        "health": 7,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Lucifron"
        },
        "elite": true,
        "attack": 4,
        "name": "Lucifron",
        "id": "BRMC_85",
        "text": "<b>Battlecry:</b> Cast Corruption on all other minions.",
        "rarity": "Legendary"
    },
    {
        "cost": 0,
        "set": "Tavern Brawl",
        "name": "ME SMASH",
        "id": "BRMA07_2_2c_TB",
        "text": "Destroy a random enemy minion.",
        "type": "Spell",
        "fr": {
            "name": "MOI TOUT CASSER"
        }
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "ME SMASH",
        "id": "BRMA07_2_2_TB",
        "text": "<b>Hero Power</b>\nDestroy a random enemy minion.",
        "type": "Hero Power",
        "fr": {
            "name": "MOI TOUT CASSER"
        }
    },
    {
        "cardImage": "TB_MechWar_Minion1.png",
        "cost": 2,
        "set": "Tavern Brawl",
        "attack": 1,
        "name": "Mech Fan",
        "health": 1,
        "mechanics": [
            "Taunt"
        ],
        "id": "TB_MechWar_Minion1",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Fan de méca"
        }
    },
    {
        "cardImage": "BRMC_87.png",
        "cost": 3,
        "set": "Tavern Brawl",
        "health": 3,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Moira Barbe-de-Bronze"
        },
        "elite": true,
        "attack": 4,
        "name": "Moira Bronzebeard",
        "id": "BRMC_87",
        "text": "<b>Deathrattle:</b> Summon Emperor Thaurissan.",
        "rarity": "Legendary"
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Molten Rage",
        "id": "TBA01_6",
        "text": "<b>Hero Power</b>\nSummon a 5/1 Magma Rager.",
        "type": "Hero Power",
        "fr": {
            "name": "Rage du magma"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Mystery Pilot",
        "id": "TB_Pilot1",
        "text": "Who could it be?!",
        "type": "Enchantment",
        "fr": {
            "name": "Pilote mystère"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Nefarian",
        "health": 30,
        "id": "TBA01_4",
        "type": "Hero",
        "fr": {
            "name": "Nefarian"
        }
    },
    {
        "cardImage": "TBST_004.png",
        "cost": 3,
        "set": "Tavern Brawl",
        "attack": 2,
        "name": "OLDLegit Healer",
        "health": 2,
        "id": "TBST_004",
        "text": "At the end of your turn, summon a random friendly minion that died this turn.",
        "type": "Minion",
        "fr": {
            "name": "Soigneur honnête"
        }
    },
    {
        "cardImage": "TBST_003.png",
        "cost": 1,
        "set": "Tavern Brawl",
        "attack": 1,
        "name": "OLDN3wb Healer",
        "health": 1,
        "id": "TBST_003",
        "text": "At the end of your turn, heal 2 damage from adjacent minions.",
        "type": "Minion",
        "fr": {
            "name": "Soigneur débutant"
        }
    },
    {
        "cardImage": "TBST_002.png",
        "cost": 1,
        "set": "Tavern Brawl",
        "attack": 2,
        "name": "OLDN3wb Mage",
        "health": 1,
        "id": "TBST_002",
        "text": "At the end of your turn, deal 1 damage to random enemy minion.",
        "type": "Minion",
        "fr": {
            "name": "Mage débutant"
        }
    },
    {
        "cardImage": "TBST_001.png",
        "cost": 1,
        "set": "Tavern Brawl",
        "attack": 2,
        "name": "OLDN3wb Tank",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "id": "TBST_001",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Tank débutant"
        }
    },
    {
        "cardImage": "TBST_005.png",
        "cost": 3,
        "set": "Tavern Brawl",
        "attack": 3,
        "name": "OLDPvP Rogue",
        "health": 6,
        "mechanics": [
            "Stealth"
        ],
        "id": "TBST_005",
        "text": "<b>Stealth</b>\nRegain <b>Stealth</b> when PvP Rogue kills a minion.",
        "type": "Minion",
        "fr": {
            "name": "Voleur JcJ"
        }
    },
    {
        "cost": 0,
        "set": "Tavern Brawl",
        "name": "OLDTBST Push Common Card",
        "id": "TBST_006",
        "text": "push a common card into player's hand",
        "type": "Enchantment",
        "fr": {
            "name": "Forcer une carte commune"
        }
    },
    {
        "cardImage": "BRMC_93.png",
        "cost": 3,
        "set": "Tavern Brawl",
        "name": "Omnotron Defense System",
        "id": "BRMC_93",
        "text": "Summon a random Tron.",
        "type": "Spell",
        "fr": {
            "name": "Système de défense Omnitron"
        }
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Open the Gates",
        "id": "BRMA09_2_TB",
        "text": "<b>Hero Power</b>\nSummon three 1/1 Whelps.",
        "type": "Hero Power",
        "fr": {
            "name": "Ouvrir les portes"
        }
    },
    {
        "cardImage": "BRMC_83.png",
        "cost": 8,
        "set": "Tavern Brawl",
        "name": "Open the Gates",
        "id": "BRMC_83",
        "text": "Fill your board with 2/2 Whelps.",
        "type": "Spell",
        "fr": {
            "name": "Ouvrir les portes"
        }
    },
    {
        "cardImage": "TB_CoOpBossSpell_4.png",
        "set": "Tavern Brawl",
        "name": "Overclock",
        "id": "TB_CoOpBossSpell_4",
        "text": "Gain 2 Attack.",
        "type": "Spell",
        "fr": {
            "name": "Suralimenter"
        }
    },
    {
        "cost": 1,
        "set": "Tavern Brawl",
        "name": "Overclock",
        "id": "HRW02_1e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance des rouages"
        }
    },
    {
        "cardImage": "TB_CoOp_Mechazod2.png",
        "cost": 10,
        "set": "Tavern Brawl",
        "attack": 9,
        "name": "Overloaded Mechazod",
        "health": 80,
        "id": "TB_CoOp_Mechazod2",
        "text": "<b>Boss</b>\nAt the beginning of each turn, Mechazod strikes!",
        "type": "Minion",
        "fr": {
            "name": "Mécazod surchargé"
        },
        "rarity": "Legendary"
    },
    {
        "set": "Tavern Brawl",
        "name": "Pick You rFate 5 Ench",
        "id": "TB_PickYourFate_5_Ench",
        "type": "Enchantment",
        "fr": {
            "name": "Pick You rFate 5 Ench"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Pick Your Fate 1 Ench",
        "id": "TB_PickYourFate_1_Ench",
        "type": "Enchantment",
        "fr": {
            "name": "Pick Your Fate 1 Ench"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Pick Your Fate 2 Ench",
        "id": "TB_PickYourFate_2_Ench",
        "type": "Enchantment",
        "fr": {
            "name": "Pick Your Fate 2 Ench"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Pick Your Fate 3 Ench",
        "id": "TB_PickYourFate_3_Ench",
        "type": "Enchantment",
        "fr": {
            "name": "Pick Your Fate 3 Ench"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Pick Your Fate 4 Ench",
        "id": "TB_PickYourFate_4_Ench",
        "type": "Enchantment",
        "fr": {
            "name": "Pick Your Fate 4 Ench"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Pick Your Fate Build Around",
        "id": "TB_PickYourFate",
        "type": "Enchantment",
        "fr": {
            "name": "Choisissez votre destin - Construction"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Pick Your Fate Random",
        "id": "TB_PickYourFateRandom",
        "type": "Enchantment",
        "fr": {
            "name": "Choisissez votre destin - Aléatoire"
        }
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Pile On!!!",
        "id": "BRMA01_2H_2_TB",
        "text": "<b>Hero Power</b>\nPut a minion from each deck into the battlefield.",
        "type": "Hero Power",
        "fr": {
            "name": "Pioche forcée !"
        }
    },
    {
        "cardImage": "TB_015.png",
        "cost": 2,
        "set": "Tavern Brawl",
        "race": "Pirate",
        "attack": 2,
        "name": "Pirate",
        "health": 3,
        "id": "TB_015",
        "type": "Minion",
        "fr": {
            "name": "Pirate"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Player Choice Enchant",
        "id": "TB_013",
        "type": "Enchantment",
        "fr": {
            "name": "Enchantement du choix du joueur"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Player Choice Enchant On Curve",
        "id": "TB_013_PickOnCurve",
        "type": "Enchantment",
        "fr": {
            "name": "Player Choice Enchant On Curve"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Player Choice Enchant On Curve2",
        "id": "TB_013_PickOnCurve2",
        "type": "Enchantment",
        "fr": {
            "name": "Player Choice Enchant On Curve2"
        }
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Poison Cloud",
        "id": "NAX11_02H_2_TB",
        "text": "<b>Hero Power</b>\nDeal 1 damage to all enemy minions. If any die, summon a slime.",
        "type": "Hero Power",
        "fr": {
            "name": "Nuage empoisonné"
        }
    },
    {
        "cardImage": "TB_CoOpBossSpell_1.png",
        "set": "Tavern Brawl",
        "name": "Prioritize",
        "id": "TB_CoOpBossSpell_1",
        "text": "Deal Attack damage to biggest minion.",
        "type": "Spell",
        "fr": {
            "name": "Fixer des priorités"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Ragnaros the Firelord",
        "health": 60,
        "id": "TBA01_1",
        "type": "Hero",
        "fr": {
            "name": "Ragnaros, seigneur du feu"
        }
    },
    {
        "cardImage": "BRMC_98.png",
        "cost": 6,
        "set": "Tavern Brawl",
        "race": "Dragon",
        "health": 12,
        "type": "Minion",
        "fr": {
            "name": "Tranchetripe"
        },
        "elite": true,
        "attack": 4,
        "name": "Razorgore",
        "id": "BRMC_98",
        "text": "At the start of your turn, give your minions +3 Attack.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "TB_CoOpBossSpell_3.png",
        "set": "Tavern Brawl",
        "name": "Release Coolant",
        "id": "TB_CoOpBossSpell_3",
        "text": "Freeze and deal Attack damage to all minions.\nGain 2 Attack.",
        "type": "Spell",
        "fr": {
            "name": "Liquide de refroidissement"
        }
    },
    {
        "cardImage": "BRMC_99e.png",
        "cost": 2,
        "set": "Tavern Brawl",
        "attack": 2,
        "name": "Rock Elemental",
        "health": 3,
        "mechanics": [
            "Taunt"
        ],
        "id": "BRMC_99e",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Élémentaire de roche"
        }
    },
    {
        "cardImage": "TB_008.png",
        "cost": 1,
        "collectible": false,
        "set": "Tavern Brawl",
        "name": "Rotten Banana",
        "mechanics": [
            "AffectedBySpellPower"
        ],
        "id": "TB_008",
        "text": "Deal $1 damage.",
        "type": "Spell",
        "fr": {
            "name": "Banane pourrie"
        }
    },
    {
        "cardImage": "BRMC_91.png",
        "cost": 3,
        "set": "Tavern Brawl",
        "attack": 6,
        "name": "Son of the Flame",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "id": "BRMC_91",
        "text": "<b>Battlecry:</b> Deal 6 damage.",
        "type": "Minion",
        "fr": {
            "name": "Fils de la Flamme"
        }
    },
    {
        "cardImage": "TB_GiftExchange_Treasure_Spell.png",
        "cost": 1,
        "set": "Tavern Brawl",
        "name": "Stolen Winter's Veil Gift",
        "id": "TB_GiftExchange_Treasure_Spell",
        "text": "Find a random Treasure.",
        "type": "Spell",
        "fr": {
            "name": "Cadeau du Voile d’hiver volé"
        }
    },
    {
        "cardImage": "BRMC_94.png",
        "cost": 2,
        "set": "Tavern Brawl",
        "attack": 2,
        "durability": 6,
        "name": "Sulfuras",
        "mechanics": [
            "Deathrattle"
        ],
        "id": "BRMC_94",
        "text": "<b>Deathrattle:</b> Your Hero Power becomes 'Deal 8 damage to a random enemy'.",
        "type": "Weapon",
        "fr": {
            "name": "Sulfuras"
        }
    },
    {
        "cardImage": "TB_011.png",
        "cost": 0,
        "set": "Tavern Brawl",
        "name": "Tarnished Coin",
        "id": "TB_011",
        "text": "Gain 1 Mana Crystal this turn only.",
        "type": "Spell",
        "fr": {
            "name": "Pièce ternie"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "TB_ClockworkCardDealer",
        "id": "TB_GreatCurves_01",
        "type": "Enchantment",
        "fr": {
            "name": "TB_ClockworkCardDealer"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "TB_DecreasingCardCost",
        "id": "TB_DecreasingCardCost",
        "type": "Enchantment",
        "fr": {
            "name": "TB_DecreasingCardCost"
        }
    },
    {
        "cost": 0,
        "set": "Tavern Brawl",
        "name": "TB_EnchRandomManaCost",
        "id": "TB_RMC_001",
        "type": "Enchantment",
        "fr": {
            "name": "TB_EnchRandomManaCost"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "TB_EnchWhosTheBossNow",
        "id": "TB_RandHero2_001",
        "type": "Enchantment",
        "fr": {
            "name": "TB_EnchWhosTheBossNow"
        }
    },
    {
        "cardImage": "TB_DecreasingCardCostDebug.png",
        "set": "Tavern Brawl",
        "name": "TBDecreasingCardCostDebug",
        "id": "TB_DecreasingCardCostDebug",
        "type": "Spell",
        "fr": {
            "name": "TBDecreasingCardCostDebug"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "TBFactionWarBoomBot",
        "id": "TB_FactionWar_BoomBot",
        "type": "Enchantment",
        "fr": {
            "name": "TBFactionWarBoomBot"
        }
    },
    {
        "cardImage": "TB_FactionWar_BoomBot_Spell.png",
        "cost": 1,
        "set": "Tavern Brawl",
        "name": "TBFactionWarBoomBotSpell",
        "id": "TB_FactionWar_BoomBot_Spell",
        "type": "Spell",
        "fr": {
            "name": "TBFactionWarBoomBotSpell"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "TBMechWarCommonCards",
        "id": "TB_MechWar_CommonCards",
        "type": "Enchantment",
        "fr": {
            "name": "TBMechWarCommonCards"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "TBRandomCardCost",
        "id": "TB_RandCardCost",
        "type": "Enchantment",
        "fr": {
            "name": "TBRandomCardCost"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "TBUD Summon Early Minion",
        "id": "TBUD_1",
        "text": "Each turn, if you have less health then a your opponent, summon a free minion",
        "type": "Enchantment",
        "fr": {
            "name": "Invocation précoce de serviteur"
        }
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "The Majordomo",
        "id": "BRMA06_2H_TB",
        "text": "<b>Hero Power</b>\nSummon a 3/3 Flamewaker Acolyte.",
        "type": "Hero Power",
        "fr": {
            "name": "Le chambellan"
        }
    },
    {
        "cardImage": "BRMC_97.png",
        "cost": 6,
        "set": "Tavern Brawl",
        "race": "Dragon",
        "health": 7,
        "type": "Minion",
        "fr": {
            "name": "Vaelastrasz"
        },
        "elite": true,
        "attack": 7,
        "name": "Vaelastrasz",
        "id": "BRMC_97",
        "text": "Your cards cost (3) less.",
        "rarity": "Legendary"
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Web Wrap",
        "id": "NAX3_02_TB",
        "text": "<b>Hero Power</b>\nReturn a random enemy minion to your opponent's hand.",
        "type": "Hero Power",
        "fr": {
            "name": "Entoilage"
        }
    },
    {
        "cardImage": "BRMC_89.png",
        "cost": 2,
        "set": "Tavern Brawl",
        "attack": 4,
        "name": "Whirling Ash",
        "health": 5,
        "mechanics": [
            "Windfury"
        ],
        "id": "BRMC_89",
        "text": "<b>Windfury</b>",
        "type": "Minion",
        "fr": {
            "name": "Cendres tourbillonnantes"
        }
    },
    {
        "cardImage": "TBA01_5.png",
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Wild Magic",
        "id": "TBA01_5",
        "text": "<b>Hero Power</b>\nAdd a random spell from any class to your hand. It costs (0).",
        "type": "Hero Power",
        "fr": {
            "name": "Magie sauvage"
        }
    },
    {
        "cost": 2,
        "set": "Tavern Brawl",
        "name": "Wild Magic",
        "id": "BRMA13_4_2_TB",
        "text": "<b>Hero Power</b>\nPut a random spell from your opponent's class into your hand.",
        "type": "Hero Power",
        "fr": {
            "name": "Magie sauvage"
        }
    },
    {
        "set": "Tavern Brawl",
        "name": "Windfury",
        "id": "TB_PickYourFate_Windfury",
        "text": "This minion has <b>Windfury</b>",
        "type": "Enchantment",
        "fr": {
            "name": "Furie des vents"
        }
    },
    {
        "cardImage": "TB_GiftExchange_Treasure.png",
        "cost": 0,
        "set": "Tavern Brawl",
        "attack": 0,
        "name": "Winter's Veil Gift",
        "health": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "TB_GiftExchange_Treasure",
        "text": "<b>Deathrattle</b> Give attacking player a Treasure.",
        "type": "Minion",
        "fr": {
            "name": "Cadeau du Voile d’hiver"
        }
    },
    {
        "cardImage": "HERO_05a.png",
        "playerClass": "Hunter",
        "collectible": true,
        "set": "Hero Skins",
        "name": "Alleria Windrunner",
        "health": 30,
        "id": "HERO_05a",
        "type": "Hero",
        "fr": {
            "name": "Alleria Coursevent"
        },
        "rarity": "Epic"
    },
    {
        "playerClass": "Warrior",
        "cost": 2,
        "set": "Hero Skins",
        "name": "Armor Up!",
        "id": "CS2_102_H1",
        "text": "<b>Hero Power</b>\nGain 2 Armor.",
        "type": "Hero Power",
        "fr": {
            "name": "Gain d’armure !"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "DS1h_292_H1_AT_132.png",
        "playerClass": "Hunter",
        "cost": 2,
        "set": "Hero Skins",
        "name": "Ballista Shot",
        "id": "DS1h_292_H1_AT_132",
        "text": "<b>Hero Power</b>\nDeal $3 damage to the enemy hero.",
        "type": "Hero Power",
        "fr": {
            "name": "Tir de baliste"
        }
    },
    {
        "playerClass": "Mage",
        "cost": 2,
        "set": "Hero Skins",
        "name": "Fireblast",
        "id": "CS2_034_H1",
        "text": "<b>Hero Power</b>\nDeal $1 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Explosion de feu"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_034_H1_AT_132.png",
        "playerClass": "Mage",
        "cost": 2,
        "set": "Hero Skins",
        "name": "Fireblast Rank 2",
        "id": "CS2_034_H1_AT_132",
        "text": "<b>Hero Power</b>\nDeal $2 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Explosion de feu rang 2"
        }
    },
    {
        "cardImage": "HERO_01a.png",
        "playerClass": "Warrior",
        "collectible": true,
        "set": "Hero Skins",
        "name": "Magni Bronzebeard",
        "health": 30,
        "id": "HERO_01a",
        "type": "Hero",
        "fr": {
            "name": "Magni Barbe-de-bronze"
        },
        "rarity": "Epic"
    },
    {
        "cardImage": "HERO_08a.png",
        "playerClass": "Mage",
        "collectible": true,
        "set": "Hero Skins",
        "name": "Medivh",
        "health": 30,
        "id": "HERO_08a",
        "type": "Hero",
        "fr": {
            "name": "Medivh"
        },
        "rarity": "Epic"
    },
    {
        "playerClass": "Paladin",
        "cost": 2,
        "set": "Hero Skins",
        "name": "Reinforce",
        "id": "CS2_101_H1",
        "text": "<b>Hero Power</b>\nSummon a 1/1 Silver Hand Recruit.",
        "type": "Hero Power",
        "fr": {
            "name": "Renfort"
        },
        "rarity": "Free"
    },
    {
        "playerClass": "Hunter",
        "cost": 2,
        "set": "Hero Skins",
        "name": "Steady Shot",
        "id": "DS1h_292_H1",
        "text": "<b>Hero Power</b>\nDeal $2 damage to the enemy hero.",
        "type": "Hero Power",
        "fr": {
            "name": "Tir assuré"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "CS2_102_H1_AT_132.png",
        "playerClass": "Warrior",
        "cost": 2,
        "set": "Hero Skins",
        "name": "Tank Up!",
        "id": "CS2_102_H1_AT_132",
        "text": "<b>Hero Power</b>\nGain 4 Armor.",
        "type": "Hero Power",
        "fr": {
            "name": "Défense stoïque"
        }
    },
    {
        "cardImage": "CRED_15.png",
        "elite": true,
        "cost": 1,
        "set": "Credits",
        "attack": 1,
        "name": "Andy Brock",
        "health": 3,
        "id": "CRED_15",
        "text": "Can't be <b>Silenced. Divine Shield, Stealth.</b>",
        "type": "Minion",
        "fr": {
            "name": "Andy Brock"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_18.png",
        "elite": true,
        "cost": 2,
        "set": "Credits",
        "attack": 2,
        "name": "Becca Abel",
        "health": 2,
        "id": "CRED_18",
        "text": "Whenever you draw a card, make it Golden.",
        "type": "Minion",
        "fr": {
            "name": "Becca Abel"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_08.png",
        "elite": true,
        "cost": 3,
        "set": "Credits",
        "attack": 4,
        "name": "Ben Brode",
        "health": 1,
        "id": "CRED_08",
        "text": "Your volume can't be reduced below maximum.",
        "type": "Minion",
        "fr": {
            "name": "Ben Brode"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_09.png",
        "elite": true,
        "cost": 6,
        "set": "Credits",
        "attack": 4,
        "name": "Ben Thompson",
        "health": 7,
        "id": "CRED_09",
        "text": "<b>Battlecry:</b> Draw some cards. With a pen.",
        "type": "Minion",
        "fr": {
            "name": "Ben Thompson"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_19.png",
        "elite": true,
        "cost": 4,
        "set": "Credits",
        "attack": 6,
        "name": "Beomki Hong",
        "health": 3,
        "id": "CRED_19",
        "text": "<b>Taunt.</b> Friendly minions can’t be <b>Frozen.</b>",
        "type": "Minion",
        "fr": {
            "name": "Beomki Hong"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_03.png",
        "elite": true,
        "cost": 3,
        "set": "Credits",
        "attack": 2,
        "name": "Bob Fitch",
        "health": 4,
        "id": "CRED_03",
        "text": "<b>Super Taunt</b> <i>(EVERY character must attack this minion.)</i>",
        "type": "Minion",
        "fr": {
            "name": "Bob Fitch"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_20.png",
        "elite": true,
        "cost": 3,
        "set": "Credits",
        "attack": 4,
        "name": "Brian Birmingham",
        "health": 2,
        "id": "CRED_20",
        "text": "<b>Choose One</b> - Restore a Mech to full Health; or Give a Designer <b>Windfury.</b>",
        "type": "Minion",
        "fr": {
            "name": "Brian Birmingham"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_13.png",
        "elite": true,
        "cost": 10,
        "set": "Credits",
        "attack": 10,
        "name": "Brian Schwab",
        "health": 10,
        "id": "CRED_13",
        "text": "At the end of your turn, give a random minion +1 Attack.",
        "type": "Minion",
        "fr": {
            "name": "Brian Schwab"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_21.png",
        "elite": true,
        "cost": 1,
        "set": "Credits",
        "attack": 1,
        "name": "Bryan Chang",
        "health": 3,
        "id": "CRED_21",
        "text": "<b>Foodie:</b> Make all minions edible.",
        "type": "Minion",
        "fr": {
            "name": "Bryan Chang"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_22.png",
        "elite": true,
        "cost": 3,
        "set": "Credits",
        "attack": 3,
        "name": "Cameron Chrisman",
        "health": 3,
        "id": "CRED_22",
        "text": "While this is in your hand, Golden cards cost (1) less.",
        "type": "Minion",
        "fr": {
            "name": "Cameron Chrisman"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_23.png",
        "elite": true,
        "cost": 4,
        "set": "Credits",
        "attack": 6,
        "name": "Christopher Yim",
        "health": 5,
        "id": "CRED_23",
        "text": "<b>Battlecry:</b> Your emotes are now spoken in \"Radio Voice.\"",
        "type": "Minion",
        "fr": {
            "name": "Christopher Yim"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_24.png",
        "elite": true,
        "cost": 7,
        "set": "Credits",
        "attack": 7,
        "name": "Dean Ayala",
        "health": 5,
        "id": "CRED_24",
        "text": "You can't lose stars while this is in your deck.",
        "type": "Minion",
        "fr": {
            "name": "Dean Ayala"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_06.png",
        "elite": true,
        "cost": 1,
        "set": "Credits",
        "attack": 3,
        "name": "Derek Sakamoto",
        "health": 1,
        "id": "CRED_06",
        "text": "<i>The notorious Footclapper.</i>",
        "type": "Minion",
        "fr": {
            "name": "Derek Sakamoto"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_25.png",
        "elite": true,
        "cost": 4,
        "set": "Credits",
        "attack": 2,
        "name": "Elizabeth Cho",
        "health": 4,
        "id": "CRED_25",
        "text": "<b>Battlecry:</b> Add Echo of Medivh and Echoing Ooze to your hand.",
        "type": "Minion",
        "fr": {
            "name": "Elizabeth Cho"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_26.png",
        "elite": true,
        "cost": 3,
        "set": "Credits",
        "attack": 1,
        "name": "Eric Del Priore",
        "health": 6,
        "id": "CRED_26",
        "text": "Has <b>Taunt</b> if it's 3 AM.",
        "type": "Minion",
        "fr": {
            "name": "Eric Del Priore"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_02.png",
        "elite": true,
        "cost": 6,
        "set": "Credits",
        "attack": 5,
        "name": "Eric Dodds",
        "health": 5,
        "id": "CRED_02",
        "text": "<b>Battlecry:</b> Summon a 2/2 Pirate and destroy all Ninjas.",
        "type": "Minion",
        "fr": {
            "name": "Eric Dodds"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_16.png",
        "elite": true,
        "cost": 7,
        "set": "Credits",
        "attack": 9,
        "name": "Hamilton Chu",
        "health": 5,
        "id": "CRED_16",
        "text": "<i>Was successfully NOT part of the problem! ...most of the time.</i>",
        "type": "Minion",
        "fr": {
            "name": "Hamilton Chu"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_28.png",
        "elite": true,
        "cost": 4,
        "set": "Credits",
        "attack": 4,
        "name": "He-Rim Woo",
        "health": 3,
        "id": "CRED_28",
        "text": "<b>Choose One</b> - Punch an arm; Offer a treat; or Give a big hug.",
        "type": "Minion",
        "fr": {
            "name": "He-Rim Woo"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_27.png",
        "elite": true,
        "cost": 3,
        "set": "Credits",
        "attack": 3,
        "name": "Henry Ho",
        "health": 4,
        "id": "CRED_27",
        "text": "<b>Battlecry:</b> Spectate your opponent's hand.",
        "type": "Minion",
        "fr": {
            "name": "Henry Ho"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_01.png",
        "elite": true,
        "cost": 6,
        "set": "Credits",
        "attack": 7,
        "name": "Jason Chayes",
        "health": 6,
        "id": "CRED_01",
        "text": "<b>Enrage:</b> Just kidding! He never Enrages.",
        "type": "Minion",
        "fr": {
            "name": "Jason Chayes"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_29.png",
        "elite": true,
        "cost": 5,
        "set": "Credits",
        "attack": 6,
        "name": "Jason MacAllister",
        "health": 5,
        "id": "CRED_29",
        "text": "<i>He's a real stand-up guy.</i>",
        "type": "Minion",
        "fr": {
            "name": "Jason MacAllister"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_11.png",
        "elite": true,
        "cost": 4,
        "set": "Credits",
        "attack": 1,
        "name": "Jay Baxter",
        "health": 4,
        "id": "CRED_11",
        "text": "<b>Battlecry:</b> Summon FIVE random Inventions.",
        "type": "Minion",
        "fr": {
            "name": "Jay Baxter"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_30.png",
        "elite": true,
        "cost": 7,
        "set": "Credits",
        "attack": 2,
        "name": "JC Park",
        "health": 4,
        "id": "CRED_30",
        "text": "<b>Battlecry:</b> Add a new platform for Hearthstone.",
        "type": "Minion",
        "fr": {
            "name": "JC Park"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_31.png",
        "elite": true,
        "cost": 4,
        "set": "Credits",
        "attack": 5,
        "name": "Jeremy Cranford",
        "health": 4,
        "id": "CRED_31",
        "text": "When the game starts, this card climbs to the top of the deck.",
        "type": "Minion",
        "fr": {
            "name": "Jeremy Cranford"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_32.png",
        "elite": true,
        "cost": 2,
        "set": "Credits",
        "attack": 3,
        "name": "Jerry Mascho",
        "health": 2,
        "id": "CRED_32",
        "text": "At the start of your turn, deal 1 damage. If this card is golden, deal 1 damage at the end of your turn instead. THIS IS A HAN SOLO JOKE.",
        "type": "Minion",
        "fr": {
            "name": "Jerry Mascho"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_33.png",
        "elite": true,
        "cost": 6,
        "set": "Credits",
        "attack": 7,
        "name": "Jomaro Kindred",
        "health": 6,
        "id": "CRED_33",
        "text": "<b>Battlecry:</b> TAKE any cards from your opponent's hand that they don't want.",
        "type": "Minion",
        "fr": {
            "name": "Jomaro Kindred"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_43.png",
        "elite": true,
        "cost": 5,
        "set": "Credits",
        "attack": 5,
        "name": "Jon Bankard",
        "health": 5,
        "id": "CRED_43",
        "text": "50% chance to be 100% right.",
        "type": "Minion",
        "fr": {
            "name": "Jon Bankard"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_45.png",
        "elite": true,
        "cost": 6,
        "set": "Credits",
        "attack": 6,
        "name": "Jonas Laster",
        "health": 6,
        "id": "CRED_45",
        "text": "Whenever a <b>Silenced</b> minion dies, gain +1/+1.",
        "type": "Minion",
        "fr": {
            "name": "Jonas Laster"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_46.png",
        "elite": true,
        "cost": 2,
        "set": "Credits",
        "attack": 2,
        "name": "Keith Landes",
        "health": 6,
        "id": "CRED_46",
        "text": "At the start of your turn, get -2 Health due to hunger.",
        "type": "Minion",
        "fr": {
            "name": "Keith Landes"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_05.png",
        "elite": true,
        "cost": 3,
        "set": "Credits",
        "attack": 5,
        "name": "Kyle Harrison",
        "health": 4,
        "id": "CRED_05",
        "text": "<i>3 for a 5/4? That's a good deal!</i>",
        "type": "Minion",
        "fr": {
            "name": "Kyle Harrison"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_34.png",
        "elite": true,
        "cost": 3,
        "set": "Credits",
        "attack": 6,
        "name": "Max Ma",
        "health": 3,
        "id": "CRED_34",
        "text": "Can only be played on a mobile device.",
        "type": "Minion",
        "fr": {
            "name": "Max Ma"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_35.png",
        "elite": true,
        "cost": 4,
        "set": "Credits",
        "attack": 9,
        "name": "Max McCall",
        "health": 2,
        "id": "CRED_35",
        "text": "Your emotes have no cooldown and can't be squelched.",
        "type": "Minion",
        "fr": {
            "name": "Max McCall"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_10.png",
        "elite": true,
        "cost": 2,
        "set": "Credits",
        "attack": 2,
        "name": "Michael Schweitzer",
        "health": 2,
        "id": "CRED_10",
        "text": "<b>C-C-C-COMBO:</b> Destroy a minion.",
        "type": "Minion",
        "fr": {
            "name": "Michael Schweitzer"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_36.png",
        "elite": true,
        "cost": 6,
        "set": "Credits",
        "attack": 4,
        "name": "Mike Donais",
        "health": 8,
        "id": "CRED_36",
        "text": "<b>Battlecry:</b> Replace all minions in the battlefield, in both hands, and in both decks with random minions.",
        "type": "Minion",
        "fr": {
            "name": "Mike Donais"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_12.png",
        "elite": true,
        "cost": 2,
        "set": "Credits",
        "attack": 1,
        "name": "Rachelle Davis",
        "health": 2,
        "id": "CRED_12",
        "text": "<b>Battlecry:</b> Draw TWO cards. <i>She's not a novice engineer.</i>",
        "type": "Minion",
        "fr": {
            "name": "Rachelle Davis"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_37.png",
        "elite": true,
        "cost": 4,
        "set": "Credits",
        "attack": 3,
        "name": "Ricardo Robaina",
        "health": 4,
        "id": "CRED_37",
        "text": "<b>Battlecry:</b> Summon three 1/1 Chinchillas.",
        "type": "Minion",
        "fr": {
            "name": "Ricardo Robaina"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_17.png",
        "elite": true,
        "cost": 9,
        "set": "Credits",
        "attack": 9,
        "name": "Rob Pardo",
        "health": 9,
        "id": "CRED_17",
        "text": "You can't start a game without this minion in your deck.",
        "type": "Minion",
        "fr": {
            "name": "Rob Pardo"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_38.png",
        "elite": true,
        "cost": 4,
        "set": "Credits",
        "attack": 4,
        "name": "Robin Fredericksen",
        "health": 4,
        "id": "CRED_38",
        "text": "<b>Battlecry:</b> If you have no other Erics on the battlefield, rename this card to \"Eric\".",
        "type": "Minion",
        "fr": {
            "name": "Robin Fredericksen"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_39.png",
        "elite": true,
        "cost": 2,
        "set": "Credits",
        "attack": 2,
        "name": "Ryan Chew",
        "health": 3,
        "id": "CRED_39",
        "text": "<b>Chews One</b> - Sing karaoke; or Leave on time and tell everyone about it.",
        "type": "Minion",
        "fr": {
            "name": "Ryan Chew"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_40.png",
        "cost": 4,
        "set": "Credits",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Ryan Masterson"
        },
        "playerClass": "Rogue",
        "elite": true,
        "attack": 7,
        "name": "Ryan Masterson",
        "id": "CRED_40",
        "text": "<b>Battlecry:</b> Cast copies of Backstab, Cold Blood, and Eviscerate. <i>(targets chosen randomly).</i>",
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_41.png",
        "elite": true,
        "cost": 5,
        "set": "Credits",
        "attack": 2,
        "name": "Seyil Yoon",
        "health": 9,
        "id": "CRED_41",
        "text": "<b>Battlecry:</b> Add 3 Sprints and a Marathon to your hand.",
        "type": "Minion",
        "fr": {
            "name": "Seyil Yoon"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_04.png",
        "elite": true,
        "cost": 1,
        "set": "Credits",
        "attack": 3,
        "name": "Steven Gabriel",
        "health": 3,
        "id": "CRED_04",
        "text": "<b>Battlecry:</b> Summon a frothy beverage.",
        "type": "Minion",
        "fr": {
            "name": "Steven Gabriel"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_42.png",
        "elite": true,
        "cost": 4,
        "set": "Credits",
        "attack": 3,
        "name": "Tim Erskine",
        "health": 5,
        "id": "CRED_42",
        "text": "Whenever this minion destroys another minion, draw a card.",
        "type": "Minion",
        "fr": {
            "name": "Tim Erskine"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_44.png",
        "elite": true,
        "cost": 4,
        "set": "Credits",
        "attack": 3,
        "name": "Walter Kong",
        "health": 2,
        "id": "CRED_44",
        "text": "<b>Battlecry:</b> Deal 1 damage to each of 2 strategic targets.",
        "type": "Minion",
        "fr": {
            "name": "Walter Kong"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_14.png",
        "elite": true,
        "cost": 5,
        "set": "Credits",
        "attack": 3,
        "name": "Yong Woo",
        "health": 2,
        "id": "CRED_14",
        "text": "Your other minions have +3 Attack and <b>Charge</b>.",
        "type": "Minion",
        "fr": {
            "name": "Yong Woo"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "CRED_07.png",
        "elite": true,
        "cost": 2,
        "set": "Credits",
        "attack": 2,
        "name": "Zwick",
        "health": 2,
        "id": "CRED_07",
        "text": "<b>Battlecry:</b> Complain about bacon prices.",
        "type": "Minion",
        "fr": {
            "name": "Zwick"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "NEW1_016.png",
        "cost": 2,
        "collectible": true,
        "set": "Reward",
        "race": "Beast",
        "artist": "Daren Bader",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked when you have all the Golden Pirates from the Classic Set.",
        "fr": {
            "name": "Perroquet du capitaine"
        },
        "flavor": "Pirates and Parrots go together like Virmen and Carrots.",
        "attack": 1,
        "name": "Captain's Parrot",
        "howToGet": "Unlocked when you have all the Pirates from the Classic Set.",
        "id": "NEW1_016",
        "text": "<b>Battlecry:</b> Put a random Pirate from your deck into your hand.",
        "rarity": "Epic"
    },
    {
        "cardImage": "EX1_062.png",
        "cost": 4,
        "collectible": true,
        "set": "Reward",
        "race": "Murloc",
        "artist": "Dan Scott",
        "health": 4,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "howToGetGold": "Unlocked when you have all the Golden Murlocs from the Classic and Basic Sets.",
        "fr": {
            "name": "Vieux Troublœil"
        },
        "flavor": "He's a legend among murlocs.  \"Mrghllghghllghg!\", they say.",
        "elite": true,
        "attack": 2,
        "faction": "Neutral",
        "name": "Old Murk-Eye",
        "howToGet": "Unlocked when you have all the Murlocs from the Classic Set.",
        "id": "EX1_062",
        "text": "<b>Charge</b>. Has +1 Attack for each other Murloc on the battlefield.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "FP1_026.png",
        "cost": 4,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Nate Bowden",
        "health": 5,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Rogue Class Challenge in Naxxramas.",
        "fr": {
            "name": "Embusqué anub’ar"
        },
        "flavor": "Originally he was called \"Anub'ar Guy who bounces a guy back to your hand\", but it lacked a certain zing.",
        "playerClass": "Rogue",
        "attack": 5,
        "name": "Anub'ar Ambusher",
        "howToGet": "Unlocked by completing the Rogue Class Challenge in Naxxramas.",
        "id": "FP1_026",
        "text": "<b>Deathrattle:</b> Return a random friendly minion to your hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "NAX1_01.png",
        "set": "Curse of Naxxramas",
        "name": "Anub'Rekhan",
        "health": 30,
        "id": "NAX1_01",
        "type": "Hero",
        "fr": {
            "name": "Anub’Rekhan"
        }
    },
    {
        "cardImage": "NAX1h_01.png",
        "set": "Curse of Naxxramas",
        "name": "Anub'Rekhan",
        "health": 45,
        "id": "NAX1h_01",
        "type": "Hero",
        "fr": {
            "name": "Anub’Rekhan"
        }
    },
    {
        "cardImage": "FP1_020.png",
        "cost": 1,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Zoltan & Gabor",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "howToGetGold": "Can be crafted after completing the Paladin Class Challenge in Naxxramas.",
        "fr": {
            "name": "Venger"
        },
        "flavor": "Several paladins have joined together to deliver justice under the name \"Justice Force\".  Their lawyer talked them out of calling themselves the Justice League.",
        "playerClass": "Paladin",
        "name": "Avenge",
        "howToGet": "Unlocked by completing the Paladin Class Challenge in Naxxramas.",
        "id": "FP1_020",
        "text": "<b>Secret:</b> When one of your minions dies, give a random friendly minion +3/+2.",
        "rarity": "Common"
    },
    {
        "cardImage": "NAX9_01.png",
        "set": "Curse of Naxxramas",
        "name": "Baron Rivendare",
        "health": 7,
        "id": "NAX9_01",
        "type": "Hero",
        "fr": {
            "name": "Baron Vaillefendre"
        }
    },
    {
        "cardImage": "NAX9_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Baron Rivendare",
        "health": 14,
        "id": "NAX9_01H",
        "type": "Hero",
        "fr": {
            "name": "Baron Vaillefendre"
        }
    },
    {
        "cardImage": "FP1_031.png",
        "cost": 4,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Ralph Horsley",
        "health": 7,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Military Quarter.",
        "fr": {
            "name": "Baron Vaillefendre"
        },
        "flavor": "There used to be five Horsemen but one of them left because a job opened up in the deadmines and the benefits were better.",
        "elite": true,
        "attack": 1,
        "name": "Baron Rivendare",
        "howToGet": "Unlocked by completing the Military Quarter.",
        "id": "FP1_031",
        "text": "Your minions trigger their <b>Deathrattles</b> twice.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "NAX15_04H.png",
        "cost": 8,
        "set": "Curse of Naxxramas",
        "name": "Chains",
        "id": "NAX15_04H",
        "text": "<b>Hero Power</b>\nTake control of a random enemy minion.",
        "type": "Hero Power",
        "fr": {
            "name": "Chaînes"
        }
    },
    {
        "cardImage": "NAX15_04.png",
        "cost": 8,
        "set": "Curse of Naxxramas",
        "name": "Chains",
        "id": "NAX15_04",
        "text": "<b>Hero Power</b>\nTake control of a random enemy minion until end of turn.",
        "type": "Hero Power",
        "fr": {
            "name": "Chaînes"
        }
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Consume",
        "id": "FP1_005e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Consumer"
        }
    },
    {
        "cardImage": "FP1_029.png",
        "cost": 3,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Jon McConnell",
        "health": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Instructor Razuvious in the Military Quarter.",
        "fr": {
            "name": "Épées dansantes"
        },
        "flavor": "They like to dance to reggae.",
        "attack": 4,
        "name": "Dancing Swords",
        "howToGet": "Unlocked by defeating Instructor Razuvious in the Military Quarter.",
        "id": "FP1_029",
        "text": "<b>Deathrattle:</b> Your opponent draws a card.",
        "rarity": "Common"
    },
    {
        "cardImage": "FP1_023.png",
        "cost": 3,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Phroilan Gardner",
        "health": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Priest Class Challenge in Naxxramas.",
        "fr": {
            "name": "Sombre sectateur"
        },
        "flavor": "The Cult of the Damned has found it's best not to mention their name when recruiting new cultists.",
        "playerClass": "Priest",
        "attack": 3,
        "name": "Dark Cultist",
        "howToGet": "Unlocked by completing the Priest Class Challenge in Naxxramas.",
        "id": "FP1_023",
        "text": "<b>Deathrattle:</b> Give a random friendly minion +3 Health.",
        "rarity": "Common"
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Darkness Calls",
        "id": "FP1_028e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Appel des ténèbres"
        }
    },
    {
        "cardImage": "FP1_021.png",
        "cost": 4,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Jim Nelson",
        "durability": 2,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Weapon",
        "howToGetGold": "Can be crafted after completing the Warrior Class Challenge in Naxxramas.",
        "fr": {
            "name": "Morsure de la mort"
        },
        "flavor": "\"Take a bite outta Death.\" - McScruff the Deathlord",
        "playerClass": "Warrior",
        "attack": 4,
        "name": "Death's Bite",
        "howToGet": "Unlocked by completing the Warrior Class Challenge in Naxxramas.",
        "id": "FP1_021",
        "text": "<b>Deathrattle:</b> Deal 1 damage to all minions.",
        "rarity": "Common"
    },
    {
        "cardImage": "NAX6_03.png",
        "cost": 4,
        "set": "Curse of Naxxramas",
        "name": "Deathbloom",
        "id": "NAX6_03",
        "text": "Deal $5 damage to a minion. Summon a Spore.",
        "type": "Spell",
        "fr": {
            "name": "Mortelle floraison"
        }
    },
    {
        "cardImage": "FP1_006.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "attack": 2,
        "name": "Deathcharger",
        "health": 3,
        "mechanics": [
            "Charge",
            "Deathrattle"
        ],
        "id": "FP1_006",
        "text": "<b>Charge. Deathrattle:</b> Deal 3 damage to your hero.",
        "type": "Minion",
        "fr": {
            "name": "Destrier de la mort"
        }
    },
    {
        "cardImage": "FP1_009.png",
        "cost": 3,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Ben Olson",
        "health": 8,
        "mechanics": [
            "Deathrattle",
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating The Four Horsemen in the Military Quarter.",
        "fr": {
            "name": "Seigneur de la mort"
        },
        "flavor": "\"Rise from your grave!\" - Kel'Thuzad",
        "attack": 2,
        "name": "Deathlord",
        "howToGet": "Unlocked by defeating The Four Horsemen in the Military Quarter.",
        "id": "FP1_009",
        "text": "<b>Taunt. Deathrattle:</b> Your opponent puts a minion from their deck into the battlefield.",
        "rarity": "Rare"
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Decimate",
        "id": "NAX12_02e",
        "text": "Health changed to 1.",
        "type": "Enchantment",
        "fr": {
            "name": "Décimer"
        }
    },
    {
        "cardImage": "NAX12_02.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "name": "Decimate",
        "id": "NAX12_02",
        "text": "<b>Hero Power</b>\nChange the Health of all minions to 1.",
        "type": "Hero Power",
        "fr": {
            "name": "Décimer"
        }
    },
    {
        "cardImage": "NAX12_02H.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "name": "Decimate",
        "id": "NAX12_02H",
        "text": "<b>Hero Power</b>\nChange the Health of enemy minions to 1.",
        "type": "Hero Power",
        "fr": {
            "name": "Décimer"
        }
    },
    {
        "cardImage": "FP1_018.png",
        "cost": 3,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Alex Garner",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "howToGetGold": "Can be crafted after completing the Mage Class Challenge in Naxxramas.",
        "fr": {
            "name": "Dupliquer"
        },
        "flavor": "The one time when duping cards won't get your account banned!",
        "playerClass": "Mage",
        "name": "Duplicate",
        "howToGet": "Unlocked by completing the Mage Class Challenge in Naxxramas.",
        "id": "FP1_018",
        "text": "<b>Secret:</b> When a friendly minion dies, put 2 copies of it into your hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "FP1_003.png",
        "cost": 2,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Eric Browning",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Sapphiron in the Frostwyrm Lair.",
        "fr": {
            "name": "Limon résonnant"
        },
        "flavor": "OOZE... Ooze... Ooze... (ooze...)",
        "attack": 1,
        "name": "Echoing Ooze",
        "howToGet": "Unlocked by defeating Sapphiron in the Frostwyrm Lair.",
        "id": "FP1_003",
        "text": "<b>Battlecry:</b> Summon an exact copy of this minion at the end of the turn.",
        "rarity": "Epic"
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Enrage",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "NAX12_04e",
        "text": "+6 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Accès de rage"
        }
    },
    {
        "cardImage": "NAX12_04.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "name": "Enrage",
        "id": "NAX12_04",
        "text": "Give your hero +6 Attack this turn.",
        "type": "Spell",
        "fr": {
            "name": "Accès de rage"
        }
    },
    {
        "cardImage": "NAX5_02H.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "name": "Eruption",
        "id": "NAX5_02H",
        "text": "<b>Hero Power</b>\nDeal 3 damage to the left-most enemy minion.",
        "type": "Hero Power",
        "fr": {
            "name": "Éruption"
        }
    },
    {
        "cardImage": "NAX5_02.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "name": "Eruption",
        "id": "NAX5_02",
        "text": "<b>Hero Power</b>\nDeal 2 damage to the left-most enemy minion.",
        "type": "Hero Power",
        "fr": {
            "name": "Éruption"
        }
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Extra Teeth",
        "id": "NAX12_03e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Double rangée de dents"
        }
    },
    {
        "cardImage": "NAX11_03.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "attack": 2,
        "name": "Fallout Slime",
        "health": 2,
        "id": "NAX11_03",
        "type": "Minion",
        "fr": {
            "name": "Gelée polluée"
        }
    },
    {
        "cardImage": "NAX13_04H.png",
        "elite": true,
        "cost": 5,
        "set": "Curse of Naxxramas",
        "attack": 4,
        "name": "Feugen",
        "health": 7,
        "id": "NAX13_04H",
        "type": "Minion",
        "fr": {
            "name": "Feugen"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "FP1_015.png",
        "cost": 5,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Dany Orizio",
        "health": 7,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Construct Quarter.",
        "fr": {
            "name": "Feugen"
        },
        "flavor": "Feugen is sad because everyone likes Stalagg better.",
        "elite": true,
        "attack": 4,
        "name": "Feugen",
        "howToGet": "Unlocked by completing the Construct Quarter.",
        "id": "FP1_015",
        "text": "<b>Deathrattle:</b> If Stalagg also died this game, summon Thaddius.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "NAX15_02.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "name": "Frost Blast",
        "mechanics": [
            "Freeze"
        ],
        "id": "NAX15_02",
        "text": "<b>Hero Power</b>\nDeal 2 damage to the enemy hero and <b>Freeze</b> it.",
        "type": "Hero Power",
        "fr": {
            "name": "Trait de givre"
        }
    },
    {
        "cardImage": "NAX15_02H.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "name": "Frost Blast",
        "mechanics": [
            "Freeze"
        ],
        "id": "NAX15_02H",
        "text": "<b>Hero Power</b>\nDeal 3 damage to the enemy hero and <b>Freeze</b> it.",
        "type": "Hero Power",
        "fr": {
            "name": "Trait de givre"
        }
    },
    {
        "cardImage": "NAX14_02.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "name": "Frost Breath",
        "id": "NAX14_02",
        "text": "<b>Hero Power</b>\nDestroy all enemy minions that aren't <b>Frozen</b>.",
        "type": "Hero Power",
        "fr": {
            "name": "Souffle de givre"
        }
    },
    {
        "cardImage": "NAX14_03.png",
        "cost": 5,
        "set": "Curse of Naxxramas",
        "attack": 2,
        "name": "Frozen Champion",
        "health": 10,
        "mechanics": [
            "Aura"
        ],
        "id": "NAX14_03",
        "text": "Permanently Frozen.  Adjacent minions are Immune to Frost Breath.",
        "type": "Minion",
        "fr": {
            "name": "Champion gelé"
        }
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Fungal Growth",
        "id": "NAX6_03te",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Croissance fongique"
        }
    },
    {
        "cardImage": "NAX12_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Gluth",
        "health": 45,
        "id": "NAX12_01H",
        "type": "Hero",
        "fr": {
            "name": "Gluth"
        }
    },
    {
        "cardImage": "NAX12_01.png",
        "set": "Curse of Naxxramas",
        "name": "Gluth",
        "health": 30,
        "id": "NAX12_01",
        "type": "Hero",
        "fr": {
            "name": "Gluth"
        }
    },
    {
        "cardImage": "NAX8_01.png",
        "set": "Curse of Naxxramas",
        "name": "Gothik the Harvester",
        "health": 30,
        "id": "NAX8_01",
        "type": "Hero",
        "fr": {
            "name": "Gothik le Moissonneur"
        }
    },
    {
        "cardImage": "NAX8_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Gothik the Harvester",
        "health": 45,
        "id": "NAX8_01H",
        "type": "Hero",
        "fr": {
            "name": "Gothik le Moissonneur"
        }
    },
    {
        "cardImage": "NAX2_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Grand Widow Faerlina",
        "health": 45,
        "id": "NAX2_01H",
        "type": "Hero",
        "fr": {
            "name": "Grande veuve Faerlina"
        }
    },
    {
        "cardImage": "NAX2_01.png",
        "set": "Curse of Naxxramas",
        "name": "Grand Widow Faerlina",
        "health": 30,
        "id": "NAX2_01",
        "type": "Hero",
        "fr": {
            "name": "Grande veuve Faerlina"
        }
    },
    {
        "cardImage": "NAX11_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Grobbulus",
        "health": 45,
        "id": "NAX11_01H",
        "type": "Hero",
        "fr": {
            "name": "Grobbulus"
        }
    },
    {
        "cardImage": "NAX11_01.png",
        "set": "Curse of Naxxramas",
        "name": "Grobbulus",
        "health": 30,
        "id": "NAX11_01",
        "type": "Hero",
        "fr": {
            "name": "Grobbulus"
        }
    },
    {
        "cardImage": "NAX15_03t.png",
        "cost": 4,
        "set": "Curse of Naxxramas",
        "attack": 5,
        "name": "Guardian of Icecrown",
        "health": 5,
        "mechanics": [
            "Taunt"
        ],
        "id": "NAX15_03t",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Garde de la Couronne de glace"
        }
    },
    {
        "cardImage": "NAX15_03n.png",
        "cost": 4,
        "set": "Curse of Naxxramas",
        "attack": 3,
        "name": "Guardian of Icecrown",
        "health": 3,
        "mechanics": [
            "Taunt"
        ],
        "id": "NAX15_03n",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Garde de la Couronne de glace"
        }
    },
    {
        "cardImage": "NAX8_02.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "name": "Harvest",
        "id": "NAX8_02",
        "text": "<b>Hero Power</b>\nDraw a card.",
        "type": "Hero Power",
        "fr": {
            "name": "Moisson"
        }
    },
    {
        "cardImage": "NAX8_02H.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "name": "Harvest",
        "id": "NAX8_02H",
        "text": "<b>Hero Power</b>\nDraw a card. Gain a Mana Crystal.",
        "type": "Hero Power",
        "fr": {
            "name": "Moisson"
        }
    },
    {
        "cardImage": "NAX10_03H.png",
        "cost": 4,
        "set": "Curse of Naxxramas",
        "name": "Hateful Strike",
        "id": "NAX10_03H",
        "text": "<b>Hero Power</b>\nDestroy a minion.",
        "type": "Hero Power",
        "fr": {
            "name": "Frappe haineuse"
        }
    },
    {
        "cardImage": "NAX10_03.png",
        "cost": 4,
        "set": "Curse of Naxxramas",
        "name": "Hateful Strike",
        "id": "NAX10_03",
        "text": "<b>Hero Power</b>\nDestroy a minion.",
        "type": "Hero Power",
        "fr": {
            "name": "Frappe haineuse"
        }
    },
    {
        "cardImage": "FP1_002.png",
        "cost": 2,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "race": "Beast",
        "artist": "Jeremy Cranford",
        "health": 2,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Anub'Rekhan in the Arachnid Quarter.",
        "fr": {
            "name": "Rampante hantée"
        },
        "flavor": "Arachnofauxbia: Fear of fake spiders.",
        "attack": 1,
        "name": "Haunted Creeper",
        "howToGet": "Unlocked by defeating Anub'Rekhan in the Arachnid Quarter.",
        "id": "FP1_002",
        "text": "<b>Deathrattle:</b> Summon two 1/1 Spectral Spiders.",
        "rarity": "Common"
    },
    {
        "cardImage": "NAX5_01.png",
        "playerClass": "Warlock",
        "set": "Curse of Naxxramas",
        "name": "Heigan the Unclean",
        "health": 30,
        "id": "NAX5_01",
        "type": "Hero",
        "fr": {
            "name": "Heigan l’Impur"
        }
    },
    {
        "cardImage": "NAX5_01H.png",
        "playerClass": "Warlock",
        "set": "Curse of Naxxramas",
        "name": "Heigan the Unclean",
        "health": 45,
        "id": "NAX5_01H",
        "type": "Hero",
        "fr": {
            "name": "Heigan l’Impur"
        }
    },
    {
        "cardImage": "NAX10_02.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 5,
        "durability": 8,
        "name": "Hook",
        "mechanics": [
            "Deathrattle"
        ],
        "id": "NAX10_02",
        "text": "<b>Deathrattle:</b> Put this weapon into your hand.",
        "type": "Weapon",
        "fr": {
            "name": "Crochet"
        }
    },
    {
        "cardImage": "NAX10_02H.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 4,
        "durability": 8,
        "name": "Hook",
        "mechanics": [
            "Deathrattle",
            "Windfury"
        ],
        "id": "NAX10_02H",
        "text": "<b>Windfury</b>\n<b>Deathrattle:</b> Put this weapon into your hand.",
        "type": "Weapon",
        "fr": {
            "name": "Crochet"
        }
    },
    {
        "cardImage": "NAX7_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Instructor Razuvious",
        "health": 55,
        "id": "NAX7_01H",
        "type": "Hero",
        "fr": {
            "name": "Instructeur Razuvious"
        }
    },
    {
        "cardImage": "NAX7_01.png",
        "set": "Curse of Naxxramas",
        "name": "Instructor Razuvious",
        "health": 40,
        "id": "NAX7_01",
        "type": "Hero",
        "fr": {
            "name": "Instructeur Razuvious"
        }
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Interloper!",
        "id": "NAX15_01He",
        "type": "Enchantment",
        "fr": {
            "name": "Intrus !"
        }
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Interloper!",
        "id": "NAX15_01e",
        "type": "Enchantment",
        "fr": {
            "name": "Intrus !"
        }
    },
    {
        "cardImage": "NAX12_03.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "attack": 1,
        "durability": 5,
        "name": "Jaws",
        "id": "NAX12_03",
        "text": "Whenever a minion with <b>Deathrattle</b> dies, gain +2 Attack.",
        "type": "Weapon",
        "fr": {
            "name": "Mâchoires"
        }
    },
    {
        "cardImage": "NAX12_03H.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "attack": 3,
        "durability": 5,
        "name": "Jaws",
        "id": "NAX12_03H",
        "text": "Whenever a minion with <b>Deathrattle</b> dies, gain +2 Attack.",
        "type": "Weapon",
        "fr": {
            "name": "Mâchoires"
        }
    },
    {
        "cardImage": "NAX15_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Kel'Thuzad",
        "health": 45,
        "id": "NAX15_01H",
        "type": "Hero",
        "fr": {
            "name": "Kel’Thuzad"
        }
    },
    {
        "cardImage": "NAX15_01.png",
        "set": "Curse of Naxxramas",
        "name": "Kel'Thuzad",
        "health": 30,
        "id": "NAX15_01",
        "type": "Hero",
        "fr": {
            "name": "Kel’Thuzad"
        }
    },
    {
        "cardImage": "FP1_013.png",
        "cost": 8,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Chris Robinson",
        "health": 8,
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating every boss in Naxxramas!",
        "fr": {
            "name": "Kel’Thuzad"
        },
        "flavor": "Kel'Thuzad could not resist the call of the Lich King. Even when it's just a robo-call extolling the Lich King's virtues.",
        "elite": true,
        "attack": 6,
        "name": "Kel'Thuzad",
        "howToGet": "Unlocked by defeating every boss in Naxxramas!",
        "id": "FP1_013",
        "text": "At the end of each turn, summon all friendly minions that died this turn.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "NAX9_02H.png",
        "elite": true,
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 2,
        "name": "Lady Blaumeux",
        "health": 7,
        "id": "NAX9_02H",
        "text": "Your hero is <b>Immune</b>.",
        "type": "Minion",
        "fr": {
            "name": "Dame Blaumeux"
        }
    },
    {
        "cardImage": "NAX9_02.png",
        "elite": true,
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 1,
        "name": "Lady Blaumeux",
        "health": 7,
        "id": "NAX9_02",
        "text": "Your hero is <b>Immune</b>.",
        "type": "Minion",
        "fr": {
            "name": "Dame Blaumeux"
        }
    },
    {
        "cardImage": "NAX6_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Loatheb",
        "health": 99,
        "id": "NAX6_01H",
        "type": "Hero",
        "fr": {
            "name": "Horreb"
        }
    },
    {
        "cardImage": "NAX6_01.png",
        "set": "Curse of Naxxramas",
        "name": "Loatheb",
        "health": 75,
        "id": "NAX6_01",
        "type": "Hero",
        "fr": {
            "name": "Horreb"
        }
    },
    {
        "cardImage": "FP1_030.png",
        "cost": 5,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Samwise",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Plague Quarter.",
        "fr": {
            "name": "Horreb"
        },
        "flavor": "Loatheb used to be a simple Bog Beast.  This is why we need stricter regulations on mining and agriculture.",
        "elite": true,
        "attack": 5,
        "name": "Loatheb",
        "howToGet": "Unlocked by completing the Plague Quarter.",
        "id": "FP1_030",
        "text": "<b>Battlecry:</b> Enemy spells cost (5) more next turn.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "NAX1_05.png",
        "cost": 7,
        "set": "Curse of Naxxramas",
        "name": "Locust Swarm",
        "id": "NAX1_05",
        "text": "Deal $3 damage to all enemy minions. Restore #3 Health to your hero.",
        "type": "Spell",
        "fr": {
            "name": "Nuée de sauterelles"
        }
    },
    {
        "cardImage": "FP1_004.png",
        "cost": 2,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "James Ryman",
        "health": 2,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Grobbulus in the Construct Quarter.",
        "fr": {
            "name": "Savant fou"
        },
        "flavor": "His mother wanted him to be a mage or a warlock, but noooooooo, he had to go and be a scientist like his father.",
        "attack": 2,
        "name": "Mad Scientist",
        "howToGet": "Unlocked by defeating Grobbulus in the Construct Quarter.",
        "id": "FP1_004",
        "text": "<b>Deathrattle:</b> Put a <b>Secret</b> from your deck into the battlefield.",
        "rarity": "Common"
    },
    {
        "cardImage": "FP1_010.png",
        "cost": 6,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "race": "Beast",
        "artist": "Howard Lyon",
        "health": 8,
        "mechanics": [
            "Poisonous"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Arachnid Quarter.",
        "fr": {
            "name": "Maexxna"
        },
        "flavor": "Maexxna gets super mad when people introduce her as \"Maxina\" or \"Maxxy\".",
        "elite": true,
        "attack": 2,
        "name": "Maexxna",
        "howToGet": "Unlocked by completing the Arachnid Quarter.",
        "id": "FP1_010",
        "text": "Destroy any minion damaged by this minion.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "NAX3_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Maexxna",
        "health": 45,
        "id": "NAX3_01H",
        "type": "Hero",
        "fr": {
            "name": "Maexxna"
        }
    },
    {
        "cardImage": "NAX3_01.png",
        "set": "Curse of Naxxramas",
        "name": "Maexxna",
        "health": 30,
        "id": "NAX3_01",
        "type": "Hero",
        "fr": {
            "name": "Maexxna"
        }
    },
    {
        "cardImage": "NAX9_07.png",
        "cost": 5,
        "set": "Curse of Naxxramas",
        "name": "Mark of the Horsemen",
        "id": "NAX9_07",
        "text": "Give your minions and your weapon +1/+1.",
        "type": "Spell",
        "fr": {
            "name": "Marque des cavaliers"
        }
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Mark of the Horsemen",
        "id": "NAX9_07e",
        "text": "+1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Marque des cavaliers"
        }
    },
    {
        "cardImage": "NAX7_04H.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 10,
        "durability": 2,
        "name": "Massive Runeblade",
        "id": "NAX7_04H",
        "text": "Deals double damage to heroes.",
        "type": "Weapon",
        "fr": {
            "name": "Lame runique massive"
        }
    },
    {
        "cardImage": "NAX7_04.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 5,
        "durability": 2,
        "name": "Massive Runeblade",
        "id": "NAX7_04",
        "text": "Deals double damage to heroes.",
        "type": "Weapon",
        "fr": {
            "name": "Lame runique massive"
        }
    },
    {
        "cardImage": "NAX7_05.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "name": "Mind Control Crystal",
        "id": "NAX7_05",
        "text": "Activate the Crystal to control the Understudies!",
        "type": "Spell",
        "fr": {
            "name": "Cristal de contrôle mental"
        }
    },
    {
        "cardImage": "NAX5_03.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "name": "Mindpocalypse",
        "id": "NAX5_03",
        "text": "Both players draw 2 cards and gain a Mana Crystal.",
        "type": "Spell",
        "fr": {
            "name": "Cervocalypse"
        }
    },
    {
        "cardImage": "NAX15_05.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "race": "Beast",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "M. Bigglesworth"
        },
        "elite": true,
        "attack": 1,
        "name": "Mr. Bigglesworth",
        "id": "NAX15_05",
        "text": "<i>This is Kel'Thuzad's kitty.</i>",
        "rarity": "Legendary"
    },
    {
        "cardImage": "NAX11_04.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "name": "Mutating Injection",
        "id": "NAX11_04",
        "text": "Give a minion +4/+4 and <b>Taunt</b>.",
        "type": "Spell",
        "fr": {
            "name": "Injection mutante"
        }
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Mutating Injection",
        "id": "NAX11_04e",
        "text": "+4/+4 and <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Injection mutante"
        }
    },
    {
        "cardImage": "NAXM_001.png",
        "cost": 4,
        "set": "Curse of Naxxramas",
        "attack": 5,
        "name": "Necroknight",
        "health": 6,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "NAXM_001",
        "text": "<b>Deathrattle:</b> Destroy the minions next to this one as well.",
        "type": "Minion",
        "fr": {
            "name": "Nécro-chevalier"
        }
    },
    {
        "cardImage": "NAX6_02.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "name": "Necrotic Aura",
        "id": "NAX6_02",
        "text": "<b>Hero Power</b>\nDeal 3 damage to the enemy hero.",
        "type": "Hero Power",
        "fr": {
            "name": "Aura nécrotique"
        }
    },
    {
        "cardImage": "NAX6_02H.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "name": "Necrotic Aura",
        "id": "NAX6_02H",
        "text": "<b>Hero Power</b>\nDeal 3 damage to the enemy hero.",
        "type": "Hero Power",
        "fr": {
            "name": "Aura nécrotique"
        }
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Necrotic Aura",
        "id": "FP1_030e",
        "text": "Your spells cost (5) more this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Aura nécrotique"
        }
    },
    {
        "cardImage": "NAX3_03.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "name": "Necrotic Poison",
        "id": "NAX3_03",
        "text": "Destroy a minion.",
        "type": "Spell",
        "fr": {
            "name": "Poison nécrotique"
        }
    },
    {
        "cardImage": "FP1_017.png",
        "cost": 2,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Alex Horley Orlandelli",
        "health": 4,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Grand Widow Faerlina in the Arachnid Quarter.",
        "fr": {
            "name": "Seigneur de la toile nérub’ar"
        },
        "flavor": "Weblords spend all day making giant trampoline parks.",
        "attack": 1,
        "name": "Nerub'ar Weblord",
        "howToGet": "Unlocked by defeating Grand Widow Faerlina in the Arachnid Quarter.",
        "id": "FP1_017",
        "text": "Minions with <b>Battlecry</b> cost (2) more.",
        "rarity": "Common"
    },
    {
        "cardImage": "NAX1h_03.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "attack": 4,
        "name": "Nerubian",
        "health": 4,
        "id": "NAX1h_03",
        "type": "Minion",
        "fr": {
            "name": "Nérubien"
        }
    },
    {
        "cardImage": "NAX1_03.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "attack": 3,
        "name": "Nerubian",
        "health": 1,
        "id": "NAX1_03",
        "type": "Minion",
        "fr": {
            "name": "Nérubien"
        }
    },
    {
        "cardImage": "FP1_007t.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 4,
        "name": "Nerubian",
        "health": 4,
        "id": "FP1_007t",
        "type": "Minion",
        "fr": {
            "name": "Nérubien"
        },
        "rarity": "Rare"
    },
    {
        "cardImage": "FP1_007.png",
        "cost": 2,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Justin Thavirat",
        "health": 2,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Maexxna in the Arachnid Quarter.",
        "fr": {
            "name": "Œuf de nérubien"
        },
        "flavor": "Eggs are a good source of protein and Nerubians.",
        "attack": 0,
        "name": "Nerubian Egg",
        "howToGet": "Unlocked by defeating Maexxna in the Arachnid Quarter.",
        "id": "FP1_007",
        "text": "<b>Deathrattle:</b> Summon a 4/4 Nerubian.",
        "rarity": "Rare"
    },
    {
        "cardImage": "NAX4_01H.png",
        "playerClass": "Mage",
        "set": "Curse of Naxxramas",
        "name": "Noth the Plaguebringer",
        "health": 45,
        "id": "NAX4_01H",
        "type": "Hero",
        "fr": {
            "name": "Noth le Porte-Peste"
        }
    },
    {
        "cardImage": "NAX4_01.png",
        "playerClass": "Mage",
        "set": "Curse of Naxxramas",
        "name": "Noth the Plaguebringer",
        "health": 30,
        "id": "NAX4_01",
        "type": "Hero",
        "fr": {
            "name": "Noth le Porte-Peste"
        }
    },
    {
        "cardImage": "NAX10_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Patchwerk",
        "health": 45,
        "id": "NAX10_01H",
        "type": "Hero",
        "fr": {
            "name": "Le Recousu"
        }
    },
    {
        "cardImage": "NAX10_01.png",
        "set": "Curse of Naxxramas",
        "name": "Patchwerk",
        "health": 30,
        "id": "NAX10_01",
        "type": "Hero",
        "fr": {
            "name": "Le Recousu"
        }
    },
    {
        "cardImage": "NAX4_05.png",
        "cost": 6,
        "set": "Curse of Naxxramas",
        "name": "Plague",
        "id": "NAX4_05",
        "text": "Destroy all non-Skeleton minions.",
        "type": "Spell",
        "fr": {
            "name": "Peste"
        }
    },
    {
        "cardImage": "NAX11_02.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "name": "Poison Cloud",
        "id": "NAX11_02",
        "text": "<b>Hero Power</b>\nDeal 1 damage to all minions. If any die, summon a slime.",
        "type": "Hero Power",
        "fr": {
            "name": "Nuage empoisonné"
        }
    },
    {
        "cardImage": "NAX11_02H.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "name": "Poison Cloud",
        "id": "NAX11_02H",
        "text": "<b>Hero Power</b>\nDeal 2 damage to all enemies. If any die, summon a slime.",
        "type": "Hero Power",
        "fr": {
            "name": "Nuage empoisonné"
        }
    },
    {
        "cardImage": "FP1_019.png",
        "cost": 4,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Brian Despain",
        "type": "Spell",
        "howToGetGold": "Can be crafted after completing the Druid Class Challenge in Naxxramas.",
        "fr": {
            "name": "Graines de poison"
        },
        "flavor": "\"Poisonseed Bagel\" is the least popular bagel at McTiggin's Druidic Bagel Emporium.",
        "playerClass": "Druid",
        "name": "Poison Seeds",
        "howToGet": "Unlocked by completing the Druid Class Challenge in Naxxramas.",
        "id": "FP1_019",
        "text": "Destroy all minions and summon 2/2 Treants to replace them.",
        "rarity": "Common"
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Polarity",
        "id": "NAX13_02e",
        "text": "Attack and Health swapped.",
        "type": "Enchantment",
        "fr": {
            "name": "Polarité"
        }
    },
    {
        "cardImage": "NAX13_02.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "name": "Polarity Shift",
        "id": "NAX13_02",
        "text": "<b>Hero Power</b>\nSwap the Attack and Health of all minions.",
        "type": "Hero Power",
        "fr": {
            "name": "Changement de polarité"
        }
    },
    {
        "playerClass": "Priest",
        "set": "Curse of Naxxramas",
        "name": "Power of the Ziggurat",
        "id": "FP1_023e",
        "text": "+3 Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance de la ziggourat"
        }
    },
    {
        "cardImage": "NAX14_04.png",
        "cost": 5,
        "set": "Curse of Naxxramas",
        "name": "Pure Cold",
        "mechanics": [
            "Freeze"
        ],
        "id": "NAX14_04",
        "text": "Deal $8 damage to the enemy hero, and <b>Freeze</b> it.",
        "type": "Spell",
        "fr": {
            "name": "Froid absolu"
        }
    },
    {
        "cardImage": "NAX2_03.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "name": "Rain of Fire",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "NAX2_03",
        "text": "<b>Hero Power</b>\nFire a missile for each card in your opponent's hand.",
        "type": "Hero Power",
        "fr": {
            "name": "Pluie de feu"
        }
    },
    {
        "cardImage": "NAX2_03H.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "name": "Rain of Fire",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "NAX2_03H",
        "text": "<b>Hero Power</b>\nFire a missile for each card in your opponent's hand.",
        "type": "Hero Power",
        "fr": {
            "name": "Pluie de feu"
        }
    },
    {
        "cardImage": "NAX4_04.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "name": "Raise Dead",
        "id": "NAX4_04",
        "text": "<b>Passive Hero Power</b>\nWhenever an enemy dies, raise a 1/1 Skeleton.",
        "type": "Hero Power",
        "fr": {
            "name": "Réanimation morbide"
        }
    },
    {
        "cardImage": "NAX4_04H.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "name": "Raise Dead",
        "id": "NAX4_04H",
        "text": "<b>Passive Hero Power</b>\nWhenever an enemy dies, raise a 5/5 Skeleton.",
        "type": "Hero Power",
        "fr": {
            "name": "Réanimation morbide"
        }
    },
    {
        "cardImage": "FP1_025.png",
        "cost": 2,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Dan Scott",
        "type": "Spell",
        "howToGetGold": "Can be crafted after completing the Shaman Class Challenge in Naxxramas.",
        "fr": {
            "name": "Réincarnation"
        },
        "flavor": "It's like birth, except you're an adult and you were just dead a second ago.",
        "playerClass": "Shaman",
        "name": "Reincarnate",
        "howToGet": "Unlocked by completing the Shaman Class Challenge in Naxxramas.",
        "id": "FP1_025",
        "text": "Destroy a minion, then return it to life with full Health.",
        "rarity": "Common"
    },
    {
        "cardImage": "NAX9_05H.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 2,
        "durability": 3,
        "name": "Runeblade",
        "id": "NAX9_05H",
        "text": "Has +6 Attack if the other Horsemen are dead.",
        "type": "Weapon",
        "fr": {
            "name": "Lame runique"
        }
    },
    {
        "cardImage": "NAX9_05.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 1,
        "durability": 3,
        "name": "Runeblade",
        "id": "NAX9_05",
        "text": "Has +3 Attack if the other Horsemen are dead.",
        "type": "Weapon",
        "fr": {
            "name": "Lame runique"
        }
    },
    {
        "cardImage": "NAX14_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Sapphiron",
        "health": 45,
        "id": "NAX14_01H",
        "type": "Hero",
        "fr": {
            "name": "Saphiron"
        }
    },
    {
        "cardImage": "NAX14_01.png",
        "set": "Curse of Naxxramas",
        "name": "Sapphiron",
        "health": 30,
        "id": "NAX14_01",
        "type": "Hero",
        "fr": {
            "name": "Saphiron"
        }
    },
    {
        "cardImage": "FP1_005.png",
        "cost": 3,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Ittoku Seta",
        "health": 2,
        "mechanics": [
            "Stealth"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Kel'Thuzad in the Frostwyrm Lair.",
        "fr": {
            "name": "Ombre de Naxxramas"
        },
        "flavor": "The Shades of Naxxramas <i>hate</i> the living. They even have a slur they use to refer them: <i>Livers</i>.",
        "attack": 2,
        "name": "Shade of Naxxramas",
        "howToGet": "Unlocked by defeating Kel'Thuzad in the Frostwyrm Lair.",
        "id": "FP1_005",
        "text": "<b>Stealth.</b> At the start of your turn, gain +1/+1.",
        "rarity": "Epic"
    },
    {
        "cardImage": "NAX9_04.png",
        "elite": true,
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 1,
        "name": "Sir Zeliek",
        "health": 7,
        "id": "NAX9_04",
        "text": "Your hero is <b>Immune</b>.",
        "type": "Minion",
        "fr": {
            "name": "Sire Zeliek"
        }
    },
    {
        "cardImage": "NAX9_04H.png",
        "elite": true,
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 2,
        "name": "Sir Zeliek",
        "health": 7,
        "id": "NAX9_04H",
        "text": "Your hero is <b>Immune</b>.",
        "type": "Minion",
        "fr": {
            "name": "Sire Zeliek"
        }
    },
    {
        "cardImage": "NAXM_002.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 4,
        "name": "Skeletal Smith",
        "health": 3,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "NAXM_002",
        "text": "<b>Deathrattle:</b> Destroy your opponent's weapon.",
        "type": "Minion",
        "fr": {
            "name": "Forgeron squelettique"
        }
    },
    {
        "cardImage": "NAX4_03H.png",
        "cost": 5,
        "set": "Curse of Naxxramas",
        "attack": 5,
        "name": "Skeleton",
        "health": 5,
        "id": "NAX4_03H",
        "type": "Minion",
        "fr": {
            "name": "Squelette"
        }
    },
    {
        "cardImage": "NAX4_03.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "attack": 1,
        "name": "Skeleton",
        "health": 1,
        "id": "NAX4_03",
        "type": "Minion",
        "fr": {
            "name": "Squelette"
        }
    },
    {
        "cardImage": "NAX1h_04.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "name": "Skitter",
        "id": "NAX1h_04",
        "text": "<b>Hero Power</b>\nSummon a 4/4 Nerubian.",
        "type": "Hero Power",
        "fr": {
            "name": "Grouillement"
        }
    },
    {
        "cardImage": "NAX1_04.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "name": "Skitter",
        "id": "NAX1_04",
        "text": "<b>Hero Power</b>\nSummon a 3/1 Nerubian.",
        "type": "Hero Power",
        "fr": {
            "name": "Grouillement"
        }
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Slave of Kel'Thuzad",
        "id": "NAX15_04a",
        "text": "MINE!",
        "type": "Enchantment",
        "fr": {
            "name": "Esclave de Kel’Thuzad"
        }
    },
    {
        "cardImage": "FP1_012t.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "attack": 1,
        "name": "Slime",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "id": "FP1_012t",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Gelée"
        }
    },
    {
        "cardImage": "FP1_012.png",
        "cost": 5,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Nate Bowden",
        "health": 5,
        "mechanics": [
            "Deathrattle",
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Loatheb in the Plague Quarter.",
        "fr": {
            "name": "Crache-vase"
        },
        "flavor": "DO NOT GIVE HIM A ROOT BEER.",
        "attack": 3,
        "name": "Sludge Belcher",
        "howToGet": "Unlocked by defeating Loatheb in the Plague Quarter.",
        "id": "FP1_012",
        "text": "<b>Taunt.\nDeathrattle:</b> Summon a 1/2 Slime with <b>Taunt</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "FP1_008.png",
        "cost": 5,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Chris Rahn",
        "health": 6,
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Gothik the Harvester in the Military Quarter.",
        "fr": {
            "name": "Chevalier de la mort spectral"
        },
        "flavor": "What do Faerie Dragons and Spectral Knights have in common?  They both love pasta!",
        "attack": 4,
        "name": "Spectral Knight",
        "howToGet": "Unlocked by defeating Gothik the Harvester in the Military Quarter.",
        "id": "FP1_008",
        "text": "Can't be targeted by spells or Hero Powers.",
        "rarity": "Common"
    },
    {
        "cardImage": "NAX8_05t.png",
        "cost": 5,
        "set": "Curse of Naxxramas",
        "attack": 0,
        "name": "Spectral Rider",
        "health": 6,
        "id": "NAX8_05t",
        "text": "At the start of your turn, deal 1 damage to your hero.",
        "type": "Minion",
        "fr": {
            "name": "Cavalier spectral"
        }
    },
    {
        "cardImage": "FP1_002t.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "attack": 1,
        "name": "Spectral Spider",
        "health": 1,
        "id": "FP1_002t",
        "type": "Minion",
        "fr": {
            "name": "Araignée spectrale"
        }
    },
    {
        "cardImage": "NAX8_03t.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "attack": 0,
        "name": "Spectral Trainee",
        "health": 2,
        "id": "NAX8_03t",
        "text": "At the start of your turn, deal 1 damage to your hero.",
        "type": "Minion",
        "fr": {
            "name": "Jeune recrue spectrale"
        }
    },
    {
        "cardImage": "NAX8_04t.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 0,
        "name": "Spectral Warrior",
        "health": 4,
        "id": "NAX8_04t",
        "text": "At the start of your turn, deal 1 damage to your hero.",
        "type": "Minion",
        "fr": {
            "name": "Guerrier spectral"
        }
    },
    {
        "cardImage": "NAX6_03t.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "attack": 0,
        "name": "Spore",
        "health": 1,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "NAX6_03t",
        "text": "<b>Deathrattle:</b> Give all enemy minions +8 Attack.",
        "type": "Minion",
        "fr": {
            "name": "Spore"
        }
    },
    {
        "cardImage": "NAX6_04.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "name": "Sporeburst",
        "id": "NAX6_04",
        "text": "Deal $1 damage to all enemy minions. Summon a Spore.",
        "type": "Spell",
        "fr": {
            "name": "Explosion de spores"
        }
    },
    {
        "cardImage": "NAX13_05H.png",
        "elite": true,
        "cost": 5,
        "set": "Curse of Naxxramas",
        "attack": 7,
        "name": "Stalagg",
        "health": 4,
        "id": "NAX13_05H",
        "type": "Minion",
        "fr": {
            "name": "Stalagg"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "FP1_014.png",
        "cost": 5,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Dany Orizio",
        "health": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Construct Quarter.",
        "fr": {
            "name": "Stalagg"
        },
        "flavor": "Stalagg want to write own flavor text.  \"STALAGG AWESOME!\"",
        "elite": true,
        "attack": 7,
        "name": "Stalagg",
        "howToGet": "Unlocked by completing the Construct Quarter.",
        "id": "FP1_014",
        "text": "<b>Deathrattle:</b> If Feugen also died this game, summon Thaddius.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "FP1_027.png",
        "cost": 3,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Matt Smith",
        "health": 4,
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Noth the Plaguebringer in the Plague Quarter.",
        "fr": {
            "name": "Gargouille peau-de-pierre"
        },
        "flavor": "Stoneskin Gargoyles love freeze tag.",
        "attack": 1,
        "name": "Stoneskin Gargoyle",
        "howToGet": "Unlocked by defeating Noth the Plaguebringer in the Plague Quarter.",
        "id": "FP1_027",
        "text": "At the start of your turn, restore this minion to full Health.",
        "rarity": "Common"
    },
    {
        "cardImage": "NAX13_03.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "name": "Supercharge",
        "id": "NAX13_03",
        "text": "Give your minions +2 Health.",
        "type": "Spell",
        "fr": {
            "name": "Supercharge"
        }
    },
    {
        "set": "Curse of Naxxramas",
        "name": "Supercharged",
        "id": "NAX13_03e",
        "text": "+2 Health.",
        "type": "Enchantment",
        "fr": {
            "name": "État de supercharge"
        }
    },
    {
        "cardImage": "NAX13_01H.png",
        "set": "Curse of Naxxramas",
        "name": "Thaddius",
        "health": 45,
        "id": "NAX13_01H",
        "type": "Hero",
        "fr": {
            "name": "Thaddius"
        }
    },
    {
        "cardImage": "NAX13_01.png",
        "set": "Curse of Naxxramas",
        "name": "Thaddius",
        "health": 30,
        "id": "NAX13_01",
        "type": "Hero",
        "fr": {
            "name": "Thaddius"
        }
    },
    {
        "cardImage": "FP1_014t.png",
        "elite": true,
        "cost": 10,
        "set": "Curse of Naxxramas",
        "attack": 11,
        "name": "Thaddius",
        "health": 11,
        "id": "FP1_014t",
        "type": "Minion",
        "fr": {
            "name": "Thaddius"
        },
        "rarity": "Legendary"
    },
    {
        "cardImage": "NAX9_03H.png",
        "elite": true,
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 2,
        "name": "Thane Korth'azz",
        "health": 7,
        "id": "NAX9_03H",
        "text": "Your hero is <b>Immune</b>.",
        "type": "Minion",
        "fr": {
            "name": "Thane Korth’azz"
        }
    },
    {
        "cardImage": "NAX9_03.png",
        "elite": true,
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 1,
        "name": "Thane Korth'azz",
        "health": 7,
        "id": "NAX9_03",
        "text": "Your hero is <b>Immune</b>.",
        "type": "Minion",
        "fr": {
            "name": "Thane Korth’azz"
        }
    },
    {
        "cardImage": "FP1_019t.png",
        "playerClass": "Druid",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "attack": 2,
        "name": "Treant",
        "health": 2,
        "id": "FP1_019t",
        "type": "Minion",
        "fr": {
            "name": "Tréant"
        }
    },
    {
        "cardImage": "NAX7_03.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "name": "Unbalancing Strike",
        "id": "NAX7_03",
        "text": "<b>Hero Power</b>\nDeal 3 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Frappe déséquilibrante"
        }
    },
    {
        "cardImage": "NAX7_03H.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "name": "Unbalancing Strike",
        "id": "NAX7_03H",
        "text": "<b>Hero Power</b>\nDeal 4 damage.",
        "type": "Hero Power",
        "fr": {
            "name": "Frappe déséquilibrante"
        }
    },
    {
        "cardImage": "NAX7_02.png",
        "cost": 2,
        "set": "Curse of Naxxramas",
        "attack": 0,
        "name": "Understudy",
        "health": 7,
        "mechanics": [
            "Taunt"
        ],
        "id": "NAX7_02",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Doublure"
        }
    },
    {
        "cardImage": "FP1_028.png",
        "cost": 1,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Jonboy Meyers",
        "health": 2,
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Patchwerk in the Construct Quarter.",
        "fr": {
            "name": "Fossoyeur"
        },
        "flavor": "In a world where you can run to a spirit healer and resurrect yourself, Undertakers do pretty light business.",
        "attack": 1,
        "name": "Undertaker",
        "howToGet": "Unlocked by defeating Patchwerk in the Construct Quarter.",
        "id": "FP1_028",
        "text": "Whenever you summon a minion with <b>Deathrattle</b>, gain +1 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "NAX9_06.png",
        "cost": 5,
        "set": "Curse of Naxxramas",
        "name": "Unholy Shadow",
        "id": "NAX9_06",
        "text": "<b>Hero Power</b>\nDraw 2 cards.",
        "type": "Hero Power",
        "fr": {
            "name": "Ombre impie"
        }
    },
    {
        "cardImage": "NAX8_05.png",
        "cost": 6,
        "set": "Curse of Naxxramas",
        "attack": 5,
        "name": "Unrelenting Rider",
        "health": 6,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "NAX8_05",
        "text": "<b>Deathrattle:</b> Summon a Spectral Rider for your opponent.",
        "type": "Minion",
        "fr": {
            "name": "Cavalier tenace"
        }
    },
    {
        "cardImage": "NAX8_03.png",
        "cost": 1,
        "set": "Curse of Naxxramas",
        "attack": 2,
        "name": "Unrelenting Trainee",
        "health": 2,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "NAX8_03",
        "text": "<b>Deathrattle:</b> Summon a Spectral Trainee for your opponent.",
        "type": "Minion",
        "fr": {
            "name": "Jeune recrue tenace"
        }
    },
    {
        "cardImage": "NAX8_04.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 3,
        "name": "Unrelenting Warrior",
        "health": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "NAX8_04",
        "text": "<b>Deathrattle:</b> Summon a Spectral Warrior for your opponent.",
        "type": "Minion",
        "fr": {
            "name": "Guerrier tenace"
        }
    },
    {
        "cardImage": "FP1_024.png",
        "cost": 2,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Mike Nicholson",
        "health": 3,
        "mechanics": [
            "Deathrattle",
            "Taunt"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Heigan the Unclean in the Plague Quarter.",
        "fr": {
            "name": "Goule instable"
        },
        "flavor": "Filling your Ghouls with Rocket Fuel is all the rage at Necromancer school.",
        "attack": 1,
        "name": "Unstable Ghoul",
        "howToGet": "Unlocked by defeating Heigan the Unclean in the Plague Quarter.",
        "id": "FP1_024",
        "text": "<b>Taunt</b>. <b>Deathrattle:</b> Deal 1 damage to all minions.",
        "rarity": "Common"
    },
    {
        "playerClass": "Paladin",
        "set": "Curse of Naxxramas",
        "name": "Vengeance",
        "id": "FP1_020e",
        "text": "+3/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Vengeance"
        }
    },
    {
        "cardImage": "FP1_022.png",
        "cost": 4,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "race": "Demon",
        "artist": "Robb Shoberg",
        "health": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Warlock Class Challenge in Naxxramas.",
        "fr": {
            "name": "Implorateur du Vide"
        },
        "flavor": "\"Void!  Here, void!  Here, buddy!\"",
        "playerClass": "Warlock",
        "attack": 3,
        "name": "Voidcaller",
        "howToGet": "Unlocked by completing the Warlock Class Challenge in Naxxramas.",
        "id": "FP1_022",
        "text": "<b>Deathrattle:</b> Put a random Demon from your hand into the battlefield.",
        "rarity": "Common"
    },
    {
        "cardImage": "FP1_016.png",
        "cost": 4,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "Glenn Rane",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Thaddius in the Construct Quarter.",
        "fr": {
            "name": "Âme gémissante"
        },
        "flavor": "This soul just <i>wails</i> on you. Dang, soul, let up already.",
        "attack": 3,
        "name": "Wailing Soul",
        "howToGet": "Unlocked by defeating Thaddius in the Construct Quarter.",
        "id": "FP1_016",
        "text": "<b>Battlecry: Silence</b> your other minions.",
        "rarity": "Rare"
    },
    {
        "cardImage": "NAX3_02.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "name": "Web Wrap",
        "id": "NAX3_02",
        "text": "<b>Hero Power</b>\nReturn a random enemy minion to your opponent's hand.",
        "type": "Hero Power",
        "fr": {
            "name": "Entoilage"
        }
    },
    {
        "cardImage": "NAX3_02H.png",
        "cost": 0,
        "set": "Curse of Naxxramas",
        "name": "Web Wrap",
        "id": "NAX3_02H",
        "text": "<b>Hero Power</b>\nReturn 2 random enemy minions to your opponent's hand.",
        "type": "Hero Power",
        "fr": {
            "name": "Entoilage"
        }
    },
    {
        "cardImage": "FP1_011.png",
        "cost": 1,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "race": "Beast",
        "artist": "Dan Brereton",
        "health": 1,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after completing the Hunter Class Challenge in Naxxramas.",
        "fr": {
            "name": "Tisseuse"
        },
        "flavor": "Spider cocoons are like little piñatas!",
        "playerClass": "Hunter",
        "attack": 1,
        "name": "Webspinner",
        "howToGet": "Unlocked by completing the Hunter Class Challenge in Naxxramas.",
        "id": "FP1_011",
        "text": "<b>Deathrattle:</b> Add a random Beast card to your hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "NAX2_05.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 1,
        "name": "Worshipper",
        "health": 4,
        "mechanics": [
            "Aura"
        ],
        "id": "NAX2_05",
        "text": "Your hero has +1 Attack on your turn.",
        "type": "Minion",
        "fr": {
            "name": "Adorateur"
        }
    },
    {
        "cardImage": "NAX2_05H.png",
        "cost": 3,
        "set": "Curse of Naxxramas",
        "attack": 2,
        "name": "Worshipper",
        "health": 4,
        "mechanics": [
            "Aura"
        ],
        "id": "NAX2_05H",
        "text": "Your hero has +3 Attack on your turn.",
        "type": "Minion",
        "fr": {
            "name": "Adorateur"
        }
    },
    {
        "cardImage": "FP1_001.png",
        "cost": 1,
        "collectible": true,
        "set": "Curse of Naxxramas",
        "artist": "E. M. Gist",
        "health": 3,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "howToGetGold": "Can be crafted after defeating Gluth in the Construct Quarter.",
        "fr": {
            "name": "Croq’zombie"
        },
        "flavor": "Zombie.  It's what's for dinner.",
        "attack": 2,
        "name": "Zombie Chow",
        "howToGet": "Unlocked by defeating Gluth in the Construct Quarter.",
        "id": "FP1_001",
        "text": "<b>Deathrattle:</b> Restore 5 Health to the enemy hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_048.png",
        "cost": 0,
        "set": "Debug",
        "name": "-1 Durability",
        "id": "XXX_048",
        "text": "Give a player's weapon -1 Durability.",
        "type": "Spell",
        "fr": {
            "name": "-1 Durability"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_055.png",
        "cost": 0,
        "set": "Debug",
        "name": "1000 Stats",
        "id": "XXX_055",
        "text": "Give a Minion +1000/+1000",
        "type": "Spell",
        "fr": {
            "name": "1000 Stats"
        }
    },
    {
        "set": "Debug",
        "name": "1000 Stats Enchant",
        "id": "XXX_055e",
        "type": "Enchantment",
        "fr": {
            "name": "1000 Stats Enchant"
        }
    },
    {
        "cardImage": "XXX_095.png",
        "cost": 0,
        "set": "Debug",
        "attack": 1,
        "name": "AI Buddy - All Charge!",
        "health": 1,
        "id": "XXX_095",
        "text": "Spawn into play to give all minions <b>Charge</b>.",
        "type": "Minion",
        "fr": {
            "name": "AI Buddy - All Charge!"
        }
    },
    {
        "cost": 0,
        "set": "Debug",
        "attack": 1,
        "name": "AI Buddy - Blank Slate",
        "health": 1,
        "id": "XXX_094",
        "text": "Spawn into play to clear the entire board, both hands, both decks, all mana and all secrets.",
        "type": "Minion",
        "fr": {
            "name": "AI Buddy - Blank Slate"
        }
    },
    {
        "cardImage": "XXX_096.png",
        "cost": 0,
        "set": "Debug",
        "attack": 1,
        "name": "AI Buddy - Damage Own Hero 5",
        "health": 1,
        "id": "XXX_096",
        "text": "Spawn into play to smack your own hero for 5.",
        "type": "Minion",
        "fr": {
            "name": "AI Buddy - Damage Own Hero 5"
        }
    },
    {
        "cardImage": "XXX_097.png",
        "cost": 0,
        "set": "Debug",
        "attack": 1,
        "durability": 0,
        "name": "AI Buddy - Destroy Minions",
        "health": 1,
        "id": "XXX_097",
        "text": "Spawn into play to destroy all minions.",
        "type": "Minion",
        "fr": {
            "name": "AI Buddy - Destroy Minions"
        }
    },
    {
        "cardImage": "XXX_098.png",
        "cost": 0,
        "set": "Debug",
        "attack": 1,
        "durability": 0,
        "name": "AI Buddy - No Deck/Hand",
        "health": 1,
        "id": "XXX_098",
        "text": "Spawn into play to destroy the AI's Hand and Deck.",
        "type": "Minion",
        "fr": {
            "name": "AI Buddy - No Deck/Hand"
        }
    },
    {
        "cardImage": "XXX_099.png",
        "elite": false,
        "cost": 0,
        "set": "Debug",
        "attack": 1,
        "durability": 0,
        "name": "AI Helper Buddy",
        "health": 1,
        "id": "XXX_099",
        "text": "Get the AI ready for testing.",
        "type": "Minion",
        "fr": {
            "name": "AI Helper Buddy"
        }
    },
    {
        "cost": 0,
        "set": "Debug",
        "name": "Armor 1",
        "id": "XXX_061",
        "text": "Give target Hero +1 Armor",
        "type": "Spell",
        "fr": {
            "name": "Armor 1"
        }
    },
    {
        "cardImage": "XXX_053.png",
        "cost": 0,
        "set": "Debug",
        "name": "Armor 100",
        "id": "XXX_053",
        "text": "Give target Hero +100 Armor",
        "type": "Spell",
        "fr": {
            "name": "Armor 100"
        }
    },
    {
        "cost": 0,
        "set": "Debug",
        "name": "Armor 5",
        "id": "XXX_062",
        "text": "Give target Hero +5 Armor",
        "type": "Spell",
        "fr": {
            "name": "Armor 5"
        }
    },
    {
        "cardImage": "XXX_039.png",
        "cost": 0,
        "set": "Debug",
        "name": "Become Hogger",
        "id": "XXX_039",
        "text": "Become Hogger for Video Recording.",
        "type": "Spell",
        "fr": {
            "name": "Become Hogger"
        }
    },
    {
        "cardImage": "XXX_012.png",
        "cost": 0,
        "set": "Debug",
        "name": "Bounce",
        "id": "XXX_012",
        "text": "Return a minion to its owner's hand.",
        "type": "Spell",
        "fr": {
            "name": "Bounce"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_006.png",
        "cost": 0,
        "set": "Debug",
        "name": "Break Weapon",
        "id": "XXX_006",
        "text": "Destroy a hero's weapon.",
        "type": "Spell",
        "fr": {
            "name": "Break Weapon"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_015.png",
        "cost": 0,
        "set": "Debug",
        "name": "Crash",
        "id": "XXX_015",
        "text": "Crash the game.",
        "type": "Spell",
        "fr": {
            "name": "Crash"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_001.png",
        "cost": 0,
        "set": "Debug",
        "name": "Damage 1",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "XXX_001",
        "text": "Deal 1 damage.",
        "type": "Spell",
        "fr": {
            "name": "Damage 1"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_002.png",
        "cost": 0,
        "set": "Debug",
        "name": "Damage 5",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "XXX_002",
        "text": "Deal 5 damage.",
        "type": "Spell",
        "fr": {
            "name": "Damage 5"
        },
        "rarity": "Common"
    },
    {
        "cost": 0,
        "set": "Debug",
        "name": "Damage All",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "XXX_060",
        "text": "Set the Health of a character to 0.",
        "type": "Spell",
        "fr": {
            "name": "Damage All"
        }
    },
    {
        "cardImage": "XXX_020.png",
        "cost": 0,
        "set": "Debug",
        "name": "Damage all but 1",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "XXX_020",
        "text": "Set the Health of a character to 1.",
        "type": "Spell",
        "fr": {
            "name": "Damage all but 1"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_024.png",
        "cost": 0,
        "set": "Debug",
        "attack": 3,
        "name": "Damage Reflector",
        "health": 10,
        "id": "XXX_024",
        "text": "Whenever this minion takes damage, deal 1 damage to ALL other characters.",
        "type": "Minion",
        "fr": {
            "name": "Damage Reflector"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_005.png",
        "cost": 0,
        "set": "Debug",
        "name": "Destroy",
        "id": "XXX_005",
        "text": "Destroy a minion or hero.",
        "type": "Spell",
        "fr": {
            "name": "Destroy"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_050.png",
        "cost": 0,
        "set": "Debug",
        "name": "Destroy a Mana Crystal",
        "id": "XXX_050",
        "text": "Pick a player and destroy one of his Mana Crystals.",
        "type": "Spell",
        "fr": {
            "name": "Destroy a Mana Crystal"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_023.png",
        "cost": 0,
        "set": "Debug",
        "name": "Destroy All Heroes",
        "id": "XXX_023",
        "text": "Destroy all heroes.",
        "type": "Spell",
        "fr": {
            "name": "Destroy All Heroes"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_049.png",
        "cost": 0,
        "set": "Debug",
        "name": "Destroy all Mana",
        "id": "XXX_049",
        "text": "Destroy all of a player's Mana Crystals.",
        "type": "Spell",
        "fr": {
            "name": "Destroy all Mana"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_018.png",
        "cost": 0,
        "set": "Debug",
        "name": "Destroy All Minions",
        "id": "XXX_018",
        "text": "Destroy all minions.",
        "type": "Spell",
        "fr": {
            "name": "Destroy All Minions"
        },
        "rarity": "Common"
    },
    {
        "cost": 0,
        "set": "Debug",
        "name": "Destroy ALL Secrets",
        "id": "XXX_063",
        "text": "Destroy all <b>Secrets:</b>.",
        "type": "Spell",
        "fr": {
            "name": "Destroy ALL Secrets"
        }
    },
    {
        "cardImage": "XXX_047.png",
        "cost": 0,
        "set": "Debug",
        "name": "Destroy Deck",
        "id": "XXX_047",
        "text": "Delete an opponent's deck",
        "type": "Spell",
        "fr": {
            "name": "Destroy Deck"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_041.png",
        "cost": 0,
        "set": "Debug",
        "name": "Destroy Hero Power",
        "id": "XXX_041",
        "text": "Destroy a player's Hero Power.",
        "type": "Spell",
        "fr": {
            "name": "Destroy Hero Power"
        },
        "rarity": "Common"
    },
    {
        "cost": 0,
        "set": "Debug",
        "name": "Destroy Hero's Stuff",
        "id": "XXX_059",
        "text": "Destroy target hero's hero power, weapon, deck, hand, minions, and secrets.",
        "type": "Spell",
        "fr": {
            "name": "Destroy Hero's Stuff"
        }
    },
    {
        "cardImage": "XXX_057.png",
        "cost": 0,
        "set": "Debug",
        "name": "Destroy Target Secrets",
        "id": "XXX_057",
        "text": "Choose a hero. Destroy all <b>Secrets</b> controlled by that hero.",
        "type": "Spell",
        "fr": {
            "name": "Destroy Target Secrets"
        }
    },
    {
        "cardImage": "XXX_013.png",
        "cost": 0,
        "set": "Debug",
        "name": "Discard",
        "id": "XXX_013",
        "text": "Choose a hero.  That hero's controller discards his hand.",
        "type": "Spell",
        "fr": {
            "name": "Discard"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_025.png",
        "cost": 0,
        "set": "Debug",
        "name": "Do Nothing",
        "id": "XXX_025",
        "text": "This does nothing.",
        "type": "Spell",
        "fr": {
            "name": "Do Nothing"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_017.png",
        "cost": 0,
        "set": "Debug",
        "name": "Draw 3 Cards",
        "id": "XXX_017",
        "text": "Draw 3 cards.",
        "type": "Spell",
        "fr": {
            "name": "Draw 3 Cards"
        },
        "rarity": "Common"
    },
    {
        "set": "Debug",
        "name": "Empty Enchant",
        "id": "XXX_009e",
        "text": "This enchantment does nothing.",
        "type": "Enchantment",
        "fr": {
            "name": "Empty Enchant"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_026.png",
        "cost": 0,
        "set": "Debug",
        "name": "Enable Emotes",
        "id": "XXX_026",
        "text": "Enable emotes for your VS.AI game. (not in tutorials, though)",
        "type": "Spell",
        "fr": {
            "name": "Enable Emotes"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_007.png",
        "cost": 0,
        "set": "Debug",
        "name": "Enable for Attack",
        "id": "XXX_007",
        "text": "Give a character Charge and make him able to attack!",
        "type": "Spell",
        "fr": {
            "name": "Enable for Attack"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_009.png",
        "cost": 0,
        "set": "Debug",
        "name": "Enchant",
        "id": "XXX_009",
        "text": "Enchant a minion with an empty enchant.",
        "type": "Spell",
        "fr": {
            "name": "Enchant"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_046.png",
        "cost": 0,
        "set": "Debug",
        "name": "Force AI to Use Hero Power",
        "id": "XXX_046",
        "text": "Force the AI to use their Hero Power every turn from now on.",
        "type": "Spell",
        "fr": {
            "name": "Force AI to Use Hero Power"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_022.png",
        "cost": 0,
        "set": "Debug",
        "name": "Free Cards",
        "id": "XXX_022",
        "text": "Your cards cost (0) for the rest of the game.",
        "type": "Spell",
        "fr": {
            "name": "Free Cards"
        },
        "rarity": "Common"
    },
    {
        "set": "Debug",
        "name": "Free Cards",
        "id": "XXX_022e",
        "text": "Your cards cost (0) for the rest of the game.",
        "type": "Enchantment",
        "fr": {
            "name": "Free Cards"
        }
    },
    {
        "cardImage": "XXX_008.png",
        "cost": 0,
        "set": "Debug",
        "name": "Freeze",
        "mechanics": [
            "Freeze"
        ],
        "id": "XXX_008",
        "text": "<b>Freeze</b> a character.",
        "type": "Spell",
        "fr": {
            "name": "Freeze"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_052.png",
        "cost": 0,
        "set": "Debug",
        "name": "Grant Mega-Windfury",
        "id": "XXX_052",
        "text": "Give a minion <b>Mega-Windfury</b>.",
        "type": "Spell",
        "fr": {
            "name": "Grant Mega-Windfury"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_044.png",
        "cost": 0,
        "set": "Debug",
        "attack": 5,
        "name": "Hand Swapper Minion",
        "health": 5,
        "id": "XXX_044",
        "text": "<b>Battlecry:</b> Discard 3 cards, then draw 3 cards.",
        "type": "Minion",
        "fr": {
            "name": "Hand Swapper Minion"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_042.png",
        "cost": 0,
        "set": "Debug",
        "name": "Hand to Deck",
        "id": "XXX_042",
        "text": "Shuffle a player's hand into his deck.",
        "type": "Spell",
        "fr": {
            "name": "Hand to Deck"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_040.png",
        "playerClass": "Warrior",
        "set": "Debug",
        "name": "Hogger",
        "health": 10,
        "id": "XXX_040",
        "type": "Hero",
        "fr": {
            "name": "Hogger"
        }
    },
    {
        "cardImage": "XXX_051.png",
        "cost": 0,
        "set": "Debug",
        "name": "Make Immune",
        "id": "XXX_051",
        "text": "Permanently make a character <b>Immune</b>.",
        "type": "Spell",
        "fr": {
            "name": "Make Immune"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_014.png",
        "cost": 0,
        "set": "Debug",
        "name": "Mill 10",
        "id": "XXX_014",
        "text": "Put 10 cards from a hero's deck into his graveyard.",
        "type": "Spell",
        "fr": {
            "name": "Mill 10"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_043.png",
        "cost": 0,
        "set": "Debug",
        "name": "Mill 30",
        "id": "XXX_043",
        "text": "Put 30 cards from a hero's deck into his graveyard.",
        "type": "Spell",
        "fr": {
            "name": "Mill 30"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_019.png",
        "set": "Debug",
        "name": "Molasses",
        "id": "XXX_019",
        "text": "You can take as long as you want on your turn.",
        "type": "Spell",
        "fr": {
            "name": "Molasses"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_029.png",
        "cost": 0,
        "set": "Debug",
        "name": "Opponent Concede",
        "id": "XXX_029",
        "text": "Force your opponent to concede.",
        "type": "Spell",
        "fr": {
            "name": "Opponent Concede"
        }
    },
    {
        "cardImage": "XXX_030.png",
        "cost": 0,
        "set": "Debug",
        "name": "Opponent Disconnect",
        "id": "XXX_030",
        "text": "Force your opponnet to disconnect.",
        "type": "Spell",
        "fr": {
            "name": "Opponent Disconnect"
        },
        "rarity": "Common"
    },
    {
        "cost": 0,
        "set": "Debug",
        "name": "Remove All Immune",
        "id": "XXX_065",
        "text": "Remove <b>Immune</b> from enemy hero",
        "type": "Spell",
        "fr": {
            "name": "Remove All Immune"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_003.png",
        "cost": 0,
        "set": "Debug",
        "name": "Restore 1",
        "id": "XXX_003",
        "text": "Restore 1 Health to a character.",
        "type": "Spell",
        "fr": {
            "name": "Restore 1"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_004.png",
        "cost": 0,
        "set": "Debug",
        "name": "Restore 5",
        "id": "XXX_004",
        "text": "Restore 5 Health to a character.",
        "type": "Spell",
        "fr": {
            "name": "Restore 5"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_021.png",
        "cost": 0,
        "set": "Debug",
        "name": "Restore All Health",
        "id": "XXX_021",
        "text": "Restore all Health to a character.",
        "type": "Spell",
        "fr": {
            "name": "Restore All Health"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_028.png",
        "set": "Debug",
        "name": "Reveal Hand",
        "id": "XXX_028",
        "type": "Spell",
        "fr": {
            "name": "Reveal Hand"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_027.png",
        "set": "Debug",
        "name": "Server Crash",
        "id": "XXX_027",
        "text": "Crash the Server.  DON'T BE A FOOL.",
        "type": "Spell",
        "fr": {
            "name": "Server Crash"
        }
    },
    {
        "cardImage": "XXX_010.png",
        "cost": 0,
        "set": "Debug",
        "name": "Silence - debug",
        "id": "XXX_010",
        "text": "Remove all enchantments and powers from a minion.",
        "type": "Spell",
        "fr": {
            "name": "Silence - debug"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_056.png",
        "cost": 0,
        "set": "Debug",
        "name": "Silence and Destroy All Minions",
        "id": "XXX_056",
        "text": "Destroy all minions without triggering deathrattles.",
        "type": "Spell",
        "fr": {
            "name": "Silence and Destroy All Minions"
        }
    },
    {
        "cardImage": "XXX_016.png",
        "cost": 0,
        "set": "Debug",
        "name": "Snake Ball",
        "id": "XXX_016",
        "text": "Summon five 1/1 snakes.",
        "type": "Spell",
        "fr": {
            "name": "Snake Ball"
        }
    },
    {
        "cardImage": "XXX_045.png",
        "cost": 0,
        "set": "Debug",
        "name": "Steal Card",
        "id": "XXX_045",
        "text": "Steal a random card from your opponent.",
        "type": "Spell",
        "fr": {
            "name": "Steal Card"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_011.png",
        "cost": 0,
        "set": "Debug",
        "name": "Summon a random Secret",
        "id": "XXX_011",
        "text": "Summon a secret from your deck.",
        "type": "Spell",
        "fr": {
            "name": "Summon a random Secret"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "XXX_054.png",
        "cost": 0,
        "set": "Debug",
        "name": "Weapon Buff",
        "id": "XXX_054",
        "text": "Give your Weapon +100/+100",
        "type": "Spell",
        "fr": {
            "name": "Weapon Buff"
        }
    },
    {
        "set": "Debug",
        "name": "Weapon Buff Enchant",
        "id": "XXX_054e",
        "type": "Enchantment",
        "fr": {
            "name": "Weapon Buff Enchant"
        }
    },
    {
        "cost": 0,
        "set": "Debug",
        "name": "Weapon Nerf",
        "id": "XXX_058",
        "text": "Give a weapon a negative enchantment.",
        "type": "Spell",
        "fr": {
            "name": "Weapon Nerf"
        },
        "rarity": "Common"
    },
    {
        "set": "Debug",
        "name": "Weapon Nerf Enchant",
        "id": "XXX_058e",
        "text": "Red Sparkles!",
        "type": "Enchantment",
        "fr": {
            "name": "Weapon Nerf Enchant"
        }
    },
    {
        "cardImage": "GVG_029.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Dan Scott",
        "type": "Spell",
        "fr": {
            "name": "Appel des ancêtres"
        },
        "flavor": "\"Hey! Ancestors!\" - Ancestor's call",
        "playerClass": "Shaman",
        "name": "Ancestor's Call",
        "id": "GVG_029",
        "text": "Put a random minion from each player's hand into the battlefield.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_077.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Josh Harris",
        "health": 9,
        "type": "Minion",
        "fr": {
            "name": "Golem d’anima"
        },
        "flavor": "The Dark Animus is evil and mysterious and huge and unable to write sentences that utilize proper grammar.",
        "playerClass": "Warlock",
        "attack": 9,
        "name": "Anima Golem",
        "id": "GVG_077",
        "text": "At the end of each turn, destroy this minion if it's your only one.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_085.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Matt Dixon",
        "health": 2,
        "mechanics": [
            "Divine Shield",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Ennuy-o-tron"
        },
        "flavor": "The inventor of the Annoy-o-Tron was immediately expelled from Tinkerschool, Tinkertown, and was eventually exiled from the Eastern Kingdoms altogether.",
        "attack": 1,
        "name": "Annoy-o-Tron",
        "id": "GVG_085",
        "text": "<b>Taunt</b>\n<b>Divine Shield</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_030.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Eva Widermann",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Ourson robot anodisé"
        },
        "flavor": "It's adorable! AND OH MY GOODNESS WHY IS IT EATING MY FACE",
        "playerClass": "Druid",
        "elite": false,
        "attack": 2,
        "name": "Anodized Robo Cub",
        "id": "GVG_030",
        "text": "<b>Taunt</b>. <b>Choose One -</b>\n+1 Attack; or +1 Health.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_069.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Jesper Ejsing",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Robot de soins antique"
        },
        "flavor": "They don't make 'em like they used to! (Because of explosions, mostly.)",
        "attack": 3,
        "name": "Antique Healbot",
        "id": "GVG_069",
        "text": "<b>Battlecry:</b> Restore 8 Health to your hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_091.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Zero Yue",
        "health": 5,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Annulateur d’Arcane X-21"
        },
        "flavor": "There was some hard talk between gnome magi and engineers about inventing this mech.",
        "attack": 2,
        "name": "Arcane Nullifier X-21",
        "id": "GVG_091",
        "text": "<b>Taunt</b>\nCan't be targeted by spells or Hero Powers.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Warrior",
        "set": "Goblins vs Gnomes",
        "name": "Armor Plated",
        "id": "GVG_086e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Armure en plaques"
        }
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Armor Plating",
        "id": "PART_001e",
        "text": "+1 Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Plaque d’armure"
        }
    },
    {
        "cardImage": "PART_001.png",
        "cost": 1,
        "set": "Goblins vs Gnomes",
        "artist": "Nutchapol Thitinunthakorn",
        "name": "Armor Plating",
        "id": "PART_001",
        "text": "Give a minion +1 Health.",
        "type": "Spell",
        "fr": {
            "name": "Plaque d’armure"
        }
    },
    {
        "cardImage": "GVG_030a.png",
        "playerClass": "Druid",
        "set": "Goblins vs Gnomes",
        "name": "Attack Mode",
        "id": "GVG_030a",
        "text": "+1 Attack.",
        "type": "Spell",
        "fr": {
            "name": "Mode Attaque"
        }
    },
    {
        "playerClass": "Druid",
        "set": "Goblins vs Gnomes",
        "name": "Attack Mode",
        "id": "GVG_030ae",
        "text": "+1 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Mode Attaque"
        }
    },
    {
        "cardImage": "GVG_119.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Jomaro Kindred",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Bling-o-tron 3000"
        },
        "flavor": "PREPARE PARTY SERVOS FOR IMMEDIATE DEPLOYMENT.",
        "elite": true,
        "attack": 3,
        "name": "Blingtron 3000",
        "id": "GVG_119",
        "text": "<b>Battlecry:</b> Equip a random weapon for each player.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_063.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Tooth",
        "health": 7,
        "type": "Minion",
        "fr": {
            "name": "Bolvar Fordragon"
        },
        "flavor": "Spoiler alert: Bolvar gets melted and then sits on an ice throne and everyone forgets about him.",
        "playerClass": "Paladin",
        "elite": true,
        "attack": 1,
        "name": "Bolvar Fordragon",
        "id": "GVG_063",
        "text": "Whenever a friendly minion dies while this is in your hand, gain +1 Attack.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_099.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Luca Zontini",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Lobe-Bombe"
        },
        "flavor": "He lobbies Orgrimmar daily on behalf of bombs.",
        "attack": 3,
        "name": "Bomb Lobber",
        "id": "GVG_099",
        "text": "<b>Battlecry:</b> Deal 4 damage to a random enemy minion.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_110t.png",
        "cost": 1,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "attack": 1,
        "name": "Boom Bot",
        "health": 1,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "GVG_110t",
        "text": "<b>Deathrattle</b>: Deal 1-4 damage to a random enemy.",
        "type": "Minion",
        "fr": {
            "name": "Ro’Boum"
        }
    },
    {
        "cardImage": "GVG_050.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Andrew Hou",
        "type": "Spell",
        "fr": {
            "name": "Lame rebondissante"
        },
        "flavor": "Only goblins would think this was a good idea. Even they are starting to have their doubts.",
        "playerClass": "Warrior",
        "name": "Bouncing Blade",
        "id": "GVG_050",
        "text": "Deal $1 damage to a random minion. Repeat until a minion dies.",
        "rarity": "Epic"
    },
    {
        "playerClass": "Warlock",
        "set": "Goblins vs Gnomes",
        "name": "Brow Furrow",
        "id": "GVG_100e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Sourcils froncés"
        }
    },
    {
        "cardImage": "GVG_068.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Aleksi Briclot",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Trogg mâcheroc mastoc"
        },
        "flavor": "He's burly because he does CrossFit.",
        "attack": 3,
        "name": "Burly Rockjaw Trogg",
        "id": "GVG_068",
        "text": "Whenever your opponent casts a spell, gain +2 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_056t.png",
        "playerClass": "Warrior",
        "cost": 0,
        "set": "Goblins vs Gnomes",
        "artist": "Chris Seaman",
        "name": "Burrowing Mine",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "GVG_056t",
        "text": "When you draw this, it explodes. You take 10 damage and draw a card.",
        "type": "Spell",
        "fr": {
            "name": "Mine enfouie"
        }
    },
    {
        "cardImage": "GVG_017.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "E.M. Gist",
        "type": "Spell",
        "fr": {
            "name": "Appel du familier"
        },
        "flavor": "Real hunters tame hungry crabs.",
        "playerClass": "Hunter",
        "name": "Call Pet",
        "id": "GVG_017",
        "text": "Draw a card.\nIf it's a Beast, it costs (4) less.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_092t.png",
        "cost": 1,
        "set": "Goblins vs Gnomes",
        "race": "Beast",
        "attack": 1,
        "name": "Chicken",
        "health": 1,
        "id": "GVG_092t",
        "type": "Minion",
        "fr": {
            "name": "Poulet"
        }
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Cloaked",
        "id": "PART_004e",
        "text": "Stealthed until your next turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Camouflé"
        }
    },
    {
        "cardImage": "GVG_121.png",
        "cost": 12,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Dan Scott",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Géant mécanique"
        },
        "flavor": "He and Mountain Giant don't get along.",
        "attack": 8,
        "name": "Clockwork Giant",
        "id": "GVG_121",
        "text": "Costs (1) less for each card in your opponent's hand.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_082.png",
        "cost": 1,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Matt Dixon",
        "health": 1,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Gnome mécanique"
        },
        "flavor": "Clockwork gnomes are always asking what time it is.",
        "attack": 2,
        "name": "Clockwork Gnome",
        "id": "GVG_082",
        "text": "<b>Deathrattle:</b> Add a <b>Spare Part</b> card to your hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_062.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Jim Nelson",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Gardien de cobalt"
        },
        "flavor": "Guardians used to be built out of Adamantium, but production got moved to Gadgetzan and Cobalt was cheap.",
        "playerClass": "Paladin",
        "attack": 6,
        "name": "Cobalt Guardian",
        "id": "GVG_062",
        "text": "Whenever you summon a Mech, gain <b>Divine Shield</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_073.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Howard Lyon",
        "type": "Spell",
        "fr": {
            "name": "Tir du cobra"
        },
        "flavor": "\"Cobra Shot\" hurts way, way, way more than \"Cobra Cuddle.\"",
        "playerClass": "Hunter",
        "name": "Cobra Shot",
        "id": "GVG_073",
        "text": "Deal $3 damage to a minion and the enemy hero.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_059.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Dany Orizio",
        "durability": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Weapon",
        "fr": {
            "name": "Rouage-marteau"
        },
        "flavor": "So you ripped this out of a machine, carved some runes on it, stuck it on a handle, and now it's a weapon of great divine power? Seems legit.",
        "playerClass": "Paladin",
        "attack": 2,
        "name": "Coghammer",
        "id": "GVG_059",
        "text": "<b>Battlecry:</b> Give a random friendly minion <b>Divine Shield</b> and <b>Taunt</b>.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_013.png",
        "cost": 1,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Trent Kaniuga",
        "health": 2,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Maître des rouages"
        },
        "flavor": "After a while, you don't see the cogs and sprockets. All you see is a robot, a spider tank, a deathray...",
        "attack": 1,
        "name": "Cogmaster",
        "id": "GVG_013",
        "text": "Has +2 Attack while you have a Mech.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_024.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Richard Wright",
        "durability": 3,
        "mechanics": [
            "Aura"
        ],
        "type": "Weapon",
        "fr": {
            "name": "Clé de maître des rouages"
        },
        "flavor": "For tightening cogs and smashin' troggs!",
        "playerClass": "Rogue",
        "attack": 1,
        "name": "Cogmaster's Wrench",
        "id": "GVG_024",
        "text": "Has +2 Attack while you have a Mech.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_038.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Warren Mahy",
        "mechanics": [
            "Overload"
        ],
        "type": "Spell",
        "fr": {
            "name": "Crépitement"
        },
        "flavor": "Snap! This card! Pop!",
        "playerClass": "Shaman",
        "name": "Crackle",
        "id": "GVG_038",
        "text": "Deal $3-$6 damage. <b>Overload:</b> (1)",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_052.png",
        "cost": 7,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Michael Sutfin",
        "type": "Spell",
        "fr": {
            "name": "Écraser"
        },
        "flavor": "Using this card on your enemies is one of the best things in life, according to some barbarians.",
        "playerClass": "Warrior",
        "name": "Crush",
        "id": "GVG_052",
        "text": "Destroy a minion. If you have a damaged minion, this costs (4) less.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_041.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Trent Kaniuga",
        "type": "Spell",
        "fr": {
            "name": "Sombres feux follets"
        },
        "flavor": "Don't worry; we fired the person who named this card.",
        "playerClass": "Druid",
        "name": "Dark Wispers",
        "id": "GVG_041",
        "text": "<b>Choose One -</b> Summon 5 Wisps; or Give a minion +5/+5 and <b>Taunt</b>.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_041b.png",
        "playerClass": "Druid",
        "set": "Goblins vs Gnomes",
        "name": "Dark Wispers",
        "id": "GVG_041b",
        "text": "Summon 5 Wisps.",
        "type": "Spell",
        "fr": {
            "name": "Sombres feux follets"
        }
    },
    {
        "cardImage": "GVG_041a.png",
        "playerClass": "Druid",
        "set": "Goblins vs Gnomes",
        "name": "Dark Wispers",
        "id": "GVG_041a",
        "text": "+5/+5 and <b>Taunt</b>.",
        "type": "Spell",
        "fr": {
            "name": "Sombres feux follets"
        }
    },
    {
        "playerClass": "Druid",
        "set": "Goblins vs Gnomes",
        "name": "Dark Wispers",
        "id": "GVG_041c",
        "text": "+5/+5 and <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Sombres feux follets"
        }
    },
    {
        "cardImage": "GVG_015.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jeff Haynie",
        "type": "Spell",
        "fr": {
            "name": "Bombe de matière noire"
        },
        "flavor": "If you're looking to make an \"Emo\" deck, this card is perfect!",
        "playerClass": "Warlock",
        "name": "Darkbomb",
        "id": "GVG_015",
        "text": "Deal $3 damage.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_019.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Kerem Beyit",
        "type": "Spell",
        "fr": {
            "name": "Cœur de démon"
        },
        "flavor": "Virtually every member of the pro demon lobby is a warlock. Weird.",
        "playerClass": "Warlock",
        "name": "Demonheart",
        "id": "GVG_019",
        "text": "Deal $5 damage to a minion.  If it's a friendly Demon, give it +5/+5 instead.",
        "rarity": "Epic"
    },
    {
        "playerClass": "Warlock",
        "set": "Goblins vs Gnomes",
        "name": "Demonheart",
        "id": "GVG_019e",
        "text": "+5/+5.",
        "type": "Enchantment",
        "fr": {
            "name": "Cœur de démon"
        }
    },
    {
        "cardImage": "GVG_110.png",
        "cost": 7,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Alex Garner",
        "health": 7,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Dr Boum"
        },
        "flavor": "MARVEL AT HIS MIGHT!",
        "elite": true,
        "attack": 7,
        "name": "Dr. Boom",
        "id": "GVG_110",
        "text": "<b>Battlecry</b>: Summon two 1/1 Boom Bots. <i>WARNING: Bots may explode.</i>",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_080t.png",
        "playerClass": "Druid",
        "cost": 5,
        "set": "Goblins vs Gnomes",
        "race": "Beast",
        "artist": "Massive Black",
        "attack": 7,
        "name": "Druid of the Fang",
        "health": 7,
        "id": "GVG_080t",
        "type": "Minion",
        "fr": {
            "name": "Druide du Croc"
        }
    },
    {
        "cardImage": "GVG_080.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Brandon Kitkouski",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Druide du Croc"
        },
        "flavor": "The Druids of the Fang live in the Wailing Caverns. They wear cool snake shirts and tell snake jokes and say \"bro\" a lot.",
        "playerClass": "Druid",
        "attack": 4,
        "name": "Druid of the Fang",
        "id": "GVG_080",
        "text": "<b>Battlecry:</b> If you have a Beast, transform this minion into a 7/7.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_066.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "José Ladrönn",
        "health": 4,
        "mechanics": [
            "Overload",
            "Windfury"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chaman cognedune"
        },
        "flavor": "He just closes his eyes and goes for it. Raarararrrarar!",
        "playerClass": "Shaman",
        "attack": 5,
        "name": "Dunemaul Shaman",
        "id": "GVG_066",
        "text": "<b>Windfury, Overload: (1)</b>\n50% chance to attack the wrong enemy.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_005.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Alex Garner",
        "type": "Spell",
        "fr": {
            "name": "Écho de Medivh"
        },
        "flavor": "Medivh's echo haunts Karazhan, eternally cheating at chess and <i>Hearthstone</i>.",
        "playerClass": "Mage",
        "name": "Echo of Medivh",
        "id": "GVG_005",
        "text": "Put a copy of each friendly minion into your hand.",
        "rarity": "Epic"
    },
    {
        "cardImage": "PART_005.png",
        "cost": 1,
        "set": "Goblins vs Gnomes",
        "artist": "Peerasak Senalai",
        "name": "Emergency Coolant",
        "mechanics": [
            "Freeze"
        ],
        "id": "PART_005",
        "text": "<b>Freeze</b> a minion.",
        "type": "Spell",
        "fr": {
            "name": "Liquide de refroidissement"
        }
    },
    {
        "cardImage": "GVG_107.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Zoltan Boros",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mécano-amplificateur"
        },
        "flavor": "His enhancements are gluten free!",
        "attack": 3,
        "name": "Enhance-o Mechano",
        "id": "GVG_107",
        "text": "<b>Battlecry:</b> Give your other minions <b>Windfury</b>, <b>Taunt</b>, or <b>Divine Shield</b>.\n<i>(at random)</i>",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_076.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Ralph Horsley",
        "health": 1,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mouton explosif"
        },
        "flavor": "How is this supposed to work?  Your enemies think, \"<i>Hey!</i> Cute sheep!\" and run over to cuddle it?",
        "attack": 1,
        "name": "Explosive Sheep",
        "id": "GVG_076",
        "text": "<b>Deathrattle:</b> Deal 2 damage to all minions.",
        "rarity": "Common"
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Extra Sharp",
        "id": "GVG_023a",
        "text": "+1 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Lame affûtée"
        }
    },
    {
        "cardImage": "GVG_026.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Luca Zontini",
        "type": "Spell",
        "fr": {
            "name": "Feindre la mort"
        },
        "flavor": "The hardest part about doing a \"Feign Death\" convincingly is learning how to make the right smell. It takes a lot of commitment.",
        "playerClass": "Hunter",
        "name": "Feign Death",
        "id": "GVG_026",
        "text": "Trigger all <b>Deathrattles</b> on your minions.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_020.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Matt Gaser",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Gangrecanon"
        },
        "flavor": "The box says, \"New and improved, with 200% more fel!\"",
        "playerClass": "Warlock",
        "attack": 3,
        "name": "Fel Cannon",
        "id": "GVG_020",
        "text": "At the end of your turn, deal 2 damage to a non-Mech minion.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_016.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Zoltan & Gabor",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Saccageur gangrené"
        },
        "flavor": "So reaver. Much fel. Wow.",
        "attack": 8,
        "name": "Fel Reaver",
        "id": "GVG_016",
        "text": "Whenever your opponent plays a card, remove the top 3 cards of your deck.",
        "rarity": "Epic"
    },
    {
        "cardImage": "PART_004.png",
        "cost": 1,
        "set": "Goblins vs Gnomes",
        "artist": "Nutchapol Thitinunthakorn",
        "name": "Finicky Cloakfield",
        "id": "PART_004",
        "text": "Give a friendly minion <b>Stealth</b> until your next turn.",
        "type": "Spell",
        "fr": {
            "name": "Champ de camouflage"
        }
    },
    {
        "cardImage": "GVG_007.png",
        "cost": 7,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Aleksi Briclot",
        "health": 7,
        "type": "Minion",
        "fr": {
            "name": "Léviathan des flammes"
        },
        "flavor": "Mimiron likes to take the Flame Leviathan out on some sweet joyrides.",
        "playerClass": "Mage",
        "elite": true,
        "attack": 7,
        "name": "Flame Leviathan",
        "id": "GVG_007",
        "text": "When you draw this, deal 2 damage to all characters.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_001.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Mauricio Herrera",
        "type": "Spell",
        "fr": {
            "name": "Canon lance-flammes"
        },
        "flavor": "Calling something a flamecannon really doesn't do much to distinguish it from other goblin devices.",
        "playerClass": "Mage",
        "name": "Flamecannon",
        "id": "GVG_001",
        "text": "Deal $4 damage to a random enemy minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_100.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Demon",
        "artist": "Todd Lockwood",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Guetteur flottant"
        },
        "flavor": "\"Evil Eye Watcher of Doom\" was the original name, but marketing felt it was a bit too aggressive.",
        "playerClass": "Warlock",
        "attack": 4,
        "name": "Floating Watcher",
        "id": "GVG_100",
        "text": "Whenever your hero takes damage on your turn, gain +2/+2.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_084.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Matt Dixon",
        "health": 4,
        "mechanics": [
            "Windfury"
        ],
        "type": "Minion",
        "fr": {
            "name": "Machine volante"
        },
        "flavor": "To operate, this contraption needs a hula doll on the dashboard. Otherwise it's just a “falling machine.”",
        "attack": 1,
        "name": "Flying Machine",
        "id": "GVG_084",
        "text": "<b>Windfury</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_113.png",
        "cost": 8,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "James Ryman",
        "health": 9,
        "type": "Minion",
        "fr": {
            "name": "Faucheur 4000"
        },
        "flavor": "Foe reaping is really not so different from harvest reaping, at the end of the day.",
        "elite": true,
        "attack": 6,
        "name": "Foe Reaper 4000",
        "id": "GVG_113",
        "text": "Also damages the minions next to whomever he attacks.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_079.png",
        "cost": 8,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Nutchapol Thitinunthakorn",
        "health": 7,
        "mechanics": [
            "Divine Shield"
        ],
        "type": "Minion",
        "fr": {
            "name": "Char de force MAX"
        },
        "flavor": "There is a factory in Tanaris for crafting force-tanks, but it only ever made two, because of cost overruns.",
        "attack": 7,
        "name": "Force-Tank MAX",
        "id": "GVG_079",
        "text": "<b>Divine Shield</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_049.png",
        "cost": 7,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Beast",
        "artist": "Raymond Swanland",
        "health": 9,
        "type": "Minion",
        "fr": {
            "name": "Gahz’rilla"
        },
        "flavor": "The Sen'jin High football team is The Gahz'rillas.",
        "playerClass": "Hunter",
        "elite": true,
        "attack": 6,
        "name": "Gahz'rilla",
        "id": "GVG_049",
        "text": "Whenever this minion takes damage, double its Attack.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_028t.png",
        "cost": 0,
        "set": "Goblins vs Gnomes",
        "name": "Gallywix's Coin",
        "id": "GVG_028t",
        "text": "Gain 1 Mana Crystal this turn only.\n<i>(Won't trigger Gallywix.)</i>",
        "type": "Spell",
        "fr": {
            "name": "Pièce de Gallywix"
        }
    },
    {
        "cardImage": "GVG_117.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Luke Mancini",
        "health": 6,
        "type": "Minion",
        "fr": {
            "name": "Gazleu"
        },
        "flavor": "Gazlowe was voted \"Most Likely to Explode\" in high school.",
        "elite": true,
        "attack": 3,
        "name": "Gazlowe",
        "id": "GVG_117",
        "text": "Whenever you cast a 1-mana spell, add a random Mech to your hand.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_032b.png",
        "playerClass": "Druid",
        "set": "Goblins vs Gnomes",
        "name": "Gift of Cards",
        "id": "GVG_032b",
        "text": "Each player draws a card.",
        "type": "Spell",
        "fr": {
            "name": "Don de carte"
        }
    },
    {
        "cardImage": "GVG_032a.png",
        "playerClass": "Druid",
        "set": "Goblins vs Gnomes",
        "name": "Gift of Mana",
        "id": "GVG_032a",
        "text": "Give each player a Mana Crystal.",
        "type": "Spell",
        "fr": {
            "name": "Don de mana"
        }
    },
    {
        "cardImage": "GVG_081.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Seamus Gallagher",
        "health": 3,
        "mechanics": [
            "Stealth"
        ],
        "type": "Minion",
        "fr": {
            "name": "Traqueur gloubelin"
        },
        "flavor": "\"Shhh, I think I hear something.\"\n\"Ah, it's probably nothing.\" - Every Henchman",
        "attack": 2,
        "name": "Gilblin Stalker",
        "id": "GVG_081",
        "text": "<b>Stealth</b>",
        "rarity": "Common"
    },
    {
        "playerClass": "Hunter",
        "set": "Goblins vs Gnomes",
        "name": "Glaivezooka",
        "id": "GVG_043e",
        "text": "+1 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Glaivezooka"
        }
    },
    {
        "cardImage": "GVG_043.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Gino Whitehall",
        "durability": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Weapon",
        "fr": {
            "name": "Glaivezooka"
        },
        "flavor": "For the times when a regular bazooka just isn't enough.",
        "playerClass": "Hunter",
        "attack": 2,
        "name": "Glaivezooka",
        "id": "GVG_043",
        "text": "<b>Battlecry:</b> Give a random friendly minion +1 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_098.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Zoltan & Gabor",
        "health": 4,
        "mechanics": [
            "Charge",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Infanterie de Gnomeregan"
        },
        "flavor": "The gnomes are valiant and ready to return to their irradiated, poorly ventilated homeland!",
        "attack": 1,
        "name": "Gnomeregan Infantry",
        "id": "GVG_098",
        "text": "<b>Charge</b>\n<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_092.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jesper Ejsing",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Expérimentateur gnome"
        },
        "flavor": "He's legitimately surprised every time he turns himself into a chicken.",
        "attack": 3,
        "name": "Gnomish Experimenter",
        "id": "GVG_092",
        "text": "<b>Battlecry:</b> Draw a card. If it's a minion, transform it into a Chicken.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_023.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Zolton Boros",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Robot barbier gobelin"
        },
        "flavor": "This guy is excellent at adjusting your haircut and/or height.",
        "playerClass": "Rogue",
        "attack": 3,
        "name": "Goblin Auto-Barber",
        "id": "GVG_023",
        "text": "<b>Battlecry</b>: Give your weapon +1 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_004.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Glenn Rane",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Explomage gobelin"
        },
        "flavor": "If you can't find a bomb to throw, just pick up any goblin invention and throw that.",
        "playerClass": "Mage",
        "attack": 5,
        "name": "Goblin Blastmage",
        "id": "GVG_004",
        "text": "<b>Battlecry:</b> If you have a Mech, deal 4 damage randomly split among all enemies.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_095.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jesper Ejsing",
        "health": 4,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Sapeur gobelin"
        },
        "flavor": "He’s not such a binge exploder anymore. These days, he only explodes socially.",
        "attack": 2,
        "name": "Goblin Sapper",
        "id": "GVG_095",
        "text": "Has +4 Attack while your opponent has 6 or more cards in hand.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Warlock",
        "set": "Goblins vs Gnomes",
        "name": "Grasp of Mal'Ganis",
        "id": "GVG_021e",
        "text": "Mal'Ganis is granting +2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Étreinte de Mal’Ganis"
        }
    },
    {
        "cardImage": "GVG_032.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Chris Rahn",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Sylvenier du Bosquet"
        },
        "flavor": "Likes: Hiking and the great outdoors. Dislikes: Goblin shredders and sandals. (Can’t find any that fit!).",
        "playerClass": "Druid",
        "attack": 2,
        "name": "Grove Tender",
        "id": "GVG_032",
        "text": "<b>Choose One -</b> Give each player a Mana Crystal; or Each player draws a card.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_120.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Ralph Horsley",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Hemet Nesingwary"
        },
        "flavor": "It's hard to make a living as a hunter in a world where beasts instantly reappear minutes after you kill them.",
        "elite": true,
        "attack": 6,
        "name": "Hemet Nesingwary",
        "id": "GVG_120",
        "text": "<b>Battlecry:</b> Destroy a Beast.",
        "rarity": "Legendary"
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "HERE, TAKE BUFF.",
        "id": "GVG_104a",
        "text": "+2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "CADEAU BONUS"
        }
    },
    {
        "cardImage": "GVG_104.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Laurel D. Austin",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Hobgobelin"
        },
        "flavor": "Hobgoblins are meeting next week to discuss union benefits.  First on the list: dental plan.",
        "attack": 2,
        "name": "Hobgoblin",
        "id": "GVG_104",
        "text": "Whenever you play a 1-Attack minion, give it +2/+2.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_089.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jim Nelson",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Illuminatrice"
        },
        "flavor": "\"LUMOS!\" is not what they yell. What do you think this is, Hogwarts?",
        "attack": 2,
        "name": "Illuminator",
        "id": "GVG_089",
        "text": "If you control a <b>Secret</b> at the end of your turn, restore 4 Health to your hero.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_045t.png",
        "playerClass": "Warlock",
        "cost": 1,
        "set": "Goblins vs Gnomes",
        "race": "Demon",
        "attack": 1,
        "name": "Imp",
        "health": 1,
        "id": "GVG_045t",
        "type": "Minion",
        "fr": {
            "name": "Diablotin"
        }
    },
    {
        "cardImage": "GVG_045.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jaemin Kim",
        "type": "Spell",
        "fr": {
            "name": "Éruption de diablotins"
        },
        "flavor": "The shrapnel is waaaaay worse than the explosion.",
        "playerClass": "Warlock",
        "name": "Imp-losion",
        "id": "GVG_045",
        "text": "Deal $2-$4 damage to a minion. Summon a 1/1 Imp for each damage dealt.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_056.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Raymond Swanland",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mastodonte de fer"
        },
        "flavor": "The Iron Juggernaut guards Orgrimmar and has just earned the \"Employee of the Month\" award!",
        "playerClass": "Warrior",
        "elite": true,
        "attack": 6,
        "name": "Iron Juggernaut",
        "id": "GVG_056",
        "text": "<b>Battlecry:</b> Shuffle a Mine into your opponent's deck. When drawn, it explodes for 10 damage.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_027.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Brian Despain",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Senseï de fer"
        },
        "flavor": "Mechs like learning from him because he really speaks their language.\n0110100001101001",
        "playerClass": "Rogue",
        "attack": 2,
        "name": "Iron Sensei",
        "id": "GVG_027",
        "text": "At the end of your turn, give another friendly Mech +2/+2.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Rogue",
        "set": "Goblins vs Gnomes",
        "name": "Ironed Out",
        "id": "GVG_027e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Bien armé"
        }
    },
    {
        "cardImage": "GVG_094.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Matt Dixon",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Jeeves"
        },
        "flavor": "This robot is a lean, mean, butlerin' machine.",
        "attack": 1,
        "name": "Jeeves",
        "id": "GVG_094",
        "text": "At the end of each player's turn, that player draws until they have 3 cards.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_106.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Zoltan Boros",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Brik-à-bot"
        },
        "flavor": "One bot's junk is another bot's AWESOME UPGRADE!",
        "attack": 1,
        "name": "Junkbot",
        "id": "GVG_106",
        "text": "Whenever a friendly Mech dies, gain +2/+2.",
        "rarity": "Epic"
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Junked Up",
        "id": "GVG_106e",
        "text": "Increased stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Bricolé à fond"
        }
    },
    {
        "cardImage": "GVG_074.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jakub Kasper",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mystique de Kezan"
        },
        "flavor": "They pretend to be wise and enlightened, but they mostly just hate to be left out of a secret.",
        "attack": 4,
        "name": "Kezan Mystic",
        "id": "GVG_074",
        "text": "<b>Battlecry:</b> Take control of a random enemy <b>Secret</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_046.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Beast",
        "artist": "Seamus Gallagher",
        "health": 6,
        "mechanics": [
            "Battlecry",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Roi des bêtes"
        },
        "flavor": "He never sleeps.  Not even in the mighty jungle.",
        "playerClass": "Hunter",
        "attack": 2,
        "name": "King of Beasts",
        "id": "GVG_046",
        "text": "<b>Taunt</b>. <b>Battlecry:</b> Gain +1 Attack for each other Beast you have.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_012.png",
        "cost": 1,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jesper Ejsing",
        "type": "Spell",
        "fr": {
            "name": "Lumière des naaru"
        },
        "flavor": "\"Light it up!\" - Command given to both Lightwardens and Goblins holding Flamecannons.",
        "playerClass": "Priest",
        "name": "Light of the Naaru",
        "id": "GVG_012",
        "text": "Restore #3 Health. If the target is still damaged, summon a Lightwarden.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_008.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Luca Zontini",
        "mechanics": [
            "AffectedBySpellPower"
        ],
        "type": "Spell",
        "fr": {
            "name": "Bombe de lumière"
        },
        "flavor": "This is what happens when you allow goblins to be priests.",
        "playerClass": "Priest",
        "name": "Lightbomb",
        "id": "GVG_008",
        "text": "Deal damage to each minion equal to its Attack.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_097.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jim Nelson",
        "health": 3,
        "mechanics": [
            "Battlecry",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mini exorciste"
        },
        "flavor": "Warlocks have the town exorcist on speed dial in case they unleash the wrong demon.",
        "attack": 2,
        "name": "Lil' Exorcist",
        "id": "GVG_097",
        "text": "<b>Taunt</b>\n<b>Battlecry:</b> Gain +1/+1 for each enemy <b>Deathrattle</b> minion.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_071.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Beast",
        "artist": "Benjamin Zhang",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Haut-trotteur égaré"
        },
        "flavor": "The message, \"If found, please return to Mulgore,\" is tattooed on his rear.",
        "attack": 5,
        "name": "Lost Tallstrider",
        "id": "GVG_071",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_090.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Alex Horley Orlandelli",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Bombardier cinglé"
        },
        "flavor": "Dang, Bomber, calm down.",
        "attack": 5,
        "name": "Madder Bomber",
        "id": "GVG_090",
        "text": "<b>Battlecry:</b> Deal 6 damage randomly split between all other characters.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_021.png",
        "cost": 9,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Demon",
        "artist": "Wayne Reynolds",
        "health": 7,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mal’Ganis"
        },
        "flavor": "Mal'Ganis doesn't like being betrayed, so if you discard him, watch out.",
        "playerClass": "Warlock",
        "elite": true,
        "attack": 9,
        "name": "Mal'Ganis",
        "id": "GVG_021",
        "text": "Your other Demons have +2/+2.\nYour hero is <b>Immune</b>.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_035.png",
        "cost": 7,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Beast",
        "artist": "Oliver Chipping",
        "health": 7,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Malorne"
        },
        "flavor": "When Malorne isn't mauling hordes of demons, he enjoys attending parties, though he prefers to go stag.",
        "playerClass": "Druid",
        "elite": true,
        "attack": 9,
        "name": "Malorne",
        "id": "GVG_035",
        "text": "<b>Deathrattle:</b> Shuffle this minion into your deck.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_034.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Trent Kaniuga",
        "health": 6,
        "type": "Minion",
        "fr": {
            "name": "Méca chat-ours"
        },
        "flavor": "Crushes buildings with his BEAR hands.",
        "playerClass": "Druid",
        "attack": 7,
        "name": "Mech-Bear-Cat",
        "id": "GVG_034",
        "text": "Whenever this minion takes damage, add a <b>Spare Part</b> card to your hand.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_078.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Chris Seaman",
        "health": 5,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Yéti mécanique"
        },
        "flavor": "The yetis of Chillwind Point are a source of both inspiration and savage beatings.",
        "attack": 4,
        "name": "Mechanical Yeti",
        "id": "GVG_078",
        "text": "<b>Deathrattle:</b> Give each player a <b>Spare Part.</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_006.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Phil Saunders",
        "health": 3,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Méca-téléporteur"
        },
        "flavor": "Mechs that summon mechs? What's next? Donuts that summon donuts? Mmmmm.",
        "attack": 2,
        "name": "Mechwarper",
        "id": "GVG_006",
        "text": "Your Mechs cost (1) less.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_116.png",
        "cost": 9,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Trent Kaniuga",
        "health": 7,
        "type": "Minion",
        "fr": {
            "name": "Mekgénieur Thermojoncteur"
        },
        "flavor": "He was obsessed with explosives until he discovered knitting. Now he yells, “SWEATERS! MORE SWEATERS!”",
        "elite": true,
        "attack": 9,
        "name": "Mekgineer Thermaplugg",
        "id": "GVG_116",
        "text": "Whenever an enemy minion dies, summon a Leper Gnome.",
        "rarity": "Legendary"
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Metabolized Magic",
        "mechanics": [
            "Aura"
        ],
        "id": "GVG_067a",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Magie métabolisée"
        }
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Metabolized Magic",
        "mechanics": [
            "Aura"
        ],
        "id": "GVG_068a",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Magie métabolisée"
        }
    },
    {
        "playerClass": "Hunter",
        "set": "Goblins vs Gnomes",
        "name": "Metal Teeth",
        "id": "GVG_048e",
        "text": "+2 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Dents de métal"
        }
    },
    {
        "cardImage": "GVG_048.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Hideaki Takamura",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Bondisseur dent-de-métal"
        },
        "flavor": "Don't leave them out in the rain. In Un'Goro Crater there is a whole colony of rust-tooth leapers.",
        "playerClass": "Hunter",
        "attack": 3,
        "name": "Metaltooth Leaper",
        "id": "GVG_048",
        "text": "<b>Battlecry</b>: Give your other Mechs +2 Attack.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_103.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Skan Srisuwan",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Micro-machine"
        },
        "flavor": "This card is the real thing.",
        "attack": 1,
        "name": "Micro Machine",
        "id": "GVG_103",
        "text": "At the start of each turn, gain +1 Attack.",
        "rarity": "Common"
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Might of Tinkertown",
        "id": "GVG_102e",
        "text": "+1/+1.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance de Brikabrok"
        }
    },
    {
        "playerClass": "Hunter",
        "set": "Goblins vs Gnomes",
        "name": "Might of Zul'Farrak",
        "id": "GVG_049e",
        "text": "Multiplying Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance de Zul’Farrak"
        }
    },
    {
        "cardImage": "GVG_111.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Trent Kaniuga",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Tête de Mimiron"
        },
        "flavor": "Do not push the big red button!",
        "elite": true,
        "attack": 4,
        "name": "Mimiron's Head",
        "id": "GVG_111",
        "text": "At the start of your turn, if you have at least 3 Mechs, destroy them all and form V-07-TR-0N.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_109.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Ben Olson",
        "health": 1,
        "mechanics": [
            "Spellpower",
            "Stealth"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mini-mage"
        },
        "flavor": "He is sometimes found hiding in the treasure chest in the Gurubashi Arena.",
        "attack": 4,
        "name": "Mini-Mage",
        "id": "GVG_109",
        "text": "<b>Stealth</b>\n<b>Spell Damage +1</b>",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_018.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Demon",
        "artist": "Carl Critchlow",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Maîtresse de Douleur"
        },
        "flavor": "Her sister is the Mistress of Pane who sells windows and shower doors.",
        "playerClass": "Warlock",
        "attack": 1,
        "name": "Mistress of Pain",
        "id": "GVG_018",
        "text": "Whenever this minion deals damage, restore that much Health to your hero.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_112.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Michal Ivan",
        "health": 6,
        "type": "Minion",
        "fr": {
            "name": "Mogor l’ogre"
        },
        "flavor": "Mogor helped reopen the Dark Portal once. You know you're in trouble when you have to rely on an ogre.",
        "elite": true,
        "attack": 7,
        "name": "Mogor the Ogre",
        "id": "GVG_112",
        "text": "All minions have a 50% chance to attack the wrong enemy.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_061.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Mike Hayes",
        "type": "Spell",
        "fr": {
            "name": "Régiment de bataille"
        },
        "flavor": "\"I'm bringing the guacamole!\" – One of the most successful (yet rare) Silver Hand rallying cries",
        "playerClass": "Paladin",
        "name": "Muster for Battle",
        "id": "GVG_061",
        "text": "Summon three 1/1 Silver Hand Recruits. Equip a 1/4 Weapon.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_042.png",
        "cost": 7,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Ruan Jia",
        "health": 7,
        "mechanics": [
            "Battlecry",
            "Overload"
        ],
        "type": "Minion",
        "fr": {
            "name": "Neptulon"
        },
        "flavor": "Neptulon is \"The Tidehunter\". He’s one of the four elemental lords. And he and Ragnaros get together and make really amazing saunas.",
        "playerClass": "Shaman",
        "elite": true,
        "attack": 7,
        "name": "Neptulon",
        "id": "GVG_042",
        "text": "<b>Battlecry:</b> Add 4 random Murlocs to your hand. <b>Overload:</b> (3)",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_065.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Vinod Rams",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Brute ogre"
        },
        "flavor": "Ogres have really terrible short-term chocolate.",
        "attack": 4,
        "name": "Ogre Brute",
        "id": "GVG_065",
        "text": "50% chance to attack the wrong enemy.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_088.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Samwise",
        "health": 6,
        "mechanics": [
            "Stealth"
        ],
        "type": "Minion",
        "fr": {
            "name": "Ninja ogre"
        },
        "flavor": "He didn't have the grades to get into ninja school, but his dad pulled some strings.",
        "playerClass": "Rogue",
        "attack": 6,
        "name": "Ogre Ninja",
        "id": "GVG_088",
        "text": "<b>Stealth</b>\n50% chance to attack the wrong enemy.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_054.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Richard Wright",
        "durability": 2,
        "type": "Weapon",
        "fr": {
            "name": "Cogneguerre ogre"
        },
        "flavor": "Simple, misguided, and incredibly dangerous. You know, like most things ogre.",
        "playerClass": "Warrior",
        "attack": 4,
        "name": "Ogre Warmaul",
        "id": "GVG_054",
        "text": "50% chance to attack the wrong enemy.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_025.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Pirate",
        "artist": "Danny Beck",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "Tricheur borgne"
        },
        "flavor": "When pirates say there is no \"Eye\" in \"team,\" they are very literal about it.",
        "playerClass": "Rogue",
        "attack": 4,
        "name": "One-eyed Cheat",
        "id": "GVG_025",
        "text": "Whenever you summon a Pirate, gain <b>Stealth</b>.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Mage",
        "set": "Goblins vs Gnomes",
        "name": "Overclocked",
        "mechanics": [
            "Spellpower"
        ],
        "id": "GVG_123e",
        "text": "Spell Damage +2.",
        "type": "Enchantment",
        "fr": {
            "name": "Remonté"
        }
    },
    {
        "cardImage": "GVG_096.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Dan Scott",
        "health": 3,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Déchiqueteur piloté"
        },
        "flavor": "Once upon a time, only goblins piloted shredders. These days, everyone from Doomsayer to Lorewalker Cho seems to ride one.",
        "attack": 4,
        "name": "Piloted Shredder",
        "id": "GVG_096",
        "text": "<b>Deathrattle:</b> Summon a random 2-Cost minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_105.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Michael Phillippi",
        "health": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Golem céleste piloté"
        },
        "flavor": "The pinnacle of goblin engineering. Includes an espresso machine and foot massager.",
        "attack": 6,
        "name": "Piloted Sky Golem",
        "id": "GVG_105",
        "text": "<b>Deathrattle:</b> Summon a random 4-Cost minion.",
        "rarity": "Epic"
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Pistons",
        "id": "GVG_076a",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Pistons"
        }
    },
    {
        "playerClass": "Shaman",
        "set": "Goblins vs Gnomes",
        "name": "Powered",
        "id": "GVG_036e",
        "text": "+2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance acquise"
        }
    },
    {
        "cardImage": "GVG_036.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Zoltan and Gabor",
        "durability": 2,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Weapon",
        "fr": {
            "name": "Masse de puissance"
        },
        "flavor": "People assume that shamans control the elements, but really, they have to ask them stuff and the elements are like, \"Yeah ok, sure.\"",
        "playerClass": "Shaman",
        "attack": 3,
        "name": "Powermace",
        "id": "GVG_036",
        "text": "<b>Deathrattle</b>: Give a random friendly Mech +2/+2.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_064.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Murloc",
        "artist": "Jaemin Kim",
        "health": 2,
        "type": "Minion",
        "fr": {
            "name": "Saute-flaque"
        },
        "flavor": "He pays homage to Morgl, the great murloc oracle! (Who doesn't??)",
        "attack": 3,
        "name": "Puddlestomper",
        "id": "GVG_064",
        "rarity": "Common"
    },
    {
        "playerClass": "Paladin",
        "set": "Goblins vs Gnomes",
        "name": "Pure",
        "id": "GVG_101e",
        "text": "Increased Stats.",
        "type": "Enchantment",
        "fr": {
            "name": "Pur"
        }
    },
    {
        "cardImage": "GVG_060.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Phroilan Gardner",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Intendant"
        },
        "flavor": "His specialty? Dividing things into four pieces.",
        "playerClass": "Paladin",
        "attack": 2,
        "name": "Quartermaster",
        "id": "GVG_060",
        "text": "<b>Battlecry:</b> Give your Silver Hand Recruits +2/+2.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_108.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Ben Olson",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Recombobulateur"
        },
        "flavor": "For when you didn’t combobulate quite right the first time around.",
        "attack": 3,
        "name": "Recombobulator",
        "id": "GVG_108",
        "text": "<b>Battlecry:</b> Transform a friendly minion into a random minion with the same Cost.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_031.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Efrem Palacios",
        "type": "Spell",
        "fr": {
            "name": "Recyclage"
        },
        "flavor": "Druidic recycling involves putting plastics in one bin and enemy minions in another bin.",
        "playerClass": "Druid",
        "name": "Recycle",
        "id": "GVG_031",
        "text": "Shuffle an enemy minion into your opponent's deck.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Priest",
        "set": "Goblins vs Gnomes",
        "name": "Repairs!",
        "id": "GVG_069a",
        "text": "+4 Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Réparations !"
        }
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Retribution",
        "id": "GVG_063a",
        "text": "Increased Attack",
        "type": "Enchantment",
        "fr": {
            "name": "Vindicte"
        }
    },
    {
        "cardImage": "PART_006.png",
        "cost": 1,
        "set": "Goblins vs Gnomes",
        "artist": "Nutthapon Petthai",
        "name": "Reversing Switch",
        "id": "PART_006",
        "text": "Swap a minion's Attack and Health.",
        "type": "Spell",
        "fr": {
            "name": "Inverseur"
        }
    },
    {
        "cardImage": "PART_003.png",
        "cost": 1,
        "set": "Goblins vs Gnomes",
        "artist": "Peerasak Senalai",
        "name": "Rusty Horn",
        "id": "PART_003",
        "text": "Give a minion <b>Taunt</b>.",
        "type": "Spell",
        "fr": {
            "name": "Klaxon rouillé"
        }
    },
    {
        "cardImage": "GVG_047.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Dave Allsop",
        "mechanics": [
            "Combo"
        ],
        "type": "Spell",
        "fr": {
            "name": "Sabotage"
        },
        "flavor": "Rogues can't stand it. They know you planned it! They are going to set you straight!",
        "playerClass": "Rogue",
        "name": "Sabotage",
        "id": "GVG_047",
        "text": "Destroy a random enemy minion. <b>Combo</b>: And your opponent's weapon.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_070.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Pirate",
        "artist": "Alex Horley Orlandelli",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Mataf"
        },
        "flavor": "He's recently recovered from being a \"scurvy dog.\"",
        "attack": 7,
        "name": "Salty Dog",
        "id": "GVG_070",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_101.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Anton Zemskov",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Purificateur écarlate"
        },
        "flavor": "The Scarlet Crusade is doing market research to find out if the \"Mauve Crusade\" would be better received.",
        "playerClass": "Paladin",
        "attack": 4,
        "name": "Scarlet Purifier",
        "id": "GVG_101",
        "text": "<b>Battlecry</b>: Deal 2 damage to all minions with <b>Deathrattle</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_055.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Jesper Ejsing",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Cliquetteur perce-vrille"
        },
        "flavor": "If it breaks, just kick it a couple of times while yelling \"Durn thing!\"",
        "playerClass": "Warrior",
        "attack": 2,
        "name": "Screwjank Clunker",
        "id": "GVG_055",
        "text": "<b>Battlecry</b>: Give a friendly Mech +2/+2.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Warrior",
        "set": "Goblins vs Gnomes",
        "name": "Screwy Jank",
        "id": "GVG_055e",
        "text": "+2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Ferraille tordue"
        }
    },
    {
        "cardImage": "GVG_057.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jason Chan",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "type": "Spell",
        "fr": {
            "name": "Sceau de Lumière"
        },
        "flavor": "The walrus of Light restores EIGHT Health.",
        "playerClass": "Paladin",
        "name": "Seal of Light",
        "id": "GVG_057",
        "text": "Restore #4 Health to your hero and gain +2 Attack this turn.",
        "rarity": "Common"
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Seal of Light",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "GVG_057a",
        "text": "+2 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Sceau de Lumière"
        }
    },
    {
        "cardImage": "GVG_009.png",
        "cost": 1,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Matt Dixon",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Bombardière d’ombre"
        },
        "flavor": "Shadowbomber does her job, but she's kind of phoning it in at this point.",
        "playerClass": "Priest",
        "attack": 2,
        "name": "Shadowbomber",
        "id": "GVG_009",
        "text": "<b>Battlecry:</b> Deal 3 damage to each hero.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_072.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Dan Scott",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Boxeur de l’ombre"
        },
        "flavor": "Punching is its primary function. Also, its secondary function.",
        "playerClass": "Priest",
        "attack": 2,
        "name": "Shadowboxer",
        "id": "GVG_072",
        "text": "Whenever a character is healed, deal 1 damage to a random enemy.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Priest",
        "set": "Goblins vs Gnomes",
        "name": "Shadowed",
        "id": "GVG_014a",
        "text": "Health was swapped.",
        "type": "Enchantment",
        "fr": {
            "name": "Dissimulé"
        }
    },
    {
        "cardImage": "GVG_058.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Raymond Swanland",
        "health": 2,
        "mechanics": [
            "Divine Shield"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mini-robot blindé"
        },
        "flavor": "He chooses to believe what he is programmed to believe!",
        "playerClass": "Paladin",
        "attack": 2,
        "name": "Shielded Minibot",
        "id": "GVG_058",
        "text": "<b>Divine Shield</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_053.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Alex Horley Orlandelli",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Vierge guerrière"
        },
        "flavor": "She has three shieldbearers in her party to supply her with back ups when she gets low on durability.",
        "playerClass": "Warrior",
        "attack": 5,
        "name": "Shieldmaiden",
        "id": "GVG_053",
        "text": "<b>Battlecry:</b> Gain 5 Armor.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_075.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Warren Mahy",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Canon du navire"
        },
        "flavor": "If you hear someone yell, \"Cannonball!\" you're about to get wet. Or crushed.",
        "attack": 2,
        "name": "Ship's Cannon",
        "id": "GVG_075",
        "text": "Whenever you summon a Pirate, deal 2 damage to a random enemy.",
        "rarity": "Common"
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Shrink Ray",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "GVG_011a",
        "text": "-2 Attack this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Rayon réducteur"
        }
    },
    {
        "cardImage": "GVG_011.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jim Nelson",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Réducteur fou"
        },
        "flavor": "After the debacle of the Gnomish World Enlarger, gnomes are wary of size-changing inventions.",
        "playerClass": "Priest",
        "attack": 3,
        "name": "Shrinkmeister",
        "id": "GVG_011",
        "text": "<b>Battlecry:</b> Give a minion -2 Attack this turn.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_086.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Zero Yue",
        "health": 5,
        "type": "Minion",
        "fr": {
            "name": "Engin de siège"
        },
        "flavor": "Wintergrasp Keep's only weakness!",
        "playerClass": "Warrior",
        "attack": 5,
        "name": "Siege Engine",
        "id": "GVG_086",
        "text": "Whenever you gain Armor, give this minion +1 Attack.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_040.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Murloc",
        "artist": "Clint Langley",
        "health": 5,
        "mechanics": [
            "Overload"
        ],
        "type": "Minion",
        "fr": {
            "name": "Marche-esprit aileron vaseux"
        },
        "flavor": "The elements respond to anyone who calls them for a worthy cause, even if you call them by yelling, \"MRGHRGLGLGL!\"",
        "playerClass": "Shaman",
        "attack": 2,
        "name": "Siltfin Spiritwalker",
        "id": "GVG_040",
        "text": "Whenever another friendly Murloc dies, draw a card. <b>Overload</b>: (1)",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_114.png",
        "cost": 8,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Christopher Moeller",
        "health": 7,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Vieux déchiqueteur de Sneed"
        },
        "flavor": "When Sneed was defeated in the Deadmines, his shredder was sold at auction to an anonymous buyer. (Probably Hogger.)",
        "elite": true,
        "attack": 5,
        "name": "Sneed's Old Shredder",
        "id": "GVG_114",
        "text": "<b>Deathrattle:</b> Summon a random legendary minion.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_002.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Gabor Szikszai",
        "health": 3,
        "mechanics": [
            "Freeze"
        ],
        "type": "Minion",
        "fr": {
            "name": "Souffle-neige"
        },
        "flavor": "Do the slow chant when he waddles by: \"Chug! Chug! Chug!\"",
        "playerClass": "Mage",
        "attack": 2,
        "name": "Snowchugger",
        "id": "GVG_002",
        "text": "<b>Freeze</b> any character damaged by this minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_123.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Phil Saunders",
        "health": 3,
        "mechanics": [
            "Spellpower"
        ],
        "type": "Minion",
        "fr": {
            "name": "Cracheur de suie"
        },
        "flavor": "The inventor of the goblin shredder is involved in several patent disputes with the inventor of the soot spewer.",
        "playerClass": "Mage",
        "attack": 3,
        "name": "Soot Spewer",
        "id": "GVG_123",
        "text": "<b>Spell Damage +1</b>",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_044.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Dany Orizio",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Char araignée"
        },
        "flavor": "\"What if we put guns on it?\" -Fizzblitz, staring at the spider-transportation-machine",
        "attack": 3,
        "name": "Spider Tank",
        "id": "GVG_044",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_087.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jun Kang",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Sniper de Gentepression"
        },
        "flavor": "Goblins seldom have the patience for sniping. Most prefer lobbing explosives.",
        "playerClass": "Hunter",
        "attack": 2,
        "name": "Steamwheedle Sniper",
        "id": "GVG_087",
        "text": "Your Hero Power can target minions.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_067.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Peet Cooper",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Trogg brisepierre"
        },
        "flavor": "The only thing worse than smelling troggs is listening to their poetry.",
        "attack": 2,
        "name": "Stonesplinter Trogg",
        "id": "GVG_067",
        "text": "Whenever your opponent casts a spell, gain +1 Attack.",
        "rarity": "Common"
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Switched",
        "id": "PART_006a",
        "text": "Attack and Health have been swapped by Reversing Switch.",
        "type": "Enchantment",
        "fr": {
            "name": "Inversion"
        }
    },
    {
        "playerClass": "Druid",
        "set": "Goblins vs Gnomes",
        "name": "Tank Mode",
        "id": "GVG_030be",
        "text": "+1 Health.",
        "type": "Enchantment",
        "fr": {
            "name": "Mode Char"
        }
    },
    {
        "cardImage": "GVG_030b.png",
        "playerClass": "Druid",
        "set": "Goblins vs Gnomes",
        "name": "Tank Mode",
        "id": "GVG_030b",
        "text": "+1 Health.",
        "type": "Spell",
        "fr": {
            "name": "Mode Char"
        }
    },
    {
        "cardImage": "GVG_093.png",
        "cost": 0,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Matt Dixon",
        "health": 2,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Cible leurre"
        },
        "flavor": "The engineering equivalent of a \"Kick Me\" sticker.",
        "attack": 0,
        "name": "Target Dummy",
        "id": "GVG_093",
        "text": "<b>Taunt</b>",
        "rarity": "Rare"
    },
    {
        "playerClass": "Hunter",
        "set": "Goblins vs Gnomes",
        "name": "The King",
        "id": "GVG_046e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Le roi"
        }
    },
    {
        "cardImage": "PART_002.png",
        "cost": 1,
        "set": "Goblins vs Gnomes",
        "artist": "Nutthapon Petthai",
        "name": "Time Rewinder",
        "id": "PART_002",
        "text": "Return a friendly minion to your hand.",
        "type": "Spell",
        "fr": {
            "name": "Remontoir"
        }
    },
    {
        "cardImage": "GVG_022.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Den",
        "mechanics": [
            "Combo"
        ],
        "type": "Spell",
        "fr": {
            "name": "Huile d’affûtage de Bricoleur"
        },
        "flavor": "\"Get ready to strike oil!\" - Super-cheesy battle cry",
        "playerClass": "Rogue",
        "name": "Tinker's Sharpsword Oil",
        "id": "GVG_022",
        "text": "Give your weapon +3 Attack. <b>Combo:</b> Give a random friendly minion +3 Attack.",
        "rarity": "Common"
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Tinker's Sharpsword Oil",
        "id": "GVG_022a",
        "text": "+3 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Huile d’affûtage de Bricoleur"
        }
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Tinker's Sharpsword Oil",
        "id": "GVG_022b",
        "text": "+3 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Huile d’affûtage de Bricoleur"
        }
    },
    {
        "cardImage": "GVG_102.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Gabor Szikszai",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Technicien de Brikabrok"
        },
        "flavor": "Won't you take me to... Tinkertown?",
        "attack": 3,
        "name": "Tinkertown Technician",
        "id": "GVG_102",
        "text": "<b>Battlecry:</b> If you have a Mech, gain +1/+1 and add a <b>Spare Part</b> to your hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_115.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Zoltan & Gabor",
        "health": 7,
        "mechanics": [
            "Battlecry",
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Toshley"
        },
        "flavor": "Something about power converters.",
        "elite": true,
        "attack": 5,
        "name": "Toshley",
        "id": "GVG_115",
        "text": "<b>Battlecry and Deathrattle:</b> Add a <b>Spare Part</b> card to your hand.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_028.png",
        "cost": 6,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Wei Wang",
        "health": 8,
        "type": "Minion",
        "fr": {
            "name": "Prince marchand Gallywix"
        },
        "flavor": "Gallywix believes in supply and demand. He supplies the beatings and demands you pay up!",
        "playerClass": "Rogue",
        "elite": true,
        "attack": 5,
        "name": "Trade Prince Gallywix",
        "id": "GVG_028",
        "text": "Whenever your opponent casts a spell, gain a copy of it and give them a Coin.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_033.png",
        "cost": 9,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Steve Prescott",
        "type": "Spell",
        "fr": {
            "name": "Arbre de vie"
        },
        "flavor": "Healing: It grows on trees!",
        "playerClass": "Druid",
        "name": "Tree of Life",
        "id": "GVG_033",
        "text": "Restore all characters to full Health.",
        "rarity": "Epic"
    },
    {
        "cardImage": "GVG_118.png",
        "cost": 7,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Mike Sass",
        "health": 6,
        "type": "Minion",
        "fr": {
            "name": "Troggzor le Terreminator"
        },
        "flavor": "He keeps earthinating the countryside despite attempts to stop him.",
        "elite": true,
        "attack": 6,
        "name": "Troggzor the Earthinator",
        "id": "GVG_118",
        "text": "Whenever your opponent casts a spell, summon a Burly Rockjaw Trogg.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_003.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Sean O'Daniels",
        "type": "Spell",
        "fr": {
            "name": "Portail instable"
        },
        "flavor": "The denizens of Azeroth have no idea how much work goes into stabilizing portals.  We spend like 30% of GDP on portal upkeep.",
        "playerClass": "Mage",
        "name": "Unstable Portal",
        "id": "GVG_003",
        "text": "Add a random minion to your hand. It costs (3) less.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_083.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Nutchapol Thitinunthakorn",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Robot réparateur amélioré"
        },
        "flavor": "It's the same as the previous generation but they slapped the word \"upgraded\" on it to sell it for double.",
        "playerClass": "Priest",
        "attack": 5,
        "name": "Upgraded Repair Bot",
        "id": "GVG_083",
        "text": "<b>Battlecry:</b> Give a friendly Mech +4 Health.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_111t.png",
        "cost": 8,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Chris Seaman",
        "health": 8,
        "mechanics": [
            "Charge"
        ],
        "type": "Minion",
        "fr": {
            "name": "V-07-TR-0N"
        },
        "elite": true,
        "attack": 4,
        "name": "V-07-TR-0N",
        "id": "GVG_111t",
        "text": "<b>Charge</b>\n<b>Mega-Windfury</b> <i>(Can attack four times a turn.)</i>",
        "rarity": "Legendary"
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Velen's Chosen",
        "id": "GVG_010b",
        "text": "+2/+4 and <b>Spell Damage +1</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Choix de Velen"
        }
    },
    {
        "cardImage": "GVG_010.png",
        "cost": 3,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Alex Horley Orlandelli",
        "type": "Spell",
        "fr": {
            "name": "Choix de Velen"
        },
        "flavor": "Velen wrote a \"Lovely Card\" for Tyrande with a picture of the Deeprun Tram that said \"I Choo-Choo-Choose you!\"",
        "playerClass": "Priest",
        "name": "Velen's Chosen",
        "id": "GVG_010",
        "text": "Give a minion +2/+4 and <b>Spell Damage +1</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_039.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Totem",
        "artist": "Guangjian Huang",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Totem de vitalité"
        },
        "flavor": "You can usually find these at the totemist's market on Saturdays.",
        "playerClass": "Shaman",
        "attack": 0,
        "name": "Vitality Totem",
        "id": "GVG_039",
        "text": "At the end of your turn, restore 4 Health to your hero.",
        "rarity": "Rare"
    },
    {
        "cardImage": "GVG_014.png",
        "cost": 5,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Raymond Swanland",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Vol’jin"
        },
        "flavor": "Vol'jin is a shadow hunter, which is like a shadow priest except more voodoo.",
        "playerClass": "Priest",
        "elite": true,
        "attack": 6,
        "name": "Vol'jin",
        "id": "GVG_014",
        "text": "<b>Battlecry:</b> Swap Health with another minion.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "GVG_051.png",
        "cost": 1,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Tyler Walpole",
        "health": 3,
        "mechanics": [
            "Enrage"
        ],
        "type": "Minion",
        "fr": {
            "name": "Robo-baston"
        },
        "flavor": "Mass production of warbots was halted when it was discovered that they were accidentally being produced at \"sample size.\"",
        "playerClass": "Warrior",
        "attack": 1,
        "name": "Warbot",
        "id": "GVG_051",
        "text": "<b>Enrage:</b> +1 Attack.",
        "rarity": "Common"
    },
    {
        "cardImage": "GVG_122.png",
        "cost": 4,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "artist": "Jonboy Meyers",
        "health": 5,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Mini stoppe-sort"
        },
        "flavor": "Bane of spellcasters and spelling bees everywhere.",
        "playerClass": "Mage",
        "attack": 2,
        "name": "Wee Spellstopper",
        "id": "GVG_122",
        "text": "Adjacent minions can't be targeted by spells or Hero Powers.",
        "rarity": "Epic"
    },
    {
        "playerClass": "Paladin",
        "set": "Goblins vs Gnomes",
        "name": "Well Equipped",
        "id": "GVG_060e",
        "text": "+2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Bien équipé"
        }
    },
    {
        "set": "Goblins vs Gnomes",
        "name": "Whirling Blades",
        "id": "PART_007e",
        "text": "+1 Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Lames tourbillonnantes"
        }
    },
    {
        "cardImage": "PART_007.png",
        "cost": 1,
        "set": "Goblins vs Gnomes",
        "artist": "Nutchapol Thitinunthakorn",
        "name": "Whirling Blades",
        "id": "PART_007",
        "text": "Give a minion +1 Attack.",
        "type": "Spell",
        "fr": {
            "name": "Lames tourbillonnantes"
        }
    },
    {
        "cardImage": "GVG_037.png",
        "cost": 2,
        "collectible": true,
        "set": "Goblins vs Gnomes",
        "race": "Mech",
        "artist": "Jim Nelson",
        "health": 2,
        "mechanics": [
            "Windfury"
        ],
        "type": "Minion",
        "fr": {
            "name": "Zap-o-matic tournoyant"
        },
        "flavor": "If you pay a little extra, you can get it in \"candy-apple red.\"",
        "playerClass": "Shaman",
        "attack": 3,
        "name": "Whirling Zap-o-matic",
        "id": "GVG_037",
        "text": "<b>Windfury</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA04_28.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "A Glowing Pool",
        "id": "LOEA04_28",
        "text": "<b>Drink?</b>",
        "type": "Spell",
        "fr": {
            "name": "Un bassin luminescent"
        }
    },
    {
        "cardImage": "LOE_110t.png",
        "cost": 0,
        "set": "League of Explorers",
        "artist": "Slawomir Maniak",
        "name": "Ancient Curse",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "LOE_110t",
        "text": "When you draw this, take 7 damage and draw a card.",
        "type": "Spell",
        "fr": {
            "name": "Malédiction ancestrale"
        }
    },
    {
        "cardImage": "LOEA13_2.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Ancient Power",
        "id": "LOEA13_2",
        "text": "<b>Hero Power</b>\nGive each player a random card. It costs (0).",
        "type": "Hero Power",
        "fr": {
            "name": "Puissance des anciens"
        }
    },
    {
        "cardImage": "LOEA13_2H.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Ancient Power",
        "id": "LOEA13_2H",
        "text": "<b>Hero Power</b>\nAdd a random card to your hand. It costs (0).",
        "type": "Hero Power",
        "fr": {
            "name": "Puissance des anciens"
        }
    },
    {
        "cardImage": "LOE_110.png",
        "cost": 4,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Slawomir Maniak",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Ombre ancienne"
        },
        "flavor": "Warning: Do not expose to direct sunlight.",
        "attack": 7,
        "name": "Ancient Shade",
        "id": "LOE_110",
        "text": "<b>Battlecry:</b> Shuffle an 'Ancient Curse' into your deck that deals 7 damage to you when drawn.",
        "rarity": "Rare"
    },
    {
        "cardImage": "LOEA06_03.png",
        "cost": 2,
        "set": "League of Explorers",
        "name": "Animate Earthen",
        "id": "LOEA06_03",
        "text": "Give your minions +1/+1 and <b>Taunt</b>.",
        "type": "Spell",
        "fr": {
            "name": "Terrestre animé"
        }
    },
    {
        "cardImage": "LOEA06_03h.png",
        "cost": 2,
        "set": "League of Explorers",
        "name": "Animate Earthen",
        "id": "LOEA06_03h",
        "text": "Give your minions +3/+3 and <b>Taunt</b>.",
        "type": "Spell",
        "fr": {
            "name": "Terrestre animé"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Animated",
        "id": "LOEA06_03e",
        "text": "+1/+1 and <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Animé"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Animated",
        "id": "LOEA06_03eh",
        "text": "+3/+3 and <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Animé"
        }
    },
    {
        "cardImage": "LOE_119.png",
        "cost": 4,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Mike Sass",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Armure animée"
        },
        "flavor": "Try putting it on.  Wait, let me get my camera.",
        "playerClass": "Mage",
        "attack": 4,
        "name": "Animated Armor",
        "id": "LOE_119",
        "text": "Your hero can only take 1 damage at a time.",
        "rarity": "Rare"
    },
    {
        "cardImage": "LOEA04_27.png",
        "cost": 1,
        "set": "League of Explorers",
        "attack": 10,
        "name": "Animated Statue",
        "health": 10,
        "id": "LOEA04_27",
        "text": "You've disturbed the ancient statue...",
        "type": "Minion",
        "fr": {
            "name": "Statue animée"
        }
    },
    {
        "cardImage": "LOEA16_17.png",
        "cost": 10,
        "set": "League of Explorers",
        "attack": 10,
        "name": "Animated Statue",
        "health": 10,
        "id": "LOEA16_17",
        "type": "Minion",
        "fr": {
            "name": "Statue animée"
        }
    },
    {
        "cardImage": "LOE_061.png",
        "cost": 5,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Paul Mafayon",
        "health": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Sentinelle Anubisath"
        },
        "flavor": "He's actually a 1/1 who picked up the hammer from the last guy.",
        "attack": 4,
        "name": "Anubisath Sentinel",
        "id": "LOE_061",
        "text": "<b>Deathrattle:</b> Give a random friendly minion +3/+3.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA04_24h.png",
        "cost": 8,
        "set": "League of Explorers",
        "attack": 6,
        "name": "Anubisath Temple Guard",
        "health": 15,
        "id": "LOEA04_24h",
        "type": "Minion",
        "fr": {
            "name": "Garde du temple anubisath"
        }
    },
    {
        "cardImage": "LOEA04_24.png",
        "cost": 8,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Anubisath Temple Guard",
        "health": 10,
        "id": "LOEA04_24",
        "type": "Minion",
        "fr": {
            "name": "Garde du temple anubisath"
        }
    },
    {
        "cardImage": "LOE_026.png",
        "cost": 10,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Ryan Metcalf",
        "type": "Spell",
        "fr": {
            "name": "Tous les murlocs de ta vie"
        },
        "flavor": "Theme song by Ellie Goldfin and Blagghghlrlrl Harris.",
        "playerClass": "Paladin",
        "name": "Anyfin Can Happen",
        "id": "LOE_026",
        "text": "Summon 7 Murlocs that died this game.",
        "rarity": "Rare"
    },
    {
        "cardImage": "LOE_092.png",
        "cost": 9,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Alex Horley Orlandelli",
        "health": 8,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Prince voleur Rafaam"
        },
        "flavor": "He's very good at retrieving artifacts.  From other people's museums.",
        "elite": true,
        "attack": 7,
        "name": "Arch-Thief Rafaam",
        "id": "LOE_092",
        "text": "<b>Battlecry: Discover</b> a powerful Artifact.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "LOEA16_22.png",
        "elite": true,
        "cost": 5,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Archaedas",
        "health": 5,
        "id": "LOEA16_22",
        "text": "At the end of your turn, turn a random enemy minion into a 0/2 Statue.",
        "type": "Minion",
        "fr": {
            "name": "Archaedas"
        }
    },
    {
        "cardImage": "LOEA08_01.png",
        "set": "League of Explorers",
        "name": "Archaedas",
        "health": 30,
        "id": "LOEA08_01",
        "type": "Hero",
        "fr": {
            "name": "Archaedas"
        }
    },
    {
        "cardImage": "LOEA16_22H.png",
        "elite": true,
        "cost": 10,
        "set": "League of Explorers",
        "attack": 10,
        "name": "Archaedas",
        "health": 10,
        "id": "LOEA16_22H",
        "text": "At the end of your turn, turn a random enemy minion into a 0/2 Statue.",
        "type": "Minion",
        "fr": {
            "name": "Archaedas"
        }
    },
    {
        "cardImage": "LOEA07_21.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Barrel Forward",
        "id": "LOEA07_21",
        "text": "Get 1 turn closer to the Exit!",
        "type": "Spell",
        "fr": {
            "name": "Foncer en avant"
        }
    },
    {
        "cardImage": "LOEA16_7.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Benediction Splinter",
        "id": "LOEA16_7",
        "text": "Restore #10 Health to ALL characters.",
        "type": "Spell",
        "fr": {
            "name": "Esquille de bénédiction"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Blessed",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "LOEA16_20e",
        "text": "<b>Immune</b> this turn.",
        "type": "Enchantment",
        "fr": {
            "name": "Béni"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Blessing of the Sun",
        "id": "LOEA16_20H",
        "text": "<b>Immune</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Bénédiction du soleil"
        }
    },
    {
        "cardImage": "LOEA16_20.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Blessing of the Sun",
        "id": "LOEA16_20",
        "text": "Give a minion <b>Immune</b> this turn.",
        "type": "Spell",
        "fr": {
            "name": "Bénédiction du soleil"
        }
    },
    {
        "cardImage": "LOEA01_02h.png",
        "set": "League of Explorers",
        "name": "Blessings of the Sun",
        "id": "LOEA01_02h",
        "text": "<b>Passive Hero Power</b>\n Phaerix is <b>Immune</b> while he controls the Rod of the Sun.",
        "type": "Hero Power",
        "fr": {
            "name": "Bénédictions du soleil"
        }
    },
    {
        "cardImage": "LOEA01_02.png",
        "set": "League of Explorers",
        "name": "Blessings of the Sun",
        "id": "LOEA01_02",
        "text": "<b>Passive Hero Power</b>\nWhoever controls the Rod of the Sun is <b>Immune.</b>",
        "type": "Hero Power",
        "fr": {
            "name": "Bénédictions du soleil"
        }
    },
    {
        "cardImage": "LOEA15_3.png",
        "cost": 3,
        "set": "League of Explorers",
        "attack": 2,
        "name": "Boneraptor",
        "health": 2,
        "id": "LOEA15_3",
        "text": "<b>Battlecry:</b>Take control of your opponent's weapon.",
        "type": "Minion",
        "fr": {
            "name": "Raptor d’os"
        }
    },
    {
        "cardImage": "LOEA15_3H.png",
        "cost": 3,
        "set": "League of Explorers",
        "attack": 2,
        "name": "Boneraptor",
        "health": 2,
        "id": "LOEA15_3H",
        "text": "<b>Battlecry:</b>Take control of your opponent's weapon.",
        "type": "Minion",
        "fr": {
            "name": "Raptor d’os"
        }
    },
    {
        "cardImage": "LOEA07_20.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Boom!",
        "id": "LOEA07_20",
        "text": "Deal 3 damage to all enemy minions.",
        "type": "Spell",
        "fr": {
            "name": "Boum !"
        }
    },
    {
        "cardImage": "LOE_077.png",
        "cost": 3,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Sam Nielson",
        "health": 4,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Brann Barbe-de-Bronze"
        },
        "flavor": "Contains 75% more fiber than his brother Magni!",
        "elite": true,
        "attack": 2,
        "name": "Brann Bronzebeard",
        "id": "LOE_077",
        "text": "Your <b>Battlecries</b> trigger twice.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "LOEA09_7H.png",
        "cost": 0,
        "set": "League of Explorers",
        "attack": 0,
        "name": "Cauldron",
        "health": 10,
        "mechanics": [
            "Deathrattle",
            "Taunt"
        ],
        "id": "LOEA09_7H",
        "text": "<b>Taunt</b>\n<b>Deathrattle:</b> Save Sir Finley!",
        "type": "Minion",
        "fr": {
            "name": "Chaudron"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Cauldron",
        "id": "LOEA09_7e",
        "type": "Enchantment",
        "fr": {
            "name": "Chaudron"
        }
    },
    {
        "cardImage": "LOEA09_7.png",
        "cost": 0,
        "set": "League of Explorers",
        "attack": 0,
        "name": "Cauldron",
        "health": 5,
        "mechanics": [
            "Deathrattle",
            "Taunt"
        ],
        "id": "LOEA09_7",
        "text": "<b>Taunt</b>\n<b>Deathrattle:</b> Save Sir Finley and stop the Naga onslaught!",
        "type": "Minion",
        "fr": {
            "name": "Chaudron"
        }
    },
    {
        "cardImage": "LOEA07_09.png",
        "cost": 4,
        "set": "League of Explorers",
        "attack": 2,
        "name": "Chasing Trogg",
        "health": 6,
        "id": "LOEA07_09",
        "type": "Minion",
        "fr": {
            "name": "Trogg en chasse"
        }
    },
    {
        "cardImage": "LOEA05_01.png",
        "set": "League of Explorers",
        "name": "Chieftain Scarvash",
        "health": 30,
        "id": "LOEA05_01",
        "type": "Hero",
        "fr": {
            "name": "Chef Scarvash"
        }
    },
    {
        "cardImage": "LOEA16_21.png",
        "elite": true,
        "cost": 5,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Chieftain Scarvash",
        "health": 5,
        "mechanics": [
            "Aura"
        ],
        "id": "LOEA16_21",
        "text": "Enemy cards cost (1) more.",
        "type": "Minion",
        "fr": {
            "name": "Chef Scarvash"
        }
    },
    {
        "cardImage": "LOEA16_21H.png",
        "elite": true,
        "cost": 10,
        "set": "League of Explorers",
        "attack": 10,
        "name": "Chieftain Scarvash",
        "health": 10,
        "mechanics": [
            "Aura"
        ],
        "id": "LOEA16_21H",
        "text": "Enemy cards cost (2) more.",
        "type": "Minion",
        "fr": {
            "name": "Chef Scarvash"
        }
    },
    {
        "cardImage": "LOEA07_26.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Consult Brann",
        "id": "LOEA07_26",
        "text": "Draw 3 cards.",
        "type": "Spell",
        "fr": {
            "name": "Consulter Brann"
        }
    },
    {
        "cardImage": "LOEA16_11.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Crown of Kael'thas",
        "id": "LOEA16_11",
        "text": "Deal $10 damage randomly split among ALL characters.",
        "type": "Spell",
        "fr": {
            "name": "Couronne de Kael’thas"
        }
    },
    {
        "cardImage": "LOE_007.png",
        "cost": 2,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Alex Horley Orlandelli",
        "type": "Spell",
        "fr": {
            "name": "Malédiction de Rafaam"
        },
        "flavor": "This is what happens when Rafaam stubs his toe unexpectedly.",
        "playerClass": "Warlock",
        "name": "Curse of Rafaam",
        "id": "LOE_007",
        "text": "Give your opponent a 'Cursed!' card.\nWhile they hold it, they take 2 damage on their turn.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_118.png",
        "cost": 1,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Craig Mullins",
        "durability": 3,
        "type": "Weapon",
        "fr": {
            "name": "Lame maudite"
        },
        "flavor": "The Curse is that you have to listen to \"MMMBop\" on repeat.",
        "playerClass": "Warrior",
        "attack": 2,
        "name": "Cursed Blade",
        "id": "LOE_118",
        "text": "Double all damage dealt to your hero.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Warrior",
        "set": "League of Explorers",
        "name": "Cursed Blade",
        "id": "LOE_118e",
        "text": "Double all damage dealt to your hero.",
        "type": "Enchantment",
        "fr": {
            "name": "Lame maudite"
        }
    },
    {
        "cardImage": "LOE_007t.png",
        "playerClass": "Warlock",
        "cost": 2,
        "set": "League of Explorers",
        "artist": "Jim Nelson",
        "name": "Cursed!",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "LOE_007t",
        "text": "While this is in your hand, take 2 damage at the start of your turn.",
        "type": "Spell",
        "fr": {
            "name": "Maudit !"
        }
    },
    {
        "cardImage": "LOE_023.png",
        "cost": 2,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "George Davis",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Sinistre colporteur"
        },
        "flavor": "I'm offering you a bargain here!  This amazing vacuum cleaner for your soul!",
        "playerClass": "Warlock",
        "attack": 2,
        "name": "Dark Peddler",
        "id": "LOE_023",
        "text": "<b>Battlecry: Discover</b> a\n1-Cost card.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_021.png",
        "cost": 2,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Zoltan Boros",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Piège de fléchettes"
        },
        "flavor": "Five years of tap-dancing lessons are FINALLY going to pay off!",
        "playerClass": "Hunter",
        "name": "Dart Trap",
        "id": "LOE_021",
        "text": "<b>Secret:</b> When an opposing Hero Power is used, deal 5 damage to a random enemy.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA07_11.png",
        "cost": 1,
        "set": "League of Explorers",
        "attack": 0,
        "name": "Debris",
        "health": 3,
        "mechanics": [
            "Taunt"
        ],
        "id": "LOEA07_11",
        "text": "<b>Taunt.</b>",
        "type": "Minion",
        "fr": {
            "name": "Débris"
        }
    },
    {
        "cardImage": "LOE_020.png",
        "cost": 3,
        "collectible": true,
        "set": "League of Explorers",
        "race": "Beast",
        "artist": "Matt Dixon",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Dromadaire du désert"
        },
        "flavor": "Dang.  This card is sweet.  Almost as sweet as Dessert Camel.",
        "playerClass": "Hunter",
        "attack": 2,
        "name": "Desert Camel",
        "id": "LOE_020",
        "text": "<b>Battlecry:</b> Put a 1-Cost minion from each deck into the battlefield.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA02_02.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Djinn’s Intuition",
        "id": "LOEA02_02",
        "text": "Draw a card.\nGive your opponent a Wish.",
        "type": "Hero Power",
        "fr": {
            "name": "Intuition de djinn"
        }
    },
    {
        "cardImage": "LOEA02_02h.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Djinn’s Intuition",
        "id": "LOEA02_02h",
        "text": "Draw a card. Gain a Mana Crystal. Give your opponent a Wish.",
        "type": "Hero Power",
        "fr": {
            "name": "Intuition de djinn"
        }
    },
    {
        "cardImage": "LOE_053.png",
        "cost": 5,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Jakub Kasper",
        "health": 6,
        "type": "Minion",
        "fr": {
            "name": "Djinn des zéphirs"
        },
        "flavor": "If you want your wish granted, don't rub him the wrong way.",
        "attack": 4,
        "name": "Djinni of Zephyrs",
        "id": "LOE_053",
        "text": "Whenever you cast a spell on another friendly minion, cast a copy of it on this one.",
        "rarity": "Epic"
    },
    {
        "cardImage": "LOEA04_28a.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Drink Deeply",
        "id": "LOEA04_28a",
        "text": "Draw a card.",
        "type": "Spell",
        "fr": {
            "name": "Boire à grands traits"
        }
    },
    {
        "cardImage": "LOEA07_18.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Dynamite",
        "id": "LOEA07_18",
        "text": "Deal $10 damage.",
        "type": "Spell",
        "fr": {
            "name": "Dynamite"
        }
    },
    {
        "cardImage": "LOEA07_12.png",
        "cost": 5,
        "set": "League of Explorers",
        "attack": 4,
        "name": "Earthen Pursuer",
        "health": 6,
        "id": "LOEA07_12",
        "type": "Minion",
        "fr": {
            "name": "Poursuivant terrestre"
        }
    },
    {
        "cardImage": "LOEA06_02t.png",
        "cost": 1,
        "set": "League of Explorers",
        "attack": 0,
        "name": "Earthen Statue",
        "health": 2,
        "id": "LOEA06_02t",
        "type": "Minion",
        "fr": {
            "name": "Statue de terrestre"
        }
    },
    {
        "cardImage": "LOEA06_02th.png",
        "cost": 1,
        "set": "League of Explorers",
        "attack": 0,
        "name": "Earthen Statue",
        "health": 5,
        "id": "LOEA06_02th",
        "type": "Minion",
        "fr": {
            "name": "Statue de terrestre"
        }
    },
    {
        "cardImage": "LOE_107.png",
        "cost": 4,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Jim Nelson",
        "health": 7,
        "type": "Minion",
        "fr": {
            "name": "Statue sinistre"
        },
        "flavor": "Don't blink!  Don't turn your back, don't look away, and DON'T BLINK.",
        "attack": 7,
        "name": "Eerie Statue",
        "id": "LOE_107",
        "text": "Can’t attack unless it’s the only minion in the battlefield.",
        "rarity": "Rare"
    },
    {
        "cardImage": "LOE_079.png",
        "cost": 4,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Luke Mancini",
        "health": 5,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Élise Cherchétoile"
        },
        "flavor": "A large part of her job entails not mixing up the Map to the Golden Monkey with the Map to Monkey Island.",
        "elite": true,
        "attack": 3,
        "name": "Elise Starseeker",
        "id": "LOE_079",
        "text": "<b>Battlecry:</b> Shuffle the 'Map to the Golden Monkey'   into your deck.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "LOEA09_3H.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Endless Hunger",
        "id": "LOEA09_3H",
        "text": "<b>Hero Power</b>\nSummon a Hungry Naga.",
        "type": "Hero Power",
        "fr": {
            "name": "Faim sans fin"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Enraged",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "LOEA09_2eH",
        "text": "+5 Attack",
        "type": "Enchantment",
        "fr": {
            "name": "Enragé"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Enraged",
        "mechanics": [
            "OneTurnEffect"
        ],
        "id": "LOEA09_2e",
        "text": "+2 Attack",
        "type": "Enchantment",
        "fr": {
            "name": "Enragé"
        }
    },
    {
        "cardImage": "LOEA09_2H.png",
        "cost": 2,
        "set": "League of Explorers",
        "name": "Enraged!",
        "id": "LOEA09_2H",
        "text": "Give your hero +5 attack this turn.",
        "type": "Hero Power",
        "fr": {
            "name": "Enragé !"
        }
    },
    {
        "cardImage": "LOEA09_2.png",
        "cost": 2,
        "set": "League of Explorers",
        "name": "Enraged!",
        "id": "LOEA09_2",
        "text": "Give your hero +2 attack this turn.",
        "type": "Hero Power",
        "fr": {
            "name": "Enragé !"
        }
    },
    {
        "cardImage": "LOE_104.png",
        "cost": 6,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Alex Konstad",
        "type": "Spell",
        "fr": {
            "name": "Ensevelir"
        },
        "flavor": "It's perfectly safe as long as you remember to put in air holes.",
        "playerClass": "Priest",
        "name": "Entomb",
        "id": "LOE_104",
        "text": "Choose an enemy minion.\nShuffle it into your deck.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA04_02.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Escape!",
        "id": "LOEA04_02",
        "text": "Encounter new obstacles!",
        "type": "Hero Power",
        "fr": {
            "name": "Fuyez !"
        },
        "rarity": "Free"
    },
    {
        "cardImage": "LOEA04_02h.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Escape!",
        "id": "LOEA04_02h",
        "text": "Encounter new obstacles!",
        "type": "Hero Power",
        "fr": {
            "name": "Fuyez !"
        }
    },
    {
        "cardImage": "LOE_003.png",
        "cost": 5,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Ben Zhang",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Adjurateur éthérien"
        },
        "flavor": "Despite the name, he's a solid conjurer.",
        "playerClass": "Mage",
        "attack": 6,
        "name": "Ethereal Conjurer",
        "id": "LOE_003",
        "text": "<b>Battlecry: Discover</b> a spell.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_113.png",
        "cost": 7,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Andrius Matijoshius",
        "type": "Spell",
        "fr": {
            "name": "Tout est vraiment génial"
        },
        "flavor": "Everyfin is cool when you're part of a murloc team!",
        "playerClass": "Shaman",
        "name": "Everyfin is Awesome",
        "id": "LOE_113",
        "text": "Give your minions +2/+2.\nCosts (1) less for each Murloc you control.",
        "rarity": "Rare"
    },
    {
        "cardImage": "LOE_111.png",
        "cost": 5,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Raymond Swanland",
        "type": "Spell",
        "fr": {
            "name": "Mal déterré"
        },
        "flavor": "MOM! DAD! DON'T TOUCH IT! IT'S EVIL!!!!!!",
        "playerClass": "Priest",
        "name": "Excavated Evil",
        "id": "LOE_111",
        "text": "Deal $3 damage to all minions.\nShuffle this card into your opponent's deck.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Hunter",
        "set": "League of Explorers",
        "name": "Explorer's Hat",
        "id": "LOE_105e",
        "text": "+1/+1. <b>Deathrattle:</b> Add an Explorer's Hat to your hand.",
        "type": "Enchantment",
        "fr": {
            "name": "Chapeau d’explorateur"
        }
    },
    {
        "cardImage": "LOE_105.png",
        "cost": 2,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Joe Wilson",
        "type": "Spell",
        "fr": {
            "name": "Chapeau d’explorateur"
        },
        "flavor": "Harrison Jones was disappointed that he didn't get to be part of the League of Explorers, but his hat did.",
        "playerClass": "Hunter",
        "name": "Explorer's Hat",
        "id": "LOE_105",
        "text": "Give a minion +1/+1 and \"<b>Deathrattle:</b> Add an Explorer's Hat to your hand.\"",
        "rarity": "Rare"
    },
    {
        "flavor": "-",
        "cardImage": "LOE_008.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Eye of Hakkar",
        "id": "LOE_008",
        "text": "Take a secret from your opponent's deck and put it into the battlefield.",
        "type": "Spell",
        "fr": {
            "name": "Œil d’Hakkar"
        }
    },
    {
        "cardImage": "LOE_008H.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Eye of Hakkar",
        "id": "LOE_008H",
        "text": "Take a secret from your opponent's deck and put it into the battlefield.",
        "type": "Spell",
        "fr": {
            "name": "Œil d’Hakkar"
        }
    },
    {
        "cardImage": "LOEA16_13.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Eye of Orsis",
        "id": "LOEA16_13",
        "text": "<b>Discover</b> a minion and gain 3 copies of it.",
        "type": "Spell",
        "fr": {
            "name": "Œil d’Orsis"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Famished",
        "id": "LOEA09_3aH",
        "text": "Quite Hungry.",
        "type": "Enchantment",
        "fr": {
            "name": "Mort de faim"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Famished",
        "id": "LOEA09_3a",
        "text": "Quite Hungry.",
        "type": "Enchantment",
        "fr": {
            "name": "Mort de faim"
        }
    },
    {
        "cardImage": "LOE_022.png",
        "cost": 3,
        "collectible": true,
        "set": "League of Explorers",
        "race": "Beast",
        "artist": "Peter Stapleton",
        "health": 4,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Singe féroce"
        },
        "flavor": "Fierce monkey.  That funky monkey.",
        "playerClass": "Warrior",
        "attack": 3,
        "name": "Fierce Monkey",
        "id": "LOE_022",
        "text": "<b>Taunt</b>",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA07_03h.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Flee the Mine!",
        "id": "LOEA07_03h",
        "text": "Escape the Troggs!",
        "type": "Hero Power",
        "fr": {
            "name": "Fuir la mine !"
        }
    },
    {
        "cardImage": "LOEA07_03.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Flee the Mine!",
        "id": "LOEA07_03",
        "text": "Escape the Troggs!",
        "type": "Hero Power",
        "fr": {
            "name": "Fuir la mine !"
        }
    },
    {
        "cardImage": "LOE_002.png",
        "cost": 3,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Richard Wright",
        "type": "Spell",
        "fr": {
            "name": "Torche oubliée"
        },
        "flavor": "Why does a forgotten torch turn into a roaring torch with no provocation?  It's one of life's many mysteries.",
        "playerClass": "Mage",
        "name": "Forgotten Torch",
        "id": "LOE_002",
        "text": "Deal $3 damage. Shuffle a 'Roaring Torch' into your deck that deals 6 damage.",
        "rarity": "Common"
    },
    {
        "set": "League of Explorers",
        "name": "Fossilized",
        "id": "LOE_073e",
        "text": "Has <b>Taunt</b>.",
        "type": "Enchantment",
        "fr": {
            "name": "Fossilisé"
        }
    },
    {
        "cardImage": "LOE_073.png",
        "cost": 8,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Trent Kaniuga",
        "health": 8,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Diablosaure fossilisé"
        },
        "flavor": "This was the only job he could get after the dinosaur theme park debacle.",
        "attack": 8,
        "name": "Fossilized Devilsaur",
        "id": "LOE_073",
        "text": "<b>Battlecry:</b> If you control a Beast, gain <b>Taunt</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA09_3b.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Getting Hungry",
        "id": "LOEA09_3b",
        "text": "<b>Hero Power</b>\nSummon a 1/1 Hungry Naga.",
        "type": "Hero Power",
        "fr": {
            "name": "Faim"
        }
    },
    {
        "cardImage": "LOEA09_3.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Getting Hungry",
        "id": "LOEA09_3",
        "text": "<b>Hero Power</b>\nSummon a Hungry Naga.",
        "type": "Hero Power",
        "fr": {
            "name": "Faim"
        }
    },
    {
        "cardImage": "LOEA09_3c.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Getting Hungry",
        "id": "LOEA09_3c",
        "text": "<b>Hero Power</b>\nSummon a 2/1 Hungry Naga.",
        "type": "Hero Power",
        "fr": {
            "name": "Faim"
        }
    },
    {
        "cardImage": "LOEA09_3d.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Getting Hungry",
        "id": "LOEA09_3d",
        "text": "<b>Hero Power</b>\nSummon a 5/1 Hungry Naga.",
        "type": "Hero Power",
        "fr": {
            "name": "Faim"
        }
    },
    {
        "cardImage": "LOEA04_23h.png",
        "cost": 7,
        "set": "League of Explorers",
        "attack": 10,
        "name": "Giant Insect",
        "health": 6,
        "id": "LOEA04_23h",
        "type": "Minion",
        "fr": {
            "name": "Insecte géant"
        }
    },
    {
        "cardImage": "LOEA04_23.png",
        "cost": 7,
        "set": "League of Explorers",
        "attack": 10,
        "name": "Giant Insect",
        "health": 3,
        "id": "LOEA04_23",
        "type": "Minion",
        "fr": {
            "name": "Insecte géant"
        }
    },
    {
        "cardImage": "LOEA10_1.png",
        "set": "League of Explorers",
        "name": "Giantfin",
        "health": 30,
        "id": "LOEA10_1",
        "type": "Hero",
        "fr": {
            "name": "Aileron-Géant"
        }
    },
    {
        "cardImage": "LOEA16_24H.png",
        "elite": true,
        "cost": 10,
        "set": "League of Explorers",
        "race": "Murloc",
        "attack": 10,
        "name": "Giantfin",
        "health": 10,
        "id": "LOEA16_24H",
        "text": "At the end of your turn, draw 2 cards.",
        "type": "Minion",
        "fr": {
            "name": "Aileron-Géant"
        }
    },
    {
        "cardImage": "LOEA16_24.png",
        "elite": true,
        "cost": 5,
        "set": "League of Explorers",
        "race": "Murloc",
        "attack": 5,
        "name": "Giantfin",
        "health": 5,
        "id": "LOEA16_24",
        "text": "At the end of your turn, draw until you have as many cards as your opponent.",
        "type": "Minion",
        "fr": {
            "name": "Aileron-Géant"
        }
    },
    {
        "cardImage": "LOE_019t2.png",
        "cost": 4,
        "set": "League of Explorers",
        "artist": "A.J. Nazzaro",
        "attack": 6,
        "name": "Golden Monkey",
        "health": 6,
        "mechanics": [
            "Battlecry",
            "Taunt"
        ],
        "id": "LOE_019t2",
        "text": "<b>Taunt</b>\n<b>Battlecry:</b> Replace your hand and deck with <b>Legendary</b> minions.",
        "type": "Minion",
        "fr": {
            "name": "Singe doré"
        }
    },
    {
        "cardImage": "LOE_039.png",
        "cost": 4,
        "collectible": true,
        "set": "League of Explorers",
        "race": "Mech",
        "artist": "Skan Srisuwan",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Gorillobot A-3"
        },
        "flavor": "A-1 and A-2 went nuts, when they should have gone bolts.",
        "attack": 3,
        "name": "Gorillabot A-3",
        "id": "LOE_039",
        "text": "<b>Battlecry:</b> If you control another Mech, <b>Discover</b> a Mech.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_089t3.png",
        "cost": 2,
        "set": "League of Explorers",
        "artist": "Matt Dixon",
        "attack": 2,
        "name": "Grumbly Runt",
        "health": 2,
        "id": "LOE_089t3",
        "type": "Minion",
        "fr": {
            "name": "Avorton grognon"
        }
    },
    {
        "cardImage": "LOEA16_10.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Hakkari Blood Goblet",
        "id": "LOEA16_10",
        "text": "Transform a minion into a 2/1 Pit Snake.",
        "type": "Spell",
        "fr": {
            "name": "Coupe de sang hakkari"
        }
    },
    {
        "cardImage": "LOEA08_01h.png",
        "set": "League of Explorers",
        "name": "Heroic Archaedas",
        "health": 30,
        "id": "LOEA08_01h",
        "type": "Hero",
        "fr": {
            "name": "Archaedas (héroïque)"
        }
    },
    {
        "cardImage": "LOEA04_01h.png",
        "set": "League of Explorers",
        "name": "Heroic Escape",
        "health": 100,
        "id": "LOEA04_01h",
        "type": "Hero",
        "fr": {
            "name": "Fuite (héroïque)"
        }
    },
    {
        "cardImage": "LOEA10_1H.png",
        "set": "League of Explorers",
        "name": "Heroic Giantfin",
        "health": 30,
        "id": "LOEA10_1H",
        "type": "Hero",
        "fr": {
            "name": "Aileron-Géant (héroïque)"
        }
    },
    {
        "cardImage": "LOEA07_02h.png",
        "set": "League of Explorers",
        "name": "Heroic Mine Shaft",
        "health": 80,
        "id": "LOEA07_02h",
        "type": "Hero",
        "fr": {
            "name": "Puits de mine (héroïque)"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Heroic Mode",
        "id": "LOEA01_11he",
        "text": "+3/+3 if Phaerix controls the Rod.",
        "type": "Enchantment",
        "fr": {
            "name": "Mode héroïque"
        }
    },
    {
        "cardImage": "LOEA12_1H.png",
        "set": "League of Explorers",
        "name": "Heroic Naz'jar",
        "health": 30,
        "id": "LOEA12_1H",
        "type": "Hero",
        "fr": {
            "name": "Naz’jar (héroïque)"
        }
    },
    {
        "cardImage": "LOEA01_01h.png",
        "set": "League of Explorers",
        "name": "Heroic Phaerix",
        "health": 30,
        "id": "LOEA01_01h",
        "type": "Hero",
        "fr": {
            "name": "Phaerix (héroïque)"
        }
    },
    {
        "cardImage": "LOEA15_1H.png",
        "set": "League of Explorers",
        "name": "Heroic Rafaam",
        "health": 30,
        "id": "LOEA15_1H",
        "type": "Hero",
        "fr": {
            "name": "Rafaam (héroïque)"
        }
    },
    {
        "cardImage": "LOEA16_1H.png",
        "set": "League of Explorers",
        "name": "Heroic Rafaam",
        "health": 30,
        "id": "LOEA16_1H",
        "type": "Hero",
        "fr": {
            "name": "Rafaam (héroïque)"
        }
    },
    {
        "cardImage": "LOEA05_01h.png",
        "set": "League of Explorers",
        "name": "Heroic Scarvash",
        "health": 30,
        "id": "LOEA05_01h",
        "type": "Hero",
        "fr": {
            "name": "Scarvash (héroïque)"
        }
    },
    {
        "cardImage": "LOEA14_1H.png",
        "set": "League of Explorers",
        "name": "Heroic Sentinel",
        "health": 30,
        "id": "LOEA14_1H",
        "type": "Hero",
        "fr": {
            "name": "Sentinelle (héroïque)"
        }
    },
    {
        "cardImage": "LOEA13_1h.png",
        "set": "League of Explorers",
        "name": "Heroic Skelesaurus",
        "health": 30,
        "id": "LOEA13_1h",
        "type": "Hero",
        "fr": {
            "name": "Squeletosaurus Hex (héroïque)"
        }
    },
    {
        "cardImage": "LOEA09_1H.png",
        "set": "League of Explorers",
        "name": "Heroic Slitherspear",
        "health": 30,
        "id": "LOEA09_1H",
        "type": "Hero",
        "fr": {
            "name": "Ondulance (héroïque)"
        }
    },
    {
        "cardImage": "LOEA02_01h.png",
        "set": "League of Explorers",
        "name": "Heroic Zinaar",
        "health": 30,
        "id": "LOEA02_01h",
        "type": "Hero",
        "fr": {
            "name": "Zinaar (héroïque)"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Hollow",
        "id": "LOE_030e",
        "text": "Stats copied.",
        "type": "Enchantment",
        "fr": {
            "name": "Trompeur"
        }
    },
    {
        "cardImage": "LOE_046.png",
        "cost": 2,
        "collectible": true,
        "set": "League of Explorers",
        "race": "Beast",
        "artist": "Matt Dixon",
        "health": 2,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Crapaud énorme"
        },
        "flavor": "Deals damage when he croaks.",
        "attack": 3,
        "name": "Huge Toad",
        "id": "LOE_046",
        "text": "<b>Deathrattle:</b> Deal 1 damage to a random enemy.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA09_12.png",
        "cost": 4,
        "set": "League of Explorers",
        "attack": 2,
        "name": "Hungry Naga",
        "health": 1,
        "id": "LOEA09_12",
        "type": "Minion",
        "fr": {
            "name": "Naga affamé"
        }
    },
    {
        "cardImage": "LOEA09_5.png",
        "cost": 1,
        "set": "League of Explorers",
        "attack": 1,
        "name": "Hungry Naga",
        "health": 1,
        "id": "LOEA09_5",
        "type": "Minion",
        "fr": {
            "name": "Naga affamé"
        }
    },
    {
        "cardImage": "LOEA09_11.png",
        "cost": 3,
        "set": "League of Explorers",
        "attack": 1,
        "name": "Hungry Naga",
        "health": 1,
        "id": "LOEA09_11",
        "type": "Minion",
        "fr": {
            "name": "Naga affamé"
        }
    },
    {
        "cardImage": "LOEA09_5H.png",
        "cost": 3,
        "set": "League of Explorers",
        "attack": 3,
        "name": "Hungry Naga",
        "health": 3,
        "id": "LOEA09_5H",
        "type": "Minion",
        "fr": {
            "name": "Naga affamé"
        }
    },
    {
        "cardImage": "LOEA09_13.png",
        "cost": 5,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Hungry Naga",
        "health": 1,
        "id": "LOEA09_13",
        "type": "Minion",
        "fr": {
            "name": "Naga affamé"
        }
    },
    {
        "cardImage": "LOEA09_10.png",
        "cost": 2,
        "set": "League of Explorers",
        "attack": 2,
        "name": "Hungry Naga",
        "health": 1,
        "id": "LOEA09_10",
        "type": "Minion",
        "fr": {
            "name": "Naga affamé"
        }
    },
    {
        "cardImage": "LOEA04_29b.png",
        "set": "League of Explorers",
        "name": "Investigate the Runes",
        "id": "LOEA04_29b",
        "text": "Draw 2 cards.",
        "type": "Spell",
        "fr": {
            "name": "Examiner les runes"
        }
    },
    {
        "cardImage": "LOE_029.png",
        "cost": 2,
        "collectible": true,
        "set": "League of Explorers",
        "race": "Beast",
        "artist": "Jaemin Kim",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Scarabée orné de joyaux"
        },
        "flavor": "It's amazing what you can do with super glue!",
        "attack": 1,
        "name": "Jeweled Scarab",
        "id": "LOE_029",
        "text": "<b>Battlecry: Discover</b> a\n3-Cost card.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_051.png",
        "cost": 4,
        "collectible": true,
        "set": "League of Explorers",
        "race": "Beast",
        "artist": "Mike Sass",
        "health": 4,
        "type": "Minion",
        "fr": {
            "name": "Sélénien de la jungle"
        },
        "flavor": "The REAL angry chicken!",
        "playerClass": "Druid",
        "attack": 4,
        "name": "Jungle Moonkin",
        "id": "LOE_051",
        "text": "Both players have\n<b>Spell Damage +2</b>.",
        "rarity": "Rare"
    },
    {
        "cardImage": "LOE_017.png",
        "cost": 4,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "James Ryman",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Gardienne d’Uldaman"
        },
        "flavor": "U da man!  No, U da man!",
        "playerClass": "Paladin",
        "attack": 3,
        "name": "Keeper of Uldaman",
        "id": "LOE_017",
        "text": "<b>Battlecry:</b> Set a minion's Attack and Health to 3.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA16_14.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Khadgar's Pipe",
        "id": "LOEA16_14",
        "text": "Put a random spell into each player's hand.  Yours costs (0).",
        "type": "Spell",
        "fr": {
            "name": "Pipe de Khadgar"
        }
    },
    {
        "cardImage": "LOEA12_1.png",
        "set": "League of Explorers",
        "name": "Lady Naz'jar",
        "health": 30,
        "id": "LOEA12_1",
        "type": "Hero",
        "fr": {
            "name": "Dame Naz’jar"
        }
    },
    {
        "cardImage": "LOEA16_25.png",
        "elite": true,
        "cost": 5,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Lady Naz'jar",
        "health": 5,
        "id": "LOEA16_25",
        "text": "At the end of your turn, replace all other minions with new ones of the same Cost.",
        "type": "Minion",
        "fr": {
            "name": "Dame Naz’jar"
        }
    },
    {
        "cardImage": "LOEA16_25H.png",
        "elite": true,
        "cost": 10,
        "set": "League of Explorers",
        "attack": 10,
        "name": "Lady Naz'jar",
        "health": 10,
        "id": "LOEA16_25H",
        "text": "At the end of your turn, replace all other minions with new ones of the same Cost.",
        "type": "Minion",
        "fr": {
            "name": "Dame Naz’jar"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Lantern of Power",
        "id": "LOEA16_3e",
        "text": "+10/+10.",
        "type": "Enchantment",
        "fr": {
            "name": "Lanterne de puissance"
        }
    },
    {
        "cardImage": "LOEA16_3.png",
        "cost": 10,
        "set": "League of Explorers",
        "name": "Lantern of Power",
        "id": "LOEA16_3",
        "text": "Give a minion +10/+10.",
        "type": "Spell",
        "fr": {
            "name": "Lanterne de puissance"
        }
    },
    {
        "cardImage": "LOEA02_10a.png",
        "playerClass": "Hunter",
        "cost": 0,
        "set": "League of Explorers",
        "race": "Beast",
        "attack": 2,
        "name": "Leokk",
        "health": 4,
        "id": "LOEA02_10a",
        "text": "Your minions have +1 Attack.",
        "type": "Minion",
        "fr": {
            "name": "Leokk"
        }
    },
    {
        "cardImage": "LOEA_01.png",
        "cost": 3,
        "set": "League of Explorers",
        "name": "Looming Presence",
        "id": "LOEA_01",
        "text": "Draw 2 cards. Gain 4 Armor.",
        "type": "Spell",
        "fr": {
            "name": "Présence menaçante"
        }
    },
    {
        "cardImage": "LOEA_01H.png",
        "cost": 3,
        "set": "League of Explorers",
        "name": "Looming Presence",
        "id": "LOEA_01H",
        "text": "Draw 3 cards. Gain 6 Armor.",
        "type": "Spell",
        "fr": {
            "name": "Présence menaçante"
        }
    },
    {
        "cardImage": "LOEA16_23.png",
        "elite": true,
        "cost": 5,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Lord Slitherspear",
        "health": 5,
        "id": "LOEA16_23",
        "text": "At the end of your turn, summon 1/1 Hungry Naga for each enemy minion.",
        "type": "Minion",
        "fr": {
            "name": "Seigneur Ondulance"
        }
    },
    {
        "cardImage": "LOEA16_23H.png",
        "elite": true,
        "cost": 10,
        "set": "League of Explorers",
        "attack": 10,
        "name": "Lord Slitherspear",
        "health": 10,
        "id": "LOEA16_23H",
        "text": "At the end of your turn, summon 1/1 Hungry Naga for each enemy minion.",
        "type": "Minion",
        "fr": {
            "name": "Seigneur Ondulance"
        }
    },
    {
        "cardImage": "LOEA09_1.png",
        "set": "League of Explorers",
        "name": "Lord Slitherspear",
        "health": 30,
        "id": "LOEA09_1",
        "type": "Hero",
        "fr": {
            "name": "Seigneur Ondulance"
        }
    },
    {
        "cardImage": "LOEA16_9.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Lothar's Left Greave",
        "id": "LOEA16_9",
        "text": "Deal 3 damage to all enemies.",
        "type": "Spell",
        "fr": {
            "name": "Grèves abandonnées de Lothar"
        }
    },
    {
        "cardImage": "LOEA07_14.png",
        "cost": 6,
        "set": "League of Explorers",
        "attack": 6,
        "name": "Lumbering Golem",
        "health": 6,
        "id": "LOEA07_14",
        "type": "Minion",
        "fr": {
            "name": "Golem chancelant"
        }
    },
    {
        "cardImage": "LOE_019t.png",
        "cost": 2,
        "set": "League of Explorers",
        "artist": "Milivoj Ceran",
        "name": "Map to the Golden Monkey",
        "id": "LOE_019t",
        "text": "Shuffle the Golden Monkey into your deck. Draw a card.",
        "type": "Spell",
        "fr": {
            "name": "Carte du singe doré"
        }
    },
    {
        "cardImage": "LOEA07_25.png",
        "cost": 1,
        "set": "League of Explorers",
        "race": "Mech",
        "attack": 3,
        "name": "Mechanical Parrot",
        "health": 6,
        "id": "LOEA07_25",
        "type": "Minion",
        "fr": {
            "name": "Perroquet mécanique"
        }
    },
    {
        "cardImage": "LOEA16_12.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Medivh's Locket",
        "id": "LOEA16_12",
        "text": "Replace your hand with Unstable Portals.",
        "type": "Spell",
        "fr": {
            "name": "Médaillon de Medivh"
        }
    },
    {
        "cardImage": "LOEA07_01.png",
        "set": "League of Explorers",
        "name": "Mine Cart",
        "health": 30,
        "id": "LOEA07_01",
        "type": "Hero",
        "fr": {
            "name": "Chariot de mine"
        }
    },
    {
        "cardImage": "LOEA07_02.png",
        "set": "League of Explorers",
        "name": "Mine Shaft",
        "health": 80,
        "id": "LOEA07_02",
        "type": "Hero",
        "fr": {
            "name": "Puits de mine"
        }
    },
    {
        "cardImage": "LOEA16_5.png",
        "cost": 10,
        "set": "League of Explorers",
        "name": "Mirror of Doom",
        "id": "LOEA16_5",
        "text": "Fill your board with 3/3 Mummy Zombies.",
        "type": "Spell",
        "fr": {
            "name": "Miroir du destin"
        }
    },
    {
        "cardImage": "LOEA02_10c.png",
        "playerClass": "Hunter",
        "cost": 0,
        "set": "League of Explorers",
        "race": "Beast",
        "attack": 4,
        "name": "Misha",
        "health": 4,
        "id": "LOEA02_10c",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Misha"
        }
    },
    {
        "cardImage": "LOE_050.png",
        "cost": 3,
        "collectible": true,
        "set": "League of Explorers",
        "race": "Beast",
        "artist": "Ben Zhang",
        "health": 2,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Raptor de monte"
        },
        "flavor": "Clever girl!",
        "playerClass": "Druid",
        "attack": 3,
        "name": "Mounted Raptor",
        "id": "LOE_050",
        "text": "<b>Deathrattle:</b> Summon a random 1-Cost minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA10_5H.png",
        "cost": 3,
        "set": "League of Explorers",
        "name": "Mrgl Mrgl Nyah Nyah",
        "id": "LOEA10_5H",
        "text": "Summon 5 Murlocs that died this game.",
        "type": "Spell",
        "fr": {
            "name": "Mrgl mrgl niah niah !"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA10_5.png",
        "cost": 5,
        "set": "League of Explorers",
        "name": "Mrgl Mrgl Nyah Nyah",
        "id": "LOEA10_5",
        "text": "Summon 3 Murlocs that died this game.",
        "type": "Spell",
        "fr": {
            "name": "Mrgl mrgl niah niah !"
        },
        "rarity": "Common"
    },
    {
        "set": "League of Explorers",
        "name": "Mrglllraawrrrglrur!",
        "id": "LOE_113e",
        "text": "+2/+2.",
        "type": "Enchantment",
        "fr": {
            "name": "Mrglllroaarrrglrur !"
        }
    },
    {
        "cardImage": "LOEA10_2H.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Mrglmrgl MRGL!",
        "id": "LOEA10_2H",
        "text": "<b>Hero Power</b>\nDraw 2 cards.",
        "type": "Hero Power",
        "fr": {
            "name": "Mrglmrgl MRGL !"
        }
    },
    {
        "cardImage": "LOEA10_2.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Mrglmrgl MRGL!",
        "id": "LOEA10_2",
        "text": "<b>Hero Power</b>\nDraw cards until you have as many in hand as your opponent.",
        "type": "Hero Power",
        "fr": {
            "name": "Mrglmrgl MRGL !"
        }
    },
    {
        "cardImage": "LOEA16_5t.png",
        "cost": 3,
        "set": "League of Explorers",
        "attack": 3,
        "name": "Mummy Zombie",
        "health": 3,
        "id": "LOEA16_5t",
        "type": "Minion",
        "fr": {
            "name": "Momie zombie"
        }
    },
    {
        "cardImage": "LOEA10_3.png",
        "cost": 0,
        "collectible": true,
        "set": "League of Explorers",
        "race": "Murloc",
        "artist": "Oliver Chipping",
        "health": 1,
        "type": "Minion",
        "fr": {
            "name": "Murloc mini-aileron"
        },
        "flavor": "High mortality rate, from often being hugged to death.",
        "attack": 1,
        "name": "Murloc Tinyfin",
        "id": "LOEA10_3",
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_006.png",
        "cost": 2,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Steve Prescott",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Conservateur du musée"
        },
        "flavor": "He is forever cursing the kids who climb on the rails and the evil archeologists who animate the exhibits.",
        "playerClass": "Priest",
        "attack": 1,
        "name": "Museum Curator",
        "id": "LOE_006",
        "text": "<b>Battlecry: Discover</b> a <b>Deathrattle</b> card.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA09_9H.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Naga Repellent",
        "id": "LOEA09_9H",
        "text": "Change the Attack of all Hungry Naga to 1.",
        "type": "Spell",
        "fr": {
            "name": "Répulsif à nagas"
        }
    },
    {
        "cardImage": "LOEA09_9.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Naga Repellent",
        "id": "LOEA09_9",
        "text": "Destroy all Hungry Naga.",
        "type": "Spell",
        "fr": {
            "name": "Répulsif à nagas"
        }
    },
    {
        "cardImage": "LOE_038.png",
        "cost": 5,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Ben Zhang",
        "health": 5,
        "mechanics": [
            "Aura"
        ],
        "type": "Minion",
        "fr": {
            "name": "Sorcière des mers naga"
        },
        "flavor": "If she had studied harder, she would have been a C+ witch.",
        "attack": 5,
        "name": "Naga Sea Witch",
        "id": "LOE_038",
        "text": "Your cards cost (5).",
        "rarity": "Epic"
    },
    {
        "cardImage": "LOEA04_31b.png",
        "set": "League of Explorers",
        "name": "No Way!",
        "id": "LOEA04_31b",
        "text": "Do nothing.",
        "type": "Spell",
        "fr": {
            "name": "Pas question !"
        }
    },
    {
        "cardImage": "LOE_009.png",
        "cost": 7,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Anton Zemskov",
        "health": 7,
        "type": "Minion",
        "fr": {
            "name": "Destructeur d’obsidienne"
        },
        "flavor": "No obsidian is safe around the Obsidian Destroyer!",
        "playerClass": "Warrior",
        "attack": 7,
        "name": "Obsidian Destroyer",
        "id": "LOE_009",
        "text": "At the end of your turn, summon a 1/1 Scarab with <b>Taunt</b>.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA04_13bt.png",
        "cost": 4,
        "set": "League of Explorers",
        "attack": 7,
        "name": "Orsis Guard",
        "health": 5,
        "mechanics": [
            "Divine Shield"
        ],
        "id": "LOEA04_13bt",
        "text": "<b>Divine Shield</b>",
        "type": "Minion",
        "fr": {
            "name": "Garde d’Orsis"
        }
    },
    {
        "cardImage": "LOEA04_13bth.png",
        "cost": 4,
        "set": "League of Explorers",
        "attack": 8,
        "name": "Orsis Guard",
        "health": 8,
        "mechanics": [
            "Divine Shield"
        ],
        "id": "LOEA04_13bth",
        "text": "<b>Divine Shield</b>",
        "type": "Minion",
        "fr": {
            "name": "Garde d’Orsis"
        }
    },
    {
        "cardImage": "LOEA12_2.png",
        "set": "League of Explorers",
        "name": "Pearl of the Tides",
        "id": "LOEA12_2",
        "text": "At the end of your turn, replace all minions with new ones that cost (1) more.",
        "type": "Hero Power",
        "fr": {
            "name": "Perle des marées"
        }
    },
    {
        "cardImage": "LOEA12_2H.png",
        "set": "League of Explorers",
        "name": "Pearl of the Tides",
        "id": "LOEA12_2H",
        "text": "At the end of your turn, replace all minions with new ones. Yours cost (1) more.",
        "type": "Hero Power",
        "fr": {
            "name": "Perle des marées"
        }
    },
    {
        "cardImage": "LOEA04_06.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Pit of Spikes",
        "id": "LOEA04_06",
        "text": "<b>Choose Your Path!</b>",
        "type": "Spell",
        "fr": {
            "name": "Fosse remplie de pointes"
        }
    },
    {
        "cardImage": "LOE_010.png",
        "cost": 1,
        "collectible": true,
        "set": "League of Explorers",
        "race": "Beast",
        "artist": "Bernie Kang",
        "health": 1,
        "mechanics": [
            "Poisonous"
        ],
        "type": "Minion",
        "fr": {
            "name": "Serpent de la fosse"
        },
        "flavor": "It could be worse.  It could be a Snake Pit.",
        "playerClass": "Rogue",
        "attack": 2,
        "name": "Pit Snake",
        "id": "LOE_010",
        "text": "Destroy any minion damaged by this minion.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA14_2H.png",
        "set": "League of Explorers",
        "name": "Platemail Armor",
        "id": "LOEA14_2H",
        "text": "<b>Passive Hero Power</b>\nYour Hero and your minions can only take 1 damage at a time.",
        "type": "Hero Power",
        "fr": {
            "name": "Armure de plates"
        }
    },
    {
        "cardImage": "LOEA14_2.png",
        "set": "League of Explorers",
        "name": "Platemail Armor",
        "id": "LOEA14_2",
        "text": "<b>Passive Hero Power</b>\nYour Hero can only take 1 damage at a time.",
        "type": "Hero Power",
        "fr": {
            "name": "Armure de plates"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Power of the Titans",
        "id": "LOE_061e",
        "text": "+3/+3.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance des titans"
        }
    },
    {
        "cardImage": "LOEA16_8.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Putress' Vial",
        "id": "LOEA16_8",
        "text": "Destroy a random enemy minion.",
        "type": "Spell",
        "fr": {
            "name": "Fiole de Putrescin"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Putressed",
        "id": "LOEA16_8a",
        "text": "Attack and Health swapped.",
        "type": "Enchantment",
        "fr": {
            "name": "Putréfié"
        }
    },
    {
        "cardImage": "LOEA15_1.png",
        "set": "League of Explorers",
        "name": "Rafaam",
        "health": 30,
        "id": "LOEA15_1",
        "type": "Hero",
        "fr": {
            "name": "Rafaam"
        }
    },
    {
        "cardImage": "LOEA16_1.png",
        "set": "League of Explorers",
        "name": "Rafaam",
        "health": 30,
        "id": "LOEA16_1",
        "type": "Hero",
        "fr": {
            "name": "Rafaam"
        }
    },
    {
        "cardImage": "LOEA09_4.png",
        "cost": 1,
        "set": "League of Explorers",
        "attack": 1,
        "durability": 2,
        "name": "Rare Spear",
        "id": "LOEA09_4",
        "text": "Whenever your opponent plays a Rare card, gain +1/+1.",
        "type": "Weapon",
        "fr": {
            "name": "Lance rare"
        }
    },
    {
        "cardImage": "LOEA09_4H.png",
        "cost": 1,
        "set": "League of Explorers",
        "attack": 1,
        "durability": 2,
        "name": "Rare Spear",
        "id": "LOEA09_4H",
        "text": "Whenever your opponent plays a Rare card, gain +1/+1.",
        "type": "Weapon",
        "fr": {
            "name": "Lance rare"
        }
    },
    {
        "cardImage": "LOE_089t.png",
        "cost": 2,
        "set": "League of Explorers",
        "artist": "Matt Dixon",
        "attack": 2,
        "name": "Rascally Runt",
        "health": 2,
        "id": "LOE_089t",
        "type": "Minion",
        "fr": {
            "name": "Avorton vaurien"
        }
    },
    {
        "cardImage": "LOE_115.png",
        "cost": 1,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "A.J. Nazzaro",
        "type": "Spell",
        "fr": {
            "name": "Idole corbeau"
        },
        "flavor": "Was petrified when it found out it didn't make the cut for Azerothean Idol.",
        "playerClass": "Druid",
        "name": "Raven Idol",
        "id": "LOE_115",
        "text": "<b>Choose One -</b>\n<b>Discover</b> a minion; or <b>Discover</b> a spell.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_115b.png",
        "playerClass": "Druid",
        "set": "League of Explorers",
        "artist": "A.J. Nazzaro",
        "name": "Raven Idol",
        "id": "LOE_115b",
        "text": "<b>Discover</b> a spell.",
        "type": "Spell",
        "fr": {
            "name": "Idole corbeau"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_115a.png",
        "playerClass": "Druid",
        "set": "League of Explorers",
        "artist": "A.J. Nazzaro",
        "name": "Raven Idol",
        "id": "LOE_115a",
        "text": "<b>Discover</b> a minion.",
        "type": "Spell",
        "fr": {
            "name": "Idole corbeau"
        },
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_116.png",
        "cost": 1,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Wayne Reynolds",
        "health": 1,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Chercheuse du Reliquaire"
        },
        "flavor": "The Reliquary considers itself the equal of the League of Explorers.  The League of Explorers doesn't.",
        "playerClass": "Warlock",
        "attack": 1,
        "name": "Reliquary Seeker",
        "id": "LOE_116",
        "text": "<b>Battlecry:</b> If you have 6 other minions, gain +4/+4.",
        "rarity": "Rare"
    },
    {
        "cardImage": "LOE_011.png",
        "cost": 6,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Tyson Murphy",
        "health": 6,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Reno Jackson"
        },
        "flavor": "Reno is a four-time winner of the 'Best Accessorized Explorer' award.",
        "elite": true,
        "attack": 4,
        "name": "Reno Jackson",
        "id": "LOE_011",
        "text": "<b>Battlecry:</b> If your deck contains no more than 1 of any card, fully heal your hero.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "LOEA07_28.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Repairs",
        "id": "LOEA07_28",
        "text": "Restore 10 Health.",
        "type": "Spell",
        "fr": {
            "name": "Réparations"
        }
    },
    {
        "cardImage": "LOE_002t.png",
        "playerClass": "Mage",
        "cost": 3,
        "set": "League of Explorers",
        "artist": "Richard Wright",
        "name": "Roaring Torch",
        "id": "LOE_002t",
        "text": "Deal $6 damage.",
        "type": "Spell",
        "fr": {
            "name": "Torche enflammée"
        }
    },
    {
        "cardImage": "LOE_016t.png",
        "cost": 1,
        "set": "League of Explorers",
        "attack": 0,
        "name": "Rock",
        "health": 6,
        "mechanics": [
            "Taunt"
        ],
        "id": "LOE_016t",
        "text": "<b>Taunt.</b>",
        "type": "Minion",
        "fr": {
            "name": "Rocher"
        }
    },
    {
        "cardImage": "LOEA01_11.png",
        "cost": 0,
        "set": "League of Explorers",
        "attack": 0,
        "name": "Rod of the Sun",
        "health": 5,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "LOEA01_11",
        "text": "<b>Deathrattle:</b> Surrender this to your opponent.",
        "type": "Minion",
        "fr": {
            "name": "Baguette du Soleil"
        }
    },
    {
        "cardImage": "LOEA01_11h.png",
        "cost": 0,
        "set": "League of Explorers",
        "attack": 0,
        "name": "Rod of the Sun",
        "health": 5,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "LOEA01_11h",
        "text": "<b>Deathrattle:</b> Surrender this to your opponent.",
        "type": "Minion",
        "fr": {
            "name": "Baguette du Soleil"
        }
    },
    {
        "cardImage": "LOE_024t.png",
        "cost": 4,
        "set": "League of Explorers",
        "artist": "Richard Wright",
        "attack": 0,
        "name": "Rolling Boulder",
        "health": 4,
        "id": "LOE_024t",
        "text": "At the end of your turn, destroy the minion to the left.",
        "type": "Minion",
        "fr": {
            "name": "Rocher roulant"
        }
    },
    {
        "cardImage": "LOE_016.png",
        "cost": 4,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Cole Eastburn",
        "health": 6,
        "type": "Minion",
        "fr": {
            "name": "Élémentaire grondant"
        },
        "flavor": "He's a very hungry elemental.",
        "playerClass": "Shaman",
        "attack": 2,
        "name": "Rumbling Elemental",
        "id": "LOE_016",
        "text": "After you play a <b>Battlecry</b> minion, deal 2 damage to a random enemy.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA16_16H.png",
        "cost": 2,
        "set": "League of Explorers",
        "name": "Rummage",
        "id": "LOEA16_16H",
        "text": "Find an artifact.",
        "type": "Hero Power",
        "fr": {
            "name": "Fouilles"
        }
    },
    {
        "cardImage": "LOEA16_16.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Rummage",
        "id": "LOEA16_16",
        "text": "Find an artifact.",
        "type": "Hero Power",
        "fr": {
            "name": "Fouilles"
        }
    },
    {
        "cardImage": "LOE_027.png",
        "cost": 1,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Zoltan Boros",
        "mechanics": [
            "Secret"
        ],
        "type": "Spell",
        "fr": {
            "name": "Épreuve sacrée"
        },
        "flavor": "You have chosen poorly.",
        "playerClass": "Paladin",
        "name": "Sacred Trial",
        "id": "LOE_027",
        "text": "<b>Secret:</b> When your opponent has at least 3 minions and plays another, destroy it.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_009t.png",
        "cost": 1,
        "set": "League of Explorers",
        "artist": "Jaemin Kim",
        "health": 1,
        "mechanics": [
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "Scarabée"
        },
        "playerClass": "Warrior",
        "attack": 1,
        "name": "Scarab",
        "id": "LOE_009t",
        "text": "<b>Taunt</b>"
    },
    {
        "cardImage": "LOEA04_25.png",
        "cost": 8,
        "set": "League of Explorers",
        "attack": 0,
        "name": "Seething Statue",
        "health": 9,
        "id": "LOEA04_25",
        "text": "At the end of your turn, deal 2 damage to all enemies.",
        "type": "Minion",
        "fr": {
            "name": "Statue vengeresse"
        }
    },
    {
        "cardImage": "LOEA04_25h.png",
        "cost": 8,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Seething Statue",
        "health": 9,
        "id": "LOEA04_25h",
        "text": "At the end of your turn, deal 5 damage to all enemies.",
        "type": "Minion",
        "fr": {
            "name": "Statue vengeresse"
        }
    },
    {
        "cardImage": "LOEA16_6.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Shard of Sulfuras",
        "id": "LOEA16_6",
        "text": "Deal $5 damage to ALL characters.",
        "type": "Spell",
        "fr": {
            "name": "Éclat de Sulfuras"
        }
    },
    {
        "cardImage": "LOEA06_04.png",
        "cost": 2,
        "set": "League of Explorers",
        "name": "Shattering Spree",
        "id": "LOEA06_04",
        "text": "Destroy all Statues. For each destroyed, deal $1 damage.",
        "type": "Spell",
        "fr": {
            "name": "Pulsion destructrice"
        }
    },
    {
        "cardImage": "LOEA06_04h.png",
        "cost": 2,
        "set": "League of Explorers",
        "name": "Shattering Spree",
        "id": "LOEA06_04h",
        "text": "Destroy all Statues. For each destroyed, deal $3 damage.",
        "type": "Spell",
        "fr": {
            "name": "Pulsion destructrice"
        }
    },
    {
        "playerClass": "Warlock",
        "set": "League of Explorers",
        "name": "Sinister Power",
        "id": "LOE_009e",
        "text": "+4/+4.",
        "type": "Enchantment",
        "fr": {
            "name": "Puissance sinistre"
        }
    },
    {
        "cardImage": "LOE_076.png",
        "cost": 1,
        "collectible": true,
        "set": "League of Explorers",
        "race": "Murloc",
        "artist": "Matt Dixon",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Sir Finley Mrrgglton"
        },
        "flavor": "In addition to fluent Common, he also speaks fourteen dialects of 'mrgl'.",
        "elite": true,
        "attack": 1,
        "name": "Sir Finley Mrrgglton",
        "id": "LOE_076",
        "text": "<b>Battlecry: Discover</b> a new basic Hero Power.",
        "rarity": "Legendary"
    },
    {
        "cardImage": "LOEA13_1.png",
        "set": "League of Explorers",
        "name": "Skelesaurus Hex",
        "health": 30,
        "id": "LOEA13_1",
        "type": "Hero",
        "fr": {
            "name": "Squeletosaurus Hex"
        }
    },
    {
        "cardImage": "LOEA16_26.png",
        "elite": true,
        "cost": 5,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Skelesaurus Hex",
        "health": 5,
        "id": "LOEA16_26",
        "text": "At the end of your turn, give each player a random card. It costs (0).",
        "type": "Minion",
        "fr": {
            "name": "Squeletosaurus Hex"
        }
    },
    {
        "cardImage": "LOEA16_26H.png",
        "elite": true,
        "cost": 10,
        "set": "League of Explorers",
        "attack": 10,
        "name": "Skelesaurus Hex",
        "health": 10,
        "id": "LOEA16_26H",
        "text": "At the end of your turn, put a random card in your hand. It costs (0).",
        "type": "Minion",
        "fr": {
            "name": "Squeletosaurus Hex"
        }
    },
    {
        "cardImage": "LOEA09_6H.png",
        "cost": 2,
        "set": "League of Explorers",
        "attack": 2,
        "name": "Slithering Archer",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "id": "LOEA09_6H",
        "text": "<b>Battlecry:</b> Deal 2 damage to all enemy minions.",
        "type": "Minion",
        "fr": {
            "name": "Archer ondulant"
        }
    },
    {
        "cardImage": "LOEA09_6.png",
        "cost": 2,
        "set": "League of Explorers",
        "attack": 2,
        "name": "Slithering Archer",
        "health": 2,
        "mechanics": [
            "Battlecry"
        ],
        "id": "LOEA09_6",
        "text": "<b>Battlecry:</b> Deal 1 damage.",
        "type": "Minion",
        "fr": {
            "name": "Archer ondulant"
        }
    },
    {
        "cardImage": "LOEA09_8.png",
        "cost": 5,
        "set": "League of Explorers",
        "attack": 3,
        "name": "Slithering Guard",
        "health": 6,
        "mechanics": [
            "Taunt"
        ],
        "id": "LOEA09_8",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Garde ondulant"
        }
    },
    {
        "cardImage": "LOEA09_8H.png",
        "cost": 5,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Slithering Guard",
        "health": 7,
        "mechanics": [
            "Taunt"
        ],
        "id": "LOEA09_8H",
        "text": "<b>Taunt</b>",
        "type": "Minion",
        "fr": {
            "name": "Garde ondulant"
        }
    },
    {
        "cardImage": "LOEA07_24.png",
        "cost": 1,
        "set": "League of Explorers",
        "race": "Mech",
        "attack": 3,
        "name": "Spiked Decoy",
        "health": 6,
        "mechanics": [
            "Taunt"
        ],
        "id": "LOEA07_24",
        "text": "<b>Taunt</b>\nCan't attack.",
        "type": "Minion",
        "fr": {
            "name": "Leurre à pointes"
        }
    },
    {
        "cardImage": "LOEA16_2H.png",
        "set": "League of Explorers",
        "name": "Staff of Origination",
        "id": "LOEA16_2H",
        "text": "<b>Passive Hero Power</b>\nYour hero is <b>Immune</b>.",
        "type": "Hero Power",
        "fr": {
            "name": "Bâton de l’Origine"
        }
    },
    {
        "cardImage": "LOEA16_2.png",
        "set": "League of Explorers",
        "name": "Staff of Origination",
        "id": "LOEA16_2",
        "text": "<b>Passive Hero Power</b>\nYour hero is <b>Immune</b> while the staff charges.",
        "type": "Hero Power",
        "fr": {
            "name": "Bâton de l’Origine"
        }
    },
    {
        "cardImage": "LOEA06_02h.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Stonesculpting",
        "id": "LOEA06_02h",
        "text": "<b>Hero Power</b>\n Summon a Statue for both players.",
        "type": "Hero Power",
        "fr": {
            "name": "Sculpture sur pierre"
        }
    },
    {
        "cardImage": "LOEA06_02.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Stonesculpting",
        "id": "LOEA06_02",
        "text": "<b>Hero Power</b>\n Summon a 0/2 Statue for both players.",
        "type": "Hero Power",
        "fr": {
            "name": "Sculpture sur pierre"
        }
    },
    {
        "cardImage": "LOE_086.png",
        "cost": 5,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Jason Kang",
        "health": 6,
        "type": "Minion",
        "fr": {
            "name": "Pierre d’invocation"
        },
        "flavor": "Sometimes it feels like it's always the same slackers that are waiting for a summon.",
        "attack": 0,
        "name": "Summoning Stone",
        "id": "LOE_086",
        "text": "Whenever you cast a spell, summon a random minion of the same Cost.",
        "rarity": "Rare"
    },
    {
        "cardImage": "LOEA01_01.png",
        "set": "League of Explorers",
        "name": "Sun Raider Phaerix",
        "health": 30,
        "id": "LOEA01_01",
        "type": "Hero",
        "fr": {
            "name": "Écumeur du soleil Phaerix"
        }
    },
    {
        "cardImage": "LOEA16_19.png",
        "elite": true,
        "cost": 5,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Sun Raider Phaerix",
        "health": 5,
        "id": "LOEA16_19",
        "text": "At the end of your turn, add a Blessing of the Sun to your hand.",
        "type": "Minion",
        "fr": {
            "name": "Écumeur du soleil Phaerix"
        }
    },
    {
        "cardImage": "LOEA16_19H.png",
        "elite": true,
        "cost": 10,
        "set": "League of Explorers",
        "attack": 10,
        "name": "Sun Raider Phaerix",
        "health": 10,
        "id": "LOEA16_19H",
        "text": "Your other minions are <b>Immune</b>.",
        "type": "Minion",
        "fr": {
            "name": "Écumeur du soleil Phaerix"
        }
    },
    {
        "cardImage": "LOEA04_06a.png",
        "set": "League of Explorers",
        "name": "Swing Across",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "LOEA04_06a",
        "text": "Take 10 damage or no damage, at random.",
        "type": "Spell",
        "fr": {
            "name": "Franchir d’un bond"
        }
    },
    {
        "cardImage": "LOEA04_30a.png",
        "set": "League of Explorers",
        "name": "Take the Shortcut",
        "id": "LOEA04_30a",
        "text": "Get 1 turn closer to the Exit! Encounter a 7/7 War Golem.",
        "type": "Spell",
        "fr": {
            "name": "Prendre le raccourci"
        }
    },
    {
        "cardImage": "LOEA04_01.png",
        "set": "League of Explorers",
        "name": "Temple Escape",
        "health": 100,
        "id": "LOEA04_01",
        "type": "Hero",
        "fr": {
            "name": "Fuite du temple"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Temple Escape Enchant",
        "id": "LOEA04_01e",
        "type": "Enchantment",
        "fr": {
            "name": "Enchantement de fuite du temple"
        }
    },
    {
        "set": "League of Explorers",
        "name": "Temple Escape Enchant",
        "id": "LOEA04_01eh",
        "type": "Enchantment",
        "fr": {
            "name": "Enchantement de fuite du temple"
        }
    },
    {
        "cardImage": "LOEA04_30.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "The Darkness",
        "id": "LOEA04_30",
        "text": "<b>Take the Shortcut?</b>",
        "type": "Spell",
        "fr": {
            "name": "Les ténèbres"
        }
    },
    {
        "cardImage": "LOEA04_29.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "The Eye",
        "id": "LOEA04_29",
        "text": "<b>Choose Your Path!</b>",
        "type": "Spell",
        "fr": {
            "name": "L’Œil"
        }
    },
    {
        "cardImage": "LOEA16_27.png",
        "elite": true,
        "cost": 5,
        "set": "League of Explorers",
        "attack": 5,
        "name": "The Steel Sentinel",
        "health": 5,
        "id": "LOEA16_27",
        "text": "This minion can only take 1 damage at a time.",
        "type": "Minion",
        "fr": {
            "name": "La sentinelle d’acier"
        }
    },
    {
        "cardImage": "LOEA16_27H.png",
        "elite": true,
        "cost": 10,
        "set": "League of Explorers",
        "attack": 10,
        "name": "The Steel Sentinel",
        "health": 10,
        "id": "LOEA16_27H",
        "text": "This minion can only take 1 damage at a time.",
        "type": "Minion",
        "fr": {
            "name": "La sentinelle d’acier"
        }
    },
    {
        "cardImage": "LOEA14_1.png",
        "set": "League of Explorers",
        "name": "The Steel Sentinel",
        "health": 30,
        "id": "LOEA14_1",
        "type": "Hero",
        "fr": {
            "name": "La sentinelle d’acier"
        }
    },
    {
        "cardImage": "LOEA07_29.png",
        "cost": 1,
        "set": "League of Explorers",
        "name": "Throw Rocks",
        "id": "LOEA07_29",
        "text": "<b>Hero Power</b>\n Deal 3 damage to a random enemy minion.",
        "type": "Hero Power",
        "fr": {
            "name": "Lancer des rochers"
        }
    },
    {
        "cardImage": "LOEA16_4.png",
        "cost": 10,
        "set": "League of Explorers",
        "name": "Timepiece of Horror",
        "mechanics": [
            "ImmuneToSpellpower"
        ],
        "id": "LOEA16_4",
        "text": "Deal $10 damage randomly split among all enemies.",
        "type": "Spell",
        "fr": {
            "name": "Horloge de l’horreur"
        }
    },
    {
        "cardImage": "LOEA01_12h.png",
        "cost": 3,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Tol'vir Hoplite",
        "health": 5,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "LOEA01_12h",
        "text": "<b>Deathrattle:</b> Deal 5 damage to both heroes.",
        "type": "Minion",
        "fr": {
            "name": "Hoplite tol’vir"
        }
    },
    {
        "cardImage": "LOEA01_12.png",
        "cost": 3,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Tol'vir Hoplite",
        "health": 2,
        "mechanics": [
            "Deathrattle"
        ],
        "id": "LOEA01_12",
        "text": "<b>Deathrattle:</b> Deal 5 damage to both heroes.",
        "type": "Minion",
        "fr": {
            "name": "Hoplite tol’vir"
        }
    },
    {
        "cardImage": "LOE_012.png",
        "cost": 4,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Dave Allsop",
        "health": 4,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Pilleur de tombes"
        },
        "flavor": "After the guild broke up, he could no longer raid the tombs.",
        "playerClass": "Rogue",
        "attack": 5,
        "name": "Tomb Pillager",
        "id": "LOE_012",
        "text": "<b>Deathrattle:</b> Add a Coin to your hand.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_047.png",
        "cost": 4,
        "collectible": true,
        "set": "League of Explorers",
        "race": "Beast",
        "artist": "Turovec Konstantin",
        "health": 3,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Araignée des tombes"
        },
        "flavor": "Less serious than its cousin, the Grave Spider.",
        "attack": 3,
        "name": "Tomb Spider",
        "id": "LOE_047",
        "text": "<b>Battlecry: Discover</b> a Beast.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOEA04_29a.png",
        "set": "League of Explorers",
        "name": "Touch It",
        "id": "LOEA04_29a",
        "text": "Restore 10 Health to your hero.",
        "type": "Spell",
        "fr": {
            "name": "Toucher"
        }
    },
    {
        "cardImage": "LOEA05_02h.png",
        "set": "League of Explorers",
        "name": "Trogg Hate Minions!",
        "id": "LOEA05_02h",
        "text": "<b>Passive Hero Power</b>\n Enemy minions cost (11). Swap at the start of your turn.",
        "type": "Hero Power",
        "fr": {
            "name": "Trogg détester serviteurs !"
        }
    },
    {
        "cardImage": "LOEA05_02a.png",
        "set": "League of Explorers",
        "name": "Trogg Hate Minions!",
        "id": "LOEA05_02a",
        "text": "<b>Passive Hero Power</b>\n Enemy minions cost (2) more. Swap at the start of your turn.",
        "type": "Hero Power",
        "fr": {
            "name": "Trogg détester serviteurs !"
        }
    },
    {
        "cardImage": "LOEA05_02ha.png",
        "set": "League of Explorers",
        "name": "Trogg Hate Minions!",
        "id": "LOEA05_02ha",
        "text": "<b>Passive Hero Power</b>\n Enemy minions cost (11). Swap at the start of your turn.",
        "type": "Hero Power",
        "fr": {
            "name": "Trogg détester serviteurs !"
        }
    },
    {
        "cardImage": "LOEA05_02.png",
        "set": "League of Explorers",
        "name": "Trogg Hate Minions!",
        "id": "LOEA05_02",
        "text": "<b>Passive Hero Power</b>\n Enemy minions cost (2) more. Swap at the start of your turn.",
        "type": "Hero Power",
        "fr": {
            "name": "Trogg détester serviteurs !"
        }
    },
    {
        "cardImage": "LOEA05_03h.png",
        "set": "League of Explorers",
        "name": "Trogg Hate Spells!",
        "id": "LOEA05_03h",
        "text": "<b>Passive Hero Power</b>\n Enemy spells cost (11). Swap at the start of your turn.",
        "type": "Hero Power",
        "fr": {
            "name": "Trogg détester sorts !"
        }
    },
    {
        "cardImage": "LOEA05_03.png",
        "set": "League of Explorers",
        "name": "Trogg Hate Spells!",
        "id": "LOEA05_03",
        "text": "<b>Passive Hero Power</b>\n Enemy spells cost (2) more. Swap at the start of your turn.",
        "type": "Hero Power",
        "fr": {
            "name": "Trogg détester sorts !"
        }
    },
    {
        "playerClass": "Shaman",
        "set": "League of Explorers",
        "name": "Trogg No Stupid",
        "id": "LOE_018e",
        "text": "Increased Attack.",
        "type": "Enchantment",
        "fr": {
            "name": "Trogg pas stupide"
        }
    },
    {
        "cardImage": "LOE_018.png",
        "cost": 1,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Andrew Hou",
        "health": 3,
        "type": "Minion",
        "fr": {
            "name": "Trogg des tunnels"
        },
        "flavor": "Sure, they're ugly, but they live in tunnels.  You try your beauty routine without natural light.",
        "playerClass": "Shaman",
        "attack": 1,
        "name": "Tunnel Trogg",
        "id": "LOE_018",
        "text": "Whenever you <b>Overload</b>, gain +1 Attack per locked Mana Crystal.",
        "rarity": "Common"
    },
    {
        "cardImage": "LOE_019.png",
        "cost": 3,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Trent Kaniuga",
        "health": 4,
        "mechanics": [
            "Battlecry"
        ],
        "type": "Minion",
        "fr": {
            "name": "Raptor déterré"
        },
        "flavor": "Still hunting for the ones who earthed him.",
        "playerClass": "Rogue",
        "attack": 3,
        "name": "Unearthed Raptor",
        "id": "LOE_019",
        "text": "<b>Battlecry:</b> Choose a friendly minion. Gain a copy of its <b>Deathrattle</b> effect.",
        "rarity": "Rare"
    },
    {
        "playerClass": "Rogue",
        "set": "League of Explorers",
        "name": "Unearthed Raptor",
        "id": "LOE_019e",
        "text": "Copied <b>Deathrattle</b> from CARD_NAME.",
        "type": "Enchantment",
        "fr": {
            "name": "Raptor déterré"
        }
    },
    {
        "cardImage": "LOEA15_2.png",
        "cost": 2,
        "set": "League of Explorers",
        "name": "Unstable Portal",
        "id": "LOEA15_2",
        "text": "<b>Hero Power</b>\nAdd a random minion to your hand. It costs (3) less.",
        "type": "Hero Power",
        "fr": {
            "name": "Portail instable"
        }
    },
    {
        "cardImage": "LOEA15_2H.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Unstable Portal",
        "id": "LOEA15_2H",
        "text": "<b>Hero Power</b>\nAdd a random minion to your hand. It costs (3) less.",
        "type": "Hero Power",
        "fr": {
            "name": "Portail instable"
        }
    },
    {
        "cardImage": "LOEA04_28b.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Wade Through",
        "id": "LOEA04_28b",
        "text": "Gain a Mana Crystal",
        "type": "Spell",
        "fr": {
            "name": "Traverser à pied"
        }
    },
    {
        "cardImage": "LOEA04_06b.png",
        "set": "League of Explorers",
        "name": "Walk Across Gingerly",
        "id": "LOEA04_06b",
        "text": "Take 5 damage.",
        "type": "Spell",
        "fr": {
            "name": "Traverser avec précaution"
        }
    },
    {
        "playerClass": "Paladin",
        "set": "League of Explorers",
        "name": "Watched",
        "id": "LOE_017e",
        "text": "Stats changed to 3/3.",
        "type": "Enchantment",
        "fr": {
            "name": "Observé"
        }
    },
    {
        "cardImage": "LOE_089t2.png",
        "cost": 2,
        "set": "League of Explorers",
        "artist": "Matt Dixon",
        "attack": 2,
        "name": "Wily Runt",
        "health": 2,
        "id": "LOE_089t2",
        "type": "Minion",
        "fr": {
            "name": "Avorton rusé"
        }
    },
    {
        "cardImage": "LOEA02_10.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Wish for Companionship",
        "id": "LOEA02_10",
        "text": "<b>Discover</b> a Companion.",
        "type": "Spell",
        "fr": {
            "name": "Vœu : compagnon"
        }
    },
    {
        "cardImage": "LOEA02_05.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Wish for Glory",
        "id": "LOEA02_05",
        "text": "<b>Discover</b> a minion.",
        "type": "Spell",
        "fr": {
            "name": "Vœu : gloire"
        }
    },
    {
        "cardImage": "LOEA02_06.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Wish for More Wishes",
        "id": "LOEA02_06",
        "text": "Gain 2 Wishes.",
        "type": "Spell",
        "fr": {
            "name": "Vœu : plus de Vœux"
        }
    },
    {
        "cardImage": "LOEA02_03.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Wish for Power",
        "id": "LOEA02_03",
        "text": "<b>Discover</b> a spell.",
        "type": "Spell",
        "fr": {
            "name": "Vœu : puissance"
        }
    },
    {
        "cardImage": "LOEA02_04.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Wish for Valor",
        "id": "LOEA02_04",
        "text": "<b>Discover</b> a (4)-Cost card.",
        "type": "Spell",
        "fr": {
            "name": "Vœu : vaillance"
        }
    },
    {
        "cardImage": "LOE_089.png",
        "cost": 6,
        "collectible": true,
        "set": "League of Explorers",
        "artist": "Sam Nielson",
        "health": 6,
        "mechanics": [
            "Deathrattle"
        ],
        "type": "Minion",
        "fr": {
            "name": "Avortons tremblants"
        },
        "flavor": "The fourth one fell off in a tragic accident.  They don't talk about it.",
        "attack": 2,
        "name": "Wobbling Runts",
        "id": "LOE_089",
        "text": "<b>Deathrattle:</b> Summon three 2/2 Runts.",
        "rarity": "Rare"
    },
    {
        "cardImage": "LOEA16_15.png",
        "cost": 0,
        "set": "League of Explorers",
        "name": "Ysera's Tear",
        "id": "LOEA16_15",
        "text": "Gain 4 Mana Crystals this turn only.",
        "type": "Spell",
        "fr": {
            "name": "Larme d’Ysera"
        }
    },
    {
        "cardImage": "LOEA02_01.png",
        "set": "League of Explorers",
        "name": "Zinaar",
        "health": 30,
        "id": "LOEA02_01",
        "type": "Hero",
        "fr": {
            "name": "Zinaar"
        }
    },
    {
        "cardImage": "LOEA16_18H.png",
        "elite": true,
        "cost": 10,
        "set": "League of Explorers",
        "attack": 10,
        "name": "Zinaar",
        "health": 10,
        "id": "LOEA16_18H",
        "text": "At the end of your turn, gain a wish.",
        "type": "Minion",
        "fr": {
            "name": "Zinaar"
        }
    },
    {
        "cardImage": "LOEA16_18.png",
        "elite": true,
        "cost": 5,
        "set": "League of Explorers",
        "attack": 5,
        "name": "Zinaar",
        "health": 5,
        "id": "LOEA16_18",
        "text": "At the end of your turn, gain a wish.",
        "type": "Minion",
        "fr": {
            "name": "Zinaar"
        }
    },
    {
        "playerClass": "Rogue",
        "set": "League of Explorers",
        "name": "zzDELETE Tomb Explorer",
        "id": "LOE_012e",
        "text": "Copied Deathrattle from CARD_NAME",
        "type": "Enchantment",
        "fr": {
            "name": "zzDELETE Explorateur de tombes"
        }
    },
    {
        "cardImage": "LOE_030.png",
        "cost": 4,
        "collectible": false,
        "set": "League of Explorers",
        "health": 1,
        "mechanics": [
            "Battlecry",
            "Taunt"
        ],
        "type": "Minion",
        "fr": {
            "name": "zzDELETE? Armure animée"
        },
        "attack": 1,
        "name": "zzDELETE? Animated Armor",
        "id": "LOE_030",
        "text": "<b>Taunt</b>\n<b>Battlecry:</b> Copy a friendly minion's Attack and Health.",
        "rarity": "Common"
    }
]