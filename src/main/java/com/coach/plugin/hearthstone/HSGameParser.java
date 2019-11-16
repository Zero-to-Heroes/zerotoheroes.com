package com.coach.plugin.hearthstone;

import com.coach.core.storage.S3Utils;
import com.coach.plugin.ReplayPlugin;
import com.coach.review.HasText;
import com.coach.review.MetaData;
import com.coach.review.Review;
import com.zerotoheroes.hsgameconverter.ReplayConverter;
import com.zerotoheroes.hsgameentities.replaydata.HearthstoneReplay;
import com.zerotoheroes.hsgameparser.metadata.GameMetaData;
import com.zerotoheroes.hsgameparser.metadata.InvalidGameReplayException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;

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
	public List<String> getMediaTypes() {
		return Arrays.asList(null, "game-replay");
	}

	public void addMetaData(Review review) throws Exception {
		if (gameParser == null || gameParser.getGameParser() == null) {
			log.error("Game parser not initialized properly");
			return;
		}

		try {
			review.setInvalidGame(false);
			log.debug("Adding meta data to " + review.getId() + " - " + review.getTitle());
			String replay = getReplay(review);
			if (replay == null) {
				log.error("Processing empty replay, returning");
				return;
			}
			// log.debug("temp replay is ");
			HearthstoneReplay game = new ReplayConverter()
					.replayFromXml(new ByteArrayInputStream(replay.getBytes(StandardCharsets.UTF_8)));
			// log.debug("game is ");

			MetaData metaData = review.getMetaData();
			if (!(metaData instanceof HearthstoneMetaData)) {
				metaData = new HearthstoneMetaData();
				review.setMetaData(metaData);
			}

			GameMetaData meta = gameParser.getGameParser().getMetaData(game, ((HearthstoneMetaData) metaData).getGameMode());
			log.info("built meta data " + meta);
			review.getParticipantDetails().setPlayerName(meta.getPlayerName());
			review.getParticipantDetails().setOpponentName(meta.getOpponentName());
			review.getParticipantDetails().setPlayerCategory(meta.getPlayerClass());
			review.getParticipantDetails().setOpponentCategory(meta.getOpponentClass());

			HearthstoneMetaData hsMeta = (HearthstoneMetaData) metaData;
			hsMeta.setDurationInSeconds(meta.getDurationInSeconds());
			hsMeta.setNumberOfTurns(meta.getNumberOfTurns());
			hsMeta.setWinStatus(meta.getResult());
			hsMeta.setAdditionalResult(meta.getAdditionalResult());
			hsMeta.setOpponentClass(meta.getOpponentClass());
			hsMeta.setOpponentName(meta.getOpponentName());
			hsMeta.setOpponentCardId(meta.getOpponentCardId());
			hsMeta.setPlayerName(meta.getPlayerName());
			hsMeta.setPlayerClass(meta.getPlayerClass());
			hsMeta.setPlayerCardId(meta.getPlayerCardId());
			hsMeta.setPlayCoin(meta.getPlayCoin());
			// hsMeta.setGameMode(meta.getGameMode());
			// hsMeta.setSkillLevel(meta.getSkillLevel());
			hsMeta.extractGameMode(review.getReviewType());
			hsMeta.extractSkillLevel(review.getParticipantDetails().getSkillLevel());

			// log.debug("adding title?");
			if (StringUtils.isEmpty(review.getTitle())) {
				String title = sanitize(review.getParticipantDetails().getPlayerName()) + "("
						+ review.getParticipantDetails().getPlayerCategory() + ") vs "
						+ sanitize(review.getParticipantDetails().getOpponentName()) + "("
						+ review.getParticipantDetails().getOpponentCategory() + ")";
				title += " - " + review.getParticipantDetails().getPlayerName() + " " + hsMeta.getWinStatus();
				review.setTitle(title);
			}
			
			if ("game-replay".equals(review.getReviewType()) 
				&& StringUtils.isEmpty(((HearthstoneMetaData)review.getMetaData()).getPlayerName())
				&& StringUtils.isEmpty(((HearthstoneMetaData)review.getMetaData()).getPlayerClass())) {
				review.setInvalidGame(true);;
			}

			review.setLastMetaDataParsingDate(new Date());
			log.debug("done adding meta " + hsMeta);
		}
		catch (InvalidGameReplayException e) {
			log.info("Invalid game " + e.getMessage() + ". Key is " + review.getKey());
			review.setInvalidGame(true);
			review.setLastMetaDataParsingDate(new Date());
		}
		catch (Exception e) {
			log.warn("Could not add metata to review " + review, e);
			review.setInvalidGame(true);
			review.setLastMetaDataParsingDate(new Date());
			throw e;
		}
	}

	private String sanitize(String playerName) {
		if (StringUtils.isEmpty(playerName)) {
			return "";
		}
		if (!playerName.contains("#")) {
			return playerName;
		}
		return playerName.substring(0, playerName.indexOf("#"));
	}

	private String getReplay(Review review) throws IOException {
		String replay = null;
		try {
			replay = s3utils.readFromS3Output(review.getKey());
		}
		catch (Exception e) {
			log.info("Exceptin trying to get review key, reading from temp replay");
		}
		if (replay == null) {
			replay = review.getTemporaryReplay();
		}
		else {
			review.setTemporaryReplay(null);
		}
		return replay;
	}
}
