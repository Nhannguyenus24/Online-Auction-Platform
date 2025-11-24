package entities.data;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryData {
    
    private Long id;
    
    @NotBlank(message = "Category name is required")
    @Size(max = 100)
    private String name;
    
    @Size(max = 500)
    private String description;
    
    private Long parentId; // Reference to parent category ID
    
    private Integer productCount;
    
    private CategoryStatus status;
    
    private Integer displayOrder;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    public enum CategoryStatus {
        ACTIVE, INACTIVE
    }
}
