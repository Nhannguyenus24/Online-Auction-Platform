package products.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.auction.constants.ServiceConstants;
import com.auction.entities.database.Product;
import com.auction.entities.database.User;
import com.auction.entities.msg.EventType;
import com.auction.entities.msg.RabbitMessage;
import com.auction.entities.record.ImageRowRecord;
import com.auction.rabbitmq.services.ReactiveRabbitProducer;
import com.auction.redis.service.ReactiveRedisService;
import com.auction.utils.ServiceExceptionUtils;
import com.auction.utils.TimeUtils;
import com.auctionplatform.seller.grpc.ListingDetail;
import com.auctionplatform.seller.grpc.OrderDetail;
import com.auctionplatform.seller.grpc.ProductDetailsResponse;
import com.auctionplatform.seller.grpc.ProductSummary;
import com.auctionplatform.seller.grpc.Review;

import products.repository.OrderRepository;
import products.repository.ProductRepository;
import products.repository.ReviewRepository;
import products.repository.SellerRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class SellerService {
    private static final Logger log = LoggerFactory.getLogger(SellerService.class);
    private final SellerRepository sellerRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final AuctionService auctionService;
    private final ReactiveRabbitProducer rabbitProducer;
    private final ReactiveRedisService redisService;

    public SellerService(SellerRepository sellerRepository, ProductRepository productRepository, 
                        OrderRepository orderRepository, ReviewRepository reviewRepository,
                        AuctionService auctionService, ReactiveRabbitProducer rabbitProducer,
                        ReactiveRedisService redisService) {
        this.sellerRepository = sellerRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.auctionService = auctionService;
        this.rabbitProducer = rabbitProducer;
        this.redisService = redisService;
    }

    // ============================================================================
    // DASHBOARD / PROFILE
    // ============================================================================

    /**
     * Get seller ratings and reviews
     */
    public Mono<RatingsResult> getSellerRatings(int sellerId, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        
        return Mono.zip(
            // Get total count
            productRepository.findUserById(sellerId),
            reviewRepository.findByToUserIdOrderByCreatedAtDesc(sellerId)
                .skip(offset)
                .take(pageSize)
                .flatMap(review -> {
                    // Get username for from_user_id
                    Mono<String> userNameMono = productRepository.getUserFullName(review.getFromUserId())
                        .defaultIfEmpty("User #" + review.getFromUserId());
                    
                    return userNameMono.map(userName -> Review.newBuilder()
                        .setId(review.getId())
                        .setFromUserId(review.getFromUserId())
                        .setFromUserName(userName)
                        .setComment(review.getComment() != null ? review.getComment() : "")
                        .setCreatedAt(TimeUtils.toEpochSecond(review.getCreatedAt()) * 1000 + "")
                        .build());
                })
                .collectList()
        ).map(tuple -> {
            User seller = tuple.getT1();
            List<Review> reviews = tuple.getT2();
            return new RatingsResult(
                seller.getPositiveReviews(),
                seller.getNegativeReviews(),
                reviews,
                seller.getPositiveReviews() + seller.getNegativeReviews()
            );
        });
    }

    /**
     * Get active listings for seller
     */
    public Mono<ProductListResult> getActiveListings(int sellerId, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        
        return Mono.zip(
            sellerRepository.findActiveListingsBySellerId(sellerId, pageSize, offset)
                .flatMap(product -> 
                    productRepository.getProductImages(product.getId())
                        .next()
                        .map(ImageRowRecord::url)
                        .defaultIfEmpty("")
                        .map(primaryImageUrl -> mapToProductSummary(product, primaryImageUrl))
                )
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
                .flatMap(product -> 
                    productRepository.getProductImages(product.getId())
                        .next()
                        .map(ImageRowRecord::url)
                        .defaultIfEmpty("")
                        .map(primaryImageUrl -> mapToProductSummary(product, primaryImageUrl))
                )
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
        product.setStatus(ServiceConstants.PRODUCT_STATUS_ACTIVE);
        
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
        // Send notification to seller that auction ended with no bids
        productRepository.updateStatus(productId, ServiceConstants.PRODUCT_STATUS_ENDED)
            .then(productRepository.findById(productId))
            .flatMap(this::sendAuctionEndedSellerNotification)
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
        payload.put("totalBids", "0");
        payload.put("auctionEndTime", product.getEndsAt().toString());
        
        RabbitMessage message = RabbitMessage.builder()
            .eventType(EventType.TASK_SEND_MAIL_ENDED_AUCTION)
            .userId(String.valueOf(product.getSellerId()))
            .payload(payload)
            .build();
        
        log.info("Sending auction ended notification to seller: sellerId={}, productId={}, no bids", 
            product.getSellerId(), product.getId());
        
        return rabbitProducer.sendToQueue(ServiceConstants.NOTIFICATION_QUEUE, message)
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
                    .then(sellerRepository.findDistinctBiddersByProductId(productId)
                        .flatMap(bidderId -> sendDescriptionChangeNotification(product, bidderId, additionalDescription))
                        .collectList()
                    )
                    .thenReturn(newDesc);
            });
    }
    
    /**
     * Send notification to bidder when product description changes
     */
    private Mono<Void> sendDescriptionChangeNotification(Product product, int bidderId, String additionalDescription) {
        log.info("Sending description change notification to bidder: userId={}, productId={}", 
            bidderId, product.getId());
        
        Map<String, String> payload = new HashMap<>();
        payload.put("recipientType", "bidder");
        payload.put("userId", String.valueOf(bidderId));
        payload.put("productId", String.valueOf(product.getId()));
        payload.put("productName", product.getTitle());
        payload.put("newDescription", additionalDescription);
        payload.put("changeTime", TimeUtils.now().toString());
        payload.put("auctionEndTime", product.getEndsAt().toString());
        
        RabbitMessage message = RabbitMessage.builder()
            .eventType(EventType.TASK_SEND_MAIL_CHANGE_DESCRIPTION)
            .userId(String.valueOf(bidderId))
            .payload(payload)
            .build();
        
        return rabbitProducer.sendToQueue(ServiceConstants.NOTIFICATION_QUEUE, message)
            .doOnSuccess(v -> log.info("Description change notification sent to bidder: userId={}, productId={}", 
                bidderId, product.getId()))
            .doOnError(e -> log.error("Failed to send description change notification: userId={}, productId={}, error={}", 
                bidderId, product.getId(), e.getMessage(), e))
            .onErrorResume(e -> Mono.empty()); // Fire and forget
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
                .flatMap(product -> 
                    productRepository.getProductImages(product.getId())
                        .next()
                        .map(ImageRowRecord::url)
                        .defaultIfEmpty("")
                        .map(primaryImageUrl -> mapToListingDetail(product, primaryImageUrl))
                )
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
    // ORDER MANAGEMENT
    // ============================================================================

    /**
     * Get seller's orders with status filter and pagination
     */
    public Mono<OrdersResult> getOrders(int sellerId, String statusFilter, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        
        log.info("Getting orders for sellerId={}, statusFilter={}, page={}, pageSize={}, offset={}", 
            sellerId, statusFilter, page, pageSize, offset);
        
        return Mono.zip(
            orderRepository.findOrdersBySellerId(sellerId, statusFilter, pageSize, offset)
                .flatMap(order -> {
                    log.debug("Found order: id={}, productId={}, buyerId={}, amount={}, status={}", 
                        order.getId(), order.getProductId(), order.getBuyerId(), order.getAmount(), order.getStatus());
                    
                    // Fetch product title
                    Mono<String> productTitleMono = productRepository.findById(order.getProductId())
                        .map(Product::getTitle)
                        .defaultIfEmpty("Unknown Product");
                    
                    // Fetch buyer name from users table
                    Mono<String> buyerNameMono = productRepository.getUserFullName(order.getBuyerId())
                        .defaultIfEmpty("Buyer #" + order.getBuyerId());
                    
                    return Mono.zip(productTitleMono, buyerNameMono)
                        .map(tuple -> {
                            String productTitle = tuple.getT1();
                            String buyerName = tuple.getT2();
                            return mapOrderToOrderDetail(order, productTitle, buyerName);
                        });
                })
                .collectList()
                .doOnNext(orders -> log.info("Collected {} orders", orders.size())),
            orderRepository.countOrdersBySellerId(sellerId, statusFilter)
                .doOnNext(count -> log.info("Total orders count: {}", count))
                .defaultIfEmpty(0)
        ).map(tuple -> {
            var orders = tuple.getT1();
            var totalCount = tuple.getT2();
            log.info("Returning OrdersResult: orders={}, totalCount={}, page={}, pageSize={}", 
                orders.size(), totalCount, page, pageSize);
            return new OrdersResult(orders, totalCount, page, pageSize);
        })
        .doOnError(e -> log.error("Error getting orders: {}", e.getMessage(), e));
    }
    
    private OrderDetail mapOrderToOrderDetail(com.auction.entities.database.Order order, String productTitle, String buyerName) {
        return OrderDetail.newBuilder()
            .setId(order.getId() != null ? order.getId() : 0)
            .setProductId(order.getProductId() != null ? order.getProductId() : 0)
            .setProductTitle(productTitle != null ? productTitle : "")
            .setBuyerId(order.getBuyerId() != null ? order.getBuyerId() : 0)
            .setBuyerName(buyerName != null ? buyerName : "")
            .setAmount(order.getAmount() != null ? order.getAmount().floatValue() : 0f)
            .setStatus(order.getStatus() != null ? order.getStatus() : "")
            .setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod() : "")
            .setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus() : "pending")
            .setCreatedAt(order.getCreatedAt() != null ? TimeUtils.toEpochSecond(order.getCreatedAt()) * 1000 + "" : "")
            .setUpdatedAt(order.getUpdatedAt() != null ? TimeUtils.toEpochSecond(order.getUpdatedAt()) * 1000 + "" : "")
            .build();
    }
    
    @Transactional
    public Mono<OrderDetail> updateOrderStatus(int sellerId, int orderId, String status) {
        log.info("Updating order status - sellerId: {}, orderId: {}, status: {}", sellerId, orderId, status);

        // Validate status - normalize to lowercase for comparison
        String normalizedStatus = status.trim().toLowerCase();
        if (!ServiceConstants.VALID_ORDER_STATUSES.contains(normalizedStatus)) {
            log.warn("Invalid status provided: {}. Valid statuses: {}", status, ServiceConstants.VALID_ORDER_STATUSES);
            return ServiceExceptionUtils.invalidStatus(status, ServiceConstants.VALID_ORDER_STATUSES);
        }

        // Use normalized status for database update
        String statusToUpdate = normalizedStatus;

        return orderRepository.findById(orderId)
            .switchIfEmpty(ServiceExceptionUtils.orderNotFound(orderId))
            .flatMap(order -> {
                // Verify seller owns the product
                return productRepository.findById(order.getProductId())
                    .switchIfEmpty(ServiceExceptionUtils.productNotFound(order.getProductId()))
                    .flatMap(product -> {
                        if (!product.getSellerId().equals(sellerId)) {
                            log.warn("Seller {} is not authorized to update order {} (product seller: {})",
                                sellerId, orderId, product.getSellerId());
                            return ServiceExceptionUtils.unauthorizedAccess();
                        }
                        
                        return orderRepository.updateOrderStatus(orderId, statusToUpdate)
                            .then(orderRepository.findById(orderId))
                            .flatMap(updatedOrder -> {
                                // Fetch product title and buyer name
                                Mono<String> productTitleMono = productRepository.findById(updatedOrder.getProductId())
                                    .map(Product::getTitle)
                                    .defaultIfEmpty("Unknown Product");
                                
                                Mono<String> buyerNameMono = productRepository.getUserFullName(updatedOrder.getBuyerId())
                                    .defaultIfEmpty("Buyer #" + updatedOrder.getBuyerId());
                                
                                return Mono.zip(productTitleMono, buyerNameMono)
                                    .map(tuple -> mapOrderToOrderDetail(updatedOrder, tuple.getT1(), tuple.getT2()));
                            });
                    });
            })
            .doOnError(e -> log.error("Error updating order status - sellerId: {}, orderId: {}, error: {}", 
                sellerId, orderId, e.getMessage(), e));
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private ProductSummary mapToProductSummary(Product product, String primaryImageUrl) {
        return ProductSummary.newBuilder()
            .setId(product.getId())
            .setTitle(product.getTitle())
            .setCurrentPrice(product.getCurrentPrice().floatValue())
            .setStatus(product.getStatus())
            .setViewsCount(product.getViewsCount())
            .setBidsCount(product.getBidsCount())
            .setEndsAt(TimeUtils.toEpochSecond(product.getEndsAt()) * 1000 + "")
            .setPrimaryImageUrl(primaryImageUrl != null ? primaryImageUrl : "")
            .build();
    }

    private ListingDetail mapToListingDetail(Product product, String primaryImageUrl) {
        return ListingDetail.newBuilder()
            .setId(product.getId())
            .setTitle(product.getTitle())
            .setStatus(product.getStatus())
            .setCurrentPrice(product.getCurrentPrice().floatValue())
            .setBidsCount(product.getBidsCount())
            .setEndsAt(TimeUtils.toEpochSecond(product.getEndsAt()) * 1000 + "")
            .setIsAutoExtend(product.getIsAutoExtend())
            .setAutoExtendSeconds(product.getAutoExtendSeconds())
            .setPrimaryImageUrl(primaryImageUrl != null ? primaryImageUrl : "")
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
                            return ServiceExceptionUtils.bidderAlreadyBanned();
                        }
                        // Insert ban record
                        return sellerRepository.insertProductBan(productId, bidderId, reason)
                            .then(Mono.just(product));
                    });
            })
            .flatMap(product -> {
                // Remove bidder from Redis and recalculate price
                String redisKey = String.format(ServiceConstants.REDIS_KEY_AUCTION_BIDS_PATTERN, productId);
                return redisService.zRemove(redisKey, String.valueOf(bidderId))
                    .then(recalculateCurrentPrice(productId, product))
                        .then(sendBannedUserNotification(bidderId, product, reason))
                        .thenReturn("Bidder rejected successfully")
                        .onErrorResume(e -> {
                            log.warn("Failed to send ban notification, but ban was successful:");
                            return Mono.just("Bidder rejected successfully (notification failed)");
                        });
            })
            .doOnSuccess(result -> log.info("Bidder {} successfully banned from product {} by seller {}", bidderId, productId, sellerId))
            .doOnError(e -> log.error("Error rejecting bidder {} from product {}: {}", bidderId, productId, e.getMessage(), e));
    }
    
    /**
     * Recalculate current price after removing a bidder (same logic as placeBid)
     */
    private Mono<Void> recalculateCurrentPrice(int productId, Product product) {
        String redisKey = String.format(ServiceConstants.REDIS_KEY_AUCTION_BIDS_PATTERN, productId);
        return redisService.zRevRange(redisKey, 0, 1)
            .collectList()
            .flatMap(topBidderIds -> {
                if (topBidderIds.isEmpty()) {
                    // No bidders left - reset to starting price
                    double newCurrentPrice = product.getStartingPrice().doubleValue();
                    log.info("No bidders left for product {}, resetting to starting price: {}", productId, newCurrentPrice);
                    return productRepository.updateProductPrice(productId, newCurrentPrice);
                } else if (topBidderIds.size() == 1) {
                    // Only one bidder left - price = current + step
                    double newCurrentPrice = product.getCurrentPrice().doubleValue() + product.getStepPrice().doubleValue();
                    log.info("Single bidder left for product {}, new price = current + step: {}", productId, newCurrentPrice);
                    return productRepository.updateProductPrice(productId, newCurrentPrice);
                } else {
                    // Two or more bidders - get their scores
                    String firstBidderId = topBidderIds.get(0).toString();
                    String secondBidderId = topBidderIds.get(1).toString();
                    
                    return Mono.zip(
                        redisService.zScore(redisKey, firstBidderId).defaultIfEmpty(0.0),
                        redisService.zScore(redisKey, secondBidderId).defaultIfEmpty(0.0)
                    ).flatMap(scores -> {
                        double firstBidderMaxAmount = scores.getT1();
                        double secondBidderMaxAmount = scores.getT2();
                        double newCurrentPrice;
                        
                        if (firstBidderMaxAmount == secondBidderMaxAmount) {
                            // Equal max amounts - current price is the max amount
                            newCurrentPrice = firstBidderMaxAmount;
                            log.info("Equal max amounts for product {}, price = {}", productId, newCurrentPrice);
                        } else {
                            // First bidder has higher max - price is min(second + step, first max)
                            double secondPlusStep = secondBidderMaxAmount + product.getStepPrice().doubleValue();
                            newCurrentPrice = Math.min(secondPlusStep, firstBidderMaxAmount);
                            log.info("Recalculated price for product {}: second={}, step={}, first={}, result={}", 
                                productId, secondBidderMaxAmount, product.getStepPrice(), firstBidderMaxAmount, newCurrentPrice);
                        }
                        
                        // Update current price in database
                        return productRepository.updateProductPrice(productId, newCurrentPrice);
                    });
                }
            })
            .then();
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
        payload.put("banTime", TimeUtils.now().toString());
        
        RabbitMessage message = RabbitMessage.builder()
            .eventType(EventType.TASK_SEND_MAIL_PRODUCT_BANNED_USER)
            .eventId(UUID.randomUUID().toString())
            .userId(String.valueOf(bidderId))
            .payload(payload)
            .build();
        
        log.info("Sending ban notification to RabbitMQ: userId={}, productId={}, queue={}", 
            bidderId, product.getId(), ServiceConstants.NOTIFICATION_QUEUE);
        
        return rabbitProducer.sendToQueue(ServiceConstants.NOTIFICATION_QUEUE, message)
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

    public record OrdersResult(
        List<OrderDetail> orders,
        int totalCount,
        int page,
        int pageSize
    ) {}

    public record RatingsResult(
        int positiveReviews,
        int negativeReviews,
        List<Review> reviews,
        int totalCount
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
