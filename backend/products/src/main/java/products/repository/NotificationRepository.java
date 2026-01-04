package products.repository;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.Notification;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for Notification operations
 * Flow:
 * 1. getUserNotifications - Get paginated notifications for a user, ordered by newest first
 * 2. countUserNotifications - Count total notifications for pagination
 * 3. countUnreadNotifications - Count unread notifications for a user
 * 4. markAsRead - Mark a specific notification as read
 * 5. markAllAsRead - Mark all user notifications as read
 */
@Repository
public interface NotificationRepository extends R2dbcRepository<Notification, Integer> {
    
    /**
     * Get paginated notifications for a user
     * Flow: Called from service to retrieve user's notifications with pagination
     * @param userId - User ID to get notifications for
     * @param limit - Number of notifications per page
     * @param offset - Offset for pagination
     * @return Flux of notifications ordered by created_at DESC
     */
    @Query("""
        SELECT id, user_id, type, payload, is_read, created_at
        FROM notifications
        WHERE user_id = :userId
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """)
    Flux<Notification> findByUserIdPaginated(
        @Param("userId") Integer userId,
        @Param("limit") int limit,
        @Param("offset") int offset
    );
    
    /**
     * Count total notifications for a user
     * Flow: Called to calculate total pages for pagination
     * @param userId - User ID to count notifications for
     * @return Mono with count of notifications
     */
    @Query("SELECT COUNT(*) FROM notifications WHERE user_id = :userId")
    Mono<Long> countByUserId(@Param("userId") Integer userId);
    
    /**
     * Count unread notifications for a user
     * Flow: Called to show unread count badge in UI
     * @param userId - User ID to count unread notifications for
     * @return Mono with count of unread notifications
     */
    @Query("SELECT COUNT(*) FROM notifications WHERE user_id = :userId AND is_read = false")
    Mono<Long> countUnreadByUserId(@Param("userId") Integer userId);
    
    /**
     * Mark a specific notification as read
     * Flow: Called when user clicks/views a notification
     * @param id - Notification ID to mark as read
     * @param userId - User ID (for security check)
     * @return Mono<Integer> number of rows updated
     */
    @Modifying
    @Query("""
        UPDATE notifications
        SET is_read = true
        WHERE id = :id AND user_id = :userId AND is_read = false
    """)
    Mono<Integer> markAsRead(
        @Param("id") Integer id,
        @Param("userId") Integer userId
    );
    
    /**
     * Find a notification by ID and user ID
     * Flow: Called to verify notification belongs to user before marking as read
     * @param id - Notification ID
     * @param userId - User ID
     * @return Mono<Notification> the notification if found
     */
    @Query("SELECT * FROM notifications WHERE id = :id AND user_id = :userId")
    Mono<Notification> findByIdAndUserId(
        @Param("id") Integer id,
        @Param("userId") Integer userId
    );
}
