package user.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.auction.utils.JwtUtils;
import com.auction.config.ConfigConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * Security configuration for JWT token management and password encoding.
 *
 * Configures:
 * - JWT token generation and validation
 * - Access token expiration time
 * - Refresh token expiration time
 * - Password encryption using BCrypt
 *
 * Required properties:
 * - jwt.secret: Secret key for signing JWT tokens (must be at least 32 characters)
 *
 * Optional properties:
 * - jwt.access-token-expiration-ms: Access token expiration in milliseconds (default: 15 minutes)
 * - jwt.refresh-token-expiration-ms: Refresh token expiration in milliseconds (default: 7 days)
 *
 * Example application.yml configuration:
 * ```
 * jwt:
 *   secret: ${JWT_SECRET:your-secret-key-min-32-chars-long-very-secure}
 *   access-token-expiration-ms: 900000     # 15 minutes
 *   refresh-token-expiration-ms: 604800000 # 7 days
 * ```
 *
 * Security notes:
 * - JWT secret MUST be stored securely (use environment variables)
 * - Never commit secrets to version control
 * - Use strong, random secrets in production
 * - Rotate secrets periodically
 */
@Configuration
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Value("${jwt.secret}")
    @NotBlank(message = "JWT secret must not be blank")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration-ms:" + ConfigConstants.Jwt.DEFAULT_ACCESS_TOKEN_EXPIRATION_MS + "}")
    @Positive(message = "Access token expiration must be positive")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-token-expiration-ms:" + ConfigConstants.Jwt.DEFAULT_REFRESH_TOKEN_EXPIRATION_MS + "}")
    @Positive(message = "Refresh token expiration must be positive")
    private long refreshTokenExpirationMs;

    /**
     * Creates a BCryptPasswordEncoder bean for secure password hashing.
     *
     * BCrypt automatically handles salt generation and is resistant to rainbow table attacks.
     * Strength is set to 10 (default), which provides good security with reasonable performance.
     *
     * @return Configured BCryptPasswordEncoder
     */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        log.debug("Initializing BCryptPasswordEncoder with strength 10");
        return new BCryptPasswordEncoder();
    }

    /**
     * Creates a JwtUtils bean for JWT token operations.
     *
     * Handles:
     * - JWT token generation with specified expiration times
     * - Token validation and claims extraction
     * - Refresh token generation
     *
     * Token expiration values:
     * - Access token: {} ms ({} minutes)
     * - Refresh token: {} ms ({} days)
     *
     * @return Configured JwtUtils instance
     */
    @Bean
    public JwtUtils jwtUtils() {
        log.info("Initializing JwtUtils with access token expiration: {} ms, refresh token expiration: {} ms",
            accessTokenExpirationMs, refreshTokenExpirationMs);

        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalArgumentException("JWT secret must be configured");
        }

        if (jwtSecret.length() < 32) {
            log.warn("JWT secret is less than 32 characters, which may not be secure enough for production");
        }

        return new JwtUtils(jwtSecret, accessTokenExpirationMs, refreshTokenExpirationMs);
    }
}
