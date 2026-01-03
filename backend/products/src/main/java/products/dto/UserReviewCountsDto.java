package products.dto;

/**
 * DTO for user review counts
 * Used by getUserReviewCounts query
 */
public record UserReviewCountsDto(
    int positiveReviews,
    int negativeReviews
) {}
