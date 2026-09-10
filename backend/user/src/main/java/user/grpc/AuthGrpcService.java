package user.grpc;

import com.auction.proto.auth.*;
import com.auction.exception.ValidationException;
import com.auction.grpc.GrpcErrorHandler;
import com.auction.grpc.GrpcRequestValidator;
import com.auction.grpc.GrpcConstants;
import org.springframework.grpc.server.service.GrpcService;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
import user.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.auction.utils.JsonUtils;
import java.util.concurrent.TimeUnit;

/**
 * gRPC implementation of AuthService with enterprise-grade error handling and validation.
 *
 * Features:
 * - Comprehensive input validation at gRPC boundary
 * - Proper gRPC status code mapping for all error scenarios
 * - Structured logging with correlation IDs
 * - Timeout handling for all operations
 * - Security-sensitive operation logging
 *
 * Gateway will call this service for user authentication and profile management.
 */
@GrpcService
public class AuthGrpcService extends ReactorAuthServiceGrpc.AuthServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(AuthGrpcService.class);
    private static final String SERVICE_NAME = "AuthGrpcService";
    private final AuthService authService;

    public AuthGrpcService(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public Mono<RegisterResponse> register(Mono<RegisterRequest> request) {
        return request
            .timeout(java.time.Duration.ofMillis(GrpcConstants.AUTH_TIMEOUT_MS))
            .doOnNext(req -> log.debug("Register request received for email: {}", maskEmail(req.getEmail())))
            .flatMap(req -> {
                try {
                    // Validate request at gRPC boundary
                    GrpcRequestValidator.validateRequired(req.getEmail(), "email");
                    GrpcRequestValidator.validateEmail(req.getEmail(), "email");
                    GrpcRequestValidator.validateRequired(req.getPassword(), "password");
                    GrpcRequestValidator.validateMinLength(req.getPassword(), 8, "password");
                    GrpcRequestValidator.validateRequired(req.getFullName(), "fullName");
                    GrpcRequestValidator.validateMaxLength(req.getFullName(), GrpcConstants.MAX_STRING_LENGTH, "fullName");

                    return authService.register(
                        req.getEmail(),
                        req.getPassword(),
                        req.getFullName(),
                        req.getPhoneNumber(),
                        req.getAddress()
                    )
                    .map(result -> {
                        log.info("User registered successfully: {}", maskEmail(req.getEmail()));
                        return RegisterResponse.newBuilder()
                            .setSuccess(true)
                            .setUserId(String.valueOf(result.userId()))
                            .setEmail(result.email())
                            .setOtp(result.otp())
                            .setMessage(result.message())
                            .build();
                    })
                    .onErrorResume(e -> {
                        log.error("Registration failed for {}: {}", maskEmail(req.getEmail()), e.getMessage(), e);
                        throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".register");
                    });
                } catch (ValidationException e) {
                    log.warn("Registration validation error for {}: {}", maskEmail(req.getEmail()), e.getMessage());
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".register");
                } catch (Exception e) {
                    log.error("Unexpected error in register: {}", e.getMessage(), e);
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".register");
                }
            });
    }

    @Override
    public Mono<LoginResponse> login(Mono<LoginRequest> request) {
        return request
            .timeout(java.time.Duration.ofMillis(GrpcConstants.AUTH_TIMEOUT_MS))
            .doOnNext(req -> log.debug("Login request received for email: {}", maskEmail(req.getEmail())))
            .flatMap(req -> {
                try {
                    // Validate request at gRPC boundary
                    GrpcRequestValidator.validateRequired(req.getEmail(), "email");
                    GrpcRequestValidator.validateEmail(req.getEmail(), "email");
                    GrpcRequestValidator.validateRequired(req.getPassword(), "password");

                    return authService.login(req.getEmail(), req.getPassword())
                        .map(result -> {
                            log.info("User logged in successfully: {}", maskEmail(req.getEmail()));
                            return LoginResponse.newBuilder()
                                .setAccessToken(result.accessToken())
                                .setRefreshToken(result.refreshToken())
                                .setMessage("Login success")
                                .setSuccess(true)
                                .setUserInfo(UserInfo.newBuilder()
                                    .setId(String.valueOf(result.userId()))
                                    .setEmail(result.email())
                                    .setFullName(result.fullName())
                                    .setRole(result.role())
                                    .build())
                                .build();
                        })
                        .onErrorResume(e -> {
                            log.warn("Login failed for {}: {}", maskEmail(req.getEmail()), e.getMessage());
                            throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".login");
                        });
                } catch (ValidationException e) {
                    log.warn("Login validation error: {}", e.getMessage());
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".login");
                } catch (Exception e) {
                    log.error("Unexpected error in login: {}", e.getMessage(), e);
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".login");
                }
            });
    }

    @Override
    public Mono<RefreshTokenResponse> refreshToken(Mono<RefreshTokenRequest> request) {
        return request
            .timeout(java.time.Duration.ofMillis(GrpcConstants.AUTH_TIMEOUT_MS))
            .doOnNext(req -> log.debug("Refresh token request received"))
            .flatMap(req -> {
                try {
                    // Validate request at gRPC boundary
                    GrpcRequestValidator.validateRequired(req.getRefreshToken(), "refreshToken");

                    return authService.refreshToken(req.getRefreshToken())
                        .map(result -> RefreshTokenResponse.newBuilder()
                            .setAccessToken(result.accessToken())
                            .setRefreshToken(result.refreshToken())
                            .setMessage("Refresh success")
                            .setAccessTokenExpiresIn((int)(GrpcConstants.ACCESS_TOKEN_EXPIRATION_MS / 1000))
                            .build())
                        .onErrorResume(e -> {
                            log.warn("Token refresh failed: {}", e.getMessage());
                            throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".refreshToken");
                        });
                } catch (ValidationException e) {
                    log.warn("Refresh token validation error: {}", e.getMessage());
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".refreshToken");
                } catch (Exception e) {
                    log.error("Unexpected error in refreshToken: {}", e.getMessage(), e);
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".refreshToken");
                }
            });
    }

    @Override
    public Mono<ValidateTokenResponse> validateToken(Mono<ValidateTokenRequest> request) {
        return request
            .timeout(java.time.Duration.ofMillis(GrpcConstants.QUICK_TIMEOUT_MS))
            .doOnNext(req -> log.debug("Validate token request received"))
            .flatMap(req -> {
                try {
                    // Validate request at gRPC boundary
                    GrpcRequestValidator.validateRequired(req.getAccessToken(), "accessToken");

                    return authService.validateToken(req.getAccessToken())
                        .map(result -> {
                            if (result.isValid()) {
                                log.debug("Token validated successfully for user: {}", result.userId());
                                return ValidateTokenResponse.newBuilder()
                                    .setIsValid(true)
                                    .setUserId(String.valueOf(result.userId()))
                                    .setRole(result.role())
                                    .build();
                            } else {
                                log.debug("Token validation failed: {}", result.errorMessage());
                                return ValidateTokenResponse.newBuilder()
                                    .setIsValid(false)
                                    .setErrorMessage(result.errorMessage())
                                    .build();
                            }
                        })
                        .onErrorResume(e -> {
                            log.warn("Token validation error: {}", e.getMessage());
                            throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".validateToken");
                        });
                } catch (ValidationException e) {
                    log.warn("Validate token validation error: {}", e.getMessage());
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".validateToken");
                } catch (Exception e) {
                    log.error("Unexpected error in validateToken: {}", e.getMessage(), e);
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".validateToken");
                }
            });
    }

    @Override
    public Mono<ChangePasswordResponse> changePassword(Mono<ChangePasswordRequest> request) {
        return request.doOnNext(req -> log.info("Raw change password request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            authService.changePassword(
                Integer.parseInt(req.getUserId()),
                req.getOldPassword(),
                req.getNewPassword()
            )
            .map(message -> ChangePasswordResponse.newBuilder()
                .setSuccess(true)
                .setMessage(message)
                .build())
                .doOnNext(result -> log.info("Raw change password response: {}", JsonUtils.toJson(result)))
            .onErrorResume(e -> {
                log.error("Change password error: {}", e.getMessage());
                return Mono.just(ChangePasswordResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage(e.getMessage())
                    .build());
            })
        );
    }

    @Override
    public Mono<VerifyOTPResponse> verifyOTP(Mono<VerifyOTPRequest> request) {
        return request.doOnNext(req -> log.info("Raw verify OTP request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            authService.verifyOTP(
                req.getEmail(),
                req.getOtp()
            )
            .map(message -> VerifyOTPResponse.newBuilder()
                .setSuccess(true)
                .setMessage(message)
                .build())
            .doOnNext(result -> log.info("Raw verify OTP response: {}", JsonUtils.toJson(result)))
            .onErrorResume(e -> {
                log.error("Verify OTP error: {}", e.getMessage());
                return Mono.just(VerifyOTPResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage(e.getMessage())
                    .build());
            })
        );
    }

    @Override
    public Mono<ReproduceOTPResponse> reproduceOTP(Mono<ReproduceOTPRequest> request) {
        return request.doOnNext(req -> log.info("Raw reproduce OTP request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                authService.reproduceOTP(req.getEmail()))
                .map(message -> ReproduceOTPResponse.newBuilder().setSuccess(true).setMessage(message).build())
                .doOnNext(result -> log.info("Raw reproduce OTP response: {}", JsonUtils.toJson(result)))
                .onErrorResume(e -> {
                    log.error("Reproduce OTP error: {}", e.getMessage());
                    return Mono.just(ReproduceOTPResponse.newBuilder().setSuccess(false).setMessage(e.getMessage()).build());
                });
    }

    @Override
    public Mono<GetProfileResponse> getProfile(Mono<GetProfileRequest> request) {
        return request.doOnNext(req -> log.info("Raw get profile request: {}", JsonUtils.toJson(req)))
                .flatMap(req -> {
                    try {
                        Integer userId = Integer.parseInt(req.getUserId());
                        return authService.getProfile(userId)
                                .map(profile -> GetProfileResponse.newBuilder()
                                        .setUserId(String.valueOf(profile.userId()))
                                        .setEmail(profile.email())
                                        .setFullName(profile.fullName() != null ? profile.fullName() : "")
                                        .setPhoneNumber(profile.phone() != null ? profile.phone() : "")
                                        .setAddress(profile.address() != null ? profile.address() : "")
                                        .setRole(profile.role())
                                        .setIsVerified(profile.isVerified() != null ? profile.isVerified() : false)
                                        .setCreatedAt(profile.createdAt())
                                        .setPositiveReviews(profile.positiveReviews() != null ? profile.positiveReviews() : 0)
                                        .setNegativeReviews(profile.negativeReviews() != null ? profile.negativeReviews() : 0)
                                        .setMessage("Profile retrieved successfully")
                                        .build());
                    } catch (NumberFormatException e) {
                        log.error("Invalid user ID: {}", req.getUserId());
                        return Mono.just(GetProfileResponse.newBuilder()
                                .setMessage("Invalid user ID")
                                .build());
                    }
                })
                .doOnNext(result -> log.info("Raw get profile response: {}", JsonUtils.toJson(result)))
                .onErrorResume(e -> {
                    log.error("Get profile error: {}", e.getMessage());
                    return Mono.just(GetProfileResponse.newBuilder()
                            .setMessage("Get profile failed: " + e.getMessage())
                            .build());
                });
    }

    @Override
    public Mono<UpdateProfileResponse> updateProfile(Mono<UpdateProfileRequest> request) {
        return request.doOnNext(req -> log.info("Raw update profile request: {}", JsonUtils.toJson(req)))
                .flatMap(req -> {
                    try {
                        Integer userId = Integer.parseInt(req.getUserId());
                        return authService.updateProfile(
                                userId,
                                req.getFullName(),
                                req.getPhoneNumber(),
                                req.getAddress()
                        )
                        .map(profile -> UpdateProfileResponse.newBuilder()
                                .setSuccess(true)
                                .setMessage("Profile updated successfully")
                                .setUpdatedProfile(GetProfileResponse.newBuilder()
                                        .setUserId(String.valueOf(profile.userId()))
                                        .setEmail(profile.email())
                                        .setFullName(profile.fullName() != null ? profile.fullName() : "")
                                        .setPhoneNumber(profile.phone() != null ? profile.phone() : "")
                                        .setAddress(profile.address() != null ? profile.address() : "")
                                        .setRole(profile.role())
                                        .setIsVerified(profile.isVerified() != null ? profile.isVerified() : false)
                                        .setCreatedAt(profile.createdAt())
                                        .setPositiveReviews(profile.positiveReviews() != null ? profile.positiveReviews() : 0)
                                        .setNegativeReviews(profile.negativeReviews() != null ? profile.negativeReviews() : 0)
                                        .build())
                                .build());
                    } catch (NumberFormatException e) {
                        log.error("Invalid user ID: {}", req.getUserId());
                        return Mono.just(UpdateProfileResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Invalid user ID")
                                .build());
                    }
                })
                .doOnNext(result -> log.info("Raw update profile response: {}", JsonUtils.toJson(result)))
                .onErrorResume(e -> {
                    log.error("Update profile error: {}", e.getMessage());
                    return Mono.just(UpdateProfileResponse.newBuilder()
                            .setSuccess(false)
                            .setMessage("Update profile failed: " + e.getMessage())
                            .build());
                });
    }

    @Override
    public Mono<LoginResponse> loginWithGoogle(Mono<LoginWithGoogleRequest> request) {
        return request.doOnNext(req -> log.info("Raw login with Google request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    authService.loginWithGoogle(
                            req.getGoogleIdToken(),
                            req.getEmail(),
                            req.getFullName(),
                            req.getProfilePicture()
                    )
                    .map(result -> LoginResponse.newBuilder()
                            .setAccessToken(result.accessToken())
                            .setRefreshToken(result.refreshToken())
                            .setMessage("Google login success")
                            .setUserInfo(UserInfo.newBuilder()
                                    .setId(String.valueOf(result.userId()))
                                    .setEmail(result.email())
                                    .setFullName(result.fullName())
                                    .setRole(result.role())
                                    .build())
                            .build())
                    .doOnNext(result -> log.info("Raw login response: {}", JsonUtils.toJson(result)))
                    .onErrorResume(e -> {
                        log.error("Google login error: {}", e.getMessage());
                        return Mono.just(LoginResponse.newBuilder()
                                .setMessage("Google login failed: " + e.getMessage())
                                .build());
                    })
                );
    }

    @Override
    public Mono<ForgotPasswordResponse> forgotPassword(Mono<ForgotPasswordRequest> request) {
        return request.doOnNext(req -> log.info("Raw forgot password request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    authService.forgotPassword(req.getEmail())
                        .map(message -> ForgotPasswordResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage(message)
                            .build())
                        .doOnNext(result -> log.info("Raw forgot password response: {}", JsonUtils.toJson(result)))
                        .onErrorResume(e -> {
                            log.error("Forgot password error: {}", e.getMessage());
                            return Mono.just(ForgotPasswordResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage(e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<ResetPasswordResponse> resetPassword(Mono<ResetPasswordRequest> request) {
        return request
            .timeout(java.time.Duration.ofMillis(GrpcConstants.AUTH_TIMEOUT_MS))
            .doOnNext(req -> log.debug("Reset password request received for email: {}", maskEmail(req.getEmail())))
            .flatMap(req -> {
                try {
                    // Validate request at gRPC boundary
                    GrpcRequestValidator.validateRequired(req.getEmail(), "email");
                    GrpcRequestValidator.validateEmail(req.getEmail(), "email");
                    GrpcRequestValidator.validateRequired(req.getOtp(), "otp");
                    GrpcRequestValidator.validateRequired(req.getNewPassword(), "newPassword");
                    GrpcRequestValidator.validateMinLength(req.getNewPassword(), 8, "newPassword");

                    return authService.resetPassword(
                        req.getEmail(),
                        req.getOtp(),
                        req.getNewPassword()
                    )
                    .map(message -> {
                        log.info("Password reset successful for {}", maskEmail(req.getEmail()));
                        return ResetPasswordResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage(message)
                            .build();
                    })
                    .onErrorResume(e -> {
                        log.warn("Password reset failed for {}: {}", maskEmail(req.getEmail()), e.getMessage());
                        throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".resetPassword");
                    });
                } catch (ValidationException e) {
                    log.warn("Reset password validation error: {}", e.getMessage());
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".resetPassword");
                } catch (Exception e) {
                    log.error("Unexpected error in resetPassword: {}", e.getMessage(), e);
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".resetPassword");
                }
            });
    }

    /**
     * Masks email address for secure logging.
     * Example: user@example.com becomes u***@example.com
     *
     * @param email The email address to mask
     * @return Masked email address, or null if input is null
     */
    private String maskEmail(String email) {
        if (email == null || email.isEmpty()) {
            return email;
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) {
            return email;
        }
        return email.charAt(0) + "***" + email.substring(atIndex);
    }
}
