package com.coach.review;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.coach.core.notification.EmailMessage;
import com.coach.core.notification.EmailSender;
import com.coach.core.security.User;
import com.coach.user.UserRepository;

@Component
public class EmailNotifier {

	@Autowired
	EmailSender emailSender;

	@Autowired
	UserRepository userRepo;

	String environment;

	@Autowired
	public EmailNotifier(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	public void notifyNewComment(User subscriber, Comment comment, Review review) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		String recipient = subscriber.getEmail();

		//@formatter:off
		String body = "Hey there!<br/>"
				+ "<p>" + comment.getAuthor() + " has just added a comment on your review. "
						+ "Click <a href=\"" + review.getUrl() + "\">here</a> to see what they said.</p>"
			    + "<p><small>And if you wish to stop receiving notifications on this review, just hit \"unsubsribe\" from the url above</small></p>";
		//@formatter:on

		EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to(recipient)
				.subject("New comment on your review " + review.getTitle() + " at ZeroToHeroes").content(body)
				.type("text/html").build();
		emailSender.send(message);
	}

	/*
	 * public void notifyNewUser(User user) { if
	 * (!"prod".equalsIgnoreCase(environment)) return;
	 * 
	 * EmailMessage message =
	 * EmailMessage.builder().from("seb@zerotoheroes.com")
	 * .to("contact@zerotoheroes.com") .subject(environment +
	 * ": A new user has just registered! " + user.getUsername())
	 * .content(user.toString()).type("text/html").build();
	 * emailSender.send(message); }
	 */

	public void notifyNewReview(User subscriber, Review review) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		String recipient = subscriber.getEmail();

		String sportUrl = "http://www.zerotoheroes.com/#/r/" + review.getSport().getKey();
		//@formatter:off
		String body = "Hey there!<br/>"
				+ "<p>" + review.getAuthor() + " has just posted a new review \"" + review.getTitle() + "\". "
						+ "Click <a href=\"" + review.getUrl() + "\">here</a> to have a look.</p>"
				+ "<p><small>And if you wish to stop receiving notifications on this review, just hit \"unsubsribe\" "
						+ "on the <a href=\"" + sportUrl + "\">sport page</a></small></p>";
		//@formatter:on

		EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to(recipient)
				.subject("New " + review.getSport().getValue() + " review posted at ZeroToHeroes").content(body)
				.type("text/html").build();
		emailSender.send(message);
	}
}
