package com.coach.core.security;

import java.security.SecureRandom;
import java.security.cert.X509Certificate;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.springframework.stereotype.Component;

@Component
public class SSLTools {

	// http://stackoverflow.com/questions/875467/java-client-certificates-over-https-ssl
	// http://stackoverflow.com/questions/13076511/security-risks-in-disabling-ssl-certification-for-java-program
	public void disableCertificateValidation(HttpsURLConnection connection) {
		// Create a trust manager that does not validate certificate chains
		TrustManager[] trustAllCerts = new TrustManager[] { new X509TrustManager() {
			@Override
			public X509Certificate[] getAcceptedIssuers() {
				return new X509Certificate[0];
				// return null;
			}

			@Override
			public void checkClientTrusted(X509Certificate[] certs, String authType) {
				return;
			}

			@Override
			public void checkServerTrusted(X509Certificate[] certs, String authType) {
				return;
			}
		} };

		// Ignore differences between given hostname and certificate hostname
		HostnameVerifier allHostsValid = new HostnameVerifier() {
			@Override
			public boolean verify(String hostname, SSLSession session) {
				return true;
			}
		};

		// Install the all-trusting trust manager
		try {
			SSLContext sc = SSLContext.getInstance("SSL");
			sc.init(null, trustAllCerts, new SecureRandom());
			// HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
			connection.setSSLSocketFactory(sc.getSocketFactory());
			// Setting this parameter creates an internal_error response
			// connection.setHostnameVerifier(allHostsValid);
			// HttpsURLConnection.setDefaultHostnameVerifier(allHostsValid);
		}
		catch (Exception e) {
		}
	}
}
