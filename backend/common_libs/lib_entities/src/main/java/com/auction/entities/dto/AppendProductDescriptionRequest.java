package com.auction.entities.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public class AppendProductDescriptionRequest {
    
    @Schema(description = "Additional description to append", example = "UPDATE: Added more photos showing the product from different angles.", required = true)
    private String additionalDescription;

    public AppendProductDescriptionRequest() {
    }

    public AppendProductDescriptionRequest(String additionalDescription) {
        this.additionalDescription = additionalDescription;
    }

    public String getAdditionalDescription() {
        return additionalDescription;
    }

    public void setAdditionalDescription(String additionalDescription) {
        this.additionalDescription = additionalDescription;
    }
}
