package gateway.controller.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request to place a bid on a product")
public record PlaceBidRequest(
    @Schema(description = "Bid amount", required = true, example = "150.50")
    Double bidAmount
) {}
