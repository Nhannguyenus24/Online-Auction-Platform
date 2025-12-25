package products.dto;

import java.util.Map;

public record QuestionRowDto(
    int id,
    int productId,
    int askerId,
    String askerName,
    String question,
    String answer,
    int answeredBy,
    String answererName,
    long createdAt,
    long answeredAt
) {
    
    public static QuestionRowDto fromMap(Map<String, Object> map) {
        return new QuestionRowDto(
            toInt(map.get("id")),
            toInt(map.get("product_id")),
            toInt(map.get("asker_id")),
            toString(map.get("asker_name")),
            toString(map.get("question")),
            toString(map.get("answer")),
            toInt(map.get("answered_by")),
            toString(map.get("answerer_name")),
            toSeconds(map.get("created_at")),
            toSeconds(map.get("answered_at"))
        );
    }
    
    private static int toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number) return ((Number) value).intValue();
        return 0;
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
