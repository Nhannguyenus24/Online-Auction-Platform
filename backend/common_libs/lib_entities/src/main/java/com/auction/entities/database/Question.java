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

@Table(name = "questions")
public class Question {
    @Id
    private Integer id;
    
    private Integer productId;
    
    private Integer askerId;
    
    private String question;
    
    private String answer;
    
    private Integer answeredBy;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime answeredAt;
}
