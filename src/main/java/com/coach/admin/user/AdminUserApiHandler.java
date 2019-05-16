package com.coach.admin.user;

import static org.springframework.data.mongodb.core.query.Criteria.*;
import static org.springframework.data.mongodb.core.query.Query.*;
import static org.springframework.data.mongodb.core.query.Update.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Field;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.coach.core.security.User;
import com.coach.notifications.NotificationDao;
import com.coach.profile.Profile;
import com.coach.profile.ProfileRepository;
import com.coach.profile.ProfileService;
import com.coach.review.ReviewRepository;
import com.coach.sport.SportRepository;
import com.coach.user.ResetPasswordRepository;
import com.coach.user.UserRepository;
import com.mongodb.WriteResult;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping(value = "/api/admin")
@Slf4j
public class AdminUserApiHandler {

	private static final List<String> UNSUBSCRIBED_EMAILS = Arrays.asList(
			"neo.slavik@gmail.com", "taylor.conant@gmail.com", "ScoZone74@gmail.com", "bdwitheygames@gmail.com", 
			"germanok21@gmail.com", "mt.arnoldussen@gmail.com", "sillyleetlegirl@gmail.com", "tom.oude.veldhuis@hotmail.com", 
			"vincentan12345@gmail.com", "mk.vogel@hotmail.com", "paul.stanish@gmail.com", "0bruno1@gmail.com", 
			"27marquitos@gmail.com", "heliaxb@gmail.com", "james.deeman@gmail.com", "yjpan2017@yahoo.com", 
			"m_jamc@yahoo.com", "alin.ivan13@gmail.com", "otso.sivonen@gmail.com", "robac@wp.pl", "draagos0@gmail.com", 
			"nicolomagallanes@gmail.com", "apo_96@mail.ru", "glarsson16@gmail.com", "benjaminmason02@gmail.com", 
			"kyty3@bk.ru", "shayneorok@gmail.com", "rgarcilu@gmail.com", "fotis.plaskasovitis@hotmail.com", 
			"dr.leavsey@gmail.com", "lucahagedorn@web.de", "david.g.stam@gmail.com", "rdt_23@yahoo.com", 
			"micheal.b12321@gmail.com", "wearne.michael@gmail.com", "gugge2000@hotmail.com", "zdravko@subakov.com", 
			"andycao.16@gmail.com", "pride829@gmail.com", "noodles4noah@gmail.com", "bora_yuksel_@hotmail.com", 
			"da8vii@gmail.com", "Twinadanz@gmail.com", "milk.kai.cheng@gmail.com", "hus.patryk@gmail.com", 
			"cesnasjustas@gmail.com", "david.j.tiplady@gmail.com", "robert1zamboni@gmail.com", "bvxxvd@gmail.com", 
			"Viktimmy@Hotmail.com", "goldsteinbergstein@gmail.com", "tucker.whitcomb@gmail.com", "kayteawu@gmail.com", 
			"hanjuehae@gmail.com", "rasmus992010@hotmail.com", "Nicod155@gmx.de", "kalibur06@gmail.com", 
			"blackdaylight@hotmail.com", "jmattmurphy1993@gmail.com", "adamski.dominik7@gmail.com", "ariel_f21@yahoo.com", 
			"David.24.2@web.de", "rvbayer1@yahoo.com", "yarianyg@gmail.com", "woodn1994@gmail.com", "franklinzolw@gmail.com", 
			"wsgahr@gmail.com", "duan.mack@gmail.com", "awp.senpai@gmail.com", "postivan@gmail.com", "anthonyrschewe@gmail.com", 
			"fegiotell@gmail.com", "daan.detre@telenet.be", "msrulz4@gmail.com", "jeremy@jeremylim.ca", "itoieto@ya.ru", 
			"murk.murk123@gmail.com", "ajgrimm91@gmail.com", "Caboose009@gmail.com", "polcg@hotmail.es", "dann_bell2006@yahoo.com", 
			"jj177768@yahoo.com", "benni_97@hotmail.de", "jonh.figa@gmail.com", "envix777@gmail.com", "megaregee2@gmail.com", 
			"tom_champer@hotmail.com", "bertoski@gmail.com", "semyon.galtsev@gmail.com", "Dieter.Binnard@hotmail.com", 
			"markmota82@hotmail.com", "giselle_abc_123@yahoo.com", "dychenko.max@gmail.com", "AndrewRonayne@outlook.com", 
			"ahmadturiaki1997@gmail.com", "barker11@hotmail.fr", "alda.cernov@gmail.com", "fares_ghannam@hotmail.com", 
			"walterasilveira@gmail.com", "escartian@gmail.com", "peroyvindvalen@gmail.com", "nn57678@gmail.com", 
			"jw.vanderheiden@gmail.com", "jakchn@gmail.com", "arturtuca06@hotmail.com", "edwardsharp123@yahoo.com", 
			"promwarm@gmail.com", "luk2mila@mail.com", "ninjabugrer21@gmail.com", "kesiddog@gmail.com", "kollyfederic@ymail.com", 
			"estebannprine@gmail.com", "Mythgamplays@gmail.com", "alexandros.kalaitziis@hotmail.com", "kjun017@naver.com", 
			"benfournier58@outlook.com", "kruggunn@sbox.tugraz.at", "Nikolaylesnyhk@gmail.com", "18ianau1999@gmail.com", 
			"tometank@live.de", "jordan.webb@lmu.edu", "roscarraespetru@yahoo.ro", "iferit_@hotmail.com", 
			"aliha-benli-6@hotmail.com.tr", "junazoxsk8@hotmail.com", "joseph9977@nate.com", "testseb@test.com", 
			"giwhtsdc@yahoo.com", "ryud@bk.ru", "merlinoirign@gmx.de", "darks_shadow@mail.ru", "victor60701@gmail.com", 
			"janrosentrete123@gmx.de", "pablo2889728997@gmail.com", "panteli9@hotmail.com", "patryvickt.95@hotmail.com", 
			"deamrcopc@gmail.com", "beerensmchiel@gmail.com", "marton04@citromail.hu", "fahfoasohfsaoohfsaoh@gmail.com", 
			"gabriel.lutz@gmail.com", "johnsbrowns398@yahoo.com", "whamenrespecter299@gmail.com", "timza13579@gmail.com", 
			"Ace_acid@hotmail.com", "teemu.ilmrih@hotmail.com", "emcupeo@yahoo.com", "joshbroos3575@yahoo.com", 
			"lukabelyaev@outlook.com", "cwhwan14@naver.com", "deanogibson5@gmail.com", "gum200208@naver.com", 
			"aqstar6@naver.com", "ecryb4000@hotmail.com", "mendes_pauli@hotmail.com", "oliverparr7@btinternet.com", 
			"h.altinpinar@gxm.de", "nebulablaazemc@gmail.com", "fuentesnuenosvinosguillermo@gmail.com", "jonassskoglund01@gmail.com", 
			"chiplov@nate.com", "davidperezill@hotmail.es", "ricard.colx@gmail.com", "ulysse.maricher@gmail.com", 
			"liianfoot1@hotmail.fr", "danielemendozagmk@gmail.com", "100026@bernrode.nl", "torresbenamin26@gmail.com", 
			"willemvdnieuwnehuijzen@gmail.com", "vcitorfong14@gmail.com", "balundry37@gmail.com", "jazzoon11@gmail.com", 
			"jeffweijei@yahoo.com.sg", "vladiq911111@mail.ru", "Seems_L3g1t@hotmail.com", "spliffmaster2@yahoo.com", 
			"nicholasrier.dev@gmail.com", "bothe.thomas@hotmail.com", "nouloug2@gmail.com", "dpruden@ymail.com", 
			"woolhide@naver.com", "smoahk@gmail.com", "zillamau5@gmail.com", "alexw1209@yahoo.com", "robinho91250@gmail.com", 
			"berto98@gmx.de", "of_wolf_and_fab@hotmail.com", "Alekul_s@mail.ru", "adamowirth@gmail.com", "thisemailistaken23@gmail.com", 
			"emil.naevisdal@gmail.com", "gnast973@live.fr", "kevin.trinh@outlook.com", "wodorost@gmail.com", "mike.hector1@gmail.com", 
			"birksted@me.com", "razvan.panda@gmail.com", "sodamoeba@gmail.com", "leon@lilje-baven.de", "kaczyo@wp.pl", "lvzhejun7@gmail.com", 
			"wkdgnsgo@gmail.com", "mahdehasan1996@yahoo.com", "costerisantd@gmail.com", "oscar_daniel_kristoffersson@yahoo.com", 
			"willem.hoogervorst@hotmail.com", "edward.adam1@live.com", "joshrmcfarlane@gmail.com", "tudorel_tibrea@yahoo.com", 
			"jimmyneil@ymail.com", "frankvdbas@hotmail.com", "jake.swart8@gmail.com", "nottieru@gmail.com", "not2fast@yandex.ru", 
			"remosm@gmail.com", "andrei0709@gmail.com", "marlon.richert@gmail.com", "kettlesmile@outlook.com", "21011996@mail.ru", 
			"cgoodman381@gmail.com", "wahaj.23.2.2000@gmail.com", "jan.evensen@gmail.com", "kenx891@gmail.com", "domagoj.supraha@gmail.com", 
			"therealpaulgrant@gmail.com", "only_cool_people_have_this_account@hotmail.com", "manunited1120@gmail.com", "r0r5ch4ch@gmx.com", 
			"kirayukia@hotmail.com", "luxdave88@gmail.com", "vecp@live.com", "mainstreamowy@gmail.com", "promwarm@gmail.com", 
			"edwardsharp123@yahoo.com", "arturtuca06@hotmail.com", "jakchn@gmail.com", "jw.vanderheiden@gmail.com", "nn57678@gmail.com", 
			"peroyvindvalen@gmail.com", "escartian@gmail.com", "walterasilveira@gmail.com", "fares_ghannam@hotmail.com", 
			"alda.cernov@gmail.com", "barker11@hotmail.fr", "ahmadturiaki1997@gmail.com", "AndrewRonayne@outlook.com", 
			"dychenko.max@gmail.com", "giselle_abc_123@yahoo.com", "markmota82@hotmail.com", "Dieter.Binnard@hotmail.com", 
			"semyon.galtsev@gmail.com", "bertoski@gmail.com", "tom_champer@hotmail.com", "megaregee2@gmail.com", "envix777@gmail.com", 
			"jonh.figa@gmail.com", "benni_97@hotmail.de", "jj177768@yahoo.com", "dann_bell2006@yahoo.com", "polcg@hotmail.es", 
			"Caboose009@gmail.com", "ajgrimm91@gmail.com", "murk.murk123@gmail.com", "itoieto@ya.ru", "jeremy@jeremylim.ca", 
			"msrulz4@gmail.com", "daan.detre@telenet.be", "fegiotell@gmail.com", "anthonyrschewe@gmail.com", "postivan@gmail.com", 
			"awp.senpai@gmail.com", "duan.mack@gmail.com", "wsgahr@gmail.com", "franklinzolw@gmail.com", "woodn1994@gmail.com", 
			"yarianyg@gmail.com", "rvbayer1@yahoo.com", "David.24.2@web.de", "ariel_f21@yahoo.com", "adamski.dominik7@gmail.com", 
			"jmattmurphy1993@gmail.com", "blackdaylight@hotmail.com", "kalibur06@gmail.com", "Nicod155@gmx.de", "rasmus992010@hotmail.com", 
			"hanjuehae@gmail.com", "kayteawu@gmail.com", "tucker.whitcomb@gmail.com", "goldsteinbergstein@gmail.com", "Viktimmy@Hotmail.com", 
			"bvxxvd@gmail.com", "robert1zamboni@gmail.com", "david.j.tiplady@gmail.com", "cesnasjustas@gmail.com", "hus.patryk@gmail.com", 
			"milk.kai.cheng@gmail.com", "Twinadanz@gmail.com", "da8vii@gmail.com", "bora_yuksel_@hotmail.com", "noodles4noah@gmail.com", 
			"pride829@gmail.com", "andycao.16@gmail.com", "zdravko@subakov.com", "gugge2000@hotmail.com", "wearne.michael@gmail.com", 
			"micheal.b12321@gmail.com", "rdt_23@yahoo.com", "david.g.stam@gmail.com", "lucahagedorn@web.de", "dr.leavsey@gmail.com", 
			"fotis.plaskasovitis@hotmail.com", "rgarcilu@gmail.com", "shayneorok@gmail.com", "kyty3@bk.ru", "benjaminmason02@gmail.com", 
			"glarsson16@gmail.com", "apo_96@mail.ru", "nicolomagallanes@gmail.com", "draagos0@gmail.com", "robac@wp.pl", "otso.sivonen@gmail.com", 
			"alin.ivan13@gmail.com", "m_jamc@yahoo.com", "yjpan2017@yahoo.com", "james.deeman@gmail.com", "heliaxb@gmail.com", "27marquitos@gmail.com", 
			"0bruno1@gmail.com", "paul.stanish@gmail.com", "mk.vogel@hotmail.com", "vincentan12345@gmail.com", "tom.oude.veldhuis@hotmail.com", 
			"sillyleetlegirl@gmail.com", "mt.arnoldussen@gmail.com", "germanok21@gmail.com", "bdwitheygames@gmail.com", "ScoZone74@gmail.com", 
			"taylor.conant@gmail.com", "neo.slavik@gmail.com", "lucagraf@iwm.me");

	@Autowired
	UserRepository userRepository;

	@Autowired
	ProfileService profileService;
	@Autowired
	ProfileRepository profileRepository;

	@Autowired
	ReviewRepository reviewRepository;

	@Autowired
	ResetPasswordRepository resetPasswordRepository;

	@Autowired
	SportRepository sportRepository;

	@Autowired
	NotificationDao notificationDao;

	@Autowired
	MongoTemplate mongoTemplate;

	private final String environment;

	@Autowired
	public AdminUserApiHandler(@Value("${environment}") String environment) {
		super();
		this.environment = environment;
	}

	@RequestMapping(value = "/userInfo", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getUserInfo() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		log.debug("Retrieving user info");

		// List<Review> reviews = reviewRepository.findAll();
		List<User> users = userRepository.findAll();
		List<Profile> profiles = profileRepository.findAll();

		Map<String, UserInfo> infos = new HashMap<>();
		Map<String, Profile> profileMap = new HashMap<>();

		for (Profile profile : profiles) {
			profileMap.put(profile.getUserId(), profile);
		}

		for (User user : users) {
			// log.debug("adding user " + user);
			UserInfo info = new UserInfo();
			Profile profile = profileMap.get(user.getId());
			if (profile == null) {
				profile = new Profile();
			}
			info.setName(user.getUsername());
			info.setEmail(user.getEmail());
			if (user.getCreationDate() == null) {
				log.info("No creation date for " + user);
				user.setCreationDate(DateTimeFormat.forPattern("yyyy-MM-dd").parseDateTime("2015-09-01").toDate());
			}
			info.setRegistrationDate(new DateTime(user.getCreationDate()));
			info.setReputation(user.getReputation());
			info.setLastParticipationDate(new DateTime(user.getCreationDate()));
			info.setCanContact(profile.getPreferences().isEmailContact());
			infos.put(user.getId(), info);
		}

		// for (Review review : reviews) {
		// if (!review.isPublished()) {
		// continue;
		// }
		// // log.debug("adding review " + review);
		// if (review.getAuthorId() != null) {
		// infos.get(review.getAuthorId()).addReview(review);
		// }
		// if (review.getComments() != null) {
		// for (Comment comment : review.getAllComments()) {
		// if (comment.getAuthorId() != null) {
		// infos.get(comment.getAuthorId()).addComment(review);
		// }
		// }
		// }
		// }
		log.debug("Built user info: " + infos.size());

		List<UserInfo> result = new ArrayList<>();
		result.addAll(infos.values());
		Collections.sort(result, new Comparator<UserInfo>() {
			@Override
			public int compare(UserInfo o1, UserInfo o2) {
				return o1.getRegistrationDate().compareTo(o2.getRegistrationDate());
			}
		});

		String ret = toCsv(result);

		log.debug("Built result " + ret);

		return new ResponseEntity<String>(ret, HttpStatus.OK);
	}


	@RequestMapping(value = "/mailinglist", method = RequestMethod.GET)
	public @ResponseBody ResponseEntity<String> getMailListEmails() {
		if ("prod".equalsIgnoreCase(environment)) { 
			return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); 
		}		
		
		List<String> toRemoveEmails = UNSUBSCRIBED_EMAILS;
		
		log.debug("Building mailing list");
		List<User> users = userRepository.findAll();
		List<Profile> profiles = profileRepository.findAll();

		List<String> emails = new ArrayList<>();
		Map<String, Profile> profileMap = new HashMap<>();

		for (Profile profile : profiles) {
			profileMap.put(profile.getUserId(), profile);
		}

		for (User user : users) {
			Profile profile = profileMap.get(user.getId());
			if (profile == null || profile.getPreferences() == null || profile.getPreferences().isEmailContact()) {
				if (toRemoveEmails.contains(user.getEmail())) {
					log.warn("Warn: " + user.getEmail());
				}
				else if (user.getRegisterLocation() != null 
						&& (user.getRegisterLocation().contains("overwolf") || user.getRegisterLocation().contains("hearthstone"))) {
					emails.add(user.getEmail());					
				}
			}
		}
		log.debug("Built mailing list: " + emails.size());

		String result = emails.stream().collect(Collectors.joining("\n"));
		log.info(result);

		return new ResponseEntity<String>(result, HttpStatus.OK);
	}

	private String toCsv(List<UserInfo> list) {
		String result = "";

		String header = "Name,Email,Can contact,Registration date,Reputation,Last participation,Reviews,Comments,List reviews,List comments";
		result += header + "\r\n";

		for (UserInfo info : list) {
			log.debug("Parsing info " + info);
			result += info.getName() + "," + info.getEmail() + "," + info.isCanContact() + ","
					+ info.getRegistrationDate().toString("dd/MM/yyyy") + "," + info.getReputation() + ","
					+ info.getLastParticipationDate().toString("dd/MM/yyyy") + "," + info.getNumberOfReviews() + ","
					+ info.getNumberOfComments() + "," + info.getReviews().toString().replaceAll(",", ";") + ","
					+ info.getComments().toString().replaceAll(",", ";") + ",";
			result += "\r\n";
		}

		return result;
	}

	@RequestMapping(value = "/updateAllUsersContactPref", method = RequestMethod.POST)
	public @ResponseBody ResponseEntity<String> updateContactPrefs() {

		if ("prod".equalsIgnoreCase(
				environment)) { return new ResponseEntity<String>((String) null, HttpStatus.UNAUTHORIZED); }

		// TODO: rerun
		List<String> emails = UNSUBSCRIBED_EMAILS;

		Criteria crit = where("email").in(emails);
		Query query = query(crit);
		Field fields = query.fields();
		fields.include("id");

		List<String> ids = mongoTemplate.find(query, User.class).stream()
				.map(u -> u.getId())
				.collect(Collectors.toList());
		log.debug("Update IDs " + ids.size());
		
		// Update the preference for all these users
		Criteria uCrit = where("userId").in(ids);
		Query uQuery = query(uCrit);
		Update update = update("preferences.emailContact", false);
		WriteResult result = mongoTemplate.updateMulti(uQuery, update, Profile.class);

//		List<String> profileIds = mongoTemplate.find(uQuery, Profile.class).stream()
//				.map(u -> u.getId())
//				.collect(Collectors.toList());
//		log.debug("profileIds IDs " + profileIds.size());

		return new ResponseEntity<String>("updated " + result.getN(), HttpStatus.OK);
	}
}
