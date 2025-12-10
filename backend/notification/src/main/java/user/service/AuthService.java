package user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import user.entity.EmailVerificationToken;
import user.entity.User;
import user.repository.EmailVerificationTokenRepository;
import user.repository.UserRepository;
import user.util.JwtTokenProvider;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${app.base-url}")
    private String baseUrl;

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
                    user.setOtpVerified(false);
                    user.setPositiveReviews(0);
                    user.setNegativeReviews(0);
                    user.setRatingPercent(BigDecimal.ZERO);
                    user.setCreatedAt(LocalDateTime.now());

                    return userRepository.save(user)
                            .flatMap(savedUser -> {
                                // Generate email verification token
                                String token = jwtTokenProvider.generateEmailVerificationToken(savedUser.getId());
                                String verificationLink = baseUrl + "/api/auth/verify-email?token=" + token;

                                // Save token to database
                                EmailVerificationToken emailToken = new EmailVerificationToken();
                                emailToken.setToken(token);
                                emailToken.setUserId(savedUser.getId());
                                emailToken.setExpiresAt(LocalDateTime.now().plusHours(24));
                                emailToken.setCreatedAt(LocalDateTime.now());

                                return emailVerificationTokenRepository.save(emailToken)
                                        .then(Mono.just(new RegisterResult(
                                                savedUser.getId(),
                                                savedUser.getEmail(),
                                                verificationLink,
                                                "Registration successful. Please verify your email."
                                        )));
                            });
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
                    String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
                    String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

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
            Integer userId = jwtTokenProvider.getUserIdFromToken(refreshToken);

            // Get user to generate new tokens
            return userRepository.findById(userId)
                    .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                    .flatMap(user -> {
                        // Generate new access token
                        String newAccessToken = jwtTokenProvider.generateAccessToken(
                                user.getId(),
                                user.getEmail(),
                                user.getRole()
                        );

                        // Generate new refresh token (rotation for better security)
                        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

                        return Mono.just(new RefreshResult(newAccessToken, newRefreshToken));
                    });
        } catch (Exception e) {
            return Mono.error(new RuntimeException("Invalid or expired refresh token"));
        }
    }

    /**
     * Logout user (Gateway will clear cookies, no need to invalidate token here)
     */
    public Mono<Void> logout(String refreshToken) {
        // Since we don't store tokens in DB, just return success
        // Gateway will clear the cookies
        return Mono.empty();
    }

    /**
     * Verify email
     */
    public Mono<String> verifyEmail(String token) {
        try {
            // Validate token
            Integer userId = jwtTokenProvider.getUserIdFromToken(token);

            return emailVerificationTokenRepository.findByToken(token)
                    .switchIfEmpty(Mono.error(new RuntimeException("Invalid verification token")))
                    .flatMap(tokenEntity -> {
                        // Check if token is expired
                        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
                            return emailVerificationTokenRepository.delete(tokenEntity)
                                    .then(Mono.error(new RuntimeException("Verification token expired")));
                        }

                        // Update user email verification status
                        return userRepository.findById(userId)
                                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                                .flatMap(user -> {
                                    user.setIsEmailVerified(true);
                                    user.setUpdatedAt(LocalDateTime.now());
                                    return userRepository.save(user);
                                })
                                .then(emailVerificationTokenRepository.delete(tokenEntity))
                                .then(Mono.just("Email verified successfully"));
                    });
        } catch (Exception e) {
            return Mono.error(new RuntimeException("Invalid verification token"));
        }
    }

    /**
     * Validate access token
     */
    public Mono<ValidateResult> validateToken(String accessToken) {
        try {
            Integer userId = jwtTokenProvider.getUserIdFromToken(accessToken);
            String email = jwtTokenProvider.getEmailFromToken(accessToken);
            String role = jwtTokenProvider.getRoleFromToken(accessToken);

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
                    user.setUpdatedAt(LocalDateTime.now());

                    return userRepository.save(user)
                            .then(Mono.just("Password changed successfully"));
                });
    }

    // Result classes
    public record RegisterResult(Integer userId, String email, String verificationLink, String message) {}
    public record LoginResult(String accessToken, String refreshToken, Integer userId, String email, String fullName, String role) {}
    public record RefreshResult(String accessToken, String refreshToken) {}
    public record ValidateResult(boolean isValid, Integer userId, String email, String role, String errorMessage) {}
}
