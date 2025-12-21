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
@Table(name = "auto_bids")
public class AutoBid {
    @Id
    private Integer id;
    
    private Integer productId;
    
    private Integer bidderId;
    
    private BigDecimal maxAmount;
    
    private LocalDateTime createdAt;
}
