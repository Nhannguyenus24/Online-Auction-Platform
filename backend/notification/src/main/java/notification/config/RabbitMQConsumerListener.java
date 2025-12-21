package notification.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import notification.service.RabbitMQConsumerService;
import reactor.core.scheduler.Schedulers;

/**
 * Listener để khởi động RabbitMQ consumers khi application start
 */
@Component
public class RabbitMQConsumerListener {
    private static final Logger log = LoggerFactory.getLogger(RabbitMQConsumerListener.class);
    private final RabbitMQConsumerService consumerService;
    
    @Value("${rabbitmq.notification.queue}")
    private String notificationQueue;

    public RabbitMQConsumerListener(RabbitMQConsumerService consumerService) {
        this.consumerService = consumerService;
    }

    /**
     * Khởi động consumer khi application sẵn sàng
     */
    @EventListener(ApplicationReadyEvent.class)
    public void startConsumers() {
        log.info("Starting RabbitMQ notification consumer for queue: {}", notificationQueue);

        // Consume all notification events from dev queue
        consumerService.startConsumingMessages(notificationQueue)
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                    unused -> log.info("Notification consumer started successfully for queue: {}", notificationQueue),
                    error -> log.error("Failed to start notification consumer for queue: {}", notificationQueue, error)
                );

        log.info("RabbitMQ notification consumer has been initialized");
    }
}
