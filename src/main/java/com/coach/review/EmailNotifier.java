package com.coach.review;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.coach.core.email.EmailMessage;
import com.coach.core.email.EmailSender;
import com.coach.core.security.User;
import com.coach.user.UserRepository;

@Component
public class EmailNotifier {

	@Autowired
	EmailSender emailSender;

	@Autowired
	UserRepository userRepo;

	public void notifyNewComment(Comment comment, Review review) {
		if (review.getAuthorId() != null) {
			User author = userRepo.findById(review.getAuthorId());
			String recipient = author.getEmail();

			EmailMessage message = EmailMessage
					.builder()
					.from("seb@zerotoheroes.com")
					.to(recipient)
					.subject("New comment on your review " + review.getTitle() + " at ZeroToHeroes")
					.content(
							"Hey there!<br/>"
									+ comment.getAuthor()
									+ " has just added a comment on your review. Click <a href=\"http://www.zerotoheroes.com/#/r/"
									+ review.getId() + "\">here</a> to see what they said.")
					.type("text/html").build();
			emailSender.send(message);
		}
	}
}
