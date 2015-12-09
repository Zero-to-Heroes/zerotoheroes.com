package com.coach.review;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.coach.tag.Tag;

public interface ReviewRepository extends MongoRepository<Review, String> {

	Review findById(String id);

	Page<Review> findBySport(String sport, Pageable pageable);

	List<Review> findBySport(String sport);

	//@formatter:off
	//@Query("{  $or : [ { $where : '?0 == null' }, { fullTextSearchField : { $regex : '?0', $options: 'ix' } } ],"
	@Query("{ sport : ?0, "
			+ "$and : ["
			+ "		{ $or : [ { $where : '?1 == null' }, { $where : '?1.length == 0' }, { tags : { $all : ?1 } } ] }, "
			+ "		{ $or : [ { $where : '?2 == null' }, { $where : '?2.length == 0' }, { tags : { $nin : ?2 } } ] }"
			+ "]"
		+ "}"
	)
	//@formatter:on
	Page<Review> listReviews(String sportCriteria, List<Tag> wantedTags, List<Tag> unwantedTags, Pageable pageable);

	//@formatter:off
	//@Query("{  $or : [ { $where : '?0 == null' }, { fullTextSearchField : { $regex : '?0', $options: 'ix' } } ],"
	@Query("{ $text : { $search : ?0 },"
			+ "sport : ?1, "
			+ "$and : ["
			+ "		{ $or : [ { $where : '?2 == null' }, { $where : '?2.length == 0' }, { tags : { $all : ?2 } } ] }, "
			+ "		{ $or : [ { $where : '?3 == null' }, { $where : '?3.length == 0' }, { tags : { $nin : ?3 } } ] }"
			+ "]"
		+ "}"
	)
	//@formatter:on
	Page<Review> listReviews(String text, String sportCriteria, List<Tag> wantedTags, List<Tag> unwantedTags,
			Pageable pageable);

}
