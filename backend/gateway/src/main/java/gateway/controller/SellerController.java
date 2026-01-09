package gateway.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.auctionplatform.seller.grpc.*;

import gateway.grpc.SellerGrpcClient;
import gateway.service.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/seller")
@Tag(name = "Seller", description = "Seller user endpoints - requires authentication")
@SecurityRequirement(name = "bearerAuth")
public class SellerController {
    private static final Logger log = LoggerFactory.getLogger(SellerController.class);
    private final SellerGrpcClient sellerGrpcClient;
    private final CloudinaryService cloudinaryService;

    public SellerController(SellerGrpcClient sellerGrpcClient, CloudinaryService cloudinaryService) {
        this.sellerGrpcClient = sellerGrpcClient;
        this.cloudinaryService = cloudinaryService;
    }

    private int getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Integer.parseInt(authentication.getName());
    }

    // ============================================================================
    // DASHBOARD / PROFILE ENDPOINTS
    // ============================================================================

    @GetMapping("/profile")
    @Operation(summary = "Get seller profile", description = "Get seller profile information. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getSellerProfile() {
        int sellerId = getUserId();
        log.info("Get seller profile request - sellerId: {}", sellerId);

        GetSellerProfileRequest grpcRequest = GetSellerProfileRequest.newBuilder()
                .setSellerId(sellerId)
                .build();

        try {
            var response = sellerGrpcClient.getSellerProfile(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("profile", mapSellerProfile(response));

            log.info("Get seller profile successful - sellerId: {}", sellerId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get seller profile error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get seller profile: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/active-listings")
    @Operation(summary = "Get active listings", description = "Get seller's active product listings. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getActiveListings(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") int pageSize) {

        int sellerId = getUserId();
        log.info("Get active listings request - sellerId: {}, page: {}, pageSize: {}", sellerId, page, pageSize);

        GetActiveListingsRequest grpcRequest = GetActiveListingsRequest.newBuilder()
                .setSellerId(sellerId)
                .setPage(page)
                .setPageSize(pageSize)
                .build();

        try {
            var response = sellerGrpcClient.getActiveListings(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("products", mapProductList(response.getProductsList()));
            result.put("totalCount", response.getTotalCount());
            result.put("page", response.getPage());
            result.put("pageSize", response.getPageSize());

            log.info("Get active listings successful, count: {}", response.getProductsCount());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get active listings error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get active listings: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/winner-items")
    @Operation(summary = "Get winner items", description = "Get products where winner has been determined. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getWinnerItems(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") int pageSize) {

        int sellerId = getUserId();
        log.info("Get winner items request - sellerId: {}, page: {}, pageSize: {}", sellerId, page, pageSize);

        GetWinnerItemsRequest grpcRequest = GetWinnerItemsRequest.newBuilder()
                .setSellerId(sellerId)
                .setPage(page)
                .setPageSize(pageSize)
                .build();

        try {
            var response = sellerGrpcClient.getWinnerItems(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("products", mapProductList(response.getProductsList()));
            result.put("totalCount", response.getTotalCount());
            result.put("page", response.getPage());
            result.put("pageSize", response.getPageSize());

            log.info("Get winner items successful, count: {}", response.getProductsCount());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get winner items error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get winner items: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get transaction history", description = "Get seller's transaction history. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getTransactionHistory(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") int pageSize,
            @Parameter(description = "Status filter (completed, pending, cancelled)")
            @RequestParam(defaultValue = "") String filter) {

        int sellerId = getUserId();
        log.info("Get transaction history request - sellerId: {}, page: {}, pageSize: {}, filter: {}", 
                sellerId, page, pageSize, filter);

        GetTransactionHistoryRequest grpcRequest = GetTransactionHistoryRequest.newBuilder()
                .setSellerId(sellerId)
                .setPage(page)
                .setPageSize(pageSize)
                .setFilter(filter)
                .build();

        try {
            var response = sellerGrpcClient.getTransactionHistory(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("transactions", mapTransactionList(response.getTransactionsList()));
            result.put("totalCount", response.getTotalCount());
            result.put("page", response.getPage());
            result.put("pageSize", response.getPageSize());

            log.info("Get transaction history successful, count: {}", response.getTransactionsCount());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get transaction history error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get transaction history: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/ratings")
    @Operation(summary = "Get seller ratings", description = "Get seller's ratings and reviews. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getSellerRatings(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") int pageSize) {

        int sellerId = getUserId();
        log.info("Get seller ratings request - sellerId: {}, page: {}, pageSize: {}", sellerId, page, pageSize);

        GetSellerRatingsRequest grpcRequest = GetSellerRatingsRequest.newBuilder()
                .setSellerId(sellerId)
                .setPage(page)
                .setPageSize(pageSize)
                .build();

        try {
            var response = sellerGrpcClient.getSellerRatings(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("positiveReviews", response.getPositiveReviews());
            result.put("negativeReviews", response.getNegativeReviews());
            result.put("ratingPercent", response.getRatingPercent());
            result.put("reviews", mapReviewList(response.getReviewsList()));
            result.put("totalCount", response.getTotalCount());

            log.info("Get seller ratings successful, count: {}", response.getReviewsCount());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get seller ratings error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get seller ratings: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // CREATE AUCTION LISTING
    // ============================================================================

    @PostMapping(value = "/listings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create auction listing", description = "Create a new auction listing with up to 4 images. Requires authentication. Date format: yyyy-MM-dd'T'HH:mm:ss")
    public ResponseEntity<Map<String, Object>> createAuctionListing(
            @Parameter(description = "Product title", required = true)
            @RequestParam("title") String title,
            @Parameter(description = "Product description", required = true)
            @RequestParam("description") String description,
            @Parameter(description = "Category ID", required = true, example = "1")
            @RequestParam("categoryId") String categoryIdStr,
            @Parameter(description = "Starting price", required = true, example = "100.0")
            @RequestParam("startingPrice") String startingPriceStr,
            @Parameter(description = "Step price for bidding", required = true, example = "10.0")
            @RequestParam("stepPrice") String stepPriceStr,
            @Parameter(description = "Auction start date and time (format: yyyy-MM-dd'T'HH:mm:ss)", required = true, example = "2025-01-01T10:00:00")
            @RequestParam("startsAt") String startsAtStr,
            @Parameter(description = "Auction end date and time (format: yyyy-MM-dd'T'HH:mm:ss)", required = true, example = "2025-01-10T10:00:00")
            @RequestParam("endsAt") String endsAtStr,
            @Parameter(description = "Buy now price (optional)", example = "500.0")
            @RequestParam(value = "buyNowPrice", required = false) String buyNowPriceStr,
            @Parameter(description = "Enable auto-extend (optional)", example = "true")
            @RequestParam(value = "isAutoExtend", required = false) String isAutoExtendStr,
            @Parameter(description = "Auto-extend duration in seconds (optional)", example = "600")
            @RequestParam(value = "autoExtendSeconds", required = false) String autoExtendSecondsStr,
            @Parameter(
                description = "Product images (max 4 files). Accepted formats: JPG, JPEG, PNG, GIF, WEBP. Max size per file: 10MB",
                content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE, schema = @Schema(type = "array", format = "binary"))
            )
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        int sellerId = getUserId();
        
        try {
            // Parse parameters from strings
            int categoryId = Integer.parseInt(categoryIdStr);
            float startingPrice = Float.parseFloat(startingPriceStr);
            float stepPrice = Float.parseFloat(stepPriceStr);
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
            LocalDateTime startsAt = LocalDateTime.parse(startsAtStr, formatter);
            LocalDateTime endsAt = LocalDateTime.parse(endsAtStr, formatter);
            
            Float buyNowPrice = (buyNowPriceStr != null && !buyNowPriceStr.isEmpty()) 
                ? Float.parseFloat(buyNowPriceStr) : null;
            Boolean isAutoExtend = (isAutoExtendStr != null && !isAutoExtendStr.isEmpty()) 
                ? Boolean.parseBoolean(isAutoExtendStr) : null;
            Integer autoExtendSeconds = (autoExtendSecondsStr != null && !autoExtendSecondsStr.isEmpty()) 
                ? Integer.parseInt(autoExtendSecondsStr) : null;
            
            log.info("Create auction listing request - sellerId: {}, startsAt: {}, endsAt: {}", sellerId, startsAt, endsAt);

            // Upload images to Cloudinary (max 4) - blocking
            List<String> imageUrls = new ArrayList<>();
            log.info("Checking images parameter - is null: {}", images == null);
            
            if (images != null && !images.isEmpty()) {
                log.info("Images list size: {}", images.size());
                List<MultipartFile> filesToUpload = images.size() > 4 ? images.subList(0, 4) : images;
                
                // Validate image types
                for (MultipartFile file : filesToUpload) {
                    String contentType = file.getContentType();
                    if (!isValidImageType(contentType)) {
                        Map<String, Object> error = new HashMap<>();
                        error.put("success", false);
                        error.put("message", "Invalid file type: " + file.getOriginalFilename() + ". Only JPG, JPEG, PNG, GIF, WEBP are allowed.");
                        return ResponseEntity.badRequest().body(error);
                    }
                }
                
                log.info("Uploading {} images to Cloudinary", filesToUpload.size());
                imageUrls = cloudinaryService.uploadMultipleServlet(filesToUpload, "products");
                log.info("Uploaded {} images successfully", imageUrls.size());
            }

            // Convert LocalDateTime to ISO String for gRPC
            DateTimeFormatter isoFormatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            String startsAtGrpc = startsAt.format(isoFormatter);
            String endsAtGrpc = endsAt.format(isoFormatter);
            
            // Build gRPC request
            CreateAuctionListingRequest.Builder builder = CreateAuctionListingRequest.newBuilder()
                    .setSellerId(sellerId)
                    .setTitle(title)
                    .setDescription(description)
                    .setCategoryId(categoryId)
                    .setStartingPrice(startingPrice)
                    .setStepPrice(stepPrice)
                    .setStartsAt(startsAtGrpc)
                    .setEndsAt(endsAtGrpc);

            if (buyNowPrice != null) {
                builder.setBuyNowPrice(buyNowPrice);
            }
            if (isAutoExtend != null) {
                builder.setIsAutoExtend(isAutoExtend);
            }
            if (autoExtendSeconds != null) {
                builder.setAutoExtendSeconds(autoExtendSeconds);
            }
            if (!imageUrls.isEmpty()) {
                builder.addAllImageUrls(imageUrls);
            }

            // Call gRPC service - blocking
            var response = sellerGrpcClient.createAuctionListing(builder.build()).block();
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            result.put("productId", response.getProductId());
            result.put("imageUrls", imageUrls);

            if (response.getSuccess()) {
                log.info("Create auction listing successful - productId: {}", response.getProductId());
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (NumberFormatException e) {
            log.error("Invalid number format in parameters: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid number format: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (java.time.format.DateTimeParseException e) {
            log.error("Invalid date format: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid date format. Expected format: yyyy-MM-dd'T'HH:mm:ss");
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            log.error("Create auction listing error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to create auction listing: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // PRODUCT DETAIL (OWNER VIEW)
    // ============================================================================

    @GetMapping("/products/{productId}")
    @Operation(summary = "Get product details (owner view)", description = "Get detailed product information for seller. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getProductDetails(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId) {

        int sellerId = getUserId();
        log.info("Get product details request - productId: {}, sellerId: {}", productId, sellerId);

        GetProductDetailsRequest grpcRequest = GetProductDetailsRequest.newBuilder()
                .setProductId(productId)
                .setSellerId(sellerId)
                .build();

        try {
            var response = sellerGrpcClient.getProductDetails(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("product", mapProductDetails(response));

            log.info("Get product details successful - productId: {}", productId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get product details error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get product details: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/questions/{questionId}/answer")
    @Operation(summary = "Answer question", description = "Answer a question about a product. Requires authentication.")
    public ResponseEntity<Map<String, Object>> answerQuestion(
            @Parameter(description = "Question ID", required = true)
            @PathVariable int questionId,
            @RequestBody com.auction.entities.dto.AnswerQuestionRequest requestBody) {

        int sellerId = getUserId();
        String answer = requestBody.getAnswer();
        log.info("Answer question request - questionId: {}, sellerId: {}", questionId, sellerId);

        AnswerQuestionRequest grpcRequest = AnswerQuestionRequest.newBuilder()
                .setSellerId(sellerId)
                .setQuestionId(questionId)
                .setAnswer(answer)
                .build();

        try {
            var response = sellerGrpcClient.answerQuestion(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

            if (response.getSuccess()) {
                log.info("Answer question successful - questionId: {}", questionId);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Answer question error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to answer question: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/products/{productId}/reject-bidder")
    @Operation(summary = "Reject bidder", description = "Reject a bidder from participating in the auction. Requires authentication.")
    public ResponseEntity<Map<String, Object>> rejectBidder(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @RequestBody com.auction.entities.dto.RejectBidderRequest requestBody) {

        int sellerId = getUserId();
        int bidderId = requestBody.getBidderId();
        String reason = requestBody.getReason();
        log.info("Reject bidder request - productId: {}, bidderId: {}, sellerId: {}", productId, bidderId, sellerId);

        RejectBidderRequest grpcRequest = RejectBidderRequest.newBuilder()
                .setSellerId(sellerId)
                .setProductId(productId)
                .setBidderId(bidderId)
                .setReason(reason)
                .build();

        try {
            var response = sellerGrpcClient.rejectBidder(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

            if (response.getSuccess()) {
                log.info("Reject bidder successful - productId: {}, bidderId: {}", productId, bidderId);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Reject bidder error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to reject bidder: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/products/{productId}/description")
    @Operation(summary = "Append product description", description = "Append additional description to a product. Requires authentication.")
    public ResponseEntity<Map<String, Object>> appendProductDescription(
            @Parameter(description = "Product ID", required = true)
            @PathVariable int productId,
            @RequestBody com.auction.entities.dto.AppendProductDescriptionRequest requestBody) {

        int sellerId = getUserId();
        String additionalDescription = requestBody.getAdditionalDescription();
        log.info("Append product description request - productId: {}, sellerId: {}", productId, sellerId);

        AppendProductDescriptionRequest grpcRequest = AppendProductDescriptionRequest.newBuilder()
                .setSellerId(sellerId)
                .setProductId(productId)
                .setAdditionalDescription(additionalDescription)
                .build();

        try {
            var response = sellerGrpcClient.appendProductDescription(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            result.put("updatedDescription", response.getUpdatedDescription());

            if (response.getSuccess()) {
                log.info("Append product description successful - productId: {}", productId);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Append product description error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to append product description: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/bidders/{bidderId}/rate")
    @Operation(summary = "Rate bidder", description = "Rate a bidder after transaction. Requires authentication.")
    public ResponseEntity<Map<String, Object>> rateBidder(
            @Parameter(description = "Bidder ID", required = true)
            @PathVariable int bidderId,
            @RequestBody com.auction.entities.dto.RateBidderRequest requestBody) {

        int sellerId = getUserId();
        int orderId = requestBody.getOrderId();
        int score = requestBody.getScore();
        String comment = requestBody.getComment();
        log.info("Rate bidder request - bidderId: {}, sellerId: {}, orderId: {}, score: {}", 
                bidderId, sellerId, orderId, score);

        RateBidderRequest grpcRequest = RateBidderRequest.newBuilder()
                .setSellerId(sellerId)
                .setBidderId(bidderId)
                .setOrderId(orderId)
                .setScore(score)
                .setComment(comment != null ? comment : "")
                .build();

        try {
            var response = sellerGrpcClient.rateBidder(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

            if (response.getSuccess()) {
                log.info("Rate bidder successful - bidderId: {}", bidderId);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Rate bidder error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to rate bidder: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // LISTINGS MANAGEMENT
    // ============================================================================

    @GetMapping("/listings")
    @Operation(summary = "Get listings", description = "Get seller's product listings with filter. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getListings(
            @Parameter(description = "Status filter (active, expired, all)")
            @RequestParam(defaultValue = "all") String filter,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") int pageSize) {

        int sellerId = getUserId();
        log.info("Get listings request - sellerId: {}, filter: {}, page: {}, pageSize: {}", 
                sellerId, filter, page, pageSize);

        GetListingsRequest grpcRequest = GetListingsRequest.newBuilder()
                .setSellerId(sellerId)
                .setFilter(filter)
                .setPage(page)
                .setPageSize(pageSize)
                .build();

        try {
            var response = sellerGrpcClient.getListings(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("listings", mapListingDetailList(response.getListingsList()));
            result.put("totalCount", response.getTotalCount());
            result.put("page", response.getPage());
            result.put("pageSize", response.getPageSize());

            log.info("Get listings successful, count: {}", response.getListingsCount());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get listings error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get listings: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // ORDER MANAGEMENT
    // ============================================================================

    @GetMapping("/orders")
    @Operation(summary = "Get orders", description = "Get seller's orders with status filter. Requires authentication.")
    public ResponseEntity<Map<String, Object>> getOrders(
            @Parameter(description = "Status filter (pending, completed, cancelled, all)")
            @RequestParam(defaultValue = "all") String statusFilter,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") int pageSize) {

        int sellerId = getUserId();
        log.info("Get orders request - sellerId: {}, statusFilter: {}, page: {}, pageSize: {}", 
                sellerId, statusFilter, page, pageSize);

        GetOrdersRequest grpcRequest = GetOrdersRequest.newBuilder()
                .setSellerId(sellerId)
                .setStatusFilter(statusFilter)
                .setPage(page)
                .setPageSize(pageSize)
                .build();

        try {
            var response = sellerGrpcClient.getOrders(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("orders", mapOrderDetailList(response.getOrdersList()));
            result.put("totalCount", response.getTotalCount());
            result.put("page", response.getPage());
            result.put("pageSize", response.getPageSize());

            log.info("Get orders successful, count: {}", response.getOrdersCount());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Get orders error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to get orders: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/orders/{orderId}/confirm-payment")
    @Operation(summary = "Confirm payment receipt", description = "Confirm payment receipt for an order. Requires authentication.")
    public ResponseEntity<Map<String, Object>> confirmPaymentReceipt(
            @Parameter(description = "Order ID", required = true)
            @PathVariable int orderId,
            @RequestBody ConfirmPaymentReceiptRequest requestBody) {

        int sellerId = getUserId();
        String invoiceNumber = requestBody.getInvoiceNumber();
        String paymentConfirmationNotes = requestBody.getPaymentConfirmationNotes();
        log.info("Confirm payment receipt request - orderId: {}, sellerId: {}", orderId, sellerId);

        ConfirmPaymentReceiptRequest grpcRequest = ConfirmPaymentReceiptRequest.newBuilder()
                .setSellerId(sellerId)
                .setOrderId(orderId)
                .setInvoiceNumber(invoiceNumber != null ? invoiceNumber : "")
                .setPaymentConfirmationNotes(paymentConfirmationNotes != null ? paymentConfirmationNotes : "")
                .build();

        try {
            var response = sellerGrpcClient.confirmPaymentReceipt(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());

            if (response.getSuccess()) {
                log.info("Confirm payment receipt successful - orderId: {}", orderId);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Confirm payment receipt error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to confirm payment receipt: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @PatchMapping("/orders/{orderId}/status")
    @Operation(summary = "Update order status", description = "Update the status of an order. Only the seller who owns the product can update. Requires authentication.")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @Parameter(description = "Order ID", required = true)
            @PathVariable int orderId,
            @RequestBody Map<String, Object> requestBody) {
        
        int sellerId = getUserId();
        String status = (String) requestBody.get("status");
        
        log.info("Update order status request - orderId: {}, sellerId: {}, status: {}", orderId, sellerId, status);
        
        if (status == null || status.trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Status is required");
            return ResponseEntity.badRequest().body(error);
        }
        
        // Normalize status to lowercase to match database expectations
        String normalizedStatus = status.trim().toLowerCase();
        
        // Validate status before sending to service
        List<String> validStatuses = List.of("pending", "processing", "shipped", "delivered", "cancelled");
        if (!validStatuses.contains(normalizedStatus)) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Invalid status: " + status + ". Valid statuses: " + validStatuses);
            return ResponseEntity.badRequest().body(error);
        }
        
        UpdateOrderStatusRequest grpcRequest = UpdateOrderStatusRequest.newBuilder()
            .setSellerId(sellerId)
            .setOrderId(orderId)
            .setStatus(normalizedStatus)
            .build();
        
        try {
            var response = sellerGrpcClient.updateOrderStatus(grpcRequest).block();
            Map<String, Object> result = new HashMap<>();
            result.put("success", response.getSuccess());
            result.put("message", response.getMessage());
            
            if (response.getSuccess() && response.hasOrder()) {
                result.put("order", mapOrderDetail(response.getOrder()));
            }
            
            if (response.getSuccess()) {
                log.info("Update order status successful - orderId: {}, status: {}", orderId, status);
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Update order status error: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to update order status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ============================================================================
    // HELPER MAPPING METHODS
    // ============================================================================

    private Map<String, Object> mapSellerProfile(SellerProfileResponse response) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", response.getId());
        profile.put("email", response.getEmail());
        profile.put("fullName", response.getFullName());
        profile.put("phone", response.getPhone());
        profile.put("address", response.getAddress());
        profile.put("positiveReviews", response.getPositiveReviews());
        profile.put("negativeReviews", response.getNegativeReviews());
        profile.put("ratingPercent", response.getRatingPercent());
        profile.put("createdAt", response.getCreatedAt());
        return profile;
    }

    private List<Map<String, Object>> mapProductList(List<ProductSummary> products) {
        List<Map<String, Object>> result = new ArrayList<>();
        products.forEach(product -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", product.getId());
            map.put("title", product.getTitle());
            map.put("currentPrice", product.getCurrentPrice());
            map.put("status", product.getStatus());
            map.put("viewsCount", product.getViewsCount());
            map.put("bidsCount", product.getBidsCount());
            map.put("endsAt", product.getEndsAt());
            map.put("primaryImageUrl", product.getPrimaryImageUrl());
            result.add(map);
        });
        return result;
    }

    private List<Map<String, Object>> mapTransactionList(List<Transaction> transactions) {
        List<Map<String, Object>> result = new ArrayList<>();
        transactions.forEach(transaction -> {
            Map<String, Object> map = new HashMap<>();
            map.put("orderId", transaction.getOrderId());
            map.put("productId", transaction.getProductId());
            map.put("productTitle", transaction.getProductTitle());
            map.put("buyerId", transaction.getBuyerId());
            map.put("buyerName", transaction.getBuyerName());
            map.put("amount", transaction.getAmount());
            map.put("status", transaction.getStatus());
            map.put("createdAt", transaction.getCreatedAt());
            map.put("updatedAt", transaction.getUpdatedAt());
            result.add(map);
        });
        return result;
    }

    private List<Map<String, Object>> mapReviewList(List<Review> reviews) {
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

    private Map<String, Object> mapProductDetails(ProductDetailsResponse response) {
        Map<String, Object> product = new HashMap<>();
        product.put("id", response.getId());
        product.put("title", response.getTitle());
        product.put("description", response.getDescription());
        product.put("categoryId", response.getCategoryId());
        product.put("startingPrice", response.getStartingPrice());
        product.put("currentPrice", response.getCurrentPrice());
        product.put("stepPrice", response.getStepPrice());
        product.put("buyNowPrice", response.getBuyNowPrice());
        product.put("startsAt", response.getStartsAt());
        product.put("endsAt", response.getEndsAt());
        product.put("isAutoExtend", response.getIsAutoExtend());
        product.put("autoExtendSeconds", response.getAutoExtendSeconds());
        product.put("status", response.getStatus());
        product.put("viewsCount", response.getViewsCount());
        product.put("bidsCount", response.getBidsCount());
        product.put("imageUrls", response.getImageUrlsList());
        product.put("highestBidderId", response.getHighestBidderId());
        product.put("highestBidAmount", response.getHighestBidAmount());
        product.put("createdAt", response.getCreatedAt());
        product.put("updatedAt", response.getUpdatedAt());
        return product;
    }

    private List<Map<String, Object>> mapListingDetailList(List<ListingDetail> listings) {
        List<Map<String, Object>> result = new ArrayList<>();
        listings.forEach(listing -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", listing.getId());
            map.put("title", listing.getTitle());
            map.put("status", listing.getStatus());
            map.put("currentPrice", listing.getCurrentPrice());
            map.put("bidsCount", listing.getBidsCount());
            map.put("endsAt", listing.getEndsAt());
            map.put("isAutoExtend", listing.getIsAutoExtend());
            map.put("autoExtendSeconds", listing.getAutoExtendSeconds());
            map.put("primaryImageUrl", listing.getPrimaryImageUrl());
            result.add(map);
        });
        return result;
    }

    private List<Map<String, Object>> mapOrderDetailList(List<OrderDetail> orders) {
        List<Map<String, Object>> result = new ArrayList<>();
        orders.forEach(order -> result.add(mapOrderDetail(order)));
        return result;
    }
    
    private Map<String, Object> mapOrderDetail(OrderDetail order) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", order.getId());
        map.put("productId", order.getProductId());
        map.put("productTitle", order.getProductTitle());
        map.put("buyerId", order.getBuyerId());
        map.put("buyerName", order.getBuyerName());
        map.put("amount", order.getAmount());
        map.put("status", order.getStatus());
        map.put("paymentMethod", order.getPaymentMethod());
        map.put("paymentStatus", order.getPaymentStatus());
        map.put("createdAt", order.getCreatedAt());
        map.put("updatedAt", order.getUpdatedAt());
        return map;
    }
    
    /**
     * Validate if the content type is a valid image format
     */
    private boolean isValidImageType(String contentType) {
        if (contentType == null || contentType.isEmpty()) {
            return false;
        }
        return contentType.equals("image/jpeg") || 
               contentType.equals("image/jpg") || 
               contentType.equals("image/png") || 
               contentType.equals("image/gif") || 
               contentType.equals("image/webp");
    }
}
