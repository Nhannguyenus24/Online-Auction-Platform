package products.repository;

import java.util.Map;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.Product;

import products.dto.BidHistoryRowDto;
import products.dto.BidRowDto;
import products.dto.ImageRowDto;
import products.dto.ProductDetailsDto;
import products.dto.ProductRowDto;
import products.dto.QuestionRowDto;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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
    Mono<Map<String, Object>> getProductInfo(@Param("productId") Integer productId);

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
    Flux<ProductRowDto> getTopEndingProducts(@Param("limit") int limit);
    
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
        LEFT JOIN product_images i ON p.id = i.product_id
        WHERE p.status = 'active'
        ORDER BY p.bids_count DESC
        LIMIT :limit
        """)
    Flux<ProductRowDto> getTopBidCountProducts(@Param("limit") int limit);
    
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
    Flux<ProductRowDto> getTopPriceProducts(@Param("limit") int limit);
    
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
    Flux<Map<String, Object>> listProductsByCategory(
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
    Flux<ImageRowDto> getProductImages(@Param("productId") Integer productId);
    
    // List products by name with full text search, filters, sorting, and pagination
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
        WHERE (COALESCE(:status, '') = '' OR p.status = :status)
              AND p.current_price >= COALESCE(:minPrice, 0)
              AND p.current_price <= COALESCE(:maxPrice, 999999999)
              AND (COALESCE(:searchKeyword, '') = '' OR MATCH(p.title) AGAINST(:searchKeyword IN BOOLEAN MODE))
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
    Flux<ProductRowDto> listProductsByNameAdvanced(
        @Param("searchKeyword") String searchKeyword,
        @Param("minPrice") Double minPrice,
        @Param("maxPrice") Double maxPrice,
        @Param("status") String status,
        @Param("sortOrder") String sortOrder,
        @Param("limit") int limit,
        @Param("offset") int offset);
    
    // Count products by name with filters
    @Query("""
        SELECT COUNT(*) FROM products p
        WHERE (COALESCE(:status, '') = '' OR p.status = :status)
              AND p.current_price >= COALESCE(:minPrice, 0)
              AND p.current_price <= COALESCE(:maxPrice, 999999999)
              AND (COALESCE(:searchKeyword, '') = '' OR MATCH(p.title) AGAINST(:searchKeyword IN BOOLEAN MODE))
        """)
    Mono<Integer> countProductsByName(
        @Param("searchKeyword") String searchKeyword,
        @Param("minPrice") Double minPrice,
        @Param("maxPrice") Double maxPrice,
        @Param("status") String status);
    
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
    Mono<Map<String, Object>> getHighestBidderMasked(@Param("productId") Integer productId);
    
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
              AND (COALESCE(:searchKeyword, '') = '' OR MATCH(p.title) AGAINST(:searchKeyword IN BOOLEAN MODE))
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
    Flux<ProductRowDto> listProductsByCategoryAdvanced(
        @Param("categoryId") Integer categoryId,
        @Param("searchKeyword") String searchKeyword,
        @Param("minPrice") Double minPrice,
        @Param("maxPrice") Double maxPrice,
        @Param("status") String status,
        @Param("sortOrder") String sortOrder,
        @Param("limit") int limit,
        @Param("offset") int offset);
    
    // ==================== Bidder Service Methods ====================
    
    // Get product details with seller info, images, and user-specific data
    @Query("""
        SELECT p.id, p.seller_id, p.category_id, c.name as category_name, 
               p.title, p.description, p.starting_price, p.current_price, 
               p.step_price, p.buy_now_price, p.starts_at, p.ends_at, 
               p.is_auto_extend, p.auto_extend_seconds, p.status, p.views_count, 
               p.bids_count, p.created_at, p.updated_at, 
               u.id as seller_id, u.full_name as seller_name, u.email as seller_email,
               u.rating_percent as seller_rating_percent, u.positive_reviews as seller_positive_reviews,
               u.negative_reviews as seller_negative_reviews
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE p.id = :productId
        """)
    Mono<ProductDetailsDto> getProductDetailsForBidder(@Param("productId") Integer productId);
    
    // Get related products in same category
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
        WHERE p.category_id = :categoryId AND p.id != :productId AND p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT :limit
        """)
    Flux<ProductRowDto> getRelatedProducts(@Param("categoryId") Integer categoryId, @Param("productId") Integer productId, @Param("limit") int limit);
    
    // Get user's watchlist with pagination
    @Query("""
            SELECT p.id, p.seller_id, p.category_id, c.name as category_name,
               p.title, p.description, p.starting_price, p.current_price,
               p.step_price, p.buy_now_price, p.starts_at, p.ends_at,
               p.is_auto_extend, p.auto_extend_seconds, p.status, p.views_count,
               p.bids_count, p.created_at, p.updated_at, u.full_name as seller_name,
               u.rating_percent as seller_rating_percent, u.positive_reviews as seller_positive_reviews
        FROM watchlists w
        LEFT JOIN products p ON w.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.seller_id = u.id
        WHERE w.user_id = :userId AND (COALESCE(:status, '') = '' OR p.status = :status)
        ORDER BY w.created_at DESC
        LIMIT :limit OFFSET :offset
        """)
    Flux<ProductRowDto> getWatchlist(@Param("userId") Integer userId, @Param("status") String status, @Param("limit") int limit, @Param("offset") int offset);
    
    // Count watchlist items
    @Query("""
        SELECT COUNT(*) FROM watchlists w
        LEFT JOIN products p ON w.product_id = p.id
        WHERE w.user_id = :userId AND (COALESCE(:status, '') = '' OR p.status = :status)
        """)
    Mono<Integer> countWatchlist(@Param("userId") Integer userId, @Param("status") String status);
    
    // Check if product in watchlist
    @Query("SELECT COUNT(*) FROM watchlists WHERE user_id = :userId AND product_id = :productId")
    Mono<Long> isInWatchlist(@Param("userId") Integer userId, @Param("productId") Integer productId);
    
    // Add product to watchlist
    @Query("INSERT INTO watchlists (user_id, product_id, created_at) VALUES (:userId, :productId, CURRENT_TIMESTAMP)")
    Mono<Void> addToWatchlist(@Param("userId") Integer userId, @Param("productId") Integer productId);
    
    // Remove product from watchlist
    @Query("DELETE FROM watchlists WHERE user_id = :userId AND product_id = :productId")
    Mono<Void> removeFromWatchlist(@Param("userId") Integer userId, @Param("productId") Integer productId);
    
    // Get product bids with pagination
    @Query("""
        SELECT b.id, b.product_id, b.bidder_id, 
               CONCAT(SUBSTRING(u.email, 1, 3), '***@', SUBSTRING(u.email, LOCATE('@', u.email) + 1)) as bidder_name_masked,
               b.amount, b.is_auto, b.created_at
        FROM bids b
        LEFT JOIN users u ON b.bidder_id = u.id
        WHERE b.product_id = :productId
        ORDER BY b.amount DESC
        LIMIT :limit OFFSET :offset
        """)
    Flux<BidRowDto> getProductBids(@Param("productId") Integer productId, @Param("limit") int limit, @Param("offset") int offset);
    
    // Count product bids
    @Query("SELECT COUNT(*) FROM bids WHERE product_id = :productId")
    Mono<Integer> countProductBids(@Param("productId") Integer productId);
    
    // Get product questions with pagination
    @Query("""
        SELECT q.id, q.product_id, q.asker_id, u.full_name as asker_name,
               q.question, q.answer, q.answered_by, u2.full_name as answerer_name,
               q.created_at, q.answered_at
        FROM questions q
        LEFT JOIN users u ON q.asker_id = u.id
        LEFT JOIN users u2 ON q.answered_by = u2.id
        WHERE q.product_id = :productId
        ORDER BY q.created_at DESC
        LIMIT :limit OFFSET :offset
        """)
    Flux<QuestionRowDto> getProductQuestions(@Param("productId") Integer productId, @Param("limit") int limit, @Param("offset") int offset);
    
    // Count product questions
    @Query("SELECT COUNT(*) FROM questions WHERE product_id = :productId")
    Mono<Integer> countProductQuestions(@Param("productId") Integer productId);
    
    // Insert a new question
    @Query("INSERT INTO questions (product_id, asker_id, question, created_at) VALUES (:productId, :askerId, :question, CURRENT_TIMESTAMP)")
    Mono<Void> insertQuestion(@Param("productId") Integer productId, @Param("askerId") Integer askerId, @Param("question") String question);
    
    // Update question with answer
    @Query("UPDATE questions SET answer = :answer, answered_by = :answeredBy, answered_at = CURRENT_TIMESTAMP WHERE id = :questionId")
    Mono<Void> updateQuestionAnswer(@Param("questionId") Integer questionId, @Param("answer") String answer, @Param("answeredBy") Integer answeredBy);
    
    // Insert a new bid
    @Query("INSERT INTO bids (product_id, bidder_id, amount, is_auto, created_at) VALUES (:productId, :bidderId, :amount, :isAuto, CURRENT_TIMESTAMP)")
    Mono<Void> insertBid(@Param("productId") Integer productId, @Param("bidderId") Integer bidderId, @Param("amount") Double amount, @Param("isAuto") Boolean isAuto);
    
    // Update product current price and bid count
    @Query("UPDATE products SET current_price = :currentPrice, bids_count = bids_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = :productId")
    Mono<Void> updateProductPrice(@Param("productId") Integer productId, @Param("currentPrice") Double currentPrice);
    
    // Update product end time (for auto-extend)
    @Query("UPDATE products SET ends_at = :endsAt, updated_at = CURRENT_TIMESTAMP WHERE id = :productId")
    Mono<Void> updateProductEndTime(@Param("productId") Integer productId, @Param("endsAt") java.time.LocalDateTime endsAt);
    
    // Insert or update auto bid
    @Query("INSERT INTO auto_bids (product_id, bidder_id, max_amount, created_at) VALUES (:productId, :bidderId, :maxAmount, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE max_amount = :maxAmount")
    Mono<Void> upsertAutoBid(@Param("productId") Integer productId, @Param("bidderId") Integer bidderId, @Param("maxAmount") Double maxAmount);
    
    // Get banned user IDs for a product
    @Query("SELECT user_id FROM product_bans WHERE product_id = :productId")
    Flux<Integer> getBannedUserIds(@Param("productId") Integer productId);
    
    // Get user's bids with pagination
    @Query("""
        SELECT b.id as bid_id, b.product_id, p.title as product_title,
               pi.url as product_primary_image, b.amount as bid_amount, p.current_price, p.status as product_status,
               CAST(b.is_auto AS UNSIGNED) as is_auto, 
               IF(b.amount = (SELECT MAX(amount) FROM bids WHERE product_id = p.id), 1, 0) as is_winning,
               p.status, b.created_at as bid_created_at, p.ends_at as product_ends_at
        FROM bids b
        LEFT JOIN products p ON b.product_id = p.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
        WHERE b.bidder_id = :userId
        ORDER BY b.created_at DESC
        LIMIT :limit OFFSET :offset
        """)
    Flux<BidHistoryRowDto> getMyBids(@Param("userId") Integer userId, @Param("limit") int limit, @Param("offset") int offset);
    
    // Count user's bids
    @Query("SELECT COUNT(*) FROM bids WHERE bidder_id = :userId")
    Mono<Integer> countMyBids(@Param("userId") Integer userId);
    
    // Check if user is highest bidder
    @Query("""
        SELECT COUNT(*) FROM bids 
        WHERE product_id = :productId AND bidder_id = :userId 
        AND amount = (SELECT MAX(amount) FROM bids WHERE product_id = :productId)
        """)
    Mono<Long> isHighestBidder(@Param("productId") Integer productId, @Param("userId") Integer userId);
    
    // Get user's auto bid for a product
    @Query("""
        SELECT id, product_id, bidder_id, max_amount, created_at 
        FROM auto_bids 
        WHERE product_id = :productId AND bidder_id = :userId
        """)
    Mono<Map<String, Object>> getUserAutoBid(@Param("productId") Integer productId, @Param("userId") Integer userId);
    
    // Get user full name by user ID
    @Query("SELECT full_name FROM users WHERE id = :userId")
    Mono<String> getUserFullName(@Param("userId") Integer userId);
}
