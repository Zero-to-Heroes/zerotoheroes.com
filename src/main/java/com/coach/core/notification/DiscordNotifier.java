package com.coach.core.notification;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.URL;
import java.net.URLConnection;
import java.util.concurrent.Callable;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.coach.review.Review;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class DiscordNotifier {

	@Autowired
	private ExecutorProvider executorProvider;

	@Autowired
	private SlackNotifier slackNotifier;

	@Value("${environment}")
	private String environment;

	@Value("${discordbot.host}")
	private String discordbotUrl;

	@Value("${discordbot.port}")
	private String discordbotPort;

	public void notifyNewReview(final Review review) {

		executorProvider.getExecutor().submit(new Callable<String>() {
			@Override
			public String call() throws IOException {
				String endpoint = "http://" + discordbotUrl + ":" + discordbotPort;
				log.debug("Sending request to " + endpoint);
				String strReivew = new ObjectMapper().writeValueAsString(review);

				// Step2: Now pass JSON File Data to REST Service
				try {
					URL url = new URL(endpoint);
					URLConnection connection = url.openConnection();
					connection.setDoOutput(true);
					connection.setRequestProperty("Content-Type", "application/json");
					connection.setConnectTimeout(5000);
					connection.setReadTimeout(5000);
					OutputStreamWriter out = new OutputStreamWriter(connection.getOutputStream());
					out.write(strReivew);
					out.close();

					BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));

					while (in.readLine() != null) {
					}
					in.close();
				}
				catch (Exception e) {
					slackNotifier.notifyError(e, review);
					log.error("Could not notify discord bot at " + endpoint, e);
				}

				return null;
			}
		});
	}
}
