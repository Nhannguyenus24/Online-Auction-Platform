package entities.data;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistData {
    
    private Long id;
    
    private Long bidderId;
    
    private Long productId;
    
    private LocalDateTime addedAt;
}
