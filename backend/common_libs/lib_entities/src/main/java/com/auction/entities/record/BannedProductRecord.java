package com.auction.entities.record;

import java.time.LocalDateTime;

/**
 * Record for banned products
 * Maps to the result of getBannedProductsByUserId query
 */
public record BannedProductRecord(
    Integer id,
    Integer productId,
    Integer bidderId,
    Integer sellerId,
    String productTitle,
    String productImage,
    String sellerName,
    String reason,
    LocalDateTime bannedAt,
    LocalDateTime bannedUntil
) {
}
