package com.coach.tag;

import static com.coach.review.Review.Sport.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.coach.review.Review.Sport;

@Component
public class TagRepository {

	private static final Map<Sport, List<Tag>> tags = buildTagsList();

	private static Map<Sport, List<Tag>> buildTagsList() {
		Map<Sport, List<Tag>> tags = new HashMap<>();

		// Tags for squash
		List<Tag> squash = new ArrayList<>();
		squash.add(new Tag("Match"));
		squash.add(new Tag("Drill"));
		squash.add(new Tag("Training"));
		squash.add(new Tag("Forehand"));
		squash.add(new Tag("Backhand"));
		squash.add(new Tag("Drive"));
		squash.add(new Tag("Crosscourt"));
		squash.add(new Tag("Volley"));
		squash.add(new Tag("Dropshot"));
		squash.add(new Tag("Kill"));
		squash.add(new Tag("Boast"));
		squash.add(new Tag("Lob"));
		squash.add(new Tag("Movement"));
		squash.add(new Tag("Beginner", "level"));
		squash.add(new Tag("Casual", "level"));
		squash.add(new Tag("Club", "level"));
		squash.add(new Tag("Club competitive", "level"));
		squash.add(new Tag("Regional", "level"));
		squash.add(new Tag("National", "level"));
		squash.add(new Tag("Pro", "level"));
		squash.add(new Tag("Men"));
		squash.add(new Tag("Women"));
		squash.add(new Tag("Tactics"));
		squash.add(new Tag("Sequence"));
		squash.add(new Tag("Serve"));
		squash.add(new Tag("Ghosting"));
		squash.add(new Tag("Drill: Solo backhand drive good length", "achievement-drill"));
		tags.put(Squash, squash);

		// Tags for badminton
		List<Tag> badminton = new ArrayList<>();
		badminton.add(new Tag("Match"));
		badminton.add(new Tag("Drill"));
		badminton.add(new Tag("Single"));
		badminton.add(new Tag("Double"));
		badminton.add(new Tag("Mixed double"));
		badminton.add(new Tag("Forehand"));
		badminton.add(new Tag("Overhead forehand"));
		badminton.add(new Tag("Backhand"));
		badminton.add(new Tag("Smash"));
		badminton.add(new Tag("Drop"));
		badminton.add(new Tag("Net"));
		badminton.add(new Tag("Clear"));
		badminton.add(new Tag("Movement"));
		badminton.add(new Tag("Training"));
		badminton.add(new Tag("Beginner", "level"));
		badminton.add(new Tag("Casual", "level"));
		badminton.add(new Tag("Club", "level"));
		badminton.add(new Tag("Club competitive", "level"));
		badminton.add(new Tag("Regional", "level"));
		badminton.add(new Tag("National", "level"));
		badminton.add(new Tag("Pro", "level"));
		badminton.add(new Tag("Men"));
		badminton.add(new Tag("Women"));
		badminton.add(new Tag("Tactics"));
		badminton.add(new Tag("Serve"));
		badminton.add(new Tag("Return"));
		badminton.add(new Tag("Backcourt"));
		badminton.add(new Tag("Sequence"));
		tags.put(Badminton, badminton);

		// Tags for HearthStone
		List<Tag> hearthstone = new ArrayList<>();
		// Ranks
		hearthstone.add(new Tag("Rank 20-25", "skill-level"));
		hearthstone.add(new Tag("Rank 15-19", "skill-level"));
		hearthstone.add(new Tag("Rank 10-14", "skill-level"));
		hearthstone.add(new Tag("Rank 1-9", "skill-level"));
		hearthstone.add(new Tag("Legend", "skill-level"));
		hearthstone.add(new Tag("Arena 1-3 wins", "skill-level"));
		hearthstone.add(new Tag("Arena 4-6 wins", "skill-level"));
		hearthstone.add(new Tag("Arena 7-8 wins", "skill-level"));
		hearthstone.add(new Tag("Arena 9 wins", "skill-level"));
		hearthstone.add(new Tag("Arena 10 wins", "skill-level"));
		hearthstone.add(new Tag("Arena 11 wins", "skill-level"));
		hearthstone.add(new Tag("Arena 12 wins", "skill-level"));
		hearthstone.add(new Tag("Casual", "skill-level"));
		hearthstone.add(new Tag("Brawl", "skill-level"));
		// Decks
		hearthstone.add(new Tag("Face Hunter"));
		hearthstone.add(new Tag("Hunter Beast"));
		hearthstone.add(new Tag("Combo Druid"));
		hearthstone.add(new Tag("Druid Ramp"));
		hearthstone.add(new Tag("Egg Druid"));
		hearthstone.add(new Tag("Palasecret"));
		hearthstone.add(new Tag("Aggro Paladin"));
		hearthstone.add(new Tag("Palamurloc"));
		hearthstone.add(new Tag("Mage Mecha"));
		hearthstone.add(new Tag("Tempo Mage"));
		hearthstone.add(new Tag("Flamewalker Mage"));
		hearthstone.add(new Tag("Freeze Mage"));
		hearthstone.add(new Tag("Echo Mage"));
		hearthstone.add(new Tag("Zoolock"));
		hearthstone.add(new Tag("Demonlock"));
		hearthstone.add(new Tag("Handlock"));
		hearthstone.add(new Tag("Malylock"));
		hearthstone.add(new Tag("Renolock"));
		hearthstone.add(new Tag("Aggro Shaman"));
		hearthstone.add(new Tag("Malygos Shaman"));
		hearthstone.add(new Tag("Priest Control"));
		hearthstone.add(new Tag("Dragon Priest"));
		hearthstone.add(new Tag("Oil Rogue"));
		hearthstone.add(new Tag("Malygos Rogue"));
		hearthstone.add(new Tag("Control Warrior"));
		hearthstone.add(new Tag("Patron Warrior"));
		hearthstone.add(new Tag("OTK Warrior"));
		// Category
		hearthstone.add(new Tag("Aggro"));
		hearthstone.add(new Tag("Midrange"));
		hearthstone.add(new Tag("Control"));
		// Other
		hearthstone.add(new Tag("Reno"));
		hearthstone.add(new Tag("OTK"));
		hearthstone.add(new Tag("Mech"));
		hearthstone.add(new Tag("Murloc"));
		tags.put(HearthStone, hearthstone);

		// Tags for Heroes of the Storm
		List<Tag> heroes = new ArrayList<>();
		heroes.add(new Tag("Map: Infernal Shrines"));
		heroes.add(new Tag("Map: Battlefield of Eternity"));
		heroes.add(new Tag("Map: Tomb of the Spider Queen"));
		heroes.add(new Tag("Map: Sky Temple"));
		heroes.add(new Tag("Map: Garden of Terror"));
		heroes.add(new Tag("Map: BlackHeart's Bay"));
		heroes.add(new Tag("Map: Cursed Hollow"));
		heroes.add(new Tag("Map: Dragon Shire"));
		heroes.add(new Tag("Map: Haunted Mines"));
		heroes.add(new Tag("Map: Towers of Doom"));
		heroes.add(new Tag("Hero League"));
		heroes.add(new Tag("Quick Match"));
		heroes.add(new Tag("Rank 1-10"));
		heroes.add(new Tag("Rank 11-20"));
		heroes.add(new Tag("Rank 21-30"));
		heroes.add(new Tag("Rank 31-40"));
		heroes.add(new Tag("Specialist"));
		heroes.add(new Tag("Mage"));
		heroes.add(new Tag("Support"));
		heroes.add(new Tag("Warrior"));
		heroes.add(new Tag("Assassin"));
		heroes.add(new Tag("Hero: LT. Morales"));
		heroes.add(new Tag("Hero: Rexxar"));
		heroes.add(new Tag("Hero: Kharazim"));
		heroes.add(new Tag("Hero: Leoric"));
		heroes.add(new Tag("Hero: The Butcher"));
		heroes.add(new Tag("Hero: Johanna"));
		heroes.add(new Tag("Hero: Kael'Thas"));
		heroes.add(new Tag("Hero: Sylvanas"));
		heroes.add(new Tag("Hero: The Lost Vikings"));
		heroes.add(new Tag("Hero: Thrall"));
		heroes.add(new Tag("Hero: Jaina"));
		heroes.add(new Tag("Hero: Anub'Arak"));
		heroes.add(new Tag("Hero: Azmodan"));
		heroes.add(new Tag("Hero: Chen"));
		heroes.add(new Tag("Hero: Murky"));
		heroes.add(new Tag("Hero: Brightwing"));
		heroes.add(new Tag("Hero: Lili"));
		heroes.add(new Tag("Hero: Tychus"));
		heroes.add(new Tag("Hero: Stitches"));
		heroes.add(new Tag("Hero: Arthas"));
		heroes.add(new Tag("Hero: Diablo"));
		heroes.add(new Tag("Hero: Tyrael"));
		heroes.add(new Tag("Hero: E.T.C"));
		heroes.add(new Tag("Hero: Sonya"));
		heroes.add(new Tag("Hero: Muradin"));
		heroes.add(new Tag("Hero: Kerrigan"));
		heroes.add(new Tag("Hero: Nova"));
		heroes.add(new Tag("Hero: Falstad"));
		heroes.add(new Tag("Hero: Valla"));
		heroes.add(new Tag("Hero: Illidan"));
		heroes.add(new Tag("Hero: Raynor"));
		heroes.add(new Tag("Hero: Zeratul"));
		heroes.add(new Tag("Hero: Uther"));
		heroes.add(new Tag("Hero: Malfurion"));
		heroes.add(new Tag("Hero: Tassadar"));
		heroes.add(new Tag("Hero: Tyrande"));
		heroes.add(new Tag("Hero: Nazeebo"));
		heroes.add(new Tag("Hero: Gazlowe"));
		heroes.add(new Tag("Hero: Abathur"));
		heroes.add(new Tag("Hero: Sgt. Hammer"));
		heroes.add(new Tag("Hero: Artanis"));
		heroes.add(new Tag("Hero: Lunara"));
		heroes.add(new Tag("Hero: GreyMane"));
		heroes.add(new Tag("Pro"));
		heroes.add(new Tag("Team Fight"));
		heroes.add(new Tag("Team League"));
		tags.put(HeroesOfTheStorm, heroes);

		// Tags for Heroes of the Storm
		List<Tag> league = new ArrayList<>();
		league.add(new Tag("Bronze"));
		league.add(new Tag("Silver"));
		league.add(new Tag("Gold"));
		league.add(new Tag("Platinum"));
		league.add(new Tag("Diamond"));
		league.add(new Tag("Master - Challenger"));
		league.add(new Tag("Decision Making"));
		league.add(new Tag("Laning Phase"));
		league.add(new Tag("Mid Game"));
		league.add(new Tag("Late Game"));
		league.add(new Tag("Team Fight"));
		league.add(new Tag("Positioning"));
		league.add(new Tag("Top"));
		league.add(new Tag("Jungle"));
		league.add(new Tag("Suppord"));
		league.add(new Tag("AD Carry"));
		league.add(new Tag("Mid"));
		league.add(new Tag("Dragon"));
		league.add(new Tag("Nashor"));
		league.add(new Tag("Backdoor"));
		league.add(new Tag("Invade"));
		league.add(new Tag("Ranked 5v5"));
		league.add(new Tag("Ranked solo"));
		league.add(new Tag("Ranked duo"));
		league.add(new Tag("Normal"));
		league.add(new Tag("Team Builder"));
		league.add(new Tag("Champion: Aatrox"));
		league.add(new Tag("Champion: Ahri"));
		league.add(new Tag("Champion: Akali"));
		league.add(new Tag("Champion: Alistar"));
		league.add(new Tag("Champion: Amumu"));
		league.add(new Tag("Champion: Anivia"));
		league.add(new Tag("Champion: Annie"));
		league.add(new Tag("Champion: Ashe"));
		league.add(new Tag("Champion: Azir"));
		league.add(new Tag("Champion: Bard"));
		league.add(new Tag("Champion: Blitzcrank"));
		league.add(new Tag("Champion: Brand"));
		league.add(new Tag("Champion: Braum"));
		league.add(new Tag("Champion: Caitlyn"));
		league.add(new Tag("Champion: Cassiopeia"));
		league.add(new Tag("Champion: Cho'Gath"));
		league.add(new Tag("Champion: Corki"));
		league.add(new Tag("Champion: Darius"));
		league.add(new Tag("Champion: Diana"));
		league.add(new Tag("Champion: Dr. Mundo"));
		league.add(new Tag("Champion: Draven"));
		league.add(new Tag("Champion: Ekko"));
		league.add(new Tag("Champion: Elise"));
		league.add(new Tag("Champion: Evelynn"));
		league.add(new Tag("Champion: Ezreal"));
		league.add(new Tag("Champion: Fiddlesticks"));
		league.add(new Tag("Champion: Fiora"));
		league.add(new Tag("Champion: Fizz"));
		league.add(new Tag("Champion: Galio"));
		league.add(new Tag("Champion: Gangplank"));
		league.add(new Tag("Champion: Garen"));
		league.add(new Tag("Champion: Gnar"));
		league.add(new Tag("Champion: Gragas"));
		league.add(new Tag("Champion: Graves"));
		league.add(new Tag("Champion: Hecarim"));
		league.add(new Tag("Champion: Heimerdinger"));
		league.add(new Tag("Champion: Irelia"));
		league.add(new Tag("Champion: Janna"));
		league.add(new Tag("Champion: Jarvan IV"));
		league.add(new Tag("Champion: Jax"));
		league.add(new Tag("Champion: Jayce"));
		league.add(new Tag("Champion: Jinx"));
		league.add(new Tag("Champion: Kalista"));
		league.add(new Tag("Champion: Karma"));
		league.add(new Tag("Champion: Karthus"));
		league.add(new Tag("Champion: Kassadin"));
		league.add(new Tag("Champion: Katarina"));
		league.add(new Tag("Champion: Kayle"));
		league.add(new Tag("Champion: Kennen"));
		league.add(new Tag("Champion: Kindred"));
		league.add(new Tag("Champion: Kha'Zix"));
		league.add(new Tag("Champion: Kindred"));
		league.add(new Tag("Champion: Kog'Maw"));
		league.add(new Tag("Champion: Leblanc"));
		league.add(new Tag("Champion: Lee Sin"));
		league.add(new Tag("Champion: Leona"));
		league.add(new Tag("Champion: Lissandra"));
		league.add(new Tag("Champion: Lucian"));
		league.add(new Tag("Champion: Lulu"));
		league.add(new Tag("Champion: Lux"));
		league.add(new Tag("Champion: Malphite"));
		league.add(new Tag("Champion: Malzahar"));
		league.add(new Tag("Champion: Maokai"));
		league.add(new Tag("Champion: Master Yi"));
		league.add(new Tag("Champion: Miss Fortune"));
		league.add(new Tag("Champion: Mordekaiser"));
		league.add(new Tag("Champion: Morgana"));
		league.add(new Tag("Champion: Nami"));
		league.add(new Tag("Champion: Nasus"));
		league.add(new Tag("Champion: Nautilus"));
		league.add(new Tag("Champion: Nidalee"));
		league.add(new Tag("Champion: Nocturne"));
		league.add(new Tag("Champion: Olaf"));
		league.add(new Tag("Champion: Orianna"));
		league.add(new Tag("Champion: Pantheon"));
		league.add(new Tag("Champion: Poppy"));
		league.add(new Tag("Champion: Quinn"));
		league.add(new Tag("Champion: Rammus"));
		league.add(new Tag("Champion: Rek'Sai"));
		league.add(new Tag("Champion: Renekton"));
		league.add(new Tag("Champion: Rengar"));
		league.add(new Tag("Champion: Riven"));
		league.add(new Tag("Champion: Rumble"));
		league.add(new Tag("Champion: Ryze"));
		league.add(new Tag("Champion: Sejuani"));
		league.add(new Tag("Champion: Shaco"));
		league.add(new Tag("Champion: Shen"));
		league.add(new Tag("Champion: Shyvana"));
		league.add(new Tag("Champion: Singed"));
		league.add(new Tag("Champion: Sion"));
		league.add(new Tag("Champion: Sivir"));
		league.add(new Tag("Champion: Skarner"));
		league.add(new Tag("Champion: Sona"));
		league.add(new Tag("Champion: Soraka"));
		league.add(new Tag("Champion: Swain"));
		league.add(new Tag("Champion: Syndra"));
		league.add(new Tag("Champion: Tahm Kench"));
		league.add(new Tag("Champion: Talon"));
		league.add(new Tag("Champion: Taric"));
		league.add(new Tag("Champion: Teemo"));
		league.add(new Tag("Champion: Thresh"));
		league.add(new Tag("Champion: Tristana"));
		league.add(new Tag("Champion: Trundle"));
		league.add(new Tag("Champion: Tryndamere"));
		league.add(new Tag("Champion: Twisted Fate"));
		league.add(new Tag("Champion: Twitch"));
		league.add(new Tag("Champion: Udyr"));
		league.add(new Tag("Champion: Varus"));
		league.add(new Tag("Champion: Vayne"));
		league.add(new Tag("Champion: Veigar"));
		league.add(new Tag("Champion: Vel'Koz"));
		league.add(new Tag("Champion: Vi"));
		league.add(new Tag("Champion: Viktor"));
		league.add(new Tag("Champion: Vladimir"));
		league.add(new Tag("Champion: Volibear"));
		league.add(new Tag("Champion: Warwick"));
		league.add(new Tag("Champion: Xerath"));
		league.add(new Tag("Champion: Xin Zhao"));
		league.add(new Tag("Champion: Yasuo"));
		league.add(new Tag("Champion: Yorick"));
		league.add(new Tag("Champion: Zac"));
		league.add(new Tag("Champion: Zed"));
		league.add(new Tag("Champion: Ziggs"));
		league.add(new Tag("Champion: Zilean"));
		league.add(new Tag("Champion: Zyra"));
		league.add(new Tag("Pro"));
		tags.put(LeagueOfLegends, league);

		List<Tag> other = new ArrayList<>();
		other.add(new Tag("Sequence"));
		tags.put(Other, other);

		return tags;
	}

	public static List<Tag> getAllTagsForSport(String sport) {
		Sport theSport = Sport.load(sport);
		return tags.get(theSport);
	}

}
