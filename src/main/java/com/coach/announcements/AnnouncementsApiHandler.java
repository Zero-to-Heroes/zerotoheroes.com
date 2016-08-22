package com.coach.announcements;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/announcements")
@Slf4j
public class AnnouncementsApiHandler {

	@Autowired
	AnnouncementsRepository repo;

	private Announcements announcements;

	@RequestMapping(value = "/refresh", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Announcements> refresh() {
		log.info("debug - calling refresh announcements");
		List<Announcements> findAll = repo.findAll();
		if (findAll == null || findAll.size() == 0) {
			Announcements fake = new Announcements();
			repo.save(fake);
			return new ResponseEntity<Announcements>((Announcements) null, HttpStatus.OK);
		}
		announcements = findAll.get(0);
		return new ResponseEntity<Announcements>(announcements, HttpStatus.OK);
	}

	@RequestMapping(method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<Announcements> get() {
		List<Announcements> findAll = repo.findAll();
		if (findAll == null || findAll.size() == 0) {
			Announcements fake = new Announcements();
			repo.save(fake);
			return new ResponseEntity<Announcements>((Announcements) null, HttpStatus.OK);
		}
		Announcements result = findAll.get(0);
		return new ResponseEntity<Announcements>(result, HttpStatus.OK);
	}
}
