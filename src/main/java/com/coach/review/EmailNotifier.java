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

		EmailMessage message = EmailMessage
				.builder()
				.from("seb@zerotoheroes.com")
				.to(recipient)
				.subject("New comment on your review " + review.getTitle() + " at ZeroToHeroes")
				.content(
						"Hey there!<br/>"
								+ comment.getAuthor()
								+ " has just added a comment on your review. Click <a href=\"http://www.zerotoheroes.com/#/r/"
								+ review.getSport().getKey() + "/" + review.getId()
								+ "\">here</a> to see what they said.").type("text/html").build();
		emailSender.send(message);
	}

	public void notifyNewUser(User user) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to("contact@zerotoheroes.com")
				.subject(environment + ": A new user has just registered! " + user.getUsername())
				.content(user.toString()).type("text/html").build();
		emailSender.send(message);
	}

	public void notifyNewReview(User subscriber, Review review) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		String recipient = subscriber.getEmail();

		EmailMessage message = EmailMessage
				.builder()
				.from("seb@zerotoheroes.com")
				.to(recipient)
				.subject("New review posted at ZeroToHeroes")
				.content(
						"Hey there!<br/>" + review.getAuthor() + " has just posted a new review \"" + review.getTitle()
								+ "\". Click <a href=\"http://www.zerotoheroes.com/#/r/" + review.getSport().getKey()
								+ "/" + review.getId() + "\">here</a> to have a look").type("text/html").build();
		emailSender.send(message);
	}
}
