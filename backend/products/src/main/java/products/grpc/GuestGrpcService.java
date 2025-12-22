package products.grpc;

import com.auction.proto.guest.*;
import org.springframework.grpc.server.service.GrpcService;
import reactor.core.publisher.Mono;
import products.service.GuestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.auction.utils.JsonUtils;

/**
 * gRPC implementation of GuestService for public unauthenticated operations
 * Gateway will call this service for guest/public functionality
 */
@GrpcService
public class GuestGrpcService extends ReactorGuestServiceGrpc.GuestServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(GuestGrpcService.class);
    private final GuestService guestService;

    public GuestGrpcService(GuestService guestService) {
        this.guestService = guestService;
    }

    @Override
    public Mono<GetCategoriesResponse> getCategories(Mono<GetCategoriesRequest> request) {
        return request.doOnNext(req -> log.info("Raw get categories request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    guestService.getCategories()
                        .collectList()
                        .map(categories -> GetCategoriesResponse.newBuilder()
                            .addAllCategories(categories)
                            .setSuccess(true)
                            .setMessage("Categories retrieved successfully")
                            .build())
                        .onErrorResume(e -> {
                            log.error("Get categories error: {}", e.getMessage());
                            return Mono.just(GetCategoriesResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to get categories: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<GetTopProductsResponse> getTopEndingProducts(Mono<GetTopEndingProductsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get top ending products request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    guestService.getTopEndingProducts(req.getLimit())
                        .collectList()
                        .map(products -> GetTopProductsResponse.newBuilder()
                            .addAllProducts(products)
                            .setSuccess(true)
                            .setMessage("Top ending products retrieved successfully")
                            .build())
                        .onErrorResume(e -> {
                            log.error("Get top ending products error: {}", e.getMessage());
                            return Mono.just(GetTopProductsResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to get top ending products: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<GetTopProductsResponse> getTopBidCountProducts(Mono<GetTopBidCountProductsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get top bid count products request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    guestService.getTopBidCountProducts(req.getLimit())
                        .collectList()
                        .map(products -> GetTopProductsResponse.newBuilder()
                            .addAllProducts(products)
                            .setSuccess(true)
                            .setMessage("Top bid count products retrieved successfully")
                            .build())
                        .onErrorResume(e -> {
                            log.error("Get top bid count products error: {}", e.getMessage());
                            return Mono.just(GetTopProductsResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to get top bid count products: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<GetTopProductsResponse> getTopPriceProducts(Mono<GetTopPriceProductsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get top price products request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    guestService.getTopPriceProducts(req.getLimit())
                        .collectList()
                        .map(products -> GetTopProductsResponse.newBuilder()
                            .addAllProducts(products)
                            .setSuccess(true)
                            .setMessage("Top price products retrieved successfully")
                            .build())
                        .onErrorResume(e -> {
                            log.error("Get top price products error: {}", e.getMessage());
                            return Mono.just(GetTopProductsResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to get top price products: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<ListProductsByCategoryResponse> listProductsByCategory(Mono<ListProductsByCategoryRequest> request) {
        return request.doOnNext(req -> log.info("Raw list products by category request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    guestService.listProductsByCategory(
                            req.getCategoryId(),
                            req.getSearchKeyword(),
                            req.getMinPrice(),
                            req.getMaxPrice(),
                            req.getStatus(),
                            req.getSortOrder(),
                            req.getPage(),
                            req.getLimit()
                        )
                        .map(result -> ListProductsByCategoryResponse.newBuilder()
                            .addAllProducts(result.products())
                            .setPageInfo(result.pageInfo())
                            .setCategory(result.category())
                            .setSuccess(true)
                            .setMessage("Products retrieved successfully")
                            .build())
                        .onErrorResume(e -> {
                            log.error("List products by category error: {}", e.getMessage());
                            return Mono.just(ListProductsByCategoryResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to list products: " + e.getMessage())
                                .build());
                        })
                );
    }
}