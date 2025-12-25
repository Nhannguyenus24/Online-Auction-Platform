package user.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.Review;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ReviewRepository extends R2dbcRepository<Review, Integer> {

    /**
     * Find review by from_user_id, to_user_id and product_id
     */
    Mono<Review> findByFromUserIdAndToUserIdAndProductId(Integer fromUserId, Integer toUserId, Integer productId);

    /**
     * Find all ratings received by a user (ordered by created_at desc)
     */
    Flux<Review> findByToUserIdOrderByCreatedAtDesc(Integer toUserId);

    /**
     * Delete review by from_user_id, to_user_id and product_id
     */
    Mono<Void> deleteByFromUserIdAndToUserIdAndProductId(Integer fromUserId, Integer toUserId, Integer productId);

    /**
     * Count total ratings for a user
     */
    @Query("SELECT COUNT(*) FROM reviews WHERE to_user_id = :toUserId")
    Mono<Integer> countRatingsByUserId(Integer toUserId);

    /**
     * Get average score for a user
     */
    @Query("SELECT AVG(CAST(score AS DECIMAL)) FROM reviews WHERE to_user_id = :toUserId")
    Mono<Double> getAverageScore(Integer toUserId);

    /**
     * Count ratings by score for a user
     */
    @Query("SELECT COUNT(*) FROM reviews WHERE to_user_id = :toUserId AND score = :score")
    Mono<Integer> countRatingsByScore(Integer toUserId, Integer score);

    /**
     * Check if user has already rated another user for same product
     */
    @Query("SELECT COUNT(*) FROM reviews WHERE from_user_id = :fromUserId AND to_user_id = :toUserId AND product_id = :productId")
    Mono<Integer> hasUserRatedProduct(Integer fromUserId, Integer toUserId, Integer productId);
}
