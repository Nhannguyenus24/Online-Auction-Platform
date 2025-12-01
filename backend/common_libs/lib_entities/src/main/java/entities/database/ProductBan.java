package entities.database;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductBan {
    private Integer id;
    private Integer productId;
    private Integer userId;
    private String reason;
    private LocalDateTime createdAt;
}
