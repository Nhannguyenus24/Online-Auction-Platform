package gateway.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.auction.utils.JsonUtils;
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
import com.auction.proto.admin.user.GetUpgradeRequestsRequest;
import com.auction.proto.admin.user.ProfitStatisticsRequest;
import com.auction.proto.admin.user.RegistrationStatisticsRequest;
import com.auction.proto.admin.user.UserStatisticsRequest;

import gateway.grpc.AdminProductGrpcClient;
import gateway.grpc.AdminUserGrpcClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

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
    public ResponseEntity<Map<String, Object>> getUserStatistics(
            @Parameter(description = "Role filter (bidder, seller, admin)")
            @RequestParam(required = false, defaultValue = "") String roleFilter) {
        
        log.info("Get user statistics request - roleFilter: {}", roleFilter);

        UserStatisticsRequest grpcRequest = UserStatisticsRequest.newBuilder()
                .setRoleFilter(roleFilter)
                .build();

        try {
            var response = adminUserGrpcClient.getUserStatistics(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalUsers", response.getTotalUsers());
            result.put("totalBidders", response.getTotalBidders());
            result.put("totalSellers", response.getTotalSellers());
            result.put("totalAdmins", response.getTotalAdmins());
            result.put("verifiedUsers", response.getVerifiedUsers());
            result.put("unverifiedUsers", response.getUnverifiedUsers());
            result.put("averageRating", response.getAverageRating());
            result.put("positiveReviews", response.getPositiveReviews());
            result.put("negativeReviews", response.getNegativeReviews());

            log.info("Get user statistics successful");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get user statistics error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get user statistics: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/statistics/registrations")
    @Operation(summary = "Get registration statistics", description = "Get user registration statistics by period (daily, monthly, yearly). Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> getRegistrationStatistics(
            @Parameter(description = "Period type (daily, monthly, yearly)", required = true)
            @RequestParam String period,
            @Parameter(description = "Number of periods to return")
            @RequestParam(defaultValue = "30") int limit) {
        
        log.info("Get registration statistics request - period: {}, limit: {}", period, limit);

        RegistrationStatisticsRequest grpcRequest = RegistrationStatisticsRequest.newBuilder()
                .setPeriod(period)
                .setLimit(limit)
                .build();

        try {
            var response = adminUserGrpcClient.getRegistrationStatistics(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            Map<String, Object> result = new HashMap<>();
            
            if (period.equalsIgnoreCase("daily")) {
                List<Map<String, Object>> daily = new ArrayList<>();
                response.getDailyList().forEach(d -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("date", d.getDate());
                    item.put("count", d.getCount());
                    daily.add(item);
                });
                result.put("daily", daily);
            } else if (period.equalsIgnoreCase("monthly")) {
                List<Map<String, Object>> monthly = new ArrayList<>();
                response.getMonthlyList().forEach(m -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("month", m.getMonth());
                    item.put("count", m.getCount());
                    monthly.add(item);
                });
                result.put("monthly", monthly);
            } else if (period.equalsIgnoreCase("yearly")) {
                List<Map<String, Object>> yearly = new ArrayList<>();
                response.getYearlyList().forEach(y -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("year", y.getYear());
                    item.put("count", y.getCount());
                    yearly.add(item);
                });
                result.put("yearly", yearly);
            }

            log.info("Get registration statistics successful");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get registration statistics error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get registration statistics: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/statistics/profit")
    @Operation(summary = "Get profit statistics", description = "Get profit statistics by month or year (30% of successful transactions). Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> getProfitStatistics(
            @Parameter(description = "Month in format YYYY-MM")
            @RequestParam(required = false, defaultValue = "") String month,
            @Parameter(description = "Year in format YYYY")
            @RequestParam(required = false, defaultValue = "") String year) {
        
        log.info("Get profit statistics request - month: {}, year: {}", month, year);

        ProfitStatisticsRequest grpcRequest = ProfitStatisticsRequest.newBuilder()
                .setMonth(month)
                .setYear(year)
                .build();

        try {
            var response = adminUserGrpcClient.getProfitStatistics(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            Map<String, Object> result = new HashMap<>();
            
            if (response.hasMonthlyProfit()) {
                Map<String, Object> monthlyProfit = new HashMap<>();
                monthlyProfit.put("month", response.getMonthlyProfit().getMonth());
                monthlyProfit.put("totalSales", response.getMonthlyProfit().getTotalSales());
                monthlyProfit.put("profit", response.getMonthlyProfit().getProfit());
                monthlyProfit.put("completedOrders", response.getMonthlyProfit().getCompletedOrders());
                result.put("monthlyProfit", monthlyProfit);
            }
            
            if (response.hasYearlyProfit()) {
                Map<String, Object> yearlyProfit = new HashMap<>();
                yearlyProfit.put("year", response.getYearlyProfit().getYear());
                yearlyProfit.put("totalSales", response.getYearlyProfit().getTotalSales());
                yearlyProfit.put("profit", response.getYearlyProfit().getProfit());
                yearlyProfit.put("completedOrders", response.getYearlyProfit().getCompletedOrders());
                result.put("yearlyProfit", yearlyProfit);
            }

            log.info("Get profit statistics successful: {}",JsonUtils.toJson(result));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get profit statistics error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get profit statistics: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // UPGRADE REQUESTS
    // ============================================================================

    @GetMapping("/upgrade-requests")
    @Operation(summary = "Get upgrade requests", description = "Get all upgrade requests (bidder -> seller) with pagination. Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> getUpgradeRequests(
            @Parameter(description = "Status filter (pending, approved, rejected)")
            @RequestParam(required = false, defaultValue = "") String statusFilter,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") int pageSize) {
        
        log.info("Get upgrade requests - statusFilter: {}, page: {}, pageSize: {}", statusFilter, page, pageSize);

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
            
            List<Map<String, Object>> requests = new ArrayList<>();
            response.getUpgradeRequestsList().forEach(req -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", req.getId());
                item.put("userId", req.getUserId());
                item.put("userEmail", req.getUserEmail());
                item.put("userFullName", req.getUserFullName());
                item.put("requestedRole", req.getRequestedRole());
                item.put("status", req.getStatus());
                item.put("createdAt", req.getCreatedAt());
                item.put("reviewedAt", req.getReviewedAt());
                item.put("adminId", req.getAdminId());
                item.put("reason", req.getReason());
                requests.add(item);
            });
            
            Map<String, Object> result = new HashMap<>();
            result.put("upgradeRequests", requests);
            result.put("totalCount", response.getTotalCount());
            result.put("page", response.getPage());
            result.put("totalPages", response.getTotalPages());

            log.info("Get upgrade requests successful - count: {}", requests.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get upgrade requests error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get upgrade requests: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/upgrade-requests/{requestId}")
    @Operation(summary = "Approve or reject upgrade request", description = "Approve or reject a user upgrade request. Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> processUpgradeRequest(
            @Parameter(description = "Request ID", required = true)
            @PathVariable int requestId,
            @RequestBody ProcessUpgradeRequestDto requestDto) {
        
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
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

            log.info("Process upgrade request response - success: {}", response.getSuccess());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Process upgrade request error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to process upgrade request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // CATEGORY MANAGEMENT
    // ============================================================================

    @PostMapping("/categories")
    @Operation(summary = "Create category", description = "Create a new product category. Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> createCategory(
            @RequestBody CreateCategoryRequestDto requestDto) {
        
        log.info("Create category request - name: {}, parentId: {}", requestDto.name(), requestDto.parentId());

        CreateCategoryRequest grpcRequest = CreateCategoryRequest.newBuilder()
                .setName(requestDto.name())
                .setParentId(requestDto.parentId() != null ? requestDto.parentId() : 0)
                .build();

        try {
            var response = adminProductGrpcClient.createCategory(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            if (response.getSuccess()) {
                result.put("categoryId", response.getCategoryId());
            }

            log.info("Create category response - success: {}, categoryId: {}", 
                    response.getSuccess(), response.getCategoryId());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Create category error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to create category: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/categories/{categoryId}")
    @Operation(summary = "Update category", description = "Update an existing product category. Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> updateCategory(
            @Parameter(description = "Category ID", required = true)
            @PathVariable int categoryId,
            @RequestBody UpdateCategoryRequestDto requestDto) {
        
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
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

            log.info("Update category response - success: {}", response.getSuccess());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Update category error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to update category: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/categories/{categoryId}")
    @Operation(summary = "Delete category", description = "Delete a product category. Cannot delete if category has products. Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> deleteCategory(
            @Parameter(description = "Category ID", required = true)
            @PathVariable int categoryId) {
        
        log.info("Delete category request - categoryId: {}", categoryId);

        DeleteCategoryRequest grpcRequest = DeleteCategoryRequest.newBuilder()
                .setCategoryId(categoryId)
                .build();

        try {
            var response = adminProductGrpcClient.deleteCategory(grpcRequest).block();
            if (response == null) {
                throw new RuntimeException("gRPC response is null");
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            result.put("hasProducts", response.getHasProducts());

            log.info("Delete category response - success: {}, hasProducts: {}", 
                    response.getSuccess(), response.getHasProducts());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Delete category error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to delete category: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // PRODUCT MANAGEMENT
    // ============================================================================

    @DeleteMapping("/products/{productId}")
    @Operation(summary = "Remove product", description = "Remove/ban a product from the platform. Requires admin authentication.")
    public ResponseEntity<Map<String, Object>> removeProduct(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @RequestBody RemoveProductRequestDto requestDto) {
        
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
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            if (response.getSuccess()) {
                result.put("previousStatus", response.getPreviousStatus());
            }

            log.info("Remove product response - success: {}, previousStatus: {}", 
                    response.getSuccess(), response.getPreviousStatus());
            
            return response.getSuccess() 
                ? ResponseEntity.ok(result)
                : ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            log.error("Remove product error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to remove product: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // REQUEST DTOs
    // ============================================================================

    public record CreateCategoryRequestDto(
        String name,
        Integer parentId
    ) {}

    public record UpdateCategoryRequestDto(
        String name,
        Integer parentId
    ) {}

    public record RemoveProductRequestDto(
        String reason
    ) {}

    public record ProcessUpgradeRequestDto(
        String action,  // "approve" or "reject"
        String reason   // Optional: reason for rejection
    ) {}
}
