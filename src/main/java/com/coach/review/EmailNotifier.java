package com.coach.review;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.coach.core.notification.EmailMessage;
import com.coach.core.notification.EmailSender;
import com.coach.core.security.User;
import com.coach.user.UserRepository;

@Component
@Slf4j
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
				+ "<p>" + comment.getAuthor() + " has just added a comment on review " + review.getTitle() + ". "
						+ "Click <a href=\"" + review.getUrl() + "\">here</a> to see what they said.</p>"
			    + "<p><small>And if you wish to stop receiving notifications on this review, just hit \"unsubsribe\" from the url above</small></p>";
		String subject = "New comment on review " + review.getTitle() + " at ZeroToHeroes";

		if ("fr".equalsIgnoreCase(subscriber.getPreferredLanguage())) {
			body = "Bonjour!<br/>"
					+ "<p>"
					+ comment.getAuthor()
					+ " vient d'ajouter un commentaire sur la vidéo " + review.getTitle() + ". "
					+ "Cliquez <a href=\""
					+ review.getUrl()
					+ "\">ici</a> pour voir le commentaire.</p>"
					+ "<p><small>Et si vous ne voulez plus recevoir de notifications sur cette vidéo, cliquez simplement sur "
					+ "\"désinscription\" depuis la page ci-dessus</small></p>";
			subject = "Nouveau commentaire sur la revue " + review.getTitle() + " sur Zero to Heroes";
		}
		//@formatter:on

		EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to(recipient).subject(subject)
				.content(body).type("text/html").build();
		emailSender.send(message);
	}

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
		String subject = "New " + review.getSport().getValue() + " review posted at ZeroToHeroes";

		if ("fr".equalsIgnoreCase(subscriber.getPreferredLanguage())) {
			body = "Bonjour!<br/>"
					+ "<p>" + review.getAuthor() + " vient de poster une nouvelle revue \"" + review.getTitle() + "\". "
					+ "Cliquez <a href=\"" + review.getUrl() + "\">ici</a> pour aller voir.</p>"
					+ "<p><small>Et si vous ne voulez plus recevoir de notifications lorsqu'une nouvelle revue est postée, "
					+ "cliquez simplement sur \"désinscription\" "
					+ "sur la <a href=\"" + sportUrl + "\">page principale</a></small></p>";
			subject = "Nouvelle revue postée sur Zero to Heroes - " + review.getSport().getValue();
		}
		//@formatter:on

		EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to(recipient).subject(subject)
				.content(body).type("text/html").build();
		emailSender.send(message);
	}

	public void sendResetPasswordLink(User user, String url) {
		log.debug("Sending email to " + user.getEmail() + " with link " + url);
		//@formatter:off
		String body = "<p>You have requested to reset your password at http://www.zerotoheroes.com. "
				+ "If you don't recall having made that request, please simply ignore this email.</p>"
				+ "<p>Otherwise, please click on <a href=\"" + url + "\">this link</a> to reset your password.</p>"
				+ "<p>If you have any question, please reply to this email. Have a good day!</p>";
		String subject = "Zero to Heroes reset password link";

		if ("fr".equalsIgnoreCase(user.getPreferredLanguage())) {
			body = "<p>Vous avez demandé à réinitialiser votre mot de passe depuis http://www.zerotoheroes.com. "
					+ "Si vous ne vous souvenez pas avoir fait cette requête, veuillez simplement ignore cet email.</p>"
					+ "<p>Dans le cas contraire, veuillez cliquer sur <a href=\"" + url + "\">ce lien</a> pour réinitialiser votre mot de passe.</p>"
					+ "<p>Si vous avez n'importe quelle question, n'hésitez pas à répondre à cet email. Passez une bonne journée !</p>";
			subject = "Réinitialisation du mot de passe sur Zero to Heroes";
		}
		//@formatter:on

		EmailMessage message = EmailMessage.builder().from("Zero to Heroes reset password <contact@zerotoheroes.com>")
				.to(user.getEmail()).subject(subject).content(body).type("text/html").build();
		emailSender.send(message);
	}

	public void notifyNewUser(User user) {
		if (!"prod".equalsIgnoreCase(environment)) return;

		String recipient = user.getEmail();

		//@formatter:off
		String body = "Hey there!<br/>"
				+ "<p>I really appreciate you joining us at Zero to Heroes, and I know you'll love it "
				+ "when you see how easier it has just become to have your play analyzed.</p>"
				+ "<p>We built Zero to Heroes to help (e-)athletes grow and improve together, "
				+ "and I hope we'll be able to do that for you too.</p>"
				+ "<p>If you wouldn't mind, I'd love it if you answered one quick question: why did you sign up on Zero to Heroes?</p>"
				+ "<p>I'm asking because knowing what made you sign up is really helpful for us in making sure we're delivering what our "
				+ "users want. Just hit \"reply\" and let me know.</p>"
			    + "<p>And by the way, feel free to contact me if you have any question, suggestion or complaint, "
			    + "and I'll be happy to help you :)</p>"
				+ "<p>Thanks,</p>"
				+ "<p>Seb</p>"
				+ "<p>Zero to Heroes</p>";
		String subject = "You're in :) | Plus, a quick question...";

		if ("fr".equalsIgnoreCase(user.getPreferredLanguage())) {
			body = "Bonjour!<br/>"
					+ "<p>Ca me fait très plaisir de vous voir nous rejoindre sur Zero to Heroes, et je sais que vous adorerez "
					+ "le moment où vous réaliserez à quel point c'est devenu facile d'avoir votre jeu analysé.</p>"
					+ "<p>Nous avons construit Zero to Heroes pour aider les sportifs et gamers à grandir et progresser ensemble, "
					+ "et j'espère que nous arriverons à vous aider vous aussi.</p>"
					+ "<p>Si cela ne vous gêne pas, cela me ferait très plaisir si vous pouviez répondre à une question rapide: "
					+ "pourquoi vous êtes-vous inscrit sur Zero to Heroes ?<p>"
					+ "<p>Je vous demande ça parce que savoir ces raisons nous est très utile pour être sûrs de fournir ce dont nos utilisateurs "
					+ "ont besoin. Cliquez simplement sur \"répondre\" et laissez-moi un message.</p>"
				    + "<p>Et au fait, n'hésitez pas à me contacter si vous avez la moindre question, suggestion ou réclamation, "
				    + "et je vous aiderai avec plaisir :)</p>"
					+ "<p>Merci,</p>"
					+ "<p>Seb</p>"
					+ "<p>Zero to Heroes</p>";
			subject = "Bienvenue :) | Et une question rapide...";
		}
		//@formatter:on

		EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to(recipient).subject(subject)
				.content(body).type("text/html").build();
		emailSender.send(message);
	}
}
