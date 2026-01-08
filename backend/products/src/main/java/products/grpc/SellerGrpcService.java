package products.grpc;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.grpc.server.service.GrpcService;

import com.auction.utils.JsonUtils;
import com.auctionplatform.seller.grpc.*;

import products.service.SellerService;
import products.service.SellerService.CreateListingRequest;
import reactor.core.publisher.Mono;

/**
 * gRPC implementation of SellerService
 * Gateway will call this service for seller-related functionality
 */
@GrpcService
public class SellerGrpcService extends ReactorSellerServiceGrpc.SellerServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(SellerGrpcService.class);
    private final SellerService sellerService;

    public SellerGrpcService(SellerService sellerService) {
        this.sellerService = sellerService;
    }

    // ============================================================================
    // DASHBOARD / PROFILE ENDPOINTS
    // ============================================================================

    @Override
    public Mono<SellerProfileResponse> getSellerProfile(Mono<GetSellerProfileRequest> request) {
        return request.doOnNext(req -> log.info("Get seller profile request: {}", JsonUtils.toJson(req)))
            .map(req -> {
                // TODO: Implement profile fetching from user service
                // For now, return empty response
                return SellerProfileResponse.newBuilder()
                    .setId(req.getSellerId())
                    .setEmail("")
                    .setFullName("")
                    .build();
            })
            .doOnNext(resp -> log.info("Get seller profile response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Get seller profile error: {}", e.getMessage(), e);
                return Mono.just(SellerProfileResponse.newBuilder().build());
            });
    }

    @Override
    public Mono<ProductListResponse> getActiveListings(Mono<GetActiveListingsRequest> request) {
        return request.doOnNext(req -> log.info("Get active listings request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                sellerService.getActiveListings(req.getSellerId(), req.getPage(), req.getPageSize())
                    .map(result -> ProductListResponse.newBuilder()
                        .addAllProducts(result.products())
                        .setTotalCount(result.totalCount())
                        .setPage(result.page())
                        .setPageSize(result.pageSize())
                        .build())
            )
            .doOnNext(resp -> log.info("Get active listings response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Get active listings error: {}", e.getMessage(), e);
                return Mono.just(ProductListResponse.newBuilder().build());
            });
    }

    @Override
    public Mono<ProductListResponse> getWinnerItems(Mono<GetWinnerItemsRequest> request) {
        return request.doOnNext(req -> log.info("Get winner items request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                sellerService.getWinnerItems(req.getSellerId(), req.getPage(), req.getPageSize())
                    .map(result -> ProductListResponse.newBuilder()
                        .addAllProducts(result.products())
                        .setTotalCount(result.totalCount())
                        .setPage(result.page())
                        .setPageSize(result.pageSize())
                        .build())
            )
            .doOnNext(resp -> log.info("Get winner items response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Get winner items error: {}", e.getMessage(), e);
                return Mono.just(ProductListResponse.newBuilder().build());
            });
    }

    @Override
    public Mono<TransactionHistoryResponse> getTransactionHistory(Mono<GetTransactionHistoryRequest> request) {
        return request.doOnNext(req -> log.info("Get transaction history request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                sellerService.getOrders(
                    req.getSellerId(),
                    "all",  // Get all orders regardless of status
                    req.getPage(),
                    req.getPageSize()
                )
                .map(result -> TransactionHistoryResponse.newBuilder()
                    .addAllTransactions(result.orders())
                    .setTotalCount(result.totalCount())
                    .setPage(result.page())
                    .setPageSize(result.pageSize())
                    .build())
            )
            .doOnNext(resp -> log.info("Get transaction history response: transactionsCount={}, totalCount={}, page={}, pageSize={}", 
                resp.getTransactionsCount(), resp.getTotalCount(), resp.getPage(), resp.getPageSize()))
            .onErrorResume(e -> {
                log.error("Get transaction history error: {}", e.getMessage(), e);
                return Mono.just(TransactionHistoryResponse.newBuilder()
                    .setTotalCount(0)
                    .setPage(request.block().getPage())
                    .setPageSize(request.block().getPageSize())
                    .build());
            });
    }

    @Override
    public Mono<RatingsResponse> getSellerRatings(Mono<GetSellerRatingsRequest> request) {
        return request.doOnNext(req -> log.info("Get seller ratings request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                sellerService.getSellerRatings(req.getSellerId(), req.getPage(), req.getPageSize())
                    .map(result -> RatingsResponse.newBuilder()
                        .setPositiveReviews(result.positiveReviews())
                        .setNegativeReviews(result.negativeReviews())
                        .setRatingPercent(result.ratingPercent())
                        .addAllReviews(result.reviews())
                        .setTotalCount(result.totalCount())
                        .build())
            )
            .doOnNext(resp -> log.info("Get seller ratings response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Get seller ratings error: {}", e.getMessage(), e);
                return Mono.just(RatingsResponse.newBuilder().build());
            });
    }

    // ============================================================================
    // CREATE AUCTION LISTING
    // ============================================================================

    @Override
    public Mono<CreateAuctionListingResponse> createAuctionListing(Mono<CreateAuctionListingRequest> request) {
        return request.doOnNext(req -> log.info("Create auction listing request: {}", JsonUtils.toJson(req)))
            .flatMap(req -> {
                try {
                    LocalDateTime startsAt = parseTimestamp(req.getStartsAt());
                    LocalDateTime endsAt = parseTimestamp(req.getEndsAt());
                    
                    CreateListingRequest listingReq = new CreateListingRequest(
                        req.getSellerId(),
                        req.getTitle(),
                        req.getDescription(),
                        req.getCategoryId(),
                        req.getStartingPrice(),
                        req.getStepPrice(),
                        req.getBuyNowPrice(),
                        startsAt,
                        endsAt,
                        req.getIsAutoExtend(),
                        req.getAutoExtendSeconds(),
                        req.getImageUrlsList()
                    );
                    
                    return sellerService.createAuctionListing(listingReq)
                        .map(result -> CreateAuctionListingResponse.newBuilder()
                            .setSuccess(true)
                            .setProductId(result.productId())
                            .setMessage(result.message())
                            .build());
                } catch (Exception e) {
                    log.error("Error parsing listing request: {}", e.getMessage(), e);
                    return Mono.just(CreateAuctionListingResponse.newBuilder()
                        .setSuccess(false)
                        .setMessage("Invalid request: " + e.getMessage())
                        .build());
                }
            })
            .doOnNext(resp -> log.info("Create auction listing response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Create auction listing error: {}", e.getMessage(), e);
                return Mono.just(CreateAuctionListingResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Failed to create listing: " + e.getMessage())
                    .build());
            });
    }

    // ============================================================================
    // PRODUCT DETAIL (OWNER VIEW)
    // ============================================================================

    @Override
    public Mono<ProductDetailsResponse> getProductDetails(Mono<GetProductDetailsRequest> request) {
        return request.doOnNext(req -> log.info("Get product details request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                sellerService.getProductDetails(req.getProductId(), req.getSellerId())
            )
            .doOnNext(resp -> log.info("Get product details response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Get product details error: {}", e.getMessage(), e);
                return Mono.just(ProductDetailsResponse.newBuilder().build());
            });
    }

    @Override
    public Mono<AnswerQuestionResponse> answerQuestion(Mono<AnswerQuestionRequest> request) {
        return request.doOnNext(req -> log.info("Answer question request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                sellerService.answerQuestion(
                    req.getQuestionId(),
                    req.getSellerId(),
                    req.getAnswer()
                )
                .map(result -> AnswerQuestionResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Question answered successfully")
                    .build())
            )
            .doOnNext(resp -> log.info("Answer question response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Answer question error: {}", e.getMessage(), e);
                return Mono.just(AnswerQuestionResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Failed to answer question: " + e.getMessage())
                    .build());
            });
    }

    @Override
    public Mono<RejectBidderResponse> rejectBidder(Mono<RejectBidderRequest> request) {
        return request.doOnNext(req -> log.info("Reject bidder request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                sellerService.rejectBidder(
                    req.getProductId(),
                    req.getSellerId(),
                    req.getBidderId(),
                    req.getReason()
                )
                .map(result -> RejectBidderResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage(result)
                    .build())
            )
            .doOnNext(resp -> log.info("Reject bidder response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Reject bidder error: {}", e.getMessage(), e);
                return Mono.just(RejectBidderResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Failed to reject bidder: " + e.getMessage())
                    .build());
            });
    }

    @Override
    public Mono<AppendProductDescriptionResponse> appendProductDescription(Mono<AppendProductDescriptionRequest> request) {
        return request.doOnNext(req -> log.info("Append product description request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                sellerService.appendProductDescription(
                    req.getProductId(),
                    req.getSellerId(),
                    req.getAdditionalDescription()
                )
                .map(updatedDesc -> AppendProductDescriptionResponse.newBuilder()
                    .setSuccess(true)
                    .setUpdatedDescription(updatedDesc)
                    .setMessage("Description updated successfully")
                    .build())
            )
            .doOnNext(resp -> log.info("Append product description response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Append product description error: {}", e.getMessage(), e);
                return Mono.just(AppendProductDescriptionResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Failed to update description: " + e.getMessage())
                    .build());
            });
    }

    @Override
    public Mono<RateBidderResponse> rateBidder(Mono<RateBidderRequest> request) {
        return request.doOnNext(req -> log.info("Rate bidder request: {}", JsonUtils.toJson(req)))
            .map(req -> {
                // TODO: Implement rate bidder (insert into reviews table)
                return RateBidderResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Bidder rated successfully")
                    .build();
            })
            .doOnNext(resp -> log.info("Rate bidder response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Rate bidder error: {}", e.getMessage(), e);
                return Mono.just(RateBidderResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Failed to rate bidder: " + e.getMessage())
                    .build());
            });
    }

    // ============================================================================
    // LISTINGS MANAGEMENT
    // ============================================================================

    @Override
    public Mono<ListingsResponse> getListings(Mono<GetListingsRequest> request) {
        return request.doOnNext(req -> log.info("Get listings request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                sellerService.getListings(
                    req.getSellerId(),
                    req.getFilter(),
                    req.getPage(),
                    req.getPageSize()
                )
                .map(result -> ListingsResponse.newBuilder()
                    .addAllListings(result.listings())
                    .setTotalCount(result.totalCount())
                    .setPage(result.page())
                    .setPageSize(result.pageSize())
                    .build())
            )
            .doOnNext(resp -> log.info("Get listings response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Get listings error: {}", e.getMessage(), e);
                return Mono.just(ListingsResponse.newBuilder().build());
            });
    }

    // ============================================================================
    // ORDER MANAGEMENT
    // ============================================================================

    @Override
    public Mono<OrdersResponse> getOrders(Mono<GetOrdersRequest> request) {
        return request.doOnNext(req -> log.info("Get orders request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                sellerService.getOrders(
                    req.getSellerId(),
                    req.getStatusFilter(),
                    req.getPage(),
                    req.getPageSize()
                )
                .map(result -> {
                    log.info("SellerService returned: orders={}, totalCount={}, page={}, pageSize={}", 
                        result.orders().size(), result.totalCount(), result.page(), result.pageSize());
                    return OrdersResponse.newBuilder()
                        .addAllOrders(result.orders())
                        .setTotalCount(result.totalCount())
                        .setPage(result.page())
                        .setPageSize(result.pageSize())
                        .build();
                })
            )
            .doOnNext(resp -> log.info("Get orders response: ordersCount={}, totalCount={}, page={}, pageSize={}", 
                resp.getOrdersCount(), resp.getTotalCount(), resp.getPage(), resp.getPageSize()))
            .onErrorResume(e -> {
                log.error("Get orders error: {}", e.getMessage(), e);
                e.printStackTrace();
                return Mono.just(OrdersResponse.newBuilder().build());
            });
    }

    @Override
    public Mono<ConfirmPaymentReceiptResponse> confirmPaymentReceipt(Mono<ConfirmPaymentReceiptRequest> request) {
        return request.doOnNext(req -> log.info("Confirm payment receipt request: {}", JsonUtils.toJson(req)))
            .map(req -> {
                // TODO: Implement confirm payment in orders/payments service
                return ConfirmPaymentReceiptResponse.newBuilder()
                    .setSuccess(true)
                    .setMessage("Payment confirmed successfully")
                    .build();
            })
            .doOnNext(resp -> log.info("Confirm payment receipt response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Confirm payment receipt error: {}", e.getMessage(), e);
                return Mono.just(ConfirmPaymentReceiptResponse.newBuilder()
                    .setSuccess(false)
                    .setMessage("Failed to confirm payment: " + e.getMessage())
                    .build());
            });
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private LocalDateTime parseTimestamp(String timestampStr) {
        try {
            // Try parsing as ISO-8601 format first
            return LocalDateTime.parse(timestampStr);
        } catch (Exception e1) {
            try {
                // Try parsing as epoch milliseconds
                long epochMilli = Long.parseLong(timestampStr);
                return LocalDateTime.ofInstant(Instant.ofEpochMilli(epochMilli), ZoneOffset.UTC);
            } catch (Exception e2) {
                log.error("Failed to parse timestamp: {}", timestampStr);
                throw new IllegalArgumentException("Invalid timestamp format: " + timestampStr);
            }
        }
    }
}
