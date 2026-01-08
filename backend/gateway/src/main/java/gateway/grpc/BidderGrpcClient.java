package gateway.grpc;

import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auction.proto.user.*;
import com.auction.utils.JsonUtils;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import reactor.core.publisher.Mono;

@Component
public class BidderGrpcClient {
    private static final Logger log = LoggerFactory.getLogger(BidderGrpcClient.class);
    
    @Value("${grpc.product-service.host:localhost}")
    private String productServiceHost;

    @Value("${grpc.product-service.port:9091}")
    private int productServicePort;

    private ManagedChannel channel;
    private ReactorUserServiceGrpc.ReactorUserServiceStub userServiceStub;

    @PostConstruct
    public void init() {
        channel = ManagedChannelBuilder
                .forAddress(productServiceHost, productServicePort)
                .usePlaintext()
                .keepAliveTime(10, TimeUnit.SECONDS)
                .keepAliveTimeout(10, TimeUnit.SECONDS)
                .build();
        
        userServiceStub = ReactorUserServiceGrpc.newReactorStub(channel);
        
        log.info("gRPC User Product Service client initialized: {}:{}", productServiceHost, productServicePort);
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            channel.shutdown();
            log.info("gRPC User Product Service channel shutdown");
        }
    }

    // Get Product Details
    public Mono<GetProductDetailsResponse> getProductDetails(GetProductDetailsRequest request) {
        log.info("gRPC getProductDetails request: {}", JsonUtils.toJson(request));
        return userServiceStub.getProductDetails(Mono.just(request));
    }

    // Get Related Products
    public Mono<GetRelatedProductsResponse> getRelatedProducts(GetRelatedProductsRequest request) {
        log.info("gRPC getRelatedProducts request: {}", JsonUtils.toJson(request));
        return userServiceStub.getRelatedProducts(Mono.just(request));
    }

    // Add to Watchlist
    public Mono<AddToWatchlistResponse> addToWatchlist(AddToWatchlistRequest request) {
        log.info("gRPC addToWatchlist request: {}", JsonUtils.toJson(request));
        return userServiceStub.addToWatchlist(Mono.just(request));
    }

    // Remove from Watchlist
    public Mono<RemoveFromWatchlistResponse> removeFromWatchlist(RemoveFromWatchlistRequest request) {
        log.info("gRPC removeFromWatchlist request: {}", JsonUtils.toJson(request));
        return userServiceStub.removeFromWatchlist(Mono.just(request));
    }

    // Get Watchlist
    public Mono<GetWatchlistResponse> getWatchlist(GetWatchlistRequest request) {
        log.info("gRPC getWatchlist request: {}", JsonUtils.toJson(request));
        return userServiceStub.getWatchlist(Mono.just(request));
    }

    // Ask Question
    public Mono<AskQuestionResponse> askQuestion(AskQuestionRequest request) {
        log.info("gRPC askQuestion request: {}", JsonUtils.toJson(request));
        return userServiceStub.askQuestion(Mono.just(request));
    }

    // Get Product Bids
    public Mono<GetProductBidsResponse> getProductBids(GetProductBidsRequest request) {
        log.info("gRPC getProductBids request: {}", JsonUtils.toJson(request));
        return userServiceStub.getProductBids(Mono.just(request));
    }

    // Place Bid
    public Mono<PlaceBidResponse> placeBid(PlaceBidRequest request) {
        log.info("gRPC placeBid request: {}", JsonUtils.toJson(request));
        return userServiceStub.placeBid(Mono.just(request));
    }

    // Set Auto Bid
    public Mono<SetAutoBidResponse> setAutoBid(SetAutoBidRequest request) {
        log.info("gRPC setAutoBid request: {}", JsonUtils.toJson(request));
        return userServiceStub.setAutoBid(Mono.just(request));
    }

    // Get My Bids
    public Mono<GetMyBidsResponse> getMyBids(GetMyBidsRequest request) {
        log.info("gRPC getMyBids request: {}", JsonUtils.toJson(request));
        return userServiceStub.getMyBids(Mono.just(request));
    }

    // Get Product Questions
    public Mono<GetProductQuestionsResponse> getProductQuestions(GetProductQuestionsRequest request) {
        log.info("gRPC getProductQuestions request: {}", JsonUtils.toJson(request));
        return userServiceStub.getProductQuestions(Mono.just(request));
    }

    // Get User Notifications
    public Mono<GetUserNotificationsResponse> getUserNotifications(GetUserNotificationsRequest request) {
        log.info("gRPC getUserNotifications request: {}", JsonUtils.toJson(request));
        return userServiceStub.getUserNotifications(Mono.just(request));
    }

    // Mark Notification As Read
    public Mono<MarkNotificationAsReadResponse> markNotificationAsRead(MarkNotificationAsReadRequest request) {
        log.info("gRPC markNotificationAsRead request: {}", JsonUtils.toJson(request));
        return userServiceStub.markNotificationAsRead(Mono.just(request));
    }

    // Get Bidder Ratings
    public Mono<GetBidderRatingsResponse> getBidderRatings(GetBidderRatingsRequest request) {
        log.info("gRPC getBidderRatings request: {}", JsonUtils.toJson(request));
        return userServiceStub.getBidderRatings(Mono.just(request));
    }
    
    // Buy Now Product
    public Mono<BuyNowProductResponse> buyNowProduct(BuyNowProductRequest request) {
        log.info("gRPC buyNowProduct request: {}", JsonUtils.toJson(request));
        return userServiceStub.buyNowProduct(Mono.just(request));
    }
    
    // Get Top Bidders
    public Mono<GetTopBiddersResponse> getTopBidders(GetTopBiddersRequest request) {
        log.info("gRPC getTopBidders request: {}", JsonUtils.toJson(request));
        return userServiceStub.getTopBidders(Mono.just(request));
    }
    
    // Request Role Upgrade
    public Mono<RequestRoleUpgradeResponse> requestRoleUpgrade(RequestRoleUpgradeRequest request) {
        log.info("gRPC requestRoleUpgrade request: {}", JsonUtils.toJson(request));
        return userServiceStub.requestRoleUpgrade(Mono.just(request));
    }
    
    // Get Role Upgrade Request Status
    public Mono<GetRoleUpgradeRequestStatusResponse> getRoleUpgradeRequestStatus(GetRoleUpgradeRequestStatusRequest request) {
        log.info("gRPC getRoleUpgradeRequestStatus request: {}", JsonUtils.toJson(request));
        return userServiceStub.getRoleUpgradeRequestStatus(Mono.just(request));
    }
    
    // Get Bidder List Order
    public Mono<GetBidderListOrderResponse> getBidderListOrder(GetBidderListOrderRequest request) {
        log.info("gRPC getBidderListOrder request: {}", JsonUtils.toJson(request));
        return userServiceStub.getBidderListOrder(Mono.just(request));
    }
    
    // Get Banned Products
    public Mono<GetBannedProductsResponse> getBannedProducts(GetBannedProductsRequest request) {
        log.info("gRPC getBannedProducts request: {}", JsonUtils.toJson(request));
        return userServiceStub.getBannedProducts(Mono.just(request));
    }
    
    // Get Order By ID
    public Mono<GetOrderByIdResponse> getOrderById(GetOrderByIdRequest request) {
        log.info("gRPC getOrderById request: {}", JsonUtils.toJson(request));
        return userServiceStub.getOrderById(Mono.just(request));
    }
    
    // Update Order Payment Intent
    public Mono<UpdateOrderPaymentIntentResponse> updateOrderPaymentIntent(UpdateOrderPaymentIntentRequest request) {
        log.info("gRPC updateOrderPaymentIntent request: {}", JsonUtils.toJson(request));
        return userServiceStub.updateOrderPaymentIntent(Mono.just(request));
    }
}
