package com.coach.payment;

import java.io.IOException;
import java.util.Properties;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.coach.coaches.Coach;
import com.coach.coaches.CoachRepository;
import com.coach.review.Review;
import com.coach.review.access.ReviewRepository;

@RepositoryRestController
@RequestMapping(value = "/api/payment")
@Slf4j
public class PaymentApiHandler {

	@Autowired
	ReviewRepository reviewRepo;

	@RequestMapping(value = "/{reviewId}/{coachId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> addComment(@PathVariable("reviewId") final String reviewId,
			@PathVariable("coachId") final String coachId) throws IOException {

		log.debug("Requesting payment");
		Review review = reviewRepo.findById(reviewId);

		Coach coach = CoachRepository.findById(coachId);

		log.info("requesting payment for review " + review + " by coach " + coach);

		log.debug("Sending an email");

		// Create a Properties object to contain connection configuration
		// information.
		Properties props = System.getProperties();
		props.put("mail.transport.protocol", "smtp");
		props.put("mail.smtp.port", 587);

		// Set properties indicating that we want to use STARTTLS to encrypt the
		// connection.
		// The SMTP session will begin on an unencrypted connection, and then
		// the client
		// will issue a STARTTLS command to upgrade to an encrypted connection.
		props.put("mail.smtp.auth", "true");
		props.put("mail.smtp.starttls.enable", "true");
		props.put("mail.smtp.starttls.required", "true");

		// Create a Session object to represent a mail session with the
		// specified properties.
		Session session = Session.getDefaultInstance(props);

		// Create a message with the specified information.
		MimeMessage msg = new MimeMessage(session);
		Transport transport = null;
		try {
			msg.setFrom(new InternetAddress("seb@zerotoheroes.com"));
			msg.setRecipient(Message.RecipientType.TO, new InternetAddress("seb@zerotoheroes.com"));
			msg.setSubject("Payment requested");
			msg.setContent("For review " + review + " to coach " + coach, "text/plain");

			log.debug("Email created, attempting to send it");

			// Create a transport.
			transport = session.getTransport();

			// Connect to Amazon SES using the SMTP username and password you
			// specified above.
			transport.connect("email-smtp.us-west-2.amazonaws.com", "AKIAIZYHQOWVUSCKHFNA",
					"AkuHjxAaNJ6asBOKgo4JU9bf64xKXIRtIBIBonJYaFqQ");

			transport.sendMessage(msg, msg.getAllRecipients());
			log.debug("Mail sent using standard transport");
		}
		catch (MessagingException e) {
			log.error("Could not send email", e);
		}
		finally {
			if (transport != null) try {
				transport.close();
			}
			catch (MessagingException e) {
				log.error("Could not close transport!", e);
			}
		}

		return new ResponseEntity<String>("coach contacted", HttpStatus.OK);
	}
}
