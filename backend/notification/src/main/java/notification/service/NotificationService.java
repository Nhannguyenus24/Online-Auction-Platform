package notification.service;

import com.auction.entities.database.Notification;
import com.fasterxml.jackson.databind.ObjectMapper;
import notification.repository.NotificationRepository;

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
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    public NotificationService(NotificationRepository notificationRepository, ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Lưu notification vào database
     */
    public Mono<Void> saveNotification(Integer userId, String type, String payload) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .payload(payload)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        return notificationRepository.save(notification)
                .doOnSuccess(saved -> 
                    log.info("Notification saved: userId={}, type={}, id={}", userId, type, saved.getId()))
                .doOnError(e -> 
                    log.error("Failed to save notification: userId={}, type={}, error={}", userId, type, e.getMessage(), e))
                .then();
    }

    /**
     * Lưu notification với JSON payload
     */
    public Mono<Void> saveNotificationWithJson(Integer userId, String type, Map<String, Object> payloadMap) {
        return Mono.fromCallable(() -> objectMapper.writeValueAsString(payloadMap))
                .flatMap(payload -> {
                    Notification notification = Notification.builder()
                            .userId(userId)
                            .type(type)
                            .payload(payload)
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .build();
                    
                    return notificationRepository.save(notification)
                            .doOnSuccess(saved -> 
                                log.info("Notification with JSON saved: userId={}, type={}, id={}", userId, type, saved.getId()))
                            .doOnError(e -> 
                                log.error("Failed to save notification: userId={}, type={}, error={}", userId, type, e.getMessage(), e))
                            .then();
                });
    }

    /**
     * Lấy tất cả notification của một user
     */
    public Flux<Notification> getNotificationsByUserId(Integer userId) {
        return notificationRepository.findByUserId(userId)
                .doOnError(e -> 
                    log.error("Failed to fetch notifications for userId={}, error={}", userId, e.getMessage(), e));
    }

    /**
     * Lấy notification chưa đọc của một user
     */
    public Flux<Notification> getUnreadNotificationsByUserId(Integer userId) {
        return notificationRepository.findUnreadByUserId(userId)
                .doOnError(e -> 
                    log.error("Failed to fetch unread notifications for userId={}, error={}", userId, e.getMessage(), e));
    }

    /**
     * Đếm số lượng notification chưa đọc
     */
    public Mono<Integer> countUnreadNotifications(Integer userId) {
        return notificationRepository.countUnreadByUserId(userId)
                .doOnError(e -> 
                    log.error("Failed to count unread notifications for userId={}, error={}", userId, e.getMessage(), e));
    }

    /**
     * Lấy n notification gần nhất
     */
    public Flux<Notification> getLatestNotifications(Integer userId, Integer limit) {
        return notificationRepository.findByUserId(userId)
                .take(limit)
                .doOnError(e -> 
                    log.error("Failed to fetch latest notifications for userId={}, error={}", userId, e.getMessage(), e));
    }

    /**
     * Đánh dấu notification đã đọc
     */
    public Mono<Void> markNotificationAsRead(Integer notificationId) {
        return notificationRepository.markAsRead(notificationId)
                .doOnSuccess(aVoid -> 
                    log.info("Notification marked as read: id={}", notificationId))
                .doOnError(e -> 
                    log.error("Failed to mark notification as read: id={}, error={}", notificationId, e.getMessage(), e));
    }

    /**
     * Đánh dấu tất cả notification của user đã đọc
     */
    public Mono<Void> markAllNotificationsAsRead(Integer userId) {
        return notificationRepository.markAllAsRead(userId)
                .doOnSuccess(aVoid -> 
                    log.info("All notifications marked as read for userId={}", userId))
                .doOnError(e -> 
                    log.error("Failed to mark all notifications as read: userId={}, error={}", userId, e.getMessage(), e));
    }

    /**
     * Xóa notification cũ hơn 30 ngày
     */
    public Mono<Void> deleteOldNotifications(Integer userId) {
        return notificationRepository.deleteOldNotificationsByUserId(userId, 30)
                .doOnSuccess(aVoid -> 
                    log.info("Old notifications deleted for userId={}", userId))
                .doOnError(e -> 
                    log.error("Failed to delete old notifications: userId={}, error={}", userId, e.getMessage(), e));
    }

    /**
     * Xóa notification theo ID
     */
    public Mono<Void> deleteNotification(Integer notificationId) {
        return notificationRepository.deleteById(notificationId)
                .doOnSuccess(aVoid ->
                    log.info("Notification deleted: id={}", notificationId))
                .doOnError(e ->
                    log.error("Failed to delete notification: id={}, error={}", notificationId, e.getMessage(), e));
    }

    /**
     * Xóa tất cả notification của user
     */
    public Mono<Void> deleteAllNotificationsByUserId(Integer userId) {
        return notificationRepository.deleteByUserId(userId)
                .doOnSuccess(aVoid ->
                    log.info("All notifications deleted for userId={}", userId))
                .doOnError(e ->
                    log.error("Failed to delete all notifications: userId={}, error={}", userId, e.getMessage(), e));
    }

    /**
     * Lấy notification theo type
     */
    public Flux<Notification> getNotificationsByType(Integer userId, String type) {
        return notificationRepository.findByUserIdAndType(userId, type)
                .doOnError(e ->
                    log.error("Failed to fetch notifications by type: userId={}, type={}, error={}", userId, type, e.getMessage(), e));
    }
}
