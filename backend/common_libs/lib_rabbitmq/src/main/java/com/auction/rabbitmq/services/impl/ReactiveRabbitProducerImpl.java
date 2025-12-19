package com.auction.rabbitmq.services.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rabbitmq.client.AMQP;
import lombok.RequiredArgsConstructor;
import com.auction.rabbitmq.model.MessageWrapper;
import com.auction.rabbitmq.services.ReactiveRabbitProducer;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.rabbitmq.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Implementation of ReactiveRabbitProducer
 * Provides reactive RabbitMQ producer operations for WebFlux applications
 * Create by Nhan Nguyen on 2025-12-1
 */
@Service
@RequiredArgsConstructor
public class ReactiveRabbitProducerImpl implements ReactiveRabbitProducer {

    private final Sender sender;
    private final ObjectMapper rabbitMqObjectMapper;

    @Override
    public <T> Mono<Void> sendMessage(String exchange, String routingKey, T message) {
        return Mono.fromCallable(() -> rabbitMqObjectMapper.writeValueAsBytes(message))
                .flatMap(messageBody -> {
                    OutboundMessage outboundMessage = new OutboundMessage(
                            exchange,
                            routingKey,
                            new AMQP.BasicProperties.Builder()
                                    .contentType("application/json")
                                    .messageId(UUID.randomUUID().toString())
                                    .timestamp(new java.util.Date())
                                    .build(),
                            messageBody
                    );
                    return sender.send(Mono.just(outboundMessage));
                })
                .onErrorResume(e -> Mono.empty());
    }

    @Override
    public <T> Mono<Void> sendWrappedMessage(String exchange, String routingKey, MessageWrapper<T> wrapper) {
        if (wrapper.getMessageId() == null) {
            wrapper.setMessageId(UUID.randomUUID().toString());
        }
        if (wrapper.getTimestamp() == null) {
            wrapper.setTimestamp(LocalDateTime.now());
        }
        return sendMessage(exchange, routingKey, wrapper);
    }

    @Override
    public <T> Mono<Void> sendToQueue(String queueName, T message) {
        return sendMessage("", queueName, message);
    }

    @Override
    public <T> Mono<Void> sendToTopic(String topicExchange, String routingKey, T message) {
        return sendMessage(topicExchange, routingKey, message);
    }

    @Override
    public <T> Mono<Void> broadcastMessage(String fanoutExchange, T message) {
        return sendMessage(fanoutExchange, "", message);
    }

    @Override
    public <T> Mono<Void> sendDelayedMessage(String exchange, String routingKey, T message, long delayMillis) {
        return Mono.fromCallable(() -> rabbitMqObjectMapper.writeValueAsBytes(message))
                .flatMap(messageBody -> {
                    Map<String, Object> headers = new HashMap<>();
                    headers.put("x-delay", delayMillis);
                    
                    OutboundMessage outboundMessage = new OutboundMessage(
                            exchange,
                            routingKey,
                            new AMQP.BasicProperties.Builder()
                                    .contentType("application/json")
                                    .messageId(UUID.randomUUID().toString())
                                    .timestamp(new java.util.Date())
                                    .headers(headers)
                                    .build(),
                            messageBody
                    );
                    return sender.send(Mono.just(outboundMessage));
                })
                .onErrorResume(e -> Mono.empty());
    }

    @Override
    public Mono<Void> declareExchange(String exchangeName, String exchangeType, boolean durable) {
        return sender.declare(ExchangeSpecification.exchange(exchangeName)
                .type(exchangeType)
                .durable(durable))
                .then();
    }

    @Override
    public Mono<Void> declareQueue(String queueName, boolean durable, boolean exclusive, boolean autoDelete) {
        return sender.declare(QueueSpecification.queue(queueName)
                .durable(durable)
                .exclusive(exclusive)
                .autoDelete(autoDelete))
                .then();
    }

    @Override
    public Mono<Void> bindQueue(String queueName, String exchangeName, String routingKey) {
        return sender.bind(BindingSpecification.binding()
                .exchange(exchangeName)
                .queue(queueName)
                .routingKey(routingKey))
                .then();
    }
}
