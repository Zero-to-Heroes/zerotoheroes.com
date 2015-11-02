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
import com.coach.sequence.Sequence;
import com.coach.subscription.HasSubscribers;

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
				message.setText("New comment by " + reply.getAuthor() + " at " + review.getUrl());

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
				attach.setTitle(review.getTitle());
				attach.setText(review.getText());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText("New review created by " + review.getAuthor() + " at " + review.getUrl());

				api.call(message);
				return null;
			}
		});
	}

	public void notifyCommentUpdate(final Review review, final Comment comment) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws IOException {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText(comment.getText());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText("Comment by " + comment.getAuthor() + " updated at " + review.getUrl());

				api.call(message);
				return null;
			}
		});
	}

	public void notifyReviewUpdatet(final Review review) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws IOException {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText(review.getText());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText("Review by " + review.getAuthor() + " updated at " + review.getUrl());

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
						+ user.getRegisterLocation() + " with email " + user.getEmail());
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
						+ coach.getTariff() + " with the following conditions " + coach.getTariffDescription());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText("New payment request");

				api.call(message);
				return null;
			}
		});
	}

	public void notifyNewSequence(final Sequence sequence) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText("A new sequence has been created: " + sequence.getTitle() + " for "
						+ sequence.getSport().getValue());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText("A new sequence has been created");

				api.call(message);
				return null;
			}
		});
	}

	public void notifyNewSubscriber(final HasSubscribers item, final User user) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText(user.getUsername() + " has subscribed to " + item.getTitle()
						+ ". We can contact them at " + user.getEmail());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText(user.getUsername() + " has subscribed to " + item.getTitle());

				api.call(message);
				return null;
			}
		});
	}

	public void notifyNewUnsubscriber(final HasSubscribers item, final User user) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText(user.getUsername() + " has unsubscribed from " + item.getTitle()
						+ ". We can contact them at " + user.getEmail());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText(user.getUsername() + " has unsubscribed from " + item.getTitle());

				api.call(message);
				return null;
			}
		});
	}

}
