package com.coach.tag;

import org.springframework.data.annotation.Transient;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(of = "text")
public class Tag {

	private String text;
	@Transient
	private String type;

	public Tag(String text) {
		this(text, null);
	}

}
