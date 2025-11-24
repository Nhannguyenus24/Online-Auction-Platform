package entities.data;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BidData {
    
    private Long id;
    
    private Long productId;
    
    private Long bidderId;
    
    @NotNull(message = "Bid amount is required")
    @Min(value = 0, message = "Bid amount must be positive")
    private Double bidAmount;
    
    private Boolean isAutoBid;
    
    private Double maxAutoBidAmount;
    
    private BidStatus status;
    
    private LocalDateTime bidTime;
    
    public enum BidStatus {
        ACTIVE, OUTBID, REJECTED, CANCELLED, WON
    }
}
