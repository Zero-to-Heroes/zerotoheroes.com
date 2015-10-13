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
		squash.add(new Tag("match"));
		squash.add(new Tag("drill"));
		squash.add(new Tag("forehand"));
		squash.add(new Tag("backhand"));
		squash.add(new Tag("drive"));
		squash.add(new Tag("crosscourt"));
		squash.add(new Tag("volley"));
		squash.add(new Tag("dropshot"));
		squash.add(new Tag("kill"));
		tags.put(Squash, squash);

		// Tags for badminton
		List<Tag> badminton = new ArrayList<>();
		badminton.add(new Tag("match"));
		badminton.add(new Tag("drill"));
		badminton.add(new Tag("single"));
		badminton.add(new Tag("double"));
		badminton.add(new Tag("mixed-double"));
		badminton.add(new Tag("forehand"));
		badminton.add(new Tag("backhand"));
		badminton.add(new Tag("smash"));
		badminton.add(new Tag("drop"));
		badminton.add(new Tag("net"));
		badminton.add(new Tag("clear"));
		tags.put(Badminton, badminton);

		return tags;
	}

	public static List<Tag> getAllTagsForSport(String sport) {
		return tags.get(Sport.valueOf(sport));
	}

}
