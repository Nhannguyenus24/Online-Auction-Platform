package user.grpc;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.grpc.server.service.GrpcService;

import com.auction.proto.admin.user.ApproveUpgradeRequestRequest;
import com.auction.proto.admin.user.ApproveUpgradeRequestResponse;
import com.auction.proto.admin.user.GetAllUsersRequest;
import com.auction.proto.admin.user.GetAllUsersResponse;
import com.auction.proto.admin.user.GetUpgradeRequestsRequest;
import com.auction.proto.admin.user.GetUpgradeRequestsResponse;
import com.auction.proto.admin.user.ProfitStatisticsRequest;
import com.auction.proto.admin.user.ProfitStatisticsResponse;
import com.auction.proto.admin.user.ReactorAdminUserServiceGrpc;
import com.auction.proto.admin.user.RegistrationStatisticsRequest;
import com.auction.proto.admin.user.RegistrationStatisticsResponse;
import com.auction.proto.admin.user.UserStatisticsRequest;
import com.auction.proto.admin.user.UserStatisticsResponse;
import com.auction.utils.JsonUtils;

import reactor.core.publisher.Mono;
import user.service.AdminService;

/**
 * gRPC implementation of AdminUserService
 * Handles admin operations for user management and statistics
 */
@GrpcService
public class AdminGrpcService extends ReactorAdminUserServiceGrpc.AdminUserServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(AdminGrpcService.class);
    private final AdminService adminService;

    public AdminGrpcService(AdminService adminService) {
        this.adminService = adminService;
    }

    @Override
    public Mono<UserStatisticsResponse> getUserStatistics(Mono<UserStatisticsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get user statistics request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            adminService.getUserStatistics()
                .map(result -> result)
                .onErrorResume(e -> {
                    log.error("Get user statistics error: {}", e.getMessage());
                    return Mono.just(UserStatisticsResponse.newBuilder().build());
                })
        );
    }

    @Override
    public Mono<RegistrationStatisticsResponse> getRegistrationStatistics(Mono<RegistrationStatisticsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get registration statistics request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            adminService.getRegistrationStatistics(req)
                .map(result -> result)
                .onErrorResume(e -> {
                    log.error("Get registration statistics error: {}", e.getMessage());
                    return Mono.just(RegistrationStatisticsResponse.newBuilder().build());
                })
        );
    }

    @Override
    public Mono<GetUpgradeRequestsResponse> getUpgradeRequests(Mono<GetUpgradeRequestsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get upgrade requests request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            adminService.getUpgradeRequests(req)
                .map(result -> result)
                .doOnNext(result -> log.info("Get upgrade requests successful: {}", JsonUtils.toJson(result)))
                .onErrorResume(e -> {
                    log.error("Get upgrade requests error: {}", e.getMessage());
                    return Mono.just(GetUpgradeRequestsResponse.newBuilder().build());
                })
        );
    }

    @Override
    public Mono<ApproveUpgradeRequestResponse> approveUpgradeRequest(Mono<ApproveUpgradeRequestRequest> request) {
        return request.doOnNext(req -> log.info("Raw approve upgrade request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            adminService.approveUpgradeRequest(req)
                .map(result -> result)
                .doOnNext(result -> log.info("Approve upgrade request successful: {}", JsonUtils.toJson(result)))
                .onErrorResume(e -> {
                    log.error("Approve upgrade request error: {}", e.getMessage());
                    return Mono.just(ApproveUpgradeRequestResponse.newBuilder()
                        .setSuccess(false)
                        .setMessage("Error: " + e.getMessage())
                        .build());
                })
        );
    }

    @Override
    public Mono<ProfitStatisticsResponse> getProfitStatistics(Mono<ProfitStatisticsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get profit statistics request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            adminService.getProfitStatistics(req)
                .map(result -> result)
                .doOnNext(result -> log.info("Profit statistics successful: {}", JsonUtils.toJson(result)))
                .onErrorResume(e -> {
                    log.error("Get profit statistics error: {}", e.getMessage());
                    return Mono.just(ProfitStatisticsResponse.newBuilder().build());
                })
        );
    }

    @Override
    public Mono<GetAllUsersResponse> getAllUsers(Mono<GetAllUsersRequest> request) {
        return request.doOnNext(req -> log.info("Raw get all users request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
            adminService.getAllUsers(req)
                .map(result -> result)
                .doOnNext(result -> log.info("Get all users successful - count: {}", result.getUsersCount()))
                .onErrorResume(e -> {
                    log.error("Get all users error: {}", e.getMessage());
                    return Mono.just(GetAllUsersResponse.newBuilder().build());
                })
        );
    }
}
