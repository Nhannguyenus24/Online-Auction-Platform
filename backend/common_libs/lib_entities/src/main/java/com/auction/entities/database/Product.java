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
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "seller_id", nullable = false)
    private Integer sellerId;
    
    @Column(name = "category_id", nullable = false)
    private Integer categoryId;
    
    @Column(nullable = false, length = 300)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "starting_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal startingPrice;
    
    @Column(name = "current_price", precision = 18, scale = 2)
    private BigDecimal currentPrice;
    
    @Column(name = "step_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal stepPrice;
    
    @Column(name = "buy_now_price", precision = 18, scale = 2)
    private BigDecimal buyNowPrice;
    
    @Column(name = "starts_at", nullable = false)
    private LocalDateTime startsAt;
    
    @Column(name = "ends_at", nullable = false)
    private LocalDateTime endsAt;
    
    @Column(name = "is_auto_extend")
    private Boolean isAutoExtend;
    
    @Column(name = "auto_extend_seconds")
    private Integer autoExtendSeconds;
    
    @Column(length = 30)
    private String status;
    
    @Column(name = "views_count")
    private Integer viewsCount;
    
    @Column(name = "bids_count")
    private Integer bidsCount;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
