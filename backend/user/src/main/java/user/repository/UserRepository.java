package user.repository;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.User;

import reactor.core.publisher.Mono;

@Repository
public interface UserRepository extends R2dbcRepository<User, Integer> {
    
    Mono<User> findByEmail(String email);
    
    Mono<Boolean> existsByEmail(String email);
    
    @Query("SELECT * FROM users WHERE id = :userId")
    Mono<User> findByUserId(Integer userId);

    @Modifying
    @Query("UPDATE users SET positive_reviews = COALESCE(positive_reviews, 0) + 1 WHERE id = :userId")
    Mono<Integer> incrementPositiveReviews(Integer userId);

    @Modifying
    @Query("UPDATE users SET negative_reviews = COALESCE(negative_reviews, 0) + 1 WHERE id = :userId")
    Mono<Integer> incrementNegativeReviews(Integer userId);
    
}
