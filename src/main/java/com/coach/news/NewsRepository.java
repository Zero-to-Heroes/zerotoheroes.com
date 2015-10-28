package com.coach.news;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.joda.time.DateTime;

import com.coach.news.News.Type;

public class NewsRepository {

	private static final List<News> NEWS = buildNews();

	public static List<News> getNewsAfter(Date date, Type type) {
		List<News> news = new ArrayList<>();

		for (News candidate : NEWS) {
			if (candidate.getDate().after(date) && type.equals(candidate.getType())) {
				news.add(candidate);
			}
		}
		return news;
	}

	private static List<News> buildNews() {
		List<News> news = new ArrayList<>();

		// Features
		news.add(new News(
				new DateTime("2015-10-28").toDate(),
				"HearthStone players can now add a [[card name]] between brackets in the comments, and see the corresponding card image",
				News.Type.Feature));
		news.add(new News(new DateTime("2015-10-25").toDate(),
				"You can now decide to be notified when a new review is added, or a comment added in a review",
				News.Type.Feature));
		news.add(new News(
				new DateTime("2015-10-23").toDate(),
				"It's now possible to independantly choose, for each video in a side-by-side comparison, which side you want to use (left, center, right)",
				News.Type.Feature));
		news.add(new News(new DateTime("2015-10-23").toDate(),
				"Extended the comparison feature to include external videos (no search is possible for now though)",
				News.Type.Feature));
		news.add(new News(
				new DateTime("2015-10-22").toDate(),
				"You can now easily add a side-by-side comparison of another sequence from the same video (we're working on extending that feature right now)",
				News.Type.Feature));
		news.add(new News(
				new DateTime("2015-10-22").toDate(),
				"You can now easily add a side-by-side comparison of another sequence from the same video (we're working on extending that feature right now)",
				News.Type.Feature));
		news.add(new News(
				new DateTime("2015-10-13").toDate(),
				"You can now draw on the videos to illustrate your comments! More information on <a href=\"r/meta/561f89c9e4b077e916dd5752/Drawing-on-videos\">this thread</a>",
				News.Type.Feature));
		news.add(new News(
				new DateTime("2015-10-13").toDate(),
				"Videos can now be tagged. More information on <a href=\"/r/meta/5617e6cfe4b09ef58bc85c04/Need-tagging-features\">this thread</a>",
				News.Type.Feature));
		news.add(new News(new DateTime("2015-10-09").toDate(),
				"Added view count to reviews. Views are only counted from October 10th onwards", News.Type.Feature));
		news.add(new News(new DateTime("2015-10-06").toDate(),
				"New forum to discuss things related to the site itself", News.Type.Feature));
		news.add(new News(new DateTime("2015-10-03").toDate(),
				"The author of a review can indicate that a specific comment has helped them", News.Type.Feature));
		news.add(new News(new DateTime("2015-10-02").toDate(), "New custom background image per sport",
				News.Type.Feature));
		news.add(new News(new DateTime("2015-10-01").toDate(),
				"You can see the new features we've added since the last time you've visited", News.Type.Feature));

		// Bug fixes
		news.add(new News(new DateTime("2015-10-09").toDate(),
				"The video player control bar is now properly displayed in full screen", News.Type.Bug));
		news.add(new News(new DateTime("2015-10-06").toDate(), "No sound in the player when uploading a video",
				News.Type.Bug));
		news.add(new News(new DateTime("2015-10-06").toDate(),
				"Coach description may go outside of the top screen when the text is long", News.Type.Bug));
		news.add(new News(new DateTime("2015-10-02").toDate(),
				"Comment panel can disappear when scrolling on videos without comments", News.Type.Bug));
		news.add(new News(new DateTime("2015-10-02").toDate(), "Site is not responsive on mobile anymore",
				News.Type.Bug));
		news.add(new News(
				new DateTime("2015-10-02").toDate(),
				"Using command buttons when editing the video description inserts the command in the comment box instead",
				News.Type.Bug));
		news.add(new News(new DateTime("2015-10-01").toDate(),
				"All videos displayed on the \"My videos\" tab when you are not logged in", News.Type.Bug));
		news.add(new News(new DateTime("2015-10-01").toDate(),
				"Notification email contains the incorrect commentator name on nested comments", News.Type.Bug));
		news.add(new News(new DateTime("2015-10-01").toDate(), "Controls don't appear on fullscreen video",
				News.Type.Bug));

		return news;
	}

}
