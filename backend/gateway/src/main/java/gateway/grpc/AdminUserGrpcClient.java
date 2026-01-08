package gateway.grpc;

import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auction.proto.admin.user.*;
import com.auction.utils.JsonUtils;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import reactor.core.publisher.Mono;

@Component
public class AdminUserGrpcClient {
    private static final Logger log = LoggerFactory.getLogger(AdminUserGrpcClient.class);
    
    @Value("${grpc.user-service.host:localhost}")
    private String userServiceHost;

    @Value("${grpc.user-service.port:9090}")
    private int userServicePort;

    private ManagedChannel channel;
    private ReactorAdminUserServiceGrpc.ReactorAdminUserServiceStub adminUserServiceStub;

    @PostConstruct
    public void init() {
        channel = ManagedChannelBuilder
                .forAddress(userServiceHost, userServicePort)
                .usePlaintext()
                .keepAliveTime(10, TimeUnit.SECONDS)
                .keepAliveTimeout(10, TimeUnit.SECONDS)
                .build();
        
        adminUserServiceStub = ReactorAdminUserServiceGrpc.newReactorStub(channel);
        
        log.info("gRPC Admin User Service client initialized: {}:{}", userServiceHost, userServicePort);
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            channel.shutdown();
            log.info("gRPC Admin User Service channel shutdown");
        }
    }

    public Mono<UserStatisticsResponse> getUserStatistics(UserStatisticsRequest request) {
        log.info("gRPC getUserStatistics request: {}", JsonUtils.toJson(request));
        return adminUserServiceStub.getUserStatistics(Mono.just(request));
    }

    public Mono<RegistrationStatisticsResponse> getRegistrationStatistics(RegistrationStatisticsRequest request) {
        log.info("gRPC getRegistrationStatistics request: {}", JsonUtils.toJson(request));
        return adminUserServiceStub.getRegistrationStatistics(Mono.just(request));
    }

    public Mono<GetUpgradeRequestsResponse> getUpgradeRequests(GetUpgradeRequestsRequest request) {
        log.info("gRPC getUpgradeRequests request: {}", JsonUtils.toJson(request));
        return adminUserServiceStub.getUpgradeRequests(Mono.just(request));
    }

    public Mono<ApproveUpgradeRequestResponse> approveUpgradeRequest(ApproveUpgradeRequestRequest request) {
        log.info("gRPC approveUpgradeRequest request: {}", JsonUtils.toJson(request));
        return adminUserServiceStub.approveUpgradeRequest(Mono.just(request));
    }

    public Mono<ProfitStatisticsResponse> getProfitStatistics(ProfitStatisticsRequest request) {
        log.info("gRPC getProfitStatistics request: {}", JsonUtils.toJson(request));
        return adminUserServiceStub.getProfitStatistics(Mono.just(request));
    }

    public Mono<GetAllUsersResponse> getAllUsers(GetAllUsersRequest request) {
        log.info("gRPC getAllUsers request: {}", JsonUtils.toJson(request));
        return adminUserServiceStub.getAllUsers(Mono.just(request));
    }
}
