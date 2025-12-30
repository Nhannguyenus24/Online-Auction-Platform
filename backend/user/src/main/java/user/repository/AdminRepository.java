package user.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import com.auction.entities.database.User;
import user.service.AdminService.RegistrationRecord;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AdminRepository extends R2dbcRepository<User, Integer> {
    
    // Count users by role
    @Query("SELECT COUNT(*) FROM users WHERE role = :role")
    Mono<Integer> countByRole(String role);
    
    // Count all users
    @Query("SELECT COUNT(*) FROM users")
    Mono<Integer> countAllUsers();
    
    // Count verified users
    @Query("SELECT COUNT(*) FROM users WHERE is_email_verified = true")
    Mono<Integer> countVerifiedUsers();
    
    // Get average rating from all users
    @Query("SELECT AVG(rating_percent) FROM users WHERE rating_percent > 0")
    Mono<Double> getAverageRating();
    
    // Count total positive reviews
    @Query("SELECT COALESCE(SUM(positive_reviews), 0) FROM users")
    Mono<Integer> sumPositiveReviews();
    
    // Count total negative reviews
    @Query("SELECT COALESCE(SUM(negative_reviews), 0) FROM users")
    Mono<Integer> sumNegativeReviews();
    
    // Get user registrations by date
    @Query("SELECT DATE(created_at) as date, COUNT(*) as count FROM users GROUP BY DATE(created_at) ORDER BY date DESC LIMIT :limit")
    Flux<RegistrationRecord> getUserRegistrationsByDay(int limit);
    
    // Get user registrations by month
    @Query("SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count FROM users GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month DESC LIMIT :limit")
    Flux<RegistrationRecord> getUserRegistrationsByMonth(int limit);
    
    // Get user registrations by year
    @Query("SELECT YEAR(created_at) as year, COUNT(*) as count FROM users GROUP BY YEAR(created_at) ORDER BY year DESC LIMIT :limit")
    Flux<RegistrationRecord> getUserRegistrationsByYear(int limit);
}
