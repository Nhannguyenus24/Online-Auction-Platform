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
import com.auction.utils.JsonUtils;

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
    public ResponseEntity<UserStatisticsResponseDto> getUserStatistics(
            @Parameter(description = "Role filter (bidder, seller, admin)")
            @RequestParam(required = false, defaultValue = "") String roleFilter) {
        
        log.info("Get user statistics request - roleFilter: {}", roleFilter);

        // Validate roleFilter if provided
        if (!roleFilter.isEmpty() && !roleFilter.matches("^(bidder|seller|admin)$")) {
            log.error("Invalid roleFilter value: {}", roleFilter);
            return ResponseEntity.badRequest().body(null);
        }

        UserStatisticsRequest grpcRequest = UserStatisticsRequest.newBuilder()
                .setRoleFilter(roleFilter)
                .build();

        try {
            var response = adminUserGrpcClient.getUserStatistics(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
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

            log.info("Get user statistics successful");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get user statistics error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/statistics/registrations")
    @Operation(summary = "Get registration statistics", description = "Get user registration statistics by period (daily, monthly, yearly). Requires admin authentication.")
    public ResponseEntity<RegistrationStatisticsResponseDto> getRegistrationStatistics(
            @Parameter(description = "Period type (daily, monthly, yearly)", required = true)
            @RequestParam String period,
            @Parameter(description = "Number of periods to return")
            @RequestParam(defaultValue = "30") @Positive(message = "Limit must be greater than 0") int limit) {
        
        log.info("Get registration statistics request - period: {}, limit: {}", period, limit);

        // Validate period
        if (!period.matches("^(daily|monthly|yearly)$")) {
            log.error("Invalid period value: {}. Must be: daily, monthly, or yearly", period);
            return ResponseEntity.badRequest().body(null);
        }

        RegistrationStatisticsRequest grpcRequest = RegistrationStatisticsRequest.newBuilder()
                .setPeriod(period)
                .setLimit(limit)
                .build();

        try {
            var response = adminUserGrpcClient.getRegistrationStatistics(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
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

            log.info("Get registration statistics successful");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get registration statistics error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/statistics/profit")
    @Operation(summary = "Get profit statistics", description = "Get profit statistics by month or year (30% of successful transactions). Requires admin authentication.")
    public ResponseEntity<ProfitStatisticsResponseDto> getProfitStatistics(
            @Parameter(description = "Month in format YYYY-MM")
            @RequestParam(required = false, defaultValue = "") String month,
            @Parameter(description = "Year in format YYYY")
            @RequestParam(required = false, defaultValue = "") String year) {
        
        log.info("Get profit statistics request - month: {}, year: {}", month, year);

        // Validate month format if provided
        if (!month.isEmpty() && !month.matches("^\\d{4}-\\d{2}$")) {
            log.error("Invalid month format: {}. Must be YYYY-MM", month);
            return ResponseEntity.badRequest().body(null);
        }

        // Validate year format if provided
        if (!year.isEmpty() && !year.matches("^\\d{4}$")) {
            log.error("Invalid year format: {}. Must be YYYY", year);
            return ResponseEntity.badRequest().body(null);
        }

        ProfitStatisticsRequest grpcRequest = ProfitStatisticsRequest.newBuilder()
                .setMonth(month)
                .setYear(year)
                .build();

        try {
            var response = adminUserGrpcClient.getProfitStatistics(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
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

            log.info("Get profit statistics successful: {}", JsonUtils.toJson(result));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get profit statistics error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ============================================================================
    // UPGRADE REQUESTS
    // ============================================================================

    @GetMapping("/users")
    @Operation(summary = "Get all users", description = "Get all users with pagination and search. Requires admin authentication.")
    public ResponseEntity<UsersResponseDto> getAllUsers(
            @Parameter(description = "Search query (name, email, or phone)")
            @RequestParam(required = false, defaultValue = "") String searchQuery,
            @Parameter(description = "Role filter (bidder, seller, admin)")
            @RequestParam(required = false, defaultValue = "") String roleFilter,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") @Positive(message = "PageSize must be greater than 0") @Max(value = 100, message = "PageSize must not exceed 100") int pageSize) {
        
        log.info("Get all users - searchQuery: {}, roleFilter: {}, page: {}, pageSize: {}", 
                searchQuery, roleFilter, page, pageSize);

        // Validate roleFilter if provided
        if (!roleFilter.isEmpty() && !roleFilter.matches("^(bidder|seller|admin)$")) {
            return ResponseEntity.badRequest().body(null);
        }

        GetAllUsersRequest grpcRequest = GetAllUsersRequest.newBuilder()
                .setSearchQuery(searchQuery)
                .setRoleFilter(roleFilter)
                .setPage(page)
                .setPageSize(pageSize)
                .build();

        try {
            var response = adminUserGrpcClient.getAllUsers(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
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
                    user.getRatingPercent(),
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

            log.info("Get all users successful - count: {}", users.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get all users error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/upgrade-requests")
    @Operation(summary = "Get upgrade requests", description = "Get all upgrade requests (bidder -> seller) with pagination. Requires admin authentication.")
    public ResponseEntity<UpgradeRequestsResponseDto> getUpgradeRequests(
            @Parameter(description = "Status filter (pending, approved, rejected)")
            @RequestParam(required = false, defaultValue = "") String statusFilter,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") @Positive(message = "PageSize must be greater than 0") @Max(value = 100, message = "PageSize must not exceed 100") int pageSize) {
        
        log.info("Get upgrade requests - statusFilter: {}, page: {}, pageSize: {}", statusFilter, page, pageSize);

        // Validate statusFilter if provided
        if (!statusFilter.isEmpty() && !statusFilter.matches("^(pending|approved|rejected)$")) {
            log.error("Invalid statusFilter value: {}", statusFilter);
            return ResponseEntity.badRequest().body(null);
        }

        GetUpgradeRequestsRequest grpcRequest = GetUpgradeRequestsRequest.newBuilder()
                .setStatusFilter(statusFilter)
                .setPage(page)
                .setPageSize(pageSize)
                .build();

        try {
            var response = adminUserGrpcClient.getUpgradeRequests(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
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

            log.info("Get upgrade requests successful - count: {}", requests.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get upgrade requests error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/upgrade-requests/{requestId}")
    @Operation(summary = "Approve or reject upgrade request", description = "Approve or reject a user upgrade request. Requires admin authentication.")
    public ResponseEntity<StandardResponseDto> processUpgradeRequest(
            @Parameter(description = "Request ID", required = true)
            @PathVariable @Positive(message = "Request ID must be greater than 0") int requestId,
            @Valid @RequestBody ProcessUpgradeRequestDto requestDto) {
        
        int adminId = getUserId();
        log.info("Process upgrade request - requestId: {}, adminId: {}, action: {}", 
                requestId, adminId, requestDto.action());

        ApproveUpgradeRequestRequest grpcRequest = ApproveUpgradeRequestRequest.newBuilder()
                .setRequestId(requestId)
                .setAdminId(adminId)
                .setAction(requestDto.action())
                .setReason(requestDto.reason() != null ? requestDto.reason() : "")
                .build();

        try {
            var response = adminUserGrpcClient.approveUpgradeRequest(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            StandardResponseDto result = new StandardResponseDto(response.getSuccess(), response.getMessage());

            log.info("Process upgrade request response - success: {}", response.getSuccess());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Process upgrade request error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new StandardResponseDto(false, "Failed to process upgrade request: " + e.getMessage()));
        }
    }

    // ============================================================================
    // CATEGORY MANAGEMENT
    // ============================================================================

    @PostMapping("/categories")
    @Operation(summary = "Create category", description = "Create a new product category. Requires admin authentication.")
    public ResponseEntity<CreateCategoryResponseDto> createCategory(
            @Valid @RequestBody CreateCategoryRequestDto requestDto) {
        
        log.info("Create category request - name: {}, parentId: {}", requestDto.name(), requestDto.parentId());

        // Validate parentId if provided
        if (requestDto.parentId() != null && requestDto.parentId() < 0) {
            log.error("Invalid parentId value: {}. Must be >= 0", requestDto.parentId());
            return ResponseEntity.badRequest().body(
                new CreateCategoryResponseDto(false, "Parent ID must be greater than or equal to 0", null)
            );
        }

        CreateCategoryRequest grpcRequest = CreateCategoryRequest.newBuilder()
                .setName(requestDto.name())
                .setParentId(requestDto.parentId() != null ? requestDto.parentId() : 0)
                .build();

        try {
            var response = adminProductGrpcClient.createCategory(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            CreateCategoryResponseDto result = new CreateCategoryResponseDto(
                response.getSuccess(),
                response.getMessage(),
                response.getSuccess() ? response.getCategoryId() : null
            );

            log.info("Create category response - success: {}, categoryId: {}", 
                    response.getSuccess(), response.getCategoryId());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Create category error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new CreateCategoryResponseDto(false, "Failed to create category: " + e.getMessage(), null));
        }
    }

    @PutMapping("/categories/{categoryId}")
    @Operation(summary = "Update category", description = "Update an existing product category. Requires admin authentication.")
    public ResponseEntity<StandardResponseDto> updateCategory(
            @Parameter(description = "Category ID", required = true)
            @PathVariable @Positive(message = "Category ID must be greater than 0") int categoryId,
            @Valid @RequestBody UpdateCategoryRequestDto requestDto) {
        
        log.info("Update category request - categoryId: {}, name: {}, parentId: {}", 
                categoryId, requestDto.name(), requestDto.parentId());

        UpdateCategoryRequest grpcRequest = UpdateCategoryRequest.newBuilder()
                .setCategoryId(categoryId)
                .setName(requestDto.name())
                .setParentId(requestDto.parentId() != null ? requestDto.parentId() : 0)
                .build();

        try {
            var response = adminProductGrpcClient.updateCategory(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            StandardResponseDto result = new StandardResponseDto(response.getSuccess(), response.getMessage());

            log.info("Update category response - success: {}", response.getSuccess());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Update category error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new StandardResponseDto(false, "Failed to update category: " + e.getMessage()));
        }
    }

    @DeleteMapping("/categories/{categoryId}")
    @Operation(summary = "Delete category", description = "Delete a product category. Cannot delete if category has products. Requires admin authentication.")
    public ResponseEntity<DeleteCategoryResponseDto> deleteCategory(
            @Parameter(description = "Category ID", required = true)
            @PathVariable @Positive(message = "Category ID must be greater than 0") int categoryId) {
        
        log.info("Delete category request - categoryId: {}", categoryId);

        DeleteCategoryRequest grpcRequest = DeleteCategoryRequest.newBuilder()
                .setCategoryId(categoryId)
                .build();

        try {
            var response = adminProductGrpcClient.deleteCategory(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            DeleteCategoryResponseDto result = new DeleteCategoryResponseDto(
                response.getSuccess(),
                response.getMessage(),
                response.getHasProducts()
            );

            log.info("Delete category response - success: {}, hasProducts: {}", 
                    response.getSuccess(), response.getHasProducts());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Delete category error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new DeleteCategoryResponseDto(false, "Failed to delete category: " + e.getMessage(), false));
        }
    }

    // ============================================================================
    // PRODUCT MANAGEMENT
    // ============================================================================

    @DeleteMapping("/products/{productId}")
    @Operation(summary = "Remove product", description = "Remove/ban a product from the platform. Requires admin authentication.")
    public ResponseEntity<RemoveProductResponseDto> removeProduct(
            @Parameter(description = "Product ID", required = true)
            @PathVariable @Positive(message = "Product ID must be greater than 0") int productId,
            @Valid @RequestBody RemoveProductRequestDto requestDto) {
        
        int adminId = getUserId();
        log.info("Remove product request - productId: {}, adminId: {}, reason: {}", 
                productId, adminId, requestDto.reason());

        RemoveProductRequest grpcRequest = RemoveProductRequest.newBuilder()
                .setProductId(productId)
                .setAdminId(adminId)
                .setReason(requestDto.reason())
                .build();

        try {
            var response = adminProductGrpcClient.removeProduct(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            RemoveProductResponseDto result = new RemoveProductResponseDto(
                response.getSuccess(),
                response.getMessage(),
                response.getSuccess() ? response.getPreviousStatus() : null
            );

            log.info("Remove product response - success: {}, previousStatus: {}", 
                    response.getSuccess(), response.getPreviousStatus());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Remove product error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new RemoveProductResponseDto(false, "Failed to remove product: " + e.getMessage(), null));
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
        @Schema(description = "Rating percentage", example = "88.5")
        double ratingPercent,
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
