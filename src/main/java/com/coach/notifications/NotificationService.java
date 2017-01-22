package com.coach.notifications;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;

import java.util.Calendar;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class NotificationService {

	@Autowired
	MongoTemplate mongoTemplate;

	public boolean hasRecentOpenSuggestions(String userId) {
		Calendar calendar = Calendar.getInstance();
		calendar.add(Calendar.MINUTE, -20);

		Criteria crit = where("userId").is(userId);
		crit.and("readDate").is(null);
		crit.and("creationDate").gte(calendar.getTime());
		crit.and("data.textKey").is("suggestedSubscription");

		Query query = query(crit);
		long count = mongoTemplate.count(query, Notification.class);
		return count > 0;
	}

}
