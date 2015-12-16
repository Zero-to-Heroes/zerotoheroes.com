package com.coach.coaches;

import static com.coach.coaches.Coach.Language.*;
import static com.coach.review.Review.Sport.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.coach.coaches.Coach.Language;

public class CoachRepository {

	public static final List<Coach> allCoaches = buildCoachesList();

	private static List<Coach> buildCoachesList() {
		List<Coach> coaches = new ArrayList<>();
		Coach coach;

		// Badminton
		coach = Coach
				.builder()
				.id("0")
				.description(
						"<p>Currently part of a national club team. <ul><li>Coaching in 3 different clubs around Lyon, France</li><li>Diploma Brevet d'Etat</ul>")
				.email("guillaumetromp@gmail.com")
				.languagesSpoken(Arrays.asList(new Language[] { French, English }))
				.level("Former French top 20")
				.name("Guillaume Tromp")
				.picture("guillaume.jpg")
				.sport(Badminton)
				.tariff("5€")
				.tariffDescription(
						"The review will include at least: <ul><li>If it's a video of a match, 2 tactical recommendations</li><li>Otherwise, 2 technical recommendations</li></ul>")
				.verified(true).build();
		coaches.add(coach);

		// Squash
		coaches.add(buildAlex());

		// LoL
		coach = Coach.builder().id("lol0").email("debon.julien@gmail.com")
				.languagesSpoken(Arrays.asList(new Language[] { French, English })).level("Platinium III")
				.name("Sir4ur0n").picture("lol0.jpg").sport(LeagueOfLegends).tariff("3€").verified(true).build();
		coaches.add(coach);

		// HearthStone
		coaches.add(buildChris());
		// Heroes of the Storm
		coaches.add(buildAndrew());

		return coaches;
	}

	private static Coach buildAlex() {
		return Coach
				.builder()
				.id("4")
				.description(
						"<p>J'ai commencé le squash a l'âge de 11 ans, à St Raphaël, ma mère travaillait dans le club, j'étais sur les courts tous les soirs après l'école ;) \r\n"
								+ "<ul>\r\n"
								+ " 	<li>Champion de France junior -14 ans\r\n"
								+ " 	<li>3 fois champion de France par équipes junior avec la ligue PACA \r\n"
								+ " 	<li>Médaille de Bronze au Championnat d'Europe junior par équipe à Malmö \r\n"
								+ "	<li>Intégration au pôle France à Aix en Provence à l'âge de 18 ans, avec comme partenaire un certain Greg Gaultier :)\r\n"
								+ "	<li>Première sélection en équipe de France senior à l'âge de 20 ans\r\n"
								+ "	<li>Circuit PSA de 21 ans jusqu'à 28 ans (New York, Mexico, San Francisco, Kenya, Hong Kong, Égypte, Europe, ...)\r\n"
								+ "	<li>Meilleur résultat PSA : demi finaliste Hong Kong et Kenya\r\n"
								+ "	<li>Meilleur classement PSA : n° 80 \r\n"
								+ "	<li>Meilleur classement français : n° 5 \r\n"
								+ "</ul>\r\n"
								+ "</p>\r\n"
								+ "<p>\r\n"
								+ "En parallèle, j'ai voulu passer, très tôt, mon diplôme de Brevet d'État afin de pouvoir enseigner le squash. J'ai eu la chance de pouvoir côtoyer de nombreux professeurs de squash durant mon parcours tels que Paul Sciberras, Neil Harvey, Richard Pons et bien d autres, ce qui m'a donné le goût de l'enseignement et l'envie de partager ma passion ...\r\n"
								+ "<br>\r\n"
								+ "J'ai eu l'occasion de travailler dans différents clubs en tant que prof : Aix en Provence, Toulouse, St Raphaël, Antibes, la Réunion... <br>\r\n"
								+ "Aujourd'hui, j'enseigne dans différents clubs sur la Côte d'Azur (Nice , Antibes et Monaco).\r\n"
								+ "</p>\r\n"
								+ "<p>\r\n"
								+ "Je suis à votre disposition, si besoin, afin de vous faire progresser dans votre jeu et vous faire profiter de mon expérience.\r\n"
								+ "</p>").email("alex.mullex@yahoo.fr")
				.languagesSpoken(Arrays.asList(new Language[] { French })).level("2A").name("Alex Muller")
				.picture("alex_muller.jpg").sport(Squash).tariff("12€")
				.tariffDescription("Au minimum deux conseils techniques et un conseil tactique").verified(true).build();
	}

	private static Coach buildAndrew() {
		return Coach
				.builder()
				.id("3")
				.description(
						"<p>I'm an avid gamer and love to play as a team. I used to play League of Legends competitively"
								+ " but I have now moved to competitive Heroes of the Storm. I'm an Australian born "
								+ "and raised in Melbourne and run a youtube channel that aims to help other players "
								+ "which I very much enjoy. I would love to teach the community what I have learnt so far and share my knowledge.</p>"
								+ "<p> I'm also Legend in HearthStone and Diamond 3 in League of Legends!")
				.email("zerocityhots@gmail.com")
				.languagesSpoken(Arrays.asList(new Language[] { English }))
				.level("Rank 1")
				.name("Andrew (PentaUnleash)")
				.picture("Andrew.png")
				.sport(HeroesOfTheStorm)
				.tariff("3$")
				.tariffDescription(
						"I will comment on every mistake made in the uploaded video and will describe in-depth to what should have been done")
				.verified(true).build();
	}

	private static Coach buildChris() {
		return Coach.builder().id("2").description("<p>6 time legend with 5 tournament top 8's")
				.email("cshawver18@yahoo.com").languagesSpoken(Arrays.asList(new Language[] { English }))
				.level("Legend").name("Chris Shawver").picture("default_coach_HS.jpg").sport(HearthStone).tariff("5$")
				.tariffDescription("I will review in details the three biggest mistakes of the video").verified(true)
				.build();
	}

	private static Coach buildLoLFakeCoach() {
		return Coach
				.builder()
				.id("1")
				.description(
						"<p>Currently part of Dignitas team. <ul><li>unranked to Diamond youtube serie</li><li>mostly streaming</li></ul>")
				.email("thibaud@zerotoheroes.com")
				.languagesSpoken(Arrays.asList(new Language[] { English }))
				.level("Diamond")
				.name("Sean Huzzy Herbert (FAKE)")
				.picture("huzzy.jpg")
				.sport(LeagueOfLegends)
				.tariff("6€")
				.tariffDescription(
						"The review will include at least: <ul><li>2 biggest execution mistakes analysis</li><li>2 biggest decision-making mistakes analysis</li></ul>")
				.verified(false).build();
	}

	public static Coach findById(String coachId) {
		Coach ret = null;
		for (Coach coach : allCoaches) {
			if (coach.getId().equals(coachId)) {
				ret = coach;
				break;
			}
		}
		return ret;
	}

}
