package user.util;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.text.ParseException;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    /**
     * Generate access token (15 minutes)
     */
    public String generateAccessToken(Integer userId, String email, String role) {
        try {
            Instant now = Instant.now();
            Instant expiryDate = now.plusMillis(accessTokenExpirationMs);

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(String.valueOf(userId))
                    .claim("email", email)
                    .claim("role", role)
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(expiryDate))
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256),
                    claimsSet
            );

            JWSSigner signer = new MACSigner(jwtSecret.getBytes());
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Error generating access token", e);
        }
    }

    /**
     * Generate refresh token (7 days)
     */
    public String generateRefreshToken(Integer userId) {
        try {
            Instant now = Instant.now();
            Instant expiryDate = now.plusMillis(refreshTokenExpirationMs);

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(String.valueOf(userId))
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(expiryDate))
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256),
                    claimsSet
            );

            JWSSigner signer = new MACSigner(jwtSecret.getBytes());
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Error generating refresh token", e);
        }
    }

    /**
     * Generate email verification token (24 hours)
     */
    public String generateEmailVerificationToken(Integer userId) {
        try {
            Instant now = Instant.now();
            Instant expiryDate = now.plusMillis(24 * 60 * 60 * 1000L); // 24 hours

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(String.valueOf(userId))
                    .claim("type", "email_verification")
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(expiryDate))
                    .build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256),
                    claimsSet
            );

            JWSSigner signer = new MACSigner(jwtSecret.getBytes());
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Error generating email verification token", e);
        }
    }

    /**
     * Validate and parse JWT token
     */
    public JWTClaimsSet validateToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier verifier = new MACVerifier(jwtSecret.getBytes());

            if (!signedJWT.verify(verifier)) {
                throw new RuntimeException("Invalid token signature");
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

            // Check expiration
            Date expirationTime = claims.getExpirationTime();
            if (expirationTime != null && expirationTime.before(new Date())) {
                throw new RuntimeException("Token has expired");
            }

            return claims;
        } catch (ParseException | JOSEException e) {
            throw new RuntimeException("Error validating token", e);
        }
    }

    /**
     * Get user ID from token
     */
    public Integer getUserIdFromToken(String token) {
        JWTClaimsSet claims = validateToken(token);
        return Integer.valueOf(claims.getSubject());
    }

    /**
     * Get email from token
     */
    public String getEmailFromToken(String token) {
        JWTClaimsSet claims = validateToken(token);
        return (String) claims.getClaim("email");
    }

    /**
     * Get role from token
     */
    public String getRoleFromToken(String token) {
        JWTClaimsSet claims = validateToken(token);
        return (String) claims.getClaim("role");
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            JWTClaimsSet claims = validateToken(token);
            Date expirationTime = claims.getExpirationTime();
            return expirationTime != null && expirationTime.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
}
