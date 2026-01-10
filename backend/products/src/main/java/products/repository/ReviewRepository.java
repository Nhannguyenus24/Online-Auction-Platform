package products.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.Review;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ReviewRepository extends R2dbcRepository<Review, Integer> {

    /**
     * Find all reviews received by a user (ordered by created_at desc)
     */
    Flux<Review> findByToUserIdOrderByCreatedAtDesc(Integer toUserId);

    /**
     * Count total reviews for a user
     */
    @Query("SELECT COUNT(*) FROM reviews WHERE to_user_id = :toUserId")
    Mono<Integer> countByToUserId(@Param("toUserId") Integer toUserId);

    /**
     * Get average score for a user
     */
    @Query("SELECT AVG(CAST(score AS DECIMAL)) FROM reviews WHERE to_user_id = :toUserId")
    Mono<Double> getAverageScore(@Param("toUserId") Integer toUserId);
}

