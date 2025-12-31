package products.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.Product;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface SellerRepository extends R2dbcRepository<Product, Integer> {
    // Find product by id
    Mono<Product> findById(Integer id);

    // Find products by seller_id
    Flux<Product> findBySellerId(Integer sellerId);

    // Find products by status
    Flux<Product> findByStatusAndSellerId(String status, Integer sellerId);

    // Create product
    Mono<Product> save(Product product);

    // ============================================================================
    // DASHBOARD / PROFILE QUERIES
    // ============================================================================

    /**
     * Get active listings for seller with pagination
     */
    @Query("SELECT * FROM products WHERE seller_id = :sellerId AND status = 'active' " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Product> findActiveListingsBySellerId(Integer sellerId, Integer limit, Integer offset);

    /**
     * Count active listings for seller
     */
    @Query("SELECT COUNT(*) FROM products WHERE seller_id = :sellerId AND status = 'active'")
    Mono<Long> countActiveListingsBySellerId(Integer sellerId);

    /**
     * Get products where auction has ended and winner is determined (ended status with bids)
     */
    @Query("SELECT p.* FROM products p " +
           "WHERE p.seller_id = :sellerId AND p.status = 'ended' AND p.bids_count > 0 " +
           "ORDER BY p.ends_at DESC LIMIT :limit OFFSET :offset")
    Flux<Product> findWinnerItemsBySellerId(Integer sellerId, Integer limit, Integer offset);

    /**
     * Count products with winners for seller
     */
    @Query("SELECT COUNT(*) FROM products " +
           "WHERE seller_id = :sellerId AND status = 'ended' AND bids_count > 0")
    Mono<Long> countWinnerItemsBySellerId(Integer sellerId);

    // ============================================================================
    // PRODUCT QUERIES
    // ============================================================================

    /**
     * Find product by id and verify seller ownership
     */
    @Query("SELECT * FROM products WHERE id = :productId AND seller_id = :sellerId")
    Mono<Product> findByIdAndSellerId(Integer productId, Integer sellerId);

    /**
     * Get highest bid amount for a product
     */
    @Query("SELECT COALESCE(MAX(amount), 0) FROM bids WHERE product_id = :productId")
    Mono<Double> getHighestBidAmount(Integer productId);

    /**
     * Get highest bidder id for a product
     */
    @Query("SELECT bidder_id FROM bids WHERE product_id = :productId " +
           "ORDER BY amount DESC, created_at DESC LIMIT 1")
    Mono<Integer> getHighestBidderId(Integer productId);

    /**
     * Update product description
     */
    @Query("UPDATE products SET description = :description, updated_at = CURRENT_TIMESTAMP " +
           "WHERE id = :productId AND seller_id = :sellerId")
    Mono<Integer> updateProductDescription(Integer productId, Integer sellerId, String description);

    // ============================================================================
    // LISTINGS MANAGEMENT QUERIES
    // ============================================================================

    /**
     * Get all listings with filter (active, expired, all)
     */
    @Query("SELECT * FROM products WHERE seller_id = :sellerId " +
           "AND (:filter = 'all' OR " +
           "     (:filter = 'active' AND status = 'active') OR " +
           "     (:filter = 'expired' AND status = 'ended')) " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Product> findListingsBySellerIdWithFilter(Integer sellerId, String filter, Integer limit, Integer offset);

    /**
     * Count listings with filter
     */
    @Query("SELECT COUNT(*) FROM products WHERE seller_id = :sellerId " +
           "AND (:filter = 'all' OR " +
           "     (:filter = 'active' AND status = 'active') OR " +
           "     (:filter = 'expired' AND status = 'ended'))")
    Mono<Long> countListingsBySellerIdWithFilter(Integer sellerId, String filter);

    /**
     * Get product by id for seller (verify ownership)
     */
    @Query("SELECT * FROM products WHERE id = :productId AND seller_id = :sellerId")
    Mono<Product> getProductForSeller(Integer productId, Integer sellerId);

    // ============================================================================
    // STATISTICS QUERIES
    // ============================================================================

    /**
     * Count total products by seller
     */
    @Query("SELECT COUNT(*) FROM products WHERE seller_id = :sellerId")
    Mono<Long> countTotalProductsBySellerId(Integer sellerId);

    /**
     * Count products by status and seller
     */
    @Query("SELECT COUNT(*) FROM products WHERE seller_id = :sellerId AND status = :status")
    Mono<Long> countProductsBySellerIdAndStatus(Integer sellerId, String status);

    /**
     * Get total views for seller's products
     */
    @Query("SELECT COALESCE(SUM(views_count), 0) FROM products WHERE seller_id = :sellerId")
    Mono<Long> getTotalViewsBySellerId(Integer sellerId);

    /**
     * Get total bids for seller's products
     */
    @Query("SELECT COALESCE(SUM(bids_count), 0) FROM products WHERE seller_id = :sellerId")
    Mono<Long> getTotalBidsBySellerId(Integer sellerId);

    // ============================================================================
    // PRODUCT IMAGES QUERIES
    // ============================================================================

    /**
     * Insert product image
     */
    @Query("INSERT INTO product_images (product_id, url, is_primary, created_at) " +
           "VALUES (:productId, :url, :isPrimary, CURRENT_TIMESTAMP)")
    Mono<Integer> insertProductImage(Integer productId, String url, Boolean isPrimary);

    // ============================================================================
    // BIDDER MANAGEMENT QUERIES
    // ============================================================================

    /**
     * Ban a bidder from a specific product
     */
    @Query("INSERT INTO product_bans (product_id, user_id, reason, created_at) " +
           "VALUES (:productId, :userId, :reason, CURRENT_TIMESTAMP)")
    Mono<Integer> insertProductBan(Integer productId, Integer userId, String reason);

    /**
     * Check if a bidder is already banned from a product
     */
    @Query("SELECT COUNT(*) FROM product_bans WHERE product_id = :productId AND user_id = :userId")
    Mono<Long> countProductBan(Integer productId, Integer userId);
}
