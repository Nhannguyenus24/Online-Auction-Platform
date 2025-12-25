package products.dto;

import java.util.Map;

public record AutoBidRowDto(
    int id,
    int productId,
    int bidderId,
    double maxAmount,
    long createdAt
) {
    
    public static AutoBidRowDto fromMap(Map<String, Object> map) {
        return new AutoBidRowDto(
            toInt(map.get("id")),
            toInt(map.get("product_id")),
            toInt(map.get("bidder_id")),
            toDouble(map.get("max_amount")),
            toSeconds(map.get("created_at"))
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
}
