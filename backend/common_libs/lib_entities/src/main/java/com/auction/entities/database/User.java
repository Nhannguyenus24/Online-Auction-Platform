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
@Table(name = "users")
public class User {
    @Id
    private Integer id;
    
    private String email;
    
    private String passwordHash;
    
    private String fullName;
    
    private String role;
    
    private String phone;
    
    private String address;
    
    private Boolean isEmailVerified;
    
    private Integer positiveReviews;
    
    private Integer negativeReviews;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
