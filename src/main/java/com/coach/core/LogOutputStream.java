package com.coach.core;

import java.io.IOException;
import java.io.OutputStream;

import lombok.extern.slf4j.Slf4j;

@Slf4j
// http://stackoverflow.com/questions/4595950/capture-javax-net-debug-to-file/4596940#4596940
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
