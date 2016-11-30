package com.coach.api.hearthstone;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.zip.GZIPInputStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryRestController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.coach.plugin.hearthstone.HSReplay;
import com.zerotoheroes.hsgameconverter.ReplayConverter;

import lombok.extern.slf4j.Slf4j;

@RepositoryRestController
@RequestMapping(value = "/api/hearthstone/converter")
@Slf4j
public class LogFileConverter {

	@Autowired
	HSReplay hsReplay;

	@RequestMapping(value = "/replay", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> convertLogToXml(@RequestParam("data") String fullLogs)
			throws Exception {
		log.debug("Receiving " + fullLogs);
		// Are there several games in the single file?
		// byte[] logInfo = getLogInfo(data);
		// String fullLogs = new String(logInfo, "UTF-8");
		String xml = new ReplayConverter().xmlFromLogs(fullLogs);
		return new ResponseEntity<String>(xml, HttpStatus.OK);
	}

	private byte[] getLogInfo(MultipartFile data) throws IOException {
		byte[] bytes = data.getBytes();

		try {
			ByteArrayInputStream bytein = new ByteArrayInputStream(bytes);
			GZIPInputStream gzin = new GZIPInputStream(bytein);
			ByteArrayOutputStream byteout = new ByteArrayOutputStream();

			int res = 0;
			byte buf[] = new byte[1024];
			while (res >= 0) {
				res = gzin.read(buf, 0, buf.length);
				if (res > 0) {
					byteout.write(buf, 0, res);
				}
			}
			byte uncompressed[] = byteout.toByteArray();
			return uncompressed;
		}
		catch (IOException e) {
			return bytes;
		}
	}
}
