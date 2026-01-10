package com.auction.entities.record;

import java.time.ZonedDateTime;
import java.util.Map;

public record ProductRowRecord(
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
    ZonedDateTime startsAt,
    ZonedDateTime endsAt,
    boolean isAutoExtend,
    int autoExtendSeconds,
    String status,
    int viewsCount,
    int bidsCount,
    ZonedDateTime createdAt,
    ZonedDateTime updatedAt,
    String sellerName,
    int sellerPositiveReviews,
    int sellerNegativeReviews
) {
}
