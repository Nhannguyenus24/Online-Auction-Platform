package entities.data;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RatingData {
    
    private Long id;
    
    private Long orderId;
    
    private Long raterId; // Who gives the rating
    
    private Long ratedId; // Who receives the rating
    
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;
    
    @Size(max = 1000)
    private String comment;
    
    private LocalDateTime createdAt;
}
