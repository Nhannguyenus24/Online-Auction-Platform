package products.dto;

import java.time.ZonedDateTime;

public record WatchListRowDto (
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
        double sellerRatingPercent,
        int sellerPositiveReviews
) {
}
