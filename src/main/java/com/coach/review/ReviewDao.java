package com.coach.review;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;
import static org.springframework.data.mongodb.core.query.Update.*;

import java.util.List;

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

		if (!StringUtils.isEmpty(author)) {
			crit.and("authorId").is(author);
		}

		if (!CollectionUtils.isEmpty(criteria.getWantedTags())) {
			crit.and("allTags").all(criteria.getWantedTags());
		}
		if (!CollectionUtils.isEmpty(criteria.getUnwantedTags())) {
			crit.and("allTags").nin(criteria.getUnwantedTags());
		}
		if (criteria.getOnlyHelpful() != null && criteria.getOnlyHelpful()) {
			crit.and("totalHelpfulComments").gt(0);
		}
		if (criteria.getNoHelpful() != null && criteria.getNoHelpful()) {
			crit.and("totalHelpfulComments").is(0);
		}

		if (criteria.getParticipantDetails() != null) {
			ParticipantDetails details = criteria.getParticipantDetails();

			// Any matchups
			if (!StringUtils.isEmpty(details.getPlayerCategory())) {
				crit.and("participantDetails.playerCategory").is(details.getPlayerCategory());
			}
			if (!StringUtils.isEmpty(details.getOpponentCategory())) {
				crit.and("participantDetails.opponentCategory").is(details.getOpponentCategory());
			}

			if (!CollectionUtils.isEmpty(details.getSkillLevel())) {
				crit.and("participantDetails.skillLevel").all(details.getSkillLevel());
			}
		}

		if (!StringUtils.isEmpty(criteria.getReviewType())) {
			crit.and("reviewType").is(criteria.getReviewType());
		}
		if (criteria.getMinComments() != null) {
			crit.and("totalComments").gte(criteria.getMinComments());
		}
		if (criteria.getMaxComments() != null) {
			crit.and("totalComments").lte(criteria.getMaxComments());
		}

		Query query = query(crit);

		// Full-text search
		if (!StringUtils.isEmpty(criteria.getText())) {
			TextCriteria textCrit = new TextCriteria().matching(criteria.getText());
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
