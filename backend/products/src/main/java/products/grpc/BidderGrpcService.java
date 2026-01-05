package products.grpc;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.grpc.server.service.GrpcService;

import com.auction.proto.user.AddToWatchlistRequest;
import com.auction.proto.user.AddToWatchlistResponse;
import com.auction.proto.user.AskQuestionRequest;
import com.auction.proto.user.AskQuestionResponse;
import com.auction.proto.user.GetMyBidsRequest;
import com.auction.proto.user.GetMyBidsResponse;
import com.auction.proto.user.GetProductBidsRequest;
import com.auction.proto.user.GetProductBidsResponse;
import com.auction.proto.user.GetProductDetailsRequest;
import com.auction.proto.user.GetProductDetailsResponse;
import com.auction.proto.user.GetProductQuestionsRequest;
import com.auction.proto.user.GetProductQuestionsResponse;
import com.auction.proto.user.GetRelatedProductsRequest;
import com.auction.proto.user.GetRelatedProductsResponse;
import com.auction.proto.user.GetBidderRatingsRequest;
import com.auction.proto.user.GetBidderRatingsResponse;
import com.auction.proto.user.GetUserNotificationsRequest;
import com.auction.proto.user.GetUserNotificationsResponse;
import com.auction.proto.user.GetWatchlistRequest;
import com.auction.proto.user.GetWatchlistResponse;
import com.auction.proto.user.MarkNotificationAsReadRequest;
import com.auction.proto.user.MarkNotificationAsReadResponse;
import com.auction.proto.user.BidderReview;
import com.auction.proto.user.PlaceBidRequest;
import com.auction.proto.user.PlaceBidResponse;
import com.auction.proto.user.ReactorUserServiceGrpc;
import com.auction.proto.user.RemoveFromWatchlistRequest;
import com.auction.proto.user.RemoveFromWatchlistResponse;
import com.auction.proto.user.SetAutoBidRequest;
import com.auction.proto.user.SetAutoBidResponse;
import com.auction.utils.JsonUtils;

import products.service.BidderService;
import reactor.core.publisher.Mono;

/**
 * gRPC implementation of UserService for Bidder operations
 * Gateway will call this service for bidder-related functionality
 */
@GrpcService
public class BidderGrpcService extends ReactorUserServiceGrpc.UserServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(BidderGrpcService.class);
    private final BidderService bidderService;

    public BidderGrpcService(BidderService bidderService) {
        this.bidderService = bidderService;
    }

    @Override
    public Mono<GetProductDetailsResponse> getProductDetails(Mono<GetProductDetailsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get product details request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.getProductDetails(req.getProductId(), req.getUserId())
                        .map(product -> GetProductDetailsResponse.newBuilder()
                            .setProduct(product)
                            .setSuccess(true)
                            .setMessage("Product details retrieved successfully")
                            .build())
                        .doOnNext(resp -> log.info("Raw get product details response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Get product details error for productId={}, userId={}: {}", 
                                req.getProductId(), req.getUserId(), e.getMessage(), e);
                            return Mono.just(GetProductDetailsResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to get product details: " + e.getMessage())
                                .build());
                        })
                )
                .doOnError(e -> log.error("Unexpected error in getProductDetails gRPC: {}", e.getMessage(), e))
                .onErrorResume(e -> {
                    log.error("Final fallback error handler: {}", e.getMessage(), e);
                    return Mono.just(GetProductDetailsResponse.newBuilder()
                        .setSuccess(false)
                        .setMessage("Internal server error: " + e.getMessage())
                        .build());
                });
    }

    @Override
    public Mono<GetRelatedProductsResponse> getRelatedProducts(Mono<GetRelatedProductsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get related products request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.getRelatedProducts(req.getProductId(), req.getLimit())
                        .collectList()
                        .map(products -> GetRelatedProductsResponse.newBuilder()
                            .addAllProducts(products)
                            .setSuccess(true)
                            .setMessage("Related products retrieved successfully")
                            .build())
                        .doOnNext(resp -> log.info("Raw get related products response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Get related products error: {}", e.getMessage());
                            return Mono.just(GetRelatedProductsResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to get related products: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<AddToWatchlistResponse> addToWatchlist(Mono<AddToWatchlistRequest> request) {
        return request.doOnNext(req -> log.info("Raw add to watchlist request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.addToWatchlist(req.getProductId(), req.getUserId())
                        .map(watchlistId -> AddToWatchlistResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage("Product added to watchlist successfully")
                            .setWatchlistId(watchlistId)
                            .build())
                        .doOnNext(resp -> log.info("Raw add to watchlist response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Add to watchlist error: {}", e.getMessage());
                            return Mono.just(AddToWatchlistResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to add to watchlist: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<RemoveFromWatchlistResponse> removeFromWatchlist(Mono<RemoveFromWatchlistRequest> request) {
        return request.doOnNext(req -> log.info("Raw remove from watchlist request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.removeFromWatchlist(req.getProductId(), req.getUserId())
                        .map(message -> RemoveFromWatchlistResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage(message)
                            .build())
                        .doOnNext(resp -> log.info("Raw remove from watchlist response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Remove from watchlist error: {}", e.getMessage());
                            return Mono.just(RemoveFromWatchlistResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to remove from watchlist: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<GetWatchlistResponse> getWatchlist(Mono<GetWatchlistRequest> request) {
        return request.doOnNext(req -> log.info("Raw get watchlist request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.getWatchlist(req.getUserId(), req.getPage(), req.getLimit(), req.getStatus())
                        .map(result -> GetWatchlistResponse.newBuilder()
                            .addAllProducts(result.products())
                            .setPageInfo(result.pageInfo())
                            .setSuccess(true)
                            .setMessage("Watchlist retrieved successfully")
                            .build())
                        .doOnNext(resp -> log.info("Raw get watchlist response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Get watchlist error: {}", e.getMessage());
                            return Mono.just(GetWatchlistResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to get watchlist: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<AskQuestionResponse> askQuestion(Mono<AskQuestionRequest> request) {
        return request.doOnNext(req -> log.info("Raw ask question request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.askQuestion(req.getProductId(), req.getUserId(), req.getQuestion())
                        .map(result -> AskQuestionResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage("Question submitted successfully")
                            .setQuestionId(result.questionId())
                            .setCreatedAt(result.createdAt())
                            .build())
                        .doOnNext(resp -> log.info("Raw ask question response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Ask question error: {}", e.getMessage());
                            return Mono.just(AskQuestionResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to submit question: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<GetProductQuestionsResponse> getProductQuestions(Mono<GetProductQuestionsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get product questions request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.getProductQuestions(req.getProductId(), req.getPage(), req.getLimit())
                        .map(result -> GetProductQuestionsResponse.newBuilder()
                            .addAllQuestions(result.questions())
                            .setPageInfo(result.pageInfo())
                            .setSuccess(true)
                            .setMessage("Product questions retrieved successfully")
                            .build())
                        .doOnNext(resp -> log.info("Raw get product questions response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Get product questions error: {}", e.getMessage());
                            return Mono.just(GetProductQuestionsResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to get product questions: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<GetProductBidsResponse> getProductBids(Mono<GetProductBidsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get product bids request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.getProductBids(req.getProductId(), req.getUserId(), req.getPage(), req.getLimit())
                        .map(result -> GetProductBidsResponse.newBuilder()
                            .addAllBids(result.bids())
                            .setPageInfo(result.pageInfo())
                            .setSuccess(true)
                            .setMessage("Product bids retrieved successfully")
                            .build())
                        .doOnNext(resp -> log.info("Raw get product bids response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Get product bids error: {}", e.getMessage());
                            return Mono.just(GetProductBidsResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to get product bids: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<PlaceBidResponse> placeBid(Mono<PlaceBidRequest> request) {
        return request.doOnNext(req -> log.info("Raw place bid request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.placeBid(req.getProductId(), req.getUserId(), req.getBidAmount())
                        .map(result -> PlaceBidResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage("Bid placed successfully")
                            .setBidId(result.bidId())
                            .setCurrentPrice(result.currentPrice())
                            .setNextMinBid(result.nextMinBid())
                            .setCreatedAt(result.createdAt())
                            .setIsHighestBidder(result.isHighestBidder())
                            .build())
                        .doOnNext(resp -> log.info("Raw place bid response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Place bid error: {}", e.getMessage());
                            return Mono.just(PlaceBidResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to place bid: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<SetAutoBidResponse> setAutoBid(Mono<SetAutoBidRequest> request) {
        return request.doOnNext(req -> log.info("Raw set auto bid request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.setAutoBid(req.getProductId(), req.getUserId(), req.getMaxAmount())
                        .map(result -> SetAutoBidResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage("Auto-bid set successfully")
                            .setAutoBidId(result.autoBidId())
                            .setMaxAmount(result.maxAmount())
                            .setCurrentBid(result.currentBid())
                            .setCreatedAt(result.createdAt())
                            .build())
                        .doOnNext(resp -> log.info("Raw set auto bid response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Set auto bid error: {}", e.getMessage());
                            return Mono.just(SetAutoBidResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to set auto-bid: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<GetMyBidsResponse> getMyBids(Mono<GetMyBidsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get my bids request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.getMyBids(req.getUserId(), req.getPage(), req.getLimit(), req.getFilter())
                        .map(result -> GetMyBidsResponse.newBuilder()
                            .addAllBids(result.bids())
                            .setPageInfo(result.pageInfo())
                            .setSuccess(true)
                            .setMessage("Bid history retrieved successfully")
                            .build())
                        .doOnNext(resp -> log.info("Raw get my bids response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Get my bids error: {}", e.getMessage());
                            return Mono.just(GetMyBidsResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to get bid history: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<GetUserNotificationsResponse> getUserNotifications(Mono<GetUserNotificationsRequest> request) {
        return request.doOnNext(req -> log.info("Raw get user notifications request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.getUserNotifications(req.getUserId())
                        .map(result -> GetUserNotificationsResponse.newBuilder()
                            .addAllNotifications(result.notifications())
                            .setUnreadCount(result.unreadCount())
                            .setSuccess(true)
                            .setMessage("Notifications retrieved successfully")
                            .build())
                        .doOnNext(resp -> log.info("Raw get user notifications response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Get user notifications error: {}", e.getMessage());
                            return Mono.just(GetUserNotificationsResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to get notifications: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<MarkNotificationAsReadResponse> markNotificationAsRead(Mono<MarkNotificationAsReadRequest> request) {
        return request.doOnNext(req -> log.info("Raw mark notification as read request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.markNotificationAsRead(req.getNotificationId(), req.getUserId())
                        .map(message -> MarkNotificationAsReadResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage(message)
                            .build())
                        .doOnNext(resp -> log.info("Raw mark notification as read response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Mark notification as read error: {}", e.getMessage());
                            return Mono.just(MarkNotificationAsReadResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Failed to mark notification as read: " + e.getMessage())
                                .build());
                        })
                );
    }

    @Override
    public Mono<GetBidderRatingsResponse> getBidderRatings(Mono<GetBidderRatingsRequest> request) {
        return request.doOnNext(req -> log.info("Get bidder ratings request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                bidderService.getBidderRatings(req.getBidderId(), req.getPage(), req.getPageSize())
                    .map(result -> {
                        GetBidderRatingsResponse.Builder responseBuilder = GetBidderRatingsResponse.newBuilder()
                            .setPositiveReviews(result.positiveReviews())
                            .setNegativeReviews(result.negativeReviews())
                            .setRatingPercent(result.ratingPercent())
                            .setTotalCount(result.totalCount());
                        
                        // Map reviews
                        result.reviews().forEach(review -> {
                            BidderReview grpcReview = BidderReview.newBuilder()
                                .setId(review.id())
                                .setFromUserId(review.fromUserId())
                                .setFromUserName(review.fromUserName())
                                .setScore(review.score())
                                .setComment(review.comment())
                                .setCreatedAt(review.createdAt())
                                .build();
                            responseBuilder.addReviews(grpcReview);
                        });
                        
                        return responseBuilder.build();
                    })
            )
            .doOnNext(resp -> log.info("Get bidder ratings response: {}", JsonUtils.toJson(resp)))
            .onErrorResume(e -> {
                log.error("Get bidder ratings error: {}", e.getMessage(), e);
                return Mono.just(GetBidderRatingsResponse.newBuilder().build());
            });
    }
    
    @Override
    public Mono<com.auction.proto.user.BuyNowProductResponse> buyNowProduct(Mono<com.auction.proto.user.BuyNowProductRequest> request) {
        return request.doOnNext(req -> log.info("Buy now product request: {}", JsonUtils.toJson(req)))
            .flatMap(req ->
                bidderService.buyNowProduct(req.getProductId(), req.getUserId())
                    .map(result -> com.auction.proto.user.BuyNowProductResponse.newBuilder()
                        .setSuccess(true)
                        .setMessage("Product purchased successfully via Buy Now")
                        .setOrderId(result.orderId())
                        .setPrice(result.price())
                        .setCreatedAt(result.createdAt())
                        .build())
                    .doOnNext(resp -> log.info("Buy now product response: {}", JsonUtils.toJson(resp)))
                    .onErrorResume(e -> {
                        log.error("Buy now product error: {}", e.getMessage(), e);
                        return Mono.just(com.auction.proto.user.BuyNowProductResponse.newBuilder()
                            .setSuccess(false)
                            .setMessage("Failed to buy now: " + e.getMessage())
                            .build());
                    })
            );
    }
    
    @Override
    public Mono<com.auction.proto.user.GetTopBiddersResponse> getTopBidders(Mono<com.auction.proto.user.GetTopBiddersRequest> request) {
        return request.doOnNext(req -> log.info("Raw get top bidders request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.getTopBidders(req.getProductId(), req.getLimit())
                        .map(result -> {
                            var responseBuilder = com.auction.proto.user.GetTopBiddersResponse.newBuilder()
                                .setSuccess(true)
                                .setMessage("Top bidders retrieved successfully");
                            
                            for (var bidder : result.topBidders()) {
                                responseBuilder.addTopBidders(
                                    com.auction.proto.user.TopBidder.newBuilder()
                                        .setBidderId(bidder.bidderId())
                                        .setBidderNameMasked(bidder.bidderNameMasked())
                                        .setBidAmount(bidder.bidAmount())
                                        .setBidTime(bidder.bidTime())
                                        .build()
                                );
                            }
                            
                            return responseBuilder.build();
                        })
                        .doOnNext(resp -> log.info("Raw get top bidders response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Error getting top bidders: {}", e.getMessage(), e);
                            return Mono.just(com.auction.proto.user.GetTopBiddersResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Error: " + e.getMessage())
                                .build());
                        })
                );
    }
    
    @Override
    public Mono<com.auction.proto.user.RequestRoleUpgradeResponse> requestRoleUpgrade(Mono<com.auction.proto.user.RequestRoleUpgradeRequest> request) {
        return request.doOnNext(req -> log.info("Raw request role upgrade request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.requestRoleUpgrade(req.getUserId())
                        .map(result -> com.auction.proto.user.RequestRoleUpgradeResponse.newBuilder()
                            .setSuccess(result.success())
                            .setMessage(result.message())
                            .setRequestId(result.requestId())
                            .build())
                        .doOnNext(resp -> log.info("Raw request role upgrade response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Error requesting role upgrade: {}", e.getMessage(), e);
                            return Mono.just(com.auction.proto.user.RequestRoleUpgradeResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Error: " + e.getMessage())
                                .setRequestId(0)
                                .build());
                        })
                );
    }
    
    @Override
    public Mono<com.auction.proto.user.GetRoleUpgradeRequestStatusResponse> getRoleUpgradeRequestStatus(Mono<com.auction.proto.user.GetRoleUpgradeRequestStatusRequest> request) {
        return request.doOnNext(req -> log.info("Raw get role upgrade request status request: {}", JsonUtils.toJson(req)))
                .flatMap(req ->
                    bidderService.getRoleUpgradeRequestStatus(req.getUserId())
                        .map(result -> com.auction.proto.user.GetRoleUpgradeRequestStatusResponse.newBuilder()
                            .setSuccess(result.success())
                            .setMessage(result.message())
                            .setHasRequest(result.hasRequest())
                            .setStatus(result.status())
                            .setCreatedAt(result.createdAt())
                            .build())
                        .doOnNext(resp -> log.info("Raw get role upgrade request status response: {}", JsonUtils.toJson(resp)))
                        .onErrorResume(e -> {
                            log.error("Error getting role upgrade request status: {}", e.getMessage(), e);
                            return Mono.just(com.auction.proto.user.GetRoleUpgradeRequestStatusResponse.newBuilder()
                                .setSuccess(false)
                                .setMessage("Error: " + e.getMessage())
                                .setHasRequest(false)
                                .setStatus("error")
                                .build());
                        })
                );
    }
}

