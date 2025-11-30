package user.repository;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;
import user.entity.EmailVerificationToken;

import java.time.LocalDateTime;

@Repository
public interface EmailVerificationTokenRepository extends ReactiveCrudRepository<EmailVerificationToken, String> {
    
    Mono<EmailVerificationToken> findByToken(String token);
    
    Mono<EmailVerificationToken> findByUserId(Integer userId);
    
    @Modifying
    @Query("DELETE FROM email_verification_tokens WHERE user_id = :userId")
    Mono<Void> deleteByUserId(Integer userId);
    
    @Modifying
    @Query("DELETE FROM email_verification_tokens WHERE expires_at < :now")
    Mono<Void> deleteExpiredTokens(LocalDateTime now);
}
