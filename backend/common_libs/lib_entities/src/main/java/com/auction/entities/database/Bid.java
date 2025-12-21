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
@Table(name = "bids")
public class Bid {
    @Id
    private Integer id;
    
    private Integer productId;
    
    private Integer bidderId;
    
    private BigDecimal amount;
    
    private Boolean isAuto;
    
    private LocalDateTime createdAt;
}
