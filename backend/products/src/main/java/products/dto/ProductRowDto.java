package products.dto;

import java.util.Map;

public record ProductRowDto(
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
    long startsAt,
    long endsAt,
    boolean isAutoExtend,
    int autoExtendSeconds,
    String status,
    int viewsCount,
    int bidsCount,
    String createdAt,
    String updatedAt,
    String sellerName,
    double sellerRatingPercent,
    int sellerPositiveReviews
) {
    
    public static ProductRowDto fromMap(Map<String, Object> map) {
        return new ProductRowDto(
            toInt(map.get("id")),
            toInt(map.get("seller_id")),
            toInt(map.get("category_id")),
            toString(map.get("category_name")),
            toString(map.get("title")),
            toString(map.get("description")),
            toDouble(map.get("starting_price")),
            toDouble(map.get("current_price")),
            toDouble(map.get("step_price")),
            toDouble(map.get("buy_now_price")),
            toSeconds(map.get("starts_at")),
            toSeconds(map.get("ends_at")),
            toBoolean(map.get("is_auto_extend")),
            toInt(map.get("auto_extend_seconds")),
            toString(map.get("status")),
            toInt(map.get("views_count")),
            toInt(map.get("bids_count")),
            toString(map.get("created_at")),
            toString(map.get("updated_at")),
            toString(map.get("seller_name")),
            toDouble(map.get("seller_rating_percent")),
            toInt(map.get("seller_positive_reviews"))
        );
    }
    
    private static int toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number) return ((Number) value).intValue();
        return 0;
    }
    
    private static double toDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number) return ((Number) value).doubleValue();
        return 0.0;
    }
    
    private static boolean toBoolean(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean) return (Boolean) value;
        if (value instanceof Number) return ((Number) value).intValue() != 0;
        return false;
    }
    
    private static long toSeconds(Object value) {
        if (value == null) return 0L;
        if (value instanceof java.sql.Timestamp) {
            return ((java.sql.Timestamp) value).getTime() / 1000;
        }
        if (value instanceof java.util.Date) {
            return ((java.util.Date) value).getTime() / 1000;
        }
        if (value instanceof Long) {
            long time = (Long) value;
            // If value is already in milliseconds (13 digits), convert to seconds
            if (time > 10000000000L) {
                return time / 1000;
            }
            return time;
        }
        if (value instanceof Number) {
            long time = ((Number) value).longValue();
            if (time > 10000000000L) {
                return time / 1000;
            }
            return time;
        }
        return 0L;
    }
    
    private static String toString(Object value) {
        if (value == null) return "";
        return value.toString();
    }
}
