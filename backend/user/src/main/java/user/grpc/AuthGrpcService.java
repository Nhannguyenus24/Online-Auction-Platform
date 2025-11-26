package user.grpc;

import com.example.grpc.auth.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Simple reactive implementation of the generated Auth gRPC service for manual testing.
 */
@Component
public class AuthGrpcService extends ReactorAuthServiceGrpc.AuthServiceImplBase {

    @Override
    public Mono<RegisterResponse> register(Mono<RegisterRequest> request) {
        return request.map(r -> RegisterResponse.newBuilder()
            .setSuccess(true)
            .setEmail(r.getEmail())
            .setUserId("1")
            .setMessage("registered: " + r.getFullName())
            .build());
    }

    @Override
    public Mono<LoginResponse> login(Mono<LoginRequest> request) {
        return request.map(r -> LoginResponse.newBuilder()
            .setAccessToken("dummy-access-token-for-" + r.getEmail())
            .setRefreshToken("dummy-refresh-token")
            .build());
    }

    @Override
    public Mono<RefreshTokenResponse> refreshToken(Mono<RefreshTokenRequest> request) {
        return request.map(r -> RefreshTokenResponse.newBuilder()
                .setAccessToken("refreshed-access-token")
                .build());
    }

    @Override
    public Mono<LogoutResponse> logout(Mono<LogoutRequest> request) {
        return request.map(r -> LogoutResponse.newBuilder()
                .setSuccess(true)
                .build());
    }

    @Override
    public Mono<ValidateTokenResponse> validateToken(Mono<ValidateTokenRequest> request) {
        return request.map(r -> ValidateTokenResponse.newBuilder()
            .setIsValid(true)
            .setUserId("1")
            .addRoles("USER")
            .build());
    }

    @Override
    public Mono<ChangePasswordResponse> changePassword(Mono<ChangePasswordRequest> request) {
        return request.map(r -> ChangePasswordResponse.newBuilder()
                .setSuccess(true)
                .build());
    }
}
