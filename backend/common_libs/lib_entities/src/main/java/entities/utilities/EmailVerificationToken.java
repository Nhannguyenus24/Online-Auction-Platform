package entities.utilities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailVerificationToken {
    private Integer id;
    private String token;
    private Integer userId;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
