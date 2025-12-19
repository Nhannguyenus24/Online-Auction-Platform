package com.auction.rabbitmq.config;

import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

import reactor.core.publisher.Mono;
import reactor.rabbitmq.RabbitFlux;
import reactor.rabbitmq.Receiver;
import reactor.rabbitmq.ReceiverOptions;
import reactor.rabbitmq.Sender;
import reactor.rabbitmq.SenderOptions;

/**
 * RabbitMQ Configuration for Reactive/WebFlux applications
 * Provides reactive sender and receiver with JSON serialization support
 * Create by Nhan Nguyen on 2025-12-1
 */
@Configuration
public class RabbitMQConfig {

    @Value("${spring.rabbitmq.host:localhost}")
    private String host;

    @Value("${spring.rabbitmq.port:5672}")
    private int port;

    @Value("${spring.rabbitmq.username:guest}")
    private String username;

    @Value("${spring.rabbitmq.password:guest}")
    private String password;

    @Value("${spring.rabbitmq.virtual-host:/}")
    private String virtualHost;

    /**
     * Creates ObjectMapper configured for RabbitMQ message serialization
     * 
     * @return configured ObjectMapper
     */
    @Bean
    public ObjectMapper rabbitMqObjectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        return objectMapper;
    }

    /**
     * Creates Spring AMQP ConnectionFactory for reactive operations
     * 
     * @return configured ConnectionFactory
     */
    @Bean
    public CachingConnectionFactory connectionFactory() {
        CachingConnectionFactory factory = new CachingConnectionFactory();
        factory.setHost(host);
        factory.setPort(port);
        factory.setUsername(username);
        factory.setPassword(password);
        factory.setVirtualHost(virtualHost);
        return factory;
    }

    /**
     * Creates Reactor RabbitMQ ConnectionFactory
     * 
     * @return Mono of Connection
     */
    @Bean
    public Mono<Connection> reactiveConnection() {
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setHost(host);
        connectionFactory.setPort(port);
        connectionFactory.setUsername(username);
        connectionFactory.setPassword(password);
        connectionFactory.setVirtualHost(virtualHost);
        connectionFactory.useNio();
        
        return Mono.fromCallable(() -> connectionFactory.newConnection("reactive-connection"))
                .cache();
    }

    /**
     * Creates Reactor RabbitMQ Sender
     * 
     * @param connection the reactive connection
     * @return configured Sender
     */
    @Bean
    public Sender sender(Mono<Connection> connection) {
        SenderOptions senderOptions = new SenderOptions()
                .connectionMono(connection)
                .resourceManagementScheduler(reactor.core.scheduler.Schedulers.boundedElastic());
        
        return RabbitFlux.createSender(senderOptions);
    }

    /**
     * Creates Reactor RabbitMQ Receiver
     * 
     * @param connection the reactive connection
     * @return configured Receiver
     */
    @Bean
    public Receiver receiver(Mono<Connection> connection) {
        ReceiverOptions receiverOptions = new ReceiverOptions()
                .connectionMono(connection);
        
        return RabbitFlux.createReceiver(receiverOptions);
    }
}
