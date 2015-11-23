package com.coach;

import org.junit.Test;

import com.coach.review.Review.Sport;

public class Misc {

	@Test
	public void test() {
		Sport sport = Sport.valueOf("LeagueOfLegends");
		System.out.println(sport);
	}

}
