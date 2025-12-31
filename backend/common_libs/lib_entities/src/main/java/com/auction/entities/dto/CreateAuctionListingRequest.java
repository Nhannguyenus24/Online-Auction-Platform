package com.auction.entities.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.util.List;

@Schema(description = "Request to create auction listing with base64 images")
public class CreateAuctionListingRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    @Schema(description = "Product title", example = "Vintage Camera")
    private String title;

    @NotBlank(message = "Description is required")
    @Schema(description = "Product description", example = "A vintage camera in excellent condition")
    private String description;

    @NotNull(message = "Category ID is required")
    @Positive(message = "Category ID must be positive")
    @Schema(description = "Category ID", example = "1")
    private Integer categoryId;

    @NotNull(message = "Starting price is required")
    @Positive(message = "Starting price must be positive")
    @Schema(description = "Starting price", example = "100.0")
    private Float startingPrice;

    @NotNull(message = "Step price is required")
    @Positive(message = "Step price must be positive")
    @Schema(description = "Step price for bidding", example = "10.0")
    private Float stepPrice;

    @NotBlank(message = "Start date is required")
    @Schema(description = "Auction start date and time (format: yyyy-MM-dd'T'HH:mm:ss)", example = "2025-01-01T10:00:00")
    private String startsAt;

    @NotBlank(message = "End date is required")
    @Schema(description = "Auction end date and time (format: yyyy-MM-dd'T'HH:mm:ss)", example = "2025-01-10T10:00:00")
    private String endsAt;

    @Schema(description = "Buy now price (optional)", example = "500.0")
    private Float buyNowPrice;

    @Schema(description = "Enable auto-extend (optional)", example = "true")
    private Boolean isAutoExtend;

    @Schema(description = "Auto-extend duration in seconds (optional)", example = "600")
    private Integer autoExtendSeconds;

    @Size(max = 4, message = "Maximum 4 images allowed")
    @Schema(description = "List of base64 encoded images (max 4). Format: data:image/png;base64,iVBORw0KG... or just the base64 string without prefix", 
            example = "[\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\"]")
    private List<String> imageBase64List;

    // Constructors
    public CreateAuctionListingRequest() {
    }

    // Getters and Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Integer categoryId) {
        this.categoryId = categoryId;
    }

    public Float getStartingPrice() {
        return startingPrice;
    }

    public void setStartingPrice(Float startingPrice) {
        this.startingPrice = startingPrice;
    }

    public Float getStepPrice() {
        return stepPrice;
    }

    public void setStepPrice(Float stepPrice) {
        this.stepPrice = stepPrice;
    }

    public String getStartsAt() {
        return startsAt;
    }

    public void setStartsAt(String startsAt) {
        this.startsAt = startsAt;
    }

    public String getEndsAt() {
        return endsAt;
    }

    public void setEndsAt(String endsAt) {
        this.endsAt = endsAt;
    }

    public Float getBuyNowPrice() {
        return buyNowPrice;
    }

    public void setBuyNowPrice(Float buyNowPrice) {
        this.buyNowPrice = buyNowPrice;
    }

    public Boolean getIsAutoExtend() {
        return isAutoExtend;
    }

    public void setIsAutoExtend(Boolean isAutoExtend) {
        this.isAutoExtend = isAutoExtend;
    }

    public Integer getAutoExtendSeconds() {
        return autoExtendSeconds;
    }

    public void setAutoExtendSeconds(Integer autoExtendSeconds) {
        this.autoExtendSeconds = autoExtendSeconds;
    }

    public List<String> getImageBase64List() {
        return imageBase64List;
    }

    public void setImageBase64List(List<String> imageBase64List) {
        this.imageBase64List = imageBase64List;
    }
}
