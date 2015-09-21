package com.coach.core.security;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.bind.DatatypeConverter;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TokenAuthenticationService {

	private static final String AUTH_HEADER_NAME = "X-Auth-Token";
	private static final long TEN_DAYS = 1000 * 60 * 60 * 24 * 10;

	private final TokenHandler tokenHandler;

	@Autowired
	public TokenAuthenticationService(@Value("${token.secret}") String secret) {
		tokenHandler = new TokenHandler(DatatypeConverter.parseBase64Binary(secret));
	}

	public void addAuthentication(HttpServletResponse response, UserAuthentication authentication) {
		log.debug("Adding authentication" + response + authentication);
		final User user = authentication.getDetails();
		user.setExpires(System.currentTimeMillis() + TEN_DAYS);
		response.addHeader(AUTH_HEADER_NAME, tokenHandler.createTokenForUser(user));
	}

	public Authentication getAuthentication(HttpServletRequest request) {
		log.debug("Retrieving authentication " + request);
		final String token = request.getHeader(AUTH_HEADER_NAME);
		log.debug("Retrieved token " + token);
		if (token != null) {
			final User user = tokenHandler.parseUserFromToken(token);
			log.debug("Retrieved user from token" + user);
			if (user != null) { return new UserAuthentication(user); }
		}
		return null;
	}
}
