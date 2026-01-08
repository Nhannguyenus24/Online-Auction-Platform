package com.auction.entities.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request to set up automatic bidding")
public record SetAutoBidRequest(
    @Schema(description = "Maximum bid amount for auto-bidding", example = "500.00")
    Double maxAmount
) {}
