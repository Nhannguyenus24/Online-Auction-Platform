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
public class Bid {
    private Integer id;
    private Integer productId;
    private Integer bidderId;
    private BigDecimal amount;
    private Boolean isAuto;
    private LocalDateTime createdAt;
}
