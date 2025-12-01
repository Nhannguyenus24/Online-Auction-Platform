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
public class ProductImage {
    private Integer id;
    private Integer productId;
    private String url;
    private Integer sortOrder;
    private Boolean isPrimary;
    private LocalDateTime createdAt;
}
