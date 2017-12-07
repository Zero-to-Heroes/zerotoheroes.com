package com.coach.review;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.coach.core.notification.EmailMessage;
import com.coach.core.notification.EmailSender;
import com.coach.core.notification.ExecutorProvider;
import com.coach.core.security.User;
import com.coach.notifications.Notification;
import com.coach.notifications.NotificationCommentData;
import com.coach.notifications.NotificationReviewData;
import com.coach.profile.Profile;
import com.coach.user.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class EmailNotifier {

	@Autowired
	EmailSender emailSender;

	@Autowired
	UserRepository userRepo;

	@Autowired
	private ExecutorProvider executorProvider;

	String environment;

	@Autowired
	public EmailNotifier(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	public void notifyNewComment(User subscriber, Comment comment, Review review) {
		if (!"prod".equalsIgnoreCase(environment)) {
			log.debug("Sending email to " + subscriber.getUsername());
			return;
		}

		String recipient = subscriber.getEmail();

		//@formatter:off
		String body = "Hey there!<br/>"
				+ "<p>" + comment.getAuthor() + " has just added a comment on review " + review.getTitle() + ". "
						+ "Click <a href=\"" + review.getUrl() +  "#" + comment.getId() + "\">here</a> to see what they said.</p>"
			    + "<p><small>And if you wish to stop receiving notifications on this review, just hit \"unsubsribe\" from the url above</small></p>";
		String subject = "New comment on review " + review.getTitle() + " at ZeroToHeroes";

//		if ("fr".equalsIgnoreCase(subscriber.getPreferredLanguage())) {
//			body = "Bonjour!<br/>"
//					+ "<p>"
//					+ comment.getAuthor()
//					+ " vient d'ajouter un commentaire sur la vidéo " + review.getTitle() + ". "
//					+ "Cliquez <a href=\""
//					+ review.getUrl() + "#" + comment.getId()
//					+ "\">ici</a> pour voir le commentaire.</p>"
//					+ "<p><small>Et si vous ne voulez plus recevoir de notifications sur cette vidéo, cliquez simplement sur "
//					+ "\"désinscription\" depuis la page ci-dessus</small></p>";
//			subject = "Nouveau commentaire sur la revue " + review.getTitle() + " sur Zero to Heroes";
//		}
		//@formatter:on

		EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to(recipient).subject(subject)
				.content(body).type("text/html; charset=UTF-8").build();
		emailSender.send(message);
	}

	public void notifyNewMultiComment(User subscriber, Collection<Comment> comments, Review review) {
		if (!"prod".equalsIgnoreCase(environment)) {
			log.debug("Sending email to " + subscriber.getUsername());
			return;
		}

		String recipient = subscriber.getEmail();
		String author = comments.iterator().next().getAuthor();

		//@formatter:off
		String body = "Hey there!<br/>"
				+ "<p>" + author + " has just added multiple comments on review " + review.getTitle() + ". "
						+ "Click <a href=\"" + review.getUrl() + "\">here</a> to see what they said.</p>"
			    + "<p><small>And if you wish to stop receiving notifications on this review, just hit \"unsubsribe\" from the url above</small></p>";
		String subject = "New multiple comments on review " + review.getTitle() + " at ZeroToHeroes";

//		if ("fr".equalsIgnoreCase(subscriber.getPreferredLanguage())) {
//			body = "Bonjour!<br/>"
//					+ "<p>"
//					+ author
//					+ " vient d'ajouter un commentaire multiple sur la vidéo " + review.getTitle() + ". "
//					+ "Cliquez <a href=\""
//					+ review.getUrl()
//					+ "\">ici</a> pour voir les commentaires.</p>"
//					+ "<p><small>Et si vous ne voulez plus recevoir de notifications sur cette vidéo, cliquez simplement sur "
//					+ "\"désinscription\" depuis la page ci-dessus</small></p>";
//			subject = "Nouveau commentaire sur la revue " + review.getTitle() + " sur Zero to Heroes";
//		}
		//@formatter:on

		EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to(recipient).subject(subject)
				.content(body).type("text/html; charset=UTF-8").build();
		emailSender.send(message);
	}

	public void notifyNewReview(String recipientEmail, Review review) {
		if (!"prod".equalsIgnoreCase(environment)) {
			log.debug("Sending email to " + recipientEmail);
			return;
		}

		String sportUrl = "http://www.zerotoheroes.com/s/" + review.getSport().getKey().toLowerCase();
		//@formatter:off
		String body = "Hey there!<br/>"
				+ "<p>" + review.getAuthor() + " has just posted a new review \"" + review.getTitle() + "\". "
						+ "Click <a href=\"" + review.getUrl() + "\">here</a> to have a look.</p>"
				+ "<p><small>And if you wish to stop receiving notifications on this review, just hit \"unsubsribe\" "
						+ "on the <a href=\"" + sportUrl + "\">sport page</a></small></p>";
		String subject = "New " + review.getSport().getValue() + " review posted at ZeroToHeroes";

//		if ("fr".equalsIgnoreCase(subscriber.getPreferredLanguage())) {
//			body = "Bonjour!<br/>"
//					+ "<p>" + review.getAuthor() + " vient de poster une nouvelle revue \"" + review.getTitle() + "\". "
//					+ "Cliquez <a href=\"" + review.getUrl() + "\">ici</a> pour aller voir.</p>"
//					+ "<p><small>Et si vous ne voulez plus recevoir de notifications lorsqu'une nouvelle revue est postée, "
//					+ "cliquez simplement sur \"désinscription\" "
//					+ "sur la <a href=\"" + sportUrl + "\">page principale</a></small></p>";
//			subject = "Nouvelle revue postée sur Zero to Heroes - " + review.getSport().getValue();
//		}
		//@formatter:on

		EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to(recipientEmail).subject(subject)
				.content(body).type("text/html; charset=UTF-8").build();
		emailSender.send(message);
	}

	public void sendNotificationRecap(List<Notification> notifs, Profile profile, User subscriber,
			String linkedReview) {
		if (!"prod".equalsIgnoreCase(environment)) {
			log.debug("Sending email to " + subscriber.getUsername());
			return;
		}

		Runnable runnable = new Runnable() {

			@Override
			public void run() {
				String recipient = subscriber.getEmail();

				//@formatter:off
				String body = "Hey " + subscriber.getUsername() + "<br/>"
						+ "<p>You got " + notifs.size() + " new notifications waiting for you <a href=\"http://www.zerotoheroes.com/u/" + subscriber.getUsername()
						+ "/hearthstone/inbox/unread\">in your inbox</a>:";
				//@formatter:on

				// Add a small recap for each notif
				body += "<ul>";
				Set<String> doneReviews = new HashSet<>();

				for (Notification notif : notifs) {

					if (notif.getData() != null) {
						String strNotif = "<li>";
						if (notif.getData() instanceof NotificationCommentData
								&& !doneReviews.contains(((NotificationCommentData) notif.getData()).getReviewId())) {
							NotificationCommentData data = (NotificationCommentData) notif.getData();
							strNotif += "<b>New comments</b> on <a href=\"" + data.getReviewUrl() + "\">"
									+ notif.getTitle() + "</a>";
							doneReviews.add(data.getReviewId());
						}
						else if (notif.getData() instanceof NotificationReviewData) {
							NotificationReviewData data = (NotificationReviewData) notif.getData();
							strNotif += "<b>New review</b>";
							strNotif += " by " + notif.getFrom() + " at <a href=\"" + data.getReviewUrl() + "\">"
									+ notif.getTitle() + "</a>";
							doneReviews.add(data.getReviewId());
						}
						strNotif += "</li>";
						body += strNotif;
					}

				}
				body += "</ul>";

				body += "<p><i>Don't forget to show your support by upvoting / marking comments as helpful when appropriate. "
						+ "And when you're satisfied with the advice you've received on your own review, please hit the (new!) \"I'm satisfied\" button "
						+ "(this will help other reviewers better focus their efforts and make your other reviews rank higher on the Help Others page)</i></p>";

				//@formatter:on
				log.debug("Sending notification recap email " + body);

				String subject = "New notifications on Zero to Heroes";
				if (linkedReview != null) {
					subject = "New notifications for review: " + notifs.get(0).getTitle();
				}

				EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to(recipient)
						.subject(subject).content(body).type("text/html; charset=UTF-8").build();
				emailSender.send(message);
			}
		};
		executorProvider.getExecutor().submit(runnable);
	}

	public void sendResetPasswordLink(User user, String url) {
		log.debug("Sending email to " + user.getEmail() + " with link " + url);
		String body =
				"<p>We received a request to reset the password associated with this email address. <br />"
				+ "To complete the reset process, please click the link below:</p>"
				+ url
				+ "<p>If you did not request this reset, or if you have any question - please reply to this email, "
				+ "and we will get back to you shortly!</p>"
				+ "<p>The <a href=\"http://www.zerotoheroes.com\">Zero to Heroes</a> team</p>";
		String subject = "Zero to Heroes password reset";

		EmailMessage message = EmailMessage.builder()
				.from("Zero to Heroes reset password <contact@zerotoheroes.com>")
				.to(user.getEmail())
				.subject(subject)
				.content(body)
				.type("text/html; charset=UTF-8")
				.build();
		emailSender.send(message);
	}

	public void notifyNewUser(User user) {
		if (!"prod".equalsIgnoreCase(environment)) { return; }

		String recipient = user.getEmail();

		//@formatter:off
		String body = "Hey there!<br/>"
				+ "<p>I really appreciate you joining us at Zero to Heroes, and I know you'll love it "
				+ "when you see how easier it has just become to share your games and have your plays analyzed.</p>"
				+ "<p>We built Zero to Heroes to help gamers grow and improve together, "
				+ "and I hope we'll be able to do that for you too.</p>"
				+ "<p>If you wouldn't mind, I'd love it if you answered one quick question: why did you sign up on Zero to Heroes?</p>"
				+ "<p>I'm asking because knowing what made you sign up is really helpful for us in making sure we're delivering what our "
				+ "users want. Just hit \"reply\" and let me know.</p>"
			    + "<p>And by the way, feel free to join us on our <a href=\"https://discord.gg/uEh9gvJ\" target=\"_blank\">Discord server</a> to meet us !</p>"
				+ "<p>Thanks,</p>"
				+ "<p>Seb</p>"
				+ "<p>Zero to Heroes</p>";
		String subject = "You're in :) | Plus, a quick question...";

//		if ("fr".equalsIgnoreCase(user.getPreferredLanguage())) {
//			body = "Bonjour!<br/>"
//					+ "<p>Ca me fait très plaisir de vous voir nous rejoindre sur Zero to Heroes, et je sais que vous adorerez "
//					+ "le moment où vous réaliserez à quel point c'est devenu facile d'avoir votre jeu analysé.</p>"
//					+ "<p>Nous avons construit Zero to Heroes pour aider les sportifs et gamers à grandir et progresser ensemble, "
//					+ "et j'espère que nous arriverons à vous aider vous aussi.</p>"
//					+ "<p>Si cela ne vous gêne pas, cela me ferait très plaisir si vous pouviez répondre à une question rapide: "
//					+ "pourquoi vous êtes-vous inscrit sur Zero to Heroes ?<p>"
//					+ "<p>Je vous demande ça parce que savoir ces raisons nous est très utile pour être sûrs de fournir ce dont nos utilisateurs "
//					+ "ont besoin. Cliquez simplement sur \"répondre\" et laissez-moi un message.</p>"
//				    + "<p>Et au fait, n'hésitez pas à venir sur notre <a href=\"https://discord.gg/uEh9gvJ\" target=\"_blank\">serveur Discord</a> pour nous rencontrer !</p>"
//					+ "<p>Merci,</p>"
//					+ "<p>Seb</p>"
//					+ "<p>Zero to Heroes</p>";
//			subject = "Bienvenue :) | Et une question rapide...";
//		}
		//@formatter:on

		EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to(recipient).subject(subject)
				.content(body).type("text/html; charset=UTF-8").build();
		emailSender.send(message);
	}
}
