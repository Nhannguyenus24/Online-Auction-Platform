package notification.service;

import com.auction.entities.database.Notification;
import com.auction.mysql.client.ReactiveMySQLClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.r2dbc.spi.Row;
import io.r2dbc.spi.RowMetadata;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final ReactiveMySQLClient mysqlClient;
    private final ObjectMapper objectMapper;

    private NotificationService(ReactiveMySQLClient mysqlClient, ObjectMapper objectMapper) {
        this.mysqlClient = mysqlClient;
        this.objectMapper = objectMapper;
    }
    // Mapper function to convert Row to Notification
    private static final java.util.function.BiFunction<Row, RowMetadata, Notification> NOTIFICATION_MAPPER = (row, metadata) ->
            Notification.builder()
                    .id(row.get("id", Integer.class))
                    .userId(row.get("user_id", Integer.class))
                    .type(row.get("type", String.class))
                    .payload(row.get("payload", String.class))
                    .isRead(row.get("is_read", Boolean.class))
                    .createdAt(row.get("created_at", LocalDateTime.class))
                    .build();

    /**
     * Lưu notification vào database
     */
    public Mono<Void> saveNotification(Integer userId, String type, String payload) {
        return Mono.fromCallable(() -> {
            String sql = "INSERT INTO notifications (user_id, type, payload, is_read, created_at) VALUES (:userId, :type, :payload, :isRead, :createdAt)";
            Map<String, Object> params = Map.of(
                    "userId", userId,
                    "type", type,
                    "payload", payload,
                    "isRead", false,
                    "createdAt", LocalDateTime.now()
            );
            return params;
        })
        .flatMap(params -> mysqlClient.execute(
                "INSERT INTO notifications (user_id, type, payload, is_read, created_at) VALUES (:userId, :type, :payload, :isRead, :createdAt)",
                params
        ))
        .doOnSuccess(rowsAffected -> 
            log.info("Notification saved: userId={}, type={}, rows affected={}", userId, type, rowsAffected))
        .doOnError(e -> 
            log.error("Failed to save notification: userId={}, type={}, error={}", userId, type, e.getMessage(), e))
        .then();
    }

    /**
     * Lưu notification với JSON payload
     */
    public Mono<Void> saveNotificationWithJson(Integer userId, String type, Map<String, Object> payloadMap) {
        return Mono.fromCallable(() -> {
            String payload = objectMapper.writeValueAsString(payloadMap);
            return payload;
        })
        .flatMap(payload -> {
            String sql = "INSERT INTO notifications (user_id, type, payload, is_read, created_at) VALUES (:userId, :type, :payload, :isRead, :createdAt)";
            Map<String, Object> params = Map.of(
                    "userId", userId,
                    "type", type,
                    "payload", payload,
                    "isRead", false,
                    "createdAt", LocalDateTime.now()
            );
            return mysqlClient.execute(sql, params);
        })
        .doOnSuccess(rowsAffected -> 
            log.info("Notification with JSON saved: userId={}, type={}, rows affected={}", userId, type, rowsAffected))
        .doOnError(e -> 
            log.error("Failed to save notification: userId={}, type={}, error={}", userId, type, e.getMessage(), e))
        .then();
    }

    /**
     * Lấy tất cả notification của một user
     */
    public Flux<Notification> getNotificationsByUserId(Integer userId) {
        String sql = "SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC";
        Map<String, Object> params = Map.of("userId", userId);
        
        return mysqlClient.query(sql, params, NOTIFICATION_MAPPER)
                .doOnError(e -> 
                    log.error("Failed to fetch notifications for userId={}, error={}", userId, e.getMessage(), e));
    }

    /**
     * Lấy notification chưa đọc của một user
     */
    public Flux<Notification> getUnreadNotificationsByUserId(Integer userId) {
        String sql = "SELECT * FROM notifications WHERE user_id = :userId AND is_read = false ORDER BY created_at DESC";
        Map<String, Object> params = Map.of("userId", userId);
        
        return mysqlClient.query(sql, params, NOTIFICATION_MAPPER)
                .doOnError(e -> 
                    log.error("Failed to fetch unread notifications for userId={}, error={}", userId, e.getMessage(), e));
    }

    /**
     * Đếm số lượng notification chưa đọc
     */
    public Mono<Long> countUnreadNotifications(Integer userId) {
        String sql = "SELECT COUNT(*) as count FROM notifications WHERE user_id = :userId AND is_read = false";
        Map<String, Object> params = Map.of("userId", userId);
        
        return mysqlClient.count(sql, params)
                .doOnError(e -> 
                    log.error("Failed to count unread notifications for userId={}, error={}", userId, e.getMessage(), e));
    }

    /**
     * Lấy n notification gần nhất
     */
    public Flux<Notification> getLatestNotifications(Integer userId, Integer limit) {
        String sql = "SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit";
        Map<String, Object> params = Map.of("userId", userId, "limit", limit);
        
        return mysqlClient.query(sql, params, NOTIFICATION_MAPPER)
                .doOnError(e -> 
                    log.error("Failed to fetch latest notifications for userId={}, error={}", userId, e.getMessage(), e));
    }

    /**
     * Đánh dấu notification đã đọc
     */
    public Mono<Void> markNotificationAsRead(Integer notificationId) {
        String sql = "UPDATE notifications SET is_read = true WHERE id = :id";
        Map<String, Object> params = Map.of("id", notificationId);
        
        return mysqlClient.execute(sql, params)
                .doOnSuccess(rowsAffected -> 
                    log.info("Notification marked as read: id={}", notificationId))
                .doOnError(e -> 
                    log.error("Failed to mark notification as read: id={}, error={}", notificationId, e.getMessage(), e))
                .then();
    }

    /**
     * Đánh dấu tất cả notification của user đã đọc
     */
    public Mono<Void> markAllNotificationsAsRead(Integer userId) {
        String sql = "UPDATE notifications SET is_read = true WHERE user_id = :userId";
        Map<String, Object> params = Map.of("userId", userId);
        
        return mysqlClient.execute(sql, params)
                .doOnSuccess(rowsAffected -> 
                    log.info("All notifications marked as read for userId={}, rows affected={}", userId, rowsAffected))
                .doOnError(e -> 
                    log.error("Failed to mark all notifications as read: userId={}, error={}", userId, e.getMessage(), e))
                .then();
    }

    /**
     * Xóa notification cũ hơn 30 ngày
     */
    public Mono<Void> deleteOldNotifications(Integer userId) {
        String sql = "DELETE FROM notifications WHERE user_id = :userId AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)";
        Map<String, Object> params = Map.of("userId", userId);
        
        return mysqlClient.execute(sql, params)
                .doOnSuccess(rowsAffected -> 
                    log.info("Old notifications deleted for userId={}, rows affected={}", userId, rowsAffected))
                .doOnError(e -> 
                    log.error("Failed to delete old notifications: userId={}, error={}", userId, e.getMessage(), e))
                .then();
    }
}
