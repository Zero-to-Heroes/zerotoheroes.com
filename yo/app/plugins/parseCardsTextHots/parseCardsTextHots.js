var talentRegex = /\[\[.+?\]\]/gm;

function parseCardsTextHots(review, text) {
	var matches = text.match(talentRegex);
	var result = text;
	// Parsing card names
	if (matches) {
		matches.forEach(function(match) {
			var talentName = match.substring(2, match.length - 2);
			var talent = parseCardsTextHots_getTalent(talentName);
			if (talent) {
				var template = parseCardsTextHots_template(talent);
				var html = parseCardsTextHots_html(talent);
				var newLink = '<a class="talent-hots" data-toggle="tooltip" data-template="' + template + '" data-title="' + html + '" data-html="true" data-container="body" data-animation="false">' + talent.name + '</a>'
				result = result.replace(match, newLink);
			}
		})
	}
	$(function () {
		console.log('loading tooltips', $('[data-toggle="tooltip"]'));
	  	$('[data-toggle="tooltip"]').tooltip()
	})

	return result;
}

function parseCardsTextHots_template(talent) {
	var template = 
		'<div class=\'tooltip parse-cards-text-hots\'>' +
			'<div class=\'tooltip-inner row\'>' +
			'</div>' +
		'</div>'
	return template;
}

function parseCardsTextHots_html(talent) {
	var template = 
		'<div class=\'col-xs-2 icon-container\'>' +
			'<img src=\'https://s3.amazonaws.com/com.zerotoheroes/plugins/heroesofthestorm/talents/' + talent.image + '\'>' +
		'</div>' +
		'<div class=\'col-xs-10 text-container\'>' +
			'<h4>' + talent.name + '</h4>' +
			'<span class=\'level\'>Level: ' + talent.level + '</span>' +
			'<span class=\'description\'>' + talent.description + '</span>' +
			'<span class=\'cooldown\'>Cooldown: <span class=\'cooldown-duration\'>' + talent.cooldown + '</span></span>' +
		'</div>'
	return template;
}

function parseCardsTextHots_attach(element) {
	//console.log('attaching to element', element);
	element.textcomplete([{
		match: /\[\[[a-zA-Z\s]{3,}$/,
		search: function (term, callback, match) {
			//console.log('term and match', term, match);
			callback($.map(hotsTalentDb, function(talent) {
				var res = talent.name.toLowerCase().indexOf(term.substring(2)) === 0 && talent.image ? talent : null;
				return res;
			}))
			$(function () {
				console.log('loading tooltips', $('[data-toggle="tooltip"]'));
			  	$('[data-toggle="tooltip"]').tooltip()
			})
		},
		replace: function(talent) {
			return '[[' + talent.name + ']]';
		},
		context: function (text) { 
			return text.toLowerCase(); 
		},
		template: function(talent, term) {
			var template = parseCardsTextHots_template(talent);
			var html = parseCardsTextHots_html(talent);
			var newLink = '<span class="talent-hots" data-toggle="tooltip" data-template="' + template + '" data-title="' + html + '" data-html="true" data-container="body" data-animation="false">' + talent.name + '</span>'
			return newLink;
		},
		className: 'autocomplete-dropdown-hots',
		index: 0
	}])
}

function parseCardsTextHots_detach(element) {
	//console.log('detaching from element', element);
	element.textcomplete('destroy');
}

function parseCardsTextHots_getTalent(talentName) {
	var result;
	// cf http://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break
	hotsTalentDb.some(function(talent) {
		// Seems like variations (the non-standard version) of the card has a lowercase letter in the name
		if (talent.name.toLowerCase() == talentName.toLowerCase()) {
			result = talent;
			if (result.image) {
				return true;
			}
		}
	});
	return result;
}

var hotsTalentDb = [
    {
        "image": "a-touch-of-honey.png",
        "level": "13",
        "name": "A Touch of Honey",
        "icon": "storm_temp_war3_btnsmash.dds",
        "cooldown": 5,
        "description": "Increase the slow from Keg Smash to 40%.",
        "hero": "Chen",
        "id": "ChenMasteryKegSmashATouchOfHoney"
    },
    {
        "image": "tri-optimal.png",
        "level": "7",
        "name": "Tri-Optimal",
        "icon": "storm_ui_icon_kaelthas_gravitylapse.dds",
        "cooldown": 13,
        "description": "The cooldown of Verdant Spheres is refreshed by 2 seconds per target hit with Gravity Lapse.",
        "hero": "Kael'thas",
        "id": "KaelthasGravityLapseTriOptimal"
    },
    {
        "image": "searing-arrows.png",
        "level": "4",
        "name": "Searing Arrows",
        "icon": "storm_temp_war3_btnsearingarrows.dds",
        "cooldown": 25,
        "description": "Activate to increase Basic Attack damage by 50% for 5 seconds.  Each attack costs 10 Mana.",
        "hero": "Tyrande",
        "id": "TyrandeSearingArrows"
    },
    {
        "image": "tenderizer.png",
        "level": "7",
        "name": "Tenderizer",
        "icon": "storm_ui_icon_hammerofjustice_3.dds",
        "description": "Basic Attacks slow enemy Movement Speed by 25% for 1.5 seconds.",
        "hero": "Stitches",
        "id": "StitchesCombatStyleTenderizer"
    },
    {
        "image": "overtake.png",
        "level": "4",
        "name": "Overtake",
        "icon": "storm_ui_icon_monk_deadlyreach.dds",
        "cooldown": 10,
        "description": "Basic Attacks while Deadly Reach is active increase your Movement Speed by 30% for 2 seconds.",
        "hero": "Kharazim",
        "id": "MonkOvertakeDealyReach"
    },
    {
        "image": "shattered-ground.png",
        "level": "4",
        "name": "Shattered Ground",
        "icon": "storm_ui_icon_sonya_seismicslam.dds",
        "cooldown": 1,
        "description": "Increases Seismic Slam splash damage to 75% of primary target damage.",
        "hero": "Sonya",
        "id": "BarbarianMasteryShatteredGroundSeismicSlam"
    },
    {
        "image": "crave-flesh.png",
        "level": "13",
        "name": "Crave Flesh",
        "icon": "storm_ui_icon_Butcher_Tenderize.dds",
        "cooldown": 14,
        "description": "While an enemy is affected by Butcher's Brand, you gain 30% Movement Speed.",
        "hero": "Butcher",
        "id": "ButcherMasteryButchersBrandCraveFlesh"
    },
    {
        "image": "arcane-barrage.png",
        "level": "4",
        "name": "Arcane Barrage",
        "icon": "storm_temp_war3_btnmanaflare.dds",
        "cooldown": 8,
        "description": "Increases the range of Arcane Flare by 50%.",
        "hero": "Brightwing",
        "id": "BrightwingArcaneBarrageArcaneFlare"
    },
    {
        "image": "encore.png",
        "level": "16",
        "name": "Encore",
        "icon": "storm_ui_icon_deathpact_2.dds",
        "cooldown": 10,
        "description": "Face Melt leaves an Amp behind, which will knock enemies away again 2 seconds later.",
        "hero": "E.T.C.",
        "id": "ETCMasteryEncore"
    },
    {
        "image": "hopelessness.png",
        "level": "1",
        "name": "Hopelessness",
        "icon": "storm_ui_icon_leoric_DrainHope.dds",
        "cooldown": 12,
        "description": "Increases the range of Drain Hope by 20%.",
        "hero": "Leoric",
        "id": "LeoricMasteryHopelessnessDrainHope"
    },
    {
        "image": "versatile.png",
        "level": "4",
        "name": "Versatile",
        "icon": "storm_temp_btn-ability-protoss-hallucination-color.dds",
        "cooldown": 30,
        "description": "Increases the Mana return of Innervate to 25%.",
        "hero": "Malfurion",
        "id": "MalfurionCombatStyleVersatile"
    },
    {
        "image": "bubble-breeze.png",
        "level": "1",
        "name": "Bubble Breeze",
        "icon": "storm_temp_btn-ability-protoss-shieldbattery-color.dds",
        "cooldown": 14,
        "description": "Gain 20% Movement Speed while in Safety Bubble.",
        "hero": "Murky",
        "id": "MurkyMasteryBubbleBreeze"
    },
    {
        "image": "fel-reach.png",
        "level": "4",
        "name": "Fel Reach",
        "icon": "storm_temp_war3_btnshadowstrike.dds",
        "cooldown": 8,
        "description": "Increases the range of Sweeping Strike by 20%.",
        "hero": "Illidan",
        "id": "IllidanMasteryFelReachSweepingStrike"
    },
    {
        "image": "omegastorm.png",
        "level": "20",
        "name": "Omegastorm",
        "icon": "storm_ui_icon_kerrigan_maelstrom.dds",
        "cooldown": 100,
        "description": "Maelstrom size increased by 25%. Amount of Assimilation Shields generated by Maelstrom increased by 100%.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryMaelstromOmegastorm"
    },
    {
        "image": "envenomed-spines.png",
        "level": "4",
        "name": "Envenomed Spines",
        "icon": "storm_temp_btn-upgrade-zerg-missileattacks-level0.dds",
        "description": "Basic Attacks have their range increased by 20% and deal an additional 15 (+3 per level) damage over 3 seconds.",
        "hero": "Zagara",
        "id": "ZagaraCombatStyleEnvenomedSpines"
    },
    {
        "image": "symbiotic-armor.png",
        "level": "13",
        "name": "Symbiotic Armor",
        "icon": "storm_temp_war3_btnspikedbarricades.dds",
        "cooldown": 8,
        "description": "Anub'arak's Beetles are also granted a Shield equal to 90 (+22 per level).",
        "hero": "Anub'arak",
        "id": "AnubarakMasterySymbioticArmorHardenCarapace"
    },
    {
        "image": "slaughterhouse.png",
        "level": "20",
        "name": "Slaughterhouse",
        "icon": "storm_ui_icon_Butcher_LambToTheSlaughter.dds",
        "cooldown": 60,
        "description": "Lamb to the Slaughter now chains all enemy Heroes in range.",
        "hero": "Butcher",
        "id": "ButcherMasterySlaughterhouse"
    },
    {
        "image": "reactive-spark.png",
        "level": "13",
        "name": "Reactive Spark",
        "icon": "storm_temp_war3_btnlightningshield.dds",
        "cooldown": 8,
        "description": "Reduces Lightning Shield's cooldown by 3 seconds and the duration does not start until an enemy is nearby.",
        "hero": "Rehgar",
        "id": "RehgarMasteryReactiveSpark"
    },
    {
        "image": "the-crusade-marches-on.png",
        "level": "7",
        "name": "The Crusade Marches On",
        "icon": "storm_ui_icon_johanna_iron_skin.dds",
        "cooldown": 20,
        "description": "Basic and Heroic Abilities lower the cooldown of Iron Skin by 1.5 seconds.",
        "hero": "Johanna",
        "id": "CrusaderMasteryIronSkinTheCrusadeMarchesOn"
    },
    {
        "image": "wildfire-bear.png",
        "level": "13",
        "name": "Wildfire Bear",
        "icon": "storm_ui_icon_cloakofflames.dds",
        "cooldown": 20,
        "description": "Misha deals 12 (+2.5 per level) damage per second to nearby enemies.",
        "hero": "Rexxar",
        "id": "RexxarSpiritBondWildfireBear"
    },
    {
        "image": "ravenous-spirit.png",
        "level": "10",
        "name": "Ravenous Spirit",
        "icon": "storm_btn_d3_witchdoctor_locustswarm.dds",
        "cooldown": 90,
        "description": "Channel a Ravenous Spirit that deals 50 (+18 per level) damage per second. Cannot move while channeling. Lasts for 8 seconds.",
        "hero": "Nazeebo",
        "id": "WitchDoctorHeroicAbilityRavenousSpirits"
    },
    {
        "image": "frost-shards.png",
        "level": "4",
        "name": "Frost Shards",
        "icon": "storm_ui_icon_jaina_frostbolt.dds",
        "cooldown": 4,
        "description": "Frostbolt will now pierce the first target to hit an additional target behind them.",
        "hero": "Jaina",
        "id": "JainaMasteryFrostShards"
    },
    {
        "image": "vengeance.png",
        "level": "20",
        "name": "Vengeance",
        "icon": "storm_ui_icon_valla_strafe.dds",
        "cooldown": 60,
        "description": "Strafe also fires penetrating bolts in a line for 7.5 (+3.375 per level) damage every 0.25 seconds.",
        "hero": "Valla",
        "id": "DemonHunterMasteryVengeance"
    },
    {
        "image": "double-dragon.png",
        "level": "20",
        "name": "Double Dragon",
        "icon": "storm_temp_war3_btnsnapdragon.dds",
        "cooldown": 45,
        "description": "After hitting a target with Water Dragon, another dragon is summoned at the point of impact.",
        "hero": "Li Li",
        "id": "LiLiMasteryWaterDragonDoubleDragon"
    },
    {
        "image": "metabolic-boost.png",
        "level": "16",
        "name": "Metabolic Boost",
        "icon": "storm_ui_icon_zagara_creep.dds",
        "cooldown": 15,
        "description": "Movement Speed boost on Creep increased to 40%.",
        "hero": "Zagara",
        "id": "ZagaraMasteryMetabolicBoost"
    },
    {
        "image": "reinforce-structure.png",
        "level": "1",
        "name": "Reinforce Structure",
        "icon": "storm_ui_icon_tassadar_plasmashield.dds",
        "cooldown": 5,
        "description": "Plasma Shield is 100% stronger and lasts 100% longer when cast on Structures.",
        "hero": "Tassadar",
        "id": "TassadarMasteryReinforceStructure"
    },
    {
        "image": "fist-of-justice.png",
        "level": "1",
        "name": "Fist of Justice",
        "icon": "storm_ui_icon_hammerofjustice_2.dds",
        "cooldown": 10,
        "description": "Basic Attacks reduce cooldown of Hammer of Justice by 1 second.",
        "hero": "Uther",
        "id": "UtherMasteryFistofJustice"
    },
    {
        "image": "remote-delivery.png",
        "level": "4",
        "name": "Remote Delivery",
        "icon": "storm_ui_icon_nova_holodecoy.dds",
        "cooldown": 15,
        "description": "Reduces the cooldown of Holo Decoy by 3 seconds, and increases the range by 100%.",
        "hero": "Nova",
        "id": "NovaExtendedProjection"
    },
    {
        "image": "grooved-spines.png",
        "level": "13",
        "name": "Grooved Spines",
        "icon": "storm_ui_icon_zagara_hunterkiller.dds",
        "cooldown": 14,
        "description": "Hunter Killer has its range increased by 35% and damage increased by 20%.",
        "hero": "Zagara",
        "id": "ZagaraMasteryGroovedSpines"
    },
    {
        "image": "protective-shield.png",
        "level": "4",
        "name": "Protective Shield",
        "icon": "storm_temp_btn-upgrade-protoss-shieldslevel2.dds",
        "cooldown": 60,
        "description": "Activate to shield an allied Hero for 15% of their max Health for 5 seconds.",
        "hero": "Uther",
        "id": "GenericTalentProtectiveShield"
    },
    {
        "image": "wailing-arrow.png",
        "level": "10",
        "name": "Wailing Arrow",
        "icon": "storm_ui_icon_sylvanas_wailingarrow.dds",
        "cooldown": 90,
        "description": "Shoot an arrow that can be reactivated to deal 140 (+18 per level) damage and Silencing enemies in an area making them unable to use Abilities for 2.5 seconds. The arrow detonates automatically when it reaches maximum range.",
        "hero": "Sylvanas",
        "id": "SylvanasHeroicAbilityWailingArrow"
    },
    {
        "image": "way-of-the-hundred-fists.png",
        "level": "7",
        "name": "Way of the Hundred Fists",
        "icon": "storm_ui_icon_monk_dash.dds",
        "cooldown": 12,
        "description": "Radiant Dashing to an enemy causes you to launch of volley of blows dealing 180 (+18 per level) total damage instead of a Basic Attack.",
        "hero": "Kharazim",
        "id": "MonkWayoftheHundredFistsRadiantDash"
    },
    {
        "image": "break-it-down.png",
        "level": "1",
        "name": "Break it Down!",
        "icon": "storm_temp_war3_btnpillage.dds",
        "description": "Scrap causes Abilities to cooldown three times as fast for 3.07 seconds.",
        "hero": "Gazlowe",
        "id": "TinkerCombatStyleBreakitDown"
    },
    {
        "image": "enduring-growth.png",
        "level": "7",
        "name": "Enduring Growth",
        "icon": "storm_btn-ability_malfurion-regrowth.dds",
        "cooldown": 7,
        "description": "Increases the duration of Regrowth by 6 seconds.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryEnduringGrowth"
    },
    {
        "image": "frost-presence.png",
        "level": "1",
        "name": "Frost Presence",
        "icon": "storm_ui_icon_howlingblast.dds",
        "cooldown": 12,
        "description": "Howling Blast cooldown lowered by 3 seconds.",
        "hero": "Arthas",
        "id": "ArthasMasteryFrostPresenceHowlingBlast"
    },
    {
        "image": "pressurized-glands.png",
        "level": "1",
        "name": "Pressurized Glands",
        "icon": "storm_ui_icon_abathur_spikeburst.dds",
        "cooldown": 6,
        "description": "Increases the range of Symbiote's Spike Burst by 25% and decreases the cooldown by 1 second.",
        "hero": "Abathur",
        "id": "AbathurMasteryPressurizedGlands"
    },
    {
        "image": "wormhole.png",
        "level": "13",
        "name": "Wormhole",
        "icon": "storm_ui_icon_zeratul_blink.dds",
        "cooldown": 10,
        "description": "For 2 seconds, you can activate Blink again to return to the point where it was cast from.",
        "hero": "Zeratul",
        "id": "ZeratulMasteryWormhole"
    },
    {
        "image": "boundless-conviction.png",
        "level": "4",
        "name": "Boundless Conviction",
        "icon": "storm_ui_icon_holyradiance.dds",
        "cooldown": 12,
        "description": "Increases the width and length of Holy Radiance by 40%.",
        "hero": "Uther",
        "id": "UtherMasteryBoundlessConvictionHolyRadiance"
    },
    {
        "image": "maelstrom-shells.png",
        "level": "4",
        "name": "Maelstrom Shells",
        "icon": "storm_temp_btn-upgrade-terran-u238shells.dds",
        "description": "Increase standard Basic Attack range by 20%.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerMasteryMaelstromShells"
    },
    {
        "image": "reactive-parry.png",
        "level": "1",
        "name": "Reactive Parry",
        "icon": "storm_ui_icon_artanis_doubleslash_off.dds",
        "cooldown": 4,
        "description": "Activating Twin Blades reduces the damage received from the next Hero Basic Attack by 50%.  Can store up to 2 charges.",
        "hero": "Artanis",
        "id": "ArtanisTwinBladesReactiveParry"
    },
    {
        "image": "seasoned-marksman.png",
        "level": "1",
        "name": "Seasoned Marksman",
        "icon": "storm_temp_btn-tips-laserdrillantiair.dds",
        "description": "For every 6 enemy Minion or captured Mercenary kills near your Hero, gain 1 Basic Attack damage. Hero Takedowns count as 3 Minion kills.",
        "hero": "Zeratul",
        "id": "GenericTalentSeasonedMarksman"
    },
    {
        "image": "bottomless-mug.png",
        "level": "16",
        "name": "Bottomless Mug",
        "icon": "storm_temp_war3_btnstrongdrink.dds",
        "cooldown": 5,
        "description": "Reduces Fortifying Brew's cooldown by 2 seconds.",
        "hero": "Chen",
        "id": "ChenCombatStyleBottomlessMug"
    },
    {
        "image": "master-of-destruction.png",
        "level": "1",
        "name": "Master of Destruction",
        "icon": "storm_temp_war3_btnsoulburn.dds",
        "cooldown": 6,
        "description": "Increases All Shall Burn's damage against Structures by 25%, and reduces the Mana cost from 16 to 10 per second.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryMasterOfDestruction"
    },
    {
        "image": "grizzled-bear.png",
        "level": "1",
        "name": "Grizzled Bear",
        "icon": "storm_temp_war3_btndefend.dds",
        "cooldown": 0.5,
        "description": "Misha periodically reduces the damage received from Hero Basic Attacks by 50%.  Stores up to 2 charges.",
        "hero": "Rexxar",
        "id": "RexxarSpiritBondGrizzledBear"
    },
    {
        "image": "cleanse.png",
        "level": "7",
        "name": "Cleanse",
        "icon": "storm_ui_temp_icon_blindinglight.dds",
        "cooldown": 30,
        "description": "Activate to remove all stuns, roots, silences, and slows from the target and reduce the duration of their reapplication by 50% for 2 seconds.",
        "hero": "Uther",
        "id": "GenericTalentCleanse"
    },
    {
        "image": "marked-for-death.png",
        "level": "4",
        "name": "Marked for Death",
        "icon": "storm_btn_d3_barbarian_furiouscharge.dds",
        "cooldown": 6,
        "description": "Your next Basic Attack on the Dive target deals 100% more damage.",
        "hero": "Illidan",
        "id": "IllidanMasteryMarkedforDeathDive"
    },
    {
        "image": "triple-tap.png",
        "level": "10",
        "name": "Triple Tap",
        "icon": "storm_ui_icon_nova_tripletap.dds",
        "cooldown": 100,
        "description": "Locks in on the target Hero, then fires 3 shots that hit the first Hero or Structure they come in contact with for 80 (+33 per level) damage each.",
        "hero": "Nova",
        "id": "NovaHeroicAbilityTripleTap"
    },
    {
        "image": "underking.png",
        "level": "4",
        "name": "Underking",
        "icon": "storm_temp_btn-ability-protoss-charge-color.dds",
        "cooldown": 16,
        "description": "Increases the range of Burrow Charge by 20% and lowers the cooldown by 2 seconds.",
        "hero": "Anub'arak",
        "id": "AnubarakMasteryUnderkingBurrowCharge"
    },
    {
        "image": "clockwerk-steam-fists.png",
        "level": "4",
        "name": "Clockwerk Steam Fists",
        "icon": "storm_ui_icon_rockitturret.dds",
        "cooldown": 15,
        "description": "Basic Attacks increase the duration of active Rock-It! Turrets by 1 second.",
        "hero": "Gazlowe",
        "id": "TinkerCombatStyleClockwerkSteamFists"
    },
    {
        "image": "play-again.png",
        "level": "10",
        "name": "Play Again!",
        "icon": "storm_ui_icon_lostvikings_playagain.dds",
        "description": "Summon, fully heal, and revive all Lost Vikings at target location after a Viking channels for 2 seconds. \nOnly one Viking may attempt to summon at a time.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsHeroicAbilityPlayAgain"
    },
    {
        "image": "vengeful-roots.png",
        "level": "4",
        "name": "Vengeful Roots",
        "icon": "storm_btn-ability_malfurion-entanglingroots.dds",
        "cooldown": 10,
        "description": "Entangling Roots also spawns a Treant that does 20 (+6 per level) damage per second and lasts 10 seconds.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryVengefulRoots"
    },
    {
        "image": "continuous-slime.png",
        "level": "13",
        "name": "Continuous Slime",
        "icon": "storm_temp_war3_btncorrosivebreath.dds",
        "cooldown": 4,
        "description": "Decreases the cooldown of Slime from 4 seconds to 3 seconds.",
        "hero": "Murky",
        "id": "MurkyMasteryContinuousSlime"
    },
    {
        "image": "intensive-care.png",
        "level": "13",
        "name": "Intensive Care",
        "icon": "storm_ui_icon_medic_healingbeam.dds",
        "cooldown": 0.5,
        "description": "When Healing Beam is on a single target for over 3 seconds, its healing amount increases by 25% and Mana cost increases by 4.",
        "hero": "Lt. Morales",
        "id": "MedicIntensiveCare"
    },
    {
        "image": "elemental-conduit.png",
        "level": "20",
        "name": "Elemental Conduit",
        "icon": "storm_temp_war3_btnstormearth&fire.dds",
        "cooldown": 100,
        "description": "Using an Ability will cause one of the elemental spirits to fight with you for 4 seconds. Only one spirit can be active at a time.",
        "hero": "Chen",
        "id": "ChenMasteryStormEarthFireElementalConduit"
    },
    {
        "image": "large-and-in-charge.png",
        "level": "16",
        "name": "Large and In Charge",
        "icon": "storm_ui_icon_lostvikings_selectolaf.dds",
        "description": "When Olaf charges enemies, they are stunned for 1 second.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryLargeAndInCharge"
    },
    {
        "image": "double-necked-guitar.png",
        "level": "4",
        "name": "Double-Necked Guitar",
        "icon": "storm_ui_icon_psionicblast_2.dds",
        "cooldown": 12,
        "description": "Increases Powerslide's width by 100% and you slide 30% faster.",
        "hero": "E.T.C.",
        "id": "ETCMasteryDoubleNeckedGuitar"
    },
    {
        "image": "trauma-trigger.png",
        "level": "1",
        "name": "Trauma Trigger",
        "icon": "storm_ui_icon_medic_deployshield_b.dds",
        "cooldown": 15,
        "description": "You gain an untalented Safeguard automatically if you take damage while below 50% Health. This effect has a 20 second cooldown.",
        "hero": "Lt. Morales",
        "id": "MedicTraumaTrigger"
    },
    {
        "image": "storm-earth-fire.png",
        "level": "10",
        "name": "Storm, Earth, Fire",
        "icon": "storm_temp_war3_btnstormearth&fire.dds",
        "cooldown": 100,
        "description": "Split into three elemental spirits for 15.15 seconds, each with 50% of your maximum Health, and enables two new leaping attacks for use.\nStorm attacks at range for 30 (+5 per level) damage. \nEarth attacks slowly for 20 (+3 per level) damage and slows enemies by 25%. \nFire attacks quickly for 18 (+1 per level) damage.",
        "hero": "Chen",
        "id": "ChenHeroicAbilityStormEarthFire"
    },
    {
        "image": "khaydarian-resonance.png",
        "level": "1",
        "name": "Khaydarian Resonance",
        "icon": "storm_ui_icon_artanis_repositionmatrix.dds",
        "cooldown": 14,
        "description": "If Phase Prism misses, reduce the cooldown by 8 seconds and refund 100% of the Mana.",
        "hero": "Artanis",
        "id": "ArtanisPhasePrismKhaydarianResonance"
    },
    {
        "image": "lock-and-load.png",
        "level": "16",
        "name": "Lock and Load",
        "icon": "storm_ui_icon_tychus_minigun.dds",
        "description": "While the Minigun is wound up, gain 15% increased Move Speed.",
        "hero": "Tychus",
        "id": "TychusCombatStyleLockandLoad"
    },
    {
        "image": "leaping-spiders.png",
        "level": "16",
        "name": "Leaping Spiders",
        "icon": "storm_btn_d3_witchdoctor_corpsespiders.dds",
        "cooldown": 10,
        "description": "Corpse Spiders leap at their targets and deal 15% more damage.",
        "hero": "Nazeebo",
        "id": "WitchDoctorMasteryLeapingSpidersCorpseSpiders"
    },
    {
        "image": "orbital-bombardment.png",
        "level": "20",
        "name": "Orbital Bombardment",
        "icon": "storm_ui_icon_artanis_disruptionweb.dds",
        "cooldown": 50,
        "description": "Suppression Pulse gains an additional charge.  There is a 10 second cooldown between uses.",
        "hero": "Artanis",
        "id": "ArtanisSpearofAdunSuppressionPulseOrbitalBombardment"
    },
    {
        "image": "wintermute.png",
        "level": "20",
        "name": "Wintermute",
        "icon": "storm_ui_icon_jaina_summonwaterelemental.dds",
        "cooldown": 80,
        "description": "Increases the cast range of Water Elemental by 50%, and the Water Elemental will now mimic your Basic Abilities for 50% damage.",
        "hero": "Jaina",
        "id": "JainaMasteryWintermute"
    },
    {
        "image": "impatience-is-a-virtue.png",
        "level": "16",
        "name": "Impatience Is a Virtue",
        "icon": "storm_temp_war3_btnmilitia.dds",
        "description": "Enemies damaged by a Viking's Basic Attack reduce the cooldown of all Viking Abilities by 0.25 seconds.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryImpatienceIsAVirtue"
    },
    {
        "image": "hammer-time.png",
        "level": "16",
        "name": "Hammer Time",
        "icon": "storm_temp_war3_btnfeedback.dds",
        "cooldown": 10,
        "description": "Your first Basic Attack against a target slowed by Hammerang will stun them for 0.75 seconds.",
        "hero": "Falstad",
        "id": "FalstadMasteryHammerangHammerTime"
    },
    {
        "image": "medusa-blades.png",
        "level": "4",
        "name": "Medusa Blades",
        "icon": "storm_temp_btn-upgrade-zerg-airattacks-level2.dds",
        "description": "Basic Attacks deal 25% damage to three nearby targets.",
        "hero": "Zagara",
        "id": "ZagaraCombatStyleMedusaBlades"
    },
    {
        "image": "slowing-mines.png",
        "level": "7",
        "name": "Slowing Mines",
        "icon": "storm_ui_icon_sgthammer_spidermines.dds",
        "cooldown": 14,
        "description": "Increase the Movement Speed slow of Spider Mines to 40%, and the duration to 2 seconds.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerMasterySlowingMinesSpiderMines"
    },
    {
        "image": "stim-pack.png",
        "level": "13",
        "name": "Stim Pack",
        "icon": "storm_ui_icon_tychus_runandgun.dds",
        "cooldown": 8,
        "description": "After using Run and Gun, gain 20% Attack Speed and 20% Movement Speed for 3 seconds",
        "hero": "Tychus",
        "id": "TychusMasteryRunandGunStimPack"
    },
    {
        "image": "imposing-will.png",
        "level": "13",
        "name": "Imposing Will",
        "icon": "storm_ui_icon_tyrael_righteousness.dds",
        "cooldown": 12,
        "description": "Enemies that attack you while shielded have their Attack Speed and Movement Speed slowed by 50% for 2 seconds.",
        "hero": "Tyrael",
        "id": "TyraelMasteryImposingWillRighteousness"
    },
    {
        "image": "melting-point.png",
        "level": "4",
        "name": "Melting Point",
        "icon": "storm_ui_icon_tychus_fraggrenade.dds",
        "cooldown": 10,
        "description": "Frag Grenade deals an additional 200 (+30 per level) damage over 10 seconds to Minions and Structures.",
        "hero": "Tychus",
        "id": "TychusMasteryFragGrenadeMeltingPoint"
    },
    {
        "image": "impaling-swarm.png",
        "level": "7",
        "name": "Impaling Swarm",
        "icon": "storm_ui_icon_kerrigan_impalingblades.dds",
        "cooldown": 12,
        "description": "Impaling Blades spawns 2 Zerglings that attack your enemies.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryCrushingSwarm"
    },
    {
        "image": "hellstorm.png",
        "level": "20",
        "name": "Hellstorm",
        "icon": "storm_btn_d3_wizard_shockpulse.dds",
        "cooldown": 60,
        "description": "Lightning Breath lasts and reaches 50% longer.",
        "hero": "Diablo",
        "id": "DiabloMasteryHellstormLightningBreath"
    },
    {
        "image": "hedonism.png",
        "level": "13",
        "name": "Hedonism",
        "icon": "storm_temp_war3_btnorboffire.dds",
        "cooldown": 10,
        "description": "Reduces Globe of Annihilation's Mana cost by 30.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryHedonism"
    },
    {
        "image": "water-dragon.png",
        "level": "10",
        "name": "Water Dragon",
        "icon": "storm_temp_war3_btnsnapdragon.dds",
        "cooldown": 45,
        "description": "Summon a Water Dragon that after a delay hits the nearest enemy Hero and all enemies near them, dealing 140 (+14 per level) damage and slowing their Movement Speed by 70% for 4 seconds.",
        "hero": "Li Li",
        "id": "LiLiHeroicAbilityWaterDragon"
    },
    {
        "image": "explosive-attacks.png",
        "level": "1",
        "name": "Explosive Attacks",
        "icon": "storm_ui_icon_lostvikings_selectbaleog.dds",
        "description": "Increases BaleogÃ¢â‚¬â„¢s splash damage against non-Heroic enemies to 100%.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryExplosiveAttacks"
    },
    {
        "image": "bioshield.png",
        "level": "4",
        "name": "Bioshield",
        "icon": "storm_ui_icon_medic_healingbeam.dds",
        "cooldown": 0.5,
        "description": "If your target is at full Health, they gain a Shield that absorbs 20 (+7.5 per level) damage, stacking up to 5 times.",
        "hero": "Lt. Morales",
        "id": "MedicBioshield"
    },
    {
        "image": "demonic-invasion.png",
        "level": "10",
        "name": "Demonic Invasion",
        "icon": "storm_btn_d3ros_crusader_trebuchet.dds",
        "cooldown": 100,
        "description": "Rain a small army of Demonic Grunts down on enemies, dealing 20 (+5 per level) damage per impact. Demon Grunts deal 20 (+2 per level) damage and have 200 (+30 per level) health.\nDamage is doubled versus non-Heroic targets.",
        "hero": "Azmodan",
        "id": "AzmodanHeroicAbilityDemonicInvasion"
    },
    {
        "image": "overload.png",
        "level": "1",
        "name": "Overload",
        "icon": "storm_ui_icon_tassadar_psionicstorm.dds",
        "cooldown": 8,
        "description": "Increases Psionic Storm's range by 33%.",
        "hero": "Tassadar",
        "id": "TassadarPsionicStormOverload"
    },
    {
        "image": "untapped-potential.png",
        "level": "20",
        "name": "Untapped Potential",
        "icon": "storm_temp_war3_btnbarrel.dds",
        "cooldown": 70,
        "description": "Increases duration by 2 seconds. Additionally, gain an extra 5% Movement Speed whenever an enemy is hit, up to 100%.",
        "hero": "Chen",
        "id": "ChenMasteryWanderingKegUntappedPotential"
    },
    {
        "image": "rejuvenating-bubble.png",
        "level": "16",
        "name": "Rejuvenating Bubble",
        "icon": "storm_temp_btn-ability-protoss-shieldbattery-color.dds",
        "cooldown": 14,
        "description": "Safety Bubble restores 50% of your Health.",
        "hero": "Murky",
        "id": "MurkyMasteryRejuvenatingBubble"
    },
    {
        "image": "unfurling-spray.png",
        "level": "1",
        "name": "Unfurling Spray",
        "icon": "storm_temp_war3_btnreplenishhealth.dds",
        "cooldown": 4,
        "description": "Increases Soothing Mist's range by 33.3%.",
        "hero": "Brightwing",
        "id": "BrightwingUnfurlingSpraySoothingMist"
    },
    {
        "image": "forward-momentum.png",
        "level": "7",
        "name": "Forward Momentum",
        "icon": "storm_btn_d3_barbarian_rend.dds",
        "description": "Basic Attacks reduce Basic Ability cooldowns by 1 second.",
        "hero": "Rehgar",
        "id": "ForwardMomentumRehgar"
    },
    {
        "image": "stim-drone.png",
        "level": "10",
        "name": "Stim Drone",
        "icon": "storm_ui_icon_medic_stim.dds",
        "cooldown": 90,
        "description": "Grant an allied Hero 75% Attack Speed and 25% Movement Speed for 10 seconds.",
        "hero": "Lt. Morales",
        "id": "MedicHeroicAbilityStimDrone"
    },
    {
        "image": "life-seed.png",
        "level": "13",
        "name": "Life Seed",
        "icon": "storm_btn-ability_malfurion-regrowth.dds",
        "cooldown": 7,
        "description": "Nearby damaged allied Heroes will automatically gain the heal over time portion of Regrowth. This effect has a 20 second cooldown.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryLifeSeed"
    },
    {
        "image": "vorpal-blade.png",
        "level": "4",
        "name": "Vorpal Blade",
        "icon": "storm_btn_d3_wizard_spectralblade.dds",
        "cooldown": 15,
        "description": "Activate to teleport to the last non-structure target you attacked within 3 seconds.",
        "hero": "Zeratul",
        "id": "ZeratulCombatStyleVorpalBlade"
    },
    {
        "image": "first-aid.png",
        "level": "7",
        "name": "First Aid",
        "icon": "storm_temp_btn-ability-terran-heal-color.dds",
        "cooldown": 60,
        "description": "Activate to heal 35.49% of your max Health over 6 seconds.",
        "hero": "Zeratul",
        "id": "GenericTalentFirstAid"
    },
    {
        "image": "relentless.png",
        "level": "13",
        "name": "Relentless",
        "icon": "storm_temp_war3_btnreincarnation.dds",
        "description": "Reduces the duration of silences, stuns, slows, and roots against your Hero by 50%.",
        "hero": "Tychus",
        "id": "GenericTalentRelentless"
    },
    {
        "image": "herbal-cleanse.png",
        "level": "16",
        "name": "Herbal Cleanse",
        "icon": "storm_temp_war3_btnsnazzypotion.dds",
        "cooldown": 3,
        "description": "Healing Brew removes all silences, stuns, slows, roots, and polymorphs and increases the Movement Speed of the target by 20% for 3 seconds.",
        "hero": "Li Li",
        "id": "LiLiMasteryHealingBrewHerbalCleanse"
    },
    {
        "image": "volatile-acid.png",
        "level": "7",
        "name": "Volatile Acid",
        "icon": "storm_ui_icon_zagara_banelingbarrage.dds",
        "cooldown": 10,
        "description": "Baneling damage against non-Heroic targets increased by 50%.",
        "hero": "Zagara",
        "id": "ZagaraMasteryVolatileAcid"
    },
    {
        "image": "legion-of-northrend.png",
        "level": "20",
        "name": "Legion of Northrend",
        "icon": "storm_temp_war3_btnanimatedead.dds",
        "cooldown": 100,
        "description": "3 additional Ghouls are created.  Ghouls heal for an additional 25% and last 5 seconds longer.",
        "hero": "Arthas",
        "id": "ArthasMasteryLegionOfNorthrendArmyoftheDead"
    },
    {
        "image": "face-smelt.png",
        "level": "13",
        "name": "Face Smelt",
        "icon": "storm_ui_icon_deathpact_2.dds",
        "cooldown": 10,
        "description": "Face Melt slows enemies by 80% fading over 2 seconds.",
        "hero": "E.T.C.",
        "id": "ETCMasteryFaceSmelt"
    },
    {
        "image": "adaptation.png",
        "level": "7",
        "name": "Adaptation",
        "icon": "storm_ui_icon_kerrigan_ravage.dds",
        "cooldown": 8,
        "description": "Ravage can be used to jump to allies, refunding half the cooldown and Mana cost.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryAdaptation"
    },
    {
        "image": "flow-rider.png",
        "level": "4",
        "name": "Flow Rider",
        "icon": "storm_temp_war3_btnforceofnature.dds",
        "cooldown": 14,
        "description": "Lowers the cooldown of Barrel Roll by 40%.",
        "hero": "Falstad",
        "id": "FalstadMasteryBarrelRollFlowRider"
    },
    {
        "image": "eternal-retaliation.png",
        "level": "4",
        "name": "Eternal Retaliation",
        "icon": "storm_ui_icon_johanna_condemn.dds",
        "cooldown": 10,
        "description": "Condemn's cooldown is lowered by 0.75 seconds for each enemy affected. Maximum of 10 targets.",
        "hero": "Johanna",
        "id": "CrusaderMasteryCondemnEternalRetaliation"
    },
    {
        "image": "summon-sindragosa.png",
        "level": "10",
        "name": "Summon Sindragosa",
        "icon": "storm_temp_war3_btnfrostwyrm.dds",
        "cooldown": 80,
        "description": "Deals 150 (+15 per level) damage and slows enemies by 60% for 2 seconds.  Also disables Minions for 10 seconds and Structures for 20 seconds.",
        "hero": "Arthas",
        "id": "ArthasHeroicAbilitySummonSindragosa"
    },
    {
        "image": "shake-it-off.png",
        "level": "7",
        "name": "Shake It Off",
        "icon": "storm_temp_war3_btnpandataunt.dds",
        "description": "Reduces the duration of the next Stun or Root against you by 75%. Can only trigger once every 15 seconds.",
        "hero": "Li Li",
        "id": "LiLiMasteryShakeIfOff"
    },
    {
        "image": "buried-alive.png",
        "level": "20",
        "name": "Buried Alive",
        "icon": "storm_ui_icon_leoric_Entomb.dds",
        "cooldown": 50,
        "description": "Enemies inside Entomb take 30 (+6 per level) damage per second.",
        "hero": "Leoric",
        "id": "LeoricMasteryBuriedAliveEntomb"
    },
    {
        "image": "overdrive.png",
        "level": "16",
        "name": "Overdrive",
        "icon": "storm_btn_d3_wizard_archon.dds",
        "cooldown": 25,
        "description": "Activate to increase Ability Power by 25% and Mana costs by 40% for 5 seconds.",
        "hero": "Nova",
        "id": "GenericTalentOverdrive"
    },
    {
        "image": "avatar.png",
        "level": "10",
        "name": "Avatar",
        "icon": "storm_ui_icon_avatar.dds",
        "cooldown": 100,
        "description": "Transform for 20 seconds, gaining 320 (+96 per level) Health and causing your Basic Attacks to stun enemies.",
        "hero": "Muradin",
        "id": "MuradinHeroicAbilityAvatar"
    },
    {
        "image": "void-slash.png",
        "level": "7",
        "name": "Void Slash",
        "icon": "storm_ui_icon_zeratul_cleave.dds",
        "cooldown": 6,
        "description": "Cleave deals 30% increased damage if used while Cloaked.",
        "hero": "Zeratul",
        "id": "ZeratulMasteryVoidSlash"
    },
    {
        "image": "tumor-clutch.png",
        "level": "4",
        "name": "Tumor Clutch",
        "icon": "storm_ui_icon_zagara_creep.dds",
        "cooldown": 15,
        "description": "Creep Tumor mana cost removed. Cooldown decreased to 10 seconds.",
        "hero": "Zagara",
        "id": "ZagaraMasteryTumorClutch"
    },
    {
        "image": "mighty-gust.png",
        "level": "10",
        "name": "Mighty Gust",
        "icon": "storm_temp_war3_btngryphonrider.dds",
        "cooldown": 40,
        "description": "Push enemies away, and slow their Movement Speed by 60% decaying over 5 seconds.",
        "hero": "Falstad",
        "id": "FalstadHeroicAbilityMightyGust"
    },
    {
        "image": "knight-takes-pawn.png",
        "level": "1",
        "name": "Knight Takes Pawn",
        "icon": "storm_ui_icon_johanna_condemn.dds",
        "cooldown": 10,
        "description": "Condemn deals 60 (+15 per level) additional damage to Minions and Mercenaries and stuns them for 3 seconds.",
        "hero": "Johanna",
        "id": "CrusaderMasteryCondemnKnightTakesPawn"
    },
    {
        "image": "tranquility.png",
        "level": "10",
        "name": "Tranquility",
        "icon": "storm_btn-ability_malfurion-tranquility.dds",
        "cooldown": 100,
        "description": "Heals 20 (+9 per level) Health per second to nearby allies over 10 seconds.",
        "hero": "Malfurion",
        "id": "MalfurionHeroicAbilityTranquility"
    },
    {
        "image": "goblin-fusion.png",
        "level": "4",
        "name": "Goblin Fusion",
        "icon": "storm_ui_icon_dethlazor.dds",
        "cooldown": 12,
        "description": "Deth Lazor gains an additional charge level after reaching max size, which increases the damage dealt by 25%.",
        "hero": "Gazlowe",
        "id": "TinkerMasteryGoblinFusion"
    },
    {
        "image": "death-touch.png",
        "level": "7",
        "name": "Death Touch",
        "icon": "storm_temp_war3_btndeathcoil.dds",
        "cooldown": 9,
        "description": "Death Coil causes enemy Minions to explode, killing the target instantly and dealing its normal damage to other nearby enemies.",
        "hero": "Arthas",
        "id": "ArthasMasteryDeathTouch"
    },
    {
        "image": "evasive-fire.png",
        "level": "13",
        "name": "Evasive Fire",
        "icon": "storm_ui_icon_sylvanas_witheringfire.dds",
        "cooldown": 2,
        "description": "You gain 10% Movement Speed for 2 seconds whenever an enemy is hit with Withering Fire, stacking up to 30%.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentWitheringFireEvasiveFire"
    },
    {
        "image": "immortal-coil.png",
        "level": "16",
        "name": "Immortal Coil",
        "icon": "storm_temp_war3_btndeathcoil.dds",
        "cooldown": 9,
        "description": "Death Coil also heals when used on enemies. When used on self, the amount healed is increased by 50%.",
        "hero": "Arthas",
        "id": "ArthasMasteryImmortalCoil"
    },
    {
        "image": "unleash-the-boars.png",
        "level": "10",
        "name": "Unleash the Boars",
        "icon": "storm_ui_icon_rexxar_unleashtheboars.dds",
        "cooldown": 60,
        "description": "Release a herd of boars that track down all enemy Heroes in a direction, dealing 40 (+10 per level) damage, revealing, and slowing enemies by 40% for 5 seconds.",
        "hero": "Rexxar",
        "id": "RexxarHeroicAbilityUnleashTheBoars"
    },
    {
        "image": "leeching-plasma.png",
        "level": "4",
        "name": "Leeching Plasma",
        "icon": "storm_ui_icon_tassadar_plasmashield.dds",
        "cooldown": 5,
        "description": "While Plasma Shield is active, 30% of the target's Basic Attack damage against the primary target is returned as Health.",
        "hero": "Tassadar",
        "id": "TassadarMasteryLeechingPlasma"
    },
    {
        "image": "survival-instincts.png",
        "level": "1",
        "name": "Survival Instincts",
        "icon": "storm_ui_icon_abathur_spawnlocust.dds",
        "description": "Increases Locust's Health by 50% and duration by 40%.",
        "hero": "Abathur",
        "id": "AbathurCombatStyleSurvivalInstincts"
    },
    {
        "image": "tempest-fury.png",
        "level": "16",
        "name": "Tempest Fury",
        "icon": "storm_ui_icon_thrall_windfury.dds",
        "cooldown": 12,
        "description": "The final strike of Windfury hits 3 times for 75% normal damage.",
        "hero": "Thrall",
        "id": "ThrallMasteryTempestFury"
    },
    {
        "image": "bloodlust.png",
        "level": "10",
        "name": "Bloodlust",
        "icon": "storm_ui_icon_bloodlust.dds",
        "cooldown": 90,
        "description": "Grant nearby allied Heroes 40% Attack Speed and 30% Movement Speed. Lasts for 10 seconds.",
        "hero": "Rehgar",
        "id": "RehgarHeroicAbilityBloodlust"
    },
    {
        "image": "shadowstalk.png",
        "level": "10",
        "name": "Shadowstalk",
        "icon": "storm_temp_war3_btnshadowmeld.dds",
        "cooldown": 50,
        "description": "Stealth all allied Heroes and heal them for 91.1872 (+20.8 per level) over 8 seconds.  At the conclusion of Shadowstalk, they receive a burst of 60 (+14 per level) healing.",
        "hero": "Tyrande",
        "id": "TyrandeHeroicAbilityShadowstalk"
    },
    {
        "image": "evolution-complete.png",
        "level": "20",
        "name": "Evolution Complete",
        "icon": "storm_ui_icon_abathur_evolvemonstrosity.dds",
        "cooldown": 90,
        "description": "Monstrosity gains the ability to Deep Tunnel to any visible location once every 30 seconds.",
        "hero": "Abathur",
        "id": "AbathurMasteryEvolutionComplete"
    },
    {
        "image": "pierce.png",
        "level": "4",
        "name": "Pierce",
        "icon": "storm_temp_war3_btnscout.dds",
        "cooldown": 18,
        "description": "Sentinel no longer stops at the first Hero hit, affecting all enemy Heroes along the path.",
        "hero": "Tyrande",
        "id": "TyrandeMasterySentinelPierce"
    },
    {
        "image": "strafe.png",
        "level": "10",
        "name": "Strafe",
        "icon": "storm_ui_icon_valla_strafe.dds",
        "cooldown": 60,
        "description": "Rapidly attack nearby visible enemies for 15 (+6.75 per level) damage per hit, prioritizing heroes over minions. Valla is able to move and use Vault while strafing. Lasts for 4 seconds.",
        "hero": "Valla",
        "id": "DemonHunterHeroicAbilityStrafe"
    },
    {
        "image": "conviction.png",
        "level": "7",
        "name": "Conviction",
        "icon": "storm_ui_icon_johanna_condemn.dds",
        "cooldown": 10,
        "description": "Movement Speed is increased by 25% while Condemn is charging up.",
        "hero": "Johanna",
        "id": "CrusaderMasteryCondemnConviction"
    },
    {
        "image": "critterize.png",
        "level": "16",
        "name": "Critterize",
        "icon": "storm_temp_war3_btnpolymorph.dds",
        "cooldown": 15,
        "description": "Polymorph makes enemies Vulnerable, increasing the damage they take by 25%.",
        "hero": "Brightwing",
        "id": "FaerieDragonMasteryCritterize"
    },
    {
        "image": "chitinous-plating.png",
        "level": "13",
        "name": "Chitinous Plating",
        "icon": "storm_temp_war3_btnspikedbarricades.dds",
        "cooldown": 8,
        "description": "Increases Harden Carapace's Shield amount by 40%.",
        "hero": "Anub'arak",
        "id": "AnubarakCombatStyleChitinousPlating"
    },
    {
        "image": "perfect-shot.png",
        "level": "4",
        "name": "Perfect Shot",
        "icon": "storm_ui_icon_nova_snipe.dds",
        "cooldown": 10,
        "description": "Hitting an enemy Hero with Snipe refunds 50% of the Mana cost. Killing an enemy Hero with Snipe refunds 100% of the Mana cost.",
        "hero": "Nova",
        "id": "NovaMasteryPerfectShotSnipe"
    },
    {
        "image": "throwing-axes.png",
        "level": "7",
        "name": "Throwing Axes",
        "icon": "storm_btn_d3_barbarian_weaponthrow.dds",
        "description": "Increases your Basic Attack range by 25%.",
        "hero": "Rexxar",
        "id": "RexxarThrowingAxes"
    },
    {
        "image": "lingering-apparition.png",
        "level": "7",
        "name": "Lingering Apparition",
        "icon": "storm_ui_icon_leoric_WraithWalk.dds",
        "cooldown": 14,
        "description": "Increases the duration of Wraith Walk by 60%.",
        "hero": "Leoric",
        "id": "LeoricMasteryLingeringApparitionWraithWalk"
    },
    {
        "image": "shandos-clarity.png",
        "level": "1",
        "name": "Shan'do's Clarity",
        "icon": "storm_temp_btn-ability-protoss-hallucination-color.dds",
        "cooldown": 30,
        "description": "Reduces Innervate's cooldown by 10 seconds.",
        "hero": "Malfurion",
        "id": "MalfurionCombatStyleShandosClarity"
    },
    {
        "image": "aggressive-defense.png",
        "level": "16",
        "name": "Aggressive Defense",
        "icon": "storm_ui_icon_kerrigan_assimilation.dds",
        "description": "Increases base Shield amount gained from Assimilation by 100%.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryAggressiveDefense"
    },
    {
        "image": "ambush.png",
        "level": "1",
        "name": "Ambush",
        "icon": "storm_ui_icon_sgthammer_siegemode.dds",
        "cooldown": 2,
        "description": "Stealth when entering Siege Mode. Your next Basic Attack from Siege Mode will deal 100% more damage. Lose Stealth when Basic Attacking, using an Ability, taking damage, or returning to Tank Mode.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerAmbush"
    },
    {
        "image": "shish-kabob.png",
        "level": "16",
        "name": "Shish Kabob",
        "icon": "storm_ui_icon_stitches_hook.dds",
        "cooldown": 16,
        "description": "Hook can pull up to 2 targets.",
        "hero": "Stitches",
        "id": "StitchesMasteryShishKabobHook"
    },
    {
        "image": "life-drain.png",
        "level": "7",
        "name": "Life Drain",
        "icon": "storm_ui_icon_sylvanas_shadowdagger.dds",
        "cooldown": 10,
        "description": "Shadow Dagger heals you for 10 (+3.5 per level) each time it spreads to a new enemy.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentLifeDrain"
    },
    {
        "image": "fists-of-fury.png",
        "level": "13",
        "name": "Fists of Fury",
        "icon": "storm_ui_icon_monk_deadlyreach.dds",
        "cooldown": 10,
        "description": "Increases Deadly Reach's duration by 50%.",
        "hero": "Kharazim",
        "id": "MonkFistsofFuryDeadlyReach"
    },
    {
        "image": "earth-shield.png",
        "level": "7",
        "name": "Earth Shield",
        "icon": "storm_temp_war3_btnlightningshield.dds",
        "cooldown": 8,
        "description": "Lightning Shield also gives the ally a Shield that absorbs 75 (+18 per level) damage over 3 seconds.",
        "hero": "Rehgar",
        "id": "RehgarMasteryEarthShield"
    },
    {
        "image": "earthgrasp-totem.png",
        "level": "16",
        "name": "Earthgrasp Totem",
        "icon": "storm_ui_icon_earthbindtotem.dds",
        "cooldown": 15,
        "description": "When Earthbind Totem is first cast, it slows nearby enemies by 90% for 1 second.",
        "hero": "Rehgar",
        "id": "RehgarMasteryEarthGraspTotem"
    },
    {
        "image": "barricade.png",
        "level": "13",
        "name": "Barricade",
        "icon": "storm_ui_icon_sgthammer_concussiveblast.dds",
        "cooldown": 12,
        "description": "Create a wall of path blocking debris for 4 seconds.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerMasteryFlakCannons"
    },
    {
        "image": "volatile-mutation.png",
        "level": "16",
        "name": "Volatile Mutation",
        "icon": "storm_temp_btn-ability-zerg-banelingspooge.dds",
        "cooldown": 90,
        "description": "Ultimate Evolution clones and Monstrosities deal 50 (+10 per level) damage to nearby enemies every 3 seconds and when they die.",
        "hero": "Abathur",
        "id": "AbathurVolatileMutation"
    },
    {
        "image": "third-wind.png",
        "level": "4",
        "name": "Third Wind",
        "icon": "storm_btn_d3_barbarian_ignorepain.dds",
        "description": "Increases Health Restoration rate to 16 (+4.8 per level) per second, and raises Health threshold to 50% Health for improved 32 (+9.6 per level) per second Restoration.",
        "hero": "Muradin",
        "id": "MuradinCombatStyleThirdWind"
    },
    {
        "image": "reconstitution.png",
        "level": "1",
        "name": "Reconstitution",
        "icon": "storm_ui_icon_zagara_creep.dds",
        "cooldown": 15,
        "description": "Health Restoration bonus on Creep increased by 200%.",
        "hero": "Zagara",
        "id": "ZagaraMasteryReconstitution"
    },
    {
        "image": "hellforged-armor.png",
        "level": "13",
        "name": "Hellforged Armor",
        "icon": "storm_temp_war3_btnunholyaura.dds",
        "cooldown": 10,
        "description": "Demon Warriors deal 10 (+1 per level) damage to nearby enemies every second and take 50% less damage from non-Heroic sources.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryHellforgedArmor"
    },
    {
        "image": "prog-rock.png",
        "level": "1",
        "name": "Prog Rock",
        "icon": "storm_ui_icon_hatestrike.dds",
        "cooldown": 8,
        "description": "Each Regeneration Globe you pick up permanently increases the healing per second of Guitar Solo by 3.",
        "hero": "E.T.C.",
        "id": "ETCMasteryProgRock"
    },
    {
        "image": "and-a-shark-too.png",
        "level": "20",
        "name": "... And A Shark Too!",
        "icon": "storm_ui_icon_netlauncher.dds",
        "cooldown": 50,
        "description": "Increases the damage of Octo-Grab by 10000% (+1000% per level).",
        "hero": "Murky",
        "id": "MurkyMasteryAndASharkToo"
    },
    {
        "image": "ultimate-evolution.png",
        "level": "10",
        "name": "Ultimate Evolution",
        "icon": "storm_ui_icon_abathur_ultimateevolution.dds",
        "cooldown": 50,
        "description": "Clone target allied Hero and control it for 20 seconds. Abathur has perfected the clone, granting it 20% Ability Power, 20% bonus Attack Damage, and 10% bonus Movement Speed. Cannot use their Heroic Ability.",
        "hero": "Abathur",
        "id": "AbathurHeroicAbilityUltimateEvolution"
    },
    {
        "image": "corruption.png",
        "level": "1",
        "name": "Corruption",
        "icon": "storm_ui_icon_sylvanas_blackarrows.dds",
        "description": "Basic Attacks against Structures destroy 2 Ammunition.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentCorruption"
    },
    {
        "image": "sharpened-blades.png",
        "level": "1",
        "name": "Sharpened Blades",
        "icon": "storm_ui_icon_kerrigan_impalingblades.dds",
        "cooldown": 12,
        "description": "Impaling Blades deals 20% more damage.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryImpalingBladesSharpenedBlades"
    },
    {
        "image": "adrenaline-boost.png",
        "level": "16",
        "name": "Adrenaline Boost",
        "icon": "storm_ui_icon_abathur_carapace.dds",
        "cooldown": 12,
        "description": "Symbiote's Carapace increases the Movement Speed of the target by 40% for 3 seconds.",
        "hero": "Abathur",
        "id": "AbathurMasteryAdrenalineBoost"
    },
    {
        "image": "rapid-chase.png",
        "level": "7",
        "name": "Rapid Chase",
        "icon": "storm_btn_d3_barbarian_furiouscharge.dds",
        "cooldown": 6,
        "description": "Gain 20% Movement Speed for 2.1875 seconds after using Dive.",
        "hero": "Illidan",
        "id": "IllidanMasteryRapidChaseDive"
    },
    {
        "image": "timeless-creature.png",
        "level": "1",
        "name": "Timeless Creature",
        "icon": "storm_temp_war3_btnwindserpent.dds",
        "cooldown": 10,
        "description": "Increases the duration of Cloud Serpent by 50%.",
        "hero": "Li Li",
        "id": "LiLiMasteryCloudSerpentTimelessCreature"
    },
    {
        "image": "cocoon.png",
        "level": "10",
        "name": "Cocoon",
        "icon": "storm_temp_war3_btnweb.dds",
        "cooldown": 60,
        "description": "Wraps target enemy Hero in a cocoon, rendering them unable to act or be targeted for 8 seconds. Allies of the Hero can attack the cocoon to break it and free them early.",
        "hero": "Anub'arak",
        "id": "AnubarakHeroicAbilityCocoon"
    },
    {
        "image": "force-wall.png",
        "level": "10",
        "name": "Force Wall",
        "icon": "storm_ui_icon_tassadar_forcewall.dds",
        "cooldown": 12,
        "description": "Create a wall that blocks all units from moving through it for 2.5 seconds.",
        "hero": "Tassadar",
        "id": "TassadarHeroicAbilityForceWall"
    },
    {
        "image": "dusk-wings.png",
        "level": "20",
        "name": "Dusk Wings",
        "icon": "storm_ui_icon_raynor_raynorsraiders.dds",
        "cooldown": 80,
        "description": "Banshees remain Stealthed while attacking and fire 50% more frequently.",
        "hero": "Raynor",
        "id": "RaynorMasteryHelsAngelsRaynorsBanshees"
    },
    {
        "image": "hardened-bones.png",
        "level": "4",
        "name": "Hardened Bones",
        "icon": "storm_ui_icon_leoric_WraithWalk.dds",
        "cooldown": 14,
        "description": "During Wraith Walk, you take 25% less damage.",
        "hero": "Leoric",
        "id": "LeoricMasteryHardenedBonesWraithWalk"
    },
    {
        "image": "mana-tap.png",
        "level": "4",
        "name": "Mana Tap",
        "icon": "storm_ui_icon_kaelthas_flamestrike.dds",
        "cooldown": 7,
        "description": "Flamestrike restores 5.07% of your maximum Mana per enemy killed.",
        "hero": "Kael'thas",
        "id": "KaelthasFlamestrikeManaTap"
    },
    {
        "image": "tidal-waves.png",
        "level": "16",
        "name": "Tidal Waves",
        "icon": "storm_ui_icon_chainhealing.dds",
        "cooldown": 9,
        "description": "Reduces Chain Heal's cooldown by 3 seconds if it heals 3 Heroes.",
        "hero": "Rehgar",
        "id": "RehgarMasteryTidalWaves"
    },
    {
        "image": "judgment.png",
        "level": "10",
        "name": "Judgment",
        "icon": "storm_ui_icon_tyrael_judgement.dds",
        "cooldown": 80,
        "description": "After 0.75 seconds, charge an enemy Hero dealing 60 (+8 per level) damage and stunning them for 1.5 seconds. Nearby enemies are knocked away and take 30 (+4 per level) damage.",
        "hero": "Tyrael",
        "id": "TyraelHeroicAbilityJudgement"
    },
    {
        "image": "helping-hand.png",
        "level": "13",
        "name": "Helping Hand",
        "icon": "storm_ui_icon_stitches_hook.dds",
        "cooldown": 16,
        "description": "Hook can also pull allied Heroes (but will not damage them). When used to pull allies, the cooldown is reduced by 50%.",
        "hero": "Stitches",
        "id": "StitchesMasteryHelpingHandHook"
    },
    {
        "image": "hyper-cooling-engines.png",
        "level": "7",
        "name": "Hyper-Cooling Engines",
        "icon": "storm_ui_icon_epicmount.dds",
        "cooldown": 30,
        "description": "Reduce the cooldown of Thrusters by 10 seconds. Thrusters are always active while at the Altar.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerHyperCoolingEngines"
    },
    {
        "image": "advanced-artillery.png",
        "level": "1",
        "name": "Advanced Artillery",
        "icon": "storm_ui_icon_sgthammer_artillery.dds",
        "description": "Increase the damage bonus to long distance enemies by 10%.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerMasteryAdvancedArtillery"
    },
    {
        "image": "locust-brood.png",
        "level": "16",
        "name": "Locust Brood",
        "icon": "storm_ui_icon_abathur_spawnlocust.dds",
        "cooldown": 45,
        "description": "Activate to spawn 3 Locusts at a nearby location.",
        "hero": "Abathur",
        "id": "AbathurCombatStyleLocustSwarm"
    },
    {
        "image": "farseers-blessing.png",
        "level": "20",
        "name": "Farseer's Blessing",
        "icon": "storm_temp_war3_btnresistmagic.dds",
        "cooldown": 70,
        "description": "Increases healing amount by 50%. Allies near the target are healed for 25% of the amount of health regained.",
        "hero": "Rehgar",
        "id": "RehgarMasteryFarseersBlessing"
    },
    {
        "image": "eviscerate.png",
        "level": "13",
        "name": "Eviscerate",
        "icon": "storm_ui_icon_kerrigan_ravage.dds",
        "cooldown": 8,
        "description": "Increases Ravage's range by 40%.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryEviscerate"
    },
    {
        "image": "rewind.png",
        "level": "20",
        "name": "Rewind",
        "icon": "storm_btn_d3_wizard_slowtime.dds",
        "cooldown": 60,
        "description": "Activate to reset the cooldowns of your Basic Abilities.",
        "hero": "Zeratul",
        "id": "GenericTalentRewind"
    },
    {
        "image": "railgun.png",
        "level": "16",
        "name": "Railgun",
        "icon": "storm_ui_icon_nova_snipe.dds",
        "cooldown": 10,
        "description": "Snipe penetrates through the first enemy hit and deals 50% damage to subsequent targets. Snipe cooldown is reduced by 1 second for each target hit.",
        "hero": "Nova",
        "id": "NovaRailgun"
    },
    {
        "image": "wandering-keg.png",
        "level": "10",
        "name": "Wandering Keg",
        "icon": "storm_temp_war3_btnbarrel.dds",
        "cooldown": 70,
        "description": "Roll around inside an Unstoppable barrel, dealing 30 (+5 per level) damage to enemies in the way and knocking them back. Lasts for 5 seconds.",
        "hero": "Chen",
        "id": "ChenHeroicAbilityWanderingKeg"
    },
    {
        "image": "gargantuan.png",
        "level": "10",
        "name": "Gargantuan",
        "icon": "storm_btn_d3_witchdoctor_gargantuan.dds",
        "cooldown": 60,
        "description": "Summon a Gargantuan that guards you for 20 seconds. Deals 30 (+15 per level) damage to nearby enemies when summoned, attacks for 100 (+20 per level) damage, and can be ordered to stomp, dealing 30 (+15 per level) damage. The Gargantuan deals extra damage to Minions and Structures.",
        "hero": "Nazeebo",
        "id": "WitchDoctorHeroicAbilityGargantuan"
    },
    {
        "image": "sins-grasp.png",
        "level": "4",
        "name": "Sin's Grasp",
        "icon": "storm_temp_war3_btndeathpact.dds",
        "cooldown": 100,
        "description": "Activate to curse an enemy Hero, dealing 114.52 (+19.04 per level) damage over 6 seconds. Minion kills reduce this cooldown by 5 seconds. Can be cast while channeling All Shall Burn.",
        "hero": "Azmodan",
        "id": "AzmodanSinsGrasp"
    },
    {
        "image": "amateur-opponent.png",
        "level": "1",
        "name": "Amateur Opponent",
        "icon": "storm_ui_icon_artanis_doubleslash_off.dds",
        "cooldown": 4,
        "description": "Twin Blades attacks deal 100% bonus damage versus non-Heroic enemies.",
        "hero": "Artanis",
        "id": "ArtanisTwinBladesAmateurOpponent"
    },
    {
        "image": "follow-through.png",
        "level": "7",
        "name": "Follow Through",
        "icon": "storm_btn-extra_int_0.dds",
        "description": "After using an ability, your next Basic Attack within 6 seconds deals 40% additional damage.",
        "hero": "Zeratul",
        "id": "GenericTalentFollowThrough"
    },
    {
        "image": "emerald-wind.png",
        "level": "10",
        "name": "Emerald Wind",
        "icon": "storm_temp_war3_btncyclone.dds",
        "cooldown": 60,
        "description": "Create an expanding nova of wind, dealing 100 (+30 per level) damage and pushing enemies away.",
        "hero": "Brightwing",
        "id": "FaerieDragonHeroicAbilityEmeraldWind"
    },
    {
        "image": "protection-in-death.png",
        "level": "1",
        "name": "Protection in Death",
        "icon": "storm_ui_icon_tyrael_archangelswrath.dds",
        "description": "When Archangel's Wrath explodes, shield nearby allies for 50% of their max Health for 5 seconds.",
        "hero": "Tyrael",
        "id": "TyraelMasteryPassiveProtectioninDeath"
    },
    {
        "image": "commandeer-odin.png",
        "level": "10",
        "name": "Commandeer Odin",
        "icon": "storm_ui_icon_tychus_commandeerodin.dds",
        "description": "Call down an Odin to pilot. The Odin deals increased Damage, has 60% increased Basic Attack range, and uses different Abilities. Lasts 23 seconds.",
        "hero": "Tychus",
        "id": "TychusHeroicAbilityCommandeerOdin"
    },
    {
        "image": "steel-resolve.png",
        "level": "13",
        "name": "Steel Resolve",
        "icon": "storm_ui_icon_raynor_inspire.dds",
        "cooldown": 10,
        "description": "Increases Inspire's duration by 50% and causes Adrenaline Rush to also apply Inspire.",
        "hero": "Raynor",
        "id": "RaynorInspireSteelResolve"
    },
    {
        "image": "celestial-attunement.png",
        "level": "1",
        "name": "Celestial Attunement",
        "icon": "storm_temp_war3_btnheal.dds",
        "cooldown": 8,
        "description": "Reduce the Mana cost of Light of Elune by 15.",
        "hero": "Tyrande",
        "id": "TyrandeMasteryLightofEluneCelestialAttunement"
    },
    {
        "image": "advanced-cloaking.png",
        "level": "13",
        "name": "Advanced Cloaking",
        "icon": "storm_ui_icon_nova_personalcloaking.dds",
        "description": "While Stealthed from Permanent Cloak, your Movement Speed is increased by 25% and you heal for 1.95% of your maximum Health per second.",
        "hero": "Nova",
        "id": "NovaCombatStyleAdvancedCloaking"
    },
    {
        "image": "compressed-air.png",
        "level": "7",
        "name": "Compressed Air",
        "icon": "storm_temp_war3_btnmurloc.dds",
        "cooldown": 15,
        "description": "Area of effect of Pufferfish increased by 50%.",
        "hero": "Murky",
        "id": "MurkyMasteryCompressedAir"
    },
    {
        "image": "giant-killer.png",
        "level": "13",
        "name": "Giant Killer",
        "icon": "storm_temp_war3_btnseagiant.dds",
        "description": "Basic Attacks against enemy Heroes deal bonus damage equal to 1.5% of the Hero's maximum Health.",
        "hero": "Zeratul",
        "id": "GenericTalentGiantKiller"
    },
    {
        "image": "entomb.png",
        "level": "10",
        "name": "Entomb",
        "icon": "storm_ui_icon_leoric_Entomb.dds",
        "cooldown": 50,
        "description": "Create an unpathable tomb in front of you for 4 seconds.",
        "hero": "Leoric",
        "id": "LeoricHeroicAbilityEntomb"
    },
    {
        "image": "bubble-machine.png",
        "level": "13",
        "name": "Bubble Machine",
        "icon": "storm_temp_btn-ability-protoss-shieldbattery-color.dds",
        "cooldown": 14,
        "description": "Safety Bubble cooldown reduced by 5 seconds.",
        "hero": "Murky",
        "id": "MurkyMasteryBubbleMachine"
    },
    {
        "image": "ez-pz-dimensional-ripper.png",
        "level": "13",
        "name": "EZ-PZ Dimensional Ripper",
        "icon": "storm_ui_icon_dethlazor.dds",
        "cooldown": 12,
        "description": "Deth Lazor slows Heroes by 40% and freezes minions or structures for 3 seconds.",
        "hero": "Gazlowe",
        "id": "TinkerMasteryEZPZDimensionalRipper"
    },
    {
        "image": "elunes-grace.png",
        "level": "4",
        "name": "Elune's Grace",
        "icon": "storm_temp_war3_btnstaffofteleportation.dds",
        "description": "Increases the range of Regrowth, Moonfire, and Entangling Roots by 30%.",
        "hero": "Malfurion",
        "id": "MalfurionCombatStyleElunesGrace"
    },
    {
        "image": "summon-ultralisk.png",
        "level": "10",
        "name": "Summon Ultralisk",
        "icon": "storm_ui_icon_kerrigan_ultralisk.dds",
        "cooldown": 80,
        "description": "Summon an Ultralisk that attacks the target to deal 40 (+8 per level) damage. Attacks splash to nearby enemies for 50% damage. Can reactivate the Ability to retarget the Ultralisk. Lasts for 20 seconds.",
        "hero": "Kerrigan",
        "id": "KerriganHeroicAbilitySummonUltralisk"
    },
    {
        "image": "imposing-presence.png",
        "level": "16",
        "name": "Imposing Presence",
        "icon": "storm_btn_d3_barbarian_calloftheancients.dds",
        "description": "Enemies that attack you have their Attack Speed slowed by 40%.",
        "hero": "Uther",
        "id": "GenericTalentImposingPresence"
    },
    {
        "image": "the-good-stuff.png",
        "level": "7",
        "name": "The Good Stuff",
        "icon": "storm_temp_war3_btnsnazzypotion.dds",
        "cooldown": 3,
        "description": "Healing Brew heals for an additional 21 (+5.4 per level) Health over 6 seconds.",
        "hero": "Li Li",
        "id": "LiLiMasteryHealingBrewTheGoodStuff"
    },
    {
        "image": "war-paint.png",
        "level": "1",
        "name": "War Paint",
        "icon": "storm_btn_d3_barbarian_frenzy.dds",
        "description": "Basic Attacks heal you for 30% of the damage dealt.",
        "hero": "Sonya",
        "id": "BarbarianMasteryWarPaint"
    },
    {
        "image": "feral-lunge.png",
        "level": "13",
        "name": "Feral Lunge",
        "icon": "storm_temp_war3_btnspiritwolf.dds",
        "cooldown": 1,
        "description": "While in Ghost Wolf, you lunge a short distance towards your attack target. The damage bonus for Basic Attacks in Ghost Wolf is increased from 100% to 200%.",
        "hero": "Rehgar",
        "id": "RehgarMasteryFeralLunge"
    },
    {
        "image": "chew-your-food.png",
        "level": "1",
        "name": "Chew Your Food",
        "icon": "storm_ui_icon_stitches_devour.dds",
        "cooldown": 20,
        "description": "Using Devour also heals you for 9.555% of your max Health over 3.0625 seconds.",
        "hero": "Stitches",
        "id": "StitchesMasteryChewYourFood"
    },
    {
        "image": "aftershock.png",
        "level": "13",
        "name": "Aftershock",
        "icon": "storm_ui_icon_sonya_seismicslam.dds",
        "cooldown": 1,
        "description": "Using Seismic Slam reduces its Fury cost by 50% for 2 seconds.",
        "hero": "Sonya",
        "id": "BarbarianMasteryAftershock"
    },
    {
        "image": "archon.png",
        "level": "10",
        "name": "Archon",
        "icon": "storm_ui_icon_tassadar_archon.dds",
        "cooldown": 100,
        "description": "Transform into an Archon, gaining a 200 (+40 per level) point Shield, causing Basic Attacks to deal 51.2 (+9.6 per level) damage and splash for 25.6 (+4.8 per level) additional damage. Lasts for 12 seconds.",
        "hero": "Tassadar",
        "id": "TassadarHeroicAbilityArchon"
    },
    {
        "image": "spin-to-win.png",
        "level": "7",
        "name": "Spin To Win!",
        "icon": "storm_ui_icon_lostvikings_spintowin.dds",
        "description": "Activate to have each Viking deal 42 (+9 per level) damage to nearby enemies.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasterySpinToWin"
    },
    {
        "image": "frozen-wastes.png",
        "level": "4",
        "name": "Frozen Wastes",
        "icon": "storm_temp_war3_btnorboffrost.dds",
        "cooldown": 1,
        "description": "Frozen Tempest Mana cost reduced by 3 per second.",
        "hero": "Arthas",
        "id": "ArthasMasteryFrozenWastesFrozenTempest"
    },
    {
        "image": "swift-reflexes.png",
        "level": "4",
        "name": "Swift Reflexes",
        "icon": "storm_temp_war3_btndefend.dds",
        "description": "Every 4 seconds Chen can dodge an enemy Hero's Basic Attack, preventing all of its damage.",
        "hero": "Chen",
        "id": "ChenTalentSwiftReflexes"
    },
    {
        "image": "shadow-shield.png",
        "level": "1",
        "name": "Shadow Shield",
        "icon": "storm_temp_war3_btnevasion.dds",
        "cooldown": 15,
        "description": "Evasion grants a 62.5 (+12.5 per level) point Shield for 5 seconds.",
        "hero": "Illidan",
        "id": "IllidanMasteryShadowShieldEvasion"
    },
    {
        "image": "lamb-to-the-slaughter.png",
        "level": "10",
        "name": "Lamb to the Slaughter",
        "icon": "storm_ui_icon_Butcher_LambToTheSlaughter.dds",
        "cooldown": 60,
        "description": "Throw a hitching post that attaches to the nearest enemy Hero after a 1 second delay.  This deals 75 (+15 per level) damage and causes the enemy to be chained to the post for 4 seconds.",
        "hero": "Butcher",
        "id": "ButcherHeroicAbilityLambToTheSlaughter"
    },
    {
        "image": "storm-of-vengeance.png",
        "level": "20",
        "name": "Storm of Vengeance",
        "icon": "storm_ui_icon_valla_rainofvengeance.dds",
        "cooldown": 90,
        "description": "Increases the number of Shadow Beast waves to 4.",
        "hero": "Valla",
        "id": "DemonHunterMasteryStormofVengeance"
    },
    {
        "image": "sledgehammer.png",
        "level": "4",
        "name": "Sledgehammer",
        "icon": "storm_ui_icon_stormbolt.dds",
        "cooldown": 10,
        "description": "Deals 400% damage to Minions, Structures and Mercenaries. Destroys 4 ammo from Structures.",
        "hero": "Muradin",
        "id": "MuradinMasteryStormhammerSledgehammer"
    },
    {
        "image": "maelstrom.png",
        "level": "10",
        "name": "Maelstrom",
        "icon": "storm_ui_icon_kerrigan_maelstrom.dds",
        "cooldown": 100,
        "description": "Deals 60 (+6 per level) damage per second to nearby enemies. Lasts for 7 seconds.",
        "hero": "Kerrigan",
        "id": "KerriganHeroicAbilityMaelstrom"
    },
    {
        "image": "hamstring-shot.png",
        "level": "7",
        "name": "Hamstring Shot",
        "icon": "storm_ui_icon_raynor_penetratinground.dds",
        "cooldown": 12,
        "description": "Enemies hit by Penetrating Round have a 20% Movement Speed slow for 3 seconds.",
        "hero": "Raynor",
        "id": "RaynorPenetratingRoundHamstringShot"
    },
    {
        "image": "drain-momentum.png",
        "level": "13",
        "name": "Drain Momentum",
        "icon": "storm_ui_icon_leoric_DrainHope.dds",
        "cooldown": 12,
        "description": "Drain Hope no longer causes you to lose Movement Speed.",
        "hero": "Leoric",
        "id": "LeoricMasteryDrainMomentumDrainHope"
    },
    {
        "image": "dream-shot.png",
        "level": "7",
        "name": "Dream Shot",
        "icon": "storm_temp_war3_btnmanaflare.dds",
        "cooldown": 8,
        "description": "Reduces the cooldown of Arcane Flare by 1 second for each enemy Hero hit by the outer radius, and 3 seconds for each hit by the inner radius.",
        "hero": "Brightwing",
        "id": "BrightwingDreamShotArcaneFlare"
    },
    {
        "image": "double-strike.png",
        "level": "13",
        "name": "Double Strike",
        "icon": "storm_temp_btn-upgrade-zerg-metabolicboost.dds",
        "description": "When your Basic Abilities damage an enemy, your next Basic Attack hits for 75% bonus damage.",
        "hero": "Kerrigan",
        "id": "KerriganCombatStyleDoubleStrike"
    },
    {
        "image": "covert-ops.png",
        "level": "7",
        "name": "Covert Ops",
        "icon": "storm_ui_icon_Nova_PinningShot.dds",
        "cooldown": 12,
        "description": "Increases the Movement Speed slow of Pinning Shot by 1% for every second that Nova is Cloaked, to a maximum of a 50% slow. Bonus fades when Nova is un-Cloaked for one second.",
        "hero": "Nova",
        "id": "NovaMasteryCovertOpsPinningShot"
    },
    {
        "image": "final-assault.png",
        "level": "7",
        "name": "Final Assault",
        "icon": "storm_ui_icon_Butcher_FullBoar.dds",
        "cooldown": 20,
        "description": "Increases Ruthless Onslaught's range by 33.3333%, and causes you to lunge at the enemy when close to impact.",
        "hero": "Butcher",
        "id": "ButcherMasteryRuthlessOnslaughtFinalAssault"
    },
    {
        "image": "explosive-round.png",
        "level": "7",
        "name": "Explosive Round",
        "icon": "storm_ui_icon_nova_snipe.dds",
        "cooldown": 10,
        "description": "Snipe also deals 50% damage to enemies near the impact.",
        "hero": "Nova",
        "id": "NovaMasteryExplosiveShot"
    },
    {
        "image": "force-barrier.png",
        "level": "20",
        "name": "Force Barrier",
        "icon": "storm_ui_icon_tassadar_forcewall.dds",
        "cooldown": 12,
        "description": "Force Wall range increased by 50% and duration by 1 second.",
        "hero": "Tassadar",
        "id": "TassadarMasteryForceBarrier"
    },
    {
        "image": "void-prison.png",
        "level": "10",
        "name": "Void Prison",
        "icon": "storm_ui_icon_zeratul_voidprison.dds",
        "cooldown": 100,
        "description": "Slows time in an area to a near standstill, making allies and enemies invulnerable and unable to act for 5 seconds. You are not affected.",
        "hero": "Zeratul",
        "id": "ZeratulHeroicAbilityVoidPrison"
    },
    {
        "image": "perishing-flame.png",
        "level": "20",
        "name": "Perishing Flame",
        "icon": "storm_btn_d3ros_crusader_trebuchet.dds",
        "cooldown": 100,
        "description": "When the Grunts die they explode, dealing 50 (+5 per level) damage to nearby enemies.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryPerishingFlame"
    },
    {
        "image": "lethal-decoy.png",
        "level": "13",
        "name": "Lethal Decoy",
        "icon": "storm_ui_icon_nova_holodecoy.dds",
        "cooldown": 15,
        "description": "Holo Decoy deals 25% of Nova's damage.",
        "hero": "Nova",
        "id": "NovaMasteryHoloDrone"
    },
    {
        "image": "suppression-pulse.png",
        "level": "10",
        "name": "Suppression Pulse",
        "icon": "storm_ui_icon_artanis_disruptionweb.dds",
        "cooldown": 50,
        "description": "Fire a large area pulse from the Spear of Adun, dealing 50 (+10 per level) damage and Blinding enemies for 4 seconds. Unlimited range.",
        "hero": "Artanis",
        "id": "ArtanisHeroicAbilitySpearofAdunSuppressionPulse"
    },
    {
        "image": "nordic-attack-squad.png",
        "level": "13",
        "name": "Nordic Attack Squad",
        "icon": "storm_temp_war3_btnseagiant.dds",
        "description": "Activate to have all Viking Basic Attacks deal bonus damage equal to 1% of a Hero's maximum Health for 5 seconds.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryNordicAttackSquad"
    },
    {
        "image": "mosh-pit.png",
        "level": "10",
        "name": "Mosh Pit",
        "icon": "storm_temp_war3_btnbattleroar.dds",
        "cooldown": 120,
        "description": "After 0.75 seconds, channel to stun nearby enemies for 4 seconds.",
        "hero": "E.T.C.",
        "id": "ETCHeroicAbilityMoshPit"
    },
    {
        "image": "bear-necessities.png",
        "level": "13",
        "name": "Bear Necessities",
        "icon": "storm_ui_icon_rexxar_mishacharge.dds",
        "cooldown": 12,
        "description": "If Misha, Charge! doesn't hit an enemy Hero, it can be cast again for free for the next 3 seconds.",
        "hero": "Rexxar",
        "id": "RexxarBearNecessitiesCharge"
    },
    {
        "image": "blood-frenzy.png",
        "level": "16",
        "name": "Blood Frenzy",
        "icon": "storm_ui_icon_Butcher_FreshMeat.dds",
        "description": "Fresh Meat also increases your Attack Speed by 1% per stack.",
        "hero": "Butcher",
        "id": "ButcherMasteryFreshMeatBloodFrenzy"
    },
    {
        "image": "executioner.png",
        "level": "16",
        "name": "Executioner",
        "icon": "storm_temp_war3_btncleavingattack.dds",
        "description": "Basic Attacks deal 40% more damage against slowed, rooted, or stunned targets.",
        "hero": "Valla",
        "id": "GenericTalentExecutioner"
    },
    {
        "image": "angelic-absorption.png",
        "level": "13",
        "name": "Angelic Absorption",
        "icon": "storm_ui_icon_tyrael_righteousness.dds",
        "cooldown": 12,
        "description": "Enemies that attack you while shielded grant 60 (+12 per level) Health over 3 seconds.",
        "hero": "Tyrael",
        "id": "TyraelMasteryAngelicAbsorption"
    },
    {
        "image": "evasive-shielding.png",
        "level": "16",
        "name": "Evasive Shielding",
        "icon": "storm_ui_icon_tassadar_plasmashield.dds",
        "cooldown": 5,
        "description": "The target of your Plasma Shield also gains 25% Movement Speed for 5 seconds.",
        "hero": "Tassadar",
        "id": "TassadarMasteryEvasiveShielding"
    },
    {
        "image": "infused-grenade.png",
        "level": "4",
        "name": "Infused Grenade",
        "icon": "storm_ui_icon_medic_displacementgrenade_b.dds",
        "cooldown": 12,
        "description": "Displacement Grenade's Mana cost is refunded if you hit an enemy Hero.",
        "hero": "Lt. Morales",
        "id": "MedicInfusedGrenade"
    },
    {
        "image": "hunter-gatherer.png",
        "level": "1",
        "name": "Hunter-Gatherer",
        "icon": "storm_btn_d3_monk_mantraofhealing.dds",
        "description": "Collecting Regeneration Globes permanently increases the Health Regeneration of you and Misha by 1 per second.",
        "hero": "Rexxar",
        "id": "RexxarHunterGatherer"
    },
    {
        "image": "mending-serpent.png",
        "level": "4",
        "name": "Mending Serpent",
        "icon": "storm_temp_war3_btnwindserpent.dds",
        "cooldown": 10,
        "description": "Cloud Serpent heals the friendly unit for 15 (+1.65 per level) Health each time it attacks.",
        "hero": "Li Li",
        "id": "LiLiMasteryCloudSerpentMendingSerpent"
    },
    {
        "image": "hungry-hungry-stitches.png",
        "level": "20",
        "name": "Hungry Hungry Stitches",
        "icon": "storm_ui_icon_stitches_cannibalize.dds",
        "cooldown": 80,
        "description": "While active, Gorge can be repeatedly recast until the first target is expelled. Increases Gorge damage by 40%.",
        "hero": "Stitches",
        "id": "StitchesMasteryHungryHungryStitchesGorge"
    },
    {
        "image": "sunfire-enchantment.png",
        "level": "7",
        "name": "Sunfire Enchantment",
        "icon": "storm_ui_icon_kaelthas_verdantspheres.dds",
        "cooldown": 6,
        "description": "Activating Verdant Spheres causes your next Basic Attack to instead shoot a spell dealing 85 (+18 per level) damage.",
        "hero": "Kael'thas",
        "id": "KaelthasMasterySunfireEnchantment"
    },
    {
        "image": "essence-of-the-slain.png",
        "level": "4",
        "name": "Essence of the Slain",
        "icon": "storm_temp_war3_btnsoulgem.dds",
        "description": "When enemy Minions, captured Mercenaries, and Heroes die near you, gain 10 Health and 10 Mana.",
        "hero": "Diablo",
        "id": "DiabloTalentEssenceOfTheSlain"
    },
    {
        "image": "insatiable-blade.png",
        "level": "7",
        "name": "Insatiable Blade",
        "icon": "storm_ui_icon_Butcher_Tenderize.dds",
        "cooldown": 14,
        "description": "Increases Butcher's Brand's healing from 75% to 100% of your Basic Attack damage.",
        "hero": "Butcher",
        "id": "ButcherMasteryButchersBrandInsatiableBlade"
    },
    {
        "image": "triple-strike.png",
        "level": "13",
        "name": "Triple Strike",
        "icon": "storm_ui_icon_artanis_doubleslash_off.dds",
        "cooldown": 4,
        "description": "Increases Twin Blades's number of Basic Attacks to 3.",
        "hero": "Artanis",
        "id": "ArtanisTwinBladesTripleStrike"
    },
    {
        "image": "victuals.png",
        "level": "1",
        "name": "Victuals",
        "icon": "storm_ui_icon_Butcher_FreshMeat.dds",
        "description": "Heal for 3% of your Maximum Health when you collect Fresh Meat. Meat continues to drop at maximum stacks.",
        "hero": "Butcher",
        "id": "ButcherMasteryFreshMeatVictuals"
    },
    {
        "image": "benediction.png",
        "level": "16",
        "name": "Benediction",
        "icon": "storm_btn_d3_monk_blindingflash.dds",
        "description": "Activate to reduce the Mana cost of your next Basic Ability by 50 and its cooldown by 10 seconds.",
        "hero": "Uther",
        "id": "UtherMasteryBenediction"
    },
    {
        "image": "groupies.png",
        "level": "13",
        "name": "Groupies",
        "icon": "storm_ui_icon_hatestrike.dds",
        "cooldown": 8,
        "description": "Guitar Solo also heals nearby allied Heroes for 27 (+6.5 per level) Health every second while it is active.",
        "hero": "E.T.C.",
        "id": "L90ETCMasteryGuitarSoloGroupies"
    },
    {
        "image": "manic-pixie.png",
        "level": "4",
        "name": "Manic Pixie",
        "icon": "storm_temp_war3_btnscatterrockets.dds",
        "cooldown": 10,
        "description": "When Soothing Mist heals an ally with Pixie Dust on them, they heal for an additional 30 (+10 per level) over 4 seconds.",
        "hero": "Brightwing",
        "id": "BrightwingManicPixiePixieDust"
    },
    {
        "image": "crippling-slam.png",
        "level": "16",
        "name": "Crippling Slam",
        "icon": "storm_ui_icon_Butcher_Hamstring.dds",
        "cooldown": 4,
        "description": "Hamstring's slow no longer fades out, and the duration is increased by 25%.",
        "hero": "Butcher",
        "id": "ButcherMasteryHamstringCripplingSlam"
    },
    {
        "image": "napalm-strike.png",
        "level": "10",
        "name": "Napalm Strike",
        "icon": "storm_ui_icon_sgthammer_napalmstrike.dds",
        "cooldown": 6,
        "description": "Deals 40 (+16 per level) damage on impact, and leaves a napalm area that deals 30 (+4 per level) damage per second. Lasts for 4 seconds.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerHeroicAbilityNapalmStrike"
    },
    {
        "image": "distortion-beam.png",
        "level": "13",
        "name": "Distortion Beam",
        "icon": "storm_btn_d3_wizard_electrocute.dds",
        "description": "Basic Attacks slow enemies by 20% for 1.5 seconds.",
        "hero": "Tassadar",
        "id": "TassadarCombatStyleDistortionBeam"
    },
    {
        "image": "survivalist-training.png",
        "level": "1",
        "name": "Survivalist Training",
        "icon": "storm_btn_d3_monk_mantraofevasion.dds",
        "description": "Regeneration Globes restore 100% more Mana.",
        "hero": "Rexxar",
        "id": "RexxarSurvivalistTraining"
    },
    {
        "image": "shadow-spike.png",
        "level": "7",
        "name": "Shadow Spike",
        "icon": "storm_ui_icon_zeratul_singularityspike.dds",
        "cooldown": 12,
        "description": "No longer decloak when using Singularity Spike. Range increased by 20%.",
        "hero": "Zeratul",
        "id": "ZeratulMasteryShadowSpikeSingularitySpike"
    },
    {
        "image": "regenerative-bile.png",
        "level": "20",
        "name": "Regenerative Bile",
        "icon": "storm_ui_icon_stitches_putridbile.dds",
        "cooldown": 60,
        "description": "Putrid Bile lasts 2 seconds longer, grants an additional 10% Movement Speed and heals for 50% of the damage dealt.",
        "hero": "Stitches",
        "id": "StitchesMasteryRegenerativeBilePutridBile"
    },
    {
        "image": "full-keg.png",
        "level": "7",
        "name": "Full Keg",
        "icon": "storm_temp_war3_btnsmash.dds",
        "cooldown": 5,
        "description": "Increases Keg Smash's damage and radius by 50%.",
        "hero": "Chen",
        "id": "ChenMasteryKegSmashFullKeg"
    },
    {
        "image": "heavens-fury.png",
        "level": "20",
        "name": "Heaven's Fury",
        "icon": "storm_ui_icon_johanna_falling_sword.dds",
        "cooldown": 80,
        "description": "While in the air, holy bolts rain down on enemies dealing 25 (+7 per level) damage and reducing the cooldown of Falling Sword by 2 seconds for each enemy hit.",
        "hero": "Johanna",
        "id": "CrusaderMasteryFallingSwordHeavensFury"
    },
    {
        "image": "loud-speakers.png",
        "level": "7",
        "name": "Loud Speakers",
        "icon": "storm_ui_icon_deathpact_2.dds",
        "cooldown": 10,
        "description": "Increases Face Melt range and knockback by 50%.",
        "hero": "E.T.C.",
        "id": "L90ETCMasteryFaceMeltLoudSpeakers"
    },
    {
        "image": "icy-veins.png",
        "level": "13",
        "name": "Icy Veins",
        "icon": "storm_btn_d3_wizard_rayoffrost.dds",
        "cooldown": 60,
        "description": "Activate to make your Basic Abilities' cooldowns recharge three times as fast and reduce their Mana cost by 50% for 5 seconds.",
        "hero": "Jaina",
        "id": "JainaMasteryIcyVeins"
    },
    {
        "image": "overflowing-quiver.png",
        "level": "4",
        "name": "Overflowing Quiver",
        "icon": "storm_ui_icon_sylvanas_witheringfire.dds",
        "cooldown": 2,
        "description": "Whenever you would gain a Withering Fire charge from killing a Minion or Hero while at maximum charges, it is automatically fired.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentOverflowingQuiver"
    },
    {
        "image": "invigoration.png",
        "level": "1",
        "name": "Invigoration",
        "icon": "storm_ui_icon_Butcher_Hamstring.dds",
        "cooldown": 4,
        "description": "If Hamstring hits a Hero, half of the Mana cost is refunded and the cooldown is reduced by 1 second.",
        "hero": "Butcher",
        "id": "ButcherMasteryHamstringInvigoration"
    },
    {
        "image": "sprint.png",
        "level": "13",
        "name": "Sprint",
        "icon": "storm_ui_temp_icon_sprint.dds",
        "cooldown": 60,
        "description": "Activate to gain 75% Movement Speed for 3 seconds.",
        "hero": "Tyrande",
        "id": "GenericTalentSprint"
    },
    {
        "image": "blood-ritual.png",
        "level": "1",
        "name": "Blood Ritual",
        "icon": "storm_temp_war3_btndrain.dds",
        "description": "Increases Health and Mana granted by Voodoo Ritual by 125%.",
        "hero": "Nazeebo",
        "id": "WitchDoctorCombatStyleBloodRitual"
    },
    {
        "image": "kill-command.png",
        "level": "20",
        "name": "Kill Command",
        "icon": "storm_ui_icon_rexxar_unleashtheboars.dds",
        "cooldown": 60,
        "description": "Unleash the Boars deals 50% more damage and roots for 1.5 seconds.",
        "hero": "Rexxar",
        "id": "RexxarUnleashTheBoarsKillCommand"
    },
    {
        "image": "prolonged-safeguard.png",
        "level": "1",
        "name": "Prolonged Safeguard",
        "icon": "storm_ui_icon_medic_deployshield.dds",
        "cooldown": 15,
        "description": "Increases Safeguard's duration by 1 second.",
        "hero": "Lt. Morales",
        "id": "MedicProlongedSafeguard"
    },
    {
        "image": "punishment.png",
        "level": "1",
        "name": "Punishment",
        "icon": "storm_ui_icon_valla_hatred.dds",
        "description": "Using an Ability also grants 3 Hatred stacks.",
        "hero": "Valla",
        "id": "DemonHunterCombatStylePunishment"
    },
    {
        "image": "fire-devil.png",
        "level": "4",
        "name": "Fire Devil",
        "icon": "storm_temp_war3_btnwalloffire.dds",
        "cooldown": 6,
        "description": "Fire Stomp also surrounds you in flames that deal 10 (+2 per level) damage every second for 6 seconds.",
        "hero": "Diablo",
        "id": "DiabloMasteryFireDevilFireStomp"
    },
    {
        "image": "hyperfocus-coils.png",
        "level": "16",
        "name": "Hyperfocus Coils",
        "icon": "storm_ui_icon_dethlazor.dds",
        "cooldown": 12,
        "description": "Deth Lazor charges twice as fast.",
        "hero": "Gazlowe",
        "id": "TinkerMasteryHyperfocusCoils"
    },
    {
        "image": "moonburn.png",
        "level": "1",
        "name": "Moonburn",
        "icon": "storm_btn-ability_malfurion-moonfire.dds",
        "cooldown": 3,
        "description": "Increases Moonfire's damage to Minions and Mercenaries by 100%.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryMoonburn"
    },
    {
        "image": "infernal-globe.png",
        "level": "7",
        "name": "Infernal Globe",
        "icon": "storm_temp_war3_btnorboffire.dds",
        "cooldown": 10,
        "description": "Globe of Annihilation's cast time and speed are reduced and increased by 40% and targets take an additional 12 (+3 per level) damage over 4 seconds.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryInfernalGlobe"
    },
    {
        "image": "stormcaller.png",
        "level": "4",
        "name": "Stormcaller",
        "icon": "storm_temp_war3_btnlightningshield.dds",
        "cooldown": 8,
        "description": "Reduces Lightning Shield's Mana cost by 40% and increases the duration by 2 seconds.",
        "hero": "Rehgar",
        "id": "RehgarMasteryStormcaller"
    },
    {
        "image": "advanced-block.png",
        "level": "4",
        "name": "Advanced Block",
        "icon": "storm_temp_war3_btnhumanarmoruptwo.dds",
        "description": "Periodically reduces the damage received from Hero Basic Attacks by 50%.  Stores up to 3 charges.",
        "hero": "Lt. Morales",
        "id": "MedicAdvancedBlock"
    },
    {
        "image": "chain-reaction.png",
        "level": "4",
        "name": "Chain Reaction",
        "icon": "storm_ui_icon_chainhealing.dds",
        "cooldown": 9,
        "description": "Chain Heals on allies with Lightning Shield active are increased by 25%.",
        "hero": "Rehgar",
        "id": "RehgarMasteryChainReaction"
    },
    {
        "image": "with-the-wind.png",
        "level": "1",
        "name": "With the Wind",
        "icon": "storm_ui_icon_sylvanas_witheringfire.dds",
        "cooldown": 2,
        "description": "Increases Withering Fire's range by 25%.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentWithTheWind"
    },
    {
        "image": "shooting-star.png",
        "level": "16",
        "name": "Shooting Star",
        "icon": "storm_temp_war3_btnmoonstone.dds",
        "cooldown": 12,
        "description": "Lunar Flare deals 50% more damage and refunds all Mana if you hit an enemy Hero.",
        "hero": "Tyrande",
        "id": "TyrandeMasteryLunarFlareShootingStar"
    },
    {
        "image": "feral-heart.png",
        "level": "4",
        "name": "Feral Heart",
        "icon": "storm_temp_war3_btnspiritwolf.dds",
        "cooldown": 1,
        "description": "Increases Health and Mana Regeneration by 75% while in Ghost Wolf form.",
        "hero": "Rehgar",
        "id": "RehgarMasteryFeralHeart"
    },
    {
        "image": "fealty-unto-death.png",
        "level": "4",
        "name": "Fealty Unto Death",
        "icon": "storm_ui_icon_leoric_Trait.dds",
        "description": "When a nearby Minion dies, you restore 1% of your maximum Health and 5 Mana. Half as effective while Undying.",
        "hero": "Leoric",
        "id": "LeoricMasteryFealtyUntoDeathUndying"
    },
    {
        "image": "rangers-mark.png",
        "level": "1",
        "name": "Ranger's Mark",
        "icon": "storm_temp_war3_btnmarksmanship.dds",
        "cooldown": 20,
        "description": "Lower the Cooldown of Hunter's Mark by 8 seconds.",
        "hero": "Tyrande",
        "id": "TyrandeCombatStyleRangersMark"
    },
    {
        "image": "infested-toads.png",
        "level": "16",
        "name": "Infested Toads",
        "icon": "storm_btn_d3_witchdoctor_plagueoftoads.dds",
        "cooldown": 10,
        "description": "Toads explode into Corpse Spiders upon death.",
        "hero": "Nazeebo",
        "id": "WitchDoctorMasteryInfestedToads"
    },
    {
        "image": "locust-swarm.png",
        "level": "10",
        "name": "Locust Swarm",
        "icon": "storm_btn-ability_anubarak-carrionswarm.dds",
        "cooldown": 100,
        "description": "Deal 16 (+6.4 per level) damage per second in an area around yourself. Each enemy damaged heals you for 10 (+1.5 per level) Health. Lasts 8 seconds.",
        "hero": "Anub'arak",
        "id": "AnubarakHeroicAbilityCarrionSwarm"
    },
    {
        "image": "hungry-bear.png",
        "level": "4",
        "name": "Hungry Bear",
        "icon": "storm_ui_icon_rexxar_heremishaactive.dds",
        "description": "Misha's Basic Attacks heal her for 3.9% of her maximum Health.",
        "hero": "Rexxar",
        "id": "RexxarHungryBear"
    },
    {
        "image": "robo-goblin.png",
        "level": "10",
        "name": "Robo-Goblin",
        "icon": "storm_ui_icon_robogobo.dds",
        "description": "Basic Attacks deal an additional 150% damage to Minions, Mercenaries, and Structures.",
        "hero": "Gazlowe",
        "id": "TinkerHeroicAbilityRoboGoblin"
    },
    {
        "image": "raynors-raiders.png",
        "level": "10",
        "name": "Raynor's Raiders",
        "icon": "storm_ui_icon_raynor_raynorsraiders.dds",
        "cooldown": 80,
        "description": "Summon two Stealthed Banshees that attack an enemy. Each Banshee deals 16 (+4 per level) damage a second and lasts 22 seconds. Can reactivate the Ability to retarget the Banshees.",
        "hero": "Raynor",
        "id": "RaynorHeroicAbilityRaynorsRaiders"
    },
    {
        "image": "fury-of-the-sunwell.png",
        "level": "16",
        "name": "Fury of the Sunwell",
        "icon": "storm_ui_icon_kaelthas_flamestrike.dds",
        "cooldown": 7,
        "description": "Flamestrike will cast again in the same location 1 second later.",
        "hero": "Kael'thas",
        "id": "KaelthasFlamestrikeFuryOfTheSunwell"
    },
    {
        "image": "angels-grace.png",
        "level": "7",
        "name": "Angel's Grace",
        "icon": "storm_ui_icon_tyrael_eldruinsmight_a.dds",
        "cooldown": 12,
        "description": "After teleporting using El'Druin's Might, gain 25% Movement Speed for 3 seconds.",
        "hero": "Tyrael",
        "id": "TyraelMasteryElDruinsMightAngelsGrace"
    },
    {
        "image": "viking-bribery.png",
        "level": "1",
        "name": "Viking Bribery",
        "icon": "storm_temp_btn-tips-credit.dds",
        "description": "Kill enemy Minions or captured Mercenaries to gain stacks of Viking Bribery.  Use 40 stacks to bribe target Mercenary, instantly defeating them.  Does not work on Bosses.  Maximum stacks available: 100.\nCurrent number of Viking Bribery stacks: <d score=\"LostVikingsVikingBriberyStackScore\"/>",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryVikingBribery"
    },
    {
        "image": "blade-torrent.png",
        "level": "16",
        "name": "Blade Torrent",
        "icon": "storm_ui_icon_kerrigan_impalingblades.dds",
        "cooldown": 12,
        "description": "Increases Impaling Blades' radius by 30%.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryImpalingBladesBladeTorrent"
    },
    {
        "image": "raiders-recruitment.png",
        "level": "1",
        "name": "Raiders' \"Recruitment\"",
        "icon": "storm_temp_btn-tips-missioncase.dds",
        "cooldown": 0.5,
        "description": "Kill enemy Minions or captured Mercenaries to gain stacks of Recruitment.  Use 15 stacks to \"recruit\" a Mercenary, instantly defeating them. Does not work on Bosses.  Maximum 50 stacks.\nCurrent number of Recruitment stacks: 0",
        "hero": "Raynor",
        "id": "RaynorRaidersRecruitment"
    },
    {
        "image": "spell-shield.png",
        "level": "13",
        "name": "Spell Shield",
        "icon": "storm_temp_btn-ability-protoss-hardenedshields.dds",
        "description": "Upon taking Ability Damage, reduce that damage and further Ability Damage by 50% for 3 seconds.  Can only trigger once every 30 seconds.",
        "hero": "Zeratul",
        "id": "GenericTalentSpellShield"
    },
    {
        "image": "reanimation.png",
        "level": "1",
        "name": "Reanimation",
        "icon": "storm_temp_war3_btnanimatedead.dds",
        "description": "Every Regeneration Globe gathered increases your Health Regeneration by 1.5 per second. Half as effective while Undying.  You can also gather Regeneration Globes while Undying.",
        "hero": "Leoric",
        "id": "LeoricMasteryReanimation"
    },
    {
        "image": "devouring-maw.png",
        "level": "10",
        "name": "Devouring Maw",
        "icon": "storm_ui_icon_zagara_devouringmaw.dds",
        "cooldown": 100,
        "description": "Summon a Devouring Maw that deals 75 (+24 per level) damage and devours enemies for 4 seconds. Devoured enemies cannot fight and take 38 (+2 per level) damage per second.\nUsable on Unstoppable enemies.",
        "hero": "Zagara",
        "id": "ZagaraHeroicAbilityDevouringMaw"
    },
    {
        "image": "dampen-magic.png",
        "level": "1",
        "name": "Dampen Magic",
        "icon": "storm_temp_war3_btnhumanarmorupthree.dds",
        "description": "Every 8 seconds, gain a charge that reduces the damage received from the next enemy Ability by 50%.  Stores up to 2 charges.",
        "hero": "Stitches",
        "id": "GenericDampenMagic"
    },
    {
        "image": "reinforce.png",
        "level": "1",
        "name": "Reinforce",
        "icon": "storm_btn_d3ros_crusader_lawsofjustice.dds",
        "description": "Using Basic Abilities reduces the next Basic Attack against you by 50%.  Maximum 2 stacks.",
        "hero": "Johanna",
        "id": "CrusaderMasteryIronSkinReinforce"
    },
    {
        "image": "locust-nest.png",
        "level": "20",
        "name": "Locust Nest",
        "icon": "storm_ui_icon_abathur_locustnest.dds",
        "cooldown": 45,
        "description": "Activate to create a nest that periodically spawns Locusts. Only one Locust Nest can be active at a time.",
        "hero": "Abathur",
        "id": "AbathurMasteryLocustMaster"
    },
    {
        "image": "grace-of-air.png",
        "level": "13",
        "name": "Grace Of Air",
        "icon": "storm_ui_icon_thrall_windfury.dds",
        "cooldown": 12,
        "description": "Windfury attacks grant twice as many stacks of Frostwolf Resilience.",
        "hero": "Thrall",
        "id": "ThrallMasteryGraceOfAir"
    },
    {
        "image": "regenerative-microbes.png",
        "level": "1",
        "name": "Regenerative Microbes",
        "icon": "storm_ui_icon_abathur_carapace.dds",
        "cooldown": 12,
        "description": "Symbiote's Carapace heals the target for 9 (+3 per level) Health per second.",
        "hero": "Abathur",
        "id": "AbathurMasteryRegenerativeMicrobes"
    },
    {
        "image": "absolute-zero.png",
        "level": "20",
        "name": "Absolute Zero",
        "icon": "storm_temp_war3_btnfrostwyrm.dds",
        "cooldown": 80,
        "description": "Sindragosa flies twice as far.  Enemy Heroes are rooted for 2 seconds, and then slowed by 60% for 2 seconds.",
        "hero": "Arthas",
        "id": "ArthasMasteryAbsoluteZeroSummonSindragosa"
    },
    {
        "image": "calldown-mule.png",
        "level": "7",
        "name": "Calldown: MULE",
        "icon": "storm_temp_btn-ability-terran-calldownextrasupplies-color.dds",
        "cooldown": 60,
        "description": "Activate to calldown a Mule that repairs Structures, one at a time, near target point for 40 seconds, healing for 100 Health every 1 second.  Grants 1 ammo every  3 seconds.",
        "hero": "Tyrande",
        "id": "GenericTalentCalldownMULE"
    },
    {
        "image": "sizzlin-attacks.png",
        "level": "7",
        "name": "Sizzlin' Attacks",
        "icon": "storm_temp_war3_btnselfdestruct.dds",
        "cooldown": 25,
        "description": "Activate to increase Basic Attack damage by 50% for 5 seconds. Each attack costs 5 Mana.",
        "hero": "Tychus",
        "id": "TychusSearingAttacks"
    },
    {
        "image": "iron-fists.png",
        "level": "1",
        "name": "Iron Fists",
        "icon": "storm_ui_icon_monk_trait_ironfist.dds",
        "description": "Every 3rd Basic Attack deals 100% bonus damage.",
        "hero": "Kharazim",
        "id": "MonkIronFists"
    },
    {
        "image": "falling-sword.png",
        "level": "10",
        "name": "Falling Sword",
        "icon": "storm_ui_icon_johanna_falling_sword.dds",
        "cooldown": 80,
        "description": "You leap towards an area.  While in the air, you can steer the landing location by moving. \nAfter 2 seconds you land, dealing 120 (+21.5 per level) damage to nearby enemies and knocking them into the air.",
        "hero": "Johanna",
        "id": "CrusaderHeroicAbilityFallingSword"
    },
    {
        "image": "puttin-on-a-clinic.png",
        "level": "7",
        "name": "Puttin' On a Clinic",
        "icon": "storm_btn_d3_monk_mantraofconviction.dds",
        "description": "Whenever an enemy Minion, Hero, or captured Mercenary you have recently damaged is destroyed, your Ability cooldowns are reduced by 1.5 seconds.",
        "hero": "Raynor",
        "id": "RaynorLeadFromTheFrontPuttinOnAClinic"
    },
    {
        "image": "dimensional-warp.png",
        "level": "16",
        "name": "Dimensional Warp",
        "icon": "storm_ui_icon_tassadar_dimensionalshift.dds",
        "cooldown": 20,
        "description": "While Dimensional Shifted, gain 50% Movement Speed and heal for 40 (+40 per level) Health.",
        "hero": "Tassadar",
        "id": "TassadarMasteryDimensionalWarp"
    },
    {
        "image": "crowd-pleaser.png",
        "level": "20",
        "name": "Crowd Pleaser",
        "icon": "storm_ui_icon_dwarftoss.dds",
        "cooldown": 75,
        "description": "Stage Dive's impact area is 50% bigger, and its cooldown is reduced by 15 seconds for every enemy Hero hit.",
        "hero": "E.T.C.",
        "id": "L90ETCMasteryStageDiveCrowdPleaser"
    },
    {
        "image": "system-shock.png",
        "level": "16",
        "name": "System Shock",
        "icon": "storm_ui_icon_medic_displacementgrenade.dds",
        "cooldown": 12,
        "description": "Displacement Grenade slows enemies by 50% for 4 seconds. The slow amount decays over its duration.",
        "hero": "Lt. Morales",
        "id": "MedicSystemShock"
    },
    {
        "image": "hive-master.png",
        "level": "20",
        "name": "Hive Master",
        "icon": "storm_btn-ability_anubarak-carrionswarm.dds",
        "cooldown": 100,
        "description": "Anub'arak gains a permanent Vampire Locust that attacks a nearby enemy every 3 seconds. The Vampire Locust deals 16 (+16 per level) damage and returns to heal Anub'arak for 20 (+3 per level) health.",
        "hero": "Anub'arak",
        "id": "AnubarakMasteryHiveMasterCarrionSwarm"
    },
    {
        "image": "fifth-circle.png",
        "level": "20",
        "name": "Fifth Circle",
        "icon": "storm_temp_war3_btngenericspellimmunity.dds",
        "cooldown": 20,
        "description": "Black Pool makes Basic Attacks and Abilities slow enemies Attack and Movement Speeds by 40% for 3 seconds.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryBlackPoolFifthCircle"
    },
    {
        "image": "numbing-blast.png",
        "level": "16",
        "name": "Numbing Blast",
        "icon": "storm_ui_icon_jaina_coneofcold.dds",
        "cooldown": 10,
        "description": "Cone of Cold also roots Chilled targets for 1 second.",
        "hero": "Jaina",
        "id": "JainaMasteryNumbingBlast"
    },
    {
        "image": "blood-for-blood.png",
        "level": "16",
        "name": "Blood for Blood",
        "icon": "storm_temp_war3_btndaggerofescape.dds",
        "cooldown": 60,
        "description": "Activate to deal 10% of target enemy Hero's Max Health and heal for twice that amount.",
        "hero": "Valla",
        "id": "GenericTalentBloodForBlood"
    },
    {
        "image": "huntress-fury.png",
        "level": "13",
        "name": "Huntress' Fury",
        "icon": "storm_temp_war3_btnmarksmanship.dds",
        "cooldown": 20,
        "description": "Gain 40% additional Attack Speed for 4 seconds when using Hunter's Mark.",
        "hero": "Tyrande",
        "id": "TyrandeCombatStyleHuntressFury"
    },
    {
        "image": "restless-wolves.png",
        "level": "13",
        "name": "Restless Wolves",
        "icon": "storm_ui_icon_thrall_feralspirit.dds",
        "cooldown": 12,
        "description": "If Feral Spirit hits an enemy Hero, its cooldown is reduced by 50%.",
        "hero": "Thrall",
        "id": "ThrallMasteryRestlessWolves"
    },
    {
        "image": "healing-totem.png",
        "level": "1",
        "name": "Healing Totem",
        "icon": "storm_temp_war3_btnentrapmentward.dds",
        "cooldown": 60,
        "description": "Activate to place a Totem that heals allies in an area for 1.95% of their max Health every second for 10 seconds.",
        "hero": "Rehgar",
        "id": "RehgarMasteryShamanHealingWard"
    },
    {
        "image": "bulwark-of-light.png",
        "level": "20",
        "name": "Bulwark of Light",
        "icon": "storm_ui_icon_divineshield.dds",
        "cooldown": 70,
        "description": "Divine Shield lasts 2 seconds longer and its cooldown is reduced by 20 seconds.",
        "hero": "Uther",
        "id": "UtherMasteryBulwarkOfLightDivineShield"
    },
    {
        "image": "focusing-diodes.png",
        "level": "20",
        "name": "Focusing Diodes",
        "icon": "storm_ui_icon_tychus_drakkinlaserdrill.dds",
        "cooldown": 100,
        "description": "Increases the range of the Drakken Laser Drill by 50%.  Deals increased damage the longer it remains on a single target, up to 100% extra damage.",
        "hero": "Tychus",
        "id": "TychusMasteryDrakkenLaserFocusingDiodes"
    },
    {
        "image": "battered-assault.png",
        "level": "1",
        "name": "Battered Assault",
        "icon": "storm_temp_war3_btnshadowstrike.dds",
        "cooldown": 8,
        "description": "Increases the Basic Attack bonus of Sweeping Strike to 50%.",
        "hero": "Illidan",
        "id": "IllidanMasteryBatteredAssaultSweepingStrike"
    },
    {
        "image": "assassins-blade.png",
        "level": "13",
        "name": "Assassin's Blade",
        "icon": "storm_ui_icon_zeratul_cloak.dds",
        "description": "Gain 25% Basic Attack damage for 5 seconds when breaking Permanent Cloak. 10% increased Movement Speed while Stealthed from Permanent Cloak.",
        "hero": "Zeratul",
        "id": "ZeratulCombatStyleAssassinsBlade"
    },
    {
        "image": "puncturing-arrow.png",
        "level": "4",
        "name": "Puncturing Arrow",
        "icon": "storm_ui_icon_valla_hungeringarrow.dds",
        "cooldown": 14,
        "description": "Hungering Arrow range increased by 25% and the number of times it can bounce to 3.",
        "hero": "Valla",
        "id": "DemonHunterMasteryPuncturingArrow"
    },
    {
        "image": "savage-charge.png",
        "level": "13",
        "name": "Savage Charge",
        "icon": "storm_ui_icon_Butcher_FullBoar.dds",
        "cooldown": 20,
        "description": "Ruthless Onslaught deals bonus damage to Heroes equal to 10% of their maximum Health.",
        "hero": "Butcher",
        "id": "ButcherMasteryRuthlessOnslaughtSavageCharge"
    },
    {
        "image": "locust-needles.png",
        "level": "4",
        "name": "Locust Needles",
        "icon": "storm_temp_war3_btnfanofknives.dds",
        "description": "Basic Attacks deal 50% of your Basic Attack Damage in an area around the target.",
        "hero": "Anub'arak",
        "id": "AnubarakCombatStyleLocustNeedles"
    },
    {
        "image": "second-sweep.png",
        "level": "16",
        "name": "Second Sweep",
        "icon": "storm_temp_war3_btnshadowstrike.dds",
        "cooldown": 8,
        "description": "Store up to 2 charges of Sweeping Strike.",
        "hero": "Illidan",
        "id": "IllidanMasterySecondSweepSweepingStrike"
    },
    {
        "image": "focused-attack.png",
        "level": "4",
        "name": "Focused Attack",
        "icon": "storm_temp_war3_btnmarksmanship.dds",
        "description": "Every 10 seconds, your next Basic Attack against a Hero deals 75% additional damage. Basic Attacks reduce this cooldown by 1 second.",
        "hero": "Zeratul",
        "id": "GenericTalentFocusedAttack"
    },
    {
        "image": "psionic-wound.png",
        "level": "16",
        "name": "Psionic Wound",
        "icon": "storm_ui_icon_artanis_doubleslash_off.dds",
        "cooldown": 4,
        "description": "Twin Blades final strike causes enemy Heroes to become Vulnerable for 2 seconds, increasing all damage taken by 25%.",
        "hero": "Artanis",
        "id": "ArtanisTwinBladesPsionicWound"
    },
    {
        "image": "starfall.png",
        "level": "10",
        "name": "Starfall",
        "icon": "storm_temp_war3_btnstarfall.dds",
        "cooldown": 100,
        "description": "Deal 20 (+6 per level) damage per second and slow enemies by 20% in an area. Lasts 8 seconds.",
        "hero": "Tyrande",
        "id": "TyrandeHeroicAbilityStarfall"
    },
    {
        "image": "ice-barrier.png",
        "level": "16",
        "name": "Ice Barrier",
        "icon": "storm_ui_icon_jaina_frostbite.dds",
        "description": "When Jaina does increased damage from Frostbite, she is shielded for 25% of the total damage dealt. This Shield lasts 3 seconds.",
        "hero": "Jaina",
        "id": "JainaMasteryIceBarrier"
    },
    {
        "image": "destruction.png",
        "level": "4",
        "name": "Destruction",
        "icon": "storm_temp_war3_btnfrostmourne.dds",
        "cooldown": 12,
        "description": "Damage boost of Frostmourne Hungers increased to 150% damage.",
        "hero": "Arthas",
        "id": "ArthasMasteryDestruction"
    },
    {
        "image": "scrap-o-matic-smelter.png",
        "level": "1",
        "name": "Scrap-o-Matic Smelter",
        "icon": "storm_temp_war3_btnpillage.dds",
        "description": "Increases the amount of Mana restored by scrap to 60.",
        "hero": "Gazlowe",
        "id": "TinkerCombatStyleScrapoMaticSmelter"
    },
    {
        "image": "the-sequel.png",
        "level": "20",
        "name": "The Sequel!",
        "icon": "storm_ui_icon_lostvikings_fastrestart.dds",
        "description": "Reduces the Lost Vikings' death timer by 50%.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryTheSequel"
    },
    {
        "image": "hindering-slime.png",
        "level": "7",
        "name": "Hindering Slime",
        "icon": "storm_temp_war3_btncorrosivebreath.dds",
        "cooldown": 4,
        "description": "Increases the slow amount of Slime from 20% to 30%.",
        "hero": "Murky",
        "id": "MurkyMasteryHinderingSlow"
    },
    {
        "image": "mistified.png",
        "level": "7",
        "name": "Mistified",
        "icon": "storm_temp_war3_btnreplenishhealth.dds",
        "cooldown": 4,
        "description": "Reduces the cooldown of Soothing Mist by 1 second every time you cast a Basic Ability.",
        "hero": "Brightwing",
        "id": "BrightwingMistifiedSoothingMist"
    },
    {
        "image": "extended-spikes.png",
        "level": "1",
        "name": "Extended Spikes",
        "icon": "storm_btn-ability_anubarak-impale.dds",
        "cooldown": 12,
        "description": "Increases the max range of Impale by 25%.",
        "hero": "Anub'arak",
        "id": "AnubarakMasteryExtendedSpikesImpale"
    },
    {
        "image": "winters-reach.png",
        "level": "1",
        "name": "Winter's Reach",
        "icon": "storm_ui_icon_jaina_frostbolt.dds",
        "cooldown": 4,
        "description": "Increases the range of Frostbolt by 30%.",
        "hero": "Jaina",
        "id": "JainaMasteryWintersReach"
    },
    {
        "image": "berserk.png",
        "level": "16",
        "name": "Berserk",
        "icon": "storm_temp_war3_btnberserk.dds",
        "cooldown": 60,
        "description": "Activate to increase your Attack Speed by 40% and Movement Speed by 10% for 4 seconds.",
        "hero": "Zeratul",
        "id": "GenericTalentBerserk"
    },
    {
        "image": "convection.png",
        "level": "1",
        "name": "Convection",
        "icon": "storm_ui_icon_kaelthas_flamestrike.dds",
        "cooldown": 7,
        "description": "Flamestrike deals 20% bonus damage to enemies stunned by Gravity Lapse.",
        "hero": "Kael'thas",
        "id": "KaelthasFlamestrikeConvection"
    },
    {
        "image": "hidden-assault.png",
        "level": "13",
        "name": "Hidden Assault",
        "icon": "storm_temp_war3_btnhealthstone.dds",
        "cooldown": 15,
        "description": "When you respawn from the Egg, you gain Stealth and 20% Movement Speed for 5.125 seconds.",
        "hero": "Murky",
        "id": "MurkyMasteryHiddenAssault"
    },
    {
        "image": "gladiators-war-shout.png",
        "level": "20",
        "name": "Gladiator's War Shout",
        "icon": "storm_ui_icon_bloodlust.dds",
        "cooldown": 90,
        "description": "Bloodlust affects all allied Heroes, Minions, and Mercenaries on the entire battleground and can be cast without breaking Ghost Wolf.",
        "hero": "Rehgar",
        "id": "RehgarMasteryGladiatorsWarShout"
    },
    {
        "image": "earthquake.png",
        "level": "10",
        "name": "Earthquake",
        "icon": "storm_ui_icon_thrall_earthquake.dds",
        "cooldown": 60,
        "description": "Summon a massive Earthquake that periodically slows enemies in the area by 70%. Lasts for 10 seconds.",
        "hero": "Thrall",
        "id": "ThrallHeroicAbilityEarthquake"
    },
    {
        "image": "cluster-round.png",
        "level": "16",
        "name": "Cluster Round",
        "icon": "storm_ui_icon_raynor_penetratinground.dds",
        "cooldown": 12,
        "description": "Penetrating Round damage is increased by 20% for each additional target hit up to 100%, and the width is increased by 50%.",
        "hero": "Raynor",
        "id": "RaynorMasteryClusterRoundPenetratingRound"
    },
    {
        "image": "farsight.png",
        "level": "7",
        "name": "Farsight",
        "icon": "storm_temp_war3_btnfarsight.dds",
        "cooldown": 30,
        "description": "Activate to reveal an area for 10 seconds.  Enemies in the area are revealed for 4 seconds.",
        "hero": "Rehgar",
        "id": "RehgarMasteryFarsight"
    },
    {
        "image": "medivac-dropship.png",
        "level": "10",
        "name": "Medivac Dropship",
        "icon": "storm_ui_icon_medic_medivacdropship.dds",
        "cooldown": 50,
        "description": "Target a location for a Medivac transport. For up to 10.5 seconds before takeoff, allies can right-click to enter the Medivac.",
        "hero": "Lt. Morales",
        "id": "MedicHeroicAbilityMedivacDropship"
    },
    {
        "image": "sixth-sense.png",
        "level": "13",
        "name": "Sixth Sense",
        "icon": "storm_temp_war3_btnevasion.dds",
        "cooldown": 15,
        "description": "Take 50% reduced damage from Abilities while Evasion is active.",
        "hero": "Illidan",
        "id": "IllidanMasterySixthSenseEvasion"
    },
    {
        "image": "nydus-network.png",
        "level": "10",
        "name": "Nydus Network",
        "icon": "storm_ui_icon_zagara_nydusworm.dds",
        "cooldown": 60,
        "description": "Summon a Nydus Worm at target location that you can enter by right-clicking. While inside, you exit by targeting a Nydus Worm with R or right-clicking near the Worm. Maximum 4 Nydus Worms.",
        "hero": "Zagara",
        "id": "ZagaraHeroicAbilityNydusAssault"
    },
    {
        "image": "envenom.png",
        "level": "4",
        "name": "Envenom",
        "icon": "storm_temp_war3_btnpoisonarrow.dds",
        "cooldown": 60,
        "description": "Activate to poison an enemy Hero, dealing 179.96 (+29.92 per level) damage over 10 seconds.",
        "hero": "Zagara",
        "id": "GenericTalentEnvenom"
    },
    {
        "image": "slimy-pufferfish.png",
        "level": "16",
        "name": "Slimy Pufferfish",
        "icon": "storm_temp_war3_btnmurloc.dds",
        "cooldown": 15,
        "description": "The Pufferfish casts Slime at its location upon landing.",
        "hero": "Murky",
        "id": "MurkyMasterySlimyPufferfish"
    },
    {
        "image": "grounding-brew.png",
        "level": "1",
        "name": "Grounding Brew",
        "icon": "storm_temp_war3_btnstrongdrink.dds",
        "cooldown": 5,
        "description": "Fortifying Brew reduces all incoming Ability Damage by 25% while drinking.",
        "hero": "Chen",
        "id": "ChenMasteryFortifyingBrewGroundingBrew"
    },
    {
        "image": "healing-ward.png",
        "level": "4",
        "name": "Healing Ward",
        "icon": "storm_temp_war3_btnhealingward.dds",
        "cooldown": 60,
        "description": "Activate to place a ward on the ground that heals allies in an area for 1.95% of their max Health every second for 10 seconds.",
        "hero": "Tyrande",
        "id": "GenericTalentHealingWard"
    },
    {
        "image": "haymaker.png",
        "level": "10",
        "name": "Haymaker",
        "icon": "storm_btn_d3_monk_wayofthehundredfists.dds",
        "cooldown": 40,
        "description": "Stun target enemy Hero, and wind up a punch dealing 300 (+20 per level) damage and knocking the target back, hitting enemies in the way for 75 (+5 per level) damage and knocking them aside.",
        "hero": "Muradin",
        "id": "MuradinHeroicAbilityHaymaker"
    },
    {
        "image": "kwik-release-charge.png",
        "level": "16",
        "name": "Kwik Release Charge",
        "icon": "storm_btn_d3_demonhunter_grenades.dds",
        "cooldown": 12,
        "description": "Increased number of Bomb charges to 2.",
        "hero": "Gazlowe",
        "id": "TinkerMasteryQuikReleaseCharge"
    },
    {
        "image": "combination-attack.png",
        "level": "16",
        "name": "Combination Attack",
        "icon": "storm_temp_war3_btndrunkendodge.dds",
        "cooldown": 5,
        "description": "The next Basic Attack after using Flying Kick deals 100% bonus damage.",
        "hero": "Chen",
        "id": "ChenMasteryFlyingKickCombinationAttack"
    },
    {
        "image": "zealotry.png",
        "level": "7",
        "name": "Zealotry",
        "icon": "storm_ui_icon_tyrael_righteousness.dds",
        "cooldown": 12,
        "description": "Increases shield duration by 100%.",
        "hero": "Tyrael",
        "id": "TyraelMasteryZealotry"
    },
    {
        "image": "devastating-charge.png",
        "level": "7",
        "name": "Devastating Charge",
        "icon": "storm_temp_war3_btnghoulfrenzy.dds",
        "cooldown": 12,
        "description": "Shadow Charge reduces the duration of silences, stuns, slows, and roots against you by 50% for 6 seconds.",
        "hero": "Diablo",
        "id": "DiabloTalentDevastatingChargeShadowCharge"
    },
    {
        "image": "lightning-bond.png",
        "level": "16",
        "name": "Lightning Bond",
        "icon": "storm_temp_war3_btnlightningshield.dds",
        "cooldown": 8,
        "description": "Casting Lightning Shield on an ally also casts it on you, including any talent bonuses.",
        "hero": "Rehgar",
        "id": "RehgarMasteryLightningBond"
    },
    {
        "image": "army-of-the-dead.png",
        "level": "10",
        "name": "Army of the Dead",
        "icon": "storm_temp_war3_btnanimatedead.dds",
        "cooldown": 100,
        "description": "Summons Ghouls that last 15 seconds. Sacrifice Ghouls to heal for 104 (+24 per level) Health.",
        "hero": "Arthas",
        "id": "ArthasHeroicAbilityArmyoftheDead"
    },
    {
        "image": "bullhead-mines.png",
        "level": "13",
        "name": "Bullhead Mines",
        "icon": "storm_ui_icon_sgthammer_spidermines.dds",
        "cooldown": 14,
        "description": "Middle Spider Mine knocks target back a short distance.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerBullheadMines"
    },
    {
        "image": "guitar-hero.png",
        "level": "7",
        "name": "Guitar Hero",
        "icon": "storm_ui_icon_hatestrike.dds",
        "cooldown": 8,
        "description": "While Guitar Solo is active, you heal for 50% of the damage dealt by Basic Attacks.",
        "hero": "E.T.C.",
        "id": "ETCMasteryGuitarHero"
    },
    {
        "image": "nexus-frenzy.png",
        "level": "20",
        "name": "Nexus Frenzy",
        "icon": "storm_btn_d3_demonhunter_rapidfire.dds",
        "description": "Increases Attack Speed by 20% and Attack Range by 20%.",
        "hero": "Valla",
        "id": "GenericTalentNexusFrenzy"
    },
    {
        "image": "lingering-blind.png",
        "level": "4",
        "name": "Lingering Blind",
        "icon": "storm_temp_war3_btndeathanddecay.dds",
        "cooldown": 10,
        "description": "Increases the duration of Blinding Wind by 50%.",
        "hero": "Li Li",
        "id": "LiLiMasteryBlindingWindLingeringBlind"
    },
    {
        "image": "mutalisk.png",
        "level": "13",
        "name": "Mutalisk",
        "icon": "storm_ui_icon_zagara_hunterkillermuta.dds",
        "cooldown": 14,
        "description": "Your Hunter Killer spawns a Mutalisk with a bounce attack and 50% increased duration.",
        "hero": "Zagara",
        "id": "ZagaraMasteryMutalisk"
    },
    {
        "image": "firestorm.png",
        "level": "13",
        "name": "Firestorm",
        "icon": "storm_temp_war3_btnwalloffire.dds",
        "cooldown": 6,
        "description": "Fire Stomp waves return to you, dealing 125% damage.",
        "hero": "Diablo",
        "id": "DiabloMasteryFirestorm"
    },
    {
        "image": "lightning-breath.png",
        "level": "10",
        "name": "Lightning Breath",
        "icon": "storm_btn_d3_wizard_shockpulse.dds",
        "cooldown": 60,
        "description": "Become Unstoppable while channeling lightning that deals 320 (+72 per level) damage over 4 seconds.  The direction of the Lightning changes with your mouse cursor position.",
        "hero": "Diablo",
        "id": "DiabloHeroicAbilityLightningBreath"
    },
    {
        "image": "give-me-more.png",
        "level": "1",
        "name": "Give Me More!",
        "icon": "storm_ui_icon_raynor_adrenalinrush.dds",
        "cooldown": 40,
        "description": "Increases Adrenaline Rush healing by 50%.",
        "hero": "Raynor",
        "id": "RaynorMasteryGiveMeMoreAdrenalineRush"
    },
    {
        "image": "keg-toss.png",
        "level": "1",
        "name": "Keg Toss",
        "icon": "storm_temp_war3_btnsmash.dds",
        "cooldown": 5,
        "description": "Increase Keg Smash range by 125%.",
        "hero": "Chen",
        "id": "ChenMasteryKegSmashKegToss"
    },
    {
        "image": "secret-weapon.png",
        "level": "7",
        "name": "Secret Weapon",
        "icon": "storm_temp_war3_btnfeedback.dds",
        "cooldown": 10,
        "description": "Basic Attacks deal 80% bonus damage while Hammerang is in flight.",
        "hero": "Falstad",
        "id": "FalstadMasteryHammerangSecretWeapon"
    },
    {
        "image": "safety-sprint.png",
        "level": "16",
        "name": "Safety Sprint",
        "icon": "storm_ui_temp_icon_sprint.dds",
        "description": "Increase the Movement Speed bonus of Fast Feet from 10% to 20% while under 50% Health.",
        "hero": "Li Li",
        "id": "LiLiMasteryFastFeetSafetySprint"
    },
    {
        "image": "bombard-strain.png",
        "level": "13",
        "name": "Bombard Strain",
        "icon": "storm_ui_icon_abathur_spawnlocust.dds",
        "description": "Locust's Basic Attacks become a long-range siege attack that deal 66.6667% more damage.",
        "hero": "Abathur",
        "id": "AbathurCombatStyleBombardStrain"
    },
    {
        "image": "hyperion.png",
        "level": "10",
        "name": "Hyperion",
        "icon": "storm_ui_icon_raynor_hyperion.dds",
        "cooldown": 100,
        "description": "Order the Hyperion to make a strafing run dealing 25 (+6 per level) damage a second, hitting up to 4 enemies. Also occasionally fires its Yamato Cannon on Structures for 300 (+72 per level) damage. Lasts 12 seconds.",
        "hero": "Raynor",
        "id": "RaynorHeroicAbilityHyperion"
    },
    {
        "image": "ambush-snipe.png",
        "level": "1",
        "name": "Ambush Snipe",
        "icon": "storm_ui_icon_nova_snipe.dds",
        "cooldown": 10,
        "description": "Increases Snipe's damage by 20% when used from Cloak or within one second of being Cloaked.",
        "hero": "Nova",
        "id": "NovaMasteryAmbushSnipe"
    },
    {
        "image": "reverberation.png",
        "level": "1",
        "name": "Reverberation",
        "icon": "storm_ui_icon_thunderclap.dds",
        "cooldown": 8,
        "description": "Enemies hit by Thunder Clap have their Attack Speed reduced by 50% for 3 seconds.",
        "hero": "Muradin",
        "id": "MuradinMasteryThunderclapReverberation"
    },
    {
        "image": "arreat-crater.png",
        "level": "20",
        "name": "Arreat Crater",
        "icon": "storm_ui_icon_sonya_leap.dds",
        "cooldown": 70,
        "description": "Leap leaves behind an impassable crater for 5 seconds.",
        "hero": "Sonya",
        "id": "BarbarianMasteryArreatCraterLeap"
    },
    {
        "image": "epiphany.png",
        "level": "20",
        "name": "Epiphany",
        "icon": "storm_btn_d3_monk_innersanctuary.dds",
        "cooldown": 60,
        "description": "Activate to restore 32.81% of your maximum Mana and refill 2 charges of Radiant Dash.",
        "hero": "Kharazim",
        "id": "MonkEpiphany"
    },
    {
        "image": "no-escape.png",
        "level": "16",
        "name": "No Escape",
        "icon": "storm_ui_icon_sonya_fury.dds",
        "description": "Increases the Movement Speed bonus from using Basic and Heroic Abilities to 25%.",
        "hero": "Sonya",
        "id": "BarbarianCombatStyleNoEscape"
    },
    {
        "image": "assault-scarab.png",
        "level": "1",
        "name": "Assault Scarab",
        "icon": "storm_btn-ability_anubarak-carrionbeetles.dds",
        "description": "Increases the attack damage of spawned Beetles by 25%.",
        "hero": "Anub'arak",
        "id": "AnubarakMasteryAssaultScarabBeetleSpit"
    },
    {
        "image": "deadly-strike.png",
        "level": "4",
        "name": "Deadly Strike",
        "icon": "storm_temp_war3_btndrunkendodge.dds",
        "cooldown": 5,
        "description": "Increase the damage of Flying Kick by 50%.",
        "hero": "Chen",
        "id": "ChenMasteryFlyingKickDeadlyStrike"
    },
    {
        "image": "composite-spear.png",
        "level": "7",
        "name": "Composite Spear",
        "icon": "storm_ui_icon_sonya_ancientspear.dds",
        "cooldown": 13,
        "description": "Increases the range of Ancient Spear by 30%.",
        "hero": "Sonya",
        "id": "BarbarianMasteryCompositeSpearAncientSpear"
    },
    {
        "image": "bile-drop.png",
        "level": "13",
        "name": "Bile Drop",
        "icon": "storm_ui_icon_zagara_infesteddrop.dds",
        "cooldown": 12,
        "description": "Increases the impact damage of Infested Drop by 100%.",
        "hero": "Zagara",
        "id": "ZagaraMasteryBileDrop"
    },
    {
        "image": "lost-soul.png",
        "level": "1",
        "name": "Lost Soul",
        "icon": "storm_ui_icon_sylvanas_shadowdagger.dds",
        "cooldown": 10,
        "description": "Reduces the cooldown of Shadow Dagger by 2 seconds.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentLostSoul"
    },
    {
        "image": "siphoning-arrow.png",
        "level": "1",
        "name": "Siphoning Arrow",
        "icon": "storm_ui_icon_valla_hungeringarrow.dds",
        "cooldown": 14,
        "description": "50% of the damage dealt by Hungering Arrow is returned as Health to Valla.",
        "hero": "Valla",
        "id": "DemonHunterMasterySiphoningArrow"
    },
    {
        "image": "anti-armor-shells.png",
        "level": "7",
        "name": "Anti-Armor Shells",
        "icon": "storm_temp_btn-upgrade-terran-u238shells.dds",
        "description": "Your Basic Attacks deal 250% damage, but your Attack Speed is proportionally slower.",
        "hero": "Nova",
        "id": "NovaCombatStyleAntiArmorShells"
    },
    {
        "image": "endless-fury.png",
        "level": "1",
        "name": "Endless Fury",
        "icon": "storm_ui_icon_sonya_fury.dds",
        "description": "Increases maximum Fury to 200.",
        "hero": "Sonya",
        "id": "BarbarianCombatStyleEndlessFury"
    },
    {
        "image": "purifier-beam.png",
        "level": "10",
        "name": "Purifier Beam",
        "icon": "storm_ui_icon_artanis_purifierbeam.dds",
        "cooldown": 80,
        "description": "Target an enemy Hero with an orbital beam from the Spear of Adun, dealing 80 (+16 per level) damage per second for 8 seconds. The beam will chase the target as they move.  Unlimited range.",
        "hero": "Artanis",
        "id": "ArtanisHeroicAbilitySpearofAdunPurifierBeam"
    },
    {
        "image": "shot-of-fury.png",
        "level": "1",
        "name": "Shot of Fury",
        "icon": "storm_ui_icon_sonya_fury.dds",
        "cooldown": 45,
        "description": "Activate to gain 50 Fury.\nUsable while Whirlwinding.",
        "hero": "Sonya",
        "id": "BarbarianCombatStyleShotofFury"
    },
    {
        "image": "nexus-blades.png",
        "level": "20",
        "name": "Nexus Blades",
        "icon": "storm_btn_d3_wizard_spectralblade.dds",
        "description": "Basic attacks deal 20% more damage and slow the target for 1 second.",
        "hero": "Zeratul",
        "id": "GenericTalentNexusBlades"
    },
    {
        "image": "amplified-healing.png",
        "level": "4",
        "name": "Amplified Healing",
        "icon": "storm_ui_temp_icon_spellprojection.dds",
        "description": "Increases regeneration effects and all healing received by 30%.",
        "hero": "Uther",
        "id": "GenericTalentAmplifiedHealing"
    },
    {
        "image": "its-a-sabotage.png",
        "level": "4",
        "name": "It's a Sabotage!",
        "icon": "storm_ui_icon_lostvikings_selecterik.dds",
        "description": "Erik's Basic Attacks against Structures destroy 5 Ammo and deal 100 (+10 per level) damage over 10 seconds.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryItsASabotage"
    },
    {
        "image": "double-bombs.png",
        "level": "16",
        "name": "Double Bombs",
        "icon": "storm_ui_icon_zeratul_singularityspike.dds",
        "cooldown": 12,
        "description": "After you cast Singularity Spike, you can cast a second one for free within 3 seconds for 50% normal damage.",
        "hero": "Zeratul",
        "id": "ZeratulMasteryDoubleBombsSingularitySpike"
    },
    {
        "image": "aerie-gusts.png",
        "level": "16",
        "name": "Aerie Gusts",
        "icon": "storm_temp_war3_btncyclone.dds",
        "description": "Reduce activation time for Tailwind to 2 seconds, and increase the Movement Speed bonus to 30%.",
        "hero": "Falstad",
        "id": "FalstadMasteryAerieGustsTailwind"
    },
    {
        "image": "frostwolfs-grace.png",
        "level": "7",
        "name": "Frostwolf's Grace",
        "icon": "storm_ui_icon_thrall_frostwolfresilience.dds",
        "cooldown": 30,
        "description": "Frostwolf Resilience can be activated to immediately heal you.",
        "hero": "Thrall",
        "id": "ThrallMasteryFrostwolfsGrace"
    },
    {
        "image": "demonic-smite.png",
        "level": "16",
        "name": "Demonic Smite",
        "icon": "storm_temp_war3_btnfelguard.dds",
        "cooldown": 30,
        "description": "Demon Lieutenants will periodically blast enemy Minions with demonic energy, dealing 500 (+20 per level) damage.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryDemonicSmite"
    },
    {
        "image": "hunka-burning-olaf.png",
        "level": "13",
        "name": "Hunka' Burning Olaf",
        "icon": "storm_ui_icon_lostvikings_selectolaf.dds",
        "description": "Olaf deals 15 (+3 per level) damage every second to nearby enemies.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryHunkaBurningOlaf"
    },
    {
        "image": "cold-embrace.png",
        "level": "16",
        "name": "Cold Embrace",
        "icon": "storm_ui_icon_sylvanas_shadowdagger.dds",
        "cooldown": 10,
        "description": "Shadow Dagger makes enemies Vulnerable, taking 25% more damage, but the range of Shadow Dagger is reduced by 25%.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentColdEmbrace"
    },
    {
        "image": "gathering-radiance.png",
        "level": "16",
        "name": "Gathering Radiance",
        "icon": "storm_ui_icon_holyradiance.dds",
        "cooldown": 12,
        "description": "Increases damage by 10% for each enemy hit, up to 100%.",
        "hero": "Uther",
        "id": "UtherMasteryGatheringRadiance"
    },
    {
        "image": "ventral-sacs.png",
        "level": "7",
        "name": "Ventral Sacs",
        "icon": "storm_ui_icon_zagara_infesteddrop.dds",
        "cooldown": 12,
        "description": "Infested Drop spawns 3 Roachlings.",
        "hero": "Zagara",
        "id": "ZagaraMasteryVentralSacs"
    },
    {
        "image": "roar.png",
        "level": "4",
        "name": "Roar",
        "icon": "storm_ui_icon_johanna_punish.dds",
        "cooldown": 8,
        "description": "Increases Punish damage by 50%.",
        "hero": "Johanna",
        "id": "CrusaderMasteryPunishRoar"
    },
    {
        "image": "bestial-wrath.png",
        "level": "10",
        "name": "Bestial Wrath",
        "icon": "storm_ui_icon_rexxar_bestialwrath.dds",
        "cooldown": 50,
        "description": "Increases Misha's Basic Attack damage by 150% for 12 seconds.",
        "hero": "Rexxar",
        "id": "RexxarHeroicAbilityBestialWrath"
    },
    {
        "image": "spirit-bond.png",
        "level": "20",
        "name": "Spirit Bond",
        "icon": "storm_ui_icon_rexxar_bestialwrath.dds",
        "cooldown": 50,
        "description": "Increases the duration of Bestial Wrath by 50% and Misha's Basic Attacks heal Rexxar for 50% of her damage dealt during Bestial Wrath.",
        "hero": "Rexxar",
        "id": "RexxarSpiritBond"
    },
    {
        "image": "abattoir.png",
        "level": "7",
        "name": "Abattoir",
        "icon": "storm_ui_icon_Butcher_FreshMeat.dds",
        "description": "Increases the maximum number of Fresh Meat to 35, and you only lose half upon death.",
        "hero": "Butcher",
        "id": "ButcherMasteryFreshMeatAbattoir"
    },
    {
        "image": "hammer-on.png",
        "level": "4",
        "name": "Hammer-on",
        "icon": "storm_btn_d3_barbarian_warcry.dds",
        "description": "Rockstar lasts 2 seconds longer, and while Rockstar is active your Abilities cost 10 less Mana.",
        "hero": "E.T.C.",
        "id": "ETCMasteryHammeron"
    },
    {
        "image": "resistant.png",
        "level": "1",
        "name": "Resistant",
        "icon": "storm_ui_icon_sgthammer_siegemode.dds",
        "cooldown": 2,
        "description": "While in Siege Mode, the duration of Silences, Stuns, Slows, and Roots are reduced by 75%.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerResistant"
    },
    {
        "image": "echo-pedal.png",
        "level": "16",
        "name": "Echo Pedal",
        "icon": "storm_btn_d3_monk_mantraofconviction.dds",
        "description": "Using a Basic or Heroic ability releases two pulses of 30 (+5 per level) damage. The first occurs instantly, the second occurs 2 seconds later.",
        "hero": "E.T.C.",
        "id": "ETCCombatStyleEchoPedal"
    },
    {
        "image": "excessive-force.png",
        "level": "4",
        "name": "Excessive Force",
        "icon": "storm_ui_icon_sgthammer_concussiveblast.dds",
        "cooldown": 12,
        "description": "Double the knock back distance.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerMasteryExcessiveForceConcussiveBlast"
    },
    {
        "image": "obliterate.png",
        "level": "7",
        "name": "Obliterate",
        "icon": "storm_temp_war3_btnfrostmourne.dds",
        "cooldown": 12,
        "description": "Frostmourne Hungers also hits enemies near the target for 50% damage.",
        "hero": "Arthas",
        "id": "ArthasMasteryObliterate"
    },
    {
        "image": "ranger.png",
        "level": "16",
        "name": "Ranger",
        "icon": "storm_temp_war3_btnscout.dds",
        "cooldown": 18,
        "description": "Increases width of Sentinel by 100%. Increases damage dealt based on distance traveled, up to a maximum of +200% damage.",
        "hero": "Tyrande",
        "id": "TyrandeMasteryRanger"
    },
    {
        "image": "phase-bulwark.png",
        "level": "13",
        "name": "Phase Bulwark",
        "icon": "storm_ui_icon_artanis_shieldoverload.dds",
        "description": "When Shield Overload activates, you take 50% less damage from Abilities for 3 seconds.",
        "hero": "Artanis",
        "id": "ArtanisShieldOverloadPhaseBulwark"
    },
    {
        "image": "spider-cluster.png",
        "level": "4",
        "name": "Spider Cluster",
        "icon": "storm_btn_d3_witchdoctor_corpsespiders.dds",
        "cooldown": 10,
        "description": "Corpse Spiders creates 3 more spiders over 3 seconds.",
        "hero": "Nazeebo",
        "id": "WitchDoctorMasterySpiderCluster"
    },
    {
        "image": "bouncy-dust.png",
        "level": "16",
        "name": "Bouncy Dust",
        "icon": "storm_temp_war3_btnscatterrockets.dds",
        "cooldown": 10,
        "description": "Pixie Dust bounces to another nearby ally upon impact.",
        "hero": "Brightwing",
        "id": "BrightwingBouncyDustPixieDust"
    },
    {
        "image": "the-hunt.png",
        "level": "10",
        "name": "The Hunt",
        "icon": "storm_ui_icon_tikimask.dds",
        "cooldown": 60,
        "description": "Charge to target unit, dealing 150 (+20 per level) damage on impact and stunning for 1 second.",
        "hero": "Illidan",
        "id": "IllidanHeroicAbilityTheHunt"
    },
    {
        "image": "remorseless.png",
        "level": "7",
        "name": "Remorseless",
        "icon": "storm_btn-extra_int_0.dds",
        "description": "After using an ability, your next Basic Attack within 3 seconds deals 25% additional damage.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentRemorseless"
    },
    {
        "image": "dash.png",
        "level": "1",
        "name": "Dash",
        "icon": "storm_ui_icon_tychus_runandgun.dds",
        "cooldown": 8,
        "description": "Increases the range of Run and Gun by 25%.",
        "hero": "Tychus",
        "id": "TychusMasteryRunandGunDash"
    },
    {
        "image": "snow-crash.png",
        "level": "16",
        "name": "Snow Crash",
        "icon": "storm_ui_icon_jaina_blizzard.dds",
        "cooldown": 15,
        "description": "Increases the number of Blizzard waves from 2 to 3.",
        "hero": "Jaina",
        "id": "JainaMasterySnowCrash"
    },
    {
        "image": "rolling-thunder.png",
        "level": "1",
        "name": "Rolling Thunder",
        "icon": "storm_ui_icon_thrall_chainlightning.dds",
        "cooldown": 6,
        "description": "Increases Chain Lightning's range by 30% and attacking enemies recently hit by Chain Lightning restores 10 Mana.",
        "hero": "Thrall",
        "id": "ThrallMasteryRollingThunder"
    },
    {
        "image": "ragnarok-n-roll.png",
        "level": "20",
        "name": "Ragnarok 'n' Roll!",
        "icon": "storm_ui_icon_lostvikings_longboatraid.dds",
        "description": "The Longboat can attack two targets at once and the range of its Mortar is increased by 100%.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryWereOnABoat"
    },
    {
        "image": "lightning-serpent.png",
        "level": "7",
        "name": "Lightning Serpent",
        "icon": "storm_temp_war3_btnwindserpent.dds",
        "cooldown": 10,
        "description": "Cloud Serpent's attacks bounce to 3 nearby enemy targets, dealing 10 (+1.1 per level) damage each.",
        "hero": "Li Li",
        "id": "LiLiMasteryCloudSerpentLightningSerpent"
    },
    {
        "image": "flare.png",
        "level": "1",
        "name": "Flare",
        "icon": "storm_temp_war3_btnflare.dds",
        "cooldown": 20,
        "description": "Fire a flare at an area, revealing it for 5 seconds.",
        "hero": "Rexxar",
        "id": "RexxarFlare"
    },
    {
        "image": "hardened-focus.png",
        "level": "16",
        "name": "Hardened Focus",
        "icon": "storm_btn_d3_monk_mystically.dds",
        "description": "While above 80% life, your Basic Ability cooldowns regenerate 50% faster.",
        "hero": "Uther",
        "id": "UtherHardenedFocus"
    },
    {
        "image": "living-the-dream.png",
        "level": "4",
        "name": "Living The Dream",
        "icon": "storm_temp_war3_btnmurlocmutant.dds",
        "description": "Passively grants 5% Ability Power. Every 5 seconds Murky is alive he gains 1% more Ability Power, to a maximum of 15% extra. These stacks are lost on death.",
        "hero": "Murky",
        "id": "MurkyLivingtheDream"
    },
    {
        "image": "vampiric-assault.png",
        "level": "4",
        "name": "Vampiric Assault",
        "icon": "storm_temp_war3_btnundeadshrine.dds",
        "description": "Basic Attacks heal for 15% of the damage dealt to the primary target.",
        "hero": "Valla",
        "id": "GenericTalentVampiricAssault"
    },
    {
        "image": "free-roll.png",
        "level": "7",
        "name": "Free Roll",
        "icon": "storm_temp_war3_btnforceofnature.dds",
        "cooldown": 14,
        "description": "Barrel Roll costs no mana.",
        "hero": "Falstad",
        "id": "FalstadMasteryBarrelRollFreeRoll"
    },
    {
        "image": "big-red-button.png",
        "level": "20",
        "name": "Big Red Button",
        "icon": "storm_ui_icon_tychus_commandeerodin.dds",
        "description": "Odin lasts 50% longer and Ragnarok Missiles also launches a Nuclear Missile.",
        "hero": "Tychus",
        "id": "TychusMasteryOdinBigRedButton"
    },
    {
        "image": "deafening-blast.png",
        "level": "20",
        "name": "Deafening Blast",
        "icon": "storm_ui_icon_sylvanas_wailingarrow.dds",
        "cooldown": 90,
        "description": "Enemies at the center of Wailing Arrow's explosion take 50% more damage and are silenced for twice as long.",
        "hero": "Sylvanas",
        "id": "SylvanasWailingArrowDeafeningBlast"
    },
    {
        "image": "leap.png",
        "level": "10",
        "name": "Leap",
        "icon": "storm_ui_icon_sonya_leap.dds",
        "cooldown": 70,
        "description": "Leap into the air, dealing 50 (+11 per level) damage to nearby enemies, and stunning them for 1.5 seconds.",
        "hero": "Sonya",
        "id": "BarbarianHeroicAbilityLeap"
    },
    {
        "image": "ferocious-healing.png",
        "level": "7",
        "name": "Ferocious Healing",
        "icon": "storm_ui_temp_icon_mightyhealth.dds",
        "cooldown": 10,
        "description": "Consume 20 Fury to heal 10.15% of your maximum Health.\nUsable while Whirlwinding.",
        "hero": "Sonya",
        "id": "BarbarianCombatStyleFerociousHealing"
    },
    {
        "image": "summon-water-elemental.png",
        "level": "10",
        "name": "Summon Water Elemental",
        "icon": "storm_ui_icon_jaina_summonwaterelemental.dds",
        "cooldown": 80,
        "description": "Summons a Water Elemental at target location. The Water Elemental's Basic Attacks do 50 (+6 per level) damage, splash for 25% damage and Chill. Can reactivate the Ability to retarget the Water Elemental.  Lasts 20 seconds.",
        "hero": "Jaina",
        "id": "JainaHeroicAbilityWaterElemental"
    },
    {
        "image": "sticky-flare.png",
        "level": "13",
        "name": "Sticky Flare",
        "icon": "storm_temp_war3_btnmanaflare.dds",
        "cooldown": 8,
        "description": "Targets are slowed by 40% Movement Speed for 2 seconds.",
        "hero": "Brightwing",
        "id": "FaerieDragonMasteryStickyFlare"
    },
    {
        "image": "backdraft.png",
        "level": "16",
        "name": "Backdraft",
        "icon": "storm_ui_icon_kaelthas_livingbomb.dds",
        "cooldown": 10,
        "description": "Living Bomb's explosion slows enemies Movement Speed by 50% for 2 seconds.",
        "hero": "Kael'thas",
        "id": "KaelthasLivingBombBackdraft"
    },
    {
        "image": "transcendence.png",
        "level": "1",
        "name": "Transcendence",
        "icon": "storm_ui_icon_monk_trait_transcendence.dds",
        "description": "Every 3rd Basic Attack heals the lowest nearby allied Hero for 40 (+6 per level).",
        "hero": "Kharazim",
        "id": "MonkTranscendence"
    },
    {
        "image": "wave-of-light.png",
        "level": "7",
        "name": "Wave of Light",
        "icon": "storm_ui_icon_holyradiance.dds",
        "cooldown": 12,
        "description": "Each Hero healed by Holy Radiance returns 10 Mana and reduces the cooldown by 1 second, up to a maximum of 50 Mana and 5 seconds.",
        "hero": "Uther",
        "id": "UtherMasteryWaveofLightHolyRadiance"
    },
    {
        "image": "speed-metal.png",
        "level": "16",
        "name": "Speed Metal",
        "icon": "storm_btn_d3_barbarian_warcry.dds",
        "description": "Rockstar also gives 20% Movement Speed for 2 seconds.",
        "hero": "E.T.C.",
        "id": "ETCMasterySpeedMetal"
    },
    {
        "image": "chain-bomb.png",
        "level": "13",
        "name": "Chain Bomb",
        "icon": "storm_ui_icon_kaelthas_livingbomb.dds",
        "cooldown": 10,
        "description": "Living Bomb's explosion applies Living Bomb to the 3 closest enemies not already affected by it.  Prefers Heroes.",
        "hero": "Kael'thas",
        "id": "KaelthasLivingBombChainBomb"
    },
    {
        "image": "forked-lightning.png",
        "level": "16",
        "name": "Forked Lightning",
        "icon": "storm_ui_icon_thrall_chainlightning.dds",
        "cooldown": 6,
        "description": "Allows Chain Lightning to hold 2 charges that can be used in quick succession.",
        "hero": "Thrall",
        "id": "ThrallMasteryForkedLightning"
    },
    {
        "image": "embrace-death.png",
        "level": "16",
        "name": "Embrace Death",
        "icon": "storm_temp_war3_btndeathcoil.dds",
        "cooldown": 9,
        "description": "Death Coil deals 20% more damage for each 10% of life you are missing.",
        "hero": "Arthas",
        "id": "ArthasMasteryEmbraceDeath"
    },
    {
        "image": "soul-catcher.png",
        "level": "4",
        "name": "Soul Catcher",
        "icon": "storm_temp_war3_btnsoulgem.dds",
        "description": "Black Soulstone passively generates a Soul every 4 seconds.",
        "hero": "Diablo",
        "id": "DiabloTalentSoulCatcherBlackSoulstone"
    },
    {
        "image": "vampiric-strike.png",
        "level": "4",
        "name": "Vampiric Strike",
        "icon": "storm_temp_war3_btnvampiricaura.dds",
        "description": "Basic Attacks heal for 25% of the damage dealt to the primary target.",
        "hero": "Zeratul",
        "id": "GenericVampiricStrikePassive"
    },
    {
        "image": "chrono-surge.png",
        "level": "4",
        "name": "Chrono Surge",
        "icon": "storm_ui_icon_artanis_repositionmatrix.dds",
        "cooldown": 14,
        "description": "Hitting an enemy Hero with Phase Prism grants 25% bonus Attack Speed for 4 seconds.",
        "hero": "Artanis",
        "id": "ArtanisPhasePrismChronoSurge"
    },
    {
        "image": "blade-of-justice.png",
        "level": "16",
        "name": "Blade of Justice",
        "icon": "storm_ui_icon_tyrael_eldruinsmight_a.dds",
        "cooldown": 12,
        "description": "After teleporting using El'Druin's Might, your next 3 Basic Attacks within 5 seconds deal 75% more damage.",
        "hero": "Tyrael",
        "id": "TyraelMasteryElDruinsMightBladeOfJustice"
    },
    {
        "image": "clean-kill.png",
        "level": "4",
        "name": "Clean Kill",
        "icon": "storm_ui_icon_kerrigan_ravage.dds",
        "cooldown": 8,
        "description": "If Ravage kills the target, it restores 100% of its Mana cost and increases the damage of your next Ravage by 20%.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryRavageCleanKill"
    },
    {
        "image": "spatial-efficiency.png",
        "level": "13",
        "name": "Spatial Efficiency",
        "icon": "storm_ui_icon_abathur_stab.dds",
        "cooldown": 3,
        "description": "Symbiote's Stab gains 1 additional charge.",
        "hero": "Abathur",
        "id": "AbathurMasterySpatialEfficiency"
    },
    {
        "image": "energizing-grasp.png",
        "level": "1",
        "name": "Energizing Grasp",
        "icon": "storm_ui_icon_kerrigan_primalgrasp.dds",
        "cooldown": 10,
        "description": "Primal Grasp refunds 10 Mana for each enemy hit, up to 60.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryPrimalGraspEnergizingGrasp"
    },
    {
        "image": "unbound.png",
        "level": "13",
        "name": "Unbound",
        "icon": "storm_temp_war3_btnshadowstrike.dds",
        "cooldown": 8,
        "description": "Ignore all collision while using Sweeping Strike, allowing you to go over walls and terrain.",
        "hero": "Illidan",
        "id": "IllidanMasteryUnboundSweepingStrike"
    },
    {
        "image": "trail-of-frost.png",
        "level": "13",
        "name": "Trail of Frost",
        "icon": "storm_ui_icon_howlingblast.dds",
        "cooldown": 12,
        "description": "Howling Blast impacts enemies while traveling.",
        "hero": "Arthas",
        "id": "ArthasMasteryPathofFrost"
    },
    {
        "image": "dead-rush.png",
        "level": "13",
        "name": "Dead Rush",
        "icon": "storm_btn_d3_witchdoctor_wallofzombies.dds",
        "cooldown": 14,
        "description": "Wall of Zombies deals 50% more damage.  When it expires up to 5 remaining Zombies uproot and attack nearby enemies for 3 seconds.",
        "hero": "Nazeebo",
        "id": "WitchDoctorMasteryDeadRush"
    },
    {
        "image": "paralysis.png",
        "level": "4",
        "name": "Paralysis",
        "icon": "storm_ui_icon_sylvanas_blackarrows.dds",
        "description": "Increases duration of Black Arrows by 100%",
        "hero": "Sylvanas",
        "id": "SylvanasTalentBlackArrowsParalysis"
    },
    {
        "image": "metamorphosis.png",
        "level": "10",
        "name": "Metamorphosis",
        "icon": "storm_ui_icon_deathpact.dds",
        "cooldown": 120,
        "description": "Transform into Demon Form at the target location, dealing 20 (+4 per level) damage in the area. Gain 100 (+15 per level) temporary max Health for each Hero hit and 20% increased Attack Speed. Lasts for 18 seconds.",
        "hero": "Illidan",
        "id": "IllidanHeroicAbilityMetamorphosis"
    },
    {
        "image": "wind-shear.png",
        "level": "7",
        "name": "Wind Shear",
        "icon": "storm_ui_icon_thrall_windfury.dds",
        "cooldown": 12,
        "description": "Reduces the cooldown of Windfury by 4 seconds.",
        "hero": "Thrall",
        "id": "ThrallMasteryWindShear"
    },
    {
        "image": "radiating-faith.png",
        "level": "20",
        "name": "Radiating Faith",
        "icon": "storm_ui_icon_johanna_blessed_shield.dds",
        "cooldown": 60,
        "description": "Increases Blessed Shield's stun duration by 33% and maximum enemies hit by 2.",
        "hero": "Johanna",
        "id": "CrusaderMasteryBlessedShieldRadiatingFaith"
    },
    {
        "image": "elusive-feet.png",
        "level": "13",
        "name": "Elusive Feet",
        "icon": "storm_ui_temp_icon_sprint.dds",
        "description": "When Fast Feet is triggered, gain 2 charges of Block (50% reduced Basic Attack damage) for 10 seconds. Can only trigger once every 10 seconds.",
        "hero": "Li Li",
        "id": "LiLiMasteryFastFeetElusiveFeet"
    },
    {
        "image": "storm-front.png",
        "level": "13",
        "name": "Storm Front",
        "icon": "storm_ui_icon_jaina_blizzard.dds",
        "cooldown": 15,
        "description": "Increases the cast range of Blizzard by 100%.",
        "hero": "Jaina",
        "id": "JainaMasteryStormFront"
    },
    {
        "image": "feign-death.png",
        "level": "16",
        "name": "Feign Death",
        "icon": "storm_temp_war3_btnsacrificialskull.dds",
        "cooldown": 35,
        "description": "Fake your death, becoming Invulnerable and untargetable for 5 seconds. During this time you control Misha.",
        "hero": "Rexxar",
        "id": "RexxarFeignDeath"
    },
    {
        "image": "even-in-death.png",
        "level": "4",
        "name": "Even In Death",
        "icon": "storm_ui_icon_tyrael_archangelswrath.dds",
        "description": "Non-Heroic abilities can be used before exploding, but deal no damage.",
        "hero": "Tyrael",
        "id": "TyraelMasteryEvenInDeath"
    },
    {
        "image": "turret-storage.png",
        "level": "13",
        "name": "Turret Storage",
        "icon": "storm_ui_icon_robogoblin.dds",
        "cooldown": 15,
        "description": "Max Turret charges increased to 3.",
        "hero": "Gazlowe",
        "id": "TinkerMasteryTurretStorage"
    },
    {
        "image": "couples-therapy.png",
        "level": "13",
        "name": "Couples Therapy",
        "icon": "storm_ui_icon_medic_healingbeam_b.dds",
        "cooldown": 0.5,
        "description": "While channeling Healing Beam you are healed for 25% of the healing amount at the cost of an additional 4 Mana per second.",
        "hero": "Lt. Morales",
        "id": "MedicCouplesTherapy"
    },
    {
        "image": "baleog-the-fierce.png",
        "level": "7",
        "name": "Baleog the Fierce",
        "icon": "storm_ui_icon_lostvikings_selectbaleog.dds",
        "description": "Baleog's Basic Attacks increase his Attack Speed by 8%, stacking up to 5 times. After 3 seconds of not attacking, these stacks will rapidly decay.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryBaleogTheFierce"
    },
    {
        "image": "psi-infusion.png",
        "level": "1",
        "name": "Psi-Infusion",
        "icon": "storm_ui_icon_tassadar_psionicstorm.dds",
        "cooldown": 8,
        "description": "Psionic Storm returns 5 Mana for each target initally hit.",
        "hero": "Tassadar",
        "id": "TassadarPsionicStormPsiInfusion"
    },
    {
        "image": "furious-blow.png",
        "level": "16",
        "name": "Furious Blow",
        "icon": "storm_ui_icon_sonya_seismicslam.dds",
        "cooldown": 1,
        "description": "Increases Seismic Slam damage by 40%, but costs 35 Fury.",
        "hero": "Sonya",
        "id": "BarbarianMasteryFuriousBlowSeismicSlam"
    },
    {
        "image": "taste-for-blood.png",
        "level": "1",
        "name": "Taste for Blood",
        "icon": "storm_temp_war3_btnorboffire.dds",
        "cooldown": 10,
        "description": "Enemies killed by Globe of Annihilation's impact permanently increase its damage by 2 up to a maximum of 500.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryTasteForBlood"
    },
    {
        "image": "fel-infusion.png",
        "level": "1",
        "name": "Fel Infusion",
        "icon": "storm_ui_icon_kaelthas_verdantspheres.dds",
        "cooldown": 6,
        "description": "Heal for 26 (+9 per level) Health when you activate Verdant Spheres.",
        "hero": "Kael'thas",
        "id": "KaelthasVerdantSpheresFelInfusion"
    },
    {
        "image": "pulverize.png",
        "level": "16",
        "name": "Pulverize",
        "icon": "storm_ui_icon_stitches_slam.dds",
        "cooldown": 8,
        "description": "Decreases Slam's cooldown by 2 seconds and it also slows enemies by 75% for 1 second.",
        "hero": "Stitches",
        "id": "StitchesMasteryPulverizeSlam"
    },
    {
        "image": "thunderstrikes.png",
        "level": "13",
        "name": "Thunderstrikes",
        "icon": "storm_temp_war3_btnchainlightning.dds",
        "cooldown": 15,
        "description": "Lightning Rod deals 15% more damage each subsequent strike.",
        "hero": "Falstad",
        "id": "FalstadMasteryLightningRodThunderstrikes"
    },
    {
        "image": "transfusion.png",
        "level": "20",
        "name": "Transfusion",
        "icon": "storm_ui_icon_medic_stim.dds",
        "cooldown": 90,
        "description": "Increases the duration of Stim Drone by 2 seconds.  You also gain the effect of Stim Drone when cast on an ally.",
        "hero": "Lt. Morales",
        "id": "MedicTransfusionStimDrone"
    },
    {
        "image": "mass-vortex.png",
        "level": "4",
        "name": "Mass Vortex",
        "icon": "storm_temp_war3_btndeathanddecay.dds",
        "cooldown": 10,
        "description": "Increases the number of enemies hit by Blinding Wind from 2 to 4.",
        "hero": "Li Li",
        "id": "LiLiMasteryBlindingWindMassVortex"
    },
    {
        "image": "devils-due.png",
        "level": "1",
        "name": "Devil's Due",
        "icon": "storm_temp_war3_btnsoulgem.dds",
        "description": "Reduces Black Soulstone's resurrection cost to 60 Souls.",
        "hero": "Diablo",
        "id": "DiabloMasteryDevilsDueBlackSoulstone"
    },
    {
        "image": "continuous-overpower.png",
        "level": "16",
        "name": "Continuous Overpower",
        "icon": "storm_temp_war3_btngrabtree.dds",
        "cooldown": 12,
        "description": "Overpower can store 2 charges.",
        "hero": "Diablo",
        "id": "DiabloMasteryContinuousOverpower"
    },
    {
        "image": "stage-dive.png",
        "level": "10",
        "name": "Stage Dive",
        "icon": "storm_ui_icon_dwarftoss.dds",
        "cooldown": 75,
        "description": "Leap to any location. Deals 100 (+12 per level) damage to enemies in the area, slowing them for 3 seconds.",
        "hero": "E.T.C.",
        "id": "ETCHeroicAbilityStageDive"
    },
    {
        "image": "beetle-juiced.png",
        "level": "16",
        "name": "Beetle, Juiced",
        "icon": "storm_btn-ability_anubarak-carrionbeetles.dds",
        "description": "If a Beetle kills an enemy Minion, captured Mercenary, or Hero its duration is refreshed, becomes fully healed, and gains 100% bonus Health and damage.  This effect can only occur once per Beetle.",
        "hero": "Anub'arak",
        "id": "AnubarakMasteryBeetleJuiceBeetleSpit"
    },
    {
        "image": "bolder-flavor.png",
        "level": "16",
        "name": "Bolder Flavor",
        "icon": "storm_temp_war3_btnstrongdrink.dds",
        "cooldown": 5,
        "description": "Increase Shield generation rate and maximum amount from Fortifying Brew by 40%.",
        "hero": "Chen",
        "id": "ChenMasteryFortifyingBrewBolderFlavor"
    },
    {
        "image": "give-em-the-axe.png",
        "level": "16",
        "name": "Give 'em the Axe!",
        "icon": "storm_temp_war3_btncleavingattack.dds",
        "description": "Basic Attacks deal 75% more damage against slowed, rooted, or stunned targets.",
        "hero": "Muradin",
        "id": "MuradinTalentExecutioner75"
    },
    {
        "image": "gravity-throw.png",
        "level": "13",
        "name": "Gravity Throw",
        "icon": "storm_ui_icon_kaelthas_gravitylapse.dds",
        "cooldown": 13,
        "description": "Increases the duration of Gravity Lapse's stun by 33% and causes it to instantly destroy Minions.",
        "hero": "Kael'thas",
        "id": "KaelthasGravityLapseGravityThrow"
    },
    {
        "image": "soothing-breeze.png",
        "level": "16",
        "name": "Soothing Breeze",
        "icon": "storm_ui_icon_monk_breath0fheaven.dds",
        "cooldown": 8,
        "description": "Breath of Heaven removes silences, blinds, slows and roots.",
        "hero": "Kharazim",
        "id": "MonkSoothingBreezeBreathofHeaven"
    },
    {
        "image": "lingering-essence.png",
        "level": "13",
        "name": "Lingering Essence",
        "icon": "storm_ui_icon_kerrigan_assimilation.dds",
        "description": "Increases Assimilation Shield's duration to 20 seconds.",
        "hero": "Kerrigan",
        "id": "KerriganCombatStyleLingeringEssence"
    },
    {
        "image": "death-metal.png",
        "level": "20",
        "name": "Death Metal",
        "icon": "storm_temp_war3_btnbattleroar.dds",
        "description": "Upon dying, a ghost uses Mosh Pit at your location.",
        "hero": "E.T.C.",
        "id": "L90ETCMasteryDeathMetal"
    },
    {
        "image": "laws-of-hope.png",
        "level": "4",
        "name": "Laws of Hope",
        "icon": "storm_btn_d3ros_crusader_lawsofhope.dds",
        "cooldown": 60,
        "description": "Regenerating 1 (+1 per level) Health per second.\nActivate to heal 20% of your max Health over 4 seconds.",
        "hero": "Johanna",
        "id": "CrusaderMasteryLawsOfHope"
    },
    {
        "image": "fishing-hook.png",
        "level": "16",
        "name": "Fishing Hook",
        "icon": "storm_ui_icon_stitches_hook.dds",
        "cooldown": 16,
        "description": "Hook has an additional 40% range.",
        "hero": "Stitches",
        "id": "StitchesMasteryFishingHook"
    },
    {
        "image": "double-wyrmhole.png",
        "level": "20",
        "name": "Double Wyrmhole",
        "icon": "storm_temp_war3_btnphaseshift.dds",
        "cooldown": 10,
        "description": "Blink Heal can be cast a second time on a different target within 2 seconds without consuming a charge.",
        "hero": "Brightwing",
        "id": "BrightwingDoubleWyrmholeBlinkHeal"
    },
    {
        "image": "harmony.png",
        "level": "1",
        "name": "Harmony",
        "icon": "storm_btn-ability_malfurion-regrowth.dds",
        "cooldown": 7,
        "description": "If Moonfire hits a target, reduce the Mana cost of Regrowth by 10.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryHarmony"
    },
    {
        "image": "graduating-range.png",
        "level": "16",
        "name": "Graduating Range",
        "icon": "storm_ui_icon_sgthammer_siegemode.dds",
        "cooldown": 2,
        "description": "While in Siege Mode your standard Basic Attack range increases by 20% every 3 seconds, up to 100%.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerGraduatingRange"
    },
    {
        "image": "bribe.png",
        "level": "1",
        "name": "Bribe",
        "icon": "storm_temp_btn-tips-credit.dds",
        "cooldown": 0.25,
        "description": "Kill enemy Minions or captured Mercenaries to gain stacks of Bribe.  Use 20 stacks to bribe target Mercenary, instantly defeating them.  Does not work on Bosses.  Maximum stacks available: 50.\nCurrent number of Bribe stacks: 0",
        "hero": "Nazeebo",
        "id": "GenericTalentBribe"
    },
    {
        "image": "baneling-massacre.png",
        "level": "16",
        "name": "Baneling Massacre",
        "icon": "storm_ui_icon_zagara_banelingbarrage.dds",
        "cooldown": 10,
        "description": "Now spawns 8 Banelings.",
        "hero": "Zagara",
        "id": "ZagaraMasteryBanelingMassacre"
    },
    {
        "image": "greater-polymorph.png",
        "level": "16",
        "name": "Greater Polymorph",
        "icon": "storm_temp_war3_btnpolymorph.dds",
        "cooldown": 15,
        "description": "Increases the duration of Polymorph by 1 second.",
        "hero": "Brightwing",
        "id": "BrightwingGreaterPolymorphPolymorph"
    },
    {
        "image": "sundering.png",
        "level": "10",
        "name": "Sundering",
        "icon": "storm_ui_icon_thrall_sundering.dds",
        "cooldown": 70,
        "description": "After a short delay, sunder the earth in a long line, dealing 160 (+22 per level) damage and shoving enemies to the side, stunning them for 1.5 seconds.",
        "hero": "Thrall",
        "id": "ThrallHeroicAbilitySundering"
    },
    {
        "image": "from-the-shadows.png",
        "level": "7",
        "name": "From the Shadows",
        "icon": "storm_temp_war3_btnghoulfrenzy.dds",
        "cooldown": 12,
        "description": "Enemies knocked against unpathable locations are stunned for an additional 0.5 seconds.",
        "hero": "Diablo",
        "id": "DiabloMasteryFromTheShadowsShadowCharge"
    },
    {
        "image": "slime-advantage.png",
        "level": "7",
        "name": "Slime Advantage",
        "icon": "storm_temp_war3_btncorrosivebreath.dds",
        "cooldown": 4,
        "description": "Your Basic Attacks deal 100% bonus damage to Slimed targets.",
        "hero": "Murky",
        "id": "MurkyMasterySlimeAdvantage"
    },
    {
        "image": "mark-of-mending.png",
        "level": "16",
        "name": "Mark of Mending",
        "icon": "storm_temp_war3_btnmarksmanship.dds",
        "cooldown": 20,
        "description": "Basic Attacks against Marked targets heal for 2.5% maximum Health.",
        "hero": "Tyrande",
        "id": "TyrandeCombatStyleMarkOfMending"
    },
    {
        "image": "willing-vessel.png",
        "level": "4",
        "name": "Willing Vessel",
        "icon": "storm_ui_icon_leoric_DrainHope.dds",
        "cooldown": 12,
        "description": "Increases the healing from Drain Hope to 30% of your maximum Health and Drain Essence to 15% of your maximum Health.",
        "hero": "Leoric",
        "id": "LeoricMasteryWillingVesselDrainHope"
    },
    {
        "image": "quarterback.png",
        "level": "7",
        "name": "Quarterback",
        "icon": "storm_ui_icon_tychus_fraggrenade.dds",
        "cooldown": 10,
        "description": "Increases the range of Frag Grenade by 50%.",
        "hero": "Tychus",
        "id": "TychusMasteryQuarterback"
    },
    {
        "image": "echo-of-heaven.png",
        "level": "7",
        "name": "Echo of Heaven",
        "icon": "storm_ui_icon_monk_breath0fheaven.dds",
        "cooldown": 8,
        "description": "Breath of Heaven heals a second time 2 seconds later for 50%.",
        "hero": "Kharazim",
        "id": "MonkEchoofHeavenBreathofHeaven"
    },
    {
        "image": "holy-arena.png",
        "level": "20",
        "name": "Holy Arena",
        "icon": "storm_ui_icon_tyrael_sanctification.dds",
        "cooldown": 70,
        "description": "Increases duration of Sanctification by 1 second and increases the damage of allies by 25%.",
        "hero": "Tyrael",
        "id": "TyraelMasterySanctificationHolyArena"
    },
    {
        "image": "stone-wolves.png",
        "level": "7",
        "name": "Stone Wolves",
        "icon": "storm_ui_icon_thrall_feralspirit.dds",
        "cooldown": 12,
        "description": "Increases the duration of Feral Spirit's root from 1 second to 1.5 seconds.",
        "hero": "Thrall",
        "id": "ThrallMasteryStoneWolves"
    },
    {
        "image": "static-shield.png",
        "level": "13",
        "name": "Static Shield",
        "icon": "storm_temp_war3_btnchainlightning.dds",
        "cooldown": 15,
        "description": "Gain a Shield equal to 5% of your maximum Health after every Lightning Rod strike. Lasts 4 seconds and stacks.",
        "hero": "Falstad",
        "id": "FalstadMasteryLightningRodStaticShield"
    },
    {
        "image": "cryptweave.png",
        "level": "20",
        "name": "Cryptweave",
        "icon": "storm_temp_war3_btnweb.dds",
        "cooldown": 60,
        "description": "Gain the ability to channel on Cocoon victims for 4 seconds to increase the duration by 4 seconds.  Usable once per Cocoon.",
        "hero": "Anub'arak",
        "id": "AnubarakCryptweaveCocoon"
    },
    {
        "image": "upgraded-ballistics.png",
        "level": "4",
        "name": "Upgraded Ballistics",
        "icon": "storm_ui_icon_medic_displacementgrenade.dds",
        "cooldown": 12,
        "description": "Displacement Grenade travels 50% faster and enemies directly impacted take 33% more damage.",
        "hero": "Lt. Morales",
        "id": "MedicUpgradedBallistics"
    },
    {
        "image": "essence-for-essence.png",
        "level": "16",
        "name": "Essence for Essence",
        "icon": "storm_temp_war3_btndaggerofescape.dds",
        "cooldown": 60,
        "description": "Activate to deal 10% of target enemy Hero's Max Health and gain Assimilation Shields for twice that amount.",
        "hero": "Kerrigan",
        "id": "KerriganEssenceForEssence"
    },
    {
        "image": "furnace-blast.png",
        "level": "10",
        "name": "Furnace Blast",
        "icon": "storm_ui_icon_Butcher_FurnaceBlast.dds",
        "cooldown": 90,
        "description": "After a 3 second delay, fire explodes around you dealing 300 (+35 per level) damage to enemies.\nCan be cast while using Ruthless Onslaught.",
        "hero": "Butcher",
        "id": "ButcherHeroicAbilityButcherFurnaceBlast"
    },
    {
        "image": "worldbreaker.png",
        "level": "20",
        "name": "Worldbreaker",
        "icon": "storm_ui_icon_thrall_sundering.dds",
        "cooldown": 70,
        "description": "Sundering travels indefinitely.",
        "hero": "Thrall",
        "id": "ThrallMasteryWorldbreaker"
    },
    {
        "image": "fast-reload.png",
        "level": "20",
        "name": "Fast Reload",
        "icon": "storm_ui_icon_nova_tripletap.dds",
        "cooldown": 100,
        "description": "Triple Tap's cooldown is reset if it kills an enemy Hero.",
        "hero": "Nova",
        "id": "NovaMasteryFastReload"
    },
    {
        "image": "lunar-shower.png",
        "level": "16",
        "name": "Lunar Shower",
        "icon": "storm_btn-ability_malfurion-moonfire.dds",
        "cooldown": 3,
        "description": "Using Moonfire reduces the cooldown of your next Moonfire by 0.5 seconds, and increases the damage by 15%. Stacks up to 3 times and resets after 6 seconds.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryLunarShower"
    },
    {
        "image": "evolutionary-link.png",
        "level": "20",
        "name": "Evolutionary Link",
        "icon": "storm_ui_icon_abathur_ultimateevolution.dds",
        "cooldown": 50,
        "description": "As long as the Ultimate Evolution is alive, the original target of the clone gains a Shield equal to 20% of their maximum Health.  Refreshes every 5 seconds.",
        "hero": "Abathur",
        "id": "AbathurUltimateEvolutionEvolutionaryLink"
    },
    {
        "image": "flail-axe.png",
        "level": "4",
        "name": "Flail Axe",
        "icon": "storm_ui_icon_Butcher_Hamstring.dds",
        "cooldown": 4,
        "description": "Increases the length of Hamstring by 40%.",
        "hero": "Butcher",
        "id": "ButcherMasteryHamstringFlailAxe"
    },
    {
        "image": "sustained-anomaly.png",
        "level": "4",
        "name": "Sustained Anomaly",
        "icon": "storm_ui_icon_zeratul_singularityspike.dds",
        "cooldown": 12,
        "description": "The Singularity Spike explodes for area damage and slows, regardless if it hits a target or not.",
        "hero": "Zeratul",
        "id": "ZeratulMasterySustainedAnomalySingularitySpike"
    },
    {
        "image": "evolve-monstrosity.png",
        "level": "10",
        "name": "Evolve Monstrosity",
        "icon": "storm_ui_icon_abathur_evolvemonstrosity.dds",
        "cooldown": 90,
        "description": "Turn an allied Minion or Locust into a Monstrosity. When enemy Minions or captured Mercenaries near the Monstrosity die, it gains 5% Health and 5% Basic Attack damage, stacking up to 30 times.  The Monstrosity takes 50% less damage from Minions and Structures.\nUsing Symbiote on the Monstrosity allows you to control it, in addition to Symbiote's normal benefits.",
        "hero": "Abathur",
        "id": "AbathurHeroicAbilityEvolveMonstrosity"
    },
    {
        "image": "rancor.png",
        "level": "1",
        "name": "Rancor",
        "icon": "storm_ui_icon_valla_hatred.dds",
        "description": "Each Hatred stack increases Attack Speed by 1.5%",
        "hero": "Valla",
        "id": "DemonHunterCombatStyleRancor"
    },
    {
        "image": "corpse-feeders.png",
        "level": "1",
        "name": "Corpse Feeders",
        "icon": "storm_ui_icon_zagara_infesteddrop.dds",
        "cooldown": 12,
        "description": "Roachlings take 30% less damage from non-heroic sources.",
        "hero": "Zagara",
        "id": "ZagaraMasteryCorpseFeeders"
    },
    {
        "image": "arsenal.png",
        "level": "4",
        "name": "Arsenal",
        "icon": "storm_ui_icon_valla_multishot.dds",
        "cooldown": 8,
        "description": "Multishot also fires 3 grenades, which deal 35 (+7.5 per level) damage.",
        "hero": "Valla",
        "id": "DemonHunterMasteryArsenal"
    },
    {
        "image": "specialized-toxin.png",
        "level": "16",
        "name": "Specialized Toxin",
        "icon": "storm_temp_war3_btndrain.dds",
        "description": "Increases the damage dealt to Heroes from Voodoo Ritual by 100%.",
        "hero": "Nazeebo",
        "id": "WitchDoctorCombatStyleSpecializedToxin"
    },
    {
        "image": "twilight-archon.png",
        "level": "20",
        "name": "Twilight Archon",
        "icon": "storm_ui_icon_tassadar_archon.dds",
        "cooldown": 100,
        "description": "Increases Archon's initial Shield and Attack Damage by 50%, and increases Basic Attack range in Archon form by 35%.",
        "hero": "Tassadar",
        "id": "TassadarMasteryTwilightArchon"
    },
    {
        "image": "networked-carapace.png",
        "level": "7",
        "name": "Networked Carapace",
        "icon": "storm_ui_icon_abathur_carapace.dds",
        "cooldown": 12,
        "description": "Using Symbiote's Carapace on a Minion or Mercenary also applies Carapace to all nearby allied Minions and Mercenaries.",
        "hero": "Abathur",
        "id": "AbathurSymbioteCarapaceNetworkedCarapace"
    },
    {
        "image": "spectral-leech.png",
        "level": "20",
        "name": "Spectral Leech",
        "icon": "storm_ui_temp_icon_drainessence.dds",
        "description": "Basic Attacks against enemy Heroes deal bonus damage equal to 5% of the Hero's maximum Health and heal you for the same amount.",
        "hero": "Leoric",
        "id": "LeoricMasterySpectralLeech"
    },
    {
        "image": "hinterland-blast.png",
        "level": "10",
        "name": "Hinterland Blast",
        "icon": "storm_temp_btn-ability-protoss-prismaticbeam-color.dds",
        "cooldown": 90,
        "description": "After a short delay, deal 280 (+31 per level) damage to enemies within a long line.",
        "hero": "Falstad",
        "id": "FalstadHeroicAbilityHinterlandBlast"
    },
    {
        "image": "rock-it-turret-xl.png",
        "level": "7",
        "name": "Rock-It! Turret XL",
        "icon": "storm_ui_icon_robogoblin.dds",
        "cooldown": 15,
        "description": "Turrets attack up to 2 additonal targets for 50% damage.",
        "hero": "Gazlowe",
        "id": "TinkerMasteryRockitTurretXL"
    },
    {
        "image": "blessed-hammer.png",
        "level": "16",
        "name": "Blessed Hammer",
        "icon": "storm_ui_icon_johanna_condemn.dds",
        "cooldown": 10,
        "description": "Condemn also creates a hammer that spirals around you, dealing 40 (+2.5 per level) damage to enemies it hits.",
        "hero": "Johanna",
        "id": "CrusaderMasteryCondemnBlessedHammer"
    },
    {
        "image": "ossein-renewal.png",
        "level": "7",
        "name": "Ossein Renewal",
        "icon": "storm_ui_temp_icon_firstaid_2.dds",
        "cooldown": 60,
        "description": "Activate to heal 20% of your maximum life over 6 seconds. Half as effective while Undying.",
        "hero": "Leoric",
        "id": "LeoricMasteryOsseinRenewal"
    },
    {
        "image": "revolution-overdrive.png",
        "level": "7",
        "name": "Revolution Overdrive",
        "icon": "storm_ui_icon_raynor_inspire.dds",
        "cooldown": 10,
        "description": "Gain 10% Movement Speed while affected by Inspire.  Increase this bonus by 5% for each allied Hero nearby when Inspire is cast.",
        "hero": "Raynor",
        "id": "RaynorMasteryInspireRevolutionOverdrive"
    },
    {
        "image": "tyrant-maw.png",
        "level": "20",
        "name": "Tyrant Maw",
        "icon": "storm_ui_icon_zagara_devouringmaw.dds",
        "cooldown": 100,
        "description": "Devouring Maw deals 50% more damage and each Takedown reduces its cooldown by 25 seconds.",
        "hero": "Zagara",
        "id": "ZagaraMasteryTyrantMaw"
    },
    {
        "image": "biting-cold.png",
        "level": "13",
        "name": "Biting Cold",
        "icon": "storm_temp_war3_btnorboffrost.dds",
        "cooldown": 1,
        "description": "Frozen Tempest damage increased by 50%.",
        "hero": "Arthas",
        "id": "ArthasMasteryBitingColdFrozenTempest"
    },
    {
        "image": "shrink-ray.png",
        "level": "13",
        "name": "Shrink Ray",
        "icon": "storm_temp_war3_btnunholyfrenzy.dds",
        "cooldown": 60,
        "description": "Activate to reduce an enemy Hero's damage by 50% and Movement Speed by 50% for 4 seconds.",
        "hero": "Uther",
        "id": "GenericTalentShrinkRay"
    },
    {
        "image": "reflexive-block.png",
        "level": "7",
        "name": "Reflexive Block",
        "icon": "storm_temp_war3_btnevasion.dds",
        "cooldown": 15,
        "description": "Gain 2 charges of Block (50% reduced Basic Attack damage) after Evasion wears off. Lasts 5 seconds.",
        "hero": "Illidan",
        "id": "IllidanMasteryReflexiveBlockEvasion"
    },
    {
        "image": "preventative-care.png",
        "level": "13",
        "name": "Preventative Care",
        "icon": "storm_ui_icon_medic_healingbeam_c.dds",
        "cooldown": 0.5,
        "description": "Basic Attacks against your Healing Beam target reduce the attacker's Attack Speed by 25% for 2.5 seconds.",
        "hero": "Lt. Morales",
        "id": "MedicPreventativeCare"
    },
    {
        "image": "call-of-the-wildhammer.png",
        "level": "20",
        "name": "Call of the Wildhammer",
        "icon": "storm_temp_btn-ability-protoss-prismaticbeam-color.dds",
        "cooldown": 90,
        "description": "Hinterland Blast has double the range and deals 25% more damage.",
        "hero": "Falstad",
        "id": "FalstadMasteryCalloftheWildhammerHinterlandBlast"
    },
    {
        "image": "conjurers-pursuit.png",
        "level": "1",
        "name": "Conjurer's Pursuit",
        "icon": "storm_btn_d3_monk_mantraofevasion.dds",
        "description": "Collecting Regeneration Globes permanently increases Mana Regeneration by 0.1015 per second.",
        "hero": "Uther",
        "id": "GenericTalentConjurersPursuit"
    },
    {
        "image": "templars-zeal.png",
        "level": "4",
        "name": "Templar's Zeal",
        "icon": "storm_ui_icon_artanis_powerstrikes.dds",
        "cooldown": 10,
        "description": "Blade Dash cooldown recharges 75% faster while you are below 50% Health.",
        "hero": "Artanis",
        "id": "ArtanisBladeDashTemplarsZeal"
    },
    {
        "image": "wind-tunnel.png",
        "level": "20",
        "name": "Wind Tunnel",
        "icon": "storm_temp_war3_btngryphonrider.dds",
        "cooldown": 40,
        "description": "Mighty Gust creates a wind tunnel for 4 seconds. Enemies caught in the tunnel will periodically be pushed back.",
        "hero": "Falstad",
        "id": "FalstadMasteryMightyGustWindTunnel"
    },
    {
        "image": "crippling-hammer.png",
        "level": "13",
        "name": "Crippling Hammer",
        "icon": "storm_temp_war3_btnfeedback.dds",
        "cooldown": 10,
        "description": "Increases the Movement Speed Slow of Hammerang to 50%.",
        "hero": "Falstad",
        "id": "FalstadMasteryCripplingHammerHammerang"
    },
    {
        "image": "shield-dust.png",
        "level": "13",
        "name": "Shield Dust",
        "icon": "storm_temp_war3_btnscatterrockets.dds",
        "cooldown": 10,
        "description": "Pixie Dust reduces Ability damage taken by 50%.",
        "hero": "Brightwing",
        "id": "FaerieDragonMasteryShieldDust"
    },
    {
        "image": "precision-barrage.png",
        "level": "20",
        "name": "Precision Barrage",
        "icon": "storm_ui_icon_nova_orbitalstrike.dds",
        "cooldown": 60,
        "description": "Precision Strike holds two charges with a short cooldown.",
        "hero": "Nova",
        "id": "NovaMasteryPrecisionBarrage"
    },
    {
        "image": "mine-field.png",
        "level": "16",
        "name": "Mine Field",
        "icon": "storm_ui_icon_sgthammer_spidermines.dds",
        "cooldown": 14,
        "description": "Increase the number of mines by 2.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerMasteryMineField"
    },
    {
        "image": "dark-ladys-call.png",
        "level": "20",
        "name": "Dark Lady's Call",
        "icon": "storm_ui_icon_sylvanas_possession.dds",
        "cooldown": 12,
        "description": "Increases maximum number of charges by 3, decreases recharge time by 4 seconds, and 5 charges can be used to convert enemy Mercenaries.  Does not work on Bosses.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentDarkLadysCall"
    },
    {
        "image": "colossal-totem.png",
        "level": "1",
        "name": "Colossal Totem",
        "icon": "storm_ui_icon_earthbindtotem.dds",
        "cooldown": 15,
        "description": "Increases the area and range of Earthbind Totem by 50%.",
        "hero": "Rehgar",
        "id": "RehgarMasteryColossalTotem"
    },
    {
        "image": "mercenary-lord.png",
        "level": "4",
        "name": "Mercenary Lord",
        "icon": "storm_temp_war3_btnmassteleport.dds",
        "description": "Non-Boss Mercenaries near your hero deal 50% more damage. Reduces damage taken from Minions and Mercenaries by 50%.",
        "hero": "Stitches",
        "id": "GenericTalentMercenaryLord"
    },
    {
        "image": "sins-exposed.png",
        "level": "7",
        "name": "Sins Exposed",
        "icon": "storm_ui_icon_johanna_shield_glare.dds",
        "cooldown": 12,
        "description": "Shield Glare marks enemies for 4 seconds. The next time any ally damages them, they take 30 (+6 per level) extra damage and the mark is removed.",
        "hero": "Johanna",
        "id": "CrusaderMasteryShieldGlareSinsExposed"
    },
    {
        "image": "pwn-shop-guitar.png",
        "level": "1",
        "name": "Pwn Shop Guitar",
        "icon": "storm_ui_icon_hatestrike.dds",
        "cooldown": 8,
        "description": "Reduces Guitar Solo's Mana cost by 60%.",
        "hero": "E.T.C.",
        "id": "L90ETCMasteryGuitarSoloPwnShopGuitar"
    },
    {
        "image": "peaceful-repose.png",
        "level": "20",
        "name": "Peaceful Repose",
        "icon": "storm_ui_icon_monk_divinepalm.dds",
        "cooldown": 60,
        "description": "Divine Palm's cooldown is set to 5 seconds if the Hero does not die.",
        "hero": "Kharazim",
        "id": "MonkPeacefulReposeDivinePalm"
    },
    {
        "image": "barbed-shot.png",
        "level": "1",
        "name": "Barbed Shot",
        "icon": "storm_ui_icon_sylvanas_witheringfire.dds",
        "cooldown": 2,
        "description": "Withering Fire deals 200% bonus damage to Minions and Mercenaries.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentWitheringFireBarbedShot"
    },
    {
        "image": "chop-meat.png",
        "level": "1",
        "name": "Chop Meat",
        "icon": "storm_ui_icon_Butcher_Hamstring.dds",
        "cooldown": 4,
        "description": "Increases the damage of Hamstring by 50% to non-Heroic targets, and Minions killed shortly after being hit by Hamstring drop 3 stacks of meat.",
        "hero": "Butcher",
        "id": "ButcherMasteryHamstringChopMeat"
    },
    {
        "image": "insight.png",
        "level": "1",
        "name": "Insight",
        "icon": "storm_ui_icon_monk_trait_insight.dds",
        "description": "Every 3rd Basic Attack restores 12 (+0.21 per level) Mana.",
        "hero": "Kharazim",
        "id": "MonkInsight"
    },
    {
        "image": "rending-cleave.png",
        "level": "16",
        "name": "Rending Cleave",
        "icon": "storm_ui_icon_zeratul_cleave.dds",
        "cooldown": 6,
        "description": "Cleave deals an additional 50% damage over 5 seconds.",
        "hero": "Zeratul",
        "id": "ZeratulMasteryRendingCleave"
    },
    {
        "image": "demonic-form.png",
        "level": "20",
        "name": "Demonic Form",
        "icon": "storm_ui_icon_deathpact.dds",
        "cooldown": 120,
        "description": "Permanently remain in Demonic Form. Increases the Attack Speed bonus of Demonic Form to 30% and grants a 50% reduction in the duration of disabling effects. Illidan can mount in this form.",
        "hero": "Illidan",
        "id": "IllidanMasteryDemonicFormMetamorphosis"
    },
    {
        "image": "brood-expansion.png",
        "level": "16",
        "name": "Brood Expansion",
        "icon": "storm_ui_icon_zagara_hunterkiller.dds",
        "cooldown": 14,
        "description": "Can hold up to 2 charges of Hunter Killer.",
        "hero": "Zagara",
        "id": "ZagaraMasteryBroodExpansion"
    },
    {
        "image": "wrath-of-the-berserker.png",
        "level": "10",
        "name": "Wrath of the Berserker",
        "icon": "storm_ui_icon_sonya_wrathoftheberserker.dds",
        "cooldown": 45,
        "description": "Increase damage dealt by 40%. Reduce the duration of silences, stuns, slows, roots, and polymorphs against you by 50%. Lasts 15 seconds, and extends by 1 second for every 10 Fury gained.",
        "hero": "Sonya",
        "id": "BarbarianHeroicAbilityWrathoftheBerserker"
    },
    {
        "image": "pyromaniac.png",
        "level": "13",
        "name": "Pyromaniac",
        "icon": "storm_ui_icon_kaelthas_livingbomb.dds",
        "cooldown": 10,
        "description": "Each time Living Bomb deals periodic damage, your Basic Ability cooldowns are refreshed by 2 seconds.",
        "hero": "Kael'thas",
        "id": "KaelthasLivingBombPyromaniac"
    },
    {
        "image": "extra-tnt.png",
        "level": "1",
        "name": "Extra TNT",
        "icon": "storm_btn_d3_demonhunter_grenades.dds",
        "cooldown": 12,
        "description": "Xplodium Charge damage increased by 10% per target hit, to a max of 100% increased damage.",
        "hero": "Gazlowe",
        "id": "TinkerMasteryExtraTNT"
    },
    {
        "image": "mana-tide.png",
        "level": "4",
        "name": "Mana Tide",
        "icon": "storm_ui_icon_thrall_frostwolfresilience.dds",
        "description": "Frostwolf Resilience also restores 15 Mana.",
        "hero": "Thrall",
        "id": "ThrallMasteryManaTide"
    },
    {
        "image": "solarite-reaper.png",
        "level": "7",
        "name": "Solarite Reaper",
        "icon": "storm_ui_icon_artanis_powerstrikes.dds",
        "cooldown": 10,
        "description": "Increases the damage of the first dash of Blade Dash by 150%.",
        "hero": "Artanis",
        "id": "ArtanisBladeDashSolariteReaper"
    },
    {
        "image": "jug-of-1-000-cups.png",
        "level": "10",
        "name": "Jug of 1,000 Cups",
        "icon": "storm_temp_war3_btnotherbarrel.dds",
        "cooldown": 70,
        "description": "Rapidly tosses brew to the most injured nearby allies, prioritizing Heroes, restoring a total of 480 (+156 per level) Health over 6 seconds.",
        "hero": "Li Li",
        "id": "LiLiHeroicAbilityJugof1000Cups"
    },
    {
        "image": "never-ending-murlocs.png",
        "level": "20",
        "name": "Never-Ending Murlocs",
        "icon": "storm_ui-heroicon_orangemurloc.dds",
        "cooldown": 100,
        "description": "Murlocs from March of the Murlocs travel farther and cling to targets for 2 seconds longer.",
        "hero": "Murky",
        "id": "MurkyMasteryNeverEndingMurlocs"
    },
    {
        "image": "infused-hammer.png",
        "level": "1",
        "name": "Infused Hammer",
        "icon": "storm_ui_icon_stormbolt.dds",
        "cooldown": 10,
        "description": "Refunds 45 Mana for each enemy hit.",
        "hero": "Muradin",
        "id": "MuradinMasteryStormhammerInfusedHammer"
    },
    {
        "image": "holy-ground.png",
        "level": "16",
        "name": "Holy Ground",
        "icon": "storm_ui_icon_tyrael_eldruinsmight_a.dds",
        "cooldown": 12,
        "description": "Create a ring that blocks enemies from entering the area teleported to using El'Druin's Might.",
        "hero": "Tyrael",
        "id": "TyraelMasteryHolyGround"
    },
    {
        "image": "needlespine.png",
        "level": "7",
        "name": "Needlespine",
        "icon": "storm_ui_icon_abathur_stab.dds",
        "cooldown": 3,
        "description": "Increases the damage and range of Symbiote's Stab by 20%.",
        "hero": "Abathur",
        "id": "AbathurMasteryNeedlespine"
    },
    {
        "image": "earthen-shields.png",
        "level": "20",
        "name": "Earthen Shields",
        "icon": "storm_ui_icon_thrall_earthquake.dds",
        "cooldown": 60,
        "description": "You and your allies within the Earthquake area gain a Shield equal to 15% of max Health each pulse. This shield lasts 4 seconds.",
        "hero": "Thrall",
        "id": "ThrallMasteryEarthenShields"
    },
    {
        "image": "demonic-strength.png",
        "level": "4",
        "name": "Demonic Strength",
        "icon": "storm_temp_war3_btngrabtree.dds",
        "cooldown": 12,
        "description": "Once Overpower's stun expires, the target is slowed by 25% for 2 seconds.",
        "hero": "Diablo",
        "id": "DiabloMasteryDemonicStrength"
    },
    {
        "image": "hindering-moonfire.png",
        "level": "16",
        "name": "Hindering Moonfire",
        "icon": "storm_btn-ability_malfurion-moonfire.dds",
        "cooldown": 3,
        "description": "Moonfire slows targets by 25% for 2 seconds.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryHinderingMoonfire"
    },
    {
        "image": "thrill-of-the-hunt.png",
        "level": "13",
        "name": "Thrill of the Hunt",
        "icon": "storm_ui_icon_rexxar_heremishaactive.dds",
        "cooldown": 20,
        "description": "Your Basic Attacks increase both you and Misha's Movement Speed by 25% for 2 seconds.",
        "hero": "Rexxar",
        "id": "RexxarThrilloftheHunt"
    },
    {
        "image": "spiritwalkers-grace.png",
        "level": "1",
        "name": "Spiritwalker's Grace",
        "icon": "storm_ui_icon_chainhealing.dds",
        "cooldown": 9,
        "description": "Reduces Chain Heal's Mana cost from 70 to 45.",
        "hero": "Rehgar",
        "id": "RehgarMasterySpiritwalkersGrace"
    },
    {
        "image": "ice-lance.png",
        "level": "7",
        "name": "Ice Lance",
        "icon": "storm_ui_icon_jaina_frostbolt.dds",
        "cooldown": 4,
        "description": "The cooldown of Frostbolt is reduced by 2 seconds if it impacts a Chilled target.",
        "hero": "Jaina",
        "id": "JainaMasteryIceLance"
    },
    {
        "image": "epicenter.png",
        "level": "16",
        "name": "Epicenter",
        "icon": "storm_temp_btn-ability-protoss-charge-color.dds",
        "cooldown": 16,
        "description": "Increases the impact area and damage of Burrow Charge by 85%.",
        "hero": "Anub'arak",
        "id": "AnubarakMasteryEpicenterBurrowCharge"
    },
    {
        "image": "rapid-incubation.png",
        "level": "7",
        "name": "Rapid Incubation",
        "icon": "storm_temp_btn-ability-zerg-transfusion-color.dds",
        "cooldown": 45,
        "description": "Channel to regenerate up to 25% of your Health and Mana over 3 seconds.",
        "hero": "Zagara",
        "id": "ZagaraMasteryRapidIncubation"
    },
    {
        "image": "cheap-shot.png",
        "level": "4",
        "name": "Cheap Shot",
        "icon": "storm_ui_icon_Butcher_Hamstring.dds",
        "cooldown": 4,
        "description": "Hamstring does 100% more damage to targets affected by a slow, root, or stun.",
        "hero": "Butcher",
        "id": "ButcherMasteryHamstringCheapShot"
    },
    {
        "image": "battle-momentum.png",
        "level": "7",
        "name": "Battle Momentum",
        "icon": "storm_btn_d3_barbarian_rend.dds",
        "description": "Basic Attacks reduce Ability cooldowns by 0.5 seconds.",
        "hero": "Zagara",
        "id": "BattleMomentumZagara"
    },
    {
        "image": "bed-of-barbs.png",
        "level": "7",
        "name": "Bed of Barbs",
        "icon": "storm_btn-ability_anubarak-impale.dds",
        "cooldown": 12,
        "description": "Create a bed of spikes along Impale's path that slows enemy Move Speed by 30% and deals 18 (+2 per level) damage per second.  Spikes persist for 3.5 seconds.",
        "hero": "Anub'arak",
        "id": "AnubarakMasteryBedOfBarbs"
    },
    {
        "image": "circle-of-life.png",
        "level": "16",
        "name": "Circle of Life",
        "icon": "storm_ui_icon_monk_breath0fheaven.dds",
        "cooldown": 8,
        "description": "Increases Breath of Heaven's healing by 10% for each allied Hero in the cast range.",
        "hero": "Kharazim",
        "id": "MonkBreathOfHeavenCircleOfLife"
    },
    {
        "image": "hover-siege-mode.png",
        "level": "16",
        "name": "Hover Siege Mode",
        "icon": "storm_ui_icon_sgthammer_siegemode.dds",
        "cooldown": 2,
        "description": "You can move at 50% Movement Speed in Siege Mode.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerMasteryHoverSiegeMode"
    },
    {
        "image": "envenomed-spikes.png",
        "level": "16",
        "name": "Envenomed Spikes",
        "icon": "storm_ui_icon_abathur_spikeburst.dds",
        "cooldown": 6,
        "description": "Your Symbiote's Spike Burst also slows enemy Movement Speed by 40% for 2 seconds.",
        "hero": "Abathur",
        "id": "AbathurMasteryEnvenomedSpikes"
    },
    {
        "image": "64-kb-marathon.png",
        "level": "16",
        "name": "64 KB Marathon",
        "icon": "storm_ui_icon_epicmount.dds",
        "description": "Gain an additional 40% Movement Speed when activating Go Go Go! that decays over 4 seconds.  Additionally, the Vikings will break out of Roots and Slows.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsGoGoGo64KBMarathon"
    },
    {
        "image": "arcane-intellect.png",
        "level": "4",
        "name": "Arcane Intellect",
        "icon": "storm_temp_war3_btnmagicalsentry.dds",
        "description": "Dealing damage to a Chilled target returns Mana to Jaina. Basic Attacks return 5 Mana and abilities return 25.",
        "hero": "Jaina",
        "id": "JainaMasteryArcaneIntellect"
    },
    {
        "image": "divine-storm.png",
        "level": "10",
        "name": "Divine Storm",
        "icon": "storm_btn_d3_monk_cyclonestrike.dds",
        "cooldown": 80,
        "description": "Deal 50 (+18 per level) damage and stun nearby enemies for 1.5 seconds.",
        "hero": "Uther",
        "id": "UtherHeroicAbilityDivineStorm"
    },
    {
        "image": "long-ranged-turrets.png",
        "level": "16",
        "name": "Long-Ranged Turrets",
        "icon": "storm_ui_icon_robogoblin.dds",
        "cooldown": 15,
        "description": "Turret range increased by 40%.",
        "hero": "Gazlowe",
        "id": "TinkerMasteryLongRangedTurrets"
    },
    {
        "image": "holy-renewal.png",
        "level": "16",
        "name": "Holy Renewal",
        "icon": "storm_ui_icon_johanna_shield_glare.dds",
        "cooldown": 12,
        "description": "Every enemy Hero affected by Shield Glare heals you for 100 (+7.5 per level).",
        "hero": "Johanna",
        "id": "CrusaderMasteryShieldGlareHolyRenewal"
    },
    {
        "image": "crushing-hope.png",
        "level": "13",
        "name": "Crushing Hope",
        "icon": "storm_ui_icon_leoric_DrainHope.dds",
        "cooldown": 12,
        "description": "If Drain Hope lasts its full duration, it deals bonus damage equal to 10% of the victim's Maximum Health. This damage does not heal you.",
        "hero": "Leoric",
        "id": "LeoricMasteryCrushingHopeDrainHope"
    },
    {
        "image": "second-strike.png",
        "level": "16",
        "name": "Second Strike",
        "icon": "storm_ui_icon_tassadar_psionicstorm.dds",
        "cooldown": 8,
        "description": "After casting Psionic Storm, you may cast Psionic Storm again for free within 3 seconds. The damage does not stack.",
        "hero": "Tassadar",
        "id": "TassadarPsionicStormSecondStrike"
    },
    {
        "image": "siphon-the-dead.png",
        "level": "13",
        "name": "Siphon the Dead",
        "icon": "storm_temp_war3_btnsoulgem.dds",
        "cooldown": 30,
        "description": "Activate to heal 15.6% of your maximum Health over 3 seconds.",
        "hero": "Diablo",
        "id": "DiabloMasterySiphonTheDeadBlackSoulstone"
    },
    {
        "image": "infest.png",
        "level": "4",
        "name": "Infest",
        "icon": "storm_temp_btn-upgrade-zerg-enduringcorruption.dds",
        "cooldown": 30,
        "description": "Increases an allied lane Minion's damage against non-Heroic targets by 400% for 30 seconds. Holds up to 2 charges.",
        "hero": "Zagara",
        "id": "ZagaraMasteryInfest"
    },
    {
        "image": "scryer.png",
        "level": "13",
        "name": "Scryer",
        "icon": "storm_ui_icon_tassadar_oracle.dds",
        "cooldown": 40,
        "description": "Oracle duration increased by 3 seconds and grants 20% increased Movement Speed.",
        "hero": "Tassadar",
        "id": "TassadarCombatStyleScryer"
    },
    {
        "image": "hunters-swiftness.png",
        "level": "20",
        "name": "Hunter's Swiftness",
        "icon": "storm_temp_war3_btnshadowmeld.dds",
        "cooldown": 50,
        "description": "When using Shadowstalk, you and allied Heroes gain 40% Movement Speed for 8 seconds.",
        "hero": "Tyrande",
        "id": "TyrandeMasteryShadowstalkHuntersSwiftness"
    },
    {
        "image": "tenacious-roots.png",
        "level": "16",
        "name": "Tenacious Roots",
        "icon": "storm_btn-ability_malfurion-entanglingroots.dds",
        "cooldown": 10,
        "description": "Entangling Roots grows 25% larger, lasts 25% longer, and roots targets for 0.5 seconds longer.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryTenaciousRootsEntanglingRoots"
    },
    {
        "image": "possession.png",
        "level": "10",
        "name": "Possession",
        "icon": "storm_ui_icon_sylvanas_possession.dds",
        "cooldown": 12,
        "description": "Force an enemy Minion to fight for you. It gains 20% Attack Damage. Costs 5 charges to convert a Catapult Minion.",
        "hero": "Sylvanas",
        "id": "SylvanasHeroicAbilityPossession"
    },
    {
        "image": "zealot-charge.png",
        "level": "16",
        "name": "Zealot Charge",
        "icon": "storm_ui_icon_artanis_doubleslash_off.dds",
        "cooldown": 4,
        "description": "While Twin Blades is active, you charge a short distance to your target.",
        "hero": "Artanis",
        "id": "ArtanisTwinBladesZealotCharge"
    },
    {
        "image": "critical-care.png",
        "level": "16",
        "name": "Critical Care",
        "icon": "storm_ui_icon_rexxar_mendpet.dds",
        "cooldown": 10,
        "description": "Increases the healing of Mend Pet by 50% while Misha is under 50% health.",
        "hero": "Rexxar",
        "id": "RexxarCriticalCareMendPet"
    },
    {
        "image": "rampant-growth.png",
        "level": "4",
        "name": "Rampant Growth",
        "icon": "storm_btn-ability_malfurion-regrowth.dds",
        "cooldown": 7,
        "description": "Increases the initial heal of Regrowth by 50%.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryRampantGrowth"
    },
    {
        "image": "lunar-blaze.png",
        "level": "7",
        "name": "Lunar Blaze",
        "icon": "storm_temp_war3_btnmoonstone.dds",
        "cooldown": 12,
        "description": "Increases the range of Lunar Flare by 50%.",
        "hero": "Tyrande",
        "id": "TyrandeMasteryLunarBlaze"
    },
    {
        "image": "foresight.png",
        "level": "4",
        "name": "Foresight",
        "icon": "storm_ui_icon_monk_dash.dds",
        "cooldown": 12,
        "description": "Radiant Dash reveals the area around the target for 3 seconds. Only one area can be revealed at a time.",
        "hero": "Kharazim",
        "id": "MonkForesightRadiantDash"
    },
    {
        "image": "shredder-grenade.png",
        "level": "1",
        "name": "Shredder Grenade",
        "icon": "storm_ui_icon_tychus_fraggrenade.dds",
        "cooldown": 10,
        "description": "Increases the explosion radius of Frag Grenade by 25%.",
        "hero": "Tychus",
        "id": "TychusMasteryShredderGrenade"
    },
    {
        "image": "miniature-black-hole.png",
        "level": "20",
        "name": "Miniature Black Hole",
        "icon": "storm_temp_war3_btnorbofdarkness.dds",
        "cooldown": 110,
        "description": "Grav-O-Bomb radius increased by 25% and damage increased by 50%.",
        "hero": "Gazlowe",
        "id": "TinkerMasteryMiniatureBlackHole"
    },
    {
        "image": "slimy-end.png",
        "level": "16",
        "name": "Slimy End",
        "icon": "storm_temp_war3_btncorrosivebreath.dds",
        "cooldown": 4,
        "description": "Slime is used on death.",
        "hero": "Murky",
        "id": "MurkyMasterySlimyEnd"
    },
    {
        "image": "overwhelming-affliction.png",
        "level": "13",
        "name": "Overwhelming Affliction",
        "icon": "storm_ui_icon_sylvanas_blackarrows.dds",
        "description": "Black Arrows now also applies to Heroes, slowing their Movement Speed by 5% for the duration. Stacks up to 5 times.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentOverwhelmingAffliction"
    },
    {
        "image": "nerves-of-steel.png",
        "level": "16",
        "name": "Nerves of Steel",
        "icon": "storm_temp_war3_btnhardenedskin.dds",
        "cooldown": 60,
        "description": "Activate to gain 30% of your maximum Health as a Shield for 5 seconds.\nUsable while Whirlwinding.",
        "hero": "Sonya",
        "id": "SonyaTalentNervesOfSteel"
    },
    {
        "image": "easy-prey.png",
        "level": "4",
        "name": "Easy Prey",
        "icon": "storm_ui_icon_rexxar_heremishaactive.dds",
        "cooldown": 20,
        "description": "Increases Misha's damage to Minions and Mercenaries by 150%, and reduces the damage Misha takes from Minions and Mercenaries by 50%.",
        "hero": "Rexxar",
        "id": "RexxarSpiritBondEasyPrey"
    },
    {
        "image": "deep-breath.png",
        "level": "4",
        "name": "Deep Breath",
        "icon": "storm_temp_war3_btnbreathoffire.dds",
        "cooldown": 5,
        "description": "Increases Breath of Fire's range and arc by 30% and the Brew cost is reduced by 10.",
        "hero": "Chen",
        "id": "ChenMasteryBreathOfFireDeepBreath"
    },
    {
        "image": "rune-tap.png",
        "level": "7",
        "name": "Rune Tap",
        "icon": "storm_rune_demonica.dds",
        "description": "Every 3rd Basic Attack heals you for 3.12% of your max Health.",
        "hero": "Arthas",
        "id": "ArthasCombatStyleRuneTap"
    },
    {
        "image": "demolitionist.png",
        "level": "1",
        "name": "Demolitionist",
        "icon": "storm_btn_d3_barbarian_cleave.dds",
        "description": "Basic Attacks against Structures destroy 1 ammo and deal an additional 10% damage.",
        "hero": "Zagara",
        "id": "GenericTalentDemolitionist"
    },
    {
        "image": "prescience.png",
        "level": "13",
        "name": "Prescience",
        "icon": "storm_ui_icon_tassadar_dimensionalshift.dds",
        "cooldown": 20,
        "description": "Dimensional Shift will automatically activate when you fall below 15% Health. This effect has a separate 45 second cooldown.",
        "hero": "Tassadar",
        "id": "TassadarMasteryPrescience"
    },
    {
        "image": "full-moonfire.png",
        "level": "13",
        "name": "Full Moonfire",
        "icon": "storm_btn-ability_malfurion-moonfire.dds",
        "cooldown": 3,
        "description": "Increases Moonfire's radius by 60% and reduces its Mana cost by 50%.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryFullMoonfire"
    },
    {
        "image": "friend-or-foe.png",
        "level": "13",
        "name": "Friend or Foe",
        "icon": "storm_btn_d3_barbarian_furiouscharge.dds",
        "cooldown": 6,
        "description": "Can use Dive on allies (but you will not flip). When used this way, the cooldown is reduced by 2 seconds.",
        "hero": "Illidan",
        "id": "IllidanMasteryFriendOrFoeDive"
    },
    {
        "image": "relentless-leader.png",
        "level": "13",
        "name": "Relentless Leader",
        "icon": "storm_temp_btn-tips-counter.dds",
        "description": "Reduces the duration of silences, stuns, slows, and roots against you by 50%. Once every 5 seconds, if you are stunned you knock nearby enemies away.",
        "hero": "Raynor",
        "id": "RaynorRelentlessLeader"
    },
    {
        "image": "blessed-shield.png",
        "level": "10",
        "name": "Blessed Shield",
        "icon": "storm_ui_icon_johanna_blessed_shield.dds",
        "cooldown": 60,
        "description": "Deal 70 (+9 per level) damage and stun the first enemy hit for 1.5 seconds. Blessed Shield then bounces to 2 nearby enemies, dealing 35 (+4.5 per level) damage and stunning them for 0.75 seconds.",
        "hero": "Johanna",
        "id": "CrusaderHeroicAbilityBlessedShield"
    },
    {
        "image": "consume-vitality.png",
        "level": "16",
        "name": "Consume Vitality",
        "icon": "storm_ui_icon_leoric_SkeletalSwing.dds",
        "cooldown": 8,
        "description": "Skeletal Swing heals you for 2% of your maximum Health per target hit, up to 10%. Half as effective while Undying.",
        "hero": "Leoric",
        "id": "LeoricMasteryConsumeVitalitySkeletalSwing"
    },
    {
        "image": "reduce-reuse-recycle.png",
        "level": "4",
        "name": "Reduce, Reuse, Recycle",
        "icon": "storm_temp_war3_btnpillage.dds",
        "description": "Enemy Minions, captured Mercenaries, and Structures that die near you have a 15% chance to drop scrap.",
        "hero": "Gazlowe",
        "id": "TinkerCombatStyleReduceReuseRecycle"
    },
    {
        "image": "rangers-ambush.png",
        "level": "4",
        "name": "Ranger's Ambush",
        "icon": "storm_ui_icon_sylvanas_hauntingwave.dds",
        "cooldown": 11,
        "description": "Using Haunting Wave to teleport refills all charges of Withering Fire.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentRangersAmbush"
    },
    {
        "image": "erik-the-swift.png",
        "level": "4",
        "name": "Erik the Swift",
        "icon": "storm_ui_icon_lostvikings_selecterik.dds",
        "description": "Permanently increases Erik's base Movement Speed by 10%, and as long as Erik is moving he heals 15 (+3 per level) Health per second.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryErikTheSwift"
    },
    {
        "image": "splinter-shot.png",
        "level": "13",
        "name": "Splinter Shot",
        "icon": "storm_ui_icon_sylvanas_witheringfire.dds",
        "cooldown": 2,
        "description": "Withering Fire hits a second target for 18.75 (+2.25 per level) damage.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentSplinterShot"
    },
    {
        "image": "crowd-control.png",
        "level": "4",
        "name": "Crowd Control",
        "icon": "storm_ui_icon_thunderclap.dds",
        "cooldown": 8,
        "description": "Each enemy hit by Thunder Clap reduces its cooldown by 0.75 seconds.",
        "hero": "Muradin",
        "id": "MuradinMasteryThunderclapCrowdControl"
    },
    {
        "image": "double-fake.png",
        "level": "16",
        "name": "Double Fake",
        "icon": "storm_ui_icon_nova_holodecoy.dds",
        "cooldown": 15,
        "description": "Casting Holo Decoy creates an additional Decoy at your current location.",
        "hero": "Nova",
        "id": "NovaMasteryDoubleFakeHoloDecoy"
    },
    {
        "image": "perfect-storm.png",
        "level": "1",
        "name": "Perfect Storm",
        "icon": "storm_ui_icon_stormbolt.dds",
        "cooldown": 10,
        "description": "Storm Bolt's damage is permanently increased by 5 for each enemy Hero hit.",
        "hero": "Muradin",
        "id": "MuradinMasteryStormhammerPerfectStorm"
    },
    {
        "image": "divine-shield.png",
        "level": "10",
        "name": "Divine Shield",
        "icon": "storm_ui_icon_divineshield.dds",
        "cooldown": 70,
        "description": "Make an allied Hero Invulnerable and increase their Movement Speed by 20% for 3 seconds.",
        "hero": "Uther",
        "id": "UtherHeroicAbilityDivineShield"
    },
    {
        "image": "poisoned-spear.png",
        "level": "7",
        "name": "Poisoned Spear",
        "icon": "storm_ui_icon_sonya_ancientspear.dds",
        "cooldown": 13,
        "description": "Ancient Spear deals an additional 75% damage over 4 seconds.",
        "hero": "Sonya",
        "id": "BarbarianMasteryPoisonedSpearAncientSpear"
    },
    {
        "image": "celestial-wrath.png",
        "level": "20",
        "name": "Celestial Wrath",
        "icon": "storm_temp_war3_btnstarfall.dds",
        "cooldown": 100,
        "description": "Starfall can be cast globally.  Damage is increased by 30%.",
        "hero": "Tyrande",
        "id": "TyrandeMasteryStarfallCelestialWrath"
    },
    {
        "image": "greater-cleave.png",
        "level": "1",
        "name": "Greater Cleave",
        "icon": "storm_ui_icon_zeratul_cleave.dds",
        "cooldown": 6,
        "description": "Increases the radius of Cleave by 33%.",
        "hero": "Zeratul",
        "id": "ZeratulMasteryGreaterCleaveCleave"
    },
    {
        "image": "blood-of-the-rhino.png",
        "level": "7",
        "name": "Blood of the Rhino",
        "icon": "storm_ui_icon_rexxar_mendpet.dds",
        "cooldown": 10,
        "description": "Increases Mend Pet's duration by 5 seconds.",
        "hero": "Rexxar",
        "id": "RexxarMendPetBloodOfTheRhino"
    },
    {
        "image": "lethal-alacrity.png",
        "level": "4",
        "name": "Lethal Alacrity",
        "icon": "storm_ui_icon_artanis_powerstrikes.dds",
        "cooldown": 10,
        "description": "Increases Blade Dash range and speed by 30%.",
        "hero": "Artanis",
        "id": "ArtanisBladeDashLethalAlacrity"
    },
    {
        "image": "precision-strike.png",
        "level": "10",
        "name": "Precision Strike",
        "icon": "storm_ui_icon_nova_orbitalstrike.dds",
        "cooldown": 60,
        "description": "After a 1.5 second delay, deals 300 (+35 per level) damage to enemies within an area. Unlimited range.",
        "hero": "Nova",
        "id": "NovaHeroicAbilityPrecisionStrike"
    },
    {
        "image": "crippling-shot.png",
        "level": "16",
        "name": "Crippling Shot",
        "icon": "storm_ui_icon_Nova_PinningShot.dds",
        "cooldown": 12,
        "description": "Enemies hit by Pinning Shot become Vulnerable, taking 25% increased damage for the duration of the slow.",
        "hero": "Nova",
        "id": "NovaMasteryCripplingShot"
    },
    {
        "image": "just-keep-rockin.png",
        "level": "7",
        "name": "Just Keep Rockin'",
        "icon": "storm_ui_icon_hatestrike.dds",
        "cooldown": 8,
        "description": "While Guitar Solo is active, the duration of silences, stuns, slows, roots, and polymorphs are reduced by 50%.",
        "hero": "E.T.C.",
        "id": "ETCMasteryJustKeepRocking"
    },
    {
        "image": "fury-of-the-swarm.png",
        "level": "4",
        "name": "Fury of the Swarm",
        "icon": "storm_temp_btn-upgrade-zerg-adrenalglands.dds",
        "description": "Basic Attacks splash for 50% damage around Kerrigan.",
        "hero": "Kerrigan",
        "id": "KerriganCombatStyleFuryoftheSwarm"
    },
    {
        "image": "soma-transference.png",
        "level": "13",
        "name": "Soma Transference",
        "icon": "storm_ui_icon_abathur_spikeburst.dds",
        "cooldown": 6,
        "description": "Symbiote's Spike Burst heals the host for 20 (+6 per level) Health per enemy Hero hit.",
        "hero": "Abathur",
        "id": "AbathurSymbioteSpikeBurstSomaTransference"
    },
    {
        "image": "battleborn.png",
        "level": "16",
        "name": "Battleborn",
        "icon": "storm_temp_war3_btnorboffire.dds",
        "cooldown": 10,
        "description": "If Globe of Annihilation hits an enemy, a Demon Warrior is summoned at the impact point.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryBattleborn"
    },
    {
        "image": "scorched-earth.png",
        "level": "20",
        "name": "Scorched Earth",
        "icon": "storm_ui_icon_raynor_hyperion.dds",
        "cooldown": 100,
        "description": "An additional set of lasers blast the ground 5 times per second, dealing 15 (+3.6 per level) damage in an area.",
        "hero": "Raynor",
        "id": "RaynorHyperionGroundStrafe"
    },
    {
        "image": "combat-stance.png",
        "level": "7",
        "name": "Combat Stance",
        "icon": "storm_temp_war3_btnstrongdrink.dds",
        "cooldown": 5,
        "description": "Shields from Fortifying Brew last for an additional 3 seconds after drinking stops.",
        "hero": "Chen",
        "id": "ChenMasteryFortifyingBrewCombatStance"
    },
    {
        "image": "holy-fire.png",
        "level": "7",
        "name": "Holy Fire",
        "icon": "storm_btn_d3ros_crusader_wrath.dds",
        "description": "Deal 8 (+1.6 per level) damage per second to nearby enemies.",
        "hero": "Uther",
        "id": "UtherHolyFire"
    },
    {
        "image": "gathering-power.png",
        "level": "4",
        "name": "Gathering Power",
        "icon": "storm_temp_war3_btncontrolmagic.dds",
        "description": "Hero takedowns increase Ability Power by 1%, to a maximum of 15%. Half of this bonus Ability Power is lost on death.",
        "hero": "Zeratul",
        "id": "GenericTalentGatheringPower"
    },
    {
        "image": "frost-armor.png",
        "level": "7",
        "name": "Frost Armor",
        "icon": "storm_temp_war3_btnfrostarmor.dds",
        "description": "Enemy Heroes that attack you are Chilled. Additionally, every 8 seconds you can block the next Basic Attack from an enemy Hero reducing its damage by 75%",
        "hero": "Jaina",
        "id": "JainaMasteryFrostArmor"
    },
    {
        "image": "pitch-perfect.png",
        "level": "7",
        "name": "Pitch Perfect",
        "icon": "storm_temp_war3_btnsnazzypotion.dds",
        "cooldown": 3,
        "description": "After casting Healing Brew, its cost is reduced by 10 Mana for 6 seconds.  This effect does not stack.",
        "hero": "Li Li",
        "id": "LiLiMasteryHealingBrewPitchPerfect"
    },
    {
        "image": "mental-acuity.png",
        "level": "4",
        "name": "Mental Acuity",
        "icon": "storm_ui_icon_tassadar_oracle.dds",
        "cooldown": 40,
        "description": "Reduces the cooldown of Oracle by 20 seconds.",
        "hero": "Tassadar",
        "id": "TassadarMasteryMentalAcuity"
    },
    {
        "image": "prolific-dispersal.png",
        "level": "4",
        "name": "Prolific Dispersal",
        "icon": "storm_ui_icon_abathur_toxicnest.dds",
        "cooldown": 10,
        "description": "Reduces the cooldown of Toxic Nest by 2 seconds and adds 2 additional charges.",
        "hero": "Abathur",
        "id": "AbathurMasteryProlificDispersal"
    },
    {
        "image": "fanaticism.png",
        "level": "16",
        "name": "Fanaticism",
        "icon": "storm_ui_icon_johanna_iron_skin.dds",
        "cooldown": 20,
        "description": "While Iron Skin is active, gain 8% Movement Speed each time you take damage.  Stacks up to 40%.",
        "hero": "Johanna",
        "id": "CrusaderMasteryIronSkinFanaticism"
    },
    {
        "image": "khalas-embrace.png",
        "level": "7",
        "name": "Khala's Embrace",
        "icon": "storm_ui_icon_tassadar_plasmashield.dds",
        "cooldown": 5,
        "description": "If Plasma Shield expires, 50% of the Shield remains indefinitely. This effect does not stack.",
        "hero": "Tassadar",
        "id": "TassadarMasteryKhalasEmbrace"
    },
    {
        "image": "legion-of-beetles.png",
        "level": "4",
        "name": "Legion of Beetles",
        "icon": "storm_btn-ability_anubarak-carrionbeetles.dds",
        "description": "Anub'arak automatically spawns Beetles every 8 seconds.  Can be toggled on and off.",
        "hero": "Anub'arak",
        "id": "AnubarakCombatStyleLegionOfBeetles"
    },
    {
        "image": "scouting-drone.png",
        "level": "1",
        "name": "Scouting Drone",
        "icon": "storm_temp_war3_btnreveal.dds",
        "cooldown": 45,
        "description": "Places a Scouting Drone at target location, revealing a large area around it for 45 seconds. This drone cannot be hidden and is killed by enemies with 2 Basic Attacks.  Stores up to 2 charges.",
        "hero": "Tychus",
        "id": "GenericTalentScoutingDrone"
    },
    {
        "image": "a-card-to-play.png",
        "level": "20",
        "name": "A Card to Play",
        "icon": "storm_temp_btn-tips-armory.dds",
        "description": "Whenever a Hero (ally or enemy) is killed, the cooldown of your Heroic Ability is reduced by 15 seconds.",
        "hero": "Raynor",
        "id": "RaynorACardToPlay"
    },
    {
        "image": "deep-chill.png",
        "level": "1",
        "name": "Deep Chill",
        "icon": "storm_ui_icon_jaina_frostbite.dds",
        "description": "Increases the slow of Chill from 25% to 35%.",
        "hero": "Jaina",
        "id": "JainaMasteryDeepChill"
    },
    {
        "image": "storm-shield.png",
        "level": "20",
        "name": "Storm Shield",
        "icon": "storm_temp_btn-tips-terran-psishield.dds",
        "cooldown": 45,
        "description": "Activate to give all nearby allied Heroes a Shield for 20% of their max Health for 3 seconds.",
        "hero": "Uther",
        "id": "GenericTalentStormShield"
    },
    {
        "image": "righteous-smash.png",
        "level": "1",
        "name": "Righteous Smash",
        "icon": "storm_ui_icon_johanna_punish.dds",
        "cooldown": 8,
        "description": "Punish restores 10 Mana per enemy hit.",
        "hero": "Johanna",
        "id": "CrusaderMasteryPunishRighteousSmash"
    },
    {
        "image": "indestructible.png",
        "level": "20",
        "name": "Indestructible",
        "icon": "storm_ui_icon_divineshield.dds",
        "description": "Upon taking fatal damage, gain a Shield equal to your maximum Health for 5 seconds. This effect has a 120 second cooldown.",
        "hero": "Johanna",
        "id": "CrusaderHeroicMasteryIndestructable"
    },
    {
        "image": "feedback-loop.png",
        "level": "1",
        "name": "Feedback Loop",
        "icon": "storm_ui_icon_medic_deployshield_c.dds",
        "cooldown": 15,
        "description": "When Safeguard expires, 45 Mana is refunded.",
        "hero": "Lt. Morales",
        "id": "MedicFeedbackLoop"
    },
    {
        "image": "apocalypse.png",
        "level": "10",
        "name": "Apocalypse",
        "icon": "storm_ui_icon_deathanddecay_2.dds",
        "cooldown": 100,
        "description": "Create a demonic rune under each enemy Hero on the battleground. After 1.75 seconds the rune explodes dealing 100 (+10 per level) damage and stunning for 2 seconds.",
        "hero": "Diablo",
        "id": "DiabloHeroicAbilityApocalypse"
    },
    {
        "image": "caduceus-reactor-2-0.png",
        "level": "20",
        "name": "Caduceus Reactor 2.0",
        "icon": "storm_ui_icon_medic_caduceusreactor.dds",
        "description": "While Caduceus Reactor is active you restore 8 Mana a second and gain a Shield that absorbs 50 (+8 per level) damage, stacking up to 5 times.",
        "hero": "Lt. Morales",
        "id": "MedicCaduceusReactor2dot0"
    },
    {
        "image": "transgression.png",
        "level": "20",
        "name": "Transgression",
        "icon": "storm_ui_icon_monk_sevensidedstrike.dds",
        "cooldown": 50,
        "description": "Seven-Sided Strike hits 4 additional times.",
        "hero": "Kharazim",
        "id": "MonkElevenSidedStrikeSevenSidedStrike"
    },
    {
        "image": "mecha-lord.png",
        "level": "20",
        "name": "Mecha-Lord",
        "icon": "storm_ui_icon_robogobo.dds",
        "description": "Basic attacks deal an additional 150% damage to Heroes.",
        "hero": "Gazlowe",
        "id": "TinkerMasteryMechaLord"
    },
    {
        "image": "overflowing-light.png",
        "level": "13",
        "name": "Overflowing Light",
        "icon": "storm_temp_war3_btnheal.dds",
        "cooldown": 8,
        "description": "When you are above 50% Health, Light of Elune's allied heal is increased by 35%.",
        "hero": "Tyrande",
        "id": "TyrandeMasteryLightofEluneOverflowingLight"
    },
    {
        "image": "sustained-carapace.png",
        "level": "4",
        "name": "Sustained Carapace",
        "icon": "storm_ui_icon_abathur_carapace.dds",
        "cooldown": 12,
        "description": "Increases the duration of Symbiote's Carapace by 50% and allows it to persist after Symbiote ends.",
        "hero": "Abathur",
        "id": "AbathurSymbioteCarapaceSustainedCarapace"
    },
    {
        "image": "retribution.png",
        "level": "4",
        "name": "Retribution",
        "icon": "storm_ui_icon_tyrael_smite.dds",
        "cooldown": 7,
        "description": "Cooldown is lowered by 0.5 seconds for each target hit by Smite.",
        "hero": "Tyrael",
        "id": "TyraelMasteryRetribution"
    },
    {
        "image": "show-stopper.png",
        "level": "13",
        "name": "Show Stopper",
        "icon": "storm_ui_icon_psionicblast_2.dds",
        "cooldown": 12,
        "description": "Reduces all damage taken by 25% for 4 seconds after using Powerslide.",
        "hero": "E.T.C.",
        "id": "ETCMasteryShowStopper"
    },
    {
        "image": "blazing-fists.png",
        "level": "16",
        "name": "Blazing Fists",
        "icon": "storm_ui_icon_monk_deadlyreach.dds",
        "cooldown": 10,
        "description": "Every 3rd Basic Attack reduces the cooldown of Deadly Reach by 1 second.",
        "hero": "Kharazim",
        "id": "MonkBlazingFistsDeadlyReach"
    },
    {
        "image": "angel-of-justice.png",
        "level": "20",
        "name": "Angel of Justice",
        "icon": "storm_ui_icon_tyrael_judgement.dds",
        "cooldown": 80,
        "description": "Increases the cast range of Judgment by 50%, and reduces the cooldown by 30 seconds.",
        "hero": "Tyrael",
        "id": "TyraelMasteryJudgmentAngelofJustice"
    },
    {
        "image": "bound-minion.png",
        "level": "7",
        "name": "Bound Minion",
        "icon": "storm_temp_war3_btnfelguard.dds",
        "cooldown": 30,
        "description": "Using General of Hell on a Lane Minion decreases the non-Heroic damage they take by 75% and increases the damage they deal to non-Heroic targets by 100%. Lasts 30 seconds.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryHellCaptain"
    },
    {
        "image": "bigger-slime.png",
        "level": "4",
        "name": "Bigger Slime",
        "icon": "storm_temp_war3_btncorrosivebreath.dds",
        "cooldown": 4,
        "description": "Slime area increased by 30%.",
        "hero": "Murky",
        "id": "MurkyMasteryBiggerSlime"
    },
    {
        "image": "thrill-of-battle.png",
        "level": "7",
        "name": "Thrill of Battle",
        "icon": "storm_temp_war3_btnmetamorphosis.dds",
        "cooldown": 20,
        "description": "Activate to double the cooldown reduction from Basic Attacks for 8 seconds.",
        "hero": "Illidan",
        "id": "IllidanCombatStyleThrillOfBattle"
    },
    {
        "image": "humongoid.png",
        "level": "20",
        "name": "Humongoid",
        "icon": "storm_btn_d3_witchdoctor_gargantuan.dds",
        "cooldown": 60,
        "description": "Gargantuan lasts indefinitely until killed, and deals 100% more damage against non-Heroic targets.",
        "hero": "Nazeebo",
        "id": "WitchDoctorMasteryHumongoid"
    },
    {
        "image": "headshot.png",
        "level": "13",
        "name": "Headshot",
        "icon": "storm_temp_btn-upgrade-terran-infantryweaponslevel2.dds",
        "description": "Reduces your Ability cooldowns by 4 seconds when you kill an enemy Hero.",
        "hero": "Nova",
        "id": "NovaCombatStyleMyKill"
    },
    {
        "image": "adrenal-overload.png",
        "level": "4",
        "name": "Adrenal Overload",
        "icon": "storm_ui_icon_abathur_symbiote.dds",
        "cooldown": 4,
        "description": "Symbiote host gains 25% increased Attack Speed.",
        "hero": "Abathur",
        "id": "AbathurSymbioteAdrenalOverload"
    },
    {
        "image": "lethal-blast.png",
        "level": "1",
        "name": "Lethal Blast",
        "icon": "storm_ui_icon_sgthammer_concussiveblast.dds",
        "cooldown": 12,
        "description": "Increase the damage of Concussive Blast by 50%.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerMasteryLethalBlastConcussiveBlast"
    },
    {
        "image": "endless-creep.png",
        "level": "7",
        "name": "Endless Creep",
        "icon": "storm_ui_icon_zagara_creep.dds",
        "cooldown": 15,
        "description": "Creep Tumors spread Creep 50% farther and have 100% increased health.",
        "hero": "Zagara",
        "id": "ZagaraMasteryEndlessCreep"
    },
    {
        "image": "aspect-of-the-hawk.png",
        "level": "16",
        "name": "Aspect of the Hawk",
        "icon": "storm_ui_icon_rexxar_spiritswoop.dds",
        "cooldown": 7,
        "description": "When Spirit Swoop hits an enemy Hero, you gain 100% Attack Speed for 3 seconds.",
        "hero": "Rexxar",
        "id": "RexxarAspectOfTheHawkSpiritSwoop"
    },
    {
        "image": "putrid-ground.png",
        "level": "4",
        "name": "Putrid Ground",
        "icon": "storm_ui_icon_stitches_slam.dds",
        "cooldown": 8,
        "description": "Enemies hit by Slam are infected with Vile Gas.",
        "hero": "Stitches",
        "id": "StitchesMasteryPutridGroundSlam"
    },
    {
        "image": "rain-of-vengeance.png",
        "level": "10",
        "name": "Rain of Vengeance",
        "icon": "storm_ui_icon_valla_rainofvengeance.dds",
        "cooldown": 90,
        "description": "Launch 2 waves of Shadow Beasts that deal 100 (+23 per level) damage to enemies within the target area, stunning for 0.5 seconds per wave.",
        "hero": "Valla",
        "id": "DemonHunterHeroicAbilityRainofVengeance"
    },
    {
        "image": "lingering-chill.png",
        "level": "1",
        "name": "Lingering Chill",
        "icon": "storm_ui_icon_jaina_frostbite.dds",
        "description": "Increases the duration of Chill from 4 seconds to 6 seconds.",
        "hero": "Jaina",
        "id": "JainaMasteryLingeringChill"
    },
    {
        "image": "nowhere-to-hide.png",
        "level": "20",
        "name": "Nowhere to Hide",
        "icon": "storm_ui_icon_tikimask.dds",
        "cooldown": 60,
        "description": "Grants global range.",
        "hero": "Illidan",
        "id": "IllidanMasteryNowhereToHideTheHunt"
    },
    {
        "image": "brutal-strike.png",
        "level": "7",
        "name": "Brutal Strike",
        "icon": "storm_ui_icon_Butcher_Hamstring.dds",
        "cooldown": 4,
        "description": "After using Hamstring, your next Basic Attack deals an additional 50% damage.",
        "hero": "Butcher",
        "id": "ButcherMasteryHamstringBrutalStrike"
    },
    {
        "image": "ghastly-reach.png",
        "level": "7",
        "name": "Ghastly Reach",
        "icon": "storm_ui_icon_leoric_SkeletalSwing.dds",
        "cooldown": 8,
        "description": "Increases the range of Skeletal Swing by 25%.",
        "hero": "Leoric",
        "id": "LeoricMasteryGhastlyReachSkeletalSwing"
    },
    {
        "image": "crippling-talons.png",
        "level": "4",
        "name": "Crippling Talons",
        "icon": "storm_ui_icon_rexxar_spiritswoop.dds",
        "cooldown": 7,
        "description": "Increases Spirit Swoop's slow amount to 40% and its duration to 3 seconds.",
        "hero": "Rexxar",
        "id": "RexxarSpiritSwoopCripplingTalons"
    },
    {
        "image": "searing-attacks.png",
        "level": "7",
        "name": "Searing Attacks",
        "icon": "storm_temp_war3_btnselfdestruct.dds",
        "cooldown": 25,
        "description": "Activate to increase Basic Attack damage by 50% for 5 seconds. Each attack costs 15 Mana.",
        "hero": "Zeratul",
        "id": "GenericTalentSearingAttacks"
    },
    {
        "image": "norse-force.png",
        "level": "7",
        "name": "Norse Force!",
        "icon": "storm_ui_icon_lostvikings_norseforce.dds",
        "description": "All Vikings gain a 40 (+10 per level) to 80 (+20 per level) point Shield, increasing in strength for each Viking alive. Lasts 4 seconds.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryNorseForce"
    },
    {
        "image": "hunters-onslaught.png",
        "level": "16",
        "name": "Hunter's Onslaught",
        "icon": "storm_temp_war3_btnmetamorphosis.dds",
        "description": "Abilities heal for 15% of damage dealt.",
        "hero": "Illidan",
        "id": "IllidanCombatStyleHuntersOnslaught"
    },
    {
        "image": "overwhelming-force.png",
        "level": "1",
        "name": "Overwhelming Force",
        "icon": "storm_temp_war3_btnghoulfrenzy.dds",
        "cooldown": 12,
        "description": "Increases the range and knockback of Shadow Charge by 25%.",
        "hero": "Diablo",
        "id": "DiabloTalentOverwhelmingForceShadowCharge"
    },
    {
        "image": "spray-n-pray.png",
        "level": "4",
        "name": "Spray 'n' Pray",
        "icon": "storm_ui_icon_tychus_overkill.dds",
        "cooldown": 15,
        "description": "Overkill's range increased by 15%.",
        "hero": "Tychus",
        "id": "TychusMasterySprayNPray"
    },
    {
        "image": "cold-snap.png",
        "level": "20",
        "name": "Cold Snap",
        "icon": "storm_ui_icon_jaina_ringoffrost.dds",
        "cooldown": 80,
        "description": "The center of the ring also explodes with frost after the first ring expires.",
        "hero": "Jaina",
        "id": "JainaMasteryColdSnap"
    },
    {
        "image": "burning-rage.png",
        "level": "13",
        "name": "Burning Rage",
        "icon": "storm_ui_icon_cloakofflames.dds",
        "description": "Deal 10 (+2 per level) damage per second to nearby enemies.",
        "hero": "Zeratul",
        "id": "GenericTalentBurningRage"
    },
    {
        "image": "first-strike.png",
        "level": "13",
        "name": "First Strike",
        "icon": "storm_ui_icon_sgthammer_artillery.dds",
        "description": "Basic Attacks deal 25% more damage if you haven't been attacked within the last 5 seconds.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerFirstStrike"
    },
    {
        "image": "grand-slam.png",
        "level": "20",
        "name": "Grand Slam",
        "icon": "storm_btn_d3_monk_wayofthehundredfists.dds",
        "cooldown": 40,
        "description": "Damage of Haymaker increased by 25%, Mana cost lowered by 40, and can store 2 charges.",
        "hero": "Muradin",
        "id": "MuradinMasteryHaymakerGrandSlam"
    },
    {
        "image": "unrelenting-pursuit.png",
        "level": "4",
        "name": "Unrelenting Pursuit",
        "icon": "storm_ui_icon_Butcher_FullBoar.dds",
        "cooldown": 20,
        "description": "Reduces the cooldown of Ruthless Onslaught by 40% upon impact.",
        "hero": "Butcher",
        "id": "ButcherMasteryRuthlessOnslaughtUnrelentingPursuit"
    },
    {
        "image": "thunder-strike.png",
        "level": "13",
        "name": "Thunder Strike",
        "icon": "storm_ui_icon_thunderclap.dds",
        "cooldown": 8,
        "description": "Thunder Clap deals 300% damage if only one target is hit.",
        "hero": "Muradin",
        "id": "MuradinMasteryThunderclapThunderstrike"
    },
    {
        "image": "drakken-laser-drill.png",
        "level": "10",
        "name": "Drakken Laser Drill",
        "icon": "storm_ui_icon_tychus_drakkinlaserdrill.dds",
        "cooldown": 100,
        "description": "Call down a Laser Drill to attack nearby enemies, dealing 30 (+14 per level) damage every second. Reactivate to assign a new target. Lasts 22 seconds.",
        "hero": "Tychus",
        "id": "TychusHeroicAbilityDrakkenLaserDrill"
    },
    {
        "image": "energy-roil.png",
        "level": "1",
        "name": "Energy Roil",
        "icon": "storm_ui_icon_kaelthas_gravitylapse.dds",
        "cooldown": 13,
        "description": "Gravity Lapse's cooldown is reduced by 3 seconds for each enemy hit.",
        "hero": "Kael'thas",
        "id": "KaelthasGravityLapseEnergyRoil"
    },
    {
        "image": "brew-strike.png",
        "level": "13",
        "name": "Brew Strike",
        "icon": "storm_temp_war3_btndrunkendodge.dds",
        "cooldown": 5,
        "description": "Keg Smash reduces the cooldown of Flying Kick by 1 second for each enemy Hero hit.",
        "hero": "Chen",
        "id": "ChenMasteryFlyingKickBrewStrike"
    },
    {
        "image": "arcane-barrier.png",
        "level": "16",
        "name": "Arcane Barrier",
        "icon": "storm_temp_war3_btnmanashield.dds",
        "cooldown": 45,
        "description": "Gain a Shield equal to 200% of your maximum Mana for 6 seconds.",
        "hero": "Kael'thas",
        "id": "KaelthasArcaneBarrier"
    },
    {
        "image": "thing-of-the-deep.png",
        "level": "13",
        "name": "Thing of the Deep",
        "icon": "storm_btn_d3_witchdoctor_horrify.dds",
        "description": "Increases the range of your Basic Abilities by 25%.",
        "hero": "Nazeebo",
        "id": "WitchDoctorMasteryThingOfTheDeep"
    },
    {
        "image": "peekaboo.png",
        "level": "4",
        "name": "Peekaboo!",
        "icon": "storm_ui_icon_epicmount.dds",
        "cooldown": 45,
        "description": "Phase Shifting to an ally reveals a large area around them and all enemies in it for 6 seconds.",
        "hero": "Brightwing",
        "id": "BrightwingPeekabooPhaseShift"
    },
    {
        "image": "revitalizing-mist.png",
        "level": "20",
        "name": "Revitalizing Mist",
        "icon": "storm_temp_war3_btnreplenishhealth.dds",
        "cooldown": 4,
        "description": "Healing another Hero with Soothing Mist increases their healing received from Soothing Mist by 25% for 6 seconds. Stacks 3 times.",
        "hero": "Brightwing",
        "id": "BrightwingRevitalizingMistSoothingMist"
    },
    {
        "image": "immolation.png",
        "level": "4",
        "name": "Immolation",
        "icon": "storm_temp_war3_btnshadowstrike.dds",
        "cooldown": 8,
        "description": "After using Sweeping Strike, burn nearby enemies for 13 (+2.5 per level) damage a second for 4 seconds.",
        "hero": "Illidan",
        "id": "IllidanMasteryImmolationSweepingStrike"
    },
    {
        "image": "wrath-of-cod.png",
        "level": "13",
        "name": "Wrath of Cod",
        "icon": "storm_temp_war3_btnmurloc.dds",
        "cooldown": 15,
        "description": "Increase Pufferfish's damage by 35% against Slimed targets.",
        "hero": "Murky",
        "id": "MurkyMasteryWrathOfCod"
    },
    {
        "image": "blessed-champion.png",
        "level": "13",
        "name": "Blessed Champion",
        "icon": "storm_ui_icon_holylight.dds",
        "cooldown": 12,
        "description": "After using Holy Light, your next Basic Attack heals nearby allied Heroes for 30% of the healing amount.",
        "hero": "Uther",
        "id": "UtherMasteryBlessedChampion"
    },
    {
        "image": "holy-shock.png",
        "level": "13",
        "name": "Holy Shock",
        "icon": "storm_ui_icon_holylight.dds",
        "cooldown": 12,
        "description": "Holy Light can be used on an enemy to do 50% of its healing amount as damage and with 4 seconds less cooldown.",
        "hero": "Uther",
        "id": "UtherMasteryHolyShock"
    },
    {
        "image": "ring-of-frost.png",
        "level": "10",
        "name": "Ring of Frost",
        "icon": "storm_ui_icon_jaina_ringoffrost.dds",
        "cooldown": 80,
        "description": "After a 1.5 second delay, create a Ring of Frost in an area that deals 200 (+24 per level) damage and roots enemies for 3 seconds. The ring persists for 3 seconds afterward, Chilling any enemies who touch it.",
        "hero": "Jaina",
        "id": "JainaHeroicAbilityRingOfFrost"
    },
    {
        "image": "ice-floes.png",
        "level": "7",
        "name": "Ice Floes",
        "icon": "storm_ui_icon_jaina_coneofcold.dds",
        "cooldown": 10,
        "description": "Doubles the width of Cone of Cold and causes each target hit to reduce its cooldown by 0.5 seconds.",
        "hero": "Jaina",
        "id": "JainaMasteryIceFloes"
    },
    {
        "image": "mana-thirst.png",
        "level": "1",
        "name": "Mana Thirst",
        "icon": "storm_ui_icon_leoric_SkeletalSwing.dds",
        "cooldown": 8,
        "description": "Skeletal Swing restores 10 Mana per enemy hit, up to 50 Mana.",
        "hero": "Leoric",
        "id": "LeoricMasteryManaThirstSkeletalSwing"
    },
    {
        "image": "unstable-anomaly.png",
        "level": "4",
        "name": "Unstable Anomaly",
        "icon": "storm_temp_war3_btnpolymorph.dds",
        "cooldown": 15,
        "description": "When Polymorph ends, deal 50 (+10 per level) damage to the target and all nearby enemies.",
        "hero": "Brightwing",
        "id": "BrightwingUnstableAnomalyPolymorph"
    },
    {
        "image": "jump.png",
        "level": "13",
        "name": "Jump!",
        "icon": "storm_ui_icon_lostvikings_jump.dds",
        "description": "Makes all Vikings Invulnerable and able to pass over enemies for 1.5 seconds.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryJump"
    },
    {
        "image": "hardened-skin.png",
        "level": "20",
        "name": "Hardened Skin",
        "icon": "storm_ui_temp_icon_powerwordshield.dds",
        "cooldown": 60,
        "description": "You and Misha take 75% less damage for 4 seconds.",
        "hero": "Rexxar",
        "id": "RexxarHardenedSkin"
    },
    {
        "image": "army-of-hell.png",
        "level": "4",
        "name": "Army of Hell",
        "icon": "storm_temp_war3_btnunholyaura.dds",
        "cooldown": 10,
        "description": "Increases Demon Warrior's damage by 20% and reduces their Mana cost by 20.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryArmyOfHell"
    },
    {
        "image": "reach.png",
        "level": "1",
        "name": "Reach",
        "icon": "storm_ui_icon_holylight.dds",
        "cooldown": 12,
        "description": "Increases the range of Holy Light and Flash of Light by 40%.",
        "hero": "Uther",
        "id": "UtherMasteryReachHolyLight"
    },
    {
        "image": "rebirth.png",
        "level": "20",
        "name": "Rebirth",
        "icon": "storm_ui_icon_kaelthas_phoenix.dds",
        "cooldown": 40,
        "description": "Increases Phoenix duration by 100%. You may order the Phoenix to move to a different location once while the Phoenix is alive.",
        "hero": "Kael'thas",
        "id": "KaelthasPhoenixRebirth"
    },
    {
        "image": "northern-exposure.png",
        "level": "16",
        "name": "Northern Exposure",
        "icon": "storm_ui_icon_jaina_coneofcold.dds",
        "cooldown": 10,
        "description": "Enemies damaged by Cone of Cold are also afflicted with Vulnerable, increasing the damage they take by 25% for 2 seconds.",
        "hero": "Jaina",
        "id": "JainaMasteryNorthernExposure"
    },
    {
        "image": "unstoppable-force.png",
        "level": "20",
        "name": "Unstoppable Force",
        "icon": "storm_ui_icon_avatar.dds",
        "cooldown": 100,
        "description": "Increases the duration of Avatar by 30%, and the duration of Disables are reduced by 75% while in Avatar.",
        "hero": "Muradin",
        "id": "MuradinMasteryAvatarUnstoppableForce"
    },
    {
        "image": "seven-sided-strike.png",
        "level": "10",
        "name": "Seven-Sided Strike",
        "icon": "storm_ui_icon_monk_sevensidedstrike.dds",
        "cooldown": 50,
        "description": "Become Invulnerable and strike 7 times over 1.8125 seconds. Each strike hits the highest Health nearby Hero for 7% of their maximum Health.",
        "hero": "Kharazim",
        "id": "MonkHeroicAbilitySevenSidedStrike"
    },
    {
        "image": "ballistospores.png",
        "level": "4",
        "name": "Ballistospores",
        "icon": "storm_ui_icon_abathur_toxicnest.dds",
        "cooldown": 10,
        "description": "Increases Toxic Nest's range to global and increases duration by 20%.",
        "hero": "Abathur",
        "id": "AbathurMasteryBallistospores"
    },
    {
        "image": "mana-addict.png",
        "level": "1",
        "name": "Mana Addict",
        "icon": "storm_temp_war3_btnmanadrain.dds",
        "description": "Increase your maximum Mana by 15 when you pick up a Regeneration Globe.",
        "hero": "Kael'thas",
        "id": "KaelthasManaAddict"
    },
    {
        "image": "afterburner.png",
        "level": "16",
        "name": "Afterburner",
        "icon": "storm_temp_war3_btnforceofnature.dds",
        "cooldown": 14,
        "description": "After using Barrel Roll, gain 60% Movement Speed that decreases over 3 seconds.",
        "hero": "Falstad",
        "id": "FalstadMasteryAfterburner"
    },
    {
        "image": "frenzy-of-kalimdor.png",
        "level": "20",
        "name": "Frenzy of Kalimdor",
        "icon": "storm_btn_d3_demonhunter_rapidfire.dds",
        "description": "Your Basic Attacks deal 10% more damage, and Misha's Basic Attacks slow the target by 20% for 1.25 seconds.",
        "hero": "Rexxar",
        "id": "RexxarFrenzyofKalimdor"
    },
    {
        "image": "vile-cleaver.png",
        "level": "4",
        "name": "Vile Cleaver",
        "icon": "storm_ui_icon_stitches_acidcloud.dds",
        "description": "Basic Attacks create a cloud of Vile Gas on the target.",
        "hero": "Stitches",
        "id": "StitchesCombatStyleVileCleaver"
    },
    {
        "image": "march-of-the-black-king.png",
        "level": "10",
        "name": "March of the Black King",
        "icon": "storm_ui_icon_leoric_R2.dds",
        "cooldown": 80,
        "description": "Become Unstoppable and swing your mace three times, healing yourself for 7.03% of your maximum Health for each enemy Hero hit and dealing 200 (+10 per level) damage.",
        "hero": "Leoric",
        "id": "LeoricHeroicAbilityMarchoftheBlackKing"
    },
    {
        "image": "two-for-one.png",
        "level": "16",
        "name": "Two For One",
        "icon": "storm_temp_war3_btnsnazzypotion.dds",
        "cooldown": 3,
        "description": "Increases the number of allies healed by Healing Brew to 2, but increases the cooldown by 1.5 seconds.",
        "hero": "Li Li",
        "id": "LiLiMasteryHealingBrewTwoForOne"
    },
    {
        "image": "piercing-bolt.png",
        "level": "7",
        "name": "Piercing Bolt",
        "icon": "storm_ui_icon_stormbolt.dds",
        "cooldown": 10,
        "description": "Penetrates through the first target hit, hitting 1 additional target.",
        "hero": "Muradin",
        "id": "MuradinMasteryStormhammer"
    },
    {
        "image": "rapid-fire.png",
        "level": "7",
        "name": "Rapid Fire",
        "icon": "storm_ui_icon_tychus_minigun.dds",
        "description": "Minigun stacks 2 additional times, further increasing your Attack Speed.",
        "hero": "Tychus",
        "id": "TychusCombatStyleRapidFire"
    },
    {
        "image": "divine-palm.png",
        "level": "10",
        "name": "Divine Palm",
        "icon": "storm_ui_icon_monk_divinepalm.dds",
        "cooldown": 60,
        "description": "Protect an allied Hero from death, causing them to be healed for 500 (+100 per level) if they take fatal damage in the next 3 seconds.",
        "hero": "Kharazim",
        "id": "MonkHeroicAbilityDivinePalm"
    },
    {
        "image": "assault-egg.png",
        "level": "1",
        "name": "Assault Egg",
        "icon": "storm_temp_war3_btnhealthstone.dds",
        "cooldown": 15,
        "description": "Health and sight range of Egg increased by 150%.",
        "hero": "Murky",
        "id": "MurkyMasteryAssaultEgg"
    },
    {
        "image": "warp-sickness.png",
        "level": "7",
        "name": "Warp Sickness",
        "icon": "storm_ui_icon_artanis_repositionmatrix.dds",
        "cooldown": 14,
        "description": "Phase Prism also slows the enemy's Movement Speed by 30% for 3 seconds.",
        "hero": "Artanis",
        "id": "ArtanisPhasePrismWarpSickness"
    },
    {
        "image": "serpent-sidekick.png",
        "level": "16",
        "name": "Serpent Sidekick",
        "icon": "storm_temp_war3_btnwindserpent.dds",
        "cooldown": 10,
        "description": "You also gain a Cloud Serpent whenever you cast it on another ally.",
        "hero": "Li Li",
        "id": "LiLiMasteryCloudSerpentSerpentSidekick"
    },
    {
        "image": "unstable-poison.png",
        "level": "7",
        "name": "Unstable Poison",
        "icon": "storm_ui_icon_sylvanas_blackarrows.dds",
        "description": "Minions and Mercenaries that die under the effects of Black Arrows explode, dealing 75 (+9 per level) damage to nearby enemies.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentUnstablePoison"
    },
    {
        "image": "sanctification.png",
        "level": "10",
        "name": "Sanctification",
        "icon": "storm_ui_icon_tyrael_sanctification.dds",
        "cooldown": 70,
        "description": "After 0.5 seconds create a field of holy energy that makes allied Heroes Invulnerable. Lasts 3 seconds.",
        "hero": "Tyrael",
        "id": "TyraelHeroicAbilitySanctification"
    },
    {
        "image": "unyielding-despair.png",
        "level": "16",
        "name": "Unyielding Despair",
        "icon": "storm_ui_icon_leoric_DrainHope.dds",
        "cooldown": 12,
        "description": "Every second Drain Hope is active, its cooldown is reduced by 1 second.",
        "hero": "Leoric",
        "id": "LeoricMasteryUnyieldingDespairDrainHope"
    },
    {
        "image": "putrid-bile.png",
        "level": "10",
        "name": "Putrid Bile",
        "icon": "storm_ui_icon_stitches_putridbile.dds",
        "cooldown": 60,
        "description": "Emit bile that deals 20 (+3 per level) damage per second to enemies within, slowing them by 35%. You gain 20% Movement Speed while emitting bile. Lasts 8 seconds.",
        "hero": "Stitches",
        "id": "StitchesHeroicAbilityPutridBile"
    },
    {
        "image": "serenity.png",
        "level": "20",
        "name": "Serenity",
        "icon": "storm_btn-ability_malfurion-tranquility.dds",
        "cooldown": 100,
        "description": "Increases Tranquility's healing by 25% and it also restores 5 Mana per second.",
        "hero": "Malfurion",
        "id": "MalfurionMasterySerenity"
    },
    {
        "image": "shed-exoskeleton.png",
        "level": "7",
        "name": "Shed Exoskeleton",
        "icon": "storm_temp_war3_btnspikedbarricades.dds",
        "cooldown": 8,
        "description": "Gain 25% increased Move Speed for 3 seconds.",
        "hero": "Anub'arak",
        "id": "AnubarakMasteryShedExoskeletonHardenCarapace"
    },
    {
        "image": "epic-mount.png",
        "level": "20",
        "name": "Epic Mount",
        "icon": "storm_ui_icon_epicmount.dds",
        "cooldown": 45,
        "description": "Reduce the cooldown of Flight to 20 seconds, reduce the cast time before flying to 0.5 seconds, and increase the speed by 50%.",
        "hero": "Falstad",
        "id": "FalstadMasteryFlightEpicMount"
    },
    {
        "image": "will-of-the-forsaken.png",
        "level": "16",
        "name": "Will of the Forsaken",
        "icon": "storm_temp_war3_btnskeletonwarrior.dds",
        "cooldown": 60,
        "description": "Activate to become Unstoppable and gain 30% Movement Speed for 3 seconds.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentWillOfTheForsaken"
    },
    {
        "image": "tumble.png",
        "level": "16",
        "name": "Tumble",
        "icon": "storm_ui_icon_valla_vault.dds",
        "cooldown": 10,
        "description": "Vault gains an additional charge, allowing it to be cast twice in quick succession.",
        "hero": "Valla",
        "id": "DemonHunterMasteryTumble"
    },
    {
        "image": "march-of-sin.png",
        "level": "13",
        "name": "March of Sin",
        "icon": "storm_temp_war3_btnsoulburn.dds",
        "cooldown": 6,
        "description": "Azmodan can move at 75% speed while channeling All Shall Burn.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryMarchOfSin"
    },
    {
        "image": "improved-ice-block.png",
        "level": "13",
        "name": "Improved Ice Block",
        "icon": "storm_btn_d3_wizard_icearmor.dds",
        "cooldown": 60,
        "description": "Activate to place yourself in Stasis and gain Invulnerability for 3 seconds. When this effect expires, nearby enemies are Chilled.",
        "hero": "Jaina",
        "id": "JainaMasteryImprovedIceBlock"
    },
    {
        "image": "march-of-the-murlocs.png",
        "level": "10",
        "name": "March of the Murlocs",
        "icon": "storm_ui-heroicon_orangemurloc.dds",
        "cooldown": 100,
        "description": "Command a legion of Murlocs to march in a target direction, each one leaping onto the first enemy Hero or Structure they find. Each Murloc deals 60 (+7.5 per level) damage and slow its target by 15% for 5 seconds. Does half damage to Structures.",
        "hero": "Murky",
        "id": "MurkyHeroicAbilityMarchoftheMurlocs"
    },
    {
        "image": "healing-surge.png",
        "level": "13",
        "name": "Healing Surge",
        "icon": "storm_ui_icon_chainhealing.dds",
        "cooldown": 9,
        "description": "Increases Chain Heal's healing on the primary target by 25% and heal an additional target.",
        "hero": "Rehgar",
        "id": "RehgarMasteryHealingSurge"
    },
    {
        "image": "life-leech.png",
        "level": "13",
        "name": "Life Leech",
        "icon": "storm_temp_war3_btnpotionred.dds",
        "description": "Basic Attacks against enemy Heroes deal bonus damage equal to 1% of the Hero's maximum Health and heal you for the same amount.",
        "hero": "Diablo",
        "id": "DiabloTalentLifeLeech"
    },
    {
        "image": "repeating-arrow.png",
        "level": "7",
        "name": "Repeating Arrow",
        "icon": "storm_ui_icon_valla_vault.dds",
        "cooldown": 10,
        "description": "The cooldown for Hungering Arrow is reset when Vault is used.",
        "hero": "Valla",
        "id": "DemonHunterMasteryRepeatingArrowVault"
    },
    {
        "image": "lead-rain.png",
        "level": "13",
        "name": "Lead Rain",
        "icon": "storm_ui_icon_tychus_overkill.dds",
        "cooldown": 15,
        "description": "Overkill applies a stacking slow, up to 20%.",
        "hero": "Tychus",
        "id": "TychusMasteryLeadRain"
    },
    {
        "image": "surging-winds.png",
        "level": "13",
        "name": "Surging Winds",
        "icon": "storm_temp_war3_btndeathanddecay.dds",
        "cooldown": 10,
        "description": "Gain 5% Ability Power for 8 seconds for every enemy hit by Blinding Wind. Additional enemies hit refresh the duration of this buff and further increase Ability Power. Stacks up to 4 times.",
        "hero": "Li Li",
        "id": "LiLiMasteryBlindingWindSurgingWinds"
    },
    {
        "image": "domination.png",
        "level": "16",
        "name": "Domination",
        "icon": "storm_temp_war3_btngrabtree.dds",
        "cooldown": 12,
        "description": "Overpower reduces the cooldown of Shadow Charge by 10 seconds.",
        "hero": "Diablo",
        "id": "DiabloTalentDominationOverpower"
    },
    {
        "image": "angelic-might.png",
        "level": "13",
        "name": "Angelic Might",
        "icon": "storm_ui_icon_tyrael_smite.dds",
        "cooldown": 7,
        "description": "Gain 25% increased damage on your next Basic Attack for each target hit by Smite.",
        "hero": "Tyrael",
        "id": "TyraelMasteryAngelicMight"
    },
    {
        "image": "resonation.png",
        "level": "16",
        "name": "Resonation",
        "icon": "storm_ui_icon_tassadar_psionicstorm.dds",
        "cooldown": 8,
        "description": "Psionic Storm targets are slowed by 25% for 1 second.",
        "hero": "Tassadar",
        "id": "TassadarMasteryResonation"
    },
    {
        "image": "hardened-shield.png",
        "level": "20",
        "name": "Hardened Shield",
        "icon": "storm_ui_temp_icon_powerwordshield.dds",
        "cooldown": 60,
        "description": "Activate to reduce damage taken by 75% for 4 seconds.",
        "hero": "Tyrael",
        "id": "GenericTalentHardenedShield"
    },
    {
        "image": "problem-solver.png",
        "level": "13",
        "name": "Problem Solver",
        "icon": "storm_temp_war3_btnseagiant.dds",
        "description": "Basic Attacks against enemy Heroes deal bonus damage equal to 0.5% of the Hero's maximum Health.",
        "hero": "Tychus",
        "id": "GiantKillerTychus"
    },
    {
        "image": "irradiate.png",
        "level": "7",
        "name": "Irradiate",
        "icon": "storm_ui_icon_medic_healingbeam.dds",
        "cooldown": 0.5,
        "description": "Enemies near your Healing Beam's target take 20 (+1.5 per level) damage a second.",
        "hero": "Lt. Morales",
        "id": "MedicIrradiate"
    },
    {
        "image": "deep-shift.png",
        "level": "7",
        "name": "Deep Shift",
        "icon": "storm_ui_icon_tassadar_dimensionalshift.dds",
        "cooldown": 20,
        "description": "Dimensional Shift duration increased by 1.5 seconds.",
        "hero": "Tassadar",
        "id": "TassadarMasteryDeepShift"
    },
    {
        "image": "grav-o-bomb-3000.png",
        "level": "10",
        "name": "Grav-O-Bomb 3000",
        "icon": "storm_temp_war3_btnorbofdarkness.dds",
        "cooldown": 110,
        "description": "After a 2 second delay, pull enemies toward the center of an area and deal 150 (+20 per level) damage.",
        "hero": "Gazlowe",
        "id": "TinkerHeroicAbilityGravOBomb3000"
    },
    {
        "image": "bird-of-prey.png",
        "level": "7",
        "name": "Bird of Prey",
        "icon": "storm_ui_icon_rexxar_spiritswoop.dds",
        "cooldown": 7,
        "description": "Increases Spirit Swoop's damage by 200% to non-Heroic enemies.",
        "hero": "Rexxar",
        "id": "RexxarSpiritSwoopBirdOfPrey"
    },
    {
        "image": "heavy-slam.png",
        "level": "1",
        "name": "Heavy Slam",
        "icon": "storm_ui_icon_stitches_slam.dds",
        "cooldown": 8,
        "description": "Slam damage increased by 50%",
        "hero": "Stitches",
        "id": "StitchesMasteryHeavySlam"
    },
    {
        "image": "sieging-wrath.png",
        "level": "1",
        "name": "Sieging Wrath",
        "icon": "storm_temp_war3_btnorboffire.dds",
        "cooldown": 10,
        "description": "Increases Globe of Annihilation's impact damage by up to 50%, depending on how far it traveled.",
        "hero": "Azmodan",
        "id": "AzmodanMasterySiegingWrath"
    },
    {
        "image": "gluttonous-ward.png",
        "level": "7",
        "name": "Gluttonous Ward",
        "icon": "storm_temp_war3_btnhealingward.dds",
        "cooldown": 60,
        "description": "Activate to place a ward on the ground that restores 2.457% of your maximum Health and Mana every second for 10 seconds.",
        "hero": "Azmodan",
        "id": "AzmodanGluttonousWard"
    },
    {
        "image": "horadric-reforging.png",
        "level": "1",
        "name": "Horadric Reforging",
        "icon": "storm_ui_icon_tyrael_eldruinsmight_a.dds",
        "cooldown": 12,
        "description": "If El'druins Might hits an enemy, its cooldown is reduced by 3 seconds.",
        "hero": "Tyrael",
        "id": "TyraelMasteryElDruinsMightHoradricReforging"
    },
    {
        "image": "boomerang.png",
        "level": "7",
        "name": "BOOMerang",
        "icon": "storm_temp_war3_btnfeedback.dds",
        "cooldown": 10,
        "description": "Reactivate Hammerang mid-flight to deal 25 (+12 per level) damage around the Hammer.",
        "hero": "Falstad",
        "id": "FalstadMasteryBolterang"
    },
    {
        "image": "bolt-of-the-storm.png",
        "level": "20",
        "name": "Bolt of the Storm",
        "icon": "storm_temp_btn-ability-protoss-blink-color.dds",
        "cooldown": 70,
        "description": "Activate to teleport to a nearby location.",
        "hero": "Zagara",
        "id": "GenericTalentFlashoftheStorms"
    },
    {
        "image": "concussion-grenade.png",
        "level": "16",
        "name": "Concussion Grenade",
        "icon": "storm_ui_icon_tychus_fraggrenade.dds",
        "cooldown": 10,
        "description": "Increases the knockback of Frag Grenade by 100%.",
        "hero": "Tychus",
        "id": "TychusMasteryFragGrenadeConcussionGrenade"
    },
    {
        "image": "strangling-vines.png",
        "level": "7",
        "name": "Strangling Vines",
        "icon": "storm_btn-ability_malfurion-entanglingroots.dds",
        "cooldown": 10,
        "description": "Entangling Roots deals 100% more damage.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryStranglingVinesEntanglingRoots"
    },
    {
        "image": "nightmare.png",
        "level": "20",
        "name": "Nightmare",
        "icon": "storm_temp_war3_btnultravision.dds",
        "cooldown": 90,
        "description": "Increases Twilight Dream's silence duration to 4 seconds and it also slows enemies by 50%.",
        "hero": "Malfurion",
        "id": "MalfurionMasteryNightmare"
    },
    {
        "image": "double-barreled.png",
        "level": "13",
        "name": "Double-Barreled",
        "icon": "storm_ui_icon_raynor_penetratinground.dds",
        "cooldown": 12,
        "description": "Penetrating Round gains a second charge.",
        "hero": "Raynor",
        "id": "RaynorPenetratingRoundDoubleBarreled"
    },
    {
        "image": "hurricane.png",
        "level": "4",
        "name": "Hurricane",
        "icon": "storm_ui_icon_sonya_whirlwind.dds",
        "cooldown": 4,
        "description": "Casting Whirlwind removes all slows and roots.",
        "hero": "Sonya",
        "id": "BarbarianMasteryHurricaneWhirlwind"
    },
    {
        "image": "gidbinn.png",
        "level": "7",
        "name": "Gidbinn",
        "icon": "storm_btn_d3_demonhunter_impale.dds",
        "description": "Increases the duration of your Zombie Wall and Corpse Spiders by 33%.",
        "hero": "Nazeebo",
        "id": "WitchDoctorCombatStyleGidbinn"
    },
    {
        "image": "leeching-scarabs.png",
        "level": "7",
        "name": "Leeching Scarabs",
        "icon": "storm_btn-ability_anubarak-carrionbeetles.dds",
        "description": "Beetles heal Anub'arak for 50% of their damage with each attack if he is nearby.",
        "hero": "Anub'arak",
        "id": "AnubarakMasteryLeechingScarabs"
    },
    {
        "image": "healing-static.png",
        "level": "13",
        "name": "Healing Static",
        "icon": "storm_ui_icon_thunderclap.dds",
        "cooldown": 8,
        "description": "Heal for 1.5% of your Max Health for each target hit by Thunder Clap.",
        "hero": "Muradin",
        "id": "MuradinMasteryThunderclapHealingStatic"
    },
    {
        "image": "presence-of-mind.png",
        "level": "20",
        "name": "Presence Of Mind",
        "icon": "storm_ui_icon_kaelthas_pyroblast.dds",
        "cooldown": 50,
        "description": "Increases Pyroblast's explosion radius by 50% and reduces its cooldown by 10 seconds per enemy Hero hit.",
        "hero": "Kael'thas",
        "id": "KaelthasPyroblastPresenceOfMind"
    },
    {
        "image": "clairvoyance.png",
        "level": "7",
        "name": "Clairvoyance",
        "icon": "storm_temp_war3_btnmagicalsentry.dds",
        "cooldown": 45,
        "description": "Activate to reveal an area for 10 seconds.  Enemies in the area are revealed for 4 seconds.",
        "hero": "Uther",
        "id": "GenericTalentClairvoyance"
    },
    {
        "image": "persistent-carapace.png",
        "level": "1",
        "name": "Persistent Carapace",
        "icon": "storm_temp_war3_btnspikedbarricades.dds",
        "cooldown": 8,
        "description": "Increases Harden Carapace's Shield duration by 3 seconds.",
        "hero": "Anub'arak",
        "id": "AnubarakMasteryPersistentCarapaceHardenCarapace"
    },
    {
        "image": "heavy-impact.png",
        "level": "16",
        "name": "Heavy Impact",
        "icon": "storm_ui_icon_dwarftoss.dds",
        "cooldown": 12,
        "description": "Enemies hit by Dwarf Toss are stunned for 0.75 seconds.",
        "hero": "Muradin",
        "id": "MuradinMasteryDwarfTossHeavyImpact"
    },
    {
        "image": "black-pool.png",
        "level": "10",
        "name": "Black Pool",
        "icon": "storm_temp_war3_btngenericspellimmunity.dds",
        "cooldown": 20,
        "description": "Create a pool that empowers Azmodan, his Demons, and allied Minions, increasing their attack and ability damage by 75%. Pools last 5 seconds.",
        "hero": "Azmodan",
        "id": "AzmodanHeroicAbilityBlackPool"
    },
    {
        "image": "arcane-precision.png",
        "level": "1",
        "name": "Arcane Precision",
        "icon": "storm_temp_war3_btnmanaflare.dds",
        "cooldown": 8,
        "description": "Increases Arcane Flare's inner area damage by 50%.",
        "hero": "Brightwing",
        "id": "FaerieDragonMasteryArcanePrecision"
    },
    {
        "image": "composite-arrows.png",
        "level": "1",
        "name": "Composite Arrows",
        "icon": "storm_ui_icon_valla_multishot.dds",
        "cooldown": 8,
        "description": "Increases the range of Multishot by 20%.",
        "hero": "Valla",
        "id": "DemonHunterMasteryCompositeArrowsMultishot"
    },
    {
        "image": "twilight-dream.png",
        "level": "10",
        "name": "Twilight Dream",
        "icon": "storm_temp_war3_btnultravision.dds",
        "cooldown": 90,
        "description": "After a short delay, deal 100 (+36 per level) damage in a large area around you, silencing enemies making them unable to use Abilities for 3 seconds.",
        "hero": "Malfurion",
        "id": "MalfurionHeroicAbilityTwilightDream"
    },
    {
        "image": "enough-to-share.png",
        "level": "13",
        "name": "Enough to Share",
        "icon": "storm_temp_war3_btnstrongdrink.dds",
        "cooldown": 5,
        "description": "Fortifying Brew also Shields nearby allied Heroes for 16.5 (+5 per level) per second.",
        "hero": "Chen",
        "id": "ChenMasteryFortifyingBrewEnoughToShare"
    },
    {
        "image": "indigestion.png",
        "level": "13",
        "name": "Indigestion",
        "icon": "storm_ui_icon_stitches_devour.dds",
        "cooldown": 20,
        "description": "Using Devour also creates a Retchling that applies Vile Gas Poison when it attacks.",
        "hero": "Stitches",
        "id": "StitchesMasteryIndigestionDevour"
    },
    {
        "image": "paralyzing-rage.png",
        "level": "7",
        "name": "Paralyzing Rage",
        "icon": "storm_ui_icon_leoric_SkeletalSwing.dds",
        "cooldown": 8,
        "description": "Increases the Movement Speed slow of Skeletal Swing to 60%.",
        "hero": "Leoric",
        "id": "LeoricMasteryParalyzingRageSkeletalSwing"
    },
    {
        "image": "checkpoint-reached.png",
        "level": "20",
        "name": "Checkpoint Reached",
        "icon": "storm_ui_icon_lostvikings_playagain.dds",
        "description": "10 seconds after using Play Again!, any dead Vikings are revived and summoned again, and all are healed to full.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryCheckpointReached"
    },
    {
        "image": "updraft.png",
        "level": "1",
        "name": "Updraft",
        "icon": "storm_temp_war3_btnforceofnature.dds",
        "cooldown": 14,
        "description": "Increase the range of Barrel Roll by 30%.",
        "hero": "Falstad",
        "id": "FalstadMasteryUpdraftBarrelRoll"
    },
    {
        "image": "toads-of-hugeness.png",
        "level": "13",
        "name": "Toads of Hugeness",
        "icon": "storm_btn_d3_witchdoctor_plagueoftoads.dds",
        "cooldown": 10,
        "description": "Plague of Toads damage and area is increased by 20% after each hop.",
        "hero": "Nazeebo",
        "id": "WitchDoctorMasteryToadsofHugenessPlagueofToads"
    },
    {
        "image": "caltrops.png",
        "level": "7",
        "name": "Caltrops",
        "icon": "storm_ui_icon_valla_vault.dds",
        "cooldown": 10,
        "description": "Drop 3 Caltrops while Vaulting. Caltrops do 25 (+2 per level) damage and slow enemies by 20% for 2 seconds.",
        "hero": "Valla",
        "id": "DemonHunterMasteryCaltrops"
    },
    {
        "image": "psionic-pulse.png",
        "level": "4",
        "name": "Psionic Pulse",
        "icon": "storm_ui_icon_kerrigan_primalgrasp.dds",
        "cooldown": 10,
        "description": "After casting Primal Grasp, deal 15 (+3 per level) damage per second to nearby enemies. Lasts 5 seconds.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryPrimalGraspPsionicPulse"
    },
    {
        "image": "savor-the-flavor.png",
        "level": "7",
        "name": "Savor the Flavor",
        "icon": "storm_ui_icon_stitches_devour.dds",
        "cooldown": 20,
        "description": "Using Devour on an enemy Hero permanently increases your Health Regeneration by 2 per second.",
        "hero": "Stitches",
        "id": "StitchesMasterySavorTheFlavorDevour"
    },
    {
        "image": "titan-killer.png",
        "level": "16",
        "name": "Titan Killer",
        "icon": "storm_ui_icon_artanis_doubleslash_off.dds",
        "cooldown": 4,
        "description": "Twin Blades attacks against Heroes deal an additional 2.5% of the target's maximum Health in damage.",
        "hero": "Artanis",
        "id": "ArtanisTwinBladesTitanKiller"
    },
    {
        "image": "gale-force.png",
        "level": "1",
        "name": "Gale Force",
        "icon": "storm_temp_war3_btndeathanddecay.dds",
        "cooldown": 10,
        "description": "Increases Blinding Wind damage by 50%.",
        "hero": "Li Li",
        "id": "LiLiMasteryBlindingWindGaleForce"
    },
    {
        "image": "tazer-rounds.png",
        "level": "1",
        "name": "Tazer Rounds",
        "icon": "storm_ui_icon_Nova_PinningShot.dds",
        "cooldown": 12,
        "description": "Increases the duration of Pinning Shot's slow to 4 seconds.",
        "hero": "Nova",
        "id": "NovaMasteryTazerRounds"
    },
    {
        "image": "ring-of-fire.png",
        "level": "7",
        "name": "Ring of Fire",
        "icon": "storm_temp_war3_btnbreathoffire.dds",
        "cooldown": 5,
        "description": "After using Breath of Fire, ignite in a fiery aura, dealing 11 (+2.75 per level) damage every second to nearby enemies for 5 seconds.",
        "hero": "Chen",
        "id": "ChenMasteryBreathOfFireRingOfFire"
    },
    {
        "image": "life-funnel.png",
        "level": "13",
        "name": "Life Funnel",
        "icon": "storm_ui_icon_sonya_whirlwind.dds",
        "cooldown": 4,
        "description": "Increases the healing of Whirlwind to 25%.",
        "hero": "Sonya",
        "id": "BarbarianMasteryLifeFunnelWhirlwind"
    },
    {
        "image": "ice-block.png",
        "level": "13",
        "name": "Ice Block",
        "icon": "storm_temp_war3_btnfrost.dds",
        "cooldown": 60,
        "description": "Activate to place yourself in Stasis and gain Invulnerability for 3 seconds.",
        "hero": "Nazeebo",
        "id": "GenericTalentIceBlock"
    },
    {
        "image": "thunder-burn.png",
        "level": "4",
        "name": "Thunder Burn",
        "icon": "storm_ui_icon_thunderclap.dds",
        "cooldown": 8,
        "description": "Thunder Clap leaves a zone on the ground that explodes after 2 seconds dealing 25 (+4 per level) damage and applying a 25% slow for 2.5 seconds.",
        "hero": "Muradin",
        "id": "MuradinMasteryThunderburn"
    },
    {
        "image": "blunt-force-gun.png",
        "level": "10",
        "name": "Blunt Force Gun",
        "icon": "storm_ui_icon_sgthammer_bluntforcegun.dds",
        "cooldown": 70,
        "description": "Fire a missile across the battlefield, dealing 220 (+29 per level) damage to enemies in its path.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerHeroicAbilityBluntForceGun"
    },
    {
        "image": "fury-of-the-storm.png",
        "level": "20",
        "name": "Fury of the Storm",
        "icon": "storm_temp_war3_btnpurge.dds",
        "description": "Every 5 seconds, your next basic attack will deal an additional 20 (+9 per level) damage to the target, and 20 (+24 per level) damage to all nearby Minions and Mercenaries.",
        "hero": "Zagara",
        "id": "GenericTalentFuryoftheStorm"
    },
    {
        "image": "static-charge.png",
        "level": "7",
        "name": "Static Charge",
        "icon": "storm_ui_icon_tassadar_psionicstorm.dds",
        "cooldown": 8,
        "description": "Enemies damaged by Psionic Storm are marked with Static Charge. Your Basic Attacks consume the Static Charge to deal 24 (+4.5 per level) damage.",
        "hero": "Tassadar",
        "id": "TassadarMasteryStaticCharge"
    },
    {
        "image": "dying-breath.png",
        "level": "20",
        "name": "Dying Breath",
        "icon": "storm_ui_icon_deathanddecay_2.dds",
        "cooldown": 100,
        "description": "Apocalypse's cooldown is reduced by 20 seconds and is cast for free when you die.",
        "hero": "Diablo",
        "id": "DiabloMasteryDyingBreathApocalypse"
    },
    {
        "image": "landing-momentum.png",
        "level": "7",
        "name": "Landing Momentum",
        "icon": "storm_ui_icon_dwarftoss.dds",
        "cooldown": 12,
        "description": "Increases your Movement Speed by 20% for 4 seconds upon landing with Dwarf Toss.",
        "hero": "Muradin",
        "id": "MuradinMasteryDwarfTossLandingMomentum"
    },
    {
        "image": "nether-wind.png",
        "level": "4",
        "name": "Nether Wind",
        "icon": "storm_ui_icon_kaelthas_gravitylapse.dds",
        "cooldown": 13,
        "description": "Increases Gravity Lapse's range and speed by 30%.",
        "hero": "Kael'thas",
        "id": "KaelthasGravityLapseNetherWind"
    },
    {
        "image": "skullcracker.png",
        "level": "7",
        "name": "Skullcracker",
        "icon": "storm_temp_war3_btnstormhammer.dds",
        "description": "Every 3rd Basic Attack against the same target will stun them for 0.25 seconds.",
        "hero": "Muradin",
        "id": "MuradinCombatStyleSkullcracker"
    },
    {
        "image": "divine-hurricane.png",
        "level": "20",
        "name": "Divine Hurricane",
        "icon": "storm_btn_d3_monk_cyclonestrike.dds",
        "cooldown": 80,
        "description": "Divine Storm's radius is increased by 50% and its cooldown is reduced by 20 seconds.",
        "hero": "Uther",
        "id": "UtherMasteryDivineHurricaneDivineStorm"
    },
    {
        "image": "stoneskin.png",
        "level": "16",
        "name": "Stoneskin",
        "icon": "storm_temp_war3_btnhardenedskin.dds",
        "cooldown": 60,
        "description": "Activate to gain 30% of your maximum Health as a Shield for 5 seconds.",
        "hero": "Zeratul",
        "id": "GenericTalentStoneskin"
    },
    {
        "image": "frost-strike.png",
        "level": "7",
        "name": "Frost Strike",
        "icon": "storm_temp_war3_btnfrostmourne.dds",
        "cooldown": 12,
        "description": "Frostmourne Hungers also slows the target by 40% for 1.5 seconds.",
        "hero": "Arthas",
        "id": "ArthasMasteryFrostStrike"
    },
    {
        "image": "thirsting-blade.png",
        "level": "4",
        "name": "Thirsting Blade",
        "icon": "storm_temp_war3_btnmetamorphosis.dds",
        "description": "Healing from Basic Attacks increased to 30% of damage dealt.",
        "hero": "Illidan",
        "id": "IllidanCombatStyleThirstingBlade"
    },
    {
        "image": "fight-or-flight.png",
        "level": "7",
        "name": "Fight or Flight",
        "icon": "storm_ui_icon_raynor_adrenalinrush.dds",
        "cooldown": 40,
        "description": "Whenever Adrenaline Rush activates it also grants Resistant, reducing damage taken by 25% for 4 seconds.  Adrenaline Rush can also be manually activated.",
        "hero": "Raynor",
        "id": "RaynorMasteryFightorFlightAdrenalineRush"
    },
    {
        "image": "phase-shield.png",
        "level": "7",
        "name": "Phase Shield",
        "icon": "storm_ui_icon_epicmount.dds",
        "cooldown": 45,
        "description": "After finishing the teleport, the target of your Phase Shift gains a 200 (+50 per level) point Shield for 20 seconds.",
        "hero": "Brightwing",
        "id": "FaerieDragonMasteryPhaseShield"
    },
    {
        "image": "blinding-speed.png",
        "level": "16",
        "name": "Blinding Speed",
        "icon": "storm_ui_icon_monk_dash.dds",
        "cooldown": 12,
        "description": "Decreases Radiant Dash's cooldown by 2 seconds and increases the maximum number of charges by 1.",
        "hero": "Kharazim",
        "id": "MonkBlindingSpeedRadiantDash"
    },
    {
        "image": "longboat-raid.png",
        "level": "10",
        "name": "Longboat Raid!",
        "icon": "storm_ui_icon_lostvikings_longboatraid.dds",
        "description": "Hop into an Unstoppable Longboat that fires at nearby enemies for 25 (+11 per level) damage per second and can fire a mortar that deals 50 (+20 per level) damage in an area.  The boat has increased Health for each Viking inside. If the boat is destroyed by enemies, all Vikings are stunned for 1.5 seconds. Lasts 15 seconds.\nRequires all surviving Vikings to be nearby.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsHeroicAbilityLongboatRaid"
    },
    {
        "image": "regeneration-master.png",
        "level": "1",
        "name": "Regeneration Master",
        "icon": "storm_btn_d3_monk_mantraofhealing.dds",
        "description": "Collecting Regeneration Globes permanently increases Health Regeneration by 1.5 per second.",
        "hero": "Zeratul",
        "id": "GenericTalentRegenerationMaster"
    },
    {
        "image": "assimilation-mastery.png",
        "level": "7",
        "name": "Assimilation Mastery",
        "icon": "storm_ui_icon_kerrigan_assimilation.dds",
        "description": "While Assimilation Shields are active your Health and Mana regeneration is increased by 100%.",
        "hero": "Kerrigan",
        "id": "KerriganAssimilationMastery"
    },
    {
        "image": "renewed-swing.png",
        "level": "16",
        "name": "Renewed Swing",
        "icon": "storm_ui_icon_leoric_SkeletalSwing.dds",
        "cooldown": 8,
        "description": "Skeletal Swing can be recast again for free within 3 seconds for 50% damage.",
        "hero": "Leoric",
        "id": "LeoricMasteryRenewedSwingSkeletalSwing"
    },
    {
        "image": "gorge.png",
        "level": "10",
        "name": "Gorge",
        "icon": "storm_ui_icon_stitches_cannibalize.dds",
        "cooldown": 80,
        "description": "Consume an enemy Hero, trapping them for 4 seconds. When Gorge ends, the enemy Hero takes 100 (+25 per level) damage. The trapped Hero cannot move or act and doesn't take damage from other sources. \nCannot be used on massive Heroes.",
        "hero": "Stitches",
        "id": "StitchesHeroicAbilityGorge"
    },
    {
        "image": "phoenix.png",
        "level": "10",
        "name": "Phoenix",
        "icon": "storm_ui_icon_kaelthas_phoenix.dds",
        "cooldown": 40,
        "description": "Launch a Phoenix to an area, dealing 10 (+8 per level) damage to enemies along the way. The Phoenix persists for 7 seconds, attacking enemies for 10 (+8 per level) damage and splashing for 50%.",
        "hero": "Kael'thas",
        "id": "KaelthasHeroicAbilityPhoenix"
    },
    {
        "image": "mic-check.png",
        "level": "4",
        "name": "Mic Check",
        "icon": "storm_ui_icon_deathpact_2.dds",
        "cooldown": 10,
        "description": "Hitting at least 3 targets with Face Melt reduces its cooldown by 5 seconds.",
        "hero": "E.T.C.",
        "id": "ETCMasteryMicCheck"
    },
    {
        "image": "lord-of-terror.png",
        "level": "20",
        "name": "Lord of Terror",
        "icon": "storm_temp_war3_btnspellsteal.dds",
        "cooldown": 60,
        "description": "Activate to steal 10% of the maximum Health of nearby enemy Heroes.",
        "hero": "Diablo",
        "id": "DiabloTalentLordOfTerror"
    },
    {
        "image": "rolling-like-a-stone.png",
        "level": "1",
        "name": "Rolling Like a Stone",
        "icon": "storm_ui_icon_psionicblast_2.dds",
        "cooldown": 12,
        "description": "Increases the range of Powerslide by 25%.",
        "hero": "E.T.C.",
        "id": "ETCMasteryRollingLikeaStone"
    },
    {
        "image": "death-ritual.png",
        "level": "1",
        "name": "Death Ritual",
        "icon": "storm_temp_war3_btndrain.dds",
        "description": "Permanently gain 5 Health and 3 Mana when a Minion or captured Mercenary dies under Voodoo Ritual.",
        "hero": "Nazeebo",
        "id": "WitchDoctorCombatStyleDeathRitual"
    },
    {
        "image": "forced-recruitment.png",
        "level": "20",
        "name": "Forced Recruitment",
        "icon": "storm_temp_war3_btnfelguard.dds",
        "cooldown": 30,
        "description": "Reduces General of Hell's cooldown by 10 seconds and gains an additional charge.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryForcedRecruitment"
    },
    {
        "image": "envenomed-nest.png",
        "level": "1",
        "name": "Envenomed Nest",
        "icon": "storm_ui_icon_abathur_toxicnest.dds",
        "cooldown": 10,
        "description": "Toxic Nests deal 75% more damage over 3 seconds.",
        "hero": "Abathur",
        "id": "AbathurMasteryEnvenomedNestsToxicNest"
    },
    {
        "image": "confident-aim.png",
        "level": "4",
        "name": "Confident Aim",
        "icon": "storm_ui_icon_raynor_penetratinground.dds",
        "cooldown": 12,
        "description": "Lowers the cooldown of Penetrating Round by 4 seconds if it hits an enemy Hero.",
        "hero": "Raynor",
        "id": "RaynorInspireConfidentAim"
    },
    {
        "image": "taking-flight.png",
        "level": "4",
        "name": "Taking Flight",
        "icon": "storm_ui_icon_rexxar_spiritswoop.dds",
        "cooldown": 7,
        "description": "Increases Spirit Swoop's range by 20%. If Spirit Swoop hits an enemy Hero, the Mana cost is refunded.",
        "hero": "Rexxar",
        "id": "RexxarTakingFlightSpiritSwoop"
    },
    {
        "image": "fires-of-hell.png",
        "level": "20",
        "name": "Fires of Hell",
        "icon": "storm_ui_icon_Butcher_FurnaceBlast.dds",
        "cooldown": 90,
        "description": "Furnace Blast explodes a second time 3 seconds after the initial explosion.",
        "hero": "Butcher",
        "id": "ButcherMasteryFiresofHell"
    },
    {
        "image": "manticore.png",
        "level": "4",
        "name": "Manticore",
        "icon": "storm_ui_icon_valla_hatred.dds",
        "description": "Every 3rd Basic Attack against the same target deals 50% additional damage.",
        "hero": "Valla",
        "id": "DemonHunterCombatStyleManticore"
    },
    {
        "image": "rampage.png",
        "level": "16",
        "name": "Rampage",
        "icon": "storm_temp_war3_btnwalloffire.dds",
        "cooldown": 6,
        "description": "Fire Stomp increases Diablo's Movement Speed by 20% and Basic Attack damage by 50% for 2 seconds.",
        "hero": "Diablo",
        "id": "DiabloTalentRampageFireStomp"
    },
    {
        "image": "siphoning-impact.png",
        "level": "1",
        "name": "Siphoning Impact",
        "icon": "storm_ui_icon_kerrigan_ravage.dds",
        "cooldown": 8,
        "description": "Ravage heals you for 10.15% of your maximum Health if it hits an enemy.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryRavageSiphoningImpact"
    },
    {
        "image": "broodling-nest.png",
        "level": "20",
        "name": "Broodling Nest",
        "icon": "storm_ui_icon_zagara_nydusworm.dds",
        "cooldown": 60,
        "description": "Exiting a Nydus Worm spawns 6 broodlings to attack up the nearest lane. This effect has a 20 second cooldown.",
        "hero": "Zagara",
        "id": "ZagaraMasteryBroodlingNest"
    },
    {
        "image": "mystical-spear.png",
        "level": "13",
        "name": "Mystical Spear",
        "icon": "storm_ui_icon_sonya_ancientspear.dds",
        "cooldown": 13,
        "description": "Reduces the cooldown of Ancient Spear by 4 seconds. You are pulled to the target location even if you don't hit an enemy.",
        "hero": "Sonya",
        "id": "BarbarianMasteryMysticalSpearAncientSpear"
    },
    {
        "image": "burden-of-guilt.png",
        "level": "7",
        "name": "Burden of Guilt",
        "icon": "storm_ui_icon_hammerofjustice_2.dds",
        "cooldown": 10,
        "description": "After Hammer of Justice's stun fades, the enemy's Movement Speed is slowed by 30% for 2 seconds.",
        "hero": "Uther",
        "id": "UtherMasteryBurdenofGuilt"
    },
    {
        "image": "reciprocate.png",
        "level": "7",
        "name": "Reciprocate",
        "icon": "storm_ui_icon_tyrael_righteousness.dds",
        "cooldown": 12,
        "description": "When your shield expires, it explodes for 90 (+12 per level) damage to nearby enemies.",
        "hero": "Tyrael",
        "id": "TyraelMasteryRighteousnessReciprocate"
    },
    {
        "image": "ride-the-wind.png",
        "level": "16",
        "name": "Ride The Wind",
        "icon": "storm_ui_icon_thrall_windfury.dds",
        "cooldown": 12,
        "description": "Increases Windfury's Movement Speed bonus from 30% to 40%. Windfury attacks increase the Movement Speed duration by 1 second.",
        "hero": "Thrall",
        "id": "ThrallMasteryRideTheWind"
    },
    {
        "image": "blink-heal.png",
        "level": "10",
        "name": "Blink Heal",
        "icon": "storm_temp_war3_btnphaseshift.dds",
        "cooldown": 10,
        "description": "Teleport to a nearby ally, healing them for 108 (+17 per level).  Can store 2 charges.",
        "hero": "Brightwing",
        "id": "FaerieDragonHeroicAbilityBlinkHeal"
    },
    {
        "image": "hivemind.png",
        "level": "20",
        "name": "Hivemind",
        "icon": "storm_ui_icon_abathur_symbiote.dds",
        "cooldown": 4,
        "description": "Symbiote creates an additional Symbiote on a nearby allied Hero.  This Symbiote mimics the commands of the first.",
        "hero": "Abathur",
        "id": "AbathurSymbioteHivemind"
    },
    {
        "image": "fresh-corpses.png",
        "level": "7",
        "name": "Fresh Corpses",
        "icon": "storm_btn_d3_witchdoctor_wallofzombies.dds",
        "cooldown": 14,
        "description": "Zombie Wall cooldown reduced by 4 seconds.",
        "hero": "Nazeebo",
        "id": "WitchDoctorMasteryFreshCorpses"
    },
    {
        "image": "tempered-by-discipline.png",
        "level": "13",
        "name": "Tempered by Discipline",
        "icon": "storm_ui_icon_valla_hatred.dds",
        "description": "Gain up to 10 stacks of Discipline after Hatred stacks are maxed. Basic Attacks heal for 3% of damage dealt to the primary target per Discipline stack.",
        "hero": "Valla",
        "id": "DemonHunterCombatStyleTemperedByDiscipline"
    },
    {
        "image": "frostbitten.png",
        "level": "7",
        "name": "Frostbitten",
        "icon": "storm_ui_icon_jaina_frostbite.dds",
        "description": "Increases the damage bonus of Frostbite from 50% to 65%.",
        "hero": "Jaina",
        "id": "JainaMasteryFrostbitten"
    },
    {
        "image": "stoneform.png",
        "level": "16",
        "name": "Stoneform",
        "icon": "storm_btn_d3_barbarian_ignorepain.dds",
        "cooldown": 60,
        "description": "Activate to heal for 50% of your maximum Health over 8 seconds. Second Wind is disabled during this time.",
        "hero": "Muradin",
        "id": "MuradinMasteryPassiveStoneform"
    },
    {
        "image": "olaf-the-stout.png",
        "level": "1",
        "name": "Olaf the Stout",
        "icon": "storm_ui_icon_lostvikings_selectolaf.dds",
        "description": "Every 8 seconds Olaf can block a Basic Attack, reducing its damage by 75%.  Can store up to 2 charges.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryOlafTheStout"
    },
    {
        "image": "ride-the-lightning.png",
        "level": "4",
        "name": "Ride The Lightning",
        "icon": "storm_ui_icon_thrall_chainlightning.dds",
        "cooldown": 6,
        "description": "Chain Lightning can hit 2 additional enemies for 50% damage.",
        "hero": "Thrall",
        "id": "ThrallMasteryRideTheLightning"
    },
    {
        "image": "soul-steal.png",
        "level": "7",
        "name": "Soul Steal",
        "icon": "storm_temp_war3_btnsoulgem.dds",
        "description": "Increases the amount of Health gained from Black Soulstone by 50%.",
        "hero": "Diablo",
        "id": "DiabloMasterySoulStealBlackSoulstone"
    },
    {
        "image": "tour-bus.png",
        "level": "20",
        "name": "Tour Bus",
        "icon": "storm_temp_war3_btnbattleroar.dds",
        "cooldown": 120,
        "description": "Mosh Pit refreshes the cooldown of Powerslide. You can Powerslide during Mosh Pit, which also increases its duration by 2 seconds.",
        "hero": "E.T.C.",
        "id": "L90ETCMasteryMoshPitTourBus"
    },
    {
        "image": "engine-gunk.png",
        "level": "7",
        "name": "Engine Gunk",
        "icon": "storm_ui_icon_rockitturret.dds",
        "cooldown": 15,
        "description": "Turret attacks slow Movement Speed by 25% for 2 seconds.",
        "hero": "Gazlowe",
        "id": "TinkerMasterySapperTurrets"
    },
    {
        "image": "shade-form.png",
        "level": "7",
        "name": "Shade Form",
        "icon": "storm_ui_icon_sylvanas_hauntingwave.dds",
        "cooldown": 11,
        "description": "Haunting Wave grants Stealth for 3 seconds. Activating the teleport does not break the Stealth.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentShadeform"
    },
    {
        "image": "ancestral-healing.png",
        "level": "10",
        "name": "Ancestral Healing",
        "icon": "storm_temp_war3_btnresistmagic.dds",
        "cooldown": 70,
        "description": "After a short delay, heal an allied Hero for 600 (+140 per level) Health.",
        "hero": "Rehgar",
        "id": "RehgarHeroicAbilityAncestralHealing"
    },
    {
        "image": "protective-prison.png",
        "level": "20",
        "name": "Protective Prison",
        "icon": "storm_ui_icon_zeratul_voidprison.dds",
        "cooldown": 100,
        "description": "Allies are also no longer affected by Void Prison.",
        "hero": "Zeratul",
        "id": "ZeratulMasteryProtectivePrisonVoidPrison"
    },
    {
        "image": "orbital-bfg.png",
        "level": "20",
        "name": "Orbital BFG",
        "icon": "storm_ui_icon_sgthammer_bluntforcegun.dds",
        "cooldown": 70,
        "description": "Blunt Force Gun's missile orbits the planet every 5 seconds. Only the last missile fired orbits.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerMasteryOrbitalBFGBluntForceGun"
    },
    {
        "image": "aspect-of-the-beast.png",
        "level": "7",
        "name": "Aspect of the Beast",
        "icon": "storm_ui_icon_rexxar_mishacharge.dds",
        "cooldown": 12,
        "description": "Misha's Basic Attacks lower the cooldown of Misha, Charge! by 2 seconds.",
        "hero": "Rexxar",
        "id": "RexxarAspectoftheBeastCharge"
    },
    {
        "image": "centrifugal-hooks.png",
        "level": "1",
        "name": "Centrifugal Hooks",
        "icon": "storm_ui_icon_zagara_banelingbarrage.dds",
        "cooldown": 10,
        "description": "Banelings can travel twice as far before exploding.",
        "hero": "Zagara",
        "id": "ZagaraMasteryCentrifugalHooks"
    },
    {
        "image": "power-throw.png",
        "level": "1",
        "name": "Power Throw",
        "icon": "storm_temp_war3_btnfeedback.dds",
        "cooldown": 10,
        "description": "Increase the range of Hammerang by 40% and the slow duration by 25%.",
        "hero": "Falstad",
        "id": "FalstadMasteryHammerangPowerThrow"
    },
    {
        "image": "bullseye.png",
        "level": "16",
        "name": "Bullseye",
        "icon": "storm_ui_icon_raynor_penetratinground.dds",
        "cooldown": 12,
        "description": "The first enemy hit by Penetrating Round is stunned for 1.5 seconds.",
        "hero": "Raynor",
        "id": "RaynorMasteryBullseyePenetratingRound"
    },
    {
        "image": "spy-games.png",
        "level": "1",
        "name": "Spy Games",
        "icon": "storm_ui_icon_lostvikings_selecterik.dds",
        "description": "After standing still for 3 seconds, Erik gains Stealth and his Sight Radius is increased by 75%. The Stealth persists for 3 seconds after moving.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasterySpyGames"
    },
    {
        "image": "pain-dont-hurt.png",
        "level": "4",
        "name": "Pain Don't Hurt",
        "icon": "storm_ui_icon_lostvikings_selectbaleog.dds",
        "description": "Baleog's Basic Attacks and splash damage heal for 20% of the damage dealt. Healing is doubled against Heroes.",
        "hero": "The Lost Vikings",
        "id": "LostVikingsMasteryPainDontHurt"
    },
    {
        "image": "kung-fu-hustle.png",
        "level": "20",
        "name": "Kung Fu Hustle",
        "icon": "ui_targetportrait_hero_lili.dds",
        "description": "Ability cooldowns refresh 150% faster while Fast Feet is active.",
        "hero": "Li Li",
        "id": "LiLiMasteryKungFuHustle"
    },
    {
        "image": "vile-nest.png",
        "level": "7",
        "name": "Vile Nest",
        "icon": "storm_ui_icon_abathur_toxicnest.dds",
        "cooldown": 10,
        "description": "Toxic Nests slow enemy Movement Speed by 50% for 4 seconds.",
        "hero": "Abathur",
        "id": "AbathurMasteryVileNestsToxicNest"
    },
    {
        "image": "rapid-displacement.png",
        "level": "1",
        "name": "Rapid Displacement",
        "icon": "storm_ui_icon_zeratul_blink.dds",
        "cooldown": 10,
        "description": "Reduces the cooldown of Blink by 1.5 seconds.",
        "hero": "Zeratul",
        "id": "ZeratulMasteryRapidDisplacementBlink"
    },
    {
        "image": "one-in-the-chamber.png",
        "level": "7",
        "name": "One in the Chamber",
        "icon": "storm_btn-extra_int_0.dds",
        "description": "After using an ability, your next Basic Attack deals 80% additional damage.",
        "hero": "Nova",
        "id": "NovaCombatStyleOneintheChamber"
    },
    {
        "image": "hyper-shift.png",
        "level": "1",
        "name": "Hyper Shift",
        "icon": "storm_ui_icon_epicmount.dds",
        "cooldown": 45,
        "description": "Every time you heal a Hero with Soothing Mist, reduce the cooldown of Phase Shift by 2 seconds.",
        "hero": "Brightwing",
        "id": "BrightwingHyperShiftPhaseShift"
    },
    {
        "image": "hold-your-ground.png",
        "level": "13",
        "name": "Hold Your Ground",
        "icon": "storm_ui_icon_johanna_iron_skin.dds",
        "cooldown": 20,
        "description": "Increases Iron Skin's Shield by 20%, and if the Shield is destroyed by damage the cooldown is reduced by 4 seconds.",
        "hero": "Johanna",
        "id": "CrusaderMasteryIronSkinHoldYourGround"
    },
    {
        "image": "gluttony.png",
        "level": "4",
        "name": "Gluttony",
        "icon": "storm_temp_war3_btnsoulburn.dds",
        "cooldown": 6,
        "description": "All Shall Burn heals you for 15% of the damage dealt.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryGluttony"
    },
    {
        "image": "annihilating-spirit.png",
        "level": "20",
        "name": "Annihilating Spirit",
        "icon": "storm_btn_d3_witchdoctor_locustswarm.dds",
        "cooldown": 90,
        "description": "Increases the range of Ravenous Spirit by 50% and Movement Speed by 30%.",
        "hero": "Nazeebo",
        "id": "WitchDoctorMasteryAnnihilatingSpirits"
    },
    {
        "image": "anger-management.png",
        "level": "20",
        "name": "Anger Management",
        "icon": "storm_ui_icon_sonya_wrathoftheberserker.dds",
        "cooldown": 45,
        "description": "Increases Wrath of the Berserker's reduction of disables to 75%, and also increases all Fury generated during Wrath by 50%.",
        "hero": "Sonya",
        "id": "BarbarianMasteryAngerManagementWrathoftheBerserker"
    },
    {
        "image": "shield-surge.png",
        "level": "16",
        "name": "Shield Surge",
        "icon": "storm_ui_icon_artanis_shieldoverload.dds",
        "description": "Increases Shield Overload's Shields by 50%, but decays to the normal amount over 3 seconds.",
        "hero": "Artanis",
        "id": "ArtanisShieldOverloadShieldSurge"
    },
    {
        "image": "tufferfish.png",
        "level": "4",
        "name": "Tufferfish",
        "icon": "storm_temp_war3_btnmurloc.dds",
        "cooldown": 15,
        "description": "Pufferfish take an additional attack before being disarmed.",
        "hero": "Murky",
        "id": "MurkyMasteryTufferfish"
    },
    {
        "image": "spirit-journey.png",
        "level": "4",
        "name": "Spirit Journey",
        "icon": "storm_ui_icon_thrall_feralspirit.dds",
        "cooldown": 12,
        "description": "Feral Spirit travels 50% farther.",
        "hero": "Thrall",
        "id": "ThrallMasterySpiritJourney"
    },
    {
        "image": "snowstorm.png",
        "level": "4",
        "name": "Snowstorm",
        "icon": "storm_ui_icon_jaina_blizzard.dds",
        "cooldown": 15,
        "description": "Increases the radius of Blizzard by 30%.",
        "hero": "Jaina",
        "id": "JainaMasterySnowstorm"
    },
    {
        "image": "shield-sequencer.png",
        "level": "16",
        "name": "Shield Sequencer",
        "icon": "storm_ui_icon_medic_deployshield_c.dds",
        "cooldown": 15,
        "description": "After casting Safeguard, you can cast it a second time within 3 seconds at no cost.",
        "hero": "Lt. Morales",
        "id": "MedicShieldSequencer"
    },
    {
        "image": "force-of-will.png",
        "level": "20",
        "name": "Force of Will",
        "icon": "storm_ui_icon_artanis_shieldoverload.dds",
        "description": "Increases Shield Overload's cooldown reduction from Basic Attacks to 6 seconds.",
        "hero": "Artanis",
        "id": "ArtanisShieldOverloadForceofWill"
    },
    {
        "image": "jug-of-1-000-000-cups.png",
        "level": "20",
        "name": "Jug of 1,000,000 Cups",
        "icon": "storm_temp_war3_btnotherbarrel.dds",
        "cooldown": 70,
        "description": "Jug of 1,000 Cups hits two targets at a time.",
        "hero": "Li Li",
        "id": "LiLiMasteryJugof1000CupsJugof1000000Cups"
    },
    {
        "image": "target-purified.png",
        "level": "20",
        "name": "Target Purified",
        "icon": "storm_ui_icon_artanis_purifierbeam.dds",
        "cooldown": 80,
        "description": "If the target of Purifier Beam dies, it automatically recasts on the nearest enemy Hero.",
        "hero": "Artanis",
        "id": "ArtanisSpearofAdunPurifierBeamTargetPurified"
    },
    {
        "image": "hungry-for-more.png",
        "level": "1",
        "name": "Hungry for More",
        "icon": "storm_btn_d3_wizard_energyarmor.dds",
        "description": "Collecting Regeneration Globes permanently increases your maximum Health by 30.",
        "hero": "Stitches",
        "id": "StitchesHungryforMore"
    },
    {
        "image": "empower.png",
        "level": "1",
        "name": "Empower",
        "icon": "storm_temp_war3_btnscout.dds",
        "cooldown": 18,
        "description": "When Sentinel impacts, your cooldowns are instantly reduced by 2 seconds.",
        "hero": "Tyrande",
        "id": "TyrandeMasterySentinelEmpower"
    },
    {
        "image": "inoculation.png",
        "level": "16",
        "name": "Inoculation",
        "icon": "storm_ui_icon_medic_deployshield.dds",
        "cooldown": 15,
        "description": "Increases Safeguard's initial damage reduction to 50% for the first 1.5 seconds.",
        "hero": "Lt. Morales",
        "id": "MedicInoculation"
    },
    {
        "image": "consuming-flame.png",
        "level": "1",
        "name": "Consuming Flame",
        "icon": "storm_temp_war3_btnbreathoffire.dds",
        "cooldown": 5,
        "description": "Breath of Fire's burn effect when used on Brew-soaked targets is increased by 2 seconds.",
        "hero": "Chen",
        "id": "ChenMasteryBreathOfFireConsumingFlame"
    },
    {
        "image": "advanced-lava-strike.png",
        "level": "20",
        "name": "Advanced Lava Strike",
        "icon": "storm_ui_icon_sgthammer_napalmstrike.dds",
        "cooldown": 6,
        "description": "Napalm Strike's range is increased by 75% and its impact does 50% more damage.",
        "hero": "Sgt. Hammer",
        "id": "SgtHammerMasteryAdvancedLavaStrikeNapalmStrike"
    },
    {
        "image": "continuous-winds.png",
        "level": "20",
        "name": "Continuous Winds",
        "icon": "storm_temp_war3_btncyclone.dds",
        "cooldown": 60,
        "description": "Emerald Wind releases two additional novas that deal 25% damage.",
        "hero": "Brightwing",
        "id": "FaerieDragonMasteryContinuousWinds"
    },
    {
        "image": "infused-power.png",
        "level": "7",
        "name": "Infused Power",
        "icon": "storm_temp_war3_btnsoulburn.dds",
        "cooldown": 6,
        "description": "All Shall Burn gains an additional charge level, increasing its maximum damage by 25%.",
        "hero": "Azmodan",
        "id": "AzmodanMasteryInfusedPower"
    },
    {
        "image": "assault-strain.png",
        "level": "13",
        "name": "Assault Strain",
        "icon": "storm_ui_icon_abathur_spawnlocust.dds",
        "description": "Locust Basic Attacks cleave for 50% damage, and explode on death for 50 (+5 per level) damage.",
        "hero": "Abathur",
        "id": "AbathurCombatStyleAssaultStrain"
    },
    {
        "image": "graviton-vortex.png",
        "level": "13",
        "name": "Graviton Vortex",
        "icon": "storm_ui_icon_artanis_repositionmatrix.dds",
        "cooldown": 14,
        "description": "Phase Prism pulls and damages an additional enemy Hero near the first.",
        "hero": "Artanis",
        "id": "ArtanisPhasePrismGravitonVortex"
    },
    {
        "image": "promote.png",
        "level": "4",
        "name": "Promote",
        "icon": "storm_temp_war3_btngnollcommandaura.dds",
        "cooldown": 30,
        "description": "Activate to cause an allied lane Minion to take 75% reduced damage from non-Heroic targets and deal 100% bonus damage to non-Heroic targets for 30 seconds. Has 2 charges.",
        "hero": "Tassadar",
        "id": "GenericTalentPromote"
    },
    {
        "image": "death-march.png",
        "level": "20",
        "name": "Death March",
        "icon": "storm_ui_icon_leoric_R2.dds",
        "cooldown": 80,
        "description": "Your final swing of March of the Black King also applies the base version of Drain Hope to all enemy Heroes in a large area.",
        "hero": "Leoric",
        "id": "LeoricMasteryDeathMarchMarchoftheBlackKing"
    },
    {
        "image": "frost-shot.png",
        "level": "13",
        "name": "Frost Shot",
        "icon": "storm_ui_icon_valla_multishot.dds",
        "cooldown": 8,
        "description": "Multishot also slows by 40% for 2 seconds.",
        "hero": "Valla",
        "id": "DemonHunterMasteryFrostShot"
    },
    {
        "image": "urticating-spines.png",
        "level": "7",
        "name": "Urticating Spines",
        "icon": "storm_temp_war3_btnspikedbarricades.dds",
        "cooldown": 8,
        "description": "Casting Harden Carapace will also deal 50 (+9 per level) damage to nearby enemies.",
        "hero": "Anub'arak",
        "id": "AnubarakMasteryUrticatingSpines"
    },
    {
        "image": "purge-evil.png",
        "level": "1",
        "name": "Purge Evil",
        "icon": "storm_ui_icon_tyrael_smite.dds",
        "cooldown": 7,
        "description": "Smite deals 25% more damage to Heroes.",
        "hero": "Tyrael",
        "id": "TyraelMasteryPurgeEvil"
    },
    {
        "image": "shadow-assault.png",
        "level": "10",
        "name": "Shadow Assault",
        "icon": "storm_ui_icon_zeratul_shadowassault.dds",
        "cooldown": 100,
        "description": "Your Basic Attacks cause you to charge at enemies and have 20% increased Attack Speed. Lasts for 6 seconds.",
        "hero": "Zeratul",
        "id": "ZeratulHeroicAbilityShadowAssault"
    },
    {
        "image": "dwarf-launch.png",
        "level": "16",
        "name": "Dwarf Launch",
        "icon": "storm_ui_icon_dwarftoss.dds",
        "cooldown": 12,
        "description": "Increases the range and impact radius of Dwarf Toss by 50%.",
        "hero": "Muradin",
        "id": "MuradinMasteryDwarfLaunch"
    },
    {
        "image": "hammer-of-the-lightbringer.png",
        "level": "4",
        "name": "Hammer of the Lightbringer",
        "icon": "storm_ui_icon_hammerofjustice_3.dds",
        "description": "Basic Attacks also restore 8 Mana.",
        "hero": "Uther",
        "id": "UtherCombatStyleHammeroftheLightbringer"
    },
    {
        "image": "octo-grab.png",
        "level": "10",
        "name": "Octo-Grab",
        "icon": "storm_ui_icon_netlauncher.dds",
        "cooldown": 50,
        "description": "Summon an octopus to stun target enemy Hero for 3.0625 seconds while you hit them for 1 damage a second.",
        "hero": "Murky",
        "id": "MurkyHeroicAbilityOctoGrab"
    },
    {
        "image": "flamethrower.png",
        "level": "13",
        "name": "Flamethrower",
        "icon": "storm_ui_icon_kaelthas_flamestrike.dds",
        "cooldown": 7,
        "description": "Increases the cast range of Flamestrike by 50%.",
        "hero": "Kael'thas",
        "id": "KaelthasMasteryFlamethrower"
    },
    {
        "image": "toxic-gas.png",
        "level": "7",
        "name": "Toxic Gas",
        "icon": "storm_ui_icon_stitches_acidcloud.dds",
        "description": "Increases Vile Gas radius by 50% and the duration of the effect by 1 second.",
        "hero": "Stitches",
        "id": "StitchesCombatStyleToxicGas"
    },
    {
        "image": "trueshot-aura.png",
        "level": "16",
        "name": "Trueshot Aura",
        "icon": "storm_temp_war3_btntrueshot.dds",
        "description": "You passively grant 15% Basic Attack damage to nearby allies.",
        "hero": "Tyrande",
        "id": "TyrandeCombatStyleTrueshotBow"
    },
    {
        "image": "queens-rush.png",
        "level": "13",
        "name": "Queen's Rush",
        "icon": "storm_ui_temp_icon_sprint.dds",
        "cooldown": 75,
        "description": "Activate to increase your Movement Speed by 25% for 4 seconds. Queen's Rush is also applied for free on Takedowns.",
        "hero": "Kerrigan",
        "id": "KerriganQueensRush"
    },
    {
        "image": "psionic-synergy.png",
        "level": "7",
        "name": "Psionic Synergy",
        "icon": "storm_ui_icon_artanis_powerstrikes.dds",
        "cooldown": 10,
        "description": "Every time Blade Dash hits an enemy Hero, it reduces Shield Overload's cooldown by 4 seconds.",
        "hero": "Artanis",
        "id": "ArtanisBladeDashPsionicSynergy"
    },
    {
        "image": "brewmasters-balance.png",
        "level": "7",
        "name": "Brewmaster's Balance",
        "icon": "storm_temp_war3_btnstrongdrink.dds",
        "cooldown": 5,
        "description": "While at or below 50 Brew, gain 20% Movement Speed. While at or above 50 Brew, regenerate an additional 10 (+1.5 per level) Health per second.",
        "hero": "Chen",
        "id": "ChenMasteryBrewmastersBalance"
    },
    {
        "image": "charged-up.png",
        "level": "4",
        "name": "Charged Up",
        "icon": "storm_temp_war3_btnchainlightning.dds",
        "cooldown": 15,
        "description": "Lightning Rod strikes the target 2 additional times.",
        "hero": "Falstad",
        "id": "FalstadMasteryLightningRodChargedUp"
    },
    {
        "image": "subdue.png",
        "level": "13",
        "name": "Subdue",
        "icon": "storm_ui_icon_johanna_punish.dds",
        "cooldown": 8,
        "description": "Increases Punish's slow to 80% decaying over 3 seconds.",
        "hero": "Johanna",
        "id": "CrusaderMasteryPunishSubdue"
    },
    {
        "image": "armor-piercing-rounds.png",
        "level": "1",
        "name": "Armor Piercing Rounds",
        "icon": "storm_ui_icon_tychus_overkill.dds",
        "cooldown": 15,
        "description": "Overkill's damage to the primary target increased by 20%.",
        "hero": "Tychus",
        "id": "TychusMasteryOverkillArmorPiercingRounds"
    },
    {
        "image": "quicksilver.png",
        "level": "13",
        "name": "Quicksilver",
        "icon": "storm_ui_icon_monk_dash.dds",
        "cooldown": 12,
        "description": "Radiant Dashing to an ally gives you and the target 30% bonus Movement Speed for 3 seconds.",
        "hero": "Kharazim",
        "id": "MonkQuicksilverRadiantDash"
    },
    {
        "image": "quickening-blessing.png",
        "level": "7",
        "name": "Quickening Blessing",
        "icon": "storm_temp_war3_btnheal.dds",
        "cooldown": 8,
        "description": "If cast on an ally, Light of Elune also increases their Movement Speed by 25% for 3 seconds.",
        "hero": "Tyrande",
        "id": "TyrandeMasteryLightofEluneQuickeningBlessing"
    },
    {
        "image": "cost-effective-materials.png",
        "level": "1",
        "name": "Cost-Effective Materials",
        "icon": "storm_ui_icon_valla_hungeringarrow.dds",
        "cooldown": 14,
        "description": "Reduces the Mana cost of Hungering Arrow by 30.",
        "hero": "Valla",
        "id": "DemonHunterMasteryCostEffectiveMaterialsHungeringArrow"
    },
    {
        "image": "primal-intimidation.png",
        "level": "16",
        "name": "Primal Intimidation",
        "icon": "storm_btn_d3_barbarian_calloftheancients.dds",
        "cooldown": 20,
        "description": "Enemies that Basic Attack you or Misha have their Attack Speed slowed by 40%.",
        "hero": "Rexxar",
        "id": "RexxarSpiritBondPrimalIntimidation"
    },
    {
        "image": "torrasque.png",
        "level": "20",
        "name": "Torrasque",
        "icon": "storm_ui_icon_kerrigan_ultralisk.dds",
        "cooldown": 80,
        "description": "The Ultralisk morphs into an egg when it dies. If the egg isn't killed within 8 seconds, a new Ultralisk is born.",
        "hero": "Kerrigan",
        "id": "KerriganMasteryTorrasqueSummonUltralisk"
    },
    {
        "image": "last-bite.png",
        "level": "7",
        "name": "Last Bite",
        "icon": "storm_ui_icon_stitches_devour.dds",
        "cooldown": 20,
        "description": "If an enemy dies within 3 seconds of being damaged by Devour, its cooldown is reduced by 15 seconds.",
        "hero": "Stitches",
        "id": "StitchesMasteryLastBiteDevour"
    },
    {
        "image": "eternal-hunger.png",
        "level": "1",
        "name": "Eternal Hunger",
        "icon": "storm_temp_war3_btnfrostmourne.dds",
        "cooldown": 12,
        "description": "Mana restored by Frostmourne Hungers increased to 60.",
        "hero": "Arthas",
        "id": "ArthasMasteryEternalHungerArthasFrostmourneHungers"
    },
    {
        "image": "royal-focus.png",
        "level": "4",
        "name": "Royal Focus",
        "icon": "storm_ui_icon_leoric_WraithWalk.dds",
        "cooldown": 14,
        "description": "If your body takes no damage during Wraith Walk's duration, the cooldown is reduced to 4 seconds.",
        "hero": "Leoric",
        "id": "LeoricMasteryRoyalFocusWraithWalk"
    },
    {
        "image": "frostmourne-feeds.png",
        "level": "16",
        "name": "Frostmourne Feeds",
        "icon": "storm_temp_war3_btnfrostmourne.dds",
        "cooldown": 12,
        "description": "Increased application to your next 2 Basic Attacks.",
        "hero": "Arthas",
        "id": "ArthasMasteryFrostmourneFeedsArthasFrostmourneHungers"
    },
    {
        "image": "pixie-boost.png",
        "level": "13",
        "name": "Pixie Boost",
        "icon": "storm_temp_war3_btnscatterrockets.dds",
        "cooldown": 10,
        "description": "Pixie Dust gives 50% bonus Move Speed, decaying to 20% over 1.5 seconds.",
        "hero": "Brightwing",
        "id": "BrightwingPixieBoostPixieDust"
    },
    {
        "image": "block.png",
        "level": "1",
        "name": "Block",
        "icon": "storm_temp_war3_btndefend.dds",
        "description": "Periodically reduces the damage received from Hero Basic Attacks by 50%.  Stores up to 2 charges.",
        "hero": "Zeratul",
        "id": "GenericTalentBlock"
    },
    {
        "image": "enraged.png",
        "level": "16",
        "name": "Enraged",
        "icon": "storm_temp_war3_btnstampede.dds",
        "description": "Receiving damage that reduces you below 50% of your maximum Health causes you to become Enraged for 10 seconds. You gain 40% Attack Speed and reduce the duration of slows, stuns, silences, and roots against you by 75% while Enraged.",
        "hero": "Butcher",
        "id": "ButcherTalentEnraged"
    },
    {
        "image": "barkskin.png",
        "level": "13",
        "name": "Barkskin",
        "icon": "storm_ui_icon_rexxar_mishacharge.dds",
        "cooldown": 12,
        "description": "Misha takes 50% less damage from Abilities for 5 seconds after using Misha, Charge!",
        "hero": "Rexxar",
        "id": "RexxarBarkskin"
    },
    {
        "image": "windrunner.png",
        "level": "16",
        "name": "Windrunner",
        "icon": "storm_ui_icon_sylvanas_hauntingwave.dds",
        "cooldown": 11,
        "description": "After you teleport from Haunting Wave, you can cast a second one for free within 2 seconds.",
        "hero": "Sylvanas",
        "id": "SylvanasTalentWindrunnerHauntingWave"
    },
    {
        "image": "fission-bomb.png",
        "level": "7",
        "name": "Fission Bomb",
        "icon": "storm_ui_icon_kaelthas_livingbomb.dds",
        "cooldown": 10,
        "description": "Increases Living Bomb's explosion radius and damage by 30%.",
        "hero": "Kael'thas",
        "id": "KaelthasLivingBombFissionBomb"
    },
    {
        "image": "arcane-power.png",
        "level": "20",
        "name": "Arcane Power",
        "icon": "storm_btn_wow_arcanepower.dds",
        "cooldown": 60,
        "description": "Activate to instantly restore 400 Mana and increase Ability Power by 15% for 5 seconds.",
        "hero": "Kael'thas",
        "id": "GenericArcanePower"
    },
    {
        "image": "shield-battery.png",
        "level": "4",
        "name": "Shield Battery",
        "icon": "storm_ui_icon_artanis_shieldoverload.dds",
        "description": "Reduces Shield Overload's cooldown by 6 seconds if it lasts for the full duration.",
        "hero": "Artanis",
        "id": "ArtanisShieldOverloadShieldBattery"
    },
    {
        "image": "empowering-charge.png",
        "level": "1",
        "name": "Empowering Charge",
        "icon": "storm_temp_war3_btnlightningshield.dds",
        "cooldown": 8,
        "description": "Lightning Shield also increases the damage of the target's next 3 Basic Attacks by 30%.",
        "hero": "Rehgar",
        "id": "RehgarMasteryEmpoweringCharge"
    },
    {
        "image": "pyroblast.png",
        "level": "10",
        "name": "Pyroblast",
        "icon": "storm_ui_icon_kaelthas_pyroblast.dds",
        "cooldown": 50,
        "description": "After 2 seconds, cast a slow-moving fireball that deals 300 (+65 per level) damage to an enemy Hero and 150 (+32.5 per level) damage to enemies nearby.",
        "hero": "Kael'thas",
        "id": "KaelthasHeroicAbilityPyroblast"
    },
    {
        "image": "medbay.png",
        "level": "20",
        "name": "Medbay",
        "icon": "storm_ui_icon_medic_medivacdropship.dds",
        "cooldown": 50,
        "description": "Medivac heals nearby allies and everyone aboard for 100 (+10 per level) Health per second.",
        "hero": "Lt. Morales",
        "id": "MedicMedbay"
    },
    {
        "image": "hindering-winds.png",
        "level": "13",
        "name": "Hindering Winds",
        "icon": "storm_temp_war3_btndeathanddecay.dds",
        "cooldown": 10,
        "description": "Blinding Wind also slows enemy Movement Speed by 25% for 2 seconds.",
        "hero": "Li Li",
        "id": "LiLiMasteryBlindingWindHinderingWinds"
    },
    {
        "image": "psi-op-rangefinder.png",
        "level": "1",
        "name": "Psi-Op Rangefinder",
        "icon": "storm_ui_icon_nova_snipe.dds",
        "cooldown": 10,
        "description": "Increases Snipe's range by 20% and reduces the Cooldown by 2 seconds.",
        "hero": "Nova",
        "id": "NovaMasteryPsiOpRangefinder"
    },
    {
        "image": "pro-toss.png",
        "level": "1",
        "name": "Pro Toss",
        "icon": "storm_temp_war3_btnsnazzypotion.dds",
        "cooldown": 3,
        "description": "Increases the range of Healing Brew by 30%.",
        "hero": "Li Li",
        "id": "LiLiMasteryHealingBrewProToss"
    },
    {
        "image": "second-opinion.png",
        "level": "16",
        "name": "Second Opinion",
        "icon": "storm_ui_icon_medic_displacementgrenade_b.dds",
        "cooldown": 12,
        "description": "Reduces Displacement Grenade's cooldown by 2 seconds and it now holds a second charge.",
        "hero": "Lt. Morales",
        "id": "MedicSecondOpinion"
    },
    {
        "image": "soul-feast.png",
        "level": "1",
        "name": "Soul Feast",
        "icon": "storm_temp_war3_btnsoulgem.dds",
        "description": "Black Soulstone increases your Health Regeneration by 3% per Soul.",
        "hero": "Diablo",
        "id": "DiabloMasterySoulFeastBlackSoulstone"
    },
    {
        "image": "clear.png",
        "level": "7",
        "name": "Clear!",
        "icon": "storm_ui_icon_medic_displacementgrenade.dds",
        "cooldown": 12,
        "description": "Displacement Grenade's explosion radius increased by 33% and knocks back farther.",
        "hero": "Lt. Morales",
        "id": "MedicClear"
    },
    {
        "image": "nerazim-fury.png",
        "level": "20",
        "name": "Nerazim Fury",
        "icon": "storm_ui_icon_zeratul_shadowassault.dds",
        "cooldown": 100,
        "description": "Shadow Assault grants 30% Life Steal, and the duration is increased by 50%.",
        "hero": "Zeratul",
        "id": "ZeratulMasteryNerazimFuryShadowAssault"
    },
    {
        "image": "shadow-wolf.png",
        "level": "4",
        "name": "Shadow Wolf",
        "icon": "storm_temp_war3_btnspiritwolf.dds",
        "cooldown": 1,
        "description": "When entering Ghost Wolf, you are Stealthed for 4.125 seconds.",
        "hero": "Rehgar",
        "id": "RehgarMasteryShadowWolf"
    },
    {
        "image": "mega-smash.png",
        "level": "13",
        "name": "Mega Smash",
        "icon": "storm_ui_icon_stitches_slam.dds",
        "cooldown": 8,
        "description": "Range and arc of Slam increased by 25%.",
        "hero": "Stitches",
        "id": "StitchesMasteryMegaSmashSlam"
    },
    {
        "image": "pressure-point.png",
        "level": "16",
        "name": "Pressure Point",
        "icon": "storm_temp_war3_btndrunkendodge.dds",
        "cooldown": 5,
        "description": "Flying Kick slows the target enemy by 90% for 1 second.",
        "hero": "Chen",
        "id": "ChenMasteryFlyingKickPressurePoint"
    },
    {
        "image": "lunge.png",
        "level": "13",
        "name": "Lunge",
        "icon": "storm_btn_d3_barbarian_furiouscharge.dds",
        "cooldown": 6,
        "description": "Increases the range of Dive by 30%.",
        "hero": "Illidan",
        "id": "IllidanMasteryLungeDive"
    },
    {
        "image": "pinball-wizard.png",
        "level": "4",
        "name": "Pinball Wizard",
        "icon": "storm_ui_icon_deathpact_2.dds",
        "cooldown": 10,
        "description": "Face Melt does 50% more damage to enemies recently affected by Powerslide.",
        "hero": "E.T.C.",
        "id": "L90ETCMasteryFaceMeltPinballWizard"
    },
    {
        "image": "hot-pursuit.png",
        "level": "7",
        "name": "Hot Pursuit",
        "icon": "storm_ui_icon_valla_hatred.dds",
        "description": "When at 10 stacks of Hatred, the Movement Speed bonus increases to 20% total.",
        "hero": "Valla",
        "id": "DemonHunterCombatStyleHotPursuit"
    },
    {
        "image": "salvation.png",
        "level": "16",
        "name": "Salvation",
        "icon": "storm_ui_icon_tyrael_righteousness.dds",
        "cooldown": 12,
        "description": "Shield is 25% stronger for each allied Hero that gets shielded.",
        "hero": "Tyrael",
        "id": "TyraelMasterySalvation"
    },
    {
        "image": "ignore-pain.png",
        "level": "20",
        "name": "Ignore Pain",
        "icon": "storm_ui_temp_icon_powerwordshield.dds",
        "cooldown": 60,
        "description": "Activate to reduce damage taken by 75% for 4 seconds.\nUsable while Whirlwinding.",
        "hero": "Sonya",
        "id": "SonyaTalentIgnorePain"
    },
    {
        "image": "toad-affinity.png",
        "level": "7",
        "name": "Toad Affinity",
        "icon": "storm_btn_d3_witchdoctor_plagueoftoads.dds",
        "cooldown": 10,
        "description": "Plague of Toads restores 5 Mana and reduces its cooldown by 1 second for each enemy hit.",
        "hero": "Nazeebo",
        "id": "WitchDoctorToadAffinity"
    },
    {
        "image": "redemption.png",
        "level": "20",
        "name": "Redemption",
        "icon": "storm_temp_war3_btndevotion.dds",
        "description": "After Eternal Devotion ends, return to 50% of your maximum Health at your spirit's location. This effect has a 180 second cooldown.",
        "hero": "Uther",
        "id": "UtherMasteryRedemption"
    },
    {
        "image": "rabid-wolves.png",
        "level": "1",
        "name": "Rabid Wolves",
        "icon": "storm_ui_icon_thrall_feralspirit.dds",
        "cooldown": 12,
        "description": "Damaging Heroes with Feral Spirit grants 3 stacks of Frostwolf Resilience.",
        "hero": "Thrall",
        "id": "ThrallMasteryRabidWolves"
    }
]