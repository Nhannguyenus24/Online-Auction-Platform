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
import com.auction.builder.ResponseBuilder;
import com.auction.constants.AppConstants;
import com.auction.constants.ValidationConstants;
import com.auction.dto.ApiResponse;
import com.auction.validator.RequestValidator;

import gateway.dto.AuthResponseDto;
import gateway.dto.AuthResponseDto.UserInfoDto;
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

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Register a new user account. Returns OTP for email verification.")
    public Mono<ResponseEntity<ApiResponse<AuthResponseDto>>> register(@Valid @RequestBody com.auction.entities.dto.RegisterRequest request) {
        log.info("Register request for email: {}", request.getEmail());

        try {
            // Validate email
            String emailError = RequestValidator.validateEmailAndGetError(request.getEmail());
            if (emailError != null) {
                log.warn("Email validation failed for: {} - {}", request.getEmail(), emailError);
                return ResponseBuilder.<AuthResponseDto>monoBadRequest(emailError);
            }

            // Validate password
            String passwordError = RequestValidator.validatePasswordAndGetError(request.getPassword());
            if (passwordError != null) {
                log.warn("Password validation failed for: {}", request.getEmail());
                return ResponseBuilder.<AuthResponseDto>monoBadRequest(passwordError);
            }

            // Validate fullName
            if (!RequestValidator.isNotBlank(request.getFullName())) {
                log.warn("Full name is blank for: {}", request.getEmail());
                return ResponseBuilder.<AuthResponseDto>monoBadRequest(ValidationConstants.ERROR_FIELD_REQUIRED);
            }

            // Validate phoneNumber if provided
            if (!RequestValidator.isValidPhoneNumber(request.getPhoneNumber())) {
                log.warn("Phone number validation failed for: {}", request.getEmail());
                return ResponseBuilder.<AuthResponseDto>monoBadRequest(ValidationConstants.ERROR_INVALID_PHONE);
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
                        AuthResponseDto result = new AuthResponseDto();
                        result.setEmail(response.getEmail());
                        result.setUserId(response.getUserId());
                        result.setOtp(response.getOtp());
                        result.setOtpExpiryMinutes((int) (AppConstants.TOKEN_OTP_EXPIRY / 60)); // Convert seconds to minutes

                        if (response.getSuccess()) {
                            log.info("Registration successful for email: {}", request.getEmail());
                            return ResponseBuilder.<AuthResponseDto>ok(result);
                        } else {
                            log.warn("Registration failed for email: {} - {}", request.getEmail(), response.getMessage());
                            return ResponseBuilder.<AuthResponseDto>badRequest(response.getMessage());
                        }
                    })
                    .onErrorResume(e -> {
                        log.error("Register error for email: {}", request.getEmail(), e);
                        return ResponseBuilder.<AuthResponseDto>monoInternalServerError(
                            "Registration failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error during register: {}", e.getMessage(), e);
            return ResponseBuilder.<AuthResponseDto>monoInternalServerError("An unexpected error occurred during registration");
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Login with email and password. Returns access token and sets refresh token in httpOnly cookie.")
    public Mono<ResponseEntity<ApiResponse<AuthResponseDto>>> login(
            @RequestBody com.auction.entities.dto.LoginRequest request,
            HttpServletResponse response) {
        log.info("Login request for email: {}", request.getEmail());

        try {
            // Validate email
            String emailError = RequestValidator.validateEmailAndGetError(request.getEmail());
            if (emailError != null) {
                log.warn("Email validation failed for: {} - {}", request.getEmail(), emailError);
                return ResponseBuilder.<AuthResponseDto>monoBadRequest(emailError);
            }

            // Validate password
            if (!RequestValidator.isNotBlank(request.getPassword())) {
                log.warn("Password is blank for login attempt: {}", request.getEmail());
                return ResponseBuilder.<AuthResponseDto>monoBadRequest(ValidationConstants.ERROR_FIELD_REQUIRED);
            }

            LoginRequest grpcRequest = LoginRequest.newBuilder()
                    .setEmail(request.getEmail())
                    .setPassword(request.getPassword())
                    .build();

            return userGrpcClient.login(grpcRequest)
                    .map(loginResponse -> {
                        if (!loginResponse.getSuccess()) {
                            log.warn("Login failed for email: {} - {}", request.getEmail(), loginResponse.getMessage());
                            return ResponseBuilder.<AuthResponseDto>unauthorized(loginResponse.getMessage());
                        }

                        // Set refresh token in httpOnly cookie
                        setRefreshTokenCookie(response, loginResponse.getRefreshToken());

                        // Return access token and user info
                        AuthResponseDto result = new AuthResponseDto();
                        result.setAccessToken(loginResponse.getAccessToken());
                        result.setUser(new UserInfoDto(
                            loginResponse.getUserInfo().getId(),
                            loginResponse.getUserInfo().getEmail(),
                            loginResponse.getUserInfo().getFullName(),
                            loginResponse.getUserInfo().getRole()
                        ));

                        log.info("Login successful for user: {}", request.getEmail());
                        return ResponseBuilder.<AuthResponseDto>ok("Login successful", result);
                    })
                    .onErrorResume(e -> {
                        log.error("Login error for email: {}", request.getEmail(), e);
                        return ResponseBuilder.<AuthResponseDto>monoUnauthorized("Login failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error during login: {}", e.getMessage(), e);
            return ResponseBuilder.<AuthResponseDto>monoInternalServerError("An unexpected error occurred during login");
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Get new access token using refresh token from cookie. Returns new tokens.")
    public Mono<ResponseEntity<ApiResponse<AuthResponseDto>>> refreshToken(
            HttpServletRequest request,
            HttpServletResponse response) {

        try {
            // Get refresh token from cookie
            String refreshToken = getRefreshTokenFromCookie(request);

            if (!RequestValidator.isValidToken(refreshToken)) {
                log.warn("Refresh token not found or invalid");
                return ResponseBuilder.<AuthResponseDto>monoUnauthorized(ValidationConstants.ERROR_FIELD_REQUIRED);
            }

            log.info("Refresh token request received");

            RefreshTokenRequest grpcRequest = RefreshTokenRequest.newBuilder()
                    .setRefreshToken(refreshToken)
                    .build();

            return userGrpcClient.refreshToken(grpcRequest)
                    .map(refreshResponse -> {
                        AuthResponseDto result = new AuthResponseDto();
                        result.setAccessToken(refreshResponse.getAccessToken());
                        result.setExpiresIn((int) refreshResponse.getAccessTokenExpiresIn());

                        log.info("Token refreshed successfully");
                        return ResponseBuilder.<AuthResponseDto>ok("Token refreshed successfully", result);
                    })
                    .onErrorResume(e -> {
                        log.error("Refresh token error: {}", e.getMessage(), e);
                        return ResponseBuilder.<AuthResponseDto>monoUnauthorized("Token refresh failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error during token refresh: {}", e.getMessage(), e);
            return ResponseBuilder.<AuthResponseDto>monoInternalServerError("An unexpected error occurred during token refresh");
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Logout user and clear refresh token cookie.")
    public Mono<ResponseEntity<ApiResponse<Void>>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {

        log.info("Logout request received");

        try {
            // Clear refresh token cookie
            clearRefreshTokenCookie(response);

            log.info("Logout successful");
            return ResponseBuilder.<Void>monoOk("Logged out successfully", null);
        } catch (Exception e) {
            log.error("Unexpected error during logout: {}", e.getMessage(), e);
            return ResponseBuilder.<Void>monoInternalServerError("An unexpected error occurred during logout");
        }
    }

    @PostMapping("/reproduce-otp")
    @Operation(summary = "Reproduce OTP", description = "Reproduce OTP sent after registration.")
    public Mono<ResponseEntity<ApiResponse<Void>>> reproduceOTP(@RequestBody com.auction.entities.dto.ReproduceOTPRequest request){
        log.info("Reproduce OTP request for email: {}", request.getEmail());

        try {
            // Validate email
            String emailError = RequestValidator.validateEmailAndGetError(request.getEmail());
            if (emailError != null) {
                log.warn("Email validation failed for: {} - {}", request.getEmail(), emailError);
                return ResponseBuilder.<Void>monoBadRequest(emailError);
            }

            ReproduceOTPRequest grpcRequest = ReproduceOTPRequest.newBuilder()
                    .setEmail(request.getEmail())
                    .build();

            return userGrpcClient.reproduceOTP(grpcRequest)
                    .map(grpcResponse -> {
                        if (grpcResponse.getSuccess()) {
                            log.info("OTP reproduce successful for email: {}", request.getEmail());
                            return ResponseBuilder.<Void>ok(grpcResponse.getMessage(), null);
                        } else {
                            log.warn("OTP reproduce failed for email: {} - {}", request.getEmail(), grpcResponse.getMessage());
                            return ResponseBuilder.<Void>badRequest(grpcResponse.getMessage());
                        }
                    })
                    .onErrorResume(e -> {
                        log.error("OTP reproduce error for email: {}", request.getEmail(), e);
                        return ResponseBuilder.<Void>monoBadRequest("OTP reproduce failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error during OTP reproduce: {}", e.getMessage(), e);
            return ResponseBuilder.<Void>monoInternalServerError("An unexpected error occurred during OTP reproduction");
        }
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP", description = "Verify user email with OTP sent during registration.")
    public Mono<ResponseEntity<ApiResponse<Void>>> verifyOTP(@RequestBody com.auction.entities.dto.VerifyOTPRequest request) {

        log.info("OTP verification request for email: {}", request.getEmail());

        try {
            // Validate email
            String emailError = RequestValidator.validateEmailAndGetError(request.getEmail());
            if (emailError != null) {
                log.warn("Email validation failed for: {} - {}", request.getEmail(), emailError);
                return ResponseBuilder.<Void>monoBadRequest(emailError);
            }

            // Validate OTP
            String otpError = RequestValidator.validateOTPAndGetError(request.getOtp());
            if (otpError != null) {
                log.warn("OTP validation failed for: {} - {}", request.getEmail(), otpError);
                return ResponseBuilder.<Void>monoBadRequest(otpError);
            }

            VerifyOTPRequest grpcRequest = VerifyOTPRequest.newBuilder()
                    .setEmail(String.valueOf(request.getEmail()))
                    .setOtp(request.getOtp())
                    .build();

            return userGrpcClient.verifyOTP(grpcRequest)
                    .map(verifyResponse -> {
                        if (verifyResponse.getSuccess()) {
                            log.info("OTP verification successful for email: {}", request.getEmail());
                            return ResponseBuilder.<Void>ok(verifyResponse.getMessage(), null);
                        } else {
                            log.warn("OTP verification failed for email: {} - {}", request.getEmail(), verifyResponse.getMessage());
                            return ResponseBuilder.<Void>badRequest(verifyResponse.getMessage());
                        }
                    })
                    .onErrorResume(e -> {
                        log.error("OTP verification error for email: {}", request.getEmail(), e);
                        return ResponseBuilder.<Void>monoBadRequest("OTP verification failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error during OTP verification: {}", e.getMessage(), e);
            return ResponseBuilder.<Void>monoInternalServerError("An unexpected error occurred during OTP verification");
        }
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password", description = "Change user password. Requires authentication.")
    public Mono<ResponseEntity<ApiResponse<Void>>> changePassword(@RequestBody com.auction.entities.dto.ChangePasswordRequest request) {

        try {
            // Get user ID from security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();

            log.info("Change password request for user: {}", userId);

            // Validate oldPassword
            if (!RequestValidator.isNotBlank(request.getOldPassword())) {
                log.warn("Old password is blank for user: {}", userId);
                return ResponseBuilder.<Void>monoBadRequest(ValidationConstants.ERROR_FIELD_REQUIRED);
            }

            // Validate newPassword
            String passwordError = RequestValidator.validatePasswordAndGetError(request.getNewPassword());
            if (passwordError != null) {
                log.warn("New password validation failed for user: {}", userId);
                return ResponseBuilder.<Void>monoBadRequest(passwordError);
            }

            // Check that old and new password are different
            if (!RequestValidator.arePasswordsDifferent(request.getOldPassword(), request.getNewPassword())) {
                log.warn("New password same as old password for user: {}", userId);
                return ResponseBuilder.<Void>monoBadRequest("New password must be different from old password");
            }

            ChangePasswordRequest grpcRequest = ChangePasswordRequest.newBuilder()
                    .setUserId(userId)
                    .setOldPassword(request.getOldPassword())
                    .setNewPassword(request.getNewPassword())
                    .build();

            return userGrpcClient.changePassword(grpcRequest)
                    .map(changeResponse -> {
                        if (changeResponse.getSuccess()) {
                            log.info("Password changed successfully for user: {}", userId);
                            return ResponseBuilder.<Void>ok(changeResponse.getMessage(), null);
                        } else {
                            log.warn("Password change failed for user: {} - {}", userId, changeResponse.getMessage());
                            return ResponseBuilder.<Void>badRequest(changeResponse.getMessage());
                        }
                    })
                    .onErrorResume(e -> {
                        log.error("Change password error for user: {}", userId, e);
                        return ResponseBuilder.<Void>monoBadRequest("Password change failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error during password change: {}", e.getMessage(), e);
            return ResponseBuilder.<Void>monoInternalServerError("An unexpected error occurred during password change");
        }
    }

    @GetMapping("/validate")
    @Operation(summary = "Validate token", description = "Validate JWT access token. For internal use by Gateway.")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> validateToken(
            @Parameter(description = "Access token to validate") @RequestParam String token) {

        try {
            // Validate token
            if (!RequestValidator.isValidToken(token)) {
                log.warn("Token validation request with missing or empty token");
                return ResponseBuilder.<Map<String, Object>>monoBadRequest(ValidationConstants.ERROR_FIELD_REQUIRED);
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

                        log.info("Token validation completed, valid: {}", validateResponse.getIsValid());
                        return ResponseBuilder.<Map<String, Object>>ok(result);
                    })
                    .onErrorResume(e -> {
                        log.error("Token validation error: {}", e.getMessage(), e);
                        Map<String, Object> error = new HashMap<>();
                        error.put("valid", false);
                        error.put("error", e.getMessage());
                        return Mono.just(ResponseBuilder.<Map<String, Object>>ok(error));
                    });
        } catch (Exception e) {
            log.error("Unexpected error during token validation: {}", e.getMessage(), e);
            return ResponseBuilder.<Map<String, Object>>monoInternalServerError("An unexpected error occurred during token validation");
        }
    }

    @GetMapping("/profile")
    @Operation(summary = "Get user profile", description = "Get authenticated user's profile information. Requires authentication.")
    public Mono<ResponseEntity<ApiResponse<AuthResponseDto>>> getProfile() {

        try {
            // Get user ID from security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();

            log.info("Get profile request for user: {}", userId);

            GetProfileRequest grpcRequest = GetProfileRequest.newBuilder()
                    .setUserId(userId)
                    .build();

            return userGrpcClient.getProfile(grpcRequest)
                    .map(profileResponse -> {
                        if (!profileResponse.getUserId().isEmpty()) {
                            AuthResponseDto result = new AuthResponseDto();
                            result.setProfile(buildProfileMap(profileResponse));

                            log.info("Profile retrieved successfully for user: {}", userId);
                            return ResponseBuilder.<AuthResponseDto>ok(profileResponse.getMessage(), result);
                        } else {
                            log.warn("Profile not found for user: {}", userId);
                            return ResponseBuilder.<AuthResponseDto>badRequest(profileResponse.getMessage());
                        }
                    })
                    .onErrorResume(e -> {
                        log.error("Get profile error for user: {}", userId, e);
                        return ResponseBuilder.<AuthResponseDto>monoInternalServerError("Get profile failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error getting profile: {}", e.getMessage(), e);
            return ResponseBuilder.<AuthResponseDto>monoInternalServerError("An unexpected error occurred while retrieving profile");
        }
    }

    @GetMapping("/profile/{userId}")
    @Operation(summary = "Get user profile by ID", description = "Get user profile information by user ID. Public endpoint - no authentication required.")
    public Mono<ResponseEntity<ApiResponse<AuthResponseDto>>> getProfileById(
            @Parameter(description = "User ID") @PathVariable String userId) {

        log.info("Get public profile request for user ID: {}", userId);

        try {
            // Validate userId
            if (!RequestValidator.isNotBlank(userId)) {
                log.warn("User ID is blank in getProfileById request");
                return ResponseBuilder.<AuthResponseDto>monoBadRequest(ValidationConstants.ERROR_FIELD_REQUIRED);
            }

            // Validate userId is numeric
            if (!RequestValidator.isValidUserId(userId)) {
                log.warn("Invalid user ID format: {}", userId);
                return ResponseBuilder.<AuthResponseDto>monoBadRequest("Invalid user ID format");
            }

            GetProfileRequest grpcRequest = GetProfileRequest.newBuilder()
                    .setUserId(userId)
                    .build();

            return userGrpcClient.getProfile(grpcRequest)
                    .map(profileResponse -> {
                        if (!profileResponse.getUserId().isEmpty()) {
                            AuthResponseDto result = new AuthResponseDto();
                            result.setProfile(buildProfileMapWithReviews(profileResponse));

                            log.info("Public profile retrieved successfully for user ID: {}", userId);
                            return ResponseBuilder.<AuthResponseDto>ok(profileResponse.getMessage(), result);
                        } else {
                            String message = profileResponse.getMessage() != null && !profileResponse.getMessage().isEmpty()
                                ? profileResponse.getMessage() : "User not found";
                            log.warn("Profile not found for user ID: {} - {}", userId, message);
                            return ResponseBuilder.<AuthResponseDto>notFound(message);
                        }
                    })
                    .onErrorResume(e -> {
                        log.error("Get public profile error for user ID: {}", userId, e);
                        return ResponseBuilder.<AuthResponseDto>monoInternalServerError("Get profile failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error getting public profile for user ID: {}", userId, e);
            return ResponseBuilder.<AuthResponseDto>monoInternalServerError("An unexpected error occurred while retrieving profile");
        }
    }

    @GetMapping("/profile/{userId}/ratings")
    @Operation(summary = "Get user ratings by ID", description = "Get user ratings and reviews by user ID. Public endpoint - no authentication required.")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> getUserRatingsById(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Page number (1-based)") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page") @RequestParam(defaultValue = "20") int pageSize) {

        log.info("Get public user ratings request for user ID: {}, page: {}, pageSize: {}", userId, page, pageSize);

        try {
            // Validate userId
            if (!RequestValidator.isNotBlank(userId)) {
                log.warn("User ID is blank in getUserRatingsById request");
                return ResponseBuilder.<Map<String, Object>>monoBadRequest(ValidationConstants.ERROR_FIELD_REQUIRED);
            }

            // Validate userId is numeric
            int userIdInt;
            try {
                userIdInt = Integer.parseInt(userId);
            } catch (NumberFormatException e) {
                log.warn("Invalid user ID format: {}", userId);
                return ResponseBuilder.<Map<String, Object>>monoBadRequest("Invalid user ID format");
            }

            // Validate pagination
            if (!RequestValidator.isValidPagination(page, pageSize)) {
                log.warn("Invalid pagination parameters for user ID: {} - page: {}, pageSize: {}", userId, page, pageSize);
                return ResponseBuilder.<Map<String, Object>>monoBadRequest("Invalid page or pageSize");
            }

            GetUserRatingsRequest grpcRequest = GetUserRatingsRequest.newBuilder()
                    .setUserId(userIdInt)
                    .setPage(page)
                    .setPageSize(pageSize)
                    .build();

            return ratingGrpcClient.getUserRatings(grpcRequest)
                    .map(ratingsResponse -> {
                        Map<String, Object> result = new HashMap<>();
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
                        return ResponseBuilder.<Map<String, Object>>ok(result);
                    })
                    .onErrorResume(e -> {
                        log.error("Get public user ratings error for user ID: {}", userId, e);
                        return ResponseBuilder.<Map<String, Object>>monoInternalServerError("Get ratings failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error getting user ratings for user ID: {}", userId, e);
            return ResponseBuilder.<Map<String, Object>>monoInternalServerError("An unexpected error occurred while retrieving ratings");
        }
    }

    @PostMapping("/profile")
    @Operation(summary = "Update user profile", description = "Update authenticated user's profile information. Requires authentication.")
    public Mono<ResponseEntity<ApiResponse<AuthResponseDto>>> updateProfile(
            @RequestBody com.auction.entities.dto.UpdateProfileRequest request) {

        try {
            // Get user ID from security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = authentication.getName();

            log.info("Update profile request for user: {}", userId);

            // Validate fullName if provided
            if (request.getFullName() != null && !RequestValidator.isNotBlank(request.getFullName())) {
                log.warn("Full name is blank for user: {}", userId);
                return ResponseBuilder.<AuthResponseDto>monoBadRequest(ValidationConstants.ERROR_FIELD_REQUIRED);
            }

            // Validate phoneNumber if provided
            if (!RequestValidator.isValidPhoneNumber(request.getPhoneNumber())) {
                log.warn("Phone number validation failed for user: {}", userId);
                return ResponseBuilder.<AuthResponseDto>monoBadRequest(ValidationConstants.ERROR_INVALID_PHONE);
            }

            // Validate address if provided
            if (request.getAddress() != null && !RequestValidator.isNotBlank(request.getAddress())) {
                log.warn("Address is blank for user: {}", userId);
                return ResponseBuilder.<AuthResponseDto>monoBadRequest(ValidationConstants.ERROR_FIELD_REQUIRED);
            }

            UpdateProfileRequest grpcRequest = UpdateProfileRequest.newBuilder()
                    .setUserId(userId)
                    .setFullName(request.getFullName() != null ? request.getFullName() : "")
                    .setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "")
                    .setAddress(request.getAddress() != null ? request.getAddress() : "")
                    .build();

            return userGrpcClient.updateProfile(grpcRequest)
                    .map(updateResponse -> {
                        if (updateResponse.getSuccess() && updateResponse.hasUpdatedProfile()) {
                            GetProfileResponse profile = updateResponse.getUpdatedProfile();
                            AuthResponseDto result = new AuthResponseDto();
                            result.setProfile(buildProfileMap(profile));

                            log.info("Profile updated successfully for user: {}", userId);
                            return ResponseBuilder.<AuthResponseDto>ok(updateResponse.getMessage(), result);
                        } else {
                            log.warn("Profile update failed for user: {} - {}", userId, updateResponse.getMessage());
                            return ResponseBuilder.<AuthResponseDto>badRequest(updateResponse.getMessage());
                        }
                    })
                    .onErrorResume(e -> {
                        log.error("Update profile error for user: {}", userId, e);
                        return ResponseBuilder.<AuthResponseDto>monoInternalServerError("Update profile failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error updating profile: {}", e.getMessage(), e);
            return ResponseBuilder.<AuthResponseDto>monoInternalServerError("An unexpected error occurred while updating profile");
        }
    }

    @PostMapping("/google")
    @Operation(summary = "Login with Google", description = "Login or register with Google OAuth. Verifies Google ID token and returns access token with refresh token in httpOnly cookie.")
    public Mono<ResponseEntity<ApiResponse<AuthResponseDto>>> loginWithGoogle(
            @RequestBody com.auction.entities.dto.LoginWithGoogleRequest request,
            HttpServletResponse response) {

        log.info("Google login request received");

        try {
            // Validate googleIdToken
            if (!RequestValidator.isValidToken(request.getGoogleIdToken())) {
                log.warn("Google ID token is required or invalid");
                return ResponseBuilder.<AuthResponseDto>monoBadRequest(ValidationConstants.ERROR_FIELD_REQUIRED);
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
                                    setRefreshTokenCookie(response, loginResponse.getRefreshToken());

                                    // Return access token and user info
                                    AuthResponseDto result = new AuthResponseDto();
                                    result.setAccessToken(loginResponse.getAccessToken());
                                    result.setUser(new UserInfoDto(
                                        loginResponse.getUserInfo().getId(),
                                        loginResponse.getUserInfo().getEmail(),
                                        loginResponse.getUserInfo().getFullName(),
                                        loginResponse.getUserInfo().getRole()
                                    ));

                                    log.info("Google login successful for user: {}", googleProfile.getEmail());
                                    return ResponseBuilder.<AuthResponseDto>ok("Google login successful", result);
                                })
                                .onErrorResume(e -> {
                                    log.error("gRPC login error for Google auth: {}", e.getMessage(), e);
                                    return ResponseBuilder.<AuthResponseDto>monoUnauthorized("Login failed: " + e.getMessage());
                                });
                    })
                    .onErrorResume(e -> {
                        log.error("Google OAuth verification failed: {}", e.getMessage(), e);
                        return ResponseBuilder.<AuthResponseDto>monoUnauthorized("Google authentication failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error during Google login: {}", e.getMessage(), e);
            return ResponseBuilder.<AuthResponseDto>monoInternalServerError("An unexpected error occurred during Google login");
        }
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Send OTP to email for password reset.")
    public Mono<ResponseEntity<ApiResponse<Void>>> forgotPassword(
            @RequestBody com.auction.entities.dto.ForgotPasswordRequest request) {

        log.info("Forgot password request for email: {}", request.getEmail());

        try {
            // Validate email
            String emailError = RequestValidator.validateEmailAndGetError(request.getEmail());
            if (emailError != null) {
                log.warn("Email validation failed for: {} - {}", request.getEmail(), emailError);
                return ResponseBuilder.<Void>monoBadRequest(emailError);
            }

            ForgotPasswordRequest grpcRequest = ForgotPasswordRequest.newBuilder()
                    .setEmail(request.getEmail())
                    .build();

            return userGrpcClient.forgotPassword(grpcRequest)
                    .map(grpcResponse -> {
                        if (grpcResponse.getSuccess()) {
                            log.info("Forgot password OTP sent successfully for: {}", request.getEmail());
                            return ResponseBuilder.<Void>ok(grpcResponse.getMessage(), null);
                        } else {
                            log.warn("Forgot password failed for email: {} - {}", request.getEmail(), grpcResponse.getMessage());
                            return ResponseBuilder.<Void>badRequest(grpcResponse.getMessage());
                        }
                    })
                    .onErrorResume(e -> {
                        log.error("Forgot password error for email: {}", request.getEmail(), e);
                        return ResponseBuilder.<Void>monoBadRequest("Forgot password failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error during forgot password: {}", e.getMessage(), e);
            return ResponseBuilder.<Void>monoInternalServerError("An unexpected error occurred during password reset request");
        }
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Reset password with OTP verification.")
    public Mono<ResponseEntity<ApiResponse<Void>>> resetPassword(
            @RequestBody com.auction.entities.dto.ResetPasswordRequest request) {

        log.info("Reset password request for email: {}", request.getEmail());

        try {
            // Validate email
            String emailError = RequestValidator.validateEmailAndGetError(request.getEmail());
            if (emailError != null) {
                log.warn("Email validation failed for: {} - {}", request.getEmail(), emailError);
                return ResponseBuilder.<Void>monoBadRequest(emailError);
            }

            // Validate OTP
            String otpError = RequestValidator.validateOTPAndGetError(request.getOtp());
            if (otpError != null) {
                log.warn("OTP validation failed for: {} - {}", request.getEmail(), otpError);
                return ResponseBuilder.<Void>monoBadRequest(otpError);
            }

            // Validate newPassword
            String passwordError = RequestValidator.validatePasswordAndGetError(request.getNewPassword());
            if (passwordError != null) {
                log.warn("New password validation failed for: {}", request.getEmail());
                return ResponseBuilder.<Void>monoBadRequest(passwordError);
            }

            ResetPasswordRequest grpcRequest = ResetPasswordRequest.newBuilder()
                    .setEmail(request.getEmail())
                    .setOtp(request.getOtp())
                    .setNewPassword(request.getNewPassword())
                    .build();

            return userGrpcClient.resetPassword(grpcRequest)
                    .map(grpcResponse -> {
                        if (grpcResponse.getSuccess()) {
                            log.info("Password reset successfully for: {}", request.getEmail());
                            return ResponseBuilder.<Void>ok(grpcResponse.getMessage(), null);
                        } else {
                            log.warn("Password reset failed for email: {} - {}", request.getEmail(), grpcResponse.getMessage());
                            return ResponseBuilder.<Void>badRequest(grpcResponse.getMessage());
                        }
                    })
                    .onErrorResume(e -> {
                        log.error("Reset password error for email: {}", request.getEmail(), e);
                        return ResponseBuilder.<Void>monoBadRequest("Reset password failed: " + e.getMessage());
                    });
        } catch (Exception e) {
            log.error("Unexpected error during password reset: {}", e.getMessage(), e);
            return ResponseBuilder.<Void>monoInternalServerError("An unexpected error occurred during password reset");
        }
    }

    /**
     * Extracts the refresh token from the HTTP request cookies
     * @param request HTTP request
     * @return Refresh token value, or null if not found
     */
    private String getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            Optional<Cookie> refreshTokenCookie = Arrays.stream(request.getCookies())
                    .filter(cookie -> AppConstants.COOKIE_REFRESH_NAME.equals(cookie.getName()))
                    .findFirst();

            return refreshTokenCookie.map(Cookie::getValue).orElse(null);
        }
        return null;
    }

    /**
     * Sets the refresh token in the HTTP response as an httpOnly cookie
     * @param response HTTP response
     * @param refreshToken Refresh token value
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie refreshTokenCookie = new Cookie(AppConstants.COOKIE_REFRESH_NAME, refreshToken);
        refreshTokenCookie.setHttpOnly(AppConstants.COOKIE_HTTP_ONLY);
        refreshTokenCookie.setSecure(AppConstants.COOKIE_SECURE);
        refreshTokenCookie.setPath(AppConstants.COOKIE_PATH);
        refreshTokenCookie.setMaxAge((int) AppConstants.COOKIE_REFRESH_MAX_AGE);
        response.addCookie(refreshTokenCookie);
    }

    /**
     * Clears the refresh token cookie from the HTTP response
     * @param response HTTP response
     */
    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie clearCookie = new Cookie(AppConstants.COOKIE_REFRESH_NAME, null);
        clearCookie.setHttpOnly(AppConstants.COOKIE_HTTP_ONLY);
        clearCookie.setPath(AppConstants.COOKIE_PATH);
        clearCookie.setMaxAge(0);
        response.addCookie(clearCookie);
    }

    /**
     * Builds a profile map from GetProfileResponse
     * @param profileResponse Profile response from gRPC
     * @return Map of profile data
     */
    private Map<String, Object> buildProfileMap(GetProfileResponse profileResponse) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("userId", profileResponse.getUserId());
        profile.put("email", profileResponse.getEmail());
        profile.put("fullName", profileResponse.getFullName());
        profile.put("phoneNumber", profileResponse.getPhoneNumber());
        profile.put("address", profileResponse.getAddress());
        profile.put("role", profileResponse.getRole());
        profile.put("isVerified", profileResponse.getIsVerified());
        profile.put("createdAt", profileResponse.getCreatedAt());
        return profile;
    }

    /**
     * Builds a profile map from GetProfileResponse with review counts
     * @param profileResponse Profile response from gRPC
     * @return Map of profile data including review counts
     */
    private Map<String, Object> buildProfileMapWithReviews(GetProfileResponse profileResponse) {
        Map<String, Object> profile = buildProfileMap(profileResponse);
        profile.put("positiveReviews", profileResponse.getPositiveReviews());
        profile.put("negativeReviews", profileResponse.getNegativeReviews());
        return profile;
    }
}
