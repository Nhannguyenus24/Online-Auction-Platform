package entities.data;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BidderData extends UserData {
    
    private Integer watchlistCount;
    
    private Integer activeBidsCount;
    
    private Integer wonAuctionsCount;
    
    private Double totalSpent;
    
    private Boolean upgradeRequested;
}
