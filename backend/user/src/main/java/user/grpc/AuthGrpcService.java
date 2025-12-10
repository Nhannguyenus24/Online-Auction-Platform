package user.grpc;

import com.example.grpc.auth.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.grpc.server.service.GrpcService;
import reactor.core.publisher.Mono;
import user.service.AuthService;

/**
 * gRPC implementation of AuthService with full JWT authentication
 * Gateway will call this service and handle cookies
 */
@GrpcService
@RequiredArgsConstructor
@Slf4j
public class AuthGrpcService extends ReactorAuthServiceGrpc.AuthServiceImplBase {

    private final AuthService authService;

    @Override
    public Mono<RegisterResponse> register(Mono<RegisterRequest> request) {
        return request.flatMap(req -> 
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
                .setEmailVerificationLink(result.verificationLink())
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
        return request.flatMap(req ->
            authService.login(req.getEmail(), req.getPassword())
                .map(result -> LoginResponse.newBuilder()
                    .setAccessToken(result.accessToken())
                    .setRefreshToken(result.refreshToken())
                    .setUserInfo(UserInfo.newBuilder()
                        .setId(String.valueOf(result.userId()))
                        .setEmail(result.email())
                        .setFullName(result.fullName())
                        .addRoles(result.role())
                        .build())
                    .build())
                .onErrorResume(e -> {
                    log.error("Login error: {}", e.getMessage());
                    return Mono.error(new RuntimeException(e.getMessage()));
                })
        );
    }

    @Override
    public Mono<RefreshTokenResponse> refreshToken(Mono<RefreshTokenRequest> request) {
        return request.flatMap(req ->
            authService.refreshToken(req.getRefreshToken())
                .map(result -> RefreshTokenResponse.newBuilder()
                    .setAccessToken(result.accessToken())
                    .setRefreshToken(result.refreshToken())
                    .setAccessTokenExpiresIn(900) // 15 minutes in seconds
                    .build())
                .onErrorResume(e -> {
                    log.error("Refresh token error: {}", e.getMessage());
                    return Mono.error(new RuntimeException(e.getMessage()));
                })
        );
    }

    @Override
    public Mono<LogoutResponse> logout(Mono<LogoutRequest> request) {
        return request.flatMap(req ->
            authService.logout(req.getRefreshToken())
                .then(Mono.just(LogoutResponse.newBuilder()
                    .setSuccess(true)
                    .build()))
                .onErrorResume(e -> {
                    log.error("Logout error: {}", e.getMessage());
                    return Mono.just(LogoutResponse.newBuilder()
                        .setSuccess(false)
                        .build());
                })
        );
    }

    @Override
    public Mono<ValidateTokenResponse> validateToken(Mono<ValidateTokenRequest> request) {
        return request.flatMap(req ->
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
        return request.flatMap(req ->
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
    public Mono<VerifyEmailResponse> verifyEmail(Mono<VerifyEmailRequest> request) {
        return request.flatMap(req ->
            authService.verifyEmail(req.getToken())
                .map(message -> VerifyEmailResponse.newBuilder()
                    .setSuccess(true)
                    .build())
                .onErrorResume(e -> {
                    log.error("Verify email error: {}", e.getMessage());
                    return Mono.just(VerifyEmailResponse.newBuilder()
                        .setSuccess(false)
                        .build());
                })
        );
    }
}
