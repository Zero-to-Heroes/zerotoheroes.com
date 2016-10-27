package com.coach.review;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;

import com.coach.plugin.hearthstone.HearthstoneMetaData;
import com.coach.tag.Tag;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Slf4j
public class ReviewSearchCriteria {
	private String sport;
	private Integer pageNumber;

	private String gameMode;
	private Set<String> playerCategory;
	private Set<String> opponentCategory;
	private String result;
	private String playCoin;
	private String sort;

	private Float skillRangeFrom;
	private Float skillRangeTo;

	private String author;
	private String contributor;
	private String title;
	private List<Tag> wantedTags;
	private List<Tag> unwantedTags;
	private String contributorsComparator;
	private int contributorsValue;
	private int helpfulCommentsValue;

	private Boolean ownVideos;

	private String visibility;
	private String authorId, contributorId;

	public List<Tag> getWantedTags() {
		return wantedTags == null ? new ArrayList<Tag>() : wantedTags;
	}

	public List<Tag> getUnwantedTags() {
		return unwantedTags == null ? new ArrayList<Tag>() : unwantedTags;
	}

	public String getText() {
		if (title == null || title.isEmpty()) { return null; }

		String text = "";
		for (String word : title.split(" ")) {
			text += "\"" + word + "\" ";
		}
		return text;
	}

	public boolean matches(Review review) {
		if (review.getMetaData() == null) { return false; }
		if (!(review.getMetaData() instanceof HearthstoneMetaData)) { return false; }

		HearthstoneMetaData data = (HearthstoneMetaData) review.getMetaData();

		// Matchup
		if (!CollectionUtils.isEmpty(playerCategory)) {
			if (StringUtils.isEmpty(data.getPlayerClass())) { return false; }
			if (!playerCategory.contains(data.getPlayerClass())) { return false; }
		}
		if (!CollectionUtils.isEmpty(opponentCategory)) {
			if (StringUtils.isEmpty(data.getOpponentClass())) { return false; }
			if (!opponentCategory.contains(data.getOpponentClass())) { return false; }
		}

		// Result
		if (!StringUtils.isEmpty(result) && !result.equals(data.getWinStatus())) { return false; }

		// Play / Coin
		if (!StringUtils.isEmpty(playCoin) && !result.equals(data.getPlayCoin())) { return false; }

		// Game mode
		if (!StringUtils.isEmpty(gameMode) && !result.equals(data.getGameMode())) { return false; }

		// Skill range
		if ("ranked".equals(gameMode)) {
			if (skillRangeFrom != null
					&& (data.getSkillLevel() == null || skillRangeFrom < data.getSkillLevel())) { return false; }
			if (skillRangeTo != null
					&& (data.getSkillLevel() == null || skillRangeTo > data.getSkillLevel())) { return false; }
		}
		else if ("arena-game".equals(gameMode)) {
			if (skillRangeFrom != null
					&& (data.getSkillLevel() == null || skillRangeFrom > data.getSkillLevel())) { return false; }
			if (skillRangeTo != null
					&& (data.getSkillLevel() == null || skillRangeTo < data.getSkillLevel())) { return false; }
		}

		// Author
		if (!StringUtils.isEmpty(author)) {
			// It's not the author, maybe it's one of hte players?
			if (StringUtils.isEmpty(review.getAuthor()) || review.getAuthor().indexOf("author") == -1) {
				if (StringUtils.isEmpty(data.getPlayerName()) || data.getPlayerName().indexOf(author) == -1) {
					if (StringUtils.isEmpty(data.getOpponentName())
							|| data.getOpponentName().indexOf(author) == -1) { return false; }
				}
			}
		}

		// Wanted tags
		if (!CollectionUtils.isEmpty(wantedTags)) {
			if (CollectionUtils.isEmpty(review.getTags())) { return false; }

			boolean allFound = true;
			for (Tag wantedTag : wantedTags) {
				boolean found = false;
				for (Tag tag : review.getTags()) {
					if (tag.getText().equals(wantedTag.getText())) {
						found = true;
						break;
					}
				}
				allFound &= found;
			}

			if (!allFound) { return false; }
		}

		// Unwanted tags
		if (!CollectionUtils.isEmpty(wantedTags)) {
			if (!CollectionUtils.isEmpty(review.getTags())) {
				boolean anyFound = false;
				for (Tag unwantedTag : wantedTags) {
					boolean found = false;
					for (Tag tag : review.getTags()) {
						if (tag.getText().equals(unwantedTag.getText())) {
							found = true;
							break;
						}
					}
					anyFound |= found;
				}

				if (anyFound) { return false; }
			}
		}

		return true;
	}

}
