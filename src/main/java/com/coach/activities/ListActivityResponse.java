package com.coach.activities;

import java.util.List;

import lombok.Data;

@Data
public class ListActivityResponse {

	private final List<Activity> activities;
	private int totalPages;

}
