package com.coach.core;

import java.io.IOException;
import java.io.OutputStream;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class LogOutputStream extends OutputStream {

	private StringBuilder sb = new StringBuilder();

	@Override
	public void write(int b) throws IOException {
		if (b == '\n') {
			log.info(sb.toString());
			sb.setLength(0);
		}
		else {
			sb.append((char) b);
		}
	}

}
