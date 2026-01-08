package products.grpc;

import com.auction.proto.guest.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.grpc.server.service.GrpcService;
import java.util.Collections;
import com.auction.utils.JsonUtils;

import products.service.GuestService;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    public Mono<GetCategoriesResponse> getCategories(Mono<GetCategoriesRequest> request) {
        return request
                .doOnNext(req -> log.info("Raw get categories request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                        guestService.getCategories()
                                .collectList() // Collect all categories into a list
                                .map(categoriesList -> {
                                    // Map parentId -> list of children
                                    Map<Integer, List<Category>> childrenMap = categoriesList.stream()
                                            .filter(cat -> cat.getParentId() != 0) // non-top-level
                                            .collect(Collectors.groupingBy(Category::getParentId));

                                    // Build top-level categories with children
                                    List<Category> topLevelCategories = categoriesList.stream()
                                            .filter(cat -> cat.getParentId() == 0) // top-level
                                            .map(parent -> {
                                                // Build parent category
                                                Category.Builder parentBuilder = Category.newBuilder()
                                                        .setId(parent.getId())
                                                        .setName(parent.getName())
                                                        .setParentId(parent.getParentId())
                                                        .setCreatedAt(parent.getCreatedAt());

                                                // Add children if any
                                                List<Category> children = childrenMap.getOrDefault(parent.getId(), Collections.emptyList());
                                                for (Category child : children) {
                                                    parentBuilder.addChildren(
                                                            Category.newBuilder()
                                                                    .setId(child.getId())
                                                                    .setName(child.getName())
                                                                    .setParentId(child.getParentId())
                                                                    .setCreatedAt(child.getCreatedAt())
                                                                    .build()
                                                    );
                                                }

                                                return parentBuilder.build();
                                            })
                                            .toList();
                                    return GetCategoriesResponse.newBuilder()
                                            .addAllCategories(topLevelCategories)
                                            .setSuccess(true)
                                            .setMessage("Categories retrieved successfully")
                                            .build();
                                })
                                .doOnNext(response -> log.info("Raw get categories response: {}", JsonUtils.toJson(response)))
                                .onErrorResume(e -> {
                                    log.error("Get categories error: {}", e.getMessage(), e);
                                    return Mono.just(
                                            GetCategoriesResponse.newBuilder()
                                                    .setSuccess(false)
                                                    .setMessage("Failed to get categories: " + e.getMessage())
                                                    .build()
                                    );
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
                        .doOnNext(response -> log.info("Raw top ending products response: {}", JsonUtils.toJson(response)))
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
                        .doOnNext(resp -> log.info("Raw top bid count response: {}", JsonUtils.toJson(resp)))
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
                        .doOnNext(resp -> log.info("Raw get top price response: {}", JsonUtils.toJson(resp)))
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
                            req.getSortOrder().name(),
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
                        .doOnNext(resp -> log.info("Raw list products filter response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("List products by category error: {}", e.getMessage());
                            return Mono.just(ListProductsByCategoryResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to list products: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<ListProductsByCategoryResponse> listProductsByName(Mono<ListProductsByNameRequest> request) {
        return request.doOnNext(req -> log.info("Raw list products by name request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                        {
                            req.getSearchKeyword();
                            return guestService.listProductsByName(
                                    req.getSearchKeyword(),
                                    req.getMinPrice(),
                                    req.getMaxPrice(),
                                    req.getStatus(),
                                    req.getSortOrder().name(),
                                    req.getPage(),
                                    req.getLimit()
                                )
                                .map(result -> ListProductsByCategoryResponse.newBuilder()
                                    .addAllProducts(result.products())
                                    .setPageInfo(result.pageInfo())
                                    .setSuccess(true)
                                    .setMessage("Products retrieved successfully")
                                    .build())
                                .doOnNext(resp -> log.info("Raw list products by name response: {}", JsonUtils.toJson(resp)))
                                .onErrorResume(e -> {
                                    log.error("List products by name error: {}", e.getMessage());
                                    return Mono.just(ListProductsByCategoryResponse.newBuilder()
                                        .setSuccess(false)
                                        .setMessage("Failed to list products: " + e.getMessage())
                                        .build());
                                });
                        }
                );
    }
}