package products.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

public record OrderDetailDto(
    Integer id,
    Integer productId,
    String productTitle,
    Integer buyerId,
    String buyerName,
    BigDecimal amount,
    String status,
    String paymentMethod,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static OrderDetailDto fromMap(Map<String, Object> map) {
        return new OrderDetailDto(
            toInt(map.get("id")),
            toInt(map.get("product_id")),
            toString(map.get("product_title")),
            toInt(map.get("buyer_id")),
            toString(map.get("buyer_name")),
            toBigDecimal(map.get("amount")),
            toString(map.get("status")),
            toString(map.get("payment_method")),
            toLocalDateTime(map.get("created_at")),
            toLocalDateTime(map.get("updated_at"))
        );
    }
    
    private static Integer toInt(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).intValue();
        return null;
    }
    
    private static String toString(Object value) {
        if (value == null) return null;
        return value.toString();
    }
    
    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        return null;
    }
    
    private static LocalDateTime toLocalDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDateTime) return (LocalDateTime) value;
        if (value instanceof java.sql.Timestamp) {
            return ((java.sql.Timestamp) value).toLocalDateTime();
        }
        return null;
    }
}

