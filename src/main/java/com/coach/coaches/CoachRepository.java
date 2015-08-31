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
				.email("guillaumetromp@gmail.com").languagesSpoken(Arrays.asList(new Language[] { French, English }))
				.level("Former French top 14").name("Guillaume Tromp").picture("guillaume.jpg").sport(Badminton)
				.tariff("5€").tariffDescription("Provides 3 pieces of advice + how to put them into practice")
				.verified(true).build();
		coaches.add(coach);

		// Squash

		// LoL

		return coaches;
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
