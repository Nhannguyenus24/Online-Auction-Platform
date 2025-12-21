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

@Table(name = "reviews")
public class Review {
    @Id
    private Integer id;
    
    private Integer fromUserId;
    
    private Integer toUserId;
    
    private Integer productId;
    
    private Integer score;
    
    private String comment;
    
    private LocalDateTime createdAt;
}
