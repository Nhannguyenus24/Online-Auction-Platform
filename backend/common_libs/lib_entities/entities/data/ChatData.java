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
public class ChatData {
    
    private Long id;
    
    private Long orderId;
    
    private Long senderId;
    
    private Long receiverId;
    
    @NotBlank(message = "Message is required")
    @Size(max = 2000)
    private String message;
    
    private Boolean isRead;
    
    private LocalDateTime sentAt;
    
    private LocalDateTime readAt;
}
