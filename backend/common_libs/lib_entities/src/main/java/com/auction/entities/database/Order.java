package com.auction.entities.database;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

@Table(name = "orders")
public class Order {
    @Id
    private Integer id;
    
    private Integer productId;
    
    private Integer buyerId;
    
    private Integer sellerId;
    
    private BigDecimal amount;
    
    private String status;
    
    private String paymentMethod;
    
    private String shippingAddress;
    
    private String stripePaymentIntentId;
    
    private String paymentStatus; // 'pending', 'completed', 'failed'
    
    private LocalDateTime paymentAttemptedAt;
    
    private LocalDateTime paymentCompletedAt;
    
    private LocalDateTime paymentFailedAt;
    
    private String paymentFailureReason;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
