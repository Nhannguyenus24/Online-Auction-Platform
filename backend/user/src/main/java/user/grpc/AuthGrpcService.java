package user.grpc;

import com.auction.proto.auth.*;
import org.springframework.grpc.server.service.GrpcService;
import reactor.core.publisher.Mono;
import user.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.auction.utils.JsonUtils;

/**
 * gRPC implementation of AuthService with full JWT authentication
 * Gateway will call this service and handle cookies
 */
@GrpcService
public class AuthGrpcService extends ReactorAuthServiceGrpc.AuthServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(AuthGrpcService.class);
    private final AuthService authService;

    public AuthGrpcService(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public Mono<RegisterResponse> register(Mono<RegisterRequest> request) {
        return request.doOnNext(req -> log.info("Raw register request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            authService.register(
                req.getEmail(),
                req.getPassword(),
                req.getFullName(),
                req.getPhoneNumber(),
                req.getAddress()
            )
            .map(result -> RegisterResponse.newBuilder()
                .setSuccess(true)
                .setUserId(String.valueOf(result.userId()))
                .setEmail(result.email())
                .setOtp(result.otp())  // OTP 6 chữ số gửi qua email
                .setMessage(result.message())
                .build())
            .onErrorResume(e -> {
                log.error("Register error: {}", e.getMessage());
                return Mono.just(RegisterResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage(e.getMessage())
                    .build());
            })
        );
    }

    @Override
    public Mono<LoginResponse> login(Mono<LoginRequest> request) {
        return request.doOnNext(req -> log.info("Raw login request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            authService.login(req.getEmail(), req.getPassword())
                .map(result -> LoginResponse.newBuilder()
                    .setAccessToken(result.accessToken())
                    .setRefreshToken(result.refreshToken())
                    .setMessage("Login success")
                    .setUserInfo(UserInfo.newBuilder()
                        .setId(String.valueOf(result.userId()))
                        .setEmail(result.email())
                        .setFullName(result.fullName())
                        .addRoles(result.role())
                        .build())
                    .build())
                .onErrorResume(e -> {
                    log.error("Login error: {}", e.getMessage());
                    return Mono.just(LoginResponse.newBuilder()
                            .setMessage("Login failed: " + e.getMessage())
                            .build());
                })
        );
    }

    @Override
    public Mono<RefreshTokenResponse> refreshToken(Mono<RefreshTokenRequest> request) {
        return request.doOnNext(req -> log.info("Raw refresh token request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            authService.refreshToken(req.getRefreshToken())
                .map(result -> RefreshTokenResponse.newBuilder()
                    .setAccessToken(result.accessToken())
                    .setRefreshToken(result.refreshToken())
                    .setMessage("Refresh success")
                    .setAccessTokenExpiresIn(900) // 15 minutes in seconds
                    .build())
                .onErrorResume(e -> {
                    log.error("Refresh token error: {}", e.getMessage());
                    return Mono.just(RefreshTokenResponse.newBuilder()
                            .setMessage("Request refresh token failed: " + e.getMessage())
                            .build());
                })
        );
    }

    @Override
    public Mono<LogoutResponse> logout(Mono<LogoutRequest> request) {
        return request.doOnNext(req -> log.info("Raw logout request: {}", JsonUtils.toJson(req)))
                .flatMap(req -> {
            log.info("Logout request for user: {}", req.getUserId());
            return authService.logout(req.getRefreshToken())
                .then(Mono.just(LogoutResponse.newBuilder()
                    .setSuccess(true)
                    .build()))
                .onErrorResume(e -> {
                    log.error("Logout error: {}", e.getMessage());
                    return Mono.just(LogoutResponse.newBuilder()
                        .setSuccess(false)
                        .setMessage("Logout failed: " + e.getMessage())
                        .build());
                });
        });
    }

    @Override
    public Mono<ValidateTokenResponse> validateToken(Mono<ValidateTokenRequest> request) {
        return request.doOnNext(req -> log.info("Raw validate token request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            authService.validateToken(req.getAccessToken())
                .map(result -> {
                    if (result.isValid()) {
                        return ValidateTokenResponse.newBuilder()
                            .setIsValid(true)
                            .setUserId(String.valueOf(result.userId()))
                            .addRoles(result.role())
                            .build();
                    } else {
                        return ValidateTokenResponse.newBuilder()
                            .setIsValid(false)
                            .setErrorMessage(result.errorMessage())
                            .build();
                    }
                })
        );
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
                .onErrorResume(e -> {
                    log.error("Reproduce OTP error: {}", e.getMessage());
                    return Mono.just(ReproduceOTPResponse.newBuilder().setSuccess(false).setMessage(e.getMessage()).build());
                });
    }
}
