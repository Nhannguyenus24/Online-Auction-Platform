package products.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.auction.proto.guest.Category;
import com.auction.proto.guest.PageInfo;
import com.auction.proto.guest.Product;
import com.auction.proto.guest.ProductImage;
import com.auction.utils.TimeUtils;

import products.dto.ImageRowDto;
import products.dto.ProductRowDto;
import products.repository.CategoryRepository;
import products.repository.ProductRepository;
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
            .flatMap(dto -> 
                productRepository.getProductImages(dto.id())
                    .map(this::mapToProductImage)
                    .collectList()
                    .map(images -> mapRowToProductWithImages(dto, images))
            );
    }

    public Flux<Product> getTopBidCountProducts(int limit) {
        return productRepository.getTopBidCountProducts(limit)
            .flatMap(dto -> 
                productRepository.getProductImages(dto.id())
                    .map(this::mapToProductImage)
                    .collectList()
                    .map(images -> mapRowToProductWithImages(dto, images))
            );
    }

    public Flux<Product> getTopPriceProducts(int limit) {
        return productRepository.getTopPriceProducts(limit)
            .flatMap(dto -> 
                productRepository.getProductImages(dto.id())
                    .map(this::mapToProductImage)
                    .collectList()
                    .map(images -> mapRowToProductWithImages(dto, images))
            );
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
            ).collectList(),
            productRepository.countProductsByCategory(
                categoryId,
                status.isEmpty() ? null : status,
                minPrice,
                maxPrice,
                searchKeyword.isEmpty() ? null : searchKeyword
            )
        ).flatMap(tuple -> {
            var categoryEntity = tuple.getT1();
            var productRows = tuple.getT2();
            var totalCount = tuple.getT3();
            
            // Fetch images for all products and collect into List<Product>
            var productsMono = Flux.fromIterable(productRows)
                .flatMap(productRowDto -> 
                    productRepository.getProductImages(productRowDto.id())
                        .map(this::mapToProductImage)
                        .collectList()
                        .map(images -> mapRowToProductWithImages(productRowDto, images))
                )
                .collectList();
            
            return productsMono.map(products -> {
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
        });
    }

    public Mono<ProductListByNameResult> listProductsByName(String searchKeyword, 
                                                              double minPrice, double maxPrice, 
                                                              String status, String sortOrder, 
                                                              int page, int limit) {
        int offset = (page - 1) * limit;
        
        return Mono.zip(
            productRepository.listProductsByNameAdvanced(
                searchKeyword,
                minPrice,
                maxPrice,
                status.isEmpty() ? null : status,
                sortOrder,
                limit,
                offset
            ).collectList(),
            productRepository.countProductsByName(
                searchKeyword,
                minPrice,
                maxPrice,
                status.isEmpty() ? null : status
            )
        ).flatMap(tuple -> {
            var productRows = tuple.getT1();
            var totalCount = tuple.getT2();
            
            // Fetch images for all products and collect into List<Product>
            var productsMono = Flux.fromIterable(productRows)
                .flatMap(productRowDto -> 
                    productRepository.getProductImages(productRowDto.id())
                        .map(this::mapToProductImage)
                        .collectList()
                        .map(images -> mapRowToProductWithImages(productRowDto, images))
                )
                .collectList();
            
            return productsMono.map(products -> {
                var pageInfo = PageInfo.newBuilder()
                        .setCurrentPage(page)
                        .setPageSize(limit)
                        .setTotalItems(totalCount)
                        .setTotalPages((totalCount + limit - 1) / limit)
                        .setHasNext(page * limit < totalCount)
                        .setHasPrevious(page > 1)
                        .build();
                return new ProductListByNameResult(products, pageInfo);
            });
        });
    }

    // Helper methods for mapping
    private Category mapEntityToCategory(com.auction.entities.database.Category entity) {
        return Category.newBuilder()
            .setId(entity.getId())
            .setName(entity.getName())
            .setParentId(entity.getParentId() != null ? entity.getParentId() : 0)
            .setCreatedAt(TimeUtils.toEpochSecond(entity.getCreatedAt()))
            .build();
    }

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
            .setSellerName(dto.sellerName())
            .setSellerRatingPercent(dto.sellerRatingPercent())
            .setSellerPositiveReviews(dto.sellerPositiveReviews())
            .addAllImages(images)
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
    public record ProductListResult(List<Product> products, PageInfo pageInfo, Category category) {}
    public record ProductListByNameResult(List<Product> products, PageInfo pageInfo) {}
}
