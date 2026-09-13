package gateway.grpc;

import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auction.proto.admin.product.*;
import com.auction.utils.JsonUtils;
import com.auction.grpc.GrpcConstants;
import com.auction.config.ConfigConstants;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import reactor.core.publisher.Mono;

/**
 * gRPC client for Admin Product Service.
 *
 * Manages the connection to the remote Admin Product Service and provides
 * reactive stubs for calling remote procedures.
 *
 * Features:
 * - Connection pooling with keep-alive
 * - Proper channel lifecycle management
 * - Error handling and timeout configuration
 * - Graceful shutdown
 *
 * Configuration properties:
 * - grpc.product-service.host: Service host (default: localhost)
 * - grpc.product-service.port: Service port (default: 9091)
 */
@Component
public class AdminProductGrpcClient {
    private static final Logger log = LoggerFactory.getLogger(AdminProductGrpcClient.class);

    @Value("${grpc.product-service.host:localhost}")
    private String productServiceHost;

    @Value("${grpc.product-service.port:9091}")
    private int productServicePort;

    private ManagedChannel channel;
    private ReactorAdminProductServiceGrpc.ReactorAdminProductServiceStub adminProductServiceStub;

    /**
     * Initializes the gRPC channel and creates the stub after Spring constructs this bean.
     */
    @PostConstruct
    public void init() {
        if (channel != null) {
            log.debug("Channel already initialized");
            return;
        }

        try {
            channel = ManagedChannelBuilder
                    .forAddress(productServiceHost, productServicePort)
                    .usePlaintext()
                    .keepAliveTime(GrpcConstants.KEEP_ALIVE_TIME_SECONDS, TimeUnit.SECONDS)
                    .keepAliveTimeout(GrpcConstants.KEEP_ALIVE_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .idleTimeout(GrpcConstants.CHANNEL_IDLE_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .build();

            adminProductServiceStub = ReactorAdminProductServiceGrpc.newReactorStub(channel);

            log.info("gRPC Admin Product Service client initialized: {}:{}", productServiceHost, productServicePort);
        } catch (Exception e) {
            log.error("Failed to initialize gRPC Admin Product Service client: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Gracefully shuts down the gRPC channel.
     * Ensures all pending calls are completed before shutdown.
     */
    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            try {
                channel.shutdown().awaitTermination(5, TimeUnit.SECONDS);
                log.info("gRPC Admin Product Service channel shutdown completed");
            } catch (InterruptedException e) {
                log.warn("Interrupted while waiting for channel shutdown: {}", e.getMessage());
                channel.shutdownNow();
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("Error during channel shutdown: {}", e.getMessage(), e);
                channel.shutdownNow();
            }
        }
    }

    /**
     * Creates a new product category.
     *
     * @param request The category creation request
     * @return Response containing category ID and status
     */
    public Mono<CreateCategoryResponse> createCategory(CreateCategoryRequest request) {
        log.debug("Creating category: {}", request.getName());
        return adminProductServiceStub.createCategory(Mono.just(request))
            .timeout(java.time.Duration.ofMillis(GrpcConstants.MEDIUM_TIMEOUT_MS))
            .doOnError(e -> log.error("Error creating category: {}", e.getMessage()))
            .onErrorMap(e -> new RuntimeException("Failed to create category: " + e.getMessage(), e));
    }

    /**
     * Updates an existing product category.
     *
     * @param request The category update request
     * @return Response with update status
     */
    public Mono<UpdateCategoryResponse> updateCategory(UpdateCategoryRequest request) {
        log.debug("Updating category: {}", request.getCategoryId());
        return adminProductServiceStub.updateCategory(Mono.just(request))
            .timeout(java.time.Duration.ofMillis(GrpcConstants.MEDIUM_TIMEOUT_MS))
            .doOnError(e -> log.error("Error updating category {}: {}", request.getCategoryId(), e.getMessage()))
            .onErrorMap(e -> new RuntimeException("Failed to update category: " + e.getMessage(), e));
    }

    /**
     * Deletes a product category.
     *
     * @param request The category deletion request
     * @return Response with deletion status
     */
    public Mono<DeleteCategoryResponse> deleteCategory(DeleteCategoryRequest request) {
        log.debug("Deleting category: {}", request.getCategoryId());
        return adminProductServiceStub.deleteCategory(Mono.just(request))
            .timeout(java.time.Duration.ofMillis(GrpcConstants.MEDIUM_TIMEOUT_MS))
            .doOnError(e -> log.error("Error deleting category {}: {}", request.getCategoryId(), e.getMessage()))
            .onErrorMap(e -> new RuntimeException("Failed to delete category: " + e.getMessage(), e));
    }

    /**
     * Removes a product from the catalog.
     *
     * @param request The product removal request with reason
     * @return Response with removal status
     */
    public Mono<RemoveProductResponse> removeProduct(RemoveProductRequest request) {
        log.debug("Removing product: {}, reason: {}", request.getProductId(), request.getReason());
        return adminProductServiceStub.removeProduct(Mono.just(request))
            .timeout(java.time.Duration.ofMillis(GrpcConstants.MEDIUM_TIMEOUT_MS))
            .doOnError(e -> log.error("Error removing product {}: {}", request.getProductId(), e.getMessage()))
            .onErrorMap(e -> new RuntimeException("Failed to remove product: " + e.getMessage(), e));
    }
}
