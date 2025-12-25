package products.service;

import org.springframework.stereotype.Service;

import com.auction.proto.guest.Category;
import com.auction.proto.guest.PageInfo;
import com.auction.proto.guest.Product;
import products.repository.ProductRepository;
import products.repository.CategoryRepository;
import products.dto.ProductRowDto;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class GuestService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public GuestService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }   

    public Flux<Category> getCategories() {
        return categoryRepository.findAll()
            .map(this::mapEntityToCategory);
    }

    public Flux<Product> getTopEndingProducts(int limit) {
        return productRepository.getTopEndingProducts(limit)
            .map(this::mapRowToProduct);
    }

    public Flux<Product> getTopBidCountProducts(int limit) {
        return productRepository.getTopBidCountProducts(limit)
            .map(this::mapRowToProduct);
    }

    public Flux<Product> getTopPriceProducts(int limit) {
        return productRepository.getTopPriceProducts(limit)
            .map(this::mapRowToProduct);
    }

    public Mono<ProductListResult> listProductsByCategory(int categoryId, String searchKeyword, 
                                                           double minPrice, double maxPrice, 
                                                           String status, String sortOrder, 
                                                           int page, int limit) {
        int offset = (page - 1) * limit;
        
        return Mono.zip(
            categoryRepository.findById(categoryId),
            productRepository.listProductsByCategoryAdvanced(
                categoryId,
                searchKeyword.isEmpty() ? null : searchKeyword,
                minPrice,
                maxPrice,
                status.isEmpty() ? null : status,
                sortOrder,
                limit,
                offset
            ).map(ProductRowDto::fromMap).collectList(),
            productRepository.countProductsByCategory(
                categoryId,
                status.isEmpty() ? null : status,
                minPrice,
                maxPrice,
                searchKeyword.isEmpty() ? null : searchKeyword
            )
        ).map(tuple -> {
            var categoryEntity = tuple.getT1();
            var productRows = tuple.getT2();
            var totalCount = tuple.getT3();
            
            var products = productRows.stream()
                .map(this::mapDtoToProduct)
                .toList();
            
            var pageInfo = PageInfo.newBuilder()
                .setCurrentPage(page)
                .setPageSize(limit)
                .setTotalItems(totalCount)
                .setTotalPages((totalCount + limit - 1) / limit)
                .setHasNext(page * limit < totalCount)
                .setHasPrevious(page > 1)
                .build();
            
            var category = mapEntityToCategory(categoryEntity);
            
            return new ProductListResult(products, pageInfo, category);
        });
    }

    // Helper methods for mapping
    private Category mapEntityToCategory(com.auction.entities.database.Category entity) {
        return Category.newBuilder()
            .setId(entity.getId())
            .setName(entity.getName())
            .setParentId(entity.getParentId() != null ? entity.getParentId() : 0)
            .build();
    }

    private Product mapRowToProduct(java.util.Map<String, Object> row) {
        ProductRowDto dto = ProductRowDto.fromMap(row);
        return mapDtoToProduct(dto);
    }

    private Product mapDtoToProduct(ProductRowDto dto) {
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
            .setStartsAt(dto.startsAt())
            .setEndsAt(dto.endsAt())
            .setIsAutoExtend(dto.isAutoExtend())
            .setAutoExtendSeconds(dto.autoExtendSeconds())
            .setStatus(dto.status())
            .setViewsCount(dto.viewsCount())
            .setBidsCount(dto.bidsCount())
            .setSellerName(dto.sellerName())
            .setSellerRatingPercent(dto.sellerRatingPercent())
            .setSellerPositiveReviews(dto.sellerPositiveReviews())
            .build();
    }

    // Helper records for return types
    public record ProductListResult(java.util.List<Product> products, PageInfo pageInfo, Category category) {}
}
