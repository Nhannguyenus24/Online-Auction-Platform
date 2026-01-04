package com.auction.entities.record;

import java.time.ZonedDateTime;

public record QuestionRowRecord(
    int id,
    int productId,
    int askerId,
    String askerName,
    String question,
    String answer,
    Integer answeredBy,  // Changed from int to Integer to handle null values
    String answererName,
    ZonedDateTime createdAt,
    ZonedDateTime answeredAt
) {

    public long createdAtSeconds() {
        return createdAt != null ? createdAt.toEpochSecond() : 0L;
    }
    
    public long answeredAtSeconds() {
        return answeredAt != null ? answeredAt.toEpochSecond() : 0L;
    }
}
