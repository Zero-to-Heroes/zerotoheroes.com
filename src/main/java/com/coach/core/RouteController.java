package com.coach.core;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@Slf4j
public class RouteController {
	@RequestMapping({
			"/reviews",
			"/upload",
			"/r/{reviewId}",
			"/r/{sport}/{reviewId}",
			"/s/{sport}",
			"/s/{sport}/upload"
	})
	public String index(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		log.debug("Forwarding to index.html");
		return "forward:/index.html";
	}
}
