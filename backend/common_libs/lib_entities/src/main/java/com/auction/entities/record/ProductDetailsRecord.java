package com.auction.entities.record;

import java.time.LocalDateTime;

/**
 * Record for product details with seller information
 * Used by getProductDetailsForBidder query
 */
public record ProductDetailsRecord(
    int id,
    int sellerId,
    int categoryId,
    String categoryName,
    String title,
    String description,
    double startingPrice,
    double currentPrice,
    double stepPrice,
    double buyNowPrice,
    LocalDateTime startsAt,
    LocalDateTime endsAt,
    boolean isAutoExtend,
    int autoExtendSeconds,
    String status,
    int viewsCount,
    int bidsCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    String sellerName,
    String sellerEmail,
    double sellerRatingPercent,
    int sellerPositiveReviews,
    int sellerNegativeReviews
) {}
