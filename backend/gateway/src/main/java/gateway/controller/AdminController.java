package gateway.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.auction.proto.admin.product.CreateCategoryRequest;
import com.auction.proto.admin.product.DeleteCategoryRequest;
import com.auction.proto.admin.product.RemoveProductRequest;
import com.auction.proto.admin.product.UpdateCategoryRequest;
import com.auction.proto.admin.user.ApproveUpgradeRequestRequest;
import com.auction.proto.admin.user.GetAllUsersRequest;
import com.auction.proto.admin.user.GetUpgradeRequestsRequest;
import com.auction.proto.admin.user.ProfitStatisticsRequest;
import com.auction.proto.admin.user.RegistrationStatisticsRequest;
import com.auction.proto.admin.user.UserStatisticsRequest;
import com.auction.dto.ApiResponse;
import com.auction.utils.JsonUtils;
import com.auction.utils.ValidationUtils;

import gateway.grpc.AdminProductGrpcClient;
import gateway.grpc.AdminUserGrpcClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Max;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Admin user endpoints - requires authentication")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);
    private static final String INVALID_ROLE_FILTER = "Invalid roleFilter. Must be: bidder, seller, or admin";
    private static final String INVALID_PERIOD = "Invalid period. Must be: daily, monthly, or yearly";
    private static final String INVALID_STATUS_FILTER = "Invalid statusFilter. Must be: pending, approved, or rejected";

    private final AdminProductGrpcClient adminProductGrpcClient;
    private final AdminUserGrpcClient adminUserGrpcClient;

    public AdminController(AdminProductGrpcClient adminProductGrpcClient,
                          AdminUserGrpcClient adminUserGrpcClient) {
        this.adminProductGrpcClient = adminProductGrpcClient;
        this.adminUserGrpcClient = adminUserGrpcClient;
    }

    private int getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Integer.parseInt(authentication.getName());
    }

    // ============================================================================
    // USER STATISTICS
    // ============================================================================

    @GetMapping("/statistics/users")
    @Operation(summary = "Get user statistics", description = "Get overall user statistics including total users, bidders, sellers, and ratings. Requires admin authentication.")
    public ResponseEntity<ApiResponse<UserStatisticsResponseDto>> getUserStatistics(
            @Parameter(description = "Role filter (bidder, seller, admin)")
            @RequestParam(required = false, defaultValue = "") String roleFilter) {

        int adminId = getUserId();
        log.info("Get user statistics request [adminId={}] - roleFilter: {}", adminId, roleFilter);

        // Validate roleFilter if provided
        if (!roleFilter.isEmpty() && !roleFilter.matches("^(bidder|seller|admin)$")) {
            log.warn("Invalid roleFilter value: {} [adminId={}]", roleFilter, adminId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_ROLE_FILTER));
        }

        try {
            UserStatisticsRequest grpcRequest = UserStatisticsRequest.newBuilder()
                    .setRoleFilter(roleFilter)
                    .build();

            var response = adminUserGrpcClient.getUserStatistics(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [adminId={}]", adminId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch statistics"));
            }

            UserStatisticsResponseDto result = new UserStatisticsResponseDto(
                response.getTotalUsers(),
                response.getTotalBidders(),
                response.getTotalSellers(),
                response.getTotalAdmins(),
                response.getVerifiedUsers(),
                response.getUnverifiedUsers(),
                response.getAverageRating(),
                response.getPositiveReviews(),
                response.getNegativeReviews()
            );

            log.info("Get user statistics successful [adminId={}, totalUsers={}]", adminId, response.getTotalUsers());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get user statistics error [adminId={}]: {}", adminId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch statistics: " + e.getMessage()));
        }
    }

    @GetMapping("/statistics/registrations")
    @Operation(summary = "Get registration statistics", description = "Get user registration statistics by period (daily, monthly, yearly). Requires admin authentication.")
    public ResponseEntity<ApiResponse<RegistrationStatisticsResponseDto>> getRegistrationStatistics(
            @Parameter(description = "Period type (daily, monthly, yearly)", required = true)
            @RequestParam String period,
            @Parameter(description = "Number of periods to return")
            @RequestParam(defaultValue = "30") @Positive(message = "Limit must be greater than 0") int limit) {

        int adminId = getUserId();
        log.info("Get registration statistics request [adminId={}] - period: {}, limit: {}", adminId, period, limit);

        // Validate period
        if (!period.matches("^(daily|monthly|yearly)$")) {
            log.warn("Invalid period value: {} [adminId={}]", period, adminId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_PERIOD));
        }

        try {
            RegistrationStatisticsRequest grpcRequest = RegistrationStatisticsRequest.newBuilder()
                    .setPeriod(period)
                    .setLimit(limit)
                    .build();

            var response = adminUserGrpcClient.getRegistrationStatistics(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [adminId={}]", adminId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch statistics"));
            }

            List<RegistrationStatsItemDto> daily = response.getDailyList().stream()
                .map(d -> new RegistrationStatsItemDto(d.getDate(), d.getCount()))
                .toList();

            List<RegistrationStatsItemDto> monthly = response.getMonthlyList().stream()
                .map(m -> new RegistrationStatsItemDto(m.getMonth(), m.getCount()))
                .toList();

            List<RegistrationStatsItemDto> yearly = response.getYearlyList().stream()
                .map(y -> new RegistrationStatsItemDto(y.getYear(), y.getCount()))
                .toList();

            RegistrationStatisticsResponseDto result = new RegistrationStatisticsResponseDto(daily, monthly, yearly);

            log.info("Get registration statistics successful [adminId={}, period={}]", adminId, period);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get registration statistics error [adminId={}]: {}", adminId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch statistics: " + e.getMessage()));
        }
    }

    @GetMapping("/statistics/profit")
    @Operation(summary = "Get profit statistics", description = "Get profit statistics by month or year (30% of successful transactions). Requires admin authentication.")
    public ResponseEntity<ApiResponse<ProfitStatisticsResponseDto>> getProfitStatistics(
            @Parameter(description = "Month in format YYYY-MM")
            @RequestParam(required = false, defaultValue = "") String month,
            @Parameter(description = "Year in format YYYY")
            @RequestParam(required = false, defaultValue = "") String year) {

        int adminId = getUserId();
        log.info("Get profit statistics request [adminId={}] - month: {}, year: {}", adminId, month, year);

        // Validate month format if provided
        if (!month.isEmpty() && !month.matches("^\\d{4}-\\d{2}$")) {
            log.warn("Invalid month format: {} [adminId={}]", month, adminId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("Month must be in format YYYY-MM"));
        }

        // Validate year format if provided
        if (!year.isEmpty() && !year.matches("^\\d{4}$")) {
            log.warn("Invalid year format: {} [adminId={}]", year, adminId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("Year must be in format YYYY"));
        }

        try {
            ProfitStatisticsRequest grpcRequest = ProfitStatisticsRequest.newBuilder()
                    .setMonth(month)
                    .setYear(year)
                    .build();

            var response = adminUserGrpcClient.getProfitStatistics(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [adminId={}]", adminId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch statistics"));
            }

            ProfitDataDto monthlyProfit = null;
            if (response.hasMonthlyProfit()) {
                var mp = response.getMonthlyProfit();
                monthlyProfit = new ProfitDataDto(mp.getMonth(), mp.getTotalSales(), mp.getProfit(), mp.getCompletedOrders());
            }

            ProfitDataDto yearlyProfit = null;
            if (response.hasYearlyProfit()) {
                var yp = response.getYearlyProfit();
                yearlyProfit = new ProfitDataDto(yp.getYear(), yp.getTotalSales(), yp.getProfit(), yp.getCompletedOrders());
            }

            ProfitStatisticsResponseDto result = new ProfitStatisticsResponseDto(monthlyProfit, yearlyProfit);

            log.info("Get profit statistics successful [adminId={}]: {}", adminId, JsonUtils.toJson(result));
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get profit statistics error [adminId={}]: {}", adminId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch statistics: " + e.getMessage()));
        }
    }

    // ============================================================================
    // UPGRADE REQUESTS
    // ============================================================================

    @GetMapping("/users")
    @Operation(summary = "Get all users", description = "Get all users with pagination and search. Requires admin authentication.")
    public ResponseEntity<ApiResponse<UsersResponseDto>> getAllUsers(
            @Parameter(description = "Search query (name, email, or phone)")
            @RequestParam(required = false, defaultValue = "") String searchQuery,
            @Parameter(description = "Role filter (bidder, seller, admin)")
            @RequestParam(required = false, defaultValue = "") String roleFilter,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") @Positive(message = "PageSize must be greater than 0") @Max(value = 100, message = "PageSize must not exceed 100") int pageSize) {

        int adminId = getUserId();
        log.info("Get all users [adminId={}] - searchQuery: {}, roleFilter: {}, page: {}, pageSize: {}",
                adminId, searchQuery, roleFilter, page, pageSize);

        // Validate roleFilter if provided
        if (!roleFilter.isEmpty() && !roleFilter.matches("^(bidder|seller|admin)$")) {
            log.warn("Invalid roleFilter: {} [adminId={}]", roleFilter, adminId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_ROLE_FILTER));
        }

        try {
            GetAllUsersRequest grpcRequest = GetAllUsersRequest.newBuilder()
                    .setSearchQuery(searchQuery)
                    .setRoleFilter(roleFilter)
                    .setPage(page)
                    .setPageSize(pageSize)
                    .build();

            var response = adminUserGrpcClient.getAllUsers(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [adminId={}]", adminId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch users"));
            }

            List<UserItemDto> users = response.getUsersList().stream()
                .map(user -> new UserItemDto(
                    user.getId(),
                    user.getEmail(),
                    user.getFullName(),
                    user.getRole(),
                    user.getPhone(),
                    user.getAddress(),
                    user.getIsEmailVerified(),
                    user.getPositiveReviews(),
                    user.getNegativeReviews(),
                    user.getCreatedAt(),
                    user.getUpdatedAt()
                ))
                .toList();

            UsersResponseDto result = new UsersResponseDto(
                users,
                response.getTotalCount(),
                response.getPage(),
                response.getTotalPages()
            );

            log.info("Get all users successful [adminId={}, count={}, totalCount={}]", adminId, users.size(), response.getTotalCount());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get all users error [adminId={}]: {}", adminId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch users: " + e.getMessage()));
        }
    }

    @GetMapping("/upgrade-requests")
    @Operation(summary = "Get upgrade requests", description = "Get all upgrade requests (bidder -> seller) with pagination. Requires admin authentication.")
    public ResponseEntity<ApiResponse<UpgradeRequestsResponseDto>> getUpgradeRequests(
            @Parameter(description = "Status filter (pending, approved, rejected)")
            @RequestParam(required = false, defaultValue = "") String statusFilter,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") @Positive(message = "PageSize must be greater than 0") @Max(value = 100, message = "PageSize must not exceed 100") int pageSize) {

        int adminId = getUserId();
        log.info("Get upgrade requests [adminId={}] - statusFilter: {}, page: {}, pageSize: {}", adminId, statusFilter, page, pageSize);

        // Validate statusFilter if provided
        if (!statusFilter.isEmpty() && !statusFilter.matches("^(pending|approved|rejected)$")) {
            log.warn("Invalid statusFilter value: {} [adminId={}]", statusFilter, adminId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_STATUS_FILTER));
        }

        try {
            GetUpgradeRequestsRequest grpcRequest = GetUpgradeRequestsRequest.newBuilder()
                    .setStatusFilter(statusFilter)
                    .setPage(page)
                    .setPageSize(pageSize)
                    .build();

            var response = adminUserGrpcClient.getUpgradeRequests(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [adminId={}]", adminId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch upgrade requests"));
            }

            List<UpgradeRequestItemDto> requests = response.getUpgradeRequestsList().stream()
                .map(req -> new UpgradeRequestItemDto(
                    req.getId(),
                    req.getUserId(),
                    req.getUserEmail(),
                    req.getUserFullName(),
                    req.getRequestedRole(),
                    req.getStatus(),
                    req.getCreatedAt(),
                    req.getReviewedAt(),
                    req.getAdminId(),
                    req.getReason()
                ))
                .toList();

            UpgradeRequestsResponseDto result = new UpgradeRequestsResponseDto(
                requests,
                response.getTotalCount(),
                response.getPage(),
                response.getTotalPages()
            );

            log.info("Get upgrade requests successful [adminId={}, count={}, totalCount={}]", adminId, requests.size(), response.getTotalCount());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get upgrade requests error [adminId={}]: {}", adminId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch upgrade requests: " + e.getMessage()));
        }
    }

    @PostMapping("/upgrade-requests/{requestId}")
    @Operation(summary = "Approve or reject upgrade request", description = "Approve or reject a user upgrade request. Requires admin authentication.")
    public ResponseEntity<ApiResponse<StandardResponseDto>> processUpgradeRequest(
            @Parameter(description = "Request ID", required = true)
            @PathVariable @Positive(message = "Request ID must be greater than 0") int requestId,
            @Valid @RequestBody ProcessUpgradeRequestDto requestDto) {

        int adminId = getUserId();
        log.info("Process upgrade request [adminId={}] - requestId: {}, action: {}",
                adminId, requestId, requestDto.action());

        // Validate action
        if (!requestDto.action().matches("^(approve|reject)$")) {
            log.warn("Invalid action: {} [adminId={}]", requestDto.action(), adminId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("Action must be 'approve' or 'reject'"));
        }

        try {
            ApproveUpgradeRequestRequest grpcRequest = ApproveUpgradeRequestRequest.newBuilder()
                    .setRequestId(requestId)
                    .setAdminId(adminId)
                    .setAction(requestDto.action())
                    .setReason(requestDto.reason() != null ? requestDto.reason() : "")
                    .build();

            var response = adminUserGrpcClient.approveUpgradeRequest(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [adminId={}]", adminId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to process upgrade request"));
            }

            StandardResponseDto result = new StandardResponseDto(response.getSuccess(), response.getMessage());

            if (response.getSuccess()) {
                log.info("Process upgrade request successful [adminId={}, requestId={}, action={}]",
                        adminId, requestId, requestDto.action());
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Process upgrade request failed [adminId={}, requestId={}, message={}]",
                        adminId, requestId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Process upgrade request error [adminId={}, requestId={}]: {}", adminId, requestId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to process upgrade request: " + e.getMessage()));
        }
    }

    // ============================================================================
    // CATEGORY MANAGEMENT
    // ============================================================================

    @PostMapping("/categories")
    @Operation(summary = "Create category", description = "Create a new product category. Requires admin authentication.")
    public ResponseEntity<ApiResponse<CreateCategoryResponseDto>> createCategory(
            @Valid @RequestBody CreateCategoryRequestDto requestDto) {

        int adminId = getUserId();
        log.info("Create category request [adminId={}] - name: {}, parentId: {}", adminId, requestDto.name(), requestDto.parentId());

        // Validate parentId if provided
        if (requestDto.parentId() != null && requestDto.parentId() < 0) {
            log.warn("Invalid parentId: {} [adminId={}]", requestDto.parentId(), adminId);
            return ResponseEntity.badRequest()
                .body(ApiResponse.badRequest("Parent ID must be >= 0"));
        }

        try {
            CreateCategoryRequest grpcRequest = CreateCategoryRequest.newBuilder()
                    .setName(requestDto.name())
                    .setParentId(requestDto.parentId() != null ? requestDto.parentId() : 0)
                    .build();

            var response = adminProductGrpcClient.createCategory(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [adminId={}]", adminId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to create category"));
            }

            CreateCategoryResponseDto result = new CreateCategoryResponseDto(
                response.getSuccess(),
                response.getMessage(),
                response.getSuccess() ? response.getCategoryId() : null
            );

            if (response.getSuccess()) {
                log.info("Create category successful [adminId={}, categoryId={}]", adminId, response.getCategoryId());
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Create category failed [adminId={}, message={}]", adminId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Create category error [adminId={}]: {}", adminId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to create category: " + e.getMessage()));
        }
    }

    @PutMapping("/categories/{categoryId}")
    @Operation(summary = "Update category", description = "Update an existing product category. Requires admin authentication.")
    public ResponseEntity<ApiResponse<StandardResponseDto>> updateCategory(
            @Parameter(description = "Category ID", required = true)
            @PathVariable @Positive(message = "Category ID must be greater than 0") int categoryId,
            @Valid @RequestBody UpdateCategoryRequestDto requestDto) {

        int adminId = getUserId();
        log.info("Update category request [adminId={}] - categoryId: {}, name: {}, parentId: {}",
                adminId, categoryId, requestDto.name(), requestDto.parentId());

        try {
            UpdateCategoryRequest grpcRequest = UpdateCategoryRequest.newBuilder()
                    .setCategoryId(categoryId)
                    .setName(requestDto.name())
                    .setParentId(requestDto.parentId() != null ? requestDto.parentId() : 0)
                    .build();

            var response = adminProductGrpcClient.updateCategory(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [adminId={}]", adminId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to update category"));
            }

            StandardResponseDto result = new StandardResponseDto(response.getSuccess(), response.getMessage());

            if (response.getSuccess()) {
                log.info("Update category successful [adminId={}, categoryId={}]", adminId, categoryId);
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Update category failed [adminId={}, categoryId={}, message={}]", adminId, categoryId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Update category error [adminId={}, categoryId={}]: {}", adminId, categoryId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to update category: " + e.getMessage()));
        }
    }

    @DeleteMapping("/categories/{categoryId}")
    @Operation(summary = "Delete category", description = "Delete a product category. Cannot delete if category has products. Requires admin authentication.")
    public ResponseEntity<ApiResponse<DeleteCategoryResponseDto>> deleteCategory(
            @Parameter(description = "Category ID", required = true)
            @PathVariable @Positive(message = "Category ID must be greater than 0") int categoryId) {

        int adminId = getUserId();
        log.info("Delete category request [adminId={}] - categoryId: {}", adminId, categoryId);

        try {
            DeleteCategoryRequest grpcRequest = DeleteCategoryRequest.newBuilder()
                    .setCategoryId(categoryId)
                    .build();

            var response = adminProductGrpcClient.deleteCategory(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [adminId={}]", adminId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to delete category"));
            }

            DeleteCategoryResponseDto result = new DeleteCategoryResponseDto(
                response.getSuccess(),
                response.getMessage(),
                response.getHasProducts()
            );

            if (response.getSuccess()) {
                log.info("Delete category successful [adminId={}, categoryId={}]", adminId, categoryId);
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Delete category failed [adminId={}, categoryId={}, message={}]", adminId, categoryId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Delete category error [adminId={}, categoryId={}]: {}", adminId, categoryId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to delete category: " + e.getMessage()));
        }
    }

    // ============================================================================
    // PRODUCT MANAGEMENT
    // ============================================================================

    @DeleteMapping("/products/{productId}")
    @Operation(summary = "Remove product", description = "Remove/ban a product from the platform. Requires admin authentication.")
    public ResponseEntity<ApiResponse<RemoveProductResponseDto>> removeProduct(
            @Parameter(description = "Product ID", required = true)
            @PathVariable @Positive(message = "Product ID must be greater than 0") int productId,
            @Valid @RequestBody RemoveProductRequestDto requestDto) {

        int adminId = getUserId();
        log.info("Remove product request [adminId={}] - productId: {}, reason: {}",
                adminId, productId, requestDto.reason());

        try {
            RemoveProductRequest grpcRequest = RemoveProductRequest.newBuilder()
                    .setProductId(productId)
                    .setAdminId(adminId)
                    .setReason(requestDto.reason())
                    .build();

            var response = adminProductGrpcClient.removeProduct(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [adminId={}]", adminId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to remove product"));
            }

            RemoveProductResponseDto result = new RemoveProductResponseDto(
                response.getSuccess(),
                response.getMessage(),
                response.getSuccess() ? response.getPreviousStatus() : null
            );

            if (response.getSuccess()) {
                log.info("Remove product successful [adminId={}, productId={}, previousStatus={}]",
                        adminId, productId, response.getPreviousStatus());
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Remove product failed [adminId={}, productId={}, message={}]", adminId, productId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Remove product error [adminId={}, productId={}]: {}", adminId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to remove product: " + e.getMessage()));
        }
    }

    // ============================================================================
    // REQUEST DTOs
    // ============================================================================

    public record CreateCategoryRequestDto(
        @NotBlank(message = "Category name is required")
        @Schema(description = "Category name", example = "Electronics")
        String name,
        
        @Schema(description = "Parent category ID (0 for root category)", example = "0")
        Integer parentId
    ) {}

    public record UpdateCategoryRequestDto(
        @NotBlank(message = "Category name is required")
        @Schema(description = "Category name", example = "Electronics")
        String name,
        
        @Schema(description = "Parent category ID (0 for root category)", example = "0")
        Integer parentId
    ) {}

    public record RemoveProductRequestDto(
        @NotBlank(message = "Reason is required")
        @Schema(description = "Reason for removing the product", example = "Violates platform policy")
        String reason
    ) {}

    public record ProcessUpgradeRequestDto(
        @NotBlank(message = "Action is required")
        @Schema(description = "Action to perform", example = "approve", allowableValues = {"approve", "reject"})
        String action,
        
        @Schema(description = "Reason for rejection (optional)", example = "Insufficient seller qualifications")
        String reason
    ) {}

    // ============================================================================
    // RESPONSE DTOs
    // ============================================================================

    public record UserStatisticsResponseDto(
        @Schema(description = "Total number of users", example = "1250")
        int totalUsers,
        @Schema(description = "Total number of bidders", example = "850")
        int totalBidders,
        @Schema(description = "Total number of sellers", example = "350")
        int totalSellers,
        @Schema(description = "Total number of admins", example = "50")
        int totalAdmins,
        @Schema(description = "Number of verified users", example = "1100")
        int verifiedUsers,
        @Schema(description = "Number of unverified users", example = "150")
        int unverifiedUsers,
        @Schema(description = "Average user rating", example = "4.5")
        double averageRating,
        @Schema(description = "Total positive reviews", example = "3200")
        int positiveReviews,
        @Schema(description = "Total negative reviews", example = "180")
        int negativeReviews
    ) {}

    public record RegistrationStatsItemDto(
        @Schema(description = "Period identifier (date/month/year)", example = "2025-01-15")
        String period,
        @Schema(description = "Number of registrations", example = "42")
        int count
    ) {}

    public record RegistrationStatisticsResponseDto(
        @Schema(description = "Daily registration statistics")
        List<RegistrationStatsItemDto> daily,
        @Schema(description = "Monthly registration statistics")
        List<RegistrationStatsItemDto> monthly,
        @Schema(description = "Yearly registration statistics")
        List<RegistrationStatsItemDto> yearly
    ) {}

    public record ProfitDataDto(
        @Schema(description = "Period identifier", example = "2025-12")
        String period,
        @Schema(description = "Total sales amount", example = "125000.50")
        double totalSales,
        @Schema(description = "Profit (30% of sales)", example = "37500.15")
        double profit,
        @Schema(description = "Number of completed orders", example = "324")
        int completedOrders
    ) {}

    public record ProfitStatisticsResponseDto(
        @Schema(description = "Monthly profit statistics")
        ProfitDataDto monthlyProfit,
        @Schema(description = "Yearly profit statistics")
        ProfitDataDto yearlyProfit
    ) {}

    public record UpgradeRequestItemDto(
        @Schema(description = "Request ID", example = "123")
        int id,
        @Schema(description = "User ID", example = "456")
        int userId,
        @Schema(description = "User email", example = "user@example.com")
        String userEmail,
        @Schema(description = "User full name", example = "John Doe")
        String userFullName,
        @Schema(description = "Requested role", example = "seller")
        String requestedRole,
        @Schema(description = "Request status", example = "pending")
        String status,
        @Schema(description = "Created timestamp", example = "1704067200000")
        long createdAt,
        @Schema(description = "Reviewed timestamp", example = "1704153600000")
        long reviewedAt,
        @Schema(description = "Admin ID who reviewed", example = "789")
        int adminId,
        @Schema(description = "Reason for request", example = "Want to sell products")
        String reason
    ) {}

    public record UpgradeRequestsResponseDto(
        @Schema(description = "List of upgrade requests")
        List<UpgradeRequestItemDto> upgradeRequests,
        @Schema(description = "Total number of requests", example = "50")
        int totalCount,
        @Schema(description = "Current page number", example = "1")
        int page,
        @Schema(description = "Total number of pages", example = "3")
        int totalPages
    ) {}

    public record UserItemDto(
        @Schema(description = "User ID", example = "123")
        int id,
        @Schema(description = "User email", example = "user@example.com")
        String email,
        @Schema(description = "User full name", example = "John Doe")
        String fullName,
        @Schema(description = "User role", example = "bidder")
        String role,
        @Schema(description = "User phone", example = "+1234567890")
        String phone,
        @Schema(description = "User address", example = "123 Main St")
        String address,
        @Schema(description = "Email verification status", example = "true")
        boolean isEmailVerified,
        @Schema(description = "Positive reviews count", example = "15")
        int positiveReviews,
        @Schema(description = "Negative reviews count", example = "2")
        int negativeReviews,
        @Schema(description = "Created timestamp", example = "1704067200000")
        long createdAt,
        @Schema(description = "Updated timestamp", example = "1704153600000")
        long updatedAt
    ) {}

    public record UsersResponseDto(
        @Schema(description = "List of users")
        List<UserItemDto> users,
        @Schema(description = "Total number of users", example = "150")
        int totalCount,
        @Schema(description = "Current page number", example = "1")
        int page,
        @Schema(description = "Total number of pages", example = "8")
        int totalPages
    ) {}

    public record StandardResponseDto(
        @Schema(description = "Success status", example = "true")
        boolean success,
        @Schema(description = "Response message", example = "Operation completed successfully")
        String message
    ) {}

    public record CreateCategoryResponseDto(
        @Schema(description = "Success status", example = "true")
        boolean success,
        @Schema(description = "Response message", example = "Category created successfully")
        String message,
        @Schema(description = "Created category ID", example = "123")
        Integer categoryId
    ) {}

    public record DeleteCategoryResponseDto(
        @Schema(description = "Success status", example = "true")
        boolean success,
        @Schema(description = "Response message", example = "Category deleted successfully")
        String message,
        @Schema(description = "Whether category has products", example = "false")
        boolean hasProducts
    ) {}

    public record RemoveProductResponseDto(
        @Schema(description = "Success status", example = "true")
        boolean success,
        @Schema(description = "Response message", example = "Product removed successfully")
        String message,
        @Schema(description = "Previous product status", example = "active")
        String previousStatus
    ) {}
}
