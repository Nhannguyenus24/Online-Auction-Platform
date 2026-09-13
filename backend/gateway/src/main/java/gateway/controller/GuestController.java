package gateway.controller;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Max;

import com.auction.proto.guest.*;
import com.auction.dto.ApiResponse;
import com.auction.utils.JsonUtils;
import com.auction.utils.ValidationUtils;

import gateway.grpc.GuestGrpcClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/guest")
@Tag(name = "Guest", description = "Public product endpoints - calls product service via gRPC")
public class GuestController {
    private static final Logger log = LoggerFactory.getLogger(GuestController.class);
    private static final String INVALID_STATUS = "Invalid status. Must be: active, ended, or all";
    private static final String INVALID_SORT_ORDER = "Invalid sortOrder. Must be one of: ENDING_SOON_DESC, ENDING_SOON_ASC, PRICE_ASC, PRICE_DESC, NEWEST_FIRST, OLDEST_FIRST, MOST_BIDS, MOST_VIEWS";
    private static final String INVALID_PRICE_RANGE = "Minimum price must be <= maximum price";
    private static final String INVALID_CATEGORY_ID = "Category ID must be greater than 0";

    private final GuestGrpcClient guestGrpcClient;

    public GuestController(GuestGrpcClient guestGrpcClient) {
        this.guestGrpcClient = guestGrpcClient;
    }

    private Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> badRequestError(String message) {
        log.warn("Bad request: {}", message);
        return Mono.just(ResponseEntity.badRequest().body(ApiResponse.badRequest(message)));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get categories", description = "Get all categories with 2 levels (parent and children). No authentication required.")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> getCategories() {
        log.info("Get categories request");

        try {
            GetCategoriesRequest grpcRequest = GetCategoriesRequest.newBuilder().build();

            return guestGrpcClient.getCategories(grpcRequest)
                    .map(response -> {
                        if (!response.getSuccess()) {
                            log.warn("Get categories returned false");
                            return ResponseEntity.badRequest().body(ApiResponse.<Map<String, Object>>badRequest(response.getMessage()));
                        }

                        List<Map<String, Object>> categories = new ArrayList<>();
                        // Only process top-level categories (parentId == 0), they already have children attached
                        response.getCategoriesList().forEach(category -> {
                            // Skip non-top-level categories (these are children, already included in parent's children list)
                            if (category.getParentId() != 0) return;

                            Map<String, Object> categoryMap = new HashMap<>();
                            categoryMap.put("id", category.getId());
                            categoryMap.put("name", category.getName());
                            categoryMap.put("createdAt", category.getCreatedAt());

                            // Add children
                            List<Map<String, Object>> children = new ArrayList<>();
                            category.getChildrenList().forEach(child -> {
                                Map<String, Object> childMap = new HashMap<>();
                                childMap.put("id", child.getId());
                                childMap.put("name", child.getName());
                                childMap.put("createdAt", child.getCreatedAt());
                                children.add(childMap);
                            });
                            categoryMap.put("children", children);
                            categories.add(categoryMap);
                        });

                        Map<String, Object> result = new HashMap<>();
                        result.put("categories", categories);

                        log.info("Get categories successful - count: {}", categories.size());
                        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>ok(result));
                    })
                    .onErrorResume(e -> {
                        log.error("Get categories error: {}", e.getMessage(), e);
                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(ApiResponse.<Map<String, Object>>internalServerError("Failed to fetch categories: " + e.getMessage())));
                    });
        } catch (Exception e) {
            log.error("Error processing categories request: {}", e.getMessage(), e);
            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.<Map<String, Object>>internalServerError("Error: " + e.getMessage())));
        }
    }

    @GetMapping("/products/top-ending")
    @Operation(summary = "Get top ending products", description = "Get top products ending soon. Default limit is 5.")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> getTopEndingProducts(
            @Parameter(description = "Number of products to return (max 20)")
            @RequestParam(defaultValue = "5") @Positive(message = "Limit must be greater than 0") @Max(value = 20, message = "Limit must not exceed 20") int limit) {

        log.info("Get top ending products request - limit: {}", limit);

        try {
            GetTopEndingProductsRequest grpcRequest = GetTopEndingProductsRequest.newBuilder()
                    .setLimit(limit)
                    .build();

            return guestGrpcClient.getTopEndingProducts(grpcRequest)
                    .map(response -> {
                        if (!response.getSuccess()) {
                            log.warn("Get top ending products returned false");
                            return ResponseEntity.badRequest().body(ApiResponse.<Map<String, Object>>badRequest(response.getMessage()));
                        }

                        Map<String, Object> result = new HashMap<>();
                        result.put("products", mapProductsList(response));

                        log.info("Get top ending products successful, count: {}", response.getProductsCount());
                        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>ok(result));
                    })
                    .onErrorResume(e -> {
                        log.error("Get top ending products error: {}", e.getMessage(), e);
                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(ApiResponse.<Map<String, Object>>internalServerError("Failed to get top ending products: " + e.getMessage())));
                    });
        } catch (Exception e) {
            log.error("Error processing top ending products request: {}", e.getMessage(), e);
            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.<Map<String, Object>>internalServerError("Error: " + e.getMessage())));
        }
    }

    @GetMapping("/products/top-bids")
    @Operation(summary = "Get top bid count products", description = "Get top products with most bids. Default limit is 5.")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> getTopBidCountProducts(
            @Parameter(description = "Number of products to return (max 20)")
            @RequestParam(defaultValue = "5") @Positive(message = "Limit must be greater than 0") @Max(value = 20, message = "Limit must not exceed 20") int limit) {

        log.info("Get top bid count products request - limit: {}", limit);

        try {
            GetTopBidCountProductsRequest grpcRequest = GetTopBidCountProductsRequest.newBuilder()
                    .setLimit(limit)
                    .build();

            return guestGrpcClient.getTopBidCountProducts(grpcRequest)
                    .map(response -> {
                        if (!response.getSuccess()) {
                            log.warn("Get top bid count products returned false");
                            return ResponseEntity.badRequest().body(ApiResponse.<Map<String, Object>>badRequest(response.getMessage()));
                        }

                        Map<String, Object> result = new HashMap<>();
                        result.put("products", mapProductsList(response));

                        log.info("Get top bid count products successful, count: {}", response.getProductsCount());
                        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>ok(result));
                    })
                    .onErrorResume(e -> {
                        log.error("Get top bid count products error: {}", e.getMessage(), e);
                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(ApiResponse.<Map<String, Object>>internalServerError("Failed to get top bid count products: " + e.getMessage())));
                    });
        } catch (Exception e) {
            log.error("Error processing top bid count products request: {}", e.getMessage(), e);
            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.<Map<String, Object>>internalServerError("Error: " + e.getMessage())));
        }
    }

    @GetMapping("/products/top-price")
    @Operation(summary = "Get top price products", description = "Get top products with highest current price. Default limit is 5.")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> getTopPriceProducts(
            @Parameter(description = "Number of products to return (max 20)")
            @RequestParam(defaultValue = "5") @Positive(message = "Limit must be greater than 0") @Max(value = 20, message = "Limit must not exceed 20") int limit) {

        log.info("Get top price products request - limit: {}", limit);

        try {
            GetTopPriceProductsRequest grpcRequest = GetTopPriceProductsRequest.newBuilder()
                    .setLimit(limit)
                    .build();

            return guestGrpcClient.getTopPriceProducts(grpcRequest)
                    .map(response -> {
                        if (!response.getSuccess()) {
                            log.warn("Get top price products returned false");
                            return ResponseEntity.badRequest().body(ApiResponse.<Map<String, Object>>badRequest(response.getMessage()));
                        }

                        Map<String, Object> result = new HashMap<>();
                        result.put("products", mapProductsList(response));

                        log.info("Get top price products successful, count: {}", response.getProductsCount());
                        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>ok(result));
                    })
                    .onErrorResume(e -> {
                        log.error("Get top price products error: {}", e.getMessage(), e);
                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(ApiResponse.<Map<String, Object>>internalServerError("Failed to get top price products: " + e.getMessage())));
                    });
        } catch (Exception e) {
            log.error("Error processing top price products request: {}", e.getMessage(), e);
            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.<Map<String, Object>>internalServerError("Error: " + e.getMessage())));
        }
    }

    @GetMapping("/products/by-category")
    @Operation(summary = "List products by category", description = "List products by category with filters and pagination. Supports search, price range, sorting, and status filtering.")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> listProductsByCategory(
            @Parameter(description = "Category ID (level 2)", required = true)
            @RequestParam @Positive(message = "Category ID must be greater than 0") int categoryId,
            @Parameter(description = "Search keyword for product title")
            @RequestParam(required = false) String searchKeyword,
            @Parameter(description = "Minimum price")
            @RequestParam(required = false) Double minPrice,
            @Parameter(description = "Maximum price")
            @RequestParam(required = false) Double maxPrice,
            @Parameter(description = "Product status filter (active, ended, all)")
            @RequestParam(defaultValue = "active") String status,
            @Parameter(description = "Sort order (ENDING_SOON_DESC, ENDING_SOON_ASC, PRICE_ASC, PRICE_DESC, NEWEST_FIRST, OLDEST_FIRST, MOST_BIDS, MOST_VIEWS)")
            @RequestParam(defaultValue = "ENDING_SOON_DESC") String sortOrder,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") @Positive(message = "Limit must be greater than 0") @Max(value = 100, message = "Limit must not exceed 100") int limit) {

        log.info("List products by category request - categoryId: {}, page: {}, limit: {}", categoryId, page, limit);

        // Validate status
        if (!status.matches("^(active|ended|all)$")) {
            log.warn("Invalid status value: {}", status);
            return badRequestError(INVALID_STATUS);
        }

        // Validate sortOrder
        SortOrder sortOrderEnum = validateAndParseSortOrder(sortOrder);
        if (sortOrderEnum == null) {
            log.warn("Invalid sortOrder value: {}", sortOrder);
            return badRequestError(INVALID_SORT_ORDER);
        }

        // Validate price range
        double minPriceVal = Objects.requireNonNullElse(minPrice, 0.0);
        double maxPriceVal = Objects.requireNonNullElse(maxPrice, 99999999.0);

        if (minPriceVal < 0 || maxPriceVal < 0 || minPriceVal > maxPriceVal) {
            log.warn("Invalid price range - minPrice: {}, maxPrice: {}", minPrice, maxPrice);
            return badRequestError(INVALID_PRICE_RANGE);
        }

        // Build request
        ListProductsByCategoryRequest.Builder requestBuilder = ListProductsByCategoryRequest.newBuilder()
                .setCategoryId(categoryId)
                .setStatus(status)
                .setSortOrder(sortOrderEnum)
                .setPage(page)
                .setLimit(limit);

        if (searchKeyword != null && !searchKeyword.isEmpty()) {
            requestBuilder.setSearchKeyword(searchKeyword);
        }
        requestBuilder.setMinPrice(minPriceVal);
        requestBuilder.setMaxPrice(maxPriceVal);

        return guestGrpcClient.listProductsByCategory(requestBuilder.build())
                .map(response -> {
                    if (!response.getSuccess()) {
                        log.warn("List products by category returned false");
                        return ResponseEntity.badRequest().body(ApiResponse.<Map<String, Object>>badRequest(response.getMessage()));
                    }

                    // Map products
                    List<Map<String, Object>> products = new ArrayList<>();
                    response.getProductsList().forEach(product -> products.add(mapProduct(product)));

                    // Map page info
                    Map<String, Object> pageInfo = new HashMap<>();
                    pageInfo.put("currentPage", response.getPageInfo().getCurrentPage());
                    pageInfo.put("pageSize", response.getPageInfo().getPageSize());
                    pageInfo.put("totalItems", response.getPageInfo().getTotalItems());
                    pageInfo.put("totalPages", response.getPageInfo().getTotalPages());
                    pageInfo.put("hasNext", response.getPageInfo().getHasNext());
                    pageInfo.put("hasPrevious", response.getPageInfo().getHasPrevious());

                    // Map category
                    Map<String, Object> categoryMap = null;
                    if (response.hasCategory()) {
                        categoryMap = new HashMap<>();
                        categoryMap.put("id", response.getCategory().getId());
                        categoryMap.put("name", response.getCategory().getName());
                        categoryMap.put("parentId", response.getCategory().getParentId());
                    }

                    Map<String, Object> result = new HashMap<>();
                    result.put("products", products);
                    result.put("pageInfo", pageInfo);
                    if (categoryMap != null) {
                        result.put("category", categoryMap);
                    }

                    log.info("List products by category successful - categoryId: {}, count: {}", categoryId, products.size());
                    return ResponseEntity.ok(ApiResponse.<Map<String, Object>>ok(result));
                })
                .onErrorResume(e -> {
                    log.error("List products by category error - categoryId: {}: {}", categoryId, e.getMessage(), e);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ApiResponse.<Map<String, Object>>internalServerError("Failed to list products: " + e.getMessage())));
                });
    }

    @GetMapping("/products/search")
    @Operation(summary = "Search products by name", description = "Search products by name with full text search, filters and pagination. Supports price range, sorting, and status filtering.")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> listProductsByName(
            @Parameter(description = "Search keyword for product title")
            @RequestParam(required = false) String searchKeyword,
            @Parameter(description = "Minimum price")
            @RequestParam(required = false) Double minPrice,
            @Parameter(description = "Maximum price")
            @RequestParam(required = false) Double maxPrice,
            @Parameter(description = "Product status filter (active, ended, all)")
            @RequestParam(defaultValue = "active") String status,
            @Parameter(description = "Sort order (ENDING_SOON_DESC, ENDING_SOON_ASC, PRICE_ASC, PRICE_DESC, NEWEST_FIRST, OLDEST_FIRST, MOST_BIDS, MOST_VIEWS)")
            @RequestParam(defaultValue = "ENDING_SOON_DESC") String sortOrder,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") @Positive(message = "Limit must be greater than 0") @Max(value = 100, message = "Limit must not exceed 100") int limit) {

        log.info("Search products by name request - searchKeyword: {}, page: {}, limit: {}", searchKeyword, page, limit);

        // Validate status
        if (!status.matches("^(active|ended|all)$")) {
            log.warn("Invalid status value: {}", status);
            return badRequestError(INVALID_STATUS);
        }

        // Validate sortOrder
        SortOrder sortOrderEnum = validateAndParseSortOrder(sortOrder);
        if (sortOrderEnum == null) {
            log.warn("Invalid sortOrder value: {}", sortOrder);
            return badRequestError(INVALID_SORT_ORDER);
        }

        // Validate price range
        double minPriceVal = Objects.requireNonNullElse(minPrice, 0.0);
        double maxPriceVal = Objects.requireNonNullElse(maxPrice, 999999999.0);

        if (minPriceVal < 0 || maxPriceVal < 0 || minPriceVal > maxPriceVal) {
            log.warn("Invalid price range - minPrice: {}, maxPrice: {}", minPrice, maxPrice);
            return badRequestError(INVALID_PRICE_RANGE);
        }

        // Build request
        ListProductsByNameRequest.Builder requestBuilder = ListProductsByNameRequest.newBuilder()
                .setSearchKeyword(searchKeyword != null ? searchKeyword : "")
                .setStatus(status)
                .setSortOrder(sortOrderEnum)
                .setPage(page)
                .setLimit(limit)
                .setMinPrice(minPriceVal)
                .setMaxPrice(maxPriceVal);

        return guestGrpcClient.listProductsByName(requestBuilder.build())
                .map(response -> {
                    if (!response.getSuccess()) {
                        log.warn("Search products by name returned false");
                        return ResponseEntity.badRequest().body(ApiResponse.<Map<String, Object>>badRequest(response.getMessage()));
                    }

                    List<Map<String, Object>> products = new ArrayList<>();
                    response.getProductsList().forEach(product -> products.add(mapProduct(product)));

                    Map<String, Object> pageInfo = new HashMap<>();
                    pageInfo.put("currentPage", response.getPageInfo().getCurrentPage());
                    pageInfo.put("pageSize", response.getPageInfo().getPageSize());
                    pageInfo.put("totalItems", response.getPageInfo().getTotalItems());
                    pageInfo.put("totalPages", response.getPageInfo().getTotalPages());
                    pageInfo.put("hasNext", response.getPageInfo().getHasNext());
                    pageInfo.put("hasPrevious", response.getPageInfo().getHasPrevious());

                    Map<String, Object> result = new HashMap<>();
                    result.put("products", products);
                    result.put("pageInfo", pageInfo);

                    log.info("Search products by name successful - keyword: {}, count: {}", searchKeyword, products.size());
                    return ResponseEntity.ok(ApiResponse.<Map<String, Object>>ok(result));
                })
                .onErrorResume(e -> {
                    log.error("Search products by name error: {}", e.getMessage(), e);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ApiResponse.<Map<String, Object>>internalServerError("Failed to search products: " + e.getMessage())));
                });
    }

    // Helper methods
    private List<Map<String, Object>> mapProductsList(GetTopProductsResponse response) {
        List<Map<String, Object>> products = new ArrayList<>();
        response.getProductsList().forEach(product -> products.add(mapProduct(product)));
        return products;
    }

    private Map<String, Object> mapProduct(Product product) {
        Map<String, Object> productMap = new HashMap<>();
        productMap.put("id", product.getId());
        productMap.put("sellerId", product.getSellerId());
        productMap.put("categoryId", product.getCategoryId());
        productMap.put("categoryName", product.getCategoryName());
        productMap.put("title", product.getTitle());
        productMap.put("description", product.getDescription());
        productMap.put("startingPrice", product.getStartingPrice());
        productMap.put("currentPrice", product.getCurrentPrice());
        productMap.put("stepPrice", product.getStepPrice());
        productMap.put("buyNowPrice", product.getBuyNowPrice());
        productMap.put("startsAt", product.getStartsAt());
        productMap.put("endsAt", product.getEndsAt());
        productMap.put("isAutoExtend", product.getIsAutoExtend());
        productMap.put("autoExtendSeconds", product.getAutoExtendSeconds());
        productMap.put("status", product.getStatus());
        productMap.put("viewsCount", product.getViewsCount());
        productMap.put("bidsCount", product.getBidsCount());
        productMap.put("createdAt", product.getCreatedAt());
        productMap.put("updatedAt", product.getUpdatedAt());
        productMap.put("sellerName", product.getSellerName());
        productMap.put("sellerPositiveReviews", product.getSellerPositiveReviews());
        productMap.put("highestBidderMasked", product.getHighestBidderMasked());
        productMap.put("timeRemaining", product.getTimeRemaining());

        // Map images
        List<Map<String, Object>> images = new ArrayList<>();
        product.getImagesList().forEach(image -> {
            Map<String, Object> imageMap = new HashMap<>();
            imageMap.put("id", image.getId());
            imageMap.put("productId", image.getProductId());
            imageMap.put("url", image.getUrl());
            imageMap.put("isPrimary", image.getIsPrimary());
            imageMap.put("createdAt", image.getCreatedAt());
            images.add(imageMap);
        });
        productMap.put("images", images);

        return productMap;
    }

    private SortOrder validateAndParseSortOrder(String sortOrderStr) {
        try {
            return SortOrder.valueOf(sortOrderStr);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid sort order: {}", sortOrderStr);
            return null;
        }
    }

    private SortOrder parseSortOrder(String sortOrderStr) {
        try {
            return SortOrder.valueOf(sortOrderStr);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid sort order: {}, using default ENDING_SOON_DESC", sortOrderStr);
            return SortOrder.ENDING_SOON_DESC;
        }
    }
}
