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
@Table(name = "reviews")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "from_user_id", nullable = false)
    private Integer fromUserId;
    
    @Column(name = "to_user_id", nullable = false)
    private Integer toUserId;
    
    @Column(name = "product_id")
    private Integer productId;
    
    @Column(nullable = false)
    private Integer score;
    
    @Column(columnDefinition = "TEXT")
    private String comment;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
