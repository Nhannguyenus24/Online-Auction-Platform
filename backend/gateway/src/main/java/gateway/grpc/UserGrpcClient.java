package gateway.grpc;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auction.proto.auth.ChangePasswordRequest;
import com.auction.proto.auth.ChangePasswordResponse;
import com.auction.proto.auth.GetProfileRequest;
import com.auction.proto.auth.GetProfileResponse;
import com.auction.proto.auth.LoginRequest;
import com.auction.proto.auth.LoginResponse;
import com.auction.proto.auth.LoginWithGoogleRequest;
import com.auction.proto.auth.LogoutRequest;
import com.auction.proto.auth.LogoutResponse;
import com.auction.proto.auth.ReactorAuthServiceGrpc;
import com.auction.proto.auth.RefreshTokenRequest;
import com.auction.proto.auth.RefreshTokenResponse;
import com.auction.proto.auth.RegisterRequest;
import com.auction.proto.auth.RegisterResponse;
import com.auction.proto.auth.ReproduceOTPRequest;
import com.auction.proto.auth.ReproduceOTPResponse;
import com.auction.proto.auth.UpdateProfileRequest;
import com.auction.proto.auth.UpdateProfileResponse;
import com.auction.proto.auth.ValidateTokenRequest;
import com.auction.proto.auth.ValidateTokenResponse;
import com.auction.proto.auth.VerifyOTPRequest;
import com.auction.proto.auth.VerifyOTPResponse;
import com.auction.utils.JsonUtils;

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
        log.info("gRPC register request: {}", JsonUtils.toJson(request));
        return authServiceStub.register(Mono.just(request));
    }

    // Login
    public Mono<LoginResponse> login(LoginRequest request) {
        log.info("gRPC login request: {}", JsonUtils.toJson(request));
        return authServiceStub.login(Mono.just(request));
    }

    // Refresh Token
    public Mono<RefreshTokenResponse> refreshToken(RefreshTokenRequest request) {
        log.info("gRPC refreshToken request: {}", JsonUtils.toJson(request));
        return authServiceStub.refreshToken(Mono.just(request));
    }

    // Logout
    public Mono<LogoutResponse> logout(LogoutRequest request) {
        log.info("gRPC logout request: {}", JsonUtils.toJson(request));
        return authServiceStub.logout(Mono.just(request));
    }

    // Validate Token
    public Mono<ValidateTokenResponse> validateToken(ValidateTokenRequest request) {
        log.info("gRPC validateToken request: {}", JsonUtils.toJson(request));
        return authServiceStub.validateToken(Mono.just(request));
    }

    // Change Password
    public Mono<ChangePasswordResponse> changePassword(ChangePasswordRequest request) {
        log.info("gRPC changePassword request: {}", JsonUtils.toJson(request));
        return authServiceStub.changePassword(Mono.just(request));
    }

    // Verify OTP
    public Mono<VerifyOTPResponse> verifyOTP(VerifyOTPRequest request) {
        log.info("gRPC verifyOTP request: {}", JsonUtils.toJson(request));
        return authServiceStub.verifyOTP(Mono.just(request));
    }

    // Reproduce OTP
    public Mono<ReproduceOTPResponse> reproduceOTP(ReproduceOTPRequest request) {
        log.info("gRPC reproduceOTP request: {}", JsonUtils.toJson(request));
        return authServiceStub.reproduceOTP(Mono.just(request));
    }

    // Get Profile
    public Mono<GetProfileResponse> getProfile(GetProfileRequest request) {
        log.info("gRPC getProfile request: {}", JsonUtils.toJson(request));
        return authServiceStub.getProfile(Mono.just(request));
    }

    // Update Profile
    public Mono<UpdateProfileResponse> updateProfile(UpdateProfileRequest request) {
        log.info("gRPC updateProfile request: {}", JsonUtils.toJson(request));
        return authServiceStub.updateProfile(Mono.just(request));
    }

    // Login with Google
    public Mono<LoginResponse> loginWithGoogle(LoginWithGoogleRequest request) {
        log.info("gRPC loginWithGoogle request: {}", JsonUtils.toJson(request));
        return authServiceStub.loginWithGoogle(Mono.just(request));
    }
}
