package com.coach.coaches;

import static com.coach.coaches.Coach.Language.*;
import static com.coach.coaches.Coach.Sport.*;

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

		// LoL
		coaches.add(buildLoLFakeCoach());
		// HearthStone
		coaches.add(buildHSFakeCoach());

		return coaches;
	}

	private static Coach buildHSFakeCoach() {
		return Coach
				.builder()
				.id("2")
				.description(
						"<p>Currently part of Pomf&Thud team. <ul><li>mostly streaming</li><li>can show you how to be the boss</li></ul>")
				.email("thibaud@zerotoheroes.com")
				.languagesSpoken(Arrays.asList(new Language[] { French, English }))
				.level("Legend")
				.name("Thud (FAKE)")
				.picture("thud.jpg")
				.sport(HearthStone)
				.tariff("3€")
				.tariffDescription(
						"The review will include a complete analysis of one game")
				.verified(true).build();
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
				.verified(true).build();
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
