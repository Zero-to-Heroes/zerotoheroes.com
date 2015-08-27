package com.coach.coaches;

import java.util.ArrayList;
import java.util.List;

public class CoachRepository {

	public static final List<Coach> allCoaches = buildCoachesList();

	private static List<Coach> buildCoachesList() {
		List<Coach> coaches = new ArrayList<>();

		// Squash
		coaches.add(new Coach("0", "Fake Amaury Fribourg", "seb@zerotoheroes.com", "Squash", "15€",
				"Former top 15 French"));
		coaches.add(new Coach("1", "Fake Alex Muller", "seb@zerotoheroes.com", "Squash", "15€", "Former top 15 French"));

		// Bad
		coaches.add(new Coach("2", "Fake Guillaume Tromp", "seb@zerotoheroes.com", "Badminton", "9€",
				"Former top 14 French"));

		// LoL
		coaches.add(new Coach("3", "Fake Julien Debon", "seb@zerotoheroes.com", "League of Legends", "10€",
				"Platinium  IV"));
		coaches.add(new Coach("3", "Fake Julien Debon", "seb@zerotoheroes.com", "League of Legends", "20€",
				"Diamond III"));

		// SC2
		coaches.add(new Coach("4", "Fake Alex Jobert", "seb@zerotoheroes.com", "Starcraft 2", "5€", "Platinium"));

		return coaches;
	}

	public static Coach findById(String coachId) {
		return allCoaches.stream().filter(coach -> coach.getId().equals(coachId)).findFirst().get();
	}

}
