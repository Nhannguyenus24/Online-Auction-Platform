package rabbitmq.services;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.function.Function;

import rabbitmq.model.MessageWrapper;

/**
 * Reactive RabbitMQ Producer Service Interface
 * Provides methods to send messages to RabbitMQ
 * Create by Nhan Nguyen on 2025-12-1
 */
public interface ReactiveRabbitProducer {

    /**
     * Send a message to an exchange with routing key
     * 
     * @param exchange the exchange name
     * @param routingKey the routing key
     * @param message the message to send
     * @param <T> message type
     * @return Mono<Void> completion signal
     */
    <T> Mono<Void> sendMessage(String exchange, String routingKey, T message);

    /**
     * Send a wrapped message with metadata
     * 
     * @param exchange the exchange name
     * @param routingKey the routing key
     * @param wrapper the message wrapper
     * @param <T> message payload type
     * @return Mono<Void> completion signal
     */
    <T> Mono<Void> sendWrappedMessage(String exchange, String routingKey, MessageWrapper<T> wrapper);

    /**
     * Send message to a direct exchange
     * 
     * @param queueName the queue name
     * @param message the message to send
     * @param <T> message type
     * @return Mono<Void> completion signal
     */
    <T> Mono<Void> sendToQueue(String queueName, T message);

    /**
     * Send message to a topic exchange
     * 
     * @param topicExchange the topic exchange name
     * @param routingKey the routing key pattern
     * @param message the message to send
     * @param <T> message type
     * @return Mono<Void> completion signal
     */
    <T> Mono<Void> sendToTopic(String topicExchange, String routingKey, T message);

    /**
     * Send message to a fanout exchange (broadcast)
     * 
     * @param fanoutExchange the fanout exchange name
     * @param message the message to send
     * @param <T> message type
     * @return Mono<Void> completion signal
     */
    <T> Mono<Void> broadcastMessage(String fanoutExchange, T message);

    /**
     * Send message with delay (requires delayed message plugin)
     * 
     * @param exchange the exchange name
     * @param routingKey the routing key
     * @param message the message to send
     * @param delayMillis delay in milliseconds
     * @param <T> message type
     * @return Mono<Void> completion signal
     */
    <T> Mono<Void> sendDelayedMessage(String exchange, String routingKey, T message, long delayMillis);

    /**
     * Declare an exchange
     * 
     * @param exchangeName the exchange name
     * @param exchangeType the exchange type (direct, topic, fanout, headers)
     * @param durable whether the exchange should survive broker restart
     * @return Mono<Void> completion signal
     */
    Mono<Void> declareExchange(String exchangeName, String exchangeType, boolean durable);

    /**
     * Declare a queue
     * 
     * @param queueName the queue name
     * @param durable whether the queue should survive broker restart
     * @param exclusive whether the queue is exclusive to this connection
     * @param autoDelete whether to delete queue when no longer in use
     * @return Mono<Void> completion signal
     */
    Mono<Void> declareQueue(String queueName, boolean durable, boolean exclusive, boolean autoDelete);

    /**
     * Bind a queue to an exchange
     * 
     * @param queueName the queue name
     * @param exchangeName the exchange name
     * @param routingKey the routing key
     * @return Mono<Void> completion signal
     */
    Mono<Void> bindQueue(String queueName, String exchangeName, String routingKey);
}
