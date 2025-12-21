package com.auction.entities.database;

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

@Table(name = "product_bans")
public class ProductBan {
    @Id
    private Integer id;
    
    private Integer productId;
    
    private Integer userId;
    
    private String reason;
    
    private LocalDateTime createdAt;
}
