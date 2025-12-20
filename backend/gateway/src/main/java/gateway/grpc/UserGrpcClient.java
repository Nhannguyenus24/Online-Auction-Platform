package gateway.grpc;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auction.proto.auth.ChangePasswordRequest;
import com.auction.proto.auth.ChangePasswordResponse;
import com.auction.proto.auth.LoginRequest;
import com.auction.proto.auth.LoginResponse;
import com.auction.proto.auth.LogoutRequest;
import com.auction.proto.auth.LogoutResponse;
import com.auction.proto.auth.ReactorAuthServiceGrpc;
import com.auction.proto.auth.RefreshTokenRequest;
import com.auction.proto.auth.RefreshTokenResponse;
import com.auction.proto.auth.RegisterRequest;
import com.auction.proto.auth.RegisterResponse;
import com.auction.proto.auth.ValidateTokenRequest;
import com.auction.proto.auth.ValidateTokenResponse;
import com.auction.proto.auth.VerifyEmailRequest;
import com.auction.proto.auth.VerifyEmailResponse;
import com.auction.proto.auth.VerifyOTPRequest;
import com.auction.proto.auth.VerifyOTPResponse;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import reactor.core.publisher.Mono;

@Component
public class UserGrpcClient {
    private static final Logger log = LoggerFactory.getLogger(UserGrpcClient.class);
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

    // Verify Email (deprecated)
    public Mono<VerifyEmailResponse> verifyEmail(VerifyEmailRequest request) {
        return authServiceStub.verifyEmail(Mono.just(request));
    }

    // Verify OTP
    public Mono<VerifyOTPResponse> verifyOTP(VerifyOTPRequest request) {
        return authServiceStub.verifyOTP(Mono.just(request));
    }
}
