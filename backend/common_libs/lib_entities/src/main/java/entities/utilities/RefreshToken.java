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
public class RefreshToken {
    private Integer id;
    private Integer userId;
    private String token;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
