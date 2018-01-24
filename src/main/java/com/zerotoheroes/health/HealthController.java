package com.zerotoheroes.health;

import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@RepositoryRestController
@RequestMapping(value = "/monitor")
public class HealthController {

	@RequestMapping(value = "/health", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> checkHealth() {
		return new ResponseEntity<String>("Health is ok", HttpStatus.OK);
	}
}

