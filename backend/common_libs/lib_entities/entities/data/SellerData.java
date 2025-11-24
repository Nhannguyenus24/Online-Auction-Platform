package entities.data;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SellerData extends UserData {
    
    private Integer activeListingsCount;
    
    private Integer completedSalesCount;
    
    private Double totalRevenue;
    
    private LocalDateTime approvedAt;
    
    private Long approvedBy; // Admin ID who approved
}
