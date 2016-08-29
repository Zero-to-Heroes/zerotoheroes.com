package com.coach.plugin.hearthstone.integrations;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintStream;
import java.io.StringWriter;
import java.lang.reflect.InvocationTargetException;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.net.ssl.SSLSocket;

import org.apache.commons.beanutils.PropertyUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLContextBuilder;
import org.apache.http.conn.ssl.TrustSelfSignedStrategy;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Autowired;

import com.amazonaws.event.ProgressEvent;
import com.amazonaws.event.ProgressEventType;
import com.amazonaws.event.ProgressListener;
import com.coach.core.LogOutputStream;
import com.coach.core.notification.SlackNotifier;
import com.coach.core.security.SSLTools;
import com.coach.core.storage.S3Utils;
import com.coach.plugin.IntegrationPlugin;
import com.coach.review.HasText;
import com.coach.review.Review;
import com.coach.review.ReviewRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class HsReplayNet implements IntegrationPlugin {

	private static final String URL_PATTERN = "(http(?:s)?:\\/\\/(?:www\\.)?hsreplay\\.net\\/replay\\/)([\\d\\-a-zA-Z]+)";

	@Autowired
	ReviewRepository repo;

	@Autowired
	S3Utils s3utils;

	@Autowired
	SSLTools sslTools;

	@Autowired
	SlackNotifier slackNotifier;

	public HsReplayNet() {
		System.setProperty("https.protocols", "TLSv1,TLSv1.1,TLSv1.2");
	}

	@Override
	public String getName() {
		return "hs-integration-hsreplaynet";
	}

	@Override
	public String execute(String currentUser, Map<String, String> pluginData, HasText textHolder) throws IOException {
		return textHolder.getText();
	}

	@Override
	public boolean isApplicable(String url) {
		Pattern pattern = Pattern.compile(URL_PATTERN, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(url);
		return matcher.matches();
	}

	@Override
	public void integrateRemoteData(String gameUrl, final Review review) throws Exception {
		log.debug("integrating remote data " + gameUrl);
		log.debug("with review " + review);
		gameUrl = gameUrl.replaceAll("https", "http");
		// First - create a file that contains the draft info to upload to s3
		String stringXml = buildReplay(gameUrl);
		log.debug("built xml ");
		// Flag the review to show that we are handling it
		review.setMediaType("game-replay");
		review.setText("Imported from " + gameUrl);
		log.debug("strResult ");

		// Then upload the file
		final String key = review.buildKey(UUID.randomUUID().toString(), "hearthstone/replay");
		ProgressListener listener = new ProgressListener() {

			@Override
			public void progressChanged(ProgressEvent progressEvent) {
				log.debug("progress2 " + progressEvent.getEventType());
				if (progressEvent.getEventType().equals(ProgressEventType.TRANSFER_COMPLETED_EVENT)) {
					// And finally update the review with all the necessary data
					review.setKey(key);
					review.setFileType("json");
					review.setMediaType("game-replay");
					review.setReviewType("game-replay");
					review.setTranscodingDone(true);
					repo.save(review);
					log.debug("review " + review);
				}
			}
		};
		s3utils.putToS3(stringXml, key, "text/xml", listener);

	}

	// public static void main(String[] args) throws Exception {
	// //
	// // System.setProperty("https.protocols", "SSLv3");
	// // System.setProperty("jsse.enableSNIExtension", "false");
	// // OutputStream os = new LogOutputStream();
	// // PrintStream ps = new PrintStream(os);
	// // System.setOut(ps);
	// HsReplayNet hsReplayNet = new HsReplayNet();
	// hsReplayNet.sslTools = new SSLTools();
	// String buildReplay =
	// hsReplayNet.buildReplay("http://hsreplay.net/replay/jdUbSjsEcBL5rCT7dgMXRn");
	// System.out.println(buildReplay);
	// }

	private String buildReplay(String gameUrl) throws Exception {
		Pattern pattern = Pattern.compile(URL_PATTERN, Pattern.MULTILINE);
		Matcher matcher = pattern.matcher(gameUrl);
		log.debug(matcher.toString());
		matcher.matches();

		String gameId = matcher.group(2);

		String apiUrl = "https://hsreplay.net/api/v1/games/" + gameId + "/";
		log.info("calling rest api");
		String resultString = restGetCall(apiUrl);
		log.info("called rest aip ");

		JSONObject api = new JSONObject(resultString);
		String downloadLink = api.getString("replay_xml");

		String stringXml = Jsoup.connect(downloadLink).userAgent("Mozilla").get().select("hsreplay").toString();
		downloadLink = downloadLink.replace("https", "http");

		// Capitalize what needs to be capitalize
		stringXml = stringXml.replaceAll("<(/)?hsreplay", "<$1HSReplay").replaceAll("<(/)?gameentity", "<$1GameEntity")
				.replaceAll("<(/)?game", "<$1Game").replaceAll("<(/)?tagchange", "<$1TagChange")
				.replaceAll("<(/)?tag", "<$1Tag").replaceAll("<(/)?player", "<$1Player")
				.replaceAll("accounthi", "accountHi").replaceAll("accountlo", "accountLo")
				.replaceAll("playerid", "playerID").replaceAll("cardid", "cardID").replaceAll("<(/)?deck", "<$1Deck")
				.replaceAll("<(/)?card", "<$1Card").replaceAll("<(/)?fullentity", "<$1FullEntity")
				.replaceAll("<(/)?action", "<$1Action").replaceAll("<(/)?block", "<$1Block")
				.replaceAll("<(/)?showentity", "<$1ShowEntity").replaceAll("<(/)?chosenentities", "<$1ChosenEntities")
				.replaceAll("<(/)?choice", "<$1Choice").replaceAll("<(/)?option", "<$1Option")
				.replaceAll("<(/)?hideentity", "<$1HideEntity").replaceAll("<(/)?metadata", "<$1MetaData")
				.replaceAll("<(/)?info", "<$1Info");
		// log.debug("Build xml\n " + stringXml);
		return stringXml;
	}

	// apiUrl looks like
	// https://hsreplay.net/api/v1/games/jdUbSjsEcBL5rCT7dgMXRn
	private String restGetCall(String apiUrl) throws Exception {
		OutputStream os = new LogOutputStream();
		PrintStream ps = new PrintStream(os);
		System.setOut(ps);
		System.setProperty("javax.net.debug", "ALL");
		SSLContextBuilder builder = new SSLContextBuilder();
		builder.loadTrustMaterial(null, new TrustSelfSignedStrategy());
		SSLConnectionSocketFactory sslsf = new SSLConnectionSocketFactory(builder.build(),
				SSLConnectionSocketFactory.ALLOW_ALL_HOSTNAME_VERIFIER) {
			@Override
			protected void prepareSocket(SSLSocket socket) throws IOException {
				try {
					log.info("************ setting socket HOST property *************");
					PropertyUtils.setProperty(socket, "host", "hsreplay.net");
					socket.setEnabledProtocols(new String[] { "SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2" });
					log.info("enabled ciphers: " + StringUtils.join(socket.getEnabledCipherSuites(), ","));
					log.info("supported ciphers: " + StringUtils.join(socket.getSupportedCipherSuites(), ","));
					log.info("enabled protocols: " + StringUtils.join(socket.getEnabledProtocols(), ","));
					log.info("SSL Parameters: " + beanToString(socket.getSSLParameters()));
					// socket.setEnabledCipherSuites(
					// new String[] { "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA",
					// "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
					// "TLS_RSA_WITH_AES_256_CBC_SHA",
					// "TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA",
					// "TLS_ECDH_RSA_WITH_AES_256_CBC_SHA",
					// "TLS_DHE_RSA_WITH_AES_256_CBC_SHA",
					// "TLS_DHE_DSS_WITH_AES_256_CBC_SHA",
					// "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA",
					// "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
					// "TLS_RSA_WITH_AES_128_CBC_SHA",
					// "TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA",
					// "TLS_ECDH_RSA_WITH_AES_128_CBC_SHA",
					// "TLS_DHE_RSA_WITH_AES_128_CBC_SHA",
					// "TLS_DHE_DSS_WITH_AES_128_CBC_SHA",
					// "TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA",
					// "TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA",
					// "SSL_RSA_WITH_3DES_EDE_CBC_SHA",
					// "TLS_ECDH_ECDSA_WITH_3DES_EDE_CBC_SHA",
					// "TLS_ECDH_RSA_WITH_3DES_EDE_CBC_SHA",
					// "SSL_DHE_RSA_WITH_3DES_EDE_CBC_SHA",
					// "SSL_DHE_DSS_WITH_3DES_EDE_CBC_SHA",
					// "TLS_ECDHE_ECDSA_WITH_RC4_128_SHA",
					// "TLS_ECDHE_RSA_WITH_RC4_128_SHA",
					// "SSL_RSA_WITH_RC4_128_SHA",
					// "TLS_ECDH_ECDSA_WITH_RC4_128_SHA",
					// "TLS_ECDH_RSA_WITH_RC4_128_SHA",
					// "SSL_RSA_WITH_RC4_128_MD5",
					// "TLS_EMPTY_RENEGOTIATION_INFO_SCSV" });
					// log.info("enabled ciphers now: " +
					// StringUtils.join(socket.getEnabledCipherSuites(), ","));
					// log.info("SSL Parameters now: " +
					// beanToString(socket.getSSLParameters()));
				}
				catch (IllegalAccessException | NoSuchMethodException | InvocationTargetException ex) {
					log.error(ex.getMessage());
					slackNotifier.notifyError(ex);
				}
				super.prepareSocket(socket);
			}

		};
		CloseableHttpClient httpClient = HttpClients.custom().setSSLSocketFactory(sslsf).build();

		HttpGet httpGet = new HttpGet(apiUrl);
		CloseableHttpResponse response1 = httpClient.execute(httpGet);
		StringBuilder result = new StringBuilder();
		try {
			System.out.println(response1.getStatusLine());
			HttpEntity entity1 = response1.getEntity();
			BufferedReader rd = new BufferedReader(new InputStreamReader(entity1.getContent()));
			String line;
			while ((line = rd.readLine()) != null) {
				result.append(line);
			}
			// do something useful with the response body
			// and ensure it is fully consumed
			EntityUtils.consume(entity1);
		}
		finally {
			response1.close();
		}

		// System.out.println("opening connection " +
		// System.getProperty("https.protocols"));
		// URL url = new URL(apiUrl);
		// HttpsURLConnection connection = (HttpsURLConnection)
		// url.openConnection();
		// connection.getSSLSocketFactory().createSocket("",
		// 443).connection.setDoOutput(true);
		// connection.setConnectTimeout(5000);
		// connection.setUseCaches(false);
		// connection.setReadTimeout(5000);
		// connection.setRequestProperty("User-Agent",
		// "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.11 (KHTML, like
		// Gecko) Chrome/23.0.1271.95 Safari/537.11");
		// connection.setRequestProperty("Content-Type", "application/json");
		// connection.setRequestProperty("Accept", "*/*");
		// log.debug("built connection object");
		//
		// BufferedReader rd = new BufferedReader(new
		// InputStreamReader(connection.getInputStream()));
		// String line;
		// StringBuilder result = new StringBuilder();
		// while ((line = rd.readLine()) != null) {
		// result.append(line);
		// }
		// rd.close();
		// connection.disconnect();
		String resultString = result.toString();
		return resultString;
	}

	public static String beanToString(Object object) throws IOException {

		ObjectMapper objectMapper = new ObjectMapper();
		StringWriter stringEmp = new StringWriter();
		objectMapper.configure(SerializationFeature.INDENT_OUTPUT, true);
		objectMapper.writeValue(stringEmp, object);
		return stringEmp.toString();
	}
}
