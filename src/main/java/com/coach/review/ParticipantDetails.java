package com.coach.review;

import java.util.ArrayList;
import java.util.List;

import com.coach.tag.Tag;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class ParticipantDetails {

	private String playerName, opponentName;
	private String playerCategory, opponentCategory;
	private List<Tag> skillLevel = new ArrayList<>();
}
