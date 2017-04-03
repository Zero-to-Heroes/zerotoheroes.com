package com.coach.core.notification;

import java.io.IOException;
import java.util.Collection;
import java.util.concurrent.Callable;

import org.apache.commons.lang.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.WebRequest;

import com.coach.coaches.CoachInformation;
import com.coach.core.security.User;
import com.coach.review.Comment;
import com.coach.review.Review;
import com.coach.review.ReviewSearchCriteria;
import com.coach.review.UrlInput;
import com.coach.sequence.Sequence;
import com.coach.subscription.HasSubscribers;
import com.coach.subscription.SavedSearchSubscription;

import lombok.extern.slf4j.Slf4j;
import net.gpedro.integrations.slack.SlackApi;
import net.gpedro.integrations.slack.SlackAttachment;
import net.gpedro.integrations.slack.SlackMessage;

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
		if (!"prod".equalsIgnoreCase(environment)) { return; }

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

	public void notifyNewMultiComment(Review review, Collection<Comment> comments) {
		if (!"prod".equalsIgnoreCase(environment)) { return; }

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws IOException {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackMessage message = new SlackMessage();
				message.setText(
						"New mutli comment by " + comments.iterator().next().getAuthor() + " at " + review.getUrl());

				api.call(message);
				return null;
			}
		});
	}

	public void notifyNewReview(final Review review) {
		if (!"prod".equalsIgnoreCase(environment)) { return; }

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
				message.setText("New " + review.getVisibility() + " review created by " + review.getAuthor() + " at "
						+ review.getUrl());

				api.call(message);
				return null;
			}
		});
	}

	public void notifyCommentUpdate(final Review review, final Comment comment) {
		if (!"prod".equalsIgnoreCase(environment)) { return; }

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

	// public void notifyReviewUpdatet(final Review review) {
	// if (!"prod".equalsIgnoreCase(environment)) { return; }
	//
	// executorProvider.getExecutor().submit(new Callable<String>() {
	// @Override
	// public String call() throws IOException {
	// SlackApi api = new SlackApi(
	// "https://hooks.slack.com/services/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");
	//
	// SlackAttachment attach = new SlackAttachment();
	// attach.setColor("good");
	// attach.setText(review.getText());
	// attach.setFallback("placeholder fallback");
	//
	// SlackMessage message = new SlackMessage();
	// message.addAttachments(attach);
	// message.setText("Review by " + review.getAuthor() + " updated at " +
	// review.getUrl());
	//
	// api.call(message);
	// return null;
	// }
	// });
	// }

	public void notifyNewUser(final User user) {
		if (!"prod".equalsIgnoreCase(environment)) { return; }

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

	public void notifyNewPaymentRequest(final Review review, final CoachInformation coach, final String requesterEmail,
			final int index) {
		if (!"prod".equalsIgnoreCase(environment)) { return; }

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText(requesterEmail + " has requeted a review from " + coach.getName() + " for a tariff of "
						+ coach.getTariff().get(index) + " with the following conditions "
						+ coach.getTariffDescription().get(index));
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
		if (!"prod".equalsIgnoreCase(environment)) { return; }

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
		if (!"prod".equalsIgnoreCase(environment)) { return; }

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

	public void notifyNewSavedSearchSubscriber(final ReviewSearchCriteria searchCriteria, final String name) {
		if (!"prod".equalsIgnoreCase(environment)) { return; }

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText("Search criteria is " + searchCriteria);
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText(name + " has subscribed to a saved search ");

				api.call(message);
				return null;
			}
		});
	}

	public void notifyNewUnsubscriber(final HasSubscribers item, final User user) {
		if (!"prod".equalsIgnoreCase(environment)) { return; }

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

	public void notifyNewSavedSearchUnsubscriber(final SavedSearchSubscription sub, final String name) {
		if (!"prod".equalsIgnoreCase(environment)) { return; }

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText("Search criteria is " + sub);
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText(name + " has unsubscribed from a saved search ");

				api.call(message);
				return null;
			}
		});
	}

	public void notifyResetPassword(final User user) {
		if (!"prod".equalsIgnoreCase(environment)) { return; }

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText(user.getUsername() + " has requested a password reset. We can contact them at "
						+ user.getEmail());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText(user.getUsername() + " password reset");

				api.call(message);
				return null;
			}
		});
	}

	public void notifyException(final WebRequest request, final Throwable ex, final Object... params) {
		log.info("Sending exception to Slack " + ex);
		if (!"prod".equalsIgnoreCase(environment)) {
			log.error("Exception! " + request + " " + ex);
			return;
		}

		final String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackMessage message = new SlackMessage();

				if (request != null) {
					SlackAttachment requestAttach = new SlackAttachment();
					requestAttach.setColor("danger");
					requestAttach.setText("Initial request was " + request.getDescription(true)
							+ " and triggered the exception: " + ex.getMessage());
					requestAttach.setFallback("placeholder fallback");
					message.addAttachments(requestAttach);
				}

				SlackAttachment exAttach = new SlackAttachment();
				exAttach.setColor("danger");
				exAttach.setTitle("StackTrace for exception: ");
				exAttach.setText(ExceptionUtils.getFullStackTrace(ex));
				exAttach.setFallback("placeholder fallback");

				message.addAttachments(exAttach);
				message.setText("Server exception for user " + currentUser + ": " + ex.getClass());

				if (params != null) {
					for (Object param : params) {
						SlackAttachment paramAttach = new SlackAttachment();
						exAttach.setColor("danger");
						exAttach.setTitle("Other params info");
						exAttach.setText(param.toString());
						exAttach.setFallback("placeholder fallback");
						message.addAttachments(paramAttach);
					}
				}

				api.call(message);
				return null;
			}
		});
	}

	public void notifyHelpfulComment(final Review review, final Comment comment) {
		if (!"prod".equalsIgnoreCase(environment)) {
			log.info("Helpful comment " + comment);
			return;
		}

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText("Helpful comment by " + comment.getAuthor() + " on review " + review.getUrl());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText("Helpful comment by " + comment.getAuthor());

				api.call(message);
				return null;
			}
		});
	}

	public void notifyUnhelpfulComment(final Review review, final Comment comment) {
		if (!"prod".equalsIgnoreCase(environment)) {
			log.info("Unhelpful comment " + comment);
			return;
		}

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("good");
				attach.setText(
						"Comment by " + comment.getAuthor() + " marked as unhelpful on review " + review.getUrl());
				attach.setFallback("placeholder fallback");

				SlackMessage message = new SlackMessage();
				message.addAttachments(attach);
				message.setText("Comment by " + comment.getAuthor() + " marked as unhelpful");

				api.call(message);
				return null;
			}
		});
	}

	public void notifyError(final Exception e, final Object... params) {
		if (!"prod".equalsIgnoreCase(environment)) {
			log.info("Error! " + params);
			return;
		}

		try {
			String currentUser = "unidentifiableUser";
			if (SecurityContextHolder.getContext() != null
					&& SecurityContextHolder.getContext().getAuthentication() != null) {
				currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
			}
			final String userName = currentUser;

			executorProvider.getExecutor().submit(new Callable<String>() {
				@Override
				public String call() throws Exception {
					log.debug("Sending error to Slack", e);
					SlackApi api = new SlackApi(
							"https://hooks.slack.com/services/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");

					SlackMessage message = new SlackMessage();
					message.setText("Generic error with details for user " + userName);

					SlackAttachment exAttach = new SlackAttachment();
					exAttach.setColor("danger");
					exAttach.setTitle("StackTrace for exception: ");
					exAttach.setText(ExceptionUtils.getFullStackTrace(e));
					exAttach.setFallback("placeholder fallback");
					message.addAttachments(exAttach);

					for (Object param : params) {
						SlackAttachment attach = new SlackAttachment();
						attach.setColor("danger");
						attach.setText(param != null ? param.toString() : "null");
						attach.setFallback("placeholder fallback");
						message.addAttachments(attach);
					}

					api.call(message);
					return null;
				}
			});
		}
		catch (Exception e2) {
			log.error("Could not notify error", e2);
		}
	}

	public void notifyUnsupportedUrlImport(final UrlInput url, final User user, final Review review) {
		if (!"prod".equalsIgnoreCase(environment)) {
			log.info("Unsupported url import " + url);
			return;
		}

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws Exception {
				SlackApi api = new SlackApi(
						"https://hooks.slack.com/services/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");

				SlackMessage message = new SlackMessage();
				message.setText("Unsupported URL import " + url);

				SlackAttachment attach = new SlackAttachment();
				attach.setColor("warning");
				attach.setText("User " + user.getUsername() + " (" + user.getEmail()
						+ ") tried to import a game/draft from " + url);
				attach.setFallback("placeholder fallback");
				message.addAttachments(attach);

				SlackAttachment attachReview = new SlackAttachment();
				attachReview.setColor("warning");
				attachReview.setText("Review: " + review);
				attachReview.setFallback("placeholder fallback");
				message.addAttachments(attachReview);

				api.call(message);
				return null;
			}
		});
	}

}
