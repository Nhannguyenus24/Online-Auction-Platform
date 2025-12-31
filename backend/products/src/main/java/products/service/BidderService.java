package products.service;

import java.time.ZoneOffset;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.auction.proto.user.Bid;
import com.auction.proto.user.BidHistoryItem;
import com.auction.proto.user.PageInfo;
import com.auction.proto.user.Product;
import com.auction.proto.user.ProductImage;
import com.auction.proto.user.Question;

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
    
    private final ProductRepository productRepository;
    
    public BidderService(ProductRepository productRepository) {
        this.productRepository = productRepository;
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
        // TODO: Implement bid placement logic
        return Mono.just(new PlaceBidResult(1, 0.0, 0.0, 0L, false));
    }

    public Mono<AutoBidResult> setAutoBid(int productId, int userId, double maxAmount) {
        // TODO: Implement auto-bid setup logic
        return Mono.just(new AutoBidResult(1, 0.0, 0.0, 0L));
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
            .setStartsAt(dto.startsAt().toEpochSecond(ZoneOffset.UTC))
            .setEndsAt(dto.endsAt().toEpochSecond(ZoneOffset.UTC))
            .setCreatedAt(dto.createdAt().toEpochSecond(ZoneOffset.UTC))
            .setUpdatedAt(dto.updatedAt().toEpochSecond(ZoneOffset.UTC))
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
            .setAskerName(dto.askerName())
            .setQuestion(dto.question())
            .setAnswer(dto.answer())
            .setAnsweredBy(dto.answeredBy())
            .setAnswererName(dto.answererName())
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
}
