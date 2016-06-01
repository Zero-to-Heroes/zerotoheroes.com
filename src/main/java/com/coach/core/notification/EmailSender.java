package com.coach.core.notification;

import java.util.Properties;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class EmailSender {

	private final String smtpUsername, smtpPassword, smtpRegion;

	@Autowired
	private ExecutorProvider executorProvider;

	@Autowired
	public EmailSender(@Value("${smtp.username}") String smtpUsername, @Value("${smtp.password}") String smtpPassword,
			@Value("${smtp.region}") String smtpRegion) {
		super();
		this.smtpUsername = smtpUsername;
		this.smtpPassword = smtpPassword;
		this.smtpRegion = smtpRegion;
	}

	public void send(EmailMessage message) {
		Runnable runnable = new EmailSenderRunnable(message);
		executorProvider.getExecutor().submit(runnable);
		// Thread mailThread = new Thread(runnable);
		// mailThread.start();
	}

	@AllArgsConstructor
	private class EmailSenderRunnable implements Runnable {

		private final EmailMessage message;

		@Override
		public void run() {
			// Create a Properties object to contain connection configuration
			// information.
			Properties props = System.getProperties();
			props.put("mail.transport.protocol", "smtp");
			props.put("mail.smtp.port", 587);

			// Set properties indicating that we want to use STARTTLS to encrypt
			// the
			// connection.
			// The SMTP session will begin on an unencrypted connection, and
			// then
			// the client
			// will issue a STARTTLS command to upgrade to an encrypted
			// connection.
			props.put("mail.smtp.auth", "true");
			props.put("mail.smtp.starttls.enable", "true");
			props.put("mail.smtp.starttls.required", "true");
			props.put("mail.mime.charset", "UTF-8");

			// Create a Session object to represent a mail session with the
			// specified properties.
			Session session = Session.getDefaultInstance(props);

			// Create a message with the specified information.
			MimeMessage msg = new MimeMessage(session);
			Transport transport = null;
			try {
				msg.setFrom(new InternetAddress(message.getFrom()));
				for (String recipient : message.getRecipients()) {
					msg.addRecipient(Message.RecipientType.TO, new InternetAddress(recipient));
				}
				msg.setSubject(message.getSubject(), "UTF-8");
				msg.setContent(message.getContent(), message.getType());

				log.debug("Email created, attempting to send it");

				// Create a transport.
				transport = session.getTransport();

				// Connect to Amazon SES using the SMTP username and password
				// you
				// specified above.
				transport.connect(smtpRegion, smtpUsername, smtpPassword);

				transport.sendMessage(msg, msg.getAllRecipients());
				log.debug("Mail sent using standard transport");
			}
			catch (MessagingException e) {
				log.error("Could not send email", e);
			}
			finally {
				if (transport != null) {
					try {
						transport.close();
					}
					catch (MessagingException e) {
						log.error("Could not close transport!", e);
					}
				}
			}
		}

	}
}
