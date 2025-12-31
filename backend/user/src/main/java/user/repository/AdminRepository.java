package user.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.User;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import user.service.AdminService.RegistrationRecord;

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
    @Query("SELECT CAST(DATE(created_at) AS CHAR) as date, COUNT(*) as count FROM users GROUP BY CAST(DATE(created_at) AS CHAR) ORDER BY date DESC LIMIT :limit")
    Flux<RegistrationRecord> getUserRegistrationsByDay(int limit);
    
    // Get user registrations by month
    @Query("SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count FROM users GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month DESC LIMIT :limit")
    Flux<RegistrationRecord> getUserRegistrationsByMonth(int limit);
    
    // Get user registrations by year
    @Query("SELECT CAST(YEAR(created_at) AS CHAR) as year, COUNT(*) as count FROM users GROUP BY CAST(YEAR(created_at) AS CHAR) ORDER BY year DESC LIMIT :limit")
    Flux<RegistrationRecord> getUserRegistrationsByYear(int limit);
    
    // ============================================================================
    // PROFIT STATISTICS - Profit = 30% of total successful payments
    // ============================================================================
    
    // Get monthly profit statistics
    @Query("""
        SELECT 
            DATE_FORMAT(p.paid_at, '%Y-%m') as period,
            COALESCE(SUM(p.amount), 0) as total_sales,
            COALESCE(SUM(p.amount) * 0.3, 0) as profit,
            COUNT(DISTINCT p.order_id) as completed_orders
        FROM payments p
        WHERE p.status = 'completed'
            AND p.paid_at IS NOT NULL
            AND DATE_FORMAT(p.paid_at, '%Y-%m') = :month
        GROUP BY DATE_FORMAT(p.paid_at, '%Y-%m')
        """)
    Mono<ProfitRecord> getMonthlyProfit(String month);
    
    // Get yearly profit statistics
    @Query("""
        SELECT 
            YEAR(p.paid_at) as period,
            COALESCE(SUM(p.amount), 0) as total_sales,
            COALESCE(SUM(p.amount) * 0.3, 0) as profit,
            COUNT(DISTINCT p.order_id) as completed_orders
        FROM payments p
        WHERE p.status = 'completed'
            AND p.paid_at IS NOT NULL
            AND YEAR(p.paid_at) = :year
        GROUP BY YEAR(p.paid_at)
        """)
    Mono<ProfitRecord> getYearlyProfit(int year);
    
    /**
     * Record for profit statistics projection
     */
    record ProfitRecord(String period, Double totalSales, Double profit, Integer completedOrders) {
        public String getPeriod() {
            return period;
        }
        
        public Double getTotalSales() {
            return totalSales != null ? totalSales : 0.0;
        }
        
        public Double getProfit() {
            return profit != null ? profit : 0.0;
        }
        
        public Integer getCompletedOrders() {
            return completedOrders != null ? completedOrders : 0;
        }
    }
}
