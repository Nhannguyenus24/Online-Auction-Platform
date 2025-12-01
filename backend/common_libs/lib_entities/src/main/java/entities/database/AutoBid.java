package entities.database;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoBid {
    private Integer id;
    private Integer productId;
    private Integer bidderId;
    private BigDecimal maxAmount;
    private LocalDateTime createdAt;
}
