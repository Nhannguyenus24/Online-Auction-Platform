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

@Table(name = "upgrade_requests")
public class UpgradeRequest {
    @Id
    private Integer id;
    
    private Integer userId;
    
    private String requestedRole;
    
    private String status;
    
    private Integer adminId;
    
    private LocalDateTime reviewedAt;
    
    private LocalDateTime createdAt;
}
