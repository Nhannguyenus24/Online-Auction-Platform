package gateway.grpc;

import com.example.grpc.auth.*;
import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class UserGrpcClient {

    @Value("${grpc.user-service.host:localhost}")
    private String userServiceHost;

    @Value("${grpc.user-service.port:9090}")
    private int userServicePort;

    private ManagedChannel channel;
    private ReactorAuthServiceGrpc.ReactorAuthServiceStub authServiceStub;

    @PostConstruct
    public void init() {
        channel = ManagedChannelBuilder
                .forAddress(userServiceHost, userServicePort)
                .usePlaintext()
                .build();
        
        authServiceStub = ReactorAuthServiceGrpc.newReactorStub(channel);
        
        log.info("gRPC User Service client initialized: {}:{}", userServiceHost, userServicePort);
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            channel.shutdown();
            log.info("gRPC channel shutdown");
        }
    }

    // Register
    public Mono<RegisterResponse> register(RegisterRequest request) {
        return authServiceStub.register(Mono.just(request));
    }

    // Login
    public Mono<LoginResponse> login(LoginRequest request) {
        return authServiceStub.login(Mono.just(request));
    }

    // Refresh Token
    public Mono<RefreshTokenResponse> refreshToken(RefreshTokenRequest request) {
        return authServiceStub.refreshToken(Mono.just(request));
    }

    // Logout
    public Mono<LogoutResponse> logout(LogoutRequest request) {
        return authServiceStub.logout(Mono.just(request));
    }

    // Validate Token
    public Mono<ValidateTokenResponse> validateToken(ValidateTokenRequest request) {
        return authServiceStub.validateToken(Mono.just(request));
    }

    // Change Password
    public Mono<ChangePasswordResponse> changePassword(ChangePasswordRequest request) {
        return authServiceStub.changePassword(Mono.just(request));
    }

    // Verify Email
    public Mono<VerifyEmailResponse> verifyEmail(VerifyEmailRequest request) {
        return authServiceStub.verifyEmail(Mono.just(request));
    }
}
