package gateway.grpc;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auction.proto.guest.*;
import com.auction.utils.JsonUtils;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import reactor.core.publisher.Mono;

@Component
public class GuestGrpcClient {
    private static final Logger log = LoggerFactory.getLogger(GuestGrpcClient.class);
    
    @Value("${grpc.product-service.host:localhost}")
    private String productServiceHost;

    @Value("${grpc.product-service.port:9091}")
    private int productServicePort;

    private ManagedChannel channel;
    private ReactorGuestServiceGrpc.ReactorGuestServiceStub guestServiceStub;

    @PostConstruct
    public void init() {
        channel = ManagedChannelBuilder
                .forAddress(productServiceHost, productServicePort)
                .usePlaintext()
                .build();
        
        guestServiceStub = ReactorGuestServiceGrpc.newReactorStub(channel);
        
        log.info("gRPC Guest Service client initialized: {}:{}", productServiceHost, productServicePort);
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            channel.shutdown();
            log.info("gRPC Guest Service channel shutdown");
        }
    }

    // Get Categories
    public Mono<GetCategoriesResponse> getCategories(GetCategoriesRequest request) {
        log.info("gRPC getCategories request: {}", JsonUtils.toJson(request));
        return guestServiceStub.getCategories(Mono.just(request));
    }

    // Get Top Ending Products
    public Mono<GetTopProductsResponse> getTopEndingProducts(GetTopEndingProductsRequest request) {
        log.info("gRPC getTopEndingProducts request: {}", JsonUtils.toJson(request));
        return guestServiceStub.getTopEndingProducts(Mono.just(request));
    }

    // Get Top Bid Count Products
    public Mono<GetTopProductsResponse> getTopBidCountProducts(GetTopBidCountProductsRequest request) {
        log.info("gRPC getTopBidCountProducts request: {}", JsonUtils.toJson(request));
        return guestServiceStub.getTopBidCountProducts(Mono.just(request));
    }

    // Get Top Price Products
    public Mono<GetTopProductsResponse> getTopPriceProducts(GetTopPriceProductsRequest request) {
        log.info("gRPC getTopPriceProducts request: {}", JsonUtils.toJson(request));
        return guestServiceStub.getTopPriceProducts(Mono.just(request));
    }

    // List Products by Category
    public Mono<ListProductsByCategoryResponse> listProductsByCategory(ListProductsByCategoryRequest request) {
        log.info("gRPC listProductsByCategory request: {}", JsonUtils.toJson(request));
        return guestServiceStub.listProductsByCategory(Mono.just(request));
    }
}
