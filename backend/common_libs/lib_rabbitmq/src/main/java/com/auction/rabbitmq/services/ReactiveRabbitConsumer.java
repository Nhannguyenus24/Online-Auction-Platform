package com.auction.rabbitmq.services;

import java.util.function.Function;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reactive RabbitMQ Consumer Service Interface
 * Provides methods to consume messages from RabbitMQ
 * Create by Nhan Nguyen on 2025-12-1
 */
public interface ReactiveRabbitConsumer {

    /**
     * Consume messages from a queue
     * 
     * @param queueName the queue name
     * @param messageClass the class type of the message
     * @param messageHandler the handler function to process messages
     * @param <T> message type
     * @return Flux<Void> stream of processing results
     */
    <T> Flux<Void> consumeMessages(String queueName, Class<T> messageClass, Function<T, Mono<Void>> messageHandler);

    /**
     * Consume messages with manual acknowledgment
     * 
     * @param queueName the queue name
     * @param messageClass the class type of the message
     * @param messageHandler the handler function that returns true to ack, false to nack
     * @param <T> message type
     * @return Flux<Void> stream of processing results
     */
    <T> Flux<Void> consumeWithAck(String queueName, Class<T> messageClass, Function<T, Mono<Boolean>> messageHandler);

    /**
     * Consume messages with retry logic
     * 
     * @param queueName the queue name
     * @param messageClass the class type of the message
     * @param messageHandler the handler function to process messages
     * @param maxRetries maximum number of retries
     * @param <T> message type
     * @return Flux<Void> stream of processing results
     */
    <T> Flux<Void> consumeWithRetry(String queueName, Class<T> messageClass, Function<T, Mono<Void>> messageHandler, int maxRetries);

    /**
     * Start consuming messages from a queue
     * This method starts the consumer in the background
     * 
     * @param queueName the queue name
     * @param messageClass the class type of the message
     * @param messageHandler the handler function to process messages
     * @param <T> message type
     * @return Mono<Void> completion signal
     */
    <T> Mono<Void> startConsumer(String queueName, Class<T> messageClass, Function<T, Mono<Void>> messageHandler);

    /**
     * Stop consuming messages from a queue
     * 
     * @param queueName the queue name
     * @return Mono<Void> completion signal
     */
    Mono<Void> stopConsumer(String queueName);
}
