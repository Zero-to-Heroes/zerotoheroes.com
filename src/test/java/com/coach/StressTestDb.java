package com.coach;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;

import javax.xml.bind.DatatypeConverter;

import org.junit.Test;

import com.coach.core.notification.ExecutorProvider;

public class StressTestDb {

	private ExecutorProvider executorProvider = new ExecutorProvider();

	@Test
	public void testQuery() throws IOException { 
		String binary = DatatypeConverter.printBase64Binary("devsecrettoken".getBytes());
		System.out.println(binary);
		byte[] decoded = DatatypeConverter.parseBase64Binary(binary);
		System.out.println(new String(decoded));
	}
}
