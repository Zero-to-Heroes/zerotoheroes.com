var cardRegex = /\[\[.+?\]\]/gm;

function parseCardsText(text) {
	var matches = text.match(cardRegex);
	if (!matches) return text;

	var result = text;
	//console.log('matches', matches);
	if (matches) {
		matches.forEach(function(match) {
			//console.log('match', match);
			var cardName = match.substring(2, match.length - 2);
			//console.log('cardName', cardName);
			var cardImage = getCardImage(cardName);
			if (cardImage) {
				//console.log('cardImage', cardImage);
				result = result.replace(match, '<a data-template-url="plugins/parseCardsText/template.html" data-title="' + cardImage + '" data-container="body" bs-tooltip>' + cardName + '</a>');
			}
		})
	}

	//var result = text.replace(cardRegex, '<a data-title="<img src=\'images/$&.png\'>" data-html="true" bs-tooltip>$&</a>');
	//result = result.replace(/\[\[/gm, '').replace(/\]\]/gm, '')

	return result;
}

function getCardImage(cardName) {
	var result;
	// cf http://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break
	jsonDatabase.some(function(card) {
		//console.log('\tlooking at card', card.name);
		//console.log('\tcardimage is', card.cardimage);
		//console.log('\tis equal', card.name, cardName, card.name == cardName);
		if (card.name == cardName) {
			result = card.cardimage;
			return true;
		}
	});
	return result;
}

// TODO: export this to real db? Do the match on server side?
var jsonDatabase = [
	{ "cardimage" : "74.png", "name" : "Acidic Swamp Ooze"},
	{ "cardimage" : "216.png", "name" : "Ancestral Healing"},
	{ "cardimage" : "578.png", "name" : "Animal Companion"},
	{ "cardimage" : "56.png", "name" : "Arcane Explosion"},
	{ "cardimage" : "489.png", "name" : "Arcane Intellect"},
	{ "cardimage" : "589.png", "name" : "Arcane Missiles"},
	{ "cardimage" : "167.png", "name" : "Arcane Shot"},
	{ "cardimage" : "182.png", "name" : "Arcanite Reaper"},
	{ "cardimage" : "545.png", "name" : "Archmage"},
	{ "cardimage" : "433.png", "name" : "Assassin's Blade"},
	{ "cardimage" : "568.png", "name" : "Assassinate"},
	{ "cardimage" : "471.png", "name" : "Backstab"},
	{ "cardimage" : "29.png", "name" : "Blessing of Kings"},
	{ "cardimage" : "394.png", "name" : "Blessing of Might"},
	{ "cardimage" : "576.png", "name" : "Bloodfen Raptor"},
	{ "cardimage" : "256.png", "name" : "Bloodlust"},
	{ "cardimage" : "289.png", "name" : "Bluegill Warrior"},
	{ "cardimage" : "27.png", "name" : "Booty Bay Bodyguard"},
	{ "cardimage" : "60.png", "name" : "Boulderfist Ogre"},
	{ "cardimage" : "646.png", "name" : "Charge"},
	{ "cardimage" : "31.png", "name" : "Chillwind Yeti"},
	{ "cardimage" : "532.png", "name" : "Claw"},
	{ "cardimage" : "81.png", "name" : "Cleave"},
	{ "cardimage" : "260.png", "name" : "Consecration"},
	{ "cardimage" : "173.png", "name" : "Core Hound"},
	{ "cardimage" : "252.png", "name" : "Corruption"},
	{ "cardimage" : "388.png", "name" : "Dalaran Mage"},
	{ "cardimage" : "84.png", "name" : "Darkscale Healer"},
	{ "cardimage" : "87.png", "name" : "Deadly Poison"},
	{ "cardimage" : "554.png", "name" : "Divine Spirit"},
	{ "cardimage" : "472.png", "name" : "Dragonling Mechanic"},
	{ "cardimage" : "332.png", "name" : "Drain Life"},
	{ "cardimage" : "36.png", "name" : "Dread Infernal"},
	{ "cardimage" : "356.png", "name" : "Elven Archer"},
	{ "cardimage" : "227.png", "name" : "Execute"},
	{ "cardimage" : "378.png", "name" : "Fan of Knives"},
	{ "cardimage" : "632.png", "name" : "Fiery War Axe"},
	{ "cardimage" : "636.png", "name" : "Fire Elemental"},
	{ "cardimage" : "522.png", "name" : "Fireball"},
	{ "cardimage" : "44.png", "name" : "Flamestrike"},
	{ "cardimage" : "390.png", "name" : "Flametongue Totem"},
	{ "cardimage" : "49.png", "name" : "Frost Nova"},
	{ "cardimage" : "233.png", "name" : "Frost Shock"},
	{ "cardimage" : "177.png", "name" : "Frostbolt"},
	{ "cardimage" : "663.png", "name" : "Frostwolf Grunt"},
	{ "cardimage" : "604.png", "name" : "Frostwolf Warlord"},
	{ "cardimage" : "246.png", "name" : "Gnomish Inventor"},
	{ "cardimage" : "564.png", "name" : "Goldshire Footman"},
	{ "cardimage" : "510.png", "name" : "Grimscale Oracle"},
	{ "cardimage" : "283.png", "name" : "Guardian of Kings"},
	{ "cardimage" : "624.png", "name" : "Gurubashi Berserker"},
	{ "cardimage" : "350.png", "name" : "Hammer of Wrath"},
	{ "cardimage" : "499.png", "name" : "Hand of Protection"},
	{ "cardimage" : "258.png", "name" : "Healing Touch"},
	{ "cardimage" : "122.png", "name" : "Hellfire"},
	{ "cardimage" : "1.png", "name" : "Heroic Strike"},
	{ "cardimage" : "270.png", "name" : "Hex"},
	{ "cardimage" : "108.png", "name" : "Holy Light"},
	{ "cardimage" : "671.png", "name" : "Holy Nova"},
	{ "cardimage" : "409.png", "name" : "Holy Smite"},
	{ "cardimage" : "225.png", "name" : "Houndmaster"},
	{ "cardimage" : "189.png", "name" : "Humility"},
	{ "cardimage" : "22.png", "name" : "Hunter's Mark"},
	{ "cardimage" : "548.png", "name" : "Innervate"},
	{ "cardimage" : "238.png", "name" : "Ironbark Protector"},
	{ "cardimage" : "41.png", "name" : "Ironforge Rifleman"},
	{ "cardimage" : "519.png", "name" : "Ironfur Grizzly"},
	{ "cardimage" : "488.png", "name" : "Kill Command"},
	{ "cardimage" : "479.png", "name" : "Kobold Geomancer"},
	{ "cardimage" : "130.png", "name" : "Kor'kron Elite"},
	{ "cardimage" : "32.png", "name" : "Leokk"},
	{ "cardimage" : "250.png", "name" : "Light's Justice"},
	{ "cardimage" : "414.png", "name" : "Lord of the Arena"},
	{ "cardimage" : "362.png", "name" : "Magma Rager"},
	{ "cardimage" : "480.png", "name" : "Mark of the Wild"},
	{ "cardimage" : "415.png", "name" : "Mind Blast"},
	{ "cardimage" : "401.png", "name" : "Mind Control"},
	{ "cardimage" : "438.png", "name" : "Mind Vision"},
	{ "cardimage" : "30.png", "name" : "Mirror Image"},
	{ "cardimage" : "619.png", "name" : "Moonfire"},
	{ "cardimage" : "43.png", "name" : "Mortal Coil"},
	{ "cardimage" : "407.png", "name" : "Multi-Shot"},
	{ "cardimage" : "55.png", "name" : "Murloc Raider"},
	{ "cardimage" : "357.png", "name" : "Murloc Tidehunter"},
	{ "cardimage" : "184.png", "name" : "Nightblade"},
	{ "cardimage" : "600.png", "name" : "Northshire Cleric"},
	{ "cardimage" : "435.png", "name" : "Novice Engineer"},
	{ "cardimage" : "15.png", "name" : "Oasis Snapjaw"},
	{ "cardimage" : "659.png", "name" : "Ogre Magi"},
	{ "cardimage" : "595.png", "name" : "Polymorph"},
	{ "cardimage" : "431.png", "name" : "Power Word: Shield"},
	{ "cardimage" : "502.png", "name" : "Raid Leader"},
	{ "cardimage" : "47.png", "name" : "Razorfen Hunter"},
	{ "cardimage" : "560.png", "name" : "Reckless Rocketeer"},
	{ "cardimage" : "535.png", "name" : "River Crocolisk"},
	{ "cardimage" : "491.png", "name" : "Rockbiter Weapon"},
	{ "cardimage" : "348.png", "name" : "Sacrificial Pact"},
	{ "cardimage" : "385.png", "name" : "Sap"},
	{ "cardimage" : "329.png", "name" : "Savage Roar"},
	{ "cardimage" : "326.png", "name" : "Sen'jin Shieldmasta"},
	{ "cardimage" : "647.png", "name" : "Shadow Bolt"},
	{ "cardimage" : "547.png", "name" : "Shadow Word: Death"},
	{ "cardimage" : "315.png", "name" : "Shadow Word: Pain"},
	{ "cardimage" : "434.png", "name" : "Shattered Sun Cleric"},
	{ "cardimage" : "493.png", "name" : "Shield Block"},
	{ "cardimage" : "164.png", "name" : "Shiv"},
	{ "cardimage" : "611.png", "name" : "Silverback Patriarch"},
	{ "cardimage" : "205.png", "name" : "Sinister Strike"},
	{ "cardimage" : "529.png", "name" : "Soulfire"},
	{ "cardimage" : "90.png", "name" : "Sprint"},
	{ "cardimage" : "667.png", "name" : "Starfire"},
	{ "cardimage" : "101.png", "name" : "Starving Buzzard"},
	{ "cardimage" : "76.png", "name" : "Stonetusk Boar"},
	{ "cardimage" : "325.png", "name" : "Stormpike Commando"},
	{ "cardimage" : "310.png", "name" : "Stormwind Champion"},
	{ "cardimage" : "603.png", "name" : "Stormwind Knight"},
	{ "cardimage" : "208.png", "name" : "Succubus"},
	{ "cardimage" : "620.png", "name" : "Swipe"},
	{ "cardimage" : "86.png", "name" : "Timber Wolf"},
	{ "cardimage" : "367.png", "name" : "Totemic Might"},
	{ "cardimage" : "163.png", "name" : "Tracking"},
	{ "cardimage" : "293.png", "name" : "Truesilver Champion"},
	{ "cardimage" : "162.png", "name" : "Tundra Rhino"},
	{ "cardimage" : "658.png", "name" : "Vanish"},
	{ "cardimage" : "340.png", "name" : "Voidwalker"},
	{ "cardimage" : "410.png", "name" : "Voodoo Doctor"},
	{ "cardimage" : "323.png", "name" : "War Golem"},
	{ "cardimage" : "193.png", "name" : "Warsong Commander"},
	{ "cardimage" : "274.png", "name" : "Water Elemental"},
	{ "cardimage" : "161.png", "name" : "Whirlwind"},
	{ "cardimage" : "282.png", "name" : "Wild Growth"},
	{ "cardimage" : "146.png", "name" : "Windfury"},
	{ "cardimage" : "151.png", "name" : "Windspeaker"},
	{ "cardimage" : "174.png", "name" : "Wolfrider"},
	{ "cardimage" : "597.png", "name" : "Abomination"},
	{ "cardimage" : "577.png", "name" : "Abusive Sergeant"},
	{ "cardimage" : "428.png", "name" : "Acolyte of Pain"},
	{ "cardimage" : "335.png", "name" : "Al'Akir the Windlord"},
	{ "cardimage" : "425.png", "name" : "Alarm-o-Bot"},
	{ "cardimage" : "23.png", "name" : "Aldor Peacekeeper"},
	{ "cardimage" : "303.png", "name" : "Alexstrasza"},
	{ "cardimage" : "641.png", "name" : "Amani Berserker"},
	{ "cardimage" : "526.png", "name" : "Ancestral Spirit"},
	{ "cardimage" : "572.png", "name" : "Ancient Brewmaster"},
	{ "cardimage" : "176.png", "name" : "Ancient Mage"},
	{ "cardimage" : "153.png", "name" : "Ancient Watcher"},
	{ "cardimage" : "34.png", "name" : "Ancient of Lore"},
	{ "cardimage" : "242.png", "name" : "Ancient of War"},
	{ "cardimage" : "57.png", "name" : "Angry Chicken"},
	{ "cardimage" : "504.png", "name" : "Arathi Weaponsmith"},
	{ "cardimage" : "97.png", "name" : "Arcane Golem"},
	{ "cardimage" : "220.png", "name" : "Archmage Antonidas"},
	{ "cardimage" : "463.png", "name" : "Argent Commander"},
	{ "cardimage" : "191.png", "name" : "Argent Protector"},
	{ "cardimage" : "473.png", "name" : "Argent Squire"},
	{ "cardimage" : "644.png", "name" : "Armorsmith"},
	{ "cardimage" : "656.png", "name" : "Auchenai Soulpriest"},
	{ "cardimage" : "142.png", "name" : "Avenging Wrath"},
	{ "cardimage" : "280.png", "name" : "Azure Drake"},
	{ "cardimage" : "359.png", "name" : "Baine Bloodhoof"},
	{ "cardimage" : "670.png", "name" : "Bane of Doom"},
	{ "cardimage" : "539.png", "name" : "Baron Geddon"},
	{ "cardimage" : "664.png", "name" : "Battle Rage"},
	{ "cardimage" : "304.png", "name" : "Bestial Wrath"},
	{ "cardimage" : "198.png", "name" : "Betrayal"},
	{ "cardimage" : "73.png", "name" : "Big Game Hunter"},
	{ "cardimage" : "266.png", "name" : "Bite"},
	{ "cardimage" : "244.png", "name" : "Blade Flurry"},
	{ "cardimage" : "7.png", "name" : "Blessed Champion"},
	{ "cardimage" : "100.png", "name" : "Blessing of Wisdom"},
	{ "cardimage" : "276.png", "name" : "Blizzard"},
	{ "cardimage" : "196.png", "name" : "Blood Imp"},
	{ "cardimage" : "75.png", "name" : "Blood Knight"},
	{ "cardimage" : "525.png", "name" : "Bloodmage Thalnos"},
	{ "cardimage" : "453.png", "name" : "Bloodsail Corsair"},
	{ "cardimage" : "637.png", "name" : "Bloodsail Raider"},
	{ "cardimage" : "297.png", "name" : "Brawl"},
	{ "cardimage" : "147.png", "name" : "Cabal Shadow Priest"},
	{ "cardimage" : "498.png", "name" : "Cairne Bloodhoof"},
	{ "cardimage" : "267.png", "name" : "Captain Greenskin"},
	{ "cardimage" : "605.png", "name" : "Cenarius"},
	{ "cardimage" : "38.png", "name" : "Circle of Healing"},
	{ "cardimage" : "92.png", "name" : "Cold Blood"},
	{ "cardimage" : "88.png", "name" : "Coldlight Oracle"},
	{ "cardimage" : "424.png", "name" : "Coldlight Seer"},
	{ "cardimage" : "166.png", "name" : "Commanding Shout"},
	{ "cardimage" : "284.png", "name" : "Conceal"},
	{ "cardimage" : "26.png", "name" : "Cone of Cold"},
	{ "cardimage" : "531.png", "name" : "Counterspell"},
	{ "cardimage" : "612.png", "name" : "Crazed Alchemist"},
	{ "cardimage" : "328.png", "name" : "Cruel Taskmaster"},
	{ "cardimage" : "140.png", "name" : "Cult Master"},
	{ "cardimage" : "128.png", "name" : "Dark Iron Dwarf"},
	{ "cardimage" : "239.png", "name" : "Deadly Shot"},
	{ "cardimage" : "474.png", "name" : "Deathwing"},
	{ "cardimage" : "542.png", "name" : "Defender of Argus"},
	{ "cardimage" : "417.png", "name" : "Defias Ringleader"},
	{ "cardimage" : "212.png", "name" : "Demolisher"},
	{ "cardimage" : "452.png", "name" : "Demonfire"},
	{ "cardimage" : "305.png", "name" : "Dire Wolf Alpha"},
	{ "cardimage" : "581.png", "name" : "Divine Favor"},
	{ "cardimage" : "507.png", "name" : "Doomguard"},
	{ "cardimage" : "172.png", "name" : "Doomhammer"},
	{ "cardimage" : "467.png", "name" : "Doomsayer"},
	{ "cardimage" : "261.png", "name" : "Dread Corsair"},
	{ "cardimage" : "587.png", "name" : "Druid of the Claw"},
	{ "cardimage" : "129.png", "name" : "Dust Devil"},
	{ "cardimage" : "363.png", "name" : "Eaglehorn Bow"},
	{ "cardimage" : "124.png", "name" : "Earth Elemental"},
	{ "cardimage" : "77.png", "name" : "Earth Shock"},
	{ "cardimage" : "557.png", "name" : "Earthen Ring Farseer"},
	{ "cardimage" : "479.png", "name" : "Edwin VanCleef"},
	{ "cardimage" : "625.png", "name" : "Emperor Cobra"},
	{ "cardimage" : "383.png", "name" : "Equality"},
	{ "cardimage" : "125.png", "name" : "Ethereal Arcanist"},
	{ "cardimage" : "382.png", "name" : "Eviscerate"},
	{ "cardimage" : "114.png", "name" : "Explosive Shot"},
	{ "cardimage" : "344.png", "name" : "Explosive Trap"},
	{ "cardimage" : "206.png", "name" : "Eye for an Eye"},
	{ "cardimage" : "450.png", "name" : "Faceless Manipulator"},
	{ "cardimage" : "213.png", "name" : "Faerie Dragon"},
	{ "cardimage" : "107.png", "name" : "Far Sight"},
	{ "cardimage" : "236.png", "name" : "Felguard"},
	{ "cardimage" : "476.png", "name" : "Fen Creeper"},
	{ "cardimage" : "214.png", "name" : "Feral Spirit"},
	{ "cardimage" : "85.png", "name" : "Flame Imp"},
	{ "cardimage" : "630.png", "name" : "Flare"},
	{ "cardimage" : "610.png", "name" : "Flesheating Ghoul"},
	{ "cardimage" : "237.png", "name" : "Force of Nature"},
	{ "cardimage" : "530.png", "name" : "Forked Lightning"},
	{ "cardimage" : "99.png", "name" : "Freezing Trap"},
	{ "cardimage" : "598.png", "name" : "Frost Elemental"},
	{ "cardimage" : "69.png", "name" : "Frothing Berserker"},
	{ "cardimage" : "131.png", "name" : "Gadgetzan Auctioneer"},
	{ "cardimage" : "278.png", "name" : "Gladiator's Longbow"},
	{ "cardimage" : "96.png", "name" : "Gorehowl"},
	{ "cardimage" : "643.png", "name" : "Grommash Hellscream"},
	{ "cardimage" : "18.png", "name" : "Gruul"},
	{ "cardimage" : "602.png", "name" : "Harrison Jones"},
	{ "cardimage" : "386.png", "name" : "Harvest Golem"},
	{ "cardimage" : "135.png", "name" : "Headcrack"},
	{ "cardimage" : "39.png", "name" : "Hogger"},
	{ "cardimage" : "457.png", "name" : "Holy Fire"},
	{ "cardimage" : "355.png", "name" : "Holy Wrath"},
	{ "cardimage" : "660.png", "name" : "Hungry Crab"},
	{ "cardimage" : "672.png", "name" : "Ice Barrier"},
	{ "cardimage" : "28.png", "name" : "Ice Block"},
	{ "cardimage" : "188.png", "name" : "Ice Lance"},
	{ "cardimage" : "203.png", "name" : "Illidan Stormrage"},
	{ "cardimage" : "178.png", "name" : "Imp Master"},
	{ "cardimage" : "209.png", "name" : "Injured Blademaster"},
	{ "cardimage" : "207.png", "name" : "Inner Fire"},
	{ "cardimage" : "366.png", "name" : "Inner Rage"},
	{ "cardimage" : "500.png", "name" : "Ironbeak Owl"},
	{ "cardimage" : "392.png", "name" : "Jungle Panther"},
	{ "cardimage" : "459.png", "name" : "Keeper of the Grove"},
	{ "cardimage" : "562.png", "name" : "Kidnapper"},
	{ "cardimage" : "194.png", "name" : "King Krush"},
	{ "cardimage" : "373.png", "name" : "King Mukla"},
	{ "cardimage" : "411.png", "name" : "Kirin Tor Mage"},
	{ "cardimage" : "422.png", "name" : "Knife Juggler"},
	{ "cardimage" : "679.png", "name" : "Lava Burst"},
	{ "cardimage" : "506.png", "name" : "Lay on Hands"},
	{ "cardimage" : "674.png", "name" : "Leeroy Jenkins"},
	{ "cardimage" : "513.png", "name" : "Leper Gnome"},
	{ "cardimage" : "10.png", "name" : "Lightning Bolt"},
	{ "cardimage" : "676.png", "name" : "Lightning Storm"},
	{ "cardimage" : "192.png", "name" : "Lightspawn"},
	{ "cardimage" : "436.png", "name" : "Lightwarden"},
	{ "cardimage" : "117.png", "name" : "Lightwell"},
	{ "cardimage" : "395.png", "name" : "Loot Hoarder"},
	{ "cardimage" : "482.png", "name" : "Lord Jaraxxus"},
	{ "cardimage" : "456.png", "name" : "Lorewalker Cho"},
	{ "cardimage" : "80.png", "name" : "Mad Bomber"},
	{ "cardimage" : "241.png", "name" : "Malygos"},
	{ "cardimage" : "67.png", "name" : "Mana Addict"},
	{ "cardimage" : "613.png", "name" : "Mana Tide Totem"},
	{ "cardimage" : "197.png", "name" : "Mana Wraith"},
	{ "cardimage" : "263.png", "name" : "Mana Wyrm"},
	{ "cardimage" : "149.png", "name" : "Mark of Nature"},
	{ "cardimage" : "249.png", "name" : "Mass Dispel"},
	{ "cardimage" : "584.png", "name" : "Master Swordsmith"},
	{ "cardimage" : "127.png", "name" : "Master of Disguise"},
	{ "cardimage" : "339.png", "name" : "Millhouse Manastorm"},
	{ "cardimage" : "368.png", "name" : "Mind Control Tech"},
	{ "cardimage" : "301.png", "name" : "Mindgames"},
	{ "cardimage" : "569.png", "name" : "Mirror Entity"},
	{ "cardimage" : "447.png", "name" : "Misdirection"},
	{ "cardimage" : "346.png", "name" : "Mogu'shan Warden"},
	{ "cardimage" : "94.png", "name" : "Molten Giant"},
	{ "cardimage" : "345.png", "name" : "Mortal Strike"},
	{ "cardimage" : "264.png", "name" : "Mountain Giant"},
	{ "cardimage" : "420.png", "name" : "Murloc Tidecaller"},
	{ "cardimage" : "222.png", "name" : "Murloc Warleader"},
	{ "cardimage" : "19.png", "name" : "Nat Pagle"},
	{ "cardimage" : "154.png", "name" : "Naturalize"},
	{ "cardimage" : "158.png", "name" : "Noble Sacrifice"},
	{ "cardimage" : "120.png", "name" : "Nourish"},
	{ "cardimage" : "285.png", "name" : "Nozdormu"},
	{ "cardimage" : "432.png", "name" : "Onyxia"},
	{ "cardimage" : "14.png", "name" : "Patient Assassin"},
	{ "cardimage" : "82.png", "name" : "Perdition's Blade"},
	{ "cardimage" : "54.png", "name" : "Pint-Sized Summoner"},
	{ "cardimage" : "402.png", "name" : "Pit Lord"},
	{ "cardimage" : "170.png", "name" : "Power Overwhelming"},
	{ "cardimage" : "165.png", "name" : "Power of the Wild"},
	{ "cardimage" : "364.png", "name" : "Preparation"},
	{ "cardimage" : "138.png", "name" : "Priestess of Elune"},
	{ "cardimage" : "228.png", "name" : "Prophet Velen"},
	{ "cardimage" : "496.png", "name" : "Pyroblast"},
	{ "cardimage" : "157.png", "name" : "Questing Adventurer"},
	{ "cardimage" : "95.png", "name" : "Raging Worgen"},
	{ "cardimage" : "503.png", "name" : "Ragnaros the Firelord"},
	{ "cardimage" : "454.png", "name" : "Rampage"},
	{ "cardimage" : "518.png", "name" : "Ravenholdt Assassin"},
	{ "cardimage" : "657.png", "name" : "Redemption"},
	{ "cardimage" : "642.png", "name" : "Repentance"},
	{ "cardimage" : "286.png", "name" : "SI:7 Agent"},
	{ "cardimage" : "148.png", "name" : "Savagery"},
	{ "cardimage" : "8.png", "name" : "Savannah Highmane"},
	{ "cardimage" : "475.png", "name" : "Scarlet Crusader"},
	{ "cardimage" : "279.png", "name" : "Scavenging Hyena"},
	{ "cardimage" : "614.png", "name" : "Sea Giant"},
	{ "cardimage" : "483.png", "name" : "Secretkeeper"},
	{ "cardimage" : "327.png", "name" : "Sense Demons"},
	{ "cardimage" : "442.png", "name" : "Shadow Madness"},
	{ "cardimage" : "673.png", "name" : "Shadowflame"},
	{ "cardimage" : "421.png", "name" : "Shadowform"},
	{ "cardimage" : "550.png", "name" : "Shadowstep"},
	{ "cardimage" : "50.png", "name" : "Shield Slam"},
	{ "cardimage" : "24.png", "name" : "Shieldbearer"},
	{ "cardimage" : "544.png", "name" : "Silence"},
	{ "cardimage" : "648.png", "name" : "Silver Hand Knight"},
	{ "cardimage" : "634.png", "name" : "Silvermoon Guardian"},
	{ "cardimage" : "573.png", "name" : "Siphon Soul"},
	{ "cardimage" : "215.png", "name" : "Slam"},
	{ "cardimage" : "210.png", "name" : "Snake Trap"},
	{ "cardimage" : "553.png", "name" : "Snipe"},
	{ "cardimage" : "4.png", "name" : "Sorcerer's Apprentice"},
	{ "cardimage" : "311.png", "name" : "Soul of the Forest"},
	{ "cardimage" : "324.png", "name" : "Southsea Captain"},
	{ "cardimage" : "103.png", "name" : "Southsea Deckhand"},
	{ "cardimage" : "309.png", "name" : "Spellbender"},
	{ "cardimage" : "42.png", "name" : "Spellbreaker"},
	{ "cardimage" : "627.png", "name" : "Spiteful Smith"},
	{ "cardimage" : "389.png", "name" : "Stampeding Kodo"},
	{ "cardimage" : "464.png", "name" : "Starfall"},
	{ "cardimage" : "152.png", "name" : "Stormforged Axe"},
	{ "cardimage" : "338.png", "name" : "Stranglethorn Tiger"},
	{ "cardimage" : "566.png", "name" : "Summoning Portal"},
	{ "cardimage" : "372.png", "name" : "Sunfury Protector"},
	{ "cardimage" : "221.png", "name" : "Sunwalker"},
	{ "cardimage" : "567.png", "name" : "Sword of Justice"},
	{ "cardimage" : "33.png", "name" : "Sylvanas Windrunner"},
	{ "cardimage" : "477.png", "name" : "Tauren Warrior"},
	{ "cardimage" : "232.png", "name" : "Temple Enforcer"},
	{ "cardimage" : "179.png", "name" : "The Beast"},
	{ "cardimage" : "396.png", "name" : "The Black Knight"},
	{ "cardimage" : "62.png", "name" : "Thoughtsteal"},
	{ "cardimage" : "265.png", "name" : "Thrallmar Farseer"},
	{ "cardimage" : "245.png", "name" : "Tinkmaster Overspark"},
	{ "cardimage" : "391.png", "name" : "Tirion Fordring"},
	{ "cardimage" : "360.png", "name" : "Twilight Drake"},
	{ "cardimage" : "398.png", "name" : "Twisting Nether"},
	{ "cardimage" : "51.png", "name" : "Unbound Elemental"},
	{ "cardimage" : "317.png", "name" : "Unleash the Hounds"},
	{ "cardimage" : "638.png", "name" : "Upgrade!"},
	{ "cardimage" : "160.png", "name" : "Vaporize"},
	{ "cardimage" : "509.png", "name" : "Venture Co. Mercenary"},
	{ "cardimage" : "523.png", "name" : "Violet Teacher"},
	{ "cardimage" : "119.png", "name" : "Void Terror"},
	{ "cardimage" : "25.png", "name" : "Wild Pyromancer"},
	{ "cardimage" : "675.png", "name" : "Windfury Harpy"},
	{ "cardimage" : "273.png", "name" : "Wisp"},
	{ "cardimage" : "112.png", "name" : "Worgen Infiltrator"},
	{ "cardimage" : "633.png", "name" : "Wrath"},
	{ "cardimage" : "629.png", "name" : "Young Dragonhawk"},
	{ "cardimage" : "123.png", "name" : "Young Priestess"},
	{ "cardimage" : "247.png", "name" : "Youthful Brewmaster"},
	{ "cardimage" : "495.png", "name" : "Ysera"},
	{ "cardimage" : "7729.png", "name" : "Avenge"},
	{ "cardimage" : "7740.png", "name" : "Baron Rivendare"},
	{ "cardimage" : "7736.png", "name" : "Dancing Swords"},
	{ "cardimage" : "7735.png", "name" : "Dark Cultist"},
	{ "cardimage" : "7734.png", "name" : "Death's Bite"},
	{ "cardimage" : "7753.png", "name" : "Deathlord"},
	{ "cardimage" : "7732.png", "name" : "Duplicate"},
	{ "cardimage" : "7754.png", "name" : "Echoing Ooze"},
	{ "cardimage" : "7745.png", "name" : "Feugen"},
	{ "cardimage" : "7756.png", "name" : "Haunted Creeper"},
	{ "cardimage" : "7742.png", "name" : "Kel'Thuzad"},
	{ "cardimage" : "7746.png", "name" : "Loatheb"},
	{ "cardimage" : "7748.png", "name" : "Mad Scientist"},
	{ "cardimage" : "7747.png", "name" : "Maexxna"},
	{ "cardimage" : "7755.png", "name" : "Nerub'ar Weblord"},
	{ "cardimage" : "7738.png", "name" : "Nerubian Egg"},
	{ "cardimage" : "7726.png", "name" : "Poison Seeds"},
	{ "cardimage" : "7731.png", "name" : "Reincarnate"},
	{ "cardimage" : "7730.png", "name" : "Shade of Naxxramas"},
	{ "cardimage" : "7749.png", "name" : "Sludge Belcher"},
	{ "cardimage" : "7751.png", "name" : "Spectral Knight"},
	{ "cardimage" : "7744.png", "name" : "Stalagg"},
	{ "cardimage" : "7750.png", "name" : "Stoneskin Gargoyle"},
	{ "cardimage" : "7737.png", "name" : "Undertaker"},
	{ "cardimage" : "7757.png", "name" : "Unstable Ghoul"},
	{ "cardimage" : "7733.png", "name" : "Voidcaller"},
	{ "cardimage" : "7758.png", "name" : "Wailing Soul"},
	{ "cardimage" : "7741.png", "name" : "Webspinner"},
	{ "cardimage" : "683.png", "name" : "Zombie Chow"},
	{ "cardimage" : "12218.png", "name" : "Ancestor's Call"},
	{ "cardimage" : "12245.png", "name" : "Anima Golem"},
	{ "cardimage" : "12181.png", "name" : "Annoy-o-Tron"},
	{ "cardimage" : "12219.png", "name" : "Anodized Robo Cub"},
	{ "cardimage" : "12227.png", "name" : "Antique Healbot"},
	{ "cardimage" : "12246.png", "name" : "Arcane Nullifier X-21"},
	{ "cardimage" : "12183.png", "name" : "Blingtron 3000"},
	{ "cardimage" : "12244.png", "name" : "Bolvar Fordragon"},
	{ "cardimage" : "12193.png", "name" : "Bomb Lobber"},
	{ "cardimage" : "12203.png", "name" : "Bouncing Blade"},
	{ "cardimage" : "12233.png", "name" : "Burly Rockjaw Trogg"},
	{ "cardimage" : "12224.png", "name" : "Call Pet"},
	{ "cardimage" : "12201.png", "name" : "Clockwork Giant"},
	{ "cardimage" : "12200.png", "name" : "Clockwork Gnome"},
	{ "cardimage" : "12222.png", "name" : "Cobalt Guardian"},
	{ "cardimage" : "12304.png", "name" : "Cobra Shot"},
	{ "cardimage" : "12257.png", "name" : "Coghammer"},
	{ "cardimage" : "12179.png", "name" : "Cogmaster"},
	{ "cardimage" : "12265.png", "name" : "Cogmaster's Wrench"},
	{ "cardimage" : "12241.png", "name" : "Crackle"},
	{ "cardimage" : "12303.png", "name" : "Crush"},
	{ "cardimage" : "12298.png", "name" : "Dark Wispers"},
	{ "cardimage" : "12299.png", "name" : "Darkbomb"},
	{ "cardimage" : "12237.png", "name" : "Demonheart"},
	{ "cardimage" : "12182.png", "name" : "Dr. Boom"},
	{ "cardimage" : "12243.png", "name" : "Druid of the Fang"},
	{ "cardimage" : "12234.png", "name" : "Dunemaul Shaman"},
	{ "cardimage" : "12300.png", "name" : "Echo of Medivh"},
	{ "cardimage" : "12176.png", "name" : "Enhance-o Mechano"},
	{ "cardimage" : "12180.png", "name" : "Explosive Sheep"},
	{ "cardimage" : "12238.png", "name" : "Feign Death"},
	{ "cardimage" : "12221.png", "name" : "Fel Cannon"},
	{ "cardimage" : "12264.png", "name" : "Fel Reaver"},
	{ "cardimage" : "12290.png", "name" : "Flame Leviathan"},
	{ "cardimage" : "12192.png", "name" : "Flamecannon"},
	{ "cardimage" : "12271.png", "name" : "Floating Watcher"},
	{ "cardimage" : "12247.png", "name" : "Flying Machine"},
	{ "cardimage" : "12217.png", "name" : "Foe Reaper 4000"},
	{ "cardimage" : "12248.png", "name" : "Force-Tank MAX"},
	{ "cardimage" : "12232.png", "name" : "Gahz'rilla"},
	{ "cardimage" : "12287.png", "name" : "Gazlowe"},
	{ "cardimage" : "12249.png", "name" : "Gilblin Stalker"},
	{ "cardimage" : "12267.png", "name" : "Glaivezooka"},
	{ "cardimage" : "12286.png", "name" : "Gnomeregan Infantry"},
	{ "cardimage" : "12199.png", "name" : "Gnomish Experimenter"},
	{ "cardimage" : "12212.png", "name" : "Goblin Auto-Barber"},
	{ "cardimage" : "12195.png", "name" : "Goblin Blastmage"},
	{ "cardimage" : "12213.png", "name" : "Goblin Sapper"},
	{ "cardimage" : "12273.png", "name" : "Grove Tender"},
	{ "cardimage" : "12268.png", "name" : "Hemet Nesingwary"},
	{ "cardimage" : "12250.png", "name" : "Hobgoblin"},
	{ "cardimage" : "12214.png", "name" : "Illuminator"},
	{ "cardimage" : "12302.png", "name" : "Imp-losion"},
	{ "cardimage" : "12295.png", "name" : "Iron Juggernaut"},
	{ "cardimage" : "12229.png", "name" : "Iron Sensei"},
	{ "cardimage" : "12216.png", "name" : "Jeeves"},
	{ "cardimage" : "12251.png", "name" : "Junkbot"},
	{ "cardimage" : "12252.png", "name" : "Kezan Mystic"},
	{ "cardimage" : "12285.png", "name" : "King of Beasts"},
	{ "cardimage" : "12297.png", "name" : "Light of the Naaru"},
	{ "cardimage" : "12301.png", "name" : "Lightbomb"},
	{ "cardimage" : "12239.png", "name" : "Lil' Exorcist"},
	{ "cardimage" : "12284.png", "name" : "Lost Tallstrider"},
	{ "cardimage" : "12177.png", "name" : "Madder Bomber"},
	{ "cardimage" : "12294.png", "name" : "Mal'Ganis"},
	{ "cardimage" : "12293.png", "name" : "Malorne"},
	{ "cardimage" : "12226.png", "name" : "Mech-Bear-Cat"},
	{ "cardimage" : "12253.png", "name" : "Mechanical Yeti"},
	{ "cardimage" : "12188.png", "name" : "Mechwarper"},
	{ "cardimage" : "12196.png", "name" : "Mekgineer Thermaplugg"},
	{ "cardimage" : "12254.png", "name" : "Metaltooth Leaper"},
	{ "cardimage" : "12189.png", "name" : "Micro Machine"},
	{ "cardimage" : "12190.png", "name" : "Mimiron's Head"},
	{ "cardimage" : "12262.png", "name" : "Mini-Mage"},
	{ "cardimage" : "12283.png", "name" : "Mistress of Pain"},
	{ "cardimage" : "12282.png", "name" : "Mogor the Ogre"},
	{ "cardimage" : "12223.png", "name" : "Muster for Battle"},
	{ "cardimage" : "12292.png", "name" : "Neptulon"},
	{ "cardimage" : "12281.png", "name" : "Ogre Brute"},
	{ "cardimage" : "12235.png", "name" : "Ogre Ninja"},
	{ "cardimage" : "12211.png", "name" : "Ogre Warmaul"},
	{ "cardimage" : "12255.png", "name" : "One-eyed Cheat"},
	{ "cardimage" : "12191.png", "name" : "Piloted Shredder"},
	{ "cardimage" : "12175.png", "name" : "Piloted Sky Golem"},
	{ "cardimage" : "12269.png", "name" : "Powermace"},
	{ "cardimage" : "12274.png", "name" : "Puddlestomper"},
	{ "cardimage" : "12280.png", "name" : "Quartermaster"},
	{ "cardimage" : "12198.png", "name" : "Recombobulator"},
	{ "cardimage" : "12279.png", "name" : "Recycle"},
	{ "cardimage" : "12236.png", "name" : "Sabotage"},
	{ "cardimage" : "12263.png", "name" : "Salty Dog"},
	{ "cardimage" : "12240.png", "name" : "Scarlet Purifier"},
	{ "cardimage" : "12220.png", "name" : "Screwjank Clunker"},
	{ "cardimage" : "12305.png", "name" : "Seal of Light"},
	{ "cardimage" : "12278.png", "name" : "Shadowbomber"},
	{ "cardimage" : "12256.png", "name" : "Shadowboxer"},
	{ "cardimage" : "12257.png", "name" : "Shielded Minibot"},
	{ "cardimage" : "12215.png", "name" : "Shieldmaiden"},
	{ "cardimage" : "12258.png", "name" : "Ship's Cannon"},
	{ "cardimage" : "12197.png", "name" : "Shrinkmeister"},
	{ "cardimage" : "12275.png", "name" : "Siege Engine"},
	{ "cardimage" : "12277.png", "name" : "Siltfin Spiritwalker"},
	{ "cardimage" : "12187.png", "name" : "Sneed's Old Shredder"},
	{ "cardimage" : "12230.png", "name" : "Snowchugger"},
	{ "cardimage" : "12306.png", "name" : "Soot Spewer"},
	{ "cardimage" : "12184.png", "name" : "Spider Tank"},
	{ "cardimage" : "12242.png", "name" : "Steamwheedle Sniper"},
	{ "cardimage" : "12266.png", "name" : "Stonesplinter Trogg"},
	{ "cardimage" : "12288.png", "name" : "Target Dummy"},
	{ "cardimage" : "12276.png", "name" : "Tinker's Sharpsword Oil"},
	{ "cardimage" : "12202.png", "name" : "Tinkertown Technician"},
	{ "cardimage" : "12225.png", "name" : "Toshley"},
	{ "cardimage" : "12291.png", "name" : "Trade Prince Gallywix"},
	{ "cardimage" : "12270.png", "name" : "Tree of Life"},
	{ "cardimage" : "12272.png", "name" : "Troggzor the Earthinator"},
	{ "cardimage" : "12178.png", "name" : "Unstable Portal"},
	{ "cardimage" : "12185.png", "name" : "Upgraded Repair Bot"},
	{ "cardimage" : "12174.png", "name" : "Velen's Chosen"},
	{ "cardimage" : "12259.png", "name" : "Vitality Totem"},
	{ "cardimage" : "12296.png", "name" : "Vol'jin"},
	{ "cardimage" : "12260.png", "name" : "Warbot"},
	{ "cardimage" : "12261.png", "name" : "Wee Spellstopper"},
	{ "cardimage" : "12231.png", "name" : "Whirling Zap-o-matic"},
	{ "cardimage" : "682.png", "name" : "Elite Tauren Chieftain"},
	{ "cardimage" : "251.png", "name" : "Gelbin Mekkatorque"},
	{ "cardimage" : "715.png", "name" : "Murloc"},
	{ "cardimage" : "439.png", "name" : "Repair Bot"},
	{ "cardimage" : "559.png", "name" : "Captain's Parrot"},
	{ "cardimage" : "217.png", "name" : "Old Murk-Eye"}
]