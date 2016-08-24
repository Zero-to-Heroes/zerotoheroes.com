package com.coach;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;

import org.junit.Test;

import com.coach.core.notification.ExecutorProvider;

public class StressTestDb {

	private ExecutorProvider executorProvider = new ExecutorProvider();

	@Test
	public void testQuery() throws IOException {

		//@formatter:off
		final String jsonCriteria =
				"{\"wantedTags\":[],"
				+ "\"unwantedTags\":[],"
				+ "\"reviewType\":null,"
				+ "\"sort\":\"creationDate\","
				+ "\"participantDetails\":"
					+ "{\"playerCategory\":\"rogue\","
					+ "\"opponentCategory\":null,"
					+ "\"skillLevel\":[]},"
				+ "\"minComments\":0,"
				+ "\"maxComments\":3,"
				+ "\"sport\":\"hearthstone\","
				+ "\"pageNumber\":1}";
		//@formatter:on

		for (int i = 0; i < 1; i++) {
			new Thread() {
				@Override
				public void run() {
					System.out.println("Sapwning new thread ");

					try {
						HttpURLConnection httpcon = (HttpURLConnection) new URL(
								"http://localhost:8080/api/reviews/query").openConnection();

						httpcon.setDoOutput(true);
						httpcon.setDoInput(true);

						httpcon.setRequestProperty("Content-Type", "application/json");
						httpcon.setRequestProperty("Accept", "application/json");
						httpcon.setRequestMethod("POST");
						httpcon.connect();

						// byte[] outputBytes = jsonCriteria.getBytes("UTF-8");
						final OutputStreamWriter osw = new OutputStreamWriter(httpcon.getOutputStream());
						osw.write(jsonCriteria);
						osw.flush();
						osw.close();

						BufferedReader rd = new BufferedReader(new InputStreamReader(httpcon.getInputStream()));
						String line;
						while ((line = rd.readLine()) != null) {
							// System.out.println(line);
						}
						rd.close();
						System.out.println("call done");
					}
					catch (Exception e) {
						System.err.println(e);
					}
				}
			}.start();
		}
	}
}
