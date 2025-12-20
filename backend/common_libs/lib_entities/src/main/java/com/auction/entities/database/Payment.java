package com.auction.entities.database;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "order_id", nullable = false)
    private Integer orderId;
    
    @Column(nullable = false, length = 50)
    private String provider;
    
    @Column(name = "provider_type", length = 50)
    private String providerType;
    
    @Column(name = "provider_txn_id")
    private String providerTxnId;
    
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;
    
    @Column(length = 3)
    private String currency;
    
    @Column(length = 30)
    private String status;
    
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    
    @Column(name = "refunded_amount", precision = 18, scale = 2)
    private BigDecimal refundedAmount;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
