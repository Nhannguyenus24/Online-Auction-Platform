package com.auction.rabbitmq.model;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic message wrapper for RabbitMQ messages
 * Create by Nhan Nguyen on 2025-12-1
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageWrapper<T> {
    
    /**
     * Unique message ID
     */
    private String messageId;
    
    /**
     * Message type/event name
     */
    private String messageType;
    
    /**
     * Timestamp when message was created
     */
    private LocalDateTime timestamp;
    
    /**
     * Source service that sent the message
     */
    private String source;
    
    /**
     * The actual message payload
     */
    private T payload;
    
    /**
     * Additional metadata
     */
    private Map<String, Object> metadata;
    
    /**
     * Number of retry attempts
     */
    private Integer retryCount;
    
    /**
     * Correlation ID for message tracking
     */
    private String correlationId;
}
