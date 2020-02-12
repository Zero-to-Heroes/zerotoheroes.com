package com.coach.review.replay.hearthstone;

import com.coach.core.notification.ExecutorProvider;
import com.coach.plugin.hearthstone.HSReplay;
import com.coach.review.ReviewApiHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RepositoryRestController
@RequestMapping(value = "/api/replays")
@Slf4j
public class ReplayApiHandler {

	@Autowired
	ExecutorProvider executorProvider;
//
//	@Autowired
//	SlackNotifier slackNotifier;

	@Autowired
	ReviewApiHandler reviewApi;

	@Autowired
	HSReplay hsReplay;

//	@RequestMapping(method = RequestMethod.POST)
//	public @ResponseBody ResponseEntity<ListReviewResponse> init(@RequestBody ReplayFilesRequest request)
//			throws Exception {
//
//		log.debug("Handling replay file " + request);
//		List<String> originalFileKeys = request.getKeys();
//
//		// List<Review> reviews = new ArrayList<>();
//
//		// Need to propagate the security context
//		// http://stackoverflow.com/questions/5246428/spring-security-and-async
//		final Authentication a = SecurityContextHolder.getContext().getAuthentication();
//
//		// Make this non-blocking
//		executorProvider.getExecutor().submit(new Callable<String>() {
//			@Override
//			public String call() throws IOException, Exception {
//				try {
//					SecurityContext ctx = SecurityContextHolder.createEmptyContext();
//					ctx.setAuthentication(a);
//					SecurityContextHolder.setContext(ctx);
//					for (int i = 0; i < originalFileKeys.size(); i++) {
//						String key = originalFileKeys.get(i);
//						log.debug("\tprocessing key " + key);
//
//						// Are there several games in the single file?
//						List<String> games = hsReplay.extractGames(key, request.getFileTypes().get(i));
//						log.debug("\tbuilt " + games.size() + " games");
//
//						// Process file
//						for (String game : games) {
//							Review review = new Review();
//							review.setFileType(request.getFileTypes().get(i));
//							review.setSport(Review.Sport.load(request.getSport()));
//							review.setTemporaryReplay(game);
//							review.setReplay("true");
//							review.setReviewType("game-replay");
//							review.setVisibility("restricted");
//
//							review.setPublished(true);
//							reviewApi.createReview(review);
//							// reviews.add(review);
//							log.debug("Created review " + review);
//						}
//					}
//				}
//				catch (Exception e) {
//					log.error("Could not process all reviews " + request, e);
//					slackNotifier.notifyException(null, e, request);
//				}
//				return null;
//			}
//		});
//
//		ListReviewResponse response = new ListReviewResponse(null);
//		return new ResponseEntity<ListReviewResponse>(response, HttpStatus.OK);
//	}
}
