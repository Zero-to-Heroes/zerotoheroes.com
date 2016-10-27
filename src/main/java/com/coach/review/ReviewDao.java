package com.coach.review;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;
import static org.springframework.data.mongodb.core.query.Update.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

import org.apache.commons.collections.CollectionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Field;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.coach.core.notification.ExecutorProvider;
import com.coach.core.security.User;
import com.coach.review.Review.Sport;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ReviewDao {

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	MongoTemplate mongoTemplate;

	@Autowired
	private ExecutorProvider executorProvider;

	public List<Review> search(ReviewSearchCriteria criteria, String author, PageRequest pageRequest) {

		String sportCriteria = criteria.getSport();

		Criteria crit = where("sport").is(Sport.load(sportCriteria).getKey());
		crit.and("published").is(true);

		// I can see all my reviews, but only the public ones from others
		if (criteria.getOwnVideos() != null && criteria.getOwnVideos()
				&& !StringUtils.isEmpty(criteria.getVisibility())) {
			crit.and("visibility").is(criteria.getVisibility());
		}
		else if (criteria.getOwnVideos() == null || !criteria.getOwnVideos()) {
			crit.and("visibility").is("public");
		}

		// Look for the videos of the specified author
		if (!StringUtils.isEmpty(author)) {
			crit.and("authorId").is(author);
		}

		// This is a user-specified criteria, could be either an ID or a
		// username
		if (!StringUtils.isEmpty(criteria.getAuthor()) && criteria.getAuthor().length() > 2) {
			Criteria authorIdCriteria = where("authorId").is(criteria.getAuthor());
			Criteria authorCriteria = where("author").regex(".*" + criteria.getAuthor() + ".*", "i");
			crit.orOperator(authorCriteria, authorIdCriteria);
		}

		if (!StringUtils.isEmpty(criteria.getGameMode())) {
			crit.and("metaData.gameMode").is(criteria.getGameMode());
		}

		// Matchup
		if (!CollectionUtils.isEmpty(criteria.getPlayerCategory())) {
			crit.and("metaData.playerClass").in(criteria.getPlayerCategory());
		}
		if (!CollectionUtils.isEmpty(criteria.getOpponentCategory())) {
			crit.and("metaData.opponentClass").in(criteria.getOpponentCategory());
		}

		// Result
		if (!StringUtils.isEmpty(criteria.getResult())) {
			crit.and("metaData.winStatus").is(criteria.getResult());
		}

		// Plan & Coin
		if (!StringUtils.isEmpty(criteria.getPlayCoin())) {
			crit.and("metaData.playCoin").is(criteria.getPlayCoin());
		}

		// Skill range
		if ("ranked".equals(criteria.getGameMode())) {
			Criteria fromSkill = null;
			Criteria toSkill = null;
			List<Criteria> criteriaList = new ArrayList<>();

			if (criteria.getSkillRangeFrom() != null) {
				fromSkill = where("metaData.skillLevel").lte(criteria.getSkillRangeFrom());
				criteriaList.add(fromSkill);
			}
			if (criteria.getSkillRangeTo() != null) {
				toSkill = where("metaData.skillLevel").gte(criteria.getSkillRangeTo());
				criteriaList.add(toSkill);
			}

			if (!criteriaList.isEmpty()) {
				crit.andOperator(criteriaList.toArray(new Criteria[criteriaList.size()]));
			}
		}
		else if ("arena-game".equals(criteria.getGameMode())) {
			Criteria fromSkill = null;
			Criteria toSkill = null;
			List<Criteria> criteriaList = new ArrayList<>();

			if (criteria.getSkillRangeFrom() != null) {
				fromSkill = where("metaData.skillLevel").gte(criteria.getSkillRangeFrom());
				criteriaList.add(fromSkill);
			}
			if (criteria.getSkillRangeTo() != null) {
				toSkill = where("metaData.skillLevel").lte(criteria.getSkillRangeTo());
				criteriaList.add(toSkill);
			}

			if (!criteriaList.isEmpty()) {
				crit.andOperator(criteriaList.toArray(new Criteria[criteriaList.size()]));
			}
		}

		// Contributors, this will be trickier
		if (!StringUtils.isEmpty(criteria.getContributor()) && criteria.getContributor().length() > 2) {
			// https://docs.mongodb.com/manual/reference/operator/query/in/
			// http://stackoverflow.com/questions/38785349/spring-data-mongodb-criteria-with-in-and-list-of-regexes
			List<Pattern> regexList = Arrays
					.asList(Pattern.compile(".*" + criteria.getContributor() + ".*", Pattern.CASE_INSENSITIVE));
			crit.and("allAuthors").in(regexList);
		}

		// Tags
		if (!CollectionUtils.isEmpty(criteria.getWantedTags())) {
			crit.and("allTags").all(criteria.getWantedTags());
		}
		if (!CollectionUtils.isEmpty(criteria.getUnwantedTags())) {
			crit.and("allTags").nin(criteria.getUnwantedTags());
		}

		// Contributions
		if (criteria.getContributorsComparator() == null || "gte".equals(criteria.getContributorsComparator())) {
			if (criteria.getContributorsValue() > 0) {
				crit.and("authorCount").gt(criteria.getContributorsValue());
			}
			if (criteria.getHelpfulCommentsValue() > 0) {
				crit.and("totalHelpfulComments").gte(criteria.getHelpfulCommentsValue());
			}
		}
		else if ("lte".equals(criteria.getContributorsComparator())) {
			// The author is counted in the allAuthors, while we're only
			// interested in contributors
			crit.and("authorCount").lte(criteria.getContributorsValue() + 1);
			if (criteria.getHelpfulCommentsValue() > 0) {
				crit.and("totalHelpfulComments").lte(criteria.getHelpfulCommentsValue());
			}
		}

		Query query = query(crit);

		// Full-text search
		if (!StringUtils.isEmpty(criteria.getTitle())) {
			TextCriteria textCrit = new TextCriteria().matching(criteria.getTitle());
			query.addCriteria(textCrit);
		}

		query.with(pageRequest);

		Field fields = query.fields();
		fields.include("id");
		fields.include("title");
		fields.include("author");
		fields.include("reputation");
		fields.include("totalComments");
		fields.include("totalHelpfulComments");
		fields.include("viewCount");
		fields.include("tags");
		fields.include("creationDate");
		fields.include("sport");
		fields.include("participantDetails");
		fields.include("metaData");
		fields.include("mediaType");
		fields.include("visibility");
		fields.include("lastModifiedDate");
		fields.include("allAuthors");

		List<Review> find = mongoTemplate.find(query, Review.class);
		return find;
	}

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

				mongoTemplate.updateMulti(query, update, Review.class);
				log.debug("Account claimed");
			}
		};
		executorProvider.getExecutor().submit(runnable);
	}

}
