package com.coach.review;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.coach.tag.Tag;

public interface ReviewRepository extends MongoRepository<Review, String> {

	Review findById(String id);

	Page<Review> findPageableBySport(String sport, Pageable pageable);

	List<Review> findBySport(String sport);

	//@formatter:off
	//@Query("{  $or : [ { $where : '?0 == null' }, { fullTextSearchField : { $regex : '?0', $options: 'ix' } } ],"
	@Query(	value =
		"{ sport : ?0, "
			+ "published: true,"
			+ "$and : ["
			+ "		{ $or : [ { $where : '?12 == true' }, { visibility: { $exists: false} }, { visibility: null }, { visibility : 'public' } ] },"
			+ "		{ $or : [ { $where : '?1 == null' }, { authorId : ?1 } ] }, "
			+ "		{ $or : [ { $where : '?2 == null' }, { $where : '?2.length == 0' }, { allTags : { $all : ?2 } } ] }, "
			+ "		{ $or : [ { $where : '?3 == null' }, { $where : '?3.length == 0' }, { allTags : { $nin : ?3 } } ] }, "
			+ "		{ $or : [ { $where : '?4 == null' }, { totalHelpfulComments : { $gt : 0 } } ] }, "
			+ "		{ $or : [ { $where : '?5 == null' }, { totalHelpfulComments : { $eq : 0 } } ] }, "
					// Any matchup
			+ "		{ $or : [ "
			+ "			{ $and : [ "
			+ "				{ $or : [ { $where : '?6 == null' }, { participantDetails.playerCategory : ?6 } ] }, "
			+ "				{ $or : [ { $where : '?7 == null' }, { participantDetails.opponentCategory : ?7 } ] } "
			+ "			] }, "
			+ "			{ $and : [ "
			+ "				{ $or : [ { $where : '?6 == null' }, { participantDetails.opponentCategory : ?6 } ] }, "
			+ "				{ $or : [ { $where : '?7 == null' }, { participantDetails.playerCategory : ?7 } ] } "
			+ "			] } "
			+ " 	] }, "
			+ "		{ $or : [ { $where : '?8 == null' }, { $where : '?8.length == 0' }, { participantDetails.skillLevel : { $all : ?8 } } ] }, "
			+ "		{ $or : [ { $where : '?9 == null' }, { reviewType : ?9 } ] }, "
			+ "		{ $or : [ { $where : '?10 == null' }, { totalComments : { $gte : ?10 } } ] }, "
			+ "		{ $or : [ { $where : '?11 == null' }, { totalComments : { $lte : ?11 } } ] } "
			+ "]"
		+ "}",
			fields =
				"{"
			+ 		"'id' : 1,"
			+ 		"'title' : 1,"
			+ 		"'author' : 1,"
			+ 		"'reputation' : 1,"
			+ 		"'totalComments' : 1,"
			+ 		"'totalHelpfulComments' : 1,"
			+ 		"'viewCount' : 1,"
			+ 		"'thumbnail' : 1,"
			+ 		"'language' : 1,"
			+ 		"'tags' : 1,"
			+ 		"'creationDate' : 1,"
			+ 		"'sport' : 1,"
			+ 		"'participantDetails' : 1,"
			+ 		"'key' : 1,"
			+ 		"'mediaType' : 1,"
			+ 		"'beginning' : 1,"
			+ 		"'ending' : 1,"
			+ 		"'lastModifiedDate' : 1"
			+ 	"}"
	)
	//@formatter:on
	// Page<Review> listReviews(String sportCriteria, String authorId, List<Tag>
	// wantedTags, List<Tag> unwantedTags,
	// Pageable pageable);
	Page<Review> listReviews(String sportCriteria, String authorId, List<Tag> wantedTags, List<Tag> unwantedTags,
			Boolean onlyHelpful, Boolean noHelpful, String playerCategory, String opponentCategory,
			List<Tag> skillLevel, String reviewType, Integer minComments, Integer maxComments, Boolean ownVideo,
			Pageable pageable);

	//@formatter:off
	@Query(	value =
			"{ sport : ?0, "
				+ "published: true,"
				+ "$and : ["
				+ "		{ $or : [ { $where : '?12 == true' }, { visibility: { $exists: false} }, { visibility: null }, { visibility : 'public' } ] },"
				+ "		{ $or : [ { $text : { $search : ?13 } } ] }, "
				+ "		{ $or : [ { $where : '?1 == null' }, { authorId : ?1 } ] }, "
				+ "		{ $or : [ { $where : '?2 == null' }, { $where : '?2.length == 0' }, { allTags : { $all : ?2 } } ] }, "
				+ "		{ $or : [ { $where : '?3 == null' }, { $where : '?3.length == 0' }, { allTags : { $nin : ?3 } } ] }, "
				+ "		{ $or : [ { $where : '?4 == null' }, { totalHelpfulComments : { $gt : 0 } } ] }, "
				+ "		{ $or : [ { $where : '?5 == null' }, { totalHelpfulComments : { $eq : 0 } } ] }, "
						// Any matchup
				+ "		{ $or : [ "
				+ "			{ $and : [ "
				+ "				{ $or : [ { $where : '?6 == null' }, { participantDetails.playerCategory : ?6 } ] }, "
				+ "				{ $or : [ { $where : '?7 == null' }, { participantDetails.opponentCategory : ?7 } ] } "
				+ "			] }, "
				+ "			{ $and : [ "
				+ "				{ $or : [ { $where : '?6 == null' }, { participantDetails.opponentCategory : ?6 } ] }, "
				+ "				{ $or : [ { $where : '?7 == null' }, { participantDetails.playerCategory : ?7 } ] } "
				+ "			] } "
				+ " 	] }, "
				+ "		{ $or : [ { $where : '?8 == null' }, { $where : '?8.length == 0' }, { participantDetails.skillLevel : { $all : ?8 } } ] }, "
				+ "		{ $or : [ { $where : '?9 == null' }, { reviewType : ?9 } ] }, "
				+ "		{ $or : [ { $where : '?10 == null' }, { totalComments : { $gte : ?10 } } ] }, "
				+ "		{ $or : [ { $where : '?11 == null' }, { totalComments : { $lte : ?11 } } ] } "
				+ "]"
			+ "}",
				fields =
					"{"
				+ 		"'id' : 1,"
				+ 		"'title' : 1,"
				+ 		"'author' : 1,"
				+ 		"'reputation' : 1,"
				+ 		"'totalComments' : 1,"
				+ 		"'totalHelpfulComments' : 1,"
				+ 		"'viewCount' : 1,"
				+ 		"'thumbnail' : 1,"
				+ 		"'language' : 1,"
				+ 		"'tags' : 1,"
				+ 		"'creationDate' : 1,"
				+ 		"'sport' : 1,"
				+ 		"'participantDetails' : 1,"
				+ 		"'key' : 1,"
				+ 		"'mediaType' : 1,"
				+ 		"'beginning' : 1,"
				+ 		"'ending' : 1,"
				+ 		"'lastModifiedDate' : 1"
				+ 	"}"
		)
		//@formatter:on
	Page<Review> listReviews(String sportCriteria, String authorId, List<Tag> wantedTags, List<Tag> unwantedTags,
			Boolean onlyHelpful, Boolean noHelpful, String playerCategory, String opponentCategory,
			List<Tag> skillLevel, String reviewType, Integer minComments, Integer maxComments, Boolean ownVideo,
			String text, Pageable pageable);

}
