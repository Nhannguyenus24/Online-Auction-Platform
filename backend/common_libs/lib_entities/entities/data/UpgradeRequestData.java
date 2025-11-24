package entities.data;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpgradeRequestData {
    
    private Long id;
    
    private Long bidderId;
    
    @Size(max = 1000)
    private String reason;
    
    private RequestStatus status;
    
    private Long reviewedBy;
    
    private String reviewNotes;
    
    private LocalDateTime requestedAt;
    
    private LocalDateTime reviewedAt;
    
    public enum RequestStatus {
        PENDING, APPROVED, REJECTED
    }
}
