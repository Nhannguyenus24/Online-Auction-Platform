package com.auction.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("TimeUtils")
class TimeUtilsTest {

    @Test
    @DisplayName("uses the Vietnam zone, seven hours ahead of UTC")
    void usesVietnamZone() {
        assertEquals("Asia/Ho_Chi_Minh", TimeUtils.VIETNAM_ZONE.getId());
        assertEquals(7 * 3600, TimeUtils.VIETNAM_OFFSET.getTotalSeconds());
    }

    @Test
    @DisplayName("converting a local time to an instant and back is lossless")
    void instantRoundTrip() {
        LocalDateTime original = LocalDateTime.of(2026, 3, 14, 9, 30, 0);

        Instant instant = TimeUtils.toInstant(original);
        assertEquals(original, TimeUtils.toLocalDateTime(instant));
    }

    @Test
    @DisplayName("converting a local time to epoch seconds and back is lossless")
    void epochSecondRoundTrip() {
        LocalDateTime original = LocalDateTime.of(2026, 3, 14, 9, 30, 0);

        long epochSecond = TimeUtils.toEpochSecond(original);
        assertEquals(original, TimeUtils.fromEpochSecond(epochSecond));
    }

    @Test
    @DisplayName("a local time is offset seven hours from the same instant in UTC")
    void localTimeIsOffsetFromUtc() {
        LocalDateTime local = LocalDateTime.of(2026, 3, 14, 9, 30, 0);

        assertEquals(local.minusHours(7), LocalDateTime.ofInstant(TimeUtils.toInstant(local), java.time.ZoneOffset.UTC));
    }

    @Test
    @DisplayName("now tracks the current instant")
    void nowTracksTheCurrentInstant() {
        Duration drift = Duration.between(TimeUtils.toInstant(TimeUtils.now()), TimeUtils.nowInstant()).abs();

        assertTrue(drift.compareTo(Duration.ofMinutes(1)) < 0, "unexpected drift: " + drift);
    }
}
