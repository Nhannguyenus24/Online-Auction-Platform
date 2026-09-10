package notification.service;

import com.auction.entities.database.Notification;
import com.auction.constants.ServiceConstants;
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
     * Save notification with JSON payload
     */
    public Mono<Void> saveNotificationWithJson(Integer userId, String type, Map<String, Object> payloadMap) {
        log.debug("Saving notification for userId={}, type={}", userId, type);

        return Mono.fromCallable(() -> {
            log.debug("Serializing notification payload for userId={}, payloadKeys={}", userId, payloadMap.keySet());
            return objectMapper.writeValueAsString(payloadMap);
        })
        .flatMap(payload -> {
            Notification notification = Notification.builder()
                    .userId(userId)
                    .type(type)
                    .payload(payload)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            log.debug("Persisting notification to database: userId={}, type={}, payloadLength={}",
                userId, type, payload.length());

            return notificationRepository.save(notification)
                    .doOnSuccess(saved ->
                        log.info("Notification saved successfully: userId={}, type={}, id={}, createdAt={}",
                            userId, type, saved.getId(), saved.getCreatedAt()))
                    .doOnError(e ->
                        log.error("Failed to save notification to database: userId={}, type={}, error={}",
                            userId, type, e.getMessage(), e))
                    .then();
        })
        .doOnError(e -> log.error("Error during notification save process: userId={}, type={}, error={}",
            userId, type, e.getMessage(), e));
    }
}
