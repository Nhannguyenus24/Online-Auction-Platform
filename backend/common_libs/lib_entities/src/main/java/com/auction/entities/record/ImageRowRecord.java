package com.auction.entities.record;

import java.time.ZonedDateTime;

public record ImageRowRecord (
        int id,
        int product_id,
        String url,
        boolean is_primary,
        ZonedDateTime created_at
){}
