package products.dto;

import java.time.ZonedDateTime;

public record BidHistoryRowDto(
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
