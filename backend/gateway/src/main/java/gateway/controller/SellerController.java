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

import com.auctionplatform.seller.grpc.AnswerQuestionRequest;
import com.auctionplatform.seller.grpc.AppendProductDescriptionRequest;
import com.auctionplatform.seller.grpc.ConfirmPaymentReceiptRequest;
import com.auctionplatform.seller.grpc.CreateAuctionListingRequest;
import com.auctionplatform.seller.grpc.GetActiveListingsRequest;
import com.auctionplatform.seller.grpc.GetListingsRequest;
import com.auctionplatform.seller.grpc.GetOrdersRequest;
import com.auctionplatform.seller.grpc.GetProductDetailsRequest;
import com.auctionplatform.seller.grpc.GetSellerProfileRequest;
import com.auctionplatform.seller.grpc.GetSellerRatingsRequest;
import com.auctionplatform.seller.grpc.GetTransactionHistoryRequest;
import com.auctionplatform.seller.grpc.GetWinnerItemsRequest;
import com.auctionplatform.seller.grpc.ListingDetail;
import com.auctionplatform.seller.grpc.OrderDetail;
import com.auctionplatform.seller.grpc.ProductDetailsResponse;
import com.auctionplatform.seller.grpc.ProductSummary;
import com.auctionplatform.seller.grpc.RejectBidderRequest;
import com.auctionplatform.seller.grpc.Review;
import com.auctionplatform.seller.grpc.SellerProfileResponse;
import com.auctionplatform.seller.grpc.Transaction;
import com.auctionplatform.seller.grpc.UpdateOrderStatusRequest;

import com.auction.dto.ApiResponse;
import com.auction.utils.ValidationUtils;
import gateway.grpc.SellerGrpcClient;
import gateway.grpc.RatingGrpcClient;
import com.auction.proto.rating.*;
import gateway.service.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;

@RestController
@RequestMapping("/api/seller")
@Tag(name = "Seller", description = "Seller user endpoints - requires authentication")
@SecurityRequirement(name = "bearerAuth")
public class SellerController {
    private static final Logger log = LoggerFactory.getLogger(SellerController.class);
    private static final String INVALID_FILTER = "Invalid filter. Must be: active, expired, or all";
    private static final String INVALID_STATUS_FILTER = "Invalid status filter. Must be: pending, completed, cancelled, or all";
    private static final String INVALID_TRANSACTION_FILTER = "Invalid filter. Must be: completed, pending, or cancelled";
    private static final String TITLE_REQUIRED = "Title is required";
    private static final String DESCRIPTION_REQUIRED = "Description is required";
    private static final String ANSWER_REQUIRED = "Answer is required";
    private static final String REASON_REQUIRED = "Reason is required";

    private final SellerGrpcClient sellerGrpcClient;
    private final RatingGrpcClient ratingGrpcClient;
    private final CloudinaryService cloudinaryService;

    public SellerController(SellerGrpcClient sellerGrpcClient, RatingGrpcClient ratingGrpcClient, CloudinaryService cloudinaryService) {
        this.sellerGrpcClient = sellerGrpcClient;
        this.ratingGrpcClient = ratingGrpcClient;
        this.cloudinaryService = cloudinaryService;
    }

    private int getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Integer.parseInt(authentication.getName());
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> badRequestResponse(String message) {
        log.warn("Bad request: {}", message);
        return ResponseEntity.badRequest().body(ApiResponse.badRequest(message));
    }

    // ============================================================================
    // DASHBOARD / PROFILE ENDPOINTS
    // ============================================================================

    @GetMapping("/profile")
    @Operation(summary = "Get seller profile", description = "Get seller profile information. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSellerProfile() {
        int sellerId = getUserId();
        log.info("Get seller profile request [sellerId={}]", sellerId);

        try {
            GetSellerProfileRequest grpcRequest = GetSellerProfileRequest.newBuilder()
                    .setSellerId(sellerId)
                    .build();

            var response = sellerGrpcClient.getSellerProfile(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch profile"));
            }

            Map<String, Object> profileData = new HashMap<>();
            profileData.put("profile", mapSellerProfile(response));

            log.info("Get seller profile successful [sellerId={}]", sellerId);
            return ResponseEntity.ok(ApiResponse.ok(profileData));
        } catch (Exception e) {
            log.error("Get seller profile error [sellerId={}]: {}", sellerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch profile: " + e.getMessage()));
        }
    }

    @GetMapping("/active-listings")
    @Operation(summary = "Get active listings", description = "Get seller's active product listings. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getActiveListings(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") @Positive(message = "PageSize must be greater than 0") @Max(value = 100, message = "PageSize must not exceed 100") int pageSize) {

        int sellerId = getUserId();
        log.info("Get active listings request [sellerId={}] - page: {}, pageSize: {}", sellerId, page, pageSize);

        try {
            GetActiveListingsRequest grpcRequest = GetActiveListingsRequest.newBuilder()
                    .setSellerId(sellerId)
                    .setPage(page)
                    .setPageSize(pageSize)
                    .build();

            var response = sellerGrpcClient.getActiveListings(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch listings"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("products", mapProductList(response.getProductsList()));
            result.put("totalCount", response.getTotalCount());
            result.put("page", response.getPage());
            result.put("pageSize", response.getPageSize());

            log.info("Get active listings successful [sellerId={}, count={}]", sellerId, response.getProductsCount());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get active listings error [sellerId={}]: {}", sellerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch listings: " + e.getMessage()));
        }
    }

    @GetMapping("/winner-items")
    @Operation(summary = "Get winner items", description = "Get products where winner has been determined. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWinnerItems(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") @Positive(message = "PageSize must be greater than 0") @Max(value = 100, message = "PageSize must not exceed 100") int pageSize) {

        int sellerId = getUserId();
        log.info("Get winner items request [sellerId={}] - page: {}, pageSize: {}", sellerId, page, pageSize);

        try {
            GetWinnerItemsRequest grpcRequest = GetWinnerItemsRequest.newBuilder()
                    .setSellerId(sellerId)
                    .setPage(page)
                    .setPageSize(pageSize)
                    .build();

            var response = sellerGrpcClient.getWinnerItems(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch winner items"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("products", mapProductList(response.getProductsList()));
            result.put("totalCount", response.getTotalCount());
            result.put("page", response.getPage());
            result.put("pageSize", response.getPageSize());

            log.info("Get winner items successful [sellerId={}, count={}]", sellerId, response.getProductsCount());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get winner items error [sellerId={}]: {}", sellerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch winner items: " + e.getMessage()));
        }
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get transaction history", description = "Get seller's transaction history. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTransactionHistory(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") @Positive(message = "PageSize must be greater than 0") @Max(value = 100, message = "PageSize must not exceed 100") int pageSize,
            @Parameter(description = "Status filter (completed, pending, cancelled)")
            @RequestParam(defaultValue = "") String filter) {

        int sellerId = getUserId();
        log.info("Get transaction history request [sellerId={}] - page: {}, pageSize: {}, filter: {}",
                sellerId, page, pageSize, filter);

        // Validate filter if provided
        if (!filter.isEmpty() && !filter.matches("^(completed|pending|cancelled)$")) {
            log.warn("Invalid filter value: {} [sellerId={}]", filter, sellerId);
            return badRequestResponse(INVALID_TRANSACTION_FILTER);
        }

        try {
            GetTransactionHistoryRequest grpcRequest = GetTransactionHistoryRequest.newBuilder()
                    .setSellerId(sellerId)
                    .setPage(page)
                    .setPageSize(pageSize)
                    .setFilter(filter)
                    .build();

            var response = sellerGrpcClient.getTransactionHistory(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch transactions"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("transactions", mapTransactionList(response.getTransactionsList()));
            result.put("totalCount", response.getTotalCount());
            result.put("page", response.getPage());
            result.put("pageSize", response.getPageSize());

            log.info("Get transaction history successful [sellerId={}, count={}]", sellerId, response.getTransactionsCount());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get transaction history error [sellerId={}]: {}", sellerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch transactions: " + e.getMessage()));
        }
    }

    @GetMapping("/ratings")
    @Operation(summary = "Get seller ratings", description = "Get seller's ratings and reviews. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSellerRatings(
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") @Positive(message = "PageSize must be greater than 0") @Max(value = 100, message = "PageSize must not exceed 100") int pageSize) {

        int sellerId = getUserId();
        log.info("Get seller ratings request [sellerId={}] - page: {}, pageSize: {}", sellerId, page, pageSize);

        try {
            GetSellerRatingsRequest grpcRequest = GetSellerRatingsRequest.newBuilder()
                    .setSellerId(sellerId)
                    .setPage(page)
                    .setPageSize(pageSize)
                    .build();

            var response = sellerGrpcClient.getSellerRatings(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch ratings"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("positiveReviews", response.getPositiveReviews());
            result.put("negativeReviews", response.getNegativeReviews());
            result.put("reviews", mapReviewList(response.getReviewsList()));
            result.put("totalCount", response.getTotalCount());

            log.info("Get seller ratings successful [sellerId={}, count={}]", sellerId, response.getReviewsCount());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get seller ratings error [sellerId={}]: {}", sellerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch ratings: " + e.getMessage()));
        }
    }

    // ============================================================================
    // CREATE AUCTION LISTING
    // ============================================================================

    @PostMapping(value = "/listings", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create auction listing", description = "Create a new auction listing with up to 4 images. Requires authentication. Date format: yyyy-MM-dd'T'HH:mm:ss")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createAuctionListing(
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

        log.info("Create auction listing request [sellerId={}] - title: {}", sellerId, title);

        try {
            // Validate title
            if (title == null || title.trim().isEmpty()) {
                log.warn("Title is empty [sellerId={}]", sellerId);
                return badRequestResponse(TITLE_REQUIRED);
            }
            if (title.trim().length() > 255) {
                log.warn("Title exceeds max length [sellerId={}]", sellerId);
                return badRequestResponse("Title must not exceed 255 characters");
            }

            // Validate description
            if (description == null || description.trim().isEmpty()) {
                log.warn("Description is empty [sellerId={}]", sellerId);
                return badRequestResponse(DESCRIPTION_REQUIRED);
            }
            if (description.trim().length() > 5000) {
                log.warn("Description exceeds max length [sellerId={}]", sellerId);
                return badRequestResponse("Description must not exceed 5000 characters");
            }

            // Parse and validate categoryId
            int categoryId;
            try {
                categoryId = Integer.parseInt(categoryIdStr);
                if (categoryId <= 0) {
                    return badRequestResponse("Category ID must be greater than 0");
                }
            } catch (NumberFormatException e) {
                return badRequestResponse("Invalid category ID format");
            }

            // Parse and validate startingPrice
            float startingPrice;
            try {
                startingPrice = Float.parseFloat(startingPriceStr);
                if (startingPrice <= 0) {
                    return badRequestResponse("Starting price must be greater than 0");
                }
            } catch (NumberFormatException e) {
                return badRequestResponse("Invalid starting price format");
            }

            // Parse and validate stepPrice
            float stepPrice;
            try {
                stepPrice = Float.parseFloat(stepPriceStr);
                if (stepPrice <= 0) {
                    return badRequestResponse("Step price must be greater than 0");
                }
            } catch (NumberFormatException e) {
                return badRequestResponse("Invalid step price format");
            }

            // Parse and validate dates
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
            LocalDateTime startsAt;
            LocalDateTime endsAt;
            try {
                startsAt = LocalDateTime.parse(startsAtStr, formatter);
                endsAt = LocalDateTime.parse(endsAtStr, formatter);
            } catch (java.time.format.DateTimeParseException e) {
                return badRequestResponse("Invalid date format. Expected format: yyyy-MM-dd'T'HH:mm:ss");
            }

            // Validate date logic
            if (endsAt.isBefore(startsAt) || endsAt.isEqual(startsAt)) {
                return badRequestResponse("End date must be after start date");
            }

            // Parse and validate optional buyNowPrice
            Float buyNowPrice = null;
            if (buyNowPriceStr != null && !buyNowPriceStr.isEmpty()) {
                try {
                    buyNowPrice = Float.parseFloat(buyNowPriceStr);
                    if (buyNowPrice <= startingPrice) {
                        return badRequestResponse("Buy now price must be greater than starting price");
                    }
                } catch (NumberFormatException e) {
                    return badRequestResponse("Invalid buy now price format");
                }
            }

            // Parse optional autoExtendSeconds
            Integer autoExtendSeconds = null;
            if (autoExtendSecondsStr != null && !autoExtendSecondsStr.isEmpty()) {
                try {
                    autoExtendSeconds = Integer.parseInt(autoExtendSecondsStr);
                    if (autoExtendSeconds < 0) {
                        return badRequestResponse("Auto extend seconds must be >= 0");
                    }
                } catch (NumberFormatException e) {
                    return badRequestResponse("Invalid auto extend seconds format");
                }
            }

            Boolean isAutoExtend = (isAutoExtendStr != null && !isAutoExtendStr.isEmpty()) 
                ? Boolean.parseBoolean(isAutoExtendStr) : null;
            
            log.info("Create auction listing request - sellerId: {}, startsAt: {}, endsAt: {}", sellerId, startsAt, endsAt);

            // Upload images to Cloudinary (max 4) - blocking
            List<String> imageUrls = new ArrayList<>();
            log.info("Checking images parameter - is null: {}", images == null);
            
            if (images != null && !images.isEmpty()) {
                log.info("Images list size: {}", images.size());
                
                // Validate max 4 images
                if (images.size() > 4) {
                    return badRequestResponse("Maximum 4 images allowed. You provided " + images.size());
                }
                
                // Validate each image file
                final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
                for (MultipartFile file : images) {
                    // Validate file type
                    String contentType = file.getContentType();
                    if (!isValidImageType(contentType)) {
                        return badRequestResponse("Invalid file type: " + file.getOriginalFilename() + ". Only JPG, JPEG, PNG, GIF, WEBP are allowed.");
                    }
                    
                    // Validate file size
                    if (file.getSize() > MAX_FILE_SIZE) {
                        return badRequestResponse("File " + file.getOriginalFilename() + " exceeds 10MB limit. Size: " + 
                            (file.getSize() / (1024.0 * 1024.0)) + "MB");
                    }
                    
                    // Validate file not empty
                    if (file.isEmpty()) {
                        return badRequestResponse("File " + file.getOriginalFilename() + " is empty");
                    }
                }
                
                log.info("Uploading {} images to Cloudinary", images.size());
                imageUrls = cloudinaryService.uploadMultipleServlet(images, "products");
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

            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to create listing"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("productId", response.getProductId());
            result.put("imageUrls", imageUrls);
            result.put("message", response.getMessage());

            if (response.getSuccess()) {
                log.info("Create auction listing successful [sellerId={}, productId={}]", sellerId, response.getProductId());
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Create auction listing failed [sellerId={}, message={}]", sellerId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (NumberFormatException e) {
            log.error("Invalid number format in parameters [sellerId={}]: {}", sellerId, e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.badRequest("Invalid number format: " + e.getMessage()));
        } catch (java.time.format.DateTimeParseException e) {
            log.error("Invalid date format [sellerId={}]: {}", sellerId, e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.badRequest("Invalid date format. Expected format: yyyy-MM-dd'T'HH:mm:ss"));
        } catch (Exception e) {
            log.error("Create auction listing error [sellerId={}]: {}", sellerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to create listing: " + e.getMessage()));
        }
    }

    // ============================================================================
    // PRODUCT DETAIL (OWNER VIEW)
    // ============================================================================

    @GetMapping("/products/{productId}")
    @Operation(summary = "Get product details (owner view)", description = "Get detailed product information for seller. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductDetails(
            @Parameter(description = "Product ID", required = true)
            @PathVariable @Positive(message = "Product ID must be greater than 0") int productId) {

        int sellerId = getUserId();
        log.info("Get product details request [sellerId={}] - productId: {}", sellerId, productId);

        try {
            GetProductDetailsRequest grpcRequest = GetProductDetailsRequest.newBuilder()
                    .setProductId(productId)
                    .setSellerId(sellerId)
                    .build();

            var response = sellerGrpcClient.getProductDetails(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch product"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("product", mapProductDetails(response));

            log.info("Get product details successful [sellerId={}, productId={}]", sellerId, productId);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get product details error [sellerId={}, productId={}]: {}", sellerId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch product: " + e.getMessage()));
        }
    }

    @PostMapping("/products/{productId}/questions/{questionId}/answer")
    @Operation(summary = "Answer question", description = "Answer a question about a product. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> answerQuestion(
            @Parameter(description = "Product ID", required = true)
            @PathVariable @Positive(message = "Product ID must be greater than 0") int productId,
            @Parameter(description = "Question ID", required = true)
            @PathVariable @Positive(message = "Question ID must be greater than 0") int questionId,
            @RequestBody com.auction.entities.dto.AnswerQuestionRequest requestBody) {

        int sellerId = getUserId();
        String answer = requestBody.getAnswer();

        log.info("Answer question request [sellerId={}] - questionId: {}, productId: {}", sellerId, questionId, productId);

        // Validate answer
        if (answer == null || answer.trim().isEmpty()) {
            log.warn("Answer is empty [sellerId={}]", sellerId);
            return badRequestResponse(ANSWER_REQUIRED);
        }
        if (answer.trim().length() > 5000) {
            log.warn("Answer exceeds max length [sellerId={}]", sellerId);
            return badRequestResponse("Answer must not exceed 5000 characters");
        }

        try {
            AnswerQuestionRequest grpcRequest = AnswerQuestionRequest.newBuilder()
                    .setSellerId(sellerId)
                    .setQuestionId(questionId)
                    .setAnswer(answer)
                    .build();

            var response = sellerGrpcClient.answerQuestion(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to answer question"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("message", response.getMessage());

            if (response.getSuccess()) {
                log.info("Answer question successful [sellerId={}, questionId={}]", sellerId, questionId);
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Answer question failed [sellerId={}, questionId={}, message={}]", sellerId, questionId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Answer question error [sellerId={}, questionId={}]: {}", sellerId, questionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to answer question: " + e.getMessage()));
        }
    }

    @PostMapping("/products/{productId}/reject-bidder")
    @Operation(summary = "Reject bidder", description = "Reject a bidder from participating in the auction. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejectBidder(
            @Parameter(description = "Product ID", required = true)
            @PathVariable @Positive(message = "Product ID must be greater than 0") int productId,
            @RequestBody com.auction.entities.dto.RejectBidderRequest requestBody) {

        int sellerId = getUserId();
        int bidderId = requestBody.getBidderId();
        String reason = requestBody.getReason();

        log.info("Reject bidder request [sellerId={}] - productId: {}, bidderId: {}", sellerId, productId, bidderId);

        // Validate bidderId
        if (bidderId <= 0) {
            log.warn("Invalid bidderId: {} [sellerId={}]", bidderId, sellerId);
            return badRequestResponse("Bidder ID must be greater than 0");
        }

        // Validate reason
        if (reason == null || reason.trim().isEmpty()) {
            log.warn("Reason is empty [sellerId={}]", sellerId);
            return badRequestResponse(REASON_REQUIRED);
        }
        if (reason.trim().length() > 500) {
            log.warn("Reason exceeds max length [sellerId={}]", sellerId);
            return badRequestResponse("Reason must not exceed 500 characters");
        }

        try {
            RejectBidderRequest grpcRequest = RejectBidderRequest.newBuilder()
                    .setSellerId(sellerId)
                    .setProductId(productId)
                    .setBidderId(bidderId)
                    .setReason(reason)
                    .build();

            var response = sellerGrpcClient.rejectBidder(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to reject bidder"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("message", response.getMessage());

            if (response.getSuccess()) {
                log.info("Reject bidder successful [sellerId={}, productId={}, bidderId={}]", sellerId, productId, bidderId);
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Reject bidder failed [sellerId={}, bidderId={}, message={}]", sellerId, bidderId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Reject bidder error [sellerId={}, bidderId={}]: {}", sellerId, bidderId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to reject bidder: " + e.getMessage()));
        }
    }

    @PutMapping("/products/{productId}/description")
    @Operation(summary = "Append product description", description = "Append additional description to a product. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> appendProductDescription(
            @Parameter(description = "Product ID", required = true)
            @PathVariable @Positive(message = "Product ID must be greater than 0") int productId,
            @RequestBody com.auction.entities.dto.AppendProductDescriptionRequest requestBody) {

        int sellerId = getUserId();
        String additionalDescription = requestBody.getAdditionalDescription();

        log.info("Append product description request [sellerId={}] - productId: {}", sellerId, productId);

        // Validate additional description
        if (additionalDescription == null || additionalDescription.trim().isEmpty()) {
            log.warn("Additional description is empty [sellerId={}]", sellerId);
            return badRequestResponse(DESCRIPTION_REQUIRED);
        }
        if (additionalDescription.trim().length() > 5000) {
            log.warn("Additional description exceeds max length [sellerId={}]", sellerId);
            return badRequestResponse("Additional description must not exceed 5000 characters");
        }

        try {
            AppendProductDescriptionRequest grpcRequest = AppendProductDescriptionRequest.newBuilder()
                    .setSellerId(sellerId)
                    .setProductId(productId)
                    .setAdditionalDescription(additionalDescription)
                    .build();

            var response = sellerGrpcClient.appendProductDescription(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to append description"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("message", response.getMessage());
            result.put("updatedDescription", response.getUpdatedDescription());

            if (response.getSuccess()) {
                log.info("Append product description successful [sellerId={}, productId={}]", sellerId, productId);
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Append product description failed [sellerId={}, productId={}, message={}]", sellerId, productId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Append product description error [sellerId={}, productId={}]: {}", sellerId, productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to append description: " + e.getMessage()));
        }
    }

    @PostMapping("/bidders/{bidderId}/rate")
    @Operation(summary = "Rate bidder", description = "Rate a bidder after transaction. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rateBidder(
            @Parameter(description = "Bidder ID", required = true)
            @PathVariable @Positive(message = "Bidder ID must be greater than 0") int bidderId,
            @RequestBody com.auction.entities.dto.RateBidderRequest requestBody) {

        int sellerId = getUserId();
        Integer orderId = requestBody.getOrderId();
        Integer productId = requestBody.getProductId();
        boolean like = requestBody.getLike();
        String comment = requestBody.getComment();

        log.info("Rate bidder request [sellerId={}] - bidderId: {}, productId: {}", sellerId, bidderId, productId);

        // Validate orderId
        if (orderId != null && orderId <= 0) {
            log.warn("Invalid orderId: {} [sellerId={}]", orderId, sellerId);
            return badRequestResponse("Order ID must be greater than 0");
        }

        // Validate productId
        if (productId == null || productId <= 0) {
            log.warn("Invalid or missing productId [sellerId={}]", sellerId);
            return badRequestResponse("Product ID is required and must be greater than 0");
        }

        // Validate comment
        if (comment != null && comment.trim().length() > 1000) {
            log.warn("Comment exceeds max length [sellerId={}]", sellerId);
            return badRequestResponse("Comment must not exceed 1000 characters");
        }

        try {
            AddUserRatingRequest grpcRequest = AddUserRatingRequest.newBuilder()
                    .setFromUserId(sellerId)
                    .setToUserId(bidderId)
                    .setProductId(productId)
                    .setLike(like)
                    .setComment(comment != null ? comment : "")
                    .build();

            var response = ratingGrpcClient.addUserRating(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to rate bidder"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("message", response.getMessage());
            result.put("reviewId", response.getReviewId());

            if (response.getSuccess()) {
                log.info("Rate bidder successful [sellerId={}, bidderId={}, reviewId={}]", sellerId, bidderId, response.getReviewId());
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Rate bidder failed [sellerId={}, bidderId={}, message={}]", sellerId, bidderId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Rate bidder error [sellerId={}, bidderId={}]: {}", sellerId, bidderId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to rate bidder: " + e.getMessage()));
        }
    }

    // ============================================================================
    // LISTINGS MANAGEMENT
    // ============================================================================

    @GetMapping("/listings")
    @Operation(summary = "Get listings", description = "Get seller's product listings with filter. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getListings(
            @Parameter(description = "Status filter (active, expired, all)")
            @RequestParam(defaultValue = "all") String filter,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") @Positive(message = "Page size must be greater than 0") @Max(value = 100, message = "Page size must not exceed 100") int pageSize) {

        int sellerId = getUserId();

        log.info("Get listings request [sellerId={}] - filter: {}, page: {}, pageSize: {}",
                sellerId, filter, page, pageSize);

        // Validate filter
        if (!filter.isEmpty() && !filter.matches("^(active|expired|all)$")) {
            log.warn("Invalid filter value: {} [sellerId={}]", filter, sellerId);
            return badRequestResponse(INVALID_FILTER);
        }

        try {
            GetListingsRequest grpcRequest = GetListingsRequest.newBuilder()
                    .setSellerId(sellerId)
                    .setFilter(filter)
                    .setPage(page)
                    .setPageSize(pageSize)
                    .build();

            var response = sellerGrpcClient.getListings(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch listings"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("listings", mapListingDetailList(response.getListingsList()));
            result.put("totalCount", response.getTotalCount());
            result.put("page", response.getPage());
            result.put("pageSize", response.getPageSize());

            log.info("Get listings successful [sellerId={}, count={}]", sellerId, response.getListingsCount());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get listings error [sellerId={}]: {}", sellerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch listings: " + e.getMessage()));
        }
    }

    // ============================================================================
    // ORDER MANAGEMENT
    // ============================================================================

    @GetMapping("/orders")
    @Operation(summary = "Get orders", description = "Get seller's orders with status filter. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrders(
            @Parameter(description = "Status filter (pending, completed, cancelled, all)")
            @RequestParam(defaultValue = "all") String statusFilter,
            @Parameter(description = "Page number (1-based)")
            @RequestParam(defaultValue = "1") @Positive(message = "Page must be greater than 0") int page,
            @Parameter(description = "Number of items per page")
            @RequestParam(defaultValue = "20") @Positive(message = "Page size must be greater than 0") @Max(value = 100, message = "Page size must not exceed 100") int pageSize) {

        int sellerId = getUserId();

        log.info("Get orders request [sellerId={}] - statusFilter: {}, page: {}, pageSize: {}",
                sellerId, statusFilter, page, pageSize);

        // Validate statusFilter
        if (!statusFilter.isEmpty() && !statusFilter.matches("^(pending|completed|cancelled|all)$")) {
            log.warn("Invalid status filter value: {} [sellerId={}]", statusFilter, sellerId);
            return badRequestResponse(INVALID_STATUS_FILTER);
        }

        try {
            GetOrdersRequest grpcRequest = GetOrdersRequest.newBuilder()
                    .setSellerId(sellerId)
                    .setStatusFilter(statusFilter)
                    .setPage(page)
                    .setPageSize(pageSize)
                    .build();

            var response = sellerGrpcClient.getOrders(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to fetch orders"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("orders", mapOrderDetailList(response.getOrdersList()));
            result.put("totalCount", response.getTotalCount());
            result.put("page", response.getPage());
            result.put("pageSize", response.getPageSize());

            log.info("Get orders successful [sellerId={}, count={}]", sellerId, response.getOrdersCount());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Get orders error [sellerId={}]: {}", sellerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to fetch orders: " + e.getMessage()));
        }
    }

    @PostMapping("/orders/{orderId}/confirm-payment")
    @Operation(summary = "Confirm payment receipt", description = "Confirm payment receipt for an order. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmPaymentReceipt(
            @Parameter(description = "Order ID", required = true)
            @PathVariable @Positive(message = "Order ID must be greater than 0") int orderId,
            @RequestBody ConfirmPaymentReceiptRequest requestBody) {

        int sellerId = getUserId();
        String invoiceNumber = requestBody.getInvoiceNumber();
        String paymentConfirmationNotes = requestBody.getPaymentConfirmationNotes();

        log.info("Confirm payment receipt request [sellerId={}] - orderId: {}", sellerId, orderId);

        // Validate invoiceNumber
        if (invoiceNumber.trim().length() > 100) {
            log.warn("Invoice number exceeds max length [sellerId={}]", sellerId);
            return badRequestResponse("Invoice number must not exceed 100 characters");
        }

        // Validate paymentConfirmationNotes
        if (paymentConfirmationNotes.trim().length() > 1000) {
            log.warn("Payment confirmation notes exceed max length [sellerId={}]", sellerId);
            return badRequestResponse("Payment confirmation notes must not exceed 1000 characters");
        }

        try {
            ConfirmPaymentReceiptRequest grpcRequest = ConfirmPaymentReceiptRequest.newBuilder()
                    .setSellerId(sellerId)
                    .setOrderId(orderId)
                    .setInvoiceNumber(invoiceNumber)
                    .setPaymentConfirmationNotes(paymentConfirmationNotes)
                    .build();

            var response = sellerGrpcClient.confirmPaymentReceipt(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to confirm payment"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("message", response.getMessage());

            if (response.getSuccess()) {
                log.info("Confirm payment receipt successful [sellerId={}, orderId={}]", sellerId, orderId);
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Confirm payment receipt failed [sellerId={}, orderId={}, message={}]", sellerId, orderId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Confirm payment receipt error [sellerId={}, orderId={}]: {}", sellerId, orderId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to confirm payment: " + e.getMessage()));
        }
    }
    
    @PatchMapping("/orders/{orderId}/status")
    @Operation(summary = "Update order status", description = "Update the status of an order. Only the seller who owns the product can update. Requires authentication.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateOrderStatus(
            @Parameter(description = "Order ID", required = true)
            @PathVariable @Positive(message = "Order ID must be greater than 0") int orderId,
            @RequestBody Map<String, Object> requestBody) {

        int sellerId = getUserId();
        String status = (String) requestBody.get("status");

        log.info("Update order status request [sellerId={}] - orderId: {}, status: {}", sellerId, orderId, status);

        if (status == null || status.trim().isEmpty()) {
            log.warn("Status is missing [sellerId={}]", sellerId);
            return badRequestResponse("Status is required");
        }

        // Normalize status to lowercase to match database expectations
        String normalizedStatus = status.trim().toLowerCase();

        // Validate status before sending to service
        List<String> validStatuses = List.of("pending", "processing", "shipped", "delivered", "cancelled");
        if (!validStatuses.contains(normalizedStatus)) {
            log.warn("Invalid status: {} [sellerId={}]", status, sellerId);
            return badRequestResponse("Invalid status. Valid values: " + validStatuses);
        }

        try {
            UpdateOrderStatusRequest grpcRequest = UpdateOrderStatusRequest.newBuilder()
                .setSellerId(sellerId)
                .setOrderId(orderId)
                .setStatus(normalizedStatus)
                .build();

            var response = sellerGrpcClient.updateOrderStatus(grpcRequest).block();
            if (response == null) {
                log.error("gRPC response is null [sellerId={}]", sellerId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.internalServerError("Failed to update order status"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("message", response.getMessage());

            if (response.getSuccess() && response.hasOrder()) {
                result.put("order", mapOrderDetail(response.getOrder()));
            }

            if (response.getSuccess()) {
                log.info("Update order status successful [sellerId={}, orderId={}, status={}]", sellerId, orderId, normalizedStatus);
                return ResponseEntity.ok(ApiResponse.ok(result));
            } else {
                log.warn("Update order status failed [sellerId={}, orderId={}, message={}]", sellerId, orderId, response.getMessage());
                return ResponseEntity.badRequest().body(ApiResponse.badRequest(response.getMessage()));
            }
        } catch (Exception e) {
            log.error("Update order status error [sellerId={}, orderId={}]: {}", sellerId, orderId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.internalServerError("Failed to update order status: " + e.getMessage()));
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
