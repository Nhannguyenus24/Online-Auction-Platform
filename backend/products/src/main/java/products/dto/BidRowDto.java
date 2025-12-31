package products.dto;

import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Map;

public record BidRowDto(
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
    
    private static String toString(Object value) {
        if (value == null) return "";
        return value.toString();
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
