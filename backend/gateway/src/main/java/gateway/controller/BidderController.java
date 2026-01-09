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

import gateway.grpc.BidderGrpcClient;
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
    private final BidderGrpcClient bidderGrpcClient;

    public BidderController(BidderGrpcClient bidderGrpcClient) {
        this.bidderGrpcClient = bidderGrpcClient;
    }

    private int getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Integer.parseInt(authentication.getName());
    }

    @GetMapping("/products/{productId}")
    @Operation(summary = "Get product details", description = "Get detailed product information including watchlist and auto-bid status. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getProductDetails(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId) {

        if (productId <= 0) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid productId");
            return ResponseEntity.badRequest().body(error);
        }

        int userId = getUserId();
        log.info("Get product details request - productId: {}, userId: {}", productId, userId);

        GetProductDetailsRequest grpcRequest = GetProductDetailsRequest.newBuilder()
                .setProductId(productId)
                .setUserId(userId)
                .build();

        try {
            var response = bidderGrpcClient.getProductDetails(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

            if (response.getSuccess() && response.hasProduct()) {
                result.put("product", mapUserProduct(response.getProduct()));
                log.info("Get product details successful - productId: {}", productId);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Get product details error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get product details: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/products/{productId}/related")
    @Operation(summary = "Get related products", description = "Get related products in the same category. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getRelatedProducts(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @Parameter(description = "Number of products to return (max 20)")
            @RequestParam(defaultValue = "5") int limit) {

        if (productId <= 0 || limit <= 0 || limit > 20) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid productId or limit");
            return ResponseEntity.badRequest().body(error);
        }

        int userId = getUserId();
        log.info("Get related products request - productId: {}, userId: {}, limit: {}", productId, userId, limit);

        GetRelatedProductsRequest grpcRequest = GetRelatedProductsRequest.newBuilder()
                .setProductId(productId)
                .setUserId(userId)
                .setLimit(limit)
                .build();

        try {
            var response = bidderGrpcClient.getRelatedProducts(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

            List<Map<String, Object>> products = new ArrayList<>();
            response.getProductsList().forEach(product -> products.add(mapUserProduct(product)));
            result.put("products", products);

            log.info("Get related products successful, count: {}", products.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get related products error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get related products: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/watchlist")
    @Operation(summary = "Add to watchlist", description = "Add a product to user's watchlist. Requires authentication.")
    public ResponseEntity<Map<String, Object>> addToWatchlist(
            @RequestBody com.auction.entities.dto.AddToWatchlistRequest requestBody) {

        if (requestBody == null || requestBody.productId() <= 0) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Bad body request");
            return ResponseEntity.badRequest().body(error);
        }

        int userId = getUserId();
        int productId = requestBody.productId();
        log.info("Add to watchlist request - productId: {}, userId: {}", productId, userId);

        AddToWatchlistRequest grpcRequest = AddToWatchlistRequest.newBuilder()
                .setProductId(productId)
                .setUserId(userId)
                .build();

        try {
            var response = bidderGrpcClient.addToWatchlist(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            result.put("watchlistId", response.getWatchlistId());

            if (response.getSuccess()) {
                log.info("Add to watchlist successful - productId: {}", productId);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Add to watchlist error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to add to watchlist: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/watchlist/{productId}")
    @Operation(summary = "Remove from watchlist", description = "Remove a product from user's watchlist. Requires authentication.")
    public ResponseEntity<Map<String, Object>> removeFromWatchlist(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId) {

        if (productId <= 0) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid productId");
            return ResponseEntity.badRequest().body(error);
        }

        int userId = getUserId();
        log.info("Remove from watchlist request - productId: {}, userId: {}", productId, userId);

        RemoveFromWatchlistRequest grpcRequest = RemoveFromWatchlistRequest.newBuilder()
                .setProductId(productId)
                .setUserId(userId)
                .build();

        try {
            var response = bidderGrpcClient.removeFromWatchlist(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

            if (response.getSuccess()) {
                log.info("Remove from watchlist successful - productId: {}", productId);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Remove from watchlist error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to remove from watchlist: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/watchlist")
    @Operation(summary = "Get watchlist", description = "Get user's watchlist with pagination. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getWatchlist(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") int limit,
            @Parameter(description = "Product status filter (active, ended, all)")
            @RequestParam(defaultValue = "active") String status) {

        if (page <= 0 || limit <= 0 || limit > 100) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid page or limit");
            return ResponseEntity.badRequest().body(error);
        }

        int userId = getUserId();
        log.info("Get watchlist request - userId: {}, page: {}, limit: {}", userId, page, limit);

        GetWatchlistRequest grpcRequest = GetWatchlistRequest.newBuilder()
                .setUserId(userId)
                .setPage(page)
                .setLimit(limit)
                .setStatus(status)
                .build();

        try {
            log.info("Calling gRPC client.getWatchlist...");
            var response = bidderGrpcClient.getWatchlist(grpcRequest)
                .timeout(Duration.ofSeconds(30))
                .block();
            log.info("Got response from gRPC: success={}", response.getSuccess());

            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

            List<Map<String, Object>> products = new ArrayList<>();
            response.getProductsList().forEach(product -> products.add(mapUserProduct(product)));
            result.put("products", products);
            result.put("pageInfo", mapPageInfo(response.getPageInfo()));

            log.info("Get watchlist successful, count: {}", products.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get watchlist error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get watchlist: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/products/{productId}/questions")
    @Operation(summary = "Ask question", description = "Ask a question about a product. Requires authentication.")
    public ResponseEntity<Map<String, Object>> askQuestion(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @RequestBody com.auction.entities.dto.AskQuestionRequest requestBody) {

        if (productId <= 0 || requestBody == null || requestBody.question() == null || requestBody.question().trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Bad body request");
            return ResponseEntity.badRequest().body(error);
        }

        int userId = getUserId();
        String question = requestBody.question();
        log.info("Ask question request - productId: {}, userId: {}", productId, userId);

        AskQuestionRequest grpcRequest = AskQuestionRequest.newBuilder()
                .setProductId(productId)
                .setUserId(userId)
                .setQuestion(question)
                .build();

        try {
            var response = bidderGrpcClient.askQuestion(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            result.put("questionId", response.getQuestionId());
            result.put("createdAt", response.getCreatedAt());

            if (response.getSuccess()) {
                log.info("Ask question successful - productId: {}", productId);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Ask question error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to ask question: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/products/{productId}/questions")
    @Operation(summary = "Get product questions", description = "Get questions and answers for a product. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getProductQuestions(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") int limit) {

        if (productId <= 0 || page <= 0 || limit <= 0 || limit > 100) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid productId, page or limit");
            return ResponseEntity.badRequest().body(error);
        }

        log.info("Get product questions request - productId: {}, page: {}, limit: {}", productId, page, limit);

        GetProductQuestionsRequest grpcRequest = GetProductQuestionsRequest.newBuilder()
                .setProductId(productId)
                .setPage(page)
                .setLimit(limit)
                .build();

        try {
            var response = bidderGrpcClient.getProductQuestions(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

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
            result.put("questions", questions);
            result.put("pageInfo", mapPageInfo(response.getPageInfo()));

            log.info("Get product questions successful, count: {}", questions.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get product questions error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get product questions: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/products/{productId}/bids")
    @Operation(summary = "Get product bids", description = "Get bid history for a product. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getProductBids(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") int limit) {

        if (productId <= 0 || page <= 0 || limit <= 0 || limit > 100) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid productId, page or limit");
            return ResponseEntity.badRequest().body(error);
        }

        int userId = getUserId();
        log.info("Get product bids request - productId: {}, userId: {}, page: {}, limit: {}", productId, userId, page, limit);

        GetProductBidsRequest grpcRequest = GetProductBidsRequest.newBuilder()
                .setProductId(productId)
                .setUserId(userId)
                .setPage(page)
                .setLimit(limit)
                .build();

        try {
            var response = bidderGrpcClient.getProductBids(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

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
            result.put("bids", bids);
            result.put("pageInfo", mapPageInfo(response.getPageInfo()));

            log.info("Get product bids successful, count: {}", bids.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get product bids error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get product bids: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/products/{productId}/bids")
    @Operation(summary = "Place bid", description = "Place a bid on a product. Requires authentication.")
    public ResponseEntity<Map<String, Object>> placeBid(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @RequestBody com.auction.entities.dto.PlaceBidRequest requestBody) {

        if (productId <= 0 || requestBody == null || requestBody.bidAmount() <= 0) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Bad body request");
            return ResponseEntity.badRequest().body(error);
        }

        int userId = getUserId();
        double bidAmount = requestBody.bidAmount();
        log.info("Place bid request - productId: {}, userId: {}, amount: {}", productId, userId, bidAmount);

        PlaceBidRequest grpcRequest = PlaceBidRequest.newBuilder()
                .setProductId(productId)
                .setUserId(userId)
                .setBidAmount(bidAmount)
                .build();

        try {
            var response = bidderGrpcClient.placeBid(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            result.put("bidId", response.getBidId());
            result.put("currentPrice", response.getCurrentPrice());
            result.put("nextMinBid", response.getNextMinBid());
            result.put("createdAt", response.getCreatedAt());
            result.put("isHighestBidder", response.getIsHighestBidder());

            if (response.getSuccess()) {
                log.info("Place bid successful - productId: {}, bidId: {}", productId, response.getBidId());
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Place bid error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to place bid: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/products/{productId}/auto-bid")
    @Operation(summary = "Set auto-bid", description = "Set up automatic bidding for a product. Requires authentication.")
    public ResponseEntity<Map<String, Object>> setAutoBid(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @RequestBody com.auction.entities.dto.SetAutoBidRequest requestBody) {

        if (productId <= 0 || requestBody == null || requestBody.maxAmount() <= 0) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Bad body request");
            return ResponseEntity.badRequest().body(error);
        }

        int userId = getUserId();
        double maxAmount = requestBody.maxAmount();
        log.info("Set auto-bid request - productId: {}, userId: {}, maxAmount: {}", productId, userId, maxAmount);

        SetAutoBidRequest grpcRequest = SetAutoBidRequest.newBuilder()
                .setProductId(productId)
                .setUserId(userId)
                .setMaxAmount(maxAmount)
                .build();

        try {
            var response = bidderGrpcClient.setAutoBid(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            result.put("autoBidId", response.getAutoBidId());
            result.put("maxAmount", response.getMaxAmount());
            result.put("currentBid", response.getCurrentBid());
            result.put("createdAt", response.getCreatedAt());

            if (response.getSuccess()) {
                log.info("Set auto-bid successful - productId: {}, autoBidId: {}", productId, response.getAutoBidId());
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Set auto-bid error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to set auto-bid: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/bids")
    @Operation(summary = "Get my bids", description = "Get user's bid history with pagination and filters. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getMyBids(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page (max 100)")
            @RequestParam(defaultValue = "20") int limit,
            @Parameter(description = "Filter (all, winning, outbid, won, lost)")
            @RequestParam(defaultValue = "all") String filter) {

        if (page <= 0 || limit <= 0 || limit > 100) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid page or limit");
            return ResponseEntity.badRequest().body(error);
        }

        int userId = getUserId();
        log.info("Get my bids request - userId: {}, page: {}, limit: {}, filter: {}", userId, page, limit, filter);

        GetMyBidsRequest grpcRequest = GetMyBidsRequest.newBuilder()
                .setUserId(userId)
                .setPage(page)
                .setLimit(limit)
                .setFilter(filter)
                .build();

        try {
            var response = bidderGrpcClient.getMyBids(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

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
            result.put("bids", bids);
            result.put("pageInfo", mapPageInfo(response.getPageInfo()));

            log.info("Get my bids successful, count: {}", bids.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get my bids error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get my bids: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
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
            sellerInfoMap.put("ratingPercent", sellerInfo.getRatingPercent());
            sellerInfoMap.put("positiveReviews", sellerInfo.getPositiveReviews());
            sellerInfoMap.put("negativeReviews", sellerInfo.getNegativeReviews());
            productMap.put("sellerInfo", sellerInfoMap);
            
            // Also add flat fields for frontend compatibility
            productMap.put("sellerName", sellerInfo.getFullName());
            productMap.put("sellerRatingPercent", sellerInfo.getRatingPercent());
            productMap.put("sellerRatingCount", sellerInfo.getPositiveReviews() + sellerInfo.getNegativeReviews());
            productMap.put("sellerAvatar", ""); // Avatar not available in proto, set to empty string
        } else {
            // If seller info is not available, set defaults
            productMap.put("sellerName", "Unknown Seller");
            productMap.put("sellerRatingPercent", 0.0);
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
    public ResponseEntity<Map<String, Object>> getUserNotifications() {
        int userId = getUserId();
        log.info("Get user notifications request - userId: {}", userId);

        GetUserNotificationsRequest grpcRequest = GetUserNotificationsRequest.newBuilder()
                .setUserId(userId)
                .build();

        try {
            GetUserNotificationsResponse grpcResponse = bidderGrpcClient
                    .getUserNotifications(grpcRequest)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            if (grpcResponse != null && grpcResponse.getSuccess()) {
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

                Map<String, Object> response = new HashMap<>();
                response.put("notifications", notifications);
                response.put("unreadCount", grpcResponse.getUnreadCount());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", grpcResponse != null ? grpcResponse.getMessage() : "Failed to get notifications");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
        } catch (Exception e) {
            log.error("Get user notifications error: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to get notifications: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/notifications/{notificationId}/read")
    @Operation(summary = "Mark notification as read", description = "Mark a specific notification as read. Requires authentication.")
    public ResponseEntity<Map<String, Object>> markNotificationAsRead(
            @Parameter(description = "Notification ID", required = true)
            @PathVariable int notificationId) {

        int userId = getUserId();
        log.info("Mark notification as read request - notificationId: {}, userId: {}", notificationId, userId);

        MarkNotificationAsReadRequest grpcRequest = MarkNotificationAsReadRequest.newBuilder()
                .setNotificationId(notificationId)
                .setUserId(userId)
                .build();

        try {
            MarkNotificationAsReadResponse grpcResponse = bidderGrpcClient
                    .markNotificationAsRead(grpcRequest)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            if (grpcResponse != null && grpcResponse.getSuccess()) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", grpcResponse.getMessage());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", grpcResponse != null ? grpcResponse.getMessage() : "Failed to mark notification as read");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
        } catch (Exception e) {
            log.error("Mark notification as read error: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to mark notification as read: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/ratings")
    @Operation(summary = "Get bidder ratings", description = "Get bidder's ratings and reviews. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getBidderRatings(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") int pageSize) {

        if (page <= 0 || pageSize <= 0 || pageSize > 100) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid page or pageSize");
            return ResponseEntity.badRequest().body(error);
        }

        int bidderId = getUserId();
        log.info("Get bidder ratings request - bidderId: {}, page: {}, pageSize: {}", bidderId, page, pageSize);

        GetBidderRatingsRequest grpcRequest = GetBidderRatingsRequest.newBuilder()
                .setBidderId(bidderId)
                .setPage(page)
                .setPageSize(pageSize)
                .build();

        try {
            var response = bidderGrpcClient.getBidderRatings(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("positiveReviews", response.getPositiveReviews());
            result.put("negativeReviews", response.getNegativeReviews());
            result.put("ratingPercent", response.getRatingPercent());
            result.put("reviews", mapBidderReviewList(response.getReviewsList()));
            result.put("totalCount", response.getTotalCount());

            log.info("Get bidder ratings successful, count: {}", response.getReviewsCount());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get bidder ratings error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get bidder ratings: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @PostMapping("/products/{productId}/buy-now")
    @Operation(summary = "Buy now product", description = "Purchase a product immediately using buy now feature. Requires positive reviews > 4 × negative reviews. Requires authentication.")
    public ResponseEntity<Map<String, Object>> buyNowProduct(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId) {

        if (productId <= 0) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid productId");
            return ResponseEntity.badRequest().body(error);
        }

        int userId = getUserId();
        log.info("Buy now product request - productId: {}, userId: {}", productId, userId);

        BuyNowProductRequest grpcRequest = BuyNowProductRequest.newBuilder()
                .setProductId(productId)
                .setUserId(userId)
                .build();

        try {
            var response = bidderGrpcClient.buyNowProduct(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            
            if (response.getSuccess()) {
                result.put("orderId", response.getOrderId());
                result.put("price", response.getPrice());
                result.put("createdAt", response.getCreatedAt());
                log.info("Buy now successful - orderId: {}, price: {}", response.getOrderId(), response.getPrice());
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Buy now product error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to buy now: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // HELPER MAPPING METHODS
    // ============================================================================
    
    @GetMapping("/products/{productId}/top-bidders")
    @Operation(summary = "Get top bidders", description = "Get top bidders for a product from Redis. Does not require authentication.")
    public ResponseEntity<Map<String, Object>> getTopBidders(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @Parameter(description = "Number of top bidders to return (default 5, max 10)")
            @RequestParam(defaultValue = "5") int limit) {
        
        if (productId <= 0 || limit <= 0 || limit > 10) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid productId or limit");
            return ResponseEntity.badRequest().body(error);
        }
        
        log.info("Get top bidders request - productId: {}, limit: {}", productId, limit);
        
        GetTopBiddersRequest grpcRequest = GetTopBiddersRequest.newBuilder()
                .setProductId(productId)
                .setLimit(limit)
                .build();
        
        try {
            var response = bidderGrpcClient.getTopBidders(grpcRequest)
                    .timeout(Duration.ofSeconds(5))
                    .block();
            
            Map<String, Object> result = new HashMap<>();
            
            if (response == null || !response.getSuccess()) {
                result.put("success", false);
                result.put("message", response != null ? response.getMessage() : "Failed to get top bidders");
                log.warn("Failed to get top bidders: {}", response != null ? response.getMessage() : "null response");
                return ResponseEntity.badRequest().body(result);
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
            
            result.put("success", true);
            result.put("message", response.getMessage());
            result.put("topBidders", topBidders);
            
            log.info("Successfully retrieved {} top bidders for product {}", topBidders.size(), productId);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error getting top bidders for product {}: {}", productId, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "Failed to get top bidders: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResult);
        }
    }

    private List<Map<String, Object>> mapBidderReviewList(List<BidderReview> reviews) {
        List<Map<String, Object>> result = new ArrayList<>();
        reviews.forEach(review -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", review.getId());
            map.put("fromUserId", review.getFromUserId());
            map.put("fromUserName", review.getFromUserName());
            map.put("score", review.getScore());
            map.put("comment", review.getComment());
            map.put("createdAt", review.getCreatedAt());
            result.add(map);
        });
        return result;
    }
    
    @PostMapping("/upgrade-request")
    @Operation(summary = "Request role upgrade", description = "Request to upgrade role from bidder to seller. Requires authentication.")
    public ResponseEntity<Map<String, Object>> requestRoleUpgrade() {
        try {
            int userId = getUserId();
            log.info("User {} requesting role upgrade to seller", userId);

            var grpcRequest = RequestRoleUpgradeRequest.newBuilder()
                    .setUserId(userId)
                    .build();

            RequestRoleUpgradeResponse response = 
                    bidderGrpcClient.requestRoleUpgrade(grpcRequest)
                            .timeout(Duration.ofSeconds(5))
                            .block();

            if (response != null && response.getSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("message", response.getMessage());
                result.put("requestId", response.getRequestId());

                log.info("Role upgrade request successful for user {}", userId);
                return ResponseEntity.ok(result);
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", response != null ? response.getMessage() : "Failed to submit upgrade request");

                log.warn("Role upgrade request failed for user {}: {}", 
                    userId, response != null ? response.getMessage() : "Unknown error");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
        } catch (Exception e) {
            log.error("Error processing role upgrade request: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @GetMapping("/role-upgrade-status")
    @Operation(summary = "Get role upgrade request status", description = "Get the status of user's role upgrade request. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getRoleUpgradeRequestStatus() {
        try {
            int userId = getUserId();
            log.info("Getting role upgrade request status for user {}", userId);
            
            var request = GetRoleUpgradeRequestStatusRequest.newBuilder()
                .setUserId(userId)
                .build();
            
            var response = bidderGrpcClient.getRoleUpgradeRequestStatus(request)
                .block(Duration.ofSeconds(5));
            
            if (response != null && response.getSuccess()) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("hasRequest", response.getHasRequest());
                result.put("status", response.getStatus());
                result.put("createdAt", response.getCreatedAt());
                result.put("message", response.getMessage());
                
                log.info("Role upgrade status retrieved successfully for user {}: {}", userId, response.getStatus());
                return ResponseEntity.ok(result);
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", response != null ? response.getMessage() : "Failed to get upgrade request status");

                log.warn("Failed to get role upgrade status for user {}: {}", 
                    userId, response != null ? response.getMessage() : "Unknown error");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
        } catch (Exception e) {
            log.error("Error getting role upgrade request status: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
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
}
