package gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import com.nimbusds.jwt.JWTClaimsSet;
import com.auction.utils.JwtUtils;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Decoder Configuration using JwtUtils from lib_utils
 * Ensures consistency across all services
 */
@Configuration
public class JwtDecoderConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    @Bean
    public JwtUtils jwtUtils() {
        return new JwtUtils(jwtSecret, accessTokenExpirationMs, refreshTokenExpirationMs);
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        JwtUtils jwtUtils = jwtUtils();
        
        return token -> {
            try {
                // Validate token using JwtUtils
                JWTClaimsSet claims = jwtUtils.validateToken(token);

                Instant issuedAt = claims.getIssueTime() != null ? 
                    claims.getIssueTime().toInstant() : Instant.now();
                Instant expiresAt = claims.getExpirationTime() != null ? 
                    claims.getExpirationTime().toInstant() : Instant.now().plusSeconds(3600);

                Map<String, Object> headers = new HashMap<>();
                headers.put("alg", "HS256");
                headers.put("typ", "JWT");

                Map<String, Object> claimsMap = new HashMap<>(claims.getClaims());

                return new Jwt(token, issuedAt, expiresAt, headers, claimsMap);

            } catch (Exception e) {
                throw new JwtException("JWT validation failed: " + e.getMessage(), e);
            }
        };
    }
}
