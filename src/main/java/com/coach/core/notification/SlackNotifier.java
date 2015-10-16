package com.coach.core.notification;

import java.io.IOException;
import java.util.concurrent.Callable;

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
import com.ullink.slack.simpleslackapi.SlackMessageHandle;
import com.ullink.slack.simpleslackapi.SlackSession;
import com.ullink.slack.simpleslackapi.impl.SlackSessionFactory;

@Slf4j
@Component
public class SlackNotifier {

	@Autowired
	private ExecutorProvider executorProvider;

	private final String environment;

	@Autowired
	public SlackNotifier(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	public void notifyNewComment(final Review review, final Comment reply) {
		log.debug("Should we send slack notification?");
		if (!"prod".equalsIgnoreCase(environment)) return;
		log.debug("Sending");

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws IOException {
				log.debug("In executor call for slacknotifier#notifyNewComment");
				SlackSession session = createSession();
				SlackChannel channel = session.findChannelByName("notifications-prod");
				String reviewUrl = "http://www.zerotoheroes.com/r/" + review.getSport().getKey().toLowerCase() + "/"
						+ review.getId();
				SlackAttachment attachment = new SlackAttachment("", "placeholder text", reply.getText(),
						"");
				attachment.color = "good";
				try {
					log.debug("Trying to send message");
					SlackMessageHandle messageHandle = session.sendMessage(channel,
							"New comment by " + reply.getAuthor() + " at " + reviewUrl, attachment);
					log.debug("Is message ackowledged? " + messageHandle.isAcked());
					log.debug("Slack message reply: [timestamp= " + messageHandle.getSlackReply().getTimestamp()
							+ ", replyTo=" + messageHandle.getSlackReply().getReplyTo() + ", eventtype"
							+ messageHandle.getSlackReply().getEventType());
					log.debug("Message id " + messageHandle.getMessageId());
				}
				catch (Exception e) {
					log.error("Exception while trying to send message to slack", e);
				}
				finally {
					session.disconnect();
				}

				log.debug("Notification sent to channel");
				return null;
			}

		});
	}

	public void notifyNewReview(final Review review) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackSession session = createSession();
				try {
					SlackChannel channel = session.findChannelByName("notifications-prod");
					String reviewUrl = "http://www.zerotoheroes.com/r/" + review.getSport().getKey().toLowerCase()
							+ "/"
							+ review.getId();
					SlackAttachment attachment = new SlackAttachment(review.getSport().getValue() + " - "
							+ review.getTitle(), "placeholder text", review.getText(),
							"");
					attachment.color = "good";
					session.sendMessage(channel, "New review created at " + reviewUrl, attachment);
					return null;
				}
				finally {
					session.disconnect();
				}
			}
		});
	}

	public void notifyNewUser(final User user) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackSession session = createSession();
				try {
					SlackChannel channel = session.findChannelByName("notifications-prod");
					SlackAttachment attachment = new SlackAttachment("", "placeholder text",
							"A new user has just registered " + user.getUsername() + " from "
									+ user.getRegisterLocation(),
							"");
					attachment.color = "good";
					session.sendMessage(channel, "A new user has just registered", attachment);
				}
				finally {
					session.disconnect();
				}
				return null;
			}
		});
	}

	public void notifyNewPaymentRequest(final Review review, final Coach coach, final String requesterEmail) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackSession session = createSession();
				try {
					SlackChannel channel = session.findChannelByName("notifications-prod");
					SlackAttachment attachment = new SlackAttachment("", "placeholder text",
							requesterEmail + " has requeted a review from " + coach.getName() + " for a tariff of "
									+ coach.getTariff() + " with the following conditions "
									+ coach.getTariffDescription(),
							"");
					attachment.color = "good";
					SlackMessageHandle messageHandle = session.sendMessage(channel, "New payment request", attachment);

					// Also post in important notifs
					SlackChannel importantChannel = session.findChannelByName("notifications-prod-hi");
					session.sendMessage(importantChannel, "New payment request", attachment);
				}
				finally {
					session.disconnect();
				}
				return null;
			}
		});
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
