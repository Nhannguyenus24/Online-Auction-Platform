package products.dto;

import java.time.ZonedDateTime;
import java.util.Map;

public record ImageRowDto (
        int id,
        int product_id,
        String url,
        boolean is_primary,
        ZonedDateTime created_at
){}
