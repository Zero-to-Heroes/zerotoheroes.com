package com.coach.plugin.hearthstone;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.data.mongodb.core.mapping.Document;

import com.coach.review.MetaData;
import com.coach.tag.Tag;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Data
@Document
@Slf4j
public class HearthstoneMetaData extends MetaData {
	private static final String RANKED_SKILL_REGEX = "(?:Rank\\D*)(\\d+)?";
	private static final Pattern RANKED_PATTERN = Pattern.compile(RANKED_SKILL_REGEX, Pattern.MULTILINE);

	private static final String ARENA_SKILL_REGEX = "(?:Arena\\D*)(\\d+)?";
	private static final Pattern ARENA_PATTERN = Pattern.compile(ARENA_SKILL_REGEX, Pattern.MULTILINE);

	private String playerName, opponentName;
	private String playerClass, opponentClass;

	private int durationInSeconds;
	private int numberOfTurns;
	private String winStatus;
	private String gameMode;
	private String playCoin;
	private String skillLevel;

	public void extractSkillLevel(List<Tag> skillLevel) {
		if (!CollectionUtils.isEmpty(skillLevel)) {
			String skillTag = skillLevel.get(0).getText();
			if (skillTag.contains("legend") || skillTag.contains("Legend")) {
				this.skillLevel = "legend";
			}
			else {
				Matcher matcher = RANKED_PATTERN.matcher(skillTag);
				while (matcher.find()) {
					this.skillLevel = matcher.group(1);
					if (gameMode == null) {
						gameMode = "ranked";
					}
					log.debug("matching pattern for " + skillTag + " and extracted " + this.skillLevel + " on mode "
							+ gameMode);
				}
				if (this.skillLevel == null) {
					matcher = ARENA_PATTERN.matcher(skillTag);
					while (matcher.find()) {
						this.skillLevel = matcher.group(1);
						if (gameMode == null) {
							gameMode = "arena-game";
						}
						log.debug("matching pattern for " + skillTag + " and extracted " + this.skillLevel + " on mode "
								+ gameMode);
					}
				}
			}
			if (this.skillLevel == null) {
				this.skillLevel = skillLevel.get(0).getText();
			}
		}
	}

	public void extractGameMode(String reviewType) {
		if (gameMode == null && "arena-draft".equals(reviewType)) {
			gameMode = "arena-draft";
		}
	}
}
