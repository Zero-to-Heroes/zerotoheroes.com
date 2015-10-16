package com.coach.core.notification;

import java.io.IOException;
import java.util.concurrent.Callable;

import lombok.extern.slf4j.Slf4j;
import net.gpedro.integrations.slack.SlackApi;
import net.gpedro.integrations.slack.SlackAttachment;
import net.gpedro.integrations.slack.SlackMessage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.coach.coaches.Coach;
import com.coach.core.security.User;
import com.coach.review.Comment;
import com.coach.review.Review;

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
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws IOException {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText(reply.getText());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				String reviewUrl = "http://www.zerotoheroes.com/r/" + review.getSport().getKey().toLowerCase()
						+ "/" + review.getId();
				message.setText("New comment by " + reply.getAuthor() + " at " + reviewUrl);

				api.call(message);
				return null;
			}
		});
	}

	public void notifyNewReview(final Review review) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText(review.getText());
				attach.setFallback("placeholder fallback");

				String reviewUrl = "http://www.zerotoheroes.com/r/" + review.getSport().getKey().toLowerCase()
						+ "/" + review.getId();
				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText("New review created by " + review.getAuthor() + " at " + reviewUrl);

				api.call(message);
				return null;
			}
		});
	}

	public void notifyNewUser(final User user) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText("A new user has just registered: " + user.getUsername() + " from "
						+ user.getRegisterLocation());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText("A new user has just registered");

				api.call(message);
				return null;
			}
		});
	}

	public void notifyNewPaymentRequest(final Review review, final Coach coach, final String requesterEmail) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText(requesterEmail + " has requeted a review from " + coach.getName() + " for a tariff of "
						+ coach.getTariff() + " with the following conditions "
						+ coach.getTariffDescription());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText("New payment request");

				api.call(message);
				return null;
			}
		});
	}

}
