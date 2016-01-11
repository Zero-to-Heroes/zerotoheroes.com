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
			+ "$and : ["
			+ "		{ $or : [ { $where : '?1 == null' }, { $where : '?1.length == 0' }, { tags : { $all : ?1 } } ] }, "
			+ "		{ $or : [ { $where : '?2 == null' }, { $where : '?2.length == 0' }, { tags : { $nin : ?2 } } ] }"
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
			+ 		"'lastModifiedDate' : 1"
			+ 	"}"
	)
	//@formatter:on
	Page<Review> listReviews(String sportCriteria, List<Tag> wantedTags, List<Tag> unwantedTags, Pageable pageable);

	//@formatter:off
	//@Query("{  $or : [ { $where : '?0 == null' }, { fullTextSearchField : { $regex : '?0', $options: 'ix' } } ],"
	@Query(value =
		"{ $text : { $search : ?0 },"
			+ "sport : ?1, "
			+ "$and : ["
			+ "		{ $or : [ { $where : '?2 == null' }, { $where : '?2.length == 0' }, { tags : { $all : ?2 } } ] }, "
			+ "		{ $or : [ { $where : '?3 == null' }, { $where : '?3.length == 0' }, { tags : { $nin : ?3 } } ] }"
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
		+ 		"'lastModifiedDate' : 1"
		+ 	"}"
	)
	//@formatter:on
	Page<Review> listReviewsWithText(String text, String sportCriteria, List<Tag> wantedTags, List<Tag> unwantedTags,
			Pageable pageable);

}
