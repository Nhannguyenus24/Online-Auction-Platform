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
public class Product {
    private Integer id;
    private Integer sellerId;
    private Integer categoryId;
    private String title;
    private String description;
    private BigDecimal startingPrice;
    private BigDecimal currentPrice;
    private BigDecimal stepPrice;
    private BigDecimal buyNowPrice;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private Boolean isAutoExtend;
    private Integer autoExtendSeconds;
    private String status;
    private Integer viewsCount;
    private Integer bidsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
