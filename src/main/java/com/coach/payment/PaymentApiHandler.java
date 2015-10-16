package com.coach.payment;

import java.io.IOException;

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
import com.coach.core.notification.EmailMessage;
import com.coach.core.notification.EmailSender;
import com.coach.core.notification.SlackNotifier;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;

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

	@RequestMapping(value = "/{reviewId}/{coachId}/{email}", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> registerReviewRequest(@PathVariable("reviewId") final String reviewId,
			@PathVariable("coachId") final String coachId, @PathVariable("email") String requesterEmail)
			throws IOException {

		log.debug("Requesting payment");
		Review review = reviewRepo.findById(reviewId);

		Coach coach = CoachRepository.findById(coachId);

		log.info("requesting payment for review " + review + " by coach " + coach + ", requested by " + requesterEmail);
		log.debug("Sending an email");

		EmailMessage message = EmailMessage
				.builder()
				.from("seb@zerotoheroes.com")
				.to("contact@zerotoheroes.com")
				.subject("Payment requested from " + requesterEmail + " to " + coach.getName() + " for "
						+ coach.getTariff())
				.content(
						requesterEmail + " has requested a review for http://www.zerotoheroes.com/#/r/"
								+ review.getId()
								+ ".<br/> Coach is " + coach.getName() + " and requested for " + coach.getTariff()
								+ " with following conditions: " + coach.getTariffDescription()
								+ ".<br/><br/> For information, full details of " + coach + "<br/>" + review).type(
						"text/html").build();
		emailSender.send(message);
		slackNotifier.notifyNewPaymentRequest(review, coach, requesterEmail);

		return new ResponseEntity<String>("coach contacted", HttpStatus.OK);
	}
}
