package gateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Decoder Configuration for Web MVC
 */
@Configuration
public class JwtDecoderConfig {

    @Value("${jwt.secret:superSecretKeyThatIsAtLeast256BitsLongForHS256AlgorithmPleaseMakeSureItIsLongEnough}")
    private String jwtSecret;

    @Bean
    public JwtDecoder jwtDecoder() {
        return token -> {
            try {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                Claims claims = Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                Instant issuedAt = claims.getIssuedAt() != null ? claims.getIssuedAt().toInstant() : Instant.now();
                Instant expiresAt = claims.getExpiration() != null ? claims.getExpiration().toInstant() : Instant.now().plusSeconds(3600);

                Map<String, Object> headers = new HashMap<>();
                headers.put("alg", "HS256");
                headers.put("typ", "JWT");

                Map<String, Object> claimsMap = new HashMap<>(claims);

                return new Jwt(token, issuedAt, expiresAt, headers, claimsMap);

            } catch (Exception e) {
                throw new JwtException("Invalid JWT token: " + e.getMessage(), e);
            }
        };
    }

    /**
     * Generate mock JWT token for testing
     */
    public String generateMockToken(String userId, String role, String email) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + 3600000); // 1 hour

        return Jwts.builder()
                .subject(userId)
                .claim("role", role)
                .claim("email", email)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    /**
     * Validate if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            return claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Extract user ID from token
     */
    public String getUserIdFromToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            return claims.get("userId", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Extract role from token
     */
    public String getRoleFromToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            return claims.get("role", String.class);
        } catch (Exception e) {
            return null;
        }
    }
}
