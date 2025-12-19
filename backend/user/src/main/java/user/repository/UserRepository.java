package user.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;
import com.auction.entities.database.User;

@Repository
public interface UserRepository extends ReactiveCrudRepository<User, Integer> {
    
    Mono<User> findByEmail(String email);
    
    Mono<Boolean> existsByEmail(String email);

    Mono<Boolean> existsByPhone(String phone);
    
    @Query("SELECT * FROM users WHERE id = :userId")
    Mono<User> findByUserId(Integer userId);
}
