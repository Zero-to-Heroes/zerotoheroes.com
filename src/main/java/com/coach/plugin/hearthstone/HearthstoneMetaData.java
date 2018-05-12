package com.coach.plugin.hearthstone;

import com.coach.review.MetaData;
import com.coach.tag.Tag;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.regex.Pattern;

@Data
@Document
@Slf4j
public class HearthstoneMetaData extends MetaData {

	private static final String RANKED_SKILL_REGEX = "(?:Rank\\D*)(\\d+)?";
	private static final Pattern RANKED_PATTERN = Pattern.compile(RANKED_SKILL_REGEX, Pattern.MULTILINE);

	private static final String ARENA_SKILL_REGEX = "(?:Arena\\D*)(\\d+)?";
	private static final Pattern ARENA_PATTERN = Pattern.compile(ARENA_SKILL_REGEX, Pattern.MULTILINE);

	@Indexed
	private String playerName, opponentName;
	@Indexed
	private String playerClass, opponentClass;
	private String playerDecklist, opponentDecklist;

	@Indexed
	private int durationInSeconds;
	@Indexed
	private int numberOfTurns;
	@Indexed
	private String winStatus;
	@Indexed
	private String gameMode, gameFormat;
	@Indexed
	private String playCoin;
	@Indexed
	private Float skillLevel, opponentSkillLevel;

	@Override
	public void extractSkillLevel(List<Tag> skillLevel) {
		if (skillLevel != null && gameMode != null) {
			return;
		}

        if (!CollectionUtils.isEmpty(skillLevel)) {
            String skillTag = skillLevel.get(0).getText();
            if (skillTag.contains("Arena Draft") || skillTag.contains("Arena draft")) {
                gameMode = "arena-draft";
            }
		}
	}

	public void extractGameMode(String reviewType) {
		if (gameMode == null && "arena-draft".equals(reviewType)) {
			gameMode = "arena-draft";
		}
	}
}
