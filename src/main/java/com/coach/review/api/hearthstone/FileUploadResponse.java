package com.coach.review.api.hearthstone;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class FileUploadResponse {

	private List<String> reviewIds;
	private String message;

}
