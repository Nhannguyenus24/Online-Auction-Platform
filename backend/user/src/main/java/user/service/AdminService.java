package user.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.stereotype.Service;

import com.auction.proto.admin.user.*;
import com.auction.utils.TimeUtils;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import user.repository.AdminRepository;
import user.repository.UserRepository;

@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);
    private final AdminRepository adminRepository;
    private final R2dbcEntityTemplate template;
    private final UserRepository userRepository;

    public AdminService(AdminRepository adminRepository, R2dbcEntityTemplate template, UserRepository userRepository) {
        this.adminRepository = adminRepository;
        this.template = template;
        this.userRepository = userRepository;
    }

    /**
     * Get overall user statistics
     */
    public Mono<UserStatisticsResponse> getUserStatistics() {
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
            int totalUsers = tuple.getT1();
            int totalBidders = tuple.getT2();
            int totalSellers = tuple.getT3();
            int totalAdmins = tuple.getT4();
            int verifiedUsers = tuple.getT5();
            double avgRating = tuple.getT6();
            int positiveReviews = tuple.getT7();
            int negativeReviews = tuple.getT8();
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
        Query countQuery;
        Query selectQuery;
        
        if (!request.getStatusFilter().isEmpty()) {
            Criteria criteria = Criteria.where("status").is(request.getStatusFilter());
            countQuery = Query.query(criteria);
            selectQuery = Query.query(criteria).offset(skip).limit(pageSize);
        } else {
            countQuery = Query.empty();
            selectQuery = Query.empty().offset(skip).limit(pageSize);
        }

        return template.count(countQuery, com.auction.entities.database.UpgradeRequest.class)
                .flatMap(totalCount -> {
                    log.info("Total upgrade requests found: {}", totalCount);
                    
                    return template.select(selectQuery, com.auction.entities.database.UpgradeRequest.class)
                            .collectList()
                            .flatMap(requests -> {
                                log.info("Fetched {} upgrade requests for page {}", requests.size(), page);
                                
                                // Fetch user information for all requests
                                return Flux.fromIterable(requests)
                                        .flatMap(req -> userRepository.findByUserId(req.getUserId())
                                                .map(user -> {
                                                    long createdAtMillis = req.getCreatedAt() != null ?
                                                            req.getCreatedAt().atZone(java.time.ZoneOffset.UTC).toInstant().toEpochMilli() : 0;
                                                    long reviewedAtMillis = req.getReviewedAt() != null ?
                                                            req.getReviewedAt().atZone(java.time.ZoneOffset.UTC).toInstant().toEpochMilli() : 0;
                                                    long userCreatedAtMillis = user.getCreatedAt() != null ?
                                                            user.getCreatedAt().atZone(java.time.ZoneOffset.UTC).toInstant().toEpochMilli() : 0;

                                                    return UpgradeRequest.newBuilder()
                                                            .setId(req.getId())
                                                            .setUserId(req.getUserId())
                                                            .setUserEmail(user.getEmail() != null ? user.getEmail() : "")
                                                            .setUserFullName(user.getFullName() != null ? user.getFullName() : "")
                                                            .setRequestedRole(req.getRequestedRole())
                                                            .setStatus(req.getStatus())
                                                            .setCreatedAt(createdAtMillis)
                                                            .setReviewedAt(reviewedAtMillis)
                                                            .setAdminId(req.getAdminId() != null ? req.getAdminId() : 0)
                                                            .setReason("")
                                                            // Additional user information
                                                            .setUserPhone(user.getPhone() != null ? user.getPhone() : "")
                                                            .setUserAddress(user.getAddress() != null ? user.getAddress() : "")
                                                            .setIsEmailVerified(user.getIsEmailVerified() != null ? user.getIsEmailVerified() : false)
                                                            .setPositiveReviews(user.getPositiveReviews() != null ? user.getPositiveReviews() : 0)
                                                            .setNegativeReviews(user.getNegativeReviews() != null ? user.getNegativeReviews() : 0)
                                                            .setRatingPercent(user.getRatingPercent() != null ? user.getRatingPercent().doubleValue() : 0.0)
                                                            .setUserCreatedAt(userCreatedAtMillis)
                                                            .setCurrentRole(user.getRole() != null ? user.getRole() : "")
                                                            .build();
                                                })
                                                .defaultIfEmpty(
                                                    // If user not found, return basic info
                                                    UpgradeRequest.newBuilder()
                                                            .setId(req.getId())
                                                            .setUserId(req.getUserId())
                                                            .setUserEmail("User not found")
                                                            .setUserFullName("User not found")
                                                            .setRequestedRole(req.getRequestedRole())
                                                            .setStatus(req.getStatus())
                                                            .setCreatedAt(req.getCreatedAt() != null ?
                                                                    req.getCreatedAt().atZone(java.time.ZoneOffset.UTC).toInstant().toEpochMilli() : 0)
                                                            .setReviewedAt(req.getReviewedAt() != null ?
                                                                    req.getReviewedAt().atZone(java.time.ZoneOffset.UTC).toInstant().toEpochMilli() : 0)
                                                            .setAdminId(req.getAdminId() != null ? req.getAdminId() : 0)
                                                            .setReason("")
                                                            .build()
                                                ))
                                        .collectList()
                                        .map(upgradeRequests -> {
                                            GetUpgradeRequestsResponse.Builder builder = GetUpgradeRequestsResponse.newBuilder()
                                                    .setTotalCount(Math.toIntExact(totalCount))
                                                    .setPage(page)
                                                    .setTotalPages((int) Math.ceil((double) totalCount / pageSize))
                                                    .addAllUpgradeRequests(upgradeRequests);

                                            return builder.build();
                                        });
                            });
                })
                .doOnNext(response -> log.info("Returning upgrade requests response with {} items", 
                        response.getUpgradeRequestsCount()))
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
        boolean isApproved = action.equals("approve");

        Query query = Query.query(Criteria.where("id").is(request.getRequestId()));

        return template.selectOne(query, com.auction.entities.database.UpgradeRequest.class)
                .flatMap(upgradeReq -> {
                    upgradeReq.setStatus(status);
                    upgradeReq.setAdminId(request.getAdminId());
                    upgradeReq.setReviewedAt(TimeUtils.now());

                    // Update upgrade request status
                    return template.update(upgradeReq)
                            .then(Mono.defer(() -> {
                                // If approved, update user role
                                if (isApproved) {
                                    return userRepository.findByUserId(upgradeReq.getUserId())
                                            .flatMap(user -> {
                                                user.setRole(upgradeReq.getRequestedRole());
                                                log.info("Updating user {} role to {}", 
                                                        user.getId(), upgradeReq.getRequestedRole());
                                                return template.update(user);
                                            })
                                            .then(Mono.just(ApproveUpgradeRequestResponse.newBuilder()
                                                    .setSuccess(true)
                                                    .setMessage("Upgrade request approved and user role updated successfully")
                                                    .build()));
                                } else {
                                    return Mono.just(ApproveUpgradeRequestResponse.newBuilder()
                                            .setSuccess(true)
                                            .setMessage("Upgrade request " + status + " successfully")
                                            .build());
                                }
                            }));
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
     * Profit = 30% of total successful payment amounts
     */
    public Mono<ProfitStatisticsResponse> getProfitStatistics(ProfitStatisticsRequest request) {
        log.info("Fetching profit statistics - month: {}, year: {}", request.getMonth(), request.getYear());

        ProfitStatisticsResponse.Builder responseBuilder = 
                ProfitStatisticsResponse.newBuilder();

        // Build response with both monthly and yearly if requested
        Mono<ProfitStatisticsResponse> monthlyMono = Mono.just(responseBuilder.build());
        Mono<ProfitStatisticsResponse> yearlyMono = Mono.just(responseBuilder.build());

        // Get monthly profit if month is specified
        request.getMonth();
        if (!request.getMonth().isEmpty()) {
            monthlyMono = adminRepository.getMonthlyProfit(request.getMonth())
                    .map(record -> {
                        MonthlyProfit monthlyProfit = 
                                MonthlyProfit.newBuilder()
                                .setMonth(record.getPeriod())
                                .setTotalSales(record.getTotalSales())
                                .setProfit(record.getProfit())
                                .setCompletedOrders(record.getCompletedOrders())
                                .build();
                        
                        return ProfitStatisticsResponse.newBuilder()
                                .setMonthlyProfit(monthlyProfit)
                                .build();
                    })
                    .defaultIfEmpty(ProfitStatisticsResponse.newBuilder()
                            .setMonthlyProfit(MonthlyProfit.newBuilder()
                                    .setMonth(request.getMonth())
                                    .setTotalSales(0.0)
                                    .setProfit(0.0)
                                    .setCompletedOrders(0)
                                    .build())
                            .build());
        }

        // Get yearly profit if year is specified
        request.getYear();
        if (!request.getYear().isEmpty()) {
            try {
                int year = Integer.parseInt(request.getYear());
                yearlyMono = adminRepository.getYearlyProfit(year)
                        .map(record -> {
                            YearlyProfit yearlyProfit = 
                                    YearlyProfit.newBuilder()
                                    .setYear(record.getPeriod())
                                    .setTotalSales(record.getTotalSales())
                                    .setProfit(record.getProfit())
                                    .setCompletedOrders(record.getCompletedOrders())
                                    .build();
                            
                            return ProfitStatisticsResponse.newBuilder()
                                    .setYearlyProfit(yearlyProfit)
                                    .build();
                        })
                        .defaultIfEmpty(ProfitStatisticsResponse.newBuilder()
                                .setYearlyProfit(YearlyProfit.newBuilder()
                                        .setYear(request.getYear())
                                        .setTotalSales(0.0)
                                        .setProfit(0.0)
                                        .setCompletedOrders(0)
                                        .build())
                                .build());
            } catch (NumberFormatException e) {
                log.error("Invalid year format: {}", request.getYear());
            }
        }

        // Combine monthly and yearly results
        return Mono.zip(monthlyMono, yearlyMono)
                .map(tuple -> {
                    ProfitStatisticsResponse.Builder builder = 
                            ProfitStatisticsResponse.newBuilder();
                    
                    if (tuple.getT1().hasMonthlyProfit()) {
                        builder.setMonthlyProfit(tuple.getT1().getMonthlyProfit());
                    }
                    
                    if (tuple.getT2().hasYearlyProfit()) {
                        builder.setYearlyProfit(tuple.getT2().getYearlyProfit());
                    }
                    
                    return builder.build();
                })
                .onErrorResume(error -> {
                    log.error("Error fetching profit statistics", error);
                    return Mono.just(ProfitStatisticsResponse.newBuilder().build());
                });
    }

    /**
     * Get all users with pagination and search
     */
    public Mono<GetAllUsersResponse> getAllUsers(GetAllUsersRequest request) {
        log.info("Fetching all users - search: {}, role: {}, page: {}, size: {}", 
                request.getSearchQuery(), request.getRoleFilter(), request.getPage(), request.getPageSize());

        int page = request.getPage() > 0 ? request.getPage() : 1;
        int pageSize = request.getPageSize() > 0 ? request.getPageSize() : 20;
        int skip = (page - 1) * pageSize;

        // Build criteria
        Criteria criteria = Criteria.empty();
        
        // Add role filter if specified
        if (!request.getRoleFilter().isEmpty()) {
            criteria = criteria.and(Criteria.where("role").is(request.getRoleFilter()));
        }
        
        // Add search filter if specified (search by name, email, or phone)
        if (!request.getSearchQuery().isEmpty()) {
            String searchPattern = "%" + request.getSearchQuery() + "%";
            Criteria searchCriteria = Criteria.where("full_name").like(searchPattern)
                    .or("email").like(searchPattern)
                    .or("phone").like(searchPattern);
            criteria = criteria.isEmpty() ? searchCriteria : criteria.and(searchCriteria);
        }

        Query countQuery = criteria.isEmpty() ? Query.empty() : Query.query(criteria);
        Query selectQuery = criteria.isEmpty() ? 
                Query.empty().offset(skip).limit(pageSize) : 
                Query.query(criteria).offset(skip).limit(pageSize);

        return template.count(countQuery, com.auction.entities.database.User.class)
                .flatMap(totalCount -> {
                    log.info("Total users found: {}", totalCount);
                    int totalPages = (int) Math.ceil((double) totalCount / pageSize);
                    
                    return template.select(selectQuery, com.auction.entities.database.User.class)
                            .map(user -> UserInfo.newBuilder()
                                    .setId(user.getId())
                                    .setEmail(user.getEmail() != null ? user.getEmail() : "")
                                    .setFullName(user.getFullName() != null ? user.getFullName() : "")
                                    .setRole(user.getRole() != null ? user.getRole() : "bidder")
                                    .setPhone(user.getPhone() != null ? user.getPhone() : "")
                                    .setAddress(user.getAddress() != null ? user.getAddress() : "")
                                    .setIsEmailVerified(user.getIsEmailVerified() != null ? user.getIsEmailVerified() : false)
                                    .setPositiveReviews(user.getPositiveReviews() != null ? user.getPositiveReviews() : 0)
                                    .setNegativeReviews(user.getNegativeReviews() != null ? user.getNegativeReviews() : 0)
                                    .setRatingPercent(user.getRatingPercent() != null ? user.getRatingPercent().doubleValue() : 0.0)
                                    .setCreatedAt(user.getCreatedAt() != null ? 
                                            user.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli() : 0L)
                                    .setUpdatedAt(user.getUpdatedAt() != null ? 
                                            user.getUpdatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli() : 0L)
                                    .build())
                            .collectList()
                            .map(users -> GetAllUsersResponse.newBuilder()
                                    .addAllUsers(users)
                                    .setTotalCount(totalCount.intValue())
                                    .setPage(page)
                                    .setTotalPages(totalPages)
                                    .build());
                })
                .doOnNext(response -> log.info("Returning users response with {} items", response.getUsersCount()))
                .onErrorResume(error -> {
                    log.error("Error fetching users", error);
                    return Mono.just(GetAllUsersResponse.newBuilder().build());
                });
    }
}
