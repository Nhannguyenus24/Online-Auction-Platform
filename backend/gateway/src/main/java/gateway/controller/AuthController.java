package gateway.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.auction.proto.auth.*;
import gateway.grpc.UserGrpcClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication endpoints - calls user service via gRPC")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final UserGrpcClient userGrpcClient;
    public AuthController(UserGrpcClient userGrpcClient) {
        this.userGrpcClient = userGrpcClient;
    }
    private static final int REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Register a new user account. Returns OTP for email verification.")
    public Mono<ResponseEntity<Map<String, Object>>> register(@RequestBody com.auction.entities.dto.RegisterRequest request) {
        log.info("Register request for email: {}", request.getEmail());
        
        // Validate reCAPTCHA token
        if (request.getRecaptchaToken() == null || request.getRecaptchaToken().trim().isEmpty()) {
            log.warn("Register request rejected: reCAPTCHA token is missing");
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "reCAPTCHA verification is required");
            return Mono.just(ResponseEntity.badRequest().body(error));
        }
        
        // TODO: Add reCAPTCHA verification with Google API
        // For now, we just check that the token exists
        log.info("reCAPTCHA token received: {}", request.getRecaptchaToken().substring(0, Math.min(20, request.getRecaptchaToken().length())) + "...");
        
        RegisterRequest grpcRequest = RegisterRequest.newBuilder()
                .setEmail(request.getEmail())
                .setPassword(request.getPassword())
                .setFullName(request.getFullName())
                .setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "")
                .setAddress(request.getAddress() != null ? request.getAddress() : "")
                .build();

        return userGrpcClient.register(grpcRequest)
                .map(response -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", response.getSuccess());
                    result.put("message", response.getMessage());
                    result.put("email", response.getEmail());
                    result.put("userId", response.getUserId());
                    result.put("otp", response.getOtp());
                    result.put("otpExpiryMinutes", 10);
                    
                    if (response.getSuccess()) {
                        return ResponseEntity.ok(result);
                    } else {
                        return ResponseEntity.badRequest().body(result);
                    }
                })
                .onErrorResume(e -> {
                    log.error("Register error: {}", e.getMessage(), e);
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "Registration failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error));
                });
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Login with email and password. Returns access token and sets refresh token in httpOnly cookie.")
    public Mono<ResponseEntity<Map<String, Object>>> login(
            @RequestBody com.auction.entities.dto.LoginRequest request,
            HttpServletResponse response) {
        log.info("Login request for email: {}", request.getEmail());
        
        LoginRequest grpcRequest = LoginRequest.newBuilder()
                .setEmail(request.getEmail())
                .setPassword(request.getPassword())
                .build();

        return userGrpcClient.login(grpcRequest)
                .map(loginResponse -> {
                    // Set refresh token in httpOnly cookie
                    Cookie refreshTokenCookie = new Cookie("refreshToken", loginResponse.getRefreshToken());
                    refreshTokenCookie.setHttpOnly(true);
                    refreshTokenCookie.setSecure(false); // Set to true in production with HTTPS
                    refreshTokenCookie.setPath("/");
                    refreshTokenCookie.setMaxAge(REFRESH_TOKEN_MAX_AGE);
                    response.addCookie(refreshTokenCookie);

                    // Return access token and user info
                    Map<String, Object> result = new HashMap<>();
                    result.put("accessToken", loginResponse.getAccessToken());
                    
                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", loginResponse.getUserInfo().getId());
                    userInfo.put("email", loginResponse.getUserInfo().getEmail());
                    userInfo.put("fullName", loginResponse.getUserInfo().getFullName());
                    userInfo.put("roles", loginResponse.getUserInfo().getRolesList());
                    result.put("user", userInfo);
                    
                    log.info("Login successful for user: {}", request.getEmail());
                    return ResponseEntity.ok(result);
                })
                .onErrorResume(e -> {
                    log.error("Login error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("message", "Login failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error));
                });
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Get new access token using refresh token from cookie. Returns new tokens.")
    public Mono<ResponseEntity<Map<String, Object>>> refreshToken(
            HttpServletRequest request,
            HttpServletResponse response) {
        
        // Get refresh token from cookie
        String refreshToken = getRefreshTokenFromCookie(request);
        
        if (refreshToken == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "Refresh token not found");
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error));
        }

        log.info("Refresh token request");
        
        RefreshTokenRequest grpcRequest = RefreshTokenRequest.newBuilder()
                .setRefreshToken(refreshToken)
                .build();

        return userGrpcClient.refreshToken(grpcRequest)
                .map(refreshResponse -> {
                    // Set new refresh token in cookie (rotation)
                    Cookie newRefreshTokenCookie = new Cookie("refreshToken", refreshResponse.getRefreshToken());
                    newRefreshTokenCookie.setHttpOnly(true);
                    newRefreshTokenCookie.setSecure(false);
                    newRefreshTokenCookie.setPath("/");
                    newRefreshTokenCookie.setMaxAge(REFRESH_TOKEN_MAX_AGE);
                    response.addCookie(newRefreshTokenCookie);

                    Map<String, Object> result = new HashMap<>();
                    result.put("accessToken", refreshResponse.getAccessToken());
                    result.put("expiresIn", refreshResponse.getAccessTokenExpiresIn());
                    
                    log.info("Token refreshed successfully");
                    return ResponseEntity.ok(result);
                })
                .onErrorResume(e -> {
                    log.error("Refresh token error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("message", "Token refresh failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error));
                });
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Logout user and clear refresh token cookie.")
    public Mono<ResponseEntity<Map<String, Object>>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        
        String refreshToken = getRefreshTokenFromCookie(request);
        
        log.info("Logout request");
        
        // Get user ID from authentication if available
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null && authentication.getName() != null ? authentication.getName() : "";
        
        LogoutRequest grpcRequest = LogoutRequest.newBuilder()
                .setRefreshToken(refreshToken != null ? refreshToken : "")
                .setUserId(userId)
                .build();

        return userGrpcClient.logout(grpcRequest)
                .map(logoutResponse -> {
                    // Clear refresh token cookie
                    Cookie clearCookie = new Cookie("refreshToken", null);
                    clearCookie.setHttpOnly(true);
                    clearCookie.setPath("/");
                    clearCookie.setMaxAge(0);
                    response.addCookie(clearCookie);

                    Map<String, Object> result = new HashMap<>();
                    result.put("success", true);
                    result.put("message", "Logged out successfully");
                    
                    log.info("Logout successful");
                    return ResponseEntity.ok(result);
                })
                .onErrorResume(e -> {
                    log.error("Logout error: {}", e.getMessage());
                    
                    // Clear cookie anyway
                    Cookie clearCookie = new Cookie("refreshToken", null);
                    clearCookie.setHttpOnly(true);
                    clearCookie.setPath("/");
                    clearCookie.setMaxAge(0);
                    response.addCookie(clearCookie);
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", true);
                    result.put("message", "Logged out");
                    return Mono.just(ResponseEntity.ok(result));
                });
    }

    @PostMapping("/reproduce-otp")
    @Operation(summary = "Reproduce OTP", description = "Reproduce  OTP sent after registration.")
    public Mono<ResponseEntity<Map<String, Object>>> reproduceOTP(@RequestBody com.auction.entities.dto.ReproduceOTPRequest request){
        log.info("Reproduce OTP request for user: {}", request.getEmail());

        ReproduceOTPRequest grpcRequest = ReproduceOTPRequest.newBuilder()
                .setEmail(request.getEmail())
                .build();

        return userGrpcClient.reproduceOTP(grpcRequest)
                .map(response -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", response.getSuccess());
                    result.put("message", response.getMessage());
                    if (response.getSuccess()) {
                        log.info("OTP reproduce successful for user: {}", request.getEmail());
                        return ResponseEntity.ok(result);
                    } else {
                        return ResponseEntity.badRequest().body(result);
                    }
                })
                .onErrorResume(e -> {
                    log.error("OTP reproduce error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "OTP reproduce failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.badRequest().body(error));
                });
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP", description = "Verify user email with OTP sent during registration.")
    public Mono<ResponseEntity<Map<String, Object>>> verifyOTP(@RequestBody com.auction.entities.dto.VerifyOTPRequest request) {
        
        log.info("OTP verification request for user: {}", request.getEmail());
        
        VerifyOTPRequest grpcRequest = VerifyOTPRequest.newBuilder()
                .setEmail(String.valueOf(request.getEmail()))
                .setOtp(request.getOtp())
                .build();

        return userGrpcClient.verifyOTP(grpcRequest)
                .map(verifyResponse -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", verifyResponse.getSuccess());
                    result.put("message", verifyResponse.getMessage());
                    
                    if (verifyResponse.getSuccess()) {
                        log.info("OTP verification successful for user: {}", request.getEmail());
                        return ResponseEntity.ok(result);
                    } else {
                        return ResponseEntity.badRequest().body(result);
                    }
                })
                .onErrorResume(e -> {
                    log.error("OTP verification error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "OTP verification failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.badRequest().body(error));
                });
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password", description = "Change user password. Requires authentication.")
    public Mono<ResponseEntity<Map<String, Object>>> changePassword(@RequestBody com.auction.entities.dto.ChangePasswordRequest request) {
        
        // Get user ID from security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        
        log.info("Change password request for user: {}", userId);
        
        ChangePasswordRequest grpcRequest = ChangePasswordRequest.newBuilder()
                .setUserId(userId)
                .setOldPassword(request.getOldPassword())
                .setNewPassword(request.getNewPassword())
                .build();

        return userGrpcClient.changePassword(grpcRequest)
                .map(changeResponse -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", changeResponse.getSuccess());
                    result.put("message", changeResponse.getMessage());
                    
                    if (changeResponse.getSuccess()) {
                        return ResponseEntity.ok(result);
                    } else {
                        return ResponseEntity.badRequest().body(result);
                    }
                })
                .onErrorResume(e -> {
                    log.error("Change password error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "Password change failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.badRequest().body(error));
                });
    }

    @GetMapping("/validate")
    @Operation(summary = "Validate token", description = "Validate JWT access token. For internal use by Gateway.")
    public Mono<ResponseEntity<Map<String, Object>>> validateToken(
            @Parameter(description = "Access token to validate") @RequestParam String token) {
        
        ValidateTokenRequest grpcRequest = ValidateTokenRequest.newBuilder()
                .setAccessToken(token)
                .build();

        return userGrpcClient.validateToken(grpcRequest)
                .map(validateResponse -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("valid", validateResponse.getIsValid());
                    
                    if (validateResponse.getIsValid()) {
                        result.put("userId", validateResponse.getUserId());
                        result.put("roles", validateResponse.getRolesList());
                    } else {
                        result.put("error", validateResponse.getErrorMessage());
                    }
                    
                    return ResponseEntity.ok(result);
                })
                .onErrorResume(e -> {
                    Map<String, Object> error = new HashMap<>();
                    error.put("valid", false);
                    error.put("error", e.getMessage());
                    return Mono.just(ResponseEntity.ok(error));
                });
    }

    @GetMapping("/profile")
    @Operation(summary = "Get user profile", description = "Get authenticated user's profile information. Requires authentication.")
    public Mono<ResponseEntity<Map<String, Object>>> getProfile() {
        
        // Get user ID from security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        
        log.info("Get profile request for user: {}", userId);
        
        GetProfileRequest grpcRequest = GetProfileRequest.newBuilder()
                .setUserId(userId)
                .build();

        return userGrpcClient.getProfile(grpcRequest)
                .map(profileResponse -> {
                    Map<String, Object> result = new HashMap<>();
                    
                    if (profileResponse.getUserId() != null && !profileResponse.getUserId().isEmpty()) {
                        Map<String, Object> profile = new HashMap<>();
                        profile.put("userId", profileResponse.getUserId());
                        profile.put("email", profileResponse.getEmail());
                        profile.put("fullName", profileResponse.getFullName());
                        profile.put("phoneNumber", profileResponse.getPhoneNumber());
                        profile.put("address", profileResponse.getAddress());
                        profile.put("roles", profileResponse.getRolesList());
                        profile.put("isVerified", profileResponse.getIsVerified());
                        profile.put("createdAt", profileResponse.getCreatedAt());
                        result.put("profile", profile);
                        result.put("message", profileResponse.getMessage());
                        
                        log.info("Profile retrieved successfully for user: {}", userId);
                        return ResponseEntity.ok(result);
                    } else {
                        result.put("message", profileResponse.getMessage());
                        return ResponseEntity.badRequest().body(result);
                    }
                })
                .onErrorResume(e -> {
                    log.error("Get profile error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("message", "Get profile failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error));
                });
    }

    @PostMapping("/profile")
    @Operation(summary = "Update user profile", description = "Update authenticated user's profile information. Requires authentication.")
    public Mono<ResponseEntity<Map<String, Object>>> updateProfile(
            @RequestBody com.auction.entities.dto.UpdateProfileRequest request) {
        
        // Get user ID from security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        
        log.info("Update profile request for user: {}", userId);
        
        UpdateProfileRequest grpcRequest = UpdateProfileRequest.newBuilder()
                .setUserId(userId)
                .setFullName(request.getFullName() != null ? request.getFullName() : "")
                .setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "")
                .setAddress(request.getAddress() != null ? request.getAddress() : "")
                .build();

        return userGrpcClient.updateProfile(grpcRequest)
                .map(updateResponse -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", updateResponse.getSuccess());
                    result.put("message", updateResponse.getMessage());
                    
                    if (updateResponse.getSuccess() && updateResponse.hasUpdatedProfile()) {
                        GetProfileResponse profile = updateResponse.getUpdatedProfile();
                        Map<String, Object> profileData = new HashMap<>();
                        profileData.put("userId", profile.getUserId());
                        profileData.put("email", profile.getEmail());
                        profileData.put("fullName", profile.getFullName());
                        profileData.put("phoneNumber", profile.getPhoneNumber());
                        profileData.put("address", profile.getAddress());
                        profileData.put("roles", profile.getRolesList());
                        profileData.put("isVerified", profile.getIsVerified());
                        profileData.put("createdAt", profile.getCreatedAt());
                        result.put("profile", profileData);
                        
                        log.info("Profile updated successfully for user: {}", userId);
                        return ResponseEntity.ok(result);
                    } else {
                        return ResponseEntity.badRequest().body(result);
                    }
                })
                .onErrorResume(e -> {
                    log.error("Update profile error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "Update profile failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error));
                });
    }

    @PostMapping("/google")
    @Operation(summary = "Login with Google", description = "Login or register with Google OAuth. Returns access token and sets refresh token in httpOnly cookie.")
    public Mono<ResponseEntity<Map<String, Object>>> loginWithGoogle(
            @RequestBody com.auction.entities.dto.LoginWithGoogleRequest request,
            HttpServletResponse response) {
        
        log.info("Google login request for email: {}", request.getEmail());
        
        LoginWithGoogleRequest grpcRequest = LoginWithGoogleRequest.newBuilder()
                .setGoogleIdToken(request.getGoogleIdToken() != null ? request.getGoogleIdToken() : "")
                .setEmail(request.getEmail())
                .setFullName(request.getFullName() != null ? request.getFullName() : "")
                .setProfilePicture(request.getProfilePicture() != null ? request.getProfilePicture() : "")
                .build();

        return userGrpcClient.loginWithGoogle(grpcRequest)
                .map(loginResponse -> {
                    // Set refresh token in httpOnly cookie
                    Cookie refreshTokenCookie = new Cookie("refreshToken", loginResponse.getRefreshToken());
                    refreshTokenCookie.setHttpOnly(true);
                    refreshTokenCookie.setSecure(false); // Set to true in production with HTTPS
                    refreshTokenCookie.setPath("/");
                    refreshTokenCookie.setMaxAge(REFRESH_TOKEN_MAX_AGE);
                    response.addCookie(refreshTokenCookie);

                    // Return access token and user info
                    Map<String, Object> result = new HashMap<>();
                    result.put("accessToken", loginResponse.getAccessToken());
                    
                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", loginResponse.getUserInfo().getId());
                    userInfo.put("email", loginResponse.getUserInfo().getEmail());
                    userInfo.put("fullName", loginResponse.getUserInfo().getFullName());
                    userInfo.put("roles", loginResponse.getUserInfo().getRolesList());
                    result.put("user", userInfo);
                    
                    log.info("Google login successful for user: {}", request.getEmail());
                    return ResponseEntity.ok(result);
                })
                .onErrorResume(e -> {
                    log.error("Google login error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("message", "Google login failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error));
                });
    }

    private String getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            Optional<Cookie> refreshTokenCookie = Arrays.stream(request.getCookies())
                    .filter(cookie -> "refreshToken".equals(cookie.getName()))
                    .findFirst();
            
            return refreshTokenCookie.map(Cookie::getValue).orElse(null);
        }
        return null;
    }
}
