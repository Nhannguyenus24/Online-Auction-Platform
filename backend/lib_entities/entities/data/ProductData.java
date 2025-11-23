package entities.data;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductData {
    
    private Long id;
    
    @NotBlank(message = "Product title is required")
    @Size(max = 200)
    private String title;
    
    @NotBlank(message = "Product description is required")
    private String description;
    
    @NotNull(message = "Starting price is required")
    @Min(value = 0, message = "Starting price must be positive")
    private Double startingPrice;
    
    @NotNull(message = "Current price is required")
    private Double currentPrice;
    
    @Min(value = 0, message = "Buy now price must be positive")
    private Double buyNowPrice;
    
    @NotNull(message = "Bid increment is required")
    @Min(value = 0, message = "Bid increment must be positive")
    private Double bidIncrement;
    
    private Long categoryId;
    
    private Long sellerId;
    
    private Long currentBidderId;
    
    private Long winnerId;
    
    private String mainImageUrl;
    
    private String additionalImages; // JSON array or comma-separated URLs
    
    private Integer bidCount;
    
    private Integer viewCount;
    
    private Integer watchlistCount;
    
    private ProductStatus status;
    
    private Boolean autoExtendEnabled;
    
    private Integer autoExtendMinutes;
    
    private LocalDateTime startTime;
    
    private LocalDateTime endTime;
    
    private Boolean isFlagged;
    
    private String flagReason;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    public enum ProductStatus {
        PENDING, ACTIVE, COMPLETED, CANCELLED, EXPIRED, REMOVED
    }
}
