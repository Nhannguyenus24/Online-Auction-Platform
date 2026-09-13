package com.auction.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.nimbusds.jwt.JWTClaimsSet;
import java.time.Duration;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("JwtUtils")
class JwtUtilsTest {

    // HS256 needs at least 256 bits of key material.
    private static final String SECRET = "test-secret-key-minimum-32-characters-long";
    private static final long ACCESS_TTL_MS = Duration.ofMinutes(15).toMillis();
    private static final long REFRESH_TTL_MS = Duration.ofDays(7).toMillis();

    private final JwtUtils jwtUtils = new JwtUtils(SECRET, ACCESS_TTL_MS, REFRESH_TTL_MS);

    @Test
    @DisplayName("an access token round-trips the user id, email and role")
    void accessTokenRoundTrip() {
        String token = jwtUtils.generateAccessToken(42, "user@example.com", "bidder");

        assertEquals(42, jwtUtils.getUserIdFromToken(token));
        assertEquals("user@example.com", jwtUtils.getEmailFromToken(token));
        assertEquals("bidder", jwtUtils.getRoleFromToken(token));
        assertFalse(jwtUtils.isTokenExpired(token));
    }

    @Test
    @DisplayName("the access token expiry follows the configured lifetime")
    void accessTokenCarriesTheConfiguredExpiry() {
        JWTClaimsSet claims = jwtUtils.validateToken(jwtUtils.generateAccessToken(1, "a@b.co", "admin"));

        long lifetimeMs = claims.getExpirationTime().getTime() - claims.getIssueTime().getTime();
        assertEquals(ACCESS_TTL_MS, lifetimeMs);
    }

    @Test
    @DisplayName("a refresh token identifies the user")
    void refreshTokenIdentifiesTheUser() {
        String token = jwtUtils.generateRefreshToken(7);

        assertEquals("7", jwtUtils.validateToken(token).getSubject());
    }

    @Test
    @DisplayName("a token signed with another secret is rejected")
    void rejectsTokenSignedWithAnotherSecret() {
        JwtUtils other = new JwtUtils("another-secret-key-at-least-32-characters", ACCESS_TTL_MS, REFRESH_TTL_MS);
        String foreignToken = other.generateAccessToken(1, "a@b.co", "admin");

        assertThrows(RuntimeException.class, () -> jwtUtils.validateToken(foreignToken));
        assertTrue(jwtUtils.isTokenExpired(foreignToken), "an unverifiable token must not look valid");
    }

    @Test
    @DisplayName("a tampered token is rejected")
    void rejectsTamperedToken() {
        String token = jwtUtils.generateAccessToken(42, "user@example.com", "bidder");
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "not-the-signature";

        assertThrows(RuntimeException.class, () -> jwtUtils.validateToken(tampered));
    }

    @Test
    @DisplayName("garbage is rejected rather than parsed")
    void rejectsGarbage() {
        assertThrows(RuntimeException.class, () -> jwtUtils.validateToken("not-a-jwt"));
        assertTrue(jwtUtils.isTokenExpired("not-a-jwt"));
    }

    @Test
    @DisplayName("an already expired token is reported as expired")
    void reportsExpiredToken() {
        JwtUtils shortLived = new JwtUtils(SECRET, -1_000L, REFRESH_TTL_MS);
        String expired = shortLived.generateAccessToken(42, "user@example.com", "bidder");

        assertThrows(RuntimeException.class, () -> shortLived.validateToken(expired));
        assertTrue(shortLived.isTokenExpired(expired));
    }

    @Test
    @DisplayName("access and refresh tokens are distinct")
    void accessAndRefreshTokensDiffer() {
        assertNotEquals(jwtUtils.generateAccessToken(1, "a@b.co", "admin"), jwtUtils.generateRefreshToken(1));
    }
}
