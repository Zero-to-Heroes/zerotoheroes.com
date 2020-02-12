package com.coach.review;

import com.coach.core.notification.ExecutorProvider;
import com.coach.core.security.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.Date;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import static org.springframework.data.mongodb.core.query.Update.update;

@Component
@Slf4j
public class ReviewDao {
	
	private static Criteria EMPTY_CRITERIA = new Criteria();

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	MongoTemplate mongoTemplate;

	@Autowired
	private ExecutorProvider executorProvider;

//	public List<Review> search(ReviewSearchCriteria criteria, User user, PageRequest pageRequest) {
//		Set<Criteria> allCriteria = Sets.newHashSet(
//				where("sport").is(Sport.load(criteria.getSport()).getKey()),
//				where("published").is(true),
//				new Criteria().orOperator(
//						where("invalidGame").exists(false),
//						where("invalidGame").is(false)),
//				visibilityCriteria(criteria),
//				authorIdCriteria(criteria),
//				authorCriteria(criteria),
//				gameModeCriteria(criteria),
//				playerCriteria(criteria),
//				opponentCriteria(criteria),
//				resultCriteria(criteria),
//				playCoinCriteria(criteria),
//				minimumSkillLevelCriteria(criteria),
//				maximumSkillLevelCriteria(criteria),
//				contributorsCriteria(criteria, user),
//				publicationDateCriteria(criteria),
//				closedDateCriteria(criteria),
//				helpScoreCriteria(criteria),
//				wantedTagsCriteria(criteria),
//				unwantedTagsCriteria(criteria),
//				authorCountCriteria(criteria),
//				helpfulCommentsCountCriteria(criteria)
//		);
//		allCriteria.remove(EMPTY_CRITERIA);
//
//		Criteria crit = new Criteria().andOperator(allCriteria.toArray(new Criteria[] {}));
//		Query query = query(crit);
//
//		// Full-text search
//		String title = criteria.getTitle();
//		if (!StringUtils.isEmpty(title)) {
//			TextCriteria textCrit = new TextCriteria().matching(title);
//			if (title.startsWith("\"")) {
//				int end = title.lastIndexOf("\"") == 0 ? title.length() : title.lastIndexOf("\"");
//				textCrit = new TextCriteria().matchingPhrase(criteria.getTitle().substring(1, end));
//			}
//			query.addCriteria(textCrit);
//		}
//
//		query.with(pageRequest);
//
//		Field fields = query.fields();
//		fields.include("id");
//		fields.include("title");
//		fields.include("author");
//		fields.include("reputation");
//		fields.include("totalComments");
//		fields.include("totalHelpfulComments");
//		fields.include("viewCount");
//		fields.include("tags");
//		fields.include("creationDate");
//		fields.include("publicationDate");
//		fields.include("closedDate");
//		fields.include("sport");
//		fields.include("participantDetails");
//		fields.include("metaData");
//		fields.include("mediaType");
//		fields.include("visibility");
//		fields.include("lastModifiedDate");
//		fields.include("allAuthors");
//		fields.include("allAuthorIds");
//		fields.include("helpScore");
//		fields.include("debugScore");
//
//		List<Review> find = mongoTemplate.find(query, Review.class);
//		return find;
//	}
//
//	private Criteria helpfulCommentsCountCriteria(ReviewSearchCriteria criteria) {
//		if (criteria.getContributorsComparator() == null || "gte".equals(criteria.getContributorsComparator())) {
//			if (criteria.getHelpfulCommentsValue() != null && criteria.getHelpfulCommentsValue() > 0) {
//				return where("totalHelpfulComments").gte(criteria.getHelpfulCommentsValue());
//			}
//		}
//		else if ("lte".equals(criteria.getContributorsComparator())) {
//			// The author is counted in the allAuthors, while we're only
//			// interested in contributors
//			if (criteria.getHelpfulCommentsValue() != null && criteria.getHelpfulCommentsValue() > 0) {
//				return where("totalHelpfulComments").lte(criteria.getHelpfulCommentsValue());
//			}
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria authorCountCriteria(ReviewSearchCriteria criteria) {
//		if (criteria.getContributorsComparator() == null || "gte".equals(criteria.getContributorsComparator())) {
//			if (criteria.getContributorsValue() != null && criteria.getContributorsValue() > 0) {
//				return where("authorCount").gt(criteria.getContributorsValue());
//			}
//		}
//		else if ("lte".equals(criteria.getContributorsComparator())) {
//			// The author is counted in the allAuthors, while we're only
//			// interested in contributors
//			if (criteria.getContributorsValue() != null) {
//				return where("authorCount").lte(criteria.getContributorsValue() + 1);
//			}
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria unwantedTagsCriteria(ReviewSearchCriteria criteria) {
//		if (!CollectionUtils.isEmpty(criteria.getUnwantedTags())) {
//			return where("allTags").nin(criteria.getUnwantedTags());
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria wantedTagsCriteria(ReviewSearchCriteria criteria) {
//		if (!CollectionUtils.isEmpty(criteria.getWantedTags())) {
//			return where("allTags").all(criteria.getWantedTags());
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria helpScoreCriteria(ReviewSearchCriteria criteria) {
//		if ("helpScore".equals(criteria.getSort()) || "openonly".equals(criteria.getOpenGames())) {
//			return where("helpScore").gte(-5);
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria closedDateCriteria(ReviewSearchCriteria criteria) {
//		if ("helpScore".equals(criteria.getSort()) || "openonly".equals(criteria.getOpenGames())) {
//			return where("closedDate").is(null);
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria publicationDateCriteria(ReviewSearchCriteria criteria) {
//		if ("helpScore".equals(criteria.getSort()) || "openonly".equals(criteria.getOpenGames())) {
//			Calendar calendar = Calendar.getInstance();
//			calendar.add(Calendar.DAY_OF_YEAR, -20);
//			return where("publicationDate").gte(calendar.getTime());
//		}
//		else if ("publicationDate".equals(criteria.getSort()) && (criteria.getOwnVideos() == null || !criteria.getOwnVideos())) {
//			return where("publicationDate").ne(null);
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria contributorsCriteria(ReviewSearchCriteria criteria, User user) {
//		if (!StringUtils.isEmpty(criteria.getContributor()) && criteria.getContributor().length() > 2) {
//			// https://docs.mongodb.com/manual/reference/operator/query/in/
//			// http://stackoverflow.com/questions/38785349/spring-data-mongodb-criteria-with-in-and-list-of-regexes
//			Pattern pattern = Pattern.compile(".*" + criteria.getContributor() + ".*", Pattern.CASE_INSENSITIVE);
//			List<Pattern> regexList = Collections.singletonList(pattern);
//
//			Criteria allAuthor = where("allAuthors").in(regexList);
//			Criteria allAuthorIds = where("allAuthorIds").in(regexList);
//			return new Criteria().orOperator(allAuthor, allAuthorIds);
//			// crit.and("allAuthors").in(regexList);
//		}
//		else if ("helpScore".equals(criteria.getSort()) && user != null) {
//			return where("allAuthorIds").nin(user.getId());
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria maximumSkillLevelCriteria(ReviewSearchCriteria criteria) {
//		if ("ranked".equals(criteria.getGameMode())) {
//			if (criteria.getSkillRangeTo() != null) {
//				return where("metaData.skillLevel").gte(criteria.getSkillRangeTo());
//			}
//		}
//		else if ("arena-game".equals(criteria.getGameMode())) {
//			if (criteria.getSkillRangeTo() != null) {
//				return where("metaData.skillLevel").lte(criteria.getSkillRangeTo());
//			}
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria minimumSkillLevelCriteria(ReviewSearchCriteria criteria) {
//		if ("ranked".equals(criteria.getGameMode())) {
//			if (criteria.getSkillRangeFrom() != null) {
//				return where("metaData.skillLevel").lte(criteria.getSkillRangeFrom());
//			}
//		}
//		else if ("arena-game".equals(criteria.getGameMode())) {
//			if (criteria.getSkillRangeFrom() != null) {
//				return where("metaData.skillLevel").gte(criteria.getSkillRangeFrom());
//			}
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria playCoinCriteria(ReviewSearchCriteria criteria) {
//		if (!StringUtils.isEmpty(criteria.getPlayCoin())) {
//			return where("metaData.playCoin").is(criteria.getPlayCoin());
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria resultCriteria(ReviewSearchCriteria criteria) {
//		if (!StringUtils.isEmpty(criteria.getResult())) {
//			return where("metaData.winStatus").is(criteria.getResult());
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria opponentCriteria(ReviewSearchCriteria criteria) {
//		if (!CollectionUtils.isEmpty(criteria.getOpponentCategory())) {
//			return where("metaData.opponentClass").in(criteria.getOpponentCategory());
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria playerCriteria(ReviewSearchCriteria criteria) {
//		if (!CollectionUtils.isEmpty(criteria.getPlayerCategory())) {
//			return where("metaData.playerClass").in(criteria.getPlayerCategory());
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria gameModeCriteria(ReviewSearchCriteria criteria) {
//		if (!StringUtils.isEmpty(criteria.getGameMode())) {
//			return where("metaData.gameMode").is(criteria.getGameMode());
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria authorCriteria(ReviewSearchCriteria criteria) {
//		// This is a user-specified criteria, could be either an ID or a username
//		if (!StringUtils.isEmpty(criteria.getAuthor()) && criteria.getAuthor().length() > 2) {
//			Criteria authorCriteria = where("author").is(criteria.getAuthor());
//			Criteria playerNameCriteria = where("metaData.playerName").is(criteria.getAuthor());
//			return new Criteria().orOperator(authorCriteria, playerNameCriteria);
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria authorIdCriteria(ReviewSearchCriteria criteria) {
//		if (!StringUtils.isEmpty(criteria.getAuthorId())) {
//			return where("authorId").is(criteria.getAuthorId());
//		}
//		return EMPTY_CRITERIA;
//	}
//
//	private Criteria visibilityCriteria(ReviewSearchCriteria criteria) {
//		// I can see all my reviews, but only the public ones from others
//		if (criteria.getOwnVideos() != null && criteria.getOwnVideos()) {
//			// Visibility
//			if (!StringUtils.isEmpty(criteria.getVisibility())) {
//				if ("public".equals(criteria.getVisibility())) {
//					return where("visibility").is("public");
//				}
//				else {
//					return where("visibility").in(Arrays.asList(new String[] { "restricted", "private" }));
//				}
//			}
//		}
//		else if (criteria.getOwnVideos() == null || !criteria.getOwnVideos()) {
//			if ("unlisted".equals(criteria.getVisibility())) {
//				return where("visibility").in(Arrays.asList(new String[] { "restricted", "public" }));
//			}
//			else {
//				return where("visibility").is("public");
//			}
//		}
//		return EMPTY_CRITERIA;
//	}

	public void claimAccount(User user, String applicationKey, String userToken) {

		Runnable runnable = new Runnable() {

			@Override
			public void run() {
				// Select all the reviews that have the third party
				// authentication info
				Criteria crit = where("uploaderApplicationKey").is(applicationKey);
				crit.and("uploaderToken").is(userToken);
				Query query = query(crit);

				Update update = update("authorId", user.getId());
				update.set("author", user.getUsername());
				update.push("subscribers", user.getId());

				mongoTemplate.updateMulti(query, update, Review.class);
				log.debug("Account claimed");
			}
		};
		executorProvider.getExecutor().submit(runnable);
	}

	public void closeReview(Review review) {
		Criteria crit = where("id").is(review.getId());
		Query query = query(crit);

		Update update = update("closedDate", new Date());

		mongoTemplate.updateMulti(query, update, Review.class);
		log.debug("Review closed");
	}

	public void reopenReview(Review review) {
		Criteria crit = where("id").is(review.getId());
		Query query = query(crit);

		Update update = update("closedDate", null);

		mongoTemplate.updateMulti(query, update, Review.class);
		log.debug("Review reopened");
	}

	public long countLinkedReviews(String applicationKey, String userToken) {
		Criteria crit = where("uploaderApplicationKey").is(applicationKey)
				.and("uploaderToken").is(userToken);
		Query query = query(crit);

		return mongoTemplate.count(query, Review.class);
	}

}
