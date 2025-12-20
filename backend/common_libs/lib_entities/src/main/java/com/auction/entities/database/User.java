package com.auction.entities.database;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    @Column(name = "full_name")
    private String fullName;
    
    @Column(nullable = false, length = 20)
    private String role;
    
    @Column(length = 30)
    private String phone;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @Column(name = "is_email_verified")
    private Boolean isEmailVerified;
    
    @Column(name = "otp_verified")
    private Boolean otpVerified;
    
    @Column(name = "positive_reviews")
    private Integer positiveReviews;
    
    @Column(name = "negative_reviews")
    private Integer negativeReviews;
    
    @Column(name = "rating_percent", precision = 5, scale = 2)
    private BigDecimal ratingPercent;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
