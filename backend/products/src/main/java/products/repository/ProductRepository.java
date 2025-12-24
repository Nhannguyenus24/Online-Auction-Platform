package products.repository;

import com.auction.entities.database.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.util.Map;

@Repository
public interface ProductRepository extends R2dbcRepository<Product, Integer>{
    
    // Find product by id
    Mono<Product> findById(Integer id);
    
    // Find products by seller_id
    Flux<Product> findBySellerId(Integer sellerId);
    
    // Find products by category_id
    Flux<Product> findByCategoryId(Integer categoryId);
    
    // Find products by status
    Flux<Product> findByStatus(String status);
    
    // Update product status by id
    @Query("UPDATE products SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :productId")
    Mono<Void> updateStatus(@Param("productId") Integer productId, @Param("status") String status);
    
    // Get product status by id
    @Query("SELECT status FROM products WHERE id = :productId")
    Mono<String> getStatusById(@Param("productId") Integer productId);
    
    // Get product info with seller name and category name for admin
    @Query("""
        SELECT p.id, p.title, p.seller_id, u.full_name as seller_name, 
               p.category_id, c.name as category_name, p.starting_price, 
               p.current_price, p.status, p.starts_at, p.ends_at, 
               p.views_count, p.bids_count, p.created_at
        FROM products p
        LEFT JOIN users u ON p.seller_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = :productId
        """)
    Mono<Map> getProductInfo(@Param("productId") Integer productId);
    
    // Get all banned products with pagination
    @Query("""
        SELECT pb.id as ban_id, pb.product_id, p.title as product_title, 
               p.seller_id, u.full_name as seller_name, pb.user_id as admin_id, 
               a.full_name as admin_name, pb.reason, pb.created_at
        FROM product_bans pb
        LEFT JOIN products p ON pb.product_id = p.id
        LEFT JOIN users u ON p.seller_id = u.id
        LEFT JOIN users a ON pb.user_id = a.id
        ORDER BY pb.created_at DESC
        LIMIT :pageSize OFFSET :offset
        """)
    Flux<Map> getBannedProducts(@Param("pageSize") int pageSize, @Param("offset") int offset);
    
    // Count total banned products
    @Query("SELECT COUNT(*) FROM product_bans")
    Mono<Integer> countBannedProducts();
    
    // Check if product is banned
    @Query("SELECT COUNT(*) > 0 FROM product_bans WHERE product_id = :productId")
    Mono<Boolean> isBanned(@Param("productId") Integer productId);
    
    // Delete product ban record
    @Query("DELETE FROM product_bans WHERE product_id = :productId")
    Mono<Void> deleteBan(@Param("productId") Integer productId);
    
        
    // Ban a product
    @Query("""
        INSERT INTO product_bans (product_id, user_id, reason, created_at)
        VALUES (:productId, :adminId, :reason, CURRENT_TIMESTAMP)
        """)
    Mono<Void> banProduct(
        @Param("productId") Integer productId,
        @Param("adminId") Integer adminId,
        @Param("reason") String reason);

    // Find products by multiple statuses
    @Query("SELECT * FROM products WHERE status IN (:statuses)")
    Flux<Product> findByStatusIn(@Param("statuses") String... statuses);
    
    // ==================== Guest Service Methods ====================
    
    // Get top products ending soon (ordered by end time ascending)
    @Query("""
        SELECT p.id, p.seller_id, p.category_id, c.name as category_name, 
               p.title, p.description, p.starting_price, p.current_price, 
               p.step_price, p.buy_now_price, p.starts_at, p.ends_at, 
               p.is_auto_extend, p.auto_extend_seconds, p.status, p.views_count, 
               p.bids_count, p.created_at, p.updated_at, u.full_name as seller_name,
               u.rating_percent as seller_rating_percent, u.positive_reviews as seller_positive_reviews
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE p.status = 'active' AND p.ends_at > CURRENT_TIMESTAMP
        ORDER BY p.ends_at ASC
        LIMIT :limit
        """)
    Flux<Map> getTopEndingProducts(@Param("limit") int limit);
    
    // Get top products with most bids
    @Query("""
        SELECT p.id, p.seller_id, p.category_id, c.name as category_name, 
               p.title, p.description, p.starting_price, p.current_price, 
               p.step_price, p.buy_now_price, p.starts_at, p.ends_at, 
               p.is_auto_extend, p.auto_extend_seconds, p.status, p.views_count, 
               p.bids_count, p.created_at, p.updated_at, u.full_name as seller_name,
               u.rating_percent as seller_rating_percent, u.positive_reviews as seller_positive_reviews
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE p.status = 'active'
        ORDER BY p.bids_count DESC
        LIMIT :limit
        """)
    Flux<Map> getTopBidCountProducts(@Param("limit") int limit);
    
    // Get top products with highest price
    @Query("""
        SELECT p.id, p.seller_id, p.category_id, c.name as category_name, 
               p.title, p.description, p.starting_price, p.current_price, 
               p.step_price, p.buy_now_price, p.starts_at, p.ends_at, 
               p.is_auto_extend, p.auto_extend_seconds, p.status, p.views_count, 
               p.bids_count, p.created_at, p.updated_at, u.full_name as seller_name,
               u.rating_percent as seller_rating_percent, u.positive_reviews as seller_positive_reviews
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE p.status = 'active'
        ORDER BY p.current_price DESC
        LIMIT :limit
        """)
    Flux<Map> getTopPriceProducts(@Param("limit") int limit);
    
    // List products by category with filters
    @Query("""
        SELECT p.id, p.seller_id, p.category_id, c.name as category_name, 
               p.title, p.description, p.starting_price, p.current_price, 
               p.step_price, p.buy_now_price, p.starts_at, p.ends_at, 
               p.is_auto_extend, p.auto_extend_seconds, p.status, p.views_count, 
               p.bids_count, p.created_at, p.updated_at, u.full_name as seller_name,
               u.rating_percent as seller_rating_percent, u.positive_reviews as seller_positive_reviews
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE p.category_id = :categoryId 
              AND p.status = COALESCE(:status, 'active')
              AND p.current_price >= COALESCE(:minPrice, 0)
              AND p.current_price <= COALESCE(:maxPrice, 9999999)
              AND (COALESCE(:searchKeyword, '') = '' OR MATCH(p.title) AGAINST(:searchKeyword IN BOOLEAN MODE))
        """)
    Flux<Map> listProductsByCategory(
        @Param("categoryId") Integer categoryId,
        @Param("status") String status,
        @Param("minPrice") Double minPrice,
        @Param("maxPrice") Double maxPrice,
        @Param("searchKeyword") String searchKeyword);
    
    // Count products by category with filters
    @Query("""
        SELECT COUNT(*) FROM products p
        WHERE p.category_id = :categoryId 
              AND p.status = COALESCE(:status, 'active')
              AND p.current_price >= COALESCE(:minPrice, 0)
              AND p.current_price <= COALESCE(:maxPrice, 9999999)
              AND (COALESCE(:searchKeyword, '') = '' OR MATCH(p.title) AGAINST(:searchKeyword IN BOOLEAN MODE))
        """)
    Mono<Integer> countProductsByCategory(
        @Param("categoryId") Integer categoryId,
        @Param("status") String status,
        @Param("minPrice") Double minPrice,
        @Param("maxPrice") Double maxPrice,
        @Param("searchKeyword") String searchKeyword);
    
    // Get product images by product id
    @Query("SELECT id, product_id, url, is_primary, created_at FROM product_images WHERE product_id = :productId ORDER BY is_primary DESC")
    Flux<Map> getProductImages(@Param("productId") Integer productId);
    
    // Get highest bidder info (masked) for a product
    @Query("""
        SELECT SUBSTRING(bidder_email, 1, LOCATE('@', bidder_email) - 1) as masked_email,
               MAX(amount) as highest_bid
        FROM (SELECT u.email as bidder_email, b.amount FROM bids b
              LEFT JOIN users u ON b.bidder_id = u.id
              WHERE b.product_id = :productId
              ORDER BY b.amount DESC LIMIT 1) as highest
        GROUP BY bidder_email
        """)
    Mono<Map> getHighestBidderMasked(@Param("productId") Integer productId);
    
    // Append text to product description
    @Query("UPDATE products SET description = CONCAT(COALESCE(description, ''), :appendText), updated_at = CURRENT_TIMESTAMP WHERE id = :productId")
    Mono<Void> appendProductDescription(@Param("productId") Integer productId, @Param("appendText") String appendText);
    
    // ==================== Pagination Methods ====================
    
    // Find all products with pagination
    @Query("SELECT * FROM products ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Product> findAllWithPagination(@Param("limit") int limit, @Param("offset") int offset);
    
    // Find products by seller with pagination
    @Query("SELECT * FROM products WHERE seller_id = :sellerId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Product> findBySellerIdWithPagination(@Param("sellerId") Integer sellerId, @Param("limit") int limit, @Param("offset") int offset);
    
    // Find products by category with pagination
    @Query("SELECT * FROM products WHERE category_id = :categoryId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Product> findByCategoryIdWithPagination(@Param("categoryId") Integer categoryId, @Param("limit") int limit, @Param("offset") int offset);
    
    // Find products by status with pagination
    @Query("SELECT * FROM products WHERE status = :status ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Product> findByStatusWithPagination(@Param("status") String status, @Param("limit") int limit, @Param("offset") int offset);
    
    // Count all products
    @Query("SELECT COUNT(*) FROM products")
    Mono<Integer> countAll();
    
    // Count products by seller
    @Query("SELECT COUNT(*) FROM products WHERE seller_id = :sellerId")
    Mono<Integer> countBySellerId(@Param("sellerId") Integer sellerId);
    
    // Count products by category
    @Query("SELECT COUNT(*) FROM products WHERE category_id = :categoryId")
    Mono<Integer> countByCategoryId(@Param("categoryId") Integer categoryId);
    
    // Count products by status
    @Query("SELECT COUNT(*) FROM products WHERE status = :status")
    Mono<Integer> countByStatus(@Param("status") String status);
    
    // ==================== List Products by Category (with filters and sorting) ====================
    
    // List products by category with full text search, filters, sorting, and pagination
    @Query("""
        SELECT p.id, p.seller_id, p.category_id, c.name as category_name, 
               p.title, p.description, p.starting_price, p.current_price, 
               p.step_price, p.buy_now_price, p.starts_at, p.ends_at, 
               p.is_auto_extend, p.auto_extend_seconds, p.status, p.views_count, 
               p.bids_count, p.created_at, p.updated_at, u.full_name as seller_name,
               u.rating_percent as seller_rating_percent, u.positive_reviews as seller_positive_reviews
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE p.category_id = :categoryId 
              AND (COALESCE(:status, '') = '' OR p.status = :status)
              AND p.current_price >= COALESCE(:minPrice, 0)
              AND p.current_price <= COALESCE(:maxPrice, 999999999)
              AND (COALESCE(:searchKeyword, '') = '' OR MATCH(p.title, p.description) AGAINST(:searchKeyword IN BOOLEAN MODE))
        ORDER BY 
            CASE WHEN :sortOrder = 'ENDING_SOON_DESC' THEN p.ends_at END ASC,
            CASE WHEN :sortOrder = 'ENDING_SOON_ASC' THEN p.ends_at END DESC,
            CASE WHEN :sortOrder = 'PRICE_ASC' THEN p.current_price END ASC,
            CASE WHEN :sortOrder = 'PRICE_DESC' THEN p.current_price END DESC,
            CASE WHEN :sortOrder = 'NEWEST_FIRST' THEN p.created_at END DESC,
            CASE WHEN :sortOrder = 'OLDEST_FIRST' THEN p.created_at END ASC,
            CASE WHEN :sortOrder = 'MOST_BIDS' THEN p.bids_count END DESC,
            CASE WHEN :sortOrder = 'MOST_VIEWS' THEN p.views_count END DESC
        LIMIT :limit OFFSET :offset
        """)
    Flux<Map> listProductsByCategoryAdvanced(
        @Param("categoryId") Integer categoryId,
        @Param("searchKeyword") String searchKeyword,
        @Param("minPrice") Double minPrice,
        @Param("maxPrice") Double maxPrice,
        @Param("status") String status,
        @Param("sortOrder") String sortOrder,
        @Param("limit") int limit,
        @Param("offset") int offset);
    
}
