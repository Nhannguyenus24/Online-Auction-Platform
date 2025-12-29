package user.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.stereotype.Service;
import com.auction.proto.admin.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import user.repository.AdminRepository;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);
    private final AdminRepository adminRepository;
    private final R2dbcEntityTemplate template;

    public AdminService(AdminRepository adminRepository, R2dbcEntityTemplate template) {
        this.adminRepository = adminRepository;
        this.template = template;
    }

    /**
     * Get overall user statistics
     */
    public Mono<UserStatisticsResponse> getUserStatistics(UserStatisticsRequest request) {
        log.info("Fetching user statistics");

        return Mono.zip(
                adminRepository.countAllUsers(),
                adminRepository.countByRole("bidder"),
                adminRepository.countByRole("seller"),
                adminRepository.countByRole("admin"),
                adminRepository.countVerifiedUsers(),
                adminRepository.getAverageRating(),
                adminRepository.sumPositiveReviews(),
                adminRepository.sumNegativeReviews()
        )
        .map(tuple -> {
            int totalUsers = tuple.getT1() != null ? tuple.getT1() : 0;
            int totalBidders = tuple.getT2() != null ? tuple.getT2() : 0;
            int totalSellers = tuple.getT3() != null ? tuple.getT3() : 0;
            int totalAdmins = tuple.getT4() != null ? tuple.getT4() : 0;
            int verifiedUsers = tuple.getT5() != null ? tuple.getT5() : 0;
            double avgRating = tuple.getT6() != null ? tuple.getT6() : 0.0;
            int positiveReviews = tuple.getT7() != null ? tuple.getT7() : 0;
            int negativeReviews = tuple.getT8() != null ? tuple.getT8() : 0;
            int unverifiedUsers = totalUsers - verifiedUsers;

            return UserStatisticsResponse.newBuilder()
                    .setTotalUsers(totalUsers)
                    .setTotalBidders(totalBidders)
                    .setTotalSellers(totalSellers)
                    .setTotalAdmins(totalAdmins)
                    .setVerifiedUsers(verifiedUsers)
                    .setUnverifiedUsers(unverifiedUsers)
                    .setAverageRating(avgRating)
                    .setPositiveReviews(positiveReviews)
                    .setNegativeReviews(negativeReviews)
                    .build();
        })
        .onErrorResume(error -> {
            log.error("Error fetching user statistics", error);
            return Mono.just(UserStatisticsResponse.newBuilder().build());
        });
    }

    /**
     * Get registration statistics by period
     */
    public Mono<RegistrationStatisticsResponse> getRegistrationStatistics(RegistrationStatisticsRequest request) {
        log.info("Fetching registration statistics for period: {}", request.getPeriod());

        String period = request.getPeriod().toLowerCase();
        int limit = request.getLimit() > 0 ? request.getLimit() : 30;

        Flux<DailyRegistration> dailyStats = adminRepository.getUserRegistrationsByDay(limit)
                .map(record -> DailyRegistration.newBuilder()
                        .setDate(record.getDate())
                        .setCount(record.getCount())
                        .build());

        Flux<MonthlyRegistration> monthlyStats = adminRepository.getUserRegistrationsByMonth(limit)
                .map(record -> MonthlyRegistration.newBuilder()
                        .setMonth(record.getMonth())
                        .setCount(record.getCount())
                        .build());

        Flux<YearlyRegistration> yearlyStats = adminRepository.getUserRegistrationsByYear(limit)
                .map(record -> YearlyRegistration.newBuilder()
                        .setYear(record.getYear())
                        .setCount(record.getCount())
                        .build());

        return Mono.zip(
                dailyStats.collectList(),
                monthlyStats.collectList(),
                yearlyStats.collectList()
        )
        .map(tuple -> {
            RegistrationStatisticsResponse.Builder builder = RegistrationStatisticsResponse.newBuilder();
            tuple.getT1().forEach(builder::addDaily);
            tuple.getT2().forEach(builder::addMonthly);
            tuple.getT3().forEach(builder::addYearly);
            return builder.build();
        })
        .onErrorResume(error -> {
            log.error("Error fetching registration statistics", error);
            return Mono.just(RegistrationStatisticsResponse.newBuilder().build());
        });
    }

    /**
     * Get upgrade requests with pagination
     */
    public Mono<GetUpgradeRequestsResponse> getUpgradeRequests(GetUpgradeRequestsRequest request) {
        log.info("Fetching upgrade requests - status: {}, page: {}, size: {}",
                request.getStatusFilter(), request.getPage(), request.getPageSize());

        int page = request.getPage() > 0 ? request.getPage() : 1;
        int pageSize = request.getPageSize() > 0 ? request.getPageSize() : 20;
        int skip = (page - 1) * pageSize;

        // Build query based on status filter
        Query query;
        if (!request.getStatusFilter().isEmpty()) {
            query = Query.query(Criteria.where("status").is(request.getStatusFilter()));
        } else {
            query = Query.empty();
        }

        return template.count(query, "upgrade_requests")
                .flatMap(totalCount -> {
                    Query queryWithPagination = Query.query(query.getCriteria())
                            .offset(skip)
                            .limit(pageSize);

                    return template.select(queryWithPagination, com.auction.entities.database.UpgradeRequest.class)
                            .collectList()
                            .map(requests -> {
                                GetUpgradeRequestsResponse.Builder builder = GetUpgradeRequestsResponse.newBuilder()
                                        .setTotalCount((int) totalCount)
                                        .setPage(page)
                                        .setTotalPages((int) Math.ceil((double) totalCount / pageSize));

                                requests.forEach(req -> builder.addUpgradeRequests(
                                        UpgradeRequest.newBuilder()
                                                .setId(req.getId())
                                                .setUserId(req.getUserId())
                                                .setRequestedRole(req.getRequestedRole())
                                                .setStatus(req.getStatus())
                                                .setCreatedAt(req.getCreatedAt() != null ? 
                                                        req.getCreatedAt().getEpochSecond() * 1000 : 0)
                                                .setReviewedAt(req.getReviewedAt() != null ? 
                                                        req.getReviewedAt().getEpochSecond() * 1000 : 0)
                                                .setAdminId(req.getAdminId() != null ? req.getAdminId() : 0)
                                                .build()
                                ));

                                return builder.build();
                            });
                })
                .onErrorResume(error -> {
                    log.error("Error fetching upgrade requests", error);
                    return Mono.just(GetUpgradeRequestsResponse.newBuilder().build());
                });
    }

    /**
     * Approve or reject an upgrade request
     */
    public Mono<ApproveUpgradeRequestResponse> approveUpgradeRequest(ApproveUpgradeRequestRequest request) {
        log.info("Processing upgrade request {} - action: {} by admin {}", 
                request.getRequestId(), request.getAction(), request.getAdminId());

        String action = request.getAction().toLowerCase();
        String status = action.equals("approve") ? "approved" : "rejected";

        Query query = Query.query(Criteria.where("id").is(request.getRequestId()));

        return template.selectOne(query, com.auction.entities.database.UpgradeRequest.class)
                .flatMap(upgradeReq -> {
                    upgradeReq.setStatus(status);
                    upgradeReq.setAdminId(request.getAdminId());
                    upgradeReq.setReviewedAt(java.time.LocalDateTime.now());

                    return template.update(upgradeReq)
                            .then(Mono.just(ApproveUpgradeRequestResponse.newBuilder()
                                    .setSuccess(true)
                                    .setMessage("Upgrade request " + status + " successfully")
                                    .build()));
                })
                .switchIfEmpty(Mono.just(ApproveUpgradeRequestResponse.newBuilder()
                        .setSuccess(false)
                        .setMessage("Upgrade request not found")
                        .build()))
                .onErrorResume(error -> {
                    log.error("Error approving upgrade request", error);
                    return Mono.just(ApproveUpgradeRequestResponse.newBuilder()
                            .setSuccess(false)
                            .setMessage("Error: " + error.getMessage())
                            .build());
                });
    }

    /**
     * Get profit statistics by month or year
     */
    public Mono<GetRatingStatsResponse> getProfitStatistics(ProfitStatisticsRequest request) {
        log.info("Fetching profit statistics - month: {}, year: {}", request.getMonth(), request.getYear());

        // TODO: Implement profit calculation from orders and payments
        // This requires access to order and payment services
        
        return Mono.just(GetRatingStatsResponse.newBuilder().build());
    }
}
