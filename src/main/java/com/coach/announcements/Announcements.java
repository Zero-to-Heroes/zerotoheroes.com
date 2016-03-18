package com.coach.announcements;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;

import lombok.Data;

@Data
public class Announcements {

	@Id
	private String id;
	private List<Announcement> announcements = new ArrayList<>();
}
