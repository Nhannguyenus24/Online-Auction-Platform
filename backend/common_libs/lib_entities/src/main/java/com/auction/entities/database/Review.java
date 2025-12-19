package com.auction.entities.database;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    private Integer id;
    private Integer fromUserId;
    private Integer toUserId;
    private Integer productId;
    private Integer score;
    private String comment;
    private LocalDateTime createdAt;
}
