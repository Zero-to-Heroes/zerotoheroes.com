package com.coach.plugin.hearthstone;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.coach.core.storage.S3Utils;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.HasText;
import com.coach.review.MetaData;
import com.coach.review.Review;
import com.zerotoheroes.hsgameconverter.ReplayConverter;
import com.zerotoheroes.hsgameentities.replaydata.HearthstoneReplay;
import com.zerotoheroes.hsgameparser.metadata.GameMetaData;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class HSGameParser implements ReplayPlugin {

	@Autowired
	S3Utils s3utils;

	@Autowired
	GameParserProvider gameParser;

	@Override
	public String execute(String currentUser, Map<String, String> pluginData, HasText textHolder) throws Exception {
		return textHolder.getText();
	}

	@Override
	public String getName() {
		return "hsgameparser";
	}

	@Override
	public String getPhase() {
		return "update";
	}

	@Override
	public boolean transformReplayFile(Review review) throws Exception {
		log.debug("consolidating meta data ");
		addMetaData(review);
		return true;
	}

	@Override
	public String getMediaType() {
		return "game-replay";
	}

	public void addMetaData(Review review) throws Exception {
		if (gameParser == null || gameParser.getGameParser() == null) {
			log.error("Game parser not initialized properly");
			return;
		}

		try {
			log.debug("Adding meta data to " + review);
			String replay = getReplay(review);
			log.debug("temp replay is ");
			HearthstoneReplay game = new ReplayConverter()
					.replayFromXml(new ByteArrayInputStream(replay.getBytes(StandardCharsets.UTF_8)));
			log.debug("game is ");

			GameMetaData meta = gameParser.getGameParser().getMetaData(game);
			log.info("built meta data " + meta);
			review.getParticipantDetails().setPlayerName(meta.getPlayerName());
			review.getParticipantDetails().setOpponentName(meta.getOpponentName());
			review.getParticipantDetails().setPlayerCategory(meta.getPlayerClass());
			review.getParticipantDetails().setOpponentCategory(meta.getOpponentClass());

			MetaData metaData = review.getMetaData();
			if (metaData == null || !(metaData instanceof HearthstoneMetaData)) {
				metaData = new HearthstoneMetaData();
				review.setMetaData(metaData);
			}
			HearthstoneMetaData hsMeta = (HearthstoneMetaData) metaData;
			hsMeta.setDurationInSeconds(meta.getDurationInSeconds());
			hsMeta.setNumberOfTurns(meta.getNumberOfTurns());
			hsMeta.setWinStatus(meta.getResult());
			hsMeta.setOpponentClass(meta.getOpponentClass());
			hsMeta.setOpponentName(meta.getOpponentName());
			hsMeta.setPlayerName(meta.getPlayerName());
			hsMeta.setPlayerClass(meta.getPlayerClass());
			hsMeta.setPlayCoin(meta.getPlayCoin());
			// hsMeta.setGameMode(meta.getGameMode());
			// hsMeta.setSkillLevel(meta.getSkillLevel());
			hsMeta.extractGameMode(review.getReviewType());
			hsMeta.extractSkillLevel(review.getParticipantDetails().getSkillLevel());

			log.debug("adding title?");
			if (StringUtils.isEmpty(review.getTitle())) {
				String title = review.getParticipantDetails().getPlayerName() + "("
						+ review.getParticipantDetails().getPlayerCategory() + ") vs "
						+ review.getParticipantDetails().getOpponentName() + "("
						+ review.getParticipantDetails().getOpponentCategory() + ")";
				title += " - " + hsMeta.getWinStatus();
				review.setTitle(title);
			}

			review.setLastMetaDataParsingDate(new Date());
			log.debug("done adding meta " + review);
		}
		catch (Exception e) {
			// log.error("Could not add metata to review " + review, e);
			review.setInvalidGame(true);
			throw e;
		}
	}

	private String getReplay(Review review) throws IOException {
		String replay = review.getTemporaryReplay();
		if (replay == null) {
			replay = s3utils.readFromS3Output(review.getKey());
		}
		return replay;
	}
}
