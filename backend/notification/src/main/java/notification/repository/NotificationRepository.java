package notification.repository;

import com.auction.entities.database.Notification;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface NotificationRepository extends R2dbcRepository<Notification, Integer>  {
    
    // Find all notifications by user id
    Flux<Notification> findByUserId(Integer userId);
    
    // Find unread notifications by user id
    @Query("SELECT * FROM notifications WHERE user_id = :userId AND is_read = false ORDER BY created_at DESC")
    Flux<Notification> findUnreadByUserId(@Param("userId") Integer userId);
    
    // Mark notification as read
    @Query("UPDATE notifications SET is_read = true WHERE id = :notificationId")
    Mono<Void> markAsRead(@Param("notificationId") Integer notificationId);
    
    // Mark all notifications as read by user id
    @Query("UPDATE notifications SET is_read = true WHERE user_id = :userId")
    Mono<Void> markAllAsRead(@Param("userId") Integer userId);
    
    // Delete notification by id
    @Query("DELETE FROM notifications WHERE id = :notificationId")
    Mono<Void> deleteById(@Param("notificationId") Integer notificationId);
    
    // Delete all notifications by user id
    @Query("DELETE FROM notifications WHERE user_id = :userId")
    Mono<Void> deleteByUserId(@Param("userId") Integer userId);
    
    // Delete old notifications (by days)
    @Query("DELETE FROM notifications WHERE user_id = :userId AND created_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL :days DAY)")
    Mono<Void> deleteOldNotificationsByUserId(@Param("userId") Integer userId, @Param("days") Integer days);
    
    // Count unread notifications by user id
    @Query("SELECT COUNT(*) FROM notifications WHERE user_id = :userId AND is_read = false")
    Mono<Integer> countUnreadByUserId(@Param("userId") Integer userId);
    
    // Find notifications by type
    @Query("SELECT * FROM notifications WHERE user_id = :userId AND type = :type ORDER BY created_at DESC")
    Flux<Notification> findByUserIdAndType(@Param("userId") Integer userId, @Param("type") String type);
}
