package user.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Table("users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private Integer id;
    private String email;
    private String passwordHash;
    private String fullName;
    private String role;
    private String phone;
    private String address;
    private Boolean isEmailVerified = false;
    private Boolean otpVerified = false;
    private Integer positiveReviews = 0;
    private Integer negativeReviews = 0;
    private BigDecimal ratingPercent = BigDecimal.ZERO;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
