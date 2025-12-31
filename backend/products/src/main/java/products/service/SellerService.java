package products.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.auction.entities.database.Product;
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

    public SellerService(SellerRepository sellerRepository, ProductRepository productRepository) {
        this.sellerRepository = sellerRepository;
        this.productRepository = productRepository;
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
                    .setStartsAt(product.getStartsAt().toEpochSecond(ZoneOffset.UTC) * 1000 + "")
                    .setEndsAt(product.getEndsAt().toEpochSecond(ZoneOffset.UTC) * 1000 + "")
                    .setIsAutoExtend(product.getIsAutoExtend())
                    .setAutoExtendSeconds(product.getAutoExtendSeconds())
                    .setStatus(product.getStatus())
                    .setViewsCount(product.getViewsCount())
                    .setBidsCount(product.getBidsCount())
                    .setHighestBidderId(highestBidderId != null ? highestBidderId : 0)
                    .setHighestBidAmount(highestBidAmount.floatValue())
                    .setCreatedAt(product.getCreatedAt().toEpochSecond(ZoneOffset.UTC) * 1000 + "")
                    .setUpdatedAt(product.getUpdatedAt().toEpochSecond(ZoneOffset.UTC) * 1000 + "")
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
            .setEndsAt(product.getEndsAt().toEpochSecond(ZoneOffset.UTC) * 1000 + "")
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
            .setEndsAt(product.getEndsAt().toEpochSecond(ZoneOffset.UTC) * 1000 + "")
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
