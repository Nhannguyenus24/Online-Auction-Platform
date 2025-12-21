package notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Notification Queue Configuration
 * Defines exchange, queue and bindings for notification channel
 */
@Configuration
public class NotificationQueueConfig {

    @Value("${rabbitmq.notification.exchange}")
    private String notificationExchange;

    @Value("${rabbitmq.notification.queue}")
    private String notificationQueue;

    @Value("${rabbitmq.notification.email.routing-key}")
    private String emailRoutingKey;

    /**
     * Define notification exchange
     */
    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(notificationExchange, true, false);
    }

    /**
     * Define notification queue for dev channel
     */
    @Bean
    public Queue notificationQueue() {
        return new Queue(notificationQueue, true, false, false);
    }

    /**
     * Bind queue to exchange with email routing key
     */
    @Bean
    public Binding notificationBinding(Queue notificationQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(notificationQueue)
                .to(notificationExchange)
                .with(emailRoutingKey);
    }
}
