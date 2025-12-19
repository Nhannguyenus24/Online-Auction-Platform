package com.auction.rabbitmq.services.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import com.auction.rabbitmq.services.ReactiveRabbitConsumer;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.rabbitmq.Receiver;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

/**
 * Implementation of ReactiveRabbitConsumer
 * Provides reactive RabbitMQ consumer operations for WebFlux applications
 * Create by Nhan Nguyen on 2025-12-1
 */
@Service
@RequiredArgsConstructor
public class ReactiveRabbitConsumerImpl implements ReactiveRabbitConsumer {

    private final Receiver receiver;
    private final ObjectMapper rabbitMqObjectMapper;
    private final Map<String, reactor.core.Disposable> activeConsumers = new ConcurrentHashMap<>();

    @Override
    public <T> Flux<Void> consumeMessages(String queueName, Class<T> messageClass, Function<T, Mono<Void>> messageHandler) {
        return receiver.consumeAutoAck(queueName)
                .flatMap(delivery -> parseMessage(delivery.getBody(), messageClass)
                        .flatMap(messageHandler)
                        .onErrorResume(e -> Mono.empty())
                );
    }

    @Override
    public <T> Flux<Void> consumeWithAck(String queueName, Class<T> messageClass, Function<T, Mono<Boolean>> messageHandler) {
        return receiver.consumeManualAck(queueName)
                .flatMap(delivery -> parseMessage(delivery.getBody(), messageClass)
                        .flatMap(message -> messageHandler.apply(message)
                                .flatMap(success -> {
                                    if (success) {
                                        return Mono.fromRunnable(() -> delivery.ack(true));
                                    } else {
                                        return Mono.fromRunnable(() -> delivery.nack(true));
                                    }
                                })
                        )
                        .onErrorResume(e ->
                                Mono.fromRunnable(() -> delivery.nack(true))
                        ).then()
                );
    }

    @Override
    public <T> Flux<Void> consumeWithRetry(String queueName, Class<T> messageClass, Function<T, Mono<Void>> messageHandler, int maxRetries) {
        return receiver.consumeManualAck(queueName)
                .flatMap(delivery -> parseMessage(delivery.getBody(), messageClass)
                        .flatMap(message -> messageHandler.apply(message)
                                .retryWhen(reactor.util.retry.Retry.fixedDelay(maxRetries, Duration.ofSeconds(1)))
                                .then(Mono.fromRunnable(() -> delivery.ack(true)))
                        )
                        .onErrorResume(e ->
                                Mono.fromRunnable(() -> delivery.nack(false))
                        ).then()
                );
    }

    @Override
    public <T> Mono<Void> startConsumer(String queueName, Class<T> messageClass, Function<T, Mono<Void>> messageHandler) {
        if (activeConsumers.containsKey(queueName)) {
            return Mono.error(new IllegalStateException("Consumer already active for queue: " + queueName));
        }

        reactor.core.Disposable disposable = consumeMessages(queueName, messageClass, messageHandler)
                .subscribe();
        
        activeConsumers.put(queueName, disposable);
        return Mono.empty();
    }

    @Override
    public Mono<Void> stopConsumer(String queueName) {
        reactor.core.Disposable disposable = activeConsumers.remove(queueName);
        if (disposable != null && !disposable.isDisposed()) {
            disposable.dispose();
        }
        return Mono.empty();
    }

    /**
     * Parse message bytes to object
     */
    private <T> Mono<T> parseMessage(byte[] messageBody, Class<T> messageClass) {
        return Mono.fromCallable(() -> rabbitMqObjectMapper.readValue(messageBody, messageClass))
                .onErrorResume(e -> Mono.empty());
    }
}
