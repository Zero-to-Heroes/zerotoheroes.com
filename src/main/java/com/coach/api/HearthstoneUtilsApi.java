package com.coach.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.plugin.hearthstone.GameParserProvider;
import com.zerotoheroes.hsdraftodds.HsDraftOdds;
import com.zerotoheroes.hsgameparser.metadata.GameParser;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/hearthstone")
@Slf4j
public class HearthstoneUtilsApi {

	@Autowired
	GameParserProvider parser;

	@RequestMapping(value = "/draft/odds", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> getDraftOdds(@RequestBody HearthstoneDraftInputParameters params)
			throws Exception {

		// Make sure cards are initialized
		parser.getGameParser();
		log.debug("Params: " + params);
		String response = new HsDraftOdds(GameParser.getCardsList()).getOddsForCard(params.getCardId(),
				params.getCurrentPickNumber());

		return new ResponseEntity<String>(response, HttpStatus.OK);
	}
}
