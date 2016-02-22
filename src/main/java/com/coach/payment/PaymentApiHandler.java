package com.coach.payment;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.coach.coaches.CoachInformation;
import com.coach.coaches.CoachRepositoryDao;
import com.coach.core.notification.EmailMessage;
import com.coach.core.notification.EmailSender;
import com.coach.core.notification.SlackNotifier;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/payment")
@Slf4j
public class PaymentApiHandler {

	@Autowired
	ReviewRepository reviewRepo;

	@Autowired
	EmailSender emailSender;

	@Autowired
	SlackNotifier slackNotifier;

	@Autowired
	CoachRepositoryDao dao;

	@RequestMapping(value = "/{reviewId}/{coachId}/{email}/{tariffId}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> registerReviewRequest(@PathVariable("reviewId") final String reviewId,
			@PathVariable("coachId") final String coachId, @PathVariable("email") String requesterEmail,
			@PathVariable("tariffId") int index) throws IOException {

		log.debug("Requesting payment");
		Review review = reviewRepo.findById(reviewId);

		CoachInformation coach = dao.findById(coachId);

		log.info("requesting payment for review " + review.getUrl() + " by coach " + coach + ", requested by "
				+ requesterEmail);
		log.debug("Sending an email");

		EmailMessage message = EmailMessage.builder().from("seb@zerotoheroes.com").to("contact@zerotoheroes.com")
				.subject("Payment requested from " + requesterEmail + " to " + coach.getName() + " for "
						+ coach.getTariff().get(index))
				.content(requesterEmail + " has requested a review for " + review.getUrl() + ".<br/> Coach is "
						+ coach.getName() + " and requested for " + coach.getTariff().get(index)
						+ " with following conditions: " + coach.getTariffDescription().get(index)
						+ ".<br/><br/> For information, full details of " + coach + "<br/>" + review)
				.type("text/html").build();

		log.debug("Sending email " + message.getContent());

		emailSender.send(message);
		slackNotifier.notifyNewPaymentRequest(review, coach, requesterEmail, index);

		return new ResponseEntity<String>("coach contacted", HttpStatus.OK);
	}
}
