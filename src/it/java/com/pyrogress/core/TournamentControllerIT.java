package com.pyrogress.core;

//import static org.junit.Assert.assertNotNull;
//import static org.junit.Assert.assertTrue;
//
//import java.util.ArrayList;
//import java.util.Date;
//import java.util.List;
//import java.util.Random;
//
//import org.json.JSONObject;
//import org.junit.Before;
//import org.junit.Test;
//import org.springframework.http.HttpMethod;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.pyrogress.core.domain.GameResult;
//import com.pyrogress.core.domain.Player;
//import com.pyrogress.core.domain.Tournament;
//import com.pyrogress.core.service.RankingService;

public class TournamentControllerIT 
//extends BaseIntegrationTest 
{

//	private Tournament tournament;
//
//	@Before
//	public void beforeTest() {
//		super.before();
//		tournament = new Tournament();
//		tournament.setId("fakeId");
//		tournament.setName("fakeName");
//		for (int i = 0; i < 6; i++) {
//			final Player player = new Player();
//			player.setName("playerName" + i);
//			player.setId("playerId" + i);
//			tournament.addPlayer(player);
//		}
//		new RankingService().initializeRankings(tournament);
//		for (int i = 0; i < 3; i++) {
//			final GameResult result = new GameResult();
//			result.setId("result" + i);
//			result.setDate(new Date());
//			final List<Player> players = new ArrayList<>();
//			players.add(tournament.getPlayers().get(new Random().nextInt(tournament.getPlayers().size())));
//			result.setFinalResult(players);
//			tournament.addResult(result);
//		}
//	}
//
//	@Test
//	public void testCreateRetrieveDeleteTournament() throws Exception {
//		String jsonTournament = new ObjectMapper().writeValueAsString(tournament);
//
//		// Create the tournament
//		String createResponse = doAuthenticatedExchange(TEST_USER, HttpMethod.POST, "api/tournaments", jsonTournament,
//				TEST_USER_PWD);
//		JSONObject createdTournament = new JSONObject(createResponse);
//		assertNotNull("Tournament should have been created", createdTournament);
//		String tournamentId = createdTournament.getString("id");
//		assertNotNull("Tournament ID should not be null", tournamentId);
//
//		// Now retrieve it
//		String retrieveResponse = doAuthenticatedExchange(TEST_USER, HttpMethod.GET, "api/tournaments/" + tournamentId,
//				null, TEST_USER_PWD);
//		JSONObject retrievedTournament = new JSONObject(retrieveResponse);
//		assertNotNull("Tournament should have been created", retrievedTournament);
//		long creationDate = retrievedTournament.getLong("creationDate");
//		assertNotNull("Tournament creation date should not be null", creationDate);
//
//		// Delete it
//		doAuthenticatedDelete(TEST_USER, "/api/tournaments/" + tournamentId, TEST_USER_PWD);
//		//
//		// // Try to retrieve it again and check it doesn't exist anymore
//		String noTournament = doAuthenticatedExchange(TEST_USER, HttpMethod.GET, "api/tournaments/" + tournamentId,
//				null, TEST_USER_PWD);
//		assertTrue("Tournament shouldn't have been retrieved, it should have been deleted", noTournament == null
//				|| noTournament.isEmpty());
//
//	}
}
