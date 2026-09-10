package products.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.auction.constants.ServiceConstants;
import com.auction.entities.database.Category;
import com.auction.entities.database.ProductBan;
import com.auction.utils.ServiceExceptionUtils;
import com.auction.utils.TimeUtils;

import products.repository.CategoryRepository;
import products.repository.ProductRepository;
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
        log.info("Creating category: name={}, parentId={}", name, parentId);
        // Check if category name already exists
        return categoryRepository.findByName(name)
            .flatMap(existingCategory -> {
                log.warn("Category name already exists: {}", name);
                return ServiceExceptionUtils.categoryNameExists();
            })
            .switchIfEmpty(
                Mono.defer(() -> {
                    Category category = new Category();
                    category.setName(name);
                    category.setParentId(parentId == 0 ? null : parentId);
                    category.setCreatedAt(TimeUtils.now());

                    return categoryRepository.save(category)
                        .map(saved -> {
                            log.info("Category created successfully: id={}, name={}", saved.getId(), name);
                            return new CreateCategoryResult(
                                true,
                                ServiceConstants.SUCCESS_CATEGORY_CREATED,
                                saved.getId()
                            );
                        });
                })
            );
    }

    /**
     * Update category
     */
    @Transactional
    public Mono<UpdateCategoryResult> updateCategory(Integer categoryId, String name, Integer parentId) {
        log.info("Updating category: id={}, name={}, parentId={}", categoryId, name, parentId);
        return categoryRepository.findById(categoryId)
            .flatMap(category -> {
                // Check if new name already exists (excluding current category)
                return categoryRepository.findByName(name)
                    .filter(existing -> !existing.getId().equals(categoryId))
                    .flatMap(existing -> {
                        log.warn("Category name already exists: {}", name);
                        return ServiceExceptionUtils.categoryNameExists();
                    })
                    .switchIfEmpty(
                        Mono.defer(() -> {
                            category.setName(name);
                            category.setParentId(parentId == 0 ? null : parentId);

                            return categoryRepository.save(category)
                                .map(updated -> {
                                    log.info("Category updated successfully: id={}, name={}", categoryId, name);
                                    return new UpdateCategoryResult(true, ServiceConstants.SUCCESS_CATEGORY_UPDATED);
                                });
                        })
                    );
            })
            .switchIfEmpty(Mono.defer(() -> {
                log.warn("Category not found: id={}", categoryId);
                return Mono.just(new UpdateCategoryResult(false, ServiceConstants.ERROR_CATEGORY_NOT_FOUND));
            }));
    }

    /**
     * Delete category
     */
    @Transactional
    public Mono<DeleteCategoryResult> deleteCategory(Integer categoryId) {
        log.info("Deleting category: id={}", categoryId);
        return categoryRepository.findById(categoryId)
            .flatMap(category ->
                // Check if category has products
                categoryRepository.hasProducts(categoryId)
                    .defaultIfEmpty(0L)
                    .flatMap(count -> {
                        boolean hasProducts = count > 0;
                        if (hasProducts) {
                            log.warn("Cannot delete category with existing products: id={}", categoryId);
                            return ServiceExceptionUtils.categoryHasProducts();
                        }

                        // Delete category and its children
                        return categoryRepository.deleteById(categoryId)
                            .then(Mono.defer(() -> {
                                log.info("Category deleted successfully: id={}", categoryId);
                                return Mono.just(new DeleteCategoryResult(
                                    true,
                                    ServiceConstants.SUCCESS_CATEGORY_DELETED,
                                    false
                                ));
                            }));
                    })
            )
            .switchIfEmpty(Mono.defer(() -> {
                log.warn("Category not found: id={}", categoryId);
                return Mono.just(new DeleteCategoryResult(false, ServiceConstants.ERROR_CATEGORY_NOT_FOUND, false));
            }));
    }

    // ============================================================================
    // PRODUCT MANAGEMENT
    // ============================================================================

    /**
     * Remove/ban product by admin
     */
    @Transactional
    public Mono<RemoveProductResult> removeProduct(Integer productId, Integer adminId, String reason) {
        log.info("Admin {} removing product {}", adminId, productId);
        return productRepository.findById(productId)
            .flatMap(product -> {
                String previousStatus = product.getStatus();

                // Cancel scheduled auction end if exists
                log.info("Cancelling scheduled auction for product {}", productId);
                auctionService.cancel(Long.valueOf(productId));

                // Update product status to banned
                return productRepository.updateStatus(productId, ServiceConstants.PRODUCT_STATUS_BANNED)
                    .then(Mono.defer(() -> {
                        // Create ban record
                        ProductBan ban = new ProductBan();
                        ban.setProductId(productId);
                        ban.setUserId(adminId);
                        ban.setReason(reason);
                        ban.setCreatedAt(TimeUtils.now());

                        log.info("Product banned: id={}, admin={}, reason={}", productId, adminId, reason);
                        return Mono.just(new RemoveProductResult(
                                true,
                                ServiceConstants.SUCCESS_PRODUCT_REMOVED,
                                previousStatus
                            ));
                    }));
            })
            .switchIfEmpty(Mono.defer(() -> {
                log.warn("Product not found: id={}", productId);
                return Mono.just(new RemoveProductResult(false, ServiceConstants.ERROR_PRODUCT_NOT_FOUND, null));
            }));
    }

    // ============================================================================
    // RESULT CLASSES
    // ============================================================================

    public record CreateCategoryResult(boolean success, String message, Integer categoryId) {}
    
    public record UpdateCategoryResult(boolean success, String message) {}
    
    public record DeleteCategoryResult(boolean success, String message, boolean hasProducts) {}
    
    public record RemoveProductResult(boolean success, String message, String previousStatus) {}
}
