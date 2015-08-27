package com.coach.common;

import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.IntegrationTest;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.web.client.RestTemplate;

import com.coach.Application;
import com.coach.review.access.ReviewRepository;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = { Application.class })
@WebAppConfiguration
@IntegrationTest("server.port:8181")
public abstract class BaseIntegrationTest {

	private static final String LOCALHOST_URL = "http://localhost:8181/";
	// protected static final String TEST_USER = "usertest";
	// protected static final String TEST_USER_PWD = "usertest";

	@Autowired
	protected ReviewRepository reviewRepository;

	protected String doAnonymousExchange(final HttpMethod method, final String path, String request) {
		RestTemplate restTemplate = new RestTemplate();
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.setContentType(MediaType.APPLICATION_JSON);
		HttpEntity<String> testRequest = new HttpEntity<>(request, httpHeaders);
		HttpEntity<String> testResponse = restTemplate
				.exchange(LOCALHOST_URL + path, method, testRequest, String.class);
		return testResponse.getBody();
	}

	// protected String doAuthenticatedExchange(final String user, final
	// HttpMethod method, final String path) {
	// return doAuthenticatedExchange(user, method, path, null, user);
	// }
	//
	// protected String doAuthenticatedExchange(final String user, final
	// HttpMethod method, final String path,
	// String request, String password) {
	// RestTemplate restTemplate = new RestTemplate();
	// HttpHeaders httpHeaders = new HttpHeaders();
	// httpHeaders.setContentType(MediaType.APPLICATION_JSON);
	// HttpEntity<String> login = new HttpEntity<>(
	// "{\"username\":\"" + user + "\",\"password\":\"" + password + "\"}",
	// httpHeaders);
	// ResponseEntity<Void> results = restTemplate.postForEntity(LOCALHOST_URL +
	// "/api/login", login, Void.class);
	//
	// httpHeaders.add("X-AUTH-TOKEN",
	// results.getHeaders().getFirst("X-AUTH-TOKEN"));
	// HttpEntity<String> testRequest = new HttpEntity<>(request, httpHeaders);
	// HttpEntity<String> testResponse = restTemplate.exchange(LOCALHOST_URL +
	// path, method, testRequest,
	// String.class);
	// return testResponse.getBody();
	// }
	//
	// protected void doAuthenticatedDelete(final String user, final String
	// path, String password) {
	// doAuthenticatedExchange(user, HttpMethod.POST, path + "?_method=DELETE",
	// null, password);
	// }
}
