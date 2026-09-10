package gateway.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import com.auction.proto.auth.*;
import com.auction.proto.rating.*;

import gateway.grpc.UserGrpcClient;
import gateway.grpc.RatingGrpcClient;
import gateway.service.GoogleOAuthService;
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
    private final RatingGrpcClient ratingGrpcClient;
    private final GoogleOAuthService googleOAuthService;
    
    public AuthController(UserGrpcClient userGrpcClient, RatingGrpcClient ratingGrpcClient, GoogleOAuthService googleOAuthService) {
        this.userGrpcClient = userGrpcClient;
        this.ratingGrpcClient = ratingGrpcClient;
        this.googleOAuthService = googleOAuthService;
    }
    private static final int REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

    private Mono<ResponseEntity<Map<String, Object>>> badRequestResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", message);
        return Mono.just(ResponseEntity.badRequest().body(error));
    }

    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    private boolean isValidPassword(String password) {
        // Min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
        return password != null && password.length() >= 8 && 
               password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$");
    }

    private boolean isValidOTP(String otp) {
        return otp != null && otp.matches("^\\d{6}$");
    }

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Register a new user account. Returns OTP for email verification.")
    public Mono<ResponseEntity<Map<String, Object>>> register(@Valid @RequestBody com.auction.entities.dto.RegisterRequest request) {
        log.info("Register request for email: {}", request.getEmail());
        
        // Validate email
        if (!isValidEmail(request.getEmail())) {
            log.error("Invalid email format: {}", request.getEmail());
            return badRequestResponse("Invalid email format");
        }

        // Validate password
        if (!isValidPassword(request.getPassword())) {
            log.error("Password does not meet requirements");
            return badRequestResponse("Password must be at least 8 characters with uppercase, lowercase, digit, and special character");
        }

        // Validate fullName
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            log.error("Full name is required");
            return badRequestResponse("Full name is required");
        }

        // Validate phoneNumber if provided
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty() && 
            !request.getPhoneNumber().matches("^[+]?[0-9]{10,15}$")) {
            log.error("Invalid phone number format: {}", request.getPhoneNumber());
            return badRequestResponse("Invalid phone number format");
        }
        
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
        
        // Validate email
        if (!isValidEmail(request.getEmail())) {
            log.error("Invalid email format: {}", request.getEmail());
            return badRequestResponse("Invalid email format");
        }

        // Validate password
        if (request.getPassword() == null || request.getPassword().isEmpty()) {
            log.error("Password is required");
            return badRequestResponse("Password is required");
        }
        
        LoginRequest grpcRequest = LoginRequest.newBuilder()
                .setEmail(request.getEmail())
                .setPassword(request.getPassword())
                .build();

        return userGrpcClient.login(grpcRequest)
                .map(loginResponse -> {
                    if (!loginResponse.getSuccess()) {
                        log.error("Login error: {}", loginResponse.getMessage());
                        Map<String, Object> error = new HashMap<>();
                        error.put("message", loginResponse.getMessage());
                        error.put("success", false);
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
                    }
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
                    result.put("success", true);
                    Map<String, Object> userInfo = new HashMap<>();
                    userInfo.put("id", loginResponse.getUserInfo().getId());
                    userInfo.put("email", loginResponse.getUserInfo().getEmail());
                    userInfo.put("fullName", loginResponse.getUserInfo().getFullName());
                    userInfo.put("role", loginResponse.getUserInfo().getRole());
                    result.put("user", userInfo);
                    
                    log.info("Login successful for user: {}", request.getEmail());
                    return ResponseEntity.ok(result);
                })
                .onErrorResume(e -> {
                    log.error("Login error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("message", "Login failed: " + e.getMessage());
                    error.put("success", false);
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
        
        log.info("Logout request");
        
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
        return Mono.just(ResponseEntity.ok(result));
    }

    @PostMapping("/reproduce-otp")
    @Operation(summary = "Reproduce OTP", description = "Reproduce  OTP sent after registration.")
    public Mono<ResponseEntity<Map<String, Object>>> reproduceOTP(@RequestBody com.auction.entities.dto.ReproduceOTPRequest request){
        log.info("Reproduce OTP request for user: {}", request.getEmail());

        // Validate email
        if (!isValidEmail(request.getEmail())) {
            log.error("Invalid email format: {}", request.getEmail());
            return badRequestResponse("Invalid email format");
        }

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
        
        // Validate email
        if (!isValidEmail(request.getEmail())) {
            log.error("Invalid email format: {}", request.getEmail());
            return badRequestResponse("Invalid email format");
        }

        // Validate OTP
        if (!isValidOTP(request.getOtp())) {
            log.error("Invalid OTP format: {}", request.getOtp());
            return badRequestResponse("OTP must be 6 digits");
        }
        
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
        
        // Validate oldPassword
        if (request.getOldPassword() == null || request.getOldPassword().isEmpty()) {
            log.error("Old password is required");
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "Old password is required")));
        }

        // Validate newPassword
        if (!isValidPassword(request.getNewPassword())) {
            log.error("New password does not meet requirements");
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "Password must be at least 8 characters with uppercase, lowercase, digit, and special character")));
        }

        // Check that old and new password are different
        if (request.getOldPassword().equals(request.getNewPassword())) {
            log.error("New password must be different from old password");
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "New password must be different from old password")));
        }
        
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
        
        // Validate token
        if (token == null || token.trim().isEmpty()) {
            log.error("Token is required");
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("valid", false, "error", "Token is required")));
        }
        
        ValidateTokenRequest grpcRequest = ValidateTokenRequest.newBuilder()
                .setAccessToken(token)
                .build();

        return userGrpcClient.validateToken(grpcRequest)
                .map(validateResponse -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("valid", validateResponse.getIsValid());
                    
                    if (validateResponse.getIsValid()) {
                        result.put("userId", validateResponse.getUserId());
                        result.put("role", validateResponse.getRole());
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

                    profileResponse.getUserId();
                    if (!profileResponse.getUserId().isEmpty()) {
                        Map<String, Object> profile = new HashMap<>();
                        profile.put("userId", profileResponse.getUserId());
                        profile.put("email", profileResponse.getEmail());
                        profile.put("fullName", profileResponse.getFullName());
                        profile.put("phoneNumber", profileResponse.getPhoneNumber());
                        profile.put("address", profileResponse.getAddress());
                        profile.put("role", profileResponse.getRole());
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

    @GetMapping("/profile/{userId}")
    @Operation(summary = "Get user profile by ID", description = "Get user profile information by user ID. Public endpoint - no authentication required.")
    public Mono<ResponseEntity<Map<String, Object>>> getProfileById(
            @Parameter(description = "User ID") @PathVariable String userId) {
        
        log.info("Get public profile request for user ID: {}", userId);
        
        // Validate userId
        if (userId == null || userId.trim().isEmpty()) {
            log.error("User ID is required");
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "User ID is required")));
        }

        // Validate userId is numeric
        try {
            Integer.parseInt(userId);
        } catch (NumberFormatException e) {
            log.error("Invalid user ID format: {}", userId);
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "Invalid user ID format")));
        }
        
        GetProfileRequest grpcRequest = GetProfileRequest.newBuilder()
                .setUserId(userId)
                .build();

        return userGrpcClient.getProfile(grpcRequest)
                .map(profileResponse -> {
                    Map<String, Object> result = new HashMap<>();

                    if (!profileResponse.getUserId().isEmpty()) {
                        Map<String, Object> profile = new HashMap<>();
                        profile.put("userId", profileResponse.getUserId());
                        profile.put("email", profileResponse.getEmail());
                        profile.put("fullName", profileResponse.getFullName());
                        profile.put("phoneNumber", profileResponse.getPhoneNumber());
                        profile.put("address", profileResponse.getAddress());
                        profile.put("role", profileResponse.getRole());
                        profile.put("isVerified", profileResponse.getIsVerified());
                        profile.put("createdAt", profileResponse.getCreatedAt());
                        profile.put("positiveReviews", profileResponse.getPositiveReviews());
                        profile.put("negativeReviews", profileResponse.getNegativeReviews());
                        result.put("success", true);
                        result.put("profile", profile);
                        result.put("message", profileResponse.getMessage());
                        
                        log.info("Public profile retrieved successfully for user ID: {}", userId);
                        return ResponseEntity.ok(result);
                    } else {
                        result.put("success", false);
                        result.put("message", profileResponse.getMessage() != null && !profileResponse.getMessage().isEmpty() 
                            ? profileResponse.getMessage() : "User not found");
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(result);
                    }
                })
                .onErrorResume(e -> {
                    log.error("Get public profile error: {}", e.getMessage(), e);
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "Get profile failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error));
                });
    }

    @GetMapping("/profile/{userId}/ratings")
    @Operation(summary = "Get user ratings by ID", description = "Get user ratings and reviews by user ID. Public endpoint - no authentication required.")
    public Mono<ResponseEntity<Map<String, Object>>> getUserRatingsById(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "20") int pageSize) {
        
        log.info("Get public user ratings request for user ID: {}, page: {}, pageSize: {}", userId, page, pageSize);
        
        // Validate userId
        if (userId == null || userId.trim().isEmpty()) {
            log.error("User ID is required");
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "User ID is required")));
        }

        // Validate userId is numeric
        int userIdInt;
        try {
            userIdInt = Integer.parseInt(userId);
        } catch (NumberFormatException e) {
            log.error("Invalid user ID format: {}", userId);
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "Invalid user ID format")));
        }

        // Validate pagination
        if (page <= 0 || pageSize <= 0 || pageSize > 100) {
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "Invalid page or pageSize")));
        }
        
        GetUserRatingsRequest grpcRequest = GetUserRatingsRequest.newBuilder()
                .setUserId(userIdInt)
                .setPage(page)
                .setPageSize(pageSize)
                .build();

        return ratingGrpcClient.getUserRatings(grpcRequest)
                .map(ratingsResponse -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", true);
                    result.put("userId", String.valueOf(ratingsResponse.getUserId()));
                    result.put("totalRatings", ratingsResponse.getTotalRatings());
                    result.put("message", ratingsResponse.getMessage() != null && !ratingsResponse.getMessage().isEmpty() 
                        ? ratingsResponse.getMessage() : "Ratings retrieved successfully");

                    // Map ratings
                    List<Map<String, Object>> ratings = new ArrayList<>();
                    ratingsResponse.getRatingsList().forEach(rating -> {
                        Map<String, Object> ratingMap = new HashMap<>();
                        ratingMap.put("reviewId", rating.getReviewId());
                        ratingMap.put("fromUserId", rating.getFromUserId());
                        ratingMap.put("fromUserName", rating.getFromUserName());
                        ratingMap.put("productId", rating.getProductId());
                        ratingMap.put("productTitle", rating.getProductTitle());
                        ratingMap.put("comment", rating.getComment());
                        ratingMap.put("createdAt", String.valueOf(rating.getCreatedAt()));
                        ratings.add(ratingMap);
                    });
                    result.put("ratings", ratings);
                    
                    log.info("Public user ratings retrieved successfully for user ID: {}, total: {}", userId, ratingsResponse.getTotalRatings());
                    return ResponseEntity.ok(result);
                })
                .onErrorResume(e -> {
                    log.error("Get public user ratings error: {}", e.getMessage(), e);
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "Get ratings failed: " + e.getMessage());
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
        
        // Validate fullName if provided
        if (request.getFullName() != null && request.getFullName().trim().isEmpty()) {
            log.error("Full name cannot be empty");
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "Full name cannot be empty")));
        }

        // Validate phoneNumber if provided
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty() && 
            !request.getPhoneNumber().matches("^[+]?[0-9]{10,15}$")) {
            log.error("Invalid phone number format: {}", request.getPhoneNumber());
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "Invalid phone number format")));
        }

        // Validate address if provided
        if (request.getAddress() != null && request.getAddress().trim().isEmpty()) {
            log.error("Address cannot be empty");
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "Address cannot be empty")));
        }
        
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
                        profileData.put("role", profile.getRole());
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
    @Operation(summary = "Login with Google", description = "Login or register with Google OAuth. Verifies Google ID token and returns access token with refresh token in httpOnly cookie.")
    public Mono<ResponseEntity<Map<String, Object>>> loginWithGoogle(
            @RequestBody com.auction.entities.dto.LoginWithGoogleRequest request,
            HttpServletResponse response) {
        
        log.info("Google login request received");
        
        // Validate googleIdToken
        if (request.getGoogleIdToken() == null || request.getGoogleIdToken().trim().isEmpty()) {
            log.error("Google ID token is required");
            return Mono.just(ResponseEntity.badRequest().body(
                Map.of("success", false, "message", "Google ID token is required")));
        }
        
        // Verify Google ID token and get profile information
        return googleOAuthService.verifyAndGetProfile(request.getGoogleIdToken())
                .flatMap(googleProfile -> {
                    log.info("Google profile verified: {}", googleProfile.getEmail());
                    
                    // Call gRPC service with verified Google profile data
                    LoginWithGoogleRequest grpcRequest = LoginWithGoogleRequest.newBuilder()
                            .setGoogleIdToken(request.getGoogleIdToken())
                            .setEmail(googleProfile.getEmail())
                            .setFullName(googleProfile.getName() != null ? googleProfile.getName() : "")
                            .setProfilePicture(googleProfile.getProfilePicture() != null ? googleProfile.getProfilePicture() : "")
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
                                userInfo.put("role", loginResponse.getUserInfo().getRole());
                                result.put("user", userInfo);
                                
                                log.info("Google login successful for user: {}", googleProfile.getEmail());
                                return ResponseEntity.ok(result);
                            })
                            .onErrorResume(e -> {
                                log.error("gRPC login error: {}", e.getMessage());
                                Map<String, Object> error = new HashMap<>();
                                error.put("message", "Login failed: " + e.getMessage());
                                return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error));
                            });
                })
                .onErrorResume(e -> {
                    log.error("Google OAuth verification failed: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("message", "Google authentication failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error));
                });
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Send OTP to email for password reset.")
    public Mono<ResponseEntity<Map<String, Object>>> forgotPassword(
            @RequestBody com.auction.entities.dto.ForgotPasswordRequest request) {
        
        log.info("Forgot password request for email: {}", request.getEmail());
        
        // Validate email
        if (!isValidEmail(request.getEmail())) {
            log.error("Invalid email format: {}", request.getEmail());
            return badRequestResponse("Invalid email format");
        }
        
        ForgotPasswordRequest grpcRequest = ForgotPasswordRequest.newBuilder()
                .setEmail(request.getEmail())
                .build();

        return userGrpcClient.forgotPassword(grpcRequest)
                .map(response -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", response.getSuccess());
                    result.put("message", response.getMessage());
                    
                    if (response.getSuccess()) {
                        log.info("Forgot password OTP sent successfully for: {}", request.getEmail());
                        return ResponseEntity.ok(result);
                    } else {
                        return ResponseEntity.badRequest().body(result);
                    }
                })
                .onErrorResume(e -> {
                    log.error("Forgot password error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "Forgot password failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.badRequest().body(error));
                });
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Reset password with OTP verification.")
    public Mono<ResponseEntity<Map<String, Object>>> resetPassword(
            @RequestBody com.auction.entities.dto.ResetPasswordRequest request) {
        
        log.info("Reset password request for email: {}", request.getEmail());
        
        // Validate email
        if (!isValidEmail(request.getEmail())) {
            log.error("Invalid email format: {}", request.getEmail());
            return badRequestResponse("Invalid email format");
        }

        // Validate OTP
        if (!isValidOTP(request.getOtp())) {
            log.error("Invalid OTP format: {}", request.getOtp());
            return badRequestResponse("OTP must be 6 digits");
        }

        // Validate newPassword
        if (!isValidPassword(request.getNewPassword())) {
            log.error("New password does not meet requirements");
            return badRequestResponse("Password must be at least 8 characters with uppercase, lowercase, digit, and special character");
        }
        
        ResetPasswordRequest grpcRequest = ResetPasswordRequest.newBuilder()
                .setEmail(request.getEmail())
                .setOtp(request.getOtp())
                .setNewPassword(request.getNewPassword())
                .build();

        return userGrpcClient.resetPassword(grpcRequest)
                .map(response -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", response.getSuccess());
                    result.put("message", response.getMessage());
                    
                    if (response.getSuccess()) {
                        log.info("Password reset successfully for: {}", request.getEmail());
                        return ResponseEntity.ok(result);
                    } else {
                        return ResponseEntity.badRequest().body(result);
                    }
                })
                .onErrorResume(e -> {
                    log.error("Reset password error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "Reset password failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.badRequest().body(error));
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
