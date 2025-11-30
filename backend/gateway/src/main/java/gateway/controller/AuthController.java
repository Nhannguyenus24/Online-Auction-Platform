package gateway.controller;

import com.example.grpc.auth.*;
import gateway.dto.ChangePasswordRequest;
import gateway.dto.LoginRequest;
import gateway.dto.RegisterRequest;
import gateway.grpc.UserGrpcClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication endpoints - calls user service via gRPC")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserGrpcClient userGrpcClient;
    
    private static final int REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Register a new user account. Returns email verification link.")
    public Mono<ResponseEntity<Map<String, Object>>> register(@RequestBody RegisterRequest request) {
        log.info("Register request for email: {}", request.getEmail());
        
        com.example.grpc.auth.RegisterRequest grpcRequest = com.example.grpc.auth.RegisterRequest.newBuilder()
                .setEmail(request.getEmail())
                .setPassword(request.getPassword())
                .setFullName(request.getFullName())
                .setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "")
                .build();

        return userGrpcClient.register(grpcRequest)
                .map(response -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", response.getSuccess());
                    result.put("message", response.getMessage());
                    result.put("email", response.getEmail());
                    result.put("emailVerificationLink", response.getEmailVerificationLink());
                    
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
            @RequestBody LoginRequest request,
            HttpServletResponse response) {
        log.info("Login request for email: {}", request.getEmail());
        
        com.example.grpc.auth.LoginRequest grpcRequest = com.example.grpc.auth.LoginRequest.newBuilder()
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
                    result.put("tokenType", loginResponse.getTokenType());
                    result.put("expiresIn", loginResponse.getAccessTokenExpiresIn());
                    
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
        
        LogoutRequest grpcRequest = LogoutRequest.newBuilder()
                .setRefreshToken(refreshToken != null ? refreshToken : "")
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

    @GetMapping("/verify-email")
    @Operation(summary = "Verify email", description = "Verify user email with token from email link.")
    public Mono<ResponseEntity<Map<String, Object>>> verifyEmail(
            @Parameter(description = "Email verification token") @RequestParam String token) {
        
        log.info("Email verification request");
        
        VerifyEmailRequest grpcRequest = VerifyEmailRequest.newBuilder()
                .setToken(token)
                .build();

        return userGrpcClient.verifyEmail(grpcRequest)
                .map(verifyResponse -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", verifyResponse.getSuccess());
                    result.put("message", verifyResponse.getMessage());
                    
                    if (verifyResponse.getSuccess()) {
                        return ResponseEntity.ok(result);
                    } else {
                        return ResponseEntity.badRequest().body(result);
                    }
                })
                .onErrorResume(e -> {
                    log.error("Email verification error: {}", e.getMessage());
                    Map<String, Object> error = new HashMap<>();
                    error.put("success", false);
                    error.put("message", "Email verification failed: " + e.getMessage());
                    return Mono.just(ResponseEntity.badRequest().body(error));
                });
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password", description = "Change user password. Requires authentication.")
    public Mono<ResponseEntity<Map<String, Object>>> changePassword(@RequestBody ChangePasswordRequest request) {
        
        // Get user ID from security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        
        log.info("Change password request for user: {}", userId);
        
        com.example.grpc.auth.ChangePasswordRequest grpcRequest = com.example.grpc.auth.ChangePasswordRequest.newBuilder()
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
