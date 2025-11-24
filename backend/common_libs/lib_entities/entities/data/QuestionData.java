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
public class QuestionData {
    
    private Long id;
    
    private Long productId;
    
    private Long bidderId;
    
    @NotBlank(message = "Question is required")
    @Size(max = 1000)
    private String question;
    
    @Size(max = 1000)
    private String answer;
    
    private Boolean isAnswered;
    
    private LocalDateTime askedAt;
    
    private LocalDateTime answeredAt;
}
