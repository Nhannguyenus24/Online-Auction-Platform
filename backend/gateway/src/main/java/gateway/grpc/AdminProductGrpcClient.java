package gateway.grpc;

import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

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

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import reactor.core.publisher.Mono;

@Component
public class AdminProductGrpcClient {
    private static final Logger log = LoggerFactory.getLogger(AdminProductGrpcClient.class);
    
    @Value("${grpc.product-service.host:localhost}")
    private String productServiceHost;

    @Value("${grpc.product-service.port:9091}")
    private int productServicePort;

    private ManagedChannel channel;
    private ReactorAdminProductServiceGrpc.ReactorAdminProductServiceStub adminProductServiceStub;

    @PostConstruct
    public void init() {
        channel = ManagedChannelBuilder
                .forAddress(productServiceHost, productServicePort)
                .usePlaintext()
                .keepAliveTime(10, TimeUnit.SECONDS)
                .keepAliveTimeout(10, TimeUnit.SECONDS)
                .build();
        
        adminProductServiceStub = ReactorAdminProductServiceGrpc.newReactorStub(channel);
        
        log.info("gRPC Admin Product Service client initialized: {}:{}", productServiceHost, productServicePort);
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            channel.shutdown();
            log.info("gRPC Admin Product Service channel shutdown");
        }
    }

    // ============================================================================
    // CATEGORY MANAGEMENT
    // ============================================================================

    public Mono<CreateCategoryResponse> createCategory(CreateCategoryRequest request) {
        log.info("gRPC createCategory request: {}", JsonUtils.toJson(request));
        return adminProductServiceStub.createCategory(Mono.just(request));
    }

    public Mono<UpdateCategoryResponse> updateCategory(UpdateCategoryRequest request) {
        log.info("gRPC updateCategory request: {}", JsonUtils.toJson(request));
        return adminProductServiceStub.updateCategory(Mono.just(request));
    }

    public Mono<DeleteCategoryResponse> deleteCategory(DeleteCategoryRequest request) {
        log.info("gRPC deleteCategory request: {}", JsonUtils.toJson(request));
        return adminProductServiceStub.deleteCategory(Mono.just(request));
    }

    // ============================================================================
    // PRODUCT MANAGEMENT
    // ============================================================================

    public Mono<RemoveProductResponse> removeProduct(RemoveProductRequest request) {
        log.info("gRPC removeProduct request: {}", JsonUtils.toJson(request));
        return adminProductServiceStub.removeProduct(Mono.just(request));
    }
}
