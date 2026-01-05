package com.auction.entities.record;

import java.time.ZonedDateTime;

public record UpgradeRequestRecord(
    int id,
    int userId,
    String requestedRole,
    String status,
    ZonedDateTime createdAt
) {}
