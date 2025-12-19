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
public class User {
    private Integer id;
    private String email;
    private String passwordHash;
    private String fullName;
    private String role;
    private String phone;
    private String address;
    private Boolean isEmailVerified;
    private Boolean otpVerified;
    private Integer positiveReviews;
    private Integer negativeReviews;
    private BigDecimal ratingPercent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
