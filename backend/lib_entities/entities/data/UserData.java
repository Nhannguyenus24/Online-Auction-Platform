package entities.data;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserData {
    
    private Long id;
    
    @NotBlank(message = "Full name is required")
    @Size(max = 100)
    private String fullName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8)
    private String password;
    
    @Size(max = 255)
    private String address;
    
    @Size(max = 20)
    private String phone;
    
    private String avatarUrl;
    
    private UserRole role;
    
    private UserStatus status;
    
    private Boolean emailVerified;
    
    private String oauthProvider; // Google, Facebook, GitHub, Twitter
    
    private String oauthId;
    
    private Double ratingScore;
    
    private Integer ratingCount;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private LocalDateTime lastLoginAt;
    
    public enum UserRole {
        BIDDER, SELLER, ADMIN
    }
    
    public enum UserStatus {
        ACTIVE, INACTIVE, SUSPENDED, PENDING
    }
}
