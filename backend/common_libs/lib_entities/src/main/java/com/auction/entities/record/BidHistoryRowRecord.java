package com.auction.entities.record;

import java.time.ZonedDateTime;

public record BidHistoryRowRecord(
    int bidId,
    int productId,
    String productTitle,
    String productPrimaryImage,
    double bidAmount,
    double currentPrice,
    int isAuto,
    int isWinning,
    String productStatus,
    ZonedDateTime bidCreatedAt,
    ZonedDateTime productEndsAt
) {
}
