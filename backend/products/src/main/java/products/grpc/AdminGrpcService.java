package products.grpc;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.grpc.server.service.GrpcService;

import com.auction.proto.admin.product.*;
import com.auction.utils.JsonUtils;
import com.auction.exception.ValidationException;
import com.auction.exception.ResourceNotFoundException;
import com.auction.grpc.GrpcErrorHandler;
import com.auction.grpc.GrpcRequestValidator;
import com.auction.grpc.GrpcConstants;

import products.service.AdminService;
import reactor.core.publisher.Mono;

/**
 * gRPC implementation of AdminProductService with enterprise-grade error handling.
 *
 * Features:
 * - Comprehensive input validation at gRPC boundary
 * - Proper gRPC status code mapping for all error scenarios
 * - Timeout handling for all operations
 * - Structured logging with error context
 *
 * Gateway will call this service for admin product/category management operations.
 */
@GrpcService
public class AdminGrpcService extends ReactorAdminProductServiceGrpc.AdminProductServiceImplBase {

    private static final Logger log = LoggerFactory.getLogger(AdminGrpcService.class);
    private static final String SERVICE_NAME = "AdminProductGrpcService";
    private final AdminService adminService;

    public AdminGrpcService(AdminService adminService) {
        this.adminService = adminService;
    }

    // ============================================================================
    // CATEGORY MANAGEMENT
    // ============================================================================

    @Override
    public Mono<CreateCategoryResponse> createCategory(Mono<CreateCategoryRequest> request) {
        return request
            .timeout(java.time.Duration.ofMillis(GrpcConstants.MEDIUM_TIMEOUT_MS))
            .doOnNext(req -> log.debug("Create category request: {}", req.getName()))
            .flatMap(req -> {
                try {
                    // Validate request at gRPC boundary
                    GrpcRequestValidator.validateRequired(req.getName(), "name");
                    GrpcRequestValidator.validateMaxLength(req.getName(), GrpcConstants.MAX_STRING_LENGTH, "name");
                    GrpcRequestValidator.validateNonNegative(req.getParentId(), "parentId");

                    return adminService.createCategory(req.getName(), req.getParentId())
                        .map(result -> {
                            Integer categoryIdValue = result.categoryId();
                            int categoryId = (categoryIdValue != null) ? categoryIdValue : 0;
                            log.info("Category created successfully with ID: {}", categoryId);
                            return CreateCategoryResponse.newBuilder()
                                .setSuccess(result.success())
                                .setMessage(result.message())
                                .setCategoryId(categoryId)
                                .build();
                        })
                        .onErrorResume(e -> {
                            log.error("Error creating category '{}': {}", req.getName(), e.getMessage(), e);
                            throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".createCategory");
                        });
                } catch (ValidationException e) {
                    log.warn("Category creation validation error: {}", e.getMessage());
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".createCategory");
                } catch (Exception e) {
                    log.error("Unexpected error in createCategory: {}", e.getMessage(), e);
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".createCategory");
                }
            });
    }

    @Override
    public Mono<UpdateCategoryResponse> updateCategory(Mono<UpdateCategoryRequest> request) {
        return request
            .timeout(java.time.Duration.ofMillis(GrpcConstants.MEDIUM_TIMEOUT_MS))
            .doOnNext(req -> log.debug("Update category request: ID={}, name={}", req.getCategoryId(), req.getName()))
            .flatMap(req -> {
                try {
                    // Validate request at gRPC boundary
                    GrpcRequestValidator.validatePositive(req.getCategoryId(), "categoryId");
                    GrpcRequestValidator.validateRequired(req.getName(), "name");
                    GrpcRequestValidator.validateMaxLength(req.getName(), GrpcConstants.MAX_STRING_LENGTH, "name");
                    GrpcRequestValidator.validateNonNegative(req.getParentId(), "parentId");

                    return adminService.updateCategory(req.getCategoryId(), req.getName(), req.getParentId())
                        .map(result -> {
                            log.info("Category updated successfully: ID={}", req.getCategoryId());
                            return UpdateCategoryResponse.newBuilder()
                                .setSuccess(result.success())
                                .setMessage(result.message())
                                .build();
                        })
                        .onErrorResume(e -> {
                            log.error("Error updating category {}: {}", req.getCategoryId(), e.getMessage(), e);
                            throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".updateCategory");
                        });
                } catch (ValidationException e) {
                    log.warn("Category update validation error: {}", e.getMessage());
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".updateCategory");
                } catch (Exception e) {
                    log.error("Unexpected error in updateCategory: {}", e.getMessage(), e);
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".updateCategory");
                }
            });
    }

    @Override
    public Mono<DeleteCategoryResponse> deleteCategory(Mono<DeleteCategoryRequest> request) {
        return request
            .timeout(java.time.Duration.ofMillis(GrpcConstants.MEDIUM_TIMEOUT_MS))
            .doOnNext(req -> log.debug("Delete category request: ID={}", req.getCategoryId()))
            .flatMap(req -> {
                try {
                    // Validate request at gRPC boundary
                    GrpcRequestValidator.validatePositive(req.getCategoryId(), "categoryId");

                    return adminService.deleteCategory(req.getCategoryId())
                        .map(result -> {
                            log.info("Category deleted successfully: ID={}", req.getCategoryId());
                            return DeleteCategoryResponse.newBuilder()
                                .setSuccess(result.success())
                                .setMessage(result.message())
                                .setHasProducts(result.hasProducts())
                                .build();
                        })
                        .onErrorResume(e -> {
                            log.error("Error deleting category {}: {}", req.getCategoryId(), e.getMessage(), e);
                            throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".deleteCategory");
                        });
                } catch (ValidationException e) {
                    log.warn("Category deletion validation error: {}", e.getMessage());
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".deleteCategory");
                } catch (Exception e) {
                    log.error("Unexpected error in deleteCategory: {}", e.getMessage(), e);
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".deleteCategory");
                }
            });
    }

    // ============================================================================
    // PRODUCT MANAGEMENT
    // ============================================================================

    @Override
    public Mono<RemoveProductResponse> removeProduct(Mono<RemoveProductRequest> request) {
        return request
            .timeout(java.time.Duration.ofMillis(GrpcConstants.MEDIUM_TIMEOUT_MS))
            .doOnNext(req -> log.debug("Remove product request: productId={}, adminId={}", req.getProductId(), req.getAdminId()))
            .flatMap(req -> {
                try {
                    // Validate request at gRPC boundary
                    GrpcRequestValidator.validatePositive(req.getProductId(), "productId");
                    GrpcRequestValidator.validatePositive(req.getAdminId(), "adminId");
                    GrpcRequestValidator.validateRequired(req.getReason(), "reason");
                    GrpcRequestValidator.validateMaxLength(req.getReason(), GrpcConstants.MAX_MESSAGE_LENGTH, "reason");

                    return adminService.removeProduct(req.getProductId(), req.getAdminId(), req.getReason())
                        .map(result -> {
                            log.info("Product removed successfully: productId={}, reason={}", req.getProductId(), req.getReason());
                            return RemoveProductResponse.newBuilder()
                                .setSuccess(result.success())
                                .setMessage(result.message())
                                .setPreviousStatus(result.previousStatus() != null ? result.previousStatus() : "")
                                .build();
                        })
                        .onErrorResume(e -> {
                            log.error("Error removing product {}: {}", req.getProductId(), e.getMessage(), e);
                            throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".removeProduct");
                        });
                } catch (ValidationException e) {
                    log.warn("Product removal validation error: {}", e.getMessage());
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".removeProduct");
                } catch (Exception e) {
                    log.error("Unexpected error in removeProduct: {}", e.getMessage(), e);
                    throw GrpcErrorHandler.handleException(e, SERVICE_NAME + ".removeProduct");
                }
            });
    }
}
