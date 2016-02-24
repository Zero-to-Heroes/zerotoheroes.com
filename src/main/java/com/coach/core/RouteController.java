package com.coach.core;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import com.coach.review.ReviewRepository;

import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class RouteController {

	@Autowired
	ReviewRepository reviewRepo;

	//@formatter:off
	@RequestMapping({
//		"/r/{reviewId}",
		"/r/{sport}/{reviewId}",
		"/r/{sport}/{reviewId}/{reviewTitle}",
		"/r/{reviewId}/{reviewTitle}"
	})
	//@formatter:on
	public String reviewHandler(@PathVariable("reviewId") String reviewId) throws IOException {

		log.debug("In reviewHandler for id " + reviewId);

		if (reviewRepo.findById(reviewId) == null) {
			log.debug("forwarding to 404");
			return "forward:/404.html";
		}

		log.debug("Forwarding to index.html");
		return "forward:/index.html";
	}

	//@formatter:off
	@RequestMapping({
//			"/reviews",
//			"/upload",
			"/s/{sport}",
			"/s/{sport}/{pageNumber}",
			"/s/{sport}/upload",
			"/s/{sport}/upload/{type}",
			"/c/{coach}/{sport}",
			"/coach/{coach}/{sport}",
			"/squash",
			"/heroesofthestorm",
			"/hearthstone",
			"/badminton",
			"/leagueoflegends"
	})
	//@formatter:on
	public String index(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		log.debug("Forwarding to index.html");
		return "forward:/index.html";
	}
}
