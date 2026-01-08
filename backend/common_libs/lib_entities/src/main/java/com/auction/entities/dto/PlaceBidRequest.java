package com.auction.entities.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request to place a bid on a product")
public record PlaceBidRequest(
    @Schema(description = "Bid amount", example = "150.50")
    Double bidAmount
) {}
