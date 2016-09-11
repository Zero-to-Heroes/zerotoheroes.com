package com.coach.review;

import java.util.HashMap;
import java.util.Map;

import lombok.Data;

@Data
public class MultiComment {

	private Map<String, Comment> turnComments = new HashMap<>();
}
