package com.auction.entities.database;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    private Integer id;
    private Integer orderId;
    private String provider;
    private String providerType;
    private String providerTxnId;
    private BigDecimal amount;
    private String currency;
    private String status;
    private LocalDateTime paidAt;
    private BigDecimal refundedAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
