package notification.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import reactor.core.scheduler.Schedulers;
import notification.service.RabbitMQConsumerService;

/**
 * Listener để khởi động RabbitMQ consumers khi application start
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RabbitMQConsumerListener {

    private final RabbitMQConsumerService consumerService;

    // Queue name for all notification events
    private static final String NOTIFICATION_QUEUE = "notification.events";

    /**
     * Khởi động consumer khi application sẵn sàng
     */
    @EventListener(ApplicationReadyEvent.class)
    public void startConsumers() {
        log.info("Starting RabbitMQ notification event consumer...");

        // Consume all notification events
        consumerService.startConsumingMessages(NOTIFICATION_QUEUE)
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                    () -> log.info("Notification event consumer started"),
                    error -> log.error("Failed to start notification event consumer", error)
                );

        log.info("RabbitMQ notification consumer has been initialized");
    }
}
