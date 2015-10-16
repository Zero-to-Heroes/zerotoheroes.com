package com.coach.core.notification;

import java.io.IOException;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.coach.coaches.Coach;
import com.coach.core.security.User;
import com.coach.review.Comment;
import com.coach.review.Review;
import com.ullink.slack.simpleslackapi.SlackAttachment;
import com.ullink.slack.simpleslackapi.SlackChannel;
import com.ullink.slack.simpleslackapi.SlackSession;
import com.ullink.slack.simpleslackapi.impl.SlackSessionFactory;

@Slf4j
@Component
public class SlackNotifier {

	private final String environment;

	@Autowired
	public SlackNotifier(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	public void notifyNewComment(final Review review, final Comment reply) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		Thread thread = new Thread(new Runnable() {
			@Override
			public void run() {
				SlackSession session = createSession();
				SlackChannel channel = session.findChannelByName("notifications-prod");
				String reviewUrl = "http://www.zerotoheroes.com/r/" + review.getSport().getKey().toLowerCase() + "/"
						+ review.getId();
				SlackAttachment attachment = new SlackAttachment("", "placeholder text", reply.getText(),
						"");
				attachment.color = "good";
				session.sendMessage(channel,
						"New comment by " + reply.getAuthor() + " at " + reviewUrl, attachment);
			}
		});
		thread.start();
	}

	public void notifyNewReview(final Review review) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		Thread thread = new Thread(new Runnable() {
			@Override
			public void run() {
				SlackSession session = createSession();
				SlackChannel channel = session.findChannelByName("notifications-prod");
				String reviewUrl = "http://www.zerotoheroes.com/r/" + review.getSport().getKey().toLowerCase() + "/"
						+ review.getId();
				SlackAttachment attachment = new SlackAttachment(review.getSport().getValue() + " - "
						+ review.getTitle(), "placeholder text", review.getText(),
						"");
				attachment.color = "good";
				session.sendMessage(channel, "New review created at " + reviewUrl, attachment);
			}
		});
		thread.start();
	}

	public void notifyNewUser(final User user) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		Thread thread = new Thread(new Runnable() {
			@Override
			public void run() {
				SlackSession session = createSession();
				SlackChannel channel = session.findChannelByName("notifications-prod");
				SlackAttachment attachment = new SlackAttachment("", "placeholder text",
						"A new user has just registered " + user.getUsername() + " from " + user.getRegisterLocation(),
						"");
				attachment.color = "good";
				session.sendMessage(channel, "A new user has just registered", attachment);
			}
		});
		thread.start();
	}

	public void notifyNewPaymentRequest(final Review review, final Coach coach, final String requesterEmail) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		Thread thread = new Thread(new Runnable() {
			@Override
			public void run() {
				SlackSession session = createSession();
				SlackChannel channel = session.findChannelByName("notifications-prod");
				SlackAttachment attachment = new SlackAttachment("", "placeholder text",
						requesterEmail + " has requeted a review from " + coach.getName() + " for a tariff of "
								+ coach.getTariff() + " with the following conditions " + coach.getTariffDescription(),
						"");
				attachment.color = "good";
				session.sendMessage(channel, "New payment request", attachment);

				// Also post in important notifs
				SlackChannel importantChannel = session.findChannelByName("notifications-prod-hi");
				session.sendMessage(importantChannel, "New payment request", attachment);
			}
		});
		thread.start();
	}

	private SlackSession createSession() {
		SlackSession session = SlackSessionFactory
				.createWebSocketSlackSession("xoxb-12632536997-ZzcHGR3IKIceL5ewaQ9gxFCJ");
		try {
			session.connect();
		}
		catch (IOException e) {
			log.error("Error while connecting to the Slack session", e);
		}
		return session;
	}

}
