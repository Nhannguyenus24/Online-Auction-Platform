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
    
    private static final String NOTIFICATION_QUEUE = "dev";

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
    
    private static final long OTP_EXPIRY_MINUTES = 10;

    /**
     * Register new user
     */
    public Mono<RegisterResult> register(String email, String password, String fullName, String phone, String address) {
        return userRepository.existsByEmail(email)
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new RuntimeException("Email already exists"));
                    }

                    User user = new User();
                    user.setEmail(email);
                    user.setPasswordHash(passwordEncoder.encode(password));
                    user.setFullName(fullName);
                    user.setPhone(phone);
                    user.setAddress(address);
                    user.setRole("bidder");
                    user.setIsEmailVerified(false);
                    user.setPositiveReviews(0);
                    user.setNegativeReviews(0);
                    user.setCreatedAt(TimeUtils.now());

                    return userRepository.save(user)
                            .flatMap(savedUser -> {
                                // Generate 6-digit OTP
                                String otp = generateOTP();
                                
                                // Cache OTP to Redis with 10 minutes expiry
                                String redisKey = "otp:" + savedUser.getEmail();
                                return redisClient.set(redisKey, otp, Duration.ofMinutes(OTP_EXPIRY_MINUTES))
                                        .then(sendOTPEmail(savedUser.getEmail(), otp))
                                        .then(Mono.just(new RegisterResult(
                                                savedUser.getId(),
                                                savedUser.getEmail(),
                                                otp,
                                                "Registration successful. OTP sent to email. Expires in 10 minutes."
                                        )))
                                        .doOnSuccess(v -> log.info("User registered: {}, OTP generated and cached", email));
                            });
                });
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
    private Mono<Void> sendOTPEmail(String email, String otp) {
        // Lấy user để có userId và userName
        return userRepository.findByEmail(email)
                .flatMap(user -> {
                    Map<String, String> emailPayload = new HashMap<>();
                    emailPayload.put("email", email);
                    emailPayload.put("userName", user.getFullName() != null ? user.getFullName() : email);
                    emailPayload.put("otp", otp);
                    emailPayload.put("expiryMinutes", String.valueOf(OTP_EXPIRY_MINUTES));
                    
                    RabbitMessage message = RabbitMessage.builder()
                            .eventId(UUID.randomUUID().toString())
                            .eventType(EventType.TASK_SEND_MAIL_OTP)
                            .timestamp(System.currentTimeMillis())
                            .userId(String.valueOf(user.getId()))
                            .payload(emailPayload)
                            .build();
                    
                    return rabbitProducer.sendToQueue(NOTIFICATION_QUEUE, message)
                            .doOnSuccess(v -> log.info("OTP email message sent to queue: {} for: {}", NOTIFICATION_QUEUE, email))
                            .doOnError(e -> log.error("Failed to send OTP email message to queue: {} for: {}", NOTIFICATION_QUEUE, email, e))
                            .onErrorResume(e -> Mono.empty()); // Fire and forget
                });
    }

    /**
     * Login user
     */
    public Mono<LoginResult> login(String email, String password) {
        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new RuntimeException("Invalid email or password")))
                .flatMap(user -> {
                    // Check password
                    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
                        return Mono.error(new RuntimeException("Invalid email or password"));
                    }

                    // Check if email is verified
                    if (!Boolean.TRUE.equals(user.getIsEmailVerified())) {
                        return Mono.error(new RuntimeException("Email not verified. Please verify your email first."));
                    }

                    // Generate tokens (Gateway will store refresh token in httpOnly cookie)
                    String accessToken = jwtUtils.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
                    String refreshToken = jwtUtils.generateRefreshToken(user.getId());

                    return Mono.just(new LoginResult(
                            accessToken,
                            refreshToken,
                            user.getId(),
                            user.getEmail(),
                            user.getFullName(),
                            user.getRole()
                    ));
                });
    }

    /**
     * Refresh access token (validate refresh token from cookie)
     */
    public Mono<RefreshResult> refreshToken(String refreshToken) {
        try {
            // Validate refresh token JWT signature and expiration
            Integer userId = jwtUtils.getUserIdFromToken(refreshToken);

            // Get user to generate new tokens
            return userRepository.findById(userId)
                    .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                    .flatMap(user -> {
                        // Generate new access token
                        String newAccessToken = jwtUtils.generateAccessToken(
                                user.getId(),
                                user.getEmail(),
                                user.getRole()
                        );

                        // Generate new refresh token (rotation for better security)
                        String newRefreshToken = jwtUtils.generateRefreshToken(user.getId());

                        return Mono.just(new RefreshResult(newAccessToken, newRefreshToken));
                    });
        } catch (Exception e) {
            return Mono.error(new RuntimeException("Invalid or expired refresh token"));
        }
    }

    /**
     * Verify OTP
     */
    public Mono<String> verifyOTP(String email, String otp) {
        String redisKey = "otp:" + email;
        
        return redisClient.get(redisKey)
                .switchIfEmpty(Mono.error(new RuntimeException("OTP expired or not found")))
                .flatMap(cachedOtp -> {
                    if (!cachedOtp.equals(otp)) {
                        return Mono.error(new RuntimeException("Invalid OTP"));
                    }

                    // Update user email verification status
                    return userRepository.findByEmail(email)
                            .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                            .flatMap(user -> {
                                user.setIsEmailVerified(true);
                                user.setUpdatedAt(TimeUtils.now());
                                return userRepository.save(user);
                            })
                            .then(redisClient.delete(redisKey))
                            .then(Mono.just("Email verified successfully"))
                            .doOnSuccess(v -> log.info("User {} email verified via OTP", email));
                });
    }

    public Mono<String> reproduceOTP(String email) {

        return userRepository.existsByEmail(email)
                .flatMap(exists -> {
                    if (!exists) {
                        return Mono.error(new RuntimeException("Email not exists"));
                    }

                    // Generate 6-digit OTP
                    String otp = generateOTP();

                    // Cache OTP to Redis with 10 minutes expiry
                    String redisKey = "otp:" + email;
                    return redisClient.set(redisKey, otp, Duration.ofMinutes(OTP_EXPIRY_MINUTES))
                            .then(sendOTPEmail(email, otp))
                            .then(Mono.just("OTP resent to email. Expires in 10 minutes."))
                            .doOnSuccess(v -> log.info("OTP regenerated and cached for: {}", email));

                });
    }

    /**
     * Forgot password - Send OTP to email
     */
    public Mono<String> forgotPassword(String email) {
        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new RuntimeException("Email not found")))
                .flatMap(user -> {
                    // Generate 6-digit OTP
                    String otp = generateOTP();

                    // Cache OTP to Redis with 10 minutes expiry
                    String redisKey = "forgot_password:" + email;
                    
                    Map<String, String> emailPayload = new HashMap<>();
                    emailPayload.put("email", email);
                    emailPayload.put("userName", user.getFullName() != null ? user.getFullName() : email);
                    emailPayload.put("otp", otp);
                    emailPayload.put("expiryMinutes", String.valueOf(OTP_EXPIRY_MINUTES));

                    RabbitMessage message = RabbitMessage.builder()
                            .eventId(UUID.randomUUID().toString())
                            .eventType(EventType.TASK_SEND_MAIL_RESET_PASSWORD)
                            .timestamp(System.currentTimeMillis())
                            .userId(String.valueOf(user.getId()))
                            .payload(emailPayload)
                            .build();

                    return redisClient.set(redisKey, otp, Duration.ofMinutes(OTP_EXPIRY_MINUTES))
                            .then(rabbitProducer.sendToQueue(NOTIFICATION_QUEUE, message)
                                    .doOnSuccess(v -> log.info("Reset password OTP email message sent to queue: {} for: {}", NOTIFICATION_QUEUE, email))
                                    .doOnError(e -> log.error("Failed to send reset password OTP email message to queue: {} for: {}", NOTIFICATION_QUEUE, email, e))
                                    .onErrorResume(e -> Mono.empty()))
                            .then(Mono.just("OTP sent to email successfully. Expires in 10 minutes."))
                            .doOnSuccess(v -> log.info("Forgot password OTP sent to: {}", email));
                });
    }

    /**
     * Reset password with OTP
     */
    public Mono<String> resetPassword(String email, String otp, String newPassword) {
        String redisKey = "forgot_password:" + email;
        
        return redisClient.get(redisKey)
                .switchIfEmpty(Mono.error(new RuntimeException("OTP expired or not found")))
                .flatMap(cachedOtp -> {
                    if (!cachedOtp.equals(otp)) {
                        return Mono.error(new RuntimeException("Invalid OTP"));
                    }

                    // Update user password
                    return userRepository.findByEmail(email)
                            .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                            .flatMap(user -> {
                                user.setPasswordHash(passwordEncoder.encode(newPassword));
                                return userRepository.save(user);
                            })
                            .then(redisClient.delete(redisKey))
                            .then(Mono.just("Password reset successfully"))
                            .doOnSuccess(v -> log.info("Password reset successfully for user: {}", email));
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
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                .flatMap(user -> {
                    // Check old password
                    if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
                        return Mono.error(new RuntimeException("Invalid old password"));
                    }

                    // Update password
                    user.setPasswordHash(passwordEncoder.encode(newPassword));
                    user.setUpdatedAt(TimeUtils.now());

                    return userRepository.save(user)
                            .then(Mono.just("Password changed successfully"));
                });
    }

    /**
     * Get user profile
     */
    public Mono<ProfileResult> getProfile(Integer userId) {
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                .map(user -> new ProfileResult(
                        user.getId(),
                        user.getEmail(),
                        user.getFullName(),
                        user.getPhone(),
                        user.getAddress(),
                        user.getRole(),
                        user.getIsEmailVerified(),
                        user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""
                ));
    }

    /**
     * Update user profile
     */
    public Mono<ProfileResult> updateProfile(Integer userId, String fullName, String phoneNumber, String address) {
        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                .flatMap(user -> {
                    // Update user information
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

                    return userRepository.save(user)
                            .map(savedUser -> new ProfileResult(
                                    savedUser.getId(),
                                    savedUser.getEmail(),
                                    savedUser.getFullName(),
                                    savedUser.getPhone(),
                                    savedUser.getAddress(),
                                    savedUser.getRole(),
                                    savedUser.getIsEmailVerified(),
                                    savedUser.getCreatedAt() != null ? savedUser.getCreatedAt().toString() : ""
                            ));
                });
    }

    /**
     * Login with Google
     */
    public Mono<LoginResult> loginWithGoogle(String googleIdToken, String email, String fullName, String profilePicture) {
        return userRepository.findByEmail(email)
                .flatMap(existingUser -> {
                    // User exists, update info if needed
                    boolean needsUpdate = false;
                    if (fullName != null && !fullName.equals(existingUser.getFullName())) {
                        existingUser.setFullName(fullName);
                        needsUpdate = true;
                    }
                    
                    if (needsUpdate) {
                        existingUser.setUpdatedAt(TimeUtils.now());
                        return userRepository.save(existingUser);
                    }
                    return Mono.just(existingUser);
                })
                .switchIfEmpty(
                    // Create new user if doesn't exist
                    Mono.defer(() -> {
                        User newUser = new User();
                        newUser.setEmail(email);
                        newUser.setFullName(fullName != null ? fullName : email);
                        newUser.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString())); // Random password for Google users
                        newUser.setRole("bidder");
                        newUser.setIsEmailVerified(true); // Google accounts are already verified
                        newUser.setPositiveReviews(0);
                        newUser.setNegativeReviews(0);
                        newUser.setCreatedAt(TimeUtils.now());
                        
                        return userRepository.save(newUser);
                    })
                )
                .flatMap(user -> {
                    // Generate tokens
                    String accessToken = jwtUtils.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
                    String refreshToken = jwtUtils.generateRefreshToken(user.getId());

                    return Mono.just(new LoginResult(
                            accessToken,
                            refreshToken,
                            user.getId(),
                            user.getEmail(),
                            user.getFullName(),
                            user.getRole()
                    ));
                });
    }

    // Result classes
    public record RegisterResult(Integer userId, String email, String otp, String message) {}
    public record LoginResult(String accessToken, String refreshToken, Integer userId, String email, String fullName, String role) {}
    public record RefreshResult(String accessToken, String refreshToken) {}
    public record ValidateResult(boolean isValid, Integer userId, String email, String role, String errorMessage) {}
    public record ProfileResult(Integer userId, String email, String fullName, String phone, String address, String role, Boolean isVerified, String createdAt) {}
}
