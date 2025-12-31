package products.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.auction.entities.database.Product;
import com.auction.entities.msg.EventType;
import com.auction.entities.msg.RabbitMessage;
import com.auction.rabbitmq.services.ReactiveRabbitProducer;
import com.auction.utils.TimeUtils;
import com.auctionplatform.seller.grpc.ListingDetail;
import com.auctionplatform.seller.grpc.ProductDetailsResponse;
import com.auctionplatform.seller.grpc.ProductSummary;

import products.repository.ProductRepository;
import products.repository.SellerRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class SellerService {
    private static final Logger log = LoggerFactory.getLogger(SellerService.class);
    private final SellerRepository sellerRepository;
    private final ProductRepository productRepository;
    private final AuctionService auctionService;
    private final ReactiveRabbitProducer rabbitProducer;
    
    private static final String NOTIFICATION_QUEUE = "dev";

    public SellerService(SellerRepository sellerRepository, ProductRepository productRepository, 
                        AuctionService auctionService, ReactiveRabbitProducer rabbitProducer) {
        this.sellerRepository = sellerRepository;
        this.productRepository = productRepository;
        this.auctionService = auctionService;
        this.rabbitProducer = rabbitProducer;
    }

    // ============================================================================
    // DASHBOARD / PROFILE
    // ============================================================================

    /**
     * Get active listings for seller
     */
    public Mono<ProductListResult> getActiveListings(int sellerId, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        
        return Mono.zip(
            sellerRepository.findActiveListingsBySellerId(sellerId, pageSize, offset)
                .map(this::mapToProductSummary)
                .collectList(),
            sellerRepository.countActiveListingsBySellerId(sellerId)
        ).map(tuple -> new ProductListResult(
            tuple.getT1(),
            tuple.getT2().intValue(),
            page,
            pageSize
        ));
    }

    /**
     * Get products where winner has been determined
     */
    public Mono<ProductListResult> getWinnerItems(int sellerId, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        
        return Mono.zip(
            sellerRepository.findWinnerItemsBySellerId(sellerId, pageSize, offset)
                .map(this::mapToProductSummary)
                .collectList(),
            sellerRepository.countWinnerItemsBySellerId(sellerId)
        ).map(tuple -> new ProductListResult(
            tuple.getT1(),
            tuple.getT2().intValue(),
            page,
            pageSize
        ));
    }

    // ============================================================================
    // CREATE AUCTION LISTING
    // ============================================================================

    /**
     * Create new auction listing
     */
    @Transactional
    public Mono<CreateListingResult> createAuctionListing(CreateListingRequest request) {
        Product product = new Product();
        product.setSellerId(request.sellerId());
        product.setTitle(request.title());
        product.setDescription(request.description());
        product.setCategoryId(request.categoryId());
        product.setStartingPrice(BigDecimal.valueOf(request.startingPrice()));
        product.setCurrentPrice(BigDecimal.valueOf(request.startingPrice()));
        product.setStepPrice(BigDecimal.valueOf(request.stepPrice()));
        product.setBuyNowPrice(BigDecimal.valueOf(request.buyNowPrice()));
        product.setStartsAt(request.startsAt());
        product.setEndsAt(request.endsAt());
        product.setIsAutoExtend(request.isAutoExtend());
        product.setAutoExtendSeconds(request.autoExtendSeconds());
        product.setStatus("active");
        
        return sellerRepository.save(product)
            .flatMap(saved -> {
                // Schedule auction end
                log.info("Scheduling auction end for product {} at {}", saved.getId(), saved.getEndsAt());
                auctionService.scheduleEndAuction(
                    Long.valueOf(saved.getId()),
                    TimeUtils.toInstant(saved.getEndsAt()),
                    () -> handleAuctionEnd(saved.getId())
                );
                
                // Save product images if provided
                if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
                    return Flux.fromIterable(request.imageUrls())
                        .index()
                        .flatMap(tuple -> {
                            int index = tuple.getT1().intValue();
                            String url = tuple.getT2();
                            boolean isPrimary = (index == 0); // First image is primary
                            return sellerRepository.insertProductImage(saved.getId(), url, isPrimary);
                        })
                        .then(Mono.just(saved));
                } else {
                    return Mono.just(saved);
                }
            })
            .map(saved -> new CreateListingResult(saved.getId(), "Auction listing created successfully"));
    }
    
    /**
     * Handle auction end - called by scheduler
     * This is only called when auction ends with NO BIDS
     */
    private void handleAuctionEnd(int productId) {
        log.info("Handling auction end for product {} (no bids)", productId);
        
        // Update product status to ended
        productRepository.updateStatus(productId, "ended")
            .then(productRepository.findById(productId))
            .flatMap(product -> {
                // Send notification to seller that auction ended with no bids
                return sendAuctionEndedSellerNotification(product);
            })
            .doOnSuccess(v -> log.info("Auction ended notification sent to seller for product {} (no bids)", productId))
            .doOnError(e -> log.error("Error handling auction end for product {}: {}", productId, e.getMessage(), e))
            .subscribe();
    }
    
    /**
     * Send notification to seller when auction ends with no bids
     */
    private Mono<Void> sendAuctionEndedSellerNotification(Product product) {
        Map<String, String> payload = new HashMap<>();
        payload.put("recipientType", "seller");
        payload.put("sellerId", String.valueOf(product.getSellerId()));
        payload.put("productId", String.valueOf(product.getId()));
        payload.put("productName", product.getTitle());
        payload.put("isSold", "false");
        payload.put("finalPrice", "0.00");
        payload.put("winnerName", null);
        payload.put("totalBids", "0");
        payload.put("auctionEndTime", TimeUtils.formatDateTime(product.getEndsAt()));
        
        RabbitMessage message = RabbitMessage.builder()
            .eventType(EventType.TASK_SEND_MAIL_ENDED_AUCTION)
            .userId(String.valueOf(product.getSellerId()))
            .payload(payload)
            .build();
        
        log.info("Sending auction ended notification to seller: sellerId={}, productId={}, no bids", 
            product.getSellerId(), product.getId());
        
        return rabbitProducer.sendToQueue(NOTIFICATION_QUEUE, message)
            .doOnSuccess(v -> log.info("Auction ended notification sent to seller successfully: sellerId={}, productId={}", 
                product.getSellerId(), product.getId()))
            .doOnError(e -> log.error("Failed to send auction ended notification to seller: sellerId={}, productId={}, error={}", 
                product.getSellerId(), product.getId(), e.getMessage(), e))
            .onErrorResume(e -> Mono.empty()); // Fire and forget
    }

    // ============================================================================
    // PRODUCT DETAIL (OWNER VIEW)
    // ============================================================================

    /**
     * Get product details for seller (owner view)
     */
    public Mono<ProductDetailsResponse> getProductDetails(int productId, int sellerId) {
        return sellerRepository.findByIdAndSellerId(productId, sellerId)
            .zipWith(sellerRepository.getHighestBidAmount(productId))
            .zipWith(sellerRepository.getHighestBidderId(productId))
            .map(tuple -> {
                Product product = tuple.getT1().getT1();
                Double highestBidAmount = tuple.getT1().getT2();
                Integer highestBidderId = tuple.getT2();
                
                return ProductDetailsResponse.newBuilder()
                    .setId(product.getId())
                    .setTitle(product.getTitle())
                    .setDescription(product.getDescription() != null ? product.getDescription() : "")
                    .setCategoryId(product.getCategoryId())
                    .setStartingPrice(product.getStartingPrice().floatValue())
                    .setCurrentPrice(product.getCurrentPrice().floatValue())
                    .setStepPrice(product.getStepPrice().floatValue())
                    .setBuyNowPrice(product.getBuyNowPrice() != null ? product.getBuyNowPrice().floatValue() : 0)
                    .setStartsAt(TimeUtils.toEpochSecond(product.getStartsAt()) * 1000 + "")
                    .setEndsAt(TimeUtils.toEpochSecond(product.getEndsAt()) * 1000 + "")
                    .setIsAutoExtend(product.getIsAutoExtend())
                    .setAutoExtendSeconds(product.getAutoExtendSeconds())
                    .setStatus(product.getStatus())
                    .setViewsCount(product.getViewsCount())
                    .setBidsCount(product.getBidsCount())
                    .setHighestBidderId(highestBidderId)
                    .setHighestBidAmount(highestBidAmount.floatValue())
                    .setCreatedAt(TimeUtils.toEpochSecond(product.getCreatedAt()) * 1000 + "")
                    .setUpdatedAt(TimeUtils.toEpochSecond(product.getUpdatedAt()) * 1000 + "")
                    .build();
            });
    }

    /**
     * Append additional description to product
     */
    @Transactional
    public Mono<String> appendProductDescription(int productId, int sellerId, String additionalDescription) {
        return sellerRepository.findByIdAndSellerId(productId, sellerId)
            .flatMap(product -> {
                String currentDesc = product.getDescription() != null ? product.getDescription() : "";
                String newDesc = currentDesc + "\n\n" + additionalDescription;
                
                return sellerRepository.updateProductDescription(productId, sellerId, newDesc)
                    .thenReturn(newDesc);
            });
    }

    // ============================================================================
    // LISTINGS MANAGEMENT
    // ============================================================================

    /**
     * Get listings with filter
     */
    public Mono<ListingsResult> getListings(int sellerId, String filter, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        
        return Mono.zip(
            sellerRepository.findListingsBySellerIdWithFilter(sellerId, filter, pageSize, offset)
                .map(this::mapToListingDetail)
                .collectList(),
            sellerRepository.countListingsBySellerIdWithFilter(sellerId, filter)
        ).map(tuple -> new ListingsResult(
            tuple.getT1(),
            tuple.getT2().intValue(),
            page,
            pageSize
        ));
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private ProductSummary mapToProductSummary(Product product) {
        return ProductSummary.newBuilder()
            .setId(product.getId())
            .setTitle(product.getTitle())
            .setCurrentPrice(product.getCurrentPrice().floatValue())
            .setStatus(product.getStatus())
            .setViewsCount(product.getViewsCount())
            .setBidsCount(product.getBidsCount())
            .setEndsAt(TimeUtils.toEpochSecond(product.getEndsAt()) * 1000 + "")
            .setPrimaryImageUrl("")
            .build();
    }

    private ListingDetail mapToListingDetail(Product product) {
        return ListingDetail.newBuilder()
            .setId(product.getId())
            .setTitle(product.getTitle())
            .setStatus(product.getStatus())
            .setCurrentPrice(product.getCurrentPrice().floatValue())
            .setBidsCount(product.getBidsCount())
            .setEndsAt(TimeUtils.toEpochSecond(product.getEndsAt()) * 1000 + "")
            .setIsAutoExtend(product.getIsAutoExtend())
            .setAutoExtendSeconds(product.getAutoExtendSeconds())
            .build();
    }
    /**
     * Answer a question on a product
     */
    public Mono<String> answerQuestion(int questionId, int sellerId, String answer) {
        log.info("Seller {} answering question {}", sellerId, questionId);
        return productRepository.updateQuestionAnswer(questionId, answer, sellerId)
            .thenReturn("Question answered successfully")
            .doOnSuccess(result -> log.info("Question {} answered successfully by seller {}", questionId, sellerId))
            .doOnError(e -> log.error("Error answering question {}: {}", questionId, e.getMessage(), e));
    }

    /**
     * Reject (ban) a bidder from a specific product
     */
    @Transactional
    public Mono<String> rejectBidder(int productId, int sellerId, int bidderId, String reason) {
        log.info("Seller {} rejecting bidder {} from product {} with reason: {}", sellerId, bidderId, productId, reason);
        
        // First verify the product belongs to the seller
        return sellerRepository.findByIdAndSellerId(productId, sellerId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Product not found or you don't have permission")))
            .flatMap(product -> {
                // Check if bidder is already banned
                return sellerRepository.countProductBan(productId, bidderId)
                    .flatMap(count -> {
                        if (count > 0) {
                            return Mono.error(new IllegalStateException("Bidder is already banned from this product"));
                        }
                        // Insert ban record
                        return sellerRepository.insertProductBan(productId, bidderId, reason)
                            .then(Mono.just(product));
                    });
            })
            .flatMap(product -> {
                // Send notification via RabbitMQ
                return sendBannedUserNotification(bidderId, product, reason)
                    .thenReturn("Bidder rejected successfully")
                    .onErrorResume(e -> {
                        log.warn("Failed to send ban notification, but ban was successful: {}", e.getMessage());
                        return Mono.just("Bidder rejected successfully (notification failed)");
                    });
            })
            .doOnSuccess(result -> log.info("Bidder {} successfully banned from product {} by seller {}", bidderId, productId, sellerId))
            .doOnError(e -> log.error("Error rejecting bidder {} from product {}: {}", bidderId, productId, e.getMessage(), e));
    }
    
    /**
     * Send notification via RabbitMQ when a user is banned from a product
     */
    private Mono<Void> sendBannedUserNotification(int bidderId, Product product, String reason) {
        Map<String, String> payload = new HashMap<>();
        payload.put("userId", String.valueOf(bidderId));
        payload.put("productId", String.valueOf(product.getId()));
        payload.put("productName", product.getTitle());
        payload.put("sellerId", String.valueOf(product.getSellerId()));
        payload.put("reason", reason);
        payload.put("banTime", LocalDateTime.now().toString());
        
        RabbitMessage message = RabbitMessage.builder()
            .eventType(EventType.TASK_SEND_MAIL_PRODUCT_BANNED_USER)
            .userId(String.valueOf(bidderId))
            .payload(payload)
            .build();
        
        log.info("Sending ban notification to RabbitMQ: userId={}, productId={}, queue={}", 
            bidderId, product.getId(), NOTIFICATION_QUEUE);
        
        return rabbitProducer.sendToQueue(NOTIFICATION_QUEUE, message)
            .doOnSuccess(v -> log.info("Ban notification sent successfully: userId={}, productId={}", bidderId, product.getId()))
            .doOnError(e -> log.error("Failed to send ban notification: userId={}, productId={}, error={}", 
                bidderId, product.getId(), e.getMessage(), e))
            .onErrorResume(e -> Mono.empty()); // Fire and forget
    }
    // ============================================================================
    // RESULT RECORDS
    // ============================================================================

    public record ProductListResult(
        List<ProductSummary> products,
        int totalCount,
        int page,
        int pageSize
    ) {}

    public record CreateListingResult(
        int productId,
        String message
    ) {}

    public record ListingsResult(
        List<ListingDetail> listings,
        int totalCount,
        int page,
        int pageSize
    ) {}

    public record CreateListingRequest(
            int sellerId,
            String title,
            String description,
            int categoryId,
            double startingPrice,
            double stepPrice,
            double buyNowPrice,
            LocalDateTime startsAt,
            LocalDateTime endsAt,
            boolean isAutoExtend,
            int autoExtendSeconds,
            List<String> imageUrls
    ) {}
}
