package gateway.controller;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

import com.auction.proto.user.*;
import com.auction.dto.ApiResponse;
import com.auction.utils.ValidationUtils;

import gateway.grpc.BidderGrpcClient;
import gateway.grpc.RatingGrpcClient;
import com.auction.proto.rating.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/bidder")
@Tag(name = "Bidder", description = "Bidder user endpoints - requires authentication")
@SecurityRequirement(name = "bearerAuth")
public class BidderController {
    private static final Logger log = LoggerFactory.getLogger(BidderController.class);
    private static final String INVALID_PRODUCT_ID = "Invalid productId";
    private static final String INVALID_PAGINATION = "Invalid page or limit";
    private static final String INVALID_BID_AMOUNT = "Invalid bid amount";

    private final BidderGrpcClient bidderGrpcClient;
    private final RatingGrpcClient ratingGrpcClient;

    public BidderController(BidderGrpcClient bidderGrpcClient, RatingGrpcClient ratingGrpcClient) {
        this.bidderGrpcClient = bidderGrpcClient;
        this.ratingGrpcClient = ratingGrpcClient;
    }

    private int getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Integer.parseInt(authentication.getName());
    }

    @GetMapping("/products/{productId}")
    @Operation(summary = "Get product details", description = "Get detailed product information including watchlist and auto-bid status. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductDetails(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId) {

        int userId = getUserId();
        log.info("Get product details request [userId={}] - productId: {}", userId, productId);

        // Validate productId
        if (productId <= 0) {
            log.warn("Invalid productId: {} [userId={}]", productId, userId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_PRODUCT_ID));
        }

        try {
            GetProductDetailsRequest grpcRequest = GetProductDetailsRequest.newBuilder()
                    .setProductId(productId)
                    .setUserId(userId)
                    .build();

            var response = bidderGrpcClient.getProductDetails(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch product"));
            }

            if (response.getSuccess() && response.hasProduct()) {
                Map<String, Object> productData = new HashMap<>();
                productData.put("product", mapUserProduct(response.getProduct()));
                log.info("Get product details successful [userId={}, productId={}]", userId, productId);
                return ResponseEntity.ok(ApiResponse.ok(productData));
            } else {
                log.warn("Get product details failed [userId={}, productId={}, message={}]", userId, productId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Get product details error [userId={}, productId={}]: {}", userId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch product: " + e.getMessage()));
        }
    }

    @GetMapping("/products/{productId}/related")
    @Operation(summary = "Get related products", description = "Get related products in the same category. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRelatedProducts(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @Parameter(description = "Number of products to return (max 20)")
            @RequestParam(defaultValue = "5") int limit) {

        int userId = getUserId();
        log.info("Get related products request [userId={}] - productId: {}, limit: {}", userId, productId, limit);

        // Validate parameters
        if (productId <= 0 || limit <= 0 || limit > 20) {
            log.warn("Invalid parameters [userId={}] - productId: {}, limit: {}", userId, productId, limit);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("Invalid productId or limit"));
        }

        try {
            GetRelatedProductsRequest grpcRequest = GetRelatedProductsRequest.newBuilder()
                    .setProductId(productId)
                    .setUserId(userId)
                    .setLimit(limit)
                    .build();

            var response = bidderGrpcClient.getRelatedProducts(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch related products"));
            }

            List<Map<String, Object>> products = new ArrayList<>();
            response.getProductsList().forEach(product -> products.add(mapUserProduct(product)));

            Map<String, Object> result = new HashMap<>();
            result.put("products", products);

            log.info("Get related products successful [userId={}, count={}]", userId, products.size());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get related products error [userId={}, productId={}]: {}", userId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch related products: " + e.getMessage()));
        }
    }

    @PostMapping("/watchlist")
    @Operation(summary = "Add to watchlist", description = "Add a product to user's watchlist. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addToWatchlist(
            @RequestBody com.auction.entities.dto.AddToWatchlistRequest requestBody) {

        int userId = getUserId();
        log.info("Add to watchlist request [userId={}] - productId: {}", userId, requestBody != null ? requestBody.productId() : "null");

        // Validate request body
        if (requestBody == null || requestBody.productId() <= 0) {
            log.warn("Invalid request body [userId={}]", userId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_PRODUCT_ID));
        }

        int productId = requestBody.productId();

        try {
            AddToWatchlistRequest grpcRequest = AddToWatchlistRequest.newBuilder()
                    .setProductId(productId)
                    .setUserId(userId)
                    .build();

            var response = bidderGrpcClient.addToWatchlist(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to add to watchlist"));
            }

            if (response.getSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("watchlistId", response.getWatchlistId());
                log.info("Add to watchlist successful [userId={}, productId={}]", userId, productId);
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Add to watchlist failed [userId={}, productId={}, message={}]", userId, productId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Add to watchlist error [userId={}, productId={}]: {}", userId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to add to watchlist: " + e.getMessage()));
        }
    }

    @DeleteMapping("/watchlist/{productId}")
    @Operation(summary = "Remove from watchlist", description = "Remove a product from user's watchlist. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> removeFromWatchlist(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId) {

        int userId = getUserId();
        log.info("Remove from watchlist request [userId={}] - productId: {}", userId, productId);

        // Validate productId
        if (productId <= 0) {
            log.warn("Invalid productId: {} [userId={}]", productId, userId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_PRODUCT_ID));
        }

        try {
            RemoveFromWatchlistRequest grpcRequest = RemoveFromWatchlistRequest.newBuilder()
                    .setProductId(productId)
                    .setUserId(userId)
                    .build();

            var response = bidderGrpcClient.removeFromWatchlist(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to remove from watchlist"));
            }

            if (response.getSuccess()) {
                log.info("Remove from watchlist successful [userId={}, productId={}]", userId, productId);
                return ResponseEntity.ok(ApiResponse.ok(new HashMap<>()));
            } else {
                log.warn("Remove from watchlist failed [userId={}, productId={}, message={}]", userId, productId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Remove from watchlist error [userId={}, productId={}]: {}", userId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to remove from watchlist: " + e.getMessage()));
        }
    }

    @GetMapping("/watchlist")
    @Operation(summary = "Get watchlist", description = "Get user's watchlist with pagination. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWatchlist(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") int limit,
            @Parameter(description = "Product status filter (active, ended, all)")
            @RequestParam(defaultValue = "active") String status) {

        int userId = getUserId();
        log.info("Get watchlist request [userId={}] - page: {}, limit: {}, status: {}", userId, page, limit, status);

        // Validate pagination
        if (page <= 0 || limit <= 0 || limit > 100) {
            log.warn("Invalid pagination [userId={}] - page: {}, limit: {}", userId, page, limit);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_PAGINATION));
        }

        try {
            GetWatchlistRequest grpcRequest = GetWatchlistRequest.newBuilder()
                    .setUserId(userId)
                    .setPage(page)
                    .setLimit(limit)
                    .setStatus(status)
                    .build();

            var response = bidderGrpcClient.getWatchlist(grpcRequest)
                .timeout(Duration.ofSeconds(30))
                .block();

            if (response == null) {
                log.error("gRPC response is null [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch watchlist"));
            }

            List<Map<String, Object>> products = new ArrayList<>();
            response.getProductsList().forEach(product -> products.add(mapUserProduct(product)));

            Map<String, Object> result = new HashMap<>();
            result.put("products", products);
            result.put("pageInfo", mapPageInfo(response.getPageInfo()));

            log.info("Get watchlist successful [userId={}, count={}, totalItems={}]", userId, products.size(), response.getPageInfo().getTotalItems());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get watchlist error [userId={}]: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch watchlist: " + e.getMessage()));
        }
    }

    @PostMapping("/products/{productId}/questions")
    @Operation(summary = "Ask question", description = "Ask a question about a product. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> askQuestion(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @RequestBody com.auction.entities.dto.AskQuestionRequest requestBody) {

        int userId = getUserId();
        log.info("Ask question request [userId={}] - productId: {}", userId, productId);

        // Validate input
        if (productId <= 0 || requestBody == null || requestBody.question() == null || requestBody.question().trim().isEmpty()) {
            log.warn("Invalid request [userId={}] - productId: {}", userId, productId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("Invalid product ID or question"));
        }

        String question = requestBody.question();

        try {
            AskQuestionRequest grpcRequest = AskQuestionRequest.newBuilder()
                    .setProductId(productId)
                    .setUserId(userId)
                    .setQuestion(question)
                    .build();

            var response = bidderGrpcClient.askQuestion(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to ask question"));
            }

            if (response.getSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("questionId", response.getQuestionId());
                result.put("createdAt", response.getCreatedAt());
                log.info("Ask question successful [userId={}, productId={}, questionId={}]", userId, productId, response.getQuestionId());
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Ask question failed [userId={}, productId={}, message={}]", userId, productId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Ask question error [userId={}, productId={}]: {}", userId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to ask question: " + e.getMessage()));
        }
    }

    @GetMapping("/products/{productId}/questions")
    @Operation(summary = "Get product questions", description = "Get questions and answers for a product. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductQuestions(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") int limit) {

        int userId = getUserId();
        log.info("Get product questions request [userId={}] - productId: {}, page: {}, limit: {}", userId, productId, page, limit);

        // Validate parameters
        if (productId <= 0 || page <= 0 || limit <= 0 || limit > 100) {
            log.warn("Invalid parameters [userId={}] - productId: {}, page: {}, limit: {}", userId, productId, page, limit);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("Invalid productId, page or limit"));
        }

        try {
            GetProductQuestionsRequest grpcRequest = GetProductQuestionsRequest.newBuilder()
                    .setProductId(productId)
                    .setPage(page)
                    .setLimit(limit)
                    .build();

            var response = bidderGrpcClient.getProductQuestions(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch questions"));
            }

            List<Map<String, Object>> questions = new ArrayList<>();
            response.getQuestionsList().forEach(question -> {
                Map<String, Object> questionMap = new HashMap<>();
                questionMap.put("id", question.getId());
                questionMap.put("productId", question.getProductId());
                questionMap.put("askerId", question.getAskerId());
                questionMap.put("askerName", question.getAskerName());
                questionMap.put("question", question.getQuestion());
                questionMap.put("answer", question.getAnswer());
                questionMap.put("answeredBy", question.getAnsweredBy());
                questionMap.put("answererName", question.getAnswererName());
                questionMap.put("createdAt", question.getCreatedAt());
                questionMap.put("answeredAt", question.getAnsweredAt());
                questions.add(questionMap);
            });

            Map<String, Object> result = new HashMap<>();
            result.put("questions", questions);
            result.put("pageInfo", mapPageInfo(response.getPageInfo()));

            log.info("Get product questions successful [userId={}, count={}, totalItems={}]", userId, questions.size(), response.getPageInfo().getTotalItems());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get product questions error [userId={}, productId={}]: {}", userId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch questions: " + e.getMessage()));
        }
    }

    @GetMapping("/products/{productId}/bids")
    @Operation(summary = "Get product bids", description = "Get bid history for a product. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductBids(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") int limit) {

        int userId = getUserId();
        log.info("Get product bids request [userId={}] - productId: {}, page: {}, limit: {}", userId, productId, page, limit);

        // Validate parameters
        if (productId <= 0 || page <= 0 || limit <= 0 || limit > 100) {
            log.warn("Invalid parameters [userId={}] - productId: {}, page: {}, limit: {}", userId, productId, page, limit);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("Invalid productId, page or limit"));
        }

        try {
            GetProductBidsRequest grpcRequest = GetProductBidsRequest.newBuilder()
                    .setProductId(productId)
                    .setUserId(userId)
                    .setPage(page)
                    .setLimit(limit)
                    .build();

            var response = bidderGrpcClient.getProductBids(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch bids"));
            }

            List<Map<String, Object>> bids = new ArrayList<>();
            response.getBidsList().forEach(bid -> {
                Map<String, Object> bidMap = new HashMap<>();
                bidMap.put("id", bid.getId());
                bidMap.put("productId", bid.getProductId());
                bidMap.put("bidderId", bid.getBidderId());
                bidMap.put("bidderNameMasked", bid.getBidderNameMasked());
                bidMap.put("amount", bid.getAmount());
                bidMap.put("isAuto", bid.getIsAuto());
                bidMap.put("createdAt", bid.getCreatedAt());
                bidMap.put("isCurrentUser", bid.getIsCurrentUser());
                bids.add(bidMap);
            });

            Map<String, Object> result = new HashMap<>();
            result.put("bids", bids);
            result.put("pageInfo", mapPageInfo(response.getPageInfo()));

            log.info("Get product bids successful [userId={}, count={}, totalItems={}]", userId, bids.size(), response.getPageInfo().getTotalItems());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get product bids error [userId={}, productId={}]: {}", userId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch bids: " + e.getMessage()));
        }
    }

    @PostMapping("/products/{productId}/bids")
    @Operation(summary = "Place bid", description = "Place a bid on a product. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> placeBid(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @RequestBody com.auction.entities.dto.PlaceBidRequest requestBody) {

        int userId = getUserId();
        log.info("Place bid request [userId={}] - productId: {}, amount: {}", userId, productId, requestBody != null ? requestBody.bidAmount() : "null");

        // Validate input
        if (productId <= 0 || requestBody == null || requestBody.bidAmount() <= 0) {
            log.warn("Invalid request [userId={}] - productId: {}", userId, productId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_BID_AMOUNT));
        }

        double bidAmount = requestBody.bidAmount();

        try {
            PlaceBidRequest grpcRequest = PlaceBidRequest.newBuilder()
                    .setProductId(productId)
                    .setUserId(userId)
                    .setBidAmount(bidAmount)
                    .build();

            var response = bidderGrpcClient.placeBid(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to place bid"));
            }

            if (response.getSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("bidId", response.getBidId());
                result.put("currentPrice", response.getCurrentPrice());
                result.put("nextMinBid", response.getNextMinBid());
                result.put("createdAt", response.getCreatedAt());
                result.put("isHighestBidder", response.getIsHighestBidder());
                log.info("Place bid successful [userId={}, productId={}, bidId={}, amount={}]", userId, productId, response.getBidId(), bidAmount);
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Place bid failed [userId={}, productId={}, message={}]", userId, productId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Place bid error [userId={}, productId={}, amount={}]: {}", userId, productId, bidAmount, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to place bid: " + e.getMessage()));
        }
    }

    @GetMapping("/bids")
    @Operation(summary = "Get my bids", description = "Get user's bid history with pagination and filters. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyBids(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") int limit,
            @Parameter(description = "Filter (all, winning, outbid, won, lost)")
            @RequestParam(defaultValue = "all") String filter) {

        int userId = getUserId();
        log.info("Get my bids request [userId={}] - page: {}, limit: {}, filter: {}", userId, page, limit, filter);

        // Validate pagination
        if (page <= 0 || limit <= 0 || limit > 100) {
            log.warn("Invalid pagination [userId={}] - page: {}, limit: {}", userId, page, limit);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_PAGINATION));
        }

        try {
            GetMyBidsRequest grpcRequest = GetMyBidsRequest.newBuilder()
                    .setUserId(userId)
                    .setPage(page)
                    .setLimit(limit)
                    .setFilter(filter)
                    .build();

            var response = bidderGrpcClient.getMyBids(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch bids"));
            }

            List<Map<String, Object>> bids = new ArrayList<>();
            response.getBidsList().forEach(bid -> {
                Map<String, Object> bidMap = new HashMap<>();
                bidMap.put("bidId", bid.getBidId());
                bidMap.put("productId", bid.getProductId());
                bidMap.put("productTitle", bid.getProductTitle());
                bidMap.put("productPrimaryImage", bid.getProductPrimaryImage());
                bidMap.put("bidAmount", bid.getBidAmount());
                bidMap.put("currentPrice", bid.getCurrentPrice());
                bidMap.put("isAuto", bid.getIsAuto());
                bidMap.put("isWinning", bid.getIsWinning());
                bidMap.put("productStatus", bid.getProductStatus());
                bidMap.put("bidCreatedAt", bid.getBidCreatedAt());
                bidMap.put("productEndsAt", bid.getProductEndsAt());
                bids.add(bidMap);
            });

            Map<String, Object> result = new HashMap<>();
            result.put("bids", bids);
            result.put("pageInfo", mapPageInfo(response.getPageInfo()));

            log.info("Get my bids successful [userId={}, count={}, totalItems={}]", userId, bids.size(), response.getPageInfo().getTotalItems());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get my bids error [userId={}]: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch bids: " + e.getMessage()));
        }
    }

    // Helper methods
    private Map<String, Object> mapUserProduct(Product product) {
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
        productMap.put("highestBidderMasked", product.getHighestBidderMasked());
        productMap.put("timeRemaining", product.getTimeRemaining());
        productMap.put("isInWatchlist", product.getIsInWatchlist());
        productMap.put("isUserHighestBidder", product.getIsUserHighestBidder());
        productMap.put("userMaxAutoBid", product.getUserMaxAutoBid());

        // Map seller info - both nested and flat for frontend compatibility
        if (product.hasSellerInfo()) {
            var sellerInfo = product.getSellerInfo();
            Map<String, Object> sellerInfoMap = new HashMap<>();
            sellerInfoMap.put("id", sellerInfo.getId());
            sellerInfoMap.put("fullName", sellerInfo.getFullName());
            sellerInfoMap.put("email", sellerInfo.getEmail());
            sellerInfoMap.put("positiveReviews", sellerInfo.getPositiveReviews());
            sellerInfoMap.put("negativeReviews", sellerInfo.getNegativeReviews());
            productMap.put("sellerInfo", sellerInfoMap);
            
            // Also add flat fields for frontend compatibility
            productMap.put("sellerName", sellerInfo.getFullName());
            productMap.put("sellerRatingCount", sellerInfo.getPositiveReviews() + sellerInfo.getNegativeReviews());
            productMap.put("sellerAvatar", ""); // Avatar not available in proto, set to empty string
        } else {
            // If seller info is not available, set defaults
            productMap.put("sellerName", "Unknown Seller");
            productMap.put("sellerRatingCount", 0);
            productMap.put("sellerAvatar", "");
        }

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

    private Map<String, Object> mapPageInfo(PageInfo pageInfo) {
        Map<String, Object> pageInfoMap = new HashMap<>();
        pageInfoMap.put("currentPage", pageInfo.getCurrentPage());
        pageInfoMap.put("pageSize", pageInfo.getPageSize());
        pageInfoMap.put("totalItems", pageInfo.getTotalItems());
        pageInfoMap.put("totalPages", pageInfo.getTotalPages());
        pageInfoMap.put("hasNext", pageInfo.getHasNext());
        pageInfoMap.put("hasPrevious", pageInfo.getHasPrevious());
        return pageInfoMap;
    }

    @GetMapping("/notifications")
    @Operation(summary = "Get user notifications", description = "Get all notifications for the authenticated user. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserNotifications() {
        int userId = getUserId();
        log.info("Get user notifications request [userId={}]", userId);

        try {
            GetUserNotificationsRequest grpcRequest = GetUserNotificationsRequest.newBuilder()
                    .setUserId(userId)
                    .build();

            GetUserNotificationsResponse grpcResponse = bidderGrpcClient
                    .getUserNotifications(grpcRequest)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            if (grpcResponse == null || !grpcResponse.getSuccess()) {
                log.warn("Failed to get notifications [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError(grpcResponse != null ? grpcResponse.getMessage() : "Failed to fetch notifications"));
            }

            List<Map<String, Object>> notifications = new ArrayList<>();
            for (UserNotification notification : grpcResponse.getNotificationsList()) {
                Map<String, Object> notificationMap = new HashMap<>();
                notificationMap.put("id", notification.getId());
                notificationMap.put("userId", notification.getUserId());
                notificationMap.put("type", notification.getType());
                notificationMap.put("payload", notification.getPayload());
                notificationMap.put("isRead", notification.getIsRead());
                notificationMap.put("createdAt", notification.getCreatedAt());
                notifications.add(notificationMap);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("notifications", notifications);
            result.put("unreadCount", grpcResponse.getUnreadCount());

            log.info("Get user notifications successful [userId={}, count={}]", userId, notifications.size());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get user notifications error [userId={}]: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch notifications: " + e.getMessage()));
        }
    }

    @PutMapping("/notifications/{notificationId}/read")
    @Operation(summary = "Mark notification as read", description = "Mark a specific notification as read. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markNotificationAsRead(
            @Parameter(description = "Notification ID", required = true)
            @PathVariable int notificationId) {

        int userId = getUserId();
        log.info("Mark notification as read request [userId={}] - notificationId: {}", userId, notificationId);

        try {
            MarkNotificationAsReadRequest grpcRequest = MarkNotificationAsReadRequest.newBuilder()
                    .setNotificationId(notificationId)
                    .setUserId(userId)
                    .build();

            MarkNotificationAsReadResponse grpcResponse = bidderGrpcClient
                    .markNotificationAsRead(grpcRequest)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            if (grpcResponse == null || !grpcResponse.getSuccess()) {
                log.warn("Failed to mark notification as read [userId={}, notificationId={}]", userId, notificationId);
                return ResponseEntity.badRequest()
                    .body(ApiResponse.badRequest(grpcResponse != null ? grpcResponse.getMessage() : "Failed to mark notification as read"));
            }

            log.info("Mark notification as read successful [userId={}, notificationId={}]", userId, notificationId);
            return ResponseEntity.ok(ApiResponse.ok(new HashMap<>()));
        } catch (Exception e) {
            log.error("Mark notification as read error [userId={}, notificationId={}]: {}", userId, notificationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to mark notification as read: " + e.getMessage()));
        }
    }

    @GetMapping("/ratings")
    @Operation(summary = "Get bidder ratings", description = "Get bidder's ratings and reviews. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBidderRatings(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") int pageSize) {

        int bidderId = getUserId();
        log.info("Get bidder ratings request [userId={}] - page: {}, pageSize: {}", bidderId, page, pageSize);

        // Validate pagination
        if (page <= 0 || pageSize <= 0 || pageSize > 100) {
            log.warn("Invalid pagination [userId={}] - page: {}, pageSize: {}", bidderId, page, pageSize);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_PAGINATION));
        }

        try {
            GetBidderRatingsRequest grpcRequest = GetBidderRatingsRequest.newBuilder()
                    .setBidderId(bidderId)
                    .setPage(page)
                    .setPageSize(pageSize)
                    .build();

            var response = bidderGrpcClient.getBidderRatings(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [userId={}]", bidderId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch ratings"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("positiveReviews", response.getPositiveReviews());
            result.put("negativeReviews", response.getNegativeReviews());
            result.put("reviews", mapBidderReviewList(response.getReviewsList()));
            result.put("totalCount", response.getTotalCount());

            log.info("Get bidder ratings successful [userId={}, count={}]", bidderId, response.getReviewsCount());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get bidder ratings error [userId={}]: {}", bidderId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch ratings: " + e.getMessage()));
        }
    }
    
    @PostMapping("/products/{productId}/buy-now")
    @Operation(summary = "Buy now product", description = "Purchase a product immediately using buy now feature. Requires positive reviews > 4 × negative reviews. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> buyNowProduct(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId) {

        int userId = getUserId();
        log.info("Buy now product request [userId={}] - productId: {}", userId, productId);

        // Validate productId
        if (productId <= 0) {
            log.warn("Invalid productId: {} [userId={}]", productId, userId);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest(INVALID_PRODUCT_ID));
        }

        try {
            BuyNowProductRequest grpcRequest = BuyNowProductRequest.newBuilder()
                    .setProductId(productId)
                    .setUserId(userId)
                    .build();

            var response = bidderGrpcClient.buyNowProduct(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [userId={}]", userId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to complete buy now"));
            }

            if (response.getSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("orderId", response.getOrderId());
                result.put("price", response.getPrice());
                result.put("createdAt", response.getCreatedAt());
                log.info("Buy now successful [userId={}, productId={}, orderId={}, price={}]", userId, productId, response.getOrderId(), response.getPrice());
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Buy now failed [userId={}, productId={}, message={}]", userId, productId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Buy now product error [userId={}, productId={}]: {}", userId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to complete buy now: " + e.getMessage()));
        }
    }

    // ============================================================================
    // HELPER MAPPING METHODS
    // ============================================================================
    
    @GetMapping("/products/{productId}/top-bidders")
    @Operation(summary = "Get top bidders", description = "Get top bidders for a product from Redis. Does not require authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTopBidders(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @Parameter(description = "Number of top bidders to return (default 5, max 10)")
            @RequestParam(defaultValue = "5") int limit) {

        int userId = getUserId();
        log.info("Get top bidders request [userId={}] - productId: {}, limit: {}", userId, productId, limit);

        // Validate parameters
        if (productId <= 0 || limit <= 0 || limit > 10) {
            log.warn("Invalid parameters [userId={}] - productId: {}, limit: {}", userId, productId, limit);
            return ResponseEntity.badRequest().body(ApiResponse.badRequest("Invalid productId or limit"));
        }

        try {
            GetTopBiddersRequest grpcRequest = GetTopBiddersRequest.newBuilder()
                    .setProductId(productId)
                    .setLimit(limit)
                    .build();

            var response = bidderGrpcClient.getTopBidders(grpcRequest)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            if (response == null || !response.getSuccess()) {
                log.warn("Failed to get top bidders [userId={}, productId={}]", userId, productId);
                return ResponseEntity.badRequest()
                    .body(ApiResponse.badRequest(response != null ? response.getMessage() : "Failed to fetch top bidders"));
            }

            List<Map<String, Object>> topBidders = new ArrayList<>();
            for (var bidder : response.getTopBiddersList()) {
                Map<String, Object> bidderMap = new HashMap<>();
                bidderMap.put("bidderId", bidder.getBidderId());
                bidderMap.put("bidderName", bidder.getBidderNameMasked());
                bidderMap.put("bidAmount", bidder.getBidAmount());
                bidderMap.put("bidTime", bidder.getBidTime());
                topBidders.add(bidderMap);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("topBidders", topBidders);

            log.info("Get top bidders successful [userId={}, productId={}, count={}]", userId, productId, topBidders.size());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get top bidders error [userId={}, productId={}]: {}", userId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch top bidders: " + e.getMessage()));
        }
    }

    private List<Map<String, Object>> mapBidderReviewList(List<BidderReview> reviews) {
        List<Map<String, Object>> result = new ArrayList<>();
        reviews.forEach(review -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", review.getId());
            map.put("fromUserId", review.getFromUserId());
            map.put("fromUserName", review.getFromUserName());
            map.put("comment", review.getComment());
            map.put("createdAt", review.getCreatedAt());
            result.add(map);
        });
        return result;
    }
    
    @PostMapping("/upgrade-request")
    @Operation(summary = "Request role upgrade", description = "Request to upgrade role from bidder to seller. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestRoleUpgrade() {
        try {
            int userId = getUserId();
            log.info("Request role upgrade [userId={}]", userId);

            var grpcRequest = RequestRoleUpgradeRequest.newBuilder()
                    .setUserId(userId)
                    .build();

            RequestRoleUpgradeResponse response =
                    bidderGrpcClient.requestRoleUpgrade(grpcRequest)
                            .timeout(Duration.ofSeconds(5))
                            .block();

            if (response == null || !response.getSuccess()) {
                log.warn("Request role upgrade failed [userId={}]", userId);
                return ResponseEntity.badRequest()
                    .body(ApiResponse.badRequest(response != null ? response.getMessage() : "Failed to submit upgrade request"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("requestId", response.getRequestId());

            log.info("Request role upgrade successful [userId={}, requestId={}]", userId, response.getRequestId());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Request role upgrade error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to submit upgrade request: " + e.getMessage()));
        }
    }
    
    @GetMapping("/role-upgrade-status")
    @Operation(summary = "Get role upgrade request status", description = "Get the status of user's role upgrade request. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRoleUpgradeRequestStatus() {
        try {
            int userId = getUserId();
            log.info("Get role upgrade request status [userId={}]", userId);

            var request = GetRoleUpgradeRequestStatusRequest.newBuilder()
                .setUserId(userId)
                .build();

            var response = bidderGrpcClient.getRoleUpgradeRequestStatus(request)
                .block(Duration.ofSeconds(5));

            if (response == null || !response.getSuccess()) {
                log.warn("Get role upgrade status failed [userId={}]", userId);
                return ResponseEntity.badRequest()
                    .body(ApiResponse.badRequest(response != null ? response.getMessage() : "Failed to fetch upgrade request status"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("hasRequest", response.getHasRequest());
            result.put("status", response.getStatus());
            result.put("createdAt", response.getCreatedAt());

            log.info("Get role upgrade status successful [userId={}, status={}]", userId, response.getStatus());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get role upgrade status error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch upgrade request status: " + e.getMessage()));
        }
    }

    @GetMapping("/orders")
    @Operation(summary = "Get bidder orders", description = "Get list of orders for the authenticated bidder. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getBidderListOrder(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") int limit,
            @Parameter(description = "Order status filter (all, pending, completed, cancelled)")
            @RequestParam(defaultValue = "all") String status) {
        try {
            int userId = getUserId();
            log.info("Getting orders for user {} with status={}, page={}, limit={}", userId, status, page, limit);
            
            var request = GetBidderListOrderRequest.newBuilder()
                .setUserId(userId)
                .setPage(page)
                .setLimit(limit)
                .setStatus(status)
                .build();
            
            var response = bidderGrpcClient.getBidderListOrder(request)
                .block(Duration.ofSeconds(10));
            
            if (response != null && response.getSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", response.getMessage());
                
                List<Map<String, Object>> orders = new ArrayList<>();
                for (OrderItem order : response.getOrdersList()) {
                    Map<String, Object> orderMap = new HashMap<>();
                    orderMap.put("id", order.getId());
                    orderMap.put("productId", order.getProductId());
                    orderMap.put("productTitle", order.getProductTitle());
                    orderMap.put("productImage", order.getProductImage());
                    orderMap.put("amount", order.getAmount());
                    orderMap.put("status", order.getStatus());
                    orderMap.put("sellerId", order.getSellerId());
                    orderMap.put("sellerName", order.getSellerName());
                    orderMap.put("createdAt", order.getCreatedAt());
                    orderMap.put("updatedAt", order.getUpdatedAt());
                    orderMap.put("paymentStatus", order.getPaymentStatus());
                    orders.add(orderMap);
                }
                
                result.put("orders", orders);
                result.put("pageInfo", mapPageInfo(response.getPageInfo()));
                
                log.info("Successfully retrieved {} orders for user {}", orders.size(), userId);
                return ResponseEntity.ok(result);
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", response != null ? response.getMessage() : "Failed to get orders");
                
                log.warn("Failed to get orders for user {}: {}", userId, 
                    response != null ? response.getMessage() : "Unknown error");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
        } catch (Exception e) {
            log.error("Error getting bidder orders: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/banned-products")
    @Operation(summary = "Get banned products", description = "Get list of products that the bidder is banned from. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getBannedProducts(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") int limit) {
        try {
            int userId = getUserId();
            log.info("Getting banned products for user {} with page={}, limit={}", userId, page, limit);
            
            var request = GetBannedProductsRequest.newBuilder()
                .setUserId(userId)
                .setPage(page)
                .setLimit(limit)
                .build();
            
            var response = bidderGrpcClient.getBannedProducts(request)
                .block(Duration.ofSeconds(10));
            
            if (response != null && response.getSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", response.getMessage());
                
                List<Map<String, Object>> bannedProducts = new ArrayList<>();
                for (BannedProduct banned : response.getBannedProductsList()) {
                    Map<String, Object> bannedMap = new HashMap<>();
                    bannedMap.put("id", banned.getId());
                    bannedMap.put("productId", banned.getProductId());
                    bannedMap.put("bidderId", banned.getBidderId());
                    bannedMap.put("sellerId", banned.getSellerId());
                    bannedMap.put("productTitle", banned.getProductTitle());
                    bannedMap.put("productImage", banned.getProductImage());
                    bannedMap.put("sellerName", banned.getSellerName());
                    bannedMap.put("reason", banned.getReason());
                    bannedMap.put("bannedAt", banned.getBannedAt());
                    bannedMap.put("bannedUntil", banned.getBannedUntil());
                    bannedProducts.add(bannedMap);
                }
                
                result.put("bannedProducts", bannedProducts);
                result.put("pageInfo", mapPageInfo(response.getPageInfo()));
                
                log.info("Successfully retrieved {} banned products for user {}", bannedProducts.size(), userId);
                return ResponseEntity.ok(result);
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", response != null ? response.getMessage() : "Failed to get banned products");
                
                log.warn("Failed to get banned products for user {}: {}", userId, 
                    response != null ? response.getMessage() : "Unknown error");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
        } catch (Exception e) {
            log.error("Error getting banned products: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/sellers/{sellerId}/rate")
    @Operation(summary = "Rate seller", description = "Rate a seller after transaction. Requires authentication.")
    public ResponseEntity<Map<String, Object>> rateSeller(
            @Parameter(description = "Seller ID", required = true)
            @PathVariable int sellerId,
            @RequestBody com.auction.entities.dto.RateSellerRequest requestBody) {

        if (sellerId <= 0) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid sellerId");
            return ResponseEntity.badRequest().body(error);
        }

        if (requestBody == null || requestBody.getProductId() == null || requestBody.getProductId() <= 0) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Product ID is required");
            return ResponseEntity.badRequest().body(error);
        }

        int bidderId = getUserId();
        int productId = requestBody.getProductId();
        boolean like = requestBody.getLike();
        String comment = requestBody.getComment() != null ? requestBody.getComment() : "";

        log.info("Rate seller request - sellerId: {}, bidderId: {}, productId: {}",
                sellerId, bidderId, productId);

        AddUserRatingRequest grpcRequest = AddUserRatingRequest.newBuilder()
                .setFromUserId(bidderId)
                .setToUserId(sellerId)
                .setProductId(productId)
                .setLike(like)
                .setComment(comment)
                .build();

        try {
            var response = ratingGrpcClient.addUserRating(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            result.put("reviewId", response.getReviewId());

            if (response.getSuccess()) {
                log.info("Rate seller successful - sellerId: {}, reviewId: {}", sellerId, response.getReviewId());
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Rate seller error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to rate seller: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
