package com.coach.core.rest;

import java.io.IOException;

import lombok.extern.slf4j.Slf4j;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import com.amazonaws.util.StringUtils;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.deser.std.StdScalarDeserializer;
import com.fasterxml.jackson.databind.module.SimpleModule;

@Component
@Primary
@Slf4j
public class TrimmingMapper extends ObjectMapper {

	private static final long serialVersionUID = 8226204269677984978L;

	public TrimmingMapper() {
		log.debug('"Registering trimming module");
		registerModule(new MyModule());
	}
}

@SuppressWarnings("serial")
@Slf4j
class MyModule extends SimpleModule {

	public MyModule() {
		addDeserializer(String.class, new StdScalarDeserializer<String>(String.class) {
			@Override
			public String deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException,
					JsonProcessingException {
				log.debug("trimming value " + jp.getValueAsString());
				return StringUtils.trim(jp.getValueAsString());
			}
		});
	}
}