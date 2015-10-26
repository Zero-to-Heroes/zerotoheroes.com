package com.coach.sequence;

import java.util.Date;
import java.util.List;

import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import org.springframework.data.annotation.Id;

import com.coach.review.Review.Sport;
import com.coach.tag.Tag;

@Getter
@Setter
@ToString
@EqualsAndHashCode(of = "id")
@NoArgsConstructor
public class Sequence {

	@Id
	private String id;

	private Sport sport;
	private String videoId;
	private String videoKey;
	private int start;
	private String title;
	private Date creationDate;
	private String videoPosition;
	private List<Tag> tags;
}
