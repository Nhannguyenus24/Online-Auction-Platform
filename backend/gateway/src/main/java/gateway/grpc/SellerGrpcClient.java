package gateway.grpc;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auction.utils.JsonUtils;
import com.auctionplatform.seller.grpc.*;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import reactor.core.publisher.Mono;

@Component
public class SellerGrpcClient {
    private static final Logger log = LoggerFactory.getLogger(SellerGrpcClient.class);
    
    @Value("${grpc.product-service.host:localhost}")
    private String productServiceHost;

    @Value("${grpc.product-service.port:9091}")
    private int productServicePort;

    private ManagedChannel channel;
    private ReactorSellerServiceGrpc.ReactorSellerServiceStub sellerServiceStub;

    @PostConstruct
    public void init() {
        channel = ManagedChannelBuilder
                .forAddress(productServiceHost, productServicePort)
                .usePlaintext()
                .build();
        
        sellerServiceStub = ReactorSellerServiceGrpc.newReactorStub(channel);
        
        log.info("gRPC Seller Service client initialized: {}:{}", productServiceHost, productServicePort);
    }

    @PreDestroy
    public void shutdown() {
        if (channel != null && !channel.isShutdown()) {
            channel.shutdown();
            log.info("gRPC Seller Service channel shutdown");
        }
    }

    // Dashboard / Profile endpoints
    
    // Get Seller Profile
    public Mono<SellerProfileResponse> getSellerProfile(GetSellerProfileRequest request) {
        log.info("gRPC getSellerProfile request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.getSellerProfile(Mono.just(request));
    }

    // Get Active Listings
    public Mono<ProductListResponse> getActiveListings(GetActiveListingsRequest request) {
        log.info("gRPC getActiveListings request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.getActiveListings(Mono.just(request));
    }

    // Get Winner Items
    public Mono<ProductListResponse> getWinnerItems(GetWinnerItemsRequest request) {
        log.info("gRPC getWinnerItems request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.getWinnerItems(Mono.just(request));
    }

    // Get Transaction History
    public Mono<TransactionHistoryResponse> getTransactionHistory(GetTransactionHistoryRequest request) {
        log.info("gRPC getTransactionHistory request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.getTransactionHistory(Mono.just(request));
    }

    // Get Seller Ratings
    public Mono<RatingsResponse> getSellerRatings(GetSellerRatingsRequest request) {
        log.info("gRPC getSellerRatings request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.getSellerRatings(Mono.just(request));
    }

    // Create Auction Listing
    
    public Mono<CreateAuctionListingResponse> createAuctionListing(CreateAuctionListingRequest request) {
        log.info("gRPC createAuctionListing request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.createAuctionListing(Mono.just(request));
    }

    // Product Detail (owner view)
    
    // Get Product Details
    public Mono<ProductDetailsResponse> getProductDetails(GetProductDetailsRequest request) {
        log.info("gRPC getProductDetails request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.getProductDetails(Mono.just(request));
    }

    // Answer Question
    public Mono<AnswerQuestionResponse> answerQuestion(AnswerQuestionRequest request) {
        log.info("gRPC answerQuestion request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.answerQuestion(Mono.just(request));
    }

    // Reject Bidder
    public Mono<RejectBidderResponse> rejectBidder(RejectBidderRequest request) {
        log.info("gRPC rejectBidder request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.rejectBidder(Mono.just(request));
    }

    // Append Product Description
    public Mono<AppendProductDescriptionResponse> appendProductDescription(AppendProductDescriptionRequest request) {
        log.info("gRPC appendProductDescription request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.appendProductDescription(Mono.just(request));
    }

    // Rate Bidder
    public Mono<RateBidderResponse> rateBidder(RateBidderRequest request) {
        log.info("gRPC rateBidder request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.rateBidder(Mono.just(request));
    }

    // Listings Management
    
    // Get Listings
    public Mono<ListingsResponse> getListings(GetListingsRequest request) {
        log.info("gRPC getListings request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.getListings(Mono.just(request));
    }

    // Order Management
    
    // Get Orders
    public Mono<OrdersResponse> getOrders(GetOrdersRequest request) {
        log.info("gRPC getOrders request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.getOrders(Mono.just(request));
    }

    // Confirm Payment Receipt
    public Mono<ConfirmPaymentReceiptResponse> confirmPaymentReceipt(ConfirmPaymentReceiptRequest request) {
        log.info("gRPC confirmPaymentReceipt request: {}", JsonUtils.toJson(request));
        return sellerServiceStub.confirmPaymentReceipt(Mono.just(request));
    }
}
