package products.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.auction.entities.database.Category;
import com.auction.entities.database.ProductBan;

import products.repository.CategoryRepository;
import products.repository.ProductRepository;
import products.util.TimeUtils;
import reactor.core.publisher.Mono;

@Service
public class AdminService {
    private static final Logger log = LoggerFactory.getLogger(AdminService.class);
    
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final AuctionService auctionService;

    public AdminService(CategoryRepository categoryRepository, 
                       ProductRepository productRepository,
                       AuctionService auctionService) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.auctionService = auctionService;
    }

    // ============================================================================
    // CATEGORY MANAGEMENT
    // ============================================================================

    /**
     * Create new category
     */
    @Transactional
    public Mono<CreateCategoryResult> createCategory(String name, Integer parentId) {
        // Check if category name already exists
        return categoryRepository.findByName(name)
            .flatMap(existingCategory -> 
                Mono.just(new CreateCategoryResult(false, "Category name already exists", null))
            )
            .switchIfEmpty(
                Mono.defer(() -> {
                    Category category = new Category();
                    category.setName(name);
                    category.setParentId(parentId == 0 ? null : parentId);
                    category.setCreatedAt(TimeUtils.now());
                    
                    return categoryRepository.save(category)
                        .map(saved -> new CreateCategoryResult(
                            true, 
                            "Category created successfully", 
                            saved.getId()
                        ));
                })
            );
    }

    /**
     * Update category
     */
    @Transactional
    public Mono<UpdateCategoryResult> updateCategory(Integer categoryId, String name, Integer parentId) {
        return categoryRepository.findById(categoryId)
            .flatMap(category -> {
                // Check if new name already exists (excluding current category)
                return categoryRepository.findByName(name)
                    .filter(existing -> !existing.getId().equals(categoryId))
                    .flatMap(existing -> 
                        Mono.just(new UpdateCategoryResult(false, "Category name already exists"))
                    )
                    .switchIfEmpty(
                        Mono.defer(() -> {
                            category.setName(name);
                            category.setParentId(parentId == 0 ? null : parentId);
                            
                            return categoryRepository.save(category)
                                .map(updated -> new UpdateCategoryResult(true, "Category updated successfully"));
                        })
                    );
            })
            .switchIfEmpty(Mono.just(new UpdateCategoryResult(false, "Category not found")));
    }

    /**
     * Delete category
     */
    @Transactional
    public Mono<DeleteCategoryResult> deleteCategory(Integer categoryId) {
        return categoryRepository.findById(categoryId)
            .flatMap(category -> 
                // Check if category has products
                categoryRepository.hasProducts(categoryId)
                    .defaultIfEmpty(0L)
                    .flatMap(count -> {
                        boolean hasProducts = count > 0;
                        if (hasProducts) {
                            return Mono.just(new DeleteCategoryResult(
                                false, 
                                "Cannot delete category with existing products", 
                                true
                            ));
                        }
                        
                        // Delete category and its children
                        return categoryRepository.deleteById(categoryId)
                            .then(Mono.just(new DeleteCategoryResult(
                                true, 
                                "Category deleted successfully", 
                                false
                            )));
                    })
            )
            .switchIfEmpty(Mono.just(new DeleteCategoryResult(false, "Category not found", false)));
    }

    // ============================================================================
    // PRODUCT MANAGEMENT
    // ============================================================================

    /**
     * Remove/ban product by admin
     */
    @Transactional
    public Mono<RemoveProductResult> removeProduct(Integer productId, Integer adminId, String reason) {
        return productRepository.findById(productId)
            .flatMap(product -> {
                String previousStatus = product.getStatus();
                
                // Cancel scheduled auction end if exists
                log.info("Admin {} removing product {}, cancelling scheduled auction", adminId, productId);
                auctionService.cancel(Long.valueOf(productId));
                
                // Update product status to banned
                return productRepository.updateStatus(productId, "banned")
                    .then(Mono.defer(() -> {
                        // Create ban record
                        ProductBan ban = new ProductBan();
                        ban.setProductId(productId);
                        ban.setUserId(adminId);
                        ban.setReason(reason);
                        ban.setCreatedAt(TimeUtils.now());
                        
                        log.info("Product {} banned by admin {}: {}", productId, adminId, reason);
                        return Mono.just(new RemoveProductResult(
                                true, 
                                "Product removed successfully", 
                                previousStatus
                            ));
                    }));
            })
            .switchIfEmpty(Mono.just(new RemoveProductResult(false, "Product not found", null)));
    }

    // ============================================================================
    // RESULT CLASSES
    // ============================================================================

    public record CreateCategoryResult(boolean success, String message, Integer categoryId) {}
    
    public record UpdateCategoryResult(boolean success, String message) {}
    
    public record DeleteCategoryResult(boolean success, String message, boolean hasProducts) {}
    
    public record RemoveProductResult(boolean success, String message, String previousStatus) {}
}
