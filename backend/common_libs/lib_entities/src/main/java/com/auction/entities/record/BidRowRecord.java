package com.auction.entities.record;

import java.time.ZonedDateTime;

public record BidRowRecord(
    int id,
    int productId,
    int bidderId,
    String bidderNameMasked,
    double amount,
    boolean isAuto,
    ZonedDateTime createdAt
) {
    
    public long createdAtSeconds() {
        return createdAt != null ? createdAt.toEpochSecond() : 0L;
    }
}
