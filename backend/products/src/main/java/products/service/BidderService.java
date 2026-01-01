package products.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.auction.entities.msg.EventType;
import com.auction.entities.msg.RabbitMessage;
import com.auction.proto.user.Bid;
import com.auction.proto.user.BidHistoryItem;
import com.auction.proto.user.PageInfo;
import com.auction.proto.user.Product;
import com.auction.proto.user.ProductImage;
import com.auction.proto.user.Question;
import com.auction.rabbitmq.services.ReactiveRabbitProducer;
import com.auction.utils.TimeUtils;

import products.dto.BidHistoryRowDto;
import products.dto.BidRowDto;
import products.dto.ImageRowDto;
import products.dto.ProductDetailsDto;
import products.dto.ProductRowDto;
import products.dto.QuestionRowDto;
import products.repository.ProductRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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
    
    public BidderService(ProductRepository productRepository, 
                        com.auction.redis.service.ReactiveRedisService redisService,
                        AuctionService auctionService,
                        products.repository.OrderRepository orderRepository,
                        ReactiveRabbitProducer rabbitProducer,
                        products.repository.NotificationRepository notificationRepository) {
        this.productRepository = productRepository;
        this.redisService = redisService;
        this.auctionService = auctionService;
        this.orderRepository = orderRepository;
        this.rabbitProducer = rabbitProducer;
        this.notificationRepository = notificationRepository;
    }

    public Mono<Product> getProductDetails(int productId, int userId) {
        log.info("Getting product details for productId={}, userId={}", productId, userId);
        return productRepository.getProductDetailsForBidder(productId)
            .doOnNext(dto -> log.debug("Found product dto: id={}, title={}", dto.id(), dto.title()))
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
                        .defaultIfEmpty(java.util.Map.of())
                        .doOnNext(map -> log.debug("Auto bid for user {}: {}", userId, map)),
                    productRepository.getProductQuestions(productId, 10, 0)
                        .map(this::mapDtoToQuestion)
                        .collectList()
                        .doOnNext(questions -> log.debug("Found {} questions for product {}", questions.size(), productId))
                ).map(tuple -> {
                    var images = tuple.getT1();
                    var isInWatchlistCount = tuple.getT2();
                    var isHighestBidderCount = tuple.getT3();
                    var autoBidMap = tuple.getT4();
                    var questions = tuple.getT5();
                    
                    boolean isInWatchlist = isInWatchlistCount != null && isInWatchlistCount > 0;
                    boolean isHighestBidder = isHighestBidderCount != null && isHighestBidderCount > 0;
                    double userMaxAutoBid = 0.0;
                    if (autoBidMap != null && !autoBidMap.isEmpty()) {
                        Object maxAmount = autoBidMap.get("max_amount");
                        if (maxAmount != null) {
                            userMaxAutoBid = ((Number) maxAmount).doubleValue();
                        }
                    }
                    log.info("Successfully built product details for productId={}: images={}, inWatchlist={}, isHighestBidder={}, questions={}", 
                        productId, images.size(), isInWatchlist, isHighestBidder, questions.size());
                    return mapDtoToProductWithUserData(productDto, images, questions, isInWatchlist, isHighestBidder, userMaxAutoBid);
                })
            )
            .doOnError(e -> log.error("Error getting product details for productId={}: {}", productId, e.getMessage(), e));
    }

    public Flux<Product> getRelatedProducts(int productId, int userId, int limit) {
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
//        return productRepository.isInWatchlist(userId, productId)
//            .flatMap(isInWatchlist -> {
//                if (isInWatchlist) {
//                    return Mono.error(new IllegalStateException("Product already in watchlist"));
//                }
//                return productRepository.addToWatchlist(userId, productId)
//                    .thenReturn(1);
//            });
        return productRepository.addToWatchlist(userId, productId)
                .thenReturn(1);
    }

    public Mono<String> removeFromWatchlist(int productId, int userId) {
//        return productRepository.isInWatchlist(userId, productId)
//            .flatMap(isInWatchlist -> {
//                if (!isInWatchlist) {
//                    return Mono.error(new IllegalStateException("Product not in watchlist"));
//                }
//                return productRepository.removeFromWatchlist(userId, productId)
//                    .thenReturn("Removed from watchlist");
//            });
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
            var totalCount = tuple.getT2();
            
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
            var totalCount = tuple.getT2();
            
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

    public Mono<PlaceBidResult> placeBid(int productId, int userId, double bidAmount) {
        log.info("User {} placing bid {} on product {}", userId, bidAmount, productId);
        
        return productRepository.findById(productId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Product not found")))
            .flatMap(product -> {
                // Validate product status
                if (!"active".equals(product.getStatus())) {
                    return Mono.error(new IllegalStateException("Product is not active"));
                }
                
                // Validate bid time
                java.time.LocalDateTime now = TimeUtils.now();
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
                
                // Insert bid into database
                return productRepository.insertBid(productId, userId, bidAmount, false)
                    .then(productRepository.updateProductPrice(productId, bidAmount))
                    .then(redisService.zAdd("auction:" + productId + ":bids", String.valueOf(userId), bidAmount))
                    .then(saveBidderProfileToRedis(productId, userId, bidAmount))
                    .then(checkAndNotifyOutbid(productId, userId, bidAmount, product.getTitle(), product.getEndsAt()))
                    .then(Mono.defer(() -> {
                        // Handle auto-extend
                        if (product.getIsAutoExtend()) {
                            java.time.Duration timeLeft = java.time.Duration.between(now, product.getEndsAt());
                            if (timeLeft.getSeconds() < product.getAutoExtendSeconds()) {
                                java.time.LocalDateTime newEndTime = now.plusSeconds(product.getAutoExtendSeconds());
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

    public Mono<AutoBidResult> setAutoBid(int productId, int userId, double maxAmount) {
        log.info("User {} setting auto-bid {} on product {}", userId, maxAmount, productId);
        
        return productRepository.findById(productId)
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
    
    /**
     * Handle auction end - called by scheduler
     */
    private void handleAuctionEnd(int productId) {
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
                                    .flatMap(orderId -> {
                                        log.info("Order created successfully: productId={}, buyerId={}, sellerId={}, amount={}",
                                            productId, winnerId, product.getSellerId(), winningBid);
                                        
                                        // Send notifications to winner and seller
                                        return Mono.when(
                                            sendAuctionEndedWinnerNotification(product, winnerId, winningBid),
                                            sendAuctionEndedSellerNotification(product, winnerId, winningBid)
                                        );
                                    });
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
                                            String productName, java.time.LocalDateTime auctionEndTime) {
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
                        
                        // Calculate time remaining
                        java.time.Duration timeLeft = java.time.Duration.between(
                            java.time.LocalDateTime.now(), auctionEndTime);
                        String timeRemaining = formatDuration(timeLeft);
                        
                        // Send outbid notification via RabbitMQ
                        return sendOutbidNotification(
                            productId,
                            productName,
                            outbidUserId,
                            previousBidAmount,
                            newBidAmount,
                            bidDifference,
                            auctionEndTime,
                            timeRemaining
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
                                             java.time.LocalDateTime auctionEndTime, String timeRemaining) {
        // Note: We don't have email/userName from Redis profile yet
        // This will need to be fetched from user service or added to profile cache
        // For now, we'll send userId and notification service should handle it
        
        java.util.Map<String, String> payload = new java.util.HashMap<>();
        payload.put("userId", String.valueOf(outbidUserId));
        payload.put("productId", String.valueOf(productId));
        payload.put("productName", productName);
        payload.put("yourBidAmount", yourBidAmount);
        payload.put("newHighestBid", String.format("%.2f", newHighestBid));
        payload.put("bidDifference", String.format("%.2f", bidDifference));
        payload.put("outbidTime", java.time.LocalDateTime.now().toString());
        payload.put("auctionEndTime", auctionEndTime.toString());
        payload.put("timeRemaining", timeRemaining);
        payload.put("auctionLink", "http://localhost:3000/products/" + productId); // TODO: use actual frontend URL
        
        // Note: email and userName will need to be fetched by notification service
        // from user service using userId
        
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
     * Format duration to human readable string
     */
    private String formatDuration(java.time.Duration duration) {
        long hours = duration.toHours();
        long minutes = duration.toMinutesPart();
        
        if (hours > 24) {
            long days = hours / 24;
            return days + " day" + (days > 1 ? "s" : "");
        } else if (hours > 0) {
            return hours + " hour" + (hours > 1 ? "s" : "") + " " + minutes + " min";
        } else {
            return minutes + " minute" + (minutes > 1 ? "s" : "");
        }
    }
    
    /**
     * Save bidder profile information to Redis for quick access
     * Key format: profile:{userId}:{productId}
     */
    private Mono<Void> saveBidderProfileToRedis(int productId, int userId, double bidAmount) {
        String profileKey = "profile:" + userId + ":" + productId;
        
        log.debug("Saving bidder profile to Redis: key={}, bidAmount={}", profileKey, bidAmount);
        
        // Save each field individually using hSet
        return Mono.when(
            redisService.hSet(profileKey, "userId", String.valueOf(userId)),
            redisService.hSet(profileKey, "productId", String.valueOf(productId)),
            redisService.hSet(profileKey, "bidAmount", String.format("%.2f", bidAmount)),
            redisService.hSet(profileKey, "bidTime", String.valueOf(System.currentTimeMillis())),
            redisService.hSet(profileKey, "lastUpdated", java.time.LocalDateTime.now().toString())
        )
        .then(redisService.expire(profileKey, java.time.Duration.ofSeconds(86400 * 15))) // Expire after 15 days
        .doOnSuccess(v -> log.debug("Bidder profile saved to Redis: userId={}, productId={}", userId, productId))
        .doOnError(e -> log.error("Failed to save bidder profile to Redis: userId={}, productId={}, error={}", 
            userId, productId, e.getMessage()))
        .onErrorResume(e -> Mono.empty()) // Continue even if Redis save fails
        .then();
    }
    
    /**
     * Send notification to winner when auction ends
     */
    private Mono<Void> sendAuctionEndedWinnerNotification(com.auction.entities.database.Product product, int winnerId, double winningAmount) {
        java.util.Map<String, String> payload = new java.util.HashMap<>();
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
        
        log.info("Sending auction ended notification to winner: userId={}, productId={}, winningAmount={}",
            winnerId, product.getId(), winningAmount);
        
        return rabbitProducer.sendToQueue(NOTIFICATION_QUEUE, message)
            .doOnSuccess(v -> log.info("Auction ended notification sent to winner successfully: userId={}, productId={}",
                winnerId, product.getId()))
            .doOnError(e -> log.error("Failed to send auction ended notification to winner: userId={}, productId={}, error={}",
                winnerId, product.getId(), e.getMessage(), e))
            .onErrorResume(e -> Mono.empty());
    }
    
    /**
     * Send notification to seller when auction ends with a winner
     */
    private Mono<Void> sendAuctionEndedSellerNotification(com.auction.entities.database.Product product, int winnerId, double finalPrice) {
        java.util.Map<String, String> payload = new java.util.HashMap<>();
        payload.put("recipientType", "seller");
        payload.put("sellerId", String.valueOf(product.getSellerId()));
        payload.put("productId", String.valueOf(product.getId()));
        payload.put("productName", product.getTitle());
        payload.put("isSold", "true");
        payload.put("finalPrice", String.format("%.2f", finalPrice));
        payload.put("winnerName", "User #" + winnerId);
        payload.put("totalBids", String.valueOf(product.getBidsCount()));
        payload.put("auctionEndTime", product.getEndsAt().toString());
        
        RabbitMessage message = RabbitMessage.builder()
            .eventType(EventType.TASK_SEND_MAIL_ENDED_AUCTION)
            .userId(String.valueOf(product.getSellerId()))
            .payload(payload)
            .build();
        
        log.info("Sending auction ended notification to seller: sellerId={}, productId={}, finalPrice={}",
            product.getSellerId(), product.getId(), finalPrice);
        
        return rabbitProducer.sendToQueue(NOTIFICATION_QUEUE, message)
            .doOnSuccess(v -> log.info("Auction ended notification sent to seller successfully: sellerId={}, productId={}",
                product.getSellerId(), product.getId()))
            .doOnError(e -> log.error("Failed to send auction ended notification to seller: sellerId={}, productId={}, error={}",
                product.getSellerId(), product.getId(), e.getMessage(), e))
            .onErrorResume(e -> Mono.empty());
    }

    public Mono<MyBidsResult> getMyBids(int userId, int page, int limit, String filter) {
        int offset = (page - 1) * limit;
        
        return Mono.zip(
            productRepository.getMyBids(userId, limit, offset)
                .map(BidHistoryRowDto::fromMap)
                .collectList(),
            productRepository.countMyBids(userId)
        ).map(tuple -> {
            var bidHistoryDtos = tuple.getT1();
            var totalCount = tuple.getT2();
            
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
    private Product mapRowToProductWithImages(ProductRowDto dto, List<ProductImage> images) {
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
    
    private Product mapDtoToProductWithUserData(ProductDetailsDto dto, List<ProductImage> images,
                                                 List<Question> questions, boolean isInWatchlist, 
                                                 boolean isHighestBidder, double userMaxAutoBid) {
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
            .setUserMaxAutoBid(userMaxAutoBid)
            .build();
    }
    
    private Question mapDtoToQuestion(QuestionRowDto dto) {
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
    
    private Bid mapDtoToBid(BidRowDto dto, int userId) {
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
    
    private BidHistoryItem mapDtoToBidHistoryItem(BidHistoryRowDto dto) {
        return BidHistoryItem.newBuilder()
            .setBidId(dto.bidId())
            .setProductId(dto.productId())
            .setProductTitle(dto.productTitle())
            .setProductPrimaryImage(dto.productPrimaryImage())
            .setBidAmount(dto.bidAmount())
            .setCurrentPrice(dto.currentPrice())
            .setIsAuto(dto.isAuto())
            .setIsWinning(dto.isWinning())
            .setProductStatus(dto.productStatus())
            .setBidCreatedAt(dto.bidCreatedAt())
            .setProductEndsAt(dto.productEndsAt())
            .build();
    }

    private ProductImage mapToProductImage(ImageRowDto dto) {
        return ProductImage.newBuilder()
                .setId(dto.id())
                .setProductId(dto.product_id())
                .setUrl(dto.url())
                .setIsPrimary(dto.is_primary())
                .setCreatedAt(dto.created_at().toEpochSecond())
                .build();
    }

    // Helper records for return types
    public record WatchlistResult(List<Product> products, PageInfo pageInfo) {}
    public record QuestionResult(int questionId, long createdAt) {}
    public record QuestionsResult(java.util.List<Question> questions, PageInfo pageInfo) {}
    public record BidsResult(java.util.List<Bid> bids, PageInfo pageInfo) {}
    public record PlaceBidResult(int bidId, double currentPrice, double nextMinBid, long createdAt, boolean isHighestBidder) {}
    public record AutoBidResult(int autoBidId, double maxAmount, double currentBid, long createdAt) {}
    public record MyBidsResult(java.util.List<BidHistoryItem> bids, PageInfo pageInfo) {}
    public record NotificationsResult(java.util.List<com.auction.proto.user.UserNotification> notifications, long unreadCount) {}

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
        Mono<List<com.auction.proto.user.UserNotification>> notificationsMono = 
            notificationRepository.findByUserIdPaginated(userId, 100, 0) // Get latest 100
                .map(notification -> com.auction.proto.user.UserNotification.newBuilder()
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
}
