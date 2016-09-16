package com.coach.review;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.util.StringUtils;

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

	public boolean isEmpty() {
		return StringUtils.isEmpty(playerName) && StringUtils.isEmpty(opponentName)
				&& StringUtils.isEmpty(playerCategory) && StringUtils.isEmpty(opponentCategory)
				&& CollectionUtils.isEmpty(skillLevel);
	}
}
