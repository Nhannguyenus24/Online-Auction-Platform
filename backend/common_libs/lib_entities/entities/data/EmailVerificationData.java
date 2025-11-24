package entities.data;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailVerificationData {
    
    private Long id;
    
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 6, max = 6)
    private String otp;
    
    private VerificationType verificationType;
    
    private Boolean isVerified;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime expiresAt;
    
    private LocalDateTime verifiedAt;
    
    public enum VerificationType {
        REGISTRATION, PASSWORD_RESET
    }
}
