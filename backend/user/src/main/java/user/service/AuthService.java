package user.service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.auction.entities.database.User;
import com.auction.entities.msg.EventType;
import com.auction.entities.msg.RabbitMessage;
import com.auction.rabbitmq.services.ReactiveRabbitProducer;
import com.auction.redis.service.ReactiveRedisService;
import com.auction.utils.JwtUtils;
import com.auction.utils.TimeUtils;
import com.auction.constants.ServiceConstants;
import com.auction.utils.ServiceExceptionUtils;

import reactor.core.publisher.Mono;
import user.repository.UserRepository;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final ReactiveRedisService redisClient;
    private final JwtUtils jwtUtils;
    private final ReactiveRabbitProducer rabbitProducer;

    public AuthService(
            UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder,
            ReactiveRedisService redisClient,
            JwtUtils jwtUtils,
            ReactiveRabbitProducer rabbitProducer
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.redisClient = redisClient;
        this.jwtUtils = jwtUtils;
        this.rabbitProducer = rabbitProducer;
    }

    /**
     * Register new user
     */
    public Mono<RegisterResult> register(String email, String password, String fullName, String phone, String address) {
        log.info("User registration initiated for email: {}", email);

        return userRepository.existsByEmail(email)
                .flatMap(exists -> {
                    if (exists) {
                        log.warn("Registration failed - email already exists: {}", email);
                        return ServiceExceptionUtils.emailAlreadyExists();
                    }

                    User user = new User();
                    user.setEmail(email);
                    user.setPasswordHash(passwordEncoder.encode(password));
                    user.setFullName(fullName);
                    user.setPhone(phone);
                    user.setAddress(address);
                    user.setRole(ServiceConstants.ROLE_BIDDER);
                    user.setIsEmailVerified(false);
                    user.setPositiveReviews(0);
                    user.setNegativeReviews(0);
                    user.setCreatedAt(TimeUtils.now());

                    return userRepository.save(user)
                            .flatMap(savedUser -> {
                                String otp = generateOTP();
                                String redisKey = ServiceConstants.REDIS_KEY_OTP_PREFIX + savedUser.getEmail();

                                log.debug("Generated OTP for user {} with Redis key: {}", savedUser.getId(), redisKey);

                                return redisClient.set(redisKey, otp, Duration.ofMinutes(ServiceConstants.OTP_EXPIRY_MINUTES))
                                        .then(sendOTPEmail(savedUser.getEmail(), otp, savedUser.getId()))
                                        .then(Mono.just(new RegisterResult(
                                                savedUser.getId(),
                                                savedUser.getEmail(),
                                                otp,
                                                ServiceConstants.SUCCESS_REGISTRATION
                                        )))
                                        .doOnSuccess(v -> log.info("User registered successfully: email={}, userId={}", email, savedUser.getId()))
                                        .doOnError(e -> log.error("Error during registration for email={}: {}", email, e.getMessage(), e));
                            });
                })
                .doOnError(e -> log.error("Unexpected error during registration for email={}: {}", email, e.getMessage(), e));
    }

    /**
     * Generate 6-digit OTP
     */
    private String generateOTP() {
        Random random = new Random();
        int otp = random.nextInt(999999);
        return String.format("%06d", otp);
    }
    
    /**
     * Send OTP email via RabbitMQ (fire and forget)
     */
    private Mono<Void> sendOTPEmail(String email, String otp, Integer userId) {
        Map<String, String> emailPayload = new HashMap<>();
        emailPayload.put("email", email);
        emailPayload.put("otp", otp);
        emailPayload.put("expiryMinutes", String.valueOf(ServiceConstants.OTP_EXPIRY_MINUTES));

        RabbitMessage message = RabbitMessage.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(EventType.TASK_SEND_MAIL_OTP)
                .timestamp(System.currentTimeMillis())
                .userId(String.valueOf(userId))
                .payload(emailPayload)
                .build();

        log.debug("Sending OTP email to: {} via queue: {}", email, ServiceConstants.NOTIFICATION_QUEUE);

        return rabbitProducer.sendToQueue(ServiceConstants.NOTIFICATION_QUEUE, message)
                .doOnSuccess(v -> log.info("OTP email sent successfully to queue for userId={}, email={}", userId, email))
                .doOnError(e -> log.error("Failed to send OTP email to queue for userId={}, email={}, error={}", userId, email, e.getMessage(), e))
                .onErrorResume(e -> Mono.empty()); // Fire and forget
    }

    /**
     * Login user
     */
    public Mono<LoginResult> login(String email, String password) {
        log.info("Login attempt for email: {}", email);

        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Login failed - user not found for email: {}", email);
                    return ServiceExceptionUtils.invalidCredentials();
                }))
                .flatMap(user -> {
                    // Check password
                    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                        log.warn("Login failed - invalid password for email: {}", email);
                        return ServiceExceptionUtils.invalidCredentials();
                    }

                    // Check if email is verified
                    if (!Boolean.TRUE.equals(user.getIsEmailVerified())) {
                        log.warn("Login failed - email not verified for userId: {}", user.getId());
                        return ServiceExceptionUtils.emailNotVerified();
                    }

                    String accessToken = jwtUtils.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
                    String refreshToken = jwtUtils.generateRefreshToken(user.getId());

                    log.info("Login successful for userId: {}, email: {}", user.getId(), email);

                    return Mono.just(new LoginResult(
                            accessToken,
                            refreshToken,
                            user.getId(),
                            user.getEmail(),
                            user.getFullName(),
                            user.getRole()
                    ));
                })
                .doOnError(e -> log.error("Error during login for email={}: {}", email, e.getMessage(), e));
    }

    /**
     * Refresh access token (validate refresh token from cookie)
     */
    public Mono<RefreshResult> refreshToken(String refreshToken) {
        try {
            Integer userId = jwtUtils.getUserIdFromToken(refreshToken);
            log.debug("Refreshing token for userId: {}", userId);

            return userRepository.findById(userId)
                    .switchIfEmpty(Mono.defer(() -> {
                        log.warn("Token refresh failed - user not found for userId: {}", userId);
                        return ServiceExceptionUtils.userNotFound(userId);
                    }))
                    .flatMap(user -> {
                        String newAccessToken = jwtUtils.generateAccessToken(
                                user.getId(),
                                user.getEmail(),
                                user.getRole()
                        );

                        String newRefreshToken = jwtUtils.generateRefreshToken(user.getId());

                        log.info("Token refreshed successfully for userId: {}", userId);

                        return Mono.just(new RefreshResult(newAccessToken, newRefreshToken));
                    })
                    .doOnError(e -> log.error("Error refreshing token for userId={}: {}", userId, e.getMessage(), e));
        } catch (Exception e) {
            log.warn("Invalid or expired refresh token: {}", e.getMessage());
            return ServiceExceptionUtils.invalidRefreshToken();
        }
    }

    /**
     * Verify OTP
     */
    public Mono<String> verifyOTP(String email, String otp) {
        log.info("OTP verification initiated for email: {}", email);

        String redisKey = ServiceConstants.REDIS_KEY_OTP_PREFIX + email;

        return redisClient.get(redisKey)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("OTP verification failed - OTP expired or not found for email: {}", email);
                    return ServiceExceptionUtils.otpExpired();
                }))
                .flatMap(cachedOtp -> {
                    if (!cachedOtp.equals(otp)) {
                        log.warn("OTP verification failed - invalid OTP for email: {}", email);
                        return ServiceExceptionUtils.invalidOTP();
                    }

                    return userRepository.findByEmail(email)
                            .switchIfEmpty(Mono.defer(() -> {
                                log.warn("OTP verification failed - user not found for email: {}", email);
                                return ServiceExceptionUtils.customError(ServiceConstants.ERROR_USER_NOT_FOUND);
                            }))
                            .flatMap(user -> {
                                user.setIsEmailVerified(true);
                                user.setUpdatedAt(TimeUtils.now());
                                return userRepository.save(user);
                            })
                            .then(redisClient.delete(redisKey))
                            .then(Mono.just(ServiceConstants.SUCCESS_EMAIL_VERIFIED))
                            .doOnSuccess(v -> log.info("Email verified successfully for userId: {}", email))
                            .doOnError(e -> log.error("Error verifying OTP for email={}: {}", email, e.getMessage(), e));
                });
    }

    /**
     * Resend OTP
     */
    public Mono<String> reproduceOTP(String email) {
        log.info("OTP resend initiated for email: {}", email);

        return userRepository.existsByEmail(email)
                .flatMap(exists -> {
                    if (!exists) {
                        log.warn("OTP resend failed - email not found: {}", email);
                        return ServiceExceptionUtils.customError(ServiceConstants.ERROR_USER_NOT_FOUND);
                    }

                    String otp = generateOTP();
                    String redisKey = ServiceConstants.REDIS_KEY_OTP_PREFIX + email;

                    log.debug("Generated new OTP for email: {}", email);

                    return userRepository.findByEmail(email)
                            .flatMap(user -> redisClient.set(redisKey, otp, Duration.ofMinutes(ServiceConstants.OTP_EXPIRY_MINUTES))
                                    .then(sendOTPEmail(email, otp, user.getId()))
                                    .then(Mono.just(ServiceConstants.SUCCESS_OTP_RESENT))
                                    .doOnSuccess(v -> log.info("OTP resent successfully for userId: {}", user.getId()))
                                    .doOnError(e -> log.error("Error resending OTP for email={}: {}", email, e.getMessage(), e)));
                });
    }

    /**
     * Forgot password - Send OTP to email
     */
    public Mono<String> forgotPassword(String email) {
        log.info("Forgot password initiated for email: {}", email);

        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forgot password failed - user not found for email: {}", email);
                    return ServiceExceptionUtils.customError(ServiceConstants.ERROR_USER_NOT_FOUND);
                }))
                .flatMap(user -> {
                    String otp = generateOTP();
                    String redisKey = ServiceConstants.REDIS_KEY_FORGOT_PASSWORD_PREFIX + email;

                    Map<String, String> emailPayload = new HashMap<>();
                    emailPayload.put("email", email);
                    emailPayload.put("userName", user.getFullName() != null ? user.getFullName() : email);
                    emailPayload.put("otp", otp);
                    emailPayload.put("expiryMinutes", String.valueOf(ServiceConstants.OTP_EXPIRY_MINUTES));

                    RabbitMessage message = RabbitMessage.builder()
                            .eventId(UUID.randomUUID().toString())
                            .eventType(EventType.TASK_SEND_MAIL_RESET_PASSWORD)
                            .timestamp(System.currentTimeMillis())
                            .userId(String.valueOf(user.getId()))
                            .payload(emailPayload)
                            .build();

                    log.debug("Generated reset password OTP for userId: {}", user.getId());

                    return redisClient.set(redisKey, otp, Duration.ofMinutes(ServiceConstants.OTP_EXPIRY_MINUTES))
                            .then(rabbitProducer.sendToQueue(ServiceConstants.NOTIFICATION_QUEUE, message)
                                    .doOnSuccess(v -> log.info("Reset password OTP sent to queue for userId={}, email={}", user.getId(), email))
                                    .doOnError(e -> log.error("Failed to send reset password OTP for userId={}, email={}, error={}", user.getId(), email, e.getMessage(), e))
                                    .onErrorResume(e -> Mono.empty()))
                            .then(Mono.just(ServiceConstants.SUCCESS_FORGOT_PASSWORD_OTP))
                            .doOnSuccess(v -> log.info("Forgot password OTP sent successfully for userId: {}", user.getId()));
                })
                .doOnError(e -> log.error("Error in forgot password for email={}: {}", email, e.getMessage(), e));
    }

    /**
     * Reset password with OTP
     */
    public Mono<String> resetPassword(String email, String otp, String newPassword) {
        log.info("Password reset initiated for email: {}", email);

        String redisKey = ServiceConstants.REDIS_KEY_FORGOT_PASSWORD_PREFIX + email;

        return redisClient.get(redisKey)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Password reset failed - OTP expired or not found for email: {}", email);
                    return ServiceExceptionUtils.otpExpired();
                }))
                .flatMap(cachedOtp -> {
                    if (!cachedOtp.equals(otp)) {
                        log.warn("Password reset failed - invalid OTP for email: {}", email);
                        return ServiceExceptionUtils.invalidOTP();
                    }

                    return userRepository.findByEmail(email)
                            .switchIfEmpty(Mono.defer(() -> {
                                log.warn("Password reset failed - user not found for email: {}", email);
                                return ServiceExceptionUtils.customError(ServiceConstants.ERROR_USER_NOT_FOUND);
                            }))
                            .flatMap(user -> {
                                user.setPasswordHash(passwordEncoder.encode(newPassword));
                                return userRepository.save(user);
                            })
                            .then(redisClient.delete(redisKey))
                            .then(Mono.just(ServiceConstants.SUCCESS_PASSWORD_RESET))
                            .doOnSuccess(v -> log.info("Password reset successfully for userId: {}", email))
                            .doOnError(e -> log.error("Error resetting password for email={}: {}", email, e.getMessage(), e));
                });
    }

    /**
     * Validate access token
     */
    public Mono<ValidateResult> validateToken(String accessToken) {
        try {
            Integer userId = jwtUtils.getUserIdFromToken(accessToken);
            String email = jwtUtils.getEmailFromToken(accessToken);
            String role = jwtUtils.getRoleFromToken(accessToken);

            return Mono.just(new ValidateResult(true, userId, email, role, null));
        } catch (Exception e) {
            return Mono.just(new ValidateResult(false, null, null, null, e.getMessage()));
        }
    }

    /**
     * Change password
     */
    public Mono<String> changePassword(Integer userId, String oldPassword, String newPassword) {
        log.info("Password change initiated for userId: {}", userId);

        return userRepository.findById(userId)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Password change failed - user not found for userId: {}", userId);
                    return ServiceExceptionUtils.userNotFound(userId);
                }))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
                        log.warn("Password change failed - invalid old password for userId: {}", userId);
                        return ServiceExceptionUtils.invalidOldPassword();
                    }

                    user.setPasswordHash(passwordEncoder.encode(newPassword));
                    user.setUpdatedAt(TimeUtils.now());

                    return userRepository.save(user)
                            .then(Mono.just(ServiceConstants.SUCCESS_PASSWORD_CHANGED))
                            .doOnSuccess(v -> log.info("Password changed successfully for userId: {}", userId));
                })
                .doOnError(e -> log.error("Error changing password for userId={}: {}", userId, e.getMessage(), e));
    }

    /**
     * Get user profile
     */
    public Mono<ProfileResult> getProfile(Integer userId) {
        log.info("Fetching profile for userId: {}", userId);

        return userRepository.findById(userId)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Profile fetch failed - user not found for userId: {}", userId);
                    return ServiceExceptionUtils.userNotFound(userId);
                }))
                .map(user -> new ProfileResult(
                        user.getId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getPhone(),
                        user.getAddress(),
                        user.getRole(),
                        user.getIsEmailVerified(),
                        user.getCreatedAt() != null ? user.getCreatedAt().toString() : "",
                        user.getPositiveReviews() != null ? user.getPositiveReviews() : 0,
                        user.getNegativeReviews() != null ? user.getNegativeReviews() : 0
                ))
                .doOnSuccess(result -> log.info("Profile retrieved successfully for userId: {}", userId))
                .doOnError(e -> log.error("Error fetching profile for userId={}: {}", userId, e.getMessage(), e));
    }

    /**
     * Update user profile
     */
    public Mono<ProfileResult> updateProfile(Integer userId, String fullName, String phoneNumber, String address) {
        log.info("Profile update initiated for userId: {}", userId);

        return userRepository.findById(userId)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Profile update failed - user not found for userId: {}", userId);
                    return ServiceExceptionUtils.userNotFound(userId);
                }))
                .flatMap(user -> {
                    if (fullName != null && !fullName.isEmpty()) {
                        user.setFullName(fullName);
                    }
                    if (phoneNumber != null && !phoneNumber.isEmpty()) {
                        user.setPhone(phoneNumber);
                    }
                    if (address != null && !address.isEmpty()) {
                        user.setAddress(address);
                    }
                    user.setUpdatedAt(TimeUtils.now());

                    log.debug("Saving updated profile for userId: {}", userId);

                    return userRepository.save(user)
                            .map(savedUser -> new ProfileResult(
                                    savedUser.getId(),
                                    savedUser.getEmail(),
                                    savedUser.getFullName(),
                                    savedUser.getPhone(),
                                    savedUser.getAddress(),
                                    savedUser.getRole(),
                                    savedUser.getIsEmailVerified(),
                                    savedUser.getCreatedAt() != null ? savedUser.getCreatedAt().toString() : "",
                                    savedUser.getPositiveReviews() != null ? savedUser.getPositiveReviews() : 0,
                                    savedUser.getNegativeReviews() != null ? savedUser.getNegativeReviews() : 0
                            ))
                            .doOnSuccess(result -> log.info("Profile updated successfully for userId: {}", userId));
                })
                .doOnError(e -> log.error("Error updating profile for userId={}: {}", userId, e.getMessage(), e));
    }

    /**
     * Login with Google
     */
    public Mono<LoginResult> loginWithGoogle(String googleIdToken, String email, String fullName, String profilePicture) {
        log.info("Google login initiated for email: {}", email);

        return userRepository.findByEmail(email)
                .flatMap(existingUser -> {
                    boolean needsUpdate = false;
                    if (fullName != null && !fullName.equals(existingUser.getFullName())) {
                        existingUser.setFullName(fullName);
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        existingUser.setUpdatedAt(TimeUtils.now());
                        log.debug("Updating existing Google user: userId={}", existingUser.getId());
                        return userRepository.save(existingUser);
                    }
                    return Mono.just(existingUser);
                })
                .switchIfEmpty(
                    Mono.defer(() -> {
                        User newUser = new User();
                        newUser.setEmail(email);
                        newUser.setFullName(fullName != null ? fullName : email);
                        newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
                        newUser.setRole(ServiceConstants.ROLE_BIDDER);
                        newUser.setIsEmailVerified(true);
                        newUser.setPositiveReviews(0);
                        newUser.setNegativeReviews(0);
                        newUser.setCreatedAt(TimeUtils.now());

                        log.info("Creating new user from Google login: email={}", email);
                        return userRepository.save(newUser);
                    })
                )
                .flatMap(user -> {
                    String accessToken = jwtUtils.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
                    String refreshToken = jwtUtils.generateRefreshToken(user.getId());

                    log.info("Google login successful for userId: {}, email: {}", user.getId(), email);

                    return Mono.just(new LoginResult(
                            accessToken,
                            refreshToken,
                            user.getId(),
                            user.getEmail(),
                            user.getFullName(),
                            user.getRole()
                    ));
                })
                .doOnError(e -> log.error("Error during Google login for email={}: {}", email, e.getMessage(), e));
    }

    // Result classes
    public record RegisterResult(Integer userId, String email, String otp, String message) {}
    public record LoginResult(String accessToken, String refreshToken, Integer userId, String email, String fullName, String role) {}
    public record RefreshResult(String accessToken, String refreshToken) {}
    public record ValidateResult(boolean isValid, Integer userId, String email, String role, String errorMessage) {}
    public record ProfileResult(Integer userId, String email, String fullName, String phone, String address, String role, Boolean isVerified, String createdAt, Integer positiveReviews, Integer negativeReviews) {}
}
