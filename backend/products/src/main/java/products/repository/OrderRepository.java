package products.repository;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.auction.entities.database.Order;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface OrderRepository extends R2dbcRepository<Order, Integer> {

    @Query("""
        INSERT INTO orders (product_id, buyer_id, seller_id, amount, status, created_at, updated_at)
        VALUES (:productId, :buyerId, :sellerId, :amount, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """)
    Mono<Void> createOrder(
        @Param("productId") Integer productId,
        @Param("buyerId") Integer buyerId,
        @Param("sellerId") Integer sellerId,
        @Param("amount") Double amount
    );

    /**
     * Find orders by seller ID with pagination and status filter
     * @param sellerId the seller ID
     * @param statusFilter the status filter (pending, completed, cancelled, all)
     * @param limit the page size
     * @param offset the offset
     * @return list of orders
     */
    @Query("""
        SELECT * FROM orders
        WHERE seller_id = :sellerId
          AND (:statusFilter = 'all' OR status = :statusFilter)
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
        """)
    Flux<Order> findOrdersBySellerId(
        @Param("sellerId") Integer sellerId,
        @Param("statusFilter") String statusFilter,
        @Param("limit") int limit,
        @Param("offset") int offset
    );
    
    /**
     * Count orders by seller ID with status filter
     * @param sellerId the seller ID
     * @param statusFilter the status filter (pending, completed, cancelled, all)
     * @return the count
     */
    @Query("""
        SELECT COUNT(*) FROM orders
        WHERE seller_id = :sellerId
          AND (:statusFilter = 'all' OR status = :statusFilter)
        """)
    Mono<Integer> countOrdersBySellerId(
        @Param("sellerId") Integer sellerId,
        @Param("statusFilter") String statusFilter
    );
    
    /**
     * Update order status by order ID
     * @param orderId the order ID
     * @param status the new status
     * @return void
     */
    @Query("""
        UPDATE orders
        SET status = :status, updated_at = CURRENT_TIMESTAMP
        WHERE id = :orderId
        """)
    Mono<Void> updateOrderStatus(
        @Param("orderId") Integer orderId,
        @Param("status") String status
    );
    
    /**
     * Find order by ID
     * @param orderId the order ID
     * @return the order
     */
    Mono<Order> findById(Integer orderId);
    
    /**
     * Find order ID by product ID, buyer ID and seller ID
     * @param productId the product ID
     * @param buyerId the buyer ID
     * @param sellerId the seller ID
     * @return the order ID
     */
    @Query("""
        SELECT id FROM orders
        WHERE product_id = :productId
          AND buyer_id = :buyerId
          AND seller_id = :sellerId
        ORDER BY created_at DESC
        LIMIT 1
        """)
    Mono<Integer> findOrderIdByProductAndUsers(
        @Param("productId") Integer productId,
        @Param("buyerId") Integer buyerId,
        @Param("sellerId") Integer sellerId
    );
    
    /**
     * Create conversation for order
     * @param orderId the order ID
     * @param sellerId the seller ID
     * @param sellerName the seller name
     * @param bidderId the bidder ID
     * @param bidderName the bidder name
     * @param productTitle the product title
     * @param productImage the product image
     * @param amount the order amount
     * @return void
     */
    @Query("""
        INSERT INTO conversations (
            order_id, seller_id, seller_name,
            bidder_id, bidder_name,
            product_title, product_image, status, amount,
            created_at, updated_at
        ) VALUES (
            :orderId, :sellerId, :sellerName,
            :bidderId, :bidderName,
            :productTitle, :productImage, 'pending_payment', :amount,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON DUPLICATE KEY UPDATE
            updated_at = CURRENT_TIMESTAMP
        """)
    Mono<Void> createConversation(
        @Param("orderId") String orderId,
        @Param("sellerId") String sellerId,
        @Param("sellerName") String sellerName,
        @Param("bidderId") String bidderId,
        @Param("bidderName") String bidderName,
        @Param("productTitle") String productTitle,
        @Param("productImage") String productImage,
        @Param("amount") Double amount
    );
}
