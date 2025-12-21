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

@Table(name = "product_images")
public class ProductImage {
    @Id
    private Integer id;
    
    private Integer productId;
    
    private String url;
    
    private Integer sortOrder;
    
    private Boolean isPrimary;
    
    private LocalDateTime createdAt;
}
