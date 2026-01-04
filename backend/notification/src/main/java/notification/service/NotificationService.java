package notification.service;

import com.auction.entities.database.Notification;
import com.fasterxml.jackson.databind.ObjectMapper;
import notification.repository.NotificationRepository;

import org.springframework.stereotype.Service;
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
}
