package com.coach.core.security;

import java.io.IOException;
import java.util.Date;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.AbstractAuthenticationProcessingFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
class StatelessLoginFilter extends AbstractAuthenticationProcessingFilter {

	private final TokenAuthenticationService tokenAuthenticationService;
	private final UserDetailsService userDetailsService;
	private final MongoTemplate mongoTemplate;

	protected StatelessLoginFilter(String urlMapping, TokenAuthenticationService tokenAuthenticationService,
			UserDetailsService userDetailsService, MongoTemplate mongoTemplate, AuthenticationManager authManager) {
		super(new AntPathRequestMatcher(urlMapping));
		this.userDetailsService = userDetailsService;
		this.tokenAuthenticationService = tokenAuthenticationService;
		this.mongoTemplate = mongoTemplate;
		setAuthenticationManager(authManager);
	}

	@Override
	public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
			throws AuthenticationException, IOException, ServletException {
		log.info("Attempting authentication", request, response);
		User user = new ObjectMapper().readValue(request.getInputStream(), User.class);
		log.debug("Request credentials are " + user.getUsername() + " and " + user.getPassword());
		final UsernamePasswordAuthenticationToken loginToken = new UsernamePasswordAuthenticationToken(
				user.getUsername(), user.getPassword());
		log.info("Built login token: " + loginToken);
		Authentication authenticate = getAuthenticationManager().authenticate(loginToken);
		log.info("result is: " + authenticate);
		return authenticate;
	}

	@Override
	protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain,
			Authentication authentication) throws IOException, ServletException {

		// Lookup the complete User object from the database and create an
		// Authentication for it
		final User authenticatedUser = (User) userDetailsService.loadUserByUsername(authentication.getName());
		final UserAuthentication userAuthentication = new UserAuthentication(authenticatedUser);

		// Add the custom token as HTTP header to the response
		tokenAuthenticationService.addAuthentication(response, userAuthentication);

		// Add the authentication to the Security context
		SecurityContextHolder.getContext().setAuthentication(userAuthentication);

		// Update the user with last connection date
		authenticatedUser.setLastLoginDate(new Date());
		mongoTemplate.save(authenticatedUser);
	}

	@Override
	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
			throws IOException, ServletException {
		log.debug("doFilter", req, res);
		HttpServletRequest request = (HttpServletRequest) req;

		// TODO: for some unknown reason, the SimpleCORSFilter isn't applied to
		// the /api/login request
		HttpServletResponse response = (HttpServletResponse) res;
		response.setHeader("Access-Control-Allow-Origin", "*");
		response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
		response.setHeader("Access-Control-Max-Age", "3600");
		response.setHeader("Access-Control-Allow-Headers", "content-type,X-Auth-Token");
		response.setHeader("Access-Control-Expose-Headers", "X-Auth-Token");

		// Ignore the first "OPTIONS" request. Not clean, but no better solution
		// at the moment. Cf
		// https://github.com/Robbert1/boot-stateless-auth/issues/1
		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			log.debug("Ignoring OPTIONS");
			chain.doFilter(request, res);
			return;
		}
		super.doFilter(req, res, chain);
	}
}