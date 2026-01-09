package products.service;

import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.Duration;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.auction.entities.msg.EventType;
import com.auction.entities.msg.RabbitMessage;
import com.auction.entities.record.BidHistoryRowRecord;
import com.auction.entities.record.BidRowRecord;
import com.auction.entities.record.ImageRowRecord;
import com.auction.entities.record.ProductDetailsRecord;
import com.auction.entities.record.ProductRowRecord;
import com.auction.entities.record.QuestionRowRecord;
import com.auction.proto.user.*;
import com.auction.rabbitmq.services.ReactiveRabbitProducer;
import com.auction.utils.TimeUtils;

import products.repository.ProductRepository;
import products.repository.ReviewRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class BidderService {
    private static final Logger log = LoggerFactory.getLogger(BidderService.class);
    private static final String NOTIFICATION_QUEUE = "dev";
    
    private final ProductRepository productRepository;
    private final com.auction.redis.service.ReactiveRedisService redisService;
    private final AuctionService auctionService;
    private final products.repository.OrderRepository orderRepository;
    private final ReactiveRabbitProducer rabbitProducer;
    private final products.repository.NotificationRepository notificationRepository;
    private final ReviewRepository reviewRepository;
    
    public BidderService(ProductRepository productRepository, 
                        com.auction.redis.service.ReactiveRedisService redisService,
                        AuctionService auctionService,
                        products.repository.OrderRepository orderRepository,
                        ReactiveRabbitProducer rabbitProducer,
                        products.repository.NotificationRepository notificationRepository,
                        ReviewRepository reviewRepository) {
        this.productRepository = productRepository;
        this.redisService = redisService;
        this.auctionService = auctionService;
        this.orderRepository = orderRepository;
        this.rabbitProducer = rabbitProducer;
        this.notificationRepository = notificationRepository;
        this.reviewRepository = reviewRepository;
    }

    public Mono<Product> getProductDetails(int productId, int userId) {
        log.info("Getting product details for productId={}, userId={}", productId, userId);
        return productRepository.getProductDetailsForBidder(productId)
            .doOnNext(dto -> log.debug("Found product dto: id={}, title={}", dto.id(), dto.title()))
                .publishOn(Schedulers.boundedElastic())
            .doOnSuccess(dto -> {
                if (dto != null) {
                    productRepository.incrementViewCount(productId).subscribe();
                    log.debug("Incremented view count for product {}", productId);
                }
            })
            .switchIfEmpty(Mono.defer(() -> {
                log.warn("Product not found with id: {}", productId);
                return Mono.error(new IllegalArgumentException("Product not found with id: " + productId));
            }))
            .flatMap(productDto ->
                Mono.zip(
                    productRepository.getProductImages(productId)
                        .map(this::mapToProductImage)
                        .collectList()
                        .doOnNext(images -> log.debug("Found {} images for product {}", images.size(), productId)),
                    productRepository.isInWatchlist(userId, productId)
                        .doOnNext(count -> log.debug("Watchlist check for user {}: {}", userId, count)),
                    productRepository.isHighestBidder(productId, userId)
                        .doOnNext(count -> log.debug("Highest bidder check for user {}: {}", userId, count)),
                    productRepository.getUserAutoBid(productId, userId)
                        .defaultIfEmpty(new products.dto.AutoBidRowDto(0, productId, userId, 0.0, TimeUtils.now().toEpochSecond(ZoneOffset.ofHours(7))))
                        .doOnNext(autoBid -> log.debug("Auto bid for user {}: maxAmount={}", userId, autoBid.maxAmount())),
                    productRepository.getProductQuestions(productId, 10, 0)
                        .map(this::mapDtoToQuestion)
                        .collectList()
                        .doOnNext(questions -> log.debug("Found {} questions for product {}", questions.size(), productId))
                ).map(tuple -> {
                    var images = tuple.getT1();
                    var isInWatchlistCount = tuple.getT2();
                    var isHighestBidderCount = tuple.getT3();
                    var autoBidDto = tuple.getT4();
                    var questions = tuple.getT5();
                    
                    boolean isInWatchlist = isInWatchlistCount > 0;
                    boolean isHighestBidder = isHighestBidderCount > 0;
                    double userMaxAutoBid = autoBidDto.maxAmount();
                    log.info("Successfully built product details for productId={}: images={}, inWatchlist={}, isHighestBidder={}, questions={}", 
                        productId, images.size(), isInWatchlist, isHighestBidder, questions.size());
                    return mapDtoToProductWithUserData(productDto, images, questions, isInWatchlist, isHighestBidder, userMaxAutoBid);
                })
            )
            .doOnError(e -> log.error("Error getting product details for productId={}: {}", productId, e.getMessage(), e));
    }

    public Flux<Product> getRelatedProducts(int productId, int limit) {
        return productRepository.findById(productId)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Product not found with id: " + productId)))
                .flatMapMany(product ->
                        productRepository.getRelatedProducts(
                                        product.getCategoryId(),
                                        productId,
                                        limit
                                )
                                .flatMap(dto ->
                                        productRepository.getProductImages(dto.id())
                                                .map(this::mapToProductImage)
                                                .collectList()
                                                .map(images -> mapRowToProductWithImages(dto, images))
                                )
                );
    }

    public Mono<Integer> addToWatchlist(int productId, int userId) {
        return productRepository.addToWatchlist(userId, productId)
                .thenReturn(1);
    }

    public Mono<String> removeFromWatchlist(int productId, int userId) {
        return productRepository.removeFromWatchlist(userId, productId)
                .thenReturn("Removed from watchlist");
    }

    public Mono<WatchlistResult> getWatchlist(int userId, int page, int limit, String status) {
        int offset = (page - 1) * limit;
        return productRepository.getWatchlist(
                        userId,
                        status.isEmpty() ? null : status,
                        limit,
                        offset
                )
                .collectList()
                .flatMap(productDtos -> {
                    int totalCount = productDtos.size();
                    
                    return Flux.fromIterable(productDtos)
                            .flatMap(productRowDto ->
                                    productRepository.getProductImages(productRowDto.id())
                                            .map(this::mapToProductImage)
                                            .collectList()
                                            .map(images -> mapRowToProductWithImages(productRowDto, images))
                            )
                            .collectList()
                            .map(products -> {
                                var pageInfo = PageInfo.newBuilder()
                                        .setCurrentPage(page)
                                        .setPageSize(limit)
                                        .setTotalItems(totalCount)
                                        .setTotalPages((totalCount + limit - 1) / limit)
                                        .setHasNext(page * limit < totalCount)
                                        .setHasPrevious(page > 1)
                                        .build();
                                
                                return new WatchlistResult(products, pageInfo);
                            });
                });
    }

    public Mono<QuestionResult> askQuestion(int productId, int userId, String question) {
        log.info("User {} asking question on product {}", userId, productId);
        return productRepository.insertQuestion(productId, userId, question)
            .then(Mono.defer(() -> {
                long createdAt = System.currentTimeMillis() / 1000;
                log.info("Question added successfully for product {} by user {}", productId, userId);
                return Mono.just(new QuestionResult(0, createdAt));
            }))
            .doOnError(e -> log.error("Error adding question for product {}: {}", productId, e.getMessage(), e));
    }

    public Mono<QuestionsResult> getProductQuestions(int productId, int page, int limit) {
        int offset = (page - 1) * limit;
        
        return Mono.zip(
            productRepository.getProductQuestions(productId, limit, offset)
                .collectList(),
            productRepository.countProductQuestions(productId)
        ).map(tuple -> {
            var questionDtos = tuple.getT1();
            int totalCount = tuple.getT2();
            
            var questions = questionDtos.stream()
                .map(this::mapDtoToQuestion)
                .toList();
            
            var pageInfo = PageInfo.newBuilder()
                .setCurrentPage(page)
                .setPageSize(limit)
                .setTotalItems(totalCount)
                .setTotalPages((totalCount + limit - 1) / limit)
                .setHasNext(page * limit < totalCount)
                .setHasPrevious(page > 1)
                .build();
            
            return new QuestionsResult(questions, pageInfo);
        });
    }

    public Mono<BidsResult> getProductBids(int productId, int userId, int page, int limit) {
        int offset = (page - 1) * limit;
        
        return Mono.zip(
            productRepository.getProductBids(productId, limit, offset)
                .collectList(),
            productRepository.countProductBids(productId)
        ).map(tuple -> {
            var bidDtos = tuple.getT1();
            int totalCount = tuple.getT2();
            
            var bids = bidDtos.stream()
                .map(dto -> mapDtoToBid(dto, userId))
                .toList();
            
            var pageInfo = PageInfo.newBuilder()
                .setCurrentPage(page)
                .setPageSize(limit)
                .setTotalItems(totalCount)
                .setTotalPages((totalCount + limit - 1) / limit)
                .setHasNext(page * limit < totalCount)
                .setHasPrevious(page > 1)
                .build();
            
            return new BidsResult(bids, pageInfo);
        });
    }

    @Transactional(rollbackFor = Exception.class, timeout = 10)
    public Mono<PlaceBidResult> placeBid(int productId, int userId, double bidAmount) {
        log.info("User {} placing bid {} on product {}", userId, bidAmount, productId);
        
        // Use pessimistic lock to prevent race conditions
        // Lock is automatically released when transaction commits or rolls back
        return productRepository.findByIdForUpdate(productId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Product not found")))
            .flatMap(product -> {
                // Validate product status
                if (!"active".equals(product.getStatus())) {
                    return Mono.error(new IllegalStateException("Product is not active"));
                }
                
                // Validate bid time
                LocalDateTime now = TimeUtils.now();
                if (now.isBefore(product.getStartsAt())) {
                    return Mono.error(new IllegalStateException("Auction has not started yet"));
                }
                if (now.isAfter(product.getEndsAt())) {
                    return Mono.error(new IllegalStateException("Auction has ended"));
                }
                
                // Validate bid amount
                double minBid = product.getCurrentPrice().add(product.getStepPrice()).doubleValue();

                if (bidAmount < minBid) {
                    return Mono.error(new IllegalArgumentException(
                        String.format("Bid amount must be at least %.2f", minBid)));
                }
                
                // Insert bid into database and fetch user info for Redis
                return Mono.zip(
                    productRepository.getUserEmail(userId).defaultIfEmpty(""),
                    productRepository.getUserFullName(userId).defaultIfEmpty("")
                )
                .flatMap(userInfo -> {
                    String email = userInfo.getT1();
                    String userName = userInfo.getT2();
                    
                    return productRepository.insertBid(productId, userId, bidAmount, false)
                        .then(productRepository.updateProductPrice(productId, bidAmount))
                        .then(redisService.zAdd("auction:" + productId + ":bids", String.valueOf(userId), bidAmount))
                        .then(saveBidderProfileToRedis(productId, userId, bidAmount, email, userName))
                        .then(checkAndNotifyOutbid(productId, userId, bidAmount, product.getTitle(), product.getEndsAt()));
                })
                    .then(Mono.defer(() -> {
                        // Handle auto-extend
                        if (product.getIsAutoExtend()) {
                            Duration timeLeft = Duration.between(now, product.getEndsAt());
                            if (timeLeft.getSeconds() < product.getAutoExtendSeconds()) {
                                 LocalDateTime newEndTime = now.plusSeconds(product.getAutoExtendSeconds());
                                log.info("Auto-extending product {} from {} to {}", 
                                    productId, product.getEndsAt(), newEndTime);
                                
                                return productRepository.updateProductEndTime(productId, newEndTime)
                                    .then(Mono.fromRunnable(() -> {
                                        // Reschedule auction end
                                        auctionService.scheduleEndAuction(
                                                (long) productId,
                                            TimeUtils.toInstant(newEndTime),
                                            () -> handleAuctionEnd(productId)
                                        );
                                    }));
                            }
                        }
                        return Mono.empty();
                    }))
                    .then(Mono.defer(() -> {
                        double nextMinBid = bidAmount + product.getStepPrice().doubleValue();
                        long timestamp = System.currentTimeMillis() / 1000;
                        
                        return Mono.just(new PlaceBidResult(0, bidAmount, nextMinBid, timestamp, true));
                    }));
            })
            .doOnSuccess(result -> log.info("Bid placed successfully: product={}, user={}, amount={}", 
                productId, userId, bidAmount))
            .doOnError(e -> log.error("Error placing bid: product={}, user={}, amount={}, error={}", 
                productId, userId, bidAmount, e.getMessage()));
    }

    @Transactional(rollbackFor = Exception.class, timeout = 10)
    public Mono<AutoBidResult> setAutoBid(int productId, int userId, double maxAmount) {
        log.info("User {} setting auto-bid {} on product {}", userId, maxAmount, productId);
        
        // Use pessimistic lock to prevent race conditions
        // Lock is automatically released when transaction commits or rolls back
        return productRepository.findByIdForUpdate(productId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Product not found")))
            .flatMap(product -> {
                if (!"active".equals(product.getStatus())) {
                    return Mono.error(new IllegalStateException("Product is not active"));
                }
                
                if (maxAmount <= product.getCurrentPrice().doubleValue()) {
                    return Mono.error(new IllegalArgumentException(
                        "Max bid amount must be higher than current price"));
                }
                
                return productRepository.upsertAutoBid(productId, userId, maxAmount)
                    .then(Mono.defer(() -> {
                        long timestamp = System.currentTimeMillis() / 1000;
                        return Mono.just(new AutoBidResult(0, maxAmount, product.getCurrentPrice().doubleValue(), timestamp));
                    }));
            })
            .doOnSuccess(result -> log.info("Auto-bid set successfully: product={}, user={}, maxAmount={}", 
                productId, userId, maxAmount))
            .doOnError(e -> log.error("Error setting auto-bid: {}", e.getMessage()));
    }

    @Transactional(rollbackFor = Exception.class, timeout = 15)
    public Mono<BuyNowResult> buyNowProduct(int productId, int userId) {
        log.info("User {} attempting to buy now product {}", userId, productId);
        
        // Use pessimistic lock to prevent race conditions
        // Lock is automatically released when transaction commits or rolls back
        return productRepository.findByIdForUpdate(productId)
        .switchIfEmpty(Mono.error(new IllegalArgumentException("Product not found")))
        .flatMap(product -> {

            // Check product status
            if (!"active".equals(product.getStatus())) {
                return Mono.error(new IllegalStateException("Product is not active"));
            }

            // Check if buy now price is set
            if (product.getBuyNowPrice() == null || product.getBuyNowPrice().doubleValue() <= 0) {
                return Mono.error(new IllegalStateException("Buy now is not available for this product"));
            }

            // Check auction time
            LocalDateTime now = TimeUtils.now();
            if (now.isBefore(product.getStartsAt())) {
                return Mono.error(new IllegalStateException("Auction has not started yet"));
            }
            if (now.isAfter(product.getEndsAt())) {
                return Mono.error(new IllegalStateException("Auction has ended"));
            }

            // Check user eligibility: positive_reviews > 4 * negative_reviews
//            int positiveReviews = reviewCounts.positiveReviews();
//            int negativeReviews = reviewCounts.negativeReviews();
//
//            log.info("User {} review counts - positive: {}, negative: {}", userId, positiveReviews, negativeReviews);

//            if (positiveReviews <= 4 * negativeReviews) {
//                return Mono.error(new IllegalStateException(
//                    String.format("User not eligible for buy now. Positive reviews (%d) must be > 4 × negative reviews (%d)",
//                        positiveReviews, negativeReviews)));
//            }

            double buyNowPrice = product.getBuyNowPrice().doubleValue();

            // Update product status to ended
            return productRepository.updateStatus(productId, "ended")
                .then(productRepository.updateProductPrice(productId, buyNowPrice))
                .then(orderRepository.createOrder(
                    productId,
                    userId,
                    product.getSellerId(),
                    buyNowPrice
                ))
                .then(Mono.defer(() -> {
                    log.info("Buy now successful - Order created: productId={}, buyerId={}, sellerId={}, price={}",
                        productId, userId, product.getSellerId(), buyNowPrice);

                    long timestamp = System.currentTimeMillis() / 1000;
                    BuyNowResult result = new BuyNowResult(0, buyNowPrice, timestamp);

                    // Create conversation and send notifications (fire and forget)
                    Mono.when(
                        createConversationForOrder(product, userId, buyNowPrice),
                        sendBuyNowBuyerNotification(product, userId, buyNowPrice),
                        sendBuyNowSellerNotification(product, userId, buyNowPrice)
                    ).subscribe();

                    return Mono.just(result);
                }));
        })
        .doOnSuccess(result -> log.info("Buy now completed successfully: product={}, user={}, orderId={}",
            productId, userId, result.orderId()))
        .doOnError(e -> log.error("Error in buy now: product={}, user={}, error={}",
            productId, userId, e.getMessage()));
    }
    
    /**
     * Handle auction end - called by scheduler
     */
    @Transactional
    protected void handleAuctionEnd(int productId) {
        log.info("Handling auction end for product {}", productId);
        
        String redisKey = "auction:" + productId + ":bids";
        
        // Get banned users and top bidders in parallel
        Mono.zip(
            productRepository.getBannedUserIds(productId).collectList(),
            redisService.zRevRange(redisKey, 0, 4).collectList()
        )
        .flatMap(tuple -> {
            var bannedUserIds = tuple.getT1();
            var topBidders = tuple.getT2();
            
            log.info("Top 5 bidders for product {}: {}", productId, topBidders);
            log.info("Banned users for product {}: {}", productId, bannedUserIds);
            
            // Filter out banned users from top bidders
            var eligibleWinners = topBidders.stream()
                .filter(bidder -> {
                    try {
                        int bidderId = Integer.parseInt(bidder.toString());
                        boolean isBanned = bannedUserIds.contains(bidderId);
                        if (isBanned) {
                            log.warn("Bidder {} is banned from product {}", bidderId, productId);
                        }
                        return !isBanned;
                    } catch (NumberFormatException e) {
                        log.error("Invalid bidder ID format: {}", bidder);
                        return false;
                    }
                })
                .toList();
            
            // Update product status to ended
            return productRepository.updateStatus(productId, "ended")
                .then(Mono.defer(() -> {
                    if (eligibleWinners.isEmpty()) {
                        log.warn("No eligible winner for product {} - all top bidders are banned", productId);
                        return Mono.empty();
                    }
                    
                    int winnerId = Integer.parseInt(eligibleWinners.getFirst().toString());
                    log.info("Winner for product {}: User ID {}", productId, winnerId);
                    
                    // Get winner's bid amount and product details to create order
                    return redisService.zScore(redisKey, String.valueOf(winnerId))
                        .flatMap(winningBid -> 
                            productRepository.findById(productId)
                                .flatMap(product -> {
                                    log.info("Creating order for product {}: winner={}, amount={}", 
                                        productId, winnerId, winningBid);
                                    
                                    // Create order in database
                                    return orderRepository.createOrder(
                                        productId,
                                        winnerId,
                                        product.getSellerId(),
                                        winningBid
                                    )
                                            .then(Mono.defer(() -> {
                                                log.info("Order created successfully: productId={}, buyerId={}, sellerId={}, amount={}",
                                                    productId, winnerId, product.getSellerId(), winningBid);
                                                return productRepository.findById(productId)
                                                    .flatMap(prod -> Mono.when(
                                                        createConversationForOrder(product, winnerId, winningBid),
                                                        sendAuctionEndedWinnerNotification(product, winnerId, winningBid),
                                                        sendAuctionEndedSellerNotification(product, winnerId, winningBid)
                                                    ));
                                            }));
                                })
                        )
                        .switchIfEmpty(Mono.defer(() -> {
                            log.error("Could not get winning bid amount for user {} on product {}", 
                                winnerId, productId);
                            return Mono.empty();
                        }));
                }));
        })
        .doOnError(e -> log.error("Error handling auction end for product {}: {}", 
            productId, e.getMessage(), e))
        .subscribe();
    }

    /**
     * Check if previous bidder was outbid and send notification
     */
    private Mono<Void> checkAndNotifyOutbid(int productId, int currentBidderId, double newBidAmount, 
                                            String productName, LocalDateTime auctionEndTime) {
        String redisKey = "auction:" + productId + ":bids";
        
        log.debug("Checking for outbid on product {}", productId);
        
        // Get top 2 bidders to find the previous highest bidder
        return redisService.zRevRange(redisKey, 0, 1)
            .collectList()
            .flatMap(topBidders -> {
                if (topBidders.size() < 2) {
                    // No previous bidder or only current bidder
                    log.debug("No previous bidder to notify for product {}", productId);
                    return Mono.empty();
                }
                
                // The first is current bidder, second is the outbid bidder
                String outbidUserIdStr = topBidders.get(1).toString();
                int outbidUserId = Integer.parseInt(outbidUserIdStr);
                
                // Don't notify if it's the same user bidding again
                if (outbidUserId == currentBidderId) {
                    log.debug("Same user bidding again, no outbid notification needed");
                    return Mono.empty();
                }
                
                log.info("User {} was outbid on product {} by user {}", outbidUserId, productId, currentBidderId);
                
                // Get outbid bidder's profile from Redis
                String profileKey = "profile:" + outbidUserId + ":" + productId;
                return redisService.hGetAll(profileKey)
                    .flatMap(profileData -> {
                        if (profileData.isEmpty()) {
                            log.warn("No profile found in Redis for user {} on product {}", outbidUserId, productId);
                            return Mono.empty();
                        }
                        
                        String previousBidAmount = profileData.getOrDefault("bidAmount", "0.00").toString();
                        double bidDifference = newBidAmount - Double.parseDouble(previousBidAmount);
                        
                        // Send outbid notification via RabbitMQ
                        return sendOutbidNotification(
                            productId,
                            productName,
                            outbidUserId,
                            previousBidAmount,
                            newBidAmount,
                            bidDifference,
                            auctionEndTime,
                            Duration.between(TimeUtils.now(), auctionEndTime).toString(),
                        );
                    });
            })
            .doOnError(e -> log.error("Error checking outbid for product {}: {}", productId, e.getMessage()))
            .onErrorResume(e -> Mono.empty()) // Continue even if notification fails
            .then();
    }
    
    /**
     * Send outbid notification via RabbitMQ
     */
    private Mono<Void> sendOutbidNotification(int productId, String productName, int outbidUserId,
                                             String yourBidAmount, double newHighestBid, double bidDifference,
                                             LocalDateTime auctionEndTime, String timeRemaining) {
        java.util.Map<String, String> payload = new java.util.HashMap<>();
        payload.put("userId", String.valueOf(outbidUserId));
        payload.put("productId", String.valueOf(productId));
        payload.put("productName", productName);
        payload.put("yourBidAmount", yourBidAmount);
        payload.put("newHighestBid", String.format("%.2f", newHighestBid));
        payload.put("bidDifference", String.format("%.2f", bidDifference));
        payload.put("outbidTime", TimeUtils.now().toString());
        payload.put("auctionEndTime", auctionEndTime.toString());
        payload.put("timeRemaining", timeRemaining);
        payload.put("auctionLink", "http://localhost:3000/products/" + productId);
        
        RabbitMessage message = RabbitMessage.builder()
            
            .eventType(EventType.TASK_SEND_MAIL_OUTBID)
            .userId(String.valueOf(outbidUserId))
            .payload(payload)
            .build();
        
        log.info("Sending outbid notification: userId={}, productId={}, yourBid={}, newBid={}",
            outbidUserId, productId, yourBidAmount, newHighestBid);
        
        return rabbitProducer.sendToQueue(NOTIFICATION_QUEUE, message)
            .doOnSuccess(v -> log.info("Outbid notification sent successfully: userId={}, productId={}",
                outbidUserId, productId))
            .doOnError(e -> log.error("Failed to send outbid notification: userId={}, productId={}, error={}",
                outbidUserId, productId, e.getMessage(), e))
            .onErrorResume(e -> Mono.empty());
    }

    /**
     * Save bidder profile information to Redis for quick access
     * Key format: profile:{userId}:{productId}
     */
    private Mono<Void> saveBidderProfileToRedis(int productId, int userId, double bidAmount, String email, String userName) {
        String profileKey = "profile:" + userId + ":" + productId;
        
        log.debug("Saving bidder profile to Redis: key={}, bidAmount={}, email={}, userName={}", 
            profileKey, bidAmount, email, userName);
        
        // Save each field individually using hSet
        return Mono.when(
            redisService.hSet(profileKey, "userId", String.valueOf(userId)),
            redisService.hSet(profileKey, "productId", String.valueOf(productId)),
            redisService.hSet(profileKey, "bidAmount", String.format("%.2f", bidAmount)),
            redisService.hSet(profileKey, "email", email != null ? email : ""),
            redisService.hSet(profileKey, "userName", userName != null ? userName : "")
        )
        .then(redisService.expire(profileKey, Duration.ofSeconds(86400 * 15))) // Expire after 15 days
        .doOnSuccess(v -> log.debug("Bidder profile saved to Redis: userId={}, productId={}, email={}", 
            userId, productId, email))
        .doOnError(e -> log.error("Failed to save bidder profile to Redis: userId={}, productId={}, error={}", 
            userId, productId, e.getMessage()))
        .onErrorResume(e -> Mono.empty()) // Continue even if Redis save fails
        .then();
    }
    
    /**
     * Send notification to winner when auction ends
     */
    private Mono<Void> sendAuctionEndedWinnerNotification(com.auction.entities.database.Product product, int winnerId, double winningAmount) {
        log.info("Preparing auction ended notification to winner: userId={}, productId={}, winningAmount={}",
            winnerId, product.getId(), winningAmount);

        Map<String, String> payload = new HashMap<>();
        payload.put("recipientType", "bidder");
        payload.put("userId", String.valueOf(winnerId));
        payload.put("productId", String.valueOf(product.getId()));
        payload.put("productName", product.getTitle());
        payload.put("isWinner", "true");
        payload.put("winningAmount", String.format("%.2f", winningAmount));
        payload.put("yourBidAmount", String.format("%.2f", winningAmount));
        payload.put("auctionEndTime", product.getEndsAt().toString());
        payload.put("totalBids", String.valueOf(product.getBidsCount()));
        
        RabbitMessage message = RabbitMessage.builder()
            .eventType(EventType.TASK_SEND_MAIL_ENDED_AUCTION)
            .userId(String.valueOf(winnerId))
            .payload(payload)
            .build();
        
        log.info("Sending auction ended notification to winner: userId={}, productId={}",
            winnerId, product.getId());
        
        return rabbitProducer.sendToQueue(NOTIFICATION_QUEUE, message)
            .doOnSuccess(v -> log.info("Auction ended notification sent to winner successfully: userId={}, productId={}",
                winnerId, product.getId()))
            .doOnError(e -> log.error("Failed to send auction ended notification to winner: userId={}, productId={}, error={}",
                winnerId, product.getId(), e.getMessage(), e));
    }
    
    /**
     * Send notification to seller when auction ends with a winner
     */
    private Mono<Void> sendAuctionEndedSellerNotification(com.auction.entities.database.Product product, int winnerId, double finalPrice) {
        log.info("Preparing auction ended notification to seller: sellerId={}, productId={}, finalPrice={}",
            product.getSellerId(), product.getId(), finalPrice);
            
        Map<String, String> payload = new HashMap<>();
        payload.put("recipientType", "seller");
        payload.put("sellerId", String.valueOf(product.getSellerId()));
        payload.put("productId", String.valueOf(product.getId()));
        payload.put("productName", product.getTitle());
        payload.put("isSold", "true");
        payload.put("finalPrice", String.format("%.2f", finalPrice));
        payload.put("userId", String.valueOf(winnerId));
        payload.put("totalBids", String.valueOf(product.getBidsCount()));
        payload.put("auctionEndTime", String.valueOf(product.getEndsAt()));
        
        RabbitMessage message = RabbitMessage.builder()
            
            .eventType(EventType.TASK_SEND_MAIL_ENDED_AUCTION)
            .userId(String.valueOf(product.getSellerId()))
            .payload(payload)
            .build();
        
        log.info("Sending auction ended notification to seller: sellerId={}, productId={}",
            product.getSellerId(), product.getId());
        
        return rabbitProducer.sendToQueue(NOTIFICATION_QUEUE, message)
            .doOnSuccess(v -> log.info("Auction ended notification sent to seller successfully: sellerId={}, productId={}",
                product.getSellerId(), product.getId()))
            .doOnError(e -> log.error("Failed to send auction ended notification to seller: sellerId={}, productId={}, error={}",
                product.getSellerId(), product.getId(), e.getMessage(), e));
    }
    
    /**
     * Send notification to buyer when they buy now
     */
    private Mono<Void> sendBuyNowBuyerNotification(com.auction.entities.database.Product product, int buyerId, double buyNowPrice) {
        log.info("Preparing buy now notification to buyer: userId={}, productId={}, price={}",
            buyerId, product.getId(), buyNowPrice);
            
        Map<String, String> payload = new HashMap<>();
        payload.put("recipientType", "buyer");
        payload.put("userId", String.valueOf(buyerId));
        payload.put("productId", String.valueOf(product.getId()));
        payload.put("productName", product.getTitle());
        payload.put("purchaseType", "buy_now");
        payload.put("price", String.format("%.2f", buyNowPrice));
        payload.put("purchaseTime", TimeUtils.now().toString());
        
        RabbitMessage message = RabbitMessage.builder()
                
            .eventType(EventType.TASK_SEND_MAIL_SUCCESS_BID)
            .userId(String.valueOf(buyerId))
            .payload(payload)
            .build();
        
        log.info("Sending buy now notification to buyer: userId={}, productId={}",
            buyerId, product.getId());
        
        return rabbitProducer.sendToQueue(NOTIFICATION_QUEUE, message)
            .doOnSuccess(v -> log.info("Buy now notification sent to buyer successfully"))
            .doOnError(e -> log.error("Failed to send buy now notification to buyer: {}", e.getMessage()));
    }
    
    /**
     * Send notification to seller when product is bought via buy now
     */
    private Mono<Void> sendBuyNowSellerNotification(com.auction.entities.database.Product product, int buyerId, double buyNowPrice) {
        log.info("Preparing buy now notification to seller: sellerId={}, productId={}, price={}",
            product.getSellerId(), product.getId(), buyNowPrice);
        
        // Query seller email and userName, and buyer name from database
        
        Map<String, String> payload = new HashMap<>();
        payload.put("recipientType", "seller");
        payload.put("sellerId", String.valueOf(product.getSellerId()));
        payload.put("userId", String.valueOf(buyerId));
        payload.put("productId", String.valueOf(product.getId()));
        payload.put("productName", product.getTitle());
        payload.put("purchaseType", "buy_now");
        payload.put("price", String.format("%.2f", buyNowPrice));
        payload.put("purchaseTime", TimeUtils.now().toString());
        
        RabbitMessage message = RabbitMessage.builder()
                
            .eventType(EventType.TASK_SEND_MAIL_SUCCESS_BID)
            .userId(String.valueOf(product.getSellerId()))
            .payload(payload)
            .build();
        
        log.info("Sending buy now notification to seller: sellerId={}, productId={}",
            product.getSellerId(), product.getId());
        
        return rabbitProducer.sendToQueue(NOTIFICATION_QUEUE, message)
            .doOnSuccess(v -> log.info("Buy now notification sent to seller successfully"))
            .doOnError(e -> log.error("Failed to send buy now notification to seller: {}", e.getMessage()));
    }

    public Mono<MyBidsResult> getMyBids(int userId, int page, int limit, String filter) {
        int offset = (page - 1) * limit;
        
        return Mono.zip(
            productRepository.getMyBids(userId, limit, offset)
                .collectList(),
            productRepository.countMyBids(userId)
        ).map(tuple -> {
            var bidHistoryDtos = tuple.getT1();
            int totalCount = tuple.getT2();
            
            var bids = bidHistoryDtos.stream()
                .map(this::mapDtoToBidHistoryItem)
                .toList();
            
            var pageInfo = PageInfo.newBuilder()
                .setCurrentPage(page)
                .setPageSize(limit)
                .setTotalItems(totalCount)
                .setTotalPages((totalCount + limit - 1) / limit)
                .setHasNext(page * limit < totalCount)
                .setHasPrevious(page > 1)
                .build();
            
            return new MyBidsResult(bids, pageInfo);
        });
    }
    
    // Helper mapping methods
    private Product mapRowToProductWithImages(ProductRowRecord dto, List<ProductImage> images) {
        return Product.newBuilder()
                .setId(dto.id())
                .setSellerId(dto.sellerId())
                .setCategoryId(dto.categoryId())
                .setCategoryName(dto.categoryName())
                .setTitle(dto.title())
                .setDescription(dto.description())
                .setStartingPrice(dto.startingPrice())
                .setCurrentPrice(dto.currentPrice())
                .setStepPrice(dto.stepPrice())
                .setBuyNowPrice(dto.buyNowPrice())
                .setStartsAt(dto.startsAt().toEpochSecond())
                .setEndsAt(dto.endsAt().toEpochSecond())
                .setCreatedAt(dto.createdAt().toEpochSecond())
                .setUpdatedAt(dto.updatedAt().toEpochSecond())
                .setIsAutoExtend(dto.isAutoExtend())
                .setAutoExtendSeconds(dto.autoExtendSeconds())
                .setStatus(dto.status())
                .setViewsCount(dto.viewsCount())
                .setBidsCount(dto.bidsCount())
                .addAllImages(images)
                .build();
    }
    
    private Product mapDtoToProductWithUserData(ProductDetailsRecord dto, List<ProductImage> images,
                                                 List<Question> questions, boolean isInWatchlist, 
                                                 boolean isHighestBidder, double userMaxAutoBid) {
        Product.Builder productBuilder = Product.newBuilder()
            .setId(dto.id())
            .setSellerId(dto.sellerId())
            .setCategoryId(dto.categoryId())
            .setCategoryName(dto.categoryName())
            .setTitle(dto.title())
            .setDescription(dto.description())
            .setStartingPrice(dto.startingPrice())
            .setCurrentPrice(dto.currentPrice())
            .setStepPrice(dto.stepPrice())
            .setBuyNowPrice(dto.buyNowPrice())
            .setStartsAt(TimeUtils.toEpochSecond(dto.startsAt()))
            .setEndsAt(TimeUtils.toEpochSecond(dto.endsAt()))
            .setCreatedAt(TimeUtils.toEpochSecond(dto.createdAt()))
            .setUpdatedAt(TimeUtils.toEpochSecond(dto.updatedAt()))
            .setIsAutoExtend(dto.isAutoExtend())
            .setAutoExtendSeconds(dto.autoExtendSeconds())
            .setStatus(dto.status())
            .setViewsCount(dto.viewsCount())
            .setBidsCount(dto.bidsCount())
            .addAllImages(images)
            .addAllQuestions(questions)
            .setIsInWatchlist(isInWatchlist)
            .setIsUserHighestBidder(isHighestBidder)
            .setUserMaxAutoBid(userMaxAutoBid);
        
        // Map seller info if available
        if (dto.sellerName() != null) {
            SellerInfo sellerInfo = SellerInfo.newBuilder()
                .setId(dto.sellerId())
                .setFullName(dto.sellerName())
                .setEmail(dto.sellerEmail() != null ? dto.sellerEmail() : "")
                .setRatingPercent(dto.sellerRatingPercent())
                .setPositiveReviews(dto.sellerPositiveReviews())
                .setNegativeReviews(dto.sellerNegativeReviews())
                .build();
            productBuilder.setSellerInfo(sellerInfo);
        }
        
        return productBuilder.build();
    }
    
    private Question mapDtoToQuestion(QuestionRowRecord dto) {
        return Question.newBuilder()
            .setId(dto.id())
            .setProductId(dto.productId())
            .setAskerId(dto.askerId())
            .setAskerName(dto.askerName() != null ? dto.askerName() : "")
            .setQuestion(dto.question() != null ? dto.question() : "")
            .setAnswer(dto.answer() != null ? dto.answer() : "")
            .setAnsweredBy(dto.answeredBy() != null ? dto.answeredBy() : 0)
            .setAnswererName(dto.answererName() != null ? dto.answererName() : "")
            .setCreatedAt(dto.createdAtSeconds())
            .setAnsweredAt(dto.answeredAtSeconds())
            .build();
    }
    
    private Bid mapDtoToBid(BidRowRecord dto, int userId) {
        return Bid.newBuilder()
            .setId(dto.id())
            .setProductId(dto.productId())
            .setBidderId(dto.bidderId())
            .setBidderNameMasked(dto.bidderNameMasked())
            .setAmount(dto.amount())
            .setIsAuto(dto.isAuto())
            .setCreatedAt(dto.createdAtSeconds())
            .setIsCurrentUser(dto.bidderId() == userId)
            .build();
    }
    
    private BidHistoryItem mapDtoToBidHistoryItem(BidHistoryRowRecord dto) {
        return BidHistoryItem.newBuilder()
            .setBidId(dto.bidId())
            .setProductId(dto.productId())
            .setProductTitle(dto.productTitle() != null ? dto.productTitle() : "")
            .setProductPrimaryImage(dto.productPrimaryImage() != null ? dto.productPrimaryImage() : "")
            .setBidAmount(dto.bidAmount())
            .setCurrentPrice(dto.currentPrice())
            .setIsAuto(dto.isAuto() != 0)
            .setIsWinning(dto.isWinning() != 0 && dto.isBanned() == 0)
            .setProductStatus(dto.productStatus() != null ? dto.productStatus() : "")
            .setBidCreatedAt(dto.bidCreatedAt().toEpochSecond())
            .setProductEndsAt(dto.productEndsAt().toEpochSecond())
            .build();
    }

    private ProductImage mapToProductImage(ImageRowRecord dto) {
        return ProductImage.newBuilder()
                .setId(dto.id())
                .setProductId(dto.product_id())
                .setUrl(dto.url())
                .setIsPrimary(dto.is_primary())
                .setCreatedAt(dto.created_at().toEpochSecond())
                .build();
    }
    
    /**
     * Create conversation for order
     * @param product the product
     * @param buyerId the buyer/bidder ID
     * @param amount the order amount
     * @return Mono<Void>
     */
    private Mono<Void> createConversationForOrder(com.auction.entities.database.Product product, int buyerId, double amount) {
        log.info("Creating conversation for buyer={}, seller={}, product={}", buyerId, product.getSellerId(), product.getId());
        
        // Get buyer and seller information
        return Mono.zip(
            productRepository.getUserFullName(buyerId).defaultIfEmpty("Buyer"),
            productRepository.getUserFullName(product.getSellerId()).defaultIfEmpty("Seller"),
            productRepository.getProductImages(product.getId())
                .filter(img -> img.is_primary())
                .map(img -> img.url())
                .next()
                .defaultIfEmpty(""),
            orderRepository.findOrderIdByProductAndUsers(product.getId(), buyerId, product.getSellerId())
        )
        .flatMap(userInfo -> {
            String buyerName = userInfo.getT1();
            String sellerName = userInfo.getT2();
            String productImage = userInfo.getT3();
            Integer orderId = userInfo.getT4();
            
            return orderRepository.createConversation(
                String.valueOf(orderId),
                String.valueOf(product.getSellerId()),
                sellerName,
                String.valueOf(buyerId),
                buyerName,
                product.getTitle(),
                productImage,
                amount
            );
        })
        .doOnError(e -> log.error("Failed to create conversation for order: {}", e.getMessage(), e))
        .onErrorResume(e -> {
            // Log error but don't fail the order creation
            log.warn("Continuing despite conversation creation failure for order");
            return Mono.empty();
        });
    }

    // Helper records for return types
    public static record WatchlistResult(List<Product> products, PageInfo pageInfo) {}
    public static record QuestionResult(int questionId, long createdAt) {}
    public static record QuestionsResult(List<Question> questions, PageInfo pageInfo) {}
    public static record BidsResult(List<Bid> bids, PageInfo pageInfo) {}
    public static record PlaceBidResult(int bidId, double currentPrice, double nextMinBid, long createdAt, boolean isHighestBidder) {}
    public static record AutoBidResult(int autoBidId, double maxAmount, double currentBid, long createdAt) {}
    public static record MyBidsResult(List<BidHistoryItem> bids, PageInfo pageInfo) {}
    public static record NotificationsResult(List<UserNotification> notifications, long unreadCount) {}
    public static record BuyNowResult(int orderId, double price, long createdAt) {}
    public static record BidderRatingsResult(
        int positiveReviews,
        int negativeReviews,
        float ratingPercent,
        List<BidderReview> reviews,
        int totalCount
    ) {}
    public static record BidderReview(
        int id,
        int fromUserId,
        String fromUserName,
        int score,
        String comment,
        String createdAt
    ) {}

    /**
     * Get user notifications (all notifications, no pagination)
     * Flow: 
     * 1. Query all notifications from NotificationRepository for the user
     * 2. Get unread count
     * 3. Map Notification entities to UserNotification proto messages
     * 4. Return NotificationsResult with notifications list and unread count
     */
    public Mono<NotificationsResult> getUserNotifications(int userId) {
        log.info("Getting notifications for userId={}", userId);
        
        // Get all notifications ordered by created_at DESC (newest first)
        Mono<List<UserNotification>> notificationsMono = 
            notificationRepository.findByUserIdPaginated(userId, 100, 0) // Get latest 100
                .map(notification -> UserNotification.newBuilder()
                    .setId(notification.getId())
                    .setUserId(notification.getUserId())
                    .setType(notification.getType() != null ? notification.getType() : "")
                    .setPayload(notification.getPayload() != null ? notification.getPayload() : "")
                    .setIsRead(notification.getIsRead() != null ? notification.getIsRead() : false)
                    .setCreatedAt(notification.getCreatedAt() != null ? 
                        notification.getCreatedAt().toEpochSecond(java.time.ZoneOffset.UTC) : 0)
                    .build())
                .collectList();
        
        // Get unread count
        Mono<Long> unreadCountMono = notificationRepository.countUnreadByUserId(userId);
        
        return Mono.zip(notificationsMono, unreadCountMono)
            .map(tuple -> new NotificationsResult(tuple.getT1(), tuple.getT2()))
            .doOnNext(result -> log.info("Retrieved {} notifications, {} unread for userId={}", 
                result.notifications().size(), result.unreadCount(), userId));
    }

    /**
     * Mark notification as read
     * Flow:
     * 1. Verify notification exists and belongs to user
     * 2. Mark notification as read in NotificationRepository
     * 3. Return success message
     */
    public Mono<String> markNotificationAsRead(int notificationId, int userId) {
        log.info("Marking notification as read - notificationId={}, userId={}", notificationId, userId);
        
        return notificationRepository.findByIdAndUserId(notificationId, userId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Notification not found or does not belong to user")))
            .flatMap(notification -> {
                if (notification.getIsRead()) {
                    return Mono.just("Notification already marked as read");
                }
                return notificationRepository.markAsRead(notificationId, userId)
                    .map(rowsUpdated -> {
                        if (rowsUpdated > 0) {
                            log.info("Marked notification {} as read for user {}", notificationId, userId);
                            return "Notification marked as read successfully";
                        } else {
                            log.warn("No rows updated when marking notification {} as read", notificationId);
                            return "Notification already marked as read";
                        }
                    });
            });
    }

    /**
     * Get bidder ratings and reviews
     */
    public Mono<BidderRatingsResult> getBidderRatings(int bidderId, int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        
        return Mono.zip(
            // Get total count
            reviewRepository.countByToUserId(bidderId),
            // Get positive reviews count
            reviewRepository.countPositiveReviews(bidderId),
            // Get negative reviews count
            reviewRepository.countNegativeReviews(bidderId),
            // Get average score
            reviewRepository.getAverageScore(bidderId).defaultIfEmpty(0.0),
            // Get paginated reviews
            reviewRepository.findByToUserIdOrderByCreatedAtDesc(bidderId)
                .skip(offset)
                .take(pageSize)
                .flatMap(review -> {
                    // Get username for from_user_id
                    Mono<String> userNameMono = productRepository.getUserFullName(review.getFromUserId())
                        .defaultIfEmpty("User #" + review.getFromUserId());
                    
                    return userNameMono.map(userName -> new BidderReview(
                        review.getId(),
                        review.getFromUserId(),
                        userName,
                        review.getScore(),
                        review.getComment() != null ? review.getComment() : "",
                        String.valueOf(TimeUtils.toEpochSecond(review.getCreatedAt()) * 1000)
                    ));
                })
                .collectList()
        ).map(tuple -> {
            int totalCount = tuple.getT1();
            int positiveReviews = tuple.getT2();
            int negativeReviews = tuple.getT3();
            double avgScore = tuple.getT4();
            List<BidderReview> reviews = tuple.getT5();
            
            // Calculate rating percent (average score / 5 * 100)
            float ratingPercent = (float) (avgScore / 5.0 * 100.0);
            
            return new BidderRatingsResult(
                positiveReviews,
                negativeReviews,
                ratingPercent,
                reviews,
                totalCount
            );
        });
    }

    /**
     * Get top bidders for a product from Redis sorted set
     * Returns top bidders sorted by bid amount (highest first)
     * Cách lưu trong placeBid:
     * - Key: "auction:" + productId + ":bids"
     * - Member (key): String.valueOf(userId)
     * - Score (value): bidAmount
     */
    public Mono<TopBiddersResult> getTopBidders(int productId, int limit) {
        log.info("Getting top {} bidders for product {}", limit, productId);
        
        // Limit to max 10
        int actualLimit = Math.min(limit > 0 ? limit : 5, 10);
        
        // Sử dụng key giống như trong placeBid
        String redisKey = "auction:" + productId + ":bids";
        
        // Get top bidders from Redis sorted set (highest score first)
        return redisService.zRevRange(redisKey, 0, actualLimit - 1)
            .collectList()
            .doOnNext(bidders -> log.debug("Found {} bidders in Redis for product {}", bidders.size(), productId))
            .flatMap(bidders -> {
                if (bidders.isEmpty()) {
                    log.info("No bidders found in Redis for product {}", productId);
                    // Return empty result instead of empty Flux
                    return Mono.just(new TopBiddersResult(java.util.Collections.emptyList()));
                }
                
                return Flux.fromIterable(bidders)
                    .flatMap(bidderObj -> {
                        // Parse userId từ Redis key (được lưu bằng String.valueOf(userId))
                        String bidderStr = bidderObj.toString();
                        int bidderId = Integer.parseInt(bidderStr);
                        
                        log.debug("Processing bidder {} for product {}", bidderId, productId);
                        
                        // Get score (bid amount) for this bidder from Redis
                        return redisService.zScore(redisKey, bidderStr)
                            .flatMap(bidAmount -> {
                                log.debug("Bidder {} has amount {} for product {}", bidderId, bidAmount, productId);
                                
                                // Get bidder info and last bid time from database
                                return productRepository.findUserById(bidderId)
                                    .flatMap(user -> {
                                        // Get last bid time for this bidder on this product
                                        return productRepository.getLastBidTimeForUser(productId, bidderId)
                                            .map(bidTime -> new TopBidderItem(
                                                bidderId,
                                                maskEmail(user.getEmail()),
                                                bidAmount,
                                                bidTime.toEpochSecond(ZoneOffset.ofHours(7))
                                            ))
                                            .doOnNext(item -> log.debug("Created TopBidderItem: bidderId={}, amount={}, time={}", 
                                                item.bidderId(), item.bidAmount(), item.bidTime()));
                                    })
                                    .onErrorResume(e -> {
                                        log.warn("Could not get info for bidder {} on product {}: {}", 
                                            bidderId, productId, e.getMessage());
                                        return Mono.empty();
                                    });
                            });
                    })
                    .collectList()
                    .map(topBidders -> {
                        log.info("Successfully retrieved {} top bidders for product {}", topBidders.size(), productId);
                        return new TopBiddersResult(topBidders);
                    });
            })
            .defaultIfEmpty(new TopBiddersResult(java.util.Collections.emptyList()))
            .doOnError(e -> log.error("Error getting top bidders for product {}: {}", productId, e.getMessage(), e));
    }
    
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 2) {
            return "*****" + email.substring(atIndex);
        }
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }
    
    public static record TopBiddersResult(List<TopBidderItem> topBidders) {}
    public static record TopBidderItem(
        int bidderId,
        String bidderNameMasked,
        double bidAmount,
        long bidTime
    ) {}
    
    /**
     * Request role upgrade to seller
     */
    public Mono<RequestRoleUpgradeResult> requestRoleUpgrade(int userId) {
        log.info("User {} requesting role upgrade to seller", userId);
        
        // Check if user already has a pending request
        return productRepository.countPendingUpgradeRequests(userId)
            .flatMap(count -> {
                if (count > 0) {
                    log.warn("User {} already has a pending upgrade request", userId);
                    return Mono.just(new RequestRoleUpgradeResult(
                        false,
                        "You already have a pending upgrade request",
                        0
                    ));
                }
                
                // Create new upgrade request
                return productRepository.insertUpgradeRequest(userId)
                    .then(Mono.defer(() -> {
                        log.info("Upgrade request created successfully for user {}", userId);
                        return Mono.just(new RequestRoleUpgradeResult(
                            true,
                            "Upgrade request submitted successfully. Admin will review your request.",
                            1
                        ));
                    }));
            })
            .doOnError(e -> log.error("Error creating upgrade request for user {}: {}", 
                userId, e.getMessage(), e));
    }
    
    /**
     * Get role upgrade request status for user
     */
    public Mono<GetRoleUpgradeRequestStatusResult> getRoleUpgradeRequestStatus(int userId) {
        log.info("Getting role upgrade request status for user {}", userId);
        
        return productRepository.getRoleUpgradeRequest(userId)
            .map(request -> {
                log.info("Found upgrade request for user {}: status={}", userId, request.status());
                return new GetRoleUpgradeRequestStatusResult(
                    true,
                    "Request status retrieved successfully",
                    true,
                    request.status(),
                    request.createdAt().toEpochSecond()
                );
            })
            .switchIfEmpty(Mono.defer(() -> {
                log.info("No upgrade request found for user {}", userId);
                return Mono.just(new GetRoleUpgradeRequestStatusResult(
                    true,
                    "No upgrade request found",
                    false,
                    "not_found",
                    0
                ));
            }))
            .doOnError(e -> log.error("Error getting upgrade request status for user {}: {}", 
                userId, e.getMessage(), e));
    }
    
    public static record RequestRoleUpgradeResult(boolean success, String message, int requestId) {}
    public static record GetRoleUpgradeRequestStatusResult(
        boolean success, 
        String message, 
        boolean hasRequest, 
        String status, 
        long createdAt
    ) {}

    /**
     * Get bidder's orders
     * Flow:
     * 1. Query orders from database where buyer_id = userId
     * 2. Apply pagination
     * 3. Filter by order status if provided
     * 4. Return list of orders with product info
     */
    public Mono<BidderOrdersResult> getBidderListOrder(int userId, int page, int limit, String status) {
        log.info("Getting orders for user {} with status={}, page={}, limit={}", userId, status, page, limit);
        
        // Validate pagination
        int validPage = Math.max(1, page);
        int validLimit = Math.min(Math.max(1, limit), 100); // Max 100
        int offset = (validPage - 1) * validLimit;
        
        return orderRepository.findOrdersByBuyerId(userId, status, validLimit, offset)
            .collectList()
            .flatMap(orders -> {
                if (orders.isEmpty()) {
                    PageInfo pageInfo = PageInfo.newBuilder()
                            .setCurrentPage(validPage)
                            .setPageSize(validLimit)
                            .setTotalItems(0)
                            .setTotalPages(0)
                            .setHasNext(false)
                            .setHasPrevious(false)
                            .build();
                    log.info("No orders found for user {}", userId);
                    return Mono.just(new BidderOrdersResult(
                        java.util.Collections.emptyList(),
                            pageInfo
                    ));
                }
                
                // Get total count for pagination
                return orderRepository.countOrdersByBuyerId(userId, status)
                    .flatMap(totalCount -> {
                        // Fetch product and seller info for each order
                        List<Mono<OrderItem>> orderItemMonos = orders.stream()
                            .map(order -> {
                                // Fetch product title
                                Mono<String> productTitleMono = productRepository.findById(order.getProductId())
                                    .map(product -> product.getTitle())
                                    .defaultIfEmpty("Unknown Product");
                                
                                // Fetch product primary image
                                Mono<String> productImageMono = productRepository.getProductImages(order.getProductId())
                                    .filter(img -> img.is_primary())
                                    .next()
                                    .map(ImageRowRecord::url)
                                    .defaultIfEmpty("");
                                
                                // Fetch seller name
                                Mono<String> sellerNameMono = productRepository.getUserFullName(order.getSellerId())
                                    .defaultIfEmpty("Seller #" + order.getSellerId());
                                
                                return Mono.zip(productTitleMono, productImageMono, sellerNameMono)
                                    .map(tuple -> {
                                        String productTitle = tuple.getT1();
                                        String productImage = tuple.getT2();
                                        String sellerName = tuple.getT3();
                                        
                                        return OrderItem.newBuilder()
                                            .setId(order.getId())
                                            .setProductId(order.getProductId())
                                            .setProductTitle(productTitle)
                                            .setProductImage(productImage)
                                            .setAmount(order.getAmount().doubleValue())
                                            .setStatus(order.getStatus())
                                            .setSellerId(order.getSellerId())
                                            .setSellerName(sellerName)
                                            .setCreatedAt(order.getCreatedAt().toEpochSecond(ZoneOffset.ofHours(7)))
                                            .setUpdatedAt(order.getUpdatedAt().toEpochSecond(ZoneOffset.ofHours(7)))
                                            .setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus() : "pending")
                                            .build();
                                    });
                            })
                            .collect(java.util.stream.Collectors.toList());
                        
                        return Flux.fromIterable(orderItemMonos)
                            .flatMap(mono -> mono)
                            .collectList()
                            .map(orderItems -> {
                                int totalPages = (int) Math.ceil((double) totalCount / validLimit);
                                
                                PageInfo pageInfo = PageInfo.newBuilder()
                                    .setCurrentPage(validPage)
                                    .setPageSize(validLimit)
                                    .setTotalItems(totalCount)
                                    .setTotalPages(totalPages)
                                    .setHasNext(validPage < totalPages)
                                    .setHasPrevious(validPage > 1)
                                    .build();
                                
                                log.info("Retrieved {} orders for user {} (total: {})", 
                                    orderItems.size(), userId, totalCount);
                                
                                return new BidderOrdersResult(orderItems, pageInfo);
                            });
                    });
            })
            .doOnError(e -> log.error("Error getting orders for user {}: {}", userId, e.getMessage(), e));
    }

    /**
     * Get banned products for a bidder
     * Flow:
     * 1. Query banned products from database where bidder_id = userId
     * 2. Apply pagination
     * 3. Return list of banned products with product info
     */
    public Mono<BannedProductsResult> getBannedProducts(int userId, int page, int limit) {
        log.info("Getting banned products for user {} with page={}, limit={}", userId, page, limit);
        
        // Validate pagination
        int validPage = Math.max(1, page);
        int validLimit = Math.min(Math.max(1, limit), 100); // Max 100
        int offset = (validPage - 1) * validLimit;
        
        return productRepository.getBannedProductsByUserId(userId, validLimit, offset)
            .collectList()
            .flatMap(bannedProducts -> {
                if (bannedProducts.isEmpty()) {
                    PageInfo pageInfo = PageInfo.newBuilder()
                            .setCurrentPage(validPage)
                            .setPageSize(validLimit)
                            .setTotalItems(0)
                            .setTotalPages(0)
                            .setHasNext(false)
                            .setHasPrevious(false)
                            .build();
                    log.info("No banned products found for user {}", userId);
                    return Mono.just(new BannedProductsResult(
                        java.util.Collections.emptyList(),
                        pageInfo
                    ));
                }
                
                // Get total count for pagination
                return productRepository.countBannedProductsByUserId(userId)
                    .map(totalCount -> {
                        List<BannedProduct> bannedProductItems = bannedProducts.stream()
                            .map(banned -> BannedProduct.newBuilder()
                                .setId(banned.id())
                                .setProductId(banned.productId())
                                .setBidderId(banned.bidderId())
                                .setSellerId(banned.sellerId())
                                .setProductTitle(banned.productTitle() != null ? banned.productTitle() : "")
                                .setProductImage(banned.productImage() != null ? banned.productImage() : "")
                                .setSellerName(banned.sellerName() != null ? banned.sellerName() : "")
                                .setReason(banned.reason() != null ? banned.reason() : "")
                                .setBannedAt(banned.bannedAt().toEpochSecond(ZoneOffset.ofHours(7)))
                                .setBannedUntil(banned.bannedUntil() != null ? banned.bannedUntil().toEpochSecond(ZoneOffset.ofHours(7)) : 0)
                                .build())
                            .collect(java.util.stream.Collectors.toList());

                        int totalPages = (int) Math.ceil((double) totalCount / validLimit);
                        
                        PageInfo pageInfo = PageInfo.newBuilder()
                            .setCurrentPage(validPage)
                            .setPageSize(validLimit)
                            .setTotalItems(totalCount)
                            .setTotalPages(totalPages)
                            .setHasNext(validPage < totalPages)
                            .setHasPrevious(validPage > 1)
                            .build();
                        
                        log.info("Retrieved {} banned products for user {} (total: {})", 
                            bannedProducts.size(), userId, totalCount);
                        
                        return new BannedProductsResult(bannedProductItems, pageInfo);
                    });
            })
            .doOnError(e -> log.error("Error getting banned products for user {}: {}", userId, e.getMessage(), e));
    }

    /**
     * Get order by ID with authorization check
     * @param orderId the order ID
     * @param userId the user ID (must be buyer or seller of the order)
     * @return the order details
     */
    public Mono<OrderDetail> getOrderById(int orderId, int userId) {
        log.info("Getting order by ID - orderId: {}, userId: {}", orderId, userId);
        
        return orderRepository.findById(orderId)
            .switchIfEmpty(Mono.defer(() -> {
                log.warn("Order not found with id: {}", orderId);
                return Mono.error(new IllegalArgumentException("Order not found with id: " + orderId));
            }))
            .flatMap(order -> {
                // Authorization check: user must be buyer or seller
                if (!order.getBuyerId().equals(userId) && !order.getSellerId().equals(userId)) {
                    log.warn("User {} is not authorized to access order {}", userId, orderId);
                    return Mono.error(new IllegalArgumentException("Unauthorized: You don't have access to this order"));
                }
                
                return Mono.just(OrderDetail.newBuilder()
                    .setId(order.getId())
                    .setProductId(order.getProductId())
                    .setBuyerId(order.getBuyerId())
                    .setSellerId(order.getSellerId())
                    .setAmount(order.getAmount().doubleValue())
                    .setStatus(order.getStatus() != null ? order.getStatus() : "")
                    .setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod() : "")
                    .setShippingAddress(order.getShippingAddress() != null ? order.getShippingAddress() : "")
                    .setStripePaymentIntentId(order.getStripePaymentIntentId() != null ? order.getStripePaymentIntentId() : "")
                    .setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus() : "")
                    .setCreatedAt(order.getCreatedAt() != null ? 
                        order.getCreatedAt().toEpochSecond(ZoneOffset.ofHours(7)) : 0)
                    .setUpdatedAt(order.getUpdatedAt() != null ? 
                        order.getUpdatedAt().toEpochSecond(ZoneOffset.ofHours(7)) : 0)
                    .build());
            })
            .doOnError(e -> log.error("Error getting order by ID - orderId: {}, userId: {}, error: {}", 
                orderId, userId, e.getMessage(), e));
    }
    
    /**
     * Update order payment intent information
     * @param orderId the order ID
     * @param userId the user ID (must be buyer of the order)
     * @param stripePaymentIntentId the Stripe payment intent ID
     * @param paymentStatus the payment status
     * @return the updated order details
     */
    @Transactional
    public Mono<OrderDetail> updateOrderPaymentIntent(int orderId, int userId, 
                                                       String stripePaymentIntentId, String paymentStatus,
                                                       String shippingAddress) {
        log.info("Updating order payment intent - orderId: {}, userId: {}, paymentIntentId: {}, status: {}, shippingAddress: {}", 
            orderId, userId, stripePaymentIntentId, paymentStatus, shippingAddress != null ? "provided" : "not provided");
        
        return orderRepository.findById(orderId)
            .switchIfEmpty(Mono.defer(() -> {
                log.warn("Order not found with id: {}", orderId);
                return Mono.error(new IllegalArgumentException("Order not found with id: " + orderId));
            }))
            .flatMap(order -> {
                // Authorization check: user must be buyer
                if (!order.getBuyerId().equals(userId)) {
                    log.warn("User {} is not authorized to update payment for order {}", userId, orderId);
                    return Mono.error(new IllegalArgumentException("Unauthorized: Only the buyer can update payment"));
                }
                
                Mono<Void> updateMono;
                if (shippingAddress != null && !shippingAddress.trim().isEmpty()) {
                    updateMono = orderRepository.updateOrderPaymentIntentWithShipping(
                        orderId, stripePaymentIntentId, paymentStatus, shippingAddress);
                } else {
                    updateMono = orderRepository.updateOrderPaymentIntent(orderId, stripePaymentIntentId, paymentStatus);
                }
                
                return updateMono
                    .then(orderRepository.findById(orderId))
                    .map(updatedOrder -> OrderDetail.newBuilder()
                        .setId(updatedOrder.getId())
                        .setProductId(updatedOrder.getProductId())
                        .setBuyerId(updatedOrder.getBuyerId())
                        .setSellerId(updatedOrder.getSellerId())
                        .setAmount(updatedOrder.getAmount().doubleValue())
                        .setStatus(updatedOrder.getStatus() != null ? updatedOrder.getStatus() : "")
                        .setPaymentMethod(updatedOrder.getPaymentMethod() != null ? updatedOrder.getPaymentMethod() : "")
                        .setShippingAddress(updatedOrder.getShippingAddress() != null ? updatedOrder.getShippingAddress() : "")
                        .setStripePaymentIntentId(updatedOrder.getStripePaymentIntentId() != null ? updatedOrder.getStripePaymentIntentId() : "")
                        .setPaymentStatus(updatedOrder.getPaymentStatus() != null ? updatedOrder.getPaymentStatus() : "")
                        .setCreatedAt(updatedOrder.getCreatedAt() != null ? 
                            updatedOrder.getCreatedAt().toEpochSecond(ZoneOffset.ofHours(7)) : 0)
                        .setUpdatedAt(updatedOrder.getUpdatedAt() != null ? 
                            updatedOrder.getUpdatedAt().toEpochSecond(ZoneOffset.ofHours(7)) : 0)
                        .build());
            })
            .doOnError(e -> log.error("Error updating order payment intent - orderId: {}, userId: {}, error: {}", 
                orderId, userId, e.getMessage(), e));
    }
    
    @Transactional
    public Mono<OrderDetail> confirmPayment(int orderId, int userId, String paymentIntentId) {
        log.info("Confirming payment - orderId: {}, userId: {}, paymentIntentId: {}", orderId, userId, paymentIntentId);
        
        return orderRepository.findById(orderId)
            .switchIfEmpty(Mono.defer(() -> {
                log.warn("Order not found with id: {}", orderId);
                return Mono.error(new IllegalArgumentException("Order not found with id: " + orderId));
            }))
            .flatMap(order -> {
                // Authorization check: user must be buyer
                if (!order.getBuyerId().equals(userId)) {
                    log.warn("User {} is not authorized to confirm payment for order {}", userId, orderId);
                    return Mono.error(new IllegalArgumentException("Unauthorized: Only the buyer can confirm payment"));
                }
                
                // Verify payment intent ID matches
                if (order.getStripePaymentIntentId() == null || !order.getStripePaymentIntentId().equals(paymentIntentId)) {
                    log.warn("Payment intent ID mismatch for order {} - expected: {}, got: {}", 
                        orderId, order.getStripePaymentIntentId(), paymentIntentId);
                    return Mono.error(new IllegalArgumentException("Payment intent ID mismatch"));
                }
                
                return orderRepository.confirmPayment(orderId, paymentIntentId)
                    .then(orderRepository.findById(orderId))
                    .map(updatedOrder -> OrderDetail.newBuilder()
                        .setId(updatedOrder.getId())
                        .setProductId(updatedOrder.getProductId())
                        .setBuyerId(updatedOrder.getBuyerId())
                        .setSellerId(updatedOrder.getSellerId())
                        .setAmount(updatedOrder.getAmount().doubleValue())
                        .setStatus(updatedOrder.getStatus() != null ? updatedOrder.getStatus() : "")
                        .setPaymentMethod(updatedOrder.getPaymentMethod() != null ? updatedOrder.getPaymentMethod() : "")
                        .setShippingAddress(updatedOrder.getShippingAddress() != null ? updatedOrder.getShippingAddress() : "")
                        .setStripePaymentIntentId(updatedOrder.getStripePaymentIntentId() != null ? updatedOrder.getStripePaymentIntentId() : "")
                        .setPaymentStatus(updatedOrder.getPaymentStatus() != null ? updatedOrder.getPaymentStatus() : "")
                        .setCreatedAt(updatedOrder.getCreatedAt() != null ? 
                            updatedOrder.getCreatedAt().toEpochSecond(ZoneOffset.ofHours(7)) : 0)
                        .setUpdatedAt(updatedOrder.getUpdatedAt() != null ? 
                            updatedOrder.getUpdatedAt().toEpochSecond(ZoneOffset.ofHours(7)) : 0)
                        .build());
            })
            .doOnError(e -> log.error("Error confirming payment - orderId: {}, userId: {}, error: {}", 
                orderId, userId, e.getMessage(), e));
    }

    // Helper records for new endpoints
    public record BidderOrdersResult(
        List<OrderItem> orders,
        PageInfo pageInfo
    ) {}
    
    public record BannedProductsResult(
        List<BannedProduct> bannedProducts,
        PageInfo pageInfo
    ) {}
}
