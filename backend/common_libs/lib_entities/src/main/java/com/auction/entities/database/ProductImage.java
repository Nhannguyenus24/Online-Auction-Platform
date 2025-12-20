package com.auction.entities.database;

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
@Table(name = "product_images")
public class ProductImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "product_id", nullable = false)
    private Integer productId;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
    
    @Column(name = "is_primary")
    private Boolean isPrimary;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
