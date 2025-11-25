package entities.data;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RejectedBidderData {
    
    private Long id;
    
    private Long productId;
    
    private Long bidderId;
    
    private Long sellerId;
    
    private String reason;
    
    private LocalDateTime rejectedAt;
}
