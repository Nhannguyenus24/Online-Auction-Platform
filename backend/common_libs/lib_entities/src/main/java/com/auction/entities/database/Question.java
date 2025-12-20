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
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "product_id", nullable = false)
    private Integer productId;
    
    @Column(name = "asker_id", nullable = false)
    private Integer askerId;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;
    
    @Column(columnDefinition = "TEXT")
    private String answer;
    
    @Column(name = "answered_by")
    private Integer answeredBy;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "answered_at")
    private LocalDateTime answeredAt;
}
