package gateway.controller.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request to add product to watchlist")
public record AddToWatchlistRequest(
    @Schema(description = "Product ID to add to watchlist", required = true, example = "1")
    Integer productId
) {}
