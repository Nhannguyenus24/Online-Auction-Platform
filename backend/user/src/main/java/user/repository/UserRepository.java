package user.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.User;

import reactor.core.publisher.Mono;

@Repository
public interface UserRepository extends R2dbcRepository<User, Integer> {
    
    Mono<User> findByEmail(String email);
    
    Mono<Boolean> existsByEmail(String email);

    Mono<Boolean> existsByPhone(String phone);
    
    @Query("SELECT * FROM users WHERE id = :userId")
    Mono<User> findByUserId(Integer userId);
}
