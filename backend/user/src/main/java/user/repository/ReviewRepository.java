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

    Mono<Long> findIdByFromUserIdAndToUserId(Integer fromUserId, Integer toUserId);
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
}
