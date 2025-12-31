package products.grpc;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.grpc.server.service.GrpcService;

import com.auction.proto.admin.product.CreateCategoryRequest;
import com.auction.proto.admin.product.CreateCategoryResponse;
import com.auction.proto.admin.product.DeleteCategoryRequest;
import com.auction.proto.admin.product.DeleteCategoryResponse;
import com.auction.proto.admin.product.ReactorAdminProductServiceGrpc;
import com.auction.proto.admin.product.RemoveProductRequest;
import com.auction.proto.admin.product.RemoveProductResponse;
import com.auction.proto.admin.product.UpdateCategoryRequest;
import com.auction.proto.admin.product.UpdateCategoryResponse;
import com.auction.utils.JsonUtils;

import products.service.AdminService;
import reactor.core.publisher.Mono;

/**
 * gRPC implementation of AdminProductService
 * Gateway will call this service for admin product/category management
 */
@GrpcService
public class AdminGrpcService extends ReactorAdminProductServiceGrpc.AdminProductServiceImplBase {
    
    private static final Logger log = LoggerFactory.getLogger(AdminGrpcService.class);
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
            .doOnNext(req -> log.info("Create category request: {}", JsonUtils.toJson(req)))
            .flatMap(req -> 
                adminService.createCategory(req.getName(), req.getParentId())
                    .map(result -> {
                        Integer categoryIdValue = result.categoryId();
                        int categoryId = (categoryIdValue != null) ? categoryIdValue : 0;
                        return CreateCategoryResponse.newBuilder()
                            .setSuccess(result.success())
                            .setMessage(result.message())
                            .setCategoryId(categoryId)
                            .build();
                    })
            )
            .doOnNext(resp -> log.info("Create category response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Create category error: {}", e.getMessage(), e);
                return Mono.just(CreateCategoryResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Error creating category: " + e.getMessage())
                    .setCategoryId(0)
                    .build());
            });
    }

    @Override
    public Mono<UpdateCategoryResponse> updateCategory(Mono<UpdateCategoryRequest> request) {
        return request
            .doOnNext(req -> log.info("Update category request: {}", JsonUtils.toJson(req)))
            .flatMap(req -> 
                adminService.updateCategory(req.getCategoryId(), req.getName(), req.getParentId())
                    .map(result -> UpdateCategoryResponse.newBuilder()
                        .setSuccess(result.success())
                        .setMessage(result.message())
                        .build()
                    )
            )
            .doOnNext(resp -> log.info("Update category response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Update category error: {}", e.getMessage(), e);
                return Mono.just(UpdateCategoryResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Error updating category: " + e.getMessage())
                    .build());
            });
    }

    @Override
    public Mono<DeleteCategoryResponse> deleteCategory(Mono<DeleteCategoryRequest> request) {
        return request
            .doOnNext(req -> log.info("Delete category request: {}", JsonUtils.toJson(req)))
            .flatMap(req -> 
                adminService.deleteCategory(req.getCategoryId())
                    .map(result -> DeleteCategoryResponse.newBuilder()
                        .setSuccess(result.success())
                        .setMessage(result.message())
                        .setHasProducts(result.hasProducts())
                        .build()
                    )
            )
            .doOnNext(resp -> log.info("Delete category response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Delete category error: {}", e.getMessage(), e);
                return Mono.just(DeleteCategoryResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Error deleting category: " + e.getMessage())
                    .setHasProducts(false)
                    .build());
            });
    }

    // ============================================================================
    // PRODUCT MANAGEMENT
    // ============================================================================

    @Override
    public Mono<RemoveProductResponse> removeProduct(Mono<RemoveProductRequest> request) {
        return request
            .doOnNext(req -> log.info("Remove product request: {}", JsonUtils.toJson(req)))
            .flatMap(req -> 
                adminService.removeProduct(req.getProductId(), req.getAdminId(), req.getReason())
                    .map(result -> RemoveProductResponse.newBuilder()
                        .setSuccess(result.success())
                        .setMessage(result.message())
                        .setPreviousStatus(result.previousStatus() != null ? result.previousStatus() : "")
                        .build()
                    )
            )
            .doOnNext(resp -> log.info("Remove product response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Remove product error: {}", e.getMessage(), e);
                return Mono.just(RemoveProductResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Error removing product: " + e.getMessage())
                    .setPreviousStatus("")
                    .build());
            });
    }
}
