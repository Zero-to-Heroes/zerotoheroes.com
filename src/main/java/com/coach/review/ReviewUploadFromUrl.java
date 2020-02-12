package com.coach.review;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/fromurl")
@Slf4j
public class ReviewUploadFromUrl {
//
//	@Autowired
//	ReviewRepository reviewRepo;
//
//	@Autowired
//	ReviewService reviewService;
//
//	@Autowired
//	UserRepository userRepo;
//
//	@Autowired
//	UserService userService;
//
//	@Autowired
//	ProfileRepository profileRepo;
//
//	@Autowired
//	SportManager sportManager;
//
//	@Autowired
//	AutowireCapableBeanFactory beanFactory;
//
//	@Autowired
//	SubscriptionManager subscriptionManager;
//
//	@Autowired
//	SlackNotifier slackNotifier;
//
//	@RequestMapping(value = "/{sport}", method = RequestMethod.POST)
//	public @ResponseBody ResponseEntity<Review> importFromUrl(@PathVariable("sport") final String sport,
//			@RequestBody UrlInput url) throws IOException {
//
//		log.debug("Import from" + url);
//		String authorId = null;
//		String author = null;
//
//		// Add current logged in user as the author of the review
//		String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
//		Collection<? extends GrantedAuthority> authorities = SecurityContextHolder.getContext().getAuthentication()
//				.getAuthorities();
//		// log.info("authorities are " + authorities);
//		if (!StringUtils.isNullOrEmpty(currentUser) && !UserAuthority.isAnonymous(authorities)) {
//			// log.debug("Setting current user as review author " +
//			// currentUser);
//			User user = userRepo.findByUsername(currentUser);
//			authorId = user.getId();
//			author = currentUser;
//		}
//
//		Review review = new Review();
//		review.setSport(Review.Sport.load(sport));
//		review.setAuthor(author);
//		review.setAuthorId(authorId);
//		review.setCreationDate(new Date());
//		review.setLastModifiedBy(review.getAuthor());
//		reviewRepo.save(review);
//		log.debug("Review saved " + review);
//
//		// Switch depending on the url integration
//		parseIntegrations(review, url.getUrl());
//
//		if (review.getMediaType() == null) {
//			slackNotifier.notifyUnsupportedUrlImport(url, userRepo.findByUsername(currentUser), review);
//			return new ResponseEntity<Review>(review, HttpStatus.NOT_IMPLEMENTED);
//		}
//		else {
//			subscriptionManager.subscribe(review, review.getAuthorId());
//			subscriptionManager.subscribe(review.getSport(), review.getAuthorId());
//		}
//
//		log.debug("Returning review " + review);
//
//		return new ResponseEntity<Review>(review, HttpStatus.OK);
//	}
//
//	private void parseIntegrations(Review review, String url) {
//		com.coach.sport.Sport sportEntity = sportManager.findById(review.getSport().getKey());
//		for (String pluginClass : sportEntity.getPlugins()) {
//			try {
//				Plugin plugin = (Plugin) Class.forName(pluginClass).newInstance();
//				if (plugin instanceof IntegrationPlugin) {
//					beanFactory.autowireBean(plugin);
//					IntegrationPlugin integrationPlugin = (IntegrationPlugin) plugin;
//					if (integrationPlugin.isApplicable(url)) {
//						log.debug("Applying plugin " + plugin);
//						integrationPlugin.integrateRemoteData(url, review);
//					}
//				}
//			}
//			catch (Exception e) {
//				log.warn("Incorrect plugin execution " + pluginClass, e);
//				slackNotifier.notifyError(e, "Exception during integration plugin execution", pluginClass, review, url);
//			}
//		}
//	}

}
