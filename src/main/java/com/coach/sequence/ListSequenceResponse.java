package com.coach.sequence;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ListSequenceResponse {

	private List<Sequence> sequences;
	private int totalPages;

	public ListSequenceResponse(List<Sequence> sequences) {
		super();
		this.sequences = sequences;
	}

}
