package gateway.service;

import java.util.Collections;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class GoogleOAuthService {
    private static final Logger log = LoggerFactory.getLogger(GoogleOAuthService.class);
    
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;
    
    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;
    
    private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";
    private static final String GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    public GoogleOAuthService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Verify Google ID Token and get user profile information from Google
     * 
     * @param idToken Google ID Token from client
     * @return Mono containing user profile data (email, name, profile picture)
     */
    public Mono<GoogleUserProfile> verifyAndGetProfile(String idToken) {
        log.info("Verifying Google ID token");
        
        return Mono.fromCallable(() -> {
                    // Call Google tokeninfo endpoint to verify and decode the token
                    String url = GOOGLE_TOKEN_INFO_URL + "?id_token=" + idToken;
                    
                    try {
                        String response = restTemplate.getForObject(url, String.class);
                        JsonNode jsonNode = objectMapper.readTree(response);
                        
                        // Verify the token
                        if (jsonNode.has("error")) {
                            log.error("Google token verification failed: {}", jsonNode.get("error").asText());
                            throw new IllegalArgumentException("Invalid Google ID token: " + jsonNode.get("error").asText());
                        }
                        
                        // Verify client ID
                        String tokenClientId = jsonNode.get("aud").asText();
                        if (!tokenClientId.equals(googleClientId)) {
                            log.error("Client ID mismatch. Expected: {}, Got: {}", googleClientId, tokenClientId);
                            throw new IllegalArgumentException("Client ID mismatch");
                        }
                        
                        // Extract user information from token
                        String email = jsonNode.get("email").asText();
                        String name = jsonNode.has("name") ? jsonNode.get("name").asText() : "";
                        String picture = jsonNode.has("picture") ? jsonNode.get("picture").asText() : "";
                        boolean emailVerified = jsonNode.has("email_verified") ? jsonNode.get("email_verified").asBoolean() : false;
                        
                        log.info("Google token verified successfully for email: {}", email);
                        
                        return new GoogleUserProfile(email, name, picture, emailVerified);
                        
                    } catch (Exception e) {
                        log.error("Error verifying Google token: {}", e.getMessage());
                        throw new RuntimeException("Google token verification failed: " + e.getMessage(), e);
                    }
                })
                .subscribeOn(Schedulers.boundedElastic())
                .onErrorMap(e -> {
                    log.error("Google OAuth verification failed: {}", e.getMessage());
                    return new RuntimeException("Google OAuth verification failed: " + e.getMessage(), e);
                });
    }
    
    /**
     * Get user profile from Google using access token
     * Alternative method using access token instead of ID token
     * 
     * @param accessToken Google access token
     * @return Mono containing user profile data
     */
    public Mono<GoogleUserProfile> getUserProfileWithAccessToken(String accessToken) {
        log.info("Getting user profile from Google using access token");
        
        return Mono.fromCallable(() -> {
                    String url = GOOGLE_USERINFO_URL + "?access_token=" + accessToken;
                    
                    try {
                        String response = restTemplate.getForObject(url, String.class);
                        JsonNode jsonNode = objectMapper.readTree(response);
                        
                        if (jsonNode.has("error")) {
                            log.error("Failed to get user profile: {}", jsonNode.get("error").asText());
                            throw new IllegalArgumentException("Failed to get user profile");
                        }
                        
                        String email = jsonNode.get("email").asText();
                        String name = jsonNode.has("name") ? jsonNode.get("name").asText() : "";
                        String picture = jsonNode.has("picture") ? jsonNode.get("picture").asText() : "";
                        
                        log.info("User profile retrieved successfully: {}", email);
                        
                        return new GoogleUserProfile(email, name, picture, true);
                        
                    } catch (Exception e) {
                        log.error("Error getting user profile: {}", e.getMessage());
                        throw new RuntimeException("Failed to get user profile: " + e.getMessage(), e);
                    }
                })
                .subscribeOn(Schedulers.boundedElastic())
                .onErrorMap(e -> {
                    log.error("Google profile retrieval failed: {}", e.getMessage());
                    return new RuntimeException("Google profile retrieval failed: " + e.getMessage(), e);
                });
    }
    
    /**
     * Data class for Google user profile
     */
    public static class GoogleUserProfile {
        private final String email;
        private final String name;
        private final String profilePicture;
        private final boolean emailVerified;
        
        public GoogleUserProfile(String email, String name, String profilePicture, boolean emailVerified) {
            this.email = email;
            this.name = name;
            this.profilePicture = profilePicture;
            this.emailVerified = emailVerified;
        }
        
        public String getEmail() {
            return email;
        }
        
        public String getName() {
            return name;
        }
        
        public String getProfilePicture() {
            return profilePicture;
        }
        
        public boolean isEmailVerified() {
            return emailVerified;
        }
    }
}
